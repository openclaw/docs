---
read_when:
    - Оновлення UI налаштувань Skills на macOS
    - Зміна шлюзування Skills або поведінки встановлення
summary: UI налаштувань Skills на macOS і статус, що підтримується Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-23T21:01:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: e396353a5bfde0a0863cb42d7da9c6b56bff72c89f1457ec4abdade999cc2467
    source_path: platforms/mac/skills.md
    workflow: 15
---

Застосунок macOS показує Skills OpenClaw через gateway; він не розбирає Skills локально.

## Джерело даних

- `skills.status` (gateway) повертає всі Skills разом із придатністю та відсутніми вимогами
  (включно з блокуваннями allowlist для bundled Skills).
- Вимоги виводяться з `metadata.openclaw.requires` у кожному `SKILL.md`.

## Дії встановлення

- `metadata.openclaw.install` визначає варіанти встановлення (`brew`/`node`/`go`/`uv`).
- Застосунок викликає `skills.install`, щоб запускати інсталятори на хості gateway.
- Вбудовані `critical` findings із dangerous-code типово блокують `skills.install`; suspicious findings усе ще лише попереджають. Dangerous override існує на запиті gateway, але типовий потік застосунку залишається fail-closed.
- Якщо кожен варіант встановлення має тип `download`, gateway показує всі варіанти
  завантаження.
- Інакше gateway вибирає один бажаний інсталятор, використовуючи поточні
  налаштування встановлення та binary хоста: спочатку Homebrew, коли
  ввімкнено `skills.install.preferBrew` і існує `brew`, потім `uv`, далі
  налаштований node manager із `skills.install.nodeManager`, а потім інші
  fallback-и, як-от `go` або `download`.
- Підписи встановлення Node відображають налаштований node manager, включно з `yarn`.

## Env/API keys

- Застосунок зберігає ключі в `~/.openclaw/openclaw.json` у `skills.entries.<skillKey>`.
- `skills.update` оновлює `enabled`, `apiKey` і `env`.

## Віддалений режим

- Встановлення й оновлення config відбуваються на хості gateway (а не на локальному Mac).
