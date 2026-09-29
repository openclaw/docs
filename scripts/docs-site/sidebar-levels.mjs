// Enhance the source disclosures without duplicating or dropping any page links.
export function initSidebarLevels() {
  const sidebar = document.querySelector('.sidebar');
  const sections = sidebar?.querySelector('.docs-sections');
  if (!sections || sections.closest('.docs-sidebar-levels')) return;
  const groups = [...sections.querySelectorAll(':scope > .docs-section')];
  const levels = document.createElement('div');
  levels.className = 'docs-sidebar-levels';
  const directory = document.createElement('div');
  directory.className = 'docs-sidebar-directory';
  const menu = document.createElement('nav');
  menu.setAttribute('aria-label', 'Documentation sections');
  const context = document.createElement('div');
  context.className = 'docs-sidebar-context';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'docs-sidebar-back';
  back.setAttribute('aria-label', 'Back to all documentation');
  back.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m14 6-6 6 6 6"/></svg><span></span>';
  sections.before(levels);
  directory.append(sidebar.querySelector('.docs-quick-nav'), sidebar.querySelector('.docs-nav-label'), menu);
  context.append(back, sections);
  levels.append(directory, context);
  levels.updateFade = () => {
    for (const scroller of [directory, sections]) {
      scroller.classList.toggle('can-scroll-up', scroller.scrollTop > 1);
      scroller.classList.toggle('can-scroll-down', scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 1);
    }
  };
  let selected = null;
  let directoryScroll = 0;
  function show(group, event) {
    const previous = selected;
    if (!previous && group) directoryScroll = directory.scrollTop;
    if (previous) previous.dataset.navScroll = sections.scrollTop;
    selected = group;
    levels.dataset.instant = String(!event?.detail);
    for (const item of groups) {
      const visible = item === (group || previous);
      item.hidden = !visible;
      item.open = visible;
    }
    if (group) back.querySelector('span').textContent = group.dataset.docsSection;
    levels.dataset.level = group ? 'section' : 'directory';
    directory.inert = Boolean(group);
    context.inert = !group;
    directory.setAttribute('aria-hidden', String(Boolean(group)));
    context.setAttribute('aria-hidden', String(!group));
    if (group) sections.scrollTop = Number(group.dataset.navScroll || 0);
    else directory.scrollTop = directoryScroll;
    if (event) {
      const target = group ? back : directory.querySelector('[data-section-target="' + groups.indexOf(previous) + '"]');
      target?.focus({ preventScroll: true });
    }
    levels.updateFade();
  }
  for (const [index, group] of groups.entries()) {
    const summary = group.querySelector(':scope > summary');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'docs-section-trigger';
    button.dataset.sectionTarget = index;
    button.innerHTML = summary.innerHTML;
    button.addEventListener('click', event => show(group, event));
    menu.append(button);
  }
  back.addEventListener('click', event => show(null, event));
  // Returning to the directory is a browsing choice; PJAX must not reopen it.
  levels.syncSection = () => {
    const current = groups.find(group => group.classList.contains('current'));
    for (const group of sections.querySelectorAll('.nav-section, .nav-nested')) {
      if (group.querySelector('.nav-link.active')) group.open = true;
    }
    for (const [index, button] of [...menu.children].entries()) {
      if (groups[index] === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    if (selected && current !== selected) show(current);
    levels.updateFade();
  };
  show(document.body.classList.contains('docs-home') ? null : groups.find(group => group.classList.contains('current')));
  levels.syncSection();
}
