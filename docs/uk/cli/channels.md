---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити стан каналу або відстежувати журнали каналу в реальному часі
summary: Довідник CLI для `openclaw channels` (облікові записи, статус, вхід/вихід, журнали)
title: Канали
x-i18n:
    generated_at: "2026-04-28T11:06:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Керуйте обліковими записами чат-каналів і їхнім станом виконання на Gateway.

Пов’язані документи:

- Посібники каналів: [Канали](/uk/channels)
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

## Стан / можливості / розпізнавання / журнали

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (лише з `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — це live-шлях: на доступному Gateway він запускає перевірки `probeAccount` для кожного облікового запису та додаткові перевірки `auditAccount`, тому вивід може містити стан транспорту, а також результати перевірок, як-от `works`, `probe failed`, `audit ok` або `audit failed`.
Якщо Gateway недоступний, `channels status` повертається до підсумків лише з конфігурації замість виводу live-перевірки.

## Додавання / видалення облікових записів

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` показує прапорці для кожного каналу (токен, приватний ключ, токен застосунку, шляхи signal-cli тощо).
</Tip>

Поширені неінтерактивні поверхні додавання включають:

- канали bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Поля Nostr: `--private-key`, `--relay-urls`
- Поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для автентифікації стандартного облікового запису через env, де це підтримується

Якщо під час команди додавання через прапорці потрібно встановити Plugin каналу, OpenClaw використовує стандартне джерело встановлення каналу, не відкриваючи інтерактивний запит встановлення Plugin.

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- ідентифікатори облікових записів для кожного вибраного каналу
- необов’язкові відображувані імена для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо ви підтвердите прив’язування зараз, майстер запитає, який агент має володіти кожним налаштованим обліковим записом каналу, і запише прив’язки маршрутизації в області облікового запису.

Ви також можете керувати тими самими правилами маршрутизації пізніше за допомогою `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [агенти](/uk/cli/agents)).

Коли ви додаєте нестандартний обліковий запис до каналу, який досі використовує налаштування верхнього рівня для одного облікового запису, OpenClaw переносить значення верхнього рівня в області облікового запису до мапи облікових записів каналу перед записом нового облікового запису. Більшість каналів розміщують ці значення в `channels.<channel>.accounts.default`, але вбудовані канали натомість можуть зберегти наявний відповідний перенесений обліковий запис. Matrix — поточний приклад: якщо вже існує один іменований обліковий запис або `defaultAccount` вказує на наявний іменований обліковий запис, перенесення зберігає цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації залишається узгодженою:

- Наявні прив’язки лише каналу (без `accountId`) і далі відповідають стандартному обліковому запису.
- `channels add` не створює автоматично й не перезаписує прив’язки в неінтерактивному режимі.
- Інтерактивне налаштування може необов’язково додати прив’язки в області облікового запису.

Якщо ваша конфігурація вже була у змішаному стані (іменовані облікові записи наявні, а значення верхнього рівня для одного облікового запису все ще задані), запустіть `openclaw doctor --fix`, щоб перемістити значення в області облікового запису до перенесеного облікового запису, вибраного для цього каналу. Більшість каналів переносять у `accounts.default`; Matrix натомість може зберегти наявну іменовану/стандартну ціль.

## Вхід і вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` підтримує `--verbose`.
- `channels login` і `logout` можуть визначити канал, коли налаштовано лише одну підтримувану ціль входу.
- Запускайте `channels login` з термінала на хості Gateway. Agent `exec` блокує цей інтерактивний потік входу; нативні для каналу інструменти входу агента, як-от `whatsapp_login`, слід використовувати з чату, коли вони доступні.

## Усунення несправностей

- Запустіть `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для керованих виправлень.
- `openclaw channels list` друкує `Claude: HTTP 403 ... user:profile` → знімку використання потрібна область `user:profile`. Використовуйте `--no-usage`, або надайте ключ сесії claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), або повторно автентифікуйтеся через Claude CLI.
- `openclaw channels status` повертається до підсумків лише з конфігурації, коли Gateway недоступний. Якщо облікові дані підтримуваного каналу налаштовано через SecretRef, але вони недоступні в поточному шляху команди, він повідомляє цей обліковий запис як налаштований із примітками про погіршений стан замість того, щоб показувати його як не налаштований.

## Перевірка можливостей

Отримайте підказки щодо можливостей провайдера (intents/scopes, де доступно), а також статичну підтримку функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` необов’язковий; пропустіть його, щоб перелічити кожен канал (включно з розширеннями).
- `--account` чинний лише з `--channel`.
- `--target` приймає `channel:<id>` або сирий числовий ідентифікатор каналу й застосовується лише до Discord.
- Перевірки залежать від провайдера: intents Discord + необов’язкові дозволи каналу; bot Slack + області користувача; прапорці Telegram bot + Webhook; версія демона Signal; токен застосунку Microsoft Teams + ролі/області Graph (позначено, де відомо). Канали без перевірок повідомляють `Probe: unavailable`.

## Розпізнавання імен в ідентифікатори

Розпізнавайте назви каналів/імена користувачів в ідентифікатори за допомогою каталогу провайдера:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово задати тип цілі.
- Розпізнавання надає перевагу активним відповідникам, коли кілька записів мають однакову назву.
- `channels resolve` доступний лише для читання. Якщо вибраний обліковий запис налаштовано через SecretRef, але ці облікові дані недоступні в поточному шляху команди, команда повертає погіршені нерозпізнані результати з примітками замість переривання всього запуску.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд каналів](/uk/channels)
