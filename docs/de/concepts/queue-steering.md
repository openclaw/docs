---
read_when:
    - Erläuterung des Verhaltens von Steer, während ein Agent Tools verwendet
    - Ändern des Warteschlangenverhaltens für aktive Ausführungen oder der Integration der Laufzeitsteuerung
    - Vergleich von Steering mit den Warteschlangenmodi Followup, Collect und Interrupt
summary: Wie das Steering aktiver Ausführungen Nachrichten an Laufzeitgrenzen in die Warteschlange einreiht
title: Steuerungswarteschlange
x-i18n:
    generated_at: "2026-07-12T15:20:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Wenn eine normale Eingabeaufforderung eintrifft, während ein Sitzungsdurchlauf bereits streamt und der Warteschlangenmodus `steer` ist (die Standardeinstellung, keine Konfiguration erforderlich), versucht OpenClaw, diese Eingabeaufforderung an die aktive Laufzeit zu senden. OpenClaw und das native Codex-App-Server-Harness implementieren die Zustellungsdetails unterschiedlich.

Diese Seite behandelt die Steuerung im Warteschlangenmodus für normale eingehende Nachrichten im Modus `steer`. Im Modus `followup` oder `collect` überspringen normale Nachrichten diesen Pfad und warten, bis der aktive Durchlauf abgeschlossen ist. Informationen zum expliziten Befehl `/steer <message>` finden Sie unter [Steuern](/de/tools/steer).

## Laufzeitgrenze

Die Steuerung unterbricht keinen bereits laufenden Tool-Aufruf. OpenClaw prüft an Modellgrenzen auf Steuerungsnachrichten in der Warteschlange:

1. Der Assistent fordert Tool-Aufrufe an.
2. OpenClaw führt den Tool-Aufruf-Stapel der aktuellen Assistentennachricht aus.
3. OpenClaw gibt das Ereignis für das Ende des Turns aus.
4. OpenClaw entnimmt die Steuerungsnachrichten aus der Warteschlange.
5. OpenClaw fügt diese Nachrichten vor dem nächsten LLM-Aufruf als Benutzernachrichten an.

Dadurch bleiben die Tool-Ergebnisse mit der Assistentennachricht verknüpft, die sie angefordert hat, und der nächste Modellaufruf kann anschließend die neuesten Benutzereingaben berücksichtigen.

Das native Codex-App-Server-Harness stellt `turn/steer` anstelle der internen Steuerungswarteschlange der OpenClaw-Laufzeit bereit. OpenClaw sammelt Eingabeaufforderungen in der Warteschlange während des konfigurierten Ruhefensters und sendet anschließend eine einzelne `turn/steer`-Anfrage mit allen gesammelten Benutzereingaben in der Reihenfolge ihres Eingangs.

Codex-Überprüfungs- und manuelle Compaction-Turns lehnen eine Steuerung innerhalb desselben Turns ab. Wenn eine Laufzeit im Modus `steer` keine Steuerung akzeptieren kann, wartet OpenClaw, bis der aktive Durchlauf abgeschlossen ist, bevor die Eingabeaufforderung gestartet wird.

## Modi

| Modus       | Verhalten während eines aktiven Durchlaufs                    | Späteres Verhalten                                                                                           |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `steer`     | Steuert die Eingabeaufforderung nach Möglichkeit in die aktive Laufzeit. | Wartet auf den Abschluss des aktiven Durchlaufs, wenn die Steuerung nicht verfügbar ist.                     |
| `followup`  | Führt keine Steuerung durch.                                  | Führt Nachrichten aus der Warteschlange später nach dem Ende des aktiven Durchlaufs aus.                     |
| `collect`   | Führt keine Steuerung durch.                                  | Fasst kompatible Nachrichten aus der Warteschlange nach dem Entprellfenster zu einem späteren Turn zusammen. |
| `interrupt` | Bricht den aktiven Durchlauf ab, statt ihn zu steuern.        | Startet nach dem Abbruch die neueste Nachricht.                                                              |

## Beispiel für eine Nachrichtenserie

Wenn vier Benutzer Nachrichten senden, während der Agent einen Tool-Aufruf ausführt:

- Beim Standardverhalten erhält die aktive Laufzeit alle vier Nachrichten in der Reihenfolge ihres Eingangs vor ihrer nächsten Modellauswahl. OpenClaw entnimmt sie an der nächsten Modellgrenze aus der Warteschlange; Codex erhält sie als einen gebündelten `turn/steer`-Aufruf.
- Mit `/queue collect` führt OpenClaw keine Steuerung durch. Es wartet, bis der aktive Durchlauf abgeschlossen ist, und erstellt dann nach dem Entprellfenster einen Folgeturn mit kompatiblen Nachrichten aus der Warteschlange.
- Mit `/queue interrupt` bricht OpenClaw den aktiven Durchlauf ab und startet die neueste Nachricht, statt eine Steuerung durchzuführen.

## Geltungsbereich

Die Steuerung ist immer auf den aktuellen aktiven Sitzungsdurchlauf ausgerichtet. Sie erstellt keine neue Sitzung, ändert nicht die Tool-Richtlinie des aktiven Durchlaufs und teilt Nachrichten nicht nach Absender auf. In Kanälen mit mehreren Benutzern enthalten eingehende Eingabeaufforderungen bereits Absender- und Routingkontext, sodass der nächste Modellaufruf erkennen kann, wer die einzelnen Nachrichten gesendet hat.

Verwenden Sie `followup` oder `collect`, wenn Nachrichten standardmäßig in die Warteschlange gestellt werden sollen, statt den aktiven Durchlauf zu steuern. Verwenden Sie `interrupt`, wenn die neueste Eingabeaufforderung den aktiven Durchlauf ersetzen soll.

## Entprellung

`messages.queue.debounceMs` gilt für die Zustellung von `followup` und `collect` aus der Warteschlange. Im Modus `steer` mit dem nativen Codex-Harness legt diese Einstellung außerdem das Ruhefenster vor dem Senden eines gebündelten `turn/steer`-Aufrufs fest. Bei OpenClaw verwendet die aktive Steuerung selbst nicht den Entprellzeitgeber, da OpenClaw Nachrichten von Natur aus bis zur nächsten Modellgrenze bündelt.

## Verwandte Themen

- [Befehlswarteschlange](/de/concepts/queue)
- [Steuern](/de/tools/steer)
- [Nachrichten](/de/concepts/messages)
- [Agentenschleife](/de/concepts/agent-loop)
