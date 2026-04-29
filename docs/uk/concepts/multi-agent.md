---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Багатоагентна маршрутизація: ізольовані агенти, облікові записи каналів і прив’язки'
title: Маршрутизація між кількома агентами
x-i18n:
    generated_at: "2026-04-29T11:03:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

Запускайте кілька _ізольованих_ агентів — кожен із власним робочим простором, каталогом стану (`agentDir`) та історією сеансів — а також кілька облікових записів каналів (наприклад, два WhatsApp) в одному запущеному Gateway. Вхідні повідомлення маршрутизуються до правильного агента через прив’язки.

Тут **агент** — це повна область для окремої персони: файли робочого простору, профілі автентифікації, реєстр моделей і сховище сеансів. `agentDir` — це каталог стану на диску, який містить цю конфігурацію для окремого агента за шляхом `~/.openclaw/agents/<agentId>/`. **Прив’язка** зіставляє обліковий запис каналу (наприклад, робочий простір Slack або номер WhatsApp) з одним із цих агентів.

## Що таке «один агент»?

**Агент** — це повністю окремий «мозок» із власними:

- **Робочим простором** (файли, AGENTS.md/SOUL.md/USER.md, локальні нотатки, правила персони).
- **Каталогом стану** (`agentDir`) для профілів автентифікації, реєстру моделей і конфігурації окремого агента.
- **Сховищем сеансів** (історія чату + стан маршрутизації) у `~/.openclaw/agents/<agentId>/sessions`.

Профілі автентифікації є **окремими для кожного агента**. Кожен агент читає зі свого власного:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` тут також є безпечнішим шляхом пригадування між сеансами: він повертає обмежене, очищене подання, а не сирий дамп транскрипту. Пригадування асистента прибирає теги міркувань, каркас `<relevant-memories>`, XML-навантаження викликів інструментів у звичайному тексті (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів), понижений каркас викликів інструментів, витеклі ASCII/повноширинні керівні токени моделі та некоректний MiniMax XML викликів інструментів перед редагуванням/обрізанням.
</Note>

<Warning>
Ніколи не використовуйте той самий `agentDir` для кількох агентів (це спричиняє конфлікти автентифікації/сеансів). Агенти
можуть читати профілі автентифікації типового/головного агента, коли не мають
локального профілю, але OpenClaw не клонує OAuth refresh tokens у
сховище вторинного агента. Якщо вам потрібен незалежний обліковий запис OAuth, увійдіть із
цього агента; якщо копіюєте облікові дані вручну, копіюйте лише переносні статичні
профілі `api_key` або `token`.
</Warning>

Skills завантажуються з робочого простору кожного агента, а також зі спільних коренів, як-от `~/.openclaw/skills`, після чого фільтруються за ефективним списком дозволених Skills агента, якщо його налаштовано. Використовуйте `agents.defaults.skills` для спільної бази та `agents.list[].skills` для заміни на рівні окремого агента. Див. [Skills: для окремого агента чи спільні](/uk/tools/skills#per-agent-vs-shared-skills) і [Skills: списки дозволених Skills агента](/uk/tools/skills#agent-skill-allowlists).

Gateway може розміщувати **одного агента** (типово) або **багатьох агентів** поруч.

<Note>
**Примітка щодо робочого простору:** робочий простір кожного агента є **типовим cwd**, а не жорсткою пісочницею. Відносні шляхи розв’язуються всередині робочого простору, але абсолютні шляхи можуть досягати інших розташувань хоста, якщо пісочницю не ввімкнено. Див. [Пісочниця](/uk/gateway/sandboxing).
</Note>

## Шляхи (коротка мапа)

- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог стану: `~/.openclaw` (або `OPENCLAW_STATE_DIR`)
- Робочий простір: `~/.openclaw/workspace` (або `~/.openclaw/workspace-<agentId>`)
- Каталог агента: `~/.openclaw/agents/<agentId>/agent` (або `agents.list[].agentDir`)
- Сеанси: `~/.openclaw/agents/<agentId>/sessions`

### Режим одного агента (типово)

Якщо нічого не робити, OpenClaw запускає одного агента:

- `agentId` типово має значення **`main`**.
- Сеанси мають ключі у форматі `agent:main:<mainKey>`.
- Робочий простір типово дорівнює `~/.openclaw/workspace` (або `~/.openclaw/workspace-<profile>`, коли встановлено `OPENCLAW_PROFILE`).
- Стан типово зберігається в `~/.openclaw/agents/main/agent`.

## Помічник агента

Скористайтеся майстром агентів, щоб додати нового ізольованого агента:

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
  <Step title="Створіть робочий простір кожного агента">
    Скористайтеся майстром або створіть робочі простори вручну:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Кожен агент отримує власний робочий простір із `SOUL.md`, `AGENTS.md` і необов’язковим `USER.md`, а також виділений `agentDir` і сховище сеансів у `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Створіть облікові записи каналів">
    Створіть по одному обліковому запису для кожного агента у вибраних каналах:

    - Discord: один бот на агента, увімкніть Message Content Intent, скопіюйте кожен токен.
    - Telegram: один бот на агента через BotFather, скопіюйте кожен токен.
    - WhatsApp: прив’яжіть кожен номер телефону до окремого облікового запису.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Див. посібники каналів: [Discord](/uk/channels/discord), [Telegram](/uk/channels/telegram), [WhatsApp](/uk/channels/whatsapp).

  </Step>
  <Step title="Додайте агентів, облікові записи та прив’язки">
    Додайте агентів у `agents.list`, облікові записи каналів у `channels.<channel>.accounts` і з’єднайте їх за допомогою `bindings` (приклади нижче).
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

- **Різні номери телефонів/облікові записи** (окремий `accountId` для кожного каналу).
- **Різні особистості** (файли робочого простору окремого агента, як-от `AGENTS.md` і `SOUL.md`).
- **Окрема автентифікація + сеанси** (без перетинів, якщо це явно не ввімкнено).

Це дає змогу **кільком людям** спільно використовувати один сервер Gateway, зберігаючи їхні AI-«мізки» та дані ізольованими.

## Пошук QMD-пам’яті між агентами

Якщо один агент має шукати транскрипти QMD-сеансів іншого агента, додайте додаткові колекції в `agents.list[].memorySearch.qmd.extraCollections`. Використовуйте `agents.defaults.memorySearch.qmd.extraCollections` лише тоді, коли кожен агент має успадковувати ті самі спільні колекції транскриптів.

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

Шлях додаткової колекції може бути спільним для кількох агентів, але назва колекції лишається явною, коли шлях розташований поза робочим простором агента. Шляхи всередині робочого простору лишаються прив’язаними до агента, тож кожен агент зберігає власний набір пошуку транскриптів.

## Один номер WhatsApp, кілька людей (розділення DM)

Ви можете маршрутизувати **різні WhatsApp DM** до різних агентів, залишаючись в **одному обліковому записі WhatsApp**. Зіставляйте за E.164 відправника (наприклад, `+15551234567`) з `peer.kind: "direct"`. Відповіді все одно надходитимуть із того самого номера WhatsApp (без окремої ідентичності відправника для кожного агента).

<Note>
Прямі чати згортаються до **головного ключа сеансу** агента, тому справжня ізоляція потребує **одного агента на людину**.
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

- Контроль доступу DM є **глобальним для облікового запису WhatsApp** (спарювання/список дозволених), а не окремим для кожного агента.
- Для спільних груп прив’яжіть групу до одного агента або використовуйте [Групи трансляції](/uk/channels/broadcast-groups).

## Правила маршрутизації (як повідомлення вибирають агента)

Прив’язки є **детермінованими**, і **найконкретніша перемагає**:

<Steps>
  <Step title="збіг peer">
    Точний id DM/групи/каналу.
  </Step>
  <Step title="збіг parentPeer">
    Успадкування гілки.
  </Step>
  <Step title="guildId + ролі">
    Маршрутизація за ролями Discord.
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
    Резервний перехід до `agents.list[].default`, інакше перший запис списку, типово: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Розв’язання нічиїх і семантика AND">
    - Якщо в одному рівні збігається кілька прив’язок, перемагає перша в порядку конфігурації.
    - Якщо прив’язка задає кілька полів збігу (наприклад, `peer` + `guildId`), потрібні всі зазначені поля (семантика `AND`).

  </Accordion>
  <Accordion title="Деталі області облікового запису">
    - Прив’язка, яка пропускає `accountId`, відповідає лише типовому обліковому запису.
    - Використовуйте `accountId: "*"` для резервного варіанта на весь канал для всіх облікових записів.
    - Якщо згодом додати ту саму прив’язку для того самого агента з явним id облікового запису, OpenClaw оновить наявну прив’язку лише каналу до області облікового запису замість її дублювання.

  </Accordion>
</AccordionGroup>

## Кілька облікових записів / номерів телефонів

Канали, які підтримують **кілька облікових записів** (наприклад, WhatsApp), використовують `accountId` для ідентифікації кожного входу. Кожен `accountId` можна маршрутизувати до іншого агента, тому один сервер може розміщувати кілька номерів телефонів без змішування сеансів.

Якщо потрібен типовий обліковий запис для всього каналу, коли `accountId` пропущено, задайте `channels.<channel>.defaultAccount` (необов’язково). Якщо не задано, OpenClaw повертається до `default`, якщо він є, інакше до першого налаштованого id облікового запису (у відсортованому порядку).

Поширені канали, що підтримують цей шаблон:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Поняття

- `agentId`: один «мозок» (робочий простір, автентифікація окремого агента, сховище сеансів окремого агента).
- `accountId`: один екземпляр облікового запису каналу (наприклад, обліковий запис WhatsApp `"personal"` проти `"biz"`).
- `binding`: маршрутизує вхідні повідомлення до `agentId` за `(channel, accountId, peer)` і, за потреби, id гільдії/команди.
- Прямі чати згортаються до `agent:<agentId>:<mainKey>` («головний» для окремого агента; `session.mainKey`).

## Приклади платформ

<AccordionGroup>
  <Accordion title="Боти Discord для кожного агента">
    Кожен обліковий запис бота Discord зіставляється з унікальним `accountId`. Прив’яжіть кожен обліковий запис до агента й підтримуйте списки дозволених окремо для кожного бота.

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

    - Запросіть кожного бота до гільдії та ввімкніть Message Content Intent.
    - Токени зберігаються в `channels.discord.accounts.<id>.token` (обліковий запис за замовчуванням може використовувати `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Боти Telegram для кожного агента">
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

    - Створіть по одному боту для кожного агента за допомогою BotFather і скопіюйте кожен токен.
    - Токени зберігаються в `channels.telegram.accounts.<id>.botToken` (обліковий запис за замовчуванням може використовувати `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Номери WhatsApp для кожного агента">
    Зв’яжіть кожен обліковий запис перед запуском Gateway:

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

  </Accordion>
</AccordionGroup>

## Поширені шаблони

<Tabs>
  <Tab title="WhatsApp щодня + Telegram для глибокої роботи">
    Розділіть за каналом: спрямовуйте WhatsApp до швидкого повсякденного агента, а Telegram до агента Opus.

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
    - Щоб спрямувати один особистий чат/групу до Opus, залишивши решту в чаті, додайте прив’язку `match.peer` для цього співрозмовника; відповідності співрозмовника завжди мають перевагу над правилами для всього каналу.

  </Tab>
  <Tab title="Той самий канал, один співрозмовник до Opus">
    Залиште WhatsApp на швидкому агенті, але спрямуйте один особистий чат до Opus:

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

    Прив’язки peer завжди мають перевагу, тому тримайте їх вище за правило для всього каналу.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Прив’яжіть спеціального сімейного агента до однієї групи WhatsApp із gating за згадками та суворішою політикою інструментів:

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

    - Списки дозволу/заборони інструментів стосуються **інструментів**, а не skills. Якщо skill має запускати бінарний файл, переконайтеся, що `exec` дозволено, а бінарний файл існує в пісочниці.
    - Для суворішого gating задайте `agents.list[].groupChat.mentionPatterns` і залиште ввімкненими allowlist груп для каналу.

  </Tab>
</Tabs>

## Конфігурація пісочниці й інструментів для кожного агента

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

<Note>
`setupCommand` розташовується в `sandbox.docker` і виконується один раз під час створення контейнера. Перевизначення `sandbox.docker.*` для окремого агента ігноруються, коли визначена область дії дорівнює `"shared"`.
</Note>

**Переваги:**

- **Ізоляція безпеки**: обмежуйте інструменти для недовірених агентів.
- **Контроль ресурсів**: запускайте конкретних агентів у пісочниці, залишаючи інших на хості.
- **Гнучкі політики**: різні дозволи для кожного агента.

<Note>
`tools.elevated` є **глобальним** і базується на відправнику; його не можна налаштувати для окремого агента. Якщо потрібні межі для кожного агента, використовуйте `agents.list[].tools`, щоб заборонити `exec`. Для націлювання на групу використовуйте `agents.list[].groupChat.mentionPatterns`, щоб @згадки коректно зіставлялися з потрібним агентом.
</Note>

Див. [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools), щоб переглянути докладні приклади.

## Пов’язане

- [Агенти ACP](/uk/tools/acp-agents) — запуск зовнішніх середовищ для кодування
- [Маршрутизація каналів](/uk/channels/channel-routing) — як повідомлення маршрутизуються до агентів
- [Присутність](/uk/concepts/presence) — присутність і доступність агента
- [Сесія](/uk/concepts/session) — ізоляція та маршрутизація сесій
- [Субагенти](/uk/tools/subagents) — запуск фонових виконань агентів
