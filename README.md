# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

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
