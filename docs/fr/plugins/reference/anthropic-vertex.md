---
read_when:
    - Vous installez, configurez ou auditez le Plugin anthropic-vertex
summary: Plugin fournisseur Anthropic Vertex d’OpenClaw pour les modèles Claude sur Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T17:52:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin de fournisseur Anthropic Vertex d’OpenClaw pour les modèles Claude sur Google Vertex AI.

## Distribution

- Package : `@openclaw/anthropic-vertex-provider`
- Voie d’installation : npm ; ClawHub

## Surface

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Utilisez `anthropic-vertex/claude-fable-5` là où le modèle est disponible dans votre région Google Cloud.
Fable 5 utilise toujours la pensée adaptative et définit par défaut l’effort sur `high`. `/think off` et
`/think minimal` utilisent l’effort `low`, car le modèle ne prend pas en charge la désactivation de la pensée.

<!-- openclaw-plugin-reference:manual-end -->
