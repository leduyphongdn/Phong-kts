// Nhập ảnh/video + nội dung từ state JSON của artifact (đã trích ra file) vào site.
// Chạy: node scripts/import-artifact.mjs <đường dẫn state.json>
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const st = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const IMG = path.resolve("public/img");
fs.rmSync(path.join(IMG, "projects"), { recursive: true, force: true });
fs.mkdirSync(path.join(IMG, "projects"), { recursive: true });
fs.mkdirSync("public/video", { recursive: true });
const buf = (d) => Buffer.from(d.split(",")[1], "base64");

async function webp(input, out, width, q) {
  await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: q, effort: 5 }).toFile(out);
}

// hero + portrait
await webp(buf(st.hero), path.join(IMG, "hero.webp"), 2400, 80);
await webp(buf(st.portrait), path.join(IMG, "portrait.webp"), 1200, 80);
const hm = await sharp(path.join(IMG, "hero.webp")).metadata();
const pm = await sharp(path.join(IMG, "portrait.webp")).metadata();
fs.writeFileSync("public/video/hero.mp4", buf(st.heroVideo));

const old = fs.existsSync("content/projects.json") ? JSON.parse(fs.readFileSync("content/projects.json", "utf8")) : [];
const projects = [];
for (const p of st.projects) {
  const dir = path.join(IMG, "projects", p.id);
  fs.mkdirSync(dir, { recursive: true });
  const seen = new Set();
  const images = [];
  for (const d of [p.img, ...p.gallery]) {
    const b = buf(d);
    const h = crypto.createHash("md5").update(b).digest("hex");
    if (seen.has(h)) continue;
    seen.add(h);
    const n = String(images.length + 1).padStart(2, "0");
    await webp(b, path.join(dir, `${n}.webp`), 2200, 80);
    await webp(b, path.join(dir, `${n}-s.webp`), 800, 74);
    const m = await sharp(path.join(dir, `${n}.webp`)).metadata();
    images.push({ src: `${n}.webp`, w: m.width, h: m.height });
  }
  projects.push({
    id: p.id, slug: p.id, category: p.cat, featured: true, title: p.title, location: p.place,
    year: "", client: "", area: "", role: "",
    summary: { vi: p.desc, en: old.find((o) => o.id === p.id)?.summary?.en || "" },
    cover: 0, images,
  });
  console.log(p.id, images.length);
}
fs.writeFileSync("content/projects.json", JSON.stringify(projects, null, 2));
fs.writeFileSync("content/profile.json", JSON.stringify({
  name: st.name, kana: st.kana, role1: st.role1, role1jp: st.role1jp, role2: st.role2, role2jp: st.role2jp,
  lead: st.lead, about1: st.about1, about2: st.about2, f1: st.f1, f2: st.f2, f3: st.f3,
  email: st.email, phone: st.phone, address: st.address,
  hero: { w: hm.width, h: hm.height }, portrait: { w: pm.width, h: pm.height },
}, null, 2));
