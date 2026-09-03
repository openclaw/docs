import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { createMarkdownRenderer, renderMdxish } from "./mdx-ish.mjs";
import { parseDocsDocument, resolveDocsFragment } from "../../.openclaw-sync/lib/docs-markdown.mjs";

let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

// The independent boundary is Chromium's DOM, not a second call to the ID helper.
test("published headings, compatibility aliases and component IDs match the rendered DOM", async () => {
  const source = [
    "[relative child](./child.md#part)", "", "## agents.defaults.cwd", "", "## Session overrides (`/exec`)", "",
    "## `agent.ID` **Bold** [Link](/x) &amp; <em>HTML</em>", "",
    "## café 中文 日本語 Über", "", "## Repeat", "", "## Repeat", "",
    "## Repeat-2", "", "## Repeat", "",
    '<Accordion title="Outer" id="outer">', "",
    '<Accordion title="Inner">', "", "## Nested.heading", "", "</Accordion>", "", "</Accordion>", "",
    '<Step title="Connect now" id="step-exact">', "A step", "</Step>", "",
    '<Step title="Opt in" titleSize="h2" noAnchor={false}>visible</Step>', "",
    '<Step title="Opt out" titleSize="h2" noAnchor>hidden anchor</Step>', "",
    '<Step title="Also out" titleSize="h2" noAnchor={true}>hidden anchor</Step>', "",
    '<Tab title="Choose mode" id="tab-exact">', "A tab", "</Tab>", "",
    '<ParamField body="fooBar" id="field-exact">', "A field", "</ParamField>", "",
    '<ParamField body="fooBar">', "Another field", "</ParamField>", "",
    '<Accordion title="Repeat">component collision</Accordion>', "",
    '<Accordion title="First adjacent">first body</Accordion>',
    '<Accordion title="Second adjacent">second body</Accordion>', "",
    '<Param body="secondParam">another parameter</Param>', "",
    "## collision.name", "", '<a id="collision-name"></a>', "",
    "## Raw {#custom}", "",
    "## `a{/*keep*/}b`", "",
    "`inline{/*retain*/}code`", "",
    "`multi", "{/*retain*/}", "line`", "",
    '{/* <Accordion id="phantom-jsx">', '## Phantom JSX', '[hidden](/absent)', '</Accordion> */}', "",
    '<span id="raw(a)"></span>', "",
    "```md", '<Accordion id="phantom-fence">', "## Phantom", "[hidden](/absent)", "OPENCLAWVERBATIM0END $&", "{/* retain this comment */}", "</Accordion>", "```", "",
    '    <a id="phantom-indent" href="/absent"></a>', "",
    '<!-- <Accordion id="phantom-comment"> -->', "",
    '`<Badge id="phantom-inline" />`', "",
    '<code>[hidden](/absent)</code>', "",
  ].join("\n");
  const expected = [
    "agents.defaults.cwd", "agents-defaults-cwd", "session-overrides-(%2Fexec)", "session-overrides-/exec",
    "agent.id-bold-link-%26-html", "agent-id-bold-link-&-html",
    "caf%C3%A9-%E4%B8%AD%E6%96%87-%E6%97%A5%E6%9C%AC%E8%AA%9E-%C3%BCber", "café-中文-日本語-über",
    "repeat", "repeat-1", "repeat-2", "repeat-2-2", "repeat-3", "repeat-4",
    "outer", "inner", "nested.heading", "nested-heading", "step-exact", "opt-in", "tab-exact", "field-exact", "param-foo-bar", "param-second-param",
    "first-adjacent", "second-adjacent", "collision.name", "collision-name", "raw-%7B%23custom%7D", "a%7B%2F*keep*%2F%7Db", "raw(a)",
  ].sort();
  const options = { root: "/fixture", sourceFile: "/fixture/docs/guide/index.md", pageRoute: "/guide" };
  const audit = parseDocsDocument(source, undefined, options);
  const page = await browser.newPage();
  try {
    await page.setContent(renderMdxish(source, createMarkdownRenderer(), options));
    const actual = await page.locator("[id]").evaluateAll((elements) => elements.map((el) => el.id).sort());
    assert.deepEqual(actual, expected);
    assert.deepEqual([...audit.ids].sort(), actual);
    assert.equal(new Set(actual).size, actual.length);
    assert.equal(audit.links.includes("/absent"), false);
    assert.equal(await page.getByRole("link", { name: "relative child" }).getAttribute("href"), "/child#part");
    assert.ok(audit.links.includes("/child#part"));
    assert.ok((await page.locator("pre code").first().textContent()).includes("OPENCLAWVERBATIM0END $&"));
    assert.ok((await page.locator("pre code").first().textContent()).includes("{/* retain this comment */}"));
    assert.equal(await page.locator("p > code").first().textContent(), "inline{/*retain*/}code");
    assert.ok((await page.locator("p > code").allTextContents()).includes("multi {/*retain*/} line"));
    assert.equal(await page.locator('[id="agents-defaults-cwd"]').evaluate((el) => el.parentElement.id), "agents.defaults.cwd");
    const positions = () => page.locator("h2").evaluateAll((els) => els.map((el) => [el.offsetTop, el.offsetHeight]));
    const withAliases = await positions();
    await page.locator(".anchor-alias").evaluateAll((els) => els.forEach((el) => el.remove()));
    assert.deepEqual(await positions(), withAliases);
    assert.ok(audit.collisions.some((collision) => collision.id === "collision-name"));
    assert.equal(await page.locator("#outer details h2").getAttribute("id"), "nested.heading");
    assert.equal(await page.locator('[data-heading-anchor="agents.defaults.cwd"]').count(), 1);
    for (const hash of ["#session-overrides-(%2Fexec)", "#session-overrides-(%252Fexec)", "#raw%28a%29"]) {
      assert.ok(resolveDocsFragment(hash, new Set(actual)), hash);
    }
    assert.equal(resolveDocsFragment("#absent", new Set(actual)), undefined);
    assert.equal(resolveDocsFragment("#custom", new Set(actual)), undefined);
  } finally { await page.close(); }
});

test("literal percent targets win over decoded targets and malformed hashes stay literal", () => {
  const ids = new Set(["a%2Fb", "a/b", "100%"]);
  assert.equal(resolveDocsFragment("#a%2Fb", ids), "a%2Fb");
  assert.equal(resolveDocsFragment("#a%252Fb", ids), "a%2Fb");
  assert.equal(resolveDocsFragment("#100%", ids), "100%");
  assert.equal(resolveDocsFragment("#%malformed", ids), undefined);
});

test("relative links follow the browser's final page URL for root and directory indexes", async () => {
  const page = await browser.newPage();
  try {
    for (const route of ["/", "/root"]) {
      const sourceFile = `/fixture/docs${route === "/" ? "" : route}/index.md`;
      const html = renderMdxish("[next](next#target)", createMarkdownRenderer(), { root: "/fixture", sourceFile, pageRoute: route });
      await page.route(`https://relative.example${route}`, (request) => request.fulfill({ contentType: "text/html", body: `${html}<a href="next#target">native</a>` }));
      await page.goto(`https://relative.example${route}`);
      const hrefs = await page.locator("a").evaluateAll((links) => links.map((link) => link.href));
      assert.deepEqual(hrefs, ["https://relative.example/next#target", "https://relative.example/next#target"]);
      assert.deepEqual(parseDocsDocument("[next](next#target)", undefined, { pageRoute: route }).links, ["/next#target"]);
    }
  } finally { await page.close(); }
});

test("fragment navigation opens nested details on load, clicks, PJAX and history", async () => {
  const { siteJs } = await import("./assets.mjs");
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const html = (name) => `<!doctype html><title>${name}</title><style>body{margin:0} .spacer{height:900px}</style>
    <nav class="toc"><a href="#deep">Deep</a><a href="#a%2Fb">Percent</a></nav>
    <main class="main"><article class="doc"><a href="#a%2Fb">same page</a> <a href="/two#deep-alias">to two</a> <a href="https://external.example/two#deep">external</a>
    <div class="spacer"></div><details><summary>Outer</summary><details><summary>Inner</summary>
    <h2 id="deep"><span class="anchor-alias" id="deep-alias" aria-hidden="true"></span>Deep ${name}</h2><h2 id="a%2Fb">Literal percent</h2><div class="spacer"></div><h2 id="a/b">Decoded</h2>
    </details></details></article></main><script>${siteJs()}</script>`;
  await page.route("https://anchors.example/**", (route) => route.fulfill({
    contentType: "text/html", body: html(new URL(route.request().url()).pathname),
  }));
  await page.route("https://external.example/**", (route) => route.fulfill({ contentType: "text/html", body: "external destination" }));
  const opened = async (id) => {
    await page.waitForFunction((targetId) => {
      const target = document.getElementById(targetId);
      if (!target) return false;
      for (let parent = target.parentElement; parent; parent = parent.parentElement) {
        if (parent.tagName === "DETAILS" && !parent.open) return false;
      }
      return target.getBoundingClientRect().top >= -1 && target.getBoundingClientRect().top < 300;
    }, id);
  };
  try {
    await page.goto("https://anchors.example/one#deep-alias");
    await opened("deep");
    assert.equal(await page.locator(".toc a.active").getAttribute("href"), "#deep");
    assert.ok(Math.abs(await page.locator("#deep").evaluate((el) => el.getBoundingClientRect().top)) < 1);
    await page.evaluate(() => document.querySelectorAll("details").forEach((el) => { el.open = false; }));
    await page.getByRole("link", { name: "same page" }).click();
    await opened("a%2Fb");
    await page.getByRole("link", { name: "to two" }).click();
    await page.waitForFunction(() => location.pathname === "/two");
    await opened("deep");
    assert.equal(await page.locator(".toc a.active").getAttribute("href"), "#deep");
    await page.goBack();
    await page.waitForFunction(() => location.pathname === "/one");
    await opened("a%2Fb");
    await page.goForward();
    await page.waitForFunction(() => location.pathname === "/two");
    await opened("deep");
    await page.getByRole("link", { name: "external", exact: true }).click();
    await page.waitForURL("https://external.example/two#deep");
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});
