---
read_when:
    - Підключення Codex, Claude Code або іншого MCP client до каналів на базі OpenClaw
    - Запуск `openclaw mcp serve`
    - Керування збереженими в OpenClaw визначеннями MCP server
summary: Надайте доступ до розмов каналів OpenClaw через MCP і керуйте збереженими визначеннями MCP server
title: MCP
x-i18n:
    generated_at: "2026-04-23T20:47:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1af58dd0e2ff911c5e62fe03420f6bb26fe55a61e751ccf2b8e781f68764829f
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` має дві функції:

- запускати OpenClaw як MCP server за допомогою `openclaw mcp serve`
- керувати визначеннями вихідних MCP server, що належать OpenClaw, за допомогою `list`, `show`,
  `set` і `unset`

Іншими словами:

- `serve` — це коли OpenClaw виступає як MCP server
- `list` / `show` / `set` / `unset` — це коли OpenClaw виступає як клієнтський
  реєстр для інших MCP server, які його runtime можуть споживати пізніше

Використовуйте [`openclaw acp`](/uk/cli/acp), коли OpenClaw має сам розміщувати
сесію coding harness і маршрутизувати цей runtime через ACP.

## OpenClaw як MCP server

Це шлях `openclaw mcp serve`.

## Коли використовувати `serve`

Використовуйте `openclaw mcp serve`, коли:

- Codex, Claude Code або інший MCP client має напряму взаємодіяти з
  розмовами каналів на базі OpenClaw
- у вас уже є локальний або віддалений OpenClaw Gateway із маршрутизованими сесіями
- вам потрібен один MCP server, який працює з channel backends OpenClaw,
  а не окремі bridge для кожного каналу

Натомість використовуйте [`openclaw acp`](/uk/cli/acp), коли OpenClaw має сам розміщувати coding
runtime і зберігати сесію агента всередині OpenClaw.

## Як це працює

`openclaw mcp serve` запускає stdio MCP server. Цим процесом володіє
MCP client. Поки клієнт тримає stdio-сесію відкритою, bridge підключається до
локального або віддаленого OpenClaw Gateway через WebSocket і надає маршрутизовані channel
conversations через MCP.

Життєвий цикл:

1. MCP client запускає `openclaw mcp serve`
2. bridge підключається до Gateway
3. маршрутизовані сесії стають MCP conversations та інструментами transcript/history
4. live events ставляться в чергу в пам’яті, поки bridge підключений
5. якщо ввімкнено режим каналу Claude, та сама сесія також може отримувати
   специфічні для Claude push-сповіщення

Важлива поведінка:

- стан live queue починається з моменту підключення bridge
- старіша історія transcript читається через `messages_read`
- push-сповіщення Claude існують лише поки жива сесія MCP
- коли клієнт відключається, bridge завершує роботу, а live queue зникає
- stdio MCP server, запущені OpenClaw (bundled або налаштовані користувачем), зупиняються
  як дерево процесів під час завершення роботи, тому дочірні підпроцеси, запущені
  сервером, не виживають після завершення батьківського stdio client
- видалення або скидання сесії звільняє MCP clients цієї сесії через
  спільний шлях очищення runtime, тому не залишається висячих stdio-з’єднань,
  прив’язаних до видаленої сесії

## Вибір режиму клієнта

Той самий bridge можна використовувати двома різними способами:

- Generic MCP clients: лише стандартні інструменти MCP. Використовуйте `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` та
  інструменти погодження.
- Claude Code: стандартні інструменти MCP плюс адаптер каналу, специфічний для Claude.
  Увімкніть `--claude-channel-mode on` або залиште типове `auto`.

Наразі `auto` поводиться так само, як `on`. Визначення можливостей клієнта
поки немає.

## Що надає `serve`

Bridge використовує наявні метадані маршруту сесії Gateway, щоб надавати channel-backed
conversations. Розмова з’являється, коли OpenClaw уже має стан сесії з
відомим маршрутом, наприклад:

- `channel`
- метадані одержувача або призначення
- необов’язковий `accountId`
- необов’язковий `threadId`

Це дає MCP clients єдине місце, де можна:

- перелічувати останні маршрутизовані conversations
- читати недавню історію transcript
- чекати на нові вхідні live events
- надсилати відповідь назад тим самим маршрутом
- бачити запити на погодження, які надходять, поки bridge підключений

## Використання

```bash
# Локальний Gateway
openclaw mcp serve

# Віддалений Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Віддалений Gateway з автентифікацією паролем
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Увімкнути докладні журнали bridge
openclaw mcp serve --verbose

# Вимкнути push-сповіщення, специфічні для Claude
openclaw mcp serve --claude-channel-mode off
```

## Інструменти bridge

Поточний bridge надає такі інструменти MCP:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Показує останні conversations на основі сесій, які вже мають метадані маршруту в
стані сесії Gateway.

Корисні фільтри:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Повертає одну conversation за `session_key`.

### `messages_read`

Читає останні повідомлення transcript для однієї conversation на основі сесії.

### `attachments_fetch`

Витягує нетекстові блоки вмісту повідомлення з одного повідомлення transcript. Це
подання метаданих поверх вмісту transcript, а не окреме надійне blob-сховище вкладень.

### `events_poll`

Читає live events із черги, починаючи з числового cursor.

### `events_wait`

Виконує long-poll, доки не надійде наступна відповідна подія з черги або не спливе час очікування.

Використовуйте це, коли generic MCP client потрібна доставка майже в реальному часі без
специфічного для Claude протоколу push.

### `messages_send`

Надсилає текст назад тим самим маршрутом, який уже записано в сесії.

Поточна поведінка:

- потребує наявного маршруту conversation
- використовує channel сесії, одержувача, account id і thread id
- надсилає лише текст

### `permissions_list_open`

Показує запити на погодження exec/plugin, які bridge спостерігав із моменту
підключення до Gateway.

### `permissions_respond`

Закриває один очікувальний запит на погодження exec/plugin одним із таких рішень:

- `allow-once`
- `allow-always`
- `deny`

## Модель подій

Bridge тримає чергу подій у пам’яті, поки він підключений.

Поточні типи подій:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Важливі обмеження:

- черга працює лише для live-подій; вона починається, коли запускається MCP bridge
- `events_poll` і `events_wait` самі по собі не відтворюють старішу історію Gateway
- надійний backlog слід читати через `messages_read`

## Сповіщення каналу Claude

Bridge також може надавати сповіщення каналу, специфічні для Claude. Це
еквівалент адаптера каналу Claude Code в OpenClaw: стандартні інструменти MCP залишаються
доступними, але live вхідні повідомлення також можуть надходити як специфічні для Claude
MCP-сповіщення.

Прапорці:

- `--claude-channel-mode off`: лише стандартні інструменти MCP
- `--claude-channel-mode on`: увімкнути сповіщення каналу Claude
- `--claude-channel-mode auto`: поточне типове значення; та сама поведінка bridge, що й у `on`

Коли режим каналу Claude увімкнено, сервер оголошує експериментальні
можливості Claude і може надсилати:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Поточна поведінка bridge:

- вхідні повідомлення transcript типу `user` пересилаються як
  `notifications/claude/channel`
- запити на дозволи Claude, отримані через MCP, відстежуються в пам’яті
- якщо пов’язана conversation пізніше надсилає `yes abcde` або `no abcde`, bridge
  перетворює це на `notifications/claude/channel/permission`
- ці сповіщення існують лише для live-сесії; якщо MCP client відключається,
  цілі для push більше немає

Це навмисно клієнт-специфічна поведінка. Generic MCP clients мають покладатися на
стандартні інструменти опитування.

## Конфігурація MCP client

Приклад конфігурації stdio client:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Для більшості generic MCP clients спочатку використовуйте стандартну поверхню інструментів і
ігноруйте режим Claude. Увімкніть режим Claude лише для клієнтів, які справді розуміють
специфічні для Claude методи сповіщень.

## Параметри

`openclaw mcp serve` підтримує:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: токен Gateway
- `--token-file <path>`: прочитати токен із файлу
- `--password <password>`: пароль Gateway
- `--password-file <path>`: прочитати пароль із файлу
- `--claude-channel-mode <auto|on|off>`: режим сповіщень Claude
- `-v`, `--verbose`: докладні журнали в stderr

Коли можливо, надавайте перевагу `--token-file` або `--password-file` замість вбудованих секретів.

## Межа безпеки та довіри

Bridge не вигадує маршрутизацію. Він лише надає conversations, які Gateway
вже вміє маршрутизувати.

Це означає:

- allowlist відправників, спарювання та довіра на рівні channel усе ще належать
  до базової конфігурації каналу OpenClaw
- `messages_send` може відповідати лише через наявний збережений маршрут
- стан погоджень є live/in-memory лише для поточної сесії bridge
- автентифікація bridge має використовувати ті самі засоби токена або пароля Gateway, яким ви
  довіряли б для будь-якого іншого віддаленого клієнта Gateway

Якщо conversation відсутня в `conversations_list`, зазвичай причина не у
конфігурації MCP. Це відсутні або неповні метадані маршруту в базовій
сесії Gateway.

## Тестування

OpenClaw постачається з детермінованим Docker smoke-тестом для цього bridge:

```bash
pnpm test:docker:mcp-channels
```

Цей smoke-тест:

- запускає контейнер Gateway із підготовленими даними
- запускає другий контейнер, який виконує `openclaw mcp serve`
- перевіряє виявлення conversations, читання transcript, читання метаданих вкладень,
  поведінку черги live events і маршрутизацію вихідних надсилань
- перевіряє сповіщення каналу та дозволів у стилі Claude через реальний
  stdio MCP bridge

Це найшвидший спосіб довести, що bridge працює, без підключення реального
облікового запису Telegram, Discord або iMessage до тестового запуску.

Для ширшого контексту тестування див. [Тестування](/uk/help/testing).

## Усунення несправностей

### Не повертаються conversations

Зазвичай це означає, що сесію Gateway ще не можна маршрутизувати. Переконайтеся, що
базова сесія має збережені метадані маршруту каналу/провайдера, одержувача та необов’язкового
account/thread.

### `events_poll` або `events_wait` пропускає старі повідомлення

Це очікувана поведінка. Live queue починається, коли bridge підключається. Читайте старішу історію transcript
через `messages_read`.

### Сповіщення Claude не з’являються

Перевірте все з наведеного:

- клієнт тримав stdio-сесію MCP відкритою
- `--claude-channel-mode` має значення `on` або `auto`
- клієнт справді розуміє специфічні для Claude методи сповіщень
- вхідне повідомлення сталося після підключення bridge

### Відсутні погодження

`permissions_list_open` показує лише запити на погодження, спостережені, поки bridge
був підключений. Це не API надійної історії погоджень.

## OpenClaw як реєстр MCP client

Це шлях `openclaw mcp list`, `show`, `set` і `unset`.

Ці команди не надають OpenClaw через MCP. Вони керують визначеннями MCP,
що належать OpenClaw, у `mcp.servers` у конфігурації OpenClaw.

Ці збережені визначення призначені для runtime, які OpenClaw запускає або налаштовує
пізніше, наприклад для вбудованого Pi та інших runtime adapters. OpenClaw зберігає
визначення централізовано, щоб цим runtime не потрібно було тримати власні дубльовані
списки MCP server.

Важлива поведінка:

- ці команди лише читають або записують конфігурацію OpenClaw
- вони не підключаються до цільового MCP server
- вони не перевіряють, чи команду, URL або віддалений транспорт
  можна досягти прямо зараз
- runtime adapters самі вирішують, які форми транспорту вони фактично підтримують під
  час виконання
- вбудований Pi надає налаштовані інструменти MCP у звичайних профілях інструментів `coding` і `messaging`; `minimal` усе ще приховує їх, а `tools.deny: ["bundle-mcp"]` явно їх вимикає

## Збережені визначення MCP server

OpenClaw також зберігає в конфігурації легковагий реєстр MCP server для поверхонь,
яким потрібні визначення MCP під керуванням OpenClaw.

Команди:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Примітки:

- `list` сортує назви server.
- `show` без назви виводить повний налаштований об’єкт MCP server.
- `set` очікує одне значення об’єкта JSON у командному рядку.
- `unset` завершується помилкою, якщо вказаний server не існує.

Приклади:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Приклад форми конфігурації:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Транспорт stdio

Запускає локальний дочірній процес і обмінюється даними через stdin/stdout.

| Field                      | Description                           |
| -------------------------- | ------------------------------------- |
| `command`                  | Виконуваний файл для запуску (обов’язково) |
| `args`                     | Масив аргументів командного рядка     |
| `env`                      | Додаткові змінні середовища           |
| `cwd` / `workingDirectory` | Робочий каталог для процесу           |

#### Фільтр безпеки env для stdio

OpenClaw відхиляє ключі env запуску інтерпретатора, які можуть змінити спосіб запуску stdio MCP server до першого RPC, навіть якщо вони вказані в блоці `env` server. Заблоковані ключі включають `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` та подібні змінні керування runtime. Під час запуску вони відхиляються з помилкою конфігурації, щоб не можна було вставити неявний prelude, підмінити інтерпретатор або ввімкнути debugger для stdio-процесу. Звичайні облікові дані, проксі та специфічні для server змінні env (`GITHUB_TOKEN`, `HTTP_PROXY`, власні `*_API_KEY` тощо) це не зачіпає.

Якщо вашому MCP server справді потрібна одна із заблокованих змінних, задайте її для процесу host Gateway, а не в `env` stdio server.

### Транспорт SSE / HTTP

Підключається до віддаленого MCP server через HTTP Server-Sent Events.

| Field                 | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `url`                 | HTTP- або HTTPS-URL віддаленого server (обов’язково)                |
| `headers`             | Необов’язкова мапа ключ-значення HTTP headers (наприклад, токени автентифікації) |
| `connectionTimeoutMs` | Тайм-аут підключення для server у мс (необов’язково)                |

Приклад:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Чутливі значення в `url` (userinfo) і `headers` редагуються в журналах і
виводі статусу.

### Транспорт Streamable HTTP

`streamable-http` — це додатковий варіант транспорту поряд із `sse` і `stdio`. Він використовує HTTP streaming для двобічного зв’язку з віддаленими MCP server.

| Field                 | Description                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `url`                 | HTTP- або HTTPS-URL віддаленого server (обов’язково)                                         |
| `transport`           | Установіть `"streamable-http"`, щоб вибрати цей транспорт; якщо не вказано, OpenClaw використовує `sse` |
| `headers`             | Необов’язкова мапа ключ-значення HTTP headers (наприклад, токени автентифікації)             |
| `connectionTimeoutMs` | Тайм-аут підключення для server у мс (необов’язково)                                         |

Приклад:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Ці команди керують лише збереженою конфігурацією. Вони не запускають channel bridge,
не відкривають live-сесію MCP client і не доводять, що цільовий server доступний.

## Поточні обмеження

На цій сторінці задокументовано bridge у тому вигляді, в якому він постачається зараз.

Поточні обмеження:

- виявлення conversations залежить від наявних метаданих маршруту сесії Gateway
- немає загального протоколу push, окрім специфічного для Claude адаптера
- поки що немає інструментів редагування повідомлень або реакцій
- транспорт HTTP/SSE/streamable-http підключається до одного віддаленого server; мультиплексованого upstream поки немає
- `permissions_list_open` включає лише погодження, які були спостережені, поки bridge
  підключений
