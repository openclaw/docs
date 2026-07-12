---
read_when:
    - Kanaalgedrag voor verzenden of ontvangen herstructureren
    - Wijziging van inkomende kanaalberichten, antwoordverzending, uitgaande wachtrij, voorbeeldstreaming of bericht-API's van de Plugin-SDK
    - Een nieuwe kanaalplugin ontwerpen die duurzame verzendingen, ontvangstbevestigingen, voorbeelden, bewerkingen of nieuwe pogingen vereist
summary: 'Status van de duurzame levenscyclus voor het ontvangen en verzenden van berichten: wat is uitgebracht, wat is gewijzigd ten opzichte van het oorspronkelijke ontwerp en wat nog openstaat'
title: Herstructurering van de berichtlevenscyclus
x-i18n:
    generated_at: "2026-07-12T08:49:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Deze pagina is oorspronkelijk ontstaan als een toekomstgericht ontwerpvoorstel. De kern van dat
ontwerp is inmiddels uitgebracht in `src/channels/message/*` en de openbare
subpaden `openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Gebruik voor de
huidige API [API voor uitgaande kanalen](/nl/plugins/sdk-channel-outbound) en
[API voor inkomende kanalen](/nl/plugins/sdk-channel-inbound). Deze pagina houdt bij wat
is uitgebracht, waar de implementatie afwijkt van de oorspronkelijke schets en wat
nog openstaat.
</Note>

## Waarom deze refactor is uitgevoerd

De kanaalstack groeide vanuit verschillende lokale oplossingen: afzonderlijke helpers voor inkomende berichten per
volwassenheidsniveau (`runtime.channel.inbound.run` voor eenvoudige adapters,
`runtime.channel.inbound.runPreparedReply` voor uitgebreide adapters), verouderde helpers voor het doorsturen van antwoorden
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
kanaalspecifieke previewstreaming en duurzaamheid van de uiteindelijke aflevering die achteraf werd toegevoegd aan
bestaande paden voor antwoordpayloads. Die structuur leidde tot te veel openbare concepten en
te veel plaatsen waar de afleveringssemantiek uiteen kon lopen.

Het betrouwbaarheidsprobleem dat het herontwerp noodzakelijk maakte:

```text
Telegram-pollingupdate bevestigd
  -> definitieve tekst van de assistent bestaat
  -> proces wordt opnieuw gestart voordat sendMessage slaagt
  -> definitief antwoord gaat verloren
```

Beoogde invariant: zodra de kern bepaalt dat een zichtbaar uitgaand bericht moet bestaan,
moet de verzendintentie duurzaam zijn vastgelegd voordat de platformaanroep wordt geprobeerd, en moet het
platformontvangstbewijs na succes worden vastgelegd. Dit levert standaard herstel met
ten minste één aflevering op. Gedrag met exact één aflevering bestaat alleen wanneer een adapter
native idempotentie aantoont of een poging met een onbekende uitkomst na verzending vergelijkt met
de platformstatus voordat deze opnieuw wordt uitgevoerd.

## Wat is uitgebracht

Het interne domein bevindt zich in `src/channels/message/*`:

| Bestand                     | Verantwoordelijk voor                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Typecontracten voor adapters, verzendcontexten, ontvangstbewijzen en duurzame intenties                            |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — de duurzame verzendcontext                           |
| `receive.ts`                | `createMessageReceiveContext` — toestandsmachine voor beleid rond bevestiging van inkomende berichten              |
| `live.ts`                   | Status van live previews en logica voor ter plaatse afronden of terugvallen                                         |
| `state.ts`                  | `classifyDurableSendRecoveryState` — herstelclassificatie na een onderbreking                                       |
| `receipt.ts`                | Normaliseert platformresultaten van verzending naar `MessageReceipt`                                                |
| `capabilities.ts`           | Leidt de vereiste mogelijkheden voor duurzame definitieve aflevering af uit een payload                            |
| `contracts.ts`              | Verificatie van contractbewijs voor gedeclareerde adaptermogelijkheden                                              |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                       |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — omhult verouderde functies `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — duurzame wachtrij voor inkomende gebeurtenissen                                       |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — journaal voor accepteren/in behandeling/voltooien/vrijgeven bij deduplicatie van inkomende berichten |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` en wrappers met verouderde namen                                                      |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, helpers voor antwoordvoorvoegsels en callbacks voor type-indicaties                  |

Openbaar oppervlak: `openclaw/plugin-sdk/channel-outbound` (helpers voor verzending/ontvangstbewijzen/duurzaamheid/live previews/antwoordpijplijnen)
en `openclaw/plugin-sdk/channel-inbound` (context voor inkomende berichten, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Raadpleeg die pagina's voor adaptervoorbeelden, huidige
typenamen en migratieopmerkingen — zij zijn de gezaghebbende bron voor de API-structuur,
niet de onderstaande schetsen.

### Verzendcontext

`withDurableMessageSendContext` biedt kanaalcode de stappen `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` en `fail` rond één uitgaand
bericht. `sendDurableMessageBatch` is de wrapper voor het gebruikelijke geval: renderen, verzenden
en vervolgens vastleggen bij `sent`/`suppressed`, of als mislukt markeren bij een fout.

`sendDurableMessageBatch` retourneert één gediscrimineerd resultaat:

| Status           | Betekenis                                                                        |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | Ten minste één zichtbaar platformbericht is afgeleverd                           |
| `suppressed`     | Geen enkel platformbericht moet als ontbrekend worden beschouwd (geannuleerd door hook, simulatie enzovoort) |
| `partial_failed` | Ten minste één bericht is afgeleverd voordat een latere payload of bijwerking mislukte |
| `failed`         | Er is geen platformontvangstbewijs geproduceerd                                  |

Duurzaamheid is `required`, `best_effort` of `disabled`
(`MessageDurabilityPolicy` in `src/channels/message/types.ts`). `required`
stopt veilig wanneer de duurzame intentie niet kan worden geschreven; `best_effort` valt
terug op rechtstreekse verzending wanneer persistentie niet beschikbaar is; `disabled` behoudt het
gedrag van rechtstreekse verzending van vóór de refactor. Verouderde compatibiliteitshelpers gebruiken standaard
`disabled` en leiden niet automatisch `required` af enkel omdat een kanaal een generieke
adapter voor uitgaande berichten heeft.

De grens die gevaarlijk blijft: nadat de platformaanroep slaagt en voordat
het ontvangstbewijs wordt vastgelegd. Als het proces daar stopt, kan de kern niet weten of het
platformbericht bestaat, tenzij de adapter `reconcileUnknownSend` declareert.
Die hook classificeert een onderbroken verzending als `sent`, `not_sent` of
`unresolved`; alleen `not_sent` staat opnieuw uitvoeren toe. Kanalen zonder reconciliatie
vallen terug op de status `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) en mogen alleen kiezen voor opnieuw uitvoeren met
ten minste één aflevering als dubbele zichtbare berichten een aanvaardbare, gedocumenteerde
afweging voor dat kanaal zijn.

### Ontvangstcontext

`createMessageReceiveContext` houdt de bevestigings-/afwijzingsstatus per inkomende gebeurtenis bij met een
idempotente `ack()` en expliciete `nack(error)`. Het bevestigingsbeleid
(`ChannelMessageReceiveAckPolicy`) is een van:

| Beleid                 | Bevestigt wanneer                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `after_receive_record` | De kern voldoende metadata van het inkomende bericht heeft opgeslagen om een herlevering te dedupliceren/routeren |
| `after_agent_dispatch` | De agentuitvoering is gestart                                                                    |
| `after_durable_send`   | De duurzame uitgaande verzending voor deze beurt is vastgelegd                                   |
| `manual`               | De aanroeper bepaalt expliciet het bevestigingsmoment (standaard voor adapters die geen beleid declareren) |

Telegram-polling gebruikt dit om een watermerk voor veilig voltooide updates op te slaan
(`safeCompletedUpdateId` in `extensions/telegram/src/bot-update-tracker.ts`):
grammY observeert nog steeds elke update wanneer deze de middlewareketen binnenkomt, maar
OpenClaw verplaatst het opgeslagen watermerk voor herstarts alleen voorbij updates waarvan
het doorsturen is voltooid, zodat mislukte of nog in behandeling zijnde updates na een herstart opnieuw worden uitgevoerd.
De upstream-offset van Telegram voor `getUpdates` blijft eigendom van grammY; een volledig
duurzame pollingbron die herlevering op platformniveau voorbij dit
watermerk beheert, is niet gebouwd (zie Openstaande vragen).

### Live preview

`src/channels/message/live.ts` modelleert preview/bewerken/afronden als één levenscyclus:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` en
`deliverFinalizableLivePreviewAdapter` (een definitieve bewerking opbouwen vanuit een concept, deze
toepassen en terugvallen op een normale verzending wanneer bewerken niet mogelijk is of mislukt).
`LiveMessageState.phase` is `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` bepaalt of een preview via een bewerking het definitieve
bericht kan worden in plaats van via een nieuwe verzending.

### Duurzame ontvangstbewijzen

`MessageReceipt` (`src/channels/message/types.ts`) normaliseert een of meer
platformbericht-id's van één logische verzending naar `platformMessageIds` plus
`parts` per onderdeel (soort, index, thread-id, antwoord-op-id). Een primaire id blijft behouden
voor threads en latere bewerkingen. Hierdoor kunnen afleveringen met meerdere onderdelen (tekst
plus media, opgesplitste tekst, terugval voor kaarten) na een herstart opnieuw worden uitgevoerd en
gededupliceerd.

### Verkleining van de openbare SDK

De refactor heeft het volgende opgenomen of afgeschaft: `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, `reply-payload`-helpers die als openbare
API werden aangeboden, `inbound-reply-dispatch`, `channel-reply-pipeline` en het merendeel van de openbare toepassingen
van `outbound-runtime`. `src/plugin-sdk/channel-message.ts` is nu een
`@deprecated` barrelbestand voor herexports dat verwijst naar `channel-outbound` /
`channel-inbound`; runtime-aliassen van `channel.turn` zijn verwijderd en de oude
documentatiepagina `/plugins/sdk-channel-turn` verwijst door naar
[API voor inkomende kanalen](/nl/plugins/sdk-channel-inbound). Nieuwe Plugincode moet
rechtstreeks gericht zijn op `channel-outbound` en `channel-inbound`.

## Waar de implementatie afweek van het oorspronkelijke ontwerp

De onderstaande ontwerpschets is nooit letterlijk zoals beschreven uitgebracht. Deze wordt bewaard voor
historische nauwkeurigheid; beschouw deze typenamen niet als de huidige API.

- **Geen `MessageOrigin` / `shouldDropOpenClawEcho`.** Het oorspronkelijke plan voorzag
  in een oorsprongstag `source: "openclaw"` op berichten over Gateway-fouten, plus een
  gedeeld predicaat dat getagde, door bots geschreven echo's in gedeelde ruimten verwijdert
  vóór `allowBots`-autorisatie. Dat type en predicaat bestaan niet in
  de codebase. `allowBots` zelf is een echte configuratiesleutel per kanaal (Slack,
  Discord, Google Chat en andere), maar het mechanisme voor oorsprongstags dat
  deze moest beschermen, is nooit gebouwd. Onderdrukking van echo's van Gateway-fouten in
  ruimten waarin bots zijn ingeschakeld, blijft een openstaand tekort en is geen uitgebrachte garantie.
- **Geen uniforme naamruimte `core.messages.receive/send/live/state`.** De
  uitgebrachte functies bevinden zich rechtstreeks in `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) in plaats van
  achter een facade `core.messages.*`.
- **Geen generiek genormaliseerd berichttype `ChannelMessage` / `MessageTarget` /
  `MessageRelation`.** De kern geeft nog steeds concrete antwoordpayloads
  (`ReplyPayload`) en kanaalspecifieke contexten door aan de verzendadapters,
  in plaats van één platformneutrale berichtstructuur met een relatie `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **De namen van het bevestigingsbeleid wijken af van de schets.** Uitgebracht:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  De oorspronkelijke schets gebruikte `immediate | after-record | after-durable-send |
manual` met een redenveld voor webhooktime-outs; die structuur is niet gebouwd.
- **Mogelijkheidssleutels van `DurableFinalDeliveryRequirementMap` vervingen het geschetste
  object `MessageCapabilities`.** Mogelijkheden zijn platte booleaanse vlaggen (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) die worden geverifieerd via `verifyDurableFinalCapabilityProofs`, in plaats
  van een geneste structuur in de stijl van `text.chunking` / `attachments.voice`.

## Concrete migratierisico's (nog steeds relevant)

Deze kanaalspecifieke neveneffecten bestonden al vóór de refactor en moeten via de nieuwe verzendpaden blijven
werken. Ze zijn niet hypothetisch: elk ervan is momenteel
geïmplementeerd en essentieel voor de werking.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): de monitor registreert verzonden berichten na een geslaagde verzending in een echo-
  cache. Permanente definitieve verzendingen moeten die cache nog steeds vullen,
  anders kan OpenClaw zijn eigen antwoorden opnieuw verwerken als inkomende gebruikersberichten.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): voegt een optionele model-
  handtekening toe en registreert threads waaraan is deelgenomen na antwoorden in groepen. Permanente
  bezorging mag deze effecten niet omzeilen.
- **Discord en andere voorbereide dispatchers** beheren al rechtstreekse bezorging en
  voorbeeldgedrag. Een kanaal is pas end-to-end permanent wanneer de voorbereide
  dispatcher definitieve berichten expliciet via de verzendcontext routeert; ga niet uit van
  dekking door alleen de generieke adapter.
- **Stille fallbackbezorging van Telegram** moet de volledige geprojecteerde
  payload-array bezorgen, niet alleen de eerste payload, na opdeling/fallback-
  projectie.
- **LINE, Zalo, Nostr** en vergelijkbare hulppaden kunnen verwerking van antwoordtokens,
  mediaproxying, caches voor verzonden berichten of doelen die alleen via callbacks bereikbaar zijn bevatten.
  Ze blijven kanaalgestuurde bezorging gebruiken totdat deze semantiek door
  de verzendadapter wordt ondersteund en door tests wordt gedekt.
- **Hulpfuncties voor rechtstreekse privéberichten** kunnen een antwoordcallback hebben die het enige juiste
  transportdoel is. Generieke uitgaande verzending mag geen doel afleiden uit ruwe
  platformvelden en die callback overslaan.

## Classificatie van fouten

Adapters classificeren transportfouten in gesloten categorieën in de stijl van
`DeliveryFailureKind` (tijdelijk, snelheidslimiet, authenticatie, toestemming, niet gevonden, ongeldige
payload, conflict, geannuleerd, onbekend). Kernbeleid:

- Probeer tijdelijke fouten en fouten door snelheidslimieten opnieuw.
- Probeer fouten door een ongeldige payload niet opnieuw, tenzij er een renderfallback bestaat.
- Probeer authenticatie- of toestemmingsfouten niet opnieuw totdat de configuratie verandert.
- Laat bij niet-gevonden de livefinalisatie terugvallen van bewerken naar een nieuwe verzending wanneer
  het kanaal aangeeft dat dit veilig is.
- Gebruik bij een conflict ontvangstbewijs-/idempotentiestatus om te bepalen of het bericht
  al bestaat.
- Elke fout nadat de platformaanroep mogelijk is geslaagd, maar voordat het ontvangstbewijs is
  vastgelegd, wordt `unknown_after_send`, tenzij de adapter bewijst dat de platformbewerking
  niet heeft plaatsgevonden.

## Openstaande vragen

- Of Telegram uiteindelijk de polling-
  runner van grammY (`1.43.0`) moet vervangen door een volledig permanente pollingbron die herbezorging op platformniveau
  beheert, en niet alleen OpenClaws blijvende herstartwatermerk
  (`safeCompletedUpdateId`).
- Of de status van het livevoorbeeld in dezelfde record als de intentie voor de definitieve verzending
  moet worden opgeslagen, of in een afzonderlijke opslag voor livestatus.
- Of echo-onderdrukking bij Gateway-fouten in gedeelde ruimten met bots
  het oorspronkelijk geplande mechanisme voor oorsprongstags nodig heeft, een eenvoudiger kanaalspecifiek
  contract, of buiten het bereik valt.
- Welke kanalen systeemeigen ondersteuning voor oorsprong/metadata hebben voor echo-
  onderdrukking tussen bots en welke een permanent uitgaand register nodig hebben.

## Gerelateerd

- [Berichten](/nl/concepts/messages)
- [Streaming en opdeling](/nl/concepts/streaming)
- [Voortgangsconcepten](/nl/concepts/progress-drafts)
- [Beleid voor nieuwe pogingen](/nl/concepts/retry)
- [Uitgaande kanaal-API](/nl/plugins/sdk-channel-outbound)
- [Inkomende kanaal-API](/nl/plugins/sdk-channel-inbound)
