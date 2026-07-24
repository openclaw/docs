---
read_when:
    - Verwendung von /steer oder /tell, während bereits ein Agent ausgeführt wird
    - Vergleich von /steer mit /queue-Modi
    - Entscheiden, ob der aktuelle Lauf oder eine ACP-Sitzung gesteuert werden soll
sidebarTitle: Steer
summary: Steuern Sie einen aktiven Lauf, ohne den Warteschlangenmodus zu ändern
title: Steuern
x-i18n:
    generated_at: "2026-07-24T05:03:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d420e14982d52520e415103ffa6d86923fad6f13c43ff7741ebbd8dde0d0073f
    source_path: tools/steer.md
    workflow: 16
---

`/steer` versucht zunächst, Anweisungen an einen bereits aktiven Lauf zu senden. Dies ist für Situationen vorgesehen, in denen Sie
„diesen Lauf anpassen möchten, während er noch arbeitet“. Wenn die aktuelle Runtime
keine Steuerung akzeptieren kann, sendet OpenClaw die Nachricht stattdessen als normalen Prompt,
anstatt sie zu verwerfen.

## Aktuelle Sitzung

Verwenden Sie `/steer` auf oberster Ebene, um den aktiven Lauf der aktuellen Sitzung anzusteuern:

```text
/steer den kleineren Patch bevorzugen und die Tests gezielt halten
/tell vor dem nächsten Tool-Aufruf zusammenfassen
```

Verhalten:

- Zielt nur auf den aktiven Lauf der aktuellen Sitzung.
- Funktioniert unabhängig vom `/queue`-Modus der Sitzung.
- Startet einen normalen Turn mit derselben Nachricht, wenn die Sitzung inaktiv ist oder der
  aktive Lauf keine Steuerung akzeptieren kann.
- Verwendet den Steuerungspfad der aktiven Runtime, sodass das Modell die Anweisung an
  der nächsten unterstützten Runtime-Grenze sieht.

## Steuern oder einreihen

`/queue steer` bewirkt, dass normale eingehende Nachrichten versuchen, den aktiven Lauf zu steuern, wenn
sie während eines aktiven Laufs eintreffen. `/steer <message>` ist ein expliziter Befehl,
der versucht, die Nachricht dieses Befehls an der nächsten unterstützten
Runtime-Grenze in den aktiven Lauf einzufügen, unabhängig von der gespeicherten `/queue`-Einstellung. Wenn
dieses Einfügen nicht verfügbar ist, wird das Befehlspräfix entfernt und `<message>`
als normaler Prompt fortgesetzt.

Der explizite Befehl `/steer` (und `/tell`) wird vom Gateway unterstützt. Wählen Sie in
`openclaw chat` oder `openclaw tui --local` `/queue steer` aus und senden Sie die
Anweisung als normale Nachricht; die eingebettete Runtime wendet dieselbe Steuerungsrichtlinie an,
ohne einen Gateway-Befehl weiterzuleiten.

Verwenden Sie:

- `/steer <message>`, wenn Sie den aktiven Lauf sofort anleiten möchten.
- `/queue steer`, wenn zukünftige normale Nachrichten aktive Läufe standardmäßig
  steuern sollen.
- `/queue collect` oder `/queue followup`, wenn zukünftige normale Nachrichten auf
  einen späteren Turn warten sollen, anstatt den aktiven Lauf zu steuern.
- `/queue interrupt`, wenn die neueste Nachricht den aktiven Lauf ersetzen soll,
  anstatt ihn zu steuern.

Informationen zu Warteschlangenmodi und Steuerungsgrenzen finden Sie unter [Befehlswarteschlange](/de/concepts/queue) und
[Steuerungswarteschlange](/de/concepts/queue-steering).

## Sub-Agenten

`/steer` auf oberster Ebene zielt auf den aktiven Lauf der aktuellen Sitzung. Sub-Agenten melden
sich bei ihrer übergeordneten/anfordernden Sitzung zurück; `/subagents` dient nur der Sichtbarkeit.

## ACP-Sitzungen

Verwenden Sie `/acp steer`, wenn das Ziel eine ACP-Harness-Sitzung ist:

```text
/acp steer --session agent:main:acp:codex die Reproduktion präzisieren
```

Weitere Informationen zur Auswahl von ACP-Sitzungen und zum Runtime-Verhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Verwandte Themen

- [Slash-Befehle](/de/tools/slash-commands)
- [Befehlswarteschlange](/de/concepts/queue)
- [Steuerungswarteschlange](/de/concepts/queue-steering)
- [Sub-Agenten](/de/tools/subagents)
