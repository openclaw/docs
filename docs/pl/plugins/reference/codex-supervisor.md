---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz Plugin codex-supervisor
summary: Nadzoruj sesje serwera aplikacji Codex z OpenClaw.
title: Plugin Codex Supervisor
x-i18n:
    generated_at: "2026-06-27T17:59:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin Codex Supervisor

Nadzoruj sesje serwera aplikacji Codex z OpenClaw.

## Dystrybucja

- Pakiet: `@openclaw/codex-supervisor`
- Ścieżka instalacji: dołączony do OpenClaw

## Powierzchnia

kontrakty: narzędzia

<!-- openclaw-plugin-reference:manual-start -->

## Lista sesji

`codex_sessions_list` domyślnie obejmuje tylko załadowane sesje Codex. Ustaw `include_stored`, aby uwzględnić zapisaną historię; Plugin używa ścieżki listowania serwera aplikacji Codex opartej wyłącznie na bazie danych stanu i domyślnie ogranicza zapisane wyniki do 200. Przekaż `max_stored_sessions`, aby obniżyć lub podnieść ten limit, maksymalnie do 1000.

<!-- openclaw-plugin-reference:manual-end -->
