# upid-ts

This is a TypeScript implementation of the [UPID](https://github.com/carderne/upid) spec. A UPID is like a UUID but has a 40-bit timestamp so is sortable, and has a four-character prefix, so it's pretty and useful!

Published at [npmjs/upid-ts](https://www.npmjs.com/package/upid-ts).
Works with Node and browser, and probably Bun/Deno too.
1827 bytes gzip'd.

This is a UPID in TypeScript:
```typescript
upid("user")           // user_2accvpp5guht4dts56je5a
```

Implementations in other languages (Python, Rust, Postgres) are listed at the [carderne/upid](https://github.com/carderne/upid) repo.

## Demo
You can give it a spin at [upid.rdrn.me](https://upid.rdrn.me/).

## Installation
With a build step:
```bash
npm install --save upid
```

Directly in a browser:
```javascript
import { upid } from "https://unpkg.com/upid-ts";
```

## Usage
Use in a program:
```typescript
import { upid } from "upid-ts";
upid("user")           // user_2accvpp5guht4dts56je5a
```

Or more explicitly:
```typescript
import { UPID } from "upid-ts";
UPID.from_prefix("user");
```

Specifying your own timestamp:
```typescript
const ms = BigInt(1720366562288);
const u = UPID.fromPrefixAndMilliseconds("user", ms);
```

From and to a string:
```typescript
const u = UPID.from_str("user_2accvpp5guht4dts56je5a");
u.to_str()            // user_2a...
```

Get stuff out:
```typescript
u.prefix              // user
```

## Development
```bash
npm install

npm run fmt
npm run lint
npm run test

npm run build
```

Please open a PR if you spot a bug or improvement!
