---
read_when:
    - Je bouwt een nieuwe Plugin voor een berichtenkanaal
    - Je wilt OpenClaw verbinden met een berichtenplatform
    - Je moet het adapteroppervlak van ChannelPlugin begrijpen
sidebarTitle: Channel Plugins
summary: Stapsgewijze handleiding voor het bouwen van een Plugin voor een berichtenkanaal in OpenClaw
title: Kanaalplugins bouwen
x-i18n:
    generated_at: "2026-07-16T16:08:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Deze handleiding bouwt een kanaalplugin die OpenClaw verbindt met een
berichtenplatform: DM-beveiliging, koppeling, antwoordthreads en uitgaande berichten.

<Info>
  Nieuw met OpenClaw-plugins? Lees eerst [Aan de slag](/nl/plugins/building-plugins)
  voor de pakketstructuur en het instellen van het manifest.
</Info>

## Waar jouw plugin verantwoordelijk voor is

Kanaalplugins implementeren geen tools voor verzenden, bewerken of reageren; de kern biedt één
gedeelde `message`-tool. Jouw plugin is verantwoordelijk voor:

- **Configuratie** - accountomzetting en configuratiewizard
- **Beveiliging** - DM-beleid en toelatingslijsten
- **Koppeling** - DM-goedkeuringsstroom
- **Sessiegrammatica** - hoe providerspecifieke gespreks-id's worden toegewezen aan basis-
  chats, thread-id's en terugvalopties voor bovenliggende items
- **Uitgaand** - tekst, media en peilingen naar het platform verzenden
- **Threading** - hoe antwoorden in threads worden geplaatst
- **Heartbeat-typindicatie** - optionele typ-/bezigsignalen voor Heartbeat-bezorgings-
  doelen

De kern is verantwoordelijk voor de gedeelde berichtentool, promptbedrading, de buitenste vorm van de sessiesleutel,
algemene `:thread:`-boekhouding en verzending.

## Berichtenadapter

Stel een `message`-adapter met `defineChannelMessageAdapter` uit
`openclaw/plugin-sdk/channel-outbound` beschikbaar. Declareer alleen de duurzame mogelijkheden voor definitieve verzending
die jouw native transport daadwerkelijk ondersteunt, onderbouwd door een contracttest
die het native neveneffect en het geretourneerde ontvangstbewijs bewijst. Laat tekst-/mediaverzending
dezelfde transportfuncties gebruiken als de verouderde `outbound`-adapter. Zie voor
het volledige API-contract, de mogelijkhedenmatrix, regels voor ontvangstbewijzen, afronding van
livevoorbeelden, beleid voor ontvangstbevestigingen, tests en de migratietabel
[API voor uitgaande kanaalberichten](/nl/plugins/sdk-channel-outbound).

Als je bestaande `outbound`-adapter al de juiste verzendmethoden en
mogelijkhedenmetadata heeft, leid je de `message`-adapter af met
`createChannelMessageAdapterFromOutbound(...)` in plaats van handmatig nog een
brug te schrijven. Adapterverzendingen retourneren `MessageReceipt`-waarden. Leid verouderde id's
af met `listMessageReceiptPlatformIds(...)` of
`resolveMessageReceiptPrimaryId(...)` in plaats van parallelle `messageIds`-
velden te behouden.

Declareer live- en finalisatiemogelijkheden nauwkeurig - de kern gebruikt deze om te bepalen
wat een kanaal kan doen, en een afwijking tussen het gedeclareerde en werkelijke gedrag is een
mislukte contracttest:

| Oppervlak                             | Waarden                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Kanalen die een conceptvoorbeeld ter plaatse afronden, moeten de runtimelogica
via `defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)` leiden en de gedeclareerde
mogelijkheden onderbouwen met `verifyChannelMessageLiveCapabilityAdapterProofs(...)`-
en `verifyChannelMessageLiveFinalizerProofs(...)`-tests, zodat native voorbeeld-,
voortgangs-, bewerkings-, terugval-/bewaar-, opschonings- en ontvangstbewijsgedrag niet
ongemerkt kan afwijken.

Inkomende ontvangers die platformbevestigingen uitstellen, moeten
`message.receive.defaultAckPolicy` en `supportedAckPolicies` declareren in plaats van
de timing van bevestigingen in lokale monitorstatus te verbergen. Dek elk gedeclareerd beleid af met
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Verouderde antwoordhelpers zoals `dispatchInboundReplyWithBase` en
`recordInboundSessionAndDispatchReply` blijven beschikbaar voor compatibiliteits-
dispatchers. Gebruik ze niet voor nieuwe kanaalcode; begin in plaats daarvan met de `message`-
adapter, ontvangstbewijzen en levenscyclushelpers voor ontvangen/verzenden op
`openclaw/plugin-sdk/channel-outbound`.

### Inkomende toegang (experimenteel)

Kanalen die inkomende autorisatie migreren, kunnen het experimentele
`openclaw/plugin-sdk/channel-ingress-runtime`-subpad vanuit runtime-ontvangstpaden
gebruiken. Het accepteert platformfeiten, onbewerkte toelatingslijsten, routebeschrijvingen, opdracht-
feiten en toegangsgroepconfiguratie, en retourneert vervolgens projecties voor afzender/route/opdracht/activatie
plus de geordende toegangsgrafiek, terwijl platformopzoekingen en neveneffecten
in de plugin blijven. Houd de normalisatie van de pluginidentiteit in de
beschrijving die je aan de resolver doorgeeft; serialiseer geen onbewerkte overeenkomende waarden uit
de opgeloste status of beslissing. Zie
[API voor kanaaltoegang](/nl/plugins/sdk-channel-ingress) voor het API-ontwerp,
de verantwoordelijkheidsgrens en de testverwachtingen.

### Typindicatoren

Als je kanaal typindicatoren buiten inkomende antwoorden ondersteunt, stel je
`heartbeat.sendTyping(...)` beschikbaar op de kanaalplugin. De kern roept dit aan met het
opgeloste Heartbeat-bezorgingsdoel voordat de uitvoering van het Heartbeat-model begint en
gebruikt de gedeelde levenscyclus voor het actief houden en opschonen van de typindicatie. Voeg
`heartbeat.clearTyping(...)` toe wanneer het platform een expliciet stopsignaal nodig heeft.

### Parameters voor mediabronnen

Als je kanaal berichtentoolparameters toevoegt die mediabronnen bevatten, stel je
die parameternamen beschikbaar via `plugin.actions.describeMessageTool(...).mediaSourceParams`.
De kern gebruikt die expliciete lijst voor de normalisatie van sandboxpaden en het beleid voor
toegang tot uitgaande media, zodat plugins geen speciale gevallen in de gedeelde kern nodig hebben voor
providerspecifieke avatar-, bijlage- of omslagafbeeldingsparameters.

Geef de voorkeur aan een op acties gebaseerde toewijzing zoals `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
zodat niet-gerelateerde acties de media-argumenten van een andere actie niet overnemen. Een platte matrix
werkt nog steeds voor parameters die bewust door elke beschikbare actie worden gedeeld.

Kanalen die een tijdelijke openbare URL beschikbaar moeten stellen zodat media
door het platform kunnen worden opgehaald, kunnen `createHostedOutboundMediaStore(...)` uit
`openclaw/plugin-sdk/outbound-media` gebruiken met Plugin-statusopslag. Houd het parseren van
platformroutes en het afdwingen van tokens in de kanaalplugin; de gedeelde helper
beheert alleen het laden van media, vervalmetadata, chunkrijen en opschoning.

### Vormgeving van native payloads

Als je kanaal providerspecifieke vormgeving nodig heeft voor `message(action="send")`,
gebruik dan bij voorkeur `actions.prepareSendPayload(...)`. Plaats native kaarten, blokken, embeds of
andere duurzame gegevens onder `payload.channelData.<channel>` en laat core deze via
de adapter voor uitgaande berichten verzenden. Gebruik `actions.handleAction(...)` voor verzenden
alleen als compatibiliteitsfallback voor payloads die niet kunnen worden geserialiseerd en
opnieuw geprobeerd.

### Grammatica voor sessiegesprekken

Als je platform extra bereik opslaat in gespreks-id's, houd het parseren daarvan
in de Plugin met `messaging.resolveSessionConversation(...)`. Dat is de
canonieke hook voor het toewijzen van `rawId` aan het basisgespreks-id, een optioneel
thread-id, expliciete `baseConversationId` en eventuele
`parentConversationCandidates`. Wanneer je `parentConversationCandidates` retourneert,
rangschik je deze van de meest specifieke bovenliggende entiteit naar het breedste/basisgesprek.

`messaging.resolveParentConversationCandidates(...)` is een verouderde
compatibiliteitsfallback voor Plugins die alleen bovenliggende fallbacks nodig hebben naast
het generieke/ruwe id. Als beide hooks bestaan, gebruikt core eerst
`resolveSessionConversation(...).parentConversationCandidates` en valt het alleen
terug op `resolveParentConversationCandidates(...)` wanneer de canonieke
hook deze weglaat.

Gebundelde Plugins die dezelfde parsing nodig hebben voordat het kanaalregister opstart,
kunnen een `session-key-api.ts`-bestand op het hoogste niveau beschikbaar stellen met een overeenkomende
`resolveSessionConversation(...)`-export (zie de Feishu- en Telegram-
Plugins). Core gebruikt dit bootstrapveilige oppervlak alleen wanneer het runtime-
Pluginregister nog niet beschikbaar is.

Gebruik `openclaw/plugin-sdk/channel-route` wanneer Plugincode routeachtige
velden moet normaliseren, een onderliggende thread met de bovenliggende route moet vergelijken of een
stabiele deduplicatiesleutel uit `{ channel, to, accountId, threadId }` moet opbouwen. De helper
normaliseert numerieke thread-id's op dezelfde manier als core, dus gebruik deze bij voorkeur in plaats van ad-hoc
`String(threadId)`-vergelijkingen. Plugins met providerspecifieke doelgrammatica
moeten `messaging.resolveOutboundSessionRoute(...)` beschikbaar stellen, zodat core
provider-native sessie- en threadidentiteit krijgt zonder parsershims.

### Ondersteuning voor accountgebonden gesprekskoppelingen

Stel `conversationBindings.supportsCurrentConversationBinding` in wanneer het kanaal
generieke koppelingen voor het huidige gesprek ondersteunt. `createChatChannelPlugin(...)`
stelt deze statische mogelijkheid standaard in op `true`.

Als de ondersteuning per geconfigureerd account verschilt, implementeer dan ook
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Core evalueert deze synchrone hook pas nadat de statische mogelijkheid is
ingeschakeld. Als `false` wordt geretourneerd, zijn generieke mogelijkheden en bewerkingen
voor het huidige gesprek, zoals koppelen, opzoeken, vermelden, bijwerken en ontkoppelen, niet beschikbaar voor dat account.
Als de hook wordt weggelaten, geldt de statische mogelijkheid voor elk account.

Bepaal het antwoord aan de hand van reeds geladen accountconfiguratie of runtimestatus. Deze
hook beheert alleen generieke koppelingen voor het huidige gesprek; deze vervangt geen
geconfigureerde koppelingsregels of sessieroutering die eigendom is van de Plugin. Contracttests
moeten ten minste één ondersteund en één niet-ondersteund account omvatten via het
`ChannelPlugin["conversationBindings"]`-contract dat wordt geëxporteerd door
`openclaw/plugin-sdk/channel-core`.

## Goedkeuringen en kanaalmogelijkheden

De meeste kanaalplugins hebben geen goedkeuringsspecifieke code nodig. Core beheert
`/approve` binnen dezelfde chat, gedeelde payloads voor goedkeuringsknoppen en generieke fallbackbezorging.
`ChannelPlugin.approvals` is verwijderd; plaats feiten over bezorging, native gedrag, rendering en autorisatie
van goedkeuringen in plaats daarvan in één `approvalCapability`-object. `plugin.auth` is alleen
voor inloggen/uitloggen; core leest geen autorisatiehooks voor goedkeuringen meer uit dat object.

Gebruik `approvalCapability.delivery` alleen voor native goedkeuringsroutering of het
onderdrukken van fallbacks, en `approvalCapability.render` alleen wanneer een kanaal werkelijk
aangepaste goedkeuringspayloads nodig heeft in plaats van de gedeelde renderer.

### Autorisatie voor goedkeuringen

- `approvalCapability.authorizeActorAction` en
  `approvalCapability.getActionAvailabilityState` vormen de canonieke
  scheiding voor goedkeuringsautorisatie.
- Gebruik `getActionAvailabilityState` voor de beschikbaarheid van goedkeuringsautorisatie binnen dezelfde chat.
  Houd geconfigureerde goedkeurders beschikbaar voor `/approve`, zelfs wanneer native bezorging
  is uitgeschakeld; gebruik in plaats daarvan de status van het native initiërende oppervlak voor
  richtlijnen over bezorging en configuratie.
- Als je kanaal native uitvoeringsgoedkeuringen beschikbaar stelt, gebruik dan
  `approvalCapability.getExecInitiatingSurfaceState` voor de
  status van het initiërende oppervlak/de native client wanneer deze verschilt van goedkeuringsautorisatie
  binnen dezelfde chat. Core gebruikt die uitvoeringsspecifieke hook om onderscheid te maken tussen `enabled` en
  `disabled`, te bepalen of het initiërende kanaal native uitvoeringsgoedkeuringen
  ondersteunt en het kanaal op te nemen in fallbackrichtlijnen voor native clients.
  `createApproverRestrictedNativeApprovalCapability(...)` vult dit in voor
  het gebruikelijke geval.
- Als een kanaal stabiele eigenaarachtige DM-identiteiten uit bestaande configuratie kan afleiden,
  gebruik dan `createResolvedApproverActionAuthAdapter` uit
  `openclaw/plugin-sdk/approval-runtime` om `/approve` binnen dezelfde chat te beperken
  zonder goedkeuringsspecifieke corelogica toe te voegen.
- Als aangepaste goedkeuringsautorisatie opzettelijk alleen fallback binnen dezelfde chat toestaat, retourneer dan
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` uit
  `openclaw/plugin-sdk/approval-auth-runtime`; anders behandelt core het
  resultaat als expliciete autorisatie van een goedkeurder.
- Als een native callback die eigendom is van een kanaal goedkeuringen rechtstreeks afhandelt, gebruik dan
  `isImplicitSameChatApprovalAuthorization(...)` vóór het afhandelen, zodat impliciete
  fallback nog steeds via de normale actorautorisatie van het kanaal verloopt.

### Levenscyclus van payloads en configuratierichtlijnen

- Gebruik `outbound.shouldSuppressLocalPayloadPrompt` of
  `outbound.beforeDeliverPayload` voor kanaalspecifiek gedrag rond de levenscyclus van payloads,
  zoals het verbergen van dubbele lokale goedkeuringsprompts of het verzenden van typindicatoren
  vóór bezorging.
- Gebruik `approvalCapability.describeExecApprovalSetup` wanneer het kanaal wil
  dat het antwoord voor het uitgeschakelde pad precies uitlegt welke configuratieopties nodig zijn om
  native uitvoeringsgoedkeuringen in te schakelen. De hook ontvangt `{ channel, channelLabel, accountId }`;
  kanalen met benoemde accounts moeten accountgebonden paden renderen, zoals
  `channels.<channel>.accounts.<id>.execApprovals.*`, in plaats van standaardwaarden
  op het hoogste niveau.
- Gebruik `approvalCapability.describePluginApprovalSetup` wanneer richtlijnen bij mislukte
  Plugingoedkeuringen veilig kunnen worden weergegeven bij fouten zonder route en time-outs
  van Plugingoedkeuringen. `createApproverRestrictedNativeApprovalCapability(...)` leidt
  dit niet af uit `describeExecApprovalSetup`; geef dezelfde helper alleen expliciet door
  wanneer Plugin- en uitvoeringsgoedkeuringen daadwerkelijk dezelfde native configuratie gebruiken.

### Native bezorging van goedkeuringen

Als een kanaal native bezorging van goedkeuringen nodig heeft, houd de kanaalcode dan gericht op
doelnormalisatie plus feiten over transport en presentatie. Gebruik
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` en
`createApproverRestrictedNativeApprovalCapability` uit
`openclaw/plugin-sdk/approval-runtime`. Plaats de kanaalspecifieke feiten achter
`approvalCapability.nativeRuntime`, bij voorkeur via
`createChannelApprovalNativeRuntimeAdapter(...)` of
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, zodat core de
handler kan samenstellen en het filteren, routeren, dedupliceren en verlopen van aanvragen, het Gateway-
abonnement en meldingen over routering naar elders kan beheren.

`nativeRuntime` is opgesplitst in enkele kleinere scheidingen:

- `availability` - of het account is geconfigureerd en of een verzoek
  moet worden afgehandeld
- `presentation` - zet het gedeelde goedkeuringsweergavemodel om in
  openstaande/opgeloste/verlopen systeemeigen payloads of definitieve acties
- `transport` - bereid doelen voor en verzend/update/verwijder systeemeigen
  goedkeuringsberichten
- `interactions` - optionele hooks voor het koppelen/ontkoppelen/wissen van acties voor systeemeigen knoppen
  of reacties, plus een optionele `cancelDelivered`-hook. Implementeer
  `cancelDelivered` wanneer `deliverPending` procesinterne of persistente
  status registreert (zoals een opslag voor reactiedoelen), zodat die status kan worden vrijgegeven als het
  stoppen van een handler de levering annuleert voordat `bindPending` wordt uitgevoerd, of wanneer
  `bindPending` geen handle retourneert
- `observe` - optionele hooks voor leveringsdiagnostiek

Andere goedkeuringshelpers:

- Gebruik `createNativeApprovalChannelRouteGates` uit
  `openclaw/plugin-sdk/approval-native-runtime` wanneer een kanaal zowel
  systeemeigen levering vanuit de sessieoorsprong als expliciete doorstuurdoelen voor goedkeuringen ondersteunt. De
  helper centraliseert de selectie van goedkeuringsconfiguratie, de afhandeling van `mode`, agent-/sessie-
  filters, accountkoppeling, afstemming van sessiedoelen en afstemming van doellijsten,
  terwijl aanroepers verantwoordelijk blijven voor de kanaal-id, de standaarddoorstuurmodus, het
  opzoeken van accounts, de controle of transport is ingeschakeld, doelnormalisatie en
  doelresolutie vanuit de beurtbron. Gebruik deze niet om door de kern beheerde standaardwaarden voor kanaalbeleid
  te maken; geef de gedocumenteerde standaardmodus van het kanaal expliciet door.
- `createChannelNativeOriginTargetResolver` gebruikt standaard de gedeelde matcher voor kanaalroutes
  voor `{ to, accountId, threadId }`-doelen. Geef
  `targetsMatch` alleen door wanneer een kanaal providerspecifieke equivalentieregels heeft,
  zoals het vergelijken van Slack-tijdstempelvoorvoegsels. Geef `normalizeTargetForMatch` door wanneer
  het kanaal provider-id's moet canonicaliseren voordat de standaardroutematcher
  of een aangepaste `targetsMatch`-callback wordt uitgevoerd, terwijl het
  oorspronkelijke doel voor levering behouden blijft. Gebruik `normalizeTarget` alleen wanneer het opgeloste
  leveringsdoel zelf moet worden gecanonicaliseerd.
- Als het kanaal door de runtime beheerde objecten nodig heeft, zoals een client, token, Bolt-
  app of Webhook-ontvanger, registreer deze dan via
  `openclaw/plugin-sdk/channel-runtime-context`. Met het generieke runtime-contextregister
  kan de kern door mogelijkheden aangestuurde handlers opstarten vanuit de opstartstatus van het kanaal
  zonder goedkeuringsspecifieke wrapperlijm toe te voegen.
- Gebruik de lagere `createChannelApprovalHandler` of
  `createChannelNativeApprovalRuntime` alleen wanneer de door mogelijkheden aangestuurde naad
  nog niet expressief genoeg is.
- Systeemeigen goedkeuringskanalen moeten zowel `accountId` als `approvalKind`
  via die helpers routeren. `accountId` beperkt goedkeuringsbeleid voor meerdere accounts
  tot het juiste botaccount en `approvalKind` houdt het goedkeuringsgedrag
  voor exec versus Plugin beschikbaar voor het kanaal zonder hardgecodeerde vertakkingen in
  de kern.
- De kern beheert ook meldingen over het omleiden van goedkeuringen. Kanaalplugins mogen
  niet hun eigen vervolgberichten met "goedkeuring is naar privéberichten/een ander kanaal gestuurd" verzenden vanuit
  `createChannelNativeApprovalRuntime`; stel in plaats daarvan nauwkeurige routering voor oorsprong +
  privéberichten van goedkeurders beschikbaar via de gedeelde helpers voor goedkeuringsmogelijkheden en laat
  de kern de daadwerkelijke leveringen verzamelen voordat een melding wordt teruggestuurd naar de
  chat waarin het verzoek is gestart.
- Behoud het type van de geleverde goedkeurings-id van begin tot eind. Systeemeigen clients mogen
  niet op basis van lokale kanaalstatus de routering van exec- versus Plugin-goedkeuringen raden of
  herschrijven.
- Geef die expliciete `approvalKind` door aan `resolveApprovalOverGateway`. Dit gebruikt
  de canonieke `approval.resolve`-service en retourneert de geregistreerde winnaar wanneer
  een ander oppervlak als eerste antwoordt. De oudere expliciete invoer `resolveMethod`
  blijft bestaan voor door opdrachten ondersteunde bedieningselementen; nieuwe systeemeigen acties mogen deze niet gebruiken of
  het type afleiden uit een id.
- Verschillende goedkeuringstypen kunnen bewust verschillende systeemeigen
  oppervlakken beschikbaar stellen. Huidige gebundelde voorbeelden: Matrix behoudt dezelfde systeemeigen privébericht-/kanaal-
  routering en reactie-UX voor exec- en Plugin-goedkeuringen, terwijl
  authenticatie nog steeds per goedkeuringstype kan verschillen; Slack houdt systeemeigen goedkeuringsroutering beschikbaar
  voor zowel exec- als Plugin-id's.
- `createApproverRestrictedNativeApprovalAdapter` bestaat nog steeds als
  compatibiliteitswrapper, maar nieuwe code moet bij voorkeur de mogelijkhedenbouwer gebruiken
  en `approvalCapability` beschikbaar stellen op de Plugin.

### Smallere runtime-subpaden voor goedkeuringen

Geef voor intensief gebruikte kanaalingangen de voorkeur aan deze smallere subpaden boven de bredere
`approval-runtime`-barrel wanneer je slechts één onderdeel van die familie nodig hebt:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Geef ook de voorkeur aan `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` en
`openclaw/plugin-sdk/reply-chunking` boven bredere overkoepelende oppervlakken wanneer je
ze niet allemaal nodig hebt.

### Setup-subpaden

- `openclaw/plugin-sdk/setup-runtime` omvat de runtime-veilige setuphelpers:
  `createSetupTranslator`, importveilige adapters voor setuppatches
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), uitvoer van opzoeknotities,
  `promptResolvedAllowFrom`, `splitSetupEntries` en de gedelegeerde
  bouwers voor setup-proxy's.
- `openclaw/plugin-sdk/channel-setup` omvat de setupbouwers
  voor optionele installatie plus enkele setupveilige primitieven: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` en `splitSetupEntries`.
- Gebruik de bredere `openclaw/plugin-sdk/setup`-naad alleen wanneer je ook
  de zwaardere gedeelde setup-/configuratiehelpers nodig hebt, zoals
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Als je kanaal op setupoppervlakken alleen "installeer eerst deze Plugin" wil weergeven,
geef dan de voorkeur aan `createOptionalChannelSetupSurface(...)`. De gegenereerde
adapter/wizard weigert standaard configuratieschrijfbewerkingen en voltooiing, en hergebruikt
hetzelfde bericht over de vereiste installatie bij validatie, voltooiing en
de tekst van de documentatielink.

Als je kanaal door omgevingsvariabelen aangestuurde setup of authenticatie ondersteunt en generieke opstart-/configuratiestromen
die omgevingsnamen moeten kennen voordat de runtime wordt geladen, declareer ze dan in het
Plugin-manifest met `channelEnvVars`. Behoud `envVars` van de kanaalruntime of lokale
constanten alleen voor op beheerders gerichte tekst.

Als je kanaal kan verschijnen in `status`, `channels list`, `channels status` of
SecretRef-scans voordat de Plugin-runtime start, voeg dan `openclaw.setupEntry` toe in
`package.json`. Dat ingangspunt moet veilig kunnen worden geïmporteerd in alleen-lezen opdrachtpaden
en moet de kanaalmetadata, de setupveilige configuratieadapter,
statusadapter en metadata voor geheime kanaaldoelen retourneren die nodig zijn voor die
samenvattingen. Start geen clients, listeners of transportruntimes vanuit de
setupingang.

Houd ook het importpad van de hoofdkanaalingang beperkt. Discovery kan
de ingang en de kanaalpluginmodule evalueren om mogelijkheden te registreren zonder
het kanaal te activeren. Bestanden zoals `channel-plugin-api.ts` moeten
het kanaalpluginobject exporteren zonder setupwizards, transport-
clients, socketlisteners, subprocess-starters of serviceopstartmodules te importeren.
Plaats die runtimeonderdelen in modules die worden geladen vanuit `registerFull(...)`, runtime-
setters of luie mogelijkhedenadapters.

### Andere beperkte kanaalsubpaden

Geef voor andere intensief gebruikte kanaalpaden de voorkeur aan de beperkte helpers boven bredere verouderde
oppervlakken:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` en
  `openclaw/plugin-sdk/account-helpers` voor configuratie met meerdere accounts en
  terugval naar het standaardaccount
- `openclaw/plugin-sdk/inbound-envelope` en
  `openclaw/plugin-sdk/channel-inbound` voor inkomende route/envelop en
  bedrading voor registreren en doorsturen
- `openclaw/plugin-sdk/channel-targets` voor helpers voor doelparsing
- `openclaw/plugin-sdk/outbound-media` voor het laden van media en
  `openclaw/plugin-sdk/channel-outbound` voor delegaten voor uitgaande identiteit/verzending
  en payloadplanning
- `buildThreadAwareOutboundSessionRoute(...)` uit
  `openclaw/plugin-sdk/channel-core` wanneer een uitgaande route een expliciete
  `replyToId`/`threadId` moet behouden of de huidige `:thread:`-
  sessie moet herstellen nadat de basissessiesleutel nog steeds overeenkomt. Providerplugins kunnen
  prioriteit, achtervoegselgedrag en normalisatie van thread-id's overschrijven wanneer
  hun platform systeemeigen semantiek voor threadlevering heeft.
- `openclaw/plugin-sdk/thread-bindings-runtime` voor de levenscyclus
  van threadkoppelingen en adapterregistratie
- `openclaw/plugin-sdk/agent-media-payload` alleen wanneer een verouderde veldindeling
  voor agent-/mediapayloads nog vereist is
- `openclaw/plugin-sdk/telegram-command-config` (verouderd: geen gebundelde
  Plugin gebruikt dit in productie) voor normalisatie van aangepaste Telegram-opdrachten,
  validatie van duplicaten/conflicten en een opdrachtconfiguratiecontract
  dat stabiel blijft bij terugval; geef voor nieuwe Plugincode de voorkeur aan lokale verwerking van opdrachtconfiguratie in de Plugin

Kanalen met alleen authenticatie kunnen doorgaans bij het standaardpad stoppen: de kern verwerkt
goedkeuringen en de Plugin stelt alleen uitgaande/authenticatiemogelijkheden beschikbaar. Systeemeigen
goedkeuringskanalen zoals Matrix, Slack, Telegram en aangepaste chattransporten
moeten de gedeelde systeemeigen helpers gebruiken in plaats van een eigen goedkeuringslevenscyclus
te bouwen.

## Beleid voor inkomende vermeldingen

Houd de verwerking van inkomende vermeldingen opgesplitst in twee lagen:

- door de Plugin beheerde bewijsverzameling
- evaluatie van gedeeld beleid

Gebruik `openclaw/plugin-sdk/channel-mention-gating` voor beslissingen over vermeldingsbeleid.
Gebruik `openclaw/plugin-sdk/channel-inbound` alleen wanneer je de bredere
barrel met inkomende helpers nodig hebt.

Geschikt voor lokale logica in de Plugin:

- detectie van antwoorden aan de bot
- detectie van geciteerde botberichten
- controles op deelname aan threads
- uitsluitingen voor service-/systeemberichten
- platformeigen caches die nodig zijn om deelname van de bot aan te tonen

Geschikt voor de gedeelde helper:

- `requireMention`
- resultaat van expliciete vermelding
- toegestane lijst voor impliciete vermeldingen
- omzeiling voor opdrachten
- definitieve beslissing om over te slaan

Aanbevolen stroom:

1. Bereken lokale vermeldingsfeiten.
2. Geef die feiten door aan `resolveInboundMentionDecision({ facts, policy })`.
3. Gebruik `decision.effectiveWasMentioned`, `decision.shouldBypassMention` en
   `decision.shouldSkip` in je inkomende poort.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` retourneert een booleaanse waarde. `hasAnyMention`,
`isExplicitlyMentioned` en `canResolveExplicit` zijn afkomstig uit de eigen
systeemeigen vermeldingsmetadata van het kanaal (berichtentiteiten, vlaggen voor antwoorden aan de bot en vergelijkbare gegevens);
geef waarden voor `false`/`undefined` op wanneer je platform deze niet kan detecteren.

`api.runtime.channel.mentions` stelt dezelfde gedeelde vermeldingshelpers beschikbaar voor
gebundelde kanaalplugins die al afhankelijk zijn van runtime-injectie:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Als je alleen `implicitMentionKindWhen` en `resolveInboundMentionDecision` nodig hebt,
importeer ze dan uit `openclaw/plugin-sdk/channel-mention-gating` om te voorkomen dat
ongerelateerde inkomende runtimehelpers worden geladen.

## Stapsgewijze uitleg

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakket en manifest">
    Maak de standaardpluginbestanden. Het veld `channels` in
    `openclaw.plugin.json` (niet een veld `kind`) geeft aan dat een manifest
    eigenaar is van een kanaal. Zie voor alle pakketmetadata
    [Plugin instellen en configureren](/nl/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Verbind OpenClaw met Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Kanaalplugin voor Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bottoken",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valideert `plugins.entries.acme-chat.config`. Gebruik dit voor
    instellingen die eigendom zijn van de plugin en niet tot de configuratie van het kanaalaccount behoren.
    `channelConfigs.acme-chat.schema` valideert `channels.acme-chat` en is de
    bron in het koude pad die door het configuratieschema, de installatie en UI-oppervlakken wordt gebruikt voordat de
    pluginruntime wordt geladen. Zie [Pluginmanifest](/nl/plugins/manifest) voor het volledige
    overzicht van velden op het hoogste niveau.

  </Step>

  <Step title="Het kanaalpluginobject bouwen">
    De interface `ChannelPlugin` heeft veel optionele adapteroppervlakken. Begin met
    het minimum — `id`, `config` en `setup` — en voeg adapters toe wanneer je
    ze nodig hebt.

    Maak `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // je API-client voor het platform

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is vereist");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // Het oplossen/inspecteren van accounts hoort bij `config`, niet bij `setup`.
        // `setup` omvat schrijfbewerkingen voor onboarding (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // DM-beveiliging: wie de bot berichten mag sturen
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Koppelen: goedkeuringsproces voor nieuwe DM-contacten
      pairing: {
        text: {
          idLabel: "Acme Chat-gebruikersnaam",
          message: "Stuur deze code om je identiteit te verifiëren:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Koppelingscode: ${code}`);
          },
        },
      },

      // Threading: hoe antwoorden worden afgeleverd
      threading: { topLevelReplyToMode: "reply" },

      // Uitgaand: berichten naar het platform sturen
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Voor kanalen die zowel canonieke DM-sleutels op het hoogste niveau als verouderde geneste sleutels accepteren, gebruik je de helpers uit `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` en `normalizeChannelDmPolicy` geven accountspecifieke waarden voorrang op overgenomen hoofdwaarden. Koppel dezelfde resolver via `normalizeLegacyDmAliases` aan herstel door doctor, zodat de runtime en migratie hetzelfde contract lezen.

    <Accordion title="Wat createChatChannelPlugin voor je doet">
      In plaats van adapterinterfaces op laag niveau handmatig te implementeren, geef je
      declaratieve opties door en stelt de builder ze samen:

      | Optie | Wat deze koppelt |
      | --- | --- |
      | `security.dm` | Begrensde resolver voor DM-beveiliging op basis van configuratievelden |
      | `pairing.text` | Tekstgebaseerd DM-koppelingsproces met code-uitwisseling |
      | `threading` | Resolver voor antwoordmodus (vast, accountspecifiek of aangepast) |
      | `outbound.attachedResults` | Verzendfuncties die resultaatmetadata retourneren (bericht-ID's); vereist een aangrenzende `channel`-id zodat de kern het geretourneerde afleveringsresultaat kan markeren |

      Je kunt in plaats van de declaratieve opties ook onbewerkte adapterobjecten doorgeven
      als je volledige controle nodig hebt.

      Onbewerkte uitgaande adapters kunnen een functie `chunker(text, limit, ctx)` definiëren.
      De optionele `ctx.formatting` bevat beslissingen over opmaak tijdens aflevering,
      zoals `maxLinesPerMessage`; pas deze vóór het verzenden toe, zodat antwoordthreads
      en segmentgrenzen eenmaal door de gedeelde uitgaande aflevering worden bepaald.
      Verzendcontexten bevatten ook `replyToIdSource` (`implicit` of `explicit`)
      wanneer een native antwoorddoel is opgelost, zodat payloadhelpers
      expliciete antwoordtags kunnen behouden zonder een impliciet, eenmalig antwoordslot te verbruiken.
    </Accordion>

  </Step>

  <Step title="Het ingangspunt aansluiten">
    Maak `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Kanaalplugin voor Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat-beheer");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat-beheer",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Plaats CLI-descriptors die eigendom zijn van het kanaal in `registerCliMetadata(...)`, zodat OpenClaw
    ze in de hoofdhulp kan tonen zonder de volledige kanaalruntime te activeren,
    terwijl normale volledige laadbewerkingen dezelfde descriptors blijven gebruiken voor de daadwerkelijke
    commandoregistratie. Houd `registerFull(...)` gereserveerd voor werk dat alleen tijdens runtime plaatsvindt.
    `defineChannelPluginEntry` verwerkt de scheiding tussen registratiemodi automatisch.
    Als `registerFull(...)` Gateway-RPC-methoden registreert, gebruik dan een
    pluginspecifiek voorvoegsel. De beheerdersnaamruimten van de kern (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd
    omgezet naar `operator.admin`. Zie
    [Ingangspunten](/nl/plugins/sdk-entrypoints#definechannelpluginentry) voor alle
    opties.

  </Step>

  <Step title="Een installatie-ingang toevoegen">
    Maak `setup-entry.ts` voor lichtgewicht laden tijdens onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw laadt dit in plaats van het volledige ingangspunt wanneer het kanaal is uitgeschakeld
    of niet is geconfigureerd. Zo wordt voorkomen dat zware runtimecode tijdens installatieprocessen wordt geladen.
    Zie [Installatie en configuratie](/nl/plugins/sdk-setup#setup-entry) voor details.

    Gebundelde werkruimtekanelen die installatieveilige exports over aanvullende
    modules verdelen, kunnen `defineBundledChannelSetupEntry(...)` uit
    `openclaw/plugin-sdk/channel-entry-contract` gebruiken wanneer ze ook een
    expliciete runtimesetter voor de installatiefase nodig hebben.

  </Step>

  <Step title="Inkomende berichten verwerken">
    Je plugin moet berichten van het platform ontvangen en doorsturen naar
    OpenClaw. Het gebruikelijke patroon is een Webhook die het verzoek verifieert en
    het via de handler voor inkomende berichten van je kanaal doorstuurt:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // door de plugin beheerde authenticatie (verifieer zelf de handtekeningen)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Je handler voor inkomende berichten stuurt het bericht door naar OpenClaw.
          // De precieze aansluiting hangt af van je platform-SDK —
          // bekijk een echt voorbeeld in het gebundelde pluginpakket voor Microsoft Teams of Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      De verwerking van inkomende berichten is kanaalspecifiek. Elke kanaalplugin beheert
      zijn eigen inkomende pijplijn. Bekijk gebundelde kanaalplugins
      (bijvoorbeeld het pluginpakket voor Microsoft Teams of Google Chat) voor praktijkvoorbeelden.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schrijf tests op dezelfde locatie in `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Zie [Testen](/nl/plugins/sdk-testing) voor gedeelde testhulpprogramma's.

</Step>
</Steps>

## Bestandsstructuur

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # metagegevens van openclaw.channel
├── openclaw.plugin.json      # Manifest met configuratieschema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Openbare exports (optioneel)
├── runtime-api.ts            # Interne runtime-exports (optioneel)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # API-client voor het platform
    └── runtime.ts            # Runtime-opslag (indien nodig)
```

## Geavanceerde onderwerpen

<CardGroup cols={2}>
  <Card title="Threadopties" icon="git-branch" href="/nl/plugins/sdk-entrypoints#registration-mode">
    Vaste, accountgebonden of aangepaste antwoordmodi
  </Card>
  <Card title="Integratie van berichtentools" icon="puzzle" href="/nl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool en actiedetectie
  </Card>
  <Card title="Doelbepaling" icon="crosshair" href="/nl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime-hulpprogramma's" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, STT, media, subagent via api.runtime
  </Card>
  <Card title="API voor inkomende kanaalgebeurtenissen" icon="bolt" href="/nl/plugins/sdk-channel-inbound">
    Gedeelde levenscyclus van inkomende gebeurtenissen: opnemen, bepalen, vastleggen, doorsturen, voltooien
  </Card>
</CardGroup>

<Note>
Er bestaan nog enkele gebundelde hulpinterfaces voor het onderhoud en de
compatibiliteit van gebundelde plugins. Ze zijn niet het aanbevolen patroon
voor nieuwe kanaalplugins; geef de voorkeur aan de generieke subpaden voor
kanaal, configuratie, antwoorden en runtime van het gemeenschappelijke
SDK-oppervlak, tenzij je die gebundelde pluginfamilie rechtstreeks onderhoudt.
</Note>

## Volgende stappen

- [Providerplugins](/nl/plugins/sdk-provider-plugins) - als je plugin ook modellen aanbiedt
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige referentie voor imports via subpaden
- [SDK-testen](/nl/plugins/sdk-testing) - testhulpprogramma's en contracttests
- [Pluginmanifest](/nl/plugins/manifest) - volledig manifestschema

## Gerelateerd

- [Plugin SDK-configuratie](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugins voor de agent-harnas](/nl/plugins/sdk-agent-harness)
