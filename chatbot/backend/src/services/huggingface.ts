import { logger } from '../logger';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const HF_SPACE = 'https://defectgi-turkish-mistral7.hf.space';

async function wakeSpace(): Promise<void> {
  try {
    await fetch(`${HF_SPACE}/`, { method: 'GET' });
  } catch (_) {}
}

export async function getChatResponse(message: string): Promise<string> {
  const res = await fetch(`${HF_SPACE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, max_tokens: 200 }),
  });

  if (!res.ok) {
    const errText = await res.text();

    if (res.status === 503) {
      await wakeSpace();
      throw new Error('503: Space uyandırılıyor, tekrar dene.');
    }

    throw new Error(`HuggingFace API error: ${res.status} — ${errText}`);
  }

  const data = await res.json() as { response: string };

  if (!data.response) {
    throw new Error('Empty response from Space');
  }

  logger.info('HuggingFace response received', { length: data.response.length });
  return data.response;
}
