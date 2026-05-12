---
read_when:
    - Mit Reaktionen in jedem Kanal arbeiten
    - Verstehen, wie sich Emoji-Reaktionen zwischen Plattformen unterscheiden
summary: Semantik des Reaktions-Tools über alle unterstützten Kanäle hinweg
title: Reaktionen
x-i18n:
    generated_at: "2026-05-12T01:01:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

Der Agent kann Emoji-Reaktionen zu Nachrichten mit dem `message`-Tool und der Aktion `react` hinzufügen und entfernen. Das Reaktionsverhalten variiert je nach Kanal und Transport.

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
- Auf Kanälen, die Statusreaktionen unterstützen, erlaubt `trackToolCalls: true` bei einer Reaktion der Runtime, diese reagierte Nachricht für nachfolgende Fortschrittsreaktionen von Tools während desselben Turns zu verwenden.

## Kanalverhalten

<AccordionGroup>
  <Accordion title="Discord und Slack">
    - Ein leeres `emoji` entfernt alle Reaktionen des Bots auf der Nachricht.
    - `remove: true` entfernt nur das angegebene Emoji.

  </Accordion>

  <Accordion title="Google Chat">
    - Ein leeres `emoji` entfernt die Reaktionen der App auf der Nachricht.
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
    - `remove: true` entfernt diese bestimmte Emoji-Reaktion.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Verwenden Sie das Tool `feishu_reaction` mit den Aktionen `add`, `remove` und `list`.
    - Hinzufügen/Entfernen erfordert `emoji_type`; Entfernen erfordert zusätzlich `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Benachrichtigungen über eingehende Reaktionen werden durch `channels.signal.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standard) gibt Ereignisse aus, wenn Benutzer auf Bot-Nachrichten reagieren, und `"all"` gibt Ereignisse für alle Reaktionen aus.

  </Accordion>

  <Accordion title="iMessage">
    - Ausgehende Reaktionen sind iMessage-Tapbacks (`love`, `like`, `dislike`, `laugh`, `emphasize` und `question`).
    - Benachrichtigungen über eingehende Tapbacks werden durch `channels.imessage.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standard) gibt Ereignisse aus, wenn Benutzer auf vom Bot verfasste Nachrichten reagieren, und `"all"` gibt Ereignisse für alle Tapbacks von autorisierten Absendern aus.

  </Accordion>
</AccordionGroup>

## Reaktionsstufe

Die kanalbezogene Konfiguration `reactionLevel` steuert, wie umfassend der Agent Reaktionen verwendet. Werte sind typischerweise `off`, `ack`, `minimal` oder `extensive`.

- [Telegram reactionLevel](/de/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/de/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Setzen Sie `reactionLevel` auf einzelnen Kanälen, um abzustimmen, wie aktiv der Agent auf Nachrichten auf der jeweiligen Plattform reagiert.

## Verwandte Themen

- [Agentenversand](/de/tools/agent-send) — das `message`-Tool, das `react` enthält
- [Kanäle](/de/channels) — kanalspezifische Konfiguration
