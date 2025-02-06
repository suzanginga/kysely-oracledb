import { DatabaseConnection, Driver } from "kysely";
import { Connection, Pool } from "oracledb";
import { OracleConnection } from "./connection";
import { OracleDialectConfig } from "./dialect";
import { defaultLogger, Logger } from "./logger";

export class OracleDriver implements Driver {
    readonly #config: OracleDialectConfig;
    readonly #connections = new Map<string, OracleConnection>();
    readonly #log: Logger;
    #pool?: Pool;

    constructor(config: OracleDialectConfig) {
        this.#config = config;
        this.#log = config.logger ? config.logger : defaultLogger;
    }

    async init(): Promise<void> {
        this.#pool =
            typeof this.#config.pool === "function" ? await this.#config.pool({ alias: "kysely" }) : this.#config.pool;
    }

    async acquireConnection(): Promise<DatabaseConnection> {
        this.#log.trace("Acquiring connection");
        const connection = new OracleConnection((await this.#pool?.getConnection()) as Connection, this.#log);
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
        this.#log.trace("Releasing connection");
        try {
            await this.#connections.get(connection.identifier)?.connection.close();
            this.#connections.delete(connection.identifier);
        } catch (err) {
            this.#log.error({ err }, "Error closing connection");
        }
    }

    async destroy(): Promise<void> {
        for (const connection of this.#connections.values()) {
            await this.releaseConnection(connection as OracleConnection);
        }
        await this.#pool?.close();
    }
}
