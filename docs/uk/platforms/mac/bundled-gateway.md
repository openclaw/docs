---
read_when:
    - Пакування OpenClaw.app
    - Налагодження служби launchd для Gateway у macOS
    - Встановлення CLI Gateway для macOS
summary: Середовище виконання Gateway на macOS (зовнішня служба launchd)
title: Gateway на macOS
x-i18n:
    generated_at: "2026-05-06T05:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app більше не включає Node/Bun або середовище виконання Gateway. Застосунок macOS
очікує **зовнішнє** встановлення CLI `openclaw`, не запускає Gateway як
дочірній процес і керує службою launchd для кожного користувача, щоб Gateway
працював (або підключається до наявного локального Gateway, якщо він уже запущений).

## Встановіть CLI (обов’язково для локального режиму)

Node 24 є стандартним середовищем виконання на Mac. Node 22 LTS, наразі `22.14+`, усе ще працює для сумісності. Потім встановіть `openclaw` глобально:

```bash
npm install -g openclaw@<version>
```

Кнопка **Встановити CLI** у застосунку macOS запускає той самий потік глобального встановлення, який застосунок
використовує внутрішньо: спочатку він віддає перевагу npm, потім pnpm, а потім bun, якщо це єдиний
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
- Якщо Gateway уже запущений на налаштованому порту, застосунок підключається до
  нього замість запуску нового.

Журналювання:

- stdout/err launchd: `/tmp/openclaw/openclaw-gateway.log`

## Сумісність версій

Застосунок macOS перевіряє версію gateway відносно власної версії. Якщо вони
несумісні, оновіть глобальний CLI, щоб він відповідав версії застосунку.

## Smoke-перевірка

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

## Пов’язано

- [Застосунок macOS](/uk/platforms/macos)
- [Runbook Gateway](/uk/gateway)
