---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення несправностей зі сполученням Webhook
    - Налаштування iMessage на macOS
sidebarTitle: BlueBubbles
summary: Застаріла підтримка iMessage через macOS-сервер BlueBubbles (надсилання/отримання через REST, введення тексту, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:50:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

Статус: вбудований застарілий plugin, який спілкується із сервером BlueBubbles для macOS через HTTP. Наявні налаштування BlueBubbles продовжують працювати, але для нових розгортань OpenClaw iMessage варто віддавати перевагу нативному plugin [iMessage](/uk/channels/imessage), коли його вимоги підходять для вашого хоста.

<Warning>
BlueBubbles застарілий для нових налаштувань OpenClaw.

Висхідна екосистема BlueBubbles усе ще активна, але OpenClaw залежить від API сервера BlueBubbles для macOS. Станом на 6 травня 2026 року офіційна гілка розробки [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) востаннє змінювалася [22 січня 2026 року](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037), а останній випуск сервера ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) було опубліковано 16 травня 2025 року. Клієнтський застосунок і допоміжні репозиторії мають новішу активність, тому це не твердження про занедбаність; позначення як застарілого стосується зменшення залежності OpenClaw від зовнішнього HTTP-сервера, webhooks і поверхні сумісності приватного API, коли нативний шлях `imsg` утримує інтеграцію на локальному контракті stdio.
</Warning>

<Note>
Поточні випуски OpenClaw постачають BlueBubbles у комплекті, тому звичайні пакетні збірки не потребують окремого кроку `openclaw plugins install`.
</Note>

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Застарілий резервний варіант для інсталяцій, які вже покладаються на ідентифікатори каналів BlueBubbles, стан webhook, цілі груп, доставку cron або маршрутизацію робочих просторів.
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі зламане на Tahoe, а оновлення піктограм груп можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw спілкується з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через webhooks; вихідні відповіді, індикатори набору, сповіщення про прочитання й tapbacks є REST-викликами.
- Вкладення та стікери приймаються як вхідні медіа (і за можливості показуються агенту).
- Автоматичні TTS-відповіді, які синтезують аудіо MP3 або CAF, доставляються як бульбашки голосових нотаток iMessage, а не як звичайні файлові вкладення.
- Парування/список дозволених працює так само, як для інших каналів (`/channels/pairing` тощо), з `channels.bluebubbles.allowFrom` + кодами парування.
- Реакції відображаються як системні події, так само як у Slack/Telegram, щоб агенти могли «згадати» їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, гілки відповідей, ефекти повідомлень, керування групами.

## Швидкий старт

<Steps>
  <Step title="Установіть BlueBubbles">
    Установіть сервер BlueBubbles на ваш Mac (дотримуйтеся інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Увімкніть веб-API">
    У конфігурації BlueBubbles увімкніть веб-API та задайте пароль.
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
  <Step title="Спрямуйте webhooks на Gateway">
    Спрямуйте webhooks BlueBubbles на ваш gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Запустіть Gateway">
    Запустіть gateway; він зареєструє обробник webhook і почне парування.
  </Step>
</Steps>

<Warning>
**Безпека**

- Завжди задавайте пароль webhook.
- Автентифікація webhook завжди обов’язкова. OpenClaw відхиляє запити webhook BlueBubbles, якщо вони не містять password/guid, що збігається з `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/proxy.
- Автентифікація паролем перевіряється перед читанням/розбором повних тіл webhook.

</Warning>

## Підтримання Messages.app активним (VM / безголові налаштування)

Деякі налаштування macOS VM / always-on можуть призводити до того, що Messages.app переходить у стан «idle» (вхідні події зупиняються, доки застосунок не відкриють/не виведуть на передній план). Простий обхідний шлях — **підштовхувати Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

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

    Це запускається **кожні 300 секунд** і **під час входу**. Перший запуск може спричинити запити macOS **Automation** (`osascript` → Messages). Підтвердьте їх у тій самій сесії користувача, яка запускає LaunchAgent.

  </Step>
  <Step title="Завантажте його">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Початкове налаштування

BlueBubbles доступний в інтерактивному початковому налаштуванні:

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
  Шлях кінцевої точки webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` або `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Номери телефонів, електронні адреси або цілі чатів.
</ParamField>

Також можна додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Контроль доступу (DM + групи)

<Tabs>
  <Tab title="DM">
    - За замовчуванням: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Невідомі відправники отримують код парування; повідомлення ігноруються, доки їх не схвалять (коди спливають через 1 годину).
    - Схвалення через:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Парування є типовим обміном токенами. Докладніше: [Парування](/uk/channels/pairing)

  </Tab>
  <Tab title="Групи">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (за замовчуванням: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` визначає, хто може запускати в групах, коли встановлено `allowlist`.

  </Tab>
</Tabs>

### Збагачення імен контактів (macOS, необов’язково)

Групові webhooks BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, можна увімкнути локальне збагачення з Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. За замовчуванням: `false`.
- Пошуки виконуються лише після того, як груповий доступ, авторизація команд і фільтрація згадок дозволили повідомлення.
- Збагачуються лише учасники з телефонними номерами без імен.
- Сирі номери телефонів залишаються резервним варіантом, коли локальний збіг не знайдено.

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
- Коли `requireMention` увімкнено для групи, агент відповідає лише тоді, коли його згадано.
- Команди керування від авторизованих відправників обходять фільтрацію згадок.

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

- Команди керування (наприклад, `/config`, `/model`) потребують авторизації.
- Використовує `allowFrom` і `groupAllowFrom`, щоб визначити авторизацію команд.
- Авторизовані відправники можуть запускати команди керування навіть без згадки в групах.

### Системна підказка для окремої групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Значення вставляється в системну підказку агента на кожному ході, який обробляє повідомлення в цій групі, тож можна задавати персоналію або поведінкові правила для окремої групи без редагування підказок агента:

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

Ключ відповідає тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а запис із wildcard `"*"` надає значення за замовчуванням для кожної групи без точного збігу (той самий шаблон використовується `requireMention` і політиками інструментів для окремих груп). Точні збіги завжди мають перевагу над wildcard. DM ігнорують це поле; натомість використовуйте налаштування підказок на рівні агента або облікового запису.

#### Робочий приклад: гілкові відповіді та реакції tapback (приватний API)

Коли приватний API BlueBubbles увімкнено, вхідні повідомлення надходять із короткими ідентифікаторами повідомлень (наприклад, `[[reply_to:5]]`), і агент може викликати `action=reply`, щоб відповісти в гілці конкретного повідомлення, або `action=react`, щоб додати tapback. `systemPrompt` для окремої групи — надійний спосіб утримати агента у виборі правильного інструмента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Реакції tapback і гілкові відповіді обидві потребують приватного API BlueBubbles; див. [Розширені дії](#advanced-actions) і [Ідентифікатори повідомлень](#message-ids-short-vs-full) щодо базової механіки.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на довговічні робочі простори ACP без зміни транспортного рівня.

Швидкий потік оператора:

- Запустіть `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в тій самій розмові BlueBubbles маршрутизуються до породженої сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Налаштовані сталі прив’язки також підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований DM-ідентифікатор, як-от `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних прив’язок груп надавайте перевагу `chat_id:*` або `chat_identifier:*`.

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

Див. [ACP Agents](/uk/tools/acp-agents) щодо спільної поведінки прив’язок ACP.

## Індикатори набору + сповіщення про прочитання

- **Індикатори набору**: надсилаються автоматично до та під час генерації відповіді.
- **Сповіщення про прочитання**: керуються `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори набору**: OpenClaw надсилає події початку набору; BlueBubbles автоматично очищає індикатор набору під час надсилання або після тайм-ауту (ручна зупинка через DELETE ненадійна).

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

BlueBubbles підтримує розширені дії з повідомленнями, якщо їх увімкнено в конфігурації:

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
  <Accordion title="Доступні дії">
    - **react**: додати/видалити реакції tapback (`messageId`, `emoji`, `remove`). Власний набір tapback в iMessage: `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає emoji поза цим набором (наприклад `👀`), інструмент реакцій повертається до `love`, щоб tapback усе одно відобразився, а не зламав увесь запит. Налаштовані ack-реакції й надалі перевіряються суворо й дають помилку для невідомих значень.
    - **edit**: редагувати надіслане повідомлення (`messageId`, `text`).
    - **unsend**: скасувати надсилання повідомлення (`messageId`).
    - **reply**: відповісти на конкретне повідомлення (`messageId`, `text`, `to`).
    - **sendWithEffect**: надіслати з ефектом iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: перейменувати груповий чат (`chatGuid`, `displayName`).
    - **setGroupIcon**: установити іконку/фото групового чату (`chatGuid`, `media`) - нестабільно на macOS 26 Tahoe (API може повернути успіх, але іконка не синхронізується).
    - **addParticipant**: додати когось до групи (`chatGuid`, `address`).
    - **removeParticipant**: видалити когось із групи (`chatGuid`, `address`).
    - **leaveGroup**: вийти з групового чату (`chatGuid`).
    - **upload-file**: надіслати медіа/файли (`to`, `buffer`, `filename`, `asVoice`).
      - Голосові нотатки: установіть `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати його як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових нотаток.
    - Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` є канонічною назвою дії.

  </Accordion>
</AccordionGroup>

### ID повідомлень (короткі та повні)

OpenClaw може показувати _короткі_ ID повідомлень (наприклад, `1`, `2`), щоб заощаджувати токени.

- `MessageSid` / `ReplyToId` можуть бути короткими ID.
- `MessageSidFull` / `ReplyToIdFull` містять повні ID провайдера.
- Короткі ID зберігаються в пам’яті; вони можуть застаріти після перезапуску або витіснення з кешу.
- Дії приймають короткий або повний `messageId`, але короткі ID даватимуть помилку, якщо вони більше недоступні.

Використовуйте повні ID для довговічних автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Конфігурація](/uk/gateway/configuration) щодо змінних шаблонів.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання split-send DM (команда + URL в одному введенні)

Коли користувач вводить команду та URL разом в iMessage - наприклад `Dump https://example.com/article` - Apple розбиває надсилання на **дві окремі доставки webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка URL-перегляду (`"https://..."`) із зображеннями OG-перегляду як вкладеннями.

У більшості налаштувань ці два webhooks надходять до OpenClaw з інтервалом приблизно 0.8-2.0 с. Без об’єднання агент отримує лише команду на ході 1, відповідає (часто «надішліть мені URL») і бачить URL лише на ході 2 - коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` вмикає для DM злиття послідовних webhooks від того самого відправника в один хід агента. Групові чати й надалі ключуються за окремими повідомленнями, щоб зберегти структуру ходів із багатьма користувачами.

<Tabs>
  <Tab title="Коли вмикати">
    Увімкніть, коли:

    - Ви постачаєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL, зображення або довгий вміст поруч із командами.
    - Ви можете прийняти додану затримку ходу DM (див. нижче).

    Залиште вимкненим, коли:

    - Вам потрібна мінімальна затримка команд для однослівних DM-тригерів.
    - Усі ваші потоки є одноразовими командами без подальших payload.

  </Tab>
  <Tab title="Увімкнення">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Якщо прапорець увімкнено й немає явного `messages.inbound.byChannel.bluebubbles`, вікно debounce розширюється до **2500 мс** (типове значення без об’єднання: 500 мс). Ширше вікно потрібне, бо каденція split-send Apple у 0.8-2.0 с не вміщується в тісніше типове значення.

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
  <Tab title="Компроміси">
    - **Додана затримка для керівних команд DM.** Коли прапорець увімкнено, повідомлення керівних команд DM (як-от `Dump`, `Save` тощо) тепер чекають до завершення вікна debounce перед dispatch, на випадок якщо надходить webhook із payload. Команди групового чату зберігають миттєвий dispatch.
    - **Об’єднаний вихід обмежений** - об’єднаний текст обмежується 4000 символами з явним маркером `…[truncated]`; вкладення - 20; записи джерел - 10 (після цього зберігаються перший і найновіший). Кожен source `messageId` усе одно потрапляє до inbound-dedupe, тож пізніший replay будь-якої окремої події від MessagePoller розпізнається як дублікат.
    - **Opt-in, на рівні каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються.

  </Tab>
</Tabs>

### Сценарії та що бачить агент

| Що вводить користувач                                              | Що доставляє Apple        | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 мс                                      |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                       | 2 webhooks з інтервалом ~1 с | Два ходи агента: лише "Dump", потім URL | Один хід: об’єднаний текст `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 webhooks                | Два ходи                                | Один хід: текст + зображення                                             |
| `/status` (самостійна команда)                                     | 1 webhook                 | Миттєвий dispatch                       | **Очікування до вікна, потім dispatch**                                  |
| URL, вставлений окремо                                             | 1 webhook                 | Миттєвий dispatch                       | Миттєвий dispatch (лише один запис у bucket)                             |
| Текст + URL, надіслані як два навмисно окремі повідомлення з різницею в кілька хвилин | 2 webhooks поза вікном | Два ходи                                | Два ходи (вікно спливає між ними)                                        |
| Швидкий потік (>10 малих DM у межах вікна)                         | N webhooks                | N ходів                                 | Один хід, обмежений вихід (перший + найновіший, застосовано ліміти тексту/вкладень) |

### Усунення проблем з об’єднанням split-send

Якщо прапорець увімкнено, але split-send усе одно надходять як два ходи, перевірте кожен шар:

<AccordionGroup>
  <Accordion title="Конфігурація справді завантажена">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Потім `openclaw gateway restart` - прапорець зчитується під час створення debouncer-registry.

  </Accordion>
  <Accordion title="Вікно debounce достатньо широке для вашого налаштування">
    Подивіться журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Виміряйте проміжок між dispatch тексту в стилі `"Dump"` і наступним dispatch `"https://..."; Attachments:`. Збільште `messages.inbound.byChannel.bluebubbles`, щоб із запасом покрити цей проміжок.

  </Accordion>
  <Accordion title="Мітки часу Session JSONL ≠ надходження webhook">
    Мітки часу подій сесії (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають, коли gateway передає повідомлення агенту, **а не** коли надійшов webhook. Друге повідомлення в черзі з тегом `[Queued messages while agent was busy]` означає, що перший хід усе ще виконувався, коли надійшов другий webhook - bucket об’єднання вже було flushed. Налаштовуйте вікно за журналом сервера BB, а не за журналом сесії.
  </Accordion>
  <Accordion title="Memory pressure сповільнює dispatch відповіді">
    На менших машинах (8 GB) ходи агента можуть тривати достатньо довго, щоб bucket об’єднання flushed до завершення відповіді, і URL потрапив як другий хід у черзі. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо gateway має понад ~500 MB RSS і compressor активний, закрийте інші важкі процеси або перейдіть на більший хост.
  </Accordion>
  <Accordion title="Надсилання reply-quote йде іншим шляхом">
    Якщо користувач натиснув `Dump` як **reply** до наявної URL-бульбашки (iMessage показує значок "1 Reply" на бульбашці Dump), URL міститься в `replyToBody`, а не в другому webhook. Об’єднання не застосовується - це питання skill/prompt, а не debouncer.
  </Accordion>
</AccordionGroup>

## Блокове streaming

Керуйте тим, чи відповіді надсилаються одним повідомленням, чи streamed блоками:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Медіа + ліміти

- Вхідні вкладення завантажуються й зберігаються в media cache.
- Ліміт медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 MB).
- Вихідний текст ділиться на фрагменти за `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

<AccordionGroup>
  <Accordion title="Підключення та Webhook">
    - `channels.bluebubbles.enabled`: Увімкнути/вимкнути канал.
    - `channels.bluebubbles.serverUrl`: Базова URL-адреса BlueBubbles REST API.
    - `channels.bluebubbles.password`: Пароль API.
    - `channels.bluebubbles.webhookPath`: Шлях кінцевої точки Webhook (типово: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Політика доступу">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
    - `channels.bluebubbles.allowFrom`: Список дозволених DM (handles, email-адреси, номери E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Список дозволених відправників групи.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: У macOS можна додатково збагачувати неназваних учасників групи з локальних Contacts після проходження перевірок доступу. Типово: `false`.
    - `channels.bluebubbles.groups`: Конфігурація для кожної групи (`requireMention` тощо).

  </Accordion>
  <Accordion title="Доставка та розбиття на фрагменти">
    - `channels.bluebubbles.sendReadReceipts`: Надсилати сповіщення про прочитання (типово: `true`).
    - `channels.bluebubbles.blockStreaming`: Увімкнути блокове потокове передавання (типово: `false`; потрібно для потокових відповідей).
    - `channels.bluebubbles.textChunkLimit`: Розмір вихідного фрагмента в символах (типово: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Тайм-аут кожного запиту в мс для надсилання вихідного тексту через `/api/v1/message/text` (типово: 30000). Збільшуйте його в конфігураціях macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворку iMessage; наприклад `45000` або `60000`. Зонди, пошук чатів, реакції, редагування та перевірки справності наразі зберігають коротше типове значення 10 с; розширення покриття на реакції та редагування заплановано як наступний крок. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише за перевищення `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.

  </Accordion>
  <Accordion title="Медіа та історія">
    - `channels.bluebubbles.mediaMaxMb`: Ліміт вхідних/вихідних медіа в МБ (типово: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Явний список дозволених абсолютних локальних каталогів, дозволених для шляхів вихідних локальних медіа. Надсилання локальних шляхів типово заборонене, якщо це не налаштовано. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Об’єднувати послідовні DM Webhook від одного відправника в один хід агента, щоб розділене надсилання тексту+URL від Apple надходило як одне повідомлення (типово: `false`). Див. [Об’єднання DM із розділеним надсиланням](#coalescing-split-send-dms-command--url-in-one-composition) для сценаріїв, налаштування вікна та компромісів. Розширює типове вікно debounce для вхідних повідомлень із 500 мс до 2500 мс, коли увімкнено без явного `messages.inbound.byChannel.bluebubbles`.
    - `channels.bluebubbles.historyLimit`: Максимальна кількість групових повідомлень для контексту (0 вимикає).
    - `channels.bluebubbles.dmHistoryLimit`: Ліміт історії DM.
    - `channels.bluebubbles.replyContextApiFallback`: Коли вхідна відповідь надходить без `replyToBody`/`replyToSender`, а кеш контексту відповіді в пам’яті не спрацьовує, отримати оригінальне повідомлення з BlueBubbles HTTP API як резервний варіант із найкращим зусиллям (типово: `false`). Корисно для розгортань із кількома екземплярами, що спільно використовують один обліковий запис BlueBubbles, після перезапусків процесу або після витіснення з довгоживучого кешу TTL/LRU. Отримання захищене від SSRF тією самою політикою, що й кожен інший клієнтський запит BlueBubbles, ніколи не викидає помилку та заповнює кеш, щоб наступні відповіді амортизували витрати. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Налаштування на рівні каналу поширюється на облікові записи, які не задають цей прапорець.

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
- Прямі handles: `+15555550123`, `user@example.com`
  - Якщо прямий handle не має наявного DM-чату, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно ввімкнути BlueBubbles Private API.

### Маршрутизація iMessage і SMS

Коли той самий handle має і чат iMessage, і чат SMS на Mac (наприклад, номер телефону, зареєстрований в iMessage, але який також отримував резервні зелені SMS), OpenClaw надає перевагу чату iMessage і ніколи непомітно не понижує доставку до SMS. Щоб примусово використати чат SMS, застосуйте явний префікс цілі `sms:` (наприклад `sms:+15555550123`). Handles без відповідного чату iMessage усе одно надсилаються через будь-який чат, який повідомляє BlueBubbles.

## Безпека

- Запити Webhook автентифікуються порівнянням query-параметрів або заголовків `guid`/`password` із `channels.bluebubbles.password`.
- Тримайте пароль API і кінцеву точку Webhook у секреті (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу через localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles у запиті від початку до кінця. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Увімкніть HTTPS + правила брандмауера на сервері BlueBubbles, якщо відкриваєте його за межі своєї LAN.

## Усунення несправностей

- Якщо події введення/прочитання перестали працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Коди спарювання спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Реакції потребують приватного API BlueBubbles (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Редагування/скасування надсилання потребує macOS 13+ і сумісної версії сервера BlueBubbles. У macOS 26 (Tahoe) редагування наразі зламане через зміни приватного API.
- Оновлення піктограм груп можуть бути нестабільними в macOS 26 (Tahoe): API може повернути успіх, але нова піктограма не синхронізується.
- OpenClaw автоматично приховує відомо зламані дії на основі версії macOS сервера BlueBubbles. Якщо редагування все ще відображається в macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад `Dump` + URL) усе ще надходять як два ходи: див. контрольний список [усунення несправностей об’єднання розділених надсилань](#split-send-coalescing-troubleshooting) - поширені причини: занадто вузьке вікно debounce, часові позначки журналу сеансу помилково сприйняті як надходження Webhook або надсилання цитати-відповіді (яке використовує `replyToBody`, а не другий Webhook).
- Для інформації про стан/справність: `openclaw status --all` або `openclaw status --deep`.

Загальну довідку щодо робочого процесу каналів див. у [Канали](/uk/channels) та посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) - маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) - усі підтримувані канали
- [Групи](/uk/channels/groups) - поведінка групових чатів і фільтрація за згадками
- [Спарювання](/uk/channels/pairing) - автентифікація DM і потік спарювання
- [Безпека](/uk/gateway/security) - модель доступу та посилення захисту
