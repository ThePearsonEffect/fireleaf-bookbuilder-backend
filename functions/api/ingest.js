// functions/api/ingest.js
import { db } from "../services/firebaseAdmin.js";

export async function ingestHandler(req, res) {
  try {
    const { userId = "anonymous", content = "" } = req.body || {};
    const ref = await db.collection("ingests").add({
      userId, content, createdAt: new Date()
    });
    return res.json({ ok: true, id: ref.id });
  } catch (err) {
    console.error("ingest error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
