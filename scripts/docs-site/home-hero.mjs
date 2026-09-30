export const homeHeroArt = `<div class="home-hero" aria-hidden="true" data-pagefind-ignore></div>`;

export function mountHomeHero(host) {
  if (!host) return () => {};
  function resize() {
    const main = host.parentElement.getBoundingClientRect();
    const rtl = getComputedStyle(host).direction === "rtl";
    const gutter = rtl ? main.left : document.documentElement.clientWidth - main.right;
    host.style.insetInlineEnd = -Math.max(0, gutter) + "px";
  }
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(document.documentElement);
  observer.observe(host.parentElement);
  return () => observer.disconnect();
}
