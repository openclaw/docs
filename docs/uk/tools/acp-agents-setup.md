---
read_when:
    - Встановлення або налаштування acpx harness для Claude Code / Codex / Gemini CLI
    - Увімкнення моста MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація acpx harness, налаштування Plugin, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-04-25T05:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Огляд, операторську інструкцію та концепції дивіться в [ACP agents](/uk/tools/acp-agents).

У розділах нижче описано конфігурацію acpx harness, налаштування Plugin для мостів MCP і конфігурацію дозволів.

## Підтримка acpx harness (поточна)

Поточні вбудовані псевдоніми harness в acpx:

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
- `pi`
- `qwen`

Коли OpenClaw використовує бекенд acpx, віддавайте перевагу цим значенням для `agentId`, якщо у вашій конфігурації acpx не визначено власні псевдоніми агентів.
Якщо ваша локальна інсталяція Cursor усе ще показує ACP як `agent acp`, перевизначте команду агента `cursor` у конфігурації acpx замість зміни вбудованого значення за замовчуванням.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей сирий обхідний варіант є можливістю CLI acpx (а не звичайним шляхом OpenClaw `agentId`).

## Обов’язкова конфігурація

Базова конфігурація ACP:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. Значення за замовчуванням — true; задайте false, щоб призупинити dispatch ACP, зберігши керування /acp.
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
      "pi",
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

Конфігурація прив’язки потоків залежить від channel-adapter. Приклад для Discord:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Якщо запуск ACP із прив’язкою до потоку не працює, спочатку перевірте прапорець можливості адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірнього потоку. Вони потребують активного контексту розмови та channel-adapter, який надає прив’язки розмов ACP.

Див. [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування Plugin для бекенду acpx

У нових інсталяціях вбудований runtime Plugin `acpx` увімкнено за замовчуванням, тому ACP
зазвичай працює без кроку ручного встановлення Plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
переключитися на локальний checkout для розробки, використовуйте явний шлях Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Встановлення з локального workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан бекенду:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

За замовчуванням вбудований Plugin `acpx` використовує локально закріплений у Plugin бінарний файл (`node_modules/.bin/acpx` усередині пакета Plugin). Під час запуску бекенд реєструється як неготовий, а фонове завдання перевіряє `acpx --version`; якщо бінарний файл відсутній або не збігається, виконується `npm install --omit=dev --no-save acpx@<pinned>` і повторна перевірка. Gateway увесь час залишається неблокувальним.

Перевизначте команду або версію в конфігурації Plugin:

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

- `command` приймає абсолютний шлях, відносний шлях (розв’язується від OpenClaw workspace) або назву команди.
- `expectedVersion: "any"` вимикає сувору перевірку версії.
- Користувацькі шляхи `command` вимикають локальне авто-встановлення в Plugin.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально через `npm install -g openclaw`, runtime-залежності acpx
(бінарні файли для конкретної платформи) встановлюються автоматично
через хук postinstall. Якщо автоматичне встановлення не вдається, gateway усе одно запускається
нормально і повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP plugin tools

За замовчуванням сесії ACPX **не** відкривають зареєстровані Plugin інструменти OpenClaw для
ACP harness.

Якщо ви хочете, щоб ACP-агенти, такі як Codex або Claude Code, могли викликати встановлені
інструменти Plugin OpenClaw, наприклад memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Ін’єктує вбудований MCP-сервер з назвою `openclaw-plugin-tools` у bootstrap
  сесії ACPX.
- Відкриває інструменти Plugin, уже зареєстровані встановленими та ввімкненими Plugins OpenClaw.
- Зберігає цю можливість явно керованою та вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів ACP harness.
- ACP-агенти отримують доступ лише до інструментів Plugin, уже активних у gateway.
- Вважайте це тією самою межею довіри, що й дозвіл цим Plugins виконуватися
  у самому OpenClaw.
- Перегляньте встановлені Plugins перед увімкненням.

Користувацькі `mcpServers` і надалі працюють як раніше. Вбудований міст plugin-tools —
це додаткова зручна можливість з явним увімкненням, а не заміна загальної конфігурації MCP-сервера.

### Міст MCP OpenClaw tools

За замовчуванням сесії ACPX також **не** відкривають вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст core-tools, коли ACP-агенту потрібні вибрані
вбудовані інструменти, наприклад `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Ін’єктує вбудований MCP-сервер з назвою `openclaw-tools` у bootstrap
  сесії ACPX.
- Відкриває вибрані вбудовані інструменти OpenClaw. Початково сервер відкриває `cron`.
- Зберігає відкриття core-tool явно керованим і вимкненим за замовчуванням.

### Конфігурація тайм-ауту runtime

Вбудований Plugin `acpx` за замовчуванням задає для ходів embedded runtime
тайм-аут 120 секунд. Це дає повільнішим harness, таким як Gemini CLI, достатньо часу для завершення
запуску ACP та ініціалізації. Перевизначте це значення, якщо вашому хосту потрібне інше
обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація агента health probe

Вбудований Plugin `acpx` перевіряє один harness agent, визначаючи, чи готовий
бекенд embedded runtime. Якщо задано `acp.allowedAgents`, за замовчуванням береться
перший дозволений агент; інакше — `codex`. Якщо вашому розгортанню
потрібен інший ACP-агент для health check, задайте probe agent явно:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Конфігурація дозволів

Сесії ACP виконуються неінтерактивно — TTY для схвалення або відхилення запитів дозволів на запис файлів і виконання shell-команд немає. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи ACPX harness відокремлені від схвалень exec у OpenClaw і відокремлені від прапорців bypass постачальника CLI-backend, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це перемикач break-glass на рівні harness для сесій ACP.

### `permissionMode`

Керує тим, які операції harness agent може виконувати без запиту.

| Значення        | Поведінка                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Автоматично схвалювати всі записи файлів і shell-команди. |
| `approve-reads` | Автоматично схвалювати лише читання; запис і exec потребують запитів. |
| `deny-all`      | Відхиляти всі запити дозволів.                           |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли потрібно було б показати запит дозволу, але інтерактивний TTY недоступний (що для сесій ACP відбувається завжди).

| Значення | Поведінка                                                       |
| -------- | --------------------------------------------------------------- |
| `fail`   | Перервати сесію з `AcpRuntimeError`. **(за замовчуванням)**     |
| `deny`   | Мовчки відхилити дозвіл і продовжити роботу (плавна деградація). |

### Конфігурація

Задається через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

> **Важливо:** Наразі OpenClaw за замовчуванням використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сесіях ACP будь-який запис або exec, що викликає запит дозволу, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, задайте `nonInteractivePermissions` як `deny`, щоб сесії деградували плавно, а не аварійно завершувалися.

## Пов’язане

- [ACP agents](/uk/tools/acp-agents) — огляд, операторська інструкція, концепції
- [Sub-agents](/uk/tools/subagents)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
