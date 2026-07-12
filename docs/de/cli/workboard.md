---
read_when:
    - Sie möchten Workboard-Karten im Terminal prüfen oder erstellen
    - Sie möchten Workboard-Worker-Ausführungen über die CLI starten
    - Sie debuggen das Verhalten der Workboard-CLI oder von Slash-Befehlen
summary: CLI-Referenz für `openclaw workboard`-Karten, Dispatch und Worker-Ausführungen
title: Workboard-CLI
x-i18n:
    generated_at: "2026-07-12T15:10:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` ist die Terminaloberfläche für das mitgelieferte [Workboard-Plugin](/de/plugins/workboard). Damit kann ein Operator Karten auflisten, eine Karte erstellen, eine einzelne Karte anzeigen und das laufende Gateway anweisen, bereite Arbeit an Subagent-Worker-Läufe zu übergeben.

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
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
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

| Flag                 | Zweck                                                     |
| -------------------- | --------------------------------------------------------- |
| `--board <id>`       | Ergebnisse auf einen Board-Namensraum beschränken         |
| `--status <status>`  | Ergebnisse auf einen Workboard-Status beschränken         |
| `--include-archived` | Archivierte Karten in die kompakte Textausgabe aufnehmen  |
| `--json`             | Vollständige Kartenliste als maschinenlesbares JSON ausgeben |

Die kompakte Textausgabe blendet archivierte Karten standardmäßig aus, damit die CLI dem Verhalten von `/workboard list` entspricht. Übergeben Sie `--include-archived`, um sie anzuzeigen. Die JSON-Ausgabe enthält für bestehende Automatisierungen immer die vollständige Kartenliste einschließlich archivierter Karten.

## `create`

```bash
openclaw workboard create "Veralteten Worker-Heartbeat beheben" --priority high --labels bug,workboard
openclaw workboard create "Workboard-Dokumentation verfassen" --status ready --agent docs-agent --board docs --notes "CLI, Slash-Befehl, Dispatch und SQLite-Zustand abdecken."
```

| Flag                    | Zweck                                             |
| ----------------------- | ------------------------------------------------- |
| `--notes <text>`        | Anfängliche Kartennotizen                         |
| `--status <status>`     | Anfänglicher Status, Standardwert `todo`          |
| `--priority <priority>` | Priorität, Standardwert `normal`                  |
| `--agent <id>`          | Karte einer Agent- oder Eigentümer-ID zuweisen    |
| `--board <id>`          | Karte in einem Board-Namensraum speichern         |
| `--labels <items>`      | Kommagetrennte Labels                             |
| `--json`                | Erstellte Karte als maschinenlesbares JSON ausgeben |

`create` schreibt direkt in den SQLite-Zustand von Workboard. Die Karte ist sofort auf der Registerkarte „Workboard“ der Control UI und für Workboard-Tools sichtbar.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Die Textausgabe zeigt die kompakte Kartenzeile und die Notizen. Die JSON-Ausgabe gibt den vollständigen Kartendatensatz zurück, einschließlich Ausführungsmetadaten, Versuchen, Kommentaren, Links, Nachweisen, Artefakten, Worker-Protokollen, Protokollzustand, Diagnosen und Automatisierungsmetadaten.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` ruft zunächst die RPC-Methode `workboard.cards.dispatch` des laufenden Gateways auf. Diese verwendet dieselbe Subagent-Laufzeit wie die Dispatch-Aktion im Dashboard, sodass bereite Karten zu aufgabenverfolgten Worker-Läufen mit verknüpften Sitzungsschlüsseln werden. Karten mit zugewiesenem Agent verwenden Agent-spezifische Subagent-Sitzungsschlüssel; nicht zugewiesene Karten behalten einen nicht bereichsgebundenen Subagent-Schlüssel, sodass der konfigurierte Standard-Agent des Gateways beibehalten wird.

Die Dispatch-Schleife:

1. Stuft untergeordnete Karten mit erfüllten Abhängigkeiten auf `ready` hoch.
2. Blockiert abgelaufene Beanspruchungen oder Worker-Läufe mit Zeitüberschreitung.
3. Erfasst Dispatch-Metadaten auf bereiten Karten.
4. Wählt einen kleinen Stapel nicht beanspruchter bereiter Karten aus.
5. Beansprucht jede ausgewählte Karte für den Dispatcher oder den zugewiesenen Agent.
6. Startet einen Subagent-Worker-Lauf mit begrenztem Kartenkontext und dem Beanspruchungstoken der Karte.
7. Speichert die Worker-Lauf-ID, den Sitzungsschlüssel, die Aufgabenverknüpfung, sofern das Gateway-Aufgabenledger sie meldet, den Ausführungsstatus und das Worker-Protokoll auf der Karte.

Die Auswahl ist konservativ: Ein Dispatch startet standardmäßig höchstens drei Worker, überspringt archivierte oder bereits beanspruchte Karten und startet in einem einzelnen Durchlauf nur eine Karte pro Eigentümer oder Agent. Karten, deren Eigentümer bereits aktive Arbeit mit dem Status „running“ oder „review“ haben, werden für einen späteren Dispatch zurückgestellt.

Wenn der Worker-Start fehlschlägt, nachdem eine Karte beansprucht wurde, blockiert Workboard diese Karte, hebt die Beanspruchung auf und zeichnet den Fehler in den Ausführungs- und Worker-Protokollmetadaten der Karte auf. Fehlgeschlagene Starts bleiben dadurch sichtbar, anstatt die Karte unbemerkt wieder in die Warteschlange zu stellen.

Wenn kein explizites Gateway-Ziel angegeben ist und das lokale Gateway nicht verfügbar ist oder die Workboard-Dispatch-Methode noch nicht bereitstellt, greift die CLI auf einen reinen Daten-Dispatch für den lokalen Workboard-Zustand zurück. Der reine Daten-Dispatch kann weiterhin Abhängigkeiten hochstufen, veraltete Beanspruchungen bereinigen und Läufe mit Zeitüberschreitung blockieren, startet jedoch keine Worker. Authentifizierungs-, Berechtigungs- und Validierungsfehler sowie Fehler für ein explizites `--url`- oder `--token`-Ziel werden direkt gemeldet, anstatt den Fallback auszulösen.

Die Textausgabe meldet Worker-Starts:

```text
Dispatch abgeschlossen: gestartet=2 Fehler=0
```

Die Fallback-Ausgabe ist eindeutig:

```text
Gateway nicht verfügbar; nur Daten-Dispatch: hochgestuft=1 blockiert=0
```

Die JSON-Ausgabe enthält das Dispatch-Ergebnis. Gateway-gestützter Dispatch kann `started` und `startFailures` enthalten; der reine Daten-Fallback enthält `gatewayUnavailable: true`. Beanspruchungstoken werden in der Karten-JSON-Ausgabe geschwärzt.

Im Dashboard wird dasselbe Dispatch-Ergebnis als kurze Zusammenfassung angezeigt, sodass ein Operator sehen kann, wie viele Karten gestartet, hochgestuft, blockiert, erneut beansprucht wurden oder fehlgeschlagen sind, ohne die Kartendetails zu öffnen.

## Gleichwertigkeit der Slash-Befehle

Befehlsfähige Kanäle können den entsprechenden Slash-Befehl verwenden:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Veralteten Worker-Heartbeat beheben
/workboard dispatch
```

Der Dispatch per Slash-Befehl verwendet ebenfalls die Subagent-Laufzeit des Gateways und folgt daher demselben Verhalten für Beanspruchung, Worker-Start und Fehler wie das Dashboard und der Gateway-Pfad der CLI.

`/workboard list` und `/workboard show` sind Lesebefehle für autorisierte Befehlsabsender. `/workboard create` und `/workboard dispatch` verändern den Board-Zustand und erfordern auf Chat-Oberflächen den Eigentümerstatus oder einen Gateway-Client mit `operator.write` oder `operator.admin`.

## Berechtigungen

Der CLI-Dispatch-Pfad ruft Gateway-RPC mit den Geltungsbereichen `operator.read` und `operator.write` auf. Ein schreibgeschütztes Gateway-Token kann Workboard-Daten über Lesemethoden anzeigen, aber weder Karten erstellen noch Worker per Dispatch starten.

Lokale Befehle `list`, `create` und `show` arbeiten mit dem lokalen OpenClaw-Zustandsverzeichnis, das vom aktuellen Profil verwendet wird. Verwenden Sie `--dev` oder `--profile <name>` beim übergeordneten Befehl `openclaw`, wenn Sie ein anderes Zustandsstammverzeichnis benötigen.

## Fehlerbehebung

### Es werden keine Karten angezeigt

Vergewissern Sie sich, dass das Plugin für dasselbe Profil und Zustandsstammverzeichnis aktiviert ist:

```bash
openclaw plugins inspect workboard --runtime --json
```

Wenn das Dashboard Karten anzeigt, die CLI jedoch nicht, prüfen Sie, ob beide Befehle dieselbe Einstellung für `--dev` oder `--profile` verwenden.

### Dispatch meldet „nur Daten“

Starten Sie das Gateway oder starten Sie es neu:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Versuchen Sie anschließend `openclaw workboard dispatch` erneut. Der reine Daten-Fallback ist für die lokale Zustandsbereinigung nützlich, Worker-Läufe benötigen jedoch ein aktives Gateway.

### Dispatch startet nichts

Prüfen Sie, ob mindestens eine Karte mit dem Status `ready` ohne aktive Beanspruchung vorhanden ist:

```bash
openclaw workboard list --status ready
```

Karten können auch übersprungen werden, wenn derselbe Eigentümer bereits Arbeit mit dem Status „running“ oder „review“ hat. Verschieben Sie abgeschlossene Arbeit nach `done`, heben Sie veraltete Beanspruchungen mithilfe der Workboard-Tools auf oder führen Sie den Dispatch erneut aus, nachdem der aktive Worker seine Arbeit beendet hat.

## Verwandte Themen

- [Workboard-Plugin](/de/plugins/workboard)
- [CLI-Referenz](/de/cli)
- [Slash-Befehle](/de/tools/slash-commands)
- [Control UI](/de/web/control-ui)
