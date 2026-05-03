---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки бота Telegram, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-05-03T19:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06252b1540d5794aa5d8fe1066bf9d121e682a0df969a265d890445e97d5d647
    source_path: channels/telegram.md
    workflow: 16
---

Готово до продакшну для особистих повідомлень ботів і груп через grammY. Довге опитування є режимом за замовчуванням; режим Webhook необовʼязковий.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Політика особистих повідомлень за замовчуванням для Telegram — сполучення.
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
    Відкрийте Telegram і поспілкуйтеся з **@BotFather** (переконайтеся, що handle точно `@BotFather`).

    Виконайте `/newbot`, дотримуйтеся підказок і збережіть токен.

  </Step>

  <Step title="Налаштуйте токен і політику особистих повідомлень">

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

    Резервний варіант через env: `TELEGRAM_BOT_TOKEN=...` (лише обліковий запис за замовчуванням).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і схваліть перше особисте повідомлення">

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
Порядок визначення токена враховує обліковий запис. На практиці значення з config мають пріоритет над резервним env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Боти Telegram за замовчуванням використовують **Privacy Mode**, який обмежує, які групові повідомлення вони отримують.

    Якщо бот має бачити всі групові повідомлення, зробіть одне з двох:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму приватності видаліть і знову додайте бота в кожну групу, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі групові повідомлення, що корисно для постійної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups`, щоб дозволити або заборонити додавання до груп
    - `/setprivacy` для поведінки видимості в групах

  </Accordion>
</AccordionGroup>

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика особистих повідомлень">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потребує принаймні одного ID відправника в `allowFrom`)
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дозволяє будь-якому обліковому запису Telegram, який знайде або вгадає імʼя користувача бота, керувати ботом. Використовуйте це лише для навмисно публічних ботів із жорстко обмеженими інструментами; боти з одним власником мають використовувати `allowlist` з числовими ID користувачів.

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний верхньорівневий `channels.telegram.allowFrom` розглядається як межа безпеки: записи рівня облікового запису `allowFrom: ["*"]` не роблять цей обліковий запис публічним, якщо ефективний allowlist облікового запису після злиття все ще не містить явного wildcard.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі особисті повідомлення та відхиляється валідацією конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися і ваша конфігурація містить записи allowlist у форматі `@username`, виконайте `openclaw doctor --fix`, щоб їх вирішити (best-effort; потрібен токен бота Telegram).
    Якщо раніше ви покладалися на файли allowlist зі сховища сполучень, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу була стійко зафіксована в конфігурації (замість залежності від попередніх схвалень сполучення).

    Поширене непорозуміння: схвалення сполучення для особистих повідомлень не означає «цей відправник авторизований всюди».
    Сполучення надає доступ до особистих повідомлень. Якщо власника команд ще немає, перше схвалене сполучення також задає `commands.ownerAllowFrom`, щоб команди лише для власника та схвалення exec мали явний обліковий запис оператора.
    Авторизація відправника в групі все одно береться з явних allowlist у конфігурації.
    Якщо ви хочете «я авторизований один раз, і працюють як особисті повідомлення, так і групові команди», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

    ### Як знайти свій ID користувача Telegram

    Безпечніше (без стороннього бота):

    1. Напишіть своєму боту в особисті повідомлення.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній метод (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Два механізми застосовуються разом:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи заблоковані, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Відʼємні ID чатів належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення зі сховища сполучень для особистих повідомлень.
    Сполучення залишається лише для особистих повідомлень. Для груп задайте `groupAllowFrom` або `allowFrom` на рівні групи чи теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до config `allowFrom`, а не до сховища сполучень.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка про runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням закритий для відмови з `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` не задано явно.

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

      - Розміщуйте відʼємні ID чатів груп або супергруп Telegram, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Розміщуйте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть запускати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг говорити з ботом.

    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Групові відповіді за замовчуванням потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сесії:

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

    Отримання ID групового чату:

    - переслати групове повідомлення до `@userinfobot` / `@getidsbot`
    - або прочитати `chat.id` з `openclaw logs --follow`
    - або переглянути Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні повідомлення Telegram отримують відповіді назад у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний envelope каналу з метаданими відповіді та placeholders для медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- Особисті повідомлення можуть містити `message_thread_id`; OpenClaw зберігає ID потоку для відповідей, але за замовчуванням залишає особисті повідомлення у пласкій сесії. Налаштуйте `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` або відповідну конфігурацію теми, коли ви навмисно хочете ізоляцію сесій за темами в особистих повідомленнях.
- Довге опитування використовує grammY runner із послідовністю за чатом і потоком. Загальна конкурентність runner sink використовує `agents.defaults.maxConcurrent`.
- Довге опитування захищене всередині кожного процесу gateway, щоб лише один активний poller міг використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, інший gateway OpenClaw, скрипт або зовнішній poller, імовірно, використовує той самий токен.
- Перезапуски watchdog довгого опитування за замовчуванням спрацьовують після 120 секунд без завершеної liveness `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні перезапуски через зупинку опитування під час тривалої роботи. Значення в мілісекундах і дозволене від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує read receipts (`sendReadReceipts` не застосовується).

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може stream-ити часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` відповідає `partial` у Telegram (сумісність із міжканальним найменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме редаговане повідомлення попереднього перегляду (за замовчуванням: `true`, коли активний streaming попереднього перегляду)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; виконайте `openclaw doctor --fix`, щоб мігрувати їх до `channels.telegram.streaming.mode`

    Оновлення попереднього перегляду прогресу інструментів — це короткі рядки «Працюємо...», які показуються під час роботи інструментів, наприклад виконання команд, читання файлів, оновлення плану або підсумки patch. Telegram залишає їх увімкненими за замовчуванням, щоб відповідати випущеній поведінці OpenClaw від `v2026.4.22` і новіших версій. Щоб зберегти редагований попередній перегляд для тексту відповіді, але приховати рядки прогресу інструментів, задайте:

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

    Використовуйте `streaming.mode: "off"` лише тоді, коли потрібно доставляти тільки фінальну відповідь: редагування прев’ю в Telegram вимикаються, а загальні повідомлення інструментів/прогресу приглушуються замість надсилання окремих повідомлень «Працюю...». Запити на схвалення, медіа-вміст і помилки все одно проходять через звичайне фінальне доставлення. Використовуйте `streaming.preview.toolProgress: false`, коли потрібно залишити лише редагування прев’ю відповіді, приховавши рядки стану прогресу інструментів.

    <Note>
      Відповіді на вибрані цитати в Telegram є винятком. Коли `replyToMode` має значення `"first"`, `"all"` або `"batched"` і вхідне повідомлення містить текст вибраної цитати, OpenClaw надсилає фінальну відповідь через нативний шлях відповіді на цитату в Telegram замість редагування прев’ю відповіді, тому `streaming.preview.toolProgress` не може показати короткі рядки «Працюю...» для цього звернення. Відповіді на поточне повідомлення без тексту вибраної цитати все одно зберігають потокове прев’ю. Установіть `replyToMode: "off"`, коли видимість прогресу інструментів важливіша за нативні відповіді на цитати, або встановіть `streaming.preview.toolProgress: false`, щоб явно прийняти цей компроміс.
    </Note>

    Для відповідей лише з текстом:

    - короткі прев’ю в DM/групах/темах: OpenClaw зберігає те саме повідомлення прев’ю й виконує фінальне редагування на місці, якщо після появи прев’ю не було надіслано видимого повідомлення, що не є прев’ю
    - прев’ю, після яких іде видимий вивід, що не є прев’ю: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення й прибирає старіше прев’ю, тож фінальна відповідь з’являється після проміжного виводу
    - прев’ю, старші приблизно за одну хвилину: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення, а потім прибирає прев’ю, тож видима часова позначка Telegram відображає час завершення, а не час створення прев’ю

    Для складних відповідей (наприклад, медіа-вмісту) OpenClaw повертається до звичайного фінального доставлення, а потім прибирає повідомлення прев’ю.

    Потокове прев’ю відокремлене від блокового потокового передавання. Коли блокове потокове передавання явно ввімкнено для Telegram, OpenClaw пропускає потік прев’ю, щоб уникнути подвійного потокового передавання.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в живе прев’ю під час генерування
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування й резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown відображається як безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок розбору Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Прев’ю посилань увімкнені за замовчуванням і можуть бути вимкнені через `channels.telegram.linkPreview: false`.

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

    - назви нормалізуються (початковий `/` видаляється, літери переводяться в нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються й записуються в журнал

    Примітки:

    - користувацькі команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills усе одно можуть працювати під час введення, навіть якщо їх не показано в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Користувацькі команди або команди Plugin усе ще можуть реєструватися, якщо налаштовані.

    Поширені помилки налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнювалося після обрізання; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - Помилка `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, коли прямі команди Bot API через curl працюють, може означати, що `channels.telegram.apiRoot` було встановлено на повний endpoint `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється до опитування, тому це не повідомляється як збій очищення Webhook.
    - `setMyCommands failed` з помилками мережі/fetch зазвичай означає, що вихідні DNS/HTTPS-з’єднання до `api.telegram.org` заблоковані.

    ### Команди сполучення пристрою (Plugin `device-pair`)

    Коли Plugin `device-pair` установлено:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують (зокрема роль/області дії)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит в очікуванні
       - `/pair approve latest` для найновішого

    Код налаштування містить короткочасний bootstrap-токен. Вбудована передача bootstrap зберігає токен основного вузла на `scopes: []`; будь-який переданий токен оператора залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки областей дії bootstrap мають префікс ролі, тому цей allowlist оператора задовольняє лише запити оператора; неоператорським ролям усе ще потрібні області дії під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними автентифікації (наприклад, роллю/областями дії/відкритим ключем), попередній запит в очікуванні замінюється, а новий запит використовує інший `requestId`. Повторно виконайте `/pair pending` перед схваленням.

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
    - `allowlist` (типово)

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

    - `sendMessage` (`to`, `content`, необов’язкові `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язкові `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Елементи керування обмеженнями:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (типово: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час виконання використовують активний знімок конфігурації/секретів (запуск/перезавантаження), тому шляхи дій не виконують ситуативне повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке спричинило запуск
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (типово)
    - `first`
    - `all`

    Коли потоки відповідей увімкнені й оригінальний текст або підпис Telegram доступний, OpenClaw автоматично включає нативний уривок цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються з початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявні потоки відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму й поведінка потоків">
    Супергрупи форумів:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор набору спрямовуються до потоку теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Особливий випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` застосовується лише до теми й не успадковується з типових значень групи.

    **Маршрутизація агентів за темами**: кожна тема може маршрутизуватися до іншого агента через установлення `agentId` у конфігурації теми. Це дає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

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

    **Постійне прив’язування тем ACP**: теми форумів можуть закріплювати сесії harness ACP через типізовані прив’язки ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ідентифікатором із кваліфікатором теми, наприклад `-1001234567890:topic:42`). Наразі область дії обмежена темами форумів у групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Породження прив’язаного до потоку ACP з чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення спрямовуються туди напряму. OpenClaw закріплює підтвердження породження в темі. Потрібно, щоб `channels.telegram.threadBindings.spawnSessions` залишалося ввімкненим (типово: `true`).

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` за замовчуванням зберігають маршрутизацію DM і метадані відповіді в пласких сесіях; вони використовують ключі сесій із підтримкою потоків лише коли налаштовано `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` або відповідну конфігурацію теми. Використовуйте `channels.telegram.dm.threadReplies` верхнього рівня як типове значення облікового запису або `direct.<chatId>.threadReplies` для одного DM.

  </Accordion>

  <Accordion title="Аудіо, відео й стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки й аудіофайли.

    - типово: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає голосову нотатку
    - транскрипти вхідних голосових нотаток оформлюються в контексті агента як машинно згенерований,
      ненадійний текст; виявлення згадок усе одно використовує сирий
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

    Стікери описуються один раз (коли можливо) і кешуються, щоб зменшити кількість повторних викликів vision.

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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисного навантаження повідомлень).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (стандартно: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (стандартно: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (за найкращою спробою через кеш надісланих повідомлень).
    - Події реакцій усе одно враховують засоби контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ідентифікатори тредів в оновленнях реакцій.
      - нефорумні групи спрямовуються до сеансу групового чату
      - форумні групи спрямовуються до сеансу загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує unicode-емодзі (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Записи конфігурації каналу ввімкнені стандартно (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції групи (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
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

  <Accordion title="Long polling vs webhook">
    Стандартно використовується long polling. Для режиму webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов'язкові `webhookPath`, `webhookHost`, `webhookPort` (стандартні значення `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний слухач прив'язується до `127.0.0.1:8787`. Для публічного входу або поставте зворотний проксі перед локальним портом, або свідомо задайте `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє захисти запиту, секретний токен Telegram і JSON-тіло перед поверненням `200` до Telegram.
    Потім OpenClaw обробляє оновлення асинхронно через ті самі лінії бота для кожного чату/теми, що використовуються long polling, тому повільні ходи агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - Стандартне значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (стандартно 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.mediaGroupFlushMs` (стандартно 500) керує тим, як довго альбоми/медіагрупи Telegram буферизуються перед тим, як OpenClaw надсилає їх як одне вхідне повідомлення. Збільште це значення, якщо частини альбому надходять із запізненням; зменште його, щоб скоротити затримку відповіді на альбом.
    - `channels.telegram.timeoutSeconds` перевизначає час очікування клієнта Telegram API (якщо не задано, застосовується стандарт grammY). Клієнти ботів обмежують налаштовані значення, нижчі за 60-секундний захист вихідних запитів тексту/набирання, щоб grammY не переривав видиму доставку відповіді до того, як зможуть спрацювати транспортний захист і fallback OpenClaw. Long polling усе одно використовує 45-секундний захист запиту `getUpdates`, щоб неактивні опитування не залишалися покинутими безстроково.
    - `channels.telegram.pollingStallThresholdMs` стандартно має значення `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (стандартно 50); `0` вимикає.
    - додатковий контекст відповіді/цитати/пересилання наразі передається як отриманий.
    - allowlist Telegram насамперед обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Елементи керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до помічників надсилання Telegram (CLI/інструменти/дії) для відновлюваних вихідних помилок API. Доставка фінальної відповіді для вхідних повідомлень також використовує обмежений повтор safe-send для збоїв Telegram до підключення, але не повторює неоднозначні мережеві оболонки після надсилання, які можуть дублювати видимі повідомлення.

    Ціль надсилання CLI може бути числовим ID чату або ім'ям користувача:

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

    - `--presentation` з блоками `buttons` для inline-клавіатур, коли `channels.telegram.capabilities.inlineButtons` це дозволяє
    - `--pin` або `--delivery '{"pin":true}'`, щоб запросити закріплену доставку, коли бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайні надсилання ввімкненими

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram підтримує схвалення exec у DM схвалювачів і може необов'язково публікувати запити в початковому чаті або темі. Схвалювачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна визначити принаймні одного схвалювача)
    - `channels.telegram.execApprovals.approvers` (відступає до числових ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (стандартно) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` керують тим, хто може спілкуватися з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось схвалювачем exec. Перше схвалене спарювання DM ініціалізує `commands.ownerAllowFrom`, коли власника команд ще не існує, тому налаштування з одним власником усе одно працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє у форумну тему, OpenClaw зберігає тему для запиту схвалення та подальшого повідомлення. Схвалення exec стандартно спливають через 30 хвилин.

    Кнопки inline-схвалення також потребують, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID схвалень із префіксом `plugin:` визначаються через схвалення plugin; інші спершу визначаються через схвалення exec.

    Див. [Схвалення exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Елементи керування відповідями про помилки

Коли агент стикається з помилкою доставки або provider, Telegram може або відповісти текстом помилки, або приховати його. Цю поведінку контролюють два ключі конфігурації:

| Ключ                                | Значення          | Стандартно | Опис                                                                                                 |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю пригнічує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | число (мс)        | `60000`    | Мінімальний час між відповідями про помилки до того самого чату. Запобігає спаму помилками під час збоїв. |

Підтримуються перевизначення для окремих облікових записів, груп і тем (таке саме успадкування, як і для інших ключів конфігурації Telegram).

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
    - швидкий тест сеансу: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - коли існує `channels.telegram.groups`, група має бути в списку (або включати `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - авторизуйте свою ідентичність відправника (спарювання та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд plugin/skill/користувацьких команд або вимкніть нативні меню
    - стартові виклики `deleteMyCommands` / `setMyCommands` і виклики набирання `sendChatAction` обмежені й повторюються один раз через транспортний fallback Telegram у разі тайм-ауту запиту. Постійні мережеві/fetch-помилки зазвичай указують на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` — це збій автентифікації Telegram для налаштованого токена бота.
    - Повторно скопіюйте або згенеруйте заново токен бота в BotFather, а потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для типового облікового запису.
    - `deleteWebhook 401 Unauthorized` під час запуску також є збоєм автентифікації; трактування цього як "Webhook не існує" лише відкладе той самий збій через неправильний токен до пізніших викликів API.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ і власний fetch/proxy можуть спричинити негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку розв’язують `api.telegram.org` в IPv6; несправний вихідний IPv6-трафік може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює ці помилки як відновлювані мережеві помилки.
    - Під час запуску polling OpenClaw повторно використовує успішну стартову перевірку `getMe` для grammY, тому runner не потребує другого `getMe` перед першим `getUpdates`.
    - Якщо `deleteWebhook` завершується з тимчасовою мережевою помилкою під час запуску polling, OpenClaw переходить до long polling замість виконання ще одного контрольного виклику перед polling. Webhook, який усе ще активний, проявляється як конфлікт `getUpdates`; після цього OpenClaw перебудовує транспорт Telegram і повторює очищення Webhook.
    - Якщо сокети Telegram перевикористовуються за коротким фіксованим інтервалом, перевірте, чи не занизьке значення `channels.telegram.timeoutSeconds`; клієнти ботів обмежують налаштовані значення нижче за захисні межі вихідних запитів і `getUpdates`, але старіші випуски могли переривати кожен polling або відповідь, коли це значення було нижче за ці межі.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної перевірки життєздатності long-poll за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис polling не завершив `getUpdates` після стартового пільгового періоду, коли запущений обліковий запис Webhook не завершив `setWebhook` після стартового пільгового періоду або коли остання успішна активність транспорту polling застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` працюють справно, але ваш хост усе одно повідомляє про хибні перезапуски через зупинку polling. Постійні зупинки зазвичай вказують на проблеми proxy, DNS, IPv6 або вихідного TLS між хостом і `api.telegram.org`.
    - Telegram також враховує змінні середовища proxy процесу для транспорту Bot API, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти в нижньому регістрі. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища і стандартні змінні середовища proxy відсутні, Telegram також використовує цю URL-адресу для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим вихідним трафіком/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2). Порядок результатів DNS Telegram враховує `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, потім `channels.telegram.network.dnsResultOrder`, потім типовий порядок процесу, наприклад `NODE_OPTIONS=--dns-result-order=ipv4first`; якщо нічого не застосовується, Node 22+ повертається до `ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює лише з IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону для бенчмарків RFC 2544 (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціального використання адресу під час завантажень медіа, ви можете
      увімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне для кожного облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy розв’язує медіахости Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє діапазон
      бенчмарків RFC 2544 за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      медіа від SSRF. Використовуйте його лише для довірених середовищ proxy,
      контрольованих оператором, як-от маршрутизація fake-IP у Clash, Mihomo або Surge, коли вони
      синтезують приватні або спеціального використання відповіді поза діапазоном бенчмарків
      RFC 2544. Залишайте його вимкненим для звичайного доступу Telegram через публічний інтернет.
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

Додаткова допомога: [усунення неполадок каналів](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневі `bindings[]` (`type: "acp"`)
- схвалення виконання: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- потокова передача: `streaming` (попередній перегляд), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставлення: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- власний корінь API: `apiRoot` (лише корінь Bot API; не додавайте `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритет кількох облікових записів: коли налаштовано два або більше ідентифікаторів облікових записів, задайте `channels.telegram.defaultAccount` (або додайте `channels.telegram.accounts.default`), щоб зробити типову маршрутизацію явною. Інакше OpenClaw повертається до першого нормалізованого ідентифікатора облікового запису, і `openclaw doctor` попереджає про це. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Telegram із Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка allowlist для груп і тем.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставте групи й теми з агентами.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика.
  </Card>
</CardGroup>
