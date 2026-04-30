---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки, можливості та конфігурація бота Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-30T12:42:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5df2a27a801183b2817beca228c41c04f855ef08720f6c7505b49eae22ea303d
    source_path: channels/telegram.md
    workflow: 16
---

Готово до production для DM ботів і груп через grammY. Long polling є режимом за замовчуванням; режим webhook необов’язковий.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — сполучення.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами та сценарії ремонту.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і напишіть **@BotFather** (переконайтеся, що handle саме `@BotFather`).

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

    Резервний env: `TELEGRAM_BOT_TOKEN=...` (лише обліковий запис за замовчуванням).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди сполучення спливають через 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, потім задайте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення config мають пріоритет над резервним env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування на стороні Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Боти Telegram за замовчуванням використовують **Privacy Mode**, який обмежує, які групові повідомлення вони отримують.

    Якщо бот має бачити всі групові повідомлення, зробіть одне з двох:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму приватності видаліть і повторно додайте бота в кожній групі, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі групові повідомлення, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups`, щоб дозволити або заборонити додавання до груп
    - `/setprivacy` для поведінки видимості в групах

  </Accordion>
</AccordionGroup>

## Контроль доступу й активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен принаймні один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дозволяє будь-якому обліковому запису Telegram, який знайде або вгадає ім’я користувача бота, керувати ботом. Використовуйте це лише для навмисно публічних ботів із суворо обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими ID користувачів.

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний верхньорівневий `channels.telegram.allowFrom` розглядається як межа безпеки: записи `allowFrom: ["*"]` на рівні облікового запису не роблять цей обліковий запис публічним, якщо ефективний allowlist облікового запису після злиття все ще не містить явного wildcard.
    `dmPolicy: "allowlist"` із порожнім `allowFrom` блокує всі DM і відхиляється валідацією конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися, і ваша конфігурація містить записи allowlist у форматі `@username`, виконайте `openclaw doctor --fix`, щоб розв’язати їх (best-effort; потрібен токен бота Telegram).
    Якщо раніше ви покладалися на файли allowlist зі сховища сполучень, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу стабільно зберігалася в конфігурації (замість залежності від попередніх схвалень сполучення).

    Поширена плутанина: схвалення сполучення DM не означає «цей відправник авторизований всюди».
    Сполучення надає доступ до DM. Якщо власника команд ще немає, перше схвалене сполучення також задає `commands.ownerAllowFrom`, щоб команди лише для власника й схвалення exec мали явний обліковий запис оператора.
    Авторизація відправника в групі все одно походить із явних allowlist у конфігурації.
    Якщо вам потрібно «я авторизований один раз, і працюють як DM, так і групові команди», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

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

  <Tab title="Політика груп і allowlist">
    Два елементи керування застосовуються разом:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи заблоковані, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групі. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID груп або супергруп Telegram у `groupAllowFrom`. Від’ємні chat ID належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправника.
    Межа безпеки (`2026.2.25+`): автентифікація відправника в групі **не** успадковує схвалення зі сховища сполучень DM.
    Сполучення залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` на рівні групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до config `allowFrom`, а не до сховища сполучень.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням fail-closed з `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` не задано явно.

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
      Поширена помилка: `groupAllowFrom` не є allowlist груп Telegram.

      - Додавайте від’ємні ID груп або супергруп Telegram, наприклад `-1001234567890`, у `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, наприклад `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди в дозволеній групі можуть запускати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.

    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Відповіді в групі за замовчуванням потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для постійності використовуйте конфігурацію.

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

    Отримання chat ID групи:

    - перешліть групове повідомлення до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перевірте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні повідомлення Telegram отримують відповіді назад у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний конверт каналу з метаданими відповіді та placeholders для медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб тримати теми ізольованими.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw маршрутизує їх із thread-aware ключами сесій і зберігає ID треду для відповідей.
- Long polling використовує runner grammY з послідовністю на рівні чату/треду. Загальна concurrency sink runner використовує `agents.defaults.maxConcurrent`.
- Long polling захищений усередині кожного процесу gateway, щоб лише один активний poller міг використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, інший gateway OpenClaw, скрипт або зовнішній poller, імовірно, використовує той самий токен.
- Перезапуски watchdog для long-polling за замовчуванням запускаються після 120 секунд без завершеної liveness `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні polling-stall перезапуски під час довготривалої роботи. Значення в мілісекундах і дозволене від `30000` до `600000`; підтримуються override на рівні облікового запису.
- Telegram Bot API не підтримує read-receipt (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Live stream preview (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: preview-повідомлення + `editMessageText`
    - групи/теми: preview-повідомлення + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` дорівнює `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` відображається на `partial` у Telegram (сумісність із міжканальним іменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме відредаговане preview-повідомлення (за замовчуванням: `true`, коли preview streaming активний)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; виконайте `openclaw doctor --fix`, щоб перенести їх у `channels.telegram.streaming.mode`

    Preview-оновлення прогресу інструментів — це короткі рядки "Working...", які показуються під час роботи інструментів, наприклад виконання команд, читання файлів, оновлення планування або підсумки патчів. Telegram залишає їх увімкненими за замовчуванням, щоб відповідати випущеній поведінці OpenClaw від `v2026.4.22` і пізніше. Щоб зберегти відредагований preview для тексту відповіді, але приховати рядки прогресу інструментів, задайте:

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

    Використовуйте `streaming.mode: "off"` лише тоді, коли хочете доставку тільки фінальної відповіді: preview-редагування Telegram вимикаються, а загальний шум інструментів/прогресу приглушується замість надсилання окремими повідомленнями "Working...". Запити на схвалення, медіа payload і помилки все ще маршрутизуються через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли хочете залишити лише preview-редагування відповіді, приховавши статусні рядки прогресу інструментів.

    Для відповідей лише текстом:

    - короткі попередні перегляди DM/групи/теми: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці
    - попередні перегляди старші приблизно за одну хвилину: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення, а потім очищає попередній перегляд, тож видима позначка часу Telegram відображає час завершення, а не час створення попереднього перегляду

    Для складних відповідей (наприклад, медіанавантажень) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Потокове передавання попереднього перегляду відокремлене від потокового передавання блоків. Коли потокове передавання блоків явно ввімкнено для Telegram, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування до живого попереднього перегляду під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок парсингу Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює надсилання як звичайний текст.

    Попередні перегляди посилань увімкнені за замовчуванням і можуть бути вимкнені через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Вбудовані команди та користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Типові значення вбудованих команд:

    - `commands.native: "auto"` вмикає вбудовані команди для Telegram

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

    - назви нормалізуються (початковий `/` видаляється, усе переводиться в нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати вбудовані команди
    - конфлікти/дублікати пропускаються й записуються в журнал

    Примітки:

    - користувацькі команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills усе ще можуть працювати під час введення, навіть якщо не показані в меню Telegram

    Якщо вбудовані команди вимкнено, вбудовані елементи видаляються. Користувацькі команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Типові помилки налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після обрізання; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - Помилка `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, коли прямі команди curl Bot API працюють, може означати, що `channels.telegram.apiRoot` було встановлено на повну кінцеву точку `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється до опитування, тож це не повідомляється як помилка очищення Webhook.
    - `setMyCommands failed` з помилками мережі/отримання зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблоковано.

    ### Команди сполучення пристрою (Plugin `device-pair`)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують (включно з роллю/областями)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит, що очікує
       - `/pair approve latest` для найновішого

    Код налаштування містить короткочасний початковий токен. Вбудована передача початкових даних зберігає токен основного вузла на `scopes: []`; будь-який переданий токен оператора залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки початкової області мають префікс ролі, тому цей список дозволів оператора задовольняє лише запити оператора; неоператорські ролі все ще потребують областей із власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими деталями автентифікації (наприклад, роллю/областями/публічним ключем), попередній запит, що очікує, замінюється, а новий запит використовує інший `requestId`. Повторно виконайте `/pair pending` перед схваленням.

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

    Застаріле `capabilities: ["inlineButtons"]` зіставляється з `inlineButtons: "all"`.

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

    Натискання зворотного виклику передаються агенту як текст:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Дії повідомлень Telegram для агентів і автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Елементи керування допуском:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час виконання використовує активний знімок конфігурації/секретів (запуск/перезавантаження), тому шляхи дій не виконують спеціальне повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги гілкування відповідей">
    Telegram підтримує явні теги гілкування відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, що запустило дію
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Коли гілкування відповідей увімкнено й доступний оригінальний текст або підпис Telegram, OpenClaw автоматично включає фрагмент нативної цитати Telegram. Telegram обмежує текст нативної цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються з початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявне гілкування відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка гілок">
    Супергрупи форуму:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор введення спрямовуються в гілку теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень опускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії введення все ще включають `message_thread_id`

    Успадкування теми: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` застосовується лише до теми й не успадковується з типових значень групи.

    **Маршрутизація агента за темою**: кожна тема може маршрутизуватися до іншого агента через встановлення `agentId` у конфігурації теми. Це дає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

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

    Після цього кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійне прив’язування теми ACP**: теми форуму можуть закріплювати сесії ACP harness через типізовані прив’язки ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ID з уточненням теми, як-от `-1001234567890:topic:42`). Наразі обмежено темами форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Запуск ACP із чату, прив’язаний до гілки**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди напряму. OpenClaw закріплює підтвердження запуску в темі. Потребує `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону надає `MessageThreadId` і `IsForum`. Чати DM з `message_thread_id` зберігають маршрутизацію DM, але використовують ключі сесій з урахуванням гілок.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає як голосову нотатку
    - вхідні транскрипти голосових нотаток оформлюються як машинно згенерований,
      недовірений текст у контексті агента; виявлення згадки все ще використовує сирий
      транскрипт, тому голосові повідомлення з обмеженням за згадкою продовжують працювати.

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

    - статичний WEBP: завантажується та обробляється (заповнювач `<media:sticker>`)
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

    Стікери описуються один раз (коли це можливо) і кешуються, щоб зменшити повторні виклики зору.

    Увімкнути дії зі стікерами:

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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від навантажень повідомлень).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувача на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно враховують засоби контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ідентифікатори тем у оновленнях реакцій.
      - нефорумні групи маршрутизуються до сесії групового чату
      - форумні групи маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок вирішення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - запасний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує unicode-емодзі (наприклад "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнені за замовчуванням (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції груп (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
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

  <Accordion title="Long polling проти webhook">
    За замовчуванням використовується long polling. Для режиму webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язкові `webhookPath`, `webhookHost`, `webhookPort` (типово `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного входу або поставте reverse proxy перед локальним портом, або свідомо задайте `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє захисти запиту, секретний токен Telegram і JSON-тіло перед поверненням `200` до Telegram.
    Потім OpenClaw обробляє оновлення асинхронно через ті самі окремі для кожного чату/теми лінії бота, що й long polling, тому повільні ходи агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби й цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` віддає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає timeout клієнта Telegram API (якщо не задано, застосовується типове значення grammY).
    - `channels.telegram.pollingStallThresholdMs` типово дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зупинку polling.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає.
    - додатковий контекст reply/quote/forward наразі передається як отриманий.
    - allowlist Telegram переважно обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до помічників надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API. Доставка фінальної відповіді для вхідних повідомлень також використовує обмежену безпечну повторну спробу надсилання для збоїв Telegram перед підключенням, але не повторює неоднозначні мережеві оболонки після надсилання, які можуть дублювати видимі повідомлення.

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

    - `--presentation` з блоками `buttons` для inline-клавіатур, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'`, щоб запросити закріплену доставку, коли бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення й GIF як документи замість стиснутих фото або завантажень анімованих медіа

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, зокрема опитування
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Схвалення exec у Telegram">
    Telegram підтримує схвалення exec у DM схвалювачів і може необов’язково публікувати запити в початковому чаті або темі. Схвалювачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна визначити принаймні одного схвалювача)
    - `channels.telegram.execApprovals.approvers` (повертається до числових ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (типово) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` контролюють, хто може говорити з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось схвалювачем exec. Перше схвалене парування DM ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тож налаштування з одним власником і далі працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє у форумну тему, OpenClaw зберігає тему для запиту схвалення й подальшого повідомлення. Схвалення exec типово спливають через 30 хвилин.

    Inline-кнопки схвалення також вимагають, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID схвалення з префіксом `plugin:` вирішуються через схвалення plugin; інші спершу вирішуються через схвалення exec.

    Див. [Схвалення exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або provider, Telegram може або відповісти текстом помилки, або приховати її. Цією поведінкою керують два ключі конфігурації:

| Ключ                                | Значення          | Типово  | Опис                                                                                                    |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю приховує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями про помилки до того самого чату. Запобігає спаму помилок під час збоїв. |

Підтримуються перевизначення для облікового запису, групи й теми (те саме успадкування, що й для інших ключів конфігурації Telegram).

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
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити на membership.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот узагалі не бачить групові повідомлення">

    - коли існує `channels.telegram.groups`, група має бути в списку (або включати `"*"`)
    - перевірте membership бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють узагалі">

    - авторизуйте ідентичність відправника (pairing та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд plugin/skill/custom або вимкніть нативні меню
    - стартові виклики `deleteMyCommands` / `setMyCommands` обмежені й повторюються один раз через транспортний fallback Telegram у разі timeout запиту. Постійні помилки network/fetch зазвичай вказують на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Під час запуску повідомляється про неавторизований токен">

    - `getMe returned 401` — це помилка автентифікації Telegram для налаштованого bot token.
    - Повторно скопіюйте або згенеруйте bot token у BotFather, потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для типового облікового запису.
    - `deleteWebhook 401 Unauthorized` під час запуску також є помилкою автентифікації; трактування її як "no webhook exists" лише відклало б той самий збій через поганий токен до подальших API-викликів.
    - Якщо `deleteWebhook` завершується з transient network error під час запуску polling, OpenClaw перевіряє `getWebhookInfo`; коли Telegram повідомляє порожній webhook URL, polling продовжується, бо cleanup уже задоволено.

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + власний fetch/proxy може спричиняти негайну поведінку abort, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку розв’язують `api.telegram.org` в IPv6; несправний IPv6 egress може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює їх як відновлювані мережеві помилки.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної liveness long-poll за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли активний обліковий запис polling не завершив `getUpdates` після startup grace, коли активний обліковий запис webhook не завершив `setWebhook` після startup grace або коли остання успішна активність транспорту polling застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` здорові, але ваш хост усе одно повідомляє хибні перезапуски через зупинку polling. Постійні зупинки зазвичай вказують на проблеми proxy, DNS, IPv6 або TLS egress між хостом і `api.telegram.org`.
    - Telegram також враховує env proxy процесу для транспорту Bot API, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти в нижньому регістрі. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для service environment і стандартного env proxy немає, Telegram також використовує цю URL-адресу для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим egress/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням має `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює з поведінкою лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону RFC 2544 для бенчмарків (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий проксі під час завантажень медіа переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціального призначення адресу, ви можете увімкнути
      обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Та сама явна згода доступна для кожного облікового запису за адресою
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш проксі перетворює хости медіа Telegram на `198.18.x.x`, спершу залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже за замовчуванням дозволяє
      діапазон еталонного тестування RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист
      медіа Telegram від SSRF. Використовуйте це лише в довірених проксі-середовищах,
      контрольованих оператором, як-от маршрутизація fake-IP у Clash, Mihomo або Surge,
      коли вони синтезують приватні або спеціального призначення відповіді поза
      діапазоном еталонного тестування RFC 2544. Залиште це вимкненим для звичайного
      доступу до Telegram через публічний інтернет.
    </Warning>

    - Перевизначення через змінні середовища (тимчасові):
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

Додаткова допомога: [Усунення несправностей каналів](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="Високосигнальні поля Telegram">

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` верхнього рівня (`type: "acp"`)
- підтвердження виконання: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- треди/відповіді: `replyToMode`
- потокове передавання: `streaming` (попередній перегляд), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- власний корінь API: `apiRoot` (лише корінь Bot API; не включайте `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритет кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити маршрутизацію за замовчуванням. Інакше OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` попереджає про це. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Telegram із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка списку дозволених груп і тем.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
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
