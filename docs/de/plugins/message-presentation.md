---
read_when:
    - Hinzufügen oder Ändern des Renderings von Nachrichtenkarten, Buttons oder Auswahlen
    - Erstellen eines Kanal-Plugins, das Rich-Outbound-Nachrichten unterstützt
    - Ändern der Darstellung oder Zustellungsfunktionen des Nachrichtentools
    - Debuggen providerspezifischer Regressionen beim Rendern von Karten/Blöcken/Komponenten
summary: Semantische Nachrichtenkarten, Buttons, Auswahlen, Fallback-Text und Zustellungshinweise für Kanal-Plugins
title: Nachrichtendarstellung
x-i18n:
    generated_at: "2026-04-22T04:24:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# Nachrichtendarstellung

Nachrichtendarstellung ist OpenClaws gemeinsamer Vertrag für Rich-Outbound-Chat-UI.
Er ermöglicht es Agents, CLI-Befehlen, Freigabeflows und Plugins, die
Nachrichtenabsicht einmal zu beschreiben, während jedes Kanal-Plugin die beste
native Form rendert, die es unterstützen kann.

Verwende Darstellung für portable Nachrichten-UI:

- Textabschnitte
- kleiner Kontext-/Footer-Text
- Trenner
- Buttons
- Auswahlmenüs
- Kartentitel und Tonalität

Füge dem gemeinsamen Nachrichtentool keine neuen provider-nativen Felder hinzu, etwa Discord-`components`, Slack-`blocks`, Telegram-`buttons`, Teams-`card` oder Feishu-`card`. Diese sind Renderer-Ausgaben, die dem Kanal-Plugin gehören.

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

- `value` ist ein Anwendungsaktionswert, der über den vorhandenen Interaktionspfad des Kanals zurückgeleitet wird, wenn der Kanal anklickbare Steuerelemente unterstützt.
- `url` ist ein Link-Button. Er kann ohne `value` existieren.
- `label` ist erforderlich und wird auch im Text-Fallback verwendet.
- `style` ist nur hinweisend. Renderer sollten nicht unterstützte Stile auf einen sicheren Standard abbilden, statt das Senden fehlschlagen zu lassen.

Select-Semantik:

- `options[].value` ist der ausgewählte Anwendungswert.
- `placeholder` ist nur hinweisend und kann von Kanälen ohne native Select-Unterstützung ignoriert werden.
- Wenn ein Kanal keine Selects unterstützt, listet der Fallback-Text die Labels auf.

## Beispiele für Producer

Einfache Karte:

```json
{
  "title": "Bereitstellungsfreigabe",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary ist bereit für die Promotion." },
    { "type": "context", "text": "Build 1234, Staging bestanden." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Genehmigen", "value": "deploy:approve", "style": "success" },
        { "label": "Ablehnen", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Nur-URL-Link-Button:

```json
{
  "blocks": [
    { "type": "text", "text": "Release Notes sind bereit." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Notizen öffnen", "url": "https://example.com/release" }]
    }
  ]
}
```

Auswahlmenü:

```json
{
  "title": "Umgebung wählen",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Umgebung",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Produktion", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI-Senden:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Bereitstellungsfreigabe" \
  --presentation '{"title":"Bereitstellungsfreigabe","tone":"warning","blocks":[{"type":"text","text":"Canary ist bereit."},{"type":"buttons","buttons":[{"label":"Genehmigen","value":"deploy:approve","style":"success"},{"label":"Ablehnen","value":"deploy:decline","style":"danger"}]}]}'
```

Angeheftete Zustellung:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Thema geöffnet" \
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

Kanal-Plugins deklarieren Render-Unterstützung auf ihrem Outbound-Adapter:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
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

Fähigkeitsfelder sind absichtlich einfache Boolesche Werte. Sie beschreiben, was der Renderer interaktiv machen kann, nicht jede native Plattformgrenze. Renderer bleiben weiterhin Eigentümer plattformspezifischer Grenzen wie maximaler Button-Anzahl, Block-Anzahl und Kartengröße.

## Core-Render-Ablauf

Wenn ein `ReplyPayload` oder eine Nachrichtenaktion `presentation` enthält, führt der Core Folgendes aus:

1. Die Darstellungs-Payload normalisieren.
2. Den Outbound-Adapter des Zielkanals auflösen.
3. `presentationCapabilities` lesen.
4. `renderPresentation` aufrufen, wenn der Adapter die Payload rendern kann.
5. Auf konservativen Text zurückfallen, wenn der Adapter fehlt oder nicht rendern kann.
6. Die resultierende Payload über den normalen Kanalzustellungspfad senden.
7. Zustellungsmetadaten wie `delivery.pin` nach der ersten erfolgreich gesendeten Nachricht anwenden.

Der Core besitzt das Fallback-Verhalten, damit Producer kanalagnostisch bleiben können. Kanal-Plugins besitzen natives Rendering und Interaktionsbehandlung.

## Regeln für Degradation

Darstellung muss sicher an eingeschränkte Kanäle gesendet werden können.

Fallback-Text enthält:

- `title` als erste Zeile
- `text`-Blöcke als normale Absätze
- `context`-Blöcke als kompakte Kontextzeilen
- `divider`-Blöcke als visuellen Trenner
- Button-Labels, einschließlich URLs für Link-Buttons
- Select-Optionslabels

Nicht unterstützte native Steuerelemente sollten degradieren, statt das ganze Senden fehlschlagen zu lassen.
Beispiele:

- Telegram mit deaktivierten Inline-Buttons sendet Text-Fallback.
- Ein Kanal ohne Select-Unterstützung listet Select-Optionen als Text auf.
- Ein Nur-URL-Button wird entweder zu einem nativen Link-Button oder zu einer Fallback-URL-Zeile.
- Optionale Fehler beim Anheften lassen die zugestellte Nachricht nicht fehlschlagen.

Die wichtigste Ausnahme ist `delivery.pin.required: true`; wenn Anheften als erforderlich angefordert wird und der Kanal die gesendete Nachricht nicht anheften kann, meldet die Zustellung einen Fehler.

## Provider-Zuordnung

Aktuelle gebündelte Renderer:

| Kanal           | Ziel für natives Rendering          | Hinweise                                                                                                                                             |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord          | Components und Component-Container  | Behält das alte `channelData.discord.components` für bestehende producer-native Payload-Producer bei, aber neue gemeinsame Sendungen sollten `presentation` verwenden. |
| Slack            | Block Kit                           | Behält das alte `channelData.slack.blocks` für bestehende producer-native Payload-Producer bei, aber neue gemeinsame Sendungen sollten `presentation` verwenden.       |
| Telegram         | Text plus Inline-Keyboards          | Buttons/Selects erfordern Inline-Button-Fähigkeit für die Zieloberfläche; andernfalls wird Text-Fallback verwendet.                                |
| Mattermost       | Text plus interaktive Props         | Andere Blöcke degradieren zu Text.                                                                                                                   |
| Microsoft Teams  | Adaptive Cards                      | Einfacher `message`-Text wird zusammen mit der Karte eingefügt, wenn beides angegeben ist.                                                          |
| Feishu           | Interaktive Karten                  | Der Kartenkopf kann `title` verwenden; der Body vermeidet, diesen Titel zu duplizieren.                                                             |
| Einfache Kanäle  | Text-Fallback                       | Kanäle ohne Renderer erhalten trotzdem lesbare Ausgabe.                                                                                              |

Kompatibilität mit provider-nativen Payloads ist eine Übergangshilfe für bestehende Reply-Producer. Sie ist kein Grund, neue gemeinsame native Felder hinzuzufügen.

## Darstellung vs InteractiveReply

`InteractiveReply` ist das ältere interne Subset, das von Freigabe- und Interaktionshelfern verwendet wird. Es unterstützt:

- Text
- Buttons
- Selects

`MessagePresentation` ist der kanonische gemeinsame Sendevertrag. Er ergänzt:

- Titel
- Tonalität
- Kontext
- Trenner
- Nur-URL-Buttons
- generische Zustellungsmetadaten über `ReplyPayload.delivery`

Verwende Helfer aus `openclaw/plugin-sdk/interactive-runtime`, wenn du älteren Code überbrückst:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Neuer Code sollte `MessagePresentation` direkt akzeptieren oder erzeugen.

## Zustellungs-Anheften

Anheften ist Zustellungsverhalten, keine Darstellung. Verwende `delivery.pin` statt provider-nativer Felder wie `channelData.telegram.pin`.

Semantik:

- `pin: true` heftet die erste erfolgreich zugestellte Nachricht an.
- `pin.notify` ist standardmäßig `false`.
- `pin.required` ist standardmäßig `false`.
- Optionale Fehler beim Anheften degradieren und lassen die gesendete Nachricht intakt.
- Erforderliche Fehler beim Anheften lassen die Zustellung fehlschlagen.
- Bei gechunkten Nachrichten wird der erste zugestellte Chunk angeheftet, nicht der letzte Chunk.

Manuelle Nachrichtenaktionen `pin`, `unpin` und `pins` existieren weiterhin für bestehende Nachrichten, bei denen der Provider diese Operationen unterstützt.

## Checkliste für Plugin-Autoren

- Deklariere `presentation` aus `describeMessageTool(...)`, wenn der Kanal semantische Darstellung rendern oder sicher degradieren kann.
- Füge `presentationCapabilities` zum Runtime-Outbound-Adapter hinzu.
- Implementiere `renderPresentation` im Runtime-Code, nicht im Control-Plane-Setup-Code des Plugins.
- Halte native UI-Bibliotheken aus heißen Setup-/Katalog-Pfaden heraus.
- Bewahre Plattformgrenzen im Renderer und in Tests.
- Füge Fallback-Tests für nicht unterstützte Buttons, Selects, URL-Buttons, Titel-/Text-Duplizierung und gemischte Sendungen mit `message` plus `presentation` hinzu.
- Füge Unterstützung für Zustellungs-Anheften über `deliveryCapabilities.pin` und `pinDeliveredMessage` nur hinzu, wenn der Provider die gesendete Nachrichten-ID anheften kann.
- Stelle keine neuen provider-nativen Karten-/Block-/Component-/Button-Felder über das gemeinsame Schema der Nachrichtenaktion bereit.

## Verwandte Docs

- [Message CLI](/cli/message)
- [Plugin SDK Overview](/de/plugins/sdk-overview)
- [Plugin Architecture](/de/plugins/architecture#message-tool-schemas)
- [Channel Presentation Refactor Plan](/de/plan/ui-channels)
