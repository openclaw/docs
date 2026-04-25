---
read_when:
    - Встановлення або налаштування acpx harness для Claude Code / Codex / Gemini CLI
    - Увімкнення мосту MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація acpx harness, налаштування Plugin, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-04-25T20:55:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a9c83025c98995783c2489abadff0c27340959e3daa548dad0ea8131830d26c
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Огляд, інструкції для операторів і концепції див. у [ACP agents](/uk/tools/acp-agents).

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
Якщо ваша локальна інсталяція Cursor досі надає ACP як `agent acp`, перевизначте команду агента `cursor` у вашій конфігурації acpx замість зміни вбудованого значення за замовчуванням.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей необроблений обхідний механізм є функцією CLI acpx (а не звичайним шляхом OpenClaw `agentId`).

Керування моделлю залежить від можливостей адаптера. Посилання на моделі Codex ACP
нормалізуються OpenClaw перед запуском. Іншим harness потрібні ACP `models` і
підтримка `session/set_model`; якщо harness не надає ні цієї можливості ACP,
ні власного прапорця моделі під час запуску, OpenClaw/acpx не зможе примусово
вибрати модель.

## Обов’язкова конфігурація

Базова конфігурація ACP:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. Типове значення — true; встановіть false, щоб призупинити диспетчеризацію ACP, зберігши елементи керування /acp.
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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Якщо породження ACP із прив’язкою до потоку не працює, спочатку перевірте прапорець функції адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірнього потоку. Вони потребують активного контексту розмови й адаптера каналу, який надає прив’язки розмов ACP.

Див. [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування Plugin для бекенда acpx

У нових інсталяціях вбудований runtime Plugin `acpx` увімкнено за замовчуванням, тому ACP
зазвичай працює без кроку ручного встановлення Plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
перемкнутися на локальну checkout-версію для розробки, використайте явний шлях Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Локальне встановлення з робочого простору під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан бекенда:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

За замовчуванням вбудований Plugin `acpx` використовує власний закріплений двійковий файл Plugin (`node_modules/.bin/acpx` усередині пакета Plugin). Під час запуску бекенд реєструється як неготовий, а фонове завдання перевіряє `acpx --version`; якщо двійковий файл відсутній або не збігається, виконується `npm install --omit=dev --no-save acpx@<pinned>` із повторною перевіркою. Gateway увесь цей час залишається неблокувальним.

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

- `command` приймає абсолютний шлях, відносний шлях (обчислюється від робочого простору OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає сувору перевірку відповідності версії.
- Користувацькі шляхи `command` вимикають автоматичне встановлення на рівні Plugin.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально через `npm install -g openclaw`, runtime-залежності acpx
(двійкові файли для конкретної платформи) встановлюються автоматично
через хук postinstall. Якщо автоматичне встановлення завершується невдало, gateway усе одно запускається
нормально й повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP для інструментів Plugin

За замовчуванням сесії ACPX **не** надають інструменти, зареєстровані Plugin в OpenClaw, до
ACP harness.

Якщо ви хочете, щоб ACP-агенти, такі як Codex або Claude Code, могли викликати встановлені
інструменти Plugin OpenClaw, такі як recall/store пам’яті, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер з назвою `openclaw-plugin-tools` у bootstrap сесії ACPX.
- Надає інструменти Plugin, уже зареєстровані встановленими й увімкненими Plugin OpenClaw.
- Зберігає цю функцію явною та вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів ACP harness.
- ACP-агенти отримують доступ лише до інструментів Plugin, які вже активні в gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим Plugin виконуватися
  в самому OpenClaw.
- Перегляньте встановлені Plugin перед увімкненням.

Користувацькі `mcpServers` і далі працюють як раніше. Вбудований міст plugin-tools —
це додаткова зручність із явним увімкненням, а не заміна загальної конфігурації MCP-сервера.

### Міст MCP для інструментів OpenClaw

За замовчуванням сесії ACPX також **не** надають вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст core-tools, коли ACP-агенту потрібні вибрані
вбудовані інструменти, такі як `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер з назвою `openclaw-tools` у bootstrap сесії ACPX.
- Надає вибрані вбудовані інструменти OpenClaw. Початковий сервер надає `cron`.
- Зберігає надання core-інструментів явним і вимкненим за замовчуванням.

### Конфігурація тайм-ауту runtime

За замовчуванням вбудований Plugin `acpx` використовує для кроків вбудованого runtime
тайм-аут 120 секунд. Це дає повільнішим harness, таким як Gemini CLI, достатньо
часу для завершення запуску й ініціалізації ACP. Перевизначте його, якщо вашому хосту потрібне інше
обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація агента для перевірки стану

Вбудований Plugin `acpx` перевіряє один агент harness, коли визначає, чи готовий
бекенд вбудованого runtime. Якщо встановлено `acp.allowedAgents`, за замовчуванням використовується
перший дозволений агент; інакше використовується `codex`. Якщо у вашому розгортанні
для перевірок стану потрібен інший ACP-агент, явно задайте агента перевірки:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Конфігурація дозволів

Сесії ACP виконуються неінтерактивно — немає TTY, щоб підтверджувати або відхиляти запити дозволів на запис файлів і виконання shell-команд. Plugin acpx надає два ключі конфігурації, які визначають, як обробляються дозволи:

Ці дозволи ACPX harness є окремими від підтверджень виконання OpenClaw і окремими від прапорців обходу постачальника CLI-бекенда, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач рівня harness для сесій ACP.

### `permissionMode`

Керує тим, які операції агент harness може виконувати без запиту.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматично підтверджує всі записи файлів і shell-команди. |
| `approve-reads` | Автоматично підтверджує лише читання; запис і exec вимагають запитів. |
| `deny-all`      | Відхиляє всі запити дозволів.                              |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би з’явитися запит дозволу, але інтерактивний TTY недоступний (а для сесій ACP це так завжди).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Перериває сесію з `AcpRuntimeError`. **(типове значення)**        |
| `deny` | Тихо відхиляє дозвіл і продовжує роботу (плавна деградація).      |

### Конфігурація

Задається через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

> **Важливо:** Наразі в OpenClaw за замовчуванням використовуються `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сесіях ACP будь-який запис або exec, що спричиняє запит дозволу, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сесії деградували плавно, а не аварійно завершувалися.

## Пов’язане

- [ACP agents](/uk/tools/acp-agents) — огляд, інструкції для операторів, концепції
- [Sub-agents](/uk/tools/subagents)
- [Multi-agent routing](/uk/concepts/multi-agent)
