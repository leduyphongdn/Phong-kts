// Quét thư mục PROJECTS, nén ảnh sang WebP và sinh content/projects.json (chỉ tạo lần đầu).
// Chạy: npm run images   (SOURCE_DIR có thể đổi bằng biến môi trường)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = process.env.SOURCE_DIR || "F:/Claude Workspace - Phong/PROJECTS/TỔNG HỢP DỰ ÁN";
const OUT = path.resolve("public/img/projects");
const DATA = path.resolve("content/projects.json");
const CATS = {
  "ARCHITECTURE PROJECT": "architecture",
  "INTERIOR & LANDSCAPE PROJECT": "interior",
  "ONSEN": "onsen",
  "PLANNING PROJECT": "planning",
};
const IMG = /\.(jpe?g|png)$/i;

const fold = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d");
const slugify = (s) => fold(s).toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s\-–(])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true });

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : IMG.test(e.name) ? [p] : [];
  });
}

// một ảnh chỉ lấy một lần (ưu tiên jpg nhỏ hơn png trùng tên)
function collect(dir) {
  const byName = new Map();
  for (const f of walk(dir).sort(natural)) {
    const key = path.basename(f).replace(/\.[^.]+$/, "").toLowerCase();
    const prev = byName.get(key);
    if (!prev || (/\.png$/i.test(prev) && !/\.png$/i.test(f))) byName.set(key, f);
  }
  return [...byName.values()].sort(natural);
}

const existing = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, "utf8")) : [];
const known = new Map(existing.map((p) => [p.id, p]));
const projects = [];
const used = new Set();

for (const catDir of fs.readdirSync(SOURCE, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const category = CATS[catDir.name];
  if (!category) continue;
  for (const pd of fs.readdirSync(path.join(SOURCE, catDir.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const files = collect(path.join(SOURCE, catDir.name, pd.name));
    if (!files.length) continue;
    let slug = slugify(pd.name);
    if (used.has(slug)) slug += "-" + category;
    used.add(slug);

    const dest = path.join(OUT, slug);
    fs.mkdirSync(dest, { recursive: true });
    const images = [];
    let i = 0;
    for (const f of files) {
      i++;
      const name = String(i).padStart(2, "0");
      const big = path.join(dest, `${name}.webp`);
      const thumb = path.join(dest, `${name}-s.webp`);
      let meta;
      try {
        if (!fs.existsSync(big)) {
          await sharp(f).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toFile(big);
        }
        if (!fs.existsSync(thumb)) {
          await sharp(f).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 72, effort: 4 }).toFile(thumb);
        }
        meta = await sharp(big).metadata();
      } catch (e) {
        console.warn("bỏ qua", f, e.message);
        continue;
      }
      images.push({ src: `${name}.webp`, w: meta.width, h: meta.height });
    }
    const id = slug;
    const old = known.get(id) || {};
    projects.push({
      id,
      slug,
      category,
      featured: old.featured ?? false,
      title: old.title || titleCase(pd.name),
      location: old.location ?? "",
      year: old.year ?? "",
      client: old.client ?? "",
      area: old.area ?? "",
      role: old.role ?? "",
      summary: old.summary ?? { vi: "", en: "" },
      cover: old.cover ?? 0,
      images,
    });
    console.log(`${category.padEnd(12)} ${slug} (${images.length})`);
  }
}
fs.mkdirSync(path.dirname(DATA), { recursive: true });
fs.writeFileSync(DATA, JSON.stringify(projects, null, 2));
console.log(`\n${projects.length} dự án → ${path.relative(".", DATA)}`);
