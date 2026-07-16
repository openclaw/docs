---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Маршрутизація між кількома агентами: межі агентів, облікові записи каналів і прив’язки'
title: Маршрутизація між кількома агентами
x-i18n:
    generated_at: "2026-07-16T17:54:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Запускайте кілька _ізольованих_ агентів в одному процесі Gateway, кожен із власним робочим простором, каталогом стану (`agentDir`) та історією сеансів у SQLite, а також кілька облікових записів каналів (наприклад, два номери WhatsApp). Вхідні повідомлення спрямовуються до відповідного агента через **прив’язки**.

**Агент** — це повна область окремої персони: файли робочого простору, профілі автентифікації, реєстр моделей і сховище сеансів. **Прив’язка** зіставляє обліковий запис каналу (робочий простір Slack, номер WhatsApp тощо) з одним із цих агентів.

## Що таке один агент

Кожен агент має власні:

- **Робочий простір**: файли, `AGENTS.md`/`SOUL.md`/`USER.md`, локальні нотатки, правила персони.
- **Каталог стану** (`agentDir`): профілі автентифікації, реєстр моделей, конфігурація окремого агента.
- **Сховище сеансів**: історія чатів і стан маршрутизації в `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Профілі автентифікації належать окремим агентам і зчитуються з:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` — безпечніший спосіб відновлення контексту між сеансами: він повертає обмежене, відредаговане подання, а не повний необроблений дамп транскрипту. Він вилучає сигнатури блоків міркувань, подробиці корисного навантаження результатів інструментів, службову структуру `<relevant-memories>`, XML-теги викликів інструментів (`<tool_call>`, `<function_call>` та їхні множинні/понижені форми) і XML викликів інструментів MiniMax, після чого скорочує та обмежує виведення за розміром у байтах.
</Note>

<Warning>
Ніколи не використовуйте `agentDir` повторно для різних агентів — це спричиняє колізії стану автентифікації та сеансів. Коли локальні облікові дані OAuth другорядного агента прострочені або їх оновлення не вдається, OpenClaw звертається до облікових даних типового/головного агента для того самого ідентифікатора профілю та приймає найновіший токен, не копіюючи токен оновлення до сховища другорядного агента. Якщо потрібен повністю незалежний обліковий запис OAuth, увійдіть у нього від імені цього агента. Якщо копіюєте облікові дані вручну, копіюйте лише переносні статичні профілі `api_key` або `token` — матеріали оновлення OAuth типово не є переносними (`copyToAgents` дає змогу явно дозволити це для профілю).
</Warning>

Skills завантажуються з робочого простору кожного агента та зі спільних коренів, як-от `~/.openclaw/skills`, а потім фільтруються за чинним списком дозволених навичок агента. Використовуйте `agents.defaults.skills` для спільної базової конфігурації та `agents.list[].skills` для заміни на рівні агента (явні записи замінюють типові, а не об’єднуються з ними). Див. [Skills: для окремих агентів і спільні](/uk/tools/skills#per-agent-vs-shared-skills) та [Skills: списки дозволів агентів](/uk/tools/skills#agent-allowlists).

Сховище, яким володіє Plugin, відповідає конфігурації цього Plugin; додавання другого агента не розділяє автоматично кожне глобальне сховище Plugin. Наприклад, налаштуйте [сховища Memory Wiki для окремих агентів](/uk/concepts/multi-agent#per-agent-memory-wiki-vaults), коли персони не повинні спільно використовувати скомпільовані знання вікі.

<Note>
**Примітка про робочий простір:** робочий простір кожного агента є **типовим cwd**, а не жорсткою пісочницею. Відносні шляхи визначаються в межах робочого простору, але абсолютні шляхи можуть надавати доступ до інших розташувань на хості, якщо пісочницю не ввімкнено. Див. [Пісочниця](/uk/gateway/sandboxing).
</Note>

## Шляхи

| Що                              | Типове значення                                                                         | Перевизначення                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Конфігурація                     | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Каталог стану                    | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Робочий простір типового агента  | `~/.openclaw/workspace` (або `workspace-<profile>`, коли встановлено `OPENCLAW_PROFILE`)      | `agents.list[].workspace`, потім `agents.defaults.workspace` або `OPENCLAW_WORKSPACE_DIR` |
| Робочий простір інших агентів    | `<stateDir>/workspace-<agentId>` (або `<agents.defaults.workspace>/<agentId>`, коли встановлено) | `agents.list[].workspace`                                                                |
| Каталог агента                   | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Сеанси й транскрипти             | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Застарілі/архівні артефакти сеансів | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Режим одного агента (типовий)

Якщо нічого не налаштовувати, OpenClaw запускає одного агента:

- `agentId` типово має значення `main`.
- Ключ сеансів має вигляд `agent:main:<mainKey>` (типовий `mainKey` — `main`).
- Робочий простір типово має значення `~/.openclaw/workspace` (або `workspace-<profile>`, коли `OPENCLAW_PROFILE` має значення, відмінне від `default`).
- Стан типово зберігається в `~/.openclaw/agents/main/agent`.

## Допоміжний засіб для агентів

Додайте нового ізольованого агента:

```bash
openclaw agents add work
```

Прапорці: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (можна повторювати), `--non-interactive` (потребує `--workspace`).

Додайте `bindings`, щоб маршрутизувати вхідні повідомлення (майстер запропонує зробити це), а потім перевірте:

```bash
openclaw agents list --bindings
```

## Швидкий початок

<Steps>
  <Step title="Створіть робочий простір для кожного агента">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Кожен агент отримує власний робочий простір із `SOUL.md`, `AGENTS.md` та необов’язковим `USER.md`, а також окремий `agentDir` і сховище сеансів у `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Створіть облікові записи каналів">
    Створіть по одному обліковому запису для кожного агента у вибраних каналах:

    - Discord: окремий бот для кожного агента; увімкніть Message Content Intent і скопіюйте кожен токен.
    - Telegram: окремий бот для кожного агента через BotFather; скопіюйте кожен токен.
    - WhatsApp: прив’яжіть окремий номер телефону до кожного облікового запису.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Див. посібники з каналів: [Discord](/uk/channels/discord), [Telegram](/uk/channels/telegram), [WhatsApp](/uk/channels/whatsapp).

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

## Кілька агентів, кілька персон

Кожен налаштований `agentId` є окремою межею персони для основного стану агента:

- Різні облікові записи для кожного каналу (за `accountId`).
- Різні особистості (`AGENTS.md`/`SOUL.md` для кожного агента).
- Окремі автентифікація та сеанси; міжагентний доступ вмикається лише через явно визначені функції або конфігурацію Plugin.

Це дає змогу кільком людям спільно використовувати один Gateway, зберігаючи основний стан агентів розділеним.

## Сховища Memory Wiki для окремих агентів

Memory Wiki типово використовує одне глобальне сховище. Щоб зберігати скомпільовані знання агента підтримки окремо від знань маркетингового агента, установіть для `plugins.entries.memory-wiki.config.vault.scope` значення `agent`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

Налаштований шлях є батьківським каталогом. OpenClaw додає нормалізований ідентифікатор агента, утворюючи такі шляхи, як `~/.openclaw/wiki/support` і `~/.openclaw/wiki/marketing`. Операції CLI та Gateway в області агента потребують явного зазначення агента, коли налаштовано кількох агентів. Докладніше про фільтрацію мосту, міграцію та межі довіри див. у розділі [Сховища Memory Wiki для окремих агентів](/uk/plugins/memory-wiki#per-agent-vaults).

## Міжагентний пошук у пам’яті QMD

Щоб один агент міг шукати в транскриптах сеансів QMD іншого агента, додайте додаткові колекції в `agents.list[].memorySearch.qmd.extraCollections`. Використовуйте `agents.defaults.memorySearch.qmd.extraCollections`, коли всі агенти повинні спільно використовувати ті самі колекції.

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
            extraCollections: [{ path: "notes" }], // визначається в межах робочого простору -> колекція з назвою "notes-main"
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

Шлях додаткової колекції може бути спільним для кількох агентів, але його `name` залишається явним, коли шлях розташований поза робочим простором агента. Шляхи в межах робочого простору залишаються прив’язаними до агента, щоб кожен агент мав власний набір пошуку транскриптів.

## Один номер WhatsApp, кілька людей (розподіл особистих повідомлень)

Спрямовуйте різні особисті повідомлення WhatsApp до різних агентів в **одному** обліковому записі WhatsApp, зіставляючи відправника E.164 (`+15551234567`) за допомогою `peer.kind: "direct"`. Відповіді все одно надходять із того самого номера WhatsApp — окремої ідентичності відправника для кожного агента немає.

<Note>
Типово особисті чати об’єднуються в ключ головного сеансу агента, тому для справжньої ізоляції потрібен окремий агент для кожної людини.
</Note>

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

Керування доступом до особистих повідомлень (сполучення/список дозволених) є глобальним для облікового запису WhatsApp, а не окремим для кожного агента. Для спільних груп прив’яжіть групу до одного агента або використовуйте [Групи трансляції](/uk/channels/broadcast-groups).

## Правила маршрутизації

Прив’язки детерміновані, і перемагає найконкретніша. Повний порядок рівнів (точний співрозмовник, батьківський співрозмовник, шаблон співрозмовника, сервер+ролі, сервер, команда, обліковий запис, канал, типовий агент) див. у розділі [Маршрутизація каналів](/uk/channels/channel-routing#routing-rules-how-an-agent-is-chosen). Тут варто окремо зазначити кілька правил:

- Якщо в межах одного рівня збігається кілька прив’язок, перемагає перша в порядку конфігурації.
- Якщо прив’язка задає кілька полів зіставлення (наприклад, `peer` + `guildId`), усі зазначені поля мають збігатися (семантика `AND`).
- Прив’язка без `accountId` відповідає лише типовому обліковому запису, а не всім обліковим записам. Використовуйте `accountId: "*"` як резервний варіант для всього каналу або `accountId: "<name>"` для одного облікового запису. Повторне додавання тієї самої прив’язки з явним ідентифікатором облікового запису оновлює наявну прив’язку лише до каналу, а не дублює її.

## Кілька облікових записів / номерів телефонів

Канали, які підтримують кілька облікових записів (наприклад, WhatsApp), використовують `accountId` для ідентифікації кожного входу. Кожен `accountId` спрямовується до власного агента, тому один сервер може обслуговувати кілька номерів телефонів без змішування сеансів.

Встановіть `channels.<channel>.defaultAccount`, щоб вибрати обліковий запис, який використовується, коли `accountId` не вказано. Якщо значення не задано, OpenClaw використовує `default`, якщо він наявний, інакше — ідентифікатор першого налаштованого облікового запису (після сортування).

Канали з підтримкою кількох облікових записів: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Поняття

- `agentId`: один «мозок» (робочий простір, автентифікація окремого агента, сховище сеансів окремого агента).
- `accountId`: один екземпляр облікового запису каналу (наприклад, обліковий запис WhatsApp `personal` на відміну від `biz`).
- `binding`: спрямовує вхідні повідомлення до `agentId` за `(channel, accountId, peer)` і, за потреби, за ідентифікаторами гільдії/команди.
- Особисті чати зводяться до `agent:<agentId>:<mainKey>` («основного» для окремого агента; див. `session.mainKey`).

## Приклади для платформ

<AccordionGroup>
  <Accordion title="Боти Discord для кожного агента">
    Кожен обліковий запис бота Discord зіставляється з унікальним `accountId`. Прив’яжіть кожен обліковий запис до агента й ведіть окремі списки дозволених значень для кожного бота.

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

    - Створіть окремого бота для кожного агента за допомогою BotFather і скопіюйте кожен токен.
    - Токени зберігаються в `channels.telegram.accounts.<id>.botToken` (обліковий запис за замовчуванням може використовувати `TELEGRAM_BOT_TOKEN`).
    - Якщо в одній групі Telegram є кілька ботів, запросіть кожного з них і згадайте того, який має відповісти.
    - Вимкніть Privacy Mode у BotFather для кожного групового бота (`/setprivacy` -> Disable), а потім видаліть і повторно додайте бота, щоб Telegram застосував налаштування.
    - Дозволяйте групи за допомогою `channels.telegram.groups` або використовуйте `groupPolicy: "open"` лише для розгортань у довірених групах.
    - Додайте ідентифікатори користувачів-відправників до `groupAllowFrom`. Ідентифікатори груп і супергруп слід додавати до `channels.telegram.groups`, а не до `groupAllowFrom`.
    - Виконайте прив’язування за `accountId`, щоб кожен бот спрямовував повідомлення до свого агента.

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

      // Детермінізована маршрутизація: перший збіг має пріоритет (спочатку найточніші).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Необов’язкове перевизначення для окремого співрозмовника (приклад: спрямувати певну групу до робочого агента).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // За замовчуванням вимкнено: обмін повідомленнями між агентами потрібно явно ввімкнути та додати до списку дозволених значень.
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
              // Необов’язкове перевизначення. За замовчуванням: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Необов’язкове перевизначення. За замовчуванням: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp для щоденних завдань і Telegram для поглибленої роботи">
    Розділіть за каналами: спрямовуйте WhatsApp до швидкого агента для повсякденних завдань, а Telegram — до агента Opus.

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

    У цих прикладах використовується `accountId: "*"`, тому прив’язки продовжать працювати, якщо згодом додати облікові записи. Щоб спрямувати один особистий чат або групу до Opus, залишивши решту на агенті чату, додайте прив’язку `match.peer` для цього співрозмовника — збіги за співрозмовником завжди мають пріоритет над правилами для всього каналу.

  </Tab>
  <Tab title="Той самий канал, один співрозмовник для Opus">
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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Прив’язки за співрозмовником завжди мають пріоритет, тому розміщуйте їх перед правилом для всього каналу.

  </Tab>
  <Tab title="Сімейний агент, прив’язаний до групи WhatsApp">
    Прив’яжіть окремого сімейного агента до однієї групи WhatsApp із вимогою згадки та суворішою політикою інструментів:

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

    Списки дозволених і заборонених інструментів стосуються **інструментів**, а не Skills. Якщо навичці потрібно запустити виконуваний файл, переконайтеся, що `exec` дозволено, а виконуваний файл наявний у пісочниці. Для суворішого контролю встановіть `agents.list[].groupChat.mentionPatterns` і залиште списки дозволених груп увімкненими для каналу.

  </Tab>
</Tabs>

## Налаштування пісочниці та інструментів для кожного агента

Кожен агент може мати власну пісочницю й обмеження інструментів:

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
          allow: ["read"],                    // Лише інструмент читання
          deny: ["exec", "write", "edit", "apply_patch"],    // Заборонити інші
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` міститься в `sandbox.docker` і виконується один раз під час створення контейнера. Перевизначення `sandbox.docker.*` для окремих агентів ігноруються, якщо визначена область — `"shared"`.
</Note>

Це надає:

- **Ізоляцію безпеки**: обмеження інструментів для недовірених агентів.
- **Керування ресурсами**: запуск окремих агентів у пісочниці, тоді як інші працюють на хості.
- **Гнучкі політики**: різні дозволи для кожного агента.

<Note>
`tools.elevated` має як глобальну перевірку (`tools.elevated.enabled`/`allowFrom`), так і перевірку для окремого агента (`agents.list[].tools.elevated.enabled`/`allowFrom`). Перевірка для окремого агента може лише додатково обмежити глобальну — обидві мають дозволяти відправника, щоб команди з підвищеними привілеями могли виконуватися. Для вибору агента в групі використовуйте `agents.list[].groupChat.mentionPatterns`, щоб @згадки однозначно зіставлялися з потрібним агентом.
</Note>

Докладні приклади див. у розділі [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools).

## Пов’язані матеріали

- [Агенти ACP](/uk/tools/acp-agents) — запуск зовнішніх середовищ для програмування
- [Маршрутизація каналів](/uk/channels/channel-routing) — як повідомлення спрямовуються до агентів
- [Присутність](/uk/concepts/presence) — присутність і доступність агента
- [Сеанс](/uk/concepts/session) — ізоляція та маршрутизація сеансів
- [Підагентів](/uk/tools/subagents) — запуск фонових виконань агентів
