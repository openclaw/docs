---
read_when:
    - Verhalten oder Standardwerte für Voice-Wake-Words ändern
    - Neue Node-Plattformen hinzufügen, die Wake-Word-Synchronisierung benötigen
summary: Globale Voice-Wake-Words (Gateway-eigen) und wie sie über Nodes hinweg synchronisiert werden
title: Voice-Wake
x-i18n:
    generated_at: "2026-04-26T11:34:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw behandelt **Wake-Words als eine einzige globale Liste**, die dem **Gateway** gehört.

- Es gibt **keine benutzerdefinierten Wake-Words pro Node**.
- **Jede Node/App-UI kann** die Liste bearbeiten; Änderungen werden vom Gateway gespeichert und an alle übertragen.
- macOS und iOS behalten lokale Umschalter für **Voice Wake aktiviert/deaktiviert** bei (lokale UX + Berechtigungen unterscheiden sich).
- Android hält Voice Wake derzeit deaktiviert und verwendet im Tab „Voice“ einen manuellen Mikrofonablauf.

## Speicherung (Gateway-Host)

Wake-Words werden auf dem Gateway-Rechner gespeichert unter:

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

- Trigger werden normalisiert (Leerraum entfernt, leere Einträge verworfen). Leere Listen fallen auf Standardwerte zurück.
- Aus Sicherheitsgründen werden Limits erzwungen (Obergrenzen für Anzahl/Länge).

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

- `voicewake.changed` mit Payload `{ triggers: string[] }`
- `voicewake.routing.changed` mit Payload `{ config: VoiceWakeRoutingConfig }`

Wer es erhält:

- Alle WebSocket-Clients (macOS-App, WebChat usw.)
- Alle verbundenen Nodes (iOS/Android) sowie auch beim Verbinden einer Node als initialer Push des „aktuellen Zustands“.

## Client-Verhalten

### macOS-App

- Verwendet die globale Liste, um Trigger von `VoiceWakeRuntime` zu steuern.
- Das Bearbeiten von „Trigger words“ in den Voice-Wake-Einstellungen ruft `voicewake.set` auf und verlässt sich dann auf den Broadcast, um andere Clients synchron zu halten.

### iOS-Node

- Verwendet die globale Liste für die Trigger-Erkennung von `VoiceWakeManager`.
- Das Bearbeiten von Wake Words in den Einstellungen ruft `voicewake.set` auf (über das Gateway-WS) und hält außerdem die lokale Wake-Word-Erkennung reaktionsfähig.

### Android-Node

- Voice Wake ist derzeit in der Android-Laufzeit/in den Einstellungen deaktiviert.
- Android-Voice verwendet stattdessen im Tab „Voice“ eine manuelle Mikrofonaufnahme anstelle von Wake-Word-Triggern.

## Verwandte Inhalte

- [Talk-Mode](/de/nodes/talk)
- [Audio und Sprachnotizen](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
