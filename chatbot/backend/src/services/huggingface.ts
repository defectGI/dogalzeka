import { Response } from 'express';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GRADIO_URL = 'https://defectgi-turkish-mistral7.hf.space/run/predict';

// Stream response to client via SSE
export async function streamChatCompletion(
  messages: ChatMessage[],
  res: Response
): Promise<string> {
  // Son kullanıcı mesajını al
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content || '';

  const response = await fetch(GRADIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [lastUserMsg, 200] }),
  });

  if (!response.ok) {
    if (response.status === 503) throw new Error('MODEL_UNAVAILABLE');
    const errText = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} — ${errText}`);
  }

  const result = await response.json() as { data: string[] };
  const fullContent = result.data[0] || '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Kelime kelime stream et
  const words = fullContent.split(' ');
  for (const word of words) {
    const delta = word + ' ';
    res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    await new Promise(r => setTimeout(r, 30));
  }

  res.write('data: [DONE]\n\n');
  return fullContent;
}

async function mockStream(messages: ChatMessage[], res: Response): Promise<string> {
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content || '';
  const mockResponse = `Bu bir geliştirme modu yanıtıdır. Gerçek API anahtarı ayarlandığında AI yanıtı alırsınız.\n\nMesajınız: "${lastUserMsg}"`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const words = mockResponse.split(' ');
  for (const word of words) {
    const delta = word + ' ';
    res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    await new Promise(r => setTimeout(r, 50));
  }

  res.write('data: [DONE]\n\n');
  return mockResponse;
}
