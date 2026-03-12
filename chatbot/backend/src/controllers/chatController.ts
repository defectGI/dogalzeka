import { Request, Response } from 'express';
import { pool } from '../config/database';
import { getChatResponse, ChatMessage } from '../services/huggingface';
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
    let history: ChatMessage[] = [];

    if (user && convId) {
      // Konuşma kullanıcıya ait mi kontrol et
      const [convRows] = await pool.execute(
        'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
        [convId, user.userId]
      ) as any[];

      if (convRows.length === 0) {
        res.status(403).json({ error: 'Conversation not found' });
        return;
      }

      // Önceki mesajları çek (sliding window için)
      const [historyRows] = await pool.execute(
        'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [convId]
      ) as any[];

      history = historyRows.map((r: any) => ({ role: r.role, content: r.content }));

      // Kullanıcı mesajını kaydet
      await pool.execute(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [convId, 'user', message.trim()]
      );
    }

    // Geçmiş + mevcut mesaj → modele gönder
    const messages: ChatMessage[] = [...history, { role: 'user', content: message.trim() }];
    const response = await getChatResponse(messages);

    if (user && convId) {
      // Assistant cevabını kaydet
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
