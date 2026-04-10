import type { VercelRequest, VercelResponse } from '@vercel/node';

// Using nvidia/nemotron-3-super-120b-a12b:free as the single model for this project
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

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

  const { messages, temperature } = req.body;
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ 
      error: { 
        message: "OpenRouter API Key is missing. Please add OPENROUTER_API_KEY to your Vercel environment variables." 
      } 
    });
  }

  try {
    console.log(`Generating response using model: ${DEFAULT_MODEL}`);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": req.headers.origin || "https://orisha-council.vercel.app",
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
      console.error("OpenRouter API Error:", JSON.stringify(data, null, 2));
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
}
