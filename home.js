// Home page: hero sequence, featured showcase, categories, showroom, story, motion network.
// All products shown come from catalog.js. Phones are never featured.
const NO_PHONE = (p) => !/smartphone|mobile|\bphones?\b/i.test(p.name);
const pick = (ids) => ids.map((id) => productById[id]).filter((p) => p && NO_PHONE(p));

// ---------- Hero ----------
(function hero() {
  const hp = productById["noise-cancelling-headphones"];
  document.querySelectorAll("[data-spec]").forEach((el) => (el.textContent = hp.specs[el.dataset.spec] || ""));
  $("hero-caption").textContent = `${productCode(hp)} · ${hp.name} · illustration`;
  $("stat-products").textContent = Math.floor(PRODUCTS.length / 10) * 10 + "+";
  $("stat-cats").textContent = CATEGORIES.length;
  $("stat-products-2").textContent = PRODUCTS.length;

  if (MEDIA.hero) {
    const img = new Image();
    img.className = "hero-photo";
    img.alt = hp.name;
    img.onload = () => {
      $("hero-tilt").prepend(img);
      $("hero-tilt").classList.add("has-photo");
      $("hero-caption").textContent = `${productCode(hp)} · ${hp.name}`;
    };
    img.src = MEDIA.hero;
  }

  // Opening sequence: frame -> light -> headline + product -> copy -> specs
  const steps = REDUCED ? [0, 0, 0, 0, 0] : [0, 250, 600, 1150, 1500];
  steps.forEach((t, i) => setTimeout(() => document.body.classList.add("intro-" + i), t));

  // Pointer-responsive product (desktop only)
  const stage = $("hero-stage");
  const tilt = $("hero-tilt");
  if (FINE_POINTER && !REDUCED) {
    let raf = 0;
    document.querySelector(".hero").addEventListener("pointermove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / innerWidth - 0.5;
        const y = e.clientY / innerHeight - 0.5;
        tilt.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translate3d(${x * 16}px, ${y * 12}px, 0)`;
        stage.querySelectorAll(".spec-tag").forEach((tag, i) => {
          tag.style.translate = `${x * (8 + i * 4)}px ${y * (6 + i * 3)}px`;
        });
      });
    });
  }
  // Scroll hand-off: product drifts back as the hero leaves
  if (!REDUCED) {
    const product = stage.querySelector(".hero-product");
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const p = Math.min(1, window.scrollY / innerHeight);
        if (p < 1) product.style.translate = `0 ${p * 60}px`;
        product.style.scale = String(1 - p * 0.08);
        ticking = false;
      });
    }, { passive: true });
  }
})();

// ---------- Ticker ----------
(function ticker() {
  const items = CATEGORIES.map((c) => `<a href="products.html?cat=${c.id}">${esc(c.name)}</a>`).join("");
  $("ticker").innerHTML = items + items.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ');
})();

// ---------- A: Featured showcase ----------
(function showcase() {
  const items = pick(["ai-smartwatches", "professional-camera-drones", "mechanical-keyboards", "robot-vacuum-mop-systems", "portable-power-stations"]);
  const stage = $("show-stage");
  const info = $("show-info");
  let current = -1;
  $("show-thumbs").innerHTML = items
    .map((p, i) => `<button role="tab" aria-selected="false" aria-label="${esc(p.name)}" data-show="${i}">${productArt(p)}</button>`)
    .join("");

  function show(i) {
    if (i === current) return;
    current = i;
    const p = items[i];
    const c = catById[p.cat];
    const old = stage.querySelector(".art");
    if (old) {
      old.classList.add("out");
      setTimeout(() => old.remove(), 700);
    }
    stage.insertAdjacentHTML("beforeend", productArt(p));
    const fresh = stage.lastElementChild;
    if (!REDUCED) {
      fresh.classList.add("out");
      requestAnimationFrame(() => requestAnimationFrame(() => fresh.classList.remove("out")));
    }
    $("show-index").textContent = String(i + 1).padStart(2, "0");
    document.querySelectorAll("[data-show]").forEach((b) => b.setAttribute("aria-selected", b.dataset.show == i));

    const swap = $("show-swap");
    swap.classList.add("out");
    info.classList.remove("ready");
    setTimeout(() => {
      $("show-cat").textContent = c.name;
      $("show-name").textContent = p.name;
      $("show-desc").textContent = p.desc;
      $("show-specs").innerHTML = p.specs.map((s, k) => `<li style="--d:${0.08 * k}s"><span>${String(k + 1).padStart(2, "0")}</span>${esc(s)}</li>`).join("");
      $("show-status").innerHTML = statusTag(p) + " · factory quote";
      $("show-quote").dataset.quote = p.id;
      $("show-view").dataset.open = p.id;
      $("show-save").dataset.save = p.id;
      const on = Store.isSaved(p.id);
      $("show-save").classList.toggle("is-on", on);
      $("show-save").setAttribute("aria-pressed", on);
      swap.classList.remove("out");
      requestAnimationFrame(() => info.classList.add("ready"));
    }, REDUCED ? 0 : 300);
  }
  $("show-thumbs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-show]");
    if (b) {
      show(Number(b.dataset.show));
      clearInterval(auto);
    }
  });
  show(0);
  // Gentle auto-advance until the visitor interacts or leaves the section
  let auto = 0;
  if (!REDUCED && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      clearInterval(auto);
      if (e.isIntersecting) auto = setInterval(() => show((current + 1) % items.length), 5500);
    }, { threshold: 0.4 }).observe(stage);
    stage.parentElement.addEventListener("pointerenter", () => clearInterval(auto));
  }
})();

// ---------- B: Categories ----------
(function categories() {
  $("cat-summary").textContent = `${PRODUCTS.length} products in ${CATEGORIES.length} categories`;
  // Six large tiles: categories that have a photo come first, then the defaults
  const preferred = ["audio", "wearables", "drones-robotics", "gaming", "smart-home", "cameras", "kitchen-appliances", "power", "xr", "computers"];
  const ordered = [...preferred, ...CATEGORIES.map((c) => c.id).filter((id) => !preferred.includes(id))];
  const featured = [...ordered.filter((id) => catById[id].photo), ...ordered.filter((id) => !catById[id].photo)].slice(0, 6);
  $("cat-feature").innerHTML = featured
    .map((id, i) => {
      const c = catById[id];
      return `<a class="cat-big s${i + 1} rv${c.photo ? " has-photo" : ""}" style="--c:${c.color};--d:${i * 0.06}s" href="products.html?cat=${c.id}">
        ${c.photo
          ? `<div class="art photo"><img src="${c.photo}" alt="" loading="lazy" decoding="async"></div>`
          : `<div class="art" style="--c:${c.color}"><span class="art-ring"></span>${iconSvg(c.icon, "art-icon")}</div>`}
        <span class="go">${iconSvg("arrow-right")}</span>
        <span class="cat-copy">
          <span class="num">${String(CATEGORIES.indexOf(c) + 1).padStart(2, "0")} / ${c.count} products</span>
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.tagline)}</p>
        </span>
      </a>`;
    })
    .join("");
  $("cat-index").innerHTML = CATEGORIES.map(
    (c, i) => `<a class="cat-row" style="--c:${c.color}" href="products.html?cat=${c.id}">
      <span class="n">${String(i + 1).padStart(2, "0")}</span>${iconSvg(c.icon, "i")}<span class="t">${esc(c.name)}</span><span class="c">${c.count}</span></a>`
  ).join("");
  $("footer-cats").innerHTML = featured.map((id) => `<li><a href="products.html?cat=${id}">${esc(catById[id].name)}</a></li>`).join("");
  $("product-names").innerHTML = PRODUCTS.filter(NO_PHONE).map((p) => `<option value="${esc(p.name)}">`).join("");
})();

// ---------- C: Showroom wall ----------
(function wall() {
  const sets = {
    "Top picks": pick(["noise-cancelling-headphones", "ai-smartwatches", "compact-travel-drones", "smart-rings", "handheld-gaming-pcs", "4k-laser-projectors", "robotic-vacuum-cleaners", "action-cameras"]),
    Audio: PRODUCTS.filter((p) => p.cat === "audio").filter(NO_PHONE).slice(0, 8),
    Wearables: PRODUCTS.filter((p) => p.cat === "wearables").filter(NO_PHONE).slice(0, 8),
    Gaming: PRODUCTS.filter((p) => p.cat === "gaming").filter(NO_PHONE).slice(0, 8),
    "Smart home": PRODUCTS.filter((p) => p.cat === "smart-home").filter(NO_PHONE).slice(0, 8),
    Cameras: PRODUCTS.filter((p) => p.cat === "cameras").filter(NO_PHONE).slice(0, 8)
  };
  const names = Object.keys(sets);
  $("wall-tabs").innerHTML = names.map((n, i) => `<button class="chip" aria-pressed="${i === 0}" data-wall="${esc(n)}">${esc(n)}</button>`).join("");
  function render(name) {
    $("wall-grid").innerHTML = sets[name].map((p, i) => productCard(p, { reveal: true, delay: (i % 4) * 0.07 })).join("");
    observeReveals($("wall-grid"));
  }
  $("wall-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-wall]");
    if (!b) return;
    $("wall-tabs").querySelectorAll("[data-wall]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    render(b.dataset.wall);
  });
  render(names[0]);
})();

// ---------- D: Story (sticky visual + scrolling spec steps) ----------
(function story() {
  const p = productById["professional-camera-drones"];
  const copy = [
    "A large sensor gathers more light, for cleaner detail at sunrise, sunset and in shade.",
    "High-resolution video leaves room to crop, stabilise and grade in post.",
    "Sensors around the aircraft help it detect and avoid obstacles in flight.",
    "Long flight times mean fewer battery swaps and more time getting the shot."
  ];
  const anno = [["18%", "8%", ""], ["30%", "", "6%"], ["", "8%", "", "26%"], ["", "", "8%", "14%"]];
  const visual = $("story-visual");
  visual.innerHTML = productArt(p) + p.specs
    .map((s, i) => {
      const [top, left, right, bottom] = anno[i];
      const pos = [top && `top:${top}`, left && `left:${left}`, right && `right:${right}`, bottom && `bottom:${bottom}`].filter(Boolean).join(";");
      return `<div class="anno" style="${pos}" data-anno="${i}">${right ? `<b>${esc(s)}</b><i></i>` : `<i></i><b>${esc(s)}</b>`}</div>`;
    })
    .join("") + `<span class="story-name">${productCode(p)} · ${esc(p.name)}</span>`;
  $("story-steps").innerHTML = p.specs
    .map((s, i) => `<div class="story-step" data-step="${i}"><span class="k">${String(i + 1).padStart(2, "0")} / ${String(p.specs.length).padStart(2, "0")}</span><h3>${esc(s)}</h3><p>${copy[i] || ""}</p>
      <div style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap">${i === p.specs.length - 1 ? `<button class="btn" data-quote="${p.id}">Add to quote list</button><button class="btn btn-line" data-open="${p.id}">Full specifications</button>` : ""}</div></div>`)
    .join("");
  const setStep = (i) => {
    visual.querySelectorAll("[data-anno]").forEach((a) => a.classList.toggle("on", a.dataset.anno == i));
    document.querySelectorAll(".story-step").forEach((s) => s.classList.toggle("on", s.dataset.step == i));
  };
  setStep(0);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setStep(e.target.dataset.step)), { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll(".story-step").forEach((s) => io.observe(s));
  }
  // Controlled parallax on the product drawing
  if (!REDUCED) {
    const icon = visual.querySelector(".art-icon");
    window.addEventListener("scroll", () => {
      const r = visual.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const sec = $("story").getBoundingClientRect();
      const prog = Math.max(0, Math.min(1, -sec.top / (sec.height - innerHeight)));
      icon && icon.style.setProperty("--py", `${(prog - 0.5) * -40}px`);
    }, { passive: true });
  }
})();

// ---------- E: Route network ----------
(function network() {
  const hub = { x: 860, y: 250, name: "Guangzhou" };
  const nodes = [
    { x: 130, y: 170, name: "USA" }, { x: 420, y: 95, name: "UK" }, { x: 520, y: 180, name: "Europe" },
    { x: 660, y: 300, name: "UAE" }, { x: 1080, y: 160, name: "Asia" }, { x: 540, y: 410, name: "Africa" }
  ];
  const curve = (n) => {
    const mx = (hub.x + n.x) / 2;
    const my = Math.min(hub.y, n.y) - 90 - Math.abs(hub.x - n.x) * 0.08;
    return `M${hub.x} ${hub.y} Q${mx} ${my} ${n.x} ${n.y}`;
  };
  $("net-routes").innerHTML = nodes.map((n, i) => `<path class="route" d="${curve(n)}"/><path class="route-live" style="animation-delay:${-i * 0.5}s" d="${curve(n)}"/>`).join("");
  const node = (n, isHub) => `<g class="node${isHub ? " hub" : ""}"><circle class="halo" cx="${n.x}" cy="${n.y}" r="${isHub ? 18 : 10}"/><circle class="core" cx="${n.x}" cy="${n.y}" r="${isHub ? 6 : 4}"/><text x="${n.x}" y="${n.y + (isHub ? 34 : 26)}" text-anchor="middle">${n.name}</text></g>`;
  $("net-nodes").innerHTML = nodes.map((n) => node(n)).join("") + node(hub, true);
})();

observeReveals();
