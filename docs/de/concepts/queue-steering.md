---
read_when:
    - Erklären, wie sich die Steuerung verhält, während ein Agent Tools verwendet
    - Ändern des Verhaltens der Warteschlange für aktive Ausführungen oder der Integration der Laufzeitsteuerung
    - Vergleich der Modi steer, queue, collect und followup
summary: Wie Active-Run-Steering Nachrichten an Laufzeitgrenzen einreiht
title: Steuerungswarteschlange
x-i18n:
    generated_at: "2026-04-30T06:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Wenn eine Nachricht eingeht, während eine Session-Ausführung bereits streamt, kann OpenClaw
diese Nachricht an die aktive Runtime senden, statt eine weitere Ausführung für
dieselbe Session zu starten. Die öffentlichen Modi sind Runtime-neutral; Pi und das native Codex-App-Server-Harness
implementieren die Zustellungsdetails unterschiedlich.

## Runtime-Grenze

Steering unterbricht keinen Tool-Aufruf, der bereits läuft. Pi prüft an
Modellgrenzen auf Nachrichten, die für Steering in der Warteschlange stehen:

1. Der Assistent fordert Tool-Aufrufe an.
2. Pi führt den Tool-Aufruf-Batch der aktuellen Assistentennachricht aus.
3. Pi gibt das Ereignis für das Turn-Ende aus.
4. Pi leert die Warteschlange der Steering-Nachrichten.
5. Pi hängt diese Nachrichten vor dem nächsten LLM-Aufruf als Benutzernachrichten an.

So bleiben Tool-Ergebnisse mit der Assistentennachricht verknüpft, die sie angefordert hat,
und der nächste Modellaufruf sieht anschließend die neueste Benutzereingabe.

Das native Codex-App-Server-Harness stellt `turn/steer` anstelle von Pis
interner Steering-Warteschlange bereit. OpenClaw passt dort dieselben Modi an:

- `steer` bündelt Nachrichten aus der Warteschlange für das konfigurierte Ruhefenster und sendet dann eine
  einzelne `turn/steer`-Anfrage mit allen gesammelten Benutzereingaben in Eingangsreihenfolge.
- `queue` behält die ältere serialisierte Form bei, indem separate `turn/steer`-
  Anfragen gesendet werden.
- `followup`, `collect`, `steer-backlog` und `interrupt` bleiben OpenClaw-eigenes
  Warteschlangenverhalten rund um den aktiven Codex-Turn.

Codex-Review- und manuelle Compaction-Turns lehnen Steering im selben Turn ab. Wenn eine
Runtime kein Steering annehmen kann, fällt OpenClaw auf die Follow-up-Warteschlange zurück, sofern
dieser Modus es erlaubt.

## Modi

| Modus           | Verhalten bei aktiver Ausführung                                                                                             | Späteres Follow-up-Verhalten                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Injiziert alle Steering-Nachrichten aus der Warteschlange gemeinsam an der nächsten Runtime-Grenze. Dies ist der Standard.   | Fällt nur dann auf Follow-up zurück, wenn Steering nicht verfügbar ist.              |
| `queue`         | Älteres Steering nacheinander. Pi injiziert eine Nachricht aus der Warteschlange pro Modellgrenze; Codex sendet separate `turn/steer`-Anfragen. | Fällt nur dann auf Follow-up zurück, wenn Steering nicht verfügbar ist.              |
| `steer-backlog` | Dasselbe Steering-Verhalten bei aktiver Ausführung wie `steer`.                                                              | Behält dieselbe Nachricht auch für einen späteren Follow-up-Turn bei.               |
| `followup`      | Steuert die aktuelle Ausführung nicht.                                                                                        | Führt Nachrichten aus der Warteschlange später aus.                                 |
| `collect`       | Steuert die aktuelle Ausführung nicht.                                                                                        | Fasst kompatible Nachrichten aus der Warteschlange nach dem Debounce-Fenster zu einem späteren Turn zusammen. |
| `interrupt`     | Bricht die aktive Ausführung ab und startet dann die neueste Nachricht.                                                       | Keine.                                                                              |

## Burst-Beispiel

Wenn vier Benutzer Nachrichten senden, während der Agent einen Tool-Aufruf ausführt:

- `steer`: Die aktive Runtime erhält alle vier Nachrichten in Eingangsreihenfolge vor
  ihrer nächsten Modellentscheidung. Pi leert sie an der nächsten Modellgrenze; Codex
  erhält sie als ein gebündeltes `turn/steer`.
- `queue`: Älteres serialisiertes Steering. Pi injiziert jeweils eine Nachricht aus der Warteschlange;
  Codex erhält separate `turn/steer`-Anfragen.
- `collect`: OpenClaw wartet, bis die aktive Ausführung endet, und erstellt dann nach dem Debounce-Fenster einen Follow-up-
  Turn mit kompatiblen Nachrichten aus der Warteschlange.

## Geltungsbereich

Steering zielt immer auf die aktuell aktive Session-Ausführung. Es erstellt keine neue
Session, ändert nicht die Tool-Richtlinie der aktiven Ausführung und teilt Nachrichten nicht nach Absender auf. In
Mehrbenutzerkanälen enthalten eingehende Prompts bereits Absender- und Routing-Kontext, sodass
der nächste Modellaufruf sehen kann, wer jede Nachricht gesendet hat.

Verwenden Sie `collect`, wenn OpenClaw einen späteren Follow-up-Turn erstellen soll, der
kompatible Nachrichten zusammenfassen und die Verwerfungsrichtlinie der Follow-up-Warteschlange beibehalten kann. Verwenden Sie
`queue` nur, wenn Sie das ältere Steering-Verhalten nacheinander benötigen.

## Debounce

`messages.queue.debounceMs` gilt für die Follow-up-Zustellung, einschließlich `collect`,
`followup`, `steer-backlog` und des `steer`-Fallbacks, wenn Steering bei aktiver Ausführung nicht
verfügbar ist. Für Pi verwendet aktives `steer` selbst keinen Debounce-Timer, weil
Pi Nachrichten von Natur aus bis zur nächsten Modellgrenze bündelt. Für das native
Codex-Harness verwendet OpenClaw denselben Debounce-Wert als Ruhefenster, bevor
das gebündelte `turn/steer` gesendet wird.

## Verwandte Themen

- [Befehlswarteschlange](/de/concepts/queue)
- [Nachrichten](/de/concepts/messages)
- [Agent-Schleife](/de/concepts/agent-loop)
