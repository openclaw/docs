// Serialized into the shared runtime, so this function has no module dependencies.
export function createReleaseAnnouncements() {
  const storageKey = "openclaw.docs.release-seen";
  const readThisVisit = new Set();
  return function syncReleaseAnnouncements() {
    const indicators = [...document.querySelectorAll("[data-release-version]")];
    const releasePage = document.querySelector(".article[data-release-page]")?.dataset.releasePage;
    const version = releasePage || indicators[0]?.dataset.releaseVersion;
    if (!version) return;
    const readingRelease = releasePage === version;
    let stored;
    try { stored = localStorage.getItem(storageKey); } catch { /* Keep navigation usable without storage. */ }
    // A tab may keep an older release open after a deployment. Acknowledge once
    // so storage events cannot make old and new tabs overwrite each other.
    if (readingRelease && !readThisVisit.has(version)) {
      readThisVisit.add(version);
      if (stored !== version) {
        try { localStorage.setItem(storageKey, version); } catch { /* Session-only acknowledgement. */ }
      }
    }
    const unread = stored !== version && !readThisVisit.has(version);
    for (const indicator of indicators) indicator.toggleAttribute("data-release-unread", unread);
  };
}
