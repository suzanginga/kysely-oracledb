import fs from "fs";
import oracledb from "oracledb";
import path from "path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    checkDiff,
    formatTypes,
    generate,
    generateDatabaseTypes,
    generateFieldTypes,
    generateTableTypes,
} from "./generate";

describe("generateFieldTypes", () => {
    it("should generate type string for single field", () => {
        expect(
            generateFieldTypes([
                {
                    name: "name",
                    dataType: "VARCHAR2",
                    isNullable: false,
                    hasDefaultValue: false,
                    isAutoIncrementing: false,
                },
            ]),
        ).toBe("name: string");
    });
    it("should generate type string for multiple fields", () => {
        expect(
            generateFieldTypes([
                {
                    name: "first_name",
                    dataType: "VARCHAR2",
                    isNullable: false,
                    hasDefaultValue: false,
                    isAutoIncrementing: false,
                },
                {
                    name: "last_name",
                    dataType: "VARCHAR2",
                    isNullable: false,
                    hasDefaultValue: false,
                    isAutoIncrementing: false,
                },
            ]),
        ).toBe("first_name: string\nlast_name: string");
    });
    it("should generate type string for nullable field", () => {
        expect(
            generateFieldTypes([
                {
                    name: "name",
                    dataType: "VARCHAR2",
                    isNullable: true,
                    hasDefaultValue: false,
                    isAutoIncrementing: false,
                },
            ]),
        ).toBe("name: string | null");
    });
    it("should generate type string for camel case field", () => {
        expect(
            generateFieldTypes(
                [
                    {
                        name: "first_name",
                        dataType: "VARCHAR2",
                        isNullable: false,
                        hasDefaultValue: false,
                        isAutoIncrementing: false,
                    },
                ],
                true,
            ),
        ).toBe("firstName: string");
    });
    it("should throw error for unsupported data type", () => {
        expect(() =>
            generateFieldTypes([
                {
                    name: "name",
                    dataType: "UNSUPPORTED",
                    isNullable: false,
                    hasDefaultValue: false,
                    isAutoIncrementing: false,
                },
            ]),
        ).toThrowError("Unsupported data type: UNSUPPORTED");
    });
});

describe("generate table types", () => {
    it("should generate table types for single table", () => {
        expect(
            generateTableTypes([
                {
                    name: "user",
                    isView: false,
                    columns: [
                        {
                            name: "id",
                            dataType: "NUMBER",
                            isNullable: false,
                            hasDefaultValue: false,
                            isAutoIncrementing: true,
                        },
                        {
                            name: "name",
                            dataType: "VARCHAR2",
                            isNullable: false,
                            hasDefaultValue: false,
                            isAutoIncrementing: false,
                        },
                    ],
                },
            ]),
        ).toEqual([
            {
                table: "user",
                tableTypeName: "User",
                types:
                    "interface UserTable {" +
                    "\n" +
                    "id: number" +
                    "\n" +
                    "name: string" +
                    "\n" +
                    "}" +
                    "\n" +
                    "export type User = Selectable<UserTable>" +
                    "\n" +
                    "export type NewUser = Insertable<UserTable>" +
                    "\n" +
                    "export type UserUpdate = Updateable<UserTable>",
            },
        ]);
    });
    it("should generate table types for multiple tables", () => {
        expect(
            generateTableTypes([
                {
                    name: "user",
                    isView: false,
                    columns: [
                        {
                            name: "id",
                            dataType: "NUMBER",
                            isNullable: false,
                            hasDefaultValue: false,
                            isAutoIncrementing: true,
                        },
                        {
                            name: "name",
                            dataType: "VARCHAR2",
                            isNullable: false,
                            hasDefaultValue: false,
                            isAutoIncrementing: false,
                        },
                    ],
                },
                {
                    name: "product",
                    isView: false,
                    columns: [
                        {
                            name: "id",
                            dataType: "NUMBER",
                            isNullable: false,
                            hasDefaultValue: false,
                            isAutoIncrementing: true,
                        },
                        {
                            name: "product",
                            dataType: "VARCHAR2",
                            isNullable: false,
                            hasDefaultValue: false,
                            isAutoIncrementing: false,
                        },
                        {
                            name: "price",
                            dataType: "NUMBER",
                            isNullable: true,
                            hasDefaultValue: false,
                            isAutoIncrementing: false,
                        },
                    ],
                },
            ]),
        ).toEqual([
            {
                table: "user",
                tableTypeName: "User",
                types:
                    "interface UserTable {" +
                    "\n" +
                    "id: number" +
                    "\n" +
                    "name: string" +
                    "\n" +
                    "}" +
                    "\n" +
                    "export type User = Selectable<UserTable>" +
                    "\n" +
                    "export type NewUser = Insertable<UserTable>" +
                    "\n" +
                    "export type UserUpdate = Updateable<UserTable>",
            },
            {
                table: "product",
                tableTypeName: "Product",
                types:
                    "interface ProductTable {" +
                    "\n" +
                    "id: number" +
                    "\n" +
                    "product: string" +
                    "\n" +
                    "price: number | null" +
                    "\n" +
                    "}" +
                    "\n" +
                    "export type Product = Selectable<ProductTable>" +
                    "\n" +
                    "export type NewProduct = Insertable<ProductTable>" +
                    "\n" +
                    "export type ProductUpdate = Updateable<ProductTable>",
            },
        ]);
    });
    it("should generate table types for single camel case table", () => {
        expect(
            generateTableTypes(
                [
                    {
                        name: "user_profile",
                        isView: false,
                        columns: [
                            {
                                name: "id",
                                dataType: "NUMBER",
                                isNullable: false,
                                hasDefaultValue: false,
                                isAutoIncrementing: true,
                            },
                            {
                                name: "name",
                                dataType: "VARCHAR2",
                                isNullable: false,
                                hasDefaultValue: false,
                                isAutoIncrementing: false,
                            },
                        ],
                    },
                ],
                true,
            ),
        ).toEqual([
            {
                table: "userProfile",
                tableTypeName: "UserProfile",
                types:
                    "interface UserProfileTable {" +
                    "\n" +
                    "id: number" +
                    "\n" +
                    "name: string" +
                    "\n" +
                    "}" +
                    "\n" +
                    "export type UserProfile = Selectable<UserProfileTable>" +
                    "\n" +
                    "export type NewUserProfile = Insertable<UserProfileTable>" +
                    "\n" +
                    "export type UserProfileUpdate = Updateable<UserProfileTable>",
            },
        ]);
    });
});

describe("generateDatabaseTypes", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2025, 0, 1));
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it("should generate database types for single table", () => {
        expect(generateDatabaseTypes([{ table: "user", tableTypeName: "User", types: "types string" }])).toBe(
            "// This file was generated automatically. Please don't edit it manually!" +
                "\n" +
                "// Timestamp: 2025-01-01T00:00:00.000Z" +
                "\n\n" +
                "import type { Insertable, Selectable, Updateable } from 'kysely'" +
                "\n\n" +
                "types string" +
                "\n\n" +
                "export interface DB {" +
                "\n" +
                "user: User" +
                "\n" +
                "}",
        );
    });
});

describe("formatTypes", () => {
    it("should format types using default prettier options", async () => {
        const types = "interface UserTable { id: number; name: string } export type User = Selectable<UserTable>";
        expect(await formatTypes(types)).toBe(
            "interface UserTable {" +
                "\n" +
                "    id: number;" +
                "\n" +
                "    name: string;" +
                "\n" +
                "}" +
                "\n" +
                "export type User = Selectable<UserTable>;\n",
        );
    });
});

describe("checkDiff", () => {
    it("should return true if there is a diff", () => {
        expect(checkDiff("line1\nline2\nline3", "line1\nline2\nline4")).toBe(true);
    });
    it("should not return true if there is no diff", () => {
        expect(checkDiff("line1\nline2\nline3", "line1\nline2\nline3")).toBe(false);
    });
    it("should not return true if there is only a diff in line 1 or 2 (comments)", () => {
        expect(checkDiff("line1\nline2\nline3", "line1\nline3\nline3")).toBe(false);
    });
    it("should return true if there are > lines", () => {
        expect(checkDiff("line1\nline2\nline3", "line1\nline2\nline3\nline4")).toBe(true);
    });
    it("should return true if there are < lines", () => {
        expect(checkDiff("line1\nline2\nline3", "line1\nline2")).toBe(true);
    });
});

describe("generate", () => {
    it("should generate types for a single table", async () => {
        const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "types.ts");
        expect(fs.existsSync(filePath)).toBe(false);
        await generate({
            pool: await oracledb.createPool({
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                connectionString: process.env.DB_CONNECTION_STRING,
                poolAlias: process.env.DB_POOL_ALIAS,
            }),
            generator: {
                schemas: ["SYS"],
                tables: ["DUAL"],
                checkDiff: true,
                filePath: filePath,
            },
        });
        expect(fs.existsSync(filePath)).toBe(true);
        fs.unlinkSync(filePath);
        expect(fs.existsSync(filePath)).toBe(false);
    });
});
