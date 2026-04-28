---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Багатоагентна маршрутизація: ізольовані агенти, облікові записи каналів і прив’язки'
title: Багатоагентна маршрутизація
x-i18n:
    generated_at: "2026-04-26T11:00:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

Запускайте кількох _ізольованих_ агентів — кожного з власним робочим простором, каталогом стану (`agentDir`) та історією сеансів — а також кілька облікових записів каналів (наприклад, два WhatsApp) в одному запущеному Gateway. Вхідні повідомлення маршрутизуються до потрібного агента через прив’язки.

Тут **агент** — це повна область для окремої персони: файли робочого простору, профілі автентифікації, реєстр моделей і сховище сеансів. `agentDir` — це каталог стану на диску, у якому зберігається ця конфігурація агента за шляхом `~/.openclaw/agents/<agentId>/`. **Прив’язка** зіставляє обліковий запис каналу (наприклад, робочий простір Slack або номер WhatsApp) з одним із цих агентів.

## Що таке «один агент»?

**Агент** — це повністю ізольований інтелект із власними:

- **Робочим простором** (файли, AGENTS.md/SOUL.md/USER.md, локальні нотатки, правила персони).
- **Каталогом стану** (`agentDir`) для профілів автентифікації, реєстру моделей і конфігурації агента.
- **Сховищем сеансів** (історія чатів + стан маршрутизації) у `~/.openclaw/agents/<agentId>/sessions`.

Профілі автентифікації є **окремими для кожного агента**. Кожен агент читає зі свого:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` тут також є безпечнішим шляхом для пригадування між сеансами: він повертає обмежене, очищене подання, а не необроблений дамп стенограми. Пригадування асистента прибирає теги мислення, каркас `<relevant-memories>`, XML-навантаження викликів інструментів у звичайному тексті (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів), знижений до звичайного тексту каркас викликів інструментів, витіклі ASCII/повноширинні токени керування моделлю та некоректний XML викликів інструментів MiniMax до редагування/обрізання.
</Note>

<Warning>
Облікові дані основного агента **не** надаються спільно автоматично. Ніколи не використовуйте один `agentDir` для кількох агентів повторно (це спричиняє конфлікти автентифікації/сеансів). Якщо ви хочете поділитися обліковими даними, скопіюйте `auth-profiles.json` до `agentDir` іншого агента.
</Warning>

Skills завантажуються з робочого простору кожного агента, а також зі спільних кореневих каталогів, таких як `~/.openclaw/skills`, а потім фільтруються ефективним списком дозволених Skills агента, якщо його налаштовано. Використовуйте `agents.defaults.skills` для спільної базової конфігурації та `agents.list[].skills` для заміни на рівні окремого агента. Див. [Skills: для агента чи спільні](/uk/tools/skills#per-agent-vs-shared-skills) і [Skills: списки дозволених Skills агента](/uk/tools/skills#agent-skill-allowlists).

Gateway може розміщувати **одного агента** (типово) або **багатьох агентів** паралельно.

<Note>
**Примітка щодо робочого простору:** робочий простір кожного агента є **типовим cwd**, а не жорсткою пісочницею. Відносні шляхи розв’язуються всередині робочого простору, але абсолютні шляхи можуть досягати інших розташувань хоста, якщо пісочницю не ввімкнено. Див. [Ізоляція в пісочниці](/uk/gateway/sandboxing).
</Note>

## Шляхи (швидка схема)

- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог стану: `~/.openclaw` (або `OPENCLAW_STATE_DIR`)
- Робочий простір: `~/.openclaw/workspace` (або `~/.openclaw/workspace-<agentId>`)
- Каталог агента: `~/.openclaw/agents/<agentId>/agent` (або `agents.list[].agentDir`)
- Сеанси: `~/.openclaw/agents/<agentId>/sessions`

### Режим одного агента (типовий)

Якщо нічого не робити, OpenClaw запускає одного агента:

- `agentId` типово дорівнює **`main`**.
- Сеанси мають ключі у форматі `agent:main:<mainKey>`.
- Робочий простір типово `~/.openclaw/workspace` (або `~/.openclaw/workspace-<profile>`, коли задано `OPENCLAW_PROFILE`).
- Стан типово `~/.openclaw/agents/main/agent`.

## Помічник для агентів

Використовуйте майстер агентів, щоб додати нового ізольованого агента:

```bash
openclaw agents add work
```

Потім додайте `bindings` (або дозвольте майстру зробити це), щоб маршрутизувати вхідні повідомлення.

Перевірте за допомогою:

```bash
openclaw agents list --bindings
```

## Швидкий старт

<Steps>
  <Step title="Створіть робочий простір для кожного агента">
    Використайте майстер або створіть робочі простори вручну:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Кожен агент отримує власний робочий простір із `SOUL.md`, `AGENTS.md` та необов’язковим `USER.md`, а також окремий `agentDir` і сховище сеансів у `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Створіть облікові записи каналів">
    Створіть по одному обліковому запису на агента у вибраних каналах:

    - Discord: один бот на агента, увімкніть Message Content Intent, скопіюйте кожен токен.
    - Telegram: один бот на агента через BotFather, скопіюйте кожен токен.
    - WhatsApp: прив’яжіть кожен номер телефону до окремого облікового запису.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Див. посібники для каналів: [Discord](/uk/channels/discord), [Telegram](/uk/channels/telegram), [WhatsApp](/uk/channels/whatsapp).

  </Step>
  <Step title="Додайте агентів, облікові записи та прив’язки">
    Додайте агентів до `agents.list`, облікові записи каналів до `channels.<channel>.accounts` і з’єднайте їх за допомогою `bindings` (приклади нижче).
  </Step>
  <Step title="Перезапустіть і перевірте">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Кілька агентів = кілька людей, кілька особистостей

З **кількома агентами** кожен `agentId` стає **повністю ізольованою персоною**:

- **Різні номери телефонів/облікові записи** (через `accountId` для кожного каналу).
- **Різні особистості** (через файли робочого простору агента, як-от `AGENTS.md` і `SOUL.md`).
- **Окрема автентифікація + сеанси** (без перетину, якщо це явно не ввімкнено).

Це дає змогу **кільком людям** спільно використовувати один сервер Gateway, зберігаючи ізоляцію їхніх AI-«інтелектів» і даних.

## Пошук у пам’яті QMD між агентами

Якщо один агент має шукати в QMD-стенограмах сеансів іншого агента, додайте додаткові колекції в `agents.list[].memorySearch.qmd.extraCollections`. Використовуйте `agents.defaults.memorySearch.qmd.extraCollections` лише тоді, коли кожен агент має успадковувати той самий спільний набір колекцій стенограм.

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
            extraCollections: [{ path: "notes" }], // розв’язується всередині робочого простору -> колекція з назвою "notes-main"
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

Шлях до додаткової колекції може бути спільним для кількох агентів, але назва колекції залишається явною, коли шлях розташований поза робочим простором агента. Шляхи всередині робочого простору залишаються в області агента, тож кожен агент зберігає власний набір для пошуку в стенограмах.

## Один номер WhatsApp, кілька людей (розподіл DM)

Ви можете маршрутизувати **різні DM у WhatsApp** до різних агентів, залишаючись в межах **одного облікового запису WhatsApp**. Зіставлення виконується за E.164 відправника (наприклад, `+15551234567`) з `peer.kind: "direct"`. Відповіді все одно надходитимуть з того самого номера WhatsApp (без окремої ідентичності відправника для кожного агента).

<Note>
Прямі чати зводяться до **основного ключа сеансу** агента, тож справжня ізоляція вимагає **одного агента на людину**.
</Note>

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

- Керування доступом до DM є **глобальним для кожного облікового запису WhatsApp** (спарювання/список дозволених), а не на рівні агента.
- Для спільних груп прив’яжіть групу до одного агента або використовуйте [Групи мовлення](/uk/channels/broadcast-groups).

## Правила маршрутизації (як повідомлення вибирають агента)

Прив’язки є **детермінованими**, і **перемагає найспецифічніше зіставлення**:

<Steps>
  <Step title="збіг peer">
    Точний id DM/групи/каналу.
  </Step>
  <Step title="збіг parentPeer">
    Успадкування потоку.
  </Step>
  <Step title="guildId + roles">
    Маршрутизація Discord за ролями.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="збіг accountId для каналу">
    Резервний варіант для окремого облікового запису.
  </Step>
  <Step title="Збіг на рівні каналу">
    `accountId: "*"`.
  </Step>
  <Step title="Типовий агент">
    Резервний варіант — `agents.list[].default`, інакше перший елемент списку, типово: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Розв’язання нічиїх і семантика AND">
    - Якщо кілька прив’язок збігаються в межах одного рівня, перемагає перша за порядком у конфігурації.
    - Якщо прив’язка задає кілька полів зіставлення (наприклад, `peer` + `guildId`), потрібні всі вказані поля (семантика `AND`).

  </Accordion>
  <Accordion title="Деталі області дії облікового запису">
    - Прив’язка без `accountId` збігається лише з типовим обліковим записом.
    - Використовуйте `accountId: "*"` для резервного варіанта на рівні каналу для всіх облікових записів.
    - Якщо пізніше ви додасте таку саму прив’язку для того самого агента з явним id облікового запису, OpenClaw оновить наявну прив’язку лише на рівні каналу до прив’язки в області облікового запису замість дублювання.

  </Accordion>
</AccordionGroup>

## Кілька облікових записів / номерів телефонів

Канали, що підтримують **кілька облікових записів** (наприклад, WhatsApp), використовують `accountId` для ідентифікації кожного входу. Кожен `accountId` можна спрямувати до іншого агента, тож один сервер може обслуговувати кілька номерів телефонів без змішування сеансів.

Якщо ви хочете мати типовий обліковий запис для всього каналу, коли `accountId` опущено, задайте `channels.<channel>.defaultAccount` (необов’язково). Якщо його не задано, OpenClaw використовує `default`, якщо він є, інакше — перший налаштований id облікового запису (відсортований).

Поширені канали, що підтримують цей шаблон:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Поняття

- `agentId`: один «інтелект» (робочий простір, автентифікація агента, сховище сеансів агента).
- `accountId`: один екземпляр облікового запису каналу (наприклад, обліковий запис WhatsApp `"personal"` проти `"biz"`).
- `binding`: маршрутизує вхідні повідомлення до `agentId` за `(channel, accountId, peer)` і, за потреби, за id guild/team.
- Прямі чати зводяться до `agent:<agentId>:<mainKey>` (основний сеанс агента; `session.mainKey`).

## Приклади для платформ

<AccordionGroup>
  <Accordion title="Discord-боти для кожного агента">
    Кожен обліковий запис Discord-бота зіставляється з унікальним `accountId`. Прив’яжіть кожен обліковий запис до агента та підтримуйте списки дозволених окремо для кожного бота.

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

    - Запросіть кожного бота до guild і ввімкніть Message Content Intent.
    - Токени зберігаються в `channels.discord.accounts.<id>.token` (типовий обліковий запис може використовувати `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Telegram-боти для кожного агента">
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

    - Створіть по одному боту на агента через BotFather і скопіюйте кожен токен.
    - Токени зберігаються в `channels.telegram.accounts.<id>.botToken` (типовий обліковий запис може використовувати `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Номери WhatsApp для кожного агента">
    Прив’яжіть кожен обліковий запис перед запуском Gateway:

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

      // Детермінована маршрутизація: перший збіг перемагає (спочатку найспецифічніші).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Необов’язкове перевизначення для окремого peer (приклад: надсилати конкретну групу до робочого агента).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Вимкнено типово: обмін повідомленнями між агентами потрібно явно ввімкнути + додати до списку дозволених.
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
              // Необов’язкове перевизначення. Типово: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Необов’язкове перевизначення. Типово: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Поширені шаблони

<Tabs>
  <Tab title="Щоденний WhatsApp + глибока робота в Telegram">
    Розділення за каналами: маршрутизуйте WhatsApp до швидкого повсякденного агента, а Telegram — до агента Opus.

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

    - Якщо у вас є кілька облікових записів для каналу, додайте `accountId` до прив’язки (наприклад, `{ channel: "whatsapp", accountId: "personal" }`).
    - Щоб маршрутизувати один DM/групу до Opus, залишивши все інше на chat, додайте прив’язку `match.peer` для цього peer; збіги за peer завжди мають пріоритет над правилами для всього каналу.

  </Tab>
  <Tab title="Той самий канал, один peer до Opus">
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

    Прив’язки за peer завжди мають пріоритет, тому розміщуйте їх вище за правило для всього каналу.

  </Tab>
  <Tab title="Сімейний агент, прив’язаний до групи WhatsApp">
    Прив’яжіть окремого сімейного агента до однієї групи WhatsApp, із вимогою згадування та жорсткішою політикою інструментів:

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

    - Списки allow/deny для інструментів стосуються **інструментів**, а не Skills. Якщо Skill має запускати бінарний файл, переконайтеся, що `exec` дозволено і бінарний файл існує в пісочниці.
    - Для жорсткішого контролю задайте `agents.list[].groupChat.mentionPatterns` і залишайте ввімкненими списки дозволених груп для каналу.

  </Tab>
</Tabs>

## Пісочниця та конфігурація інструментів для кожного агента

Кожен агент може мати власну пісочницю та обмеження інструментів:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Без пісочниці для особистого агента
        },
        // Без обмежень інструментів — доступні всі інструменти
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Завжди в пісочниці
          scope: "agent",  // Один контейнер на агента
          docker: {
            // Необов’язкове одноразове налаштування після створення контейнера
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Лише інструмент read
          deny: ["exec", "write", "edit", "apply_patch"],    // Заборонити інші
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` розташовується в `sandbox.docker` і виконується один раз під час створення контейнера. Перевизначення `sandbox.docker.*` для окремого агента ігноруються, коли підсумкова область дії дорівнює `"shared"`.
</Note>

**Переваги:**

- **Ізоляція безпеки**: обмежуйте інструменти для недовірених агентів.
- **Керування ресурсами**: ізолюйте в пісочниці окремих агентів, залишаючи інших на хості.
- **Гнучкі політики**: різні дозволи для різних агентів.

<Note>
`tools.elevated` є **глобальним** і базується на відправнику; його не можна налаштувати для окремого агента. Якщо вам потрібні межі на рівні агента, використовуйте `agents.list[].tools`, щоб заборонити `exec`. Для адресації в групах використовуйте `agents.list[].groupChat.mentionPatterns`, щоб @згадки однозначно зіставлялися з потрібним агентом.
</Note>

Див. [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) для докладних прикладів.

## Пов’язане

- [ACP agents](/uk/tools/acp-agents) — запуск зовнішніх середовищ кодування
- [Маршрутизація каналів](/uk/channels/channel-routing) — як повідомлення маршрутизуються до агентів
- [Присутність](/uk/concepts/presence) — присутність і доступність агента
- [Сеанс](/uk/concepts/session) — ізоляція та маршрутизація сеансів
- [Підагенти](/uk/tools/subagents) — запуск фонових виконань агентів
