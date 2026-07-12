---
read_when:
    - Refactoring van de gebruikersinterface voor kanaalberichten, interactieve payloads of systeemeigen kanaalrenderers
    - Mogelijkheden van berichttools, bezorgingsaanwijzingen of contextoverschrijdende markeringen wijzigen
    - Foutopsporing voor de fan-out van Discord Carbon-imports of luie runtime-initialisatie van kanaalplugins
summary: Koppel de semantische berichtpresentatie los van kanaalspecifieke native UI-renderers.
title: Refactorplan voor kanaalpresentatie
x-i18n:
    generated_at: "2026-07-12T08:59:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Geïmplementeerd voor de gedeelde agent-, CLI-, Plugin-capaciteits- en uitgaande afleveringsoppervlakken:

- `ReplyPayload.presentation` bevat semantische bericht-UI.
- `ReplyPayload.delivery.pin` bevat verzoeken om verzonden berichten vast te pinnen.
- Gedeelde berichtacties stellen `presentation`, `delivery` en `pin` beschikbaar in plaats van providerspecifieke `components`, `blocks`, `buttons` of `card`.
- De kern rendert de presentatie of degradeert deze automatisch via door Plugins gedeclareerde uitgaande capaciteiten.
- Renderers voor Discord, Slack, Telegram, Mattermost, MS Teams en Feishu gebruiken het generieke contract.
- De besturingsvlakcode van het Discord-kanaal importeert niet langer door Carbon ondersteunde UI-containers.

De canonieke documentatie staat nu in [Berichtpresentatie](/nl/plugins/message-presentation).
Bewaar dit plan als historische implementatiecontext; werk de canonieke handleiding
bij voor wijzigingen in het contract, de renderer of het terugvalgedrag.

## Probleem

De kanaal-UI is momenteel verdeeld over meerdere incompatibele oppervlakken:

- De kern beheert via `buildCrossContextComponents` een op Discord gebaseerde renderer-hook voor meerdere contexten.
- Discord `channel.ts` kan via `DiscordUiContainer` de systeemeigen Carbon-UI importeren, waardoor UI-runtimeafhankelijkheden in het besturingsvlak van de kanaal-Plugin terechtkomen.
- De agent en CLI bieden providerspecifieke uitwegen voor systeemeigen payloads, zoals Discord `components`, Slack `blocks`, Telegram- of Mattermost-`buttons` en Teams- of Feishu-`card`.
- `ReplyPayload.channelData` bevat zowel transportaanwijzingen als systeemeigen UI-enveloppen.
- Het generieke `interactive`-model bestaat, maar is beperkter dan de rijkere indelingen die Discord, Slack, Teams, Feishu, LINE, Telegram en Mattermost al gebruiken.

Hierdoor is de kern op de hoogte van systeemeigen UI-structuren, wordt het uitgesteld laden van de Plugin-runtime verzwakt en krijgen agents te veel providerspecifieke manieren om dezelfde berichtintentie uit te drukken.

## Doelen

- De kern bepaalt op basis van gedeclareerde capaciteiten de beste semantische presentatie voor een bericht.
- Extensies declareren capaciteiten en renderen semantische presentatie naar systeemeigen transportpayloads.
- De Web Control UI blijft gescheiden van de systeemeigen chat-UI.
- Systeemeigen kanaalpayloads worden niet beschikbaar gesteld via het gedeelde berichtoppervlak van de agent of CLI.
- Niet-ondersteunde presentatiefuncties degraderen automatisch naar de beste tekstweergave.
- Afleveringsgedrag, zoals het vastpinnen van een verzonden bericht, is generieke afleveringsmetadata en geen presentatie.

## Geen doelen

- Geen achterwaartse-compatibiliteitsshim voor `buildCrossContextComponents`.
- Geen openbare systeemeigen uitwegen voor `components`, `blocks`, `buttons` of `card`.
- Geen imports van kanaalspecifieke UI-bibliotheken in de kern.
- Geen providerspecifieke SDK-koppelvlakken voor gebundelde kanalen.

## Doelmodel

Voeg een door de kern beheerd veld `presentation` toe aan `ReplyPayload`.

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

Tijdens de migratie wordt `interactive` een subset van `presentation`:

- Het tekstblok van `interactive` wordt toegewezen aan `presentation.blocks[].type = "text"`.
- Het knoppenblok van `interactive` wordt toegewezen aan `presentation.blocks[].type = "buttons"`.
- Het selectieblok van `interactive` wordt toegewezen aan `presentation.blocks[].type = "select"`.

De externe schema's voor agent en CLI gebruiken nu `presentation`; `interactive` blijft een interne verouderde parser-/rendererhelper voor bestaande antwoordproducenten.
De openbare producentgerichte API beschouwt `interactive` als verouderd. Runtime-
ondersteuning blijft bestaan, zodat bestaande goedkeuringshelpers en oudere Plugins blijven
werken terwijl nieuwe code `presentation` uitvoert.

## Afleveringsmetadata

Voeg een door de kern beheerd veld `delivery` toe voor verzendgedrag dat geen UI is.

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

Semantiek:

- `delivery.pin = true` betekent dat het eerste succesvol afgeleverde bericht wordt vastgepind.
- `notify` is standaard `false`.
- `required` is standaard `false`; niet-ondersteunde kanalen of mislukt vastpinnen degraderen automatisch door de aflevering voort te zetten.
- Handmatige berichtacties `pin`, `unpin` en `list-pins` blijven beschikbaar voor bestaande berichten.

De huidige koppeling van Telegram ACP-onderwerpen moet worden verplaatst van `channelData.telegram.pin = true` naar `delivery.pin = true`.

## Runtimecapaciteitscontract

Voeg hooks voor het renderen van presentatie en aflevering toe aan de uitgaande runtimeadapter, niet aan de kanaal-Plugin van het besturingsvlak.

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

Kerngedrag:

- Bepaal het doelkanaal en de runtimeadapter.
- Vraag de presentatiecapaciteiten op.
- Degradeer niet-ondersteunde blokken en pas generieke capaciteitslimieten toe vóór
  het renderen.
- Roep `renderPresentation` aan.
- Als er geen renderer bestaat, zet de presentatie om naar tekst als terugvaloptie.
- Roep na succesvolle verzending `pinDeliveredMessage` aan wanneer `delivery.pin` is aangevraagd en wordt ondersteund.

## Kanaaltoewijzing

Discord:

- Render `presentation` naar componenten v2 en Carbon-containers in modules die uitsluitend tijdens runtime worden gebruikt.
- Bewaar helpers voor accentkleuren in lichte modules.
- Verwijder imports van `DiscordUiContainer` uit de besturingsvlakcode van de kanaal-Plugin.

Slack:

- Render `presentation` naar Block Kit.
- Verwijder `blocks`-invoer voor agent en CLI.

Telegram:

- Render tekst, context en scheidingslijnen als tekst.
- Render acties en selecties als inline-toetsenborden wanneer deze zijn geconfigureerd en toegestaan voor het doeloppervlak.
- Gebruik tekst als terugvaloptie wanneer inlineknoppen zijn uitgeschakeld.
- Verplaats het vastpinnen van ACP-onderwerpen naar `delivery.pin`.

Mattermost:

- Render acties als interactieve knoppen wanneer deze zijn geconfigureerd.
- Render andere blokken als tekstterugval.

MS Teams:

- Render `presentation` naar Adaptive Cards.
- Behoud handmatige acties voor vastpinnen, losmaken en het weergeven van vastgepinde berichten.
- Implementeer eventueel `pinDeliveredMessage` als Graph-ondersteuning betrouwbaar is voor het doelgesprek.

Feishu:

- Render `presentation` naar interactieve kaarten.
- Behoud handmatige acties voor vastpinnen, losmaken en het weergeven van vastgepinde berichten.
- Implementeer eventueel `pinDeliveredMessage` voor het vastpinnen van verzonden berichten als het API-gedrag betrouwbaar is.

LINE:

- Render `presentation` waar mogelijk naar Flex- of sjabloonberichten.
- Val voor niet-ondersteunde blokken terug op tekst.
- Verwijder LINE-UI-payloads uit `channelData`.

Eenvoudige of beperkte kanalen:

- Zet de presentatie met conservatieve opmaak om naar tekst.

## Refactorstappen

1. Pas de Discord-releasefix opnieuw toe die `ui-colors.ts` afsplitst van de door Carbon ondersteunde UI en `DiscordUiContainer` verwijdert uit `extensions/discord/src/channel.ts`.
2. Voeg `presentation` en `delivery` toe aan `ReplyPayload`, normalisatie van uitgaande payloads, afleveringsoverzichten en hook-payloads.
3. Voeg het schema `MessagePresentation` en parserhelpers toe in een beperkt SDK-/runtime-subpad.
4. Vervang berichtcapaciteiten `buttons`, `cards`, `components` en `blocks` door semantische presentatiecapaciteiten.
5. Voeg hooks voor presentatierendering en vastpinnen bij aflevering toe aan de uitgaande runtimeadapter.
6. Vervang de constructie van componenten voor meerdere contexten door `buildCrossContextPresentation`.
7. Verwijder `src/infra/outbound/channel-adapters.ts` en verwijder `buildCrossContextComponents` uit de typen van de kanaal-Plugin.
8. Wijzig `maybeApplyCrossContextMarker` zodat deze `presentation` toevoegt in plaats van systeemeigen parameters.
9. Werk verzendpaden voor Plugin-dispatch bij zodat ze uitsluitend semantische presentatie en afleveringsmetadata gebruiken.
10. Verwijder systeemeigen payloadparameters voor agent en CLI: `components`, `blocks`, `buttons` en `card`.
11. Verwijder SDK-helpers die systeemeigen schema's voor berichttools maken en vervang ze door helpers voor presentatieschema's.
12. Verwijder UI-/systeemeigen enveloppen uit `channelData`; behoud alleen transportmetadata totdat elk resterend veld is beoordeeld.
13. Migreer de renderers voor Discord, Slack, Telegram, Mattermost, MS Teams, Feishu en LINE.
14. Werk de documentatie bij voor de berichten-CLI, kanaalpagina's, Plugin-SDK en de capaciteitencookbook.
15. Voer import-fan-outprofilering uit voor Discord en de betrokken kanaalingangspunten.

Stappen 1-11 en 13-14 zijn in deze refactor geïmplementeerd voor de gedeelde agent-, CLI-, Plugin-capaciteits- en uitgaande-adaptercontracten. Stap 12 blijft een grondigere interne opschoningsronde voor providerprivate `channelData`-transportenveloppen. Stap 15 blijft een vervolgvalidatie als we gekwantificeerde import-fan-outcijfers willen naast de type-/testcontrole.

## Tests

Toevoegen of bijwerken:

- Tests voor presentatienormalisatie.
- Tests voor automatische degradatie van presentaties bij niet-ondersteunde blokken.
- Tests voor markeringen tussen contexten voor Plugin-dispatch en kernafleveringspaden.
- Matrixtests voor kanaalrendering voor Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE en tekstterugval.
- Tests voor berichttoolschema's die aantonen dat systeemeigen velden zijn verwijderd.
- CLI-tests die aantonen dat systeemeigen vlaggen zijn verwijderd.
- Regressietest voor uitgesteld importeren bij het Discord-ingangspunt met betrekking tot Carbon.
- Tests voor vastpinnen bij aflevering voor Telegram en generieke terugval.

## Open vragen

- Moet `delivery.pin` in de eerste ronde worden geïmplementeerd voor Discord, Slack, MS Teams en Feishu, of eerst alleen voor Telegram?
- Moet `delivery` uiteindelijk bestaande velden zoals `replyToId`, `replyToCurrent`, `silent` en `audioAsVoice` opnemen, of gericht blijven op gedrag na verzending?
- Moet presentatie rechtstreeks afbeeldingen of bestandsverwijzingen ondersteunen, of moeten media voorlopig gescheiden blijven van de UI-indeling?

## Gerelateerd

- [Overzicht van kanalen](/nl/channels)
- [Berichtpresentatie](/nl/plugins/message-presentation)
