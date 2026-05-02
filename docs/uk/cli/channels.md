---
read_when:
    - Ви хочете додати/видалити облікові записи каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Ви хочете перевірити стан каналу або переглянути журнали каналу в реальному часі
summary: Довідник CLI для `openclaw channels` (accounts, status, login/logout, logs)
title: Канали
x-i18n:
    generated_at: "2026-05-02T07:07:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Керуйте обліковими записами каналів чату та їхнім станом виконання на Gateway.

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

## Стан / можливості / розв’язання / журнали

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (лише з `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — це живий шлях: на доступному Gateway він виконує для кожного облікового запису перевірки
`probeAccount` і необов’язково `auditAccount`, тож вивід може містити стан
транспорту плюс результати перевірок, як-от `works`, `probe failed`, `audit ok` або `audit failed`.
Якщо Gateway недоступний, `channels status` повертається до зведень лише з конфігурації
замість живого виводу перевірки.

Не використовуйте `openclaw sessions`, Gateway `sessions.list` або інструмент агента
`sessions_list` як сигнал справності сокета каналу. Ці поверхні повідомляють
збережені рядки розмов, а не стан виконання провайдера. Після перезапуску провайдера Discord
підключений, але тихий обліковий запис може бути справним, хоча рядок сеансу Discord
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

`channels remove` працює лише з установленими/налаштованими Plugin каналів. Спершу використовуйте `channels add` для каналів каталогу, які можна встановити.
Для Plugin каналів із підтримкою виконання `channels remove` також просить запущений Gateway зупинити вибраний обліковий запис перед оновленням конфігурації, тому вимкнення або видалення облікового запису не залишає старий слухач активним до перезапуску.

Поширені неінтерактивні поверхні додавання включають:

- канали з токеном бота: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорту Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для автентифікації стандартного облікового запису через середовище, де це підтримується

Якщо Plugin каналу потрібно встановити під час команди додавання, керованої прапорцями, OpenClaw використовує стандартне джерело встановлення каналу без відкриття інтерактивного запиту встановлення Plugin.

Коли ви запускаєте `openclaw channels add` без прапорців, інтерактивний майстер може запитати:

- ідентифікатори облікових записів для кожного вибраного каналу
- необов’язкові відображувані назви для цих облікових записів
- `Bind configured channel accounts to agents now?`

Якщо ви підтвердите прив’язування зараз, майстер запитає, який агент має володіти кожним налаштованим обліковим записом каналу, і запише прив’язки маршрутизації в межах облікового запису.

Ви також можете керувати тими самими правилами маршрутизації пізніше за допомогою `openclaw agents bindings`, `openclaw agents bind` і `openclaw agents unbind` (див. [агенти](/uk/cli/agents)).

Коли ви додаєте нестандартний обліковий запис до каналу, який досі використовує однорівневі налаштування одного облікового запису, OpenClaw переносить значення верхнього рівня в межах облікового запису в мапу облікових записів каналу перед записом нового облікового запису. Більшість каналів розміщують ці значення в `channels.<channel>.accounts.default`, але вбудовані канали можуть натомість зберегти наявний відповідний перенесений обліковий запис. Matrix є поточним прикладом: якщо один іменований обліковий запис уже існує або `defaultAccount` вказує на наявний іменований обліковий запис, перенесення зберігає цей обліковий запис замість створення нового `accounts.default`.

Поведінка маршрутизації залишається узгодженою:

- Наявні прив’язки лише до каналу (без `accountId`) продовжують відповідати стандартному обліковому запису.
- `channels add` не створює автоматично й не переписує прив’язки в неінтерактивному режимі.
- Інтерактивне налаштування може необов’язково додати прив’язки в межах облікового запису.

Якщо ваша конфігурація вже була в змішаному стані (іменовані облікові записи присутні, а значення верхнього рівня для одного облікового запису все ще задані), запустіть `openclaw doctor --fix`, щоб перемістити значення в межах облікового запису в перенесений обліковий запис, вибраний для цього каналу. Більшість каналів переносять у `accounts.default`; Matrix натомість може зберегти наявну іменовану/стандартну ціль.

## Вхід і вихід (інтерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` підтримує `--verbose`.
- `channels login` і `logout` можуть визначити канал, коли налаштовано лише одну підтримувану ціль входу.
- `channels logout` надає перевагу живому шляху Gateway, коли він доступний, тому вихід зупиняє будь-який активний слухач перед очищенням стану автентифікації каналу. Якщо локальний Gateway недоступний, він повертається до локального очищення автентифікації.
- Запускайте `channels login` з термінала на хості gateway. Агентський `exec` блокує цей інтерактивний потік входу; агентські інструменти входу, рідні для каналу, як-от `whatsapp_login`, слід використовувати з чату, коли вони доступні.

## Усунення несправностей

- Запустіть `openclaw status --deep` для широкої перевірки.
- Використовуйте `openclaw doctor` для керованих виправлень.
- `openclaw channels list` друкує `Claude: HTTP 403 ... user:profile` → знімку використання потрібен scope `user:profile`. Використовуйте `--no-usage`, або надайте ключ сеансу claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), або повторно автентифікуйтеся через Claude CLI.
- `openclaw channels status` повертається до зведень лише з конфігурації, коли gateway недоступний. Якщо облікові дані підтримуваного каналу налаштовано через SecretRef, але вони недоступні в поточному шляху команди, він повідомляє цей обліковий запис як налаштований із примітками про погіршений стан замість показу його як неналаштованого.

## Перевірка можливостей

Отримайте підказки щодо можливостей провайдера (intents/scopes, де доступно) плюс статичну підтримку функцій:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примітки:

- `--channel` є необов’язковим; пропустіть його, щоб перелічити кожен канал (включно з extensions).
- `--account` чинний лише з `--channel`.
- `--target` приймає `channel:<id>` або необроблений числовий ідентифікатор каналу та застосовується лише до Discord.
- Перевірки залежать від провайдера: Discord intents + необов’язкові дозволи каналу; Slack bot + user scopes; прапорці бота Telegram + Webhook; версія демона Signal; токен застосунку Microsoft Teams + ролі/scopes Graph (анотовано, де відомо). Канали без перевірок повідомляють `Probe: unavailable`.

## Розв’язання назв в ідентифікатори

Розв’язуйте назви каналів/користувачів в ідентифікатори за допомогою каталогу провайдера:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примітки:

- Використовуйте `--kind user|group|auto`, щоб примусово задати тип цілі.
- Розв’язання надає перевагу активним збігам, коли кілька записів мають однакову назву.
- `channels resolve` доступний лише для читання. Якщо вибраний обліковий запис налаштовано через SecretRef, але ці облікові дані недоступні в поточному шляху команди, команда повертає погіршені нерозв’язані результати з примітками замість переривання всього запуску.
- `channels resolve` не встановлює Plugin каналів. Використовуйте `channels add --channel <name>` перед розв’язанням назв для каналу каталогу, який можна встановити.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд каналів](/uk/channels)
