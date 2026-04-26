---
read_when:
    - Робота над функціями Telegram або Webhook-ами
summary: Статус підтримки, можливості та конфігурація бота Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-26T05:36:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7d269b15bc2d377fa45f0516e435517ed366c0216d0bc31fe4f4bc080a6c726
    source_path: channels/telegram.md
    workflow: 15
---

Готовий до продакшн-використання для DM бота та груп через grammY. Long polling — режим за замовчуванням; режим Webhook — необов’язковий.

<CardGroup cols={3}>
  <Card title="Зв’язування" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — зв’язування.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що хендл точно `@BotFather`).

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

    Резервне значення через env: `TELEGRAM_BOT_TOKEN=...` (лише для облікового запису за замовчуванням).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди зв’язування дійсні протягом 1 години.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення з config мають пріоритет над резервним значенням з env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування з боку Telegram

<AccordionGroup>
  <Accordion title="Режим конфіденційності та видимість у групах">
    За замовчуванням боти Telegram працюють у **Privacy Mode**, що обмежує, які повідомлення в групах вони отримують.

    Якщо бот має бачити всі повідомлення в групі, зробіть одне з такого:

    - вимкніть режим конфіденційності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після зміни режиму конфіденційності видаліть бота й додайте його знову в кожну групу, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups` — дозволити/заборонити додавання до груп
    - `/setprivacy` — поведінка видимості в групах

  </Accordion>
</AccordionGroup>

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потрібен щонайменше один ID відправника в `allowFrom`)
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються та нормалізуються.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється валідацією config.
    Під час налаштування запитуються лише числові ID користувачів.
    Якщо ви оновилися й ваша config містить записи allowlist у вигляді `@username`, виконайте `openclaw doctor --fix`, щоб перетворити їх (best-effort; потрібен токен бота Telegram).
    Якщо ви раніше покладалися на файли allowlist у pairing-store, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` для сценаріїв allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів із одним власником надавайте перевагу `dmPolicy: "allowlist"` із явними числовими ID в `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх схвалень зв’язування).

    Поширена плутанина: схвалення зв’язування DM не означає, що «цей відправник авторизований усюди».
    Зв’язування надає доступ лише до DM. Авторизація відправника в групах усе ще визначається явними allowlist у config.
    Якщо ви хочете, щоб «я був авторизований один раз, і працювали і DM, і команди в групах», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод через Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній метод (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два елементи керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи в `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо його не задано, Telegram використовує резервне значення з `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не додавайте ID чатів Telegram group або supergroup у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групах **не** успадковує схвалення DM із pairing-store.
    Зв’язування залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` на рівні групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує резервне значення з config `allowFrom`, а не pairing store.
    Практичний шаблон для ботів із одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, не задавайте `groupAllowFrom` і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням працює в режимі fail-closed з `groupPolicy="allowlist"`, якщо тільки `channels.defaults.groupPolicy` не задано явно.

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
      Поширена помилка: `groupAllowFrom` — це не allowlist груп Telegram.

      - Додавайте від’ємні ID Telegram group або supergroup, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Додавайте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, хто саме всередині дозволеної групи може звертатися до бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    Відповіді в групах за замовчуванням вимагають згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадки в:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для збереження використовуйте config.

    Приклад сталої config:

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

    - перешліть повідомлення з групи до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перевірте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні відповіді з Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються до спільного конверта каналу з метаданими відповіді та заповнювачами медіа.
- Сесії груп ізольовані за ID групи. Для forum topics додається `:topic:<threadId>`, щоб ізолювати теми.
- Повідомлення DM можуть містити `message_thread_id`; OpenClaw маршрутизує їх із ключами сесії, що враховують thread, і зберігає ID thread для відповідей.
- Long polling використовує grammY runner із послідовною обробкою для кожного чату/потоку. Загальна конкурентність sink у runner використовує `agents.defaults.maxConcurrent`.
- Long polling захищений у межах кожного процесу gateway, тому лише один активний poller може використовувати токен бота одночасно. Якщо ви все ще бачите конфлікти `getUpdates` 409, імовірно, той самий токен використовує інший gateway OpenClaw, скрипт або зовнішній poller.
- Перезапуски watchdog для long polling за замовчуванням спрацьовують після 120 секунд без завершеної перевірки живучості `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні й далі виникають хибні перезапуски через зависання polling під час довготривалої роботи. Значення задається в мілісекундах і може бути від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` у Telegram відповідає `partial` (сумісність із міжканальним найменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення tool/progress повторно використовують те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`, коли активне preview streaming)
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` виявляються; виконайте `openclaw doctor --fix`, щоб перенести їх у `channels.telegram.streaming.mode`

    Оновлення попереднього перегляду tool-progress — це короткі рядки «Працюю...», які показуються під час виконання інструментів, наприклад під час виконання команд, читання файлів, оновлень планування або зведень патчів. У Telegram вони увімкнені за замовчуванням, щоб відповідати випущеній поведінці OpenClaw починаючи з `v2026.4.22`. Щоб зберегти відредагований попередній перегляд для тексту відповіді, але приховати рядки tool-progress, задайте:

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

    Використовуйте `streaming.mode: "off"` лише якщо хочете повністю вимкнути редагування попереднього перегляду в Telegram. Використовуйте `streaming.preview.toolProgress: false`, якщо хочете вимкнути лише рядки статусу tool-progress.

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці (без другого повідомлення)
    - group/topic: OpenClaw зберігає те саме повідомлення попереднього перегляду й виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, з медіавмістом) OpenClaw використовує резервну звичайну фінальну доставку, а потім прибирає повідомлення попереднього перегляду.

    Preview streaming відокремлений від block streaming. Коли для Telegram явно ввімкнено block streaming, OpenClaw пропускає preview stream, щоб уникнути подвійного стримінгу.

    Якщо нативний транспорт чернеток недоступний або відхилений, OpenClaw автоматично використовує резервний варіант `sendMessage` + `editMessageText`.

    Потік reasoning лише для Telegram:

    - `/reasoning stream` надсилає reasoning у live preview під час генерації
    - фінальна відповідь надсилається без тексту reasoning

  </Accordion>

  <Accordion title="Форматування та резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown відтворюється як HTML, безпечний для Telegram.
    - Сирий HTML моделі екранується, щоб зменшити кількість помилок розбору в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнений за замовчуванням і може бути вимкнений через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску за допомогою `setMyCommands`.

    Типові налаштування нативних команд:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте власні пункти меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Резервна копія Git" },
        { command: "generate", description: "Створити зображення" },
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

    - користувацькі команди — це лише пункти меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills все одно можуть працювати при ручному введенні, навіть якщо не показані в меню Telegram

    Якщо нативні команди вимкнені, вбудовані команди видаляються. Користувацькі команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені збої налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram все ще переповнене навіть після скорочення; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками network/fetch зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблокований.

    ### Команди зв’язування пристрою (`device-pair` Plugin)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список очікуваних запитів (включно з роллю/scopes)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один очікуваний запит
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap-токен. Вбудована передача bootstrap зберігає токен первинного Node на `scopes: []`; будь-який переданий токен оператора залишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scope мають префікс ролі, тож цей allowlist оператора задовольняє лише запити оператора; ролям, що не є оператором, усе ще потрібні scopes під префіксом їхньої власної ролі.

    Якщо пристрій повторно надсилає запит зі зміненими даними автентифікації (наприклад, роль/scopes/публічний ключ), попередній очікуваний запит замінюється, а новий запит використовує інший `requestId`. Перед схваленням знову виконайте `/pair pending`.

    Докладніше: [Зв’язування](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

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
    - `allowlist` (за замовчуванням)

    Застаріле `capabilities: ["inlineButtons"]` відповідає `inlineButtons: "all"`.

    Приклад дії повідомлення:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Оберіть варіант:",
  buttons: [
    [
      { text: "Так", callback_data: "yes" },
      { text: "Ні", callback_data: "no" },
    ],
    [{ text: "Скасувати", callback_data: "cancel" }],
  ],
}
```

    Натискання callback передаються агенту як текст:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Дії з повідомленнями Telegram для агентів і автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язкові `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язкові `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керування обмеженнями:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі увімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час runtime використовує активний знімок config/secrets (запуск/перезавантаження), тому шляхи дій не виконують спеціального повторного визначення SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги ланцюжків відповідей">
    Telegram підтримує явні теги ланцюжків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` — відповідь на повідомлення, що спричинило спрацювання
    - `[[reply_to:<id>]]` — відповідь на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Коли ланцюжки відповідей увімкнені й оригінальний текст або підпис Telegram доступний, OpenClaw автоматично включає нативний уривок цитати Telegram. Telegram обмежує текст нативної цитати до 1024 кодових одиниць UTF-16, тому довші повідомлення цитуються з початку й використовують резервний звичайний reply, якщо Telegram відхиляє цитату.

    Примітка: `off` вимикає неявні ланцюжки відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Форумні теми та поведінка потоків">
    Forum supergroup:

    - ключі сесії теми доповнюються `:topic:<threadId>`
    - відповіді й індикація набору тексту спрямовуються в потік теми
    - шлях config теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії індикації набору тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` призначений лише для тем і не успадковується з типових налаштувань групи.

    **Маршрутизація агентів для окремих тем**: Кожна тема може маршрутизуватися до іншого агента через встановлення `agentId` у config теми. Це надає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → основний агент
                "3": { agentId: "zu" },        // Тема розробки → агент zu
                "5": { agentId: "coder" }      // Огляд коду → агент coder
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Стале прив’язування тем ACP**: Forum topics можуть закріплювати сесії harness ACP через типізовані прив’язки ACP верхнього рівня (`bindings[]` з `type: "acp"` і `match.channel: "telegram"`, `peer.kind: "group"` та ідентифікатором теми, як-от `-1001234567890:topic:42`). Наразі це обмежено forum topics у groups/supergroups. Див. [ACP Agents](/uk/tools/acp-agents).

    **Прив’язаний до потоку запуск ACP із чату**: `/acp spawn <agent> --thread here|auto` прив’язує поточну тему до нової сесії ACP; подальші повідомлення маршрутизуються туди безпосередньо. OpenClaw закріплює підтвердження запуску в межах теми. Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону надає `MessageThreadId` і `IsForum`. DM-чати з `message_thread_id` зберігають маршрутизацію DM, але використовують ключі сесії з урахуванням thread.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові повідомлення та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає як голосове повідомлення
    - вхідні транскрипти голосових повідомлень оформлюються в контексті агента як машинно згенерований,
      недовірений текст; виявлення згадок усе ще використовує сирий
      транскрипт, тож голосові повідомлення з обмеженням за згадкою продовжують працювати.

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

    Telegram розрізняє відеофайли та video notes.

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

    Video notes не підтримують підписи; наданий текст повідомлення надсилається окремо.

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

    Увімкнення дій зі стікерами:

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
  query: "кіт махає",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисних навантажень повідомлень).

    Коли це ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Додано реакцію Telegram: 👍 від Alice (@alice) на повідомлення 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе ще дотримуються керування доступом Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID потоку в оновленнях реакцій.
      - групи не forum маршрутизуються до сесії групового чату
      - forum groups маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервне значення з емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує емодзі Unicode (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи config із подій і команд Telegram">
    Записи config каналу увімкнені за замовчуванням (`configWrites !== false`).

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

  <Accordion title="Long polling проти Webhook">
    За замовчуванням використовується long polling. Для режиму Webhook задайте `channels.telegram.webhookUrl` і `channels.telegram.webhookSecret`; необов’язково — `webhookPath`, `webhookHost`, `webhookPort` (за замовчуванням `/telegram-webhook`, `127.0.0.1`, `8787`).

    Локальний listener прив’язується до `127.0.0.1:8787`. Для публічного ingress або поставте reverse proxy перед локальним портом, або навмисно задайте `webhookHost: "0.0.0.0"`.

    Режим Webhook перевіряє захист запитів, секретний токен Telegram і тіло JSON перед поверненням `200` до Telegram.
    Потім OpenClaw асинхронно обробляє оновлення через ті самі бот-черги для кожного чату/теми, що використовуються в long polling, тож повільні цикли агента не затримують ACK доставки Telegram.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - Типове значення `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` надає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіафайлів Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується типове значення grammY).
    - `channels.telegram.pollingStallThresholdMs` за замовчуванням дорівнює `120000`; налаштовуйте в діапазоні від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає.
    - Додатковий контекст reply/quote/forward наразі передається в отриманому вигляді.
    - Telegram allowlist насамперед обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Config `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних помилок вихідного API.

    Ціллю надсилання CLI може бути числовий ID чату або ім’я користувача:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Опитування Telegram використовують `openclaw message poll` і підтримують forum topics:

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
    - `--thread-id` для forum topics (або використовуйте ціль `:topic:`)

    Надсилання Telegram також підтримує:

    - `--presentation` з блоками `buttons` для вбудованих клавіатур, якщо це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'` для запиту закріпленої доставки, якщо бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Керування обмеженнями дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання увімкненим

  </Accordion>

  <Accordion title="Погодження exec у Telegram">
    Telegram підтримує погодження exec у DM погоджувачів і за потреби може публікувати запити в початковому чаті або темі. Погоджувачі мають бути числовими ID користувачів Telegram.

    Шлях config:

    - `channels.telegram.execApprovals.enabled` (автоматично вмикається, коли вдається визначити принаймні одного погоджувача)
    - `channels.telegram.execApprovals.approvers` (використовує резервне значення з числових owner ID із `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (за замовчуванням) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Доставка в канал показує текст команди в чаті; вмикайте `channel` або `both` лише в довірених groups/topics. Коли запит потрапляє у forum topic, OpenClaw зберігає тему для запиту на погодження та подальших повідомлень. За замовчуванням погодження exec спливають через 30 хвилин.

    Вбудовані кнопки погодження також вимагають, щоб `channels.telegram.capabilities.inlineButtons` дозволяв цільову поверхню (`dm`, `group` або `all`). ID погоджень із префіксом `plugin:` визначаються через погодження Plugin; інші спочатку визначаються через погодження exec.

    Див. [Погодження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Керування відповідями на помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або придушити її. Цією поведінкою керують два ключі config:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає в чат дружнє повідомлення про помилку. `silent` повністю пригнічує відповіді з помилками. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями з помилками в одному й тому самому чаті. Запобігає спаму помилками під час збоїв.        |

Підтримуються перевизначення для окремих облікових записів, груп і тем (те саме успадкування, що й для інших ключів config Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // пригнічує помилки в цій групі
        },
      },
    },
  },
}
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення групи без згадки">

    - Якщо `requireMention=false`, режим конфіденційності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть бота й додайте його знову до групи
    - `openclaw channels status` попереджає, коли config очікує повідомлення групи без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` неможливо перевірити на членство.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот узагалі не бачить повідомлення групи">

    - коли існує `channels.telegram.groups`, група має бути вказана в списку (або має бути `"*"`)
    - перевірте членство бота в групі
    - перегляньте журнали: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або не працюють взагалі">

    - авторизуйте свою ідентичність відправника (pairing та/або числовий `allowFrom`)
    - авторизація команд усе ще застосовується, навіть коли політика групи `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що в нативному меню занадто багато записів; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть нативні меню
    - `setMyCommands failed` з помилками network/fetch зазвичай вказує на проблеми з досяжністю DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + custom fetch/proxy можуть спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку визначають `api.telegram.org` в IPv6; несправний вихідний IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо журнали містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює спроби для них як для відновлюваних мережевих помилок.
    - Якщо журнали містять `Polling stall detected`, OpenClaw перезапускає polling і заново будує транспорт Telegram після 120 секунд без завершеної перевірки живучості long-poll за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` працюють справно, але ваш хост усе ще повідомляє про хибні перезапуски через зависання polling. Стійкі зависання зазвичай вказують на проблеми з proxy, DNS, IPv6 або TLS egress між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим egress/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - За замовчуванням Node 22+ використовує `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює лише з IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з діапазону тестів RFC 2544 (`198.18.0.0/15`) уже дозволені
      для завантаження медіа Telegram за замовчуванням. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціального призначення адресу під час завантаження медіа, ви можете
      явно ввімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Такий самий явний параметр доступний для окремого облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy визначає медіахости Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Telegram media вже дозволяє діапазон тестів RFC 2544
      за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      media від SSRF. Використовуйте це лише в довірених керованих оператором
      середовищах proxy, таких як Clash, Mihomo або Surge fake-IP routing, коли вони
      синтезують приватні або спеціальні відповіді поза діапазоном тестів RFC 2544. Для звичайного публічного доступу до Telegram через інтернет залишайте це вимкненим.
    </Warning>

    - Перевизначення через змінні середовища (тимчасово):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Перевірка DNS-відповідей:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Більше довідки: [Усунення проблем каналу](/uk/channels/troubleshooting).

## Довідник config

Основний довідник: [Configuration reference - Telegram](/uk/gateway/config-channels#telegram).

<Accordion title="Важливі поля Telegram">

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- керування доступом: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневий `bindings[]` (`type: "acp"`)
- погодження exec: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Пріоритет для кількох облікових записів: коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити типову маршрутизацію. Інакше OpenClaw використовує резервне значення — перший нормалізований ID облікового запису — і `openclaw doctor` виводить попередження. Іменовані облікові записи успадковують `channels.telegram.allowFrom` / `groupAllowFrom`, але не значення `accounts.default.*`.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Зв’язування" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Telegram із gateway.
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
  <Card title="Усунення проблем" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика.
  </Card>
</CardGroup>
