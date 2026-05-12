---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки, можливості та налаштування бота Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-12T12:48:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 185ac6051d3da2037b2727a6afca98bef946bc62c3f2b22cc9afe9831669297b
    source_path: channels/telegram.md
    workflow: 16
---

Готово для production-використання з DM ботів і групами через grammY. Long polling є режимом за замовчуванням; режим webhook є необов’язковим.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM для Telegram — сполучення.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і напишіть **@BotFather** (переконайтеся, що handle точно `@BotFather`).

    Запустіть `/newbot`, виконайте підказки та збережіть токен.

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
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у конфігурації/env, потім запустіть gateway.

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
    Додайте бота до своєї групи, потім отримайте обидва ID, потрібні для доступу групи:

    - ваш Telegram user ID, який використовується в `allowFrom` / `groupAllowFrom`
    - Telegram group chat ID, який використовується як ключ у `channels.telegram.groups`

    Для першого налаштування отримайте group chat ID з `openclaw logs --follow`, бота для forwarded-ID або Bot API `getUpdates`. Після дозволу групи `/whoami@<bot_username>` може підтвердити user і group IDs.

    Від’ємні Telegram supergroup IDs, що починаються з `-100`, є group chat IDs. Розміщуйте їх у `channels.telegram.groups`, а не в `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення конфігурації мають пріоритет над резервним env, а `TELEGRAM_BOT_TOKEN` застосовується лише до стандартного облікового запису.
</Note>

## Налаштування на стороні Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Боти Telegram за замовчуванням використовують **Privacy Mode**, який обмежує групові повідомлення, які вони отримують.

    Якщо бот має бачити всі групові повідомлення, зробіть одне з цього:

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
    `channels.telegram.dmPolicy` керує доступом до direct message:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен принаймні один sender ID у `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дає змогу будь-якому обліковому запису Telegram, який знайде або вгадає username бота, керувати ботом. Використовуйте це лише для навмисно публічних ботів із жорстко обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими user IDs.

    `channels.telegram.allowFrom` приймає числові Telegram user IDs. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний верхньорівневий `channels.telegram.allowFrom` розглядається як межа безпеки: записи рівня облікового запису `allowFrom: ["*"]` не роблять цей обліковий запис публічним, якщо ефективний allowlist облікового запису після злиття не містить явного wildcard.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється валідацією конфігурації.
    Налаштування запитує лише числові user IDs.
    Якщо ви оновилися і ваша конфігурація містить записи allowlist `@username`, запустіть `openclaw doctor --fix`, щоб їх розв’язати (найкраще можливе відновлення; потрібен Telegram bot token).
    Якщо раніше ви покладалися на файли allowlist зі сховища сполучень, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних IDs).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими IDs у `allowFrom`, щоб політика доступу була надійно закріплена в конфігурації (а не залежала від попередніх схвалень сполучення).

    Поширена плутанина: схвалення сполучення DM не означає «цей відправник авторизований скрізь».
    Сполучення надає доступ до DM. Якщо command owner ще не існує, перше схвалене сполучення також встановлює `commands.ownerAllowFrom`, щоб команди лише для власника та схвалення exec мали явний обліковий запис оператора.
    Авторизація відправника в групі все одно походить з явних allowlists конфігурації.
    Якщо ви хочете «я авторизований один раз, і працюють як DM, так і групові команди», додайте свій числовий Telegram user ID у `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

    ### Як знайти свій Telegram user ID

    Безпечніше (без стороннього бота):

    1. Напишіть DM своєму боту.
    2. Запустіть `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній метод (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlists">
    Два засоби керування застосовуються разом:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає конфігурації `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки group-ID
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні IDs або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групі. Якщо його не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими Telegram user IDs (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте Telegram group або supergroup chat IDs у `groupAllowFrom`. Від’ємні chat IDs належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення DM зі сховища сполучень.
    Сполучення лишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` на рівні групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до конфігураційного `allowFrom`, а не до сховища сполучень.
    Практичний шаблон для ботів з одним власником: задайте свій user ID у `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням використовує fail-closed `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` явно не задано.

    Налаштування групи лише для власника:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Перевірте це з групи за допомогою `@<bot_username> ping`. Звичайні групові повідомлення не запускають бота, доки `requireMention: true`.

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

      - Розміщуйте від’ємні Telegram group або supergroup chat IDs, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Розміщуйте Telegram user IDs, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть запускати бота.
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

    Вони оновлюють лише стан сесії. Для сталості використовуйте конфігурацію.

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

    Отримання group chat ID:

    - перешліть групове повідомлення до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перевірте Bot API `getUpdates`
    - після дозволу групи запустіть `/whoami@<bot_username>`, якщо нативні команди ввімкнені

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні Telegram відповідають назад у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний envelope каналу з метаданими відповіді, placeholders для медіа та збереженим контекстом ланцюжка відповідей для відповідей Telegram, які спостерігав gateway.
- Групові сесії ізольовані за group ID. Forum topics додають `:topic:<threadId>`, щоб ізолювати topics.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw зберігає thread ID для відповідей, але за замовчуванням тримає DM у плоскій сесії. Налаштуйте `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` або відповідну конфігурацію topic, коли ви навмисно хочете ізоляцію сесій DM topic.
- Long polling використовує grammY runner із послідовністю на рівні чату/потоку. Загальна concurrency runner sink використовує `agents.defaults.maxConcurrent`.
- Long polling захищений усередині кожного процесу gateway, щоб лише один активний poller міг використовувати bot token одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, імовірно, інший OpenClaw gateway, скрипт або зовнішній poller використовує той самий токен.
- Перезапуски long-polling watchdog за замовчуванням запускаються після 120 секунд без завершеної liveness `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні перезапуски через polling-stall під час довготривалої роботи. Значення в мілісекундах і дозволене в діапазоні від `30000` до `600000`; підтримуються перевизначення на рівні облікового запису.
- Telegram Bot API не має підтримки read-receipt (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - direct chats: повідомлення попереднього перегляду + `editMessageText`
    - групи/topics: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (стандартно: `partial`)
    - `progress` утримує один редагований чернетковий статус для перебігу виконання інструментів, очищає його після завершення й надсилає фінальну відповідь як звичайне повідомлення
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/перебігу повторно використовують те саме редаговане повідомлення попереднього перегляду (стандартно: `true`, коли потоковий попередній перегляд активний)
    - `streaming.preview.commandText` керує деталями команд/виконання всередині цих рядків перебігу виконання інструментів: `raw` (стандартно, зберігає випущену поведінку) або `status` (лише мітка інструмента)
    - застарілі значення `channels.telegram.streamMode` і булеві значення `streaming` виявляються; запустіть `openclaw doctor --fix`, щоб мігрувати їх у `channels.telegram.streaming.mode`

    Оновлення попереднього перегляду перебігу виконання інструментів — це короткі рядки статусу, які показуються під час роботи інструментів, наприклад виконання команд, читання файлів, оновлення планування або підсумки патчів. Telegram вмикає їх стандартно, щоб відповідати випущеній поведінці OpenClaw від `v2026.4.22` і пізніше. Щоб зберегти редагований попередній перегляд для тексту відповіді, але приховати рядки перебігу виконання інструментів, задайте:

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

    Щоб залишити перебіг виконання інструментів видимим, але приховати текст команд/виконання, задайте:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Використовуйте режим `progress`, коли вам потрібен видимий перебіг виконання інструментів без редагування фінальної відповіді в тому самому повідомленні. Розмістіть політику тексту команд у `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Використовуйте `streaming.mode: "off"` лише тоді, коли потрібна доставка тільки фінального результату: редагування попереднього перегляду Telegram вимикаються, а загальні повідомлення про інструменти/перебіг пригнічуються замість надсилання як окремі статусні повідомлення. Запити на схвалення, медіанавантаження й помилки все одно проходять через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли потрібно лише зберегти редагування попереднього перегляду відповіді, приховуючи рядки статусу перебігу виконання інструментів.

    <Note>
      Відповіді з вибраними цитатами в Telegram є винятком. Коли `replyToMode` дорівнює `"first"`, `"all"` або `"batched"` і вхідне повідомлення містить текст вибраної цитати, OpenClaw надсилає фінальну відповідь через нативний шлях quote-reply Telegram замість редагування попереднього перегляду відповіді, тому `streaming.preview.toolProgress` не може показати короткі рядки статусу для цього ходу. Відповіді на поточне повідомлення без тексту вибраної цитати все ще зберігають потоковий попередній перегляд. Задайте `replyToMode: "off"`, коли видимість перебігу виконання інструментів важливіша за нативні quote-reply, або задайте `streaming.preview.toolProgress: false`, щоб визнати цей компроміс.
    </Note>

    Для текстових відповідей:

    - короткі попередні перегляди в особистих повідомленнях/групах/темах: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці
    - довгі фінальні тексти, що розбиваються на кілька повідомлень Telegram, повторно використовують наявний попередній перегляд як перший фінальний фрагмент, коли це можливо, а потім надсилають лише решту фрагментів
    - фінальні результати режиму progress очищають чернетку статусу й використовують звичайну фінальну доставку замість редагування чернетки у відповідь
    - якщо фінальне редагування не вдається до підтвердження завершеного тексту, OpenClaw використовує звичайну фінальну доставку й очищає застарілий попередній перегляд

    Для складних відповідей (наприклад, медіанавантажень) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Потоковий попередній перегляд відокремлений від блокового потокового передавання. Коли блокове потокове передавання явно ввімкнено для Telegram, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в live-попередній перегляд під час генерації
    - попередній перегляд міркувань видаляється після фінальної доставки; використовуйте `/reasoning on`, коли міркування мають залишатися видимими
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Markdown-подібний текст рендериться в безпечний для Telegram HTML.
    - Підтримувані HTML-теги Telegram зберігаються; непідтримуваний HTML екранується.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює надсилання як звичайний текст.

    Попередні перегляди посилань увімкнені стандартно й можуть бути вимкнені за допомогою `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди й користувацькі команди">
    Реєстрація меню команд Telegram обробляється під час запуску за допомогою `setMyCommands`.

    Стандартні значення нативних команд:

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

    - назви нормалізуються (видаляється початковий `/`, нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються й логуються

    Примітки:

    - користувацькі команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди plugin/skill усе ще можуть працювати під час введення, навіть якщо їх не показано в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Користувацькі/plugin-команди все ще можуть реєструватися, якщо налаштовані.

    Поширені помилки налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після обрізання; зменште кількість команд plugin/skill/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - помилка `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, коли прямі curl-команди Bot API працюють, може означати, що `channels.telegram.apiRoot` було встановлено на повну кінцеву точку `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється до polling, тому це не повідомляється як помилка очищення webhook.
    - `setMyCommands failed` з помилками мережі/fetch зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблоковано.

    ### Команди сполучення пристрою (`device-pair` plugin)

    Коли встановлено `device-pair` plugin:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують (включно з роллю/областями дії)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит, що очікує
       - `/pair approve latest` для найновішого

    Код налаштування містить короткостроковий bootstrap-токен. Вбудована передача bootstrap зберігає токен основного вузла на `scopes: []`; будь-який переданий операторський токен залишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки областей дії bootstrap мають префікс ролі, тому цей allowlist оператора задовольняє лише операторські запити; неоператорські ролі все ще потребують областей дії під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими деталями автентифікації (наприклад, роллю/областями дії/публічним ключем), попередній запит, що очікує, замінюється, а новий запит використовує інший `requestId`. Повторно запустіть `/pair pending` перед схваленням.

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

    Перевизначення для окремого акаунта:

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
    - `allowlist` (стандартно)

    Застаріле `capabilities: ["inlineButtons"]` зіставляється з `inlineButtons: "all"`.

    Приклад дії з повідомленням:

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
    - `channels.telegram.actions.sticker` (стандартно: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені стандартно й не мають окремих перемикачів `channels.telegram.actions.*`.
    Runtime-надсилання використовують активний знімок конфігурації/секретів (запуск/перезавантаження), тому шляхи дій не виконують спеціальне повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення-тригер
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (стандартно)
    - `first`
    - `all`

    Коли потоки відповідей увімкнені й оригінальний текст або підпис Telegram доступний, OpenClaw автоматично включає нативний фрагмент цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються від початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявні потоки відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форумів:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді й індикатор набору тексту спрямовуються в потік теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все ще включають `message_thread_id`

    Успадкування теми: записи теми успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` стосується лише теми й не успадковується зі стандартних налаштувань групи.

    **Маршрутизація агентів за темами**: кожна тема може маршрутизуватися до іншого агента через встановлення `agentId` у конфігурації теми. Це дає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

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

    **Постійне прив’язування тем ACP**: теми форуму можуть закріплювати сесії ACP harness через типізовані ACP-прив’язування верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ідентифікатором із темою, як-от `-1001234567890:topic:42`). Наразі обмежено темами форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Запуск ACP із чату, прив’язаний до гілки**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової ACP-сесії; подальші повідомлення спрямовуються безпосередньо туди. OpenClaw закріплює підтвердження запуску в темі. Потрібно, щоб `channels.telegram.threadBindings.spawnSessions` залишалося ввімкненим (за замовчуванням: `true`).

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` за замовчуванням зберігають маршрутизацію DM і метадані відповіді у пласких сесіях; вони використовують ключі сесій з урахуванням гілок лише тоді, коли налаштовано `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` або відповідну конфігурацію теми. Використовуйте верхньорівневий `channels.telegram.dm.threadReplies` як типове значення для акаунта або `direct.<chatId>.threadReplies` для одного DM.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає голосову нотатку
    - транскрипти вхідних голосових нотаток оформлюються як машинно згенерований,
      недовірений текст у контексті агента; виявлення згадок усе одно використовує сирий
      транскрипт, тому голосові повідомлення з обмеженням за згадкою продовжують працювати.

    Приклад дії з повідомленням:

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

    Приклад дії з повідомленням:

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

    Стікери описуються один раз (коли можливо) і кешуються, щоб зменшити повторні виклики зору.

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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисного навантаження повідомлення).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (за принципом найкращої спроби через кеш надісланих повідомлень).
    - Події реакцій і далі дотримуються правил доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ідентифікатори гілок в оновленнях реакцій.
      - групи без форуму маршрутизуються до сесії групового чату
      - групи-форуми маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для опитування/Webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - запасний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує unicode-емодзі (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або акаунта.

  </Accordion>

  <Accordion title="Записи конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнені за замовчуванням (`configWrites !== false`).

    Записи, спричинені Telegram, включають:

    - події міграції груп (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
    - `/config set` і `/config unset` (потрібне ввімкнення команди)

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
    За замовчуванням використовується довге опитування. Для режиму Webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язкові `webhookPath`, `webhookHost`, `webhookPort` (за замовчуванням `/telegram-webhook`, `127.0.0.1`, `8787`).

    У режимі довгого опитування OpenClaw зберігає свій водяний знак перезапуску лише після успішного диспетчеризування оновлення. Якщо обробник завершується з помилкою, це оновлення залишається доступним для повторної спроби в тому самому процесі й не записується як завершене для дедуплікації після перезапуску.

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного входу або поставте зворотний проксі перед локальним портом, або навмисно задайте `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє захисти запиту, секретний токен Telegram і JSON-тіло перед поверненням `200` до Telegram.
    Потім OpenClaw обробляє оновлення асинхронно через ті самі бот-лінії на чат/тему, що використовуються довгим опитуванням, тому повільні ходи агента не блокують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Обмеження, повторні спроби та цілі CLI">
    - `channels.telegram.textChunkLimit` за замовчуванням дорівнює 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.mediaGroupFlushMs` (за замовчуванням 500) керує тим, як довго альбоми/медіагрупи Telegram буферизуються перед тим, як OpenClaw диспетчеризує їх як одне вхідне повідомлення. Збільшіть це значення, якщо частини альбому надходять із запізненням; зменшіть його, щоб скоротити затримку відповіді на альбом.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується типове значення grammY). Клієнти ботів обмежують налаштовані значення нижче 60-секундного захисту вихідного запиту тексту/набору, щоб grammY не переривав видиму доставку відповіді до того, як зможуть спрацювати транспортний захист і запасний механізм OpenClaw. Довге опитування й далі використовує 45-секундний захист запиту `getUpdates`, щоб бездіяльні опитування не залишалися покинутими безстроково.
    - `channels.telegram.pollingStallThresholdMs` за замовчуванням дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання опитування.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає.
    - додатковий контекст відповіді/цитати/пересилання нормалізується в одне вибране вікно контексту розмови, коли Gateway спостерігав батьківські повідомлення; кеш спостережених повідомлень зберігається поруч зі сховищем сесій. Telegram включає в оновлення лише один поверхневий `reply_to_message`, тому ланцюжки, старші за кеш, обмежені поточним корисним навантаженням оновлення Telegram.
    - allowlist Telegram переважно обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - конфігурація `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/інструменти/дії) для відновлюваних вихідних помилок API. Доставка фінальної вхідної відповіді також використовує обмежену повторну спробу безпечного надсилання для помилок Telegram до підключення, але не повторює неоднозначні мережеві оболонки після надсилання, які можуть дублювати видимі повідомлення.

    Цілі надсилання CLI та інструменту повідомлень можуть бути числовим ID чату, іменем користувача або ціллю теми форуму:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Опитування Telegram використовують `openclaw message poll` і підтримують теми форуму:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Прапорці опитування лише для Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` для тем форуму (або використовуйте ціль `:topic:`)

    Надсилання Telegram також підтримує:

    - `--presentation` з блоками `buttons` для вбудованих клавіатур, коли `channels.telegram.capabilities.inlineButtons` це дозволяє
    - `--pin` або `--delivery '{"pin":true}'`, щоб запросити закріплену доставку, коли бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення, GIF і відео як документи замість стиснених фото, анімованих медіа або відеозавантажень

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Підтвердження exec у Telegram">
    Telegram підтримує підтвердження exec у DM схвалювачів і може необов’язково публікувати запити в початковому чаті або темі. Схвалювачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна визначити принаймні одного схвалювача)
    - `channels.telegram.execApprovals.approvers` (повертається до числових ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (за замовчуванням) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` керують тим, хто може говорити з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось схвалювачем exec. Перше схвалене DM-спарювання ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тому налаштування з одним власником і далі працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему для запиту схвалення та подальшої відповіді. Підтвердження exec за замовчуванням спливають через 30 хвилин.

    Вбудовані кнопки схвалення також вимагають, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID схвалення з префіксом `plugin:` розв’язуються через схвалення plugin; інші спочатку розв’язуються через підтвердження exec.

    Див. [Підтвердження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або приховати її. Цю поведінку керують два ключі конфігурації:

| Ключ                                | Значення          | Типово  | Опис                                                                                                      |
| ----------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю пригнічує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями про помилки в той самий чат. Запобігає спаму помилками під час збоїв.     |

Підтримуються перевизначення для окремих облікових записів, груп і тем (те саме успадкування, що й для інших ключів конфігурації Telegram).

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

  <Accordion title="Бот узагалі не бачить групові повідомлення">

    - коли існує `channels.telegram.groups`, група має бути в списку (або містити `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють узагалі">

    - авторизуйте ідентичність відправника (спарювання та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що в нативному меню забагато записів; зменште кількість команд plugin/skill/користувацьких команд або вимкніть нативні меню
    - стартові виклики `deleteMyCommands` / `setMyCommands` і виклики індикації набору `sendChatAction` обмежені за часом і повторюються один раз через резервний транспорт Telegram у разі тайм-ауту запиту. Постійні помилки мережі/fetch зазвичай вказують на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Під час запуску повідомляється про неавторизований токен">

    - `getMe returned 401` — це помилка автентифікації Telegram для налаштованого токена бота.
    - Скопіюйте повторно або згенеруйте заново токен бота в BotFather, потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для облікового запису за замовчуванням.
    - `deleteWebhook 401 Unauthorized` під час запуску також є помилкою автентифікації; трактування цього як "webhook не існує" лише відклало б ту саму помилку поганого токена до пізніших викликів API.

  </Accordion>

  <Accordion title="Нестабільність опитування або мережі">

    - Node 22+ + користувацький fetch/proxy може спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку розв’язують `api.telegram.org` в IPv6; несправний вихід IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює їх як відновлювані мережеві помилки.
    - Під час запуску опитування OpenClaw повторно використовує успішну стартову перевірку `getMe` для grammY, тож runner не потребує другого `getMe` перед першим `getUpdates`.
    - Якщо `deleteWebhook` завершується тимчасовою мережевою помилкою під час запуску опитування, OpenClaw переходить до long polling замість ще одного передопитувального виклику control-plane. Активний webhook проявляється як конфлікт `getUpdates`; тоді OpenClaw перебудовує транспорт Telegram і повторює очищення webhook.
    - Якщо сокети Telegram повторно створюються з коротким фіксованим інтервалом, перевірте, чи не занизьке `channels.telegram.timeoutSeconds`; клієнти ботів обмежують налаштовані значення нижче outbound-запобіжників і запобіжників запитів `getUpdates`, але старіші випуски могли переривати кожне опитування або відповідь, коли це значення було нижчим за ці запобіжники.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає опитування і перебудовує транспорт Telegram після 120 секунд без завершеної перевірки живучості long-poll за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис опитування не завершив `getUpdates` після пільгового періоду запуску, коли запущений webhook-обліковий запис не завершив `setWebhook` після пільгового періоду запуску, або коли остання успішна активність транспорту опитування застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе одно повідомляє про хибні перезапуски через зупинку опитування. Постійні зупинки зазвичай вказують на проблеми proxy, DNS, IPv6 або вихідного TLS між хостом і `api.telegram.org`.
    - Telegram також враховує env proxy процесу для транспорту Bot API, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти в нижньому регістрі. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища і стандартних env proxy немає, Telegram також використовує цю URL-адресу для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим виходом/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ типово використовує `autoSelectFamily=true` (крім WSL2). Порядок результатів DNS Telegram враховує `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, потім `channels.telegram.network.dnsResultOrder`, потім типовий параметр процесу, наприклад `NODE_OPTIONS=--dns-result-order=ipv4first`; якщо нічого не застосовується, Node 22+ повертається до `ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює з поведінкою лише IPv4, примусово задайте вибір family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з benchmark-діапазону RFC 2544 (`198.18.0.0/15`) уже дозволені
      для завантаження медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціального використання адресу під час завантаження медіа, можна ввімкнути
      обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне для кожного облікового запису за адресою
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy розв’язує медіахости Telegram у `198.18.x.x`, спершу залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє benchmark-діапазон
      RFC 2544 за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захисти Telegram
      media SSRF. Використовуйте це лише для довірених proxy-середовищ під контролем оператора,
      як-от маршрутизація fake-IP у Clash, Mihomo або Surge, коли вони
      синтезують приватні або спеціального використання відповіді поза benchmark-діапазоном
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

<Accordion title="Високосигнальні поля Telegram">

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- схвалення exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (попередній перегляд), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- користувацький корінь API: `apiRoot` (лише корінь Bot API; не додавайте `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритетність кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або додайте `channels.telegram.accounts.default`), щоб зробити маршрутизацію за замовчуванням явною. Інакше OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` попереджає. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Спарювання" icon="link" href="/uk/channels/pairing">
    Спаруйте користувача Telegram із gateway.
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
    Зіставте групи й теми з агентами.
  </Card>
  <Card title="Усунення несправностей" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика.
  </Card>
</CardGroup>
