import { upid } from "upid-ts";
import { Client } from "pg";

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "mypassword",
  database: "postgres",
});

async function insertData() {
  const id = upid("user");

  try {
    await client.connect();

    const createExt = `CREATE EXTENSION IF NOT EXISTS upid_pg;`;
    await client.query(createExt);
    console.log("Extension ready");

    const dropTable = `DROP TABLE IF EXISTS test_upid`;
    await client.query(dropTable);

    const createTable = `
      CREATE TABLE test_upid (
        id_upid upid NOT NULL,   -- pass a string
        id_uuid uuid NOT NULL,   -- pass binary
        id_text text NOT NULL    -- pass a string
      );
    `;
    await client.query(createTable);
    console.log("Table created");

    const query = `
      INSERT INTO test_upid (id_upid, id_uuid, id_text)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    // prettier-ignore
    const values = [
      id.toStr(),                // string for upid type
      id.toBinary(),             // binary for uuid type
      id.toStr(),                // string for text type
    ];
    const result = await client.query(query, values);
    const row = result.rows[0];
    console.log("Inserted", row);
  } catch (err) {
    console.error("Error inserting data:", err);
  } finally {
    await client.end();
  }
}

insertData();
