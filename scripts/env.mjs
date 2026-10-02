import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const file = resolve(process.env.ENV_FILE || ".env.development");
dotenv.config({ path: file, quiet: true });
const [command, ...args] = process.argv.slice(2);
const result = spawnSync(command, args, {
  stdio: "inherit",
  env: { ...process.env, ENV_FILE: file },
  shell: false,
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
