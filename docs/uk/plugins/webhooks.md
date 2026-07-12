---
read_when:
    - Ви хочете запускати TaskFlow або керувати ними із зовнішньої системи
    - Ви налаштовуєте вбудований Plugin вебхуків
summary: 'Plugin вебхуків: автентифікований вхід TaskFlow для довіреної зовнішньої автоматизації'
title: Plugin вебхуків
x-i18n:
    generated_at: "2026-07-12T13:40:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks додає автентифіковані HTTP-маршрути, щоб довірена зовнішня
система (Zapier, n8n, завдання CI, внутрішній сервіс) могла створювати
керовані TaskFlow OpenClaw і керувати ними через HTTP без написання
власного плагіна.

Plugin працює всередині процесу Gateway. Для віддаленого Gateway встановіть і
налаштуйте його на відповідному хості, а потім перезапустіть Gateway. Він
постачається без налаштованих маршрутів, тому не виконує жодних дій, доки ви
не додасте принаймні один маршрут.

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

| Поле           | Обов'язкове | Типове значення               | Примітки                                              |
| -------------- | ----------- | ----------------------------- | ----------------------------------------------------- |
| `enabled`      | ні          | `true`                        |                                                       |
| `path`         | ні          | `/plugins/webhooks/<routeId>` | Має бути унікальним серед маршрутів.                   |
| `sessionKey`   | так         | -                             | Сеанс, якому належать прив'язані TaskFlow.             |
| `secret`       | так         | -                             | Звичайний рядок або SecretRef (див. нижче).            |
| `controllerId` | ні          | `webhooks/<routeId>`          | Використовується як типовий контролер `create_flow`.   |
| `description`  | ні          | -                             | Лише примітка для оператора.                           |

`secret` приймає звичайний рядок або SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Кожен налаштований маршрут реєструється під час запуску незалежно від того, чи
вдається наразі отримати значення його секрету. Секрет, значення якого
неможливо отримати, не вимикає маршрут і не призводить до його пропуску —
запити до нього не проходять автентифікацію (`401`), доки значення секрету не
стане доступним. Значення SecretRef отримуються повторно для кожного запиту,
тому ротація базового секрету (змінної середовища, файлу або результату
виконання команди) набуває чинності без перезапуску Gateway.

## Модель безпеки

Кожен маршрут діє з повноваженнями TaskFlow налаштованого `sessionKey`: він
може переглядати й змінювати будь-який TaskFlow, що належить цьому сеансу.
Доступ до TaskFlow завжди здійснюється через
`api.runtime.tasks.managedFlows.bindSession(...)`, тому маршрут ніколи не може
діяти поза межами прив'язаного сеансу. Щоб обмежити масштаб потенційної шкоди:

- Використовуйте надійний унікальний секрет для кожного маршруту.
- Віддавайте перевагу SecretRef, а не вбудованому секрету у відкритому тексті.
- Прив'язуйте маршрути до найвужчого сеансу, придатного для робочого процесу.
- Відкривайте доступ лише до потрібного шляху Webhook.

Порядок обробки запитів для кожного шляху: перевірка методу HTTP (лише `POST`)
і `Content-Type: application/json`, потім обмеження частоти у фіксованому
часовому вікні (120 запитів на 60-секундне вікно для кожної комбінації
шляху й IP-адреси клієнта, до 4 096 відстежуваних ключів), потім обмеження
одночасно оброблюваних запитів (8 паралельних запитів на ключ, до 4 096
відстежуваних ключів), потім автентифікація за спільним секретом, а потім
читання тіла запиту у форматі JSON з обмеженнями 256 КБ і 15 секунд. Запити,
що не проходять попередню перевірку, ніколи не доходять до наступних.

## Формат запиту

Надсилайте запити `POST` із `Content-Type: application/json` і одним із
заголовків: `Authorization: Bearer <secret>` або
`x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Підтримувані дії

| Дія                | Призначення                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `create_flow`      | Створити керований TaskFlow для сеансу маршруту.                            |
| `get_flow`         | Отримати один TaskFlow за ідентифікатором.                                  |
| `list_flows`       | Перелічити TaskFlow для сеансу маршруту.                                    |
| `find_latest_flow` | Отримати TaskFlow, оновлений найнещодавніше.                                |
| `resolve_flow`     | Знайти TaskFlow за непрозорим токеном.                                      |
| `get_task_summary` | Отримати зведення завдань для TaskFlow.                                     |
| `set_waiting`      | Перевести TaskFlow у стан очікування з необов'язковими даними стану/очікування. |
| `resume_flow`      | Відновити TaskFlow, що очікує або заблокований.                             |
| `finish_flow`      | Позначити TaskFlow як завершений.                                           |
| `fail_flow`        | Позначити TaskFlow як невдалий.                                             |
| `request_cancel`   | Запросити кооперативне скасування.                                          |
| `cancel_flow`      | Скасувати TaskFlow (може повернути `202`, якщо дочірні завдання ще активні). |
| `run_task`         | Створити кероване дочірнє завдання в наявному TaskFlow.                     |

Дії, що вносять зміни (`set_waiting`, `resume_flow`, `finish_flow`,
`fail_flow`, `request_cancel`), потребують `flowId` і `expectedRevision` для
оптимістичного керування конкурентним доступом; застаріла ревізія повертає
`409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Дозволені значення `runtime`: `subagent`, `acp`. Поля `startedAt`,
`lastEventAt` і `progressSummary` припустимі лише тоді, коли `status` має
значення `"running"`; надсилання їх із будь-яким іншим станом повертає
`400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Структура відповіді

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Подання потоків і завдань ніколи не містять метаданих власника або сеансу,
тому відповіді не можуть розкрити прив'язаний до маршруту `sessionKey`.
Значення `code` включають `not_found`, `not_managed`, `revision_conflict`,
`persist_failed`, `cancel_requested`, `cancel_pending`, `terminal`,
`invalid_request`, `request_rejected` і резервні коди, специфічні для дій
(`mutation_rejected`, `create_rejected`, `task_not_created`,
`cancel_rejected`), коли внесення змін відхилено з причини, не охопленої
зазначеними вище кодами.

## Пов'язані матеріали

- [Хуки](/uk/automation/hooks) — внутрішні хуки, керовані подіями, порівняно із цим мостом TaskFlow на основі HTTP
- [Вебхуки Gateway (конфігурація `hooks.*`)](/uk/automation/cron-jobs#webhooks) — окрема універсальна функція HTTP-кінцевої точки Gateway; це не те саме, що маршрути цього плагіна
- [SDK середовища виконання плагінів](/uk/plugins/sdk-runtime)
- [Вебхуки CLI](/uk/cli/webhooks)
