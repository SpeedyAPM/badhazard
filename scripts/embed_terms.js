const fs = require('fs');
const path = require('path');

function extractParts(html) {
  const styles = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRegex.exec(html))) styles.push(m[1]);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  return { css: styles.join('\n'), body };
}

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; }
}

function buildPage({ title, extraCss, body }) {
  return [
    '<!DOCTYPE html>',
    '<html lang="pl">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <title>${title}</title>`,
    '  <style>',
    '    html, body { height: 100%; }',
    '    body { margin: 0; }',
    '  </style>',
    extraCss ? `  <style>${extraCss}</style>` : '',
    '</head>',
    '<body>',
    body,
    '</body>',
    '</html>'
  ].filter(Boolean).join('\n');
}

function inlineFile({ sourcePath, targetPath, title }) {
  const srcHtml = readFileSafe(sourcePath);
  if (!srcHtml) {
    throw new Error(`Brak źródła: ${sourcePath}`);
  }
  const parts = extractParts(srcHtml);
  const out = buildPage({ title, extraCss: parts.css, body: parts.body });
  fs.writeFileSync(targetPath, out, 'utf8');
  console.log(`Zapisano: ${targetPath}`);
}

const root = path.join(__dirname, '..', 'public');

inlineFile({
  sourcePath: path.join(root, 'reg_true.html'),
  targetPath: path.join(root, 'regulamin_true.html'),
  title: 'Regulamin – wersja TRUE'
});

inlineFile({
  sourcePath: path.join(root, 'reg_false.html'),
  targetPath: path.join(root, 'regulamin_false.html'),
  title: 'Regulamin – wersja FALSE'
});

