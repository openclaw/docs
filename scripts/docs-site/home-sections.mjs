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

export function communitySection(icon) {
  const links = [
    ['Community forum', 'Ask questions and share what you’ve built.', 'https://community.openclaw.ai/', 'message-circle'],
    ['GitHub', 'Read the source, report an issue, or contribute.', 'https://github.com/openclaw/openclaw', 'github'],
    ['X', 'Follow OpenClaw for project news and updates.', 'https://x.com/openclaw', 'x-social'],
  ];
  const xLogo = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.4L5.6 22H2.4l7.2-8.4L1.5 2h6.4l4.5 6.8L18.9 2ZM17.5 20h2L6.8 3.9H4.7L17.5 20Z"/></svg>';
  return `<section class="home-community" aria-labelledby="community"><h2 id="community">Community</h2><div class="home-discord"><div class="home-discord-copy"><h3>Come build with us</h3><p>Ask anything, share what you’re making, or just say hi.</p><a class="home-discord-button" href="https://discord.com/invite/clawd">Join us on Discord ${icon('arrow-right')}</a></div><div class="home-discord-art" aria-hidden="true"><img class="home-discord-art-light" src="/assets/discord-invite-studio.webp" alt="" width="1200" height="600" loading="lazy" decoding="async"><img class="home-discord-art-dark" src="/assets/discord-invite-studio-dark.webp" alt="" width="1200" height="600" loading="lazy" decoding="async"></div></div><div class="home-community-grid">${links.map(([title, text, href, glyph]) => `<a class="home-community-link" href="${href}">${glyph === 'x-social' ? xLogo : icon(glyph)}<h3>${title}${icon('arrow-right')}</h3><p>${text}</p></a>`).join('')}</div></section>`;
}
