---
read_when:
    - Sie möchten, dass OpenClaw sich natürliche Anschlussfragen merkt
    - Sie möchten verstehen, wie sich abgeleitete Check-ins von Erinnerungen unterscheiden
    - Sie möchten Folgezusagen prüfen oder verwerfen
sidebarTitle: Commitments
summary: Abgeleiteter Follow-up-Speicher für Check-ins, die keine exakten Erinnerungen sind
title: Abgeleitete Verpflichtungen
x-i18n:
    generated_at: "2026-05-01T06:41:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

Zusagen sind kurzlebige Nachfass-Erinnerungen. Wenn sie aktiviert sind, kann OpenClaw
erkennen, dass eine Unterhaltung eine zukünftige Gelegenheit zum Nachfragen erzeugt hat,
und sich merken, diese später wieder aufzugreifen.

Beispiele:

- Sie erwähnen ein Vorstellungsgespräch morgen. OpenClaw kann danach nachfragen.
- Sie sagen, dass Sie erschöpft sind. OpenClaw kann später fragen, ob Sie geschlafen haben.
- Der Agent sagt, dass er nachfasst, nachdem sich etwas geändert hat. OpenClaw kann diese
  offene Schleife nachverfolgen.

Zusagen sind keine dauerhaften Fakten wie `MEMORY.md`, und sie sind keine exakten
Erinnerungen. Sie liegen zwischen Gedächtnis und Automatisierung: OpenClaw merkt sich eine
unterhaltungsgebundene Verpflichtung, dann liefert Heartbeat sie aus, wenn sie fällig ist.

## Zusagen aktivieren

Zusagen sind standardmäßig deaktiviert. Aktivieren Sie sie in der Konfiguration:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Entsprechende `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` begrenzt, wie viele abgeleitete Nachfassaktionen pro Agent-Sitzung
innerhalb eines rollierenden Tages ausgeliefert werden können. Der Standardwert ist `3`.

## Funktionsweise

Nach einer Agent-Antwort kann OpenClaw in einem separaten Kontext einen verborgenen
Hintergrund-Extraktionsdurchlauf ausführen. Dieser Durchlauf sucht nur nach abgeleiteten
Nachfass-Zusagen. Er schreibt nicht in die sichtbare Unterhaltung und fordert den Haupt-Agent
nicht auf, über die Extraktion nachzudenken.

Wenn ein Kandidat mit hoher Zuverlässigkeit gefunden wird, speichert OpenClaw eine Zusage mit:

- der Agent-ID
- dem Sitzungsschlüssel
- dem ursprünglichen Kanal und Auslieferungsziel
- einem Fälligkeitsfenster
- einem kurzen vorgeschlagenen Check-in
- nicht anweisenden Metadaten, damit Heartbeat entscheiden kann, ob sie gesendet wird

Die Auslieferung erfolgt über Heartbeat. Wenn eine Zusage fällig wird, fügt Heartbeat die
Zusage dem Heartbeat-Turn für denselben Agent- und Kanalbereich hinzu. Das Modell kann einen
natürlichen Check-in senden oder mit `HEARTBEAT_OK` antworten, um ihn zu verwerfen. Wenn
Heartbeat mit `target: "none"` konfiguriert ist, bleiben fällige Zusagen intern und senden
keine externen Check-ins. Zusagen-Auslieferungsprompts spielen den ursprünglichen
Unterhaltungstext nicht erneut ab, und Heartbeat-Turns für fällige Zusagen werden ohne
OpenClaw-Tools ausgeführt.

OpenClaw liefert eine abgeleitete Zusage nie unmittelbar nach dem Schreiben aus. Die
Fälligkeitszeit wird auf mindestens ein Heartbeat-Intervall nach Erstellung der Zusage
begrenzt, sodass die Nachfassung nicht im selben Moment zurückgespiegelt werden kann, in dem
sie abgeleitet wurde.

## Geltungsbereich

Zusagen sind auf den exakten Agent- und Kanalkontext beschränkt, in dem sie erstellt wurden.
Eine Nachfassung, die während eines Gesprächs mit einem Agent in Discord abgeleitet wurde,
wird nicht von einem anderen Agent, einem anderen Kanal oder einer nicht zugehörigen Sitzung
ausgeliefert.

Dieser Geltungsbereich ist Teil der Funktion. Natürliche Check-ins sollten sich anfühlen, als
würde dieselbe Unterhaltung fortgesetzt, nicht wie ein globales Erinnerungssystem.

## Zusagen vs. Erinnerungen

| Bedarf                                          | Verwenden                                |
| ----------------------------------------------- | ---------------------------------------- |
| "Erinnere mich um 15 Uhr"                       | [Geplante Aufgaben](/de/automation/cron-jobs) |
| "Ping mich in 20 Minuten"                       | [Geplante Aufgaben](/de/automation/cron-jobs) |
| "Führe diesen Bericht jeden Werktag aus"        | [Geplante Aufgaben](/de/automation/cron-jobs) |
| "Ich habe morgen ein Vorstellungsgespräch"      | Zusagen                                  |
| "Ich war die ganze Nacht wach"                  | Zusagen                                  |
| "Fasse nach, wenn ich auf diesen offenen Thread nicht antworte" | Zusagen                                  |

Exakte Benutzeranfragen gehören bereits zum Scheduler-Pfad. Zusagen sind nur für abgeleitete
Nachfassaktionen gedacht: die Momente, in denen der Benutzer nicht um eine Erinnerung gebeten
hat, die Unterhaltung aber eindeutig einen sinnvollen zukünftigen Check-in erzeugt hat.

## Zusagen verwalten

Verwenden Sie die CLI, um gespeicherte Zusagen zu prüfen und zu löschen:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Siehe [`openclaw commitments`](/de/cli/commitments) für die Befehlsreferenz.

## Datenschutz und Kosten

Die Zusagen-Extraktion verwendet einen LLM-Durchlauf. Daher führt die Aktivierung nach
geeigneten Turns zu zusätzlicher Hintergrundnutzung des Modells. Der Durchlauf ist vor der
benutzersichtbaren Unterhaltung verborgen, kann aber den jüngsten Austausch lesen, der nötig
ist, um zu entscheiden, ob eine Nachfassung existiert.

Gespeicherte Zusagen sind lokaler OpenClaw-Zustand. Sie sind operatives Gedächtnis, kein
Langzeitgedächtnis. Deaktivieren Sie die Funktion mit:

```bash
openclaw config set commitments.enabled false
```

## Fehlerbehebung

Wenn erwartete Nachfassaktionen nicht erscheinen:

- Bestätigen Sie, dass `commitments.enabled` auf `true` gesetzt ist.
- Prüfen Sie mit `openclaw commitments --all`, ob ausstehende, verworfene, zurückgestellte oder abgelaufene
  Einträge vorhanden sind.
- Stellen Sie sicher, dass Heartbeat für den Agent läuft.
- Prüfen Sie, ob `commitments.maxPerDay` für diese Agent-Sitzung bereits erreicht wurde.
- Denken Sie daran, dass exakte Erinnerungen von der Zusagen-Extraktion übersprungen werden und stattdessen
  unter [geplanten Aufgaben](/de/automation/cron-jobs) erscheinen sollten.

## Verwandt

- [Speicherübersicht](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [`openclaw commitments`](/de/cli/commitments)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#commitments)
