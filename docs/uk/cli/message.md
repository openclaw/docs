---
read_when:
    - Додавання або змінення дій CLI для повідомлень
    - Зміна поведінки вихідного каналу
summary: Довідник CLI для `openclaw message` (надсилання + дії каналу)
title: Повідомлення
x-i18n:
    generated_at: "2026-07-12T13:05:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Єдина команда для надсилання вихідних повідомлень і виконання дій у каналах
Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams,
Signal, Slack, Telegram і WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Вибір каналу

- `--channel <name>` є обов’язковим, якщо налаштовано більше одного каналу; якщо
  налаштовано рівно один канал, він використовується за замовчуванням.
- Значення: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (для Mattermost потрібен Plugin).
- Цілі з префіксом каналу (наприклад, `discord:channel:123`) визначають
  Plugin-власник без явного зазначення `--channel`.

## Формати цілей (`-t, --target`)

| Канал               | Формат                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, згадка `<@id>` або лише числовий ідентифікатор (вважається ідентифікатором каналу)           |
| Google Chat         | `spaces/<spaceId>` або `users/<userId>`                                                                                   |
| iMessage            | дескриптор, `chat_id:<id>`, `chat_guid:<guid>` або `chat_identifier:<id>`                                                 |
| Mattermost (Plugin) | `channel:<id>`, `user:<id>`, `@username` або лише ідентифікатор (вважається каналом)                                      |
| Matrix              | `@user:server`, `!room:server` або `#alias:server`                                                                         |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), лише ідентифікатор розмови або `user:<aad-object-id>`                        |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` або будь-який із цих варіантів із префіксом `signal:`   |
| Slack               | `channel:<id>` або `user:<id>` (лише ідентифікатор вважається каналом)                                                    |
| Telegram            | ідентифікатор чату, `@username` або ціль теми форуму: `<chatId>:topic:<topicId>` (чи `--thread-id <topicId>`)             |
| WhatsApp            | E.164, JID групи (`...@g.us`) або JID каналу/розсилки (`...@newsletter`)                                                   |

Пошук за назвою каналу: для постачальників із каталогом (Discord/Slack тощо)
назви на кшталт `Help` або `#help` визначаються за кешем каталогу, а якщо
відповідного запису в кеші немає — виконується пошук у каталозі наживо, якщо
постачальник це підтримує.

## Спільні прапорці

Кожна дія приймає: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Дії, які потребують місця призначення, також
приймають `-t, --target <dest>`.

## Визначення SecretRef

`openclaw message` визначає SecretRef каналів перед виконанням дії,
обмежуючи область якомога точніше:

- каналом, коли задано `--channel` (або його визначено з цілі з префіксом);
- обліковим записом, коли також задано `--account`;
- усіма налаштованими каналами, коли не задано жодного з них.

Невизначені SecretRef у непов’язаних каналах ніколи не блокують цільову дію;
невизначений SecretRef у вибраному каналі чи обліковому записі спричиняє
безпечну відмову дії.

## Дії

### Основні

| Дія             | Канали                                                                                                          | Обов’язкові параметри                                          | Примітки                                                                                                                                                                                                                                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target` і один із `--message`/`--media`/`--presentation`    | Див. розділ [Надсилання](#send) нижче.                                                                                                                                                                                                                                                                                                        |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (повторюваний)  | Див. розділ [Опитування](#poll) нижче.                                                                                                                                                                                                                                                                                                        |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (потребує `--emoji`; не вказуйте його, щоб очистити власні реакції там, де це підтримується; див. [Реакції](/uk/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Для реакцій у групах Signal потрібен `--target-author` або `--target-author-uuid`. Nextcloud Talk лише додає реакції; `--remove` спричиняє помилку. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                    |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` читає повідомлення з певною часовою позначкою; поєднайте з `--thread-id`, щоб отримати точну відповідь у гілці.                                                                                                                     |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Для гілок форуму Telegram використовуйте `--thread-id`.                                                                                                                                                                                                                                                                                       |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                                                              |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` також приймає `--pinned-message-id` (Microsoft Teams: ідентифікатор ресурсу закріплення/списку закріплених повідомлень, а не ідентифікатор повідомлення чату).                                                                                                                                                                           |
| `pins` (список) | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                    |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: доступно лише тоді, коли шифрування ввімкнено, а дії перевірки дозволено.                                                                                                                                                                                                                                                             |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (повторюваний), `--author-id`, `--author-ids` (повторюваний), `--limit`.                                                                                                                                                                                                                                      |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                                                       |

### Надсилання

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: прикріпити зображення, аудіо, відео або документ
  (локальний шлях чи URL).
- `--presentation <json>`: спільне корисне навантаження з блоками `text`,
  `context`, `divider`, `chart`, `table`, `buttons` і `select`, яке
  відтворюється відповідно до можливостей каналу. Див.
  [Представлення повідомлень](/uk/plugins/message-presentation).
- `--delivery <json>`: загальні параметри доставлення, наприклад `{"pin":
true}`. `--pin` — скорочений запис для закріпленого доставлення, якщо канал
  його підтримує.
- `--reply-to <id>`, `--thread-id <id>` (тема форуму Telegram; часова позначка
  гілки Slack, те саме поле, що й `--reply-to`).
- `--force-document` (Telegram, WhatsApp): надсилати зображення, GIF-файли та
  відео як документи, щоб уникнути стиснення каналом.
- `--silent` (Telegram, Discord): надсилати без сповіщення.
- `--gif-playback` (лише WhatsApp): відтворювати відеомедіа як GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack відтворює підтримувані блоки діаграм у нативному вигляді; інші канали
отримують ті самі дані у вигляді читабельного тексту:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack також нативно відображає явні табличні блоки. Інші канали отримують
підпис і кожен рядок як детермінований текст:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Кнопки мініпрограм Telegram використовують `webApp` (`web_app` досі розпізнається для застарілого
JSON) і відображаються лише в приватних чатах між користувачем і ботом:

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### Опитування

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: повторіть від 2 до 12 разів.
- `--poll-multi`: дозволяє вибирати кілька варіантів.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5–600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### Гілки

- `thread create`: канали Discord. Обов’язкові: `--thread-name`, `--target`
  (ідентифікатор каналу). Необов’язкові: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: канали Discord. Обов’язковий: `--guild-id`. Необов’язкові:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: канали Discord. Обов’язкові: `--target` (ідентифікатор гілки),
  `--message`. Необов’язкові: `--media`, `--reply-to`.

### Емодзі

- `emoji list`: Discord (`--guild-id`), Slack (без додаткових прапорців).
- `emoji upload`: Discord. Обов’язкові: `--guild-id`, `--emoji-name`, `--media`.
  Необов’язковий: `--role-ids` (можна повторювати).

### Стікери

- `sticker send`: Discord. Обов’язкові: `--target`, `--sticker-id` (можна повторювати).
  Необов’язковий: `--message`.
- `sticker upload`: Discord. Обов’язкові: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Ролі, канали, голосові функції та події (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: обов’язкові `--guild-id`, `--event-name`, `--start-time`;
  необов’язкові `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Модерація (Discord)

- `timeout`: `--guild-id`, `--user-id`; необов’язкові `--duration-min` або
  `--until` (не вказуйте жоден із них, щоб скасувати обмеження), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Розсилка

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Надсилає одні й ті самі дані кільком адресатам. `--targets` приймає розділений пробілами
список. Використовуйте `--channel all`, щоб охопити всіх налаштованих постачальників.

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Надсилання агентом](/uk/tools/agent-send)
- [Подання повідомлень](/uk/plugins/message-presentation)
