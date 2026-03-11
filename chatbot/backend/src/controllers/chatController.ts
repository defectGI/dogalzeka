import { Request, Response } from 'express';
import { pool } from '../config/database';
import { getChatResponse } from '../services/huggingface';
import { logger } from '../logger';

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { message, conversationId } = req.body;
  const user = req.user;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const convId: number | null = conversationId ? parseInt(conversationId) : null;

  try {
    // Konuşma kullanıcıya ait mi kontrol et
    if (user && convId) {
      const [convRows] = await pool.execute(
        'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
        [convId, user.userId]
      ) as any[];

      if (convRows.length === 0) {
        res.status(403).json({ error: 'Conversation not found' });
        return;
      }

      // Kullanıcı mesajını kaydet
      await pool.execute(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [convId, 'user', message.trim()]
      );
    }

    const response = await getChatResponse(message.trim());

    // Assistant mesajını kaydet
    if (user && convId) {
      await pool.execute(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [convId, 'assistant', response]
      );

      // İlk mesajsa başlık güncelle
      const [countRows] = await pool.execute(
        'SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?',
        [convId]
      ) as any[];

      if (countRows[0].cnt <= 2) {
        await pool.execute(
          'UPDATE conversations SET title = ? WHERE id = ?',
          [message.trim().slice(0, 60), convId]
        );
      }
    }

    res.json({ response });
  } catch (err: any) {
    logger.error('Chat error', { message: err?.message });
    const userMessage = err?.message?.includes('503')
      ? 'Model şu an aktif değil, lütfen biraz bekleyip tekrar dene.'
      : 'Yanıt alınamadı, lütfen tekrar dene.';
    res.status(500).json({ error: userMessage });
  }
}
