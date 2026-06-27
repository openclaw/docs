---
read_when:
    - Оновлення інтерфейсу налаштувань Skills у macOS
    - Зміна умов доступу до Skills або поведінки встановлення
summary: інтерфейс налаштувань Skills у macOS і статус на основі Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:47:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

Застосунок macOS показує OpenClaw Skills через Gateway; він не розбирає Skills локально.

## Джерело даних

- `skills.status` (Gateway) повертає всі Skills, а також придатність і відсутні вимоги
  (включно з блокуваннями allowlist для вбудованих Skills).
- Вимоги виводяться з `metadata.openclaw.requires` у кожному `SKILL.md`.

## Дії встановлення

- `metadata.openclaw.install` визначає варіанти встановлення (brew/node/go/uv).
- Застосунок викликає `skills.install`, щоб запустити інсталятори на хості Gateway.
- Керована оператором `security.installPolicy` може блокувати встановлення Skills
  через Gateway до виконання метаданих інсталятора. Вбудоване блокування небезпечного коду
  під час встановлення не є частиною потоку встановлення Skills.
- Якщо кожен варіант встановлення є `download`, Gateway показує всі
  варіанти завантаження.
- Інакше Gateway вибирає один бажаний інсталятор, використовуючи поточні
  налаштування встановлення та бінарні файли хоста: спочатку Homebrew, коли
  `skills.install.preferBrew` увімкнено і `brew` існує, потім `uv`, потім
  налаштований менеджер Node з `skills.install.nodeManager`, а далі пізніші
  резервні варіанти, як-от `go` або `download`.
- Мітки встановлення Node відображають налаштований менеджер Node, включно з `yarn`.

## Ключі Env/API

- Застосунок зберігає ключі в `~/.openclaw/openclaw.json` у `skills.entries.<skillKey>`.
- `skills.update` виправляє `enabled`, `apiKey` і `env`.

## Віддалений режим

- Встановлення та оновлення конфігурації відбуваються на хості Gateway (а не на локальному Mac).

## Пов’язане

- [Skills](/uk/tools/skills)
- [Застосунок macOS](/uk/platforms/macos)
