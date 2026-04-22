---
read_when:
    - Робота з функціями Telegram або Webhook
summary: Статус підтримки Telegram-бота, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-04-22T22:50:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76ce8e1a588a0666501c907ced9e54de12add0255dfbbd9a3487cc8b630e870f
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Статус: готовий до production для DM ботів і груп через grammY. Довге опитування є режимом за замовчуванням; режим Webhook є необов’язковим.

<CardGroup cols={3}>
  <Card title="Зв’язування" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — зв’язування.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що хендл точно `@BotFather`).

    Виконайте `/newbot`, дотримуйтесь підказок і збережіть токен.

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

    Резервне значення через змінну середовища: `TELEGRAM_BOT_TOKEN=...` (лише для типового облікового запису).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди зв’язування дійсні протягом 1 години.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення з config мають пріоритет над резервним значенням із середовища, а `TELEGRAM_BOT_TOKEN` застосовується лише до типового облікового запису.
</Note>

## Ізоляція сесій

DM Telegram-бота використовують ключі сесій відправника для кожного облікового запису, наприклад
`agent:main:telegram:default:direct:814912386`. Це зберігає окрему політику інструментів і sandbox для Telegram-походження
від основної сесії агента, навіть коли глобальне
налаштування `session.dmScope` має значення `main`.

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Для ботів Telegram за замовчуванням увімкнено **Privacy Mode**, що обмежує, які повідомлення в групах вони отримують.

    Якщо бот має бачити всі повідомлення в групі, зробіть одне з такого:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму приватності видаліть бота й додайте його знову в кожній групі, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи в групі">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення в групі, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups`, щоб дозволити/заборонити додавання до груп
    - `/setprivacy` для керування видимістю в групах

  </Accordion>
</AccordionGroup>

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен щонайменше один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    `dmPolicy: "allowlist"` із порожнім `allowFrom` блокує всі DM і відхиляється перевіркою config.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися і ваш config містить записи allowlist у вигляді `@username`, виконайте `openclaw doctor --fix`, щоб їх розв’язати (best-effort; потрібен токен Telegram-бота).
    Якщо ви раніше покладалися на файли allowlist зі сховища зв’язування, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у сценаріях allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником віддавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID в `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх схвалень зв’язування).

    Поширена плутанина: схвалення DM-зв’язування не означає, що «цей відправник авторизований скрізь».
    Зв’язування надає доступ лише до DM. Авторизація відправників у групах усе ще походить із явних allowlist у config.
    Якщо ви хочете, щоб «я був авторизований один раз і працювали і DM, і команди в групі», додайте свій числовий ID користувача Telegram до `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Виконайте `openclaw logs --follow`.
    3. Зчитайте `from.id`.

    Офіційний метод Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній метод (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два механізми контролю:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи в `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не вказано, Telegram використовує `allowFrom` як резервне значення.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не вказуйте ID Telegram-груп або супергруп у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): авторизація відправників у групах **не** успадковує схвалення зі сховища DM-зв’язування.
    Зв’язування лишається лише для DM. Для груп налаштуйте `groupAllowFrom` або `allowFrom` на рівні групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує резервне значення з config `allowFrom`, а не сховище зв’язування.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, не задавайте `groupAllowFrom`, і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка про runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням використовує fail-closed `groupPolicy="allowlist"`, якщо тільки `channels.defaults.groupPolicy` не задано явно.

    Приклад: дозволити будь-якого учасника в одній конкретній групі:

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

    Приклад: дозволити лише конкретних користувачів в одній конкретній групі:

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
      Поширена помилка: `groupAllowFrom` — це не allowlist Telegram-груп.

      - Вказуйте від’ємні ID Telegram-груп або супергруп, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Вказуйте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, якщо хочете обмежити, які люди всередині дозволеної групи можуть активувати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише якщо хочете, щоб будь-який учасник дозволеної групи міг говорити з ботом.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадування">
    Відповіді в групах за замовчуванням потребують згадування.

    Згадування може надходити з:

    - нативного згадування `@botusername`, або
    - шаблонів згадування в:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для збереження використовуйте config.

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

    - перешліть повідомлення з групи до `@userinfobot` / `@getidsbot`
    - або зчитайте `chat.id` з `openclaw logs --follow`
    - або перегляньте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні відповіді з Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються до спільної channel envelope з метаданими відповіді та заповнювачами медіа.
- Групові сесії ізольовані за ID групи. Для форумних тем додається `:topic:<threadId>`, щоб теми були ізольовані.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw маршрутизує їх з thread-aware ключами сесії та зберігає ID потоку для відповідей.
- Довге опитування використовує grammY runner із послідовністю на рівні чату/потоку. Загальна конкурентність sink у runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски watchdog для long polling спрацьовують після 120 секунд без завершеної перевірки живучості `getUpdates` за замовчуванням. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще трапляються хибні перезапуски через зависання polling під час довготривалої роботи. Значення задається в мілісекундах і допускається в межах від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує квитанції про прочитання (`sendReadReceipts` не застосовується).

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд потокової передачі в реальному часі (редагування повідомлень)">
    OpenClaw може передавати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` у Telegram відображається як `partial` (сумісність із міжканальним найменуванням)
    - `streaming.preview.toolProgress` керує тим, чи перевикористовують оновлення інструментів/прогресу те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`). Встановіть `false`, щоб зберігати окремі повідомлення інструментів/прогресу.
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` автоматично відображаються

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, з медіавмістом) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Потоковий попередній перегляд відокремлений від block streaming. Коли для Telegram явно ввімкнено block streaming, OpenClaw пропускає потоковий попередній перегляд, щоб уникнути подвійного стримінгу.

    Якщо нативний транспорт чернеток недоступний або відхиляється, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік reasoning лише для Telegram:

    - `/reasoning stream` надсилає reasoning до попереднього перегляду в реальному часі під час генерації
    - фінальна відповідь надсилається без тексту reasoning

  </Accordion>

  <Accordion title="Форматування та резервний режим HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться у безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити збої парсингу в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено за замовчуванням і його можна вимкнути через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та власні команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Типові значення для нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте власні записи до меню команд:

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

    - назви нормалізуються (забирається початковий `/`, перетворення до нижнього регістру)
    - коректний шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - власні команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та журналюються

    Примітки:

    - власні команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills усе одно можуть працювати при ручному введенні, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнено, вбудовані видаляються. Власні команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Типові збої налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після скорочення; зменште кількість команд Plugin/Skills/власних команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` із помилками мережі/fetch зазвичай означає, що вихідні DNS/HTTPS-з’єднання до `api.telegram.org` заблоковані.

    ### Команди зв’язування пристроїв (`device-pair` Plugin)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список очікуваних запитів (включно з роллю/scopes)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один очікуваний запит
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap-токен. Вбудована передача bootstrap зберігає токен первинного Node на рівні `scopes: []`; будь-який переданий токен оператора лишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scope мають префікс ролі, тож цей allowlist оператора задовольняє лише запити оператора; ролі, що не є operator, усе ще потребують scopes під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними автентифікації (наприклад, роль/scopes/публічний ключ), попередній очікуваний запит замінюється, а новий запит отримує інший `requestId`. Перед схваленням знову виконайте `/pair pending`.

    Докладніше: [Зв’язування](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Застаріле `capabilities: ["inlineButtons"]` відображається як `inlineButtons: "all"`.

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

  <Accordion title="Дії повідомлень Telegram для агентів та автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язкові `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язкові `iconColor`, `iconCustomEmojiId`)

    Дії channel message надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керувальні параметри:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` зараз увімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання в runtime використовує активний знімок config/secrets (startup/reload), тому шляхи дій не виконують ad-hoc повторне визначення `SecretRef` для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке ініціювало запит
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Примітка: `off` вимикає неявне прив’язування відповідей до потоку. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Форумні теми та поведінка потоків">
    Форумні супергрупи:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор набору спрямовуються в потік теми
    - шлях config теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Особливий випадок загальної теми (`threadId=1`):

    - надсилання повідомлень не містить `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії індикатора набору все одно містять `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` належить лише темі й не успадковується з типових налаштувань групи.

    **Маршрутизація агентів для окремих тем**: Кожна тема може маршрутизуватися до іншого агента, якщо задати `agentId` у config теми. Це надає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → агент main
                "3": { agentId: "zu" },        // Тема розробки → агент zu
                "5": { agentId: "coder" }      // Рев’ю коду → агент coder
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійне прив’язування тем ACP**: Форумні теми можуть закріплювати сесії ACP harness через типізовані ACP bindings верхнього рівня:

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

    Зараз це обмежено форумними темами в групах і супергрупах.

    **ACP spawn, прив’язаний до потоку, з чату**:

    - `/acp spawn <agent> --thread here|auto` може прив’язати поточну тему Telegram до нової сесії ACP.
    - Подальші повідомлення в темі маршрутизуються безпосередньо до прив’язаної сесії ACP (без потреби в `/acp steer`).
    - Після успішного прив’язування OpenClaw закріплює повідомлення-підтвердження spawn у темі.
    - Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону включає:

    - `MessageThreadId`
    - `IsForum`

    Поведінка DM-потоків:

    - приватні чати з `message_thread_id` зберігають маршрутизацію DM, але використовують thread-aware ключі сесії/цілі відповідей.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає як голосову нотатку

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

    Telegram розрізняє відеофайли та відеонотатки.

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

    Відеонотатки не підтримують підписи; наданий текст повідомлення надсилається окремо.

    ### Стікери

    Обробка вхідних стікерів:

    - статичний WEBP: завантажується й обробляється (заповнювач `<media:sticker>`)
    - анімований TGS: пропускається
    - відео WEBM: пропускається

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
  query: "кіт махає лапою",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисного навантаження повідомлень).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно підпорядковуються контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID потоку в оновленнях реакцій.
      - нефорумні групи маршрутизуються до сесії групового чату
      - форумні групи маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точного початкового топіка

    `allowed_updates` для polling/webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервне значення emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує unicode-emoji (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи config з подій і команд Telegram">
    Записи в config каналу ввімкнені за замовчуванням (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції групи (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
    - `/config set` і `/config unset` (потрібно ввімкнення команд)

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
    - задайте `channels.telegram.webhookSecret` (обов’язково, коли задано webhook URL)
    - необов’язково `channels.telegram.webhookPath` (за замовчуванням `/telegram-webhook`)
    - необов’язково `channels.telegram.webhookHost` (за замовчуванням `127.0.0.1`)
    - необов’язково `channels.telegram.webhookPort` (за замовчуванням `8787`)

    Типовий локальний listener для режиму Webhook прив’язується до `127.0.0.1:8787`.

    Якщо ваш публічний endpoint відрізняється, розмістіть перед ним reverse proxy і вкажіть `webhookUrl` на публічний URL.
    Задайте `webhookHost` (наприклад, `0.0.0.0`), коли вам свідомо потрібен зовнішній вхідний доступ.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` віддає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає timeout клієнта Telegram API (якщо не задано, застосовується типовий timeout grammY).
    - `channels.telegram.pollingStallThresholdMs` має типове значення `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає.
    - додатковий контекст reply/quote/forward наразі передається як отримано.
    - allowlist Telegram насамперед керують тим, хто може активувати агента, а не є повною межею редагування додаткового контексту.
    - параметри історії DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціллю CLI send може бути числовий ID чату або username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Опитування Telegram використовують `openclaw message poll` і підтримують форумні теми:

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
    - `--thread-id` для форумних тем (або використовуйте ціль `:topic:`)

    Telegram send також підтримує:

    - `--presentation` з блоками `buttons` для вбудованих клавіатур, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'`, щоб запитати закріплену доставку, коли бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Схвалення exec у Telegram">
    Telegram підтримує схвалення exec у DM схвалювачів і за потреби може публікувати запити на схвалення у вихідному чаті або темі.

    Шлях config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (необов’язково; як резервне значення використовуються числові ID власників, виведені з `allowFrom` і прямого `defaultTo`, коли це можливо)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`

    Схвалювачі мають бути числовими ID користувачів Telegram. Telegram автоматично вмикає нативні схвалення exec, коли `enabled` не задано або має значення `"auto"` і вдається визначити хоча б одного схвалювача — або з `execApprovals.approvers`, або з числової config власника облікового запису (`allowFrom` і DM `defaultTo`). Задайте `enabled: false`, щоб явно вимкнути Telegram як нативний клієнт схвалення. Інакше запити на схвалення повертаються до інших налаштованих маршрутів схвалення або до резервної політики схвалення exec.

    Telegram також рендерить спільні кнопки схвалення, які використовуються іншими чат-каналами. Нативний адаптер Telegram головно додає маршрутизацію DM схвалювачів, fanout у канал/тему та підказки набору перед доставкою.
    Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що схвалення в чаті недоступні або ручне схвалення — єдиний шлях.

    Правила доставки:

    - `target: "dm"` надсилає запити на схвалення лише в DM визначених схвалювачів
    - `target: "channel"` надсилає запит назад у вихідний чат/тему Telegram
    - `target: "both"` надсилає і в DM схвалювачів, і у вихідний чат/тему

    Лише визначені схвалювачі можуть схвалювати або відхиляти. Не-схвалювачі не можуть використовувати `/approve` і не можуть використовувати кнопки схвалення Telegram.

    Поведінка визначення схвалення:

    - ID з префіксом `plugin:` завжди визначаються через схвалення Plugin.
    - Інші ID спершу пробують `exec.approval.resolve`.
    - Якщо Telegram також авторизовано для схвалень Plugin і gateway повідомляє,
      що схвалення exec невідоме/прострочене, Telegram ще раз пробує через
      `plugin.approval.resolve`.
    - Справжні відмови/помилки схвалення exec не переходять мовчки до
      визначення схвалення Plugin.

    Доставка в channel показує текст команди в чаті, тому вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє у форумну тему, OpenClaw зберігає тему і для запиту на схвалення, і для подальшого повідомлення після схвалення. За замовчуванням схвалення exec спливають через 30 хвилин.

    Вбудовані кнопки схвалення також залежать від того, чи `channels.telegram.capabilities.inlineButtons` дозволяє цільову поверхню (`dm`, `group` або `all`).

    Пов’язана документація: [Схвалення exec](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або постачальника, Telegram може або відповісти текстом помилки, або придушити її. Цю поведінку контролюють два ключі config:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає до чату дружнє повідомлення про помилку. `silent` повністю пригнічує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями про помилки в одному чаті. Запобігає спаму помилок під час збоїв.        |

Підтримуються перевизначення для окремого облікового запису, групи й теми (те саме успадкування, що й для інших ключів config Telegram).

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
  <Accordion title="Бот не відповідає на повідомлення в групі без згадування">

    - Якщо `requireMention=false`, режим приватності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть і знову додайте бота до групи
    - `openclaw channels status` попереджає, коли config очікує повідомлення групи без згадування.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити на членство через probe.
    - швидка перевірка сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот узагалі не бачить повідомлень у групі">

    - коли існує `channels.telegram.groups`, групу треба вказати в списку (або включити `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow`, щоб побачити причини пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або взагалі не працюють">

    - авторизуйте свою ідентичність відправника (зв’язування та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи має значення `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд Plugin/Skills/власних команд або вимкніть нативні меню
    - `setMyCommands failed` із помилками мережі/fetch зазвичай вказує на проблеми з доступністю DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + власний fetch/proxy може спричиняти негайне скасування, якщо типи AbortSignal не збігаються.
    - Деякі хости спершу визначають `api.telegram.org` у IPv6; несправний вихідний IPv6 може спричиняти переривчасті збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює такі випадки як відновлювані мережеві помилки.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної перевірки живучості long-poll за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` є здоровими, але ваш хост усе ще повідомляє про хибні перезапуски через зависання polling. Стійкі зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або TLS-виходу між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим виходом/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Для Node 22+ типовими є `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює в режимі лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону RFC 2544 benchmark (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/special-use адресу під час завантаження медіа, ви можете
      увімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне для окремого облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy визначає медіахости Telegram у `198.18.x.x`, спершу залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяють діапазон RFC 2544
      benchmark за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захисти SSRF
      для медіа Telegram. Використовуйте це лише для довірених керованих оператором proxy-середовищ,
      як-от fake-IP маршрутизація Clash, Mihomo або Surge, коли вони
      синтезують приватні або special-use відповіді поза діапазоном RFC 2544 benchmark.
      Для звичайного доступу до Telegram через публічний інтернет залишайте це вимкненим.
    </Warning>

    - Перевизначення через середовище (тимчасові):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Перевірка DNS-відповідей:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Більше допомоги: [Усунення проблем із каналами](/uk/channels/troubleshooting).

## Вказівники на довідник config Telegram

Основний довідник:

- `channels.telegram.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.telegram.botToken`: токен бота (BotFather).
- `channels.telegram.tokenFile`: читати токен зі шляху до звичайного файлу. Символічні посилання відхиляються.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.telegram.allowFrom`: allowlist для DM (числові ID користувачів Telegram). `allowlist` вимагає щонайменше один ID відправника. `open` вимагає `"*"`. `openclaw doctor --fix` може розв’язати застарілі записи `@username` до ID і може відновити записи allowlist із файлів pairing-store у сценаріях міграції allowlist.
- `channels.telegram.actions.poll`: увімкнути або вимкнути створення опитувань Telegram (за замовчуванням: увімкнено; все одно потрібен `sendMessage`).
- `channels.telegram.defaultTo`: типова ціль Telegram, яку використовує CLI `--deliver`, коли явний `--reply-to` не задано.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist відправників у групах (числові ID користувачів Telegram). `openclaw doctor --fix` може розв’язати застарілі записи `@username` до ID. Нечислові записи ігноруються під час авторизації. Авторизація груп не використовує резервне значення зі сховища DM pairing (`2026.2.25+`).
- Пріоритет для кількох облікових записів:
  - Коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити типову маршрутизацію.
  - Якщо не задано жодного з них, OpenClaw використовує перший нормалізований ID облікового запису як резервне значення, а `openclaw doctor` показує попередження.
  - `channels.telegram.accounts.default.allowFrom` і `channels.telegram.accounts.default.groupAllowFrom` застосовуються лише до облікового запису `default`.
  - Іменовані облікові записи успадковують `channels.telegram.allowFrom` і `channels.telegram.groupAllowFrom`, коли значення на рівні облікового запису не задані.
  - Іменовані облікові записи не успадковують `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: типові значення для груп + allowlist (використовуйте `"*"` для глобальних типових значень).
  - `channels.telegram.groups.<id>.groupPolicy`: перевизначення `groupPolicy` для окремої групи (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: типове керування обов’язковістю згадування.
  - `channels.telegram.groups.<id>.skills`: фільтр Skills (не вказано = усі Skills, порожньо = жодного).
  - `channels.telegram.groups.<id>.allowFrom`: перевизначення allowlist відправників для окремої групи.
  - `channels.telegram.groups.<id>.systemPrompt`: додатковий системний prompt для групи.
  - `channels.telegram.groups.<id>.enabled`: вимикає групу, коли `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: перевизначення для окремої теми (поля групи + лише для теми `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: маршрутизує цю тему до конкретного агента (перевизначає маршрутизацію рівня групи та binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: перевизначення `groupPolicy` для окремої теми (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: перевизначення обов’язковості згадування для окремої теми.
- верхньорівневі `bindings[]` з `type: "acp"` і канонічним ID теми `chatId:topic:topicId` у `match.peer.id`: поля постійного прив’язування тем ACP (див. [ACP Agents](/uk/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: маршрутизує теми DM до конкретного агента (та сама поведінка, що й для форумних тем).
- `channels.telegram.execApprovals.enabled`: увімкнути Telegram як клієнт схвалення exec на основі чату для цього облікового запису.
- `channels.telegram.execApprovals.approvers`: ID користувачів Telegram, яким дозволено схвалювати або відхиляти запити exec. Необов’язково, якщо `channels.telegram.allowFrom` або прямий `channels.telegram.defaultTo` вже ідентифікує власника.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (за замовчуванням: `dm`). `channel` і `both` зберігають вихідну тему Telegram, якщо вона є.
- `channels.telegram.execApprovals.agentFilter`: необов’язковий фільтр ID агента для пересланих запитів на схвалення.
- `channels.telegram.execApprovals.sessionFilter`: необов’язковий фільтр ключа сесії (підрядок або regex) для пересланих запитів на схвалення.
- `channels.telegram.accounts.<account>.execApprovals`: перевизначення маршрутизації схвалення exec Telegram та авторизації схвалювачів для окремого облікового запису.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (за замовчуванням: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: перевизначення для окремого облікового запису.
- `channels.telegram.commands.nativeSkills`: увімкнути/вимкнути нативні команди Skills у Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (за замовчуванням: `off`).
- `channels.telegram.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.telegram.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.telegram.linkPreview`: перемикач попереднього перегляду посилань для вихідних повідомлень (за замовчуванням: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (потоковий попередній перегляд у реальному часі; за замовчуванням: `partial`; `progress` відображається як `partial`; `block` — сумісність із застарілим режимом попереднього перегляду). Потоковий попередній перегляд у Telegram використовує одне повідомлення попереднього перегляду, яке редагується на місці.
- `channels.telegram.streaming.preview.toolProgress`: повторно використовувати повідомлення потокового попереднього перегляду для оновлень tool/progress, коли потоковий попередній перегляд активний (за замовчуванням: `true`). Задайте `false`, щоб залишити окремі повідомлення tool/progress.
- `channels.telegram.mediaMaxMb`: обмеження розміру вхідних/вихідних медіа Telegram (МБ, за замовчуванням: 100).
- `channels.telegram.retry`: політика повторних спроб для допоміжних функцій надсилання Telegram (CLI/tools/actions) у разі відновлюваних вихідних помилок API (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: перевизначити Node autoSelectFamily (true=увімкнути, false=вимкнути). За замовчуванням увімкнено в Node 22+, а в WSL2 за замовчуванням вимкнено.
- `channels.telegram.network.dnsResultOrder`: перевизначити порядок результатів DNS (`ipv4first` або `verbatim`). У Node 22+ за замовчуванням `ipv4first`.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: небезпечне явне ввімкнення для довірених середовищ fake-IP або transparent-proxy, де завантаження медіа Telegram визначають `api.telegram.org` у приватні/внутрішні/special-use адреси поза типовим дозволеним діапазоном RFC 2544 benchmark.
- `channels.telegram.proxy`: URL proxy для викликів Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: увімкнути режим Webhook (потрібен `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: секрет Webhook (обов’язковий, коли задано webhookUrl).
- `channels.telegram.webhookPath`: локальний шлях Webhook (за замовчуванням `/telegram-webhook`).
- `channels.telegram.webhookHost`: локальний хост прив’язування Webhook (за замовчуванням `127.0.0.1`).
- `channels.telegram.webhookPort`: локальний порт прив’язування Webhook (за замовчуванням `8787`).
- `channels.telegram.actions.reactions`: керування реакціями інструментів Telegram.
- `channels.telegram.actions.sendMessage`: керування надсиланням повідомлень інструментів Telegram.
- `channels.telegram.actions.deleteMessage`: керування видаленням повідомлень інструментів Telegram.
- `channels.telegram.actions.sticker`: керування діями зі стікерами Telegram — надсиланням і пошуком (за замовчуванням: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — керує тим, які реакції запускають системні події (за замовчуванням: `own`, якщо не задано).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — керує можливостями реакцій агента (за замовчуванням: `minimal`, якщо не задано).
- `channels.telegram.errorPolicy`: `reply | silent` — керує поведінкою відповідей про помилки (за замовчуванням: `reply`). Підтримуються перевизначення для окремого облікового запису/групи/теми.
- `channels.telegram.errorCooldownMs`: мінімальна кількість мс між відповідями про помилки в одному чаті (за замовчуванням: `60000`). Запобігає спаму помилок під час збоїв.

- [Довідник конфігурації - Telegram](/uk/gateway/configuration-reference#telegram)

Поля Telegram із високою інформаційною цінністю:

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневі `bindings[]` (`type: "acp"`)
- схвалення exec: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- streaming: `streaming` (попередній перегляд), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Пов’язане

- [Зв’язування](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
