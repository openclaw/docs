---
read_when:
    - Ви хочете мати JSON-only LLM-крок усередині workflow
    - Вам потрібен schema-validated вивід LLM для автоматизації
summary: JSON-only LLM tasks для workflow (необов’язковий Plugin tool)
title: LLM task
x-i18n:
    generated_at: "2026-04-23T21:15:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03844e1e0cd18a1537320cd1401fa50704327f0ab3ffaf5e60c069235d7069d7
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` — це **необов’язковий Plugin tool**, який запускає JSON-only LLM-задачу і
повертає структурований вивід (за бажанням перевірений на відповідність JSON Schema).

Це ідеально підходить для workflow engine, таких як Lobster: ви можете додати один LLM-крок
без написання custom-коду OpenClaw для кожного workflow.

## Увімкнення Plugin

1. Увімкніть Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Додайте tool до allowlist (він реєструється з `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Конфігурація (необов’язково)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` — це allowlist рядків формату `provider/model`. Якщо його задано, будь-який запит
поза цим списком буде відхилено.

## Параметри інструмента

- `prompt` (string, обов’язково)
- `input` (any, необов’язково)
- `schema` (object, необов’язкова JSON Schema)
- `provider` (string, необов’язково)
- `model` (string, необов’язково)
- `thinking` (string, необов’язково)
- `authProfileId` (string, необов’язково)
- `temperature` (number, необов’язково)
- `maxTokens` (number, необов’язково)
- `timeoutMs` (number, необов’язково)

`thinking` приймає стандартні reasoning-presets OpenClaw, такі як `low` або `medium`.

## Вивід

Повертає `details.json`, що містить розпарсений JSON (і виконує валідацію відносно
`schema`, якщо її надано).

## Приклад: крок workflow Lobster

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Примітки щодо безпеки

- Інструмент є **JSON-only** і наказує моделі виводити лише JSON (без
  code fence, без коментарів).
- Для цього запуску моделі не відкриваються інструменти.
- Ставтеся до виводу як до недовіреного, якщо не виконуєте валідацію через `schema`.
- Розміщуйте approvals перед будь-яким кроком із побічними ефектами (send, post, exec).
