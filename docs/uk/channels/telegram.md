---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки бота Telegram, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-04-29T12:15:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 500f1282c7d6f7350b781a2413737b0e34b00ea8b042703341fd9ddb700ecfb4
    source_path: channels/telegram.md
    workflow: 16
---

Готово до production для DM ботів і груп через grammY. Довге опитування є режимом за замовчуванням; режим Webhook необов’язковий.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — сполучення.
  </Card>
  <Card title="Усунення неполадок каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та плейбуки відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналу.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і поспілкуйтеся з **@BotFather** (переконайтеся, що ім’я користувача точно `@BotFather`).

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

    Резервний варіант env: `TELEGRAM_BOT_TOKEN=...` (лише обліковий запис за замовчуванням).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть gateway.

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
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення config мають пріоритет над резервним env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Боти Telegram за замовчуванням використовують **Privacy Mode**, який обмежує, які групові повідомлення вони отримують.

    Якщо бот має бачити всі групові повідомлення, або:

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

## Контроль доступу й активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом через прямі повідомлення:

    - `pairing` (за замовчуванням)
    - `allowlist` (потребує принаймні один ID відправника в `allowFrom`)
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дає змогу будь-якому обліковому запису Telegram, який знайде або вгадає ім’я користувача бота, керувати ботом. Використовуйте це лише для навмисно публічних ботів із суворо обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими ID користувачів.

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний `channels.telegram.allowFrom` верхнього рівня вважається межею безпеки: записи `allowFrom: ["*"]` на рівні облікового запису не роблять цей обліковий запис публічним, якщо ефективний allowlist облікового запису після злиття все ще не містить явного wildcard.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється перевіркою конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися й ваша конфігурація містить записи allowlist `@username`, виконайте `openclaw doctor --fix`, щоб розв’язати їх (best-effort; потребує токен бота Telegram).
    Якщо ви раніше покладалися на файли allowlist зі сховища сполучень, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу була стійкою в config (замість залежності від попередніх схвалень сполучення).

    Типова плутанина: схвалення сполучення DM не означає «цей відправник авторизований скрізь».
    Сполучення надає доступ до DM. Якщо власника команд ще немає, перше схвалене сполучення також встановлює `commands.ownerAllowFrom`, щоб команди лише для власника та схвалення exec мали явний обліковий запис оператора.
    Авторизація відправника в групі все одно походить з явних allowlist у конфігурації.
    Якщо ви хочете «мене авторизовано один раз, і працюють і DM, і групові команди», додайте свій числовий ID користувача Telegram до `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

    ### Як знайти свій ID користувача Telegram

    Безпечніше (без стороннього бота):

    1. Напишіть DM своєму боту.
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
       - `groups` налаштовано: діє як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не встановлено, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення зі сховища сполучень DM.
    Сполучення залишається лише для DM. Для груп встановіть `groupAllowFrom` або `allowFrom` для окремої групи/теми.
    Якщо `groupAllowFrom` не встановлено, Telegram повертається до config `allowFrom`, а не до сховища сполучень.
    Практичний шаблон для ботів з одним власником: встановіть свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` невстановленим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням fail-closed з `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` не встановлено явно.

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
      Типова помилка: `groupAllowFrom` не є allowlist груп Telegram.

      - Додавайте від’ємні ID чатів груп або супергруп Telegram, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть запускати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг говорити з ботом.

    </Warning>

  </Tab>

  <Tab title="Поведінка згадки">
    Групові відповіді за замовчуванням потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Використовуйте config для постійності.

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

    - переслати групове повідомлення до `@userinfobot` / `@getidsbot`
    - або прочитати `chat.id` з `openclaw logs --follow`
    - або перевірити Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні повідомлення Telegram отримують відповідь у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний конверт каналу з метаданими відповіді та placeholder для медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб зберегти ізоляцію тем.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw маршрутизує їх із ключами сесії, що враховують тред, і зберігає ID треду для відповідей.
- Довге опитування використовує grammY runner із послідовністю на рівні чату/треду. Загальна конкуренція runner sink використовує `agents.defaults.maxConcurrent`.
- Довге опитування захищене всередині кожного процесу gateway, тож лише один активний poller може використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, імовірно, інший gateway OpenClaw, скрипт або зовнішній poller використовує той самий токен.
- Перезапуски watchdog для long-polling запускаються після 120 секунд без завершеної liveness `getUpdates` за замовчуванням. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні перезапуски через polling-stall під час тривалої роботи. Значення в мілісекундах і дозволене від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` зіставляється з `partial` у Telegram (сумісність із міжканальним іменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме редаговане повідомлення попереднього перегляду (за замовчуванням: `true`, коли streaming попереднього перегляду активний)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; виконайте `openclaw doctor --fix`, щоб мігрувати їх до `channels.telegram.streaming.mode`

    Оновлення попереднього перегляду прогресу інструментів — це короткі рядки «Працюю...», які показуються під час роботи інструментів, наприклад виконання команд, читання файлів, оновлення планування або підсумки patch. Telegram залишає їх увімкненими за замовчуванням, щоб відповідати випущеній поведінці OpenClaw з `v2026.4.22` і пізніше. Щоб залишити редагований попередній перегляд для тексту відповіді, але приховати рядки прогресу інструментів, встановіть:

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

    Використовуйте `streaming.mode: "off"` лише тоді, коли хочете доставку тільки фінальної відповіді: редагування попереднього перегляду Telegram вимикаються, а загальний шум інструментів/прогресу пригнічується замість надсилання як окремі повідомлення «Працюю...». Запити схвалення, медіа payload і помилки все одно маршрутизуються через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли хочете лише зберегти редагування попереднього перегляду відповіді, приховавши рядки статусу прогресу інструментів.

    Для відповідей лише з текстом:

    - короткі попередні перегляди DM/груп/тем: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці
    - попередні перегляди, старші приблизно за одну хвилину: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення, а потім прибирає попередній перегляд, щоб видима позначка часу Telegram відображала час завершення, а не час створення попереднього перегляду

    Для складних відповідей (наприклад, медіанавантажень) OpenClaw повертається до звичайної фінальної доставки, а потім прибирає повідомлення попереднього перегляду.

    Потокове передавання попереднього перегляду відокремлене від потокового передавання блоків. Коли потокове передавання блоків явно ввімкнено для Telegram, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

    Якщо нативний транспорт чернеток недоступний/відхилений, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування до живого попереднього перегляду під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться у безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити помилки парсингу Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередні перегляди посилань увімкнено за замовчуванням, їх можна вимкнути за допомогою `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
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

    - імена нормалізуються (видаляється початковий `/`, переводяться в нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та записуються в журнал

    Примітки:

    - користувацькі команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills усе ще можуть працювати під час введення, навіть якщо їх не показано в меню Telegram

    Якщо нативні команди вимкнено, вбудовані команди видаляються. Користувацькі команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені помилки налаштування:

    - `setMyCommands failed` із `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після обрізання; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - Помилка `deleteWebhook`, `deleteMyCommands` або `setMyCommands` із `404: Not Found`, коли прямі команди Bot API через curl працюють, може означати, що `channels.telegram.apiRoot` було задано як повну кінцеву точку `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється перед опитуванням, тому це не повідомляється як збій очищення Webhook.
    - `setMyCommands failed` із помилками мережі/fetch зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблоковано.

    ### Команди сполучення пристрою (Plugin `device-pair`)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує очікувані запити (включно з роллю/областями)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один очікуваний запит
       - `/pair approve latest` для найновішого

    Код налаштування містить короткочасний bootstrap-токен. Вбудована передача bootstrap зберігає токен основного вузла на `scopes: []`; будь-який переданий токен оператора залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки областей bootstrap мають префікс ролі, тож цей allowlist оператора задовольняє лише запити оператора; неоператорські ролі все ще потребують областей під власним префіксом ролі.

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

    Елементи керування доступом:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнено за замовчуванням, і вони не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час виконання використовують активний знімок конфігурації/секретів (запуск/перезавантаження), тому шляхи дій не виконують ситуативне повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакції: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги гілкування відповідей">
    Telegram підтримує явні теги гілкування відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, що ініціювало дію
    - `[[reply_to:<id>]]` відповідає на конкретний ідентифікатор повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Коли гілкування відповідей увімкнено й оригінальний текст або підпис Telegram доступний, OpenClaw автоматично включає нативний уривок цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються від початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявне гілкування відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка гілок">
    Форумні супергрупи:

    - ключі сеансів теми додають `:topic:<threadId>`
    - відповіді та індикатор набору спрямовуються в гілку теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Особливий випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускають `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору все ще включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` діє лише для теми й не успадковується з типових значень групи.

    **Маршрутизація агента для окремої теми**: кожна тема може маршрутизуватися до іншого агента через встановлення `agentId` у конфігурації теми. Це дає кожній темі власний ізольований робочий простір, пам’ять і сеанс. Приклад:

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

    Кожна тема тоді має власний ключ сеансу: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійне прив’язування теми ACP**: теми форуму можуть закріплювати сеанси harness ACP через типізовані прив’язування ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ідентифікатором із кваліфікатором теми на кшталт `-1001234567890:topic:42`). Наразі обмежено темами форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Прив’язаний до гілки spawn ACP із чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нового сеансу ACP; подальші повідомлення маршрутизуються туди напряму. OpenClaw закріплює підтвердження spawn у темі. Потребує `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` зберігають маршрутизацію DM, але використовують ключі сеансів із підтримкою гілок.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає голосову нотатку
    - транскрипти вхідних голосових нотаток оформлюються як машинно згенерований,
      ненадійний текст у контексті агента; виявлення згадок усе ще використовує сирий
      транскрипт, тож голосові повідомлення з вимогою згадки продовжують працювати.

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

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає реакції користувачів лише на повідомлення, надіслані ботом (за можливості через кеш надісланих повідомлень).
    - Події реакцій усе одно враховують засоби контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизованих відправників відкидають.
    - Telegram не надає ідентифікатори гілок у оновленнях реакцій.
      - групи нефорумного типу спрямовуються до сеансу групового чату
      - форумні групи спрямовуються до сеансу загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує Unicode emoji (наприклад "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнені типово (`configWrites !== false`).

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
    Типово використовується long polling. Для режиму webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язково `webhookPath`, `webhookHost`, `webhookPort` (типові значення `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного входу або поставте reverse proxy перед локальним портом, або свідомо задайте `webhookHost: "0.0.0.0"`.

    Режим webhook перевіряє захисти запиту, секретний токен Telegram і JSON-тіло перед поверненням `200` до Telegram.
    Потім OpenClaw обробляє оновлення асинхронно через ті самі смуги бота для кожного чату/теми, що й long polling, тому повільні ходи агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби й цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає таймаут клієнта Telegram API (якщо не задано, застосовується типове значення grammY).
    - Типове значення `channels.telegram.pollingStallThresholdMs` — `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає.
    - Додатковий контекст відповіді/цитати/пересилання наразі передається як отримано.
    - Allowlist Telegram насамперед обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Елементи керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до допоміжних засобів надсилання Telegram (CLI/інструменти/дії) для відновлюваних вихідних помилок API. Доставка фінальної відповіді для вхідних повідомлень також використовує обмежену безпечну повторну спробу надсилання для збоїв Telegram до підключення, але не повторює неоднозначні мережеві оболонки після надсилання, які можуть дублювати видимі повідомлення.

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

    - `--presentation` з блоками `buttons` для inline keyboards, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'` для запиту закріпленої доставки, коли бот може закріплювати в цьому чаті
    - `--force-document` для надсилання вихідних зображень і GIF як документів замість стиснених завантажень фото або анімованих медіа

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Підтвердження exec у Telegram">
    Telegram підтримує підтвердження exec у DM затверджувачів і може необов’язково публікувати запити в початковому чаті або темі. Затверджувачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна розв’язати принаймні одного затверджувача)
    - `channels.telegram.execApprovals.approvers` (повертається до числових ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (типово) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` контролюють, хто може говорити з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось затверджувачем exec. Перше схвалене сполучення DM ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тому налаштування з одним власником усе одно працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє у форумну тему, OpenClaw зберігає тему для запиту підтвердження та подальшого повідомлення. Підтвердження exec типово спливають через 30 хвилин.

    Inline-кнопки підтвердження також потребують, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID підтверджень із префіксом `plugin:` розв’язуються через підтвердження plugin; інші спочатку розв’язуються через підтвердження exec.

    Див. [Підтвердження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Елементи керування відповідями про помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або придушити її. Цю поведінку контролюють два ключі конфігурації:

| Ключ                                | Значення          | Типово  | Опис                                                                                           |
| ----------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю придушує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями про помилки до того самого чату. Запобігає спаму помилками під час збоїв. |

Підтримуються перевизначення для кожного облікового запису, групи й теми (таке саме наслідування, як для інших ключів конфігурації Telegram).

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
    - `openclaw channels status --probe` може перевірити явні числові ID груп; wildcard `"*"` не можна перевірити на членство.
    - швидкий тест сеансу: `/activation always`.

  </Accordion>

  <Accordion title="Бот узагалі не бачить групових повідомлень">

    - коли існує `channels.telegram.groups`, група має бути в списку (або включати `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють узагалі">

    - авторизуйте ідентичність свого відправника (сполучення та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд plugin/skill/користувацьких команд або вимкніть нативні меню
    - Виклики запуску `deleteMyCommands` / `setMyCommands` обмежені й повторюються один раз через транспортний fallback Telegram у разі таймауту запиту. Постійні мережеві/fetch-помилки зазвичай вказують на проблеми досяжності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Під час запуску повідомляється про неавторизований токен">

    - `getMe returned 401` — це збій автентифікації Telegram для налаштованого токена бота.
    - Повторно скопіюйте або згенеруйте токен бота в BotFather, потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для типового облікового запису.
    - `deleteWebhook 401 Unauthorized` під час запуску також є збоєм автентифікації; трактування цього як "webhook не існує" лише відклало б той самий збій поганого токена до пізніших викликів API.
    - Якщо `deleteWebhook` завершується помилкою через тимчасову мережеву помилку під час запуску polling, OpenClaw перевіряє `getWebhookInfo`; коли Telegram повідомляє про порожній URL webhook, polling продовжується, бо очищення вже виконано.

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + користувацький fetch/proxy може спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку розв’язують `api.telegram.org` в IPv6; несправний вихідний IPv6-трафік може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює ці запити як відновлювані мережеві помилки.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає опитування та перебудовує Telegram transport після 120 секунд без завершеної перевірки життєздатності long-poll за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис з опитуванням не завершив `getUpdates` після пільгового періоду запуску або коли його остання успішна активність polling transport застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе ще повідомляє про хибні перезапуски через зависання опитування. Постійні зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або вихідного TLS-трафіку між хостом і `api.telegram.org`.
    - Telegram також враховує env proxy процесу для Bot API transport, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти в нижньому регістрі. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища і стандартні env proxy відсутні, Telegram також використовує цей URL для Bot API transport.
    - На VPS-хостах із нестабільним прямим вихідним трафіком/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост є WSL2 або явно краще працює з поведінкою лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді benchmark-діапазону RFC 2544 (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціальну адресу під час завантаження медіа, ви можете
      увімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Така сама опція доступна для кожного облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy розв’язує хости медіа Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє benchmark-діапазон
      RFC 2544 за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      media SSRF. Використовуйте це лише для довірених, контрольованих оператором proxy
      середовищ, як-от маршрутизація fake-IP у Clash, Mihomo або Surge, коли вони
      синтезують приватні або спеціальні відповіді поза benchmark-діапазоном
      RFC 2544. Залишайте це вимкненим для звичайного доступу Telegram через публічний інтернет.
    </Warning>

    - Перевизначення середовища (тимчасові):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Перевірте відповіді DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Додаткова допомога: [Усунення несправностей каналів](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- запуск/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; symlinks відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- схвалення exec: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- користувацький корінь API: `apiRoot` (лише корінь Bot API; не включайте `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритетність кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб зробити маршрутизацію за замовчуванням явною. Інакше OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` попереджає. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Telegram із gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка allowlist для груп і тем.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і зміцнення захисту.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте групи й теми з агентами.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами.
  </Card>
</CardGroup>
