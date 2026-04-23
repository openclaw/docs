---
read_when:
    - Ви хочете крок LLM лише з JSON усередині workflow
    - Вам потрібен вивід LLM, перевірений за схемою, для автоматизації
summary: Завдання LLM лише з JSON для workflow (необов’язковий інструмент Plugin)
title: Завдання LLM
x-i18n:
    generated_at: "2026-04-23T20:06:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b8dcc3c23f5181c36a8b2b34528a984bc703065617ed7091f2513cbcfb20912
    source_path: tools/llm-task.md
    workflow: 15
---

# Завдання LLM

`llm-task` — це **необов’язковий інструмент Plugin**, який виконує завдання LLM лише з JSON і
повертає структурований вивід (за потреби перевірений за JSON Schema).

Це ідеально підходить для рушіїв workflow на кшталт Lobster: ви можете додати один крок LLM
без написання кастомного коду OpenClaw для кожного workflow.

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

2. Додайте інструмент до allowlist (він реєструється з `optional: true`):

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

`allowedModels` — це allowlist рядків `provider/model`. Якщо його задано, будь-який запит
поза цим списком буде відхилено.

## Параметри інструмента

- `prompt` (string, обов’язковий)
- `input` (any, необов’язковий)
- `schema` (object, необов’язкова JSON Schema)
- `provider` (string, необов’язковий)
- `model` (string, необов’язковий)
- `thinking` (string, необов’язковий)
- `authProfileId` (string, необов’язковий)
- `temperature` (number, необов’язковий)
- `maxTokens` (number, необов’язковий)
- `timeoutMs` (number, необов’язковий)

`thinking` приймає стандартні пресети reasoning OpenClaw, наприклад `low` або `medium`.

## Вивід

Повертає `details.json`, що містить розібраний JSON (і перевіряє його за
`schema`, якщо її задано).

## Приклад: крок workflow у Lobster

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

- Інструмент працює **лише з JSON** і наказує моделі виводити тільки JSON (без
  code fence, без коментарів).
- Для цього запуску моделі не надаються жодні інструменти.
- Вважайте вивід ненадійним, доки не перевірите його через `schema`.
- Розміщуйте погодження перед будь-яким кроком із побічними ефектами (send, post, exec).
