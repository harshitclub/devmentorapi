# 🚀 DevMentor AI Backend (Serverless Express API)

A lightweight, serverless Node.js Express backend that connects to Google's Gemini AI API with streaming responses. Built for **Vercel Serverless Functions** and local development.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Model**: Google Gemini API (`@google/generative-ai`)
- **Deployment**: Vercel Serverless Functions

---

## ⚙️ Environment Variables

Create a `.env` file in the root of the backend folder:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note**: For Vercel deployment, add `GEMINI_API_KEY` in your **Vercel Project Settings → Environment Variables**.

---

## 🚀 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The server will run on `http://localhost:5000`.

---

## 📡 API Endpoints

### 1. Health Check
- **GET `/`**
- Returns server status.

### 2. Streaming Chat
- **POST `/api/chat`**
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "message": "Explain B-Tree indexing in PostgreSQL",
    "history": []
  }
  ```
- **Response**: Real-time chunked text stream (`text/plain; charset=utf-8`).

---

## ☁️ Deployment on Vercel

1. Import this repository in [Vercel](https://vercel.com/new).
2. Add your `GEMINI_API_KEY` under Environment Variables.
3. Deploy! Vercel will automatically use `vercel.json` and `api/index.js` to run the serverless function.
