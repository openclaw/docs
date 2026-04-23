---
read_when:
    - Реалізація функцій macOS app
    - Зміна життєвого циклу gateway або bridge Node на macOS
summary: Супровідний застосунок OpenClaw для macOS (menu bar + брокер gateway)
title: macOS app
x-i18n:
    generated_at: "2026-04-23T21:01:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

macOS app — це **супровідний застосунок у menu bar** для OpenClaw. Він володіє дозволами,
керує/під’єднується до Gateway локально (launchd або вручну) і відкриває для агента
можливості macOS як Node.

## Що він робить

- Показує нативні сповіщення і стан у menu bar.
- Володіє запитами TCC (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript).
- Запускає Gateway або підключається до нього (локально чи віддалено).
- Відкриває інструменти лише для macOS (Canvas, Camera, Screen Recording, `system.run`).
- Запускає локальний Node host service у режимі **remote** (launchd) і зупиняє його в режимі **local**.
- За потреби хостить **PeekabooBridge** для автоматизації UI.
- Установлює глобальний CLI (`openclaw`) за запитом через npm, pnpm або bun (app надає перевагу npm, потім pnpm, потім bun; Node залишається рекомендованим runtime для Gateway).

## Local vs remote mode

- **Local** (типово): app під’єднується до вже запущеного локального Gateway, якщо він є;
  інакше вмикає launchd service через `openclaw gateway install`.
- **Remote**: app підключається до Gateway через SSH/Tailscale і ніколи не запускає
  локальний процес.
  App запускає локальний **Node host service**, щоб віддалений Gateway міг дістатися до цього Mac.
  App не породжує Gateway як дочірній процес.
  Виявлення Gateway тепер надає перевагу іменам Tailscale MagicDNS замість сирих tailnet IP,
  тому mac app надійніше відновлюється, коли tailnet IP змінюються.

## Керування Launchd

App керує LaunchAgent на рівні користувача з міткою `ai.openclaw.gateway`
(або `ai.openclaw.<profile>` при використанні `--profile`/`OPENCLAW_PROFILE`; legacy `com.openclaw.*` усе ще вивантажується).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Замініть мітку на `ai.openclaw.<profile>`, коли запускаєте іменований profile.

Якщо LaunchAgent не встановлено, увімкніть його з app або виконайте
`openclaw gateway install`.

## Можливості Node (mac)

macOS app представляє себе як Node. Поширені команди:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node повідомляє `permissions` map, щоб агенти могли вирішувати, що дозволено.

Node service + IPC app:

- Коли працює headless Node host service (режим remote), він підключається до Gateway WS як Node.
- `system.run` виконується в macOS app (контекст UI/TCC) через локальний Unix socket; запити + вивід залишаються всередині app.

Діаграма (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals (`system.run`)

`system.run` контролюється через **Exec approvals** у macOS app (Settings → Exec approvals).
Security + ask + allowlist зберігаються локально на Mac у:

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

- Елементи `allowlist` — це glob-шаблони для розв’язаних шляхів до binary.
- Сирий текст shell-команди, що містить синтаксис керування shell або розгортання (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), вважається allowlist miss і потребує явного схвалення (або включення binary shell до allowlist).
- Вибір “Always Allow” у prompt додає цю команду до allowlist.
- Перевизначення середовища для `system.run` фільтруються (відкидаються `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), а потім об’єднуються із середовищем app.
- Для shell-wrapper-ів (`bash|sh|zsh ... -c/-lc`) перевизначення середовища на рівні запиту зводяться до малого явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always у режимі allowlist відомі wrapper-и dispatch (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають внутрішні шляхи executable, а не шляхи wrapper-ів. Якщо безпечне розгортання неможливе, жоден запис allowlist автоматично не зберігається.

## Deep links

App реєструє схему URL `openclaw://` для локальних дій.

### `openclaw://agent`

Запускає запит `agent` до Gateway.
__OC_I18N_900004__
Параметри query:

- `message` (обов’язковий)
- `sessionKey` (необов’язковий)
- `thinking` (необов’язковий)
- `deliver` / `to` / `channel` (необов’язкові)
- `timeoutSeconds` (необов’язковий)
- `key` (необов’язковий unattended mode key)

Безпека:

- Без `key` app просить підтвердження.
- Без `key` app застосовує коротке обмеження довжини повідомлення для prompt підтвердження й ігнорує `deliver` / `to` / `channel`.
- З дійсним `key` запуск відбувається без участі користувача (призначено для персональної автоматизації).

## Типовий flow онбордингу

1. Установіть і запустіть **OpenClaw.app**.
2. Пройдіть checklist дозволів (запити TCC).
3. Переконайтеся, що активний режим **Local** і Gateway запущено.
4. Установіть CLI, якщо хочете доступ із terminal.

## Розміщення каталогу state (macOS)

Не розміщуйте каталог state OpenClaw в iCloud або інших cloud-synced folders.
Шляхи, за якими виконується синхронізація, можуть додавати затримку й інколи спричиняти file-lock/sync race для
сесій і облікових даних.

Надавайте перевагу локальному шляху state без синхронізації, наприклад:
__OC_I18N_900005__
Якщо `openclaw doctor` виявить state у:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

він покаже попередження й порекомендує повернутися до локального шляху.

## Робочий процес збірки й розробки (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (або Xcode)
- Пакування app: `scripts/package-mac-app.sh`

## Налагодження підключення gateway (macOS CLI)

Використовуйте debug CLI, щоб перевірити той самий handshake WebSocket Gateway і логіку виявлення,
які використовує macOS app, не запускаючи сам app.
__OC_I18N_900006__
Параметри connect:

- `--url <ws://host:port>`: перевизначити config
- `--mode <local|remote>`: розв’язати з config (типово: config або local)
- `--probe`: примусово виконати свіжий health probe
- `--timeout <ms>`: timeout запиту (типово: `15000`)
- `--json`: структурований вивід для порівняння

Параметри discovery:

- `--include-local`: включити gateway, які було б відфільтровано як “local”
- `--timeout <ms>`: загальне вікно discovery (типово: `2000`)
- `--json`: структурований вивід для порівняння

Порада: порівняйте з `openclaw gateway discover --json`, щоб побачити, чи
відрізняється pipeline discovery macOS app (`local.` плюс налаштований wide-area domain, з
fallback-ами wide-area і Tailscale Serve) від
discovery на основі `dns-sd` у Node CLI.

## Внутрішня робота віддаленого підключення (SSH tunnels)

Коли macOS app працює в режимі **Remote**, він відкриває SSH tunnel, щоб локальні UI
компоненти могли спілкуватися з віддаленим Gateway так, ніби він знаходиться на localhost.

### Control tunnel (порт WebSocket Gateway)

- **Призначення:** health checks, status, Web Chat, config та інші виклики control-plane.
- **Локальний порт:** порт Gateway (типово `18789`), завжди стабільний.
- **Віддалений порт:** той самий порт Gateway на віддаленому хості.
- **Поведінка:** жодного випадкового локального порту; app повторно використовує наявний здоровий tunnel
  або перезапускає його за потреби.
- **Форма SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` з BatchMode +
  ExitOnForwardFailure + параметрами keepalive.
- **Звітування IP:** SSH tunnel використовує loopback, тому gateway бачитиме IP Node
  як `127.0.0.1`. Використовуйте транспорт **Direct (ws/wss)**, якщо хочете, щоб
  відображався реальний IP client-а (див. [macOS remote access](/uk/platforms/mac/remote)).

Кроки налаштування див. у [macOS remote access](/uk/platforms/mac/remote). Деталі
протоколу див. у [Gateway protocol](/uk/gateway/protocol).

## Пов’язана документація

- [Gateway runbook](/uk/gateway)
- [Gateway (macOS)](/uk/platforms/mac/bundled-gateway)
- [Дозволи macOS](/uk/platforms/mac/permissions)
- [Canvas](/uk/platforms/mac/canvas)
