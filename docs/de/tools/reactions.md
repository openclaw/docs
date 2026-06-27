---
read_when:
    - An Reaktionen in jedem Kanal arbeiten
    - Verstehen, wie sich Emoji-Reaktionen plattformübergreifend unterscheiden
summary: Semantik des Reaktionstools über alle unterstützten Kanäle hinweg
title: Reaktionen
x-i18n:
    generated_at: "2026-06-27T18:20:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
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
- Setzen Sie `emoji` auf eine leere Zeichenkette (`""`), um die Reaktion(en) des Bots zu entfernen.
- Setzen Sie `remove: true`, um ein bestimmtes Emoji zu entfernen (erfordert ein nicht leeres `emoji`).
- Auf Kanälen, die Statusreaktionen unterstützen, erlaubt `trackToolCalls: true` bei einer
  Reaktion der Runtime, diese reagierte Nachricht für nachfolgende
  Fortschrittsreaktionen von Tools während desselben Durchlaufs zu verwenden.

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

  <Accordion title="Nextcloud Talk">
    - Nur das Hinzufügen von Reaktionen: `emoji` ist erforderlich und darf nicht leer sein.
    - Das Entfernen von Reaktionen wird noch nicht unterstützt; Aufrufe mit `remove: true` (oder leerem `emoji`) werden mit einem klaren Fehler abgelehnt, statt stillschweigend ohne Wirkung zu bleiben.
    - Erfordert, dass der Talk-Bot mit der Funktion `reaction` registriert ist (siehe [Nextcloud Talk-Kanaldokumentation](/de/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Ein leeres `emoji` entfernt die Reaktionen des Bots.
    - `remove: true` entfernt ebenfalls Reaktionen, erfordert für die Tool-Validierung aber weiterhin ein nicht leeres `emoji`.

  </Accordion>

  <Accordion title="WhatsApp">
    - Ein leeres `emoji` entfernt die Bot-Reaktion.
    - `remove: true` wird intern auf ein leeres Emoji abgebildet (erfordert weiterhin `emoji` im Tool-Aufruf).
    - WhatsApp hat pro Nachricht einen Reaktionsplatz für den Bot; Statusreaktionsaktualisierungen ersetzen diesen Platz, statt mehrere Emojis zu stapeln.

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
    - Eingehende Reaktionsbenachrichtigungen werden über `channels.signal.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standard) gibt Ereignisse aus, wenn Benutzer auf Bot-Nachrichten reagieren, und `"all"` gibt Ereignisse für alle Reaktionen aus.

  </Accordion>

  <Accordion title="iMessage">
    - Ausgehende Reaktionen sind iMessage-Tapbacks (`love`, `like`, `dislike`, `laugh`, `emphasize` und `question`).
    - Eingehende Tapback-Benachrichtigungen werden über `channels.imessage.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standard) gibt Ereignisse aus, wenn Benutzer auf vom Bot verfasste Nachrichten reagieren, und `"all"` gibt Ereignisse für alle Tapbacks von autorisierten Absendern aus.

  </Accordion>
</AccordionGroup>

## Reaktionsstufe

Die kanalspezifische `reactionLevel`-Konfiguration steuert, wie umfassend der Agent Reaktionen verwendet. Werte sind typischerweise `off`, `ack`, `minimal` oder `extensive`.

- [Telegram reactionLevel](/de/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/de/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Legen Sie `reactionLevel` für einzelne Kanäle fest, um abzustimmen, wie aktiv der Agent auf jeder Plattform auf Nachrichten reagiert.

## Verwandte Themen

- [Agent Send](/de/tools/agent-send) — das `message`-Tool, das `react` enthält
- [Kanäle](/de/channels) — kanalspezifische Konfiguration
