---
read_when:
    - Працює над функціями Telegram або Webhook'ами
summary: Статус підтримки бота Telegram, можливості та налаштування
title: Telegram
x-i18n:
    generated_at: "2026-04-21T00:17:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c70775b55d4923a31ad8bae7f4c6e7cbae754c05c3a578180d63db2b59e39a
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Статус: готовий до продакшену для DM бота + груп через grammY. Довге опитування є режимом за замовчуванням; режим Webhook є необов’язковим.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — сполучення.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Налаштування Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат з **@BotFather** (переконайтеся, що хендл точно `@BotFather`).

    Виконайте `/newbot`, дотримуйтеся підказок і збережіть токен.

  </Step>

  <Step title="Налаштуйте токен і політику DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Резервний варіант через env: `TELEGRAM_BOT_TOKEN=...` (лише для облікового запису за замовчуванням).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і підтвердьте перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди сполучення дійсні протягом 1 години.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена залежить від облікового запису. На практиці значення з config мають пріоритет над резервним значенням із env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Для ботів Telegram за замовчуванням увімкнено **Privacy Mode**, який обмежує, які повідомлення групи вони отримують.

    Якщо бот має бачити всі повідомлення групи, виконайте одну з дій:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму приватності видаліть бота й додайте його знову в кожну групу, щоб Telegram застосував зміни.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійно активної поведінки в групах.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups` — дозволити/заборонити додавання до груп
    - `/setprivacy` — керування видимістю в групах

  </Accordion>
</AccordionGroup>

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потребує принаймні одного ID відправника в `allowFrom`)
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється перевіркою config.
    Під час налаштування запитуються лише числові ID користувачів.
    Якщо ви оновилися і ваш config містить записи allowlist у форматі `@username`, виконайте `openclaw doctor --fix`, щоб перетворити їх (у межах можливого; потрібен токен бота Telegram).
    Якщо ви раніше покладалися на файли allowlist зі сховища сполучення, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` для сценаріїв allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником рекомендовано використовувати `dmPolicy: "allowlist"` з явними числовими ID в `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх підтверджень сполучення).

    Поширене непорозуміння: підтвердження сполучення DM не означає, що «цей відправник авторизований скрізь».
    Сполучення надає доступ лише до DM. Авторизація відправників у групах і надалі визначається явними allowlist у config.
    Якщо ви хочете, щоб «я був авторизований один раз, і працювали і DM, і команди в групах», додайте свій числовий ID користувача Telegram до `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний спосіб через Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній спосіб (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два механізми керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи до `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо його не задано, Telegram використовує `allowFrom` як резервне значення.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не додавайте ID чатів груп або супергруп Telegram до `groupAllowFrom`. Від’ємні ID чатів належать до `channels.telegram.groups`.
    Нечислові записи ігноруються під час авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправників у групах **не** успадковує підтвердження зі сховища сполучення для DM.
    Сполучення залишається лише для DM. Для груп налаштуйте `groupAllowFrom` або `allowFrom` для конкретної групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує як резервне значення `allowFrom` із config, а не сховище сполучення.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, не задавайте `groupAllowFrom` і дозвольте потрібні групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням працює в fail-closed режимі з `groupPolicy="allowlist"`, якщо явно не задано `channels.defaults.groupPolicy`.

    Приклад: дозволити будь-якому учаснику в одній конкретній групі:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Приклад: дозволити лише конкретним користувачам в одній конкретній групі:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Поширена помилка: `groupAllowFrom` — це не allowlist груп Telegram.

      - Додавайте від’ємні ID груп або супергруп Telegram, такі як `-1001234567890`, до `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, такі як `8734062810`, до `groupAllowFrom`, якщо хочете обмежити, хто саме всередині дозволеної групи може викликати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Відповіді в групах за замовчуванням потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадки в:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для постійного збереження використовуйте config.

    Приклад постійної конфігурації:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Як отримати ID групового чату:

    - переслати повідомлення з групи до `@userinfobot` / `@getidsbot`
    - або прочитати `chat.id` з `openclaw logs --follow`
    - або перевірити Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні відповіді з Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються до спільної оболонки каналу з метаданими відповіді та заповнювачами медіа.
- Сесії груп ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб зберегти ізоляцію тем.
- Повідомлення DM можуть містити `message_thread_id`; OpenClaw маршрутизує їх із thread-aware ключами сесій і зберігає ID потоку для відповідей.
- Довге опитування використовує grammY runner з послідовністю для кожного чату/потоку. Загальна конкурентність sink runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски сторожового механізму довгого опитування спрацьовують за замовчуванням після 120 секунд без завершеної перевірки життєздатності `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще виникають хибні перезапуски через зависання опитування під час довготривалої роботи. Значення задається в мілісекундах і допускається в межах від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд потокової відповіді наживо (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` зіставляється з `partial` у Telegram (сумісність із міжканальним найменуванням)
    - застарілі значення `channels.telegram.streamMode` і булеві значення `streaming` автоматично зіставляються

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, з медіа), OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Потоковий попередній перегляд відокремлений від block streaming. Якщо для Telegram явно ввімкнено block streaming, OpenClaw пропускає потоковий попередній перегляд, щоб уникнути подвійного потокового виведення.

    Якщо нативний транспорт чернеток недоступний або відхиляється, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік reasoning лише для Telegram:

    - `/reasoning stream` надсилає reasoning у live preview під час генерації
    - фінальна відповідь надсилається без тексту reasoning

  </Accordion>

  <Accordion title="Форматування та резервний варіант HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок розбору в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнений за замовчуванням і може бути вимкнений через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Типові значення для нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додавання користувацьких записів до меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Резервна копія Git" },
        { command: "generate", description: "Створити зображення" },
      ],
    },
  },
}
```

    Правила:

    - імена нормалізуються (прибирається початковий `/`, нижній регістр)
    - припустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та записуються в журнал

    Примітки:

    - користувацькі команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills усе одно можуть працювати при ручному введенні, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Користувацькі команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені збої під час налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після скорочення; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками мережі/fetch зазвичай означає, що вихідні DNS/HTTPS-запити до `api.telegram.org` заблоковані.

    ### Команди сполучення пристроїв (Plugin `device-pair`)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунку iOS
    3. `/pair pending` показує список запитів, що очікують розгляду (включно з роллю/scopes)
    4. підтвердьте запит:
       - `/pair approve <requestId>` для явного підтвердження
       - `/pair approve`, коли є лише один запит, що очікує розгляду
       - `/pair approve latest` для найновішого

    Код налаштування містить короткостроковий bootstrap-токен. Вбудована передача bootstrap-запиту зберігає токен первинного Node на `scopes: []`; будь-який переданий токен оператора залишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap-scopes мають префікс ролі, тому цей allowlist оператора задовольняє лише запити оператора; ролі, що не є оператором, як і раніше потребують scopes під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними автентифікації (наприклад, роль/scopes/публічний ключ), попередній запит, що очікував розгляду, замінюється, а новий запит використовує інший `requestId`. Перед підтвердженням повторно виконайте `/pair pending`.

    Докладніше: [Сполучення](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Вбудовані кнопки">
    Налаштуйте область дії вбудованої клавіатури:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Перевизначення для окремого облікового запису:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Області дії:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (за замовчуванням)

    Застаріле `capabilities: ["inlineButtons"]` зіставляється з `inlineButtons: "all"`.

    Приклад дії повідомлення:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Виберіть варіант:",
  buttons: [
    [
      { text: "Так", callback_data: "yes" },
      { text: "Ні", callback_data: "no" },
    ],
    [{ text: "Скасувати", callback_data: "cancel" }],
  ],
}
```

    Натискання callback передаються агенту як текст:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Дії з повідомленнями Telegram для агентів та автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язково `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язково `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керувальні перемикачі:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі увімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання в runtime використовує активний знімок config/secrets (startup/reload), тому шляхи дій не виконують спеціального повторного визначення `SecretRef` під час кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` — відповісти на повідомлення-тригер
    - `[[reply_to:<id>]]` — відповісти на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Примітка: `off` вимикає неявне групування відповідей у потоки. Явні теги `[[reply_to_*]]` однаково враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форуму:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор набору націлюються на потік теми
    - шлях config для теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії індикатора набору все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` стосується лише теми й не успадковується від значень групи за замовчуванням.

    **Маршрутизація агента для кожної теми**: Кожна тема може маршрутизуватися до іншого агента через встановлення `agentId` у config теми. Це надає кожній темі власний ізольований workspace, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → агент main
                "3": { agentId: "zu" },        // Тема розробки → агент zu
                "5": { agentId: "coder" }      // Перевірка коду → агент coder
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійна прив’язка тем ACP**: Теми форуму можуть закріплювати сесії harness ACP через типізовані прив’язки ACP верхнього рівня:

    - `bindings[]` з `type: "acp"` і `match.channel: "telegram"`

    Приклад:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Наразі це обмежено темами форумів у групах і супергрупах.

    **Створення ACP, прив’язаного до потоку, з чату**:

    - `/acp spawn <agent> --thread here|auto` може прив’язати поточну тему Telegram до нової сесії ACP.
    - Подальші повідомлення в темі маршрутизуються безпосередньо до прив’язаної сесії ACP (без потреби в `/acp steer`).
    - Після успішної прив’язки OpenClaw закріплює повідомлення з підтвердженням створення прямо в темі.
    - Потребує `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону включає:

    - `MessageThreadId`
    - `IsForum`

    Поведінка потоків у DM:

    - приватні чати з `message_thread_id` зберігають маршрутизацію DM, але використовують thread-aware ключі сесій/цілі відповідей.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові повідомлення та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає як голосове повідомлення

    Приклад дії повідомлення:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Відеоповідомлення

    Telegram розрізняє відеофайли та video notes.

    Приклад дії повідомлення:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video notes не підтримують підписи; наданий текст повідомлення надсилається окремо.

    ### Стікери

    Обробка вхідних стікерів:

    - статичні WEBP: завантажуються й обробляються (заповнювач `<media:sticker>`)
    - анімовані TGS: пропускаються
    - відео WEBM: пропускаються

    Поля контексту стікера:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Файл кешу стікерів:

    - `~/.openclaw/telegram/sticker-cache.json`

    Стікери описуються один раз (коли це можливо) і кешуються, щоб зменшити кількість повторних викликів vision.

    Увімкнення дій зі стікерами:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Дія надсилання стікера:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Пошук кешованих стікерів:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Реакції в Telegram надходять як оновлення `message_reaction` (окремо від корисного навантаження повідомлень).

    Якщо ввімкнено, OpenClaw ставить у чергу системні події на зразок:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (у межах можливого через кеш надісланих повідомлень).
    - Події реакцій усе одно поважають механізми керування доступом Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID потоку в оновленнях реакцій.
      - групи не-форумного типу маршрутизуються до сесії групового чату
      - групи-форуми маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної вихідної теми

    `allowed_updates` для polling/webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервне значення з емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує Unicode-емодзі (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Запис config із подій і команд Telegram">
    Запис конфігурації каналу увімкнений за замовчуванням (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції групи (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
    - `/config set` і `/config unset` (потрібне ввімкнення команд)

    Вимкнення:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Довге опитування чи Webhook">
    За замовчуванням: довге опитування.

    Режим Webhook:

    - задайте `channels.telegram.webhookUrl`
    - задайте `channels.telegram.webhookSecret` (обов’язково, якщо задано URL Webhook)
    - необов’язково `channels.telegram.webhookPath` (за замовчуванням `/telegram-webhook`)
    - необов’язково `channels.telegram.webhookHost` (за замовчуванням `127.0.0.1`)
    - необов’язково `channels.telegram.webhookPort` (за замовчуванням `8787`)

    Типовий локальний listener для режиму Webhook прив’язується до `127.0.0.1:8787`.

    Якщо ваша публічна кінцева точка відрізняється, поставте перед нею reverse proxy і вкажіть у `webhookUrl` публічний URL.
    Встановіть `webhookHost` (наприклад, `0.0.0.0`), коли вам свідомо потрібен зовнішній вхідний трафік.

  </Accordion>

  <Accordion title="Обмеження, повторні спроби та цілі CLI">
    - Значення `channels.telegram.textChunkLimit` за замовчуванням — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується значення grammY за замовчуванням).
    - `channels.telegram.pollingStallThresholdMs` за замовчуванням дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає.
    - Додатковий контекст reply/quote/forward наразі передається як отримано.
    - Telegram allowlist переважно керують тим, хто може викликати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціль надсилання в CLI може бути числовим ID чату або ім’ям користувача:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Опитування Telegram використовують `openclaw message poll` і підтримують теми форуму:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Прапорці опитувань лише для Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` для тем форуму (або використовуйте ціль `:topic:`)

    Надсилання Telegram також підтримує:

    - `--buttons` для вбудованих клавіатур, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи, а не як стиснені фото чи анімовані медіазавантаження

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Підтвердження exec у Telegram">
    Telegram підтримує підтвердження exec у DM осіб, що підтверджують, і за потреби може публікувати запити на підтвердження у вихідному чаті або темі.

    Шлях config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (необов’язково; як резервне значення використовуються числові ID власників, виведені з `allowFrom` і прямого `defaultTo`, коли це можливо)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`

    Особи, що підтверджують, мають бути числовими ID користувачів Telegram. Telegram автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"`, і можна визначити принаймні одну особу, що підтверджує, або з `execApprovals.approvers`, або з конфігурації числового власника облікового запису (`allowFrom` і `defaultTo` для прямих повідомлень). Встановіть `enabled: false`, щоб явно вимкнути Telegram як нативний клієнт підтвердження. В інших випадках запити на підтвердження повертаються до інших налаштованих маршрутів підтвердження або до резервної політики підтвердження exec.

    Telegram також рендерить спільні кнопки підтвердження, які використовуються іншими чат-каналами. Нативний адаптер Telegram переважно додає маршрутизацію DM для осіб, що підтверджують, fanout у канали/теми та підказки про набір перед доставкою.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що підтвердження в чаті недоступні або ручне підтвердження — єдиний шлях.

    Правила доставки:

    - `target: "dm"` надсилає запити на підтвердження лише в DM визначених осіб, що підтверджують
    - `target: "channel"` надсилає запит назад у вихідний чат/тему Telegram
    - `target: "both"` надсилає і в DM осіб, що підтверджують, і у вихідний чат/тему

    Лише визначені особи, що підтверджують, можуть підтверджувати або відхиляти. Особи, що не підтверджують, не можуть використовувати `/approve` і не можуть використовувати кнопки підтвердження Telegram.

    Поведінка визначення підтвердження:

    - ID з префіксом `plugin:` завжди визначаються через підтвердження Plugin.
    - Інші ID спочатку пробують `exec.approval.resolve`.
    - Якщо Telegram також авторизований для підтверджень Plugin і gateway повідомляє,
      що підтвердження exec невідоме/прострочене, Telegram один раз повторює спробу через
      `plugin.approval.resolve`.
    - Справжні відмови/помилки підтвердження exec не переходять мовчки до
      визначення підтвердження Plugin.

    Доставка в канал показує текст команди в чаті, тому вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему як для запиту на підтвердження, так і для подальших дій після підтвердження. Термін дії підтверджень exec за замовчуванням спливає через 30 хвилин.

    Вбудовані кнопки підтвердження також залежать від того, чи дозволяє `channels.telegram.capabilities.inlineButtons` цільову поверхню (`dm`, `group` або `all`).

    Пов’язана документація: [Підтвердження exec](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Керування відповідями з помилками

Коли агент стикається з помилкою доставки або постачальника, Telegram може або відповісти текстом помилки, або приглушити його. Цю поведінку визначають два ключі config:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю приглушує відповіді з помилками. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями з помилками в тому самому чаті. Запобігає спаму помилками під час збоїв.        |

Підтримуються перевизначення для окремих облікових записів, груп і тем (та саме успадкування, що й для інших ключів config Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // приглушити помилки в цій групі
        },
      },
    },
  },
}
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення в групі без згадки">

    - Якщо `requireMention=false`, режим приватності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть бота й знову додайте його до групи
    - `openclaw channels status` попереджає, коли config очікує повідомлення групи без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; членство для шаблону `"*"` перевірити не можна.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить повідомлень групи">

    - коли існує `channels.telegram.groups`, група має бути в списку (або має бути `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow`, щоб побачити причини пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або зовсім не працюють">

    - авторизуйте свою ідентичність відправника (сполучення та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть якщо політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має надто багато записів; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть нативні меню
    - `setMyCommands failed` з помилками мережі/fetch зазвичай вказує на проблеми з доступністю DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + користувацький fetch/proxy можуть спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - На деяких хостах `api.telegram.org` спочатку резолвиться в IPv6; несправний вихід через IPv6 може викликати періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює спробу для цих помилок як для відновлюваних мережевих помилок.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної життєздатності long-poll за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` є справними, але ваш хост усе одно повідомляє про хибні перезапуски через зависання polling. Стійкі зависання зазвичай вказують на проблеми з proxy, DNS, IPv6 або TLS-виходом між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим виходом/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - За замовчуванням Node 22+ використовує `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює з режимом лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону benchmark RFC 2544 (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/special-use адресу під час завантаження медіа, ви можете
      явно ввімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне для окремого облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy резолвить хости медіа Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже за замовчуванням дозволяють діапазон benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист від SSRF для медіа Telegram. Використовуйте це лише в довірених середовищах proxy, контрольованих оператором,
      таких як маршрутизація fake-IP у Clash, Mihomo або Surge, коли вони
      синтезують приватні або special-use відповіді поза діапазоном benchmark RFC 2544.
      Для звичайного доступу до Telegram через публічний інтернет залишайте це вимкненим.
    </Warning>

    - Перевизначення через середовище (тимчасово):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Перевірка відповідей DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Докладніше: [Усунення проблем каналу](/uk/channels/troubleshooting).

## Вказівники на довідник config Telegram

Основний довідник:

- `channels.telegram.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.telegram.botToken`: токен бота (BotFather).
- `channels.telegram.tokenFile`: читати токен зі шляху до звичайного файла. Символічні посилання відхиляються.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.telegram.allowFrom`: allowlist для DM (числові ID користувачів Telegram). `allowlist` потребує щонайменше один ID відправника. `open` потребує `"*"`. `openclaw doctor --fix` може перетворювати застарілі записи `@username` на ID і може відновлювати записи allowlist із файлів pairing-store у сценаріях міграції allowlist.
- `channels.telegram.actions.poll`: увімкнути або вимкнути створення опитувань Telegram (за замовчуванням: увімкнено; все одно потребує `sendMessage`).
- `channels.telegram.defaultTo`: ціль Telegram за замовчуванням, яку CLI `--deliver` використовує, коли не вказано явний `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist відправників у групах (числові ID користувачів Telegram). `openclaw doctor --fix` може перетворювати застарілі записи `@username` на ID. Нечислові записи ігноруються під час авторизації. Авторизація груп не використовує резервне значення з DM pairing-store (`2026.2.25+`).
- Пріоритет для кількох облікових записів:
  - Коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити маршрутизацію за замовчуванням.
  - Якщо не задано жодне з них, OpenClaw використовує як резервне значення перший нормалізований ID облікового запису, а `openclaw doctor` показує попередження.
  - `channels.telegram.accounts.default.allowFrom` і `channels.telegram.accounts.default.groupAllowFrom` застосовуються лише до облікового запису `default`.
  - Іменовані облікові записи успадковують `channels.telegram.allowFrom` і `channels.telegram.groupAllowFrom`, якщо значення на рівні облікового запису не задано.
  - Іменовані облікові записи не успадковують `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: значення за замовчуванням для групи + allowlist (використовуйте `"*"` для глобальних значень за замовчуванням).
  - `channels.telegram.groups.<id>.groupPolicy`: перевизначення `groupPolicy` для окремої групи (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: типове керування потребою згадки.
  - `channels.telegram.groups.<id>.skills`: фільтр Skills (не вказано = усі Skills, порожньо = жодного).
  - `channels.telegram.groups.<id>.allowFrom`: перевизначення allowlist відправників для окремої групи.
  - `channels.telegram.groups.<id>.systemPrompt`: додатковий системний prompt для групи.
  - `channels.telegram.groups.<id>.enabled`: вимкнути групу, якщо `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: перевизначення для окремої теми (поля групи + `agentId`, доступний лише для теми).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: маршрутизувати цю тему до конкретного агента (перевизначає маршрутизацію на рівні групи та bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: перевизначення `groupPolicy` для окремої теми (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: перевизначення потреби згадки для окремої теми.
- верхньорівневий `bindings[]` з `type: "acp"` і канонічним ID теми `chatId:topic:topicId` у `match.peer.id`: поля постійної прив’язки теми ACP (див. [ACP Agents](/uk/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: маршрутизувати теми DM до конкретного агента (та сама поведінка, що й для тем форуму).
- `channels.telegram.execApprovals.enabled`: увімкнути Telegram як чат-клієнт підтвердження exec для цього облікового запису.
- `channels.telegram.execApprovals.approvers`: ID користувачів Telegram, яким дозволено підтверджувати або відхиляти запити exec. Необов’язково, якщо `channels.telegram.allowFrom` або прямий `channels.telegram.defaultTo` вже ідентифікує власника.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (за замовчуванням: `dm`). `channel` і `both` зберігають вихідну тему Telegram, якщо вона є.
- `channels.telegram.execApprovals.agentFilter`: необов’язковий фільтр ID агента для пересланих запитів на підтвердження.
- `channels.telegram.execApprovals.sessionFilter`: необов’язковий фільтр ключа сесії (підрядок або regex) для пересланих запитів на підтвердження.
- `channels.telegram.accounts.<account>.execApprovals`: перевизначення для окремого облікового запису для маршрутизації підтверджень exec і авторизації осіб, що підтверджують.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (за замовчуванням: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: перевизначення для окремого облікового запису.
- `channels.telegram.commands.nativeSkills`: увімкнути/вимкнути нативні команди Skills у Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (за замовчуванням: `off`).
- `channels.telegram.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.telegram.chunkMode`: `length` (за замовчуванням) або `newline`, щоб ділити за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.telegram.linkPreview`: перемикач попереднього перегляду посилань для вихідних повідомлень (за замовчуванням: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (потоковий live preview; за замовчуванням: `partial`; `progress` зіставляється з `partial`; `block` — сумісність із застарілим режимом preview). Потоковий preview у Telegram використовує одне повідомлення preview, яке редагується на місці.
- `channels.telegram.mediaMaxMb`: обмеження медіа Telegram для вхідних/вихідних даних (МБ, за замовчуванням: 100).
- `channels.telegram.retry`: політика повторних спроб для допоміжних функцій надсилання Telegram (CLI/tools/actions) у разі відновлюваних вихідних помилок API (`attempts`, `minDelayMs`, `maxDelayMs`, `jitter`).
- `channels.telegram.network.autoSelectFamily`: перевизначити Node autoSelectFamily (true=увімкнути, false=вимкнути). За замовчуванням увімкнено в Node 22+, а у WSL2 за замовчуванням вимкнено.
- `channels.telegram.network.dnsResultOrder`: перевизначити порядок результатів DNS (`ipv4first` або `verbatim`). За замовчуванням `ipv4first` у Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: небезпечне явне ввімкнення для довірених середовищ fake-IP або transparent-proxy, де завантаження медіа Telegram резолвлять `api.telegram.org` у приватні/внутрішні/special-use адреси поза типовим дозволеним benchmark-діапазоном RFC 2544.
- `channels.telegram.proxy`: URL proxy для викликів Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: увімкнути режим Webhook (потребує `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: секрет Webhook (обов’язковий, коли задано webhookUrl).
- `channels.telegram.webhookPath`: локальний шлях Webhook (за замовчуванням `/telegram-webhook`).
- `channels.telegram.webhookHost`: локальний хост прив’язки Webhook (за замовчуванням `127.0.0.1`).
- `channels.telegram.webhookPort`: локальний порт прив’язки Webhook (за замовчуванням `8787`).
- `channels.telegram.actions.reactions`: керувальний перемикач для реакцій інструментів Telegram.
- `channels.telegram.actions.sendMessage`: керувальний перемикач для надсилання повідомлень інструментами Telegram.
- `channels.telegram.actions.deleteMessage`: керувальний перемикач для видалення повідомлень інструментами Telegram.
- `channels.telegram.actions.sticker`: керувальний перемикач для дій зі стікерами Telegram — надсилання та пошук (за замовчуванням: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — керує тим, які реакції запускають системні події (за замовчуванням: `own`, якщо не задано).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — керує можливістю агента працювати з реакціями (за замовчуванням: `minimal`, якщо не задано).
- `channels.telegram.errorPolicy`: `reply | silent` — керує поведінкою відповідей з помилками (за замовчуванням: `reply`). Підтримуються перевизначення для окремих облікових записів/груп/тем.
- `channels.telegram.errorCooldownMs`: мінімальна кількість мс між відповідями з помилками в одному й тому самому чаті (за замовчуванням: `60000`). Запобігає спаму помилками під час збоїв.

- [Довідник конфігурації - Telegram](/uk/gateway/configuration-reference#telegram)

Специфічні для Telegram поля з високою цінністю сигналу:

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневий `bindings[]` (`type: "acp"`)
- підтвердження exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- потокове виведення: `streaming` (preview), `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
