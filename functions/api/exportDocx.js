// functions/api/exportDocx.js

export async function exportDocxHandler(req, res) {
  try {
    const { manuscript } = req.body || {};
    // TODO: Plug in your real DOCX generation here
    return res.json({ ok: true, message: "DOCX export placeholder working" });
  } catch (err) {
    console.error("export-docx error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
