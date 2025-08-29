// Simple client-side Whisper transcription using OpenAI API
// NOTE: Exposes key in client if used in-browser. Prefer a server proxy in production.

// Read Vite-baked env var safely in browser
const OPENAI_API_KEY: string | undefined = (import.meta as any)?.env?.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not set. Voice transcription will be unavailable.")
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const form = new FormData();
  // Whisper accepts webm/opus from MediaRecorder
  const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type || 'audio/webm' });
  form.append('file', file);
  form.append('model', 'whisper-1');
  // Optional: set language or prompt biasing
  // form.append('language', 'en');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Whisper API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  // OpenAI returns { text: string, ... }
  return data.text || '';
}
