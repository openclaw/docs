---
read_when:
    - Refaktorierung der Benutzeroberfläche für Channel-Nachrichten, interaktiver Payloads oder nativer Channel-Renderer
    - Ändern von Funktionen des Nachrichten-Tools, Zustellungshinweisen oder kontextübergreifenden Markierungen
    - Debugging des Discord-Carbon-Import-Fan-outs oder der verzögerten Laufzeitinitialisierung des Channel-Plugins
summary: Entkoppeln Sie die semantische Nachrichtendarstellung von den nativen UI-Renderern der Kanäle.
title: Plan zur Überarbeitung der Kanaldarstellung
x-i18n:
    generated_at: "2026-07-24T03:58:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Implementiert für den gemeinsamen Agenten, die CLI, Plugin-Fähigkeiten und ausgehende Zustellungsoberflächen:

- `ReplyPayload.presentation` überträgt die semantische Nachrichten-UI.
- `ReplyPayload.delivery.pin` überträgt Anfragen zum Anheften gesendeter Nachrichten.
- Gemeinsame Nachrichtenaktionen stellen `presentation`, `delivery` und `pin` statt Provider-nativer `components`, `blocks`, `buttons` oder `card` bereit.
- Der Kern rendert die Darstellung anhand der vom Plugin deklarierten ausgehenden Fähigkeiten oder stuft sie automatisch herab.
- Die Renderer für Discord, Slack, Telegram, Mattermost, MS Teams und Feishu verwenden den generischen Vertrag.
- Der Discord-Control-Plane-Code des Kanals importiert keine Carbon-basierten UI-Container mehr.

Die kanonische Dokumentation befindet sich jetzt unter [Nachrichtendarstellung](/de/plugins/message-presentation).
Bewahren Sie diesen Plan als historischen Implementierungskontext auf; aktualisieren Sie den kanonischen Leitfaden
bei Änderungen am Vertrag, Renderer oder Fallback-Verhalten.

## Problem

Die Kanal-UI ist derzeit auf mehrere inkompatible Oberflächen verteilt:

- Der Kern besitzt über `buildCrossContextComponents` einen Discord-geprägten, kontextübergreifenden Renderer-Hook.
- Discord `channel.ts` kann über `DiscordUiContainer` eine native Carbon-UI importieren, wodurch UI-Laufzeitabhängigkeiten in die Control Plane des Kanal-Plugins gelangen.
- Der Agent und die CLI stellen Schlupflöcher für native Payloads bereit, etwa Discord `components`, Slack `blocks`, Telegram oder Mattermost `buttons` sowie Teams oder Feishu `card`.
- `ReplyPayload.channelData` überträgt sowohl Transporthinweise als auch native UI-Envelopes.
- Das generische Modell `interactive` ist vorhanden, aber weniger umfassend als die bereits von Discord, Slack, Teams, Feishu, LINE, Telegram und Mattermost verwendeten umfangreicheren Layouts.

Dadurch kennt der Kern native UI-Strukturen, die verzögerte Plugin-Laufzeitinitialisierung wird geschwächt und Agenten erhalten zu viele Provider-spezifische Möglichkeiten, dieselbe Nachrichtenabsicht auszudrücken.

## Ziele

- Der Kern bestimmt anhand deklarierter Fähigkeiten die beste semantische Darstellung für eine Nachricht.
- Erweiterungen deklarieren Fähigkeiten und rendern semantische Darstellungen in native Transport-Payloads.
- Die Web Control UI bleibt von der nativen Chat-UI getrennt.
- Native Kanal-Payloads werden nicht über die gemeinsame Nachrichtenoberfläche des Agenten oder der CLI bereitgestellt.
- Nicht unterstützte Darstellungsfunktionen werden automatisch auf die bestmögliche Textdarstellung herabgestuft.
- Zustellungsverhalten wie das Anheften einer gesendeten Nachricht sind generische Zustellungsmetadaten und keine Darstellung.

## Nichtziele

- Kein Abwärtskompatibilitäts-Shim für `buildCrossContextComponents`.
- Keine öffentlichen nativen Schlupflöcher für `components`, `blocks`, `buttons` oder `card`.
- Keine Kernimporte von kanalnativen UI-Bibliotheken.
- Keine Provider-spezifischen SDK-Schnittstellen für gebündelte Kanäle.

## Zielmodell

Fügen Sie `ReplyPayload` ein kerneigenes Feld `presentation` hinzu.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

`interactive` wird während der Migration zu einer Teilmenge von `presentation`:

- Der Textblock `interactive` wird auf `presentation.blocks[].type = "text"` abgebildet.
- Der Schaltflächenblock `interactive` wird auf `presentation.blocks[].type = "buttons"` abgebildet.
- Der Auswahlblock `interactive` wird auf `presentation.blocks[].type = "select"` abgebildet.

Die externen Agenten- und CLI-Schemas verwenden jetzt `presentation`; `interactive` bleibt ein interner Legacy-Helfer zum Parsen und Rendern für bestehende Antwortproduzenten.
Die öffentliche API für Produzenten behandelt `interactive` als veraltet. Die Laufzeitunterstützung
bleibt erhalten, damit bestehende Genehmigungshelfer und ältere Plugins weiterhin
funktionieren, während neuer Code `presentation` ausgibt.

## Zustellungsmetadaten

Fügen Sie für Sendeverhalten, das nicht zur UI gehört, ein kerneigenes Feld `delivery` hinzu.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semantik:

- `delivery.pin = true` bedeutet, die erste erfolgreich zugestellte Nachricht anzuheften.
- `notify` hat standardmäßig den Wert `false`.
- `required` hat standardmäßig den Wert `false`; nicht unterstützte Kanäle oder fehlgeschlagenes Anheften werden durch Fortsetzen der Zustellung automatisch herabgestuft.
- Manuelle Nachrichtenaktionen `pin`, `unpin` und `list-pins` bleiben für bestehende Nachrichten erhalten.

Die aktuelle Bindung von Telegram-ACP-Themen sollte von `channelData.telegram.pin = true` nach `delivery.pin = true` verschoben werden.

## Vertrag für Laufzeitfähigkeiten

Fügen Sie dem ausgehenden Laufzeitadapter Hooks für Darstellung und Zustellung hinzu, nicht dem Control-Plane-Kanal-Plugin.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Kernverhalten:

- Zielkanal und Laufzeitadapter auflösen.
- Darstellungsfähigkeiten abfragen.
- Nicht unterstützte Blöcke herabstufen und vor dem
  Rendern generische Fähigkeitsgrenzen anwenden.
- `renderPresentation` aufrufen.
- Wenn kein Renderer vorhanden ist, die Darstellung in einen Text-Fallback konvertieren.
- Nach erfolgreichem Senden `pinDeliveredMessage` aufrufen, wenn `delivery.pin` angefordert wird und unterstützt ist.

## Kanalzuordnung

Discord:

- `presentation` in laufzeitexklusiven Modulen als Components v2 und Carbon-Container rendern.
- Hilfsfunktionen für Akzentfarben in schlanken Modulen belassen.
- `DiscordUiContainer`-Importe aus dem Control-Plane-Code des Kanal-Plugins entfernen.

Slack:

- `presentation` als Block Kit rendern.
- Die Eingabe `blocks` aus Agent und CLI entfernen.

Telegram:

- Text, Kontext und Trennlinien als Text rendern.
- Aktionen und Auswahlfelder als Inline-Tastaturen rendern, wenn sie konfiguriert und für die Zieloberfläche zulässig sind.
- Text-Fallback verwenden, wenn Inline-Schaltflächen deaktiviert sind.
- Das Anheften von ACP-Themen nach `delivery.pin` verschieben.

Mattermost:

- Aktionen als interaktive Schaltflächen rendern, sofern konfiguriert.
- Andere Blöcke als Text-Fallback rendern.

MS Teams:

- `presentation` als Adaptive Cards rendern.
- Manuelle Aktionen zum Anheften, Lösen und Auflisten angehefteter Nachrichten beibehalten.
- `pinDeliveredMessage` optional implementieren, wenn die Graph-Unterstützung für die Zielkonversation zuverlässig ist.

Feishu:

- `presentation` als interaktive Karten rendern.
- Manuelle Aktionen zum Anheften, Lösen und Auflisten angehefteter Nachrichten beibehalten.
- `pinDeliveredMessage` optional für das Anheften gesendeter Nachrichten implementieren, wenn das API-Verhalten zuverlässig ist.

LINE:

- `presentation` nach Möglichkeit als Flex- oder Vorlagennachrichten rendern.
- Bei nicht unterstützten Blöcken auf Text zurückfallen.
- LINE-UI-Payloads aus `channelData` entfernen.

Einfache oder eingeschränkte Kanäle:

- Die Darstellung mit konservativer Formatierung in Text konvertieren.

## Refactoring-Schritte

1. Den Discord-Release-Fix erneut anwenden, der `ui-colors.ts` von der Carbon-basierten UI trennt und `DiscordUiContainer` aus `extensions/discord/src/channel.ts` entfernt.
2. `presentation` und `delivery` zu `ReplyPayload`, der Normalisierung ausgehender Payloads, Zustellungszusammenfassungen und Hook-Payloads hinzufügen.
3. Das Schema `MessagePresentation` und Parser-Hilfsfunktionen in einem eng begrenzten SDK-/Laufzeit-Unterpfad hinzufügen.
4. Die Nachrichtenfähigkeiten `buttons`, `cards`, `components` und `blocks` durch semantische Darstellungsfähigkeiten ersetzen.
5. Hooks für das Rendern von Darstellungen und das Anheften bei der Zustellung zum ausgehenden Laufzeitadapter hinzufügen.
6. Die kontextübergreifende Komponentenerstellung durch `buildCrossContextPresentation` ersetzen.
7. `src/infra/outbound/channel-adapters.ts` löschen und `buildCrossContextComponents` aus den Kanal-Plugin-Typen entfernen.
8. `maybeApplyCrossContextMarker` so ändern, dass `presentation` statt nativer Parameter angefügt wird.
9. Die Sendepfade der Plugin-Weiterleitung so aktualisieren, dass sie nur semantische Darstellungs- und Zustellungsmetadaten verarbeiten.
10. Native Payload-Parameter aus Agent und CLI entfernen: `components`, `blocks`, `buttons` und `card`.
11. SDK-Hilfsfunktionen entfernen, die native Nachrichtenwerkzeug-Schemas erstellen, und sie durch Hilfsfunktionen für Darstellungsschemas ersetzen.
12. UI-/native Envelopes aus `channelData` entfernen; nur Transportmetadaten beibehalten, bis jedes verbleibende Feld geprüft wurde.
13. Die Renderer für Discord, Slack, Telegram, Mattermost, MS Teams, Feishu und LINE migrieren.
14. Die Dokumentation für die Nachrichten-CLI, Kanalseiten, das Plugin-SDK und das Fähigkeiten-Cookbook aktualisieren.
15. Import-Fan-out-Profiling für Discord und betroffene Kanaleinstiegspunkte ausführen.

Die Schritte 1–11 und 13–14 sind in diesem Refactoring für den gemeinsamen Agenten, die CLI, Plugin-Fähigkeiten und Verträge ausgehender Adapter implementiert. Schritt 12 bleibt ein umfassenderer interner Bereinigungsdurchlauf für Provider-private `channelData`-Transport-Envelopes. Schritt 15 bleibt eine nachgelagerte Validierung, falls quantifizierte Import-Fan-out-Werte über das Typ-/Test-Gate hinaus gewünscht sind.

## Tests

Hinzufügen oder aktualisieren:

- Tests zur Darstellungsnormalisierung.
- Tests zur automatischen Herabstufung der Darstellung bei nicht unterstützten Blöcken.
- Tests für kontextübergreifende Marker bei der Plugin-Weiterleitung und in den Kernzustellungspfaden.
- Tests der Kanal-Renderer-Matrix für Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE und den Text-Fallback.
- Tests des Nachrichtenwerkzeug-Schemas, die nachweisen, dass native Felder entfernt wurden.
- CLI-Tests, die nachweisen, dass native Flags entfernt wurden.
- Regressionstest für die verzögerte Importinitialisierung des Discord-Einstiegspunkts mit Carbon.
- Tests zum Anheften bei der Zustellung für Telegram und den generischen Fallback.

## Offene Fragen

- Sollte `delivery.pin` im ersten Durchlauf für Discord, Slack, Microsoft Teams und Feishu implementiert werden oder zunächst nur für Telegram?
- Sollte `delivery` letztendlich vorhandene Felder wie `replyToId`, `replyToCurrent`, `silent` und `audioAsVoice` übernehmen oder auf Verhaltensweisen nach dem Senden beschränkt bleiben?
- Sollte die Präsentation Bilder oder Dateiverweise direkt unterstützen oder sollten Medien vorerst vom UI-Layout getrennt bleiben?

## Verwandte Themen

- [Kanalübersicht](/de/channels)
- [Nachrichtenpräsentation](/de/plugins/message-presentation)
