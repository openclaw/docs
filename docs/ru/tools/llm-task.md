---
read_when:
    - Вам нужен шаг LLM только с JSON внутри рабочих процессов
    - Вам нужен проверенный по схеме вывод LLM для автоматизации
summary: LLM-задачи только в JSON для рабочих процессов (необязательный инструмент Plugin)
title: Задача LLM
x-i18n:
    generated_at: "2026-06-28T23:53:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` — это **необязательный инструмент Plugin**, который запускает JSON-only LLM-задачу и
возвращает структурированный вывод (при необходимости проверенный по JSON Schema).

Это идеально подходит для движков рабочих процессов вроде Lobster: можно добавить один LLM-шаг
без написания пользовательского кода OpenClaw для каждого рабочего процесса.

## Включение Plugin

1. Включите Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Разрешите необязательный инструмент:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Используйте `tools.allow` только если вам нужен режим ограничительного списка разрешений.

## Конфигурация (необязательно)

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

`allowedModels` — это список разрешений строк `provider/model`. Если он задан, любой запрос
вне списка отклоняется.

## Параметры инструмента

- `prompt` (строка, обязательно)
- `input` (любое значение, необязательно)
- `schema` (объект, необязательная JSON Schema)
- `provider` (строка, необязательно)
- `model` (строка, необязательно)
- `thinking` (строка, необязательно)
- `authProfileId` (строка, необязательно)
- `temperature` (число, необязательно)
- `maxTokens` (число, необязательно)
- `timeoutMs` (число, необязательно)

`thinking` принимает стандартные предустановки рассуждений OpenClaw, например `low` или `medium`.

## Вывод

Возвращает `details.json`, содержащий разобранный JSON (и проверяет его по
`schema`, если она предоставлена).

## Пример: шаг рабочего процесса Lobster

### Важное ограничение

Пример ниже предполагает, что **автономный Lobster CLI** выполняется в среде, где `openclaw.invoke` уже имеет корректный URL Gateway и контекст аутентификации.

Для встроенного в OpenClaw **embedded** исполнителя Lobster этот вложенный шаблон CLI **сейчас ненадежен**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Пока в embedded Lobster нет поддерживаемого моста для этого потока, предпочитайте один из вариантов:

- прямые вызовы инструмента `llm-task` вне Lobster, или
- шаги Lobster, которые не зависят от вложенных вызовов `openclaw.invoke`.

Пример автономного Lobster CLI:

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

## Примечания по безопасности

- Инструмент работает **только с JSON** и инструктирует модель выводить только JSON (без
  блоков кода и комментариев).
- Для этого запуска модели не предоставляются инструменты.
- Считайте вывод недоверенным, если не проверяете его с помощью `schema`.
- Размещайте подтверждения перед любым шагом с побочными эффектами (отправка, публикация, выполнение).

## Связанные материалы

- [Уровни рассуждений](/ru/tools/thinking)
- [Субагенты](/ru/tools/subagents)
- [Слэш-команды](/ru/tools/slash-commands)
