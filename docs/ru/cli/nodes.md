---
read_when:
    - Вы управляете сопряжёнными узлами (камерами, экраном, холстом)
    - Вам нужно одобрять запросы или вызывать команды Node
summary: Справочник CLI для `openclaw nodes` (статус, сопряжение, вызов, камера/холст/экран/местоположение/уведомление)
title: Узлы
x-i18n:
    generated_at: "2026-07-13T19:39:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: f6b80ca2d82e834280943bcde32f6dfab51ce5566e2174f2d0aa1cd58ca39d6a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Управляйте сопряжёнными узлами (устройствами) и вызывайте возможности узлов.

См. также: [Обзор узлов](/ru/nodes) - [Присутствие за активным компьютером](/ru/nodes/presence) - [Узлы камер](/ru/nodes/camera) - [Узлы изображений](/ru/nodes/images)

Общие параметры для каждой подкоманды: `--url <url>`, `--token <token>`, `--timeout <ms>` (по умолчанию `10000`), `--json`.

## Состояние

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

И `status`, и `list` принимают `--connected` (только подключённые узлы) и `--last-connected <duration>` (например, `24h`, `7d`; только узлы, подключавшиеся в течение указанного периода). `list` показывает ожидающие и сопряжённые узлы в отдельных таблицах, причём строки сопряжённых узлов содержат время с момента последнего подключения (Last Connect); `status` показывает одну объединённую таблицу с возможностями, версией и сведениями о последнем вводе для каждого узла. Подключённый узел macOS сообщает о последнем вводе только при предоставленном разрешении Accessibility, а самая свежая строка помечается как `active`; см. [Присутствие за активным компьютером](/ru/nodes/presence). `describe` выводит возможности, разрешения, активность и действующие или ожидающие команды вызова одного узла.

## Сопряжение

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Эти команды управляют принадлежащим Gateway хранилищем `node.pair.*`, отдельным от сопряжения устройств (`openclaw devices approve`), которое контролирует рукопожатие `connect` узла по WS. О связи между ними см. в разделе [Узлы](/ru/nodes).

- `remove` отзывает запись сопряжённой роли узла. Для узла на основе устройства эта команда отзывает роль `node` в хранилище сопряжения устройств и отключает его сеансы с ролью узла: устройство с несколькими ролями сохраняет свою строку и теряет только роль `node`, а строка устройства только с ролью узла удаляется. Команда также удаляет все соответствующие устаревшие записи сопряжения узлов из принадлежащего Gateway хранилища.
- Для `pending` требуется только область действия `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` позволяет пропустить этап ожидания при явно доверенном первом сопряжении устройства `role: node`. По умолчанию отключено; повышения ролей не одобряются.
- `gateway.nodes.pairing.sshVerify` (по умолчанию включено) автоматически одобряет первое сопряжение устройства `role: node`, когда Gateway может проверить ключ устройства по SSH на хосте узла; первая поверхность возможностей одобряется на том же этапе. См. [Сопряжение узлов](/ru/gateway/pairing#ssh-verified-device-auto-approval-default).
- Требования к областям действия для `approve` зависят от команд, объявленных в ожидающем запросе:
  - запрос без команд: `operator.pairing`
  - команды узла, не выполняющие код: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`
- Область действия `remove`: `operator.pairing` позволяет удалять строки узлов, не принадлежащие оператору; вызывающей стороне с токеном устройства, отзывающей собственную роль узла на устройстве с несколькими ролями, дополнительно требуется `operator.admin`.

## Вызов

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Флаги:

- `--command <command>` (обязательный): например, `canvas.eval`.
- `--params <json>`: строка с объектом JSON (по умолчанию `{}`).
- `--invoke-timeout <ms>`: время ожидания вызова узла (по умолчанию `15000`).
- `--idempotency-key <key>`: необязательный ключ идемпотентности.

`system.run` и `system.run.prepare` здесь заблокированы; для выполнения команд оболочки вместо них используйте инструмент `exec` с `host=node`. `system.which` разрешён через `invoke`.

## Уведомления, push-сообщения, местоположение и экран

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` отправляет локальное уведомление на узел, объявляющий `system.notify`, включая узлы macOS, iOS, Android и напрямую подключённые узлы watchOS. Для прямой доставки на watchOS приложение OpenClaw должно быть активно. Требуется `--title` или `--body`. Параметры: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (по умолчанию `system`), `--invoke-timeout <ms>` (по умолчанию `15000`).
- `push` отправляет тестовое push-сообщение APNs на узел iOS. Параметры: `--title <text>` (по умолчанию `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` для переопределения обнаруженной среды APNs.
- `location get` получает текущее местоположение узла. Параметры: `--max-age <ms>` (повторно использовать кэшированные координаты), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (по умолчанию `10000`), `--invoke-timeout <ms>` (по умолчанию `20000`).
- `screen record` записывает короткий клип и выводит путь к сохранённому файлу (либо записывает JSON при использовании `--json`). Параметры: `--screen <index>` (по умолчанию `0`), `--duration <ms|10s>` (по умолчанию `10000`), `--fps <fps>` (по умолчанию `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (по умолчанию `120000`).

Для команд камеры и Canvas предусмотрена отдельная документация: [Узлы камер](/ru/nodes/camera), [Canvas](/ru/platforms/mac/canvas). Canvas реализован встроенным экспериментальным плагином Canvas; ядро сохраняет `openclaw nodes canvas` как точку монтирования для совместимости.

## См. также

- [Справочник CLI](/ru/cli)
- [Узлы](/ru/nodes)
