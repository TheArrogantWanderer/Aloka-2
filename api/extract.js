// Vercel serverless function — fetches a news article URL and extracts
// readable article text using a basic content-extraction heuristic.
// Falls back gracefully if the site blocks scraping or has no extractable content.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(200).json({ success: false, reason: "fetch_failed" });
    }

    const html = await response.text();
    const extracted = extractArticleText(html);

    if (!extracted || extracted.length < 200) {
      return res.status(200).json({ success: false, reason: "extraction_too_short" });
    }

    return res.status(200).json({ success: true, content: extracted });
  } catch (err) {
    return res.status(200).json({ success: false, reason: "error" });
  }
}

// Lightweight readability-style extraction without external dependencies.
function extractArticleText(html) {
  // Remove script, style, nav, header, footer, aside tags entirely
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find the <article> tag first — most semantic news sites use this
  let articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  let targetHtml = articleMatch ? articleMatch[1] : null;

  // Fallback: look for common content container class/id patterns
  if (!targetHtml) {
    const patterns = [
      /<div[^>]*class="[^"]*(?:article-body|story-body|entry-content|post-content|article-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*(?:article-body|story-body|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
    ];
    for (const p of patterns) {
      const m = cleaned.match(p);
      if (m) { targetHtml = m[1]; break; }
    }
  }

  if (!targetHtml) return null;

  // Extract all <p> tag contents from the target area
  const paragraphs = [...targetHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => stripTags(m[1]).trim())
    .filter(p => p.length > 40); // filter out short captions/junk

  if (paragraphs.length === 0) return null;

  return paragraphs.join("\n\n");
}

function stripTags(str) {
  return str
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/\s+/g, " ");
}
