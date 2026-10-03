// Community page: UGC feed player and "Show us your tech" submission form.
// Content comes from ugc-data.js (UGC_ITEMS); uploads go to UGC_ENDPOINT when configured.
const MAX_BYTES = 200 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
const NO_PHONE = (p) => !/smartphone|mobile|\bphones?\b/i.test(p.name);

// ---------- Feed ----------
(function feed() {
  const items = UGC_ITEMS.filter((it) => it && it.src && productById[it.product]);
  const feedEl = $("ugc-feed");
  if (!items.length) {
    $("feed-sub").textContent = "The first community posts will appear here after review.";
    feedEl.outerHTML = `<div class="ugc-empty rv">
      <div><h3>Be the first to share your setup</h3>
      <p>We only show real posts from customers who agreed to be featured, so this feed starts empty. Send yours and it could be the first one here.</p>
      <div class="hero-ctas" style="opacity:1;transform:none"><a class="btn" href="#share">Share your setup</a><a class="btn btn-line" data-social="tiktok" href="${tiktokUrl()}" target="_blank" rel="noopener">Watch us on TikTok</a></div></div>
      <div class="ugc-empty-slots" aria-hidden="true"><span></span><span></span><span></span></div></div>`;
    return;
  }

  feedEl.innerHTML = items
    .map((it, i) => {
      const p = productById[it.product];
      const media =
        it.type === "video"
          ? `<video data-src="${esc(it.src)}" ${it.poster ? `poster="${esc(it.poster)}"` : ""} muted playsinline loop preload="none" aria-label="Video by ${esc(it.creator)} showing ${esc(p.name)}"></video>
             <div class="ugc-progress" aria-hidden="true"><i></i></div>
             <button class="ugc-play" data-play aria-label="Play video by ${esc(it.creator)}">${iconSvg("player-play")}</button>`
          : `<img src="${esc(it.src)}" alt="${esc(it.caption || p.name)} — shared by ${esc(it.creator)}" loading="lazy">`;
      return `<article class="ugc-card rv" style="--d:${(i % 4) * 0.07}s" data-ugc="${i}">
        ${media}
        <div class="ugc-top"><span class="ugc-creator">${esc(it.creator)}</span>${it.verified ? `<span class="status available">Verified purchase</span>` : ""}</div>
        <div class="ugc-side">
          ${it.type === "video" ? `<button class="icon-btn" data-mute aria-label="Turn sound on" aria-pressed="false">${iconSvg("volume-off")}</button>` : ""}
          <button class="icon-btn${Store.isSaved(p.id) ? " is-on" : ""}" data-save="${p.id}" aria-label="Save ${esc(p.name)}">${iconSvg("heart")}</button>
        </div>
        <div class="ugc-bottom">
          ${it.caption ? `<p class="ugc-caption">${esc(it.caption)}</p>` : ""}
          <div class="ugc-product">${productArt(p)}<div><strong>${esc(p.name)}</strong><small>Price on request</small></div>
            <button class="btn btn-sm" data-open="${p.id}">Shop this</button></div>
        </div>
      </article>`;
    })
    .join("");

  const videos = [...feedEl.querySelectorAll("video")];
  const cardOf = (v) => v.closest(".ugc-card");
  const setPlaying = (v, on) => {
    const card = cardOf(v);
    card.classList.toggle("playing", on);
    const btn = card.querySelector("[data-play]");
    btn.innerHTML = iconSvg(on ? "player-pause" : "player-play");
    btn.setAttribute("aria-label", (on ? "Pause" : "Play") + " video");
  };
  const load = (v) => {
    if (!v.src && v.dataset.src) v.src = v.dataset.src;
  };
  const play = (v) => {
    load(v);
    const pr = v.play();
    if (pr) pr.catch(() => setPlaying(v, false));
  };
  // Only one video may have sound
  const muteOthers = (keep) =>
    videos.forEach((o) => {
      if (o !== keep && !o.muted) {
        o.muted = true;
        const b = cardOf(o).querySelector("[data-mute]");
        b.innerHTML = iconSvg("volume-off");
        b.setAttribute("aria-pressed", "false");
        b.setAttribute("aria-label", "Turn sound on");
      }
    });

  videos.forEach((v) => {
    v.addEventListener("play", () => setPlaying(v, true));
    v.addEventListener("pause", () => setPlaying(v, false));
    v.addEventListener("timeupdate", () => {
      const bar = cardOf(v).querySelector(".ugc-progress i");
      bar.style.width = v.duration ? (v.currentTime / v.duration) * 100 + "%" : "0";
    });
  });

  // Lazy-load near the viewport; muted autoplay when mostly visible (not with reduced motion)
  if ("IntersectionObserver" in window) {
    const near = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (load(e.target), near.unobserve(e.target))), { rootMargin: "300px" });
    const vis = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          const v = e.target;
          if (e.intersectionRatio >= 0.6) {
            if (!REDUCED && v.dataset.userPaused !== "1") play(v);
          } else if (!v.paused) v.pause();
        }),
      { threshold: [0, 0.6] }
    );
    videos.forEach((v) => (near.observe(v), vis.observe(v)));
  }

  feedEl.addEventListener("click", (e) => {
    const card = e.target.closest(".ugc-card");
    if (!card) return;
    const v = card.querySelector("video");
    if (e.target.closest("[data-play]") && v) {
      if (v.paused) {
        v.dataset.userPaused = "0";
        play(v);
      } else {
        v.dataset.userPaused = "1";
        v.pause();
      }
    }
    const mute = e.target.closest("[data-mute]");
    if (mute && v) {
      v.muted = !v.muted;
      if (!v.muted) {
        muteOthers(v);
        if (v.paused) play(v);
      }
      mute.innerHTML = iconSvg(v.muted ? "volume-off" : "volume");
      mute.setAttribute("aria-pressed", String(!v.muted));
      mute.setAttribute("aria-label", v.muted ? "Turn sound on" : "Turn sound off");
    }
  });
})();

// ---------- Submission form ----------
(function submission() {
  const form = $("ugc-form");
  const select = $("ugc-product");
  select.insertAdjacentHTML(
    "beforeend",
    CATEGORIES.map((c) => {
      const opts = PRODUCTS.filter((p) => p.cat === c.id && NO_PHONE(p)).map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
      return opts ? `<optgroup label="${esc(c.name)}">${opts}</optgroup>` : "";
    }).join("")
  );
  const pre = new URLSearchParams(location.search).get("product");
  if (pre && productById[pre]) select.value = pre;

  const fileInput = $("ugc-file");
  const preview = $("ugc-preview");
  const dz = $("dropzone");
  let objectUrl = null;

  function fileError(f) {
    if (!f) return "Please choose a photo or video.";
    if (!ALLOWED.includes(f.type)) return "This file type is not supported. Use JPG, PNG, WEBP, MP4, MOV or WEBM.";
    if (f.size > MAX_BYTES) return `This file is ${(f.size / 1048576).toFixed(0)} MB. The limit is 200 MB.`;
    return "";
  }
  function showPreview() {
    const f = fileInput.files[0];
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    const err = f ? fileError(f) : "";
    $("file-err").textContent = err;
    dz.closest(".field").classList.toggle("invalid", !!err);
    if (!f || err) {
      preview.classList.remove("show");
      preview.innerHTML = "";
      return;
    }
    objectUrl = URL.createObjectURL(f);
    const media = f.type.startsWith("video") ? `<video src="${objectUrl}" muted playsinline></video>` : `<img src="${objectUrl}" alt="Preview of your upload">`;
    preview.innerHTML = `${media}<p>${esc(f.name)}<br><span class="mono" style="color:var(--dim)">${(f.size / 1048576).toFixed(1)} MB</span></p><button type="button" class="d-remove" id="clear-file">Remove</button>`;
    preview.classList.add("show");
    $("clear-file").onclick = () => {
      fileInput.value = "";
      showPreview();
    };
  }
  fileInput.addEventListener("change", showPreview);
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, () => dz.classList.add("drag")));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove("drag")));

  function validate() {
    let ok = true;
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("invalid"));
    form.querySelectorAll(".err").forEach((e) => (e.textContent = ""));
    form.querySelectorAll(".check").forEach((c) => c.classList.remove("invalid"));
    const fail = (input, msg) => {
      ok = false;
      const field = input.closest(".field");
      field.classList.add("invalid");
      const err = field.querySelector(".err");
      if (err) err.textContent = msg;
    };
    const v = (n) => form.elements[n].value.trim();
    if (!v("name")) fail(form.elements.name, "Please enter your name.");
    if (v("handle") && !/^@?[\w.]{2,30}$/.test(v("handle"))) fail(form.elements.handle, "Use letters, numbers, dots or underscores.");
    const contact = v("contact");
    if (!contact) fail(form.elements.contact, "We need a way to confirm with you before publishing.");
    else if (!/^\S+@\S+\.\S+$/.test(contact) && !/^\+?[\d\s()-]{7,}$/.test(contact)) fail(form.elements.contact, "Enter a valid email or WhatsApp number.");
    if (!v("product")) fail(select, "Choose the product shown.");
    if (!v("caption")) fail(form.elements.caption, "Add a short caption.");
    const fe = fileError(fileInput.files[0]);
    if (fe) {
      ok = false;
      dz.closest(".field").classList.add("invalid");
      $("file-err").textContent = fe;
    }
    ["consent_rights", "consent_usage"].forEach((n) => {
      if (!form.elements[n].checked) {
        ok = false;
        form.elements[n].closest(".check").classList.add("invalid");
      }
    });
    if (!ok) {
      const first = form.querySelector(".invalid input, .invalid select, .invalid textarea");
      if (first) first.focus();
    }
    return ok;
  }

  function notice(kind, html) {
    const n = $("ugc-notice");
    n.className = `notice ${kind} show`;
    n.innerHTML = html;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) {
      notice("err", "<p>Please fix the highlighted fields.</p>");
      return;
    }
    const p = productById[select.value];
    const d = new FormData(form);

    if (!UGC_ENDPOINT) {
      // No upload backend is configured: say so plainly and offer WhatsApp instead.
      const msg =
        `Hi SikandarTech, I'd like to share my setup for your community page.\n` +
        `Name: ${d.get("name")}\nHandle: ${d.get("handle") || "-"}\nContact: ${d.get("contact")}\n` +
        `Product: ${p.name}\nCaption: ${d.get("caption")}\n` +
        `I confirm I have the rights to this content and agree to it being published with credit.\n(I will attach the photo/video in this chat.)`;
      notice(
        "info",
        `<p><strong>Your file has not been uploaded.</strong> Online uploads aren’t connected on this website yet, so nothing was sent or stored.</p>
         <p>You can share it now on WhatsApp: your details are filled in, just attach the photo or video in the chat.</p>
         <a class="btn btn-sm" style="justify-self:start" target="_blank" rel="noopener" href="${waLink(msg)}">${iconSvg("brand-whatsapp")}Send on WhatsApp</a>`
      );
      return;
    }

    const btn = $("ugc-submit");
    btn.disabled = true;
    btn.textContent = "Uploading…";
    try {
      const res = await fetch(UGC_ENDPOINT, { method: "POST", body: d });
      if (!res.ok) throw new Error("HTTP " + res.status);
      notice("ok", "<p><strong>Thanks, we received your submission.</strong> We review every post before publishing and will contact you if it’s selected.</p>");
      form.reset();
      showPreview();
    } catch (err) {
      notice("err", `<p><strong>Upload failed.</strong> Nothing was published. Please try again, or send it to us on <a href="${waLink("Hi SikandarTech, my community upload failed. I'd like to send my setup here.")}" target="_blank" rel="noopener" style="text-decoration:underline">WhatsApp</a>.</p>`);
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit for review";
    }
  });
})();

observeReveals();
