// Applies pending SQL migrations from ./drizzle. Run before the app starts on each deploy.
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import pg from "pg"

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 })

try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" })
  console.log("Migrations applied")
} catch (error) {
  console.error("Migration failed:", error)
  process.exitCode = 1
} finally {
  await pool.end()
}
