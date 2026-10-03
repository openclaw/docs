import { homeStringsForLocale } from "./home-strings.mjs";

// Source sync supplies the release pages and their approved summaries.
// Choose by numeric version, never by filesystem order or a manual version pin.
export function latestReleaseAnnouncement(pages) {
  let latest = null;
  for (const page of pages) {
    const match = /^releases\/(\d{4})\.(\d+)\.(\d+)$/.exec(page.slug);
    if (!match || page.locale !== "en" || page.hidden || page.meta?.hidden || page.meta?.beta
        || /^(draft|unreleased|prerelease)$/i.test(page.meta?.status ?? "")) continue;
    const parts = match.slice(1).map(Number);
    if (!latest || parts.some((part, index) => part > latest.parts[index]
        && parts.slice(0, index).every((earlier, position) => earlier === latest.parts[position]))) {
      latest = { page, parts, version: match.slice(1).join("."), summary: page.summary || "" };
    }
  }
  if (!latest) return null;
  const { parts, ...announcement } = latest;
  return announcement;
}

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
  return `<a class="release-strip" href="${escape(release.href)}"><span class="release-strip-body"><span class="release-strip-heading"><span class="release-strip-label">${escape(label)}</span><i aria-hidden="true"></i><span class="release-strip-version">v${escape(release.version)}</span></span><span class="release-strip-summary">${escape(locale === "en" ? release.summary || summary : summary)}</span></span><span class="release-strip-action"><span class="release-strip-action-label">${escape(action)}</span> ${icon("arrow-right")}</span></a>`;
}
