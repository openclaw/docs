---
read_when:
    - Verhalten oder Standardeinstellungen von Tippindikatoren ändern
summary: Wann OpenClaw Tippindikatoren anzeigt und wie Sie sie anpassen können
title: Tippindikatoren
x-i18n:
    generated_at: "2026-04-22T06:22:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Tippindikatoren

Tippindikatoren werden an den Chat-Kanal gesendet, während ein Lauf aktiv ist. Verwenden Sie
`agents.defaults.typingMode`, um zu steuern, **wann** die Anzeige beginnt, und `typingIntervalSeconds`,
um zu steuern, **wie oft** sie aktualisiert wird.

## Standardverhalten

Wenn `agents.defaults.typingMode` **nicht gesetzt** ist, behält OpenClaw das bisherige Verhalten bei:

- **Direktchats**: Die Tippanzeige startet sofort, sobald die Modellschleife beginnt.
- **Gruppenchats mit einer Erwähnung**: Die Tippanzeige startet sofort.
- **Gruppenchats ohne Erwähnung**: Die Tippanzeige startet erst, wenn der Nachrichtentext gestreamt wird.
- **Heartbeat-Läufe**: Die Tippanzeige startet, wenn der Heartbeat-Lauf beginnt, sofern das
  aufgelöste Heartbeat-Ziel ein Chat mit Unterstützung für Tippindikatoren ist und die Tippanzeige nicht deaktiviert ist.

## Modi

Setzen Sie `agents.defaults.typingMode` auf einen der folgenden Werte:

- `never` — niemals eine Tippanzeige.
- `instant` — Tippanzeige **sobald die Modellschleife beginnt**, auch wenn der Lauf
  später nur das stille Antwort-Token zurückgibt.
- `thinking` — Tippanzeige beim **ersten Reasoning-Delta** (erfordert
  `reasoningLevel: "stream"` für den Lauf).
- `message` — Tippanzeige beim **ersten nicht stillen Text-Delta** (ignoriert
  das stille Token `NO_REPLY`).

Reihenfolge nach „wie früh es auslöst“:
`never` → `message` → `thinking` → `instant`

## Konfiguration

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Sie können Modus oder Intervall pro Sitzung überschreiben:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Hinweise

- Im Modus `message` wird keine Tippanzeige für ausschließlich stille Antworten angezeigt, wenn die gesamte
  Nutzlast genau dem stillen Token entspricht (zum Beispiel `NO_REPLY` / `no_reply`,
  Groß-/Kleinschreibung wird nicht beachtet).
- `thinking` wird nur ausgelöst, wenn der Lauf Reasoning streamt (`reasoningLevel: "stream"`).
  Wenn das Modell keine Reasoning-Deltas ausgibt, startet die Tippanzeige nicht.
- Die Heartbeat-Tippanzeige ist ein Lebenszeichen für das aufgelöste Zustellziel. Sie
  startet mit dem Beginn des Heartbeat-Laufs, statt dem Streaming-Zeitpunkt von `message` oder `thinking` zu folgen. Setzen Sie `typingMode: "never"`, um sie zu deaktivieren.
- Heartbeats zeigen keine Tippanzeige an, wenn `target: "none"` gesetzt ist, wenn das Ziel nicht
  aufgelöst werden kann, wenn die Chat-Zustellung für den Heartbeat deaktiviert ist oder wenn der
  Kanal keine Tippindikatoren unterstützt.
- `typingIntervalSeconds` steuert die **Aktualisierungsfrequenz**, nicht den Startzeitpunkt.
  Der Standardwert ist 6 Sekunden.
