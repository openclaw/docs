---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити статус каналу або відстежувати журнали каналу в реальному часі
summary: Довідка CLI для `openclaw channels` (облікові записи, статус, вхід/вихід, журнали)
title: канали
x-i18n:
    generated_at: "2026-04-23T06:17:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Керуйте обліковими записами чат-каналів і їхнім станом виконання в Gateway.

Пов’язана документація:

- Посібники з каналів: [Канали](/uk/channels/index)
- Налаштування Gateway: [Конфігурація](/uk/gateway/configuration)

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

`channels status --probe` — це шлях живої перевірки: на доступному gateway команда запускає для кожного облікового запису перевірки `probeAccount` і, за потреби, `auditAccount`, тому вивід може містити стан транспорту разом із результатами перевірок, наприклад `works`, `probe failed`, `audit ok` або `audit failed`.
Якщо gateway недоступний, `channels status` повертається до зведень лише на основі конфігурації замість виводу живих перевірок.

## Додавання / видалення облікових записів

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Порада: `openclaw channels add --help` показує прапорці для кожного каналу окремо (`token`, приватний ключ, `app token`, шляхи `signal-cli` тощо).

Поширені поверхні неінтерактивного додавання включають:

- канали з токеном бота: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для автентифікації на основі змінних середовища для облікового запису за замовчуванням там, де це підтримується

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- ідентифікатори облікових записів для кожного вибраного каналу
- необов’язкові відображувані імена для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо ви підтвердите прив’язку зараз, майстер запитає, якому агенту має належати кожен налаштований обліковий запис каналу, і запише прив’язки маршрутизації на рівні облікового запису.

Тими самими правилами маршрутизації також можна керувати пізніше за допомогою `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [agents](/uk/cli/agents)).

Коли ви додаєте не типовий обліковий запис до каналу, який досі використовує однокористувацькі параметри верхнього рівня, OpenClaw піднімає значення верхнього рівня з областю дії облікового запису до мапи облікових записів каналу перед записом нового облікового запису. Для більшості каналів ці значення потрапляють у `channels.<channel>.accounts.default`, але вбудовані канали можуть натомість зберегти наявний відповідний піднятий обліковий запис. Поточний приклад — Matrix: якщо вже існує один іменований обліковий запис або `defaultAccount` вказує на наявний іменований обліковий запис, підняття зберігає цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації залишається сталою:

- Наявні прив’язки лише до каналу (без `accountId`) і далі відповідають обліковому запису за замовчуванням.
- `channels add` не створює і не переписує прив’язки автоматично в неінтерактивному режимі.
- Інтерактивне налаштування може за бажанням додати прив’язки з областю дії облікового запису.

Якщо ваша конфігурація вже була в змішаному стані (є іменовані облікові записи, а однокористувацькі значення верхнього рівня все ще задані), виконайте `openclaw doctor --fix`, щоб перенести значення з областю дії облікового запису в піднятий обліковий запис, вибраний для цього каналу. Для більшості каналів підняття відбувається в `accounts.default`; Matrix може зберегти наявну іменовану/типову ціль.

## Вхід / вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Примітки:

- `channels login` підтримує `--verbose`.
- `channels login` / `logout` можуть визначити канал автоматично, якщо налаштовано лише одну підтримувану ціль входу.

## Усунення проблем

- Виконайте `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для покрокового виправлення.
- `openclaw channels list` виводить `Claude: HTTP 403 ... user:profile` → знімку використання потрібна область дії `user:profile`. Використайте `--no-usage`, або надайте ключ сесії `claude.ai` (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), або повторно автентифікуйтеся через Claude CLI.
- `openclaw channels status` повертається до зведень лише на основі конфігурації, коли gateway недоступний. Якщо облікові дані підтримуваного каналу налаштовані через SecretRef, але недоступні в поточному шляху команди, цей обліковий запис буде позначено як налаштований із примітками про деградацію, а не як не налаштований.

## Перевірка можливостей

Отримайте підказки щодо можливостей провайдера (інтенти/області дії, де доступно) разом зі статичною підтримкою функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` необов’язковий; якщо його не вказати, буде показано всі канали (включно з extensions).
- `--account` допустимий лише разом із `--channel`.
- `--target` приймає `channel:<id>` або необроблений числовий ідентифікатор каналу й застосовується лише до Discord.
- Перевірки залежать від провайдера: інтенти Discord + необов’язкові дозволи каналу; області дії бота та користувача Slack; прапорці бота Telegram + Webhook; версія демона Signal; `app token` Microsoft Teams + ролі/області дії Graph (із примітками там, де це відомо). Канали без перевірок показують `Probe: unavailable`.

## Зіставлення імен з ID

Зіставляйте назви каналів/користувачів з ID за допомогою каталогу провайдера:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово задати тип цілі.
- Якщо кілька записів мають однакову назву, зіставлення надає перевагу активним збігам.
- `channels resolve` працює лише на читання. Якщо вибраний обліковий запис налаштовано через SecretRef, але ці облікові дані недоступні в поточному шляху команди, команда повертає деградовані нерозв’язані результати з примітками замість переривання всього виконання.
