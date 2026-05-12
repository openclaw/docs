---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання/отримання iMessage
summary: Нативна підтримка iMessage через imsg (JSON-RPC через stdio), із діями приватного API для відповідей, реакцій, ефектів, вкладень і керування групами. Рекомендовано для нових налаштувань OpenClaw iMessage, коли вимоги до хоста виконуються.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Для розгортань OpenClaw iMessage використовуйте `imsg` на хості macOS Messages, де виконано вхід. Якщо ваш Gateway працює на Linux або Windows, вкажіть у `channels.imessage.cliPath` SSH-обгортку, яка запускає `imsg` на Mac.

**Наздоганяння після простою Gateway вмикається явно.** Коли його ввімкнено (`channels.imessage.catchup.enabled: true`), Gateway під час наступного запуску повторно відтворює вхідні повідомлення, що потрапили до `chat.db`, доки він був офлайн (збій, перезапуск, сон Mac). За замовчуванням вимкнено — див. [Наздоганяння після простою Gateway](#catching-up-after-gateway-downtime). Закриває [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Підтримку BlueBubbles видалено. Мігруйте конфігурації `channels.bluebubbles` до `channels.imessage`; OpenClaw підтримує iMessage лише через `imsg`. Почніть із [Видалення BlueBubbles і шлях imsg для iMessage](/uk/announcements/bluebubbles-imessage) для короткого оголошення або [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) для повної таблиці міграції.
</Warning>

Стан: нативна інтеграція із зовнішнім CLI. Gateway запускає `imsg rpc` і взаємодіє через JSON-RPC у stdio (без окремого демона/порту). Розширені дії потребують `imsg launch` і успішної перевірки приватного API.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Відповіді, tapback-реакції, ефекти, вкладення та керування групами.
  </Card>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення iMessage за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Використовуйте SSH-обгортку, коли Gateway не працює на Mac із Messages.
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
imsg launch
openclaw channels status --probe
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

        Запити сполучення спливають через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw потребує лише сумісний зі stdio `cliPath`, тож ви можете вказати в `cliPath` сценарій-обгортку, який підключається через SSH до віддаленого Mac і запускає `imsg`.

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

    Якщо `remoteHost` не встановлено, OpenClaw намагається автоматично визначити його, розібравши SSH-сценарій обгортки.
    `remoteHost` має бути `host` або `user@host` (без пробілів чи параметрів SSH).
    OpenClaw використовує сувору перевірку ключа хоста для SCP, тому ключ хоста ретранслятора вже має існувати в `~/.ssh/known_hosts`.
    Шляхи вкладень перевіряються за дозволеними коренями (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- На Mac, де запущено `imsg`, має бути виконано вхід у Messages.
- Для контексту процесу, що запускає OpenClaw/`imsg`, потрібен Full Disk Access (доступ до БД Messages).
- Для надсилання повідомлень через Messages.app потрібен дозвіл Automation.
- Для розширених дій (реакція / редагування / скасування надсилання / відповідь у гілці / ефекти / групові операції) потрібно вимкнути System Integrity Protection — див. [Увімкнення приватного API imsg](#enabling-the-imsg-private-api) нижче. Базове надсилання й отримання тексту та медіа працює без цього.

<Tip>
Дозволи надаються для кожного контексту процесу. Якщо Gateway працює без графічного інтерфейсу (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в тому самому контексті, щоб викликати запити дозволів:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Увімкнення приватного API imsg

`imsg` постачається у двох робочих режимах:

- **Базовий режим** (за замовчуванням, зміни SIP не потрібні): вихідний текст і медіа через `send`, вхідне спостереження/історія, список чатів. Саме це ви отримуєте одразу після свіжого `brew install steipete/tap/imsg` плюс стандартні дозволи macOS, наведені вище.
- **Режим приватного API**: `imsg` інʼєктує допоміжну dylib у `Messages.app`, щоб викликати внутрішні функції `IMCore`. Це відкриває `react`, `edit`, `unsend`, `reply` (у гілці), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, а також індикатори набору тексту й підтвердження прочитання.

Щоб отримати поверхню розширених дій, яку документує ця сторінка каналу, потрібен режим приватного API. README `imsg` прямо зазначає цю вимогу:

> Розширені функції, як-от `read`, `typing`, `launch`, розширене надсилання через bridge, зміна повідомлень і керування чатами, вмикаються явно. Вони потребують вимкненого SIP та інʼєкції допоміжної dylib у `Messages.app`. `imsg launch` відмовляється виконувати інʼєкцію, коли SIP увімкнено.

Техніка інʼєкції допоміжного компонента використовує власну dylib `imsg`, щоб отримати доступ до приватних API Messages. У шляху OpenClaw iMessage немає стороннього сервера або середовища виконання BlueBubbles.

<Warning>
**Вимкнення SIP — це реальний компроміс безпеки.** SIP є одним з основних механізмів захисту macOS від виконання зміненого системного коду; його вимкнення на рівні всієї системи відкриває додаткову поверхню атаки й побічні ефекти. Зокрема, **вимкнення SIP на Mac з Apple Silicon також вимикає можливість встановлювати й запускати iOS-застосунки на вашому Mac**.

Сприймайте це як свідомий операційний вибір, а не як стандарт. Якщо ваша модель загроз не допускає вимкненого SIP, вбудований iMessage обмежується базовим режимом — лише надсилання й отримання тексту та медіа, без реакцій / редагування / скасування надсилання / ефектів / групових операцій.
</Warning>

### Налаштування

1. **Встановіть (або оновіть) `imsg`** на Mac, де працює Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Вивід `imsg status --json` повідомляє `bridge_version`, `rpc_methods` і `selectors` для кожного методу, щоб ви могли побачити, що підтримує поточна збірка, перш ніж почати.

2. **Вимкніть System Integrity Protection.** Це залежить від версії macOS, оскільки базова вимога Apple залежить від ОС і апаратного забезпечення:
   - **macOS 10.13–10.15 (Sierra–Catalina):** вимкніть Library Validation через Terminal, перезавантажтеся в Recovery Mode, виконайте `csrutil disable`, перезапустіть.
   - **macOS 11+ (Big Sur і новіші), Intel:** Recovery Mode (або Internet Recovery), `csrutil disable`, перезапустіть.
   - **macOS 11+, Apple Silicon:** послідовність запуску з кнопкою живлення для входу в Recovery; у нещодавніх версіях macOS утримуйте клавішу **Left Shift**, коли натискаєте Continue, потім `csrutil disable`. Налаштування віртуальних машин мають окремий процес — спершу зробіть знімок VM.
   - **macOS 26 / Tahoe:** політики library-validation і перевірки приватних entitlements `imagent` стали ще суворішими; `imsg` може потребувати оновленої збірки, щоб не відставати. Якщо інʼєкція `imsg launch` або конкретні `selectors` починають повертати false після великого оновлення macOS, перевірте нотатки до випуску `imsg`, перш ніж припускати, що крок із SIP виконано успішно.

   Дотримуйтеся процесу Apple Recovery Mode для вашого Mac, щоб вимкнути SIP перед запуском `imsg launch`.

3. **Інʼєктуйте допоміжний компонент.** Коли SIP вимкнено й у Messages.app виконано вхід:

   ```bash
   imsg launch
   ```

   `imsg launch` відмовляється виконувати інʼєкцію, якщо SIP усе ще ввімкнено, тож це також слугує підтвердженням, що крок 2 спрацював.

4. **Перевірте bridge з OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Запис iMessage має повідомити `works`, а `imsg status --json | jq '.selectors'` має показати `retractMessagePart: true` плюс ті селектори редагування / набору тексту / прочитання, які надає ваша збірка macOS. Перевірка для кожного методу в Plugin OpenClaw у `actions.ts` рекламує лише дії, чий базовий селектор має значення `true`, тому поверхня дій, яку ви бачите у списку інструментів агента, відображає те, що bridge справді може виконати на цьому хості.

Якщо `openclaw channels status --probe` повідомляє, що канал має стан `works`, але конкретні дії під час диспетчеризації викидають "iMessage `<action>` requires the imsg private API bridge", запустіть `imsg launch` знову — допоміжний компонент може відʼєднатися (перезапуск Messages.app, оновлення ОС тощо), а кешований стан `available: true` продовжить рекламувати дії, доки наступна перевірка не оновить його.

### Коли ви не можете вимкнути SIP

Якщо вимкнення SIP неприйнятне для вашої моделі загроз:

- `imsg` повертається до базового режиму — лише текст + медіа + отримання.
- Plugin OpenClaw і надалі рекламує надсилання тексту/медіа та моніторинг вхідних повідомлень; він просто приховує `react`, `edit`, `unsend`, `reply`, `sendWithEffect` і групові операції з поверхні дій (відповідно до перевірки можливостей для кожного методу).
- Ви можете запустити окремий Mac не з Apple Silicon (або виділений бот-Mac) із вимкненим SIP для навантаження iMessage, залишивши SIP увімкненим на основних пристроях. Див. [Виділений користувач-бот macOS (окрема ідентичність iMessage)](#deployment-patterns) нижче.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` керує особистими повідомленнями:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле списку дозволів: `channels.imessage.allowFrom`.

    Записи списку дозволів можуть бути хендлами, статичними групами доступу відправників (`accessGroup:<name>`) або цілями чатів (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (за замовчуванням, коли налаштовано)
    - `open`
    - `disabled`

    Список дозволів відправників груп: `channels.imessage.groupAllowFrom`.

    Записи `groupAllowFrom` також можуть посилатися на статичні групи доступу відправників (`accessGroup:<name>`).

    Резервна поведінка під час виконання: якщо `groupAllowFrom` не задано, перевірки відправників груп iMessage повертаються до `allowFrom`, коли він доступний.
    Примітка щодо виконання: якщо `channels.imessage` повністю відсутній, виконання повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо `channels.defaults.groupPolicy` встановлено).

    <Warning>
    Маршрутизація груп має **два** шлюзи списку дозволів, які виконуються послідовно, і обидва мають пройти:

    1. **Список дозволів відправників / цілей чатів** (`channels.imessage.groupAllowFrom`) — хендл, `chat_guid`, `chat_identifier` або `chat_id`.
    2. **Реєстр груп** (`channels.imessage.groups`) — з `groupPolicy: "allowlist"` цей шлюз потребує або wildcard-запису `groups: { "*": { ... } }` (встановлює `allowAll = true`), або явного запису для кожного `chat_id` у `groups`.

    Якщо в шлюзі 2 нічого немає, кожне групове повідомлення відкидається. Plugin виводить два сигнали рівня `warn` на стандартному рівні журналювання:

    - одноразово для кожного облікового запису під час запуску: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - одноразово для кожного `chat_id` під час виконання: `imessage: dropping group message from chat_id=<id> ...`

    Особисті повідомлення продовжують працювати, оскільки вони проходять іншим шляхом коду.

    Мінімальна конфігурація, щоб групи продовжували працювати з `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    If those `warn` lines appear in the gateway log, gate 2 is dropping — add the `groups` block.
    </Warning>

    Mention gating for groups:

    - iMessage has no native mention metadata
    - mention detection uses regex patterns (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - with no configured patterns, mention gating cannot be enforced

    Control commands from authorized senders can bypass mention gating in groups.

    Per-group `systemPrompt`:

    Each entry under `channels.imessage.groups.*` accepts an optional `systemPrompt` string. The value is injected into the agent's system prompt on every turn that handles a message in that group. Resolution mirrors the per-group prompt resolution used by `channels.whatsapp.groups`:

    1. **Group-specific system prompt** (`groups["<chat_id>"].systemPrompt`): used when the specific group entry exists in the map **and** its `systemPrompt` key is defined. If `systemPrompt` is an empty string (`""`) the wildcard is suppressed and no system prompt is applied to that group.
    2. **Group wildcard system prompt** (`groups["*"].systemPrompt`): used when the specific group entry is absent from the map entirely, or when it exists but defines no `systemPrompt` key.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Per-group prompts only apply to group messages — direct messages in this channel are unaffected.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMs use direct routing; groups use group routing.
    - With default `session.dmScope=main`, iMessage DMs collapse into the agent main session.
    - Group sessions are isolated (`agent:<agentId>:imessage:group:<chat_id>`).
    - Replies route back to iMessage using originating channel/target metadata.

    Group-ish thread behavior:

    Some multi-participant iMessage threads can arrive with `is_group=false`.
    If that `chat_id` is explicitly configured under `channels.imessage.groups`, OpenClaw treats it as group traffic (group gating + group session isolation).

  </Tab>
</Tabs>

## ACP conversation bindings

Legacy iMessage chats can also be bound to ACP sessions.

Fast operator flow:

- Run `/acp spawn codex --bind here` inside the DM or allowed group chat.
- Future messages in that same iMessage conversation route to the spawned ACP session.
- `/new` and `/reset` reset the same bound ACP session in place.
- `/acp close` closes the ACP session and removes the binding.

Configured persistent bindings are supported through top-level `bindings[]` entries with `type: "acp"` and `match.channel: "imessage"`.

`match.peer.id` can use:

- normalized DM handle such as `+15555550123` or `user@example.com`
- `chat_id:<id>` (recommended for stable group bindings)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Example:

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

See [ACP Agents](/uk/tools/acp-agents) for shared ACP binding behavior.

## Deployment patterns

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Use a dedicated Apple ID and macOS user so bot traffic is isolated from your personal Messages profile.

    Typical flow:

    1. Create/sign in a dedicated macOS user.
    2. Sign into Messages with the bot Apple ID in that user.
    3. Install `imsg` in that user.
    4. Create SSH wrapper so OpenClaw can run `imsg` in that user context.
    5. Point `channels.imessage.accounts.<id>.cliPath` and `.dbPath` to that user profile.

    First run may require GUI approvals (Automation + Full Disk Access) in that bot user session.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Common topology:

    - gateway runs on Linux/VM
    - iMessage + `imsg` runs on a Mac in your tailnet
    - `cliPath` wrapper uses SSH to run `imsg`
    - `remoteHost` enables SCP attachment fetches

    Example:

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

    Use SSH keys so both SSH and SCP are non-interactive.
    Ensure the host key is trusted first (for example `ssh bot@mac-mini.tailnet-1234.ts.net`) so `known_hosts` is populated.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage supports per-account config under `channels.imessage.accounts`.

    Each account can override fields such as `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, history settings, and attachment root allowlists.

  </Accordion>
</AccordionGroup>

## Media, chunking, and delivery targets

<AccordionGroup>
  <Accordion title="Attachments and media">
    - inbound attachment ingestion is **off by default** — set `channels.imessage.includeAttachments: true` to forward photos, voice memos, video, and other attachments to the agent. With it disabled, attachment-only iMessages are dropped before reaching the agent and may produce no `Inbound message` log line at all.
    - remote attachment paths can be fetched via SCP when `remoteHost` is set
    - attachment paths must match allowed roots:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (remote SCP mode)
      - default root pattern: `/Users/*/Library/Messages/Attachments`
    - SCP uses strict host-key checking (`StrictHostKeyChecking=yes`)
    - outbound media size uses `channels.imessage.mediaMaxMb` (default 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - text chunk limit: `channels.imessage.textChunkLimit` (default 4000)
    - chunk mode: `channels.imessage.chunkMode`
      - `length` (default)
      - `newline` (paragraph-first splitting)

  </Accordion>

  <Accordion title="Addressing formats">
    Preferred explicit targets:

    - `chat_id:123` (recommended for stable routing)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle targets are also supported:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Private API actions

When `imsg launch` is running and `openclaw channels status --probe` reports `privateApi.available: true`, the message tool can use iMessage-native actions in addition to normal text sends.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: Add/remove iMessage tapbacks (`messageId`, `emoji`, `remove`). Supported tapbacks map to love, like, dislike, laugh, emphasize, and question.
    - **reply**: Send a threaded reply to an existing message (`messageId`, `text` or `message`, plus `chatGuid`, `chatId`, `chatIdentifier`, or `to`).
    - **sendWithEffect**: Send text with an iMessage effect (`text` or `message`, `effect` or `effectId`).
    - **edit**: Edit a sent message on supported macOS/private API versions (`messageId`, `text` or `newText`).
    - **unsend**: Retract a sent message on supported macOS/private API versions (`messageId`).
    - **upload-file**: Send media/files (`buffer` as base64 or a hydrated `media`/`path`/`filePath`, `filename`, optional `asVoice`). Legacy alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Manage group chats when the current target is a group conversation.

  </Accordion>

  <Accordion title="Message IDs">
    Inbound iMessage context includes both short `MessageSid` values and full message GUIDs when available. Short IDs are scoped to the recent in-memory reply cache and are checked against the current chat before use. If a short ID has expired or belongs to another chat, retry with the full `MessageSidFull`.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw hides private API actions only when the cached probe status says the bridge is unavailable. If the status is unknown, actions remain visible and dispatch probes lazily so the first action can succeed after `imsg launch` without a separate manual status refresh.

  </Accordion>

  <Accordion title="Read receipts and typing">
    When the private API bridge is up, accepted inbound chats are marked read before dispatch and a typing bubble is shown to the sender while the agent generates. Disable read-marking with:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Older `imsg` builds that pre-date the per-method capability list will gate off typing/read silently; OpenClaw logs a one-time warning per restart so the missing receipt is attributable.

  </Accordion>

  <Accordion title="Inbound tapbacks">
    OpenClaw subscribes to iMessage tapbacks and routes accepted reactions as system events instead of normal message text, so a user tapback does not trigger an ordinary reply loop.

    Notification mode is controlled by `channels.imessage.reactionNotifications`:

    - `"own"` (default): notify only when users react to bot-authored messages.
    - `"all"`: notify for all inbound tapbacks from authorized senders.
    - `"off"`: ignore inbound tapbacks.

    Per-account overrides use `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>
</AccordionGroup>

## Config writes

iMessage allows channel-initiated config writes by default (for `/config set|unset` when `commands.config: true`).

Disable:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescing split-send DMs (command + URL in one composition)

When a user types a command and a URL together — e.g. `Dump https://example.com/article` — Apple's Messages app splits the send into **two separate `chat.db` rows**:

1. A text message (`"Dump"`).
2. A URL-preview balloon (`"https://..."`) with OG-preview images as attachments.

The two rows arrive at OpenClaw ~0.8-2.0 s apart on most setups. Without coalescing, the agent receives the command alone on turn 1, replies (often "send me the URL"), and only sees the URL on turn 2 — at which point the command context is already lost. This is Apple's send pipeline, not anything OpenClaw or `imsg` introduces.

`channels.imessage.coalesceSameSenderDms` вмикає для особистого повідомлення об’єднання послідовних рядків від того самого відправника в один хід агента. Групові чати й далі надсилаються по одному повідомленню, щоб зберегти структуру ходів із кількома користувачами.

<Tabs>
  <Tab title="Коли вмикати">
    Увімкніть, коли:

    - Ви постачаєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL-адреси, зображення або довгий вміст разом із командами.
    - Ви можете прийняти додаткову затримку ходу особистого повідомлення (див. нижче).

    Залиште вимкненим, коли:

    - Вам потрібна мінімальна затримка команди для однословних тригерів особистих повідомлень.
    - Усі ваші сценарії — це одноразові команди без подальших payload-повідомлень.

  </Tab>
  <Tab title="Увімкнення">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Коли прапорець увімкнено й немає явного `messages.inbound.byChannel.imessage`, вікно debounce розширюється до **2500 ms** (застаріле типове значення — 0 ms, тобто без debounce). Ширше вікно потрібне, бо частота розділеного надсилання Apple у 0.8-2.0 s не вкладається у вужче типове значення.

    Щоб налаштувати вікно самостійно:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Компроміси">
    - **Додаткова затримка для особистих повідомлень.** Коли прапорець увімкнено, кожне особисте повідомлення (зокрема автономні керівні команди та одиночні текстові продовження) очікує до завершення вікна debounce перед надсиланням, на випадок якщо надходить рядок із payload. Повідомлення групового чату надсилаються миттєво.
    - **Об’єднаний вивід обмежено.** Об’єднаний текст обмежено 4000 символами з явним маркером `…[truncated]`; вкладення — 20; записи джерел — 10 (понад це зберігаються перший і найновіший). Кожен GUID джерела відстежується в `coalescedMessageGuids` для подальшої телеметрії.
    - **Лише особисті повідомлення.** Групові чати переходять до надсилання по одному повідомленню, тож бот залишається чутливим, коли пише кілька людей.
    - **Добровільне ввімкнення, окремо для каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не змінюються. Застарілі конфігурації BlueBubbles, які встановлюють `channels.bluebubbles.coalesceSameSenderDms`, мають перенести це значення в `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Сценарії й те, що бачить агент

| Користувач створює                                                | `chat.db` створює     | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 ms                                      |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (одне надсилання)                       | 2 рядки з інтервалом ~1 s | Два ходи агента: лише "Dump", потім URL | Один хід: об’єднаний текст `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 рядки               | Два ходи (вкладення відкидається під час об’єднання) | Один хід: текст + зображення збережено                                   |
| `/status` (автономна команда)                                      | 1 рядок               | Миттєве надсилання                      | **Очікування до завершення вікна, потім надсилання**                    |
| URL вставлено окремо                                               | 1 рядок               | Миттєве надсилання                      | Миттєве надсилання (лише один запис у bucket)                            |
| Текст + URL надіслано як два навмисно окремі повідомлення з інтервалом у хвилини | 2 рядки поза вікном   | Два ходи                                | Два ходи (вікно завершується між ними)                                   |
| Швидкий потік (>10 малих особистих повідомлень у межах вікна)      | N рядків              | N ходів                                 | Один хід, обмежений вивід (перший + найновіший, застосовано ліміти тексту/вкладень) |
| Двоє людей пишуть у груповому чаті                                 | N рядків від M відправників | M+ ходів (по одному для кожного bucket відправника) | M+ ходів — групові чати не об’єднуються                                  |

## Наздоганяння після простою Gateway

Коли Gateway офлайн (збій, перезапуск, сон Mac, вимкнена машина), `imsg watch` відновлюється з поточного стану `chat.db`, щойно Gateway знову запускається — усе, що надійшло під час проміжку, типово ніколи не буде побачено. Catchup повторно відтворює ці повідомлення під час наступного запуску, щоб агент мовчки не пропускав вхідний трафік.

Catchup **вимкнено типово**. Увімкніть його для кожного каналу:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Як це виконується

Один прохід на кожен запуск `monitorIMessageProvider`, у послідовності: готовність `imsg launch` → `watch.subscribe` → `performIMessageCatchup` → цикл live-надсилання. Сам Catchup використовує `chats.list` + `messages.history` для кожного чату через той самий JSON-RPC клієнт, який використовує `imsg watch`. Усе, що надходить під час проходу Catchup, проходить через live-надсилання звичайним чином; наявний кеш inbound-dedupe поглинає будь-яке перекриття з повторно відтвореними рядками.

Кожен повторно відтворений рядок подається через live-шлях надсилання (`evaluateIMessageInbound` + `dispatchInboundMessage`), тому allowlist-и, політика груп, debouncer, echo cache і сповіщення про прочитання поводяться однаково для повторно відтворених і live-повідомлень.

### Семантика курсора й повторів

Catchup зберігає курсор для кожного облікового запису в `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (типовий каталог стану OpenClaw — `~/.openclaw`, його можна перевизначити через `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Курсор просувається після кожного успішного надсилання й утримується, коли надсилання рядка кидає помилку — наступний запуск повторює той самий рядок з утриманого курсора.
- Після `maxFailureRetries` послідовних кидань помилки для того самого `guid` Catchup записує `warn` і примусово просуває курсор за проблемне повідомлення, щоб наступні запуски могли рухатися далі.
- GUID-и, щодо яких уже припинено спроби, пропускаються під час виявлення (без спроби надсилання) у подальших запусках і рахуються в `skippedGivenUp` у підсумку запуску.

### Видимі оператору сигнали

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Рядок `WARN ... capped to perRunLimit` означає, що один запуск не вичерпав увесь backlog. Збільште `perRunLimit` (макс. 500), якщо ваші проміжки регулярно перевищують типовий прохід у 50 рядків.

### Коли залишати вимкненим

- Gateway працює безперервно з watchdog-автоперезапуском, а проміжки завжди < кількох секунд — типове вимкнення підходить.
- Обсяг особистих повідомлень низький, а пропущені повідомлення не змінять поведінку агента — початкове вікно `firstRunLookbackMinutes` може надіслати несподіваний старий контекст під час першого ввімкнення.

Коли ви вмикаєте Catchup, перший запуск без курсора дивиться назад лише на `firstRunLookbackMinutes` (типово 30 min), а не на повне вікно `maxAgeMinutes` — це запобігає повторному відтворенню довгої історії повідомлень, що передували ввімкненню.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="imsg не знайдено або RPC не підтримується">
    Перевірте бінарний файл і підтримку RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Якщо probe повідомляє, що RPC не підтримується, оновіть `imsg`. Якщо дії private API недоступні, запустіть `imsg launch` у сеансі користувача macOS, який увійшов у систему, і повторіть probe. Якщо Gateway не запущено на macOS, використайте налаштування віддаленого Mac через SSH вище замість типового локального шляху `imsg`.

  </Accordion>

  <Accordion title="Gateway не запущено на macOS">
    Типовий `cliPath: "imsg"` має виконуватися на Mac, де виконано вхід у Messages. На Linux або Windows встановіть `channels.imessage.cliPath` на wrapper-скрипт, який підключається до цього Mac через SSH і запускає `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Потім запустіть:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Особисті повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - схвалення pairing (`openclaw pairing list imessage`)

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
    - автентифікацію ключем SSH/SCP з хоста Gateway
    - наявність ключа хоста в `~/.ssh/known_hosts` на хості Gateway
    - доступність віддаленого шляху для читання на Mac, де працює Messages

  </Accordion>

  <Accordion title="Запити дозволів macOS було пропущено">
    Повторно запустіть в інтерактивному GUI-терміналі в тому самому контексті користувача/сеансу й підтвердьте запити:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Переконайтеся, що Full Disk Access + Automation надані для контексту процесу, який запускає OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Вказівники довідника конфігурації

- [Довідник конфігурації - iMessage](/uk/gateway/config-channels#imessage)
- [Конфігурація Gateway](/uk/gateway/configuration)
- [Pairing](/uk/channels/pairing)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Видалення BlueBubbles і шлях imsg iMessage](/uk/announcements/bluebubbles-imessage) — оголошення та підсумок міграції
- [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) — таблиця перекладу конфігурації та покрокове переключення
- [Pairing](/uk/channels/pairing) — автентифікація особистих повідомлень і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату й gating за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
