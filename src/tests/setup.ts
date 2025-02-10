import "dotenv/config";

process.env = {
    ...process.env,
    DB_POOL_ALIAS: "kysely-test",
};
