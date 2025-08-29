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

## Account + Server Sync (optional but recommended)

This repo now includes a tiny Express API for authentication and persisting your data so it follows you across devices.

What you get
- Single account (username + bcrypt-hashed password)
- Cookie-based session (JWT in httpOnly cookie)
- Endpoints: `POST /api/auth/login`, `POST /api/auth/logout`, `GET/PUT /api/data`
- Nginx proxies `/api/*` to the API container

Configure
1) Generate a bcrypt hash for your password:
   ```bash
   docker run --rm -it -v "$(pwd)/server":/app -w /app node:20-alpine sh -lc "npm i && npm run hash -- 'your-password'"
   # copy the printed hash
   ```
2) Set envs for the API (Compose reads these):
   - `AUTH_USERNAME` (default: `admin`)
   - `AUTH_PASSWORD_HASH` (paste the bcrypt hash)
   - `JWT_SECRET` (any long random string)

   You can export them in your shell or create a `.env` file next to `docker-compose.yml`:
   ```env
   AUTH_USERNAME=admin
   AUTH_PASSWORD_HASH=$2a$10$...yourbcrypthash...
   JWT_SECRET=change-me
   ```
3) Build and run with Compose:
   ```bash
   docker compose up -d --build
   ```

How it works in the app
- On load, the app requests `/api/data`. If unauthorized, it shows the login screen.
- After login, existing server data (if any) loads into the app.
- Changes auto-sync to the server (debounced) via `PUT /api/data`.

Data location
- The API service writes to a volume `data:/app/data` (see `docker-compose.yml`). Back up that volume to back up your app state.
