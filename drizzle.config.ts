import { defineConfig } from "drizzle-kit";

// Use SQLite for local development if DATABASE_URL is not set
const usePostgres = !!process.env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: usePostgres ? "postgresql" : "sqlite",
  dbCredentials: usePostgres 
    ? {
        url: process.env.DATABASE_URL!,
      }
    : {
        url: "./local.db",
      },
});
