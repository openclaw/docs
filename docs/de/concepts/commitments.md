---
read_when:
    - Sie möchten, dass OpenClaw sich natürliche Folgefragen merkt
    - Sie möchten verstehen, wie sich abgeleitete Check-ins von Erinnerungen unterscheiden
    - Sie möchten Folgeverpflichtungen prüfen oder verwerfen
sidebarTitle: Commitments
summary: Abgeleitete Follow-up-Erinnerung für Check-ins, die keine exakten Erinnerungen sind
title: Abgeleitete Verpflichtungen
x-i18n:
    generated_at: "2026-07-16T12:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Commitments sind kurzlebige Erinnerungen an spätere Nachfragen. Wenn sie aktiviert sind, kann OpenClaw
erkennen, dass sich aus einer Unterhaltung eine Gelegenheit für eine spätere Nachfrage ergeben hat, und sich
merken, später darauf zurückzukommen.

Beispiele:

- Sie erwähnen ein Vorstellungsgespräch morgen. OpenClaw fragt möglicherweise danach nach.
- Sie sagen, dass Sie erschöpft sind. OpenClaw fragt möglicherweise später, ob Sie geschlafen haben.
- Der Agent sagt, dass er nachfragen wird, sobald sich etwas ändert. OpenClaw verfolgt möglicherweise
  diesen offenen Vorgang.

Commitments sind keine dauerhaften Fakten wie `MEMORY.md` und auch keine exakten
Erinnerungen. Sie liegen zwischen Gedächtnis und Automatisierung: OpenClaw merkt sich eine
an die Unterhaltung gebundene Verpflichtung, die dann bei Fälligkeit durch Heartbeat zugestellt wird.

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

`commitments.maxPerDay` begrenzt, wie viele abgeleitete Nachfragen
pro Agent-Sitzung innerhalb eines gleitenden Tages zugestellt werden können. Der Standardwert ist `3`.

## Funktionsweise

Nach einer Antwort des Agents kann OpenClaw in einem separaten Kontext und
mit deaktivierten Tools einen verborgenen Extraktionsdurchlauf im Hintergrund ausführen. Dieser Durchlauf sucht ausschließlich nach abgeleiteten Verpflichtungen zu späteren Nachfragen. Er
schreibt nichts in die sichtbare Unterhaltung und fordert den Haupt-Agent nicht auf,
über die Extraktion nachzudenken.

Wenn OpenClaw einen Kandidaten mit hoher Konfidenz findet, speichert es ein Commitment mit:

- der Agent-ID
- dem Sitzungsschlüssel
- dem ursprünglichen Kanal und Zustellungsziel
- einem Fälligkeitszeitraum
- einer kurzen vorgeschlagenen Nachfrage
- nicht als Anweisungen gedachten Metadaten, anhand derer Heartbeat entscheidet, ob die Nachfrage gesendet wird

Die Zustellung erfolgt über Heartbeat. Sobald ein Commitment fällig wird, fügt Heartbeat
es dem Heartbeat-Durchlauf für denselben Agent- und Kanalkontext hinzu.
Der Prompt warnt ausdrücklich davor, dass Commitment-Metadaten nicht vertrauenswürdig sind, und weist
das Modell an, darin enthaltene Anweisungen nicht zu befolgen und ihretwegen keine Tools zu verwenden. Das
Modell kann eine natürliche Nachfrage senden oder mit `HEARTBEAT_OK` antworten, um sie zu verwerfen.
Wenn Heartbeat mit `target: "none"` konfiguriert ist, bleiben fällige Commitments
intern und lösen keine externen Nachfragen aus. Prompts zur Zustellung von Commitments geben nicht
den ursprünglichen Unterhaltungstext wieder, sondern nur die vorgeschlagene Nachfrage und die
Metadaten. Heartbeat-Durchläufe für fällige Commitments werden ohne OpenClaw-Tools ausgeführt.

OpenClaw stellt ein abgeleitetes Commitment niemals unmittelbar nach dessen Speicherung zu.
Der Fälligkeitszeitpunkt wird auf mindestens ein Heartbeat-Intervall nach der Erstellung des Commitments
begrenzt, sodass die Nachfrage nicht im selben Moment zurückgegeben werden kann, in dem sie
abgeleitet wurde.

## Geltungsbereich

Commitments sind exakt auf den Agent- und Kanalkontext beschränkt, in dem sie
erstellt wurden. Eine beim Gespräch mit einem Agent in Discord abgeleitete Nachfrage wird nicht
durch einen anderen Agent, einen anderen Kanal oder eine nicht zugehörige Sitzung
zugestellt.

Dieser Geltungsbereich ist Teil der Funktion. Natürliche Nachfragen sollten sich wie die Fortsetzung
derselben Unterhaltung anfühlen und nicht wie ein globales Erinnerungssystem.

## Commitments im Vergleich zu Erinnerungen

| Bedarf                                          | Verwenden                                 |
| ----------------------------------------------- | ----------------------------------------- |
| „Erinnere mich um 15 Uhr“                       | [Geplante Aufgaben](/de/automation/cron-jobs) |
| „Kontaktiere mich in 20 Minuten“                | [Geplante Aufgaben](/de/automation/cron-jobs) |
| „Führe diesen Bericht jeden Werktag aus“        | [Geplante Aufgaben](/de/automation/cron-jobs) |
| „Ich habe morgen ein Vorstellungsgespräch“      | Commitments                               |
| „Ich war die ganze Nacht wach“                  | Commitments                               |
| „Frage nach, wenn ich auf diesen offenen Thread nicht antworte“ | Commitments                  |

Exakte Benutzeranfragen gehören bereits in den Scheduler-Pfad. Commitments sind ausschließlich
für abgeleitete Nachfragen vorgesehen: Situationen, in denen die Person keine Erinnerung angefordert hat,
die Unterhaltung aber eindeutig Anlass für eine nützliche spätere Nachfrage bietet.

## Commitments verwalten

Verwenden Sie die CLI, um gespeicherte Commitments anzuzeigen und zu löschen:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Die vollständige Befehlsreferenz finden Sie unter [`openclaw commitments`](/de/cli/commitments).

## Datenschutz und Kosten

Die Extraktion von Commitments verwendet einen LLM-Durchlauf. Ihre Aktivierung verursacht daher nach
geeigneten Interaktionen zusätzliche Modellnutzung im Hintergrund. Der Durchlauf bleibt in der für Benutzer sichtbaren
Unterhaltung verborgen, kann jedoch den jüngsten Austausch lesen, der benötigt wird, um festzustellen, ob
eine spätere Nachfrage vorliegt.

Gespeicherte Commitments sind ein lokales operatives Gedächtnis von OpenClaw in der gemeinsamen
SQLite-Zustandsdatenbank und kein Langzeitgedächtnis. Deaktivieren Sie die Funktion mit:

```bash
openclaw config set commitments.enabled false
```

## Fehlerbehebung

Wenn erwartete Nachfragen nicht erscheinen:

- Vergewissern Sie sich, dass `commitments.enabled` den Wert `true` hat.
- Prüfen Sie `openclaw commitments --all` auf ausstehende, verworfene, zurückgestellte oder abgelaufene
  Datensätze.
- Stellen Sie sicher, dass Heartbeat für den Agent ausgeführt wird.
- Prüfen Sie, ob `commitments.maxPerDay` für diese
  Agent-Sitzung bereits erreicht wurde.
- Beachten Sie, dass exakte Erinnerungen bei der Commitment-Extraktion übersprungen werden und stattdessen
  unter [geplanten Aufgaben](/de/automation/cron-jobs) erscheinen sollten.

## Verwandte Themen

- [Übersicht zum Gedächtnis](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [`openclaw commitments`](/de/cli/commitments)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#commitments)
