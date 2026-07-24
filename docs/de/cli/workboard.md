---
read_when:
    - Sie möchten Workboard-Karten im Terminal prüfen oder erstellen
    - Sie möchten Workboard-Worker-Ausführungen über die CLI starten
    - Sie debuggen das Verhalten der Workboard-CLI oder von Slash-Befehlen
summary: CLI-Referenz für `openclaw workboard`-Karten, Dispatch und Worker-Ausführungen
title: Workboard-CLI
x-i18n:
    generated_at: "2026-07-24T03:47:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 640260ea6f5959b3aee1cdce76f2501097bff79e9bf1741bdd9ff7a8b43e1a7f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` ist die Terminaloberfläche für das mitgelieferte [Workboard-Plugin](/de/plugins/workboard). Damit kann ein Bediener Karten auflisten, eine Karte erstellen, eine einzelne Karte prüfen und den laufenden Gateway anweisen, bereite Arbeit an Subagent-Worker-Läufe zu verteilen.

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

Die kompakte Textausgabe blendet archivierte Karten standardmäßig aus, damit die CLI mit `/workboard list` übereinstimmt. Übergeben Sie `--include-archived`, um sie anzuzeigen. Die JSON-Ausgabe enthält für bestehende Automatisierungen immer die vollständige Kartenliste einschließlich archivierter Karten.

## `create`

```bash
openclaw workboard create "Veralteten Worker-Heartbeat beheben" --priority high --labels bug,workboard
openclaw workboard create "Workboard-Dokumentation schreiben" --status ready --agent docs-agent --board docs --notes "CLI, Slash-Befehl, Verteilung und SQLite-Zustand abdecken."
```

| Flag                    | Zweck                                   |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | Anfängliche Kartennotizen               |
| `--status <status>`     | Anfangsstatus, Standardwert `todo` |
| `--priority <priority>` | Priorität, Standardwert `normal`     |
| `--agent <id>`          | Die Karte einer Agent- oder Besitzer-ID zuweisen |
| `--board <id>`          | Die Karte in einem Board-Namensraum speichern |
| `--labels <items>`      | Kommagetrennte Labels                   |
| `--json`                | Die erstellte Karte als maschinenlesbares JSON ausgeben |

`create` schreibt direkt in den SQLite-Zustand von Workboard. Die Karte ist sofort im Workboard-Tab der Control UI und für Workboard-Tools sichtbar.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Die Textausgabe zeigt die kompakte Kartenzeile und die Notizen. Die JSON-Ausgabe gibt den vollständigen Kartendatensatz zurück, einschließlich Ausführungsmetadaten, Versuchen, Kommentaren, Links, Nachweisen, Artefakten, Worker-Protokollen, Protokollstatus, Diagnosen und Automatisierungsmetadaten.

Nachweisstatus in JSON sind vom Worker gemeldete Ergebnisse. `passed` erfasst die
Selbsteinschätzung des Workers zum angehängten Befehl oder zur angehängten Prüfung; dies ist
kein unabhängig verifiziertes Ergebnis.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` ändert den Status der Karte über denselben manuellen Bedienpfad wie das Ziehen einer Karte im Dashboard. Der Befehl akzeptiert eine vollständige Karten-ID oder ein eindeutiges Präfix. Aktive Abhängigkeits- und Zeitplanblockierungen gelten weiterhin. Bediener dürfen eine beanspruchte Karte ohne deren Agent-Beanspruchungstoken verschieben; Beanspruchungstoken bleiben auf Mutationen durch Agent-Tools beschränkt und werden in der JSON-Ausgabe geschwärzt.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` ruft zunächst die RPC-Methode `workboard.cards.dispatch` des laufenden Gateways auf. Diese verwendet dieselbe Subagent-Laufzeit wie die Verteilungsaktion im Dashboard, sodass bereite Karten zu aufgabenverfolgten Worker-Läufen mit verknüpften Sitzungsschlüsseln werden. `--max-starts` verwendet die additive Methode `workboard.cards.dispatchWithOptions`, sodass ein älterer Gateway die Option ablehnt, bevor Worker gestartet werden; starten Sie den Gateway nach dem Upgrade neu, bevor Sie das Flag verwenden. Karten mit einem zugewiesenen Agent verwenden Agent-spezifische Subagent-Sitzungsschlüssel; nicht zugewiesene Karten behalten einen unbeschränkten Subagent-Schlüssel, sodass der im Gateway konfigurierte Standard-Agent erhalten bleibt.

Die Verteilungsschleife:

1. Versetzt unter Berücksichtigung ihrer Abhängigkeiten bereite untergeordnete Karten in `ready`.
2. Blockiert abgelaufene Beanspruchungen oder Worker-Läufe mit Zeitüberschreitung.
3. Erfasst Verteilungsmetadaten für bereite Karten.
4. Wählt einen kleinen Stapel nicht beanspruchter bereiter Karten aus.
5. Beansprucht jede ausgewählte Karte für den Verteiler oder den zugewiesenen Agent.
6. Startet einen Subagent-Worker-Lauf mit begrenztem Kartenkontext und dem Beanspruchungstoken der Karte.
7. Speichert die Worker-Lauf-ID, den Sitzungsschlüssel, die Aufgabenverknüpfung, sofern sie vom Gateway-Aufgabenbuch gemeldet wird, den Ausführungsstatus und das Worker-Protokoll auf der Karte.

Die Auswahl ist konservativ: Eine Verteilung startet standardmäßig höchstens drei Worker, überspringt archivierte oder bereits beanspruchte Karten und startet in einem Durchlauf nur eine Karte pro Besitzer oder Agent. Karten, deren Besitzer bereits aktive laufende oder zu prüfende Arbeit haben, werden für eine spätere Verteilung zurückgestellt. Übergeben Sie `--max-starts <count>` mit einer positiven Ganzzahl, um die Obergrenze pro Durchlauf zu ändern; die Regel von einer Karte pro Besitzer gilt weiterhin, sodass die tatsächliche Anzahl der Starts geringer sein kann.

Wenn der Start eines Workers fehlschlägt, nachdem eine Karte beansprucht wurde, blockiert Workboard diese Karte, hebt die Beanspruchung auf und erfasst den Fehler in den Ausführungs- und Worker-Protokollmetadaten der Karte. Dadurch bleiben fehlgeschlagene Starts sichtbar, statt die Karte unbemerkt in die Warteschlange zurückzugeben.

Wenn kein ausdrückliches Gateway-Ziel angegeben ist und der lokale Gateway nicht verfügbar ist oder die Workboard-Verteilungsmethode noch nicht bereitstellt, greift die CLI auf eine reine Datenverteilung anhand des lokalen Workboard-Zustands zurück. Die reine Datenverteilung kann weiterhin Abhängigkeiten freigeben, veraltete Beanspruchungen bereinigen und Läufe mit Zeitüberschreitung blockieren, startet jedoch keine Worker. Authentifizierungs-, Berechtigungs- und Validierungsfehler sowie Fehler bei einem ausdrücklich angegebenen Ziel `--url` oder `--token` werden direkt gemeldet, statt den Rückfall auszulösen.

Die Textausgabe meldet Worker-Starts:

```text
Verteilung abgeschlossen: gestartet=2 Fehler=0
```

Die Rückfallausgabe ist eindeutig:

```text
Gateway nicht verfügbar; nur Datenverteilung: freigegeben=1 blockiert=0
```

Die JSON-Ausgabe enthält das Verteilungsergebnis. Eine Gateway-gestützte Verteilung kann `started` und `startFailures` enthalten; der Rückfall auf reine Datenverteilung enthält `gatewayUnavailable: true`. Beanspruchungstoken werden in der JSON-Ausgabe der Karte geschwärzt.

Im Dashboard wird dasselbe Verteilungsergebnis als kurze Zusammenfassung angezeigt, sodass ein Bediener sehen kann, wie viele Karten gestartet, freigegeben, blockiert, erneut beansprucht oder fehlgeschlagen sind, ohne die Kartendetails zu öffnen.

## Gleichwertigkeit der Slash-Befehle

Befehlsfähige Kanäle können den entsprechenden Slash-Befehl verwenden:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Veralteten Worker-Heartbeat beheben
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

Die Verteilung per Slash-Befehl verwendet ebenfalls die Subagent-Laufzeit des Gateways und folgt daher demselben Verhalten für Beanspruchung, Worker-Start und Fehler wie das Dashboard und der Gateway-Pfad der CLI.

`/workboard list` und `/workboard show` sind Lesebefehle für autorisierte Absender von Befehlen. `/workboard create`, `/workboard move` und `/workboard dispatch` verändern den Board-Zustand und erfordern auf Chat-Oberflächen den Besitzerstatus oder einen Gateway-Client mit `operator.write` oder `operator.admin`.

## Berechtigungen

Der CLI-Verteilungspfad fordert normalerweise die Gateway-Bereiche `operator.write` und `operator.read` an. An einen Arbeitsbereich gebundene Karten werden direkt in einem exakt konfigurierten Agent-Arbeitsbereich ausgeführt; eine Worktree-Anforderung wird auf dieses Verzeichnis beschränkt, statt dem Host das Bereitstellen von Repository-gesteuertem Code zu gestatten. Der ausgewählte Worker muss über beschreibbaren, nicht gemeinsam genutzten Docker-Sandbox-Zugriff auf genau diesen Arbeitsbereich, einen aktiven Container-Hash, der den angeforderten Einbindungen und Richtlinien entspricht, und keine Möglichkeit zum Ausbruch auf den Host verfügen. Übergeben Sie `--admin`, um ausdrücklich `operator.admin` anzufordern, einen anderen Host-Checkout zuzulassen und die normale Einrichtung eines verwalteten Worktrees zu verwenden; die Verbindung schlägt fehl, wenn dieser Bereich für den Client nicht genehmigt ist. Ein schreibgeschütztes Gateway-Token kann Workboard-Daten über Lesemethoden prüfen, aber keine Karten erstellen oder Worker verteilen. Arbeitsbereichsbeschränkungen ändern ansonsten nicht das manuelle Verschieben von Karten für Aufrufer mit Workboard-Mutationsberechtigung.

Lokale Befehle `list`, `create`, `show` und `move` arbeiten mit dem lokalen OpenClaw-Zustandsverzeichnis, das vom aktuellen Profil verwendet wird. Verwenden Sie `--dev` oder `--profile <name>` beim übergeordneten Befehl `openclaw`, wenn Sie ein anderes Zustandsstammverzeichnis benötigen.

## Fehlerbehebung

### Es werden keine Karten angezeigt

Vergewissern Sie sich, dass das Plugin für dasselbe Profil und Zustandsstammverzeichnis aktiviert ist:

```bash
openclaw plugins inspect workboard --runtime --json
```

Wenn das Dashboard Karten anzeigt, die CLI jedoch nicht, prüfen Sie, ob beide Befehle dieselbe Einstellung `--dev` oder `--profile` verwenden.

### Die Verteilung meldet reine Datenverteilung

Starten Sie den Gateway oder starten Sie ihn neu:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Versuchen Sie anschließend `openclaw workboard dispatch` erneut. Der Rückfall auf reine Datenverteilung ist für die Bereinigung des lokalen Zustands nützlich, Worker-Läufe benötigen jedoch einen aktiven Gateway.

### Die Verteilung startet nichts

Prüfen Sie, ob mindestens eine Karte mit dem Status `ready` ohne aktive Beanspruchung vorhanden ist:

```bash
openclaw workboard list --status ready
```

Karten können auch übersprungen werden, wenn derselbe Besitzer bereits laufende oder zu prüfende Arbeit hat. Verschieben Sie abgeschlossene Arbeit nach `done`, geben Sie veraltete Beanspruchungen über die Workboard-Tools frei oder führen Sie die Verteilung erneut aus, nachdem der aktive Worker abgeschlossen wurde.

## Verwandte Themen

- [Workboard-Plugin](/de/plugins/workboard)
- [CLI-Referenz](/de/cli)
- [Slash-Befehle](/de/tools/slash-commands)
- [Control UI](/de/web/control-ui)
