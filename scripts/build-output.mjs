// Convert the Nitro output (.output) to the Build Output Specification v0 (.cloudflare/output/v0).
// The command "cf deploy --prebuilt" reads that format. Nitro does not write it.
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const nitroServer = join(root, '.output', 'server')
const nitroPublic = join(root, '.output', 'public')
const outputRoot = join(root, '.cloudflare', 'output')
const workerDir = join(outputRoot, 'v0', 'workers', 'default')

const wrangler = JSON.parse(await readFile(join(nitroServer, 'wrangler.json'), 'utf8'))

// Binding key and value: a var is a text binding, the assets binding has no value.
const env = {}
for (const [key, value] of Object.entries(wrangler.vars ?? {})) {
  env[key] = { type: 'text', value: String(value) }
}
if (wrangler.assets?.binding) env[wrangler.assets.binding] = { type: 'assets' }

// Assets options. The BOS names are camelCase.
// The site URLs have no trailing slash (/hr, not /hr/). Drop the slash unless the config says otherwise.
const assets = { htmlHandling: wrangler.assets?.html_handling ?? 'drop-trailing-slash' }
if (wrangler.assets?.not_found_handling) assets.notFoundHandling = wrangler.assets.not_found_handling
if (wrangler.assets?.run_worker_first !== undefined) assets.runWorkerFirst = wrangler.assets.run_worker_first

const worker = {
  name: wrangler.name,
  compatibilityDate: wrangler.compatibility_date,
  ...(wrangler.compatibility_flags?.length ? { compatibilityFlags: wrangler.compatibility_flags } : {}),
  ...(wrangler.assets ? { assets } : {}),
  env,
  manifest: { type: 'partial', mainModule: wrangler.main, modules: {} },
}

await rm(outputRoot, { recursive: true, force: true })
await mkdir(join(workerDir, 'bundle'), { recursive: true })

// Copy the Worker modules. Skip the Wrangler config. The cp call keeps dotfiles.
for (const entry of await readdir(nitroServer)) {
  if (entry === 'wrangler.json') continue
  await cp(join(nitroServer, entry), join(workerDir, 'bundle', entry), { recursive: true })
}
await cp(nitroPublic, join(workerDir, 'assets'), { recursive: true })

await writeFile(join(outputRoot, 'v0', 'config.json'), JSON.stringify({ buildContext: { isPreview: false } }))
await writeFile(join(workerDir, 'worker.config.json'), JSON.stringify(worker))
console.log(`Build Output Specification written to ${outputRoot}`)
