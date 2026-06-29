---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Маршрутизация нескольких агентов: изолированные агенты, учетные записи каналов и привязки'
title: Маршрутизация нескольких агентов
x-i18n:
    generated_at: "2026-06-28T22:50:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

Запускайте несколько _изолированных_ агентов — каждый со своим рабочим пространством, каталогом состояния (`agentDir`) и историей сеансов — а также несколько учетных записей каналов (например, два WhatsApp) в одном работающем Gateway. Входящие сообщения маршрутизируются к нужному агенту через привязки.

Здесь **агент** — это полный контекст отдельной персоны: файлы рабочего пространства, профили аутентификации, реестр моделей и хранилище сеансов. `agentDir` — это каталог состояния на диске, в котором хранится эта конфигурация отдельного агента по пути `~/.openclaw/agents/<agentId>/`. **Привязка** сопоставляет учетную запись канала (например, рабочее пространство Slack или номер WhatsApp) с одним из этих агентов.

## Что такое «один агент»?

**Агент** — это полностью ограниченный по области «мозг» со своими:

- **Рабочим пространством** (файлы, AGENTS.md/SOUL.md/USER.md, локальные заметки, правила персоны).
- **Каталогом состояния** (`agentDir`) для профилей аутентификации, реестра моделей и конфигурации отдельного агента.
- **Хранилищем сеансов** (история чата + состояние маршрутизации) в `~/.openclaw/agents/<agentId>/sessions`.

Профили аутентификации являются **отдельными для каждого агента**. Каждый агент читает их из своего файла:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` здесь тоже является более безопасным путем воспоминаний между сеансами: он возвращает ограниченное и очищенное представление, а не сырой дамп стенограммы. Воспоминания ассистента удаляют теги размышлений, каркас `<relevant-memories>`, XML-нагрузки вызовов инструментов в обычном тексте (включая `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` и обрезанные блоки вызовов инструментов), пониженный каркас вызовов инструментов, утекшие ASCII/полноширинные управляющие токены модели и некорректный XML вызовов инструментов MiniMax перед редактированием/обрезкой.
</Note>

<Warning>
Никогда не используйте один и тот же `agentDir` для разных агентов (это вызывает коллизии аутентификации/сеансов). Агенты
могут дочитывать профили аутентификации агента по умолчанию/основного агента, если у них нет
локального профиля, но OpenClaw не клонирует refresh-токены OAuth в
хранилище вторичного агента. Если вам нужна независимая учетная запись OAuth, войдите
из этого агента; если вы копируете учетные данные вручную, копируйте только переносимые статические
профили `api_key` или `token`.
</Warning>

Skills загружаются из рабочего пространства каждого агента плюс из общих корней, таких как `~/.openclaw/skills`, затем фильтруются по эффективному списку разрешенных Skills агента, если он настроен. Используйте `agents.defaults.skills` для общей базы и `agents.list[].skills` для замены на уровне агента. См. [Skills: для отдельного агента и общие](/ru/tools/skills#per-agent-vs-shared-skills) и [Skills: списки разрешенных Skills агента](/ru/tools/skills#agent-allowlists).

Gateway может размещать **одного агента** (по умолчанию) или **много агентов** рядом друг с другом.

<Note>
**Примечание о рабочем пространстве:** рабочее пространство каждого агента является **cwd по умолчанию**, а не жесткой песочницей. Относительные пути разрешаются внутри рабочего пространства, но абсолютные пути могут достигать других мест на хосте, если песочница не включена. См. [Песочница](/ru/gateway/sandboxing).
</Note>

## Пути (краткая карта)

- Конфигурация: `~/.openclaw/openclaw.json` (или `OPENCLAW_CONFIG_PATH`)
- Каталог состояния: `~/.openclaw` (или `OPENCLAW_STATE_DIR`)
- Рабочее пространство: `~/.openclaw/workspace` (или `~/.openclaw/workspace-<agentId>`)
- Каталог агента: `~/.openclaw/agents/<agentId>/agent` (или `agents.list[].agentDir`)
- Сеансы: `~/.openclaw/agents/<agentId>/sessions`

### Режим одного агента (по умолчанию)

Если вы ничего не настраиваете, OpenClaw запускает одного агента:

- `agentId` по умолчанию равен **`main`**.
- Сеансы получают ключи вида `agent:main:<mainKey>`.
- Рабочее пространство по умолчанию — `~/.openclaw/workspace` (или `~/.openclaw/workspace-<profile>`, когда задан `OPENCLAW_PROFILE`).
- Состояние по умолчанию — `~/.openclaw/agents/main/agent`.

## Помощник агентов

Используйте мастер агентов, чтобы добавить нового изолированного агента:

```bash
openclaw agents add work
```

Затем добавьте `bindings` (или позвольте мастеру сделать это), чтобы маршрутизировать входящие сообщения.

Проверьте с помощью:

```bash
openclaw agents list --bindings
```

## Быстрый старт

<Steps>
  <Step title="Создайте рабочее пространство каждого агента">
    Используйте мастер или создайте рабочие пространства вручную:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Каждый агент получает собственное рабочее пространство с `SOUL.md`, `AGENTS.md` и необязательным `USER.md`, а также выделенный `agentDir` и хранилище сеансов в `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Создайте учетные записи каналов">
    Создайте по одной учетной записи на агента в предпочитаемых каналах:

    - Discord: один бот на агента, включите Message Content Intent, скопируйте каждый токен.
    - Telegram: один бот на агента через BotFather, скопируйте каждый токен.
    - WhatsApp: привяжите каждый номер телефона к отдельной учетной записи.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    См. руководства по каналам: [Discord](/ru/channels/discord), [Telegram](/ru/channels/telegram), [WhatsApp](/ru/channels/whatsapp).

  </Step>
  <Step title="Добавьте агентов, учетные записи и привязки">
    Добавьте агентов в `agents.list`, учетные записи каналов в `channels.<channel>.accounts` и соедините их с помощью `bindings` (примеры ниже).
  </Step>
  <Step title="Перезапустите и проверьте">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Несколько агентов = несколько людей, несколько личностей

С **несколькими агентами** каждый `agentId` становится **полностью изолированной персоной**:

- **Разные номера телефонов/учетные записи** (по `accountId` канала).
- **Разные личности** (файлы рабочего пространства отдельного агента, например `AGENTS.md` и `SOUL.md`).
- **Отдельные аутентификация + сеансы** (без перекрестного общения, если оно явно не включено).

Это позволяет **нескольким людям** совместно использовать один сервер Gateway, сохраняя изоляцию их AI-«мозгов» и данных.

## Поиск памяти QMD между агентами

Если один агент должен искать в стенограммах сеансов QMD другого агента, добавьте дополнительные коллекции в `agents.list[].memorySearch.qmd.extraCollections`. Используйте `agents.defaults.memorySearch.qmd.extraCollections` только когда каждый агент должен наследовать одинаковые общие коллекции стенограмм.

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

Путь дополнительной коллекции может быть общим для нескольких агентов, но имя коллекции остается явным, когда путь находится вне рабочего пространства агента. Пути внутри рабочего пространства остаются ограниченными агентом, чтобы каждый агент сохранял собственный набор поиска по стенограммам.

## Один номер WhatsApp, несколько людей (разделение DM)

Вы можете маршрутизировать **разные DM WhatsApp** разным агентам, оставаясь в **одной учетной записи WhatsApp**. Сопоставляйте по отправителю E.164 (например, `+15551234567`) с `peer.kind: "direct"`. Ответы все равно приходят с того же номера WhatsApp (без отдельной идентичности отправителя на агента).

<Note>
Прямые чаты сворачиваются в **основной ключ сеанса** агента, поэтому для настоящей изоляции требуется **один агент на человека**.
</Note>

Пример:

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

Примечания:

- Контроль доступа к DM является **глобальным для учетной записи WhatsApp** (сопряжение/allowlist), а не отдельным для агента.
- Для общих групп привяжите группу к одному агенту или используйте [Группы рассылки](/ru/channels/broadcast-groups).

## Правила маршрутизации (как сообщения выбирают агента)

Привязки являются **детерминированными**, и **побеждает самая специфичная**:

<Steps>
  <Step title="совпадение peer">
    Точный ID DM/группы/канала.
  </Step>
  <Step title="совпадение parentPeer">
    Наследование треда.
  </Step>
  <Step title="guildId + роли">
    Маршрутизация по ролям Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="совпадение accountId для канала">
    Резервный вариант на уровне учетной записи.
  </Step>
  <Step title="Совпадение на уровне канала">
    `accountId: "*"`.
  </Step>
  <Step title="Агент по умолчанию">
    Резервный переход к `agents.list[].default`, иначе первая запись списка, по умолчанию: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Разрешение ничьих и семантика AND">
    - Если несколько привязок совпадают на одном уровне, побеждает первая в порядке конфигурации.
    - Если привязка задает несколько полей совпадения (например, `peer` + `guildId`), требуются все указанные поля (семантика `AND`).

  </Accordion>
  <Accordion title="Детали области учетной записи">
    - Привязка, в которой опущен `accountId`, соответствует только учетной записи по умолчанию. Она не соответствует всем учетным записям.
    - Используйте `accountId: "*"` для резервного варианта на весь канал по всем учетным записям.
    - Используйте `accountId: "<name>"`, чтобы сопоставить одну учетную запись.
    - Если позже вы добавите такую же привязку для того же агента с явным ID учетной записи, OpenClaw обновит существующую привязку только к каналу до области учетной записи вместо ее дублирования.

  </Accordion>
</AccordionGroup>

## Несколько учетных записей / номеров телефонов

Каналы, поддерживающие **несколько учетных записей** (например, WhatsApp), используют `accountId` для идентификации каждого входа. Каждый `accountId` можно маршрутизировать к другому агенту, поэтому один сервер может размещать несколько номеров телефонов без смешивания сеансов.

Если вам нужна учетная запись по умолчанию на уровне канала, когда `accountId` опущен, задайте `channels.<channel>.defaultAccount` (необязательно). Если значение не задано, OpenClaw использует `default`, если он присутствует, иначе первый настроенный ID учетной записи (после сортировки).

Распространенные каналы, поддерживающие этот шаблон, включают:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Основные понятия

- `agentId`: один «мозг» (рабочее пространство, аутентификация отдельного агента, хранилище сеансов отдельного агента).
- `accountId`: один экземпляр учетной записи канала (например, учетная запись WhatsApp `"personal"` и `"biz"`).
- `binding`: маршрутизирует входящие сообщения к `agentId` по `(channel, accountId, peer)` и необязательно по ID guild/team.
- Прямые чаты сворачиваются в `agent:<agentId>:<mainKey>` («основной» для отдельного агента; `session.mainKey`).

## Примеры платформ

<AccordionGroup>
  <Accordion title="Боты Discord на каждого агента">
    Каждая учетная запись бота Discord сопоставляется с уникальным `accountId`. Привяжите каждую учетную запись к агенту и держите allowlist отдельно для каждого бота.

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
    - Токены находятся в `channels.discord.accounts.<id>.token` (учетная запись по умолчанию может использовать `DISCORD_BOT_TOKEN`).

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

    - Создайте по одному боту на агента через BotFather и скопируйте каждый токен.
    - Токены находятся в `channels.telegram.accounts.<id>.botToken` (учетная запись по умолчанию может использовать `TELEGRAM_BOT_TOKEN`).
    - Для нескольких ботов в одной группе Telegram пригласите каждого бота и упомяните бота, который должен отвечать.
    - Отключите BotFather Privacy Mode для каждого группового бота, затем добавьте бота повторно, чтобы Telegram применил настройку.
    - Разрешите группы через `channels.telegram.groups` или используйте `groupPolicy: "open"` только для доверенных групповых развертываний.
    - Поместите пользовательские ID отправителей в `groupAllowFrom`. ID групп и супергрупп должны быть в `channels.telegram.groups`, а не в `groupAllowFrom`.
    - Выполните привязку по `accountId`, чтобы каждый бот маршрутизировался к своему агенту.

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    Свяжите каждую учетную запись перед запуском gateway:

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

## Распространенные шаблоны

<Tabs>
  <Tab title="WhatsApp daily + Telegram deep work">
    Разделение по каналам: маршрутизируйте WhatsApp к быстрому повседневному агенту, а Telegram — к агенту Opus.

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

    Примечания:

    - В этих примерах используется `accountId: "*"`, поэтому привязки продолжат работать, если вы добавите учетные записи позже.
    - Чтобы маршрутизировать один DM/группу к Opus, оставив остальные чаты на агенте chat, добавьте привязку `match.peer` для этого собеседника; совпадения по собеседнику всегда имеют приоритет над правилами для всего канала.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    Оставьте WhatsApp на быстром агенте, но маршрутизируйте один DM к Opus:

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

    Привязки собеседников всегда имеют приоритет, поэтому держите их выше правила для всего канала.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Привяжите выделенного семейного агента к одной группе WhatsApp, с ограничением по упоминаниям и более строгой политикой инструментов:

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

    Примечания:

    - Списки разрешения/запрета инструментов относятся к **инструментам**, а не к Skills. Если Skills нужно запустить бинарный файл, убедитесь, что `exec` разрешен и бинарный файл существует в песочнице.
    - Для более строгого ограничения задайте `agents.list[].groupChat.mentionPatterns` и оставьте списки разрешенных групп включенными для канала.

  </Tab>
</Tabs>

## Песочница и конфигурация инструментов для каждого агента

У каждого агента могут быть собственная песочница и ограничения инструментов:

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
`setupCommand` находится в `sandbox.docker` и выполняется один раз при создании контейнера. Переопределения `sandbox.docker.*` для отдельного агента игнорируются, когда разрешенная область равна `"shared"`.
</Note>

**Преимущества:**

- **Изоляция безопасности**: ограничивайте инструменты для недоверенных агентов.
- **Контроль ресурсов**: помещайте отдельных агентов в песочницу, оставляя других на хосте.
- **Гибкие политики**: разные разрешения для каждого агента.

<Note>
`tools.elevated` является **глобальной** настройкой и зависит от отправителя; ее нельзя настраивать для отдельного агента. Если вам нужны границы на уровне агента, используйте `agents.list[].tools`, чтобы запретить `exec`. Для адресации в группах используйте `agents.list[].groupChat.mentionPatterns`, чтобы @упоминания корректно сопоставлялись с нужным агентом.
</Note>

Подробные примеры см. в разделе [Песочница и инструменты для нескольких агентов](/ru/tools/multi-agent-sandbox-tools).

## Связанные разделы

- [Агенты ACP](/ru/tools/acp-agents) — запуск внешних сред кодирования
- [Маршрутизация каналов](/ru/channels/channel-routing) — как сообщения маршрутизируются к агентам
- [Присутствие](/ru/concepts/presence) — присутствие и доступность агента
- [Сессия](/ru/concepts/session) — изоляция и маршрутизация сессий
- [Субагенты](/ru/tools/subagents) — запуск фоновых выполнений агентов
