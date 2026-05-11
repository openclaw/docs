---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки Telegram-бота, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:22:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

Готовий до production-використання для DM ботів і груп через grammY. Long polling є типовим режимом; режим webhook необов’язковий.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та плейбуки виправлення.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Create the bot token in BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що handle точно `@BotFather`).

    Запустіть `/newbot`, виконайте підказки та збережіть токен.

  </Step>

  <Step title="Configure token and DM policy">

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

    Резервний варіант через env: `TELEGRAM_BOT_TOKEN=...` (лише типовий обліковий запис).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, потім запустіть Gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди pairing спливають через 1 годину.

  </Step>

  <Step title="Add the bot to a group">
    Додайте бота до своєї групи, потім отримайте обидва ID, потрібні для доступу до групи:

    - ваш ID користувача Telegram, що використовується в `allowFrom` / `groupAllowFrom`
    - ID групового чату Telegram, що використовується як ключ у `channels.telegram.groups`

    Для першого налаштування отримайте ID групового чату з `openclaw logs --follow`, бота для forwarded-ID або Bot API `getUpdates`. Після дозволу групи `/whoami@<bot_username>` може підтвердити ID користувача та групи.

    Від’ємні ID супергруп Telegram, що починаються з `-100`, є ID групових чатів. Додавайте їх у `channels.telegram.groups`, а не в `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення config мають перевагу над резервним env, а `TELEGRAM_BOT_TOKEN` застосовується лише до типового облікового запису.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Боти Telegram типово використовують **Privacy Mode**, який обмежує, які групові повідомлення вони отримують.

    Якщо бот має бачити всі групові повідомлення, або:

    - вимкніть privacy mode через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання privacy mode видаліть і повторно додайте бота в кожній групі, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Group permissions">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Адміністраторські боти отримують усі групові повідомлення, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` для дозволу/заборони додавання до груп
    - `/setprivacy` для поведінки видимості в групах

  </Accordion>
</AccordionGroup>

## Контроль доступу й активація

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (типово)
    - `allowlist` (потребує принаймні одного ID відправника в `allowFrom`)
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дозволяє будь-якому обліковому запису Telegram, який знайде або вгадає ім’я користувача бота, керувати ботом. Використовуйте це лише для навмисно публічних ботів із жорстко обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими ID користувачів.

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний `channels.telegram.allowFrom` верхнього рівня розглядається як межа безпеки: записи рівня облікового запису `allowFrom: ["*"]` не роблять цей обліковий запис публічним, якщо ефективний allowlist облікового запису після злиття все ще не містить явний wildcard.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється валідацією конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися й ваша конфігурація містить записи allowlist `@username`, запустіть `openclaw doctor --fix`, щоб їх розв’язати (best-effort; потребує токен бота Telegram).
    Якщо раніше ви покладалися на файли allowlist зі сховища pairing, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником віддавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу була сталою в конфігурації (замість залежності від попередніх схвалень pairing).

    Поширене непорозуміння: схвалення pairing для DM не означає «цей відправник авторизований усюди».
    Pairing надає доступ до DM. Якщо власника команд ще немає, перший схвалений pairing також встановлює `commands.ownerAllowFrom`, щоб команди лише для власника та схвалення exec мали явний обліковий запис оператора.
    Авторизація відправника в групі все ще походить із явних allowlists у конфігурації.
    Якщо ви хочете «мене авторизовано один раз, і працюють і DM, і групові команди», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

    ### Пошук вашого ID користувача Telegram

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

  <Tab title="Group policy and allowlists">
    Два елементи керування застосовуються разом:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає конфігурації `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки group-ID
         - з `groupPolicy: "allowlist"` (типово): групи заблоковані, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (типово)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID групових або супергрупових чатів Telegram у `groupAllowFrom`. Від’ємні chat IDs належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): автентифікація відправника в групі **не** успадковує схвалення зі сховища pairing для DM.
    Pairing залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` для окремої групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до конфігураційного `allowFrom`, а не до сховища pairing.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка runtime: якщо `channels.telegram` повністю відсутній, runtime типово fail-closed до `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` явно не задано.

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

      - Додавайте від’ємні ID груп або супергруп Telegram, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть запускати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг говорити з ботом.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Групові відповіді типово потребують mention.

    Mention може надходити з:

    - нативного mention `@botusername`, або
    - шаблонів mention у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для сталості використовуйте конфігурацію.

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
    - або перегляньте Bot API `getUpdates`
    - після дозволу групи запустіть `/whoami@<bot_username>`, якщо нативні команди ввімкнено

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу Gateway.
- Routing детермінований: вхідні повідомлення Telegram отримують відповідь у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний envelope каналу з метаданими відповіді, placeholders для медіа та збереженим контекстом reply-chain для відповідей Telegram, які Gateway спостерігав.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми були ізольовані.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw зберігає thread ID для відповідей, але типово тримає DM у пласкій сесії. Налаштуйте `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` або відповідну конфігурацію topic, коли навмисно хочете ізоляцію сесій topic для DM.
- Long polling використовує runner grammY з послідовністю per-chat/per-thread. Загальна конкурентність runner sink використовує `agents.defaults.maxConcurrent`.
- Long polling захищено всередині кожного процесу Gateway, тому лише один активний poller може використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, інший Gateway OpenClaw, script або зовнішній poller, імовірно, використовує той самий токен.
- Перезапуски watchdog для long-polling типово спрацьовують після 120 секунд без завершеного liveness `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні перезапуски polling-stall під час довготривалої роботи. Значення в мілісекундах і дозволене від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує read-receipts (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: preview-повідомлення + `editMessageText`
    - групи/теми: preview-повідомлення + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` — це `off | partial | block | progress` (типово: `partial`)
    - `progress` зберігає одну редаговану чернетку статусу для перебігу виконання інструментів, очищає її після завершення та надсилає фінальну відповідь як звичайне повідомлення
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/перебігу виконання повторно використовують те саме редаговане повідомлення попереднього перегляду (типово: `true`, коли активне потокове передавання попереднього перегляду)
    - `streaming.preview.commandText` керує деталями команд/виконання всередині цих рядків перебігу виконання інструментів: `raw` (типово, зберігає випущену поведінку) або `status` (лише мітка інструмента)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; запустіть `openclaw doctor --fix`, щоб перенести їх до `channels.telegram.streaming.mode`

    Оновлення попереднього перегляду перебігу виконання інструментів — це короткі рядки стану, що показуються під час роботи інструментів, наприклад виконання команд, читання файлів, оновлення плану або підсумки патчів. Telegram залишає їх увімкненими типово, щоб відповідати випущеній поведінці OpenClaw від `v2026.4.22` і новіших версій. Щоб зберегти редагований попередній перегляд для тексту відповіді, але приховати рядки перебігу виконання інструментів, задайте:

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

    Використовуйте режим `progress`, коли потрібен видимий перебіг виконання інструментів без редагування фінальної відповіді в те саме повідомлення. Розмістіть політику тексту команд у `streaming.progress`:

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

    Використовуйте `streaming.mode: "off"` лише тоді, коли потрібна доставка тільки фінального результату: редагування попереднього перегляду Telegram вимкнені, а загальні повідомлення інструментів/перебігу виконання пригнічуються замість надсилання як окремих повідомлень стану. Запити на схвалення, медіавміст і помилки все ще спрямовуються через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли потрібно лише зберегти редагування попереднього перегляду відповіді, приховавши рядки стану перебігу виконання інструментів.

    <Note>
      Відповіді Telegram на вибрані цитати є винятком. Коли `replyToMode` має значення `"first"`, `"all"` або `"batched"` і вхідне повідомлення містить текст вибраної цитати, OpenClaw надсилає фінальну відповідь через нативний шлях відповіді на цитату Telegram замість редагування попереднього перегляду відповіді, тому `streaming.preview.toolProgress` не може показувати короткі рядки стану для цього ходу. Відповіді на поточне повідомлення без тексту вибраної цитати все ще зберігають потокове передавання попереднього перегляду. Задайте `replyToMode: "off"`, коли видимість перебігу виконання інструментів важливіша за нативні відповіді на цитати, або задайте `streaming.preview.toolProgress: false`, щоб явно прийняти цей компроміс.
    </Note>

    Для відповідей лише текстом:

    - короткі попередні перегляди в DM/групі/темі: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці
    - довгі фінальні текстові відповіді, що розбиваються на кілька повідомлень Telegram, за можливості повторно використовують наявний попередній перегляд як перший фінальний фрагмент, а потім надсилають лише решту фрагментів
    - фінальні відповіді в режимі progress очищають чернетку статусу й використовують звичайну фінальну доставку замість редагування чернетки у відповідь
    - якщо фінальне редагування зазнає невдачі до підтвердження завершеного тексту, OpenClaw використовує звичайну фінальну доставку й очищає застарілий попередній перегляд

    Для складних відповідей (наприклад, медіавмісту) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Потокове передавання попереднього перегляду відокремлене від блокового потокового передавання. Коли блокове потокове передавання явно ввімкнене для Telegram, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування до живого попереднього перегляду під час генерації
    - попередній перегляд міркувань видаляється після фінальної доставки; використовуйте `/reasoning on`, коли міркування мають залишатися видимими
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний варіант HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown відтворюється як безпечний для Telegram HTML.
    - Сирий HTML від моделі екранується, щоб зменшити кількість збоїв розбору Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередні перегляди посилань увімкнені типово й можуть бути вимкнені за допомогою `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та власні команди">
    Реєстрація меню команд Telegram обробляється під час запуску за допомогою `setMyCommands`.

    Типові значення нативних команд:

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
    - припустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - власні команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються й записуються в журнал

    Примітки:

    - власні команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди plugin/skill усе ще можуть працювати під час введення, навіть якщо не показані в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Власні/Plugin-команди все ще можуть реєструватися, якщо налаштовані.

    Поширені збої налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після обрізання; зменште кількість команд plugin/skill/власних команд або вимкніть `channels.telegram.commands.native`.
    - збій `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, коли прямі команди curl до Bot API працюють, може означати, що `channels.telegram.apiRoot` було задано як повний endpoint `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється до опитування, тому це не повідомляється як збій очищення Webhook.
    - `setMyCommands failed` з мережевими/fetch-помилками зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблокований.

    ### Команди сполучення пристроїв (`device-pair` plugin)

    Коли встановлено `device-pair` plugin:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів в очікуванні (зокрема роль/області доступу)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит в очікуванні
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap-токен. Вбудована передача bootstrap зберігає токен основного вузла на `scopes: []`; будь-який переданий токен оператора лишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки областей доступу bootstrap мають префікс ролі, тому цей allowlist оператора задовольняє лише запити оператора; неоператорським ролям усе ще потрібні області доступу під їхнім власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими деталями автентифікації (наприклад, роль/області доступу/публічний ключ), попередній запит в очікуванні замінюється, а новий запит використовує інший `requestId`. Повторно запустіть `/pair pending` перед схваленням.

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

  <Accordion title="Дії з повідомленнями Telegram для агентів і автоматизації">
    Дії інструментів Telegram містять:

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

    Примітка: `edit` і `topic-create` наразі ввімкнені типово й не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час виконання використовують активний знімок конфігурації/секретів (запуск/перезавантаження), тому шляхи дій не виконують спеціальне повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги гілкування відповідей">
    Telegram підтримує явні теги гілкування відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, що запустило обробку
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (типово)
    - `first`
    - `all`

    Коли гілкування відповідей увімкнене й оригінальний текст або підпис Telegram доступний, OpenClaw автоматично додає нативний уривок цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються від початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявне гілкування відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка гілок">
    Супергрупи форуму:

    - ключі сесії теми додають `:topic:<threadId>`
    - відповіді та індикатор набору спрямовуються до гілки теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все ще містять `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` застосовується лише до теми й не успадковується з типових значень групи.

    **Маршрутизація агента для кожної теми**: кожна тема може маршрутизуватися до іншого агента через задання `agentId` у конфігурації теми. Це надає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → основний агент
                "3": { agentId: "zu" },        // Тема розробки → агент zu
                "5": { agentId: "coder" }      // Рев’ю коду → агент coder
              }
            }
          }
        }
      }
    }
    ```

    Кожна тема потім має власний ключ сеансу: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійна прив’язка теми ACP**: теми форуму можуть закріплювати сеанси ACP harness через типізовані ACP-прив’язки верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ідентифікатором із темою, наприклад `-1001234567890:topic:42`). Наразі область дії обмежена темами форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Прив’язаний до треду запуск ACP із чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нового сеансу ACP; подальші повідомлення спрямовуються туди напряму. OpenClaw закріплює підтвердження запуску в темі. Потрібно, щоб `channels.telegram.threadBindings.spawnSessions` залишався ввімкненим (типово: `true`).

    Контекст шаблону надає `MessageThreadId` та `IsForum`. Чати DM з `message_thread_id` типово зберігають маршрутизацію DM і метадані відповіді у плоских сеансах; вони використовують ключі сеансів з урахуванням тредів лише коли налаштовано `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` або відповідну конфігурацію теми. Використовуйте `channels.telegram.dm.threadReplies` верхнього рівня як типове значення для облікового запису або `direct.<chatId>.threadReplies` для одного DM.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки й аудіофайли.

    - типово: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає голосову нотатку
    - транскрипти вхідних голосових нотаток оформлюються як машинно згенерований,
      ненадійний текст у контексті агента; виявлення згадок усе одно використовує сирий
      транскрипт, тому голосові повідомлення з обмеженням за згадками продовжують працювати.

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

    Telegram розрізняє відеофайли й відеонотатки.

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

  <Accordion title="Сповіщення про реакції">
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисного навантаження повідомлень).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (наскільки можливо через кеш надісланих повідомлень).
    - Події реакцій усе одно дотримуються засобів контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ідентифікатори тредів в оновленнях реакцій.
      - групи без форуму маршрутизуються до сеансу групового чату
      - групи з форумом маршрутизуються до сеансу загальної теми групи (`:topic:1`), а не точної початкової теми

    `allowed_updates` для polling/webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Ack-реакції">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - запасний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує unicode emoji (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнено типово (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

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

  <Accordion title="Long polling проти webhook">
    Типово використовується long polling. Для режиму webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язкові `webhookPath`, `webhookHost`, `webhookPort` (типово `/telegram-webhook`, `127.0.0.1`, `8787`).

    У режимі long-polling OpenClaw зберігає watermark перезапуску лише після успішного диспетчеризування оновлення. Якщо обробник завершується з помилкою, це оновлення залишається придатним для повторної спроби в тому самому процесі й не записується як завершене для дедуплікації після перезапуску.

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного входу або поставте reverse proxy перед локальним портом, або свідомо задайте `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє захисти запиту, секретний токен Telegram і JSON-тіло перед поверненням `200` до Telegram.
    Потім OpenClaw асинхронно обробляє оновлення через ті самі смуги бота для кожного чату/кожної теми, що й у long polling, тож повільні кроки агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - `channels.telegram.textChunkLimit` типово дорівнює 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.mediaGroupFlushMs` (типово 500) керує тим, як довго альбоми/медіагрупи Telegram буферизуються, перш ніж OpenClaw диспетчеризує їх як одне вхідне повідомлення. Збільште значення, якщо частини альбому надходять із запізненням; зменште його, щоб скоротити затримку відповіді на альбом.
    - `channels.telegram.timeoutSeconds` перевизначає timeout клієнта Telegram API (якщо не задано, застосовується типове значення grammY). Клієнти ботів обмежують налаштовані значення нижче 60-секундного захисту вихідних запитів тексту/індикації набору, щоб grammY не перервав доставку видимої відповіді до того, як спрацюють transport guard і запасний механізм OpenClaw. Long polling усе одно використовує 45-секундний захист запиту `getUpdates`, тож неактивні опитування не залишаються покинутими безстроково.
    - `channels.telegram.pollingStallThresholdMs` типово дорівнює `120000`; налаштовуйте в діапазоні від `30000` до `600000` лише для хибнопозитивних перезапусків через зупинку polling.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає.
    - додатковий контекст reply/quote/forward нормалізується в одне вибране вікно контексту розмови, коли gateway спостерігав батьківські повідомлення; кеш спостережених повідомлень зберігається поруч зі сховищем сеансів. Telegram включає в оновлення лише один неглибокий `reply_to_message`, тому ланцюжки старші за кеш обмежені поточним payload оновлення Telegram.
    - Allowlist Telegram насамперед обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - конфігурація `channels.telegram.retry` застосовується до допоміжних засобів надсилання Telegram (CLI/tools/actions) для відновлюваних помилок outbound API. Доставка фінальної відповіді на вхідні повідомлення також використовує обмежену безпечну повторну спробу надсилання для збоїв попереднього з’єднання Telegram, але не повторює неоднозначні post-send мережеві envelopes, які можуть дублювати видимі повідомлення.

    Цілі надсилання CLI і message-tool можуть бути числовим ID чату, username або ціллю теми форуму:

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

    Прапорці опитувань лише для Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` для тем форуму (або використовуйте ціль `:topic:`)

    Надсилання Telegram також підтримує:

    - `--presentation` з блоками `buttons` для inline-клавіатур, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'` для запиту закріпленої доставки, коли бот може закріплювати в цьому чаті
    - `--force-document` для надсилання вихідних зображень, GIF і відео як документів замість стиснених фото, animated-media або video uploads

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Підтвердження exec у Telegram">
    Telegram підтримує підтвердження exec у DM схвалювачів і може опціонально публікувати запити в початковому чаті або темі. Схвалювачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна розв’язати принаймні одного схвалювача)
    - `channels.telegram.execApprovals.approvers` (повертається до числових ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (типово) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` керують тим, хто може говорити з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось схвалювачем exec. Перше схвалене поєднання DM ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тому налаштування з одним власником усе одно працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему для запиту підтвердження та подальшої відповіді. Підтвердження exec типово спливають через 30 хвилин.

    Inline-кнопки підтвердження також потребують, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID підтверджень із префіксом `plugin:` розв’язуються через підтвердження plugin; інші спочатку розв’язуються через підтвердження exec.

    Див. [Підтвердження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або приховати його. Цю поведінку керують два ключі конфігурації:

| Ключ                                | Значення          | Типово  | Опис                                                                                           |
| ----------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю приховує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями про помилки в той самий чат. Запобігає спаму помилками під час збоїв. |

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
  <Accordion title="Бот не відповідає на групові повідомлення без згадки">

    - Якщо `requireMention=false`, режим приватності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть і знову додайте бота до групи
    - `openclaw channels status` попереджає, коли конфігурація очікує групові повідомлення без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ідентифікатори груп; wildcard `"*"` неможливо перевірити на членство.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить групові повідомлення">

    - коли існує `channels.telegram.groups`, група має бути вказана (або має міститися `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють взагалі">

    - авторизуйте ідентичність вашого відправника (сполучення та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи має значення `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть нативні меню
    - стартові виклики `deleteMyCommands` / `setMyCommands` і виклики індикації набору `sendChatAction` обмежені та повторюються один раз через резервний транспорт Telegram у разі тайм-ауту запиту. Постійні помилки мережі/fetch зазвичай вказують на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Під час запуску повідомляється про неавторизований токен">

    - `getMe returned 401` — це помилка автентифікації Telegram для налаштованого токена бота.
    - Повторно скопіюйте або згенеруйте заново токен бота в BotFather, потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для облікового запису за замовчуванням.
    - `deleteWebhook 401 Unauthorized` під час запуску також є помилкою автентифікації; трактування цього як "webhook не існує" лише відклало б ту саму помилку неправильного токена до пізніших викликів API.

  </Accordion>

  <Accordion title="Нестабільність опитування або мережі">

    - Node 22+ + користувацький fetch/proxy можуть спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спершу розв’язують `api.telegram.org` в IPv6; несправний вихід IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює ці помилки як відновлювані мережеві помилки.
    - Під час запуску опитування OpenClaw повторно використовує успішну стартову перевірку `getMe` для grammY, тому runner не потребує другого `getMe` перед першим `getUpdates`.
    - Якщо `deleteWebhook` завершується з помилкою через тимчасову мережеву помилку під час запуску опитування, OpenClaw переходить до long polling замість ще одного контрольного виклику перед опитуванням. Webhook, що все ще активний, проявляється як конфлікт `getUpdates`; після цього OpenClaw перебудовує транспорт Telegram і повторює очищення webhook.
    - Якщо сокети Telegram перевідкриваються за коротким фіксованим інтервалом, перевірте, чи не надто низьке `channels.telegram.timeoutSeconds`; клієнти ботів обмежують налаштовані значення нижче захистів вихідних запитів і `getUpdates`, але старіші випуски могли переривати кожне опитування або відповідь, коли це значення було нижчим за ці захисти.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає опитування та перебудовує транспорт Telegram після 120 секунд без завершеної перевірки життєздатності long-poll за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис опитування не завершив `getUpdates` після стартового пільгового періоду, коли запущений обліковий запис webhook не завершив `setWebhook` після стартового пільгового періоду, або коли остання успішна активність транспорту опитування застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе одно повідомляє про хибні перезапуски через зупинку опитування. Постійні зупинки зазвичай вказують на проблеми proxy, DNS, IPv6 або вихідного TLS між хостом і `api.telegram.org`.
    - Telegram також враховує змінні середовища proxy процесу для транспорту Bot API, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти в нижньому регістрі. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища і стандартні змінні середовища proxy відсутні, Telegram також використовує цю URL-адресу для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим виходом/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ типово використовує `autoSelectFamily=true` (крім WSL2). Порядок результатів DNS Telegram враховує `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, потім `channels.telegram.network.dnsResultOrder`, потім типовий процесний порядок, як-от `NODE_OPTIONS=--dns-result-order=ipv4first`; якщо нічого не застосовується, Node 22+ повертається до `ipv4first`.
    - Якщо ваш хост є WSL2 або явно краще працює в режимі лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді діапазону RFC 2544 для бенчмаркінгу (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціального призначення адресу під час завантаження медіа, ви можете ввімкнути
      обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме opt-in доступне для кожного облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy розв’язує медіахости Telegram у `198.18.x.x`, спершу залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє діапазон RFC 2544
      для бенчмаркінгу за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює SSRF-захисти медіа Telegram.
      Використовуйте його лише для довірених, контрольованих оператором середовищ proxy,
      таких як Clash, Mihomo або маршрутизація fake-IP у Surge, коли вони
      синтезують приватні або спеціального призначення відповіді поза діапазоном RFC 2544
      для бенчмаркінгу. Залишайте його вимкненим для звичайного публічного доступу Telegram через інтернет.
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

Більше допомоги: [Усунення несправностей каналів](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="Найважливіші поля Telegram">

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; symlink відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` верхнього рівня (`type: "acp"`)
- підтвердження exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- треди/відповіді: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- користувацький корінь API: `apiRoot` (лише корінь Bot API; не додавайте `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритетність кількох облікових записів: коли налаштовано два або більше ідентифікаторів облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб зробити маршрутизацію за замовчуванням явною. Інакше OpenClaw повертається до першого нормалізованого ідентифікатора облікового запису, а `openclaw doctor` попереджає. Іменовані облікові записи успадковують значення `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Telegram із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка allowlist для груп і тем.
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
