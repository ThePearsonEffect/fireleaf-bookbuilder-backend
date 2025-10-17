// api/health.js
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    time: new Date().toISOString()
  });
}
