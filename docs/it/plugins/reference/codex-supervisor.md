---
read_when:
    - Stai installando, configurando o verificando il plugin codex-supervisor
summary: Supervisiona le sessioni app-server di Codex da OpenClaw.
title: Plugin Codex Supervisor
x-i18n:
    generated_at: "2026-06-27T17:54:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin supervisore Codex

Supervisiona le sessioni app-server di Codex da OpenClaw.

## Distribuzione

- Pacchetto: `@openclaw/codex-supervisor`
- Percorso di installazione: incluso in OpenClaw

## Superficie

contratti: strumenti

<!-- openclaw-plugin-reference:manual-start -->

## Elenco delle sessioni

`codex_sessions_list` restituisce per impostazione predefinita solo le sessioni Codex caricate. Imposta `include_stored` per includere la cronologia archiviata; il Plugin usa il percorso di elenco solo state-DB dell'app-server Codex e limita per impostazione predefinita i risultati archiviati a 200. Passa `max_stored_sessions` per abbassare o aumentare quel limite, fino a 1000.

<!-- openclaw-plugin-reference:manual-end -->
