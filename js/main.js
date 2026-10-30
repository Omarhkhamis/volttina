/* Volttina landing page */

// TODO: replace with the real WhatsApp number (international format, digits only)
const WHATSAPP_NUMBER = "000000000000";

const COUNTRIES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia",
  "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Latvia",
  "Lithuania", "Luxembourg", "Malta", "Netherlands", "Norway", "Poland", "Portugal", "Romania",
  "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "United Kingdom"
];

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* ---------- Header ---------- */
const header = $(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const toggle = $(".nav-toggle");
const nav = $("#nav");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
  nav.classList.toggle("is-open", !open);
});
$$("a", nav).forEach((a) => a.addEventListener("click", () => {
  toggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
}));

$("#year").textContent = new Date().getFullYear();

/* ---------- Quote form ---------- */
const form = $("#qform");
const countrySelect = $("#country");
COUNTRIES.forEach((c) => countrySelect.add(new Option(c, c)));

// Photo dropzone
const MAX_FILES = 6;
const drop = $("#drop");
const fileInput = $("#photos");
const thumbs = $("#thumbs");
let files = [];

function renderThumbs() {
  thumbs.innerHTML = "";
  files.forEach((file, i) => {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.onload = () => URL.revokeObjectURL(img.src);
    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "×";
    rm.setAttribute("aria-label", `Remove ${file.name}`);
    rm.addEventListener("click", () => { files.splice(i, 1); renderThumbs(); });
    li.append(img, rm);
    thumbs.append(li);
  });
}

function addFiles(list) {
  const images = [...list].filter((f) => f.type.startsWith("image/"));
  files = files.concat(images).slice(0, MAX_FILES);
  renderThumbs();
}

fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => {
  e.preventDefault();
  drop.classList.add("is-over");
}));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => {
  e.preventDefault();
  drop.classList.remove("is-over");
}));
drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

// Validation + submit
const errorBox = $("#form-error");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const required = $$("[required]", form);
  required.forEach((el) => el.classList.remove("is-invalid"));
  const invalid = required.filter((el) => !el.value.trim() || !el.checkValidity());

  if (invalid.length) {
    invalid.forEach((el) => el.classList.add("is-invalid"));
    errorBox.textContent = "Please fill in the highlighted fields.";
    errorBox.hidden = false;
    invalid[0].focus();
    return;
  }
  errorBox.hidden = true;

  // TODO: send to backend / Formspree. Photos are in `files`.
  // const data = new FormData(form); files.forEach((f) => data.append("photos[]", f));
  // await fetch("https://formspree.io/f/XXXX", { method: "POST", body: data });

  const ref = `VT-${String(new Date().getFullYear()).slice(2)}-${Math.floor(1000 + Math.random() * 9000)}`;
  $("#ref").textContent = ref;
  form.classList.add("is-sent");
  $("#success").hidden = false;
  $("#success").focus();
});

form.addEventListener("input", (e) => {
  if (e.target.classList.contains("is-invalid") && e.target.value.trim()) e.target.classList.remove("is-invalid");
});

/* ---------- WhatsApp links: prefill with whatever is in the form ---------- */
function waMessage() {
  const v = (name) => (form.elements[name]?.value || "").trim();
  const lines = ["Hi Volttina, I'd like a quote."];
  if (v("product")) lines.push(`Product: ${v("product")}`);
  if (v("qty")) lines.push(`Quantity: ${v("qty")} ${v("unit")}`);
  if (v("target")) lines.push(`Target price: €${v("target")}`);
  if (v("country")) lines.push(`Deliver to: ${v("country")} (${form.elements.terms.value})`);
  if (v("name")) lines.push(`Name: ${v("name")}${v("company") ? `, ${v("company")}` : ""}`);
  if ($("#ref").textContent) lines.push(`Reference: ${$("#ref").textContent}`);
  lines.push("I'll send the product photo here.");
  return lines.join("\n");
}

$$("[data-wa]").forEach((a) => {
  a.target = "_blank";
  a.rel = "noopener";
  a.addEventListener("click", () => {
    a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage())}`;
  });
});

/* ---------- Motion (GSAP) ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (window.gsap && window.ScrollTrigger && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("js-motion");

  const countUp = (el, opts = {}) => {
    const target = parseFloat(el.dataset.count);
    const o = { v: 0 };
    return gsap.to(o, {
      v: target, duration: 1, ease: "power2.out", ...opts,
      onUpdate: () => { el.textContent = o.v.toFixed(2); }
    });
  };

  // Hero: the quote "fills in" line by line
  const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
  intro
    .from(".hero-title", { y: 18, opacity: 0, duration: 0.5 })
    .from(".hero-copy .lead, .hero-actions, .hero-facts", { y: 12, opacity: 0, duration: 0.4, stagger: 0.08 }, "-=0.25")
    .from(".quote-card", { y: 24, opacity: 0, duration: 0.5 }, 0.15)
    .from(".qc-row", { x: -10, opacity: 0, duration: 0.3, stagger: 0.12 }, 0.5)
    .add(countUp($(".qc-total [data-count]"), { duration: 0.8 }), ">-0.1");

  // Routes: draw the three lines, light up stations, move the containers
  const lines = $$(".map .line");
  const boxes = [".box-sea", ".box-rail", ".box-air"].map((s) => $(s));

  const buildRoute = (scrollTrigger) => {
    lines.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.set(boxes, { opacity: 0 });

    const prog = { t: 0 };
    const placeBoxes = () => lines.forEach((p, i) => {
      const pt = p.getPointAtLength(p.getTotalLength() * prog.t);
      boxes[i].setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    });
    placeBoxes();

    return gsap.timeline({ scrollTrigger })
      .from(".hub-origin", { scale: 0, transformOrigin: "50% 50%", duration: 0.15 })
      .to(lines, { strokeDashoffset: 0, duration: 1, ease: "none", stagger: 0.08 }, ">")
      .from(".st circle", { scale: 0, transformOrigin: "50% 50%", duration: 0.12, stagger: 0.06 }, "<0.2")
      .from(".labels text", { opacity: 0, duration: 0.2, stagger: 0.03 }, "<")
      .from(".hub-dest", { scale: 0, transformOrigin: "50% 50%", duration: 0.15 }, ">-0.1")
      .to(boxes, { opacity: 1, duration: 0.05 })
      .to(prog, { t: 1, duration: 0.9, ease: "none", onUpdate: placeBoxes });
  };

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    buildRoute({ trigger: ".map", start: "center 55%", end: "+=110%", scrub: 0.6, pin: ".map", anticipatePin: 1 });
  });
  mm.add("(min-width: 768px) and (max-width: 1023px)", () => {
    buildRoute({ trigger: ".map", start: "top 75%", end: "bottom 35%", scrub: 0.6 });
  });

  // How it works: the line runs down, each station lights up when reached
  gsap.fromTo(".spine-fill", { scaleY: 0 }, {
    scaleY: 1, ease: "none",
    scrollTrigger: { trigger: ".steps", start: "top 60%", end: "bottom 60%", scrub: true }
  });
  $$(".step").forEach((step) => {
    ScrollTrigger.create({
      trigger: step, start: "top 60%",
      onEnter: () => step.classList.add("is-on"),
      onLeaveBack: () => step.classList.remove("is-on")
    });
  });

  // Pricing: bar segments stack up, total counts up
  gsap.timeline({ scrollTrigger: { trigger: ".anatomy", start: "top 70%" } })
    .from(".seg", { scaleX: 0, duration: 0.35, ease: "power2.out", stagger: 0.08 })
    .add(countUp($(".big-num [data-count]")), 0);
}
