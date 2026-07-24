---
read_when:
    - Sie installieren, konfigurieren oder überprüfen das clickclack-Plugin
summary: Fügt die Clickclack-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.
title: Clickclack-Plugin
x-i18n:
    generated_at: "2026-07-24T05:14:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fcb39341009946dc38a12cc24496e65fd704ed3f2f9aff44bb2dd29fdedaef26
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Clickclack-Plugin

Fügt die Clickclack-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

## Distribution

- Paket: `@openclaw/clickclack`
- Installationsweg: npm; ClawHub: `clawhub:@openclaw/clickclack`

## Oberfläche

Kanäle: `clickclack`; Verträge: `tools`

<!-- openclaw-plugin-reference:manual-start -->

Das Plugin kann optional für jede OpenClaw-Sitzung einen mit dem Lebenszyklus synchronisierten ClickClack-Kanal erstellen. Verwaltete Diskussionskanäle verwenden zur Beobachtung und Weiterleitung eine Seitensitzung desselben Agenten, während die verknüpfte Hauptsitzung ein nur für Abrufe vorgesehenes `discussion`-Tool erhält. Informationen zu den Anforderungen an die Konfiguration und die Sichtbarkeit des Sitzungstools finden Sie unter [ClickClack-Sitzungsdiskussionen](/de/channels/clickclack#session-discussions).

<!-- openclaw-plugin-reference:manual-end -->

## Zugehörige Dokumentation

- [clickclack](/de/channels/clickclack)
