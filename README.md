# kysely-oracledb

[Kysely](https://github.com/koskimas/kysely) Dialect and Type Generator for [Oracle DB](https://github.com/oracle/node-oracledb).

## Installation

#### npm

```bash
npm install kysely-oracledb
```

#### pnpm

```bash
pnpm install kysely-oracledb
```

#### yarn

```bash
yarn add kysely-oracledb
```

## Usage

### Oracle DB Dialect

To use the Dialect with Kysely, you will need to pass in an Oracle DB `Pool` to the `OracleDialect` constructor.

```typescript
// See the section below for more information on generating types.
import { DB } from "./types.ts";
import oracledb from "oracledb";
import { Kysely } from "kysely";
import { OracleDialect } from "kysely-oracledb";

const db = new Kysely<DB>({
    dialect: new OracleDialect({
        pool: await oracledb.createPool({
            user: "user",
            password: "pass",
            connectionString: "connection-string",
        }),
    }),
});
```

### Dialect Configuration

The dialect can be configured by passing in the following options:

| Option   | Type            | Description                         | Required |
| -------- | --------------- | ----------------------------------- | -------- |
| `pool`   | `oracledb.Pool` | Oracle DB connection pool.          | Yes      |
| `logger` | `Logger`        | Logger instance for debug messages. | No       |

### Type Generation

Kysely requires you to define the types for your database schema. You can define these manually or you can generate them using the `generate` function.

```typescript
import oracledb from "oracledb";
import { generate } from "kysely-oracledb";

await generate({
    pool: await oracledb.createPool({
        user: "user",
        password: "pass",
        connectionString: "connection-string",
    }),
});
```

### Generator Configuration

The generator can be configured with the same options as the dialect, plus the following additional options:

| Option            | Type               | Description                                                     | Required |
| ----------------- | ------------------ | --------------------------------------------------------------- | -------- |
| `schemas`         | `string[]`         | List of schemas to limit introspection to.                      | No       |
| `tables`          | `string[]`         | List of tables to limit introspection to.                       | No       |
| `camelCase`       | `boolean`          | Convert databas schema to camelCase.                            | No       |
| `checkDiff`       | `boolean`          | Check for differences against existing types before generating. | No       |
| `filePath`        | `string`           | File path to write the types to.                                | No       |
| `prettierOptions` | `prettier.Options` | Prettier options for formatting.                                | No       |

By default the types will be written to `types.ts` in the current working directory. You can change this by passing in a `filePath` option:

```typescript
import path from "path";
import oracledb from "oracledb";
import { fileURLToPath } from "url";
import { generate } from "kysely-oracledb";

await generate({
    pool: await oracledb.createPool({
        user: "user",
        password: "pass",
        connectionString: "connection-string",
    }),
    generator: {
        filePath: path.join(path.dirname(fileURLToPath(import.meta.url)), "db-types.ts"),
    },
});
```

## Contributing

Contributions are welcome! Please open an issue or a pull request on GitHub.
