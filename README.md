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

To use the Dialect with Kysely, you will need to configure the `OracleDialect` with your Oracle DB connection pool. You can either pass in the pool directly or a function that returns the pool.

```typescript
// See the section below for more information on generating types.
import { DB } from "./types.ts";
import { Kysely } from "kysely";
import { OracleDialect } from "kysely-oracledb";
import oracledb from "oracledb";

const createPool = async () => {
    return await oracledb.createPool({
        user: "your-username",
        password: "your-password",
        connectionString: "your-connection-string",
    });
};

const db = new Kysely<DB>({
    dialect: new OracleDialect({
        pool: createPool,
    }),
});
```

### Dialect Configuration

The dialect can be configured by passing in the following options:

| Option    | Type                                     | Description                                | Required |
| --------- | ---------------------------------------- | ------------------------------------------ | -------- |
| `pool`    | `oracledb.Pool` or `() => oracle.dbPool` | Oracle DB connection pool.                 | Yes      |
| `schemas` | `string[]`                               | List of schemas to limit introspection to. | No       |
| `tables`  | `string[]`                               | List of tables to limit introspection to.  | No       |
| `logger`  | `Logger`                                 | Logger instance for debug messages.        | No       |

### Type Generation

Kysely requires you to define the types for your database schema. You can define these manually or you can generate them using the `generate` function.

```typescript
import { generate } from "kysely-oracledb";
import oracledb from "oracledb";

const createPool = async () => {
    return await oracledb.createPool({
        user: "your-username",
        password: "your-password",
        connectionString: "your-connection-string",
    });
};

await generate({
    pool: createPool,
});
```

### Generator Configuration

The generator can be configured with the same options as the dialect, plus the following additional options:

| Option            | Type               | Description                                                     | Required |
| ----------------- | ------------------ | --------------------------------------------------------------- | -------- |
| `camelCase`       | `boolean`          | Convert databas schema to camelCase.                            | No       |
| `checkDiff`       | `boolean`          | Check for differences against existing types before generating. | No       |
| `filePath`        | `string`           | File path to write the types to.                                | No       |
| `prettierOptions` | `prettier.Options` | Prettier options for formatting.                                | No       |

## Contributing

Contributions are welcome! Please open an issue or a pull request on GitHub.
