import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";

dotenv.config();

const logFile = path.join(process.cwd(), "src", "proxy-log.txt");
const logProxy = (msg: string) => {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
  } catch (e) {}
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy to API Football
  app.get("/api/football/fixtures", async (req, res) => {
    try {
      const apiKey = process.env.API_FOOTBALL_KEY;
      if (!apiKey) {
        return res.json({ response: [] }); // Graceful handle if no key
      }
      const response = await axios.get("https://v3.football.api-sports.io/fixtures", {
        params: { 
          date: new Date().toISOString().split('T')[0],
          timezone: "Africa/Cairo"
        },
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "v3.football.api-sports.io"
        }
      });
      res.json(response.data);
    } catch (error) {
      console.error("Football API Error:", error);
      res.status(500).json({ error: "Failed to fetch fixtures" });
    }
  });

  // Proxy to TMDB
  app.get("/api/tmdb/trending", async (req, res) => {
    try {
      const apiKey = process.env.TMDB_API_KEY;
      if (!apiKey) return res.json({ results: [] });
      const response = await axios.get(`https://api.themoviedb.org/3/trending/all/day`, {
        params: { api_key: apiKey, language: "ar" }
      });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending media" });
    }
  });

  app.get("/api/tmdb/search", async (req, res) => {
    try {
      const { query } = req.query;
      const apiKey = process.env.TMDB_API_KEY;
      if (!apiKey || !query) return res.json({ results: [] });
      
      const response = await axios.get(`https://api.themoviedb.org/3/search/multi`, {
        params: { 
          api_key: apiKey, 
          query,
          language: "ar",
          include_adult: false
        }
      });
      res.json(response.data);
    } catch (error) {
      console.error("TMDB Search Error:", error);
      res.status(500).json({ error: "Failed to search TMDB" });
    }
  });

  // --- Dynamic CORS Proxy with M3U8 relative URL rewriting ---
  app.all(["/api/proxy", "/api/proxy/*"], async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    let targetUrl = req.query.url as string;
    if (!targetUrl) {
      logProxy("Error: Missing target url parameter in Request");
      return res.status(400).send("Missing target URL ('url' parameter)");
    }

    targetUrl = targetUrl.trim();
    if (targetUrl.startsWith("ttps://")) {
      targetUrl = "https://" + targetUrl.substring(7);
    } else if (targetUrl.startsWith("ttp://")) {
      targetUrl = "http://" + targetUrl.substring(6);
    }

    logProxy(`Proxy route invoked for: ${req.method} ${req.path} -> raw: ${targetUrl}`);

    try {
      const isM3U8 = targetUrl.split(/[#?]/)[0].endsWith(".m3u8");

      // Use a media player user agent for stream playlists / segments to bypass hotlink blockers
      const headers: Record<string, string> = {
        "User-Agent": "VLC/3.0.18 LibVLC/3.0.18",
        "Accept": "*/*"
      };

      // Forward Range header if present
      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }

      if (targetUrl.includes("alkass") || targetUrl.includes("alkassdigital")) {
        headers["Origin"] = "https://shoof.alkass.net";
        headers["Referer"] = "https://shoof.alkass.net/";
        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      }

      // Ignore self-signed or invalid SSL/TLS certificate errors
      const agent = new https.Agent({ rejectUnauthorized: false });

      const response = await axios({
        method: "GET",
        url: targetUrl,
        headers,
        responseType: isM3U8 ? "text" : "stream",
        timeout: 25000,
        httpsAgent: agent,
        validateStatus: () => true
      });

      logProxy(`Target server returned status: ${response.status} for ${targetUrl}`);

      res.status(response.status);

      const contentType = response.headers["content-type"];
      if (typeof contentType === "string") {
        res.setHeader("Content-Type", contentType);
      } else if (isM3U8) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      }

      // Forward range-seeking headers if existing
      if (response.headers["content-range"]) {
        res.setHeader("Content-Range", String(response.headers["content-range"]));
      }
      if (response.headers["accept-ranges"]) {
        res.setHeader("Accept-Ranges", String(response.headers["accept-ranges"]));
      }
      if (response.headers["content-length"]) {
        res.setHeader("Content-Length", String(response.headers["content-length"]));
      }

      if (isM3U8) {
        let content = response.data;
        if (typeof content !== "string" && content) {
          content = content.toString();
        }
        if (typeof content === "string") {
          const hostUrl = "";
          // Helper function for rewriting m3u8 playlists
          const basePath = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
          const lines = content.split(/\r?\n/);
          const rewrittenLines = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            if (trimmed.startsWith("#")) {
              return line.replace(/(URI\s*=\s*["'])([^"'\s]+)(["'])/gi, (match, prefix, uri, suffix) => {
                try {
                  let cleanUri = uri.trim();
                  if (cleanUri.startsWith("ttps://")) {
                    cleanUri = "https://" + cleanUri.substring(7);
                  } else if (cleanUri.startsWith("ttp://")) {
                    cleanUri = "http://" + cleanUri.substring(6);
                  }
                  const resolvedUrl = new URL(cleanUri, basePath).href;
                  const isM3u8Sub = resolvedUrl.split(/[#?]/)[0].endsWith(".m3u8");
                  const proxyPath = isM3u8Sub ? "/api/proxy/stream.m3u8" : "/api/proxy/resource";
                  return `${prefix}${hostUrl}${proxyPath}?url=${encodeURIComponent(resolvedUrl)}${suffix}`;
                } catch (e) {
                  return match;
                }
              });
            }

            try {
              let cleanTrimmed = trimmed;
              if (cleanTrimmed.startsWith("ttps://")) {
                cleanTrimmed = "https://" + cleanTrimmed.substring(7);
              } else if (cleanTrimmed.startsWith("ttp://")) {
                cleanTrimmed = "http://" + cleanTrimmed.substring(6);
              }
              const resolvedUrl = new URL(cleanTrimmed, basePath).href;
              const isM3u8Sub = resolvedUrl.split(/[#?]/)[0].endsWith(".m3u8");
              const isTsSub = resolvedUrl.split(/[#?]/)[0].endsWith(".ts");
              let proxyPath = "/api/proxy/resource";
              if (isM3u8Sub) {
                proxyPath = "/api/proxy/stream.m3u8";
              } else if (isTsSub) {
                proxyPath = "/api/proxy/segment.ts";
              }
              return `${hostUrl}${proxyPath}?url=${encodeURIComponent(resolvedUrl)}`;
            } catch (e) {
              return line;
            }
          });

          return res.send(rewrittenLines.join("\n"));
        }
      }

      if (response.data && typeof response.data.pipe === "function") {
        response.data.pipe(res);
      } else {
        res.send(response.data);
      }
    } catch (error: any) {
      logProxy(`Proxy Error for URL ${targetUrl}: ${error?.message || error}`);
      console.error("Proxy Error for URL:", targetUrl, error?.message || error);
      if (!res.headersSent) {
        res.status(502).send("Proxy error: " + (error?.message || "Unknown error"));
      }
    }
  });

  // --- Vite Middleware ---

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
    console.log(`Stadium Live server running on http://localhost:${PORT}`);
  });
}

startServer();
