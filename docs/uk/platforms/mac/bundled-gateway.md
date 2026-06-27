---
read_when:
    - Пакування OpenClaw.app
    - Налагодження служби launchd Gateway у macOS
    - Встановлення Gateway CLI для macOS
summary: Середовище виконання Gateway у macOS (зовнішня служба launchd)
title: Gateway на macOS
x-i18n:
    generated_at: "2026-06-27T17:46:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app більше не містить вбудованих Node/Bun або середовища виконання Gateway. macOS-застосунок
очікує **зовнішнє** встановлення CLI `openclaw`, не запускає Gateway як
дочірній процес і керує користувацькою службою launchd, щоб Gateway
працював (або під’єднується до наявного локального Gateway, якщо він уже запущений).

## Встановлення CLI (обов’язково для локального режиму)

Node 24 є стандартним середовищем виконання на Mac. Node 22 LTS, наразі `22.19+`, досі працює для сумісності. Потім встановіть `openclaw` глобально:

```bash
npm install -g openclaw@<version>
```

Кнопка **Встановити CLI** у macOS-застосунку запускає той самий глобальний процес встановлення, який застосунок
використовує внутрішньо: спершу він надає перевагу npm, потім pnpm, потім bun, якщо це єдиний
виявлений менеджер пакетів. Node залишається рекомендованим середовищем виконання Gateway.

## Launchd (Gateway як LaunchAgent)

Мітка:

- `ai.openclaw.gateway` (або `ai.openclaw.<profile>`; застарілі `com.openclaw.*` можуть залишатися)

Розташування plist (для користувача):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (або `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Менеджер:

- macOS-застосунок відповідає за встановлення й оновлення LaunchAgent у локальному режимі.
- CLI також може встановити його: `openclaw gateway install`.

Поведінка:

- "OpenClaw активний" вмикає/вимикає LaunchAgent.
- Вихід із застосунку **не** зупиняє gateway (launchd підтримує його роботу).
- Якщо Gateway уже працює на налаштованому порту, застосунок під’єднується до
  нього замість запуску нового.

Журналювання:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (профілі використовують `gateway-<profile>.log`)
- stderr launchd: пригнічено

## Сумісність версій

macOS-застосунок перевіряє версію gateway щодо власної версії. Якщо вони
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

## Пов’язане

- [macOS-застосунок](/uk/platforms/macos)
- [Runbook Gateway](/uk/gateway)
