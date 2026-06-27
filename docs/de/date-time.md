---
read_when:
    - Sie ändern, wie Zeitstempel dem Modell oder Benutzern angezeigt werden
    - Sie debuggen die Zeitformatierung in Nachrichten oder in der Ausgabe des Systemprompts
summary: Datums- und Uhrzeitverarbeitung über Envelopes, Prompts, Tools und Connectors hinweg
title: Datum und Uhrzeit
x-i18n:
    generated_at: "2026-06-27T17:27:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw verwendet standardmäßig **host-lokale Zeit für Transport-Zeitstempel** und **die Benutzerzeitzone nur im System-Prompt**.
Provider-Zeitstempel bleiben erhalten, damit Tools ihre nativen Semantiken beibehalten (die aktuelle Zeit ist über `session_status` verfügbar).

## Nachrichten-Umschläge (standardmäßig lokal)

Eingehende Nachrichten werden mit einem Zeitstempel umschlossen (Sekundengenauigkeit):

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

Dieser Umschlag-Zeitstempel ist **standardmäßig host-lokal**, unabhängig von der Provider-Zeitzone.

Sie können dieses Verhalten überschreiben:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` verwendet UTC.
- `envelopeTimezone: "local"` verwendet die Host-Zeitzone.
- `envelopeTimezone: "user"` verwendet `agents.defaults.userTimezone` (fällt auf die Host-Zeitzone zurück).
- Verwenden Sie eine explizite IANA-Zeitzone (z. B. `"America/Chicago"`) für eine feste Zone.
- `envelopeTimestamp: "off"` entfernt absolute Zeitstempel aus Umschlag-Headern, direkten Agent-Prompt-Präfixen und eingebetteten Modell-Eingabepräfixen.
- `envelopeElapsed: "off"` entfernt Suffixe für verstrichene Zeit (der Stil `+2m`).

### Beispiele

**Lokal (Standard):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Benutzerzeitzone:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Verstrichene Zeit aktiviert:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## System-Prompt: aktuelles Datum und aktuelle Uhrzeit

Wenn die Benutzerzeitzone bekannt ist, enthält der System-Prompt einen eigenen
Abschnitt **Aktuelles Datum & aktuelle Uhrzeit** mit **nur der Zeitzone** (kein Uhrzeit-/Zeitformat),
damit Prompt-Caching stabil bleibt:

```
Time zone: America/Chicago
```

Wenn der Agent die aktuelle Uhrzeit benötigt, verwenden Sie das Tool `session_status`; die Statuskarte enthält eine Zeitstempelzeile.

## Systemereignis-Zeilen (standardmäßig lokal)

In den Agent-Kontext eingefügte Systemereignisse in der Warteschlange erhalten einen Zeitstempel als Präfix, wobei dieselbe Zeitzonenauswahl wie bei Nachrichten-Umschlägen verwendet wird (Standard: host-lokal).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Benutzerzeitzone + Format konfigurieren

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

- `userTimezone` legt die **benutzerlokale Zeitzone** für den Prompt-Kontext fest.
- `timeFormat` steuert die **12h-/24h-Anzeige** im Prompt. `auto` folgt den Betriebssystemeinstellungen.

## Zeitformaterkennung (auto)

Wenn `timeFormat: "auto"` gesetzt ist, prüft OpenClaw die Betriebssystemeinstellung (macOS/Windows)
und fällt auf die Locale-Formatierung zurück. Der erkannte Wert wird **pro Prozess zwischengespeichert**,
um wiederholte Systemaufrufe zu vermeiden.

## Tool-Payloads + Konnektoren (rohe Provider-Zeit + normalisierte Felder)

Kanal-Tools geben **Provider-native Zeitstempel** zurück und fügen aus Konsistenzgründen normalisierte Felder hinzu:

- `timestampMs`: Epoch-Millisekunden (UTC)
- `timestampUtc`: ISO-8601-UTC-Zeichenfolge

Rohe Provider-Felder bleiben erhalten, damit nichts verloren geht.

- Slack: epoch-artige Zeichenfolgen aus der API
- Discord: UTC-ISO-Zeitstempel
- Telegram/WhatsApp: providerspezifische numerische/ISO-Zeitstempel

Wenn Sie lokale Zeit benötigen, konvertieren Sie sie nachgelagert mit der bekannten Zeitzone.

## Zugehörige Dokumentation

- [System-Prompt](/de/concepts/system-prompt)
- [Zeitzonen](/de/concepts/timezone)
- [Nachrichten](/de/concepts/messages)
