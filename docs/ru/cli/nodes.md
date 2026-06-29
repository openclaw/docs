---
read_when:
    - Вы управляете связанными узлами (камерами, экраном, холстом)
    - Вам нужно одобрять запросы или вызывать команды node
summary: Справочник CLI для `openclaw nodes` (статус, сопряжение, вызов, камера/холст/экран)
title: Узлы
x-i18n:
    generated_at: "2026-06-28T22:44:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Управляйте связанными узлами (устройствами) и вызывайте возможности узлов.

Связанные разделы:

- Обзор узлов: [Узлы](/ru/nodes)
- Камера: [Узлы камер](/ru/nodes/camera)
- Изображения: [Узлы изображений](/ru/nodes/images)

Общие параметры:

- `--url`, `--token`, `--timeout`, `--json`

## Общие команды

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` выводит таблицы ожидающих и связанных узлов. Строки связанных узлов включают давность последнего подключения (Последнее подключение).
Используйте `--connected`, чтобы показывать только узлы, подключенные в данный момент. Используйте `--last-connected <duration>`, чтобы
отфильтровать узлы, подключавшиеся в течение указанного периода (например, `24h`, `7d`).
Используйте `nodes remove --node <id|name|ip>`, чтобы удалить связь узла. Для узла,
поддерживаемого устройством, это отзывает роль устройства `node` в `devices/paired.json`
и отключает его сеансы с ролью узла (устройство со смешанными ролями сохраняет свою строку и
теряет только роль `node`; устройство только с ролью узла удаляется); также очищается любая
соответствующая устаревшая запись связи узла, принадлежащая Gateway. `operator.pairing` может удалять
строки узлов без роли оператора; вызывающей стороне с токеном устройства, которая отзывает собственную роль узла на
устройстве со смешанными ролями, дополнительно требуется `operator.admin`.

Примечание об одобрении:

- `openclaw nodes pending` требует только область действия для связывания.
- `gateway.nodes.pairing.autoApproveCidrs` может пропустить этап ожидания только для
  явно доверенного первичного связывания устройства с `role: node`. По умолчанию он отключен
  и не одобряет повышения уровня.
- `openclaw nodes approve <requestId>` наследует дополнительные требования к области действия из
  ожидающего запроса:
  - запрос без команд: только связывание
  - команды узла без exec: связывание + запись
  - `system.run` / `system.run.prepare` / `system.which`: связывание + администрирование

## Вызов

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Флаги вызова:

- `--params <json>`: строка объекта JSON (по умолчанию `{}`).
- `--invoke-timeout <ms>`: тайм-аут вызова узла (по умолчанию `15000`).
- `--idempotency-key <key>`: необязательный ключ идемпотентности.
- `system.run` и `system.run.prepare` здесь заблокированы; для выполнения команд оболочки используйте инструмент `exec` с `host=node`.

Для выполнения команд оболочки на узле используйте инструмент `exec` с `host=node` вместо `openclaw nodes run`.
CLI `nodes` теперь ориентирован на возможности: прямой RPC через `nodes invoke`, а также связывание, камера,
экран, местоположение, Canvas и уведомления. Команды Canvas реализованы встроенным экспериментальным плагином Canvas; ядро сохраняет хук совместимости, чтобы они оставались доступны в `openclaw nodes canvas`.

## Связанные разделы

- [Справочник CLI](/ru/cli)
- [Узлы](/ru/nodes)
