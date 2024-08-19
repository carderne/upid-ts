# example-postgres

Clone this repo:
```bash
git clone git@github.com:carderne/upid-ts.git
cd upid-ts/example-postgres
```

Get a Docker image running:
```bash
docker run --rm -e POSTGRES_PASSWORD=mypassword \
  -p 5432:5432 --detach carderne/postgres-upid:16
```

Run the script:
```bash
npm install
npx tsx index.ts
```
