import type { VercelRequest, VercelResponse } from '@vercel/node';

// Single source of truth: matches DEFAULT_MODEL in src/lib/council/types.ts
const FALLBACK_MODEL = "moonshotai/kimi-k2.5";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { messages, temperature, model } = req.body;
  const resolvedModel = model || FALLBACK_MODEL;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(401).json({
      error: {
        message: "OpenRouter API Key is missing. Please add OPENROUTER_API_KEY to your Vercel environment variables."
      }
    });
  }

  try {
    console.log(`[Council] Generating response using model: ${resolvedModel}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": req.headers.origin || "https://orisha-council.vercel.app",
        "X-Title": "Council Chamber",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        temperature: temperature || 0.7,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Council] OpenRouter API Error (model: ${resolvedModel}, status: ${response.status}):`, JSON.stringify(data, null, 2));
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error: any) {
    console.error("[Council] OpenRouter Fetch Error:", error?.message || error);
    res.status(500).json({
      error: {
        message: error.message || "Failed to connect to OpenRouter. Please check your network or try again later."
      }
    });
  }
}
