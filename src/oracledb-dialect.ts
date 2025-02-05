import type {
    AliasNode,
    DatabaseIntrospector,
    DatabaseMetadata,
    DatabaseMetadataOptions,
    DialectAdapter,
    Kysely,
    SchemaMetadata,
    Selectable,
    TableMetadata,
} from "kysely";
import {
    DefaultQueryCompiler,
    DialectAdapterBase,
    type CompiledQuery,
    type DatabaseConnection,
    type Dialect,
    type Driver,
    type QueryResult,
} from "kysely";
import type { Connection, Pool } from "oracledb";
import oracledb from "oracledb";
import { v4 as uuid } from "uuid";

interface PoolOptions {
    alias?: string;
}

interface AllUsersTable {
    username: string;
}

interface AllTablesTable {
    owner: string;
    tableName: string;
}

interface AllTabColumnsTable {
    owner: string;
    tableName: string;
    columnName: string;
    dataType: string;
    nullable: string;
    dataDefault: string | null;
}

interface DB {
    allUsers: Selectable<AllUsersTable>;
    allTables: Selectable<AllTablesTable>;
    allTabColumns: Selectable<AllTabColumnsTable>;
}

interface OracleDialectConfig {
    pool: Pool | ((opts?: PoolOptions) => Promise<Pool>);
    schemas?: string[];
    tables?: string[];
}

class OracleQueryCompiler extends DefaultQueryCompiler {
    protected override getLeftIdentifierWrapper(): string {
        return "";
    }

    protected override getRightIdentifierWrapper(): string {
        return "";
    }

    protected override visitAlias(node: AliasNode): void {
        this.visitNode(node.node);
        this.append(" ");
        this.visitNode(node.alias);
    }
}

class OracleIntrospector implements DatabaseIntrospector {
    readonly #db: Kysely<DB>;
    readonly #config?: OracleDialectConfig;

    constructor(db: Kysely<DB>, config?: OracleDialectConfig) {
        this.#db = db;
        this.#config = config;
    }

    async getSchemas(): Promise<SchemaMetadata[]> {
        const rawSchemas = await this.#db
            .selectFrom("allUsers")
            .select("username")
            .where((eb) =>
                eb.or([
                    eb(eb.val(this.#config?.schemas?.length ?? 0), "=", eb.val(0)),
                    eb("username", "in", this.#config?.schemas ?? [null]),
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
                    eb(eb.val(this.#config?.tables?.length ?? 0), "=", eb.val(0)),
                    eb("tableName", "in", this.#config?.tables ?? [null]),
                ]),
            )
            .fetch(999) // Oracle has a limit of 999 parameters for the IN clause
            .execute();
        rawTables.push(dualTable);
        const rawColumns = await this.#db
            .selectFrom("allTabColumns")
            .select(["owner", "tableName", "columnName", "dataType", "nullable", "dataDefault"])
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
                    isAutoIncrementing: false, // Oracle doesn't have auto incrementing columns
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

class OracleAdapter extends DialectAdapterBase {
    #supportsReturning = false;
    #supportsTransactionalDdl = false;

    override get supportsReturning(): boolean {
        return this.#supportsReturning;
    }

    override get supportsTransactionalDdl(): boolean {
        return this.#supportsTransactionalDdl;
    }

    async acquireMigrationLock(_: Kysely<DB>): Promise<void> {
        throw new Error("Not implemented");
    }

    async releaseMigrationLock(_: Kysely<DB>): Promise<void> {
        throw new Error("Not implemented");
    }
}

class OracleConnection implements DatabaseConnection {
    #connection: Connection;
    #identifier: string;

    constructor(connection: Connection) {
        this.#connection = connection;
        this.#identifier = uuid();
    }

    async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
        const { sql, bindParams } = this.formatQuery(compiledQuery);
        const startTime = new Date();
        // logger.debug({ sql: this.formatQueryForLogging(compiledQuery) }, "Executing query");
        const result = await this.#connection.execute<R>(sql, bindParams, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            fetchTypeHandler: (metaData) => {
                metaData.name = metaData.name.toLowerCase();
                return undefined;
            },
        });
        const endTime = new Date();
        // logger.trace({ durationMs: endTime.getTime() - startTime.getTime() }, "Execution complete");
        return { rows: result?.rows || [] };
    }

    formatQuery(query: CompiledQuery) {
        return {
            sql: query.sql.replace(/\$(\d+)/g, ":$1"), // format bind params in Oracle syntax :1, :2, etc.
            bindParams: query.parameters as unknown[],
        };
    }

    formatQueryForLogging(query: CompiledQuery) {
        return query.sql.replace(/\$(\d+)/g, (_match, p1) => {
            const index = parseInt(p1, 10);
            const param = query.parameters[index];
            return typeof param === "string" ? `'${param}'` : (param?.toString() ?? "null");
        });
    }

    streamQuery<R>(_compiledQuery: CompiledQuery): AsyncIterableIterator<QueryResult<R>> {
        throw new Error("Not implemented");
    }

    get identifier(): string {
        return this.#identifier;
    }

    get connection(): Connection {
        return this.#connection;
    }
}

class OracleDriver implements Driver {
    readonly #config: OracleDialectConfig;
    readonly #connections = new Map<string, OracleConnection>();
    #pool?: Pool;

    constructor(config: OracleDialectConfig) {
        this.#config = config;
    }

    async init(): Promise<void> {
        this.#pool =
            typeof this.#config.pool === "function" ? await this.#config.pool({ alias: "kysely" }) : this.#config.pool;
    }

    async acquireConnection(): Promise<DatabaseConnection> {
        // logger.trace("Acquiring connection");
        const connection = new OracleConnection((await this.#pool?.getConnection()) as Connection);
        this.#connections.set(connection.identifier, connection);
        return connection;
    }

    async beginTransaction(_connection: DatabaseConnection): Promise<void> {
        throw new Error("Not implemented");
    }

    async commitTransaction(_connection: DatabaseConnection): Promise<void> {
        throw new Error("Not implemented");
    }

    async rollbackTransaction(_connection: DatabaseConnection): Promise<void> {
        throw new Error("Not implemented");
    }

    async releaseConnection(connection: OracleConnection): Promise<void> {
        // logger.trace("Releasing connection");
        try {
            await this.#connections.get(connection.identifier)?.connection.close();
            this.#connections.delete(connection.identifier);
        } catch (err) {
            //   logger.error({ err }, "Error closing connection");
        }
    }

    async destroy(): Promise<void> {
        for (const connection of this.#connections.values()) {
            await this.releaseConnection(connection as OracleConnection);
        }
        await this.#pool?.close();
    }
}

export class OracleDialect implements Dialect {
    readonly #config: OracleDialectConfig;

    constructor(config: OracleDialectConfig) {
        this.#config = config;
    }

    createDriver(): Driver {
        return new OracleDriver(this.#config);
    }

    createAdapter(): DialectAdapter {
        return new OracleAdapter();
    }

    createIntrospector(db: Kysely<DB>): DatabaseIntrospector {
        return new OracleIntrospector(db, this.#config);
    }

    createQueryCompiler(): DefaultQueryCompiler {
        return new OracleQueryCompiler();
    }
}
