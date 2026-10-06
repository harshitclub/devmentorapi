// ==============================================================================
// BACKEND SERVER - FULL-STACK DEVELOPER AI ASSISTANT
// ==============================================================================
// This is a beginner-friendly Express server that securely connects our
// Next.js frontend to Google's Gemini AI API.
// ==============================================================================

// 1. Load environment variables from the .env file (such as GEMINI_API_KEY)
require("dotenv").config();

// 2. Import Express (minimal web server framework) and CORS (cross-origin resource sharing)
const express = require("express");
const cors = require("cors");

// 3. Import the Google Generative AI SDK to communicate with Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 4. Initialize our Express application
const app = express();

// Set the port from environment variables, or default to 5000
const PORT = process.env.PORT || 5000;

// 5. Middlewares
// - cors() lets our Next.js frontend (http://localhost:3000) make API requests to this server
app.use(cors());

// - express.json() parses incoming JSON bodies (e.g., { message: "...", history: [...] })
app.use(express.json());

// 6. Initialize Google Gemini AI using our API Key from .env
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("⚠️ WARNING: GEMINI_API_KEY is not defined in your backend/.env file!");
}

const genAI = new GoogleGenerativeAI(apiKey);

// 7. System Prompt - Instructing the AI on how to behave
// This turns Gemini into a dedicated Senior Full-Stack Engineering Mentor.
const SYSTEM_INSTRUCTION = `
You are "DevMentor AI", a senior full-stack software engineer and tech mentor.
Your job is to help users learn and solve full-stack web development challenges.

Your areas of expertise:
1. Frontend: Next.js (App Router, Server Components, SSR), React, HTML, CSS, JavaScript, TypeScript, UI/UX.
2. Backend: Node.js, Express, REST APIs, WebSockets, Authentication (JWT, Cookies, OAuth).
3. DBMS: Relational (PostgreSQL, MySQL), NoSQL (MongoDB, Redis), indexing, normalization, transactions.
4. System Design: Scalability, caching, microservices, load balancing, message queues.
5. Prompt Engineering & AI: LLM integration, prompt design, RAG, best practices.
6. DevOps: Docker, Git, CI/CD, deployment, security practices.

Formatting instructions:
- Provide clear, simple, step-by-step explanations.
- Always use Markdown code blocks with language names (e.g. \`\`\`javascript, \`\`\`sql).
- Write beginner-friendly comments inside any code snippets you provide.
- Keep answers modern, clean, and directly actionable.
`;

// 8. Health Check Route (GET /)
// Used to verify that the server is up and running in a browser or curl
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Full-Stack Dev AI Backend is up and running!",
  });
});

// 9. Candidate Models
// Sometimes free-tier models get temporary traffic spikes (HTTP 503).
// Having a small list of reliable models ensures high uptime.
const MODELS = [
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest"
];

// Helper function to send a streaming message with automatic model fallback
async function streamWithFallback(formattedHistory, userMessage) {
  let lastError = null;

  for (const modelName of MODELS) {
    try {
      // Create the model instance with our system prompt
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      // Start the chat session with existing history
      const chat = model.startChat({
        history: formattedHistory,
      });

      // Request streaming generation
      const responseStream = await chat.sendMessageStream(userMessage);
      return { responseStream, activeModel: modelName };
    } catch (err) {
      lastError = err;
      console.warn(`Model ${modelName} was busy or unavailable, trying next model...`);
    }
  }

  throw lastError || new Error("All Gemini models are temporarily busy.");
}

// 10. Streaming Chat API Route (POST /api/chat)
// This is the endpoint the Next.js frontend calls.
app.post("/api/chat", async (req, res) => {
  try {
    // Read the user's message and chat history from the request body
    const { message, history = [] } = req.body;

    // Validate the input message
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Please provide a valid message." });
    }

    // Convert frontend message history into the format Gemini expects
    // Frontend: [{ role: "user", content: "..." }, { role: "assistant", content: "..." }]
    // Gemini:   [{ role: "user", parts: [{ text: "..." }] }, { role: "model", parts: [{ text: "..." }] }]
    const formattedHistory = history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    }));

    // Configure HTTP headers for real-time text streaming (chunk by chunk)
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Call our streaming function
    const { responseStream } = await streamWithFallback(formattedHistory, message);

    // Stream each incoming word/chunk to the frontend as soon as it arrives
    for await (const chunk of responseStream.stream) {
      const text = chunk.text();
      res.write(text);
    }

    // Finish the HTTP response when the AI is done talking
    res.end();
  } catch (error) {
    console.error("Error processing /api/chat request:", error.message);

    // If headers were not yet sent, send standard 500 JSON
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to communicate with AI.",
        details: error.message,
      });
    } else {
      // If stream was already open, write error text into the stream and close
      res.write(`\n\n[Error: ${error.message}]`);
      res.end();
    }
  }
});

// 11. Start the server (Local Development) vs Export app (Vercel Serverless)
// - On a traditional local computer: We call app.listen() to run continuously on a port.
// - On Vercel: Vercel does not use long-running servers. Instead, it runs your code
//   as ephemeral "Serverless Functions". Vercel needs us to export the Express app.
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=============================================`);
    console.log(`🚀 DevMentor AI Backend is running!`);
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`💬 Chat API: POST http://localhost:${PORT}/api/chat`);
    console.log(`=============================================`);
  });
}

// Export the Express app so Vercel can run it as a Serverless Function
module.exports = app;
