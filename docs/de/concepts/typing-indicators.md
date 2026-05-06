---
read_when:
    - Verhalten oder Standardwerte der Schreibanzeige ändern
summary: Wann OpenClaw Schreibindikatoren anzeigt und wie Sie sie anpassen
title: Schreibindikatoren
x-i18n:
    generated_at: "2026-05-06T06:46:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Tippindikatoren werden an den Chat-Kanal gesendet, während ein Lauf aktiv ist. Verwenden Sie
`agents.defaults.typingMode`, um zu steuern, **wann** das Tippen beginnt, und `typingIntervalSeconds`,
um zu steuern, **wie oft** es aktualisiert wird.

## Standardwerte

Wenn `agents.defaults.typingMode` **nicht gesetzt** ist, behält OpenClaw das bisherige Verhalten bei:

- **Direktchats**: Das Tippen beginnt sofort, sobald die Modellschleife startet.
- **Gruppenchats mit Erwähnung**: Das Tippen beginnt sofort.
- **Gruppenchats ohne Erwähnung**: Das Tippen beginnt erst, wenn der Nachrichtentext zu streamen beginnt.
- **Heartbeat-Läufe**: Das Tippen beginnt, wenn der Heartbeat-Lauf startet, sofern das
  aufgelöste Heartbeat-Ziel ein Chat mit Tippunterstützung ist und Tippen nicht deaktiviert ist.

## Modi

Setzen Sie `agents.defaults.typingMode` auf einen der folgenden Werte:

- `never` - niemals ein Tippindikator.
- `instant` - Tippen starten, **sobald die Modellschleife beginnt**, selbst wenn der Lauf
  später nur das stille Antwort-Token zurückgibt.
- `thinking` - Tippen beim **ersten Reasoning-Delta** starten (erfordert
  `reasoningLevel: "stream"` für den Lauf).
- `message` - Tippen beim **ersten nicht-stillen Text-Delta** starten (ignoriert
  das stille Token `NO_REPLY`).

Reihenfolge nach „wie früh es ausgelöst wird“:
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

Sie können Modus oder Takt pro Sitzung überschreiben:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Hinweise

- Der Modus `message` zeigt kein Tippen für ausschließlich stille Antworten an, wenn die gesamte
  Nutzlast exakt dem stillen Token entspricht (zum Beispiel `NO_REPLY` / `no_reply`,
  ohne Beachtung der Groß-/Kleinschreibung).
- `thinking` wird nur ausgelöst, wenn der Lauf Reasoning streamt (`reasoningLevel: "stream"`).
  Wenn das Modell keine Reasoning-Deltas ausgibt, beginnt das Tippen nicht.
- Heartbeat-Tippen ist ein Liveness-Signal für das aufgelöste Zustellziel. Es
  startet beim Beginn des Heartbeat-Laufs, statt dem Stream-Timing von `message` oder `thinking`
  zu folgen. Setzen Sie `typingMode: "never"`, um es zu deaktivieren.
- Heartbeats zeigen kein Tippen an, wenn `target: "none"` gesetzt ist, wenn das Ziel nicht
  aufgelöst werden kann, wenn die Chat-Zustellung für den Heartbeat deaktiviert ist oder wenn der
  Kanal Tippen nicht unterstützt.
- `typingIntervalSeconds` steuert den **Aktualisierungstakt**, nicht den Startzeitpunkt.
  Der Standardwert beträgt 6 Sekunden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Presence" href="/de/concepts/presence" icon="signal">
    Wie der Gateway verbundene Clients verfolgt und sie im Tab „Instances“ von macOS anzeigt.
  </Card>
  <Card title="Streaming and chunking" href="/de/concepts/streaming" icon="bars-staggered">
    Ausgehendes Streaming-Verhalten, Chunk-Grenzen und kanalspezifische Zustellung.
  </Card>
</CardGroup>
