---
read_when:
    - Встановлення або налаштування harness acpx для Claude Code / Codex / Gemini CLI
    - Увімкнення мосту MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація harness acpx, налаштування Plugin, дозволи'
title: ACP агенти — налаштування
x-i18n:
    generated_at: "2026-04-27T06:28:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Огляд, операторський runbook і концепції див. у [ACP агенти](/uk/tools/acp-agents).

У розділах нижче описано конфігурацію harness acpx, налаштування Plugin для мостів MCP і конфігурацію дозволів.

Використовуйте цю сторінку лише тоді, коли налаштовуєте маршрут ACP/acpx. Для нативної
конфігурації середовища виконання app-server Codex використовуйте [Codex harness](/uk/plugins/codex-harness). Для
API-ключів OpenAI або конфігурації провайдера моделей Codex OAuth використовуйте
[OpenAI](/uk/providers/openai).

Codex має два маршрути OpenClaw:

| Route                      | Config/command                                         | Setup page                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Нативний app-server Codex    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/uk/plugins/codex-harness) |
| Явний ACP-адаптер Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ця сторінка                               |

Надавайте перевагу нативному маршруту, якщо вам явно не потрібна поведінка ACP/acpx.

## Підтримка harness acpx (поточна)

Поточні вбудовані псевдоніми harness acpx:

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

Коли OpenClaw використовує бекенд acpx, віддавайте перевагу цим значенням для `agentId`, якщо ваша конфігурація acpx не визначає власні псевдоніми агентів.
Якщо ваша локальна інсталяція Cursor все ще показує ACP як `agent acp`, перевизначте команду агента `cursor` у конфігурації acpx, а не змінюйте вбудоване значення за замовчуванням.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей сирий обхідний шлях є можливістю CLI acpx (а не звичайним шляхом `agentId` в OpenClaw).

Керування моделлю залежить від можливостей адаптера. Посилання на моделі Codex ACP
нормалізуються OpenClaw перед запуском. Інші harness потребують ACP `models` плюс
підтримки `session/set_model`; якщо harness не надає ані цієї ACP-можливості,
ані власного прапорця моделі під час запуску, OpenClaw/acpx не може примусово вибрати модель.

## Обов’язкова конфігурація

Базова конфігурація ACP:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. Типове значення — true; задайте false, щоб призупинити диспетчеризацію ACP, залишивши /acp controls.
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

Конфігурація прив’язки до тредів залежить від адаптера каналу. Приклад для Discord:

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

Якщо spawn ACP із прив’язкою до треду не працює, спочатку перевірте прапорець можливості адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірнього треду. Вони потребують активного контексту розмови та адаптера каналу, який надає прив’язки розмов ACP.

Див. [Довідник із конфігурації](/uk/gateway/configuration-reference).

## Налаштування Plugin для бекенда acpx

У нових інсталяціях вбудований Plugin середовища виконання `acpx` за замовчуванням увімкнено, тож ACP
зазвичай працює без ручного кроку встановлення Plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
перемкнутися на локальний checkout для розробки, використовуйте явний шлях Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Локальне встановлення з workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан бекенда:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

За замовчуванням вбудований Plugin `acpx` реєструє вбудований ACP-бекенд без
запуску ACP-агента під час старту Gateway. Запустіть `/acp doctor` для явної
live-перевірки. Задавайте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` лише тоді, коли вам потрібно, щоб
Gateway перевіряв налаштованого агента під час запуску.

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
- `expectedVersion: "any"` вимикає сувору перевірку збігу версії.
- Власні шляхи `command` вимикають автоматичне встановлення на рівні Plugin.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально через `npm install -g openclaw`, залежності середовища виконання acpx
(бінарники для конкретної платформи) встановлюються автоматично
через postinstall hook. Якщо автоматичне встановлення не вдасться, gateway однаково запускається
нормально та повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP для інструментів Plugin

За замовчуванням сесії ACPX **не** показують harness ACP інструменти, зареєстровані Plugin OpenClaw.

Якщо ви хочете, щоб ACP-агенти, такі як Codex або Claude Code, могли викликати встановлені
інструменти Plugin OpenClaw, наприклад memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Інжектує вбудований MCP-сервер з назвою `openclaw-plugin-tools` у bootstrap
  сесії ACPX.
- Показує інструменти Plugin, уже зареєстровані встановленими та увімкненими
  Plugin OpenClaw.
- Залишає цю можливість явною та вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів harness ACP.
- ACP-агенти отримують доступ лише до інструментів Plugin, уже активних у gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим Plugin виконуватися
  в самому OpenClaw.
- Перевіряйте встановлені Plugin перед увімкненням.

Власні `mcpServers` і далі працюють як раніше. Вбудований міст plugin-tools —
це додаткова зручність за явною згодою, а не заміна загальної конфігурації MCP-сервера.

### Міст MCP для інструментів OpenClaw

За замовчуванням сесії ACPX також **не** показують вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст core-tools, коли ACP-агенту потрібні вибрані
вбудовані інструменти, такі як `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Інжектує вбудований MCP-сервер з назвою `openclaw-tools` у bootstrap
  сесії ACPX.
- Показує вибрані вбудовані інструменти OpenClaw. Початковий сервер показує `cron`.
- Залишає показ core-tools явним і вимкненим за замовчуванням.

### Конфігурація тайм-ауту середовища виконання

Вбудований Plugin `acpx` за замовчуванням використовує для ходів вбудованого середовища виконання
тайм-аут 120 секунд. Це дає повільнішим harness, таким як Gemini CLI, достатньо часу для завершення
запуску ACP та ініціалізації. Перевизначте це значення, якщо вашому хосту потрібен інший
ліміт середовища виконання:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація агента для health probe

Коли `/acp doctor` або probe запуску за явною згодою перевіряє бекенд, вбудований
Plugin `acpx` перевіряє один harness-агент. Якщо задано `acp.allowedAgents`, за замовчуванням
береться перший дозволений агент; інакше типовим є `codex`. Якщо вашому розгортанню
потрібен інший ACP-агент для health check, задайте probe agent явно:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Конфігурація дозволів

Сесії ACP працюють у неінтерактивному режимі — немає TTY, у якому можна схвалити або відхилити запити дозволів на запис файлів і виконання shell-команд. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи harness ACPX відокремлені від схвалень exec у OpenClaw і відокремлені від прапорців обходу на рівні CLI-бекенда від постачальника, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач рівня harness для сесій ACP.

### `permissionMode`

Керує тим, які операції агент harness може виконувати без запиту.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматично схвалювати всі записи файлів і shell-команди.          |
| `approve-reads` | Автоматично схвалювати лише читання; записи й exec потребують запитів. |
| `deny-all`      | Відхиляти всі запити дозволів.                              |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би з’явитися запит дозволу, але інтерактивний TTY недоступний (що для сесій ACP відбувається завжди).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Перервати сесію з `AcpRuntimeError`. **(типово)**           |
| `deny` | Мовчки відхилити дозвіл і продовжити роботу (плавна деградація). |

### Конфігурація

Задається через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

<Warning>
За замовчуванням OpenClaw використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сесіях ACP будь-який запис або exec, що викликає запит дозволу, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Якщо вам потрібно обмежити дозволи, задайте `nonInteractivePermissions` як `deny`, щоб сесії деградували плавно замість аварійного завершення.
</Warning>

## Пов’язане

- [ACP агенти](/uk/tools/acp-agents) — огляд, операторський runbook, концепції
- [Sub-agents](/uk/tools/subagents)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
