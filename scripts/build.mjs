// Tạo website tĩnh vào dist/ từ content/*.json + src/assets + public/.
// Chạy: npm run build
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const DIST = path.join(root, "dist");
const site = JSON.parse(fs.readFileSync("content/site.json", "utf8"));
const projects = JSON.parse(fs.readFileSync("content/projects.json", "utf8"));
const SITE_URL = (process.env.SITE_URL || site.siteUrl).replace(/\/$/, "");
const V = Date.now().toString(36);
const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
const profile = JSON.parse(fs.readFileSync("content/profile.json", "utf8"));
const catKeys = Object.keys(site.categories).filter((c) => projects.some((p) => p.category === c));
const HERO = "/img/hero.webp";

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const img = (p, i, big = false) => `/img/projects/${p.slug}/${p.images[i].src.replace(".webp", big ? ".webp" : "-s.webp")}`;

// đường dẫn theo ngôn ngữ
const L = {
  vi: { prefix: "", work: "du-an" },
  en: { prefix: "/en", work: "projects" },
};
const homeUrl = (l) => `${L[l].prefix}/`;
const workUrl = (l) => `${L[l].prefix}/${L[l].work}/`;
const projUrl = (l, p) => `${L[l].prefix}/${L[l].work}/${p.slug}/`;

function write(rel, html) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

const icon = {
  arrow: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  left: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`,
  right: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`,
  close: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>`,
};

function layout({ l, t, title, desc, path: urlPath, alt, ogImage, body, bodyClass = "", jsonld = "" }) {
  const other = l === "vi" ? "en" : "vi";
  const canonical = SITE_URL + urlPath;
  const og = SITE_URL + (ogImage || HERO);
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0b0b0c">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${l}" href="${canonical}">
<link rel="alternate" hreflang="${other}" href="${SITE_URL}${alt}">
<link rel="alternate" hreflang="x-default" href="${SITE_URL}${l === "vi" ? urlPath : alt}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.brand}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v=${V}">
${jsonld}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">${l === "vi" ? "Bỏ qua điều hướng" : "Skip to content"}</a>
<header class="site-header" id="header">
  <a class="brand" href="${homeUrl(l)}" aria-label="${site.brand}">PHONG<span> ARCHITECT</span></a>
  <nav class="nav" aria-label="${l === "vi" ? "Điều hướng chính" : "Main"}" id="nav">
    <a href="${workUrl(l)}">${t.navWork}</a>
    <a href="${homeUrl(l)}#about">${t.navAbout}</a>
    <a href="${homeUrl(l)}#contact">${t.navContact}</a>
    <a class="lang" href="${alt}" hreflang="${other}" lang="${other}" aria-label="${t.switchLabel}">${t.switch}</a>
  </nav>
  <button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="nav"><span></span><span></span></button>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="foot-grid">
    <div>
      <p class="foot-brand">PHONG ARCHITECT</p>
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

function projectCard(p, l, t, { size = "" } = {}) {
  const im = p.images[p.cover];
  return `<a class="card ${size}" href="${projUrl(l, p)}" data-cat="${p.category}">
  <figure class="card-img"><img src="${img(p, p.cover)}" srcset="${img(p, p.cover)} 800w, ${img(p, p.cover, true)} ${p.images[p.cover].w}w" sizes="(min-width:900px) 45vw, 100vw" width="${im.w}" height="${im.h}" alt="${esc(p.title)}" loading="lazy" decoding="async"></figure>
  <div class="card-meta"><h3>${esc(p.title)}</h3><span>${catName(p.category, l)}${p.location ? " · " + esc(p.location) : ""}</span></div>
</a>`;
}

function homePage(l) {
  const t = site.i18n[l];
  const featured = projects;
  const counts = Object.fromEntries(catKeys.map((c) => [c, projects.filter((p) => p.category === c).length]));
  const body = `
<section class="hero" aria-label="${site.brand}">
  <div class="slides"><img class="hero-poster" src="${HERO}" width="${profile.hero.w}" height="${profile.hero.h}" alt="" fetchpriority="high"><video class="hero-video" autoplay muted loop playsinline preload="auto" poster="${HERO}" aria-hidden="true"><source src="/video/hero.mp4" type="video/mp4"></video></div>
  <div class="hero-shade"></div>
  <div class="hero-inner">
    <p class="kicker">${t.heroKicker}</p><p class="kana" lang="ja">${esc(site.kana)}</p>
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
    ${featured.map((p, i) => projectCard(p, l, t, { size: i % 4 === 0 || i % 4 === 3 ? "wide" : "" }).replace('class="card', 'class="reveal card')).join("\n")}
  </div>
</section>

<section class="disciplines" aria-labelledby="disc-title">
  <div class="section-head reveal"><div><p class="kicker">${t.disciplinesKicker}</p><h2 id="disc-title">${t.disciplinesTitle}</h2></div><a class="link-arrow" href="${workUrl(l)}">${t.allWork} ${icon.arrow}</a></div>
  <div class="disc-grid">
    ${catKeys
      .map((c) => {
        const cover = projects.find((p) => p.category === c && p.featured) || projects.find((p) => p.category === c);
        return `<a class="disc reveal" href="${workUrl(l)}?c=${c}"><img src="${img(cover, cover.cover)}" alt="" loading="lazy" decoding="async" width="${cover.images[cover.cover].w}" height="${cover.images[cover.cover].h}"><div class="disc-in"><span class="count">${counts[c]} ${t.projectsCount}</span><h3>${catName(c, l)}</h3><p>${site.categoryBlurb[c][l]}</p></div></a>`;
      })
      .join("")}
  </div>
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
  const ld = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.brand,
    url: SITE_URL,
    telephone: site.phone,
    email: site.email,
    founder: { "@type": "Person", name: site.person, jobTitle: t.aboutRole },
    image: SITE_URL + HERO,
  })}</script>`;
  return layout({ l, t, title: `${site.brand} – ${site.person}`, desc: t.metaHome, path: homeUrl(l), alt: homeUrl(l === "vi" ? "en" : "vi"), body, bodyClass: "home", jsonld: ld });
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
  return layout({ l, t, title: `${t.projectsTitle} – ${site.brand}`, desc: t.metaProjects, path: workUrl(l), alt: workUrl(l === "vi" ? "en" : "vi"), body, bodyClass: "work", ogImage: HERO });
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
        `<a class="shot reveal" href="${img(p, k, true)}" data-i="${k}" style="--ar:${im.w}/${im.h}" aria-label="${esc(p.title)} ${k + 1}/${p.images.length}"><img src="${img(p, k)}" srcset="${img(p, k)} 800w, ${img(p, k, true)} ${im.w}w" sizes="(min-width:900px) 50vw, 100vw" width="${im.w}" height="${im.h}" alt="${esc(p.title)} – ${k + 1}" loading="${k < 2 ? "eager" : "lazy"}" decoding="async"></a>`
    )
    .join("\n");
  const body = `
<section class="proj-hero">
  <img src="${img(p, p.cover, true)}" width="${cover.w}" height="${cover.h}" alt="${esc(p.title)}" fetchpriority="high">
  <div class="hero-shade"></div>
  <div class="proj-hero-in"><a class="crumb" href="${workUrl(l)}">${icon.left} ${t.back}</a><p class="kicker">${catName(p.category, l)}</p><h1>${esc(p.title)}</h1></div>
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
  return layout({ l, t, title: `${p.title} – ${site.brand}`, desc, path: projUrl(l, p), alt: projUrl(l === "vi" ? "en" : "vi", p), body, bodyClass: "detail", ogImage: img(p, p.cover, true), jsonld: ld });
}

function notFound() {
  const t = site.i18n.vi;
  const body = `<section class="page-head nf"><p class="kicker">404</p><h1>${t.notFoundTitle}</h1><p class="lead">${t.notFoundText}</p><a class="btn" href="/">${t.home} ${icon.arrow}</a></section>`;
  return layout({ l: "vi", t, title: `404 – ${site.brand}`, desc: t.notFoundText, path: "/404.html", alt: "/en/", body });
}

// ---------- build ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync("public", DIST, { recursive: true });
fs.cpSync("src/assets", path.join(DIST, "assets"), { recursive: true });

for (const l of ["vi", "en"]) {
  write(path.join(L[l].prefix, "index.html"), homePage(l));
  write(path.join(L[l].prefix, L[l].work, "index.html"), workPage(l));
  projects.forEach((p, i) => write(path.join(L[l].prefix, L[l].work, p.slug, "index.html"), detailPage(l, p, i)));
}
write("404.html", notFound());

const urls = [];
for (const l of ["vi", "en"]) {
  urls.push(homeUrl(l), workUrl(l), ...projects.map((p) => projUrl(l, p)));
}
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")}\n</urlset>\n`
);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Đã tạo ${urls.length + 1} trang trong dist/ (SITE_URL=${SITE_URL})`);
