---
read_when:
    - Sie möchten ein schnelles mentales Modell für den Umgang mit Zeitzonen
    - Sie entscheiden, wo Sie eine Zeitzone festlegen oder überschreiben
summary: Wo Zeitzonen in OpenClaw vorkommen — Nachrichtenumschläge, Tool-Payloads, System-Prompt
title: Zeitzonen
x-i18n:
    generated_at: "2026-06-27T17:26:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standardisiert Zeitstempel, sodass das Modell eine **einzige Referenzzeit** sieht statt einer Mischung aus Provider-lokalen Uhren. Es gibt drei Oberflächen, auf denen Zeitzonen erscheinen, jeweils mit eigenem Zweck:

## Drei Zeitzonen-Oberflächen

| Oberfläche        | Was sie zeigt                                                                                              | Standard                              | Konfiguriert über                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| Nachrichtenhüllen | Umschließt eingehende Kanalnachrichten: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                 | Host-lokal                            | `agents.defaults.envelopeTimezone`                       |
| Tool-Nutzdaten    | Kanal-Tools im Stil von `readMessages` geben rohe Provider-Zeit + normalisiertes `timestampMs` / `timestampUtc` zurück | UTC-Felder immer vorhanden            | Nicht konfigurierbar — erhält Provider-native Zeitstempel |
| System-Prompt     | Ein kleiner Block `Current Date & Time` mit **nur der Zeitzone** (kein Uhrzeitwert, für Cache-Stabilität)  | Host-Zeitzone, wenn `userTimezone` nicht gesetzt ist | `agents.defaults.userTimezone`                           |

Der System-Prompt lässt die Live-Uhrzeit bewusst weg, um Prompt-Caching über Turns hinweg stabil zu halten. Wenn der Agent die aktuelle Uhrzeit benötigt, ruft er `session_status` auf.

## Benutzerzeitzone festlegen

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Wenn `userTimezone` nicht gesetzt ist, löst OpenClaw die Host-Zeitzone zur Laufzeit auf (ohne Konfiguration zu schreiben). `agents.defaults.timeFormat` (`auto` | `12` | `24`) steuert die 12h-/24h-Darstellung in Nachrichtenhüllen und nachgelagerten Oberflächen, nicht im System-Prompt-Abschnitt.

## Wann überschrieben werden sollte

- **Verwenden Sie UTC-Nachrichtenhüllen** (`envelopeTimezone: "utc"`), wenn Sie stabile Zeitstempel über Hosts in unterschiedlichen Regionen hinweg möchten oder wenn UTC-ausgerichtete Logs zur Diagnoseausgabe passen sollen.
- **Verwenden Sie eine feste IANA-Zone** (z. B. `"Europe/Vienna"`), wenn sich der Gateway-Host in einer Zone befindet, der Benutzer aber in einer anderen, und Sie möchten, dass Nachrichtenhüllen unabhängig von Host-Migrationen in der Zeitzone des Benutzers gelesen werden.
- **Setzen Sie `envelopeTimestamp: "off"`**, wenn Zeitstempelkontext für die Unterhaltung nicht nützlich ist. Dadurch werden absolute Zeitstempel aus Nachrichtenhüllen, direkten Agent-Prompt-Präfixen und eingebetteten Modell-Eingabepräfixen entfernt.

Die vollständige Verhaltensreferenz, Beispiele pro Provider und die Formatierung verstrichener Zeit finden Sie unter [Datum & Uhrzeit](/de/date-time).

## Verwandt

- [Datum & Uhrzeit](/de/date-time) — vollständiges Verhalten und Beispiele für Nachrichtenhüllen, Tools und Prompts.
- [Heartbeat](/de/gateway/heartbeat) — aktive Stunden verwenden die Zeitzone für die Planung.
- [Cron-Jobs](/de/automation/cron-jobs) — Cron-Ausdrücke verwenden die Zeitzone für die Planung.
