---
read_when:
    - Встановлення або налаштування acpx harness для Claude Code / Codex / Gemini CLI
    - Увімкнення мосту MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування ACP-агентів: конфігурація acpx harness, налаштування plugin, дозволи'
title: ACP-агенти — налаштування
x-i18n:
    generated_at: "2026-04-27T17:27:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f27cf00a1a6be74efcf2a3725ce7fe005c084fe55c820d982f70fa5836f97fb
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Огляд, операторський runbook і концепції див. у [ACP-агенти](/uk/tools/acp-agents).

Розділи нижче охоплюють конфігурацію acpx harness, налаштування plugin для мостів MCP і налаштування дозволів.

Використовуйте цю сторінку лише тоді, коли налаштовуєте маршрут ACP/acpx. Для нативної конфігурації runtime app-server Codex використовуйте [Codex harness](/uk/plugins/codex-harness). Для ключів API OpenAI або конфігурації постачальника моделей Codex OAuth використовуйте [OpenAI](/uk/providers/openai).

У Codex є два маршрути OpenClaw:

| Маршрут                     | Конфігурація/команда                                    | Сторінка налаштування                  |
| --------------------------- | ------------------------------------------------------- | -------------------------------------- |
| Нативний app-server Codex   | `/codex ...`, `agentRuntime.id: "codex"`                | [Codex harness](/uk/plugins/codex-harness) |
| Явний ACP-адаптер Codex     | `/acp spawn codex`, `runtime: "acp", agentId: "codex"`  | Ця сторінка                            |

Віддавайте перевагу нативному маршруту, якщо вам явно не потрібна поведінка ACP/acpx.

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

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей необмежений варіант є можливістю CLI acpx (а не звичайним шляхом OpenClaw `agentId`).

Керування моделлю залежить від можливостей адаптера. Посилання на моделі Codex ACP нормалізуються OpenClaw перед запуском. Інші harness потребують ACP `models` і підтримки `session/set_model`; якщо harness не надає ані цієї можливості ACP, ані власного прапорця моделі під час запуску, OpenClaw/acpx не може примусово вибрати модель.

## Обов’язкова конфігурація

Базова конфігурація ACP:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. За замовчуванням true; установіть false, щоб призупинити диспетчеризацію ACP, зберігши елементи керування /acp.
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

Якщо запуск ACP із прив’язкою до потоку не працює, спочатку перевірте прапорець можливості адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірнього потоку. Вони потребують активного контексту розмови й адаптера каналу, який надає прив’язки розмов ACP.

Див. [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування plugin для бекенда acpx

Нові інсталяції постачаються з увімкненим за замовчуванням вбудованим runtime plugin `acpx`, тому ACP зазвичай працює без ручного встановлення plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете перемкнутися на локальну checkout-версію для розробки, використовуйте явний шлях plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Локальне встановлення з workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте справність бекенда:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

За замовчуванням вбудований plugin `acpx` реєструє вбудований бекенд ACP без запуску ACP-агента під час старту Gateway. Виконайте `/acp doctor` для явної live-перевірки. Установлюйте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` лише тоді, коли вам потрібно, щоб Gateway перевіряв налаштованого агента під час запуску.

Перевизначення команди або версії в конфігурації plugin:

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

- `command` приймає абсолютний шлях, відносний шлях (визначається від workspace OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає сувору перевірку відповідності версії.
- Власні шляхи `command` вимикають автоматичне встановлення на рівні plugin.

Див. [Plugins](/uk/tools/plugin).

## Необов’язковий бекенд Coven

OpenClaw також може зареєструвати вбудований, необов’язковий ACP-бекенд `coven` для операторів, які хочуть, щоб ACP-сесії кодування контролювалися локальним демоном [Coven](https://github.com/OpenCoven/coven) замість прямого запуску через ACPX.

Це навмисно розширення, а не базовий шлях runtime:

- типовий бекенд ACPX залишається незмінним для звичайних інсталяцій;
- Coven має власний демон, сокет, сховище сесій, зіставлення harness і модель меж проєкту;
- міст можна незалежно вмикати, вимикати, налаштовувати й перевіряти через систему plugin; і
- OpenClaw залишається відповідальним за маршрутизацію сесій ACP, прив’язки чату, стан завдань і політику fallback, тоді як Coven володіє контролем harness.

Мінімальна необов’язкова конфігурація:

```json5
{
  acp: {
    enabled: true,
    backend: "coven",
    defaultAgent: "codex",
  },
  plugins: {
    entries: {
      coven: {
        enabled: true,
        config: {
          // Необов’язково. За замовчуванням ~/.coven. Змінні середовища не використовуються для цього якоря довіри.
          covenHome: "~/.coven",
          // Необов’язково. За замовчуванням <covenHome>/coven.sock; перевизначення мають указувати на цей шлях.
          socketPath: "~/.coven/coven.sock",
          // Необов’язково. За замовчуванням false; вмикайте лише тоді, коли прямий fallback ACP є прийнятним.
          allowFallback: false,
          // Необов’язково. Використовується лише тоді, коли allowFallback має значення true.
          fallbackBackend: "acpx",
        },
      },
    },
  },
}
```

Коли цей варіант вибрано, OpenClaw перевіряє справність демона Coven через налаштований Unix-сокет перед запуском. Успішний запуск створює сесію Coven і записує ідентифікатор сесії Coven у дескриптор runtime ACP. Якщо перевірка справності або запуск не вдається, OpenClaw за замовчуванням відмовляє без fallback, тому `acp.backend="coven"` не може непомітно перейти до прямого виконання ACP. Установлюйте `allowFallback: true` лише тоді, коли прямий fallback ACP є явним і прийнятним вибором оператора.

Для безпеки шляхів `~` у `covenHome` і `socketPath` розгортається до домашнього каталогу поточного користувача, а налаштовані шляхи Coven після такого розгортання мають бути абсолютними. OpenClaw відхиляє відносні до workspace шляхи демона Coven, оскільки сокет демона є локальним якорем довіри користувача, а не станом, що контролюється репозиторієм.
`socketPath` має вказувати на `<covenHome>/coven.sock`; OpenClaw не дозволяє довільні імена файлів сокета Coven, оскільки сокет демона є локальним якорем довіри. Зберігайте `covenHome` у власності користувача OpenClaw і приватним (`0700`);
OpenClaw відхиляє симлінковані, доступні спільно, спільно записувані або не-сокетні шляхи сокета Coven перед підключенням. Бекенд Coven наразі потребує перевірки Unix-сокета й відмовляє без fallback у Windows замість довіри до шляху сокета, власника та дозволи якого цей plugin не може перевірити.

Типове зіставлення harness спрямовує відомі ідентифікатори ACP-агентів, такі як `codex`, `claude`, `gemini` і `opencode`, до явно дозволених ідентифікаторів harness Coven. Невідомі ідентифікатори ACP-агентів відхиляються замість пересилання як імен harness. Перевизначайте `plugins.entries.coven.config.harnesses` лише тоді, коли ваша локальна інсталяція Coven використовує власні назви harness, і тримайте `acp.allowedAgents` узгодженим із запланованим набором harness, доступних у чаті.

### Автоматичне встановлення залежностей

Коли ви глобально встановлюєте OpenClaw за допомогою `npm install -g openclaw`, runtime-залежності acpx (платформозалежні бінарні файли) встановлюються автоматично через хук postinstall. Якщо автоматичне встановлення не вдається, gateway все одно запускається нормально й повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP для tools plugin

За замовчуванням сесії ACPX **не** надають ACP harness доступ до tools, зареєстрованих plugin OpenClaw.

Якщо ви хочете, щоб ACP-агенти, такі як Codex або Claude Code, могли викликати встановлені tools plugin OpenClaw, наприклад memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Впроваджує в bootstrap сесії ACPX вбудований MCP-сервер з назвою `openclaw-plugin-tools`.
- Надає доступ до tools plugin, уже зареєстрованих встановленими й увімкненими plugin OpenClaw.
- Залишає цю можливість явною та вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню tools ACP harness.
- ACP-агенти отримують доступ лише до tools plugin, які вже активні в gateway.
- Сприймайте це як ту саму межу довіри, що й дозвіл цим plugin виконуватися в самому OpenClaw.
- Перевірте встановлені plugin перед увімкненням.

Власні `mcpServers` і надалі працюють як раніше. Вбудований міст plugin-tools є додатковою необов’язковою зручністю, а не заміною загальної конфігурації MCP-сервера.

### Міст MCP для tools OpenClaw

За замовчуванням сесії ACPX також **не** надають через MCP доступу до вбудованих tools OpenClaw. Увімкніть окремий міст базових tools, якщо ACP-агенту потрібні вибрані вбудовані tools, такі як `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Впроваджує в bootstrap сесії ACPX вбудований MCP-сервер з назвою `openclaw-tools`.
- Надає доступ до вибраних вбудованих tools OpenClaw. Початковий сервер надає `cron`.
- Залишає надання базових tools явним і вимкненим за замовчуванням.

### Конфігурація тайм-ауту runtime

Вбудований plugin `acpx` за замовчуванням використовує тайм-аут 120 секунд для ходів вбудованого runtime. Це дає повільнішим harness, таким як Gemini CLI, достатньо часу для завершення запуску та ініціалізації ACP. Перевизначте це значення, якщо вашому хосту потрібне інше обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація агента для перевірки справності

Коли `/acp doctor` або необов’язкова перевірка під час запуску перевіряє бекенд, вбудований plugin `acpx` перевіряє один harness-агент. Якщо задано `acp.allowedAgents`, за замовчуванням використовується перший дозволений агент; інакше використовується `codex`. Якщо вашому розгортанню для перевірок справності потрібен інший ACP-агент, явно встановіть агента перевірки:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Налаштування дозволів

Сесії ACP працюють неінтерактивно — немає TTY, щоб підтверджувати або відхиляти запити на дозвіл запису файлів і виконання shell-команд. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи harness ACPX є окремими від підтверджень виконання OpenClaw і окремими від прапорців обходу постачальника CLI-бекенда, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач рівня harness для сесій ACP.

### `permissionMode`

Керує тим, які операції агент harness може виконувати без запиту.

| Значення       | Поведінка                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Автоматично підтверджує всі записи файлів і shell-команди. |
| `approve-reads` | Автоматично підтверджує лише читання; запис і exec потребують запитів. |
| `deny-all`      | Відхиляє всі запити на дозвіл.                            |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли має бути показано запит на дозвіл, але інтерактивний TTY недоступний (що для сесій ACP має місце завжди).

| Значення | Поведінка                                                        |
| -------- | ---------------------------------------------------------------- |
| `fail`   | Перериває сесію з `AcpRuntimeError`. **(за замовчуванням)**      |
| `deny`   | Непомітно відхиляє дозвіл і продовжує роботу (плавна деградація). |

### Конфігурація

Установлюється через конфігурацію plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

<Warning>
За замовчуванням OpenClaw використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сесіях ACP будь-який запис або exec, що спричиняє запит на дозвіл, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сесії деградували плавно замість аварійного завершення.
</Warning>

## Пов’язане

- [ACP-агенти](/uk/tools/acp-agents) — огляд, операторський runbook, концепції
- [Субагенти](/uk/tools/subagents)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
