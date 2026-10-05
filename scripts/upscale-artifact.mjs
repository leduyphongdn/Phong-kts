// Upscale ảnh gốc của artifact lên ~4K (Lanczos3 + làm nét nhẹ), ghi đè ảnh lớn trong public/img.
// Chạy: node scripts/upscale-artifact.mjs <artifact.html>
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const html = fs.readFileSync(process.argv[2], "utf8");
const a = html.indexOf('id="state">') + 11;
const st = JSON.parse(html.slice(a, html.indexOf("</script>", a)));
const buf = (d) => Buffer.from(d.split(",")[1], "base64");
const IMG = path.resolve("public/img");
const LAND = 3840, PORT = 2700;

async function up(input, out, q = 82) {
  const m = await sharp(input).metadata();
  const landscape = m.width >= m.height;
  const img = sharp(input).rotate();
  const r = landscape
    ? img.resize({ width: LAND, kernel: "lanczos3" })
    : img.resize({ height: PORT, kernel: "lanczos3" });
  await r.sharpen({ sigma: 0.9, m1: 0.5, m2: 2 }).webp({ quality: q, effort: 5 }).toFile(out);
  const o = await sharp(out).metadata();
  return { w: o.width, h: o.height };
}

await up(buf(st.hero), path.join(IMG, "hero.webp"));
const hm = await sharp(path.join(IMG, "hero.webp")).metadata();
await up(buf(st.portrait), path.join(IMG, "portrait.webp"));
const pm = await sharp(path.join(IMG, "portrait.webp")).metadata();

const projects = JSON.parse(fs.readFileSync("content/projects.json", "utf8"));
for (const p of st.projects) {
  const target = projects.find((x) => x.id === p.id);
  const seen = new Set();
  let k = 0;
  for (const d of [p.img, ...p.gallery]) {
    const b = buf(d);
    const h = crypto.createHash("md5").update(b).digest("hex");
    if (seen.has(h)) continue;
    seen.add(h);
    const n = String(++k).padStart(2, "0");
    const dim = await up(b, path.join(IMG, "projects", p.id, `${n}.webp`));
    target.images[k - 1].w = dim.w;
    target.images[k - 1].h = dim.h;
  }
  console.log(p.id, k);
}
fs.writeFileSync("content/projects.json", JSON.stringify(projects, null, 2));
const prof = JSON.parse(fs.readFileSync("content/profile.json", "utf8"));
prof.hero = { w: hm.width, h: hm.height };
prof.portrait = { w: pm.width, h: pm.height };
fs.writeFileSync("content/profile.json", JSON.stringify(prof, null, 2));
