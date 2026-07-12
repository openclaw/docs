---
read_when:
    - Sie möchten Workboard-Karten im Terminal anzeigen oder erstellen
    - Sie möchten Workboard-Worker-Läufe über die CLI starten
    - Sie debuggen das Verhalten der Workboard-CLI oder von Slash-Befehlen
summary: CLI-Referenz für `openclaw workboard`-Karten, Zuweisung und Worker-Ausführungen
title: Workboard-CLI
x-i18n:
    generated_at: "2026-07-12T01:31:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` ist die Terminaloberfläche für das gebündelte [Workboard-Plugin](/de/plugins/workboard). Damit kann ein Operator Karten auflisten, eine Karte erstellen, eine einzelne Karte anzeigen und den laufenden Gateway anweisen, bereite Aufgaben an Subagent-Worker-Läufe zu verteilen.

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

Der Befehl liest und schreibt dieselbe Plugin-eigene SQLite-Datenbank, die vom Dashboard und den Workboard-Agentenwerkzeugen verwendet wird. Karten-IDs sind UUIDs; Befehle, die eine Karten-ID akzeptieren, akzeptieren auch ein eindeutiges ID-Präfix (die kompakte Textausgabe zeigt die ersten 8 Zeichen).

Gültige `status`-Werte: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Gültige `priority`-Werte: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Die Textausgabe ist kompakt:

```text
7f4a2c10  ready     high    default agent-a  Veralteten Worker-Heartbeat korrigieren
```

Die Spalten enthalten das ID-Präfix, den Status, die Priorität, die Board-ID, optional die Agenten-ID und den Titel.

| Flag                 | Zweck                                                   |
| -------------------- | ------------------------------------------------------- |
| `--board <id>`       | Ergebnisse auf einen Board-Namensraum beschränken       |
| `--status <status>`  | Ergebnisse auf einen Workboard-Status beschränken       |
| `--include-archived` | Archivierte Karten in die kompakte Textausgabe aufnehmen |
| `--json`             | Vollständige Kartenliste als maschinenlesbares JSON ausgeben |

Die kompakte Textausgabe blendet archivierte Karten standardmäßig aus, damit die CLI dem Verhalten von `/workboard list` entspricht. Übergeben Sie `--include-archived`, um sie anzuzeigen. Die JSON-Ausgabe enthält für bestehende Automatisierungen immer die vollständige Kartenliste einschließlich archivierter Karten.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Flag                    | Zweck                                          |
| ----------------------- | ---------------------------------------------- |
| `--notes <text>`        | Anfängliche Kartennotizen                      |
| `--status <status>`     | Anfangsstatus, Standardwert `todo`             |
| `--priority <priority>` | Priorität, Standardwert `normal`               |
| `--agent <id>`          | Karte einer Agenten- oder Eigentümer-ID zuweisen |
| `--board <id>`          | Karte in einem Board-Namensraum speichern      |
| `--labels <items>`      | Kommagetrennte Bezeichnungen                   |
| `--json`                | Erstellte Karte als maschinenlesbares JSON ausgeben |

`create` schreibt direkt in den SQLite-Zustand von Workboard. Die Karte ist sofort auf der Workboard-Registerkarte der Control UI und für Workboard-Werkzeuge sichtbar.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Die Textausgabe zeigt die kompakte Kartenzeile und die Notizen. Die JSON-Ausgabe gibt den vollständigen Kartendatensatz zurück, einschließlich Ausführungsmetadaten, Versuchen, Kommentaren, Links, Nachweisen, Artefakten, Worker-Protokollen, Protokollstatus, Diagnosen und Automatisierungsmetadaten.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` ruft zunächst die RPC-Methode `workboard.cards.dispatch` des laufenden Gateways auf. Diese verwendet dieselbe Subagent-Laufzeit wie die Verteilungsaktion im Dashboard, sodass bereite Karten zu aufgabenverfolgten Worker-Läufen mit verknüpften Sitzungsschlüsseln werden. Karten mit zugewiesenem Agenten verwenden agentenspezifische Subagent-Sitzungsschlüssel; Karten ohne Zuweisung behalten einen nicht eingegrenzten Subagent-Schlüssel, damit der konfigurierte Standardagent des Gateways erhalten bleibt.

Die Verteilungsschleife:

1. Setzt von ihren Abhängigkeiten her bereite untergeordnete Karten auf `ready`.
2. Blockiert abgelaufene Beanspruchungen oder Worker-Läufe mit Zeitüberschreitung.
3. Erfasst Verteilungsmetadaten auf bereiten Karten.
4. Wählt eine kleine Gruppe nicht beanspruchter bereiter Karten aus.
5. Beansprucht jede ausgewählte Karte für den Verteiler oder den zugewiesenen Agenten.
6. Startet einen Subagent-Worker-Lauf mit begrenztem Kartenkontext und dem Beanspruchungstoken der Karte.
7. Speichert die Worker-Lauf-ID, den Sitzungsschlüssel, die Aufgabenverknüpfung, sofern das Gateway-Aufgabenverzeichnis sie meldet, den Ausführungsstatus und das Worker-Protokoll auf der Karte.

Die Auswahl erfolgt zurückhaltend: Eine Verteilung startet standardmäßig höchstens drei Worker, überspringt archivierte oder bereits beanspruchte Karten und startet in einem Durchlauf nur eine Karte pro Eigentümer oder Agenten. Karten, deren Eigentümer bereits aktive Aufgaben mit dem Status „läuft“ oder „in Prüfung“ haben, werden für eine spätere Verteilung zurückgestellt.

Wenn der Worker-Start nach der Beanspruchung einer Karte fehlschlägt, blockiert Workboard diese Karte, hebt die Beanspruchung auf und zeichnet den Fehler in den Ausführungs- und Worker-Protokollmetadaten der Karte auf. Dadurch bleiben fehlgeschlagene Starts sichtbar, statt die Karte stillschweigend in die Warteschlange zurückzugeben.

Wenn kein explizites Gateway-Ziel angegeben ist und der lokale Gateway nicht verfügbar ist oder die Workboard-Verteilungsmethode noch nicht bereitstellt, weicht die CLI auf eine rein datenbasierte Verteilung anhand des lokalen Workboard-Zustands aus. Die rein datenbasierte Verteilung kann weiterhin Abhängigkeiten hochstufen, veraltete Beanspruchungen bereinigen und Läufe mit Zeitüberschreitung blockieren, startet jedoch keine Worker. Fehler bei Authentifizierung, Berechtigung und Validierung sowie Fehler für ein explizites Ziel über `--url` oder `--token` werden direkt gemeldet, statt den Rückgriff auszulösen.

Die Textausgabe meldet Worker-Starts:

```text
dispatch complete: started=2 failures=0
```

Die Rückgriffsausgabe ist eindeutig:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

Die JSON-Ausgabe enthält das Verteilungsergebnis. Eine Gateway-gestützte Verteilung kann `started` und `startFailures` enthalten; der rein datenbasierte Rückgriff enthält `gatewayUnavailable: true`. Beanspruchungstoken werden in der JSON-Ausgabe der Karte unkenntlich gemacht.

Im Dashboard wird dasselbe Verteilungsergebnis als kurze Zusammenfassung angezeigt, sodass ein Operator sehen kann, wie viele Karten gestartet, hochgestuft, blockiert, erneut beansprucht oder als fehlgeschlagen verzeichnet wurden, ohne die Kartendetails zu öffnen.

## Entsprechende Slash-Befehle

Kanäle mit Befehlsunterstützung können den entsprechenden Slash-Befehl verwenden:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Die Verteilung per Slash-Befehl verwendet ebenfalls die Subagent-Laufzeit des Gateways und folgt daher demselben Verhalten bei Beanspruchung, Worker-Start und Fehlern wie das Dashboard und der Gateway-Pfad der CLI.

`/workboard list` und `/workboard show` sind Lesebefehle für autorisierte Absender von Befehlen. `/workboard create` und `/workboard dispatch` verändern den Board-Zustand und erfordern auf Chat-Oberflächen den Eigentümerstatus oder einen Gateway-Client mit `operator.write` oder `operator.admin`.

## Berechtigungen

Der CLI-Verteilungspfad ruft Gateway-RPC mit den Geltungsbereichen `operator.read` und `operator.write` auf. Ein schreibgeschütztes Gateway-Token kann Workboard-Daten über Lesemethoden einsehen, aber keine Karten erstellen oder Worker verteilen.

Die lokalen Befehle `list`, `create` und `show` arbeiten mit dem lokalen OpenClaw-Zustandsverzeichnis, das vom aktuellen Profil verwendet wird. Verwenden Sie `--dev` oder `--profile <name>` beim übergeordneten Befehl `openclaw`, wenn Sie ein anderes Zustandsstammverzeichnis benötigen.

## Fehlerbehebung

### Es werden keine Karten angezeigt

Bestätigen Sie, dass das Plugin für dasselbe Profil und Zustandsstammverzeichnis aktiviert ist:

```bash
openclaw plugins inspect workboard --runtime --json
```

Wenn das Dashboard Karten anzeigt, die CLI jedoch nicht, prüfen Sie, ob beide Befehle dieselbe Einstellung für `--dev` oder `--profile` verwenden.

### Die Verteilung meldet „nur Daten“

Starten Sie den Gateway oder starten Sie ihn neu:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Versuchen Sie anschließend `openclaw workboard dispatch` erneut. Der rein datenbasierte Rückgriff ist für die lokale Zustandsbereinigung nützlich, Worker-Läufe benötigen jedoch einen aktiven Gateway.

### Die Verteilung startet nichts

Prüfen Sie, ob mindestens eine Karte mit dem Status `ready` ohne aktive Beanspruchung vorhanden ist:

```bash
openclaw workboard list --status ready
```

Karten können auch übersprungen werden, wenn derselbe Eigentümer bereits laufende oder zu prüfende Aufgaben hat. Verschieben Sie abgeschlossene Aufgaben nach `done`, heben Sie veraltete Beanspruchungen über die Workboard-Werkzeuge auf oder führen Sie die Verteilung erneut aus, nachdem der aktive Worker abgeschlossen ist.

## Verwandte Themen

- [Workboard-Plugin](/de/plugins/workboard)
- [CLI-Referenz](/de/cli)
- [Slash-Befehle](/de/tools/slash-commands)
- [Control UI](/de/web/control-ui)
