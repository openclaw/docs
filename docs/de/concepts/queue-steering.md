---
read_when:
    - Erklärung, wie sich die Steuerung verhält, während ein Agent Werkzeuge verwendet
    - Ändern des Verhaltens der Warteschlange für aktive Ausführungen oder der Laufzeitsteuerungsintegration
    - Vergleich der Modi steer, queue, collect und followup
summary: Wie die Steuerung aktiver Ausführungen Nachrichten an Laufzeitgrenzen in die Warteschlange einreiht
title: Steuerungswarteschlange
x-i18n:
    generated_at: "2026-05-04T02:23:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Wenn eine Nachricht eintrifft, während eine Sitzungsausführung bereits streamt, kann OpenClaw
diese Nachricht an die aktive Runtime senden, statt eine weitere Ausführung für
dieselbe Sitzung zu starten. Die öffentlichen Modi sind Runtime-neutral; Pi und das native Codex
App-Server-Harness implementieren die Zustelldetails unterschiedlich.

## Runtime-Grenze

Steering unterbricht keinen Tool-Aufruf, der bereits läuft. Pi prüft an
Modellgrenzen auf eingereihte Steering-Nachrichten:

1. Der Assistent fordert Tool-Aufrufe an.
2. Pi führt den Tool-Aufruf-Batch der aktuellen Assistentennachricht aus.
3. Pi gibt das Ereignis für das Ende des Turns aus.
4. Pi leert eingereihte Steering-Nachrichten.
5. Pi hängt diese Nachrichten vor dem nächsten LLM-Aufruf als Benutzernachrichten an.

So bleiben Tool-Ergebnisse mit der Assistentennachricht verknüpft, die sie angefordert hat,
und der nächste Modellaufruf sieht anschließend die neueste Benutzereingabe.

Das native Codex App-Server-Harness stellt `turn/steer` statt Pis
interner Steering-Warteschlange bereit. OpenClaw passt dieselben Modi dort an:

- `steer` bündelt eingereihte Nachrichten für das konfigurierte Ruhefenster und sendet dann eine
  einzelne `turn/steer`-Anfrage mit allen gesammelten Benutzereingaben in Eingangsreihenfolge.
- `queue` behält die bisherige serialisierte Form bei, indem separate `turn/steer`-
  Anfragen gesendet werden.
- `followup`, `collect`, `steer-backlog` und `interrupt` bleiben OpenClaw-eigenes
  Warteschlangenverhalten rund um den aktiven Codex-Turn.

Codex-Review- und manuelle Compaction-Turns lehnen Same-Turn-Steering ab. Wenn eine
Runtime kein Steering annehmen kann, fällt OpenClaw auf die Followup-Warteschlange zurück, sofern
dieser Modus es erlaubt.

Diese Seite erklärt Warteschlangenmodus-Steering für normale eingehende Nachrichten. Für den
expliziten Befehl `/steer <message>` siehe [Steer](/de/tools/steer).

## Modi

| Modus           | Verhalten bei aktiver Ausführung                                                                                             | Verhalten bei späterem Followup                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `steer`         | Injiziert alle eingereihten Steering-Nachrichten zusammen an der nächsten Runtime-Grenze. Dies ist die Standardeinstellung.  | Fällt nur dann auf Followup zurück, wenn Steering nicht verfügbar ist.           |
| `queue`         | Bisheriges Steering einzeln nacheinander. Pi injiziert eine eingereihte Nachricht pro Modellgrenze; Codex sendet separate `turn/steer`-Anfragen. | Fällt nur dann auf Followup zurück, wenn Steering nicht verfügbar ist.           |
| `steer-backlog` | Gleiches Steering-Verhalten bei aktiver Ausführung wie `steer`.                                                              | Behält dieselbe Nachricht auch für einen späteren Followup-Turn bei.             |
| `followup`      | Steuert die aktuelle Ausführung nicht.                                                                                        | Führt eingereihte Nachrichten später aus.                                        |
| `collect`       | Steuert die aktuelle Ausführung nicht.                                                                                        | Fasst kompatible eingereihte Nachrichten nach dem Debounce-Fenster zu einem späteren Turn zusammen. |
| `interrupt`     | Bricht die aktive Ausführung ab und startet dann die neueste Nachricht.                                                       | Keine.                                                                          |

## Burst-Beispiel

Wenn vier Benutzer Nachrichten senden, während der Agent einen Tool-Aufruf ausführt:

- `steer`: Die aktive Runtime erhält alle vier Nachrichten in Eingangsreihenfolge vor
  ihrer nächsten Modellentscheidung. Pi leert sie an der nächsten Modellgrenze; Codex
  erhält sie als eine gebündelte `turn/steer`-Anfrage.
- `queue`: Bisheriges serialisiertes Steering. Pi injiziert jeweils eine eingereihte Nachricht;
  Codex erhält separate `turn/steer`-Anfragen.
- `collect`: OpenClaw wartet, bis die aktive Ausführung endet, und erstellt dann einen Followup-
  Turn mit kompatiblen eingereihten Nachrichten nach dem Debounce-Fenster.

## Geltungsbereich

Steering zielt immer auf die aktuelle aktive Sitzungsausführung. Es erstellt keine neue
Sitzung, ändert nicht die Tool-Richtlinie der aktiven Ausführung und teilt Nachrichten nicht nach Absender auf. In
Mehrbenutzerkanälen enthalten eingehende Prompts bereits Absender- und Routing-Kontext, sodass
der nächste Modellaufruf sehen kann, wer welche Nachricht gesendet hat.

Verwenden Sie `collect`, wenn OpenClaw einen späteren Followup-Turn erstellen soll, der
kompatible Nachrichten zusammenfassen und die Verwerfungsrichtlinie der Followup-Warteschlange beibehalten kann. Verwenden Sie
`queue` nur, wenn Sie das ältere Steering-Verhalten einzeln nacheinander benötigen.

## Debounce

`messages.queue.debounceMs` gilt für die Followup-Zustellung, einschließlich `collect`,
`followup`, `steer-backlog` und `steer`-Fallback, wenn Steering bei aktiver Ausführung nicht
verfügbar ist. Für Pi verwendet aktives `steer` selbst den Debounce-Timer nicht, weil
Pi Nachrichten von Natur aus bis zur nächsten Modellgrenze bündelt. Für das native
Codex-Harness verwendet OpenClaw denselben Debounce-Wert wie das Ruhefenster, bevor
das gebündelte `turn/steer` gesendet wird.

## Verwandte Themen

- [Befehlswarteschlange](/de/concepts/queue)
- [Steer](/de/tools/steer)
- [Nachrichten](/de/concepts/messages)
- [Agent-Schleife](/de/concepts/agent-loop)
