import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

// Determine dialect and credentials based on URL
// Local SQLite files use "file:" protocol, remote Turso uses "libsql://"
const isLocalFile = databaseUrl.startsWith("file:");

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: isLocalFile ? "sqlite" : "turso",
  dbCredentials: isLocalFile
    ? {
        url: databaseUrl,
      }
    : {
        url: databaseUrl,
        authToken: process.env.DATABASE_AUTH_TOKEN,
      },
});
