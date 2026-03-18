# your-obsidian-dream

Cloudflare Workers deployment is configured for this Vite app.

## Local commands

- `bun run build` — production build to `dist/`
- `bun run deploy:dry` — Cloudflare dry-run deploy (validates Worker + assets)
- `bun run deploy` — deploy Worker + static assets
- `bun run preview:worker` — run Worker locally with Wrangler

## Cloudflare build settings

Use these settings in Cloudflare (Workers CI/CD or Pages with custom command):

- **Install command:** `bun install --frozen-lockfile`
- **Build command:** `bun run build`
- **Deploy command:** `bun run deploy`

This avoids Wrangler auto-setup in CI (which previously tried `npm` and failed with peer dependency resolution).

## Worker name

Configured worker name: `beta-vibo`.

If you want the deployment URL to stay as `your-obsidian-dream.crisstiano.workers.dev`, change `name` in `wrangler.jsonc` back to `your-obsidian-dream`.
