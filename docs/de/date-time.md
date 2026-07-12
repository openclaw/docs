---
read_when:
    - Sie ändern, wie Zeitstempel dem Modell oder den Benutzern angezeigt werden
    - Sie debuggen die Zeitformatierung in Nachrichten oder in der Ausgabe des System-Prompts
summary: Datums- und Zeitverarbeitung in Envelopes, Prompts, Tools und Konnektoren
title: Datum und Uhrzeit
x-i18n:
    generated_at: "2026-07-12T01:35:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw verwendet **die lokale Zeit des Hosts für Transport-Zeitstempel** und nimmt **nur die Zeitzone** in den System-Prompt auf.
Provider-Zeitstempel bleiben erhalten, damit Tools ihre nativen Semantiken beibehalten. Wenn der Agent die aktuelle
Uhrzeit benötigt, führt er das Tool `session_status` aus.

## Nachrichtenumschläge (standardmäßig lokal)

Eingehende Nachrichten werden mit einem Wochentag und einem sekundengenauen Zeitstempel umschlossen:

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] Nachrichtentext
```

Der Zeitstempel des Umschlags ist **standardmäßig lokal zum Host**, unabhängig von der Zeitzone des Providers.
Überschreiben Sie dies unter `agents.defaults`:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA-Zeitzone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

| Schlüssel            | Werte                                                | Verhalten                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`   | `local` (Standard), `utc`, `user`, expliziter IANA-Name | `user` verwendet `agents.defaults.userTimezone` (Zeitzone des Hosts, wenn nicht festgelegt). Ein expliziter IANA-Name (z. B. `"America/Chicago"`) legt eine feste Zone fest; unbekannte Namen fallen auf UTC zurück. |
| `envelopeTimestamp`  | `on` (Standard), `off`                               | `off` entfernt absolute Zeitstempel aus Umschlag-Kopfzeilen, direkten Präfixen des Agenten-Prompts und eingebetteten Präfixen der Modelleingabe.                                                    |
| `envelopeElapsed`    | `on` (Standard), `off`                               | `off` entfernt das seit der vorherigen Nachricht in der Sitzung angezeigte Suffix für die verstrichene Zeit (im Format `+30s` / `+2m`).                                                            |

### Beispiele

**Lokal (Standard):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] Hallo
```

**Zeitzone des Benutzers:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] Hallo
```

**Verstrichene Zeit mit `envelopeTimezone: "utc"`:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] Folgenachricht
```

## System-Prompt: aktuelles Datum und aktuelle Uhrzeit

Der System-Prompt enthält einen Abschnitt **Aktuelles Datum und aktuelle Uhrzeit**, der **nur die Zeitzone**
enthält (keine Uhrzeit und kein Zeitformat), damit das Prompt-Caching stabil bleibt:

```
Zeitzone: America/Chicago
```

Die Zone entspricht `agents.defaults.userTimezone`, wenn dies konfiguriert ist, andernfalls der Zeitzone des Hosts.
Der Prompt weist den Agenten außerdem an, das Tool `session_status` auszuführen, wenn er das aktuelle
Datum, die aktuelle Uhrzeit oder den Wochentag benötigt.

## Systemereigniszeilen (standardmäßig lokal)

Systemereignisse in der Warteschlange, die in den Agentenkontext eingefügt werden, erhalten als Präfix einen Zeitstempel mit derselben
`envelopeTimezone`-Auswahl wie Nachrichtenumschläge (Standard: lokal zum Host).

```
System: [2026-01-12 12:19:17 PST] Modell gewechselt.
```

### Zeitzone des Benutzers und Format konfigurieren

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` legt die **lokale Zeitzone des Benutzers** für den Prompt-Kontext fest (und für `envelopeTimezone: "user"`).
- `timeFormat` steuert die **12-/24-Stunden-Anzeige** für Uhrzeiten in Prompts. `auto` folgt den Einstellungen des Betriebssystems.

## Erkennung des Zeitformats (automatisch)

Wenn `timeFormat: "auto"` festgelegt ist, prüft OpenClaw die Betriebssystemeinstellung (macOS und Windows)
und greift andernfalls auf die Formatierung des Gebietsschemas zurück. Der erkannte Wert wird **prozessbezogen zwischengespeichert**,
um wiederholte Systemaufrufe zu vermeiden.

## Tool-Nutzdaten und Konnektoren (unveränderte Provider-Zeit und normalisierte Felder)

Kanal-Tools geben **Provider-native Zeitstempel** zurück und fügen zur Vereinheitlichung normalisierte Felder hinzu:

- `timestampMs`: Epochenzeit in Millisekunden (UTC)
- `timestampUtc`: UTC-Zeichenfolge nach ISO 8601

Die unveränderten Provider-Felder bleiben erhalten, damit keine Informationen verloren gehen.

- Discord: UTC-Zeitstempel nach ISO
- Slack: epochenähnliche Zeichenfolgen aus der API
- Telegram/WhatsApp: Provider-spezifische numerische Zeitstempel oder ISO-Zeitstempel

Wenn Sie die lokale Zeit benötigen, konvertieren Sie sie nachgelagert mithilfe der bekannten Zeitzone.

## Verwandte Dokumentation

- [System-Prompt](/de/concepts/system-prompt)
- [Zeitzonen](/de/concepts/timezone)
- [Nachrichten](/de/concepts/messages)
