---
read_when:
    - Оновлення інтерфейсу налаштувань Skills у macOS
    - Зміна обмежень доступу до Skills або поведінки встановлення
summary: Інтерфейс налаштувань Skills у macOS і стан, отриманий від Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T13:29:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

Застосунок macOS надає доступ до Skills OpenClaw через Gateway; він не аналізує Skills локально.

## Джерело даних

- `skills.status` (Gateway) повертає всі Skills, а також відомості про відповідність вимогам і відсутні вимоги, зокрема блокування списком дозволених для вбудованих Skills.
- Вимоги походять із `metadata.openclaw.requires` у кожному файлі `SKILL.md`.

## Дії встановлення

- `metadata.openclaw.install` визначає варіанти встановлення (brew/node/go/uv/download).
- Застосунок викликає `skills.install`, щоб запускати інсталятори на хості Gateway.
- Керована оператором політика `security.installPolicy` (`enabled`, `targets`, `exec`) може блокувати встановлення Skills через Gateway до обробки метаданих інсталятора. Вбудоване сканування небезпечного коду (яке використовується для встановлення плагінів) не підключене до процесу встановлення Skills.
- Якщо кожен варіант встановлення має тип `download`, Gateway показує всі варіанти завантаження.
- В іншому разі Gateway вибирає один пріоритетний інсталятор відповідно до поточних налаштувань встановлення (`skills.install.preferBrew`, `skills.install.nodeManager`) і наявних на хості виконуваних файлів: спочатку Homebrew, якщо параметр `preferBrew` увімкнено й доступний `brew`, потім `uv`, далі налаштований менеджер Node, після цього знову Homebrew, якщо він доступний (навіть без `preferBrew`), потім `go` і нарешті `download`.
- Мітки встановлення Node відповідають налаштованому менеджеру Node, зокрема `yarn`.

## Змінні середовища/ключі API

- Застосунок зберігає ключі у `~/.openclaw/openclaw.json` у розділі `skills.entries.<skillKey>`.
- `skills.update` частково оновлює `enabled`, `apiKey` і `env`.

## Віддалений режим

- Встановлення й оновлення конфігурації виконуються на хості Gateway, а не на локальному Mac.

## Пов’язані матеріали

- [Skills](/uk/tools/skills)
- [Застосунок macOS](/uk/platforms/macos)
