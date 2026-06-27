---
read_when:
    - Sie möchten ein Kanban-ähnliches Arbeitsboard in der Control UI
    - Sie aktivieren oder deaktivieren das gebündelte Workboard-Plugin
    - Sie möchten geplante Agentenarbeit ohne externen Projektmanager nachverfolgen
summary: Optionales Dashboard-Arbeitsboard für agenteneigene Karten und Sitzungsübergabe
title: Workboard-Plugin
x-i18n:
    generated_at: "2026-06-27T18:01:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Das Workboard-Plugin fügt dem [Control UI](/de/web/control-ui) ein optionales Board im Kanban-Stil hinzu. Verwenden Sie es, um arbeitsgroße Karten für Agenten zu sammeln, sie Agenten zuzuweisen und die verknüpfte Hintergrundaufgabe, den Run und die Dashboard-Sitzung über eine Karte zu verfolgen.

Workboard ist bewusst klein gehalten. Es verfolgt lokale Betriebsarbeit für einen OpenClaw Gateway; es ist kein Ersatz für GitHub Issues, Linear, Jira oder andere Projektmanagementsysteme für Teams.

## Standardzustand

Workboard ist ein gebündeltes Plugin und standardmäßig deaktiviert, sofern Sie es nicht in der Plugin-Konfiguration aktivieren.

Aktivieren Sie es mit:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Öffnen Sie dann das Dashboard:

```bash
openclaw dashboard
```

Der Workboard-Tab erscheint in der Dashboard-Navigation. Wenn der Tab sichtbar ist, das Plugin aber deaktiviert oder durch `plugins.allow` / `plugins.deny` blockiert ist, zeigt die Ansicht statt lokaler Kartendaten einen Zustand „Plugin nicht verfügbar“ an.

## Was Karten enthalten

Jede Karte speichert:

- Titel und Notizen
- Status: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked` oder `done`
- Priorität: `low`, `normal`, `high` oder `urgent`
- Labels
- optionale Agenten-ID
- optional verknüpfte Aufgabe, Run, Sitzung oder Quell-URL
- optionale Ausführungsmetadaten für einen von der Karte gestarteten Codex- oder Claude-Run
- kompakte Metadaten für Versuche, Kommentare, Links, Nachweise, Artefakte, Automatisierung,
  Anhänge, Worker-Logs, Worker-Protokollzustand, Ansprüche, Diagnosen,
  Benachrichtigungen, Vorlagen, Archivzustand und Erkennung veralteter Sitzungen
- aktuelle Kartenereignisse wie erstellt, verschoben, verknüpft, beansprucht, Heartbeat,
  Versuch, Nachweis, Artefakt, Diagnose, Benachrichtigung, Dispatch, Archiv, veraltet
  oder durch Agent aktualisierte Änderungen

Karten werden im Gateway-Zustand des Plugins gespeichert. Sie sind lokal für das Gateway-Zustandsverzeichnis und werden mit dem restlichen OpenClaw-Zustand dieses Gateway verschoben.

Workboard hält kompakte Metadaten pro Karte vor, damit Betreiber sehen können, wie eine Karte durch das Board bewegt wurde, ohne die verknüpfte Sitzung zu öffnen. Ereignisse, Versuchszusammenfassungen, Nachweisausschnitte, zugehörige Links, Kommentare, Archivmarkierungen und Markierungen veralteter Sitzungen sind bewusst lokale Metadaten; sie ersetzen keine Sitzungstranskripte oder den Verlauf von GitHub Issues.

## Kartenausführungen und Aufgaben

Nicht verknüpfte Karten können Arbeit von der Karte aus starten. Autonome Starts verwenden den aufgabenverfolgten Agenten-Run-Pfad des Gateway; anschließend verknüpft Workboard die resultierende Aufgabe, Run-ID und den Sitzungsschlüssel wieder mit der Karte. Der Start verwendet den konfigurierten Standard-Agenten und das Standardmodell des Gateway. Codex- und Claude-Aktionen sind optionale explizite Modellentscheidungen:

- „Codex ausführen“ oder „Claude ausführen“ startet einen aufgabenbasierten Agenten-Run, sendet den Karten-Prompt und markiert die Karte als `running`.
- „Codex öffnen“ oder „Claude öffnen“ erstellt eine verknüpfte Dashboard-Sitzung, ohne den Karten-Prompt zu senden oder die Karte zu verschieben, sodass Sie manuell arbeiten können, während sie mit dem Board verbunden bleibt.

Ausführungsmetadaten speichern die ausgewählte Engine, den Modus, die Modellreferenz, den Sitzungsschlüssel, die Run-ID, die Aufgaben-ID, sofern verfügbar, und den Lebenszyklusstatus auf der Karte. Codex-Ausführungen verwenden `openai/gpt-5.5`; Claude-Ausführungen verwenden `anthropic/claude-sonnet-4-6`.

Jede verknüpfte Ausführung zeichnet außerdem eine Versuchszusammenfassung im selben Kartendatensatz auf. Die Versuchszusammenfassung hält Engine, Modus, Modell, Run-ID, Zeitstempel, Status und fortlaufende Fehleranzahl fest, damit wiederholte Fehler auf dem Board sichtbar bleiben.

Das Dashboard aktualisiert den Aufgabenstatus aus dem Gateway-Aufgabenledger und ordnet Aufgaben anhand von Aufgaben-ID, Run-ID oder verknüpftem Sitzungsschlüssel wieder Karten zu. Wenn eine Aufgabe in der Warteschlange steht oder läuft, zeigt der Kartenlebenszyklus den aktiven Aufgabenstatus an. Wenn die Aufgabe beendet wird, fehlschlägt, eine Zeitüberschreitung erreicht oder abgebrochen wird, bewegt sich der Kartenlebenszyklus mit derselben Lebenszyklussynchronisierung wie verknüpfte Sitzungen in Richtung Review- oder Blockiert-Status.

## Agentenkoordination

Workboard stellt außerdem optionale Agenten-Tools für boardbewusste Workflows bereit:

- `workboard_list` listet kompakte Karten mit Anspruchs- und Diagnosezustand sowie optionalem Board-Filter auf.
- `workboard_read` gibt eine Karte plus begrenzten Worker-Kontext zurück, der aus Notizen,
  Versuchen, Kommentaren, Links, Nachweisen, Artefakten, übergeordneten Ergebnissen, aktueller Arbeit zugewiesener Personen
  und aktiven Diagnosen aufgebaut wird.
- `workboard_create` erstellt eine Karte mit optionalen übergeordneten Karten, Mandant, Skills,
  Board, Workspace-Metadaten, Idempotenzschlüssel, Laufzeitlimit und Wiederholungsbudget.
- `workboard_link` verknüpft eine übergeordnete Karte mit einer untergeordneten Karte. Untergeordnete Karten bleiben in `todo`,
  bis jede übergeordnete Karte `done` erreicht; dann verschiebt die Dispatch-Hochstufung sie nach
  `ready`.
- `workboard_claim` beansprucht eine Karte für den aufrufenden Agenten und verschiebt Backlog-, Todo-
  oder Ready-Karten nach `running`.
- `workboard_heartbeat` aktualisiert den Anspruchs-Heartbeat während längerer Runs.
- `workboard_release` gibt den Anspruch nach Abschluss, Pause oder Übergabe frei und
  kann die Karte in einen nächsten Status verschieben.
- `workboard_complete` und `workboard_block` sind strukturierte Lebenszyklus-Tools für
  abschließende Zusammenfassungen, Nachweise, Artefakte, Manifeste erstellter Karten und Blocker-
  Gründe. Manifeste erstellter Karten müssen Karten referenzieren, die mit der
  abgeschlossenen Karte zurückverknüpft sind, wodurch Phantom-Unterkarten aus Zusammenfassungen herausgehalten werden.
- `workboard_attachment_add`, `workboard_attachment_read` und
  `workboard_attachment_delete` speichern kleine Kartenanhänge im SQLite-Zustand des Plugins,
  indexieren sie auf der Karte und stellen sie im Worker-Kontext bereit.
- `workboard_worker_log` und `workboard_protocol_violation` zeichnen Worker-Logzeilen auf
  und blockieren Karten, wenn ein automatisierter Worker stoppt, ohne
  `workboard_complete` oder `workboard_block` aufzurufen.
- `workboard_board_create`, `workboard_board_archive` und
  `workboard_board_delete` verwalten persistierte Board-Metadaten wie Anzeigename,
  Beschreibung, Archivzustand und Standard-Workspace.
- `workboard_runs` gibt den auf einer Karte gespeicherten Verlauf der Run-Versuche zurück.
- `workboard_specify` verwandelt eine grobe Triage- oder Backlog-Karte in eine geklärte
  `todo`-Karte und zeichnet die Spezifikationszusammenfassung auf der Karte auf.
- `workboard_decompose` fächert eine übergeordnete Orchestrierungskarte in verknüpfte Unterkarten auf,
  übernimmt Board- und Mandantenmetadaten und kann die übergeordnete Karte mit einem
  Manifest erstellter Karten abschließen.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance` und
  `workboard_notify_unsubscribe` verwalten Benachrichtigungsabonnements im Plugin-
  Zustand. Ereignislesevorgänge sind wiedergabesicher; das Advance-Tool verschiebt den dauerhaften Cursor,
  sodass Aufrufer fortsetzen können, ohne abgeschlossene, fehlgeschlagene oder
  veraltete Kartenereignisse zu verlieren oder doppelt zu lesen.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock` und `workboard_dispatch` ermöglichen es einem Agenten,
  Board-Namespaces zu inspizieren, Warteschlangenstatistiken anzusehen, festhängende Arbeit wiederherzustellen, Übergabe-
  Notizen hinzuzufügen, Nachweis- oder Artefaktreferenzen anzuhängen, blockierte Arbeit nach `todo`
  zurückzuverschieben und Abhängigkeitshochstufung oder Bereinigung veralteter Ansprüche anzustoßen.

Beanspruchte Karten weisen Mutationen über Agenten-Tools von anderen Agenten zurück, sofern der Aufrufer nicht das von `workboard_claim` zurückgegebene Anspruchstoken besitzt. Dashboard-Betreiber verwenden weiterhin die normale Gateway-RPC-Oberfläche und können Karten wiederherstellen oder neu zuweisen.

Workboard speichert dauerhafte Board-Daten in einer Plugin-eigenen relationalen SQLite-Datenbank unter dem OpenClaw-Zustandsverzeichnis. Boards, Karten, Labels, Lebenszyklusereignisse, Run-Versuche, Kommentare, Abhängigkeitslinks, Nachweise, Artefaktreferenzen, Anhangsmetadaten und Blobs, Diagnosen, Benachrichtigungen, Worker-Logs, Protokollzustand und Abonnements werden in Workboard-Tabellen statt in Plugin-Key-Value-Einträgen persistiert. Ein Kartenexport bewahrt weiterhin die Board-Erzählung, ohne Anhangs-Blob-Inhalte einzubetten.

Installationen, die Workboard in der `.28`-Version verwendet haben, können `openclaw doctor --fix` ausführen, um die ausgelieferten Legacy-Plugin-Zustands-Namespaces (`workboard.cards`, `workboard.boards` und `workboard.notify`) in die relationale Datenbank zu migrieren. Wenn ein Legacy-Namespace `workboard.attachments` vorhanden ist, migriert Doctor auch diese Anhangs-Blobs.

Workboard-Diagnosen werden aus lokalen Kartenmetadaten berechnet. Die integrierten Prüfungen markieren zugewiesene Karten, die zu lange warten, laufende Karten ohne aktuellen Heartbeat, blockierte Karten, die Aufmerksamkeit benötigen, wiederholte Fehler, erledigte Karten ohne Nachweis und laufende Karten, die nur eine lose Sitzungsverknüpfung haben.

Dispatch ist bewusst Gateway-lokal. Er startet keine beliebigen Betriebssystemprozesse; normale OpenClaw-Subagent-Sitzungen besitzen weiterhin die Ausführung. Die Dispatch-Aktion stuft abhängigkeitbereite Karten hoch, zeichnet Dispatch-Metadaten auf bereiten Karten auf, blockiert abgelaufene Ansprüche oder Runs mit Zeitüberschreitung, markiert boardkonfigurierte Triage-Karten als Orchestrierungskandidaten, beansprucht dann eine kleine Menge bereiter Karten und startet Worker-Runs über die Gateway-Subagent-Laufzeit. Zugewiesene Karten verwenden `agent:<id>:subagent:workboard-*`-Worker-Sitzungsschlüssel; nicht zugewiesene Karten verwenden nicht bereichsgebundene `subagent:workboard-*`-Schlüssel, sodass der Gateway weiterhin den konfigurierten Standard-Agenten auflöst. Worker erhalten begrenzten Kartenkontext plus das Anspruchstoken, das sie benötigen, um über die Workboard-Tools einen Heartbeat zu senden, die Karte abzuschließen oder zu blockieren.

### Dispatch-Worker-Auswahl

Jeder Dispatch-Durchlauf startet standardmäßig höchstens drei Worker. Bereite Karten werden nach Priorität, Position und Erstellungszeit sortiert und dann gefiltert, um doppelte aktive Zuständigkeit zu vermeiden. Ein Dispatch startet im selben Durchlauf nur eine Karte für einen bestimmten Owner oder Agenten und überspringt Owner, die bereits laufende oder im Review befindliche Arbeit auf dem Board haben.

Archivierte Karten, Karten mit aktiven Ansprüchen und Karten ohne Status `ready` werden nicht für Worker-Starts ausgewählt. Sie können dennoch von der Datenseite des Dispatch betroffen sein, wenn veraltete Ansprüche, Abhängigkeitshochstufung oder Timeout-Bereinigung greifen.

### Worker-Prompt und Lebenszyklus

Der Worker-Prompt enthält den Kartentitel, begrenzte Notizen und Kontext, das zugewiesene Board und das Workboard-Worker-Protokoll. Er enthält außerdem den Anspruchs-Owner und das Anspruchstoken, damit der Worker `workboard_heartbeat`, `workboard_complete` oder `workboard_block` aufrufen kann, ohne dass ein anderer Akteur die Karte übernimmt.

Wenn ein Worker erfolgreich startet, speichert Workboard den Sitzungsschlüssel, die Run-ID, Engine, Modus, Modelllabel, Status und Worker-Log auf der Karte. Der Sitzungsschlüssel ist für Board und Karte deterministisch, wodurch wiederholte Dispatches zurück auf dieselbe Worker-Spur geleitet werden, statt nicht zusammenhängende Sitzungen zu erstellen.

Wenn ein Worker nach dem Beanspruchen einer Karte nicht gestartet werden kann, blockiert Workboard die Karte, hebt den Anspruch auf, zeichnet den Run-Startfehler auf und hängt eine Worker-Logzeile an. Dieser Fehler ist im Dashboard, in CLI-JSON, Agenten-Tools und Kartendiagnosen sichtbar.

### Dispatch-Einstiegspunkte

Worker-Starts für bereite Karten können erfolgen über:

- die Dashboard-Dispatch-Aktion
- `openclaw workboard dispatch`
- `/workboard dispatch` in einem befehlsfähigen Kanal

Alle drei Einstiegspunkte verwenden die Gateway-Subagent-Laufzeit, wenn der Gateway verfügbar ist. Die CLI hat einen zusätzlichen Betreiber-Fallback: Wenn der Gateway offline ist oder die Workboard-Dispatch-Methode nicht bereitstellt und kein explizites Ziel mit `--url` oder `--token` angegeben wurde, führt sie einen rein datenbezogenen Dispatch gegen den lokalen SQLite-Zustand aus. Dieser Fallback kann Abhängigkeiten hochstufen, veraltete Ansprüche bereinigen und Runs mit Zeitüberschreitung blockieren, aber er kann keine Worker starten.

Board-Metadaten können Orchestrierungseinstellungen wie `autoDecompose`, `autoDecomposePerDispatch`, `defaultAssignee` und `orchestratorProfile` enthalten. OpenClaw zeichnet die Orchestrierungsabsicht auf und stellt sie im Worker-Kontext bereit; die eigentliche Spezifikation und Zerlegung erfolgt weiterhin über die normalen Workboard-Tools.

## CLI und Slash-Befehl

Das Plugin registriert einen Root-CLI-Befehl:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` ruft den laufenden Gateway auf, damit Worker-Starts dieselbe Subagent-Runtime wie das Dashboard verwenden. Wenn der Gateway nicht verfügbar ist, fällt der Befehl auf einen reinen Daten-Dispatch zurück, sodass Dependency Promotion, Bereinigung veralteter Claims und Timeout-Blockierung weiterhin ausgeführt werden können. Authentifizierungs-, Berechtigungs- und Validierungsfehler werden weiterhin als Befehlsfehler ausgegeben, ebenso Fehler für explizite `--url`- oder `--token`-Ziele.

Der Slash-Befehl `/workboard` unterstützt denselben kompakten Operator-Pfad:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` und
`/workboard dispatch`. List und show sind Leseoperationen für autorisierte Befehlssender. Create und dispatch erfordern Owner-Status auf Chat-Oberflächen oder einen Gateway-Client mit `operator.write` oder `operator.admin`.

Siehe [Workboard-CLI](/de/cli/workboard) für Befehls-Flags, JSON-Ausgabe, Gateway-Fallback-Verhalten, eindeutige ID-Präfix-Behandlung, Dispatch-Auswahlregeln und Fehlerbehebung.

## Synchronisierung des Sitzungslebenszyklus

Karten können mit bestehenden Dashboard-Sitzungen oder mit der Sitzung verknüpft werden, die erstellt wird, wenn Sie die Arbeit von einer Karte aus starten. Verknüpfte Karten zeigen den Sitzungslebenszyklus inline an:
laufend, veraltet, verknüpft inaktiv, erledigt, fehlgeschlagen oder fehlend.

Wenn die verknüpfte Sitzung fehlt, bleibt die Karte für den Kontext verknüpft und bietet weiterhin Start-Steuerelemente, damit Sie die Arbeit in einer neuen Dashboard-Sitzung neu starten können. Wenn eine aktive verknüpfte Sitzung keine aktuelle Aktivität mehr meldet, markiert Workboard die Karte als veraltet und speichert die Markierung als Kartenmetadaten, bis der Lebenszyklus sie entfernt.

Sie können auch eine bestehende Dashboard-Sitzung aus dem Tab Sitzungen mit Zum Workboard hinzufügen erfassen. Die Karte wird mit dieser Sitzung verknüpft, verwendet die Sitzungsbezeichnung oder den aktuellen Benutzer-Prompt als Titel und befüllt Notizen aus dem aktuellen Benutzer-Prompt plus der neuesten Assistentenantwort, wenn der Chatverlauf verfügbar ist.

Workboard folgt der verknüpften Sitzung, solange sich die Karte noch in einem aktiven Arbeitszustand befindet:

- aktive verknüpfte Sitzung -> `running`
- abgeschlossene verknüpfte Sitzung -> `review`
- fehlgeschlagene, beendete, abgelaufene oder abgebrochene verknüpfte Sitzung -> `blocked`

Manuelle Review-Zustände haben Vorrang. Wenn Sie eine Karte nach `review`, `blocked` oder `done` verschieben, stoppt Workboard das automatische Verschieben dieser Karte, bis Sie sie wieder nach `todo` oder `running` verschieben.

## Dashboard-Workflow

1. Öffnen Sie den Workboard-Tab in der Control UI.
2. Erstellen Sie eine Karte mit Titel, Notizen, Priorität, Labels, optionalem Agent und optional verknüpfter Sitzung.
3. Oder öffnen Sie Sitzungen und wählen Sie Zum Workboard hinzufügen für eine bestehende Sitzung.
4. Ziehen Sie die Karte zwischen Spalten oder fokussieren Sie das kompakte Status-Steuerelement auf der Karte und verwenden Sie dessen Menü oder ArrowLeft/ArrowRight.
5. Starten Sie die Arbeit von der Karte aus, um eine Dashboard-Sitzung zu erstellen oder wiederzuverwenden.
6. Öffnen Sie die verknüpfte Sitzung von der Karte aus, während der Agent arbeitet.
7. Lassen Sie die Lebenszyklus-Synchronisierung laufende Arbeit in Review oder blockiert verschieben, und verschieben Sie die Karte dann manuell nach erledigt, wenn sie akzeptiert wurde.

Das Starten einer Karte verwendet normale Gateway-Sitzungen. Das Workboard-Plugin speichert nur Kartenmetadaten und Verknüpfungen; das Konversationstranskript, die Modellauswahl und der Ausführungslebenszyklus bleiben im Besitz des regulären Sitzungssystems.

Verwenden Sie Stop auf einer live verknüpften Karte, um den aktiven Sitzungslauf abzubrechen. Workboard markiert diese Karte als `blocked`, damit sie für die Nachverfolgung sichtbar bleibt.

Neue Karten können aus Workboard-Vorlagen für Bugfixes, Dokumentation, Releases, PR-Reviews oder Plugin-Arbeit gestartet werden. Vorlagen füllen Titel, Notizen, Labels und Priorität vor, und die ausgewählte Vorlagen-ID wird als Kartenmetadaten gespeichert.

## Berechtigungen

Das Plugin registriert Gateway-RPC-Methoden unter dem Namespace `workboard.*`:

- `workboard.cards.list` erfordert `operator.read`
- `workboard.cards.export` erfordert `operator.read`
- `workboard.cards.diagnostics` erfordert `operator.read`
- `workboard.cards.diagnostics.refresh` erfordert `operator.write`
- Anhangsliste/-abruf und Lesezugriffe auf Benachrichtigungsereignisse erfordern `operator.read`
- Fortschreiben des Benachrichtigungs-Cursors erfordert `operator.write`
- Methoden zum Erstellen, Aktualisieren, Verschieben, Löschen, Kommentieren, Verknüpfen, Verknüpfen von Abhängigkeiten, für Nachweis, Artefakt,
  Hinzufügen/Löschen von Anhängen, Worker-Log, Protokollverletzung, Claim, Heartbeat,
  Freigabe, Abschließen, Blockieren, Entblocken, Dispatch, Bulk und Archivierung erfordern
  `operator.write`

Browser, die mit schreibgeschütztem Operator-Zugriff verbunden sind, können das Board prüfen, aber keine Karten ändern.

## Konfiguration

Workboard hat heute keine Plugin-spezifische Konfiguration. Aktivieren oder deaktivieren Sie es mit dem standardmäßigen Plugin-Eintrag:

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

Deaktivieren Sie es wieder mit:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Fehlerbehebung

### Der Tab meldet, dass Workboard nicht verfügbar ist

Prüfen Sie die Plugin-Richtlinie:

```bash
openclaw plugins inspect workboard --runtime --json
```

Wenn `plugins.allow` konfiguriert ist, fügen Sie `workboard` zu dieser Allowlist hinzu. Wenn
`plugins.deny` `workboard` enthält, entfernen Sie es, bevor Sie das Plugin aktivieren.

### Karten werden nicht gespeichert

Bestätigen Sie, dass die Browser-Verbindung `operator.write`-Zugriff hat. Schreibgeschützte Operator-Sitzungen können Karten auflisten, aber sie nicht erstellen, bearbeiten, verschieben oder löschen.

### Das Starten einer Karte öffnet nicht die erwartete Sitzung

Workboard erstellt Verknüpfungen zu normalen Dashboard-Sitzungen. Prüfen Sie die Agent-ID und die verknüpfte Sitzung der Karte, und öffnen Sie dann die Sitzungs- oder Chat-Ansicht, um den tatsächlichen Ausführungszustand zu prüfen.

### Dispatch startet keinen Worker

Bestätigen Sie, dass es mindestens eine `ready`-Karte ohne aktiven Claim gibt:

```bash
openclaw workboard list --status ready
```

Wenn die CLI reinen Daten-Dispatch meldet, starten oder starten Sie den Gateway neu und versuchen Sie es erneut. Reiner Daten-Dispatch aktualisiert den lokalen Board-Zustand, kann aber keine Subagent-Worker-Läufe starten.

Karten können auch übersprungen werden, wenn bereits eine andere Karte für denselben Owner oder Agent läuft oder auf Review wartet. Schließen, blockieren oder geben Sie diese aktive Arbeit frei, bevor Sie weitere Arbeit für denselben Owner dispatchen.

## Verwandt

- [Control UI](/de/web/control-ui)
- [Workboard-CLI](/de/cli/workboard)
- [Plugins](/de/tools/plugin)
- [Plugins verwalten](/de/plugins/manage-plugins)
- [Sitzungen](/de/concepts/session)
