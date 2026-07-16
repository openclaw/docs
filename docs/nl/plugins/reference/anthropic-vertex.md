---
read_when:
    - Je installeert, configureert of controleert de anthropic-vertex-plugin
summary: OpenClaw Anthropic Vertex-providerplugin voor Claude-modellen op Google Vertex AI.
title: Anthropic Vertex-Plugin
x-i18n:
    generated_at: "2026-07-16T16:03:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex-plugin

OpenClaw Anthropic Vertex-providerplugin voor Claude-modellen op Google Vertex AI.

## Distributie

- Pakket: `@openclaw/anthropic-vertex-provider`
- Installatieroute: npm; ClawHub

## Oppervlak

providers: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Gebruik `anthropic-vertex/claude-fable-5` waar het model beschikbaar is in je Google Cloud-regio.
Fable 5 gebruikt altijd adaptief denken en hanteert standaard `high` inspanning. `/think off` en
`/think minimal` gebruiken `low` inspanning omdat het model het uitschakelen van denken niet ondersteunt.

## Claude Sonnet 5

Gebruik `anthropic-vertex/claude-sonnet-5` met het `global`-, `us`- of `eu`-
endpoint van Vertex. Sonnet 5 gebruikt standaard adaptief denken met `high` inspanning en ondersteunt
`/think off` of de native `/think xhigh|max`-niveaus. OpenClaw publiceert automatisch het
contextvenster van 1.000.000 tokens en de uitvoerlimiet van 128.000 tokens.

De catalogusprijzen volgen het wereldwijde introductietarief van Vertex van `$2/$10` per
miljoen invoer-/uitvoertokens tot en met 31 augustus 2026, en vervolgens `$3/$15` vanaf
1 september. Voor de multiregionale endpoints `us` en `eu` geldt de door Vertex gedocumenteerde
toeslag van 10%.

<!-- openclaw-plugin-reference:manual-end -->
