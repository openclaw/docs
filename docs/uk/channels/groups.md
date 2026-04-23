---
read_when:
    - Зміна поведінки групового чату або керування згадками
summary: Поведінка групового чату на різних поверхнях (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Групи
x-i18n:
    generated_at: "2026-04-23T20:43:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: b81d467de4662c1551795013b34e03301f81569cdc5e51e20b17e35723559a99
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw узгоджено обробляє групові чати на різних поверхнях: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Вступ для початківців (2 хвилини)

OpenClaw «живе» у ваших власних облікових записах месенджерів. Окремого користувача-бота WhatsApp немає.
Якщо **ви** перебуваєте в групі, OpenClaw може бачити цю групу й відповідати там.

Поведінка за замовчуванням:

- Групи обмежені (`groupPolicy: "allowlist"`).
- Для відповідей потрібна згадка, якщо ви явно не вимкнете керування згадками.

Простіше кажучи: відправники з allowlist можуть активувати OpenClaw, згадавши його.

> Коротко
>
> - **Доступ до DM** контролюється через `*.allowFrom`.
> - **Доступ до груп** контролюється через `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
> - **Запуск відповіді** контролюється через керування згадками (`requireMention`, `/activation`).

Швидкий сценарій (що відбувається з повідомленням у групі):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Видимість контексту й allowlist

У безпеці груп беруть участь два різні механізми:

- **Авторизація запуску**: хто може активувати агента (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist для конкретного каналу).
- **Видимість контексту**: який додатковий контекст передається в модель (текст відповіді, цитати, історія треду, метадані пересилання).

За замовчуванням OpenClaw надає пріоритет звичайній поведінці чату й переважно зберігає контекст у тому вигляді, у якому його отримано. Це означає, що allowlist насамперед визначають, хто може запускати дії, а не є універсальною межею редагування для кожного процитованого чи історичного фрагмента.

Поточна поведінка залежить від каналу:

- Деякі канали вже застосовують фільтрацію за відправником для додаткового контексту в окремих шляхах (наприклад, ініціалізація треду Slack, пошук відповідей/тредів у Matrix).
- Інші канали досі передають контекст цитат/відповідей/пересилань у тому вигляді, у якому його отримано.

Напрям посилення безпеки (заплановано):

- `contextVisibility: "all"` (типово) зберігає поточну поведінку «як отримано».
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників з allowlist.
- `contextVisibility: "allowlist_quote"` — це `allowlist` плюс один явний виняток для цитати/відповіді.

Поки цю модель посилення безпеки не буде реалізовано узгоджено в усіх каналах, очікуйте відмінностей залежно від поверхні.

![Потік повідомлень у групі](/images/groups-flow.svg)

Якщо ви хочете...

| Ціль                                         | Що налаштувати                                            |
| -------------------------------------------- | --------------------------------------------------------- |
| Дозволити всі групи, але відповідати лише на @згадки | `groups: { "*": { requireMention: true } }`               |
| Вимкнути всі відповіді в групах              | `groupPolicy: "disabled"`                                 |
| Лише певні групи                             | `groups: { "<group-id>": { ... } }` (без ключа `"*"`)     |
| Щоб лише ви могли активувати в групах        | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Ключі сесій

- Групові сесії використовують ключі сесій `agent:<agentId>:<channel>:group:<id>` (кімнати/канали використовують `agent:<agentId>:<channel>:channel:<id>`).
- Теми форумів Telegram додають `:topic:<threadId>` до ідентифікатора групи, тому кожна тема має власну сесію.
- Прямі чати використовують основну сесію (або окрему для кожного відправника, якщо це налаштовано).
- Heartbeat пропускаються для групових сесій.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Шаблон: особисті DM + публічні групи (один агент)

Так — це добре працює, якщо ваш «особистий» трафік — це **DM**, а «публічний» трафік — це **групи**.

Чому: у режимі одного агента DM зазвичай потрапляють до **основного** ключа сесії (`agent:main:main`), тоді як групи завжди використовують **неосновні** ключі сесій (`agent:main:<channel>:group:<id>`). Якщо ви ввімкнете ізоляцію через `mode: "non-main"`, ці групові сесії виконуватимуться в налаштованому backend пісочниці, тоді як ваша основна DM-сесія залишиться на хості. Docker є backend за замовчуванням, якщо ви не виберете інший.

Це дає вам один «мозок» агента (спільний workspace + пам’ять), але дві моделі виконання:

- **DM**: повні інструменти (host)
- **Групи**: пісочниця + обмежені інструменти

> Якщо вам потрібні справді окремі workspace/персони («особисте» і «публічне» ніколи не мають змішуватися), використовуйте другого агента + bindings. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent).

Приклад (DM на host, групи в пісочниці + лише інструменти для повідомлень):

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

Хочете, щоб «групи могли бачити лише папку X» замість «без доступу до host»? Залиште `workspaceAccess: "none"` і змонтуйте в пісочницю лише шляхи з allowlist:

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

Пов’язане:

- Ключі конфігурації та значення за замовчуванням: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- Налагодження причин, чому інструмент заблоковано: [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)
- Докладніше про bind mounts: [Пісочниця](/uk/gateway/sandboxing#custom-bind-mounts)

## Мітки відображення

- Мітки в UI використовують `displayName`, коли він доступний, у форматі `<channel>:<token>`.
- `#room` зарезервовано для кімнат/каналів; групові чати використовують `g-<slug>` (нижній регістр, пробіли -> `-`, зберігати `#@+._-`).

## Політика груп

Керуйте тим, як обробляються повідомлення груп/кімнат для кожного каналу:

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

| Політика     | Поведінка                                                    |
| ------------ | ------------------------------------------------------------ |
| `"open"`     | Групи оминають allowlist; керування згадками все одно застосовується. |
| `"disabled"` | Повністю блокувати всі групові повідомлення.                 |
| `"allowlist"` | Дозволяти лише групи/кімнати, що відповідають налаштованому allowlist. |

Примітки:

- `groupPolicy` відокремлено від керування згадками (яке вимагає @згадок).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: використовуйте `groupAllowFrom` (резервний варіант: явний `allowFrom`).
- Схвалення прив’язки DM (записи сховища `*-allowFrom`) застосовуються лише до доступу DM; авторизація відправників у групах лишається явно керованою через group allowlist.
- Discord: allowlist використовує `channels.discord.guilds.<id>.channels`.
- Slack: allowlist використовує `channels.slack.channels`.
- Matrix: allowlist використовує `channels.matrix.groups`. Віддавайте перевагу ідентифікаторам кімнат або псевдонімам; пошук за назвою приєднаної кімнати виконується за принципом best-effort, а невизначені назви ігноруються під час виконання. Використовуйте `channels.matrix.groupAllowFrom`, щоб обмежити відправників; також підтримуються allowlist `users` для окремих кімнат.
- Групові DM керуються окремо (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram allowlist може відповідати ідентифікаторам користувачів (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) або іменам користувачів (`"@alice"` або `"alice"`); префікси нечутливі до регістру.
- Значення за замовчуванням — `groupPolicy: "allowlist"`; якщо ваш group allowlist порожній, групові повідомлення блокуються.
- Безпека під час виконання: коли блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп переходить у fail-closed режим (зазвичай `allowlist`) замість успадкування `channels.defaults.groupPolicy`.

Швидка ментальна модель (порядок оцінювання для групових повідомлень):

1. `groupPolicy` (open/disabled/allowlist)
2. group allowlist (`*.groups`, `*.groupAllowFrom`, allowlist для конкретного каналу)
3. керування згадками (`requireMention`, `/activation`)

## Керування згадками (типово)

Групові повідомлення потребують згадки, якщо це не перевизначено для конкретної групи. Значення за замовчуванням зберігаються для кожної підсистеми в `*.groups."*"`.

Відповідь на повідомлення бота вважається неявною згадкою, якщо канал
підтримує метадані відповіді. Цитування повідомлення бота також може вважатися неявною
згадкою на каналах, які надають метадані цитати. Поточні вбудовані випадки включають
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

- `mentionPatterns` — це безпечні шаблони regex, нечутливі до регістру; недійсні шаблони та небезпечні форми з вкладеним повторенням ігноруються.
- Поверхні, які надають явні згадки, усе одно їх передають; шаблони — це резервний варіант.
- Перевизначення для конкретного агента: `agents.list[].groupChat.mentionPatterns` (корисно, коли кілька агентів спільно використовують одну групу).
- Керування згадками застосовується лише тоді, коли виявлення згадок можливе (налаштовано нативні згадки або `mentionPatterns`).
- Значення за замовчуванням для Discord зберігаються в `channels.discord.guilds."*"` (можна перевизначити для кожного guild/channel).
- Контекст історії груп обгортається однаково для всіх каналів і є **лише pending** (повідомлення, пропущені через керування згадками); використовуйте `messages.groupChat.historyLimit` для глобального значення за замовчуванням і `channels.<channel>.historyLimit` (або `channels.<channel>.accounts.*.historyLimit`) для перевизначень. Встановіть `0`, щоб вимкнути.

## Обмеження інструментів для груп/каналів (необов’язково)

Деякі конфігурації каналів підтримують обмеження того, які інструменти доступні **всередині конкретної групи/кімнати/каналу**.

- `tools`: дозволити/заборонити інструменти для всієї групи.
- `toolsBySender`: перевизначення для конкретних відправників у межах групи.
  Використовуйте явні префікси ключів:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` і wildcard `"*"`.
  Старі ключі без префікса все ще приймаються і зіставляються лише як `id:`.

Порядок розв’язання (найспецифічніше має пріоритет):

1. збіг `toolsBySender` для групи/каналу
2. `tools` для групи/каналу
3. збіг `toolsBySender` за замовчуванням (`"*"` )
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

## Group allowlist

Коли налаштовано `channels.whatsapp.groups`, `channels.telegram.groups` або `channels.imessage.groups`, ключі діють як group allowlist. Використовуйте `"*"`, щоб дозволити всі групи, але при цьому все одно налаштувати типову поведінку згадок.

Поширена плутанина: схвалення прив’язки DM — це не те саме, що авторизація групи.
Для каналів, які підтримують прив’язку DM, сховище прив’язки відкриває лише DM. Команди в групах усе одно вимагають явної авторизації відправника групи через конфігураційні allowlist, такі як `groupAllowFrom`, або документований резервний варіант конфігурації для цього каналу.

Поширені наміри (копіювати/вставити):

1. Вимкнути всі відповіді в групах

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Дозволити лише певні групи (WhatsApp)

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

4. Лише власник може активувати в групах (WhatsApp)

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

Власник визначається через `channels.whatsapp.allowFrom` (або через E.164 самого бота, якщо не задано). Надсилайте команду як окреме повідомлення. Інші поверхні наразі ігнорують `/activation`.

## Поля контексту

Вхідні payload груп встановлюють:

- `ChatType=group`
- `GroupSubject` (якщо відомо)
- `GroupMembers` (якщо відомо)
- `WasMentioned` (результат керування згадками)
- Теми форумів Telegram також включають `MessageThreadId` і `IsForum`.

Примітки для конкретних каналів:

- BlueBubbles за бажанням може збагачувати учасників без імен у групах macOS із локальної бази даних Contacts перед заповненням `GroupMembers`. Це вимкнено за замовчуванням і виконується лише після проходження звичайного керування групами.

Системний prompt агента включає вступ для групи на першому ході нової групової сесії. Він нагадує моделі відповідати як людина, уникати таблиць Markdown, мінімізувати порожні рядки й дотримуватися звичайних інтервалів чату, а також не вводити буквальні послідовності `\n`. Назви груп і мітки учасників, що надходять із каналу, відображаються як огороджені недовірені метадані, а не як вбудовані системні інструкції.

## Особливості iMessage

- Для маршрутизації або allowlist надавайте перевагу `chat_id:<id>`.
- Перелік чатів: `imsg chats --limit 20`.
- Відповіді в групах завжди повертаються до того самого `chat_id`.

## Системні prompt для WhatsApp

Див. [WhatsApp](/uk/channels/whatsapp#system-prompts) для канонічних правил системних prompt WhatsApp, зокрема розв’язання групових і прямих prompt, поведінки wildcard і семантики перевизначення облікового запису.

## Особливості WhatsApp

Див. [Групові повідомлення](/uk/channels/group-messages) для поведінки лише WhatsApp (ін’єкція історії, подробиці обробки згадок).
