---
read_when:
    - Налаштування інтеграцій IDE на основі ACP
    - Налагодження маршрутизації сеансів ACP до Gateway
summary: Запустіть міст ACP для інтеграцій з IDE
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:18:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Запускає міст [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), який взаємодіє з OpenClaw Gateway.

Ця команда використовує ACP через stdio для IDE і пересилає промпти до Gateway
через WebSocket. Вона підтримує зіставлення ACP-сесій із ключами сесій Gateway.

`openclaw acp` — це ACP-міст на базі Gateway, а не повноцінне редакторське
середовище виконання, нативне для ACP. Він зосереджений на маршрутизації сесій,
доставці промптів і базових потокових оновленнях.

Якщо ви хочете, щоб зовнішній MCP-клієнт напряму взаємодіяв із розмовами
каналів OpenClaw, а не розміщував сесію ACP-харнеса, натомість використовуйте
[`openclaw mcp serve`](/uk/cli/mcp).

## Чим це не є

Цю сторінку часто плутають із сесіями ACP-харнеса.

`openclaw acp` означає:

- OpenClaw працює як ACP-сервер
- IDE або ACP-клієнт підключається до OpenClaw
- OpenClaw пересилає цю роботу в сесію Gateway

Це відрізняється від [ACP Agents](/uk/tools/acp-agents), де OpenClaw запускає
зовнішній харнес, наприклад Codex або Claude Code, через `acpx`.

Коротке правило:

- редактор/клієнт хоче спілкуватися з OpenClaw через ACP: використовуйте `openclaw acp`
- OpenClaw має запускати Codex/Claude/Gemini як ACP-харнес: використовуйте `/acp spawn` і [ACP Agents](/uk/tools/acp-agents)

## Матриця сумісності

| Область ACP                                                           | Стан             | Примітки                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Реалізовано      | Основний потік моста через stdio до Gateway chat/send + abort.                                                                                                                                                                                           |
| `listSessions`, slash-команди                                         | Реалізовано      | Список сесій працює зі станом сесій Gateway із обмеженою курсорною пагінацією та фільтруванням за `cwd`, коли рядки сесій Gateway містять метадані робочого простору; команди оголошуються через `available_commands_update`.                           |
| Метадані походження сесії                                             | Реалізовано      | Списки сесій і знімки інформації про сесію містять батьківське й дочірнє походження OpenClaw у `_meta`, щоб ACP-клієнти могли відображати графи субагентів без приватних побічних каналів Gateway.                                                      |
| `resumeSession`, `closeSession`                                       | Реалізовано      | Відновлення повторно прив’язує ACP-сесію до наявної сесії Gateway без повторного відтворення історії. Закриття скасовує активну роботу моста, завершує очікувані промпти як скасовані та звільняє стан сесії моста.                                     |
| `loadSession`                                                         | Частково         | Повторно прив’язує ACP-сесію до ключа сесії Gateway і відтворює історію журналу ACP-подій для сесій, створених мостом. Старі сесії або сесії без журналу повертаються до збереженого тексту користувача/асистента.                                      |
| Вміст промпта (`text`, вбудований `resource`, зображення)             | Частково         | Текст/ресурси сплющуються у вхід чату; зображення стають вкладеннями Gateway.                                                                                                                                                                            |
| Режими сесії                                                          | Частково         | `session/set_mode` підтримується, а міст надає початкові елементи керування сесією на базі Gateway для рівня думок, докладності інструментів, міркування, деталізації використання та підвищених дій. Ширші нативні для ACP поверхні режимів/конфігурації поки що поза межами scope. |
| Інформація про сесію та оновлення використання                        | Частково         | Міст надсилає сповіщення `session_info_update` і best-effort `usage_update` зі збережених у кеші знімків сесій Gateway. Використання приблизне й надсилається лише тоді, коли загальні дані токенів Gateway позначені як свіжі.                         |
| Потокове передавання інструментів                                     | Частково         | Події `tool_call` / `tool_call_update` містять raw I/O, текстовий вміст і best-effort розташування файлів, коли аргументи/результати інструментів Gateway їх надають. Вбудовані термінали та багатший diff-нативний вивід досі не надаються.              |
| Схвалення exec                                                        | Частково         | Запити на схвалення Gateway exec під час активних ACP-ходів промпта передаються ACP-клієнту через `session/request_permission`.                                                                                                                          |
| MCP-сервери для окремої сесії (`mcpServers`)                          | Не підтримується | Режим моста відхиляє запити MCP-сервера для окремої сесії. Налаштуйте MCP на шлюзі OpenClaw або агенті натомість.                                                                                                                                        |
| Методи файлової системи клієнта (`fs/read_text_file`, `fs/write_text_file`) | Не підтримується | Міст не викликає методи файлової системи ACP-клієнта.                                                                                                                                                                                                     |
| Методи термінала клієнта (`terminal/*`)                               | Не підтримується | Міст не створює термінали ACP-клієнта й не передає ідентифікатори терміналів через виклики інструментів.                                                                                                                                                 |
| Плани сесій / потокове передавання думок                              | Не підтримується | Наразі міст надсилає текст виводу та стан інструментів, а не ACP-плани чи оновлення думок.                                                                                                                                                              |

## Відомі обмеження

- `loadSession` може відтворити повну історію журналу ACP-подій лише для
  сесій, створених мостом. Старі сесії або сесії без журналу й далі
  використовують резервний transcript і не відновлюють історичні виклики
  інструментів чи системні повідомлення.
- Якщо кілька ACP-клієнтів використовують той самий ключ сесії Gateway, маршрутизація
  подій і скасувань є best-effort, а не суворо ізольованою для кожного клієнта.
  Віддавайте перевагу типовим ізольованим сесіям `acp-bridge:<uuid>`, коли потрібні
  чисті локальні для редактора ходи.
- Стани зупинки Gateway перекладаються в причини зупинки ACP, але це зіставлення
  менш виразне, ніж у повністю нативному для ACP середовищі виконання.
- Початкові елементи керування сесією наразі показують сфокусовану підмножину
  налаштувань Gateway: рівень думок, докладність інструментів, міркування,
  деталізацію використання та підвищені дії. Вибір моделі й елементи керування
  exec-хостом ще не надаються як параметри конфігурації ACP.
- `session_info_update` і `usage_update` отримуються зі знімків сесій Gateway,
  а не з live-обліку нативного для ACP середовища виконання. Використання є
  приблизним, не містить даних про вартість і надсилається лише тоді, коли
  Gateway позначає загальні дані токенів як свіжі.
- Дані супроводу інструментів є best-effort. Міст може показувати шляхи файлів,
  які з’являються у відомих аргументах/результатах інструментів, але він ще не
  надсилає ACP-термінали або структуровані file diff.
- Ретрансляція схвалення exec обмежена активним ACP-ходом промпта; схвалення з
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

## ACP-клієнт (debug)

Використовуйте вбудований ACP-клієнт, щоб перевірити справність моста без IDE.
Він запускає ACP-міст і дає змогу вводити промпти інтерактивно.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Модель дозволів (debug-режим клієнта):

- Автосхвалення базується на allowlist і застосовується лише до довірених ідентифікаторів основних інструментів.
- Автосхвалення `read` обмежене поточним робочим каталогом (`--cwd`, якщо задано).
- ACP автоматично схвалює лише вузькі readonly-класи: scoped-виклики `read` у межах активного cwd плюс readonly-інструменти пошуку (`search`, `web_search`, `memory_search`). Невідомі/неосновні інструменти, читання поза scope, інструменти з можливістю exec, інструменти control-plane, інструменти, що змінюють стан, і інтерактивні потоки завжди потребують явного схвалення промпта.
- Наданий сервером `toolCall.kind` вважається недовіреними метаданими (не джерелом авторизації).
- Ця політика ACP-моста відокремлена від дозволів ACPX-харнеса. Якщо ви запускаєте OpenClaw через backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` є аварійним перемикачем "yolo" для цієї сесії харнеса.

## Smoke-тестування протоколу

Для debug на рівні протоколу запустіть Gateway з ізольованим станом і керуйте
`openclaw acp` через stdio за допомогою ACP JSON-RPC-клієнта. Покрийте `initialize`,
`session/new`, `session/list` з абсолютним `cwd`, `session/resume`,
`session/close`, повторне закриття та відсутнє відновлення.

Доказ має містити оголошені lifecycle-можливості, рядок сесії на базі Gateway,
сповіщення про оновлення та журнал Gateway `sessions.list`:

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

Уникайте використання `openclaw gateway call sessions.list` як єдиного доказу ACP.
Цей CLI-шлях може запитати підвищення operator scope для fresh-token; коректність
ACP-моста доводиться кадрами ACP stdio плюс журналом Gateway `sessions.list`.

## Як це використовувати

Використовуйте ACP, коли IDE (або інший клієнт) підтримує Agent Client Protocol,
і ви хочете, щоб він керував сесією OpenClaw Gateway.

1. Переконайтеся, що Gateway запущено (локально або віддалено).
2. Налаштуйте ціль Gateway (конфігурацією або прапорцями).
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

Використовуйте ключі сесій із scope агента, щоб націлитися на конкретного агента:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Кожен сеанс ACP відповідає одному ключу сеансу Gateway. Один агент може мати багато
сеансів; ACP за замовчуванням використовує ізольований сеанс `acp-bridge:<uuid>`, якщо ви не перевизначите
ключ або мітку.

Посеансові `mcpServers` не підтримуються в режимі мосту. Якщо клієнт ACP
надсилає їх під час `newSession` або `loadSession`, міст повертає чітку
помилку замість того, щоб мовчки їх ігнорувати.

Якщо ви хочете, щоб сеанси на базі ACPX бачили інструменти Plugin OpenClaw або вибрані
вбудовані інструменти, як-от `cron`, увімкніть ACPX MCP-мости на боці Gateway замість
спроб передавати посеансові `mcpServers`. Див.
[Агенти ACP](/uk/tools/acp-agents-setup#plugin-tools-mcp-bridge) і
[MCP-міст інструментів OpenClaw](/uk/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Використання з `acpx` (Codex, Claude, інші клієнти ACP)

Якщо ви хочете, щоб агент для програмування, як-от Codex або Claude Code, спілкувався з вашим
ботом OpenClaw через ACP, використовуйте `acpx` із його вбудованою ціллю `openclaw`.

Типовий процес:

1. Запустіть Gateway і переконайтеся, що ACP-міст може до нього підключитися.
2. Спрямуйте `acpx openclaw` на `openclaw acp`.
3. Укажіть ключ сеансу OpenClaw, який має використовувати агент для програмування.

Приклади:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Якщо ви хочете, щоб `acpx openclaw` щоразу був спрямований на конкретний Gateway і ключ сеансу,
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

Для локального checkout OpenClaw у репозиторії використовуйте прямий CLI entrypoint замість
dev runner, щоб потік ACP залишався чистим. Наприклад:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Це найпростіший спосіб дозволити Codex, Claude Code або іншому клієнту з підтримкою ACP
отримувати контекстну інформацію від агента OpenClaw без скрейпінгу термінала.

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

Щоб спрямувати на конкретний Gateway або агента:

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

За замовчуванням сеанси ACP-мосту отримують ізольований ключ сеансу Gateway з
префіксом `acp-bridge:`. Ці сеанси мосту звичайної моделі є синтетичними та
підпадають під очищення застарілих записів і обмеження кількості записів. Щоб повторно використати відомий сеанс,
передайте ключ або мітку сеансу:

- `--session <key>`: використати конкретний ключ сеансу Gateway.
- `--session-label <label>`: знайти наявний сеанс за міткою.
- `--reset-session`: створити новий ідентифікатор сеансу для цього ключа (той самий ключ, нова стенограма).

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

Докладніше про ключі сеансів: [/concepts/session](/uk/concepts/session).

## Параметри

- `--url <url>`: URL WebSocket Gateway (за замовчуванням `gateway.remote.url`, якщо налаштовано).
- `--token <token>`: токен автентифікації Gateway.
- `--token-file <path>`: прочитати токен автентифікації Gateway з файлу.
- `--password <password>`: пароль автентифікації Gateway.
- `--password-file <path>`: прочитати пароль автентифікації Gateway з файлу.
- `--session <key>`: стандартний ключ сеансу.
- `--session-label <label>`: стандартна мітка сеансу для пошуку.
- `--require-existing`: завершитися помилкою, якщо ключ/мітка сеансу не існує.
- `--reset-session`: скинути ключ сеансу перед першим використанням.
- `--no-prefix-cwd`: не додавати робочий каталог як префікс до prompt.
- `--provenance <off|meta|meta+receipt>`: включати метадані або квитанції походження ACP.
- `--verbose, -v`: докладне логування до stderr.

Примітка щодо безпеки:

- `--token` і `--password` можуть бути видимі в локальних списках процесів у деяких системах.
- Надавайте перевагу `--token-file`/`--password-file` або змінним середовища (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Розв’язання автентифікації Gateway дотримується спільного контракту, який використовують інші клієнти Gateway:
  - локальний режим: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback до `gateway.remote.*` лише коли `gateway.auth.*` не задано (налаштовані, але нерозв’язані локальні SecretRefs завершуються закритою помилкою)
  - віддалений режим: `gateway.remote.*` із fallback env/config відповідно до правил пріоритету віддаленого режиму
  - `--url` безпечно перевизначає значення й не повторно використовує неявні облікові дані config/env; передайте явні `--token`/`--password` (або файлові варіанти)
- Дочірні процеси backend ACP runtime отримують `OPENCLAW_SHELL=acp`, що можна використовувати для правил shell/profile, специфічних для контексту.
- `openclaw acp client` задає `OPENCLAW_SHELL=acp-client` для створеного процесу мосту.

### Параметри `acp client`

- `--cwd <dir>`: робочий каталог для сеансу ACP.
- `--server <command>`: команда сервера ACP (за замовчуванням: `openclaw`).
- `--server-args <args...>`: додаткові аргументи, передані серверу ACP.
- `--server-verbose`: увімкнути докладне логування на сервері ACP.
- `--verbose, -v`: докладне логування клієнта.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Агенти ACP](/uk/tools/acp-agents)
