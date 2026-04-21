---
read_when:
    - Зміна поведінки групового чату або керування згадками
summary: Поведінка групового чату на різних поверхнях (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Групи
x-i18n:
    generated_at: "2026-04-21T23:42:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86e202c7e990e040eb092aaef46bc856ee8d39b2e5fe1c733e24f1b35faa824
    source_path: channels/groups.md
    workflow: 15
---

# Групи

OpenClaw узгоджено обробляє групові чати на різних поверхнях: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Вступ для початківців (2 хвилини)

OpenClaw «живе» у ваших власних облікових записах месенджерів. Окремого користувача-бота WhatsApp немає.
Якщо **ви** перебуваєте в групі, OpenClaw може бачити цю групу й відповідати там.

Поведінка за замовчуванням:

- Групи обмежені (`groupPolicy: "allowlist"`).
- Для відповідей потрібна згадка, якщо ви явно не вимкнули керування згадками.

Переклад простою мовою: відправники з allowlist можуть активувати OpenClaw, згадавши його.

> TL;DR
>
> - **Доступ до DM** контролюється через `*.allowFrom`.
> - **Доступ до груп** контролюється через `*.groupPolicy` + allowlist-и (`*.groups`, `*.groupAllowFrom`).
> - **Запуск відповіді** контролюється через керування згадками (`requireMention`, `/activation`).

Швидка схема (що відбувається з повідомленням у групі):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Видимість контексту та allowlist-и

У безпеці груп беруть участь два різні механізми контролю:

- **Авторизація запуску**: хто може активувати агента (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist-и, специфічні для каналу).
- **Видимість контексту**: який додатковий контекст передається в модель (текст відповіді, цитати, історія треду, метадані пересилання).

За замовчуванням OpenClaw надає пріоритет звичайній поведінці чату й переважно зберігає контекст у тому вигляді, у якому він надійшов. Це означає, що allowlist-и насамперед визначають, хто може запускати дії, а не є універсальною межею редагування для кожного процитованого чи історичного фрагмента.

Поточна поведінка залежить від каналу:

- У деяких каналах уже застосовується фільтрація за відправником для додаткового контексту в окремих шляхах (наприклад, ініціалізація тредів Slack, пошук відповідей/тредів у Matrix).
- Інші канали все ще передають контекст цитат/відповідей/пересилань у тому вигляді, у якому його отримано.

Напрямок посилення захисту (заплановано):

- `contextVisibility: "all"` (за замовчуванням) зберігає поточну поведінку «як отримано».
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників з allowlist.
- `contextVisibility: "allowlist_quote"` — це `allowlist` плюс один явний виняток для цитати/відповіді.

Поки цю модель посилення захисту не реалізовано узгоджено в усіх каналах, очікуйте відмінностей залежно від поверхні.

![Потік групових повідомлень](/images/groups-flow.svg)

Якщо ви хочете...

| Ціль                                         | Що встановити                                              |
| -------------------------------------------- | ---------------------------------------------------------- |
| Дозволити всі групи, але відповідати лише на @mentions | `groups: { "*": { requireMention: true } }`                |
| Вимкнути всі групові відповіді               | `groupPolicy: "disabled"`                                  |
| Лише певні групи                             | `groups: { "<group-id>": { ... } }` (без ключа `"*"`)      |
| Лише ви можете активувати відповіді в групах | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Ключі сесій

- Групові сесії використовують ключі сесій `agent:<agentId>:<channel>:group:<id>` (кімнати/канали використовують `agent:<agentId>:<channel>:channel:<id>`).
- Теми форуму Telegram додають `:topic:<threadId>` до ідентифікатора групи, тому кожна тема має власну сесію.
- Прямі чати використовують основну сесію (або окрему для кожного відправника, якщо це налаштовано).
- Heartbeat пропускаються для групових сесій.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Шаблон: особисті DM + публічні групи (один агент)

Так — це добре працює, якщо ваш «особистий» трафік — це **DM**, а ваш «публічний» трафік — це **групи**.

Чому: у режимі одного агента DM зазвичай потрапляють до **основного** ключа сесії (`agent:main:main`), тоді як групи завжди використовують **неосновні** ключі сесії (`agent:main:<channel>:group:<id>`). Якщо ввімкнути ізоляцію через `mode: "non-main"`, ці групові сесії працюватимуть у налаштованому backend ізоляції, а ваша основна DM-сесія залишиться на хості. Якщо ви не виберете backend явно, за замовчуванням використовується Docker.

Це дає вам один «розум» агента (спільний робочий простір + пам’ять), але дві моделі виконання:

- **DM**: повні інструменти (хост)
- **Групи**: ізольоване середовище + обмежені інструменти

> Якщо вам потрібні справді окремі робочі простори/персони («особисте» і «публічне» ніколи не мають змішуватися), використовуйте другого агента + bindings. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent).

Приклад (DM на хості, групи в sandbox + лише інструменти для обміну повідомленнями):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Хочете, щоб «групи бачили лише теку X» замість «жодного доступу до хоста»? Залиште `workspaceAccess: "none"` і змонтуйте в sandbox лише шляхи з allowlist:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Пов’язано:

- Ключі конфігурації та значення за замовчуванням: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- Налагодження причин блокування інструмента: [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)
- Докладніше про bind mounts: [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts)

## Мітки відображення

- Мітки інтерфейсу використовують `displayName`, коли воно доступне, у форматі `<channel>:<token>`.
- `#room` зарезервовано для кімнат/каналів; групові чати використовують `g-<slug>` (нижній регістр, пробіли -> `-`, зберігати `#@+._-`).

## Політика груп

Керує тим, як обробляються повідомлення груп/кімнат для кожного каналу:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Policy        | Поведінка                                                    |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Групи оминають allowlist-и; керування згадками все одно застосовується. |
| `"disabled"`  | Повністю блокує всі групові повідомлення.                    |
| `"allowlist"` | Дозволяє лише групи/кімнати, які відповідають налаштованому allowlist. |

Примітки:

- `groupPolicy` відокремлена від керування згадками (яке вимагає @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: використовуйте `groupAllowFrom` (резервний варіант: явний `allowFrom`).
- Схвалення парування для DM (записи сховища `*-allowFrom`) застосовуються лише до доступу DM; авторизація відправників у групах залишається явно прив’язаною до allowlist-ів груп.
- Discord: allowlist використовує `channels.discord.guilds.<id>.channels`.
- Slack: allowlist використовує `channels.slack.channels`.
- Matrix: allowlist використовує `channels.matrix.groups`. Надавайте перевагу ID кімнат або псевдонімам; пошук імен підключених кімнат виконується в режимі best-effort, а нерозв’язані імена ігноруються під час виконання. Використовуйте `channels.matrix.groupAllowFrom`, щоб обмежити відправників; також підтримуються allowlist-и `users` для окремих кімнат.
- Групові DM контролюються окремо (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram allowlist може збігатися з ID користувачів (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) або іменами користувачів (`"@alice"` або `"alice"`); префікси нечутливі до регістру.
- Значення за замовчуванням — `groupPolicy: "allowlist"`; якщо ваш allowlist груп порожній, групові повідомлення блокуються.
- Безпека під час виконання: коли блок постачальника повністю відсутній (`channels.<provider>` відсутній), політика груп переходить у fail-closed режим (зазвичай `allowlist`) замість успадкування `channels.defaults.groupPolicy`.

Швидка ментальна модель (порядок перевірки для групових повідомлень):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlist-и груп (`*.groups`, `*.groupAllowFrom`, allowlist, специфічний для каналу)
3. керування згадками (`requireMention`, `/activation`)

## Керування згадками (за замовчуванням)

Для групових повідомлень потрібна згадка, якщо це не перевизначено для конкретної групи. Значення за замовчуванням задаються для кожної підсистеми в `*.groups."*"`.

Відповідь на повідомлення бота вважається неявною згадкою, коли канал
підтримує метадані відповіді. Цитування повідомлення бота також може вважатися
неявною згадкою в каналах, які надають метадані цитати. Поточні вбудовані випадки включають
Telegram, WhatsApp, Slack, Discord, Microsoft Teams і ZaloUser.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Примітки:

- `mentionPatterns` — це безпечні regex-шаблони, нечутливі до регістру; некоректні шаблони та небезпечні форми з вкладеними повтореннями ігноруються.
- Поверхні, які надають явні згадки, все одно їх передають; шаблони — це резервний механізм.
- Перевизначення на рівні агента: `agents.list[].groupChat.mentionPatterns` (корисно, коли кілька агентів використовують одну групу).
- Керування згадками застосовується лише тоді, коли виявлення згадок можливе (налаштовані нативні згадки або `mentionPatterns`).
- Значення за замовчуванням для Discord містяться в `channels.discord.guilds."*"` (можна перевизначати для кожного guild/channel).
- Контекст історії груп рівномірно загортається в усіх каналах і є **лише pending** (повідомлення, пропущені через керування згадками); використовуйте `messages.groupChat.historyLimit` для глобального значення за замовчуванням і `channels.<channel>.historyLimit` (або `channels.<channel>.accounts.*.historyLimit`) для перевизначень. Встановіть `0`, щоб вимкнути.

## Обмеження інструментів для груп/каналів (необов’язково)

Деякі конфігурації каналів підтримують обмеження на те, які інструменти доступні **в межах конкретної групи/кімнати/каналу**.

- `tools`: дозволити/заборонити інструменти для всієї групи.
- `toolsBySender`: перевизначення для окремих відправників у межах групи.
  Використовуйте явні префікси ключів:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` і wildcard `"*"`.
  Старі ключі без префікса все ще приймаються та зіставляються лише як `id:`.

Порядок визначення (найбільш специфічний має пріоритет):

1. збіг `toolsBySender` для групи/каналу
2. `tools` для групи/каналу
3. збіг `toolsBySender` за замовчуванням (`"*"`)
4. `tools` за замовчуванням (`"*"`)

Приклад (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Примітки:

- Обмеження інструментів для груп/каналів застосовуються додатково до глобальної/агентської політики інструментів (заборона все одно має пріоритет).
- Деякі канали використовують іншу вкладеність для кімнат/каналів (наприклад, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlist-и груп

Коли налаштовано `channels.whatsapp.groups`, `channels.telegram.groups` або `channels.imessage.groups`, ключі діють як allowlist груп. Використовуйте `"*"` щоб дозволити всі групи, водночас задавши поведінку згадок за замовчуванням.

Поширена плутанина: схвалення парування DM — це не те саме, що авторизація груп.
Для каналів, які підтримують парування DM, сховище парування відкриває лише DM. Групові команди все одно потребують явної авторизації відправника групи з конфігураційних allowlist-ів, таких як `groupAllowFrom`, або задокументованого резервного варіанта конфігурації для цього каналу.

Типові наміри (скопіювати/вставити):

1. Вимкнути всі групові відповіді

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Дозволити лише конкретні групи (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Дозволити всі групи, але вимагати згадку (явно)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Лише власник може активувати відповіді в групах (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Активація (лише для власника)

Власники груп можуть перемикати активацію для кожної групи:

- `/activation mention`
- `/activation always`

Власник визначається через `channels.whatsapp.allowFrom` (або власний E.164 бота, якщо не задано). Надсилайте команду як окреме повідомлення. Інші поверхні наразі ігнорують `/activation`.

## Поля контексту

Вхідні payload-и груп встановлюють:

- `ChatType=group`
- `GroupSubject` (якщо відомо)
- `GroupMembers` (якщо відомо)
- `WasMentioned` (результат керування згадками)
- Теми форумів Telegram також містять `MessageThreadId` і `IsForum`.

Примітки для конкретних каналів:

- BlueBubbles може за бажанням збагачувати неназваних учасників груп macOS з локальної бази Contacts перед заповненням `GroupMembers`. Це вимкнено за замовчуванням і виконується лише після проходження звичайних перевірок груп.

Системний prompt агента містить вступ для групи на першому ході нової групової сесії. Він нагадує моделі відповідати як людині, уникати Markdown-таблиць, мінімізувати порожні рядки, дотримуватися звичайних інтервалів чату й не друкувати буквальні послідовності `\n`.

## Особливості iMessage

- Для маршрутизації або allowlist-ів надавайте перевагу `chat_id:<id>`.
- Переглянути чати: `imsg chats --limit 20`.
- Відповіді в групі завжди повертаються до того самого `chat_id`.

## Системні prompt-и WhatsApp

Див. [WhatsApp](/uk/channels/whatsapp#system-prompts) для канонічних правил системних prompt-ів WhatsApp, зокрема розв’язання prompt-ів для груп і прямих повідомлень, поведінки wildcard і семантики перевизначення облікового запису.

## Особливості WhatsApp

Див. [Групові повідомлення](/uk/channels/group-messages) для поведінки, специфічної лише для WhatsApp (впровадження історії, деталі обробки згадок).
