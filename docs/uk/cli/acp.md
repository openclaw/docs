---
read_when:
    - Налаштування інтеграцій IDE на основі ACP
    - Налагодження маршрутизації сесій ACP до Gateway
summary: Запустіть ACP bridge для інтеграцій IDE
title: ACP
x-i18n:
    generated_at: "2026-04-23T20:45:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b535e84f8ba5f143340af5b6a1e651b0711ba8d5fa58bfb76863612718ed07bb
    source_path: cli/acp.md
    workflow: 15
---

Запустіть bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), який взаємодіє з OpenClaw Gateway.

Ця команда використовує ACP через stdio для IDE і пересилає запити до Gateway
через WebSocket. Вона підтримує зіставлення сесій ACP із ключами сесій Gateway.

`openclaw acp` — це ACP bridge на базі Gateway, а не повноцінне ACP-native середовище
виконання редактора. Він зосереджений на маршрутизації сесій, доставці запитів і базових
потокових оновленнях.

Якщо ви хочете, щоб зовнішній клієнт MCP напряму взаємодіяв із розмовами каналів OpenClaw
замість розміщення сесії ACP harness, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp).

## Чим це не є

Цю сторінку часто плутають із сесіями ACP harness.

`openclaw acp` означає:

- OpenClaw виступає як ACP server
- IDE або ACP client підключається до OpenClaw
- OpenClaw пересилає цю роботу в сесію Gateway

Це відрізняється від [ACP Agents](/uk/tools/acp-agents), де OpenClaw запускає
зовнішній harness, такий як Codex або Claude Code, через `acpx`.

Швидке правило:

- редактор/клієнт хоче спілкуватися з OpenClaw через ACP: використовуйте `openclaw acp`
- OpenClaw має запускати Codex/Claude/Gemini як ACP harness: використовуйте `/acp spawn` і [ACP Agents](/uk/tools/acp-agents)

## Матриця сумісності

| ACP area                                                              | Status      | Notes                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Реалізовано | Основний потік bridge через stdio до Gateway chat/send + abort.                                                                                                                                                                                  |
| `listSessions`, slash commands                                        | Реалізовано | Список сесій працює зі станом сесій Gateway; команди оголошуються через `available_commands_update`.                                                                                                                                            |
| `loadSession`                                                         | Частково    | Повторно прив’язує сесію ACP до ключа сесії Gateway і відтворює збережену текстову історію користувача/асистента. Історія інструментів/системи поки не відновлюється.                                                                         |
| Prompt content (`text`, embedded `resource`, images)                  | Частково    | Текст/ресурси зводяться до chat input; зображення стають вкладеннями Gateway.                                                                                                                                                                   |
| Session modes                                                         | Частково    | Підтримується `session/set_mode`, і bridge надає початкові елементи керування сесією на базі Gateway для рівня thought, докладності інструментів, reasoning, деталізації usage та elevated actions. Ширші ACP-native поверхні mode/config поки поза межами підтримки. |
| Session info and usage updates                                        | Частково    | Bridge надсилає сповіщення `session_info_update` і `usage_update` у режимі best-effort на основі кешованих snapshot сесій Gateway. Usage є приблизним і надсилається лише тоді, коли загальні токени Gateway позначені як свіжі.              |
| Tool streaming                                                        | Частково    | Події `tool_call` / `tool_call_update` містять необроблений ввід/вивід, текстовий вміст і розташування файлів у режимі best-effort, коли args/results інструментів Gateway їх містять. Вбудовані термінали й багатший diff-native вивід поки не доступні. |
| Per-session MCP servers (`mcpServers`)                                | Не підтримується | Bridge mode відхиляє запити на MCP server для окремих сесій. Натомість налаштовуйте MCP на OpenClaw gateway або агенті.                                                                                                                     |
| Client filesystem methods (`fs/read_text_file`, `fs/write_text_file`) | Не підтримується | Bridge не викликає методи файлової системи ACP client.                                                                                                                                                                                          |
| Client terminal methods (`terminal/*`)                                | Не підтримується | Bridge не створює термінали ACP client і не передає terminal id через виклики інструментів.                                                                                                                                                    |
| Session plans / thought streaming                                     | Не підтримується | Наразі bridge надсилає текст виводу та статус інструментів, а не оновлення планів або thought ACP.                                                                                                                                             |

## Відомі обмеження

- `loadSession` відтворює збережену текстову історію користувача й асистента, але не
  відновлює історичні виклики інструментів, системні повідомлення чи багатші ACP-native типи
  подій.
- Якщо кілька ACP client використовують один і той самий ключ сесії Gateway, маршрутизація
  подій і скасування працює в режимі best-effort, а не зі строгою ізоляцією для кожного клієнта. Для
  чистих локальних ходів редактора надавайте перевагу типовим ізольованим сесіям `acp:<uuid>`.
- Стани зупинки Gateway перетворюються на причини зупинки ACP, але це зіставлення
  менш виразне, ніж у повністю ACP-native runtime.
- Початкові елементи керування сесією наразі охоплюють лише цільову підмножину параметрів Gateway:
  рівень thought, докладність інструментів, reasoning, деталізацію usage та elevated
  actions. Вибір моделі й елементи керування exec-host поки не доступні як ACP
  параметри config.
- `session_info_update` і `usage_update` виводяться зі snapshot сесій Gateway,
  а не з live ACP-native обліку runtime. Usage є приблизним,
  не містить даних про вартість і надсилається лише тоді, коли Gateway позначає загальні дані токенів
  як свіжі.
- Дані супроводу інструментів працюють у режимі best-effort. Bridge може показувати шляхи до файлів, які
  з’являються у відомих args/results інструментів, але поки не надсилає ACP terminals чи
  структуровані diff файлів.

## Використання

```bash
openclaw acp

# Віддалений Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Віддалений Gateway (токен із файлу)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Приєднатися до наявного ключа сесії
openclaw acp --session agent:main:main

# Приєднатися за міткою (має вже існувати)
openclaw acp --session-label "support inbox"

# Скинути ключ сесії перед першим запитом
openclaw acp --session agent:main:main --reset-session
```

## ACP client (налагодження)

Використовуйте вбудований ACP client, щоб перевірити bridge без IDE.
Він запускає ACP bridge і дає змогу вводити запити інтерактивно.

```bash
openclaw acp client

# Спрямувати запущений bridge на віддалений Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Перевизначити команду сервера (типово: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Модель дозволів (режим налагодження client):

- Автосхвалення працює на основі allowlist і застосовується лише до довірених core tool ID.
- Автосхвалення `read` обмежене поточним робочим каталогом (`--cwd`, якщо задано).
- ACP автоматично схвалює лише вузькі readonly класи: scoped виклики `read` у межах активного cwd плюс readonly інструменти пошуку (`search`, `web_search`, `memory_search`). Невідомі/non-core інструменти, читання поза областю дії, інструменти з можливістю exec, інструменти control-plane, mutating інструменти та інтерактивні потоки завжди потребують явного схвалення запиту.
- Наданий сервером `toolCall.kind` розглядається як недовірені метадані (а не джерело авторизації).
- Ця політика ACP bridge є окремою від дозволів ACPX harness. Якщо ви запускаєте OpenClaw через backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` є аварійним перемикачем “yolo” для цієї сесії harness.

## Як це використовувати

Використовуйте ACP, коли IDE (або інший клієнт) підтримує Agent Client Protocol і ви хочете,
щоб він керував сесією OpenClaw Gateway.

1. Переконайтеся, що Gateway запущено (локально або віддалено).
2. Налаштуйте ціль Gateway (конфігурація або прапорці).
3. Налаштуйте IDE на запуск `openclaw acp` через stdio.

Приклад конфігурації (збереженої):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Приклад прямого запуску (без запису конфігурації):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# бажано для безпеки локального процесу
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Вибір агентів

ACP не вибирає агентів безпосередньо. Він маршрутизує за ключем сесії Gateway.

Використовуйте ключі сесій з областю дії агента, щоб націлитися на конкретного агента:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Кожна сесія ACP зіставляється з одним ключем сесії Gateway. Один агент може мати багато
сесій; ACP типово використовує ізольовану сесію `acp:<uuid>`, якщо ви не перевизначите
ключ або мітку.

MCP server для окремих сесій у bridge mode не підтримуються. Якщо ACP client
надсилає їх під час `newSession` або `loadSession`, bridge повертає явну
помилку замість мовчазного ігнорування.

Якщо ви хочете, щоб ACPX-backed сесії бачили інструменти Plugin OpenClaw або вибрані
вбудовані інструменти, такі як `cron`, увімкніть ACPX MCP bridge на боці gateway
замість спроби передавати `mcpServers` для окремих сесій. Див.
[ACP Agents](/uk/tools/acp-agents#plugin-tools-mcp-bridge) і
[OpenClaw tools MCP bridge](/uk/tools/acp-agents#openclaw-tools-mcp-bridge).

## Використання з `acpx` (Codex, Claude, інші ACP client)

Якщо ви хочете, щоб агент для програмування, такий як Codex або Claude Code, взаємодіяв із вашим
ботом OpenClaw через ACP, використовуйте `acpx` із вбудованою ціллю `openclaw`.

Типовий процес:

1. Запустіть Gateway і переконайтеся, що ACP bridge може до нього підключитися.
2. Спрямуйте `acpx openclaw` на `openclaw acp`.
3. Вкажіть ключ сесії OpenClaw, який агент програмування має використовувати.

Приклади:

```bash
# Одноразовий запит до типової ACP-сесії OpenClaw
acpx openclaw exec "Summarize the active OpenClaw session state."

# Постійна іменована сесія для подальших ходів
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Якщо ви хочете, щоб `acpx openclaw` щоразу націлювався на конкретний Gateway і ключ сесії,
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

Для локального checkout OpenClaw на рівні репозиторію використовуйте прямий CLI entrypoint замість
dev runner, щоб потік ACP залишався чистим. Наприклад:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Це найпростіший спосіб дати Codex, Claude Code або іншому ACP-aware client
отримувати контекстну інформацію від агента OpenClaw без зчитування термінала.

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

У Zed відкрийте панель Agent і виберіть “OpenClaw ACP”, щоб почати гілку.

## Зіставлення сесій

Типово сесії ACP отримують ізольований ключ сесії Gateway з префіксом `acp:`.
Щоб повторно використати відому сесію, передайте ключ або мітку сесії:

- `--session <key>`: використовувати конкретний ключ сесії Gateway.
- `--session-label <label>`: визначити наявну сесію за міткою.
- `--reset-session`: створити новий id сесії для цього ключа (той самий ключ, новий transcript).

Якщо ваш ACP client підтримує метадані, ви можете перевизначити це для окремої сесії:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Докладніше про ключі сесій: [/concepts/session](/uk/concepts/session).

## Параметри

- `--url <url>`: URL WebSocket Gateway (типово `gateway.remote.url`, якщо налаштовано).
- `--token <token>`: токен автентифікації Gateway.
- `--token-file <path>`: прочитати токен автентифікації Gateway з файлу.
- `--password <password>`: пароль автентифікації Gateway.
- `--password-file <path>`: прочитати пароль автентифікації Gateway з файлу.
- `--session <key>`: типовий ключ сесії.
- `--session-label <label>`: типова мітка сесії для визначення.
- `--require-existing`: завершитися з помилкою, якщо ключ/мітка сесії не існує.
- `--reset-session`: скинути ключ сесії перед першим використанням.
- `--no-prefix-cwd`: не додавати робочий каталог як префікс до запитів.
- `--provenance <off|meta|meta+receipt>`: включати метадані provenance ACP або квитанції.
- `--verbose, -v`: докладне журналювання в stderr.

Примітка щодо безпеки:

- `--token` і `--password` можуть бути видимими в локальних списках процесів у деяких системах.
- Надавайте перевагу `--token-file`/`--password-file` або змінним середовища (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Визначення автентифікації Gateway дотримується спільного контракту, який використовують інші клієнти Gateway:
  - локальний режим: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback до `gateway.remote.*` лише якщо `gateway.auth.*` не задано (локальні SecretRef, які налаштовані, але не були визначені, працюють у режимі fail closed)
  - віддалений режим: `gateway.remote.*` з fallback до env/config згідно з правилами пріоритету для віддаленого режиму
  - `--url` безпечно перевизначає значення й не використовує неявні облікові дані config/env повторно; передавайте явний `--token`/`--password` (або варіанти з файлами)
- Дочірні процеси backend runtime ACP отримують `OPENCLAW_SHELL=acp`, що можна використовувати для shell/profile-правил, залежних від контексту.
- `openclaw acp client` установлює `OPENCLAW_SHELL=acp-client` для запущеного процесу bridge.

### Параметри `acp client`

- `--cwd <dir>`: робочий каталог для сесії ACP.
- `--server <command>`: команда ACP server (типово: `openclaw`).
- `--server-args <args...>`: додаткові аргументи, передані ACP server.
- `--server-verbose`: увімкнути докладне журналювання на ACP server.
- `--verbose, -v`: докладне журналювання клієнта.
