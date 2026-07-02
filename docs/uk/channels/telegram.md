---
read_when:
    - Робота з функціями Telegram або Webhook'ами
summary: Стан підтримки, можливості та конфігурація бота Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:45:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

Готово до production для DM ботів і груп через grammY. Long polling є режимом за замовчуванням; режим webhook необов’язковий.

<CardGroup cols={3}>
  <Card title="Зв’язування" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — зв’язування.
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
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у конфігурації/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди зв’язування спливають через 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, а потім отримайте обидва ID, потрібні для доступу до групи:

    - ваш Telegram user ID, використовується в `allowFrom` / `groupAllowFrom`
    - Telegram group chat ID, використовується як ключ у `channels.telegram.groups`

    Для першого налаштування отримайте group chat ID з `openclaw logs --follow`, бота для forwarded-ID або Bot API `getUpdates`. Після того як групу дозволено, `/whoami@<bot_username>` може підтвердити ID користувача та групи.

    Від’ємні ID супергруп Telegram, які починаються з `-100`, є group chat IDs. Розміщуйте їх у `channels.telegram.groups`, а не в `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення конфігурації мають пріоритет над резервним env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
Після успішного запуску OpenClaw кешує ідентичність бота в каталозі стану на строк до 24 годин, щоб перезапуски могли уникнути додаткового виклику Telegram `getMe`; зміна або видалення токена очищає цей кеш.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість груп">
    Боти Telegram за замовчуванням використовують **Privacy Mode**, який обмежує, які повідомлення груп вони отримують.

    Якщо бот має бачити всі повідомлення групи, зробіть одне з такого:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Під час перемикання режиму приватності видаліть і повторно додайте бота в кожній групі, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups` для дозволу/заборони додавання до груп
    - `/setprivacy` для поведінки видимості в групах

  </Accordion>
</AccordionGroup>

## Контроль доступу та активація

### Ідентичність бота в групі

У групах Telegram і темах форумів явна згадка налаштованого handle бота (наприклад, `@my_bot`) трактується як звернення до вибраного агента OpenClaw, навіть якщо ім’я persona агента відрізняється від імені користувача Telegram. Політика тиші групи все одно застосовується до нерелевантного групового трафіку, але сам handle бота не вважається «кимось іншим».

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен принаймні один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дозволяє будь-якому обліковому запису Telegram, який знайде або вгадає ім’я користувача бота, керувати ботом. Використовуйте це лише для навмисно публічних ботів із суворо обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими user ID.

    `channels.telegram.allowFrom` приймає числові Telegram user IDs. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний верхньорівневий `channels.telegram.allowFrom` трактується як межа безпеки: записи рівня облікового запису `allowFrom: ["*"]` не роблять цей обліковий запис публічним, якщо ефективний allowlist облікового запису після злиття все ще не містить явного wildcard.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється валідацією конфігурації.
    Налаштування запитує лише числові user IDs.
    Якщо ви оновилися і ваша конфігурація містить записи allowlist `@username`, виконайте `openclaw doctor --fix`, щоб їх розв’язати (best-effort; потрібен токен бота Telegram).
    Якщо раніше ви покладалися на файли allowlist зі сховища зв’язувань, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу була стійкою в конфігурації (замість залежності від попередніх схвалень зв’язування).

    Поширена плутанина: схвалення зв’язування DM не означає «цей відправник авторизований усюди».
    Зв’язування надає доступ до DM. Якщо власника команд ще немає, перше схвалене зв’язування також встановлює `commands.ownerAllowFrom`, щоб команди лише для власника та схвалення exec мали явний обліковий запис оператора.
    Авторизація відправника в групі все одно походить із явних allowlist у конфігурації.
    Якщо ви хочете «я авторизований один раз, і працюють як DM, так і групові команди», додайте свій числовий Telegram user ID до `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

    ### Пошук вашого Telegram user ID

    Безпечніше (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній метод (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlists">
    Два елементи керування застосовуються разом:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає конфігурації `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки group-ID
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи заблоковані, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: діє як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групі. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими Telegram user IDs (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте Telegram group або supergroup chat IDs до `groupAllowFrom`. Від’ємні chat IDs належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення зі сховища зв’язувань DM.
    Зв’язування залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` для окремої групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до конфігураційного `allowFrom`, а не до сховища зв’язувань.
    Практичний шаблон для ботів з одним власником: задайте свій user ID у `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням fail-closed із `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` не задано явно.

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

    Перевірте це з групи за допомогою `@<bot_username> ping`. Звичайні повідомлення групи не запускають бота, поки `requireMention: true`.

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
      - Розміщуйте Telegram user IDs, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди в дозволеній групі можуть запускати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг говорити з ботом.

    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Відповіді в групі за замовчуванням потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Використовуйте конфігурацію для постійності.

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

    Контекст історії групи завжди ввімкнений для груп і обмежений
    `historyLimit`. Задайте `channels.telegram.historyLimit: 0`, щоб вимкнути
    вікно історії групи Telegram. Застарілий ключ `includeGroupHistoryContext`
    видаляється через `openclaw doctor --fix`.

    Отримання group chat ID:

    - перешліть повідомлення групи до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перегляньте Bot API `getUpdates`
    - після того як групу дозволено, виконайте `/whoami@<bot_username>`, якщо нативні команди ввімкнені

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу Gateway.
- Маршрутизація детермінована: вхідні повідомлення Telegram отримують відповіді назад у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються у спільний конверт каналу з метаданими відповіді, заповнювачами медіа та збереженим контекстом ланцюжка відповідей для відповідей Telegram, які спостерігав Gateway.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- Повідомлення DM можуть містити `message_thread_id`; OpenClaw зберігає його для відповідей. Сесії тем DM розділяються лише тоді, коли Telegram `getMe` повідомляє `has_topics_enabled: true` для бота; інакше DM залишаються у плоскій сесії.
- Long polling використовує grammY runner із послідовністю на рівні чату/треду. Загальна конкуренція runner sink використовує `agents.defaults.maxConcurrent`.
- Запуск кількох акаунтів обмежує паралельні Telegram `getMe` probes, щоб великі парки ботів не запускали probes для всіх акаунтів одночасно.
- Long polling захищено всередині кожного процесу Gateway, тому лише один активний poller може використовувати токен бота в певний момент. Якщо ви все ще бачите конфлікти `getUpdates` 409, імовірно, той самий токен використовує інший OpenClaw Gateway, скрипт або зовнішній poller.
- Перезапуски watchdog для long-polling за замовчуванням спрацьовують після 120 секунд без завершеної перевірки життєздатності `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні перезапуски через polling-stall під час тривалої роботи. Значення вказується в мілісекундах і дозволене в діапазоні від `30000` до `600000`; підтримуються перевизначення для окремих акаунтів.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

<Note>
  `channels.telegram.dm.threadReplies` і `channels.telegram.direct.<chatId>.threadReplies` були видалені. Запустіть `openclaw doctor --fix` після оновлення, якщо ваша конфігурація все ще має ці ключі. Маршрутизація тем DM тепер відповідає можливості бота з Telegram `getMe.has_topics_enabled`, якою керує threaded mode у BotFather: боти з увімкненими темами використовують DM-сесії, обмежені тредом, коли Telegram надсилає `message_thread_id`; інші DM залишаються у плоскій сесії.
</Note>

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - короткі початкові попередні перегляди відповіді debounce-яться, а потім матеріалізуються після обмеженої затримки, якщо запуск усе ще активний
    - `progress` утримує один редагований чернетковий статус для прогресу інструментів, показує стабільну мітку статусу, коли активність відповіді надходить до прогресу інструментів, очищає його після завершення й надсилає фінальну відповідь як звичайне повідомлення
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме редаговане повідомлення попереднього перегляду (за замовчуванням: `true`, коли активна трансляція попереднього перегляду)
    - `streaming.preview.commandText` керує деталями command/exec у цих рядках прогресу інструментів: `raw` (за замовчуванням, зберігає поведінку релізу) або `status` (лише мітка інструмента)
    - `streaming.progress.commentary` (за замовчуванням: `false`) вмикає текст коментаря/преамбули асистента в тимчасовій чернетці прогресу
    - застарілі `channels.telegram.streamMode`, булеві значення `streaming` і вилучені ключі нативного попереднього перегляду чернеток виявляються; запустіть `openclaw doctor --fix`, щоб мігрувати їх до поточної конфігурації streaming

    Оновлення попереднього перегляду прогресу інструментів — це короткі рядки статусу, що показуються під час роботи інструментів, наприклад виконання команд, читання файлів, оновлення планування, підсумки патчів або текст преамбули/коментаря Codex у режимі app-server Codex. Telegram залишає їх увімкненими за замовчуванням, щоб відповідати поведінці OpenClaw у релізах від `v2026.4.22` і пізніших.

    Щоб зберегти редагований попередній перегляд для тексту відповіді, але приховати рядки прогресу інструментів, задайте:

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

    Щоб залишити прогрес інструментів видимим, але приховати текст command/exec, задайте:

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

    Використовуйте режим `progress`, коли хочете бачити прогрес інструментів без редагування фінальної відповіді в тому самому повідомленні. Розмістіть політику command-text у `streaming.progress`:

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

    Використовуйте `streaming.mode: "off"` лише тоді, коли потрібна доставка тільки фінального повідомлення: редагування попереднього перегляду Telegram вимикаються, а загальний шум інструментів/прогресу пригнічується замість надсилання як окремих статусних повідомлень. Запити на схвалення, медіанавантаження та помилки все ще проходять через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли хочете зберегти лише редагування попереднього перегляду відповіді, приховавши статусні рядки прогресу інструментів.

    <Note>
      Вибрані цитовані відповіді Telegram є винятком. Коли `replyToMode` має значення `"first"`, `"all"` або `"batched"` і вхідне повідомлення містить вибраний текст цитати, OpenClaw надсилає фінальну відповідь через нативний шлях quote-reply Telegram замість редагування попереднього перегляду відповіді, тому `streaming.preview.toolProgress` не може показувати короткі рядки статусу для цього ходу. Відповіді на поточне повідомлення без вибраного тексту цитати все ще зберігають трансляцію попереднього перегляду. Задайте `replyToMode: "off"`, коли видимість прогресу інструментів важливіша за нативні цитовані відповіді, або задайте `streaming.preview.toolProgress: false`, щоб прийняти цей компроміс.
    </Note>

    Для відповідей лише з текстом:

    - короткі попередні перегляди DM/груп/тем: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці
    - довгі фінальні тексти, що розбиваються на кілька повідомлень Telegram, за можливості повторно використовують наявний попередній перегляд як перший фінальний фрагмент, а потім надсилають лише решту фрагментів
    - фінальні відповіді в режимі progress очищають чернетку статусу та використовують звичайну фінальну доставку замість редагування чернетки у відповідь
    - якщо фінальне редагування не вдається до підтвердження завершеного тексту, OpenClaw використовує звичайну фінальну доставку й очищає застарілий попередній перегляд

    Для складних відповідей (наприклад, медіанавантажень) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Трансляція попереднього перегляду відокремлена від block streaming. Коли block streaming явно ввімкнено для Telegram, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійної трансляції.

    Поведінка трансляції reasoning:

    - `/reasoning stream` використовує шлях попереднього перегляду reasoning підтримуваного каналу; у Telegram він транслює reasoning у live preview під час генерації
    - попередній перегляд reasoning видаляється після фінальної доставки; використовуйте `/reasoning on`, коли reasoning має залишатися видимим
    - фінальна відповідь надсилається без тексту reasoning

  </Accordion>

  <Accordion title="Rich message formatting">
    Вихідний текст за замовчуванням використовує стандартні HTML-повідомлення Telegram, щоб відповіді залишалися читабельними в поточних клієнтах Telegram. Цей режим сумісності підтримує звичайний жирний шрифт, курсив, посилання, код, спойлери й цитати, але не rich-only блоки Bot API 10.1, як-от нативні таблиці, details, rich media та формули.

    Задайте `channels.telegram.richMessages: true`, щоб увімкнути rich messages Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Коли ввімкнено:

    - Агенту повідомляється, що rich messages Telegram доступні для цього бота/акаунта.
    - Текст Markdown рендериться через Markdown IR OpenClaw і надсилається як rich HTML Telegram.
    - Явні rich HTML payloads зберігають підтримувані теги Bot API 10.1, як-от заголовки, таблиці, details, rich media та формули.
    - Підписи до медіа все ще використовують HTML-підписи Telegram, бо rich messages не замінюють підписи.

    Це ізолює текст моделі від сигіл Telegram Rich Markdown, тому валюта на кшталт `$400-600K` не розбирається як математика. Довгий rich text автоматично розбивається відповідно до обмежень rich text і rich block у Telegram. Таблиці, що перевищують ліміт колонок Telegram, надсилаються як блоки коду.

    За замовчуванням: вимкнено для сумісності клієнтів. Rich messages потребують сумісних клієнтів Telegram; деякі поточні клієнти Desktop, Web, Android і сторонні клієнти відображають прийняті rich messages як непідтримувані. Залишайте цей параметр вимкненим, якщо не кожен клієнт, що використовується з ботом, може їх рендерити. `/status` показує, чи ввімкнено rich messages у поточній сесії Telegram.

    Попередні перегляди посилань увімкнено за замовчуванням. `channels.telegram.linkPreview: false` пропускає автоматичне виявлення сутностей для rich text.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Реєстрація меню команд Telegram обробляється під час запуску за допомогою `setMyCommands`.

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
    - конфлікти/дублікати пропускаються й логуються

    Примітки:

    - власні команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди плагінів/Skills усе ще можуть працювати, коли їх введено вручну, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнено, вбудовані видаляються. Власні команди/команди плагінів усе ще можуть реєструватися, якщо налаштовані.

    Поширені помилки налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнилося після обрізання; зменште кількість команд плагінів/Skills/власних команд або вимкніть `channels.telegram.commands.native`.
    - Помилка `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, коли прямі команди curl до Bot API працюють, може означати, що `channels.telegram.apiRoot` було задано як повний endpoint `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється до polling, тому це не повідомляється як помилка очищення Webhook.
    - `setMyCommands failed` з помилками мережі/fetch зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблоковано.

    ### Команди сполучення пристрою (плагін `device-pair`)

    Коли встановлено плагін `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код в iOS app
    3. `/pair pending` показує очікувані запити (включно з роллю/областями)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один очікуваний запит
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap token. Вбудований bootstrap через код налаштування призначений лише для node: перше підключення створює очікуваний node-запит, а після схвалення Gateway повертає довготривалий node token із `scopes: []`. Він не повертає переданий operator token; доступ operator потребує окремого схваленого сполучення operator або token flow.

    Якщо пристрій повторює спробу зі зміненими даними автентифікації (наприклад, role/scopes/public key), попередній очікуваний запит замінюється, а новий запит використовує інший `requestId`. Повторно запустіть `/pair pending` перед схваленням.

    Докладніше: [Сполучення](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-кнопки">
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
    - `allowlist` (типово)

    Застаріле `capabilities: ["inlineButtons"]` відображається на `inlineButtons: "all"`.

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

    Приклад кнопки Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Кнопки Telegram `web_app` працюють лише в приватних чатах між користувачем і
    ботом.

    Натискання callback, які не прийняті зареєстрованим інтерактивним
    обробником Plugin, передаються агенту як текст:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Дії Telegram із повідомленнями для агентів і автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язково `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` або `caption`, необов’язкові inline-кнопки `presentation`; редагування лише кнопок оновлює розмітку відповіді)
    - `createForumTopic` (`chatId`, `name`, необов’язково `iconColor`, `iconCustomEmojiId`)

    Дії з повідомленнями каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Елементи керування доступом:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (типово: вимкнено)

    Примітка: `edit` і `topic-create` наразі типово ввімкнені та не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час виконання використовує активний знімок конфігурації/секретів (запуск/перезавантаження), тому шляхи дій не виконують спеціальне повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги гілкування відповідей">
    Telegram підтримує явні теги гілкування відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, що спричинило запуск
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (типово)
    - `first`
    - `all`

    Коли гілкування відповідей увімкнено і доступний початковий текст або підпис Telegram, OpenClaw автоматично додає нативний фрагмент цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються з початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявне гілкування відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка гілок">
    Форумні супергрупи:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор набору спрямовуються в гілку теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` застосовується лише до теми й не успадковується з типових налаштувань групи.
    `topics."*"` задає типові значення для кожної теми в цій групі; точні ID тем усе одно мають пріоритет над `"*"`.

    **Маршрутизація агентів за темами**: кожна тема може спрямовуватися до іншого агента через установлення `agentId` у конфігурації теми. Це дає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

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

    **Постійне прив’язування тем ACP**: теми форуму можуть закріплювати сесії ACP harness через типізовані прив’язування ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ID з кваліфікатором теми, як-от `-1001234567890:topic:42`). Наразі обмежено темами форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Запуск ACP, прив’язаний до гілки, з чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення спрямовуються туди напряму. OpenClaw закріплює підтвердження запуску в темі. Потрібно, щоб `channels.telegram.threadBindings.spawnSessions` лишалося ввімкненим (типово: `true`).

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` зберігають метадані відповіді; вони використовують ключі сесій з урахуванням гілок лише тоді, коли Telegram `getMe` повідомляє `has_topics_enabled: true` для бота.
    Колишні перевизначення `dm.threadReplies` і `direct.*.threadReplies` навмисно вилучено; використовуйте режим гілок BotFather як єдине джерело істини та запустіть `openclaw doctor --fix`, щоб видалити застарілі ключі конфігурації.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - типово: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає голосову нотатку
    - транскрипти вхідних голосових нотаток оформлюються в контексті агента як машинно згенерований,
      недовірений текст; виявлення згадок усе одно використовує сирий
      транскрипт, тож голосові повідомлення з доступом за згадкою продовжують працювати.

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

    Описи стікерів кешуються у стані Plugin OpenClaw SQLite, щоб зменшити кількість повторних викликів зору.

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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисного навантаження повідомлень).

    Якщо ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає лише реакції користувача на повідомлення, надіслані ботом (за найкращою спробою через кеш надісланих повідомлень).
    - Події реакцій усе одно дотримуються засобів контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ідентифікатори гілок в оновленнях реакцій.
      - групи без форуму маршрутизуються до сеансу групового чату
      - групи з форумом маршрутизуються до сеансу загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення. `ackReactionScope` визначає, *коли* цей емодзі фактично надсилається.

    **Порядок визначення емодзі (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - запасний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує unicode-емодзі (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

    **Область дії (`messages.ackReactionScope`):**

    Провайдер Telegram читає область дії з `messages.ackReactionScope` (типово `"group-mentions"`). Наразі немає перевизначення на рівні облікового запису Telegram або каналу Telegram.

    Значення: `"all"` (DMs + групи), `"direct"` (лише DMs), `"group-all"` (кожне повідомлення в групі, без DMs), `"group-mentions"` (групи, коли згадано бота; **без DMs** — це типове значення), `"off"` / `"none"` (вимкнено).

    <Note>
    Типова область дії (`"group-mentions"`) не запускає реакції підтвердження в прямих повідомленнях. Щоб отримувати реакцію підтвердження для вхідних Telegram DMs, встановіть `messages.ackReactionScope` на `"direct"` або `"all"`. Значення читається під час запуску провайдера Telegram, тому для набрання змінами чинності потрібен перезапуск gateway.
    </Note>

  </Accordion>

  <Accordion title="Записи конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнені типово (`configWrites !== false`).

    Записи, спричинені Telegram, включають:

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

  <Accordion title="Long polling проти webhook">
    Типово використовується long polling. Для режиму webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язкові `webhookPath`, `webhookHost`, `webhookPort` (типово `/telegram-webhook`, `127.0.0.1`, `8787`).

    У режимі long-polling OpenClaw зберігає свій маркер перезапуску лише після успішної диспетчеризації оновлення. Якщо обробник завершується з помилкою, це оновлення залишається доступним для повторної спроби в тому самому процесі й не записується як завершене для дедуплікації після перезапуску.

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного входу або розмістіть reverse proxy перед локальним портом, або навмисно встановіть `webhookHost: "0.0.0.0"`.

    Режим webhook перевіряє захист запиту, секретний токен Telegram і тіло JSON перед поверненням `200` до Telegram.
    Потім OpenClaw обробляє оновлення асинхронно через ті самі смуги бота для кожного чату/кожної теми, що використовуються long polling, тому повільні ходи агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Значення `channels.telegram.textChunkLimit` за замовчуванням — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіафайлів Telegram.
    - `channels.telegram.mediaGroupFlushMs` (за замовчуванням 500) керує тим, як довго альбоми/групи медіа Telegram буферизуються, перш ніж OpenClaw надішле їх як одне вхідне повідомлення. Збільште значення, якщо частини альбому надходять із запізненням; зменште його, щоб скоротити затримку відповіді на альбом.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується стандартне значення grammY). Клієнти ботів обмежують налаштовані значення нижче 60-секундного захисту для вихідних текстових запитів/індикатора набору, щоб grammY не перервав доставлення видимої відповіді до того, як спрацюють транспортний захист і fallback OpenClaw. Тривале опитування все ще використовує 45-секундний захист запиту `getUpdates`, щоб неактивні опитування не зависали безстроково.
    - `channels.telegram.pollingStallThresholdMs` за замовчуванням дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання опитування.
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає.
    - Додатковий контекст відповіді/цитати/пересилання нормалізується в одне вибране вікно контексту розмови, коли Gateway бачив батьківські повідомлення; кеш спостережених повідомлень зберігається у стані плагіна OpenClaw SQLite, а `openclaw doctor --fix` імпортує застарілі побічні файли. Telegram включає в оновлення лише один поверхневий `reply_to_message`, тому ланцюжки, старіші за кеш, обмежені поточним payload оновлення Telegram.
    - Списки дозволених Telegram насамперед обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до допоміжних засобів надсилання Telegram (CLI/інструменти/дії) для відновлюваних вихідних помилок API. Доставлення фінальної вхідної відповіді також використовує обмежену безпечну повторну спробу надсилання для збоїв Telegram перед підключенням, але не повторює неоднозначні мережеві конверти після надсилання, які можуть дублювати видимі повідомлення.

    Цілі надсилання CLI та інструмента повідомлень можуть бути числовим ID чату, іменем користувача або ціллю теми форуму:

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
    - `--thread-id` для тем форуму (або використайте ціль `:topic:`)

    Надсилання Telegram також підтримує:

    - `--presentation` із блоками `buttons` для вбудованих клавіатур, коли `channels.telegram.capabilities.inlineButtons` це дозволяє
    - `--pin` або `--delivery '{"pin":true}'`, щоб запросити закріплене доставлення, коли бот може закріплювати повідомлення в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення, GIF і відео як документи замість стиснених завантажень фото, анімованих медіа або відео

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайні надсилання увімкненими

  </Accordion>

  <Accordion title="Схвалення виконання в Telegram">
    Telegram підтримує схвалення виконання в DM схвалювачів і може додатково публікувати запити у вихідному чаті або темі. Схвалювачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна розпізнати принаймні одного схвалювача)
    - `channels.telegram.execApprovals.approvers` (fallback до числових ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (за замовчуванням) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` керують тим, хто може спілкуватися з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось схвалювачем виконання. Перша схвалена прив'язка DM ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тому налаштування з одним власником усе ще працює без дублювання ID у `execApprovals.approvers`.

    Доставлення в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему для запиту схвалення й подальшого повідомлення. Схвалення виконання за замовчуванням спливають через 30 хвилин.

    Вбудовані кнопки схвалення також потребують, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID схвалень із префіксом `plugin:` розв'язуються через схвалення плагіна; інші спершу розв'язуються через схвалення виконання.

    Див. [Схвалення виконання](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставлення або провайдера, політика помилок керує тим, чи надсилати повідомлення про помилки в чат Telegram:

| Ключ                                | Значення                   | За замовчуванням | Опис                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`         | `always` — надсилати кожне повідомлення про помилку в чат. `once` — надсилати кожне унікальне повідомлення про помилку один раз за вікно cooldown (пригнічувати повторні ідентичні помилки). `silent` — ніколи не надсилати повідомлення про помилки в чат. |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h)  | Вікно cooldown для політики `once`. Після надсилання помилки те саме повідомлення про помилку пригнічується, доки не мине цей інтервал. Запобігає спаму помилками під час збоїв.                    |

Підтримуються перевизначення для облікового запису, групи й теми (те саме успадкування, що й для інших ключів конфігурації Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
      - потім видаліть і знову додайте бота до групи
    - `openclaw channels status` попереджає, коли конфігурація очікує групові повідомлення без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити на членство.
    - Швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот узагалі не бачить групові повідомлення">

    - Коли існує `channels.telegram.groups`, групу має бути перелічено (або потрібно включити `"*"`)
    - Перевірте членство бота в групі
    - Перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або зовсім не працюють">

    - Авторизуйте ідентичність відправника (прив'язка та/або числовий `allowFrom`)
    - Авторизація команд усе ще застосовується, навіть коли політика групи — `open`
    - `setMyCommands failed` із `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд плагінів/Skills/користувацьких команд або вимкніть нативні меню
    - Виклики запуску `deleteMyCommands` / `setMyCommands` і виклики індикатора набору `sendChatAction` обмежені й повторюються один раз через транспортний fallback Telegram у разі тайм-ауту запиту. Стійкі мережеві/fetch помилки зазвичай вказують на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Запуск повідомляє про неавторизований токен">

    - `getMe returned 401` — це помилка автентифікації Telegram для налаштованого токена бота.
    - Повторно скопіюйте або згенеруйте токен бота в BotFather, потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для облікового запису за замовчуванням.
    - `deleteWebhook 401 Unauthorized` під час запуску також є помилкою автентифікації; трактування цього як "webhook не існує" лише відклало б ту саму помилку поганого токена до пізніших викликів API.

  </Accordion>

  <Accordion title="Нестабільність опитування або мережі">

    - Node 22+ і користувацький fetch/proxy можуть спричинити негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спершу розв'язують `api.telegram.org` в IPv6; зламаний вихідний IPv6 може спричиняти переривчасті збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює їх як відновлювані мережеві помилки.
    - Під час запуску опитування OpenClaw повторно використовує успішний стартовий пробний `getMe` для grammY, тож runner не потребує другого `getMe` перед першим `getUpdates`.
    - Якщо `deleteWebhook` завершується транзитною мережевою помилкою під час запуску опитування, OpenClaw переходить до тривалого опитування замість ще одного контрольного виклику перед опитуванням. Досі активний webhook проявляється як конфлікт `getUpdates`; після цього OpenClaw перебудовує транспорт Telegram і повторює очищення webhook.
    - Якщо сокети Telegram перезапускаються з коротким фіксованим інтервалом, перевірте, чи не замале значення `channels.telegram.timeoutSeconds`; клієнти ботів обмежують налаштовані значення нижче захистів вихідних запитів і `getUpdates`, але старіші релізи могли переривати кожне опитування або відповідь, коли це значення було нижчим за ці захисти.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає опитування й перебудовує транспорт Telegram після 120 секунд без завершеної перевірки життєздатності тривалого опитування за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис опитування не завершив `getUpdates` після стартового grace-періоду, коли запущений обліковий запис webhook не завершив `setWebhook` після стартового grace-періоду, або коли остання успішна активність транспорту опитування застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе ще повідомляє про хибні перезапуски через зависання опитування. Стійкі зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або вихідного TLS між хостом і `api.telegram.org`.
    - Telegram також враховує proxy env процесу для транспорту Bot API, включно з `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхніми варіантами в нижньому регістрі. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища й стандартного proxy env немає, Telegram також використовує цей URL для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим виходом/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2). Порядок результатів DNS для Telegram спершу враховує `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, потім `channels.telegram.network.dnsResultOrder`, потім стандартне значення процесу, наприклад `NODE_OPTIONS=--dns-result-order=ipv4first`; якщо нічого не застосовується, Node 22+ повертається до `ipv4first`.
    - Якщо ваш хост працює на WSL2 або явно краще працює з поведінкою лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону RFC 2544 для бенчмаркінгу (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий проксі переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціального використання адресу під час завантажень медіа, ви можете
      ввімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Таке саме явне ввімкнення доступне для кожного облікового запису за адресою
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш проксі розв’язує хости медіа Telegram у `198.18.x.x`, спершу залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє діапазон RFC 2544
      для бенчмаркінгу за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист медіа Telegram
      від SSRF. Використовуйте це лише для довірених середовищ проксі під контролем оператора,
      як-от маршрутизація fake-IP у Clash, Mihomo або Surge, коли вони синтезують
      приватні або спеціального використання відповіді поза діапазоном RFC 2544
      для бенчмаркінгу. Залишайте це вимкненим для звичайного публічного доступу Telegram через інтернет.
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

<Accordion title="Важливі поля Telegram">

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символьні посилання відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` верхнього рівня (`type: "acp"`)
- стандартні значення тем: `groups.<chatId>.topics."*"` застосовується до невідповідних тем форуму; точні ID тем мають вищий пріоритет
- схвалення виконання: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- потокове передавання: `streaming` (попередній перегляд), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- користувацький корінь API: `apiRoot` (лише корінь Bot API; не додавайте `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритет кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або додайте `channels.telegram.accounts.default`), щоб явно визначити стандартну маршрутизацію. Інакше OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` попереджає про це. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Зв’язування" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Telegram із Gateway.
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
    Діагностика між каналами.
  </Card>
</CardGroup>
