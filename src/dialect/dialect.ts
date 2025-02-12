import { DatabaseIntrospector, DefaultQueryCompiler, Dialect, DialectAdapter, Driver, Kysely } from "kysely";
import { ExecuteOptions, Pool } from "oracledb";
import { Options } from "prettier";
import { OracleAdapter } from "./adapter.js";
import { OracleDriver } from "./driver.js";
import { IntropsectorDB, OracleIntrospector } from "./introspector.js";
import { Logger } from "./logger.js";
import { OracleQueryCompiler } from "./query-compiler.js";

export interface OracleDialectConfig {
    pool: Pool;
    logger?: Logger;
    generator?: {
        schemas?: string[];
        tables?: string[];
        camelCase?: boolean;
        checkDiff?: boolean;
        filePath?: string;
        prettierOptions?: Options;
    };
    executeOptions?: ExecuteOptions;
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
