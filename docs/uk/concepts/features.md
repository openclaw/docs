---
read_when:
    - Вам потрібен повний список того, що підтримує OpenClaw
summary: Можливості OpenClaw для каналів, маршрутизації, медіа та UX.
title: Можливості
x-i18n:
    generated_at: "2026-05-07T01:51:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f95185073e52f4b5b34042ea27927984bf0b040d20eb61b135514816fddc214
    source_path: concepts/features.md
    workflow: 16
---

## Основне

<Columns>
  <Card title="Канали" icon="message-square" href="/uk/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat та інші через один Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/uk/tools/plugin">
    Вбудовані plugins додають Matrix, Nextcloud Talk, Nostr, Twitch, Zalo та інші без окремого встановлення у звичайних актуальних випусках.
  </Card>
  <Card title="Маршрутизація" icon="route" href="/uk/concepts/multi-agent">
    Маршрутизація між кількома агентами з ізольованими сеансами.
  </Card>
  <Card title="Медіа" icon="image" href="/uk/nodes/images">
    Зображення, аудіо, відео, документи та генерація зображень/відео.
  </Card>
  <Card title="Застосунки й UI" icon="monitor" href="/uk/web/control-ui">
    Веб Control UI і супровідний застосунок для macOS.
  </Card>
  <Card title="Мобільні вузли" icon="smartphone" href="/uk/nodes">
    Вузли iOS і Android зі сполученням, голосом/чатом та розширеними командами пристрою.
  </Card>
</Columns>

## Повний список

**Канали:**

- Вбудовані канали включають Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat і WhatsApp
- Канали вбудованих plugin включають BlueBubbles як застарілий міст iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo і Zalo Personal
- Необов’язкові окремо встановлювані plugins каналів включають Voice Call і сторонні пакети, як-от WeChat
- Сторонні plugins каналів можуть ще більше розширювати Gateway, наприклад WeChat
- Підтримка групових чатів з активацією через згадки
- Безпека DM з allowlist і сполученням

**Агент:**

- Вбудоване середовище виконання агента зі streaming інструментів
- Маршрутизація між кількома агентами з ізольованими сеансами для кожного робочого простору або відправника
- Сеанси: прямі чати згортаються у спільний `main`; групи ізольовані
- Streaming і розбиття на частини для довгих відповідей

**Автентифікація та провайдери:**

- 35+ провайдерів моделей (Anthropic, OpenAI, Google та інші)
- Автентифікація за підпискою через OAuth (наприклад, OpenAI Codex)
- Підтримка власних і self-hosted провайдерів (vLLM, SGLang, Ollama та будь-який endpoint, сумісний з OpenAI або Anthropic)

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
    Функції з ручним увімкненням, які ще не постачаються в типовій поверхні.
  </Card>
  <Card title="Середовище виконання агента" href="/uk/concepts/agent" icon="robot">
    Модель середовища виконання агента й те, як запускаються виконання.
  </Card>
  <Card title="Канали" href="/uk/channels" icon="message-square">
    Під’єднайте Telegram, WhatsApp, Discord, Slack та інші з одного Gateway.
  </Card>
  <Card title="Plugins" href="/uk/tools/plugin" icon="plug">
    Вбудовані та сторонні plugins, які розширюють OpenClaw.
  </Card>
</CardGroup>
