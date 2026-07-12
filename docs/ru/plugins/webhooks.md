---
read_when:
    - Вы хотите запускать TaskFlow или управлять ими из внешней системы
    - Вы настраиваете встроенный Plugin веб-хуков
summary: 'Plugin веб-хуков: аутентифицированный прием входящих запросов TaskFlow для доверенной внешней автоматизации'
title: Plugin Webhookов
x-i18n:
    generated_at: "2026-07-12T11:45:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks добавляет аутентифицированные HTTP-маршруты, позволяющие доверенной внешней системе (Zapier, n8n, заданию CI, внутреннему сервису) создавать управляемые TaskFlow OpenClaw и управлять ими по HTTP без написания собственного Plugin.

Plugin работает внутри процесса Gateway. Для удалённого Gateway установите и настройте Plugin на соответствующем хосте, затем перезапустите Gateway. По умолчанию маршруты не настроены, поэтому Plugin ничего не делает, пока вы не добавите хотя бы один маршрут.

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

| Поле           | Обязательно | Значение по умолчанию         | Примечания                                           |
| -------------- | ----------- | ----------------------------- | ---------------------------------------------------- |
| `enabled`      | нет         | `true`                        |                                                      |
| `path`         | нет         | `/plugins/webhooks/<routeId>` | Должно быть уникальным среди всех маршрутов.         |
| `sessionKey`   | да          | -                             | Сеанс, которому принадлежат привязанные TaskFlow.    |
| `secret`       | да          | -                             | Обычная строка или SecretRef (см. ниже).             |
| `controllerId` | нет         | `webhooks/<routeId>`          | Используется как контроллер `create_flow` по умолчанию. |
| `description`  | нет         | -                             | Только примечание для оператора.                     |

`secret` принимает обычную строку или SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Каждый настроенный маршрут регистрируется при запуске независимо от того, удаётся ли в данный момент разрешить его секрет. Неразрешимый секрет не отключает маршрут и не приводит к его пропуску — запросы к нему не проходят аутентификацию (`401`), пока секрет не удастся разрешить. Значения SecretRef разрешаются заново при каждом запросе, поэтому ротация базового секрета (переменной окружения, файла или вывода команды) вступает в силу без перезапуска Gateway.

## Модель безопасности

Каждый маршрут действует с полномочиями TaskFlow настроенного `sessionKey`: он может просматривать и изменять любой TaskFlow, принадлежащий этому сеансу. Доступ к TaskFlow всегда выполняется через `api.runtime.tasks.managedFlows.bindSession(...)`, поэтому маршрут не может действовать за пределами привязанного сеанса. Чтобы ограничить область потенциального ущерба:

- Используйте для каждого маршрута надёжный уникальный секрет.
- Предпочитайте SecretRef встроенному секрету в открытом виде.
- Привязывайте маршруты к наиболее узкому сеансу, подходящему для рабочего процесса.
- Открывайте доступ только к конкретному пути Webhook, который вам нужен.

Порядок обработки запросов для каждого пути: проверка HTTP-метода (только `POST`) и `Content-Type: application/json`, затем ограничение частоты запросов с фиксированным окном (120 запросов за 60-секундное окно для каждого ключа «путь + IP-адрес клиента», не более 4 096 отслеживаемых ключей), затем ограничение одновременно обрабатываемых запросов (8 параллельных запросов на ключ, не более 4 096 отслеживаемых ключей), затем аутентификация по общему секрету, после чего чтение тела JSON с ограничением 256 КБ и тайм-аутом 15 секунд. Запросы, не прошедшие более раннюю проверку, до последующих проверок не доходят.

## Формат запроса

Отправляйте запросы `POST` с `Content-Type: application/json` и заголовком `Authorization: Bearer <secret>` либо `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Поддерживаемые действия

| Действие           | Назначение                                                                  |
| ------------------ | --------------------------------------------------------------------------- |
| `create_flow`      | Создать управляемый TaskFlow для сеанса маршрута.                           |
| `get_flow`         | Получить один TaskFlow по идентификатору.                                   |
| `list_flows`       | Вывести список TaskFlow для сеанса маршрута.                                |
| `find_latest_flow` | Получить TaskFlow, обновлённый последним.                                   |
| `resolve_flow`     | Разрешить TaskFlow по непрозрачному токену.                                 |
| `get_task_summary` | Получить сводку задачи для TaskFlow.                                        |
| `set_waiting`      | Перевести TaskFlow в ожидание с необязательными данными состояния/ожидания. |
| `resume_flow`      | Возобновить ожидающий или заблокированный TaskFlow.                         |
| `finish_flow`      | Отметить TaskFlow как завершённый.                                          |
| `fail_flow`        | Отметить TaskFlow как завершившийся с ошибкой.                              |
| `request_cancel`   | Запросить кооперативную отмену.                                             |
| `cancel_flow`      | Отменить TaskFlow (может вернуть `202`, если дочерние задачи ещё активны).  |
| `run_task`         | Создать управляемую дочернюю задачу внутри существующего TaskFlow.          |

Действия, изменяющие состояние (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`, `request_cancel`), требуют `flowId` и `expectedRevision` для оптимистичного управления параллелизмом; при устаревшей ревизии возвращается `409 revision_conflict`.

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

Допустимые значения `runtime`: `subagent`, `acp`. Поля `startedAt`, `lastEventAt` и `progressSummary` допустимы только при значении `status`, равном `"running"`; их передача с любым другим статусом возвращает `400 invalid_request`.

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

Представления процессов и задач никогда не содержат метаданные владельца или сеанса, поэтому ответы не могут раскрыть привязанный к маршруту `sessionKey`. Значения `code` включают `not_found`, `not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`, `cancel_pending`, `terminal`, `invalid_request`, `request_rejected`, а также резервные коды для отдельных действий (`mutation_rejected`, `create_rejected`, `task_not_created`, `cancel_rejected`), когда изменение отклонено по причине, не охватываемой перечисленными выше именованными кодами.

## Связанные материалы

- [Хуки](/ru/automation/hooks) — внутренние хуки, управляемые событиями, в сравнении с этим HTTP-мостом TaskFlow
- [Webhook Gateway (конфигурация `hooks.*`)](/ru/automation/cron-jobs#webhooks) — отдельная универсальная функция HTTP-конечной точки Gateway; это не то же самое, что маршруты данного Plugin
- [SDK среды выполнения Plugin](/ru/plugins/sdk-runtime)
- [Webhook в CLI](/ru/cli/webhooks)
