---
read_when:
    - Вам нужен полный список того, что поддерживает OpenClaw
summary: Возможности OpenClaw в разных каналах, маршрутизации, медиа и UX.
title: Возможности
x-i18n:
    generated_at: "2026-06-28T22:49:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## Главное

<Columns>
  <Card title="Каналы" icon="message-square" href="/ru/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat и другие через единый Gateway.
  </Card>
  <Card title="Плагины" icon="plug" href="/ru/tools/plugin">
    Встроенные плагины добавляют Matrix, Nextcloud Talk, Nostr, Twitch, Zalo и многое другое без отдельных установок в обычных актуальных релизах.
  </Card>
  <Card title="Маршрутизация" icon="route" href="/ru/concepts/multi-agent">
    Многоагентная маршрутизация с изолированными сеансами.
  </Card>
  <Card title="Медиа" icon="image" href="/ru/nodes/images">
    Изображения, аудио, видео, документы и генерация изображений/видео.
  </Card>
  <Card title="Приложения и UI" icon="monitor" href="/ru/platforms">
    Windows Hub, Web Control UI, приложение для macOS и мобильные узлы.
  </Card>
  <Card title="Мобильные узлы" icon="smartphone" href="/ru/nodes">
    Узлы iOS и Android с сопряжением, голосом/чатом и расширенными командами устройства.
  </Card>
</Columns>

## Полный список

**Каналы:**

- Встроенные каналы включают Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat и WhatsApp
- Встроенные каналы плагинов включают Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo и Zalo Personal
- Необязательные отдельно устанавливаемые канальные плагины включают Voice Call и сторонние пакеты, такие как WeChat
- Сторонние канальные плагины могут дополнительно расширять Gateway, например WeChat
- Поддержка групповых чатов с активацией по упоминанию
- Безопасность личных сообщений с allowlist и сопряжением

**Агент:**

- Встроенная среда выполнения агента со streaming инструментов
- Многоагентная маршрутизация с изолированными сеансами для каждого рабочего пространства или отправителя
- Сеансы: прямые чаты сворачиваются в общий `main`; группы изолированы
- Streaming и разбиение на фрагменты для длинных ответов

**Аутентификация и провайдеры:**

- Более 35 провайдеров моделей (Anthropic, OpenAI, Google и другие)
- Аутентификация по подписке через OAuth (например, OpenAI Codex)
- Поддержка пользовательских и самостоятельно размещаемых провайдеров (vLLM, SGLang, Ollama и любая OpenAI-совместимая или Anthropic-совместимая конечная точка)

**Медиа:**

- Входящие и исходящие изображения, аудио, видео и документы
- Общие поверхности возможностей генерации изображений и видео
- Транскрибация голосовых заметок
- Преобразование текста в речь с несколькими провайдерами

**Приложения и интерфейсы:**

- WebChat и браузерный Control UI
- Приложение-компаньон в строке меню macOS
- Узел iOS с сопряжением, Canvas, камерой, записью экрана, геолокацией и голосом
- Узел Android с сопряжением, чатом, голосом, Canvas, камерой и командами устройства

**Инструменты и автоматизация:**

- Автоматизация браузера, exec, sandboxing
- Веб-поиск (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-задания и планирование Heartbeat
- Skills, плагины и конвейеры рабочих процессов (Lobster)

## См. также

<CardGroup cols={2}>
  <Card title="Экспериментальные функции" href="/ru/concepts/experimental-features" icon="flask">
    Опциональные функции, которые еще не поставляются в поверхности по умолчанию.
  </Card>
  <Card title="Среда выполнения агента" href="/ru/concepts/agent" icon="robot">
    Модель среды выполнения агента и то, как запускаются выполнения.
  </Card>
  <Card title="Каналы" href="/ru/channels" icon="message-square">
    Подключайте Telegram, WhatsApp, Discord, Slack и другие из одного Gateway.
  </Card>
  <Card title="Плагины" href="/ru/tools/plugin" icon="plug">
    Встроенные и сторонние плагины, расширяющие OpenClaw.
  </Card>
</CardGroup>
