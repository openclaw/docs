---
read_when:
    - Sie möchten, dass OpenClaw sich natürliche Folgefragen merkt
    - Sie möchten verstehen, wie sich abgeleitete Check-ins von Erinnerungen unterscheiden
    - Sie möchten Folgezusagen überprüfen oder verwerfen
sidebarTitle: Commitments
summary: Abgeleitete Erinnerung für Nachfragen, die keine exakten Erinnerungen sind
title: Abgeleitete Verpflichtungen
x-i18n:
    generated_at: "2026-07-12T15:16:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Commitments sind kurzlebige Erinnerungen an Nachfassaktionen. Wenn sie aktiviert sind, kann OpenClaw
erkennen, dass sich aus einem Gespräch eine Gelegenheit für eine spätere Rückfrage ergeben hat, und daran denken,
diese zu einem späteren Zeitpunkt wieder aufzugreifen.

Beispiele:

- Sie erwähnen ein Vorstellungsgespräch am nächsten Tag. OpenClaw fragt möglicherweise danach nach, wie es gelaufen ist.
- Sie sagen, dass Sie erschöpft sind. OpenClaw fragt möglicherweise später, ob Sie geschlafen haben.
- Der Agent sagt, dass er nachfassen wird, sobald sich etwas ändert. OpenClaw kann
  diesen offenen Vorgang nachverfolgen.

Commitments sind keine dauerhaften Fakten wie `MEMORY.md` und auch keine exakten
Erinnerungen. Sie liegen zwischen Gedächtnis und Automatisierung: OpenClaw merkt sich eine
an das Gespräch gebundene Verpflichtung, die Heartbeat dann bei Fälligkeit zustellt.

## Commitments aktivieren

Commitments sind standardmäßig deaktiviert (`commitments.enabled: false`). Aktivieren Sie sie in der Konfiguration:

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

`commitments.maxPerDay` begrenzt, wie viele abgeleitete Nachfassaktionen
pro Agent-Sitzung innerhalb eines gleitenden Tages zugestellt werden können. Der Standardwert ist `3`.

## Funktionsweise

Nach einer Antwort des Agents kann OpenClaw in einem separaten Kontext und bei
deaktivierten Tools einen verborgenen Extraktionsdurchlauf im Hintergrund ausführen. Dieser Durchlauf sucht ausschließlich nach abgeleiteten Commitments für Nachfassaktionen. Er
schreibt nichts in das sichtbare Gespräch und fordert den Haupt-Agent nicht auf,
über die Extraktion nachzudenken.

Wenn OpenClaw einen Kandidaten mit hoher Konfidenz findet, speichert es ein Commitment mit:

- der Agent-ID
- dem Sitzungsschlüssel
- dem ursprünglichen Kanal und Zustellungsziel
- einem Fälligkeitszeitraum
- einem kurzen Vorschlag für eine Rückfrage
- nicht anweisenden Metadaten, anhand derer Heartbeat entscheidet, ob es gesendet werden soll

Die Zustellung erfolgt über Heartbeat. Sobald ein Commitment fällig wird, fügt Heartbeat
es dem Heartbeat-Durchlauf für denselben Agent- und Kanalbereich hinzu.
Der Prompt warnt ausdrücklich davor, dass die Metadaten des Commitments nicht vertrauenswürdig sind, und weist
das Modell an, keine darin enthaltenen Anweisungen zu befolgen und aufgrund dieser Metadaten keine Tools zu verwenden. Das
Modell kann eine einzige natürliche Rückfrage senden oder mit `HEARTBEAT_OK` antworten, um sie zu verwerfen.
Wenn Heartbeat mit `target: "none"` konfiguriert ist, bleiben fällige Commitments
intern und es werden keine externen Rückfragen gesendet. Prompts zur Zustellung von Commitments geben nicht
den ursprünglichen Gesprächstext wieder, sondern nur die vorgeschlagene Rückfrage und
die Metadaten. Heartbeat-Durchläufe für fällige Commitments werden ohne OpenClaw-Tools ausgeführt.

OpenClaw stellt ein abgeleitetes Commitment niemals unmittelbar nach dem Speichern zu.
Der Fälligkeitszeitpunkt wird auf mindestens ein Heartbeat-Intervall nach der Erstellung des Commitments
begrenzt, sodass die Nachfassaktion nicht im selben Moment wiedergegeben werden kann, in dem sie
abgeleitet wurde.

## Geltungsbereich

Commitments sind auf genau den Agent- und Kanalkontext beschränkt, in dem sie
erstellt wurden. Eine Nachfassaktion, die während eines Gesprächs mit einem Agent in Discord abgeleitet wurde, wird nicht
von einem anderen Agent, einem anderen Kanal oder einer nicht zugehörigen Sitzung zugestellt.

Dieser Geltungsbereich ist Teil der Funktion. Natürliche Rückfragen sollen sich wie die Fortsetzung
desselben Gesprächs anfühlen und nicht wie ein globales Erinnerungssystem.

## Commitments im Vergleich zu Erinnerungen

| Bedarf                                                            | Verwenden                                  |
| ----------------------------------------------------------------- | ------------------------------------------ |
| „Erinnere mich um 15 Uhr“                                         | [Geplante Aufgaben](/de/automation/cron-jobs) |
| „Benachrichtige mich in 20 Minuten“                               | [Geplante Aufgaben](/de/automation/cron-jobs) |
| „Führe diesen Bericht an jedem Werktag aus“                        | [Geplante Aufgaben](/de/automation/cron-jobs) |
| „Ich habe morgen ein Vorstellungsgespräch“                         | Commitments                                |
| „Ich war die ganze Nacht wach“                                    | Commitments                                |
| „Fasse nach, wenn ich auf diesen offenen Thread nicht antworte“    | Commitments                                |

Explizite Benutzeranfragen gehören bereits zum Scheduler-Pfad. Commitments dienen nur
abgeleiteten Nachfassaktionen: Situationen, in denen der Benutzer keine Erinnerung angefordert hat,
das Gespräch jedoch eindeutig einen sinnvollen Anlass für eine spätere Rückfrage geschaffen hat.

## Commitments verwalten

Verwenden Sie die CLI, um gespeicherte Commitments zu prüfen und zu löschen:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Die vollständige Befehlsreferenz finden Sie unter [`openclaw commitments`](/de/cli/commitments).

## Datenschutz und Kosten

Die Extraktion von Commitments verwendet einen LLM-Durchlauf. Ihre Aktivierung verursacht daher nach geeigneten
Durchläufen zusätzliche Modellnutzung im Hintergrund. Der Durchlauf ist für das benutzersichtbare
Gespräch verborgen, kann jedoch den jüngsten Austausch lesen, der erforderlich ist, um zu entscheiden, ob eine
Nachfassaktion vorliegt.

Gespeicherte Commitments sind lokaler OpenClaw-Zustand. Sie sind operatives Gedächtnis, kein
Langzeitgedächtnis. Deaktivieren Sie die Funktion mit:

```bash
openclaw config set commitments.enabled false
```

## Fehlerbehebung

Wenn erwartete Nachfassaktionen nicht angezeigt werden:

- Vergewissern Sie sich, dass `commitments.enabled` auf `true` gesetzt ist.
- Prüfen Sie mit `openclaw commitments --all`, ob ausstehende, verworfene, zurückgestellte oder abgelaufene
  Einträge vorhanden sind.
- Stellen Sie sicher, dass Heartbeat für den Agent ausgeführt wird.
- Prüfen Sie, ob `commitments.maxPerDay` für diese
  Agent-Sitzung bereits erreicht wurde.
- Beachten Sie, dass exakte Erinnerungen bei der Commitment-Extraktion übersprungen werden und stattdessen
  unter [Geplante Aufgaben](/de/automation/cron-jobs) erscheinen sollten.

## Verwandte Themen

- [Übersicht zum Gedächtnis](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [`openclaw commitments`](/de/cli/commitments)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#commitments)
