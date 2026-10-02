import { releaseStripHtml } from "./release-announcement.mjs";
import { parseDocument, DomUtils } from "htmlparser2";
import { featuredGuides, communitySection } from "./home-sections.mjs";
import { channelIcons } from "./channel-icons.mjs";
import { homeContentHtml } from "./home-content.mjs";
import { homeStringsForLocale, escapeUiText } from "./home-strings.mjs";

// Approved decorative headers go here, keyed by the source card's destination.
// Each image supplies src, width and height; the icon remains the fallback.
const capabilityArtwork = {};

export function homeLayoutHtml(source, icon, release = null, locale = "en") {
  const copy = homeStringsForLocale(locale);
  const html = homeContentHtml(source);
  const nodes = parseDocument(html, { withStartIndices: true, withEndIndices: true }).children;
  const tags = nodes.filter((node) => node.type === "tag");
  const slice = (node) => html.slice(node.startIndex, node.endIndex + 1);
  const firstHeading = tags.find((node) => node.name === "h2");
  const introEnd = firstHeading?.startIndex ?? html.length;
  const introNodes = tags.filter((node) => node.startIndex < introEnd);
  const quickLinks = introNodes.find((node) => node.attribs.class?.split(/\s+/).includes("oc-card-grid"));
  const introduction = introNodes.filter((node) => node !== quickLinks).map(slice).join("\n");
  const headings = tags.filter((node) => node.name === "h2");
  const sections = headings.map((node, index) => ({
    id: node.attribs.id,
    html: html.slice(node.startIndex, headings[index + 1]?.startIndex ?? html.length),
  }));
  // Translated headings have translated anchors. Place sections by their stable
  // links/components, while keeping each source heading and anchor untouched.
  for (const section of sections) section.role = sectionRole(section, locale);
  for (let index = 0; index < sections.length - 1; index += 1) {
    if (!sections[index].role && sections[index + 1].role === "how-it-works") {
      sections[index].role = "what-is-openclaw%3F";
    }
  }
  const take = (id, className = "home-reading-section") => {
    const index = sections.findIndex((section) => section.role === id || section.id === id);
    if (index < 0) return "";
    const [section] = sections.splice(index, 1);
    let content = section.html;
    if (id === "key-capabilities") {
      content = content.replace(/(<a class="oc-card[^"]*" href="([^"]*)">)(<svg class="oc-card-icon"[\s\S]*?<\/svg>)\s*<div>/g, (_, card, href, glyph) => {
        const artwork = capabilityArtwork[href];
        const visual = artwork
          ? `<img src="${artwork.src.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" alt="" width="${artwork.width}" height="${artwork.height}" loading="lazy" decoding="async">`
          : glyph;
        return `${card}<div class="home-capability-header" aria-hidden="true">${visual}</div><div class="home-capability-copy">`;
      });
    }
    return `<section class="${className}">${content}</section>`;
  };

  return `<div class="home-layout">
<section class="home-heading" aria-labelledby="docs-title">
  <div class="home-heading-copy"><h1 id="docs-title">OpenClaw</h1><p class="home-description">${copy.tagline.map((text) => `<span>${escapeUiText(text)}</span>`).join("")}</p></div>
</section>
${releaseStripHtml(release, icon, locale)}
${quickLinks ? `<div class="home-quick-links">${slice(quickLinks)}</div>` : ""}
${take("quick-start", "home-setup home-reading-section")}
${channelDirectory(icon, locale)}
${featuredGuides(icon, locale)}
${take("key-capabilities", "home-directory home-capabilities")}
<div class="home-about">${take("what-is-openclaw%3F")}${take("how-it-works", "home-architecture home-reading-section")}${introduction}</div>
${take("dashboard")}
${take("configuration-(optional)")}
${take("browse-docs", "home-directory home-browse")}
${take("start-here", "home-directory home-resources")}
${take("learn-more", "home-directory home-resources")}
${communitySection(icon, locale)}
${sections.map((section) => `<section class="home-reading-section">${section.html}</section>`).join("\n")}
</div>`;
}

function sectionRole(section, locale) {
  const document = parseDocument(section.html);
  const hasClass = (name) => DomUtils.findOne((node) => node.attribs?.class?.split(/\s+/).includes(name), document.children);
  const links = new Set(DomUtils.findAll((node) => node.name === "a" && node.attribs.href, document.children)
    .map((node) => {
      const href = node.attribs.href;
      const prefix = `/${locale}`;
      return locale !== "en" && (href === prefix || href.startsWith(prefix + "/"))
        ? href.slice(prefix.length) || "/" : href;
    }));
  if (hasClass("oc-steps")) return "quick-start";
  if (hasClass("oc-mermaid")) return "how-it-works";
  if (links.has("/tools/plugin") && links.has("/nodes/images")) return "key-capabilities";
  if (links.has("/providers") && links.has("/platforms")) return "browse-docs";
  if (links.has("/start/hubs") && links.has("/gateway/remote")) return "start-here";
  if (links.has("/reference/credits")) return "learn-more";
  if (links.has("http://127.0.0.1:18789/")) return "dashboard";
  if (hasClass("oc-code") && DomUtils.textContent(document).includes("openclaw.json")) return "configuration-(optional)";
  return null;
}

function channelDirectory(icon, locale) {
  const [title, description, allChannels] = homeStringsForLocale(locale).channels;
  const channels = [
    ["Discord", "discord", "discord", "#8991ff"],
    ["Telegram", "telegram", "telegram", "#68b6e8"],
    ["WhatsApp", "whatsapp", "whatsapp", "#70c799"],
    ["Slack", "slack", "slack", "#c8a1c8"],
    ["Signal", "signal", "signal", "#9cafdf"],
    ["iMessage", "imessage", "apple", "#67a9f4"],
    ["Google Chat", "googlechat", "googlechat", "#75b98a"],
    ["Microsoft Teams", "msteams", "msteams", "#969bea"],
    ["Feishu / Lark", "feishu", "feishu", "#72a7ff"],
    ["Matrix", "matrix", "matrix", "var(--ink)"],
    ["Mattermost", "mattermost", "mattermost", "#6b9bd6"],
  ];
  return `<section class="home-channels" aria-labelledby="connect-a-channel">
<div class="home-section-heading"><div><h2 id="connect-a-channel">${escapeUiText(title)}</h2><p>${escapeUiText(description)}</p></div></div>
<div class="home-channel-grid">${channels.map(([label, slug, glyph, color]) => `<a class="home-channel" href="/channels/${slug}"><span class="home-channel-icon" style="--channel-color:${color}">${channelIcons[glyph]}</span><span>${label}</span>${icon("arrow-right")}</a>`).join("")}<a class="home-channel home-channel-more" href="/channels"><span class="home-channel-icon">${icon("grid-2x2")}</span><span>${escapeUiText(allChannels)}</span>${icon("arrow-right")}</a></div>
</section>`;
}
