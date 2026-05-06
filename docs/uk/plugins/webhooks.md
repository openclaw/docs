---
read_when:
    - Ви хочете запускати або керувати TaskFlow із зовнішньої системи
    - Ви налаштовуєте вбудований Webhook Plugin
summary: 'Plugin Webhooks: автентифікований вхідний канал TaskFlow для довіреної зовнішньої автоматизації'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-05-06T16:11:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks додає автентифіковані HTTP-маршрути, які прив’язують зовнішню
автоматизацію до OpenClaw TaskFlows.

Використовуйте його, коли потрібно, щоб довірена система, як-от Zapier, n8n, CI-завдання або
внутрішній сервіс, створювала й керувала керованими TaskFlows без попереднього написання власного
plugin.

## Де він виконується

Plugin Webhooks виконується всередині процесу Gateway.

Якщо ваш Gateway працює на іншому комп’ютері, встановіть і налаштуйте plugin на
цьому хості Gateway, а потім перезапустіть Gateway.

## Налаштування маршрутів

Задайте конфігурацію в `plugins.entries.webhooks.config`:

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

Поля маршруту:

- `enabled`: необов’язкове, стандартне значення — `true`
- `path`: необов’язкове, стандартне значення — `/plugins/webhooks/<routeId>`
- `sessionKey`: обов’язкова сесія, якій належать прив’язані TaskFlows
- `secret`: обов’язковий спільний секрет або SecretRef
- `controllerId`: необов’язковий ідентифікатор контролера для створених керованих потоків
- `description`: необов’язкова примітка оператора

Підтримувані вхідні значення `secret`:

- Звичайний рядок
- SecretRef із `source: "env" | "file" | "exec"`

Якщо маршрут із секретом не може визначити свій секрет під час запуску, plugin пропускає
цей маршрут і записує попередження в журнал, замість того щоб відкривати несправну кінцеву точку.

## Модель безпеки

Кожен маршрут є довіреним і діє з повноваженнями TaskFlow, визначеними його налаштованим
`sessionKey`.

Це означає, що маршрут може переглядати й змінювати TaskFlows, які належать цій сесії, тому
вам слід:

- Використовувати надійний унікальний секрет для кожного маршруту
- Надавати перевагу посиланням на секрети замість вбудованих відкритих секретів
- Прив’язувати маршрути до найвужчої сесії, яка підходить для робочого процесу
- Відкривати лише конкретний шлях Webhook, який вам потрібен

Plugin застосовує:

- Автентифікацію за спільним секретом
- Обмеження розміру тіла запиту й часу очікування
- Обмеження частоти у фіксованому вікні
- Обмеження паралельних запитів у виконанні
- Доступ до TaskFlow, прив’язаний до власника, через `api.runtime.tasks.managedFlows.bindSession(...)`

## Формат запиту

Надсилайте запити `POST` із:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` або `x-openclaw-webhook-secret: <secret>`

Приклад:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Підтримувані дії

Plugin наразі приймає такі JSON-значення `action`:

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

Створює керований TaskFlow для прив’язаної до маршруту сесії.

Приклад:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Створює кероване дочірнє завдання всередині наявного керованого TaskFlow.

Дозволені середовища виконання:

- `subagent`
- `acp`

Приклад:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Форма відповіді

Успішні відповіді повертають:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Відхилені запити повертають:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin навмисно вилучає метадані власника/сесії з відповідей Webhook.

## Пов’язані документи

- [SDK середовища виконання Plugin](/uk/plugins/sdk-runtime)
- [Огляд hooks і webhooks](/uk/automation/hooks)
- [CLI webhooks](/uk/cli/webhooks)
