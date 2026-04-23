---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Маршрутизація кількох агентів: ізольовані агенти, облікові записи каналів і bindings'
title: Маршрутизація кількох агентів
x-i18n:
    generated_at: "2026-04-23T20:50:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2970892331b8b6930309201c7054b1c06c76adc6c34924c5f455df9c8c1bd5f
    source_path: concepts/multi-agent.md
    workflow: 15
---

Мета: кілька _ізольованих_ агентів (окремі workspace + `agentDir` + сесії), а також кілька облікових записів каналів (наприклад, два WhatsApp) в одному запущеному Gateway. Вхідний трафік маршрутизується до агента через bindings.

## Що таке «один агент»?

**Агент** — це повністю окреслений «мозок» із власними:

- **Workspace** (файли, AGENTS.md/SOUL.md/USER.md, локальні нотатки, правила персони).
- **Каталогом стану** (`agentDir`) для auth profiles, реєстру моделей і конфігурації для конкретного агента.
- **Сховищем сесій** (історія чатів + стан маршрутизації) у `~/.openclaw/agents/<agentId>/sessions`.

Auth profiles є **персональними для кожного агента**. Кожен агент читає зі свого:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

` sessions_history` тут також є безпечнішим шляхом recall між сесіями: він повертає
обмежене, санітизоване подання, а не необроблений дамп транскрипту. Recall assistant
прибирає thinking tags, каркас `<relevant-memories>`, plain-text XML payload
викликів інструментів (включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів),
понижений каркас викликів інструментів, витеклі ASCII/full-width токени
керування моделлю та некоректний XML викликів інструментів MiniMax до редагування/обрізання.

Облікові дані основного агента **не** передаються автоматично. Ніколи не використовуйте один `agentDir`
для кількох агентів (це спричиняє колізії автентифікації/сесій). Якщо ви хочете поділитися credentials,
скопіюйте `auth-profiles.json` до `agentDir` іншого агента.

Skills завантажуються з workspace кожного агента, а також зі спільних коренів, таких як
`~/.openclaw/skills`, а потім фільтруються за ефективним allowlist Skills агента, якщо
його налаштовано. Використовуйте `agents.defaults.skills` для спільної базової лінії та
`agents.list[].skills` для заміни на рівні конкретного агента. Див.
[Skills: per-agent vs shared](/uk/tools/skills#per-agent-vs-shared-skills) і
[Skills: agent skill allowlists](/uk/tools/skills#agent-skill-allowlists).

Gateway може містити **одного агента** (типово) або **багато агентів** паралельно.

**Примітка щодо workspace:** workspace кожного агента є **типовим cwd**, а не жорсткою
пісочницею. Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть
досягати інших місць на host, якщо пісочницю не ввімкнено. Див.
[Пісочниця](/uk/gateway/sandboxing).

## Шляхи (швидка карта)

- Config: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог стану: `~/.openclaw` (або `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (або `~/.openclaw/workspace-<agentId>`)
- Каталог агента: `~/.openclaw/agents/<agentId>/agent` (або `agents.list[].agentDir`)
- Сесії: `~/.openclaw/agents/<agentId>/sessions`

### Режим одного агента (типово)

Якщо нічого не робити, OpenClaw запускає одного агента:

- `agentId` типово має значення **`main`**.
- Сесії мають ключі виду `agent:main:<mainKey>`.
- Workspace типово має значення `~/.openclaw/workspace` (або `~/.openclaw/workspace-<profile>`, коли задано `OPENCLAW_PROFILE`).
- Стан типово має значення `~/.openclaw/agents/main/agent`.

## Допоміжний засіб для агентів

Скористайтеся майстром агентів, щоб додати нового ізольованого агента:

```bash
openclaw agents add work
```

Потім додайте `bindings` (або дозвольте це зробити майстру), щоб маршрутизувати вхідні повідомлення.

Перевірити можна так:

```bash
openclaw agents list --bindings
```

## Швидкий старт

<Steps>
  <Step title="Створіть workspace для кожного агента">

Використайте майстер або створіть workspace вручну:

```bash
openclaw agents add coding
openclaw agents add social
```

Кожен агент отримує власний workspace із `SOUL.md`, `AGENTS.md` і необов’язковим `USER.md`, а також окремий `agentDir` і сховище сесій у `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Створіть облікові записи каналів">

Створіть по одному обліковому запису на агента у вибраних вами каналах:

- Discord: один бот на агента, увімкніть Message Content Intent, скопіюйте кожен токен.
- Telegram: один бот на агента через BotFather, скопіюйте кожен токен.
- WhatsApp: прив’яжіть кожен номер телефону як окремий обліковий запис.

```bash
openclaw channels login --channel whatsapp --account work
```

Див. довідники каналів: [Discord](/uk/channels/discord), [Telegram](/uk/channels/telegram), [WhatsApp](/uk/channels/whatsapp).

  </Step>

  <Step title="Додайте агентів, облікові записи та bindings">

Додайте агентів у `agents.list`, облікові записи каналів у `channels.<channel>.accounts`, а потім з’єднайте їх через `bindings` (приклади нижче).

  </Step>

  <Step title="Перезапустіть і перевірте">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Кілька агентів = кілька людей, кілька персон

За наявності **кількох агентів** кожен `agentId` стає **повністю ізольованою персоною**:

- **Різні телефонні номери/облікові записи** (через `accountId` для кожного каналу).
- **Різні особистості** (через файли workspace конкретного агента, такі як `AGENTS.md` і `SOUL.md`).
- **Окрема автентифікація + сесії** (без взаємного змішування, якщо це явно не ввімкнено).

Це дає змогу **кільком людям** спільно використовувати один сервер Gateway, зберігаючи ізоляцію їхніх AI-«мозків» і даних.

## Пошук QMD memory між агентами

Якщо одному агенту потрібно шукати в транскриптах сесій QMD іншого агента, додайте
додаткові колекції в `agents.list[].memorySearch.qmd.extraCollections`.
Використовуйте `agents.defaults.memorySearch.qmd.extraCollections` лише тоді, коли кожен агент
має успадковувати ті самі спільні колекції транскриптів.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Шлях додаткової колекції може бути спільним для кількох агентів, але назва колекції
лишається явною, коли шлях розташований поза workspace агента. Шляхи всередині
workspace залишаються прив’язаними до агента, тож кожен агент зберігає власний набір пошуку транскриптів.

## Один номер WhatsApp, кілька людей (розділення DM)

Ви можете маршрутизувати **різні DM WhatsApp** до різних агентів, залишаючись у межах **одного облікового запису WhatsApp**. Використовуйте зіставлення за E.164 відправника (наприклад, `+15551234567`) із `peer.kind: "direct"`. Відповіді все одно надходитимуть з того самого номера WhatsApp (без окремої ідентичності відправника для кожного агента).

Важлива деталь: прямі чати згортаються до **основного ключа сесії** агента, тож справжня ізоляція вимагає **одного агента на людину**.

Приклад:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Примітки:

- Керування доступом до DM є **глобальним для облікового запису WhatsApp** (pairing/allowlist), а не окремим для агента.
- Для спільних груп прив’яжіть групу до одного агента або використовуйте [Групи трансляції](/uk/channels/broadcast-groups).

## Правила маршрутизації (як повідомлення вибирають агента)

Bindings є **детермінованими**, і **найспецифічніший збіг має пріоритет**:

1. збіг `peer` (точний id DM/групи/каналу)
2. збіг `parentPeer` (успадкування треду)
3. `guildId + roles` (маршрутизація за ролями Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. збіг `accountId` для каналу
7. збіг на рівні каналу (`accountId: "*"`)
8. резервний перехід до типового агента (`agents.list[].default`, інакше перший запис у списку, типово: `main`)

Якщо в одному рівні збігається кілька bindings, перемагає перший у порядку конфігурації.
Якщо binding задає кілька полів зіставлення (наприклад, `peer` + `guildId`), усі вказані поля є обов’язковими (семантика `AND`).

Важлива деталь області облікового запису:

- Binding без `accountId` зіставляється лише з типовим обліковим записом.
- Використовуйте `accountId: "*"` для резервного варіанта на рівні каналу для всіх облікових записів.
- Якщо пізніше ви додасте такий самий binding для того самого агента з явним id облікового запису, OpenClaw оновить наявний binding лише на рівні каналу до області конкретного облікового запису замість дублювання.

## Кілька облікових записів / номерів телефонів

Канали, які підтримують **кілька облікових записів** (наприклад, WhatsApp), використовують `accountId` для ідентифікації
кожного входу. Кожен `accountId` можна маршрутизувати до іншого агента, тож один сервер може обслуговувати
кілька номерів телефонів без змішування сесій.

Якщо вам потрібен типовий обліковий запис на рівні каналу, коли `accountId` пропущено, задайте
`channels.<channel>.defaultAccount` (необов’язково). Якщо його не задано, OpenClaw повертається
до `default`, якщо він є, інакше до першого налаштованого id облікового запису (відсортованого).

Поширені канали, які підтримують цей шаблон:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Поняття

- `agentId`: один «мозок» (workspace, автентифікація для конкретного агента, сховище сесій для конкретного агента).
- `accountId`: один екземпляр облікового запису каналу (наприклад, обліковий запис WhatsApp `"personal"` проти `"biz"`).
- `binding`: маршрутизує вхідні повідомлення до `agentId` за `(channel, accountId, peer)` і, за потреби, також за id guild/team.
- Прямі чати згортаються до `agent:<agentId>:<mainKey>` (основна сесія для конкретного агента; `session.mainKey`).

## Приклади платформ

### Боти Discord для кожного агента

Кожен обліковий запис бота Discord зіставляється з унікальним `accountId`. Прив’яжіть кожен обліковий запис до агента та підтримуйте allowlist окремо для кожного бота.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Примітки:

- Запросіть кожного бота до guild і ввімкніть Message Content Intent.
- Токени зберігаються в `channels.discord.accounts.<id>.token` (типовий обліковий запис може використовувати `DISCORD_BOT_TOKEN`).

### Боти Telegram для кожного агента

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Примітки:

- Створіть по одному боту на агента через BotFather і скопіюйте кожен токен.
- Токени зберігаються в `channels.telegram.accounts.<id>.botToken` (типовий обліковий запис може використовувати `TELEGRAM_BOT_TOKEN`).

### Номери WhatsApp для кожного агента

Прив’яжіть кожен обліковий запис перед запуском gateway:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministic routing: first match wins (most-specific first).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Optional per-peer override (example: send a specific group to work agent).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Приклад: щоденний чат у WhatsApp + глибока робота в Telegram

Розділення за каналом: маршрутизуйте WhatsApp до швидкого повсякденного агента, а Telegram — до агента Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Примітки:

- Якщо у вас кілька облікових записів для каналу, додайте `accountId` до binding (наприклад, `{ channel: "whatsapp", accountId: "personal" }`).
- Щоб маршрутизувати один DM/групу до Opus, залишивши все інше на chat, додайте binding `match.peer` для цього peer; зіставлення peer завжди мають пріоритет над правилами для всього каналу.

## Приклад: той самий канал, один peer до Opus

Залиште WhatsApp на швидкому агенті, але маршрутизуйте один DM до Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Bindings peer завжди мають пріоритет, тож розміщуйте їх вище за правило для всього каналу.

## Сімейний агент, прив’язаний до групи WhatsApp

Прив’яжіть окремого сімейного агента до однієї групи WhatsApp із керуванням згадками
та жорсткішою політикою інструментів:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Примітки:

- Списки allow/deny інструментів — це саме **інструменти**, а не Skills. Якщо Skill має запускати
  бінарний файл, переконайтеся, що `exec` дозволено і бінарник існує в пісочниці.
- Для суворішого керування задайте `agents.list[].groupChat.mentionPatterns` і залиште
  ввімкненими group allowlist для каналу.

## Конфігурація пісочниці та інструментів для кожного агента

Кожен агент може мати власну пісочницю та обмеження інструментів:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

Примітка: `setupCommand` розташовується в `sandbox.docker` і запускається один раз під час створення контейнера.
Перевизначення `sandbox.docker.*` для конкретного агента ігноруються, коли розв’язана область має значення `"shared"`.

**Переваги:**

- **Ізоляція безпеки**: обмеження інструментів для недовірених агентів
- **Контроль ресурсів**: пісочниця для окремих агентів із збереженням роботи інших на host
- **Гнучкі політики**: різні дозволи для різних агентів

Примітка: `tools.elevated` є **глобальним** і залежить від відправника; його не можна налаштувати для кожного агента окремо.
Якщо вам потрібні межі для конкретного агента, використовуйте `agents.list[].tools`, щоб заборонити `exec`.
Для націлювання на групи використовуйте `agents.list[].groupChat.mentionPatterns`, щоб @згадки однозначно зіставлялися з потрібним агентом.

Докладні приклади див. у [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools).

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — як повідомлення маршрутизуються до агентів
- [Підагенти](/uk/tools/subagents) — запуск фонових прогонів агентів
- [Агенти ACP](/uk/tools/acp-agents) — запуск зовнішніх harness кодування
- [Presence](/uk/concepts/presence) — presence і доступність агентів
- [Session](/uk/concepts/session) — ізоляція сесій і маршрутизація
