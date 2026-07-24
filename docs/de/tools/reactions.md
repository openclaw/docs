---
read_when:
    - Reaktionen in jedem Kanal verwenden
    - Verstehen, wie sich Emoji-Reaktionen je nach Plattform unterscheiden
summary: Semantik des Reaktionstools über alle unterstützten Kanäle hinweg
title: Reaktionen
x-i18n:
    generated_at: "2026-07-24T04:14:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

Der Agent fügt mit der Aktion `react` des Tools `message` Emoji-Reaktionen hinzu und entfernt sie.
Das Verhalten variiert je nach Kanal.

## Funktionsweise

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` ist beim Hinzufügen einer Reaktion erforderlich.
- Setzen Sie `emoji` auf eine leere Zeichenfolge (`""`), um die Reaktion(en) des Bots auf
  Kanälen zu entfernen, die dies unterstützen.
- Setzen Sie `remove: true`, um ein bestimmtes Emoji zu entfernen (erfordert einen nicht leeren Wert für
  `emoji`).
- Bei Kanälen mit Statusreaktionen ermöglicht `trackToolCalls: true` für eine Reaktion
  der Laufzeit, diese mit einer Reaktion versehene Nachricht für nachfolgende Reaktionen zum Tool-Fortschritt
  während desselben Durchlaufs wiederzuverwenden.

## Verhalten der Kanäle

<AccordionGroup>
  <Accordion title="Discord und Slack">
    - Ein leerer Wert für `emoji` entfernt alle Reaktionen des Bots auf die Nachricht.
    - `remove: true` entfernt nur das angegebene Emoji.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Nur Hinzufügen von Reaktionen: `emoji` ist erforderlich und darf nicht leer sein.
    - Das Entfernen von Reaktionen ist noch nicht mit einem Löschaufruf verknüpft; `remove: true` wird stattdessen mit einem expliziten Fehler abgelehnt, anstatt wirkungslos zu bleiben.
    - Erfordert, dass der Talk-Bot mit der Funktion `reaction` registriert ist (siehe [Dokumentation zum Nextcloud-Talk-Kanal](/de/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Ein leerer Wert für `emoji` entfernt die Reaktionen des Bots.
    - `remove: true` entfernt ebenfalls Reaktionen, erfordert für die Tool-Validierung jedoch weiterhin einen nicht leeren Wert für `emoji`.

  </Accordion>

  <Accordion title="WhatsApp">
    - Ein leerer Wert für `emoji` entfernt die Bot-Reaktion.
    - `remove: true` wird intern einem leeren Emoji zugeordnet (erfordert im Tool-Aufruf weiterhin `emoji`).
    - WhatsApp verfügt pro Nachricht über einen Bot-Reaktionsplatz; eine neue Reaktion ersetzt die vorhandene, anstatt mehrere Emojis zu stapeln.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Erfordert sowohl beim Hinzufügen als auch beim Entfernen einen nicht leeren Wert für `emoji`.
    - `remove: true` entfernt diese bestimmte Emoji-Reaktion.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Verwendet dieselbe Aktion `react` wie andere Kanäle (Hinzufügen/Entfernen/Auflisten über Nachrichtenreaktions-IDs) und kein separates Tool.
    - Das Hinzufügen erfordert einen nicht leeren Wert für `emoji` (wird einem Feishu-`emoji_type` zugeordnet, z. B. `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true` erfordert einen nicht leeren Wert für `emoji` und entfernt die eigene Reaktion des Bots, die diesem Emoji-Typ entspricht.
    - Ein leerer Wert für `emoji` mit `clearAll: true` entfernt alle Reaktionen des Bots auf die Nachricht.

  </Accordion>

  <Accordion title="Signal">
    - Benachrichtigungen über eingehende Reaktionen werden durch `channels.signal.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standard) erzeugt Ereignisse, wenn Benutzer auf Bot-Nachrichten reagieren, `"all"` erzeugt Ereignisse für alle Reaktionen und `"allowlist"` erzeugt Ereignisse nur für Absender in `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - Ausgehende Reaktionen sind iMessage-Tapbacks (`love`, `like`, `dislike`, `laugh`, `emphasize` und `question`); `emoji` muss einem dieser Typen zugeordnet werden, um eine Reaktion hinzuzufügen.
    - `remove: true` ohne erkannten Tapback-Typ entfernt alle Tapback-Typen; mit einem erkannten Typ wird nur dieser entfernt.

  </Accordion>
</AccordionGroup>

## Reaktionsstufe

Die kanalspezifische Einstellung `reactionLevel` begrenzt, wie häufig der Agent eigene
Reaktionen sendet. Werte: `off`, `ack`, `minimal` oder `extensive`.

- [Telegram-Reaktionsbenachrichtigungen](/de/channels/telegram#feature-reference) – `channels.telegram.reactionLevel` (Standard: `minimal`)
- [WhatsApp-Reaktionsstufe](/de/channels/whatsapp#reaction-level) – `channels.whatsapp.reactionLevel` (Standard: `minimal`)
- [Signal-Reaktionen](/de/channels/signal#reactions-message-tool) – `channels.signal.reactionLevel` (Standard: `minimal`)

## Verwandte Themen

- [Agent Send](/de/tools/agent-send) – das Tool `message`, das `react` enthält
- [Kanäle](/de/channels) – kanalspezifische Konfiguration
