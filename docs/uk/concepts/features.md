---
read_when:
    - Вам потрібен повний список того, що підтримує OpenClaw
summary: Можливості OpenClaw щодо каналів, маршрутизації, медіа та UX.
title: Можливості
x-i18n:
    generated_at: "2026-05-11T20:31:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## Основне

<Columns>
  <Card title="Канали" icon="message-square" href="/uk/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat та інші через єдиний Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/uk/tools/plugin">
    Вбудовані plugins додають Matrix, Nextcloud Talk, Nostr, Twitch, Zalo та інші без окремого встановлення у звичайних поточних випусках.
  </Card>
  <Card title="Маршрутизація" icon="route" href="/uk/concepts/multi-agent">
    Багатоагентна маршрутизація з ізольованими сеансами.
  </Card>
  <Card title="Медіа" icon="image" href="/uk/nodes/images">
    Зображення, аудіо, відео, документи та генерація зображень/відео.
  </Card>
  <Card title="Застосунки та інтерфейс" icon="monitor" href="/uk/web/control-ui">
    Вебінтерфейс керування та супровідний застосунок для macOS.
  </Card>
  <Card title="Мобільні вузли" icon="smartphone" href="/uk/nodes">
    Вузли iOS і Android зі сполученням, голосом/чатом і розширеними командами пристрою.
  </Card>
</Columns>

## Повний список

**Канали:**

- Вбудовані канали включають Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat і WhatsApp
- Канали вбудованих plugins включають Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo та Zalo Personal
- Необов’язкові окремо встановлювані канальні plugins включають Voice Call і сторонні пакети, такі як WeChat
- Сторонні канальні plugins можуть додатково розширювати Gateway, наприклад WeChat
- Підтримка групових чатів з активацією на основі згадок
- Безпека DM із allowlists і сполученням

**Агент:**

- Вбудоване середовище виконання агента зі streaming інструментів
- Багатоагентна маршрутизація з ізольованими сеансами для кожного робочого простору або відправника
- Сеанси: прямі чати згортаються у спільний `main`; групи ізольовані
- Streaming і поділ на фрагменти для довгих відповідей

**Автентифікація та провайдери:**

- Понад 35 провайдерів моделей (Anthropic, OpenAI, Google та інші)
- Автентифікація за підпискою через OAuth (наприклад, OpenAI Codex)
- Підтримка власних і самостійно розгорнутих провайдерів (vLLM, SGLang, Ollama та будь-яка сумісна з OpenAI або Anthropic кінцева точка)

**Медіа:**

- Вхідні та вихідні зображення, аудіо, відео й документи
- Спільні поверхні можливостей генерації зображень і відео
- Транскрипція голосових нотаток
- Перетворення тексту на мовлення з кількома провайдерами

**Застосунки та інтерфейси:**

- WebChat і браузерний інтерфейс керування
- Супровідний застосунок у рядку меню macOS
- Вузол iOS зі сполученням, Canvas, камерою, записом екрана, місцеположенням і голосом
- Вузол Android зі сполученням, чатом, голосом, Canvas, камерою та командами пристрою

**Інструменти й автоматизація:**

- Автоматизація браузера, exec, sandboxing
- Вебпошук (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Завдання Cron і планування Heartbeat
- Skills, plugins і конвеєри workflow (Lobster)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Експериментальні функції" href="/uk/concepts/experimental-features" icon="flask">
    Функції з явним увімкненням, які ще не були випущені в стандартній поверхні.
  </Card>
  <Card title="Середовище виконання агента" href="/uk/concepts/agent" icon="robot">
    Модель середовища виконання агента та спосіб диспетчеризації запусків.
  </Card>
  <Card title="Канали" href="/uk/channels" icon="message-square">
    Підключайте Telegram, WhatsApp, Discord, Slack та інші з одного Gateway.
  </Card>
  <Card title="Plugin" href="/uk/tools/plugin" icon="plug">
    Вбудовані та сторонні plugins, які розширюють OpenClaw.
  </Card>
</CardGroup>
