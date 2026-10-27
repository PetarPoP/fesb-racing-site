// Convert the Nitro output (.output) to the Build Output Specification v0 (.cloudflare/output/v0).
// The command "cf deploy --prebuilt" reads that format. Nitro does not write it.
import { cp, mkdir, readFile, readdir, readlink, rm, stat, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

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

// A page whose render failed is an empty file. Stop here, so a broken build is not deployed (the old site stays live).
async function emptyPages(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await emptyPages(path)))
    else if (entry.name.endsWith('.html') && (await stat(path)).size === 0) out.push(relative(nitroPublic, path))
  }
  return out
}
const empty = await emptyPages(nitroPublic)
if (empty.length) {
  await stopPreviewServers()
  console.error(`The prerender wrote ${empty.length} empty pages: ${empty.join(', ')}`)
  process.exit(1)
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

// The prerender starts "wrangler dev" as a preview server and does not stop it: it outlives "vite build".
// It keeps the build log open, so Cloudflare Workers Builds waited for it until the 30 minute timeout.
// Stop the preview servers started in this folder. Linux only (/proc); elsewhere there is nothing to do.
async function stopPreviewServers() {
  let pids
  try {
    pids = (await readdir('/proc')).filter((d) => /^\d+$/.test(d) && Number(d) !== process.pid)
  } catch {
    return
  }
  for (const pid of pids) {
    try {
      const argv = (await readFile(`/proc/${pid}/cmdline`, 'utf8')).split('\0')
      // node .../wrangler/bin/wrangler.js --cwd ./ dev --port <n>, or its child .../wrangler-dist/cli.js.
      const script = argv.findIndex((a) => /[\\/]wrangler([\\/]bin[\\/]wrangler\.js|-dist[\\/]cli\.js)$/.test(a))
      if (script < 0 || !argv.slice(script + 1).includes('dev')) continue
      if ((await readlink(`/proc/${pid}/cwd`)) !== root) continue
      process.kill(Number(pid), 'SIGTERM')
      console.log(`Stopped the prerender preview server (pid ${pid})`)
    } catch {
      // The process ended in the meantime, or it is not ours.
    }
  }
}
await stopPreviewServers()
