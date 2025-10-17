// functions/api/exportEpub.js
export async function exportEpubHandler(req, res) {
  try {
    const { manuscript } = req.body || {};
    // TODO: plug in your real EPUB generation
    return res.json({ ok: true, message: "EPUB export placeholder working" });
  } catch (err) {
    console.error("export-epub error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
