import { Request, Response } from 'express';
import { pool } from '../config/database';
import { streamChatCompletion, ChatMessage } from '../services/huggingface';
import { logger } from '../logger';

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { message, conversationId } = req.body;
  const user = req.user;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  let convId: number | null = conversationId ? parseInt(conversationId) : null;

  try {
    // Build message history
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Be concise and clear in your responses.',
      },
    ];

    if (user && convId) {
      // Verify conversation belongs to user
      const [convRows] = await pool.execute(
        'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
        [convId, user.userId]
      ) as any[];

      if (convRows.length === 0) {
        res.status(403).json({ error: 'Conversation not found' });
        return;
      }

      // Load history
      const [msgRows] = await pool.execute(
        'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 20',
        [convId]
      ) as any[];

      for (const row of msgRows) {
        messages.push({ role: row.role, content: row.content });
      }
    }

    messages.push({ role: 'user', content: message.trim() });

    // Save user message if authenticated
    if (user && convId) {
      await pool.execute(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [convId, 'user', message.trim()]
      );
    }

    // Stream response
    const fullResponse = await streamChatCompletion(messages, res);

    // Save assistant message if authenticated
    if (user && convId && fullResponse) {
      await pool.execute(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [convId, 'assistant', fullResponse]
      );

      // Update conversation title if first message
      const [countRows] = await pool.execute(
        'SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?',
        [convId]
      ) as any[];

      if (countRows[0].cnt <= 2) {
        const title = message.trim().slice(0, 60);
        await pool.execute(
          'UPDATE conversations SET title = ? WHERE id = ?',
          [title, convId]
        );
      }
    }

    res.end();
  } catch (err: any) {
    logger.error('Chat error', { message: (err as any).message });
    const message = err?.message === 'MODEL_UNAVAILABLE'
      ? 'Model şu an aktif değil, lütfen biraz bekleyip tekrar dene.'
      : 'Yanıt alınamadı, lütfen tekrar dene.';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
}
