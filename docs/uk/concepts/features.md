---
read_when:
    - Вам потрібен повний список того, що підтримує OpenClaw
summary: Можливості OpenClaw у каналах, маршрутизації, медіа та UX.
title: Можливості
x-i18n:
    generated_at: "2026-05-06T02:05:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## Основне

<Columns>
  <Card title="Канали" icon="message-square" href="/uk/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat та інші через один Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/uk/tools/plugin">
    Вбудовані plugins додають Matrix, Nextcloud Talk, Nostr, Twitch, Zalo та інші без окремого встановлення у звичайних поточних випусках.
  </Card>
  <Card title="Маршрутизація" icon="route" href="/uk/concepts/multi-agent">
    Багатоагентна маршрутизація з ізольованими сеансами.
  </Card>
  <Card title="Медіа" icon="image" href="/uk/nodes/images">
    Зображення, аудіо, відео, документи та генерація зображень/відео.
  </Card>
  <Card title="Застосунки та UI" icon="monitor" href="/uk/web/control-ui">
    Веб Control UI та супровідний застосунок для macOS.
  </Card>
  <Card title="Мобільні вузли" icon="smartphone" href="/uk/nodes">
    Вузли iOS і Android зі сполученням, голосом/чатом і розширеними командами пристрою.
  </Card>
</Columns>

## Повний список

**Канали:**

- Вбудовані канали охоплюють Discord, Google Chat, iMessage (застарілий), IRC, Signal, Slack, Telegram, WebChat і WhatsApp
- Вбудовані канали plugin охоплюють BlueBubbles для iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo і Zalo Personal
- Необов’язкові окремо встановлювані канальні plugins охоплюють Voice Call і сторонні пакети, як-от WeChat
- Сторонні канальні plugins можуть додатково розширювати Gateway, наприклад WeChat
- Підтримка групових чатів з активацією на основі згадок
- Безпека DM з allowlists і сполученням

**Агент:**

- Вбудоване середовище виконання агента зі streaming інструментів
- Багатоагентна маршрутизація з ізольованими сеансами для кожного робочого простору або відправника
- Сеанси: прямі чати згортаються у спільний `main`; групи ізольовані
- Streaming і chunking для довгих відповідей

**Автентифікація та провайдери:**

- 35+ провайдерів моделей (Anthropic, OpenAI, Google та інші)
- Автентифікація за підпискою через OAuth (наприклад, OpenAI Codex)
- Підтримка власних і самостійно розгорнутих провайдерів (vLLM, SGLang, Ollama і будь-який OpenAI-сумісний або Anthropic-сумісний endpoint)

**Медіа:**

- Вхідні та вихідні зображення, аудіо, відео й документи
- Спільні поверхні можливостей генерації зображень і відео
- Транскрибування голосових нотаток
- Перетворення тексту на мовлення з кількома провайдерами

**Застосунки та інтерфейси:**

- WebChat і браузерний Control UI
- Супровідний застосунок у рядку меню macOS
- Вузол iOS зі сполученням, Canvas, камерою, записом екрана, геолокацією та голосом
- Вузол Android зі сполученням, чатом, голосом, Canvas, камерою та командами пристрою

**Інструменти й автоматизація:**

- Автоматизація браузера, exec, sandboxing
- Вебпошук (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Завдання Cron і планування Heartbeat
- Skills, plugins і конвеєри робочих процесів (Lobster)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Експериментальні функції" href="/uk/concepts/experimental-features" icon="flask">
    Функції з добровільним увімкненням, які ще не вийшли на стандартну поверхню.
  </Card>
  <Card title="Середовище виконання агента" href="/uk/concepts/agent" icon="robot">
    Модель середовища виконання агента та спосіб диспетчеризації запусків.
  </Card>
  <Card title="Канали" href="/uk/channels" icon="message-square">
    Підключайте Telegram, WhatsApp, Discord, Slack та інші з одного Gateway.
  </Card>
  <Card title="Plugins" href="/uk/tools/plugin" icon="plug">
    Вбудовані та сторонні plugins, які розширюють OpenClaw.
  </Card>
</CardGroup>
