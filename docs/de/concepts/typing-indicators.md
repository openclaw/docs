---
read_when:
    - Verhalten oder Standardeinstellungen der Tippanzeige ändern
summary: Wann OpenClaw Tippindikatoren anzeigt und wie Sie sie anpassen können
title: Tippindikatoren
x-i18n:
    generated_at: "2026-07-12T15:21:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Tippanzeigen werden an den Chat-Kanal gesendet, solange ein Lauf aktiv ist. Verwenden Sie `agents.defaults.typingMode`, um zu steuern, **wann** das Tippen beginnt, und `typingIntervalSeconds`, um zu steuern, **wie oft** die Anzeige aktualisiert wird (Keepalive-Intervall, standardmäßig 6 Sekunden).

## Standardwerte

Wenn `agents.defaults.typingMode` **nicht festgelegt** ist:

- **Direktchats**: Das Tippen beginnt sofort, sobald die Modellschleife beginnt.
- **Gruppenchats mit einer Erwähnung**: Das Tippen beginnt sofort.
- **Gruppenchats ohne Erwähnung**: Das Tippen beginnt, wenn der zugelassene Lauf eine für Benutzer sichtbare Aktivität aufweist, etwa eine Ausführungsaktivität der Harness-Umgebung oder Nachrichtentext.
- **Heartbeat-Läufe**: Das Tippen beginnt mit dem Heartbeat-Lauf, sofern das ermittelte Heartbeat-Ziel ein Chat mit Tippunterstützung ist und das Tippen nicht deaktiviert wurde.

## Modi

Legen Sie `agents.defaults.typingMode` auf einen der folgenden Werte fest:

- `never` – es wird niemals eine Tippanzeige angezeigt.
- `instant` – das Tippen beginnt, **sobald die Modellschleife beginnt**, selbst wenn der Lauf später nur das Token für eine stille Antwort zurückgibt.
- `thinking` – das Tippen beginnt beim **ersten Reasoning-Delta** oder bei aktiver Ausführung der Harness-Umgebung, nachdem der Turn angenommen wurde.
- `message` – das Tippen beginnt bei der **ersten für Benutzer sichtbaren Antwortaktivität**, etwa bei aktiver Ausführung der Harness-Umgebung oder einem nicht stillen Text-Delta. Tokens für stille Antworten wie `NO_REPLY` gelten nicht als Textaktivität.

Reihenfolge danach, wie früh die Anzeige ausgelöst wird: `never` -> `message`/`thinking` -> `instant`.

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

Überschreiben Sie Modus oder Intervall pro Sitzung:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Hinweise

- Der Modus `message` wird nicht durch Tokens für stille Antworten gestartet, aber eine aktive Ausführung kann das Tippen dennoch anzeigen, bevor Text des Assistenten verfügbar ist.
- `thinking` reagiert weiterhin auf gestreamtes Reasoning (`reasoningLevel: "stream"`) und kann auch durch eine aktive Ausführung gestartet werden, bevor Reasoning-Deltas eintreffen.
- Die Tippanzeige bei Heartbeats ist ein Aktivitätssignal für das ermittelte Zustellungsziel. Sie beginnt beim Start des Heartbeat-Laufs, statt dem Stream-Timing von `message` oder `thinking` zu folgen. Legen Sie `typingMode: "never"` fest, um sie zu deaktivieren.
- Heartbeats zeigen keine Tippanzeige, wenn das Heartbeat-Ziel `"none"` ist, das Ziel nicht ermittelt werden kann, die Chat-Zustellung für den Heartbeat deaktiviert ist oder der Kanal keine Tippanzeigen unterstützt.
- `typingIntervalSeconds` steuert das **Aktualisierungsintervall**, nicht den Startzeitpunkt. Standardwert: 6 Sekunden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Präsenz" href="/de/concepts/presence" icon="signal">
    Wie das Gateway verbundene Clients für die Geräteseite der Control UI und den Tab „macOS-Instanzen“ verfolgt.
  </Card>
  <Card title="Streaming und Aufteilung" href="/de/concepts/streaming" icon="bars-staggered">
    Verhalten beim ausgehenden Streaming, Abschnittsgrenzen und kanalspezifische Zustellung.
  </Card>
</CardGroup>
