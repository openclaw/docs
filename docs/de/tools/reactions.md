---
read_when:
    - Arbeiten an Reaktionen in einem beliebigen Kanal
    - Verstehen, wie sich Emoji-Reaktionen plattformübergreifend unterscheiden
summary: Semantik des Reaktions-Tools über alle unterstützten Kanäle hinweg
title: Reaktionen
x-i18n:
    generated_at: "2026-04-11T02:48:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfac31b7f0effc89cc696e3cf34cd89503ccdbb28996723945025e4b6e159986
    source_path: tools/reactions.md
    workflow: 15
---

# Reaktionen

Der Agent kann mit dem Tool `message` und der Aktion `react` Emoji-Reaktionen zu Nachrichten hinzufügen und entfernen. Das Reaktionsverhalten variiert je nach Kanal.

## Funktionsweise

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` ist beim Hinzufügen einer Reaktion erforderlich.
- Setzen Sie `emoji` auf einen leeren String (`""`), um die Reaktion(en) des Bots zu entfernen.
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
    - `remove: true` entfernt ebenfalls Reaktionen, erfordert aber zur Tool-Validierung weiterhin ein nicht leeres `emoji`.
  </Accordion>

  <Accordion title="WhatsApp">
    - Ein leeres `emoji` entfernt die Bot-Reaktion.
    - `remove: true` wird intern auf ein leeres Emoji abgebildet (erfordert im Tool-Aufruf weiterhin `emoji`).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Erfordert ein nicht leeres `emoji`.
    - `remove: true` entfernt diese spezifische Emoji-Reaktion.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Verwenden Sie das Tool `feishu_reaction` mit den Aktionen `add`, `remove` und `list`.
    - Für add/remove ist `emoji_type` erforderlich; bei remove zusätzlich `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Benachrichtigungen über eingehende Reaktionen werden durch `channels.signal.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standard) gibt Ereignisse aus, wenn Benutzer auf Bot-Nachrichten reagieren, und `"all"` gibt Ereignisse für alle Reaktionen aus.
  </Accordion>
</AccordionGroup>

## Reaktionsstufe

Die kanalbezogene Konfiguration `reactionLevel` steuert, wie umfassend der Agent Reaktionen verwendet. Typische Werte sind `off`, `ack`, `minimal` oder `extensive`.

- [Telegram reactionLevel](/de/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/de/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Setzen Sie `reactionLevel` für einzelne Kanäle, um abzustimmen, wie aktiv der Agent auf jeder Plattform auf Nachrichten reagiert.

## Verwandt

- [Agent Send](/de/tools/agent-send) — das Tool `message`, das `react` einschließt
- [Channels](/de/channels) — kanalspezifische Konfiguration
