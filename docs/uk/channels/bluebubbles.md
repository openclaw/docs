---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення проблем зі сполученням Webhook
    - Налаштування iMessage на macOS
summary: iMessage через macOS-сервер BlueBubbles (REST-надсилання/отримання, введення, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T08:44:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30ce50ae8a17140b42fa410647c367e0eefdffb1646b1ff92d8e1af63f2e1155
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Статус: вбудований plugin, який взаємодіє з macOS-сервером BlueBubbles через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно із застарілим каналом imsg.

## Вбудований plugin

Поточні випуски OpenClaw постачаються з BlueBubbles, тому звичайні пакетні збірки не потребують окремого кроку `openclaw plugins install`.

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі не працює на Tahoe, а оновлення значка групи можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через Webhook; вихідні відповіді, індикатори введення, підтвердження прочитання та tapback-реакції виконуються через REST-виклики.
- Вкладення та стікери обробляються як вхідні медіафайли (і передаються агенту, коли це можливо).
- Сполучення/список дозволених працює так само, як і в інших каналах (`/channels/pairing` тощо), за допомогою `channels.bluebubbles.allowFrom` + кодів сполучення.
- Реакції відображаються як системні події так само, як у Slack/Telegram, тож агенти можуть “згадати” їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, відповіді у тредах, ефекти повідомлень, керування групами.

## Швидкий старт

1. Встановіть сервер BlueBubbles на ваш Mac (дотримуйтеся інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
2. У конфігурації BlueBubbles увімкніть web API та задайте пароль.
3. Запустіть `openclaw onboard` і виберіть BlueBubbles, або налаштуйте вручну:

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

4. Спрямуйте Webhook BlueBubbles на ваш Gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Запустіть Gateway; він зареєструє обробник Webhook і почне сполучення.

Примітка щодо безпеки:

- Завжди задавайте пароль для Webhook.
- Автентифікація Webhook завжди обов’язкова. OpenClaw відхиляє запити Webhook BlueBubbles, якщо вони не містять пароль/guid, що відповідає `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/proxy.
- Автентифікація за паролем перевіряється до читання/розбору повних тіл Webhook.

## Підтримання Messages.app активним (VM / headless-середовища)

У деяких macOS VM / always-on середовищах Messages.app може переходити в “неактивний” стан (вхідні події припиняються, доки застосунок не буде відкрито/виведено на передній план). Простий обхідний шлях — **торкатися Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

### 1) Збережіть AppleScript

Збережіть це як:

- `~/Scripts/poke-messages.scpt`

Приклад скрипта (неінтерактивний; не перехоплює фокус):

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

### 2) Встановіть LaunchAgent

Збережіть це як:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

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

Примітки:

- Це запускається **кожні 300 секунд** і **під час входу в систему**.
- Перший запуск може викликати запити macOS **Automation** (`osascript` → Messages). Погодьте їх у тому самому сеансі користувача, де працює LaunchAgent.

Завантажте його:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Початкове налаштування

BlueBubbles доступний в інтерактивному початковому налаштуванні:

```
openclaw onboard
```

Майстер запитує:

- **URL сервера** (обов’язково): адреса сервера BlueBubbles (наприклад, `http://192.168.1.100:1234`)
- **Пароль** (обов’язково): пароль API з налаштувань BlueBubbles Server
- **Шлях Webhook** (необов’язково): за замовчуванням `/bluebubbles-webhook`
- **Політика особистих повідомлень**: сполучення, список дозволених, відкрито або вимкнено
- **Список дозволених**: номери телефонів, електронні адреси або цілі чатів

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Контроль доступу (особисті повідомлення + групи)

Особисті повідомлення:

- За замовчуванням: `channels.bluebubbles.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються, доки не буде надано дозвіл (коди спливають через 1 годину).
- Підтвердження через:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Сполучення — це типовий обмін токенами. Докладніше: [Сполучення](/uk/channels/pairing)

Групи:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (за замовчуванням: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` визначає, хто може ініціювати взаємодію в групах, коли встановлено `allowlist`.

### Збагачення імен контактів (macOS, необов’язково)

Групові Webhook BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` показував натомість локальні імена контактів, ви можете за бажанням увімкнути локальне збагачення через Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` увімкне пошук. За замовчуванням: `false`.
- Пошук виконується лише після того, як доступ до групи, авторизація команд і перевірка згадок дозволили пропустити повідомлення.
- Збагачуються лише неіменовані телефонні учасники.
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

### Перевірка згадок (групи)

BlueBubbles підтримує перевірку згадок для групових чатів, як і iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадок.
- Коли для групи увімкнено `requireMention`, агент відповідає лише тоді, коли його згадано.
- Команди керування від авторизованих відправників обходять перевірку згадок.

Налаштування для окремих груп:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // за замовчуванням для всіх груп
        "iMessage;-;chat123": { requireMention: false }, // перевизначення для конкретної групи
      },
    },
  },
}
```

### Перевірка команд

- Команди керування (наприклад, `/config`, `/model`) вимагають авторизації.
- Для визначення авторизації команд використовує `allowFrom` і `groupAllowFrom`.
- Авторизовані відправники можуть запускати команди керування навіть без згадки в групах.

### Системний prompt для окремих груп

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Це значення вбудовується в системний prompt агента на кожному кроці, що обробляє повідомлення в цій групі, тож ви можете задавати правила персонажу чи поведінки для окремих груп без редагування prompt агента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Відповідай не більш як 3 реченнями. Віддзеркалюй невимушений тон групи.",
        },
      },
    },
  },
}
```

Ключ має відповідати тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а запис із шаблоном `"*"` задає значення за замовчуванням для кожної групи без точного збігу (той самий шаблон використовується для `requireMention` і політик інструментів для окремих груп). Точні збіги завжди мають пріоритет над шаблоном. Особисті повідомлення ігнорують це поле; натомість використовуйте налаштування prompt на рівні агента або облікового запису.

#### Практичний приклад: відповіді у тредах і tapback-реакції (Private API)

Коли в BlueBubbles увімкнено Private API, вхідні повідомлення надходять із короткими ідентифікаторами повідомлень (наприклад, `[[reply_to:5]]`), і агент може викликати `action=reply`, щоб відповісти на конкретне повідомлення в треді, або `action=react`, щоб додати tapback. `systemPrompt` для окремої групи — це надійний спосіб змусити агента вибирати правильний інструмент:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Відповідаючи в цій групі, завжди викликай action=reply з",
            "messageId [[reply_to:N]] із контексту, щоб твоя відповідь ішла",
            "під повідомленням, яке її викликало. Ніколи не надсилай нове непов’язане повідомлення.",
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

І tapback-реакції, і відповіді у тредах потребують Private API BlueBubbles; див. [Розширені дії](#advanced-actions) і [Ідентифікатори повідомлень](#message-ids-short-vs-full) для пояснення базової механіки.

## ACP-прив’язки розмов

Чати BlueBubbles можна перетворити на сталі робочі області ACP без зміни транспортного шару.

Швидкий робочий процес для оператора:

- Виконайте `/acp spawn codex --bind here` у цьому особистому або дозволеному груповому чаті.
- Подальші повідомлення в цій самій розмові BlueBubbles буде спрямовано до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Також підтримуються налаштовані постійні прив’язки через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований handle особистого чату, наприклад `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних прив’язок груп краще використовувати `chat_id:*` або `chat_identifier:*`.

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

Див. [ACP Agents](/uk/tools/acp-agents) щодо спільної поведінки ACP-прив’язок.

## Введення + підтвердження прочитання

- **Індикатори введення**: надсилаються автоматично до і під час генерації відповіді.
- **Підтвердження прочитання**: керуються через `channels.bluebubbles.sendReadReceipts` (за замовчуванням: `true`).
- **Індикатори введення**: OpenClaw надсилає події початку введення; BlueBubbles автоматично очищує стан введення після надсилання або тайм-ауту (ручна зупинка через DELETE ненадійна).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // вимкнути підтвердження прочитання
    },
  },
}
```

## Розширені дії

BlueBubbles підтримує розширені дії з повідомленнями, коли це ввімкнено в конфігурації:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback-реакції (за замовчуванням: true)
        edit: true, // редагувати надіслані повідомлення (macOS 13+, не працює на macOS 26 Tahoe)
        unsend: true, // скасувати надсилання повідомлень (macOS 13+)
        reply: true, // відповіді у тредах за GUID повідомлення
        sendWithEffect: true, // ефекти повідомлень (slam, loud тощо)
        renameGroup: true, // перейменувати групові чати
        setGroupIcon: true, // задати значок/фото групового чату (нестабільно на macOS 26 Tahoe)
        addParticipant: true, // додати учасників до груп
        removeParticipant: true, // видалити учасників із груп
        leaveGroup: true, // вийти з групових чатів
        sendAttachment: true, // надсилати вкладення/медіа
      },
    },
  },
}
```

Доступні дії:

- **react**: додати/видалити tapback-реакції (`messageId`, `emoji`, `remove`)
- **edit**: редагувати надіслане повідомлення (`messageId`, `text`)
- **unsend**: скасувати надсилання повідомлення (`messageId`)
- **reply**: відповісти на конкретне повідомлення (`messageId`, `text`, `to`)
- **sendWithEffect**: надіслати з ефектом iMessage (`text`, `to`, `effectId`)
- **renameGroup**: перейменувати груповий чат (`chatGuid`, `displayName`)
- **setGroupIcon**: встановити значок/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повертати успіх, але значок не синхронізується).
- **addParticipant**: додати когось до групи (`chatGuid`, `address`)
- **removeParticipant**: видалити когось із групи (`chatGuid`, `address`)
- **leaveGroup**: вийти з групового чату (`chatGuid`)
- **upload-file**: надіслати медіа/файли (`to`, `buffer`, `filename`, `asVoice`)
  - Голосові повідомлення: задайте `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових повідомлень.
- Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` — це канонічна назва дії.

### Ідентифікатори повідомлень (короткі проти повних)

OpenClaw може показувати _короткі_ ідентифікатори повідомлень (наприклад, `1`, `2`) для економії токенів.

- `MessageSid` / `ReplyToId` можуть бути короткими ID.
- `MessageSidFull` / `ReplyToIdFull` містять повні ID провайдера.
- Короткі ID зберігаються в пам’яті; вони можуть зникнути після перезапуску або очищення кешу.
- Дії приймають короткий або повний `messageId`, але короткі ID спричинять помилку, якщо більше недоступні.

Для тривалих автоматизацій і зберігання використовуйте повні ID:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Конфігурація](/uk/gateway/configuration) щодо змінних шаблонів.

## Об’єднання розділених надсилань у особистих повідомленнях (команда + URL в одній композиції)

Коли користувач вводить команду і URL разом в iMessage — наприклад, `Dump https://example.com/article` — Apple розділяє надсилання на **дві окремі доставки Webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка попереднього перегляду URL (`"https://..."`) із зображеннями OG-перегляду як вкладеннями.

Ці два Webhook надходять до OpenClaw з інтервалом приблизно 0.8-2.0 с у більшості середовищ. Без об’єднання агент отримує лише команду на кроці 1, відповідає (часто “надішли мені URL”), і бачить URL лише на кроці 2 — коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` дає змогу для особистого чату об’єднувати послідовні Webhook від одного й того ж відправника в один крок агента. Групові чати й далі використовують ключі на рівні окремого повідомлення, щоб зберегти структуру кроків для кількох користувачів.

### Коли вмикати

Увімкніть, якщо:

- Ви постачаєте Skills, які очікують `команда + payload` в одному повідомленні (dump, paste, save, queue тощо).
- Ваші користувачі вставляють URL, зображення або довгий вміст разом із командами.
- Ви можете прийняти додаткову затримку кроку в особистому чаті (див. нижче).

Залишайте вимкненим, якщо:

- Вам потрібна мінімальна затримка команд для однослівних тригерів в особистих чатах.
- Усі ваші сценарії — це одноразові команди без подальшого payload.

### Увімкнення

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // увімкнути (за замовчуванням: false)
    },
  },
}
```

Якщо прапорець увімкнено і немає явного `messages.inbound.byChannel.bluebubbles`, вікно debounce розширюється до **2500 мс** (типове значення без об’єднання — 500 мс). Ширше вікно потрібне обов’язково — ритм розділеного надсилання Apple на рівні 0.8-2.0 с не вкладається в щільніше типове значення.

Щоб налаштувати вікно вручну:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 мс працює для більшості середовищ; збільште до 4000 мс, якщо ваш Mac повільний
        // або перебуває під тиском пам’яті (спостережуваний розрив тоді може перевищувати 2 с).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Компроміси

- **Додаткова затримка для команд керування в особистих повідомленнях.** Якщо прапорець увімкнено, повідомлення з командами керування в особистих чатах (наприклад, `Dump`, `Save` тощо) тепер очікують до завершення вікна debounce перед відправленням, на випадок якщо надійде Webhook із payload. У групових чатах команди й надалі відправляються миттєво.
- **Об’єднаний вивід обмежений** — об’єднаний текст обмежується 4000 символами з явною позначкою `…[truncated]`; вкладення обмежуються 20; записи джерел — 10 (за межами цього зберігаються перший і найновіший). Кожен вихідний `messageId` усе одно доходить до вхідної дедуплікації, тож пізніше повторення будь-якої окремої події через MessagePoller буде розпізнано як дублікат.
- **Увімкнення за бажанням, на рівні каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не змінюються.

### Сценарії та що бачить агент

| Що складає користувач                                              | Що доставляє Apple         | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 мс                                      |
| ------------------------------------------------------------------ | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (одне надсилання)                       | 2 Webhook з інтервалом ~1 с| Два кроки агента: лише "Dump", потім URL | Один крок: об’єднаний текст `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 Webhook                  | Два кроки                               | Один крок: текст + зображення                                            |
| `/status` (окрема команда)                                         | 1 Webhook                  | Миттєве відправлення                    | **Очікування до завершення вікна, потім відправлення**                   |
| Окремо вставлений URL                                              | 1 Webhook                  | Миттєве відправлення                    | Миттєве відправлення (лише один запис у кошику)                          |
| Текст + URL надіслано як два навмисно окремі повідомлення з інтервалом у хвилини | 2 Webhook поза вікном      | Два кроки                               | Два кроки (вікно між ними спливає)                                       |
| Швидкий потік (>10 малих особистих повідомлень у межах вікна)      | N Webhook                  | N кроків                                | Один крок, обмежений вивід (перший + найновіший, застосовано межі тексту/вкладень) |

### Усунення проблем з об’єднанням розділених надсилань

Якщо прапорець увімкнено, а розділені надсилання все одно надходять як два кроки, перевірте кожен рівень:

1. **Конфігурацію справді завантажено.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Потім `openclaw gateway restart` — прапорець зчитується під час створення реєстру debouncer.

2. **Вікно debounce достатньо широке для вашого середовища.** Подивіться журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Виміряйте інтервал між доставкою тексту на кшталт `"Dump"` і наступною доставкою `"https://..."; Attachments:`. Збільшіть `messages.inbound.byChannel.bluebubbles`, щоб воно з запасом перекривало цей інтервал.

3. **Часові мітки JSONL сесії ≠ прибуття Webhook.** Часові мітки подій сесії (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають момент, коли Gateway передає повідомлення агенту, **а не** момент прибуття Webhook. Повідомлення в черзі з міткою `[Queued messages while agent was busy]` означає, що перший крок ще виконувався, коли прибув другий Webhook — кошик об’єднання вже було скинуто. Налаштовуйте вікно за журналом сервера BB, а не за журналом сесії.

4. **Тиск пам’яті уповільнює відправлення відповіді.** На менших машинах (8 ГБ) кроки агента можуть тривати достатньо довго, щоб кошик об’єднання скинувся до завершення відповіді, і URL потрапив у чергу як другий крок. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway споживає понад ~500 МБ RSS і компресор активний, закрийте інші важкі процеси або перейдіть на потужніший хост.

5. **Надсилання як цитата-відповідь — це інший шлях.** Якщо користувач натиснув `Dump` як **відповідь** на вже наявну URL-бульбашку (iMessage показує бейдж "1 Reply" на бульбашці Dump), URL міститься в `replyToBody`, а не в другому Webhook. Об’єднання тут не застосовується — це питання Skills/prompt, а не debouncer.

## Блокове потокове передавання

Керуйте тим, чи відповіді надсилаються як одне повідомлення, чи потоково блоками:

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

- Вхідні вкладення завантажуються та зберігаються в кеші медіа.
- Обмеження медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (за замовчуванням: 8 МБ).
- Вихідний текст розбивається на частини за `channels.bluebubbles.textChunkLimit` (за замовчуванням: 4000 символів).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.bluebubbles.enabled`: увімкнути/вимкнути канал.
- `channels.bluebubbles.serverUrl`: базовий URL REST API BlueBubbles.
- `channels.bluebubbles.password`: пароль API.
- `channels.bluebubbles.webhookPath`: шлях endpoint Webhook (за замовчуванням: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: `pairing`).
- `channels.bluebubbles.allowFrom`: список дозволених для особистих повідомлень (handles, електронні адреси, номери E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: список дозволених відправників у групах.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: на macOS за бажанням збагачує неіменованих учасників групи з локальних Contacts після проходження перевірок. За замовчуванням: `false`.
- `channels.bluebubbles.groups`: конфігурація для окремих груп (`requireMention` тощо).
- `channels.bluebubbles.sendReadReceipts`: надсилати підтвердження прочитання (за замовчуванням: `true`).
- `channels.bluebubbles.blockStreaming`: увімкнути блокове потокове передавання (за замовчуванням: `false`; обов’язково для потокових відповідей).
- `channels.bluebubbles.textChunkLimit`: розмір вихідних частин у символах (за замовчуванням: 4000).
- `channels.bluebubbles.sendTimeoutMs`: тайм-аут у мс для кожного запиту під час надсилання вихідного тексту через `/api/v1/message/text` (за замовчуванням: 30000). Збільшуйте на середовищах macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворку iMessage; наприклад, до `45000` або `60000`. Перевірки, пошук чатів, реакції, редагування та перевірки стану наразі зберігають коротший типовий тайм-аут 10 с; розширення цього покриття на реакції та редагування заплановано в наступному оновленні. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (за замовчуванням) розбиває лише при перевищенні `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.bluebubbles.mediaMaxMb`: обмеження вхідних/вихідних медіа в МБ (за замовчуванням: 8).
- `channels.bluebubbles.mediaLocalRoots`: явний список дозволених абсолютних локальних каталогів для вихідних локальних шляхів до медіа. Надсилання локальних шляхів за замовчуванням заборонено, якщо це не налаштовано. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: об’єднувати послідовні DM-Webhook від одного відправника в один крок агента, щоб розділене Apple надсилання тексту+URL надходило як одне повідомлення (за замовчуванням: `false`). Див. [Об’єднання розділених надсилань у особистих повідомленнях](#coalescing-split-send-dms-command--url-in-one-composition) щодо сценаріїв, налаштування вікна та компромісів. Розширює типове вхідне debounce-вікно з 500 мс до 2500 мс, якщо ввімкнено без явного `messages.inbound.byChannel.bluebubbles`.
- `channels.bluebubbles.historyLimit`: максимальна кількість повідомлень групи для контексту (0 вимикає).
- `channels.bluebubbles.dmHistoryLimit`: ліміт історії для особистих повідомлень.
- `channels.bluebubbles.actions`: увімкнення/вимкнення окремих дій.
- `channels.bluebubbles.accounts`: конфігурація кількох облікових записів.

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Для стабільної маршрутизації краще використовувати `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (бажано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі handle: `+15555550123`, `user@example.com`
  - Якщо для прямого handle не існує наявного DM-чату, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно, щоб у BlueBubbles було ввімкнено Private API.

## Безпека

- Запити Webhook автентифікуються шляхом порівняння параметрів запиту або заголовків `guid`/`password` із `channels.bluebubbles.password`.
- Зберігайте пароль API та endpoint Webhook у таємниці (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу через localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles в наскрізному запиті. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Якщо ви відкриваєте сервер BlueBubbles за межі своєї LAN, увімкніть HTTPS + правила firewall.

## Усунення проблем

- Якщо події введення/прочитання перестали працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Коди сполучення спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Реакції потребують private API BlueBubbles (`POST /api/v1/message/react`); переконайтеся, що версія сервера його підтримує.
- Редагування/скасування надсилання потребують macOS 13+ і сумісної версії сервера BlueBubbles. На macOS 26 (Tahoe) редагування наразі не працює через зміни в private API.
- Оновлення значка групи можуть бути нестабільними на macOS 26 (Tahoe): API може повертати успіх, але новий значок не синхронізується.
- OpenClaw автоматично приховує дії, які відомо як зламані, на основі версії macOS сервера BlueBubbles. Якщо редагування все ще відображається на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад, `Dump` + URL) все одно надходять як два кроки: перегляньте контрольний список [усунення проблем з об’єднанням розділених надсилань](#split-send-coalescing-troubleshooting) — типові причини: надто вузьке debounce-вікно, помилкове трактування часових міток журналу сесії як часу прибуття Webhook або надсилання як цитата-відповідь (яке використовує `replyToBody`, а не другий Webhook).
- Для інформації про стан/здоров’я: `openclaw status --all` або `openclaw status --deep`.

Загальний довідник робочого процесу каналів див. у [Канали](/uk/channels) та посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація особистих повідомлень і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і перевірка згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення захисту
