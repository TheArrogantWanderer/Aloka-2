import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url || url === "#") return res.status(400).json({ success: false, reason: "no_url" });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });

    if (!response.ok) {
      return res.status(200).json({ success: false, reason: "fetch_failed", status: response.status });
    }

    const html = await response.text();
    if (!html || html.length < 500) {
      return res.status(200).json({ success: false, reason: "empty_response" });
    }

    // Parse with JSDOM + Readability (same engine as Firefox Reader Mode)
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, {
      charThreshold: 100,
      keepClasses: false,
      nbTopCandidates: 5,
    });
    const article = reader.parse();

    if (!article || !article.textContent || article.textContent.trim().length < 200) {
      return res.status(200).json({ success: false, reason: "readability_failed" });
    }

    // Clean the extracted text — remove excess whitespace, short lines (nav/footer junk)
    const cleaned = article.textContent
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 40)
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (cleaned.length < 150) {
      return res.status(200).json({ success: false, reason: "too_short" });
    }

    return res.status(200).json({
      success: true,
      content: cleaned,
      title: article.title || null,
      byline: article.byline || null,
      siteName: article.siteName || null,
    });

  } catch (err) {
    const reason = err.name === "TimeoutError" ? "timeout" : "error";
    return res.status(200).json({ success: false, reason });
  }
}
