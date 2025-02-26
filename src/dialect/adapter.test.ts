import { Kysely } from "kysely";
import oracledb from "oracledb";
import { describe, expect, it } from "vitest";
import { OracleAdapter } from "./adapter";
import { OracleDialect } from "./dialect";
import { IntropsectorDB } from "./introspector";

describe("OracleAdapter", () => {
    it("should not support returning from inserts, updates, and deletes", () => {
        const adapter = new OracleAdapter();

        expect(adapter.supportsReturning).toBe(false);
    });
    it("should not support transactional ddl", () => {
        const adapter = new OracleAdapter();

        expect(adapter.supportsTransactionalDdl).toBe(false);
    });
    it("should throw an error for acquire migration lock as it is not implemented", async () => {
        const dialect = new OracleDialect({
            pool: await oracledb.createPool({
                user: process.env.DB_USER,
            }),
        });

        const db = new Kysely<IntropsectorDB>({ dialect });

        const adapter = dialect.createAdapter();

        await expect(adapter.acquireMigrationLock(db)).rejects.toThrow("Not implemented");
    });
    it("should throw an error for release migration lock as it is not implemented", async () => {
        const dialect = new OracleDialect({
            pool: await oracledb.createPool({
                user: process.env.DB_USER,
            }),
        });

        const db = new Kysely<IntropsectorDB>({ dialect });

        const adapter = dialect.createAdapter();

        await expect(adapter.releaseMigrationLock(db)).rejects.toThrow("Not implemented");
    });
});
