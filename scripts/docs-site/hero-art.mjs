// Adapted from the live OpenClaw Community theme, 2026-09-25.
// Source: theme22 source map 309daa91f4a4a1e3d4d552fb803579ca074af823.
const ROW_COUNT = 26;
const COLUMN_COUNT = 220;
const DITHER_MATRIX = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const GLYPHS = " .:-=+xX#8@";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const field = Array.from({ length: ROW_COUNT }, (_rowEntry, row) =>
  Array.from({ length: COLUMN_COUNT }, (_columnEntry, column) => {
    const horizontal = column - COLUMN_COUNT / 2;
    const vertical = (31 - row) * 1.9;
    const distance = Math.sqrt(horizontal * horizontal + vertical * vertical);
    const envelope =
      Math.sin(Math.atan2(vertical, horizontal)) ** 2 *
      Math.min(Math.max(1.15 - distance / 110, 0), 1) *
      Math.min(Math.max((distance - 24) / 18, 0), 1) *
      1.4;

    return {
      distance,
      envelope,
      threshold: (DITHER_MATRIX[row % 4][column % 4] + 0.5) / 16,
    };
  })
);

// OpenClaw's deployed ascii-aurora renderer (openclaw.ai, 0f1483fc).
// Keep the pointer in preformatted character coordinates, including clipped columns.
export function renderOpenClawHeroFrame(phase = 0, pointer = null) {
  let output = "";
  const active = pointer !== null && pointer.presence > 0;
  const gain = active ? Math.min(pointer.presence, 1) : 0;

  for (const [rowIndex, row] of field.entries()) {
    for (const [columnIndex, { distance, envelope, threshold }] of row.entries()) {
      let sampleDistance = distance;
      let lift = 0;
      if (active) {
        const dx = columnIndex - pointer.column;
        const dy = (rowIndex - pointer.row) * 1.9;
        const pointerDistance = Math.sqrt(dx * dx + dy * dy);
        const spread = pointerDistance / 20;
        if (pointerDistance > 0 && spread < 2.5) {
          const magnitude = 9 * gain * spread * Math.exp(0.5 - spread * spread) * Math.SQRT2;
          const sampleColumn = columnIndex - (dx / pointerDistance) * magnitude;
          const sampleRow = rowIndex - (dy / pointerDistance) * magnitude / 1.9;
          const horizontal = sampleColumn - COLUMN_COUNT / 2;
          const vertical = (ROW_COUNT + 5 - sampleRow) * 1.9;
          sampleDistance = Math.sqrt(horizontal * horizontal + vertical * vertical);
          lift = Math.exp(-(spread * spread)) * gain * 0.6;
        }
      }
      let intensity =
        (0.5 + 0.5 * Math.sin(sampleDistance * 0.3 - phase * 0.35)) ** 3.5 * envelope * (1 + lift);

      if (intensity < 0.05) {
        intensity = 0;
      }

      intensity = Math.min(Math.max(intensity, 0), 1);
      const scaled = intensity * 10;
      const glyphIndex = Math.min(
        10,
        Math.floor(scaled) + Number(scaled % 1 > threshold)
      );
      output += GLYPHS[glyphIndex];
    }
    output += "\n";
  }

  return output;
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, name);

  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, value);
  }

  return element;
}

function createMoltyMark() {
  const mark = svgElement("svg", {
    class: "oc-hero-mark",
    viewBox: "0 0 120 120",
    fill: "none",
    "aria-hidden": "true",
  });
  const gradientId = "oc-hero-molty-gradient";
  const gradientFill = `url(#${gradientId})`;
  const body = svgElement("path", {
    d: "M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z",
    fill: gradientFill,
  });
  const leftClaw = svgElement("path", {
    d: "M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z",
    fill: gradientFill,
  });
  const rightClaw = svgElement("path", {
    d: "M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z",
    fill: gradientFill,
  });
  const leftAntenna = svgElement("path", {
    d: "M45 15 Q35 5 30 8",
    stroke: "var(--oc-accent-primary)",
    "stroke-width": "2",
    "stroke-linecap": "round",
  });
  const rightAntenna = svgElement("path", {
    d: "M75 15 Q85 5 90 8",
    stroke: "var(--oc-accent-primary)",
    "stroke-width": "2",
    "stroke-linecap": "round",
  });
  const leftEye = svgElement("circle", {
    cx: "45",
    cy: "35",
    r: "6",
    fill: "#101012",
  });
  const rightEye = svgElement("circle", {
    cx: "75",
    cy: "35",
    r: "6",
    fill: "#101012",
  });
  const leftPupil = svgElement("circle", {
    cx: "46",
    cy: "34",
    r: "2",
    fill: "var(--oc-accent-secondary)",
  });
  const rightPupil = svgElement("circle", {
    cx: "76",
    cy: "34",
    r: "2",
    fill: "var(--oc-accent-secondary)",
  });
  const definitions = svgElement("defs");
  const gradient = svgElement("linearGradient", {
    id: gradientId,
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "100%",
  });
  gradient.append(
    svgElement("stop", {
      offset: "0%",
      "stop-color": "var(--oc-accent-primary)",
    }),
    svgElement("stop", {
      offset: "100%",
      "stop-color": "var(--oc-accent-primary-deep)",
    })
  );
  definitions.append(gradient);
  mark.append(
    body,
    leftClaw,
    rightClaw,
    leftAntenna,
    rightAntenna,
    leftEye,
    rightEye,
    leftPupil,
    rightPupil,
    definitions
  );

  return mark;
}

export function mountOpenClawHeroArt(container) {
  if (
    !container ||
    getComputedStyle(container)
      .getPropertyValue("--oc-hero-art-enabled")
      .trim() !== "1"
  ) {
    return () => {};
  }

  container.querySelector(".oc-hero-art")?.remove();
  container.querySelector(".oc-hero-mark")?.remove();

  const layer = document.createElement("div");
  const artwork = document.createElement("pre");
  const molty = createMoltyMark();
  layer.className = "oc-hero-art";
  layer.setAttribute("aria-hidden", "true");
  layer.append(artwork);
  container.prepend(layer, molty);

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const motionEnabled =
    getComputedStyle(container)
      .getPropertyValue("--oc-hero-motion-enabled")
      .trim() === "1";
  const shouldAnimate = () => motionEnabled && !prefersReducedMotion.matches;
  const abortController = new AbortController();
  let animationFrame = 0;
  let previousTime = 0;
  let visible = true;
  let destroyed = false;
  let target = null;
  let pointerX = 0;
  let pointerY = 0;
  let presence = 0;

  artwork.textContent = renderOpenClawHeroFrame(0);

  const stop = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  const draw = (time) => {
    if (destroyed || document.hidden || !visible || !shouldAnimate()) {
      stop();
      return;
    }

    const interval = target !== null || presence > 0 ? 1000 / 30 : 100;
    if (time - previousTime >= interval) {
      previousTime = time;
      if (target) {
        pointerX += (target.x - pointerX) * 0.28;
        pointerY += (target.y - pointerY) * 0.28;
      }
      presence += ((target ? 1 : 0) - presence) * 0.18;
      if (!target && presence < 0.01) presence = 0;
      const rect = artwork.getBoundingClientRect();
      const pointer = presence > 0 && rect.width > 0 && rect.height > 0
        ? { column: pointerX / rect.width * COLUMN_COUNT,
            row: pointerY / rect.height * ROW_COUNT, presence }
        : null;
      artwork.textContent = renderOpenClawHeroFrame(time / 1000, pointer);
    }

    animationFrame = requestAnimationFrame(draw);
  };

  const updatePointer = (event) => {
    if (event.pointerType === "touch" || !shouldAnimate()) return;
    const rect = artwork.getBoundingClientRect();
    target = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (presence === 0) { pointerX = target.x; pointerY = target.y; }
  };
  container.addEventListener("pointerenter", updatePointer, { signal: abortController.signal });
  container.addEventListener("pointermove", updatePointer, { signal: abortController.signal });
  container.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch") target = null;
  }, { signal: abortController.signal });

  const start = () => {
    if (
      !animationFrame &&
      !destroyed &&
      !document.hidden &&
      visible &&
      shouldAnimate()
    ) {
      animationFrame = requestAnimationFrame(draw);
    }
  };

  document.addEventListener(
    "visibilitychange",
    () => (document.hidden ? stop() : start()),
    { signal: abortController.signal }
  );

  prefersReducedMotion.addEventListener(
    "change",
    () => {
      if (prefersReducedMotion.matches) {
        stop();
        target = null;
        presence = 0;
        artwork.textContent = renderOpenClawHeroFrame(0);
      } else {
        start();
      }
    },
    { signal: abortController.signal }
  );

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) {
        start();
      } else {
        stop();
      }
    },
    { rootMargin: "160px 0px" }
  );

  intersectionObserver.observe(layer);
  start();

  return () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    stop();
    abortController.abort();
    intersectionObserver.disconnect();
    layer.remove();
    molty.remove();
  };
}
