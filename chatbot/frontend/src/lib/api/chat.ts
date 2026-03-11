const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function sendMessage(
  message: string,
  conversationId: number | null,
  token: string | null,
): Promise<string> {
  const res = await fetch(`${API_URL}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversationId }),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Sunucudan geçersiz yanıt alındı (${res.status}). API URL'ini kontrol et.`);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Yanıt alınamadı');
  }

  return data.response;
}
