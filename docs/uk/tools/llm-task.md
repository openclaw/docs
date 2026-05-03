---
read_when:
    - Вам потрібен LLM-крок лише з JSON у робочих процесах
    - Вам потрібен вивід LLM, перевірений за схемою, для автоматизації
summary: Завдання LLM лише з JSON для робочих процесів (необов’язковий інструмент Plugin)
title: Завдання LLM
x-i18n:
    generated_at: "2026-05-03T22:56:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` — це **необов’язковий інструмент Plugin**, який запускає LLM-завдання лише з JSON і
повертає структурований вивід (за потреби перевірений за JSON Schema).

Це ідеально для рушіїв робочих процесів на кшталт Lobster: ви можете додати один LLM-крок
без написання власного коду OpenClaw для кожного робочого процесу.

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

2. Дозвольте необов’язковий інструмент:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Використовуйте `tools.allow` лише тоді, коли потрібен обмежувальний режим списку дозволених.

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
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` — це список дозволених рядків `provider/model`. Якщо його задано, будь-який запит
поза списком буде відхилено.

## Параметри інструмента

- `prompt` (рядок, обов’язково)
- `input` (будь-що, необов’язково)
- `schema` (об’єкт, необов’язкова JSON Schema)
- `provider` (рядок, необов’язково)
- `model` (рядок, необов’язково)
- `thinking` (рядок, необов’язково)
- `authProfileId` (рядок, необов’язково)
- `temperature` (число, необов’язково)
- `maxTokens` (число, необов’язково)
- `timeoutMs` (число, необов’язково)

`thinking` приймає стандартні пресети міркування OpenClaw, як-от `low` або `medium`.

## Вивід

Повертає `details.json`, що містить розібраний JSON (і перевіряє його за
`schema`, якщо її надано).

## Приклад: крок робочого процесу Lobster

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

- Інструмент працює **лише з JSON** і вказує моделі виводити тільки JSON (без
  code fences, без коментарів).
- Для цього запуску моделі не надаються жодні інструменти.
- Вважайте вивід ненадійним, якщо не перевіряєте його за допомогою `schema`.
- Розміщуйте затвердження перед будь-яким кроком із побічними ефектами (send, post, exec).

## Пов’язане

- [Рівні мислення](/uk/tools/thinking)
- [Субагенти](/uk/tools/subagents)
- [Slash-команди](/uk/tools/slash-commands)
