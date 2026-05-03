---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення несправностей під час сполучення Webhook
    - Налаштування iMessage на macOS
sidebarTitle: BlueBubbles
summary: iMessage через сервер BlueBubbles для macOS (надсилання/отримання через REST, введення тексту, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-03T22:33:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: bundled plugin, який взаємодіє із сервером BlueBubbles macOS через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно із застарілим каналом imsg.

<Note>
Поточні випуски OpenClaw постачають BlueBubbles у складі пакета, тому звичайні пакетовані збірки не потребують окремого кроку `openclaw plugins install`.
</Note>

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі зламане на Tahoe, а оновлення значків груп можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через webhooks; вихідні відповіді, індикатори набору, сповіщення про прочитання та tapbacks виконуються як REST-виклики.
- Вкладення та стікери приймаються як вхідні медіа (і за можливості передаються агенту).
- Автоматичні TTS-відповіді, що синтезують MP3 або CAF-аудіо, доставляються як голосові нотатки iMessage, а не як звичайні файлові вкладення.
- Звʼязування/allowlist працює так само, як і для інших каналів (`/channels/pairing` тощо), з `channels.bluebubbles.allowFrom` + кодами звʼязування.
- Реакції подаються як системні події так само, як у Slack/Telegram, щоб агенти могли "згадувати" їх перед відповіддю.
- Розширені функції: редагування, скасування надсилання, гілки відповідей, ефекти повідомлень, керування групами.

## Швидкий старт

<Steps>
  <Step title="Install BlueBubbles">
    Установіть сервер BlueBubbles на ваш Mac (дотримуйтеся інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    У конфігурації BlueBubbles увімкніть web API і встановіть пароль.
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
    Запустіть gateway; він зареєструє обробник webhook і почне звʼязування.
  </Step>
</Steps>

<Warning>
**Безпека**

- Завжди встановлюйте пароль webhook.
- Автентифікація webhook завжди обовʼязкова. OpenClaw відхиляє webhook-запити BlueBubbles, якщо вони не містять password/guid, що збігається з `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/proxy.
- Автентифікація паролем перевіряється до читання/розбору повних тіл webhook.

</Warning>

## Підтримання Messages.app активним (VM / headless-налаштування)

Деякі macOS VM / постійно ввімкнені налаштування можуть призводити до того, що Messages.app переходить у стан "idle" (вхідні події зупиняються, доки застосунок не буде відкрито/виведено на передній план). Простий обхідний шлях — **торкатися Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

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

    Це запускається **кожні 300 секунд** і **під час входу в систему**. Перший запуск може спричинити запити macOS **Automation** (`osascript` → Messages). Підтвердьте їх у тій самій користувацькій сесії, у якій працює LaunchAgent.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles доступний в інтерактивному onboarding:

```
openclaw onboard
```

Майстер запитує:

<ParamField path="Server URL" type="string" required>
  Адреса сервера BlueBubbles (наприклад, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  API-пароль із налаштувань BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Шлях endpoint webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` або `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Телефонні номери, електронні адреси або цілі чатів.
</ParamField>

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Контроль доступу (DMs + групи)

<Tabs>
  <Tab title="DMs">
    - За замовчуванням: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Невідомі відправники отримують код звʼязування; повідомлення ігноруються, доки їх не схвалять (коди спливають через 1 годину).
    - Схвалити через:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Звʼязування є типовим обміном токенами. Докладніше: [Звʼязування](/uk/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (за замовчуванням: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` керує тим, хто може запускати дії в групах, коли встановлено `allowlist`.

  </Tab>
</Tabs>

### Збагачення імен контактів (macOS, необовʼязково)

Групові webhooks BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, ви можете ввімкнути локальне збагачення Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. За замовчуванням: `false`.
- Пошуки виконуються лише після того, як доступ до групи, авторизація команд і фільтрація згадок пропустили повідомлення.
- Збагачуються лише учасники з телефонними номерами без імен.
- Сирі телефонні номери залишаються fallback, коли локальний збіг не знайдено.

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
- Коли для групи ввімкнено `requireMention`, агент відповідає лише тоді, коли його згадали.
- Контрольні команди від авторизованих відправників обходять фільтрацію згадок.

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

- Контрольні команди (наприклад, `/config`, `/model`) потребують авторизації.
- Використовує `allowFrom` і `groupAllowFrom`, щоб визначити авторизацію команд.
- Авторизовані відправники можуть запускати контрольні команди навіть без згадки в групах.

### Системний prompt для окремої групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необовʼязковий рядок `systemPrompt`. Значення вставляється в системний prompt агента на кожному ході, який обробляє повідомлення в цій групі, щоб ви могли встановлювати persona або правила поведінки для окремої групи без редагування prompt агента:

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

Ключ відповідає тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а wildcard-запис `"*"` задає стандартне значення для кожної групи без точного збігу (той самий патерн, що використовується `requireMention` і політиками інструментів для окремих груп). Точні збіги завжди мають перевагу над wildcard. DMs ігнорують це поле; натомість використовуйте налаштування prompt на рівні агента або облікового запису.

#### Робочий приклад: гілковані відповіді та tapback-реакції (Private API)

Коли BlueBubbles Private API увімкнено, вхідні повідомлення надходять із короткими ідентифікаторами повідомлень (наприклад, `[[reply_to:5]]`), а агент може викликати `action=reply`, щоб відповісти в гілці конкретного повідомлення, або `action=react`, щоб додати tapback. `systemPrompt` для окремої групи — надійний спосіб змусити агента вибирати правильний інструмент:

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

Tapback-реакції та гілковані відповіді обидві потребують BlueBubbles Private API; див. [Розширені дії](#advanced-actions) і [Ідентифікатори повідомлень](#message-ids-short-vs-full) щодо базових механік.

## Привʼязки розмов ACP

Чати BlueBubbles можна перетворити на сталі робочі простори ACP без зміни транспортного шару.

Швидкий потік оператора:

- Запустіть `/acp spawn codex --bind here` усередині DM або дозволеного групового чату.
- Майбутні повідомлення в тій самій розмові BlueBubbles спрямовуються до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму привʼязану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє привʼязку.

Налаштовані сталі привʼязки також підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований DM handle, як-от `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних групових привʼязок віддавайте перевагу `chat_id:*` або `chat_identifier:*`.

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

Див. [Агенти ACP](/uk/tools/acp-agents) щодо спільної поведінки привʼязок ACP.

## Набір тексту + сповіщення про прочитання

- **Індикатори набору**: надсилаються автоматично перед і під час генерації відповіді.
- **Сповіщення про прочитання**: керуються `channels.bluebubbles.sendReadReceipts` (за замовчуванням: `true`).
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
  <Accordion title="Доступні дії">
    - **react**: додати або прибрати реакції tapback (`messageId`, `emoji`, `remove`). Власний набір tapback в iMessage: `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає емодзі поза цим набором (наприклад, `👀`), інструмент реакцій повертається до `love`, щоб tapback усе одно відобразився, а не зірвав увесь запит. Налаштовані ack-реакції й надалі перевіряються суворо та дають помилку для невідомих значень.
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
      - Голосові нотатки: установіть `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових нотаток.
    - Застарілий псевдонім: `sendAttachment` досі працює, але `upload-file` є канонічною назвою дії.

  </Accordion>
</AccordionGroup>

### ID повідомлень (короткі та повні)

OpenClaw може показувати _короткі_ ID повідомлень (наприклад, `1`, `2`), щоб заощаджувати токени.

- `MessageSid` / `ReplyToId` можуть бути короткими ID.
- `MessageSidFull` / `ReplyToIdFull` містять повні ID провайдера.
- Короткі ID зберігаються в пам’яті; вони можуть ставати недійсними після перезапуску або витіснення з кешу.
- Дії приймають короткий або повний `messageId`, але короткі ID дадуть помилку, якщо більше недоступні.

Використовуйте повні ID для довготривалих автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Конфігурацію](/uk/gateway/configuration) для змінних шаблонів.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання розділених DM-надсилань (команда + URL в одному повідомленні)

Коли користувач вводить команду й URL разом в iMessage — наприклад, `Dump https://example.com/article` — Apple розділяє надсилання на **дві окремі доставки webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка попереднього перегляду URL (`"https://..."`) з OG-preview зображеннями як вкладеннями.

Два webhook надходять до OpenClaw з інтервалом приблизно 0.8-2.0 с у більшості конфігурацій. Без об’єднання агент отримує лише команду на кроці 1, відповідає (часто "надішліть мені URL") і бачить URL лише на кроці 2 — коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` вмикає для DM об’єднання послідовних webhook від того самого відправника в один крок агента. Групові чати й надалі прив’язуються до окремих повідомлень, щоб зберегти структуру кроків для кількох користувачів.

<Tabs>
  <Tab title="Коли вмикати">
    Увімкніть, коли:

    - Ви постачаєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL, зображення або довгий вміст поруч із командами.
    - Ви можете прийняти додаткову затримку кроку DM (див. нижче).

    Залиште вимкненим, коли:

    - Вам потрібна мінімальна затримка команд для однословних DM-тригерів.
    - Усі ваші потоки — це одноразові команди без подальших payload.

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

    Коли прапорець увімкнено і немає явного `messages.inbound.byChannel.bluebubbles`, вікно debounce розширюється до **2500 мс** (за замовчуванням для режиму без об’єднання — 500 мс). Ширше вікно потрібне — каденція розділеного надсилання Apple у 0.8-2.0 с не вкладається у вужче значення за замовчуванням.

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
    - **Додаткова затримка для керівних команд DM.** Коли прапорець увімкнено, повідомлення з керівними командами DM (наприклад, `Dump`, `Save` тощо) тепер чекають до завершення вікна debounce перед dispatch, на випадок якщо надходить webhook з payload. Команди в групових чатах зберігають миттєвий dispatch.
    - **Об’єднаний вивід обмежений** — об’єднаний текст обмежено 4000 символами з явним маркером `…[truncated]`; вкладення обмежено 20; записи джерел обмежено 10 (понад це зберігаються перший і найновіший). Кожен вихідний `messageId` усе одно потрапляє до inbound-dedupe, тож пізніше повторне відтворення будь-якої окремої події MessagePoller розпізнається як дублікат.
    - **Опційно, для окремого каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються.

  </Tab>
</Tabs>

### Сценарії та що бачить агент

| Користувач складає повідомлення                                    | Apple доставляє           | Прапорець вимкнено (за замовчуванням)      | Прапорець увімкнено + вікно 2500 мс                                     |
| ------------------------------------------------------------------ | ------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                       | 2 webhook з інтервалом ~1 с | Два кроки агента: лише "Dump", потім URL   | Один крок: об’єднаний текст `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 webhook                 | Два кроки                                  | Один крок: текст + зображення                                           |
| `/status` (самостійна команда)                                     | 1 webhook                 | Миттєвий dispatch                          | **Очікування до завершення вікна, потім dispatch**                      |
| URL вставлено окремо                                               | 1 webhook                 | Миттєвий dispatch                          | Миттєвий dispatch (лише один запис у bucket)                            |
| Текст + URL надіслано як два навмисно окремі повідомлення з інтервалом у хвилини | 2 webhook поза вікном | Два кроки                                  | Два кроки (вікно спливає між ними)                                      |
| Швидкий потік (>10 малих DM у межах вікна)                         | N webhook                 | N кроків                                   | Один крок, обмежений вивід (перший + найновіший, застосовано обмеження тексту/вкладень) |

### Усунення несправностей об’єднання розділених надсилань

Якщо прапорець увімкнено, але розділені надсилання все одно надходять як два кроки, перевірте кожен рівень:

<AccordionGroup>
  <Accordion title="Конфігурацію фактично завантажено">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Потім `openclaw gateway restart` — прапорець читається під час створення debouncer-registry.

  </Accordion>
  <Accordion title="Вікно debounce достатньо широке для вашої конфігурації">
    Подивіться журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Виміряйте проміжок між dispatch тексту в стилі `"Dump"` і наступним dispatch `"https://..."; Attachments:`. Збільште `messages.inbound.byChannel.bluebubbles`, щоб із запасом покрити цей проміжок.

  </Accordion>
  <Accordion title="Мітки часу JSONL сесії ≠ надходження webhook">
    Мітки часу подій сесії (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають, коли Gateway передає повідомлення агенту, **а не** коли надійшов webhook. Друге повідомлення в черзі з позначкою `[Queued messages while agent was busy]` означає, що перший крок ще виконувався, коли надійшов другий webhook — bucket об’єднання вже було скинуто. Налаштовуйте вікно за журналом сервера BB, а не за журналом сесії.
  </Accordion>
  <Accordion title="Тиск на пам’ять сповільнює dispatch відповіді">
    На менших машинах (8 ГБ) кроки агента можуть тривати достатньо довго, щоб bucket об’єднання скинувся до завершення відповіді, і URL потрапив як другий крок у черзі. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway перевищує ~500 МБ RSS і compressor активний, закрийте інші важкі процеси або перейдіть на більший хост.
  </Accordion>
  <Accordion title="Надсилання з цитуванням відповіді йдуть іншим шляхом">
    Якщо користувач натиснув `Dump` як **відповідь** на наявну URL-бульбашку (iMessage показує бейдж "1 Reply" на бульбашці Dump), URL міститься в `replyToBody`, а не в другому webhook. Об’єднання не застосовується — це питання skill/prompt, а не debouncer.
  </Accordion>
</AccordionGroup>

## Потокове надсилання блоками

Керуйте тим, чи відповіді надсилаються одним повідомленням, чи потоком блоків:

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
- Обмеження медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (за замовчуванням: 8 МБ).
- Вихідний текст розбивається на фрагменти відповідно до `channels.bluebubbles.textChunkLimit` (за замовчуванням: 4000 символів).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

<AccordionGroup>
  <Accordion title="Підключення та webhook">
    - `channels.bluebubbles.enabled`: увімкнути/вимкнути канал.
    - `channels.bluebubbles.serverUrl`: базовий URL REST API BlueBubbles.
    - `channels.bluebubbles.password`: пароль API.
    - `channels.bluebubbles.webhookPath`: шлях endpoint webhook (за замовчуванням: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Політика доступу">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist для DM (handles, emails, E.164 numbers, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist відправників груп.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: на macOS, за бажанням, збагачувати неназваних учасників групи з локальних Contacts після проходження gating. За замовчуванням: `false`.
    - `channels.bluebubbles.groups`: конфігурація для окремих груп (`requireMention` тощо).

  </Accordion>
  <Accordion title="Доставка та поділ на фрагменти">
    - `channels.bluebubbles.sendReadReceipts`: Надсилати сповіщення про прочитання (типово: `true`).
    - `channels.bluebubbles.blockStreaming`: Увімкнути потокову передачу блоками (типово: `false`; потрібно для потокових відповідей).
    - `channels.bluebubbles.textChunkLimit`: Розмір вихідного фрагмента в символах (типово: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Тайм-аут на запит у мс для вихідного надсилання тексту через `/api/v1/message/text` (типово: 30000). Збільшіть для конфігурацій macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворку iMessage; наприклад `45000` або `60000`. Зондування, пошук чатів, реакції, редагування та перевірки працездатності наразі зберігають коротше типове значення 10 с; розширення покриття на реакції та редагування заплановано як подальший крок. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (типово) ділить лише за перевищення `textChunkLimit`; `newline` ділить за порожніми рядками (межами абзаців) перед поділом за довжиною.

  </Accordion>
  <Accordion title="Медіа та історія">
    - `channels.bluebubbles.mediaMaxMb`: Ліміт вхідних/вихідних медіа в МБ (типово: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Явний список дозволених абсолютних локальних каталогів, дозволених для вихідних локальних шляхів до медіа. Надсилання локальних шляхів типово заборонене, якщо це не налаштовано. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Об’єднувати послідовні DM Webhook від того самого відправника в один хід агента, щоб розділене Apple надсилання текст+URL надходило як одне повідомлення (типово: `false`). Див. [Об’єднання розділених DM](#coalescing-split-send-dms-command--url-in-one-composition) для сценаріїв, налаштування вікна та компромісів. Якщо ввімкнено без явного `messages.inbound.byChannel.bluebubbles`, розширює типове вікно debounce для вхідних повідомлень із 500 мс до 2500 мс.
    - `channels.bluebubbles.historyLimit`: Максимум групових повідомлень для контексту (0 вимикає).
    - `channels.bluebubbles.dmHistoryLimit`: Ліміт історії DM.
    - `channels.bluebubbles.replyContextApiFallback`: Коли вхідна відповідь надходить без `replyToBody`/`replyToSender`, а кеш контексту відповіді в пам’яті не спрацьовує, отримати початкове повідомлення з HTTP API BlueBubbles як резервний варіант best-effort (типово: `false`). Корисно для розгортань із кількома інстансами, що спільно використовують один обліковий запис BlueBubbles, після перезапусків процесу або після витіснення довгоживучого кешу TTL/LRU. Отримання захищене від SSRF тією самою політикою, що й кожен інший клієнтський запит BlueBubbles, ніколи не викидає помилку та заповнює кеш, щоб наступні відповіді амортизували витрати. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Налаштування на рівні каналу поширюється на облікові записи, де цей прапорець не задано.

  </Accordion>
  <Accordion title="Дії та облікові записи">
    - `channels.bluebubbles.actions`: Увімкнути/вимкнути конкретні дії.
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

Коли той самий дескриптор має на Mac і iMessage, і SMS-чат (наприклад, номер телефону, зареєстрований в iMessage, але який також отримував резервні green-bubble повідомлення), OpenClaw надає перевагу чату iMessage і ніколи непомітно не понижує маршрут до SMS. Щоб примусово використати SMS-чат, застосуйте явний префікс цілі `sms:` (наприклад `sms:+15555550123`). Дескриптори без відповідного iMessage-чату все одно надсилаються через будь-який чат, який повідомляє BlueBubbles.

## Безпека

- Запити Webhook автентифікуються шляхом порівняння query params або заголовків `guid`/`password` із `channels.bluebubbles.password`.
- Тримайте пароль API та кінцеву точку Webhook у секреті (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу через localhost. Якщо ви проксіюєте Webhook-трафік, зберігайте пароль BlueBubbles у запиті від початку до кінця. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Увімкніть HTTPS + правила firewall на сервері BlueBubbles, якщо відкриваєте його за межі своєї LAN.

## Усунення неполадок

- Якщо події введення/прочитання перестають працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Коди сполучення спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Для реакцій потрібен private API BlueBubbles (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Для редагування/скасування надсилання потрібні macOS 13+ і сумісна версія сервера BlueBubbles. У macOS 26 (Tahoe) редагування наразі зламане через зміни private API.
- Оновлення групової іконки можуть бути нестабільними на macOS 26 (Tahoe): API може повернути успіх, але нова іконка не синхронізується.
- OpenClaw автоматично приховує відомо зламані дії на основі версії macOS сервера BlueBubbles. Якщо редагування все ще з’являється на macOS 26 (Tahoe), вимкніть його вручну за допомогою `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад `Dump` + URL) все одно надходять як два ходи: див. контрольний список [усунення неполадок об’єднання розділених надсилань](#split-send-coalescing-troubleshooting) — поширені причини: занадто коротке вікно debounce, часові позначки журналу сеансу помилково сприйняті як надходження Webhook або надсилання цитати відповіді (яке використовує `replyToBody`, а не другий Webhook).
- Для інформації про статус/працездатність: `openclaw status --all` або `openclaw status --deep`.

Загальну довідку щодо workflow каналів див. у [Канали](/uk/channels) та посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження згадок
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
