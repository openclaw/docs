---
read_when:
    - Sie möchten ein schnelles mentales Modell für den Umgang mit Zeitzonen
    - Sie entscheiden, wo Sie eine Zeitzone festlegen oder überschreiben.
summary: Wo Zeitzonen in OpenClaw vorkommen – in Umschlägen, Tool-Payloads und im System-Prompt
title: Zeitzonen
x-i18n:
    generated_at: "2026-07-24T03:48:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standardisiert Zeitstempel, sodass das Modell eine **einzige Referenzzeit** statt einer Mischung aus lokalen Provider-Zeiten sieht. Drei Bereiche zeigen Zeitzonen an, jeweils für einen eigenen Zweck:

## Drei Zeitzonenbereiche

| Bereich              | Anzeige                                                                                                           | Standard                                      | Konfiguriert über                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Nachrichtenumschläge | Umschließt eingehende Kanalnachrichten: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                                        | Lokalzeit des Hosts                           | `agents.defaults.envelopeTimezone`                                   |
| Tool-Nutzlasten      | Kanal-Tools im `readMessages`-Stil geben die unveränderte Provider-Zeit sowie normalisierte Werte für `timestampMs` / `timestampUtc` zurück | UTC-Felder sind immer vorhanden               | Nicht konfigurierbar; behält Provider-native Zeitstempel bei |
| System-Prompt        | Ein kleiner `Current Date & Time`-Block, der **nur die Zeitzone** enthält (keinen Uhrzeitwert, um die Cache-Stabilität zu gewährleisten) | Zeitzone des Hosts, wenn `userTimezone` nicht festgelegt ist | `agents.defaults.userTimezone`                                   |

Der System-Prompt lässt die aktuelle Uhrzeit bewusst weg, damit das Prompt-Caching über mehrere Durchläufe hinweg stabil bleibt. Wenn der Agent die aktuelle Uhrzeit benötigt, ruft er `session_status` auf.

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

Wenn `userTimezone` nicht festgelegt ist, ermittelt OpenClaw die Zeitzone des Hosts zur Laufzeit über `Intl.DateTimeFormat().resolvedOptions().timeZone` (ohne die Konfiguration zu ändern). `agents.defaults.timeFormat` (`auto` | `12` | `24`) steuert die Darstellung im 12-/24-Stunden-Format in Umschlägen und nachgelagerten Bereichen, nicht jedoch im Abschnitt des System-Prompts.

## Zeitzonenwerte für Umschläge

`agents.defaults.envelopeTimezone` akzeptiert:

- `"local"` (Standard) oder `"host"` – Zeitzone des Hostcomputers.
- `"utc"` oder `"gmt"` – UTC.
- `"user"` – die ermittelte `agents.defaults.userTimezone` (fällt auf die Zeitzone des Hosts zurück, wenn sie nicht festgelegt ist).
- Eine beliebige explizite IANA-Zeitzonenangabe, z. B. `"Europe/Vienna"`.

## Wann eine Überschreibung sinnvoll ist

- **Verwenden Sie `"utc"`** für hostübergreifend stabile Zeitstempel in verschiedenen Regionen oder zur Übereinstimmung mit UTC-basierten Diagnose- und Protokollausgaben.
- **Verwenden Sie `"user"`**, damit Umschläge unabhängig von der Zeitzone des Gateway-Hosts an der konfigurierten Benutzerzeitzone ausgerichtet bleiben.
- **Verwenden Sie eine feste IANA-Zeitzone**, wenn sich der Gateway-Host in einer Zeitzone befindet, der Umschlag aber unabhängig von Hostmigrationen stets in einer anderen Zeitzone angezeigt werden soll.
- **Legen Sie `envelopeTimestamp: "off"` fest**, wenn Zeitstempelkontext für die Unterhaltung nicht nützlich ist. Dadurch werden absolute Zeitstempel aus Umschlägen, direkten Präfixen von Agent-Prompts und eingebetteten Präfixen für Modelleingaben entfernt.

Eine vollständige Referenz zum Verhalten, Beispiele für jeden Provider und die Formatierung verstrichener Zeit finden Sie unter [Datum und Uhrzeit](/de/date-time).

## Verwandte Themen

- [Datum und Uhrzeit](/de/date-time) – vollständiges Verhalten von Umschlägen, Tools und Prompts sowie Beispiele.
- [Heartbeat](/de/gateway/heartbeat) – für die Planung aktiver Zeiten wird die Zeitzone verwendet.
- [Cron-Aufgaben](/de/automation/cron-jobs) – Cron-Ausdrücke verwenden die Zeitzone für die Planung.
