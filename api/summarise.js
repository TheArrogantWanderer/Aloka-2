export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { headline, description } = req.body;
  if (!headline) return res.status(400).json({ error: "Missing headline" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are a news analyst for Aloka, a clean minimal news app. Given this article, respond ONLY with valid JSON (no markdown, no backticks, no extra text) in this exact format:
{"bullets":["point 1","point 2","point 3"],"why":"One sentence under 25 words explaining why this matters to everyday people."}

Headline: ${headline}
Description: ${description || "No description available."}

Rules: bullets must be exactly 3 short factual points each under 20 words. Respond with raw JSON only.`
        }]
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate summary" });
  }
}
