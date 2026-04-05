---
read_when:
    - Ви хочете використовувати генерацію відео Runway в OpenClaw
    - Вам потрібне налаштування ключа API/env для Runway
    - Ви хочете зробити Runway типовим провайдером відео
summary: Налаштування генерації відео Runway в OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-05T23:52:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86c0777841cde5b265bba5d6b3dd8fd05fa433ddd0f678860d8bfaa1b7483c5
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw постачається з вбудованим провайдером `runway` для хостованої генерації відео.

- Провайдер: `runway`
- Автентифікація: `RUNWAYML_API_SECRET` (канонічний; `RUNWAY_API_KEY` також працює)
- API: API генерації відео Runway на основі завдань

## Швидкий старт

1. Установіть ключ API:

```bash
openclaw onboard --auth-choice runway-api-key
```

2. Установіть типову модель відео:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Генерація відео

Вбудований провайдер генерації відео `runway` типово використовує `runway/gen4.5`.

- Режими: text-to-video, image-to-video з одним зображенням і video-to-video з одним відео
- Виконання: асинхронне надсилання завдання + опитування через `GET /v1/tasks/{id}`
- Локальні посилання на зображення/відео: підтримуються через URI даних
- Поточне застереження щодо video-to-video: наразі OpenClaw вимагає `runway/gen4_aleph` для відеовходів
- Поточне застереження щодо text-to-video: наразі OpenClaw підтримує `16:9` і `9:16` для запусків лише з текстом

Щоб використовувати Runway як типовий провайдер відео:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Пов’язане

- [Генерація відео](/uk/tools/video-generation)
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults)
