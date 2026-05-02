---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки, можливості та конфігурація бота Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-02T10:09:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

Готово для продакшн-використання в DM бота та групах через grammY. Довге опитування є типовим режимом; режим Webhook необов’язковий.

<CardGroup cols={3}>
  <Card title="Спарювання" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — спарювання.
  </Card>
  <Card title="Усунення проблем каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з виправлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що ім’я точно `@BotFather`).

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

    Резервний варіант через змінну середовища: `TELEGRAM_BOT_TOKEN=...` (лише типовий обліковий запис).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у конфігурації/змінних середовища, потім запустіть Gateway.

  </Step>

  <Step title="Запустіть Gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди спарювання спливають через 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення з конфігурації мають перевагу над резервною змінною середовища, а `TELEGRAM_BOT_TOKEN` застосовується лише до типового облікового запису.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Боти Telegram типово використовують **режим приватності**, який обмежує, які групові повідомлення вони отримують.

    Якщо бот має бачити всі групові повідомлення, зробіть одне з такого:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму приватності видаліть і повторно додайте бота в кожній групі, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі групові повідомлення, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups`, щоб дозволити/заборонити додавання до груп
    - `/setprivacy` для поведінки видимості в групах

  </Accordion>
</AccordionGroup>

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (типово)
    - `allowlist` (потрібен щонайменше один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дозволяє будь-якому обліковому запису Telegram, який знайде або вгадає ім’я користувача бота, керувати ботом. Використовуйте це лише для навмисно публічних ботів із жорстко обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими ID користувачів.

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний `channels.telegram.allowFrom` верхнього рівня вважається межею безпеки: записи рівня облікового запису `allowFrom: ["*"]` не роблять цей обліковий запис публічним, якщо ефективний список дозволених облікового запису після об’єднання все ще не містить явний wildcard.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється перевіркою конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися й ваша конфігурація містить записи `@username` у списку дозволених, запустіть `openclaw doctor --fix`, щоб розв’язати їх (найкраща спроба; потрібен токен бота Telegram).
    Якщо раніше ви покладалися на файли списку дозволених зі сховища спарювання, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником віддавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу була сталою в конфігурації (замість залежності від попередніх схвалень спарювання).

    Поширена плутанина: схвалення спарювання DM не означає «цей відправник авторизований усюди».
    Спарювання надає доступ до DM. Якщо власника команд ще немає, перше схвалене спарювання також задає `commands.ownerAllowFrom`, щоб команди лише для власника та схвалення exec мали явний обліковий запис оператора.
    Авторизація відправників у групах усе ще походить із явних списків дозволених у конфігурації.
    Якщо ви хочете «я авторизований один раз, і працюють і DM, і групові команди», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

    ### Як знайти свій ID користувача Telegram

    Безпечніше (без стороннього бота):

    1. Напишіть своєму боту в DM.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній метод (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і списки дозволених">
    Два елементи керування застосовуються разом:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає конфігурації `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (типово): групи заблоковані, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: працює як список дозволених (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (типово)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): автентифікація відправника в групі **не** успадковує схвалення зі сховища спарювання DM.
    Спарювання залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` на рівні групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до конфігураційного `allowFrom`, а не до сховища спарювання.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime типово закривається безпечно з `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` не задано явно.

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
      Поширена помилка: `groupAllowFrom` не є списком дозволених груп Telegram.

      - Додавайте від’ємні ID чатів груп або супергруп Telegram, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть запускати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.

    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Відповіді в групах типово потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сеансу:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сеансу. Використовуйте конфігурацію для збереження.

    Приклад сталої конфігурації:

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

    Отримання ID групового чату:

    - перешліть групове повідомлення до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перевірте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу Gateway.
- Маршрутизація детермінована: вхідні Telegram-відповіді повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільну оболонку каналу з метаданими відповіді та заповнювачами медіа.
- Групові сеанси ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw зберігає ID потоку для відповідей, але типово тримає DM у пласкому сеансі. Налаштуйте `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` або відповідну конфігурацію теми, коли ви навмисно хочете ізоляцію сеансів тем у DM.
- Довге опитування використовує grammY runner із послідовністю на рівні чату/потоку. Загальна конкурентність sink runner використовує `agents.defaults.maxConcurrent`.
- Довге опитування захищене всередині кожного процесу Gateway, тож лише один активний poller може використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, інший Gateway OpenClaw, скрипт або зовнішній poller, імовірно, використовує той самий токен.
- Перезапуски watchdog для довгого опитування типово запускаються після 120 секунд без завершеної liveness-перевірки `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні перезапуски через polling-stall під час тривалої роботи. Значення задається в мілісекундах і дозволене від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує сповіщення про прочитання (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (типово: `partial`)
    - `progress` відображається на `partial` у Telegram (сумісність із міжканальним іменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме відредаговане повідомлення попереднього перегляду (типово: `true`, коли активне потокове передавання попереднього перегляду)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; запустіть `openclaw doctor --fix`, щоб перенести їх у `channels.telegram.streaming.mode`

    Оновлення попереднього перегляду прогресу інструментів — це короткі рядки "Working...", які показуються під час виконання інструментів, наприклад виконання команд, читання файлів, оновлення планування або підсумки патчів. Telegram залишає їх увімкненими типово, щоб відповідати випущеній поведінці OpenClaw від `v2026.4.22` і пізніше. Щоб залишити відредагований попередній перегляд для тексту відповіді, але приховати рядки прогресу інструментів, задайте:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Використовуйте `streaming.mode: "off"` лише тоді, коли потрібна доставка тільки фінальної відповіді: редагування попереднього перегляду Telegram вимикаються, а загальні повідомлення про інструменти/прогрес приглушуються замість надсилання як окремих повідомлень "Working...". Запити на схвалення, медіа-вміст і помилки все ще проходять через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли потрібно лише зберегти редагування попереднього перегляду відповіді, приховавши рядки статусу прогресу інструментів.

    Для відповідей лише з текстом:

    - короткі попередні перегляди в DM/групі/темі: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці
    - попередні перегляди, старші приблизно за одну хвилину: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення, а потім прибирає попередній перегляд, тож видима мітка часу Telegram відображає час завершення замість часу створення попереднього перегляду

    Для складних відповідей (наприклад, медіа-вмісту) OpenClaw повертається до звичайної фінальної доставки, а потім прибирає повідомлення попереднього перегляду.

    Потоковий попередній перегляд відокремлений від блокового потокового передавання. Коли блокове потокове передавання явно ввімкнено для Telegram, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в живий попередній перегляд під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown відтворюється як безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок парсингу Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередні перегляди посилань увімкнені за замовчуванням, і їх можна вимкнути за допомогою `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди й користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску за допомогою `setMyCommands`.

    Типові значення нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте користувацькі записи меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Правила:

    - назви нормалізуються (прибирається початковий `/`, нижній регістр)
    - дійсний шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються й записуються в журнал

    Примітки:

    - користувацькі команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди plugin/skill усе ще можуть працювати, коли їх вводять, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Користувацькі/Plugin-команди все ще можуть реєструватися, якщо налаштовані.

    Поширені збої налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнювалося після обрізання; зменште кількість команд plugin/skill/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - Збій `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, коли прямі команди curl Bot API працюють, може означати, що `channels.telegram.apiRoot` було задано як повну кінцеву точку `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється до polling, тому це не повідомляється як збій очищення webhook.
    - `setMyCommands failed` з мережевими/fetch-помилками зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблоковано.

    ### Команди сполучення пристроїв (`device-pair` plugin)

    Коли встановлено `device-pair` plugin:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує очікувані запити (включно з роллю/областями)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один очікуваний запит
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap-токен. Вбудована передача bootstrap зберігає основний токен вузла на `scopes: []`; будь-який переданий токен оператора залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки областей bootstrap мають префікс ролі, тому цей allowlist оператора задовольняє лише запити оператора; ролям, що не є операторами, все ще потрібні області під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними автентифікації (наприклад, роль/області/публічний ключ), попередній очікуваний запит замінюється, а новий запит використовує інший `requestId`. Повторно виконайте `/pair pending` перед схваленням.

    Докладніше: [Сполучення](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Вбудовані кнопки">
    Налаштуйте область вбудованої клавіатури:

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

    Області:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (за замовчуванням)

    Застаріле `capabilities: ["inlineButtons"]` відображається на `inlineButtons: "all"`.

    Приклад дії повідомлення:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Натискання callback передаються агенту як текст:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Дії повідомлень Telegram для агентів і автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язково `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язково `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Елементи керування обмеженнями:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час виконання використовують активний знімок конфігурації/секретів (запуск/перезавантаження), тому шляхи дій не виконують ad-hoc повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, що запустило обробку
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Коли потоки відповідей увімкнені й доступний оригінальний текст або підпис Telegram, OpenClaw автоматично додає нативний уривок цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються з початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявні потоки відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форуму:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді й набір тексту спрямовуються в потік теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень не включає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все ще включають `message_thread_id`

    Успадкування теми: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` належить лише темі й не успадковується зі стандартних налаштувань групи.

    **Маршрутизація агентів за темами**: кожна тема може маршрутизуватися до іншого агента через налаштування `agentId` у конфігурації теми. Це надає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Кожна тема після цього має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійна прив’язка тем ACP**: теми форуму можуть закріплювати сесії ACP harness через типізовані прив’язки ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та topic-qualified id на кшталт `-1001234567890:topic:42`). Наразі обмежено темами форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Прив’язаний до потоку ACP spawn із чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди напряму. OpenClaw закріплює підтвердження spawn у темі. Потрібно, щоб `channels.telegram.threadBindings.spawnSessions` залишалося ввімкненим (за замовчуванням: `true`).

    Контекст шаблону надає `MessageThreadId` і `IsForum`. Чати DM з `message_thread_id` за замовчуванням зберігають маршрутизацію DM і метадані відповіді у пласких сесіях; вони використовують thread-aware ключі сесій лише тоді, коли налаштовані з `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` або відповідною конфігурацією теми. Використовуйте верхньорівневий `channels.telegram.dm.threadReplies` як стандартне значення для облікового запису або `direct.<chatId>.threadReplies` для одного DM.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента, щоб примусово надіслати голосову нотатку
    - транскрипти вхідних голосових нотаток оформлюються як машинно згенерований,
      ненадійний текст у контексті агента; виявлення згадок усе ще використовує сирий
      транскрипт, тому voice-повідомлення з gate за згадкою продовжують працювати.

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

    - статичний WEBP: завантажується й обробляється (placeholder `<media:sticker>`)
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

    Стікери описуються один раз (коли можливо) і кешуються, щоб зменшити повторні vision-виклики.

    Увімкніть дії зі стікерами:

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

    Надіслати дію зі стікером:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Шукати кешовані стікери:

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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисного навантаження повідомлень).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (за найкращою можливістю через кеш надісланих повідомлень).
    - Події реакцій усе одно враховують засоби контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID тредів в оновленнях реакцій.
      - групи нефорумного типу спрямовуються до сеансу групового чату
      - форумні групи спрямовуються до сеансу загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для опитування/Webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує Unicode-емодзі (наприклад "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнено типово (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції груп (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
    - `/config set` і `/config unset` (потрібне ввімкнення команд)

    Вимкнути:

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

  <Accordion title="Довге опитування проти Webhook">
    Типово використовується довге опитування. Для режиму Webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов'язкові `webhookPath`, `webhookHost`, `webhookPort` (типові значення: `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний слухач прив'язується до `127.0.0.1:8787`. Для публічного входу або поставте reverse proxy перед локальним портом, або навмисно задайте `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє запобіжники запиту, секретний токен Telegram і JSON-тіло перед поверненням `200` до Telegram.
    Потім OpenClaw обробляє оновлення асинхронно через ті самі ботові лінії для кожного чату/теми, які використовуються довгим опитуванням, тому повільні ходи агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` віддає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується типове значення grammY). Ботові клієнти обмежують налаштовані значення нижче 60-секундного запобіжника для вихідних текстових/typing-запитів, щоб grammY не переривав доставку видимої відповіді до того, як зможуть спрацювати транспортний запобіжник OpenClaw і резервний механізм. Довге опитування й далі використовує 45-секундний запобіжник запиту `getUpdates`, щоб неактивні опитування не зависали безстроково.
    - `channels.telegram.pollingStallThresholdMs` типово дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання опитування.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає.
    - додатковий контекст reply/quote/forward наразі передається як отримано.
    - allowlist Telegram насамперед обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Елементи керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до допоміжних засобів надсилання Telegram (CLI/інструменти/дії) для відновлюваних помилок вихідного API. Доставка фінальної вхідної відповіді також використовує обмежену безпечну повторну спробу надсилання для збоїв Telegram до підключення, але не повторює неоднозначні мережеві оболонки після надсилання, які можуть дублювати видимі повідомлення.

    Ціль надсилання CLI може бути числовим ID чату або іменем користувача:

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

    Надсилання Telegram також підтримує:

    - `--presentation` з блоками `buttons` для inline-клавіатур, коли `channels.telegram.capabilities.inlineButtons` це дозволяє
    - `--pin` або `--delivery '{"pin":true}'`, щоб запросити закріплену доставку, коли бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Схвалення exec у Telegram">
    Telegram підтримує схвалення exec у DM затверджувачів і може необов'язково публікувати запити в початковому чаті або темі. Затверджувачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна визначити принаймні одного затверджувача)
    - `channels.telegram.execApprovals.approvers` (резервно використовує числові ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (типово) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` керують тим, хто може спілкуватися з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось затверджувачем exec. Перше схвалене сполучення DM ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тож налаштування з одним власником і далі працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє у форумну тему, OpenClaw зберігає тему для запиту схвалення та подальшого повідомлення. Схвалення exec типово спливають через 30 хвилин.

    Inline-кнопки схвалення також потребують, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID схвалення з префіксом `plugin:` визначаються через схвалення Plugin; інші спершу визначаються через схвалення exec.

    Див. [Схвалення exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Елементи керування відповідями про помилки

Коли агент стикається з помилкою доставки або provider, Telegram може або відповісти текстом помилки, або приховати її. Два ключі конфігурації керують цією поведінкою:

| Ключ                                | Значення          | Типово  | Опис                                                                                                      |
| ----------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю пригнічує відповіді з помилками. |
| `channels.telegram.errorCooldownMs` | число (мс)        | `60000` | Мінімальний час між відповідями з помилками в той самий чат. Запобігає спаму помилками під час збоїв.     |

Підтримуються перевизначення для облікового запису, групи та теми (те саме успадкування, що й для інших ключів конфігурації Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Бот не відповідає на групові повідомлення без згадки">

    - Якщо `requireMention=false`, режим приватності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть і повторно додайте бота до групи
    - `openclaw channels status` попереджає, коли конфігурація очікує групові повідомлення без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити на членство.
    - швидкий тест сеансу: `/activation always`.

  </Accordion>

  <Accordion title="Бот узагалі не бачить групових повідомлень">

    - коли існує `channels.telegram.groups`, група має бути вказана (або містити `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють узагалі">

    - авторизуйте ідентичність свого відправника (сполучення та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато пунктів; зменште кількість Plugin/Skills/користувацьких команд або вимкніть нативні меню
    - стартові виклики `deleteMyCommands` / `setMyCommands` і typing-виклики `sendChatAction` обмежені та повторюються один раз через транспортний резервний механізм Telegram у разі тайм-ауту запиту. Постійні мережеві/fetch-помилки зазвичай вказують на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Під час запуску повідомляється про неавторизований токен">

    - `getMe returned 401` — це збій автентифікації Telegram для налаштованого токена бота.
    - Повторно скопіюйте або згенеруйте токен бота в BotFather, потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для типового облікового запису.
    - `deleteWebhook 401 Unauthorized` під час запуску також є збоєм автентифікації; трактування цього як "Webhook не існує" лише відклало б той самий збій поганого токена до наступних викликів API.
    - Якщо `deleteWebhook` завершується помилкою з тимчасовою мережевою помилкою під час запуску опитування, OpenClaw перевіряє `getWebhookInfo`; коли Telegram повідомляє порожню URL-адресу Webhook, опитування продовжується, оскільки очищення вже задоволене.

  </Accordion>

  <Accordion title="Нестабільність опитування або мережі">

    - Node 22+ + власний fetch/proxy можуть спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спершу розв’язують `api.telegram.org` в IPv6; несправний вихід IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює ці операції як відновлювані мережеві помилки.
    - Якщо сокети Telegram перезапускаються з короткою фіксованою періодичністю, перевірте, чи не замале значення `channels.telegram.timeoutSeconds`; клієнти ботів обмежують налаштовані значення, нижчі за захисні межі вихідних запитів і запитів `getUpdates`, але старіші випуски могли переривати кожне опитування або відповідь, коли це значення було нижчим за ці межі.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає опитування та перебудовує транспорт Telegram після 120 секунд без завершеного long-poll підтвердження працездатності за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис опитування не завершив `getUpdates` після стартового пільгового періоду, коли запущений обліковий запис Webhook не завершив `setWebhook` після стартового пільгового періоду, або коли остання успішна активність транспорту опитування застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе ще повідомляє про хибні перезапуски через зависання опитування. Постійні зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або вихідного TLS між хостом і `api.telegram.org`.
    - Telegram також враховує process proxy env для транспорту Bot API, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти в нижньому регістрі. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища й немає стандартних proxy env, Telegram також використовує цю URL-адресу для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим виходом/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2). Порядок результатів DNS Telegram враховує `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, потім `channels.telegram.network.dnsResultOrder`, потім типовий порядок процесу, наприклад `NODE_OPTIONS=--dns-result-order=ipv4first`; якщо нічого з цього не застосовується, Node 22+ повертається до `ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює лише з IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з benchmark-діапазону RFC 2544 (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий proxy переписує `api.telegram.org` на іншу
      приватну/внутрішню/спеціальну адресу під час завантажень медіа, ви можете
      увімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Така сама опція доступна для кожного облікового запису за адресою
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy розв’язує медіа-хости Telegram у `198.18.x.x`, спершу залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяють benchmark-діапазон
      RFC 2544 за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист медіа Telegram
      від SSRF. Використовуйте це лише в довірених proxy-середовищах під контролем оператора,
      таких як маршрутизація fake-IP у Clash, Mihomo або Surge, коли вони
      синтезують приватні або спеціальні відповіді поза benchmark-діапазоном
      RFC 2544. Не вмикайте це для звичайного доступу Telegram через публічний інтернет.
    </Warning>

    - Перевизначення середовища (тимчасові):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Перевірте DNS-відповіді:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Додаткова довідка: [Усунення несправностей каналів](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="Високосигнальні поля Telegram">

- запуск/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; symlink відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневі `bindings[]` (`type: "acp"`)
- підтвердження exec: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- трансляція: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- власний корінь API: `apiRoot` (лише корінь Bot API; не додавайте `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритет для кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або додайте `channels.telegram.accounts.default`), щоб явно визначити маршрутизацію за замовчуванням. Інакше OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` попереджає про це. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Telegram із gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка allowlist для груп і тем.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Маршрутизація кількох агентів" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте групи й теми з агентами.
  </Card>
  <Card title="Усунення несправностей" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика.
  </Card>
</CardGroup>
