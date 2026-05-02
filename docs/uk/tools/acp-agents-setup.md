---
read_when:
    - Встановлення або налаштування обв’язки acpx для Claude Code / Codex / Gemini CLI
    - Увімкнення MCP-моста plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація обв’язки acpx, налаштування Plugin, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-05-02T06:11:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4426219227e77d5dc57039c0c8f7324590388db141689239deaa2441609f4afd
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Огляд, операторський runbook і концепції див. у [ACP agents](/uk/tools/acp-agents).

Розділи нижче охоплюють конфігурацію acpx harness, налаштування Plugin для MCP-мостів і конфігурацію дозволів.

Використовуйте цю сторінку лише коли налаштовуєте маршрут ACP/acpx. Для нативної конфігурації runtime сервера застосунку Codex використовуйте [Codex harness](/uk/plugins/codex-harness). Для ключів OpenAI API або конфігурації model-provider Codex OAuth використовуйте [OpenAI](/uk/providers/openai).

Codex має два маршрути OpenClaw:

| Маршрут                    | Конфігурація/команда                                    | Сторінка налаштування                  |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Нативний app-server Codex  | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/uk/plugins/codex-harness) |
| Явний адаптер Codex ACP    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ця сторінка                            |

Віддавайте перевагу нативному маршруту, якщо вам явно не потрібна поведінка ACP/acpx.

## Підтримка acpx harness (поточна)

Поточні вбудовані alias harness в acpx:

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

Коли OpenClaw використовує backend acpx, віддавайте перевагу цим значенням для `agentId`, якщо ваша конфігурація acpx не визначає власні alias агентів.
Якщо ваша локальна інсталяція Cursor досі надає ACP як `agent acp`, перевизначте команду агента `cursor` у вашій конфігурації acpx замість зміни вбудованого значення за замовчуванням.

Пряме використання acpx CLI також може спрямовуватися на довільні адаптери через `--agent <command>`, але цей необроблений аварійний механізм є функцією acpx CLI (а не звичайним шляхом OpenClaw `agentId`).

Керування моделлю залежить від можливостей адаптера. Посилання на моделі Codex ACP нормалізуються OpenClaw перед запуском. Іншим harness потрібні ACP `models` плюс підтримка `session/set_model`; якщо harness не надає ані цієї можливості ACP, ані власного прапорця моделі під час запуску, OpenClaw/acpx не може примусово вибрати модель.

## Обов’язкова конфігурація

Базова конфігурація Core ACP:

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
        spawnSessions: true,
      },
    },
  },
}
```

Якщо thread-bound створення ACP не працює, спершу перевірте прапорець функції адаптера:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Прив’язки поточної розмови не потребують створення дочірнього потоку. Вони потребують активного контексту розмови та channel adapter, який надає прив’язки розмов ACP.

Див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Налаштування Plugin для backend acpx

Свіжі інсталяції постачаються з увімкненим за замовчуванням вбудованим runtime Plugin `acpx`, тому ACP зазвичай працює без ручного кроку встановлення Plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете перемкнутися на локальний checkout для розробки, використайте явний шлях Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Встановлення з локального workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан backend:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

За замовчуванням вбудований Plugin `acpx` реєструє вбудований backend ACP без запуску агента ACP під час запуску Gateway. Запустіть `/acp doctor` для явної live-перевірки. Установлюйте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` лише тоді, коли потрібно, щоб Gateway перевіряв налаштованого агента під час запуску.

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

- `command` приймає абсолютний шлях, відносний шлях (розв’язується від workspace OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає сувору перевірку відповідності версії.
- Власні шляхи `command` вимикають plugin-local автоматичне встановлення.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально за допомогою `npm install -g openclaw`, runtime-залежності acpx (platform-specific binaries) встановлюються автоматично через postinstall hook. Якщо автоматичне встановлення не вдається, Gateway усе одно запускається нормально та повідомляє про відсутню залежність через `openclaw acp doctor`.

### MCP-міст інструментів Plugin

За замовчуванням сеанси ACPX **не** надають інструменти, зареєстровані Plugin OpenClaw, для ACP harness.

Якщо ви хочете, щоб ACP-агенти, такі як Codex або Claude Code, викликали встановлені інструменти Plugin OpenClaw, як-от memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Вставляє вбудований MCP-сервер із назвою `openclaw-plugin-tools` у bootstrap сеансу ACPX.
- Надає інструменти Plugin, уже зареєстровані встановленими й увімкненими OpenClaw plugins.
- Залишає функцію явною та вимкненою за замовчуванням.

Нотатки щодо безпеки та довіри:

- Це розширює поверхню інструментів ACP harness.
- ACP-агенти отримують доступ лише до інструментів Plugin, які вже активні в Gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим plugins виконуватися в самому OpenClaw.
- Перегляньте встановлені plugins перед увімкненням.

Власні `mcpServers` і надалі працюють як раніше. Вбудований міст plugin-tools є додатковою opt-in зручністю, а не заміною для загальної конфігурації MCP-сервера.

### MCP-міст інструментів OpenClaw

За замовчуванням сеанси ACPX також **не** надають вбудовані інструменти OpenClaw через MCP. Увімкніть окремий міст core-tools, коли ACP-агенту потрібні вибрані вбудовані інструменти, такі як `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Вставляє вбудований MCP-сервер із назвою `openclaw-tools` у bootstrap сеансу ACPX.
- Надає вибрані вбудовані інструменти OpenClaw. Початковий сервер надає `cron`.
- Залишає доступ до core-tool явним і вимкненим за замовчуванням.

### Конфігурація тайм-ауту runtime

Вбудований Plugin `acpx` за замовчуванням встановлює для embedded runtime turns тайм-аут 120 секунд. Це дає повільнішим harness, таким як Gemini CLI, достатньо часу для завершення запуску та ініціалізації ACP. Перевизначте це, якщо вашому host потрібен інший ліміт runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Перезапустіть Gateway після зміни цього значення.

### Конфігурація агента health probe

Коли `/acp doctor` або opt-in перевірка під час запуску перевіряє backend, вбудований Plugin `acpx` перевіряє одного агента harness. Якщо встановлено `acp.allowedAgents`, за замовчуванням використовується перший дозволений агент; інакше за замовчуванням використовується `codex`. Якщо вашому deployment потрібен інший агент ACP для health checks, явно задайте агента перевірки:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Перезапустіть Gateway після зміни цього значення.

## Конфігурація дозволів

Сеанси ACP працюють неінтерактивно — немає TTY, щоб схвалювати або відхиляти запити дозволів на file-write і shell-exec. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи ACPX harness відокремлені від OpenClaw exec approvals і відокремлені від CLI-backend vendor bypass flags, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` є harness-level break-glass перемикачем для сеансів ACP.

### `permissionMode`

Керує тим, які операції агент harness може виконувати без запиту.

| Значення       | Поведінка                                                |
| -------------- | -------------------------------------------------------- |
| `approve-all`  | Автоматично схвалювати всі записи файлів і shell-команди. |
| `approve-reads` | Автоматично схвалювати лише читання; записи та exec потребують запитів. |
| `deny-all`     | Відхиляти всі запити дозволів.                           |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би відобразитися запит дозволу, але інтерактивний TTY недоступний (що завжди є випадком для сеансів ACP).

| Значення | Поведінка                                                        |
| -------- | ---------------------------------------------------------------- |
| `fail`   | Перервати сеанс із `AcpRuntimeError`. **(за замовчуванням)**     |
| `deny`   | Тихо відхилити дозвіл і продовжити (плавна деградація).          |

### Конфігурація

Установіть через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Перезапустіть Gateway після зміни цих значень.

<Warning>
OpenClaw за замовчуванням використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сеансах ACP будь-який запис або exec, що спричиняє запит дозволу, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сеанси плавно деградували замість аварійного завершення.
</Warning>

## Пов’язане

- [ACP agents](/uk/tools/acp-agents) — огляд, операторський runbook, концепції
- [Субагенти](/uk/tools/subagents)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
