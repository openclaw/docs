---
read_when:
    - Sie installieren, konfigurieren oder prüfen das opencode-Plugin.
summary: Fügt OpenClaw Unterstützung für den OpenCode-Modell-Provider hinzu.
title: OpenCode-Plugin
x-i18n:
    generated_at: "2026-07-24T04:48:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# OpenCode-Plugin

Fügt OpenClaw Unterstützung für den OpenCode-Modell-Provider hinzu.

## Distribution

- Paket: `@openclaw/opencode-provider`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

Provider: `opencode`; Verträge: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Native Sitzungen

OpenClaw erkennt die `opencode`-CLI automatisch auf dem Gateway und gekoppelten Nodes. Gespeicherte
Sitzungen werden anschließend in der Sitzungsseitenleiste in der Gruppe **OpenCode** angezeigt, mit schreibgeschütztem
Durchsuchen der Transkripte über die offiziellen Befehle `opencode --pure db ... --format json`
und `opencode --pure export`. Die eingeschränkte Umgebung und der Modus `--pure`
verhindern, dass beim Durchsuchen des Katalogs Projekt-Plugins geladen oder nicht zugehörige
Gateway-Anmeldedaten übernommen werden.

Deaktivieren Sie **OpenCode Session Catalog** unter **Config > Plugins > OpenCode**, um
die Erkennung zu deaktivieren. Sie ist standardmäßig aktiviert.

<!-- openclaw-plugin-reference:manual-end -->

## Verwandte Dokumentation

- [opencode](/de/providers/opencode)
