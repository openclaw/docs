---
read_when:
    - Пакування OpenClaw.app
    - Налагодження служби Gateway launchd у macOS
    - Встановлення CLI Gateway для macOS
summary: Середовище виконання Gateway у macOS (зовнішня служба launchd)
title: Gateway у macOS
x-i18n:
    generated_at: "2026-07-16T18:14:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app не містить у комплекті Node або середовище виконання Gateway. Застосунок macOS
очікує **зовнішнє** встановлення CLI `openclaw`, не запускає Gateway як
дочірній процес і керує користувацькою службою launchd, щоб Gateway
працював безперервно (або підключається до вже запущеного локального Gateway).

## Автоматичне налаштування

На новому Mac під час початкового налаштування виберіть **This Mac**. Перед майстром
Gateway застосунок запускає свій підписаний інсталяційний скрипт із комплекту: він встановлює
користувацьке середовище виконання Node та відповідний CLI `openclaw` у `~/.openclaw`,
а потім установлює й запускає користувацьку службу launchd. Для цього способу не потрібні
Terminal, Homebrew або права адміністратора.

Застосунок містить у комплекті лише інсталяційний скрипт, а не компоненти Node чи Gateway;
для завантаження середовища виконання та відповідного пакета
OpenClaw під час налаштування потрібне підключення до інтернету.

## Відновлення вручну

Для встановлення вручну рекомендовано Node 24.15+; Node 22.22.3+ також працює. Установіть
`openclaw` глобально:

```bash
npm install -g openclaw@<version>
```

Після невдалого автоматичного налаштування скористайтеся **Retry setup**. Якщо помилка не зникне,
установіть CLI вручну за допомогою наведеної вище команди, а потім виберіть **Check again**
під час початкового налаштування.

## Launchd (Gateway як LaunchAgent)

Мітка: `ai.openclaw.gateway` (профіль за замовчуванням) або `ai.openclaw.<profile>`
для іменованого профілю.

Розташування plist (для користувача): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(або `ai.openclaw.<profile>.plist`).

Застосунок macOS керує встановленням і оновленням LaunchAgent для профілю за замовчуванням у
локальному режимі. CLI також може встановити його безпосередньо: `openclaw gateway install`
(іменовані профілі вибирають за допомогою змінної середовища `OPENCLAW_PROFILE`).

Поведінка:

- «OpenClaw Active» вмикає або вимикає LaunchAgent.
- Завершення роботи застосунку **не** зупиняє Gateway (launchd підтримує його роботу).
- Якщо Gateway уже працює на налаштованому порту, застосунок підключається до
  нього замість запуску нового.

Журналювання:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (для профілів використовується
  `gateway-<profile>.log`)
- stderr launchd: приглушено
- Якщо хост зациклюється з повторюваними `EADDRINUSE` або швидкими перезапусками, перевірте
  наявність дубльованих LaunchAgent `ai.openclaw.gateway` / `ai.openclaw.node` і
  обхідне рішення з маркером launchd у розділі
  [Усунення несправностей Gateway](/uk/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Сумісність версій

Застосунок macOS перевіряє версію Gateway на відповідність власній версії. Під час початкового
налаштування кероване встановлення запускається автоматично, якщо наявний CLI відсутній або
несумісний. Скористайтеся **Retry setup**, щоб повторити встановлення, або **Check again**
після відновлення зовнішнього CLI.

## Каталог стану в macOS

Зберігайте стан OpenClaw на локальному диску без синхронізації. Уникайте iCloud Drive та інших
папок із хмарною синхронізацією; затримки синхронізації та блокування файлів можуть впливати на сеанси,
облікові дані та стан Gateway.

Установлюйте `OPENCLAW_STATE_DIR` на локальний шлях лише тоді, коли потрібно перевизначити значення.
`openclaw doctor` попереджає про поширені шляхи стану з хмарною синхронізацією та рекомендує
повернутися до локального сховища. Див.
[змінні середовища](/uk/help/environment#path-related-env-vars) і
[Doctor](/uk/gateway/doctor).

## Діагностика підключення застосунку

Скористайтеся налагоджувальним CLI macOS із робочої копії вихідного коду, щоб перевірити той самий
процес встановлення з’єднання WebSocket із Gateway і логіку виявлення, які використовує застосунок:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` приймає `--url`, `--token`, `--timeout`, `--probe` і `--json`
(а також перевизначення ідентифікації клієнта; запустіть із `--help`, щоб переглянути повний список).
`discover` приймає `--timeout`, `--json` і `--include-local`. Порівняйте
результат виявлення з `openclaw gateway discover --json`, коли потрібно
відокремити проблеми виявлення CLI від проблем підключення з боку застосунку.

## Базова перевірка

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

## Пов’язані матеріали

- [Застосунок macOS](/uk/platforms/macos)
- [Інструкція з експлуатації Gateway](/uk/gateway)
