import "server-only"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { headers } from "next/headers"
import { getDb, schema } from "@/lib/db"

// Social sign-in turns on automatically when its credentials are present
export const socialProviders = {
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
}

function createAuth() {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    socialProviders: {
      ...(socialProviders.github && {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
      }),
      ...(socialProviders.google && {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }),
    },
    advanced: {
      // Railway's proxy passes the visitor's address in these headers
      ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
    },
    // Must stay last: lets server actions and route handlers set auth cookies
    plugins: [nextCookies()],
  })
}

// Created lazily so `next build` does not need a database connection
let instance: ReturnType<typeof createAuth> | undefined

export function getAuth() {
  if (!instance) {
    instance = createAuth()
  }
  return instance
}

export async function getSessionUser() {
  const session = await getAuth().api.getSession({ headers: await headers() })
  return session?.user ?? null
}
