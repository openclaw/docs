---
read_when:
    - Sie möchten Workboard-Karten im Terminal prüfen oder erstellen
    - Sie möchten Workboard-Worker-Läufe über die CLI starten
    - Sie debuggen das Verhalten der Workboard-CLI oder von Slash-Befehlen
summary: CLI-Referenz für `openclaw workboard`-Karten, Dispatch und Worker-Ausführungen
title: Workboard-CLI
x-i18n:
    generated_at: "2026-07-16T12:38:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` ist die Terminaloberfläche für das mitgelieferte [Workboard-Plugin](/de/plugins/workboard). Damit kann ein Operator Karten auflisten, eine Karte erstellen, eine einzelne Karte prüfen und das laufende Gateway anweisen, bereite Aufgaben an Subagent-Worker-Läufe zu verteilen.

Aktivieren Sie das Plugin, bevor Sie den Befehl verwenden:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Verwendung

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Der Befehl liest und schreibt dieselbe Plugin-eigene SQLite-Datenbank, die vom Dashboard und den Workboard-Agent-Tools verwendet wird. Karten-IDs sind UUIDs; Befehle, die eine Karten-ID akzeptieren, akzeptieren auch ein eindeutiges ID-Präfix (die kompakte Textausgabe zeigt die ersten 8 Zeichen).

Gültige Werte für `status`: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Gültige Werte für `priority`: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Die Textausgabe ist kompakt:

```text
7f4a2c10  ready     high    default agent-a  Veralteten Worker-Heartbeat beheben
```

Die Spalten enthalten ID-Präfix, Status, Priorität, Board-ID, optionale Agent-ID und Titel.

| Flag                 | Zweck                                         |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Ergebnisse auf einen Board-Namensraum begrenzen |
| `--status <status>`  | Ergebnisse auf einen Workboard-Status begrenzen |
| `--include-archived` | Archivierte Karten in die kompakte Textausgabe aufnehmen |
| `--json`             | Die vollständige Kartenliste als maschinenlesbares JSON ausgeben |

Die kompakte Textausgabe blendet archivierte Karten standardmäßig aus, damit die CLI mit `/workboard list` übereinstimmt. Übergeben Sie `--include-archived`, um sie anzuzeigen. Die JSON-Ausgabe enthält für bestehende Automatisierungen stets die vollständige Kartenliste einschließlich archivierter Karten.

## `create`

```bash
openclaw workboard create "Veralteten Worker-Heartbeat beheben" --priority high --labels bug,workboard
openclaw workboard create "Workboard-Dokumentation verfassen" --status ready --agent docs-agent --board docs --notes "CLI, Slash-Befehl, Verteilung und SQLite-Status behandeln."
```

| Flag                    | Zweck                                   |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | Anfängliche Kartennotizen               |
| `--status <status>`     | Anfangsstatus, Standardwert `todo` |
| `--priority <priority>` | Priorität, Standardwert `normal` |
| `--agent <id>`          | Karte einer Agent- oder Eigentümer-ID zuweisen |
| `--board <id>`          | Karte in einem Board-Namensraum speichern |
| `--labels <items>`      | Kommagetrennte Labels                    |
| `--json`                | Erstellte Karte als maschinenlesbares JSON ausgeben |

`create` schreibt direkt in den Workboard-SQLite-Status. Die Karte ist sofort im Workboard-Tab der Control UI und für Workboard-Tools sichtbar.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Die Textausgabe zeigt die kompakte Kartenzeile und Notizen. Die JSON-Ausgabe gibt den vollständigen Kartendatensatz zurück, einschließlich Ausführungsmetadaten, Versuchen, Kommentaren, Links, Nachweisen, Artefakten, Worker-Protokollen, Protokollstatus, Diagnosen und Automatisierungsmetadaten.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` ändert den Status der Karte über denselben manuellen Operatorpfad wie beim Ziehen einer Karte im Dashboard. Akzeptiert werden eine vollständige Karten-ID oder ein eindeutiges Präfix. Aktive Abhängigkeits- und Zeitplanblockierungen gelten weiterhin. Operatoren dürfen eine beanspruchte Karte ohne deren Agent-Beanspruchungstoken verschieben; Beanspruchungstoken bleiben auf Änderungen durch Agent-Tools beschränkt und werden in der JSON-Ausgabe geschwärzt.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` ruft zunächst die RPC-Methode `workboard.cards.dispatch` des laufenden Gateways auf. Diese verwendet dieselbe Subagent-Laufzeit wie die Verteilungsaktion im Dashboard, sodass bereite Karten zu aufgabenverfolgten Worker-Läufen mit verknüpften Sitzungsschlüsseln werden. `--max-starts` verwendet die additive Methode `workboard.cards.dispatchWithOptions`, damit ein älteres Gateway die Option ablehnt, bevor Worker gestartet werden; starten Sie das Gateway nach dem Upgrade neu, bevor Sie das Flag verwenden. Karten mit einem zugewiesenen Agent verwenden Agent-bezogene Subagent-Sitzungsschlüssel; nicht zugewiesene Karten behalten einen nicht eingeschränkten Subagent-Schlüssel, sodass der konfigurierte Standard-Agent des Gateways erhalten bleibt.

Die Verteilungsschleife:

1. Versetzt abhängigkeitstechnisch bereite untergeordnete Karten in den Status `ready`.
2. Blockiert abgelaufene Beanspruchungen oder Worker-Läufe mit Zeitüberschreitung.
3. Erfasst Verteilungsmetadaten auf bereiten Karten.
4. Wählt eine kleine Gruppe nicht beanspruchter bereiter Karten aus.
5. Beansprucht jede ausgewählte Karte für den Dispatcher oder den zugewiesenen Agent.
6. Startet einen Subagent-Worker-Lauf mit begrenztem Kartenkontext und dem Beanspruchungstoken der Karte.
7. Speichert die Worker-Lauf-ID, den Sitzungsschlüssel, die Aufgabenverknüpfung, wenn das Gateway-Aufgabenjournal sie meldet, den Ausführungsstatus und das Worker-Protokoll auf der Karte.

Die Auswahl ist konservativ: Eine Verteilung startet standardmäßig höchstens drei Worker, überspringt archivierte oder bereits beanspruchte Karten und startet in einem einzelnen Durchlauf nur eine Karte pro Eigentümer oder Agent. Karten, deren Eigentümer bereits aktive laufende oder zur Prüfung anstehende Aufgaben haben, bleiben für eine spätere Verteilung liegen. Übergeben Sie `--max-starts <count>` mit einer positiven Ganzzahl, um die Obergrenze pro Durchlauf zu ändern; die Regel „eine Karte pro Eigentümer“ gilt weiterhin, sodass die tatsächliche Anzahl der Starts geringer sein kann.

Wenn der Worker-Start fehlschlägt, nachdem eine Karte beansprucht wurde, blockiert Workboard diese Karte, hebt die Beanspruchung auf und erfasst den Fehler in den Ausführungs- und Worker-Protokollmetadaten der Karte. Dadurch bleiben fehlgeschlagene Starts sichtbar, anstatt die Karte unbemerkt in die Warteschlange zurückzugeben.

Wenn kein ausdrückliches Gateway-Ziel angegeben ist und das lokale Gateway nicht verfügbar ist oder die Workboard-Verteilungsmethode noch nicht bereitstellt, greift die CLI auf eine reine Datenverteilung anhand des lokalen Workboard-Status zurück. Die reine Datenverteilung kann weiterhin Abhängigkeiten hochstufen, veraltete Beanspruchungen bereinigen und Läufe mit Zeitüberschreitung blockieren, startet jedoch keine Worker. Authentifizierungs-, Berechtigungs- und Validierungsfehler sowie Fehler bei einem ausdrücklich angegebenen Ziel `--url` oder `--token` werden direkt gemeldet, statt den Rückgriff auszulösen.

Die Textausgabe meldet Worker-Starts:

```text
Verteilung abgeschlossen: gestartet=2 Fehler=0
```

Die Rückgriffsausgabe ist eindeutig:

```text
Gateway nicht verfügbar; nur Datenverteilung: hochgestuft=1 blockiert=0
```

Die JSON-Ausgabe enthält das Verteilungsergebnis. Eine Gateway-gestützte Verteilung kann `started` und `startFailures` enthalten; der reine Datenrückgriff enthält `gatewayUnavailable: true`. Beanspruchungstoken werden in der Karten-JSON-Ausgabe geschwärzt.

Im Dashboard wird dasselbe Verteilungsergebnis als kurze Zusammenfassung angezeigt, sodass ein Operator sehen kann, wie viele Karten gestartet, hochgestuft, blockiert, erneut beansprucht oder als fehlgeschlagen erfasst wurden, ohne die Kartendetails zu öffnen.

## Entsprechende Slash-Befehle

Befehlsfähige Kanäle können den entsprechenden Slash-Befehl verwenden:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Veralteten Worker-Heartbeat beheben
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

Die Verteilung per Slash-Befehl verwendet ebenfalls die Gateway-Subagent-Laufzeit und folgt daher demselben Verhalten bei Beanspruchung, Worker-Start und Fehlern wie das Dashboard und der Gateway-Pfad der CLI.

`/workboard list` und `/workboard show` sind Lesebefehle für autorisierte Befehlsabsender. `/workboard create`, `/workboard move` und `/workboard dispatch` ändern den Board-Status und erfordern auf Chat-Oberflächen den Eigentümerstatus oder einen Gateway-Client mit `operator.write` oder `operator.admin`.

## Berechtigungen

Der CLI-Verteilungspfad fordert normalerweise die Gateway-Bereiche `operator.write` und `operator.read` an. An einen Arbeitsbereich gebundene Karten werden direkt in einem exakt konfigurierten Agent-Arbeitsbereich ausgeführt; eine Worktree-Anforderung wird auf dieses Verzeichnis beschränkt, anstatt dem Host zu erlauben, Repository-gesteuerten Code bereitzustellen. Der ausgewählte Worker muss über schreibbaren, nicht gemeinsam genutzten Docker-Sandbox-Zugriff auf genau diesen Arbeitsbereich, einen aktiven Container-Hash, der den angeforderten Einbindungen und Richtlinien entspricht, und keinerlei Möglichkeit zum Ausbruch auf den Host verfügen. Übergeben Sie `--admin`, um ausdrücklich `operator.admin` anzufordern, einen anderen Host-Checkout zuzulassen und die normale verwaltete Worktree-Einrichtung zu verwenden; die Verbindung schlägt fehl, wenn dieser Bereich für den Client nicht genehmigt ist. Ein schreibgeschütztes Gateway-Token kann Workboard-Daten über Lesemethoden prüfen, aber weder Karten erstellen noch Worker verteilen. Arbeitsbereichsbeschränkungen ändern ansonsten nicht das manuelle Verschieben von Karten durch Aufrufer mit Workboard-Änderungsberechtigung.

Lokale Befehle `list`, `create`, `show` und `move` arbeiten mit dem lokalen OpenClaw-Statusverzeichnis des aktuellen Profils. Verwenden Sie `--dev` oder `--profile <name>` beim übergeordneten Befehl `openclaw`, wenn Sie einen anderen Statusstamm benötigen.

## Fehlerbehebung

### Es werden keine Karten angezeigt

Prüfen Sie, ob das Plugin für dasselbe Profil und denselben Statusstamm aktiviert ist:

```bash
openclaw plugins inspect workboard --runtime --json
```

Wenn das Dashboard Karten anzeigt, die CLI jedoch nicht, prüfen Sie, ob beide Befehle dieselbe Einstellung `--dev` oder `--profile` verwenden.

### Die Verteilung meldet „nur Daten“

Starten Sie das Gateway oder starten Sie es neu:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Versuchen Sie anschließend `openclaw workboard dispatch` erneut. Der reine Datenrückgriff ist für die Bereinigung des lokalen Status nützlich, Worker-Läufe benötigen jedoch ein aktives Gateway.

### Die Verteilung startet nichts

Prüfen Sie, ob mindestens eine Karte mit dem Status `ready` ohne aktive Beanspruchung vorhanden ist:

```bash
openclaw workboard list --status ready
```

Karten können auch übersprungen werden, wenn derselbe Eigentümer bereits laufende oder zur Prüfung anstehende Aufgaben hat. Verschieben Sie abgeschlossene Aufgaben nach `done`, heben Sie veraltete Beanspruchungen über die Workboard-Tools auf oder führen Sie die Verteilung erneut aus, nachdem der aktive Worker fertig ist.

## Verwandte Themen

- [Workboard-Plugin](/de/plugins/workboard)
- [CLI-Referenz](/de/cli)
- [Slash-Befehle](/de/tools/slash-commands)
- [Control UI](/de/web/control-ui)
