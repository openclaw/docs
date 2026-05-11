---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання/отримання iMessage
summary: Вбудована підтримка iMessage через imsg (JSON-RPC over stdio), з діями приватного API для відповідей, tapbacks, ефектів, вкладень і керування групами. Бажаний варіант для нових налаштувань OpenClaw iMessage, коли вимоги до хоста підходять.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Для розгортань OpenClaw iMessage використовуйте `imsg` на хості macOS Messages із виконаним входом. Якщо ваш Gateway працює на Linux або Windows, укажіть для `channels.imessage.cliPath` SSH-обгортку, яка запускає `imsg` на Mac.

**Надолуження після простою Gateway вмикається явно.** Коли його ввімкнено (`channels.imessage.catchup.enabled: true`), gateway під час наступного запуску відтворює вхідні повідомлення, що потрапили в `chat.db`, поки він був офлайн (збій, перезапуск, сон Mac). За замовчуванням вимкнено — див. [Надолуження після простою gateway](#catching-up-after-gateway-downtime). Закриває [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Підтримку BlueBubbles видалено. Перенесіть конфігурації `channels.bluebubbles` до `channels.imessage`; OpenClaw підтримує iMessage лише через `imsg`. Почніть із [Видалення BlueBubbles і шлях imsg для iMessage](/uk/announcements/bluebubbles-imessage) для короткого оголошення або [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) для повної таблиці міграції.
</Warning>

Стан: нативна інтеграція із зовнішнім CLI. Gateway запускає `imsg rpc` і взаємодіє через JSON-RPC у stdio (без окремого демона/порту). Розширені дії потребують `imsg launch` і успішної перевірки приватного API.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Відповіді, tapbacks, ефекти, вкладення та керування групами.
  </Card>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    DM iMessage за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Використовуйте SSH-обгортку, коли Gateway не працює на Mac із Messages.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/uk/gateway/config-channels#imessage">
    Повна довідка щодо полів iMessage.
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

        Запити на сполучення завершуються через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw потребує лише сумісного зі stdio `cliPath`, тому ви можете вказати `cliPath` на скрипт-обгортку, який підключається SSH до віддаленого Mac і запускає `imsg`.

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

    Якщо `remoteHost` не задано, OpenClaw намагається автоматично визначити його, розбираючи SSH-обгортку.
    `remoteHost` має бути `host` або `user@host` (без пробілів чи параметрів SSH).
    OpenClaw використовує сувору перевірку ключа хоста для SCP, тому ключ хоста ретрансляції уже має існувати в `~/.ssh/known_hosts`.
    Шляхи вкладень перевіряються щодо дозволених коренів (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- На Mac, де запущено `imsg`, має бути виконано вхід у Messages.
- Повний доступ до диска потрібен для контексту процесу, у якому працює OpenClaw/`imsg` (доступ до БД Messages).
- Дозвіл на автоматизацію потрібен для надсилання повідомлень через Messages.app.
- Для розширених дій (реакція / редагування / скасування надсилання / відповідь у гілці / ефекти / групові операції) System Integrity Protection має бути вимкнено — див. [Увімкнення приватного API imsg](#enabling-the-imsg-private-api) нижче. Базове надсилання й отримання тексту та медіа працює без цього.

<Tip>
Дозволи надаються для кожного контексту процесу. Якщо gateway працює без інтерфейсу (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в тому самому контексті, щоб викликати запити дозволів:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Увімкнення приватного API imsg

`imsg` постачається у двох операційних режимах:

- **Базовий режим** (за замовчуванням, зміни SIP не потрібні): вихідний текст і медіа через `send`, вхідне спостереження/історія, список чатів. Саме це ви отримуєте одразу після свіжого `brew install steipete/tap/imsg` плюс стандартні дозволи macOS вище.
- **Режим приватного API**: `imsg` впроваджує допоміжну dylib у `Messages.app`, щоб викликати внутрішні функції `IMCore`. Саме це розблоковує `react`, `edit`, `unsend`, `reply` (у гілці), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, а також індикатори набору тексту й підтвердження прочитання.

Щоб отримати поверхню розширених дій, описану на цій сторінці каналу, вам потрібен режим приватного API. README `imsg` прямо вказує на цю вимогу:

> Розширені функції, як-от `read`, `typing`, `launch`, розширене надсилання через міст, зміна повідомлень і керування чатами, вмикаються явно. Вони потребують вимкненого SIP і впровадження допоміжної dylib у `Messages.app`. `imsg launch` відмовляється виконувати впровадження, коли SIP увімкнено.

Техніка впровадження допоміжного компонента використовує власну dylib `imsg`, щоб отримати доступ до приватних API Messages. У шляху OpenClaw iMessage немає стороннього сервера чи runtime BlueBubbles.

<Warning>
**Вимкнення SIP є реальним компромісом безпеки.** SIP є одним з основних засобів захисту macOS від запуску зміненого системного коду; його системне вимкнення відкриває додаткову поверхню атаки та побічні ефекти. Зокрема, **вимкнення SIP на Mac з Apple Silicon також вимикає можливість установлювати й запускати застосунки iOS на вашому Mac**.

Сприймайте це як свідомий операційний вибір, а не як типовий режим. Якщо ваша модель загроз не допускає вимкненого SIP, вбудований iMessage обмежується базовим режимом — лише надсилання й отримання тексту та медіа, без реакцій / редагування / скасування надсилання / ефектів / групових операцій.
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
   - **macOS 11+ (Big Sur і новіші), Intel:** Recovery Mode (або Internet Recovery), `csrutil disable`, перезапустіть.
   - **macOS 11+, Apple Silicon:** послідовність запуску кнопкою живлення для входу в Recovery; у новіших версіях macOS утримуйте клавішу **Left Shift**, коли натискаєте Continue, потім `csrutil disable`. Налаштування віртуальних машин мають окремий процес — спочатку створіть знімок VM.
   - **macOS 26 / Tahoe:** політики перевірки бібліотек і перевірки приватних entitlement для `imagent` стали ще жорсткішими; `imsg` може потребувати оновленої збірки, щоб відповідати змінам. Якщо впровадження `imsg launch` або конкретні `selectors` починають повертати false після великого оновлення macOS, перевірте примітки до випуску `imsg`, перш ніж припускати, що крок SIP виконано успішно.

   Дотримуйтеся процесу Recovery-mode від Apple для вашого Mac, щоб вимкнути SIP перед запуском `imsg launch`.

3. **Впровадьте допоміжний компонент.** Із вимкненим SIP і виконаним входом у Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` відмовляється виконувати впровадження, коли SIP досі ввімкнено, тож це також підтверджує, що крок 2 спрацював.

4. **Перевірте міст з OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Запис iMessage має повідомляти `works`, а `imsg status --json | jq '.selectors'` має показувати `retractMessagePart: true` плюс ті селектори редагування / набору тексту / прочитання, які надає ваша збірка macOS. Шлюзування за методом у Plugin OpenClaw у `actions.ts` рекламує лише дії, чий базовий selector дорівнює `true`, тож поверхня дій, яку ви бачите в списку інструментів агента, відображає те, що міст справді може виконати на цьому хості.

Якщо `openclaw channels status --probe` повідомляє, що канал має стан `works`, але конкретні дії під час dispatch видають "iMessage `<action>` requires the imsg private API bridge", запустіть `imsg launch` знову — допоміжний компонент може зникнути (перезапуск Messages.app, оновлення ОС тощо), а кешований стан `available: true` продовжить рекламувати дії, доки наступна перевірка не оновить його.

### Коли ви не можете вимкнути SIP

Якщо вимкнений SIP неприйнятний для вашої моделі загроз:

- `imsg` повертається до базового режиму — лише текст + медіа + отримання.
- Plugin OpenClaw усе ще рекламує надсилання тексту/медіа та вхідний моніторинг; він просто приховує `react`, `edit`, `unsend`, `reply`, `sendWithEffect` і групові операції з поверхні дій (відповідно до шлюзування можливостей за методом).
- Ви можете запустити окремий Mac без Apple Silicon (або виділений bot Mac) із вимкненим SIP для навантаження iMessage, зберігаючи SIP увімкненим на основних пристроях. Див. [Виділений користувач macOS для бота (окрема ідентичність iMessage)](#deployment-patterns) нижче.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` керує прямими повідомленнями:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле списку дозволених: `channels.imessage.allowFrom`.

    Записи списку дозволених можуть бути handle, статичними групами доступу відправників (`accessGroup:<name>`) або цілями чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (за замовчуванням, коли налаштовано)
    - `open`
    - `disabled`

    Список дозволених відправників групи: `channels.imessage.groupAllowFrom`.

    Записи `groupAllowFrom` також можуть посилатися на статичні групи доступу відправників (`accessGroup:<name>`).

    Runtime fallback: якщо `groupAllowFrom` не задано, перевірки відправників груп iMessage повертаються до `allowFrom`, коли він доступний.
    Примітка щодо runtime: якщо `channels.imessage` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо `channels.defaults.groupPolicy` задано).

    <Warning>
    Маршрутизація груп має **два** шлюзи списку дозволених, що виконуються один за одним, і обидва мають пройти:

    1. **Список дозволених відправників / цілей чату** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` або `chat_id`.
    2. **Реєстр груп** (`channels.imessage.groups`) — із `groupPolicy: "allowlist"` цей шлюз потребує або wildcard-запису `groups: { "*": { ... } }` (встановлює `allowAll = true`), або явного запису для кожного `chat_id` у `groups`.

    Якщо в шлюзі 2 нічого немає, кожне групове повідомлення відкидається. Plugin випускає два сигнали рівня `warn` на типовому рівні журналювання:

    - один раз для кожного облікового запису під час запуску: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - один раз для кожного `chat_id` під час runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM продовжують працювати, бо використовують інший шлях коду.

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

    Якщо ці рядки `warn` з’являються в журналі gateway, шлюз 2 відкидає повідомлення — додайте блок `groups`.
    </Warning>

    Згадайте фільтрацію для груп:

    - iMessage не має нативних метаданих згадок
    - виявлення згадок використовує regex-шаблони (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - без налаштованих шаблонів фільтрацію за згадками неможливо забезпечити

    Керівні команди від авторизованих відправників можуть обходити фільтрацію за згадками в групах.

    Погруповий `systemPrompt`:

    Кожен запис у `channels.imessage.groups.*` приймає необов’язковий рядок `systemPrompt`. Значення вставляється в системний prompt агента під час кожного ходу, що обробляє повідомлення в цій групі. Розв’язання повторює погрупове розв’язання prompt, яке використовується `channels.whatsapp.groups`:

    1. **Груповий системний prompt** (`groups["<chat_id>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується, і до цієї групи не застосовується жоден системний prompt.
    2. **Wildcard системного prompt для груп** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

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

    Погрупові prompt застосовуються лише до групових повідомлень — прямі повідомлення в цьому каналі не змінюються.

  </Tab>

  <Tab title="Сесії та детерміновані відповіді">
    - DM використовують пряме маршрутизування; групи використовують групове маршрутизування.
    - З типовим `session.dmScope=main` DM iMessage згортаються в основну сесію агента.
    - Групові сесії ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді маршрутизуються назад до iMessage за допомогою метаданих початкового каналу/цілі.

    Поведінка потоків, схожих на групові:

    Деякі багатокористувацькі потоки iMessage можуть надходити з `is_group=false`.
    Якщо цей `chat_id` явно налаштовано в `channels.imessage.groups`, OpenClaw обробляє його як груповий трафік (групова фільтрація + ізоляція групової сесії).

  </Tab>
</Tabs>

## Прив’язки розмов ACP

Застарілі чати iMessage також можна прив’язати до сесій ACP.

Швидкий операторський потік:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в тій самій розмові iMessage маршрутизуються до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Налаштовані постійні прив’язки підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "imessage"`.

`match.peer.id` може використовувати:

- нормалізований DM handle, як-от `+15555550123` або `user@example.com`
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

Див. [Агенти ACP](/uk/tools/acp-agents) для спільної поведінки прив’язок ACP.

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Виділений користувач macOS для бота (окрема ідентичність iMessage)">
    Використовуйте виділений Apple ID і користувача macOS, щоб трафік бота був ізольований від вашого особистого профілю Messages.

    Типовий потік:

    1. Створіть/увійдіть у виділеного користувача macOS.
    2. Увійдіть у Messages з Apple ID бота в цьому користувачі.
    3. Встановіть `imsg` у цьому користувачі.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Спрямуйте `channels.imessage.accounts.<id>.cliPath` і `.dbPath` до профілю цього користувача.

    Перший запуск може потребувати схвалень GUI (Automation + Full Disk Access) у сесії цього користувача-бота.

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
    Спершу переконайтеся, що ключ хоста довірений (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб було заповнено `known_hosts`.

  </Accordion>

  <Accordion title="Шаблон із кількома обліковими записами">
    iMessage підтримує поконфігураційні налаштування облікових записів у `channels.imessage.accounts`.

    Кожен обліковий запис може перевизначати поля, як-от `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, налаштування історії та allowlist коренів вкладень.

  </Accordion>
</AccordionGroup>

## Медіа, поділ на частини та цілі доставки

<AccordionGroup>
  <Accordion title="Вкладення та медіа">
    - приймання вхідних вкладень **типово вимкнене** — встановіть `channels.imessage.includeAttachments: true`, щоб пересилати фото, голосові нотатки, відео та інші вкладення агенту. Коли це вимкнено, iMessage, що містять лише вкладення, відкидаються до потрапляння до агента й можуть взагалі не створювати рядок журналу `Inbound message`.
    - віддалені шляхи вкладень можна отримувати через SCP, коли встановлено `remoteHost`
    - шляхи вкладень мають відповідати дозволеним кореням:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (режим віддаленого SCP)
      - типовий шаблон кореня: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - розмір вихідних медіа використовує `channels.imessage.mediaMaxMb` (типово 16 MB)

  </Accordion>

  <Accordion title="Поділ вихідних повідомлень на частини">
    - обмеження частини тексту: `channels.imessage.textChunkLimit` (типово 4000)
    - режим поділу на частини: `channels.imessage.chunkMode`
      - `length` (типово)
      - `newline` (розбиття з пріоритетом абзаців)

  </Accordion>

  <Accordion title="Формати адресації">
    Бажані явні цілі:

    - `chat_id:123` (рекомендовано для стабільного маршрутизування)
    - `chat_guid:...`
    - `chat_identifier:...`

    Також підтримуються цілі handle:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Дії приватного API

Коли `imsg launch` запущено, а `openclaw channels status --probe` повідомляє `privateApi.available: true`, інструмент повідомлень може використовувати нативні дії iMessage на додачу до звичайного надсилання тексту.

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
    - **react**: Додати/видалити tapback iMessage (`messageId`, `emoji`, `remove`). Підтримувані tapback відповідають love, like, dislike, laugh, emphasize і question.
    - **reply**: Надіслати відповідь у потоці на наявне повідомлення (`messageId`, `text` або `message`, плюс `chatGuid`, `chatId`, `chatIdentifier` або `to`).
    - **sendWithEffect**: Надіслати текст з ефектом iMessage (`text` або `message`, `effect` або `effectId`).
    - **edit**: Редагувати надіслане повідомлення на підтримуваних версіях macOS/приватного API (`messageId`, `text` або `newText`).
    - **unsend**: Відкликати надіслане повідомлення на підтримуваних версіях macOS/приватного API (`messageId`).
    - **upload-file**: Надіслати медіа/файли (`buffer` як base64 або гідратований `media`/`path`/`filePath`, `filename`, необов’язково `asVoice`). Застарілий alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Керувати груповими чатами, коли поточна ціль є груповою розмовою.

  </Accordion>

  <Accordion title="ID повідомлень">
    Вхідний контекст iMessage містить як короткі значення `MessageSid`, так і повні GUID повідомлень, коли вони доступні. Короткі ID обмежені нещодавнім кешем відповідей у пам’яті та перед використанням перевіряються відносно поточного чату. Якщо короткий ID застарів або належить іншому чату, повторіть спробу з повним `MessageSidFull`.

  </Accordion>

  <Accordion title="Виявлення можливостей">
    OpenClaw приховує дії приватного API лише тоді, коли кешований статус перевірки каже, що міст недоступний. Якщо статус невідомий, дії залишаються видимими, а dispatch ліниво запускає перевірки, щоб перша дія могла успішно виконатися після `imsg launch` без окремого ручного оновлення статусу.

  </Accordion>

  <Accordion title="Сповіщення про прочитання та введення">
    Коли міст приватного API активний, прийняті вхідні чати позначаються прочитаними перед dispatch, а відправнику показується бульбашка введення, поки агент генерує. Вимкніть позначення прочитання за допомогою:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Старіші збірки `imsg`, що передують пометодному списку можливостей, тихо вимикатимуть введення/прочитання; OpenClaw записує одноразове попередження після кожного перезапуску, щоб відсутнє сповіщення можна було пояснити.

  </Accordion>
</AccordionGroup>

## Записи конфігурації

iMessage типово дозволяє ініційовані каналом записи конфігурації (для `/config set|unset`, коли `commands.config: true`).

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

## Об’єднання розділених надсилань DM (команда + URL в одній композиції)

Коли користувач вводить команду й URL разом — наприклад, `Dump https://example.com/article` — застосунок Messages від Apple розділяє надсилання на **два окремі рядки `chat.db`**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка попереднього перегляду URL (`"https://..."`) з OG-preview зображеннями як вкладеннями.

Ці два рядки надходять до OpenClaw з інтервалом приблизно 0,8–2,0 с у більшості налаштувань. Без об’єднання агент отримує лише команду на ході 1, відповідає (часто “надішліть мені URL”) і бачить URL лише на ході 2 — коли контекст команди вже втрачено. Це конвеєр надсилання Apple, а не щось, що додає OpenClaw або `imsg`.

`channels.imessage.coalesceSameSenderDms` вмикає для DM злиття послідовних рядків від того самого відправника в один хід агента. Групові чати й далі dispatch кожне повідомлення окремо, щоб зберегти структуру ходів кількох користувачів.

<Tabs>
  <Tab title="Коли вмикати">
    Вмикайте, коли:

    - Ви постачаєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL, зображення або довгий вміст поруч із командами.
    - Ви можете прийняти додану затримку ходу DM (див. нижче).

    Залишайте вимкненим, коли:

    - Вам потрібна мінімальна затримка команди для однослівних тригерів DM.
    - Усі ваші потоки є одноразовими командами без наступних payload.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Коли прапорець увімкнено й немає явного `messages.inbound.byChannel.imessage`, вікно усунення брязкоту розширюється до **2500 мс** (застаріле значення за замовчуванням — 0 мс, без усунення брязкоту). Ширше вікно потрібне, бо каденція Apple для розділеного надсилання 0,8–2,0 с не вкладається в жорсткіше стандартне значення.

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
  <Tab title="Trade-offs">
    - **Додана затримка для DM-повідомлень.** Коли прапорець увімкнено, кожне DM-повідомлення (зокрема самостійні керівні команди та одиночні текстові продовження) чекає до завершення вікна усунення брязкоту перед відправленням на випадок, якщо надійде рядок корисного навантаження. Повідомлення групового чату зберігають миттєве відправлення.
    - **Об’єднаний вивід обмежений.** Об’єднаний текст обмежено 4000 символами з явним маркером `…[truncated]`; вкладення — 20; записи джерел — 10 (перший і найновіші зберігаються понад цю межу). Кожен вихідний GUID відстежується в `coalescedMessageGuids` для подальшої телеметрії.
    - **Лише DM.** Групові чати проходять до відправлення окремих повідомлень, щоб бот залишався чуйним, коли друкують кілька людей.
    - **Увімкнення окремо для кожного каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються. Застарілі конфігурації BlueBubbles, які задають `channels.bluebubbles.coalesceSameSenderDms`, мають перенести це значення до `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Сценарії та що бачить агент

| Користувач складає                                                | `chat.db` створює     | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 мс                                    |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                       | 2 рядки з інтервалом ~1 с | Два ходи агента: лише "Dump", потім URL | Один хід: об’єднаний текст `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 рядки               | Два ходи (вкладення відкинуто під час об’єднання) | Один хід: текст + зображення збережено                                  |
| `/status` (самостійна команда)                                     | 1 рядок               | Миттєве відправлення                    | **Чекати до завершення вікна, потім відправити**                        |
| URL вставлено окремо                                               | 1 рядок               | Миттєве відправлення                    | Миттєве відправлення (лише один запис у кошику)                         |
| Текст + URL надіслано як два навмисно окремі повідомлення з інтервалом у хвилини | 2 рядки поза вікном | Два ходи                                | Два ходи (вікно спливає між ними)                                       |
| Швидкий потік (>10 малих DM усередині вікна)                       | N рядків              | N ходів                                 | Один хід, обмежений вивід (перший + найновіші, застосовано обмеження тексту/вкладень) |
| Двоє людей друкують у груповому чаті                               | N рядків від M відправників | M+ ходів (по одному на кошик відправника) | M+ ходів — групові чати не об’єднуються                                 |

## Наздоганяння після простою Gateway

Коли Gateway не в мережі (збій, перезапуск, сон Mac, вимкнена машина), `imsg watch` відновлюється з поточного стану `chat.db`, щойно Gateway знову запускається — усе, що надійшло під час розриву, типово ніколи не буде побачене. Наздоганяння повторно відтворює ці повідомлення під час наступного запуску, щоб агент не пропускав вхідний трафік непомітно.

Наздоганяння **типово вимкнено**. Увімкніть його для кожного каналу:

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

### Як це працює

Один прохід на кожен запуск `monitorIMessageProvider`, у послідовності: `imsg launch` готовий → `watch.subscribe` → `performIMessageCatchup` → цикл живого відправлення. Саме наздоганяння використовує `chats.list` + `messages.history` для кожного чату через той самий JSON-RPC-клієнт, який використовує `imsg watch`. Усе, що надходить під час проходу наздоганяння, зазвичай проходить через живе відправлення; наявний кеш усунення дублікатів вхідних повідомлень поглинає будь-який перетин із повторно відтвореними рядками.

Кожен повторно відтворений рядок проходить через шлях живого відправлення (`evaluateIMessageInbound` + `dispatchInboundMessage`), тому списки дозволів, політика груп, усувач брязкоту, кеш ехо та підтвердження прочитання поводяться однаково для повторно відтворених і живих повідомлень.

### Семантика курсора й повторних спроб

Наздоганяння зберігає курсор для кожного облікового запису в `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (каталог стану OpenClaw типово `~/.openclaw`, можна перевизначити через `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Курсор просувається після кожного успішного відправлення й утримується, коли відправлення рядка кидає виняток — наступний запуск повторює той самий рядок від утриманого курсора.
- Після `maxFailureRetries` послідовних винятків для того самого `guid` наздоганяння записує `warn` і примусово просуває курсор за проблемне повідомлення, щоб наступні запуски могли рухатися далі.
- GUID, для яких уже припинено спроби, пропускаються при виявленні (без спроби відправлення) у пізніших запусках і враховуються в `skippedGivenUp` у підсумку запуску.

### Сигнали, видимі оператору

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Рядок `WARN ... capped to perRunLimit` означає, що один запуск не вичерпав увесь накопичений backlog. Збільште `perRunLimit` (максимум 500), якщо ваші розриви регулярно перевищують типовий прохід у 50 рядків.

### Коли залишити вимкненим

- Gateway працює безперервно з автоматичним перезапуском watchdog, а розриви завжди < кількох секунд — типове вимкнення підходить.
- Обсяг DM низький, і пропущені повідомлення не змінять поведінку агента — початкове вікно `firstRunLookbackMinutes` може відправити несподівано старий контекст під час першого ввімкнення.

Коли ви вмикаєте наздоганяння, перший запуск без курсора дивиться назад лише на `firstRunLookbackMinutes` (типово 30 хв), а не на повне вікно `maxAgeMinutes` — це запобігає повторному відтворенню довгої історії повідомлень, що існували до ввімкнення.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Перевірте двійковий файл і підтримку RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Якщо probe повідомляє, що RPC не підтримується, оновіть `imsg`. Якщо дії приватного API недоступні, запустіть `imsg launch` у сеансі користувача macOS, який увійшов у систему, і повторіть probe. Якщо Gateway не працює на macOS, використайте налаштування віддаленого Mac через SSH вище замість типового локального шляху `imsg`.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    Типовий `cliPath: "imsg"` має виконуватися на Mac, який увійшов у Messages. На Linux або Windows задайте `channels.imessage.cliPath` як wrapper-скрипт, що підключається SSH до цього Mac і запускає `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Потім запустіть:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    Перевірте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - схвалення сполучення (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Перевірте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведінку списку дозволів `channels.imessage.groups`
    - конфігурацію шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію ключем SSH/SCP з хоста Gateway
    - наявність ключа хоста в `~/.ssh/known_hosts` на хості Gateway
    - читабельність віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Повторно запустіть в інтерактивному GUI-терміналі в тому самому контексті користувача/сеансу й схваліть запити:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Підтвердьте, що Full Disk Access + Automation надано для контексту процесу, який запускає OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

- [Довідник конфігурації - iMessage](/uk/gateway/config-channels#imessage)
- [Конфігурація Gateway](/uk/gateway/configuration)
- [Сполучення](/uk/channels/pairing)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Видалення BlueBubbles і шлях imsg iMessage](/uk/announcements/bluebubbles-imessage) — оголошення й підсумок міграції
- [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) — таблиця перекладу конфігурації та покрокове перемикання
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та пропуск через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу й посилення захисту
