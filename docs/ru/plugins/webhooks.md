---
read_when:
    - Вы хотите запускать TaskFlow или управлять ими из внешней системы
    - Вы настраиваете встроенный plugin Webhook
summary: 'Plugin Webhooks: аутентифицированная точка входа TaskFlow для доверенной внешней автоматизации'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-06-28T23:33:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Плагин Webhooks добавляет аутентифицированные HTTP-маршруты, которые связывают внешнюю
автоматизацию с OpenClaw TaskFlow.

Используйте его, когда нужно, чтобы доверенная система, например Zapier, n8n, задание CI или
внутренний сервис, создавала управляемые TaskFlow и управляла ими без предварительного написания
пользовательского плагина.

## Где он запускается

Плагин Webhooks запускается внутри процесса Gateway.

Если ваш Gateway работает на другой машине, установите и настройте плагин на
этом хосте Gateway, затем перезапустите Gateway.

## Настройка маршрутов

Задайте конфигурацию в `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Поля маршрута:

- `enabled`: необязательно, по умолчанию `true`
- `path`: необязательно, по умолчанию `/plugins/webhooks/<routeId>`
- `sessionKey`: обязательная сессия, которой принадлежат привязанные TaskFlow
- `secret`: обязательный общий секрет или SecretRef
- `controllerId`: необязательный идентификатор контроллера для создаваемых управляемых потоков
- `description`: необязательная заметка для оператора

Поддерживаемые входные значения `secret`:

- Обычная строка
- SecretRef с `source: "env" | "file" | "exec"`

Если маршрут, использующий секрет, не может разрешить свой секрет при запуске, плагин пропускает
этот маршрут и записывает предупреждение вместо того, чтобы открывать неработающую конечную точку.

## Модель безопасности

Каждому маршруту доверено действовать с полномочиями TaskFlow, заданными его настроенным
`sessionKey`.

Это означает, что маршрут может проверять и изменять TaskFlow, принадлежащие этой сессии, поэтому
следует:

- Использовать надежный уникальный секрет для каждого маршрута
- Предпочитать ссылки на секреты встроенным секретам в открытом тексте
- Привязывать маршруты к самой узкой сессии, подходящей для рабочего процесса
- Открывать только конкретный путь Webhook, который вам нужен

Плагин применяет:

- Аутентификацию по общему секрету
- Ограничения размера тела запроса и тайм-аутов
- Ограничение частоты по фиксированному окну
- Ограничение параллельных запросов
- Доступ к TaskFlow в границах владельца через `api.runtime.tasks.managedFlows.bindSession(...)`

## Формат запроса

Отправляйте запросы `POST` с:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` или `x-openclaw-webhook-secret: <secret>`

Пример:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Поддерживаемые действия

Сейчас плагин принимает следующие JSON-значения `action`:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Создает управляемый TaskFlow для привязанной к маршруту сессии.

Пример:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Создает управляемую дочернюю задачу внутри существующего управляемого TaskFlow.

Разрешенные среды выполнения:

- `subagent`
- `acp`

Пример:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Форма ответа

Успешные ответы возвращают:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Отклоненные запросы возвращают:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Плагин намеренно удаляет метаданные владельца и сессии из ответов Webhook.

## Связанная документация

- [SDK среды выполнения Plugin](/ru/plugins/sdk-runtime)
- [Обзор хуков и Webhook](/ru/automation/hooks)
- [CLI Webhook](/ru/cli/webhooks)
