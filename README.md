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

## Deploy (Compose-first)

Do this once:
- Create `.env.local` in repo root with:
  - `VITE_GEMINI_API_KEY=...`
  - `VITE_OPENAI_API_KEY=...` (optional; voice transcription)

- Generate auth `.env` for the API (username/password + JWT secret):
  ```bash
  ./scripts/setup-auth.sh admin 'your-password'
  ```

Build and run both services (one script):
```bash
./scripts/manage.sh deploy
```

Common tasks (single entrypoint):
- First-time auth setup: `./scripts/manage.sh setup-auth admin 'your-pass'`
- Redeploy from scratch: `./scripts/manage.sh redeploy`
- Status: `./scripts/manage.sh status`
- Logs: `./scripts/manage.sh logs` (or `logs app`, `logs api`)
- Diagnostics: `./scripts/manage.sh doctor` (checks API health and auth state)
- Stop/remove containers: `./scripts/manage.sh down` (add `--purge` to remove volume)

Visit <http://localhost:5050>.

Notes:
- Vite injects `VITE_*` envs at build time. Edit `.env.local` and rerun the deploy.
- Cookies are httpOnly + SameSite=Lax. Set `COOKIE_SECURE=true` in `.env` if serving over HTTPS.
- If you only want the static app without login/sync: `./scripts/deploy.sh --frontend-only`

## Account + Server Sync (optional but recommended)

This repo now includes a tiny Express API for authentication and persisting your data so it follows you across devices.

What you get
- Single account (username + bcrypt-hashed password)
- Cookie-based session (JWT in httpOnly cookie)
- Endpoints: `POST /api/auth/login`, `POST /api/auth/logout`, `GET/PUT /api/data`
- Nginx proxies `/api/*` to the API container

Configure
1) Fast path: run `./scripts/manage.sh setup-auth <user> <password>` to generate `.env` with bcrypt hash and JWT secret.
   - Manual path: generate hash and write `.env` yourself (examples in script output).
2) Build and run with Compose: `./scripts/manage.sh deploy`

How it works in the app
- On load, the app requests `/api/data`. If unauthorized, it shows the login screen.
- After login, existing server data (if any) loads into the app.
- Changes auto-sync to the server (debounced) via `PUT /api/data`.

Data location
- The API service writes to a volume `data:/app/data` (see `docker-compose.yml`). Back up that volume to back up your app state.
