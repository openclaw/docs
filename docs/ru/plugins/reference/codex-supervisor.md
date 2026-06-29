---
read_when:
    - Вы устанавливаете, настраиваете или проводите аудит плагина codex-supervisor
summary: Контролируйте сеансы app-server Codex из OpenClaw.
title: Plugin супервизора Codex
x-i18n:
    generated_at: "2026-06-28T23:22:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin супервайзера Codex

Контролируйте сеансы app-server Codex из OpenClaw.

## Распространение

- Пакет: `@openclaw/codex-supervisor`
- Маршрут установки: включено в OpenClaw

## Интерфейс

contracts: tools

<!-- openclaw-plugin-reference:manual-start -->

## Список сеансов

`codex_sessions_list` по умолчанию показывает только загруженные сеансы Codex. Установите `include_stored`, чтобы включить сохраненную историю; Plugin использует путь получения списка только из БД состояния app-server Codex и по умолчанию ограничивает сохраненные результаты 200. Передайте `max_stored_sessions`, чтобы уменьшить или увеличить этот лимит, вплоть до 1000.

<!-- openclaw-plugin-reference:manual-end -->
