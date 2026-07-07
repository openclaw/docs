import { parentPort, workerData } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

// Embedded brand fonts so cards render identically on macOS and CI.
export const ogFontOptions = {
  loadSystemFonts: false,
  defaultFontFamily: "Switzer",
  fontFiles: [
    "Switzer-Regular.otf",
    "Switzer-Semibold.otf",
    "Switzer-Bold.otf",
    "JetBrainsMono-Regular.ttf",
    "JetBrainsMono-Bold.ttf",
  ].map((file) => fileURLToPath(new URL(`./fonts/${file}`, import.meta.url))),
};

if (parentPort) {
  try {
    const png = new Resvg(workerData.svg, { fitTo: { mode: "width", value: 1200 }, font: ogFontOptions }).render().asPng();
    parentPort.postMessage({ png });
  } catch (err) {
    parentPort.postMessage({ error: err.message });
  }
}
