---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки бота Telegram, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:29:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5711d53cf908a14024bc5a94f7d590bb4bcb6963a1d78049d7782871f4eae932
    source_path: channels/telegram.md
    workflow: 16
---

Готово до продакшну для DM ботів і груп через grammY. Long polling є режимом за замовчуванням; режим Webhook необов’язковий.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM для Telegram — сполучення.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що handle точно `@BotFather`).

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

    Резервний варіант через змінну середовища: `TELEGRAM_BOT_TOKEN=...` (лише стандартний обліковий запис).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у конфігурації/змінній середовища, а потім запустіть gateway.

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
Порядок визначення токена враховує обліковий запис. На практиці значення конфігурації мають пріоритет над резервним варіантом зі змінної середовища, а `TELEGRAM_BOT_TOKEN` застосовується лише до стандартного облікового запису.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    Боти Telegram за замовчуванням використовують **режим приватності**, який обмежує те, які групові повідомлення вони отримують.

    Якщо бот має бачити всі групові повідомлення, виконайте один із варіантів:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму приватності видаліть і повторно додайте бота в кожну групу, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі групові повідомлення, що корисно для постійно активної поведінки в групах.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups` для дозволу/заборони додавання до груп
    - `/setprivacy` для поведінки видимості в групах

  </Accordion>
</AccordionGroup>

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен принаймні один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дозволяє будь-якому обліковому запису Telegram, який знайде або вгадає ім’я користувача бота, командувати ботом. Використовуйте це лише для навмисно публічних ботів із жорстко обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими ID користувачів.

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний верхньорівневий `channels.telegram.allowFrom` вважається межею безпеки: записи рівня облікового запису `allowFrom: ["*"]` не роблять цей обліковий запис публічним, якщо ефективний allowlist облікового запису після злиття все ще не містить явного wildcard.
    `dmPolicy: "allowlist"` із порожнім `allowFrom` блокує всі DM і відхиляється перевіркою конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися й ваша конфігурація містить записи allowlist з `@username`, виконайте `openclaw doctor --fix`, щоб їх розв’язати (найкраща спроба; потрібен токен бота Telegram).
    Якщо раніше ви покладалися на файли allowlist зі сховища сполучень, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу була сталою в конфігурації (замість залежності від попередніх схвалень сполучення).

    Типове непорозуміння: схвалення сполучення DM не означає "цей відправник авторизований усюди".
    Сполучення надає доступ до DM. Якщо власника команд ще немає, перше схвалене сполучення також задає `commands.ownerAllowFrom`, щоб команди лише для власника й схвалення exec мали явний обліковий запис оператора.
    Авторизація відправника в групі все одно походить із явних allowlist у конфігурації.
    Якщо ви хочете "мене авторизовано один раз, і працюють і DM, і групові команди", додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

    ### Як знайти свій ID користувача Telegram

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

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два елементи керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає конфігурації `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи заблоковані, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: діє як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення зі сховища сполучень DM.
    Сполучення залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` для окремої групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до конфігураційного `allowFrom`, а не до сховища сполучень.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо виконання: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням використовує fail-closed `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` не задано явно.

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
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.

    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Відповіді в групах за замовчуванням потребують згадки.

    Згадка може походити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для збереження використовуйте конфігурацію.

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

    Як отримати ID групового чату:

    - перешліть групове повідомлення до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перегляньте `getUpdates` у Bot API

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні повідомлення Telegram отримують відповідь у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний envelope каналу з метаданими відповіді та placeholders для медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw зберігає ID thread для відповідей, але за замовчуванням залишає DM у плоскій сесії. Налаштуйте `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` або відповідну конфігурацію теми, коли ви навмисно хочете ізоляцію сесій DM за темами.
- Long polling використовує runner grammY з послідовністю на рівні чату/thread. Загальна concurrency sink runner використовує `agents.defaults.maxConcurrent`.
- Long polling захищено всередині кожного процесу gateway, щоб лише один активний poller міг використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, інший gateway OpenClaw, скрипт або зовнішній poller, імовірно, використовує той самий токен.
- Перезапуски watchdog long-polling за замовчуванням запускаються після 120 секунд без завершеного `getUpdates` liveness. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні перезапуски через polling-stall під час довготривалої роботи. Значення в мілісекундах і дозволене в діапазоні від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує сповіщення про прочитання (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` — це `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` зберігає один редагований чернетковий статус і оновлює його прогресом інструментів до фінальної доставки
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`, коли активний preview streaming)
    - `streaming.preview.commandText` керує деталями command/exec у цих рядках прогресу інструментів: `raw` (за замовчуванням, зберігає випущену поведінку) або `status` (лише мітка інструмента)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; виконайте `openclaw doctor --fix`, щоб мігрувати їх до `channels.telegram.streaming.mode`

    Оновлення попереднього перегляду прогресу інструментів — це короткі рядки статусу, що показуються під час виконання інструментів, наприклад виконання команд, читання файлів, оновлення планування або підсумки patch. Telegram залишає їх увімкненими за замовчуванням, щоб відповідати випущеній поведінці OpenClaw від `v2026.4.22` і пізніше. Щоб зберегти відредагований попередній перегляд для тексту відповіді, але приховати рядки прогресу інструментів, задайте:

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

    Використовуйте `streaming.mode: "off"` лише тоді, коли потрібна доставка тільки фінальної відповіді: редагування попереднього перегляду Telegram вимикаються, а загальні повідомлення інструментів/прогресу приглушуються замість надсилання як окремих статусних повідомлень. Запити на схвалення, медіа-вміст і помилки й надалі проходять через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли потрібно залишити тільки редагування попереднього перегляду відповіді, приховавши статусні рядки прогресу інструментів.

    <Note>
      Відповіді Telegram на вибрані цитати є винятком. Коли `replyToMode` має значення `"first"`, `"all"` або `"batched"` і вхідне повідомлення містить текст вибраної цитати, OpenClaw надсилає фінальну відповідь через нативний шлях відповіді на цитату Telegram замість редагування попереднього перегляду відповіді, тому `streaming.preview.toolProgress` не може показувати короткі статусні рядки для цього ходу. Відповіді на поточне повідомлення без тексту вибраної цитати й надалі зберігають потоковий попередній перегляд. Установіть `replyToMode: "off"`, коли видимість прогресу інструментів важливіша за нативні відповіді на цитати, або встановіть `streaming.preview.toolProgress: false`, щоб підтвердити цей компроміс.
    </Note>

    Для відповідей лише з текстом:

    - короткі попередні перегляди в DM/групі/темі: OpenClaw зберігає те саме повідомлення попереднього перегляду та виконує фінальне редагування на місці, якщо після появи попереднього перегляду не було надіслано видимого повідомлення не з попереднього перегляду
    - попередні перегляди, після яких іде видимий вивід не з попереднього перегляду: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення й очищає старіший попередній перегляд, тому фінальна відповідь з'являється після проміжного виводу
    - попередні перегляди, старші приблизно за одну хвилину: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення, а потім очищає попередній перегляд, тому видима позначка часу Telegram відображає час завершення замість часу створення попереднього перегляду

    Для складних відповідей (наприклад, медіа-вмісту) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Потоковий попередній перегляд відокремлений від блокового потокового передавання. Коли блокове потокове передавання явно ввімкнено для Telegram, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в живий попередній перегляд під час генерації
    - попередній перегляд міркувань видаляється після фінальної доставки; використовуйте `/reasoning on`, коли міркування мають залишатися видимими
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок парсингу Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередні перегляди посилань увімкнені за замовчуванням і можуть бути вимкнені через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Реєстрація меню команд Telegram обробляється під час запуску за допомогою `setMyCommands`.

    Стандартні значення нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте власні записи в меню команд:

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
    - власні команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та записуються в журнал

    Примітки:

    - власні команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills можуть працювати під час введення, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Власні команди або команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені помилки налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після обрізання; зменште кількість команд Plugin/Skills/власних команд або вимкніть `channels.telegram.commands.native`.
    - Помилка `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, тоді як прямі команди curl до Bot API працюють, може означати, що `channels.telegram.apiRoot` було встановлено як повний кінцевий шлях `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється до polling, тому це не повідомляється як помилка очищення Webhook.
    - `setMyCommands failed` з помилками мережі/fetch зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблоковано.

    ### Команди сполучення пристрою (`device-pair` plugin)

    Коли встановлено `device-pair` plugin:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список очікуваних запитів (зокрема роль/області доступу)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один очікуваний запит
       - `/pair approve latest` для найновішого

    Код налаштування містить короткочасний bootstrap-токен. Вбудована передача bootstrap зберігає токен основного вузла на `scopes: []`; будь-який переданий операторський токен залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки областей доступу bootstrap мають префікс ролі, тому цей allowlist оператора задовольняє лише операторські запити; неоператорські ролі все ще потребують областей доступу з власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними автентифікації (наприклад, роллю/областями доступу/публічним ключем), попередній очікуваний запит замінюється, а новий запит використовує інший `requestId`. Повторно виконайте `/pair pending` перед схваленням.

    Докладніше: [Сполучення](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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

  <Accordion title="Telegram message actions for agents and automation">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов'язково `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов'язково `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Елементи керування обмеженням доступу:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час виконання використовують активний знімок конфігурації/секретів (запуск/перезавантаження), тому шляхи дій не виконують спеціальне повторне розв'язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, що ініціювало запит
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Коли потоки відповідей увімкнені й доступний оригінальний текст або підпис Telegram, OpenClaw автоматично додає нативний фрагмент цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються від початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявні потоки відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Форумні супергрупи:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор набору спрямовуються в потік теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень не містять `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все ще містять `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` є лише тематичним і не успадковується від стандартних налаштувань групи.

    **Маршрутизація агентів за темами**: кожна тема може маршрутизуватися до іншого агента через установлення `agentId` у конфігурації теми. Це дає кожній темі власний ізольований робочий простір, пам'ять і сесію. Приклад:

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

    **Постійне прив'язування тем ACP**: форумні теми можуть закріплювати сесії ACP harness через типізовані прив'язування ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"`, а також ID з кваліфікацією теми, як-от `-1001234567890:topic:42`). Наразі область дії обмежена форумними темами в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Прив'язаний до потоку ACP spawn із чату**: `/acp spawn <agent> --thread here|auto` прив'язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди напряму. OpenClaw закріплює підтвердження spawn у темі. Потребує, щоб `channels.telegram.threadBindings.spawnSessions` залишався ввімкненим (за замовчуванням: `true`).

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` за замовчуванням зберігають маршрутизацію DM і метадані відповіді у плоских сесіях; вони використовують ключі сесій з урахуванням тредів лише коли налаштовано `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` або відповідну конфігурацію теми. Використовуйте верхньорівневий `channels.telegram.dm.threadReplies` для типового значення облікового запису або `direct.<chatId>.threadReplies` для одного DM.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає голосову нотатку
    - транскрипти вхідних голосових нотаток оформлюються як машинно згенерований,
      недовірений текст у контексті агента; виявлення згадок усе одно використовує сирий
      транскрипт, тому голосові повідомлення з пропуском за згадкою продовжують працювати.

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

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувача на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно дотримуються контролів доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID тредів в оновленнях реакцій.
      - групи без форуму маршрутизуються до сесії групового чату
      - групи форуму маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для опитування/Webhook автоматично включає `message_reaction`.

  </Accordion>

  <Accordion title="Ack-реакції">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує емодзі Unicode (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації з подій і команд Telegram">
    Записи конфігурації каналу ввімкнені за замовчуванням (`configWrites !== false`).

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

  <Accordion title="Довге опитування проти Webhook">
    За замовчуванням використовується довге опитування. Для режиму Webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язкові `webhookPath`, `webhookHost`, `webhookPort` (типові значення `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного входу або поставте reverse proxy перед локальним портом, або свідомо задайте `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє захисти запиту, секретний токен Telegram і JSON-тіло перед поверненням `200` до Telegram.
    Далі OpenClaw обробляє оновлення асинхронно через ті самі смуги бота на чат/тему, що використовуються довгим опитуванням, тому повільні ходи агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.mediaGroupFlushMs` (за замовчуванням 500) керує тим, як довго альбоми/медіагрупи Telegram буферизуються, перш ніж OpenClaw відправить їх як одне вхідне повідомлення. Збільште значення, якщо частини альбому надходять із запізненням; зменште його, щоб скоротити затримку відповіді на альбом.
    - `channels.telegram.timeoutSeconds` перевизначає таймаут клієнта Telegram API (якщо не задано, застосовується типове значення grammY). Клієнти ботів обмежують налаштовані значення нижче 60-секундного захисту вихідного текстового/typing-запиту, щоб grammY не переривав доставку видимої відповіді до того, як зможуть спрацювати транспортний захист і резервний шлях OpenClaw. Довге опитування все ще використовує 45-секундний захист запиту `getUpdates`, щоб простоюючі опитування не покидалися на невизначений час.
    - `channels.telegram.pollingStallThresholdMs` за замовчуванням дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання опитування.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає.
    - додатковий контекст відповіді/цитати/пересилання наразі передається як отриманий.
    - allowlist Telegram передусім обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до допоміжних засобів надсилання Telegram (CLI/інструменти/дії) для відновлюваних вихідних помилок API. Доставка фінальної відповіді на вхідне повідомлення також використовує обмежену безпечну повторну спробу надсилання для збоїв попереднього підключення Telegram, але не повторює неоднозначні мережеві конверти після надсилання, які могли б дублювати видимі повідомлення.

    Цілі надсилання CLI та message-tool можуть бути числовим ID чату, ім’ям користувача або ціллю теми форуму:

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

    - `--presentation` з блоками `buttons` для inline-клавіатур, коли `channels.telegram.capabilities.inlineButtons` це дозволяє
    - `--pin` або `--delivery '{"pin":true}'`, щоб запросити закріплену доставку, коли бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Затвердження exec у Telegram">
    Telegram підтримує затвердження exec у DM затверджувачів і може додатково публікувати запити в початковому чаті або темі. Затверджувачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна розв’язати хоча б одного затверджувача)
    - `channels.telegram.execApprovals.approvers` (резервно використовує числові ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (за замовчуванням) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` керують тим, хто може говорити з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось затверджувачем exec. Перше схвалене DM-поєднання ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тому налаштування з одним власником усе одно працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему для запиту затвердження та подальшого повідомлення. Затвердження exec за замовчуванням спливають через 30 хвилин.

    Inline-кнопки затвердження також потребують, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID затверджень із префіксом `plugin:` розв’язуються через затвердження plugin; інші спочатку розв’язуються через затвердження exec.

    Див. [Затвердження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або provider, Telegram може або відповісти текстом помилки, або придушити її. Цю поведінку керують два ключі конфігурації:

| Ключ                                | Значення          | За замовчуванням | Опис                                                                                                      |
| ----------------------------------- | ----------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`          | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю пригнічує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`          | Мінімальний час між відповідями про помилки в той самий чат. Запобігає спаму помилками під час збоїв.     |

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
  <Accordion title="Бот не відповідає на групові повідомлення без згадки">

    - Якщо `requireMention=false`, режим приватності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть і знову додайте бота до групи
    - `openclaw channels status` попереджає, коли конфігурація очікує групові повідомлення без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ідентифікатори груп; wildcard `"*"` не можна перевірити на членство.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот узагалі не бачить групові повідомлення">

    - коли `channels.telegram.groups` існує, групу має бути вказано (або додано `"*"`)
    - перевірте членство бота в групі
    - перегляньте логи: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють узагалі">

    - авторизуйте ідентичність вашого відправника (сполучення та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи має значення `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато пунктів; зменште кількість команд Plugin/skill/користувацьких команд або вимкніть нативні меню
    - стартові виклики `deleteMyCommands` / `setMyCommands` і виклики індикації набору `sendChatAction` мають обмеження часу та повторюються один раз через резервний транспорт Telegram у разі тайм-ауту запиту. Постійні помилки мережі/fetch зазвичай указують на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Під час запуску повідомляється про неавторизований токен">

    - `getMe returned 401` — це помилка автентифікації Telegram для налаштованого токена бота.
    - Скопіюйте повторно або згенеруйте заново токен бота в BotFather, потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для облікового запису за замовчуванням.
    - `deleteWebhook 401 Unauthorized` під час запуску також є помилкою автентифікації; обробка цього як "webhook не існує" лише відклала б ту саму помилку поганого токена до пізніших викликів API.

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + користувацький fetch/proxy може спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку розв’язують `api.telegram.org` в IPv6; несправний IPv6 egress може спричиняти періодичні збої Telegram API.
    - Якщо логи містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює ці операції як відновлювані мережеві помилки.
    - Під час запуску polling OpenClaw повторно використовує успішну стартову перевірку `getMe` для grammY, щоб runner не потребував другого `getMe` перед першим `getUpdates`.
    - Якщо `deleteWebhook` завершується з тимчасовою мережевою помилкою під час запуску polling, OpenClaw переходить до long polling замість ще одного керівного виклику до polling. Все ще активний webhook проявляється як конфлікт `getUpdates`; тоді OpenClaw перебудовує транспорт Telegram і повторює очищення webhook.
    - Якщо сокети Telegram перестворюються з коротким фіксованим інтервалом, перевірте, чи не занизьке `channels.telegram.timeoutSeconds`; клієнти ботів обмежують налаштовані значення, нижчі за захисти outbound і запитів `getUpdates`, але старіші випуски могли переривати кожен poll або відповідь, коли це значення було нижчим за ці захисти.
    - Якщо логи містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної long-poll перевірки життєздатності за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис polling не завершив `getUpdates` після стартового пільгового періоду, коли запущений обліковий запис webhook не завершив `setWebhook` після стартового пільгового періоду або коли остання успішна активність транспорту polling застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе ще повідомляє про хибні перезапуски polling-stall. Постійні зупинки зазвичай указують на проблеми proxy, DNS, IPv6 або TLS egress між хостом і `api.telegram.org`.
    - Telegram також враховує env proxy процесу для транспорту Bot API, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти нижнім регістром. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований proxy OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища і стандартний proxy env відсутній, Telegram також використовує цю URL-адресу для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим egress/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2). Порядок результатів DNS Telegram враховує `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, потім `channels.telegram.network.dnsResultOrder`, потім стандарт процесу, як-от `NODE_OPTIONS=--dns-result-order=ipv4first`; якщо нічого не застосовується, Node 22+ повертається до `ipv4first`.
    - Якщо ваш хост є WSL2 або явно краще працює з поведінкою лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді діапазону benchmark RFC 2544 (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціальну адресу під час завантажень медіа, ви можете ввімкнути
      обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Таке саме ввімкнення доступне для кожного облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy розв’язує хости медіа Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє діапазон
      benchmark RFC 2544 за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захисти SSRF
      для медіа Telegram. Використовуйте це лише для довірених proxy-середовищ,
      контрольованих оператором, як-от маршрутизація fake-IP у Clash, Mihomo або Surge, коли вони
      синтезують приватні або спеціальні відповіді поза діапазоном benchmark
      RFC 2544. Залишайте це вимкненим для звичайного доступу Telegram через публічний інтернет.
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
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- схвалення виконання: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (попередній перегляд), `streaming.preview.toolProgress`, `blockStreaming`
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
Пріоритетність кількох облікових записів: коли налаштовано два або більше ідентифікаторів облікових записів, задайте `channels.telegram.defaultAccount` (або додайте `channels.telegram.accounts.default`), щоб явно визначити маршрутизацію за замовчуванням. Інакше OpenClaw повертається до першого нормалізованого ідентифікатора облікового запису, а `openclaw doctor` попереджає. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
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
    Крос-канальна діагностика.
  </Card>
</CardGroup>
