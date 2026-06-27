---
doc-schema-version: 1
read_when:
    - Sie möchten, dass OpenClaw während einer langen Sitzung ein Ziel sichtbar hält
    - Sie müssen ein Sitzungsziel pausieren, fortsetzen, blockieren, abschließen oder löschen
    - Sie möchten die Tools get_goal, create_goal und update_goal verstehen
    - Sie möchten sehen, wie Ziele in der TUI angezeigt werden
summary: 'Sitzungsziele: dauerhafte sitzungsbezogene Ziele, /goal-Steuerungen, Modell-Ziel-Tools, Token-Budgets und TUI-Status'
title: Ziel
x-i18n:
    generated_at: "2026-06-27T18:19:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Ziel

Ein **Ziel** ist ein dauerhaftes Zielvorhaben, das an die aktuelle OpenClaw-Sitzung angehängt ist.
Es gibt dem Agenten und dem Operator ein gemeinsames Ziel für lang andauernde Arbeit,
ohne dieses Ziel in eine Hintergrundaufgabe, Erinnerung, einen Cronjob oder
eine Standing Order zu verwandeln.

Ziele sind Sitzungszustand. Sie wandern mit dem Sitzungsschlüssel, überstehen
Prozessneustarts, erscheinen in `/goal`, sind über die Ziel-Tools für das Modell
verfügbar und werden im TUI-Footer angezeigt, wenn die aktive Sitzung eines hat.

## Schnellstart

Ein Ziel festlegen:

```text
/goal start get CI green for PR 87469 and push the fix
```

Prüfen:

```text
/goal
```

Pausieren, wenn die Arbeit absichtlich wartet:

```text
/goal pause waiting for CI
```

Fortsetzen:

```text
/goal resume
```

Als abgeschlossen markieren:

```text
/goal complete pushed and verified
```

Löschen:

```text
/goal clear
```

## Wofür Ziele gedacht sind

Verwenden Sie ein Ziel, wenn eine Sitzung ein konkretes Ergebnis hat, das über
viele Turns hinweg sichtbar bleiben soll:

- Ein PR-Abschluss: beheben, verifizieren, Autoreview durchführen, pushen und den PR öffnen oder aktualisieren.
- Ein Debug-Lauf: den Fehler reproduzieren, die zuständige Oberfläche identifizieren, patchen und den Fix nachweisen.
- Ein Docs-Durchlauf: die relevanten Docs lesen, die neue Seite schreiben, querverlinken und den Docs-Build verifizieren.
- Eine Wartungsaufgabe: den aktuellen Zustand prüfen, begrenzte Änderungen vornehmen, die richtigen Checks ausführen und berichten, was sich geändert hat.

Ein Ziel ist keine Aufgabenwarteschlange. Verwenden Sie [TaskFlow](/de/automation/taskflow),
[Aufgaben](/de/automation/tasks), [Cronjobs](/de/automation/cron-jobs) oder
[Standing Orders](/de/automation/standing-orders), wenn Arbeit abgekoppelt laufen,
nach Zeitplan wiederholt werden, sich in verwaltete Teilaufgaben auffächern oder
als Richtlinie bestehen bleiben soll.

## Befehlsreferenz

`/goal` ohne Argumente gibt die aktuelle Zielzusammenfassung aus:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

Befehle:

- `/goal` oder `/goal status` zeigt das aktuelle Ziel.
- `/goal start <objective>` erstellt ein neues Ziel für die aktuelle Sitzung.
- `/goal set <objective>` und `/goal create <objective>` sind Aliasse für
  `start`.
- `/goal pause [note]` pausiert ein aktives Ziel.
- `/goal resume [note]` setzt ein pausiertes, blockiertes, nutzungslimitiertes oder
  budgetlimitiertes Ziel fort.
- `/goal complete [note]` markiert das Ziel als erreicht.
- `/goal done [note]` ist ein Alias für `complete`.
- `/goal block [note]` markiert das Ziel als blockiert.
- `/goal blocked [note]` ist ein Alias für `block`.
- `/goal clear` entfernt das Ziel aus der Sitzung.

Pro Sitzung kann jeweils nur ein Ziel existieren. Das Starten eines zweiten Ziels schlägt fehl,
bis das aktuelle gelöscht wurde.

## Status

Ziele verwenden eine kleine Statusmenge:

- `active`: Die Sitzung verfolgt das Ziel.
- `paused`: Der Operator hat das Ziel pausiert; `/goal resume` macht es wieder aktiv.
- `blocked`: Der Agent oder Operator hat einen echten Blocker gemeldet; `/goal resume`
  macht es wieder aktiv, wenn neue Informationen oder ein neuer Zustand verfügbar sind.
- `budget_limited`: Das konfigurierte Token-Budget wurde erreicht; `/goal resume`
  startet die Verfolgung desselben Zielvorhabens erneut.
- `usage_limited`: Für Stoppzustände aufgrund von Nutzungslimits reserviert; `/goal resume`
  startet die Verfolgung erneut, wenn sie erlaubt ist.
- `complete`: Das Ziel wurde erreicht. Abgeschlossene Ziele sind terminal; verwenden Sie
  `/goal clear`, bevor Sie ein anderes Ziel starten.

`/new` und `/reset` löschen das aktuelle Sitzungsziel, weil sie absichtlich
mit frischem Sitzungskontext beginnen.

## Token-Budgets

Ziele können ein optionales positives Token-Budget haben. Das Budget wird mit dem
Ziel gespeichert und ab dem frischen Token-Zähler der Sitzung zum Erstellungszeitpunkt gemessen. Wenn die
aktuelle Sitzung beim Start des Ziels nur veraltete oder unbekannte Token-Nutzung hat,
wartet OpenClaw auf den nächsten frischen Token-Snapshot der Sitzung und verwendet diesen als
Baseline, sodass Tokens, die vor dem Bestehen des Ziels verbraucht wurden, dem Ziel nicht berechnet werden.

Wenn die Token-Nutzung das Budget erreicht, wechselt das Ziel zu `budget_limited`. Dadurch
wird das Ziel nicht gelöscht und das Zielvorhaben nicht entfernt. Es teilt dem Operator und dem
Agenten mit, dass das Ziel nicht mehr aktiv verfolgt wird, bis es fortgesetzt oder
gelöscht wird.

Token-Budgets sind eine Leitplanke für Sitzungsziele, keine Abrechnungsobergrenze. Provider-Kontingente,
Kostenberichte und Kontextfensterverhalten verwenden weiterhin die normalen OpenClaw-
Nutzungs- und Modellsteuerungen.

## Modell-Tools

OpenClaw stellt Agent-Harnessen drei zentrale Ziel-Tools bereit:

- `get_goal`: das aktuelle Sitzungsziel lesen, einschließlich Status, Zielvorhaben, Token-
  Nutzung und Token-Budget.
- `create_goal`: ein Ziel nur erstellen, wenn Benutzer-, System- oder Entwickleranweisungen
  ausdrücklich eines anfordern. Es schlägt fehl, wenn die Sitzung bereits ein
  Ziel hat.
- `update_goal`: das Ziel als `complete` oder `blocked` markieren.

Das Modell kann ein Ziel nicht stillschweigend pausieren, fortsetzen, löschen oder ersetzen. Das sind
Operator-/Sitzungssteuerungen über `/goal` und Reset-Befehle. Dadurch wird verhindert, dass der
Agent das Ziel unbemerkt verschiebt, während ein klarer Weg erhalten bleibt, damit der
Agent Erfolg oder einen echten Blocker melden kann.

Das Tool `update_goal` sollte ein Ziel nur dann als `complete` markieren, wenn das Zielvorhaben
tatsächlich erreicht ist. Es sollte ein Ziel nur dann als `blocked` markieren, wenn dieselbe blockierende
Bedingung wiederholt aufgetreten ist und der Agent ohne neue Benutzereingabe oder eine externe
Zustandsänderung keinen sinnvollen Fortschritt machen kann.

## TUI

Die TUI hält das Ziel der aktiven Sitzung im Footer neben Agent,
Sitzung, Modell, Laufsteuerungen und Token-Zählern sichtbar.

Footer-Beispiele:

- `Pursuing goal (12k/50k)` für ein aktives Ziel mit Token-Budget.
- `Goal paused (/goal resume)` für ein pausiertes Ziel.
- `Goal blocked (/goal resume)` für ein blockiertes Ziel.
- `Goal hit usage limits (/goal resume)` für ein nutzungslimitiertes Ziel.
- `Goal unmet (50k/50k)` für ein budgetlimitiertes Ziel.
- `Goal achieved (42k)` für ein abgeschlossenes Ziel.

Der Footer ist absichtlich kompakt. Verwenden Sie `/goal` für das vollständige Zielvorhaben, die Notiz,
das Token-Budget und verfügbare Befehle.

## Channel-Verhalten

Der Befehl `/goal` funktioniert in befehlsfähigen OpenClaw-Sitzungen, einschließlich der
TUI und Chat-Oberflächen, die Textbefehle erlauben. Der Zielzustand ist an den
Sitzungsschlüssel angehängt, nicht an den Transport. Wenn zwei Oberflächen dieselbe Sitzung verwenden, sehen sie
dasselbe Ziel.

Der Zielzustand ist keine Zustellungsanweisung. Er erzwingt keine Antworten über einen
Channel, ändert kein Warteschlangenverhalten, genehmigt keine Tools und plant keine Arbeit ein.

## Fehlerbehebung

`Goal error: goal already exists` bedeutet, dass die Sitzung bereits ein Ziel hat. Verwenden Sie
`/goal`, um es zu prüfen, `/goal complete`, wenn es erledigt ist, oder `/goal clear`, bevor Sie
ein anderes Zielvorhaben starten.

`Goal error: goal not found` bedeutet, dass die Sitzung noch kein Ziel hat. Starten Sie eines mit
`/goal start <objective>`.

`Goal error: goal is already complete` bedeutet, dass das Ziel terminal ist. Löschen Sie es,
bevor Sie ein anderes Zielvorhaben starten oder fortsetzen.

Wenn die Token-Nutzung wie `0` aussieht oder veraltet ist, hat die aktive Sitzung möglicherweise noch keinen frischen
Token-Snapshot. Die Nutzung wird aktualisiert, während OpenClaw Sitzungsnutzung und
aus Transkripten abgeleitete Summen erfasst.

## Verwandte Themen

- [Slash-Befehle](/de/tools/slash-commands)
- [TUI](/de/web/tui)
- [Sitzungs-Tool](/de/concepts/session-tool)
- [Compaction](/de/concepts/compaction)
- [TaskFlow](/de/automation/taskflow)
- [Standing Orders](/de/automation/standing-orders)
