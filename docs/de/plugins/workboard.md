---
read_when:
    - Sie möchten ein Kanban-ähnliches Arbeitsboard in der Control UI.
    - Sie aktivieren oder deaktivieren das mitgelieferte Workboard-Plugin.
    - Sie möchten geplante Agentenarbeit ohne einen externen Projektmanager nachverfolgen
summary: Optionales Dashboard-Arbeitsboard für agenteneigene Karten und Sitzungsübergaben
title: Workboard-Plugin
x-i18n:
    generated_at: "2026-07-16T13:10:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Das Workboard-Plugin fügt der
[Control UI](/de/web/control-ui) optional ein Board im Kanban-Stil hinzu: arbeitsbezogene Karten in Agent-Größe, die Zuweisung an Agents
und einen Link zurück zur Aufgabe, zum Lauf und zur Dashboard-Sitzung der Karte.

Workboard ist bewusst kompakt gehalten: Es verfolgt lokale operative Arbeiten für ein
OpenClaw Gateway. Es ersetzt weder GitHub Issues, Linear oder Jira noch
andere Projektmanagementsysteme für Teams.

## Aktivieren

Workboard ist im Lieferumfang enthalten, aber standardmäßig deaktiviert:

1. Öffnen Sie **Plugins** in der Control UI oder verwenden Sie `/settings/plugins` relativ zum
   konfigurierten Basispfad der Control UI. Beispielsweise verwendet ein Basispfad von `/openclaw`
   den Pfad `/openclaw/settings/plugins`.
2. Suchen Sie **Workboard** und wählen Sie **Aktivieren**. Da Workboard in
   OpenClaw enthalten ist, ist keine Aktion **Installieren** erforderlich.
3. Wenn die UI meldet, dass ein Neustart erforderlich ist, starten Sie das Gateway neu.

Die Registerkarte Workboard erscheint in der Dashboard-Navigation, nachdem die Plugin-Laufzeit geladen wurde.
Solange es deaktiviert ist, bleibt die Registerkarte in der Navigation ausgeblendet. Wenn die Route
`/workboard` direkt geöffnet wird, während das Plugin deaktiviert oder durch
`plugins.allow`/`plugins.deny` blockiert ist, wird anstelle von Kartendaten
ein Status angezeigt, dass das Plugin nicht verfügbar ist.

Der entsprechende CLI-Ablauf lautet:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Konfiguration

Workboard hat keine Plugin-spezifische Konfiguration. Aktivieren oder deaktivieren Sie es mit dem standardmäßigen
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
| `labels`    | frei formulierte Zeichenfolgen                                                                                |
| `agentId`   | optional zugewiesener Agent                                                                                   |
| verknüpfte Referenzen | optionale Aufgabe, optionaler Lauf, optionale Sitzung oder Quell-URL                                          |
| `execution` | optionale Metadaten für einen von der Karte gestarteten Codex-/Claude-Lauf (Engine, Modus, Modell, Sitzung, Lauf-ID, Status) |

Karten enthalten außerdem kompakte Metadaten zu Versuchen, Kommentaren, Links, Nachweisen,
Artefakten, Automatisierungseinstellungen, Anhängen, Worker-Protokollen, dem Worker-Protokollstatus,
Beanspruchungen, Diagnosen, Benachrichtigungen, der Vorlagen-ID, dem Archivstatus und
der Erkennung veralteter Sitzungen sowie eine Liste der letzten Ereignisse (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Mith diesen Metadaten kann eine
Bedienperson sehen, wie sich eine Karte durch das Board bewegt hat, ohne die verknüpfte
Sitzung zu öffnen. Sie bilden einen lokalen operativen Kontext und ersetzen weder
Sitzungstranskripte noch den Verlauf eines GitHub Issue.

Das Plugin und die Control UI verwenden denselben Vertrag für Workboard-Karten. Aktualisierungen des Dashboards
bewahren daher die Herkunft und Autorität des Arbeitsbereichs, den Beanspruchungsstatus, Diagnoseaktionen
und Sequenznummern von Benachrichtigungen, anstatt eine kleinere,
ausschließlich für die UI bestimmte Kopie der Karte zu projizieren. Unbekannte Diagnosetypen, Diagnoseschweregrade und
Benachrichtigungstypen werden ignoriert, bis beide Oberflächen sie unterstützen; sie werden niemals
in einen anderen gültigen Status umgeschrieben.

Das geöffnete Dashboard wird durch Invalidierungen von `plugin.workboard.changed` aktualisiert. Jedes
Ereignis enthält nur eine Store-Epoche und eine Revision; die UI liest anschließend kanonische
Karten über den regulären RPC `operator.read` erneut ein. Mehrere Revisionen werden zu
einem einzigen nachfolgenden Lesevorgang zusammengefasst. Workboard verschiebt diesen Lesevorgang, während eine Karte gezogen,
bearbeitet oder geschrieben wird, und setzt ihn fort, nachdem die lokale Interaktion abgeschlossen ist. Bei einer
erneuten Verbindung erfolgt immer ein kanonisches Neuladen. Es gibt keine routinemäßige Abfrage vollständiger Karten,
und **Aktualisieren** bleibt als manuelle Wiederherstellungsoption verfügbar.

Wenn mehr als ein Board vorhanden ist, enthält die Symbolleiste einen Filter **Board**, der auf
persistierten Board-Metadaten und nicht nur auf den derzeit sichtbaren Karten basiert. Leere
und archivierte Boards bleiben daher auswählbar. Karten ohne explizite
Board-ID gehören zum kanonischen Board `default`. Das ausgewählte Board wird
im Abfrageparameter `?board=` gespeichert, sodass die gefilterte Workboard-URL als Lesezeichen gespeichert
oder geteilt werden kann; durch die Auswahl von **Alle Boards** wird der Parameter entfernt.

Karten werden im eigenen Gateway-Status des Plugins gespeichert und zusammen mit dem übrigen
OpenClaw-Status dieses Gateways verschoben (siehe [Speicherung](#storage)).

## Arbeit von einer Karte aus starten

Nicht verknüpfte Karten können die Arbeit direkt starten:

- **Codex ausführen** / **Claude ausführen** startet einen aufgabenverfolgten Agent-Lauf mit einer
  expliziten Engine, sendet den Prompt der Karte und markiert die Karte als `running`. Codex-
  Läufe verwenden `openai/gpt-5.6-sol`; Claude-Läufe verwenden `anthropic/claude-sonnet-4-6`.
- **Codex öffnen** / **Claude öffnen** erstellt eine verknüpfte Dashboard-Sitzung, ohne
  den Prompt der Karte zu senden oder die Karte zu verschieben, für manuelle Arbeit, die mit
  dem Board verknüpft bleibt.

Autonome Starts verwenden den Pfad des Gateways für aufgabenverfolgte Agent-Läufe (standardmäßiger Agent
und standardmäßiges Modell, sofern Codex/Claude nicht ausdrücklich ausgewählt wird); Workboard verknüpft anschließend
die resultierende Aufgabe, die Lauf-ID und den Sitzungsschlüssel wieder mit der Karte. Jede verknüpfte
Ausführung zeichnet außerdem eine Zusammenfassung des Versuchs auf (Engine, Modus, Modell, Lauf-ID,
Zeitstempel, Status, fortlaufende Fehleranzahl), sodass wiederholte Fehler sichtbar bleiben.

Das Dashboard aktualisiert den Aufgabenstatus aus dem Aufgabenjournal des Gateways und ordnet
Aufgaben anhand der Aufgaben-ID, Lauf-ID oder des verknüpften Sitzungsschlüssels Karten zu. Eine Aufgabe in der Warteschlange oder in Ausführung
hält den Lebenszyklus der Karte aktiv; eine abgeschlossene, fehlgeschlagene, zeitüberschrittene oder
abgebrochene Aufgabe verschiebt die Karte gemäß derselben Synchronisierungsregel
wie verknüpfte Sitzungen in Richtung `review` oder `blocked` (siehe [Synchronisierung des Sitzungslebenszyklus](#session-lifecycle-sync)).

## Agent-Tools

| Tool                                                                                                                                             | Zweck                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Kompakte Karten mit Anspruchs-/Diagnosestatus auflisten; optionaler Board-Filter.                                                                                                          |
| `workboard_read`                                                                                                                                 | Eine Karte mit begrenztem Worker-Kontext zurückgeben (Notizen, Versuche, Kommentare, Links, Nachweise, Artefakte, übergeordnete Ergebnisse, letzte Arbeiten der zugewiesenen Person, aktive Diagnosen). |
| `workboard_create`                                                                                                                               | Eine Karte mit optionalen übergeordneten Karten, Mandant, Skills, Board, Workspace-Metadaten, Idempotenzschlüssel, Laufzeitlimit und Wiederholungsbudget erstellen.                       |
| `workboard_link`                                                                                                                                 | Eine übergeordnete Karte mit einer untergeordneten Karte verknüpfen. Untergeordnete Karten bleiben `todo`, bis jede übergeordnete Karte `done` erreicht; anschließend verschiebt die Dispatch-Hochstufung sie nach `ready`. |
| `workboard_claim`                                                                                                                                | Eine Karte für den aufrufenden Agent beanspruchen; verschiebt `backlog`/`todo`/`ready` nach `running`.                                          |
| `workboard_heartbeat`                                                                                                                            | Den Anspruchs-Heartbeat während eines längeren Laufs aktualisieren.                                                                                                                        |
| `workboard_release`                                                                                                                              | Den Anspruch nach Abschluss, Pausierung oder Übergabe freigeben; kann die Karte in einen Folgestatus verschieben.                                                                         |
| `workboard_complete` / `workboard_block`                                                                                                         | Strukturierte Lebenszyklus-Tools für abschließende Zusammenfassungen, Nachweise, Artefakte und Manifeste erstellter Karten (müssen auf Karten verweisen, die mit der abgeschlossenen Karte rückverknüpft sind) oder Blockierungsgründe. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Kleine Kartenanhänge im SQLite-Status des Plugins speichern, auf der Karte indizieren und im Worker-Kontext bereitstellen.                                                                |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Worker-Protokollzeilen erfassen und eine Karte blockieren, wenn ein automatisierter Worker beendet wird, ohne `workboard_complete`/`workboard_block` aufzurufen.                         |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Persistierte Board-Metadaten verwalten (Anzeigename, Beschreibung, Archivstatus, Standard-Workspace).                                                                                      |
| `workboard_runs`                                                                                                                                 | Den persistierten Verlauf der Ausführungsversuche für eine Karte zurückgeben.                                                                                                             |
| `workboard_specify`                                                                                                                              | Eine grobe Triage-/Backlog-Karte in eine präzisierte `todo`-Karte umwandeln; zeichnet die Spezifikationszusammenfassung auf der Karte auf.                                   |
| `workboard_decompose`                                                                                                                            | Eine übergeordnete Orchestrierungskarte in verknüpfte untergeordnete Karten auffächern, wobei Board-/Mandantenmetadaten übernommen werden; kann die übergeordnete Karte mit einem Manifest der erstellten Karten abschließen. |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Benachrichtigungsabonnements verwalten. Ereignisabrufe sind wiederholungssicher; `advance` verschiebt den dauerhaften Cursor, sodass Aufrufer fortfahren können, ohne Ereignisse abgeschlossener/fehlgeschlagener/veralteter Karten zu verlieren oder doppelt zu lesen. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Board-Namespaces und Warteschlangenstatistiken prüfen.                                                                                                                                    |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Festgefahrene Arbeit wiederherstellen oder übergeben.                                                                                                                                     |
| `workboard_comment` / `workboard_proof`                                                                                                          | Übergabenotizen hinzufügen oder Nachweis-/Artefaktreferenzen anhängen.                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Blockierte Arbeit zurück nach `todo` verschieben.                                                                                                                             |
| `workboard_move`                                                                                                                                 | Eine Karte in einen anderen Status verschieben; beanspruchte Karten erfordern den Agent-Anspruchsbereich des Aufrufers.                                                                   |
| `workboard_dispatch`                                                                                                                             | Die Hochstufung von Abhängigkeiten oder die Bereinigung veralteter Ansprüche anstoßen, ohne Worker zu starten; der Worker-Start erfolgt über Gateway- oder Slash-Befehl-Dispatch.         |

Beanspruchte Karten lehnen Mutationen durch Agent-Tools von anderen Agents ab, sofern der Aufrufer
nicht über das von `workboard_claim` zurückgegebene Anspruchstoken verfügt. Jede von einem
Agent-Tool oder Gateway-RPC-Aufruf zurückgegebene Karte schwärzt `metadata.claim.token` zu `[redacted]`
(das Token selbst wird einmalig auf oberster Ebene und ausschließlich von `workboard_claim` zurückgegeben),
sodass Dashboard-Bediener und andere Agents den Anspruchsstatus prüfen können, ohne jemals
ein verwendbares Token zu sehen. Die Wiederherstellung erfolgt über
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`; hierfür ist
das Token nicht erforderlich.

## Dispatch

Der Dispatch erfolgt Gateway-lokal: Er startet keine beliebigen Betriebssystemprozesse. Die Ausführung
liegt weiterhin bei normalen OpenClaw-Subagent-Sitzungen. Ein Dispatch-Durchlauf:

1. Stuft Karten hoch, deren Abhängigkeiten erfüllt sind.
2. Zeichnet Dispatch-Metadaten auf bereiten Karten auf.
3. Blockiert abgelaufene Ansprüche oder Läufe mit Zeitüberschreitung.
4. Kennzeichnet gemäß Board-Konfiguration Triage-Karten als Orchestrierungskandidaten.
5. Beansprucht einen kleinen Stapel bereiter Karten und startet Worker-Läufe über die
   Gateway-Subagent-Laufzeit.

Worker erhalten begrenzten Kartenkontext sowie das Anspruchstoken, das benötigt wird, um
über die Workboard-Tools den Heartbeat zu senden und die Karte abzuschließen oder zu blockieren.

Workspace-Pfade unterliegen den bestehenden Dateisystemberechtigungen des Aufrufers. Gateway-
Clients mit `operator.write` können konfigurierte Agent-Workspaces verwenden;
`operator.admin`-Clients können andere Host-Checkouts verwenden. Agent-Tools in einer Sandbox verwenden
ihren Sandbox-Workspace-Zugriff, während nicht in einer Sandbox ausgeführte reine Workspace-Tools ihren
konfigurierten Workspace-Stamm verwenden. Workboard zeichnet diese Berechtigung bei der Zuweisung eines Workspace
auf und bildet beim Dispatch erneut die Schnittmenge mit den aktuellen Berechtigungen des Aufrufers,
sodass eine persistierte Karte den Zugriff eines späteren Aufrufers nicht erweitern kann. Bei älteren Karten mit einem
expliziten Host-Workspace, aber ohne aufgezeichnete Berechtigung, muss dieser Workspace
vor einem vollständigen Host-Dispatch erneut gespeichert werden; Karten ohne Host-Pfad übernehmen beim
ersten Dispatch die Berechtigungen des aktuellen Aufrufers.

Workspace-gebundener Dispatch akzeptiert ein Verzeichnis oder einen Git-Checkout nur, wenn dessen
Repository-Stamm exakt mit dem Ziel-Workspace des Agents übereinstimmt. Eine Worktree-Anforderung
wird auf dieses Verzeichnis beschränkt und als Verzeichnis-Workspace persistiert, sodass der
Host weder den Checkout materialisiert noch Repository-Einrichtungscode ausführt. Der
Ziel-Worker muss für genau diesen Workspace eine beschreibbare, nicht gemeinsam genutzte Docker-Sandbox
verwenden, ohne privilegierte Ausführung, persistierte Host-/Node-Exec-Überschreibungen oder
nicht klassifizierte Plugin- und MCP-Tools. Workboard listet seine registrierten Tools auf,
anstatt einem `workboard_*`-Präfix zu vertrauen, und der Dispatch lehnt einen aktiven Docker-
Container ab, dessen Hash der Live-Mount-/Konfiguration veraltet ist. Der Dispatch meldet die
inkompatible Zielrichtlinie, anstatt einen weniger stark isolierten Worker zu starten.
Ein vollständiger Host-Dispatch kann andere lokale Checkouts als Ziel verwenden und behält die normale verwaltete
Worktree-Einrichtung bei.

Die Workspace-Berechtigung erzeugt kein zweites Berechtigungsmodell für den Kartenlebenszyklus.
Aufrufer, die Workboard-Karten ändern dürfen, können sie auf jeder Oberfläche manuell durch dieselben
Status verschieben; schreibgeschützter Workspace-Zugriff verhindert nur Worker-
Dispatches, die Schreibzugriff benötigen.

### Worker-Auswahl

Jeder Durchlauf startet standardmäßig **höchstens 3 Worker**. Bereite Karten werden nach
Priorität, dann Position und anschließend Erstellungszeit sortiert. Ein Durchlauf startet nur eine Karte pro
Besitzer/Agent und überspringt Besitzer, die bereits laufende oder zu prüfende Arbeit auf dem
Board haben. Archivierte Karten, Karten mit aktivem Anspruch und Karten, die sich nicht im Status `ready`
befinden, werden niemals für Worker-Starts ausgewählt (sie können weiterhin von der
Datenseite des Dispatches betroffen sein: Bereinigung veralteter Ansprüche, Hochstufung von Abhängigkeiten,
Bereinigung von Zeitüberschreitungen).

Sitzungsschlüssel sind pro Board/Karte deterministisch, sodass wiederholte Dispatches
zur selben Worker-Spur zurückführen, anstatt unabhängige Sitzungen zu erstellen:

- Zugewiesene Karten: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Nicht zugewiesene Karten: `subagent:workboard-<boardId>-<cardId>` (Gateway löst
  den konfigurierten Standard-Agent auf)

Wenn ein Worker nach dem Beanspruchen einer Karte nicht gestartet werden kann, blockiert Workboard die
Karte, löscht den Anspruch, zeichnet den Fehler beim Laufstart auf und fügt eine Worker-
Protokollzeile hinzu – sichtbar im Dashboard, in CLI-JSON, Agent-Tools und den Karten-
diagnosen.

### Einstiegspunkte

- Dashboard-Dispatch-Aktion
- `openclaw workboard dispatch`
- `/workboard dispatch` in einem befehlsfähigen Kanal

Alle drei verwenden die Gateway-Subagent-Laufzeit, wenn das Gateway verfügbar ist. Die
CLI verfügt über einen Operator-Fallback: Wenn der Gateway-Aufruf aufgrund eines
Verbindungs-/Nichtverfügbarkeitsfehlers (oder bei älteren Gateways aufgrund eines
`unknown method`-Fehlers) fehlschlägt und weder ein explizites
`--url`-/`--token`-Ziel noch ein konfiguriertes entferntes Gateway
(`OPENCLAW_GATEWAY_URL` oder `gateway.mode: remote`) gilt, führt die CLI einen reinen
Daten-Dispatch für den lokalen SQLite-Zustand aus. Dabei kann sie Abhängigkeiten
hochstufen, veraltete Beanspruchungen bereinigen und Runs mit Zeitüberschreitung
blockieren, aber keine Worker starten. Authentifizierungs-, Berechtigungs- und
Validierungsfehler eines erreichbaren Gateways werden nicht als Nichtverfügbarkeit
behandelt; sie werden als Befehlsfehler ausgegeben. Dasselbe gilt für jeden
Gateway-Fehler, wenn ein explizites `--url`-/`--token`-Ziel
angegeben wurde.

Board-Metadaten können `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` und `orchestratorProfile` festlegen. OpenClaw zeichnet diese
Absicht auf und stellt sie im Worker-Kontext bereit; die eigentliche
Spezifikation/Zerlegung erfolgt weiterhin über die normalen Workboard-Tools.

## CLI und Slash-Befehl

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Die Textausgabe von `list` blendet archivierte Karten standardmäßig
aus (`--include-archived` überschreibt dies); `--json` enthält immer
archivierte Karten und entspricht damit dem von bestehenden Skripten verwendeten
Vertrag für vollständige Karten. `show` und `move`
akzeptieren ein eindeutiges ID-Präfix. `list`, `create`,
`show` und `move` lesen bzw. schreiben den lokalen
Plugin-Zustand immer direkt. Nur `dispatch` ruft das laufende Gateway
auf, mit dem oben beschriebenen Fallback.

Unter [Workboard-CLI](/de/cli/workboard) finden Sie sämtliche Flags, die
JSON-Ausgabe, das Gateway-Fallback-Verhalten, die Handhabung von ID-Präfixen,
die Dispatch-Auswahlregeln und Informationen zur Fehlerbehebung.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` und `/workboard dispatch` entsprechen
der CLI. Auflisten und Anzeigen sind Lesevorgänge für jeden autorisierten
Befehlsabsender. Erstellen, Verschieben und Dispatch erfordern auf
Chat-Oberflächen den Eigentümerstatus oder einen Gateway-Client mit
`operator.write`/`operator.admin`. Manuelle Verschiebungen durch Operatoren
verwenden dasselbe Verhalten zum Überschreiben von Beanspruchungen wie
Drag-and-drop im Dashboard. Ihr Worktree-Zugriff unterliegt weiterhin derselben
oben beschriebenen Workspace-Grenze.

## Synchronisierung des Sitzungslebenszyklus

Karten können mit einer bestehenden Dashboard-Sitzung oder mit einer Sitzung
verknüpft werden, die beim Start der Arbeit über die Karte erstellt wird.
Verknüpfte Karten zeigen den Sitzungslebenszyklus direkt an: läuft, veraltet,
verknüpft und inaktiv, abgeschlossen, fehlgeschlagen oder nicht vorhanden.
Sie können auch eine bestehende Sitzung auf der Registerkarte „Sitzungen“ mit
**Zum Workboard hinzufügen** übernehmen; die Karte wird mit dieser Sitzung
verknüpft, verwendet die Sitzungsbezeichnung oder die letzte Benutzereingabe
als Titel und übernimmt, sofern verfügbar, die letzte Benutzereingabe sowie
die neueste Assistentenantwort als Ausgangspunkt für die Notizen.

Wenn die verknüpfte Sitzung nicht mehr vorhanden ist, bleibt die Karte aus
Kontextgründen verknüpft und bietet weiterhin Steuerelemente zum Neustart in
einer neuen Sitzung an. Wenn eine aktive verknüpfte Sitzung keine kürzlichen
Aktivitäten mehr meldet, markiert Workboard die Karte als
`stale` und speichert dies als Metadaten, bis der Lebenszyklus die
Markierung entfernt.

Während sich eine Karte in einem aktiven Arbeitsstatus befindet, folgt
Workboard der verknüpften Sitzung:

| Status der verknüpften Sitzung        | Kartenstatus |
| ------------------------------------- | ------------ |
| aktiv                                 | `running`   |
| abgeschlossen                         | `review`    |
| fehlgeschlagen, beendet, Zeitüberschreitung oder abgebrochen | `blocked`   |

**Manuelle Prüfstatus haben Vorrang.** Wenn eine Karte nach
`review`, `blocked` oder `done` verschoben wird,
endet die automatische Synchronisierung für diese Karte, bis sie wieder nach
`todo` oder `running` verschoben wird.

Beim Starten einer Karte werden normale Gateway-Sitzungen verwendet; Workboard
speichert lediglich Kartenmetadaten und Verknüpfungen. Gesprächstranskript,
Modellauswahl und Run-Lebenszyklus verbleiben im Zuständigkeitsbereich des
regulären Sitzungssystems. Verwenden Sie **Stoppen** bei einer aktiven
verknüpften Karte, um den aktiven Run abzubrechen. Workboard markiert diese
Karte als `blocked`, damit sie für die Nachverfolgung sichtbar bleibt.

Neue Karten können auf Grundlage von Workboard-Vorlagen
(`bugfix`, `docs`, `release`,
`pr_review`, `plugin`) erstellt werden. Vorlagen füllen Titel,
Notizen, Bezeichnungen und Priorität vorab aus; die Vorlagen-ID wird als
Kartenmetadatum gespeichert.

## Dashboard-Workflow

1. Öffnen Sie die Registerkarte „Workboard“ in der Control UI.
2. Erstellen Sie eine Karte mit Titel, Notizen, Priorität, Bezeichnungen, einem
   optionalen Agenten und einer optional verknüpften Sitzung – oder öffnen Sie
   „Sitzungen“ und wählen Sie für eine bestehende Sitzung **Zum Workboard hinzufügen**.
3. Ziehen Sie die Karte zwischen Spalten oder fokussieren Sie ihr kompaktes
   Statussteuerelement und verwenden Sie das Menü oder ArrowLeft/ArrowRight.
   Während des Ziehens wird die Ausgangskarte abgeblendet, und verfügbare
   Zielspalten erhalten eine Umrandung.
4. Starten Sie die Arbeit über die Karte, um eine Dashboard-Sitzung zu erstellen
   oder wiederzuverwenden.
5. Öffnen Sie die verknüpfte Sitzung über die Karte, während der Agent arbeitet.
6. Lassen Sie die Lebenszyklussynchronisierung laufende Arbeit nach
   `review`/`blocked` verschieben und verschieben Sie die
   Karte nach der Annahme manuell nach `done`.

## Diagnose

Diagnosen werden aus lokalen Kartenmetadaten berechnet. Integrierte Prüfungen
kennzeichnen Folgendes:

| Art                         | Bedingung                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Zugewiesene Karte mit `todo`/`backlog`/`ready`, die seit über 1 Stunde nicht aktualisiert wurde.             |
| `running_without_heartbeat` | Karte mit `running` ohne Beanspruchungs-Heartbeat oder Ausführungsaktualisierung seit über 20 Minuten. |
| `blocked_too_long`          | Karte mit `blocked`, die seit über 24 Stunden nicht aktualisiert wurde.                                   |
| `repeated_failures`         | Die erfasste Fehleranzahl der Karte erreicht 2 oder mehr.                                |
| `missing_proof`             | Karte mit `done` ohne Nachweise, Artefakte oder Anhänge.                          |
| `orphaned_session`          | Karte mit `running` und einem `sessionKey`, aber ohne `execution`-Metadaten.                |

## Berechtigungen

Gateway-RPC-Methoden befinden sich unter `workboard.*`:

| Umfang           | Methoden                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, Anhänge auflisten/abrufen, Benachrichtigungsereignisse lesen, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, erstellen/aktualisieren/verschieben/löschen/kommentieren/verknüpfen/Abhängigkeit verknüpfen/Nachweis/Artefakt, Anhänge hinzufügen/löschen, Worker-Protokoll, Protokollverstoß, beanspruchen/Heartbeat/freigeben/hochstufen/neu zuweisen/zurückfordern/abschließen/blockieren/Blockierung aufheben, `cards.dispatch`, `cards.bulk`, archivieren, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, Benachrichtigungen abonnieren/löschen/fortschreiben |

Keine RPC-Methode erfordert `operator.admin`. Browser, die mit
schreibgeschütztem Operatorzugriff verbunden sind, können das Board einsehen,
aber keine Karten verändern. Ein Administratorumfang erweitert die akzeptierten
Workboard-Hostpfade; er ändert nicht die verfügbaren Methoden.

## Speicherung

Workboard speichert dauerhafte Daten in einer Plugin-eigenen relationalen
SQLite-Datenbank im OpenClaw-Zustandsverzeichnis: Boards, Karten, Bezeichnungen,
Lebenszyklusereignisse, Run-Versuche, Kommentare, Abhängigkeitsverknüpfungen,
Nachweise, Artefaktreferenzen, Metadaten und Binärdaten von Anhängen, Diagnosen,
Benachrichtigungen, Worker-Protokolle, Protokollzustand und Abonnements befinden
sich sämtlich in Workboard-Tabellen (nicht in Plugin-Schlüssel-Wert-Einträgen).
Ein Kartenexport bewahrt den Verlauf des Boards, ohne den Inhalt binärer
Anhänge direkt einzubetten.

Installationen, die Workboard in der Version `.28` verwendet
haben, können `openclaw doctor --fix` ausführen, um die ausgelieferten älteren
Plugin-Zustandsnamensräume (`workboard.cards`, `workboard.boards`,
`workboard.notify` und, sofern vorhanden, `workboard.attachments`) in die
relationale Datenbank zu migrieren.

## Fehlerbehebung

**Die Registerkarte meldet, dass Workboard nicht verfügbar ist**

```bash
openclaw plugins inspect workboard --runtime --json
```

Wenn `plugins.allow` konfiguriert ist, fügen Sie `workboard`
hinzu. Wenn `plugins.deny` den Wert `workboard` enthält, entfernen
Sie ihn, bevor Sie das Plugin aktivieren.

**Karten werden nicht gespeichert**

Vergewissern Sie sich, dass die Browserverbindung über
`operator.write`-Zugriff verfügt. Schreibgeschützte Operatorsitzungen können
Karten auflisten, aber nicht erstellen, bearbeiten, verschieben oder löschen.

**Beim Starten einer Karte wird nicht die erwartete Sitzung geöffnet**

Überprüfen Sie die Agenten-ID und die verknüpfte Sitzung der Karte und öffnen
Sie anschließend „Sitzungen“ oder „Chat“, um den tatsächlichen Run-Status zu
prüfen.

**Der Dispatch startet keinen Worker**

Vergewissern Sie sich, dass mindestens eine Karte mit
`ready` ohne aktive Beanspruchung vorhanden ist:

```bash
openclaw workboard list --status ready
```

Wenn die CLI einen reinen Daten-Dispatch meldet, starten Sie das Gateway oder
starten Sie es neu und versuchen Sie es erneut. Ein reiner Daten-Dispatch
aktualisiert den lokalen Board-Zustand, kann aber keine Subagent-Worker-Runs
starten. Karten können auch übersprungen werden, wenn bereits eine andere Karte
für denselben Eigentümer oder Agenten ausgeführt wird oder auf eine Prüfung
wartet. Schließen Sie diese aktive Arbeit ab, blockieren Sie sie oder geben Sie
sie frei, bevor Sie weitere Arbeit für denselben Eigentümer dispatchen.

## Verwandte Themen

- [Control UI](/de/web/control-ui)
- [Workboard-CLI](/de/cli/workboard)
- [Plugins](/de/tools/plugin)
- [Plugins verwalten](/de/plugins/manage-plugins)
- [Sitzungen](/de/concepts/session)
