import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// One entry per selected route. The SVG already contains title, summary and
// navigation kicker; the signature covers the renderer, its options and fonts.
export function createOgCache(directory, render) {
  const signature = ogRendererSignature();
  fs.mkdirSync(directory, { recursive: true });
  const used = new Set();
  const stats = { hits: 0, misses: 0 };
  return {
    stats,
    async render(slug, svg) {
      const filename = `${digest(slug)}.json`;
      const file = path.join(directory, filename);
      const input = digest(JSON.stringify([signature, svg]));
      used.add(filename);
      try {
        const cached = JSON.parse(fs.readFileSync(file, "utf8"));
        if (cached?.input === input && typeof cached.png === "string") {
          const png = Buffer.from(cached.png, "base64");
          if (isPng(png) && digest(png) === cached.sha256) {
            stats.hits++;
            return png;
          }
        }
      } catch (error) {
        if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
      }
      stats.misses++;
      const png = Buffer.from(await render(svg));
      if (!isPng(png)) throw new Error("OG renderer returned an invalid PNG");
      const temporary = `${file}.tmp`;
      fs.writeFileSync(temporary, JSON.stringify({ input, sha256: digest(png), png: png.toString("base64") }));
      fs.renameSync(temporary, file);
      return png;
    },
    prune() {
      for (const entry of fs.readdirSync(directory)) {
        if (/^[a-f0-9]{64}\.json(?:\.tmp)?$/.test(entry) && !used.has(entry)) {
          fs.rmSync(path.join(directory, entry));
        }
      }
    },
  };
}

function isPng(bytes) {
  return bytes.length >= 20
    && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
    && bytes.subarray(-12).equals(Buffer.from("0000000049454e44ae426082", "hex"));
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function ogRendererSignature() {
  const hash = createHash("sha256").update(JSON.stringify([process.versions, process.platform, process.arch]));
  for (const file of [
    new URL("./og-cache.mjs", import.meta.url),
    new URL("./og-render-worker.mjs", import.meta.url),
    new URL("../../package-lock.json", import.meta.url),
  ]) {
    hash.update(fs.readFileSync(file)).update("\0");
  }
  const fonts = new URL("./fonts/", import.meta.url);
  for (const name of fs.readdirSync(fonts).filter((name) => /\.(otf|ttf)$/.test(name)).sort()) {
    hash.update(name).update("\0").update(fs.readFileSync(new URL(name, fonts))).update("\0");
  }
  return hash.digest("hex");
}
