// Aura landing — comportements. Sans ce script, la page reste entièrement lisible :
// le <head> retire la classe .js si ce fichier ne s'est pas exécuté au bout de 3 s.
(() => {
  "use strict";
  window.auraReady = true;

  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- feuille d'installation (fonctionne même sans effets) ----------
  const sheet = document.getElementById("install");
  document.querySelectorAll("[data-install]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (typeof sheet.showModal !== "function") return; // vieux navigateur : le lien mène aux Releases
      event.preventDefault();
      sheet.showModal();
    });
  });
  sheet.addEventListener("click", (event) => {
    if (event.target === sheet) sheet.close(); // clic sur le fond
  });

  if (!root.classList.contains("js")) return; // le filet de sécurité a déjà tout affiché

  // ---------- apparitions au défilement ----------
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("revealed");
      revealer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  document.querySelectorAll(".reveal, #wordmark").forEach((el) => revealer.observe(el));

  // ---------- découpe en mots (paroles) ----------
  const splitWords = (el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = word;
      el.append(span);
      if (i < words.length - 1) el.append(" ");
    });
    return [...el.querySelectorAll(".w")];
  };

  // ---------- le titre se chante : l'ouverture ----------
  const hero = document.getElementById("hero-lyric");
  const singHero = () => {
    if (reduceMotion) {
      hero.classList.remove("is-waiting");
      return;
    }
    const WORD_STEP = 120;
    const LINE_GAP = 200;
    let at = 420;
    hero.querySelectorAll(".line").forEach((line, index) => {
      if (index > 0) setTimeout(() => line.classList.remove("is-next"), at - 160);
      line.querySelectorAll(".w").forEach((word) => {
        setTimeout(() => word.classList.add("lit"), at);
        at += WORD_STEP;
      });
      at += LINE_GAP;
    });
    setTimeout(() => hero.classList.remove("is-waiting"), at + 300);
  };
  singHero();

  // ---------- section paroles, synchronisée au défilement ----------
  const track = document.getElementById("lyrics-track");
  const list = document.getElementById("lyrics-lines");
  const stage = list.parentElement;
  const lines = [...list.querySelectorAll(".lyric-line")];
  const lineWords = lines.map(splitWords);
  track.style.setProperty("--lines", String(lines.length));

  const progressIn = (el) => {
    const span = el.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / span)) : 0;
  };

  let currentLine = -1;
  const centerLine = (index) => {
    const line = lines[index];
    const lineRect = line.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const lineCenter = lineRect.top - listRect.top + lineRect.height / 2;
    list.style.setProperty("--shift", `${stage.clientHeight / 2 - lineCenter}px`);
  };

  const syncLyrics = () => {
    const position = progressIn(track) * lines.length;
    const index = Math.min(lines.length - 1, Math.floor(position));
    const withinLine = Math.min(1, position - index);
    lines.forEach((line, i) => {
      line.style.setProperty("--d", String(Math.min(3, Math.abs(i - index))));
      line.classList.toggle("is-current", i === index);
      const words = lineWords[i];
      const litCount = i < index ? words.length : i > index ? 0 : Math.ceil(withinLine * 1.25 * words.length);
      words.forEach((word, w) => word.classList.toggle("lit", w < litCount));
    });
    if (index !== currentLine) {
      currentLine = index;
      centerLine(index);
    }
  };

  lines.forEach((line, i) => {
    line.addEventListener("click", () => {
      const top = track.getBoundingClientRect().top + scrollY;
      const span = track.offsetHeight - innerHeight;
      scrollTo({ top: top + ((i + 0.85) / lines.length) * span, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  // ---------- la barre suit la section claire ----------
  const nav = document.getElementById("nav");
  const light = document.getElementById("server");
  const oled = document.getElementById("lyrics");
  const isUnderNav = (section, middle) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= middle && rect.bottom >= middle;
  };
  const syncNav = () => {
    const middle = nav.offsetHeight / 2;
    nav.classList.toggle("on-light", isUnderNav(light, middle));
    nav.classList.toggle("on-oled", isUnderNav(oled, middle));
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      syncNav();
      syncLyrics();
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => {
    currentLine = -1;
    onScroll();
  });
  onScroll();
})();
