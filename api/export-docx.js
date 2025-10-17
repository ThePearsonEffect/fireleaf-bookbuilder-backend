// api/export-docx.js
import { Document, Packer, Paragraph, HeadingLevel } from "docx";

export const config = { runtime: "nodejs18.x" };

function docFromManuscript(m) {
  const children = [];
  if (m?.title) children.push(new Paragraph({ text: m.title, heading: HeadingLevel.TITLE }));
  if (m?.subtitle) children.push(new Paragraph({ text: m.subtitle, heading: HeadingLevel.HEADING_2 }));
  children.push(new Paragraph({ text: "" }));

  (m?.chapters || []).forEach((ch) => {
    if (ch?.title) children.push(new Paragraph({ text: ch.title, heading: HeadingLevel.HEADING_1 }));
    const paras = (ch?.content || "").split(/\n{2,}/);
    paras.forEach(p => children.push(new Paragraph(p)));
    children.push(new Paragraph({ text: "" }));
  });

  return new Document({ sections: [{ properties: {}, children }] });
}

export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { manuscript } = body || {};
    const doc = docFromManuscript(manuscript || { title: "Untitled", chapters: [] });
    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${(manuscript?.title || "book").replace(/[^\w\-]+/g,"_")}.docx"`);
    res.status(200).send(buffer);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
  res.setHeader('Content-Length', String(buffer.length));

}
