# Chatbot — Turkish Mistral-7B

AI destekli Türkçe sohbet uygulaması. Fine-tune edilmiş Mistral-7B modeli HuggingFace Space üzerinde çalışır, Node.js backend ile Next.js frontend arasında köprü kurar.

## Mimari

```
Frontend (Next.js)  →  Backend (Node.js/Express)  →  HuggingFace Space (FastAPI + Mistral-7B)
   Vercel                    Railway                    defectgi-turkish-mistral7.hf.space
```

## Servisler

| Servis | Teknoloji | Platform |
|--------|-----------|----------|
| Frontend | Next.js 14, Tailwind CSS (clay tema) | Vercel |
| Backend | Node.js, Express, TypeScript | Railway |
| Model API | FastAPI, Mistral-7B + LoRA (4-bit) | HuggingFace Spaces |
| Veritabanı | MySQL | Railway |

---

## Kurulum

### Gereksinimler

- Node.js 18+
- MySQL 8+

### Backend

```bash
cd backend
npm install
cp .env.example .env   # env değişkenlerini doldur
npm run dev
```

**Environment Variables (`backend/.env`):**

```env
PORT=4000
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chatbot
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your-secret-key

# Frontend origin (CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

**Environment Variables (`frontend/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## API Endpoints

### Auth
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Kayıt ol |
| POST | `/api/auth/login` | Giriş yap |
| GET | `/api/auth/me` | Oturum bilgisi |

### Chat
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/chat/message` | Mesaj gönder |

**Request:**
```json
{ "message": "Merhaba", "conversationId": 1 }
```

**Response:**
```json
{ "response": "Merhaba! Nasıl yardımcı olabilirim?" }
```

### Conversations
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/conversations` | Konuşma listesi |
| POST | `/api/conversations` | Yeni konuşma |
| DELETE | `/api/conversations/:id` | Konuşma sil |

### Health
```
GET /api/health  →  { "status": "ok", "timestamp": "..." }
```

---

## HuggingFace Space

Space URL: `https://defectgi-turkish-mistral7.hf.space`
Model repo: `defectGI/defectgi` (Mistral-7B + LoRA fine-tune)

**Eğitim Veriseti:**
- [Wikipedia Turkish](https://huggingface.co/datasets/wikipedia) — Türkçe Wikipedia dump'ı (ana kaynak)
- [CulturaX Turkish](https://huggingface.co/datasets/uonlp/CulturaX) — çok dilli web corpus, Türkçe alt kümesi

**Space API:**
```
POST /predict
Body: { "message": "...", "max_tokens": 200 }
Response: { "response": "..." }
```

Space free tier GPU kullandığı için uzun süre kullanılmayınca uyuyabilir. İlk istekte 503 alınırsa Space uyanmaktadır, 30 saniye bekleyip tekrar denenmeli.

---

## Deploy

### Railway (Backend)

Railway dashboard'da şu environment variable'ları tanımla:

```env
NODE_ENV=production
PORT=4000
DB_HOST=...
DB_PORT=3306
DB_NAME=chatbot
DB_USER=...
DB_PASSWORD=...
JWT_SECRET=...
FRONTEND_URL=https://learnshards.xyz
```

### Vercel (Frontend)

```env
NEXT_PUBLIC_API_URL=https://<railway-backend-url>
```

---

## Veritabanı Şeması

Tablolar backend başlangıcında otomatik oluşturulur (`initDatabase()`).

```sql
users         (id, username, email, password_hash, created_at)
conversations (id, user_id, title, created_at, updated_at)
messages      (id, conversation_id, role, content, created_at)
```

---

## Tema

Clay tema (`learnshards.xyz` ile aynı):
- Arka plan: sıcak kahverengi tonlar
- Vurgu rengi: turuncu (`hsl(24 70% 50%)`)
- Header'daki buton clay ↔ light arasında geçiş yapar
