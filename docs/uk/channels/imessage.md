---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання/отримання iMessage
summary: Підтримка застарілого iMessage через imsg (JSON-RPC поверх stdio). Для нових налаштувань слід використовувати BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T18:09:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b693b222ab60fe9fee8be47ec4b347ba126f11558888d336220e39425023dcd
    source_path: channels/imessage.md
    workflow: 15
---

<Warning>
Для нових розгортань iMessage використовуйте <a href="/uk/channels/bluebubbles">BlueBubbles</a>.

Інтеграція `imsg` є застарілою і може бути вилучена в одному з майбутніх релізів.
</Warning>

Статус: застаріла зовнішня інтеграція CLI. Gateway запускає `imsg rpc` і обмінюється даними через JSON-RPC у stdio (без окремого демона/порту).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/uk/channels/bluebubbles">
    Бажаний шлях iMessage для нових налаштувань.
  </Card>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    DM-повідомлення iMessage за замовчуванням працюють у режимі pairing.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/uk/gateway/config-channels#imessage">
    Повний довідник полів iMessage.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запити на pairing спливають через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw потребує лише `cliPath`, сумісний зі stdio, тому ви можете вказати в `cliPath` скрипт-обгортку, який підключається через SSH до віддаленого Mac і запускає `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Рекомендована конфігурація, коли вкладення увімкнені:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // використовується для отримання вкладень через SCP
      includeAttachments: true,
      // Необов’язково: перевизначення дозволених кореневих каталогів для вкладень.
      // Типові значення включають /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Якщо `remoteHost` не задано, OpenClaw намагається автоматично визначити його, розбираючи SSH-скрипт-обгортку.
    `remoteHost` має бути у форматі `host` або `user@host` (без пробілів і параметрів SSH).
    OpenClaw використовує сувору перевірку ключа хоста для SCP, тому ключ хоста реле вже має існувати в `~/.ssh/known_hosts`.
    Шляхи вкладень перевіряються відносно дозволених кореневих каталогів (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- У Messages має бути виконано вхід на Mac, де працює `imsg`.
- Для контексту процесу, у якому працює OpenClaw/`imsg`, потрібен Full Disk Access (доступ до бази даних Messages).
- Для надсилання повідомлень через Messages.app потрібен дозвіл Automation.

<Tip>
Дозволи надаються для кожного контексту процесу окремо. Якщо gateway працює без GUI (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в тому самому контексті, щоб викликати запити на дозвіл:

```bash
imsg chats --limit 1
# або
imsg send <handle> "test"
```

</Tip>

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` керує прямими повідомленнями:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле allowlist: `channels.imessage.allowFrom`.

    Записи allowlist можуть бути handle або цілями чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (за замовчуванням, якщо налаштовано)
    - `open`
    - `disabled`

    Allowlist відправників груп: `channels.imessage.groupAllowFrom`.

    Резервна поведінка під час виконання: якщо `groupAllowFrom` не задано, перевірки відправників груп iMessage під час виконання використовують `allowFrom`, якщо він доступний.
    Примітка під час виконання: якщо `channels.imessage` повністю відсутній, під час виконання використовується `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Обмеження за згадками для груп:

    - iMessage не має вбудованих метаданих згадок
    - виявлення згадок використовує regex-шаблони (`agents.list[].groupChat.mentionPatterns`, резервний варіант — `messages.groupChat.mentionPatterns`)
    - якщо жодного шаблону не налаштовано, обмеження за згадками неможливо застосувати

    Керувальні команди від авторизованих відправників можуть обходити обмеження за згадками в групах.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Для DM використовується пряма маршрутизація; для груп — групова маршрутизація.
    - Із типовим `session.dmScope=main` DM iMessage згортаються в основну сесію агента.
    - Групові сесії ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді маршрутизуються назад до iMessage з використанням метаданих вихідного каналу/цілі.

    Поведінка потоків, схожа на групову:

    Деякі багатокористувацькі потоки iMessage можуть надходити з `is_group=false`.
    Якщо цей `chat_id` явно налаштований у `channels.imessage.groups`, OpenClaw обробляє його як груповий трафік (групові обмеження + ізоляція групової сесії).

  </Tab>
</Tabs>

## Прив’язки розмов ACP

Застарілі чати iMessage також можна прив’язувати до сесій ACP.

Швидкий робочий процес оператора:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в цій самій розмові iMessage маршрутизуватимуться до створеної сесії ACP.
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

Див. [ACP Agents](/uk/tools/acp-agents) для спільної поведінки прив’язок ACP.

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Використовуйте окремий Apple ID і користувача macOS, щоб трафік бота був ізольований від вашого особистого профілю Messages.

    Типовий процес:

    1. Створіть окремого користувача macOS і увійдіть під ним.
    2. Увійдіть у Messages з Apple ID бота під цим користувачем.
    3. Встановіть `imsg` для цього користувача.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Вкажіть `channels.imessage.accounts.<id>.cliPath` і `.dbPath` для профілю цього користувача.

    Під час першого запуску можуть знадобитися підтвердження в GUI (Automation + Full Disk Access) у сеансі цього користувача бота.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
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

    Використовуйте SSH-ключі, щоб і SSH, і SCP працювали без взаємодії.
    Спочатку переконайтеся, що ключ хоста довірений (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб заповнився `known_hosts`.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage підтримує конфігурацію для кожного облікового запису в `channels.imessage.accounts`.

    Кожен обліковий запис може перевизначати такі поля, як `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, параметри історії та allowlist кореневих каталогів вкладень.

  </Accordion>
</AccordionGroup>

## Медіа, поділ на частини та цілі доставки

<AccordionGroup>
  <Accordion title="Attachments and media">
    - отримання вхідних вкладень є необов’язковим: `channels.imessage.includeAttachments`
    - шляхи до віддалених вкладень можна отримувати через SCP, коли задано `remoteHost`
    - шляхи вкладень мають відповідати дозволеним кореневим каталогам:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (віддалений режим SCP)
      - типовий шаблон кореневого каталогу: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - для розміру вихідних медіа використовується `channels.imessage.mediaMaxMb` (типово 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - ліміт частини тексту: `channels.imessage.textChunkLimit` (типово 4000)
    - режим поділу на частини: `channels.imessage.chunkMode`
      - `length` (типово)
      - `newline` (спочатку поділ за абзацами)

  </Accordion>

  <Accordion title="Addressing formats">
    Бажані явні цілі:

    - `chat_id:123` (рекомендовано для стабільної маршрутизації)
    - `chat_guid:...`
    - `chat_identifier:...`

    Також підтримуються цілі-handle:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Записи конфігурації

iMessage за замовчуванням дозволяє записи конфігурації, ініційовані каналом (для `/config set|unset`, коли `commands.config: true`).

Вимкнути:

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
  <Accordion title="imsg not found or RPC unsupported">
    Перевірте двійковий файл і підтримку RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Якщо probe повідомляє, що RPC не підтримується, оновіть `imsg`.

  </Accordion>

  <Accordion title="DMs are ignored">
    Перевірте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - підтвердження pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Перевірте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведінку allowlist `channels.imessage.groups`
    - конфігурацію шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію ключами SSH/SCP з хоста gateway
    - наявність ключа хоста в `~/.ssh/known_hosts` на хості gateway
    - доступність для читання віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Повторно виконайте в інтерактивному терміналі GUI в тому самому контексті користувача/сеансу та підтвердьте запити:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Підтвердьте, що Full Disk Access і Automation надано для контексту процесу, у якому працює OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

- [Configuration reference - iMessage](/uk/gateway/config-channels#imessage)
- [Конфігурація Gateway](/uk/gateway/configuration)
- [Pairing](/uk/channels/pairing)
- [BlueBubbles](/uk/channels/bluebubbles)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Groups](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
