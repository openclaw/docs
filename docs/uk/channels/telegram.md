---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки бота Telegram, можливості та налаштування
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

Готово до продакшну для особистих повідомлень ботів і груп через grammY. Long polling є режимом за замовчуванням; режим Webhook необов’язковий.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Політика особистих повідомлень за замовчуванням для Telegram — сполучення.
  </Card>
  <Card title="Усунення неполадок каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і поспілкуйтеся з **@BotFather** (переконайтеся, що handle саме `@BotFather`).

    Запустіть `/newbot`, дотримуйтеся підказок і збережіть токен.

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

    Резервне значення з env: `TELEGRAM_BOT_TOKEN=...` (лише обліковий запис за замовчуванням).
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
Порядок визначення токена враховує обліковий запис. На практиці значення config мають пріоритет над резервним значенням env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування з боку Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Боти Telegram за замовчуванням використовують **Privacy Mode**, який обмежує групові повідомлення, що вони отримують.

    Якщо бот має бачити всі групові повідомлення, або:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму приватності видаліть і знову додайте бота в кожній групі, щоб Telegram застосував зміну.

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
  <Tab title="Політика особистих повідомлень">
    `channels.telegram.dmPolicy` керує доступом через особисті повідомлення:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен принаймні один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дає будь-якому обліковому запису Telegram, який знайде або вгадає ім’я користувача бота, змогу керувати ботом. Використовуйте це лише для навмисно публічних ботів із суворо обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими ID користувачів.

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний `channels.telegram.allowFrom` верхнього рівня вважається межею безпеки: записи `allowFrom: ["*"]` на рівні облікового запису не роблять цей обліковий запис публічним, якщо ефективний allowlist облікового запису після об’єднання все ще не містить явний wildcard.
    `dmPolicy: "allowlist"` із порожнім `allowFrom` блокує всі особисті повідомлення й відхиляється валідацією конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися і ваша конфігурація містить записи allowlist виду `@username`, запустіть `openclaw doctor --fix`, щоб їх розв’язати (best-effort; потрібен токен бота Telegram).
    Якщо раніше ви покладалися на файли allowlist зі сховища сполучень, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником віддавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу була сталою в конфігурації (а не залежала від попередніх схвалень сполучення).

    Типова плутанина: схвалення сполучення в особистих повідомленнях не означає «цей відправник авторизований всюди».
    Сполучення надає доступ до особистих повідомлень. Якщо власника команд ще немає, перше схвалене сполучення також задає `commands.ownerAllowFrom`, щоб команди лише для власника та схвалення exec мали явний обліковий запис оператора.
    Авторизація відправників у групах усе одно походить із явних allowlist у конфігурації.
    Якщо ви хочете «я авторизований один раз, і працюють як особисті повідомлення, так і групові команди», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

    ### Як знайти свій ID користувача Telegram

    Безпечніше (без стороннього бота):

    1. Надішліть особисте повідомлення своєму боту.
    2. Запустіть `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній метод (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два елементи керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає конфігурації `groups`:
         - з `groupPolicy: "open"`: будь-яка група може проходити перевірки group-ID
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи заблоковані, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Яким відправникам дозволено писати в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): авторизація відправників у групах **не** успадковує схвалення зі сховища сполучень особистих повідомлень.
    Сполучення залишається лише для особистих повідомлень. Для груп задайте `groupAllowFrom` або `allowFrom` для окремої групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до config `allowFrom`, а не до сховища сполучень.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням fail-closed з `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` не задано явно.

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
      - Додавайте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, хто саме в дозволеній групі може запускати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.

    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Відповіді в групах за замовчуванням потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сеансу:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сеансу. Для сталості використовуйте конфігурацію.

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

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні повідомлення Telegram отримують відповідь у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний конверт каналу з метаданими відповіді та placeholders для медіа.
- Групові сеанси ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- Особисті повідомлення можуть містити `message_thread_id`; OpenClaw зберігає ID thread для відповідей, але за замовчуванням тримає особисті повідомлення в плоскому сеансі. Налаштуйте `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` або відповідну конфігурацію теми, коли ви навмисно хочете ізоляцію сеансів тем в особистих повідомленнях.
- Long polling використовує grammY runner із послідовністю на чат/на thread. Загальна конкурентність runner sink використовує `agents.defaults.maxConcurrent`.
- Long polling захищений усередині кожного процесу gateway, тому лише один активний poller може використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, імовірно, той самий токен використовує інший gateway OpenClaw, скрипт або зовнішній poller.
- Перезапуски watchdog для long-polling за замовчуванням спрацьовують після 120 секунд без завершеної liveness `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще трапляються хибні перезапуски через polling-stall під час довготривалої роботи. Значення задається в мілісекундах і дозволене в діапазоні від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує read receipts (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може stream часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` зберігає один editable чернетковий статус і оновлює його прогресом інструментів до фінальної доставки
    - `streaming.preview.toolProgress` керує тим, чи повторно використовують оновлення інструментів/прогресу те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`, коли preview streaming активний)
    - `streaming.preview.commandText` керує деталями command/exec у цих рядках прогресу інструментів: `raw` (за замовчуванням, зберігає випущену поведінку) або `status` (лише мітка інструмента)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; запустіть `openclaw doctor --fix`, щоб мігрувати їх до `channels.telegram.streaming.mode`

    Оновлення попереднього перегляду прогресу інструментів — це короткі рядки стану, що показуються під час роботи інструментів, наприклад виконання команд, читання файлів, оновлення планування або підсумки patch. Telegram залишає їх увімкненими за замовчуванням, щоб відповідати випущеній поведінці OpenClaw від `v2026.4.22` і пізніше. Щоб зберегти відредагований попередній перегляд для тексту відповіді, але приховати рядки прогресу інструментів, задайте:

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

    Для режиму чернетки прогресу розмістіть ту саму політику тексту команди в `streaming.progress`:

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

    Використовуйте `streaming.mode: "off"` лише тоді, коли потрібна доставка тільки фінальної відповіді: редагування попереднього перегляду Telegram вимикаються, а загальний службовий вивід інструментів і прогресу пригнічується замість надсилання окремими повідомленнями статусу. Запити на схвалення, медіа-навантаження й помилки все одно проходять через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли потрібно зберегти лише редагування попереднього перегляду відповіді, приховавши рядки статусу прогресу інструментів.

    <Note>
      Відповіді Telegram на вибрані цитати є винятком. Коли `replyToMode` має значення `"first"`, `"all"` або `"batched"` і вхідне повідомлення містить текст вибраної цитати, OpenClaw надсилає фінальну відповідь через нативний шлях Telegram для відповіді з цитатою замість редагування попереднього перегляду відповіді, тому `streaming.preview.toolProgress` не може показувати короткі рядки статусу для цього ходу. Відповіді на поточне повідомлення без тексту вибраної цитати все ще зберігають потокове передавання попереднього перегляду. Установіть `replyToMode: "off"`, коли видимість прогресу інструментів важливіша за нативні відповіді з цитатами, або встановіть `streaming.preview.toolProgress: false`, щоб явно прийняти цей компроміс.
    </Note>

    Для текстових відповідей:

    - короткі попередні перегляди в особистих повідомленнях, групах і темах: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці, якщо після появи попереднього перегляду не було надіслано видиме повідомлення, яке не є попереднім переглядом
    - попередні перегляди, після яких іде видимий вивід, що не є попереднім переглядом: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення й очищає старіший попередній перегляд, тому фінальна відповідь з’являється після проміжного виводу
    - попередні перегляди, старші приблизно за одну хвилину: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення, а потім очищає попередній перегляд, тому видима позначка часу Telegram відображає час завершення, а не час створення попереднього перегляду

    Для складних відповідей (наприклад, медіа-навантажень) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Потокове передавання попереднього перегляду відокремлене від потокового передавання блоків. Коли потокове передавання блоків явно ввімкнене для Telegram, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в живий попередній перегляд під час генерування
    - попередній перегляд міркувань видаляється після фінальної доставки; використовуйте `/reasoning on`, коли міркування мають залишатися видимими
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown перетворюється на безпечний для Telegram HTML.
    - Необроблений HTML моделі екранується, щоб зменшити кількість помилок розбору Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює надсилання як звичайний текст.

    Попередні перегляди посилань увімкнені за замовчуванням і можуть бути вимкнені за допомогою `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram обробляється під час запуску за допомогою `setMyCommands`.

    Стандартні значення нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте користувацькі пункти меню команд:

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

    - назви нормалізуються (прибирається початковий `/`, переводяться в нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти й дублікати пропускаються та записуються в журнал

    Примітки:

    - користувацькі команди є лише пунктами меню; вони не реалізують поведінку автоматично
    - команди plugin/skill усе ще можуть працювати під час введення, навіть якщо їх не показано в меню Telegram

    Якщо нативні команди вимкнено, вбудовані команди видаляються. Користувацькі команди або команди plugin усе ще можуть реєструватися, якщо налаштовані.

    Поширені збої налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після обрізання; зменште кількість команд plugin/skill/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - Збій `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, коли прямі команди Bot API через curl працюють, може означати, що `channels.telegram.apiRoot` було встановлено на повний endpoint `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` прибирає випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється до опитування, тому це не повідомляється як збій очищення webhook.
    - `setMyCommands failed` з помилками мережі або fetch зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблоковано.

    ### Команди спарювання пристроїв (`device-pair` plugin)

    Коли встановлено `device-pair` plugin:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує запити, що очікують на розгляд (зокрема роль/області дії)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит в очікуванні
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap-токен. Вбудована передача bootstrap зберігає токен основного вузла на `scopes: []`; будь-який переданий токен оператора лишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки областей дії bootstrap мають префікс ролі, тому цей список дозволів оператора задовольняє лише запити оператора; неоператорські ролі все ще потребують областей дії під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними автентифікації (наприклад, роль/області дії/публічний ключ), попередній запит в очікуванні замінюється, а новий запит використовує інший `requestId`. Повторно виконайте `/pair pending` перед схваленням.

    Докладніше: [Спарювання](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

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
    - `allowlist` (за замовчуванням)

    Застаріле `capabilities: ["inlineButtons"]` відповідає `inlineButtons: "all"`.

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
    Надсилання під час виконання використовує активний знімок config/secrets (запуск/перезавантаження), тому шляхи дій не виконують ситуативне повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке запустило обробку
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Коли потоки відповідей увімкнені й оригінальний текст або підпис Telegram доступний, OpenClaw автоматично додає нативний фрагмент цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються з початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявні потоки відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форумів:

    - ключі сесій теми додають `:topic:<threadId>`
    - відповіді й індикатор набору спрямовуються в потік теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Особливий випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все ще включають `message_thread_id`

    Успадкування теми: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` стосується лише теми й не успадковується зі стандартних значень групи.

    **Маршрутизація агентів для окремих тем**: кожна тема може спрямовуватися до іншого агента, якщо встановити `agentId` у конфігурації теми. Це дає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

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

    **Постійне прив’язування тем ACP**: теми форуму можуть закріплювати сесії ACP harness через типізовані ACP-прив’язки верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ID з уточненням теми, наприклад `-1001234567890:topic:42`). Наразі обмежено темами форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Запуск ACP, прив’язаний до потоку, з чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення спрямовуються безпосередньо туди. OpenClaw закріплює підтвердження запуску в темі. Потрібно, щоб `channels.telegram.threadBindings.spawnSessions` лишався ввімкненим (за замовчуванням: `true`).

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` за замовчуванням зберігають маршрутизацію DM і метадані відповіді в плоских сесіях; вони використовують ключі сесій з урахуванням тредів лише коли налаштовано `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` або відповідну конфігурацію теми. Використовуйте верхньорівневий `channels.telegram.dm.threadReplies` як типове значення для облікового запису або `direct.<chatId>.threadReplies` для одного DM.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - типово: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента, щоб примусово надіслати голосову нотатку
    - вхідні транскрипти голосових нотаток оформлюються як машинно згенерований,
      недовірений текст у контексті агента; виявлення згадок усе ще використовує сирий
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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисного навантаження повідомлень).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (на основі кешу надісланих повідомлень із найкращим можливим зусиллям).
    - Події реакцій усе ще дотримуються контролів доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID тредів в оновленнях реакцій.
      - групи не-форуми маршрутизуються до сесії групового чату
      - форумні групи маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/Webhook автоматично містить `message_reaction`.

  </Accordion>

  <Accordion title="Ack-реакції">
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

  <Accordion title="Записи конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнено за замовчуванням (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

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

  <Accordion title="Long polling проти Webhook">
    Типовим є long polling. Для режиму Webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язкові `webhookPath`, `webhookHost`, `webhookPort` (типові значення `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного входу або поставте зворотний проксі перед локальним портом, або навмисно задайте `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє захисні умови запиту, секретний токен Telegram і тіло JSON перед поверненням `200` до Telegram.
    Потім OpenClaw обробляє оновлення асинхронно через ті самі bot lanes для кожного чату/кожної теми, що використовуються long polling, тож повільні ходи агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Обмеження, повтори та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.mediaGroupFlushMs` (типово 500) керує тим, як довго альбоми/медіагрупи Telegram буферизуються, перш ніж OpenClaw відправить їх як одне вхідне повідомлення. Збільште значення, якщо частини альбому надходять із затримкою; зменште його, щоб скоротити затримку відповіді на альбом.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується типове значення grammY). Клієнти ботів обмежують налаштовані значення нижче 60-секундного захисного ліміту для вихідних текстових запитів/typing, щоб grammY не перервав доставку видимої відповіді до того, як зможуть спрацювати транспортний захисний ліміт OpenClaw і fallback. Long polling усе ще використовує 45-секундний захисний ліміт запиту `getUpdates`, щоб неактивні опитування не залишалися покинутими безстроково.
    - `channels.telegram.pollingStallThresholdMs` типово дорівнює `120000`; налаштовуйте між `30000` і `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає.
    - додатковий контекст відповіді/цитати/пересилання наразі передається як отримано.
    - Allowlist Telegram насамперед обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до helper-ів надсилання Telegram (CLI/інструменти/дії) для відновлюваних помилок вихідного API. Доставка фінальної відповіді для вхідних повідомлень також використовує обмежений повтор безпечного надсилання для збоїв Telegram перед підключенням, але не повторює неоднозначні мережеві обгортки після надсилання, які можуть дублювати видимі повідомлення.

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
    - `--force-document`, щоб надсилати вихідні зображення та GIF-файли як документи замість стислих фото або завантажень анімованих медіа

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Схвалення exec у Telegram">
    Telegram підтримує схвалення exec у DM схвалювачів і може необов’язково публікувати запити в початковому чаті або темі. Схвалювачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна визначити принаймні одного схвалювача)
    - `channels.telegram.execApprovals.approvers` (fallback до числових ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (типово) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` керують тим, хто може говорити з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось схвалювачем exec. Перше схвалене поєднання DM ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тож налаштування з одним власником усе ще працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє у форумну тему, OpenClaw зберігає тему для запиту схвалення та подальшої відповіді. Схвалення exec типово спливають через 30 хвилин.

    Кнопки inline-схвалення також потребують, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID схвалень із префіксом `plugin:` визначаються через схвалення Plugin; інші спочатку визначаються через схвалення exec.

    Див. [Схвалення exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або придушити його. Два ключі конфігурації керують цією поведінкою:

| Ключ                                | Значення          | Типово  | Опис                                                                                             |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю придушує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | число (мс)        | `60000` | Мінімальний час між відповідями про помилки в той самий чат. Запобігає спаму помилками під час збоїв. |

Підтримуються перевизначення для кожного облікового запису, кожної групи та кожної теми (таке саме успадкування, як для інших ключів конфігурації Telegram).

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
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить групові повідомлення">

    - коли `channels.telegram.groups` існує, групу має бути вказано (або включено `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють взагалі">

    - авторизуйте ідентичність відправника (сполучення та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи має значення `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато пунктів; зменште кількість команд plugin/skill/користувацьких команд або вимкніть нативні меню
    - стартові виклики `deleteMyCommands` / `setMyCommands` і виклики введення `sendChatAction` обмежені та повторюються один раз через резервний транспорт Telegram у разі тайм-ауту запиту. Постійні помилки мережі/fetch зазвичай вказують на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Запуск повідомляє про неавторизований токен">

    - `getMe returned 401` — це помилка автентифікації Telegram для налаштованого токена бота.
    - Скопіюйте повторно або згенеруйте заново токен бота в BotFather, а потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для типового облікового запису.
    - `deleteWebhook 401 Unauthorized` під час запуску також є помилкою автентифікації; трактування цього як «webhook не існує» лише відклало б ту саму помилку неправильного токена до пізніших викликів API.

  </Accordion>

  <Accordion title="Нестабільність опитування або мережі">

    - Node 22+ + користувацький fetch/proxy можуть спричиняти негайну поведінку переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спершу резолвлять `api.telegram.org` в IPv6; зламаний вихідний IPv6-трафік може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює ці запити як відновлювані мережеві помилки.
    - Під час запуску опитування OpenClaw повторно використовує успішну стартову перевірку `getMe` для grammY, тому runner не потребує другого `getMe` перед першим `getUpdates`.
    - Якщо `deleteWebhook` завершується тимчасовою мережевою помилкою під час запуску опитування, OpenClaw продовжує long polling замість ще одного передопитувального виклику control-plane. Усе ще активний webhook проявляється як конфлікт `getUpdates`; тоді OpenClaw перебудовує транспорт Telegram і повторює очищення webhook.
    - Якщо сокети Telegram перезапускаються з коротким фіксованим інтервалом, перевірте, чи не замале `channels.telegram.timeoutSeconds`; клієнти ботів обмежують налаштовані значення нижче захисних меж вихідних запитів і `getUpdates`, але старіші випуски могли переривати кожне опитування або відповідь, коли це значення було нижчим за ці межі.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає опитування та перебудовує транспорт Telegram після 120 секунд без завершеної liveness-перевірки long-poll за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис опитування не завершив `getUpdates` після стартового пільгового періоду, коли запущений webhook-обліковий запис не завершив `setWebhook` після стартового пільгового періоду, або коли остання успішна активність транспорту опитування застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе ще повідомляє про хибні перезапуски через зависання опитування. Постійні зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або вихідного TLS-з’єднання між хостом і `api.telegram.org`.
    - Telegram також враховує env proxy процесу для транспорту Bot API, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти в нижньому регістрі. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища, а стандартні env proxy відсутні, Telegram також використовує цю URL-адресу для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим вихідним трафіком/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2). Порядок результатів DNS Telegram враховує `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, потім `channels.telegram.network.dnsResultOrder`, потім типове значення процесу, як-от `NODE_OPTIONS=--dns-result-order=ipv4first`; якщо нічого не застосовується, Node 22+ повертається до `ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює з поведінкою лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді діапазону для бенчмарків RFC 2544 (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціальну адресу під час завантажень медіа, ви можете
      увімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме ввімкнення доступне для кожного облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy резолвить хости медіа Telegram у `198.18.x.x`, спершу залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє діапазон
      бенчмарків RFC 2544 за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      media SSRF. Використовуйте це лише для довірених proxy-середовищ під
      контролем оператора, як-от fake-IP-маршрутизація Clash, Mihomo або Surge, коли вони
      синтезують приватні або спеціальні відповіді поза діапазоном бенчмарків
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

Додаткова допомога: [Усунення несправностей каналу](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="Найважливіші поля Telegram">

- запуск/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; symlinks відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневі `bindings[]` (`type: "acp"`)
- схвалення exec: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (попередній перегляд), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- користувацький корінь API: `apiRoot` (лише корінь Bot API; не включайте `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритет для кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб зробити типову маршрутизацію явною. Інакше OpenClaw повертається до першого нормалізованого ID облікового запису, а `openclaw doctor` попереджає. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Telegram із gateway.
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
