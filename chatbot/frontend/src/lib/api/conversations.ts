const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function headers(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getConversations(token: string) {
  const res = await fetch(`${API_URL}/api/conversations`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error('Failed to load conversations');
  return res.json();
}

export async function createConversation(token: string, title?: string) {
  const res = await fetch(`${API_URL}/api/conversations`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function getMessages(token: string, conversationId: number) {
  const res = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

export async function deleteConversation(token: string, conversationId: number) {
  const res = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}
