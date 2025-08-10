import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Upstream services
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://ollama:11434";
const DEFAULT_MODEL = process.env.MODEL_NAME || "gpt-oss:20b";
const FALLBACK_MODEL = process.env.FALLBACK_MODEL || "llama3.1:8b";
const RAG_BASE = process.env.RAG_API_URL || "http://localhost:9000";

app.use(express.json({ limit: "25mb" }));
app.use(express.static("public"));

// ---- Health ----
app.get("/health", (_, res) => {
  res.json({ ok: true, model: DEFAULT_MODEL, fallback: FALLBACK_MODEL, base: OLLAMA_BASE_URL, rag: RAG_BASE });
});

// ---- Models list passthrough ----
app.get("/api/models", async (_, res) => {
  try {
    const r = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!r.ok) return res.status(502).json({ error: "Upstream tags failed", status: r.status });
    const tags = await r.json();
    res.json((tags.models || []).map(m => m.name));
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch models", detail: String(e) });
  }
});

// ---- Helpers for fallback streaming ----
const memErrors = [
  "model requires more system memory",
  "insufficient system memory",
  "not enough memory",
];
async function tryOnce(path, payload) {
  const r = await fetch(`${OLLAMA_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r;
}
async function streamWithFallback(path, payload, res) {
  let modelUsed = payload.model || DEFAULT_MODEL;
  let r = await tryOnce(path, { ...payload, stream: true, model: modelUsed });
  if (!r.ok || !r.body) {
    const body = await r.text().catch(() => "");
    const shouldFallback =
      (payload.model == null || payload.model === DEFAULT_MODEL) &&
      FALLBACK_MODEL &&
      (memErrors.some(s => body.toLowerCase().includes(s)) || !r.ok);
    if (shouldFallback) {
      modelUsed = FALLBACK_MODEL;
      r = await tryOnce(path, { ...payload, stream: true, model: modelUsed });
    } else {
      res.status(502).type("text/plain").send("Upstream error:\n" + body);
      return;
    }
  }
  if (!r.ok || !r.body) {
    const text = await r.text().catch(() => "");
    res.status(502).type("text/plain").send("Upstream error:\n" + text);
    return;
  }
  res.setHeader("x-model-used", modelUsed);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const json = JSON.parse(line);
        if (json.response) res.write(json.response); // /api/generate
        if (json.message && typeof json.message.content === "string") res.write(json.message.content); // /api/chat
        if (json.done) { res.end(); return; }
      } catch {}
    }
  }
  res.end();
}

// ---- Chat/generate endpoints ----
app.post("/api/generate", async (req, res) => {
  const { prompt = "", system = "", options = {}, model } = req.body || {};
  await streamWithFallback("/api/generate", { prompt, system, options, model }, res);
});
app.post("/api/chat", async (req, res) => {
  const { messages = [], options = {}, model } = req.body || {};
  await streamWithFallback("/api/chat", { messages, options, model }, res);
});

// ---- RAG proxies ----
app.get("/admin", (_, res) => res.sendFile(process.cwd() + "/public/admin.html"));

app.post("/api/ingest", async (req, res) => {
  try {
    const upstream = await fetch(`${RAG_BASE}/ingest`, { method: "POST", headers: { ...req.headers }, body: req });
    const text = await upstream.text();
    res.status(upstream.status).type(upstream.headers.get("content-type") || "application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "Proxy /ingest failed", detail: String(e) });
  }
});
app.post("/api/ingest_urls", async (req, res) => {
  try {
    const upstream = await fetch(`${RAG_BASE}/ingest_urls`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req.body)
    });
    const text = await upstream.text();
    res.status(upstream.status).type(upstream.headers.get("content-type") || "application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "Proxy /ingest_urls failed", detail: String(e) });
  }
});
app.post("/api/ingest_sharepoint", async (req, res) => {
  try {
    const upstream = await fetch(`${RAG_BASE}/ingest_sharepoint`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req.body)
    });
    const text = await upstream.text();
    res.status(upstream.status).type(upstream.headers.get("content-type") || "application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "Proxy /ingest_sharepoint failed", detail: String(e) });
  }
});
app.get("/api/config", async (_, res) => {
  try {
    const r = await fetch(`${RAG_BASE}/config`);
    const text = await r.text();
    res.status(r.status).type(r.headers.get("content-type") || "application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "Proxy /config failed", detail: String(e) });
  }
});
app.post("/api/config", async (req, res) => {
  try {
    const r = await fetch(`${RAG_BASE}/config`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.status(r.status).type(r.headers.get("content-type") || "application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "Proxy /config failed", detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`UI http://localhost:${PORT} | Ollama ${OLLAMA_BASE_URL} | default ${DEFAULT_MODEL} | fallback ${FALLBACK_MODEL} | rag ${RAG_BASE}`);
});
