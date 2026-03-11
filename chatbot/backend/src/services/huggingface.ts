import { logger } from '../logger';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GRADIO_BASE = 'https://defectgi-turkish-mistral7.hf.space/call/predict';

export async function getChatResponse(message: string): Promise<string> {
  // Adım 1 — job başlat
  const initRes = await fetch(GRADIO_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [message, 200] }),
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`HuggingFace API error: ${initRes.status} — ${errText}`);
  }

  const { event_id } = await initRes.json() as { event_id: string };
  logger.info('Gradio job started', { event_id });

  // Adım 2 — sonucu çek
  const resultRes = await fetch(`${GRADIO_BASE}/${event_id}`);

  if (!resultRes.ok) {
    throw new Error(`Gradio result fetch error: ${resultRes.status}`);
  }

  const text = await resultRes.text();
  const lines = text.split('\n').filter(l => l.startsWith('data:'));

  if (lines.length === 0) {
    throw new Error('No data lines in Gradio SSE response');
  }

  const response: string = JSON.parse(lines[lines.length - 1].replace('data: ', ''))[0];
  return response;
}
