import { execSync } from "node:child_process";

const runners = [
  "bun run build",
  "npm run build",
  "pnpm run build",
  "yarn build"
];

for (const command of runners) {
  try {
    execSync(command, { stdio: "inherit" });
    process.exit(0);
  } catch (error) {
    // continue to next runner
  }
}

console.warn(
  "Postinstall build skipped: no supported package runner (bun/npm/pnpm/yarn) was available."
);

