---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення проблем зі сполученням Webhook
    - Налаштування iMessage на macOS
summary: iMessage через сервер BlueBubbles для macOS (REST-надсилання/отримання, введення, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-24T18:09:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5185202d668f56e5f2e22c1858325595eea7cca754b9b3a809c886c53ae68770
    source_path: channels/bluebubbles.md
    workflow: 15
---

Статус: вбудований Plugin, який взаємодіє із сервером BlueBubbles для macOS через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно зі застарілим каналом imsg.

## Вбудований Plugin

Поточні релізи OpenClaw містять BlueBubbles у комплекті, тому звичайним пакетованим збіркам не
потрібен окремий крок `openclaw plugins install`.

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування зараз не працює на Tahoe, а оновлення значків груп може повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через Webhook; вихідні відповіді, індикатори введення, квитанції про прочитання та tapback-реакції виконуються через REST-виклики.
- Вкладення та стікери приймаються як вхідні медіа (і передаються агенту, коли це можливо).
- Сполучення/allowlist працює так само, як і в інших каналів (`/channels/pairing` тощо) з `channels.bluebubbles.allowFrom` + кодами сполучення.
- Реакції відображаються як системні події, так само як у Slack/Telegram, тому агенти можуть "згадувати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, потоки відповідей, ефекти повідомлень, керування групами.

## Швидкий старт

1. Встановіть сервер BlueBubbles на свій Mac (дотримуйтесь інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
2. У конфігурації BlueBubbles увімкніть web API та задайте пароль.
3. Запустіть `openclaw onboard` і виберіть BlueBubbles або налаштуйте вручну:

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

4. Спрямуйте Webhook BlueBubbles на свій Gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Запустіть Gateway; він зареєструє обробник Webhook і почне сполучення.

Примітка щодо безпеки:

- Завжди задавайте пароль Webhook.
- Автентифікація Webhook завжди обов’язкова. OpenClaw відхиляє запити BlueBubbles Webhook, якщо вони не містять пароль/guid, що відповідає `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/проксі.
- Автентифікація за паролем перевіряється до читання/розбору повних тіл Webhook.

## Підтримання Messages.app активним (VM / headless-налаштування)

У деяких налаштуваннях macOS VM / always-on застосунок Messages.app може переходити в “idle” (вхідні події припиняються, доки застосунок не буде відкрито/винесено на передній план). Простий обхідний шлях — **стимулювати Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

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
- Під час першого запуску можуть з’явитися запити macOS **Automation** (`osascript` → Messages). Підтвердьте їх у тій самій сесії користувача, у якій працює LaunchAgent.

Завантажте його:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles доступний в інтерактивному onboarding:

```
openclaw onboard
```

Майстер запитує:

- **URL сервера** (обов’язково): адреса сервера BlueBubbles (наприклад, `http://192.168.1.100:1234`)
- **Пароль** (обов’язково): пароль API з налаштувань сервера BlueBubbles
- **Шлях Webhook** (необов’язково): типово `/bluebubbles-webhook`
- **Політика DM**: pairing, allowlist, open або disabled
- **Список дозволених**: номери телефонів, електронні адреси або цілі чатів

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Керування доступом (DM + групи)

DM:

- Типово: `channels.bluebubbles.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються до схвалення (коди спливають через 1 годину).
- Схвалення через:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Сполучення — це типовий обмін токенами. Докладніше: [Сполучення](/uk/channels/pairing)

Групи:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` визначає, хто може активувати агента в групах, коли встановлено `allowlist`.

### Збагачення імен контактів (macOS, необов’язково)

Group Webhook BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, можна ввімкнути локальне збагачення через Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. Типово: `false`.
- Пошук виконується лише після того, як доступ до групи, авторизація команд і перевірка згадки дозволили пропустити повідомлення.
- Збагачуються лише учасники з номером телефону без імені.
- Сирі номери телефонів залишаються запасним варіантом, якщо локального збігу не знайдено.

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

BlueBubbles підтримує перевірку згадок для групових чатів, відповідно до поведінки iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадок.
- Коли для групи ввімкнено `requireMention`, агент відповідає лише тоді, коли його згадано.
- Керівні команди від авторизованих відправників обходять перевірку згадок.

Конфігурація для кожної групи:

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

### Перевірка команд

- Керівні команди (наприклад, `/config`, `/model`) потребують авторизації.
- Використовує `allowFrom` і `groupAllowFrom` для визначення авторизації команд.
- Авторизовані відправники можуть запускати керівні команди навіть без згадки в групах.

### Системний промпт для кожної групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Це значення додається до системного промпта агента на кожному кроці, який обробляє повідомлення в цій групі, тож ви можете задавати персональність або правила поведінки для конкретної групи без редагування промптів агента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Нехай відповіді будуть до 3 речень. Віддзеркалюй невимушений тон групи.",
        },
      },
    },
  },
}
```

Ключ має відповідати тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а запис із шаблоном `"*"` задає типове значення для кожної групи без точного збігу (той самий шаблон використовується `requireMention` і політиками інструментів для окремих груп). Точні збіги завжди мають пріоритет над шаблоном. DM ігнорують це поле; натомість використовуйте налаштування промптів на рівні агента або облікового запису.

#### Приклад: відповіді в потоках і tapback-реакції (Private API)

Якщо увімкнено BlueBubbles Private API, вхідні повідомлення надходять із короткими ідентифікаторами повідомлень (наприклад, `[[reply_to:5]]`), і агент може викликати `action=reply`, щоб відповісти в конкретний потік повідомлень, або `action=react`, щоб додати tapback. `systemPrompt` для конкретної групи — надійний спосіб спрямувати агента до вибору правильного інструмента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Коли відповідаєш у цій групі, завжди викликай action=reply з",
            "messageId у форматі [[reply_to:N]] з контексту, щоб твоя відповідь",
            "потрапляла в потік під повідомленням-тригером. Ніколи не надсилай нове непов’язане повідомлення.",
            "",
            "Для коротких підтверджень ('ок', 'зрозумів', 'візьму в роботу') використовуй",
            "action=react з відповідним emoji tapback (❤️, 👍, 😂, ‼️, ❓)",
            "замість надсилання текстової відповіді.",
          ].join(" "),
        },
      },
    },
  },
}
```

І tapback-реакції, і відповіді в потоках потребують BlueBubbles Private API; див. [Розширені дії](#advanced-actions) і [Ідентифікатори повідомлень](#message-ids-short-vs-full) щодо базової механіки.

## ACP-прив’язки розмов

Чати BlueBubbles можна перетворити на сталі робочі простори ACP без зміни транспортного шару.

Швидкий операторський сценарій:

- Виконайте `/acp spawn codex --bind here` у DM або в дозволеному груповому чаті.
- Наступні повідомлення в цій самій розмові BlueBubbles буде спрямовано до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Також підтримуються налаштовані сталі прив’язки через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований дескриптор DM, наприклад `+15555550123` або `user@example.com`
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

Див. [ACP Agents](/uk/tools/acp-agents) щодо спільної поведінки ACP-прив’язок.

## Введення + квитанції про прочитання

- **Індикатори введення**: надсилаються автоматично перед і під час генерації відповіді.
- **Квитанції про прочитання**: керуються через `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори введення**: OpenClaw надсилає події початку введення; BlueBubbles очищує стан введення автоматично під час надсилання або після тайм-ауту (ручне зупинення через DELETE ненадійне).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // вимкнути квитанції про прочитання
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
        reactions: true, // tapback-реакції (типово: true)
        edit: true, // редагувати надіслані повідомлення (macOS 13+, не працює на macOS 26 Tahoe)
        unsend: true, // скасувати надсилання повідомлень (macOS 13+)
        reply: true, // відповіді в потоках за GUID повідомлення
        sendWithEffect: true, // ефекти повідомлень (slam, loud тощо)
        renameGroup: true, // перейменовувати групові чати
        setGroupIcon: true, // встановлювати значок/фото групового чату (нестабільно на macOS 26 Tahoe)
        addParticipant: true, // додавати учасників у групи
        removeParticipant: true, // видаляти учасників із груп
        leaveGroup: true, // виходити з групових чатів
        sendAttachment: true, // надсилати вкладення/медіа
      },
    },
  },
}
```

Доступні дії:

- **react**: додати/видалити tapback-реакції (`messageId`, `emoji`, `remove`). Власний набір tapback в iMessage: `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає emoji поза цим набором (наприклад, `👀`), інструмент реакції повертається до `love`, щоб tapback усе одно відобразився замість повного збою запиту. Налаштовані ack-реакції все одно проходять сувору валідацію і повертають помилку для невідомих значень.
- **edit**: редагувати надіслане повідомлення (`messageId`, `text`)
- **unsend**: скасувати надсилання повідомлення (`messageId`)
- **reply**: відповісти на конкретне повідомлення (`messageId`, `text`, `to`)
- **sendWithEffect**: надіслати з ефектом iMessage (`text`, `to`, `effectId`)
- **renameGroup**: перейменувати груповий чат (`chatGuid`, `displayName`)
- **setGroupIcon**: встановити значок/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повертати успіх, але значок не синхронізується).
- **addParticipant**: додати когось у групу (`chatGuid`, `address`)
- **removeParticipant**: видалити когось із групи (`chatGuid`, `address`)
- **leaveGroup**: вийти з групового чату (`chatGuid`)
- **upload-file**: надіслати медіа/файли (`to`, `buffer`, `filename`, `asVoice`)
  - Голосові повідомлення: задайте `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових повідомлень.
- Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` — це канонічна назва дії.

### Ідентифікатори повідомлень (короткі й повні)

OpenClaw може показувати _короткі_ ідентифікатори повідомлень (наприклад, `1`, `2`), щоб заощаджувати токени.

- `MessageSid` / `ReplyToId` можуть бути короткими ідентифікаторами.
- `MessageSidFull` / `ReplyToIdFull` містять повні ідентифікатори провайдера.
- Короткі ідентифікатори зберігаються в пам’яті; вони можуть зникнути після перезапуску або очищення кешу.
- Дії приймають короткий або повний `messageId`, але короткі ідентифікатори повернуть помилку, якщо більше недоступні.

Використовуйте повні ідентифікатори для сталих автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Конфігурація](/uk/gateway/configuration) щодо змінних шаблонів.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання розділених DM-надсилань (команда + URL в одному повідомленні)

Коли користувач вводить команду й URL разом в iMessage — наприклад, `Dump https://example.com/article` — Apple розбиває надсилання на **дві окремі доставки Webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка попереднього перегляду URL (`"https://..."`) із зображеннями OG-preview як вкладеннями.

Ці два Webhook надходять в OpenClaw з інтервалом приблизно 0.8–2.0 с у більшості налаштувань. Без об’єднання агент отримує лише команду на кроці 1, відповідає (часто "надішли мені URL"), а URL бачить лише на кроці 2 — коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` дає змогу об’єднувати послідовні Webhook від одного й того самого відправника в DM в один крок агента. Групові чати й далі прив’язуються до окремих повідомлень, щоб зберегти багатокористувацьку структуру ходів.

### Коли вмикати

Увімкніть, якщо:

- Ви постачаєте Skills, які очікують `команда + payload` в одному повідомленні (dump, paste, save, queue тощо).
- Ваші користувачі вставляють URL, зображення або довгий вміст разом із командами.
- Ви можете прийняти додаткову затримку ходу DM (див. нижче).

Залишайте вимкненим, якщо:

- Вам потрібна мінімальна затримка команд для однословних тригерів у DM.
- Усі ваші сценарії — це одноразові команди без подальшого payload.

### Увімкнення

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // увімкнути (типово: false)
    },
  },
}
```

Якщо прапорець увімкнено і явного `messages.inbound.byChannel.bluebubbles` немає, вікно debounce розширюється до **2500 мс** (типове значення без об’єднання — 500 мс). Ширше вікно потрібне обов’язково — ритм розділеного надсилання Apple у 0.8–2.0 с не вкладається у вужче типове значення.

Щоб налаштувати вікно вручну:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 мс підходить для більшості налаштувань; підніміть до 4000 мс, якщо ваш Mac повільний
        // або перебуває під тиском пам’яті (спостережуваний інтервал тоді може перевищувати 2 с).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Компроміси

- **Додаткова затримка для керівних команд у DM.** Якщо прапорець увімкнено, керівні команди в DM (наприклад, `Dump`, `Save` тощо) тепер чекають до завершення вікна debounce перед відправленням, на випадок якщо надходить Webhook з payload. Команди в групових чатах і далі відправляються миттєво.
- **Об’єднаний результат обмежений** — об’єднаний текст обмежується 4000 символами з явним маркером `…[truncated]`; вкладення обмежуються 20; записи джерела — 10 (понад це зберігаються перший і найновіший). Кожен вихідний `messageId` усе одно потрапляє до вхідного dedupe, тож пізніше повторне відтворення будь-якої окремої події через MessagePoller розпізнається як дублікат.
- **Увімкнення окремо для каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються.

### Сценарії та що бачить агент

| Користувач вводить                                                | Apple доставляє          | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 мс                                       |
| ----------------------------------------------------------------- | ------------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                      | 2 Webhook з ~1 с різниці | Два ходи агента: лише "Dump", потім URL | Один хід: об’єднаний текст `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (вкладення + текст)               | 2 Webhook                | Два ходи                                | Один хід: текст + зображення                                              |
| `/status` (окрема команда)                                        | 1 Webhook                | Миттєве відправлення                    | **Очікування до завершення вікна, потім відправлення**                    |
| Лише вставлений URL                                               | 1 Webhook                | Миттєве відправлення                    | Миттєве відправлення (у bucket лише один запис)                           |
| Текст + URL надіслано як два навмисно окремі повідомлення, за хвилини одне від одного | 2 Webhook поза вікном    | Два ходи                                | Два ходи (вікно між ними спливає)                                         |
| Швидкий потік (>10 малих DM у межах вікна)                        | N Webhook                | N ходів                                 | Один хід, обмежений результат (застосовано обмеження first + latest, text/attachment) |

### Усунення проблем з об’єднанням розділених надсилань

Якщо прапорець увімкнено, а розділені надсилання все одно приходять як два ходи, перевірте кожен рівень:

1. **Конфігурацію справді завантажено.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Потім `openclaw gateway restart` — прапорець читається під час створення реєстру debouncer.

2. **Вікно debounce достатньо широке для вашого налаштування.** Подивіться журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Виміряйте інтервал між відправленням тексту на кшталт `"Dump"` і наступним відправленням `"https://..."; Attachments:`. Підніміть `messages.inbound.byChannel.bluebubbles`, щоб воно з запасом покривало цей інтервал.

3. **Позначки часу сесії JSONL ≠ час надходження Webhook.** Позначки часу подій сесії (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають момент, коли Gateway передає повідомлення агенту, **а не** коли надійшов Webhook. Поставлене в чергу друге повідомлення з тегом `[Queued messages while agent was busy]` означає, що перший хід усе ще виконувався, коли надійшов другий Webhook — bucket для об’єднання вже був скинутий. Налаштовуйте вікно за журналом сервера BB, а не за журналом сесії.

4. **Тиск пам’яті уповільнює відправлення відповіді.** На менших машинах (8 GB) ходи агента можуть тривати так довго, що bucket для об’єднання скидається до завершення відповіді, і URL потрапляє в чергу як другий хід. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway перевищує приблизно 500 MB RSS і компресор активний, закрийте інші важкі процеси або перейдіть на більший хост.

5. **Надсилання з цитованою відповіддю — це інший шлях.** Якщо користувач натиснув `Dump` як **відповідь** на вже наявну бульбашку URL (в iMessage на бульбашці Dump показується значок "1 Reply"), URL міститься в `replyToBody`, а не в другому Webhook. Об’єднання тут не застосовується — це питання Skills/промпта, а не debouncer.

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

- Вхідні вкладення завантажуються і зберігаються в кеші медіа.
- Обмеження медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 MB).
- Вихідний текст розбивається на частини за `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.bluebubbles.enabled`: увімкнути/вимкнути канал.
- `channels.bluebubbles.serverUrl`: базовий URL REST API BlueBubbles.
- `channels.bluebubbles.password`: пароль API.
- `channels.bluebubbles.webhookPath`: шлях endpoint Webhook (типово: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlist для DM (дескриптори, email, номери E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlist відправників для груп.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: на macOS необов’язково збагачувати безіменних учасників груп із локальних Contacts після проходження перевірок доступу. Типово: `false`.
- `channels.bluebubbles.groups`: конфігурація для окремих груп (`requireMention` тощо).
- `channels.bluebubbles.sendReadReceipts`: надсилати квитанції про прочитання (типово: `true`).
- `channels.bluebubbles.blockStreaming`: увімкнути блокове потокове передавання (типово: `false`; потрібно для потокових відповідей).
- `channels.bluebubbles.textChunkLimit`: розмір вихідного фрагмента в символах (типово: 4000).
- `channels.bluebubbles.sendTimeoutMs`: тайм-аут для кожного запиту в мс для вихідного надсилання тексту через `/api/v1/message/text` (типово: 30000). Підвищуйте на системах macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворку iMessage; наприклад, до `45000` або `60000`. Перевірки, пошук чатів, реакції, редагування та health check наразі зберігають коротший типовий тайм-аут 10 с; розширення цього покриття на реакції й редагування заплановано окремо. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише при перевищенні `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.bluebubbles.mediaMaxMb`: обмеження вхідних/вихідних медіа в MB (типово: 8).
- `channels.bluebubbles.mediaLocalRoots`: явний allowlist абсолютних локальних директорій, дозволених для вихідних локальних шляхів до медіа. Надсилання локальних шляхів типово заборонене, якщо це не налаштовано. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: об’єднувати послідовні DM Webhook від одного відправника в один хід агента, щоб розділене надсилання тексту+URL від Apple надходило як одне повідомлення (типово: `false`). Див. [Об’єднання розділених DM-надсилань](#coalescing-split-send-dms-command--url-in-one-composition) щодо сценаріїв, налаштування вікна та компромісів. Розширює типове вхідне debounce-вікно з 500 мс до 2500 мс, якщо увімкнено без явного `messages.inbound.byChannel.bluebubbles`.
- `channels.bluebubbles.historyLimit`: максимальна кількість повідомлень групи для контексту (0 вимикає).
- `channels.bluebubbles.dmHistoryLimit`: обмеження історії DM.
- `channels.bluebubbles.actions`: увімкнення/вимкнення окремих дій.
- `channels.bluebubbles.accounts`: конфігурація для кількох облікових записів.

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Для стабільної маршрутизації віддавайте перевагу `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (рекомендовано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі дескриптори: `+15555550123`, `user@example.com`
  - Якщо для прямого дескриптора немає наявного чату DM, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно, щоб BlueBubbles Private API було увімкнено.

### Маршрутизація iMessage проти SMS

Коли для одного й того ж дескриптора на Mac є і чат iMessage, і чат SMS (наприклад, номер телефону, зареєстрований в iMessage, але який також отримував fallback-повідомлення в зелених бульбашках), OpenClaw віддає перевагу чату iMessage і ніколи тихо не знижує маршрут до SMS. Щоб примусово використати чат SMS, вкажіть явний префікс цілі `sms:` (наприклад, `sms:+15555550123`). Дескриптори без відповідного чату iMessage усе одно надсилаються через той чат, який повідомляє BlueBubbles.

## Безпека

- Запити Webhook автентифікуються порівнянням параметрів запиту або заголовків `guid`/`password` із `channels.bluebubbles.password`.
- Тримайте пароль API і endpoint Webhook у секреті (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles в запиті на всьому шляху end-to-end. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Якщо відкриваєте сервер BlueBubbles поза межами LAN, увімкніть HTTPS + правила firewall.

## Усунення проблем

- Якщо події введення/прочитання перестали працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway збігається з `channels.bluebubbles.webhookPath`.
- Коди сполучення спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Реакції потребують BlueBubbles private API (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Редагування/скасування надсилання потребують macOS 13+ і сумісної версії сервера BlueBubbles. На macOS 26 (Tahoe) редагування наразі не працює через зміни в private API.
- Оновлення значків груп можуть бути нестабільними на macOS 26 (Tahoe): API може повертати успіх, але новий значок не синхронізується.
- OpenClaw автоматично приховує відомо несправні дії залежно від версії macOS сервера BlueBubbles. Якщо редагування все ще відображається на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад, `Dump` + URL) усе одно надходять як два ходи: див. чекліст [усунення проблем з об’єднанням розділених надсилань](#split-send-coalescing-troubleshooting) — типові причини: занадто вузьке debounce-вікно, хибне трактування позначок часу в журналі сесії як часу надходження Webhook або надсилання з цитованою відповіддю (яке використовує `replyToBody`, а не другий Webhook).
- Для інформації про статус/стан: `openclaw status --all` або `openclaw status --deep`.

Загальний довідник щодо роботи каналів див. у [Канали](/uk/channels) і посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і перевірка згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
