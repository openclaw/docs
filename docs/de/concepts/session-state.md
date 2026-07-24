---
read_when:
    - Sie möchten, dass Agenten erkennen, wenn Menschen oder andere Agenten eine Sitzung unbemerkt ändern.
    - Sie debuggen Hinweise zu Statusänderungen, Watch-Cursor oder `session_status`-Änderungen an `changesSince`
    - Sie möchten verstehen, wie übergeordnete Agenten mit untergeordneten Sitzungen synchronisiert bleiben
sidebarTitle: Session state awareness
summary: 'Protokoll dauerhafter Sitzungsstatussignale: Statusversionen, Watcher, Hinweise auf veralteten Status und Abgleich'
title: Sitzungsstatusbewusstsein
x-i18n:
    generated_at: "2026-07-24T04:23:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Wenn mehrere Sitzungen am selben Problem arbeiten — ein Manager delegiert an untergeordnete Sitzungen, ein Mensch wechselt direkt in eine Worker-Sitzung, zwei Agenten koordinieren sich über [`sessions_send`](/de/concepts/session-tool) —, entwickelt jede Sitzung Annahmen über die anderen. Diese Annahmen sind veraltet, sobald ein anderer Akteur eingreift. Die Sitzungsstatus-Erkennung ist der Mechanismus, der den Eingriff erkennt, die betroffene Sitzung einmal benachrichtigt und ihr eine effiziente Möglichkeit gibt, sich vor dem Handeln auf den aktuellen Stand zu bringen.

Drei Komponenten arbeiten zusammen:

1. Ein **dauerhaftes Signalprotokoll** zeichnet ausgewählte Statusänderungen pro Sitzung auf.
2. **Watcher** verwalten Cursor pro Ziel und erhalten einen einzigen zusammengefassten Hinweis auf einen veralteten Status.
3. Die **Reconciliation** ruft das exakte Delta über `session_status` mit `changesSince` ab.

## Das Signalprotokoll

OpenClaw fügt der gemeinsamen Statusdatenbank (`session_state_events`) ein typisiertes Ereignis hinzu, wenn sich eine überwachte Sitzung wesentlich ändert. Ereignisse enthalten Metadaten und eine einzeilige Zusammenfassung — niemals Nachrichteninhalte.

| Art                   | Aufgezeichnet, wenn                                            | Benachrichtigt Watcher |
| ---------------------- | -------------------------------------------------------- | ----------------- |
| `human_direct_message` | Ein Mensch sendet einen Turn direkt an eine überwachte Sitzung       | Ja               |
| `upstream_missing`     | Die vorgelagerte Quelle einer übernommenen Sitzung verschwindet          | Ja               |
| `goal_changed`         | Der Zielstatus der Sitzung erstellt, aktualisiert oder gelöscht wird | Ja               |
| `child_spawned`        | Eine untergeordnete Sub-Agent- oder ACP-Sitzung erstellt wird              | Nein (initialisiert den Cursor) |
| `run_completed`        | Ein untergeordneter Lauf erfolgreich endet                            | Nein (nur Protokoll)     |
| `run_failed`           | Ein untergeordneter Lauf fehlschlägt, das Zeitlimit überschreitet oder abgebrochen wird            | Nein (nur Protokoll)     |
| `compacted`            | Der Verlauf der Sitzung komprimiert wird                       | Nein (nur Protokoll)     |
| `adopted`              | Eine Katalogsitzung in OpenClaw übernommen wird               | Nein (nur Protokoll)     |

Jedes Ereignis benennt seinen Akteur (`human`, `agent` oder `system`). Abgebrochene untergeordnete Läufe und solche mit Zeitüberschreitung werden als Fehler aufgezeichnet, wobei das genaue Ergebnis (`cancelled`, `timeout` oder `error`) in der Ereignisnutzlast erhalten bleibt.

Die **Statusversion** einer Sitzung ist einfach die höchste Sequenznummer in ihrem Protokoll. Sie wird in einem dauerhaften sitzungsspezifischen Head verfolgt, der das Bereinigen überdauert. `sessions_list`-Zeilen enthalten `stateVersion`, wenn eine Sitzung Änderungen protokolliert hat; `session_status` meldet sie immer.

Nur zur Protokollierung dienende Arten existieren für den Reconciliation-Verlauf, nicht für Benachrichtigungen: Die gewöhnliche Zustellung über den Abschluss untergeordneter Läufe bleibt Aufgabe der [Sub-Agent-Ankündigungen](/de/tools/subagents), und das Signalprotokoll dupliziert sie niemals.

## Watcher

Ein Watcher ist eine Sitzung, die einen Cursor (`session_watch_cursors`) auf einem Ziel verwaltet. Cursor stammen aus zwei Quellen:

- **Implizit (Spawn-Kanten).** Wenn eine Sitzung einen Sub-Agent oder eine untergeordnete ACP-Sitzung erzeugt, wird der Cursor der übergeordneten Sitzung automatisch mit der Spawn-Version der untergeordneten Sitzung initialisiert. Übergeordnete Sitzungen abonnieren nie manuell.
- **Explizit (`sessions_send watch: true`).** Jeder Koordinator kann ein Ziel überwachen, das nicht durch einen Spawn erzeugt wurde: Übergeben Sie `watch: true` an `sessions_send`. Nachdem der Sendevorgang erfolgreich ausgeführt wurde, wird der Absender als Watcher der Sitzung registriert, die die Nachricht tatsächlich empfangen hat. Die Registrierung beginnt bei der aktuellen Statusversion des Ziels — vorherige Verlaufsdaten erzeugen niemals Hinweise. Das Tool-Ergebnis meldet `watched: true|false`, wenn der Parameter gesetzt wurde.

Die Watcher-Identität muss ein durch einen Agenten qualifizierter Sitzungsschlüssel sein. Unter `session.scope="global"` ist der gemeinsame Schlüssel `global` agentenübergreifend mehrdeutig. Solche Sitzungen erhalten daher das dauerhafte Protokoll und `changesSince`, jedoch keine proaktiven Hinweise.

Überwachungen bereinigen sich selbst: Cursor-Zeilen laufen entsprechend der Aufbewahrungsdauer des Signalprotokolls ab, werden beim Zurücksetzen der Watcher-Sitzung entfernt und zusammen mit einer der beiden Sitzungen gelöscht. In v1 gibt es keinen Befehl zum Aufheben der Überwachung.

Aus einem Sitzungskatalog übernommene überwachte Sitzungen werden in einem festen Intervall auf direkte menschliche Aktivitäten in der vorgelagerten Quelle geprüft. Erkannte Aktivitäten gelangen in dasselbe Signalprotokoll und denselben Watcher-Ablauf wie andere direkte menschliche Turns.

Wenn die vorgelagerte Quelle einer übernommenen Sitzung extern gelöscht wird, erzeugen drei aufeinanderfolgende erfolglose Prüfungen (etwa drei Monitor-Ticks) ein einziges `upstream_missing`-Signal für ihre Watcher und entfernen die vorgelagerte Verknüpfung. Wenn die Katalogsitzung erneut fortgesetzt wird, entsteht eine neue Verknüpfung.

## Hinweise: einer statt vieler

Wenn ein benachrichtigungsrelevantes Ereignis eintrifft und der Cursor eines Watchers zurückliegt, erhält der Watcher bei seinem nächsten Turn einen einzigen Systemhinweis:

```
Sitzung "agent:main:subagent:child" wurde geändert (anderer Akteur). Vor dem Handeln abgleichen: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Watcher der Hauptsitzung werden außerdem sofort über einen Heartbeat-Wake aktiviert; verschachtelte Sub-Agent-Watcher erhalten den Hinweis bei ihrem nächsten Turn.

Das Protokoll ist bewusst gegen Spam ausgelegt:

- **Ein ausstehender Hinweis pro Watcher-Ziel-Paar.** Der Hinweistext bleibt bytegenau stabil, solange er aussteht, und die Systemereignis-Warteschlange dedupliziert anhand dieses Textes. Daher erzeugen selbst zwanzig schnelle Änderungen am selben Ziel nur eine einzige Zeile im Prompt des Watchers.
- **Eingefrorene Watermark.** Der Cursor friert seine benachrichtigte Position ein, wenn ein Hinweis in die Warteschlange gestellt wird. Weitere wesentliche Ereignisse verschieben nur die wesentliche Watermark; sie lösen keine erneute Benachrichtigung aus.
- **Beim Entnehmen bestätigen, nur bei dazwischenliegender Arbeit erneut öffnen.** Wenn der Turn des Watchers den Hinweis verarbeitet, wird der Cursor vorgerückt. Falls zwischen dem Einreihen und dem Entnehmen weitere wesentliche Ereignisse eingetroffen sind, wird für den Rest genau ein neuer Hinweis geöffnet.
- **Selbstunterdrückung.** Ein Watcher wird niemals über Ereignisse benachrichtigt, die er selbst verursacht hat.
- **Wiederherstellung nach Neustart.** Ausstehende Hinweise befinden sich in einer In-Memory-Warteschlange; eine Prüfung beim Start materialisiert sie nach einem Gateway-Neustart erneut aus den dauerhaften Cursorn.

## Reconciliation

Der Hinweis teilt dem Watcher genau mit, was zu tun ist. `session_status` mit `changesSince: <version>` gibt die typisierten Ereignisse nach dieser Version zurück (bis zu 200), ohne Cursor vorzurücken:

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "menschliche Nachricht über Telegram"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "Ziel aktualisiert" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` bedeutet, dass die angeforderte Version älter als der aufbewahrte Verlauf ist — aktualisieren Sie stattdessen den gesamten Sitzungsstatus (`sessions_history`, `session_status`), anstatt die Antwort als exaktes Delta zu behandeln. Das Lückensignal ist exakt: Es stammt aus einer sitzungsspezifischen Watermark für bereinigte Daten und wird nicht aus Sequenzarithmetik abgeleitet.

## Speicherung und Grenzwerte

Der Verlauf befindet sich in der gemeinsamen Statusdatenbank und ist auf 30 Tage und 50.000 Zeilen begrenzt; sitzungsspezifische Heads bleiben nach der Bereinigung monoton. Die Aufzeichnung erfolgt nach bestem Bemühen — ein fehlgeschlagenes Anhängen wird protokolliert und lässt den ursprünglichen Turn niemals fehlschlagen —, daher ist `stateVersion` ein Head des Signalprotokolls und keine transaktionale Change-Data-Capture-Version.

Aktuelle Einschränkungen:

- Die Hinweiszustellung setzt voraus, dass ein Gateway-Prozess die gemeinsame Statusdatenbank verwaltet. Mehrere Gateways teilen sich das dauerhafte Protokoll und `changesSince`, aber v1 überträgt keine Hinweise prozessübergreifend.
- Compaction-Ereignisse decken die Compaction-Verantwortlichen der eingebetteten Runtime ab; Compaction, die ausschließlich im nativen Harness erfolgt, wird nicht vollständig protokolliert.
- Details zur Nutzlast abgebrochener Ergebnisse werden derzeit von untergeordneten ACP-Läufen erzeugt; Abbrüche nativer Sub-Agents werden als generische Fehler dargestellt.
- Die Erkennung vorgelagerter Selbstechos vergleicht normalisierten Benutzertext. Ein externer Prompt, der mit einer der 10 neuesten benutzerseitigen OpenClaw-Nachrichten der Sitzung übereinstimmt, wird als Selbstecho behandelt.
- Eine einzelne lokale Claude-JSONL-Zeile, die größer als das Scanlimit von 1 MiB pro Intervall ist, blockiert in v1 den Cursor dieser Sitzung; nicht klassifizierte Bytes werden niemals übersprungen.
- Claude-Prüfungen auf gekoppelten Nodes klassifizieren pro Intervall die neuesten 50 Transkriptelemente. Größere Bursts können außerhalb des v1-Scanfensters liegen.
- Claude-Verlaufsabfragen auf gekoppelten Nodes liefern kein eindeutiges Ergebnis dafür, dass ein Thread nicht gefunden wurde. Daher werden Remote-Löschungen in Claude in v1 nicht als `upstream_missing` klassifiziert.
- Katalogsitzungen, die nicht übernommen wurden, liegen in v1 weiterhin außerhalb der Erkennungsebene.
- Vor dieser Funktion übernommene Sitzungen enthalten keine vorgelagerte Verknüpfung; setzen Sie sie einmal aus dem Katalog fort, um die vorgelagerte Überwachung zu starten.
- Vorgelagerte Verknüpfungen setzen voraus, dass jeder übernommene Sitzungsschlüssel genau einem verwaltenden Agenten zugeordnet ist (bei der Übernahme wird der Standard-Speicheragent verwendet). Die Übernahme desselben externen Threads durch mehrere Agenten wird in v1 nicht überwacht.

## Verwandte Themen

- [Sitzungstools](/de/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Sub-Agents](/de/tools/subagents) — Spawn-Kanten und Abschlussankündigungen
- [Heartbeat](/de/gateway/heartbeat) — wie Hinweise in der Warteschlange Hauptsitzungen aktivieren
- [Sitzungsverwaltung](/de/concepts/session) — Sitzungsschlüssel, Geltungsbereiche, Lebenszyklus
