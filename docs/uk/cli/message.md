---
read_when:
    - Додавання або змінення дій CLI для повідомлень
    - Зміна поведінки вихідного каналу
summary: Довідник CLI для `openclaw message` (надсилання + дії з каналами)
title: Повідомлення
x-i18n:
    generated_at: "2026-05-02T20:13:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b73a50da34838f80ad5d0d266f5c66f95436f8535e6312296ae022918b1ab55
    source_path: cli/message.md
    workflow: 16
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
- `openclaw message` зіставляє вибраний канал із Plugin, якому він належить, коли присутній `--channel` або ціль із префіксом каналу; інакше він завантажує налаштовані Plugin каналів для визначення типового каналу.

Формати цілей (`--target`):

- WhatsApp: E.164, JID групи або JID каналу/розсилки WhatsApp (`...@newsletter`)
- Telegram: ідентифікатор чату або `@username`
- Discord: `channel:<id>` або `user:<id>` (або згадка `<@id>`; необроблені числові ідентифікатори вважаються каналами)
- Google Chat: `spaces/<spaceId>` або `users/<userId>`
- Slack: `channel:<id>` або `user:<id>` (необроблений ідентифікатор каналу приймається)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` або `@username` (ідентифікатори без префікса вважаються каналами)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` або `username:<name>`/`u:<name>`
- iMessage: дескриптор, `chat_id:<id>`, `chat_guid:<guid>` або `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` або `#alias:server`
- Microsoft Teams: ідентифікатор розмови (`19:...@thread.tacv2`) або `conversation:<id>` чи `user:<aad-object-id>`

Пошук за назвою:

- Для підтримуваних провайдерів (Discord/Slack тощо) назви каналів на кшталт `Help` або `#help` зіставляються через кеш каталогу.
- Якщо в кеші немає збігу, OpenClaw спробує виконати живий пошук у каталозі, коли провайдер це підтримує.

## Поширені прапорці

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (цільовий канал або користувач для send/poll/read тощо)
- `--targets <name>` (повторюваний; лише широкомовлення)
- `--json`
- `--dry-run`
- `--verbose`

## Поведінка SecretRef

- `openclaw message` зіставляє підтримувані SecretRefs каналів перед виконанням вибраної дії.
- Зіставлення за можливості обмежується активною ціллю дії:
  - на рівні каналу, коли задано `--channel` (або виведено з цілей із префіксом, як-от `discord:...`)
  - на рівні облікового запису, коли задано `--account` (глобальні поверхні каналу + поверхні вибраного облікового запису)
  - коли `--account` опущено, OpenClaw не примушує область SecretRef типового облікового запису `default`
- Нерозв’язані SecretRefs у непов’язаних каналах не блокують цільову дію повідомлення.
- Якщо SecretRef вибраного каналу/облікового запису не розв’язано, команда завершується закрито для цієї дії.

## Дії

### Ядро

- `send`
  - Канали: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Обов’язково: `--target`, а також `--message`, `--media` або `--presentation`
  - Необов’язково: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Спільні корисні навантаження представлення: `--presentation` надсилає семантичні блоки (`text`, `context`, `divider`, `buttons`, `select`), які ядро рендерить через оголошені можливості вибраного каналу. Див. [Представлення повідомлень](/uk/plugins/message-presentation).
  - Загальні параметри доставки: `--delivery` приймає підказки доставки, як-от `{ "pin": true }`; `--pin` є скороченням для закріпленої доставки, коли канал це підтримує.
  - Лише Telegram: `--force-document` (надсилати зображення та GIF як документи, щоб уникнути стиснення Telegram)
  - Лише Telegram: `--thread-id` (ідентифікатор теми форуму)
  - Лише Slack: `--thread-id` (часова мітка гілки; `--reply-to` використовує те саме поле)
  - Telegram + Discord: `--silent`
  - Лише WhatsApp: `--gif-playback`; канали/розсилки WhatsApp адресуються їхнім нативним JID `@newsletter`.

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
  - Примітка: `--remove` потребує `--emoji` (опустіть `--emoji`, щоб очистити власні реакції там, де це підтримується; див. /tools/reactions)
  - Лише WhatsApp: `--participant`, `--from-me`
  - Реакції групи Signal: потрібен `--target-author` або `--target-author-uuid`

- `reactions`
  - Канали: Discord/Google Chat/Slack/Matrix
  - Обов’язково: `--message-id`, `--target`
  - Необов’язково: `--limit`

- `read`
  - Канали: Discord/Slack/Matrix
  - Обов’язково: `--target`
  - Необов’язково: `--limit`, `--message-id`, `--before`, `--after`
  - Лише Slack: `--message-id` читає конкретну часову мітку повідомлення Slack; поєднайте з `--thread-id`, щоб прочитати точну відповідь у гілці.
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
  - Лише Matrix: доступно, коли шифрування Matrix увімкнено і дії перевірки дозволені

- `search`
  - Канали: Discord
  - Обов’язково: `--guild-id`, `--query`
  - Необов’язково: `--channel-id`, `--channel-ids` (повторюваний), `--author-id`, `--author-ids` (повторюваний), `--limit`

### Гілки

- `thread create`
  - Канали: Discord
  - Обов’язково: `--thread-name`, `--target` (ідентифікатор каналу)
  - Необов’язково: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Канали: Discord
  - Обов’язково: `--guild-id`
  - Необов’язково: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Канали: Discord
  - Обов’язково: `--target` (ідентифікатор гілки), `--message`
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

- `timeout`: `--guild-id`, `--user-id` (необов’язково `--duration-min` або `--until`; опустіть обидва, щоб очистити timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` також підтримує `--reason`

### Широкомовлення

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

Ядро рендерить те саме корисне навантаження `presentation` у компоненти Discord, блоки Slack, вбудовані кнопки Telegram, властивості Mattermost або картки Teams/Feishu залежно від можливостей каналу. Повний контракт і правила резервного варіанта див. у [Представлення повідомлень](/uk/plugins/message-presentation).

Надіслати багатше корисне навантаження представлення:

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

Створити опитування Telegram (автоматичне закриття через 2 хвилини):

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

Відреагувати у Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Відреагувати в групі Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Надіслати вбудовані кнопки Telegram через загальне представлення:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Надіслати картку Teams через загальне представлення:

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

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Надсилання агентом](/uk/tools/agent-send)
