// Aura landing — comportements. Sans ce script, la page reste entièrement lisible :
// le <head> retire la classe .js si ce fichier ne s'est pas exécuté au bout de 3 s.
// L'égaliseur et la carte Get It ont leur état statique dans le HTML ; ce script les anime.
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

  // ---------- Get It : la carte de l'app, étape par étape ----------
  const TRACKS = 12;
  const downloadFrame = (progress) => Object.freeze({
    stage: "downloading",
    status: `Downloading · FLAC · ${Math.floor(progress * TRACKS)}/${TRACKS} tracks · ${Math.round(progress * 100)}%`,
    fills: [1, Math.max(0.04, progress), 0, 0],
    hold: 520,
  });
  const FETCH_TIMELINE = Object.freeze([
    { stage: "searching", status: "Looking on Soulseek", fills: [0.25, 0, 0, 0], hold: 1900 },
    { stage: "searching", status: "Picking the best copy · 7 copies found", fills: [0.7, 0, 0, 0], hold: 1900 },
    ...[0.04, 0.12, 0.26, 0.41, 0.57, 0.72, 0.86, 1].map(downloadFrame),
    { stage: "importing", status: "Adding to your library · About 2 min left", fills: [1, 1, 0.1, 0], hold: 1300 },
    { stage: "importing", status: "Adding to your library · About 2 min left", fills: [1, 1, 0.45, 0], hold: 1300 },
    { stage: "ready", status: "In your library · Tap to play", fills: [1, 1, 1, 1], hold: 3400 },
    { stage: "leaving", hold: 700 },
  ].map((frame) => Object.freeze(frame)));

  const initGetIt = (card) => {
    if (!card || reduceMotion || !("IntersectionObserver" in window)) return; // reste sur « Downloading »
    const status = card.querySelector(".gi-status");
    const steps = [...card.querySelectorAll(".gi-steps i")];
    let index = 0;
    let timer = 0;
    let visible = false;
    let hovered = false;

    const render = (frame) => {
      card.dataset.stage = frame.stage;
      if (frame.stage === "leaving") return;
      status.textContent = frame.status;
      steps.forEach((step, i) => step.style.setProperty("--f", String(frame.fills[i])));
    };
    const play = () => {
      clearTimeout(timer);
      if (!visible || hovered) return;
      const frame = FETCH_TIMELINE[index];
      render(frame);
      timer = setTimeout(() => {
        index = (index + 1) % FETCH_TIMELINE.length;
        play();
      }, frame.hold);
    };

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      play();
    }, { threshold: 0.3 }).observe(card);
    const stage = card.closest(".getit-stage") || card;
    stage.addEventListener("pointerenter", () => { hovered = true; clearTimeout(timer); });
    stage.addEventListener("pointerleave", () => { hovered = false; play(); });
  };

  initInstallSheet();
  initEqualizer(document.getElementById("eq"));
  initGetIt(document.getElementById("gi-card"));
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
