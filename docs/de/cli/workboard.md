---
read_when:
    - Sie möchten Workboard-Karten im Terminal prüfen oder erstellen
    - Sie möchten Workboard-Worker-Läufe über die CLI auslösen
    - Sie debuggen das Verhalten der Workboard-CLI oder von Slash-Befehlen
summary: CLI-Referenz für `openclaw workboard`-Karten, Dispatch und Worker-Ausführungen
title: Workboard-CLI
x-i18n:
    generated_at: "2026-06-27T17:21:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` ist die Terminal-Oberfläche für das gebündelte
[Workboard-Plugin](/de/plugins/workboard). Sie ermöglicht es einem Operator, Karten aufzulisten, eine
Karte zu erstellen, eine Karte zu prüfen und den laufenden Gateway anzuweisen, bereite Arbeit in
Subagent-Worker-Läufe zu dispatchen.

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

Der Befehl liest und schreibt dieselbe Plugin-eigene SQLite-Datenbank, die vom
Dashboard und den Workboard-Agent-Tools verwendet wird. Karten-IDs können als vollständige ID oder als
eindeutiges Präfix übergeben werden, wenn ein Befehl eine Karten-ID akzeptiert.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Die Textausgabe ist kompakt:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Die Spalten sind ID-Präfix, Status, Priorität, Board-ID, optionale Agent-ID und Titel.

Flags:

| Flag                 | Zweck                                                |
| -------------------- | ---------------------------------------------------- |
| `--board <id>`       | Ergebnisse auf einen Board-Namespace begrenzen       |
| `--status <status>`  | Ergebnisse auf einen Workboard-Status begrenzen      |
| `--include-archived` | Archivierte Karten in kompakter Textausgabe anzeigen |
| `--json`             | Die vollständige Kartenliste als Maschinen-JSON ausgeben |

Die kompakte Textausgabe blendet archivierte Karten standardmäßig aus, damit die CLI dem
Befehl `/workboard list` entspricht. Übergeben Sie `--include-archived`, um sie anzuzeigen. Die JSON-Ausgabe
behält für bestehende Automatisierung die vollständige Kartenliste einschließlich archivierter Karten bei.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

Flags:

| Flag                    | Zweck                                           |
| ----------------------- | ----------------------------------------------- |
| `--notes <text>`        | Anfangsnotizen der Karte                        |
| `--status <status>`     | Anfangsstatus, Standard `todo`                  |
| `--priority <priority>` | Priorität, Standard `normal`                    |
| `--agent <id>`          | Die Karte einem Agent oder einer Owner-ID zuweisen |
| `--board <id>`          | Die Karte in einem Board-Namespace speichern    |
| `--labels <items>`      | Kommagetrennte Labels                           |
| `--json`                | Die erstellte Karte als Maschinen-JSON ausgeben |

`create` schreibt direkt in den Workboard-SQLite-Status. Die Karte ist sofort
im Workboard-Tab der Control UI und für Workboard-Tools sichtbar.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Die Textausgabe gibt die kompakte Kartenzeile und Notizen aus. Die JSON-Ausgabe liefert den vollständigen
Kartendatensatz, einschließlich Ausführungsmetadaten, Versuchen, Kommentaren, Links, Nachweisen,
Artefakten, Worker-Logs, Protokollstatus, Diagnosen und Automatisierungsmetadaten.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` ruft zuerst die laufende Gateway-RPC-Methode
`workboard.cards.dispatch` auf. Dieser Pfad verwendet dieselbe Subagent-Runtime wie die
Dispatch-Aktion des Dashboards, sodass bereite Karten zu aufgabenverfolgten Worker-Läufen mit
verknüpften Sitzungsschlüsseln werden. Karten mit zugewiesenem Agent verwenden agentbezogene
Subagent-Sitzungsschlüssel; nicht zugewiesene Karten behalten einen nicht bereichsgebundenen Subagent-Schlüssel bei, sodass der
konfigurierte Standard-Agent des Gateway erhalten bleibt.

Die Dispatch-Schleife:

1. Stuft abhängigkeitsbereite untergeordnete Karten auf `ready` hoch.
2. Blockiert abgelaufene Claims oder Worker-Läufe mit Zeitüberschreitung.
3. Erfasst Dispatch-Metadaten auf bereiten Karten.
4. Wählt einen kleinen Batch nicht beanspruchter bereiter Karten aus.
5. Beansprucht jede ausgewählte Karte für den Dispatcher oder zugewiesenen Agent.
6. Startet einen Subagent-Worker-Lauf mit begrenztem Kartenkontext und dem Claim-Token
   der Karte.
7. Speichert die Worker-Lauf-ID, den Sitzungsschlüssel, die Aufgabenverknüpfung, wenn das Gateway-Aufgaben-Ledger
   sie meldet, den Ausführungsstatus und das Worker-Log auf der Karte.

Die Auswahl ist absichtlich konservativ. Ein Dispatch startet standardmäßig höchstens drei
Worker, überspringt archivierte oder bereits beanspruchte Karten und startet in einem einzelnen Durchlauf nur eine
Karte pro Owner oder Agent. Karten, die bereits aktiv laufender Arbeit oder Review-Arbeit zugeordnet sind,
bleiben für einen späteren Dispatch übrig.

Wenn der Worker-Start fehlschlägt, nachdem eine Karte beansprucht wurde, blockiert Workboard diese Karte,
löscht den Claim und zeichnet den Fehler in den Ausführungs- und Worker-Log-Metadaten
der Karte auf. So bleiben fehlgeschlagene Starts sichtbar, statt die
Karte stillschweigend in die Warteschlange zurückzugeben.

Wenn kein explizites Gateway-Ziel angegeben ist und der lokale Gateway nicht verfügbar ist
oder die Workboard-Dispatch-Methode noch nicht bereitstellt, fällt die CLI auf
datenbasierten Dispatch gegen den lokalen Workboard-Status zurück. Datenbasierter Dispatch kann weiterhin
Abhängigkeiten hochstufen, veraltete Claims bereinigen und Läufe mit Zeitüberschreitung blockieren, startet aber
keine Worker. Authentifizierungs-, Berechtigungs-, Validierungsfehler und Fehler für ein
explizites Ziel mit `--url` oder `--token` werden direkt gemeldet.

Die Textausgabe meldet Worker-Starts:

```text
dispatch complete: started=2 failures=0
```

Die Fallback-Ausgabe ist explizit:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

Die JSON-Ausgabe enthält das Dispatch-Ergebnis. Gateway-gestützter Dispatch kann
`started` und `startFailures` enthalten; der datenbasierte Fallback enthält
`gatewayUnavailable: true`. Claim-Tokens werden in der Karten-JSON-Ausgabe redigiert.

Im Dashboard wird dasselbe Dispatch-Ergebnis als kurze Zusammenfassung angezeigt, sodass ein
Operator sehen kann, wie viele Karten gestartet, hochgestuft, blockiert, zurückgefordert oder
fehlgeschlagen sind, ohne Kartendetails zu öffnen.

## Parität der Slash-Befehle

Befehlsfähige Kanäle können den entsprechenden Slash-Befehl verwenden:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Der Slash-Befehl-Dispatch verwendet ebenfalls die Gateway-Subagent-Runtime und folgt daher demselben
Claim-, Worker-Start- und Fehlerverhalten wie der Dashboard- und CLI-Gateway-Pfad.

`/workboard list` und `/workboard show` sind Lesebefehle für autorisierte Befehlsabsender.
`/workboard create` und `/workboard dispatch` verändern den Board-Status und
erfordern Owner-Status auf Chat-Oberflächen oder einen Gateway-Client mit `operator.write`
oder `operator.admin`.

## Berechtigungen

Der CLI-Dispatch-Pfad ruft Gateway-RPC mit den Scopes `operator.read` und
`operator.write` auf. Ein schreibgeschütztes Gateway-Token kann Workboard-Daten
über Lesemethoden prüfen, aber keine Karten erstellen oder Worker dispatchen.

Lokale Befehle `list`, `create` und `show` arbeiten auf dem lokalen OpenClaw-Statusverzeichnis,
das vom aktuellen Profil verwendet wird. Verwenden Sie `--dev` oder `--profile <name>` auf dem
obersten `openclaw`-Befehl, wenn Sie einen anderen Status-Root benötigen.

## Fehlerbehebung

### Keine Karten werden angezeigt

Bestätigen Sie, dass das Plugin für dasselbe Profil und denselben Status-Root aktiviert ist:

```bash
openclaw plugins inspect workboard --runtime --json
```

Wenn das Dashboard Karten anzeigt, die CLI aber nicht, prüfen Sie, ob beide Befehle dieselbe
Einstellung für `--dev` oder `--profile` verwenden.

### Dispatch meldet nur datenbasierten Betrieb

Starten oder starten Sie den Gateway neu:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Versuchen Sie anschließend erneut `openclaw workboard dispatch`. Der datenbasierte Fallback ist für die lokale
Statusbereinigung nützlich, aber Worker-Läufe benötigen einen Live-Gateway.

### Dispatch startet nichts

Prüfen Sie, ob mindestens eine `ready`-Karte ohne aktiven Claim vorhanden ist:

```bash
openclaw workboard list --status ready
```

Karten können auch übersprungen werden, wenn derselbe Owner bereits laufende oder Review-Arbeit
hat. Verschieben Sie abgeschlossene Arbeit nach `done`, geben Sie veraltete Claims über die Workboard-Tools frei,
oder führen Sie Dispatch erneut aus, nachdem der aktive Worker fertig ist.

## Verwandte Themen

- [Workboard-Plugin](/de/plugins/workboard)
- [CLI-Referenz](/de/cli)
- [Slash-Befehle](/de/tools/slash-commands)
- [Control UI](/de/web/control-ui)
