---
read_when:
    - Налаштування інтеграцій IDE на основі ACP
    - Налагодження маршрутизації сеансів ACP до Gateway
summary: Запустіть міст ACP для інтеграцій з IDE
title: ACP
x-i18n:
    generated_at: "2026-05-06T05:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

Запустіть міст [Протокол клієнта агента (ACP)](https://agentclientprotocol.com/), який взаємодіє з OpenClaw Gateway.

Ця команда використовує ACP через stdio для IDE та пересилає промпти до Gateway
через WebSocket. Вона зіставляє сеанси ACP із ключами сеансів Gateway.

`openclaw acp` — це ACP-міст на базі Gateway, а не повноцінне редакторське
середовище виконання, нативне для ACP. Він зосереджується на маршрутизації
сеансів, доставці промптів і базових потокових оновленнях.

Якщо ви хочете, щоб зовнішній MCP-клієнт напряму взаємодіяв із розмовами
каналів OpenClaw замість розміщення сеансу ACP harness, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp).

## Чим це не є

Цю сторінку часто плутають із сеансами ACP harness.

`openclaw acp` означає:

- OpenClaw працює як ACP-сервер
- IDE або ACP-клієнт підключається до OpenClaw
- OpenClaw пересилає цю роботу в сеанс Gateway

Це відрізняється від [агентів ACP](/uk/tools/acp-agents), де OpenClaw запускає
зовнішній harness, як-от Codex або Claude Code, через `acpx`.

Коротке правило:

- редактор/клієнт хоче взаємодіяти з OpenClaw через ACP: використовуйте `openclaw acp`
- OpenClaw має запускати Codex/Claude/Gemini як ACP harness: використовуйте `/acp spawn` і [агентів ACP](/uk/tools/acp-agents)

## Матриця сумісності

| Область ACP                                                           | Статус      | Примітки                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Реалізовано | Основний потік моста через stdio до Gateway chat/send + abort.                                                                                                                                                                                   |
| `listSessions`, slash-команди                                         | Реалізовано | Список сеансів працює зі станом сеансів Gateway; команди оголошуються через `available_commands_update`.                                                                                                                                        |
| `loadSession`                                                         | Частково    | Повторно прив'язує сеанс ACP до ключа сеансу Gateway і відтворює збережену текстову історію користувача/асистента. Історія інструментів/системи ще не реконструюється.                                                                         |
| Вміст промпта (`text`, вбудований `resource`, зображення)             | Частково    | Текст/ресурси сплющуються у вхідні дані чату; зображення стають вкладеннями Gateway.                                                                                                                                                            |
| Режими сеансів                                                        | Частково    | `session/set_mode` підтримується, і міст надає початкові елементи керування сеансом на базі Gateway для рівня думок, докладності інструментів, міркування, деталізації використання та підвищених дій. Ширші нативні для ACP поверхні режимів/конфігурації поки що поза межами підтримки. |
| Інформація про сеанс і оновлення використання                         | Частково    | Міст надсилає сповіщення `session_info_update` і найкращі можливі `usage_update` із кешованих знімків сеансів Gateway. Використання є приблизним і надсилається лише тоді, коли загальні токени Gateway позначені як свіжі.                     |
| Потокове передавання інструментів                                     | Частково    | Події `tool_call` / `tool_call_update` містять сирий I/O, текстовий вміст і найкращі можливі розташування файлів, коли аргументи/результати інструментів Gateway їх надають. Вбудовані термінали та багатший diff-native вивід досі не надаються. |
| MCP-сервери для окремих сеансів (`mcpServers`)                        | Не підтримується | Режим моста відхиляє запити MCP-серверів для окремих сеансів. Натомість налаштуйте MCP на OpenClaw gateway або агенті.                                                                                                                          |
| Методи файлової системи клієнта (`fs/read_text_file`, `fs/write_text_file`) | Не підтримується | Міст не викликає методи файлової системи ACP-клієнта.                                                                                                                                                                                           |
| Методи термінала клієнта (`terminal/*`)                               | Не підтримується | Міст не створює термінали ACP-клієнта й не передає потоково ідентифікатори терміналів через виклики інструментів.                                                                                                                               |
| Плани сеансів / потокове передавання думок                            | Не підтримується | Наразі міст надсилає текст виводу й стан інструментів, а не оновлення плану чи думок ACP.                                                                                                                                                       |

## Відомі обмеження

- `loadSession` відтворює збережену текстову історію користувача й асистента, але не
  реконструює історичні виклики інструментів, системні повідомлення або багатші
  нативні для ACP типи подій.
- Якщо кілька ACP-клієнтів спільно використовують той самий ключ сеансу Gateway,
  маршрутизація подій і скасувань є найкращою можливою, а не строго ізольованою
  для кожного клієнта. Віддавайте перевагу стандартним ізольованим сеансам
  `acp:<uuid>`, коли потрібні чисті локальні для редактора ходи.
- Стани зупинки Gateway перекладаються в причини зупинки ACP, але це зіставлення
  менш виразне, ніж у повністю нативному для ACP середовищі виконання.
- Початкові елементи керування сеансом наразі показують сфокусовану підмножину
  налаштувань Gateway: рівень думок, докладність інструментів, міркування,
  деталізацію використання та підвищені дії. Вибір моделі й елементи керування
  exec-host ще не надаються як параметри конфігурації ACP.
- `session_info_update` і `usage_update` походять зі знімків сеансів Gateway,
  а не з живого обліку нативного для ACP середовища виконання. Використання є
  приблизним, не містить даних про вартість і надсилається лише тоді, коли
  Gateway позначає загальні дані токенів як свіжі.
- Дані супроводу інструментів є найкращими можливими. Міст може показувати
  шляхи до файлів, які з'являються у відомих аргументах/результатах
  інструментів, але ще не надсилає термінали ACP або структуровані diff файлів.

## Використання

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP-клієнт (налагодження)

Використовуйте вбудований ACP-клієнт, щоб перевірити міст без IDE.
Він запускає ACP-міст і дає змогу вводити промпти інтерактивно.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Модель дозволів (режим налагодження клієнта):

- Автоматичне схвалення базується на allowlist і застосовується лише до довірених ідентифікаторів основних інструментів.
- Автоматичне схвалення `read` обмежене поточним робочим каталогом (`--cwd`, якщо задано).
- ACP автоматично схвалює лише вузькі readonly-класи: обмежені виклики `read` в активному cwd плюс readonly-інструменти пошуку (`search`, `web_search`, `memory_search`). Невідомі/неосновні інструменти, читання поза межами області, інструменти з можливістю exec, інструменти площини керування, інструменти зі змінами та інтерактивні потоки завжди потребують явного схвалення промпта.
- Наданий сервером `toolCall.kind` розглядається як недовірені метадані (не як джерело авторизації).
- Ця політика ACP-моста відокремлена від дозволів ACPX harness. Якщо ви запускаєте OpenClaw через бекенд `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` є аварійним перемикачем "yolo" для цього сеансу harness.

## Як це використовувати

Використовуйте ACP, коли IDE (або інший клієнт) підтримує Протокол клієнта агента
і ви хочете, щоб він керував сеансом OpenClaw Gateway.

1. Переконайтеся, що Gateway запущено (локально або віддалено).
2. Налаштуйте ціль Gateway (конфігурація або прапорці).
3. Спрямуйте вашу IDE запускати `openclaw acp` через stdio.

Приклад конфігурації (збереженої):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Приклад прямого запуску (без запису конфігурації):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Вибір агентів

ACP не вибирає агентів напряму. Він маршрутизує за ключем сеансу Gateway.

Використовуйте ключі сеансів з областю агента, щоб націлитися на конкретного агента:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Кожен сеанс ACP зіставляється з одним ключем сеансу Gateway. Один агент може мати багато
сеансів; ACP за замовчуванням використовує ізольований сеанс `acp:<uuid>`, якщо ви не перевизначите
ключ або мітку.

`mcpServers` для окремих сеансів не підтримуються в режимі моста. Якщо ACP-клієнт
надсилає їх під час `newSession` або `loadSession`, міст повертає чітку
помилку замість мовчазного ігнорування.

Якщо ви хочете, щоб сеанси на базі ACPX бачили інструменти Plugin OpenClaw або вибрані
вбудовані інструменти, як-от `cron`, увімкніть MCP-мости ACPX на боці gateway замість
спроб передавати `mcpServers` для окремих сеансів. Див.
[агентів ACP](/uk/tools/acp-agents-setup#plugin-tools-mcp-bridge) і
[MCP-міст інструментів OpenClaw](/uk/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Використання з `acpx` (Codex, Claude, інші ACP-клієнти)

Якщо ви хочете, щоб агент для кодування, як-от Codex або Claude Code, взаємодіяв із вашим
ботом OpenClaw через ACP, використовуйте `acpx` із його вбудованою ціллю `openclaw`.

Типовий потік:

1. Запустіть Gateway і переконайтеся, що ACP-міст може до нього дістатися.
2. Спрямуйте `acpx openclaw` на `openclaw acp`.
3. Виберіть ключ сеансу OpenClaw, який має використовувати агент для кодування.

Приклади:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Якщо ви хочете, щоб `acpx openclaw` щоразу націлювався на конкретний Gateway і ключ сеансу,
перевизначте команду агента `openclaw` у `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Для локального checkout OpenClaw у репозиторії використовуйте пряму точку входу CLI замість
dev-runner, щоб потік ACP залишався чистим. Наприклад:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Це найпростіший спосіб дати Codex, Claude Code або іншому ACP-сумісному клієнту
отримувати контекстну інформацію від агента OpenClaw без скрейпінгу термінала.

## Налаштування редактора Zed

Додайте власного ACP-агента в `~/.config/zed/settings.json` (або скористайтеся інтерфейсом налаштувань Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Щоб націлитися на конкретний Gateway або агента:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

У Zed відкрийте панель агента й виберіть "OpenClaw ACP", щоб почати гілку.

## Зіставлення сеансів

За замовчуванням сеанси ACP отримують ізольований ключ сеансу Gateway з префіксом `acp:`.
Щоб повторно використати відомий сеанс, передайте ключ або мітку сеансу:

- `--session <key>`: використати конкретний ключ сеансу Gateway.
- `--session-label <label>`: визначити наявний сеанс за міткою.
- `--reset-session`: створити свіжий ідентифікатор сеансу для цього ключа (той самий ключ, новий transcript).

Якщо ваш клієнт ACP підтримує метадані, ви можете перевизначити їх для кожного сеансу:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Дізнайтеся більше про ключі сеансів на [/concepts/session](/uk/concepts/session).

## Параметри

- `--url <url>`: URL WebSocket Gateway (за замовчуванням gateway.remote.url, якщо налаштовано).
- `--token <token>`: токен автентифікації Gateway.
- `--token-file <path>`: прочитати токен автентифікації Gateway з файлу.
- `--password <password>`: пароль автентифікації Gateway.
- `--password-file <path>`: прочитати пароль автентифікації Gateway з файлу.
- `--session <key>`: ключ сеансу за замовчуванням.
- `--session-label <label>`: мітка сеансу за замовчуванням для визначення.
- `--require-existing`: завершитися з помилкою, якщо ключ/мітка сеансу не існує.
- `--reset-session`: скинути ключ сеансу перед першим використанням.
- `--no-prefix-cwd`: не додавати робочий каталог як префікс до prompt.
- `--provenance <off|meta|meta+receipt>`: включити метадані або квитанції походження ACP.
- `--verbose, -v`: докладне журналювання до stderr.

Примітка щодо безпеки:

- `--token` і `--password` можуть бути видимі в локальних списках процесів у деяких системах.
- Віддавайте перевагу `--token-file`/`--password-file` або змінним середовища (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Розв'язання автентифікації Gateway дотримується спільного контракту, який використовують інші клієнти Gateway:
  - локальний режим: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> резервний варіант `gateway.remote.*` лише коли `gateway.auth.*` не задано (налаштовані, але нерозв'язані локальні SecretRefs завершуються закрито)
  - віддалений режим: `gateway.remote.*` із резервним env/config відповідно до правил пріоритету віддаленого режиму
  - `--url` безпечний для перевизначення й не використовує повторно неявні облікові дані config/env; передайте явні `--token`/`--password` (або варіанти з файлом)
- Дочірні процеси бекенда виконання ACP отримують `OPENCLAW_SHELL=acp`, що можна використовувати для контекстно-специфічних правил shell/profile.
- `openclaw acp client` встановлює `OPENCLAW_SHELL=acp-client` для породженого процесу bridge.

### Параметри `acp client`

- `--cwd <dir>`: робочий каталог для сеансу ACP.
- `--server <command>`: команда сервера ACP (за замовчуванням: `openclaw`).
- `--server-args <args...>`: додаткові аргументи, передані серверу ACP.
- `--server-verbose`: увімкнути докладне журналювання на сервері ACP.
- `--verbose, -v`: докладне журналювання клієнта.

## Пов'язане

- [Довідник CLI](/uk/cli)
- [Агенти ACP](/uk/tools/acp-agents)
