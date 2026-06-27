---
read_when:
    - Ви встановлюєте, налаштовуєте або перевіряєте Plugin codex-supervisor
summary: Контролюйте сеанси app-server Codex з OpenClaw.
title: Plugin Codex Supervisor
x-i18n:
    generated_at: "2026-06-27T17:57:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin Codex Supervisor

Наглядайте за сеансами сервера застосунку Codex з OpenClaw.

## Розповсюдження

- Пакет: `@openclaw/codex-supervisor`
- Маршрут встановлення: включено в OpenClaw

## Інтерфейс

контракти: інструменти

<!-- openclaw-plugin-reference:manual-start -->

## Список сеансів

`codex_sessions_list` за замовчуванням показує лише завантажені сеанси Codex. Установіть `include_stored`, щоб включити збережену історію; Plugin використовує шлях переліку сервера застосунку Codex лише з БД стану та за замовчуванням обмежує збережені результати до 200. Передайте `max_stored_sessions`, щоб зменшити або збільшити це обмеження, аж до 1000.

<!-- openclaw-plugin-reference:manual-end -->
