// Fixed semantic events only. Never observe field values, pointer movement, or
// keystrokes. Hooks below run at the owning operation's actual outcome boundary.
export function createDocsAnalyticsEvents(analytics) {
  const canonicalHosts = new Set(["openclaw.ai", "docs.openclaw.ai", "community.openclaw.ai", "clawhub.ai", "www.openclaw.org", "openclaw.org"]);
  const socialHosts = { "discord.com": "discord", "discord.gg": "discord", "www.reddit.com": "reddit", "x.com": "x", "www.youtube.com": "youtube", "www.instagram.com": "instagram", "www.linkedin.com": "linkedin" };
  const popupStates = new Map();
  let pagePath = "";
  let sectionObserver;
  let sectionTimers = new Map();
  let readingTimer;
  let scrollFrame;
  let depths = new Set();
  const errorsByView = new WeakMap();
  let communitySeen = false;
  let searchTimer;
  let pendingSearch;
  let vocabulary = new Set();
  let seenSections = new Set();
  let visibleSeconds = 0;
  let readingMilestones = new Set();
  let diagramObserver;
  let diagramDismissal = "navigation";

  function uiLocation(node) {
    for (const [selector, value] of [[".search-modal", "search_results"], [".community-invite", "community_invite"], [".docs-chat", "docs_assistant"], [".page-feedback", "page_feedback"], [".site-header", "header"], [".sidebar", "sidebar"], [".site-footer", "footer"], [".page-actions", "page_actions"], [".pager", "pager"], [".toc", "table_of_contents"]]) {
      if (node?.closest(selector)) return value;
    }
    return "article";
  }
  function contentId(node, type) {
    const nodes = [...document.querySelectorAll(type === "code" ? ".doc .oc-code" : type === "prompt" ? ".doc .oc-prompt" : ".doc [data-heading-anchor]")];
    const target = type === "code" ? node?.closest(".oc-code") : type === "prompt" ? node?.closest(".oc-prompt") : node;
    return pagePath + "#" + type + "-" + (Math.max(0, nodes.indexOf(target)) + 1);
  }
  function installChoice(label) {
    const value = String(label || "").toLowerCase();
    const method = ["pnpm", "npm", "bun", "docker", "powershell", "curl"].find(method => value.includes(method));
    const install_platform = value.includes("windows") || value.includes("powershell") ? "windows" : value.includes("macos") ? "macos" : value.includes("linux") ? "linux" : undefined;
    return { ...(method ? { method } : {}), ...(install_platform ? { install_platform } : {}) };
  }
  function select(content_type, content_id, ui_location, extra = {}) {
    analytics.event("select_content", { content_type, content_id, ui_location, ...extra });
  }
  function artifactChoice(url) {
    const extension = url.pathname.match(/\.(pdf|zip|tar|tgz|gz|dmg|pkg|exe|msi|deb|rpm)$/i)?.[1]?.toLowerCase();
    if (!extension) return null;
    const install_platform = ["dmg", "pkg"].includes(extension) ? "macos" : ["exe", "msi"].includes(extension) ? "windows" : ["deb", "rpm"].includes(extension) ? "linux" : undefined;
    const artifact_version = url.pathname.match(/\/releases\/download\/v?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)\//)?.[1];
    return { method: "download", ...(install_platform ? { install_platform } : {}), ...(artifact_version ? { artifact_version } : {}) };
  }
  function copyContext(control) {
    const type = control?.matches("[data-code-copy]") ? "code" : control?.matches("[data-prompt-copy]") ? "prompt" : control?.matches("[data-copy-page]") ? "page_markdown" : control?.matches("[data-heading-anchor]") ? "heading_link" : "chat_transcript";
    return {
      content_type: type,
      content_id: type === "chat_transcript" ? "docs_assistant" : type === "page_markdown" ? pagePath : contentId(control, type),
      ui_location: uiLocation(control),
      ...installChoice(control?.closest(".oc-code")?.dataset.codeLabel),
    };
  }
  function copy(metadata, success, captured) {
    if (analytics.isCurrentCapture(captured)) analytics.event("copy_action", { ...metadata, action_result: success ? "success" : "error" }, captured.page);
  }
  function popup(popup_id, open, dismiss_method = "close_button", ui_location = "dialog") {
    if (open && !analytics.context()) return;
    if (popupStates.get(popup_id) === open) return;
    const wasOpen = popupStates.get(popup_id);
    popupStates.set(popup_id, open);
    if (open) analytics.event("popup_view", { popup_id, ui_location });
    else if (wasOpen) analytics.event("popup_dismiss", { popup_id, dismiss_method, ui_location });
  }
  function communityVisible(visible) {
    if (!analytics.context()) return;
    if (visible && !communitySeen) {
      communitySeen = true;
      popup("docs_community", true, "", "community_invite");
    }
  }
  function watchDiagram() {
    // The renderer appends this singleton to document.body, outside the .main
    // replaced by PJAX. Its observer remains valid across public navigation.
    const overlay = document.querySelector("[data-mermaid-overlay]");
    if (!overlay) return;
    const sync = () => {
      const open = overlay.classList.contains("open");
      popup("docs_diagram", open, diagramDismissal, "article");
      if (!open) diagramDismissal = "navigation";
    };
    if (!diagramObserver) {
      diagramObserver = new MutationObserver(sync);
      diagramObserver.observe(overlay, { attributes: true, attributeFilter: ["class"] });
    }
    sync();
  }
  addEventListener("keydown", event => {
    if (event.key === "Escape" && document.querySelector("[data-mermaid-overlay].open")) diagramDismissal = "escape";
  }, true);
  function safeSearchTerm(query, items) {
    const value = String(query).normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
    if (!value || value.length > 80 || !/^[\p{L}\p{N} ._-]+$/u.test(value) || /\d{5}|[a-f\d]{20}/i.test(value)) return "";
    if (/\b(?:my|our|your)\s+(?:name|email|phone|address|password|token|secret|api key|credentials?)\b|\b(?:name|email|phone|password|token|secret|api key)\s+is\b|\bi am\b/i.test(value)) return "";
    const allowed = new Set(vocabulary);
    for (const item of items) for (const word of String(item.meta?.title || "").toLowerCase().match(/[\p{L}\p{N}]+/gu) || []) allowed.add(word);
    const words = value.match(/[\p{L}\p{N}]+/gu) || [];
    return words.length > 0 && words.length <= 8 && words.every(word => allowed.has(word)) ? value : "";
  }
  function cancelSearch() { clearTimeout(searchTimer); pendingSearch = null; }
  function flushSearch() {
    clearTimeout(searchTimer);
    if (!pendingSearch) return;
    const { parameters, captured } = pendingSearch;
    if (analytics.isCurrentCapture(captured)) analytics.event("search", parameters, captured.page);
    pendingSearch = null;
  }
  function searchRendered(query, items, renderedCount, search_status, captured) {
    cancelSearch();
    if (!analytics.isCurrentCapture(captured)) return;
    const term = safeSearchTerm(query, items);
    pendingSearch = {
      captured,
      parameters: {
        ...(term ? { search_term: term } : {}),
        search_status,
        search_context: "docs",
        search_filter: "none",
        ...(search_status !== "error" && Number.isSafeInteger(renderedCount) && renderedCount >= 0 ? { result_count: renderedCount } : {}),
      },
    };
    // Count a stable, actually rendered result set, not each input event.
    searchTimer = setTimeout(flushSearch, 1200);
  }
  function formAttempt(form_id, ui_location) { analytics.event("form_attempt", { form_id, ui_location }); }
  function clientError(error_type, error_code, page = analytics.context()) {
    const key = error_type + ":" + error_code;
    if (!page) return;
    let errors = errorsByView.get(page);
    if (!errors) { errors = new Set(); errorsByView.set(page, errors); }
    if (errors.has(key) || errors.size >= 5) return;
    if (analytics.event("client_error", { error_type, error_code, release: page.release }, page)) errors.add(key);
  }
  function scrollDepth(captured) {
    scrollFrame = null;
    if (!analytics.isCurrentCapture(captured)) return;
    const documentHeight = document.documentElement.scrollHeight - innerHeight;
    if (documentHeight <= 0 || scrollY <= 0) return;
    const percentage = Math.min(100, 100 * scrollY / documentHeight);
    for (const percent_scrolled of [25, 50, 75]) {
      if (percentage >= percent_scrolled && !depths.has(percent_scrolled) && analytics.event("scroll_depth", { percent_scrolled })) depths.add(percent_scrolled);
    }
  }
  addEventListener("scroll", () => { if (!scrollFrame && analytics.context()) { const captured = analytics.capture(); scrollFrame = requestAnimationFrame(() => scrollDepth(captured)); } }, { passive: true });
  analytics.onPage(page => {
    pagePath = page.path;
    if (!page.preserveView) {
      depths = new Set(); communitySeen = false; seenSections = new Set();
      visibleSeconds = 0; readingMilestones = new Set();
    }
    // These document-level overlays persist outside PJAX. Keep a measured
    // opening until its real close; never queue an opening from a denied state.
    cancelSearch(); clearInterval(readingTimer); sectionObserver?.disconnect();
    for (const timer of sectionTimers.values()) clearTimeout(timer);
    sectionTimers = new Map();
    vocabulary = new Set("a an the how to do i use with and or for in on is not can my".split(" "));
    for (const node of document.querySelectorAll(".sidebar a,.sidebar summary,.doc h1,.doc h2,.doc h3")) {
      for (const word of node.textContent.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []) vocabulary.add(word);
    }
    let sections = [];
    try { sections = JSON.parse(page.main.dataset.analyticsSections || "[]"); } catch {}
    if (typeof IntersectionObserver !== "undefined") {
      sectionObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          const section_id = entry.target.id;
          clearTimeout(sectionTimers.get(section_id));
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5 || seenSections.has(section_id)) continue;
          const captured = analytics.capture();
          sectionTimers.set(section_id, setTimeout(() => {
            if (!analytics.isCurrentCapture(captured)) return;
            const rect = entry.target.getBoundingClientRect();
            const visible = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2)), Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2)));
            if (document.visibilityState === "visible" && entry.target.contains(visible) && analytics.event("section_view", { section_id })) seenSections.add(section_id);
          }, 1000));
        }
      }, { threshold: [0, 0.5] });
      for (const id of sections) {
        const heading = document.getElementById(id);
        if (heading && page.main.contains(heading)) sectionObserver.observe(heading);
      }
    }
    readingTimer = setInterval(() => {
      if (!analytics.context() || document.visibilityState !== "visible" || document.querySelector(".search-modal.open,.docs-chat.open")) return;
      visibleSeconds++;
      for (const engagement_seconds of [30, 60]) {
        if (visibleSeconds >= engagement_seconds && !readingMilestones.has(engagement_seconds)
          && analytics.event("content_engagement", { engagement_seconds, content_type: "documentation", content_id: page.path })) readingMilestones.add(engagement_seconds);
      }
      if (readingMilestones.has(60)) clearInterval(readingTimer);
    }, 1000);
  });
  document.addEventListener("click", e => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target || !analytics.context()) return;
    if (target.closest("[data-mermaid-expand]")) { const captured = analytics.capture(); requestAnimationFrame(() => { if (analytics.isCurrentCapture(captured)) watchDiagram(); }); }
    if (target.closest("[data-mermaid-overlay].open") && !target.closest("[data-mermaid-overlay-canvas]")) diagramDismissal = target.closest("[data-mermaid-overlay-close]") ? "close_button" : "backdrop";
    const tab = target.closest(".oc-code-tab");
    if (tab) {
      const group = [...document.querySelectorAll(".doc .oc-code-group")].indexOf(tab.closest(".oc-code-group")) + 1;
      select("code_tab", pagePath + "#code-group-" + group + "-tab-" + [...tab.parentElement.children].indexOf(tab), "article", installChoice(tab.textContent));
      return;
    }
    const link = target.closest("a[href]");
    if (!link) return;
    const location = uiLocation(link);
    if (location === "docs_assistant") { select("assistant_link", "reference", location); return; }
    if (link.matches("[data-feedback-issue-link]")) { select("feedback_issue", "open_issue", location); return; }
    if (!link.closest(".doc,.sidebar,.site-header,.site-footer,.page-actions,.pager,.toc,.community-invite,.search-modal")) return;
    let url;
    try { url = new URL(link.href); } catch { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    const artifact = artifactChoice(url);
    if (link.matches(".search-result")) flushSearch();
    if (socialHosts[url.hostname]) select("social_link", socialHosts[url.hostname], location);
    else if (canonicalHosts.has(url.hostname) && !/\/ask-molty\/|\/__elements/i.test(url.pathname)) {
      select(link.matches(".search-result") ? "search_result" : artifact ? "download" : url.hostname === "docs.openclaw.ai" ? "documentation" : "site_link", url.hostname === "docs.openclaw.ai" ? url.pathname : url.hostname + url.pathname, location, artifact || {});
    } else if (link.closest(".page-actions")) select("page_action", /chatgpt/.test(url.hostname) ? "ask_chatgpt" : /claude/.test(url.hostname) ? "ask_claude" : "view_markdown", location);
    else if (link.closest(".doc,.site-footer,.site-header,.sidebar,.community-invite") && !url.username && !url.password) select(artifact ? "download" : "public_reference", url.origin + url.pathname, location, artifact || {});
  });
  addEventListener("error", event => {
    const tag = event.target?.tagName;
    if (tag && tag !== "WINDOW") clientError("resource", ({ IMG: "image_load", SCRIPT: "script_load", LINK: "style_load" })[tag] || "resource_load");
    else clientError("runtime", ({ TypeError: "type_error", ReferenceError: "reference_error", RangeError: "range_error", SyntaxError: "syntax_error" })[event.error?.name] || "runtime_error");
  }, true);
  addEventListener("unhandledrejection", () => clientError("runtime", "unhandled_rejection"));
  analytics.onError(clientError);
  return { copyContext, copy, popup, communityVisible, select, formAttempt, searchRendered, cancelSearch, flushSearch, clientError };
}
