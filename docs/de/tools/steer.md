---
read_when:
    - Verwenden von /steer oder /tell, während bereits ein Agent läuft
    - Vergleich der Modi /steer und /queue
    - Entscheiden, ob der aktuelle Lauf oder eine ACP-Sitzung gesteuert werden soll
sidebarTitle: Steer
summary: Eine aktive Ausführung steuern, ohne den Warteschlangenmodus zu ändern
title: Steuern
x-i18n:
    generated_at: "2026-06-27T18:21:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` versucht zuerst, Hinweise an einen bereits aktiven Lauf zu senden. Es ist für
Momente wie „diesen Lauf anpassen, während er noch arbeitet“ gedacht. Wenn die aktuelle Runtime
Steering nicht annehmen kann, sendet OpenClaw die Nachricht stattdessen als normalen Prompt,
anstatt sie zu verwerfen.

## Aktuelle Sitzung

Verwenden Sie `/steer` auf oberster Ebene, um den aktiven Lauf der aktuellen Sitzung anzusteuern:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Verhalten:

- Richtet sich nur an den aktiven Lauf der aktuellen Sitzung.
- Funktioniert unabhängig vom `/queue`-Modus der Sitzung.
- Startet einen normalen Turn mit derselben Nachricht, wenn die Sitzung inaktiv ist oder der
  aktive Lauf kein Steering annehmen kann.
- Verwendet den Steering-Pfad der aktiven Runtime, sodass das Modell die Hinweise an der
  nächsten unterstützten Runtime-Grenze sieht.

## Steer vs. Queue

`/queue steer` lässt normale eingehende Nachrichten versuchen, den aktiven Lauf zu steuern, wenn
sie eintreffen, während ein Lauf aktiv ist. `/steer <message>` ist ein expliziter Befehl,
der versucht, die Nachricht dieses Befehls an der nächsten unterstützten Runtime-Grenze in den aktiven Lauf
einzuspeisen, unabhängig von der gespeicherten `/queue`-Einstellung. Wenn
diese Einspeisung nicht verfügbar ist, wird das Befehlspräfix entfernt und `<message>`
als normaler Prompt fortgesetzt.

Verwendung:

- `/steer <message>`, wenn Sie den aktiven Lauf jetzt anleiten möchten.
- `/queue steer`, wenn künftige normale Nachrichten aktive Läufe standardmäßig steuern sollen.
- `/queue collect` oder `/queue followup`, wenn künftige normale Nachrichten auf
  einen späteren Turn warten sollen, statt den aktiven Lauf zu steuern.
- `/queue interrupt`, wenn die neueste Nachricht den aktiven Lauf ersetzen soll,
  statt ihn zu steuern.

Informationen zu Queue-Modi und Steering-Grenzen finden Sie unter [Command Queue](/de/concepts/queue) und
[Steering Queue](/de/concepts/queue-steering).

## Sub-Agents

`/steer` auf oberster Ebene richtet sich an den aktiven Lauf der aktuellen Sitzung. Sub-Agents melden
sich bei ihrer übergeordneten/anfordernden Sitzung zurück; `/subagents` dient nur der Sichtbarkeit.

## ACP-Sitzungen

Verwenden Sie `/acp steer`, wenn das Ziel eine ACP-Harness-Sitzung ist:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Siehe [ACP-Agents](/de/tools/acp-agents) zur Auswahl von ACP-Sitzungen und zum Runtime-
Verhalten.

## Verwandt

- [Slash Commands](/de/tools/slash-commands)
- [Command Queue](/de/concepts/queue)
- [Steering Queue](/de/concepts/queue-steering)
- [Sub-Agents](/de/tools/subagents)
