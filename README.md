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
import { DB } from "./types.ts"; // See the Type Generation section for more information on generating types.
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

| Option    | Type                   | Description                                | Required |
| --------- | ---------------------- | ------------------------------------------ | -------- |
| `pool`    | `Pool` or `() => Pool` | Oracle DB connection pool.                 | Yes      |
| `schemas` | `string[]`             | List of schemas to limit introspection to. | No       |
| `tables`  | `string[]`             | List of tables to limit introspection to.  | No       |
| `logger`  | `Logger`               | Logger instance for debug messages.        | No       |

### Type Generation

### Generator Configuration

## Contributing

Contributions are welcome! Please open an issue or a pull request on GitHub.
