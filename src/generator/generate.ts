import fs from "fs";
import { CamelCasePlugin, ColumnMetadata, Kysely, TableMetadata } from "kysely";
import path from "path";
import { format } from "prettier";
import { fileURLToPath } from "url";
import { OracleDialect, OracleDialectConfig } from "../dialect/dialect";
import { IntropsectorDB } from "../dialect/introspector";
import { defaultLogger } from "../dialect/logger";
import { typeMap } from "./map";
import { camelCase, pascalCase } from "./utils";

interface TableTypes {
    table: string;
    tableTypeName: string;
    types: string;
}

const warningComment = `// This file was generated automatically. Please don't edit it manually!`;
const generationComment = `// Timestamp: ${new Date().toISOString()}`;
const kyselyImport = `import type { Insertable, Selectable, Updateable } from 'kysely'`;

const generateFieldTypes = (fields: ColumnMetadata[]): string => {
    const fieldStrings = fields.map((field) => {
        const type = typeMap[field.dataType];
        if (!type) {
            throw new Error(`Unsupported data type: ${field.dataType}`);
        }
        const types = [type];
        if (field.isNullable) {
            types.push("null");
        }
        return `${camelCase(field.name)}: ${types.join(" | ")}`;
    });
    return fieldStrings.join("\n");
};

const generateTableTypes = (tables: TableMetadata[], useCamelCase = false): TableTypes[] => {
    return tables.map((table) => {
        const originalTableName = useCamelCase ? camelCase(table.name) : table.name;
        const pascalCaseTable = pascalCase(table.name);
        return {
            table: originalTableName,
            tableTypeName: pascalCaseTable,
            types: `interface ${pascalCaseTable}Table {
                  ${generateFieldTypes(table.columns)}
              }
              export type ${pascalCaseTable} = Selectable<${pascalCaseTable}Table>
              export type New${pascalCaseTable} = Insertable<${pascalCaseTable}Table>
              export type ${pascalCaseTable}Update = Updateable<${pascalCaseTable}Table>\n`,
        };
    });
};

const generateDatabaseTypes = (tableTypes: TableTypes[]): string => {
    const tableTypesString = tableTypes.map(({ types }) => `${types}\n`).join("\n");
    const exportString = ["export interface DB {"];
    exportString.push(...tableTypes.map(({ table, tableTypeName }) => `${table}: ${tableTypeName}`), "}");
    const importString = `${warningComment}\n${generationComment}\n\n${kyselyImport}`;
    return `${importString}\n\n${tableTypesString}\n\n${exportString.join("\n")}`;
};

// TODO: allow user to pass in prettier options
const formatTypes = async (types: string): Promise<string> =>
    await format(types, {
        parser: "typescript",
        singleQuote: true,
        trailingComma: "all",
        endOfLine: "auto",
        tabWidth: 4,
        printWidth: 120,
        semi: true,
    });

const dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// TODO: allow user to specify output path
const writeToFile = (types: string) => {
    const outputPath = path.join(dirname, "types.ts");
    fs.writeFileSync(outputPath, types);
};

const readFromFile = () => {
    const inputPath = path.join(dirname, "types.ts");
    return fs.readFileSync(inputPath, "utf8");
};

const checkDiff = (existingContent: string, newContent: string) => {
    const existingLines = existingContent.split("\n").slice(2);
    const newLines = newContent.split("\n").slice(2);
    const diff = newLines.find((line, index) => line !== existingLines[index]);
    return !!diff || existingLines.length !== newLines.length;
};

export const generate = async (config: OracleDialectConfig) => {
    const log = config.logger ? config.logger : defaultLogger;
    try {
        const dialect = new OracleDialect(config);
        const db = new Kysely<IntropsectorDB>({ dialect, plugins: [new CamelCasePlugin()] });
        const introspector = dialect.createIntrospector(db);

        const tables = await introspector.getTables();

        const tableTypes = generateTableTypes(tables, config.generator?.camelCase);
        const databaseTypes = generateDatabaseTypes(tableTypes);

        const formattedTypes = await formatTypes(databaseTypes);

        if (config.generator?.checkDiff) {
            const existingTypes = readFromFile();
            const diff = checkDiff(existingTypes, formattedTypes);
            if (diff) {
                log.warn("Types have changed. Updating types file...");
                writeToFile(formattedTypes);
                await db.destroy();
                log.info("Types updated successfully");
            } else {
                log.info("Types have not changed");
            }
        } else {
            writeToFile(formattedTypes);
            log.info("Types updated successfully");
        }
    } catch (err) {
        log.error({ err }, "Error generating types");
    }
};
