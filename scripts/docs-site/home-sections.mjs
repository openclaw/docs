import { mediaSceneHtml } from "./media-scenes.mjs";
import { homeStringsForLocale, escapeUiText } from "./home-strings.mjs";

export function featuredGuides(icon, locale = "en") {
  const copy = homeStringsForLocale(locale);
  const backgrounds = { schedule: 'mesh-coral-rise', browser: 'mesh-split-coral', agents: 'mesh-vermilion-margin' };
  const guides = [
    ['schedule', '/automation/cron-jobs', ...copy.guideCards[0]],
    ['browser', '/tools/browser/setup', ...copy.guideCards[1]],
    ['agents', '/concepts/multi-agent', ...copy.guideCards[2]],
  ];
  return `<section class="home-guides" aria-labelledby="featured-guides"><div class="home-section-heading"><h2 id="featured-guides">${escapeUiText(copy.guides[0])}</h2><a class="home-text-link" href="/start/hubs">${escapeUiText(copy.guides[1])} ${icon('arrow-right')}</a></div><div class="home-guide-grid">${guides.map(([art, href, title, description]) => `<a class="home-guide home-guide-${art}" href="${href}">${mediaSceneHtml(`<img class="home-guide-ui" src="/assets/guide-${art}-ui.webp" alt="" width="920" height="410" loading="lazy" decoding="async">`, { texture: backgrounds[art], className: 'home-guide-art' })}<div class="home-guide-copy"><h3>${escapeUiText(title)}${icon('arrow-right')}</h3><p>${escapeUiText(description)}</p></div></a>`).join('')}</div></section>`;
}

export function communitySection(icon, locale = "en") {
  const [heading, title, description, join, forum, forumDescription, githubDescription, xDescription] = homeStringsForLocale(locale).community;
  const links = [
    [forum, forumDescription, 'https://community.openclaw.ai/', 'message-circle'],
    ['GitHub', githubDescription, 'https://github.com/openclaw/openclaw', 'github'],
    ['X', xDescription, 'https://x.com/openclaw', 'x-social'],
  ];
  const xLogo = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.4L5.6 22H2.4l7.2-8.4L1.5 2h6.4l4.5 6.8L18.9 2ZM17.5 20h2L6.8 3.9H4.7L17.5 20Z"/></svg>';
  return `<section class="home-community" aria-labelledby="community"><h2 id="community">${escapeUiText(heading)}</h2><div class="home-discord"><div class="home-discord-copy"><h3>${escapeUiText(title)}</h3><p>${escapeUiText(description)}</p><a class="home-discord-button" href="https://discord.com/invite/clawd">${escapeUiText(join)} ${icon('arrow-right')}</a></div><div class="home-discord-art" aria-hidden="true"><img src="/assets/discord-invite-mesh.webp" alt="" width="1236" height="800" loading="lazy" decoding="async"></div></div><div class="home-community-grid">${links.map(([title, text, href, glyph]) => `<a class="home-community-link" href="${href}">${glyph === 'x-social' ? xLogo : icon(glyph)}<h3>${escapeUiText(title)}${icon('arrow-right')}</h3><p>${escapeUiText(text)}</p></a>`).join('')}</div></section>`;
}
