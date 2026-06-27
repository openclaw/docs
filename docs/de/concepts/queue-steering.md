---
read_when:
    - Erklären, wie sich die Steuerung verhält, während ein Agent Tools verwendet
    - Ändern des Verhaltens der Warteschlange für aktive Ausführungen oder der Integration der Laufzeitsteuerung
    - Steuerung mit den Warteschlangenmodi followup, collect und interrupt vergleichen
summary: Wie die Steuerung aktiver Läufe Nachrichten an Laufzeitgrenzen in die Warteschlange einreiht
title: Steuerungswarteschlange
x-i18n:
    generated_at: "2026-06-27T17:26:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Wenn eine normale Eingabe eintrifft, während ein Sitzungslauf bereits streamt, versucht OpenClaw
standardmäßig, diese Eingabe an die aktive Runtime zu senden, wenn der Queue-Modus
`steer` ist. Für dieses Standardverhalten sind weder ein Konfigurationseintrag
noch eine Queue-Direktive erforderlich. OpenClaw und das native Codex App-Server-Harness
implementieren die Zustelldetails unterschiedlich.

## Runtime-Grenze

Steuerung unterbricht keinen Tool-Aufruf, der bereits ausgeführt wird. OpenClaw prüft an
Modellgrenzen auf eingereihte Steuerungsnachrichten:

1. Der Assistent fordert Tool-Aufrufe an.
2. OpenClaw führt den Tool-Aufruf-Batch der aktuellen Assistentennachricht aus.
3. OpenClaw gibt das Turn-Ende-Ereignis aus.
4. OpenClaw leert die eingereihten Steuerungsnachrichten.
5. OpenClaw hängt diese Nachrichten vor dem nächsten LLM-Aufruf als Benutzernachrichten an.

So bleiben Tool-Ergebnisse mit der Assistentennachricht verknüpft, die sie angefordert hat,
und der nächste Modellaufruf sieht anschließend die neueste Benutzereingabe.

Das native Codex App-Server-Harness stellt `turn/steer` statt der internen
Steuerungs-Queue der OpenClaw-Runtime bereit. OpenClaw bündelt eingereihte Eingaben für das konfigurierte
Ruhefenster und sendet dann eine einzelne `turn/steer`-Anfrage mit allen gesammelten
Benutzereingaben in Eingangsreihenfolge.

Codex-Review- und manuelle Compaction-Turns lehnen Steuerung im selben Turn ab. Wenn eine
Runtime im Modus `steer` keine Steuerung annehmen kann, wartet OpenClaw, bis der aktive
Lauf beendet ist, bevor die Eingabe gestartet wird.

Diese Seite erklärt Queue-Modus-Steuerung für normale eingehende Nachrichten, wenn der Modus
`steer` ist. Wenn der Modus `followup` oder `collect` ist, gelangen normale Nachrichten nicht in
diesen Steuerungspfad; sie warten, bis der aktive Lauf beendet ist. Für den expliziten
Befehl `/steer <message>` siehe [Steuern](/de/tools/steer).

## Modi

| Modus       | Verhalten bei aktivem Lauf                                      | Späteres Verhalten                                                                    |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `steer`     | Steuert die Eingabe in die aktive Runtime, wenn möglich.        | Wartet, bis der aktive Lauf beendet ist, wenn Steuerung nicht verfügbar ist.          |
| `followup`  | Steuert nicht.                                                  | Führt eingereihte Nachrichten später aus, nachdem der aktive Lauf endet.              |
| `collect`   | Steuert nicht.                                                  | Fasst kompatible eingereihte Nachrichten nach dem Debounce-Fenster zu einem späteren Turn zusammen. |
| `interrupt` | Bricht den aktiven Lauf ab, statt ihn zu steuern.               | Startet nach dem Abbruch die neueste Nachricht.                                       |

## Burst-Beispiel

Wenn vier Benutzer Nachrichten senden, während der Agent einen Tool-Aufruf ausführt:

- Beim Standardverhalten erhält die aktive Runtime alle vier Nachrichten in
  Eingangsreihenfolge vor ihrer nächsten Modellentscheidung. OpenClaw leert sie an der nächsten Modellgrenze;
  Codex erhält sie als ein gebündeltes `turn/steer`.
- Mit `/queue collect` steuert OpenClaw nicht. Es wartet, bis der aktive Lauf
  endet, und erstellt dann nach dem Debounce-Fenster einen Folge-Turn mit kompatiblen
  eingereihten Nachrichten.
- Mit `/queue interrupt` bricht OpenClaw den aktiven Lauf ab und startet die neueste
  Nachricht, statt zu steuern.

## Umfang

Steuerung zielt immer auf den aktuellen aktiven Sitzungslauf. Sie erstellt keine neue
Sitzung, ändert nicht die Tool-Richtlinie des aktiven Laufs und teilt Nachrichten nicht nach Absender auf. In
Mehrbenutzerkanälen enthalten eingehende Eingaben bereits Absender- und Routing-Kontext, sodass
der nächste Modellaufruf sehen kann, wer welche Nachricht gesendet hat.

Verwenden Sie `followup` oder `collect`, wenn Nachrichten standardmäßig eingereiht werden sollen,
statt den aktiven Lauf zu steuern. Verwenden Sie `interrupt`, wenn die neueste Eingabe
den aktiven Lauf ersetzen soll.

## Debounce

`messages.queue.debounceMs` gilt für die eingereihte Zustellung mit `followup` und `collect`.
Im Modus `steer` mit dem nativen Codex-Harness legt es außerdem das Ruhefenster
vor dem Senden des gebündelten `turn/steer` fest. Bei OpenClaw verwendet die aktive Steuerung selbst
den Debounce-Timer nicht, weil OpenClaw Nachrichten auf natürliche Weise bis zur nächsten Modellgrenze bündelt.

## Verwandte Themen

- [Befehls-Queue](/de/concepts/queue)
- [Steuern](/de/tools/steer)
- [Nachrichten](/de/concepts/messages)
- [Agent-Schleife](/de/concepts/agent-loop)
