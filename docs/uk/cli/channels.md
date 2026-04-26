---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити статус каналу або переглянути журнали каналу в реальному часі
summary: Довідник CLI для `openclaw channels` (облікові записи, статус, вхід/вихід, журнали)
title: Канали
x-i18n:
    generated_at: "2026-04-26T12:02:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Керуйте обліковими записами каналів чату та їхнім статусом виконання на Gateway.

Пов’язана документація:

- Посібники з каналів: [Канали](/uk/channels/index)
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

## Статус / можливості / розв’язання / журнали

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (лише з `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — це шлях живої перевірки: на доступному gateway він запускає перевірки `probeAccount` і, за потреби, `auditAccount` для кожного облікового запису, тому вивід може містити стан транспорту, а також результати перевірки, як-от `works`, `probe failed`, `audit ok` або `audit failed`.
Якщо gateway недоступний, `channels status` повертається до підсумків лише на основі конфігурації замість виводу живої перевірки.

## Додавання / видалення облікових записів

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Порада: `openclaw channels add --help` показує прапорці для кожного каналу окремо (token, private key, app token, шляхи signal-cli тощо).

Поширені неінтерактивні поверхні додавання включають:

- канали з bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для автентифікації на основі змінних середовища для облікового запису за замовчуванням, де це підтримується

Якщо для команди додавання з прапорцями потрібно встановити Plugin каналу, OpenClaw використовує стандартне джерело встановлення цього каналу, не відкриваючи інтерактивний запит на встановлення Plugin.

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- ідентифікатори облікових записів для кожного вибраного каналу
- необов’язкові відображувані назви для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо ви підтвердите прив’язку зараз, майстер запитає, якому агенту має належати кожен налаштований обліковий запис каналу, і запише прив’язки маршрутизації на рівні облікового запису.

Ви також можете керувати цими самими правилами маршрутизації пізніше за допомогою `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [agents](/uk/cli/agents)).

Коли ви додаєте не типовий обліковий запис до каналу, який іще використовує однокористувацькі налаштування верхнього рівня, OpenClaw переносить значення верхнього рівня на рівні облікового запису до мапи облікових записів каналу перед записом нового облікового запису. У більшості каналів ці значення потрапляють до `channels.<channel>.accounts.default`, але вбудовані канали можуть натомість зберегти наявний відповідний перенесений обліковий запис. Поточний приклад — Matrix: якщо вже існує один іменований обліковий запис або `defaultAccount` вказує на наявний іменований обліковий запис, перенесення зберігає цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації залишається послідовною:

- Наявні прив’язки лише до каналу (без `accountId`) і далі відповідатимуть типовому обліковому запису.
- `channels add` не створює і не переписує прив’язки автоматично в неінтерактивному режимі.
- Інтерактивне налаштування може за потреби додати прив’язки на рівні облікового запису.

Якщо ваша конфігурація вже була у змішаному стані (є іменовані облікові записи, а однокористувацькі значення верхнього рівня все ще задані), запустіть `openclaw doctor --fix`, щоб перемістити значення на рівні облікового запису до перенесеного облікового запису, вибраного для цього каналу. У більшості каналів перенесення відбувається в `accounts.default`; Matrix може зберегти наявну іменовану/типову ціль.

## Вхід / вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Примітки:

- `channels login` підтримує `--verbose`.
- `channels login` / `logout` можуть визначити канал автоматично, якщо налаштовано лише одну підтримувану ціль входу.

## Усунення несправностей

- Запустіть `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для покрокового виправлення.
- `openclaw channels list` виводить `Claude: HTTP 403 ... user:profile` → знімку використання потрібна область видимості `user:profile`. Використайте `--no-usage`, або надайте ключ сесії claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), або повторно автентифікуйтеся через Claude CLI.
- `openclaw channels status` повертається до підсумків лише на основі конфігурації, якщо gateway недоступний. Якщо облікові дані підтримуваного каналу налаштовані через SecretRef, але недоступні в поточному шляху команди, цей обліковий запис позначається як налаштований із примітками про деградацію, а не як неналаштований.

## Перевірка можливостей

Отримайте підказки щодо можливостей провайдера (intents/scopes, де доступно) разом зі статичною підтримкою функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` необов’язковий; не вказуйте його, щоб перелічити всі канали (включно з extensions).
- `--account` є дійсним лише разом із `--channel`.
- `--target` приймає `channel:<id>` або необроблений числовий ідентифікатор каналу й застосовується лише до Discord.
- Перевірки є специфічними для провайдера: Discord intents + необов’язкові дозволи каналу; Slack bot + user scopes; прапорці бота Telegram + Webhook; версія демона Signal; app token Microsoft Teams + ролі/області Graph (де відомо, з відповідними позначками). Канали без перевірок повідомляють `Probe: unavailable`.

## Розв’язання імен в ідентифікатори

Розв’язуйте назви каналів/користувачів в ідентифікатори за допомогою каталогу провайдера:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово вказати тип цілі.
- Якщо кілька записів мають однакову назву, розв’язання надає перевагу активним збігам.
- `channels resolve` є лише для читання. Якщо вибраний обліковий запис налаштований через SecretRef, але ці облікові дані недоступні в поточному шляху команди, команда повертає деградовані нерозв’язані результати з примітками замість переривання всього запуску.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд каналів](/uk/channels)
