// Aura landing — comportements. Sans ce script, la page reste entièrement lisible :
// le <head> retire la classe .js si ce fichier ne s'est pas exécuté au bout de 3 s.
// L'égaliseur a son état statique dans le HTML ; ce script l'anime.
(() => {
  "use strict";
  window.auraReady = true;

  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- feuille d'installation (fonctionne même sans effets) ----------
  const initInstallSheet = () => {
    const sheet = document.getElementById("install");
    if (!sheet) return;
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
  };

  // ---------- boucles CSS : en pause hors de l'écran ----------
  const pauseLoopsOffscreen = () => {
    const loops = document.querySelectorAll("[data-loop]");
    if (!loops.length || !("IntersectionObserver" in window)) return;
    const watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-paused", !entry.isIntersecting));
    });
    loops.forEach((el) => watcher.observe(el));
  };

  // ---------- l'égaliseur : la courbe de l'app, jouable ----------
  // Mêmes règles que EqualizerView.swift : cinq bandes de ±12 dB, une spline de Catmull-Rom
  // tracée en Béziers cubiques et prolongée à plat jusqu'aux bords, pas d'un demi-décibel.
  const EQ = Object.freeze({
    width: 400, height: 292, gutter: 34, inset: 22, pad: 14,
    min: -12, max: 12, bands: 5, snap: 0.5, tween: 520,
  });
  const KEY_STEPS = Object.freeze({ ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 3, PageDown: -3 });

  const round2 = (n) => Math.round(n * 100) / 100;
  const clampGain = (value) => Math.min(EQ.max, Math.max(EQ.min, value));
  const bandX = (index) => {
    const start = EQ.gutter + EQ.inset;
    return start + ((EQ.width - start - EQ.inset) * index) / (EQ.bands - 1);
  };
  const gainY = (value) =>
    EQ.pad + (EQ.height - 2 * EQ.pad) * (1 - (clampGain(value) - EQ.min) / (EQ.max - EQ.min));
  const gainAtY = (y) => {
    const share = 1 - (y - EQ.pad) / (EQ.height - 2 * EQ.pad);
    const raw = EQ.min + Math.min(1, Math.max(0, share)) * (EQ.max - EQ.min);
    return Math.round(raw / EQ.snap) * EQ.snap;
  };
  const formatGain = (value) =>
    value === 0 ? "0 dB" : `${value > 0 ? "+" : "−"}${Math.abs(value)} dB`;
  const parseGains = (text) => Object.freeze(String(text).split(",").map(Number));
  const sameGains = (a, b) => a.every((gain, i) => gain === b[i]);

  const curvePath = (gains, closed) => {
    const points = gains.map((gain, i) => ({ x: bandX(i), y: gainY(gain) }));
    const last = points.length - 1;
    const curves = points.slice(0, last).map((p1, i) => {
      const p0 = points[Math.max(i - 1, 0)];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, last)];
      const c1 = [p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6];
      const c2 = [p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6];
      return `C${[...c1, ...c2, p2.x, p2.y].map(round2).join(" ")}`;
    });
    const firstY = round2(points[0].y);
    const open = `M${EQ.gutter} ${firstY}L${round2(points[0].x)} ${firstY}${curves.join("")}L${EQ.width} ${round2(points[last].y)}`;
    return closed ? `${open}L${EQ.width} ${EQ.height}L${EQ.gutter} ${EQ.height}Z` : open;
  };

  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  const initEqualizer = (eq) => {
    if (!eq) return;
    const svg = eq.querySelector("svg");
    const area = eq.querySelector(".eq-area");
    const line = eq.querySelector(".eq-line");
    const nodes = [...eq.querySelectorAll(".eq-node")];
    const readouts = [...eq.querySelectorAll(".eq-readout li")];
    const chips = [...eq.querySelectorAll("[data-gains]")];
    const initial = chips.find((chip) => chip.getAttribute("aria-pressed") === "true");

    let state = Object.freeze({ gains: parseGains(eq.dataset.gains), preset: initial ? initial.textContent.trim() : null });
    let shown = state.gains;
    let frame = 0;
    let dragging = -1;

    const draw = (gains) => {
      shown = gains;
      area.setAttribute("d", curvePath(gains, true));
      line.setAttribute("d", curvePath(gains, false));
      nodes.forEach((node, i) => node.setAttribute("transform", `translate(${round2(bandX(i))} ${round2(gainY(gains[i]))})`));
    };

    const describe = ({ gains, preset }) => {
      nodes.forEach((node, i) => {
        node.setAttribute("aria-valuenow", String(gains[i]));
        node.setAttribute("aria-valuetext", formatGain(gains[i]));
      });
      readouts.forEach((item, i) => {
        item.querySelector("b").textContent = formatGain(gains[i]);
        item.classList.toggle("is-zero", gains[i] === 0);
      });
      chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip.textContent.trim() === preset)));
    };

    const glide = (to) => {
      cancelAnimationFrame(frame);
      const from = shown;
      if (reduceMotion) return draw(to);
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / EQ.tween);
        draw(from.map((gain, i) => gain + (to[i] - gain) * easeOut(t)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    // Toucher une bande fait passer le préréglage en « Custom », comme dans l'app.
    const setBand = (index, value) => {
      if (value === state.gains[index] && state.preset === null) return;
      cancelAnimationFrame(frame);
      state = Object.freeze({ gains: Object.freeze(state.gains.map((gain, i) => (i === index ? value : gain))), preset: null });
      draw(state.gains);
      describe(state);
    };

    const choose = (chip) => {
      const gains = parseGains(chip.dataset.gains);
      state = Object.freeze({ gains, preset: chip.textContent.trim() });
      describe(state);
      if (!sameGains(gains, shown)) glide(gains);
    };

    const toSvgPoint = (event) => {
      const matrix = svg.getScreenCTM();
      return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
    };
    const nearestBand = (x) =>
      nodes.reduce((best, _, i) => (Math.abs(bandX(i) - x) < Math.abs(bandX(best) - x) ? i : best), 0);

    const release = () => {
      if (dragging < 0) return;
      nodes[dragging].classList.remove("is-active");
      dragging = -1;
    };

    svg.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const point = toSvgPoint(event);
      if (!point) return;
      event.preventDefault();
      dragging = nearestBand(point.x);
      nodes[dragging].classList.add("is-active");
      nodes[dragging].focus({ preventScroll: true, focusVisible: false });
      setBand(dragging, gainAtY(point.y));
      // Sans capture (pointeur déjà relâché), le glisser s'arrête simplement au bord du SVG.
      if (event.isTrusted) svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener("pointermove", (event) => {
      if (dragging < 0) return;
      const point = toSvgPoint(event);
      if (point) setBand(dragging, gainAtY(point.y));
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => svg.addEventListener(type, release));

    nodes.forEach((node, i) => {
      node.setAttribute("tabindex", "0");
      node.addEventListener("keydown", (event) => {
        const step = KEY_STEPS[event.key];
        const value = event.key === "Home" ? EQ.min
          : event.key === "End" ? EQ.max
          : step === undefined ? null
          : clampGain(state.gains[i] + step);
        if (value === null) return;
        event.preventDefault();
        setBand(i, value);
      });
    });

    chips.forEach((chip) => chip.addEventListener("click", () => choose(chip)));
    eq.classList.add("is-live");
  };


  initInstallSheet();
  initEqualizer(document.getElementById("eq"));
  pauseLoopsOffscreen();

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
  // l'ouverture entre d'elle-même : les téléphones n'attendent pas qu'on défile
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll(".hero .reveal").forEach((el) => {
      el.classList.add("revealed");
      revealer.unobserve(el);
    });
  }));

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
  const lineWords = lines.map((line) => splitWords(line.querySelector(".sung") || line));
  track.style.setProperty("--lines", String(lines.length));

  const progressIn = (el) => {
    const span = el.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / span)) : 0;
  };

  let currentLine = -1;
  // Centre la ligne chantée en décalant la liste (transform) dans sa scène : rien ne défile,
  // ni la scène ni la page. Jamais de scrollIntoView ici : il ferait défiler la fenêtre aussi.
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

  // ---------- la barre suit la section claire et la section noire ----------
  const nav = document.getElementById("nav");
  const light = document.getElementById("server");
  const black = document.getElementById("lyrics");
  const isUnderNav = (section, middle) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= middle && rect.bottom >= middle;
  };
  const syncNav = () => {
    const middle = nav.offsetHeight / 2;
    nav.classList.toggle("on-light", isUnderNav(light, middle));
    nav.classList.toggle("on-black", isUnderNav(black, middle));
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
  // La scène suit la hauteur visible (barres de Safari rentrées ou sorties) : on recentre la
  // ligne au prochain rendu. Seulement un style — la position de la page n'est jamais touchée.
  const onResize = () => {
    currentLine = -1;
    onScroll();
  };
  addEventListener("resize", onResize);
  window.visualViewport?.addEventListener("resize", onResize);
  onScroll();
})();

// ---------- avis App Store, en direct ----------
// Les flux publics d'Apple répondent avec CORS ouvert : chaque visite lit les avis de chaque
// vitrine, sans serveur. Les deux avis écrits dans le HTML restent si rien ne répond.
(() => {
  "use strict";
  const list = document.getElementById("reviews-list");
  const score = document.getElementById("reviews-score");
  if (!list || !window.fetch) return;
  const APP = "6818241470";
  const MIN_RATING = 4;
  // Ce qu'un avis demandait et qu'Aura fait depuis, par pseudo de l'auteur.
  const SINCE = {
    tj3t3r: ["Sort by artist", "Added in 1.5.1"],
    LuckyRUS38: ["CarPlay", "Already in Aura"],
  };
  const STOREFRONTS = ["us", "gb", "ca", "au", "de", "fr", "it", "es", "nl", "be", "ch", "at", "se",
    "no", "dk", "fi", "pl", "cz", "pt", "br", "mx", "ie", "nz", "tr", "jp", "kr", "in", "ru", "ua"];
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const month = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });
  const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const reviewsFrom = (cc) => json(`https://itunes.apple.com/${cc}/rss/customerreviews/page=1/id=${APP}/sortby=mostrecent/json`)
    .then((d) => {
      const e = d?.feed?.entry;
      return (Array.isArray(e) ? e : e ? [e] : []).map((x) => ({
        id: x.id?.label, cc,
        rating: Number(x["im:rating"]?.label), title: x.title?.label ?? "", body: x.content?.label ?? "",
        author: x.author?.name?.label ?? "", date: new Date(x.updated?.label),
      }));
    });

  const line = (cls, text) => { const p = document.createElement("p"); p.className = cls; p.textContent = text; return p; };
  const note = (feature, status) => {
    const div = document.createElement("div");
    div.className = "review-note";
    const mark = document.createElement("span");
    mark.className = "review-note-mark"; mark.setAttribute("aria-hidden", "true"); mark.textContent = "✓";
    const text = document.createElement("p");
    const b = document.createElement("strong");
    b.textContent = feature;
    const sub = document.createElement("span");
    sub.textContent = status;
    text.append(b, sub);
    div.append(mark, text);
    return div;
  };
  const card = (r) => {
    const li = document.createElement("li");
    li.className = "review";
    const stars = line("review-stars", "★".repeat(r.rating));
    stars.setAttribute("aria-label", `${r.rating} stars`);
    li.append(stars, line("review-title", r.title), line("review-body", r.body.replace(/\s+/g, " ").trim()),
      ...(SINCE[r.author] ? [note(...SINCE[r.author])] : []),
      line("review-by", [r.author, names.of(r.cc.toUpperCase()), isNaN(r.date) ? "" : month.format(r.date)].filter(Boolean).join(" · ")));
    return li;
  };

  Promise.all(STOREFRONTS.map(reviewsFrom)).then((all) => {
    const seen = new Set();
    const shown = all.flat()
      .filter((r) => r.rating >= MIN_RATING && r.body && !seen.has(r.id) && seen.add(r.id))
      .sort((a, b) => b.date - a.date)
      .slice(0, 9);
    if (shown.length) list.replaceChildren(...shown.map(card));
  });

  // La note moyenne de la vitrine américaine, la seule qui en ait assez pour la donner.
  json(`https://itunes.apple.com/lookup?id=${APP}&country=us`).then((d) => {
    const app = d?.results?.[0];
    if (!score || !app?.averageUserRating) return;
    const avg = app.averageUserRating;
    score.innerHTML = "";
    const stars = document.createElement("span");
    stars.className = "stars"; stars.setAttribute("aria-hidden", "true");
    stars.textContent = "★".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));
    score.append(stars, ` ${avg.toFixed(1)} out of 5`);
  });
})();
