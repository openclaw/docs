---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання/отримання iMessage
summary: Застаріла підтримка iMessage через imsg (JSON-RPC через stdio). У нових налаштуваннях слід використовувати BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-21T21:27:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9cc5a0bd4fbc7ff6f792e737bc4302a67f9ab6aa8231ff6f751fe6d732ca5d
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (застаріле: imsg)

<Warning>
Для нових розгортань iMessage використовуйте <a href="/uk/channels/bluebubbles">BlueBubbles</a>.

Інтеграція `imsg` є застарілою і може бути вилучена в майбутньому випуску.
</Warning>

Статус: застаріла зовнішня інтеграція CLI. Gateway запускає `imsg rpc` і обмінюється даними через JSON-RPC по stdio (без окремого демона/порту).

<CardGroup cols={3}>
  <Card title="BlueBubbles (рекомендовано)" icon="message-circle" href="/uk/channels/bluebubbles">
    Бажаний шлях iMessage для нових налаштувань.
  </Card>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Прямі повідомлення iMessage типово використовують режим сполучення.
  </Card>
  <Card title="Довідник із конфігурації" icon="settings" href="/uk/gateway/configuration-reference#imessage">
    Повний довідник полів iMessage.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Локальний Mac (швидкий шлях)">
    <Steps>
      <Step title="Встановіть і перевірте imsg">

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

      <Step title="Підтвердьте перше сполучення DM (типова `dmPolicy`)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запити на сполучення спливають через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Віддалений Mac через SSH">
    OpenClaw потребує лише сумісний зі stdio `cliPath`, тож ви можете вказати в `cliPath` скрипт-обгортку, який підключається через SSH до віддаленого Mac і запускає `imsg`.

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
      remoteHost: "user@gateway-host", // використовується для отримання вкладень через SCP
      includeAttachments: true,
      // Необов’язково: перевизначити дозволені кореневі каталоги вкладень.
      // Типово включає /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Якщо `remoteHost` не задано, OpenClaw намагається автоматично визначити його, аналізуючи SSH-скрипт-обгортку.
    `remoteHost` має бути у форматі `host` або `user@host` (без пробілів чи параметрів SSH).
    OpenClaw використовує сувору перевірку ключа хоста для SCP, тому ключ хоста ретранслятора вже має бути наявний у `~/.ssh/known_hosts`.
    Шляхи до вкладень перевіряються на відповідність дозволеним кореневим каталогам (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- У Messages має бути виконано вхід на Mac, де запускається `imsg`.
- Для контексту процесу, у якому працює OpenClaw/`imsg`, потрібен Full Disk Access (доступ до БД Messages).
- Для надсилання повідомлень через Messages.app потрібен дозвіл Automation.

<Tip>
Дозволи надаються для кожного контексту процесу. Якщо gateway працює без графічного інтерфейсу (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в тому самому контексті, щоб викликати запити:

```bash
imsg chats --limit 1
# або
imsg send <handle> "test"
```

</Tip>

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.imessage.dmPolicy` керує прямими повідомленнями:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле allowlist: `channels.imessage.allowFrom`.

    Записи allowlist можуть бути handle або цілі чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Політика груп + згадки">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (типово, якщо налаштовано)
    - `open`
    - `disabled`

    Allowlist відправників груп: `channels.imessage.groupAllowFrom`.

    Резервна логіка під час виконання: якщо `groupAllowFrom` не задано, перевірки відправників груп iMessage використовують `allowFrom`, якщо воно доступне.
    Примітка щодо виконання: якщо `channels.imessage` повністю відсутній, під час виконання використовується `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Обмеження за згадками для груп:

    - iMessage не має вбудованих метаданих згадок
    - виявлення згадок використовує шаблони regex (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - якщо шаблони не налаштовані, обмеження за згадками неможливо забезпечити

    Команди керування від авторизованих відправників можуть обходити обмеження за згадками в групах.

  </Tab>

  <Tab title="Сеанси та детерміновані відповіді">
    - DM використовують пряму маршрутизацію; групи — групову.
    - Із типовим `session.dmScope=main` DM iMessage згортаються в основний сеанс агента.
    - Групові сеанси ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді маршрутизуються назад в iMessage з використанням метаданих початкового каналу/цілі.

    Поведінка потоків, схожих на групові:

    Деякі багатосторонні потоки iMessage можуть надходити з `is_group=false`.
    Якщо такий `chat_id` явно налаштовано в `channels.imessage.groups`, OpenClaw обробляє його як груповий трафік (групові обмеження + ізоляція групового сеансу).

  </Tab>
</Tabs>

## Прив’язки розмов ACP

Застарілі чати iMessage також можна прив’язувати до сеансів ACP.

Швидкий потік дій оператора:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в цій самій розмові iMessage маршрутизуватимуться до створеного сеансу ACP.
- `/new` і `/reset` скидають той самий прив’язаний сеанс ACP на місці.
- `/acp close` закриває сеанс ACP і видаляє прив’язку.

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

Див. [ACP Agents](/uk/tools/acp-agents) для спільної поведінки прив’язки ACP.

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Виділений macOS-користувач бота (окрема ідентичність iMessage)">
    Використовуйте окремий Apple ID і macOS-користувача, щоб трафік бота був ізольований від вашого особистого профілю Messages.

    Типовий потік:

    1. Створіть окремого macOS-користувача і виконайте вхід.
    2. Увійдіть у Messages з Apple ID бота в цьому користувачі.
    3. Встановіть `imsg` для цього користувача.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Спрямуйте `channels.imessage.accounts.<id>.cliPath` і `.dbPath` на профіль цього користувача.

    Під час першого запуску можуть знадобитися підтвердження через GUI (Automation + Full Disk Access) у сеансі цього користувача бота.

  </Accordion>

  <Accordion title="Віддалений Mac через Tailscale (приклад)">
    Поширена топологія:

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
    Спочатку переконайтеся, що ключ хоста довірений (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб було заповнено `known_hosts`.

  </Accordion>

  <Accordion title="Шаблон із кількома обліковими записами">
    iMessage підтримує конфігурацію для кожного облікового запису в `channels.imessage.accounts`.

    Для кожного облікового запису можна перевизначати такі поля, як `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, налаштування історії та allowlist кореневих каталогів вкладень.

  </Accordion>
</AccordionGroup>

## Медіа, розбиття на частини та цілі доставки

<AccordionGroup>
  <Accordion title="Вкладення та медіа">
    - отримання вхідних вкладень необов’язкове: `channels.imessage.includeAttachments`
    - шляхи до віддалених вкладень можна отримувати через SCP, якщо задано `remoteHost`
    - шляхи до вкладень мають відповідати дозволеним кореневим каталогам:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (віддалений режим SCP)
      - типовий шаблон кореневого каталогу: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - розмір вихідних медіа визначається `channels.imessage.mediaMaxMb` (типово 16 MB)
  </Accordion>

  <Accordion title="Вихідне розбиття на частини">
    - ліміт частини тексту: `channels.imessage.textChunkLimit` (типово 4000)
    - режим розбиття: `channels.imessage.chunkMode`
      - `length` (типово)
      - `newline` (розбиття спочатку за абзацами)
  </Accordion>

  <Accordion title="Формати адресації">
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

iMessage типово дозволяє ініційовані каналом записи конфігурації (для `/config set|unset`, коли `commands.config: true`).

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

## Усунення неполадок

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
    - підтвердження сполучення (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Групові повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведінку allowlist у `channels.imessage.groups`
    - конфігурацію шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Віддалені вкладення не працюють">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію ключем SSH/SCP з хоста gateway
    - чи є ключ хоста в `~/.ssh/known_hosts` на хості gateway
    - читабельність віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="Запити дозволів macOS було пропущено">
    Повторно запустіть в інтерактивному GUI-терміналі в тому самому контексті користувача/сеансу і підтвердьте запити:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Переконайтеся, що Full Disk Access і Automation надано для контексту процесу, який запускає OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Вказівники на довідник із конфігурації

- [Довідник із конфігурації - iMessage](/uk/gateway/configuration-reference#imessage)
- [Конфігурація Gateway](/uk/gateway/configuration)
- [Сполучення](/uk/channels/pairing)
- [BlueBubbles](/uk/channels/bluebubbles)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
