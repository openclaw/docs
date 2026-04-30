---
read_when:
    - Hinzufügen oder Ändern des Renderings von Nachrichtenkarten, Schaltflächen oder Auswahlelementen
    - Erstellen eines Kanal-Plugins, das reichhaltige ausgehende Nachrichten unterstützt
    - Ändern der Darstellung oder Zustellfunktionen des Nachrichtenwerkzeugs
    - Debugging von Provider-spezifischen Rendering-Regressionen bei Karten/Blöcken/Komponenten
summary: Semantische Nachrichtenkarten, Schaltflächen, Auswahlelemente, Fallback-Text und Zustellhinweise für Kanal-Plugins
title: Nachrichtendarstellung
x-i18n:
    generated_at: "2026-04-30T07:06:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

Nachrichtenpräsentation ist der gemeinsame Vertrag von OpenClaw für umfangreiche ausgehende Chat-UI.
Sie ermöglicht Agenten, CLI-Befehlen, Freigabeabläufen und Plugins, die
Nachrichtenabsicht einmal zu beschreiben, während jedes Kanal-Plugin die beste
native Form rendert, die es darstellen kann.

Verwenden Sie Präsentation für portable Nachrichten-UI:

- Textabschnitte
- kleiner Kontext-/Fußzeilentext
- Trennlinien
- Schaltflächen
- Auswahlmenüs
- Kartentitel und Tonalität

Fügen Sie dem gemeinsamen Nachrichtentool keine neuen Provider-nativen Felder
wie Discord `components`, Slack `blocks`, Telegram `buttons`, Teams `card` oder
Feishu `card` hinzu. Das sind Renderer-Ausgaben, die dem Kanal-Plugin gehören.

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

Schaltflächen-Semantik:

- `value` ist ein Aktionswert der Anwendung, der über den vorhandenen
  Interaktionspfad des Kanals zurückgeleitet wird, wenn der Kanal klickbare
  Steuerelemente unterstützt.
- `url` ist eine Link-Schaltfläche. Sie kann ohne `value` existieren.
- `label` ist erforderlich und wird auch im Text-Fallback verwendet.
- `style` ist eine Empfehlung. Renderer sollten nicht unterstützte Stile auf
  einen sicheren Standard abbilden und den Versand nicht fehlschlagen lassen.

Auswahl-Semantik:

- `options[].value` ist der ausgewählte Anwendungswert.
- `placeholder` ist eine Empfehlung und kann von Kanälen ohne native
  Auswahlunterstützung ignoriert werden.
- Wenn ein Kanal keine Auswahlfelder unterstützt, listet der Fallback-Text die
  Beschriftungen auf.

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

Kanal-Plugins deklarieren Render-Unterstützung in ihrem ausgehenden Adapter:

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

Capability-Felder sind absichtlich einfache boolesche Werte. Sie beschreiben,
was der Renderer interaktiv machen kann, nicht jedes native Plattformlimit.
Renderer besitzen weiterhin plattformspezifische Limits wie maximale Anzahl von
Schaltflächen, Blockanzahl und Kartengröße.

## Core-Renderablauf

Wenn ein `ReplyPayload` oder eine Nachrichtenaktion `presentation` enthält,
führt Core Folgendes aus:

1. Normalisiert die Präsentationsnutzlast.
2. Löst den ausgehenden Adapter des Zielkanals auf.
3. Liest `presentationCapabilities`.
4. Ruft `renderPresentation` auf, wenn der Adapter die Nutzlast rendern kann.
5. Fällt auf konservativen Text zurück, wenn der Adapter fehlt oder nicht
   rendern kann.
6. Sendet die resultierende Nutzlast über den normalen Zustellungspfad des
   Kanals.
7. Wendet Zustellungsmetadaten wie `delivery.pin` nach der ersten erfolgreich
   gesendeten Nachricht an.

Core besitzt das Fallback-Verhalten, damit Producer kanalunabhängig bleiben
können. Kanal-Plugins besitzen natives Rendering und Interaktionsbehandlung.

## Degradationsregeln

Präsentation muss auf eingeschränkten Kanälen sicher versendbar sein.

Fallback-Text enthält:

- `title` als erste Zeile
- `text`-Blöcke als normale Absätze
- `context`-Blöcke als kompakte Kontextzeilen
- `divider`-Blöcke als visuelle Trennlinie
- Schaltflächenbeschriftungen, einschließlich URLs für Link-Schaltflächen
- Beschriftungen von Auswahloptionen

Nicht unterstützte native Steuerelemente sollten degradiert werden, statt den
gesamten Versand fehlschlagen zu lassen. Beispiele:

- Telegram mit deaktivierten Inline-Schaltflächen sendet Text-Fallback.
- Ein Kanal ohne Auswahlunterstützung listet Auswahloptionen als Text auf.
- Eine Nur-URL-Schaltfläche wird entweder zu einer nativen Link-Schaltfläche
  oder zu einer Fallback-URL-Zeile.
- Optionale Fehler beim Anheften lassen die zugestellte Nachricht nicht
  fehlschlagen.

Die wichtigste Ausnahme ist `delivery.pin.required: true`; wenn Anheften als
erforderlich angefordert wird und der Kanal die gesendete Nachricht nicht
anheften kann, meldet die Zustellung einen Fehler.

## Provider-Zuordnung

Aktuelle gebündelte Renderer:

| Kanal           | Natives Render-Ziel                | Hinweise                                                                                                                                                                  |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponenten und Komponentencontainer | Behält das ältere `channelData.discord.components` für bestehende Provider-native Nutzlast-Producer bei, neue gemeinsame Sendungen sollten jedoch `presentation` verwenden. |
| Slack           | Block Kit                          | Behält das ältere `channelData.slack.blocks` für bestehende Provider-native Nutzlast-Producer bei, neue gemeinsame Sendungen sollten jedoch `presentation` verwenden.       |
| Telegram        | Text plus Inline-Tastaturen        | Schaltflächen/Auswahlfelder erfordern Inline-Schaltflächen-Capability für die Zieloberfläche; andernfalls wird Text-Fallback verwendet.                                    |
| Mattermost      | Text plus interaktive Props        | Andere Blöcke degradieren zu Text.                                                                                                                                        |
| Microsoft Teams | Adaptive Cards                     | Einfacher `message`-Text wird in die Karte aufgenommen, wenn beides bereitgestellt wird.                                                                                  |
| Feishu          | Interaktive Karten                 | Der Kartenkopf kann `title` verwenden; der Inhalt vermeidet, diesen Titel zu duplizieren.                                                                                 |
| Einfache Kanäle | Text-Fallback                      | Kanäle ohne Renderer erhalten dennoch lesbare Ausgabe.                                                                                                                    |

Provider-native Nutzlastkompatibilität ist eine Übergangserleichterung für
bestehende Reply-Producer. Sie ist kein Grund, neue gemeinsame native Felder
hinzuzufügen.

## Präsentation vs. InteractiveReply

`InteractiveReply` ist die ältere interne Teilmenge, die von Freigabe- und
Interaktionshelfern verwendet wird. Sie unterstützt:

- Text
- Schaltflächen
- Auswahlfelder

`MessagePresentation` ist der kanonische gemeinsame Versandvertrag. Es ergänzt:

- Titel
- Tonalität
- Kontext
- Trennlinie
- Nur-URL-Schaltflächen
- generische Zustellungsmetadaten über `ReplyPayload.delivery`

Verwenden Sie Helfer aus `openclaw/plugin-sdk/interactive-runtime`, wenn Sie
älteren Code überbrücken:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Neuer Code sollte `MessagePresentation` direkt akzeptieren oder erzeugen.

## Zustellungsanheftung

Anheften ist Zustellungsverhalten, keine Präsentation. Verwenden Sie
`delivery.pin` statt Provider-nativer Felder wie `channelData.telegram.pin`.

Semantik:

- `pin: true` heftet die erste erfolgreich zugestellte Nachricht an.
- `pin.notify` ist standardmäßig `false`.
- `pin.required` ist standardmäßig `false`.
- Optionale Fehler beim Anheften degradieren und lassen die gesendete Nachricht
  intakt.
- Erforderliche Fehler beim Anheften lassen die Zustellung fehlschlagen.
- Aufgeteilte Nachrichten heften das erste zugestellte Fragment an, nicht das
  letzte Fragment.

Manuelle Nachrichtenaktionen `pin`, `unpin` und `pins` existieren weiterhin für
bestehende Nachrichten, bei denen der Provider diese Operationen unterstützt.

## Checkliste für Plugin-Autoren

- Deklarieren Sie `presentation` aus `describeMessageTool(...)`, wenn der Kanal
  semantische Präsentation rendern oder sicher degradieren kann.
- Fügen Sie `presentationCapabilities` zum ausgehenden Runtime-Adapter hinzu.
- Implementieren Sie `renderPresentation` im Runtime-Code, nicht im
  Control-Plane-Plugin-Einrichtungscode.
- Halten Sie native UI-Bibliotheken aus heißen Setup-/Katalogpfaden heraus.
- Bewahren Sie Plattformlimits im Renderer und in Tests.
- Ergänzen Sie Fallback-Tests für nicht unterstützte Schaltflächen,
  Auswahlfelder, URL-Schaltflächen, Titel-/Textduplizierung und gemischte
  Sendungen mit `message` plus `presentation`.
- Ergänzen Sie Unterstützung für Zustellungsanheftung über
  `deliveryCapabilities.pin` und `pinDeliveredMessage` nur, wenn der Provider
  die ID der gesendeten Nachricht anheften kann.
- Legen Sie keine neuen Provider-nativen Karten-/Block-/Komponenten-/
  Schaltflächenfelder über das gemeinsame Nachrichtenaktionsschema offen.

## Verwandte Dokumentation

- [Nachrichten-CLI](/de/cli/message)
- [Plugin-SDK-Überblick](/de/plugins/sdk-overview)
- [Plugin-Architektur](/de/plugins/architecture-internals#message-tool-schemas)
- [Refaktorierungsplan für Kanalpräsentation](/de/plan/ui-channels)
