---
read_when:
    - Verhalten oder Standardwerte der Tippanzeige ändern
summary: Wann OpenClaw Tippindikatoren anzeigt und wie Sie sie anpassen
title: Tippindikatoren
x-i18n:
    generated_at: "2026-06-27T17:27:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Tippanzeigen werden an den Chat-Kanal gesendet, während eine Ausführung aktiv ist. Verwenden Sie
`agents.defaults.typingMode`, um zu steuern, **wann** das Tippen beginnt, und `typingIntervalSeconds`,
um zu steuern, **wie oft** es aktualisiert wird.

## Standardwerte

Wenn `agents.defaults.typingMode` **nicht gesetzt** ist, behält OpenClaw das Legacy-Verhalten bei:

- **Direktchats**: Das Tippen beginnt sofort, sobald die Modellschleife startet.
- **Gruppenchats mit einer Erwähnung**: Das Tippen beginnt sofort.
- **Gruppenchats ohne Erwähnung**: Das Tippen beginnt, wenn die zugelassene Ausführung
  für Benutzer sichtbare Aktivität hat, etwa Harness-Ausführungsaktivität oder Nachrichtentext.
- **Heartbeat-Ausführungen**: Das Tippen beginnt, wenn die Heartbeat-Ausführung startet, sofern das
  aufgelöste Heartbeat-Ziel ein tippfähiger Chat ist und Tippen nicht deaktiviert ist.

## Modi

Setzen Sie `agents.defaults.typingMode` auf einen der folgenden Werte:

- `never` - niemals eine Tippanzeige.
- `instant` - Tippen starten, **sobald die Modellschleife beginnt**, selbst wenn die Ausführung
  später nur das stille Antwort-Token zurückgibt.
- `thinking` - Tippen beim **ersten Reasoning-Delta** oder bei aktiver
  Harness-Ausführung starten, nachdem der Turn akzeptiert wurde.
- `message` - Tippen bei der **ersten für Benutzer sichtbaren Antwortaktivität** starten, etwa
  bei aktiver Harness-Ausführung oder einem nicht stillen Text-Delta. Stille Antwort-Token wie
  `NO_REPLY` zählen nicht als Textaktivität.

Reihenfolge, „wie früh es ausgelöst wird“:
`never` → `message`/`thinking` → `instant`

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

Überschreiben Sie Modus oder Taktung pro Sitzung:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Hinweise

- Der Modus `message` startet nicht durch stille Antwort-Token, aber aktive Ausführung
  kann weiterhin Tippen anzeigen, bevor Assistant-Text verfügbar ist.
- `thinking` reagiert weiterhin auf gestreamtes Reasoning (`reasoningLevel: "stream"`),
  und es kann auch durch aktive Ausführung starten, bevor Reasoning-Deltas eintreffen.
- Heartbeat-Tippen ist ein Liveness-Signal für das aufgelöste Zustellziel. Es
  startet beim Start der Heartbeat-Ausführung, statt dem Stream-Timing von `message` oder `thinking`
  zu folgen. Setzen Sie `typingMode: "never"`, um es zu deaktivieren.
- Heartbeats zeigen kein Tippen an, wenn `target: "none"` gesetzt ist, wenn das Ziel nicht
  aufgelöst werden kann, wenn die Chat-Zustellung für den Heartbeat deaktiviert ist oder wenn der
  Kanal Tippen nicht unterstützt.
- `typingIntervalSeconds` steuert die **Aktualisierungstaktung**, nicht die Startzeit.
  Der Standardwert ist 6 Sekunden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Presence" href="/de/concepts/presence" icon="signal">
    Wie der Gateway verbundene Clients verfolgt und sie im macOS-Tab „Instances“ anzeigt.
  </Card>
  <Card title="Streaming and chunking" href="/de/concepts/streaming" icon="bars-staggered">
    Ausgehendes Streaming-Verhalten, Chunk-Grenzen und kanalspezifische Zustellung.
  </Card>
</CardGroup>
