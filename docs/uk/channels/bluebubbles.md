---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення несправностей сполучення Webhook
    - Налаштування iMessage на macOS
sidebarTitle: BlueBubbles
summary: iMessage через сервер BlueBubbles для macOS (REST надсилання/отримання, індикація набору, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T07:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Статус: вбудований Plugin, який взаємодіє із сервером BlueBubbles для macOS через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно зі застарілим каналом imsg.

<Note>
Поточні релізи OpenClaw містять BlueBubbles у комплекті, тому звичайним пакетним збіркам не потрібен окремий крок `openclaw plugins install`.
</Note>

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі зламане на Tahoe, а оновлення значка групи можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через Webhook; вихідні відповіді, індикатори набору, сповіщення про прочитання та tapback-реакції виконуються через REST-виклики.
- Вкладення та стікери обробляються як вхідні медіа (і передаються агенту, коли це можливо).
- Автоматичні TTS-відповіді, які синтезують аудіо MP3 або CAF, доставляються як бульбашки голосових повідомлень iMessage замість звичайних файлових вкладень.
- Сполучення/allowlist працює так само, як і в інших каналах (`/channels/pairing` тощо) з `channels.bluebubbles.allowFrom` + кодами сполучення.
- Реакції відображаються як системні події, так само як у Slack/Telegram, тому агенти можуть "згадувати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, відповіді в ланцюжках, ефекти повідомлень, керування групами.

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
  <Step title="Спрямуйте Webhook на Gateway">
    Спрямуйте Webhook BlueBubbles на свій Gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Запустіть Gateway">
    Запустіть Gateway; він зареєструє обробник Webhook і почне сполучення.
  </Step>
</Steps>

<Warning>
**Безпека**

- Завжди задавайте пароль Webhook.
- Автентифікація Webhook завжди обов’язкова. OpenClaw відхиляє запити Webhook BlueBubbles, якщо вони не містять пароль/guid, що відповідає `channels.bluebubbles.password` (наприклад `?password=<password>` або `x-password`), незалежно від топології loopback/проксі.
- Автентифікація за паролем перевіряється до читання/розбору повних тіл Webhook.

</Warning>

## Підтримання Messages.app активним (VM / headless-налаштування)

У деяких налаштуваннях macOS VM / always-on Messages.app може переходити в стан "idle" (вхідні події зупиняються, доки застосунок не буде відкрито/виведено на передній план). Простий обхідний шлях — **торкатися Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

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

    Це запускається **кожні 300 секунд** і **під час входу в систему**. Перший запуск може спричинити запити macOS **Automation** (`osascript` → Messages). Підтвердьте їх у тому самому сеансі користувача, у якому працює LaunchAgent.

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

<ParamField path="URL сервера" type="string" required>
  Адреса сервера BlueBubbles (наприклад, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Пароль" type="string" required>
  Пароль API з налаштувань сервера BlueBubbles.
</ParamField>
<ParamField path="Шлях Webhook" type="string" default="/bluebubbles-webhook">
  Шлях кінцевої точки Webhook.
</ParamField>
<ParamField path="Політика DM" type="string">
  `pairing`, `allowlist`, `open` або `disabled`.
</ParamField>
<ParamField path="Список дозволених" type="string[]">
  Номери телефонів, адреси електронної пошти або цілі чатів.
</ParamField>

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Керування доступом (DM + групи)

<Tabs>
  <Tab title="DM">
    - Типово: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Невідомі відправники отримують код сполучення; повідомлення ігноруються до схвалення (коди дійсні 1 годину).
    - Схвалення через:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Сполучення — це типовий обмін токенами. Докладніше: [Сполучення](/uk/channels/pairing)

  </Tab>
  <Tab title="Групи">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (типово: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` визначає, хто може запускати в групах, коли встановлено `allowlist`.

  </Tab>
</Tabs>

### Збагачення імен контактів (macOS, необов’язково)

Webhook груп BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, можна ввімкнути локальне збагачення з Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. Типово: `false`.
- Пошук виконується лише після того, як доступ до групи, авторизація команди та фільтрація згадок дозволили проходження повідомлення.
- Збагачуються лише безіменні телефонні учасники.
- Сирі номери телефонів залишаються резервним варіантом, якщо локального збігу не знайдено.

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

BlueBubbles підтримує фільтрацію згадок для групових чатів, що відповідає поведінці iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадок.
- Коли для групи ввімкнено `requireMention`, агент відповідає лише за наявності згадки.
- Керувальні команди від авторизованих відправників обходять фільтрацію згадок.

Налаштування для кожної групи:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // типово для всіх груп
        "iMessage;-;chat123": { requireMention: false }, // перевизначення для конкретної групи
      },
    },
  },
}
```

### Фільтрація команд

- Керувальні команди (наприклад, `/config`, `/model`) потребують авторизації.
- Використовує `allowFrom` і `groupAllowFrom` для визначення авторизації команд.
- Авторизовані відправники можуть запускати керувальні команди навіть без згадки в групах.

### Системний промпт для кожної групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Це значення додається до системного промпту агента в кожному ході, який обробляє повідомлення в цій групі, тож ви можете задавати персональність або правила поведінки для окремих груп без редагування промптів агента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Тримай відповіді до 3 речень. Віддзеркалюй невимушений тон групи.",
        },
      },
    },
  },
}
```

Ключ відповідає тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а запис із шаблоном `"*"` надає типове значення для кожної групи без точного збігу (та сама схема використовується для `requireMention` і політик інструментів для кожної групи). Точні збіги завжди мають пріоритет над шаблоном. DM ігнорують це поле; натомість використовуйте налаштування промптів на рівні агента або облікового запису.

#### Приклад: ланцюжкові відповіді та tapback-реакції (Private API)

Коли ввімкнено BlueBubbles Private API, вхідні повідомлення надходять із короткими ідентифікаторами повідомлень (наприклад, `[[reply_to:5]]`), і агент може викликати `action=reply`, щоб відповісти в конкретне повідомлення ланцюжком, або `action=react`, щоб додати tapback. `systemPrompt` для конкретної групи — це надійний спосіб забезпечити вибір агентом правильного інструмента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Відповідаючи в цій групі, завжди викликай action=reply з",
            "messageId `[[reply_to:N]]` із контексту, щоб твоя відповідь ішла",
            "під повідомленням, яке її спричинило. Ніколи не надсилай нове непов’язане повідомлення.",
            "",
            "Для коротких підтверджень ('ok', 'got it', 'on it') використовуй",
            "action=react з відповідним tapback-емодзі (❤️, 👍, 😂, ‼️, ❓)",
            "замість надсилання текстової відповіді.",
          ].join(" "),
        },
      },
    },
  },
}
```

І tapback-реакції, і ланцюжкові відповіді потребують BlueBubbles Private API; див. [Розширені дії](#advanced-actions) і [Ідентифікатори повідомлень](#message-ids-short-vs-full) для базової механіки.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на постійні робочі простори ACP без зміни транспортного рівня.

Швидкий процес для оператора:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Подальші повідомлення в цій самій розмові BlueBubbles маршрутизуються до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Налаштовані постійні прив’язки також підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований DM-ідентифікатор, наприклад `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних прив’язок груп віддавайте перевагу `chat_id:*` або `chat_identifier:*`.

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

Див. [ACP Agents](/uk/tools/acp-agents), щоб дізнатися про спільну поведінку прив’язок ACP.

## Індикатори набору + сповіщення про прочитання

- **Індикатори набору**: надсилаються автоматично до початку та під час генерації відповіді.
- **Сповіщення про прочитання**: керуються через `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори набору**: OpenClaw надсилає події початку набору; BlueBubbles автоматично очищує стан набору під час надсилання або за тайм-аутом (ручна зупинка через DELETE ненадійна).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // вимкнути сповіщення про прочитання
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
        reactions: true, // tapback-реакції (типово: true)
        edit: true, // редагування надісланих повідомлень (macOS 13+, зламано на macOS 26 Tahoe)
        unsend: true, // скасування надсилання повідомлень (macOS 13+)
        reply: true, // ланцюжкові відповіді за GUID повідомлення
        sendWithEffect: true, // ефекти повідомлень (slam, loud тощо)
        renameGroup: true, // перейменування групових чатів
        setGroupIcon: true, // встановлення значка/фото групового чату (нестабільно на macOS 26 Tahoe)
        addParticipant: true, // додавання учасників до груп
        removeParticipant: true, // видалення учасників із груп
        leaveGroup: true, // вихід із групових чатів
        sendAttachment: true, // надсилання вкладень/медіа
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Доступні дії">
    - **react**: додавання/видалення tapback-реакцій (`messageId`, `emoji`, `remove`). Власний набір tapback в iMessage: `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає емодзі поза цим набором (наприклад `👀`), інструмент реакції повертається до `love`, щоб tapback усе одно відобразився замість помилки всього запиту. Налаштовані ack-реакції, як і раніше, проходять сувору перевірку та дають помилку для невідомих значень.
    - **edit**: редагування надісланого повідомлення (`messageId`, `text`).
    - **unsend**: скасування надсилання повідомлення (`messageId`).
    - **reply**: відповідь на конкретне повідомлення (`messageId`, `text`, `to`).
    - **sendWithEffect**: надсилання з ефектом iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: перейменування групового чату (`chatGuid`, `displayName`).
    - **setGroupIcon**: встановлення значка/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повертати успіх, але значок не синхронізується).
    - **addParticipant**: додавання когось до групи (`chatGuid`, `address`).
    - **removeParticipant**: видалення когось із групи (`chatGuid`, `address`).
    - **leaveGroup**: вихід із групового чату (`chatGuid`).
    - **upload-file**: надсилання медіа/файлів (`to`, `buffer`, `filename`, `asVoice`).
      - Голосові повідомлення: задайте `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати його як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових повідомлень.
    - Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` — це канонічна назва дії.

  </Accordion>
</AccordionGroup>

### Ідентифікатори повідомлень (короткі vs повні)

OpenClaw може показувати _короткі_ ідентифікатори повідомлень (наприклад, `1`, `2`) для економії токенів.

- `MessageSid` / `ReplyToId` можуть бути короткими ідентифікаторами.
- `MessageSidFull` / `ReplyToIdFull` містять повні ідентифікатори провайдера.
- Короткі ідентифікатори зберігаються в пам’яті; вони можуть зникнути після перезапуску або очищення кешу.
- Дії приймають короткий або повний `messageId`, але короткі ідентифікатори дадуть помилку, якщо вони більше недоступні.

Використовуйте повні ідентифікатори для довговічних автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Конфігурація](/uk/gateway/configuration) щодо змінних шаблонів.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання розділених надсилань у DM (команда + URL в одному наборі)

Коли користувач вводить команду та URL разом в iMessage — наприклад, `Dump https://example.com/article` — Apple розділяє надсилання на **дві окремі доставки Webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка попереднього перегляду URL (`"https://..."`) із зображеннями OG-перегляду як вкладеннями.

На більшості налаштувань ці два Webhook надходять до OpenClaw з інтервалом приблизно 0.8-2.0 с. Без об’єднання агент отримує лише команду на ході 1, відповідає (часто "надішліть мені URL"), а URL бачить лише на ході 2 — коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` дозволяє для DM зливати послідовні Webhook від одного відправника в один хід агента. Групові чати й надалі прив’язуються до окремих повідомлень, щоб зберігалася структура ходів від кількох користувачів.

<Tabs>
  <Tab title="Коли вмикати">
    Вмикайте, якщо:

    - Ви постачаєте Skills, які очікують `команда + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL, зображення або довгий вміст разом із командами.
    - Ви можете прийняти додаткову затримку ходу DM (див. нижче).

    Залишайте вимкненим, якщо:

    - Вам потрібна мінімальна затримка команд для однословних тригерів DM.
    - Усі ваші потоки — це одноразові команди без наступного payload.

  </Tab>
  <Tab title="Увімкнення">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // увімкнути (типово: false)
        },
      },
    }
    ```

    Якщо прапорець увімкнено і немає явного `messages.inbound.byChannel.bluebubbles`, вікно дебаунсу розширюється до **2500 ms** (типове значення без об’єднання — 500 ms). Ширше вікно потрібне обов’язково — темп Apple для розділеного надсилання 0.8-2.0 с не вкладається в жорсткіше типове значення.

    Щоб налаштувати вікно вручну:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms підходить для більшості налаштувань; підніміть до 4000 ms, якщо ваш Mac повільний
            // або перебуває під тиском пам’яті (тоді спостережуваний інтервал може перевищувати 2 с).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Компроміси">
    - **Додаткова затримка для керувальних команд у DM.** Якщо прапорець увімкнено, повідомлення керувальних команд у DM (наприклад `Dump`, `Save` тощо) тепер чекають до завершення вікна дебаунсу перед відправленням, на випадок якщо надійде Webhook із payload. Команди в групових чатах зберігають миттєве відправлення.
    - **Об’єднаний вихід має обмеження** — об’єднаний текст обмежується 4000 символами з явним маркером `…[truncated]`; вкладення — 20; записи джерела — 10 (понад це зберігаються перший і останній). Кожен вихідний `messageId` усе одно потрапляє до inbound-dedupe, тож пізніше повторне відтворення будь-якої окремої події через MessagePoller розпізнається як дублікат.
    - **Увімкнення за бажанням, для окремого каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються.

  </Tab>
</Tabs>

### Сценарії та що бачить агент

| Що вводить користувач                                              | Що доставляє Apple         | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 ms                                      |
| ------------------------------------------------------------------ | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                       | 2 Webhook з інтервалом ~1 с | Два ходи агента: лише "Dump", потім URL | Один хід: об’єднаний текст `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 Webhook                  | Два ходи                                | Один хід: текст + зображення                                              |
| `/status` (окрема команда)                                         | 1 Webhook                  | Миттєве відправлення                    | **Чекати до завершення вікна, потім відправити**                          |
| Лише вставлений URL                                                | 1 Webhook                  | Миттєве відправлення                    | Миттєве відправлення (у кошику лише один запис)                           |
| Текст + URL надіслані як два навмисно окремі повідомлення, через хвилини | 2 Webhook поза вікном      | Два ходи                                | Два ходи (між ними вікно спливає)                                         |
| Швидкий потік (>10 малих DM у межах вікна)                         | N Webhook                  | N ходів                                 | Один хід, обмежений вихід (перший + останній, застосовуються ліміти тексту/вкладень) |

### Усунення несправностей об’єднання розділених надсилань

Якщо прапорець увімкнено, але розділені надсилання все одно приходять як два ходи, перевірте кожен рівень:

<AccordionGroup>
  <Accordion title="Конфігурацію справді завантажено">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Потім `openclaw gateway restart` — прапорець зчитується під час створення реєстру debouncer.

  </Accordion>
  <Accordion title="Вікно дебаунсу достатньо широке для вашого налаштування">
    Подивіться журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Виміряйте інтервал між відправленням тексту в стилі `"Dump"` і наступним відправленням `"https://..."; Attachments:`. Підніміть `messages.inbound.byChannel.bluebubbles` так, щоб воно з запасом перекривало цей інтервал.

  </Accordion>
  <Accordion title="Мітки часу JSONL сесії ≠ надходженню Webhook">
    Мітки часу подій сесії (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають момент, коли Gateway передає повідомлення агенту, **а не** момент надходження Webhook. Додане в чергу друге повідомлення з міткою `[Queued messages while agent was busy]` означає, що перший хід усе ще виконувався, коли надійшов другий Webhook — кошик об’єднання вже був скинутий. Налаштовуйте вікно за журналом сервера BB, а не за журналом сесії.
  </Accordion>
  <Accordion title="Тиск пам’яті сповільнює відправлення відповіді">
    На менших машинах (8 GB) ходи агента можуть тривати достатньо довго, щоб кошик об’єднання скинувся до завершення відповіді, і URL потрапив у чергу як другий хід. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway використовує понад ~500 MB RSS і Compaction активний, закрийте інші важкі процеси або перейдіть на більший хост.
  </Accordion>
  <Accordion title="Надсилання з цитуванням відповіді йдуть іншим шляхом">
    Якщо користувач натиснув `Dump` як **відповідь** на вже наявну бульбашку URL (iMessage показує позначку "1 Reply" на бульбашці Dump), URL міститься в `replyToBody`, а не в другому Webhook. Об’єднання тут не застосовується — це питання Skills/промпту, а не debouncer.
  </Accordion>
</AccordionGroup>

## Блокове потокове передавання

Керуйте тим, чи надсилати відповіді як одне повідомлення чи потоково блоками:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // увімкнути блокове потокове передавання (типово вимкнено)
    },
  },
}
```

## Медіа + обмеження

- Вхідні вкладення завантажуються й зберігаються в кеші медіа.
- Обмеження медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 MB).
- Вихідний текст розбивається на частини згідно з `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник із конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

<AccordionGroup>
  <Accordion title="Підключення та Webhook">
    - `channels.bluebubbles.enabled`: увімкнути/вимкнути канал.
    - `channels.bluebubbles.serverUrl`: базовий URL REST API BlueBubbles.
    - `channels.bluebubbles.password`: пароль API.
    - `channels.bluebubbles.webhookPath`: шлях кінцевої точки Webhook (типово: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Політика доступу">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist для DM (ідентифікатори, email, номери E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist відправників груп.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: на macOS необов’язково збагачувати безіменних учасників груп із локальних Contacts після проходження фільтрів. Типово: `false`.
    - `channels.bluebubbles.groups`: конфігурація для кожної групи (`requireMention` тощо).

  </Accordion>
  <Accordion title="Доставка та розбиття на частини">
    - `channels.bluebubbles.sendReadReceipts`: надсилати сповіщення про прочитання (типово: `true`).
    - `channels.bluebubbles.blockStreaming`: увімкнути блокове потокове передавання (типово: `false`; обов’язково для потокових відповідей).
    - `channels.bluebubbles.textChunkLimit`: розмір вихідних частин у символах (типово: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: тайм-аут одного запиту в мс для надсилання вихідного тексту через `/api/v1/message/text` (типово: 30000). Збільшуйте на системах macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворку iMessage; наприклад `45000` або `60000`. Проби, пошук чатів, реакції, редагування та перевірки стану наразі зберігають коротший типовий тайм-аут 10 с; розширення цього покриття на реакції та редагування заплановано окремим продовженням. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише при перевищенні `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.

  </Accordion>
  <Accordion title="Медіа та історія">
    - `channels.bluebubbles.mediaMaxMb`: ліміт вхідних/вихідних медіа в MB (типово: 8).
    - `channels.bluebubbles.mediaLocalRoots`: явний allowlist абсолютних локальних каталогів, дозволених для вихідних локальних шляхів медіа. Надсилання локальних шляхів типово заборонене, доки це не налаштовано. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: об’єднувати послідовні Webhook DM від одного відправника в один хід агента, щоб розділене Apple надсилання текст+URL надходило як одне повідомлення (типово: `false`). Див. [Об’єднання розділених надсилань у DM](#coalescing-split-send-dms-command--url-in-one-composition) щодо сценаріїв, налаштування вікна та компромісів. Розширює типове вікно дебаунсу вхідних повідомлень з 500 ms до 2500 ms, якщо увімкнено без явного `messages.inbound.byChannel.bluebubbles`.
    - `channels.bluebubbles.historyLimit`: максимальна кількість групових повідомлень для контексту (0 вимикає).
    - `channels.bluebubbles.dmHistoryLimit`: ліміт історії DM.

  </Accordion>
  <Accordion title="Дії та облікові записи">
    - `channels.bluebubbles.actions`: увімкнення/вимкнення окремих дій.
    - `channels.bluebubbles.accounts`: конфігурація кількох облікових записів.

  </Accordion>
</AccordionGroup>

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Для стабільної маршрутизації віддавайте перевагу `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (рекомендовано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі ідентифікатори: `+15555550123`, `user@example.com`
  - Якщо для прямого ідентифікатора не існує чату DM, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно, щоб був увімкнений BlueBubbles Private API.

### Маршрутизація iMessage vs SMS

Коли один і той самий ідентифікатор має і чат iMessage, і чат SMS на Mac (наприклад, номер телефону, зареєстрований в iMessage, але який також отримував fallback-повідомлення із зеленими бульбашками), OpenClaw віддає перевагу чату iMessage і ніколи мовчки не знижує до SMS. Щоб примусово використовувати чат SMS, задайте явний префікс цілі `sms:` (наприклад `sms:+15555550123`). Ідентифікатори без відповідного чату iMessage усе одно надсилаються через той чат, який повідомляє BlueBubbles.

## Безпека

- Запити Webhook автентифікуються шляхом порівняння параметрів запиту або заголовків `guid`/`password` із `channels.bluebubbles.password`.
- Тримайте пароль API та кінцеву точку Webhook у секреті (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles у запиті на всьому шляху. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Якщо відкриваєте сервер BlueBubbles за межі своєї LAN, увімкніть HTTPS і правила брандмауера.

## Усунення несправностей

- Якщо індикатори набору/прочитання перестали працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Коди сполучення дійсні одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Для реакцій потрібен BlueBubbles private API (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Редагування/скасування надсилання потребують macOS 13+ і сумісної версії сервера BlueBubbles. На macOS 26 (Tahoe) редагування наразі зламане через зміни private API.
- Оновлення значка групи можуть бути нестабільними на macOS 26 (Tahoe): API може повертати успіх, але новий значок не синхронізується.
- OpenClaw автоматично приховує відомі зламані дії на основі версії macOS сервера BlueBubbles. Якщо редагування все ще відображається на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад `Dump` + URL) усе одно надходять як два ходи: див. контрольний список [усунення несправностей об’єднання розділених надсилань](#split-send-coalescing-troubleshooting) — типові причини: занадто вузьке вікно дебаунсу, неправильне трактування часових міток журналу сесії як моменту надходження Webhook або надсилання з цитуванням відповіді (яке використовує `replyToBody`, а не другий Webhook).
- Для інформації про стан/здоров’я: `openclaw status --all` або `openclaw status --deep`.

Загальні відомості про робочі процеси каналів див. у [Канали](/uk/channels) та в посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групових чатів і фільтрація згадок
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
