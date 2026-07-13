---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Маршрутизация нескольких агентов: границы агентов, учетные записи каналов и привязки'
title: Маршрутизация между несколькими агентами
x-i18n:
    generated_at: "2026-07-13T19:43:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Запускайте несколько _изолированных_ агентов в одном процессе Gateway, каждый со своей рабочей областью, каталогом состояния (`agentDir`) и хранящейся в SQLite историей сеансов, а также несколькими учётными записями каналов (например, двумя номерами WhatsApp). Входящие сообщения направляются нужному агенту посредством **привязок**.

**Агент** — это полная область отдельной персоны: файлы рабочей области, профили аутентификации, реестр моделей и хранилище сеансов. **Привязка** сопоставляет учётную запись канала (рабочую область Slack, номер WhatsApp и т. д.) с одним из этих агентов.

## Что представляет собой один агент

У каждого агента есть собственные:

- **Рабочая область**: файлы, `AGENTS.md`/`SOUL.md`/`USER.md`, локальные заметки, правила персоны.
- **Каталог состояния** (`agentDir`): профили аутентификации, реестр моделей, конфигурация отдельного агента.
- **Хранилище сеансов**: история чатов и состояние маршрутизации в `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Профили аутентификации относятся к отдельным агентам и считываются из:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` — более безопасный способ обращения к данным из других сеансов: он возвращает ограниченное и отредактированное представление, а не необработанную выгрузку стенограммы. Он удаляет сигнатуры блоков рассуждений, подробности содержимого результатов инструментов, служебную структуру `<relevant-memories>`, XML-теги вызовов инструментов (`<tool_call>`, `<function_call>`, а также их формы множественного числа и пониженной версии) и XML вызовов инструментов MiniMax, после чего обрезает вывод и ограничивает его размер в байтах.
</Note>

<Warning>
Никогда не используйте `agentDir` повторно для разных агентов — это приводит к конфликтам состояния аутентификации и сеансов. Если срок действия локальных учётных данных OAuth дополнительного агента истёк или их обновление завершилось сбоем, OpenClaw обращается к учётным данным агента по умолчанию/основного агента с тем же идентификатором профиля и использует наиболее свежий токен, не копируя токен обновления в хранилище дополнительного агента. Если вам нужна полностью независимая учётная запись OAuth, войдите в неё от имени этого агента. При ручном копировании учётных данных копируйте только переносимые статические профили `api_key` или `token` — данные обновления OAuth по умолчанию непереносимы (`copyToAgents` позволяет явно включить такую возможность для профиля).
</Warning>

Skills загружаются из рабочей области каждого агента и общих корневых каталогов, таких как `~/.openclaw/skills`, после чего фильтруются по действующему списку разрешённых Skills агента. Используйте `agents.defaults.skills` для общей базовой конфигурации и `agents.list[].skills` для замены на уровне отдельного агента (явно заданные элементы заменяют значения по умолчанию, а не объединяются с ними). См. [Skills: для отдельных агентов и общие](/ru/tools/skills#per-agent-vs-shared-skills) и [Skills: списки разрешений агентов](/ru/tools/skills#agent-allowlists).

Хранилище, принадлежащее плагину, подчиняется конфигурации этого плагина; добавление второго агента
не приводит к автоматическому разделению всех глобальных хранилищ плагинов. Например, настройте
[хранилища Memory Wiki для отдельных агентов](/ru/concepts/multi-agent#per-agent-memory-wiki-vaults),
если персоны не должны совместно использовать скомпилированные знания вики.

<Note>
**Примечание о рабочей области:** рабочая область каждого агента является **рабочим каталогом по умолчанию**, а не строгой песочницей. Относительные пути разрешаются внутри рабочей области, однако абсолютные пути могут обращаться к другим расположениям на узле, если песочница не включена. См. [Песочница](/ru/gateway/sandboxing).
</Note>

## Пути

| Что                              | По умолчанию                                                                           | Переопределение                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Конфигурация                     | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Каталог состояния                | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Рабочая область агента по умолчанию | `~/.openclaw/workspace` (или `workspace-<profile>`, если задано `OPENCLAW_PROFILE`)      | `agents.list[].workspace`, затем `agents.defaults.workspace` или `OPENCLAW_WORKSPACE_DIR` |
| Рабочая область других агентов   | `<stateDir>/workspace-<agentId>` (или `<agents.defaults.workspace>/<agentId>`, если задано) | `agents.list[].workspace`                                                                |
| Каталог агента                   | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Сеансы и стенограммы             | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Устаревшие/архивные артефакты сеансов | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Режим одного агента (по умолчанию)

Если ничего не настраивать, OpenClaw запускает одного агента:

- `agentId` по умолчанию имеет значение `main`.
- Ключи сеансов имеют вид `agent:main:<mainKey>` (значение `mainKey` по умолчанию — `main`).
- Рабочая область по умолчанию — `~/.openclaw/workspace` (или `workspace-<profile>`, если `OPENCLAW_PROFILE` имеет значение, отличное от `default`).
- Каталог состояния по умолчанию — `~/.openclaw/agents/main/agent`.

## Вспомогательная команда для агентов

Добавьте нового изолированного агента:

```bash
openclaw agents add work
```

Флаги: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (можно указывать несколько раз), `--non-interactive` (требует `--workspace`).

Добавьте `bindings` для маршрутизации входящих сообщений (мастер предложит сделать это за вас), затем проверьте:

```bash
openclaw agents list --bindings
```

## Быстрый старт

<Steps>
  <Step title="Создайте рабочую область для каждого агента">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Каждый агент получает собственную рабочую область с `SOUL.md`, `AGENTS.md` и необязательным `USER.md`, а также выделенный `agentDir` и хранилище сеансов в `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Создайте учётные записи каналов">
    Создайте по одной учётной записи для каждого агента в предпочитаемых каналах:

    - Discord: один бот для каждого агента; включите Message Content Intent и скопируйте каждый токен.
    - Telegram: создайте по одному боту для каждого агента через BotFather и скопируйте каждый токен.
    - WhatsApp: привяжите отдельный номер телефона к каждой учётной записи.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    См. руководства по каналам: [Discord](/ru/channels/discord), [Telegram](/ru/channels/telegram), [WhatsApp](/ru/channels/whatsapp).

  </Step>
  <Step title="Добавьте агентов, учётные записи и привязки">
    Добавьте агентов в `agents.list`, учётные записи каналов — в `channels.<channel>.accounts`, а затем свяжите их с помощью `bindings` (примеры приведены ниже).
  </Step>
  <Step title="Перезапустите и проверьте">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Несколько агентов, несколько персон

Каждый настроенный `agentId` образует отдельную границу персоны для основного состояния агента:

- Разные учётные записи для каждого канала (по `accountId`).
- Разные личности (задаются для каждого агента в `AGENTS.md`/`SOUL.md`).
- Раздельные данные аутентификации и сеансы; межагентный доступ включается только посредством явно заданных функций или конфигурации плагина.

Это позволяет нескольким людям совместно использовать один Gateway, сохраняя основное состояние агентов раздельным.

## Хранилища Memory Wiki для отдельных агентов

По умолчанию Memory Wiki использует одно глобальное хранилище. Чтобы отделить
скомпилированные знания агента поддержки от знаний маркетингового агента, задайте
для `plugins.entries.memory-wiki.config.vault.scope` значение `agent`:

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

Настроенный путь является родительским каталогом. OpenClaw добавляет к нему нормализованный
идентификатор агента, формируя пути наподобие `~/.openclaw/wiki/support` и
`~/.openclaw/wiki/marketing`. При наличии нескольких настроенных агентов операции CLI и Gateway,
относящиеся к отдельному агенту, требуют явно указать агента. Подробности о
фильтрации мостов, миграции и границах доверия см. в разделе
[Хранилища Memory Wiki для отдельных агентов](/ru/plugins/memory-wiki#per-agent-vaults).

## Межагентный поиск в памяти QMD

Чтобы один агент мог искать по стенограммам сеансов QMD другого агента, добавьте дополнительные коллекции в `agents.list[].memorySearch.qmd.extraCollections`. Используйте `agents.defaults.memorySearch.qmd.extraCollections`, если все агенты должны совместно использовать одинаковые коллекции.

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
            extraCollections: [{ path: "notes" }], // разрешается внутри рабочей области -> коллекция с именем "notes-main"
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

Путь дополнительной коллекции может совместно использоваться разными агентами, но его `name` остаётся явно заданным, если путь находится за пределами рабочей области агента. Пути внутри рабочей области сохраняют область отдельного агента, поэтому у каждого агента остаётся собственный набор поиска по стенограммам.

## Один номер WhatsApp, несколько людей (разделение личных сообщений)

Направляйте личные сообщения WhatsApp от разных отправителей разным агентам в рамках **одной** учётной записи WhatsApp, сопоставляя номер отправителя в формате E.164 (`+15551234567`) с `peer.kind: "direct"`. Ответы по-прежнему отправляются с одного и того же номера WhatsApp — отдельного идентификатора отправителя для каждого агента нет.

<Note>
По умолчанию личные чаты сводятся к ключу основного сеанса агента, поэтому для настоящей изоляции каждому человеку требуется отдельный агент.
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

Управление доступом к личным сообщениям (сопряжение/список разрешений) действует глобально для всей учётной записи WhatsApp, а не отдельно для каждого агента. Для общих групп привяжите группу к одному агенту или используйте [Группы широковещательной рассылки](/ru/channels/broadcast-groups).

## Правила маршрутизации

Привязки детерминированы: побеждает наиболее конкретная. Полный порядок уровней (точный собеседник, родительский собеседник, шаблон собеседника, сервер+роли, сервер, команда, учётная запись, канал, агент по умолчанию) приведён в разделе [Маршрутизация каналов](/ru/channels/channel-routing#routing-rules-how-an-agent-is-chosen). Здесь стоит отдельно отметить несколько правил:

- Если на одном уровне совпадают несколько привязок, побеждает первая в порядке конфигурации.
- Если в привязке задано несколько полей сопоставления (например, `peer` + `guildId`), должны совпасть все указанные поля (семантика `AND`).
- Привязка без `accountId` соответствует только учётной записи по умолчанию, а не всем учётным записям. Используйте `accountId: "*"` как резервное правило для всего канала или `accountId: "<name>"` для одной учётной записи. Повторное добавление той же привязки с явным идентификатором учётной записи обновляет существующую привязку только к каналу, а не создаёт её дубликат.

## Несколько учётных записей / телефонных номеров

Каналы, поддерживающие несколько учётных записей (например, WhatsApp), используют `accountId` для идентификации каждого входа. Каждый `accountId` направляется своему агенту, поэтому один сервер может обслуживать несколько телефонных номеров без смешивания сеансов.

Задайте `channels.<channel>.defaultAccount`, чтобы выбрать учётную запись, используемую, когда `accountId` не указано. Если значение не задано, OpenClaw использует `default`, если оно присутствует, а иначе — идентификатор первой настроенной учётной записи (после сортировки).

Каналы с поддержкой нескольких учётных записей: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Основные понятия

- `agentId`: один «мозг» (рабочее пространство, отдельная аутентификация и отдельное хранилище сеансов для каждого агента).
- `accountId`: один экземпляр учётной записи канала (например, учётная запись WhatsApp `personal` и `biz`).
- `binding`: направляет входящие сообщения агенту `agentId` по `(channel, accountId, peer)` и, при необходимости, по идентификаторам сервера или команды.
- Личные чаты объединяются в `agent:<agentId>:<mainKey>` (основной сеанс агента; см. `session.mainKey`).

## Примеры для платформ

<AccordionGroup>
  <Accordion title="Отдельный бот Discord для каждого агента">
    Каждая учётная запись бота Discord сопоставляется с уникальным `accountId`. Привяжите каждую учётную запись к агенту и настройте отдельные списки разрешённых пользователей для каждого бота.

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

    - Пригласите каждого бота на сервер и включите Message Content Intent.
    - Токены хранятся в `channels.discord.accounts.<id>.token` (учётная запись по умолчанию может использовать `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Отдельный бот Telegram для каждого агента">
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

    - Создайте в BotFather по одному боту для каждого агента и скопируйте каждый токен.
    - Токены хранятся в `channels.telegram.accounts.<id>.botToken` (учётная запись по умолчанию может использовать `TELEGRAM_BOT_TOKEN`).
    - Если в одной группе Telegram несколько ботов, пригласите каждого из них и упомяните того, который должен ответить.
    - Отключите BotFather Privacy Mode для каждого группового бота (`/setprivacy` -> Disable), затем удалите и повторно добавьте бота, чтобы Telegram применил настройку.
    - Разрешите группы с помощью `channels.telegram.groups` или используйте `groupPolicy: "open"` только для развёртываний в доверенных группах.
    - Добавьте идентификаторы пользователей-отправителей в `groupAllowFrom`. Идентификаторы групп и супергрупп должны находиться в `channels.telegram.groups`, а не в `groupAllowFrom`.
    - Выполните привязку по `accountId`, чтобы каждый бот направлял сообщения своему агенту.

  </Accordion>
  <Accordion title="Отдельный номер WhatsApp для каждого агента">
    Свяжите каждую учётную запись перед запуском Gateway:

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

      // Детерминированная маршрутизация: используется первое совпадение (сначала наиболее точное).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Необязательное переопределение для отдельного собеседника (пример: направить определённую группу рабочему агенту).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // По умолчанию отключено: обмен сообщениями между агентами необходимо явно включить и разрешить списком.
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
              // Необязательное переопределение. По умолчанию: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Необязательное переопределение. По умолчанию: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Распространённые схемы

<Tabs>
  <Tab title="WhatsApp для повседневных задач и Telegram для углублённой работы">
    Разделите по каналам: направляйте WhatsApp быстрому агенту для повседневных задач, а Telegram — агенту Opus.

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

    В этих примерах используется `accountId: "*"`, поэтому привязки продолжат работать, если позднее вы добавите учётные записи. Чтобы направить только один личный чат или группу агенту Opus, оставив остальные у агента чата, добавьте привязку `match.peer` для этого собеседника — совпадения по собеседнику всегда имеют приоритет над правилами для всего канала.

  </Tab>
  <Tab title="Тот же канал, один собеседник направляется агенту Opus">
    Оставьте WhatsApp у быстрого агента, но направьте один личный чат агенту Opus:

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

    Привязки по собеседнику всегда имеют приоритет, поэтому размещайте их перед правилом для всего канала.

  </Tab>
  <Tab title="Семейный агент, привязанный к группе WhatsApp">
    Привяжите отдельного семейного агента к одной группе WhatsApp, включив обработку только по упоминанию и установив более строгую политику инструментов:

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

    Списки разрешённых и запрещённых инструментов относятся к **инструментам**, а не к Skills. Если навыку требуется запустить исполняемый файл, убедитесь, что `exec` разрешено и этот файл существует в песочнице. Для более строгого контроля задайте `agents.list[].groupChat.mentionPatterns` и оставьте для канала включёнными списки разрешённых групп.

  </Tab>
</Tabs>

## Настройка песочницы и инструментов для каждого агента

Для каждого агента можно задать собственные ограничения песочницы и инструментов:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Для личного агента песочница не используется
        },
        // Ограничения инструментов отсутствуют — доступны все инструменты
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Всегда выполняется в песочнице
          scope: "agent",  // Один контейнер на агента
          docker: {
            // Необязательная однократная настройка после создания контейнера
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Только инструмент чтения
          deny: ["exec", "write", "edit", "apply_patch"],    // Запретить остальные
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` находится в `sandbox.docker` и выполняется один раз при создании контейнера. Переопределения `sandbox.docker.*` для отдельных агентов игнорируются, если вычисленная область действия равна `"shared"`.
</Note>

Это обеспечивает:

- **Изоляцию безопасности**: ограничивайте инструменты для недоверенных агентов.
- **Управление ресурсами**: запускайте отдельных агентов в песочнице, оставляя остальных на хосте.
- **Гибкие политики**: задавайте разные разрешения для каждого агента.

<Note>
`tools.elevated` имеет как глобальное ограничение (`tools.elevated.enabled`/`allowFrom`), так и ограничение для каждого агента (`agents.list[].tools.elevated.enabled`/`allowFrom`). Ограничение агента может лишь дополнительно ужесточить глобальное: чтобы разрешить выполнение команд с повышенными привилегиями, оба ограничения должны допускать отправителя. Для выбора агента в группе используйте `agents.list[].groupChat.mentionPatterns`, чтобы упоминания @ однозначно сопоставлялись с нужным агентом.
</Note>

Подробные примеры см. в разделе [Песочница и инструменты для нескольких агентов](/ru/tools/multi-agent-sandbox-tools).

## Связанные материалы

- [Агенты ACP](/ru/tools/acp-agents) — запуск внешних сред выполнения для программирования
- [Маршрутизация каналов](/ru/channels/channel-routing) — как сообщения направляются агентам
- [Присутствие](/ru/concepts/presence) — присутствие и доступность агента
- [Сеанс](/ru/concepts/session) — изоляция и маршрутизация сеансов
- [Субагенты](/ru/tools/subagents) — запуск фоновых выполнений агентов
