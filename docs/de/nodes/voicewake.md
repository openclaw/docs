---
read_when:
    - Verhalten oder Standardwerte für Sprachaktivierungswörter ändern
    - Neue Node-Plattformen hinzufügen, die eine Aktivierungswort-Synchronisierung benötigen
summary: Globale Sprachaktivierungswörter (vom Gateway verwaltet) und ihre Synchronisierung zwischen Nodes
title: Sprachaktivierung
x-i18n:
    generated_at: "2026-07-16T13:12:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

Weckwörter sind **eine einzige globale Liste im Besitz des Gateway** – es gibt keine benutzerdefinierten Listen pro Node. Jede Node- oder App-Benutzeroberfläche kann die Liste bearbeiten; das Gateway speichert die Änderung dauerhaft und überträgt sie an alle verbundenen Clients.

- **macOS**: lokaler Schalter zum Aktivieren/Deaktivieren von Voice Wake. Erfordert macOS 26+; Laufzeit-/PTT-Details finden Sie unter [Sprachaktivierung (macOS)](/de/platforms/mac/voicewake).
- **iOS**: lokaler Schalter zum Aktivieren/Deaktivieren von Voice Wake in den Einstellungen.
- **Android**: lokaler Schalter zum Aktivieren/Deaktivieren von Voice Wake und Weckwort-Editor unter Settings → Voice. Erfordert die geräteinterne Spracherkennung von Android.

## Speicherung

Weckwörter und Routingregeln befinden sich in der Zustandsdatenbank des Gateway, standardmäßig `~/.openclaw/state/openclaw.sqlite` (mit `OPENCLAW_STATE_DIR` überschreibbar), in den Tabellen `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. Die veralteten `settings/voicewake.json` und `settings/voicewake-routing.json` dienen ausschließlich als Migrationseingaben für `openclaw doctor --fix` – die Laufzeit liest sie niemals.

## Protokoll

### Auslöserliste

| Methode          | Parameter                | Ergebnis                 |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | keine                    | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normalisiert die Eingabe: Leerraum wird entfernt, leere Einträge werden verworfen, höchstens 32 Auslöser werden beibehalten und jeder wird auf 64 UTF-16-Codeeinheiten gekürzt, ohne Surrogatpaare zu trennen. Bei einem leeren Ergebnis werden die integrierten Standardwerte verwendet (`openclaw`, `claude`, `computer`).

### Routing (Auslöser zu Ziel)

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

Jedes Routen-`target` unterstützt genau eine der folgenden Optionen:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Grenzwerte: höchstens 32 Routen, Auslösertext mit höchstens 64 Zeichen. Routenauslöser werden für den Abgleich und die Duplikaterkennung normalisiert, indem sie in Kleinbuchstaben umgewandelt werden, führende und nachgestellte Satzzeichen aus jedem Wort entfernt werden und Leerraum zusammengefasst wird (`"Hey, Bot!!"` und `"hey bot"` stimmen überein und gelten als Duplikate) – dies ist eine strengere Normalisierung als das einfache Entfernen von Leerraum bei der obigen globalen Auslöserliste.

### Ereignisse

| Ereignis                    | Nutzdaten                            |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Beide werden an jeden WebSocket-Client mit Leseberechtigung (macOS-App, WebChat und ähnliche) sowie an jede verbundene Node übertragen. Eine Node erhält beide außerdem unmittelbar nach dem Verbindungsaufbau als initiale Snapshot-Übertragung.

## Clientverhalten

- **macOS**: ruft `voicewake.set`/`voicewake.get` auf und lauscht auf `voicewake.changed`, um mit anderen Clients synchron zu bleiben.
- **iOS**: ruft `voicewake.set`/`voicewake.get` auf und lauscht auf `voicewake.changed`, damit die lokale Weckworterkennung reaktionsschnell bleibt.
- **Android**: ruft `voicewake.set`/`voicewake.get` auf, lauscht auf `voicewake.changed` und kündigt im aktivierten Zustand `voiceWake` an. Die Erkennung bleibt auf dem Gerät und ist nur im Vordergrund aktiv; sie wird pausiert, während Talk, manuelles Diktieren, die Aufnahme einer Sprachnachricht oder die Sprachausgabe von Nachrichten auf die Audioressourcen zugreift.

## Verwandte Themen

- [Talk-Modus](/de/nodes/talk)
- [Audio und Sprachnachrichten](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
