// Renderiza planos completos a clips MP4: node render.js <fps> <n1,n2,...>
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
(async () => {
  const fps = +process.argv[2];
  const lista = process.argv[3].split(",").map(Number);
  const TL = JSON.parse(fs.readFileSync("timeline.json", "utf8"));
  fs.mkdirSync("segs", { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 576, height: 1024 } });
  p.on("pageerror", e => console.log("PAGEERROR", e.message));
  await p.goto("http://127.0.0.1:8765/index.html");
  await p.waitForFunction(() => window.listo, null, { timeout: 120000 });
  for (const n of lista) {
    const P = TL.planos[n - 1];
    const f0 = Math.ceil(P.ini * fps - 1e-6), f1 = n === TL.planos.length ? Math.round(TL.total * fps) : Math.ceil(P.fin * fps - 1e-6);
    const out = `segs/seg_${String(n).padStart(2, "0")}.mp4`;
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", out + ".tmp.mp4"]);
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      const data = await p.evaluate((t) => { window.renderAt(t); return document.querySelector("canvas").toDataURL("image/jpeg", 0.95); }, f / fps);
      const buf = Buffer.from(data.split(",")[1], "base64");
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    }
    ff.stdin.end();
    await new Promise(r => ff.on("close", r));
    fs.renameSync(out + ".tmp.mp4", out);
    console.log(`plano ${n}: ${f1 - f0} fotogramas en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await b.close();
})();
