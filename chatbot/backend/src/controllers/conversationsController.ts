import { Request, Response } from 'express';
import { pool } from '../config/database';

export async function getConversations(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.userId]
    ) as any[];

    res.json({ conversations: rows });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createConversation(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { title } = req.body;

  try {
    const [result] = await pool.execute(
      'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
      [req.user.userId, title || 'New Conversation']
    ) as any[];

    const convId = result.insertId;
    const [rows] = await pool.execute(
      'SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?',
      [convId]
    ) as any[];

    res.status(201).json({ conversation: rows[0] });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { id } = req.params;

  try {
    // Verify ownership
    const [convRows] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    ) as any[];

    if (convRows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const [rows] = await pool.execute(
      'SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [id]
    ) as any[];

    res.json({ messages: rows });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteConversation(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      'DELETE FROM conversations WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    ) as any[];

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
