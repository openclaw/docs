---
read_when:
    - Пакування OpenClaw.app
    - Налагодження служби launchd Gateway у macOS
    - Встановлення CLI Gateway для macOS
summary: Середовище виконання Gateway у macOS (зовнішня служба launchd)
title: Gateway у macOS
x-i18n:
    generated_at: "2026-06-28T00:13:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app більше не постачає Node/Bun або середовище виконання Gateway у комплекті. Застосунок macOS
очікує **зовнішнє** встановлення CLI `openclaw`, не запускає Gateway як
дочірній процес і керує службою launchd для кожного користувача, щоб підтримувати Gateway
запущеним (або під’єднується до наявного локального Gateway, якщо такий уже запущено).

## Встановіть CLI (обов’язково для локального режиму)

Node 24 є стандартним середовищем виконання на Mac. Node 22 LTS, наразі `22.19+`, усе ще працює для сумісності. Потім установіть `openclaw` глобально:

```bash
npm install -g openclaw@<version>
```

Кнопка **Встановити CLI** у застосунку macOS запускає той самий глобальний процес встановлення, який застосунок
використовує внутрішньо: спочатку віддає перевагу npm, потім pnpm, а потім bun, якщо це єдиний
виявлений менеджер пакетів. Node залишається рекомендованим середовищем виконання Gateway.

## Launchd (Gateway як LaunchAgent)

Мітка:

- `ai.openclaw.gateway` (або `ai.openclaw.<profile>`; застарілі `com.openclaw.*` можуть залишатися)

Розташування plist (для кожного користувача):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (або `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Менеджер:

- Застосунок macOS відповідає за встановлення/оновлення LaunchAgent у локальному режимі.
- CLI також може встановити його: `openclaw gateway install`.

Поведінка:

- "OpenClaw Active" вмикає/вимикає LaunchAgent.
- Вихід із застосунку **не** зупиняє gateway (launchd підтримує його роботу).
- Якщо Gateway уже запущено на налаштованому порту, застосунок під’єднується до
  нього замість запуску нового.

Журналювання:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (профілі використовують `gateway-<profile>.log`)
- stderr launchd: пригнічено

## Сумісність версій

Застосунок macOS перевіряє версію gateway відносно власної версії. Якщо вони
несумісні, оновіть глобальний CLI, щоб він відповідав версії застосунку.

## Каталог стану в macOS

Зберігайте стан OpenClaw на локальному диску без синхронізації. Уникайте iCloud Drive та інших
папок із хмарною синхронізацією, оскільки затримка синхронізації та блокування файлів можуть впливати на сеанси,
облікові дані та стан Gateway.

Задавайте `OPENCLAW_STATE_DIR` як локальний шлях лише тоді, коли потрібне перевизначення.
`openclaw doctor` попереджає про поширені шляхи стану з хмарною синхронізацією та рекомендує
повернутися до локального сховища. Див.
[змінні середовища](/uk/help/environment#path-related-env-vars) і
[Doctor](/uk/gateway/doctor).

## Налагодження підключення застосунку

Використовуйте CLI налагодження macOS із checkout вихідного коду, щоб виконати ту саму логіку
WebSocket-рукостискання та виявлення Gateway, яку використовує застосунок:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` приймає `--url`, `--token`, `--timeout` і `--json`. `discover`
приймає `--timeout`, `--json` і `--include-local`. Порівняйте результат виявлення
з `openclaw gateway discover --json`, коли потрібно відокремити виявлення CLI
від проблем підключення на боці застосунку.

## Швидка перевірка

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Потім:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Пов’язане

- [застосунок macOS](/uk/platforms/macos)
- [інструкція з експлуатації Gateway](/uk/gateway)
