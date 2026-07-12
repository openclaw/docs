---
read_when:
    - U installeert, configureert of controleert de anthropic-vertex-plugin
summary: OpenClaw Anthropic Vertex-providerplugin voor Claude-modellen op Google Vertex AI.
title: Anthropic Vertex-Plugin
x-i18n:
    generated_at: "2026-07-12T09:12:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex-plugin

OpenClaw Anthropic Vertex-providerplugin voor Claude-modellen op Google Vertex AI.

## Distributie

- Pakket: `@openclaw/anthropic-vertex-provider`
- Installatieroute: npm; ClawHub

## Oppervlak

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Gebruik `anthropic-vertex/claude-fable-5` waar het model beschikbaar is in uw Google Cloud-regio.
Fable 5 gebruikt altijd adaptief denken en is standaard ingesteld op inspanningsniveau `high`. `/think off` en
`/think minimal` gebruiken inspanningsniveau `low`, omdat het model het uitschakelen van denken niet ondersteunt.

## Claude Sonnet 5

Gebruik `anthropic-vertex/claude-sonnet-5` met het endpoint `global`, `us` of `eu`
van Vertex. Sonnet 5 gebruikt standaard adaptief denken met inspanningsniveau `high` en ondersteunt
`/think off` of de systeemeigen niveaus `/think xhigh|max`. OpenClaw publiceert automatisch het
contextvenster van 1.000.000 tokens en de uitvoerlimiet van 128.000 tokens.

De catalogusprijzen volgen tot en met 31 augustus 2026 het wereldwijde introductietarief van Vertex van `$2/$10` per
miljoen invoer-/uitvoertokens, en vanaf
1 september geldt `$3/$15`. De multiregionale endpoints `us` en `eu` hanteren de door Vertex gedocumenteerde
toeslag van 10%.

<!-- openclaw-plugin-reference:manual-end -->
