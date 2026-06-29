---
read_when:
    - Добавление или изменение действий CLI для сообщений
    - Изменение поведения исходящего канала
summary: Справочник CLI для `openclaw message` (отправка + действия канала)
title: Сообщение
x-i18n:
    generated_at: "2026-06-28T22:44:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Единая исходящая команда для отправки сообщений и действий канала
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Использование

```
openclaw message <subcommand> [flags]
```

Выбор канала:

- `--channel` обязателен, если настроено больше одного канала.
- Если настроен ровно один канал, он становится значением по умолчанию.
- Значения: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (для Mattermost требуется Plugin)
- `openclaw message` сопоставляет выбранный канал с его владельцем-Plugin, когда указан `--channel` или цель с префиксом канала; иначе загружает настроенные Plugin каналов для вывода канала по умолчанию.

Форматы целей (`--target`):

- WhatsApp: E.164, JID группы или JID канала/рассылки WhatsApp (`...@newsletter`)
- Telegram: id чата, `@username` или цель темы форума (`-1001234567890:topic:42` либо `--thread-id 42`)
- Discord: `channel:<id>` или `user:<id>` (или упоминание `<@id>`; необработанные числовые id считаются каналами)
- Google Chat: `spaces/<spaceId>` или `users/<userId>`
- Slack: `channel:<id>` или `user:<id>` (необработанный id канала принимается)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` или `@username` (id без префикса считаются каналами)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` или `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` или `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` или `#alias:server`
- Microsoft Teams: id беседы (`19:...@thread.tacv2`), `conversation:<id>` или `user:<aad-object-id>`

Поиск по имени:

- Для поддерживаемых провайдеров (Discord/Slack/и т. д.) имена каналов вроде `Help` или `#help` сопоставляются через кэш каталога.
- При промахе кэша OpenClaw попытается выполнить живой поиск в каталоге, если провайдер это поддерживает.

## Общие флаги

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (целевой канал или пользователь для send/poll/read/и т. д.)
- `--targets <name>` (повторяется; только широковещательная отправка)
- `--json`
- `--dry-run`
- `--verbose`

## Поведение SecretRef

- `openclaw message` разрешает поддерживаемые SecretRef каналов перед выполнением выбранного действия.
- Разрешение по возможности ограничивается активной целью действия:
  - область канала, когда задан `--channel` (или выведен из целей с префиксом, например `discord:...`)
  - область аккаунта, когда задан `--account` (глобальные значения канала + поверхности выбранного аккаунта)
  - когда `--account` не указан, OpenClaw не принудительно использует область SecretRef аккаунта `default`
- Неразрешенные SecretRef на несвязанных каналах не блокируют целевое действие сообщения.
- Если SecretRef выбранного канала/аккаунта не разрешен, команда для этого действия завершится закрытым отказом.

## Действия

### Основные

- `send`
  - Каналы: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Обязательно: `--target`, плюс `--message`, `--media` или `--presentation`
  - Необязательно: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Общие полезные нагрузки представления: `--presentation` отправляет семантические блоки (`text`, `context`, `divider`, `buttons`, `select`), которые ядро отображает через объявленные возможности выбранного канала. См. [Представление сообщений](/ru/plugins/message-presentation).
  - Общие предпочтения доставки: `--delivery` принимает подсказки доставки, например `{ "pin": true }`; `--pin` — сокращение для закрепленной доставки, если канал это поддерживает.
  - Telegram + WhatsApp: `--force-document` (отправлять изображения, GIF и видео как документы, чтобы избежать сжатия каналом)
  - Только Telegram: `--thread-id` (id темы форума)
  - Только Slack: `--thread-id` (временная метка темы; `--reply-to` использует то же поле)
  - Telegram + Discord: `--silent`
  - Только WhatsApp: `--gif-playback`; каналы/рассылки WhatsApp адресуются их собственным JID `@newsletter`.

- `poll`
  - Каналы: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Обязательно: `--target`, `--poll-question`, `--poll-option` (повторяется)
  - Необязательно: `--poll-multi`
  - Только Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Только Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Каналы: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - Обязательно: `--message-id`, `--target`
  - Необязательно: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Примечание: `--remove` требует `--emoji` (опустите `--emoji`, чтобы очистить собственные реакции там, где это поддерживается; см. /tools/reactions)
  - Только WhatsApp: `--participant`, `--from-me`
  - Реакции группы Signal: требуется `--target-author` или `--target-author-uuid`
  - Nextcloud Talk: только добавление реакций; `--remove` отклоняется с понятной ошибкой (см. /tools/reactions)

- `reactions`
  - Каналы: Discord/Google Chat/Slack/Matrix
  - Обязательно: `--message-id`, `--target`
  - Необязательно: `--limit`

- `read`
  - Каналы: Discord/Slack/Matrix
  - Обязательно: `--target`
  - Необязательно: `--limit`, `--message-id`, `--before`, `--after`
  - Только Slack: `--message-id` читает конкретную временную метку сообщения Slack; объедините с `--thread-id`, чтобы прочитать точный ответ в теме.
  - Только Discord: `--around`

- `edit`
  - Каналы: Discord/Slack/Matrix
  - Обязательно: `--message-id`, `--message`, `--target`

- `delete`
  - Каналы: Discord/Slack/Telegram/Matrix
  - Обязательно: `--message-id`, `--target`

- `pin` / `unpin`
  - Каналы: Discord/Slack/Matrix
  - Обязательно: `--message-id`, `--target`

- `pins` (список)
  - Каналы: Discord/Slack/Matrix
  - Обязательно: `--target`

- `permissions`
  - Каналы: Discord/Matrix
  - Обязательно: `--target`
  - Только Matrix: доступно, когда шифрование Matrix включено и действия проверки разрешены

- `search`
  - Каналы: Discord
  - Обязательно: `--guild-id`, `--query`
  - Необязательно: `--channel-id`, `--channel-ids` (повторяется), `--author-id`, `--author-ids` (повторяется), `--limit`

### Темы

- `thread create`
  - Каналы: Discord
  - Обязательно: `--thread-name`, `--target` (id канала)
  - Необязательно: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Каналы: Discord
  - Обязательно: `--guild-id`
  - Необязательно: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Каналы: Discord
  - Обязательно: `--target` (id темы), `--message`
  - Необязательно: `--media`, `--reply-to`

### Эмодзи

- `emoji list`
  - Discord: `--guild-id`
  - Slack: без дополнительных флагов

- `emoji upload`
  - Каналы: Discord
  - Обязательно: `--guild-id`, `--emoji-name`, `--media`
  - Необязательно: `--role-ids` (повторяется)

### Стикеры

- `sticker send`
  - Каналы: Discord
  - Обязательно: `--target`, `--sticker-id` (повторяется)
  - Необязательно: `--message`

- `sticker upload`
  - Каналы: Discord
  - Обязательно: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Роли / Каналы / Участники / Голос

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` для Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### События

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Необязательно: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Модерация (Discord)

- `timeout`: `--guild-id`, `--user-id` (необязательно `--duration-min` или `--until`; опустите оба параметра, чтобы снять тайм-аут)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` также поддерживает `--reason`

### Рассылка

- `broadcast`
  - Каналы: любой настроенный канал; используйте `--channel all`, чтобы выбрать все провайдеры
  - Обязательно: `--targets <target...>`
  - Необязательно: `--message`, `--media`, `--dry-run`

## Примеры

Отправить ответ в Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Отправить сообщение с семантическими кнопками:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Core отображает тот же payload `presentation` в компоненты Discord, блоки Slack, встроенные кнопки Telegram, свойства Mattermost или карточки Teams/Feishu в зависимости от возможностей канала. Полный контракт и правила fallback см. в разделе [Представление сообщений](/ru/plugins/message-presentation).

Отправить более насыщенный payload представления:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Создать опрос в Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Создать опрос в Telegram (автоматическое закрытие через 2 минуты):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Отправить проактивное сообщение Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Создать опрос Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Поставить реакцию в Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Поставить реакцию в группе Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Отправить встроенные кнопки Telegram через универсальное представление:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Отправить кнопку Telegram Mini App через универсальное представление:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Кнопки веб-приложений Telegram поддерживаются только в приватных чатах между пользователем и
ботом. Старые payload JSON с `web_app` по-прежнему разбираются, но `webApp` является
каноническим полем представления.

Отправить карточку Teams через универсальное представление:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Отправить изображение Telegram или WhatsApp как документ, чтобы избежать сжатия:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## См. также

- [Справочник CLI](/ru/cli)
- [Отправка агентом](/ru/tools/agent-send)
