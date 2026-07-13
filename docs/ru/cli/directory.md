---
read_when:
    - Вы хотите найти идентификаторы контактов, групп или собственной учётной записи для канала
    - Вы разрабатываете адаптер каталога каналов
summary: Справочник CLI для `openclaw directory` (собственный узел, одноранговые узлы, группы)
title: Каталог
x-i18n:
    generated_at: "2026-07-13T19:37:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Поиск в каталогах для каналов, которые его поддерживают: контакты/пользователи, группы и «я» (собственная учётная запись).

Результаты предназначены для вставки в другие команды, особенно в `openclaw message send --target ...`.

## Общие флаги

- `--channel <name>`: идентификатор/псевдоним канала (обязателен, если настроено несколько каналов; выбирается автоматически, если настроен только один)
- `--account <id>`: идентификатор учётной записи (по умолчанию: значение канала по умолчанию)
- `--json`: вывод в формате JSON

По умолчанию вывод (не в формате JSON) содержит `id` (а иногда и `name`), разделённые символом табуляции.

## Примечания

- Для многих каналов результаты берутся из конфигурации (списки разрешённых сущностей / настроенные группы), а не из актуального каталога поставщика.
- Уже установленный плагин канала может не поддерживать каталог. В этом случае команда сообщает о неподдерживаемой операции; она не пытается переустановить или обновить плагин для добавления поддержки.

## Использование результатов с `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Форматы идентификаторов по каналам

| Канал                               | Формат идентификатора получателя                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (личная переписка), `1234567890-1234567890@g.us` (группа), `120363123456789@newsletter` (канал/рассылка, только исходящие сообщения) |
| Signal                              | Настроенные псевдонимы преобразуются в получателей личных сообщений в формате E.164/UUID или групповых получателей `group:<id>` |
| Telegram                            | `@username` или числовой идентификатор чата; для групп используются числовые идентификаторы                           |
| Slack                               | `user:U…` и `channel:C…`                                                                                     |
| Discord                             | `user:<id>` и `channel:<id>`                                                                                     |
| Matrix (плагин)                     | `user:@user:server`, `room:!roomId:server` или `#alias:server`                                                               |
| Microsoft Teams (плагин)            | `user:<id>` и `conversation:<id>`                                                                                     |
| Zalo (плагин)                       | Идентификатор пользователя (Bot API)                                                                                        |
| Zalo Personal / `zalouser` (плагин) | Идентификатор ветки (личная переписка/группа) из `zca` (`me`, `friend list`, `group list`) |

## Собственная учётная запись («я»)

```bash
openclaw directory self --channel zalouser
```

## Пользователи (контакты/пользователи)

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
