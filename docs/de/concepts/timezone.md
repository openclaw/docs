---
read_when:
    - Sie möchten ein schnelles mentales Modell für den Umgang mit Zeitzonen
    - Sie entscheiden, wo Sie eine Zeitzone festlegen oder überschreiben
summary: Wo Zeitzonen in OpenClaw vorkommen — Umschläge, Tool-Payloads, System-Prompt
title: Zeitzonen
x-i18n:
    generated_at: "2026-05-06T06:46:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standardisiert Zeitstempel, sodass das Modell eine **einzige Referenzzeit** statt einer Mischung aus Provider-lokalen Uhren sieht. Es gibt drei Oberflächen, auf denen Zeitzonen erscheinen, jeweils mit eigenem Zweck:

## Drei Zeitzonen-Oberflächen

| Oberfläche        | Was sie zeigt                                                                                           | Standard                              | Konfiguriert über                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Nachrichten-Envelopes | Umschließt eingehende Kanalnachrichten: `[Signal +1555 2026-01-18 00:19 PST] hello`                     | Host-lokal                            | `agents.defaults.envelopeTimezone`                     |
| Tool-Payloads     | Channel-Tools im Stil von `readMessages` geben rohe Provider-Zeit + normalisierte `timestampMs` / `timestampUtc` zurück | UTC-Felder immer vorhanden            | Nicht konfigurierbar — erhält Provider-native Zeitstempel |
| System-Prompt     | Ein kleiner `Current Date & Time`-Block mit **nur der Zeitzone** (kein Uhrzeitwert, für Cache-Stabilität) | Host-Zeitzone, wenn `userTimezone` nicht gesetzt ist | `agents.defaults.userTimezone`                         |

Der System-Prompt lässt die Live-Uhr bewusst weg, um Prompt-Caching über Turns hinweg stabil zu halten. Wenn der Agent die aktuelle Uhrzeit benötigt, ruft er `session_status` auf.

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

Wenn `userTimezone` nicht gesetzt ist, löst OpenClaw die Host-Zeitzone zur Laufzeit auf (kein Schreiben in die Konfiguration). `agents.defaults.timeFormat` (`auto` | `12` | `24`) steuert die 12h-/24h-Darstellung in Envelopes und nachgelagerten Oberflächen, nicht im System-Prompt-Abschnitt.

## Wann überschrieben werden sollte

- **Verwenden Sie UTC-Envelopes** (`envelopeTimezone: "utc"`), wenn Sie stabile Zeitstempel über Hosts in verschiedenen Regionen hinweg wünschen oder wenn UTC-ausgerichtete Logs mit Diagnoseausgaben übereinstimmen sollen.
- **Verwenden Sie eine feste IANA-Zone** (z. B. `"Europe/Vienna"`), wenn sich der Gateway-Host in einer Zone befindet, der Benutzer aber in einer anderen, und Sie möchten, dass Envelopes unabhängig von einer Host-Migration in der Zeitzone des Benutzers gelesen werden.
- **Setzen Sie `envelopeTimestamp: "off"`** für tokenarme Envelopes, wenn Zeitstempelkontext für die Unterhaltung nicht nützlich ist.

Die vollständige Verhaltensreferenz, Beispiele pro Provider und Formatierung verstrichener Zeit finden Sie unter [Datum & Uhrzeit](/de/date-time).

## Verwandt

- [Datum & Uhrzeit](/de/date-time) — vollständiges Verhalten und Beispiele für Envelopes, Tools und Prompt.
- [Heartbeat](/de/gateway/heartbeat) — aktive Stunden verwenden die Zeitzone für die Planung.
- [Cron Jobs](/de/automation/cron-jobs) — Cron-Ausdrücke verwenden die Zeitzone für die Planung.
