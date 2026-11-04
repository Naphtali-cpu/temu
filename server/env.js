import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Load environment files without adding a dependency. Variables already present in
// the real environment always win, so `ADMIN_PASSWORD=... npm run dev` still works.
export function loadEnv() {
  for (const file of [path.join(here, '.env'), path.join(here, '..', '.env')]) {
    if (!fs.existsSync(file)) continue;
    try {
      process.loadEnvFile(file);
    } catch (err) {
      console.warn(`[env] Could not read ${file}: ${err.message}`);
    }
  }
}
