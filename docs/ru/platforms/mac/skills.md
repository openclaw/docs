---
read_when:
    - Обновление интерфейса настроек Skills в macOS
    - Изменение ограничений Skills или поведения установки
summary: Интерфейс настроек Skills в macOS и статус на базе Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-28T23:13:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

Приложение для macOS отображает OpenClaw Skills через Gateway; оно не разбирает Skills локально.

## Источник данных

- `skills.status` (Gateway) возвращает все Skills, а также сведения о допустимости и недостающих требованиях
  (включая блокировки allowlist для встроенных Skills).
- Требования выводятся из `metadata.openclaw.requires` в каждом `SKILL.md`.

## Действия установки

- `metadata.openclaw.install` определяет варианты установки (brew/node/go/uv).
- Приложение вызывает `skills.install`, чтобы запустить установщики на хосте Gateway.
- Управляемая оператором `security.installPolicy` может блокировать установки Skills
  через Gateway до запуска метаданных установщика. Встроенная блокировка опасного кода во время установки
  не является частью потока установки Skills.
- Если каждый вариант установки равен `download`, Gateway отображает все варианты
  загрузки.
- В противном случае Gateway выбирает один предпочтительный установщик с учетом текущих
  предпочтений установки и бинарных файлов на хосте: сначала Homebrew, когда
  `skills.install.preferBrew` включен и `brew` существует, затем `uv`, затем
  настроенный менеджер Node из `skills.install.nodeManager`, затем более поздние
  резервные варианты, такие как `go` или `download`.
- Метки установки Node отражают настроенный менеджер Node, включая `yarn`.

## Ключи окружения/API

- Приложение хранит ключи в `~/.openclaw/openclaw.json` в `skills.entries.<skillKey>`.
- `skills.update` исправляет `enabled`, `apiKey` и `env`.

## Удаленный режим

- Установка и обновления конфигурации выполняются на хосте Gateway (не на локальном Mac).

## См. также

- [Skills](/ru/tools/skills)
- [приложение macOS](/ru/platforms/macos)
