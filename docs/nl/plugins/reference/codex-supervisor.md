---
read_when:
    - Je installeert, configureert of auditeert de codex-supervisor-Plugin
summary: Houd toezicht op Codex-app-serversessies vanuit OpenClaw.
title: Codex Supervisor-plugin
x-i18n:
    generated_at: "2026-06-27T17:59:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Codex Supervisor-Plugin

Beheer Codex app-server-sessies vanuit OpenClaw.

## Distributie

- Pakket: `@openclaw/codex-supervisor`
- Installatieroute: inbegrepen in OpenClaw

## Oppervlak

contracten: tools

<!-- openclaw-plugin-reference:manual-start -->

## Sessielijst

`codex_sessions_list` gebruikt standaard alleen geladen Codex-sessies. Stel `include_stored` in om opgeslagen geschiedenis op te nemen; de plugin gebruikt het alleen-state-DB-lijstpad van Codex app-server en beperkt opgeslagen resultaten standaard tot 200. Geef `max_stored_sessions` door om die limiet te verlagen of te verhogen, tot maximaal 1000.

<!-- openclaw-plugin-reference:manual-end -->
