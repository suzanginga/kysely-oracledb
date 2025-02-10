import { vi } from "vitest";

process.env = {
    ...process.env,
    DB_USER: "test_user",
};

vi.mock("oracledb");
