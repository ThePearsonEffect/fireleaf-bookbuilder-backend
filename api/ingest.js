// api/ingest.js
import mammoth from "mammoth";
import pdf from "pdf-parse";

// Vercel/Node serverless config (Node 18 has global fetch)
export const config = {
  runtime: "nodejs18.x",
  api: { bodyParser: { sizeLimit: "25mb" } }
};

// --- helpers ---------------------------------------------------------------

async function fetchBufferAndType(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch failed ${r.status}`);
  const ab = await r.arrayBuffer();
  const buf = Buffer.from(ab);
  const contentType = r.headers.get("content-type") || "";
  return { buf, contentType };
}

function detectType(buf, filename = "", headerCT = "") {
  const name = (filename || "").toLowerCase();
  const ct = (headerCT || "").toLowerCase();

  // Magic bytes
  const isPdfMagic = buf.slice(0, 5).equals(Buffer.from("%PDF-"));
  const isZipMagic =
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    buf[2] === 0x03 &&
    buf[3] === 0x04;

  if (isPdfMagic || ct.includes("application/pdf") || name.endsWith(".pdf")) return "pdf";

  const docxLike =
    name.endsWith(".docx") ||
    ct.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  if (isZipMagic && docxLike) return "docx";

  if (ct.startsWith("text/") || name.endsWith(".txt")) return "txt";

  return "unknown";
}

// --- handler ---------------------------------------------------------------

/**
 * POST { url: string, filename?: string }
 * -> { text: string, meta: { filename, bytes, type, pages? } }
 */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Support raw stringified bodies (some hosts send req.body as string)
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { url, filename = "" } = body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing required field: url" });
    }

    // Fetch file
    const { buf, contentType } = await fetchBufferAndType(url);
    const bytes = buf.length;

    // Soft size guard (bodyParser also enforces 25MB)
    const MAX_BYTES = 25 * 1024 * 1024;
    if (bytes > MAX_BYTES) {
      return res
        .status(413)
        .json({ error: `File too large (${bytes} bytes). Max ${MAX_BYTES} bytes.` });
    }

    // Detect and parse
    const type = detectType(buf, filename, contentType);
    let text = "";
    let pages;

    if (type === "pdf") {
      const out = await pdf(buf);
      text = (out?.text || "").trim();
      pages = out?.numpages ?? out?.numrender;
    } else if (type === "docx") {
      const out = await mammoth.extractRawText({ buffer: buf });
      text = (out?.value || "").trim();
    } else if (type === "txt") {
      text = buf.toString("utf8").replace(/\u0000/g, "").trim();
    } else {
      // Fallback: try DOCX first, then PDF, then UTF-8
      try {
        const out1 = await mammoth.extractRawText({ buffer: buf });
        text = (out1?.value || "").trim();
        if (!text) throw new Error("empty-docx");
      } catch {
        try {
          const out2 = await pdf(buf);
          text = (out2?.text || "").trim();
          pages = out2?.numpages ?? out2?.numrender;
        } catch {
          text = buf.toString("utf8").replace(/\u0000/g, "").trim();
        }
      }
      if (!text) {
        return res
          .status(415)
          .json({ error: `Unsupported or unrecognized file type. Detected: "${type}".` });
      }
    }

    return res.status(200).json({
      text,
      meta: { filename, bytes, type, pages }
    });
  } catch (err) {
    console.error("[API:ingest] Error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
