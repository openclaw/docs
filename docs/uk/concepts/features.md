---
read_when:
    - Ви хочете повний список того, що підтримує OpenClaw.
summary: Можливості OpenClaw у різних каналах, маршрутизації, медіа та UX.
title: Функції
x-i18n:
    generated_at: "2026-04-22T01:38:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# Функції

## Основні можливості

<Columns>
  <Card title="Канали" icon="message-square" href="/uk/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat та інші з єдиним Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/uk/tools/plugin">
    Вбудовані plugins додають Matrix, Nextcloud Talk, Nostr, Twitch, Zalo та інші без окремого встановлення у звичайних актуальних релізах.
  </Card>
  <Card title="Маршрутизація" icon="route" href="/uk/concepts/multi-agent">
    Маршрутизація з кількома агентами з ізольованими сесіями.
  </Card>
  <Card title="Медіа" icon="image" href="/uk/nodes/images">
    Зображення, аудіо, відео, документи та генерація зображень/відео.
  </Card>
  <Card title="Застосунки та UI" icon="monitor" href="/web/control-ui">
    Веб-інтерфейс керування та допоміжний застосунок для macOS.
  </Card>
  <Card title="Мобільні вузли" icon="smartphone" href="/uk/nodes">
    Вузли для iOS та Android зі сполученням, голосом/чатом і розширеними командами пристрою.
  </Card>
</Columns>

## Повний список

**Канали:**

- Вбудовані канали включають Discord, Google Chat, iMessage (застарілий), IRC, Signal, Slack, Telegram, WebChat і WhatsApp
- Канали вбудованих plugins включають BlueBubbles для iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo і Zalo Personal
- Необов’язкові окремо встановлювані plugins каналів включають Voice Call і сторонні пакунки, такі як WeChat
- Сторонні plugins каналів можуть ще більше розширювати Gateway, наприклад WeChat
- Підтримка групових чатів з активацією через згадування
- Безпека DM зі списками дозволених контактів і сполученням

**Агент:**

- Вбудоване середовище виконання агента з потоковою передачею інструментів
- Маршрутизація з кількома агентами з ізольованими сесіями для кожного робочого простору або відправника
- Сесії: прямі чати згортаються в спільний `main`; групи ізольовані
- Потокова передача та поділ на частини для довгих відповідей

**Автентифікація та провайдери:**

- Понад 35 провайдерів моделей (Anthropic, OpenAI, Google та інші)
- Автентифікація за підпискою через OAuth (наприклад, OpenAI Codex)
- Підтримка власних і self-hosted провайдерів (vLLM, SGLang, Ollama і будь-яка OpenAI-compatible або Anthropic-compatible кінцева точка)

**Медіа:**

- Зображення, аудіо, відео й документи на вхід і вихід
- Спільні поверхні можливостей для генерації зображень і відео
- Транскрибування голосових повідомлень
- Перетворення тексту на мовлення з кількома провайдерами

**Застосунки та інтерфейси:**

- WebChat і браузерний Control UI
- Допоміжний застосунок для macOS у рядку меню
- Вузол iOS зі сполученням, Canvas, камерою, записом екрана, геолокацією та голосом
- Вузол Android зі сполученням, чатом, голосом, Canvas, камерою та командами пристрою

**Інструменти та автоматизація:**

- Автоматизація браузера, exec, ізоляція
- Вебпошук (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Завдання Cron і планування Heartbeat
- Skills, plugins і конвеєри робочих процесів (Lobster)
