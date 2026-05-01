---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити статус каналу або переглядати журнали каналу в реальному часі
summary: Довідник CLI для `openclaw channels` (облікові записи, статус, вхід/вихід, журнали)
title: Канали
x-i18n:
    generated_at: "2026-05-01T21:50:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9cfde99d49d63397756b182a20ae3936a6b23f2455616dc86ceb3f16a205c06
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Керуйте обліковими записами каналів чату та їхнім станом виконання на Gateway.

Пов’язана документація:

- Посібники з каналів: [Канали](/uk/channels)
- Налаштування Gateway: [Налаштування](/uk/gateway/configuration)

## Поширені команди

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Стан / можливості / resolve / журнали

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (лише з `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — це живий шлях: на доступному Gateway він виконує для кожного облікового запису
перевірки `probeAccount` і необов’язкові `auditAccount`, тому вивід може містити стан
транспорту, а також результати перевірки, як-от `works`, `probe failed`, `audit ok` або `audit failed`.
Якщо Gateway недоступний, `channels status` повертається до підсумків лише з конфігурації
замість виводу живої перевірки.

## Додавання / видалення облікових записів

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` показує прапорці для кожного каналу (токен, приватний ключ, токен застосунку, шляхи signal-cli тощо).
</Tip>

`channels remove` працює лише з установленими/налаштованими Plugin каналів. Спершу використайте `channels add` для каналів із каталогу, які можна встановити.
Для Plugin каналів із підтримкою середовища виконання `channels remove` також просить запущений Gateway зупинити вибраний обліковий запис перед оновленням конфігурації, тому вимкнення або видалення облікового запису не залишає старий слухач активним до перезапуску.

Поширені неінтерактивні поверхні додавання охоплюють:

- канали з bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для автентифікації типового облікового запису через змінні середовища там, де це підтримується

Якщо Plugin каналу потрібно встановити під час команди додавання, керованої прапорцями, OpenClaw використовує типове джерело встановлення каналу, не відкриваючи інтерактивний запит установлення Plugin.

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- ідентифікатори облікових записів для вибраного каналу
- необов’язкові відображувані імена для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо ви підтвердите прив’язування зараз, майстер запитає, який агент має володіти кожним налаштованим обліковим записом каналу, і запише прив’язки маршрутизації в межах облікового запису.

Ви також можете керувати тими самими правилами маршрутизації пізніше за допомогою `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [агенти](/uk/cli/agents)).

Коли ви додаєте нетиповий обліковий запис до каналу, який досі використовує однорівневі налаштування одного облікового запису, OpenClaw підвищує значення верхнього рівня в межах облікового запису до мапи облікових записів каналу перед записом нового облікового запису. Більшість каналів розміщують ці значення в `channels.<channel>.accounts.default`, але вбудовані канали натомість можуть зберегти наявний відповідний підвищений обліковий запис. Matrix — поточний приклад: якщо один іменований обліковий запис уже існує або `defaultAccount` указує на наявний іменований обліковий запис, підвищення зберігає цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації залишається узгодженою:

- Наявні прив’язки лише каналу (без `accountId`) і далі відповідають типовому обліковому запису.
- `channels add` не створює автоматично й не переписує прив’язки в неінтерактивному режимі.
- Інтерактивне налаштування може необов’язково додати прив’язки в межах облікового запису.

Якщо ваша конфігурація вже була в змішаному стані (іменовані облікові записи наявні, а значення одного облікового запису верхнього рівня все ще задані), запустіть `openclaw doctor --fix`, щоб перемістити значення в межах облікового запису до підвищеного облікового запису, вибраного для цього каналу. Більшість каналів підвищують до `accounts.default`; Matrix натомість може зберегти наявну іменовану/типову ціль.

## Вхід і вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` підтримує `--verbose`.
- `channels login` і `logout` можуть визначити канал, коли налаштовано лише одну підтримувану ціль входу.
- `channels logout` надає перевагу живому шляху Gateway, коли він доступний, тому вихід зупиняє будь-який активний слухач перед очищенням стану автентифікації каналу. Якщо локальний Gateway недоступний, він повертається до локального очищення автентифікації.
- Запускайте `channels login` з термінала на хості Gateway. Agent `exec` блокує цей інтерактивний потік входу; нативні для каналу інструменти входу агента, як-от `whatsapp_login`, слід використовувати з чату, коли вони доступні.

## Усунення несправностей

- Запустіть `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для керованих виправлень.
- `openclaw channels list` виводить `Claude: HTTP 403 ... user:profile` → знімку використання потрібна область `user:profile`. Використайте `--no-usage`, або надайте ключ сеансу claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), або повторно автентифікуйтеся через Claude CLI.
- `openclaw channels status` повертається до підсумків лише з конфігурації, коли Gateway недоступний. Якщо облікові дані підтримуваного каналу налаштовано через SecretRef, але вони недоступні в поточному шляху команди, він повідомляє цей обліковий запис як налаштований із примітками про погіршений стан, а не показує його як неналаштований.

## Перевірка можливостей

Отримайте підказки щодо можливостей провайдера (intents/scopes там, де доступно), а також статичну підтримку функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` необов’язковий; опустіть його, щоб перелічити кожен канал (включно з extensions).
- `--account` дійсний лише з `--channel`.
- `--target` приймає `channel:<id>` або необроблений числовий ідентифікатор каналу та застосовується лише до Discord.
- Перевірки залежать від провайдера: Discord intents + необов’язкові дозволи каналу; області Slack bot + user; прапорці Telegram bot + Webhook; версія демона Signal; токен застосунку Microsoft Teams + ролі/області Graph (анотовано там, де відомо). Канали без перевірок повідомляють `Probe: unavailable`.

## Перетворення імен на ідентифікатори

Перетворюйте імена каналів/користувачів на ідентифікатори за допомогою каталогу провайдера:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово задати тип цілі.
- Розв’язання надає перевагу активним збігам, коли кілька записів мають однакове ім’я.
- `channels resolve` доступна лише для читання. Якщо вибраний обліковий запис налаштовано через SecretRef, але ці облікові дані недоступні в поточному шляху команди, команда повертає погіршені нерозв’язані результати з примітками замість переривання всього запуску.
- `channels resolve` не встановлює Plugin каналів. Використайте `channels add --channel <name>` перед розв’язанням імен для каналу з каталогу, який можна встановити.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд каналів](/uk/channels)
