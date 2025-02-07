import { describe, expect, it } from "vitest";
import { generateFieldTypes, generateTableTypes } from "./generate";

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
                types: `interface UserTable {\nid: number\nname: string\n}\nexport type User = Selectable<UserTable>\nexport type NewUser = Insertable<UserTable>\nexport type UserUpdate = Updateable<UserTable>\n`,
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
                types: `interface UserTable {\nid: number\nname: string\n}\nexport type User = Selectable<UserTable>\nexport type NewUser = Insertable<UserTable>\nexport type UserUpdate = Updateable<UserTable>\n`,
            },
            {
                table: "product",
                tableTypeName: "Product",
                types: `interface ProductTable {\nid: number\nproduct: string\nprice: number | null\n}\nexport type Product = Selectable<ProductTable>\nexport type NewProduct = Insertable<ProductTable>\nexport type ProductUpdate = Updateable<ProductTable>\n`,
            },
        ]);
    });
});
