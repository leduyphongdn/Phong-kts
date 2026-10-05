// Tạo website tĩnh vào dist/ từ content/*.json + src/assets + public/.
// Chạy: npm run build
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(".");
const DIST = path.join(root, "dist");
const site = JSON.parse(fs.readFileSync("content/site.json", "utf8"));
const projects = JSON.parse(fs.readFileSync("content/projects.json", "utf8"));
const SITE_URL = (process.env.SITE_URL || site.siteUrl).replace(/\/$/, "");
const V = Date.now().toString(36);
// BASE_PATH: dùng khi site nằm trong thư mục con (vd GitHub Pages: /Phong-kts). Để trống nếu chạy ở gốc tên miền.
const BASE = (process.env.BASE_PATH || "").replace(/\/$/, "");
// thêm BASE vào mọi đường dẫn gốc "/img/...", "/du-an/...", href="/" ... (kể cả trong srcset)
const ROOTS = /([\s"'(,])\/(?=#|(?:img|video|assets|du-an|en|projects|ja|favicon[^"']*|apple-touch-icon\.png|404\.html|sitemap\.xml)\b|["'])/g;
const rebase = (html) => (BASE ? html.replace(ROOTS, (_, c) => c + BASE + "/") : html);
const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
const profile = JSON.parse(fs.readFileSync("content/profile.json", "utf8"));
const partners = JSON.parse(fs.readFileSync("content/partners.json", "utf8"));
const catKeys = Object.keys(site.categories).filter((c) => projects.some((p) => p.category === c));
const HERO = "/img/hero.webp";
const OG = "/img/og/home.jpg"; // ảnh khi chia sẻ link (JPEG 1200x630, tạo lúc build)
const ogOf = (p) => `/img/og/${p.slug}.jpg`;

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const img = (p, i, big = false) => `/img/projects/${p.slug}/${p.images[i].src.replace(".webp", big ? ".webp" : "-s.webp")}`;

// đường dẫn theo ngôn ngữ
const L = {
  vi: { prefix: "", work: "du-an" },
  en: { prefix: "/en", work: "projects" },
  ja: { prefix: "/ja", work: "projects" },
};
const LANGS = Object.keys(L);
const alts = (fn) => Object.fromEntries(LANGS.map((x) => [x, fn(x)]));
const homeUrl = (l) => `${L[l].prefix}/`;
const workUrl = (l) => `${L[l].prefix}/${L[l].work}/`;
const projUrl = (l, p) => `${L[l].prefix}/${L[l].work}/${p.slug}/`;

function write(rel, html) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, rebase(html));
}

const icon = {
  arrow: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  left: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`,
  right: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`,
  close: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>`,
};

function layout({ l, t, title, desc, path: urlPath, alts, ogImage, body, bodyClass = "", jsonld = "" }) {
  const canonical = SITE_URL + urlPath;
  const og = SITE_URL + (ogImage || OG);
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0b0b0c">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="author" content="${site.person}">
${[].concat(site.googleSiteVerification || []).filter(Boolean).map((v) => `<meta name="google-site-verification" content="${esc(v)}">`).join(" ")}
<link rel="canonical" href="${canonical}">
${LANGS.map((x) => `<link rel="alternate" hreflang="${x}" href="${SITE_URL}${alts[x]}">`).join("\n")}
<link rel="alternate" hreflang="x-default" href="${SITE_URL}${alts.vi}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.brand}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${og}">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Manrope:wght@300;400;500;600&family=Noto+Serif+JP:wght@300;400;500&family=Noto+Sans+JP:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v=${V}">
${jsonld}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">${t.skip}</a>
<header class="site-header" id="header">
  <a class="brand" href="${homeUrl(l)}" aria-label="${site.brand} – Raymond"><span class="brand-logo"><img src="/img/raymond-mark.webp" width="149" height="143" alt="Raymond"></span><i class="brand-sep" aria-hidden="true"></i><span class="brand-text">PHONG<em> ARCHITECT</em></span></a>
  <nav class="nav" aria-label="${t.navLabel}" id="nav">
    <div class="has-menu" id="hasMenu">
      <a href="${workUrl(l)}" aria-haspopup="true" aria-expanded="false" id="workLink">${t.navWork}<svg class="caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></a>
      <div class="mega" role="region" aria-label="${t.navWork}">
        <div class="mega-grid">
          ${catKeys.map((c) => { const list = projects.filter((p) => p.category === c); return `<div class="mega-col"><a class="mega-head" href="${workUrl(l)}?c=${c}">${catName(c, l)} <span>${list.length}</span></a><ul>${list.map((p) => `<li><a href="${projUrl(l, p)}">${esc(p.title)}</a></li>`).join("")}</ul></div>`; }).join("")}
        </div>
        <a class="mega-all" href="${workUrl(l)}">${t.allWork} ${icon.arrow}</a>
      </div>
    </div>
    <a href="${homeUrl(l)}#about">${t.navAbout}</a>
    <a href="${homeUrl(l)}#contact">${t.navContact}</a>
    <div class="langs" role="group" aria-label="Language">${LANGS.map((x) => (x === l ? `<a class="lang" href="${alts[x]}" lang="${x}" aria-current="true">${site.langLabels[x]}</a>` : `<a class="lang" href="${alts[x]}" hreflang="${x}" lang="${x}" title="${site.langNames[x]}">${site.langLabels[x]}</a>`)).join("")}</div>
  </nav>
  <button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="nav"><span></span><span></span></button>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="foot-grid">
    <div>
      <img class="foot-logo" src="/img/raymond-mark.webp" width="149" height="143" alt="Raymond" loading="lazy"><p class="foot-brand">PHONG ARCHITECT</p>
      <p class="muted">${esc(site.person)} · ${t.aboutRole}</p>
    </div>
    <div class="foot-links">
      <a href="tel:${site.phoneHref}">${site.phone}</a>
      <a href="mailto:${site.email}">${site.email}</a>
    </div>
  </div>
  <p class="muted small">© ${new Date().getFullYear()} ${site.brand}. ${t.rights}</p>
</footer>
<script src="/assets/app.js?v=${V}" defer></script>
</body>
</html>`;
}

const catName = (c, l) => site.categories[c][l];

function projectCard(p, l, t, { size = "", sizes = "(min-width:1000px) 31vw, (min-width:600px) 48vw, 100vw" } = {}) {
  const im = p.images[p.cover];
  return `<a class="card ${size}" href="${projUrl(l, p)}" data-cat="${p.category}">
  <figure class="card-img"><img src="${img(p, p.cover)}" srcset="${img(p, p.cover)} 800w, ${img(p, p.cover, true)} ${p.images[p.cover].w}w" sizes="${size === "wide" ? "(min-width:760px) 92vw, 100vw" : sizes}" width="${im.w}" height="${im.h}" alt="${esc(p.title)}" loading="lazy" decoding="async"></figure>
  <div class="card-meta"><h3>${esc(p.title)}</h3><span>${catName(p.category, l)}${p.location ? " · " + esc(p.location) : ""}</span></div>
</a>`;
}

function homePage(l) {
  const t = site.i18n[l];
  const featured = projects.filter((p) => p.featured);
  const counts = Object.fromEntries(catKeys.map((c) => [c, projects.filter((p) => p.category === c).length]));
  const body = `
<section class="hero" aria-label="${site.brand}">
  <div class="slides"><video class="hero-video" autoplay muted loop playsinline preload="auto" aria-hidden="true"><source src="/video/hero.mp4" type="video/mp4"></video></div>
  <div class="hero-shade"></div>
  <div class="hero-inner">
    <p class="kicker">${t.heroKicker}</p>
    <h1>${t.heroTitle}</h1>
    <a class="btn" href="${workUrl(l)}">${t.heroCta} ${icon.arrow}</a>
  </div>
  <a class="scroll-cue" href="#intro" aria-label="${t.scroll}"><span></span>${t.scroll}</a>
</section>

<section class="intro" id="intro">
  <p class="kicker reveal">${t.introKicker}</p>
  <p class="intro-text reveal">${t.introText}</p>
</section>

<section class="featured" aria-labelledby="featured-title">
  <div class="section-head reveal">
    <div><p class="kicker">${t.workKicker}</p><h2 id="featured-title">${t.workTitle}</h2></div>
    <a class="link-arrow" href="${workUrl(l)}">${t.allWork} ${icon.arrow}</a>
  </div>
  <div class="feature-grid">
    ${featured.map((p, i) => projectCard(p, l, t, {}).replace('class="card', 'class="reveal card')).join("\n")}
  </div>
</section>

<section class="disciplines" aria-labelledby="disc-title">
  <div class="section-head reveal"><div>${t.disciplinesKicker ? `<p class="kicker">${t.disciplinesKicker}</p>` : ""}<h2 id="disc-title">${t.disciplinesTitle}</h2></div><a class="link-arrow" href="${workUrl(l)}">${t.allWork} ${icon.arrow}</a></div>
  <div class="disc-grid">
    ${catKeys
      .map((c) => {
        const cover = projects.find((p) => p.category === c && p.featured) || projects.find((p) => p.category === c);
        return `<a class="disc reveal" href="${workUrl(l)}?c=${c}"><img src="${img(cover, cover.cover)}" alt="" loading="lazy" decoding="async" width="${cover.images[cover.cover].w}" height="${cover.images[cover.cover].h}"><div class="disc-in"><span class="count">${counts[c]} ${t.projectsCount}</span><h3>${catName(c, l)}</h3><p>${site.categoryBlurb[c][l]}</p></div></a>`;
      })
      .join("")}
  </div>
</section>

<section class="partners" id="partners" aria-labelledby="partners-title">
  <div class="section-head reveal"><div><p class="kicker">${t.partnersKicker}</p><h2 id="partners-title">${t.partnersTitle}</h2><p class="lead sec-lead">${t.partnersLead}</p></div></div>
  ${partners.map((g) => {
    const lis = g.items.map((it) => { const inner = it.logo ? `<img src="${esc(it.logo)}" alt="${esc(it.name)}" decoding="async">` : `<span class="wordmark">${esc(it.name)}</span>`; return `<li>${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener" aria-label="${esc(it.name)}">${inner}</a>` : `<div title="${esc(it.name)}">${inner}</div>`}</li>`; }).join("");
    return `<div class="partner-group reveal"><h3>${esc(g.title[l] || g.title.vi)}</h3><div class="marquee" role="group" aria-label="${esc(g.title[l] || g.title.vi)}"><div class="marquee-track"><ul class="partner-row">${lis}</ul><ul class="partner-row" aria-hidden="true">${lis.replace(/ alt="[^"]*"/g, ' alt=""').replace(/ title="[^"]*"/g, "")}</ul></div></div></div>`;
  }).join("")}
</section>

<section class="about" id="about" aria-labelledby="about-title">
  <div class="about-grid">
    <figure class="portrait reveal"><img src="/img/portrait.webp" width="${profile.portrait.w}" height="${profile.portrait.h}" alt="${esc(site.person)}" loading="lazy" decoding="async"></figure>
    <div class="about-copy reveal">
      <p class="kicker">${t.aboutKicker}</p>
      <h2 id="about-title">${t.aboutTitle}</h2>
      <p class="role">${t.aboutRole}</p>
      <p class="lead-in">${t.lead}</p>
      <p>${t.aboutP1}</p><p>${t.aboutP2}</p>
      <dl class="stats">
        <div><dt>${t.f1}</dt><dd>${t.factRole}</dd></div>
        <div><dt>${t.f2}</dt><dd>${t.factBase}</dd></div>
        <div><dt>${t.f3}</dt><dd>${t.factFocus}</dd></div>
      </dl>
    </div>
  </div>
</section>

<section class="contact" id="contact" aria-labelledby="contact-title">
  <p class="kicker reveal">${t.contactKicker}</p>
  <h2 id="contact-title" class="big reveal">${t.contactTitle}</h2>
  <p class="contact-text reveal">${t.contactText}</p>
  <div class="contact-links reveal">
    <a href="mailto:${site.email}"><small>${t.write}</small>${site.email}</a>
    <a href="tel:${site.phoneHref}"><small>${t.call}</small>${site.phone}</a>
  </div>
  <p class="address reveal"><small>${t.address}</small>${esc(site.address)}</p>
</section>`;
  const addr = { "@type": "PostalAddress", streetAddress: "Tầng 11, 218 Bạch Đằng, Phước Ninh", addressLocality: "Hải Châu, Đà Nẵng", addressCountry: "VN" };
  const person = {
    "@type": "Person",
    "@id": SITE_URL + "/#person",
    name: site.person,
    alternateName: ["Le Duy Phong", "LE DUY PHONG", "Phong Architect", "KTS Lê Duy Phong", "レー ジー フォン"],
    jobTitle: t.aboutRole,
    description: t.metaHome,
    url: SITE_URL + "/",
    image: SITE_URL + "/img/portrait.webp",
    email: site.email,
    telephone: site.phone,
    address: addr,
    worksFor: { "@type": "Organization", name: "Raymond Architectural Design Office" },
    knowsAbout: ["Architecture", "Onsen", "Resort design", "Interior design", "Landscape", "Masterplanning"],
    sameAs: site.sameAs || [],
  };
  const org = { "@type": "ProfessionalService", name: site.brand, url: SITE_URL + "/", telephone: site.phone, email: site.email, address: addr, image: SITE_URL + OG, founder: { "@id": SITE_URL + "/#person" } };
  const ld = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": [person, org] })}</script>`;
  return layout({ l, t, title: t.titleHome, desc: t.metaHome, path: homeUrl(l), alts: alts(homeUrl), body, bodyClass: "home", jsonld: ld });
}

function workPage(l) {
  const t = site.i18n[l];
  const body = `
<section class="page-head">
  <p class="kicker">${projects.length} ${t.projectsCount}</p>
  <h1>${t.projectsTitle}</h1>
  <p class="lead">${t.projectsLead}</p>
  ${catKeys.length > 1 ? `<div class="filters" role="group" aria-label="${t.category}" id="filters">
    <button class="chip is-on" data-c="all" aria-pressed="true">${t.filterAll}</button>
    ${catKeys.map((c) => `<button class="chip" data-c="${c}" aria-pressed="false">${catName(c, l)}</button>`).join("")}
  </div>` : ""}
</section>
<section class="grid-wrap"><div class="work-grid" id="work-grid">
  ${projects.map((p) => projectCard(p, l, t)).join("\n")}
</div></section>`;
  return layout({ l, t, title: `${t.projectsTitle} – ${site.brand}`, desc: t.metaProjects, path: workUrl(l), alts: alts(workUrl), body, bodyClass: "work" });
}

function detailPage(l, p, idx) {
  const t = site.i18n[l];
  const list = projects.filter((x) => x.category === p.category);
  const i = list.indexOf(p);
  const nextP = list[(i + 1) % list.length];
  const prevP = list[(i - 1 + list.length) % list.length];
  const cover = p.images[p.cover];
  const meta = [
    [t.category, catName(p.category, l)],
    [t.location, p.location],
    [t.year, p.year],
    [t.client, p.client],
    [t.area, p.area],
    [t.role, p.role],
  ].filter(([, v]) => v);
  const summary = (p.summary && p.summary[l]) || "";
  const gallery = p.images
    .map(
      (im, k) =>
        `<a class="shot reveal" href="${img(p, k, true)}" data-i="${k}" style="--ar:${im.w}/${im.h}" aria-label="${esc(p.title)} ${k + 1}/${p.images.length}"><img src="${img(p, k)}" srcset="${img(p, k)} 800w, ${img(p, k, true)} ${im.w}w" sizes="(min-width:1000px) 32vw, (min-width:700px) 48vw, 100vw" width="${im.w}" height="${im.h}" alt="${esc(p.title)} – ${k + 1}" loading="${k < 2 ? "eager" : "lazy"}" decoding="async"></a>`
    )
    .join("\n");
  const body = `
<section class="proj-hero">
  <div class="proj-hero-in"><a class="crumb" href="${workUrl(l)}">${icon.left} ${t.back}</a><p class="kicker">${catName(p.category, l)}</p><h1>${esc(p.title)}</h1></div>
  <figure class="proj-cover"><img src="${img(p, p.cover, true)}" srcset="${img(p, p.cover)} 800w, ${img(p, p.cover, true)} ${cover.w}w" sizes="(min-width:1000px) 56vw, 100vw" width="${cover.w}" height="${cover.h}" alt="${esc(p.title)}" fetchpriority="high"></figure>
</section>
<section class="proj-info">
  <dl class="meta">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}<div><dt>${t.images}</dt><dd>${p.images.length}</dd></div></dl>
  <div class="proj-text">${summary ? `<p>${esc(summary)}</p>` : ""}<p class="muted small">${t.credit}</p></div>
</section>
<section class="gallery" id="gallery" data-title="${esc(p.title)}">
${gallery}
</section>
<nav class="proj-nav" aria-label="${t.back}">
  <a href="${projUrl(l, prevP)}" class="pn"><small>${t.prev}</small><span>${icon.left} ${esc(prevP.title)}</span></a>
  <a href="${projUrl(l, nextP)}" class="pn right"><small>${t.next}</small><span>${esc(nextP.title)} ${icon.right}</span></a>
</nav>
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="${esc(p.title)}" hidden>
  <button class="lb-btn lb-close" data-act="close" aria-label="${t.close}">${icon.close}</button>
  <button class="lb-btn lb-prev" data-act="prev" aria-label="${t.prevImg}">${icon.left}</button>
  <img alt="" id="lb-img">
  <button class="lb-btn lb-next" data-act="next" aria-label="${t.nextImg}">${icon.right}</button>
  <p class="lb-count" id="lb-count"></p>
</div>`;
  const ld = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    creator: { "@type": "Person", name: site.person },
    genre: catName(p.category, l),
    image: SITE_URL + img(p, p.cover, true),
  })}</script>`;
  const desc = summary || `${p.title} – ${catName(p.category, l)}. ${site.brand}.`;
  return layout({ l, t, title: `${p.title} – ${site.brand}`, desc, path: projUrl(l, p), alts: alts((x) => projUrl(x, p)), body, bodyClass: "detail", ogImage: ogOf(p), jsonld: ld });
}

function notFound() {
  const t = site.i18n.vi;
  const body = `<section class="page-head nf"><p class="kicker">404</p><h1>${t.notFoundTitle}</h1><p class="lead">${t.notFoundText}</p><a class="btn" href="/">${t.home} ${icon.arrow}</a></section>`;
  return layout({ l: "vi", t, title: `404 – ${site.brand}`, desc: t.notFoundText, path: "/404.html", alts: alts(homeUrl), body });
}

// ---------- build ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync("public", DIST, { recursive: true });
fs.cpSync("src/assets", path.join(DIST, "assets"), { recursive: true });

// ảnh chia sẻ link (Facebook, Zalo, iMessage...): JPEG 1200x630
fs.mkdirSync(path.join(DIST, "img/og"), { recursive: true });
const ogJpg = (src, out) => sharp(src).resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(DIST, "img/og", out));
await ogJpg("public/img/og-source.webp", "home.jpg");
for (const p of projects) await ogJpg(path.join("public/img/projects", p.slug, p.images[p.cover].src), `${p.slug}.jpg`);

for (const l of LANGS) {
  write(path.join(L[l].prefix, "index.html"), homePage(l));
  write(path.join(L[l].prefix, L[l].work, "index.html"), workPage(l));
  projects.forEach((p, i) => write(path.join(L[l].prefix, L[l].work, p.slug, "index.html"), detailPage(l, p, i)));
}
write("404.html", notFound());
if (BASE) {
  // app.js cũng cần biết đường dẫn gốc
  const jsf = path.join(DIST, "assets/app.js");
  fs.writeFileSync(jsf, fs.readFileSync(jsf, "utf8").replace('"/video/hero-4k.mp4"', '"' + BASE + '/video/hero-4k.mp4"'));
}

const urls = [];
for (const l of LANGS) {
  urls.push(homeUrl(l), workUrl(l), ...projects.map((p) => projUrl(l, p)));
}
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join("\n")}\n</urlset>\n`
);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Đã tạo ${urls.length + 1} trang trong dist/ (SITE_URL=${SITE_URL})`);
