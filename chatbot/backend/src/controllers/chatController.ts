import { Request, Response } from 'express';
import { pool } from '../config/database';
import { getChatResponse, ChatMessage } from '../services/huggingface';
import { logger } from '../logger';

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { message, conversationId, sessionId } = req.body;
  const user = req.user;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const convId: number | null = conversationId ? parseInt(conversationId) : null;

  try {
    let history: ChatMessage[] = [];
    let activeConvId: number | null = convId;

    if (user) {
      // --- Giriş yapmış kullanıcı ---
      if (activeConvId) {
        const [convRows] = await pool.execute(
          'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
          [activeConvId, user.userId]
        ) as any[];

        if (convRows.length === 0) {
          res.status(403).json({ error: 'Conversation not found' });
          return;
        }

        const [historyRows] = await pool.execute(
          'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
          [activeConvId]
        ) as any[];

        history = historyRows.map((r: any) => ({ role: r.role, content: r.content }));
      }

      await pool.execute(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [activeConvId, 'user', message.trim()]
      );

    } else if (sessionId) {
      // --- Misafir kullanıcı: sessionId ile konuşma bul ya da yarat ---
      const [sessionRows] = await pool.execute(
        'SELECT id FROM conversations WHERE session_id = ?',
        [sessionId]
      ) as any[];

      if (sessionRows.length > 0) {
        activeConvId = sessionRows[0].id;

        const [historyRows] = await pool.execute(
          'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
          [activeConvId]
        ) as any[];

        history = historyRows.map((r: any) => ({ role: r.role, content: r.content }));
      } else {
        const [result] = await pool.execute(
          'INSERT INTO conversations (user_id, session_id, title) VALUES (NULL, ?, ?)',
          [sessionId, message.trim().slice(0, 60)]
        ) as any[];
        activeConvId = result.insertId;
      }

      await pool.execute(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [activeConvId, 'user', message.trim()]
      );
    }

    const messages: ChatMessage[] = [...history, { role: 'user', content: message.trim() }];
    const response = await getChatResponse(messages);

    if (activeConvId) {
      await pool.execute(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [activeConvId, 'assistant', response]
      );

      // İlk mesajsa başlık güncelle (user için)
      if (user && activeConvId) {
        const [countRows] = await pool.execute(
          'SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?',
          [activeConvId]
        ) as any[];

        if (countRows[0].cnt <= 2) {
          await pool.execute(
            'UPDATE conversations SET title = ? WHERE id = ?',
            [message.trim().slice(0, 60), activeConvId]
          );
        }
      }
    }

    res.json({ response, conversationId: activeConvId });
  } catch (err: any) {
    logger.error('Chat error', { message: err?.message });
    const userMessage = err?.message?.includes('503')
      ? 'Model şu an aktif değil, lütfen biraz bekleyip tekrar dene.'
      : 'Yanıt alınamadı, lütfen tekrar dene.';
    res.status(500).json({ error: userMessage });
  }
}
