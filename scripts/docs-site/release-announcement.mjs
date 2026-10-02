import { homeStringsForLocale } from "./home-strings.mjs";

// Update these two fields when publishing the next release. The matching
// docs/releases/<version>.md page must have arrived through source sync first.
// Set to null to disable the announcement.
export const releaseAnnouncement = {
  version: "2026.9.7",
  summary: "Smoother chats, safer updates, and Sign in with ChatGPT (Beta).",
};

const escape = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function releaseVersionHtml(release, locale = "en") {
  if (!release) return "";
  return `<span class="release-nav-version"><i aria-hidden="true"></i><span class="release-sr-only">${escape(homeStringsForLocale(locale).release[4])} </span>v${escape(release.version)}</span>`;
}

export function releaseBadgeHtml(release, locale = "en") {
  return release ? ` <span class="release-entry-badge"><i aria-hidden="true"></i>${escape(homeStringsForLocale(locale).release[3])}</span>` : "";
}

export function releaseStripHtml(release, icon, locale = "en") {
  if (!release) return "";
  const [label, action, summary] = homeStringsForLocale(locale).release;
  return `<a class="release-strip" href="${escape(release.href)}"><span class="release-strip-body"><span class="release-strip-heading"><span class="release-strip-label">${escape(label)}</span><i aria-hidden="true"></i><span class="release-strip-version">v${escape(release.version)}</span></span><span class="release-strip-summary">${escape(locale === "en" ? release.summary : summary)}</span></span><span class="release-strip-action"><span class="release-strip-action-label">${escape(action)}</span> ${icon("arrow-right")}</span></a>`;
}
