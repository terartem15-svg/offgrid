// Throwaway Postgres for local payment tests. Data lives in ./pgdata next to this
// file (inside the project, gitignored) and is wiped on every start.
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "pgdata");
fs.rmSync(dir, { recursive: true, force: true });

const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "test",
  password: "test",
  port: 55432,
  persistent: false,
  // UTF8 + C locale: the seed data contains characters (é, …) that the Windows
  // default cluster encoding (WIN1251) can't store.
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

await pg.initialise();
await pg.start();
await pg.createDatabase("test");
console.log("READY on localhost:55432");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
