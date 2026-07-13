---
read_when:
    - Вы поддерживаете старые скрипты, использующие `openclaw clawbot ...`
    - Вам нужны рекомендации по переходу на актуальные команды
summary: Справочник CLI для `openclaw clawbot` (пространство имён устаревших псевдонимов)
title: Clawbot
x-i18n:
    generated_at: "2026-07-13T18:00:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 6baf9b4e9bbe8bb31cdc4923c38cd45a883b6e5be921a403335e257dacdc2cd5
    source_path: cli/clawbot.md
    workflow: 16
---

# `openclaw clawbot`

Устаревшее пространство имён псевдонима сохранено для обратной совместимости. Оно регистрирует ту же QR-команду, что и CLI верхнего уровня, поэтому `openclaw clawbot qr` принимает все флаги [`openclaw qr`](/ru/cli/qr).

## Миграция

Предпочтительно использовать современную команду верхнего уровня:

- `openclaw clawbot qr` -> `openclaw qr`

## Связанные материалы

- [Справочник по CLI](/ru/cli)
