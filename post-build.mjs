import { readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const clientDir = "dist/client";
const assetsDir = join(clientDir, "assets");

if (!existsSync(assetsDir)) {
  console.error("❌ dist/client/assets not found. Run build first.");
  process.exit(1);
}

const files = readdirSync(assetsDir);
const jsFiles  = files.filter(f => f.endsWith(".js"));
const cssFiles = files.filter(f => f.endsWith(".css"));

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
${linkTags}
    <script>
      window.__TSR__ = { matches: [], streamed: {}, streamedValues: {} };
    </script>
  </head>
  <body>
    <div id="root"></div>
${scriptTags}
  </body>
</html>`;

writeFileSync(join(clientDir, "index.html"), html, "utf-8");
console.log("✅ index.html generated for static deployment.");
