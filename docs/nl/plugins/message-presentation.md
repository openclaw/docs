---
read_when:
    - Berichtkaart-, knop- of selectieweergave toevoegen of wijzigen
    - Een kanaal-Plugin bouwen dat uitgebreide uitgaande berichten ondersteunt
    - Presentatie- of bezorgmogelijkheden van berichttools wijzigen
    - Foutopsporing van providerspecifieke regressies in de weergave van kaarten, blokken en componenten
summary: Semantische berichtkaarten, knoppen, selecties, terugvaltekst en bezorgingshints voor channel-plugins
title: Berichtpresentatie
x-i18n:
    generated_at: "2026-06-27T17:56:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

Berichtpresentatie is het gedeelde contract van OpenClaw voor rijke uitgaande chat-UI.
Hiermee kunnen agents, CLI-opdrachten, goedkeuringsflows en plugins de berichtintentie
eenmaal beschrijven, terwijl elke kanaalplugin de beste native vorm rendert die mogelijk is.

Gebruik presentatie voor draagbare bericht-UI:

- tekstsecties
- kleine context-/voettekst
- scheidingslijnen
- knoppen
- selectiemenu's
- kaarttitel en toon

Voeg geen nieuwe provider-native velden toe, zoals Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` of Feishu `card`, aan de gedeelde
berichttool. Dat zijn renderer-uitvoerresultaten die eigendom zijn van de kanaalplugin.

## Contract

Plugin-auteurs importeren het publieke contract uit:

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

Knopsemantiek:

- `action.type: "command"` voert een native slash-opdracht uit via het opdrachtpad
  van de core. Gebruik dit voor ingebouwde opdrachtknoppen en menu's.
- `action.type: "callback"` voert ondoorzichtige plugin-data door via het
  interactiepad van het kanaal. Kanaalplugins mogen callback-data niet opnieuw
  interpreteren als slash-opdrachten.
- `value` is de legacy ondoorzichtige callbackwaarde. Nieuwe controls moeten `action`
  gebruiken, zodat kanaalplugins opdrachten en callbacks kunnen toewijzen zonder op
  basis van tekst te hoeven raden.
- `url` is een linkknop. Deze kan bestaan zonder `value`.
- `webApp` beschrijft een kanaal-native webappknop. Telegram rendert dit
  als `web_app` en ondersteunt dit alleen in privéchats. `web_app` wordt nog steeds
  geaccepteerd in losse JSON-payloads voor compatibiliteit, maar TypeScript-producenten
  moeten `webApp` gebruiken.
- `label` is verplicht en wordt ook gebruikt in de tekstfallback.
- `style` is adviserend. Renderers moeten niet-ondersteunde stijlen toewijzen aan een veilige
  standaardwaarde, niet het verzenden laten mislukken.
- `priority` is optioneel. Wanneer een kanaal actielimieten adverteert en controls
  moeten worden verwijderd, behoudt core eerst knoppen met hogere prioriteit en bewaart
  de oorspronkelijke volgorde tussen knoppen met gelijke prioriteit. Wanneer alle controls passen,
  blijft de gemaakte volgorde behouden.
- `disabled` is optioneel. Kanalen moeten zich aanmelden met `supportsDisabled`; anders
  degradeert core de uitgeschakelde control naar niet-interactieve fallbacktekst.
- `reusable` is optioneel. Kanalen die herbruikbare native callbacks ondersteunen, mogen
  de actie beschikbaar houden na een succesvolle interactie. Gebruik dit voor
  herhaalbare of idempotente acties zoals vernieuwen, inspecteren of meer details;
  laat dit leeg voor normale eenmalige goedkeuringen en destructieve acties.

Selectiesemantiek:

- `options[].action` heeft dezelfde opdracht-/callbackbetekenis als knop-`action`.
- `options[].value` is de legacy geselecteerde applicatiewaarde.
- `placeholder` is adviserend en kan worden genegeerd door kanalen zonder native
  selectieondersteuning.
- Als een kanaal geen selecties ondersteunt, vermeldt fallbacktekst de labels.

## Producentvoorbeelden

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

Telegram Mini App-knop:

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

Vastgezette levering:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Vastgezette levering met expliciete JSON:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Renderer-contract

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

Capability-booleans beschrijven wat de renderer interactief kan maken. Optionele
`limits` beschrijven de generieke envelop die core kan aanpassen voordat de
renderer wordt aangeroepen:

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

Core past generieke limieten toe op semantische controls vóór het renderen. Renderers
blijven eigenaar van definitieve provider-specifieke validatie en inkorting voor native bloktellingen,
kaartgrootte, URL-limieten en provider-eigenaardigheden die niet in
het generieke contract kunnen worden uitgedrukt. Als limieten elke control uit een blok verwijderen, behoudt core
de labels als niet-interactieve contexttekst, zodat het geleverde bericht nog steeds een
zichtbare fallback heeft.

## Core-renderflow

Wanneer een `ReplyPayload` of berichtactie `presentation` bevat, doet core het volgende:

1. Normaliseert de presentatiepayload.
2. Lost de uitgaande adapter van het doelkanaal op.
3. Leest `presentationCapabilities`.
4. Past generieke capability-limieten toe, zoals actietelling, labellengte en
   aantal selectieopties wanneer de adapter ze adverteert.
5. Roept `renderPresentation` aan wanneer de adapter de payload kan renderen.
6. Valt terug op conservatieve tekst wanneer de adapter ontbreekt of niet kan renderen.
7. Verzendt de resulterende payload via het normale leveringspad van het kanaal.
8. Past leveringsmetadata toe, zoals `delivery.pin`, na het eerste succesvol
   verzonden bericht.

Core is eigenaar van fallbackgedrag, zodat producenten kanaalagnostisch kunnen blijven. Kanaalplugins
zijn eigenaar van native rendering en interactieafhandeling.

## Degradatieregels

Presentatie moet veilig te verzenden zijn op beperkte kanalen.

Fallbacktekst bevat:

- `title` als eerste regel
- `text`-blokken als normale alinea's
- `context`-blokken als compacte contextregels
- `divider`-blokken als visuele scheidingslijn
- knoplabels, inclusief URL's voor linkknoppen
- labels van selectieopties

Niet-ondersteunde native controls moeten degraderen in plaats van de hele verzending te laten mislukken.
Voorbeelden:

- Telegram met uitgeschakelde inlineknoppen verzendt tekstfallback.
- Een kanaal zonder selectieondersteuning vermeldt selectieopties als tekst.
- Een knop met alleen URL wordt ofwel een native linkknop of een fallback-URL-regel.
- Optionele pinfouten laten het geleverde bericht niet mislukken.

De belangrijkste uitzondering is `delivery.pin.required: true`; als vastzetten als
verplicht is aangevraagd en het kanaal het verzonden bericht niet kan vastzetten, meldt levering een fout.

## Provider-toewijzing

Huidige gebundelde renderers:

| Kanaal          | Native renderdoel                   | Opmerkingen                                                                                                                                       |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componenten en componentcontainers  | Behoudt legacy `channelData.discord.components` voor bestaande provider-native payloadproducenten, maar nieuwe gedeelde verzendingen moeten `presentation` gebruiken. |
| Slack           | Block Kit                           | Behoudt legacy `channelData.slack.blocks` voor bestaande provider-native payloadproducenten, maar nieuwe gedeelde verzendingen moeten `presentation` gebruiken.       |
| Telegram        | Tekst plus inline toetsenborden     | Knoppen/selecties vereisen inlineknop-capability voor het doeloppervlak; anders wordt tekstfallback gebruikt.                                      |
| Mattermost      | Tekst plus interactieve props       | Andere blokken degraderen naar tekst.                                                                                                             |
| Microsoft Teams | Adaptive Cards                      | Platte `message`-tekst wordt opgenomen met de kaart wanneer beide worden opgegeven.                                                               |
| Feishu          | Interactieve kaarten                | Kaartkop kan `title` gebruiken; body vermijdt duplicatie van die titel.                                                                           |
| Eenvoudige kanalen | Tekstfallback                    | Kanalen zonder renderer krijgen nog steeds leesbare uitvoer.                                                                                      |

Provider-native payloadcompatibiliteit is een overgangsvoorziening voor bestaande
antwoordproducenten. Het is geen reden om nieuwe gedeelde native velden toe te voegen.

## Presentatie vs InteractiveReply

`InteractiveReply` is de oudere interne subset die wordt gebruikt door goedkeurings- en interactiehelpers. Deze ondersteunt:

- tekst
- knoppen
- selecties

`MessagePresentation` is het canonieke gedeelde verzendcontract. Het voegt toe:

- titel
- toon
- context
- scheidingslijn
- knoppen met alleen URL's
- generieke bezorgmetadata via `ReplyPayload.delivery`

Gebruik helpers uit `openclaw/plugin-sdk/interactive-runtime` bij het overbruggen van oudere
code:

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

Nieuwe code moet `MessagePresentation` direct accepteren of produceren. Bestaande
`interactive`-payloads zijn een verouderde subset van `presentation`; runtime-ondersteuning
blijft bestaan voor oudere producenten.

De legacy `InteractiveReply*`-typen en conversiehelpers zijn in de SDK gemarkeerd als
`@deprecated`:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, en
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` en
`presentationToInteractiveControlsReply(...)` blijven beschikbaar als rendererbruggen
voor legacy kanaalimplementaties. Nieuwe producentcode mag ze niet aanroepen;
verzend `presentation` en laat core-/kanaalaanpassing de rendering afhandelen.

Goedkeuringshelpers hebben ook presentation-first vervangingen:

- gebruik `buildApprovalPresentationFromActionDescriptors(...)` in plaats van
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- gebruik `buildApprovalPresentation(...)` in plaats van
  `buildApprovalInteractiveReply(...)`
- gebruik `buildExecApprovalPresentation(...)` in plaats van
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` retourneert een lege string voor
presentatieblokken die geen tekstfallback hebben, zoals een presentatie met alleen
een scheidingslijn. Transports die een niet-lege verzendbody vereisen, kunnen
`emptyFallback` doorgeven om te kiezen voor een minimale body zonder het standaard
fallbackcontract te wijzigen.

## Bezorgpin

Pinnen is bezorggedrag, geen presentatie. Gebruik `delivery.pin` in plaats van
provider-native velden zoals `channelData.telegram.pin`.

Semantiek:

- `pin: true` pint het eerste succesvol bezorgde bericht.
- `pin.notify` is standaard `false`.
- `pin.required` is standaard `false`.
- Optionele pinfouten worden afgezwakt en laten het verzonden bericht intact.
- Vereiste pinfouten laten de bezorging mislukken.
- Berichten in chunks pinnen de eerste bezorgde chunk, niet de laatste chunk.

Handmatige berichtacties `pin`, `unpin` en `pins` blijven bestaan voor bestaande
berichten waarvoor de provider deze bewerkingen ondersteunt.

## Checklist voor Plugin-auteurs

- Declareer `presentation` vanuit `describeMessageTool(...)` wanneer het kanaal
  semantische presentatie kan renderen of veilig kan afzwakken.
- Voeg `presentationCapabilities` toe aan de runtime outbound-adapter.
- Implementeer `renderPresentation` in runtimecode, niet in control-plane Plugin-
  setupcode.
- Houd native UI-bibliotheken buiten hot setup-/cataloguspaden.
- Declareer generieke capaciteitslimieten op `presentationCapabilities.limits` wanneer
  ze bekend zijn.
- Behoud uiteindelijke platformlimieten in de renderer en tests.
- Voeg fallbacktests toe voor niet-ondersteunde knoppen, selecties, URL-knoppen, titel-/tekstduplicatie
  en gemengde verzendingen met `message` plus `presentation`.
- Voeg ondersteuning voor bezorgpinnen toe via `deliveryCapabilities.pin` en
  `pinDeliveredMessage` alleen wanneer de provider de id van het verzonden bericht kan pinnen.
- Stel geen nieuwe provider-native kaart-/blok-/component-/knopvelden bloot via
  het gedeelde schema voor berichtacties.

## Gerelateerde docs

- [Bericht-CLI](/nl/cli/message)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
- [Plugin-architectuur](/nl/plugins/architecture-internals#message-tool-schemas)
- [Refactorplan voor kanaalpresentatie](/nl/plan/ui-channels)
