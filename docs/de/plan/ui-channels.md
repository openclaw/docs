---
read_when:
    - Refaktorierung der UI für Kanalnachrichten, interaktive Payloads oder native Kanal-Renderer
    - Ändern von Nachrichtentool-Funktionen, Zustellhinweisen oder kontextübergreifenden Markern
    - Debugging von Discord-Carbon-Import-Fanout oder Runtime-Laziness des Channel-Plugins
summary: Semantische Nachrichtendarstellung von nativen UI-Renderern der Kanäle entkoppeln.
title: Plan zur Umstrukturierung der Kanalpräsentation
x-i18n:
    generated_at: "2026-06-27T17:41:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Implementiert für den gemeinsamen Agent, die CLI, Plugin-Fähigkeiten und Oberflächen für ausgehende Zustellung:

- `ReplyPayload.presentation` trägt semantische Nachrichten-UI.
- `ReplyPayload.delivery.pin` trägt Anforderungen zum Anheften gesendeter Nachrichten.
- Gemeinsame Nachrichtenaktionen stellen `presentation`, `delivery` und `pin` bereit statt Provider-nativen `components`, `blocks`, `buttons` oder `card`.
- Der Kern rendert Präsentation oder stuft sie automatisch über von Plugins deklarierte ausgehende Fähigkeiten herab.
- Discord-, Slack-, Telegram-, Mattermost-, MS Teams- und Feishu-Renderer verwenden den generischen Vertrag.
- Code der Discord-Kanal-Steuerungsebene importiert keine Carbon-basierten UI-Container mehr.

Kanonische Dokumentation befindet sich jetzt in [Nachrichtenpräsentation](/de/plugins/message-presentation).
Bewahren Sie diesen Plan als historischen Implementierungskontext auf; aktualisieren Sie den kanonischen Leitfaden
bei Änderungen am Vertrag, Renderer oder Fallback-Verhalten.

## Problem

Kanal-UI ist derzeit auf mehrere inkompatible Oberflächen verteilt:

- Der Kern besitzt über `buildCrossContextComponents` einen Discord-förmigen Renderer-Hook für kontextübergreifende Nutzung.
- Discord `channel.ts` kann native Carbon-UI über `DiscordUiContainer` importieren, wodurch Laufzeit-UI-Abhängigkeiten in die Steuerungsebene des Kanal-Plugins gezogen werden.
- Der Agent und die CLI stellen native Payload-Ausweichpfade wie Discord `components`, Slack `blocks`, Telegram- oder Mattermost-`buttons` sowie Teams- oder Feishu-`card` bereit.
- `ReplyPayload.channelData` trägt sowohl Transporthinweise als auch native UI-Umschläge.
- Das generische `interactive`-Modell existiert, ist aber schmaler als die reicheren Layouts, die bereits von Discord, Slack, Teams, Feishu, LINE, Telegram und Mattermost verwendet werden.

Dadurch kennt der Kern native UI-Formen, die träge Plugin-Laufzeit wird geschwächt, und Agents erhalten zu viele Provider-spezifische Möglichkeiten, dieselbe Nachrichtenabsicht auszudrücken.

## Ziele

- Der Kern entscheidet anhand deklarierter Fähigkeiten über die beste semantische Präsentation für eine Nachricht.
- Erweiterungen deklarieren Fähigkeiten und rendern semantische Präsentation in native Transport-Payloads.
- Web Control UI bleibt von nativer Chat-UI getrennt.
- Native Kanal-Payloads werden nicht über die gemeinsame Nachrichtenoberfläche von Agent oder CLI offengelegt.
- Nicht unterstützte Präsentationsfunktionen werden automatisch zur besten Textdarstellung herabgestuft.
- Zustellverhalten wie das Anheften einer gesendeten Nachricht ist generische Zustellmetadaten, keine Präsentation.

## Nicht-Ziele

- Kein Abwärtskompatibilitäts-Shim für `buildCrossContextComponents`.
- Keine öffentlichen nativen Ausweichpfade für `components`, `blocks`, `buttons` oder `card`.
- Keine Kernimporte von kanalnativen UI-Bibliotheken.
- Keine Provider-spezifischen SDK-Schnittstellen für gebündelte Kanäle.

## Zielmodell

Fügen Sie ein kernverwaltetes Feld `presentation` zu `ReplyPayload` hinzu.

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
- `interactive`-Buttonblock wird auf `presentation.blocks[].type = "buttons"` abgebildet.
- `interactive`-Selectblock wird auf `presentation.blocks[].type = "select"` abgebildet.

Die externen Agent- und CLI-Schemas verwenden jetzt `presentation`; `interactive` bleibt ein interner Legacy-Parser-/Rendering-Helfer für bestehende Antwortproduzenten.
Die öffentliche, produzentenorientierte API behandelt `interactive` als veraltet. Laufzeitunterstützung
bleibt erhalten, damit bestehende Genehmigungshelfer und ältere Plugins weiter
funktionieren, während neuer Code `presentation` ausgibt.

## Zustellmetadaten

Fügen Sie ein kernverwaltetes Feld `delivery` für Sendeverhalten hinzu, das keine UI ist.

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
- `required` ist standardmäßig `false`; nicht unterstützte Kanäle oder fehlgeschlagenes Anheften werden automatisch herabgestuft, indem die Zustellung fortgesetzt wird.
- Manuelle Nachrichtenaktionen `pin`, `unpin` und `list-pins` bleiben für bestehende Nachrichten erhalten.

Die aktuelle Telegram-ACP-Themenbindung sollte von `channelData.telegram.pin = true` zu `delivery.pin = true` wechseln.

## Laufzeit-Fähigkeitsvertrag

Fügen Sie Präsentations- und Zustell-Renderer-Hooks zum ausgehenden Laufzeitadapter hinzu, nicht zum Kanal-Plugin der Steuerungsebene.

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
- Präsentationsfähigkeiten abfragen.
- Nicht unterstützte Blöcke herabstufen und generische Fähigkeitsgrenzen vor dem
  Rendering anwenden.
- `renderPresentation` aufrufen.
- Wenn kein Renderer existiert, Präsentation in Text-Fallback umwandeln.
- Nach erfolgreichem Senden `pinDeliveredMessage` aufrufen, wenn `delivery.pin` angefordert und unterstützt wird.

## Kanalzuordnung

Discord:

- `presentation` in Komponenten v2 und Carbon-Container in Nur-Laufzeit-Modulen rendern.
- Akzentfarben-Helfer in leichten Modulen behalten.
- `DiscordUiContainer`-Importe aus Code der Kanal-Plugin-Steuerungsebene entfernen.

Slack:

- `presentation` in Block Kit rendern.
- Agent- und CLI-`blocks`-Eingabe entfernen.

Telegram:

- Text, Kontext und Trenner als Text rendern.
- Aktionen und Select als Inline-Tastaturen rendern, wenn sie für die Zieloberfläche konfiguriert und erlaubt sind.
- Text-Fallback verwenden, wenn Inline-Buttons deaktiviert sind.
- ACP-Themenanheftung zu `delivery.pin` verschieben.

Mattermost:

- Aktionen als interaktive Buttons rendern, sofern konfiguriert.
- Andere Blöcke als Text-Fallback rendern.

MS Teams:

- `presentation` in Adaptive Cards rendern.
- Manuelle Aktionen zum Anheften, Lösen und Auflisten von Pins behalten.
- Optional `pinDeliveredMessage` implementieren, wenn Graph-Unterstützung für die Zielunterhaltung zuverlässig ist.

Feishu:

- `presentation` in interaktive Karten rendern.
- Manuelle Aktionen zum Anheften, Lösen und Auflisten von Pins behalten.
- Optional `pinDeliveredMessage` für das Anheften gesendeter Nachrichten implementieren, wenn das API-Verhalten zuverlässig ist.

LINE:

- `presentation` nach Möglichkeit in Flex- oder Vorlagennachrichten rendern.
- Für nicht unterstützte Blöcke auf Text zurückfallen.
- LINE-UI-Payloads aus `channelData` entfernen.

Einfache oder eingeschränkte Kanäle:

- Präsentation mit konservativer Formatierung in Text umwandeln.

## Refaktorierungsschritte

1. Wenden Sie den Discord-Release-Fix erneut an, der `ui-colors.ts` von Carbon-basierter UI trennt und `DiscordUiContainer` aus `extensions/discord/src/channel.ts` entfernt.
2. Fügen Sie `presentation` und `delivery` zu `ReplyPayload`, der Normalisierung ausgehender Payloads, Zustellzusammenfassungen und Hook-Payloads hinzu.
3. Fügen Sie `MessagePresentation`-Schema und Parser-Helfer in einem schmalen SDK-/Laufzeit-Unterpfad hinzu.
4. Ersetzen Sie Nachrichtenfähigkeiten `buttons`, `cards`, `components` und `blocks` durch semantische Präsentationsfähigkeiten.
5. Fügen Sie Hooks für Präsentations-Rendering und Zustellungsanheftung zum ausgehenden Laufzeitadapter hinzu.
6. Ersetzen Sie die kontextübergreifende Komponentenerstellung durch `buildCrossContextPresentation`.
7. Löschen Sie `src/infra/outbound/channel-adapters.ts` und entfernen Sie `buildCrossContextComponents` aus Kanal-Plugin-Typen.
8. Ändern Sie `maybeApplyCrossContextMarker`, sodass `presentation` statt nativer Parameter angehängt wird.
9. Aktualisieren Sie Plugin-Dispatch-Sendepfade so, dass sie nur semantische Präsentation und Zustellmetadaten verwenden.
10. Entfernen Sie native Payload-Parameter von Agent und CLI: `components`, `blocks`, `buttons` und `card`.
11. Entfernen Sie SDK-Helfer, die native Nachrichtenwerkzeug-Schemas erstellen, und ersetzen Sie sie durch Präsentationsschema-Helfer.
12. Entfernen Sie UI-/native Umschläge aus `channelData`; behalten Sie nur Transportmetadaten, bis jedes verbleibende Feld geprüft wurde.
13. Migrieren Sie Discord-, Slack-, Telegram-, Mattermost-, MS Teams-, Feishu- und LINE-Renderer.
14. Aktualisieren Sie Dokumentation für Nachrichten-CLI, Kanalseiten, Plugin-SDK und Fähigkeits-Cookbook.
15. Führen Sie Import-Fanout-Profiling für Discord und betroffene Kanal-Einstiegspunkte aus.

Schritte 1-11 und 13-14 sind in dieser Refaktorierung für die Verträge des gemeinsamen Agent, der CLI, der Plugin-Fähigkeiten und des ausgehenden Adapters implementiert. Schritt 12 bleibt ein tieferer interner Bereinigungsdurchgang für Provider-private `channelData`-Transportumschläge. Schritt 15 bleibt Folgevalidierung, falls wir quantifizierte Import-Fanout-Zahlen über das Typ-/Test-Gate hinaus wünschen.

## Tests

Hinzufügen oder aktualisieren:

- Tests für Präsentationsnormalisierung.
- Tests für automatische Herabstufung der Präsentation bei nicht unterstützten Blöcken.
- Tests für kontextübergreifende Marker für Plugin-Dispatch und Kernzustellungspfade.
- Kanal-Rendering-Matrixtests für Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE und Text-Fallback.
- Nachrichtenwerkzeug-Schematests, die belegen, dass native Felder entfernt sind.
- CLI-Tests, die belegen, dass native Flags entfernt sind.
- Discord-Einstiegspunkt-Regression für träge Importe mit Carbon-Abdeckung.
- Tests für Zustellungsanheftung mit Telegram und generischem Fallback.

## Offene Fragen

- Sollte `delivery.pin` im ersten Durchgang für Discord, Slack, MS Teams und Feishu implementiert werden oder zunächst nur für Telegram?
- Sollte `delivery` langfristig bestehende Felder wie `replyToId`, `replyToCurrent`, `silent` und `audioAsVoice` aufnehmen oder auf Verhalten nach dem Senden fokussiert bleiben?
- Sollte Präsentation Bilder oder Dateireferenzen direkt unterstützen, oder sollten Medien vorerst getrennt vom UI-Layout bleiben?

## Verwandt

- [Kanäle Übersicht](/de/channels)
- [Nachrichtenpräsentation](/de/plugins/message-presentation)
