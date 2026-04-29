---
read_when:
    - Berichtkaart-, knop- of keuzelijstweergave toevoegen of wijzigen
    - Een Plugin voor een kanaal bouwen die uitgebreide uitgaande berichten ondersteunt
    - De presentatie of afleveringsmogelijkheden van berichttools wijzigen
    - Debuggen van providerspecifieke renderingregressies voor kaarten/blokken/componenten
summary: Semantische berichtkaarten, knoppen, selectievakken, fallbacktekst en afleveringshints voor kanaalplugins
title: Berichtweergave
x-i18n:
    generated_at: "2026-04-29T23:04:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

Berichtpresentatie is het gedeelde contract van OpenClaw voor rijke uitgaande chat-UI.
Hiermee kunnen agents, CLI-opdrachten, goedkeuringsflows en plugins de berichtintentie
één keer beschrijven, terwijl elke kanaalplugin de best mogelijke native vorm rendert.

Gebruik presentation voor draagbare bericht-UI:

- tekstsecties
- kleine context-/voettekst
- scheidingslijnen
- knoppen
- selectiemenu's
- kaarttitel en toon

Voeg geen nieuwe provider-native velden toe, zoals Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` of Feishu `card`, aan de gedeelde
berichttool. Dit zijn rendereruitvoerwaarden die eigendom zijn van de kanaalplugin.

## Contract

Plugin-auteurs importeren het openbare contract vanuit:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Vorm:

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

Knopsemantiek:

- `value` is een applicatieactiewaarde die wordt teruggeleid via het bestaande
  interactiepad van het kanaal wanneer het kanaal klikbare besturingselementen ondersteunt.
- `url` is een linkknop. Deze kan bestaan zonder `value`.
- `label` is verplicht en wordt ook gebruikt in de tekstfallback.
- `style` is adviserend. Renderers moeten niet-ondersteunde stijlen toewijzen aan een veilige
  standaardwaarde, niet het verzenden laten mislukken.

Selectiesemantiek:

- `options[].value` is de geselecteerde applicatiewaarde.
- `placeholder` is adviserend en kan worden genegeerd door kanalen zonder native
  selectieondersteuning.
- Als een kanaal selecties niet ondersteunt, vermeldt fallbacktekst de labels.

## Voorbeelden voor producenten

Eenvoudige kaart:

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

Linkknop met alleen URL:

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

Selectiemenu:

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

CLI-verzending:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Vastgezette bezorging:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Vastgezette bezorging met expliciete JSON:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Renderercontract

Kanaalplugins declareren renderondersteuning op hun uitgaande adapter:

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

Capaciteitsvelden zijn bewust eenvoudige booleans. Ze beschrijven wat de
renderer interactief kan maken, niet elke native platformlimiet. Renderers blijven
eigenaar van platformspecifieke limieten, zoals het maximale aantal knoppen,
het aantal blokken en de kaartgrootte.

## Kernrenderflow

Wanneer een `ReplyPayload` of berichtactie `presentation` bevat, doet core het volgende:

1. Normaliseert de presentatiepayload.
2. Lost de uitgaande adapter van het doelkanaal op.
3. Leest `presentationCapabilities`.
4. Roept `renderPresentation` aan wanneer de adapter de payload kan renderen.
5. Valt terug op conservatieve tekst wanneer de adapter ontbreekt of niet kan renderen.
6. Verzendt de resulterende payload via het normale bezorgpad van het kanaal.
7. Past bezorgmetadata zoals `delivery.pin` toe na het eerste succesvol
   verzonden bericht.

Core is eigenaar van fallbackgedrag, zodat producenten kanaalagnostisch kunnen blijven. Kanaalplugins
zijn eigenaar van native rendering en interactieafhandeling.

## Degradatieregels

Presentatie moet veilig te verzenden zijn op beperkte kanalen.

Fallbacktekst bevat:

- `title` als de eerste regel
- `text`-blokken als normale alinea's
- `context`-blokken als compacte contextregels
- `divider`-blokken als visueel scheidingsteken
- knoplabels, inclusief URL's voor linkknoppen
- labels van selectieopties

Niet-ondersteunde native besturingselementen moeten degraderen in plaats van de hele verzending te laten mislukken.
Voorbeelden:

- Telegram met uitgeschakelde inlineknoppen verzendt tekstfallback.
- Een kanaal zonder selectieondersteuning vermeldt selectieopties als tekst.
- Een knop met alleen URL wordt een native linkknop of een fallback-URL-regel.
- Optionele pinfouten laten het bezorgde bericht niet mislukken.

De belangrijkste uitzondering is `delivery.pin.required: true`; als vastzetten als
verplicht is aangevraagd en het kanaal het verzonden bericht niet kan vastzetten, rapporteert bezorging een fout.

## Providertoewijzing

Huidige gebundelde renderers:

| Kanaal          | Native renderdoel                   | Opmerkingen                                                                                                                                          |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componenten en componentcontainers  | Behoudt legacy `channelData.discord.components` voor bestaande provider-native payloadproducenten, maar nieuwe gedeelde verzendingen moeten `presentation` gebruiken. |
| Slack           | Block Kit                           | Behoudt legacy `channelData.slack.blocks` voor bestaande provider-native payloadproducenten, maar nieuwe gedeelde verzendingen moeten `presentation` gebruiken.       |
| Telegram        | Tekst plus inline toetsenborden     | Knoppen/selecties vereisen inlineknopcapaciteit voor het doeloppervlak; anders wordt tekstfallback gebruikt.                                          |
| Mattermost      | Tekst plus interactieve props       | Andere blokken degraderen naar tekst.                                                                                                                |
| Microsoft Teams | Adaptive Cards                      | Platte `message`-tekst wordt met de kaart opgenomen wanneer beide worden opgegeven.                                                                   |
| Feishu          | Interactieve kaarten                | Kaartkop kan `title` gebruiken; body vermijdt duplicatie van die titel.                                                                               |
| Gewone kanalen  | Tekstfallback                       | Kanalen zonder renderer krijgen nog steeds leesbare uitvoer.                                                                                         |

Compatibiliteit met provider-native payloads is een overgangsvoorziening voor bestaande
antwoordproducenten. Het is geen reden om nieuwe gedeelde native velden toe te voegen.

## Presentation versus InteractiveReply

`InteractiveReply` is de oudere interne subset die wordt gebruikt door goedkeurings- en interactiehelpers.
Deze ondersteunt:

- tekst
- knoppen
- selecties

`MessagePresentation` is het canonieke gedeelde verzendcontract. Het voegt toe:

- titel
- toon
- context
- scheidingslijn
- knoppen met alleen URL
- generieke bezorgmetadata via `ReplyPayload.delivery`

Gebruik helpers uit `openclaw/plugin-sdk/interactive-runtime` bij het overbruggen van oudere
code:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Nieuwe code moet `MessagePresentation` direct accepteren of produceren.

## Bezorgpin

Vastzetten is bezorggedrag, geen presentatie. Gebruik `delivery.pin` in plaats van
provider-native velden zoals `channelData.telegram.pin`.

Semantiek:

- `pin: true` zet het eerste succesvol bezorgde bericht vast.
- `pin.notify` heeft standaardwaarde `false`.
- `pin.required` heeft standaardwaarde `false`.
- Optionele pinfouten degraderen en laten het verzonden bericht intact.
- Vereiste pinfouten laten bezorging mislukken.
- Berichten in chunks zetten de eerste bezorgde chunk vast, niet de laatste chunk.

Handmatige `pin`-, `unpin`- en `pins`-berichtacties blijven bestaan voor bestaande
berichten waar de provider die bewerkingen ondersteunt.

## Checklist voor Plugin-auteurs

- Declareer `presentation` vanuit `describeMessageTool(...)` wanneer het kanaal
  semantische presentatie kan renderen of veilig kan degraderen.
- Voeg `presentationCapabilities` toe aan de uitgaande runtime-adapter.
- Implementeer `renderPresentation` in runtimecode, niet in control-plane plugin-
  setupcode.
- Houd native UI-bibliotheken uit hete setup-/cataloguspaden.
- Behoud platformlimieten in de renderer en tests.
- Voeg fallbacktests toe voor niet-ondersteunde knoppen, selecties, URL-knoppen, duplicatie van titel/tekst
  en gemengde verzendingen met `message` plus `presentation`.
- Voeg ondersteuning voor bezorgpin toe via `deliveryCapabilities.pin` en
  `pinDeliveredMessage` alleen wanneer de provider de verzonden bericht-id kan vastzetten.
- Stel geen nieuwe provider-native kaart-/blok-/component-/knopvelden bloot via
  het gedeelde schema voor berichtacties.

## Gerelateerde docs

- [Bericht-CLI](/nl/cli/message)
- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Plugin-architectuur](/nl/plugins/architecture-internals#message-tool-schemas)
- [Refactorplan voor kanaalpresentatie](/nl/plan/ui-channels)
