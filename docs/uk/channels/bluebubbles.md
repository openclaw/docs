---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення несправностей сполучення Webhook
    - Налаштування iMessage на macOS
sidebarTitle: BlueBubbles
summary: iMessage через macOS-сервер BlueBubbles (надсилання/отримання через REST, набір тексту, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T05:05:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

Статус: bundled plugin, який взаємодіє з macOS-сервером BlueBubbles через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно із застарілим каналом imsg.

<Note>
Поточні випуски OpenClaw постачають BlueBubbles у комплекті, тому звичайні пакетовані збірки не потребують окремого кроку `openclaw plugins install`.
</Note>

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/перевірено: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі зламане на Tahoe, а оновлення іконок груп можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через webhooks; вихідні відповіді, індикатори набору, сповіщення про прочитання та tapbacks виконуються REST-викликами.
- Вкладення та стікери приймаються як вхідні медіа (і, коли можливо, передаються agent).
- Автоматичні TTS-відповіді, що синтезують MP3 або CAF-аудіо, доставляються як бульбашки голосових нотаток iMessage замість звичайних файлових вкладень.
- Сполучення/allowlist працює так само, як і в інших каналах (`/channels/pairing` тощо), з `channels.bluebubbles.allowFrom` + кодами сполучення.
- Реакції передаються як системні події, так само як у Slack/Telegram, щоб agents могли "згадати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, гілки відповідей, ефекти повідомлень, керування групами.

## Швидкий старт

<Steps>
  <Step title="Install BlueBubbles">
    Установіть сервер BlueBubbles на ваш Mac (дотримуйтесь інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
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
- Автентифікація webhook завжди обов’язкова. OpenClaw відхиляє webhook-запити BlueBubbles, якщо вони не містять пароль/guid, що відповідає `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/proxy.
- Автентифікація паролем перевіряється перед читанням/розбором повних тіл webhook.

</Warning>

## Підтримання Messages.app активним (VM / headless-налаштування)

У деяких VM macOS / постійно ввімкнених налаштуваннях Messages.app може переходити в стан "idle" (вхідні події зупиняються, доки застосунок не відкриють або не виведуть на передній план). Простий обхідний шлях — **підштовхувати Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

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

    Це запускається **кожні 300 секунд** і **під час входу в систему**. Перший запуск може спричинити запити macOS **Automation** (`osascript` → Messages). Схваліть їх у тому самому сеансі користувача, у якому працює LaunchAgent.

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
  Шлях кінцевої точки webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` або `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Номери телефонів, електронні адреси або цілі чату.
</ParamField>

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Контроль доступу (DM + групи)

<Tabs>
  <Tab title="DMs">
    - За замовчуванням: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Невідомі відправники отримують код сполучення; повідомлення ігноруються, доки їх не буде схвалено (коди спливають через 1 годину).
    - Схвалити через:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Сполучення є типовим обміном токенами. Докладніше: [Сполучення](/uk/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (за замовчуванням: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` контролює, хто може запускати agent у групах, коли встановлено `allowlist`.

  </Tab>
</Tabs>

### Збагачення імен контактів (macOS, необов’язково)

Групові webhooks BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, ви можете ввімкнути збагачення локальними Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. За замовчуванням: `false`.
- Пошуки запускаються лише після того, як доступ до групи, авторизація команди та mention gating пропустили повідомлення.
- Збагачуються лише учасники з телефонними номерами без імен.
- Сирі номери телефонів залишаються fallback-значенням, коли локальний збіг не знайдено.

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

BlueBubbles підтримує mention gating для групових чатів, що відповідає поведінці iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадок.
- Коли `requireMention` увімкнено для групи, agent відповідає лише тоді, коли його згадали.
- Команди керування від авторизованих відправників обходять mention gating.

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

### Command gating

- Команди керування (наприклад, `/config`, `/model`) потребують авторизації.
- Використовує `allowFrom` і `groupAllowFrom` для визначення авторизації команд.
- Авторизовані відправники можуть запускати команди керування навіть без згадування в групах.

### Системний prompt для окремої групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Значення додається до системного prompt agent на кожному ході, який обробляє повідомлення в цій групі, тож ви можете задати persona або поведінкові правила для окремої групи без редагування prompt agent:

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

Ключ відповідає тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а wildcard-запис `"*"` задає значення за замовчуванням для кожної групи без точного збігу (той самий шаблон, що використовується `requireMention` і політиками інструментів для окремих груп). Точні збіги завжди мають пріоритет над wildcard. DM ігнорують це поле; натомість використовуйте налаштування prompt на рівні agent або облікового запису.

#### Робочий приклад: гілковані відповіді та tapback-реакції (Private API)

Коли увімкнено BlueBubbles Private API, вхідні повідомлення надходять із короткими ідентифікаторами повідомлень (наприклад, `[[reply_to:5]]`), а agent може викликати `action=reply`, щоб відповісти в гілці конкретного повідомлення, або `action=react`, щоб залишити tapback. `systemPrompt` для окремої групи — надійний спосіб змусити agent вибирати правильний інструмент:

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

Tapback-реакції та гілковані відповіді обидві потребують BlueBubbles Private API; див. [Розширені дії](#advanced-actions) і [Ідентифікатори повідомлень](#message-ids-short-vs-full), щоб дізнатися про базову механіку.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на довговічні робочі простори ACP без зміни транспортного шару.

Швидкий потік оператора:

- Запустіть `/acp spawn codex --bind here` усередині DM або дозволеного групового чату.
- Майбутні повідомлення в тій самій розмові BlueBubbles маршрутизуються до створеного сеансу ACP.
- `/new` і `/reset` скидають той самий прив’язаний сеанс ACP на місці.
- `/acp close` закриває сеанс ACP і видаляє прив’язку.

Налаштовані постійні прив’язки також підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований DM handle, як-от `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних групових прив’язок віддавайте перевагу `chat_id:*` або `chat_identifier:*`.

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

## Набір тексту + сповіщення про прочитання

- **Індикатори набору**: надсилаються автоматично перед і під час генерації відповіді.
- **Підтвердження прочитання**: керуються `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори набору**: OpenClaw надсилає події початку набору; BlueBubbles автоматично очищає стан набору під час надсилання або після тайм-ауту (ручна зупинка через DELETE ненадійна).

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
    - **react**: додати/видалити tapback-реакції (`messageId`, `emoji`, `remove`). Нативний набір tapback в iMessage: `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає emoji поза цим набором (наприклад `👀`), інструмент реакцій повертається до `love`, щоб tapback усе одно відобразився, а не зірвав увесь запит. Налаштовані ack-реакції й далі проходять сувору валідацію та дають помилку для невідомих значень.
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
      - Голосові нотатки: установіть `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових нотаток.
    - Застарілий псевдонім: `sendAttachment` і далі працює, але `upload-file` є канонічною назвою дії.

  </Accordion>
</AccordionGroup>

### ID повідомлень (короткі й повні)

OpenClaw може показувати _короткі_ ID повідомлень (наприклад, `1`, `2`), щоб заощаджувати токени.

- `MessageSid` / `ReplyToId` можуть бути короткими ID.
- `MessageSidFull` / `ReplyToIdFull` містять повні ID провайдера.
- Короткі ID зберігаються в пам’яті; вони можуть застаріти після перезапуску або витіснення з кешу.
- Дії приймають короткий або повний `messageId`, але короткі ID спричинять помилку, якщо вони більше недоступні.

Використовуйте повні ID для довготривалих автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Конфігурація](/uk/gateway/configuration) щодо змінних шаблонів.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання split-send DM (команда + URL в одному складанні)

Коли користувач вводить команду й URL разом в iMessage — наприклад `Dump https://example.com/article` — Apple розділяє надсилання на **дві окремі доставки Webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка URL-прев’ю (`"https://..."`) із зображеннями OG-прев’ю як вкладеннями.

У більшості налаштувань два Webhook надходять в OpenClaw з інтервалом приблизно 0,8-2,0 с. Без об’єднання агент отримує лише команду на ході 1, відповідає (часто «надішліть мені URL») і бачить URL лише на ході 2 — коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` вмикає для DM об’єднання послідовних Webhook від того самого відправника в один хід агента. Групові чати й далі прив’язуються до окремих повідомлень, щоб зберегти структуру ходів кількох користувачів.

<Tabs>
  <Tab title="Коли вмикати">
    Увімкніть, коли:

    - Ви постачаєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL, зображення або довгий вміст разом із командами.
    - Ви можете прийняти додаткову затримку ходу DM (див. нижче).

    Залиште вимкненим, коли:

    - Вам потрібна мінімальна затримка команд для однословних тригерів DM.
    - Усі ваші потоки є одноразовими командами без наступних payload.

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

    Коли прапорець увімкнено й немає явного `messages.inbound.byChannel.bluebubbles`, debounce-вікно розширюється до **2500 мс** (типово для режиму без об’єднання — 500 мс). Ширше вікно потрібне, бо cadence split-send від Apple у 0,8-2,0 с не вкладається в тісніше типове значення.

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
    - **Додана затримка для керівних команд DM.** Коли прапорець увімкнено, повідомлення керівних команд DM (наприклад `Dump`, `Save` тощо) тепер чекають до завершення debounce-вікна перед dispatch, на випадок якщо надходить Webhook із payload. Команди групового чату зберігають миттєвий dispatch.
    - **Об’єднаний вивід обмежений** — об’єднаний текст обмежується 4000 символами з явним маркером `…[truncated]`; вкладення обмежуються 20; записи джерел обмежуються 10 (понад це зберігаються перший і найновіший). Кожен вихідний `messageId` усе одно доходить до inbound-dedupe, тож пізніший replay MessagePoller будь-якої окремої події розпізнається як дублікат.
    - **Opt-in, для окремого каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються.

  </Tab>
</Tabs>

### Сценарії й те, що бачить агент

| Користувач складає                                                | Apple доставляє                | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 мс                                    |
| ------------------------------------------------------------------ | ------------------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                       | 2 Webhook з інтервалом ~1 с    | Два ходи агента: лише "Dump", потім URL | Один хід: об’єднаний текст `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 Webhook                      | Два ходи                                | Один хід: текст + зображення                                            |
| `/status` (окрема команда)                                         | 1 Webhook                      | Миттєвий dispatch                       | **Чекати до вікна, потім dispatch**                                     |
| URL, вставлений окремо                                             | 1 Webhook                      | Миттєвий dispatch                       | Миттєвий dispatch (лише один запис у bucket)                            |
| Текст + URL, надіслані як два навмисно окремі повідомлення, з різницею в хвилини | 2 Webhook поза вікном | Два ходи                                | Два ходи (вікно завершується між ними)                                  |
| Швидкий потік (>10 малих DM у межах вікна)                         | N Webhook                      | N ходів                                 | Один хід, обмежений вивід (перший + найновіший, застосовані обмеження тексту/вкладень) |

### Усунення несправностей об’єднання split-send

Якщо прапорець увімкнено, але split-send і далі надходять як два ходи, перевірте кожен рівень:

<AccordionGroup>
  <Accordion title="Конфігурацію справді завантажено">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Потім `openclaw gateway restart` — прапорець зчитується під час створення debouncer-registry.

  </Accordion>
  <Accordion title="Debounce-вікно достатньо широке для вашого налаштування">
    Перегляньте журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Виміряйте проміжок між dispatch тексту в стилі `"Dump"` і наступним dispatch `"https://..."; Attachments:`. Збільште `messages.inbound.byChannel.bluebubbles`, щоб із запасом покрити цей проміжок.

  </Accordion>
  <Accordion title="Позначки часу Session JSONL ≠ надходження Webhook">
    Позначки часу подій сеансу (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають момент, коли Gateway передає повідомлення агенту, **а не** момент надходження Webhook. Друге повідомлення в черзі, позначене `[Queued messages while agent was busy]`, означає, що перший хід усе ще виконувався, коли надійшов другий Webhook — bucket об’єднання вже було скинуто. Налаштовуйте вікно за журналом сервера BB, а не за журналом сеансу.
  </Accordion>
  <Accordion title="Тиск пам’яті сповільнює dispatch відповіді">
    На менших машинах (8 ГБ) ходи агента можуть тривати достатньо довго, щоб bucket об’єднання скинувся до завершення відповіді, і URL потрапив як другий хід у черзі. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway використовує понад ~500 МБ RSS і compressor активний, закрийте інші важкі процеси або перейдіть на більший хост.
  </Accordion>
  <Accordion title="Надсилання reply-quote йдуть іншим шляхом">
    Якщо користувач натиснув `Dump` як **відповідь** на наявну URL-бульбашку (iMessage показує бейдж "1 Reply" на бульбашці Dump), URL міститься в `replyToBody`, а не в другому Webhook. Об’єднання не застосовується — це питання skill/prompt, а не debouncer.
  </Accordion>
</AccordionGroup>

## Блокове потокове передавання

Керує тим, чи відповіді надсилаються як одне повідомлення, чи потоково блоками:

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
- Вихідний текст розбивається на частини за `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

<AccordionGroup>
  <Accordion title="Підключення та Webhook">
    - `channels.bluebubbles.enabled`: увімкнути/вимкнути канал.
    - `channels.bluebubbles.serverUrl`: базовий URL REST API BlueBubbles.
    - `channels.bluebubbles.password`: пароль API.
    - `channels.bluebubbles.webhookPath`: шлях endpoint Webhook (типово: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Політика доступу">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist DM (handles, email, номери E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist відправників групи.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: на macOS, за бажанням доповнювати безіменних учасників групи з локальних Contacts після проходження gating. Типово: `false`.
    - `channels.bluebubbles.groups`: конфігурація для окремих груп (`requireMention` тощо).

  </Accordion>
  <Accordion title="Доставка та фрагментація">
    - `channels.bluebubbles.sendReadReceipts`: Надсилати підтвердження прочитання (типово: `true`).
    - `channels.bluebubbles.blockStreaming`: Увімкнути блокове потокове передавання (типово: `false`; потрібно для потокових відповідей).
    - `channels.bluebubbles.textChunkLimit`: Розмір вихідного фрагмента в символах (типово: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Тайм-аут на запит у мс для надсилання вихідного тексту через `/api/v1/message/text` (типово: 30000). Збільште для налаштувань macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворку iMessage; наприклад `45000` або `60000`. Зондування, пошук чатів, реакції, редагування та перевірки стану наразі зберігають коротше типове значення 10 с; розширення покриття на реакції та редагування заплановано як наступний крок. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише за перевищення `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.

  </Accordion>
  <Accordion title="Медіа та історія">
    - `channels.bluebubbles.mediaMaxMb`: Ліміт вхідних/вихідних медіа в МБ (типово: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Явний список дозволених абсолютних локальних каталогів, дозволених для вихідних локальних шляхів медіа. Надсилання локальних шляхів типово заборонено, якщо це не налаштовано. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Об’єднувати послідовні DM-вебхуки від того самого відправника в один хід агента, щоб Apple-розділення текст+URL надходило як одне повідомлення (типово: `false`). Див. [Об’єднання розділених DM](#coalescing-split-send-dms-command--url-in-one-composition) для сценаріїв, налаштування вікна та компромісів. Розширює типове вікно debounce для вхідних повідомлень із 500 мс до 2500 мс, якщо ввімкнено без явного `messages.inbound.byChannel.bluebubbles`.
    - `channels.bluebubbles.historyLimit`: Максимальна кількість групових повідомлень для контексту (0 вимикає).
    - `channels.bluebubbles.dmHistoryLimit`: Ліміт історії DM.
    - `channels.bluebubbles.replyContextApiFallback`: Коли вхідна відповідь надходить без `replyToBody`/`replyToSender` і кеш контексту відповіді в пам’яті не спрацьовує, отримувати оригінальне повідомлення з BlueBubbles HTTP API як резервний варіант best-effort (типово: `false`). Корисно для розгортань із кількома екземплярами, що спільно використовують один обліковий запис BlueBubbles, після перезапусків процесу або після витіснення з довготривалого кешу TTL/LRU. Отримання захищене від SSRF тією самою політикою, що й кожен інший запит клієнта BlueBubbles, ніколи не кидає виняток і заповнює кеш, щоб подальші відповіді амортизували витрати. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Налаштування рівня каналу поширюється на облікові записи, які пропускають цей прапорець.

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

Віддавайте перевагу `chat_guid` для стабільної маршрутизації:

- `chat_guid:iMessage;-;+15555550123` (бажано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі дескриптори: `+15555550123`, `user@example.com`
  - Якщо прямий дескриптор не має наявного DM-чату, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно ввімкнути BlueBubbles Private API.

### Маршрутизація iMessage проти SMS

Коли той самий дескриптор має і iMessage, і SMS-чат на Mac (наприклад номер телефону, зареєстрований в iMessage, але який також отримував зелені fallback-повідомлення), OpenClaw віддає перевагу чату iMessage і ніколи безшумно не понижує до SMS. Щоб примусово використати SMS-чат, застосуйте явний цільовий префікс `sms:` (наприклад `sms:+15555550123`). Дескриптори без відповідного iMessage-чату все одно надсилаються через будь-який чат, який повідомляє BlueBubbles.

## Безпека

- Webhook-запити автентифікуються шляхом порівняння query-параметрів або заголовків `guid`/`password` із `channels.bluebubbles.password`.
- Зберігайте пароль API та кінцеву точку Webhook у таємниці (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу через localhost. Якщо ви проксіюєте Webhook-трафік, зберігайте пароль BlueBubbles у запиті наскрізно. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Увімкніть HTTPS і правила firewall на сервері BlueBubbles, якщо відкриваєте його за межі своєї LAN.

## Усунення несправностей

- Якщо події введення/прочитання перестали працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Коди сполучення спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Для реакцій потрібен приватний API BlueBubbles (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Для редагування/скасування надсилання потрібні macOS 13+ і сумісна версія сервера BlueBubbles. На macOS 26 (Tahoe) редагування наразі зламане через зміни private API.
- Оновлення іконки групи може бути нестабільним на macOS 26 (Tahoe): API може повернути успіх, але нова іконка не синхронізується.
- OpenClaw автоматично приховує відомо зламані дії на основі версії macOS сервера BlueBubbles. Якщо редагування все ще відображається на macOS 26 (Tahoe), вимкніть його вручну за допомогою `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад `Dump` + URL) усе ще надходять як два ходи: див. контрольний список [усунення несправностей об’єднання розділених надсилань](#split-send-coalescing-troubleshooting) — поширені причини: занадто вузьке debounce-вікно, часові позначки журналу сесії помилково сприйняті як надходження Webhook, або надсилання цитати-відповіді (яке використовує `replyToBody`, а не другий Webhook).
- Для інформації про статус/стан: `openclaw status --all` або `openclaw status --deep`.

Загальну довідку щодо робочого процесу каналів див. у [Канали](/uk/channels) та посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та контроль згадок
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
