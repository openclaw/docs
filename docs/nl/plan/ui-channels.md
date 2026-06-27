---
read_when:
    - Kanalenbericht-UI, interactieve payloads of native kanaalrenderers refactoren
    - Berichttoolmogelijkheden, bezorgingshints of contextoverschrijdende markeringen wijzigen
    - Debuggen van Discord Carbon-importfan-out of runtime-luiheid van kanaal-Plugin
summary: Ontkoppel semantische berichtpresentatie van kanaalspecifieke systeemeigen UI-renderers.
title: Refactorplan voor kanaalpresentatie
x-i18n:
    generated_at: "2026-06-27T17:46:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Geïmplementeerd voor de gedeelde agent, CLI, Plugin-capability en uitgaande afleveringsinterfaces:

- `ReplyPayload.presentation` draagt semantische bericht-UI.
- `ReplyPayload.delivery.pin` draagt aanvragen om verzonden berichten vast te pinnen.
- Gedeelde berichtacties stellen `presentation`, `delivery` en `pin` beschikbaar in plaats van provider-native `components`, `blocks`, `buttons` of `card`.
- De kern rendert of degradeert presentatie automatisch via door Plugins gedeclareerde uitgaande capabilities.
- Discord-, Slack-, Telegram-, Mattermost-, MS Teams- en Feishu-renderers gebruiken het generieke contract.
- Discord-kanaalcode voor de control plane importeert geen door Carbon ondersteunde UI-containers meer.

Canonieke documentatie staat nu in [Berichtpresentatie](/nl/plugins/message-presentation).
Bewaar dit plan als historische implementatiecontext; werk de canonieke gids bij
voor wijzigingen in contract-, renderer- of fallbackgedrag.

## Probleem

Kanaal-UI is momenteel verdeeld over meerdere incompatibele oppervlakken:

- De kern bezit een Discord-vormige cross-context renderer-hook via `buildCrossContextComponents`.
- Discord `channel.ts` kan native Carbon-UI importeren via `DiscordUiContainer`, waardoor runtime-UI-afhankelijkheden in de control plane van de kanaal-Plugin terechtkomen.
- De agent en CLI stellen native payload-uitwegen beschikbaar, zoals Discord `components`, Slack `blocks`, Telegram- of Mattermost-`buttons` en Teams- of Feishu-`card`.
- `ReplyPayload.channelData` draagt zowel transporthints als native UI-enveloppen.
- Het generieke `interactive`-model bestaat, maar is smaller dan de rijkere layouts die al worden gebruikt door Discord, Slack, Teams, Feishu, LINE, Telegram en Mattermost.

Hierdoor wordt de kern zich bewust van native UI-vormen, wordt de luiheid van de Plugin-runtime verzwakt en krijgen agents te veel provider-specifieke manieren om dezelfde berichtintentie uit te drukken.

## Doelen

- De kern bepaalt de beste semantische presentatie voor een bericht op basis van gedeclareerde capabilities.
- Extensies declareren capabilities en renderen semantische presentatie naar native transportpayloads.
- Web Control UI blijft gescheiden van chat-native UI.
- Native kanaalpayloads worden niet beschikbaar gesteld via het gedeelde agent- of CLI-berichtoppervlak.
- Niet-ondersteunde presentatiefuncties degraderen automatisch naar de beste tekstrepresentatie.
- Aflevergedrag zoals het vastpinnen van een verzonden bericht is generieke afleveringsmetadata, geen presentatie.

## Niet-doelen

- Geen achterwaartse-compatibiliteitsshims voor `buildCrossContextComponents`.
- Geen openbare native uitwegen voor `components`, `blocks`, `buttons` of `card`.
- Geen kernimports van kanaal-native UI-bibliotheken.
- Geen provider-specifieke SDK-naden voor gebundelde kanalen.

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

`interactive` wordt tijdens de migratie een subset van `presentation`:

- `interactive`-tekstblok mappt naar `presentation.blocks[].type = "text"`.
- `interactive`-knoppenblok mappt naar `presentation.blocks[].type = "buttons"`.
- `interactive`-selectieblok mappt naar `presentation.blocks[].type = "select"`.

De externe agent- en CLI-schema's gebruiken nu `presentation`; `interactive` blijft een interne legacy parser/rendering-helper voor bestaande reply-producenten.
De openbare API voor producenten behandelt `interactive` als verouderd. Runtime-
ondersteuning blijft bestaan zodat bestaande goedkeuringshelpers en oudere Plugins blijven
werken terwijl nieuwe code `presentation` uitzendt.

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
- `required` is standaard `false`; niet-ondersteunde kanalen of mislukt vastpinnen degraderen automatisch door aflevering voort te zetten.
- Handmatige berichtacties `pin`, `unpin` en `list-pins` blijven bestaan voor bestaande berichten.

De huidige Telegram ACP-topicbinding moet verplaatsen van `channelData.telegram.pin = true` naar `delivery.pin = true`.

## Runtime-capabilitycontract

Voeg presentatie- en afleveringsrender-hooks toe aan de runtime-uitgaande adapter, niet aan de control-plane kanaal-Plugin.

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

- Los het doelkanaal en de runtime-adapter op.
- Vraag om presentatie-capabilities.
- Degradeer niet-ondersteunde blokken en pas generieke capabilitylimieten toe vóór
  rendering.
- Roep `renderPresentation` aan.
- Als er geen renderer bestaat, converteer presentatie naar tekstfallback.
- Roep na succesvol verzenden `pinDeliveredMessage` aan wanneer `delivery.pin` is aangevraagd en wordt ondersteund.

## Kanaaltoewijzing

Discord:

- Render `presentation` naar components v2 en Carbon-containers in modules die alleen in runtime worden gebruikt.
- Houd helpers voor accentkleuren in lichte modules.
- Verwijder `DiscordUiContainer`-imports uit control-plane-code van de kanaal-Plugin.

Slack:

- Render `presentation` naar Block Kit.
- Verwijder agent- en CLI-invoer `blocks`.

Telegram:

- Render tekst, context en scheidingslijnen als tekst.
- Render acties en selectie als inline toetsenborden wanneer geconfigureerd en toegestaan voor het doeloppervlak.
- Gebruik tekstfallback wanneer inline knoppen zijn uitgeschakeld.
- Verplaats ACP-topicvastpinnen naar `delivery.pin`.

Mattermost:

- Render acties als interactieve knoppen waar geconfigureerd.
- Render andere blokken als tekstfallback.

MS Teams:

- Render `presentation` naar Adaptive Cards.
- Behoud handmatige acties voor vastpinnen, losmaken en pins weergeven.
- Implementeer eventueel `pinDeliveredMessage` als Graph-ondersteuning betrouwbaar is voor het doelgesprek.

Feishu:

- Render `presentation` naar interactieve kaarten.
- Behoud handmatige acties voor vastpinnen, losmaken en pins weergeven.
- Implementeer eventueel `pinDeliveredMessage` voor het vastpinnen van verzonden berichten als API-gedrag betrouwbaar is.

LINE:

- Render `presentation` waar mogelijk naar Flex- of templateberichten.
- Val terug op tekst voor niet-ondersteunde blokken.
- Verwijder LINE-UI-payloads uit `channelData`.

Eenvoudige of beperkte kanalen:

- Converteer presentatie naar tekst met conservatieve opmaak.

## Refactorstappen

1. Pas de Discord-releasefix opnieuw toe die `ui-colors.ts` splitst van door Carbon ondersteunde UI en `DiscordUiContainer` verwijdert uit `extensions/discord/src/channel.ts`.
2. Voeg `presentation` en `delivery` toe aan `ReplyPayload`, normalisatie van uitgaande payloads, afleveringssamenvattingen en hook-payloads.
3. Voeg `MessagePresentation`-schema en parserhelpers toe in een smal SDK/runtime-subpad.
4. Vervang bericht-capabilities `buttons`, `cards`, `components` en `blocks` door semantische presentatie-capabilities.
5. Voeg runtime-uitgaande adapter-hooks toe voor presentatierendering en afleveringsvastpinnen.
6. Vervang cross-context componentconstructie door `buildCrossContextPresentation`.
7. Verwijder `src/infra/outbound/channel-adapters.ts` en verwijder `buildCrossContextComponents` uit kanaal-Plugin-typen.
8. Wijzig `maybeApplyCrossContextMarker` zodat deze `presentation` koppelt in plaats van native parameters.
9. Werk plugin-dispatch-verzendpaden bij zodat ze alleen semantische presentatie en afleveringsmetadata gebruiken.
10. Verwijder native payload-parameters voor agent en CLI: `components`, `blocks`, `buttons` en `card`.
11. Verwijder SDK-helpers die native berichttool-schema's maken en vervang ze door presentatieschemahelpers.
12. Verwijder UI/native enveloppen uit `channelData`; behoud alleen transportmetadata totdat elk resterend veld is beoordeeld.
13. Migreer Discord-, Slack-, Telegram-, Mattermost-, MS Teams-, Feishu- en LINE-renderers.
14. Werk documentatie bij voor bericht-CLI, kanaalpagina's, Plugin-SDK en capability-cookbook.
15. Voer import-fanoutprofilering uit voor Discord en getroffen kanaal-entrypoints.

Stappen 1-11 en 13-14 zijn in deze refactor geïmplementeerd voor de gedeelde agent, CLI, Plugin-capability en uitgaande adaptercontracten. Stap 12 blijft een diepere interne opschoonpass voor provider-private `channelData`-transportenveloppen. Stap 15 blijft vervolgvalidatie als we gekwantificeerde import-fanoutcijfers willen naast de type-/testgate.

## Tests

Toevoegen of bijwerken:

- Tests voor presentatienormalisatie.
- Tests voor automatische presentatiedegradatie bij niet-ondersteunde blokken.
- Cross-context markertests voor plugin-dispatch en kernafleveringspaden.
- Kanaalrender-matrixtests voor Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE en tekstfallback.
- Tests voor berichttool-schema's die bewijzen dat native velden verdwenen zijn.
- CLI-tests die bewijzen dat native flags verdwenen zijn.
- Regressietest voor importluiheid van Discord-entrypoint rond Carbon.
- Tests voor afleveringsvastpinnen voor Telegram en generieke fallback.

## Open vragen

- Moet `delivery.pin` in de eerste pass worden geïmplementeerd voor Discord, Slack, MS Teams en Feishu, of eerst alleen voor Telegram?
- Moet `delivery` uiteindelijk bestaande velden opnemen zoals `replyToId`, `replyToCurrent`, `silent` en `audioAsVoice`, of gericht blijven op gedrag na verzending?
- Moet presentatie direct afbeeldingen of bestandsverwijzingen ondersteunen, of moet media voorlopig gescheiden blijven van UI-layout?

## Gerelateerd

- [Kanalenoverzicht](/nl/channels)
- [Berichtpresentatie](/nl/plugins/message-presentation)
