---
read_when:
    - Verhalten oder Standardeinstellungen von Sprach-Aktivierungswörtern ändern
    - Hinzufügen neuer Node-Plattformen, die Wake-Word-Synchronisierung benötigen
summary: Globale Sprach-Aktivierungswörter (Gateway-verwaltet) und wie sie über Nodes hinweg synchronisiert werden
title: Sprachaktivierung
x-i18n:
    generated_at: "2026-06-27T17:40:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw behandelt **Wake Words als eine einzige globale Liste**, die dem **Gateway** gehört.

- Es gibt **keine benutzerdefinierten Wake Words pro Node**.
- **Jede Node-/App-UI kann** die Liste bearbeiten; Änderungen werden vom Gateway gespeichert und an alle übertragen.
- macOS und iOS behalten lokale Schalter zum **Aktivieren/Deaktivieren von Voice Wake** bei (lokale UX und Berechtigungen unterscheiden sich).
- Android lässt Voice Wake derzeit deaktiviert und verwendet einen manuellen Mikrofonablauf im Voice-Tab.

## Speicherung (Gateway-Host)

Wake Words und Routing-Regeln werden in der Gateway-Zustandsdatenbank gespeichert:

- `~/.openclaw/state/openclaw.sqlite`

Die aktiven Tabellen sind:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

Alte Dateien `settings/voicewake.json` und `settings/voicewake-routing.json` sind
nur Eingaben für Doctor-Migrationen; zur Laufzeit werden die SQLite-Tabellen gelesen und geschrieben.

## Protokoll

### Methoden

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` mit Parametern `{ triggers: string[] }` → `{ triggers: string[] }`

Hinweise:

- Trigger werden normalisiert (gekürzt, leere Einträge entfernt). Leere Listen fallen auf Standardwerte zurück.
- Grenzwerte werden aus Sicherheitsgründen erzwungen (Obergrenzen für Anzahl/Länge).

### Routing-Methoden (Trigger → Ziel)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` mit Parametern `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Form von `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Routenziele unterstützen genau eines von:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Ereignisse

- `voicewake.changed`-Payload `{ triggers: string[] }`
- `voicewake.routing.changed`-Payload `{ config: VoiceWakeRoutingConfig }`

Wer sie empfängt:

- Alle WebSocket-Clients (macOS-App, WebChat usw.)
- Alle verbundenen Nodes (iOS/Android), außerdem beim Verbinden einer Node als anfänglicher Push des „aktuellen Zustands“.

## Client-Verhalten

### macOS-App

- Verwendet die globale Liste, um `VoiceWakeRuntime`-Trigger zu steuern.
- Das Bearbeiten von „Trigger words“ in den Voice-Wake-Einstellungen ruft `voicewake.set` auf und verlässt sich anschließend auf die Übertragung, um andere Clients synchron zu halten.

### iOS-Node

- Verwendet die globale Liste für die Trigger-Erkennung von `VoiceWakeManager`.
- Das Bearbeiten von Wake Words in den Einstellungen ruft `voicewake.set` auf (über den Gateway-WS) und hält außerdem die lokale Wake-Word-Erkennung reaktionsschnell.

### Android-Node

- Voice Wake ist derzeit in Android-Laufzeit/Einstellungen deaktiviert.
- Android-Voice verwendet im Voice-Tab eine manuelle Mikrofonaufnahme statt Wake-Word-Triggern.

## Verwandt

- [Sprechmodus](/de/nodes/talk)
- [Audio und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
