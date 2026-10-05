// Quét thư mục PROJECTS/TỔNG HỢP DỰ ÁN → nén WebP vào public/img/projects và sinh content/projects.json.
// Thư mục nguồn là "nguồn sự thật": dự án không có trong thư mục sẽ không có trên web.
// Chạy: node scripts/import-source.mjs   (SOURCE_DIR đổi được bằng biến môi trường). Chạy lại sẽ bỏ qua ảnh đã nén.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = process.env.SOURCE_DIR || "F:/Claude Workspace - Phong/PROJECTS/TỔNG HỢP DỰ ÁN";
const OUT = path.resolve("public/img/projects");
const BIG = 2800, SMALL = 800;
const CATS = { "ARCHITECTURE PROJECT": "architecture", "INTERIOR & LANDSCAPE PROJECT": "interior", ONSEN: "onsen", "PLANNING PROJECT": "planning" };
const ALIAS = { "yoko onsen quang hanh": "yoko quang hanh" }; // tên thư mục khác nhau nhưng cùng một dự án
const overrides = fs.existsSync("content/overrides.json") ? JSON.parse(fs.readFileSync("content/overrides.json", "utf8")) : {};
const FEATURED = ["mikazuki", "my-an", "yoko-quang-hanh", "mori-onsen", "kim-boi", "dai-lai", "ecopark-sixsens-dong-nai", "amerys-phu-quoc", "sala-quy-nhon-beach-hotel"];
const TITLES = { "amerys-phu-quoc": "Amérys Phú Quốc", "hoa-binh-minh": "Hòa Bình Minh", "stc-long-thanh-hotel": "STC Long Thành Hotel", "tay-ho-tay-apartment": "Tây Hồ Tây Apartment", "shizen-home": "Shizen Home", "mori-onsen": "Mori Onsen", "dai-lai-village-resort": "Đại Lải Village Resort", "hon-do-resort": "Hòn Đỏ Resort", "ngoi-hoa-resort": "Ngôi Hoa Resort", "onsen-moc-chau": "Onsen Mộc Châu", "quanh-hanh-resort": "Quang Hanh Resort", "landmark-da-nang": "Landmark Đà Nẵng", "dong-tac-fishing-port": "Đồng Tác Fishing Port", "nhan-tong": "Nhân Tông", "ngoa-van-ho-thien-cultural-tourist-area": "Ngọa Vân – Hồ Thiên Cultural Tourist Area", "sala-quy-nhon-beach-hotel": "Sala Quy Nhơn Beach Hotel", "vinaconex-diamond": "Vinaconex Diamond", "center-point-building": "Center Point Building", "sala-apartment": "Sala Apartment", "sala-landmark-competition": "Sala Landmark Competition", "viettel": "Viettel", "ecopark-sixsens-dong-nai": "Ecopark Six Senses – Đồng Nai", "my-an": "Mỹ An", "yoko-quang-hanh": "Yoko Quang Hanh", "kim-boi": "Kim Bôi", "dai-lai": "Đại Lải", "mikazuki": "Mikazuki" };

const fold = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d");
const slugify = (s) => fold(s).toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const IMG = /\.(jpe?g|png)$/i;
const FMT = new Set(["jpeg", "jpg", "png"]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : IMG.test(e.name) ? [p] : [];
  });
}
// cùng một ảnh có thể có bản PNG và bản JPEG (thư mục JPEG/): chỉ lấy một, ưu tiên JPEG
function collect(dir) {
  const byKey = new Map();
  for (const f of walk(dir).sort(natural)) {
    const rel = path.relative(dir, f).split(path.sep);
    const key = rel.filter((s, i) => !(i < rel.length - 1 && FMT.has(s.toLowerCase()))).join("/").replace(/\.[^.]+$/, "").toLowerCase();
    const prev = byKey.get(key);
    if (!prev || (/\.png$/i.test(prev) && !/\.png$/i.test(f))) byKey.set(key, f);
  }
  return [...byKey.values()].sort(natural);
}

// gom thư mục cùng dự án (khác nhóm) lại với nhau
const groups = new Map();
for (const catDir of fs.readdirSync(SOURCE, { withFileTypes: true }).filter((d) => d.isDirectory() && CATS[d.name])) {
  for (const pd of fs.readdirSync(path.join(SOURCE, catDir.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    let key = fold(pd.name).toLowerCase().replace(/\s+/g, " ").trim();
    key = ALIAS[key] || key;
    const g = groups.get(key) || { name: pd.name, dirs: [], cats: [] };
    g.dirs.push({ dir: path.join(SOURCE, catDir.name, pd.name), cat: CATS[catDir.name] });
    g.cats.push(CATS[catDir.name]);
    if (CATS[catDir.name] === "onsen") g.name = pd.name;
    groups.set(key, g);
  }
}

fs.mkdirSync(OUT, { recursive: true });
const keep = new Set();
const projects = [];
for (const g of groups.values()) {
  const slug = slugify(g.name);
  keep.add(slug);
  const ov = overrides[slug] || {};
  const order = ["onsen", "interior", "architecture", "planning"];
  g.dirs.sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat));
  const files = g.dirs.flatMap((d) => collect(d.dir));
  if (!files.length) continue;
  const dest = path.join(OUT, slug);
  fs.mkdirSync(dest, { recursive: true });
  const images = [];
  let i = 0;
  for (const f of files) {
    const name = String(++i).padStart(2, "0");
    const big = path.join(dest, `${name}.webp`), small = path.join(dest, `${name}-s.webp`);
    try {
      if (!fs.existsSync(big)) await sharp(f, { limitInputPixels: false }).rotate().resize({ width: BIG, height: BIG, fit: "inside", withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toFile(big);
      if (!fs.existsSync(small)) await sharp(big).resize({ width: SMALL, withoutEnlargement: true }).webp({ quality: 74, effort: 4 }).toFile(small);
      const m = await sharp(big).metadata();
      images.push({ src: `${name}.webp`, w: m.width, h: m.height });
    } catch (e) {
      console.warn("bỏ qua", f, e.message);
    }
  }
  const category = ov.category || g.dirs[0].cat;
  projects.push({
    id: slug, slug, category, featured: FEATURED.includes(slug),
    title: ov.title || TITLES[slug] || g.name.toLowerCase().replace(/(^|[\s\-–(])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()),
    location: ov.location || "", year: "", client: "", area: "", role: "",
    summary: ov.summary || { vi: "", en: "" }, cover: 0, images,
  });
  console.log(category.padEnd(12), slug, images.length);
}
// xóa thư mục ảnh của dự án không còn trong nguồn
for (const d of fs.readdirSync(OUT)) if (!keep.has(d)) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });

const catOrder = ["onsen", "architecture", "interior", "planning"];
projects.sort((a, b) => {
  const fa = FEATURED.indexOf(a.slug), fb = FEATURED.indexOf(b.slug);
  if (fa >= 0 || fb >= 0) return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb);
  return catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || natural(a.title, b.title);
});
fs.writeFileSync("content/projects.json", JSON.stringify(projects, null, 2));
console.log(`\n${projects.length} dự án, ${projects.reduce((n, p) => n + p.images.length, 0)} ảnh`);
