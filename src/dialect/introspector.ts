import {
    DatabaseIntrospector,
    DatabaseMetadata,
    DatabaseMetadataOptions,
    Kysely,
    SchemaMetadata,
    Selectable,
    TableMetadata,
} from "kysely";
import { OracleDialectConfig } from "./dialect.js";

export interface AllUsersTable {
    username: string;
}

export interface AllTablesTable {
    owner: string;
    tableName: string;
}

export interface AllTabColumnsTable {
    owner: string;
    tableName: string;
    columnName: string;
    dataType: string;
    nullable: string;
    dataDefault: string | null;
    identityColumn: string;
}

export interface IntropsectorDB {
    allUsers: Selectable<AllUsersTable>;
    allTables: Selectable<AllTablesTable>;
    allTabColumns: Selectable<AllTabColumnsTable>;
}

export class OracleIntrospector implements DatabaseIntrospector {
    readonly #db: Kysely<IntropsectorDB>;
    readonly #config?: OracleDialectConfig;

    constructor(db: Kysely<IntropsectorDB>, config?: OracleDialectConfig) {
        this.#db = db;
        this.#config = config;
    }

    async getSchemas(): Promise<SchemaMetadata[]> {
        const rawSchemas = await this.#db
            .selectFrom("allUsers")
            .select("username")
            .where((eb) =>
                eb.or([
                    eb(eb.val(this.#config?.generator?.schemas?.length ?? 0), "=", eb.val(0)),
                    eb("username", "in", this.#config?.generator?.schemas ?? [null]),
                ]),
            )
            .fetch(999) // Oracle has a limit of 999 parameters for the IN clause
            .execute();
        return rawSchemas.map((schema) => ({ name: schema.username }));
    }

    async getTables(_options?: DatabaseMetadataOptions): Promise<TableMetadata[]> {
        const schemas = (await this.getSchemas()).map((it) => it.name);
        const dualTable = { owner: "SYS", tableName: "DUAL" };
        const rawTables = await this.#db
            .selectFrom("allTables")
            .select(["owner", "tableName"])
            .where("owner", "in", schemas)
            .where((eb) =>
                eb.or([
                    eb(eb.val(this.#config?.generator?.tables?.length ?? 0), "=", eb.val(0)),
                    eb("tableName", "in", this.#config?.generator?.tables ?? [null]),
                ]),
            )
            .fetch(999) // Oracle has a limit of 999 parameters for the IN clause
            .execute();
        const hasDualTable = rawTables.some(
            (table) => table.owner === dualTable.owner && table.tableName === dualTable.tableName,
        );
        if (!hasDualTable) {
            rawTables.push(dualTable);
        }
        const rawColumns = await this.#db
            .selectFrom("allTabColumns")
            .select(["owner", "tableName", "columnName", "dataType", "nullable", "dataDefault", "identityColumn"])
            .where("owner", "in", [...schemas, dualTable.owner])
            .where(
                "tableName",
                "in",
                rawTables.map((table) => table.tableName),
            )
            .execute();
        const tables = rawTables.map((table) => {
            const columns = rawColumns
                .filter((col) => col.owner === table.owner && col.tableName === table.tableName)
                .map((col) => ({
                    name: col.columnName,
                    dataType: col.dataType,
                    isNullable: col.nullable === "Y",
                    hasDefaultValue: col.dataDefault !== null,
                    isAutoIncrementing: col.identityColumn === "YES",
                }));
            return { schema: table.owner, name: table.tableName, isView: false, columns };
        });
        return tables;
    }

    async getMetadata(_options?: DatabaseMetadataOptions): Promise<DatabaseMetadata> {
        return {
            tables: await this.getTables(),
        };
    }
}
