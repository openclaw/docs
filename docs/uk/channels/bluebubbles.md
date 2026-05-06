---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення проблем зі сполученням Webhook
    - Налаштування iMessage на macOS
sidebarTitle: BlueBubbles
summary: iMessage через macOS-сервер BlueBubbles (надсилання й отримання через REST, індикатор набору, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-06T03:19:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2308a016826addc1098937d764b753ee08f3e86f39b0657c930a12b486793f
    source_path: channels/bluebubbles.md
    workflow: 16
---

Стан: bundled plugin, що взаємодіє з macOS-сервером BlueBubbles через HTTP. **Рекомендовано для інтеграції iMessage** завдяки багатшому API та простішому налаштуванню порівняно із застарілим каналом imsg.

<Note>
Поточні випуски OpenClaw постачаються з BlueBubbles, тому звичайні пакетовані збірки не потребують окремого кроку `openclaw plugins install`.
</Note>

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі не працює на Tahoe, а оновлення піктограм груп можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через webhooks; вихідні відповіді, індикатори набору тексту, сповіщення про прочитання та tapbacks виконуються REST-викликами.
- Вкладення та стікери обробляються як вхідні медіа (і за можливості передаються агенту).
- Автоматичні TTS-відповіді, що синтезують MP3 або CAF-аудіо, доставляються як голосові memo-бульбашки iMessage замість звичайних файлових вкладень.
- Сполучення/allowlist працює так само, як в інших каналах (`/channels/pairing` тощо), з `channels.bluebubbles.allowFrom` + кодами сполучення.
- Реакції подаються як системні події, так само як у Slack/Telegram, щоб агенти могли "згадати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, гілки відповідей, ефекти повідомлень, керування групами.

## Швидкий старт

<Steps>
  <Step title="Install BlueBubbles">
    Установіть сервер BlueBubbles на ваш Mac (дотримуйтеся інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    У конфігурації BlueBubbles увімкніть web API та встановіть пароль.
  </Step>
  <Step title="Configure OpenClaw">
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
  <Step title="Point webhooks at the gateway">
    Спрямуйте webhooks BlueBubbles на ваш gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Запустіть gateway; він зареєструє обробник webhook і почне сполучення.
  </Step>
</Steps>

<Warning>
**Безпека**

- Завжди встановлюйте пароль webhook.
- Автентифікація webhook завжди обов’язкова. OpenClaw відхиляє webhook-запити BlueBubbles, якщо вони не містять пароль/guid, що збігається з `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/proxy.
- Автентифікація паролем перевіряється до читання/розбору повних тіл webhook.

</Warning>

## Підтримання роботи Messages.app (VM / headless-налаштування)

Деякі macOS VM / постійно ввімкнені налаштування можуть призвести до того, що Messages.app переходить у стан "idle" (вхідні події зупиняються, доки застосунок не відкриють/не виведуть на передній план). Простий обхідний шлях — **торкатися Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

<Steps>
  <Step title="Save the AppleScript">
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
  <Step title="Install a LaunchAgent">
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

    Це запускається **кожні 300 секунд** і **під час входу в систему**. Перший запуск може викликати запити macOS **Automation** (`osascript` → Messages). Підтвердьте їх у тому самому сеансі користувача, в якому працює LaunchAgent.

  </Step>
  <Step title="Load it">
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
  Шлях endpoint webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` або `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Номери телефонів, адреси електронної пошти або цілі чатів.
</ParamField>

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Контроль доступу (DMs + групи)

<Tabs>
  <Tab title="DMs">
    - За замовчуванням: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Невідомі відправники отримують код сполучення; повідомлення ігноруються, доки їх не схвалять (коди спливають через 1 годину).
    - Схвалити через:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Сполучення є стандартним обміном токенами. Докладніше: [Сполучення](/uk/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (за замовчуванням: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` керує тим, хто може ініціювати в групах, коли встановлено `allowlist`.

  </Tab>
</Tabs>

### Збагачення імен контактів (macOS, необов’язково)

Групові webhooks BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, ви можете ввімкнути локальне збагачення Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. За замовчуванням: `false`.
- Пошуки виконуються лише після того, як доступ до групи, авторизація команди та mention gating дозволили повідомленню пройти.
- Збагачуються лише неназвані учасники з телефонними номерами.
- Сирі номери телефонів залишаються fallback, якщо локальний збіг не знайдено.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention gating (групи)

BlueBubbles підтримує mention gating для групових чатів, відповідно до поведінки iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадок.
- Коли `requireMention` увімкнено для групи, агент відповідає лише тоді, коли його згадали.
- Керівні команди від авторизованих відправників обходять mention gating.

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

### Обмеження команд

- Керівні команди (наприклад, `/config`, `/model`) потребують авторизації.
- Використовує `allowFrom` і `groupAllowFrom`, щоб визначити авторизацію команд.
- Авторизовані відправники можуть запускати керівні команди навіть без згадки в групах.

### Системний prompt для окремої групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Значення вставляється в системний prompt агента на кожному ході, що обробляє повідомлення в цій групі, тож ви можете встановити персональний стиль або поведінкові правила для окремої групи без редагування prompt агента:

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

Ключ відповідає тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а wildcard-запис `"*"` задає значення за замовчуванням для кожної групи без точного збігу (той самий шаблон використовується `requireMention` і політиками інструментів для окремих груп). Точні збіги завжди мають пріоритет над wildcard. DMs ігнорують це поле; натомість використовуйте налаштування prompt на рівні агента або акаунта.

#### Робочий приклад: threaded replies і tapback-реакції (Private API)

Коли BlueBubbles Private API увімкнено, вхідні повідомлення надходять із короткими ID повідомлень (наприклад, `[[reply_to:5]]`), і агент може викликати `action=reply`, щоб відповісти в гілці конкретного повідомлення, або `action=react`, щоб додати tapback. `systemPrompt` для окремої групи — надійний спосіб утримати агента на виборі правильного інструмента:

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

Tapback-реакції та threaded replies обидві потребують BlueBubbles Private API; див. [Розширені дії](#advanced-actions) і [ID повідомлень](#message-ids-short-vs-full) щодо базових механік.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на довготривалі робочі простори ACP без зміни транспортного шару.

Швидкий потік оператора:

- Запустіть `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в тій самій розмові BlueBubbles маршрутизуються до створеного сеансу ACP.
- `/new` і `/reset` скидають той самий прив’язаний сеанс ACP на місці.
- `/acp close` закриває сеанс ACP і видаляє прив’язку.

Налаштовані постійні прив’язки також підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований DM handle, наприклад `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних групових прив’язок надавайте перевагу `chat_id:*` або `chat_identifier:*`.

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

Див. [Агенти ACP](/uk/tools/acp-agents) щодо спільної поведінки прив’язок ACP.

## Набір тексту + сповіщення про прочитання

- **Індикатори набору тексту**: надсилаються автоматично до та під час генерації відповіді.
- **Сповіщення про прочитання**: керуються `channels.bluebubbles.sendReadReceipts` (за замовчуванням: `true`).
- **Індикатори набору тексту**: OpenClaw надсилає події початку набору; BlueBubbles автоматично очищає набір під час надсилання або після тайм-ауту (ручна зупинка через DELETE ненадійна).

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
    - **react**: Додати/видалити реакції tapback (`messageId`, `emoji`, `remove`). Нативний набір tapback в iMessage: `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає емодзі поза цим набором (наприклад `👀`), інструмент реакцій відступає до `love`, щоб tapback все одно відобразився, а не спричинив збій усього запиту. Налаштовані ack-реакції й далі перевіряються строго й дають помилку для невідомих значень.
    - **edit**: Редагувати надіслане повідомлення (`messageId`, `text`).
    - **unsend**: Скасувати надсилання повідомлення (`messageId`).
    - **reply**: Відповісти на конкретне повідомлення (`messageId`, `text`, `to`).
    - **sendWithEffect**: Надіслати з ефектом iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Перейменувати груповий чат (`chatGuid`, `displayName`).
    - **setGroupIcon**: Установити іконку/фото групового чату (`chatGuid`, `media`) - нестабільно на macOS 26 Tahoe (API може повернути успіх, але іконка не синхронізується).
    - **addParticipant**: Додати когось до групи (`chatGuid`, `address`).
    - **removeParticipant**: Видалити когось із групи (`chatGuid`, `address`).
    - **leaveGroup**: Вийти з групового чату (`chatGuid`).
    - **upload-file**: Надіслати медіа/файли (`to`, `buffer`, `filename`, `asVoice`).
      - Голосові нотатки: установіть `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових нотаток.
    - Застарілий псевдонім: `sendAttachment` досі працює, але `upload-file` є канонічною назвою дії.

  </Accordion>
</AccordionGroup>

### ID повідомлень (короткі проти повних)

OpenClaw може показувати _короткі_ ID повідомлень (наприклад, `1`, `2`), щоб заощаджувати токени.

- `MessageSid` / `ReplyToId` можуть бути короткими ID.
- `MessageSidFull` / `ReplyToIdFull` містять повні ID провайдера.
- Короткі ID зберігаються в пам’яті; вони можуть застаріти після перезапуску або витіснення з кешу.
- Дії приймають короткий або повний `messageId`, але короткі ID дадуть помилку, якщо більше недоступні.

Використовуйте повні ID для довговічних автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Конфігурація](/uk/gateway/configuration) щодо змінних шаблонів.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання розділених DM-відправлень (команда + URL в одній композиції)

Коли користувач вводить команду й URL разом в iMessage - наприклад, `Dump https://example.com/article` - Apple розділяє надсилання на **дві окремі доставки webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Кулька попереднього перегляду URL (`"https://..."`) із зображеннями OG-preview як вкладеннями.

Два webhook надходять до OpenClaw з інтервалом приблизно 0,8-2,0 с у більшості конфігурацій. Без об’єднання агент отримує лише команду на ході 1, відповідає (часто «надішліть мені URL») і бачить URL лише на ході 2 - коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` вмикає для DM злиття послідовних webhook від того самого відправника в один хід агента. Групові чати й далі ключуються за окремими повідомленнями, тож структура ходів кількох користувачів зберігається.

<Tabs>
  <Tab title="Коли вмикати">
    Увімкніть, коли:

    - Ви постачаєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL, зображення або довгий вміст поруч із командами.
    - Ви можете прийняти додану затримку ходу DM (див. нижче).

    Залиште вимкненим, коли:

    - Вам потрібна мінімальна затримка команд для однословних DM-тригерів.
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

    Коли прапорець увімкнено й немає явного `messages.inbound.byChannel.bluebubbles`, вікно debounce розширюється до **2500 мс** (типове значення без об’єднання - 500 мс). Ширше вікно потрібне, бо cadence розділеного надсилання Apple у 0,8-2,0 с не вкладається в тісніше типове значення.

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
    - **Додана затримка для керівних команд DM.** Коли прапорець увімкнено, повідомлення керівних команд DM (як-от `Dump`, `Save` тощо) тепер чекають до вікна debounce перед dispatching, на випадок якщо надходить webhook із payload. Команди групового чату зберігають миттєве dispatch.
    - **Об’єднаний вихід обмежений** - об’єднаний текст обмежено 4000 символами з явним маркером `…[truncated]`; вкладення обмежено 20; записи джерел обмежено 10 (перший плюс найновіші зберігаються понад це). Кожен вихідний `messageId` усе одно доходить до inbound-dedupe, тож пізніший повтор MessagePoller будь-якої окремої події розпізнається як дублікат.
    - **Opt-in, для окремого каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються.

  </Tab>
</Tabs>

### Сценарії та що бачить агент

| Користувач складає                                                  | Apple доставляє                 | Прапорець вимкнено (типово)                  | Прапорець увімкнено + вікно 2500 мс                                      |
| ------------------------------------------------------------------- | -------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (одне надсилання)                        | 2 webhook з інтервалом ~1 с      | Два ходи агента: лише "Dump", потім URL      | Один хід: об’єднаний текст `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (вкладення + текст)                 | 2 webhook                        | Два ходи                                     | Один хід: текст + зображення                                             |
| `/status` (самостійна команда)                                      | 1 webhook                        | Миттєве dispatch                             | **Чекати до вікна, потім dispatch**                                      |
| URL, вставлений окремо                                              | 1 webhook                        | Миттєве dispatch                             | Миттєве dispatch (лише один запис у bucket)                              |
| Текст + URL надіслано як два навмисні окремі повідомлення, за хвилини одне від одного | 2 webhook поза вікном | Два ходи                                     | Два ходи (вікно спливає між ними)                                        |
| Швидкий шквал (>10 малих DM у межах вікна)                          | N webhook                        | N ходів                                      | Один хід, обмежений вихід (перший + найновіші, застосовано ліміти тексту/вкладень) |

### Усунення несправностей об’єднання розділеного надсилання

Якщо прапорець увімкнено, але розділені надсилання все одно надходять як два ходи, перевірте кожен шар:

<AccordionGroup>
  <Accordion title="Конфігурацію справді завантажено">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Потім `openclaw gateway restart` - прапорець читається під час створення debouncer-registry.

  </Accordion>
  <Accordion title="Вікно debounce достатньо широке для вашої конфігурації">
    Перегляньте журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Виміряйте інтервал між dispatch тексту в стилі `"Dump"` і наступним dispatch `"https://..."; Attachments:`. Збільште `messages.inbound.byChannel.bluebubbles`, щоб із запасом покрити цей інтервал.

  </Accordion>
  <Accordion title="Позначки часу Session JSONL ≠ надходження webhook">
    Позначки часу подій сеансу (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають момент, коли Gateway передає повідомлення агенту, **а не** коли webhook надійшов. Друге повідомлення в черзі з позначкою `[Queued messages while agent was busy]` означає, що перший хід усе ще виконувався, коли другий webhook надійшов - coalesce bucket уже було flush. Налаштовуйте вікно за журналом сервера BB, а не за журналом сеансу.
  </Accordion>
  <Accordion title="Тиск пам’яті сповільнює dispatch відповіді">
    На менших машинах (8 ГБ) ходи агента можуть тривати достатньо довго, щоб coalesce bucket flush до завершення відповіді, і URL потрапляє як другий хід у черзі. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway перевищує приблизно 500 МБ RSS, а compressor активний, закрийте інші важкі процеси або перейдіть на більший хост.
  </Accordion>
  <Accordion title="Надсилання reply-quote йдуть іншим шляхом">
    Якщо користувач натиснув `Dump` як **відповідь** на наявну URL-кульку (iMessage показує бейдж "1 Reply" на кульці Dump), URL міститься в `replyToBody`, а не в другому webhook. Об’єднання не застосовується - це питання skill/prompt, а не debouncer.
  </Accordion>
</AccordionGroup>

## Потокове передавання блоками

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

- Вхідні вкладення завантажуються й зберігаються в кеші медіа.
- Ліміт медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 МБ).
- Вихідний текст розбивається на частини за `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

<AccordionGroup>
  <Accordion title="З’єднання і webhook">
    - `channels.bluebubbles.enabled`: Увімкнути/вимкнути канал.
    - `channels.bluebubbles.serverUrl`: Базовий URL REST API BlueBubbles.
    - `channels.bluebubbles.password`: Пароль API.
    - `channels.bluebubbles.webhookPath`: Шлях endpoint webhook (типово: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Політика доступу">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
    - `channels.bluebubbles.allowFrom`: Allowlist DM (handles, електронні адреси, номери E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Allowlist відправників груп.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: На macOS необов’язково збагачувати неназваних учасників груп із локальних Contacts після проходження gating. Типово: `false`.
    - `channels.bluebubbles.groups`: Конфігурація для окремих груп (`requireMention` тощо).

  </Accordion>
  <Accordion title="Delivery and chunking">
    - `channels.bluebubbles.sendReadReceipts`: Надсилати сповіщення про прочитання (типово: `true`).
    - `channels.bluebubbles.blockStreaming`: Увімкнути блокове потокове передавання (типово: `false`; потрібно для потокових відповідей).
    - `channels.bluebubbles.textChunkLimit`: Розмір вихідного фрагмента в символах (типово: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Тайм-аут на запит у мс для надсилання вихідного тексту через `/api/v1/message/text` (типово: 30000). Збільште для конфігурацій macOS 26, де надсилання iMessage через Private API може зависати на понад 60 секунд усередині фреймворку iMessage; наприклад `45000` або `60000`. Перевірки, пошуки чатів, реакції, редагування та перевірки стану наразі зберігають коротше типове значення 10 с; розширення покриття на реакції та редагування заплановано як наступний крок. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише в разі перевищення `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.

  </Accordion>
  <Accordion title="Media and history">
    - `channels.bluebubbles.mediaMaxMb`: Обмеження вхідних/вихідних медіа в МБ (типово: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Явний список дозволених абсолютних локальних каталогів, дозволених для шляхів вихідних локальних медіа. Надсилання локальним шляхом типово заборонено, якщо це не налаштовано. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Об’єднувати послідовні DM Webhook від того самого відправника в один хід агента, щоб розділене надсилання Apple текст+URL надходило як одне повідомлення (типово: `false`). Див. [об’єднання розділено надісланих DM](#coalescing-split-send-dms-command--url-in-one-composition) щодо сценаріїв, налаштування вікна та компромісів. Розширює типове вікно усунення брязкоту для вхідних повідомлень із 500 мс до 2500 мс, коли ввімкнено без явного `messages.inbound.byChannel.bluebubbles`.
    - `channels.bluebubbles.historyLimit`: Максимум групових повідомлень для контексту (0 вимикає).
    - `channels.bluebubbles.dmHistoryLimit`: Обмеження історії DM.
    - `channels.bluebubbles.replyContextApiFallback`: Коли вхідна відповідь надходить без `replyToBody`/`replyToSender` і кеш контексту відповіді в пам’яті не має збігу, отримати оригінальне повідомлення з HTTP API BlueBubbles як резервний варіант на основі найкращих зусиль (типово: `false`). Корисно для розгортань із кількома інстансами, що спільно використовують один обліковий запис BlueBubbles, після перезапусків процесу або після витіснення з довгоживучого TTL/LRU-кешу. Отримання захищене від SSRF тією самою політикою, що й кожен інший запит клієнта BlueBubbles, ніколи не викидає помилку та заповнює кеш, щоб наступні відповіді амортизувалися. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Налаштування на рівні каналу поширюється на облікові записи, які не задають цей прапорець.

  </Accordion>
  <Accordion title="Actions and accounts">
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
  - Якщо прямий дескриптор не має наявного DM-чату, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно ввімкнути Private API BlueBubbles.

### Маршрутизація iMessage і SMS

Коли той самий дескриптор має і чат iMessage, і чат SMS на Mac (наприклад, номер телефону, зареєстрований в iMessage, але який також отримував резервні зелені повідомлення), OpenClaw надає перевагу чату iMessage і ніколи мовчки не переходить на SMS. Щоб примусово використати чат SMS, використовуйте явний цільовий префікс `sms:` (наприклад `sms:+15555550123`). Дескриптори без відповідного чату iMessage усе одно надсилаються через той чат, який повідомляє BlueBubbles.

## Безпека

- Запити Webhook автентифікуються порівнянням параметрів запиту або заголовків `guid`/`password` із `channels.bluebubbles.password`.
- Тримайте пароль API та кінцеву точку Webhook у секреті (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу через localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles у запиті наскрізно. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [безпеку Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Увімкніть HTTPS і правила брандмауера на сервері BlueBubbles, якщо відкриваєте його за межі вашої LAN.

## Усунення несправностей

- Якщо події набору тексту/прочитання перестають працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Коди сполучення спливають за одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Реакції потребують приватного API BlueBubbles (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Редагування/скасування надсилання потребують macOS 13+ і сумісної версії сервера BlueBubbles. На macOS 26 (Tahoe) редагування наразі не працює через зміни в приватному API.
- Оновлення піктограми групи можуть бути нестабільними на macOS 26 (Tahoe): API може повернути успіх, але нова піктограма не синхронізується.
- OpenClaw автоматично приховує відомі непрацюючі дії на основі версії macOS сервера BlueBubbles. Якщо редагування все ще з’являється на macOS 26 (Tahoe), вимкніть його вручну за допомогою `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад `Dump` + URL) усе одно надходять як два ходи: див. контрольний список [усунення несправностей об’єднання розділених надсилань](#split-send-coalescing-troubleshooting) - поширені причини: занадто коротке вікно усунення брязкоту, часові мітки журналу сесії помилково прочитані як надходження Webhook або надсилання цитати-відповіді (яке використовує `replyToBody`, а не другий Webhook).
- Для інформації про статус/стан: `openclaw status --all` або `openclaw status --deep`.

Загальну довідку щодо робочого процесу каналів див. у [каналах](/uk/channels) і посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) - маршрутизація сесій для повідомлень
- [Огляд каналів](/uk/channels) - усі підтримувані канали
- [Групи](/uk/channels/groups) - поведінка групових чатів і шлюз згадок
- [Сполучення](/uk/channels/pairing) - автентифікація DM і процес сполучення
- [Безпека](/uk/gateway/security) - модель доступу та посилення захисту
