---
read_when:
    - Вам потрібен повний перелік того, що підтримує OpenClaw
summary: Можливості OpenClaw у каналах, маршрутизації, роботі з медіа та взаємодії з користувачем.
title: Функції
x-i18n:
    generated_at: "2026-07-12T13:08:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Основні можливості

<Columns>
  <Card title="Канали" icon="message-square" href="/uk/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat та інші канали через єдиний Gateway.
  </Card>
  <Card title="Плагіни" icon="plug" href="/uk/tools/plugin">
    Офіційні плагіни додають Matrix, Nextcloud Talk, Nostr, Twitch, Zalo та десятки інших можливостей за допомогою однієї команди встановлення.
  </Card>
  <Card title="Маршрутизація" icon="route" href="/uk/concepts/multi-agent">
    Маршрутизація між кількома агентами з ізольованими сеансами.
  </Card>
  <Card title="Медіа" icon="image" href="/uk/nodes/images">
    Зображення, аудіо, відео, документи, а також генерація зображень і відео.
  </Card>
  <Card title="Застосунки та інтерфейс" icon="monitor" href="/uk/platforms">
    Windows Hub, браузерний інтерфейс керування, застосунок у рядку меню macOS і мобільні вузли.
  </Card>
  <Card title="Мобільні вузли" icon="smartphone" href="/uk/nodes">
    Вузли iOS та Android зі сполученням, голосовим керуванням і чатом, а також розширеними командами пристрою.
  </Card>
</Columns>

## Повний перелік

**Канали:**

- iMessage, Telegram і WebChat постачаються з основним пакетом; усі інші канали є
  офіційними плагінами, які встановлюються за допомогою `openclaw plugins install @openclaw/<id>` (або за потреби
  під час виконання `openclaw onboard` / `openclaw channels add`)
- Канали офіційних плагінів: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo та Zalo Personal
- Канали зовнішніх плагінів, які підтримуються поза репозиторієм OpenClaw: WeChat, Yuanbao та Zalo ClawBot
- Підтримка групових чатів з активацією за згадкою
- Безпека особистих повідомлень завдяки спискам дозволених користувачів і сполученню

**Агент:**

- Вбудоване середовище виконання агента з потоковою передачею даних інструментів
- Маршрутизація між кількома агентами з ізольованими сеансами для кожного робочого простору або відправника
- Сеанси: особисті чати об'єднуються в спільний `main`; групи ізольовані
- Потокова передача та поділ довгих відповідей на частини

**Автентифікація та постачальники:**

- Понад 35 постачальників моделей (Anthropic, OpenAI, Google та інші)
- Автентифікація підписки через OAuth (наприклад, OpenAI Codex)
- Підтримка власних і самостійно розгорнутих постачальників (vLLM, SGLang, Ollama, llama.cpp, LM Studio та
  будь-які кінцеві точки, сумісні з OpenAI або Anthropic)

**Медіа:**

- Вхідні та вихідні зображення, аудіо, відео й документи
- Спільні інтерфейси можливостей генерації зображень і відео
- Транскрибування голосових повідомлень
- Синтез мовлення за допомогою кількох постачальників

**Застосунки та інтерфейси:**

- WebChat і браузерний інтерфейс керування
- Допоміжний застосунок у рядку меню macOS
- Вузол iOS зі сполученням, Canvas, камерою, записом екрана, геолокацією та голосовим керуванням
- Вузол Android зі сполученням, чатом, голосовим керуванням, Canvas, камерою та командами пристрою

**Інструменти й автоматизація:**

- Автоматизація браузера, виконання команд та ізоляція
- Вебпошук (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Завдання Cron і планування Heartbeat
- Skills, плагіни та конвеєри робочих процесів (Lobster)

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Експериментальні функції" href="/uk/concepts/experimental-features" icon="flask">
    Функції, які потрібно вмикати окремо та які ще не постачаються в стандартному наборі можливостей.
  </Card>
  <Card title="Середовище виконання агента" href="/uk/concepts/agent" icon="robot">
    Модель середовища виконання агента та спосіб розподілу запусків.
  </Card>
  <Card title="Канали" href="/uk/channels" icon="message-square">
    Підключайте Telegram, WhatsApp, Discord, Slack та інші канали через єдиний Gateway.
  </Card>
  <Card title="Плагіни" href="/uk/tools/plugin" icon="plug">
    Офіційні й зовнішні плагіни, що розширюють можливості OpenClaw.
  </Card>
</CardGroup>
