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
  logger.info('HF request sending', { url: `${HF_SPACE}/predict`, messageLength: message.length });

  let res: Response;
  try {
    res = await fetch(`${HF_SPACE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, max_tokens: 200 }),
    });
  } catch (fetchErr: any) {
    logger.error('HF fetch failed (network error)', { error: fetchErr?.message });
    throw fetchErr;
  }

  logger.info('HF response status', { status: res.status, ok: res.ok });

  if (!res.ok) {
    const errText = await res.text();
    logger.error('HF error response body', { status: res.status, body: errText.slice(0, 500) });

    if (res.status === 503) {
      await wakeSpace();
      throw new Error('503: Space uyandırılıyor, tekrar dene.');
    }

    throw new Error(`HuggingFace API error: ${res.status} — ${errText}`);
  }

  const rawText = await res.text();
  logger.info('HF raw response', { body: rawText.slice(0, 500) });

  let data: { response: string };
  try {
    data = JSON.parse(rawText);
  } catch (parseErr: any) {
    logger.error('HF JSON parse failed', { error: parseErr?.message, body: rawText.slice(0, 500) });
    throw new Error(`Invalid JSON from Space: ${rawText.slice(0, 200)}`);
  }

  if (!data.response) {
    logger.error('HF response field missing', { keys: Object.keys(data) });
    throw new Error('Empty response from Space');
  }

  logger.info('HuggingFace response received', { length: data.response.length });
  return data.response;
}
