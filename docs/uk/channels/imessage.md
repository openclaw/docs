---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання/отримання iMessage
summary: Нативна підтримка iMessage через imsg (JSON-RPC через stdio), з діями приватного API для відповідей, tapback-реакцій, ефектів, вкладень і керування групами. Рекомендовано для нових налаштувань OpenClaw iMessage, коли вимоги до хоста виконуються.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Для розгортань OpenClaw iMessage використовуйте `imsg` на хості macOS Messages із виконаним входом. Якщо ваш Gateway працює на Linux або Windows, спрямуйте `channels.imessage.cliPath` на SSH-обгортку, яка запускає `imsg` на Mac.

**Доназдоганяння після простою Gateway вмикається явно.** Коли ввімкнено (`channels.imessage.catchup.enabled: true`), gateway повторно відтворює вхідні повідомлення, що потрапили в `chat.db`, поки він був офлайн (збій, перезапуск, сон Mac), під час наступного запуску. Типово вимкнено — див. [Доназдоганяння після простою gateway](#catching-up-after-gateway-downtime). Закриває [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Підтримку BlueBubbles вилучено. Перенесіть конфігурації `channels.bluebubbles` до `channels.imessage`; OpenClaw підтримує iMessage лише через `imsg`.
</Warning>

Стан: нативна інтеграція зовнішнього CLI. Gateway запускає `imsg rpc` і обмінюється даними через JSON-RPC у stdio (без окремого демона/порту). Розширені дії потребують `imsg launch` і успішної перевірки приватного API.

<CardGroup cols={3}>
  <Card title="Дії приватного API" icon="wand-sparkles" href="#private-api-actions">
    Відповіді, tapbacks, ефекти, вкладення та керування групами.
  </Card>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    DMs iMessage типово використовують режим сполучення.
  </Card>
  <Card title="Віддалений Mac" icon="terminal" href="#remote-mac-over-ssh">
    Використовуйте SSH-обгортку, коли Gateway не працює на Mac із Messages.
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
imsg launch
openclaw channels status --probe
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
    OpenClaw потребує лише сумісного зі stdio `cliPath`, тому можна спрямувати `cliPath` на сценарій-обгортку, який підключається SSH до віддаленого Mac і запускає `imsg`.

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

    Якщо `remoteHost` не встановлено, OpenClaw намагається автоматично визначити його, розібравши сценарій SSH-обгортки.
    `remoteHost` має бути `host` або `user@host` (без пробілів чи параметрів SSH).
    OpenClaw використовує сувору перевірку ключа хоста для SCP, тому ключ хоста-посередника вже має існувати в `~/.ssh/known_hosts`.
    Шляхи вкладень перевіряються відносно дозволених коренів (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- На Mac, де працює `imsg`, має бути виконано вхід у Messages.
- Full Disk Access потрібен для контексту процесу, що запускає OpenClaw/`imsg` (доступ до БД Messages).
- Дозвіл Automation потрібен для надсилання повідомлень через Messages.app.
- Для розширених дій (react / edit / unsend / threaded reply / effects / group ops) System Integrity Protection має бути вимкнено — див. [Увімкнення приватного API imsg](#enabling-the-imsg-private-api) нижче. Базове надсилання/отримання тексту й медіа працює без цього.

<Tip>
Дозволи надаються для кожного контексту процесу. Якщо gateway працює безголово (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в тому самому контексті, щоб викликати запити дозволів:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Увімкнення приватного API imsg

`imsg` постачається у двох режимах роботи:

- **Базовий режим** (типовий, зміни SIP не потрібні): вихідний текст і медіа через `send`, вхідний watch/history, список чатів. Це те, що ви отримуєте одразу після свіжого `brew install steipete/tap/imsg` разом зі стандартними дозволами macOS вище.
- **Режим приватного API**: `imsg` інжектує допоміжну dylib у `Messages.app`, щоб викликати внутрішні функції `IMCore`. Це відкриває `react`, `edit`, `unsend`, `reply` (threaded), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, а також індикатори введення та сповіщення про прочитання.

Щоб отримати поверхню розширених дій, яку документує ця сторінка каналу, потрібен режим приватного API. README `imsg` прямо вказує на цю вимогу:

> Розширені можливості, як-от `read`, `typing`, `launch`, розширене надсилання з підтримкою моста, зміна повідомлень і керування чатами, вмикаються явно. Вони потребують вимкненого SIP і інжекції допоміжної dylib у `Messages.app`. `imsg launch` відмовляється виконувати інжекцію, коли SIP увімкнено.

Техніка інжекції помічника використовує власну dylib `imsg`, щоб отримати доступ до приватних API Messages. У шляху OpenClaw iMessage немає стороннього сервера чи середовища виконання BlueBubbles.

<Warning>
**Вимкнення SIP є реальним компромісом безпеки.** SIP є одним з основних захистів macOS від запуску зміненого системного коду; його системне вимкнення відкриває додаткову поверхню атак і побічні ефекти. Зокрема, **вимкнення SIP на Apple Silicon Macs також вимикає можливість установлювати й запускати iOS apps на вашому Mac**.

Сприймайте це як свідомий операційний вибір, а не як типове налаштування. Якщо ваша модель загроз не допускає вимкненого SIP, вбудований iMessage обмежений базовим режимом — лише надсилання/отримання тексту й медіа, без реакцій / редагування / скасування надсилання / ефектів / операцій із групами.
</Warning>

### Налаштування

1. **Установіть (або оновіть) `imsg`** на Mac, де працює Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Вивід `imsg status --json` повідомляє `bridge_version`, `rpc_methods` і `selectors` для кожного методу, щоб ви могли побачити, що підтримує поточна збірка, перш ніж почати.

2. **Вимкніть System Integrity Protection.** Це залежить від версії macOS, оскільки базова вимога Apple залежить від ОС і апаратного забезпечення:
   - **macOS 10.13–10.15 (Sierra–Catalina):** вимкніть Library Validation через Terminal, перезавантажтеся в Recovery Mode, виконайте `csrutil disable`, перезапустіть.
   - **macOS 11+ (Big Sur і новіші), Intel:** Recovery Mode (або Internet Recovery), `csrutil disable`, перезапуск.
   - **macOS 11+, Apple Silicon:** послідовність запуску кнопкою живлення для входу в Recovery; у нових версіях macOS утримуйте клавішу **Left Shift**, коли натискаєте Continue, потім `csrutil disable`. Налаштування віртуальної машини мають окремий потік — спершу зробіть знімок VM.
   - **macOS 26 / Tahoe:** політики перевірки бібліотек і перевірки приватних прав `imagent` стали ще суворішими; `imsg` може потребувати оновленої збірки, щоб не відставати. Якщо інжекція `imsg launch` або певні `selectors` починають повертати false після великого оновлення macOS, перевірте примітки до випуску `imsg`, перш ніж вважати, що крок SIP успішний.

   Дотримуйтеся потоку Apple Recovery-mode для вашого Mac, щоб вимкнути SIP перед запуском `imsg launch`.

3. **Інжектуйте помічника.** Коли SIP вимкнено, а в Messages.app виконано вхід:

   ```bash
   imsg launch
   ```

   `imsg launch` відмовляється виконувати інжекцію, коли SIP досі увімкнено, тому це також слугує підтвердженням, що крок 2 спрацював.

4. **Перевірте міст з OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Запис iMessage має повідомити `works`, а `imsg status --json | jq '.selectors'` має показати `retractMessagePart: true` плюс ті селектори редагування / введення / читання, які надає ваша збірка macOS. По-методне gating Plugin OpenClaw у `actions.ts` рекламує лише дії, чий базовий selector дорівнює `true`, тому поверхня дій, яку ви бачите у списку інструментів агента, відображає те, що міст справді може виконати на цьому хості.

Якщо `openclaw channels status --probe` повідомляє канал як `works`, але певні дії під час dispatch викидають "iMessage `<action>` requires the imsg private API bridge", знову запустіть `imsg launch` — помічник може випасти (перезапуск Messages.app, оновлення ОС тощо), а кешований стан `available: true` продовжить рекламувати дії, доки наступна перевірка не оновить його.

### Коли ви не можете вимкнути SIP

Якщо SIP-disabled неприйнятний для вашої моделі загроз:

- `imsg` повертається до базового режиму — лише текст + медіа + отримання.
- Plugin OpenClaw усе ще рекламує надсилання тексту/медіа та вхідний моніторинг; він просто приховує `react`, `edit`, `unsend`, `reply`, `sendWithEffect` і групові операції з поверхні дій (відповідно до по-методного gate можливостей).
- Можна запустити окремий Mac без Apple Silicon (або виділений bot Mac) із вимкненим SIP для навантаження iMessage, залишивши SIP увімкненим на основних пристроях. Див. [Виділений користувач macOS для бота (окрема ідентичність iMessage)](#deployment-patterns) нижче.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.imessage.dmPolicy` керує прямими повідомленнями:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле списку дозволених: `channels.imessage.allowFrom`.

    Записи списку дозволених можуть бути handles, статичними групами доступу відправників (`accessGroup:<name>`) або цілями чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Політика груп + згадки">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (типово, коли налаштовано)
    - `open`
    - `disabled`

    Список дозволених відправників груп: `channels.imessage.groupAllowFrom`.

    Записи `groupAllowFrom` також можуть посилатися на статичні групи доступу відправників (`accessGroup:<name>`).

    Резервна поведінка під час виконання: якщо `groupAllowFrom` не задано, перевірки відправників груп iMessage повертаються до `allowFrom`, коли він доступний.
    Примітка щодо виконання: якщо `channels.imessage` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` і записує попередження в лог (навіть якщо `channels.defaults.groupPolicy` задано).

    <Warning>
    Маршрутизація груп має **два** шлюзи списку дозволених, які виконуються один за одним, і обидва мають пройти:

    1. **Список дозволених відправників / цілей чату** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` або `chat_id`.
    2. **Реєстр груп** (`channels.imessage.groups`) — з `groupPolicy: "allowlist"` цей шлюз потребує або wildcard-запису `groups: { "*": { ... } }` (встановлює `allowAll = true`), або явного запису для кожного `chat_id` у `groups`.

    Якщо в gate 2 нічого немає, кожне групове повідомлення відкидається. Plugin видає два сигнали рівня `warn` на типовому рівні логування:

    - одноразово для кожного облікового запису під час запуску: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - одноразово для кожного `chat_id` під час виконання: `imessage: dropping group message from chat_id=<id> ...`

    DMs продовжують працювати, бо вони використовують інший шлях коду.

    Мінімальна конфігурація, щоб групи продовжували проходити за `groupPolicy: "allowlist"`:

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

    Якщо ці рядки `warn` з'являються в журналі gateway, відкидає gate 2 — додайте блок `groups`.
    </Warning>

    Gating згадок для груп:

    - iMessage не має нативних метаданих згадок
    - виявлення згадок використовує regex-шаблони (`agents.list[].groupChat.mentionPatterns`, запасний варіант `messages.groupChat.mentionPatterns`)
    - без налаштованих шаблонів шлюзування за згадками неможливо примусово застосувати

    Керівні команди від авторизованих відправників можуть обходити шлюзування за згадками в групах.

    `systemPrompt` для групи:

    Кожен запис у `channels.imessage.groups.*` приймає необов’язковий рядок `systemPrompt`. Значення впроваджується в системний промпт агента на кожному ході, який обробляє повідомлення в цій групі. Розв’язання повторює розв’язання промптів для груп, яке використовується `channels.whatsapp.groups`:

    1. **Системний промпт конкретної групи** (`groups["<chat_id>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і до цієї групи не застосовується жоден системний промпт.
    2. **Wildcard системного промпта групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

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

    Промпти для груп застосовуються лише до групових повідомлень — прямі повідомлення в цьому каналі не змінюються.

  </Tab>

  <Tab title="Сесії та детерміновані відповіді">
    - DM використовують пряме маршрутизування; групи використовують групове маршрутизування.
    - З типовим `session.dmScope=main` DM iMessage згортаються в основну сесію агента.
    - Групові сесії ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді маршрутизуються назад до iMessage за допомогою метаданих початкового каналу/цілі.

    Поведінка потоків, схожих на групові:

    Деякі потоки iMessage із кількома учасниками можуть надходити з `is_group=false`.
    Якщо цей `chat_id` явно налаштовано в `channels.imessage.groups`, OpenClaw обробляє його як груповий трафік (групове шлюзування + ізоляція групової сесії).

  </Tab>
</Tabs>

## Прив’язки розмов ACP

Застарілі чати iMessage також можна прив’язувати до сесій ACP.

Швидкий операторський процес:

- Запустіть `/acp spawn codex --bind here` всередині DM або дозволеного групового чату.
- Майбутні повідомлення в тій самій розмові iMessage маршрутизуються до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Налаштовані постійні прив’язки підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "imessage"`.

`match.peer.id` може використовувати:

- нормалізований дескриптор DM, наприклад `+15555550123` або `user@example.com`
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

    1. Створіть/увійдіть в окремого користувача macOS.
    2. Увійдіть у Messages з Apple ID бота в цьому користувачі.
    3. Встановіть `imsg` у цьому користувачі.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Спрямуйте `channels.imessage.accounts.<id>.cliPath` і `.dbPath` до профілю цього користувача.

    Перший запуск може потребувати схвалень у GUI (Automation + Full Disk Access) у сесії цього користувача бота.

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

    Використовуйте SSH-ключі, щоб і SSH, і SCP були неінтерактивними.
    Спочатку переконайтеся, що ключ хоста довірений (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб `known_hosts` було заповнено.

  </Accordion>

  <Accordion title="Шаблон із кількома обліковими записами">
    iMessage підтримує конфігурацію для кожного облікового запису в `channels.imessage.accounts`.

    Кожен обліковий запис може перевизначати поля, як-от `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, налаштування історії та allowlist коренів вкладень.

  </Accordion>
</AccordionGroup>

## Медіа, фрагментація та цілі доставки

<AccordionGroup>
  <Accordion title="Вкладення та медіа">
    - приймання вхідних вкладень **вимкнено за замовчуванням** — установіть `channels.imessage.includeAttachments: true`, щоб пересилати фото, голосові нотатки, відео та інші вкладення агенту. Коли це вимкнено, iMessage лише з вкладеннями відкидаються до того, як потраплять до агента, і можуть взагалі не створити рядок журналу `Inbound message`.
    - віддалені шляхи вкладень можна отримувати через SCP, коли встановлено `remoteHost`
    - шляхи вкладень мають відповідати дозволеним кореням:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (віддалений режим SCP)
      - типовий кореневий шаблон: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - розмір вихідних медіа використовує `channels.imessage.mediaMaxMb` (типово 16 MB)

  </Accordion>

  <Accordion title="Фрагментація вихідних повідомлень">
    - ліміт текстового фрагмента: `channels.imessage.textChunkLimit` (типово 4000)
    - режим фрагментації: `channels.imessage.chunkMode`
      - `length` (типово)
      - `newline` (розбиття з пріоритетом абзаців)

  </Accordion>

  <Accordion title="Формати адресування">
    Бажані явні цілі:

    - `chat_id:123` (рекомендовано для стабільного маршрутизування)
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

## Дії приватного API

Коли `imsg launch` запущено і `openclaw channels status --probe` повідомляє `privateApi.available: true`, інструмент повідомлень може використовувати нативні для iMessage дії на додачу до звичайного надсилання тексту.

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
  <Accordion title="Доступні дії">
    - **react**: Додати/видалити tapbacks iMessage (`messageId`, `emoji`, `remove`). Підтримувані tapbacks відображаються на love, like, dislike, laugh, emphasize і question.
    - **reply**: Надіслати відповідь у потоці на наявне повідомлення (`messageId`, `text` або `message`, а також `chatGuid`, `chatId`, `chatIdentifier` або `to`).
    - **sendWithEffect**: Надіслати текст з ефектом iMessage (`text` або `message`, `effect` або `effectId`).
    - **edit**: Редагувати надіслане повідомлення на підтримуваних версіях macOS/приватного API (`messageId`, `text` або `newText`).
    - **unsend**: Відкликати надіслане повідомлення на підтримуваних версіях macOS/приватного API (`messageId`).
    - **upload-file**: Надіслати медіа/файли (`buffer` як base64 або гідратований `media`/`path`/`filePath`, `filename`, необов’язковий `asVoice`). Застарілий alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Керувати груповими чатами, коли поточна ціль є груповою розмовою.

  </Accordion>

  <Accordion title="ID повідомлень">
    Контекст вхідних iMessage містить як короткі значення `MessageSid`, так і повні GUID повідомлень, коли вони доступні. Короткі ID обмежені нещодавнім in-memory кешем відповідей і перед використанням перевіряються щодо поточного чату. Якщо короткий ID протермінований або належить іншому чату, повторіть спробу з повним `MessageSidFull`.

  </Accordion>

  <Accordion title="Виявлення можливостей">
    OpenClaw приховує дії приватного API лише тоді, коли кешований стан probe каже, що bridge недоступний. Якщо стан невідомий, дії залишаються видимими, а dispatch виконує probes ліниво, щоб перша дія могла успішно виконатися після `imsg launch` без окремого ручного оновлення статусу.

  </Accordion>

  <Accordion title="Підтвердження прочитання та введення">
    Коли bridge приватного API працює, прийняті вхідні чати позначаються як прочитані перед dispatch, а відправнику показується бульбашка введення, поки агент генерує відповідь. Вимкніть позначення прочитання за допомогою:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Старіші збірки `imsg`, які передують списку можливостей для кожного методу, тихо вимикатимуть typing/read; OpenClaw реєструє одноразове попередження після кожного перезапуску, щоб відсутнє підтвердження можна було пояснити.

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

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання split-send DM (команда + URL в одній композиції)

Коли користувач вводить команду й URL разом — наприклад, `Dump https://example.com/article` — застосунок Messages від Apple розбиває надсилання на **два окремі рядки `chat.db`**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка URL-preview (`"https://..."`) із зображеннями OG-preview як вкладеннями.

У більшості налаштувань ці два рядки надходять до OpenClaw з інтервалом ~0,8–2,0 с. Без об’єднання агент отримує лише команду на ході 1, відповідає (часто «надішліть мені URL») і бачить URL лише на ході 2 — на той момент контекст команди вже втрачено. Це конвеєр надсилання Apple, а не щось, що додає OpenClaw або `imsg`.

`channels.imessage.coalesceSameSenderDms` вмикає для DM об’єднання послідовних рядків від того самого відправника в один хід агента. Групові чати продовжують dispatch для кожного повідомлення, щоб зберегти структуру ходів із кількома користувачами.

<Tabs>
  <Tab title="Коли вмикати">
    Вмикайте, коли:

    - Ви постачаєте skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL, зображення або довгий контент поруч із командами.
    - Ви можете прийняти додаткову затримку ходу DM (див. нижче).

    Залишайте вимкненим, коли:

    - Вам потрібна мінімальна затримка команд для однослівних тригерів DM.
    - Усі ваші процеси є одноразовими командами без подальших payload.

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

    Коли прапорець увімкнено і немає явного `messages.inbound.byChannel.imessage`, вікно дебаунсу розширюється до **2500 ms** (застаріле значення за замовчуванням — 0 ms, тобто без дебаунсу). Ширше вікно потрібне, бо ритм розділеного надсилання Apple у 0.8-2.0 s не вкладається в жорсткіше значення за замовчуванням.

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
    - **Додана затримка для особистих повідомлень.** Коли прапорець увімкнено, кожне особисте повідомлення (включно з окремими керівними командами та одиничними текстовими доповненнями) чекає до завершення вікна дебаунсу перед доставленням, на випадок якщо надійде рядок корисного навантаження. Повідомлення групових чатів зберігають миттєве доставлення.
    - **Об’єднаний вивід обмежений.** Об’єднаний текст обмежується 4000 символами з явним маркером `…[truncated]`; вкладення — 20; записи джерел — 10 (перший і найновіші зберігаються понад цей ліміт). Кожен GUID джерела відстежується в `coalescedMessageGuids` для подальшої телеметрії.
    - **Лише особисті повідомлення.** Групові чати передаються в доставлення окремо для кожного повідомлення, щоб бот залишався чуйним, коли пишуть кілька людей.
    - **Увімкнення за бажанням, для кожного каналу окремо.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються. Застарілі конфігурації BlueBubbles, які задають `channels.bluebubbles.coalesceSameSenderDms`, мають перенести це значення в `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Сценарії та що бачить агент

| Користувач складає                                                 | `chat.db` створює      | Прапорець вимкнено (за замовчуванням)        | Прапорець увімкнено + вікно 2500 ms                                    |
| ------------------------------------------------------------------ | ---------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                       | 2 рядки з інтервалом ~1 s | Два ходи агента: лише "Dump", потім URL      | Один хід: об’єднаний текст `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 рядки                | Два ходи (вкладення втрачається під час об’єднання) | Один хід: текст + зображення збережено                                 |
| `/status` (окрема команда)                                         | 1 рядок                | Миттєве доставлення                          | **Очікування до завершення вікна, потім доставлення**                  |
| URL, вставлений окремо                                             | 1 рядок                | Миттєве доставлення                          | Миттєве доставлення (лише один запис у бакеті)                         |
| Текст + URL надіслані як два навмисно окремі повідомлення з інтервалом у хвилини | 2 рядки поза вікном | Два ходи                                     | Два ходи (вікно спливає між ними)                                      |
| Швидкий потік (>10 невеликих особистих повідомлень у межах вікна)  | N рядків               | N ходів                                      | Один хід, обмежений вивід (перший + найновіші, застосовано ліміти тексту/вкладень) |
| Двоє людей пишуть у груповому чаті                                 | N рядків від M відправників | M+ ходів (по одному на бакет відправника) | M+ ходів — групові чати не об’єднуються                                |

## Наздоганяння після простою Gateway

Коли Gateway офлайн (збій, перезапуск, сон Mac, вимкнена машина), `imsg watch` після повернення Gateway відновлюється з поточного стану `chat.db` — усе, що надійшло під час розриву, за замовчуванням ніколи не буде побачено. Наздоганяння повторно відтворює ці повідомлення під час наступного запуску, щоб агент не пропускав вхідний трафік непомітно.

Наздоганяння **вимкнено за замовчуванням**. Увімкніть його для кожного каналу окремо:

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

Один прохід на кожен запуск `monitorIMessageProvider`, у послідовності: готовність `imsg launch` → `watch.subscribe` → `performIMessageCatchup` → цикл живого доставлення. Саме наздоганяння використовує `chats.list` + `messages.history` для кожного чату через той самий клієнт JSON-RPC, що й `imsg watch`. Усе, що надходить під час проходу наздоганяння, проходить через живе доставлення звичайним чином; наявний кеш дедуплікації вхідних повідомлень поглинає будь-який перетин із повторно відтвореними рядками.

Кожен повторно відтворений рядок передається через шлях живого доставлення (`evaluateIMessageInbound` + `dispatchInboundMessage`), тому списки дозволів, групова політика, дебаунсер, кеш ехо та сповіщення про прочитання поводяться однаково для повторно відтворених і живих повідомлень.

### Семантика курсора й повторних спроб

Наздоганяння зберігає курсор для кожного облікового запису в `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (каталог стану OpenClaw за замовчуванням — `~/.openclaw`, можна перевизначити через `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Курсор просувається після кожного успішного доставлення й утримується, коли доставлення рядка викидає помилку — наступний запуск повторить той самий рядок із утриманого курсора.
- Після `maxFailureRetries` послідовних помилок для того самого `guid` наздоганяння записує `warn` і примусово просуває курсор за заблоковане повідомлення, щоб наступні запуски могли рухатися далі.
- GUID, від яких уже відмовилися, пропускаються одразу (без спроби доставлення) у пізніших запусках і враховуються в `skippedGivenUp` у підсумку запуску.

### Сигнали, видимі оператору

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Рядок `WARN ... capped to perRunLimit` означає, що один запуск не вичерпав весь беклог. Збільште `perRunLimit` (максимум 500), якщо ваші розриви регулярно перевищують стандартний прохід у 50 рядків.

### Коли залишити вимкненим

- Gateway працює безперервно з автоматичним перезапуском через watchdog, а розриви завжди < кількох секунд — стандартне вимкнене значення підходить.
- Обсяг особистих повідомлень низький, а пропущені повідомлення не змінювали б поведінку агента — початкове вікно `firstRunLookbackMinutes` може доставити несподіваний старий контекст під час першого ввімкнення.

Коли ви вмикаєте наздоганяння, перший запуск без курсора дивиться назад лише на `firstRunLookbackMinutes` (30 хв за замовчуванням), а не на повне вікно `maxAgeMinutes` — це запобігає повторному відтворенню довгої історії повідомлень, що передували ввімкненню.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="imsg не знайдено або RPC не підтримується">
    Перевірте бінарний файл і підтримку RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Якщо перевірка повідомляє, що RPC не підтримується, оновіть `imsg`. Якщо дії приватного API недоступні, запустіть `imsg launch` у сеансі користувача macOS, який увійшов у систему, і повторіть перевірку. Якщо Gateway не працює на macOS, використайте налаштування віддаленого Mac через SSH вище замість стандартного локального шляху `imsg`.

  </Accordion>

  <Accordion title="Gateway не працює на macOS">
    Стандартний `cliPath: "imsg"` має виконуватися на Mac, де виконано вхід у Messages. На Linux або Windows задайте `channels.imessage.cliPath` як wrapper-скрипт, що підключається до цього Mac через SSH і запускає `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Потім виконайте:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Особисті повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - схвалення сполучення (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Групові повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведінку списку дозволів `channels.imessage.groups`
    - конфігурацію шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Віддалені вкладення не працюють">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію ключем SSH/SCP з хоста Gateway
    - наявність ключа хоста в `~/.ssh/known_hosts` на хості Gateway
    - читабельність віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="Підказки дозволів macOS було пропущено">
    Повторно запустіть в інтерактивному GUI-терміналі в тому самому контексті користувача/сеансу та схваліть підказки:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Переконайтеся, що Full Disk Access + Automation надано для контексту процесу, який запускає OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Посилання на довідник конфігурації

- [Довідник конфігурації - iMessage](/uk/gateway/config-channels#imessage)
- [Конфігурація Gateway](/uk/gateway/configuration)
- [Сполучення](/uk/channels/pairing)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) — таблиця перекладу конфігурації та покрокове перемикання
- [Сполучення](/uk/channels/pairing) — автентифікація особистих повідомлень і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і фільтрація за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу й посилення захисту
