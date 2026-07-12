---
summary: Weiterleitung zu /plugins/sdk-channel-outbound
title: API für Kanalnachrichten
x-i18n:
    generated_at: "2026-07-12T15:47:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Diese Seite wurde zu [API für ausgehende Kanäle](/de/plugins/sdk-channel-outbound) verschoben.

`openclaw/plugin-sdk/channel-message` und
`openclaw/plugin-sdk/channel-message-runtime` bleiben veraltete Kompatibilitäts-
Unterpfade für ältere Plugins; beide sind schlanke Aliasse für den gemeinsamen
Kern der Kanalnachrichten. Neue Kanal-Plugins sollten
`openclaw/plugin-sdk/channel-outbound` für Nachrichtenlebenszyklus, Empfangsbestätigungen,
dauerhaften Versand und Hilfsfunktionen für die Live-Vorschau verwenden, anstatt den
veralteten Unterpfaden neue Hilfsfunktionen hinzuzufügen.

Entfernungsplan: Diese Aliasse bleiben während des Migrationszeitraums für externe Plugins
erhalten und werden anschließend bei der nächsten umfassenden SDK-Bereinigung entfernt,
nachdem die Aufrufer zu `channel-outbound` migriert wurden.
