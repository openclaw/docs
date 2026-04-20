---
read_when:
    - Робота над функціями Telegram або Webhook'ами
summary: Статус підтримки бота Telegram, можливості та налаштування
title: Telegram
x-i18n:
    generated_at: "2026-04-20T04:35:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9903fae98bca0c345aa86d5c29015539c375442524a34d26bd28181470b8477
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Статус: готовий до продакшн-використання для DM бота + груп через grammY. Довге опитування є режимом за замовчуванням; режим Webhook є необов’язковим.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Політика DM за замовчуванням для Telegram — сполучення.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Налаштування Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналу.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Створіть токен бота в BotFather">
    Відкрийте Telegram і почніть чат із **@BotFather** (переконайтеся, що це саме `@BotFather`).

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
    Telegram **не** використовує `openclaw channels login telegram`; налаштуйте токен у config/env, а потім запустіть gateway.

  </Step>

  <Step title="Запустіть gateway і підтвердьте перший DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Коди сполучення діють 1 годину.

  </Step>

  <Step title="Додайте бота до групи">
    Додайте бота до своєї групи, а потім налаштуйте `channels.telegram.groups` і `groupPolicy` відповідно до вашої моделі доступу.
  </Step>
</Steps>

<Note>
Порядок визначення токена враховує обліковий запис. На практиці значення з config мають пріоритет над резервним варіантом через env, а `TELEGRAM_BOT_TOKEN` застосовується лише до облікового запису за замовчуванням.
</Note>

## Налаштування на боці Telegram

<AccordionGroup>
  <Accordion title="Режим приватності та видимість у групах">
    За замовчуванням Telegram-боти працюють у **Privacy Mode**, який обмежує, які повідомлення з груп вони отримують.

    Якщо бот має бачити всі повідомлення групи, зробіть одне з такого:

    - вимкніть режим приватності через `/setprivacy`, або
    - зробіть бота адміністратором групи.

    Після зміни режиму приватності видаліть бота й знову додайте його в кожну групу, щоб Telegram застосував зміну.

  </Accordion>

  <Accordion title="Дозволи в групі">
    Статус адміністратора керується в налаштуваннях групи Telegram.

    Боти-адміністратори отримують усі повідомлення групи, що корисно для постійно активної поведінки в групі.

  </Accordion>

  <Accordion title="Корисні перемикачі BotFather">

    - `/setjoingroups` щоб дозволити/заборонити додавання в групи
    - `/setprivacy` для керування видимістю в групах

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

    `channels.telegram.allowFrom` приймає числові ID користувачів Telegram. Префікси `telegram:` / `tg:` підтримуються й нормалізуються.
    `dmPolicy: "allowlist"` з порожнім `allowFrom` блокує всі DM і відхиляється валідацією config.
    Під час налаштування запитуються лише числові ID користувачів.
    Якщо ви оновилися й ваш config містить записи allowlist у форматі `@username`, виконайте `openclaw doctor --fix`, щоб розв’язати їх (у межах можливого; потрібен токен бота Telegram).
    Якщо ви раніше покладалися на файли allowlist у pairing-store, `openclaw doctor --fix` може відновити записи в `channels.telegram.allowFrom` для потоків allowlist (наприклад, коли `dmPolicy: "allowlist"` ще не має явних ID).

    Для ботів з одним власником віддавайте перевагу `dmPolicy: "allowlist"` з явними числовими ID в `allowFrom`, щоб політика доступу надійно зберігалася в config (замість залежності від попередніх підтверджень сполучення).

    Поширена плутанина: підтвердження сполучення DM не означає, що «цей відправник авторизований всюди».
    Сполучення надає доступ лише до DM. Авторизація відправників у групах і далі визначається явними allowlist у config.
    Якщо ви хочете, щоб «я був авторизований один раз, і працювали і DM, і команди в групах», додайте свій числовий ID користувача Telegram у `channels.telegram.allowFrom`.

    ### Як знайти свій ID користувача Telegram

    Безпечніший спосіб (без стороннього бота):

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
    Разом застосовуються два механізми керування:

    1. **Які групи дозволені** (`channels.telegram.groups`)
       - немає config `groups`:
         - з `groupPolicy: "open"`: будь-яка група може пройти перевірки ID групи
         - з `groupPolicy: "allowlist"` (за замовчуванням): групи блокуються, доки ви не додасте записи `groups` (або `"*"`)
       - `groups` налаштовано: діє як allowlist (явні ID або `"*"`)

    2. **Які відправники дозволені в групах** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (за замовчуванням)
       - `disabled`

    `groupAllowFrom` використовується для фільтрації відправників у групах. Якщо його не задано, Telegram використовує `allowFrom` як резервний варіант.
    Записи `groupAllowFrom` мають бути числовими ID користувачів Telegram (префікси `telegram:` / `tg:` нормалізуються).
    Не вказуйте ID груп Telegram або супергруп у `groupAllowFrom`. Від’ємні ID чатів мають бути в `channels.telegram.groups`.
    Нечислові записи ігноруються для авторизації відправників.
    Межа безпеки (`2026.2.25+`): авторизація відправників у групах **не** успадковує підтвердження з pairing-store для DM.
    Сполучення залишається лише для DM. Для груп задайте `groupAllowFrom` або `allowFrom` для конкретної групи/теми.
    Якщо `groupAllowFrom` не задано, Telegram використовує config `allowFrom`, а не pairing store.
    Практичний шаблон для ботів з одним власником: задайте свій ID користувача в `channels.telegram.allowFrom`, не задавайте `groupAllowFrom` і дозвольте цільові групи в `channels.telegram.groups`.
    Примітка про runtime: якщо `channels.telegram` повністю відсутній, у runtime за замовчуванням використовується fail-closed `groupPolicy="allowlist"`, якщо лише `channels.defaults.groupPolicy` не задано явно.

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

      - Вказуйте від’ємні ID груп Telegram або супергруп, як-от `-1001234567890`, у `channels.telegram.groups`.
      - Вказуйте ID користувачів Telegram, як-от `8734062810`, у `groupAllowFrom`, коли хочете обмежити, які люди всередині дозволеної групи можуть звертатися до бота.
      - Використовуйте `groupAllowFrom: ["*"]` лише тоді, коли хочете, щоб будь-який учасник дозволеної групи міг спілкуватися з ботом.
    </Warning>

  </Tab>

  <Tab title="Поведінка згадок">
    За замовчуванням відповіді в групах потребують згадки.

    Згадка може надходити з:

    - нативної згадки `@botusername`, або
    - шаблонів згадок у:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Перемикачі команд на рівні сесії:

    - `/activation always`
    - `/activation mention`

    Вони оновлюють лише стан сесії. Для постійного збереження використовуйте config.

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

    Як отримати ID чату групи:

    - перешліть повідомлення з групи в `@userinfobot` / `@getidsbot`
    - або прочитайте `chat.id` з `openclaw logs --follow`
    - або перевірте Bot API `getUpdates`

  </Tab>
</Tabs>

## Поведінка runtime

- Telegram належить процесу gateway.
- Маршрутизація детермінована: вхідні відповіді з Telegram повертаються в Telegram (модель не вибирає канали).
- Вхідні повідомлення нормалізуються у спільну channel envelope з метаданими відповіді та заповнювачами медіа.
- Групові сесії ізольовані за ID групи. Теми форуму додають `:topic:<threadId>`, щоб теми були ізольовані.
- Повідомлення DM можуть містити `message_thread_id`; OpenClaw маршрутизує їх із ключами сесій, що враховують потоки, і зберігає ID потоку для відповідей.
- Довге опитування використовує grammY runner із послідовністю на рівні чату/потоку. Загальна sink-конкурентність runner використовує `agents.defaults.maxConcurrent`.
- Telegram Bot API не підтримує підтвердження прочитання (`sendReadReceipts` не застосовується).

## Довідник функцій

<AccordionGroup>
  <Accordion title="Попередній перегляд live stream (редагування повідомлень)">
    OpenClaw може транслювати часткові відповіді в реальному часі:

    - прямі чати: повідомлення попереднього перегляду + `editMessageText`
    - групи/теми: повідомлення попереднього перегляду + `editMessageText`

    Вимога:

    - `channels.telegram.streaming` має значення `off | partial | block | progress` (за замовчуванням: `partial`)
    - `progress` у Telegram зіставляється з `partial` (сумісність із міжканальним іменуванням)
    - застарілі значення `channels.telegram.streamMode` і булеві значення `streaming` автоматично зіставляються

    Для відповідей лише з текстом:

    - DM: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)
    - група/тема: OpenClaw зберігає те саме повідомлення попереднього перегляду і виконує фінальне редагування на місці (без другого повідомлення)

    Для складних відповідей (наприклад, медіа-пейлоадів) OpenClaw повертається до звичайної фінальної доставки, а потім очищує повідомлення попереднього перегляду.

    Потоковий попередній перегляд відокремлений від block streaming. Якщо для Telegram явно увімкнено block streaming, OpenClaw пропускає попередній перегляд stream, щоб уникнути подвійного stream.

    Якщо нативний транспорт чернеток недоступний/відхилений, OpenClaw автоматично переходить до `sendMessage` + `editMessageText`.

    Потік міркувань лише для Telegram:

    - `/reasoning stream` надсилає міркування в live preview під час генерації
    - фінальна відповідь надсилається без тексту міркувань

  </Accordion>

  <Accordion title="Форматування та резервний HTML">
    Вихідний текст використовує Telegram `parse_mode: "HTML"`.

    - Текст у стилі Markdown рендериться в HTML, безпечний для Telegram.
    - Сирий HTML моделі екранується, щоб зменшити збої парсингу в Telegram.
    - Якщо Telegram відхиляє розібраний HTML, OpenClaw повторює спробу як звичайний текст.

    Попередній перегляд посилань увімкнено за замовчуванням, і його можна вимкнути через `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Нативні команди та користувацькі команди">
    Реєстрація меню команд Telegram виконується під час запуску через `setMyCommands`.

    Налаштування нативних команд за замовчуванням:

    - `commands.native: "auto"` вмикає нативні команди для Telegram

    Додайте власні записи до меню команд:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git-резервне копіювання" },
        { command: "generate", description: "Створити зображення" },
      ],
    },
  },
}
```

    Правила:

    - імена нормалізуються (прибирається початковий `/`, нижній регістр)
    - допустимий шаблон: `a-z`, `0-9`, `_`, довжина `1..32`
    - користувацькі команди не можуть перевизначати нативні команди
    - конфлікти/дублікати пропускаються та логуються

    Примітки:

    - користувацькі команди — це лише записи меню; вони не реалізують поведінку автоматично
    - команди Plugin/Skills все одно можуть працювати при введенні, навіть якщо їх не показано в меню Telegram

    Якщо нативні команди вимкнено, вбудовані команди видаляються. Користувацькі команди/команди Plugin усе ще можуть реєструватися, якщо це налаштовано.

    Поширені збої під час налаштування:

    - `setMyCommands failed` із `BOT_COMMANDS_TOO_MUCH` означає, що меню Telegram усе ще переповнене після скорочення; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть `channels.telegram.commands.native`.
    - `setMyCommands failed` із помилками network/fetch зазвичай означає, що вихідний DNS/HTTPS до `api.telegram.org` заблоковано.

    ### Команди сполучення пристроїв (`device-pair` Plugin)

    Коли встановлено Plugin `device-pair`:

    1. `/pair` генерує код налаштування
    2. вставте код у застосунок iOS
    3. `/pair pending` показує список запитів, що очікують на розгляд (включно з роллю/scopes)
    4. підтвердьте запит:
       - `/pair approve <requestId>` для явного підтвердження
       - `/pair approve`, коли є лише один запит, що очікує на розгляд
       - `/pair approve latest` для найновішого

    Код налаштування містить короткоживучий bootstrap token. Вбудована bootstrap-передача зберігає primary Node token на `scopes: []`; будь-який переданий operator token залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`. Перевірки bootstrap scope мають префікс ролі, тому цей operator allowlist задовольняє лише operator-запити; ролі, що не є operator, усе одно потребують scopes під власним префіксом ролі.

    Якщо пристрій повторює спробу зі зміненими даними auth (наприклад, role/scopes/public key), попередній запит, що очікує на розгляд, замінюється, а новий запит використовує інший `requestId`. Перед підтвердженням знову виконайте `/pair pending`.

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
    - `allowlist` (за замовчуванням)

    Застаріле `capabilities: ["inlineButtons"]` зіставляється з `inlineButtons: "all"`.

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

  <Accordion title="Дії з повідомленнями Telegram для агентів і автоматизації">
    Дії інструмента Telegram включають:

    - `sendMessage` (`to`, `content`, необов’язкові `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, необов’язкові `iconColor`, `iconCustomEmojiId`)

    Дії повідомлень каналу надають зручні псевдоніми (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Керування дозволами:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (за замовчуванням: вимкнено)

    Примітка: `edit` і `topic-create` наразі увімкнені за замовчуванням і не мають окремих перемикачів `channels.telegram.actions.*`.
    Надсилання в runtime використовують активний знімок config/secrets (startup/reload), тому шляхи дій не виконують ad hoc повторне розв’язання SecretRef для кожного надсилання.

    Семантика видалення реакцій: [/tools/reactions](/uk/tools/reactions)

  </Accordion>

  <Accordion title="Теги потоків відповідей">
    Telegram підтримує явні теги потоків відповідей у згенерованому виводі:

    - `[[reply_to_current]]` відповідає на повідомлення, що спричинило виклик
    - `[[reply_to:<id>]]` відповідає на конкретний ID повідомлення Telegram

    `channels.telegram.replyToMode` керує обробкою:

    - `off` (за замовчуванням)
    - `first`
    - `all`

    Примітка: `off` вимикає неявний потік відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.

  </Accordion>

  <Accordion title="Теми форуму та поведінка потоків">
    Супергрупи форуму:

    - ключі сесій тем додають `:topic:<threadId>`
    - відповіді та введення тексту спрямовуються в потік теми
    - шлях config теми:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Особливий випадок загальної теми (`threadId=1`):

    - надсилання повідомлень пропускає `message_thread_id` (Telegram відхиляє `sendMessage(...thread_id=1)`)
    - дії введення тексту все одно включають `message_thread_id`

    Успадкування тем: записи тем успадковують налаштування групи, якщо не перевизначені (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` є лише для теми й не успадковується з налаштувань групи за замовчуванням.

    **Маршрутизація агентів для окремих тем**: Кожна тема може маршрутизуватися до іншого агента через `agentId` у config теми. Це надає кожній темі власний ізольований workspace, memory і session. Приклад:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Загальна тема → головний агент
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

    **Постійна прив’язка тем ACP**: Теми форуму можуть закріплювати сесії harness ACP через типізовані прив’язки ACP верхнього рівня:

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

    **ACP spawn, прив’язаний до потоку, із чату**:

    - `/acp spawn <agent> --thread here|auto` може прив’язати поточну тему Telegram до нової сесії ACP.
    - Наступні повідомлення в темі маршрутизуються безпосередньо до прив’язаної сесії ACP (без потреби в `/acp steer`).
    - Після успішної прив’язки OpenClaw закріплює в темі повідомлення з підтвердженням spawn.
    - Потрібно `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Контекст шаблону включає:

    - `MessageThreadId`
    - `IsForum`

    Поведінка потоків DM:

    - приватні чати з `message_thread_id` зберігають DM-маршрутизацію, але використовують ключі сесій і цілі відповідей з урахуванням потоків.

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

    Стікери описуються один раз (коли це можливо) і кешуються, щоб зменшити повторні виклики vision.

    Увімкніть дії зі стікерами:

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
  query: "кіт махає лапою",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Реакції Telegram надходять як оновлення `message_reaction` (окремо від пейлоадів повідомлень).

    Коли ввімкнено, OpenClaw ставить у чергу системні події на кшталт:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (за замовчуванням: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (за замовчуванням: `minimal`)

    Примітки:

    - `own` означає лише реакції користувачів на повідомлення, надіслані ботом (за можливості, через кеш надісланих повідомлень).
    - Події реакцій усе одно дотримуються контролю доступу Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); неавторизовані відправники відкидаються.
    - Telegram не надає ID потоку в оновленнях реакцій.
      - групи нефорумного типу маршрутизуються до сесії групового чату
      - групи форумного типу маршрутизуються до сесії загальної теми групи (`:topic:1`), а не до точної початкової теми

    `allowed_updates` для polling/webhook автоматично включають `message_reaction`.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - резервний варіант emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Telegram очікує Unicode emoji (наприклад, "👀").
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи в config із подій і команд Telegram">
    Записи в config каналу ввімкнені за замовчуванням (`configWrites !== false`).

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

  <Accordion title="Довге опитування чи Webhook">
    За замовчуванням: довге опитування.

    Режим Webhook:

    - задайте `channels.telegram.webhookUrl`
    - задайте `channels.telegram.webhookSecret` (обов’язково, якщо задано URL Webhook)
    - необов’язково `channels.telegram.webhookPath` (за замовчуванням `/telegram-webhook`)
    - необов’язково `channels.telegram.webhookHost` (за замовчуванням `127.0.0.1`)
    - необов’язково `channels.telegram.webhookPort` (за замовчуванням `8787`)

    Локальний слухач за замовчуванням для режиму Webhook прив’язується до `127.0.0.1:8787`.

    Якщо ваша публічна кінцева точка відрізняється, розмістіть перед нею reverse proxy і спрямуйте `webhookUrl` на публічний URL.
    Задайте `webhookHost` (наприклад, `0.0.0.0`), коли вам свідомо потрібен зовнішній вхідний доступ.

  </Accordion>

  <Accordion title="Обмеження, повторні спроби та цілі CLI">
    - Значення за замовчуванням для `channels.telegram.textChunkLimit` — 4000.
    - `channels.telegram.chunkMode="newline"` віддає перевагу межам абзаців (порожнім рядкам) перед поділом за довжиною.
    - `channels.telegram.mediaMaxMb` (за замовчуванням 100) обмежує розмір вхідних і вихідних медіа Telegram.
    - `channels.telegram.timeoutSeconds` перевизначає таймаут клієнта Telegram API (якщо не задано, застосовується значення grammY за замовчуванням).
    - Історія контексту групи використовує `channels.telegram.historyLimit` або `messages.groupChat.historyLimit` (за замовчуванням 50); `0` вимикає її.
    - Додатковий контекст відповіді/цитати/пересилання наразі передається як отримано.
    - Telegram allowlist насамперед керують тим, хто може активувати агента, а не є повною межею редагування додаткового контексту.
    - Керування історією DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Config `channels.telegram.retry` застосовується до допоміжних функцій надсилання Telegram (CLI/tools/actions) для відновлюваних вихідних помилок API.

    Ціллю надсилання в CLI може бути числовий ID чату або ім’я користувача:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram polling використовує `openclaw message poll` і підтримує теми форуму:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Прапорці poll лише для Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` для тем форуму (або використовуйте ціль `:topic:`)

    Надсилання Telegram також підтримує:

    - `--buttons` для вбудованих клавіатур, коли `channels.telegram.capabilities.inlineButtons` це дозволяє
    - `--force-document`, щоб надсилати вихідні зображення й GIF як документи замість стиснених фото або завантажень анімованих медіа

    Керування дозволами дій:

    - `channels.telegram.actions.sendMessage=false` вимикає вихідні повідомлення Telegram, зокрема poll
    - `channels.telegram.actions.poll=false` вимикає створення poll у Telegram, залишаючи звичайне надсилання ввімкненим

  </Accordion>

  <Accordion title="Підтвердження exec у Telegram">
    Telegram підтримує підтвердження exec у DM тих, хто підтверджує, і за потреби може публікувати запити на підтвердження у вихідному чаті або темі.

    Шлях config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (необов’язково; використовує як резервний варіант числові ID власника, виведені з `allowFrom` і прямого `defaultTo`, коли це можливо)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`

    Ті, хто підтверджує, мають бути числовими ID користувачів Telegram. Telegram автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного підтверджувача — або з `execApprovals.approvers`, або з числового config власника облікового запису (`allowFrom` і DM `defaultTo`). Задайте `enabled: false`, щоб явно вимкнути Telegram як нативний клієнт підтвердження. Інакше запити на підтвердження переходять до інших налаштованих маршрутів підтвердження або до fallback policy для підтверджень exec.

    Telegram також рендерить спільні кнопки підтвердження, які використовують інші канали чату. Нативний адаптер Telegram головним чином додає маршрутизацію DM для підтверджувачів, fanout на канали/теми та підказки введення перед доставкою.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що підтвердження в чаті недоступні або ручне підтвердження є єдиним шляхом.

    Правила доставки:

    - `target: "dm"` надсилає запити на підтвердження лише в DM визначеним підтверджувачам
    - `target: "channel"` надсилає запит назад у вихідний чат/тему Telegram
    - `target: "both"` надсилає в DM підтверджувачам і у вихідний чат/тему

    Лише визначені підтверджувачі можуть схвалювати або відхиляти. Інші користувачі не можуть використовувати `/approve` і не можуть використовувати кнопки підтвердження Telegram.

    Поведінка визначення підтвердження:

    - ID з префіксом `plugin:` завжди визначаються через підтвердження Plugin.
    - Інші ID спочатку намагаються пройти через `exec.approval.resolve`.
    - Якщо Telegram також авторизований для підтверджень Plugin і gateway повідомляє,
      що підтвердження exec невідоме/прострочене, Telegram повторює спробу один раз через
      `plugin.approval.resolve`.
    - Справжні відмови/помилки підтвердження exec не переходять мовчки до визначення
      підтвердження Plugin.

    Доставка в канал показує текст команди в чаті, тому вмикайте `channel` або `both` лише в довірених групах/темах. Коли запит потрапляє в тему форуму, OpenClaw зберігає тему як для запиту на підтвердження, так і для подальшої дії після підтвердження. За замовчуванням підтвердження exec спливають через 30 хвилин.

    Вбудовані кнопки підтвердження також залежать від того, що `channels.telegram.capabilities.inlineButtons` дозволяє цільову поверхню (`dm`, `group` або `all`).

    Пов’язана документація: [Підтвердження exec](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Керування відповідями про помилки

Коли агент стикається з помилкою доставки або provider, Telegram може або відповісти текстом помилки, або приховати її. Цю поведінку контролюють два ключі config:

| Ключ                                | Значення          | За замовчуванням | Опис                                                                                          |
| ----------------------------------- | ----------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`          | `reply` надсилає дружнє повідомлення про помилку в чат. `silent` повністю пригнічує відповіді про помилки. |
| `channels.telegram.errorCooldownMs` | число (мс)        | `60000`          | Мінімальний час між відповідями про помилки в тому самому чаті. Запобігає спаму помилками під час збоїв.        |

Підтримуються перевизначення для окремого облікового запису, окремої групи та окремої теми (таке саме успадкування, як і для інших ключів config Telegram).

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

## Усунення проблем

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення в групі без згадки">

    - Якщо `requireMention=false`, режим приватності Telegram має дозволяти повну видимість.
      - BotFather: `/setprivacy` -> Disable
      - потім видаліть бота й додайте його знову до групи
    - `openclaw channels status` попереджає, коли config очікує повідомлення в групі без згадки.
    - `openclaw channels status --probe` може перевіряти явні числові ID груп; wildcard `"*"` не можна перевірити на членство через probe.
    - швидка перевірка сесії: `/activation always`.

  </Accordion>

  <Accordion title="Бот взагалі не бачить повідомлень групи">

    - коли `channels.telegram.groups` існує, група має бути вказана в списку (або має бути `"*"`)
    - перевірте, що бот є учасником групи
    - перегляньте логи: `openclaw logs --follow` для причин пропуску

  </Accordion>

  <Accordion title="Команди працюють частково або взагалі не працюють">

    - авторизуйте свою ідентичність відправника (сполучення та/або числовий `allowFrom`)
    - авторизація команд усе одно застосовується, навіть якщо політика групи — `open`
    - `setMyCommands failed` із `BOT_COMMANDS_TOO_MUCH` означає, що нативне меню має занадто багато записів; зменште кількість команд Plugin/Skills/користувацьких команд або вимкніть нативні меню
    - `setMyCommands failed` із помилками network/fetch зазвичай вказує на проблеми досяжності DNS/HTTPS до `api.telegram.org`

  </Accordion>

  <Accordion title="Нестабільність polling або мережі">

    - Node 22+ + custom fetch/proxy можуть викликати негайне переривання, якщо типи AbortSignal не збігаються.
    - Деякі хости спочатку визначають `api.telegram.org` у IPv6; несправний вихідний IPv6 може спричиняти періодичні збої Telegram API.
    - Якщо логи містять `TypeError: fetch failed` або `Network request for 'getUpdates' failed!`, OpenClaw тепер повторює такі спроби як відновлювані помилки мережі.
    - На VPS-хостах із нестабільним прямим виходом/TLS маршрутизуйте виклики Telegram API через `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - У Node 22+ за замовчуванням `autoSelectFamily=true` (крім WSL2) і `dnsResultOrder=ipv4first`.
    - Якщо ваш хост — WSL2 або йому явно краще працювати в режимі лише IPv4, примусово задайте вибір сімейства:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Відповіді з benchmark-range RFC 2544 (`198.18.0.0/15`) уже дозволені
      за замовчуванням для завантажень медіа Telegram. Якщо довірений fake-IP або
      transparent proxy переписує `api.telegram.org` на якусь іншу
      приватну/внутрішню/special-use адресу під час завантаження медіа, ви можете
      явно ввімкнути обхід лише для Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Така сама явна опція доступна для окремого облікового запису в
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Якщо ваш proxy визначає медіахости Telegram у `198.18.x.x`, спочатку залиште
      небезпечний прапорець вимкненим. Медіа Telegram уже дозволяють діапазон RFC 2544
      за замовчуванням.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` послаблює захист Telegram
      media SSRF. Використовуйте це лише в довірених середовищах із proxy, контрольованих оператором,
      таких як маршрутизація fake-IP у Clash, Mihomo або Surge, коли вони синтезують
      приватні або special-use відповіді поза межами benchmark range RFC 2544. Для звичайного
      доступу до Telegram через публічний інтернет залишайте це вимкненим.
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

Додаткова допомога: [Усунення проблем каналу](/uk/channels/troubleshooting).

## Вказівники на довідник config Telegram

Основний довідник:

- `channels.telegram.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.telegram.botToken`: токен бота (BotFather).
- `channels.telegram.tokenFile`: читати токен зі шляху до звичайного файла. Symlink відхиляються.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.telegram.allowFrom`: DM allowlist (числові ID користувачів Telegram). `allowlist` потребує принаймні одного ID відправника. `open` потребує `"*"`. `openclaw doctor --fix` може перетворити застарілі записи `@username` на ID, а також може відновити записи allowlist із файлів pairing-store у потоках міграції allowlist.
- `channels.telegram.actions.poll`: увімкнути або вимкнути створення poll у Telegram (за замовчуванням: увімкнено; усе одно потребує `sendMessage`).
- `channels.telegram.defaultTo`: ціль Telegram за замовчуванням, яку використовує CLI `--deliver`, коли не задано явний `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist відправників у групах (числові ID користувачів Telegram). `openclaw doctor --fix` може перетворити застарілі записи `@username` на ID. Нечислові записи ігноруються під час auth. Auth у групах не використовує резервний варіант DM pairing-store (`2026.2.25+`).
- Пріоритетність multi-account:
  - Коли налаштовано два або більше ID облікових записів, задайте `channels.telegram.defaultAccount` (або включіть `channels.telegram.accounts.default`), щоб зробити маршрутизацію за замовчуванням явною.
  - Якщо не задано ні те, ні інше, OpenClaw використовує перший нормалізований ID облікового запису як резервний варіант, а `openclaw doctor` показує попередження.
  - `channels.telegram.accounts.default.allowFrom` і `channels.telegram.accounts.default.groupAllowFrom` застосовуються лише до облікового запису `default`.
  - Іменовані облікові записи успадковують `channels.telegram.allowFrom` і `channels.telegram.groupAllowFrom`, коли значення на рівні облікового запису не задано.
  - Іменовані облікові записи не успадковують `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: значення за замовчуванням для окремих груп + allowlist (використовуйте `"*"` для глобальних значень за замовчуванням).
  - `channels.telegram.groups.<id>.groupPolicy`: перевизначення groupPolicy для окремої групи (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: значення за замовчуванням для обов’язкової згадки.
  - `channels.telegram.groups.<id>.skills`: фільтр Skills (не вказано = усі Skills, порожньо = жодного).
  - `channels.telegram.groups.<id>.allowFrom`: перевизначення allowlist відправників для окремої групи.
  - `channels.telegram.groups.<id>.systemPrompt`: додатковий системний prompt для групи.
  - `channels.telegram.groups.<id>.enabled`: вимкнути групу, якщо `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: перевизначення для окремої теми (поля групи + `agentId`, який доступний лише для теми).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: маршрутизувати цю тему до конкретного агента (перевизначає маршрутизацію на рівні групи та binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: перевизначення groupPolicy для окремої теми (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: перевизначення обов’язкової згадки для окремої теми.
- верхньорівневий `bindings[]` з `type: "acp"` і канонічним ID теми `chatId:topic:topicId` у `match.peer.id`: поля постійної прив’язки тем ACP (див. [ACP Agents](/uk/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: маршрутизувати теми DM до конкретного агента (така сама поведінка, як у тем форуму).
- `channels.telegram.execApprovals.enabled`: увімкнути Telegram як клієнт підтвердження exec на основі чату для цього облікового запису.
- `channels.telegram.execApprovals.approvers`: ID користувачів Telegram, яким дозволено схвалювати або відхиляти запити exec. Необов’язково, якщо `channels.telegram.allowFrom` або прямий `channels.telegram.defaultTo` уже визначає власника.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (за замовчуванням: `dm`). `channel` і `both` зберігають вихідну тему Telegram, якщо вона є.
- `channels.telegram.execApprovals.agentFilter`: необов’язковий фільтр ID агента для пересланих запитів на підтвердження.
- `channels.telegram.execApprovals.sessionFilter`: необов’язковий фільтр ключа сесії (підрядок або regex) для пересланих запитів на підтвердження.
- `channels.telegram.accounts.<account>.execApprovals`: перевизначення для окремого облікового запису для маршрутизації підтверджень exec у Telegram та авторизації тих, хто підтверджує.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (за замовчуванням: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: перевизначення для окремого облікового запису.
- `channels.telegram.commands.nativeSkills`: увімкнути/вимкнути нативні команди Skills у Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (за замовчуванням: `off`).
- `channels.telegram.textChunkLimit`: розмір вихідного фрагмента (символів).
- `channels.telegram.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.telegram.linkPreview`: перемикач попереднього перегляду посилань для вихідних повідомлень (за замовчуванням: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (live stream preview; за замовчуванням: `partial`; `progress` зіставляється з `partial`; `block` — сумісність із застарілим режимом preview). Preview streaming у Telegram використовує одне повідомлення попереднього перегляду, яке редагується на місці.
- `channels.telegram.mediaMaxMb`: обмеження медіа Telegram для вхідних/вихідних даних (МБ, за замовчуванням: 100).
- `channels.telegram.retry`: політика повторних спроб для допоміжних функцій надсилання Telegram (CLI/tools/actions) у разі відновлюваних вихідних помилок API (`attempts`, `minDelayMs`, `maxDelayMs`, `jitter`).
- `channels.telegram.network.autoSelectFamily`: перевизначити Node autoSelectFamily (true=увімкнути, false=вимкнути). За замовчуванням увімкнено в Node 22+, а для WSL2 за замовчуванням вимкнено.
- `channels.telegram.network.dnsResultOrder`: перевизначити порядок результатів DNS (`ipv4first` або `verbatim`). За замовчуванням `ipv4first` у Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: небезпечний явний дозвіл для довірених середовищ із fake-IP або transparent proxy, де завантаження медіа Telegram визначають `api.telegram.org` у приватні/внутрішні/special-use адреси поза межами дозволеного за замовчуванням benchmark-range RFC 2544.
- `channels.telegram.proxy`: URL proxy для викликів Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: увімкнути режим Webhook (потребує `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: секрет Webhook (обов’язковий, коли задано webhookUrl).
- `channels.telegram.webhookPath`: локальний шлях Webhook (за замовчуванням `/telegram-webhook`).
- `channels.telegram.webhookHost`: локальний хост прив’язки Webhook (за замовчуванням `127.0.0.1`).
- `channels.telegram.webhookPort`: локальний порт прив’язки Webhook (за замовчуванням `8787`).
- `channels.telegram.actions.reactions`: керування дозволами для реакцій інструмента Telegram.
- `channels.telegram.actions.sendMessage`: керування дозволами для надсилання повідомлень інструментом Telegram.
- `channels.telegram.actions.deleteMessage`: керування дозволами для видалення повідомлень інструментом Telegram.
- `channels.telegram.actions.sticker`: керування дозволами для дій зі стікерами Telegram — надсилання та пошук (за замовчуванням: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — керує тим, які реакції запускають системні події (за замовчуванням: `own`, якщо не задано).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — керує можливістю агента працювати з реакціями (за замовчуванням: `minimal`, якщо не задано).
- `channels.telegram.errorPolicy`: `reply | silent` — керує поведінкою відповіді на помилки (за замовчуванням: `reply`). Підтримуються перевизначення для окремого облікового запису/групи/теми.
- `channels.telegram.errorCooldownMs`: мінімальна кількість мс між відповідями про помилки в тому самому чаті (за замовчуванням: `60000`). Запобігає спаму помилками під час збоїв.

- [Довідник конфігурації - Telegram](/uk/gateway/configuration-reference#telegram)

Поля Telegram із високим сигналом:

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` має вказувати на звичайний файл; symlink відхиляються)
- контроль доступу: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, верхньорівневий `bindings[]` (`type: "acp"`)
- підтвердження exec: `execApprovals`, `accounts.*.execApprovals`
- команда/меню: `commands.native`, `commands.nativeSkills`, `customCommands`
- потоки/відповіді: `replyToMode`
- streaming: `streaming` (preview), `blockStreaming`
- форматування/доставка: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- медіа/мережа: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- дії/можливості: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- реакції: `reactionNotifications`, `reactionLevel`
- помилки: `errorPolicy`, `errorCooldownMs`
- записи/історія: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація multi-agent](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
