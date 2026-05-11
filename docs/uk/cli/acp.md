---
read_when:
    - Налаштування інтеграцій IDE на основі ACP
    - Налагодження маршрутизації сеансів ACP до Gateway
summary: Запуск мосту ACP для інтеграцій з IDE
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:26:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

Запустіть міст [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), який взаємодіє з OpenClaw Gateway.

Ця команда використовує ACP через stdio для IDE та пересилає запити до Gateway
через WebSocket. Вона зберігає зіставлення ACP-сесій із ключами сесій Gateway.

`openclaw acp` — це ACP-міст на базі Gateway, а не повноцінне ACP-нативне
середовище виконання редактора. Він зосереджений на маршрутизації сесій,
доставленні запитів і базових потокових оновленнях.

Якщо ви хочете, щоб зовнішній MCP-клієнт напряму взаємодіяв із розмовами
каналів OpenClaw замість розміщення сесії ACP harness, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp).

## Чим це не є

Цю сторінку часто плутають із сесіями ACP harness.

`openclaw acp` означає:

- OpenClaw працює як ACP-сервер
- IDE або ACP-клієнт підключається до OpenClaw
- OpenClaw пересилає цю роботу в сесію Gateway

Це відрізняється від [ACP Agents](/uk/tools/acp-agents), де OpenClaw запускає
зовнішній harness, як-от Codex або Claude Code, через `acpx`.

Коротке правило:

- редактор/клієнт хоче спілкуватися з OpenClaw через ACP: використовуйте `openclaw acp`
- OpenClaw має запускати Codex/Claude/Gemini як ACP harness: використовуйте `/acp spawn` і [ACP Agents](/uk/tools/acp-agents)

## Матриця сумісності

| Область ACP                                                           | Стан        | Примітки                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Реалізовано | Основний потік моста через stdio до Gateway chat/send + abort.                                                                                                                                                                                  |
| `listSessions`, slash-команди                                         | Реалізовано | Список сесій працює зі станом сесій Gateway з обмеженою пагінацією курсором і фільтрацією за `cwd`, коли рядки сесій Gateway містять метадані робочого простору; команди оголошуються через `available_commands_update`.                     |
| Метадані походження сесій                                             | Реалізовано | Списки сесій і знімки інформації про сесію включають походження батьківських і дочірніх сесій OpenClaw у `_meta`, щоб ACP-клієнти могли відображати графи субагентів без приватних побічних каналів Gateway.                                  |
| `resumeSession`, `closeSession`                                       | Реалізовано | Resume повторно прив’язує ACP-сесію до наявної сесії Gateway без відтворення історії. Close скасовує активну роботу моста, завершує очікувані запити як скасовані та звільняє стан сесії моста.                                               |
| `loadSession`                                                         | Частково    | Повторно прив’язує ACP-сесію до ключа сесії Gateway і відтворює історію ACP event-ledger для сесій, створених мостом. Старіші сесії або сесії без ledger повертаються до збереженого тексту користувача/асистента.                            |
| Вміст запиту (`text`, вбудований `resource`, зображення)              | Частково    | Текст/ресурси згладжуються у вхід чату; зображення стають вкладеннями Gateway.                                                                                                                                                                  |
| Режими сесії                                                          | Частково    | `session/set_mode` підтримується, і міст надає початкові елементи керування сесією на базі Gateway для рівня думок, докладності інструментів, reasoning, деталізації використання та підвищених дій. Ширші ACP-нативні поверхні режимів/конфігурації поки що поза межами області дії. |
| Інформація про сесію та оновлення використання                        | Частково    | Міст надсилає сповіщення `session_info_update` і best-effort `usage_update` з кешованих знімків сесій Gateway. Використання є приблизним і надсилається лише тоді, коли загальні токени Gateway позначені як актуальні.                      |
| Потокове передавання інструментів                                     | Частково    | Події `tool_call` / `tool_call_update` включають сирий I/O, текстовий вміст і best-effort розташування файлів, коли аргументи/результати інструментів Gateway їх надають. Вбудовані термінали та багатший diff-нативний вивід поки що не надаються. |
| Схвалення exec                                                        | Частково    | Запити схвалення Gateway exec під час активних ACP-запитів пересилаються ACP-клієнту через `session/request_permission`.                                                                                                                       |
| MCP-сервери для окремої сесії (`mcpServers`)                          | Не підтримується | Режим моста відхиляє запити MCP-серверів для окремої сесії. Натомість налаштуйте MCP на Gateway або агенті OpenClaw.                                                                                                                           |
| Методи файлової системи клієнта (`fs/read_text_file`, `fs/write_text_file`) | Не підтримується | Міст не викликає методи файлової системи ACP-клієнта.                                                                                                                                                                                          |
| Термінальні методи клієнта (`terminal/*`)                             | Не підтримується | Міст не створює термінали ACP-клієнта й не передає ідентифікатори терміналів через виклики інструментів.                                                                                                                                       |
| Плани сесій / потокове передавання думок                              | Не підтримується | Наразі міст надсилає текст виводу та статус інструментів, а не оновлення планів або думок ACP.                                                                                                                                                 |

## Відомі обмеження

- `loadSession` може відтворювати повну історію ACP event-ledger лише для
  сесій, створених мостом. Старіші сесії або сесії без ledger і далі
  використовують резервний transcript і не реконструюють історичні виклики
  інструментів або системні повідомлення.
- Якщо кілька ACP-клієнтів спільно використовують один ключ сесії Gateway,
  маршрутизація подій і скасувань є best-effort, а не строго ізольованою для
  кожного клієнта. Надавайте перевагу стандартним ізольованим сесіям
  `acp:<uuid>`, коли потрібні чисті локальні для редактора turns.
- Стани зупинки Gateway перетворюються на причини зупинки ACP, але це
  зіставлення менш виразне, ніж у повністю ACP-нативному середовищі виконання.
- Початкові елементи керування сесією наразі показують сфокусовану підмножину
  параметрів Gateway: рівень думок, докладність інструментів, reasoning,
  деталізацію використання та підвищені дії. Вибір моделі та елементи керування
  exec-host ще не надаються як параметри конфігурації ACP.
- `session_info_update` і `usage_update` виводяться зі знімків сесій Gateway,
  а не з live ACP-нативного обліку середовища виконання. Використання є
  приблизним, не містить даних про вартість і надсилається лише тоді, коли
  Gateway позначає загальні дані токенів як актуальні.
- Дані супроводу інструментів є best-effort. Міст може показувати шляхи до
  файлів, які з’являються у відомих аргументах/результатах інструментів, але
  поки що не надсилає ACP-термінали або структуровані diff-файлів.
- Пересилання схвалень exec обмежене активним turn ACP-запиту; схвалення з
  інших сесій Gateway ігноруються.

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

Використовуйте вбудований ACP-клієнт, щоб перевірити справність моста без IDE.
Він запускає ACP-міст і дає змогу вводити запити інтерактивно.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Модель дозволів (режим налагодження клієнта):

- Автосхвалення базується на списку дозволених і застосовується лише до довірених ідентифікаторів core tool.
- Автосхвалення `read` обмежене поточним робочим каталогом (`--cwd`, якщо задано).
- ACP автоматично схвалює лише вузькі readonly-класи: scoped-виклики `read` у межах активного cwd плюс readonly-інструменти пошуку (`search`, `web_search`, `memory_search`). Невідомі/не-core інструменти, читання поза областю, exec-capable інструменти, control-plane інструменти, mutating інструменти та інтерактивні потоки завжди потребують явного схвалення запиту.
- Наданий сервером `toolCall.kind` розглядається як ненадійні метадані (не як джерело авторизації).
- Ця політика ACP-моста окрема від дозволів ACPX harness. Якщо ви запускаєте OpenClaw через бекенд `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` є break-glass перемикачем "yolo" для цієї сесії harness.

## Smoke-тестування протоколу

Для налагодження на рівні протоколу запустіть Gateway з ізольованим станом і
керуйте `openclaw acp` через stdio за допомогою ACP JSON-RPC-клієнта. Покрийте
`initialize`, `session/new`, `session/list` з абсолютним `cwd`, `session/resume`,
`session/close`, дубльоване закриття та відсутнє resume.

Доказ має включати оголошені можливості життєвого циклу, рядок сесії на базі
Gateway, сповіщення про оновлення та журнал Gateway `sessions.list`:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Уникайте використання `openclaw gateway call sessions.list` як єдиного доказу
ACP. Цей шлях CLI може запросити підвищення operator scope для fresh-token;
коректність ACP-моста доводиться ACP stdio-кадрами плюс журналом Gateway
`sessions.list`.

## Як це використовувати

Використовуйте ACP, коли IDE (або інший клієнт) говорить Agent Client Protocol і
ви хочете, щоб він керував сесією OpenClaw Gateway.

1. Переконайтеся, що Gateway запущено (локально або віддалено).
2. Налаштуйте ціль Gateway (конфігурація або прапорці).
3. Спрямуйте вашу IDE на запуск `openclaw acp` через stdio.

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

ACP не вибирає агентів напряму. Він маршрутизує за ключем сесії Gateway.

Використовуйте ключі сесій з областю агента, щоб націлитися на конкретного агента:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Кожен сеанс ACP зіставляється з одним ключем сеансу Gateway. Один агент може мати багато
сеансів; ACP за замовчуванням використовує ізольований сеанс `acp:<uuid>`, якщо ви не перевизначите
ключ або мітку.

Посеансові `mcpServers` не підтримуються в режимі моста. Якщо клієнт ACP
надсилає їх під час `newSession` або `loadSession`, міст повертає чітку
помилку замість того, щоб мовчки їх ігнорувати.

Якщо ви хочете, щоб сеанси на базі ACPX бачили інструменти Plugin OpenClaw або вибрані
вбудовані інструменти, як-от `cron`, увімкніть MCP-мости ACPX на боці Gateway
замість спроб передати посеансові `mcpServers`. Див.
[агенти ACP](/uk/tools/acp-agents-setup#plugin-tools-mcp-bridge) і
[MCP-міст інструментів OpenClaw](/uk/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Використання з `acpx` (Codex, Claude, інші клієнти ACP)

Якщо ви хочете, щоб агент для кодування, як-от Codex або Claude Code, спілкувався з вашим
ботом OpenClaw через ACP, використовуйте `acpx` із його вбудованою ціллю `openclaw`.

Типовий процес:

1. Запустіть Gateway і переконайтеся, що міст ACP може до нього підключитися.
2. Спрямуйте `acpx openclaw` на `openclaw acp`.
3. Вкажіть ключ сеансу OpenClaw, який має використовувати агент для кодування.

Приклади:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Якщо ви хочете, щоб `acpx openclaw` щоразу використовував конкретний Gateway і ключ сеансу,
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

Для локальної копії OpenClaw у репозиторії використовуйте прямий вхідний пункт CLI замість
dev runner, щоб потік ACP залишався чистим. Наприклад:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Це найпростіший спосіб дозволити Codex, Claude Code або іншому ACP-сумісному клієнту
отримувати контекстну інформацію від агента OpenClaw без зчитування термінала.

## Налаштування редактора Zed

Додайте власний агент ACP у `~/.config/zed/settings.json` (або скористайтеся UI налаштувань Zed):

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

Щоб указати конкретний Gateway або агента:

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

У Zed відкрийте панель Agent і виберіть "OpenClaw ACP", щоб почати гілку.

## Зіставлення сеансів

За замовчуванням сеанси ACP отримують ізольований ключ сеансу Gateway з префіксом `acp:`.
Щоб повторно використати відомий сеанс, передайте ключ або мітку сеансу:

- `--session <key>`: використати конкретний ключ сеансу Gateway.
- `--session-label <label>`: знайти наявний сеанс за міткою.
- `--reset-session`: створити новий ідентифікатор сеансу для цього ключа (той самий ключ, новий transcript).

Якщо ваш клієнт ACP підтримує метадані, ви можете перевизначити для кожного сеансу:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Докладніше про ключі сеансів див. на [/concepts/session](/uk/concepts/session).

## Параметри

- `--url <url>`: WebSocket URL Gateway (за замовчуванням `gateway.remote.url`, якщо налаштовано).
- `--token <token>`: токен автентифікації Gateway.
- `--token-file <path>`: прочитати токен автентифікації Gateway з файлу.
- `--password <password>`: пароль автентифікації Gateway.
- `--password-file <path>`: прочитати пароль автентифікації Gateway з файлу.
- `--session <key>`: ключ сеансу за замовчуванням.
- `--session-label <label>`: мітка сеансу за замовчуванням для пошуку.
- `--require-existing`: завершити з помилкою, якщо ключ/мітка сеансу не існує.
- `--reset-session`: скинути ключ сеансу перед першим використанням.
- `--no-prefix-cwd`: не додавати робочий каталог як префікс до prompt.
- `--provenance <off|meta|meta+receipt>`: включити метадані або квитанції походження ACP.
- `--verbose, -v`: докладне журналювання у stderr.

Примітка щодо безпеки:

- `--token` і `--password` у деяких системах можуть бути видимими в локальних списках процесів.
- Надавайте перевагу `--token-file`/`--password-file` або змінним середовища (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Визначення автентифікації Gateway відповідає спільному контракту, який використовують інші клієнти Gateway:
  - локальний режим: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> резервний `gateway.remote.*` лише коли `gateway.auth.*` не задано (налаштовані, але нерозв’язані локальні SecretRefs завершуються закрито)
  - віддалений режим: `gateway.remote.*` з резервом env/config відповідно до правил пріоритету для віддаленого режиму
  - `--url` безпечно перевизначає і не повторно використовує неявні облікові дані з config/env; передайте явний `--token`/`--password` (або файлові варіанти)
- Дочірні процеси бекенда виконання ACP отримують `OPENCLAW_SHELL=acp`, що можна використовувати для контекстних правил shell/profile.
- `openclaw acp client` задає `OPENCLAW_SHELL=acp-client` для запущеного процесу моста.

### Параметри `acp client`

- `--cwd <dir>`: робочий каталог для сеансу ACP.
- `--server <command>`: команда сервера ACP (за замовчуванням: `openclaw`).
- `--server-args <args...>`: додаткові аргументи, передані серверу ACP.
- `--server-verbose`: увімкнути докладне журналювання на сервері ACP.
- `--verbose, -v`: докладне журналювання клієнта.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Агенти ACP](/uk/tools/acp-agents)
