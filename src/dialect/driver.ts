import { DatabaseConnection, Driver } from "kysely";
import { Connection } from "oracledb";
import { OracleConnection } from "./connection.js";
import { OracleDialectConfig } from "./dialect.js";
import { defaultLogger, Logger } from "./logger.js";

export class OracleDriver implements Driver {
    readonly #config: OracleDialectConfig;
    readonly #connections = new Map<string, OracleConnection>();
    readonly #log: Logger;

    constructor(config: OracleDialectConfig) {
        this.#config = config;
        this.#log = config.logger ? config.logger : defaultLogger;
    }

    async init(): Promise<void> {}

    async acquireConnection(): Promise<DatabaseConnection> {
        this.#log.trace("Acquiring connection");
        const connection = new OracleConnection(
            (await this.#config.pool?.getConnection()) as Connection,
            this.#log,
            this.#config.executeOptions,
        );
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
        await this.#config.pool?.close();
    }
}
