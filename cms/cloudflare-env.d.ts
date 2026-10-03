// Types of the Cloudflare bindings. Keep this file in line with cloudflare.config.ts.
declare namespace Cloudflare {
  interface Env {
    D1: D1Database
    R2: R2Bucket
    ASSETS: Fetcher
    PAYLOAD_SECRET: string
    FRONTEND_URL?: string
    SEED_ADMIN_EMAIL?: string
    SEED_ADMIN_PASSWORD?: string
  }
}
interface CloudflareEnv extends Cloudflare.Env {}
