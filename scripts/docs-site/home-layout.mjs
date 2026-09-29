import { parseDocument } from "htmlparser2";
import { channelIcons } from "./channel-icons.mjs";
import { homeContentHtml } from "./home-content.mjs";

// Approved decorative headers go here, keyed by the source card's destination.
// Each image supplies src, width and height; the icon remains the fallback.
const capabilityArtwork = {};

export function homeLayoutHtml(source, icon) {
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
  const take = (id, className = "home-reading-section") => {
    const index = sections.findIndex((section) => section.id === id);
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
  <div class="home-heading-copy"><h1 id="docs-title">OpenClaw docs</h1><p class="home-description">Set up OpenClaw and connect it to the apps you use.</p></div>
</section>
${quickLinks ? `<div class="home-quick-links">${slice(quickLinks)}</div>` : ""}
${take("quick-start", "home-setup home-reading-section")}
${channelDirectory(icon)}
${take("key-capabilities", "home-directory home-capabilities")}
<div class="home-about">${take("what-is-openclaw%3F")}${take("how-it-works", "home-architecture home-reading-section")}${introduction}</div>
${take("dashboard")}
${take("configuration-(optional)")}
${take("browse-docs", "home-directory home-browse")}
${take("start-here", "home-directory home-resources")}
${take("learn-more", "home-directory home-resources")}
${sections.map((section) => `<section class="home-reading-section">${section.html}</section>`).join("\n")}
</div>`;
}

function channelDirectory(icon) {
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
<div class="home-section-heading"><div><h2 id="connect-a-channel">Connect a channel</h2><p>Use OpenClaw from your chat app.</p></div></div>
<div class="home-channel-grid">${channels.map(([label, slug, glyph, color]) => `<a class="home-channel" href="/channels/${slug}"><span class="home-channel-icon" style="--channel-color:${color}">${channelIcons[glyph]}</span><span>${label}</span>${icon("arrow-right")}</a>`).join("")}<a class="home-channel home-channel-more" href="/channels"><span class="home-channel-icon">${icon("grid-2x2")}</span><span>See all channels</span>${icon("arrow-right")}</a></div>
</section>`;
}

