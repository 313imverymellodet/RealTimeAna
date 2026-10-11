import "server-only"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Reuse one pool across hot reloads in development
const globalForDb = globalThis as unknown as { pgPool?: Pool }

function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }
  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
  })
}

function getPool() {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = createPool()
  }
  return globalForDb.pgPool
}

// Created lazily so `next build` does not need a database connection
let instance: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDb() {
  if (!instance) {
    instance = drizzle(getPool(), { schema })
  }
  return instance
}

export { schema }
