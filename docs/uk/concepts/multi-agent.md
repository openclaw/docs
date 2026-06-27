---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Маршрутизація мультиагентів: ізольовані агенти, облікові записи каналів і прив’язки'
title: Маршрутизація між кількома агентами
x-i18n:
    generated_at: "2026-06-27T17:27:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

Запускайте кілька _ізольованих_ агентів — кожен зі своїм робочим простором, каталогом стану (`agentDir`) та історією сеансів — а також кілька облікових записів каналів (наприклад, два WhatsApp) в одному запущеному Gateway. Вхідні повідомлення спрямовуються до потрібного агента через прив’язки.

**Агент** тут означає повну область для окремої персони: файли робочого простору, профілі автентифікації, реєстр моделей і сховище сеансів. `agentDir` — це каталог стану на диску, який містить цю конфігурацію окремого агента за шляхом `~/.openclaw/agents/<agentId>/`. **Прив’язка** зіставляє обліковий запис каналу (наприклад, робочий простір Slack або номер WhatsApp) з одним із цих агентів.

## Що таке "один агент"?

**Агент** — це повністю ізольований мозок із власними:

- **Робочим простором** (файли, AGENTS.md/SOUL.md/USER.md, локальні нотатки, правила персони).
- **Каталогом стану** (`agentDir`) для профілів автентифікації, реєстру моделей і конфігурації окремого агента.
- **Сховищем сеансів** (історія чату + стан маршрутизації) у `~/.openclaw/agents/<agentId>/sessions`.

Профілі автентифікації є **окремими для кожного агента**. Кожен агент читає зі свого власного:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` тут також є безпечнішим шляхом пригадування між сеансами: він повертає обмежене, очищене подання, а не сирий дамп стенограми. Пригадування асистента вилучає теги мислення, каркас `<relevant-memories>`, XML-навантаження викликів інструментів у звичайному тексті (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів), понижений каркас викликів інструментів, витеклі ASCII/повноширинні керівні токени моделі та некоректний XML викликів інструментів MiniMax перед редагуванням/обрізанням.
</Note>

<Warning>
Ніколи не використовуйте `agentDir` повторно для різних агентів (це спричиняє конфлікти автентифікації/сеансів). Агенти
можуть читати профілі автентифікації агента за замовчуванням/основного агента, коли вони не мають
локального профілю, але OpenClaw не клонує токени оновлення OAuth у
сховище вторинного агента. Якщо вам потрібен незалежний обліковий запис OAuth, увійдіть із
цього агента; якщо ви копіюєте облікові дані вручну, копіюйте лише переносні статичні
профілі `api_key` або `token`.
</Warning>

Skills завантажуються з робочого простору кожного агента плюс спільних коренів, як-от `~/.openclaw/skills`, а потім фільтруються за ефективним списком дозволених Skills агента, якщо його налаштовано. Використовуйте `agents.defaults.skills` для спільної базової лінії та `agents.list[].skills` для заміни на рівні агента. Див. [Skills: для окремого агента та спільні](/uk/tools/skills#per-agent-vs-shared-skills) і [Skills: списки дозволених Skills агента](/uk/tools/skills#agent-allowlists).

Gateway може розміщувати **одного агента** (за замовчуванням) або **багатьох агентів** поряд.

<Note>
**Примітка про робочий простір:** робочий простір кожного агента є **типовим cwd**, а не жорсткою пісочницею. Відносні шляхи розв’язуються всередині робочого простору, але абсолютні шляхи можуть досягати інших розташувань хоста, якщо пісочницю не ввімкнено. Див. [Пісочниця](/uk/gateway/sandboxing).
</Note>

## Шляхи (коротка мапа)

- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог стану: `~/.openclaw` (або `OPENCLAW_STATE_DIR`)
- Робочий простір: `~/.openclaw/workspace` (або `~/.openclaw/workspace-<agentId>`)
- Каталог агента: `~/.openclaw/agents/<agentId>/agent` (або `agents.list[].agentDir`)
- Сеанси: `~/.openclaw/agents/<agentId>/sessions`

### Режим одного агента (за замовчуванням)

Якщо ви нічого не робите, OpenClaw запускає одного агента:

- `agentId` за замовчуванням має значення **`main`**.
- Сеанси мають ключі у форматі `agent:main:<mainKey>`.
- Робочий простір за замовчуванням — `~/.openclaw/workspace` (або `~/.openclaw/workspace-<profile>`, коли встановлено `OPENCLAW_PROFILE`).
- Стан за замовчуванням — `~/.openclaw/agents/main/agent`.

## Помічник агента

Використайте майстер агентів, щоб додати нового ізольованого агента:

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

    Кожен агент отримує власний робочий простір із `SOUL.md`, `AGENTS.md` і необов’язковим `USER.md`, а також виділений `agentDir` і сховище сеансів у `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Створіть облікові записи каналів">
    Створіть по одному обліковому запису на агента в бажаних каналах:

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

- **Різні номери телефонів/облікові записи** (для кожного каналу `accountId`).
- **Різні особистості** (файли робочого простору окремого агента, як-от `AGENTS.md` і `SOUL.md`).
- **Окрема автентифікація + сеанси** (без перетину, якщо його явно не ввімкнено).

Це дає змогу **кільком людям** спільно використовувати один сервер Gateway, зберігаючи їхні AI-"мізки" та дані ізольованими.

## Пошук QMD-пам’яті між агентами

Якщо один агент має шукати стенограми QMD-сеансів іншого агента, додайте додаткові колекції в `agents.list[].memorySearch.qmd.extraCollections`. Використовуйте `agents.defaults.memorySearch.qmd.extraCollections` лише тоді, коли кожен агент має успадковувати однакові спільні колекції стенограм.

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

Шлях додаткової колекції може бути спільним для агентів, але назва колекції залишається явною, коли шлях розташований поза робочим простором агента. Шляхи всередині робочого простору залишаються прив’язаними до агента, тож кожен агент зберігає власний набір пошуку стенограм.

## Один номер WhatsApp, кілька людей (розділення DM)

Ви можете спрямовувати **різні DM WhatsApp** до різних агентів, залишаючись в **одному обліковому записі WhatsApp**. Зіставляйте за відправником E.164 (наприклад, `+15551234567`) із `peer.kind: "direct"`. Відповіді все одно надходять із того самого номера WhatsApp (без окремої ідентичності відправника для кожного агента).

<Note>
Прямі чати згортаються до **основного ключа сеансу** агента, тому справжня ізоляція потребує **одного агента на людину**.
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

- Контроль доступу DM є **глобальним для облікового запису WhatsApp** (спарювання/allowlist), а не окремим для агента.
- Для спільних груп прив’яжіть групу до одного агента або використайте [Групи розсилки](/uk/channels/broadcast-groups).

## Правила маршрутизації (як повідомлення вибирають агента)

Прив’язки є **детермінованими**, і **найспецифічніша перемагає**:

<Steps>
  <Step title="Зіставлення peer">
    Точний id DM/групи/каналу.
  </Step>
  <Step title="Зіставлення parentPeer">
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
  <Step title="Зіставлення accountId для каналу">
    Резервний варіант для окремого облікового запису.
  </Step>
  <Step title="Зіставлення на рівні каналу">
    `accountId: "*"`.
  </Step>
  <Step title="Агент за замовчуванням">
    Резервний перехід до `agents.list[].default`, інакше перший запис списку, за замовчуванням: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Розв’язання нічиїх і семантика AND">
    - Якщо кілька прив’язок збігаються на одному рівні, перемагає перша в порядку конфігурації.
    - Якщо прив’язка задає кілька полів зіставлення (наприклад, `peer` + `guildId`), потрібні всі зазначені поля (семантика `AND`).

  </Accordion>
  <Accordion title="Деталі області облікового запису">
    - Прив’язка, яка пропускає `accountId`, зіставляється лише з обліковим записом за замовчуванням. Вона не зіставляється з усіма обліковими записами.
    - Використовуйте `accountId: "*"` для резервного варіанта на весь канал для всіх облікових записів.
    - Використовуйте `accountId: "<name>"`, щоб зіставити один обліковий запис.
    - Якщо пізніше ви додасте ту саму прив’язку для того самого агента з явним id облікового запису, OpenClaw оновить наявну прив’язку лише для каналу до прив’язки з областю облікового запису замість її дублювання.

  </Accordion>
</AccordionGroup>

## Кілька облікових записів / номерів телефонів

Канали, що підтримують **кілька облікових записів** (наприклад, WhatsApp), використовують `accountId` для ідентифікації кожного входу. Кожен `accountId` можна спрямувати до іншого агента, тож один сервер може розміщувати кілька номерів телефонів без змішування сеансів.

Якщо вам потрібен обліковий запис за замовчуванням для всього каналу, коли `accountId` пропущено, установіть `channels.<channel>.defaultAccount` (необов’язково). Якщо не встановлено, OpenClaw повертається до `default`, якщо він присутній, інакше до першого налаштованого id облікового запису (після сортування).

Поширені канали, що підтримують цей шаблон, включають:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Концепції

- `agentId`: один "мозок" (робочий простір, автентифікація окремого агента, сховище сеансів окремого агента).
- `accountId`: один екземпляр облікового запису каналу (наприклад, обліковий запис WhatsApp `"personal"` проти `"biz"`).
- `binding`: спрямовує вхідні повідомлення до `agentId` за `(channel, accountId, peer)` і необов’язково id гільдії/команди.
- Прямі чати згортаються до `agent:<agentId>:<mainKey>` ("основний" для окремого агента; `session.mainKey`).

## Приклади платформ

<AccordionGroup>
  <Accordion title="Боти Discord для кожного агента">
    Кожен обліковий запис бота Discord зіставляється з унікальним `accountId`. Прив’яжіть кожен обліковий запис до агента та тримайте allowlist окремо для кожного бота.

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

    - Запросіть кожного бота на сервер і увімкніть Message Content Intent.
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

    - Створіть по одному боту для кожного агента через BotFather і скопіюйте кожен токен.
    - Токени зберігаються в `channels.telegram.accounts.<id>.botToken` (обліковий запис за замовчуванням може використовувати `TELEGRAM_BOT_TOKEN`).
    - Для кількох ботів в одній групі Telegram запросіть кожного бота й згадайте того бота, який має відповісти.
    - Вимкніть BotFather Privacy Mode для кожного групового бота, а потім додайте бота повторно, щоб Telegram застосував налаштування.
    - Дозвольте групи за допомогою `channels.telegram.groups` або використовуйте `groupPolicy: "open"` лише для довірених групових розгортань.
    - Додайте ідентифікатори користувачів-відправників у `groupAllowFrom`. Ідентифікатори груп і супергруп належать до `channels.telegram.groups`, а не до `groupAllowFrom`.
    - Прив’язуйте за `accountId`, щоб кожен бот маршрутизувався до власного агента.

  </Accordion>
  <Accordion title="Номери WhatsApp для кожного агента">
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

  </Accordion>
</AccordionGroup>

## Поширені шаблони

<Tabs>
  <Tab title="Щоденний WhatsApp + глибока робота в Telegram">
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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    Примітки:

    - У цих прикладах використовується `accountId: "*"`, щоб прив’язки продовжували працювати, якщо ви пізніше додасте облікові записи.
    - Щоб маршрутизувати один DM/групу до Opus, залишаючи решту в чаті, додайте прив’язку `match.peer` для цього співрозмовника; збіги за співрозмовником завжди мають пріоритет над правилами для всього каналу.

  </Tab>
  <Tab title="Той самий канал, один співрозмовник до Opus">
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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Прив’язки співрозмовників завжди мають пріоритет, тому тримайте їх вище за правило для всього каналу.

  </Tab>
  <Tab title="Сімейний агент, прив’язаний до групи WhatsApp">
    Прив’яжіть окремого сімейного агента до однієї групи WhatsApp, із доступом через згадку та суворішою політикою інструментів:

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

    - Списки дозволених/заборонених інструментів — це **інструменти**, а не Skills. Якщо Skills потрібно запустити виконуваний файл, переконайтеся, що `exec` дозволено, а виконуваний файл існує в пісочниці.
    - Для суворішого доступу задайте `agents.list[].groupChat.mentionPatterns` і залиште ввімкненими списки дозволених груп для каналу.

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
`setupCommand` розміщено в `sandbox.docker` і він виконується один раз під час створення контейнера. Перевизначення `sandbox.docker.*` для окремого агента ігноруються, коли визначена область дії — `"shared"`.
</Note>

**Переваги:**

- **Ізоляція безпеки**: обмежуйте інструменти для недовірених агентів.
- **Контроль ресурсів**: запускайте окремих агентів у пісочниці, залишаючи інших на хості.
- **Гнучкі політики**: різні дозволи для кожного агента.

<Note>
`tools.elevated` є **глобальним** і залежить від відправника; його не можна налаштувати для кожного агента окремо. Якщо вам потрібні межі для кожного агента, використовуйте `agents.list[].tools`, щоб заборонити `exec`. Для націлювання в групах використовуйте `agents.list[].groupChat.mentionPatterns`, щоб @згадки чітко відповідали потрібному агенту.
</Note>

Дивіться [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) для докладних прикладів.

## Пов’язане

- [Агенти ACP](/uk/tools/acp-agents) — запуск зовнішніх середовищ для кодування
- [Маршрутизація каналів](/uk/channels/channel-routing) — як повідомлення маршрутизуються до агентів
- [Присутність](/uk/concepts/presence) — присутність і доступність агента
- [Сесія](/uk/concepts/session) — ізоляція та маршрутизація сесій
- [Субагенти](/uk/tools/subagents) — запуск фонових виконань агента
