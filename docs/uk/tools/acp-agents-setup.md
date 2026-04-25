---
read_when:
    - Установлення або налаштування acpx harness для Claude Code / Codex / Gemini CLI
    - Увімкнення мосту MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація acpx harness, налаштування Plugin, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-04-25T04:14:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddbcfb035f1d0a1902b49b9b292511adf496a35dd3bfd4c008cc335bbce0ebe
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Щоб переглянути огляд, operator runbook і концепції, див. [Агенти ACP](/uk/tools/acp-agents).
На цій сторінці описано конфігурацію acpx harness, налаштування Plugin для мостів MCP і
конфігурацію дозволів.

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
Якщо ваша локальна інсталяція Cursor досі показує ACP як `agent acp`, перевизначте команду агента `cursor` у своїй конфігурації acpx замість зміни вбудованого значення за замовчуванням.

Пряме використання CLI acpx також може звертатися до довільних адаптерів через `--agent <command>`, але цей необроблений обхідний механізм є функцією CLI acpx (а не звичайним шляхом OpenClaw `agentId`).

## Обов’язкова конфігурація

Базова конфігурація ACP:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. Значення за замовчуванням — true; встановіть false, щоб призупинити диспетчеризацію ACP, зберігши елементи керування /acp.
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

Конфігурація прив’язки потоків залежить від конкретного адаптера каналу. Приклад для Discord:

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

Якщо запуск ACP із прив’язкою до потоку не працює, спочатку перевірте прапорець функції адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірнього потоку. Для них потрібен активний контекст розмови й адаптер каналу, який надає прив’язки розмов ACP.

Див. [Довідник із конфігурації](/uk/gateway/configuration-reference).

## Налаштування Plugin для бекенду acpx

Свіжі інсталяції постачаються з увімкненим за замовчуванням вбудованим runtime Plugin `acpx`, тому ACP
зазвичай працює без кроку ручного встановлення Plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny`, або хочете
переключитися на локальну checkout-версію для розробки, використовуйте явний шлях Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Локальне встановлення з workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан бекенду:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

За замовчуванням вбудований Plugin `acpx` використовує свій локальний для Plugin зафіксований бінарний файл (`node_modules/.bin/acpx` усередині пакета Plugin). Під час запуску бекенд реєструється як неготовий, а фонове завдання перевіряє `acpx --version`; якщо бінарний файл відсутній або не збігається, виконується `npm install --omit=dev --no-save acpx@<pinned>` і повторна перевірка. Увесь цей час Gateway залишається неблокувальним.

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
- `expectedVersion: "any"` вимикає сувору перевірку відповідності версії.
- Власні шляхи `command` вимикають автоматичне встановлення, локальне для Plugin.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально за допомогою `npm install -g openclaw`, runtime-залежності acpx
(бінарні файли для конкретної платформи) встановлюються автоматично
через хук postinstall. Якщо автоматичне встановлення не вдається, Gateway все одно запускається
нормально й повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP для інструментів Plugin

За замовчуванням сеанси ACPX **не** надають ACP harness доступу до інструментів, зареєстрованих Plugin OpenClaw.

Якщо ви хочете, щоб агенти ACP, такі як Codex або Claude Code, могли викликати встановлені
інструменти Plugin OpenClaw, наприклад memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований сервер MCP з назвою `openclaw-plugin-tools` у bootstrap сеансу ACPX.
- Надає доступ до інструментів Plugin, уже зареєстрованих установленими й увімкненими Plugin OpenClaw.
- Зберігає цю можливість явною та вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів ACP harness.
- Агенти ACP отримують доступ лише до інструментів Plugin, які вже активні в Gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим Plugins виконуватися
  у самому OpenClaw.
- Перевірте встановлені Plugins перед увімкненням.

Власні `mcpServers` і далі працюють як раніше. Вбудований міст plugin-tools є
додатковою зручною можливістю з явним увімкненням, а не заміною загальної конфігурації сервера MCP.

### Міст MCP для інструментів OpenClaw

За замовчуванням сеанси ACPX також **не** надають вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст core-tools, коли агенту ACP потрібні вибрані
вбудовані інструменти, наприклад `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований сервер MCP з назвою `openclaw-tools` у bootstrap сеансу ACPX.
- Надає доступ до вибраних вбудованих інструментів OpenClaw. Початковий сервер надає `cron`.
- Зберігає надання доступу до інструментів core явним і вимкненим за замовчуванням.

### Конфігурація тайм-ауту runtime

За замовчуванням вбудований Plugin `acpx` встановлює для вбудованих циклів runtime
тайм-аут 120 секунд. Це дає повільнішим harness, таким як Gemini CLI, достатньо часу для завершення
запуску й ініціалізації ACP. Перевизначте це значення, якщо вашому хосту потрібне інше
обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть Gateway.

### Конфігурація агента для probe перевірки стану

Вбудований Plugin `acpx` перевіряє один агент harness, коли визначає, чи готовий
бекенд вбудованого runtime. Якщо встановлено `acp.allowedAgents`, за замовчуванням використовується
перший дозволений агент; інакше за замовчуванням використовується `codex`. Якщо вашому розгортанню
потрібен інший агент ACP для перевірок стану, явно встановіть probe-агента:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть Gateway.

## Конфігурація дозволів

Сеанси ACP працюють у неінтерактивному режимі — TTY для підтвердження або відхилення запитів на дозволи запису файлів і виконання shell-команд відсутній. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи harness ACPX є окремими від підтверджень виконання OpenClaw і окремими від прапорців обходу постачальника для CLI-бекенду, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач на рівні harness для сеансів ACP.

### `permissionMode`

Керує тим, які операції агент harness може виконувати без запиту.

| Значення        | Поведінка                                                 |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматично підтверджує всі записи файлів і shell-команди. |
| `approve-reads` | Автоматично підтверджує лише читання; запис і exec потребують запитів. |
| `deny-all`      | Відхиляє всі запити на дозволи.                           |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли має бути показано запит на дозвіл, але інтерактивний TTY недоступний (що для сеансів ACP так є завжди).

| Значення | Поведінка                                                        |
| -------- | ---------------------------------------------------------------- |
| `fail`   | Перериває сеанс з `AcpRuntimeError`. **(за замовчуванням)**      |
| `deny`   | Мовчки відхиляє дозвіл і продовжує роботу (плавна деградація).   |

### Конфігурація

Установлюється через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть Gateway.

> **Важливо:** Зараз OpenClaw за замовчуванням використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сеансах ACP будь-який запис або exec, що викликає запит на дозвіл, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сеанси деградували плавно замість аварійного завершення.

## Пов’язане

- [Агенти ACP](/uk/tools/acp-agents) — огляд, operator runbook, концепції
- [Sub-agents](/uk/tools/subagents)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
