---
read_when:
    - Встановлення або налаштування обв’язки acpx для Claude Code / Codex / Gemini CLI
    - Увімкнення MCP-моста plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація середовища acpx, налаштування плагіна, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-07-12T13:43:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Огляд, інструкцію для оператора та опис концепцій див. у розділі [агенти ACP](/uk/tools/acp-agents).

На цій сторінці описано конфігурацію середовища виконання acpx, налаштування Plugin для мостів MCP і конфігурацію дозволів.

Використовуйте цю сторінку лише під час налаштування маршруту ACP/acpx. Для конфігурації нативного середовища виконання сервера застосунків Codex використовуйте [середовище виконання Codex](/uk/plugins/codex-harness). Для ключів OpenAI API або конфігурації постачальника моделей через Codex OAuth використовуйте [OpenAI](/uk/providers/openai).

Codex має два маршрути OpenClaw:

| Маршрут                          | Конфігурація/команда                                    | Сторінка налаштування                       |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Нативний сервер застосунків Codex | `/codex ...`, посилання на агентів `openai/gpt-*`       | [Середовище виконання Codex](/uk/plugins/codex-harness) |
| Явний адаптер Codex ACP          | `/acp spawn codex`, `runtime: "acp", agentId: "codex"`  | Ця сторінка                                 |

Віддавайте перевагу нативному маршруту, якщо вам явно не потрібна поведінка ACP/acpx.

## Підтримка середовища виконання acpx (поточна)

Вбудовані псевдоніми середовищ виконання acpx (із закріпленої залежності `acpx`):

| Псевдонім   | Обгортає                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
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
| `openclaw`   | Міст OpenClaw ACP (нативна команда `openclaw acp`)                                                              |
| `pi`         | [Агент програмування Pi](https://github.com/mariozechner/pi)                                                    |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` і `factorydroid` також зіставляються з вбудованим адаптером `droid`.

Коли OpenClaw використовує бекенд acpx, віддавайте перевагу цим значенням для `agentId`, якщо ваша конфігурація acpx не визначає власні псевдоніми агентів.
Якщо локальна інсталяція Cursor усе ще надає ACP як `agent acp`, перевизначте команду агента `cursor` у конфігурації acpx замість зміни вбудованого типового значення.

Безпосереднє використання CLI acpx також дає змогу звертатися до довільних адаптерів через `--agent <command>`, але цей необроблений обхідний механізм є функцією CLI acpx (а не звичайним шляхом `agentId` у OpenClaw).

Керування моделлю залежить від можливостей адаптера. OpenClaw нормалізує посилання на моделі Codex ACP перед запуском. Іншим середовищам виконання потрібні підтримка ACP `models` і `session/set_model`; якщо середовище виконання не надає ані цієї можливості ACP, ані власного прапорця моделі під час запуску, OpenClaw/acpx не може примусово вибрати модель.

## Обов’язкова конфігурація

Базова конфігурація ядра ACP:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. Типове значення — true; установіть false, щоб призупинити диспетчеризацію ACP, зберігши елементи керування /acp.
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
      // Типові значення: coalesceIdleMs: 350, maxChunkChars: 1800; тут їх наведено явно.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
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
        // Типове значення вже true; тут його наведено явно.
        spawnSessions: true,
      },
    },
  },
}
```

Якщо створення ACP із прив’язкою до гілки не працює, спочатку перевірте прапорець функції адаптера:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Прив’язки до поточної розмови не потребують створення дочірньої гілки. Для них потрібні активний контекст розмови та адаптер каналу, що надає прив’язки розмов ACP.

Див. [довідник із конфігурації](/uk/gateway/configuration-reference).

## Налаштування Plugin для бекенду acpx

Пакетні інсталяції використовують офіційний Plugin середовища виконання `@openclaw/acpx` для ACP.
Установіть і ввімкніть його перед використанням сеансів середовища виконання ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Після `pnpm install` у робочих копіях вихідного коду також можна використовувати локальний Plugin робочого простору.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете повернутися до пакетного Plugin, скористайтеся явним шляхом пакета:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Локальна інсталяція з робочого простору під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан бекенду:

```text
/acp doctor
```

### Перевірка запуску середовища виконання acpx

Plugin `acpx` вбудовує середовище виконання ACP безпосередньо (без окремого виконуваного файла `acpx` або версії для налаштування). Типово він реєструє вбудований бекенд під час запуску Gateway й очікує на перевірку запуску перед сигналом готовності `ready` від Gateway. Установлюйте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` або `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` лише для скриптів чи середовищ, у яких перевірку запуску навмисно вимкнено. Виконайте `/acp doctor` для явної перевірки на вимогу.

Перевизначайте команду окремого агента ACP за допомогою структурованих аргументів, коли шлях або значення прапорця має залишатися одним елементом argv:

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

- `agents.<id>.command` — виконуваний файл або наявний рядок команди для цього агента ACP.
- `agents.<id>.args` — необов’язковий параметр. Кожен елемент масиву береться в оболонкові лапки, перш ніж OpenClaw передає його через поточний реєстр рядків команд acpx.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне завантаження адаптера

`acpx` автоматично завантажує адаптери ACP (наприклад, мости Claude і Codex ACP) через `npx` під час першого використання. Вам не потрібно встановлювати пакети адаптерів вручну, і для самого OpenClaw немає окремого кроку після інсталяції. Якщо завантажити або запустити адаптер не вдається, `/acp doctor` повідомляє про помилку.

### Міст MCP для інструментів Plugin

Типово сеанси ACPX **не** надають середовищу виконання ACP інструменти, зареєстровані Plugin OpenClaw.

Якщо ви хочете, щоб агенти ACP, як-от Codex або Claude Code, могли викликати інструменти встановлених Plugin OpenClaw, наприклад пошук у пам’яті або збереження до неї, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Результат:

- Додає вбудований сервер MCP із назвою `openclaw-plugin-tools` до початкового налаштування сеансу ACPX.
- Надає інструменти Plugin, уже зареєстровані встановленими й увімкненими Plugin OpenClaw.
- Залишає функцію явною та типово вимкненою.

Примітки щодо безпеки й довіри:

- Це розширює набір інструментів середовища виконання ACP.
- Агенти ACP отримують доступ лише до інструментів Plugin, які вже активні в Gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим Plugin виконуватися в самому OpenClaw.
- Перевірте встановлені Plugin перед увімкненням.

Власні `mcpServers` і надалі працюють як раніше. Вбудований міст інструментів Plugin — це додаткова можливість, яку потрібно явно ввімкнути, а не заміна загальної конфігурації сервера MCP.

### Міст MCP для інструментів OpenClaw

Типово сеанси ACPX також **не** надають вбудовані інструменти OpenClaw через MCP. Увімкніть окремий міст інструментів ядра, коли агенту ACP потрібні вибрані вбудовані інструменти, як-от `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Результат:

- Додає вбудований сервер MCP із назвою `openclaw-tools` до початкового налаштування сеансу ACPX.
- Надає вибрані вбудовані інструменти OpenClaw. Початкова версія сервера надає `cron`.
- Залишає надання інструментів ядра явним і типово вимкненим.

### Конфігурація часу очікування операцій середовища виконання

Plugin `acpx` типово надає операціям запуску та керування вбудованим середовищем виконання 120 секунд. Це дає повільнішим середовищам виконання, як-от Gemini CLI, достатньо часу для завершення запуску й ініціалізації ACP. Перевизначте значення, якщо вашому хосту потрібне інше обмеження тривалості операцій:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Ітерації середовища виконання використовують тайм-аути agent/run OpenClaw, зокрема `/acp timeout`.
`sessions_spawn` не приймає перевизначень тайм-ауту для окремого виклику; шлях для оператора — `agents.defaults.subagents.runTimeoutSeconds`. Перезапустіть Gateway після зміни `timeoutSeconds`.

### Конфігурація агента для перевірки стану

Коли `/acp doctor` або перевірка запуску перевіряє бекенд, комплектний Plugin `acpx` перевіряє один агент середовища виконання. Якщо встановлено `acp.allowedAgents`, типово використовується перший дозволений агент; інакше типовим є `codex`. Якщо вашому розгортанню для перевірок стану потрібен інший агент ACP, укажіть агента перевірки явно:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Перезапустіть Gateway після зміни цього значення.

## Конфігурація дозволів

Сеанси ACP працюють неінтерактивно — TTY для схвалення або відхилення запитів дозволу на запис файлів і виконання команд оболонки немає. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи середовища виконання ACPX відокремлені від схвалень виконання OpenClaw і прапорців обходу постачальника для бекенду CLI, як-от `--permission-mode bypassPermissions` у Claude CLI. ACPX `approve-all` — аварійний перемикач на рівні середовища виконання для сеансів ACP.

Ширше порівняння `tools.exec.mode` у OpenClaw, схвалень Codex Guardian і дозволів середовища виконання ACPX див. у розділі [режими дозволів](/uk/tools/permission-modes).

### `permissionMode`

Керує тим, які операції агент середовища виконання може виконувати без запиту.

| Значення        | Поведінка                                                                      |
| --------------- | ------------------------------------------------------------------------------ |
| `approve-all`   | Автоматично схвалювати всі операції запису файлів і команди оболонки.          |
| `approve-reads` | Автоматично схвалювати лише читання; запис і виконання потребують підтверджень. |
| `deny-all`      | Відхиляти всі запити на дозвіл.                                                |

### `nonInteractivePermissions`

Визначає, що відбувається, коли має з’явитися запит на дозвіл, але інтерактивний TTY недоступний (що завжди так для сеансів ACP).

| Значення | Поведінка                                                                 |
| -------- | ------------------------------------------------------------------------- |
| `fail`   | Перервати сеанс із помилкою `PermissionPromptUnavailableError`. **(типово)** |
| `deny`   | Без повідомлення відхилити дозвіл і продовжити роботу (поступове погіршення функціональності). |

### Конфігурація

Налаштуйте через конфігурацію плагіна:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть Gateway.

<Warning>
Типові значення OpenClaw: `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сеансах ACP будь-яка операція запису або виконання, що спричиняє запит на дозвіл, може завершитися помилкою `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Якщо потрібно обмежити дозволи, установіть для `nonInteractivePermissions` значення `deny`, щоб сеанси поступово втрачали функціональність, а не аварійно завершувалися.
</Warning>

## Пов’язані матеріали

- [Агенти ACP](/uk/tools/acp-agents) — огляд, інструкція оператора, концепції
- [Субагенти](/uk/tools/subagents)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
