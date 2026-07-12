---
read_when:
    - Verhalten oder Standardeinstellungen für Sprachaktivierungswörter ändern
    - Hinzufügen neuer Node-Plattformen, die eine Aktivierungswort-Synchronisierung benötigen
summary: Globale Sprachaktivierungswörter (vom Gateway verwaltet) und ihre Synchronisierung zwischen Nodes
title: Sprachaktivierung
x-i18n:
    generated_at: "2026-07-12T15:37:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8a8c7a8bb2ee5bbc57d9141cd8f2176246cc61952b0ed42257f83af2c777427
    source_path: nodes/voicewake.md
    workflow: 16
---

Aktivierungswörter sind **eine globale, vom Gateway verwaltete Liste** — es gibt keine benutzerdefinierten Listen pro Node. Jede Node- oder App-Benutzeroberfläche kann die Liste bearbeiten; das Gateway speichert die Änderung dauerhaft und überträgt sie an alle verbundenen Clients.

- **macOS**: lokaler Schalter zum Aktivieren/Deaktivieren von Voice Wake. Erfordert macOS 26+; Laufzeit-/PTT-Details finden Sie unter [Sprachaktivierung (macOS)](/de/platforms/mac/voicewake).
- **iOS**: lokaler Schalter zum Aktivieren/Deaktivieren von Voice Wake in den Einstellungen.
- **Android**: implementiert Voice Wake nicht. Der Tab „Voice“ verwendet eine manuelle Mikrofonaufnahme anstelle von Aktivierungswort-Triggern.

## Speicherung

Aktivierungswörter und Routingregeln befinden sich in der Zustandsdatenbank des Gateways, standardmäßig `~/.openclaw/state/openclaw.sqlite` (überschreibbar mit `OPENCLAW_STATE_DIR`), in den Tabellen `voicewake_triggers`, `voicewake_routing_config` und `voicewake_routing_routes`. Die veralteten Dateien `settings/voicewake.json` und `settings/voicewake-routing.json` dienen ausschließlich als Migrationseingaben für `openclaw doctor --fix` — die Laufzeit liest sie niemals.

## Protokoll

### Triggerliste

| Methode         | Parameter                | Ergebnis                 |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | keine                    | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normalisiert die Eingabe: Leerraum wird entfernt, leere Einträge werden verworfen, höchstens 32 Trigger werden beibehalten und jeder Trigger wird auf 64 UTF-16-Codeeinheiten gekürzt, ohne Surrogatpaare zu trennen. Bei einem leeren Ergebnis werden die integrierten Standardwerte (`openclaw`, `claude`, `computer`) verwendet.

### Routing (vom Trigger zum Ziel)

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

Jedes `target` einer Route unterstützt genau eine der folgenden Formen:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Grenzwerte: höchstens 32 Routen, Triggertext mit höchstens 64 Zeichen. Routentrigger werden für den Abgleich und die Erkennung von Duplikaten normalisiert, indem sie in Kleinbuchstaben umgewandelt, führende und nachgestellte Satzzeichen jedes Worts entfernt und Leerräume zusammengefasst werden (`"Hey, Bot!!"` und `"hey bot"` stimmen überein und gelten als Duplikate) — dies ist eine strengere Normalisierung als das oben für die globale Triggerliste verwendete einfache Entfernen von Leerraum.

### Ereignisse

| Ereignis                    | Nutzdaten                            |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Beide werden an jeden WebSocket-Client mit Leseberechtigung (macOS-App, WebChat und ähnliche) sowie an jede verbundene Node übertragen. Eine Node erhält beide außerdem direkt nach dem Verbindungsaufbau als initiale Momentaufnahme.

## Clientverhalten

- **macOS**: ruft `voicewake.set`/`voicewake.get` auf und lauscht auf `voicewake.changed`, um mit anderen Clients synchron zu bleiben.
- **iOS**: ruft `voicewake.set`/`voicewake.get` auf und lauscht auf `voicewake.changed`, damit die lokale Erkennung von Aktivierungswörtern reaktionsfähig bleibt.
- **Android**: gibt die Fähigkeit `voiceWake` nicht bekannt und verarbeitet keine Aktualisierungen der Aktivierungswörter.

## Verwandte Themen

- [Sprechmodus](/de/nodes/talk)
- [Audio- und Sprachnachrichten](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
