---
read_when:
    - Вы управляете сопряжёнными узлами (камерами, экраном, холстом)
    - Вам необходимо одобрять запросы или вызывать команды Node
summary: Справочник CLI для `openclaw nodes` (статус, сопряжение, вызов, камера/холст/экран/местоположение/уведомления)
title: Узлы
x-i18n:
    generated_at: "2026-07-16T16:19:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Управление сопряжёнными узлами (устройствами) и вызов возможностей узлов.

См. также: [Обзор узлов](/ru/nodes) - [Присутствие активного компьютера](/ru/nodes/presence) - [Узлы камер](/ru/nodes/camera) - [Узлы изображений](/ru/nodes/images)

Общие параметры каждой подкоманды: `--url <url>`, `--token <token>`, `--timeout <ms>` (по умолчанию `10000`), `--json`.

## Состояние

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` и `list` принимают параметры `--connected` (только подключённые узлы) и `--last-connected <duration>` (например, `24h`, `7d`; только узлы, подключавшиеся в течение указанного периода). `list` выводит ожидающие и сопряжённые узлы в отдельных таблицах; строки сопряжённых узлов содержат время с момента последнего подключения (Last Connect). `status` выводит одну объединённую таблицу с возможностями, версией и сведениями о последнем вводе для каждого узла. Подключённый узел macOS сообщает о последнем вводе, только если предоставлено разрешение Accessibility, а самая актуальная строка помечается как `active`; см. [Присутствие активного компьютера](/ru/nodes/presence). `describe` выводит возможности, разрешения, активность, а также действующие и ожидающие команды вызова для одного узла.

## Сопряжение

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Эти команды управляют хранилищем `node.pair.*`, принадлежащим Gateway и отделённым от сопряжения устройств (`openclaw devices approve`), которое контролирует рукопожатие `connect` узла по WS. Связь между ними описана в разделе [Узлы](/ru/nodes).

- `remove` отзывает запись сопряжённой роли узла. Для узла на базе устройства эта команда отзывает роль `node` в хранилище сопряжения устройств и отключает его сеансы с ролью узла: устройство с несколькими ролями сохраняет свою строку и теряет только роль `node`, а строка устройства только с ролью узла удаляется. Команда также удаляет все соответствующие устаревшие записи сопряжения узлов, принадлежащие Gateway.
- `pending` требует только область действия `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` может пропустить этап ожидания для явно доверенного первичного сопряжения устройства `role: node`. По умолчанию отключено; повышение ролей не подтверждается.
- `gateway.nodes.pairing.sshVerify` (по умолчанию включено) автоматически подтверждает первичное сопряжение устройства `role: node`, если Gateway может проверить ключ устройства по SSH на хосте узла; первая поверхность возможностей подтверждается на том же этапе. См. [Сопряжение узлов](/ru/gateway/pairing#ssh-verified-device-auto-approval-default).
- Требования к области действия `approve` зависят от команд, объявленных в ожидающем запросе:
  - запрос без команд: `operator.pairing`
  - обычные команды узла: `operator.pairing` + `operator.write`
  - команды, требующие административных прав (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` и `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- Область действия `remove`: `operator.pairing` позволяет удалять строки узлов, не принадлежащих оператору; вызывающей стороне с токеном устройства, отзывающей собственную роль узла на устройстве с несколькими ролями, дополнительно требуется `operator.admin`.

## Вызов

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Флаги:

- `--command <command>` (обязательно): например, `canvas.eval`.
- `--params <json>`: строка объекта JSON (по умолчанию `{}`).
- `--invoke-timeout <ms>`: время ожидания вызова узла (по умолчанию `15000`).
- `--idempotency-key <key>`: необязательный ключ идемпотентности.

`system.run` и `system.run.prepare` здесь заблокированы; для выполнения команд оболочки вместо них используйте инструмент `exec` с `host=node`. `system.which` разрешена через `invoke`.

## Уведомления, push-уведомления, местоположение и экран

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` отправляет локальное уведомление на узел, объявляющий `system.notify`, включая узлы macOS, iOS, Android и прямые узлы watchOS. Для прямой доставки на watchOS приложение OpenClaw должно быть активно. Требуется `--title` или `--body`. Параметры: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (по умолчанию `system`), `--invoke-timeout <ms>` (по умолчанию `15000`).
- `push` отправляет тестовое push-уведомление APNs на узел iOS. Параметры: `--title <text>` (по умолчанию `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` для переопределения обнаруженной среды APNs.
- `location get` получает текущее местоположение узла. Параметры: `--max-age <ms>` (повторное использование кэшированных координат), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (по умолчанию `10000`), `--invoke-timeout <ms>` (по умолчанию `20000`).
- `screen record` записывает короткий клип и выводит путь к сохранённому файлу (либо записывает JSON при использовании `--json`). Параметры: `--screen <index>` (по умолчанию `0`), `--duration <ms|10s>` (по умолчанию `10000`), `--fps <fps>` (по умолчанию `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (по умолчанию `120000`).

Для команд камеры и Canvas предусмотрена отдельная документация: [Узлы камер](/ru/nodes/camera), [Canvas](/ru/platforms/mac/canvas). Canvas реализован встроенным экспериментальным плагином Canvas; ядро сохраняет `openclaw nodes canvas` как точку монтирования для совместимости.

## См. также

- [Справочник CLI](/ru/cli)
- [Узлы](/ru/nodes)
