// post-build.mjs — generates a proper index.html for static hosting (Render/Netlify)
// Runs after `vite build` to replace the SSR placeholder with a real SPA shell.
import { readdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const clientDir = "dist/client";
const assetsDir = join(clientDir, "assets");

if (!existsSync(assetsDir)) {
  console.error("❌ dist/client/assets not found. Run `bun run build` first.");
  process.exit(1);
}

const files = readdirSync(assetsDir);
const jsFiles  = files.filter(f => f.endsWith(".js") && !f.includes("worker"));
const cssFiles = files.filter(f => f.endsWith(".css"));

// Sort: vendor/index chunks last so the entry point loads first
const scriptTags = jsFiles
  .map(f => `  <script type="module" crossorigin src="/assets/${f}"></script>`)
  .join("\n");

const linkTags = cssFiles
  .map(f => `  <link rel="stylesheet" crossorigin href="/assets/${f}">`)
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>School — Школьный портал</title>
    <meta name="description" content="Школьный портал: дневник, оценки, чат, домашние задания." />
${linkTags}
  </head>
  <body>
    <div id="root"></div>
${scriptTags}
  </body>
</html>
`;

writeFileSync(join(clientDir, "index.html"), html, "utf-8");
console.log("✅ index.html generated for static deployment.");
console.log(`   Scripts: ${jsFiles.join(", ")}`);
console.log(`   Styles:  ${cssFiles.join(", ")}`);
