import { Response } from 'express';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const HF_API_KEY = process.env.HF_API_KEY || '';
const HF_MODEL_ID = process.env.HF_MODEL_ID || 'mistralai/Mistral-7B-Instruct-v0.3';
const HF_API_URL = `https://router.huggingface.co/hf-inference/v1/chat/completions`;

// Stream response to client via SSE
export async function streamChatCompletion(
  messages: ChatMessage[],
  res: Response
): Promise<string> {
  // Dev mode mock when no API key
  if (!HF_API_KEY || HF_API_KEY === 'hf_xxx') {
    return mockStream(messages, res);
  }

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: HF_MODEL_ID,
      messages,
      max_tokens: 1024,
      stream: true,
    }),
  });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('MODEL_UNAVAILABLE');
    }
    const errText = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} — ${errText}`);
  }

  if (!response.body) {
    throw new Error('No response body from HuggingFace API');
  }

  // Set SSE headers (caller should have already set them, but ensure)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        res.write('data: [DONE]\n\n');
        continue;
      }

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

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

// Non-streaming version (for internal use)
export async function getChatCompletion(messages: ChatMessage[]): Promise<string> {
  if (!HF_API_KEY || HF_API_KEY === 'hf_xxx') {
    const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content || '';
    return `[Dev mock] Mesajınız: "${lastUserMsg}"`;
  }

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: HF_MODEL_ID,
      messages,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content || '';
}
