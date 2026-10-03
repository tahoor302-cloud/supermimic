// Product detail page: product.html?id=<product-id>
const SITE_URL = "https://sikandartech.com/";
const pid = new URLSearchParams(location.search).get("id");
const product = productById[pid];

function renderMissing() {
  document.title = "Product not found | SikandarTech";
  $("pdp").innerHTML = `<div class="empty" style="margin:60px 0">
    <h1 style="font-family:var(--f-display);font-size:1.6rem;margin-bottom:10px">Product not found</h1>
    <p>This product link is not valid any more. Browse the full collection or ask us on WhatsApp, we can source almost anything.</p>
    <div class="hero-ctas" style="opacity:1;transform:none;justify-content:center"><a class="btn" href="products.html">Browse the collection</a>
    <a class="btn btn-line" href="${waLink("Hi SikandarTech, I am looking for a product.")}" target="_blank" rel="noopener">Ask on WhatsApp</a></div></div>`;
}

function setMeta(p, c) {
  const url = `${SITE_URL}product.html?id=${p.id}`;
  const desc = `${p.desc} ${p.specs.slice(0, 3).join(", ")}. Sourced direct from China with QC and worldwide shipping.`;
  document.title = `${p.name} | ${c.name} | SikandarTech`;
  document.querySelector('meta[name="description"]').content = desc;
  $("canonical").href = url;
  $("og-title").content = `${p.name} | SikandarTech`;
  $("og-desc").content = desc;
  $("og-url").content = url;
  if (p.photo || c.photo) $("og-image").content = SITE_URL + (p.photo || c.photo);
  // Structured data: only facts from the catalogue (no price, rating or reviews)
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.desc,
    sku: productCode(p),
    category: c.name,
    url,
    additionalProperty: specRows(p).map(([k, v]) => ({ "@type": "PropertyValue", name: k, value: v }))
  };
  if (p.photo) ld.image = SITE_URL + p.photo;
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Collection", item: SITE_URL + "products.html" },
      { "@type": "ListItem", position: 3, name: c.name, item: `${SITE_URL}products.html?cat=${c.id}` },
      { "@type": "ListItem", position: 4, name: p.name, item: url }
    ]
  };
  [ld, crumbs].forEach((obj) => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  });
}

function render(p) {
  const c = catById[p.cat];
  setMeta(p, c);

  $("crumbs").innerHTML = `<a href="index.html">Home</a><span>/</span><a href="products.html">Collection</a><span>/</span>
    <a href="products.html?cat=${c.id}">${esc(c.name)}</a><span>/</span><span aria-current="page">${esc(p.name)}</span>`;
  $("pdp-stage").innerHTML = productArt(p, "pdp-art");
  if (FINE_POINTER) {
    $("pdp-stage").addEventListener("pointermove", (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--zx", ((e.clientX - r.left) / r.width) * 100 + "%");
      e.currentTarget.style.setProperty("--zy", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  }
  $("pdp-cat").textContent = c.name;
  $("pdp-cat").href = "products.html?cat=" + c.id;
  $("pdp-name").textContent = p.name;
  $("pdp-status").innerHTML = statusTag(p);
  $("pdp-code").textContent = productCode(p);
  $("pdp-lead").textContent = p.desc;
  $("pdp-highlights").innerHTML = specRows(p)
    .map(([k, v]) => `<li><span>${esc(k)}</span><strong>${esc(v)}</strong></li>`)
    .join("");

  $("pdp-overview").innerHTML = overview(p).map((t) => `<p>${esc(t)}</p>`).join("") +
    `<h3>Key features</h3><ul class="feature-list">${p.specs.map((s) => `<li>${iconSvg("check")}<span>${esc(s)}</span></li>`).join("")}</ul>`;
  $("pdp-ideal").innerHTML = idealFor(p).map((t) => `<li>${esc(t)}</li>`).join("");
  $("pdp-notes").innerHTML = productNotes(p).map((n) => `<p class="pdp-note">${esc(n)}</p>`).join("");

  const row = ([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`;
  $("pdp-specs").innerHTML = [["Product", p.name], ["Type", c.name], ...specRows(p)].map(row).join("");
  $("pdp-sourcing").innerHTML = sourcingRows(p).map(row).join("");
  $("pdp-faq").innerHTML = productFaq(p)
    .map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`)
    .join("");

  const related = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id);
  // Products with photos first, then the neighbours in the catalogue order
  const idx = related.findIndex((x) => PRODUCTS.indexOf(x) > PRODUCTS.indexOf(p));
  const ordered = [...related.filter((x) => x.photo), ...related.slice(Math.max(0, idx)), ...related.slice(0, Math.max(0, idx))];
  const unique = [...new Set(ordered)].slice(0, 4);
  $("pdp-related").innerHTML = unique.map((x, i) => productCard(x, { reveal: true, delay: i * 0.06 })).join("");
  $("pdp-more").href = "products.html?cat=" + c.id;
  $("pdp-more").textContent = `View all ${c.count}`;

  $("pdp-wa").href = waLink(`Hi SikandarTech, I'm interested in: ${p.name} (${productCode(p)}, ${c.name}). Please share options, price, MOQ and shipping.`);

  // Quantity + quote
  const qty = $("qty");
  const clamp = () => (qty.value = Math.max(1, Math.min(999999, parseInt(qty.value, 10) || 1)));
  $("qty-minus").onclick = () => { qty.value = (parseInt(qty.value, 10) || 1) - 1; clamp(); };
  $("qty-plus").onclick = () => { qty.value = (parseInt(qty.value, 10) || 1) + 1; clamp(); };
  qty.addEventListener("change", clamp);
  $("pdp-quote").addEventListener("click", (e) => {
    clamp();
    Store.addQuote(p.id, Number(qty.value));
    toast(`${qty.value} × ${p.name} added to quote list`, { label: "View", run: () => openDrawer("quote") });
    const b = e.currentTarget;
    b.classList.add("is-added");
    b.innerHTML = `${iconSvg("check")}Added`;
    setTimeout(() => { b.classList.remove("is-added"); b.textContent = "Add to quote list"; }, 1400);
  });

  const save = $("pdp-save");
  const syncSave = () => {
    const on = Store.isSaved(p.id);
    save.classList.toggle("is-on", on);
    save.setAttribute("aria-pressed", on);
    save.setAttribute("aria-label", on ? "Remove from saved" : "Save");
  };
  save.onclick = () => { const on = Store.toggleSave(p.id); syncSave(); toast(on ? "Saved on this device" : "Removed from saved"); };
  syncSave();

  $("pdp-print").onclick = () => window.print();
  $("pdp-share").onclick = async () => {
    const url = `${location.origin}${location.pathname}?id=${p.id}`;
    try {
      if (navigator.share && !FINE_POINTER) await navigator.share({ title: p.name, url });
      else { await navigator.clipboard.writeText(url); toast("Link copied"); }
    } catch { /* user cancelled */ }
  };

  // Highlight the section in view
  const tabs = [...document.querySelectorAll(".pdp-tabs a")];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) tabs.forEach((t) => t.classList.toggle("active", t.getAttribute("href") === "#" + en.target.id));
    }), { rootMargin: "-30% 0px -60% 0px" });
    ["overview", "specs", "sourcing", "faq"].forEach((id) => io.observe($(id)));
  }
}

if (product) render(product);
else renderMissing();
observeReveals();
