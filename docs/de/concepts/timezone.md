---
read_when:
    - Sie möchten sich schnell ein grundlegendes Verständnis der Zeitzonenverarbeitung verschaffen
    - Sie entscheiden, wo Sie eine Zeitzone festlegen oder überschreiben möchten
summary: Wo Zeitzonen in OpenClaw erscheinen – in Umschlägen, Tool-Payloads und im System-Prompt
title: Zeitzonen
x-i18n:
    generated_at: "2026-07-12T15:15:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standardisiert Zeitstempel, sodass das Modell statt einer Mischung aus lokalen Uhren verschiedener Provider eine **einheitliche Referenzzeit** sieht. Drei Oberflächen zeigen Zeitzonen an, jeweils für einen eigenen Zweck:

## Drei Zeitzonenoberflächen

| Oberfläche          | Anzeige                                                                                                            | Standard                                      | Konfiguration über                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------ |
| Nachrichtenumschläge | Umschließt eingehende Kanalnachrichten: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                         | Lokalzeit des Hosts                           | `agents.defaults.envelopeTimezone`                     |
| Tool-Nutzdaten      | Kanal-Tools nach Art von `readMessages` geben die unverarbeitete Provider-Zeit sowie normalisierte Werte für `timestampMs` / `timestampUtc` zurück | UTC-Felder sind immer vorhanden               | Nicht konfigurierbar; erhält Provider-native Zeitstempel |
| System-Prompt       | Ein kleiner Block `Current Date & Time`, der **nur die Zeitzone** enthält (keinen Uhrzeitwert, um die Cache-Stabilität zu gewährleisten) | Zeitzone des Hosts, wenn `userTimezone` nicht gesetzt ist | `agents.defaults.userTimezone`                         |

Der System-Prompt lässt die aktuelle Uhrzeit bewusst weg, damit das Prompt-Caching über mehrere Interaktionen hinweg stabil bleibt. Wenn der Agent die aktuelle Uhrzeit benötigt, ruft er `session_status` auf.

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

Wenn `userTimezone` nicht gesetzt ist, ermittelt OpenClaw die Zeitzone des Hosts zur Laufzeit über `Intl.DateTimeFormat().resolvedOptions().timeZone` (ohne die Konfiguration zu ändern). `agents.defaults.timeFormat` (`auto` | `12` | `24`) steuert die Darstellung im 12-/24-Stunden-Format in Umschlägen und nachgelagerten Oberflächen, jedoch nicht im Abschnitt des System-Prompts.

## Werte für die Umschlagzeitzone

`agents.defaults.envelopeTimezone` akzeptiert:

- `"local"` (Standard) oder `"host"` – Zeitzone des Hostsystems.
- `"utc"` oder `"gmt"` – UTC.
- `"user"` – die ermittelte `agents.defaults.userTimezone` (greift auf die Zeitzone des Hosts zurück, wenn sie nicht gesetzt ist).
- Eine beliebige explizite IANA-Zeitzonenangabe, z. B. `"Europe/Vienna"`.

## Wann Sie die Einstellung überschreiben sollten

- **Verwenden Sie `"utc"`** für einheitliche Zeitstempel auf Hosts in verschiedenen Regionen oder zur Abstimmung mit UTC-basierten Diagnose-/Protokollausgaben.
- **Verwenden Sie `"user"`**, damit Umschläge unabhängig von der Zeitzone des Gateway-Hosts an der konfigurierten Benutzerzeitzone ausgerichtet bleiben.
- **Verwenden Sie eine feste IANA-Zeitzone**, wenn sich der Gateway-Host in einer Zeitzone befindet, der Umschlag aber unabhängig von einer Hostmigration immer eine andere Zeitzone anzeigen soll.
- **Setzen Sie `envelopeTimestamp: "off"`**, wenn der Zeitstempelkontext für die Konversation nicht hilfreich ist. Dadurch werden absolute Zeitstempel aus Umschlägen, direkten Präfixen des Agenten-Prompts und eingebetteten Präfixen der Modelleingabe entfernt.

Eine vollständige Referenz zum Verhalten, Beispiele für die einzelnen Provider und die Formatierung verstrichener Zeit finden Sie unter [Datum und Uhrzeit](/de/date-time).

## Verwandte Themen

- [Datum und Uhrzeit](/de/date-time) – vollständiges Verhalten und Beispiele für Umschläge, Tools und Prompts.
- [Heartbeat](/de/gateway/heartbeat) – aktive Zeiträume verwenden die Zeitzone für die Zeitplanung.
- [Cron-Aufgaben](/de/automation/cron-jobs) – Cron-Ausdrücke verwenden die Zeitzone für die Zeitplanung.
