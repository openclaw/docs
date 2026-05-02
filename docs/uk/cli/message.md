---
read_when:
    - Додавання або змінення дій CLI для повідомлень
    - Зміна поведінки вихідного каналу
summary: Довідник CLI для `openclaw message` (send + дії каналу)
title: Повідомлення
x-i18n:
    generated_at: "2026-05-02T02:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: f429acc2c81f33d1ade543ab1170220e293077e1d1721ac0940937de3d19f0d2
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Єдина вихідна команда для надсилання повідомлень і дій каналів
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Використання

```
openclaw message <subcommand> [flags]
```

Вибір каналу:

- `--channel` обов’язковий, якщо налаштовано більше ніж один канал.
- Якщо налаштовано рівно один канал, він стає типовим.
- Значення: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost вимагає plugin)
- `openclaw message` зіставляє вибраний канал із Plugin, якому він належить, коли наявний `--channel` або ціль із префіксом каналу; інакше завантажує налаштовані Plugin каналів для визначення типового каналу.

Формати цілі (`--target`):

- WhatsApp: E.164 або JID групи
- Telegram: id чату або `@username`
- Discord: `channel:<id>` або `user:<id>` (або згадка `<@id>`; необроблені числові id вважаються каналами)
- Google Chat: `spaces/<spaceId>` або `users/<userId>`
- Slack: `channel:<id>` або `user:<id>` (необроблений id каналу приймається)
- Mattermost (plugin): `channel:<id>`, `user:<id>` або `@username` (id без префікса вважаються каналами)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` або `username:<name>`/`u:<name>`
- iMessage: дескриптор, `chat_id:<id>`, `chat_guid:<guid>` або `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` або `#alias:server`
- Microsoft Teams: id розмови (`19:...@thread.tacv2`) або `conversation:<id>` чи `user:<aad-object-id>`

Пошук за назвою:

- Для підтримуваних провайдерів (Discord/Slack/тощо) назви каналів, як-от `Help` або `#help`, зіставляються через кеш каталогу.
- У разі промаху кешу OpenClaw спробує виконати живий пошук у каталозі, якщо провайдер це підтримує.

## Поширені прапорці

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (цільовий канал або користувач для send/poll/read/тощо)
- `--targets <name>` (повторюваний; лише трансляція)
- `--json`
- `--dry-run`
- `--verbose`

## Поведінка SecretRef

- `openclaw message` розв’язує підтримувані SecretRefs каналів перед запуском вибраної дії.
- Розв’язання, коли можливо, обмежується активною ціллю дії:
  - у межах каналу, коли встановлено `--channel` (або виведено з цілей із префіксом, як-от `discord:...`)
  - у межах облікового запису, коли встановлено `--account` (глобальні поверхні каналу + поверхні вибраного облікового запису)
  - коли `--account` пропущено, OpenClaw не примушує область SecretRef облікового запису `default`
- Нерозв’язані SecretRefs у непов’язаних каналах не блокують цільову дію з повідомленням.
- Якщо SecretRef вибраного каналу/облікового запису не розв’язано, команда для цієї дії завершується із закритою відмовою.

## Дії

### Ядро

- `send`
  - Канали: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Обов’язково: `--target`, а також `--message`, `--media` або `--presentation`
  - Необов’язково: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Спільні payload презентації: `--presentation` надсилає семантичні блоки (`text`, `context`, `divider`, `buttons`, `select`), які ядро рендерить через оголошені можливості вибраного каналу. Див. [Презентація повідомлень](/uk/plugins/message-presentation).
  - Загальні налаштування доставки: `--delivery` приймає підказки доставки, як-от `{ "pin": true }`; `--pin` є скороченням для закріпленої доставки, коли канал це підтримує.
  - Лише Telegram: `--force-document` (надсилати зображення та GIF як документи, щоб уникнути стиснення Telegram)
  - Лише Telegram: `--thread-id` (id теми форуму)
  - Лише Slack: `--thread-id` (мітка часу потоку; `--reply-to` використовує те саме поле)
  - Telegram + Discord: `--silent`
  - Лише WhatsApp: `--gif-playback`

- `poll`
  - Канали: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Обов’язково: `--target`, `--poll-question`, `--poll-option` (повторюваний)
  - Необов’язково: `--poll-multi`
  - Лише Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Лише Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Канали: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Обов’язково: `--message-id`, `--target`
  - Необов’язково: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Примітка: `--remove` вимагає `--emoji` (пропустіть `--emoji`, щоб очистити власні реакції там, де це підтримується; див. /tools/reactions)
  - Лише WhatsApp: `--participant`, `--from-me`
  - Реакції в групах Signal: потрібен `--target-author` або `--target-author-uuid`

- `reactions`
  - Канали: Discord/Google Chat/Slack/Matrix
  - Обов’язково: `--message-id`, `--target`
  - Необов’язково: `--limit`

- `read`
  - Канали: Discord/Slack/Matrix
  - Обов’язково: `--target`
  - Необов’язково: `--limit`, `--message-id`, `--before`, `--after`
  - Лише Slack: `--message-id` читає конкретну мітку часу повідомлення Slack; поєднуйте з `--thread-id`, щоб прочитати точну відповідь у потоці.
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
  - Лише Matrix: доступно, коли ввімкнено шифрування Matrix і дозволено дії перевірки

- `search`
  - Канали: Discord
  - Обов’язково: `--guild-id`, `--query`
  - Необов’язково: `--channel-id`, `--channel-ids` (повторюваний), `--author-id`, `--author-ids` (повторюваний), `--limit`

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

### Емодзі

- `emoji list`
  - Discord: `--guild-id`
  - Slack: без додаткових прапорців

- `emoji upload`
  - Канали: Discord
  - Обов’язково: `--guild-id`, `--emoji-name`, `--media`
  - Необов’язково: `--role-ids` (повторюваний)

### Стікери

- `sticker send`
  - Канали: Discord
  - Обов’язково: `--target`, `--sticker-id` (повторюваний)
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

### Трансляція

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

Ядро рендерить той самий payload `presentation` у компоненти Discord, блоки Slack, вбудовані кнопки Telegram, props Mattermost або картки Teams/Feishu залежно від можливостей каналу. Див. [Презентація повідомлень](/uk/plugins/message-presentation), щоб переглянути повний контракт і правила fallback.

Надіслати багатший payload презентації:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Створити опитування Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Створити опитування Telegram (автоматично закриється за 2 хвилини):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Надіслати проактивне повідомлення Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Створити опитування Teams:

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

Надіслати вбудовані кнопки Telegram через загальну презентацію:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Надіслати картку Teams через загальну презентацію:

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

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Надсилання агента](/uk/tools/agent-send)
