---
read_when:
    - Установка или настройка обвязки acpx для Claude Code / Codex / Gemini CLI
    - Включение MCP-моста plugin-tools или OpenClaw-tools
    - Настройка режимов разрешений ACP
summary: 'Настройка агентов ACP: конфигурация обвязки acpx, настройка Plugin, разрешения'
title: Агенты ACP — настройка
x-i18n:
    generated_at: "2026-06-28T23:49:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Обзор, рабочий регламент оператора и концепции см. в разделе [ACP-агенты](/ru/tools/acp-agents).

Разделы ниже описывают конфигурацию acpx harness, настройку Plugin для MCP-мостов и конфигурацию разрешений.

Используйте эту страницу только при настройке маршрута ACP/acpx. Для конфигурации нативной среды выполнения Codex
app-server используйте [Codex harness](/ru/plugins/codex-harness). Для
API-ключей OpenAI или конфигурации model-provider Codex OAuth используйте
[OpenAI](/ru/providers/openai).

У Codex есть два маршрута OpenClaw:

| Маршрут                      | Конфигурация/команда                                         | Страница настройки                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Нативный Codex app-server    | `/codex ...`, ссылки агентов `openai/gpt-*`                | [Codex harness](/ru/plugins/codex-harness) |
| Явный ACP-адаптер Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Эта страница                               |

Предпочитайте нативный маршрут, если вам явно не требуется поведение ACP/acpx.

## Поддержка acpx harness (текущая)

Текущие встроенные псевдонимы harness в acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `qwen`

Когда OpenClaw использует backend acpx, предпочитайте эти значения для `agentId`, если ваша конфигурация acpx не задает пользовательские псевдонимы агентов.
Если ваша локальная установка Cursor все еще предоставляет ACP как `agent acp`, переопределите команду агента `cursor` в вашей конфигурации acpx вместо изменения встроенного значения по умолчанию.

Прямое использование acpx CLI также может обращаться к произвольным адаптерам через `--agent <command>`, но этот прямой аварийный обход является возможностью acpx CLI (а не обычным путем OpenClaw `agentId`).

Управление моделью зависит от возможностей адаптера. Ссылки на модели Codex ACP
нормализуются OpenClaw перед запуском. Другим harness нужны ACP `models` и
поддержка `session/set_model`; если harness не предоставляет ни эту возможность ACP,
ни собственный флаг модели при запуске, OpenClaw/acpx не может принудительно выбрать модель.

## Обязательная конфигурация

Базовая конфигурация Core ACP:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "openclaw",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Конфигурация привязки тредов зависит от адаптера канала. Пример для Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnSessions: true,
      },
    },
  },
}
```

Если привязанный к треду запуск ACP не работает, сначала проверьте флаг возможности адаптера:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Привязки к текущему разговору не требуют создания дочернего треда. Для них нужны активный контекст разговора и адаптер канала, который предоставляет привязки разговоров ACP.

См. [Справочник по конфигурации](/ru/gateway/configuration-reference).

## Настройка Plugin для backend acpx

Пакетные установки используют официальный runtime Plugin `@openclaw/acpx` для ACP.
Установите и включите его перед использованием сессий ACP harness:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Исходные checkout также могут использовать локальный workspace Plugin после `pnpm install`.

Начните с:

```text
/acp doctor
```

Если вы отключили `acpx`, запретили его через `plugins.allow` / `plugins.deny` или хотите
вернуться к пакетному Plugin, используйте явный путь пакета:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Локальная workspace-установка во время разработки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Затем проверьте состояние backend:

```text
/acp doctor
```

### Конфигурация команды и версии acpx

По умолчанию Plugin `acpx` регистрирует встроенный ACP backend во время запуска Gateway
и ждет probe запуска встроенной среды выполнения перед сигналом Gateway
`ready`. Устанавливайте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` или
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` только для скриптов или окружений, где
probe запуска намеренно отключен. Запустите `/acp doctor` для явного
probe по запросу.

Переопределите команду или версию в конфигурации Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` принимает абсолютный путь, относительный путь (разрешается от workspace OpenClaw) или имя команды.
- `expectedVersion: "any"` отключает строгое сопоставление версий.
- Пользовательские пути `command` отключают локальную для Plugin автоустановку.

Переопределите команду отдельного ACP-агента со структурированными аргументами, когда путь
или значение флага должно оставаться одним argv-токеном:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` — исполняемый файл или существующая строка команды для этого ACP-агента.
- `agents.<id>.args` необязателен. Каждый элемент массива shell-экранируется перед тем, как OpenClaw передает его через текущий реестр строк команд acpx.

См. [Plugins](/ru/tools/plugin).

### Автоматическая установка зависимостей

Когда вы глобально устанавливаете OpenClaw через `npm install -g openclaw`, зависимости среды выполнения acpx
(платформенно-зависимые бинарные файлы) устанавливаются автоматически
через postinstall hook. Если автоматическая установка завершается ошибкой, Gateway все равно запускается
обычно и сообщает об отсутствующей зависимости через `openclaw acp doctor`.

### MCP-мост инструментов Plugin

По умолчанию сессии ACPX **не** предоставляют зарегистрированные Plugin инструменты OpenClaw
для ACP harness.

Если вы хотите, чтобы ACP-агенты, такие как Codex или Claude Code, вызывали установленные
Plugin инструменты OpenClaw, например recall/store памяти, включите выделенный мост:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Что это делает:

- Внедряет встроенный MCP-сервер с именем `openclaw-plugin-tools` в bootstrap сессии ACPX.
- Предоставляет Plugin инструменты, уже зарегистрированные установленными и включенными OpenClaw
  Plugins.
- Оставляет функцию явной и выключенной по умолчанию.

Примечания по безопасности и доверию:

- Это расширяет поверхность инструментов ACP harness.
- ACP-агенты получают доступ только к Plugin инструментам, уже активным в Gateway.
- Рассматривайте это как ту же границу доверия, что и разрешение этим Plugins выполняться
  в самом OpenClaw.
- Проверьте установленные Plugins перед включением.

Пользовательские `mcpServers` продолжают работать как раньше. Встроенный мост plugin-tools является
дополнительным удобством с явным включением, а не заменой общей конфигурации MCP-сервера.

### MCP-мост инструментов OpenClaw

По умолчанию сессии ACPX также **не** предоставляют встроенные инструменты OpenClaw через
MCP. Включите отдельный мост core-tools, когда ACP-агенту нужны выбранные
встроенные инструменты, такие как `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Что это делает:

- Внедряет встроенный MCP-сервер с именем `openclaw-tools` в bootstrap сессии ACPX.
- Предоставляет выбранные встроенные инструменты OpenClaw. Начальный сервер предоставляет `cron`.
- Оставляет доступ к core-tool явным и выключенным по умолчанию.

### Конфигурация тайм-аута операций среды выполнения

Plugin `acpx` по умолчанию дает запуску встроенной среды выполнения и управляющим операциям 120
секунд. Это дает более медленным harness, таким как Gemini CLI, достаточно времени
для завершения запуска и инициализации ACP. Переопределите это значение, если вашему хосту нужен
другой лимит операции:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Ходы среды выполнения используют тайм-ауты агента/запуска OpenClaw, включая `/acp timeout`.
`sessions_spawn` не принимает переопределения тайм-аута для отдельного вызова. Перезапустите
Gateway после изменения этого значения.

### Конфигурация агента health probe

Когда `/acp doctor` или startup probe проверяет backend, встроенный Plugin `acpx`
проверяет один harness-агент. Если задан `acp.allowedAgents`, по умолчанию используется
первый разрешенный агент; иначе по умолчанию используется `codex`. Если вашему развертыванию
нужен другой ACP-агент для health check, задайте probe-агента явно:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Перезапустите Gateway после изменения этого значения.

## Конфигурация разрешений

Сессии ACP выполняются неинтерактивно — нет TTY для подтверждения или отклонения запросов разрешений на запись файлов и выполнение shell-команд. Plugin acpx предоставляет два ключа конфигурации, которые управляют обработкой разрешений:

Эти разрешения ACPX harness отделены от подтверждений exec в OpenClaw и от флагов обхода CLI-backend поставщиков, таких как Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — это аварийный переключатель уровня harness для сессий ACP.

Более широкое сравнение между OpenClaw `tools.exec.mode`, подтверждениями Codex Guardian
и разрешениями ACPX harness см. в разделе
[Режимы разрешений](/ru/tools/permission-modes).

### `permissionMode`

Управляет тем, какие операции harness-агент может выполнять без запроса подтверждения.

| Значение           | Поведение                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматически подтверждать все записи файлов и shell-команды.          |
| `approve-reads` | Автоматически подтверждать только чтение; записи и exec требуют запросов. |
| `deny-all`      | Отклонять все запросы разрешений.                              |

### `nonInteractivePermissions`

Управляет тем, что происходит, когда должен быть показан запрос разрешения, но интерактивный TTY недоступен (что всегда верно для сессий ACP).

| Значение  | Поведение                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Прервать сессию с `AcpRuntimeError`. **(по умолчанию)**           |
| `deny` | Тихо отклонить разрешение и продолжить (мягкая деградация). |

### Конфигурация

Задайте через конфигурацию Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Перезапустите Gateway после изменения этих значений.

<Warning>
По умолчанию OpenClaw использует `permissionMode=approve-reads` и `nonInteractivePermissions=fail`. В неинтерактивных сессиях ACP любая запись или exec, вызывающие запрос разрешения, могут завершиться ошибкой `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Если вам нужно ограничить разрешения, установите `nonInteractivePermissions` в `deny`, чтобы сессии деградировали мягко, а не аварийно завершались.
</Warning>

## Связанные разделы

- [ACP-агенты](/ru/tools/acp-agents) — обзор, рабочий регламент оператора, концепции
- [Субагенты](/ru/tools/subagents)
- [Маршрутизация нескольких агентов](/ru/concepts/multi-agent)
