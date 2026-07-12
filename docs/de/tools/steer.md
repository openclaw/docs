---
read_when:
    - Verwendung von /steer oder /tell, während bereits ein Agent ausgeführt wird
    - Vergleich von /steer mit /queue-Modi
    - Entscheiden, ob der aktuelle Lauf oder eine ACP-Sitzung gesteuert werden soll
sidebarTitle: Steer
summary: Einen aktiven Lauf steuern, ohne den Warteschlangenmodus zu ändern
title: Steuern
x-i18n:
    generated_at: "2026-07-12T02:17:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` versucht zunächst, Hinweise an einen bereits aktiven Lauf zu senden. Der Befehl ist für Situationen gedacht, in denen Sie „diesen Lauf anpassen möchten, während er noch arbeitet“. Wenn die aktuelle Laufzeitumgebung keine Steuerung annehmen kann, sendet OpenClaw die Nachricht stattdessen als normale Eingabeaufforderung, anstatt sie zu verwerfen.

## Aktuelle Sitzung

Verwenden Sie `/steer` auf der obersten Ebene, um den aktiven Lauf der aktuellen Sitzung anzusprechen:

```text
/steer den kleineren Patch bevorzugen und die Tests gezielt halten
/tell vor dem nächsten Tool-Aufruf eine Zusammenfassung erstellen
```

Verhalten:

- Richtet sich ausschließlich an den aktiven Lauf der aktuellen Sitzung.
- Funktioniert unabhängig vom `/queue`-Modus der Sitzung.
- Startet eine normale Interaktion mit derselben Nachricht, wenn die Sitzung inaktiv ist oder der aktive Lauf keine Steuerung annehmen kann.
- Verwendet den Steuerungspfad der aktiven Laufzeitumgebung, sodass das Modell die Hinweise an der nächsten unterstützten Laufzeitgrenze erhält.

## Steuerung und Warteschlange

Mit `/queue steer` versuchen normale eingehende Nachrichten, den aktiven Lauf zu steuern, wenn sie eintreffen, während ein Lauf aktiv ist. `/steer <message>` ist ein expliziter Befehl, der versucht, die Nachricht dieses Befehls unabhängig von der gespeicherten `/queue`-Einstellung an der nächsten unterstützten Laufzeitgrenze in den aktiven Lauf einzuspeisen. Wenn diese Einspeisung nicht verfügbar ist, wird das Befehlspräfix entfernt und `<message>` als normale Eingabeaufforderung verarbeitet.

Verwendung:

- `/steer <message>`, wenn Sie den aktiven Lauf sofort steuern möchten.
- `/queue steer`, wenn zukünftige normale Nachrichten aktive Läufe standardmäßig steuern sollen.
- `/queue collect` oder `/queue followup`, wenn zukünftige normale Nachrichten auf eine spätere Interaktion warten sollen, anstatt den aktiven Lauf zu steuern.
- `/queue interrupt`, wenn die neueste Nachricht den aktiven Lauf ersetzen soll, anstatt ihn zu steuern.

Informationen zu Warteschlangenmodi und Steuerungsgrenzen finden Sie unter [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

## Sub-Agenten

`/steer` auf der obersten Ebene richtet sich an den aktiven Lauf der aktuellen Sitzung. Sub-Agenten melden sich bei ihrer übergeordneten beziehungsweise anfordernden Sitzung zurück; `/subagents` dient nur der Übersicht.

## ACP-Sitzungen

Verwenden Sie `/acp steer`, wenn das Ziel eine ACP-Harness-Sitzung ist:

```text
/acp steer --session agent:main:acp:codex die Reproduktion präzisieren
```

Weitere Informationen zur Auswahl von ACP-Sitzungen und zum Laufzeitverhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Verwandte Themen

- [Slash-Befehle](/de/tools/slash-commands)
- [Befehlswarteschlange](/de/concepts/queue)
- [Steuerungswarteschlange](/de/concepts/queue-steering)
- [Sub-Agenten](/de/tools/subagents)
