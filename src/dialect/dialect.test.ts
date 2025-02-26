import { Kysely } from "kysely";
import oracledb from "oracledb";
import { describe, expect, it } from "vitest";
import { OracleDialect } from "./dialect.js";
import { IntropsectorDB } from "./introspector.js";

describe("OracleDialect", () => {
    it("should create a new OracleDialect instance", async () => {
        const dialect = new OracleDialect({
            pool: await oracledb.createPool({
                user: process.env.DB_USER,
            }),
        });

        expect(dialect).toBeDefined();
    });
    it("should create a new OracleDriver instance", async () => {
        const dialect = new OracleDialect({
            pool: await oracledb.createPool({
                user: process.env.DB_USER,
            }),
        });

        const driver = dialect.createDriver();

        expect(driver).toBeDefined();
    });
    it("should create a new OracleAdapter instance", async () => {
        const dialect = new OracleDialect({
            pool: await oracledb.createPool({
                user: process.env.DB_USER,
            }),
        });

        const adapter = dialect.createAdapter();

        expect(adapter).toBeDefined();
    });
    it("should create a new OracleQueryCompiler instance", async () => {
        const dialect = new OracleDialect({
            pool: await oracledb.createPool({
                user: process.env.DB_USER,
            }),
        });

        const queryCompiler = dialect.createQueryCompiler();

        expect(queryCompiler).toBeDefined();
    });
    it("should create a new OracleIntrospector instance", async () => {
        const dialect = new OracleDialect({
            pool: await oracledb.createPool({
                user: process.env.DB_USER,
            }),
        });

        const db = new Kysely<IntropsectorDB>({ dialect });

        const intropsector = dialect.createIntrospector(db);

        expect(intropsector).toBeDefined();
    });
});
