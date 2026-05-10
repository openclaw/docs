---
read_when:
    - Hinzufügen oder Ändern des Renderings von Nachrichtenkarten, Schaltflächen oder Auswahlfeldern
    - Ein Kanal-Plugin erstellen, das umfangreiche ausgehende Nachrichten unterstützt
    - Darstellung oder Zustellfunktionen des Nachrichtentools ändern
    - Fehlersuche bei providerspezifischen Regressionen beim Rendern von Karten, Blöcken und Komponenten
summary: Semantische Nachrichtenkarten, Schaltflächen, Auswahlfelder, Fallback-Text und Zustellhinweise für Kanal-Plugins
title: Nachrichtendarstellung
x-i18n:
    generated_at: "2026-05-10T19:44:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

Nachrichtendarstellung ist der gemeinsame Vertrag von OpenClaw für reichhaltige ausgehende Chat-UI.
Sie ermöglicht Agents, CLI-Befehlen, Genehmigungsabläufen und Plugins, die
Nachrichtenabsicht einmal zu beschreiben, während jedes Channel-Plugin die beste native Form rendert, die es kann.

Verwenden Sie Darstellung für portable Nachrichten-UI:

- Textabschnitte
- kleiner Kontext-/Footer-Text
- Trennlinien
- Schaltflächen
- Auswahlmenüs
- Kartentitel und Tonalität

Fügen Sie dem gemeinsamen Nachrichtentool keine neuen Provider-nativen Felder wie Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` oder Feishu `card` hinzu. Das sind Renderer-Ausgaben, die dem Channel-Plugin gehören.

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

Semantik von Schaltflächen:

- `value` ist ein Anwendungsaktionswert, der über den vorhandenen Interaktionspfad des Channels zurückgeleitet wird, wenn der Channel anklickbare Steuerelemente unterstützt.
- `url` ist eine Link-Schaltfläche. Sie kann ohne `value` vorhanden sein.
- `label` ist erforderlich und wird auch im Text-Fallback verwendet.
- `style` ist beratend. Renderer sollten nicht unterstützte Stile einem sicheren Standard zuordnen, statt den Versand fehlschlagen zu lassen.

Semantik von Auswahlmenüs:

- `options[].value` ist der ausgewählte Anwendungswert.
- `placeholder` ist beratend und kann von Channels ohne native Unterstützung für Auswahlmenüs ignoriert werden.
- Wenn ein Channel Auswahlmenüs nicht unterstützt, listet der Fallback-Text die Labels auf.

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

Capability-Felder sind absichtlich einfache boolesche Werte. Sie beschreiben, was der
Renderer interaktiv machen kann, nicht jede native Plattformgrenze. Renderer
besitzen weiterhin plattformspezifische Grenzen wie maximale Schaltflächenanzahl, Blockanzahl und
Kartengröße.

## Core-Render-Ablauf

Wenn ein `ReplyPayload` oder eine Nachrichtenaktion `presentation` enthält, führt Core Folgendes aus:

1. Normalisiert die Darstellungs-Payload.
2. Löst den ausgehenden Adapter des Ziel-Channels auf.
3. Liest `presentationCapabilities`.
4. Ruft `renderPresentation` auf, wenn der Adapter die Payload rendern kann.
5. Fällt auf konservativen Text zurück, wenn der Adapter fehlt oder nicht rendern kann.
6. Sendet die resultierende Payload über den normalen Zustellpfad des Channels.
7. Wendet Zustellungsmetadaten wie `delivery.pin` nach der ersten erfolgreich
   gesendeten Nachricht an.

Core besitzt das Fallback-Verhalten, damit Producer channel-agnostisch bleiben können. Channel-Plugins
besitzen natives Rendering und Interaktionsbehandlung.

## Degradationsregeln

Darstellung muss auf eingeschränkten Channels sicher versendet werden können.

Fallback-Text enthält:

- `title` als erste Zeile
- `text`-Blöcke als normale Absätze
- `context`-Blöcke als kompakte Kontextzeilen
- `divider`-Blöcke als visuelles Trennelement
- Schaltflächenlabels, einschließlich URLs für Link-Schaltflächen
- Labels von Auswahloptionen

Nicht unterstützte native Steuerelemente sollten degradieren, statt den gesamten Versand fehlschlagen zu lassen.
Beispiele:

- Telegram mit deaktivierten Inline-Schaltflächen sendet Text-Fallback.
- Ein Channel ohne Unterstützung für Auswahlmenüs listet Auswahloptionen als Text auf.
- Eine reine URL-Schaltfläche wird entweder zu einer nativen Link-Schaltfläche oder zu einer Fallback-URL-Zeile.
- Optionale Fehler beim Anheften lassen die zugestellte Nachricht nicht fehlschlagen.

Die wichtigste Ausnahme ist `delivery.pin.required: true`; wenn Anheften als
erforderlich angefordert wird und der Channel die gesendete Nachricht nicht anheften kann, meldet die Zustellung einen Fehler.

## Provider-Zuordnung

Aktuelle gebündelte Renderer:

| Channel         | Natives Render-Ziel                | Hinweise                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponenten und Komponentencontainer | Behält das ältere `channelData.discord.components` für vorhandene Provider-native Payload-Producer bei, neue gemeinsame Sends sollten jedoch `presentation` verwenden. |
| Slack           | Block Kit                           | Behält das ältere `channelData.slack.blocks` für vorhandene Provider-native Payload-Producer bei, neue gemeinsame Sends sollten jedoch `presentation` verwenden.       |
| Telegram        | Text plus Inline-Tastaturen          | Schaltflächen/Auswahlmenüs erfordern Inline-Schaltflächen-Capability für die Zieloberfläche; andernfalls wird Text-Fallback verwendet.                                         |
| Mattermost      | Text plus interaktive Props         | Andere Blöcke degradieren zu Text.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | Reiner `message`-Text wird mit der Karte eingeschlossen, wenn beides bereitgestellt wird.                                                                            |
| Feishu          | Interaktive Karten                   | Der Kartenkopf kann `title` verwenden; der Body vermeidet, diesen Titel zu duplizieren.                                                                                  |
| Plain-Channels  | Text-Fallback                       | Channels ohne Renderer erhalten trotzdem lesbare Ausgabe.                                                                                            |

Provider-native Payload-Kompatibilität ist eine Übergangshilfe für vorhandene
Reply-Producer. Sie ist kein Grund, neue gemeinsame native Felder hinzuzufügen.

## Presentation vs InteractiveReply

`InteractiveReply` ist die ältere interne Teilmenge, die von Genehmigungs- und Interaktionshelfern
verwendet wird. Sie unterstützt:

- Text
- Schaltflächen
- Auswahlmenüs

`MessagePresentation` ist der kanonische gemeinsame Send-Vertrag. Er fügt hinzu:

- Titel
- Tonalität
- Kontext
- Trennlinie
- Nur-URL-Schaltflächen
- generische Zustellungsmetadaten über `ReplyPayload.delivery`

Verwenden Sie Helfer aus `openclaw/plugin-sdk/interactive-runtime`, wenn Sie älteren
Code überbrücken:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Neuer Code sollte `MessagePresentation` direkt akzeptieren oder erzeugen.

`presentationToInteractiveReply(...)` bewahrt sichtbaren Darstellungstext, indem
Titel, Text, Kontext, Schaltflächen und Auswahlmenüs in die ältere
`InteractiveReply`-Form abgebildet werden. Komponenten-Renderer, die Titel, Text,
Kontext und Trennlinienblöcke bereits nativ zeichnen, sollten stattdessen
`presentationToInteractiveControlsReply(...)` verwenden und dann nur die
Schaltflächen- und Auswahlsteuerelemente anhängen.

`renderMessagePresentationFallbackText(...)` gibt für
Darstellungsblöcke ohne Text-Fallback, etwa eine Nur-Trennlinie-Darstellung,
eine leere Zeichenfolge zurück. Transports, die einen nicht leeren Send-Body erfordern, können
`emptyFallback` übergeben, um einen minimalen Body zu aktivieren, ohne den standardmäßigen Fallback-Vertrag
zu ändern.

## Anheften bei Zustellung

Anheften ist Zustellungsverhalten, keine Darstellung. Verwenden Sie `delivery.pin` statt
Provider-nativer Felder wie `channelData.telegram.pin`.

Semantik:

- `pin: true` heftet die erste erfolgreich zugestellte Nachricht an.
- `pin.notify` ist standardmäßig `false`.
- `pin.required` ist standardmäßig `false`.
- Optionale Fehler beim Anheften degradieren und lassen die gesendete Nachricht intakt.
- Erforderliche Fehler beim Anheften lassen die Zustellung fehlschlagen.
- Aufgeteilte Nachrichten heften das erste zugestellte Chunk an, nicht das letzte Chunk.

Manuelle Nachrichtenaktionen `pin`, `unpin` und `pins` existieren weiterhin für vorhandene
Nachrichten, bei denen der Provider diese Operationen unterstützt.

## Checkliste für Plugin-Autoren

- Deklarieren Sie `presentation` aus `describeMessageTool(...)`, wenn der Channel
  semantische Darstellung rendern oder sicher degradieren kann.
- Fügen Sie `presentationCapabilities` zum ausgehenden Runtime-Adapter hinzu.
- Implementieren Sie `renderPresentation` in Runtime-Code, nicht im Control-Plane-Plugin-
  Setup-Code.
- Halten Sie native UI-Bibliotheken aus heißen Setup-/Katalogpfaden heraus.
- Bewahren Sie Plattformgrenzen im Renderer und in Tests.
- Fügen Sie Fallback-Tests für nicht unterstützte Schaltflächen, Auswahlmenüs, URL-Schaltflächen, Titel-/Text-
  Duplizierung und gemischte `message`-plus-`presentation`-Sends hinzu.
- Fügen Sie Unterstützung für Anheften bei Zustellung über `deliveryCapabilities.pin` und
  `pinDeliveredMessage` nur hinzu, wenn der Provider die gesendete Nachrichten-ID anheften kann.
- Legen Sie keine neuen Provider-nativen Karten-/Block-/Komponenten-/Schaltflächenfelder über
  das gemeinsame Nachrichtenaktionsschema offen.

## Zugehörige Dokumentation

- [Nachrichten-CLI](/de/cli/message)
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-Architektur](/de/plugins/architecture-internals#message-tool-schemas)
- [Refaktorierungsplan für Channel-Darstellung](/de/plan/ui-channels)
