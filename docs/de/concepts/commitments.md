---
read_when:
    - Sie möchten, dass OpenClaw sich natürliche Folgefragen merkt
    - Sie möchten verstehen, wie sich abgeleitete Check-ins von Erinnerungen unterscheiden
    - Sie möchten Folgezusagen prüfen oder verwerfen
sidebarTitle: Commitments
summary: Abgeleiteter Nachfass-Speicher für Statusabfragen, die keine exakten Erinnerungen sind
title: Abgeleitete Verpflichtungen
x-i18n:
    generated_at: "2026-04-30T06:48:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Verpflichtungen sind kurzlebige Folgespeicherungen. Wenn sie aktiviert sind, kann OpenClaw
erkennen, dass ein Gespräch eine zukünftige Gelegenheit zum Nachfassen erzeugt hat, und sich
merken, sie später wieder aufzugreifen.

Beispiele:

- Sie erwähnen ein Vorstellungsgespräch morgen. OpenClaw kann danach nachfragen.
- Sie sagen, dass Sie erschöpft sind. OpenClaw kann später fragen, ob Sie geschlafen haben.
- Der Agent sagt, dass er nachfasst, nachdem sich etwas geändert hat. OpenClaw kann diese
  offene Schleife nachverfolgen.

Verpflichtungen sind keine dauerhaften Fakten wie `MEMORY.md`, und sie sind keine exakten
Erinnerungen. Sie liegen zwischen Erinnerung und Automatisierung: OpenClaw merkt sich eine
gesprächsgebundene Verpflichtung, dann liefert Heartbeat sie aus, wenn sie fällig ist.

## Verpflichtungen aktivieren

Verpflichtungen sind standardmäßig deaktiviert. Aktivieren Sie sie in der Konfiguration:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Äquivalentes `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` begrenzt, wie viele abgeleitete Nachfassaktionen
pro Agent-Sitzung an einem rollierenden Tag ausgeliefert werden können. Der Standardwert ist `3`.

## Funktionsweise

Nach einer Agent-Antwort kann OpenClaw einen versteckten Hintergrund-Extraktionsdurchlauf in einem
separaten Kontext ausführen. Dieser Durchlauf sucht nur nach abgeleiteten Nachfass-Verpflichtungen. Er
schreibt nicht in das sichtbare Gespräch und fordert den Haupt-Agent nicht auf,
über die Extraktion nachzudenken.

Wenn er einen Kandidaten mit hoher Zuverlässigkeit findet, speichert OpenClaw eine Verpflichtung mit:

- der Agent-ID
- dem Sitzungsschlüssel
- dem ursprünglichen Kanal und Auslieferungsziel
- einem Fälligkeitsfenster
- einer kurzen vorgeschlagenen Nachfrage
- genug Quellkontext, damit Heartbeat entscheiden kann, ob sie gesendet werden soll

Die Auslieferung erfolgt über Heartbeat. Wenn eine Verpflichtung fällig wird, fügt Heartbeat
die Verpflichtung der Heartbeat-Runde für denselben Agent- und Kanal-Scope hinzu.
Das Modell kann eine natürliche Nachfrage senden oder mit `HEARTBEAT_OK` antworten, um sie zu verwerfen.

OpenClaw liefert eine abgeleitete Verpflichtung niemals unmittelbar nach dem Schreiben aus.
Die Fälligkeitszeit wird auf mindestens ein Heartbeat-Intervall nach Erstellung der Verpflichtung
begrenzt, sodass die Nachfrage nicht im selben Moment zurückgespiegelt werden kann, in dem sie
abgeleitet wurde.

## Scope

Verpflichtungen sind auf den exakten Agent- und Kanalkontext beschränkt, in dem sie
erstellt wurden. Eine Nachfassaktion, die während eines Gesprächs mit einem Agent in Discord abgeleitet wurde, wird nicht
von einem anderen Agent, einem anderen Kanal oder einer nicht zusammenhängenden Sitzung ausgeliefert.

Dieser Scope ist Teil der Funktion. Natürliche Nachfragen sollten sich anfühlen, als würde dasselbe
Gespräch weitergeführt, nicht wie ein globales Erinnerungssystem.

## Verpflichtungen vs. Erinnerungen

| Bedarf                                           | Verwenden                                |
| ----------------------------------------------- | ---------------------------------------- |
| "Erinnern Sie mich um 15 Uhr"                    | [Geplante Aufgaben](/de/automation/cron-jobs) |
| "Pingen Sie mich in 20 Minuten"                  | [Geplante Aufgaben](/de/automation/cron-jobs) |
| "Diesen Bericht an jedem Werktag ausführen"      | [Geplante Aufgaben](/de/automation/cron-jobs) |
| "Ich habe morgen ein Vorstellungsgespräch"       | Verpflichtungen                          |
| "Ich war die ganze Nacht wach"                   | Verpflichtungen                          |
| "Nachfassen, wenn ich in diesem offenen Thread nicht antworte" | Verpflichtungen                          |

Exakte Benutzeranforderungen gehören bereits zum Scheduler-Pfad. Verpflichtungen sind nur
für abgeleitete Nachfassaktionen gedacht: die Momente, in denen der Benutzer nicht um eine Erinnerung gebeten hat,
das Gespräch aber eindeutig eine nützliche zukünftige Nachfrage erzeugt hat.

## Verpflichtungen verwalten

Verwenden Sie die CLI, um gespeicherte Verpflichtungen zu prüfen und zu löschen:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Siehe [`openclaw commitments`](/de/cli/commitments) für die Befehlsreferenz.

## Datenschutz und Kosten

Die Extraktion von Verpflichtungen verwendet einen LLM-Durchlauf. Wenn Sie sie aktivieren, entsteht daher nach geeigneten Runden zusätzliche
Hintergrund-Modellnutzung. Der Durchlauf ist für das benutzersichtbare
Gespräch verborgen, kann aber den jüngsten Austausch lesen, der erforderlich ist, um zu entscheiden, ob eine
Nachfassaktion existiert.

Gespeicherte Verpflichtungen sind lokaler OpenClaw-Zustand. Sie sind operativer Speicher, kein
Langzeitspeicher. Deaktivieren Sie die Funktion mit:

```bash
openclaw config set commitments.enabled false
```

## Fehlerbehebung

Wenn erwartete Nachfassaktionen nicht erscheinen:

- Bestätigen Sie, dass `commitments.enabled` `true` ist.
- Prüfen Sie mit `openclaw commitments --all`, ob ausstehende, verworfene, zurückgestellte oder abgelaufene
  Datensätze vorhanden sind.
- Stellen Sie sicher, dass Heartbeat für den Agent läuft.
- Prüfen Sie, ob `commitments.maxPerDay` für diese
  Agent-Sitzung bereits erreicht wurde.
- Denken Sie daran, dass exakte Erinnerungen von der Verpflichtungsextraktion übersprungen werden und stattdessen
  unter [geplante Aufgaben](/de/automation/cron-jobs) erscheinen sollten.

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [`openclaw commitments`](/de/cli/commitments)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#commitments)
