import { mediaSceneHtml } from "./media-scenes.mjs";

export function featuredGuides(icon) {
  const backgrounds = { schedule: 'mesh-coral-rise', browser: 'mesh-split-coral', agents: 'mesh-vermilion-margin' };
  const guides = [
    ['schedule', '/automation/cron-jobs', 'Put tasks on a schedule', 'Run recurring jobs and deliver the results to your chat.'],
    ['browser', '/tools/browser/setup', 'Give your agent a browser', 'Set up a dedicated browser for your agent to use.'],
    ['agents', '/concepts/multi-agent', 'Run more than one agent', 'Separate workspaces, conversations, and responsibilities.'],
  ];
  return `<section class="home-guides" aria-labelledby="featured-guides"><div class="home-section-heading"><h2 id="featured-guides">Featured guides</h2><a class="home-text-link" href="/start/hubs">All guides ${icon('arrow-right')}</a></div><div class="home-guide-grid">${guides.map(([art, href, title, description]) => `<a class="home-guide home-guide-${art}" href="${href}">${mediaSceneHtml(`<img class="home-guide-ui" src="/assets/guide-${art}-ui.webp" alt="" width="920" height="410" loading="lazy" decoding="async">`, { texture: backgrounds[art], className: 'home-guide-art' })}<div class="home-guide-copy"><h3>${title}${icon('arrow-right')}</h3><p>${description}</p></div></a>`).join('')}</div></section>`;
}

