---
summary: Weiterleitung zu /plugins/sdk-channel-outbound
title: Kanalnachrichten-API
x-i18n:
    generated_at: "2026-07-24T04:05:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bf0d607bd3287233cbb1fe47c15958bf57a81267ae1e37e45a1881f56e1370cb
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Diese Seite wurde zu [API für ausgehende Kanalnachrichten](/de/plugins/sdk-channel-outbound) verschoben.

`openclaw/plugin-sdk/channel-message` bleibt ein veralteter Kompatibilitäts-
Unterpfad für ältere Plugins. Neue Kanal-Plugins sollten
`openclaw/plugin-sdk/channel-outbound` für den Nachrichtenlebenszyklus, Empfangsbestätigungen,
dauerhaften Versand und Hilfsfunktionen für die Live-Vorschau verwenden, statt dem
veralteten Unterpfad neue Hilfsfunktionen hinzuzufügen.

Entfernungsplan: Diese Aliasse bleiben während des Migrations-
zeitraums für externe Plugins erhalten und werden anschließend bei der nächsten großen SDK-Bereinigung entfernt, nachdem die Aufrufer
zu `channel-outbound` migriert wurden.
