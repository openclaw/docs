---
read_when:
    - Пакування OpenClaw.app
    - Налагодження служби launchd для macOS Gateway
    - Встановлення CLI Gateway для macOS
summary: Рантайм Gateway у macOS (зовнішня служба launchd)
title: Gateway на macOS
x-i18n:
    generated_at: "2026-07-04T06:50:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app більше не вбудовує Node/Bun або середовище виконання Gateway. macOS-застосунок
очікує **зовнішнє** встановлення `openclaw` CLI, не запускає Gateway як
дочірній процес і керує користувацьким сервісом launchd, щоб Gateway
працював (або підключається до наявного локального Gateway, якщо він уже працює).

## Автоматичне налаштування

На новому Mac виберіть **Цей Mac** під час онбордингу. Застосунок запускає свій підписаний,
вбудований інсталятор перед майстром Gateway, встановлює користувацьке середовище виконання Node
і відповідний `openclaw` CLI у `~/.openclaw`, а потім встановлює та запускає
користувацький сервіс launchd. Цей шлях не потребує Terminal, Homebrew або
доступу адміністратора.

Застосунок вбудовує сценарій інсталятора, а не корисне навантаження Node або Gateway. Тому
налаштування потребує інтернет-з’єднання, щоб завантажити середовище виконання та відповідний
пакет OpenClaw.

## Відновлення вручну

Node 24 рекомендовано для ручного встановлення. Node 22 LTS, наразі `22.19+`,
також працює. Потім встановіть `openclaw` глобально:

```bash
npm install -g openclaw@<version>
```

Використайте **Повторити налаштування** після невдалого автоматичного налаштування. Якщо це все одно не вдається, встановіть
CLI вручну командою вище, а потім виберіть **Перевірити знову** під час
онбордингу. Node залишається рекомендованим середовищем виконання Gateway.

## Launchd (Gateway як LaunchAgent)

Мітка:

- `ai.openclaw.gateway` (або `ai.openclaw.<profile>`; застаріле `com.openclaw.*` може залишатися)

Розташування plist (для користувача):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (або `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Менеджер:

- macOS-застосунок відповідає за встановлення/оновлення LaunchAgent у локальному режимі.
- CLI також може встановити його: `openclaw gateway install`.

Поведінка:

- "OpenClaw активний" вмикає/вимикає LaunchAgent.
- Вихід із застосунку **не** зупиняє Gateway (launchd підтримує його роботу).
- Якщо Gateway уже працює на налаштованому порту, застосунок підключається до
  нього замість запуску нового.

Журналювання:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (профілі використовують `gateway-<profile>.log`)
- stderr launchd: придушено

## Сумісність версій

macOS-застосунок перевіряє версію Gateway відносно власної версії. Онбординг
автоматично запускає кероване налаштування, коли наявний CLI відсутній або
несумісний. Використайте **Повторити налаштування**, щоб повторити встановлення, або **Перевірити знову**
після відновлення зовнішнього CLI.

## Каталог стану на macOS

Зберігайте стан OpenClaw на локальному диску, який не синхронізується. Уникайте iCloud Drive та інших
папок із хмарною синхронізацією, оскільки затримка синхронізації та блокування файлів можуть впливати на сеанси,
облікові дані та стан Gateway.

Задавайте `OPENCLAW_STATE_DIR` локальним шляхом лише тоді, коли потрібне перевизначення.
`openclaw doctor` попереджає про поширені шляхи стану з хмарною синхронізацією та рекомендує
повернутися до локального сховища. Див.
[змінні середовища](/uk/help/environment#path-related-env-vars) і
[Doctor](/uk/gateway/doctor).

## Налагодження підключення застосунку

Використовуйте налагоджувальний CLI для macOS із вихідного checkout, щоб виконати той самий
WebSocket-рукостиск Gateway і логіку виявлення, які використовує застосунок:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` приймає `--url`, `--token`, `--timeout` і `--json`. `discover`
приймає `--timeout`, `--json` і `--include-local`. Порівнюйте вихід виявлення
з `openclaw gateway discover --json`, коли потрібно відокремити виявлення CLI
від проблем підключення на боці застосунку.

## Димова перевірка

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

- [macOS-застосунок](/uk/platforms/macos)
- [Runbook Gateway](/uk/gateway)
