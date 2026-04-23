---
read_when:
    - Додавання або змінення дій CLI для повідомлень
    - Зміна поведінки вихідного каналу
summary: Довідка CLI для `openclaw message` (надсилання + дії каналу)
title: повідомлення
x-i18n:
    generated_at: "2026-04-23T06:18:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Єдина вихідна команда для надсилання повідомлень і дій каналу
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Використання

```
openclaw message <subcommand> [flags]
```

Вибір каналу:

- `--channel` обов’язковий, якщо налаштовано більше ніж один канал.
- Якщо налаштовано рівно один канал, він стає типовим.
- Значення: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost потребує Plugin)

Формати цілі (`--target`):

- WhatsApp: E.164 або JID групи
- Telegram: id чату або `@username`
- Discord: `channel:<id>` або `user:<id>` (або згадка `<@id>`; необроблені числові id трактуються як канали)
- Google Chat: `spaces/<spaceId>` або `users/<userId>`
- Slack: `channel:<id>` або `user:<id>` (необроблений id каналу приймається)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` або `@username` (id без префікса трактуються як канали)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` або `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` або `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` або `#alias:server`
- Microsoft Teams: id розмови (`19:...@thread.tacv2`) або `conversation:<id>` чи `user:<aad-object-id>`

Пошук за назвою:

- Для підтримуваних провайдерів (Discord/Slack/тощо) назви каналів, як-от `Help` або `#help`, розв’язуються через кеш каталогу.
- Якщо в кеші немає збігу, OpenClaw спробує виконати live-пошук у каталозі, якщо провайдер це підтримує.

## Загальні прапорці

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (цільовий канал або користувач для send/poll/read/тощо)
- `--targets <name>` (повторюється; лише для broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Поведінка SecretRef

- `openclaw message` розв’язує підтримувані SecretRef каналу перед виконанням вибраної дії.
- Розв’язання, коли це можливо, обмежується ціллю активної дії:
  - на рівні каналу, коли задано `--channel` (або його виведено з цілей із префіксом на кшталт `discord:...`)
  - на рівні облікового запису, коли задано `--account` (глобальні поверхні каналу + поверхні вибраного облікового запису)
  - коли `--account` пропущено, OpenClaw не примушує область SecretRef облікового запису `default`
- Нерозв’язані SecretRef у не пов’язаних каналах не блокують цільову дію повідомлення.
- Якщо SecretRef вибраного каналу/облікового запису не розв’язано, команда для цієї дії завершується за принципом fail closed.

## Дії

### Ядро

- `send`
  - Канали: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Обов’язково: `--target`, а також `--message`, `--media` або `--presentation`
  - Необов’язково: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Спільні корисні навантаження presentation: `--presentation` надсилає семантичні блоки (`text`, `context`, `divider`, `buttons`, `select`), які ядро рендерить через оголошені можливості вибраного каналу. Див. [Презентація повідомлень](/uk/plugins/message-presentation).
  - Узагальнені налаштування доставки: `--delivery` приймає підказки доставки, як-от `{ "pin": true }`; `--pin` — це скорочення для закріпленої доставки, коли канал це підтримує.
  - Лише Telegram: `--force-document` (надсилати зображення та GIF як документи, щоб уникнути стиснення Telegram)
  - Лише Telegram: `--thread-id` (id теми форуму)
  - Лише Slack: `--thread-id` (timestamp потоку; `--reply-to` використовує те саме поле)
  - Telegram + Discord: `--silent`
  - Лише WhatsApp: `--gif-playback`

- `poll`
  - Канали: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Обов’язково: `--target`, `--poll-question`, `--poll-option` (повторюється)
  - Необов’язково: `--poll-multi`
  - Лише Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Лише Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Канали: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Обов’язково: `--message-id`, `--target`
  - Необов’язково: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Примітка: `--remove` потребує `--emoji` (пропустіть `--emoji`, щоб очистити власні реакції там, де це підтримується; див. /tools/reactions)
  - Лише WhatsApp: `--participant`, `--from-me`
  - Реакції в групах Signal: обов’язково `--target-author` або `--target-author-uuid`

- `reactions`
  - Канали: Discord/Google Chat/Slack/Matrix
  - Обов’язково: `--message-id`, `--target`
  - Необов’язково: `--limit`

- `read`
  - Канали: Discord/Slack/Matrix
  - Обов’язково: `--target`
  - Необов’язково: `--limit`, `--before`, `--after`
  - Лише Discord: `--around`

- `edit`
  - Канали: Discord/Slack/Matrix
  - Обов’язково: `--message-id`, `--message`, `--target`

- `delete`
  - Канали: Discord/Slack/Telegram/Matrix
  - Обов’язково: `--message-id`, `--target`

- `pin` / `unpin`
  - Канали: Discord/Slack/Matrix
  - Обов’язково: `--message-id`, `--target`

- `pins` (список)
  - Канали: Discord/Slack/Matrix
  - Обов’язково: `--target`

- `permissions`
  - Канали: Discord/Matrix
  - Обов’язково: `--target`
  - Лише Matrix: доступно, коли ввімкнено шифрування Matrix і дозволено дії верифікації

- `search`
  - Канали: Discord
  - Обов’язково: `--guild-id`, `--query`
  - Необов’язково: `--channel-id`, `--channel-ids` (повторюється), `--author-id`, `--author-ids` (повторюється), `--limit`

### Потоки

- `thread create`
  - Канали: Discord
  - Обов’язково: `--thread-name`, `--target` (id каналу)
  - Необов’язково: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Канали: Discord
  - Обов’язково: `--guild-id`
  - Необов’язково: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Канали: Discord
  - Обов’язково: `--target` (id потоку), `--message`
  - Необов’язково: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: без додаткових прапорців

- `emoji upload`
  - Канали: Discord
  - Обов’язково: `--guild-id`, `--emoji-name`, `--media`
  - Необов’язково: `--role-ids` (повторюється)

### Наліпки

- `sticker send`
  - Канали: Discord
  - Обов’язково: `--target`, `--sticker-id` (повторюється)
  - Необов’язково: `--message`

- `sticker upload`
  - Канали: Discord
  - Обов’язково: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Ролі / Канали / Учасники / Голос

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` для Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Події

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Необов’язково: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Модерація (Discord)

- `timeout`: `--guild-id`, `--user-id` (необов’язково `--duration-min` або `--until`; пропустіть обидва, щоб очистити timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` також підтримує `--reason`

### Broadcast

- `broadcast`
  - Канали: будь-який налаштований канал; використовуйте `--channel all`, щоб націлитися на всіх провайдерів
  - Обов’язково: `--targets <target...>`
  - Необов’язково: `--message`, `--media`, `--dry-run`

## Приклади

Надіслати відповідь у Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Надіслати повідомлення із семантичними кнопками:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Ядро рендерить те саме корисне навантаження `presentation` у компоненти Discord, блоки Slack, вбудовані кнопки Telegram, props Mattermost або картки Teams/Feishu залежно від можливостей каналу. Повний контракт і правила резервного відображення див. у [Презентація повідомлень](/uk/plugins/message-presentation).

Надіслати розширене корисне навантаження presentation:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Створити опитування в Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Створити опитування в Telegram (автозакриття через 2 хвилини):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Надіслати проактивне повідомлення в Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Створити опитування в Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Додати реакцію в Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Додати реакцію в групі Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Надіслати вбудовані кнопки Telegram через узагальнену presentation:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Надіслати картку Teams через узагальнену presentation:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Надіслати зображення Telegram як документ, щоб уникнути стиснення:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
