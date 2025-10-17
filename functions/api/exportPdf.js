// functions/api/exportPdf.js
export async function exportPdfHandler(req, res) {
  try {
    const { manuscript } = req.body || {};
    // TODO: plug in your real PDF generation
    return res.json({ ok: true, message: "PDF export placeholder working" });
  } catch (err) {
    console.error("export-pdf error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
