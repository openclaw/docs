---
read_when:
    - Вы хотите найти идентификаторы контактов/групп/своего профиля для канала
    - Вы разрабатываете адаптер каталога каналов
summary: Справочник CLI для `openclaw directory` (себя, участников, групп)
title: Каталог
x-i18n:
    generated_at: "2026-07-03T17:33:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Поиск в каталогах для каналов, которые это поддерживают (контакты/участники, группы и "я").

## Общие флаги

- `--channel <name>`: id/псевдоним канала (обязателен, когда настроено несколько каналов; определяется автоматически, когда настроен только один)
- `--account <id>`: id учетной записи (по умолчанию: значение канала по умолчанию)
- `--json`: вывести JSON

## Примечания

- `directory` предназначена для того, чтобы помочь найти ID, которые можно вставлять в другие команды (особенно `openclaw message send --target ...`).
- Для многих каналов результаты основаны на конфигурации (списки разрешенных пользователей / настроенные группы), а не на живом каталоге провайдера.
- Установленные плагины каналов все равно могут не поддерживать каталог; в этом случае команда сообщает о неподдерживаемой операции каталога, а не переустанавливает плагин.
- Вывод по умолчанию — `id` (и иногда `name`), разделенные табуляцией; используйте `--json` для скриптов.

## Использование результатов с `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Форматы ID (по каналам)

- WhatsApp: `+15551234567` (личное сообщение), `1234567890-1234567890@g.us` (группа), `120363123456789@newsletter` (исходящая цель Channel/Newsletter)
- Signal: настроенные псевдонимы преобразуются в цели личных сообщений E.164/UUID или групповые цели `group:<id>`
- Telegram: `@username` или числовой id чата; группы используют числовые id
- Slack: `user:U…` и `channel:C…`
- Discord: `user:<id>` и `channel:<id>`
- Matrix (плагин): `user:@user:server`, `room:!roomId:server` или `#alias:server`
- Microsoft Teams (плагин): `user:<id>` и `conversation:<id>`
- Zalo (плагин): id пользователя (Bot API)
- Zalo Personal / `zalouser` (плагин): id ветки (личное сообщение/группа) из `zca` (`me`, `friend list`, `group list`)

## Сведения о себе ("me")

```bash
openclaw directory self --channel zalouser
```

## Участники (контакты/пользователи)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Группы

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Связанные материалы

- [Справочник CLI](/ru/cli)
