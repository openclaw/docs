---
read_when:
    - Вы хотите вывести список сохраненных сеансов и посмотреть недавнюю активность
summary: Справочник CLI для `openclaw sessions` (список сохранённых сессий + использование)
title: Сессии
x-i18n:
    generated_at: "2026-06-28T22:46:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Вывести сохраненные сессии разговоров.

Списки сессий не являются проверками доступности каналов/провайдеров. Они показывают сохраненные
строки разговоров из хранилищ сессий. Тихий Discord, Slack, Telegram или
другой канал может успешно переподключиться, не создавая новую строку сессии,
пока не будет обработано сообщение. Используйте `openclaw channels status --probe`,
`openclaw status --deep` или `openclaw health --verbose`, когда нужна живая
связность канала.

Ответы `openclaw sessions` и Gateway `sessions.list` по умолчанию ограничены,
чтобы большие долгоживущие хранилища не могли монополизировать процесс CLI или
цикл событий Gateway. CLI по умолчанию возвращает 100 новейших сессий; передайте
`--limit <n>` для меньшего/большего окна или `--limit all`, когда намеренно
нужно полное хранилище. JSON-ответы включают `totalCount`, `limitApplied` и
`hasMore`, когда вызывающим сторонам нужно показать, что существуют дополнительные строки.

RPC-клиенты могут передать `configuredAgentsOnly: true`, чтобы сохранить широкий объединенный
источник обнаружения, но вернуть только строки для агентов, которые сейчас присутствуют в конфигурации.
Control UI по умолчанию использует этот режим, чтобы удаленные или существующие только на диске хранилища агентов
не появлялись снова в представлении Sessions.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Выбор области:

- по умолчанию: настроенное хранилище агента по умолчанию
- `--verbose`: подробное журналирование
- `--agent <id>`: одно настроенное хранилище агента
- `--all-agents`: объединить все настроенные хранилища агентов
- `--store <path>`: явный путь к хранилищу (нельзя сочетать с `--agent` или `--all-agents`)
- `--limit <n|all>`: максимальное число строк для вывода (по умолчанию `100`; `all` восстанавливает полный вывод)

Следить за человекочитаемым ходом траектории для сохраненных сессий:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` отображает недавние JSONL-события траектории как компактные строки прогресса. Без `--session-key` он сначала следит за выполняющимися сессиями, затем за последней сохраненной сессией. `--tail <count>` управляет тем, сколько существующих событий печатать перед режимом слежения; по умолчанию используется `80`, а `0` начинает с текущего конца. `--follow` продолжает наблюдать за выбранными файлами траекторий, включая перемещенные файлы, на которые ссылается `<session>.trajectory-path.json`.

Представление прогресса намеренно консервативно: текст промпта, аргументы инструментов и тела результатов инструментов не печатаются. Вызовы инструментов показывают имя инструмента с `{...redacted...}`; результаты инструментов показывают статус, например `ok`, `error` или `done`; строки завершения модели показывают провайдера/модель и конечный статус.

Экспортировать набор траектории для сохраненной сессии:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Это путь команды, который используется slash-командой `/export-trajectory` после того, как
владелец одобрит запрос на выполнение. Выходной каталог всегда разрешается
внутри `.openclaw/trajectory-exports/` под выбранной рабочей областью.

`openclaw sessions --all-agents` читает настроенные хранилища агентов. Обнаружение сессий
Gateway и ACP шире: оно также включает хранилища только на диске, найденные под
корневым каталогом `agents/` по умолчанию или шаблонным корнем `session.store`. Эти
обнаруженные хранилища должны разрешаться в обычные файлы `sessions.json` внутри
корня агента; символические ссылки и пути вне корня пропускаются.

Примеры JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Обслуживающая очистка

Запустить обслуживание сейчас (вместо ожидания следующего цикла записи):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` использует настройки `session.maintenance` из конфигурации:

- Примечание об области: `openclaw sessions cleanup` обслуживает хранилища сессий, транскрипты и вспомогательные файлы траекторий. Она не удаляет историю запусков Cron, которой управляет `cron.runLog.keepLines` в [конфигурации Cron](/ru/automation/cron-jobs#configuration) и которая объяснена в [обслуживании Cron](/ru/automation/cron-jobs#maintenance).
- Очистка также удаляет несвязанные первичные транскрипты, контрольные точки Compaction и вспомогательные файлы траекторий старше `session.maintenance.pruneAfter`; файлы, на которые все еще ссылается `sessions.json`, сохраняются.
- Очистка отдельно сообщает об удалении краткоживущих пробных запусков модели Gateway как `modelRunPruned`. Это совпадает только со строгими явными ключами формы `agent:*:explicit:model-run-<uuid>`. Фиксированное удержание составляет `24h`, но оно зависит от давления: устаревшие строки проб удаляются только при достижении обслуживания записей сессий/давления лимита. Когда она выполняется, очистка запусков модели происходит перед глобальной очисткой устаревших данных и ограничением.

- `--dry-run`: предварительно показать, сколько записей было бы удалено/ограничено без записи.
  - В текстовом режиме dry-run печатает таблицу действий по сессиям (`Action`, `Key`, `Age`, `Model`, `Flags`) плюс сводку, сгруппированную по метке сессии, чтобы было видно, что будет сохранено и что удалено.
- `--enforce`: применить обслуживание, даже когда `session.maintenance.mode` равен `warn`.
- `--fix-missing`: удалить записи, чьи файлы транскриптов отсутствуют или содержат только заголовок/пусты, даже если обычно они еще не были бы удалены по возрасту/количеству.
- `--fix-dm-scope`: когда `session.dmScope` равен `main`, вывести из обращения устаревшие строки прямых DM с ключами peers, оставшиеся после прежней маршрутизации `per-peer`, `per-channel-peer` или `per-account-channel-peer`. Сначала используйте `--dry-run`; применение очистки удаляет эти строки из `sessions.json` и сохраняет их транскрипты как удаленные архивы.
- `--active-key <key>`: защитить конкретный активный ключ от вытеснения из-за дискового бюджета. Долговечные внешние указатели разговоров, такие как групповые сессии и привязанные к тредам чат-сессии, также сохраняются обслуживанием по возрасту/количеству/дисковому бюджету.
- `--agent <id>`: запустить очистку для одного настроенного хранилища агента.
- `--all-agents`: запустить очистку для всех настроенных хранилищ агентов.
- `--store <path>`: выполнить для конкретного файла `sessions.json`.
- `--json`: напечатать JSON-сводку. С `--all-agents` вывод включает по одной сводке на хранилище.

Когда Gateway доступен, очистка не в режиме dry-run для настроенных хранилищ агентов
отправляется через Gateway, чтобы она использовала тот же writer хранилища сессий, что и runtime-трафик.
Используйте `--store <path>` для явного офлайн-ремонта файла хранилища.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## Сжать сессию

Освободить бюджет контекста для застрявшей или чрезмерно большой сессии. `openclaw sessions compact <key>` — первоклассная обертка вокруг Gateway RPC `sessions.compact`, требующая работающего Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Без `--max-lines` Gateway суммирует транскрипт с помощью LLM. Это может быть медленно, поэтому значение `--timeout` по умолчанию составляет `180000` мс.
- С `--max-lines <n>` он обрезает транскрипт до последних `n` строк и архивирует предыдущий транскрипт как вспомогательный файл `.bak`.
- `--agent <id>`: агент, которому принадлежит сессия; требуется для ключей `global`.
- `--url` / `--token` / `--password`: переопределения подключения к gateway.
- `--timeout <ms>`: тайм-аут RPC в миллисекундах.
- `--json`: напечатать сырой payload RPC.

Команда завершается с ненулевым кодом, когда Gateway сообщает о неудачной Compaction или недоступен, поэтому crons и скрипты никогда не примут тихую пустую операцию за успех.

> Примечание: `openclaw agent --message '/compact ...'` — это **не** путь Compaction. Slash-команды из CLI отклоняются проверкой авторизованного отправителя; такой вызов завершается с ненулевым кодом и указанием на этот раздел вместо тихой пустой операции.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` принимает:

| Поле       | Тип             | Обязательное | Описание                                                   |
| ---------- | --------------- | ------------ | ---------------------------------------------------------- |
| `key`      | string          | да           | Ключ сессии для Compaction (например, `agent:main:main`).  |
| `agentId`  | string          | нет          | Id агента, которому принадлежит сессия (для ключей `global`). |
| `maxLines` | целое число ≥ 1 | нет          | Обрезать до последних N строк вместо суммирования LLM.     |

Пример ответа суммирования LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Пример ответа обрезки (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Связанные разделы

- Конфигурация сессий: [справочник по конфигурации](/ru/gateway/config-agents#session)
- [справочник CLI](/ru/cli)
- [управление сессиями](/ru/concepts/session)
