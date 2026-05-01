---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити стан каналу або переглянути останні записи журналів каналу
summary: Довідник CLI для `openclaw channels` (облікові записи, статус, вхід/вихід, журнали)
title: Канали
x-i18n:
    generated_at: "2026-05-01T07:53:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f673a626b46cd4c8ba7eb28963d27e7e3f630dd86723332faab9b4c86553da9
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Керуйте обліковими записами чат-каналів і їхнім станом виконання на Gateway.

Пов’язані документи:

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

## Стан / можливості / resolve / журнали

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (лише з `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — це живий шлях: на доступному Gateway він запускає для кожного облікового запису перевірки `probeAccount` і, за потреби, `auditAccount`, тому вивід може містити стан транспорту, а також результати перевірок, як-от `works`, `probe failed`, `audit ok` або `audit failed`. Якщо Gateway недоступний, `channels status` повертається до зведень лише з конфігурації замість виводу живої перевірки.

## Додавання / видалення облікових записів

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` показує прапорці для кожного каналу (токен, приватний ключ, токен застосунку, шляхи signal-cli тощо).
</Tip>

`channels remove` працює лише зі встановленими/налаштованими Plugin каналів. Для каналів із каталогу, які можна встановити, спочатку використайте `channels add`.

Поширені неінтерактивні поверхні додавання:

- канали з bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для автентифікації типового облікового запису через env, де це підтримується

Якщо Plugin каналу потрібно встановити під час команди додавання, керованої прапорцями, OpenClaw використовує типове джерело встановлення каналу, не відкриваючи інтерактивний запит встановлення Plugin.

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- ідентифікатори облікових записів для кожного вибраного каналу
- необов’язкові відображувані назви для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо підтвердити прив’язку зараз, майстер запитає, який агент має володіти кожним налаштованим обліковим записом каналу, і запише прив’язки маршрутизації з областю облікового запису.

Ті самі правила маршрутизації також можна пізніше керувати через `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [агенти](/uk/cli/agents)).

Коли ви додаєте нетиповий обліковий запис до каналу, який досі використовує налаштування верхнього рівня для одного облікового запису, OpenClaw переносить значення верхнього рівня з областю облікового запису в мапу облікових записів каналу перед записом нового облікового запису. Більшість каналів розміщують ці значення в `channels.<channel>.accounts.default`, але вбудовані канали можуть натомість зберегти наявний відповідний перенесений обліковий запис. Поточний приклад — Matrix: якщо вже існує один іменований обліковий запис або `defaultAccount` вказує на наявний іменований обліковий запис, перенесення зберігає цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації лишається узгодженою:

- Наявні прив’язки лише до каналу (без `accountId`) і далі відповідають типовому обліковому запису.
- `channels add` не створює автоматично й не переписує прив’язки в неінтерактивному режимі.
- Інтерактивне налаштування може за бажанням додати прив’язки з областю облікового запису.

Якщо ваша конфігурація вже була в змішаному стані (наявні іменовані облікові записи й досі задані значення верхнього рівня для одного облікового запису), запустіть `openclaw doctor --fix`, щоб перемістити значення з областю облікового запису в перенесений обліковий запис, вибраний для цього каналу. Більшість каналів переносять у `accounts.default`; Matrix натомість може зберегти наявну іменовану/типову ціль.

## Вхід і вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` підтримує `--verbose`.
- `channels login` і `logout` можуть визначити канал, коли налаштовано лише одну підтримувану ціль входу.
- Запускайте `channels login` з термінала на хості Gateway. Агентський `exec` блокує цей інтерактивний потік входу; нативні для каналу інструменти входу агента, як-от `whatsapp_login`, слід використовувати з чату, коли вони доступні.

## Усунення несправностей

- Запустіть `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для керованих виправлень.
- `openclaw channels list` друкує `Claude: HTTP 403 ... user:profile` → знімку використання потрібна область `user:profile`. Використайте `--no-usage`, або надайте ключ сесії claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), або повторно автентифікуйтеся через Claude CLI.
- `openclaw channels status` повертається до зведень лише з конфігурації, коли Gateway недоступний. Якщо підтримувані облікові дані каналу налаштовано через SecretRef, але вони недоступні в поточному шляху команди, він повідомляє цей обліковий запис як налаштований із примітками про погіршений стан замість показу його як неналаштованого.

## Перевірка можливостей

Отримайте підказки можливостей провайдера (intents/scopes, де доступно) плюс статичну підтримку функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` необов’язковий; пропустіть його, щоб перелічити кожен канал (включно з extensions).
- `--account` дійсний лише з `--channel`.
- `--target` приймає `channel:<id>` або необроблений числовий ідентифікатор каналу та застосовується лише до Discord.
- Перевірки залежать від провайдера: Discord intents + необов’язкові дозволи каналу; області Slack bot + user; прапорці Telegram bot + Webhook; версія демона Signal; токен застосунку Microsoft Teams + ролі/області Graph (анотовано там, де відомо). Канали без перевірок повідомляють `Probe: unavailable`.

## Перетворення назв на ідентифікатори

Перетворюйте назви каналів/користувачів на ідентифікатори за допомогою каталогу провайдера:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово задати тип цілі.
- Під час розв’язання перевага надається активним збігам, коли кілька записів мають однакову назву.
- `channels resolve` доступний лише для читання. Якщо вибраний обліковий запис налаштовано через SecretRef, але ці облікові дані недоступні в поточному шляху команди, команда повертає погіршені нерозв’язані результати з примітками замість переривання всього запуску.
- `channels resolve` не встановлює Plugin каналів. Використайте `channels add --channel <name>` перед розв’язанням назв для каналу з каталогу, який можна встановити.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд каналів](/uk/channels)
