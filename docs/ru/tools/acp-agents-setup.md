---
read_when:
    - Установка или настройка среды acpx для Claude Code / Codex / Gemini CLI
    - Включение MCP-моста plugin-tools или OpenClaw-tools
    - Настройка режимов разрешений ACP
summary: 'Настройка агентов ACP: конфигурация среды acpx, настройка плагина, разрешения'
title: Агенты ACP — настройка
x-i18n:
    generated_at: "2026-07-16T16:51:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Обзор, руководство оператора и основные понятия см. в разделе [Агенты ACP](/ru/tools/acp-agents).

На этой странице описаны конфигурация среды acpx, настройка плагина для мостов MCP и настройка разрешений.

Используйте эту страницу только при настройке маршрута ACP/acpx. Для настройки среды выполнения нативного app-server Codex используйте раздел [Среда Codex](/ru/plugins/codex-harness). Для настройки ключей OpenAI API или поставщика моделей Codex OAuth используйте раздел [OpenAI](/ru/providers/openai).

У Codex есть два маршрута OpenClaw:

| Маршрут                   | Конфигурация/команда                                    | Страница настройки                      |
| ------------------------- | ------------------------------------------------------- | --------------------------------------- |
| Нативный app-server Codex | Ссылки на агенты `/codex ...`, `openai/gpt-*` | [Среда Codex](/ru/plugins/codex-harness)   |
| Явный адаптер Codex ACP   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"`                  | Эта страница                            |

Отдавайте предпочтение нативному маршруту, если вам явно не требуется поведение ACP/acpx.

## Поддержка среды acpx (текущая)

Встроенные псевдонимы среды acpx (из закреплённой зависимости `acpx`):

| Псевдоним           | Оборачивает                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `claude`  | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`  | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`  | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`  | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`  | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent`  | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`  | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`  | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`  | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`  | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`  | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`  | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`  | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`  | Мост OpenClaw ACP (нативный `openclaw acp`)                                                                |
| `pi`  | [Агент программирования Pi](https://github.com/mariozechner/pi)                                                |
| `qoder`  | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`  | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`  | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` и `factorydroid` также разрешаются во встроенный адаптер `droid`.

Когда OpenClaw использует бэкенд acpx, отдавайте предпочтение этим значениям для `agentId`, если в вашей конфигурации acpx не определены пользовательские псевдонимы агентов.
Если локальная установка Cursor по-прежнему предоставляет ACP как `agent acp`, переопределите команду агента `cursor` в конфигурации acpx вместо изменения встроенного значения по умолчанию.

При прямом использовании CLI acpx можно также обращаться к произвольным адаптерам через `--agent <command>`, но этот низкоуровневый обходной механизм является функцией CLI acpx (а не обычным маршрутом OpenClaw `agentId`).

Управление моделью зависит от возможностей адаптера. Ссылки на модели Codex ACP нормализуются OpenClaw перед запуском. Другим средам необходимы поддержка ACP `models` и `session/set_model`; если среда не предоставляет ни эту возможность ACP, ни собственный флаг модели при запуске, OpenClaw/acpx не может принудительно выбрать модель.

## Обязательная конфигурация

Базовая конфигурация ядра ACP:

```json5
{
  acp: {
    enabled: true,
    // Необязательно. По умолчанию true; установите false, чтобы приостановить диспетчеризацию ACP, сохранив элементы управления /acp.
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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Значения по умолчанию: coalesceIdleMs: 350, maxChunkChars: 1800; здесь они указаны явно.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Конфигурация привязки к веткам зависит от адаптера канала. Пример для Discord:

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
        // По умолчанию уже true; здесь указано явно.
        spawnSessions: true,
      },
    },
  },
}
```

Если запуск ACP с привязкой к ветке не работает, сначала проверьте флаг функции адаптера:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Для привязки к текущему разговору создание дочерней ветки не требуется. Необходимы активный контекст разговора и адаптер канала, предоставляющий привязки разговоров ACP.

См. [Справочник по конфигурации](/ru/gateway/configuration-reference).

## Настройка плагина для бэкенда acpx

Пакетные установки используют официальный плагин среды выполнения `@openclaw/acpx` для ACP.
Установите и включите его перед использованием сеансов среды ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

В исходных рабочих копиях после `pnpm install` также можно использовать локальный плагин рабочего пространства.

Начните с:

```text
/acp doctor
```

Если вы отключили `acpx`, запретили его через `plugins.allow` / `plugins.deny` или хотите вернуться к пакетному плагину, используйте явный путь пакета:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Установка локального рабочего пространства во время разработки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Затем проверьте работоспособность бэкенда:

```text
/acp doctor
```

### Проверка запуска среды выполнения acpx

Плагин `acpx` напрямую встраивает среду выполнения ACP (нет отдельного двоичного файла или версии `acpx`, которые нужно настраивать). По умолчанию он регистрирует встроенный бэкенд во время запуска Gateway и ожидает проверку запуска до сигнала gateway `ready`. Устанавливайте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` или `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` только для скриптов или сред, в которых проверка запуска намеренно отключена. Выполните `/acp doctor` для явной проверки по запросу.

Переопределяйте команду отдельного агента ACP с помощью структурированных аргументов, если путь или значение флага должны оставаться одним токеном argv:

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

- `agents.<id>.command` — исполняемый файл или существующая строка команды для этого агента ACP.
- `agents.<id>.args` — необязательный параметр. Каждый элемент массива заключается в кавычки оболочки, прежде чем OpenClaw передаст его через текущий реестр строк команд acpx.

См. [Плагины](/ru/tools/plugin).

### Автоматическая загрузка адаптера

`acpx` автоматически загружает адаптеры ACP (например, мосты Claude и Codex ACP) через `npx` при первом использовании. Устанавливать пакеты адаптеров вручную не требуется, и для самого OpenClaw нет отдельного шага после установки. Если загрузка или запуск адаптера завершается ошибкой, `/acp doctor` сообщает об этом.

### Мост MCP для инструментов плагинов

По умолчанию сеансы ACPX **не** предоставляют зарегистрированные плагинами OpenClaw инструменты среде ACP.

Если требуется, чтобы агенты ACP, например Codex или Claude Code, могли вызывать инструменты установленных плагинов OpenClaw, такие как извлечение или сохранение данных в памяти, включите выделенный мост:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Что он делает:

- Внедряет встроенный сервер MCP с именем `openclaw-plugin-tools` при инициализации сеанса ACPX.
- Предоставляет инструменты плагинов, уже зарегистрированные установленными и включёнными плагинами OpenClaw.
- Передаёт активный идентификатор сеанса ACP фабрикам инструментов плагинов, чтобы инструменты уровня агента оставались в пространстве имён этого агента.
- Оставляет функцию явно включаемой и по умолчанию отключённой.

Примечания о безопасности и доверии:

- Это расширяет набор инструментов среды ACP.
- Агенты ACP получают доступ только к инструментам плагинов, уже активным в Gateway.
- Считайте это той же границей доверия, что и разрешение этим плагинам выполняться в самом OpenClaw.
- Перед включением проверьте установленные плагины.

Пользовательские `mcpServers` продолжают работать как прежде. Встроенный мост инструментов плагинов — это дополнительная удобная возможность, включаемая по желанию, а не замена общей конфигурации сервера MCP.

### Мост MCP для инструментов OpenClaw

По умолчанию сеансы ACPX также **не** предоставляют встроенные инструменты OpenClaw через MCP. Включите отдельный мост инструментов ядра, если агенту ACP требуются выбранные встроенные инструменты, например `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Что он делает:

- Внедряет встроенный сервер MCP с именем `openclaw-tools` при инициализации сеанса ACPX.
- Предоставляет выбранные встроенные инструменты OpenClaw. Первоначальная версия сервера предоставляет `cron`.
- Оставляет предоставление инструментов ядра явно включаемым и по умолчанию отключённым.

### Настройка тайм-аута операций среды выполнения

Плагин `acpx` по умолчанию предоставляет встроенной среде выполнения 120 секунд на запуск и операции управления. Это даёт более медленным средам, таким как Gemini CLI, достаточно времени для завершения запуска и инициализации ACP. Переопределите это значение, если узлу требуется другой предел времени выполнения операции:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Рабочие циклы среды выполнения используют тайм-ауты агентов и запусков OpenClaw, включая `/acp timeout`.
`sessions_spawn` не принимает переопределения тайм-аута для отдельных вызовов; для оператора предназначен путь `agents.defaults.subagents.runTimeoutSeconds`. Перезапустите Gateway после изменения `timeoutSeconds`.

### Настройка агента проверки работоспособности

Когда `/acp doctor` или проверка запуска проверяет бэкенд, входящий в комплект плагин `acpx` проверяет один агент среды. Если задано `acp.allowedAgents`, по умолчанию используется первый разрешённый агент; в противном случае по умолчанию используется `codex`. Если для проверок работоспособности в развёртывании необходим другой агент ACP, укажите агента проверки явно:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Перезапустите Gateway после изменения этого значения.

## Настройка разрешений

Сеансы ACP выполняются неинтерактивно — TTY для подтверждения или отклонения запросов разрешений на запись файлов и выполнение команд оболочки отсутствует. Плагин acpx предоставляет два ключа конфигурации, управляющих обработкой разрешений:

Эти разрешения среды ACPX не связаны с подтверждениями выполнения в OpenClaw и флагами обхода ограничений поставщика для бэкендов CLI, такими как Claude CLI `--permission-mode bypassPermissions`. Параметр ACPX `approve-all` — это аварийный переключатель на уровне среды для сеансов ACP.

Более подробное сравнение `tools.exec.mode` в OpenClaw, подтверждений Codex Guardian и разрешений среды ACPX см. в разделе
[Режимы разрешений](/ru/tools/permission-modes).

### `permissionMode`

Управляет тем, какие операции агент среды может выполнять без запроса подтверждения.

| Значение           | Поведение                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматически разрешать любую запись файлов и все команды оболочки.          |
| `approve-reads` | Автоматически разрешать только чтение; запись и выполнение требуют подтверждения. |
| `deny-all`      | Отклонять все запросы разрешений.                              |

### `nonInteractivePermissions`

Управляет поведением в ситуации, когда должен отображаться запрос разрешения, но интерактивный TTY недоступен (что всегда справедливо для сеансов ACP).

| Значение  | Поведение                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Прервать сеанс с ошибкой `PermissionPromptUnavailableError`. **(по умолчанию)** |
| `deny` | Без уведомления отклонить разрешение и продолжить работу (плавная деградация).        |

### Конфигурация

Задайте через конфигурацию плагина:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

После изменения этих значений перезапустите Gateway.

<Warning>
В OpenClaw по умолчанию используются `permissionMode=approve-reads` и `nonInteractivePermissions=fail`. В неинтерактивных сеансах ACP любая запись или выполнение, вызывающие запрос разрешения, могут завершиться ошибкой `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Если требуется ограничить разрешения, установите для `nonInteractivePermissions` значение `deny`, чтобы сеансы переходили в режим плавной деградации, а не аварийно завершались.
</Warning>

## См. также

- [Агенты ACP](/ru/tools/acp-agents) — обзор, руководство оператора, основные понятия
- [Субагенты](/ru/tools/subagents)
- [Маршрутизация между несколькими агентами](/ru/concepts/multi-agent)
