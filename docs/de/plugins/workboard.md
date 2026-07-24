---
read_when:
    - Sie möchten ein Arbeitsboard im Kanban-Stil in der Control UI
    - Sie aktivieren oder deaktivieren das gebündelte Workboard-Plugin
    - Sie möchten geplante Agentenarbeit ohne einen externen Projektmanager nachverfolgen
summary: Optionales Dashboard-Arbeitsboard für agenteneigene Karten und Sitzungsübergabe
title: Workboard-Plugin
x-i18n:
    generated_at: "2026-07-24T05:08:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ec05c990c3559015780d9cb80f3ceedd7cc79db89ccf1afd65906c8c7630331
    source_path: plugins/workboard.md
    workflow: 16
---

Das Workboard-Plugin fügt dem
[Control UI](/de/web/control-ui) optional ein Board im Kanban-Stil hinzu: Arbeitskarten in Agent-gerechter Größe, Zuweisung an Agents
und einen Link zurück zur Aufgabe, zum Lauf und zur Dashboard-Sitzung der Karte.

Workboard ist bewusst kompakt gehalten: Es erfasst lokale betriebliche Arbeit für ein
OpenClaw Gateway. Es ist kein Ersatz für GitHub Issues, Linear, Jira oder
andere Projektmanagementsysteme für Teams.

## Aktivieren

Workboard ist gebündelt, aber standardmäßig deaktiviert:

1. Öffnen Sie **Plugins** im Control UI oder verwenden Sie `/settings/plugins` relativ zum
   konfigurierten Basispfad des Control UI. Beispielsweise verwendet ein Basispfad von `/openclaw`
   den Pfad `/openclaw/settings/plugins`.
2. Suchen Sie **Workboard** und wählen Sie **Aktivieren**. Da Workboard in
   OpenClaw enthalten ist, ist keine Aktion **Installieren** erforderlich.
3. Wenn die Benutzeroberfläche meldet, dass ein Neustart erforderlich ist, starten Sie das Gateway neu.

Die Registerkarte „Workboard“ erscheint in der Dashboard-Navigation, nachdem die Plugin-Laufzeit geladen wurde.
Solange das Plugin deaktiviert ist, bleibt die Registerkarte in der Navigation ausgeblendet. Wenn die Route
`/workboard` direkt geöffnet wird, während das Plugin deaktiviert oder durch
`plugins.allow`/`plugins.deny` blockiert ist, wird anstelle von Kartendaten
der Status „Plugin nicht verfügbar“ angezeigt.

Der entsprechende CLI-Ablauf lautet:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Konfiguration

Workboard besitzt keine Plugin-spezifische Konfiguration. Aktivieren oder deaktivieren Sie es über den standardmäßigen
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
| `labels`    | frei formatierbare Zeichenfolgen                                                                               |
| `agentId`   | optional zugewiesener Agent                                                                                    |
| verknüpfte Referenzen | optionale Aufgabe, optionaler Lauf, optionale Sitzung oder Quell-URL                                           |
| `execution` | optionale Metadaten für einen von der Karte gestarteten Codex-/Claude-Lauf (Engine, Modus, Modell, Sitzung, Lauf-ID, Status) |

Karten enthalten außerdem kompakte Metadaten zu Versuchen, Kommentaren, Links, Nachweisen,
Artefakten, Automatisierungseinstellungen, Anhängen, Worker-Protokollen, dem Worker-Protokollstatus,
Beanspruchungen, Diagnosen, Benachrichtigungen, der Vorlagen-ID, dem Archivstatus und
der Erkennung veralteter Sitzungen sowie eine Liste der letzten Ereignisse (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Anhand dieser Metadaten kann ein
Operator nachvollziehen, wie sich eine Karte durch das Board bewegt hat, ohne die verknüpfte
Sitzung zu öffnen. Sie stellen lokalen betrieblichen Kontext dar und sind kein Ersatz für
Sitzungstranskripte oder den Verlauf eines GitHub-Issues.

Das Plugin und das Control UI verwenden denselben Workboard-Kartenvertrag. Dashboard-Aktualisierungen
bewahren daher die Herkunft und Autorität des Workspace, den Beanspruchungsstatus, Diagnoseaktionen
und Sequenznummern von Benachrichtigungen, anstatt eine kleinere, nur für die Benutzeroberfläche bestimmte
Kopie der Karte zu projizieren. Unbekannte Diagnosearten, Diagnoseschweregrade und
Benachrichtigungsarten werden ignoriert, bis beide Oberflächen sie unterstützen. Sie werden niemals
in einen anderen gültigen Status umgeschrieben.

Das geöffnete Dashboard wird durch `plugin.workboard.changed`-Invalidierungen aktualisiert. Jedes
Ereignis enthält lediglich eine Store-Epoche und eine Revision. Anschließend liest die Benutzeroberfläche die kanonischen
Karten über den regulären RPC `operator.read` erneut ein. Mehrere Revisionen werden zu
einem einzigen nachfolgenden Lesevorgang zusammengeführt. Workboard verschiebt diesen Lesevorgang, während eine Karte gezogen,
bearbeitet oder geschrieben wird, und setzt ihn fort, nachdem die lokale Interaktion abgeschlossen ist. Bei einer
erneuten Verbindung wird stets ein kanonisches Neuladen durchgeführt. Es findet keine routinemäßige Abfrage vollständiger Karten
statt und **Aktualisieren** bleibt als manuelle Wiederherstellungsoption verfügbar.

Wenn mehrere Boards vorhanden sind, enthält die Symbolleiste einen Filter **Board**, der auf
persistierten Board-Metadaten statt nur auf den aktuell sichtbaren Karten basiert. Leere
und archivierte Boards bleiben daher auswählbar. Karten ohne explizite
Board-ID gehören zum kanonischen Board `default`. Jedes Board besitzt eine kanonische
Seite `/workboard/<boardId>`, die als Lesezeichen gespeichert, geteilt oder in der
Seitenleiste angeheftet werden kann. Die zuvor ausgelieferte Form `/workboard?board=<boardId>` bleibt ein
Kompatibilitätsalias und leitet unter Beibehaltung anderer Abfrageparameter auf diese Seite weiter.
Durch Auswahl von **Alle Boards** kehren Sie zu `/workboard` zurück.

Karten werden im eigenen Gateway-Status des Plugins gespeichert und zusammen mit dem übrigen
OpenClaw-Status dieses Gateways verschoben (siehe [Speicherung](#storage)).

## Arbeit von einer Karte aus starten

Nicht verknüpfte Karten können die Arbeit direkt starten:

- **Codex ausführen** / **Claude ausführen** startet einen aufgabenverfolgten Agent-Lauf mit einer
  expliziten Engine, sendet die Eingabeaufforderung der Karte und markiert die Karte als `running`. Codex-
  Läufe verwenden `openai/gpt-5.6-sol`; Claude-Läufe verwenden `anthropic/claude-sonnet-4-6`.
- **Codex öffnen** / **Claude öffnen** erstellt eine verknüpfte Dashboard-Sitzung, ohne
  die Eingabeaufforderung der Karte zu senden oder die Karte zu verschieben, für manuelle Arbeit, die mit
  dem Board verknüpft bleibt.

Autonome Starts verwenden den Pfad des Gateways für aufgabenverfolgte Agent-Läufe (Standard-Agent
und Standardmodell, sofern Codex/Claude nicht ausdrücklich ausgewählt wird). Workboard verknüpft anschließend die
resultierende Aufgabe, Lauf-ID und den Sitzungsschlüssel wieder mit der Karte. Jede verknüpfte
Ausführung zeichnet außerdem eine Zusammenfassung des Versuchs auf (Engine, Modus, Modell, Lauf-ID,
Zeitstempel, Status, fortlaufende Fehleranzahl), sodass wiederholte Fehler sichtbar bleiben.

Das Dashboard aktualisiert den Aufgabenstatus aus dem Aufgabenbuch des Gateways und ordnet
Aufgaben anhand der Aufgaben-ID, Lauf-ID oder des verknüpften Sitzungsschlüssels Karten zu. Eine Aufgabe in der Warteschlange oder in Ausführung
hält den Lebenszyklus der Karte aktiv. Eine abgeschlossene, fehlgeschlagene, wegen Zeitüberschreitung beendete oder
abgebrochene Aufgabe verschiebt die Karte mithilfe derselben Synchronisierungsregel
wie bei verknüpften Sitzungen in Richtung `review` oder `blocked` (siehe [Synchronisierung des Sitzungslebenszyklus](#session-lifecycle-sync)).

## Agent-Tools

| Tool                                                                                                                                             | Zweck                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Kompakte Karten mit Claim-/Diagnosestatus auflisten; optional nach Board filtern.                                                                                                         |
| `workboard_read`                                                                                                                                 | Eine Karte sowie begrenzten Worker-Kontext zurückgeben (Notizen, Versuche, Kommentare, Links, Nachweise, Artefakte, übergeordnete Ergebnisse, aktuelle Arbeit der zugewiesenen Person, aktive Diagnosen). |
| `workboard_create`                                                                                                                               | Eine Karte mit optionalen übergeordneten Karten, Mandant, Skills, Board, Workspace-Metadaten, Idempotenzschlüssel, Laufzeitlimit und Wiederholungsbudget erstellen.                       |
| `workboard_link`                                                                                                                                 | Eine übergeordnete Karte mit einer untergeordneten Karte verknüpfen. Untergeordnete Karten bleiben `todo`, bis jede übergeordnete Karte `done` erreicht; anschließend werden sie durch die Dispatch-Hochstufung nach `ready` verschoben. |
| `workboard_claim`                                                                                                                                | Eine Karte für den aufrufenden Agent beanspruchen; verschiebt `backlog`/`todo`/`ready` nach `running`.                                         |
| `workboard_heartbeat`                                                                                                                            | Den Claim-Heartbeat während eines längeren Laufs aktualisieren.                                                                                                                            |
| `workboard_release`                                                                                                                              | Den Claim nach Abschluss, Pause oder Übergabe freigeben; kann die Karte in einen Folgestatus verschieben.                                                                                  |
| `workboard_complete` / `workboard_block`                                                                                                         | Strukturierte Lebenszyklus-Tools für abschließende Zusammenfassungen, Nachweise, Artefakte und Manifeste erstellter Karten (müssen auf Karten verweisen, die mit der abgeschlossenen Karte rückverknüpft sind) oder Gründe für Blockierungen. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Kleine Kartenanhänge im SQLite-Status des Plugins speichern, auf der Karte indizieren und im Worker-Kontext bereitstellen.                                                                |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Worker-Protokollzeilen aufzeichnen und eine Karte blockieren, wenn ein automatisierter Worker beendet wird, ohne `workboard_complete`/`workboard_block` aufzurufen.                       |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Persistierte Board-Metadaten verwalten (Anzeigename, Beschreibung, Archivierungsstatus, Standard-Workspace).                                                                               |
| `workboard_runs`                                                                                                                                 | Den persistierten Verlauf der Laufversuche für eine Karte zurückgeben.                                                                                                                     |
| `workboard_specify`                                                                                                                              | Eine grobe Triage-/Backlog-Karte in eine geklärte `todo`-Karte umwandeln; zeichnet die Spezifikationszusammenfassung auf der Karte auf.                                      |
| `workboard_decompose`                                                                                                                            | Eine übergeordnete Orchestrierungskarte in verknüpfte untergeordnete Karten auffächern, wobei Board-/Mandantenmetadaten übernommen werden; kann die übergeordnete Karte mit einem Manifest erstellter Karten abschließen. |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Benachrichtigungsabonnements verwalten. Ereignislesevorgänge sind wiederholungssicher; `advance` verschiebt den dauerhaften Cursor, sodass Aufrufer fortfahren können, ohne Ereignisse abgeschlossener/fehlgeschlagener/veralteter Karten zu verlieren oder doppelt zu lesen. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Board-Namespaces und Warteschlangenstatistiken prüfen.                                                                                                                                    |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Festgefahrene Arbeit wiederherstellen oder übergeben.                                                                                                                                     |
| `workboard_comment` / `workboard_proof`                                                                                                          | Übergabenotizen hinzufügen oder Verweise auf Nachweise/Artefakte anhängen.                                                                                                                |
| `workboard_unblock`                                                                                                                              | Blockierte Arbeit zurück nach `todo` verschieben.                                                                                                                             |
| `workboard_move`                                                                                                                                 | Eine Karte in einen anderen Status verschieben; beanspruchte Karten erfordern den Agent-Claim-Bereich des Aufrufers.                                                                      |
| `workboard_dispatch`                                                                                                                             | Die Hochstufung von Abhängigkeiten oder die Bereinigung veralteter Claims anstoßen, ohne Worker zu starten; Worker werden über den Gateway- oder Slash-Befehl-Dispatch gestartet.          |

Nachweisstatus sind von Workern gemeldete Ergebnisse, keine unabhängige Überprüfung. Ein Eintrag `passed`
bedeutet, dass der Worker meldet, sein Befehl oder seine Prüfung sei erfolgreich gewesen; Nutzer, die
ein unabhängiges Qualitäts-Gate benötigen, sollten den angehängten Befehl, die URL oder das Artefakt prüfen und
eine eigene Verifizierung ausführen. `workboard_proof` gibt die `proofId` des neuen Datensatzes zurück. Wenn
`workboard_complete` den Endstatus desselben Nachweises meldet, übergeben Sie `proofId`, damit der
ausstehende Datensatz an Ort und Stelle aufgelöst wird, ohne seine Identität oder seinen Zeitstempel zu verlieren. Ein Nachweis, der
bereits denselben Endstatus hat, wird unverändert wiederverwendet. Ein Abschlussnachweis ohne
`proofId` bleibt nur anhängbar, sodass ein späterer Wiederholungsversuch den älteren Verlauf nicht allein deshalb
umschreiben kann, weil sein Befehl oder seine Notiz identisch ist.

Beanspruchte Karten lehnen Agent-Tool-Mutationen anderer Agents ab, sofern der Aufrufer
nicht über das von `workboard_claim` zurückgegebene Claim-Token verfügt. Bei jeder Karte, die von einem
Agent-Tool oder Gateway-RPC-Aufruf zurückgegeben wird, wird `metadata.claim.token` zu `[redacted]`
redigiert (das Token selbst wird einmalig auf oberster Ebene ausschließlich von `workboard_claim` zurückgegeben),
sodass Dashboard-Bediener und andere Agents den Claim-Status prüfen können, ohne jemals
ein verwendbares Token zu sehen. Die Wiederherstellung erfolgt über
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`; dafür ist
das Token nicht erforderlich.

## Dispatch

Der Dispatch erfolgt lokal im Gateway: Er startet keine beliebigen Betriebssystemprozesse. Normale
OpenClaw-Subagent-Sitzungen sind weiterhin für die Ausführung zuständig. Ein Dispatch-Durchlauf:

1. Stuft Karten mit erfüllten Abhängigkeiten hoch.
2. Zeichnet Dispatch-Metadaten auf bereiten Karten auf.
3. Blockiert abgelaufene Claims oder Läufe mit Zeitüberschreitung.
4. Kennzeichnet Board-konfigurierte Triage-Karten als Orchestrierungskandidaten.
5. Beansprucht einen kleinen Stapel bereiter Karten und startet Worker-Läufe über die
   Gateway-Subagent-Runtime.

Worker erhalten begrenzten Kartenkontext sowie das Claim-Token, das benötigt wird, um über die
Workboard-Tools einen Heartbeat zu senden oder die Karte abzuschließen beziehungsweise zu blockieren.

Workspace-Pfade folgen den bestehenden Dateisystemberechtigungen des Aufrufers. Gateway-
Clients mit `operator.write` können konfigurierte Agent-Workspaces verwenden;
`operator.admin`-Clients können andere Checkouts auf dem Host verwenden. Agent-Tools in einer Sandbox nutzen
den Workspace-Zugriff ihrer Sandbox, während nicht in einer Sandbox ausgeführte, auf den Workspace beschränkte Tools ihr
konfiguriertes Workspace-Stammverzeichnis verwenden. Workboard zeichnet diese Berechtigung bei der Zuweisung eines Workspace
auf und bildet beim Dispatch erneut die Schnittmenge mit der aktuellen Berechtigung des Aufrufers,
sodass eine persistierte Karte den Zugriff eines späteren Aufrufers nicht erweitern kann. Bei älteren Karten mit einem
expliziten Host-Workspace, jedoch ohne aufgezeichnete Berechtigung, muss dieser Workspace
erneut gespeichert werden, bevor ein Dispatch mit vollständigem Host-Zugriff möglich ist; Karten ohne Host-Pfad übernehmen beim
ersten Dispatch die Berechtigung des aktuellen Aufrufers.

Ein Workspace-gebundener Dispatch akzeptiert ein Verzeichnis oder einen Git-Checkout nur, wenn dessen
Repository-Stammverzeichnis exakt mit dem Workspace des Ziel-Agents übereinstimmt. Eine Worktree-Anfrage
wird auf dieses Verzeichnis beschränkt und als Verzeichnis-Workspace persistiert, sodass der
Host den Checkout weder materialisiert noch Repository-Einrichtungscode ausführt. Der
Ziel-Worker muss für genau diesen Workspace eine beschreibbare, nicht gemeinsam genutzte Docker-Sandbox verwenden,
ohne Ausführung mit erhöhten Rechten, persistierte Host-/Node-Exec-Überschreibungen oder
nicht klassifizierte Plugin- und MCP-Tools. Workboard führt seine registrierten Tools einzeln auf,
anstatt einem `workboard_*`-Präfix zu vertrauen, und der Dispatch lehnt einen aktiven Docker-
Container ab, dessen Live-Mount-/Konfigurations-Hash veraltet ist. Der Dispatch meldet die
inkompatible Zielrichtlinie, anstatt einen weniger stark eingeschränkten Worker zu starten.
Ein Dispatch mit vollständigem Host-Zugriff kann andere lokale Checkouts als Ziel verwenden und behält die normale verwaltete
Worktree-Einrichtung bei.

Workspace-Berechtigungen schaffen kein zweites Berechtigungsmodell für den Kartenlebenszyklus.
Aufrufer, die Workboard-Karten verändern dürfen, können sie auf jeder Oberfläche manuell durch dieselben
Status verschieben; ein schreibgeschützter Workspace-Zugriff verhindert lediglich den Worker-
Dispatch, der Schreibzugriff benötigt.

### Worker-Auswahl

Jeder Durchlauf startet **standardmäßig höchstens 3 Worker**. Bereite Karten werden nach
Priorität, dann Position und anschließend Erstellungszeit sortiert. Ein Durchlauf startet nur eine Karte pro
Eigentümer/Agent und überspringt Eigentümer, für die bereits laufende oder zu prüfende Arbeit auf dem
Board vorhanden ist. Archivierte Karten, Karten mit einem aktiven Claim und Karten, die sich nicht im Status `ready`
befinden, werden niemals für Worker-Starts ausgewählt (sie können weiterhin von der
Datenseite des Dispatch betroffen sein: Bereinigung veralteter Claims, Hochstufung von Abhängigkeiten,
Timeout-Bereinigung).

Sitzungsschlüssel sind pro Board/Karte deterministisch, sodass wiederholte Dispatches
zur selben Worker-Lane zurückgeleitet werden, anstatt voneinander unabhängige Sitzungen zu erstellen:

- Zugewiesene Karten: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Nicht zugewiesene Karten: `subagent:workboard-<boardId>-<cardId>` (Gateway ermittelt
  den konfigurierten Standard-Agenten)

Wenn ein Worker nach dem Claimen einer Karte nicht gestartet werden kann, blockiert Workboard die
Karte, entfernt den Claim, zeichnet den Fehler beim Start des Laufs auf und fügt eine
Worker-Protokollzeile hinzu – sichtbar im Dashboard, im CLI-JSON, in Agent-Tools und in der
Kartendiagnose.

### Einstiegspunkte

- Dispatch-Aktion im Dashboard
- `openclaw workboard dispatch`
- `/workboard dispatch` in einem befehlsfähigen Kanal

Alle drei verwenden die Gateway-Subagent-Laufzeit, wenn das Gateway verfügbar ist. Die
CLI verfügt über einen Operator-Fallback: Wenn der Gateway-Aufruf mit einem
Verbindungs-/Nichtverfügbarkeitsfehler fehlschlägt (oder bei älteren
Gateways mit einem `unknown method`-Fehler) und weder ein explizites Ziel `--url`/`--token` noch ein konfiguriertes entferntes
Gateway (`OPENCLAW_GATEWAY_URL` oder `gateway.mode: remote`) zutrifft, führt die CLI einen
reinen Daten-Dispatch für den lokalen SQLite-Zustand aus – sie kann Abhängigkeiten hochstufen,
veraltete Claims bereinigen und Läufe mit Zeitüberschreitung blockieren, jedoch keine Worker starten. Authentifizierungs-,
Berechtigungs- und Validierungsfehler eines erreichbaren Gateways werden nicht als
Nichtverfügbarkeit behandelt; sie werden als Befehlsfehler ausgegeben. Dasselbe gilt für jeden Gateway-
Fehler, wenn ein explizites Ziel `--url`/`--token` angegeben wurde.

Die Board-Metadaten können `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` und `orchestratorProfile` festlegen. OpenClaw zeichnet diese Absicht auf und
stellt sie im Worker-Kontext bereit; die eigentliche Spezifikation/Zerlegung erfolgt weiterhin
über die regulären Workboard-Tools.

## CLI und Slash-Befehl

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

Die Textausgabe von `list` blendet archivierte Karten standardmäßig aus (`--include-archived`
überschreibt dies); `--json` schließt archivierte Karten immer ein und entspricht damit dem vollständigen Kartenvertrag,
den bestehende Skripte verwenden. `show` und `move` akzeptieren ein eindeutiges ID-
Präfix. `list`, `create`, `show` und `move` lesen/schreiben den lokalen Plugin-
Zustand immer direkt. Nur `dispatch` ruft das laufende Gateway auf, mit dem oben
beschriebenen Fallback.

Vollständige Flags, JSON-Ausgabe, Gateway-
Fallback-Verhalten, Behandlung von ID-Präfixen, Auswahlregeln für den Dispatch und
Fehlerbehebung finden Sie unter [Workboard-CLI](/de/cli/workboard).

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` und `/workboard dispatch` entsprechen
der CLI. Auflisten und Anzeigen sind Lesevorgänge für jeden autorisierten Befehlsabsender.
Erstellen, Verschieben und Dispatch erfordern auf Chat-Oberflächen den Eigentümerstatus oder einen Gateway-
Client mit `operator.write`/`operator.admin`. Manuelle Operator-Verschiebungen verwenden dasselbe
Verhalten zum Überschreiben von Claims wie Drag-and-drop im Dashboard. Ihr Worktree-Zugriff
unterliegt weiterhin derselben oben beschriebenen Workspace-Grenze.

## Synchronisierung des Sitzungslebenszyklus

Karten können mit einer vorhandenen Dashboard-Sitzung oder mit einer Sitzung verknüpft werden, die erstellt wird, wenn Sie
die Arbeit von der Karte aus starten. Verknüpfte Karten zeigen den Sitzungslebenszyklus direkt an:
laufend, veraltet, verknüpft und inaktiv, abgeschlossen, fehlgeschlagen oder nicht vorhanden. Sie können außerdem eine
vorhandene Sitzung über den Tab „Sessions“ mit **Add to Workboard** übernehmen; die Karte
wird mit dieser Sitzung verknüpft, verwendet das Sitzungsetikett oder die letzte Benutzereingabe als Titel
und befüllt die Notizen, sofern verfügbar, mit der letzten Benutzereingabe sowie der neuesten Assistentenantwort.

Wenn die verknüpfte Sitzung nicht mehr vorhanden ist, bleibt die Karte für den Kontext verknüpft und
bietet weiterhin Startsteuerungen zum Neustart in einer neuen Sitzung an. Wenn eine aktive
verknüpfte Sitzung keine aktuelle Aktivität mehr meldet, markiert Workboard die Karte als
`stale` und speichert dies als Metadaten, bis der Lebenszyklus es entfernt.

Solange sich eine Karte in einem aktiven Arbeitsstatus befindet, folgt Workboard der verknüpften Sitzung:

| Status der verknüpften Sitzung        | Kartenstatus |
| ------------------------------------- | ------------ |
| aktiv                                 | `running`   |
| abgeschlossen                         | `review`    |
| fehlgeschlagen, beendet, Zeitüberschreitung oder abgebrochen | `blocked`   |

**Manuelle Prüfstatus haben Vorrang.** Wenn Sie eine Karte nach `review`, `blocked` oder `done`
verschieben, wird die automatische Synchronisierung für diese Karte angehalten, bis Sie sie wieder nach `todo` oder `running` verschieben.

Beim Starten einer Karte werden reguläre Gateway-Sitzungen verwendet; Workboard speichert nur Karten-
metadaten und Verknüpfungen. Konversationstranskript, Modellauswahl und Lauf-
lebenszyklus bleiben Eigentum des regulären Sitzungssystems. Verwenden Sie **Stop** bei einer aktiven
verknüpften Karte, um den aktiven Lauf abzubrechen – Workboard markiert diese Karte als `blocked`, damit
sie für die Nachverfolgung sichtbar bleibt.

Neue Karten können auf Grundlage von Workboard-Vorlagen (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`) erstellt werden. Vorlagen füllen Titel, Notizen, Labels und Priorität vorab aus;
die Vorlagen-ID wird als Kartenmetadatum gespeichert.

## Dashboard-Arbeitsablauf

1. Öffnen Sie den Workboard-Tab in der Control UI.
2. Erstellen Sie eine Karte mit Titel, Notizen, Priorität, Labels, optionalem Agenten und
   optional verknüpfter Sitzung – oder öffnen Sie „Sessions“ und wählen Sie **Add to Workboard**
   für eine vorhandene Sitzung.
3. Ziehen Sie die Karte zwischen Spalten oder fokussieren Sie ihre kompakte Statussteuerung und verwenden Sie
   das Menü oder ArrowLeft/ArrowRight. Während des Ziehens wird die Ausgangskarte abgeblendet, und
   verfügbare Zielspalten erhalten eine Umrandung.
4. Starten Sie die Arbeit von der Karte aus, um eine Dashboard-Sitzung zu erstellen oder wiederzuverwenden.
5. Öffnen Sie die verknüpfte Sitzung von der Karte aus, während der Agent arbeitet.
6. Lassen Sie die Lebenszyklussynchronisierung laufende Arbeit nach `review`/`blocked` verschieben und verschieben Sie die Karte anschließend manuell
   nach `done`, wenn sie akzeptiert wurde.

### Sitzungs-Board-Widgets

Workboard enthält zwei native Widgets für Sitzungs-Dashboards (siehe
[Dashboards](/web/dashboards)). Der Agent pinnt sie mit seinem `dashboard`-Tool
unter Verwendung von `content: { kind: "plugin", pluginKind, props }`; sie werden als
integrierte UI mit Live-Daten dargestellt – ohne Sandbox-Frame oder Berechtigungsgewährung:

- `workboard:card` mit `props: { cardId }` zeigt eine Karte mit ihrer Status-
  steuerung, Priorität und dem zugewiesenen Agenten.
- `workboard:mini` mit optionalem `props: { boardId, limit }` zeigt Anzahlen pro Status
  sowie die wichtigsten bereiten/laufenden Karten und verlinkt auf die vollständige Board-Seite.
  Ohne `boardId` werden alle Boards zusammengefasst; mit `boardId` wird der Umfang auf dieses
  Board beschränkt (Karten, die ohne explizite Board-ID erstellt wurden, befinden sich auf `default`).

## Diagnose

Diagnosen werden aus den lokalen Kartenmetadaten berechnet. Integrierte Prüfungen kennzeichnen:

| Art                         | Bedingung                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Zugewiesene Karte mit `todo`/`backlog`/`ready`, die seit mehr als 1 Stunde nicht aktualisiert wurde.             |
| `running_without_heartbeat` | Karte mit `running`, für die seit mehr als 20 Minuten kein Claim-Heartbeat oder keine Ausführungsaktualisierung vorliegt. |
| `blocked_too_long`          | Karte mit `blocked`, die seit mehr als 24 Stunden nicht aktualisiert wurde.                                   |
| `repeated_failures`         | Die erfasste Fehleranzahl der Karte erreicht 2 oder mehr.                                |
| `missing_proof`             | Karte mit `done` ohne Nachweis, Artefakte oder Anhänge.                          |
| `orphaned_session`          | Karte mit `running`, die über `sessionKey`, aber keine `execution`-Metadaten verfügt.                |

## Berechtigungen

Gateway-RPC-Methoden befinden sich unter `workboard.*`:

| Umfang           | Methoden                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, Anhänge auflisten/abrufen, Benachrichtigungsereignisse lesen, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, erstellen/aktualisieren/verschieben/löschen/kommentieren/verknüpfen/Abhängigkeit verknüpfen/Nachweis/Artefakt, Anhang hinzufügen/löschen, Worker-Protokoll, Protokollverletzung, claimen/Heartbeat/freigeben/hochstufen/neu zuweisen/zurückfordern/abschließen/blockieren/Blockierung aufheben, `cards.dispatch`, `cards.bulk`, archivieren, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, Benachrichtigung abonnieren/löschen/fortschreiben |

Keine RPC-Methode erfordert `operator.admin`. Browser mit schreibgeschütztem
Operator-Zugriff können das Board einsehen, aber keine Karten ändern. Ein Admin-Umfang
erweitert die akzeptierten Workboard-Hostpfade; er ändert nicht die verfügbaren Methoden.

## Speicherung

Workboard speichert persistente Daten in einer Plugin-eigenen relationalen SQLite-Datenbank
im OpenClaw-Zustandsverzeichnis: Boards, Karten, Labels, Lebenszyklusereignisse,
Laufversuche, Kommentare, Abhängigkeitsverknüpfungen, Nachweise, Artefaktreferenzen,
Anhangsmetadaten und -blobs, Diagnosen, Benachrichtigungen, Worker-Protokolle,
Protokollstatus und Abonnements befinden sich vollständig in Workboard-Tabellen (nicht in
Plugin-Schlüssel-Wert-Einträgen). Ein Kartenexport bewahrt die Board-Darstellung,
ohne den Inhalt von Anhangsblobs einzubetten.

Installationen, die Workboard im Release `.28` verwendet haben, können
`openclaw doctor --fix` ausführen, um die ausgelieferten veralteten Plugin-Zustandsnamensräume
(`workboard.cards`, `workboard.boards`, `workboard.notify` und, falls vorhanden,
`workboard.attachments`) in die relationale Datenbank zu migrieren.

## Fehlerbehebung

**Der Tab meldet, dass Workboard nicht verfügbar ist**

```bash
openclaw plugins inspect workboard --runtime --json
```

Wenn `plugins.allow` konfiguriert ist, fügen Sie `workboard` hinzu. Wenn `plugins.deny`
`workboard` enthält, entfernen Sie es, bevor Sie das Plugin aktivieren.

**Karten werden nicht gespeichert**

Stellen Sie sicher, dass die Browserverbindung über `operator.write`-Zugriff verfügt. Schreibgeschützte Operator-
Sitzungen können Karten auflisten, aber nicht erstellen, bearbeiten, verschieben oder löschen.

**Beim Starten einer Karte wird nicht die erwartete Sitzung geöffnet**

Prüfen Sie die Agenten-ID und die verknüpfte Sitzung der Karte und öffnen Sie anschließend „Sessions“ oder „Chat“, um
den tatsächlichen Laufstatus einzusehen.

**Der Dispatch startet keinen Worker**

Stellen Sie sicher, dass mindestens eine Karte mit `ready` ohne aktiven Claim vorhanden ist:

```bash
openclaw workboard list --status ready
```

Wenn die CLI einen reinen Daten-Dispatch meldet, starten Sie das Gateway oder starten Sie es neu und
versuchen Sie es erneut – ein reiner Daten-Dispatch aktualisiert den lokalen Board-Status, kann jedoch keine
Subagent-Worker-Läufe starten. Karten können auch übersprungen werden, wenn bereits eine andere Karte für
denselben Verantwortlichen oder Agent ausgeführt wird oder auf eine Überprüfung wartet; schließen Sie
diese aktive Arbeit ab, blockieren Sie sie oder geben Sie sie frei, bevor Sie weitere Arbeit für denselben
Verantwortlichen dispatchen.

## Verwandte Themen

- [Control UI](/de/web/control-ui)
- [Workboard-CLI](/de/cli/workboard)
- [Plugins](/de/tools/plugin)
- [Plugins verwalten](/de/plugins/manage-plugins)
- [Sitzungen](/de/concepts/session)
