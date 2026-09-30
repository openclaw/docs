// Update these two fields when publishing the next release. The matching
// docs/releases/<version>.md page must have arrived through source sync first.
// Set to null to disable the announcement.
export const releaseAnnouncement = {
  version: "2026.9.6",
  summary: "Managed updates, restart recovery, and 30-day Usage reporting.",
};

const escape = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stateLabel = (newLabel, latestLabel) => `<span data-release-new>${newLabel}</span><span data-release-latest>${latestLabel}</span>`;
const attributes = (release) => `data-release-version="${escape(release.version)}"`;

export function releaseVersionHtml(release) {
  if (!release) return "";
  return `<span class="release-nav-version" ${attributes(release)}><i aria-hidden="true"></i><span class="release-sr-only">${stateLabel("New release: ", "Latest release: ")}</span>v${escape(release.version)}</span>`;
}

export function releaseBadgeHtml(release) {
  return release ? ` <span class="release-entry-badge" ${attributes(release)}>${stateLabel("New", "Latest")}</span>` : "";
}

export function releaseStripHtml(release, icon) {
  if (!release) return "";
  return `<a class="release-strip" href="${escape(release.href)}" ${attributes(release)}><span class="release-strip-body"><span class="release-strip-heading"><span class="release-strip-label"><i aria-hidden="true"></i>${stateLabel("New release", "Latest release")}</span><span class="release-strip-version">v${escape(release.version)}</span></span><span class="release-strip-summary">${escape(release.summary)}</span></span><span class="release-strip-action">Read release notes ${icon("arrow-right")}</span></a>`;
}
