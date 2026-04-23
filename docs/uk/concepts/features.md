---
read_when:
    - Ви хочете повний список того, що підтримує OpenClaw
summary: Можливості OpenClaw у каналах, маршрутизації, медіа та UX.
title: Функції
x-i18n:
    generated_at: "2026-04-23T20:49:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5122dbfeff9de7dfa7c900d461c80cba7cc399c87018665180b2294f4783a064
    source_path: concepts/features.md
    workflow: 15
---

## Основні можливості

<Columns>
  <Card title="Канали" icon="message-square" href="/uk/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat тощо через єдиний Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/uk/tools/plugin">
    Bundled plugins додають Matrix, Nextcloud Talk, Nostr, Twitch, Zalo тощо без окремого встановлення у звичайних поточних випусках.
  </Card>
  <Card title="Маршрутизація" icon="route" href="/uk/concepts/multi-agent">
    Маршрутизація між кількома агентами з ізольованими сесіями.
  </Card>
  <Card title="Медіа" icon="image" href="/uk/nodes/images">
    Зображення, аудіо, відео, документи та генерація зображень/відео.
  </Card>
  <Card title="Застосунки та UI" icon="monitor" href="/uk/web/control-ui">
    Web Control UI і супровідний застосунок для macOS.
  </Card>
  <Card title="Мобільні Node" icon="smartphone" href="/uk/nodes">
    Node для iOS і Android зі спарюванням, голосом/чатом і розширеними командами пристрою.
  </Card>
</Columns>

## Повний список

**Канали:**

- Вбудовані канали включають Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat і WhatsApp
- Канали bundled plugin включають BlueBubbles для iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo і Zalo Personal
- Необов’язкові окремо встановлювані channel plugins включають Voice Call і сторонні пакети, такі як WeChat
- Сторонні channel plugins можуть ще більше розширювати Gateway, наприклад WeChat
- Підтримка групових чатів з активацією через згадку
- Безпечні DM через allowlist і спарювання

**Агент:**

- Вбудований runtime агента з потоковою передачею інструментів
- Маршрутизація між кількома агентами з ізольованими сесіями для кожного робочого простору або відправника
- Сесії: прямі чати згортаються в спільну `main`; групи ізольовані
- Streaming і chunking для довгих відповідей

**Автентифікація та провайдери:**

- 35+ провайдерів моделей (Anthropic, OpenAI, Google та інші)
- Автентифікація підписки через OAuth (наприклад, OpenAI Codex)
- Підтримка власних і самостійно розгорнутих провайдерів (vLLM, SGLang, Ollama і будь-який endpoint, сумісний з OpenAI або Anthropic)

**Медіа:**

- Зображення, аудіо, відео та документи на вхід і вихід
- Спільні поверхні можливостей генерації зображень і відео
- Транскрибування голосових повідомлень
- Перетворення тексту на мовлення з кількома провайдерами

**Застосунки та інтерфейси:**

- WebChat і браузерний Control UI
- Супровідний застосунок для macOS у рядку меню
- Node для iOS зі спарюванням, Canvas, камерою, записом екрана, геолокацією та голосом
- Node для Android зі спарюванням, чатом, голосом, Canvas, камерою та командами пристрою

**Інструменти та автоматизація:**

- Автоматизація браузера, exec, ізоляція
- Вебпошук (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron jobs і планування Heartbeat
- Skills, plugins і конвеєри робочих процесів (Lobster)
