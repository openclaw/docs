---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити стан каналу або відстежувати журнали каналу
summary: Довідник CLI для `openclaw channels` (облікові записи, статус, вхід/вихід, журнали)
title: Канали
x-i18n:
    generated_at: "2026-05-07T13:13:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Керуйте обліковими записами чат-каналів та їхнім станом виконання на Gateway.

Пов’язані документи:

- Посібники з каналів: [Канали](/uk/channels)
- Конфігурація Gateway: [Конфігурація](/uk/gateway/configuration)

## Поширені команди

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` показує лише чат-канали: за замовчуванням налаштовані облікові записи зі статусними тегами `installed`, `configured` і `enabled` для кожного облікового запису. Передайте `--all`, щоб також показати вбудовані канали, для яких ще немає налаштованого облікового запису, а також канали з каталогу для встановлення, яких ще немає на диску. Постачальники автентифікації (OAuth + API-ключі) та знімки використання/квот постачальників моделей більше тут не друкуються; використовуйте `openclaw models auth list` для профілів автентифікації постачальників і `openclaw status` або `openclaw models list` для використання.

## Стан / можливості / розпізнавання / журнали

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (лише з `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — це живий шлях: на доступному Gateway він запускає для кожного облікового запису перевірки
`probeAccount` і необов’язкові перевірки `auditAccount`, тому вивід може містити стан
транспорту, а також результати перевірок, як-от `works`, `probe failed`, `audit ok` або `audit failed`.
Якщо Gateway недоступний, `channels status` повертається до зведень лише з конфігурації
замість виводу живої перевірки.

Не використовуйте `openclaw sessions`, Gateway `sessions.list` або інструмент агента
`sessions_list` як сигнал стану сокетів каналу. Ці поверхні повідомляють
збережені рядки розмов, а не стан виконання постачальника. Після перезапуску постачальника Discord
підключений, але неактивний обліковий запис може бути справним, хоча жоден рядок сеансу Discord
не з’явиться до наступної вхідної або вихідної події розмови.

## Додавання / видалення облікових записів

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` показує прапорці для кожного каналу (токен, приватний ключ, токен застосунку, шляхи signal-cli тощо).
</Tip>

`channels remove` працює лише зі встановленими/налаштованими Plugin каналів. Для каналів каталогу, які можна встановити, спершу використовуйте `channels add`.
Для Plugin каналів із підтримкою виконання `channels remove` також просить запущений Gateway зупинити вибраний обліковий запис перед оновленням конфігурації, тож вимкнення або видалення облікового запису не залишає старий слухач активним до перезапуску.

Поширені неінтерактивні поверхні додавання:

- канали bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для автентифікації стандартного облікового запису через змінні середовища там, де це підтримується

Якщо Plugin каналу потрібно встановити під час команди додавання через прапорці, OpenClaw використовує стандартне джерело встановлення каналу без відкриття інтерактивного запиту встановлення Plugin.

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- ідентифікатори облікових записів для кожного вибраного каналу
- необов’язкові відображувані імена для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо ви підтвердите прив’язування зараз, майстер запитає, який агент має володіти кожним налаштованим обліковим записом каналу, і запише прив’язки маршрутизації на рівні облікового запису.

Ви також можете керувати тими самими правилами маршрутизації пізніше за допомогою `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [агенти](/uk/cli/agents)).

Коли ви додаєте нестандартний обліковий запис до каналу, який досі використовує однокористувацькі налаштування верхнього рівня, OpenClaw переносить значення верхнього рівня, прив’язані до облікового запису, у мапу облікових записів каналу перед записом нового облікового запису. Більшість каналів розміщують ці значення в `channels.<channel>.accounts.default`, але вбудовані канали натомість можуть зберегти наявний відповідний перенесений обліковий запис. Matrix — поточний приклад: якщо один іменований обліковий запис уже існує або `defaultAccount` вказує на наявний іменований обліковий запис, перенесення зберігає цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації залишається узгодженою:

- Наявні прив’язки лише до каналу (без `accountId`) і далі відповідають стандартному обліковому запису.
- `channels add` не створює автоматично й не переписує прив’язки в неінтерактивному режимі.
- Інтерактивне налаштування може необов’язково додати прив’язки на рівні облікового запису.

Якщо ваша конфігурація вже була у змішаному стані (наявні іменовані облікові записи й досі задані однокористувацькі значення верхнього рівня), запустіть `openclaw doctor --fix`, щоб перемістити значення на рівні облікового запису в перенесений обліковий запис, вибраний для цього каналу. Більшість каналів переносять у `accounts.default`; Matrix натомість може зберегти наявну іменовану/стандартну ціль.

## Вхід і вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` підтримує `--verbose`.
- `channels login` і `logout` можуть визначити канал, коли налаштовано лише одну підтримувану ціль входу.
- `channels logout` віддає перевагу живому шляху Gateway, коли він доступний, тому вихід зупиняє будь-який активний слухач перед очищенням стану автентифікації каналу. Якщо локальний Gateway недоступний, він повертається до локального очищення автентифікації.
- Запускайте `channels login` з термінала на хості Gateway. Агентський `exec` блокує цей інтерактивний потік входу; агентські інструменти входу, рідні для каналу, як-от `whatsapp_login`, слід використовувати з чату, коли вони доступні.

## Усунення несправностей

- Запустіть `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для керованих виправлень.
- `openclaw channels list` більше не друкує знімки використання/квот постачальників моделей. Для них використовуйте `openclaw status` (огляд) або `openclaw models list` (за постачальниками).
- `openclaw channels status` повертається до зведень лише з конфігурації, коли Gateway недоступний. Якщо облікові дані підтримуваного каналу налаштовано через SecretRef, але вони недоступні в поточному шляху команди, він повідомляє цей обліковий запис як налаштований із примітками про погіршений стан, а не показує його як неналаштований.

## Перевірка можливостей

Отримайте підказки про можливості постачальника (intents/scopes, де доступно) плюс статичну підтримку функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` необов’язковий; опустіть його, щоб перелічити кожен канал (включно з extensions).
- `--account` дійсний лише з `--channel`.
- `--target` приймає `channel:<id>` або необроблений числовий ідентифікатор каналу та застосовується лише до Discord. Для голосових каналів Discord перевірка дозволів позначає відсутні `ViewChannel`, `Connect`, `Speak`, `SendMessages` і `ReadMessageHistory`.
- Перевірки залежать від постачальника: intents Discord + необов’язкові дозволи каналу; bot + user scopes Slack; прапорці bot Telegram + Webhook; версія демона Signal; токен застосунку Microsoft Teams + ролі/області Graph (анотовано, де відомо). Канали без перевірок повідомляють `Probe: unavailable`.

## Розпізнавання імен в ID

Розпізнавайте імена каналів/користувачів в ID за допомогою каталогу постачальника:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово задати тип цілі.
- Розпізнавання віддає перевагу активним збігам, коли кілька записів мають однакове ім’я.
- `channels resolve` доступний лише для читання. Якщо вибраний обліковий запис налаштовано через SecretRef, але ці облікові дані недоступні в поточному шляху команди, команда повертає погіршені нерозпізнані результати з примітками замість переривання всього запуску.
- `channels resolve` не встановлює Plugin каналів. Використовуйте `channels add --channel <name>` перед розпізнаванням імен для каналу каталогу, який можна встановити.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд каналів](/uk/channels)
