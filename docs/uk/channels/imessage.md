---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання й отримання в iMessage
summary: Застаріла підтримка iMessage через imsg (JSON-RPC через stdio). Нові налаштування мають використовувати BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-28T11:04:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
Для нових розгортань iMessage використовуйте <a href="/uk/channels/bluebubbles">BlueBubbles</a>.

Інтеграція `imsg` є застарілою і може бути вилучена в майбутньому випуску.
</Warning>

Стан: застаріла інтеграція із зовнішнім CLI. Gateway запускає `imsg rpc` і обмінюється даними через JSON-RPC у stdio (без окремого демона/порту).

<CardGroup cols={3}>
  <Card title="BlueBubbles (рекомендовано)" icon="message-circle" href="/uk/channels/bluebubbles">
    Бажаний шлях iMessage для нових налаштувань.
  </Card>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    DM iMessage за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Довідник конфігурації" icon="settings" href="/uk/gateway/config-channels#imessage">
    Повний довідник полів iMessage.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Локальний Mac (швидкий шлях)">
    <Steps>
      <Step title="Установіть і перевірте imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Налаштуйте OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Запустіть gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Схваліть перше сполучення DM (dmPolicy за замовчуванням)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запити на сполучення минають через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Віддалений Mac через SSH">
    OpenClaw потребує лише сумісного зі stdio `cliPath`, тож ви можете спрямувати `cliPath` на скрипт-обгортку, який підключається через SSH до віддаленого Mac і запускає `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Рекомендована конфігурація, коли вкладення ввімкнено:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Якщо `remoteHost` не встановлено, OpenClaw намагається автоматично визначити його, розбираючи скрипт-обгортку SSH.
    `remoteHost` має бути `host` або `user@host` (без пробілів чи параметрів SSH).
    OpenClaw використовує сувору перевірку ключа хоста для SCP, тому ключ хоста ретранслятора вже має існувати в `~/.ssh/known_hosts`.
    Шляхи вкладень перевіряються за дозволеними коренями (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- Messages має бути виконано вхід на Mac, де працює `imsg`.
- Для контексту процесу, у якому працює OpenClaw/`imsg`, потрібен Full Disk Access (доступ до БД Messages).
- Для надсилання повідомлень через Messages.app потрібен дозвіл Automation.

<Tip>
Дозволи надаються для кожного контексту процесу. Якщо gateway працює безголово (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в тому самому контексті, щоб викликати запити:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.imessage.dmPolicy` керує прямими повідомленнями:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле allowlist: `channels.imessage.allowFrom`.

    Записами allowlist можуть бути handles або цілі чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Групова політика + згадки">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (за замовчуванням, якщо налаштовано)
    - `open`
    - `disabled`

    Allowlist відправників групи: `channels.imessage.groupAllowFrom`.

    Резервна поведінка під час виконання: якщо `groupAllowFrom` не задано, перевірки відправника групи iMessage повертаються до `allowFrom`, коли він доступний.
    Примітка щодо виконання: якщо `channels.imessage` повністю відсутній, середовище виконання повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо встановлено `channels.defaults.groupPolicy`).

    Обмеження згадками для груп:

    - iMessage не має нативних метаданих згадок
    - виявлення згадок використовує regex-шаблони (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - без налаштованих шаблонів обмеження згадками неможливо застосувати

    Команди керування від авторизованих відправників можуть обходити обмеження згадками в групах.

  </Tab>

  <Tab title="Сесії та детерміновані відповіді">
    - DM використовують пряму маршрутизацію; групи використовують групову маршрутизацію.
    - Із типовим `session.dmScope=main` DM iMessage згортаються в головну сесію агента.
    - Групові сесії ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді маршрутизуються назад до iMessage за метаданими початкового каналу/цілі.

    Поведінка потоків, схожих на групові:

    Деякі багатоуйчасникові потоки iMessage можуть надходити з `is_group=false`.
    Якщо цей `chat_id` явно налаштовано в `channels.imessage.groups`, OpenClaw розглядає його як груповий трафік (групові обмеження + ізоляція групової сесії).

  </Tab>
</Tabs>

## Прив’язки розмов ACP

Застарілі чати iMessage також можна прив’язувати до сесій ACP.

Швидкий операторський процес:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в тій самій розмові iMessage маршрутизуються до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Налаштовані постійні прив’язки підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "imessage"`.

`match.peer.id` може використовувати:

- нормалізований handle DM, наприклад `+15555550123` або `user@example.com`
- `chat_id:<id>` (рекомендовано для стабільних групових прив’язок)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Приклад:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Див. [агенти ACP](/uk/tools/acp-agents) для спільної поведінки прив’язок ACP.

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Окремий користувач macOS для бота (окрема ідентичність iMessage)">
    Використовуйте окремий Apple ID і користувача macOS, щоб трафік бота був ізольований від вашого особистого профілю Messages.

    Типовий процес:

    1. Створіть окремого користувача macOS і ввійдіть у нього.
    2. Увійдіть у Messages з Apple ID бота в цьому користувачі.
    3. Установіть `imsg` у цьому користувачі.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Спрямуйте `channels.imessage.accounts.<id>.cliPath` і `.dbPath` на профіль цього користувача.

    Перший запуск може потребувати схвалень у GUI (Automation + Full Disk Access) у сесії цього користувача бота.

  </Accordion>

  <Accordion title="Віддалений Mac через Tailscale (приклад)">
    Типова топологія:

    - gateway працює на Linux/VM
    - iMessage + `imsg` працює на Mac у вашій tailnet
    - обгортка `cliPath` використовує SSH для запуску `imsg`
    - `remoteHost` вмикає отримання вкладень через SCP

    Приклад:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Використовуйте SSH-ключі, щоб і SSH, і SCP були неінтерактивними.
    Спершу переконайтеся, що ключ хоста є довіреним (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб було заповнено `known_hosts`.

  </Accordion>

  <Accordion title="Шаблон з кількома обліковими записами">
    iMessage підтримує конфігурацію для кожного облікового запису в `channels.imessage.accounts`.

    Кожен обліковий запис може перевизначати такі поля, як `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, налаштування історії та allowlist коренів вкладень.

  </Accordion>
</AccordionGroup>

## Медіа, поділ на фрагменти та цілі доставки

<AccordionGroup>
  <Accordion title="Вкладення та медіа">
    - приймання вхідних вкладень є необов’язковим: `channels.imessage.includeAttachments`
    - віддалені шляхи вкладень можна отримувати через SCP, коли встановлено `remoteHost`
    - шляхи вкладень мають відповідати дозволеним кореням:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (режим віддаленого SCP)
      - типовий шаблон кореня: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - розмір вихідних медіа використовує `channels.imessage.mediaMaxMb` (за замовчуванням 16 MB)

  </Accordion>

  <Accordion title="Поділ вихідних повідомлень на фрагменти">
    - ліміт текстового фрагмента: `channels.imessage.textChunkLimit` (за замовчуванням 4000)
    - режим фрагментації: `channels.imessage.chunkMode`
      - `length` (за замовчуванням)
      - `newline` (поділ насамперед за абзацами)

  </Accordion>

  <Accordion title="Формати адресації">
    Бажані явні цілі:

    - `chat_id:123` (рекомендовано для стабільної маршрутизації)
    - `chat_guid:...`
    - `chat_identifier:...`

    Цілі handle також підтримуються:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Записи конфігурації

iMessage за замовчуванням дозволяє ініційовані каналом записи конфігурації (для `/config set|unset`, коли `commands.config: true`).

Вимкнення:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="imsg не знайдено або RPC не підтримується">
    Перевірте двійковий файл і підтримку RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Якщо probe повідомляє, що RPC не підтримується, оновіть `imsg`.

  </Accordion>

  <Accordion title="DM ігноруються">
    Перевірте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - схвалення сполучення (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Групові повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведінку allowlist `channels.imessage.groups`
    - конфігурацію шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Віддалені вкладення не працюють">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію SSH/SCP за ключем з хоста gateway
    - ключ хоста існує в `~/.ssh/known_hosts` на хості gateway
    - читабельність віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="Запити дозволів macOS було пропущено">
    Повторно запустіть в інтерактивному GUI-терміналі в тому самому контексті користувача/сесії та схваліть запити:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Підтвердьте, що Full Disk Access + Automation надано для контексту процесу, який запускає OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Посилання на довідник конфігурації

- [Довідник конфігурації - iMessage](/uk/gateway/config-channels#imessage)
- [Конфігурація Gateway](/uk/gateway/configuration)
- [Сполучення](/uk/channels/pairing)
- [BlueBubbles](/uk/channels/bluebubbles)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
