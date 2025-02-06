import { describe, expect, it } from "vitest";
import { camelCase, pascalCase } from "./utils";

describe("camelCase", () => {
    it("should convert snake_case to camelCase", () => {
        expect(camelCase("snake_case")).toBe("snakeCase");
    });

    it("should convert kebab-case to camelCase", () => {
        expect(camelCase("kebab-case")).toBe("kebabCase");
    });
});

describe("pascalCase", () => {
    it("should convert snake_case to PascalCase", () => {
        expect(pascalCase("snake_case")).toBe("SnakeCase");
    });

    it("should convert kebab-case to PascalCase", () => {
        expect(pascalCase("kebab-case")).toBe("KebabCase");
    });
});
