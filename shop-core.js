// Shared commerce UI: product art/cards, product detail modal, saved items, quote list.
// SikandarTech sells on quotation: there are no online prices or checkout, so the
// "cart" is a quote list that is sent as one WhatsApp enquiry.
const STATUS_LABEL = { available: "Available now", coming: "Coming soon", emerging: "Emerging tech" };
const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const productCode = (p) => "ST-" + String(PRODUCTS.indexOf(p) + 1).padStart(4, "0");

// ---------- Product picture ----------
// Real photo when images/products/<id>.* exists, otherwise an illustrated tile.
function productArt(p, extra = "") {
  const c = catById[p.cat];
  if (p.photo) {
    return `<div class="art photo ${extra}" style="--c:${c.color}"><img src="${p.photo}" alt="${esc(p.name)}" loading="lazy" decoding="async"></div>`;
  }
  return `<div class="art ${extra}" style="--c:${c.color}" role="img" aria-label="${esc(p.name)} (illustration)">
    <span class="art-frame"></span><span class="art-ring"></span>
    <span class="art-code">${productCode(p)}</span><span class="art-dot"></span>
    ${iconSvg(p.icon, "art-icon")}
  </div>`;
}

function statusTag(p) {
  return `<span class="status ${p.status}">${STATUS_LABEL[p.status]}</span>`;
}

function productCard(p, { reveal = false, delay = 0 } = {}) {
  const c = catById[p.cat];
  const saved = Store.isSaved(p.id);
  return `<article class="p-card${reveal ? " rv" : ""}" style="--d:${delay}s" data-id="${p.id}" data-tilt>
    <button class="icon-btn p-save${saved ? " is-on" : ""}" data-save="${p.id}" aria-pressed="${saved}" aria-label="${saved ? "Remove from saved" : "Save"}: ${esc(p.name)}">${iconSvg("heart")}</button>
    <a href="product.html?id=${p.id}" aria-label="${esc(p.name)}: product details">${productArt(p)}</a>
    <div class="p-body">
      <div class="p-meta"><span class="p-cat">${esc(c.name)}</span>${statusTag(p)}</div>
      <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
      <p class="p-desc">${esc(p.desc)}</p>
      <ul class="p-specs">${p.specs.slice(0, 3).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      <div class="p-price"><strong>Price on request</strong><span>Factory quote</span></div>
      <div class="p-actions">
        <button class="btn btn-line btn-sm" data-open="${p.id}">${iconSvg("eye")}Quick view</button>
        <button class="btn btn-sm" data-quote="${p.id}">Add to quote</button>
      </div>
    </div>
  </article>`;
}

// ---------- Local storage (per device) ----------
const Store = (() => {
  const read = (k, d) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable: keep in memory */ }
  };
  let saved = read("st-saved", []).filter((id) => productById[id]);
  let quote = read("st-quote", []).filter((i) => productById[i.id]);
  const listeners = [];
  const emit = (what) => listeners.forEach((fn) => fn(what));
  return {
    on: (fn) => listeners.push(fn),
    saved: () => saved.slice(),
    quote: () => quote.map((i) => ({ ...i })),
    isSaved: (id) => saved.includes(id),
    toggleSave(id) {
      saved = saved.includes(id) ? saved.filter((x) => x !== id) : [id, ...saved];
      write("st-saved", saved);
      emit("saved");
      return saved.includes(id);
    },
    addQuote(id, qty = 1) {
      const item = quote.find((i) => i.id === id);
      if (item) item.qty += qty;
      else quote.unshift({ id, qty });
      write("st-quote", quote);
      emit("quote");
    },
    setQty(id, qty) {
      const item = quote.find((i) => i.id === id);
      if (!item) return;
      item.qty = Math.max(1, Math.min(999999, qty | 0 || 1));
      write("st-quote", quote);
      emit("quote");
    },
    removeQuote(id) {
      quote = quote.filter((i) => i.id !== id);
      write("st-quote", quote);
      emit("quote");
    },
    clearQuote() {
      quote = [];
      write("st-quote", quote);
      emit("quote");
    }
  };
})();

// ---------- Toast ----------
const toastEl = document.createElement("div");
toastEl.className = "toast";
toastEl.setAttribute("role", "status");
toastEl.setAttribute("aria-live", "polite");
document.body.appendChild(toastEl);
let toastTimer;
function toast(msg, action) {
  toastEl.innerHTML = `${iconSvg("check")}<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ""}`;
  toastEl.querySelector("svg").style.cssText = "width:18px;height:18px";
  if (action) toastEl.querySelector("button").onclick = () => { action.run(); toastEl.classList.remove("show"); };
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
}

// ---------- Drawer ----------
const drawer = document.createElement("div");
drawer.className = "drawer";
drawer.id = "drawer";
drawer.innerHTML = `
  <div class="drawer-bg" data-close-drawer></div>
  <aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="Quote list and saved products">
    <div class="drawer-head">
      <div class="drawer-tabs" role="tablist">
        <button class="chip" role="tab" data-tab="quote">Quote list <span id="d-qn"></span></button>
        <button class="chip" role="tab" data-tab="saved">Saved <span id="d-sn"></span></button>
      </div>
      <button class="icon-btn" data-close-drawer aria-label="Close">${iconSvg("x")}</button>
    </div>
    <div class="drawer-body" id="drawer-body"></div>
    <div class="drawer-foot" id="drawer-foot"></div>
  </aside>`;
document.body.appendChild(drawer);
let drawerTab = "quote";
let lastFocus = null;

function openDrawer(tab = "quote") {
  drawerTab = tab;
  renderDrawer();
  lastFocus = document.activeElement;
  drawer.classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(() => drawer.querySelector(`[data-tab="${tab}"]`).focus(), 60);
}
function closeDrawer() {
  drawer.classList.remove("open");
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

function quoteMessage() {
  const lines = Store.quote().map((i, n) => {
    const p = productById[i.id];
    return `${n + 1}. ${p.name} (${catById[p.cat].name}) x ${i.qty}`;
  });
  return `Hi SikandarTech, I would like a quotation for:\n${lines.join("\n")}\n\nPlease share price, MOQ and shipping to my country.`;
}

function renderDrawer() {
  const q = Store.quote();
  const s = Store.saved();
  $("d-qn").textContent = q.length ? `(${q.length})` : "";
  $("d-sn").textContent = s.length ? `(${s.length})` : "";
  drawer.querySelectorAll("[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === drawerTab);
    b.setAttribute("aria-selected", b.dataset.tab === drawerTab);
  });
  const body = $("drawer-body");
  const foot = $("drawer-foot");
  if (drawerTab === "quote") {
    body.innerHTML = q.length
      ? q.map(({ id, qty }) => {
          const p = productById[id];
          return `<div class="d-item">${productArt(p)}<div><small>${productCode(p)}</small><h4>${esc(p.name)}</h4>
            <div class="qty"><button data-qty="${id}" data-step="-1" aria-label="Decrease quantity">−</button><input type="number" min="1" value="${qty}" data-qty-input="${id}" aria-label="Quantity for ${esc(p.name)}"><button data-qty="${id}" data-step="1" aria-label="Increase quantity">+</button></div></div>
            <button class="d-remove" data-remove="${id}">Remove</button></div>`;
        }).join("")
      : `<div class="d-empty">${iconSvg("shopping-bag")}<h4>Your quote list is empty</h4><p>Add products and send one enquiry. We reply with factory prices, MOQ and shipping.</p><a class="btn btn-line btn-sm" href="products.html">Browse products</a></div>`;
    foot.innerHTML = q.length
      ? `<a class="btn btn-block" target="_blank" rel="noopener" href="${waLink(quoteMessage())}">${iconSvg("brand-whatsapp")}Send quote request on WhatsApp</a>
         <button class="btn btn-line btn-sm btn-block" data-clear-quote>Clear list</button>
         <p>Prices are confirmed by quotation. Sending opens WhatsApp with your list; nothing is charged.</p>`
      : "";
  } else {
    body.innerHTML = s.length
      ? s.map((id) => {
          const p = productById[id];
          return `<div class="d-item">${productArt(p)}<div><small>${esc(catById[p.cat].name)}</small><h4>${esc(p.name)}</h4>
            <button class="btn btn-sm" style="margin-top:8px" data-quote="${id}">Add to quote</button></div>
            <button class="d-remove" data-save="${id}">Remove</button></div>`;
        }).join("")
      : `<div class="d-empty">${iconSvg("heart")}<h4>No saved products yet</h4><p>Tap the heart on any product to keep it here. Saved on this device.</p></div>`;
    foot.innerHTML = "";
  }
}

function updateCounts(what) {
  const q = Store.quote().reduce((n, i) => n + 1, 0);
  const s = Store.saved().length;
  document.querySelectorAll("[data-count='quote']").forEach((el) => setCount(el, q, what === "quote"));
  document.querySelectorAll("[data-count='saved']").forEach((el) => setCount(el, s, what === "saved"));
}
function setCount(el, n, bump) {
  el.textContent = n;
  el.classList.toggle("has", n > 0);
  if (bump && n > 0) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
}
Store.on((what) => {
  updateCounts(what);
  if (drawer.classList.contains("open")) renderDrawer();
  if (what === "saved") {
    document.querySelectorAll("[data-save]").forEach((b) => {
      if (b.classList.contains("d-remove")) return;
      const on = Store.isSaved(b.dataset.save);
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on);
    });
  }
});
updateCounts();

// ---------- Product modal ----------
const modal = document.createElement("dialog");
modal.className = "product-modal";
modal.setAttribute("aria-labelledby", "modal-name");
modal.innerHTML = `
  <button class="icon-btn modal-close" data-close-modal aria-label="Close">${iconSvg("x")}</button>
  <div class="modal-body">
    <div class="modal-media" id="modal-media"></div>
    <div class="modal-info">
      <a class="modal-cat" id="modal-cat" href="products.html">Collection</a>
      <h2 id="modal-name"></h2>
      <span id="modal-status"></span>
      <p class="modal-desc" id="modal-desc"></p>
      <h3>Key specifications</h3>
      <ul class="spec-list" id="modal-specs"></ul>
      <p class="spec-note">Typical specifications for this product type. Exact brand, model, price and MOQ are confirmed in your quotation.</p>
      <div class="modal-price"><strong>Price on request</strong><span>Factory price · MOQ · Shipping</span></div>
      <div class="modal-actions">
        <button class="btn" id="modal-quote">Add to quote list</button>
        <button class="icon-btn" id="modal-save" aria-label="Save">${iconSvg("heart")}</button>
        <a class="btn btn-line" id="modal-full" href="products.html">Full details</a>
        <a class="btn btn-line" id="modal-wa" href="${waLink("Hi SikandarTech, I need a quote.")}" target="_blank" rel="noopener">${iconSvg("brand-whatsapp")}Ask now</a>
      </div>
    </div>
  </div>
  <div class="modal-related"><h3>More in this category</h3><div class="related-grid" id="modal-related"></div></div>`;
document.body.appendChild(modal);
let modalProduct = null;

function openProduct(id) {
  const p = productById[id];
  if (!p) return;
  modalProduct = p;
  const c = catById[p.cat];
  $("modal-media").innerHTML = productArt(p);
  $("modal-cat").textContent = c.name;
  $("modal-cat").href = "products.html?cat=" + c.id;
  $("modal-name").textContent = p.name;
  $("modal-status").innerHTML = statusTag(p);
  $("modal-desc").textContent = p.desc;
  $("modal-specs").innerHTML = specRows(p).map(([k, v]) => `<li><span>${esc(k)}</span>${esc(v)}</li>`).join("");
  $("modal-full").href = "product.html?id=" + p.id;
  $("modal-wa").href = waLink(`Hi SikandarTech, I want a quote for: ${p.name} (${c.name}). Please share price, MOQ and shipping.`);
  const saved = Store.isSaved(p.id);
  $("modal-save").classList.toggle("is-on", saved);
  $("modal-save").setAttribute("aria-pressed", saved);
  $("modal-related").innerHTML = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id)
    .slice(0, 4)
    .map((r) => `<button class="related" data-open="${r.id}">${productArt(r)}<span>${esc(r.name)}</span></button>`)
    .join("");
  history.replaceState(null, "", location.pathname + location.search + "#" + p.id);
  if (!modal.open) modal.showModal();
  modal.scrollTop = 0;
}
modal.addEventListener("close", () => {
  modalProduct = null;
  history.replaceState(null, "", location.pathname + location.search);
});
modal.addEventListener("click", (e) => {
  if (e.target === modal || e.target.closest("[data-close-modal]")) modal.close();
});
$("modal-quote").addEventListener("click", (e) => addToQuote(modalProduct.id, e.currentTarget));
$("modal-save").addEventListener("click", () => {
  const on = Store.toggleSave(modalProduct.id);
  $("modal-save").classList.toggle("is-on", on);
  $("modal-save").setAttribute("aria-pressed", on);
});

function addToQuote(id, btn) {
  Store.addQuote(id);
  toast(`${productById[id].name} added to quote list`, { label: "View", run: () => openDrawer("quote") });
  if (btn) {
    const label = btn.innerHTML;
    btn.classList.add("is-added");
    btn.innerHTML = `${iconSvg("check")}Added`;
    setTimeout(() => {
      btn.classList.remove("is-added");
      btn.innerHTML = label;
    }, 1400);
  }
}

// ---------- Global actions (event delegation) ----------
document.addEventListener("click", (e) => {
  const t = e.target;
  const open = t.closest("[data-open]");
  if (open) {
    e.preventDefault();
    return openProduct(open.dataset.open);
  }
  const save = t.closest("[data-save]");
  if (save) {
    const on = Store.toggleSave(save.dataset.save);
    if (!save.classList.contains("d-remove")) toast(on ? "Saved on this device" : "Removed from saved");
    return;
  }
  const quote = t.closest("[data-quote]");
  if (quote) return addToQuote(quote.dataset.quote, quote.classList.contains("btn") ? quote : null);
  const openDr = t.closest("[data-open-drawer]");
  if (openDr) return openDrawer(openDr.dataset.openDrawer);
  if (t.closest("[data-close-drawer]")) return closeDrawer();
  const tab = t.closest("[data-tab]");
  if (tab) {
    drawerTab = tab.dataset.tab;
    return renderDrawer();
  }
  const qty = t.closest("[data-qty]");
  if (qty) {
    const item = Store.quote().find((i) => i.id === qty.dataset.qty);
    if (item) Store.setQty(item.id, item.qty + Number(qty.dataset.step));
    return;
  }
  const rm = t.closest("[data-remove]");
  if (rm) return Store.removeQuote(rm.dataset.remove);
  if (t.closest("[data-clear-quote]")) {
    const backup = Store.quote();
    Store.clearQuote();
    toast("Quote list cleared", { label: "Undo", run: () => backup.reverse().forEach((i) => Store.addQuote(i.id, i.qty)) });
  }
});
document.addEventListener("change", (e) => {
  const input = e.target.closest("[data-qty-input]");
  if (input) Store.setQty(input.dataset.qtyInput, Number(input.value));
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
});

// ---------- Perspective tilt on cards (fine pointers only) ----------
if (FINE_POINTER && !REDUCED) {
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest && e.target.closest("[data-tilt]");
    document.querySelectorAll("[data-tilt].tilting").forEach((c) => {
      if (c !== card) {
        c.classList.remove("tilting");
        c.style.transform = "";
      }
    });
    if (!card || !card.classList.contains("in") && card.classList.contains("rv")) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.classList.add("tilting");
    card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
  }, { passive: true });
}

// Open a product from a shared link (#product-id)
window.addEventListener("load", () => {
  const id = location.hash.slice(1);
  if (productById[id]) openProduct(id);
});
