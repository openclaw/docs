---
read_when:
    - Встановлення або налаштування обв’язки acpx для Claude Code / Codex / Gemini CLI
    - Увімкнення MCP-моста plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація обв’язки acpx, налаштування Plugin, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-05-02T07:52:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Огляд, операторський runbook і концепції див. у [агентах ACP](/uk/tools/acp-agents).

Розділи нижче охоплюють конфігурацію обв'язки acpx, налаштування Plugin для мостів MCP і конфігурацію дозволів.

Використовуйте цю сторінку лише тоді, коли налаштовуєте маршрут ACP/acpx. Для нативної runtime-конфігурації app-server Codex використовуйте [обв'язку Codex](/uk/plugins/codex-harness). Для ключів OpenAI API або конфігурації провайдера моделей Codex OAuth використовуйте [OpenAI](/uk/providers/openai).

Codex має два маршрути OpenClaw:

| Маршрут                   | Конфігурація/команда                                  | Сторінка налаштування                  |
| ------------------------- | ------------------------------------------------------ | -------------------------------------- |
| Нативний app-server Codex | `/codex ...`, `agentRuntime.id: "codex"`               | [обв'язка Codex](/uk/plugins/codex-harness) |
| Явний адаптер Codex ACP   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ця сторінка                            |

Надавайте перевагу нативному маршруту, якщо вам явно не потрібна поведінка ACP/acpx.

## Підтримка обв'язки acpx (поточна)

Поточні вбудовані псевдоніми обв'язок acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (CLI Cursor: `cursor-agent acp`)
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

Коли OpenClaw використовує бекенд acpx, надавайте перевагу цим значенням для `agentId`, якщо ваша конфігурація acpx не визначає власні псевдоніми агентів.
Якщо ваша локальна інсталяція Cursor досі надає ACP як `agent acp`, перевизначте команду агента `cursor` у конфігурації acpx замість зміни вбудованого типового значення.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей сирий аварійний механізм є функцією CLI acpx (а не звичайним шляхом OpenClaw `agentId`).

Керування моделлю залежить від можливостей адаптера. Посилання на моделі Codex ACP нормалізуються OpenClaw перед запуском. Іншим обв'язкам потрібні ACP `models` плюс підтримка `session/set_model`; якщо обв'язка не надає ні цієї можливості ACP, ні власного прапорця моделі запуску, OpenClaw/acpx не може примусово вибрати модель.

## Обов'язкова конфігурація

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

Конфігурація прив'язки потоків залежить від адаптера каналу. Приклад для Discord:

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

Якщо створення ACP із прив'язкою до потоку не працює, спочатку перевірте прапорець функції адаптера:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Прив'язки поточної розмови не потребують створення дочірнього потоку. Вони потребують активного контексту розмови й адаптера каналу, який надає прив'язки розмов ACP.

Див. [довідник з конфігурації](/uk/gateway/configuration-reference).

## Налаштування Plugin для бекенду acpx

Пакетні інсталяції використовують офіційний runtime-Plugin `@openclaw/acpx` для ACP.
Установіть і ввімкніть його перед використанням сесій обв'язки ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Вихідні checkout-и також можуть використовувати локальний workspace-Plugin після `pnpm install`.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете повернутися до пакетного Plugin, використовуйте явний шлях пакета:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Локальна workspace-інсталяція під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте справність бекенду:

```text
/acp doctor
```

### Конфігурація команди й версії acpx

За замовчуванням Plugin `acpx` реєструє вбудований бекенд ACP без створення агента ACP під час запуску Gateway. Виконайте `/acp doctor` для явної live-перевірки. Установлюйте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` лише тоді, коли вам потрібно, щоб Gateway перевіряв налаштованого агента під час запуску.

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

- `command` приймає абсолютний шлях, відносний шлях (який обчислюється від workspace OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає суворе зіставлення версій.
- Власні шляхи `command` вимикають автоматичне встановлення, локальне для Plugin.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально через `npm install -g openclaw`, runtime-залежності acpx (бінарні файли, специфічні для платформи) встановлюються автоматично через postinstall hook. Якщо автоматичне встановлення завершується помилкою, gateway усе одно запускається нормально й повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP для інструментів Plugin

За замовчуванням сесії ACPX **не** надають зареєстровані Plugin інструменти OpenClaw обв'язці ACP.

Якщо ви хочете, щоб агенти ACP, як-от Codex або Claude Code, викликали встановлені інструменти Plugin OpenClaw, як-от memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Вставляє вбудований сервер MCP з назвою `openclaw-plugin-tools` у bootstrap сесії ACPX.
- Надає інструменти Plugin, уже зареєстровані встановленими та ввімкненими Plugins OpenClaw.
- Залишає функцію явною й вимкненою за замовчуванням.

Примітки щодо безпеки й довіри:

- Це розширює поверхню інструментів обв'язки ACP.
- Агенти ACP отримують доступ лише до інструментів Plugin, які вже активні в gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим Plugins виконуватися в самому OpenClaw.
- Перегляньте встановлені Plugins перед увімкненням.

Власні `mcpServers` і надалі працюють як раніше. Вбудований міст plugin-tools є додатковою зручною опцією за згодою, а не заміною загальної конфігурації сервера MCP.

### Міст MCP для інструментів OpenClaw

За замовчуванням сесії ACPX також **не** надають вбудовані інструменти OpenClaw через MCP. Увімкніть окремий міст core-tools, коли агенту ACP потрібні вибрані вбудовані інструменти, як-от `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Вставляє вбудований сервер MCP з назвою `openclaw-tools` у bootstrap сесії ACPX.
- Надає вибрані вбудовані інструменти OpenClaw. Початковий сервер надає `cron`.
- Залишає надання core-інструментів явним і вимкненим за замовчуванням.

### Конфігурація runtime-тайм-ауту

Plugin `acpx` за замовчуванням установлює для вбудованих runtime-ходів тайм-аут 120 секунд. Це дає повільнішим обв'язкам, як-от Gemini CLI, достатньо часу для завершення запуску й ініціалізації ACP. Перевизначте його, якщо вашому хосту потрібне інше runtime-обмеження:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Перезапустіть gateway після зміни цього значення.

### Конфігурація агента перевірки справності

Коли `/acp doctor` або опційна перевірка під час запуску перевіряє бекенд, вбудований Plugin `acpx` перевіряє одного агента обв'язки. Якщо задано `acp.allowedAgents`, типовим стає перший дозволений агент; інакше типовим є `codex`. Якщо вашому розгортанню потрібен інший агент ACP для перевірок справності, задайте агента перевірки явно:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Перезапустіть gateway після зміни цього значення.

## Конфігурація дозволів

Сесії ACP виконуються неінтерактивно — немає TTY для схвалення або відхилення запитів дозволу на запис файлів і виконання shell-команд. Plugin acpx надає два конфігураційні ключі, які керують обробкою дозволів:

Ці дозволи обв'язки ACPX відокремлені від схвалень exec OpenClaw і від прапорців обходу постачальників CLI-бекенду, як-от Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач рівня обв'язки для сесій ACP.

### `permissionMode`

Керує тим, які операції агент обв'язки може виконувати без запиту.

| Значення       | Поведінка                                                |
| -------------- | -------------------------------------------------------- |
| `approve-all`  | Автоматично схвалювати всі записи файлів і shell-команди. |
| `approve-reads` | Автоматично схвалювати лише читання; записи й exec потребують запитів. |
| `deny-all`     | Відхиляти всі запити дозволів.                           |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би бути показаний запит дозволу, але інтерактивний TTY недоступний (що завжди так для сесій ACP).

| Значення | Поведінка                                                           |
| -------- | ------------------------------------------------------------------ |
| `fail`   | Перервати сесію з `AcpRuntimeError`. **(типово)**                  |
| `deny`   | Тихо відхилити дозвіл і продовжити (поступова деградація).         |

### Конфігурація

Задайте через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Перезапустіть gateway після зміни цих значень.

<Warning>
OpenClaw за замовчуванням використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сесіях ACP будь-який запис або exec, що викликає запит дозволу, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сесії деградували поступово замість аварійного завершення.
</Warning>

## Пов'язане

- [агенти ACP](/uk/tools/acp-agents) — огляд, операторський runbook, концепції
- [субагенти](/uk/tools/subagents)
- [маршрутизація кількох агентів](/uk/concepts/multi-agent)
