---
read_when:
    - Вы хотите запускать TaskFlow или управлять ими из внешней системы
    - Вы настраиваете встроенный плагин вебхуков
summary: 'Плагин Webhooks: аутентифицированная точка входа TaskFlow для доверенной внешней автоматизации'
title: Плагин вебхуков
x-i18n:
    generated_at: "2026-07-13T20:10:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Плагин Webhooks добавляет аутентифицированные HTTP-маршруты, позволяющие доверенной внешней
системе (Zapier, n8n, заданию CI, внутреннему сервису) создавать управляемые
TaskFlow OpenClaw и управлять ими по HTTP без написания собственного плагина.

Плагин выполняется внутри процесса Gateway. Для удалённого Gateway установите и
настройте его на соответствующем хосте, затем перезапустите Gateway. По умолчанию
маршруты не настроены, поэтому плагин ничего не делает, пока вы не добавите хотя бы один маршрут.

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

| Поле           | Обязательно | Значение по умолчанию         | Примечания                                    |
| -------------- | -------- | ----------------------------- | --------------------------------------------- |
| `enabled`      | нет      | `true`                        |                                               |
| `path`         | нет      | `/plugins/webhooks/<routeId>` | Должно быть уникальным среди маршрутов.       |
| `sessionKey`   | да       | -                             | Сессия, которой принадлежат привязанные TaskFlow. |
| `secret`       | да       | -                             | Обычная строка или SecretRef (см. ниже).      |
| `controllerId` | нет      | `webhooks/<routeId>`          | Используется как контроллер `create_flow` по умолчанию. |
| `description`  | нет      | -                             | Только примечание для оператора.              |

`secret` принимает обычную строку или SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Каждый настроенный маршрут регистрируется при запуске независимо от того,
разрешается ли в данный момент его секрет. Неразрешимый секрет не отключает и
не пропускает маршрут — запросы к нему не проходят аутентификацию (`401`),
пока секрет не удастся разрешить. Значения SecretRef разрешаются заново при каждом
запросе, поэтому ротация исходного секрета (переменной окружения, файла или вывода
исполняемой команды) вступает в силу без перезапуска Gateway.

## Модель безопасности

Каждый маршрут действует с полномочиями TaskFlow настроенного `sessionKey`:
он может просматривать и изменять любой TaskFlow, принадлежащий этой сессии. Доступ
к TaskFlow всегда осуществляется через `api.runtime.tasks.managedFlows.bindSession(...)`, поэтому
маршрут никогда не может действовать за пределами привязанной к нему сессии. Чтобы ограничить радиус воздействия:

- Используйте надёжный уникальный секрет для каждого маршрута.
- Предпочитайте SecretRef встроенному секрету в виде открытого текста.
- Привязывайте маршруты к сессии с минимальными полномочиями, достаточными для рабочего процесса.
- Открывайте доступ только к конкретному пути Webhook, который вам нужен.

Порядок обработки запросов для каждого пути: проверки метода HTTP (только `POST`)
и `Content-Type: application/json`, затем ограничение частоты запросов с фиксированным окном (120
запросов за 60-секундное окно для каждого ключа «путь + IP-адрес клиента», до 4,096
отслеживаемых ключей), затем ограничение одновременно обрабатываемых запросов (8
параллельных запросов на ключ, до 4,096 отслеживаемых ключей), затем аутентификация
по общему секрету, после чего чтение тела JSON размером до 256 KB с тайм-аутом
15 секунд. Запросы, не прошедшие более раннюю проверку, никогда не доходят
до последующих.

## Формат запроса

Отправляйте запросы `POST` с `Content-Type: application/json` и одним из
`Authorization: Bearer <secret>` или `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Поддерживаемые действия

| Действие           | Назначение                                                         |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | Создать управляемый TaskFlow для сессии маршрута.                  |
| `get_flow`         | Получить один TaskFlow по идентификатору.                          |
| `list_flows`       | Вывести список TaskFlow для сессии маршрута.                       |
| `find_latest_flow` | Получить TaskFlow, обновлённый последним.                           |
| `resolve_flow`     | Найти TaskFlow по непрозрачному токену.                             |
| `get_task_summary` | Получить сводку задач для TaskFlow.                                |
| `set_waiting`      | Перевести TaskFlow в состояние ожидания с необязательными данными состояния/ожидания. |
| `resume_flow`      | Возобновить ожидающий/заблокированный TaskFlow.                    |
| `finish_flow`      | Отметить TaskFlow как завершённый.                                 |
| `fail_flow`        | Отметить TaskFlow как завершившийся с ошибкой.                     |
| `request_cancel`   | Запросить кооперативную отмену.                                    |
| `cancel_flow`      | Отменить TaskFlow (может вернуть `202`, если дочерние задачи всё ещё активны). |
| `run_task`         | Создать управляемую дочернюю задачу внутри существующего TaskFlow. |

Изменяющие действия (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) требуют `flowId` и `expectedRevision` для оптимистичного
управления конкурентным доступом; устаревшая ревизия возвращает `409 revision_conflict`.

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

Допустимые значения `runtime`: `subagent`, `acp`. `startedAt`, `lastEventAt` и
`progressSummary` допустимы, только если `status` имеет значение `"running"`; их отправка
с любым другим статусом возвращает `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Структура ответа

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

Представления процессов и задач никогда не включают метаданные владельца/сессии,
поэтому ответы не могут раскрыть привязанный к маршруту `sessionKey`. Значения
`code` включают `not_found`, `not_managed`,
`revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` и
резервные коды для конкретных действий (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`), когда изменение отклонено по
причине, не охваченной указанными выше кодами.

## Связанные материалы

- [Хуки](/ru/automation/hooks) — внутренние событийные хуки в сравнении с этим HTTP-мостом TaskFlow
- [Вебхуки Gateway (конфигурация `hooks.*`)](/ru/automation/cron-jobs#webhooks) — отдельная универсальная возможность HTTP-конечной точки Gateway; это не то же самое, что маршруты этого плагина
- [SDK среды выполнения плагинов](/ru/plugins/sdk-runtime)
- [Вебхуки CLI](/ru/cli/webhooks)
