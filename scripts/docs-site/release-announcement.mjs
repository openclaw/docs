// Update these two fields when publishing the next release. The matching
// docs/releases/<version>.md page must have arrived through source sync first.
// Set to null to disable the announcement.
export const releaseAnnouncement = {
  version: "2026.9.7",
  summary: "Smoother chats, safer updates, and Sign in with ChatGPT (Beta).",
};

const escape = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function releaseVersionHtml(release) {
  if (!release) return "";
  return `<span class="release-nav-version"><i aria-hidden="true"></i><span class="release-sr-only">Latest release: </span>v${escape(release.version)}</span>`;
}

export function releaseBadgeHtml(release) {
  return release ? ` <span class="release-entry-badge"><i aria-hidden="true"></i>Latest</span>` : "";
}

export function releaseStripHtml(release, icon) {
  if (!release) return "";
  return `<a class="release-strip" href="${escape(release.href)}"><span class="release-strip-body"><span class="release-strip-heading"><span class="release-strip-label">New release</span><i aria-hidden="true"></i><span class="release-strip-version">v${escape(release.version)}</span></span><span class="release-strip-summary">${escape(release.summary)}</span></span><span class="release-strip-action"><span class="release-strip-action-label">Read release notes</span> ${icon("arrow-right")}</span></a>`;
}
