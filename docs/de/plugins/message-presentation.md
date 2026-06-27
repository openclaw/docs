---
read_when:
    - Nachrichtenkarten-, Schaltflächen- oder Auswahl-Rendering hinzufügen oder ändern
    - Einen Channel-Plugin erstellen, der umfangreiche ausgehende Nachrichten unterstützt
    - Darstellung des Nachrichten-Tools oder Zustellungsfunktionen ändern
    - Debugging von Provider-spezifischen Card-/Block-/Komponenten-Rendering-Regressionen
summary: Semantische Nachrichtenkarten, Buttons, Auswahlfelder, Fallback-Text und Zustellhinweise für Kanal-Plugins
title: Nachrichtendarstellung
x-i18n:
    generated_at: "2026-06-27T17:50:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

Message Presentation ist OpenClaws gemeinsamer Vertrag für reichhaltige ausgehende Chat-UI.
Sie ermöglicht Agents, CLI-Befehlen, Freigabeabläufen und Plugins, die Nachrichtenabsicht
einmal zu beschreiben, während jedes Channel-Plugin die bestmögliche native Form rendert.

Verwenden Sie Presentation für portable Nachrichten-UI:

- Textabschnitte
- kleine Kontext-/Footer-Texte
- Trenner
- Schaltflächen
- Auswahlmenüs
- Kartentitel und Ton

Fügen Sie dem gemeinsamen Nachrichtentool keine neuen provider-nativen Felder wie Discord-`components`, Slack-`blocks`, Telegram-`buttons`, Teams-`card` oder Feishu-`card` hinzu. Diese sind Renderer-Ausgaben, die dem Channel-Plugin gehören.

## Vertrag

Plugin-Autoren importieren den öffentlichen Vertrag aus:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Form:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
};

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

Semantik von Schaltflächen:

- `action.type: "command"` führt einen nativen Slash-Befehl über den Befehlspfad des Kerns aus. Verwenden Sie dies für integrierte Befehlsschaltflächen und Menüs.
- `action.type: "callback"` überträgt opake Plugin-Daten über den Interaktionspfad des Channels. Channel-Plugins dürfen Callback-Daten nicht als Slash-Befehle neu interpretieren.
- `value` ist der alte opake Callback-Wert. Neue Steuerelemente sollten `action` verwenden, damit Channel-Plugins Befehle und Callbacks zuordnen können, ohne anhand von Text zu raten.
- `url` ist eine Link-Schaltfläche. Sie kann ohne `value` existieren.
- `webApp` beschreibt eine channel-native Web-App-Schaltfläche. Telegram rendert dies als `web_app` und unterstützt es nur in privaten Chats. `web_app` wird in lockeren JSON-Payloads aus Kompatibilitätsgründen weiterhin akzeptiert, TypeScript-Produzenten sollten jedoch `webApp` verwenden.
- `label` ist erforderlich und wird auch im Text-Fallback verwendet.
- `style` ist ein Hinweis. Renderer sollten nicht unterstützte Stile auf einen sicheren Standard abbilden und den Versand nicht fehlschlagen lassen.
- `priority` ist optional. Wenn ein Channel Aktionslimits meldet und Steuerelemente verworfen werden müssen, behält der Kern zuerst Schaltflächen mit höherer Priorität bei und erhält die ursprüngliche Reihenfolge bei Schaltflächen gleicher Priorität. Wenn alle Steuerelemente passen, bleibt die verfasste Reihenfolge erhalten.
- `disabled` ist optional. Channels müssen sich mit `supportsDisabled` dafür anmelden; andernfalls stuft der Kern das deaktivierte Steuerelement auf nicht interaktiven Fallback-Text zurück.
- `reusable` ist optional. Channels, die wiederverwendbare native Callbacks unterstützen, können die Aktion nach einer erfolgreichen Interaktion verfügbar halten. Verwenden Sie dies für wiederholbare oder idempotente Aktionen wie Aktualisieren, Prüfen oder weitere Details; lassen Sie es für normale einmalige Freigaben und destruktive Aktionen unset.

Semantik von Auswahlfeldern:

- `options[].action` hat dieselbe Befehls-/Callback-Bedeutung wie `action` bei Schaltflächen.
- `options[].value` ist der alte ausgewählte Anwendungswert.
- `placeholder` ist ein Hinweis und kann von Channels ohne native Auswahlunterstützung ignoriert werden.
- Wenn ein Channel Auswahlfelder nicht unterstützt, listet der Fallback-Text die Labels auf.

## Beispiele für Produzenten

Einfache Karte:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Nur-URL-Link-Schaltfläche:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Telegram-Mini-App-Schaltfläche:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

Auswahlmenü:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI-Versand:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Angeheftete Zustellung:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Angeheftete Zustellung mit explizitem JSON:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Renderer-Vertrag

Channel-Plugins deklarieren Render-Unterstützung in ihrem ausgehenden Adapter:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Capability-Booleans beschreiben, was der Renderer interaktiv machen kann. Optionale `limits` beschreiben die generische Hülle, die der Kern anpassen kann, bevor er den Renderer aufruft:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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
```

Der Kern wendet generische Limits auf semantische Steuerelemente an, bevor gerendert wird. Renderer besitzen weiterhin die abschließende provider-spezifische Validierung und Kürzung für native Blockanzahl, Kartengröße, URL-Limits und Provider-Eigenheiten, die im generischen Vertrag nicht ausgedrückt werden können. Wenn Limits alle Steuerelemente aus einem Block entfernen, behält der Kern die Labels als nicht interaktiven Kontexttext bei, sodass die zugestellte Nachricht weiterhin einen sichtbaren Fallback hat.

## Render-Ablauf im Kern

Wenn ein `ReplyPayload` oder eine Nachrichtenaktion `presentation` enthält, führt der Kern Folgendes aus:

1. Normalisiert den Presentation-Payload.
2. Löst den ausgehenden Adapter des Ziel-Channels auf.
3. Liest `presentationCapabilities`.
4. Wendet generische Capability-Limits wie Aktionsanzahl, Labellänge und Anzahl von Auswahloptionen an, wenn der Adapter sie meldet.
5. Ruft `renderPresentation` auf, wenn der Adapter den Payload rendern kann.
6. Fällt auf konservativen Text zurück, wenn der Adapter fehlt oder nicht rendern kann.
7. Sendet den resultierenden Payload über den normalen Channel-Zustellungspfad.
8. Wendet Zustellungsmetadaten wie `delivery.pin` nach der ersten erfolgreich gesendeten Nachricht an.

Der Kern besitzt das Fallback-Verhalten, damit Produzenten channel-agnostisch bleiben können. Channel-Plugins besitzen natives Rendering und Interaktionsbehandlung.

## Degradationsregeln

Presentation muss sicher auf eingeschränkten Channels gesendet werden können.

Fallback-Text enthält:

- `title` als erste Zeile
- `text`-Blöcke als normale Absätze
- `context`-Blöcke als kompakte Kontextzeilen
- `divider`-Blöcke als visuellen Trenner
- Schaltflächenlabels, einschließlich URLs für Link-Schaltflächen
- Labels von Auswahloptionen

Nicht unterstützte native Steuerelemente sollten degradiert werden, statt den gesamten Versand fehlschlagen zu lassen.
Beispiele:

- Telegram mit deaktivierten Inline-Schaltflächen sendet Text-Fallback.
- Ein Channel ohne Auswahlunterstützung listet Auswahloptionen als Text auf.
- Eine Nur-URL-Schaltfläche wird entweder zu einer nativen Link-Schaltfläche oder zu einer Fallback-URL-Zeile.
- Optionale Pinning-Fehler lassen die zugestellte Nachricht nicht fehlschlagen.

Die wichtigste Ausnahme ist `delivery.pin.required: true`; wenn Pinning als erforderlich angefordert wird und der Channel die gesendete Nachricht nicht anheften kann, meldet die Zustellung einen Fehler.

## Provider-Zuordnung

Aktuelle gebündelte Renderer:

| Channel         | Natives Render-Ziel                | Hinweise                                                                                                                                              |
| --------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components und Component-Container | Behält altes `channelData.discord.components` für bestehende provider-native Payload-Produzenten bei, neue gemeinsame Sends sollten jedoch `presentation` verwenden. |
| Slack           | Block Kit                          | Behält altes `channelData.slack.blocks` für bestehende provider-native Payload-Produzenten bei, neue gemeinsame Sends sollten jedoch `presentation` verwenden.       |
| Telegram        | Text plus Inline-Tastaturen        | Schaltflächen/Auswahlfelder erfordern Inline-Schaltflächen-Capability für die Zieloberfläche; andernfalls wird Text-Fallback verwendet.               |
| Mattermost      | Text plus interaktive Props        | Andere Blöcke degradieren zu Text.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                     | Einfacher `message`-Text wird zusammen mit der Karte eingeschlossen, wenn beides bereitgestellt wird.                                                  |
| Feishu          | Interaktive Karten                 | Der Kartenkopf kann `title` verwenden; der Textkörper vermeidet die Duplizierung dieses Titels.                                                        |
| Einfache Channels | Text-Fallback                    | Channels ohne Renderer erhalten dennoch lesbare Ausgabe.                                                                                              |

Provider-native Payload-Kompatibilität ist eine Übergangserleichterung für bestehende
Reply-Produzenten. Sie ist kein Grund, neue gemeinsame native Felder hinzuzufügen.

## Presentation vs InteractiveReply

`InteractiveReply` ist die ältere interne Teilmenge, die von Approval- und Interaktions-
Hilfsfunktionen verwendet wird. Sie unterstützt:

- Text
- Buttons
- Selects

`MessagePresentation` ist der kanonische gemeinsame Send-Vertrag. Es ergänzt:

- Titel
- Ton
- Kontext
- Trenner
- reine URL-Buttons
- generische Zustellungsmetadaten über `ReplyPayload.delivery`

Verwenden Sie Hilfsfunktionen aus `openclaw/plugin-sdk/interactive-runtime`, wenn Sie älteren
Code überbrücken:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Neuer Code sollte `MessagePresentation` direkt akzeptieren oder erzeugen. Bestehende
`interactive`-Payloads sind eine veraltete Teilmenge von `presentation`; Runtime-
Unterstützung bleibt für ältere Produzenten bestehen.

Die Legacy-Typen `InteractiveReply*` und Konvertierungs-Hilfsfunktionen sind im SDK mit
`@deprecated` markiert:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` und
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` und
`presentationToInteractiveControlsReply(...)` bleiben als Renderer-Brücken für
Legacy-Channel-Implementierungen verfügbar. Neuer Produzenten-Code sollte sie nicht aufrufen;
senden Sie `presentation` und lassen Sie Core-/Channel-Adaptation das Rendering übernehmen.

Approval-Hilfsfunktionen haben ebenfalls Presentation-first-Ersatzfunktionen:

- verwenden Sie `buildApprovalPresentationFromActionDescriptors(...)` statt
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- verwenden Sie `buildApprovalPresentation(...)` statt
  `buildApprovalInteractiveReply(...)`
- verwenden Sie `buildExecApprovalPresentation(...)` statt
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` gibt für Presentation-Blöcke ohne Text-Fallback
einen leeren String zurück, etwa bei einer Presentation, die nur aus einem Trenner besteht.
Transporte, die einen nicht leeren Sendetext benötigen, können `emptyFallback` übergeben, um
einen minimalen Body zu verwenden, ohne den Standard-Fallback-Vertrag zu ändern.

## Zustellungs-Pin

Anpinnen ist Zustellungsverhalten, keine Presentation. Verwenden Sie `delivery.pin` statt
Provider-nativer Felder wie `channelData.telegram.pin`.

Semantik:

- `pin: true` pinnt die erste erfolgreich zugestellte Nachricht an.
- `pin.notify` ist standardmäßig `false`.
- `pin.required` ist standardmäßig `false`.
- Optionale Pin-Fehler degradieren und lassen die gesendete Nachricht intakt.
- Erforderliche Pin-Fehler lassen die Zustellung fehlschlagen.
- Nachrichten in Chunks pinnen den ersten zugestellten Chunk an, nicht den letzten Chunk.

Manuelle Nachrichtenaktionen `pin`, `unpin` und `pins` existieren weiterhin für bestehende
Nachrichten, sofern der Provider diese Vorgänge unterstützt.

## Checkliste für Plugin-Autoren

- Deklarieren Sie `presentation` aus `describeMessageTool(...)`, wenn der Channel
  semantische Presentation rendern oder sicher degradieren kann.
- Fügen Sie `presentationCapabilities` zum ausgehenden Runtime-Adapter hinzu.
- Implementieren Sie `renderPresentation` im Runtime-Code, nicht im Control-Plane-Plugin-
  Setup-Code.
- Halten Sie native UI-Bibliotheken aus heißen Setup-/Katalogpfaden heraus.
- Deklarieren Sie generische Fähigkeitsgrenzen unter `presentationCapabilities.limits`, wenn
  sie bekannt sind.
- Bewahren Sie endgültige Plattformgrenzen im Renderer und in Tests.
- Fügen Sie Fallback-Tests für nicht unterstützte Buttons, Selects, URL-Buttons,
  Titel-/Textduplizierung und gemischte Sends mit `message` plus `presentation` hinzu.
- Fügen Sie Unterstützung für Zustellungs-Pins über `deliveryCapabilities.pin` und
  `pinDeliveredMessage` nur hinzu, wenn der Provider die gesendete Nachrichten-ID anpinnen kann.
- Stellen Sie keine neuen Provider-nativen Card-/Block-/Component-/Button-Felder über das
  gemeinsame Nachrichtenaktionsschema bereit.

## Verwandte Dokumentation

- [Nachrichten-CLI](/de/cli/message)
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-Architektur](/de/plugins/architecture-internals#message-tool-schemas)
- [Refaktorierungsplan für Channel-Presentation](/de/plan/ui-channels)
