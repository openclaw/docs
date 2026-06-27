---
read_when:
    - Stai installando, configurando o verificando il plugin anthropic-vertex
summary: Plugin provider Anthropic Vertex di OpenClaw per i modelli Claude su Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T17:54:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin provider Anthropic Vertex di OpenClaw per i modelli Claude su Google Vertex AI.

## Distribuzione

- Pacchetto: `@openclaw/anthropic-vertex-provider`
- Percorso di installazione: npm; ClawHub

## Superficie

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Usa `anthropic-vertex/claude-fable-5` dove il modello è disponibile nella tua regione Google Cloud.
Fable 5 usa sempre il ragionamento adattivo e l'impostazione predefinita è lo sforzo `high`. `/think off` e
`/think minimal` usano lo sforzo `low` perché il modello non supporta la disattivazione del ragionamento.

<!-- openclaw-plugin-reference:manual-end -->
