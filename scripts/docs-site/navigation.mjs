export function activeTabTitle(nav, slug) {
  return nav.find((tab) => flattenNav([tab]).some((page) => page.slug === slug))?.title ?? nav[0]?.title ?? "";
}

export function groupForPage(nav, slug) {
  for (const tab of nav) {
    for (const group of tab.groups) {
      if (flattenNavEntries(group.pages).some((page) => page.slug === slug)) {
        return group.title;
      }
    }
  }
}

export function flattenNavEntries(entries) {
  return entries.flatMap((entry) => entry.group ? flattenNavEntries(entry.pages) : [entry]);
}

export function flattenNav(nav) {
  return nav.flatMap((tab) => tab.groups.flatMap((group) => flattenNavEntries(group.pages)));
}
