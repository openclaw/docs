---
read_when:
    - Sie installieren, konfigurieren oder prüfen das anthropic-vertex-Plugin.
summary: OpenClaw-Anthropic-Vertex-Provider-Plugin für Claude-Modelle auf Google Vertex AI.
title: Anthropic-Vertex-Plugin
x-i18n:
    generated_at: "2026-07-16T13:04:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic-Vertex-Plugin

OpenClaw-Provider-Plugin für Anthropic Vertex für Claude-Modelle auf Google Vertex AI.

## Distribution

- Paket: `@openclaw/anthropic-vertex-provider`
- Installationsweg: npm; ClawHub

## Oberfläche

Provider: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Verwenden Sie `anthropic-vertex/claude-fable-5`, sofern das Modell in Ihrer Google-Cloud-Region verfügbar ist.
Fable 5 verwendet stets adaptives Denken und standardmäßig die Aufwandsstufe `high`. `/think off` und
`/think minimal` verwenden die Aufwandsstufe `low`, da das Modell die Deaktivierung des Denkens nicht unterstützt.

## Claude Sonnet 5

Verwenden Sie `anthropic-vertex/claude-sonnet-5` mit dem Vertex-Endpunkt `global`, `us` oder `eu`.
Sonnet 5 verwendet standardmäßig adaptives Denken mit der Aufwandsstufe `high` und unterstützt
`/think off` oder die nativen Stufen `/think xhigh|max`. OpenClaw veröffentlicht sein
Kontextfenster mit 1.000.000 Token und sein Ausgabelimit von 128.000 Token automatisch.

Die Katalogpreise entsprechen bis zum 31. August 2026 dem globalen Einführungspreis von Vertex in Höhe von `$2/$10` pro
Million Eingabe-/Ausgabe-Token und ab dem 1. September `$3/$15`. Für die regionsübergreifenden Endpunkte
`us` und `eu` gilt der von Vertex dokumentierte Aufschlag von 10 %.

<!-- openclaw-plugin-reference:manual-end -->
