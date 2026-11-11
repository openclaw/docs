import { flattenNavEntries } from "./navigation.mjs";
import { escapeUiText } from "./home-strings.mjs";

// Use release-owned English descriptions/introductions, never calendar version
// numbers or translated prose, to classify releases consistently in every locale.
export function patchReleaseSlugs(pages) {
  return new Set(pages.filter(page => page.locale === "en" && releaseMonth(page.slug)
    && (/\bpatch release\b/i.test(page.description ?? "")
      || /^This (?:is a )?patch release(?: |[.,])/m.test((page.body ?? "").split(/^## /m)[0])))
    .map(page => page.slug));
}

const patchLabels = {
  en: "Patch", sv: "Patch", de: "Patch", fr: "Correctif", es: "Parche", "pt-BR": "Correção",
  ar: "تصحيح", fa: "وصله", "zh-CN": "补丁", "zh-TW": "修補", "ja-JP": "パッチ", ko: "패치",
  hi: "पैच", it: "Correzione", vi: "Bản vá", nl: "Patch", tr: "Yama", uk: "Виправлення",
  id: "Patch", pl: "Poprawka", ru: "Исправление", th: "แพตช์",
};

export function patchReleaseBadgeHtml(locale) {
  return ` <span class="release-patch-badge">${escapeUiText(patchLabels[locale] ?? patchLabels.en)}</span>`;
}

function releaseMonth(slug) {
  const match = /^releases\/(\d{4})\.(\d{1,2})\.\d+(?:[-.][\w.-]+)?$/.exec(slug ?? "");
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) return null;
  return `${match[1]}-${match[2].padStart(2, "0")}`;
}

// Group adjacent release pages without changing source order, links, or groups.
export function releaseNavigationEntries(entries, locale, activeSlug) {
  const firstMonth = flattenNavEntries(entries).map(page => releaseMonth(page.slug)).find(Boolean);
  if (!firstMonth) return entries;
  const selectedMonth = releaseMonth(activeSlug) ?? firstMonth;
  const formatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", calendar: "gregory", timeZone: "UTC" });
  function groupMonths(pages) {
    const result = [];
    for (const entry of pages) {
      if (entry.group) {
        result.push({ ...entry, pages: groupMonths(entry.pages) });
        continue;
      }
      const month = releaseMonth(entry.slug);
      if (!month) {
        result.push(entry);
        continue;
      }
      let group = result.at(-1);
      if (group?.releaseMonth !== month) {
        group = {
          group: formatter.format(new Date(`${month}-01T00:00:00Z`)),
          releaseMonth: month,
          defaultOpen: month === selectedMonth,
          pages: [],
        };
        result.push(group);
      }
      group.pages.push(entry);
    }
    return result;
  }
  return groupMonths(entries);
}
