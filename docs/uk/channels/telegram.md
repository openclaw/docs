---
read_when:
    - Робота над функціями Telegram або Webhook
summary: Стан підтримки, можливості та конфігурація бота Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-02T09:29:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: dde2a15c6529365e6174f8e0640c1955b63fdfafa952b675159db93c5d43041c
    source_path: channels/telegram.md
    workflow: 16
---

Готово до продакшену для DM ботів і груп через grammY. Довге опитування є стандартним режимом; режим Webhook необовʼязковий.

<CardGroup cols={3}>
  <Card title="Спарювання" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM для Telegram — спарювання.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика й інструкції з відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
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

    Резервне значення env: `TELEGRAM_BOT_TOKEN=...` (лише стандартний обліковий запис).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у конфігурації/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди спарювання спливають через 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення конфігурації мають пріоритет над резервним значенням env, а `TELEGRAM_BOT_TOKEN` застосовується лише до стандартного облікового запису.
</Note>

## Налаштування на стороні Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість груп">
    Для ботів Telegram стандартно ввімкнено **Privacy Mode**, який обмежує, які групові повідомлення вони отримують.

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

    - `pairing` (стандартно)
    - `allowlist` (потребує принаймні одного ID відправника в `allowFrom`)
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `dmPolicy: "open"` з `allowFrom: ["*"]` дає змогу будь-якому обліковому запису Telegram, який знайде або вгадає імʼя користувача бота, керувати ботом. Використовуйте це лише для навмисно публічних ботів із жорстко обмеженими інструментами; боти з одним власником мають використовувати `allowlist` із числовими ID користувачів.

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    У конфігураціях із кількома обліковими записами обмежувальний верхньорівневий `channels.telegram.allowFrom` розглядається як межа безпеки: записи рівня облікового запису `allowFrom: ["*"]` не роблять цей обліковий запис публічним, якщо ефективний список allowlist облікового запису після обʼєднання все ще не містить явного wildcard.
    `dmPolicy: "allowlist"` із порожнім `allowFrom` блокує всі DM і відхиляється валідацією конфігурації.
    Налаштування запитує лише числові ID користувачів.
    Якщо ви оновилися й ваша конфігурація містить записи allowlist виду `@username`, запустіть `openclaw doctor --fix`, щоб їх розвʼязати (найкраще зусилля; потребує токена бота Telegram).
    Якщо раніше ви покладалися на файли allowlist зі сховища спарювання, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` у потоках allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником надавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID `allowFrom`, щоб політика доступу була надійно зафіксована в конфігурації (замість залежності від попередніх схвалень спарювання).

    Типова плутанина: схвалення спарювання DM не означає «цей відправник авторизований усюди».
    Спарювання надає доступ до DM. Якщо власника команд ще немає, перше схвалене спарювання також встановлює `commands.ownerAllowFrom`, щоб команди лише для власника та схвалення exec мали явний обліковий запис оператора.
    Авторизація відправників у групах усе ще надходить із явних allowlist у конфігурації.
    Якщо ви хочете «я авторизований один раз, і працюють як DM, так і групові команди», додайте свій числовий ID користувача Telegram до `channels.telegram.allowFrom`; для команд лише для власника переконайтеся, що `commands.ownerAllowFrom` містить `telegram:<your user id>`.

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
       - немає конфігурації `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки group-ID
         - з `groupPolicy: "allowlist"` (стандартно): групи заблоковані, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (стандартно)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо не задано, Telegram повертається до `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не додавайте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Відʼємні ID чатів належать до `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): авторизація відправників у групах **не** успадковує схвалення зі сховища спарювання DM.
    Спарювання лишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` для окремої групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram повертається до конфігураційного `allowFrom`, а не до сховища спарювання.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, залиште `groupAllowFrom` незаданим і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime стандартно закривається без доступу з `groupPolicy="allowlist"`, якщо `channels.defaults.groupPolicy` не задано явно.

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

      - Додавайте відʼємні ID чатів груп або супергруп Telegram, як-от `-1001234567890`, до `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, як-от `8734062810`, до `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть запускати бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.

    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Групові відповіді стандартно потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд рівня сеансу:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сеансу. Для збереження використовуйте конфігурацію.

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

    - переслати групове повідомлення до `@userinfobot` / `@getidsbot`
    - або прочитати `chat.id` з `openclaw logs --follow`
    - або перевірити Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні повідомлення Telegram отримують відповіді назад у Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються в спільний конверт каналу з метаданими відповіді та заповнювачами медіа.
- Групові сеанси ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб тримати теми ізольованими.
- DM-повідомлення можуть містити `message_thread_id`; OpenClaw зберігає ID потоку для відповідей, але стандартно лишає DM у плоскому сеансі. Налаштуйте `channels.telegram.direct.<chatId>.threadReplies: "inbound"` або `requireTopic: true`, коли навмисно хочете ізоляцію сеансів за темами DM.
- Довге опитування використовує grammY runner із послідовністю за чатом/потоком. Загальна конкурентність runner sink використовує `agents.defaults.maxConcurrent`.
- Довге опитування захищене всередині кожного процесу gateway, тож лише один активний poller може використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, імовірно, той самий токен використовує інший gateway OpenClaw, скрипт або зовнішній poller.
- Перезапуски watchdog для довгого опитування стандартно спрацьовують після 120 секунд без завершеного liveness `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо ваше розгортання все ще бачить хибні перезапуски через зависання опитування під час тривалої роботи. Значення в мілісекундах і дозволене від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує read receipts (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Live stream preview (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: preview-повідомлення + `editMessageText`
    - групи/теми: preview-повідомлення + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (стандартно: `partial`)
    - `progress` зіставляється з `partial` у Telegram (сумісність із міжканальним іменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме редаговане preview-повідомлення (стандартно: `true`, коли preview streaming активний)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; запустіть `openclaw doctor --fix`, щоб перенести їх у `channels.telegram.streaming.mode`

    Preview-оновлення прогресу інструментів — це короткі рядки "Working...", які показуються під час виконання інструментів, наприклад виконання команд, читання файлів, оновлення планування або підсумки патчів. Telegram лишає їх увімкненими стандартно, щоб відповідати випущеній поведінці OpenClaw з `v2026.4.22` і пізніше. Щоб зберегти редагований preview для тексту відповіді, але приховати рядки прогресу інструментів, задайте:

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

    Використовуйте `streaming.mode: "off"` лише тоді, коли потрібна доставка тільки фінальної відповіді: редагування попереднього перегляду в Telegram вимикаються, а звичайні повідомлення інструментів/прогресу пригнічуються замість надсилання окремими повідомленнями "Working...". Запити на схвалення, медіа-вміст і помилки все одно проходять через звичайну фінальну доставку. Використовуйте `streaming.preview.toolProgress: false`, коли потрібно зберегти лише редагування попереднього перегляду відповіді, приховуючи рядки стану прогресу інструментів.

    Для відповідей лише з текстом:

    - короткі попередні перегляди в DM/групі/темі: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці
    - попередні перегляди, старші приблизно за одну хвилину: OpenClaw надсилає завершену відповідь як нове фінальне повідомлення, а потім очищає попередній перегляд, щоб видима позначка часу Telegram відображала час завершення, а не час створення попереднього перегляду

    Для складних відповідей (наприклад, медіа-вмісту) OpenClaw повертається до звичайної фінальної доставки, а потім очищає повідомлення попереднього перегляду.

    Потокове передавання попереднього перегляду відокремлене від потокового передавання блоків. Коли потокове передавання блоків явно ввімкнене для Telegram, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування до живого попереднього перегляду під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування й резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown відтворюється як HTML, безпечний для Telegram.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок парсингу Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередні перегляди посилань увімкнені за замовчуванням і можуть бути вимкнені через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди й власні команди">
    Реєстрація меню команд Telegram обробляється під час запуску через `setMyCommands`.

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

    - імена нормалізуються (прибирається початковий `/`, нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - власні команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються й журналюються

    Нотатки:

    - власні команди є лише записами меню; вони не реалізують поведінку автоматично
    - команди plugin/skill усе одно можуть працювати під час введення, навіть якщо їх не показано в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Власні команди або команди plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені помилки налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнилося після обрізання; зменште кількість команд plugin/skill/власних команд або вимкніть `channels.telegram.commands.native`.
    - Збій `deleteWebhook`, `deleteMyCommands` або `setMyCommands` з `404: Not Found`, коли прямі команди curl до Bot API працюють, може означати, що `channels.telegram.apiRoot` було встановлено на повну кінцеву точку `/bot<TOKEN>`. `apiRoot` має бути лише коренем Bot API, а `openclaw doctor --fix` видаляє випадковий кінцевий `/bot<TOKEN>`.
    - `getMe returned 401` означає, що Telegram відхилив налаштований токен бота. Оновіть `botToken`, `tokenFile` або `TELEGRAM_BOT_TOKEN` поточним токеном BotFather; OpenClaw зупиняється до polling, тому це не повідомляється як збій очищення webhook.
    - `setMyCommands failed` з помилками мережі/завантаження зазвичай означає, що вихідні DNS/HTTPS-з'єднання до `api.telegram.org` заблоковані.

    ### Команди сполучення пристроїв (`device-pair` plugin)

    Коли встановлено `device-pair` plugin:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунку iOS
    3. `/pair pending` перелічує запити в очікуванні (зокрема роль/області)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит в очікуванні
       - `/pair approve latest` для найновішого

    Код налаштування містить короткочасний bootstrap-токен. Вбудована передача bootstrap зберігає токен основного вузла на `scopes: []`; будь-який переданий операторський токен залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки областей bootstrap мають префікс ролі, тому цей список дозволів оператора задовольняє лише операторські запити; неоператорські ролі все одно потребують областей під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими деталями автентифікації (наприклад, роль/області/публічний ключ), попередній запит в очікуванні замінюється, а новий запит використовує інший `requestId`. Повторно виконайте `/pair pending` перед схваленням.

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

    Кліки callback передаються агенту як текст:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Дії повідомлень Telegram для агентів і автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов'язкові `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов'язкові `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керування обмеженнями:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі ввімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час виконання використовує активний знімок конфігурації/секретів (запуск/перезавантаження), тому шляхи дій не виконують спеціальне повторне розв'язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги гілок відповідей">
    Telegram підтримує явні теги гілок відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, що спричинило запуск
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Коли гілки відповідей увімкнені й доступний початковий текст або підпис Telegram, OpenClaw автоматично додає нативний уривок цитати Telegram. Telegram обмежує нативний текст цитати 1024 кодовими одиницями UTF-16, тому довші повідомлення цитуються від початку й повертаються до звичайної відповіді, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявні гілки відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму й поведінка гілок">
    Форумні супергрупи:

    - ключі сесій теми додають `:topic:<threadId>`
    - відповіді й індикація набору спрямовуються в гілку теми
    - шлях конфігурації теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Особливий випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все одно включають `message_thread_id`

    Успадкування теми: записи теми успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` стосується лише теми й не успадковується з типових налаштувань групи.

    **Маршрутизація агентів для окремих тем**: Кожна тема може маршрутизувати до іншого агента, якщо встановити `agentId` у конфігурації теми. Це надає кожній темі власний ізольований робочий простір, пам'ять і сесію. Приклад:

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

    **Стійке прив'язування тем ACP**: Теми форуму можуть закріплювати сесії ACP harness через типізовані прив'язки ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ідентифікатором із кваліфікатором теми, як-от `-1001234567890:topic:42`). Наразі обмежено темами форуму в групах/супергрупах. Див. [Агенти ACP](/uk/tools/acp-agents).

    **Запуск ACP, прив'язаний до гілки, з чату**: `/acp spawn <agent> --thread here|auto` прив'язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди напряму. OpenClaw закріплює підтвердження запуску в темі. Потрібно, щоб `channels.telegram.threadBindings.spawnSessions` залишалося ввімкненим (за замовчуванням: `true`).

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` зберігають маршрутизацію DM і метадані відповіді; вони використовують ключі сесій з урахуванням гілок лише тоді, коли DM налаштовано з `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` або відповідною конфігурацією теми.

  </Accordion>

  <Accordion title="Аудіо, відео й наліпки">
    ### Аудіоповідомлення

    Telegram розрізняє голосові нотатки й аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає як голосову нотатку
    - вхідні транскрипти голосових нотаток оформлюються як машинно згенерований,
      ненадійний текст у контексті агента; виявлення згадок усе одно використовує сирий
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

    Telegram розрізняє відеофайли й відеонотатки.

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

    ### Наліпки

    Обробка вхідних наліпок:

    - статичний WEBP: завантажується й обробляється (заповнювач `<media:sticker>`)
    - анімований TGS: пропускається
    - відео WEBM: пропускається

    Поля контексту наліпки:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Файл кешу наліпок:

    - `~/.openclaw/telegram/sticker-cache.json`

    Наліпки описуються один раз (коли можливо) і кешуються, щоб зменшити повторні виклики зору.

    Увімкніть дії з наліпками:

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

    Дія надсилання наліпки:

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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від payload повідомлення).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (типово: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (типово: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно поважають засоби контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ідентифікатори потоків в оновленнях реакцій.
      - групи без форумів маршрутизуються до сесії групового чату
      - групи з форумами маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включає `message_reaction`.

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
    Записи конфігурації каналу ввімкнені типово (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції групи (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
    - `/config set` і `/config unset` (потребує ввімкнення команд)

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
    Типово використовується long polling. Для режиму webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язкові `webhookPath`, `webhookHost`, `webhookPort` (типові значення `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний слухач прив’язується до `127.0.0.1:8787`. Для публічного ingress або поставте reverse proxy перед локальним портом, або навмисно задайте `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє захисти запитів, секретний токен Telegram і JSON-тіло перед поверненням `200` до Telegram.
    Потім OpenClaw асинхронно обробляє оновлення через ті самі bot lanes для кожного чату/кожної теми, що використовуються long polling, тому повільні ходи агента не затримують delivery ACK Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (типово 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає timeout клієнта Telegram API (якщо не задано, застосовується типове значення grammY). Клієнти ботів long-polling обмежують налаштовані значення нижче за 45-секундний захист запиту `getUpdates`, щоб idle polls не переривалися до завершення 30-секундного вікна опитування.
    - `channels.telegram.pollingStallThresholdMs` типово дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через polling-stall.
    - Історія групового контексту використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (типово 50); `0` вимикає.
    - Додатковий контекст відповіді/цитати/пересилання наразі передається так, як отриманий.
    - Allowlist Telegram передусім обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Елементи керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Конфігурація `channels.telegram.retry` застосовується до допоміжних засобів надсилання Telegram (CLI/tools/actions) для відновлюваних помилок вихідного API. Доставка фінальної вхідної відповіді також використовує обмежену повторну спробу безпечного надсилання для збоїв Telegram до підключення, але не повторює неоднозначні мережеві envelope після надсилання, які могли б дублювати видимі повідомлення.

    Ціль надсилання CLI може бути числовим ID чату або іменем користувача:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Опитування Telegram використовують `openclaw message poll` і підтримують теми форумів:

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
    - `--thread-id` для тем форумів (або використовуйте ціль `:topic:`)

    Надсилання Telegram також підтримує:

    - `--presentation` з блоками `buttons` для inline-клавіатур, коли `channels.telegram.capabilities.inlineButtons` це дозволяє
    - `--pin` або `--delivery '{"pin":true}'`, щоб запросити закріплену доставку, коли бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення й GIF як документи замість стиснених фото або завантажень animated-media

    Обмеження дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Підтвердження exec у Telegram">
    Telegram підтримує підтвердження exec у DM підтверджувачів і може необов’язково публікувати prompts у початковому чаті або темі. Підтверджувачі мають бути числовими ID користувачів Telegram.

    Шлях конфігурації:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли можна визначити принаймні одного підтверджувача)
    - `channels.telegram.execApprovals.approvers` (резервно використовує числові ID власників із `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (типово) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` і `defaultTo` контролюють, хто може говорити з ботом і куди він надсилає звичайні відповіді. Вони не роблять когось підтверджувачем exec. Перше затверджене спарювання DM ініціалізує `commands.ownerAllowFrom`, коли власника команд ще немає, тож налаштування з одним власником і далі працює без дублювання ID у `execApprovals.approvers`.

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених групах/темах. Коли prompt потрапляє в тему форуму, OpenClaw зберігає тему для prompt підтвердження та подальшого повідомлення. Підтвердження exec типово спливають через 30 хвилин.

    Кнопки inline-підтвердження також потребують, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID підтверджень із префіксом `plugin:` визначаються через підтвердження plugin; інші спочатку визначаються через підтвердження exec.

    Див. [Підтвердження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Елементи керування відповідями про помилки

Коли агент стикається з помилкою доставки або provider, Telegram може або відповісти текстом помилки, або придушити його. Цю поведінку контролюють два ключі конфігурації:

| Ключ                                | Значення          | Типово  | Опис                                                                                            |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю придушує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями про помилки до того самого чату. Запобігає спаму помилок під час перебоїв. |

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

    - коли `channels.telegram.groups` існує, група має бути в списку (або включати `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють зовсім">

    - авторизуйте ідентичність свого відправника (спарювання та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи — `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що в нативному меню забагато записів; зменште кількість plugin/skill/користувацьких команд або вимкніть нативні меню
    - startup-виклики `deleteMyCommands` / `setMyCommands` обмежені й повторюються один раз через транспортний fallback Telegram у разі timeout запиту. Постійні помилки мережі/fetch зазвичай вказують на проблеми доступності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Startup повідомляє про неавторизований токен">

    - `getMe returned 401` — це збій автентифікації Telegram для налаштованого токена бота.
    - Повторно скопіюйте або згенеруйте заново токен бота в BotFather, потім оновіть `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` або `TELEGRAM_BOT_TOKEN` для типового облікового запису.
    - `deleteWebhook 401 Unauthorized` під час startup — це також збій автентифікації; трактування цього як "webhook не існує" лише відклало б той самий збій поганого токена до пізніших API-викликів.
    - Якщо `deleteWebhook` завершується з тимчасовою мережевою помилкою під час polling startup, OpenClaw перевіряє `getWebhookInfo`; коли Telegram повідомляє порожній URL webhook, polling продовжується, бо cleanup уже виконано.

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + користувацький fetch/proxy може спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спершу розв’язують `api.telegram.org` в IPv6; несправний вихідний IPv6-трафік може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює ці спроби як відновлювані мережеві помилки.
    - Якщо сокети Telegram перестворюються з коротким фіксованим інтервалом, перевірте, чи не задано низьке значення `channels.telegram.timeoutSeconds`; клієнти ботів із long-polling обмежують налаштовані значення нижче захисного ліміту запиту `getUpdates`, але старіші випуски могли переривати кожне опитування, коли це значення було нижчим за тайм-аут long-poll.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає опитування й перебудовує транспорт Telegram після 120 секунд без завершеної перевірки життєздатності long-poll за замовчуванням.
    - `openclaw channels status --probe` і `openclaw doctor` попереджають, коли запущений обліковий запис з опитуванням не завершив `getUpdates` після стартового пільгового періоду, коли запущений обліковий запис webhook не завершив `setWebhook` після стартового пільгового періоду або коли остання успішна активність транспорту опитування застаріла.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` справні, але ваш хост усе одно повідомляє про хибні перезапуски через зависання опитування. Постійні зависання зазвичай вказують на проблеми проксі, DNS, IPv6 або вихідного TLS між хостом і `api.telegram.org`.
    - Telegram також враховує змінні середовища проксі процесу для транспорту Bot API, зокрема `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` та їхні варіанти в нижньому регістрі. `NO_PROXY` / `no_proxy` усе ще можуть обходити `api.telegram.org`.
    - Якщо керований проксі OpenClaw налаштовано через `OPENCLAW_PROXY_URL` для сервісного середовища й немає стандартної змінної середовища проксі, Telegram також використовує цей URL для транспорту Bot API.
    - На VPS-хостах із нестабільним прямим вихідним трафіком/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ за замовчуванням використовує `autoSelectFamily=true` (крім WSL2). Порядок результатів DNS для Telegram враховує `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, потім `channels.telegram.network.dnsResultOrder`, а потім типовий порядок процесу, як-от `NODE_OPTIONS=--dns-result-order=ipv4first`; якщо нічого не застосовується, Node 22+ повертається до `ipv4first`.
    - Якщо ваш хост є WSL2 або явно краще працює з поведінкою лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону RFC 2544 для бенчмаркінгу (`198.18.0.0/15`) уже дозволені
      для завантажень медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      прозорий проксі переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціального використання адресу під час завантаження медіа, ви можете
      увімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Такий самий явний дозвіл доступний для кожного облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш проксі розв’язує медіахости Telegram у `198.18.x.x`, спершу залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє діапазон RFC 2544
      для бенчмаркінгу за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захисти Telegram
      media SSRF. Використовуйте це лише для довірених проксі-середовищ, контрольованих оператором,
      як-от маршрутизація fake-IP у Clash, Mihomo або Surge, коли вони
      синтезують приватні або спеціального використання відповіді поза діапазоном RFC 2544 для
      бенчмаркінгу. Залишайте це вимкненим для звичайного публічного доступу Telegram через інтернет.
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

Докладніше: [Усунення проблем із каналами](/uk/channels/troubleshooting).

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневі `bindings[]` (`type: "acp"`)
- підтвердження exec: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- потокове передавання: `streaming` (попередній перегляд), `streaming.preview.toolProgress`, `blockStreaming`
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
Пріоритет для кількох облікових записів: коли налаштовано два або більше ідентифікаторів облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити типову маршрутизацію. Інакше OpenClaw повертається до першого нормалізованого ідентифікатора облікового запису, а `openclaw doctor` попереджає. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Telegram із gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка списку дозволених груп і тем.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте групи й теми з агентами.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика.
  </Card>
</CardGroup>
