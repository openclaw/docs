---
read_when:
    - Mit Reaktionen in jedem Kanal arbeiten
    - Verstehen, wie sich Emoji-Reaktionen je nach Plattform unterscheiden
summary: Semantik des Reaktionstools über alle unterstützten Kanäle hinweg
title: Reaktionen
x-i18n:
    generated_at: "2026-04-30T07:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

Der Agent kann Emoji-Reaktionen auf Nachrichten mit dem `message`-Tool und der Aktion `react` hinzufügen und entfernen. Das Reaktionsverhalten variiert je nach Kanal und Transport.

## Funktionsweise

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` ist erforderlich, wenn eine Reaktion hinzugefügt wird.
- Setzen Sie `emoji` auf eine leere Zeichenfolge (`""`), um die Reaktion(en) des Bots zu entfernen.
- Setzen Sie `remove: true`, um ein bestimmtes Emoji zu entfernen (erfordert ein nicht leeres `emoji`).

## Kanalverhalten

<AccordionGroup>
  <Accordion title="Discord und Slack">
    - Ein leeres `emoji` entfernt alle Reaktionen des Bots auf die Nachricht.
    - `remove: true` entfernt nur das angegebene Emoji.

  </Accordion>

  <Accordion title="Google Chat">
    - Ein leeres `emoji` entfernt die Reaktionen der App auf die Nachricht.
    - `remove: true` entfernt nur das angegebene Emoji.

  </Accordion>

  <Accordion title="Telegram">
    - Ein leeres `emoji` entfernt die Reaktionen des Bots.
    - `remove: true` entfernt ebenfalls Reaktionen, erfordert für die Tool-Validierung aber weiterhin ein nicht leeres `emoji`.

  </Accordion>

  <Accordion title="WhatsApp">
    - Ein leeres `emoji` entfernt die Bot-Reaktion.
    - `remove: true` wird intern auf ein leeres Emoji abgebildet (erfordert weiterhin `emoji` im Tool-Aufruf).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Erfordert ein nicht leeres `emoji`.
    - `remove: true` entfernt diese spezifische Emoji-Reaktion.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Verwenden Sie das `feishu_reaction`-Tool mit den Aktionen `add`, `remove` und `list`.
    - Hinzufügen/Entfernen erfordert `emoji_type`; Entfernen erfordert außerdem `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Eingehende Reaktionsbenachrichtigungen werden über `channels.signal.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standard) gibt Ereignisse aus, wenn Benutzer auf Bot-Nachrichten reagieren, und `"all"` gibt Ereignisse für alle Reaktionen aus.

  </Accordion>
</AccordionGroup>

## Reaktionsstufe

Die kanalbezogene `reactionLevel`-Konfiguration steuert, wie breit der Agent Reaktionen verwendet. Werte sind typischerweise `off`, `ack`, `minimal` oder `extensive`.

- [Telegram reactionLevel](/de/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/de/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Legen Sie `reactionLevel` für einzelne Kanäle fest, um abzustimmen, wie aktiv der Agent auf jeder Plattform auf Nachrichten reagiert.

## Verwandte Themen

- [Agent Send](/de/tools/agent-send) — das `message`-Tool, das `react` enthält
- [Kanäle](/de/channels) — kanalspezifische Konfiguration
