---
read_when:
    - Sie möchten, dass Agenten bemerken, wenn Menschen oder andere Agenten eine Sitzung ohne ihr Wissen ändern
    - Sie debuggen Benachrichtigungen über Statusänderungen, Watch-Cursor oder `session_status`-Änderungen an `changesSince`
    - Sie möchten verstehen, wie übergeordnete Agenten mit untergeordneten Sitzungen synchronisiert bleiben
sidebarTitle: Session state awareness
summary: 'Protokoll dauerhafter Sitzungsstatussignale: Statusversionen, Beobachter, Hinweise auf veralteten Status und Abgleich'
title: Sitzungsstatusbewusstsein
x-i18n:
    generated_at: "2026-07-16T12:58:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Wenn mehrere Sitzungen am selben Problem arbeiten — ein Manager, der Aufgaben an untergeordnete Sitzungen delegiert, ein Mensch, der direkt in eine Worker-Sitzung wechselt, oder zwei Agenten, die sich über [`sessions_send`](/de/concepts/session-tool) koordinieren —, entwickelt jede Sitzung Annahmen über die anderen. Diese Annahmen sind nicht mehr aktuell, sobald ein anderer Akteur eingreift. Die Sitzungszustandserkennung ist der Mechanismus, der den Eingriff erkennt, die betroffene Sitzung einmalig benachrichtigt und ihr eine effiziente Möglichkeit gibt, sich vor dem nächsten Vorgang auf den aktuellen Stand zu bringen.

Drei Komponenten arbeiten zusammen:

1. Ein **dauerhaftes Signalprotokoll** zeichnet ausgewählte Zustandsänderungen pro Sitzung auf.
2. **Watcher** verwalten Cursor pro Ziel und erhalten eine einzelne zusammengefasste Benachrichtigung über einen veralteten Zustand.
3. Die **Synchronisierung** ruft über `session_status` mit `changesSince` das exakte Delta ab.

## Das Signalprotokoll

OpenClaw fügt der gemeinsamen Zustandsdatenbank (`session_state_events`) ein typisiertes Ereignis hinzu, wenn sich eine überwachte Sitzung wesentlich ändert. Ereignisse enthalten Metadaten und eine einzeilige Zusammenfassung — niemals Nachrichteninhalte.

| Art                    | Aufzeichnungszeitpunkt                                     | Benachrichtigt Watcher |
| ---------------------- | ---------------------------------------------------------- | ---------------------- |
| `human_direct_message` | Ein Mensch sendet direkt einen Turn an eine überwachte Sitzung | Ja                     |
| `upstream_missing`     | Die Upstream-Quelle einer übernommenen Sitzung verschwindet | Ja                     |
| `goal_changed`         | Der Zielzustand der Sitzung wird erstellt, aktualisiert oder gelöscht | Ja                     |
| `child_spawned`        | Eine untergeordnete Sitzung eines Sub-Agenten oder ACP wird erstellt | Nein (Cursor wird initialisiert) |
| `run_completed`        | Ein untergeordneter Lauf wird erfolgreich beendet          | Nein (nur Protokollierung) |
| `run_failed`           | Ein untergeordneter Lauf schlägt fehl, überschreitet das Zeitlimit oder wird abgebrochen | Nein (nur Protokollierung) |
| `compacted`            | Der Verlauf der Sitzung wird komprimiert                    | Nein (nur Protokollierung) |
| `adopted`              | Eine Katalogsitzung wird in OpenClaw übernommen              | Nein (nur Protokollierung) |

Jedes Ereignis benennt seinen Akteur (`human`, `agent` oder `system`). Abgebrochene untergeordnete Läufe und solche mit Zeitüberschreitung werden als Fehler aufgezeichnet, wobei das genaue Ergebnis (`cancelled`, `timeout` oder `error`) in der Ereignisnutzlast erhalten bleibt.

Die **Zustandsversion** einer Sitzung ist einfach die höchste Sequenznummer in ihrem Protokoll. Sie wird in einem dauerhaften sitzungsspezifischen Kopfdatensatz geführt, der die Bereinigung überdauert. `sessions_list`-Zeilen enthalten `stateVersion`, wenn für eine Sitzung Änderungen protokolliert wurden; `session_status` gibt diesen Wert immer zurück.

Nur protokollierte Arten dienen dem Synchronisierungsverlauf, nicht der Benachrichtigung: Die normale Übermittlung abgeschlossener untergeordneter Läufe bleibt Aufgabe der [Ankündigungen von Sub-Agenten](/de/tools/subagents), und das Signalprotokoll dupliziert sie niemals.

## Watcher

Ein Watcher ist eine Sitzung, die einen Cursor (`session_watch_cursors`) für ein Ziel verwaltet. Cursor stammen aus zwei Quellen:

- **Implizit (Spawn-Kanten).** Wenn eine Sitzung einen Sub-Agenten oder eine untergeordnete ACP-Sitzung erzeugt, wird der Cursor der übergeordneten Sitzung automatisch mit der Spawn-Version der untergeordneten Sitzung initialisiert. Übergeordnete Sitzungen abonnieren niemals manuell.
- **Explizit (`sessions_send watch: true`).** Jeder Koordinator kann ein nicht erzeugtes Ziel überwachen: Übergeben Sie `watch: true` an `sessions_send`. Nachdem der Sendevorgang erfolgreich ausgeführt wurde, wird der Absender als Watcher der Sitzung registriert, die die Nachricht tatsächlich erhalten hat. Die Registrierung beginnt bei der aktuellen Zustandsversion des Ziels — der vorherige Verlauf erzeugt niemals Benachrichtigungen. Das Werkzeugergebnis gibt `watched: true|false` zurück, wenn der Parameter festgelegt war.

Die Identität eines Watchers muss ein agentenqualifizierter Sitzungsschlüssel sein. Unter `session.scope="global"` ist der gemeinsame Schlüssel `global` agentenübergreifend mehrdeutig. Solche Sitzungen erhalten daher das dauerhafte Protokoll und `changesSince`, jedoch keine proaktiven Benachrichtigungen.

Überwachungen bereinigen sich selbst: Cursorzeilen laufen mit der Aufbewahrungsfrist des Signalprotokolls ab, werden beim Zurücksetzen der Watcher-Sitzung entfernt und zusammen mit einer der beiden Sitzungen gelöscht. In v1 gibt es kein Verb zum Beenden der Überwachung.

Aus einem Sitzungskatalog übernommene überwachte Sitzungen werden in einem festen Intervall auf direkte menschliche Upstream-Aktivität geprüft. Erkannte Aktivität durchläuft dasselbe Signalprotokoll und denselben Watcher-Ablauf wie andere direkte menschliche Turns.

Wenn die Upstream-Quelle einer übernommenen Sitzung extern gelöscht wird, erzeugen drei aufeinanderfolgende erfolglose Prüfungen (etwa drei Monitor-Ticks) ein einzelnes `upstream_missing`-Signal für ihre Watcher und entfernen die Upstream-Verknüpfung. Wird die Katalogsitzung erneut fortgesetzt, entsteht eine neue Verknüpfung.

## Benachrichtigungen: eine statt vieler

Wenn ein benachrichtigungsrelevantes Ereignis eintrifft und der Cursor eines Watchers zurückliegt, erhält der Watcher bei seinem nächsten Turn eine einzelne Systembenachrichtigung:

```
Sitzung "agent:main:subagent:child" wurde geändert (anderer Akteur). Vor dem nächsten Vorgang synchronisieren: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Watcher von Hauptsitzungen werden außerdem sofort über einen Heartbeat-Wake aktiviert; verschachtelte Sub-Agent-Watcher erhalten die Benachrichtigung bei ihrem nächsten Turn.

Das Protokoll verhindert bewusst Benachrichtigungsfluten:

- **Eine ausstehende Benachrichtigung pro Watcher-Ziel-Paar.** Der Benachrichtigungstext bleibt bytegenau unverändert, solange er aussteht, und die Systemereigniswarteschlange dedupliziert ihn. Daher erzeugen auch zwanzig schnelle Änderungen am selben Ziel nur eine einzelne Zeile im Prompt des Watchers.
- **Eingefrorene Fortschrittsmarke.** Der Cursor friert seine benachrichtigte Position ein, wenn eine Benachrichtigung in die Warteschlange gestellt wird. Weitere wesentliche Ereignisse verschieben nur die Fortschrittsmarke für wesentliche Änderungen; sie lösen keine erneute Benachrichtigung aus.
- **Bestätigung beim Leeren, erneutes Öffnen nur bei zwischenzeitlichen Änderungen.** Wenn der Turn des Watchers die Benachrichtigung verarbeitet, rückt der Cursor vor. Sind zwischen dem Einreihen und dem Verarbeiten weitere wesentliche Ereignisse eingetroffen, wird für den Rest genau eine neue Benachrichtigung geöffnet.
- **Selbstunterdrückung.** Ein Watcher wird niemals über Ereignisse benachrichtigt, die er selbst verursacht hat.
- **Wiederherstellung nach Neustart.** Ausstehende Benachrichtigungen befinden sich in einer speicherinternen Warteschlange; nach einem Gateway-Neustart materialisiert eine Startprüfung sie aus den dauerhaften Cursorn neu.

## Synchronisierung

Die Benachrichtigung teilt dem Watcher genau mit, was zu tun ist. `session_status` mit `changesSince: <version>` gibt die typisierten Ereignisse nach dieser Version zurück (bis zu 200), ohne Cursor vorzurücken:

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

`historyGap: true` bedeutet, dass die angeforderte Version älter als der aufbewahrte Verlauf ist — aktualisieren Sie den gesamten Sitzungszustand (`sessions_history`, `session_status`), statt die Antwort als exaktes Delta zu behandeln. Das Lückensignal ist exakt: Es stammt aus einer sitzungsspezifischen Fortschrittsmarke für bereinigte Daten und wird nicht aus der Sequenzarithmetik abgeleitet.

## Speicherung und Grenzen

Der Verlauf befindet sich in der gemeinsamen Zustandsdatenbank und ist auf 30 Tage und 50.000 Zeilen begrenzt; die sitzungsspezifischen Kopfdatensätze bleiben nach der Bereinigung monoton. Die Aufzeichnung erfolgt nach bestem Bemühen — ein fehlgeschlagenes Anhängen wird protokolliert und führt niemals zum Fehlschlagen des auslösenden Turns. Daher ist `stateVersion` ein Kopfwert des Signalprotokolls und keine transaktionale CDC-Version.

Aktuelle Grenzen:

- Die Zustellung von Benachrichtigungen setzt voraus, dass ein Gateway-Prozess die gemeinsame Zustandsdatenbank besitzt. Mehrere Gateways teilen sich das dauerhafte Protokoll und `changesSince`, aber v1 überträgt keine Benachrichtigungen prozessübergreifend.
- Compaction-Ereignisse decken die Compaction-Verantwortlichen der eingebetteten Laufzeit ab; eine ausschließlich im nativen Harness erfolgende Compaction wird nicht vollständig protokolliert.
- Detaillierte Nutzlasten für Abbruchergebnisse werden derzeit von untergeordneten ACP-Läufen erzeugt; Abbrüche nativer Sub-Agenten werden als allgemeine Fehler gemeldet.
- Die Upstream-Selbstecho-Erkennung vergleicht normalisierten Benutzertext. Ein externer Prompt, der einer der 10 letzten OpenClaw-seitigen Benutzernachrichten der Sitzung entspricht, wird als Selbstecho behandelt.
- Eine einzelne lokale Claude-JSONL-Zeile, die größer als die Scan-Obergrenze von 1 MiB pro Intervall ist, blockiert in v1 den Cursor dieser Sitzung; nicht klassifizierte Bytes werden niemals übersprungen.
- Claude-Prüfungen auf gekoppelten Nodes klassifizieren pro Intervall die neuesten 50 Transkriptelemente. Größere Aktivitätsspitzen können außerhalb des Scanfensters von v1 liegen.
- Claude-Verlaufsabfragen auf gekoppelten Nodes liefern kein eindeutiges Ergebnis für nicht gefundene Threads. Daher werden remote erfolgte Claude-Löschungen in v1 nicht als `upstream_missing` klassifiziert.
- Katalogsitzungen, die nicht übernommen wurden, bleiben in v1 außerhalb der Zustandserkennung.
- Sitzungen, die vor Einführung dieser Funktion übernommen wurden, besitzen keine Upstream-Verknüpfung; setzen Sie sie einmal aus dem Katalog fort, um die Upstream-Überwachung zu starten.
- Upstream-Verknüpfungen setzen voraus, dass jeder übernommene Sitzungsschlüssel genau einem zuständigen Agenten zugeordnet ist (bei der Übernahme wird der Standardagent des Speichers verwendet). Die agentenübergreifende Übernahme desselben externen Threads wird in v1 nicht überwacht.

## Verwandte Themen

- [Sitzungswerkzeuge](/de/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Sub-Agenten](/de/tools/subagents) — Spawn-Kanten und Abschlussankündigungen
- [Heartbeat](/de/gateway/heartbeat) — wie Benachrichtigungen in der Warteschlange Hauptsitzungen aktivieren
- [Sitzungsverwaltung](/de/concepts/session) — Sitzungsschlüssel, Geltungsbereiche und Lebenszyklus
