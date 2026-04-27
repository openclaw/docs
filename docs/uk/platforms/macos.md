---
read_when:
    - Реалізація функцій програми macOS
    - Зміна життєвого циклу gateway або bridge Node на macOS
summary: Супутня програма OpenClaw для macOS (рядок меню + брокер gateway)
title: Програма macOS
x-i18n:
    generated_at: "2026-04-27T06:27:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 15
---

Програма macOS — це **супутня програма для рядка меню** для OpenClaw. Вона керує дозволами,
локально керує Gateway або підключається до нього (launchd або вручну), а також надає macOS-
можливості агентові як node.

## Що вона робить

- Показує нативні сповіщення та стан у рядку меню.
- Керує запитами TCC (сповіщення, універсальний доступ, запис екрана, мікрофон,
  розпізнавання мовлення, автоматизація/AppleScript).
- Запускає Gateway або підключається до нього (локально чи віддалено).
- Надає інструменти лише для macOS (Canvas, Camera, Screen Recording, `system.run`).
- Запускає локальний сервіс host Node у режимі **remote** (launchd) і зупиняє його в режимі **local**.
- За потреби розміщує **PeekabooBridge** для UI-автоматизації.
- За запитом встановлює глобальний CLI (`openclaw`) через npm, pnpm або bun (програма надає перевагу npm, потім pnpm, потім bun; Node залишається рекомендованим runtime для Gateway).

## Режим local і remote

- **Local** (типово): програма підключається до запущеного локального Gateway, якщо він є;
  інакше вона вмикає сервіс launchd через `openclaw gateway install`.
- **Remote**: програма підключається до Gateway через SSH/Tailscale і ніколи не запускає
  локальний процес.
  Програма запускає локальний **сервіс host Node**, щоб віддалений Gateway міг звертатися до цього Mac.
  Програма не породжує Gateway як дочірній процес.
  Виявлення Gateway тепер надає перевагу іменам Tailscale MagicDNS замість сирих IP tailnet,
  тому програма Mac надійніше відновлюється, коли IP tailnet змінюються.

## Керування launchd

Програма керує LaunchAgent для кожного користувача з міткою `ai.openclaw.gateway`
(або `ai.openclaw.<profile>` при використанні `--profile`/`OPENCLAW_PROFILE`; застарілі `com.openclaw.*` усе ще вивантажуються).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Замініть мітку на `ai.openclaw.<profile>`, якщо запускаєте іменований профіль.

Якщо LaunchAgent не встановлено, увімкніть його з програми або виконайте
`openclaw gateway install`.

## Можливості Node (mac)

Програма macOS представляє себе як node. Типові команди:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node повідомляє мапу `permissions`, щоб агенти могли визначати, що дозволено.

Сервіс Node + IPC програми:

- Коли працює headless-сервіс host Node (режим remote), він підключається до WS Gateway як node.
- `system.run` виконується в програмі macOS (контекст UI/TCC) через локальний Unix socket; запити та вивід залишаються в програмі.

Схема (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Підтвердження виконання (system.run)

`system.run` керується через **Exec approvals** у програмі macOS (Settings → Exec approvals).
Параметри security + ask + allowlist зберігаються локально на Mac у:

```
~/.openclaw/exec-approvals.json
```

Приклад:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Примітки:

- Записи `allowlist` — це glob-шаблони для розв’язаних шляхів до бінарних файлів або прості імена команд для команд, викликаних через PATH.
- Сирий текст shell-команди, що містить синтаксис керування shell або розгортання (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), вважається промахом по allowlist і потребує явного підтвердження (або додавання бінарного файла shell до allowlist).
- Вибір “Always Allow” у запиті додає цю команду до allowlist.
- Перевизначення середовища `system.run` фільтруються (вилучаються `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), а потім об’єднуються із середовищем програми.
- Для shell-обгорток (`bash|sh|zsh ... -c/-lc`) перевизначення середовища в межах запиту зводяться до невеликого явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always у режимі allowlist відомі dispatch-обгортки (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають внутрішні шляхи виконуваних файлів замість шляхів обгорток. Якщо безпечне розгортання неможливе, запис allowlist автоматично не зберігається.

## Deep links

Програма реєструє схему URL `openclaw://` для локальних дій.

### `openclaw://agent`

Запускає запит `agent` до Gateway.
__OC_I18N_900004__
Параметри запиту:

- `message` (обов’язково)
- `sessionKey` (необов’язково)
- `thinking` (необов’язково)
- `deliver` / `to` / `channel` (необов’язково)
- `timeoutSeconds` (необов’язково)
- `key` (необов’язковий ключ для unattended mode)

Безпека:

- Без `key` програма запитує підтвердження.
- Без `key` програма застосовує коротке обмеження на довжину повідомлення для запиту підтвердження та ігнорує `deliver` / `to` / `channel`.
- Із дійсним `key` запуск відбувається в unattended mode (призначено для персональних автоматизацій).

## Потік онбордингу (типовий)

1. Встановіть і запустіть **OpenClaw.app**.
2. Пройдіть контрольний список дозволів (запити TCC).
3. Переконайтеся, що активний режим **Local** і Gateway запущено.
4. Встановіть CLI, якщо хочете доступ із термінала.

## Розміщення каталогу стану (macOS)

Не розміщуйте каталог стану OpenClaw в iCloud або інших папках із хмарною синхронізацією.
Шляхи, що спираються на синхронізацію, можуть додавати затримку та інколи спричиняти гонки блокування/синхронізації файлів для
сесій і облікових даних.

Надавайте перевагу локальному несинхронізованому шляху стану, наприклад:
__OC_I18N_900005__
Якщо `openclaw doctor` виявить стан у:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

він попередить і порекомендує повернутися до локального шляху.

## Робочий процес збирання та розробки (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (або Xcode)
- Пакування програми: `scripts/package-mac-app.sh`

## Налагодження підключення до gateway (macOS CLI)

Використовуйте CLI налагодження, щоб перевірити те саме рукостискання WebSocket Gateway і логіку виявлення,
яку використовує програма macOS, не запускаючи саму програму.
__OC_I18N_900006__
Параметри connect:

- `--url <ws://host:port>`: перевизначити конфігурацію
- `--mode <local|remote>`: визначити з конфігурації (типово: конфігурація або local)
- `--probe`: примусово виконати нову перевірку працездатності
- `--timeout <ms>`: тайм-аут запиту (типово: `15000`)
- `--json`: структурований вивід для порівняння

Параметри discover:

- `--include-local`: включати gateway, які інакше було б відфільтровано як “local”
- `--timeout <ms>`: загальне вікно виявлення (типово: `2000`)
- `--json`: структурований вивід для порівняння

<Tip>
Порівняйте з `openclaw gateway discover --json`, щоб побачити, чи конвеєр виявлення програми macOS (`local.` плюс налаштований wide-area домен із резервними варіантами wide-area і Tailscale Serve) відрізняється від виявлення на основі `dns-sd` у Node CLI.
</Tip>

## Внутрішня схема віддаленого підключення (SSH-тунелі)

Коли програма macOS працює в режимі **Remote**, вона відкриває SSH-тунель, щоб локальні UI-
компоненти могли спілкуватися з віддаленим Gateway так, ніби він працює на localhost.

### Керувальний тунель (порт WebSocket Gateway)

- **Призначення:** перевірки працездатності, статус, Web Chat, конфігурація та інші виклики control plane.
- **Локальний порт:** порт Gateway (типово `18789`), завжди стабільний.
- **Віддалений порт:** той самий порт Gateway на віддаленому хості.
- **Поведінка:** без випадкового локального порту; програма повторно використовує наявний справний тунель
  або перезапускає його за потреби.
- **Форма SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` з параметрами BatchMode +
  ExitOnForwardFailure + keepalive.
- **Звітність про IP:** SSH-тунель використовує loopback, тому gateway бачитиме IP node
  як `127.0.0.1`. Використовуйте транспорт **Direct (ws/wss)**, якщо хочете, щоб відображався реальний
  IP клієнта (див. [віддалений доступ macOS](/uk/platforms/mac/remote)).

Кроки налаштування див. у [віддалений доступ macOS](/uk/platforms/mac/remote). Подробиці
протоколу див. у [протокол Gateway](/uk/gateway/protocol).

## Пов’язана документація

- [Runbook Gateway](/uk/gateway)
- [Gateway (macOS)](/uk/platforms/mac/bundled-gateway)
- [Дозволи macOS](/uk/platforms/mac/permissions)
- [Canvas](/uk/platforms/mac/canvas)
