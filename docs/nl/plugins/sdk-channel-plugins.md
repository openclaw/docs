---
read_when:
    - Je bouwt een nieuwe Plugin voor een berichtenkanaal
    - Je wilt OpenClaw verbinden met een berichtenplatform
    - Je moet het adapteroppervlak van ChannelPlugin begrijpen
sidebarTitle: Channel Plugins
summary: Stapsgewijze gids voor het bouwen van een berichtenkanaal-Plugin voor OpenClaw
title: Kanaalplugins bouwen
x-i18n:
    generated_at: "2026-07-02T22:40:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Deze gids loopt door het bouwen van een kanaalplugin die OpenClaw verbindt met een
berichtenplatform. Aan het einde heb je een werkend kanaal met DM-beveiliging,
koppeling, antwoordthreading en uitgaande berichten.

<Info>
  Als je nog niet eerder een OpenClaw-plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basispakketstructuur
  en manifestconfiguratie.
</Info>

## Hoe kanaalplugins werken

Kanaalplugins hebben geen eigen tools voor verzenden/bewerken/reageren nodig. OpenClaw houdt één
gedeelde `message`-tool in de kern. Jouw plugin beheert:

- **Configuratie** - accountresolutie en installatiewizard
- **Beveiliging** - DM-beleid en allowlists
- **Koppeling** - DM-goedkeuringsflow
- **Sessiesyntaxis** - hoe providerspecifieke gespreks-id's worden gekoppeld aan basischats, thread-id's en ouder-fallbacks
- **Uitgaand** - tekst, media en polls naar het platform verzenden
- **Threading** - hoe antwoorden worden gethread
- **Heartbeat-typen** - optionele typ-/bezig-signalen voor Heartbeat-afleverdoelen

De kern beheert de gedeelde berichtentool, promptbedrading, de buitenste sessiesleutelvorm,
generieke `:thread:`-boekhouding en dispatch.

Nieuwe kanaalplugins moeten ook een `message`-adapter beschikbaar stellen met
`defineChannelMessageAdapter` uit `openclaw/plugin-sdk/channel-outbound`. De
adapter declareert welke duurzame definitieve verzendmogelijkheden het native transport
daadwerkelijk ondersteunt en wijst tekst-/mediaverzendingen naar dezelfde transportfuncties als
de legacy `outbound`-adapter. Declareer een mogelijkheid alleen wanneer een contracttest
het native side effect en de geretourneerde ontvangstbevestiging bewijst.
Zie voor het volledige API-contract, voorbeelden, mogelijkhedenmatrix, ontvangstregels, live
preview-finalisatie, beleid voor ontvangstbevestigingen, tests en migratietabel
[API voor uitgaande kanalen](/nl/plugins/sdk-channel-outbound).
Als de bestaande `outbound`-adapter al de juiste verzendmethoden en
mogelijkheidsmetadata heeft, gebruik dan `createChannelMessageAdapterFromOutbound(...)` om
de `message`-adapter af te leiden in plaats van handmatig nog een bridge te schrijven.
Adapterverzendingen moeten `MessageReceipt`-waarden retourneren. Wanneer compatibiliteitscode
nog legacy-id's nodig heeft, leid die dan af met `listMessageReceiptPlatformIds(...)`
of `resolveMessageReceiptPrimaryId(...)` in plaats van parallelle
`messageIds`-velden in nieuwe lifecycle-code te behouden.
Kanalen met preview-ondersteuning moeten ook `message.live.capabilities` declareren met
de exacte live lifecycle die ze beheren, zoals `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` of
`quietFinalization`. Kanalen die een conceptpreview op dezelfde plek finaliseren, moeten
ook `message.live.finalizer.capabilities` declareren, zoals `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` en
`retainOnAmbiguousFailure`, en de runtimelogica routeren via
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)`. Houd die mogelijkheden onderbouwd
met tests voor `verifyChannelMessageLiveCapabilityAdapterProofs(...)` en
`verifyChannelMessageLiveFinalizerProofs(...)`, zodat native preview-,
voortgangs-, bewerkings-, fallback-/retentie-, opruim- en ontvangstgedrag niet
stilzwijgend kan afwijken.
Inkomende ontvangers die platformbevestigingen uitstellen, moeten
`message.receive.defaultAckPolicy` en `supportedAckPolicies` declareren in plaats van
bevestigingstiming te verbergen in monitor-lokale state. Dek elk gedeclareerd beleid af met
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Legacy antwoordhelpers zoals `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` en `recordInboundSessionAndDispatchReply`
blijven beschikbaar voor compatibiliteitsdispatchers. Gebruik die namen niet voor nieuwe
kanaalcode; nieuwe plugins moeten beginnen met de `message`-adapter, ontvangstbevestigingen en
ontvangst-/verzend-lifecyclehelpers op `openclaw/plugin-sdk/channel-outbound`.

Kanalen die inkomende autorisatie migreren, kunnen het experimentele
`openclaw/plugin-sdk/channel-ingress-runtime`-subpad gebruiken vanuit runtime-ontvangstpaden.
Het subpad houdt platformlookup en side effects in de plugin, terwijl
allowlist-stateresolutie, route-/afzender-/opdracht-/gebeurtenis-/activatiebeslissingen,
geredigeerde diagnostiek en turn-toelatingsmapping worden gedeeld. Houd
normalisatie van pluginidentiteit in de descriptor die je aan de resolver doorgeeft; serialiseer geen
ruwe matchwaarden uit de opgeloste state of beslissing. Zie
[API voor kanaalingang](/nl/plugins/sdk-channel-ingress) voor het API-ontwerp,
de eigendomsgrens en testverwachtingen.

Als je kanaal typindicatoren buiten inkomende antwoorden ondersteunt, stel dan
`heartbeat.sendTyping(...)` beschikbaar op de kanaalplugin. De kern roept dit aan met het
opgeloste Heartbeat-afleverdoel voordat de Heartbeat-modelrun start en
gebruikt de gedeelde lifecycle voor typ-keepalive en opruiming. Voeg `heartbeat.clearTyping(...)`
toe wanneer het platform een expliciet stopsignaal nodig heeft.

Als je kanaal berichtentoolparameters toevoegt die mediabronnen dragen, stel die
parameternamen dan beschikbaar via `describeMessageTool(...).mediaSourceParams`. De kern gebruikt
die expliciete lijst voor sandbox-padnormalisatie en beleid voor uitgaande mediatoegang,
zodat plugins geen gedeelde-kern-special cases nodig hebben voor providerspecifieke
avatar-, bijlage- of omslagafbeeldingsparameters.
Geef bij voorkeur een op actie gebaseerde map terug, zoals
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, zodat niet-gerelateerde acties niet
de media-argumenten van een andere actie erven. Een platte array werkt nog steeds voor parameters die
bewust worden gedeeld over elke blootgestelde actie.
Kanalen die een tijdelijke openbare URL moeten blootstellen voor een mediaverzoek aan platformzijde
kunnen `createHostedOutboundMediaStore(...)` uit
`openclaw/plugin-sdk/outbound-media` gebruiken met plugin-state stores. Houd
platformrouteparsing en tokenhandhaving in de kanaalplugin; de gedeelde helper
beheert alleen het laden van media, vervalmetadata, chunk-rijen en opruiming.

Als je kanaal providerspecifieke vormgeving nodig heeft voor `message(action="send")`,
gebruik dan bij voorkeur `actions.prepareSendPayload(...)`. Plaats native kaarten, blokken, embeds of
andere duurzame data onder `payload.channelData.<channel>` en laat de kern
de daadwerkelijke verzending uitvoeren via de outbound-/message-adapter. Gebruik
`actions.handleAction(...)` voor verzenden alleen als compatibiliteitsfallback voor
payloads die niet kunnen worden geserialiseerd en opnieuw geprobeerd.

Als je platform extra scope binnen gespreks-id's opslaat, houd die parsing dan
in de plugin met `messaging.resolveSessionConversation(...)`. Dat is de
canonieke hook voor het koppelen van `rawId` aan de basisgespreks-id, optionele thread-id,
expliciete `baseConversationId` en eventuele `parentConversationCandidates`.
Wanneer je `parentConversationCandidates` retourneert, houd ze dan geordend van de
smalste ouder naar het breedste/basisgesprek.

Gebruik `openclaw/plugin-sdk/channel-route` wanneer plugincode route-achtige velden moet normaliseren,
een child-thread met de bovenliggende route moet vergelijken, of een
stabiele deduplicatiesleutel moet bouwen uit `{ channel, to, accountId, threadId }`. De helper
normaliseert numerieke thread-id's op dezelfde manier als de kern, dus plugins moeten dit verkiezen
boven ad-hocvergelijkingen met `String(threadId)`.
Plugins met providerspecifieke doelgrammatica moeten
`messaging.resolveOutboundSessionRoute(...)` beschikbaar stellen, zodat de kern provider-native
sessie- en threadidentiteit krijgt zonder parser-shims te gebruiken.

Gebundelde plugins die dezelfde parsing nodig hebben voordat het kanaalregister opstart,
kunnen ook een top-level `session-key-api.ts`-bestand beschikbaar stellen met een bijbehorende
`resolveSessionConversation(...)`-export. De kern gebruikt dat bootstrap-veilige oppervlak
alleen wanneer het runtime-pluginregister nog niet beschikbaar is.

`messaging.resolveParentConversationCandidates(...)` blijft beschikbaar als
legacy compatibiliteitsfallback wanneer een plugin alleen ouder-fallbacks nodig heeft boven op
de generieke/ruwe id. Als beide hooks bestaan, gebruikt de kern eerst
`resolveSessionConversation(...).parentConversationCandidates` en valt alleen terug op
`resolveParentConversationCandidates(...)` wanneer de canonieke hook ze weglaat.

## Goedkeuringen en kanaalmogelijkheden

De meeste kanaalplugins hebben geen goedkeuringsspecifieke code nodig.

- Core is eigenaar van `/approve` in dezelfde chat, gedeelde payloads voor goedkeuringsknoppen en generieke fallbacklevering.
- Geef de voorkeur aan één `approvalCapability`-object op de kanaalplugin wanneer het kanaal goedkeuringsspecifiek gedrag nodig heeft.
- `ChannelPlugin.approvals` is verwijderd. Zet feiten over goedkeuringslevering/native/render/auth op `approvalCapability`.
- `plugin.auth` is alleen voor inloggen/uitloggen; core leest geen goedkeurings-auth-hooks meer uit dat object.
- `approvalCapability.authorizeActorAction` en `approvalCapability.getActionAvailabilityState` zijn de canonieke approval-auth-seam.
- Gebruik `approvalCapability.getActionAvailabilityState` voor beschikbaarheid van goedkeuringsauth in dezelfde chat. Houd geconfigureerde goedkeurders beschikbaar voor `/approve`, zelfs wanneer native levering is uitgeschakeld; gebruik in plaats daarvan de native initiërende-surface-status voor leverings-/setupbegeleiding.
- Als je kanaal native exec-goedkeuringen aanbiedt, gebruik dan `approvalCapability.getExecInitiatingSurfaceState` voor de initiërende-surface/native-client-status wanneer die verschilt van goedkeuringsauth in dezelfde chat. Core gebruikt die exec-specifieke hook om `enabled` van `disabled` te onderscheiden, te bepalen of het initiërende kanaal native exec-goedkeuringen ondersteunt en het kanaal op te nemen in fallbackbegeleiding voor native clients. `createApproverRestrictedNativeApprovalCapability(...)` vult dit in voor het gangbare geval.
- Gebruik `outbound.shouldSuppressLocalPayloadPrompt` of `outbound.beforeDeliverPayload` voor kanaalspecifiek payload-lifecycle-gedrag, zoals het verbergen van dubbele lokale goedkeuringsprompts of het verzenden van typindicatoren vóór levering.
- Gebruik `approvalCapability.delivery` alleen voor native goedkeuringsrouting of fallbackonderdrukking.
- Gebruik `approvalCapability.nativeRuntime` voor native goedkeuringsfeiten die eigendom zijn van het kanaal. Houd dit lazy op hot kanaal-entrypoints met `createLazyChannelApprovalNativeRuntimeAdapter(...)`, dat je runtime-module op aanvraag kan importeren terwijl core nog steeds de goedkeuringslifecycle kan samenstellen.
- Gebruik `approvalCapability.render` alleen wanneer een kanaal echt aangepaste goedkeuringspayloads nodig heeft in plaats van de gedeelde renderer.
- Gebruik `approvalCapability.describeExecApprovalSetup` wanneer het kanaal wil dat het antwoord op het uitgeschakelde pad uitlegt welke exacte config-knoppen nodig zijn om native exec-goedkeuringen in te schakelen. De hook ontvangt `{ channel, channelLabel, accountId }`; kanalen met benoemde accounts moeten account-scoped paden renderen, zoals `channels.<channel>.accounts.<id>.execApprovals.*`, in plaats van top-level defaults.
- Gebruik `approvalCapability.describePluginApprovalSetup` wanneer begeleiding bij falende Plugin-goedkeuring veilig kan worden getoond voor no-route- en timeoutfouten bij Plugin-goedkeuring. `createApproverRestrictedNativeApprovalCapability(...)` leidt dit niet af uit `describeExecApprovalSetup`; geef dezelfde helper alleen expliciet door wanneer Plugin- en exec-goedkeuringen echt dezelfde native setup gebruiken.
- Als een kanaal stabiele, eigenaarachtige DM-identiteiten kan afleiden uit bestaande config, gebruik dan `createResolvedApproverActionAuthAdapter` uit `openclaw/plugin-sdk/approval-runtime` om `/approve` in dezelfde chat te beperken zonder goedkeuringsspecifieke core-logica toe te voegen.
- Als aangepaste goedkeuringsauth bewust alleen fallback in dezelfde chat toestaat, retourneer dan `markImplicitSameChatApprovalAuthorization({ authorized: true })` uit `openclaw/plugin-sdk/approval-auth-runtime`; anders behandelt core het resultaat als expliciete goedkeurderautorisatie.
- Als een kanaaleigen native callback goedkeuringen direct oplost, gebruik dan `isImplicitSameChatApprovalAuthorization(...)` vóór het oplossen, zodat impliciete fallback nog steeds via de normale actorautorisatie van het kanaal loopt.
- Als een kanaal native goedkeuringslevering nodig heeft, houd kanaalcode dan gericht op targetnormalisatie plus transport-/presentatiefeiten. Gebruik `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` en `createApproverRestrictedNativeApprovalCapability` uit `openclaw/plugin-sdk/approval-runtime`. Zet de kanaalspecifieke feiten achter `approvalCapability.nativeRuntime`, idealiter via `createChannelApprovalNativeRuntimeAdapter(...)` of `createLazyChannelApprovalNativeRuntimeAdapter(...)`, zodat core de handler kan samenstellen en requestfiltering, routing, dedupe, verval, Gateway-abonnement en routed-elsewhere-meldingen kan beheren. `nativeRuntime` is opgesplitst in een paar kleinere seams:
- Gebruik `createNativeApprovalChannelRouteGates` uit `openclaw/plugin-sdk/approval-native-runtime` wanneer een kanaal zowel native levering vanaf de sessie-oorsprong als expliciete forwardingtargets voor goedkeuringen ondersteunt. De helper centraliseert selectie van goedkeuringsconfig, `mode`-afhandeling, agent-/sessiefilters, accountbinding, sessietargetmatching en targetlistmatching, terwijl callers nog steeds eigenaar zijn van het kanaal-id, de standaard forwardingmodus, accountlookup, transport-enabled-check, targetnormalisatie en resolutie van turn-source-targets. Gebruik dit niet om core-owned kanaalbeleidsdefaults te maken; geef de gedocumenteerde standaardmodus van het kanaal expliciet door.
- `createChannelNativeOriginTargetResolver` gebruikt standaard de gedeelde channel-route-matcher voor `{ to, accountId, threadId }`-targets. Geef `targetsMatch` alleen door wanneer een kanaal provider-specifieke equivalentieregels heeft, zoals Slack-timestamp-prefixmatching.
- Geef `normalizeTargetForMatch` door aan `createChannelNativeOriginTargetResolver` wanneer het kanaal provider-id's moet canoniseren voordat de standaard route-matcher of een aangepaste `targetsMatch`-callback draait, terwijl het oorspronkelijke target voor levering behouden blijft. Gebruik `normalizeTarget` alleen wanneer het opgeloste leveringstarget zelf gecanoniseerd moet worden.
- `availability` - of het account is geconfigureerd en of een request moet worden afgehandeld
- `presentation` - map het gedeelde approval-viewmodel naar pending/resolved/expired native payloads of definitieve acties
- `transport` - bereid targets voor en verzend/update/verwijder native goedkeuringsberichten
- `interactions` - optionele bind-/unbind-/clear-action-hooks voor native knoppen of reacties, plus een optionele `cancelDelivered`-hook. Implementeer `cancelDelivered` wanneer `deliverPending` in-process of persistente state registreert (zoals een reaction-target-store), zodat die state kan worden vrijgegeven als een handlerstop de levering annuleert voordat `bindPending` draait of wanneer `bindPending` geen handle retourneert
- `observe` - optionele hooks voor leveringsdiagnostiek
- Als het kanaal runtime-owned objecten nodig heeft, zoals een client, token, Bolt-app of webhook-ontvanger, registreer die dan via `openclaw/plugin-sdk/channel-runtime-context`. Het generieke runtime-contextregister laat core capability-driven handlers bootstrappen vanuit kanaal-startup-state zonder goedkeuringsspecifieke wrapper-glue toe te voegen.
- Grijp alleen naar de lower-level `createChannelApprovalHandler` of `createChannelNativeApprovalRuntime` wanneer de capability-driven seam nog niet expressief genoeg is.
- Native goedkeuringskanalen moeten zowel `accountId` als `approvalKind` via die helpers routeren. `accountId` houdt multi-account-goedkeuringsbeleid scoped naar het juiste botaccount, en `approvalKind` houdt exec- versus Plugin-goedkeuringsgedrag beschikbaar voor het kanaal zonder hardcoded branches in core.
- Core is nu ook eigenaar van goedkeurings-reroute-meldingen. Kanaalplugins moeten geen eigen follow-upberichten "goedkeuring ging naar DM's / een ander kanaal" verzenden vanuit `createChannelNativeApprovalRuntime`; expose in plaats daarvan accurate origin- en approver-DM-routing via de gedeelde approval-capability-helpers en laat core daadwerkelijke leveringen aggregeren voordat er een melding terug naar de initiërende chat wordt geplaatst.
- Behoud de geleverde goedkeurings-id-soort end-to-end. Native clients mogen
  exec- versus Plugin-goedkeuringsrouting niet raden of herschrijven vanuit kanaallokale state.
- Verschillende goedkeuringssoorten kunnen bewust verschillende native surfaces aanbieden.
  Huidige gebundelde voorbeelden:
  - Slack houdt native goedkeuringsrouting beschikbaar voor zowel exec- als Plugin-id's.
  - Matrix behoudt dezelfde native DM-/kanaalrouting en reaction-UX voor exec-
    en Plugin-goedkeuringen, terwijl auth nog steeds per goedkeuringssoort kan verschillen.
- `createApproverRestrictedNativeApprovalAdapter` bestaat nog steeds als compatibiliteitswrapper, maar nieuwe code moet de capability-builder verkiezen en `approvalCapability` op de plugin exposen.

Voor hot kanaal-entrypoints geef je de voorkeur aan de smallere runtime-subpaden wanneer je slechts
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

Geef op dezelfde manier de voorkeur aan `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` en
`openclaw/plugin-sdk/reply-chunking` wanneer je de bredere umbrella-
surface niet nodig hebt.

Specifiek voor setup:

- `openclaw/plugin-sdk/setup-runtime` dekt de runtime-safe setuphelpers:
  `createSetupTranslator`, import-safe setup-patchadapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note-output,
  `promptResolvedAllowFrom`, `splitSetupEntries` en de gedelegeerde
  setup-proxy-builders
- `openclaw/plugin-sdk/setup-runtime` bevat de env-aware adapter-seam voor
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` dekt de optional-install setup-
  builders plus een paar setup-safe primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Als je kanaal env-driven setup of auth ondersteunt en generieke startup-/config-
flows die env-namen moeten kennen voordat runtime laadt, declareer ze dan in het
pluginmanifest met `channelEnvVars`. Houd kanaalruntime `envVars` of lokale
constanten alleen voor operatorgerichte tekst.

Als je kanaal kan verschijnen in `status`, `channels list`, `channels status` of
SecretRef-scans voordat de pluginruntime start, voeg dan `openclaw.setupEntry` toe in
`package.json`. Dat entrypoint moet veilig te importeren zijn in read-only command-
paden en moet de kanaalmetadata, setup-safe config-adapter, status-
adapter en kanaalsecret-targetmetadata retourneren die nodig zijn voor die samenvattingen. Start geen
clients, listeners of transportruntimes vanuit de setup-entry.

Houd ook het importpad van de hoofd-kanaal-entry smal. Discovery kan de
entry en de kanaalpluginmodule evalueren om capabilities te registreren zonder het
kanaal te activeren. Bestanden zoals `channel-plugin-api.ts` moeten het kanaal-
pluginobject exporteren zonder setupwizards, transportclients, socket-
listeners, subprocess-launchers of service-startupmodules te importeren. Zet die runtime-
onderdelen in modules die worden geladen vanuit `registerFull(...)`, runtime-setters of lazy
capability-adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` en
`splitSetupEntries`

- gebruik de bredere `openclaw/plugin-sdk/setup`-seam alleen wanneer je ook de
  zwaardere gedeelde setup-/confighelpers nodig hebt, zoals
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Als je kanaal alleen "installeer eerst deze plugin" wil adverteren in setup-
surfaces, geef dan de voorkeur aan `createOptionalChannelSetupSurface(...)`. De gegenereerde
adapter/wizard falen gesloten bij config-writes en finalization, en ze hergebruiken
hetzelfde install-required-bericht voor validatie, finalize en docs-link-
tekst.

Voor andere hot kanaalpaden geef je de voorkeur aan de smalle helpers boven bredere legacy-
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` en
  `openclaw/plugin-sdk/account-helpers` voor configuratie met meerdere accounts en
  fallback voor standaardaccounts
- `openclaw/plugin-sdk/inbound-envelope` en
  `openclaw/plugin-sdk/channel-inbound` voor inkomende route/envelope en
  record-and-dispatch-bedrading
- `openclaw/plugin-sdk/channel-targets` voor helpers voor doelparsing
- `openclaw/plugin-sdk/outbound-media` voor het laden van media en
  `openclaw/plugin-sdk/channel-outbound` voor uitgaande identiteit/send-delegates
  en payloadplanning
- `buildThreadAwareOutboundSessionRoute(...)` uit
  `openclaw/plugin-sdk/channel-core` wanneer een uitgaande route een expliciete
  `replyToId`/`threadId` moet behouden of de huidige `:thread:`-sessie moet
  herstellen nadat de basissessiesleutel nog steeds overeenkomt. Provider-Plugins kunnen
  prioriteit, suffixgedrag en normalisatie van thread-id's overschrijven wanneer hun platform
  native semantiek voor threadaflevering heeft.
- `openclaw/plugin-sdk/thread-bindings-runtime` voor de levenscyclus van threadbindings
  en adapterregistratie
- `openclaw/plugin-sdk/agent-media-payload` alleen wanneer een legacy agent/media
  payload-veldindeling nog steeds vereist is
- `openclaw/plugin-sdk/telegram-command-config` voor Telegram-normalisatie van aangepaste opdrachten,
  validatie van duplicaten/conflicten en een fallback-stabiel contract voor opdrachtconfiguratie

Kanalen alleen voor auth kunnen meestal bij het standaardpad blijven: core handelt goedkeuringen af en de Plugin stelt alleen uitgaande/auth-mogelijkheden beschikbaar. Native goedkeuringskanalen zoals Matrix, Slack, Telegram en aangepaste chattransports moeten de gedeelde native helpers gebruiken in plaats van hun eigen goedkeuringslevenscyclus te bouwen.

## Beleid voor inkomende vermeldingen

Houd verwerking van inkomende vermeldingen gesplitst in twee lagen:

- door de Plugin beheerde bewijsverzameling
- gedeelde beleidsevaluatie

Gebruik `openclaw/plugin-sdk/channel-mention-gating` voor beslissingen over vermeldingsbeleid.
Gebruik `openclaw/plugin-sdk/channel-inbound` alleen wanneer je de bredere inkomende
helperbarrel nodig hebt.

Goed geschikt voor Plugin-lokale logica:

- detectie van antwoord-aan-bot
- detectie van geciteerde bot
- controles op threaddeelname
- uitsluitingen voor service-/systeemberichten
- platform-native caches die nodig zijn om botdeelname te bewijzen

Goed geschikt voor de gedeelde helper:

- `requireMention`
- expliciet vermeldingsresultaat
- allowlist voor impliciete vermeldingen
- opdrachtbypass
- definitieve overslabeslissing

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
gebundelde kanaal-Plugins die al afhankelijk zijn van runtime-injectie:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Als je alleen `implicitMentionKindWhen` en
`resolveInboundMentionDecision` nodig hebt, importeer dan uit
`openclaw/plugin-sdk/channel-mention-gating` om te voorkomen dat ongerelateerde inkomende
runtimehelpers worden geladen.

Gebruik `resolveInboundMentionDecision({ facts, policy })` voor vermeldingsgating.

## Doorloop

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Maak de standaard Plugin-bestanden. Het veld `channel` in `package.json` is
    wat dit een kanaal-Plugin maakt. Zie [Plugin Setup and Config](/nl/plugins/sdk-setup#openclaw-channel)
    voor het volledige pakketmetadatasurface:

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
    Plugin-beheerde instellingen die niet de kanaalaccountconfiguratie zijn. `channelConfigs`
    valideert `channels.acme-chat` en is de cold-path-bron die door configuratieschema,
    setup en UI-surfaces wordt gebruikt voordat de Plugin-runtime laadt.

  </Step>

  <Step title="Build the channel plugin object">
    De interface `ChannelPlugin` heeft veel optionele adaptersurfaces. Begin met
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

    Gebruik voor kanalen die zowel canonieke DM-sleutels op topniveau als legacy geneste sleutels accepteren de helpers uit `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` en `normalizeChannelDmPolicy` houden accountlokale waarden vóór overgenomen rootwaarden. Combineer dezelfde resolver met doctor-reparatie via `normalizeLegacyDmAliases`, zodat runtime en migratie hetzelfde contract lezen.

    <Accordion title="What createChatChannelPlugin does for you">
      In plaats van low-level adapterinterfaces handmatig te implementeren, geef je
      declaratieve opties door en stelt de builder ze samen:

      | Optie | Wat het bedraadt |
      | --- | --- |
      | `security.dm` | Gescopeerde DM-beveiligingsresolver uit configuratievelden |
      | `pairing.text` | Op tekst gebaseerde DM-koppelflow met code-uitwisseling |
      | `threading` | Resolver voor antwoord-aan-modus (vast, account-gescopeerd of aangepast) |
      | `outbound.attachedResults` | Verzendfuncties die resultaatmetadata retourneren (bericht-ID's) |

      Je kunt ook ruwe adapterobjecten doorgeven in plaats van de declaratieve opties
      als je volledige controle nodig hebt.

      Ruwe uitgaande adapters kunnen een functie `chunker(text, limit, ctx)` definiëren.
      De optionele `ctx.formatting` bevat beslissingen over opmaak tijdens aflevering
      zoals `maxLinesPerMessage`; pas dit toe vóór het verzenden, zodat antwoordthreading
      en chunkgrenzen eenmaal door gedeelde uitgaande aflevering worden opgelost.
      Verzendcontexten bevatten ook `replyToIdSource` (`implicit` of `explicit`)
      wanneer een native antwoorddoel is opgelost, zodat payloadhelpers expliciete
      antwoordtags kunnen behouden zonder een impliciet eenmalig antwoordslot te verbruiken.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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

    Plaats kanaal-beheerde CLI-descriptors in `registerCliMetadata(...)` zodat OpenClaw
    ze in de hoofdhelp kan tonen zonder de volledige kanaal-runtime te activeren,
    terwijl normale volledige loads nog steeds dezelfde descriptors oppikken voor echte
    commandoregistratie. Gebruik `registerFull(...)` voor werk dat alleen voor de runtime is.
    Als `registerFull(...)` gateway-RPC-methoden registreert, gebruik dan een
    plugin-specifiek voorvoegsel. Core-beheerdersnaamruimten (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd
    opgelost naar `operator.admin`.
    `defineChannelPluginEntry` handelt de splitsing in registratiemodus automatisch af. Zie
    [Entry Points](/nl/plugins/sdk-entrypoints#definechannelpluginentry) voor alle
    opties.

  </Step>

  <Step title="Een setup-entry toevoegen">
    Maak `setup-entry.ts` voor lichtgewicht laden tijdens onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw laadt dit in plaats van de volledige entry wanneer het kanaal is uitgeschakeld
    of niet is geconfigureerd. Dit voorkomt dat zware runtime-code tijdens setup-flows wordt geladen.
    Zie [Setup en Config](/nl/plugins/sdk-setup#setup-entry) voor details.

    Gebundelde workspace-kanalen die setup-veilige exports opsplitsen in sidecar-
    modules kunnen `defineBundledChannelSetupEntry(...)` gebruiken vanuit
    `openclaw/plugin-sdk/channel-entry-contract` wanneer ze ook een
    expliciete runtime-setter tijdens setup nodig hebben.

  </Step>

  <Step title="Inkomende berichten verwerken">
    Je Plugin moet berichten van het platform ontvangen en doorsturen naar
    OpenClaw. Het gebruikelijke patroon is een Webhook die de aanvraag verifieert en
    deze via de inkomende handler van je kanaal dispatcht:

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
      Verwerking van inkomende berichten is kanaalspecifiek. Elke kanaal-Plugin beheert
      zijn eigen inkomende pipeline. Bekijk gebundelde kanaal-Plugins
      (bijvoorbeeld het Plugin-pakket voor Microsoft Teams of Google Chat) voor echte patronen.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
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

    Voor gedeelde testhelpers, zie [Testen](/nl/plugins/sdk-testing).

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
  <Card title="Threading-opties" icon="git-branch" href="/nl/plugins/sdk-entrypoints#registration-mode">
    Vaste, account-scoped of aangepaste antwoordmodi
  </Card>
  <Card title="Integratie met berichtentool" icon="puzzle" href="/nl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool en actiedetectie
  </Card>
  <Card title="Doelresolutie" icon="crosshair" href="/nl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime-helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, STT, media, subagent via api.runtime
  </Card>
  <Card title="API voor inkomende kanalen" icon="bolt" href="/nl/plugins/sdk-channel-inbound">
    Gedeelde levenscyclus voor inkomende gebeurtenissen: opnemen, oplossen, vastleggen, dispatchen, finaliseren
  </Card>
</CardGroup>

<Note>
Sommige gebundelde helper-seams bestaan nog steeds voor onderhoud en
compatibiliteit van gebundelde Plugins. Ze zijn niet het aanbevolen patroon voor nieuwe kanaal-Plugins;
geef de voorkeur aan de generieke subpaden voor kanaal/setup/antwoord/runtime uit het gemeenschappelijke SDK-
oppervlak, tenzij je die gebundelde Plugin-familie rechtstreeks onderhoudt.
</Note>

## Volgende stappen

- [Provider-Plugins](/nl/plugins/sdk-provider-plugins) - als je Plugin ook modellen levert
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige importreferentie voor subpaden
- [SDK-testen](/nl/plugins/sdk-testing) - testhulpprogramma's en contracttests
- [Plugin-manifest](/nl/plugins/manifest) - volledig manifestschema

## Gerelateerd

- [Plugin SDK-setup](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Agent-harness-Plugins](/nl/plugins/sdk-agent-harness)
