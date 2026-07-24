---
doc-schema-version: 1
read_when:
    - Sie möchten, dass OpenClaw während einer langen Sitzung ein Ziel stets sichtbar hält
    - Sie müssen ein Sitzungsziel pausieren, fortsetzen, blockieren, abschließen oder löschen.
    - Sie möchten die Tools get_goal, create_goal und update_goal verstehen
    - Sie möchten sehen, wie Ziele in der TUI angezeigt werden
summary: 'Sitzungsziele: dauerhafte sitzungsbezogene Zielsetzungen, /goal-Steuerung, Modell-Zieltools, Token-Budgets und TUI-Status'
title: Ziel
x-i18n:
    generated_at: "2026-07-24T05:20:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8bfe25eb9901394b32b61729fbcb6a7bd711ed859d284fa39b637000ed7f0a18
    source_path: tools/goal.md
    workflow: 16
---

# Ziel

Ein **Ziel** ist ein dauerhaftes Vorhaben, das der aktuellen OpenClaw-Sitzung zugeordnet ist.
Es gibt dem Agenten und dem Bediener ein gemeinsames Ziel für länger laufende Arbeiten,
ohne dieses Ziel in eine Hintergrundaufgabe, Erinnerung, einen Cron-Job oder
Dauerauftrag umzuwandeln.

Ziele sind Sitzungszustand: Sie werden mit dem Sitzungsschlüssel übertragen, bleiben über
Prozessneustarts hinweg erhalten und erscheinen in `/goal`, den modellseitigen Zielwerkzeugen und der
Fußzeile der TUI.

Abgeschlossene entkoppelte Befehle kehren zum ursprünglichen benutzerseitigen Thread zurück, sodass
der nächste Durchlauf weiterhin dasselbe Ziel sieht, selbst wenn die Befehlsausführung
eine separate Sitzung mit eigenen Sandbox-Richtlinien verwendet hat.

## Schnellstart

```text
/goal start CI für PR 87469 erfolgreich abschließen und die Korrektur pushen
/goal
/goal edit CI für PR 87469 erfolgreich abschließen, die Korrektur pushen und die Dokumentation aktualisieren
/goal pause auf CI warten
/goal resume
/goal complete gepusht und verifiziert
/goal clear
```

`start` ist optional: `/goal get CI green for PR 87469` erstellt ebenfalls ein Ziel,
da jeder Text nach `/goal`, der kein bekanntes Aktionswort ist, als
neues Vorhaben behandelt wird.

## Wofür Ziele vorgesehen sind

Verwenden Sie ein Ziel, wenn eine Sitzung ein konkretes Ergebnis hat, das über
viele Durchläufe hinweg sichtbar bleiben soll:

- Abschluss eines PR: korrigieren, verifizieren, automatisch prüfen, pushen und den PR öffnen oder aktualisieren.
- Ein Debugging-Durchlauf: den Fehler reproduzieren, die zuständige Oberfläche ermitteln, korrigieren und
  die Korrektur nachweisen.
- Eine Dokumentationsüberarbeitung: die relevante Dokumentation lesen, die neue Seite verfassen, Querverweise hinzufügen und
  den Dokumentations-Build verifizieren.
- Eine Wartungsaufgabe: den aktuellen Zustand prüfen, begrenzte Änderungen vornehmen, die
  richtigen Prüfungen ausführen und die Änderungen melden.

Ein Ziel ist keine Aufgabenwarteschlange. Verwenden Sie [Task Flow](/de/automation/taskflow),
[Aufgaben](/de/automation/tasks), [Cron-Jobs](/de/automation/cron-jobs) oder
[Daueraufträge](/de/automation/standing-orders), wenn Arbeiten entkoppelt ausgeführt,
nach einem Zeitplan wiederholt, in verwaltete Unteraufgaben aufgefächert oder als Richtlinie beibehalten werden sollen.

## Befehlsreferenz

`/goal` ohne Argumente gibt die aktuelle Zielübersicht aus:

```text
Ziel
Status: aktiv
Vorhaben: CI für PR 87469 erfolgreich abschließen und die Korrektur pushen
Verwendete Tokens: 12k
Token-Budget: 12k/50k

Befehle: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Befehl                                             | Wirkung                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` oder `/goal status`                           | Zeigt das aktuelle Ziel an.                                                   |
| `/goal start <objective>`                           | Erstellt ein neues Ziel für die aktuelle Sitzung.                               |
| `/goal set <objective>`, `/goal create <objective>` | Aliase für `start`.                                                     |
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
mit `Goal error: goal already exists` fehl, bis das aktuelle Ziel gelöscht wurde.

`/goal start` akzeptiert kein Flag für das Token-Budget; ein Budget kann nur
über das modellseitige Werkzeug `create_goal` festgelegt werden.

## Status

- `active`: Die Sitzung verfolgt das Ziel.
- `paused`: Der Bediener hat das Ziel pausiert; `/goal resume` aktiviert es
  erneut.
- `blocked`: Der Agent oder Bediener hat einen tatsächlichen Blocker gemeldet; `/goal resume`
  aktiviert es erneut, sobald neue Informationen oder ein neuer Zustand verfügbar sind.
- `budget_limited`: Das konfigurierte Token-Budget wurde erreicht; `/goal resume`
  setzt die Verfolgung desselben Vorhabens mit einem neuen Budgetzeitraum fort.
- `usage_limited`: Für einen zukünftigen Stoppzustand aufgrund eines Nutzungslimits reserviert; `/goal
resume` setzt die Verfolgung auf dieselbe Weise fort.
- `complete`: Das Ziel wurde erreicht. Abgeschlossene Ziele sind endgültig; verwenden Sie `/goal
clear`, bevor Sie ein weiteres Ziel starten.

`/new` und `/reset` löschen das aktuelle Sitzungsziel, da sie absichtlich
einen neuen Sitzungskontext beginnen.

## Token-Budgets

Ziele können über ein optionales positives Token-Budget verfügen, das über den Parameter
`token_budget` des Werkzeugs `create_goal` festgelegt wird. Das Budget wird ab dem
aktuellen Token-Zählerstand der Sitzung zum Zeitpunkt der Zielerstellung gemessen. Wenn die Sitzung beim
Start des Ziels nur über einen veralteten oder unbekannten Token-Schnappschuss verfügt, wartet OpenClaw auf den
nächsten aktuellen Schnappschuss und verwendet diesen als Ausgangswert, sodass Tokens, die vor dem
Bestehen des Ziels verbraucht wurden, diesem nicht angerechnet werden.

Wenn die Nutzung das Budget erreicht, wechselt das Ziel zu `budget_limited`. Dadurch wird
das Ziel weder gelöscht noch das Vorhaben entfernt; es teilt dem Bediener und dem
Agenten mit, dass das Ziel nicht mehr aktiv verfolgt wird, bis es fortgesetzt oder
gelöscht wird. Beim Fortsetzen beginnt ein neuer Budgetzeitraum mit dem aktuellen
Token-Zählerstand.

Token-Budgets sind eine Schutzvorgabe für Sitzungsziele und keine Abrechnungsobergrenze. Provider-
Kontingente, Kostenberichte und das Verhalten des Kontextfensters verwenden weiterhin die normalen
Nutzungs- und Modellsteuerungen von OpenClaw.

## Modellwerkzeuge

OpenClaw stellt Agent-Harnesses drei Zielwerkzeuge bereit:

| Werkzeug          | Zweck                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Liest das aktuelle Sitzungsziel: Status, Vorhaben, Token-Nutzung und Token-Budget.                                         |
| `create_goal` | Erstellt nur dann ein Ziel, wenn der Benutzer oder die Systemanweisungen dies ausdrücklich verlangen. Schlägt fehl, wenn die Sitzung bereits ein Ziel hat. |
| `update_goal` | Markiert das Ziel als `complete` oder `blocked`.                                                                                   |

Das Modell kann ein Ziel nicht unbemerkt pausieren, fortsetzen, löschen oder ersetzen. Dies bleiben
Bediener- und Sitzungssteuerungen über `/goal` und Zurücksetzungsbefehle, sodass der Agent
das Erreichen oder einen tatsächlichen Blocker melden kann, ohne das
Ziel unbemerkt zu verändern.

`update_goal` sollte ein Ziel nur dann als `complete` markieren, wenn das Vorhaben
tatsächlich erreicht wurde. Es sollte ein Ziel nur dann als `blocked` markieren, wenn derselbe
blockierende Zustand in mindestens drei aufeinanderfolgenden Zieldurchläufen erneut auftritt, nicht bei
gewöhnlichen Schwierigkeiten oder fehlendem Feinschliff.

## Zielkontext bei jedem Durchlauf

Jeder Benutzer-/Chat-Durchlauf mit einem aktiven Ziel enthält diese Kontextzeile mit Benutzerrolle:

```text
Aktives Ziel: <objective> — voranbringen oder seinen Status aktualisieren (get_goal/update_goal).
```

OpenClaw hält die Zeile kompakt, indem lange Vorhaben gekürzt werden. Pausierte,
blockierte, budgetbegrenzte, nutzungsbegrenzte und abgeschlossene Ziele werden nicht eingefügt,
sodass ein Stopp durch den Bediener wirksam bleibt, bis das Ziel fortgesetzt wird.

## Control UI

Die webbasierte Control UI zeigt das Ziel als kompakte Kapsel oberhalb des Chat-Eingabefelds:
ein Statussymbol, die Statusbezeichnung (zum Beispiel `Pursuing goal`), das gekürzte
Vorhaben und einen live aktualisierten Zeitgeber für die verstrichene Zeit.

Die Kapsel enthält Inline-Steuerelemente:

- **Stift** füllt das Eingabefeld mit `/goal edit <objective>` vor, damit das
  Vorhaben neu formuliert und übermittelt werden kann.
- **Pausieren / fortsetzen** wechselt abhängig vom aktuellen Status zwischen `/goal pause` und `/goal resume`.
- **Papierkorb** sendet `/goal clear`.
- **Chevron** erweitert die Kapsel, um das vollständige Vorhaben, die neueste Statusnotiz,
  die Token-Nutzung und die verstrichene Zeit anzuzeigen.

Die Aktionsschaltflächen werden ausgeblendet, solange das Eingabefeld nichts senden kann (zum Beispiel,
wenn die Gateway-Verbindung unterbrochen ist); der Chevron zum Erweitern funktioniert weiterhin.

## TUI

Die Fußzeile der TUI hält das Ziel der aktiven Sitzung neben den Feldern für Agent,
Sitzung und Modell sowie vor den Token-/Modusindikatoren sichtbar.

Beispiele für die Fußzeile:

- `Pursuing goal (12k/50k)` für ein aktives Ziel mit einem Token-Budget.
- `Goal paused (/goal resume)` für ein pausiertes Ziel.
- `Goal blocked (/goal resume)` für ein blockiertes Ziel.
- `Goal hit usage limits (/goal resume)` für ein nutzungsbegrenztes Ziel.
- `Goal unmet (50k/50k)` für ein budgetbegrenztes Ziel.
- `Goal achieved (42k)` für ein abgeschlossenes Ziel.

Die Fußzeile ist bewusst kompakt gehalten. Verwenden Sie `/goal` für das vollständige Vorhaben,
die Notiz, das Token-Budget und die verfügbaren Befehle.

## Kanalverhalten

`/goal` funktioniert in befehlsfähigen OpenClaw-Sitzungen, einschließlich der TUI und
Chat-Oberflächen, die Textbefehle zulassen. Der Zielzustand ist dem
Sitzungsschlüssel und nicht dem Transport zugeordnet, sodass zwei Oberflächen mit demselben Sitzungsschlüssel
dasselbe Ziel sehen.

Der Zielzustand ist keine Zustellanweisung: Er erzwingt keine Antworten über einen
Kanal, ändert nicht das Warteschlangenverhalten, genehmigt keine Werkzeuge und plant keine Arbeiten.

## Fehlerbehebung

| Meldung                                | Bedeutung                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | Die Sitzung hat bereits ein Ziel. Verwenden Sie `/goal`, um es zu prüfen, `/goal complete`, wenn es abgeschlossen ist, oder `/goal clear`, bevor Sie ein anderes Vorhaben starten. |
| `Goal error: goal not found`           | Die Sitzung hat noch kein Ziel. Starten Sie eines mit `/goal start <objective>`.                                                                       |
| `Goal error: goal is already complete` | Das Ziel ist endgültig. Löschen Sie es, bevor Sie ein anderes Vorhaben starten oder fortsetzen.                                                                |

Wenn die Token-Nutzung `0` anzeigt oder veraltet wirkt, verfügt die aktive Sitzung möglicherweise noch nicht über einen
aktuellen Token-Schnappschuss. Die Nutzung wird aktualisiert, wenn OpenClaw die Sitzungsnutzung
und aus dem Transkript abgeleitete Gesamtwerte erfasst.

## Verwandte Themen

- [Slash-Befehle](/de/tools/slash-commands)
- [TUI](/de/web/tui)
- [Sitzungswerkzeug](/de/concepts/session-tool)
- [Compaction](/de/concepts/compaction)
- [Task Flow](/de/automation/taskflow)
- [Daueraufträge](/de/automation/standing-orders)
