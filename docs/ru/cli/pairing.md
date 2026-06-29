---
read_when:
    - Вы используете личные сообщения в режиме сопряжения, и вам нужно одобрить отправителей
summary: Справочник CLI для `openclaw pairing` (запросы на сопряжение approve/list)
title: Сопряжение
x-i18n:
    generated_at: "2026-06-28T22:45:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Одобряйте или проверяйте запросы на сопряжение в DM (для каналов, поддерживающих сопряжение).

Связано:

- Поток сопряжения: [Сопряжение](/ru/channels/pairing)

## Команды

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Выводит список ожидающих запросов на сопряжение для одного канала.

Параметры:

- `[channel]`: позиционный идентификатор канала
- `--channel <channel>`: явный идентификатор канала
- `--account <accountId>`: идентификатор учетной записи для каналов с несколькими учетными записями
- `--json`: машиночитаемый вывод

Примечания:

- Если настроено несколько каналов с поддержкой сопряжения, нужно указать канал либо позиционно, либо с помощью `--channel`.
- Каналы расширений разрешены, если идентификатор канала действителен.

## `pairing approve`

Одобряет ожидающий код сопряжения и разрешает этого отправителя.

Использование:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, когда настроен ровно один канал с поддержкой сопряжения

Параметры:

- `--channel <channel>`: явный идентификатор канала
- `--account <accountId>`: идентификатор учетной записи для каналов с несколькими учетными записями
- `--notify`: отправить подтверждение запрашивающему в том же канале

Начальная настройка владельца:

- Если `commands.ownerAllowFrom` пуст при одобрении кода сопряжения, OpenClaw также записывает одобренного отправителя как владельца команд, используя запись в области канала, например `telegram:123456789`.
- Это выполняет начальную настройку только первого владельца. Последующие одобрения сопряжения не заменяют и не расширяют `commands.ownerAllowFrom`.
- Владелец команд — это учетная запись человека-оператора, которой разрешено выполнять команды только для владельца и одобрять опасные действия, такие как `/diagnostics`, `/export-trajectory`, `/config` и одобрения exec.

## Примечания

- Ввод канала: передайте его позиционно (`pairing list telegram`) или с помощью `--channel <channel>`.
- `pairing list` поддерживает `--account <accountId>` для каналов с несколькими учетными записями.
- `pairing approve` поддерживает `--account <accountId>` и `--notify`.
- Если настроен только один канал с поддержкой сопряжения, разрешено использовать `pairing approve <code>`.
- Если вы одобрили отправителя до появления этой начальной настройки, выполните `openclaw doctor`; команда предупреждает, когда владелец команд не настроен, и показывает команду `openclaw config set commands.ownerAllowFrom ...` для исправления.

## Связано

- [Справочник CLI](/ru/cli)
- [Сопряжение каналов](/ru/channels/pairing)
