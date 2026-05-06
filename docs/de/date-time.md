---
read_when:
    - Sie ändern, wie Zeitstempel dem Modell oder den Nutzern angezeigt werden
    - Sie debuggen die Zeitformatierung in Nachrichten oder in der Ausgabe des Systemprompts
summary: Datums- und Uhrzeitbehandlung in Umschlägen, Eingabeaufforderungen, Werkzeugen und Konnektoren
title: Datum und Uhrzeit
x-i18n:
    generated_at: "2026-05-06T06:46:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw verwendet standardmäßig **hostlokale Zeit für Transport-Zeitstempel** und **die Benutzerzeitzone nur im System-Prompt**.
Provider-Zeitstempel bleiben erhalten, damit Tools ihre native Semantik behalten (die aktuelle Zeit ist über `session_status` verfügbar).

## Nachrichtenumschläge (standardmäßig lokal)

Eingehende Nachrichten werden mit einem Zeitstempel umschlossen (Minutengenauigkeit):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Dieser Umschlag-Zeitstempel ist **standardmäßig hostlokal**, unabhängig von der Provider-Zeitzone.

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
- `envelopeTimezone: "local"` verwendet die Zeitzone des Hosts.
- `envelopeTimezone: "user"` verwendet `agents.defaults.userTimezone` (fällt auf die Zeitzone des Hosts zurück).
- Verwenden Sie eine explizite IANA-Zeitzone (z. B. `"America/Chicago"`) für eine feste Zone.
- `envelopeTimestamp: "off"` entfernt absolute Zeitstempel aus Umschlag-Headern.
- `envelopeElapsed: "off"` entfernt Suffixe für verstrichene Zeit (der Stil `+2m`).

### Beispiele

**Lokal (Standard):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Benutzerzeitzone:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Verstrichene Zeit aktiviert:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## System-Prompt: aktuelles Datum und aktuelle Uhrzeit

Wenn die Benutzerzeitzone bekannt ist, enthält der System-Prompt einen eigenen
Abschnitt **Aktuelles Datum und aktuelle Uhrzeit** mit **nur der Zeitzone** (kein Uhr-/Zeitformat),
um das Prompt-Caching stabil zu halten:

```
Time zone: America/Chicago
```

Wenn der Agent die aktuelle Uhrzeit benötigt, verwenden Sie das Tool `session_status`; die Statuskarte enthält eine Zeitstempelzeile.

## Systemereigniszeilen (standardmäßig lokal)

In den Agent-Kontext eingefügte Systemereignisse in der Warteschlange erhalten als Präfix einen Zeitstempel mit derselben Zeitzonenauswahl wie Nachrichtenumschläge (Standard: hostlokal).

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

Bei `timeFormat: "auto"` prüft OpenClaw die Betriebssystemeinstellung (macOS/Windows) und fällt auf die Locale-Formatierung zurück. Der erkannte Wert wird **pro Prozess zwischengespeichert**, um wiederholte Systemaufrufe zu vermeiden.

## Tool-Payloads + Connectors (rohe Provider-Zeit + normalisierte Felder)

Channel-Tools geben **Provider-native Zeitstempel** zurück und fügen zur Konsistenz normalisierte Felder hinzu:

- `timestampMs`: Epoch-Millisekunden (UTC)
- `timestampUtc`: ISO-8601-UTC-String

Rohe Provider-Felder bleiben erhalten, damit nichts verloren geht.

- Slack: epochähnliche Strings aus der API
- Discord: UTC-ISO-Zeitstempel
- Telegram/WhatsApp: providerspezifische numerische/ISO-Zeitstempel

Wenn Sie lokale Zeit benötigen, konvertieren Sie sie nachgelagert mit der bekannten Zeitzone.

## Verwandte Dokumentation

- [System-Prompt](/de/concepts/system-prompt)
- [Zeitzonen](/de/concepts/timezone)
- [Nachrichten](/de/concepts/messages)
