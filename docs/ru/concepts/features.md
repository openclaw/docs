---
read_when:
    - Вам нужен полный список возможностей OpenClaw
summary: Возможности OpenClaw для разных каналов, маршрутизации, мультимедиа и UX.
title: Возможности
x-i18n:
    generated_at: "2026-07-13T19:42:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Основные возможности

<Columns>
  <Card title="Каналы" icon="message-square" href="/ru/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat и другие каналы через единый Gateway.
  </Card>
  <Card title="Плагины" icon="plug" href="/ru/tools/plugin">
    Официальные плагины добавляют Matrix, Nextcloud Talk, Nostr, Twitch, Zalo и десятки других интеграций с помощью одной команды установки.
  </Card>
  <Card title="Маршрутизация" icon="route" href="/ru/concepts/multi-agent">
    Маршрутизация между несколькими агентами с изолированными сеансами.
  </Card>
  <Card title="Медиа" icon="image" href="/ru/nodes/images">
    Изображения, аудио, видео, документы, а также генерация изображений и видео.
  </Card>
  <Card title="Приложения и интерфейс" icon="monitor" href="/ru/platforms">
    Windows Hub, браузерный Control UI, приложение для строки меню macOS и мобильные узлы.
  </Card>
  <Card title="Мобильные узлы" icon="smartphone" href="/ru/nodes">
    Узлы iOS и Android с сопряжением, голосовым и текстовым общением, а также расширенными командами для устройств.
  </Card>
</Columns>

## Полный список

**Каналы:**

- iMessage, Telegram и WebChat входят в основную установку; все остальные каналы представляют собой
  официальные плагины, устанавливаемые с помощью `openclaw plugins install @openclaw/<id>` (или по запросу
  во время `openclaw onboard` / `openclaw channels add`)
- Каналы официальных плагинов: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo и Zalo Personal
- Каналы внешних плагинов, сопровождаемых вне репозитория OpenClaw: WeChat, Yuanbao и Zalo ClawBot
- Поддержка групповых чатов с активацией по упоминанию
- Безопасность личных сообщений с помощью списков разрешённых пользователей и сопряжения

**Агент:**

- Встроенная среда выполнения агента с потоковой передачей результатов инструментов
- Маршрутизация между несколькими агентами с отдельными сеансами для каждой рабочей области или отправителя
- Сеансы: личные чаты объединяются в общий `main`; группы изолированы
- Потоковая передача и разбиение длинных ответов на части

**Аутентификация и провайдеры:**

- Более 35 провайдеров моделей (Anthropic, OpenAI, Google и другие)
- Аутентификация по подписке через OAuth (например, OpenAI Codex)
- Поддержка пользовательских и самостоятельно размещённых провайдеров (vLLM, SGLang, Ollama, llama.cpp, LM Studio и
  любые конечные точки, совместимые с OpenAI или Anthropic)

**Медиа:**

- Приём и отправка изображений, аудио, видео и документов
- Общие интерфейсы возможностей генерации изображений и видео
- Расшифровка голосовых сообщений
- Преобразование текста в речь с помощью нескольких провайдеров

**Приложения и интерфейсы:**

- WebChat и браузерный Control UI
- Вспомогательное приложение для строки меню macOS
- Узел iOS с сопряжением, Canvas, камерой, записью экрана, геолокацией и голосовым управлением
- Узел Android с сопряжением, чатом, голосовым управлением, Canvas, камерой и командами для устройства

**Инструменты и автоматизация:**

- Автоматизация браузера, выполнение команд и изоляция в песочнице
- Веб-поиск (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Задания Cron и планирование Heartbeat
- Skills, плагины и конвейеры рабочих процессов (Lobster)

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Экспериментальные функции" href="/ru/concepts/experimental-features" icon="flask">
    Включаемые по желанию функции, которые ещё не добавлены в интерфейс по умолчанию.
  </Card>
  <Card title="Среда выполнения агента" href="/ru/concepts/agent" icon="robot">
    Модель среды выполнения агента и порядок запуска задач.
  </Card>
  <Card title="Каналы" href="/ru/channels" icon="message-square">
    Подключайте Telegram, WhatsApp, Discord, Slack и другие каналы через единый Gateway.
  </Card>
  <Card title="Плагины" href="/ru/tools/plugin" icon="plug">
    Официальные и внешние плагины, расширяющие возможности OpenClaw.
  </Card>
</CardGroup>
