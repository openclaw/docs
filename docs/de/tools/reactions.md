---
read_when:
    - An Reaktionen in einem beliebigen Kanal arbeiten
    - Verstehen, wie sich Emoji-Reaktionen zwischen Plattformen unterscheiden
summary: Semantik des Reaktions-Tools über alle unterstützten Kanäle hinweg
title: Reaktionen
x-i18n:
    generated_at: "2026-04-24T07:04:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

Der Agent kann Emoji-Reaktionen zu Nachrichten hinzufügen und entfernen, indem er das Tool `message`
mit der Aktion `react` verwendet. Das Verhalten von Reaktionen variiert je nach Kanal.

## Funktionsweise

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` ist beim Hinzufügen einer Reaktion erforderlich.
- Setzen Sie `emoji` auf eine leere Zeichenfolge (`""`), um die Reaktion(en) des Bots zu entfernen.
- Setzen Sie `remove: true`, um ein bestimmtes Emoji zu entfernen (erfordert nicht-leeres `emoji`).

## Verhalten pro Kanal

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
    - `remove: true` entfernt ebenfalls Reaktionen, erfordert aber für die Tool-Validierung weiterhin ein nicht-leeres `emoji`.

  </Accordion>

  <Accordion title="WhatsApp">
    - Ein leeres `emoji` entfernt die Reaktion des Bots.
    - `remove: true` wird intern auf ein leeres Emoji abgebildet (erfordert im Tool-Aufruf weiterhin `emoji`).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Erfordert ein nicht-leeres `emoji`.
    - `remove: true` entfernt diese spezifische Emoji-Reaktion.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Verwenden Sie das Tool `feishu_reaction` mit den Aktionen `add`, `remove` und `list`.
    - Hinzufügen/Entfernen erfordert `emoji_type`; Entfernen erfordert zusätzlich `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Benachrichtigungen über eingehende Reaktionen werden über `channels.signal.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standard) erzeugt Ereignisse, wenn Benutzer auf Bot-Nachrichten reagieren, und `"all"` erzeugt Ereignisse für alle Reaktionen.

  </Accordion>
</AccordionGroup>

## Reaktionsstufe

Die kanalspezifische Konfiguration `reactionLevel` steuert, wie breit der Agent Reaktionen verwendet. Typische Werte sind `off`, `ack`, `minimal` oder `extensive`.

- [Telegram reactionLevel](/de/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/de/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Setzen Sie `reactionLevel` für einzelne Kanäle, um abzustimmen, wie aktiv der Agent auf jeder Plattform auf Nachrichten reagiert.

## Verwandt

- [Agent Send](/de/tools/agent-send) — das Tool `message`, das `react` enthält
- [Channels](/de/channels) — kanalspezifische Konfiguration
