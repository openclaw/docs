---
read_when:
    - Refaktorisierung von Channel-Nachrichten-UI, interaktiven Payloads oder nativen Channel-Renderern
    - Ändern von Fähigkeiten des Nachrichtentools, Zustellhinweisen oder kontextübergreifenden Markierungen
    - Debuggen von Discord-Carbon-Import-Fanout oder Runtime-Laziness von Channel-Plugins
summary: Semantische Nachrichtenpräsentation von den nativen UI-Renderern der Channels entkoppeln.
title: Plan zur Refaktorisierung der Channel-Präsentation
x-i18n:
    generated_at: "2026-04-22T04:23:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# Plan zur Refaktorisierung der Channel-Präsentation

## Status

Implementiert für die gemeinsame Agent-, CLI-, Plugin-Fähigkeits- und ausgehenden Zustellungsoberflächen:

- `ReplyPayload.presentation` trägt semantische Nachrichten-UI.
- `ReplyPayload.delivery.pin` trägt Pin-Anfragen für gesendete Nachrichten.
- Gemeinsame Nachrichtenaktionen stellen `presentation`, `delivery` und `pin` statt provider-nativer `components`, `blocks`, `buttons` oder `card` bereit.
- Core rendert oder degradiert Präsentation automatisch über von Plugins deklarierte ausgehende Fähigkeiten.
- Renderer für Discord, Slack, Telegram, Mattermost, Microsoft Teams und Feishu verwenden den generischen Contract.
- Control-Plane-Code des Discord-Channels importiert keine Carbon-basierten UI-Container mehr.

Die kanonische Dokumentation befindet sich jetzt unter [Message Presentation](/de/plugins/message-presentation).
Behalten Sie diesen Plan als historischen Implementierungskontext; aktualisieren Sie den kanonischen Leitfaden bei Änderungen an Contract, Renderer oder Fallback-Verhalten.

## Problem

Die Channel-UI ist derzeit über mehrere inkompatible Oberflächen verteilt:

- Core besitzt einen Discord-geprägten Hook für kontextübergreifendes Rendering über `buildCrossContextComponents`.
- Discord `channel.ts` kann native Carbon-UI über `DiscordUiContainer` importieren, was Runtime-UI-Abhängigkeiten in die Control Plane des Channel-Plugins zieht.
- Agent und CLI stellen native Payload-Escape-Hatches wie Discord-`components`, Slack-`blocks`, Telegram- oder Mattermost-`buttons` sowie Teams- oder Feishu-`card` bereit.
- `ReplyPayload.channelData` trägt sowohl Transporthinweise als auch native UI-Envelope-Strukturen.
- Das generische `interactive`-Modell existiert, ist aber enger als die reicheren Layouts, die bereits von Discord, Slack, Teams, Feishu, LINE, Telegram und Mattermost verwendet werden.

Dadurch kennt Core native UI-Formen, die Runtime-Laziness von Plugins wird geschwächt, und Agenten erhalten zu viele provider-spezifische Möglichkeiten, dieselbe Nachrichtenabsicht auszudrücken.

## Ziele

- Core entscheidet anhand deklarierter Fähigkeiten über die beste semantische Präsentation für eine Nachricht.
- Extensions deklarieren Fähigkeiten und rendern semantische Präsentation in native Transport-Payloads.
- Web Control UI bleibt von nativer Chat-UI getrennt.
- Native Channel-Payloads werden nicht über die gemeinsame Agent- oder CLI-Nachrichtenoberfläche bereitgestellt.
- Nicht unterstützte Präsentationsfunktionen werden automatisch zur besten Textdarstellung degradiert.
- Zustellverhalten wie das Pinnen einer gesendeten Nachricht ist generische Zustellmetadaten, keine Präsentation.

## Nicht-Ziele

- Kein Abwärtskompatibilitäts-Shim für `buildCrossContextComponents`.
- Keine öffentlichen nativen Escape-Hatches für `components`, `blocks`, `buttons` oder `card`.
- Keine Core-Importe von Channel-nativen UI-Bibliotheken.
- Keine provider-spezifischen SDK-Seams für gebündelte Channels.

## Zielmodell

Fügen Sie ein Core-eigenes Feld `presentation` zu `ReplyPayload` hinzu.

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

- `interactive`-Textblock wird auf `presentation.blocks[].type = "text"` abgebildet.
- `interactive`-Buttons-Block wird auf `presentation.blocks[].type = "buttons"` abgebildet.
- `interactive`-Select-Block wird auf `presentation.blocks[].type = "select"` abgebildet.

Die externen Agent- und CLI-Schemas verwenden nun `presentation`; `interactive` bleibt ein interner Legacy-Parser-/Rendering-Helfer für bestehende Reply-Produzenten.

## Zustellmetadaten

Fügen Sie ein Core-eigenes Feld `delivery` für Sendeverhalten hinzu, das keine UI ist.

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

- `delivery.pin = true` bedeutet, die erste erfolgreich zugestellte Nachricht zu pinnen.
- `notify` ist standardmäßig `false`.
- `required` ist standardmäßig `false`; nicht unterstützte Channels oder fehlgeschlagenes Pinnen degradieren automatisch, indem die Zustellung fortgesetzt wird.
- Manuelle Nachrichtenaktionen `pin`, `unpin` und `list-pins` bleiben für bestehende Nachrichten erhalten.

Die aktuelle Telegram-ACP-Topic-Bindung sollte von `channelData.telegram.pin = true` auf `delivery.pin = true` umgestellt werden.

## Runtime-Fähigkeits-Contract

Fügen Sie Präsentations- und Zustell-Render-Hooks dem ausgehenden Runtime-Adapter hinzu, nicht dem Control-Plane-Channel-Plugin.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

Core-Verhalten:

- Ziel-Channel und Runtime-Adapter auflösen.
- Präsentationsfähigkeiten abfragen.
- Nicht unterstützte Blöcke vor dem Rendering degradieren.
- `renderPresentation` aufrufen.
- Wenn kein Renderer existiert, Präsentation in Text-Fallback umwandeln.
- Nach erfolgreichem Senden `pinDeliveredMessage` aufrufen, wenn `delivery.pin` angefordert und unterstützt wird.

## Channel-Zuordnung

Discord:

- `presentation` in Components v2 und Carbon-Container in Runtime-only-Modulen rendern.
- Hilfsfunktionen für Akzentfarben in leichten Modulen behalten.
- `DiscordUiContainer`-Importe aus dem Control-Plane-Code des Channel-Plugins entfernen.

Slack:

- `presentation` in Block Kit rendern.
- `blocks`-Eingabe aus Agent und CLI entfernen.

Telegram:

- Text, Context und Divider als Text rendern.
- Actions und Select als Inline-Keyboards rendern, wenn konfiguriert und für die Zielfläche erlaubt.
- Text-Fallback verwenden, wenn Inline-Buttons deaktiviert sind.
- ACP-Topic-Pinning zu `delivery.pin` verschieben.

Mattermost:

- Actions dort, wo konfiguriert, als interaktive Buttons rendern.
- Andere Blöcke als Text-Fallback rendern.

Microsoft Teams:

- `presentation` in Adaptive Cards rendern.
- Manuelle Aktionen `pin`/`unpin`/`list-pins` beibehalten.
- `pinDeliveredMessage` optional implementieren, wenn Graph-Unterstützung für die Zielunterhaltung zuverlässig ist.

Feishu:

- `presentation` in interaktive Karten rendern.
- Manuelle Aktionen `pin`/`unpin`/`list-pins` beibehalten.
- `pinDeliveredMessage` für das Pinnen gesendeter Nachrichten optional implementieren, wenn das API-Verhalten zuverlässig ist.

LINE:

- `presentation` nach Möglichkeit in Flex- oder Vorlagennachrichten rendern.
- Für nicht unterstützte Blöcke auf Text zurückfallen.
- LINE-UI-Payloads aus `channelData` entfernen.

Einfache oder eingeschränkte Channels:

- Präsentation mit konservativer Formatierung in Text umwandeln.

## Refaktorisierungsschritte

1. Den Discord-Release-Fix erneut anwenden, der `ui-colors.ts` von Carbon-basierter UI trennt und `DiscordUiContainer` aus `extensions/discord/src/channel.ts` entfernt.
2. `presentation` und `delivery` zu `ReplyPayload`, zur ausgehenden Payload-Normalisierung, zu Zustellungszusammenfassungen und zu Hook-Payloads hinzufügen.
3. `MessagePresentation`-Schema und Parser-Helfer in einem schmalen SDK-/Runtime-Unterpfad hinzufügen.
4. Nachrichtenfähigkeiten `buttons`, `cards`, `components` und `blocks` durch semantische Präsentationsfähigkeiten ersetzen.
5. Runtime-Hooks des ausgehenden Adapters für Präsentations-Rendering und Delivery-Pinning hinzufügen.
6. Konstruktion kontextübergreifender Components durch `buildCrossContextPresentation` ersetzen.
7. `src/infra/outbound/channel-adapters.ts` löschen und `buildCrossContextComponents` aus den Typen der Channel-Plugins entfernen.
8. `maybeApplyCrossContextMarker` so ändern, dass `presentation` statt nativer Parameter angehängt wird.
9. Sendewege des Plugin-Dispatch aktualisieren, damit nur semantische Präsentation und Zustellmetadaten verwendet werden.
10. Native Payload-Parameter aus Agent und CLI entfernen: `components`, `blocks`, `buttons` und `card`.
11. SDK-Helfer entfernen, die native Message-Tool-Schemas erzeugen, und sie durch Helfer für Präsentationsschemas ersetzen.
12. UI-/native Envelope-Strukturen aus `channelData` entfernen; nur Transportmetadaten behalten, bis jedes verbleibende Feld geprüft wurde.
13. Renderer für Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu und LINE migrieren.
14. Docs für Nachrichten-CLI, Channel-Seiten, Plugin SDK und Capability-Cookbook aktualisieren.
15. Import-Fanout-Profiling für Discord und betroffene Channel-Entrypoints ausführen.

Schritte 1–11 und 13–14 sind in dieser Refaktorisierung für die gemeinsame Agent-, CLI-, Plugin-Fähigkeits- und Outbound-Adapter-Contracts implementiert. Schritt 12 bleibt ein tieferer interner Cleanup-Durchgang für provider-private `channelData`-Transport-Envelope-Strukturen. Schritt 15 bleibt eine nachgelagerte Validierung, wenn wir über das Type-/Test-Gate hinaus quantifizierte Import-Fanout-Zahlen möchten.

## Tests

Hinzuzufügen oder zu aktualisieren:

- Tests zur Präsentationsnormalisierung.
- Tests zur automatischen Präsentationsdegradierung für nicht unterstützte Blöcke.
- Tests für kontextübergreifende Marker für Plugin-Dispatch- und Core-Delivery-Pfade.
- Tests der Channel-Render-Matrix für Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE und Text-Fallback.
- Tests für das Message-Tool-Schema, die belegen, dass native Felder entfernt sind.
- CLI-Tests, die belegen, dass native Flags entfernt sind.
- Regressionstest zur Import-Laziness des Discord-Entrypoints mit Abdeckung für Carbon.
- Delivery-Pin-Tests für Telegram und generischen Fallback.

## Offene Fragen

- Soll `delivery.pin` im ersten Durchgang für Discord, Slack, Microsoft Teams und Feishu implementiert werden oder zunächst nur für Telegram?
- Soll `delivery` künftig bestehende Felder wie `replyToId`, `replyToCurrent`, `silent` und `audioAsVoice` aufnehmen oder auf Verhaltensweisen nach dem Senden fokussiert bleiben?
- Soll Präsentation Bilder oder Dateireferenzen direkt unterstützen oder sollen Medien vorerst von UI-Layout getrennt bleiben?
