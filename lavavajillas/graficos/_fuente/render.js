// Exporta cada gráfico de graficos.html a PNG transparente 1080×1920.
// Uso: node render.js <graficos.json> <graficos.html> <carpeta_salida> [--preview]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const [lista, html, salida] = process.argv.slice(2);
  const preview = process.argv.includes("--preview");
  const graficos = JSON.parse(fs.readFileSync(lista, "utf8"));
  fs.mkdirSync(salida, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  for (const g of graficos) {
    const url = "file://" + path.resolve(html) + "?g=" + g.slug + (preview ? "&preview" : "");
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(salida, g.file), omitBackground: !preview });
    process.stdout.write(g.file + " ");
  }
  await browser.close();
  console.log("\nok", graficos.length);
})();
