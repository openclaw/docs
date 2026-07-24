---
read_when:
    - Erläuterung des Verhaltens von „steer“, während ein Agent Tools verwendet
    - Ändern des Verhaltens der Warteschlange für aktive Ausführungen oder der Integration der Laufzeitsteuerung
    - Vergleich von Steering mit den Warteschlangenmodi Followup, Collect und Interrupt
summary: Wie Active-Run-Steuerung Nachrichten an Laufzeitgrenzen in die Warteschlange einreiht
title: Steuerungswarteschlange
x-i18n:
    generated_at: "2026-07-24T04:53:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 131f04f19934b9b1f6dd8ffb2cf2428950c319483abdc2ccdecec741809cda2a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Wenn eine normale Eingabeaufforderung eintrifft, während ein Sitzungsdurchlauf bereits eine Streaming-Ausgabe liefert und der Warteschlangenmodus `steer` ist (Standardeinstellung, keine Konfiguration erforderlich), versucht OpenClaw, diese Eingabeaufforderung an die aktive Runtime zu senden. OpenClaw und das native Codex-App-Server-Harness implementieren die Zustellungsdetails unterschiedlich.

Diese Seite behandelt die Steuerung über den Warteschlangenmodus für normale eingehende Nachrichten im Modus `steer`. Im Modus `followup` oder `collect` überspringen normale Nachrichten diesen Pfad und warten, bis der aktive Durchlauf abgeschlossen ist. Informationen zum expliziten Befehl `/steer <message>` finden Sie unter [Steuern](/de/tools/steer).

## Runtime-Grenze

Die Steuerung unterbricht keinen bereits laufenden Tool-Aufruf. OpenClaw prüft an Modellgrenzen auf zur Steuerung vorgemerkte Nachrichten:

1. Der Assistent fordert Tool-Aufrufe an.
2. OpenClaw führt den Tool-Aufruf-Batch der aktuellen Assistentennachricht aus.
3. OpenClaw gibt das Ereignis zum Ende des Turns aus.
4. OpenClaw verarbeitet die zur Steuerung vorgemerkten Nachrichten.
5. OpenClaw fügt diese Nachrichten vor dem nächsten LLM-Aufruf als Benutzernachrichten an.

Dadurch bleiben Tool-Ergebnisse mit der Assistentennachricht verknüpft, die sie angefordert hat, und der nächste Modellaufruf erhält anschließend die neuesten Benutzereingaben.

Das native Codex-App-Server-Harness stellt `turn/steer` anstelle der internen Steuerungswarteschlange der OpenClaw-Runtime bereit. OpenClaw sammelt vorgemerkte Eingabeaufforderungen während des konfigurierten Ruhezeitfensters in einem Batch und sendet anschließend eine einzelne `turn/steer`-Anfrage mit allen gesammelten Benutzereingaben in der Reihenfolge ihres Eingangs.

Codex-Review- und manuelle Compaction-Turns lehnen die Steuerung innerhalb desselben Turns ab. Wenn eine Runtime im Modus `steer` keine Steuerung annehmen kann, wartet OpenClaw mit dem Start der Eingabeaufforderung, bis der aktive Durchlauf abgeschlossen ist.

## Modi

| Modus        | Verhalten bei aktivem Durchlauf                                    | Späteres Verhalten                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | Steuert die Eingabeaufforderung nach Möglichkeit in die aktive Runtime. | Wartet auf den Abschluss des aktiven Durchlaufs, wenn die Steuerung nicht verfügbar ist.                      |
| `followup`  | Führt keine Steuerung durch.                                        | Führt vorgemerkte Nachrichten später aus, nachdem der aktive Durchlauf beendet wurde.                               |
| `collect`   | Führt keine Steuerung durch.                                        | Fasst kompatible vorgemerkte Nachrichten nach dem Entprellzeitfenster in einem späteren Turn zusammen. |
| `interrupt` | Bricht den aktiven Durchlauf ab, anstatt ihn zu steuern.          | Startet nach dem Abbruch die neueste Nachricht.                                           |

## Beispiel für einen Nachrichtenschub

Wenn vier Benutzer Nachrichten senden, während der Agent einen Tool-Aufruf ausführt:

- Beim Standardverhalten erhält die aktive Runtime alle vier Nachrichten vor ihrer nächsten Modellauswahl in der Reihenfolge ihres Eingangs. OpenClaw verarbeitet sie an der nächsten Modellgrenze; Codex erhält sie als einen gebündelten `turn/steer`.
- Mit `/queue collect` führt OpenClaw keine Steuerung durch. Es wartet, bis der aktive Durchlauf beendet ist, und erstellt dann nach dem Entprellzeitfenster einen Folge-Turn mit kompatiblen vorgemerkten Nachrichten.
- Mit `/queue interrupt` bricht OpenClaw den aktiven Durchlauf ab und startet die neueste Nachricht, anstatt eine Steuerung durchzuführen.

## Geltungsbereich

Die Steuerung richtet sich immer an den aktuellen aktiven Sitzungsdurchlauf. Sie erstellt keine neue Sitzung, ändert nicht die Tool-Richtlinie des aktiven Durchlaufs und teilt Nachrichten nicht nach Absender auf. In Mehrbenutzerkanälen enthalten eingehende Eingabeaufforderungen bereits den Absender- und Routingkontext, sodass der nächste Modellaufruf erkennen kann, wer die jeweilige Nachricht gesendet hat.

Verwenden Sie `followup` oder `collect`, wenn Nachrichten standardmäßig vorgemerkt werden sollen, anstatt den aktiven Durchlauf zu steuern. Verwenden Sie `interrupt`, wenn die neueste Eingabeaufforderung den aktiven Durchlauf ersetzen soll.

## Entprellung

Die integrierte Warteschlangenentprellung gilt für die vorgemerkte Zustellung mit `followup` und `collect`. Im Modus `steer` mit dem nativen Codex-Harness legt sie außerdem das Ruhezeitfenster fest, bevor gebündelte `turn/steer` gesendet werden. Bei OpenClaw verwendet die aktive Steuerung selbst keinen Entprelltimer, da OpenClaw Nachrichten von sich aus bis zur nächsten Modellgrenze bündelt.

## Verwandte Themen

- [Befehlswarteschlange](/de/concepts/queue)
- [Steuern](/de/tools/steer)
- [Nachrichten](/de/concepts/messages)
- [Agentenschleife](/de/concepts/agent-loop)
