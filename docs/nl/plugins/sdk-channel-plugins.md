---
read_when:
    - Je bouwt een nieuwe Plugin voor berichtenkanalen
    - Je wilt OpenClaw verbinden met een berichtenplatform
    - Je moet het adapteroppervlak van ChannelPlugin begrijpen
sidebarTitle: Channel Plugins
summary: Stapsgewijze handleiding voor het bouwen van een berichtenkanaal-Plugin voor OpenClaw
title: Channel-plugins bouwen
x-i18n:
    generated_at: "2026-06-27T18:06:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Deze gids doorloopt het bouwen van een kanaalplugin die OpenClaw verbindt met een
berichtenplatform. Aan het einde heb je een werkend kanaal met DM-beveiliging,
koppeling, antwoordthreads en uitgaande berichten.

<Info>
  Als je nog geen OpenClaw-plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basisstructuur van het pakket
  en het instellen van het manifest.
</Info>

## Hoe kanaalplugins werken

Kanaalplugins hebben geen eigen tools voor verzenden/bewerken/reageren nodig. OpenClaw houdt één
gedeelde `message`-tool in de core. Je plugin beheert:

- **Configuratie** - accountresolutie en installatiewizard
- **Beveiliging** - DM-beleid en allowlists
- **Koppeling** - DM-goedkeuringsflow
- **Sessiesyntaxis** - hoe providerspecifieke gespreks-id's worden gekoppeld aan basischats, thread-id's en bovenliggende fallbacks
- **Uitgaand** - tekst, media en peilingen naar het platform verzenden
- **Threading** - hoe antwoorden in threads worden geplaatst
- **Heartbeat-typen** - optionele typ-/bezig-signalen voor Heartbeat-bezorgdoelen

Core beheert de gedeelde message-tool, promptkoppeling, de buitenste vorm van de sessiesleutel,
generieke `:thread:`-administratie en dispatch.

Nieuwe kanaalplugins moeten ook een `message`-adapter beschikbaar stellen met
`defineChannelMessageAdapter` uit `openclaw/plugin-sdk/channel-outbound`. De
adapter declareert welke duurzame mogelijkheden voor definitief verzenden het native transport
daadwerkelijk ondersteunt en laat tekst-/mediaverzendingen naar dezelfde transportfuncties verwijzen als
de legacy `outbound`-adapter. Declareer een mogelijkheid alleen wanneer een contracttest
het native neveneffect en het geretourneerde ontvangstbewijs bewijst.
Zie voor het volledige API-contract, voorbeelden, mogelijkheidmatrix, ontvangstbewijsregels, finalisatie van livevoorvertoningen,
receive-ack-beleid, tests en migratietabel
[Channel outbound API](/nl/plugins/sdk-channel-outbound).
Als de bestaande `outbound`-adapter al de juiste verzendmethoden en
mogelijkheidsmetadata heeft, gebruik dan `createChannelMessageAdapterFromOutbound(...)` om
de `message`-adapter af te leiden in plaats van handmatig nog een bridge te schrijven.
Adapterverzendingen moeten `MessageReceipt`-waarden retourneren. Wanneer compatibiliteitscode
nog legacy id's nodig heeft, leid die dan af met `listMessageReceiptPlatformIds(...)`
of `resolveMessageReceiptPrimaryId(...)` in plaats van parallelle
`messageIds`-velden in nieuwe lifecycle-code te behouden.
Kanalen met preview-ondersteuning moeten ook `message.live.capabilities` declareren met
de exacte live lifecycle die ze beheren, zoals `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` of
`quietFinalization`. Kanalen die een conceptvoorvertoning op dezelfde plek finaliseren, moeten
ook `message.live.finalizer.capabilities` declareren, zoals `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` en
`retainOnAmbiguousFailure`, en de runtime-logica routeren via
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)`. Houd die mogelijkheden onderbouwd
met `verifyChannelMessageLiveCapabilityAdapterProofs(...)`- en
`verifyChannelMessageLiveFinalizerProofs(...)`-tests, zodat native preview-,
voortgangs-, bewerkings-, fallback-/retentie-, opruim- en ontvangstbewijsgedrag niet stilzwijgend kan afwijken.
Inkomende receivers die platformbevestigingen uitstellen, moeten
`message.receive.defaultAckPolicy` en `supportedAckPolicies` declareren in plaats van
ack-timing te verbergen in monitor-lokale state. Dek elk gedeclareerd beleid af met
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Legacy antwoordhelpers zoals `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` en `recordInboundSessionAndDispatchReply`
blijven beschikbaar voor compatibiliteitsdispatchers. Gebruik die namen niet voor nieuwe
kanaalcode; nieuwe plugins moeten beginnen met de `message`-adapter, ontvangstbewijzen en
receive/send-lifecyclehelpers op `openclaw/plugin-sdk/channel-outbound`.

Kanalen die inkomende autorisatie migreren, kunnen het experimentele
`openclaw/plugin-sdk/channel-ingress-runtime`-subpad gebruiken vanuit runtime-receivepaden.
Het subpad houdt platformlookup en neveneffecten in de plugin, terwijl
allowlist-stateresolutie, route-/sender-/command-/event-/activation-
beslissingen, geredigeerde diagnostiek en turn-admission-mapping worden gedeeld. Houd
normalisatie van pluginidentiteit in de descriptor die je aan de resolver doorgeeft; serialiseer geen
ruwe matchwaarden uit de opgeloste state of beslissing. Zie
[Channel ingress API](/nl/plugins/sdk-channel-ingress) voor het API-ontwerp,
de eigendomsgrens en testverwachtingen.

Als je kanaal typindicatoren buiten inkomende antwoorden ondersteunt, stel dan
`heartbeat.sendTyping(...)` beschikbaar op de kanaalplugin. Core roept dit aan met het
opgeloste Heartbeat-bezorgdoel voordat de Heartbeat-modelrun start en
gebruikt de gedeelde typing-keepalive-/cleanup-lifecycle. Voeg `heartbeat.clearTyping(...)`
toe wanneer het platform een expliciet stopsignaal nodig heeft.

Als je kanaal message-tool-parameters toevoegt die mediabronnen dragen, stel die
parameternamen dan beschikbaar via `describeMessageTool(...).mediaSourceParams`. Core gebruikt
die expliciete lijst voor normalisatie van sandboxpaden en uitgaand mediatoegangsbeleid,
zodat plugins geen shared-core-special cases nodig hebben voor providerspecifieke
avatar-, bijlage- of omslagafbeeldingsparameters.
Geef bij voorkeur een op actie gebaseerde map terug, zoals
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, zodat niet-gerelateerde acties niet
de media-argumenten van een andere actie erven. Een platte array werkt nog steeds voor parameters die
opzettelijk door elke blootgestelde actie worden gedeeld.
Kanalen die een tijdelijke openbare URL moeten blootstellen voor een platformzijdige mediafetch,
kunnen `createHostedOutboundMediaStore(...)` gebruiken uit
`openclaw/plugin-sdk/outbound-media` met plugin state stores. Houd platform-
routeparsing en tokenhandhaving in de kanaalplugin; de gedeelde helper
beheert alleen medialaden, vervalmetadata, chunkrijen en opruiming.

Als je kanaal providerspecifieke vormgeving nodig heeft voor `message(action="send")`,
gebruik dan bij voorkeur `actions.prepareSendPayload(...)`. Plaats native cards, blocks, embeds of
andere duurzame data onder `payload.channelData.<channel>` en laat core
de daadwerkelijke verzending uitvoeren via de outbound/message-adapter. Gebruik
`actions.handleAction(...)` voor verzenden alleen als compatibiliteitsfallback voor
payloads die niet geserialiseerd en opnieuw geprobeerd kunnen worden.

Als je platform extra scope in gespreks-id's opslaat, houd die parsing dan
in de plugin met `messaging.resolveSessionConversation(...)`. Dat is de
canonieke hook voor het koppelen van `rawId` aan de basisgespreks-id, optionele thread-
id, expliciete `baseConversationId` en eventuele `parentConversationCandidates`.
Wanneer je `parentConversationCandidates` retourneert, houd ze dan geordend van de
smalste ouder naar het breedste/basisgesprek.

Gebruik `openclaw/plugin-sdk/channel-route` wanneer plugincode route-achtige velden moet normaliseren,
een onderliggende thread met de bovenliggende route moet vergelijken, of een
stabiele dedupe-sleutel moet bouwen uit `{ channel, to, accountId, threadId }`. De helper
normaliseert numerieke thread-id's op dezelfde manier als core dat doet, dus plugins moeten
dit verkiezen boven ad-hocvergelijkingen met `String(threadId)`.
Plugins met providerspecifieke targetsyntaxis moeten
`messaging.resolveOutboundSessionRoute(...)` beschikbaar stellen, zodat core provider-native
sessie- en threadidentiteit krijgt zonder parser-shims te gebruiken.

Gebundelde plugins die dezelfde parsing nodig hebben voordat het kanaalregister opstart,
kunnen ook een top-level bestand `session-key-api.ts` beschikbaar stellen met een bijpassende
`resolveSessionConversation(...)`-export. Core gebruikt dat bootstrap-veilige oppervlak
alleen wanneer het runtime-pluginregister nog niet beschikbaar is.

`messaging.resolveParentConversationCandidates(...)` blijft beschikbaar als een
legacy compatibiliteitsfallback wanneer een plugin alleen bovenliggende fallbacks boven op
de generieke/ruwe id nodig heeft. Als beide hooks bestaan, gebruikt core eerst
`resolveSessionConversation(...).parentConversationCandidates` en valt alleen terug op
`resolveParentConversationCandidates(...)` wanneer de canonieke hook ze weglaat.

## Goedkeuringen en kanaalmogelijkheden

De meeste kanaalplugins hebben geen goedkeuringsspecifieke code nodig.

- Core beheert same-chat `/approve`, gedeelde payloads voor goedkeuringsknoppen en generieke fallback-levering.
- Geef de voorkeur aan één `approvalCapability`-object op de channel-plugin wanneer het kanaal goedkeuringsspecifiek gedrag nodig heeft.
- `ChannelPlugin.approvals` is verwijderd. Plaats feiten voor goedkeuringslevering/native/render/auth op `approvalCapability`.
- `plugin.auth` is alleen login/logout; core leest geen auth-hooks voor goedkeuringen meer uit dat object.
- `approvalCapability.authorizeActorAction` en `approvalCapability.getActionAvailabilityState` zijn de canonieke seam voor goedkeurings-auth.
- Gebruik `approvalCapability.getActionAvailabilityState` voor beschikbaarheid van same-chat goedkeurings-auth.
- Als je kanaal native exec-goedkeuringen beschikbaar stelt, gebruik dan `approvalCapability.getExecInitiatingSurfaceState` voor de status van het initiërende oppervlak/de native client wanneer die verschilt van same-chat goedkeurings-auth. Core gebruikt die exec-specifieke hook om `enabled` en `disabled` te onderscheiden, te bepalen of het initiërende kanaal native exec-goedkeuringen ondersteunt, en het kanaal op te nemen in fallback-richtlijnen voor native clients. `createApproverRestrictedNativeApprovalCapability(...)` vult dit in voor het gebruikelijke geval.
- Gebruik `outbound.shouldSuppressLocalPayloadPrompt` of `outbound.beforeDeliverPayload` voor kanaalspecifiek payload-lifecyclegedrag, zoals het verbergen van dubbele lokale goedkeuringsprompts of het verzenden van typing-indicatoren vóór levering.
- Gebruik `approvalCapability.delivery` alleen voor native goedkeuringsroutering of fallback-onderdrukking.
- Gebruik `approvalCapability.nativeRuntime` voor native goedkeuringsfeiten die eigendom zijn van het kanaal. Houd dit lazy op hot channel entrypoints met `createLazyChannelApprovalNativeRuntimeAdapter(...)`, dat je runtimemodule on demand kan importeren terwijl core nog steeds de goedkeuringslifecycle kan samenstellen.
- Gebruik `approvalCapability.render` alleen wanneer een kanaal echt aangepaste goedkeuringspayloads nodig heeft in plaats van de gedeelde renderer.
- Gebruik `approvalCapability.describeExecApprovalSetup` wanneer het kanaal wil dat het antwoord voor het disabled-pad uitlegt welke exacte configuratieknoppen nodig zijn om native exec-goedkeuringen in te schakelen. De hook ontvangt `{ channel, channelLabel, accountId }`; kanalen met benoemde accounts moeten account-gescopeerde paden renderen, zoals `channels.<channel>.accounts.<id>.execApprovals.*`, in plaats van top-level defaults.
- Als een kanaal stabiele eigenaarachtige DM-identiteiten uit bestaande configuratie kan afleiden, gebruik dan `createResolvedApproverActionAuthAdapter` uit `openclaw/plugin-sdk/approval-runtime` om same-chat `/approve` te beperken zonder goedkeuringsspecifieke core-logica toe te voegen.
- Als aangepaste goedkeurings-auth bewust alleen same-chat fallback toestaat, retourneer dan `markImplicitSameChatApprovalAuthorization({ authorized: true })` uit `openclaw/plugin-sdk/approval-auth-runtime`; anders behandelt core het resultaat als expliciete goedkeurderautorisatie.
- Als een native callback die eigendom is van een kanaal goedkeuringen rechtstreeks oplost, gebruik dan `isImplicitSameChatApprovalAuthorization(...)` vóór het oplossen, zodat impliciete fallback nog steeds via de normale actorautorisatie van het kanaal loopt.
- Als een kanaal native goedkeuringslevering nodig heeft, houd de kanaalcode dan gericht op doelnormalisatie plus transport-/presentatiefeiten. Gebruik `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` en `createApproverRestrictedNativeApprovalCapability` uit `openclaw/plugin-sdk/approval-runtime`. Plaats de kanaalspecifieke feiten achter `approvalCapability.nativeRuntime`, idealiter via `createChannelApprovalNativeRuntimeAdapter(...)` of `createLazyChannelApprovalNativeRuntimeAdapter(...)`, zodat core de handler kan samenstellen en request-filtering, routering, deduplicatie, expiry, Gateway-abonnement en routed-elsewhere-meldingen kan beheren. `nativeRuntime` is opgesplitst in enkele kleinere seams:
- Gebruik `createNativeApprovalChannelRouteGates` uit `openclaw/plugin-sdk/approval-native-runtime` wanneer een kanaal zowel native levering vanuit sessie-origin als expliciete forwarding-doelen voor goedkeuringen ondersteunt. De helper centraliseert selectie van goedkeuringsconfiguratie, `mode`-afhandeling, agent-/sessiefilters, accountbinding, session-target matching en target-list matching, terwijl callers nog steeds eigenaar blijven van de kanaal-id, default forwarding-modus, accountlookup, transport-enabled check, doelnormalisatie en turn-source target resolution. Gebruik dit niet om core-owned kanaalbeleidsdefaults te maken; geef de gedocumenteerde default-modus van het kanaal expliciet door.
- `createChannelNativeOriginTargetResolver` gebruikt standaard de gedeelde channel-route matcher voor `{ to, accountId, threadId }`-targets. Geef `targetsMatch` alleen door wanneer een kanaal providerspecifieke equivalentieregels heeft, zoals Slack timestamp-prefixmatching.
- Geef `normalizeTargetForMatch` door aan `createChannelNativeOriginTargetResolver` wanneer het kanaal provider-id's moet canonicaliseren voordat de default route matcher of een aangepaste `targetsMatch`-callback draait, terwijl het oorspronkelijke doel voor levering behouden blijft. Gebruik `normalizeTarget` alleen wanneer het opgeloste leveringsdoel zelf gecanonicaliseerd moet worden.
- `availability` - of het account is geconfigureerd en of een request moet worden afgehandeld
- `presentation` - map het gedeelde goedkeuringsviewmodel naar pending/resolved/expired native payloads of finale acties
- `transport` - bereid doelen voor en verzend/update/verwijder native goedkeuringsberichten
- `interactions` - optionele bind/unbind/clear-action hooks voor native knoppen of reacties, plus een optionele `cancelDelivered`-hook. Implementeer `cancelDelivered` wanneer `deliverPending` in-process of persistente state registreert (zoals een reaction-target store), zodat die state kan worden vrijgegeven als een handler-stop de levering annuleert voordat `bindPending` draait of wanneer `bindPending` geen handle retourneert
- `observe` - optionele hooks voor leveringsdiagnostiek
- Als het kanaal runtime-owned objecten nodig heeft, zoals een client, token, Bolt-app of webhook receiver, registreer die dan via `openclaw/plugin-sdk/channel-runtime-context`. Het generieke runtime-contextregister laat core capability-gedreven handlers bootstrappen vanuit de opstartstate van het kanaal zonder goedkeuringsspecifieke wrapper-glue toe te voegen.
- Grijp alleen naar het lagere-niveau `createChannelApprovalHandler` of `createChannelNativeApprovalRuntime` wanneer de capability-gedreven seam nog niet expressief genoeg is.
- Native goedkeuringskanalen moeten zowel `accountId` als `approvalKind` via die helpers routeren. `accountId` houdt multi-account goedkeuringsbeleid gescopeerd tot het juiste botaccount, en `approvalKind` houdt exec- versus plugin-goedkeuringsgedrag beschikbaar voor het kanaal zonder hardcoded branches in core.
- Core beheert nu ook meldingen voor goedkeuringsreroutes. Channel-plugins moeten geen eigen follow-upberichten zoals "goedkeuring ging naar DM's / een ander kanaal" verzenden vanuit `createChannelNativeApprovalRuntime`; stel in plaats daarvan accurate origin- en approver-DM-routering beschikbaar via de gedeelde approval capability helpers en laat core de daadwerkelijke leveringen aggregeren voordat er een melding terug naar de initiërende chat wordt geplaatst.
- Behoud het soort geleverde goedkeurings-id end-to-end. Native clients mogen
  exec- versus plugin-goedkeuringsroutering niet raden of herschrijven op basis van kanaal-lokale state.
- Verschillende goedkeuringssoorten kunnen bewust verschillende native oppervlakken beschikbaar stellen.
  Huidige gebundelde voorbeelden:
  - Slack houdt native goedkeuringsroutering beschikbaar voor zowel exec- als plugin-id's.
  - Matrix behoudt dezelfde native DM-/kanaalroutering en reactie-UX voor exec-
    en plugin-goedkeuringen, terwijl auth nog steeds per goedkeuringssoort kan verschillen.
- `createApproverRestrictedNativeApprovalAdapter` bestaat nog steeds als compatibiliteitswrapper, maar nieuwe code moet de voorkeur geven aan de capability builder en `approvalCapability` op de plugin beschikbaar stellen.

Voor hot channel entrypoints geef je de voorkeur aan de smallere runtime-subpaden wanneer je slechts
één deel van die familie nodig hebt:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Geef ook de voorkeur aan `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` en
`openclaw/plugin-sdk/reply-chunking` wanneer je het bredere parapluoppervlak
niet nodig hebt.

Specifiek voor setup:

- `openclaw/plugin-sdk/setup-runtime` dekt de runtime-veilige setuphelpers:
  `createSetupTranslator`, import-veilige setup patch adapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note output,
  `promptResolvedAllowFrom`, `splitSetupEntries` en de gedelegeerde
  setup-proxy builders
- `openclaw/plugin-sdk/setup-runtime` bevat de env-bewuste adapter-seam voor
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` dekt de optional-install setup
  builders plus enkele setup-veilige primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Als je kanaal env-gedreven setup of auth ondersteunt en generieke startup-/configuratieflows
die env-namen moeten kennen voordat de runtime laadt, declareer ze dan in het
pluginmanifest met `channelEnvVars`. Houd channel runtime `envVars` of lokale
constanten alleen voor operatorgerichte tekst.

Als je kanaal kan verschijnen in `status`, `channels list`, `channels status` of
SecretRef-scans voordat de pluginruntime start, voeg dan `openclaw.setupEntry` toe in
`package.json`. Dat entrypoint moet veilig te importeren zijn in read-only commandopaden
en moet de kanaalmetadata, setup-veilige config-adapter, statusadapter
en metadata voor kanaalgeheimdoelen retourneren die nodig zijn voor die samenvattingen. Start geen
clients, listeners of transportruntimes vanuit de setup-entry.

Houd ook het hoofdimportpad van de kanaalentry smal. Discovery kan de
entry en de channel-pluginmodule evalueren om capabilities te registreren zonder het
kanaal te activeren. Bestanden zoals `channel-plugin-api.ts` moeten het channel
plugin-object exporteren zonder setupwizards, transportclients, socket
listeners, subprocess launchers of service-startupmodules te importeren. Plaats die runtime
onderdelen in modules die worden geladen vanuit `registerFull(...)`, runtime setters of lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` en
`splitSetupEntries`

- gebruik de bredere `openclaw/plugin-sdk/setup`-seam alleen wanneer je ook de
  zwaardere gedeelde setup-/confighelpers nodig hebt, zoals
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Als je kanaal alleen "installeer deze plugin eerst" wil adverteren in setup
surfaces, geef dan de voorkeur aan `createOptionalChannelSetupSurface(...)`. De gegenereerde
adapter/wizard falen gesloten bij config writes en finalization, en ze hergebruiken
hetzelfde install-required bericht in validation, finalize en docs-link
copy.

Voor andere hot channel-paden geef je de voorkeur aan de smalle helpers boven bredere legacy
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` en
  `openclaw/plugin-sdk/account-helpers` voor multi-accountconfiguratie en
  fallback naar het standaardaccount
- `openclaw/plugin-sdk/inbound-envelope` en
  `openclaw/plugin-sdk/channel-inbound` voor inkomende route/envelope en
  record-and-dispatch-bedrading
- `openclaw/plugin-sdk/channel-targets` voor helpers voor doelparsing
- `openclaw/plugin-sdk/outbound-media` voor het laden van media en
  `openclaw/plugin-sdk/channel-outbound` voor uitgaande identiteit/send-delegates
  en payloadplanning
- `buildThreadAwareOutboundSessionRoute(...)` uit
  `openclaw/plugin-sdk/channel-core` wanneer een uitgaande route een expliciete
  `replyToId`/`threadId` moet behouden of de huidige `:thread:`-sessie moet herstellen
  nadat de basissessiesleutel nog steeds overeenkomt. Providerplugins kunnen
  prioriteit, suffixgedrag en normalisatie van thread-id's overschrijven wanneer hun platform
  native semantiek voor threadaflevering heeft.
- `openclaw/plugin-sdk/thread-bindings-runtime` voor de lifecycle van thread-binding
  en adapterregistratie
- `openclaw/plugin-sdk/agent-media-payload` alleen wanneer een legacy agent/media-
  payloadveldindeling nog steeds vereist is
- `openclaw/plugin-sdk/telegram-command-config` voor Telegram custom-command-
  normalisatie, validatie van duplicaten/conflicten en een fallback-stabiel command-
  configuratiecontract

Kanalen die alleen auth gebruiken, kunnen meestal bij het standaardpad blijven: core handelt goedkeuringen af en de plugin stelt alleen uitgaande/auth-capabilities beschikbaar. Native goedkeuringskanalen zoals Matrix, Slack, Telegram en aangepaste chattransports moeten de gedeelde native helpers gebruiken in plaats van hun eigen goedkeuringslifecycle te bouwen.

## Beleid voor inkomende vermeldingen

Houd de afhandeling van inkomende vermeldingen gesplitst in twee lagen:

- evidenceverzameling in eigendom van de plugin
- gedeelde beleidsevaluatie

Gebruik `openclaw/plugin-sdk/channel-mention-gating` voor beslissingen over vermeldingsbeleid.
Gebruik `openclaw/plugin-sdk/channel-inbound` alleen wanneer je de bredere inkomende
helper-barrel nodig hebt.

Goed geschikt voor plugin-lokale logica:

- detectie van reply-to-bot
- detectie van quoted-bot
- controles op deelname aan threads
- uitsluitingen voor service-/systeemberichten
- platform-native caches die nodig zijn om botdeelname te bewijzen

Goed geschikt voor de gedeelde helper:

- `requireMention`
- expliciet vermeldingsresultaat
- allowlist voor impliciete vermeldingen
- command-bypass
- definitieve skip-beslissing

Voorkeursflow:

1. Bereken lokale vermeldingsfeiten.
2. Geef die feiten door aan `resolveInboundMentionDecision({ facts, policy })`.
3. Gebruik `decision.effectiveWasMentioned`, `decision.shouldBypassMention` en `decision.shouldSkip` in je inkomende gate.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` stelt dezelfde gedeelde vermeldingshelpers beschikbaar voor
gebundelde kanaalplugins die al afhankelijk zijn van runtime-injectie:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Als je alleen `implicitMentionKindWhen` en
`resolveInboundMentionDecision` nodig hebt, importeer dan uit
`openclaw/plugin-sdk/channel-mention-gating` om te voorkomen dat niet-gerelateerde inkomende
runtimehelpers worden geladen.

Gebruik `resolveInboundMentionDecision({ facts, policy })` voor vermeldingsgating.

## Walkthrough

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakket en manifest">
    Maak de standaard pluginbestanden. Het veld `channel` in `package.json` is
    wat dit een kanaalplugin maakt. Zie voor het volledige oppervlak voor pakketmetadata
    [Plugininstelling en -configuratie](/nl/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valideert `plugins.entries.acme-chat.config`. Gebruik dit voor
    instellingen in eigendom van de plugin die niet de kanaalaccountconfiguratie zijn. `channelConfigs`
    valideert `channels.acme-chat` en is de cold-path-bron die wordt gebruikt door het configuratie-
    schema, setup en UI-oppervlakken voordat de pluginruntime wordt geladen.

  </Step>

  <Step title="Bouw het kanaalpluginobject">
    De interface `ChannelPlugin` heeft veel optionele adapteroppervlakken. Begin met
    het minimum - `id` en `setup` - en voeg adapters toe wanneer je ze nodig hebt.

    Maak `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    Gebruik voor kanalen die zowel canonieke DM-sleutels op topniveau als legacy geneste sleutels accepteren de helpers uit `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` en `normalizeChannelDmPolicy` houden account-lokale waarden vóór overgeërfde rootwaarden. Combineer dezelfde resolver met doctor-reparatie via `normalizeLegacyDmAliases`, zodat runtime en migratie hetzelfde contract lezen.

    <Accordion title="Wat createChatChannelPlugin voor je doet">
      In plaats van low-level adapterinterfaces handmatig te implementeren, geef je
      declaratieve opties door en de builder stelt ze samen:

      | Optie | Wat het bedraadt |
      | --- | --- |
      | `security.dm` | Gescopeerde DM-beveiligingsresolver uit configuratievelden |
      | `pairing.text` | Tekstgebaseerde DM-pairingflow met code-uitwisseling |
      | `threading` | Resolver voor reply-to-modus (vast, account-gescopeerd of aangepast) |
      | `outbound.attachedResults` | Send-functies die resultaatmetadata retourneren (message-id's) |

      Je kunt ook ruwe adapterobjecten doorgeven in plaats van de declaratieve opties
      als je volledige controle nodig hebt.

      Ruwe uitgaande adapters kunnen een functie `chunker(text, limit, ctx)` definiëren.
      De optionele `ctx.formatting` bevat beslissingen over formatting tijdens aflevering,
      zoals `maxLinesPerMessage`; pas deze toe vóór het verzenden, zodat reply-threading
      en chunkgrenzen één keer door gedeelde uitgaande aflevering worden opgelost.
      Send-contexten bevatten ook `replyToIdSource` (`implicit` of `explicit`)
      wanneer een native replydoel is opgelost, zodat payloadhelpers
      expliciete replytags kunnen behouden zonder een impliciete eenmalige replyslot te verbruiken.
    </Accordion>

  </Step>

  <Step title="Bedraad het entrypoint">
    Maak `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    Plaats CLI-descriptors die eigendom zijn van het kanaal in `registerCliMetadata(...)` zodat OpenClaw
    ze in de root-help kan tonen zonder de volledige channel-runtime te activeren,
    terwijl normale volledige loads nog steeds dezelfde descriptors oppakken voor echte commandoregistratie.
    Houd `registerFull(...)` voor werk dat alleen runtime betreft.
    Als `registerFull(...)` Gateway-RPC-methoden registreert, gebruik dan een
    Plugin-specifiek voorvoegsel. Core-beheerdersnaamruimten (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd
    naar `operator.admin` omgezet.
    `defineChannelPluginEntry` handelt de splitsing van registratiemodi automatisch af. Zie
    [Entry Points](/nl/plugins/sdk-entrypoints#definechannelpluginentry) voor alle
    opties.

  </Step>

  <Step title="Voeg een setup-entry toe">
    Maak `setup-entry.ts` voor lichtgewicht laden tijdens onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw laadt dit in plaats van de volledige entry wanneer het kanaal is uitgeschakeld
    of niet is geconfigureerd. Dit voorkomt dat zware runtime-code wordt geladen tijdens setup-flows.
    Zie [Setup and Config](/nl/plugins/sdk-setup#setup-entry) voor details.

    Gebundelde workspace-kanalen die setup-veilige exports opsplitsen in sidecar-
    modules kunnen `defineBundledChannelSetupEntry(...)` uit
    `openclaw/plugin-sdk/channel-entry-contract` gebruiken wanneer ze ook een
    expliciete runtime-setter voor setuptijd nodig hebben.

  </Step>

  <Step title="Verwerk inkomende berichten">
    Je Plugin moet berichten van het platform ontvangen en ze doorsturen naar
    OpenClaw. Het gebruikelijke patroon is een Webhook die het verzoek verifieert en
    het via de inbound handler van je kanaal dispatcht:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Afhandeling van inkomende berichten is kanaalspecifiek. Elke channel-Plugin beheert
      zijn eigen inbound pipeline. Bekijk gebundelde channel-Plugins
      (bijvoorbeeld het Microsoft Teams- of Google Chat-Pluginpakket) voor echte patronen.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Schrijf colocated tests in `src/channel.test.ts`:

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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Raadpleeg [Testen](/nl/plugins/sdk-testing) voor gedeelde testhelpers.

</Step>
</Steps>

## Bestandsstructuur

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Geavanceerde onderwerpen

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/nl/plugins/sdk-entrypoints#registration-mode">
    Vaste, accountgebonden of aangepaste antwoordmodi
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/nl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool en actiedetectie
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/nl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, STT, media, subagent via api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/nl/plugins/sdk-channel-inbound">
    Gedeelde levenscyclus voor inkomende events: opnemen, oplossen, vastleggen, dispatchen, afronden
  </Card>
</CardGroup>

<Note>
Sommige gebundelde helper-seams bestaan nog steeds voor onderhoud van gebundelde plugins en
compatibiliteit. Ze zijn niet het aanbevolen patroon voor nieuwe kanaalplugins;
geef de voorkeur aan de generieke channel/setup/reply/runtime-subpaden van het gemeenschappelijke SDK-
oppervlak, tenzij je die gebundelde pluginfamilie rechtstreeks onderhoudt.
</Note>

## Volgende stappen

- [Provider-Plugins](/nl/plugins/sdk-provider-plugins) - als je plugin ook modellen levert
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige importreferentie voor subpaden
- [SDK-tests](/nl/plugins/sdk-testing) - testhulpmiddelen en contracttests
- [Pluginmanifest](/nl/plugins/manifest) - volledig manifestschema

## Gerelateerd

- [Plugin-SDK instellen](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Agent-harness-plugins](/nl/plugins/sdk-agent-harness)
