import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { query, count = 3 } = await req.json();
  if (!query) return Response.json({ error: "query required" }, { status: 400 });

  // Try Brave Search first
  const BRAVE_KEY = process.env.BRAVE_API_KEY;
  if (BRAVE_KEY) {
    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}&search_lang=fr`;
      const res = await fetch(url, {
        headers: { "Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": BRAVE_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        const results = (data.web?.results || []).slice(0, count).map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        }));
        return Response.json({ results, source: "brave" });
      }
    } catch (e) { /* fallback */ }
  }

  // Fallback: Google scraping
  try {
    const gurl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${count}&hl=fr`;
    const res = await fetch(gurl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
    });
    const html = await res.text();
    const results: { title: string; url: string; snippet: string }[] = [];
    // Simple regex extraction
    const blocks = html.split('<div class="g"').slice(1, count + 1);
    for (const block of blocks) {
      const urlMatch = block.match(/href="(https?:\/\/[^"]+)"/);
      const titleMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
      const snippetMatch = block.match(/<span[^>]*class="[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      if (urlMatch) {
        results.push({
          title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "") : "",
          url: urlMatch[1],
          snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").slice(0, 200) : "",
        });
      }
    }
    return Response.json({ results, source: "google-scrape" });
  } catch {
    return Response.json({ results: [], source: "none" });
  }
}
