---
read_when:
    - Ви хочете запускати або керувати TaskFlows із зовнішньої системи
    - Ви налаштовуєте вбудований Plugin webhooks
summary: 'Plugin Webhooks: автентифікований вхід TaskFlow для довіреної зовнішньої автоматизації'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-04-28T11:21:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhooks (Plugin)

Plugin Webhooks додає автентифіковані HTTP-маршрути, які прив’язують зовнішню
автоматизацію до TaskFlows OpenClaw.

Використовуйте його, коли потрібно, щоб довірена система, як-от Zapier, n8n, завдання CI або
внутрішній сервіс, створювала й керувала контрольованими TaskFlows без попереднього написання власного
Plugin.

## Де він працює

Plugin Webhooks працює всередині процесу Gateway.

Якщо ваш Gateway працює на іншій машині, встановіть і налаштуйте Plugin на
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

- `enabled`: необов’язкове, за замовчуванням `true`
- `path`: необов’язкове, за замовчуванням `/plugins/webhooks/<routeId>`
- `sessionKey`: обов’язкова сесія, якій належать прив’язані TaskFlows
- `secret`: обов’язковий спільний секрет або SecretRef
- `controllerId`: необов’язковий ідентифікатор контролера для створених керованих потоків
- `description`: необов’язкова примітка оператора

Підтримувані вхідні дані `secret`:

- Звичайний рядок
- SecretRef з `source: "env" | "file" | "exec"`

Якщо маршрут із секретом не може розв’язати свій секрет під час запуску, Plugin пропускає
цей маршрут і записує попередження в журнал замість того, щоб відкривати несправний endpoint.

## Модель безпеки

Кожному маршруту довірено діяти з повноваженнями TaskFlow його налаштованого
`sessionKey`.

Це означає, що маршрут може переглядати й змінювати TaskFlows, які належать цій сесії, тому
вам слід:

- Використовувати надійний унікальний секрет для кожного маршруту
- Надавати перевагу посиланням на секрети замість вбудованих відкритих секретів
- Прив’язувати маршрути до найвужчої сесії, яка відповідає робочому процесу
- Відкривати лише конкретний шлях Webhook, який вам потрібен

Plugin застосовує:

- Автентифікацію зі спільним секретом
- Обмеження розміру тіла запиту та часу очікування
- Обмеження швидкості з фіксованим вікном
- Обмеження запитів у виконанні
- Доступ до TaskFlow, прив’язаний до власника, через `api.runtime.tasks.managedFlows.bindSession(...)`

## Формат запиту

Надсилайте запити `POST` з:

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

Створює керований TaskFlow для прив’язаної сесії маршруту.

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
- [Огляд хуків і Webhook](/uk/automation/hooks)
- [CLI Webhooks](/uk/cli/webhooks)
