---
read_when:
    - Ви хочете запускати або керувати TaskFlow із зовнішньої системи
    - Ви налаштовуєте вбудований Plugin Webhooks
summary: 'Plugin Webhooks: автентифікований вхід TaskFlow для довіреної зовнішньої автоматизації'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-04-23T21:04:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (Plugin)

Plugin Webhooks додає автентифіковані HTTP-маршрути, які прив’язують зовнішню
автоматизацію до TaskFlow в OpenClaw.

Використовуйте його, коли хочете, щоб довірена система, така як Zapier, n8n, CI-job або
внутрішній сервіс, створювала та керувала керованими TaskFlow без потреби спочатку писати кастомний
Plugin.

## Де він працює

Plugin Webhooks працює всередині процесу Gateway.

Якщо ваш Gateway працює на іншій машині, встановіть і налаштуйте Plugin на
цьому хості Gateway, а потім перезапустіть Gateway.

## Налаштування маршрутів

Задавайте config у `plugins.entries.webhooks.config`:

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

- `enabled`: необов’язкове, типове значення `true`
- `path`: необов’язкове, типове значення `/plugins/webhooks/<routeId>`
- `sessionKey`: обов’язкова session, якій належать прив’язані TaskFlow
- `secret`: обов’язковий shared secret або SecretRef
- `controllerId`: необов’язковий controller id для створених керованих flows
- `description`: необов’язкова примітка для оператора

Підтримувані входи `secret`:

- Звичайний рядок
- SecretRef з `source: "env" | "file" | "exec"`

Якщо маршрут, який використовує secret, не може визначити свій secret під час startup, Plugin пропускає
цей маршрут і логуватиме warning замість публікації зламаного endpoint.

## Модель безпеки

Кожному маршруту довіряється діяти з повноваженнями TaskFlow його налаштованого
`sessionKey`.

Це означає, що маршрут може переглядати та змінювати TaskFlow, якими володіє ця session, тому
вам слід:

- Використовувати сильний унікальний secret для кожного маршруту
- Надавати перевагу secret references замість inline plaintext secret-ів
- Прив’язувати маршрути до найвужчої session, яка підходить для робочого процесу
- Відкривати лише конкретний шлях Webhook, який вам потрібен

Plugin застосовує:

- Автентифікацію через shared secret
- Захисти розміру тіла запиту та timeout
- Rate limiting з фіксованим вікном
- Обмеження кількості запитів у процесі виконання
- Доступ до TaskFlow, прив’язаний до власника, через `api.runtime.taskFlow.bindSession(...)`

## Формат запиту

Надсилайте `POST`-запити з:

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

Наразі Plugin приймає такі JSON-значення `action`:

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

Створює керований TaskFlow для session, прив’язаної до маршруту.

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

Дозволені runtime:

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

Plugin навмисно очищує метадані owner/session з відповідей Webhook.

## Пов’язані документи

- [SDK runtime Plugin-а](/uk/plugins/sdk-runtime)
- [Огляд hooks і Webhook-ів](/uk/automation/hooks)
- [CLI Webhook-и](/uk/cli/webhooks)
