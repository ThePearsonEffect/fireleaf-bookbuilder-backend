// functions/api/generate.js
// Example stub – plug in your real generation logic here.
export async function generateHandler(req, res) {
  try {
    const { topic, outline } = req.body || {};
    // TODO: call your model / pipeline here
    const result = { chapters: [{ title: "Chapter 1", text: "..." }] };
    return res.json({ ok: true, result });
  } catch (err) {
    console.error("generate error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
