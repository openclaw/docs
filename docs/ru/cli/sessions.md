---
read_when:
    - Вы хотите вывести список сохранённых сеансов и посмотреть недавнюю активность
summary: Справочник CLI для `openclaw sessions` (список сохраненных сеансов + использование)
title: Сеансы
x-i18n:
    generated_at: "2026-07-04T20:38:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Выводит список сохраненных сеансов бесед.

Списки сеансов не являются проверками работоспособности каналов/провайдеров. Они показывают сохраненные
строки бесед из хранилищ сеансов. Тихий Discord, Slack, Telegram или
другой канал может успешно переподключиться без создания новой строки сеанса
до обработки сообщения. Используйте `openclaw channels status --probe`,
`openclaw status --deep` или `openclaw health --verbose`, когда нужна текущая
связность канала.

Ответы `openclaw sessions` и Gateway `sessions.list` по умолчанию ограничены,
чтобы большие долгоживущие хранилища не могли монополизировать процесс CLI или
цикл событий Gateway. CLI по умолчанию возвращает 100 новейших сеансов; передайте
`--limit <n>` для меньшего/большего окна или `--limit all`, когда намеренно
нужно все хранилище. JSON-ответы включают `totalCount`, `limitApplied` и
`hasMore`, когда вызывающим сторонам нужно показать, что существуют дополнительные строки.

RPC-клиенты могут передать `configuredAgentsOnly: true`, чтобы сохранить широкий объединенный
источник обнаружения, но возвращать только строки для агентов, которые сейчас есть в конфигурации.
Control UI использует этот режим по умолчанию, чтобы удаленные или существующие только на диске хранилища агентов
не появлялись снова в представлении сеансов.

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

Отслеживать человекочитаемый прогресс траектории для сохраненных сеансов:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` отображает недавние события JSONL траектории в виде компактных строк прогресса. Без `--session-key` он сначала отслеживает выполняющиеся сеансы, затем последний сохраненный сеанс. `--tail <count>` управляет тем, сколько существующих событий печатается перед режимом отслеживания; значение по умолчанию — `80`, а `0` начинает с текущего конца. `--follow` продолжает наблюдать за выбранными файлами траекторий, включая перемещенные файлы, на которые ссылается `<session>.trajectory-path.json`.

Представление прогресса намеренно консервативно: текст промпта, аргументы инструментов и тела результатов инструментов не печатаются. Вызовы инструментов показывают имя инструмента с `{...redacted...}`; результаты инструментов показывают статус, например `ok`, `error` или `done`; строки завершения модели показывают провайдера/модель и терминальный статус.

Экспортировать пакет траектории для сохраненного сеанса:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Это путь команды, используемый slash-командой `/export-trajectory` после того,
как владелец одобряет запрос на выполнение. Выходной каталог всегда разрешается
внутри `.openclaw/trajectory-exports/` в выбранном рабочем пространстве.

`openclaw sessions --all-agents` читает настроенные хранилища агентов. Обнаружение
сеансов Gateway и ACP шире: они также включают хранилища только на диске, найденные в
корне `agents/` по умолчанию или в шаблонном корне `session.store`. Эти
обнаруженные хранилища должны разрешаться в обычные файлы `sessions.json` внутри
корня агента; символические ссылки и пути за пределами корня пропускаются.

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

## Обслуживание очистки

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

- Примечание об области: `openclaw sessions cleanup` обслуживает хранилища сеансов, транскрипты и sidecar-файлы траекторий. Он не сокращает историю запусков Cron, которой управляет `cron.runLog.keepLines` в [конфигурации Cron](/ru/automation/cron-jobs#configuration) и которая объясняется в [обслуживании Cron](/ru/automation/cron-jobs#maintenance).
- Очистка также удаляет несвязанные основные транскрипты, контрольные точки Compaction и sidecar-файлы траекторий старше `session.maintenance.pruneAfter`; файлы, на которые все еще ссылается `sessions.json`, сохраняются.
- Очистка отдельно сообщает об удалении короткоживущих проверок запусков моделей Gateway как `modelRunPruned`. Это соответствует только строгим явным ключам формы `agent:*:explicit:model-run-<uuid>`. Фиксированное удержание составляет `24h`, но оно ограничено давлением: устаревшие строки проверок удаляются только тогда, когда достигнуто обслуживание записей сеансов/давление лимита. Когда это выполняется, очистка запусков моделей происходит перед глобальной очисткой устаревших записей и ограничением.

- `--dry-run`: предварительно показать, сколько записей было бы удалено/ограничено без записи.
  - В текстовом режиме dry-run печатает таблицу действий по сеансам (`Action`, `Key`, `Age`, `Model`, `Flags`) и сводку, сгруппированную по метке сеанса, чтобы было видно, что будет сохранено, а что удалено.
- `--enforce`: применить обслуживание, даже когда `session.maintenance.mode` равно `warn`.
- `--fix-missing`: удалить записи, чьи файлы транскриптов отсутствуют или содержат только заголовок/пусты, даже если по возрасту/числу они еще обычно не подлежали бы удалению.
- `--fix-dm-scope`: когда `session.dmScope` равно `main`, вывести из обращения устаревшие строки прямых DM с ключами пиров, оставшиеся после более ранней маршрутизации `per-peer`, `per-channel-peer` или `per-account-channel-peer`. Сначала используйте `--dry-run`; применение очистки удаляет эти строки из `sessions.json` и сохраняет их транскрипты как удаленные архивы.
- `--active-key <key>`: защитить конкретный активный ключ от вытеснения по дисковому бюджету. Долговечные внешние указатели бесед, такие как групповые сеансы и сеансы чатов в рамках тредов, также сохраняются обслуживанием по возрасту/числу/дисковому бюджету.
- `--agent <id>`: выполнить очистку для одного настроенного хранилища агента.
- `--all-agents`: выполнить очистку для всех настроенных хранилищ агентов.
- `--store <path>`: выполнить для конкретного файла `sessions.json`.
- `--json`: напечатать JSON-сводку. С `--all-agents` вывод включает одну сводку на хранилище.

Когда Gateway доступен, очистка без dry-run для настроенных хранилищ агентов
отправляется через Gateway, чтобы использовать тот же писатель хранилища сеансов, что и runtime-трафик.
Используйте `--store <path>` для явного офлайн-восстановления файла хранилища.

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

## Сжать сеанс

Освободить бюджет контекста для зависшего или слишком большого сеанса. `openclaw sessions compact <key>` — первоклассная оболочка вокруг Gateway RPC `sessions.compact`, требующая запущенного Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Без `--max-lines` Gateway выполняет LLM-суммаризацию транскрипта. CLI по умолчанию не накладывает клиентский дедлайн; Gateway владеет настроенным жизненным циклом Compaction.
- С `--max-lines <n>` он усекает до последних `n` строк транскрипта и архивирует предыдущий транскрипт как sidecar `.bak`.
- `--agent <id>`: агент, которому принадлежит сеанс; требуется для ключей `global`.
- `--url` / `--token` / `--password`: переопределения подключения к Gateway.
- `--timeout <ms>`: необязательный клиентский тайм-аут RPC в миллисекундах.
- `--json`: напечатать сырой payload RPC.

Команда завершается с ненулевым кодом, когда Gateway сообщает о неудачной Compaction или недоступен, поэтому Cron и скрипты никогда не принимают тихую операцию без эффекта за успех.

> Примечание: `openclaw agent --message '/compact ...'` — **не** путь Compaction. Slash-команды из CLI отклоняются проверкой авторизованного отправителя; такой вызов завершается с ненулевым кодом и подсказкой сюда вместо тихой операции без эффекта.

### RPC `sessions.compact`

`openclaw gateway call sessions.compact --params '<json>'` принимает:

| Поле       | Тип         | Обязательно | Описание                                                   |
| ---------- | ----------- | ------------ | ---------------------------------------------------------- |
| `key`      | string      | да           | Ключ сеанса для сжатия (например `agent:main:main`).       |
| `agentId`  | string      | нет          | Идентификатор агента, которому принадлежит сеанс (для ключей `global`). |
| `maxLines` | integer ≥ 1 | нет          | Усечь до последних N строк вместо LLM-суммаризации.        |

Пример ответа LLM-суммаризации:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Пример ответа усечения (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Связанное

- Конфигурация сеансов: [справочник по конфигурации](/ru/gateway/config-agents#session)
- [справочник CLI](/ru/cli)
- [управление сеансами](/ru/concepts/session)
