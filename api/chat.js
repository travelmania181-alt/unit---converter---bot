export default async function handler(req, res) {
  // CORS: allow requests from anywhere (you can restrict to your GitHub Pages domain)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    // Prompt template: few-shot + instructions for step-by-step IBPS style answers
    const model = "gemini-1.5-pro"; // change if needed
    const fullPrompt = `
You are an expert IBPS bank-exam mentor. For any quantitative aptitude, reasoning, DI, or measurement conversion question:
- Show step-by-step reasoning, each short step on new line.
- Show intermediate calculations.
- End with "Final Answer: <answer>".
If user asks simple conversion, do it precisely.
Examples:
Q: A train 120 m long passes a pole in 6 seconds. Find speed in km/h.
A: Length = 120 m
Time = 6 s
Speed = 120 / 6 = 20 m/s
Convert m/s to km/h: 20 * 18 / 5 = 72 km/h
Final Answer: 72 km/h

Now answer the user's question:
${prompt}
`;

    // Use your Vercel env variable GEMINI_API_KEY
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: "GEMINI_API_KEY not set on server" });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    const body = {
      // using content generation API shape
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      // ask for a decent length
      temperature: 0.2,
      maxOutputTokens: 1024
    };

    const gResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!gResp.ok) {
      const txt = await gResp.text();
      console.error("Gemini error", gResp.status, txt);
      return res.status(500).json({ error: `Gemini error: ${gResp.status}`, details: txt });
    }

    const data = await gResp.json();
    // Path to text (may vary by API response shape)
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
