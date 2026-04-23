---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити стан каналів або переглянути журнали каналів у реальному часі
summary: Довідка CLI для `openclaw channels` (облікові записи, статус, вхід/вихід, журнали)
title: Канали
x-i18n:
    generated_at: "2026-04-23T20:46:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16378d5b9040627111a458d5c007b71493f62eb19ddbaff754ec85004f301eaf
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Керуйте обліковими записами чат-каналів і їхнім станом виконання в Gateway.

Пов’язана документація:

- Посібники з каналів: [Channels](/uk/channels/index)
- Конфігурація Gateway: [Configuration](/uk/gateway/configuration)

## Поширені команди

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Статус / capabilities / resolve / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (лише з `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — це живий шлях: на доступному gateway він виконує для кожного облікового запису
перевірки `probeAccount` і, за потреби, `auditAccount`, тому вивід може містити
стан транспорту плюс результати перевірок, як-от `works`, `probe failed`, `audit ok` або `audit failed`.
Якщо gateway недоступний, `channels status` повертається до зведень лише за конфігурацією
замість живого виводу перевірки.

## Додавання / видалення облікових записів

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Порада: `openclaw channels add --help` показує параметри для кожного каналу (token, private key, app token, шляхи signal-cli тощо).

Поширені неінтерактивні способи додавання включають:

- канали з bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для автентифікації типового облікового запису через змінні середовища, де це підтримується

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- id облікових записів для кожного вибраного каналу
- необов’язкові display names для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо ви підтвердите негайне прив’язування, майстер запитає, який агент має володіти кожним налаштованим обліковим записом каналу, і запише прив’язки маршрутизації на рівні облікового запису.

Тими самими правилами маршрутизації також можна керувати пізніше через `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [agents](/uk/cli/agents)).

Коли ви додаєте нетиповий обліковий запис до каналу, який усе ще використовує верхньорівневі налаштування одного облікового запису, OpenClaw переносить верхньорівневі значення рівня облікового запису в map облікових записів каналу перед записом нового облікового запису. Більшість каналів поміщають ці значення в `channels.<channel>.accounts.default`, але вбудовані канали можуть натомість зберегти наявний відповідний перенесений обліковий запис. Поточний приклад — Matrix: якщо вже існує один іменований обліковий запис або `defaultAccount` вказує на наявний іменований обліковий запис, перенесення зберігає цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації лишається сталою:

- Наявні прив’язки лише на рівні каналу (без `accountId`) і далі відповідають типовому обліковому запису.
- `channels add` не створює й не переписує прив’язки автоматично в неінтерактивному режимі.
- Інтерактивне налаштування може за потреби додати прив’язки на рівні облікового запису.

Якщо ваша конфігурація вже перебуває у змішаному стані (є іменовані облікові записи й одночасно задані верхньорівневі значення одного облікового запису), виконайте `openclaw doctor --fix`, щоб перенести значення рівня облікового запису до вибраного для цього каналу перенесеного облікового запису. Більшість каналів переносять у `accounts.default`; Matrix може зберегти наявну іменовану/типову ціль замість цього.

## Вхід / вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Примітки:

- `channels login` підтримує `--verbose`.
- `channels login` / `logout` можуть визначити канал автоматично, якщо налаштовано лише одну підтримувану ціль входу.

## Усунення несправностей

- Виконайте `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для керованого виправлення.
- `openclaw channels list` виводить `Claude: HTTP 403 ... user:profile` → знімку використання потрібен scope `user:profile`. Використовуйте `--no-usage`, або надайте ключ сесії claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), або повторно автентифікуйтеся через Claude CLI.
- `openclaw channels status` повертається до зведень лише за конфігурацією, коли gateway недоступний. Якщо облікові дані підтримуваного каналу налаштовано через SecretRef, але вони недоступні в поточному шляху команди, цей обліковий запис показується як налаштований із примітками про деградацію, а не як неналаштований.

## Перевірка capabilities

Отримайте підказки щодо можливостей provider-а (intents/scopes, де доступно) разом зі статичною підтримкою функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` необов’язковий; якщо його не вказати, буде показано кожен канал (включно з extensions).
- `--account` дійсний лише разом із `--channel`.
- `--target` приймає `channel:<id>` або сирий числовий id каналу й застосовується лише до Discord.
- Перевірки залежать від provider-а: Discord intents + необов’язкові дозволи каналу; Slack bot + user scopes; Telegram bot flags + webhook; Signal daemon version; Microsoft Teams app token + ролі/scopes Graph (де відомо, із позначенням). Канали без перевірок показують `Probe: unavailable`.

## Перетворення назв на ID

Перетворюйте назви каналів/користувачів на ID через каталог provider-а:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово задати тип цілі.
- Якщо кілька записів мають однакову назву, пріоритет надається активним відповідникам.
- `channels resolve` — лише для читання. Якщо вибраний обліковий запис налаштовано через SecretRef, але ці облікові дані недоступні в поточному шляху команди, команда повертає деградовані нерозв’язані результати з примітками замість переривання всього запуску.
