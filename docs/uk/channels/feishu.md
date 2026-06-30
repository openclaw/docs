---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд, функції та налаштування бота Feishu
title: Feishu
x-i18n:
    generated_at: "2026-06-30T14:22:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark — це універсальна платформа для співпраці, де команди спілкуються в чаті, діляться документами, керують календарями та разом виконують роботу.

**Стан:** готово до production для DM бота й групових чатів. WebSocket є режимом за замовчуванням; режим webhook необов’язковий.

---

## Швидкий старт

<Note>
Потрібен OpenClaw 2026.5.29 або новіший. Виконайте `openclaw --version`, щоб перевірити. Оновіть за допомогою `openclaw update`.
</Note>

<Steps>
  <Step title="Запустіть майстер налаштування каналу">
  ```bash
  openclaw channels login --channel feishu
  ```
  Виберіть ручне налаштування, щоб вставити App ID і App Secret із Feishu Open Platform, або виберіть налаштування через QR, щоб автоматично створити бота. Якщо внутрішній мобільний застосунок Feishu не реагує на QR-код, повторно запустіть налаштування й виберіть ручне налаштування.
  </Step>
  
  <Step title="Після завершення налаштування перезапустіть gateway, щоб застосувати зміни">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Контроль доступу

### Прямі повідомлення

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати DM боту:

- `"pairing"` - невідомі користувачі отримують код сполучення; підтвердьте через CLI
- `"allowlist"` - спілкуватися можуть лише користувачі, перелічені в `allowFrom`
- `"open"` - дозволяє публічні DM лише коли `allowFrom` містить `"*"`; з обмежувальними записами спілкуватися можуть лише відповідні користувачі

**Підтвердити запит на сполучення:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика груп** (`channels.feishu.groupPolicy`):

| Значення     | Поведінка                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `"open"`      | Відповідати на всі повідомлення в групах                                                           |
| `"allowlist"` | Відповідати лише групам у `groupAllowFrom` або явно налаштованим у `groups.<chat_id>`              |
| `"disabled"`  | Вимкнути всі групові повідомлення; явні записи `groups.<chat_id>` це не перевизначають             |

За замовчуванням: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` - вимагати @mention (за замовчуванням)
- `false` - відповідати без @mention
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`
- Широкомовні лише `@all` і `@_all` не вважаються згадками бота. Повідомлення, яке згадує і `@all`, і бота напряму, все одно зараховується як згадка бота.

---

## Приклади конфігурації груп

### Дозволити всі групи, @mention не потрібен

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Дозволити всі групи, але все ще вимагати @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Дозволити лише певні групи

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

У режимі `allowlist` ви також можете дозволити групу, додавши явний запис `groups.<chat_id>`. Явні записи не перевизначають `groupPolicy: "disabled"`. Шаблонні значення за замовчуванням у `groups.*` налаштовують відповідні групи, але самі по собі не дозволяють групи.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Обмежити відправників у межах групи

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Отримати ID групи/користувача

### ID груп (`chat_id`, формат: `oc_xxx`)

Відкрийте групу у Feishu/Lark, натисніть іконку меню у верхньому правому куті й перейдіть до **Налаштування**. ID групи (`chat_id`) вказано на сторінці налаштувань.

![Отримати ID групи](/images/feishu-get-group-id.png)

### ID користувачів (`open_id`, формат: `ou_xxx`)

Запустіть gateway, надішліть DM боту, потім перевірте журнали:

```bash
openclaw logs --follow
```

Шукайте `open_id` у виводі журналу. Також можна перевірити запити на сполучення, що очікують:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Команда   | Опис                          |
| --------- | ----------------------------- |
| `/status` | Показати стан бота            |
| `/reset`  | Скинути поточну сесію         |
| `/model`  | Показати або змінити AI-модель |

<Note>
Feishu/Lark не підтримує власні меню slash-команд, тому надсилайте їх як звичайні текстові повідомлення.
</Note>

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви @mention бота (потрібно за замовчуванням)
3. Перевірте, що `groupPolicy` не є `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бот опублікований і схвалений у Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **постійне з’єднання** (WebSocket)
4. Переконайтеся, що надано всі потрібні області дозволів
5. Переконайтеся, що gateway запущено: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### Налаштування через QR не реагує в мобільному застосунку Feishu

1. Повторно запустіть налаштування: `openclaw channels login --channel feishu`
2. Виберіть ручне налаштування
3. У Feishu Open Platform створіть власний застосунок і скопіюйте його App ID та App Secret
4. Вставте ці облікові дані в майстер налаштування

### App Secret витік

1. Скиньте App Secret у Feishu Open Platform / Lark Developer
2. Оновіть значення у вашій конфігурації
3. Перезапустіть gateway: `openclaw gateway restart`

---

## Розширена конфігурація

### Кілька облікових записів

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` керує тим, який обліковий запис використовується, коли вихідні API не вказують `accountId`.
`accounts.<id>.tts` використовує ту саму форму, що й `messages.tts`, і виконує глибоке злиття поверх
глобальної конфігурації TTS, тому налаштування Feishu із кількома ботами можуть зберігати спільні облікові дані
провайдера глобально, перевизначаючи лише голос, модель, персону або автоматичний режим
для кожного облікового запису.

### Ліміти повідомлень

- `textChunkLimit` - розмір фрагмента вихідного тексту (за замовчуванням: `2000` символів)
- `mediaMaxMb` - ліміт завантаження/отримання медіа (за замовчуванням: `30` MB)

### Потокове передавання

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Коли це ввімкнено, бот оновлює картку в реальному часі під час генерування тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Установіть `streaming: false`, щоб надіслати повну відповідь одним повідомленням. `blockStreaming` вимкнено за замовчуванням; вмикайте це лише тоді, коли хочете перед фінальною відповіддю надсилати завершені блоки assistant.

### Оптимізація квоти

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (за замовчуванням `true`): установіть `false`, щоб пропускати виклики реакції набору тексту
- `resolveSenderNames` (за замовчуванням `true`): установіть `false`, щоб пропускати пошуки профілів відправників

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Сесії ACP

Feishu/Lark підтримує ACP для DM і повідомлень у групових гілках. ACP у Feishu/Lark керується текстовими командами - власних меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

#### Постійне прив’язування ACP

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
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Запустити ACP із чату

У DM або гілці Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для DM і повідомлень у гілках Feishu/Lark. Подальші повідомлення у прив’язаній розмові маршрутизуються безпосередньо до цієї сесії ACP.

### Маршрутизація кількох агентів

Використовуйте `bindings`, щоб маршрутизувати DM або групи Feishu/Lark до різних агентів.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Поля маршрутизації:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) або `"group"` (груповий чат)
- `match.peer.id`: Open ID користувача (`ou_xxx`) або ID групи (`oc_xxx`)

Див. [Отримати ID групи/користувача](#get-groupuser-ids), щоб отримати підказки з пошуку.

---

## Ізоляція агента для кожного користувача (динамічне створення агентів)

Увімкніть `dynamicAgentCreation`, щоб автоматично створювати **ізольовані екземпляри агентів** для кожного користувача DM. Кожен користувач отримує власні:

- Незалежний каталог робочого простору
- Окремі `USER.md` / `SOUL.md` / `MEMORY.md`
- Приватна історія розмов
- Ізольовані Skills і стан

Це важливо для публічних ботів, де ви хочете, щоб кожен користувач мав власний приватний досвід AI-асистента.

<Note>
Динамічні прив’язування містять нормалізований Feishu `accountId`, тому облікові записи за замовчуванням і іменовані облікові записи маршрутизують кожного відправника до правильного динамічного агента.

Якщо іменований обліковий запис створив динамічного агента без області на старішому випуску, цей legacy-агент усе ще враховується в `maxAgents`. Підтвердьте, що його не використовує обліковий запис за замовчуванням, перш ніж видаляти його, або тимчасово збільште `maxAgents`; OpenClaw не може безпечно визначити, якому обліковому запису належить неоднозначний legacy-стан.
</Note>

### Швидке налаштування

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Як це працює

Коли новий користувач надсилає свій перший DM:

1. Канал генерує унікальний `agentId`: `feishu-{user_open_id}` для облікового запису за замовчуванням або обмежений дайджест ідентичності з префіксом облікового запису для іменованого облікового запису
2. Створює новий робочий простір за шляхом `workspaceTemplate`
3. Реєструє агента й створює прив’язування для цього користувача
4. Допоміжний засіб робочого простору забезпечує bootstrap-файли (`AGENTS.md`, `SOUL.md`, `USER.md` тощо) під час першого доступу
5. Маршрутизує всі майбутні повідомлення від цього користувача до його виділеного агента

### Параметри конфігурації

| Налаштування                                             | Опис                                           | Типове значення                     |
| -------------------------------------------------------- | ---------------------------------------------- | ----------------------------------- |
| `channels.feishu.dynamicAgentCreation.enabled`           | Увімкнути автоматичне створення агента для кожного користувача | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Шаблон шляху для робочих просторів динамічних агентів | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Шаблон назви каталогу агента                   | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Максимальна кількість динамічних агентів для створення | без обмежень                        |

Змінні шаблону:

- `{agentId}` - згенерований ID агента (наприклад, `feishu-ou_xxxxxx` або `feishu-support-<identity_digest>`)
- `{userId}` - Feishu open_id відправника (наприклад, `ou_xxxxxx`)

### Область сеансу

`session.dmScope` керує тим, як прямі повідомлення зіставляються із сеансами агентів. Це **глобальне налаштування**, що впливає на всі канали.

| Значення                    | Поведінка                                                           | Найкраще для                                                      |
| --------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `"main"`                    | DM кожного користувача зіставляється з основним сеансом його агента | Однокористувацькі боти, де потрібно автоматично завантажувати `USER.md` / `SOUL.md` |
| `"per-channel-peer"`        | Кожна комбінація (канал + користувач) отримує окремий сеанс         | Публічні багатокористувацькі боти, яким потрібна сильніша ізоляція |
| `"per-account-channel-peer"` | Кожна комбінація (обліковий запис + канал + користувач) отримує окремий сеанс | Багатооблікові боти, яким потрібна ізоляція сеансів на рівні облікового запису |

**Компроміс**: використання `"main"` вмикає автоматичне завантаження bootstrap-файлів (`USER.md`, `SOUL.md`, `MEMORY.md`), але означає, що всі DM у всіх каналах мають спільний шаблон ключів сеансів. Для публічних багатокористувацьких ботів, де ізоляція важливіша за автоматичне завантаження bootstrap-файлів, розгляньте `"per-channel-peer"` і керуйте bootstrap-файлами вручну.

<Note>
Використовуйте `"per-account-channel-peer"`, коли іменовані облікові записи Feishu мають зберігати окремі сеанси для того самого відправника. Динамічні прив’язки зберігають область облікового запису.
</Note>

```json5
{
  session: {
    // Для персональних однокористувацьких ботів: вмикає автоматичне завантаження bootstrap-файлів
    dmScope: "main",

    // Для публічних багатокористувацьких ботів: сильніша ізоляція
    // dmScope: "per-channel-peer",
  },
}
```

### Типове багатокористувацьке розгортання

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Оберіть dmScope відповідно до ваших потреб ізоляції:
    // "main" для автоматичного завантаження bootstrap-файлів, "per-channel-peer" для сильнішої ізоляції
    dmScope: "main",
  },
  bindings: [], // Порожньо - динамічні агенти прив’язуються автоматично
}
```

### Перевірка

Перевірте журнали Gateway, щоб підтвердити, що динамічне створення працює:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Вивести всі створені робочі простори:

```bash
ls -la ~/.openclaw/workspace-*
```

### Примітки

- **Ізоляція робочого простору**: кожен користувач отримує власний каталог робочого простору та екземпляр агента. Користувачі не можуть бачити історію розмов або файли одне одного в межах звичайного потоку повідомлень.
- **Межа безпеки**: це механізм ізоляції контексту повідомлень, а не межа безпеки проти недовіреного співорендаря. Процес агента та середовище хоста є спільними.
- **`bindings` має бути порожнім**: динамічні агенти автоматично реєструють власні прив’язки
- **Шлях оновлення**: наявні ручні прив’язки продовжують працювати разом із динамічними агентами
- **`session.dmScope` є глобальним**: це впливає на всі канали, а не лише на Feishu

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Налаштування                                             | Опис                                                                           | Типове значення                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| `channels.feishu.enabled`                                | Увімкнути/вимкнути канал                                                       | `true`                              |
| `channels.feishu.domain`                                 | Домен API (`feishu` або `lark`)                                                | `feishu`                            |
| `channels.feishu.connectionMode`                         | Транспорт подій (`websocket` або `webhook`)                                    | `websocket`                         |
| `channels.feishu.defaultAccount`                         | Типовий обліковий запис для вихідної маршрутизації                             | `default`                           |
| `channels.feishu.verificationToken`                      | Обов’язково для режиму webhook                                                 | -                                   |
| `channels.feishu.encryptKey`                             | Обов’язково для режиму webhook                                                 | -                                   |
| `channels.feishu.webhookPath`                            | Шлях маршруту webhook                                                          | `/feishu/events`                    |
| `channels.feishu.webhookHost`                            | Хост прив’язки webhook                                                         | `127.0.0.1`                         |
| `channels.feishu.webhookPort`                            | Порт прив’язки webhook                                                         | `3000`                              |
| `channels.feishu.accounts.<id>.appId`                    | ID застосунку                                                                  | -                                   |
| `channels.feishu.accounts.<id>.appSecret`                | Секрет застосунку                                                              | -                                   |
| `channels.feishu.accounts.<id>.domain`                   | Перевизначення домену для облікового запису                                    | `feishu`                            |
| `channels.feishu.accounts.<id>.tts`                      | Перевизначення TTS для облікового запису                                       | `messages.tts`                      |
| `channels.feishu.dmPolicy`                               | Політика DM                                                                    | `pairing`                           |
| `channels.feishu.allowFrom`                              | Список дозволених DM (список open_id)                                          | -                                   |
| `channels.feishu.groupPolicy`                            | Політика груп                                                                  | `allowlist`                         |
| `channels.feishu.groupAllowFrom`                         | Список дозволених груп                                                         | -                                   |
| `channels.feishu.requireMention`                         | Вимагати @mention у групах                                                     | `true`                              |
| `channels.feishu.groups.<chat_id>.requireMention`        | Перевизначення @mention для групи; явні ID також допускають групу в режимі списку дозволених | успадковано                         |
| `channels.feishu.groups.<chat_id>.enabled`               | Увімкнути/вимкнути конкретну групу                                             | `true`                              |
| `channels.feishu.dynamicAgentCreation.enabled`           | Увімкнути автоматичне створення агента для кожного користувача                 | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Шаблон шляху для робочих просторів динамічних агентів                          | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Шаблон назви каталогу агента                                                   | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Максимальна кількість динамічних агентів для створення                         | без обмежень                        |
| `channels.feishu.textChunkLimit`                         | Розмір фрагмента повідомлення                                                  | `2000`                              |
| `channels.feishu.mediaMaxMb`                             | Обмеження розміру медіа                                                        | `30`                                |
| `channels.feishu.streaming`                              | Потокове виведення картки                                                      | `true`                              |
| `channels.feishu.blockStreaming`                         | Потокова відповідь завершеними блоками                                         | `false`                             |
| `channels.feishu.typingIndicator`                        | Надсилати реакції набору тексту                                                | `true`                              |
| `channels.feishu.resolveSenderNames`                     | Розпізнавати відображувані імена відправників                                  | `true`                              |
| `channels.feishu.tools.bitable`                          | Увімкнути інструменти Bitable/Base                                             | `true`                              |
| `channels.feishu.tools.base`                             | Псевдонім для `channels.feishu.tools.bitable`; явний `bitable` має пріоритет, коли задано обидва | `true`                              |
| `channels.feishu.accounts.<id>.tools.bitable`            | Обмежувач інструментів Bitable/Base для облікового запису                      | успадковано                         |
| `channels.feishu.accounts.<id>.tools.base`               | Псевдонім для `tools.bitable` для облікового запису                            | успадковано                         |

---

## Підтримувані типи повідомлень

### Отримання

- ✅ Текст
- ✅ Форматований текст (post)
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Стікери

Вхідні аудіоповідомлення Feishu/Lark нормалізуються як медіаплейсхолдери замість необробленого JSON `file_key`. Коли налаштовано `tools.media.audio`, OpenClaw завантажує ресурс голосової нотатки й запускає спільну транскрипцію аудіо перед ходом агента, тож агент отримує транскрипт мовлення. Якщо Feishu включає текст транскрипту безпосередньо в аудіо-пейлоад, цей текст використовується без додаткового виклику ASR. Без постачальника транскрипції аудіо агент усе одно отримує плейсхолдер `<media:audio>` разом зі збереженим вкладенням, а не необроблений пейлоад ресурсу Feishu.

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (включно з потоковими оновленнями)
- ⚠️ Форматований текст (форматування в стилі дописів; не підтримує повні можливості авторингу Feishu/Lark)

Нативні аудіобульбашки Feishu/Lark використовують тип повідомлення Feishu `audio` і потребують
завантаженого медіа Ogg/Opus (`file_type: "opus"`). Наявні медіа `.opus` і `.ogg`
надсилаються напряму як нативне аудіо. MP3/WAV/M4A та інші ймовірні аудіоформати
перекодовуються у 48kHz Ogg/Opus за допомогою `ffmpeg` лише тоді, коли відповідь запитує голосову
доставку (`audioAsVoice` / інструмент повідомлень `asVoice`, включно з відповідями голосових нотаток TTS).
Звичайні вкладення MP3 залишаються звичайними файлами. Якщо `ffmpeg` відсутній або
перетворення завершується невдало, OpenClaw повертається до файлового вкладення й записує причину в журнал.

### Гілки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в гілках
- ✅ Медіавідповіді залишаються прив’язаними до гілки під час відповіді на повідомлення в гілці

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` нативні
тематичні групи Feishu/Lark використовують подію `thread_id` (`omt_*`) як канонічний
ключ тематичного сеансу. Якщо нативна подія, що починає тему, не містить `thread_id`, OpenClaw
підтягує його з Feishu перед маршрутизацією ходу. Звичайні відповіді в групі, які
OpenClaw перетворює на гілки, продовжують використовувати ID кореневого повідомлення відповіді (`om_*`), щоб
перший хід і наступний хід залишалися в тому самому сеансі.

---

## Пов’язане

- [Огляд каналів](/uk/channels) - усі підтримувані канали
- [Сполучення](/uk/channels/pairing) - автентифікація DM і потік сполучення
- [Групи](/uk/channels/groups) - поведінка групових чатів і блокування за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) - маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) - модель доступу й посилення захисту
