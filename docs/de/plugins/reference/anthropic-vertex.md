---
read_when:
    - Sie installieren, konfigurieren oder überprüfen das Plugin anthropic-vertex
summary: OpenClaw Anthropic Vertex-Provider-Plugin für Claude-Modelle auf Google Vertex AI.
title: Anthropic-Vertex-Plugin
x-i18n:
    generated_at: "2026-07-12T15:43:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic-Vertex-Plugin

OpenClaw-Provider-Plugin für Anthropic Vertex für Claude-Modelle auf Google Vertex AI.

## Distribution

- Paket: `@openclaw/anthropic-vertex-provider`
- Installationsweg: npm; ClawHub

## Oberfläche

Provider: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Verwenden Sie `anthropic-vertex/claude-fable-5`, sofern das Modell in Ihrer Google-Cloud-Region verfügbar ist.
Fable 5 verwendet immer adaptives Denken und nutzt standardmäßig den Aufwand `high`. `/think off` und
`/think minimal` verwenden den Aufwand `low`, da das Modell die Deaktivierung des Denkens nicht unterstützt.

## Claude Sonnet 5

Verwenden Sie `anthropic-vertex/claude-sonnet-5` mit dem Endpunkt `global`, `us` oder `eu`
von Vertex. Sonnet 5 verwendet standardmäßig adaptives Denken mit dem Aufwand `high` und unterstützt
`/think off` sowie die nativen Stufen `/think xhigh|max`. OpenClaw veröffentlicht automatisch
das Kontextfenster mit 1.000.000 Token und das Ausgabelimit von 128.000 Token.

Die Katalogpreise entsprechen bis zum 31. August 2026 dem globalen Einführungspreis von Vertex in Höhe von `$2/$10` pro
Million Eingabe-/Ausgabe-Token und ab dem 1. September `$3/$15`. Für die multiregionalen Endpunkte
`us` und `eu` gilt der von Vertex dokumentierte
Aufschlag von 10 %.

<!-- openclaw-plugin-reference:manual-end -->
