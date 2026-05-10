---
read_when:
    - Verhalten oder Standardeinstellungen der Tippanzeige ändern
summary: Wann OpenClaw Schreibindikatoren anzeigt und wie Sie sie anpassen
title: Schreibindikatoren
x-i18n:
    generated_at: "2026-05-10T19:33:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Tippindikatoren werden an den Chat-Kanal gesendet, während ein Lauf aktiv ist. Verwenden Sie
`agents.defaults.typingMode`, um zu steuern, **wann** Tippen beginnt, und `typingIntervalSeconds`,
um zu steuern, **wie oft** es aktualisiert wird.

## Standardwerte

Wenn `agents.defaults.typingMode` **nicht gesetzt** ist, behält OpenClaw das bisherige Verhalten bei:

- **Direktchats**: Tippen beginnt sofort, sobald die Modellschleife startet.
- **Gruppenchats mit Erwähnung**: Tippen beginnt sofort.
- **Gruppenchats ohne Erwähnung**: Tippen beginnt erst, wenn Nachrichtentext zu streamen beginnt.
- **Heartbeat-Läufe**: Tippen beginnt, wenn der Heartbeat-Lauf startet, sofern das
  aufgelöste Heartbeat-Ziel ein tippfähiger Chat ist und Tippen nicht deaktiviert ist.

## Modi

Setzen Sie `agents.defaults.typingMode` auf einen der folgenden Werte:

- `never` - niemals ein Tippindikator.
- `instant` - Tippen beginnt **sobald die Modellschleife startet**, auch wenn der Lauf
  später nur das Token für stille Antworten zurückgibt.
- `thinking` - Tippen beginnt beim **ersten Reasoning-Delta** (erfordert
  `reasoningLevel: "stream"` für den Lauf).
- `message` - Tippen beginnt beim **ersten nicht stillen Text-Delta** (ignoriert
  das stille Token `NO_REPLY`).

Reihenfolge nach „wie früh es ausgelöst wird“:
`never` → `message` → `thinking` → `instant`

## Konfiguration

Legen Sie den Standardwert auf Agent-Ebene fest:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Überschreiben Sie Modus oder Takt pro Sitzung:

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
  ohne Beachtung der Groß-/Kleinschreibung abgeglichen).
- `thinking` wird nur ausgelöst, wenn der Lauf Reasoning streamt (`reasoningLevel: "stream"`).
  Wenn das Modell keine Reasoning-Deltas ausgibt, beginnt Tippen nicht.
- Heartbeat-Tippen ist ein Liveness-Signal für das aufgelöste Zustellziel. Es
  beginnt beim Start des Heartbeat-Laufs, statt dem Stream-Timing von `message` oder `thinking`
  zu folgen. Setzen Sie `typingMode: "never"`, um es zu deaktivieren.
- Heartbeats zeigen kein Tippen an, wenn `target: "none"` gesetzt ist, wenn das Ziel nicht
  aufgelöst werden kann, wenn die Chat-Zustellung für den Heartbeat deaktiviert ist oder wenn der
  Kanal Tippen nicht unterstützt.
- `typingIntervalSeconds` steuert den **Aktualisierungstakt**, nicht die Startzeit.
  Der Standardwert beträgt 6 Sekunden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Präsenz" href="/de/concepts/presence" icon="signal">
    Wie der Gateway verbundene Clients verfolgt und sie im Tab „Instanzen“ von macOS sichtbar macht.
  </Card>
  <Card title="Streaming und Chunking" href="/de/concepts/streaming" icon="bars-staggered">
    Verhalten beim ausgehenden Streaming, Chunk-Grenzen und kanalspezifische Zustellung.
  </Card>
</CardGroup>
