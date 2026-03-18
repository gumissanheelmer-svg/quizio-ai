/**
 * Exports markdown content as a .docx file (Word-compatible HTML).
 */
export function downloadAsDocx(content: string, title: string) {
  // Convert basic markdown to HTML
  const html = markdownToHtml(content);

  const docContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Calibri', sans-serif; font-size: 12pt; line-height: 1.6; margin: 2cm; }
    h1 { font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 24pt; }
    h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; }
    h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
    p { margin-bottom: 6pt; text-align: justify; }
    ul, ol { margin-left: 20pt; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

  const blob = new Blob(['\ufeff' + docContent], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "trabalho"}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .split("\n\n")
    .map((block) => {
      block = block.trim();
      if (!block || block.startsWith("<h") || block.startsWith("<ul") || block.startsWith("<ol")) return block;
      return `<p>${block}</p>`;
    })
    .join("\n");
}
