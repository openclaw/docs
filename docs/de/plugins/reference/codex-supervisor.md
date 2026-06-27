---
read_when:
    - Sie installieren, konfigurieren oder überprüfen das codex-supervisor-Plugin
summary: Überwachen Sie Codex-app-server-Sitzungen von OpenClaw aus.
title: Codex-Supervisor-Plugin
x-i18n:
    generated_at: "2026-06-27T17:52:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Codex Supervisor-Plugin

Überwachen Sie Codex App-Server-Sitzungen von OpenClaw aus.

## Distribution

- Paket: `@openclaw/codex-supervisor`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

contracts: tools

<!-- openclaw-plugin-reference:manual-start -->

## Sitzungsauflistung

`codex_sessions_list` ist standardmäßig nur auf geladene Codex-Sitzungen beschränkt. Setzen Sie `include_stored`, um gespeicherte Historie einzubeziehen; das Plugin verwendet den reinen State-DB-Auflistungspfad des Codex App-Servers und begrenzt gespeicherte Ergebnisse standardmäßig auf 200. Übergeben Sie `max_stored_sessions`, um diese Obergrenze zu senken oder bis auf 1000 anzuheben.

<!-- openclaw-plugin-reference:manual-end -->
