---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити статус каналу або переглянути журнали каналу в реальному часі
summary: Довідник CLI для `openclaw channels` (облікові записи, статус, вхід/вихід, журнали)
title: Канали
x-i18n:
    generated_at: "2026-04-27T06:23:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a62e5a9d4425923097ee9a7aa61ab3795bac84709ddaab5990bacde3096f41f
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Керуйте обліковими записами чат-каналів і станом їх runtime у Gateway.

Пов’язана документація:

- Посібники з каналів: [Канали](/uk/channels)
- Конфігурація Gateway: [Конфігурація](/uk/gateway/configuration)

## Поширені команди

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Статус / можливості / зіставлення / журнали

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (лише з `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — це live-шлях: на доступному gateway він запускає для кожного облікового запису перевірки `probeAccount` і, за потреби, `auditAccount`, тож вивід може містити стан транспорту, а також результати перевірки, наприклад `works`, `probe failed`, `audit ok` або `audit failed`.
Якщо gateway недоступний, `channels status` повертається до зведень лише на основі конфігурації, а не до виводу live-перевірки.

## Додавання / видалення облікових записів

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` показує прапорці для кожного каналу (token, private key, app token, шляхи signal-cli тощо).
</Tip>

Поширені поверхні неінтерактивного додавання включають:

- канали з bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для auth на основі env для облікового запису за замовчуванням, де це підтримується

Якщо для канального Plugin потрібне встановлення під час команди додавання через прапорці, OpenClaw використовує типове джерело встановлення цього каналу без відкриття інтерактивного запиту на встановлення plugin.

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- ідентифікатори облікових записів для вибраного каналу
- необов’язкові відображувані імена для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо ви підтвердите прив’язку зараз, майстер запитає, який агент має володіти кожним налаштованим обліковим записом каналу, і запише прив’язки маршрутизації на рівні облікового запису.

Тими самими правилами маршрутизації також можна керувати пізніше за допомогою `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [agents](/uk/cli/agents)).

Коли ви додаєте не типове обліковий запис до каналу, який досі використовує налаштування верхнього рівня для одного облікового запису, OpenClaw переносить значення верхнього рівня, прив’язані до облікового запису, до мапи облікових записів каналу перед записом нового облікового запису. Для більшості каналів ці значення потрапляють до `channels.<channel>.accounts.default`, але вбудовані канали натомість можуть зберегти наявний відповідний перенесений обліковий запис. Поточний приклад — Matrix: якщо вже існує один іменований обліковий запис або `defaultAccount` вказує на наявний іменований обліковий запис, під час перенесення зберігається цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації залишається сталою:

- Наявні прив’язки лише каналу (без `accountId`) і далі відповідають типовому обліковому запису.
- `channels add` не створює й не переписує прив’язки автоматично в неінтерактивному режимі.
- Інтерактивне налаштування за потреби може додати прив’язки на рівні облікового запису.

Якщо ваша конфігурація вже була в змішаному стані (є іменовані облікові записи, а значення верхнього рівня для одного облікового запису все ще задані), запустіть `openclaw doctor --fix`, щоб перенести значення рівня облікового запису до перенесеного облікового запису, вибраного для цього каналу. Більшість каналів переносять до `accounts.default`; Matrix може зберегти наявну іменовану/типову ціль натомість.

## Вхід і вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` підтримує `--verbose`.
- `channels login` і `logout` можуть визначити канал автоматично, якщо налаштовано лише одну підтримувану ціль входу.

## Усунення проблем

- Запустіть `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для керованих виправлень.
- `openclaw channels list` виводить `Claude: HTTP 403 ... user:profile` → знімку використання потрібен scope `user:profile`. Використайте `--no-usage`, або надайте ключ сесії claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), або повторно автентифікуйтеся через Claude CLI.
- `openclaw channels status` повертається до зведень лише на основі конфігурації, коли gateway недоступний. Якщо облікові дані підтримуваного каналу налаштовані через SecretRef, але недоступні в поточному шляху команди, він повідомляє цей обліковий запис як налаштований із примітками про деградацію, а не показує його як неналаштований.

## Перевірка можливостей

Отримати підказки щодо можливостей провайдера (intents/scopes, де доступно) разом зі статичною підтримкою функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` необов’язковий; пропустіть його, щоб перелічити всі канали (зокрема extensions).
- `--account` дійсний лише з `--channel`.
- `--target` приймає `channel:<id>` або сирий числовий channel id і застосовується лише до Discord.
- Перевірки є специфічними для провайдера: intents Discord + необов’язкові дозволи каналу; scopes бота + користувача Slack; прапорці бота Telegram + Webhook; версія демона Signal; app token Microsoft Teams + ролі/scopes Graph (де відомо, з анотаціями). Канали без перевірок повідомляють `Probe: unavailable`.

## Зіставлення імен з ID

Зіставляйте назви каналів/користувачів з ID за допомогою каталогу провайдера:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово задати тип цілі.
- Якщо кілька записів мають однакову назву, зіставлення віддає перевагу активним збігам.
- `channels resolve` працює лише на читання. Якщо вибраний обліковий запис налаштовано через SecretRef, але ці облікові дані недоступні в поточному шляху команди, команда повертає деградовані нерозв’язані результати з примітками замість переривання всього запуску.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд каналів](/uk/channels)
