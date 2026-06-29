---
read_when:
    - Вы хотите найти идентификаторы контактов/групп/своего профиля для канала
    - Вы разрабатываете адаптер каталога каналов
summary: Справочник CLI для `openclaw directory` (себя, собеседников, групп)
title: Каталог
x-i18n:
    generated_at: "2026-06-28T22:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Поиск в каталогах для каналов, которые это поддерживают (контакты/собеседники, группы и «я»).

## Общие флаги

- `--channel <name>`: идентификатор/псевдоним канала (обязательно, когда настроено несколько каналов; выбирается автоматически, когда настроен только один)
- `--account <id>`: идентификатор учетной записи (по умолчанию: канал по умолчанию)
- `--json`: вывести JSON

## Примечания

- `directory` предназначен для поиска идентификаторов, которые можно вставлять в другие команды (особенно `openclaw message send --target ...`).
- Для многих каналов результаты берутся из конфигурации (списки разрешений / настроенные группы), а не из живого каталога провайдера.
- Установленные Plugin каналов все равно могут не поддерживать каталог; в этом случае команда сообщает о неподдерживаемой операции каталога вместо переустановки Plugin.
- Вывод по умолчанию: `id` (а иногда `name`), разделенные табуляцией; используйте `--json` для скриптов.

## Использование результатов с `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Форматы идентификаторов (по каналам)

- WhatsApp: `+15551234567` (личное сообщение), `1234567890-1234567890@g.us` (группа), `120363123456789@newsletter` (исходящая цель канала/рассылки)
- Telegram: `@username` или числовой идентификатор чата; группы используют числовые идентификаторы
- Slack: `user:U…` и `channel:C…`
- Discord: `user:<id>` и `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` или `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` и `conversation:<id>`
- Zalo (Plugin): идентификатор пользователя (Bot API)
- Zalo Personal / `zalouser` (Plugin): идентификатор цепочки (личное сообщение/группа) из `zca` (`me`, `friend list`, `group list`)

## Собственный профиль («я»)

```bash
openclaw directory self --channel zalouser
```

## Собеседники (контакты/пользователи)

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

## См. также

- [Справочник CLI](/ru/cli)
