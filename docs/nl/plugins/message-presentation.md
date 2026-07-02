---
read_when:
    - Berichtkaart-, knop- of selectieweergave toevoegen of wijzigen
    - Een kanaalplugin bouwen die uitgebreide uitgaande berichten ondersteunt
    - Presentatie van berichtentools of bezorgingsmogelijkheden wijzigen
    - Foutopsporing van providerspecifieke regressies in kaart-/blok-/componentweergave
summary: Semantische berichtkaarten, knoppen, selectievakken, terugvaltekst en bezorgingshints voor kanaalplugins
title: Berichtpresentatie
x-i18n:
    generated_at: "2026-07-02T22:38:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

Berichtpresentatie is het gedeelde contract van OpenClaw voor rijke uitgaande chat-UI.
Hiermee kunnen agents, CLI-opdrachten, goedkeuringsflows en plugins de berichtintentie
eenmaal beschrijven, terwijl elke kanaalplugin de best mogelijke native vorm rendert.

Gebruik presentatie voor overdraagbare bericht-UI:

- tekstsecties
- kleine context-/voettekst
- scheidingslijnen
- knoppen
- keuzemenu's
- kaarttitel en toon

Voeg geen nieuwe provider-native velden toe, zoals Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` of Feishu `card`, aan de gedeelde
berichttool. Dat zijn renderer-uitvoerwaarden die eigendom zijn van de kanaalplugin.

## Contract

Plugin-auteurs importeren het openbare contract uit:

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
  van de kern. Gebruik dit voor ingebouwde opdrachtknoppen en menu's.
- `action.type: "callback"` draagt ondoorzichtige Plugin-gegevens over via het
  interactiepad van het kanaal. Kanaalplugins mogen callbackgegevens niet opnieuw
  interpreteren als slash-opdrachten.
- `value` is de oude ondoorzichtige callbackwaarde. Nieuwe bedieningselementen moeten
  `action` gebruiken zodat kanaalplugins opdrachten en callbacks kunnen mappen zonder
  op basis van tekst te hoeven gokken.
- `url` is een linkknop. Deze kan zonder `value` bestaan.
- `webApp` beschrijft een kanaal-native webappknop. Telegram rendert dit als
  `web_app` en ondersteunt dit alleen in privéchats. `web_app` wordt nog steeds
  geaccepteerd in losse JSON-payloads voor compatibiliteit, maar TypeScript-producenten
  moeten `webApp` gebruiken.
- `label` is verplicht en wordt ook gebruikt in tekstterugval.
- `style` is adviserend. Renderers moeten niet-ondersteunde stijlen mappen naar een
  veilige standaardwaarde, en de verzending niet laten mislukken.
- `priority` is optioneel. Wanneer een kanaal actielimieten adverteert en bedieningselementen
  moeten worden weggelaten, behoudt de kern eerst knoppen met hogere prioriteit en bewaart
  de oorspronkelijke volgorde tussen knoppen met gelijke prioriteit. Wanneer alle
  bedieningselementen passen, blijft de geschreven volgorde behouden.
- `disabled` is optioneel. Kanalen moeten zich aanmelden met `supportsDisabled`; anders
  degradeert de kern het uitgeschakelde bedieningselement naar niet-interactieve
  terugvaltekst.
- `reusable` is optioneel. Kanalen die herbruikbare native callbacks ondersteunen, kunnen
  de actie beschikbaar houden na een geslaagde interactie. Gebruik dit voor herhaalbare of
  idempotente acties zoals vernieuwen, inspecteren of meer details; laat het leeg voor
  normale eenmalige goedkeuringen en destructieve acties.

Selectiesemantiek:

- `options[].action` heeft dezelfde opdracht-/callbackbetekenis als knop-`action`.
- `options[].value` is de oude geselecteerde toepassingswaarde.
- `placeholder` is adviserend en kan worden genegeerd door kanalen zonder native
  selectieondersteuning.
- Als een kanaal geen selecties ondersteunt, vermeldt terugvaltekst de labels.

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

Knop met alleen URL-link:

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

Keuzemenu:

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

Capaciteitsbooleans beschrijven wat de renderer interactief kan maken. Optionele
`limits` beschrijven de generieke envelop die de kern kan aanpassen voordat de
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

De kern past generieke limieten toe op semantische bedieningselementen voordat wordt
gerenderd. Renderers blijven eigenaar van de uiteindelijke provider-specifieke
validatie en inkorting voor native bloktellingen, kaartgrootte, URL-limieten en
provider-eigenaardigheden die niet in het generieke contract kunnen worden uitgedrukt.
Als limieten elk bedieningselement uit een blok verwijderen, behoudt de kern de labels
als niet-interactieve contexttekst, zodat het geleverde bericht nog steeds een zichtbare
terugval heeft.

## Kernrenderflow

Wanneer een `ReplyPayload` of berichtactie `presentation` bevat, doet de kern het volgende:

1. Normaliseert de presentatiepayload.
2. Lost de uitgaande adapter van het doelkanaal op.
3. Leest `presentationCapabilities`.
4. Past generieke capaciteitslimieten toe, zoals actietelling, labellengte en
   aantal selectieopties wanneer de adapter die adverteert.
5. Roept `renderPresentation` aan wanneer de adapter de payload kan renderen.
6. Valt terug op conservatieve tekst wanneer de adapter ontbreekt of niet kan renderen.
7. Verzendt de resulterende payload via het normale kanaalleveringspad.
8. Past leveringsmetadata zoals `delivery.pin` toe na het eerste succesvol verzonden
   bericht.

De kern is eigenaar van terugvalgedrag, zodat producenten kanaalonafhankelijk kunnen blijven.
Kanaalplugins zijn eigenaar van native rendering en interactieafhandeling.

## Degradatieregels

Presentatie moet veilig te verzenden zijn op beperkte kanalen.

Terugvaltekst bevat:

- `title` als eerste regel
- `text`-blokken als normale alinea's
- `context`-blokken als compacte contextregels
- `divider`-blokken als visuele scheidingslijn
- knoplabels, inclusief URL's voor linkknoppen
- labels van selectieopties

### Zichtbaarheid van terugval voor knopwaarden

Wanneer een kanaal geen interactieve bedieningselementen kan renderen, vallen knop- en
selectiewaarden terug naar platte tekst. Het terugvalgedrag behoudt bruikbaarheid terwijl
ondoorzichtige callbackgegevens privé blijven:

- **Acties van het type `command`** renderen als `label: \`command\`` zodat gebruikers
  de opdracht kunnen kopiëren en handmatig kunnen uitvoeren in de kanaalinvoer.
- **Acties van het type `callback`** en oude **`value`**-velden renderen alleen als
  label. De ondoorzichtige callbackwaarde wordt niet weergegeven in terugvaltekst.
- **`url`- / `webApp`**-knoppen renderen de URL-tekst naast het knoplabel, omdat de
  URL zichtbaar is voor de gebruiker.
- **Selectieopties** renderen alleen als label. De onderliggende optiewaarde wordt niet
  weergegeven in terugvaltekst.

Kanaaladapters die handmatige-opdrachtbegeleiding toevoegen in hun terugval-UI (bijv.
Feishu-instructies voor documentcommentaar), moeten de controle op aanwezige opdrachten
afleiden uit dezelfde presentatieblokken die de terugvalrenderer gebruikt, zodat de
begeleidingstekst alleen verschijnt wanneer er daadwerkelijk een handmatige opdracht wordt
getoond.

Niet-ondersteunde native bedieningselementen moeten degraderen in plaats van de hele
verzending te laten mislukken. Voorbeelden:

- Telegram met uitgeschakelde inlineknoppen verzendt tekstterugval.
- Een kanaal zonder selectieondersteuning vermeldt selectieopties als tekst.
- Een knop met alleen URL wordt een native linkknop of een terugval-URL-regel.
- Optionele pinfouten laten het geleverde bericht niet mislukken.

De belangrijkste uitzondering is `delivery.pin.required: true`; als vastzetten als verplicht
is aangevraagd en het kanaal het verzonden bericht niet kan vastzetten, rapporteert de
levering een fout.

## Providermapping

Huidige gebundelde renderers:

| Kanaal          | Native renderdoel                   | Opmerkingen                                                                                                                                       |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componenten en componentcontainers  | Behoudt legacy `channelData.discord.components` voor bestaande provider-native payloadproducenten, maar nieuwe gedeelde verzendingen moeten `presentation` gebruiken. |
| Slack           | Block Kit                           | Behoudt legacy `channelData.slack.blocks` voor bestaande provider-native payloadproducenten, maar nieuwe gedeelde verzendingen moeten `presentation` gebruiken.       |
| Telegram        | Tekst plus inline toetsenborden     | Knoppen/selecties vereisen inline-knopcapaciteit voor het doeloppervlak; anders wordt tekstterugval gebruikt.                                      |
| Mattermost      | Tekst plus interactieve props       | Andere blokken degraderen naar tekst.                                                                                                             |
| Microsoft Teams | Adaptive Cards                      | Platte `message`-tekst wordt samen met de kaart opgenomen wanneer beide worden geleverd.                                                          |
| Feishu          | Interactieve kaarten                | Kaartkop kan `title` gebruiken; body vermijdt duplicatie van die titel.                                                                           |
| Platte kanalen  | Tekstterugval                       | Kanalen zonder renderer krijgen nog steeds leesbare uitvoer.                                                                                      |

Provider-native payloadcompatibiliteit is een overgangsvoorziening voor bestaande
antwoordproducenten. Het is geen reden om nieuwe gedeelde native velden toe te voegen.

## Presentatie versus InteractiveReply

`InteractiveReply` is de oudere interne subset die wordt gebruikt door goedkeurings- en interactiehelpers. Deze ondersteunt:

- tekst
- knoppen
- selecties

`MessagePresentation` is het canonieke gedeelde verzendcontract. Het voegt toe:

- titel
- toon
- context
- scheidingslijn
- knoppen met alleen URL
- generieke leveringsmetadata via `ReplyPayload.delivery`

Gebruik helpers uit `openclaw/plugin-sdk/interactive-runtime` bij het overbruggen van oudere
code:
__OC_I18N_900011__
Nieuwe code moet `MessagePresentation` rechtstreeks accepteren of produceren. Bestaande
`interactive`-payloads zijn een verouderde subset van `presentation`; runtime-
ondersteuning blijft bestaan voor oudere producenten.

De legacy `InteractiveReply*`-typen en conversiehelpers zijn gemarkeerd als
`@deprecated` in de SDK:

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
`presentationToInteractiveControlsReply(...)` blijven beschikbaar als renderer-
bruggen voor legacy kanaalimplementaties. Nieuwe producentcode mag ze niet aanroepen;
verzend `presentation` en laat core/kanaalaanpassing de rendering afhandelen.

Goedkeuringshelpers hebben ook presentatie-eerst-vervangingen:

- gebruik `buildApprovalPresentationFromActionDescriptors(...)` in plaats van
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- gebruik `buildApprovalPresentation(...)` in plaats van
  `buildApprovalInteractiveReply(...)`
- gebruik `buildExecApprovalPresentation(...)` in plaats van
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` retourneert een lege string voor
presentatieblokken die geen tekstterugval hebben, zoals een presentatie met alleen een
scheidingslijn. Transports die een niet-lege verzendbody vereisen, kunnen
`emptyFallback` doorgeven om een minimale body te gebruiken zonder het standaardterugvalcontract
te wijzigen.

## Leveringspin

Pinnen is leveringsgedrag, geen presentatie. Gebruik `delivery.pin` in plaats van
provider-native velden zoals `channelData.telegram.pin`.

Semantiek:

- `pin: true` pint het eerste succesvol geleverde bericht.
- `pin.notify` staat standaard op `false`.
- `pin.required` staat standaard op `false`.
- Optionele pinfouten degraderen en laten het verzonden bericht intact.
- Vereiste pinfouten laten levering mislukken.
- Opgeknipte berichten pinnen het eerste geleverde fragment, niet het laatste fragment.

Handmatige `pin`-, `unpin`- en `pins`-berichtacties bestaan nog steeds voor bestaande
berichten waarbij de provider die bewerkingen ondersteunt.

## Plugin-auteurschecklist

- Declareer `presentation` vanuit `describeMessageTool(...)` wanneer het kanaal
  semantische presentatie kan renderen of veilig kan degraderen.
- Voeg `presentationCapabilities` toe aan de runtime outbound adapter.
- Implementeer `renderPresentation` in runtimecode, niet in control-plane Plugin-
  setupcode.
- Houd native UI-bibliotheken uit hete setup-/cataloguspaden.
- Declareer generieke capaciteitslimieten op `presentationCapabilities.limits` wanneer
  ze bekend zijn.
- Behoud de uiteindelijke platformlimieten in de renderer en tests.
- Voeg terugvaltests toe voor niet-ondersteunde knoppen, selecties, URL-knoppen, titel-/tekstduplicatie
  en gemengde verzendingen met `message` plus `presentation`.
- Voeg ondersteuning voor leveringspinnen toe via `deliveryCapabilities.pin` en
  `pinDeliveredMessage` alleen wanneer de provider het id van het verzonden bericht kan pinnen.
- Stel geen nieuwe provider-native kaart-/blok-/component-/knopvelden bloot via
  het gedeelde berichtactieschema.

## Gerelateerde documentatie

- [Bericht-CLI](/nl/cli/message)
- [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview)
- [Plugin-architectuur](/nl/plugins/architecture-internals#message-tool-schemas)
- [Refactorplan voor kanaalpresentatie](/nl/plan/ui-channels)
