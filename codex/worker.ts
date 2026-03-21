// worker.ts — Cloudflare Worker entrypoint for the ViBo landing/waitlist SPA.
// This is the PUBLIC marketing site only.
// No AI functionality lives here. LEAP runs inside the Tauri app on the user's device.
// This worker just serves static assets from the dist/ build.

export default {
  fetch(request: Request, env: { ASSETS: { fetch: typeof fetch } }): Promise<Response> {
    return env.ASSETS.fetch(request)
  },
}
