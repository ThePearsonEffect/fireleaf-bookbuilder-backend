// api/export-epub.js
import JSZip from "jszip";
import { create } from "xmlbuilder2";

export const config = { runtime: "nodejs18.x" };

function escapeHtml(s = "") {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xhtmlPage({ title = "", bodyHtml = "" }) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
<article>
<h1>${escapeHtml(title)}</h1>
${bodyHtml}
</article>
</body>
</html>`;
}

function toParagraphsHtml(text = "") {
  const paras = String(text).split(/\n\s*\n+/).map(p => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br/>")}</p>`);
  return paras.join("\n");
}

export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { manuscript } = body || {};
    const title = (manuscript?.title || "Book").toString();
    const author = (manuscript?.author || "Unknown").toString();
    const chapters = Array.isArray(manuscript?.chapters) ? manuscript.chapters : [];

    const items = chapters.map((ch, i) => {
      const id = `ch${i + 1}`;
      const filename = `${id}.xhtml`;
      const chTitle = ch?.title || `Chapter ${i + 1}`;
      const contentHtml = toParagraphsHtml(ch?.content || "");
      const xhtml = xhtmlPage({ title: chTitle, bodyHtml: `<h2>${escapeHtml(chTitle)}</h2>\n${contentHtml}` });
      return { id, href: filename, title: chTitle, xhtml };
    });

    const styleCss = `body{font-family:serif;line-height:1.5;margin:1em;}
article{max-width:42em;margin:auto;}
h1,h2{page-break-after:avoid;}
p{margin:0 0 0.8em;}
`;

    const packageDoc = create({ version: "1.0", encoding: "utf-8" })
      .ele("package", {
        xmlns: "http://www.idpf.org/2007/opf",
        version: "3.0",
        "unique-identifier": "pub-id"
      })
      .ele("metadata", { "xmlns:dc": "http://purl.org/dc/elements/1.1/" })
        .ele("dc:identifier", { id: "pub-id" }).txt(`urn:uuid:${Date.now()}-${Math.random().toString(36).slice(2)}`).up()
        .ele("dc:title").txt(title).up()
        .ele("dc:creator").txt(author).up()
        .ele("meta", { property: "dcterms:modified" }).txt(new Date().toISOString().replace(/\.\d{3}Z$/, "Z")).up()
      .up()
      .ele("manifest")
        .ele("item", { id: "nav", href: "nav.xhtml", "media-type": "application/xhtml+xml", properties: "nav" }).up()
        .ele("item", { id: "css", href: "style.css", "media-type": "text/css" }).up()
        .up();

    const manifest = packageDoc.find((n) => n.node.nodeName === "manifest");
    items.forEach(({ id, href }) => {
      manifest.ele("item", { id, href, "media-type": "application/xhtml+xml" }).up();
    });

    const spine = packageDoc.root().ele("spine");
    items.forEach(({ id }) => spine.ele("itemref", { idref: id }).up());

    const contentOpf = packageDoc.end({ prettyPrint: true });

    const navDoc = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head><meta charset="utf-8"/><title>Table of Contents</title>
<link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<nav epub:type="toc" id="toc">
<h1>Contents</h1>
<ol>
${items.map(it => `<li><a href="${it.href}">${escapeHtml(it.title)}</a></li>`).join("\n")}
</ol>
</nav>
</body>
</html>`;

    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
    zip.file("META-INF/container.xml",
      `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`);
    const oebps = zip.folder("OEBPS");
    oebps.file("content.opf", contentOpf);
    oebps.file("nav.xhtml", navDoc);
    oebps.file("style.css", styleCss);
    items.forEach(it => oebps.file(it.href, it.xhtml));

    const epubBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    const safeName = title.replace(/[^\w\-]+/g, "_");
    res.setHeader("Content-Type", "application/epub+zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.epub"`);
    res.status(200).send(epubBuffer);
  } catch (e) {
    console.error("[export-epub] Error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
  res.setHeader('Content-Length', String(buffer.length));
}
