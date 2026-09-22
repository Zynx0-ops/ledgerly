// Deletes the local database so the next start begins from an empty ledger
// (categories are re-seeded automatically).
import { rmSync } from "node:fs";
import { join } from "node:path";

const base = join(process.cwd(), "data");
for (const name of ["ledgerly.db", "ledgerly.db-wal", "ledgerly.db-shm"]) {
  rmSync(join(base, name), { force: true });
}
console.log("Ledgerly database removed. The next run starts clean.");
