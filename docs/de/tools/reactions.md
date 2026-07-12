---
read_when:
    - Arbeiten mit Reaktionen in jedem Kanal
    - Verstehen, wie sich Emoji-Reaktionen je nach Plattform unterscheiden
summary: Semantik des Reaktionswerkzeugs in allen unterstützten Kanälen
title: Reaktionen
x-i18n:
    generated_at: "2026-07-12T02:15:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

Der Agent fügt mit der Aktion `react` des Tools `message` Emoji-Reaktionen hinzu und entfernt sie. Das Verhalten variiert je nach Kanal.

## Funktionsweise

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Beim Hinzufügen einer Reaktion ist `emoji` erforderlich.
- Setzen Sie `emoji` auf eine leere Zeichenfolge (`""`), um die Reaktion(en) des Bots auf Kanälen zu entfernen, die dies unterstützen.
- Setzen Sie `remove: true`, um ein bestimmtes Emoji zu entfernen (erfordert ein nicht leeres `emoji`).
- Auf Kanälen mit Statusreaktionen ermöglicht `trackToolCalls: true` bei einer Reaktion, dass die Laufzeitumgebung diese mit einer Reaktion versehene Nachricht für nachfolgende Reaktionen zum Werkzeugfortschritt während desselben Durchlaufs wiederverwendet.

## Verhalten der Kanäle

<AccordionGroup>
  <Accordion title="Discord und Slack">
    - Ein leeres `emoji` entfernt alle Reaktionen des Bots auf die Nachricht.
    - `remove: true` entfernt nur das angegebene Emoji.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Nur das Hinzufügen von Reaktionen wird unterstützt: `emoji` ist erforderlich und darf nicht leer sein.
    - Das Entfernen von Reaktionen ist noch nicht mit einem Löschaufruf verknüpft; `remove: true` wird mit einem ausdrücklichen Fehler abgelehnt, statt ohne Wirkung zu bleiben.
    - Erfordert, dass der Talk-Bot mit der Funktion `reaction` registriert ist (siehe [Dokumentation zum Nextcloud-Talk-Kanal](/de/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Ein leeres `emoji` entfernt die Reaktionen des Bots.
    - `remove: true` entfernt ebenfalls Reaktionen, erfordert für die Werkzeugvalidierung jedoch weiterhin ein nicht leeres `emoji`.

  </Accordion>

  <Accordion title="WhatsApp">
    - Ein leeres `emoji` entfernt die Bot-Reaktion.
    - `remove: true` wird intern einem leeren Emoji zugeordnet (im Werkzeugaufruf ist `emoji` weiterhin erforderlich).
    - WhatsApp verfügt pro Nachricht über einen Reaktionsplatz für den Bot; das Senden einer neuen Reaktion ersetzt die vorhandene, statt mehrere Emojis zu stapeln.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Erfordert sowohl zum Hinzufügen als auch zum Entfernen ein nicht leeres `emoji`.
    - `remove: true` entfernt diese spezifische Emoji-Reaktion.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Verwendet dieselbe Aktion `react` wie andere Kanäle (Hinzufügen, Entfernen und Auflisten über Nachrichtenreaktions-IDs), kein separates Tool.
    - Das Hinzufügen erfordert ein nicht leeres `emoji` (wird einem Feishu-`emoji_type` zugeordnet, z. B. `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true` erfordert ein nicht leeres `emoji` und entfernt die eigene Reaktion des Bots, die diesem Emoji-Typ entspricht.
    - Ein leeres `emoji` mit `clearAll: true` entfernt alle Reaktionen des Bots auf die Nachricht.

  </Accordion>

  <Accordion title="Signal">
    - Benachrichtigungen über eingehende Reaktionen werden durch `channels.signal.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standardwert) erzeugt Ereignisse, wenn Benutzer auf Bot-Nachrichten reagieren, `"all"` erzeugt Ereignisse für alle Reaktionen und `"allowlist"` erzeugt Ereignisse nur für Absender in `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - Ausgehende Reaktionen sind iMessage-Tapbacks (`love`, `like`, `dislike`, `laugh`, `emphasize` und `question`); zum Hinzufügen einer Reaktion muss `emoji` einem dieser Typen zugeordnet werden können.
    - `remove: true` ohne einen erkannten Tapback-Typ entfernt alle Tapback-Typen; mit einem erkannten Typ wird nur dieser entfernt.

  </Accordion>
</AccordionGroup>

## Reaktionsstufe

Die kanalspezifische Einstellung `reactionLevel` begrenzt, wie häufig der Agent eigene Reaktionen sendet. Werte: `off`, `ack`, `minimal` oder `extensive`.

- [Telegram-Reaktionsbenachrichtigungen](/de/channels/telegram#feature-reference) – `channels.telegram.reactionLevel` (Standardwert: `minimal`)
- [WhatsApp-Reaktionsstufe](/de/channels/whatsapp#reaction-level) – `channels.whatsapp.reactionLevel` (Standardwert: `minimal`)
- [Signal-Reaktionen](/de/channels/signal#reactions-message-tool) – `channels.signal.reactionLevel` (Standardwert: `minimal`)

## Verwandte Themen

- [Agentenversand](/de/tools/agent-send) – das Tool `message`, das `react` enthält
- [Kanäle](/de/channels) – kanalspezifische Konfiguration
