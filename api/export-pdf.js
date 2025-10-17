// api/export-pdf.js
import PDFDocument from "pdfkit";

export const config = { runtime: "nodejs18.x" };

function renderPdfToBuffer(manuscript = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 54, left: 54, right: 54, bottom: 54 }
    });

    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const title = manuscript.title || "Untitled";
    const subtitle = manuscript.subtitle || "";
    const author = manuscript.author || "Anonymous";
    const chapters = manuscript.chapters || [];

    // Title area (first page)
    doc.fontSize(22).font("Times-Bold").text(title, { align: "center" });
    if (subtitle) doc.moveDown(0.3).fontSize(14).font("Times-Italic").text(subtitle, { align: "center" });
    doc.moveDown(0.5).fontSize(11).font("Times-Roman").text(author, { align: "center" });
    doc.moveDown(1.2);
    doc.moveTo(54, doc.y).lineTo(doc.page.width - 54, doc.y).strokeColor("#888").lineWidth(0.5).stroke();

    // Chapters
    chapters.forEach((ch, i) => {
      const heading = ch?.title || `Chapter ${i + 1}`;
      const content = (ch?.content || "").trim();

      doc.addPage();
      doc.fontSize(16).font("Times-Bold").fillColor("#000").text(heading, { align: "left" });
      doc.moveDown(0.5);

      const paras = content.split(/\n\s*\n+/);
      doc.fontSize(12).font("Times-Roman").fillColor("#000");
      paras.forEach((p, idx) => {
        const text = p.replace(/\s+\n/g, " ").replace(/\n/g, " ").trim();
        if (text) doc.text(text, { align: "justify" });
        if (idx < paras.length - 1) doc.moveDown(0.6);
      });
    });

    if (!chapters.length) {
      doc.addPage();
      doc.fontSize(12).font("Times-Italic").fillColor("#333").text("No chapters provided.", { align: "left" });
    }

    doc.end();
  });
}

export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { manuscript } = body || {};

    const buffer = await renderPdfToBuffer(manuscript || {});
    const safeName = (manuscript?.title || "book").replace(/[^\w\-]+/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    res.status(200).send(buffer);
  } catch (e) {
    console.error("[export-pdf] Error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
  res.setHeader('Content-Length', String(buffer.length));
}
