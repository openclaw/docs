---
read_when:
    - Установка или настройка среды acpx для Claude Code / Codex / Gemini CLI
    - Включение MCP-моста plugin-tools или OpenClaw-tools
    - Настройка режимов разрешений ACP
summary: 'Настройка агентов ACP: конфигурация среды acpx, настройка плагина и разрешения'
title: Агенты ACP — настройка
x-i18n:
    generated_at: "2026-07-12T11:52:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Обзор, руководство оператора и описание концепций см. в разделе [агенты ACP](/ru/tools/acp-agents).

На этой странице описаны конфигурация среды выполнения acpx, настройка Plugin для мостов MCP и настройка разрешений.

Используйте эту страницу только при настройке маршрута ACP/acpx. Для настройки среды выполнения нативного сервера приложений Codex используйте раздел [Среда выполнения Codex](/ru/plugins/codex-harness). Для настройки ключей OpenAI API или поставщика моделей Codex OAuth используйте раздел [OpenAI](/ru/providers/openai).

Для Codex предусмотрено два маршрута OpenClaw:

| Маршрут                              | Конфигурация/команда                                   | Страница настройки                         |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------ |
| Нативный сервер приложений Codex     | `/codex ...`, ссылки на агентов `openai/gpt-*`         | [Среда выполнения Codex](/ru/plugins/codex-harness) |
| Явный адаптер Codex ACP              | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Эта страница                               |

Предпочитайте нативный маршрут, если вам явно не требуется поведение ACP/acpx.

## Поддержка среды выполнения acpx (текущая)

Встроенные псевдонимы среды выполнения acpx (из закреплённой зависимости `acpx`):

| Псевдоним   | Оборачивает                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Мост OpenClaw ACP (нативная команда `openclaw acp`)                                                             |
| `pi`         | [Агент программирования Pi](https://github.com/mariozechner/pi)                                                 |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` и `factorydroid` также разрешаются во встроенный адаптер `droid`.

Когда OpenClaw использует бэкенд acpx, предпочитайте эти значения для `agentId`, если в вашей конфигурации acpx не определены пользовательские псевдонимы агентов.
Если ваша локальная установка Cursor по-прежнему предоставляет ACP как `agent acp`, переопределите команду агента `cursor` в конфигурации acpx вместо изменения встроенного значения по умолчанию.

При прямом использовании CLI acpx также можно обращаться к произвольным адаптерам через `--agent <command>`, однако этот необработанный обходной механизм является функцией CLI acpx, а не обычного пути `agentId` в OpenClaw.

Управление моделью зависит от возможностей адаптера. Перед запуском OpenClaw нормализует ссылки на модели Codex ACP. Для других сред выполнения необходимы возможность ACP `models` и поддержка `session/set_model`; если среда выполнения не предоставляет ни эту возможность ACP, ни собственный флаг выбора модели при запуске, OpenClaw/acpx не сможет принудительно выбрать модель.

## Обязательная конфигурация

Базовая конфигурация ядра ACP:

```json5
{
  acp: {
    enabled: true,
    // Необязательно. По умолчанию true; задайте false, чтобы приостановить диспетчеризацию ACP, сохранив элементы управления /acp.
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
        // Значение по умолчанию уже true; здесь оно указано явно.
        spawnSessions: true,
      },
    },
  },
}
```

Если создание ACP с привязкой к ветке не работает, сначала проверьте флаг функции адаптера:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Привязки к текущему разговору не требуют создания дочерней ветки. Для них необходимы активный контекст разговора и адаптер канала, предоставляющий привязки разговоров ACP.

См. [Справочник по конфигурации](/ru/gateway/configuration-reference).

## Настройка Plugin для бэкенда acpx

В пакетных установках для ACP используется официальный Plugin среды выполнения `@openclaw/acpx`.
Установите и включите его перед использованием сеансов среды выполнения ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

В рабочих копиях исходного кода после `pnpm install` также можно использовать локальный Plugin рабочего пространства.

Начните с команды:

```text
/acp doctor
```

Если вы отключили `acpx`, запретили его через `plugins.allow` / `plugins.deny` или хотите вернуться к пакетному Plugin, используйте явный путь пакета:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Установка из локального рабочего пространства во время разработки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Затем проверьте работоспособность бэкенда:

```text
/acp doctor
```

### Проверка запуска среды выполнения acpx

Plugin `acpx` встраивает среду выполнения ACP напрямую — отдельный исполняемый файл `acpx` и настройка его версии не требуются. По умолчанию Plugin регистрирует встроенный бэкенд во время запуска Gateway и ожидает завершения проверки запуска перед сигналом готовности Gateway `ready`. Устанавливайте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` или `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` только для сценариев или сред, в которых проверка запуска намеренно отключена. Для явной проверки по запросу выполните `/acp doctor`.

Переопределяйте команду отдельного агента ACP с помощью структурированных аргументов, если путь или значение флага должны оставаться одним элементом argv:

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

- `agents.<id>.command` — исполняемый файл или существующая строка команды для данного агента ACP.
- `agents.<id>.args` — необязательный параметр. Перед передачей OpenClaw каждого элемента массива через текущий реестр строк команд acpx он заключает его в кавычки оболочки.

См. [Plugins](/ru/tools/plugin).

### Автоматическая загрузка адаптеров

`acpx` автоматически загружает адаптеры ACP (например, мосты Claude и Codex ACP) через `npx` при первом использовании. Вам не нужно устанавливать пакеты адаптеров вручную, а для самого OpenClaw не требуется отдельный этап после установки. Если загрузка или запуск адаптера завершается сбоем, `/acp doctor` сообщает об ошибке.

### Мост MCP для инструментов Plugin

По умолчанию сеансы ACPX **не** предоставляют среде выполнения ACP инструменты, зарегистрированные Plugins OpenClaw.

Если вы хотите, чтобы агенты ACP, например Codex или Claude Code, могли вызывать инструменты установленных Plugins OpenClaw, например чтение или сохранение памяти, включите специальный мост:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Что он делает:

- Внедряет встроенный сервер MCP с именем `openclaw-plugin-tools` при начальной загрузке сеанса ACPX.
- Предоставляет инструменты Plugins, уже зарегистрированные установленными и включёнными Plugins OpenClaw.
- Требует явного включения и по умолчанию отключён.

Примечания о безопасности и доверии:

- Это расширяет поверхность инструментов среды выполнения ACP.
- Агенты ACP получают доступ только к инструментам Plugins, уже активным в Gateway.
- Рассматривайте это как ту же границу доверия, что и разрешение этим Plugins выполняться в самом OpenClaw.
- Перед включением проверьте установленные Plugins.

Пользовательские `mcpServers` продолжают работать как прежде. Встроенный мост инструментов Plugins — это дополнительное удобство, включаемое по желанию, а не замена общей конфигурации серверов MCP.

### Мост MCP для инструментов OpenClaw

По умолчанию сеансы ACPX также **не** предоставляют встроенные инструменты OpenClaw через MCP. Включите отдельный мост инструментов ядра, если агенту ACP необходимы выбранные встроенные инструменты, например `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Что он делает:

- Внедряет встроенный сервер MCP с именем `openclaw-tools` при начальной загрузке сеанса ACPX.
- Предоставляет выбранные встроенные инструменты OpenClaw. Первоначально сервер предоставляет `cron`.
- Требует явного включения инструментов ядра и по умолчанию отключён.

### Настройка времени ожидания операций среды выполнения

По умолчанию Plugin `acpx` отводит 120 секунд на запуск встроенной среды выполнения и операции управления. Это даёт более медленным средам выполнения, например Gemini CLI, достаточно времени для завершения запуска и инициализации ACP. Переопределите это значение, если вашему хосту требуется другой предел длительности операций:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Для рабочих циклов среды выполнения используются ограничения времени ожидания агента/запуска OpenClaw, включая `/acp timeout`.
`sessions_spawn` не принимает переопределение времени ожидания для отдельного вызова; путь настройки для оператора — `agents.defaults.subagents.runTimeoutSeconds`. После изменения `timeoutSeconds` перезапустите Gateway.

### Настройка агента проверки работоспособности

Когда `/acp doctor` или проверка запуска проверяет бэкенд, входящий в комплект Plugin `acpx` проверяет один агент среды выполнения. Если задан `acp.allowedAgents`, по умолчанию используется первый разрешённый агент; иначе по умолчанию используется `codex`. Если для проверок работоспособности в вашем развёртывании требуется другой агент ACP, задайте агента проверки явно:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

После изменения этого значения перезапустите Gateway.

## Настройка разрешений

Сеансы ACP работают неинтерактивно — TTY для подтверждения или отклонения запросов разрешений на запись файлов и выполнение команд оболочки отсутствует. Plugin acpx предоставляет два ключа конфигурации, управляющих обработкой разрешений:

Эти разрешения среды выполнения ACPX не связаны с подтверждениями выполнения OpenClaw и не связаны с флагами обхода ограничений поставщика для CLI-бэкенда, например `--permission-mode bypassPermissions` в Claude CLI. `approve-all` в ACPX — аварийный переключатель уровня среды выполнения для сеансов ACP.

Более подробное сравнение `tools.exec.mode` в OpenClaw, подтверждений Codex Guardian и разрешений среды выполнения ACPX см. в разделе [Режимы разрешений](/ru/tools/permission-modes).

### `permissionMode`

Управляет тем, какие операции агент среды выполнения может выполнять без запроса.

| Значение        | Поведение                                                                 |
| --------------- | ------------------------------------------------------------------------- |
| `approve-all`   | Автоматически разрешать любую запись в файлы и выполнение команд оболочки. |
| `approve-reads` | Автоматически разрешать только чтение; запись и выполнение требуют подтверждения. |
| `deny-all`      | Отклонять все запросы разрешений.                                         |

### `nonInteractivePermissions`

Определяет, что происходит, когда должен отображаться запрос разрешения, но интерактивный TTY недоступен (что всегда верно для сеансов ACP).

| Значение | Поведение                                                               |
| -------- | ----------------------------------------------------------------------- |
| `fail`   | Прервать сеанс с ошибкой `PermissionPromptUnavailableError`. **(по умолчанию)** |
| `deny`   | Без уведомления отклонить разрешение и продолжить работу (плавная деградация). |

### Конфигурация

Задайте через конфигурацию Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

После изменения этих значений перезапустите Gateway.

<Warning>
По умолчанию OpenClaw использует `permissionMode=approve-reads` и `nonInteractivePermissions=fail`. В неинтерактивных сеансах ACP любая операция записи или выполнения, вызывающая запрос разрешения, может завершиться ошибкой `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Если необходимо ограничить разрешения, задайте для `nonInteractivePermissions` значение `deny`, чтобы сеансы завершали отдельные операции плавно, а не аварийно.
</Warning>

## Связанные материалы

- [Агенты ACP](/ru/tools/acp-agents) — обзор, руководство оператора, основные понятия
- [Подагенты](/ru/tools/subagents)
- [Мультиагентная маршрутизация](/ru/concepts/multi-agent)
