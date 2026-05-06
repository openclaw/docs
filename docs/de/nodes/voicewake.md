---
read_when:
    - Verhalten oder Standardeinstellungen von Sprach-Aktivierungswörtern ändern
    - Neue Node-Plattformen hinzufügen, die Wake-Word-Synchronisierung benötigen
summary: Globale Sprach-Wake-Words (Gateway-verwaltet) und wie sie über Nodes hinweg synchronisiert werden
title: Sprachaktivierung
x-i18n:
    generated_at: "2026-05-06T06:55:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw behandelt **Weckwörter als eine einzige globale Liste**, die dem **Gateway** gehört.

- Es gibt **keine benutzerdefinierten Weckwörter pro Node**.
- **Jede Node-/App-UI kann** die Liste bearbeiten; Änderungen werden vom Gateway gespeichert und an alle übertragen.
- macOS und iOS behalten lokale **Schalter zum Aktivieren/Deaktivieren von Sprachaktivierung** (lokale UX und Berechtigungen unterscheiden sich).
- Android lässt die Sprachaktivierung derzeit deaktiviert und verwendet im Sprache-Tab einen manuellen Mikrofonablauf.

## Speicherung (Gateway-Host)

Weckwörter werden auf dem Gateway-Rechner gespeichert unter:

- `~/.openclaw/settings/voicewake.json`

Form:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokoll

### Methoden

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` mit Parametern `{ triggers: string[] }` → `{ triggers: string[] }`

Hinweise:

- Auslöser werden normalisiert (gekürzt, leere Einträge entfernt). Leere Listen fallen auf Standardwerte zurück.
- Zur Sicherheit werden Grenzwerte durchgesetzt (Anzahl-/Längenbegrenzungen).

### Routing-Methoden (Auslöser → Ziel)

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
- Alle verbundenen Nodes (iOS/Android), außerdem beim Verbinden einer Node als initialer Push des „aktuellen Zustands“.

## Client-Verhalten

### macOS-App

- Verwendet die globale Liste, um `VoiceWakeRuntime`-Auslöser zu steuern.
- Das Bearbeiten von „Auslösewörtern“ in den Einstellungen für Sprachaktivierung ruft `voicewake.set` auf und verlässt sich anschließend auf die Übertragung, um andere Clients synchron zu halten.

### iOS-Node

- Verwendet die globale Liste für die Auslöserkennung von `VoiceWakeManager`.
- Das Bearbeiten von Weckwörtern in den Einstellungen ruft `voicewake.set` (über das Gateway-WS) auf und hält außerdem die lokale Weckworterkennung reaktionsfähig.

### Android-Node

- Die Sprachaktivierung ist derzeit in der Android-Laufzeitumgebung und den Einstellungen deaktiviert.
- Android-Sprache verwendet im Sprache-Tab die manuelle Mikrofonaufnahme anstelle von Weckwort-Auslösern.

## Verwandt

- [Sprechmodus](/de/nodes/talk)
- [Audio- und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
