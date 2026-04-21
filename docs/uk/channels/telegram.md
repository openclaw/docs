---
read_when:
    - Робота над функціями Telegram або Webhook-ами
summary: Статус підтримки бота Telegram, можливості та конфігурація
title: Telegram
x-i18n:
    generated_at: "2026-04-21T20:37:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Статус: готовий до використання у продакшені для DM бота + груп через grammY. Long polling — режим за замовчуванням; режим Webhook-ів — необов’язковий.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для Telegram — підключення.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальні діагностичні та відновлювальні сценарії.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналу.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат з **@BotFather** (переконайтеся, що handle точно `@BotFather`).

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

    Резервний варіант через env: `TELEGRAM_BOT_TOKEN=...` (лише для облікового запису за замовчуванням).
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і схваліть перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди підключення дійсні протягом 1 години.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена залежить від облікового запису. На практиці значення з config мають пріоритет над резервним варіантом з env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування з боку Telegram

<AccordionGroup>
  <Accordion title="Режим конфіденційності та видимість у групі">
    Для ботів Telegram за замовчуванням увімкнено **Privacy Mode**, який обмежує повідомлення групи, що вони отримують.

    Якщо бот має бачити всі повідомлення групи, зробіть одне з такого:

    - вимкніть режим конфіденційності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після перемикання режиму конфіденційності видаліть бота з кожної групи й додайте знову, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи групи">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups`, щоб дозволити/заборонити додавання до груп
    - `/setprivacy` для керування видимістю в групах

  </Accordion>
</AccordionGroup>

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.telegram.dmPolicy` керує доступом до прямих повідомлень:

    - `pairing` (за замовчуванням)
    - `allowlist` (потребує принаймні одного ID відправника в `allowFrom`)
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` приймаються й нормалізуються.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється перевіркою config.
    Під час налаштування запитуються лише числові ID користувачів.
    Якщо ви оновилися і ваш config містить записи allowlist у форматі `@username`, виконайте `openclaw doctor --fix`, щоб їх виправити (у режимі best-effort; потрібен токен бота Telegram).
    Якщо ви раніше покладалися на файли allowlist зі сховища pairing-store, `openclaw doctor --fix` може відновити записи до `channels.telegram.allowFrom` у сценаріях allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником віддавайте перевагу `dmPolicy: "allowlist"` із явними числовими ID у `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх схвалень підключення).

    Типова плутанина: схвалення підключення для DM не означає, що «цей відправник авторизований всюди».
    Підключення надає доступ лише до DM. Авторизація відправника в групах, як і раніше, визначається явними allowlist у config.
    Якщо ви хочете, щоб «я авторизувався один раз, і працювали і DM, і команди в групі», додайте свій числовий ID користувача Telegram до `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

    1. Надішліть DM своєму боту.
    2. Виконайте `openclaw logs --follow`.
    3. Прочитайте `from.id`.

    Офіційний метод через Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Сторонній спосіб (менш приватний): `@userinfobot` або `@getidsbot`.

  </Tab>

  <Tab title="Політика груп і allowlist">
    Разом застосовуються два механізми:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірку ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи до `groups` (або `"*"`)
       - `groups` налаштовано: працює як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо його не задано, Telegram використовує `allowFrom`.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (`telegram:` / `tg:` префікси нормалізуються).
    Не вказуйте ID чатів груп або супергруп Telegram у `groupAllowFrom`. Від’ємні ID чатів слід вказувати в `channels.telegram.groups`.
    Нечислові записи ігноруються під час авторизації відправника.
    Межа безпеки (`2026.2.25+`): авторизація відправника в групі **не** успадковує схвалення зі сховища pairing-store для DM.
    Підключення залишається лише для DM. Для груп налаштуйте `groupAllowFrom` або `allowFrom` для конкретної групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує config `allowFrom`, а не pairing store.
    Практичний шаблон для ботів з одним власником: вкажіть свій ID користувача в `channels.telegram.allowFrom`, не задавайте `groupAllowFrom`, і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка щодо runtime: якщо `channels.telegram` повністю відсутній, runtime за замовчуванням використовує fail-closed `groupPolicy="allowlist"`, якщо тільки `channels.defaults.groupPolicy` не задано явно.

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
      Типова помилка: `groupAllowFrom` — це не allowlist груп Telegram.

      - Вказуйте від’ємні ID груп або супергруп Telegram, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Вказуйте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть звертатися до бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадувань">
    Відповіді в групах за замовчуванням потребують згадування.

    Згадування може надходити з:

    - нативного згадування `@botusername`, або
    - шаблонів згадування в:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

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

    Як отримати ID групового чату:

    - перешліть повідомлення з групи до `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перевірте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні відповіді з Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються до спільного канального envelope з метаданими відповіді та заповнювачами медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми залишалися ізольованими.
- Повідомлення DM можуть містити `message_thread_id`; OpenClaw маршрутизує їх із thread-aware ключами сесії та зберігає ID потоку для відповідей.
- Long polling використовує grammY runner з послідовністю за chat/per-thread. Загальна sink-конкурентність runner використовує `agents.defaults.maxConcurrent`.
- Перезапуски watchdog для long polling спрацьовують за замовчуванням після 120 секунд без завершеної перевірки життєздатності `getUpdates`. Збільшуйте `channels.telegram.pollingStallThresholdMs` лише якщо у вашому розгортанні все ще трапляються хибні перезапуски через зависання polling під час довготривалої роботи. Значення задається в мілісекундах і дозволене в діапазоні від `30000` до `600000`; підтримуються перевизначення для окремих облікових записів.
- Telegram Bot API не підтримує квитанції про прочитання (`sendReadReceipts` не застосовується).

## Довідник можливостей

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може передавати часткові відповіді в реальному часі:

    - прямі чати: попереднє повідомлення + `editMessageText`
    - групи/теми: попереднє повідомлення + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` у Telegram відповідає `partial` (сумісність із міжканальним найменуванням)
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме відредаговане попереднє повідомлення (за замовчуванням: `true`). Встановіть `false`, щоб зберегти окремі повідомлення інструментів/прогресу.
    - застарілі `channels.telegram.streamMode` і булеві значення `streaming` автоматично мапуються

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме попереднє повідомлення і виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме попереднє повідомлення і виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, медіа-навантажень) OpenClaw повертається до звичайної фінальної доставки, а потім очищує попереднє повідомлення.

    Потоковий попередній перегляд відокремлений від block streaming. Якщо для Telegram явно увімкнено block streaming, OpenClaw пропускає preview stream, щоб уникнути подвійного стримінгу.

    Якщо нативний transport для чернеток недоступний або відхилений, OpenClaw автоматично повертається до `sendMessage` + `editMessageText`.

    Потік reasoning лише для Telegram:

    - `/reasoning stream` надсилає reasoning у live preview під час генерації
    - фінальна відповідь надсилається без тексту reasoning

  </Accordion>

  <Accordion title="Форматування та резервний перехід на HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в безпечний для Telegram HTML.
    - Сирий HTML моделі екранується, щоб зменшити кількість збоїв парсингу Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено за замовчуванням і його можна вимкнути через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та власні команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Налаштування нативних команд за замовчуванням:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте власні записи до меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Резервне копіювання Git" },
        { command: "generate", description: "Створити зображення" },
      ],
    },
  },
}
```

    Правила:

    - імена нормалізуються (видаляється початковий `/`, нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - власні команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та логуються

    Примітки:

    - власні команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди plugin/Skills однаково можуть працювати при введенні вручну, навіть якщо вони не показані в меню Telegram

    Якщо нативні команди вимкнено, вбудовані команди видаляються. Власні команди/команди plugin усе ще можуть реєструватися, якщо це налаштовано.

    Типові збої під час налаштування:

    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після скорочення; зменште кількість власних команд/команд plugin/Skills або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` з помилками network/fetch зазвичай означає, що вихідні DNS/HTTPS-з’єднання до `api.telegram.org` заблоковано.

    ### Команди підключення пристрою (`device-pair` Plugin)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують на розгляд (включно з роллю/областями доступу)
    4. схваліть запит:
       - `/pair approve <requestId>` для явного схвалення
       - `/pair approve`, коли є лише один запит, що очікує на розгляд
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap-токен. Вбудована bootstrap-передача зберігає токен первинного Node на рівні `scopes: []`; будь-який переданий токен оператора залишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap-областей доступу мають префікс ролі, тому цей allowlist оператора задовольняє лише запити оператора; ролі, що не є оператором, усе ще потребують областей доступу під префіксом власної ролі.

    Якщо пристрій повторює спробу зі зміненими даними автентифікації (наприклад, роль/області доступу/публічний ключ), попередній запит, що очікує на розгляд, заміщується, а новий запит використовує інший `requestId`. Перед схваленням знову виконайте `/pair pending`.

    Докладніше: [Підключення](/uk/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Застаріле `capabilities: ["inlineButtons"]` мапується на `inlineButtons: "all"`.

    Приклад дії повідомлення:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Виберіть варіант:",
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

  <Accordion title="Дії повідомлень Telegram для агентів і автоматизації">
    Дії інструментів Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язково `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язково `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні аліаси (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керування через gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі увімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання під час runtime використовує активний знімок config/secrets (startup/reload), тому шляхи дій не виконують ad-hoc повторне визначення `SecretRef` для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, яке ініціювало дію
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Примітка: `off` вимикає неявне формування потоку відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форуму:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та індикатор набору тексту спрямовуються в потік теми
    - шлях config теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Спеціальний випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії набору тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо їх не перевизначено (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` є параметром лише теми й не успадковується з типових налаштувань групи.

    **Маршрутизація агента для окремої теми**: кожна тема може маршрутизуватися до іншого агента, якщо задати `agentId` у config теми. Це дає кожній темі власний ізольований робочий простір, пам’ять і сесію. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → агент main
                "3": { agentId: "zu" },        // Тема розробки → агент zu
                "5": { agentId: "coder" }      // Code review → агент coder
              }
            }
          }
        }
      }
    }
    ```

    Тоді кожна тема має власний ключ сесії: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Постійна прив’язка тем ACP**: теми форуму можуть закріплювати сесії harness ACP через typed ACP bindings верхнього рівня:

    - `bindings[]` з `type: "acp"` і `match.channel: "telegram"`

    Приклад:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Наразі це обмежено темами форумів у групах і супергрупах.

    **Запуск ACP, прив’язаний до потоку, з чату**:

    - `/acp spawn <agent> --thread here|auto` може прив’язати поточну тему Telegram до нової сесії ACP.
    - Наступні повідомлення в темі маршрутизуються безпосередньо до прив’язаної сесії ACP (без потреби в `/acp steer`).
    - Після успішної прив’язки OpenClaw закріплює повідомлення з підтвердженням запуску в цій темі.
    - Потребує `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону включає:

    - `MessageThreadId`
    - `IsForum`

    Поведінка потоку DM:

    - приватні чати з `message_thread_id` зберігають маршрутизацію DM, але використовують thread-aware ключі сесії/цілі відповідей.

  </Accordion>

  <Accordion title="Аудіо, відео та стікери">
    ### Аудіоповідомлення

    Telegram розрізняє голосові повідомлення та аудіофайли.

    - за замовчуванням: поведінка аудіофайлу
    - тег `[[audio_as_voice]]` у відповіді агента примусово надсилає як голосове повідомлення

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

    Стікери описуються один раз (коли це можливо) і кешуються, щоб зменшити кількість повторних викликів vision.

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

    Пошук у кешованих стікерах:

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
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від корисних навантажень повідомлень).

    Коли цю функцію ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Конфігурація:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (best-effort через кеш надісланих повідомлень).
    - Події реакцій усе одно поважають механізми контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); від неавторизованих відправників вони відкидаються.
    - Telegram не надає ID потоку в оновленнях реакцій.
      - групи без форуму маршрутизуються до сесії групового чату
      - групи форуму маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/Webhook-ів автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний emoji з ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує unicode emoji (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи config з подій і команд Telegram">
    Записи в config каналу увімкнені за замовчуванням (`configWrites !== false`).

    Записи, ініційовані Telegram, включають:

    - події міграції груп (`migrate_to_chat_id`) для оновлення `channels.telegram.groups`
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

  <Accordion title="Long polling vs Webhook">
    За замовчуванням: long polling.

    Режим Webhook-ів:

    - задайте `channels.telegram.webhookUrl`
    - задайте `channels.telegram.webhookSecret` (обов’язково, якщо задано URL Webhook-а)
    - необов’язково `channels.telegram.webhookPath` (за замовчуванням `/telegram-webhook`)
    - необов’язково `channels.telegram.webhookHost` (за замовчуванням `127.0.0.1`)
    - необов’язково `channels.telegram.webhookPort` (за замовчуванням `8787`)

    Типовий локальний listener для режиму Webhook-ів прив’язується до `127.0.0.1:8787`.

    Якщо ваша публічна кінцева точка відрізняється, розмістіть попереду reverse proxy і вкажіть публічний URL у `webhookUrl`.
    Установіть `webhookHost` (наприклад, `0.0.0.0`), якщо вам навмисно потрібен зовнішній вхідний доступ.

  </Accordion>

  <Accordion title="Ліміти, повторні спроби та цілі CLI">
    - `channels.telegram.textChunkLimit` за замовчуванням має значення 4000.
    - `channels.telegram.chunkMode="newline"` віддає перевагу межам абзаців (порожнім рядкам) перед розбиттям за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає тайм-аут клієнта Telegram API (якщо не задано, застосовується значення grammY за замовчуванням).
    - `channels.telegram.pollingStallThresholdMs` за замовчуванням дорівнює `120000`; налаштовуйте в межах від `30000` до `600000` лише для хибнопозитивних перезапусків через зависання polling.
    - історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає.
    - додатковий контекст reply/quote/forward наразі передається в отриманому вигляді.
    - allowlist-списки Telegram насамперед керують тим, хто може активувати агента, а не є повною межею редагування додаткового контексту.
    - керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціль CLI для надсилання може бути числовим ID чату або username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
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

    - `--presentation` з блоками `buttons` для вбудованих клавіатур, коли це дозволяє `channels.telegram.capabilities.inlineButtons`
    - `--pin` або `--delivery '{"pin":true}'`, щоб запитати закріплену доставку, коли бот може закріплювати в цьому чаті
    - `--force-document`, щоб надсилати вихідні зображення та GIF як документи замість стиснених фото або завантажень анімованих медіа

    Керування діями:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, включно з опитуваннями
    - `channels.telegram.actions.poll=false` вимикає створення опитувань Telegram, залишаючи звичайне надсилання увімкненим

  </Accordion>

  <Accordion title="Схвалення exec у Telegram">
    Telegram підтримує схвалення exec у DM схвалювачів і за потреби може публікувати запити на схвалення у вихідному чаті або темі.

    Шлях config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (необов’язково; за відсутності використовується резервне визначення з числових ID власника, виведених із `allowFrom` і прямого `defaultTo`, коли це можливо)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`

    Схвалювачі мають бути числовими ID користувачів Telegram. Telegram автоматично вмикає нативні схвалення exec, коли `enabled` не задано або дорівнює `"auto"` і можна визначити принаймні одного схвалювача — або з `execApprovals.approvers`, або з числового config власника облікового запису (`allowFrom` і `defaultTo` для прямих повідомлень). Установіть `enabled: false`, щоб явно вимкнути Telegram як нативний клієнт схвалення. В інших випадках запити на схвалення повертаються до інших налаштованих маршрутів схвалення або до fallback-політики схвалення exec.

    Telegram також рендерить спільні кнопки схвалення, які використовують інші чат-канали. Нативний адаптер Telegram переважно додає маршрутизацію DM схвалювачів, fanout у канали/теми та підказки набору тексту перед доставкою.
    Коли ці кнопки присутні, вони є основним UX для схвалення; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що схвалення в чаті недоступні або ручне схвалення — єдиний шлях.

    Правила доставки:

    - `target: "dm"` надсилає запити на схвалення лише в DM визначених схвалювачів
    - `target: "channel"` надсилає запит назад у вихідний чат/тему Telegram
    - `target: "both"` надсилає і в DM схвалювачів, і у вихідний чат/тему

    Лише визначені схвалювачі можуть схвалювати або відхиляти. Користувачі, які не є схвалювачами, не можуть використовувати `/approve` і не можуть користуватися кнопками схвалення Telegram.

    Поведінка визначення схвалення:

    - ID з префіксом `plugin:` завжди визначаються через схвалення plugin.
    - Інші ID спочатку пробують `exec.approval.resolve`.
    - Якщо Telegram також авторизований для схвалень plugin і gateway каже,
      що схвалення exec невідоме/прострочене, Telegram один раз повторює спробу через
      `plugin.approval.resolve`.
    - Реальні відмови/помилки схвалення exec не переходять мовчки до
      визначення схвалення plugin.

    Доставка в канал показує текст команди в чаті, тому вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему як для запиту на схвалення, так і для подальших дій після схвалення. За замовчуванням схвалення exec спливають через 30 хвилин.

    Вбудовані кнопки схвалення також залежать від того, чи дозволяє `channels.telegram.capabilities.inlineButtons` цільову поверхню (`dm`, `group` або `all`).

    Пов’язана документація: [Схвалення exec](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або провайдера, Telegram може або відповісти текстом помилки, або приховати її. Цю поведінку контролюють два ключі config:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` надсилає до чату дружнє повідомлення про помилку. `silent` повністю пригнічує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Мінімальний час між відповідями про помилки в тому самому чаті. Запобігає спаму помилками під час збоїв.        |

Підтримуються перевизначення для окремого облікового запису, групи й теми (те саме успадкування, що й для інших ключів config Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // приглушити помилки в цій групі
        },
      },
    },
  },
}
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення групи без згадування">

    - Якщо `requireMention=false`, режим конфіденційності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть бота з групи й додайте знову
    - `openclaw channels status` попереджає, коли config очікує повідомлення групи без згадування.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; для wildcard `"*"` перевірка членства недоступна.
    - швидкий тест сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот зовсім не бачить повідомлення групи">

    - коли існує `channels.telegram.groups`, група має бути вказана в списку (або має бути `"*"`)
    - перевірте членство бота в групі
    - перегляньте логи: `openclaw logs --follow`, щоб побачити причини пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або зовсім не працюють">

    - авторизуйте свою ідентичність відправника (підключення та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть коли політика групи `open`
    - `setMyCommands failed` з `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має забагато записів; зменште кількість власних команд/команд plugin/Skills або вимкніть нативні меню
    - `setMyCommands failed` з помилками network/fetch зазвичай указує на проблеми досяжності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + власний fetch/proxy можуть спричиняти негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку резолвлять `api.telegram.org` в IPv6; несправний вихідний IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо логи містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює їх як відновлювані мережеві помилки.
    - Якщо логи містять `Polling stall detected`, OpenClaw перезапускає polling і перебудовує транспорт Telegram після 120 секунд без завершеної перевірки життєздатності long poll за замовчуванням.
    - Збільшуйте `channels.telegram.pollingStallThresholdMs` лише тоді, коли довготривалі виклики `getUpdates` працюють нормально, але ваш хост усе ще повідомляє про хибнопозитивні перезапуски через зависання polling. Стійкі зависання зазвичай вказують на проблеми proxy, DNS, IPv6 або TLS-виходу між хостом і `api.telegram.org`.
    - На VPS-хостах із нестабільним прямим вихідним трафіком/TLS спрямовуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - У Node 22+ за замовчуванням використовується `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або явно краще працює лише з IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді діапазону benchmark RFC 2544 (`198.18.0.0/15`) уже дозволені
      за замовчуванням для завантаження медіа Telegram. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/спеціальну адресу під час завантаження медіа, ви можете
      увімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Те саме явне ввімкнення доступне для окремого облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy резолвить медіахости Telegram в `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяє діапазон benchmark RFC 2544
      за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      media SSRF. Використовуйте це лише в довірених середовищах proxy, якими керує оператор,
      таких як Clash, Mihomo або маршрутизація fake-IP у Surge, коли вони синтезують приватні
      або спеціальні відповіді поза межами діапазону benchmark RFC 2544. Для звичайного
      публічного доступу Telegram через інтернет залишайте це вимкненим.
    </Warning>

    - Перевизначення через середовище (тимчасово):
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

Більше довідки: [Усунення проблем каналу](/uk/channels/troubleshooting).

## Вказівники на довідник config Telegram

Основний довідник:

- `channels.telegram.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.telegram.botToken`: токен бота (BotFather).
- `channels.telegram.tokenFile`: читати токен зі шляху до звичайного файлу. Символічні посилання відхиляються.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.telegram.allowFrom`: allowlist для DM (числові ID користувачів Telegram). `allowlist` потребує принаймні одного ID відправника. `open` потребує `"*"`. `openclaw doctor --fix` може перетворити застарілі записи `@username` на ID і відновити записи allowlist із файлів pairing-store у сценаріях міграції allowlist.
- `channels.telegram.actions.poll`: увімкнути або вимкнути створення опитувань Telegram (за замовчуванням: увімкнено; усе одно потребує `sendMessage`).
- `channels.telegram.defaultTo`: ціль Telegram за замовчуванням, яку використовує CLI `--deliver`, коли явний `--reply-to` не задано.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist відправників у групах (числові ID користувачів Telegram). `openclaw doctor --fix` може перетворити застарілі записи `@username` на ID. Нечислові записи ігноруються під час автентифікації. Автентифікація груп не використовує fallback на pairing-store для DM (`2026.2.25+`).
- Пріоритетність для кількох облікових записів:
  - Коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб явно визначити маршрут за замовчуванням.
  - Якщо не задано жодного з них, OpenClaw використовує перший нормалізований ID облікового запису, а `openclaw doctor` виводить попередження.
  - `channels.telegram.accounts.default.allowFrom` і `channels.telegram.accounts.default.groupAllowFrom` застосовуються лише до облікового запису `default`.
  - Іменовані облікові записи успадковують `channels.telegram.allowFrom` і `channels.telegram.groupAllowFrom`, якщо значення на рівні облікового запису не задано.
  - Іменовані облікові записи не успадковують `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: типові значення для груп + allowlist (використовуйте `"*"` для глобальних типових значень).
  - `channels.telegram.groups.<id>.groupPolicy`: перевизначення groupPolicy для конкретної групи (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: типовий gating згадувань.
  - `channels.telegram.groups.<id>.skills`: фільтр Skills (пропущено = усі Skills, порожньо = жодного).
  - `channels.telegram.groups.<id>.allowFrom`: перевизначення allowlist відправників для конкретної групи.
  - `channels.telegram.groups.<id>.systemPrompt`: додатковий system prompt для групи.
  - `channels.telegram.groups.<id>.enabled`: вимикає групу, якщо `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: перевизначення для конкретної теми (поля групи + `agentId`, доступний лише для теми).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: маршрутизувати цю тему до конкретного агента (перевизначає маршрутизацію на рівні групи та bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: перевизначення groupPolicy для конкретної теми (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: перевизначення gating згадувань для конкретної теми.
- верхньорівневий `bindings[]` з `type: "acp"` і канонічним ID теми `chatId:topic:topicId` у `match.peer.id`: поля постійної прив’язки ACP теми (див. [ACP Agents](/uk/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: маршрутизувати теми DM до конкретного агента (та сама поведінка, що й для тем форуму).
- `channels.telegram.execApprovals.enabled`: увімкнути Telegram як чат-клієнт для схвалення exec для цього облікового запису.
- `channels.telegram.execApprovals.approvers`: ID користувачів Telegram, яким дозволено схвалювати або відхиляти запити exec. Необов’язково, якщо `channels.telegram.allowFrom` або прямий `channels.telegram.defaultTo` уже визначає власника.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (за замовчуванням: `dm`). `channel` і `both` зберігають початкову тему Telegram, якщо вона є.
- `channels.telegram.execApprovals.agentFilter`: необов’язковий фільтр ID агента для пересланих запитів на схвалення.
- `channels.telegram.execApprovals.sessionFilter`: необов’язковий фільтр ключа сесії (підрядок або regex) для пересланих запитів на схвалення.
- `channels.telegram.accounts.<account>.execApprovals`: перевизначення маршрутизації схвалення exec і авторизації схвалювача для конкретного облікового запису Telegram.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (за замовчуванням: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: перевизначення для конкретного облікового запису.
- `channels.telegram.commands.nativeSkills`: увімкнути/вимкнути нативні команди Skills у Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (за замовчуванням: `off`).
- `channels.telegram.textChunkLimit`: розмір вихідного фрагмента (символів).
- `channels.telegram.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.telegram.linkPreview`: перемикач попереднього перегляду посилань для вихідних повідомлень (за замовчуванням: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (попередній перегляд live stream; за замовчуванням: `partial`; `progress` мапується на `partial`; `block` — сумісність із застарілим режимом preview). Потоковий попередній перегляд Telegram використовує одне preview-повідомлення, яке редагується на місці.
- `channels.telegram.streaming.preview.toolProgress`: повторно використовувати live preview-повідомлення для оновлень tools/progress, коли активний preview streaming (за замовчуванням: `true`). Установіть `false`, щоб зберегти окремі повідомлення tools/progress.
- `channels.telegram.mediaMaxMb`: обмеження розміру вхідних/вихідних медіа Telegram (МБ, за замовчуванням: 100).
- `channels.telegram.retry`: політика повторних спроб для допоміжних функцій надсилання Telegram (CLI/tools/actions) у разі відновлюваних вихідних помилок API (спроби, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: перевизначити Node autoSelectFamily (true=увімкнути, false=вимкнути). За замовчуванням увімкнено в Node 22+, а у WSL2 за замовчуванням вимкнено.
- `channels.telegram.network.dnsResultOrder`: перевизначити порядок результатів DNS (`ipv4first` або `verbatim`). За замовчуванням у Node 22+ використовується `ipv4first`.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: небезпечне явне ввімкнення для довірених середовищ із fake-IP або transparent proxy, де завантаження медіа Telegram резолвить `api.telegram.org` у приватні/внутрішні/спеціальні адреси поза типовим дозволеним діапазоном benchmark RFC 2544.
- `channels.telegram.proxy`: URL proxy для викликів Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: увімкнути режим Webhook-ів (потребує `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: секрет Webhook-а (обов’язковий, коли задано webhookUrl).
- `channels.telegram.webhookPath`: локальний шлях Webhook-а (за замовчуванням `/telegram-webhook`).
- `channels.telegram.webhookHost`: локальний host прив’язки Webhook-а (за замовчуванням `127.0.0.1`).
- `channels.telegram.webhookPort`: локальний port прив’язки Webhook-а (за замовчуванням `8787`).
- `channels.telegram.actions.reactions`: керування реакціями інструментів Telegram.
- `channels.telegram.actions.sendMessage`: керування надсиланням повідомлень інструментами Telegram.
- `channels.telegram.actions.deleteMessage`: керування видаленням повідомлень інструментами Telegram.
- `channels.telegram.actions.sticker`: керування діями зі стікерами Telegram — надсилання та пошук (за замовчуванням: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — керує тим, які реакції запускають системні події (за замовчуванням: `own`, якщо не задано).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — керує можливістю реакцій агента (за замовчуванням: `minimal`, якщо не задано).
- `channels.telegram.errorPolicy`: `reply | silent` — керує поведінкою відповіді на помилки (за замовчуванням: `reply`). Підтримуються перевизначення для окремого облікового запису/групи/теми.
- `channels.telegram.errorCooldownMs`: мінімальна кількість мс між відповідями на помилки в тому самому чаті (за замовчуванням: `60000`). Запобігає спаму помилками під час збоїв.

- [Довідник конфігурації - Telegram](/uk/gateway/configuration-reference#telegram)

Специфічні для Telegram поля з високою цінністю сигналу:

- запуск/автентифікація: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; символічні посилання відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневий `bindings[]` (`type: "acp"`)
- схвалення exec: `execApprovals`, `accounts.*.execApprovals`
- команди/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Пов’язане

- [Підключення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
