# Run and deploy your AI Studio app

This contains everything you need to run your app locally or in a container.

View your app in AI Studio: https://ai.studio/apps/drive/14maljXb_8WHJc8H4Jp2Hd7WovPSkKpWD

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. In [.env.local](.env.local), set:
   - `VITE_GEMINI_API_KEY` for Gemini
   - `VITE_OPENAI_API_KEY` for Whisper (OpenAI)
   Note: In this sample, the Whisper call happens client-side and will expose the key in the browser; use a server proxy in production.
3. Run the app:
   `npm run dev`

## Run with Docker

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/)

1. Build the image:
   ```bash
   docker build -t companion-dashboard .
   ```
2. Run the container (serves the app on port 8080):
   ```bash
   docker run --rm -p 8080:8080 companion-dashboard
   ```
3. Visit <http://localhost:8080> in your browser.

## Easy Updates

Two simple flows. Both assume your `.env.local` contains:
- `VITE_GEMINI_API_KEY`
- `VITE_OPENAI_API_KEY`

### A) One-liner (prod-style, unique image per commit)

Build with a unique git-based tag, replace the container, expose on host port 5050:

```bash
./scripts/deploy.sh        # auto-uses git SHA as the tag
# or specify a custom tag
./scripts/deploy.sh v1
```

This keeps 5050 stable (good for Cloudflare Tunnel) while images are uniquely tagged per update.

### B) Compose flow (simple and repeatable)

Use the provided `docker-compose.yml` to build and (re)start:

```bash
docker compose up -d --build
# or
./scripts/compose-update.sh
```

This serves on <http://localhost:5050> by default (host 5050 -> container 8080).

Notes:
- Vite injects `VITE_*` envs at build time. Ensure `.env.local` is present before building.
- For subpath hosting, set `base` in `vite.config.ts` (e.g., `base: '/companion/'`).
