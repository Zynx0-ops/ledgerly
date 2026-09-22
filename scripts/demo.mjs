// Starts the dev server with LEDGERLY_DEMO=1 so a brand-new database seeds
// itself with six months of realistic sample spending. Written as a Node script
// rather than an inline env var so it works the same on Windows.
import { spawn } from "node:child_process";

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "dev", ...process.argv.slice(2)],
  { stdio: "inherit", env: { ...process.env, LEDGERLY_DEMO: "1" } },
);

child.on("exit", (code) => process.exit(code ?? 0));
