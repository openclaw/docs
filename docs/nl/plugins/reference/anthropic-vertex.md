---
read_when:
    - Je installeert, configureert of auditeert de anthropic-vertex-plugin
summary: OpenClaw Anthropic Vertex-providerplugin voor Claude-modellen op Google Vertex AI.
title: Anthropic Vertex-plugin
x-i18n:
    generated_at: "2026-06-27T17:58:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex-plugin

OpenClaw Anthropic Vertex-providerplugin voor Claude-modellen op Google Vertex AI.

## Distributie

- Pakket: `@openclaw/anthropic-vertex-provider`
- Installatieroute: npm; ClawHub

## Interface

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Gebruik `anthropic-vertex/claude-fable-5` waar het model beschikbaar is in je Google Cloud-regio.
Fable 5 gebruikt altijd adaptief denken en gebruikt standaard `high` inspanning. `/think off` en
`/think minimal` gebruiken `low` inspanning omdat het model het uitschakelen van denken niet ondersteunt.

<!-- openclaw-plugin-reference:manual-end -->
