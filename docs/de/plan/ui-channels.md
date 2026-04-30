---
read_when:
    - Refaktorierung der UI für Kanalnachrichten, interaktiver Payloads oder nativer Kanal-Renderer
    - Ändern von Nachrichten-Tool-Fähigkeiten, Zustellungshinweisen oder kontextübergreifenden Markern
    - Fehlersuche beim Import-Fanout von Discord Carbon oder beim verzögerten Laden des Kanal-Plugins zur Laufzeit
summary: Semantische Nachrichtendarstellung von den kanaleigenen UI-Renderern entkoppeln.
title: Plan zur Refaktorierung der Kanaldarstellung
x-i18n:
    generated_at: "2026-04-30T07:02:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Implementiert für die Oberflächen des gemeinsamen Agents, der CLI, der Plugin-Fähigkeiten und der ausgehenden Zustellung:

- `ReplyPayload.presentation` transportiert semantische Nachrichten-UI.
- `ReplyPayload.delivery.pin` transportiert Anforderungen zum Anheften gesendeter Nachrichten.
- Gemeinsame Nachrichtenaktionen legen `presentation`, `delivery` und `pin` offen statt Provider-nativer `components`, `blocks`, `buttons` oder `card`.
- Der Core rendert oder reduziert Presentation automatisch anhand der vom Plugin deklarierten ausgehenden Fähigkeiten.
- Renderer für Discord, Slack, Telegram, Mattermost, MS Teams und Feishu nutzen den generischen Vertrag.
- Der Control-Plane-Code des Discord-Kanals importiert keine Carbon-gestützten UI-Container mehr.

Die kanonischen Docs befinden sich jetzt in [Nachrichten-Presentation](/de/plugins/message-presentation).
Behalten Sie diesen Plan als historischen Implementierungskontext bei; aktualisieren Sie den kanonischen Leitfaden
bei Änderungen am Vertrag, Renderer- oder Fallback-Verhalten.

## Problem

Kanal-UI ist derzeit auf mehrere inkompatible Oberflächen verteilt:

- Der Core besitzt über `buildCrossContextComponents` einen Discord-förmigen Renderer-Hook für kontextübergreifende Nutzung.
- Discord `channel.ts` kann native Carbon-UI über `DiscordUiContainer` importieren, wodurch UI-Laufzeitabhängigkeiten in die Control Plane des Kanal-Plugins gezogen werden.
- Agent und CLI legen native Payload-Ausweichmechanismen offen, etwa Discord `components`, Slack `blocks`, Telegram- oder Mattermost-`buttons` sowie Teams- oder Feishu-`card`.
- `ReplyPayload.channelData` transportiert sowohl Transporthinweise als auch native UI-Umschläge.
- Das generische `interactive`-Modell existiert, ist aber enger als die reicheren Layouts, die bereits von Discord, Slack, Teams, Feishu, LINE, Telegram und Mattermost verwendet werden.

Dadurch kennt der Core native UI-Formen, die Laufzeit-Laziness von Plugins wird geschwächt, und Agents erhalten zu viele Provider-spezifische Wege, dieselbe Nachrichtenabsicht auszudrücken.

## Ziele

- Der Core entscheidet anhand deklarierter Fähigkeiten über die beste semantische Presentation für eine Nachricht.
- Erweiterungen deklarieren Fähigkeiten und rendern semantische Presentation in native Transport-Payloads.
- Die Web-Control-UI bleibt von nativer Chat-UI getrennt.
- Native Kanal-Payloads werden nicht über die gemeinsame Nachrichtenoberfläche von Agent oder CLI offengelegt.
- Nicht unterstützte Presentation-Funktionen werden automatisch auf die beste Textdarstellung reduziert.
- Zustellverhalten wie das Anheften einer gesendeten Nachricht ist generische Zustellmetadaten, nicht Presentation.

## Nichtziele

- Kein Abwärtskompatibilitäts-Shim für `buildCrossContextComponents`.
- Keine öffentlichen nativen Ausweichmechanismen für `components`, `blocks`, `buttons` oder `card`.
- Keine Core-Importe von kanalnativen UI-Bibliotheken.
- Keine Provider-spezifischen SDK-Schnittstellen für gebündelte Kanäle.

## Zielmodell

Fügen Sie `ReplyPayload` ein Core-eigenes Feld `presentation` hinzu.

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

- Der `interactive`-Textblock wird auf `presentation.blocks[].type = "text"` abgebildet.
- Der `interactive`-Button-Block wird auf `presentation.blocks[].type = "buttons"` abgebildet.
- Der `interactive`-Select-Block wird auf `presentation.blocks[].type = "select"` abgebildet.

Die externen Agent- und CLI-Schemas verwenden jetzt `presentation`; `interactive` bleibt ein interner Legacy-Parser- und Rendering-Helfer für bestehende Antwort-Produzenten.

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

- `delivery.pin = true` bedeutet, die erste erfolgreich zugestellte Nachricht anzuheften.
- `notify` ist standardmäßig `false`.
- `required` ist standardmäßig `false`; nicht unterstützte Kanäle oder fehlgeschlagenes Anheften werden automatisch reduziert, indem die Zustellung fortgesetzt wird.
- Manuelle Nachrichtenaktionen `pin`, `unpin` und `list-pins` bleiben für bestehende Nachrichten erhalten.

Die aktuelle Telegram-ACP-Themenbindung sollte von `channelData.telegram.pin = true` zu `delivery.pin = true` verschoben werden.

## Laufzeit-Fähigkeitsvertrag

Fügen Sie Presentation- und Zustell-Render-Hooks zum ausgehenden Laufzeitadapter hinzu, nicht zum Control-Plane-Kanal-Plugin.

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

- Zielkanal und Laufzeitadapter auflösen.
- Presentation-Fähigkeiten abfragen.
- Nicht unterstützte Blöcke vor dem Rendering reduzieren.
- `renderPresentation` aufrufen.
- Wenn kein Renderer vorhanden ist, Presentation in einen Text-Fallback umwandeln.
- Nach erfolgreichem Senden `pinDeliveredMessage` aufrufen, wenn `delivery.pin` angefordert und unterstützt wird.

## Kanalzuordnung

Discord:

- `presentation` in Runtime-only-Modulen zu Komponenten v2 und Carbon-Containern rendern.
- Akzentfarben-Helfer in leichten Modulen behalten.
- `DiscordUiContainer`-Importe aus dem Control-Plane-Code des Kanal-Plugins entfernen.

Slack:

- `presentation` zu Block Kit rendern.
- Agent- und CLI-`blocks`-Eingabe entfernen.

Telegram:

- Text, Kontext und Trenner als Text rendern.
- Aktionen und Select als Inline-Keyboards rendern, wenn sie konfiguriert und für die Zieloberfläche erlaubt sind.
- Text-Fallback verwenden, wenn Inline-Buttons deaktiviert sind.
- ACP-Themen-Anheftung zu `delivery.pin` verschieben.

Mattermost:

- Aktionen als interaktive Buttons rendern, sofern konfiguriert.
- Andere Blöcke als Text-Fallback rendern.

MS Teams:

- `presentation` zu Adaptive Cards rendern.
- Manuelle Aktionen zum Anheften, Lösen und Auflisten angehefteter Nachrichten behalten.
- Optional `pinDeliveredMessage` implementieren, wenn Graph-Unterstützung für die Zielunterhaltung zuverlässig ist.

Feishu:

- `presentation` zu interaktiven Karten rendern.
- Manuelle Aktionen zum Anheften, Lösen und Auflisten angehefteter Nachrichten behalten.
- Optional `pinDeliveredMessage` für das Anheften gesendeter Nachrichten implementieren, wenn das API-Verhalten zuverlässig ist.

LINE:

- `presentation` nach Möglichkeit zu Flex- oder Vorlagennachrichten rendern.
- Für nicht unterstützte Blöcke auf Text zurückfallen.
- LINE-UI-Payloads aus `channelData` entfernen.

Einfache oder eingeschränkte Kanäle:

- Presentation mit konservativer Formatierung in Text umwandeln.

## Refaktorierungsschritte

1. Den Discord-Release-Fix erneut anwenden, der `ui-colors.ts` von Carbon-gestützter UI trennt und `DiscordUiContainer` aus `extensions/discord/src/channel.ts` entfernt.
2. `presentation` und `delivery` zu `ReplyPayload`, ausgehender Payload-Normalisierung, Zustellzusammenfassungen und Hook-Payloads hinzufügen.
3. `MessagePresentation`-Schema und Parser-Helfer in einem schmalen SDK-/Runtime-Unterpfad hinzufügen.
4. Nachrichtenfähigkeiten `buttons`, `cards`, `components` und `blocks` durch semantische Presentation-Fähigkeiten ersetzen.
5. Hooks für ausgehende Runtime-Adapter für Presentation-Rendering und Zustell-Anheftung hinzufügen.
6. Kontexübergreifende Komponentenkonstruktion durch `buildCrossContextPresentation` ersetzen.
7. `src/infra/outbound/channel-adapters.ts` löschen und `buildCrossContextComponents` aus Kanal-Plugin-Typen entfernen.
8. `maybeApplyCrossContextMarker` so ändern, dass `presentation` statt nativer Parameter angehängt wird.
9. Sendepfade von Plugin-Dispatch aktualisieren, sodass sie nur semantische Presentation und Zustellmetadaten verwenden.
10. Native Payload-Parameter aus Agent und CLI entfernen: `components`, `blocks`, `buttons` und `card`.
11. SDK-Helfer entfernen, die native Nachrichtenwerkzeug-Schemas erstellen, und durch Presentation-Schema-Helfer ersetzen.
12. UI-/native Umschläge aus `channelData` entfernen; nur Transportmetadaten behalten, bis jedes verbleibende Feld überprüft wurde.
13. Renderer für Discord, Slack, Telegram, Mattermost, MS Teams, Feishu und LINE migrieren.
14. Docs für Nachrichten-CLI, Kanalseiten, Plugin-SDK und Fähigkeiten-Cookbook aktualisieren.
15. Import-Fanout-Profiling für Discord und betroffene Kanal-Einstiegspunkte ausführen.

Schritte 1-11 und 13-14 sind in dieser Refaktorierung für den gemeinsamen Agent, die CLI, Plugin-Fähigkeiten und ausgehende Adapterverträge implementiert. Schritt 12 bleibt ein tiefergehender interner Cleanup-Durchlauf für Provider-private `channelData`-Transportumschläge. Schritt 15 bleibt eine Folgevalidierung, falls wir quantifizierte Import-Fanout-Zahlen über das Typ-/Test-Gate hinaus wünschen.

## Tests

Hinzufügen oder aktualisieren:

- Presentation-Normalisierungstests.
- Presentation-Tests für automatische Reduktion nicht unterstützter Blöcke.
- Kontexübergreifende Marker-Tests für Plugin-Dispatch- und Core-Zustellpfade.
- Kanal-Render-Matrix-Tests für Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE und Text-Fallback.
- Nachrichtenwerkzeug-Schematests, die belegen, dass native Felder entfernt sind.
- CLI-Tests, die belegen, dass native Flags entfernt sind.
- Discord-Einstiegspunkt-Regressionsabdeckung für Import-Laziness mit Carbon.
- Zustell-Anheftungstests für Telegram und generischen Fallback.

## Offene Fragen

- Soll `delivery.pin` im ersten Durchlauf für Discord, Slack, MS Teams und Feishu implementiert werden, oder zunächst nur für Telegram?
- Soll `delivery` künftig bestehende Felder wie `replyToId`, `replyToCurrent`, `silent` und `audioAsVoice` aufnehmen, oder auf Verhalten nach dem Senden fokussiert bleiben?
- Soll Presentation Bilder oder Dateireferenzen direkt unterstützen, oder sollen Medien vorerst getrennt vom UI-Layout bleiben?

## Verwandt

- [Kanalübersicht](/de/channels)
- [Nachrichten-Presentation](/de/plugins/message-presentation)
