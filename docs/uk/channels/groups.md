---
read_when:
    - Зміна поведінки групового чату або обмеження за згадками
sidebarTitle: Groups
summary: Поведінка групового чату на різних платформах (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Групи
x-i18n:
    generated_at: "2026-04-29T19:06:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw однаково обробляє групові чати на всіх поверхнях: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Вступ для початківців (2 хвилини)

OpenClaw "живе" у ваших власних облікових записах месенджерів. Окремого користувача-бота WhatsApp немає. Якщо **ви** перебуваєте в групі, OpenClaw може бачити цю групу й відповідати в ній.

Типова поведінка:

- Групи обмежені (`groupPolicy: "allowlist"`).
- Відповіді потребують згадки, якщо ви явно не вимкнете шлюзування за згадкою.
- Звичайні фінальні відповіді в групах/каналах типово приватні. Видимий вивід у кімнату використовує інструмент `message`.

Пояснення: відправники з allowlist можуть запускати OpenClaw, згадуючи його.

<Note>
**Коротко**

- **Доступ до DM** керується `*.allowFrom`.
- **Доступ до груп** керується `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **Запуск відповіді** керується шлюзуванням за згадкою (`requireMention`, `/activation`).

</Note>

Швидкий потік (що відбувається з груповим повідомленням):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Видимі відповіді

Для групових/канальних кімнат OpenClaw типово використовує `messages.groupChat.visibleReplies: "message_tool"`.
Це означає, що агент усе одно обробляє хід і може оновлювати пам’ять/стан сесії, але його звичайна фінальна відповідь не публікується автоматично назад у кімнату. Щоб говорити видимо, агент використовує `message(action=send)`.

Для прямих чатів і будь-якого іншого вихідного ходу використовуйте `messages.visibleReplies: "message_tool"`, щоб застосувати таку саму поведінку видимої відповіді лише через інструмент глобально. `messages.groupChat.visibleReplies` залишається більш специфічним перевизначенням для групових/канальних кімнат.

Це замінює старий шаблон примушування моделі відповідати `NO_REPLY` для більшості ходів у режимі спостереження. У режимі лише через інструмент відсутність видимої дії просто означає, що інструмент повідомлень не викликається.

Індикатори набору все ще надсилаються, поки агент працює в режимі лише через інструмент. Типовий режим набору для груп оновлюється з "message" до "instant" для цих ходів, тому що звичайного тексту повідомлення асистента може ніколи не бути до того, як агент вирішить, чи викликати інструмент повідомлень. Явна конфігурація режиму набору все ще має пріоритет.

Щоб відновити застарілі автоматичні фінальні відповіді для групових/канальних кімнат:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Щоб вимагати, аби видимий вивід проходив через інструмент повідомлень для кожного вихідного чату:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Нативні slash-команди (Discord, Telegram та інші поверхні з підтримкою нативних команд) обходять `visibleReplies: "message_tool"` і завжди відповідають видимо, щоб нативний для каналу інтерфейс команд отримав очікувану відповідь. Це застосовується лише до перевірених нативних командних ходів; команди `/...`, набрані текстом, і звичайні ходи чату все ще дотримуються налаштованої типової поведінки групи.

## Видимість контексту та allowlist

У безпеці груп задіяні два різні елементи керування:

- **Авторизація запуску**: хто може запускати агента (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist, специфічні для каналу).
- **Видимість контексту**: який додатковий контекст вводиться в модель (текст відповіді, цитати, історія треду, переслані метадані).

Типово OpenClaw надає пріоритет звичайній поведінці чату й здебільшого зберігає контекст таким, яким його отримано. Це означає, що allowlist переважно вирішують, хто може запускати дії, а не є універсальною межею редагування для кожного цитованого чи історичного фрагмента.

<AccordionGroup>
  <Accordion title="Поточна поведінка залежить від каналу">
    - Деякі канали вже застосовують фільтрацію за відправником для додаткового контексту в конкретних шляхах (наприклад, початкове наповнення тредів Slack, пошуки відповідей/тредів Matrix).
    - Інші канали все ще передають контекст цитат/відповідей/пересилань таким, яким його отримано.

  </Accordion>
  <Accordion title="Напрям посилення захисту (заплановано)">
    - `contextVisibility: "all"` (типово) зберігає поточну поведінку "як отримано".
    - `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників з allowlist.
    - `contextVisibility: "allowlist_quote"` — це `allowlist` плюс один явний виняток для цитати/відповіді.

    Доки ця модель посилення захисту не буде реалізована послідовно в усіх каналах, очікуйте відмінностей між поверхнями.

  </Accordion>
</AccordionGroup>

![Потік групових повідомлень](/images/groups-flow.svg)

Якщо ви хочете...

| Мета                                         | Що налаштувати                                            |
| -------------------------------------------- | ---------------------------------------------------------- |
| Дозволити всі групи, але відповідати лише на @згадки | `groups: { "*": { requireMention: true } }`                |
| Вимкнути всі групові відповіді               | `groupPolicy: "disabled"`                                  |
| Лише конкретні групи                         | `groups: { "<group-id>": { ... } }` (без ключа `"*"`)      |
| Лише ви можете запускати в групах            | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Ключі сесій

- Групові сесії використовують ключі сесій `agent:<agentId>:<channel>:group:<id>` (кімнати/канали використовують `agent:<agentId>:<channel>:channel:<id>`).
- Теми форумів Telegram додають `:topic:<threadId>` до ідентифікатора групи, щоб кожна тема мала власну сесію.
- Прямі чати використовують основну сесію (або окрему для кожного відправника, якщо налаштовано).
- Heartbeats пропускаються для групових сесій.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Шаблон: особисті DM + публічні групи (один агент)

Так — це добре працює, якщо ваш "особистий" трафік — це **DM**, а ваш "публічний" трафік — це **групи**.

Чому: у режимі одного агента DM зазвичай потрапляють в **основний** ключ сесії (`agent:main:main`), тоді як групи завжди використовують **неосновні** ключі сесій (`agent:main:<channel>:group:<id>`). Якщо ви вмикаєте sandboxing з `mode: "non-main"`, ці групові сесії запускаються в налаштованому sandbox-бекенді, тоді як ваша основна DM-сесія залишається на хості. Docker є типовим бекендом, якщо ви не виберете інший.

Це дає вам один "мозок" агента (спільний робочий простір + пам’ять), але дві позиції виконання:

- **DM**: повні інструменти (хост)
- **Групи**: sandbox + обмежені інструменти

<Note>
Якщо вам потрібні справді окремі робочі простори/персони ("особисте" і "публічне" ніколи не мають змішуватися), використовуйте другого агента + прив’язки. Див. [Маршрутизація між кількома агентами](/uk/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM на хості, групи в sandbox">
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
  </Tab>
  <Tab title="Групи бачать лише папку з allowlist">
    Хочете "групи можуть бачити лише папку X" замість "немає доступу до хоста"? Залиште `workspaceAccess: "none"` і монтуйте в sandbox лише шляхи з allowlist:

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

  </Tab>
</Tabs>

Пов’язано:

- Ключі конфігурації та типові значення: [Конфігурація Gateway](/uk/gateway/config-agents#agentsdefaultssandbox)
- Налагодження, чому інструмент заблоковано: [Sandbox проти політики інструментів проти підвищених прав](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)
- Докладно про bind mounts: [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts)

## Мітки відображення

- Мітки UI використовують `displayName`, коли доступно, у форматі `<channel>:<token>`.
- `#room` зарезервовано для кімнат/каналів; групові чати використовують `g-<slug>` (нижній регістр, пробіли -> `-`, зберігати `#@+._-`).

## Політика груп

Керуйте тим, як групові/кімнатні повідомлення обробляються для кожного каналу:

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

| Політика      | Поведінка                                                   |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Групи обходять allowlist; шлюзування за згадкою все ще застосовується. |
| `"disabled"`  | Повністю блокувати всі групові повідомлення.                 |
| `"allowlist"` | Дозволяти лише групи/кімнати, які відповідають налаштованому allowlist. |

<AccordionGroup>
  <Accordion title="Примітки для кожного каналу">
    - `groupPolicy` окремий від шлюзування за згадкою (яке вимагає @згадок).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: використовуйте `groupAllowFrom` (fallback: явний `allowFrom`).
    - Схвалення поєднання DM (записи сховища `*-allowFrom`) застосовуються лише до доступу DM; авторизація відправника в групі залишається явно прив’язаною до групових allowlist.
    - Discord: allowlist використовує `channels.discord.guilds.<id>.channels`.
    - Slack: allowlist використовує `channels.slack.channels`.
    - Matrix: allowlist використовує `channels.matrix.groups`. Надавайте перевагу ідентифікаторам кімнат або псевдонімам; пошук назви приєднаної кімнати виконується за найкращою спробою, а нерозв’язані назви ігноруються під час виконання. Використовуйте `channels.matrix.groupAllowFrom`, щоб обмежити відправників; allowlist `users` для окремих кімнат також підтримуються.
    - Групові DM керуються окремо (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Allowlist Telegram може зіставляти ідентифікатори користувачів (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) або імена користувачів (`"@alice"` чи `"alice"`); префікси не чутливі до регістру.
    - Типово `groupPolicy: "allowlist"`; якщо ваш груповий allowlist порожній, групові повідомлення блокуються.
    - Безпека під час виконання: коли блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп повертається до режиму fail-closed (зазвичай `allowlist`) замість успадкування `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Коротка ментальна модель (порядок оцінювання групових повідомлень):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlist груп">
    Allowlist груп (`*.groups`, `*.groupAllowFrom`, allowlist, специфічний для каналу).
  </Step>
  <Step title="Шлюзування за згадкою">
    Шлюзування за згадкою (`requireMention`, `/activation`).
  </Step>
</Steps>

## Шлюзування за згадкою (типово)

Групові повідомлення потребують згадки, якщо це не перевизначено для окремої групи. Типові значення зберігаються для кожної підсистеми в `*.groups."*"`.

Відповідь на повідомлення бота вважається неявною згадкою, коли канал підтримує метадані відповіді. Цитування повідомлення бота також може вважатися неявною згадкою в каналах, які надають метадані цитати. Поточні вбудовані випадки включають Telegram, WhatsApp, Slack, Discord, Microsoft Teams і ZaloUser.

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

<AccordionGroup>
  <Accordion title="Нотатки щодо шлюзу згадок">
    - `mentionPatterns` — це безпечні regex-шаблони без урахування регістру; недійсні шаблони та небезпечні форми з вкладеним повторенням ігноруються.
    - Поверхні, які надають явні згадки, усе одно проходять; шаблони є резервним варіантом.
    - Перевизначення для окремого агента: `agents.list[].groupChat.mentionPatterns` (корисно, коли кілька агентів спільно використовують групу).
    - Шлюз згадок застосовується лише тоді, коли виявлення згадок можливе (налаштовано нативні згадки або `mentionPatterns`).
    - Контекст промпта групового чату переносить розв’язану інструкцію тихої відповіді в кожному ході; файли робочої області не мають дублювати механіку `NO_REPLY`.
    - Групи, де дозволені тихі відповіді, трактують чисті порожні або лише reasoning-ходи моделі як тихі, еквівалентні `NO_REPLY`. Прямі чати роблять те саме лише тоді, коли прямі тихі відповіді явно дозволені; інакше порожні відповіді залишаються невдалими ходами агента.
    - Типові значення Discord містяться в `channels.discord.guilds."*"` (можна перевизначити для окремої гільдії/каналу).
    - Контекст історії групи обгортається однаково для всіх каналів і є **лише pending** (повідомлення, пропущені через шлюз згадок); використовуйте `messages.groupChat.historyLimit` для глобального типового значення та `channels.<channel>.historyLimit` (або `channels.<channel>.accounts.*.historyLimit`) для перевизначень. Установіть `0`, щоб вимкнути.

  </Accordion>
</AccordionGroup>

## Обмеження інструментів для групи/каналу (необов’язково)

Деякі конфігурації каналів підтримують обмеження того, які інструменти доступні **всередині конкретної групи/кімнати/каналу**.

- `tools`: дозволити/заборонити інструменти для всієї групи.
- `toolsBySender`: перевизначення за відправником у межах групи. Використовуйте явні префікси ключів: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` і wildcard `"*"`. Застарілі ключі без префікса все ще приймаються й зіставляються лише як `id:`.

Порядок розв’язання (найконкретніше перемагає):

<Steps>
  <Step title="Group toolsBySender">
    Збіг `toolsBySender` групи/каналу.
  </Step>
  <Step title="Group tools">
    `tools` групи/каналу.
  </Step>
  <Step title="Default toolsBySender">
    Збіг типового (`"*"`) `toolsBySender`.
  </Step>
  <Step title="Default tools">
    Типові (`"*"`) `tools`.
  </Step>
</Steps>

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

<Note>
Обмеження інструментів для групи/каналу застосовуються на додачу до глобальної політики інструментів або політики інструментів агента (заборона все одно перемагає). Деякі канали використовують інше вкладення для кімнат/каналів (наприклад, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Списки дозволених груп

Коли налаштовано `channels.whatsapp.groups`, `channels.telegram.groups` або `channels.imessage.groups`, ключі діють як список дозволених груп. Використовуйте `"*"`, щоб дозволити всі групи, водночас установивши типову поведінку згадок.

<Warning>
Поширена плутанина: схвалення спарювання DM — це не те саме, що авторизація групи. Для каналів, які підтримують спарювання DM, сховище спарювань розблоковує лише DM. Групові команди все ще потребують явної авторизації відправника групи з конфігураційних списків дозволених, таких як `groupAllowFrom`, або задокументованого резервного варіанта конфігурації для цього каналу.
</Warning>

Поширені наміри (копіюйте/вставляйте):

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
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
  </Tab>
  <Tab title="Allow all groups but require mention">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Owner-only triggers (WhatsApp)">
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
  </Tab>
</Tabs>

## Активація (лише власник)

Власники груп можуть перемикати активацію для окремої групи:

- `/activation mention`
- `/activation always`

Власник визначається за `channels.whatsapp.allowFrom` (або власним E.164 бота, якщо не задано). Надішліть команду як окреме повідомлення. Інші поверхні наразі ігнорують `/activation`.

## Поля контексту

Вхідні payload-и групи задають:

- `ChatType=group`
- `GroupSubject` (якщо відомо)
- `GroupMembers` (якщо відомо)
- `WasMentioned` (результат шлюзу згадок)
- Теми форуму Telegram також включають `MessageThreadId` і `IsForum`.

Нотатки для окремих каналів:

- BlueBubbles може необов’язково збагачувати безіменних учасників групи macOS з локальної бази даних Contacts перед заповненням `GroupMembers`. Це вимкнено за замовчуванням і запускається лише після проходження звичайного групового шлюзу.

Системний промпт агента включає вступ для групи на першому ході нової групової сесії. Він нагадує моделі відповідати як людина, уникати Markdown-таблиць, мінімізувати порожні рядки й дотримуватися звичайних інтервалів чату, а також не вводити буквальні послідовності `\n`. Назви груп і мітки учасників із каналів відображаються як огороджені ненадійні метадані, а не як вбудовані системні інструкції.

## Особливості iMessage

- Надавайте перевагу `chat_id:<id>` під час маршрутизації або внесення до списку дозволених.
- Перелічити чати: `imsg chats --limit 20`.
- Відповіді групи завжди повертаються до того самого `chat_id`.

## Системні промпти WhatsApp

Див. [WhatsApp](/uk/channels/whatsapp#system-prompts) щодо канонічних правил системних промптів WhatsApp, включно з розв’язанням групових і прямих промптів, поведінкою wildcard та семантикою перевизначення облікового запису.

## Особливості WhatsApp

Див. [Групові повідомлення](/uk/channels/group-messages) щодо поведінки, специфічної лише для WhatsApp (вставлення історії, подробиці обробки згадок).

## Пов’язане

- [Групи трансляції](/uk/channels/broadcast-groups)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Групові повідомлення](/uk/channels/group-messages)
- [Спарювання](/uk/channels/pairing)
