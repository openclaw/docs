---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання/отримання в iMessage
summary: Нативна підтримка iMessage через imsg (JSON-RPC поверх stdio). Бажаний варіант для нових налаштувань OpenClaw iMessage, коли вимоги до хоста підходять.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Для нових розгортань OpenClaw iMessage починайте тут, коли можете запускати `imsg` на хості macOS Messages із виконаним входом. BlueBubbles лишається доступним як застарілий резервний варіант для наявних налаштувань, що залежать від його HTTP-сервера, вебхуків або розширеніших дій приватного API.
</Note>

Статус: нативна інтеграція із зовнішнім CLI. Gateway запускає `imsg rpc` і взаємодіє через JSON-RPC у stdio (без окремого демона/порту).

<CardGroup cols={3}>
  <Card title="BlueBubbles (застарілий резервний варіант)" icon="message-circle" href="/uk/channels/bluebubbles">
    Продовжуйте використовувати його для наявної маршрутизації на базі BlueBubbles; уникайте його для нових налаштувань, коли підходить imsg.
  </Card>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення iMessage за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Довідник із конфігурації" icon="settings" href="/uk/gateway/config-channels#imessage">
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

      <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Схваліть перше сполучення DM (типовий dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запити на сполучення спливають через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Віддалений Mac через SSH">
    OpenClaw потребує лише сумісний зі stdio `cliPath`, тому можна вказати `cliPath` на скрипт-обгортку, який підключається SSH до віддаленого Mac і запускає `imsg`.

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
    Шляхи вкладень перевіряються щодо дозволених коренів (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- На Mac, де працює `imsg`, має бути виконано вхід у Messages.
- Full Disk Access потрібен для контексту процесу, що запускає OpenClaw/`imsg` (доступ до БД Messages).
- Дозвіл Automation потрібен для надсилання повідомлень через Messages.app.

<Tip>
Дозволи надаються для кожного контексту процесу. Якщо Gateway працює без графічного інтерфейсу (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в тому самому контексті, щоб викликати запити дозволів:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.imessage.dmPolicy` керує особистими повідомленнями:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле списку дозволених: `channels.imessage.allowFrom`.

    Записи списку дозволених можуть бути дескрипторами або цілями чатів (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Політика груп + згадки">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (типово, коли налаштовано)
    - `open`
    - `disabled`

    Список дозволених відправників груп: `channels.imessage.groupAllowFrom`.

    Резервна поведінка під час виконання: якщо `groupAllowFrom` не встановлено, перевірки відправників груп iMessage повертаються до `allowFrom`, коли він доступний.
    Примітка щодо виконання: якщо `channels.imessage` повністю відсутній, під час виконання використовується резервне `groupPolicy="allowlist"` і записується попередження (навіть якщо `channels.defaults.groupPolicy` встановлено).

    Обмеження згадок для груп:

    - iMessage не має нативних метаданих згадок
    - виявлення згадок використовує regex-шаблони (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - без налаштованих шаблонів обмеження за згадками неможливо застосувати

    Керівні команди від авторизованих відправників можуть обходити обмеження за згадками в групах.

  </Tab>

  <Tab title="Сеанси та детерміновані відповіді">
    - DM використовують пряму маршрутизацію; групи використовують групову маршрутизацію.
    - Із типовим `session.dmScope=main` DM iMessage згортаються в основний сеанс агента.
    - Групові сеанси ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді маршрутизуються назад до iMessage з використанням метаданих початкового каналу/цілі.

    Поведінка потоків, схожих на групові:

    Деякі потоки iMessage із кількома учасниками можуть надходити з `is_group=false`.
    Якщо цей `chat_id` явно налаштовано в `channels.imessage.groups`, OpenClaw обробляє його як груповий трафік (групове обмеження + ізоляція групового сеансу).

  </Tab>
</Tabs>

## Прив’язки розмов ACP

Застарілі чати iMessage також можна прив’язувати до сеансів ACP.

Швидкий операторський сценарій:

- Запустіть `/acp spawn codex --bind here` всередині DM або дозволеного групового чату.
- Майбутні повідомлення в тій самій розмові iMessage маршрутизуються до створеного сеансу ACP.
- `/new` і `/reset` скидають той самий прив’язаний сеанс ACP на місці.
- `/acp close` закриває сеанс ACP і видаляє прив’язку.

Підтримуються налаштовані сталі прив’язки через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "imessage"`.

`match.peer.id` може використовувати:

- нормалізований дескриптор DM, як-от `+15555550123` або `user@example.com`
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

Див. [Агенти ACP](/uk/tools/acp-agents) щодо спільної поведінки прив’язок ACP.

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Окремий користувач macOS для бота (окрема ідентичність iMessage)">
    Використовуйте окремий Apple ID і користувача macOS, щоб трафік бота був ізольований від вашого особистого профілю Messages.

    Типовий сценарій:

    1. Створіть окремого користувача macOS або виконайте вхід у нього.
    2. Увійдіть у Messages з Apple ID бота в цьому користувачі.
    3. Установіть `imsg` у цьому користувачі.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Спрямуйте `channels.imessage.accounts.<id>.cliPath` і `.dbPath` на профіль цього користувача.

    Перший запуск може потребувати схвалень у GUI (Automation + Full Disk Access) у сеансі цього користувача-бота.

  </Accordion>

  <Accordion title="Віддалений Mac через Tailscale (приклад)">
    Поширена топологія:

    - Gateway працює на Linux/VM
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
    Спершу переконайтеся, що ключ хоста довірений (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб `known_hosts` було заповнено.

  </Accordion>

  <Accordion title="Шаблон із кількома обліковими записами">
    iMessage підтримує конфігурацію для кожного облікового запису в `channels.imessage.accounts`.

    Кожен обліковий запис може перевизначати такі поля, як `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, налаштування історії та списки дозволених коренів вкладень.

  </Accordion>
</AccordionGroup>

## Медіа, фрагментація та цілі доставлення

<AccordionGroup>
  <Accordion title="Вкладення та медіа">
    - приймання вхідних вкладень необов’язкове: `channels.imessage.includeAttachments`
    - віддалені шляхи вкладень можна отримувати через SCP, коли `remoteHost` встановлено
    - шляхи вкладень мають відповідати дозволеним кореням:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (режим віддаленого SCP)
      - типовий шаблон кореня: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - розмір вихідних медіа використовує `channels.imessage.mediaMaxMb` (типово 16 MB)

  </Accordion>

  <Accordion title="Фрагментація вихідних повідомлень">
    - ліміт текстового фрагмента: `channels.imessage.textChunkLimit` (типово 4000)
    - режим фрагментації: `channels.imessage.chunkMode`
      - `length` (типово)
      - `newline` (розбиття з пріоритетом абзаців)

  </Accordion>

  <Accordion title="Формати адресації">
    Бажані явні цілі:

    - `chat_id:123` (рекомендовано для стабільної маршрутизації)
    - `chat_guid:...`
    - `chat_identifier:...`

    Цілі-дескриптори також підтримуються:

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
  <Accordion title="imsg не знайдено або RPC не підтримується">
    Перевірте бінарний файл і підтримку RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Якщо перевірка повідомляє, що RPC не підтримується, оновіть `imsg`.

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
    - поведінку списку дозволених `channels.imessage.groups`
    - конфігурацію шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Віддалені вкладення не працюють">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію SSH/SCP за ключем із хоста Gateway
    - ключ хоста існує в `~/.ssh/known_hosts` на хості Gateway
    - доступність читання віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="Запити дозволів macOS було пропущено">
    Повторно запустіть в інтерактивному GUI-терміналі в тому самому контексті користувача/сеансу й схваліть запити:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Переконайтеся, що Full Disk Access + Automation надано для контексту процесу, який запускає OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Покажчики довідника з конфігурації

- [Довідник із конфігурації - iMessage](/uk/gateway/config-channels#imessage)
- [Конфігурація Gateway](/uk/gateway/configuration)
- [Сполучення](/uk/channels/pairing)
- [BlueBubbles](/uk/channels/bluebubbles)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація через прямі повідомлення та процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
