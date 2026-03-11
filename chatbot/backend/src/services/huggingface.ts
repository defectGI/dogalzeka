import { Response } from 'express';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GRADIO_URL = 'https://defectgi-turkish-mistral7.hf.space/call/predict';

export async function streamChatCompletion(
  messages: ChatMessage[],
  res: Response
): Promise<string> {
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content || '';

  // 1. event_id al
  const initRes = await fetch(GRADIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [lastUserMsg, 200] }),
  });

  if (!initRes.ok) {
    if (initRes.status === 503) throw new Error('MODEL_UNAVAILABLE');
    const errText = await initRes.text();
    throw new Error(`HuggingFace API error: ${initRes.status} — ${errText}`);
  }

  const { event_id } = await initRes.json() as { event_id: string };

  // 2. Sonucu çek
  const resultRes = await fetch(`${GRADIO_URL}/${event_id}`);
  const text = await resultRes.text();

  const lines = text.split('\n').filter(l => l.startsWith('data:'));
  const fullContent: string = JSON.parse(lines[lines.length - 1].replace('data: ', ''))[0];

  // Kelime kelime SSE olarak gönder
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const words = fullContent.split(' ');
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ delta: word + ' ' })}\n\n`);
    await new Promise(r => setTimeout(r, 30));
  }

  res.write('data: [DONE]\n\n');
  return fullContent;
}
