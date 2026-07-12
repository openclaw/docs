---
read_when:
    - Sie möchten ein Kanban-ähnliches Arbeitsboard in der Control UI
    - Sie aktivieren oder deaktivieren das mitgelieferte Workboard-Plugin
    - Sie möchten geplante Agentenarbeit ohne einen externen Projektmanager nachverfolgen
summary: Optionales Dashboard-Arbeitsboard für agenteneigene Karten und Sitzungsübergaben
title: Workboard-Plugin
x-i18n:
    generated_at: "2026-07-12T15:49:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Das Workboard-Plugin fügt der
[Control UI](/de/web/control-ui) optional ein Board im Kanban-Stil hinzu: Arbeitskarten in Agent-Größe, die Zuweisung an Agents
und einen Link zurück zur Aufgabe, zum Lauf und zur Dashboard-Sitzung der Karte.

Workboard ist bewusst kompakt gehalten: Es erfasst lokale operative Arbeiten für ein
OpenClaw Gateway. Es ersetzt weder GitHub Issues, Linear oder Jira noch
andere Projektmanagementsysteme für Teams.

## Aktivierung

Workboard ist im Lieferumfang enthalten, aber standardmäßig deaktiviert:

1. Öffnen Sie **Plugins** in der Control UI oder verwenden Sie `/settings/plugins` relativ zum
   konfigurierten Basispfad der Control UI. Ein Basispfad von `/openclaw`
   verwendet beispielsweise `/openclaw/settings/plugins`.
2. Suchen Sie **Workboard** und wählen Sie **Aktivieren**. Da Workboard in
   OpenClaw enthalten ist, ist keine Aktion zum **Installieren** erforderlich.
3. Wenn die UI meldet, dass ein Neustart erforderlich ist, starten Sie das Gateway neu.

Die Registerkarte Workboard wird in der Dashboard-Navigation angezeigt, nachdem die Plugin-Laufzeit geladen wurde.
Solange es deaktiviert ist, bleibt die Registerkarte in der Navigation ausgeblendet. Wenn Sie die
Route `/workboard` direkt öffnen, während das Plugin deaktiviert oder durch
`plugins.allow`/`plugins.deny` blockiert ist, wird anstelle der Kartendaten
ein Status angezeigt, dass das Plugin nicht verfügbar ist.

Der entsprechende CLI-Ablauf lautet:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Konfiguration

Workboard verfügt über keine Plugin-spezifische Konfiguration. Aktivieren oder deaktivieren Sie es mit dem standardmäßigen
Plugin-Eintrag:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Kartenfelder

| Feld        | Werte                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | frei wählbare Zeichenfolgen                                                                                   |
| `agentId`   | optional zugewiesener Agent                                                                                   |
| verknüpfte Referenzen | optionale Aufgabe, optionaler Lauf, optionale Sitzung oder Quell-URL                                  |
| `execution` | optionale Metadaten für einen von der Karte gestarteten Codex-/Claude-Lauf (Engine, Modus, Modell, Sitzung, Lauf-ID, Status) |

Karten enthalten außerdem kompakte Metadaten zu Versuchen, Kommentaren, Links, Nachweisen,
Artefakten, Automatisierungseinstellungen, Anhängen, Worker-Protokollen, dem Worker-Protokollstatus,
Ansprüchen, Diagnosen, Benachrichtigungen, der Vorlagen-ID, dem Archivstatus und
der Erkennung veralteter Sitzungen sowie eine Liste der letzten Ereignisse (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Anhand dieser Metadaten kann eine
Bedienperson nachvollziehen, wie eine Karte das Board durchlaufen hat, ohne die verknüpfte
Sitzung zu öffnen. Es handelt sich um lokalen operativen Kontext, nicht um einen Ersatz für
Sitzungstranskripte oder den Verlauf von GitHub Issues.

Karten werden im eigenen Gateway-Status des Plugins gespeichert und zusammen mit dem übrigen
OpenClaw-Status dieses Gateways verschoben (siehe [Speicherung](#storage)).

## Arbeit von einer Karte aus starten

Nicht verknüpfte Karten können Arbeit direkt starten:

- **Codex ausführen** / **Claude ausführen** startet einen aufgabenverfolgten Agent-Lauf mit einer
  expliziten Engine, sendet den Prompt der Karte und setzt die Karte auf `running`. Codex-
  Läufe verwenden `openai/gpt-5.6-sol`; Claude-Läufe verwenden `anthropic/claude-sonnet-4-6`.
- **Codex öffnen** / **Claude öffnen** erstellt eine verknüpfte Dashboard-Sitzung, ohne
  den Prompt der Karte zu senden oder die Karte zu verschieben, für manuelle Arbeiten, die
  mit dem Board verknüpft bleiben.

Autonome Starts verwenden den aufgabenverfolgten Agent-Laufpfad des Gateways (Standard-Agent
und -Modell, sofern Codex/Claude nicht ausdrücklich ausgewählt wurde). Workboard verknüpft anschließend
die resultierende Aufgabe, die Lauf-ID und den Sitzungsschlüssel wieder mit der Karte. Jede verknüpfte
Ausführung zeichnet außerdem eine Zusammenfassung des Versuchs auf (Engine, Modus, Modell, Lauf-ID,
Zeitstempel, Status, fortlaufende Fehleranzahl), damit wiederholte Fehler sichtbar bleiben.

Das Dashboard aktualisiert den Aufgabenstatus aus dem Aufgabenverzeichnis des Gateways und ordnet
Aufgaben anhand der Aufgaben-ID, Lauf-ID oder des verknüpften Sitzungsschlüssels den Karten zu. Eine in der Warteschlange befindliche oder laufende
Aufgabe hält den Lebenszyklus der Karte aktiv; eine abgeschlossene, fehlgeschlagene, wegen Zeitüberschreitung beendete oder
abgebrochene Aufgabe verschiebt die Karte gemäß derselben Synchronisierungsregel
wie verknüpfte Sitzungen in Richtung `review` oder `blocked` (siehe [Synchronisierung des Sitzungslebenszyklus](#session-lifecycle-sync)).

## Agent-Tools

| Tool                                                                                                                                             | Zweck                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Kompakte Karten mit Anspruchs-/Diagnosestatus auflisten; optionaler Board-Filter.                                                                                                         |
| `workboard_read`                                                                                                                                 | Eine Karte sowie begrenzten Worker-Kontext zurückgeben (Notizen, Versuche, Kommentare, Links, Nachweise, Artefakte, übergeordnete Ergebnisse, kürzliche Arbeit der zugewiesenen Person, aktive Diagnosen). |
| `workboard_create`                                                                                                                               | Eine Karte mit optionalen übergeordneten Karten, Mandant, Skills, Board, Workspace-Metadaten, Idempotenzschlüssel, Laufzeitlimit und Wiederholungsbudget erstellen.                        |
| `workboard_link`                                                                                                                                 | Eine übergeordnete Karte mit einer untergeordneten Karte verknüpfen. Untergeordnete Karten bleiben auf `todo`, bis alle übergeordneten Karten `done` erreichen; anschließend versetzt die Dispatch-Hochstufung sie auf `ready`. |
| `workboard_claim`                                                                                                                                | Eine Karte für den aufrufenden Agent beanspruchen; versetzt `backlog`/`todo`/`ready` in `running`.                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Den Heartbeat des Anspruchs während eines längeren Laufs aktualisieren.                                                                                                                    |
| `workboard_release`                                                                                                                              | Den Anspruch nach Abschluss, Pausierung oder Übergabe freigeben; kann die Karte in einen Folgestatus versetzen.                                                                           |
| `workboard_complete` / `workboard_block`                                                                                                         | Strukturierte Lebenszyklus-Tools für abschließende Zusammenfassungen, Nachweise, Artefakte und Manifeste erstellter Karten (müssen auf Karten verweisen, die mit der abgeschlossenen Karte rückverknüpft sind) oder für Blockierungsgründe. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Kleine Kartenanhänge im SQLite-Status des Plugins speichern, auf der Karte indizieren und im Worker-Kontext bereitstellen.                                                                |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Worker-Protokollzeilen aufzeichnen und eine Karte blockieren, wenn ein automatisierter Worker beendet wird, ohne `workboard_complete`/`workboard_block` aufzurufen.                       |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Persistierte Board-Metadaten verwalten (Anzeigename, Beschreibung, Archivstatus, Standard-Workspace).                                                                                      |
| `workboard_runs`                                                                                                                                 | Den persistierten Verlauf der Laufversuche für eine Karte zurückgeben.                                                                                                                     |
| `workboard_specify`                                                                                                                              | Eine grobe Triage-/Backlog-Karte in eine präzisierte `todo`-Karte umwandeln; zeichnet die Spezifikationszusammenfassung auf der Karte auf.                                                 |
| `workboard_decompose`                                                                                                                            | Eine übergeordnete Orchestrierungskarte in verknüpfte untergeordnete Karten auffächern, wobei Board-/Mandantenmetadaten übernommen werden; kann die übergeordnete Karte mit einem Manifest der erstellten Karten abschließen. |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Benachrichtigungsabonnements verwalten. Ereignislesevorgänge sind wiederholungssicher; `advance` verschiebt den dauerhaften Cursor, sodass Aufrufer fortfahren können, ohne Ereignisse abgeschlossener/fehlgeschlagener/veralteter Karten zu verlieren oder doppelt zu lesen. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Board-Namespaces und Warteschlangenstatistiken prüfen.                                                                                                                                    |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Feststeckende Arbeit wiederherstellen oder übergeben.                                                                                                                                      |
| `workboard_comment` / `workboard_proof`                                                                                                          | Übergabenotizen hinzufügen oder Nachweis-/Artefaktverweise anhängen.                                                                                                                       |
| `workboard_unblock`                                                                                                                              | Blockierte Arbeit zurück auf `todo` versetzen.                                                                                                                                            |
| `workboard_dispatch`                                                                                                                             | Die Hochstufung von Abhängigkeiten oder die Bereinigung veralteter Ansprüche anstoßen.                                                                                                    |

Beanspruchte Karten lehnen Agent-Tool-Mutationen anderer Agents ab, sofern der
Aufrufer nicht über das von `workboard_claim` zurückgegebene Anspruchstoken
verfügt. Bei jeder Karte, die von einem Agent-Tool oder Gateway-RPC-Aufruf
zurückgegeben wird, ist `metadata.claim.token` als `[redacted]` unkenntlich
gemacht (das Token selbst wird genau einmal auf oberster Ebene und nur von
`workboard_claim` zurückgegeben), sodass Dashboard-Bediener und andere Agents
den Anspruchsstatus prüfen können, ohne jemals ein verwendbares Token zu
sehen. Die Wiederherstellung erfolgt über
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, wofür das Token
nicht erforderlich ist.

## Dispatch

Dispatch erfolgt lokal im Gateway: Dabei werden keine beliebigen
Betriebssystemprozesse gestartet. Die normalen OpenClaw-Subagent-Sitzungen
übernehmen weiterhin die Ausführung. Ein Dispatch-Durchlauf:

1. Stuft Karten hoch, deren Abhängigkeiten erfüllt sind.
2. Zeichnet Dispatch-Metadaten auf bereiten Karten auf.
3. Blockiert abgelaufene Ansprüche oder Läufe mit Zeitüberschreitung.
4. Markiert anhand der Board-Konfiguration Triage-Karten als Orchestrierungskandidaten.
5. Beansprucht einen kleinen Stapel bereiter Karten und startet Worker-Läufe
   über die Subagent-Laufzeit des Gateways.

Worker erhalten begrenzten Kartenkontext sowie das Anspruchstoken, das
erforderlich ist, um über die Workboard-Tools einen Heartbeat zu senden oder
die Karte abzuschließen beziehungsweise zu blockieren.

### Worker-Auswahl

Jeder Durchlauf startet standardmäßig **höchstens 3 Worker**. Bereite Karten
werden nach Priorität, dann nach Position und anschließend nach
Erstellungszeit sortiert. Ein Durchlauf startet nur eine Karte pro
Besitzer/Agent und überspringt Besitzer, die bereits laufende oder zur Prüfung
anstehende Arbeit auf dem Board haben. Archivierte Karten, Karten mit einem
aktiven Anspruch und Karten, deren Status nicht `ready` ist, werden niemals
zum Starten von Workern ausgewählt (sie können jedoch weiterhin von der
Datenseite des Dispatch betroffen sein: Bereinigung veralteter Ansprüche,
Hochstufung von Abhängigkeiten, Bereinigung von Zeitüberschreitungen).

Sitzungsschlüssel sind pro Board/Karte deterministisch, sodass wiederholte
Dispatches zurück zur selben Worker-Spur geleitet werden, anstatt unabhängige
Sitzungen zu erstellen:

- Zugewiesene Karten: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Nicht zugewiesene Karten: `subagent:workboard-<boardId>-<cardId>` (das Gateway
  ermittelt den konfigurierten Standard-Agent)

Wenn ein Worker nach dem Beanspruchen einer Karte nicht gestartet werden kann,
blockiert Workboard die Karte, löscht den Anspruch, zeichnet den Fehler beim
Starten des Laufs auf und fügt eine Worker-Protokollzeile hinzu – sichtbar im
Dashboard, im CLI-JSON, in Agent-Tools und in der Kartendiagnose.

### Einstiegspunkte

- Dispatch-Aktion im Dashboard
- `openclaw workboard dispatch`
- `/workboard dispatch` in einem befehlsfähigen Kanal

Alle drei verwenden die Subagent-Laufzeit des Gateways, wenn das Gateway
verfügbar ist. Die CLI verfügt über genau eine Bediener-Ausweichlösung: Wenn
der Gateway-Aufruf aufgrund eines Verbindungs-/Nichtverfügbarkeitsfehlers
fehlschlägt (oder bei älteren Gateways aufgrund eines `unknown method`-Fehlers)
und weder ein explizites `--url`-/`--token`-Ziel noch ein konfiguriertes
Remote-Gateway (`OPENCLAW_GATEWAY_URL` oder `gateway.mode: remote`) zutrifft,
führt die CLI einen rein datenbezogenen Dispatch mit dem lokalen SQLite-Status
aus – sie kann Abhängigkeiten hochstufen, veraltete Ansprüche bereinigen und
Läufe mit Zeitüberschreitung blockieren, aber keine Worker starten.
Authentifizierungs-, Berechtigungs- und Validierungsfehler eines erreichbaren
Gateways werden nicht als Nichtverfügbarkeit behandelt; sie werden als
Befehlsfehler ausgegeben. Dasselbe gilt für jeden Gateway-Fehler, wenn ein
explizites `--url`-/`--token`-Ziel angegeben wurde.

Board-Metadaten können `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` und `orchestratorProfile` festlegen. OpenClaw zeichnet diese
Absicht auf und stellt sie im Worker-Kontext bereit; die eigentliche
Spezifikation/Zerlegung erfolgt weiterhin über die normalen Workboard-Tools.

## CLI und Slash-Befehl

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Veralteten Kartenlebenszyklus korrigieren" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Die Textausgabe von `list` blendet archivierte Karten standardmäßig aus
(`--include-archived` setzt dies außer Kraft); `--json` enthält immer
archivierte Karten und entspricht damit dem von vorhandenen Skripten
verwendeten Vertrag für vollständige Karten. `show` akzeptiert ein
eindeutiges ID-Präfix. `list`, `create` und `show` lesen beziehungsweise
schreiben den lokalen Plugin-Status immer direkt. Nur `dispatch` ruft das
laufende Gateway auf, mit der oben beschriebenen Ausweichlösung.

Vollständige Flags, JSON-Ausgabe, Gateway-Ausweichverhalten, Behandlung von
ID-Präfixen, Dispatch-Auswahlregeln und Fehlerbehebung finden Sie unter
[Workboard-CLI](/de/cli/workboard).

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`
und `/workboard dispatch` entsprechen der CLI. Auflisten und Anzeigen sind
Lesevorgänge für alle autorisierten Befehlsabsender. Erstellen und Dispatch
erfordern auf Chat-Oberflächen den Besitzerstatus oder einen Gateway-Client
mit `operator.write`/`operator.admin`.

## Synchronisierung des Sitzungslebenszyklus

Karten können mit einer bestehenden Dashboard-Sitzung oder mit einer Sitzung verknüpft werden, die erstellt wird, wenn Sie die Arbeit über die Karte
starten. Verknüpfte Karten zeigen den Sitzungslebenszyklus direkt an:
laufend, veraltet, verknüpft und inaktiv, abgeschlossen, fehlgeschlagen oder nicht vorhanden. Sie können auch eine
bestehende Sitzung auf der Registerkarte Sessions mit **Add to Workboard** erfassen; die Karte
wird mit dieser Sitzung verknüpft, verwendet die Sitzungsbezeichnung oder die letzte Benutzereingabe als Titel
und übernimmt als Notizen die letzte Benutzereingabe sowie die neueste Assistentenantwort,
sofern verfügbar.

Wenn die verknüpfte Sitzung nicht mehr vorhanden ist, bleibt die Karte für den Kontext verknüpft und
bietet weiterhin Steuerelemente zum Starten, um mit einer neuen Sitzung neu zu beginnen. Wenn eine aktive
verknüpfte Sitzung keine aktuelle Aktivität mehr meldet, markiert Workboard die Karte als
`stale` und speichert dies als Metadaten, bis der Lebenszyklus die Markierung aufhebt.

Während sich eine Karte in einem aktiven Arbeitsstatus befindet, folgt Workboard der verknüpften Sitzung:

| Status der verknüpften Sitzung             | Kartenstatus |
| ------------------------------------------ | ------------ |
| aktiv                                      | `running`    |
| abgeschlossen                              | `review`     |
| fehlgeschlagen, beendet, Zeitüberschreitung oder abgebrochen | `blocked`    |

**Manuelle Prüfstatus haben Vorrang.** Wenn Sie eine Karte nach `review`, `blocked` oder `done`
verschieben, wird die automatische Synchronisierung für diese Karte beendet, bis Sie sie wieder nach `todo` oder `running` verschieben.

Beim Starten einer Karte werden normale Gateway-Sitzungen verwendet; Workboard speichert lediglich Kartenmetadaten
und Verknüpfungen. Gesprächsprotokoll, Modellauswahl und Ausführungslebenszyklus
bleiben Eigentum des regulären Sitzungssystems. Verwenden Sie **Stop** auf einer aktiven
verknüpften Karte, um die aktive Ausführung abzubrechen – Workboard markiert diese Karte als `blocked`, damit
sie für die Nachverfolgung sichtbar bleibt.

Neue Karten können aus Workboard-Vorlagen (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`) erstellt werden. Vorlagen füllen Titel, Notizen, Bezeichnungen und Priorität vorab aus;
die Vorlagen-ID wird als Kartenmetadaten gespeichert.

## Dashboard-Arbeitsablauf

1. Öffnen Sie die Registerkarte Workboard in der Control UI.
2. Erstellen Sie eine Karte mit Titel, Notizen, Priorität, Bezeichnungen, optionalem Agenten und
   optionaler verknüpfter Sitzung – oder öffnen Sie Sessions und wählen Sie für eine bestehende Sitzung **Add to Workboard**.
3. Ziehen Sie die Karte zwischen den Spalten oder fokussieren Sie ihre kompakte Statussteuerung und verwenden Sie
   das Menü oder ArrowLeft/ArrowRight.
4. Starten Sie die Arbeit über die Karte, um eine Dashboard-Sitzung zu erstellen oder wiederzuverwenden.
5. Öffnen Sie die verknüpfte Sitzung über die Karte, während der Agent arbeitet.
6. Lassen Sie die Lebenszyklussynchronisierung laufende Arbeit nach `review`/`blocked` verschieben und verschieben Sie
   die Karte anschließend manuell nach `done`, wenn sie akzeptiert wurde.

## Diagnose

Diagnosen werden aus lokalen Kartenmetadaten berechnet. Integrierte Prüfungen kennzeichnen:

| Art                         | Bedingung                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Zugewiesene Karte mit Status `todo`/`backlog`/`ready`, die seit mehr als 1 Stunde nicht aktualisiert wurde. |
| `running_without_heartbeat` | Karte mit Status `running` ohne Anspruchs-Heartbeat oder Ausführungsaktualisierung seit mehr als 20 Minuten. |
| `blocked_too_long`          | Karte mit Status `blocked`, die seit mehr als 24 Stunden nicht aktualisiert wurde. |
| `repeated_failures`         | Die erfasste Fehleranzahl der Karte erreicht 2 oder mehr.                      |
| `missing_proof`             | Karte mit Status `done` ohne Nachweis, Artefakte oder Anhänge.                 |
| `orphaned_session`          | Karte mit Status `running` mit einem `sessionKey`, aber ohne `execution`-Metadaten. |

## Berechtigungen

Gateway-RPC-Methoden befinden sich unter `workboard.*`:

| Bereich          | Methoden                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, Anhänge auflisten/abrufen, Benachrichtigungsereignisse lesen, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                          |
| `operator.write` | `cards.diagnostics.refresh`, erstellen/aktualisieren/verschieben/löschen/kommentieren/verknüpfen/Abhängigkeit verknüpfen/Nachweis/Artefakt, Anhänge hinzufügen/löschen, Worker-Protokoll, Protokollverstoß, beanspruchen/Heartbeat/freigeben/hochpriorisieren/neu zuweisen/zurückfordern/abschließen/blockieren/Blockierung aufheben, `cards.dispatch`, `cards.bulk`, archivieren, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, Benachrichtigungen abonnieren/löschen/fortschalten |

Keine RPC-Methode erfordert `operator.admin`. Browser, die mit schreibgeschütztem
Operatorzugriff verbunden sind, können das Board einsehen, aber keine Karten ändern.

## Speicherung

Workboard speichert dauerhafte Daten in einer Plugin-eigenen relationalen SQLite-Datenbank
im OpenClaw-Statusverzeichnis: Boards, Karten, Bezeichnungen, Lebenszyklusereignisse,
Ausführungsversuche, Kommentare, Abhängigkeitsverknüpfungen, Nachweise, Artefaktreferenzen,
Anhangsmetadaten und -blobs, Diagnosen, Benachrichtigungen, Worker-Protokolle,
Protokollstatus und Abonnements befinden sich sämtlich in Workboard-Tabellen (nicht in
Plugin-Schlüssel-Wert-Einträgen). Ein Kartenexport bewahrt den Ablauf des Boards,
ohne die Blob-Inhalte von Anhängen einzubetten.

Installationen, die Workboard in der Version `.28` verwendet haben, können
`openclaw doctor --fix` ausführen, um die ausgelieferten älteren Plugin-Statusnamensräume
(`workboard.cards`, `workboard.boards`, `workboard.notify` und, sofern vorhanden,
`workboard.attachments`) in die relationale Datenbank zu migrieren.

## Fehlerbehebung

**Die Registerkarte meldet, dass Workboard nicht verfügbar ist**

```bash
openclaw plugins inspect workboard --runtime --json
```

Wenn `plugins.allow` konfiguriert ist, fügen Sie `workboard` hinzu. Wenn `plugins.deny`
`workboard` enthält, entfernen Sie es, bevor Sie das Plugin aktivieren.

**Karten werden nicht gespeichert**

Stellen Sie sicher, dass die Browserverbindung über `operator.write`-Zugriff verfügt. Schreibgeschützte Operator-
sitzungen können Karten auflisten, sie jedoch nicht erstellen, bearbeiten, verschieben oder löschen.

**Beim Starten einer Karte wird nicht die erwartete Sitzung geöffnet**

Prüfen Sie die Agenten-ID und die verknüpfte Sitzung der Karte und öffnen Sie anschließend Sessions oder Chat, um
den tatsächlichen Ausführungsstatus zu prüfen.

**Beim Dispatch wird kein Worker gestartet**

Stellen Sie sicher, dass mindestens eine Karte mit Status `ready` ohne aktiven Anspruch vorhanden ist:

```bash
openclaw workboard list --status ready
```

Wenn die CLI einen reinen Daten-Dispatch meldet, starten Sie den Gateway oder starten Sie ihn neu und
versuchen Sie es erneut – ein reiner Daten-Dispatch aktualisiert den lokalen Board-Status, kann jedoch keine
Subagent-Worker-Ausführungen starten. Karten können auch übersprungen werden, wenn eine andere Karte für denselben
Eigentümer oder Agenten bereits ausgeführt wird oder auf eine Prüfung wartet; schließen Sie diese aktive Arbeit ab,
blockieren Sie sie oder geben Sie sie frei, bevor Sie weitere Arbeit für denselben
Eigentümer dispatchen.

## Verwandte Themen

- [Control UI](/de/web/control-ui)
- [Workboard-CLI](/de/cli/workboard)
- [Plugins](/de/tools/plugin)
- [Plugins verwalten](/de/plugins/manage-plugins)
- [Sitzungen](/de/concepts/session)
