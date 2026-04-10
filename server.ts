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

// Using nvidia/nemotron-3-super-120b-a12b:free as the single model for this project
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Council Orchestration Endpoint - Uses nvidia/nemotron-3-super-120b-a12b:free
  app.post("/api/council/generate", async (req, res) => {
    const { messages, temperature } = req.body;
    
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
