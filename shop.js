// Catalogue page. Shared product UI lives in shop-core.js.
const PAGE_SIZE = 36;
const params = new URLSearchParams(location.search);
const state = {
  cat: catById[params.get("cat")] ? params.get("cat") : "all",
  status: STATUS_LABEL[params.get("status")] ? params.get("status") : "all",
  q: params.get("q") || "",
  shown: PAGE_SIZE
};

function filtered() {
  // Each search word must match the start of a word; products whose name matches rank first
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  const res = words.map((w) => new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const list = [];
  PRODUCTS.forEach((p, i) => {
    if (state.cat !== "all" && p.cat !== state.cat) return;
    if (state.status !== "all" && p.status !== state.status) return;
    if (!res.length) return list.push({ p, score: 0, i });
    const name = p.name.toLowerCase();
    const hay = (name + " " + p.desc + " " + p.specs.join(" ") + " " + catById[p.cat].name).toLowerCase();
    if (!res.every((r) => r.test(hay))) return;
    list.push({ p, score: res.filter((r) => r.test(name)).length, i });
  });
  return list.sort((a, b) => b.score - a.score || a.i - b.i).map((x) => x.p);
}

function syncUrl() {
  const u = new URLSearchParams();
  if (state.cat !== "all") u.set("cat", state.cat);
  if (state.status !== "all") u.set("status", state.status);
  if (state.q) u.set("q", state.q);
  const qs = u.toString();
  history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
}

function renderCats() {
  const item = (id, name, count, icon, color) =>
    `<button class="cat-btn" data-cat="${id}" style="--c:${color}" aria-pressed="false">${iconSvg(icon, "ci")}<span class="cn">${esc(name)}</span><span class="cc">${count}</span></button>`;
  const html = item("all", "All products", PRODUCTS.length, "layout-grid", "#eef0f3") + CATEGORIES.map((c) => item(c.id, c.name, c.count, c.icon, c.color)).join("");
  $("cat-list").innerHTML = html;
  $("cat-chips").innerHTML = html;
}

function render({ animate = true } = {}) {
  const list = filtered();
  const c = catById[state.cat];
  $("shop-title").innerHTML = `<span class="mask in"><span>${esc(c ? c.name : "All products")}</span></span>`;
  $("shop-kicker").textContent = c ? `Collection / ${String(CATEGORIES.indexOf(c) + 1).padStart(2, "0")}` : "Collection";
  $("shop-tagline").textContent = c ? c.tagline : "Advanced tech and gadgets sourced direct from China, with quality inspection and worldwide shipping.";
  document.title = (c ? c.name : "Product Catalogue") + " | SikandarTech";
  const media = $("shop-hero-media");
  media.hidden = !(c && c.photo);
  media.parentElement.classList.toggle("has-media", !!(c && c.photo));
  media.innerHTML = c && c.photo ? `<img src="${c.photo}" alt="${esc(c.name)}" width="1200" height="900">` : "";

  $("shop-count").textContent = `${list.length} product${list.length === 1 ? "" : "s"}${state.q ? ` for “${state.q}”` : ""}`;
  $("shop-grid").innerHTML = list.length
    ? list.slice(0, state.shown).map((p, i) => productCard(p, { reveal: animate, delay: (i % 3) * 0.06 })).join("")
    : `<div class="empty"><p>No products match. Try another search, or <a href="${waLink(`Hi SikandarTech, I am looking for: ${state.q}`)}" target="_blank" rel="noopener">ask us on WhatsApp</a>. We can source almost anything.</p></div>`;
  $("load-more").hidden = list.length <= state.shown;
  $("load-more").textContent = `Load more (${list.length - state.shown} left)`;

  document.querySelectorAll("[data-cat]").forEach((b) => {
    const on = b.dataset.cat === state.cat;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", on);
  });
  document.querySelectorAll("#status-filter [data-status]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.status === state.status));
  syncUrl();
  observeReveals($("shop-grid"));
}

document.addEventListener("click", (e) => {
  const catBtn = e.target.closest("[data-cat]");
  if (catBtn) {
    state.cat = catBtn.dataset.cat;
    state.shown = PAGE_SIZE;
    render();
    const top = document.querySelector(".shop").offsetTop - 70;
    if (window.scrollY > top) window.scrollTo({ top, behavior: REDUCED ? "auto" : "smooth" });
    return;
  }
  const st = e.target.closest("#status-filter [data-status]");
  if (st) {
    state.status = st.dataset.status;
    state.shown = PAGE_SIZE;
    render();
  }
});
let searchTimer;
$("shop-search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = e.target.value.trim();
    state.shown = PAGE_SIZE;
    render();
  }, 160);
});
$("load-more").addEventListener("click", () => {
  const before = state.shown;
  state.shown += PAGE_SIZE;
  render({ animate: false });
  const next = $("shop-grid").children[before];
  if (next) next.querySelector("a, button").focus({ preventScroll: true });
});

$("shop-search").value = state.q;
$("shop-search").placeholder = `Search ${PRODUCTS.length} products...`;
renderCats();
render();
