---
read_when:
    - Refactoring van de UI voor kanaalberichten, interactieve payloads of native kanaalrenderers
    - Mogelijkheden van berichtentools, bezorgingshints of contextoverschrijdende markeringen wijzigen
    - Debuggen van Discord Carbon-importfanout of runtime-luiheid van de kanaal-Plugin
summary: Ontkoppel semantische berichtpresentatie van kanaaleigen UI-renderers.
title: Refactorplan voor kanaalpresentatie
x-i18n:
    generated_at: "2026-04-29T22:58:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Geïmplementeerd voor de gedeelde agent, CLI, Plugin-capaciteit en oppervlakken voor uitgaande levering:

- `ReplyPayload.presentation` draagt semantische bericht-UI.
- `ReplyPayload.delivery.pin` draagt verzoeken om verzonden berichten vast te pinnen.
- Gedeelde berichtacties stellen `presentation`, `delivery` en `pin` beschikbaar in plaats van provider-native `components`, `blocks`, `buttons` of `card`.
- Core rendert presentatie of degradeert deze automatisch via door Plugins gedeclareerde uitgaande capaciteiten.
- Discord-, Slack-, Telegram-, Mattermost-, MS Teams- en Feishu-renderers gebruiken het generieke contract.
- Discord-kanaalcode voor het control plane importeert geen door Carbon ondersteunde UI-containers meer.

Canonieke documentatie staat nu in [Berichtpresentatie](/nl/plugins/message-presentation).
Bewaar dit plan als historische implementatiecontext; werk de canonieke gids bij
voor wijzigingen in contract-, renderer- of fallback-gedrag.

## Probleem

Kanaal-UI is momenteel verdeeld over meerdere incompatibele oppervlakken:

- Core bezit een Discord-vormige renderer-hook voor meerdere contexten via `buildCrossContextComponents`.
- Discord `channel.ts` kan native Carbon-UI importeren via `DiscordUiContainer`, waardoor runtime-UI-afhankelijkheden in het control plane van de kanaal-Plugin terechtkomen.
- De agent en CLI bieden native payload-uitwijkmogelijkheden zoals Discord `components`, Slack `blocks`, Telegram- of Mattermost-`buttons`, en Teams- of Feishu-`card`.
- `ReplyPayload.channelData` draagt zowel transporthints als native UI-enveloppen.
- Het generieke `interactive`-model bestaat, maar het is smaller dan de rijkere lay-outs die al door Discord, Slack, Teams, Feishu, LINE, Telegram en Mattermost worden gebruikt.

Hierdoor wordt core zich bewust van native UI-vormen, verzwakt de runtime-luiheid van Plugins en krijgen agents te veel provider-specifieke manieren om dezelfde berichtintentie uit te drukken.

## Doelen

- Core bepaalt de beste semantische presentatie voor een bericht op basis van gedeclareerde capaciteiten.
- Extensies declareren capaciteiten en renderen semantische presentatie naar native transportpayloads.
- Web Control UI blijft gescheiden van chat-native UI.
- Native kanaalpayloads worden niet beschikbaar gemaakt via het gedeelde agent- of CLI-berichtoppervlak.
- Niet-ondersteunde presentatiefuncties degraderen automatisch naar de beste tekstrepresentatie.
- Leveringsgedrag zoals het vastpinnen van een verzonden bericht is generieke leveringsmetadata, geen presentatie.

## Geen doelen

- Geen achterwaartse-compatibiliteitsshim voor `buildCrossContextComponents`.
- Geen publieke native uitwijkmogelijkheden voor `components`, `blocks`, `buttons` of `card`.
- Geen core-imports van kanaal-native UI-bibliotheken.
- Geen provider-specifieke SDK-naden voor gebundelde kanalen.

## Doelmodel

Voeg een door core beheerd `presentation`-veld toe aan `ReplyPayload`.

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

`interactive` wordt tijdens de migratie een subset van `presentation`:

- `interactive`-tekstblok koppelt aan `presentation.blocks[].type = "text"`.
- `interactive`-knoppenblok koppelt aan `presentation.blocks[].type = "buttons"`.
- `interactive`-selectieblok koppelt aan `presentation.blocks[].type = "select"`.

De externe agent- en CLI-schema's gebruiken nu `presentation`; `interactive` blijft een interne legacy-parser/renderinghelper voor bestaande antwoordproducenten.

## Leveringsmetadata

Voeg een door core beheerd `delivery`-veld toe voor verzendgedrag dat geen UI is.

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

- `delivery.pin = true` betekent dat het eerste succesvol geleverde bericht wordt vastgepind.
- `notify` is standaard `false`.
- `required` is standaard `false`; niet-ondersteunde kanalen of mislukt vastpinnen degraderen automatisch door levering voort te zetten.
- Handmatige berichtacties `pin`, `unpin` en `list-pins` blijven voor bestaande berichten bestaan.

De huidige Telegram ACP-topicbinding moet verhuizen van `channelData.telegram.pin = true` naar `delivery.pin = true`.

## Runtime-capaciteitscontract

Voeg presentatie- en leveringsrenderhooks toe aan de runtime-uitgaande adapter, niet aan de kanaal-Plugin voor het control plane.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

Core-gedrag:

- Los het doelkanaal en de runtime-adapter op.
- Vraag om presentatiecapaciteiten.
- Degradeer niet-ondersteunde blokken vóór het renderen.
- Roep `renderPresentation` aan.
- Als er geen renderer bestaat, zet presentatie om naar tekstfallback.
- Roep na succesvol verzenden `pinDeliveredMessage` aan wanneer `delivery.pin` is aangevraagd en ondersteund.

## Kanaalmapping

Discord:

- Render `presentation` naar components v2 en Carbon-containers in modules die alleen runtime zijn.
- Houd accentkleurhelpers in lichte modules.
- Verwijder `DiscordUiContainer`-imports uit control-plane-code van de kanaal-Plugin.

Slack:

- Render `presentation` naar Block Kit.
- Verwijder agent- en CLI-`blocks`-invoer.

Telegram:

- Render tekst, context en scheidingslijnen als tekst.
- Render acties en selectie als inline keyboards wanneer geconfigureerd en toegestaan voor het doeloppervlak.
- Gebruik tekstfallback wanneer inline knoppen zijn uitgeschakeld.
- Verplaats ACP-topic-vastpinnen naar `delivery.pin`.

Mattermost:

- Render acties als interactieve knoppen waar geconfigureerd.
- Render andere blokken als tekstfallback.

MS Teams:

- Render `presentation` naar Adaptive Cards.
- Behoud handmatige acties voor pin/unpin/list-pins.
- Implementeer optioneel `pinDeliveredMessage` als Graph-ondersteuning betrouwbaar is voor het doelgesprek.

Feishu:

- Render `presentation` naar interactieve kaarten.
- Behoud handmatige acties voor pin/unpin/list-pins.
- Implementeer optioneel `pinDeliveredMessage` voor het vastpinnen van verzonden berichten als API-gedrag betrouwbaar is.

LINE:

- Render `presentation` waar mogelijk naar Flex- of templateberichten.
- Val terug op tekst voor niet-ondersteunde blokken.
- Verwijder LINE-UI-payloads uit `channelData`.

Gewone of beperkte kanalen:

- Zet presentatie om naar tekst met conservatieve opmaak.

## Refactorstappen

1. Pas de Discord-releasefix opnieuw toe die `ui-colors.ts` afsplitst van door Carbon ondersteunde UI en `DiscordUiContainer` verwijdert uit `extensions/discord/src/channel.ts`.
2. Voeg `presentation` en `delivery` toe aan `ReplyPayload`, normalisatie van uitgaande payloads, leveringsoverzichten en hook-payloads.
3. Voeg `MessagePresentation`-schema en parserhelpers toe in een smal SDK/runtime-subpad.
4. Vervang berichtcapaciteiten `buttons`, `cards`, `components` en `blocks` door semantische presentatiecapaciteiten.
5. Voeg runtime-uitgaande adapterhooks toe voor presentatierendering en vastpinnen bij levering.
6. Vervang componentconstructie voor meerdere contexten door `buildCrossContextPresentation`.
7. Verwijder `src/infra/outbound/channel-adapters.ts` en verwijder `buildCrossContextComponents` uit kanaal-Plugin-typen.
8. Wijzig `maybeApplyCrossContextMarker` zodat `presentation` wordt toegevoegd in plaats van native parameters.
9. Werk verzendpaden van Plugin-dispatch bij zodat ze alleen semantische presentatie en leveringsmetadata gebruiken.
10. Verwijder native payloadparameters van agent en CLI: `components`, `blocks`, `buttons` en `card`.
11. Verwijder SDK-helpers die native schema's voor berichttools maken en vervang ze door presentatieschemahelpers.
12. Verwijder UI/native enveloppen uit `channelData`; behoud alleen transportmetadata totdat elk resterend veld is beoordeeld.
13. Migreer Discord-, Slack-, Telegram-, Mattermost-, MS Teams-, Feishu- en LINE-renderers.
14. Werk documentatie bij voor bericht-CLI, kanaalpagina's, Plugin-SDK en capaciteitsrecepten.
15. Voer import-fanoutprofilering uit voor Discord en betrokken kanaalentrypoints.

Stappen 1-11 en 13-14 zijn in deze refactor geïmplementeerd voor de gedeelde agent, CLI, Plugin-capaciteit en contracten voor uitgaande adapters. Stap 12 blijft een diepere interne opschoonpass voor provider-private `channelData`-transportenveloppen. Stap 15 blijft vervolgvalidatie als we gekwantificeerde import-fanoutcijfers willen bovenop de type-/testgate.

## Tests

Toevoegen of bijwerken:

- Presentatienormalisatietests.
- Tests voor automatische degradatie van presentatie bij niet-ondersteunde blokken.
- Tests voor markeringen voor meerdere contexten voor Plugin-dispatch- en core-leveringspaden.
- Kanaalrendermatrixtests voor Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE en tekstfallback.
- Tests voor berichttoolschema's die bewijzen dat native velden verdwenen zijn.
- CLI-tests die bewijzen dat native vlaggen verdwenen zijn.
- Regressietest voor import-luiheid van Discord-entrypoint rond Carbon.
- Leveringspintests voor Telegram en generieke fallback.

## Open vragen

- Moet `delivery.pin` in de eerste pass worden geïmplementeerd voor Discord, Slack, MS Teams en Feishu, of eerst alleen voor Telegram?
- Moet `delivery` uiteindelijk bestaande velden zoals `replyToId`, `replyToCurrent`, `silent` en `audioAsVoice` opnemen, of gericht blijven op gedrag na verzending?
- Moet presentatie direct afbeeldingen of bestandsverwijzingen ondersteunen, of moeten media voorlopig gescheiden blijven van UI-lay-out?

## Gerelateerd

- [Kanalenoverzicht](/nl/channels)
- [Berichtpresentatie](/nl/plugins/message-presentation)
