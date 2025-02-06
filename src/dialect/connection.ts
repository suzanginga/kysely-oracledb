import { CompiledQuery, DatabaseConnection, QueryResult } from "kysely";
import oracledb, { Connection } from "oracledb";
import { v4 as uuid } from "uuid";
import { Logger } from "./logger";

export class OracleConnection implements DatabaseConnection {
    #connection: Connection;
    #identifier: string;
    #log: Logger;

    constructor(connection: Connection, logger: Logger) {
        this.#connection = connection;
        this.#log = logger;
        this.#identifier = uuid();
    }

    async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
        const { sql, bindParams } = this.formatQuery(compiledQuery);
        const startTime = new Date();
        this.#log.debug({ sql: this.formatQueryForLogging(compiledQuery) }, "Executing query");
        const result = await this.#connection.execute<R>(sql, bindParams, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            fetchTypeHandler: (metaData) => {
                metaData.name = metaData.name.toLowerCase();
                return undefined;
            },
        });
        const endTime = new Date();
        this.#log.trace({ durationMs: endTime.getTime() - startTime.getTime() }, "Execution complete");
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
