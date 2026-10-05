(() => {
  const d = document, root = d.documentElement;
  root.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // header
  const header = d.getElementById("header");
  const onScroll = () => header.classList.toggle("solid", scrollY > 40);
  onScroll(); addEventListener("scroll", onScroll, { passive: true });

  // mobile menu
  const burger = d.getElementById("burger"), nav = d.getElementById("nav");
  const setMenu = (o) => { burger.setAttribute("aria-expanded", o); nav.classList.toggle("open", o); d.body.style.overflow = o ? "hidden" : ""; };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // reveal
  const els = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach((el) => io.observe(el));
  } else els.forEach((el) => el.classList.add("in"));

  // hero slideshow
  const slides = d.querySelectorAll("#slides .slide");
  if (slides.length > 1 && !reduce) {
    let i = 0;
    setInterval(() => {
      if (d.hidden) return;
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, 6500);
  }

  // filter (trang dự án)
  const filters = d.getElementById("filters"), grid = d.getElementById("work-grid");
  if (filters && grid) {
    const apply = (c) => {
      filters.querySelectorAll(".chip").forEach((b) => { const on = b.dataset.c === c; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
      grid.querySelectorAll(".card").forEach((card) => { card.hidden = c !== "all" && card.dataset.cat !== c; });
      const u = new URL(location.href); c === "all" ? u.searchParams.delete("c") : u.searchParams.set("c", c);
      history.replaceState(null, "", u);
    };
    filters.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) apply(b.dataset.c); });
    const q = new URLSearchParams(location.search).get("c");
    if (q && filters.querySelector(`[data-c="${q}"]`)) apply(q);
  }

  // lightbox (trang chi tiết)
  const gal = d.getElementById("gallery"), lb = d.getElementById("lightbox");
  if (gal && lb) {
    const shots = [...gal.querySelectorAll(".shot")], im = d.getElementById("lb-img"), count = d.getElementById("lb-count");
    let cur = 0, opener = null;
    const show = (n) => { cur = (n + shots.length) % shots.length; im.src = shots[cur].href; im.alt = gal.dataset.title + " " + (cur + 1); count.textContent = (cur + 1) + " / " + shots.length; };
    const open = (n, from) => { opener = from; show(n); lb.hidden = false; d.body.style.overflow = "hidden"; lb.querySelector(".lb-close").focus(); };
    const close = () => { lb.hidden = true; d.body.style.overflow = ""; opener && opener.focus(); };
    shots.forEach((s, n) => s.addEventListener("click", (e) => { e.preventDefault(); open(n, s); }));
    lb.addEventListener("click", (e) => {
      const a = e.target.closest("[data-act]")?.dataset.act;
      if (a === "close" || e.target === lb) close(); else if (a === "prev") show(cur - 1); else if (a === "next") show(cur + 1);
    });
    addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") show(cur - 1); else if (e.key === "ArrowRight") show(cur + 1);
    });
    let x0 = null;
    lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
  }
})();
