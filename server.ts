import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Using Kimi K2.5 via OpenRouter for better reliability and conversation quality
const DEFAULT_MODEL = "moonshotai/kimi-k2.5";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Web Search Endpoint - For real-time information retrieval
  app.post("/api/council/search", async (req, res) => {
    const { query } = req.body;
    
    const apiKey = process.env.TAVILY_API_KEY || process.env.SERPAPI_KEY;
    if (!apiKey) {
      return res.status(501).json({ 
        error: "Search not configured. Add TAVILY_API_KEY or SERPAPI_KEY to your .env file." 
      });
    }

    try {
      // Try Tavily first (better for AI applications)
      if (process.env.TAVILY_API_KEY) {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query,
            search_depth: "advanced",
            include_answer: true,
            max_results: 5,
          })
        });
        const data = await response.json();
        return res.json(data);
      }
      
      // Fallback to SerpAPI
      const params = new URLSearchParams({
        api_key: process.env.SERPAPI_KEY!,
        q: query,
        engine: "google",
        num: "5",
      });
      const response = await fetch(`https://serpapi.com/search?${params}`);
      const data = await response.json();
      res.json({
        results: data.organic_results?.map((r: any) => ({
          title: r.title,
          url: r.link,
          content: r.snippet,
        })) || [],
        answer: data.answer_box?.answer || data.answer_box?.snippet,
      });
    } catch (error: any) {
      console.error("Search error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Council Orchestration Endpoint - Uses Kimi K2.5
  app.post("/api/council/generate", async (req, res) => {
    const { messages, temperature, tools } = req.body;
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "MY_OPENROUTER_API_KEY") {
      return res.status(401).json({ 
        error: { 
          message: "OpenRouter API Key is missing or not configured. Please add OPENROUTER_API_KEY to your .env file." 
        } 
      });
    }

    try {
      console.log(`Generating response using model: ${DEFAULT_MODEL}`);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "Council Chamber",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages,
          temperature: temperature || 0.7,
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("OpenRouter API Error Response:", JSON.stringify(data, null, 2));
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error: any) {
      console.error("OpenRouter Fetch Error:", error);
      res.status(500).json({ 
        error: { 
          message: error.message || "Failed to connect to OpenRouter. Please check your network or try again later." 
        } 
      });
    }
  });

  app.post("/api/council/action", async (req, res) => {
    const { action, payload } = req.body;
    // This will be implemented in the orchestration layer
    res.json({ status: "received", action });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
