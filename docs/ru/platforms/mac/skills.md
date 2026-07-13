---
read_when:
    - Обновление интерфейса настроек Skills в macOS
    - Изменение условий доступности Skills или поведения установки
summary: Интерфейс настроек Skills в macOS и состояние на основе Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-13T18:18:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

Приложение macOS предоставляет доступ к Skills OpenClaw через Gateway; локально оно не выполняет разбор Skills.

## Источник данных

- `skills.status` (Gateway) возвращает все Skills, а также сведения о соответствии требованиям и недостающих требованиях, включая блокировки списком разрешений для встроенных Skills.
- Требования берутся из `metadata.openclaw.requires` в каждом `SKILL.md`.

## Действия установки

- `metadata.openclaw.install` определяет варианты установки (brew/node/go/uv/download).
- Приложение вызывает `skills.install`, чтобы запустить установщики на хосте Gateway.
- Управляемые оператором `security.installPolicy` (`enabled`, `targets`, `exec`) могут блокировать установку Skills через Gateway до обработки метаданных установщика. Встроенное сканирование опасного кода (используемое при установке плагинов) не подключено к процессу установки Skills.
- Если каждый вариант установки имеет значение `download`, Gateway предоставляет все варианты загрузки.
- В противном случае Gateway выбирает один предпочтительный установщик с учётом текущих настроек установки (`skills.install.preferBrew`, `skills.install.nodeManager`) и бинарных файлов на хосте: сначала Homebrew, если включён `preferBrew` и присутствует `brew`, затем `uv`, затем настроенный менеджер Node, затем снова Homebrew, если он доступен (даже без `preferBrew`), затем `go` и, наконец, `download`.
- Метки установки Node отражают настроенный менеджер Node, включая `yarn`.

## Переменные окружения и ключи API

- Приложение хранит ключи в `~/.openclaw/openclaw.json` в разделе `skills.entries.<skillKey>`.
- `skills.update` обновляет `enabled`, `apiKey` и `env`.

## Удалённый режим

- Установка и обновление конфигурации выполняются на хосте Gateway, а не на локальном компьютере Mac.

## Связанные материалы

- [Skills](/ru/tools/skills)
- [Приложение macOS](/ru/platforms/macos)
