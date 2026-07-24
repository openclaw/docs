---
read_when:
    - Verhalten oder Standardeinstellungen der Tippanzeige ändern
summary: Wann OpenClaw Tippindikatoren anzeigt und wie sie angepasst werden können
title: Eingabeindikatoren
x-i18n:
    generated_at: "2026-07-24T04:33:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b3c66d61ea7e3e809b8e88ae2eabb9794f0886b629094753716ed02912843ffc
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Tippindikatoren werden an den Chatkanal gesendet, während ein Lauf aktiv ist. Verwenden Sie `agents.defaults.typingMode`, um zu steuern, **wann** das Tippen beginnt, und `typingIntervalSeconds`, um zu steuern, **wie oft** der Indikator aktualisiert wird (Keepalive-Intervall, standardmäßig 6 Sekunden).

## Standardeinstellungen

Wenn `agents.defaults.typingMode` **nicht festgelegt** ist:

- **Direktchats**: Das Tippen beginnt sofort, sobald die Modellschleife startet.
- **Gruppenchats mit Erwähnung**: Das Tippen beginnt sofort.
- **Gruppenchats ohne Erwähnung**: Das Tippen beginnt, sobald der zugelassene Lauf eine für Benutzer sichtbare Aktivität aufweist, etwa eine Ausführungsaktivität des Harness oder Nachrichtentext.
- **Heartbeat-Läufe**: Das Tippen beginnt beim Start des Heartbeat-Laufs, sofern das aufgelöste Heartbeat-Ziel ein tippfähiger Chat ist und das Tippen nicht deaktiviert wurde.

## Modi

Setzen Sie `agents.defaults.typingMode` auf einen der folgenden Werte:

- `never` – niemals ein Tippindikator.
- `instant` – Das Tippen beginnt, **sobald die Modellschleife startet**, selbst wenn der Lauf später nur das Token für eine stille Antwort zurückgibt.
- `thinking` – Das Tippen beginnt beim **ersten Reasoning-Delta** oder bei aktiver Harness-Ausführung, nachdem der Turn angenommen wurde.
- `message` – Das Tippen beginnt bei der **ersten für Benutzer sichtbaren Antwortaktivität**, etwa bei aktiver Harness-Ausführung oder einem nicht stillen Text-Delta. Tokens für stille Antworten wie `NO_REPLY` gelten nicht als Textaktivität.

Reihenfolge danach, „wie früh es ausgelöst wird“: `never` -> `message`/`thinking` -> `instant`.

## Konfiguration

Legen Sie den Standardwert auf Agentenebene fest:

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

Überschreiben Sie die Richtlinie für einen einzelnen Agenten:

```json5
{
  agents: {
    entries: {
      support: {
        typingMode: "message",
      },
    },
  },
}
```

## Hinweise

- Der Modus `message` wird nicht durch Tokens für stille Antworten ausgelöst, eine aktive Ausführung kann jedoch weiterhin das Tippen anzeigen, bevor Assistententext verfügbar ist.
- `thinking` reagiert weiterhin auf gestreamtes Reasoning (`reasoningLevel: "stream"`) und kann auch durch eine aktive Ausführung ausgelöst werden, bevor Reasoning-Deltas eintreffen.
- Das Tippen bei einem Heartbeat ist ein Verfügbarkeitssignal für das aufgelöste Zustellungsziel. Es beginnt beim Start des Heartbeat-Laufs, statt dem Stream-Timing von `message` oder `thinking` zu folgen. Setzen Sie `typingMode: "never"`, um es zu deaktivieren.
- Heartbeats zeigen keinen Tippindikator an, wenn das Heartbeat-Ziel `"none"` ist, das Ziel nicht aufgelöst werden kann, die Chat-Zustellung für den Heartbeat deaktiviert ist oder der Kanal keine Tippindikatoren unterstützt.
- `agents.defaults.typingIntervalSeconds` steuert für jeden Agenten das **Aktualisierungsintervall**, nicht den Startzeitpunkt. Standardwert: 6 Sekunden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Präsenz" href="/de/concepts/presence" icon="signal">
    So verfolgt das Gateway verbundene Clients für die Geräteseite der Control UI und den Tab „macOS-Instanzen“.
  </Card>
  <Card title="Streaming und Aufteilung" href="/de/concepts/streaming" icon="bars-staggered">
    Verhalten beim ausgehenden Streaming, Abschnittsgrenzen und kanalspezifische Zustellung.
  </Card>
</CardGroup>
