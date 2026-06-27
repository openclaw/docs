---
read_when:
    - Vous installez, configurez ou auditez le plugin codex-supervisor
summary: Supervisez les sessions du serveur d’application Codex depuis OpenClaw.
title: Plugin superviseur Codex
x-i18n:
    generated_at: "2026-06-27T17:53:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin superviseur Codex

Supervisez les sessions du serveur d’application Codex depuis OpenClaw.

## Distribution

- Paquet : `@openclaw/codex-supervisor`
- Chemin d’installation : inclus dans OpenClaw

## Surface

contrats : outils

<!-- openclaw-plugin-reference:manual-start -->

## Liste des sessions

`codex_sessions_list` utilise par défaut uniquement les sessions Codex chargées. Définissez `include_stored` pour inclure l’historique stocké ; le plugin utilise le chemin de listage exclusivement fondé sur la base de données d’état du serveur d’application Codex et limite les résultats stockés à 200 par défaut. Transmettez `max_stored_sessions` pour abaisser ou augmenter cette limite, jusqu’à 1000.

<!-- openclaw-plugin-reference:manual-end -->
