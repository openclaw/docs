---
read_when:
    - Налаштування каналу BlueBubbles
    - Вирішення проблем зі сполученням Webhook
    - Налаштування iMessage на macOS
sidebarTitle: BlueBubbles
summary: iMessage через сервер BlueBubbles для macOS (надсилання/отримання через REST, набір тексту, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-28T11:04:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

Стан: вбудований plugin, який взаємодіє з macOS-сервером BlueBubbles через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно із застарілим каналом imsg.

<Note>
Поточні випуски OpenClaw вбудовують BlueBubbles, тому звичайні пакетовані збірки не потребують окремого кроку `openclaw plugins install`.
</Note>

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/перевірено: macOS Sequoia (15). macOS Tahoe (26) працює; редагування зараз зламане на Tahoe, а оновлення піктограм груп можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через вебхуки; вихідні відповіді, індикатори набору, сповіщення про прочитання та tapback-реакції виконуються REST-викликами.
- Вкладення та стікери приймаються як вхідні медіа (і, коли можливо, передаються агенту).
- Автоматичні TTS-відповіді, які синтезують MP3 або CAF-аудіо, доставляються як бульбашки голосових нотаток iMessage замість звичайних файлових вкладень.
- Сполучення/список дозволених працює так само, як в інших каналах (`/channels/pairing` тощо), з `channels.bluebubbles.allowFrom` + кодами сполучення.
- Реакції відображаються як системні події так само, як у Slack/Telegram, щоб агенти могли "згадувати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, гілкування відповідей, ефекти повідомлень, керування групами.

## Швидкий старт

<Steps>
  <Step title="Установіть BlueBubbles">
    Установіть сервер BlueBubbles на свій Mac (дотримуйтесь інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Увімкніть web API">
    У конфігурації BlueBubbles увімкніть web API і задайте пароль.
  </Step>
  <Step title="Налаштуйте OpenClaw">
    Запустіть `openclaw onboard` і виберіть BlueBubbles або налаштуйте вручну:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Спрямуйте вебхуки на Gateway">
    Спрямуйте вебхуки BlueBubbles на свій Gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Запустіть Gateway">
    Запустіть Gateway; він зареєструє обробник вебхука й почне сполучення.
  </Step>
</Steps>

<Warning>
**Безпека**

- Завжди задавайте пароль вебхука.
- Автентифікація Webhook завжди обов'язкова. OpenClaw відхиляє запити Webhook BlueBubbles, якщо вони не містять password/guid, що збігається з `channels.bluebubbles.password` (наприклад `?password=<password>` або `x-password`), незалежно від топології loopback/proxy.
- Автентифікація паролем перевіряється перед читанням/розбором повних тіл вебхуків.

</Warning>

## Підтримання Messages.app активним (VM / headless-налаштування)

У деяких macOS VM / постійно ввімкнених налаштуваннях Messages.app може переходити в "idle" (вхідні події зупиняються, доки застосунок не відкриють або не виведуть на передній план). Простий обхідний шлях — **штовхати Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

<Steps>
  <Step title="Збережіть AppleScript">
    Збережіть це як `~/Scripts/poke-messages.scpt`:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Установіть LaunchAgent">
    Збережіть це як `~/Library/LaunchAgents/com.user.poke-messages.plist`:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    Це запускається **кожні 300 секунд** і **під час входу в систему**. Перший запуск може викликати запити **Automation** у macOS (`osascript` → Messages). Підтвердьте їх у тому самому сеансі користувача, у якому працює LaunchAgent.

  </Step>
  <Step title="Завантажте його">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Онбординг

BlueBubbles доступний в інтерактивному онбордингу:

```
openclaw onboard
```

Майстер запитує:

<ParamField path="Server URL" type="string" required>
  Адреса сервера BlueBubbles (наприклад, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Пароль API з налаштувань BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Шлях кінцевої точки Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` або `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Номери телефонів, електронні адреси або цілі чатів.
</ParamField>

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Контроль доступу (DM + групи)

<Tabs>
  <Tab title="DM">
    - Типово: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Невідомі відправники отримують код сполучення; повідомлення ігноруються, доки їх не схвалять (коди спливають через 1 годину).
    - Схвалення через:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Сполучення — це типовий обмін токенами. Докладніше: [Сполучення](/uk/channels/pairing)

  </Tab>
  <Tab title="Групи">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (типово: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` керує тим, хто може запускати в групах, коли встановлено `allowlist`.

  </Tab>
</Tabs>

### Збагачення імен контактів (macOS, необов'язково)

Групові вебхуки BlueBubbles часто містять лише необроблені адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, можете увімкнути локальне збагачення Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. Типово: `false`.
- Пошуки виконуються лише після того, як доступ до групи, авторизація команди та фільтрація згадок пропустили повідомлення.
- Збагачуються лише учасники з телефонами без імен.
- Необроблені номери телефонів залишаються резервним варіантом, коли локальний збіг не знайдено.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Фільтрація згадок (групи)

BlueBubbles підтримує фільтрацію згадок для групових чатів, відповідно до поведінки iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадок.
- Коли для групи увімкнено `requireMention`, агент відповідає лише тоді, коли його згадано.
- Керівні команди від авторизованих відправників обходять фільтрацію згадок.

Конфігурація для окремої групи:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Фільтрація команд

- Керівні команди (наприклад, `/config`, `/model`) потребують авторизації.
- Використовує `allowFrom` і `groupAllowFrom`, щоб визначити авторизацію команди.
- Авторизовані відправники можуть виконувати керівні команди навіть без згадування в групах.

### Системний prompt для окремої групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов'язковий рядок `systemPrompt`. Значення вставляється в системний prompt агента на кожному ході, який обробляє повідомлення в цій групі, тож ви можете задавати персоналізацію або поведінкові правила для окремої групи без редагування prompt агента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

Ключ відповідає тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а wildcard-запис `"*"` задає типове значення для кожної групи без точного збігу (той самий шаблон використовується `requireMention` і політиками інструментів для окремих груп). Точні збіги завжди мають перевагу над wildcard. DM ігнорують це поле; натомість використовуйте налаштування prompt на рівні агента або облікового запису.

#### Практичний приклад: гілковані відповіді та tapback-реакції (Private API)

Коли BlueBubbles Private API увімкнено, вхідні повідомлення надходять із короткими ID повідомлень (наприклад `[[reply_to:5]]`), а агент може викликати `action=reply`, щоб відповісти в гілці конкретного повідомлення, або `action=react`, щоб додати tapback. `systemPrompt` для окремої групи — надійний спосіб утримувати агента в межах правильного інструмента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

І tapback-реакції, і гілковані відповіді потребують BlueBubbles Private API; див. [Розширені дії](#advanced-actions) і [ID повідомлень](#message-ids-short-vs-full) щодо базових механік.

## Прив'язки розмов ACP

Чати BlueBubbles можна перетворити на довготривалі робочі простори ACP без зміни транспортного рівня.

Швидкий потік оператора:

- Запустіть `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в тій самій розмові BlueBubbles спрямовуються до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив'язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив'язку.

Також підтримуються налаштовані постійні прив'язки через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований DM-handle, наприклад `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних групових прив'язок віддавайте перевагу `chat_id:*` або `chat_identifier:*`.

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
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Див. [ACP Agents](/uk/tools/acp-agents) щодо спільної поведінки прив'язок ACP.

## Набір тексту + сповіщення про прочитання

- **Індикатори набору**: надсилаються автоматично до та під час генерації відповіді.
- **Сповіщення про прочитання**: керуються `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори набору**: OpenClaw надсилає події початку набору; BlueBubbles автоматично очищає набір під час надсилання або після тайм-ауту (ручна зупинка через DELETE ненадійна).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## Розширені дії

BlueBubbles підтримує розширені дії з повідомленнями, коли їх увімкнено в конфігурації:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: додати/видалити реакції tapback (`messageId`, `emoji`, `remove`). Вбудований набір tapback в iMessage: `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає emoji поза цим набором (наприклад, `👀`), інструмент реакцій повертається до `love`, щоб tapback усе одно відобразився замість збою всього запиту. Налаштовані реакції підтвердження все ще перевіряються суворо й повертають помилку для невідомих значень.
    - **edit**: редагувати надіслане повідомлення (`messageId`, `text`).
    - **unsend**: скасувати надсилання повідомлення (`messageId`).
    - **reply**: відповісти на конкретне повідомлення (`messageId`, `text`, `to`).
    - **sendWithEffect**: надіслати з ефектом iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: перейменувати груповий чат (`chatGuid`, `displayName`).
    - **setGroupIcon**: установити іконку/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повернути успіх, але іконка не синхронізується).
    - **addParticipant**: додати когось до групи (`chatGuid`, `address`).
    - **removeParticipant**: видалити когось із групи (`chatGuid`, `address`).
    - **leaveGroup**: вийти з групового чату (`chatGuid`).
    - **upload-file**: надіслати медіа/файли (`to`, `buffer`, `filename`, `asVoice`).
      - Голосові нотатки: задайте `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових нотаток.
    - Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` є канонічною назвою дії.

  </Accordion>
</AccordionGroup>

### Ідентифікатори повідомлень (короткі та повні)

OpenClaw може показувати _короткі_ ідентифікатори повідомлень (наприклад, `1`, `2`), щоб заощадити токени.

- `MessageSid` / `ReplyToId` можуть бути короткими ідентифікаторами.
- `MessageSidFull` / `ReplyToIdFull` містять повні ідентифікатори провайдера.
- Короткі ідентифікатори зберігаються в пам'яті; вони можуть застаріти після перезапуску або витіснення з кешу.
- Дії приймають короткий або повний `messageId`, але короткі ідентифікатори спричинять помилку, якщо вони більше недоступні.

Використовуйте повні ідентифікатори для довговічних автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Конфігурація](/uk/gateway/configuration) щодо змінних шаблонів.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об'єднання DM із розділеним надсиланням (команда + URL в одному складеному повідомленні)

Коли користувач вводить команду та URL разом в iMessage — наприклад, `Dump https://example.com/article` — Apple розділяє надсилання на **дві окремі доставки webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашку URL-перегляду (`"https://..."`) з OG-зображеннями попереднього перегляду як вкладеннями.

Два webhook надходять до OpenClaw з інтервалом приблизно 0,8-2,0 с у більшості конфігурацій. Без об'єднання агент отримує лише команду на ході 1, відповідає (часто "надішли мені URL") і бачить URL лише на ході 2 — коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` вмикає для DM об'єднання послідовних webhook від того самого відправника в один хід агента. Групові чати й надалі ключуються за повідомленням, щоб зберегти структуру ходів із кількома користувачами.

<Tabs>
  <Tab title="When to enable">
    Увімкніть, коли:

    - Ви постачаєте skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL, зображення або довгий вміст разом із командами.
    - Ви можете прийняти додаткову затримку ходу DM (див. нижче).

    Залиште вимкненим, коли:

    - Вам потрібна мінімальна затримка команди для однослівних тригерів DM.
    - Усі ваші потоки — одноразові команди без подальших payload.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Коли прапорець увімкнено й немає явного `messages.inbound.byChannel.bluebubbles`, вікно debounce розширюється до **2500 мс** (типове значення без об'єднання — 500 мс). Ширше вікно потрібне — cadence розділеного надсилання Apple у 0,8-2,0 с не вкладається в жорсткіше типове значення.

    Щоб налаштувати вікно самостійно:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Додаткова затримка для керівних команд DM.** Коли прапорець увімкнено, повідомлення керівних команд DM (як-от `Dump`, `Save` тощо) тепер очікують до кінця вікна debounce перед відправленням на обробку, на випадок якщо надходить webhook із payload. Команди в групових чатах зберігають миттєве відправлення.
    - **Об'єднаний вивід обмежений** — об'єднаний текст обмежується 4000 символами з явним маркером `…[truncated]`; вкладення — 20; записи джерел — 10 (понад це зберігаються перший і найновіший). Кожен вихідний `messageId` усе ще потрапляє до дедуплікації вхідних повідомлень, тому пізніший повтор будь-якої окремої події MessagePoller розпізнається як дублікат.
    - **Увімкнення окремо для каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються.

  </Tab>
</Tabs>

### Сценарії та що бачить агент

| Користувач складає повідомлення                                    | Apple доставляє           | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 мс                                     |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                       | 2 webhook з інтервалом ~1 с | Два ходи агента: лише "Dump", потім URL | Один хід: об'єднаний текст `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 webhook                 | Два ходи                                | Один хід: текст + зображення                                            |
| `/status` (окрема команда)                                         | 1 webhook                 | Миттєве відправлення                    | **Очікує до кінця вікна, потім відправляється**                         |
| URL, вставлений окремо                                             | 1 webhook                 | Миттєве відправлення                    | Миттєве відправлення (лише один запис у bucket)                         |
| Текст + URL, надіслані як два навмисно окремі повідомлення з різницею в хвилини | 2 webhook поза вікном | Два ходи                                | Два ходи (вікно спливає між ними)                                       |
| Швидкий потік (>10 малих DM усередині вікна)                       | N webhook                 | N ходів                                 | Один хід, обмежений вивід (перший + найновіший, застосовано обмеження тексту/вкладень) |

### Усунення проблем з об'єднанням розділеного надсилання

Якщо прапорець увімкнено, але розділені надсилання все ще надходять як два ходи, перевірте кожен рівень:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Потім `openclaw gateway restart` — прапорець читається під час створення реєстру debouncer.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    Перегляньте журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Виміряйте проміжок між відправленням тексту на кшталт `"Dump"` і наступним відправленням `"https://..."; Attachments:`. Збільште `messages.inbound.byChannel.bluebubbles`, щоб він із запасом покривав цей проміжок.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    Мітки часу подій сеансу (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають момент, коли Gateway передає повідомлення агенту, **а не** момент надходження webhook. Друге повідомлення в черзі з позначкою `[Queued messages while agent was busy]` означає, що перший хід усе ще виконувався, коли надійшов другий webhook — bucket об'єднання вже було скинуто. Налаштовуйте вікно за журналом сервера BB, а не за журналом сеансу.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    На менших машинах (8 ГБ) ходи агента можуть тривати достатньо довго, щоб bucket об'єднання скинувся до завершення відповіді, і URL потрапив як другий хід у черзі. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway має понад ~500 МБ RSS і компресор активний, закрийте інші важкі процеси або перейдіть на більший хост.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    Якщо користувач натиснув `Dump` як **відповідь** на наявну URL-бульбашку (iMessage показує бейдж "1 Reply" на бульбашці Dump), URL міститься в `replyToBody`, а не в другому webhook. Об'єднання не застосовується — це питання skill/промпта, а не debouncer.
  </Accordion>
</AccordionGroup>

## Блокове потокове передавання

Керуйте тим, чи відповіді надсилаються як одне повідомлення, чи потоково блоками:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Медіа + обмеження

- Вхідні вкладення завантажуються та зберігаються в кеші медіа.
- Обмеження медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 МБ).
- Вихідний текст розбивається на фрагменти за `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: увімкнути/вимкнути канал.
    - `channels.bluebubbles.serverUrl`: базова URL-адреса REST API BlueBubbles.
    - `channels.bluebubbles.password`: пароль API.
    - `channels.bluebubbles.webhookPath`: шлях endpoint webhook (типово: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist DM (handles, emails, E.164 numbers, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist відправників групи.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: на macOS, за потреби доповнювати безіменних учасників групи з локальних Контактів після проходження gating. Типово: `false`.
    - `channels.bluebubbles.groups`: конфігурація для кожної групи (`requireMention` тощо).

  </Accordion>
  <Accordion title="Доставка та фрагментація">
    - `channels.bluebubbles.sendReadReceipts`: Надсилати сповіщення про прочитання (типово: `true`).
    - `channels.bluebubbles.blockStreaming`: Увімкнути блокове потокове передавання (типово: `false`; потрібно для потокових відповідей).
    - `channels.bluebubbles.textChunkLimit`: Розмір вихідного фрагмента в символах (типово: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Тайм-аут на запит у мс для надсилання вихідного тексту через `/api/v1/message/text` (типово: 30000). Збільште на конфігураціях macOS 26, де надсилання Private API iMessage може зависати на 60+ секунд усередині фреймворку iMessage; наприклад `45000` або `60000`. Перевірки, пошук чатів, реакції, редагування та перевірки справності наразі зберігають коротше типове значення 10 с; розширення покриття на реакції та редагування заплановано як подальше поліпшення. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише за перевищення `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед фрагментацією за довжиною.

  </Accordion>
  <Accordion title="Медіа та історія">
    - `channels.bluebubbles.mediaMaxMb`: Обмеження вхідних/вихідних медіа в МБ (типово: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Явний список дозволених абсолютних локальних каталогів, дозволених для вихідних локальних шляхів до медіа. Надсилання локальних шляхів типово заборонено, якщо це не налаштовано. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Об’єднувати послідовні Webhook DM від одного відправника в один хід агента, щоб розділене Apple надсилання текст+URL надходило як одне повідомлення (типово: `false`). Див. [Об’єднання розділених DM](#coalescing-split-send-dms-command--url-in-one-composition) для сценаріїв, налаштування вікна та компромісів. Розширює типове вікно debounce для вхідних повідомлень із 500 мс до 2500 мс, коли ввімкнено без явного `messages.inbound.byChannel.bluebubbles`.
    - `channels.bluebubbles.historyLimit`: Максимальна кількість групових повідомлень для контексту (0 вимикає).
    - `channels.bluebubbles.dmHistoryLimit`: Обмеження історії DM.

  </Accordion>
  <Accordion title="Дії та облікові записи">
    - `channels.bluebubbles.actions`: Увімкнути/вимкнути певні дії.
    - `channels.bluebubbles.accounts`: Конфігурація кількох облікових записів.

  </Accordion>
</AccordionGroup>

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Надавайте перевагу `chat_guid` для стабільної маршрутизації:

- `chat_guid:iMessage;-;+15555550123` (бажано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі дескриптори: `+15555550123`, `user@example.com`
  - Якщо прямий дескриптор не має наявного DM-чату, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно ввімкнути BlueBubbles Private API.

### Маршрутизація iMessage і SMS

Коли той самий дескриптор має на Mac і iMessage-, і SMS-чат (наприклад, номер телефону, зареєстрований в iMessage, але який також отримував резервні повідомлення з зеленими бульбашками), OpenClaw надає перевагу чату iMessage і ніколи тихо не переходить на SMS. Щоб примусово використати SMS-чат, застосуйте явний префікс цілі `sms:` (наприклад `sms:+15555550123`). Дескриптори без відповідного iMessage-чату все одно надсилаються через будь-який чат, який повідомляє BlueBubbles.

## Безпека

- Запити Webhook автентифікуються порівнянням параметрів запиту або заголовків `guid`/`password` із `channels.bluebubbles.password`.
- Тримайте пароль API та кінцеву точку Webhook у секреті (розглядайте їх як облікові дані).
- Для автентифікації BlueBubbles Webhook немає обходу через localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles у запиті наскрізно. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Увімкніть HTTPS + правила брандмауера на сервері BlueBubbles, якщо відкриваєте його за межі вашої LAN.

## Усунення несправностей

- Якщо події введення/прочитання перестають працювати, перевірте журнали BlueBubbles Webhook і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Коди сполучення спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Для реакцій потрібен приватний API BlueBubbles (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Для редагування/скасування надсилання потрібні macOS 13+ і сумісна версія сервера BlueBubbles. На macOS 26 (Tahoe) редагування наразі не працює через зміни приватного API.
- Оновлення іконок груп можуть бути нестабільними на macOS 26 (Tahoe): API може повернути успіх, але нова іконка не синхронізується.
- OpenClaw автоматично приховує відомі непрацездатні дії на основі версії macOS сервера BlueBubbles. Якщо редагування все ще з’являється на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад, `Dump` + URL) все одно надходять як два ходи: див. контрольний список [усунення несправностей об’єднання розділених надсилань](#split-send-coalescing-troubleshooting) — поширені причини: занадто вузьке вікно debounce, часові позначки журналу сесії помилково прийнято за час надходження Webhook або надсилання з цитатою-відповіддю (яке використовує `replyToBody`, а не другий Webhook).
- Для інформації про стан/справність: `openclaw status --all` або `openclaw status --deep`.

Загальну довідку щодо робочих процесів каналів див. у [Каналах](/uk/channels) і посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та керування згадками
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
