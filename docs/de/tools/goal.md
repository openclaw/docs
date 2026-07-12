---
doc-schema-version: 1
read_when:
    - Sie möchten, dass OpenClaw während einer langen Sitzung ein Ziel stets im Blick behält.
    - Sie müssen ein Sitzungsziel pausieren, fortsetzen, blockieren, abschließen oder löschen.
    - Sie möchten die Tools get_goal, create_goal und update_goal verstehen
    - Sie möchten sehen, wie Ziele in der TUI angezeigt werden.
summary: 'Sitzungsziele: dauerhafte Ziele pro Sitzung, /goal-Steuerung, Zielwerkzeuge für Modelle, Token-Budgets und TUI-Status'
title: Ziel
x-i18n:
    generated_at: "2026-07-12T02:13:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Ziel

Ein **Ziel** ist ein dauerhaftes Vorhaben, das der aktuellen OpenClaw-Sitzung zugeordnet ist.
Es gibt dem Agenten und dem Bediener ein gemeinsames Ziel für länger laufende Arbeiten,
ohne dieses Ziel in eine Hintergrundaufgabe, Erinnerung, einen Cron-Job oder
Dauerauftrag umzuwandeln.

Ziele sind Sitzungsstatus: Sie sind an den Sitzungsschlüssel gebunden, bleiben über
Prozessneustarts hinweg erhalten und erscheinen in `/goal`, den modellseitigen Zielwerkzeugen
und der Fußzeile der TUI.

## Schnellstart

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` ist optional: `/goal get CI green for PR 87469` erstellt ebenfalls ein Ziel,
da jeder Text nach `/goal`, der kein bekanntes Aktionswort ist, als neues
Vorhaben behandelt wird.

## Wofür Ziele vorgesehen sind

Verwenden Sie ein Ziel, wenn eine Sitzung ein konkretes Ergebnis erreichen soll, das über
viele Interaktionen hinweg sichtbar bleiben muss:

- Abschluss eines PR: korrigieren, überprüfen, automatisch prüfen, pushen und den PR öffnen oder aktualisieren.
- Ein Debugging-Durchlauf: den Fehler reproduzieren, den zuständigen Bereich ermitteln, korrigieren und
  die Korrektur nachweisen.
- Eine Dokumentationsüberarbeitung: die relevanten Dokumente lesen, die neue Seite verfassen, Querverweise hinzufügen und
  den Dokumentations-Build überprüfen.
- Eine Wartungsaufgabe: den aktuellen Zustand prüfen, begrenzte Änderungen vornehmen, die
  richtigen Prüfungen ausführen und die Änderungen dokumentieren.

Ein Ziel ist keine Aufgabenwarteschlange. Verwenden Sie [TaskFlow](/de/automation/taskflow),
[Aufgaben](/de/automation/tasks), [Cron-Jobs](/de/automation/cron-jobs) oder
[Daueraufträge](/de/automation/standing-orders), wenn Arbeiten unabhängig ausgeführt,
nach einem Zeitplan wiederholt, in verwaltete Teilaufgaben aufgegliedert oder als Richtlinie dauerhaft gespeichert werden sollen.

## Befehlsreferenz

`/goal` ohne Argumente gibt die Zusammenfassung des aktuellen Ziels aus:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Befehl                                             | Wirkung                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` oder `/goal status`                           | Zeigt das aktuelle Ziel an.                                                   |
| `/goal start <objective>`                           | Erstellt ein neues Ziel für die aktuelle Sitzung.                               |
| `/goal set <objective>`, `/goal create <objective>` | Aliasse für `start`.                                                     |
| `/goal <objective>`                                 | Erstellt ebenfalls ein neues Ziel (jeder Text, der kein erkanntes Aktionswort ist). |
| `/goal edit <objective>`                            | Formuliert das aktuelle Vorhaben neu; Status und Token-Erfassung bleiben unverändert.      |
| `/goal pause [note]`                                | Pausiert ein aktives Ziel.                                                    |
| `/goal resume [note]`                               | Setzt ein pausiertes, blockiertes, nutzungsbegrenztes oder budgetbegrenztes Ziel fort.         |
| `/goal complete [note]`                             | Markiert das Ziel als erreicht.                                                  |
| `/goal done [note]`                                 | Alias für `complete`.                                                    |
| `/goal block [note]`                                | Markiert das Ziel als blockiert.                                                   |
| `/goal blocked [note]`                              | Alias für `block`.                                                       |
| `/goal clear`                                       | Entfernt das Ziel aus der Sitzung.                                        |

Pro Sitzung kann jeweils nur ein Ziel vorhanden sein. Das Starten eines zweiten Ziels schlägt
mit `Goal error: goal already exists` fehl, bis das aktuelle Ziel gelöscht wird.

`/goal start` akzeptiert kein Flag für ein Token-Budget; ein Budget kann nur
über das modellseitige Werkzeug `create_goal` festgelegt werden.

## Statuswerte

- `active`: Die Sitzung verfolgt das Ziel.
- `paused`: Der Bediener hat das Ziel pausiert; `/goal resume` aktiviert es
  erneut.
- `blocked`: Der Agent oder Bediener hat eine tatsächliche Blockierung gemeldet; `/goal resume`
  aktiviert das Ziel erneut, sobald neue Informationen oder ein neuer Zustand verfügbar sind.
- `budget_limited`: Das konfigurierte Token-Budget wurde erreicht; `/goal resume`
  setzt die Verfolgung desselben Vorhabens mit einem neuen Budgetzeitraum fort.
- `usage_limited`: Für einen zukünftigen Stoppzustand bei Erreichen eines Nutzungslimits reserviert; `/goal
resume` setzt die Verfolgung auf dieselbe Weise fort.
- `complete`: Das Ziel wurde erreicht. Abgeschlossene Ziele sind endgültig; verwenden Sie `/goal
clear`, bevor Sie ein weiteres Ziel starten.

`/new` und `/reset` löschen das aktuelle Sitzungsziel, da sie absichtlich
einen neuen Sitzungskontext beginnen.

## Token-Budgets

Ziele können ein optionales positives Token-Budget haben, das über den Parameter
`token_budget` des Werkzeugs `create_goal` festgelegt wird. Das Budget wird ausgehend von der
aktuellen Token-Anzahl der Sitzung zum Zeitpunkt der Zielerstellung gemessen. Wenn für die Sitzung beim Start des Ziels nur
eine veraltete oder unbekannte Token-Momentaufnahme vorliegt, wartet OpenClaw auf die
nächste aktuelle Momentaufnahme und verwendet diese als Ausgangswert, sodass vor der
Erstellung des Ziels verbrauchte Tokens nicht darauf angerechnet werden.

Wenn die Nutzung das Budget erreicht, wechselt das Ziel zu `budget_limited`. Dadurch wird
das Ziel weder gelöscht noch das Vorhaben entfernt; der Status informiert den Bediener und den
Agenten darüber, dass das Ziel nicht mehr aktiv verfolgt wird, bis es fortgesetzt oder
gelöscht wird. Beim Fortsetzen beginnt ein neuer Budgetzeitraum mit der aktuellen
Token-Anzahl.

Token-Budgets sind eine Schutzvorgabe für Sitzungsziele und keine Kostenobergrenze. Provider-
Kontingente, Kostenberichte und das Verhalten des Kontextfensters verwenden weiterhin die normalen
Nutzungs- und Modellsteuerungen von OpenClaw.

## Modellwerkzeuge

OpenClaw stellt Agent-Harnesses drei Zielwerkzeuge zur Verfügung:

| Werkzeug          | Zweck                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Liest das aktuelle Sitzungsziel: Status, Vorhaben, Token-Nutzung und Token-Budget.                                         |
| `create_goal` | Erstellt nur dann ein Ziel, wenn die Benutzer- oder Systemanweisungen dies ausdrücklich verlangen. Schlägt fehl, wenn die Sitzung bereits ein Ziel besitzt. |
| `update_goal` | Markiert das Ziel als `complete` oder `blocked`.                                                                                   |

Das Modell kann ein Ziel nicht unbemerkt pausieren, fortsetzen, löschen oder ersetzen. Diese Aktionen bleiben
Bediener- beziehungsweise Sitzungssteuerungen über `/goal` und Zurücksetzungsbefehle, sodass der Agent
das Erreichen des Ziels oder eine tatsächliche Blockierung melden kann, ohne unbemerkt das
Ziel zu verschieben.

`update_goal` sollte ein Ziel nur dann als `complete` markieren, wenn das Vorhaben
tatsächlich erreicht wurde. Es sollte ein Ziel nur dann als `blocked` markieren, wenn
dieselbe blockierende Bedingung in mindestens drei aufeinanderfolgenden Zielinteraktionen erneut auftritt, nicht bei
gewöhnlichen Schwierigkeiten oder fehlendem Feinschliff.

## Zielkontext bei jeder Interaktion

Jede Benutzer-/Chat-Interaktion mit einem aktiven Ziel enthält diese Kontextzeile in der Benutzerrolle:

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw hält die Zeile kompakt, indem lange Vorhaben gekürzt werden. Pausierte,
blockierte, budgetbegrenzte, nutzungsbegrenzte und abgeschlossene Ziele werden nicht eingefügt,
sodass ein Stopp durch den Bediener wirksam bleibt, bis das Ziel fortgesetzt wird.

## Control UI

Die webbasierte Control UI zeigt das Ziel als kompakte Plakette oberhalb des Chat-Eingabefelds:
ein Statussymbol, die Statusbezeichnung (beispielsweise `Pursuing goal`), das gekürzte
Vorhaben und einen laufend aktualisierten Timer für die verstrichene Zeit.

Die Plakette enthält folgende Inline-Steuerelemente:

- **Stift** füllt das Eingabefeld mit `/goal edit <objective>` vor, sodass das
  Vorhaben neu formuliert und übermittelt werden kann.
- **Pausieren / fortsetzen** wechselt abhängig vom aktuellen Status zwischen `/goal pause` und `/goal resume`.
- **Papierkorb** sendet `/goal clear`.
- **Chevron** erweitert die Plakette und zeigt das vollständige Vorhaben, die neueste Statusnotiz,
  die Token-Nutzung und die verstrichene Zeit an.

Die Aktionsschaltflächen sind ausgeblendet, solange das Eingabefeld nichts senden kann (beispielsweise
wenn die Gateway-Verbindung unterbrochen ist); der Chevron zum Erweitern funktioniert weiterhin.

## TUI

Die Fußzeile der TUI hält das Ziel der aktiven Sitzung neben den Feldern für Agent,
Sitzung und Modell und vor den Token-/Modusanzeigen sichtbar.

Beispiele für die Fußzeile:

- `Pursuing goal (12k/50k)` für ein aktives Ziel mit Token-Budget.
- `Goal paused (/goal resume)` für ein pausiertes Ziel.
- `Goal blocked (/goal resume)` für ein blockiertes Ziel.
- `Goal hit usage limits (/goal resume)` für ein nutzungsbegrenztes Ziel.
- `Goal unmet (50k/50k)` für ein budgetbegrenztes Ziel.
- `Goal achieved (42k)` für ein abgeschlossenes Ziel.

Die Fußzeile ist bewusst kompakt gehalten. Verwenden Sie `/goal`, um das vollständige Vorhaben,
die Notiz, das Token-Budget und die verfügbaren Befehle anzuzeigen.

## Kanalverhalten

`/goal` funktioniert in befehlsfähigen OpenClaw-Sitzungen, einschließlich der TUI und
Chat-Oberflächen, die Textbefehle zulassen. Der Zielstatus ist an den
Sitzungsschlüssel und nicht an den Transport gebunden, sodass zwei Oberflächen mit demselben Sitzungsschlüssel
dasselbe Ziel sehen.

Der Zielstatus ist keine Zustellanweisung: Er erzwingt keine Antworten über einen
Kanal, ändert nicht das Warteschlangenverhalten, genehmigt keine Werkzeuge und plant keine Arbeiten.

## Fehlerbehebung

| Meldung                                | Bedeutung                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | Die Sitzung besitzt bereits ein Ziel. Verwenden Sie `/goal`, um es zu prüfen, `/goal complete`, wenn es abgeschlossen ist, oder `/goal clear`, bevor Sie ein anderes Vorhaben starten. |
| `Goal error: goal not found`           | Die Sitzung besitzt noch kein Ziel. Starten Sie eines mit `/goal start <objective>`.                                                                       |
| `Goal error: goal is already complete` | Das Ziel ist endgültig abgeschlossen. Löschen Sie es, bevor Sie ein anderes Vorhaben starten oder fortsetzen.                                                                |

Wenn die Token-Nutzung `0` anzeigt oder veraltet erscheint, liegt für die aktive Sitzung möglicherweise noch keine
aktuelle Token-Momentaufnahme vor. Die Nutzung wird aktualisiert, sobald OpenClaw die Sitzungsnutzung
und aus dem Transkript abgeleitete Summen erfasst.

## Verwandte Themen

- [Slash-Befehle](/de/tools/slash-commands)
- [TUI](/de/web/tui)
- [Sitzungswerkzeug](/de/concepts/session-tool)
- [Compaction](/de/concepts/compaction)
- [TaskFlow](/de/automation/taskflow)
- [Daueraufträge](/de/automation/standing-orders)
