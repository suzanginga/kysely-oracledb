import { DatabaseIntrospector, DefaultQueryCompiler, Dialect, DialectAdapter, Driver, Kysely } from "kysely";
import { Pool } from "oracledb";
import { OracleAdapter } from "./adapter";
import { OracleDriver } from "./driver";
import { IntropsectorDB, OracleIntrospector } from "./introspector";
import { Logger } from "./logger";
import { OracleQueryCompiler } from "./query-compiler";

export interface OracleDialectConfig {
    pool: Pool | ((opts?: any) => Promise<Pool>);
    schemas?: string[];
    tables?: string[];
    logger?: Logger;
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

    createIntrospector(db: Kysely<IntropsectorDB>): DatabaseIntrospector {
        return new OracleIntrospector(db, this.#config);
    }

    createQueryCompiler(): DefaultQueryCompiler {
        return new OracleQueryCompiler();
    }
}
