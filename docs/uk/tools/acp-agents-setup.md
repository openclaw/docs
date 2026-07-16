---
read_when:
    - Встановлення або налаштування середовища acpx для Claude Code / Codex / Gemini CLI
    - Увімкнення MCP-мосту plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація середовища acpx, налаштування плагіна, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-07-16T18:38:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Огляд, інструкції для оператора та основні поняття наведено в розділі [Агенти ACP](/uk/tools/acp-agents).

На цій сторінці описано конфігурацію середовища виконання acpx, налаштування плагінів для мостів MCP і конфігурацію дозволів.

Використовуйте цю сторінку лише під час налаштування маршруту ACP/acpx. Для конфігурації нативного середовища виконання Codex
app-server використовуйте [Середовище виконання Codex](/uk/plugins/codex-harness). Для
ключів OpenAI API або конфігурації постачальника моделей Codex OAuth використовуйте
[OpenAI](/uk/providers/openai).

Codex має два маршрути OpenClaw:

| Маршрут                      | Конфігурація/команда                                         | Сторінка налаштування                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Нативний Codex app-server    | Посилання на агентів `/codex ...`, `openai/gpt-*`                | [Середовище виконання Codex](/uk/plugins/codex-harness) |
| Явний адаптер Codex ACP | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ця сторінка                               |

Віддавайте перевагу нативному маршруту, якщо поведінка ACP/acpx не потрібна явно.

## Підтримка середовища виконання acpx (поточна)

Вбудовані псевдоніми середовищ виконання acpx (із закріпленої залежності `acpx`):

| Псевдонім        | Обгортає                                                                                                           |
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
| `openclaw`   | Міст OpenClaw ACP (нативний `openclaw acp`)                                                                     |
| `pi`         | [Агент програмування Pi](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` і `factorydroid` також розпізнаються як вбудований адаптер `droid`.

Коли OpenClaw використовує серверну частину acpx, віддавайте перевагу цим значенням для `agentId`, якщо в конфігурації acpx не визначено власні псевдоніми агентів.
Якщо локальна інсталяція Cursor досі надає ACP як `agent acp`, перевизначте команду агента `cursor` у конфігурації acpx замість зміни вбудованого типового значення.

Безпосереднє використання CLI acpx також дає змогу спрямовувати запити до довільних адаптерів через `--agent <command>`, але цей необроблений обхідний механізм є функцією CLI acpx (а не звичайним шляхом OpenClaw `agentId`).

Керування моделлю залежить від можливостей адаптера. Посилання на моделі Codex ACP
нормалізуються OpenClaw перед запуском. Іншим середовищам виконання потрібна підтримка ACP `models` разом із
`session/set_model`; якщо середовище виконання не надає ані цієї можливості ACP,
ані власного прапорця моделі під час запуску, OpenClaw/acpx не може примусово вибрати модель.

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

Конфігурація прив’язування потоків залежить від адаптера каналу. Приклад для Discord:

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

Якщо створення ACP із прив’язкою до потоку не працює, спочатку перевірте прапорець функції адаптера:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Прив’язування до поточної розмови не потребує створення дочірнього потоку. Для нього потрібні активний контекст розмови й адаптер каналу, який надає прив’язування розмов ACP.

Див. [Довідник із конфігурації](/uk/gateway/configuration-reference).

## Налаштування плагіна для серверної частини acpx

Пакетні інсталяції використовують офіційний плагін середовища виконання `@openclaw/acpx` для ACP.
Установіть і ввімкніть його перед використанням сеансів середовища виконання ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

У вихідних робочих копіях після `pnpm install` також можна використовувати локальний плагін робочого простору.

Почніть із:

```text
/acp doctor
```

Якщо `acpx` вимкнено, заборонено через `plugins.allow` / `plugins.deny` або потрібно
повернутися до пакетного плагіна, використовуйте явний шлях до пакета:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Установлення локального робочого простору під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте працездатність серверної частини:

```text
/acp doctor
```

### Перевірка запуску середовища виконання acpx

Плагін `acpx` вбудовує середовище виконання ACP безпосередньо (без окремого виконуваного файла `acpx` або
версії для налаштування). Типово він реєструє вбудовану серверну частину під час
запуску Gateway і очікує завершення перевірки запуску перед сигналом gateway `ready`.
Установлюйте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` або
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` лише для скриптів або середовищ, у яких
перевірку запуску навмисно залишено вимкненою. Виконайте `/acp doctor` для явної
перевірки на вимогу.

Перевизначте команду окремого агента ACP за допомогою структурованих аргументів, якщо шлях
або значення прапорця має залишатися одним токеном argv:

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

Див. [Плагіни](/uk/tools/plugin).

### Автоматичне завантаження адаптера

`acpx` автоматично завантажує адаптери ACP (наприклад, мости Claude і Codex ACP)
через `npx` під час першого використання. Пакети адаптерів не потрібно встановлювати
вручну, а для самого OpenClaw немає окремого кроку після встановлення. Якщо
завантаження або запуск адаптера завершується помилкою, `/acp doctor` повідомляє про неї.

### Міст MCP для інструментів плагінів

Типово сеанси ACPX **не** надають середовищу виконання ACP доступу до інструментів,
зареєстрованих плагінами OpenClaw.

Щоб агенти ACP, як-от Codex або Claude Code, могли викликати інструменти
встановлених плагінів OpenClaw, наприклад пошук або збереження в пам’яті, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Результат:

- Вбудований сервер MCP з назвою `openclaw-plugin-tools` додається до початкового налаштування
  сеансу ACPX.
- Надаються інструменти плагінів, уже зареєстровані встановленими й увімкненими плагінами
  OpenClaw.
- Активний ідентифікатор сеансу ACP передається фабрикам інструментів плагінів, тому
  інструменти з областю дії агента залишаються в просторі імен цього агента.
- Функція залишається явною й типово вимкненою.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів середовища виконання ACP.
- Агенти ACP отримують доступ лише до інструментів плагінів, які вже активні в gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим плагінам виконуватися
  в самому OpenClaw.
- Перевірте встановлені плагіни перед увімкненням.

Власні `mcpServers` і надалі працюють як раніше. Вбудований міст інструментів плагінів —
це додаткова необов’язкова зручність, а не заміна загальної конфігурації сервера MCP.

### Міст MCP для інструментів OpenClaw

Типово сеанси ACPX також **не** надають вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст основних інструментів, коли агенту ACP потрібні вибрані
вбудовані інструменти, як-от `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Результат:

- Вбудований сервер MCP з назвою `openclaw-tools` додається до початкового налаштування
  сеансу ACPX.
- Надаються вибрані вбудовані інструменти OpenClaw. Початковий сервер надає `cron`.
- Доступ до основних інструментів залишається явним і типово вимкненим.

### Конфігурація часу очікування операцій середовища виконання

Плагін `acpx` типово надає операціям запуску й керування вбудованого середовища виконання 120
секунд. Це дає повільнішим середовищам виконання, як-от Gemini CLI, достатньо часу
для завершення запуску й ініціалізації ACP. Перевизначте значення, якщо хосту потрібне
інше обмеження тривалості операції:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Для ітерацій середовища виконання використовуються тайм-аути агента/запуску OpenClaw, зокрема `/acp timeout`.
`sessions_spawn` не приймає перевизначення тайм-ауту для окремого виклику; шлях для оператора —
`agents.defaults.subagents.runTimeoutSeconds`. Перезапустіть gateway після
зміни `timeoutSeconds`.

### Конфігурація агента перевірки працездатності

Коли `/acp doctor` або перевірка запуску перевіряє серверну частину, комплектний плагін `acpx`
перевіряє один агент середовища виконання. Якщо встановлено `acp.allowedAgents`, типовим значенням стає
перший дозволений агент; інакше типовим значенням є `codex`. Якщо розгортанню
потрібен інший агент ACP для перевірок працездатності, установіть агент перевірки явно:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Перезапустіть gateway після зміни цього значення.

## Конфігурація дозволів

Сеанси ACP виконуються неінтерактивно — немає TTY для схвалення або відхилення запитів дозволів на запис файлів і виконання команд оболонки. Plugin acpx надає два ключі конфігурації, які визначають спосіб обробки дозволів:

Ці дозволи середовища ACPX відокремлені від схвалень виконання OpenClaw і від прапорців обходу обмежень постачальника для бекенду CLI, як-от Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач на рівні середовища для сеансів ACP.

Докладніше порівняння OpenClaw `tools.exec.mode`, схвалень Codex Guardian
і дозволів середовища ACPX див. у розділі
[Режими дозволів](/uk/tools/permission-modes).

### `permissionMode`

Визначає, які операції агент середовища може виконувати без запиту.

| Значення           | Поведінка                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматично схвалювати всі записи файлів і команди оболонки.          |
| `approve-reads` | Автоматично схвалювати лише читання; запис і виконання потребують запитів. |
| `deny-all`      | Відхиляти всі запити дозволів.                              |

### `nonInteractivePermissions`

Визначає, що відбувається, коли мав би з’явитися запит дозволу, але інтерактивний TTY недоступний (що завжди актуально для сеансів ACP).

| Значення  | Поведінка                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Перервати сеанс із `PermissionPromptUnavailableError`. **(за замовчуванням)** |
| `deny` | Без повідомлення відхилити дозвіл і продовжити роботу (поступове погіршення функціональності).        |

### Конфігурація

Налаштуйте через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Перезапустіть Gateway після зміни цих значень.

<Warning>
За замовчуванням OpenClaw використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сеансах ACP будь-який запис або виконання, що спричиняє запит дозволу, може завершитися помилкою `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Якщо потрібно обмежити дозволи, установіть для `nonInteractivePermissions` значення `deny`, щоб сеанси поступово втрачали функціональність, а не аварійно завершувалися.
</Warning>

## Пов’язані матеріали

- [Агенти ACP](/uk/tools/acp-agents) — огляд, інструкція для оператора, поняття
- [Підагентів](/uk/tools/subagents)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
