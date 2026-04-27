---
read_when:
    - Установлення або налаштування acpx harness для Claude Code / Codex / Gemini CLI
    - Увімкнення мосту MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація acpx harness, налаштування Plugin, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-04-27T18:27:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Щоб переглянути огляд, runbook для операторів і концепції, див. [Агенти ACP](/uk/tools/acp-agents).

Розділи нижче охоплюють конфігурацію acpx harness, налаштування Plugin для мостів MCP і конфігурацію дозволів.

Використовуйте цю сторінку лише тоді, коли ви налаштовуєте маршрут ACP/acpx. Для нативної конфігурації runtime app-server Codex використовуйте [Codex harness](/uk/plugins/codex-harness). Для ключів API OpenAI або конфігурації провайдера моделей Codex OAuth використовуйте [OpenAI](/uk/providers/openai).

Codex має два маршрути OpenClaw:

| Маршрут                    | Конфігурація/команда                                   | Сторінка налаштування                  |
| -------------------------- | ------------------------------------------------------ | -------------------------------------- |
| Нативний app-server Codex  | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/uk/plugins/codex-harness) |
| Явний адаптер Codex ACP    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ця сторінка                            |

Надавайте перевагу нативному маршруту, якщо вам не потрібна саме поведінка ACP/acpx.

## Підтримка acpx harness (поточна)

Поточні вбудовані псевдоніми harness у acpx:

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

Коли OpenClaw використовує бекенд acpx, надавайте перевагу цим значенням для `agentId`, якщо у вашій конфігурації acpx не визначено власні псевдоніми агентів.
Якщо у вашому локальному встановленні Cursor ACP досі доступний як `agent acp`, перевизначте команду агента `cursor` у вашій конфігурації acpx, а не змінюйте вбудоване типове значення.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей сирий запасний варіант є можливістю CLI acpx (а не звичайного шляху OpenClaw `agentId`).

Керування моделлю залежить від можливостей адаптера. Посилання на моделі Codex ACP нормалізуються OpenClaw перед запуском. Інші harness потребують ACP `models` і підтримки `session/set_model`; якщо harness не надає ані цієї можливості ACP, ані власного прапорця моделі для запуску, OpenClaw/acpx не зможе примусово вибрати модель.

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

Конфігурація прив’язки до гілок залежить від адаптера каналу. Приклад для Discord:

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

Якщо створення ACP через прив’язку до гілки не працює, спочатку перевірте прапорець можливості адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірньої гілки. Вони потребують активного контексту розмови та адаптера каналу, який надає прив’язки розмов ACP.

Див. [Довідник із конфігурації](/uk/gateway/configuration-reference).

## Налаштування Plugin для бекенда acpx

Нові встановлення постачаються з увімкненим за замовчуванням вбудованим runtime Plugin `acpx`, тож ACP зазвичай працює без ручного встановлення Plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете переключитися на локальний checkout для розробки, використовуйте явний шлях Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Встановлення локального workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан бекенда:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

За замовчуванням вбудований Plugin `acpx` реєструє вбудований бекенд ACP без запуску агента ACP під час старту Gateway. Виконайте `/acp doctor` для явної live-перевірки. Установлюйте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` лише тоді, коли потрібно, щоб Gateway перевіряв налаштованого агента під час запуску.

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

- `command` приймає абсолютний шлях, відносний шлях (відносно workspace OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає сувору перевірку відповідності версії.
- Користувацькі шляхи `command` вимикають автоінсталяцію на рівні Plugin.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально за допомогою `npm install -g openclaw`, runtime-залежності acpx (бінарні файли для конкретної платформи) встановлюються автоматично через хук postinstall. Якщо автоматичне встановлення не вдасться, gateway усе одно запуститься нормально й повідомить про відсутню залежність через `openclaw acp doctor`.

### Міст MCP інструментів Plugin

За замовчуванням сеанси ACPX **не** надають ACP harness доступ до інструментів, зареєстрованих Plugin в OpenClaw.

Якщо ви хочете, щоб агенти ACP, такі як Codex або Claude Code, могли викликати встановлені інструменти Plugin OpenClaw, як-от recall/store пам’яті, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Додає в bootstrap сеансу ACPX вбудований MCP-сервер з назвою `openclaw-plugin-tools`.
- Надає доступ до інструментів Plugin, уже зареєстрованих установленими та увімкненими Plugins OpenClaw.
- Зберігає цю можливість явною та вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів ACP harness.
- Агенти ACP отримують доступ лише до тих інструментів Plugin, які вже активні в gateway.
- Ставтеся до цього як до тієї самої межі довіри, що й до дозволу цим Plugins виконуватися в самому OpenClaw.
- Перегляньте встановлені Plugins перед увімкненням.

Користувацькі `mcpServers` і надалі працюють як раніше. Вбудований міст plugin-tools є додатковою зручною опцією за явною згодою, а не заміною загальної конфігурації MCP-сервера.

### Міст MCP інструментів OpenClaw

За замовчуванням сеанси ACPX також **не** надають доступ до вбудованих інструментів OpenClaw через MCP. Увімкніть окремий міст core-tools, коли агенту ACP потрібні вибрані вбудовані інструменти, як-от `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Додає в bootstrap сеансу ACPX вбудований MCP-сервер з назвою `openclaw-tools`.
- Надає доступ до вибраних вбудованих інструментів OpenClaw. Початково сервер надає `cron`.
- Зберігає доступ до core-інструментів явним і вимкненим за замовчуванням.

### Конфігурація тайм-ауту runtime

Вбудований Plugin `acpx` за замовчуванням встановлює для ходів вбудованого runtime тайм-аут у 120 секунд. Це дає повільнішим harness, таким як Gemini CLI, достатньо часу для завершення запуску та ініціалізації ACP. Перевизначте це значення, якщо вашому хосту потрібне інше обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація агента для health probe

Коли `/acp doctor` або probe запуску за явною згодою перевіряє бекенд, вбудований Plugin `acpx` перевіряє один агент harness. Якщо встановлено `acp.allowedAgents`, за замовчуванням використовується перший дозволений агент; інакше використовується `codex`. Якщо у вашому розгортанні для перевірок працездатності потрібен інший агент ACP, задайте агента для probe явно:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Конфігурація дозволів

Сеанси ACP працюють у неінтерактивному режимі — TTY для схвалення або відхилення запитів на дозвіл запису файлів і виконання shell-команд немає. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи harness ACPX відокремлені від схвалень exec в OpenClaw і відокремлені від прапорців обходу вендора для CLI-бекенда, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач рівня harness для сеансів ACP.

### `permissionMode`

Керує тим, які операції агент harness може виконувати без запиту.

| Значення        | Поведінка                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Автоматично схвалює всі записи у файли та shell-команди. |
| `approve-reads` | Автоматично схвалює лише читання; запис і exec потребують запитів. |
| `deny-all`      | Відхиляє всі запити на дозволи.                          |

### `nonInteractivePermissions`

Керує тим, що станеться, коли мав би з’явитися запит на дозвіл, але інтерактивний TTY недоступний (а для сеансів ACP це так завжди).

| Значення | Поведінка                                                        |
| -------- | ---------------------------------------------------------------- |
| `fail`   | Перериває сеанс з `AcpRuntimeError`. **(типове значення)**       |
| `deny`   | Мовчки відхиляє дозвіл і продовжує роботу (плавна деградація).   |

### Конфігурація

Задається через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

<Warning>
OpenClaw за замовчуванням використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сеансах ACP будь-який запис або exec, що викликає запит на дозвіл, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сеанси переходили в режим плавної деградації, а не аварійно завершувалися.
</Warning>

## Пов’язані матеріали

- [Агенти ACP](/uk/tools/acp-agents) — огляд, runbook для операторів, концепції
- [Sub-agents](/uk/tools/subagents)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
