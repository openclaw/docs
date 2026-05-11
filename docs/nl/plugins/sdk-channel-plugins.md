---
read_when:
    - Je bouwt een nieuwe Plugin voor een berichtenkanaal
    - Je wilt OpenClaw verbinden met een berichtenplatform
    - Je moet het adapteroppervlak van ChannelPlugin begrijpen
sidebarTitle: Channel Plugins
summary: Stapsgewijze handleiding voor het bouwen van een berichtenkanaal-Plugin voor OpenClaw
title: Kanaalplugins bouwen
x-i18n:
    generated_at: "2026-05-11T20:42:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Deze gids laat zien hoe je een kanaal-Plugin bouwt die OpenClaw verbindt met een
berichtenplatform. Aan het einde heb je een werkend kanaal met DM-beveiliging,
koppeling, antwoordthreading en uitgaande berichten.

<Info>
  Als je nog niet eerder een OpenClaw-Plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basispakketstructuur
  en manifestconfiguratie.
</Info>

## Hoe kanaal-Plugins werken

Kanaal-Plugins hebben geen eigen tools voor verzenden/bewerken/reageren nodig. OpenClaw houdt één
gedeelde `message`-tool in core. Je Plugin is eigenaar van:

- **Configuratie** - accountresolutie en installatiewizard
- **Beveiliging** - DM-beleid en toelatingslijsten
- **Koppeling** - DM-goedkeuringsflow
- **Sessiesyntaxis** - hoe provider-specifieke gespreks-id's worden gekoppeld aan basischats, thread-id's en bovenliggende fallbacks
- **Uitgaand** - tekst, media en polls naar het platform verzenden
- **Threading** - hoe antwoorden worden gethread
- **Heartbeat-typen** - optionele typ-/bezig-signalen voor Heartbeat-bezorgdoelen

Core is eigenaar van de gedeelde message-tool, promptbedrading, de buitenste sessiesleutelvorm,
generieke `:thread:`-boekhouding en dispatch.

Nieuwe kanaal-Plugins moeten ook een `message`-adapter beschikbaar maken met
`defineChannelMessageAdapter` uit `openclaw/plugin-sdk/channel-message`. De
adapter verklaart welke duurzame final-send-capabilities het native transport
daadwerkelijk ondersteunt en laat tekst-/mediaverzendingen wijzen naar dezelfde transportfuncties als
de legacy `outbound`-adapter. Declareer een capability alleen wanneer een contracttest
het native neveneffect en het geretourneerde ontvangstbewijs bewijst.
Zie voor het volledige API-contract, voorbeelden, capability-matrix, ontvangstbewijsregels, live
preview-finalisatie, receive-ack-beleid, tests en migratietabel
[Channel message API](/nl/plugins/sdk-channel-message).
Als de bestaande `outbound`-adapter al de juiste verzendmethoden en
capability-metadata heeft, gebruik dan `createChannelMessageAdapterFromOutbound(...)` om
de `message`-adapter af te leiden in plaats van handmatig nog een bridge te schrijven.
Adapterverzendingen moeten `MessageReceipt`-waarden retourneren. Wanneer compatibiliteitscode
nog legacy-id's nodig heeft, leid die dan af met `listMessageReceiptPlatformIds(...)`
of `resolveMessageReceiptPrimaryId(...)` in plaats van parallelle
`messageIds`-velden in nieuwe lifecycle-code bij te houden.
Kanalen die previews ondersteunen, moeten ook `message.live.capabilities` declareren met
de exacte live-lifecycle waarvan zij eigenaar zijn, zoals `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` of
`quietFinalization`. Kanalen die een conceptpreview op dezelfde plek finaliseren, moeten
ook `message.live.finalizer.capabilities` declareren, zoals `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` en
`retainOnAmbiguousFailure`, en de runtimelogica routeren via
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)`. Houd die capabilities ondersteund
door `verifyChannelMessageLiveCapabilityAdapterProofs(...)`- en
`verifyChannelMessageLiveFinalizerProofs(...)`-tests, zodat native preview-,
voortgangs-, bewerkings-, fallback-/retentie-, opschonings- en ontvangstbewijsgedrag niet stil
kan afwijken.
Inkomende receivers die platformbevestigingen uitstellen, moeten
`message.receive.defaultAckPolicy` en `supportedAckPolicies` declareren in plaats van
ack-timing te verbergen in monitor-lokale state. Dek elk gedeclareerd beleid af met
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Legacy helpers voor antwoorden/turns, zoals `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` en `recordInboundSessionAndDispatchReply`,
blijven beschikbaar voor compatibiliteitsdispatchers. Gebruik die namen niet voor nieuwe
kanaalcode; nieuwe Plugins moeten beginnen met de `message`-adapter, ontvangstbewijzen en
receive/send-lifecyclehelpers op `openclaw/plugin-sdk/channel-message`.

Kanalen die inkomende autorisatie migreren, kunnen het experimentele
`openclaw/plugin-sdk/channel-ingress-runtime`-subpad gebruiken vanuit runtime-receivepaden.
Het subpad houdt platformlookup en neveneffecten in de Plugin, terwijl
allowlist-state-resolutie, route-/sender-/command-/event-/activation-
beslissingen, geredigeerde diagnostiek en turn-admission-mapping worden gedeeld. Houd
Plugin-identiteitsnormalisatie in de descriptor die je aan de resolver doorgeeft; serialiseer geen
ruwe matchwaarden uit de opgeloste state of beslissing. Zie
[Channel ingress API](/nl/plugins/sdk-channel-ingress) voor het API-ontwerp,
de eigendomsgrens en testverwachtingen.

Als je kanaal typindicatoren buiten inkomende antwoorden ondersteunt, stel dan
`heartbeat.sendTyping(...)` beschikbaar op de kanaal-Plugin. Core roept dit aan met het
opgeloste Heartbeat-bezorgdoel voordat de Heartbeat-modelrun start en
gebruikt de gedeelde typing-keepalive-/cleanup-lifecycle. Voeg `heartbeat.clearTyping(...)`
toe wanneer het platform een expliciet stopsignaal nodig heeft.

Als je kanaal message-tool-parameters toevoegt die mediabronnen dragen, stel die
parameternamen dan beschikbaar via `describeMessageTool(...).mediaSourceParams`. Core gebruikt
die expliciete lijst voor sandboxpadnormalisatie en outbound media-access-
beleid, zodat Plugins geen gedeelde-core special cases nodig hebben voor provider-specifieke
avatar-, attachment- of cover-image-parameters.
Geef bij voorkeur een action-keyed map terug zoals
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, zodat niet-gerelateerde acties niet
de media-argumenten van een andere actie erven. Een platte array werkt nog steeds voor parameters die
bewust worden gedeeld door elke beschikbare actie.

Als je kanaal provider-specifieke vormgeving nodig heeft voor `message(action="send")`,
gebruik dan bij voorkeur `actions.prepareSendPayload(...)`. Zet native kaarten, blocks, embeds of
andere duurzame data onder `payload.channelData.<channel>` en laat core de daadwerkelijke
verzending uitvoeren via de outbound/message-adapter. Gebruik
`actions.handleAction(...)` voor verzending alleen als compatibiliteitsfallback voor
payloads die niet kunnen worden geserialiseerd en opnieuw geprobeerd.

Als je platform extra scope opslaat in gespreks-id's, houd die parsing dan
in de Plugin met `messaging.resolveSessionConversation(...)`. Dat is de
canonieke hook voor het mappen van `rawId` naar het basisgespreks-id, optioneel thread-
id, expliciete `baseConversationId` en eventuele `parentConversationCandidates`.
Wanneer je `parentConversationCandidates` retourneert, houd ze dan geordend van de
smalste parent naar het breedste/basisgesprek.

Gebruik `openclaw/plugin-sdk/channel-route` wanneer Plugin-code route-achtige velden moet normaliseren,
een child-thread moet vergelijken met de parent-route, of een
stabiele dedupe-sleutel moet bouwen uit `{ channel, to, accountId, threadId }`. De helper
normaliseert numerieke thread-id's op dezelfde manier als core, dus Plugins moeten
dit verkiezen boven ad-hoc `String(threadId)`-vergelijkingen.
Plugins met provider-specifieke doelsyntaxis kunnen hun parser injecteren in
`resolveChannelRouteTargetWithParser(...)` en toch dezelfde route target-
vorm en thread-fallbacksemantiek krijgen die core gebruikt.

Gebundelde Plugins die dezelfde parsing nodig hebben voordat de kanaalregistry opstart,
kunnen ook een top-level `session-key-api.ts`-bestand beschikbaar maken met een overeenkomende
`resolveSessionConversation(...)`-export. Core gebruikt dat bootstrap-veilige oppervlak
alleen wanneer de runtime-Pluginregistry nog niet beschikbaar is.

`messaging.resolveParentConversationCandidates(...)` blijft beschikbaar als een
legacy compatibiliteitsfallback wanneer een Plugin alleen parent-fallbacks nodig heeft bovenop
het generieke/ruwe id. Als beide hooks bestaan, gebruikt core eerst
`resolveSessionConversation(...).parentConversationCandidates` en valt alleen terug op
`resolveParentConversationCandidates(...)` wanneer de canonieke hook
ze weglaat.

## Goedkeuringen en kanaal-capabilities

De meeste kanaal-Plugins hebben geen goedkeuringsspecifieke code nodig.

- Core is eigenaar van same-chat `/approve`, gedeelde approval-knoppayloads en generieke fallback-bezorging.
- Geef de voorkeur aan één `approvalCapability`-object op de channel-plugin wanneer het kanaal approval-specifiek gedrag nodig heeft.
- `ChannelPlugin.approvals` is verwijderd. Zet approval-bezorging/native/render/auth-feiten op `approvalCapability`.
- `plugin.auth` is alleen login/logout; core leest niet langer approval-auth-hooks uit dat object.
- `approvalCapability.authorizeActorAction` en `approvalCapability.getActionAvailabilityState` zijn de canonieke approval-auth-naad.
- Gebruik `approvalCapability.getActionAvailabilityState` voor beschikbaarheid van same-chat approval-auth.
- Als je kanaal native exec-approvals blootstelt, gebruik dan `approvalCapability.getExecInitiatingSurfaceState` voor de initiating-surface/native-client-status wanneer die verschilt van same-chat approval-auth. Core gebruikt die exec-specifieke hook om `enabled` van `disabled` te onderscheiden, te bepalen of het initiërende kanaal native exec-approvals ondersteunt, en het kanaal op te nemen in fallback-instructies voor native clients. `createApproverRestrictedNativeApprovalCapability(...)` vult dit in voor het gangbare geval.
- Gebruik `outbound.shouldSuppressLocalPayloadPrompt` of `outbound.beforeDeliverPayload` voor kanaalspecifiek payload-lifecycle-gedrag, zoals het verbergen van dubbele lokale approval-prompts of het verzenden van typindicatoren vóór bezorging.
- Gebruik `approvalCapability.delivery` alleen voor native approval-routing of fallback-onderdrukking.
- Gebruik `approvalCapability.nativeRuntime` voor native approval-feiten die eigendom zijn van het kanaal. Houd dit lazy op hete kanaal-entrypoints met `createLazyChannelApprovalNativeRuntimeAdapter(...)`, dat je runtime-module op aanvraag kan importeren terwijl core nog steeds de approval-lifecycle kan samenstellen.
- Gebruik `approvalCapability.render` alleen wanneer een kanaal echt aangepaste approval-payloads nodig heeft in plaats van de gedeelde renderer.
- Gebruik `approvalCapability.describeExecApprovalSetup` wanneer het kanaal wil dat het disabled-path-antwoord uitlegt welke exacte configuratieknoppen nodig zijn om native exec-approvals in te schakelen. De hook ontvangt `{ channel, channelLabel, accountId }`; named-account-kanalen moeten account-gescopete paden renderen, zoals `channels.<channel>.accounts.<id>.execApprovals.*`, in plaats van defaults op topniveau.
- Als een kanaal stabiele owner-achtige DM-identiteiten uit bestaande config kan afleiden, gebruik dan `createResolvedApproverActionAuthAdapter` uit `openclaw/plugin-sdk/approval-runtime` om same-chat `/approve` te beperken zonder approval-specifieke core-logica toe te voegen.
- Als een kanaal native approval-bezorging nodig heeft, houd de kanaalcode dan gericht op target-normalisatie plus transport-/presentatiefeiten. Gebruik `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` en `createApproverRestrictedNativeApprovalCapability` uit `openclaw/plugin-sdk/approval-runtime`. Zet de kanaalspecifieke feiten achter `approvalCapability.nativeRuntime`, idealiter via `createChannelApprovalNativeRuntimeAdapter(...)` of `createLazyChannelApprovalNativeRuntimeAdapter(...)`, zodat core de handler kan samenstellen en request-filtering, routing, dedupe, expiry, Gateway-subscription en routed-elsewhere-meldingen kan beheren. `nativeRuntime` is opgesplitst in een paar kleinere naden:
- `createChannelNativeOriginTargetResolver` gebruikt standaard de gedeelde channel-route-matcher voor `{ to, accountId, threadId }`-targets. Geef `targetsMatch` alleen mee wanneer een kanaal providerspecifieke equivalentieregels heeft, zoals Slack-timestamp-prefixmatching.
- Geef `normalizeTargetForMatch` door aan `createChannelNativeOriginTargetResolver` wanneer het kanaal provider-id's moet canonicaliseren voordat de standaard route-matcher of een aangepaste `targetsMatch`-callback draait, terwijl het originele target voor bezorging behouden blijft. Gebruik `normalizeTarget` alleen wanneer het opgeloste bezorgtarget zelf moet worden gecanonicaliseerd.
- `availability` - of het account is geconfigureerd en of een request moet worden afgehandeld
- `presentation` - map het gedeelde approval-viewmodel naar pending/resolved/expired native payloads of finale acties
- `transport` - bereid targets voor en verzend/update/verwijder native approval-berichten
- `interactions` - optionele bind/unbind/clear-action-hooks voor native knoppen of reacties
- `observe` - optionele hooks voor bezorgdiagnostiek
- Als het kanaal runtime-owned objecten nodig heeft, zoals een client, token, Bolt-app of webhook receiver, registreer ze dan via `openclaw/plugin-sdk/channel-runtime-context`. De generieke runtime-context-registry laat core capability-gedreven handlers bootstrappen vanuit de kanaal-startupstatus zonder approval-specifieke wrapperlijm toe te voegen.
- Grijp alleen naar de lagere-level `createChannelApprovalHandler` of `createChannelNativeApprovalRuntime` wanneer de capability-gedreven naad nog niet expressief genoeg is.
- Native approval-kanalen moeten zowel `accountId` als `approvalKind` via die helpers routeren. `accountId` houdt multi-account-approvalbeleid gescopet op het juiste botaccount, en `approvalKind` houdt exec- versus plugin-approvalgedrag beschikbaar voor het kanaal zonder hardcoded branches in core.
- Core is nu ook eigenaar van approval-reroute-meldingen. Channel-plugins moeten niet hun eigen vervolgberichten "approval went to DMs / another channel" verzenden vanuit `createChannelNativeApprovalRuntime`; stel in plaats daarvan accurate origin- en approver-DM-routing beschikbaar via de gedeelde approval-capability-helpers en laat core daadwerkelijke bezorgingen aggregeren voordat er een melding terug naar de initiërende chat wordt geplaatst.
- Behoud het soort van de bezorgde approval-id end-to-end. Native clients mogen exec- versus plugin-approval-routing niet
  raden of herschrijven vanuit kanaallokale status.
- Verschillende approval-soorten kunnen bewust verschillende native surfaces blootstellen.
  Huidige gebundelde voorbeelden:
  - Slack houdt native approval-routing beschikbaar voor zowel exec- als plugin-id's.
  - Matrix houdt dezelfde native DM-/kanaalrouting en reactie-UX voor exec-
    en plugin-approvals, terwijl auth nog steeds per approval-soort kan verschillen.
- `createApproverRestrictedNativeApprovalAdapter` bestaat nog steeds als compatibiliteitswrapper, maar nieuwe code moet de voorkeur geven aan de capability-builder en `approvalCapability` op de plugin blootstellen.

Voor hete kanaal-entrypoints geef je de voorkeur aan de smallere runtime-subpaden wanneer je slechts
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
`openclaw/plugin-sdk/reply-chunking` wanneer je de bredere overkoepelende
surface niet nodig hebt.

Specifiek voor setup:

- `openclaw/plugin-sdk/setup-runtime` dekt de runtime-veilige setup-helpers:
  import-veilige setup-patchadapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note-output,
  `promptResolvedAllowFrom`, `splitSetupEntries` en de gedelegeerde
  setup-proxy-builders
- `openclaw/plugin-sdk/setup-runtime` bevat de env-bewuste adapter-naad voor
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` dekt de optional-install setup-
  builders plus een paar setup-veilige primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Als je kanaal env-gedreven setup of auth ondersteunt en generieke startup-/config-
flows die env-namen moeten kennen voordat runtime laadt, declareer ze dan in het
pluginmanifest met `channelEnvVars`. Houd runtime-`envVars` van het kanaal of lokale
constanten alleen voor operatorgerichte tekst.

Als je kanaal in `status`, `channels list`, `channels status` of
SecretRef-scans kan verschijnen voordat de pluginruntime start, voeg dan `openclaw.setupEntry` toe in
`package.json`. Dat entrypoint moet veilig te importeren zijn in read-only command
paths en moet de kanaalmetadata, setup-veilige config-adapter, status-
adapter en kanaal-secret-target-metadata teruggeven die nodig zijn voor die samenvattingen. Start geen
clients, listeners of transportruntimes vanuit de setup-entry.

Houd ook het importpad van de hoofd-channel-entry smal. Discovery kan de
entry en de channel-plugin-module evalueren om capabilities te registreren zonder
het kanaal te activeren. Bestanden zoals `channel-plugin-api.ts` moeten het channel-
pluginobject exporteren zonder setup-wizards, transportclients, socket-
listeners, subprocess launchers of service-startupmodules te importeren. Zet die runtime-
onderdelen in modules die worden geladen vanuit `registerFull(...)`, runtime-setters of lazy
capability-adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` en
`splitSetupEntries`

- gebruik de bredere `openclaw/plugin-sdk/setup`-naad alleen wanneer je ook de
  zwaardere gedeelde setup-/config-helpers nodig hebt, zoals
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Als je kanaal alleen "installeer deze plugin eerst" wil tonen in setup-
surfaces, geef dan de voorkeur aan `createOptionalChannelSetupSurface(...)`. De gegenereerde
adapter/wizard falen gesloten bij config-writes en finalization, en ze hergebruiken
hetzelfde install-required-bericht in validatie, finalize en docs-link-
tekst.

Voor andere hete kanaalpaden geef je de voorkeur aan de smalle helpers boven bredere legacy-
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` en
  `openclaw/plugin-sdk/account-helpers` voor multi-account-config en
  default-account-fallback
- `openclaw/plugin-sdk/inbound-envelope` en
  `openclaw/plugin-sdk/inbound-reply-dispatch` voor inbound route/envelope en
  record-and-dispatch-bedrading
- `openclaw/plugin-sdk/messaging-targets` voor target parsing/matching
- `openclaw/plugin-sdk/outbound-media` en
  `openclaw/plugin-sdk/outbound-runtime` voor medialading plus outbound
  identity/send-delegates en payloadplanning
- `buildThreadAwareOutboundSessionRoute(...)` uit
  `openclaw/plugin-sdk/channel-core` wanneer een outbound route een expliciete
  `replyToId`/`threadId` moet behouden of de huidige `:thread:`-sessie moet herstellen
  nadat de basissessiesleutel nog steeds matcht. Provider-plugins kunnen
  precedence, suffixgedrag en thread-id-normalisatie overschrijven wanneer hun platform
  native thread-bezorgsemantiek heeft.
- `openclaw/plugin-sdk/thread-bindings-runtime` voor thread-binding-lifecycle
  en adapterregistratie
- `openclaw/plugin-sdk/agent-media-payload` alleen wanneer een legacy agent/media-
  payloadveldindeling nog vereist is
- `openclaw/plugin-sdk/telegram-command-config` voor Telegram custom-command-
  normalisatie, validatie van duplicaten/conflicten en een fallback-stabiel command-
  configcontract

Auth-only-kanalen kunnen meestal stoppen bij het standaardpad: core handelt approvals af en de plugin stelt alleen outbound/auth-capabilities bloot. Native approval-kanalen zoals Matrix, Slack, Telegram en aangepaste chattransports moeten de gedeelde native helpers gebruiken in plaats van hun eigen approval-lifecycle te bouwen.

## Inbound mention-beleid

Houd inbound mention-afhandeling opgesplitst in twee lagen:

- plugin-owned evidence gathering
- gedeelde beleidsevaluatie

Gebruik `openclaw/plugin-sdk/channel-mention-gating` voor mention-policy-beslissingen.
Gebruik `openclaw/plugin-sdk/channel-inbound` alleen wanneer je de bredere inbound
helper-barrel nodig hebt.

Goede plek voor plugin-lokale logica:

- reply-to-bot-detectie
- quoted-bot-detectie
- controles op thread-deelname
- uitsluitingen voor service-/systeemberichten
- platform-native caches die nodig zijn om botdeelname te bewijzen

Goede plek voor de gedeelde helper:

- `requireMention`
- expliciet vermeldingsresultaat
- impliciete vermeldings-allowlist
- commando-omzeiling
- uiteindelijke oversla-beslissing

Aanbevolen flow:

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
`resolveInboundMentionDecision` nodig hebt, importeer dan vanuit
`openclaw/plugin-sdk/channel-mention-gating` om te voorkomen dat niet-gerelateerde inkomende
runtimehelpers worden geladen.

De oudere `resolveMentionGating*`-helpers blijven alleen als compatibiliteitsexports beschikbaar op
`openclaw/plugin-sdk/channel-inbound`. Nieuwe code
moet `resolveInboundMentionDecision({ facts, policy })` gebruiken.

## Stapsgewijze uitleg

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakket en manifest">
    Maak de standaard Plugin-bestanden. Het veld `channel` in `package.json` is
    wat dit een kanaalplugin maakt. Zie [Plugin instellen en configureren](/nl/plugins/sdk-setup#openclaw-channel)
    voor het volledige oppervlak voor pakketmetadata:

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
    instellingen in eigendom van de Plugin die geen kanaalaccountconfiguratie zijn. `channelConfigs`
    valideert `channels.acme-chat` en is de cold-path-bron die door configuratieschema,
    setup en UI-oppervlakken wordt gebruikt voordat de Plugin-runtime wordt geladen.

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

    Voor kanalen die zowel canonieke DM-sleutels op topniveau als verouderde geneste sleutels accepteren, gebruik je de helpers uit `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` en `normalizeChannelDmPolicy` houden accountlokale waarden vóór overgeërfde rootwaarden. Koppel dezelfde resolver aan doctor-reparatie via `normalizeLegacyDmAliases`, zodat runtime en migratie hetzelfde contract lezen.

    <Accordion title="Wat createChatChannelPlugin voor je doet">
      In plaats van low-level adapterinterfaces handmatig te implementeren, geef je
      declaratieve opties door en stelt de builder ze samen:

      | Optie | Wat het koppelt |
      | --- | --- |
      | `security.dm` | Scoped DM-beveiligingsresolver vanuit configuratievelden |
      | `pairing.text` | Tekstgebaseerde DM-koppelingsflow met code-uitwisseling |
      | `threading` | Reply-to-modusresolver (vast, account-scoped of aangepast) |
      | `outbound.attachedResults` | Verzendfuncties die resultaatmetadata retourneren (bericht-ID's) |

      Je kunt ook ruwe adapterobjecten doorgeven in plaats van de declaratieve opties
      als je volledige controle nodig hebt.

      Ruwe uitgaande adapters kunnen een functie `chunker(text, limit, ctx)` definiëren.
      De optionele `ctx.formatting` bevat op bezorgtijd genomen opmaakbeslissingen,
      zoals `maxLinesPerMessage`; pas die toe vóór het verzenden, zodat reply-threading
      en chunkgrenzen één keer worden opgelost door gedeelde uitgaande bezorging.
      Verzendcontexten bevatten ook `replyToIdSource` (`implicit` of `explicit`)
      wanneer een native replydoel is opgelost, zodat payloadhelpers expliciete
      reply-tags kunnen behouden zonder een impliciete eenmalige reply-slot te verbruiken.
    </Accordion>

  </Step>

  <Step title="Koppel het entrypoint">
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

    Plaats CLI-descriptors die eigendom zijn van het kanaal in `registerCliMetadata(...)`, zodat OpenClaw
    ze in de root-help kan tonen zonder de volledige kanaalruntime te activeren,
    terwijl normale volledige loads nog steeds dezelfde descriptors meenemen voor echte
    commandoregistratie. Houd `registerFull(...)` voor werk dat alleen runtime betreft.
    Als `registerFull(...)` Gateway-RPC-methoden registreert, gebruik dan een
    Plugin-specifiek voorvoegsel. Core admin-namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd
    opgelost naar `operator.admin`.
    `defineChannelPluginEntry` handelt de splitsing van registratiemodi automatisch af. Zie
    [Entrypoints](/nl/plugins/sdk-entrypoints#definechannelpluginentry) voor alle
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
    of niet is geconfigureerd. Het voorkomt dat zware runtimecode wordt geladen tijdens setupflows.
    Zie [Setup en configuratie](/nl/plugins/sdk-setup#setup-entry) voor details.

    Gebundelde workspace-kanalen die setup-veilige exports opsplitsen naar sidecar
    modules kunnen `defineBundledChannelSetupEntry(...)` gebruiken vanuit
    `openclaw/plugin-sdk/channel-entry-contract` wanneer ze ook een
    expliciete runtime-setter voor setuptijd nodig hebben.

  </Step>

  <Step title="Verwerk inkomende berichten">
    Je Plugin moet berichten van het platform ontvangen en doorsturen naar
    OpenClaw. Het typische patroon is een Webhook die de aanvraag verifieert en
    deze dispatcht via de inkomende handler van je kanaal:

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
      Afhandeling van inkomende berichten is kanaalspecifiek. Elke channel plugin beheert
      zijn eigen inkomende pipeline. Bekijk gebundelde channel plugins
      (bijvoorbeeld het Microsoft Teams- of Google Chat-pluginpakket) voor echte patronen.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schrijf gecolokeerde tests in `src/channel.test.ts`:

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

    Zie [Testen](/nl/plugins/sdk-testing) voor gedeelde testhelpers.

</Step>
</Steps>

## Bestandsstructuur

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel-metadata
├── openclaw.plugin.json      # Manifest met configuratieschema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Publieke exports (optioneel)
├── runtime-api.ts            # Interne runtime-exports (optioneel)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform-API-client
    └── runtime.ts            # Runtime-store (indien nodig)
```

## Geavanceerde onderwerpen

<CardGroup cols={2}>
  <Card title="Threading-opties" icon="git-branch" href="/nl/plugins/sdk-entrypoints#registration-mode">
    Vaste, accountgebonden of aangepaste antwoordmodi
  </Card>
  <Card title="Integratie met berichttool" icon="puzzle" href="/nl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool en actiedetectie
  </Card>
  <Card title="Doelresolutie" icon="crosshair" href="/nl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, STT, media, subagent via api.runtime
  </Card>
  <Card title="Channel turn-kernel" icon="bolt" href="/nl/plugins/sdk-channel-turn">
    Gedeelde lifecycle voor inkomende turns: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Sommige gebundelde helperseams bestaan nog steeds voor onderhoud van gebundelde plugins en
compatibiliteit. Ze zijn niet het aanbevolen patroon voor nieuwe channel plugins;
geef de voorkeur aan de generieke channel/setup/reply/runtime-subpaden uit het gemeenschappelijke SDK-
oppervlak, tenzij je die gebundelde pluginfamilie rechtstreeks onderhoudt.
</Note>

## Volgende stappen

- [Provider-Plugins](/nl/plugins/sdk-provider-plugins) - als je plugin ook modellen levert
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige referentie voor subpath-imports
- [SDK-testen](/nl/plugins/sdk-testing) - testhulpmiddelen en contracttests
- [Plugin-manifest](/nl/plugins/manifest) - volledig manifestschema

## Gerelateerd

- [Plugin SDK-installatie](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Agent-harnessplugins](/nl/plugins/sdk-agent-harness)
