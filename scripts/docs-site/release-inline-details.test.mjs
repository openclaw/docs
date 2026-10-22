import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { chromium } from "playwright";
import { createMarkdownRenderer, renderMdxish } from "./mdx-ish.mjs";

test("patch details follow the fix inline and retain native keyboard access", async () => {
  const browser = await chromium.launch({ headless: true });
  const source = `- **Conversation recovery.** Fixes replies getting stuck after an update.

  <details class="release-source-toggle release-source-inline">
  <summary>More details</summary>

  [#123](https://github.com/openclaw/openclaw/pull/123), thanks to [@example](https://github.com/example).

  </details>

- An unrelated list item.
`;
  const css = fs.readFileSync(new URL("./docs-layout.css", import.meta.url), "utf8");
  try {
    for (const width of [1200, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 700 } });
      try {
        await page.setContent(`<style>${css}</style><div class="docs-layout"><div class="doc">${renderMdxish(source, createMarkdownRenderer())}</div></div>`);
        const summary = page.locator(".release-source-inline > summary");
        const link = page.getByRole("link", { name: "#123", exact: true });
        assert.equal(await link.isVisible(), false);
        const layout = await summary.evaluate((element) => {
          const paragraph = element.parentElement.previousElementSibling;
          const range = document.createRange();
          range.setStart(paragraph.lastChild, paragraph.lastChild.textContent.length - 1);
          range.setEnd(paragraph.lastChild, paragraph.lastChild.textContent.length);
          const end = range.getBoundingClientRect();
          const control = element.getBoundingClientRect();
          // The visible chevron is compact; its pointer area extends past the box.
          const centerX = control.left + control.width / 2;
          const centerY = control.top + control.height / 2;
          const hits = (x, y) => element.contains(document.elementFromPoint(x, y));
          const pointerArea = [-21, 21].every((dy) => hits(centerX, centerY + dy)) && [-21, 21].every((dx) => hits(centerX + dx, centerY));
          return { end: { left: end.left, right: end.right, top: end.top, bottom: end.bottom }, control: { left: control.left, top: control.top, bottom: control.bottom, height: control.height }, pointerArea, lineHeight: paragraph.getBoundingClientRect().height, overflow: document.documentElement.scrollWidth > innerWidth, paragraphDisplay: getComputedStyle(paragraph).display };
        });
        assert.equal(layout.paragraphDisplay, "inline");
        assert.ok(layout.control.height <= 24, "keep the visible control compact");
        assert.equal(layout.pointerArea, true, "retain a 44px pointer target around the control");
        assert.equal(layout.overflow, false, "narrow view must not scroll horizontally");
        if (width === 1200) {
          assert.ok(layout.control.left >= layout.end.right, "control follows the final character");
          assert.ok(layout.control.top < layout.end.bottom && layout.control.bottom > layout.end.top, "control and sentence share a line");
        }
        await summary.click();
        assert.equal(await link.isVisible(), true);
        await summary.focus();
        await page.keyboard.press("Space");
        assert.equal(await link.isVisible(), false);
        await page.keyboard.press("Enter");
        assert.equal(await link.isVisible(), true);
        await page.keyboard.press("Tab");
        assert.equal(await link.evaluate((element) => element === document.activeElement), true);
        await page.keyboard.press("Shift+Tab");
        assert.equal(await summary.evaluate((element) => element === document.activeElement), true);
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
});
