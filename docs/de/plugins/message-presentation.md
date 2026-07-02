---
read_when:
    - Nachrichtenkarten-, Schaltflächen- oder Auswahl-Rendering hinzufügen oder ändern
    - Einen Kanal-Plugin erstellen, das Rich-Outbound-Nachrichten unterstützt
    - Darstellung oder Zustellungsfunktionen von Nachrichtentools ändern
    - Debugging von Provider-spezifischen Darstellungsregressionen bei Karten, Blöcken und Komponenten
summary: Semantische Nachrichtenkarten, Buttons, Auswahlfelder, Fallback-Text und Zustellhinweise für Channel-Plugins
title: Nachrichtendarstellung
x-i18n:
    generated_at: "2026-07-02T22:26:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

Nachrichtendarstellung ist OpenClaws gemeinsamer Contract für reichhaltige ausgehende Chat-UI.
Sie ermöglicht Agents, CLI-Befehlen, Approval-Flows und Plugins, die Nachrichtenabsicht
einmal zu beschreiben, während jedes Channel-Plugin die bestmögliche native Form rendert.

Verwenden Sie Presentation für portable Nachrichten-UI:

- Textabschnitte
- kleiner Kontext-/Footer-Text
- Trennlinien
- Buttons
- Auswahlmenüs
- Kartentitel und Ton

Fügen Sie dem gemeinsamen Nachrichten-Tool keine neuen provider-nativen Felder wie Discord-`components`, Slack-`blocks`, Telegram-`buttons`, Teams-`card` oder Feishu-`card` hinzu. Diese sind Renderer-Ausgaben, die dem Channel-Plugin gehören.

## Contract

Plugin-Autoren importieren den öffentlichen Contract aus:

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

Button-Semantik:

- `action.type: "command"` führt einen nativen Slash-Befehl über den Befehlspfad des Core aus. Verwenden Sie dies für integrierte Befehls-Buttons und Menüs.
- `action.type: "callback"` transportiert opake Plugin-Daten über den Interaktionspfad des Channels. Channel-Plugins dürfen Callback-Daten nicht als Slash-Befehle neu interpretieren.
- `value` ist der veraltete opake Callback-Wert. Neue Controls sollten `action` verwenden, damit Channel-Plugins Befehle und Callbacks zuordnen können, ohne aus Text raten zu müssen.
- `url` ist ein Link-Button. Er kann ohne `value` existieren.
- `webApp` beschreibt einen channel-nativen Web-App-Button. Telegram rendert dies als `web_app` und unterstützt es nur in privaten Chats. `web_app` wird aus Kompatibilitätsgründen weiterhin in lockeren JSON-Payloads akzeptiert, TypeScript-Produzenten sollten jedoch `webApp` verwenden.
- `label` ist erforderlich und wird auch im Text-Fallback verwendet.
- `style` ist beratend. Renderer sollten nicht unterstützte Styles auf einen sicheren Standard abbilden, nicht den Versand fehlschlagen lassen.
- `priority` ist optional. Wenn ein Channel Aktionslimits angibt und Controls verworfen werden müssen, behält Core zuerst Buttons mit höherer Priorität bei und bewahrt die ursprüngliche Reihenfolge unter Buttons gleicher Priorität. Wenn alle Controls passen, bleibt die authored Reihenfolge erhalten.
- `disabled` ist optional. Channels müssen sich mit `supportsDisabled` dafür anmelden; andernfalls stuft Core das deaktivierte Control auf nicht interaktiven Fallback-Text zurück.
- `reusable` ist optional. Channels, die wiederverwendbare native Callbacks unterstützen, können die Aktion nach einer erfolgreichen Interaktion verfügbar halten. Verwenden Sie dies für wiederholbare oder idempotente Aktionen wie Aktualisieren, Inspizieren oder weitere Details; lassen Sie es für normale einmalige Approvals und destruktive Aktionen unset.

Select-Semantik:

- `options[].action` hat dieselbe Befehls-/Callback-Bedeutung wie Button-`action`.
- `options[].value` ist der veraltete ausgewählte Anwendungswert.
- `placeholder` ist beratend und kann von Channels ohne native Select-Unterstützung ignoriert werden.
- Wenn ein Channel Selects nicht unterstützt, listet Fallback-Text die Labels auf.

## Producer-Beispiele

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

Nur-URL-Link-Button:

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

Telegram-Mini-App-Button:

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

Angepinnte Zustellung:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Angepinnte Zustellung mit explizitem JSON:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Renderer-Contract

Channel-Plugins deklarieren Render-Unterstützung auf ihrem ausgehenden Adapter:

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

Capability-Booleans beschreiben, was der Renderer interaktiv machen kann. Optionale `limits` beschreiben die generische Hülle, die Core vor dem Aufruf des Renderers anpassen kann:

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

Core wendet generische Limits auf semantische Controls an, bevor gerendert wird. Renderer besitzen weiterhin die finale provider-spezifische Validierung und Kürzung für native Blockanzahl, Kartengröße, URL-Limits und Provider-Eigenheiten, die im generischen Contract nicht ausgedrückt werden können. Wenn Limits jedes Control aus einem Block entfernen, behält Core die Labels als nicht interaktiven Kontexttext bei, damit die zugestellte Nachricht weiterhin einen sichtbaren Fallback hat.

## Core-Render-Flow

Wenn ein `ReplyPayload` oder eine Nachrichtenaktion `presentation` enthält, führt Core Folgendes aus:

1. Normalisiert den Presentation-Payload.
2. Löst den ausgehenden Adapter des Ziel-Channels auf.
3. Liest `presentationCapabilities`.
4. Wendet generische Capability-Limits wie Aktionsanzahl, Label-Länge und Anzahl der Select-Optionen an, wenn der Adapter sie angibt.
5. Ruft `renderPresentation` auf, wenn der Adapter den Payload rendern kann.
6. Fällt auf konservativen Text zurück, wenn der Adapter fehlt oder nicht rendern kann.
7. Sendet den resultierenden Payload über den normalen Zustellungspfad des Channels.
8. Wendet Zustellungsmetadaten wie `delivery.pin` nach der ersten erfolgreich gesendeten Nachricht an.

Core besitzt das Fallback-Verhalten, damit Produzenten channel-agnostisch bleiben können. Channel-Plugins besitzen natives Rendering und Interaktionsbehandlung.

## Degradationsregeln

Presentation muss auf eingeschränkten Channels sicher zu senden sein.

Fallback-Text enthält:

- `title` als erste Zeile
- `text`-Blöcke als normale Absätze
- `context`-Blöcke als kompakte Kontextzeilen
- `divider`-Blöcke als visueller Trenner
- Button-Labels, einschließlich URLs für Link-Buttons
- Labels von Select-Optionen

### Fallback-Sichtbarkeit von Button-Werten

Wenn ein Channel interaktive Controls nicht rendern kann, fallen Button- und Select-Werte auf Klartext zurück. Das Fallback-Verhalten erhält die Nutzbarkeit, während opake Callback-Daten privat bleiben:

- **`command`-typisierte Aktionen** rendern als `label: \`command\``, sodass Benutzer den Befehl kopieren und manuell in der Channel-Eingabe ausführen können.
- **`callback`-typisierte Aktionen** und veraltete **`value`**-Felder rendern nur als Label. Der opake Callback-Wert wird im Fallback-Text nicht offengelegt.
- **`url` / `webApp`**-Buttons rendern den URL-Text zusammen mit dem Button-Label, da die URL benutzerseitig sichtbar ist.
- **Select-Optionen** rendern nur als Label. Der zugrunde liegende Optionswert wird im Fallback-Text nicht offengelegt.

Channel-Adapter, die in ihrer Fallback-UI Anleitung für manuelle Befehle hinzufügen (z. B. Feishu-Dokumentkommentar-Anweisungen), müssen die Prüfung auf vorhandene Befehle aus denselben Presentation-Blöcken ableiten, die der Fallback-Renderer verwendet, damit der Anleitungstext nur erscheint, wenn tatsächlich ein manueller Befehl angezeigt wird.

Nicht unterstützte native Controls sollten degradieren, statt den gesamten Versand fehlschlagen zu lassen. Beispiele:

- Telegram mit deaktivierten Inline-Buttons sendet Text-Fallback.
- Ein Channel ohne Select-Unterstützung listet Select-Optionen als Text auf.
- Ein Nur-URL-Button wird entweder zu einem nativen Link-Button oder zu einer Fallback-URL-Zeile.
- Optionale Pin-Fehler lassen die zugestellte Nachricht nicht fehlschlagen.

Die wichtigste Ausnahme ist `delivery.pin.required: true`; wenn Pinning als erforderlich angefordert wird und der Channel die gesendete Nachricht nicht pinnen kann, meldet die Zustellung einen Fehler.

## Provider-Zuordnung

Aktuelle gebündelte Renderer:

| Kanal           | Natives Render-Ziel                 | Hinweise                                                                                                                                          |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponenten und Komponentencontainer | Bewahrt das Legacy-`channelData.discord.components` für vorhandene provider-native Payload-Produzenten, aber neue gemeinsam genutzte Sends sollten `presentation` verwenden. |
| Slack           | Block Kit                           | Bewahrt Legacy-`channelData.slack.blocks` für vorhandene provider-native Payload-Produzenten, aber neue gemeinsam genutzte Sends sollten `presentation` verwenden.       |
| Telegram        | Text plus Inline-Tastaturen         | Buttons/Selects erfordern Inline-Button-Fähigkeit für die Zieloberfläche; andernfalls wird Text-Fallback verwendet.                                         |
| Mattermost      | Text plus interaktive Props         | Andere Blöcke werden auf Text reduziert.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | Einfacher `message`-Text wird zusammen mit der Karte eingeschlossen, wenn beides bereitgestellt wird.                                                                            |
| Feishu          | Interaktive Karten                  | Der Kartenkopf kann `title` verwenden; der Body vermeidet es, diesen Titel zu duplizieren.                                                                                  |
| Einfache Kanäle | Text-Fallback                       | Kanäle ohne Renderer erhalten trotzdem lesbare Ausgabe.                                                                                            |

Provider-native Payload-Kompatibilität ist eine Übergangshilfe für vorhandene
Reply-Produzenten. Sie ist kein Grund, neue gemeinsam genutzte native Felder hinzuzufügen.

## Presentation vs InteractiveReply

`InteractiveReply` ist die ältere interne Teilmenge, die von Genehmigungs- und Interaktions-
Hilfsfunktionen verwendet wird. Sie unterstützt:

- Text
- Buttons
- Selects

`MessagePresentation` ist der kanonische gemeinsam genutzte Send-Vertrag. Er ergänzt:

- Titel
- Ton
- Kontext
- Trenner
- reine URL-Buttons
- generische Zustellungsmetadaten über `ReplyPayload.delivery`

Verwenden Sie Hilfsfunktionen aus `openclaw/plugin-sdk/interactive-runtime`, wenn Sie älteren
Code überbrücken:
__OC_I18N_900011__
Neuer Code sollte `MessagePresentation` direkt akzeptieren oder erzeugen. Vorhandene
`interactive`-Payloads sind eine veraltete Teilmenge von `presentation`; Runtime-
Unterstützung bleibt für ältere Produzenten erhalten.

Die Legacy-`InteractiveReply*`-Typen und Konvertierungshilfen sind im SDK als
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
`presentationToInteractiveControlsReply(...)` bleiben als Renderer-
Brücken für Legacy-Kanalimplementierungen verfügbar. Neuer Produzenten-Code sollte sie
nicht aufrufen; senden Sie `presentation` und lassen Sie Core/Kanal-Anpassung das Rendering übernehmen.

Genehmigungshilfen haben ebenfalls presentation-first-Ersatzfunktionen:

- Verwenden Sie `buildApprovalPresentationFromActionDescriptors(...)` anstelle von
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- Verwenden Sie `buildApprovalPresentation(...)` anstelle von
  `buildApprovalInteractiveReply(...)`
- Verwenden Sie `buildExecApprovalPresentation(...)` anstelle von
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` gibt für
Presentation-Blöcke ohne Text-Fallback eine leere Zeichenkette zurück, etwa bei einer nur aus einem Trenner bestehenden
Presentation. Transports, die einen nicht leeren Send-Body erfordern, können
`emptyFallback` übergeben, um einen minimalen Body zu verwenden, ohne den Standard-Fallback-
Vertrag zu ändern.

## Zustellungs-Pin

Anheften ist Zustellungsverhalten, nicht Presentation. Verwenden Sie `delivery.pin` anstelle
provider-nativer Felder wie `channelData.telegram.pin`.

Semantik:

- `pin: true` heftet die erste erfolgreich zugestellte Nachricht an.
- `pin.notify` ist standardmäßig `false`.
- `pin.required` ist standardmäßig `false`.
- Optionale Pin-Fehler werden reduziert und lassen die gesendete Nachricht intakt.
- Erforderliche Pin-Fehler lassen die Zustellung fehlschlagen.
- Aufgeteilte Nachrichten heften den ersten zugestellten Abschnitt an, nicht den letzten Abschnitt.

Manuelle Nachrichtenaktionen `pin`, `unpin` und `pins` existieren weiterhin für vorhandene
Nachrichten, bei denen der Provider diese Vorgänge unterstützt.

## Checkliste für Plugin-Autoren

- Deklarieren Sie `presentation` aus `describeMessageTool(...)`, wenn der Kanal
  semantische Presentation rendern oder sicher reduzieren kann.
- Fügen Sie `presentationCapabilities` zum Runtime-Outbound-Adapter hinzu.
- Implementieren Sie `renderPresentation` im Runtime-Code, nicht im Control-Plane-Plugin-
  Setup-Code.
- Halten Sie native UI-Bibliotheken aus heißen Setup-/Katalogpfaden heraus.
- Deklarieren Sie generische Fähigkeitslimits unter `presentationCapabilities.limits`, wenn
  sie bekannt sind.
- Bewahren Sie endgültige Plattformlimits im Renderer und in Tests.
- Fügen Sie Fallback-Tests für nicht unterstützte Buttons, Selects, URL-Buttons, Titel/Text-
  Duplizierung und gemischte Sends aus `message` plus `presentation` hinzu.
- Fügen Sie Unterstützung für Zustellungs-Pins über `deliveryCapabilities.pin` und
  `pinDeliveredMessage` nur hinzu, wenn der Provider die gesendete Nachrichten-ID anheften kann.
- Legen Sie keine neuen provider-nativen Karten-/Block-/Komponenten-/Button-Felder über
  das gemeinsam genutzte Nachrichtenaktionsschema offen.

## Verwandte Dokumentation

- [Message-CLI](/de/cli/message)
- [Plugin-SDK-Überblick](/de/plugins/sdk-overview)
- [Plugin-Architektur](/de/plugins/architecture-internals#message-tool-schemas)
- [Refaktorierungsplan für Kanal-Presentation](/de/plan/ui-channels)
