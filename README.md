# Libra2XP

## How to use

Clone the repo. Requires [pnpm](https://pnpm.io/installation)

Install dependencies:

```sh
pnpm install
```

### Environment configuration

Network endpoints can be customized through environment variables. Copy the
example file and adjust values as needed:

```sh
cp .env.example .env.local
```

Supported variables:

| Variable              | Default                         |
| --------------------- | ------------------------------- |
| `NODE_REST_URL`       | `https://rpc.libra2.org/v1`     |
| `INDEXER_URL`         | `https://indexer.libra2.org`    |
| `LIBRA2_TESTNET_URL`  | `https://testnet.libra2.org/v1` |
| `LIBRA2_DEVNET_URL`   | `https://devnet.libra2.org/v1`  |
| `LIBRA2_LOCAL_URL`    | `http://127.0.0.1:8080/v1`      |
| `LIBRA2_LOCALNET_URL` | `http://127.0.0.1:8080/v1`      |

Each `LIBRA2_*_URL` variable overrides the default endpoint for the matching
network. Use `NODE_REST_URL` to override the mainnet RPC endpoint and
`INDEXER_URL` for rich explorer data (account resources and account history).
Variables are loaded from `.env.local` and can be tailored to point to custom
fullnodes or indexers.

### Running against different networks

Libra2XP defaults to mainnet. To explore other Libra2 networks, start the app
and select a network either from the UI's network dropdown or by appending a
`?network=<name>` query parameter:

```sh
pnpm start
```

Then open one of the following URLs in your browser:

- `http://localhost:3000` (mainnet)
- `http://localhost:3000/?network=testnet`
- `http://localhost:3000/?network=devnet`
- `http://localhost:3000/?network=local`

If your local node runs on a non-default address, update `LIBRA2_LOCAL_URL` in
`.env.local` accordingly before starting the app.

### GraphQL support

Libra2XP uses the external indexer GraphQL endpoint for rich explorer data.
Ensure `INDEXER_URL` points at the indexer HTTP base (for example,
`https://indexer.libra2.org`) so the app can reach `/v1/graphql`.

Build dependencies:

```sh
pnpm build
```

Run below to start the app:

```sh
pnpm start
```
