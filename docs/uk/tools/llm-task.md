---
read_when:
    - Вам потрібен крок LLM лише з JSON усередині робочих процесів
    - Вам потрібен перевірений за схемою вивід LLM для автоматизації
summary: LLM-завдання лише з JSON для робочих процесів (необов’язковий інструмент Plugin)
title: завдання LLM
x-i18n:
    generated_at: "2026-06-27T18:26:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
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

Використовуйте `tools.allow` лише тоді, коли потрібен режим обмежувального списку дозволів.

## Конфігурація (необов’язково)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
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

`allowedModels` — це список дозволів рядків `provider/model`. Якщо його задано, будь-який запит
поза списком відхиляється.

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

### Важливе обмеження

Наведений нижче приклад припускає, що **автономний Lobster CLI** працює в середовищі, де `openclaw.invoke` вже має правильну URL-адресу gateway і контекст автентифікації.

Для вбудованого **embedded** запуску Lobster всередині OpenClaw цей вкладений шаблон CLI **наразі не є надійним**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Доки embedded Lobster не матиме підтримуваного мосту для цього потоку, віддавайте перевагу одному з варіантів:

- прямим викликам інструмента `llm-task` поза Lobster, або
- крокам Lobster, які не покладаються на вкладені виклики `openclaw.invoke`.

Приклад автономного Lobster CLI:

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

## Нотатки з безпеки

- Інструмент працює **лише з JSON** і вказує моделі виводити тільки JSON (без
  блоків коду й без коментарів).
- Для цього запуску моделі не надаються жодні інструменти.
- Вважайте вивід ненадійним, якщо не перевіряєте його за допомогою `schema`.
- Розміщуйте схвалення перед будь-яким кроком із побічними ефектами (надсилання, публікація, виконання).

## Пов’язане

- [Рівні міркування](/uk/tools/thinking)
- [Субагенти](/uk/tools/subagents)
- [Slash commands](/uk/tools/slash-commands)
