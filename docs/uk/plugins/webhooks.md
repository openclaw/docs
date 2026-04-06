---
read_when:
    - Ви хочете запускати або керувати TaskFlows із зовнішньої системи
    - Ви налаштовуєте вбудований плагін webhooks
summary: 'Плагін Webhooks: автентифікований вхід TaskFlow для довіреної зовнішньої автоматизації'
title: Плагін Webhooks
x-i18n:
    generated_at: "2026-04-06T15:30:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5da12a887752ec6ee853cfdb912db0ae28512a0ffed06fe3828ef2eee15bc9d
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (плагін)

Плагін Webhooks додає автентифіковані HTTP-маршрути, які прив’язують зовнішню
автоматизацію до TaskFlows в OpenClaw.

Використовуйте його, якщо хочете, щоб довірена система, така як Zapier, n8n, завдання CI або
внутрішній сервіс, створювала та керувала керованими TaskFlows без потреби спочатку писати
власний плагін.

## Де він працює

Плагін Webhooks працює всередині процесу Gateway.

Якщо ваш Gateway працює на іншій машині, установіть і налаштуйте плагін на
цьому хості Gateway, а потім перезапустіть Gateway.

## Налаштування маршрутів

Установіть конфігурацію в `plugins.entries.webhooks.config`:

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
              description: "Zapier bridge для TaskFlow",
            },
          },
        },
      },
    },
  },
}
```

Поля маршруту:

- `enabled`: необов’язкове, типове значення — `true`
- `path`: необов’язкове, типове значення — `/plugins/webhooks/<routeId>`
- `sessionKey`: обов’язковий сеанс, якому належать прив’язані TaskFlows
- `secret`: обов’язковий спільний секрет або SecretRef
- `controllerId`: необов’язковий ідентифікатор контролера для створених керованих потоків
- `description`: необов’язкова примітка для оператора

Підтримувані варіанти `secret`:

- Звичайний рядок
- SecretRef із `source: "env" | "file" | "exec"`

Якщо маршрут на основі секрету не може визначити свій секрет під час запуску, плагін пропускає
цей маршрут і записує попередження в журнал замість того, щоб відкривати зламану кінцеву точку.

## Модель безпеки

Кожен маршрут вважається довіреним і діє з повноваженнями TaskFlow свого
налаштованого `sessionKey`.

Це означає, що маршрут може перевіряти та змінювати TaskFlows, які належать цьому сеансу, тому
вам слід:

- Використовувати сильний унікальний секрет для кожного маршруту
- Віддавати перевагу посиланням на секрети замість вбудованих plaintext-секретів
- Прив’язувати маршрути до найвужчого сеансу, який підходить для цього робочого процесу
- Відкривати лише конкретний шлях webhook, який вам потрібен

Плагін застосовує:

- Автентифікацію зі спільним секретом
- Обмеження розміру тіла запиту та таймаутів
- Обмеження частоти запитів із фіксованим вікном
- Обмеження кількості одночасних запитів у польоті
- Доступ до TaskFlow, прив’язаний до власника, через `api.runtime.taskFlow.bindSession(...)`

## Формат запиту

Надсилайте запити `POST` з такими параметрами:

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

Наразі плагін приймає такі значення JSON `action`:

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

Створює керований TaskFlow для сеансу, прив’язаного до маршруту.

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

Плагін навмисно очищає метадані власника/сеансу з відповідей webhook.

## Пов’язана документація

- [SDK runtime плагінів](/uk/plugins/sdk-runtime)
- [Огляд hooks і webhooks](/uk/automation/hooks)
- [CLI webhooks](/cli/webhooks)
