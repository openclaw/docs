---
read_when:
    - Встановлення або налаштування harness acpx для Claude Code / Codex / Gemini CLI
    - Увімкнення моста MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація acpx harness, налаштування plugin, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-06-27T18:22:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Огляд, операторський runbook і концепції див. у [ACP agents](/uk/tools/acp-agents).

Розділи нижче описують конфігурацію обв’язки acpx, налаштування Plugin для MCP-мостів і конфігурацію дозволів.

Використовуйте цю сторінку лише тоді, коли налаштовуєте маршрут ACP/acpx. Для конфігурації нативного runtime Codex
app-server використовуйте [Обв’язку Codex](/uk/plugins/codex-harness). Для
API-ключів OpenAI або конфігурації model-provider Codex OAuth використовуйте
[OpenAI](/uk/providers/openai).

Codex має два маршрути OpenClaw:

| Маршрут                   | Конфігурація/команда                                   | Сторінка налаштування                  |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Нативний Codex app-server  | `/codex ...`, `openai/gpt-*` agent refs                | [Обв’язка Codex](/uk/plugins/codex-harness) |
| Явний ACP-адаптер Codex    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ця сторінка                            |

Надавайте перевагу нативному маршруту, якщо вам явно не потрібна поведінка ACP/acpx.

## Підтримка обв’язки acpx (поточна)

Поточні вбудовані псевдоніми обв’язок acpx:

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

Коли OpenClaw використовує backend acpx, надавайте перевагу цим значенням для `agentId`, якщо ваша конфігурація acpx не визначає власні псевдоніми агентів.
Якщо ваша локальна інсталяція Cursor досі надає ACP як `agent acp`, перевизначте команду агента `cursor` у конфігурації acpx замість зміни вбудованого значення за замовчуванням.

Пряме використання acpx CLI також може націлювати довільні адаптери через `--agent <command>`, але цей сирий аварійний вихід є функцією acpx CLI (а не звичайним шляхом OpenClaw `agentId`).

Керування моделлю залежить від можливостей адаптера. Посилання на моделі Codex ACP
нормалізуються OpenClaw перед запуском. Іншим обв’язкам потрібні ACP `models` плюс
підтримка `session/set_model`; якщо обв’язка не надає ні цю можливість ACP,
ні власний прапорець стартової моделі, OpenClaw/acpx не може примусово вибрати модель.

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

Конфігурація прив’язки потоків залежить від адаптера каналу. Приклад для Discord:

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

Якщо прив’язаний до потоку запуск ACP не працює, спочатку перевірте прапорець функції адаптера:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Прив’язки поточної розмови не потребують створення дочірнього потоку. Вони потребують активного контексту розмови та адаптера каналу, який надає прив’язки розмов ACP.

Див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Налаштування Plugin для backend acpx

Пакетні інсталяції використовують офіційний runtime Plugin `@openclaw/acpx` для ACP.
Установіть і ввімкніть його перед використанням сесій обв’язки ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source checkouts також можуть використовувати локальний workspace Plugin після `pnpm install`.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
повернутися до пакетного Plugin, використовуйте явний шлях пакета:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Локальна інсталяція workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте справність backend:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

За замовчуванням Plugin `acpx` реєструє вбудований backend ACP під час запуску Gateway
і чекає на startup probe вбудованого runtime перед сигналом Gateway
`ready`. Установлюйте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` або
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` лише для скриптів або середовищ, які
навмисно тримають startup probe вимкненим. Запустіть `/acp doctor` для явної
перевірки на вимогу.

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

- `command` приймає абсолютний шлях, відносний шлях (обчислюється від workspace OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає сувору перевірку збігу версії.
- Власні шляхи `command` вимикають локальне для Plugin автоматичне встановлення.

Перевизначте команду окремого ACP-агента зі структурованими аргументами, коли шлях
або значення прапорця має залишатися одним argv-токеном:

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

- `agents.<id>.command` — це виконуваний файл або наявний рядок команди для цього ACP-агента.
- `agents.<id>.args` є необов’язковим. Кожен елемент масиву shell-quoted перед тим, як OpenClaw передає його через поточний реєстр рядків команд acpx.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально за допомогою `npm install -g openclaw`, runtime-залежності acpx
(платформоспецифічні бінарні файли) встановлюються автоматично
через postinstall hook. Якщо автоматичне встановлення не вдається, Gateway все одно запускається
звичайно й повідомляє про відсутню залежність через `openclaw acp doctor`.

### MCP-міст інструментів Plugin

За замовчуванням сесії ACPX **не** надають інструменти, зареєстровані Plugin OpenClaw,
обв’язці ACP.

Якщо ви хочете, щоб ACP-агенти, як-от Codex або Claude Code, викликали встановлені
інструменти Plugin OpenClaw, як-от memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер із назвою `openclaw-plugin-tools` у bootstrap сесії ACPX.
- Надає інструменти Plugin, уже зареєстровані встановленими та ввімкненими Plugin
  OpenClaw.
- Залишає функцію явною та вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів обв’язки ACP.
- ACP-агенти отримують доступ лише до інструментів Plugin, які вже активні в Gateway.
- Ставтеся до цього як до тієї самої межі довіри, що й дозвіл цим Plugin виконуватися в
  самому OpenClaw.
- Перегляньте встановлені Plugin перед увімкненням.

Власні `mcpServers` і надалі працюють як раніше. Вбудований міст plugin-tools є
додатковою opt-in зручністю, а не заміною загальної конфігурації MCP-сервера.

### MCP-міст інструментів OpenClaw

За замовчуванням сесії ACPX також **не** надають вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст core-tools, коли ACP-агенту потрібні вибрані
вбудовані інструменти, як-от `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер із назвою `openclaw-tools` у bootstrap сесії ACPX.
- Надає вибрані вбудовані інструменти OpenClaw. Початковий сервер надає `cron`.
- Залишає доступ до core-tool явним і вимкненим за замовчуванням.

### Конфігурація тайм-ауту runtime-операцій

Plugin `acpx` за замовчуванням дає 120 секунд на запуск вбудованого runtime та операції керування.
Це дає повільнішим обв’язкам, як-от Gemini CLI, достатньо часу
для завершення запуску та ініціалізації ACP. Перевизначте це, якщо вашому хосту потрібен
інший ліміт операцій:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Runtime turns використовують тайм-аути агентів/запусків OpenClaw, включно з `/acp timeout`.
`sessions_spawn` не приймає перевизначення тайм-ауту для окремого виклику. Перезапустіть
Gateway після зміни цього значення.

### Конфігурація агента health probe

Коли `/acp doctor` або startup probe перевіряє backend, bundled Plugin `acpx`
перевіряє одного агента обв’язки. Якщо `acp.allowedAgents` задано, за замовчуванням використовується
перший дозволений агент; інакше за замовчуванням використовується `codex`. Якщо вашому deployment
потрібен інший ACP-агент для перевірок справності, явно задайте probe agent:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Перезапустіть Gateway після зміни цього значення.

## Конфігурація дозволів

ACP-сесії виконуються неінтерактивно — немає TTY для схвалення або відхилення запитів дозволів на file-write і shell-exec. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи обв’язки ACPX відокремлені від exec approvals OpenClaw і від прапорців обходу vendor CLI-backend, як-от Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач рівня обв’язки для ACP-сесій.

Ширше порівняння між OpenClaw `tools.exec.mode`, схваленнями Codex Guardian
і дозволами обв’язки ACPX див. у
[Режими дозволів](/uk/tools/permission-modes).

### `permissionMode`

Керує тим, які операції агент обв’язки може виконувати без запиту.

| Значення       | Поведінка                                                |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматично схвалювати всі записи файлів і shell-команди. |
| `approve-reads` | Автоматично схвалювати лише читання; записи й exec потребують запитів. |
| `deny-all`      | Відхиляти всі запити дозволів.                           |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би з’явитися запит дозволу, але інтерактивний TTY недоступний (що завжди так для ACP-сесій).

| Значення | Поведінка                                                        |
| ------ | ----------------------------------------------------------------- |
| `fail` | Перервати сесію з `AcpRuntimeError`. **(за замовчуванням)**      |
| `deny` | Тихо відхилити дозвіл і продовжити (м’яка деградація).           |

### Конфігурація

Задайте через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Перезапустіть Gateway після зміни цих значень.

<Warning>
OpenClaw за замовчуванням використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних ACP-сесіях будь-який write або exec, що запускає запит дозволу, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сесії деградували м’яко замість аварійного завершення.
</Warning>

## Пов’язане

- [ACP agents](/uk/tools/acp-agents) — огляд, операторський runbook, концепції
- [Субагенти](/uk/tools/subagents)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
