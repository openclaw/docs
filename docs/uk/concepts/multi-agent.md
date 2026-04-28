---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Маршрутизація з кількома агентами: ізольовані агенти, облікові записи каналів і прив’язки'
title: Багатоагентна маршрутизація
x-i18n:
    generated_at: "2026-04-28T11:09:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75770f058453345ef2de281d5fffb20ccfda5e73815e27b1643909a624007b86
    source_path: concepts/multi-agent.md
    workflow: 16
---

Запускайте кілька _ізольованих_ агентів — кожен із власним робочим простором, каталогом стану (`agentDir`) та історією сеансів — плюс кілька облікових записів каналів (наприклад, два WhatsApp) в одному запущеному Gateway. Вхідні повідомлення маршрутизуються до правильного агента через прив’язки.

**Агент** тут — це повна область для окремої персони: файли робочого простору, профілі автентифікації, реєстр моделей і сховище сеансів. `agentDir` — це каталог стану на диску, який містить цю конфігурацію для окремого агента в `~/.openclaw/agents/<agentId>/`. **Прив’язка** зіставляє обліковий запис каналу (наприклад, робочий простір Slack або номер WhatsApp) з одним із цих агентів.

## Що таке "один агент"?

**Агент** — це повністю обмежений за областю "мозок" із власними:

- **Робочим простором** (файли, AGENTS.md/SOUL.md/USER.md, локальні нотатки, правила персони).
- **Каталогом стану** (`agentDir`) для профілів автентифікації, реєстру моделей і конфігурації для окремого агента.
- **Сховищем сеансів** (історія чату + стан маршрутизації) у `~/.openclaw/agents/<agentId>/sessions`.

Профілі автентифікації є **окремими для кожного агента**. Кожен агент читає зі свого власного:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` також є безпечнішим шляхом пригадування між сеансами тут: він повертає обмежене, очищене подання, а не сирий дамп стенограми. Пригадування асистента видаляє теги мислення, каркас `<relevant-memories>`, XML-навантаження викликів інструментів у звичайному тексті (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів), понижений каркас викликів інструментів, витеклі ASCII/повноширинні токени керування моделлю та некоректний XML викликів інструментів MiniMax перед редагуванням/обрізанням.
</Note>

<Warning>
Облікові дані головного агента **не** поширюються автоматично. Ніколи не використовуйте `agentDir` повторно для кількох агентів (це спричиняє конфлікти автентифікації/сеансів). Якщо хочете поширити облікові дані, скопіюйте `auth-profiles.json` в `agentDir` іншого агента.
</Warning>

Skills завантажуються з робочого простору кожного агента плюс спільних коренів, таких як `~/.openclaw/skills`, а потім фільтруються за ефективним списком дозволених Skills агента, якщо він налаштований. Використовуйте `agents.defaults.skills` для спільної бази та `agents.list[].skills` для заміни на рівні агента. Див. [Skills: для окремого агента й спільні](/uk/tools/skills#per-agent-vs-shared-skills) і [Skills: списки дозволених Skills агента](/uk/tools/skills#agent-skill-allowlists).

Gateway може розміщувати **одного агента** (типово) або **багато агентів** поруч.

<Note>
**Примітка щодо робочого простору:** робочий простір кожного агента є **типовим cwd**, а не жорсткою пісочницею. Відносні шляхи розв’язуються всередині робочого простору, але абсолютні шляхи можуть діставатися інших розташувань хоста, якщо пісочницю не ввімкнено. Див. [Пісочниця](/uk/gateway/sandboxing).
</Note>

## Шляхи (коротка мапа)

- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог стану: `~/.openclaw` (або `OPENCLAW_STATE_DIR`)
- Робочий простір: `~/.openclaw/workspace` (або `~/.openclaw/workspace-<agentId>`)
- Каталог агента: `~/.openclaw/agents/<agentId>/agent` (або `agents.list[].agentDir`)
- Сеанси: `~/.openclaw/agents/<agentId>/sessions`

### Режим одного агента (типово)

Якщо нічого не робити, OpenClaw запускає одного агента:

- `agentId` типово дорівнює **`main`**.
- Сеанси мають ключі у форматі `agent:main:<mainKey>`.
- Робочий простір типово `~/.openclaw/workspace` (або `~/.openclaw/workspace-<profile>`, коли встановлено `OPENCLAW_PROFILE`).
- Стан типово `~/.openclaw/agents/main/agent`.

## Помічник агента

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
  <Step title="Створіть робочий простір кожного агента">
    Використайте майстер або створіть робочі простори вручну:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Кожен агент отримує власний робочий простір із `SOUL.md`, `AGENTS.md` і необов’язковим `USER.md`, а також окремий `agentDir` і сховище сеансів у `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Створіть облікові записи каналів">
    Створіть один обліковий запис на агента у бажаних каналах:

    - Discord: один бот на агента, увімкніть Message Content Intent, скопіюйте кожен токен.
    - Telegram: один бот на агента через BotFather, скопіюйте кожен токен.
    - WhatsApp: прив’яжіть кожен номер телефону до окремого облікового запису.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Див. посібники каналів: [Discord](/uk/channels/discord), [Telegram](/uk/channels/telegram), [WhatsApp](/uk/channels/whatsapp).

  </Step>
  <Step title="Додайте агентів, облікові записи та прив’язки">
    Додайте агентів у `agents.list`, облікові записи каналів у `channels.<channel>.accounts` і з’єднайте їх через `bindings` (приклади нижче).
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

- **Різні номери телефонів/облікові записи** (на `accountId` каналу).
- **Різні особистості** (файли робочого простору окремого агента, як-от `AGENTS.md` і `SOUL.md`).
- **Окрема автентифікація + сеанси** (без взаємного впливу, якщо це явно не ввімкнено).

Це дає змогу **кільком людям** спільно використовувати один сервер Gateway, зберігаючи їхні AI-"мізки" й дані ізольованими.

## Пошук QMD-пам’яті між агентами

Якщо один агент має шукати в QMD-стенограмах сеансів іншого агента, додайте додаткові колекції в `agents.list[].memorySearch.qmd.extraCollections`. Використовуйте `agents.defaults.memorySearch.qmd.extraCollections` лише тоді, коли кожен агент має успадкувати ті самі спільні колекції стенограм.

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

Шлях додаткової колекції може бути спільним для агентів, але назва колекції залишається явною, коли шлях розташований поза робочим простором агента. Шляхи всередині робочого простору залишаються обмеженими агентом, тож кожен агент зберігає власний набір пошуку стенограм.

## Один номер WhatsApp, кілька людей (розділення DM)

Можна маршрутизувати **різні DM WhatsApp** до різних агентів, залишаючись на **одному обліковому записі WhatsApp**. Зіставляйте за E.164 відправника (наприклад, `+15551234567`) з `peer.kind: "direct"`. Відповіді все одно надходять з того самого номера WhatsApp (без ідентичності відправника для окремого агента).

<Note>
Прямі чати згортаються до **головного ключа сеансу** агента, тому справжня ізоляція вимагає **одного агента на людину**.
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

- Керування доступом до DM є **глобальним для облікового запису WhatsApp** (спарювання/allowlist), а не окремим для агента.
- Для спільних груп прив’яжіть групу до одного агента або використовуйте [Групи трансляції](/uk/channels/broadcast-groups).

## Правила маршрутизації (як повідомлення вибирають агента)

Прив’язки є **детермінованими**, і **найконкретніша перемагає**:

<Steps>
  <Step title="збіг peer">
    Точний id DM/групи/каналу.
  </Step>
  <Step title="збіг parentPeer">
    Успадкування потоку.
  </Step>
  <Step title="guildId + ролі">
    Маршрутизація ролей Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="збіг accountId для каналу">
    Резервний варіант для облікового запису.
  </Step>
  <Step title="Збіг на рівні каналу">
    `accountId: "*"`.
  </Step>
  <Step title="Типовий агент">
    Резервний перехід до `agents.list[].default`, інакше перший запис списку, типово: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Розв’язання збігів і семантика AND">
    - Якщо кілька прив’язок збігаються на одному рівні, перемагає перша в порядку конфігурації.
    - Якщо прив’язка задає кілька полів зіставлення (наприклад, `peer` + `guildId`), потрібні всі указані поля (семантика `AND`).

  </Accordion>
  <Accordion title="Деталі області облікового запису">
    - Прив’язка, яка пропускає `accountId`, збігається лише з типовим обліковим записом.
    - Використовуйте `accountId: "*"` для резервного варіанта на весь канал у всіх облікових записах.
    - Якщо згодом додати ту саму прив’язку для того самого агента з явним id облікового запису, OpenClaw оновить наявну прив’язку лише до каналу до прив’язки з областю облікового запису замість дублювання.

  </Accordion>
</AccordionGroup>

## Кілька облікових записів / номерів телефонів

Канали, які підтримують **кілька облікових записів** (наприклад, WhatsApp), використовують `accountId` для ідентифікації кожного входу. Кожен `accountId` можна маршрутизувати до іншого агента, тож один сервер може розміщувати кілька номерів телефонів без змішування сеансів.

Якщо потрібен типовий обліковий запис на весь канал, коли `accountId` пропущено, установіть `channels.<channel>.defaultAccount` (необов’язково). Якщо не встановлено, OpenClaw повертається до `default`, якщо він є, інакше до першого налаштованого id облікового запису (відсортовано).

Поширені канали, що підтримують цей шаблон:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Концепції

- `agentId`: один "мозок" (робочий простір, автентифікація для окремого агента, сховище сеансів для окремого агента).
- `accountId`: один екземпляр облікового запису каналу (наприклад, обліковий запис WhatsApp `"personal"` проти `"biz"`).
- `binding`: маршрутизує вхідні повідомлення до `agentId` за `(channel, accountId, peer)` і необов’язково id гільдії/команди.
- Прямі чати згортаються до `agent:<agentId>:<mainKey>` ("main" для окремого агента; `session.mainKey`).

## Приклади платформ

<AccordionGroup>
  <Accordion title="Боти Discord для кожного агента">
    Кожен обліковий запис бота Discord зіставляється з унікальним `accountId`. Прив’яжіть кожен обліковий запис до агента й зберігайте allowlist для кожного бота.

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
    - Токени зберігаються в `channels.discord.accounts.<id>.token` (типовий обліковий запис може використовувати `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Telegram bots per agent">
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

    - Створіть одного бота для кожного агента через BotFather і скопіюйте кожен токен.
    - Токени зберігаються в `channels.telegram.accounts.<id>.botToken` (обліковий запис за замовчуванням може використовувати `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
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
  <Tab title="WhatsApp daily + Telegram deep work">
    Розділіть за каналом: маршрутизуйте WhatsApp до швидкого повсякденного агента, а Telegram — до агента Opus.

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

    - Якщо у вас є кілька облікових записів для каналу, додайте `accountId` до прив’язки (наприклад `{ channel: "whatsapp", accountId: "personal" }`).
    - Щоб маршрутизувати один DM/групу до Opus, залишаючи решту в чаті, додайте прив’язку `match.peer` для цього співрозмовника; збіги співрозмовника завжди мають перевагу над правилами для всього каналу.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
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

    Прив’язки співрозмовника завжди мають перевагу, тому тримайте їх над правилом для всього каналу.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Прив’яжіть окремого сімейного агента до однієї групи WhatsApp, із фільтрацією за згадками та суворішою політикою інструментів:

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

    - Списки дозволених/заборонених інструментів стосуються **інструментів**, а не Skills. Якщо Skills потрібно запустити бінарний файл, переконайтеся, що `exec` дозволено, а бінарний файл існує в пісочниці.
    - Для суворішої фільтрації задайте `agents.list[].groupChat.mentionPatterns` і залиште ввімкненими списки дозволених груп для каналу.

  </Tab>
</Tabs>

## Налаштування пісочниці та інструментів для кожного агента

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
`setupCommand` розташований у `sandbox.docker` і виконується один раз під час створення контейнера. Перевизначення `sandbox.docker.*` для окремого агента ігноруються, коли визначена область дії дорівнює `"shared"`.
</Note>

**Переваги:**

- **Ізоляція безпеки**: обмежуйте інструменти для ненадійних агентів.
- **Контроль ресурсів**: ізолюйте конкретних агентів у пісочниці, залишаючи інших на хості.
- **Гнучкі політики**: різні дозволи для кожного агента.

<Note>
`tools.elevated` є **глобальним** і залежить від відправника; його не можна налаштувати для окремого агента. Якщо вам потрібні межі для кожного агента, використовуйте `agents.list[].tools`, щоб заборонити `exec`. Для націлювання на групи використовуйте `agents.list[].groupChat.mentionPatterns`, щоб @згадки чітко відповідали потрібному агенту.
</Note>

Див. [пісочницю та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) для докладних прикладів.

## Пов’язане

- [агенти ACP](/uk/tools/acp-agents) — запуск зовнішніх середовищ для програмування
- [Маршрутизація каналів](/uk/channels/channel-routing) — як повідомлення маршрутизуються до агентів
- [Присутність](/uk/concepts/presence) — присутність і доступність агента
- [Сесія](/uk/concepts/session) — ізоляція та маршрутизація сесії
- [Субагенти](/uk/tools/subagents) — запуск фонових виконань агента
