---
doc-schema-version: 1
read_when:
    - Sie möchten, dass OpenClaw ein Ziel während einer langen Sitzung stets sichtbar hält
    - Sie müssen ein Sitzungsziel pausieren, fortsetzen, blockieren, abschließen oder löschen
    - Sie möchten die Tools get_goal, create_goal und update_goal verstehen
    - Sie möchten sehen, wie Ziele in der TUI angezeigt werden
summary: 'Sitzungsziele: dauerhafte Ziele pro Sitzung, /goal-Steuerung, Modellwerkzeuge für Ziele, Token-Budgets und TUI-Status'
title: Ziel
x-i18n:
    generated_at: "2026-07-12T16:04:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Ziel

Ein **Ziel** ist ein dauerhaftes Ziel, das der aktuellen OpenClaw-Sitzung zugeordnet ist.
Es gibt dem Agenten und dem Bediener ein gemeinsames Ziel für länger laufende Arbeiten,
ohne dieses Ziel in eine Hintergrundaufgabe, Erinnerung, einen Cron-Job oder
Dauerauftrag umzuwandeln.

Ziele sind Sitzungsstatus: Sie werden mit dem Sitzungsschlüssel übertragen, bleiben über
Prozessneustarts hinweg erhalten und werden in `/goal`, den modellseitigen Zielwerkzeugen und der
Fußzeile der TUI angezeigt.

## Schnellstart

```text
/goal start CI für PR 87469 grün bekommen und die Korrektur pushen
/goal
/goal edit CI für PR 87469 grün bekommen, die Korrektur pushen und die Dokumentation aktualisieren
/goal pause auf CI warten
/goal resume
/goal complete gepusht und verifiziert
/goal clear
```

`start` ist optional: `/goal get CI green for PR 87469` erstellt ebenfalls ein Ziel,
da jeder Text nach `/goal`, der kein bekanntes Aktionswort ist, als neues
Ziel behandelt wird.

## Wofür Ziele gedacht sind

Verwenden Sie ein Ziel, wenn eine Sitzung ein konkretes Ergebnis hat, das über
viele Gesprächsrunden hinweg sichtbar bleiben soll:

- Abschluss eines PRs: korrigieren, überprüfen, Autoreview durchführen, pushen und den PR öffnen oder aktualisieren.
- Ein Debugging-Durchlauf: den Fehler reproduzieren, den zuständigen Bereich identifizieren, korrigieren und
  die Fehlerbehebung nachweisen.
- Eine Dokumentationsrunde: die relevanten Dokumente lesen, die neue Seite verfassen, Querverweise hinzufügen und
  den Dokumentations-Build überprüfen.
- Eine Wartungsaufgabe: den aktuellen Zustand prüfen, begrenzte Änderungen vornehmen, die
  richtigen Prüfungen ausführen und über die Änderungen berichten.

Ein Ziel ist keine Aufgabenwarteschlange. Verwenden Sie [TaskFlow](/de/automation/taskflow),
[Aufgaben](/de/automation/tasks), [Cron-Jobs](/de/automation/cron-jobs) oder
[ständige Anweisungen](/de/automation/standing-orders), wenn Arbeiten entkoppelt ausgeführt,
nach einem Zeitplan wiederholt, in verwaltete Unteraufgaben aufgegliedert oder dauerhaft als Richtlinie festgelegt werden sollen.

## Befehlsreferenz

`/goal` ohne Argumente gibt die Zusammenfassung des aktuellen Ziels aus:

```text
Ziel
Status: aktiv
Zielsetzung: CI für PR 87469 erfolgreich abschließen und die Korrektur pushen
Verwendete Tokens: 12k
Token-Budget: 12k/50k

Befehle: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Befehl                                              | Wirkung                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/goal` oder `/goal status`                         | Zeigt das aktuelle Ziel an.                                                                 |
| `/goal start <objective>`                           | Erstellt ein neues Ziel für die aktuelle Sitzung.                                            |
| `/goal set <objective>`, `/goal create <objective>` | Aliase für `start`.                                                                          |
| `/goal <objective>`                                 | Erstellt ebenfalls ein neues Ziel (beliebiger Text, der kein erkannter Aktionsbegriff ist). |
| `/goal edit <objective>`                            | Formuliert die aktuelle Zielsetzung neu; Status und Token-Abrechnung bleiben unverändert.    |
| `/goal pause [note]`                                | Pausiert ein aktives Ziel.                                                                   |
| `/goal resume [note]`                               | Setzt ein pausiertes, blockiertes, nutzungsbegrenztes oder budgetbegrenztes Ziel fort.       |
| `/goal complete [note]`                             | Markiert das Ziel als erreicht.                                                              |
| `/goal done [note]`                                 | Alias für `complete`.                                                                        |
| `/goal block [note]`                                | Markiert das Ziel als blockiert.                                                             |
| `/goal blocked [note]`                              | Alias für `block`.                                                                           |
| `/goal clear`                                       | Entfernt das Ziel aus der Sitzung.                                                           |

Pro Sitzung kann jeweils nur ein Ziel vorhanden sein. Das Starten eines zweiten Ziels schlägt
mit `Goal error: goal already exists` fehl, bis das aktuelle Ziel gelöscht wurde.

`/goal start` akzeptiert kein Flag für das Token-Budget; ein Budget kann nur
über das modellseitige Tool `create_goal` festgelegt werden.

## Status

- `active`: Die Sitzung verfolgt das Ziel.
- `paused`: Der Operator hat das Ziel pausiert; `/goal resume` aktiviert es
  wieder.
- `blocked`: Der Agent oder Operator hat eine tatsächliche Blockierung gemeldet; `/goal resume`
  aktiviert das Ziel wieder, sobald neue Informationen oder ein neuer Zustand verfügbar sind.
- `budget_limited`: Das konfigurierte Token-Budget wurde erreicht; `/goal resume`
  setzt die Verfolgung derselben Zielsetzung mit einem neuen Budgetfenster fort.
- `usage_limited`: Für einen zukünftigen Stoppzustand aufgrund eines Nutzungslimits reserviert; `/goal
resume` setzt die Verfolgung auf dieselbe Weise fort.
- `complete`: Das Ziel wurde erreicht. Abgeschlossene Ziele sind endgültig; verwenden Sie `/goal
clear`, bevor Sie ein weiteres Ziel starten.

`/new` und `/reset` löschen das aktuelle Sitzungsziel, da sie absichtlich
einen neuen Sitzungskontext beginnen.

## Tokenbudgets

Ziele können über den Parameter `token_budget` des Tools `create_goal` ein optionales
positives Tokenbudget erhalten. Das Budget wird ab dem aktuellen Tokenstand
der Sitzung zum Zeitpunkt der Zielerstellung gemessen. Wenn zu Beginn des Ziels
nur ein veralteter oder unbekannter Token-Snapshot der Sitzung vorliegt, wartet OpenClaw
auf den nächsten aktuellen Snapshot und verwendet diesen als Ausgangswert, sodass Tokens,
die vor der Erstellung des Ziels verbraucht wurden, diesem nicht angerechnet werden.

Wenn die Nutzung das Budget erreicht, wechselt das Ziel in den Zustand `budget_limited`. Dadurch
wird das Ziel nicht gelöscht und die Zielsetzung nicht verworfen; es teilt dem Bediener und dem
Agenten mit, dass das Ziel nicht mehr aktiv verfolgt wird, bis es fortgesetzt oder
gelöscht wird. Beim Fortsetzen beginnt ein neues Budgetfenster beim aktuellen
Tokenstand.

Tokenbudgets sind ein Schutzmechanismus für Sitzungsziele und keine Abrechnungsobergrenze. Provider-
Kontingente, Kostenberichte und das Verhalten des Kontextfensters verwenden weiterhin die normalen
Nutzungs- und Modellsteuerungen von OpenClaw.

## Modell-Tools

OpenClaw stellt Agent-Harnesses drei Ziel-Tools zur Verfügung:

| Tool          | Zweck                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Das aktuelle Sitzungsziel auslesen: Status, Zielsetzung, Token-Nutzung und Token-Budget.                                  |
| `create_goal` | Ein Ziel nur erstellen, wenn die Benutzer- oder Systemanweisungen ausdrücklich dazu auffordern. Schlägt fehl, wenn die Sitzung bereits ein Ziel hat. |
| `update_goal` | Das Ziel als `complete` oder `blocked` markieren.                                                                         |

Das Modell kann ein Ziel nicht unbemerkt pausieren, fortsetzen, löschen oder
ersetzen. Dies bleibt über `/goal` und Zurücksetzungsbefehle der Steuerung
durch den Operator bzw. die Sitzung vorbehalten, sodass der Agent das Erreichen
des Ziels oder eine tatsächliche Blockierung melden kann, ohne das Ziel
unbemerkt zu verschieben.

`update_goal` sollte ein Ziel nur dann als `complete` markieren, wenn die
Zielsetzung tatsächlich erreicht wurde. Ein Ziel sollte nur dann als `blocked`
markiert werden, wenn dieselbe blockierende Bedingung in mindestens drei
aufeinanderfolgenden Zieldurchläufen erneut auftritt, nicht bei gewöhnlichen
Schwierigkeiten oder fehlendem Feinschliff.

## Zielkontext bei jedem Durchlauf

Jeder Benutzer-/Chat-Durchlauf mit einem aktiven Ziel enthält diese Kontextzeile
mit der Benutzerrolle:

```text
Aktives Ziel: <objective> — treiben Sie es voran oder aktualisieren Sie seinen Status (get_goal/update_goal).
```

OpenClaw hält die Zeile kompakt, indem lange Zielbeschreibungen gekürzt werden. Pausierte,
blockierte, budgetbegrenzte, nutzungsbegrenzte und abgeschlossene Ziele werden nicht eingefügt,
sodass ein Stopp durch den Operator wirksam bleibt, bis das Ziel fortgesetzt wird.

## Control UI

Die webbasierte Control UI zeigt das Ziel als kompakte Schaltfläche über dem Chat-Eingabefeld:
ein Statussymbol, die Statusbezeichnung (zum Beispiel `Pursuing goal`), die gekürzte
Zielbeschreibung und einen laufend aktualisierten Timer für die verstrichene Zeit.

Die Schaltfläche enthält direkt eingebettete Steuerelemente:

- **Stift** füllt das Eingabefeld mit `/goal edit <objective>` vor, sodass die
  Zielbeschreibung umformuliert und gesendet werden kann.
- **Pausieren / fortsetzen** wechselt abhängig vom aktuellen Status zwischen
  `/goal pause` und `/goal resume`.
- **Papierkorb** sendet `/goal clear`.
- **Chevron-Symbol** erweitert die Schaltfläche und zeigt die vollständige Zielbeschreibung, den neuesten
  Statushinweis, die Token-Nutzung und die verstrichene Zeit an.

Die Aktionsschaltflächen sind ausgeblendet, solange über das Eingabefeld nichts gesendet werden kann (zum Beispiel,
wenn die Gateway-Verbindung unterbrochen ist); das Chevron-Symbol zum Erweitern funktioniert weiterhin.

## TUI

In der Fußzeile der TUI bleibt das Ziel der aktiven Sitzung neben den Feldern für Agent,
Sitzung und Modell vor den Token-/Modusindikatoren sichtbar.

Beispiele für die Fußzeile:

- `Pursuing goal (12k/50k)` für ein aktives Ziel mit einem Token-Budget.
- `Goal paused (/goal resume)` für ein pausiertes Ziel.
- `Goal blocked (/goal resume)` für ein blockiertes Ziel.
- `Goal hit usage limits (/goal resume)` für ein durch Nutzungslimits eingeschränktes Ziel.
- `Goal unmet (50k/50k)` für ein durch das Budget begrenztes Ziel.
- `Goal achieved (42k)` für ein abgeschlossenes Ziel.

Die Fußzeile ist bewusst kompakt gehalten. Verwenden Sie `/goal` für die vollständige Zielsetzung,
Notiz, das Token-Budget und die verfügbaren Befehle.

## Kanalverhalten

`/goal` funktioniert in befehlsfähigen OpenClaw-Sitzungen, einschließlich der TUI und
Chat-Oberflächen, die Textbefehle zulassen. Der Zielstatus ist an den
Sitzungsschlüssel gebunden, nicht an den Transport. Daher wird auf zwei Oberflächen mit demselben Sitzungsschlüssel
dasselbe Ziel angezeigt.

Der Zielstatus ist keine Zustellungsanweisung: Er erzwingt keine Antworten über einen
Kanal, ändert nicht das Warteschlangenverhalten, genehmigt keine Tools und plant keine Arbeit.

## Fehlerbehebung

| Meldung                                | Bedeutung                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | Die Sitzung hat bereits ein Ziel. Verwenden Sie `/goal`, um es anzuzeigen, `/goal complete`, wenn es erreicht ist, oder `/goal clear`, bevor Sie eine andere Zielsetzung beginnen. |
| `Goal error: goal not found`           | Die Sitzung hat noch kein Ziel. Starten Sie eines mit `/goal start <objective>`.                                                                       |
| `Goal error: goal is already complete` | Das Ziel befindet sich in einem Endzustand. Löschen Sie es, bevor Sie eine andere Zielsetzung beginnen oder fortsetzen.                                                                |

Wenn die Token-Nutzung `0` anzeigt oder veraltet erscheint, verfügt die aktive Sitzung möglicherweise noch nicht über einen
aktuellen Token-Snapshot. Die Nutzung wird aktualisiert, sobald OpenClaw die Sitzungsnutzung
und aus dem Transkript abgeleitete Summen erfasst.

## Verwandte Themen

- [Slash-Befehle](/de/tools/slash-commands)
- [TUI](/de/web/tui)
- [Sitzungstool](/de/concepts/session-tool)
- [Compaction](/de/concepts/compaction)
- [TaskFlow](/de/automation/taskflow)
- [Daueraufträge](/de/automation/standing-orders)
