---
read_when:
    - Добавление или изменение действий CLI для сообщений
    - Изменение поведения исходящего канала
summary: Справочник CLI для `openclaw message` (отправка и действия канала)
title: Сообщение
x-i18n:
    generated_at: "2026-07-13T18:01:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Единая исходящая команда для отправки сообщений и выполнения действий в каналах
Discord, Google Chat, iMessage, Matrix, Mattermost (плагин), Microsoft Teams,
Signal, Slack, Telegram и WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Выбор канала

- `--channel <name>` обязателен, если настроено несколько каналов; если
  настроен ровно один канал, он используется по умолчанию.
- Значения: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (для Mattermost требуется плагин).
- Цели с префиксом канала (например, `discord:channel:123`) позволяют определить
  плагин-владелец без явного указания `--channel`.

## Форматы целей (`-t, --target`)

| Канал               | Формат                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, упоминание `<@id>` или числовой идентификатор без префикса (считается идентификатором канала)               |
| Google Chat         | `spaces/<spaceId>` или `users/<userId>`                                                                     |
| iMessage            | дескриптор, `chat_id:<id>`, `chat_guid:<guid>` или `chat_identifier:<id>`                                      |
| Mattermost (плагин) | `channel:<id>`, `user:<id>`, `@username` или идентификатор без префикса (считается каналом)                              |
| Matrix              | `@user:server`, `!room:server` или `#alias:server`                                                         |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), идентификатор беседы без префикса или `user:<aad-object-id>`             |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` или любой из этих вариантов с префиксом `signal:` |
| Slack               | `channel:<id>` или `user:<id>` (идентификатор без префикса считается каналом)                                          |
| Telegram            | идентификатор чата, `@username` или цель темы форума: `<chatId>:topic:<topicId>` (либо `--thread-id <topicId>`)     |
| WhatsApp            | E.164, JID группы (`...@g.us`) или JID канала/рассылки (`...@newsletter`)                                |

Поиск по имени канала: для провайдеров с каталогом (Discord/Slack и т. д.) имена
вроде `Help` или `#help` разрешаются через кеш каталога, а при отсутствии
в кеше выполняется запрос к актуальному каталогу, если провайдер это поддерживает.

## Общие флаги

Каждое действие принимает: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Действия с целевым назначением также принимают
`-t, --target <dest>`.

## Разрешение SecretRef

`openclaw message` разрешает SecretRef каналов перед выполнением действия
с максимально узкой областью:

- в пределах канала, если задан `--channel` (или канал определён по цели с префиксом)
- в пределах учётной записи, если также задан `--account`
- для всех настроенных каналов, если не задан ни один из них

Неразрешённые SecretRef в несвязанных каналах никогда не блокируют целевое действие;
неразрешённый SecretRef в выбранном канале или учётной записи приводит к безопасному отказу действия.

## Действия

### Основные

| Действие        | Каналы                                                                                                          | Обязательные параметры                                          | Примечания                                                                                                                                                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (плагин), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target` и один из `--message`/`--media`/`--presentation` | См. раздел [Отправка](#send) ниже.                                                                                                                                                                                                                                                                     |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (можно повторять)        | См. раздел [Опрос](#poll) ниже.                                                                                                                                                                                                                                                                        |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (требуется `--emoji`; не указывайте его, чтобы удалить собственные реакции там, где это поддерживается, см. [Реакции](/ru/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Для реакций в группах Signal требуется `--target-author` или `--target-author-uuid`. Nextcloud Talk позволяет только добавлять реакции; `--remove` приводит к ошибке. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                             |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` считывает конкретную временную метку; объедините с `--thread-id`, чтобы получить точный ответ в ветке.                                                                                                     |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | В ветках форума Telegram используется `--thread-id`.                                                                                                                                                                                                                                              |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                        |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` также принимает `--pinned-message-id` (Microsoft Teams: идентификатор ресурса закрепления/списка закреплений, а не идентификатор сообщения чата).                                                                                                                                           |
| `pins` (список) | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                             |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: доступно только при включённом шифровании и разрешённых действиях проверки.                                                                                                                                                                                                                     |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (можно повторять), `--author-id`, `--author-ids` (можно повторять), `--limit`.                                                                                                                                                                                                           |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                |

### Отправка

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: прикрепить изображение, аудио, видео или документ (локальный путь либо
  URL).
- `--presentation <json>`: общая полезная нагрузка с блоками `text`, `context`, `divider`,
  `chart`, `table`, `buttons` и `select`, отображаемыми с учётом
  возможностей канала. См. [Представление сообщений](/ru/plugins/message-presentation).
- `--delivery <json>`: общие параметры доставки, например `{"pin":
true}`. `--pin` — сокращённая форма закреплённой доставки, если канал
  её поддерживает.
- `--reply-to <id>`, `--thread-id <id>` (тема форума Telegram; временная метка ветки
  Slack, то же поле, что и `--reply-to`).
- `--force-document` (Telegram, WhatsApp): отправлять изображения, GIF и видео как
  документы, чтобы избежать сжатия каналом.
- `--silent` (Telegram, Discord): отправить без уведомления.
- `--gif-playback` (только WhatsApp): воспроизводить видеофайл как GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Выберите:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Одобрить","value":"approve","style":"success"},{"label":"Отклонить","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Выберите:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Да","value":"cmd:yes"},{"label":"Нет","value":"cmd:no"}]}]}'
```

Slack отображает поддерживаемые блоки диаграмм нативно; другие каналы получают те же
данные в виде удобочитаемого текста:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Квартальная выручка","categories":["1-й квартал","2-й квартал"],"series":[{"name":"Выручка","values":[120,145]}],"xLabel":"Квартал"}]}'
```

Slack также отображает явные блоки таблиц нативно. Другие каналы получают
подпись и каждую строку в виде детерминированного текста:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Отчёт о воронке","blocks":[{"type":"table","caption":"Открытая воронка","headers":["Клиент","Этап","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Кнопки мини-приложений Telegram используют `webApp` (`web_app` по-прежнему распознаётся для устаревшего
JSON) и отображаются только в личных чатах между пользователем и ботом:

```bash
openclaw message send --channel telegram --target 123456789 --message "Открыть приложение:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Запустить","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Обновление статуса","blocks":[{"type":"text","text":"Сборка завершена"}]}'
```

### Опрос

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Перекус?" \
  --poll-option Пицца --poll-option Суши \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: повторите 2-12 раз.
- `--poll-multi`: разрешает выбирать несколько вариантов.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5-600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Обед?" \
  --poll-option Пицца --poll-option Суши \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Обед?" \
  --poll-option Пицца --poll-option Суши
```

### Ветки

- `thread create`: каналы Discord. Обязательные параметры: `--thread-name`, `--target`
  (идентификатор канала). Необязательные: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: каналы Discord. Обязательный параметр: `--guild-id`. Необязательные:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: каналы Discord. Обязательные параметры: `--target` (идентификатор ветки),
  `--message`. Необязательные: `--media`, `--reply-to`.

### Эмодзи

- `emoji list`: Discord (`--guild-id`), Slack (без дополнительных флагов).
- `emoji upload`: Discord. Обязательные параметры: `--guild-id`, `--emoji-name`, `--media`.
  Необязательный: `--role-ids` (можно повторять).

### Стикеры

- `sticker send`: Discord. Обязательные параметры: `--target`, `--sticker-id` (можно повторять).
  Необязательный: `--message`.
- `sticker upload`: Discord. Обязательные параметры: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Роли, каналы, голосовая связь и события (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: обязательные параметры: `--guild-id`, `--event-name`, `--start-time`;
  необязательные: `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Модерация (Discord)

- `timeout`: `--guild-id`, `--user-id`; необязательные: `--duration-min` или
  `--until` (не указывайте оба, чтобы снять ограничение по времени), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Рассылка

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Отправляет одно содержимое нескольким получателям. `--targets` принимает разделённый пробелами
список. Используйте `--channel all`, чтобы выбрать всех настроенных провайдеров.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Отправка через агента](/ru/tools/agent-send)
- [Представление сообщений](/ru/plugins/message-presentation)
