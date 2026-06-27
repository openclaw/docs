---
read_when:
    - Вам потрібен повний список того, що підтримує OpenClaw
summary: Можливості OpenClaw у каналах, маршрутизації, медіа та UX.
title: Можливості
x-i18n:
    generated_at: "2026-06-27T17:25:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## Основне

<Columns>
  <Card title="Канали" icon="message-square" href="/uk/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat та інші через єдиний Gateway.
  </Card>
  <Card title="Плагіни" icon="plug" href="/uk/tools/plugin">
    Вбудовані плагіни додають Matrix, Nextcloud Talk, Nostr, Twitch, Zalo та інші без окремого встановлення у звичайних поточних випусках.
  </Card>
  <Card title="Маршрутизація" icon="route" href="/uk/concepts/multi-agent">
    Багатоагентна маршрутизація з ізольованими сеансами.
  </Card>
  <Card title="Медіа" icon="image" href="/uk/nodes/images">
    Зображення, аудіо, відео, документи, а також генерація зображень і відео.
  </Card>
  <Card title="Застосунки та UI" icon="monitor" href="/uk/platforms">
    Windows Hub, Web Control UI, застосунок для macOS і мобільні вузли.
  </Card>
  <Card title="Мобільні вузли" icon="smartphone" href="/uk/nodes">
    Вузли iOS та Android зі сполученням, голосом/чатом і розширеними командами пристрою.
  </Card>
</Columns>

## Повний список

**Канали:**

- Вбудовані канали включають Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat і WhatsApp
- Вбудовані канали плагінів включають Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo і Zalo Personal
- Необов’язкові канальні плагіни, що встановлюються окремо, включають Voice Call і сторонні пакети, як-от WeChat
- Сторонні канальні плагіни можуть додатково розширювати Gateway, наприклад WeChat
- Підтримка групових чатів з активацією через згадки
- Безпека DM за допомогою списків дозволених і сполучення

**Агент:**

- Вбудоване середовище виконання агента зі потоковою передачею інструментів
- Багатоагентна маршрутизація з ізольованими сеансами для кожного робочого простору або відправника
- Сеанси: прямі чати згортаються у спільний `main`; групи ізольовані
- Потокова передача та розбиття на фрагменти для довгих відповідей

**Автентифікація та провайдери:**

- 35+ провайдерів моделей (Anthropic, OpenAI, Google та інші)
- Автентифікація за підпискою через OAuth (наприклад, OpenAI Codex)
- Підтримка власних і самостійно розгорнутих провайдерів (vLLM, SGLang, Ollama і будь-яка OpenAI-сумісна або Anthropic-сумісна кінцева точка)

**Медіа:**

- Зображення, аудіо, відео та документи на вході й виході
- Спільні поверхні можливостей генерації зображень і відео
- Транскрибування голосових нотаток
- Перетворення тексту на мовлення з кількома провайдерами

**Застосунки та інтерфейси:**

- WebChat і браузерний Control UI
- Супутній застосунок у рядку меню macOS
- Вузол iOS зі сполученням, Canvas, камерою, записом екрана, місцезнаходженням і голосом
- Вузол Android зі сполученням, чатом, голосом, Canvas, камерою та командами пристрою

**Інструменти й автоматизація:**

- Автоматизація браузера, exec, sandboxing
- Вебпошук (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Завдання Cron і планування Heartbeat
- Skills, плагіни та конвеєри робочих процесів (Lobster)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Експериментальні функції" href="/uk/concepts/experimental-features" icon="flask">
    Функції з увімкненням за вибором, які ще не поставлялися на типовій поверхні.
  </Card>
  <Card title="Середовище виконання агента" href="/uk/concepts/agent" icon="robot">
    Модель середовища виконання агента та спосіб диспетчеризації запусків.
  </Card>
  <Card title="Канали" href="/uk/channels" icon="message-square">
    Підключайте Telegram, WhatsApp, Discord, Slack та інші з одного Gateway.
  </Card>
  <Card title="Плагіни" href="/uk/tools/plugin" icon="plug">
    Вбудовані та сторонні плагіни, які розширюють OpenClaw.
  </Card>
</CardGroup>
