---
read_when:
    - Додавання або змінення дій CLI для повідомлень
    - Зміна поведінки вихідного каналу
summary: Довідник CLI для `openclaw message` (send + дії каналу)
title: Повідомлення
x-i18n:
    generated_at: "2026-06-27T17:21:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Єдина вихідна команда для надсилання повідомлень і дій каналів
(Discord/Google Chat/iMessage/Matrix/Mattermost (плагін)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Використання

```
openclaw message <subcommand> [flags]
```

Вибір каналу:

- `--channel` обов’язковий, якщо налаштовано більше ніж один канал.
- Якщо налаштовано рівно один канал, він стає типовим.
- Значення: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost потребує плагін)
- `openclaw message` зіставляє вибраний канал із його плагіном-власником, коли наявний `--channel` або ціль із префіксом каналу; інакше завантажує налаштовані плагіни каналів для визначення типового каналу.

Формати цілі (`--target`):

- WhatsApp: E.164, груповий JID або JID каналу/розсилки WhatsApp (`...@newsletter`)
- Telegram: ідентифікатор чату, `@username` або ціль теми форуму (`-1001234567890:topic:42` або `--thread-id 42`)
- Discord: `channel:<id>` або `user:<id>` (або згадка `<@id>`; необроблені числові ідентифікатори трактуються як канали)
- Google Chat: `spaces/<spaceId>` або `users/<userId>`
- Slack: `channel:<id>` або `user:<id>` (необроблений ідентифікатор каналу приймається)
- Mattermost (плагін): `channel:<id>`, `user:<id>` або `@username` (ідентифікатори без префікса трактуються як канали)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` або `username:<name>`/`u:<name>`
- iMessage: дескриптор, `chat_id:<id>`, `chat_guid:<guid>` або `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` або `#alias:server`
- Microsoft Teams: ідентифікатор розмови (`19:...@thread.tacv2`) або `conversation:<id>` чи `user:<aad-object-id>`

Пошук за назвою:

- Для підтримуваних провайдерів (Discord/Slack тощо) назви каналів на кшталт `Help` або `#help` зіставляються через кеш каталогу.
- У разі промаху кешу OpenClaw спробує виконати оперативний пошук у каталозі, якщо провайдер це підтримує.

## Поширені прапорці

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (цільовий канал або користувач для send/poll/read тощо)
- `--targets <name>` (повторюється; лише трансляція)
- `--json`
- `--dry-run`
- `--verbose`

## Поведінка SecretRef

- `openclaw message` зіставляє підтримувані SecretRefs каналів перед виконанням вибраної дії.
- Зіставлення за можливості обмежується активною ціллю дії:
  - у межах каналу, коли встановлено `--channel` (або визначено з префіксних цілей на кшталт `discord:...`)
  - у межах облікового запису, коли встановлено `--account` (глобальні параметри каналу + поверхні вибраного облікового запису)
  - коли `--account` пропущено, OpenClaw не примусово застосовує область SecretRef облікового запису `default`
- Нерозв’язані SecretRefs у непов’язаних каналах не блокують цільову дію повідомлення.
- Якщо SecretRef вибраного каналу/облікового запису не розв’язано, команда завершується закрито для цієї дії.

## Дії

### Основне

- `send`
  - Канали: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (плагін)/Signal/iMessage/Matrix/Microsoft Teams
  - Обов’язково: `--target`, а також `--message`, `--media` або `--presentation`
  - Необов’язково: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Спільні презентаційні корисні навантаження: `--presentation` надсилає семантичні блоки (`text`, `context`, `divider`, `buttons`, `select`), які ядро відтворює через оголошені можливості вибраного каналу. Див. [Презентація повідомлень](/uk/plugins/message-presentation).
  - Загальні параметри доставки: `--delivery` приймає підказки доставки, як-от `{ "pin": true }`; `--pin` є скороченням для закріпленої доставки, якщо канал це підтримує.
  - Telegram + WhatsApp: `--force-document` (надсилати зображення, GIF-файли й відео як документи, щоб уникнути стиснення каналом)
  - Лише Telegram: `--thread-id` (ідентифікатор теми форуму)
  - Лише Slack: `--thread-id` (мітка часу треду; `--reply-to` використовує те саме поле)
  - Telegram + Discord: `--silent`
  - Лише WhatsApp: `--gif-playback`; канали/розсилки WhatsApp адресуються їхнім нативним JID `@newsletter`.

- `poll`
  - Канали: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Обов’язково: `--target`, `--poll-question`, `--poll-option` (повторюється)
  - Необов’язково: `--poll-multi`
  - Лише Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Лише Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Канали: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - Обов’язково: `--message-id`, `--target`
  - Необов’язково: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Примітка: `--remove` потребує `--emoji` (пропустіть `--emoji`, щоб очистити власні реакції там, де це підтримується; див. /tools/reactions)
  - Лише WhatsApp: `--participant`, `--from-me`
  - Реакції груп Signal: потрібно `--target-author` або `--target-author-uuid`
  - Nextcloud Talk: лише додавання реакцій; `--remove` відхиляється з чіткою помилкою (див. /tools/reactions)

- `reactions`
  - Канали: Discord/Google Chat/Slack/Matrix
  - Обов’язково: `--message-id`, `--target`
  - Необов’язково: `--limit`

- `read`
  - Канали: Discord/Slack/Matrix
  - Обов’язково: `--target`
  - Необов’язково: `--limit`, `--message-id`, `--before`, `--after`
  - Лише Slack: `--message-id` читає конкретну мітку часу повідомлення Slack; поєднайте з `--thread-id`, щоб прочитати точну відповідь у треді.
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
  - Необов’язково: `--channel-id`, `--channel-ids` (повторюється), `--author-id`, `--author-ids` (повторюється), `--limit`

### Треди

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
  - Обов’язково: `--target` (ідентифікатор треду), `--message`
  - Необов’язково: `--media`, `--reply-to`

### Емодзі

- `emoji list`
  - Discord: `--guild-id`
  - Slack: без додаткових прапорців

- `emoji upload`
  - Канали: Discord
  - Обов’язково: `--guild-id`, `--emoji-name`, `--media`
  - Необов’язково: `--role-ids` (повторюється)

### Стікери

- `sticker send`
  - Канали: Discord
  - Обов’язково: `--target`, `--sticker-id` (повторюється)
  - Необов’язково: `--message`

- `sticker upload`
  - Канали: Discord
  - Обов’язково: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Ролі / канали / учасники / голосові канали

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` для Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Події

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Необов'язково: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Модерація (Discord)

- `timeout`: `--guild-id`, `--user-id` (необов'язково `--duration-min` або `--until`; пропустіть обидва, щоб скасувати timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` також підтримує `--reason`

### Трансляція

- `broadcast`
  - Канали: будь-який налаштований канал; використовуйте `--channel all`, щоб націлитися на всіх провайдерів
  - Обов'язково: `--targets <target...>`
  - Необов'язково: `--message`, `--media`, `--dry-run`

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

Ядро відтворює те саме навантаження `presentation` у компоненти Discord, блоки Slack, вбудовані кнопки Telegram, властивості Mattermost або картки Teams/Feishu залежно від можливостей каналу. Повний контракт і правила резервного варіанта див. у [Представлення повідомлень](/uk/plugins/message-presentation).

Надіслати багатше навантаження представлення:

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

Надіслати вбудовані кнопки Telegram через загальне представлення:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Надіслати кнопку Telegram Mini App через загальне представлення:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Кнопки вебзастосунку Telegram підтримуються лише в приватних чатах між користувачем і
ботом. Старіші JSON-навантаження з `web_app` усе ще обробляються, але `webApp` є
канонічним полем представлення.

Надіслати картку Teams через загальне представлення:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Надіслати зображення Telegram або WhatsApp як документ, щоб уникнути стиснення:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Пов'язане

- [Довідник CLI](/uk/cli)
- [Надсилання агентом](/uk/tools/agent-send)
