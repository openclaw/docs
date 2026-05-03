---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки бота Telegram, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-05-03T15:57:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 730b26df661d5faacdc393b1a017ac36ee38371b9cee6a6dffe8b627566ce2e2
    source_path: channels/telegram.md
    workflow: 16
---

Готовий для production-використання в DM ботів і групах через grammY. Режим довгого опитування є стандартним; режим Webhook необов’язковий.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM для Telegram — сполучення.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і напишіть **@BotFather** (переконайтеся, що handle точно `@BotFather`).

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

    Резервний варіант через env: `TELEGRAM_BOT_TOKEN=...` (лише стандартний обліковий запис).
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
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до своєї моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення config мають пріоритет над резервним env, а `TELEGRAM_BOT_TOKEN` застосовується лише до стандартного облікового запису.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість груп">
    Боти Telegram за замовчуванням використовують **Privacy Mode**, який обмежує групові повідомлення, які вони отримують.

    Якщо бот має бачити всі групові повідомлення, зробіть одне з двох:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Під час перемикання режиму приватності видаліть і знову додайте бота в кожній групі, щоб Telegram застосував зміну.

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

    - `pairing` (за замовчуванням)
    - `allowlist` (потребує принаймні одного ID відправника в `allowFrom`)
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дає змогу будь-якому обліковому запису Telegram, який знайде або вгадає username бота, керувати ботом. Використовуйте це лише для навмисно публічних ботів із жорстко обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими ID користувачів.

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний верхньорівневий `channels.telegram.allowFrom` розглядається як межа безпеки: записи рівня облікового запису `allowFrom: ["*"]` не роблять цей обліковий запис публічним, якщо ефективний allowlist облікового запису після злиття все ще не містить явний wildcard.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється перевіркою config.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися і ваш config містить записи allowlist `@username`, виконайте `openclaw doctor --fix`, щоб розв’язати їх (найкраща спроба; потребує токена бота Telegram).
    Якщо раніше ви покладалися на файли allowlist зі сховища сполучень, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу була довговічною в config (замість залежності від попередніх схвалень сполучення).

    Поширена плутанина: схвалення сполучення DM не означає «цей відправник авторизований усюди».
    Сполучення надає доступ до DM. Якщо власника команд ще немає, перше схвалене сполучення також задає `commands.ownerAllowFrom`, щоб команди лише для власника та схвалення exec мали явний обліковий запис оператора.
    Авторизація відправника в групі все одно походить з явних config allowlist.
    Якщо ви хочете «мене авторизовано один раз, і працюють як DM, так і групові команди», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

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
    Два засоби керування застосовуються разом:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи заблоковані, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: діє як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення зі сховища сполучень DM.
    Сполучення залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` для окремої групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до config `allowFrom`, а не до сховища сполучень.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням працює в fail-closed режимі `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` не задано явно.

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

      - Додавайте від’ємні ID чатів груп або супергруп Telegram, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть запускати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг звертатися до бота.

    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Групові відповіді за замовчуванням потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадки в:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Використовуйте config для збереження.

    Приклад постійного config:

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

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні повідомлення Telegram отримують відповідь у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний envelope каналу з метаданими відповіді та placeholders медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw зберігає ID потоку для відповідей, але за замовчуванням тримає DM у пласкій сесії. Налаштуйте `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` або відповідний config теми, коли ви навмисно хочете ізоляцію сесій тем DM.
- Довге опитування використовує runner grammY з послідовністю для кожного чату/потоку. Загальна конкурентність runner sink використовує `agents.defaults.maxConcurrent`.
- Довге опитування захищене всередині кожного процесу gateway, тож лише один активний poller може використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, інший OpenClaw gateway, script або зовнішній poller, імовірно, використовує той самий токен.
- Перезапуски watchdog довгого опитування за замовчуванням спрацьовують після 120 секунд без завершеної liveness `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні перезапуски через stall опитування під час довготривалої роботи. Значення задається в мілісекундах і дозволене в діапазоні від `30000` до `600000`; підтримуються перевизначення для кожного облікового запису.
- Telegram Bot API не підтримує read receipts (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` зіставляється з `partial` у Telegram (сумісність із міжканальним іменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення tool/progress повторно використовують те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`, коли preview streaming активний)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; виконайте `openclaw doctor --fix`, щоб перенести їх у `channels.telegram.streaming.mode`

    Оновлення попереднього перегляду перебігу роботи інструментів — це короткі рядки «Working...», які показуються під час виконання інструментів, наприклад виконання команд, читання файлів, оновлення планування або підсумки patch. Telegram залишає їх увімкненими за замовчуванням, щоб відповідати поведінці OpenClaw, випущеній у `v2026.4.22` і пізніше. Щоб зберегти відредагований попередній перегляд для тексту відповіді, але приховати рядки перебігу роботи інструментів, задайте:

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

    Використовуйте `streaming.mode: "off"` лише тоді, коли потрібна доставка тільки фінальної відповіді: редагування прев’ю в Telegram вимикаються, а загальні повідомлення інструментів/прогресу приглушуються замість надсилання окремими повідомленнями "Working...". Запити на схвалення, медіа-вміст і помилки все одно проходять через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли потрібно залишити лише редагування прев’ю відповіді, приховавши рядки стану прогресу інструментів.

    <Note>
      Відповіді на вибрані цитати в Telegram є винятком. Коли `replyToMode` має значення `"first"`, `"all"` або `"batched"` і вхідне повідомлення містить текст вибраної цитати, OpenClaw надсилає фінальну відповідь через нативний шлях відповіді на цитату Telegram замість редагування прев’ю відповіді, тому `streaming.preview.toolProgress` не може показати короткі рядки "Working..." для цього звернення. Відповіді на поточне повідомлення без тексту вибраної цитати все ще зберігають потокове прев’ю. Встановіть `replyToMode: "off"`, коли видимість прогресу інструментів важливіша за нативні відповіді на цитати, або встановіть `streaming.preview.toolProgress: false`, щоб явно прийняти цей компроміс.
    </Note>

    Для текстових відповідей:

    - короткі прев’ю в DM/групі/темі: OpenClaw зберігає те саме повідомлення прев’ю і виконує фінальне редагування на місці, якщо після появи прев’ю не було надіслано видиме повідомлення, що не є прев’ю
    - прев’ю, після яких іде видимий вивід, що не є прев’ю: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення й очищає старіше прев’ю, тож фінальна відповідь з’являється після проміжного виводу
    - прев’ю, старші приблизно за одну хвилину: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення, а потім очищає прев’ю, тож видима позначка часу Telegram відображає час завершення, а не час створення прев’ю

    Для складних відповідей (наприклад, медіа-вмісту) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення прев’ю.

    Потокове прев’ю відокремлене від блокового потокового передавання. Коли блокове потокове передавання явно ввімкнено для Telegram, OpenClaw пропускає потік прев’ю, щоб уникнути подвійного потокового передавання.

    Потік міркувань тільки для Telegram:

    - `/reasoning stream` надсилає міркування в живе прев’ю під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок розбору Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Прев’ю посилань увімкнені за замовчуванням, їх можна вимкнути за допомогою `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та власні команди">
    Реєстрація меню команд Telegram виконується під час запуску за допомогою `setMyCommands`.

    Стандартні значення нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте власні записи меню команд:

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

    - назви нормалізуються (видаляється початковий `/`, переводяться в нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - власні команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються і записуються в журнал

    Примітки:

    - власні команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди plugin/skill можуть працювати під час введення, навіть якщо не показані в меню Telegram

    Якщо нативні команди вимкнено, вбудовані команди видаляються. Власні/plugin-команди все ще можуть реєструватися, якщо налаштовані.

    Поширені помилки налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після скорочення; зменште кількість plugin/skill/власних команд або вимкніть `channels.telegram.commands.native`.
    - Помилка `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, коли прямі команди Bot API через curl працюють, може означати, що `channels.telegram.apiRoot` було встановлено на повний endpoint `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється перед опитуванням, тому це не повідомляється як помилка очищення Webhook.
    - `setMyCommands failed` з помилками мережі/fetch зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблоковано.

    ### Команди сполучення пристрою (`device-pair` plugin)

    Коли встановлено `device-pair` plugin:

    1. `/pair` генерує код налаштування
    2. вставте код в iOS app
    3. `/pair pending` показує очікувані запити (включно з роллю/областями дії)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один очікуваний запит
       - `/pair approve latest` для найновішого

    Код налаштування містить короткочасний bootstrap-токен. Вбудована передача bootstrap зберігає токен основного вузла на `scopes: []`; будь-який переданий токен оператора залишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки областей дії bootstrap мають префікс ролі, тому цей список дозволів оператора задовольняє лише запити оператора; неоператорські ролі все ще потребують областей дії під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними авторизації (наприклад, роллю/областями дії/публічним ключем), попередній очікуваний запит замінюється, а новий запит використовує інший `requestId`. Повторно виконайте `/pair pending` перед схваленням.

    Докладніше: [Сполучення](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Вбудовані кнопки">
    Налаштуйте область дії inline-клавіатури:

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

    Елементи керування доступом:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час виконання використовують активний знімок config/secrets (запуск/перезавантаження), тому шляхи дій не виконують ситуативне повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги ланцюжків відповідей">
    Telegram підтримує явні теги ланцюжків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, що запустило дію
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Коли ланцюжки відповідей увімкнено і оригінальний текст або підпис Telegram доступний, OpenClaw автоматично додає нативний фрагмент цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються від початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявні ланцюжки відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка ланцюжків">
    Супергрупи форуму:

    - ключі сесій теми додають `:topic:<threadId>`
    - відповіді й індикатор набору тексту спрямовуються в ланцюжок теми
    - шлях config теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень опускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все ще включають `message_thread_id`

    Наслідування теми: записи теми наслідують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` належить лише темі й не наслідується з типових значень групи.

    **Маршрутизація агента для кожної теми**: Кожна тема може маршрутизуватися до іншого агента через встановлення `agentId` у config теми. Це дає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

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

    Потім кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійне прив’язування теми ACP**: Теми форуму можуть закріплювати сесії ACP harness через типізовані прив’язки ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ID з уточненням теми, наприклад `-1001234567890:topic:42`). Наразі область дії обмежена темами форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Thread-bound ACP spawn із чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди напряму. OpenClaw закріплює підтвердження spawn у темі. Потрібно, щоб `channels.telegram.threadBindings.spawnSessions` залишався ввімкненим (за замовчуванням: `true`).

    Контекст шаблону надає `MessageThreadId` і `IsForum`. Чати DM з `message_thread_id` за замовчуванням зберігають маршрутизацію DM і метадані відповіді у плоских сесіях; вони використовують ключі сесій з урахуванням ланцюжків лише коли налаштовано `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` або відповідний config теми. Використовуйте `channels.telegram.dm.threadReplies` верхнього рівня як типове значення облікового запису або `direct.<chatId>.threadReplies` для одного DM.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає голосову нотатку
    - транскрипти вхідних голосових нотаток оформлюються в контексті агента як машинно згенерований,
      недовірений текст; виявлення згадок усе ще використовує сирий
      транскрипт, тому голосові повідомлення з вимогою згадки продовжують працювати.

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

    - статичний WEBP: завантажується й обробляється (плейсхолдер `<media:sticker>`)
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

    Стікери описуються один раз (коли можливо) і кешуються, щоб зменшити повторні виклики vision.

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

  <Accordion title="Reaction notifications">
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від payload повідомлень).

    Якщо ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно поважають засоби контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID потоків в оновленнях реакцій.
      - нефорумні групи маршрутизуються до сесії групового чату
      - форумні групи маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної вихідної теми

    `allowed_updates` для polling/webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує unicode emoji (наприклад, "👀").
    - Використайте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Записи конфігурації каналу ввімкнені типово (`configWrites !== false`).

    Записи, спричинені Telegram, включають:

    - події міграції груп (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
    - `/config set` і `/config unset` (потребує ввімкнення команд)

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

  <Accordion title="Long polling vs webhook">
    Типовий режим — long polling. Для режиму webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язкові `webhookPath`, `webhookHost`, `webhookPort` (типові значення `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного входу або поставте reverse proxy перед локальним портом, або навмисно задайте `webhookHost: "0.0.0.0"`.

    Режим webhook перевіряє захист запиту, секретний токен Telegram і тіло JSON перед поверненням `200` до Telegram.
    Потім OpenClaw обробляє оновлення асинхронно через ті самі bot lanes для кожного чату/теми, які використовує long polling, тож повільні ходи агента не затримують delivery ACK Telegram.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` віддає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає timeout клієнта Telegram API (якщо не задано, застосовується типове значення grammY). Клієнти бота обмежують налаштовані значення, нижчі за 60-секундний guard для вихідних text/typing запитів, щоб grammY не перервав доставку видимої відповіді до того, як зможуть спрацювати transport guard і fallback OpenClaw. Long polling усе ще використовує 45-секундний guard запиту `getUpdates`, щоб idle polls не покидалися безстроково.
    - `channels.telegram.pollingStallThresholdMs` типово має значення `120000`; налаштовуйте між `30000` і `600000` лише для хибнопозитивних перезапусків через polling-stall.
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає.
    - Додатковий контекст reply/quote/forward наразі передається так, як отриманий.
    - Allowlist Telegram насамперед обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до helpers надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API. Доставка фінальної вхідної відповіді також використовує обмежений safe-send retry для pre-connect збоїв Telegram, але не повторює неоднозначні post-send мережеві envelopes, які можуть дублювати видимі повідомлення.

    Ціль надсилання CLI може бути числовим ID чату або username:

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
    - `--thread-id` для форумних тем (або використайте ціль `:topic:`)

    Надсилання Telegram також підтримує:

    - `--presentation` з блоками `buttons` для inline keyboards, коли `channels.telegram.capabilities.inlineButtons` це дозволяє
    - `--pin` або `--delivery '{"pin":true}'` для запиту pinned delivery, коли бот може pin у цьому чаті
    - `--force-document` для надсилання вихідних зображень і GIF як документів замість стисненого photo або animated-media uploads

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайні надсилання ввімкненими

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram підтримує exec approvals у DM затверджувачів і може додатково публікувати prompts у вихідному чаті або темі. Затверджувачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна визначити принаймні одного затверджувача)
    - `channels.telegram.execApprovals.approvers` (fallback до числових owner ID з `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (типово) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` контролюють, хто може говорити з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось exec approver. Перше схвалене DM pairing ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тож налаштування з одним власником усе ще працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли prompt потрапляє у форумну тему, OpenClaw зберігає тему для approval prompt і подальшого повідомлення. Exec approvals типово спливають через 30 хвилин.

    Inline approval buttons також потребують, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). Approval IDs з префіксом `plugin:` визначаються через plugin approvals; інші спершу визначаються через exec approvals.

    Див. [Exec approvals](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або provider, Telegram може або відповісти текстом помилки, або придушити його. Цю поведінку контролюють два ключі конфігурації:

| Ключ                                | Значення          | Типово  | Опис                                                                                                      |
| ----------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю придушує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями про помилки в той самий чат. Запобігає спаму помилок під час збоїв.        |

Підтримуються перевизначення для облікового запису, групи та теми (таке саме успадкування, як і для інших ключів конфігурації Telegram).

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
  <Accordion title="Bot does not respond to non mention group messages">

    - Якщо `requireMention=false`, режим приватності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть і повторно додайте бота до групи
    - `openclaw channels status` попереджає, коли конфігурація очікує групові повідомлення без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити на членство.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - коли існує `channels.telegram.groups`, група має бути вказана (або містити `"*"`)
    - перевірте членство бота в групі
    - перегляньте логи: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - авторизуйте свою ідентичність відправника (pairing і/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що native menu має забагато записів; зменште кількість plugin/skill/custom команд або вимкніть native menus
    - startup виклики `deleteMyCommands` / `setMyCommands` і typing виклики `sendChatAction` обмежені та повторюються один раз через transport fallback Telegram у разі timeout запиту. Постійні network/fetch помилки зазвичай вказують на проблеми досяжності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` — це помилка автентифікації Telegram для налаштованого токена бота.
    - Повторно скопіюйте або згенеруйте заново токен бота в BotFather, а потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для типового облікового запису.
    - `deleteWebhook 401 Unauthorized` під час запуску також є помилкою автентифікації; трактування цього як "Webhook не існує" лише відкладе ту саму помилку поганого токена до пізніших викликів API.

  </Accordion>

  <Accordion title="Нестабільність опитування або мережі">

    - Node 22+ + власний fetch/proxy може спричиняти негайну поведінку переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спершу розв'язують `api.telegram.org` в IPv6; зламаний вихідний IPv6-трафік може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює їх як відновлювані мережеві помилки.
    - Під час запуску опитування OpenClaw повторно використовує успішну стартову перевірку `getMe` для grammY, тому виконавцю не потрібен другий `getMe` перед першим `getUpdates`.
    - Якщо `deleteWebhook` завершується з помилкою через тимчасову мережеву помилку під час запуску опитування, OpenClaw переходить до long polling замість ще одного попереднього керувального виклику перед опитуванням. Все ще активний Webhook проявляється як конфлікт `getUpdates`; тоді OpenClaw перебудовує транспорт Telegram і повторює очищення Webhook.
    - Якщо сокети Telegram перезапускаються з коротким фіксованим інтервалом, перевірте, чи не є `channels.telegram.timeoutSeconds` занизьким; клієнти ботів обмежують налаштовані значення, нижчі за захисти вихідних запитів і запитів `getUpdates`, але старіші випуски могли переривати кожне опитування або відповідь, коли це значення було нижчим за ці захисти.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає опитування та перебудовує транспорт Telegram після 120 секунд без завершеної перевірки життєздатності long-poll за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис опитування не завершив `getUpdates` після стартового пільгового періоду, коли запущений обліковий запис Webhook не завершив `setWebhook` після стартового пільгового періоду або коли остання успішна активність транспорту опитування застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост все одно повідомляє про хибні перезапуски через зависання опитування. Постійні зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або вихідного TLS між хостом і `api.telegram.org`.
    - Telegram також враховує змінні середовища proxy процесу для транспорту Bot API, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти в нижньому регістрі. `NO_PROXY` / `no_proxy` все ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища, а стандартних змінних середовища proxy немає, Telegram також використовує цю URL-адресу для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим вихідним трафіком/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (окрім WSL2). Порядок результатів DNS для Telegram враховує спершу `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, потім `channels.telegram.network.dnsResultOrder`, потім типове значення процесу, як-от `NODE_OPTIONS=--dns-result-order=ipv4first`; якщо жодне не застосовується, Node 22+ повертається до `ipv4first`.
    - Якщо ваш хост є WSL2 або явно краще працює лише з IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді діапазону для бенчмарків RFC 2544 (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціального використання адресу під час завантаження медіа, ви можете
      увімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Така сама опція доступна для кожного облікового запису за адресою
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy розв'язує медіахости Telegram у `198.18.x.x`, спершу залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє діапазон
      бенчмарків RFC 2544 за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює SSRF-захисти
      медіа Telegram. Використовуйте це лише для довірених середовищ proxy,
      керованих оператором, як-от Clash, Mihomo або маршрутизація fake-IP Surge, коли вони
      синтезують приватні або спеціального використання відповіді поза діапазоном бенчмарків
      RFC 2544. Залишайте це вимкненим для звичайного публічного доступу Telegram через інтернет.
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

Додаткова допомога: [Усунення несправностей каналів](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="Найважливіші поля Telegram">

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` верхнього рівня (`type: "acp"`)
- схвалення exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- потокова передача: `streaming` (попередній перегляд), `streaming.preview.toolProgress`, `blockStreaming`
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
Пріоритет кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або додайте `channels.telegram.accounts.default`), щоб явно визначити типову маршрутизацію. Інакше OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` попереджає. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Telegram із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка списку дозволів для груп і тем.
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
