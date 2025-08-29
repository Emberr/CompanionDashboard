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
