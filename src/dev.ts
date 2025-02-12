// This file is for testing the package locally. Do no push changes to this file to the repository.

import oracledb from "oracledb";
import { generate } from "./generator/generate.js";

(async () => {
    await generate({
        pool: await oracledb.createPool({
            user: "",
            password: "",
            connectionString: "",
        }),
        generator: {
            camelCase: true,
            checkDiff: true,
        },
    });
    process.exit(0);
})();
