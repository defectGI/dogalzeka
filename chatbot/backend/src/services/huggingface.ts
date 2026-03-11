import { logger } from '../logger';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GRADIO_URL = 'https://defectgi-turkish-mistral7.hf.space/predict';

export async function getChatResponse(message: string): Promise<string> {
  const res = await fetch(GRADIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, max_tokens: 200 }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HuggingFace API error: ${res.status} — ${errText}`);
  }

  const data = await res.json() as { response: string };
  return data.response;
}
