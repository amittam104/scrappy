import { db } from '#/db/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import * as schema from '#/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  baseURL: {
    allowedHosts: [
      'https://special-halibut-jjq99rr6p4q3q6px-3000.app.github.dev',
      'localhost:3000',
    ],
    protocol: 'auto',
  },
})
