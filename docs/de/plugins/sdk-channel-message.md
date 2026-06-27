---
summary: Weiterleitung zu /plugins/sdk-channel-outbound
title: Kanalnachrichten-API
x-i18n:
    generated_at: "2026-06-27T17:57:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Diese Seite wurde nach [Channel-Outbound-API](/de/plugins/sdk-channel-outbound) verschoben.

`openclaw/plugin-sdk/channel-message` und
`openclaw/plugin-sdk/channel-message-runtime` bleiben veraltete Kompatibilitäts-Subpfade
für ältere Plugins. Neue Channel-Plugins sollten
`openclaw/plugin-sdk/channel-outbound` für Lebenszyklus von Nachrichten, Empfang, dauerhaften
Versand und Live-Vorschau-Helfer verwenden. Die veralteten Subpfade sind dünne Aliase über
den gemeinsamen Channel-Message-Kern und die fokussierten Inbound-/Outbound-SDK-Oberflächen;
fügen Sie dort keine neuen Helfer hinzu.

Entfernungsplan: Behalten Sie diese Aliase während des Migrationsfensters für externe Plugins bei,
entfernen Sie sie dann in der nächsten größeren SDK-Bereinigung, nachdem Aufrufer zu
`channel-outbound` gewechselt sind.
