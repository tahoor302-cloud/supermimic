// ===== Contact details: edit only this block =====
// whatsapp: country code + number, digits only (used for wa.me links)
// Leave wechat, phone or tiktok empty ("") to hide that item.
const CONTACT = {
  whatsapp: "923022225991",
  whatsappDisplay: "+92 302 222 5991",
  wechat: "+92 302 222 5991",
  phone: "+86 136 4022 5991", // China phone
  email: "info@sikandartech.com",
  tiktok: "sikandarpanjwani1", // TikTok username without @
  instagram: "https://www.instagram.com/sikandar_panjwani/",
  facebook: "https://www.facebook.com/sikandar.punjwani/"
};

// ===== Site photos =====
// The hero photo is picked up automatically from images/hero/hero.(png|webp|jpg) by
// catalog-src/build.py. Set a path here only to override it.
const MEDIA = {
  hero: (typeof SITE_MEDIA !== "undefined" && SITE_MEDIA.hero) || ""
};

const waLink = (text) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
const tiktokUrl = () => "https://www.tiktok.com/@" + CONTACT.tiktok.replace(/^@/, "");
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Inline SVG for a Tabler icon name (see icons.js)
function iconSvg(name, cls = "") {
  const body = (typeof ICONS !== "undefined" && ICONS[name]) || "";
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

// ---------- Header ----------
const header = document.querySelector(".header");
if (header && !header.classList.contains("solid")) {
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
if (toggle && links) {
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.innerHTML = iconSvg(open ? "x" : "menu");
  };
  toggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
}
document.querySelectorAll("[data-ui-icon]").forEach((el) => (el.innerHTML = iconSvg(el.dataset.uiIcon)));
document.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = iconSvg(el.dataset.icon)));

// ---------- Scroll reveals ----------
function observeReveals(root = document) {
  const els = root.querySelectorAll(".rv:not(.in), .mask:not(.in), [data-reveal]:not(.in)");
  if (REDUCED || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  els.forEach((el) => revealObserver.observe(el));
}
const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              revealObserver.unobserve(e.target);
            }
          }),
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
      )
    : null;

// ---------- Contact form -> WhatsApp ----------
const contactForm = $("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(contactForm);
    let ok = true;
    contactForm.querySelectorAll("[required]").forEach((input) => {
      const bad = !input.value.trim();
      input.closest(".field").classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) return;
    const text =
      `Name: ${d.get("name")}\nContact: ${d.get("contact")}\n` +
      `Product: ${d.get("product") || "-"}\nMessage: ${d.get("message") || "-"}`;
    window.open(waLink(text), "_blank", "noopener");
  });
}

// ---------- Contact details ----------
const hello = waLink("Hi SikandarTech, I need help sourcing a product.");
document.querySelectorAll("[data-wa]").forEach((a) => (a.href = hello));
if ($("whatsapp-link")) $("whatsapp-link").textContent = CONTACT.whatsappDisplay;
if ($("wechat-id")) {
  $("wechat-id").textContent = CONTACT.wechat;
  $("wechat-row").hidden = !CONTACT.wechat;
}
if ($("phone-link")) {
  $("phone-link").textContent = CONTACT.phone;
  $("phone-link").href = "tel:" + CONTACT.phone.replace(/[^\d+]/g, "");
  $("phone-row").hidden = !CONTACT.phone;
}
if ($("email-link")) {
  $("email-link").textContent = CONTACT.email;
  $("email-link").href = "mailto:" + CONTACT.email;
}
document.querySelectorAll("[data-social]").forEach((a) => {
  const k = a.dataset.social;
  const url = k === "tiktok" ? (CONTACT.tiktok ? tiktokUrl() : "") : CONTACT[k];
  if (url) a.href = url;
  else a.hidden = true;
});
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
