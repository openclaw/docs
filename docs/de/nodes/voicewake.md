---
read_when:
    - Verhalten oder Standardwerte für Sprachaktivierungswörter ändern
    - Hinzufügen neuer Node-Plattformen, die eine Aktivierungswort-Synchronisierung benötigen
summary: Globale Sprachaktivierungswörter (vom Gateway verwaltet) und ihre Synchronisierung zwischen Nodes
title: Sprachaktivierung
x-i18n:
    generated_at: "2026-07-24T04:29:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

Aktivierungswörter sind **eine einzige globale Liste, die dem Gateway gehört** — es gibt keine benutzerdefinierten Listen pro Node. Jede Node- oder App-Benutzeroberfläche kann die Liste bearbeiten; das Gateway speichert die Änderung dauerhaft und überträgt sie an alle verbundenen Clients.

- **macOS**: lokaler Schalter zum Aktivieren/Deaktivieren von Voice Wake. Erfordert macOS 26+; Laufzeit-/PTT-Details finden Sie unter [Sprachaktivierung (macOS)](/de/platforms/mac/voicewake).
- **iOS**: lokaler Schalter zum Aktivieren/Deaktivieren von Voice Wake in den Einstellungen.
- **Android**: lokaler Schalter zum Aktivieren/Deaktivieren von Voice Wake und Editor für Aktivierungswörter unter Settings → Voice. Erfordert die geräteinterne Spracherkennung von Android.

## Speicherung

Aktivierungswörter und Routingregeln befinden sich in der Gateway-Zustandsdatenbank, standardmäßig `~/.openclaw/state/openclaw.sqlite` (überschreibbar mit `OPENCLAW_STATE_DIR`), in den Tabellen `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. Die alten Dateien `settings/voicewake.json` und `settings/voicewake-routing.json` dienen ausschließlich als Migrationseingaben für `openclaw doctor --fix` — die Laufzeit liest sie niemals.

## Protokoll

### Auslöserliste

| Methode         | Parameter                | Ergebnis                 |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | keine                    | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normalisiert die Eingabe: entfernt Leerraum am Anfang und Ende, verwirft leere Einträge, behält höchstens 32 Auslöser bei und kürzt jeden auf 64 UTF-16-Codeeinheiten, ohne Surrogatpaare zu trennen. Bei einem leeren Ergebnis werden die integrierten Standardwerte verwendet (`openclaw`, `claude`, `computer`).

### Routing (Auslöser zum Ziel)

| Methode                 | Parameter                            | Ergebnis                             |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | keine                                | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Jede Route `target` unterstützt genau eine der folgenden Optionen:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Grenzwerte: höchstens 32 Routen, Auslösertext mit höchstens 64 Zeichen. Routenauslöser werden für den Abgleich und die Duplikaterkennung normalisiert, indem sie in Kleinbuchstaben umgewandelt, führende und abschließende Satzzeichen von jedem Wort entfernt und Leerräume zusammengefasst werden (`"Hey, Bot!!"` und `"hey bot"` stimmen überein und gelten als Duplikate) — dies ist eine strengere Normalisierung als das oben für die globale Auslöserliste verwendete einfache Entfernen von Leerraum am Anfang und Ende.

### Ereignisse

| Ereignis                    | Nutzdaten                            |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Beide werden an jeden WebSocket-Client mit Leseberechtigung (macOS-App, WebChat und ähnliche) sowie an jede verbundene Node übertragen. Eine Node erhält beide außerdem direkt nach dem Verbindungsaufbau als initiale Snapshot-Übertragung.

## Clientverhalten

- **macOS**: ruft `voicewake.set`/`voicewake.get` auf und wartet auf `voicewake.changed`, um mit anderen Clients synchron zu bleiben.
- **iOS**: ruft `voicewake.set`/`voicewake.get` auf und wartet auf `voicewake.changed`, damit die lokale Erkennung von Aktivierungswörtern reaktionsfähig bleibt.
- **Android**: ruft `voicewake.set`/`voicewake.get` auf, wartet auf `voicewake.changed` und kündigt im aktivierten Zustand `voiceWake` an. Die Erkennung erfolgt weiterhin ausschließlich auf dem Gerät und im Vordergrund; sie wird pausiert, während Talk, manuelles Diktieren, die Aufnahme einer Sprachnachricht oder die Sprachausgabe von Nachrichten auf das Audio zugreift.

## Verwandte Themen

- [Talk-Modus](/de/nodes/talk)
- [Audio und Sprachnachrichten](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
