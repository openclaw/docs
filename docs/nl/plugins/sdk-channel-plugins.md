---
read_when:
    - Je bouwt een nieuwe Plugin voor een berichtenkanaal
    - Je wilt OpenClaw verbinden met een berichtenplatform
    - Je moet de adapterinterface van ChannelPlugin begrijpen
sidebarTitle: Channel Plugins
summary: Stapsgewijze handleiding voor het bouwen van een berichtenkanaal-Plugin voor OpenClaw
title: Kanaalplugins bouwen
x-i18n:
    generated_at: "2026-05-06T09:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Deze gids laat zien hoe je een kanaalplugin bouwt die OpenClaw met een
berichtenplatform verbindt. Aan het einde heb je een werkend kanaal met DM-beveiliging,
koppeling, antwoordthreads en uitgaande berichten.

<Info>
  Als je nog niet eerder een OpenClaw-plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basisstructuur van het pakket
  en de manifestconfiguratie.
</Info>

## Hoe kanaalplugins werken

Kanaalplugins hebben geen eigen verzend-, bewerk- of reactietools nodig. OpenClaw houdt één
gedeelde `message`-tool in de kern. Je plugin is verantwoordelijk voor:

- **Configuratie** - accountresolutie en configuratiewizard
- **Beveiliging** - DM-beleid en toestemmingslijsten
- **Koppeling** - DM-goedkeuringsflow
- **Sessiesyntaxis** - hoe providerspecifieke gespreks-id's worden gekoppeld aan basischats, thread-id's en bovenliggende fallbacks
- **Uitgaand** - tekst, media en polls naar het platform sturen
- **Threads** - hoe antwoorden in threads worden geplaatst
- **Heartbeat-typen** - optionele typ-/bezig-signalen voor Heartbeat-afleverdoelen

De kern beheert de gedeelde berichtentool, promptkoppeling, de buitenste sessiesleutelvorm,
generieke `:thread:`-boekhouding en dispatch.

Nieuwe kanaalplugins moeten ook een `message`-adapter aanbieden met
`defineChannelMessageAdapter` uit `openclaw/plugin-sdk/channel-message`. De
adapter declareert welke duurzame mogelijkheden voor definitief verzenden het native transport
daadwerkelijk ondersteunt en verwijst tekst-/mediaverzendingen naar dezelfde transportfuncties als
de verouderde `outbound`-adapter. Declareer een mogelijkheid alleen wanneer een contracttest
het native neveneffect en het geretourneerde ontvangstbewijs bewijst.
Zie voor het volledige API-contract, voorbeelden, mogelijkhedenmatrix, ontvangstbewijsregels, definitieve livevoorbeeldafronding, ontvangstbevestigingsbeleid, tests en migratietabel
[Kanaalbericht-API](/nl/plugins/sdk-channel-message).
Als de bestaande `outbound`-adapter al de juiste verzendmethoden en
mogelijkheidsmetadata heeft, gebruik dan `createChannelMessageAdapterFromOutbound(...)` om
de `message`-adapter af te leiden in plaats van handmatig nog een brug te schrijven.
Adapterverzendingen moeten `MessageReceipt`-waarden retourneren. Wanneer compatibiliteitscode
nog verouderde id's nodig heeft, leid die dan af met `listMessageReceiptPlatformIds(...)`
of `resolveMessageReceiptPrimaryId(...)` in plaats van parallelle
`messageIds`-velden in nieuwe levenscycluscode te behouden.
Kanalen met voorbeeldondersteuning moeten ook `message.live.capabilities` declareren met
de exacte live-levenscyclus die ze beheren, zoals `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` of
`quietFinalization`. Kanalen die een conceptvoorbeeld ter plekke afronden, moeten
ook `message.live.finalizer.capabilities` declareren, zoals `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` en
`retainOnAmbiguousFailure`, en de runtimelogica routeren via
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)`. Houd die mogelijkheden onderbouwd
door tests met `verifyChannelMessageLiveCapabilityAdapterProofs(...)` en
`verifyChannelMessageLiveFinalizerProofs(...)`, zodat native voorbeeld-,
voortgangs-, bewerkings-, fallback-/behoud-, opschoon- en ontvangstbewijsgedrag niet stilzwijgend kan afwijken.
Inkomende ontvangers die platformbevestigingen uitstellen, moeten
`message.receive.defaultAckPolicy` en `supportedAckPolicies` declareren in plaats van
bevestigingstiming in monitorlokale state te verbergen. Dek elk gedeclareerd beleid af met
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Verouderde helpers voor antwoorden/beurten zoals `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` en `recordInboundSessionAndDispatchReply`
blijven beschikbaar voor compatibiliteitsdispatchers. Gebruik die namen niet voor nieuwe
kanaalcode; nieuwe plugins moeten beginnen met de `message`-adapter, ontvangstbewijzen en
helpers voor de ontvangst-/verzendlevenscyclus op `openclaw/plugin-sdk/channel-message`.

Als je kanaal typindicatoren buiten inkomende antwoorden ondersteunt, bied dan
`heartbeat.sendTyping(...)` aan op de kanaalplugin. De kern roept dit aan met het
opgeloste Heartbeat-afleverdoel voordat de Heartbeat-modelrun start en
gebruikt de gedeelde levenscyclus voor typ-keepalive en opschoning. Voeg `heartbeat.clearTyping(...)`
toe wanneer het platform een expliciet stopsignaal nodig heeft.

Als je kanaal berichtentoolparameters toevoegt die mediabronnen bevatten, bied die
parameternamen dan aan via `describeMessageTool(...).mediaSourceParams`. De kern gebruikt
die expliciete lijst voor normalisatie van sandboxpaden en beleid voor uitgaande mediatoegang,
zodat plugins geen gedeelde kernspecialisaties nodig hebben voor providerspecifieke
avatar-, bijlage- of omslagafbeeldingsparameters.
Geef bij voorkeur een actiegesleutelde map terug, zoals
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, zodat niet-gerelateerde acties niet
de media-argumenten van een andere actie overerven. Een platte array werkt nog steeds voor parameters die
bewust tussen elke aangeboden actie worden gedeeld.

Als je kanaal providerspecifieke vormgeving nodig heeft voor `message(action="send")`,
gebruik dan bij voorkeur `actions.prepareSendPayload(...)`. Plaats native kaarten, blokken, embeds of
andere duurzame gegevens onder `payload.channelData.<channel>` en laat de kern
de daadwerkelijke verzending uitvoeren via de outbound-/message-adapter. Gebruik
`actions.handleAction(...)` voor verzenden alleen als compatibiliteitsfallback voor
payloads die niet kunnen worden geserialiseerd en opnieuw geprobeerd.

Als je platform extra scope opslaat in gespreks-id's, houd die parsing dan
in de plugin met `messaging.resolveSessionConversation(...)`. Dat is de
canonieke hook voor het koppelen van `rawId` aan de basisgespreks-id, optionele thread-id,
expliciete `baseConversationId` en eventuele `parentConversationCandidates`.
Wanneer je `parentConversationCandidates` retourneert, houd ze dan geordend van de
smalste parent tot het breedste/basisgesprek.

Gebruik `openclaw/plugin-sdk/channel-route` wanneer plugincode route-achtige velden moet normaliseren,
een child-thread met zijn parent-route moet vergelijken, of een
stabiele deduplicatiesleutel moet bouwen uit `{ channel, to, accountId, threadId }`. De helper
normaliseert numerieke thread-id's op dezelfde manier als de kern, dus plugins moeten hier de voorkeur aan geven
boven ad-hocvergelijkingen met `String(threadId)`.
Plugins met providerspecifieke doelsyntaxis kunnen hun parser injecteren in
`resolveChannelRouteTargetWithParser(...)` en toch dezelfde routedoelevorm en
thread-fallbacksemantiek krijgen die de kern gebruikt.

Gebundelde plugins die dezelfde parsing nodig hebben voordat het kanaalregister opstart,
kunnen ook een `session-key-api.ts`-bestand op topniveau aanbieden met een bijbehorende
`resolveSessionConversation(...)`-export. De kern gebruikt dat opstartveilige oppervlak
alleen wanneer het runtimepluginregister nog niet beschikbaar is.

`messaging.resolveParentConversationCandidates(...)` blijft beschikbaar als
verouderde compatibiliteitsfallback wanneer een plugin alleen parent-fallbacks nodig heeft boven op
de generieke/ruwe id. Als beide hooks bestaan, gebruikt de kern eerst
`resolveSessionConversation(...).parentConversationCandidates` en valt alleen
terug op `resolveParentConversationCandidates(...)` wanneer de canonieke hook
ze weglaat.

## Goedkeuringen en kanaalmogelijkheden

De meeste kanaalplugins hebben geen goedkeuringsspecifieke code nodig.

- Core beheert `/approve` in dezelfde chat, gedeelde payloads voor goedkeuringsknoppen en generieke fallback-bezorging.
- Geef de voorkeur aan één `approvalCapability`-object op de channel-Plugin wanneer het kanaal goedkeuringsspecifiek gedrag nodig heeft.
- `ChannelPlugin.approvals` is verwijderd. Plaats feiten over goedkeuringsbezorging, native gedrag, rendering en auth op `approvalCapability`.
- `plugin.auth` is alleen voor login/logout; core leest geen goedkeurings-auth-hooks meer uit dat object.
- `approvalCapability.authorizeActorAction` en `approvalCapability.getActionAvailabilityState` zijn de canonieke seam voor goedkeurings-auth.
- Gebruik `approvalCapability.getActionAvailabilityState` voor beschikbaarheid van goedkeurings-auth in dezelfde chat.
- Als je kanaal native exec-goedkeuringen exposeert, gebruik dan `approvalCapability.getExecInitiatingSurfaceState` voor de initiating-surface/native-client-status wanneer die afwijkt van goedkeurings-auth in dezelfde chat. Core gebruikt die exec-specifieke hook om onderscheid te maken tussen `enabled` en `disabled`, te bepalen of het initiating channel native exec-goedkeuringen ondersteunt, en het kanaal op te nemen in fallback-begeleiding voor native clients. `createApproverRestrictedNativeApprovalCapability(...)` vult dit in voor het gangbare geval.
- Gebruik `outbound.shouldSuppressLocalPayloadPrompt` of `outbound.beforeDeliverPayload` voor kanaalspecifiek payload-lifecycle-gedrag, zoals het verbergen van dubbele lokale goedkeuringsprompts of het verzenden van typing indicators vóór bezorging.
- Gebruik `approvalCapability.delivery` alleen voor native goedkeuringsrouting of fallback-onderdrukking.
- Gebruik `approvalCapability.nativeRuntime` voor native goedkeuringsfeiten die eigendom zijn van het kanaal. Houd het lazy op hot channel entrypoints met `createLazyChannelApprovalNativeRuntimeAdapter(...)`, dat je runtime-module on demand kan importeren terwijl core nog steeds de goedkeuringslifecycle kan samenstellen.
- Gebruik `approvalCapability.render` alleen wanneer een kanaal echt aangepaste goedkeuringspayloads nodig heeft in plaats van de gedeelde renderer.
- Gebruik `approvalCapability.describeExecApprovalSetup` wanneer het kanaal wil dat het antwoord voor het disabled-pad uitlegt welke exacte config-knoppen nodig zijn om native exec-goedkeuringen in te schakelen. De hook ontvangt `{ channel, channelLabel, accountId }`; named-account-kanalen moeten account-scoped paden renderen, zoals `channels.<channel>.accounts.<id>.execApprovals.*`, in plaats van top-level defaults.
- Als een kanaal stabiele eigenaarachtige DM-identiteiten uit bestaande config kan afleiden, gebruik dan `createResolvedApproverActionAuthAdapter` uit `openclaw/plugin-sdk/approval-runtime` om `/approve` in dezelfde chat te beperken zonder goedkeuringsspecifieke core-logica toe te voegen.
- Als een kanaal native goedkeuringsbezorging nodig heeft, houd kanaalcode dan gericht op target-normalisatie plus transport-/presentatiefeiten. Gebruik `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` en `createApproverRestrictedNativeApprovalCapability` uit `openclaw/plugin-sdk/approval-runtime`. Plaats de kanaalspecifieke feiten achter `approvalCapability.nativeRuntime`, idealiter via `createChannelApprovalNativeRuntimeAdapter(...)` of `createLazyChannelApprovalNativeRuntimeAdapter(...)`, zodat core de handler kan samenstellen en request filtering, routing, dedupe, expiry, Gateway-subscriptie en routed-elsewhere-notificaties kan beheren. `nativeRuntime` is opgesplitst in enkele kleinere seams:
- `createChannelNativeOriginTargetResolver` gebruikt standaard de gedeelde channel-route-matcher voor `{ to, accountId, threadId }`-targets. Geef `targetsMatch` alleen door wanneer een kanaal provider-specifieke equivalentieregels heeft, zoals Slack timestamp-prefix-matching.
- Geef `normalizeTargetForMatch` door aan `createChannelNativeOriginTargetResolver` wanneer het kanaal provider-id's moet canonicaliseren voordat de standaard route-matcher of een aangepaste `targetsMatch`-callback draait, terwijl het oorspronkelijke target voor bezorging behouden blijft. Gebruik `normalizeTarget` alleen wanneer het opgeloste bezorgtarget zelf gecanonicaliseerd moet worden.
- `availability` - of het account geconfigureerd is en of een request moet worden afgehandeld
- `presentation` - map het gedeelde goedkeurings-viewmodel naar native payloads of eindacties voor pending/resolved/expired
- `transport` - bereid targets voor en verzend/update/verwijder native goedkeuringsberichten
- `interactions` - optionele bind/unbind/clear-action-hooks voor native knoppen of reacties
- `observe` - optionele diagnostische hooks voor bezorging
- Als het kanaal runtime-owned objecten nodig heeft, zoals een client, token, Bolt-app of webhook receiver, registreer die dan via `openclaw/plugin-sdk/channel-runtime-context`. De generieke runtime-context-registry laat core capability-driven handlers bootstrappen vanuit de opstartstatus van het kanaal zonder goedkeuringsspecifieke wrapper-glue toe te voegen.
- Grijp alleen naar het lagere niveau `createChannelApprovalHandler` of `createChannelNativeApprovalRuntime` wanneer de capability-driven seam nog niet expressief genoeg is.
- Native goedkeuringskanalen moeten zowel `accountId` als `approvalKind` via die helpers routeren. `accountId` houdt multi-account-goedkeuringsbeleid scoped naar het juiste bot-account, en `approvalKind` houdt exec- versus Plugin-goedkeuringsgedrag beschikbaar voor het kanaal zonder hardcoded branches in core.
- Core beheert nu ook notices voor het omleiden van goedkeuringen. Channel-Plugins moeten geen eigen follow-upberichten "approval went to DMs / another channel" verzenden vanuit `createChannelNativeApprovalRuntime`; exposeer in plaats daarvan accurate origin- en approver-DM-routing via de gedeelde helpers voor goedkeuringscapabilities en laat core daadwerkelijke bezorgingen aggregeren voordat er een notice terug naar de initiating chat wordt gepost.
- Behoud het type van de bezorgde goedkeurings-id end-to-end. Native clients mogen
  exec- versus Plugin-goedkeuringsrouting niet raden of herschrijven vanuit kanaal-lokale status.
- Verschillende goedkeuringstypen kunnen bewust verschillende native surfaces exposen.
  Huidige gebundelde voorbeelden:
  - Slack houdt native goedkeuringsrouting beschikbaar voor zowel exec- als Plugin-id's.
  - Matrix houdt dezelfde native DM-/kanaalrouting en reactie-UX voor exec-
    en Plugin-goedkeuringen, terwijl auth nog steeds per goedkeuringstype kan verschillen.
- `createApproverRestrictedNativeApprovalAdapter` bestaat nog steeds als compatibiliteitswrapper, maar nieuwe code moet de voorkeur geven aan de capability builder en `approvalCapability` op de Plugin exposen.

Voor hot channel entrypoints geef je de voorkeur aan de smallere runtime-subpaden wanneer je maar
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

Geef eveneens de voorkeur aan `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` en
`openclaw/plugin-sdk/reply-chunking` wanneer je de bredere overkoepelende
surface niet nodig hebt.

Specifiek voor setup:

- `openclaw/plugin-sdk/setup-runtime` dekt de runtime-veilige setup-helpers:
  import-veilige setup patch adapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note-output,
  `promptResolvedAllowFrom`, `splitSetupEntries` en de gedelegeerde
  setup-proxy builders
- `openclaw/plugin-sdk/setup-adapter-runtime` is de smalle env-aware adapter-
  seam voor `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` dekt de optional-install setup
  builders plus enkele setup-veilige primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Als je kanaal env-driven setup of auth ondersteunt en generieke startup/config-
flows die env-namen vóór runtime-loads moeten kennen, declareer ze dan in het
Plugin-manifest met `channelEnvVars`. Houd channel runtime `envVars` of lokale
constanten alleen voor operator-facing copy.

Als je kanaal kan verschijnen in `status`, `channels list`, `channels status` of
SecretRef-scans voordat de Plugin-runtime start, voeg dan `openclaw.setupEntry` toe in
`package.json`. Dat entrypoint moet veilig te importeren zijn in read-only command-
paden en moet de kanaalmetadata, setup-veilige config adapter, status
adapter en metadata voor channel secret targets teruggeven die nodig zijn voor die samenvattingen. Start geen
clients, listeners of transport-runtimes vanuit de setup entry.

Houd ook het importpad van de main channel entry smal. Discovery kan de
entry en de channel Plugin-module evalueren om capabilities te registreren zonder
het kanaal te activeren. Bestanden zoals `channel-plugin-api.ts` moeten het channel
Plugin-object exporteren zonder setup wizards, transport clients, socket
listeners, subprocess launchers of service startup-modules te importeren. Plaats die runtime-
onderdelen in modules die worden geladen vanuit `registerFull(...)`, runtime setters of lazy
capability adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` en
`splitSetupEntries`

- gebruik de bredere `openclaw/plugin-sdk/setup`-seam alleen wanneer je ook de
  zwaardere gedeelde setup/config-helpers nodig hebt, zoals
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Als je kanaal alleen "install this plugin first" wil tonen in setup-
surfaces, geef dan de voorkeur aan `createOptionalChannelSetupSurface(...)`. De gegenereerde
adapter/wizard falen gesloten bij config writes en finalization, en ze hergebruiken
hetzelfde install-required-bericht in validatie, finalize en docs-link-
copy.

Voor andere hot channel-paden geef je de voorkeur aan de smalle helpers boven bredere legacy-
surfaces:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` en
  `openclaw/plugin-sdk/account-helpers` voor multi-account-config en
  default-account-fallback
- `openclaw/plugin-sdk/inbound-envelope` en
  `openclaw/plugin-sdk/inbound-reply-dispatch` voor inbound route/envelope en
  record-and-dispatch-wiring
- `openclaw/plugin-sdk/messaging-targets` voor target parsing/matching
- `openclaw/plugin-sdk/outbound-media` en
  `openclaw/plugin-sdk/outbound-runtime` voor media loading plus outbound
  identity/send delegates en payload planning
- `buildThreadAwareOutboundSessionRoute(...)` uit
  `openclaw/plugin-sdk/channel-core` wanneer een outbound route een
  expliciete `replyToId`/`threadId` moet behouden of de huidige `:thread:`-sessie
  moet herstellen nadat de base session key nog steeds matcht. Provider-Plugins kunnen
  precedence, suffix-gedrag en thread-id-normalisatie overriden wanneer hun platform
  native thread delivery semantics heeft.
- `openclaw/plugin-sdk/thread-bindings-runtime` voor thread-binding-lifecycle
  en adapterregistratie
- `openclaw/plugin-sdk/agent-media-payload` alleen wanneer een legacy agent/media-
  payloadveldindeling nog vereist is
- `openclaw/plugin-sdk/telegram-command-config` voor Telegram custom-command-
  normalisatie, validatie van duplicaten/conflicten en een fallback-stabiel command
  config-contract

Auth-only kanalen kunnen meestal stoppen bij het standaardpad: core handelt goedkeuringen af en de Plugin exposeert alleen outbound/auth-capabilities. Native goedkeuringskanalen zoals Matrix, Slack, Telegram en aangepaste chat-transports moeten de gedeelde native helpers gebruiken in plaats van hun eigen goedkeuringslifecycle te bouwen.

## Beleid voor inbound vermeldingen

Houd verwerking van inbound vermeldingen opgesplitst in twee lagen:

- plugin-owned evidence gathering
- shared policy evaluation

Gebruik `openclaw/plugin-sdk/channel-mention-gating` voor mention-policy-beslissingen.
Gebruik `openclaw/plugin-sdk/channel-inbound` alleen wanneer je de bredere inbound
helper barrel nodig hebt.

Goede plek voor Plugin-lokale logica:

- reply-to-bot-detectie
- quoted-bot-detectie
- thread-participation-checks
- service/system-message-exclusions
- platform-native caches die nodig zijn om bot-participatie te bewijzen

Goede plek voor de gedeelde helper:

- `requireMention`
- expliciet vermeldingsresultaat
- allowlist voor impliciete vermeldingen
- opdrachtbypass
- uiteindelijke overslabeslissing

Aanbevolen flow:

1. Bereken lokale vermeldingsfeiten.
2. Geef die feiten door aan `resolveInboundMentionDecision({ facts, policy })`.
3. Gebruik `decision.effectiveWasMentioned`, `decision.shouldBypassMention` en `decision.shouldSkip` in je inbound gate.

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
`openclaw/plugin-sdk/channel-mention-gating` om te voorkomen dat niet-gerelateerde inbound
runtimehelpers worden geladen.

De oudere `resolveMentionGating*`-helpers blijven op
`openclaw/plugin-sdk/channel-inbound` alleen beschikbaar als compatibiliteitsexports. Nieuwe code
moet `resolveInboundMentionDecision({ facts, policy })` gebruiken.

## Doorloop

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Maak de standaard pluginbestanden. Het veld `channel` in `package.json` is
    wat dit een kanaalplugin maakt. Zie voor het volledige oppervlak voor pakketmetadata
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
    instellingen die eigendom zijn van de plugin en geen kanaalaccountconfiguratie zijn. `channelConfigs`
    valideert `channels.acme-chat` en is de cold-path-bron die door het configuratieschema,
    de setup en UI-oppervlakken wordt gebruikt voordat de pluginruntime laadt.

  </Step>

  <Step title="Build the channel plugin object">
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

    Voor kanalen die zowel canonieke DM-sleutels op topniveau als verouderde geneste sleutels accepteren, gebruik je de helpers uit `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` en `normalizeChannelDmPolicy` houden accountlokale waarden vóór overgenomen rootwaarden. Combineer dezelfde resolver met doctor-reparatie via `normalizeLegacyDmAliases`, zodat runtime en migratie hetzelfde contract lezen.

    <Accordion title="What createChatChannelPlugin does for you">
      In plaats van low-level adapterinterfaces handmatig te implementeren, geef je
      declaratieve opties door en stelt de builder ze samen:

      | Optie | Wat het verbindt |
      | --- | --- |
      | `security.dm` | Scoped DM-beveiligingsresolver vanuit configuratievelden |
      | `pairing.text` | Op tekst gebaseerde DM-koppelingsflow met code-uitwisseling |
      | `threading` | Resolver voor antwoordmodus (vast, account-scoped of aangepast) |
      | `outbound.attachedResults` | Verzendfuncties die resultaatmetadata retourneren (bericht-ID's) |

      Je kunt ook raw adapterobjecten doorgeven in plaats van de declaratieve opties
      als je volledige controle nodig hebt.

      Raw outbound-adapters mogen een functie `chunker(text, limit, ctx)` definiëren.
      De optionele `ctx.formatting` draagt beslissingen over formattering tijdens levering
      zoals `maxLinesPerMessage`; pas dit toe vóór verzending, zodat antwoordthreading
      en chunkgrenzen één keer door gedeelde outbound-levering worden opgelost.
      Verzendcontexten bevatten ook `replyToIdSource` (`implicit` of `explicit`)
      wanneer een native antwoorddoel is opgelost, zodat payloadhelpers
      expliciete antwoordtags kunnen behouden zonder een impliciete eenmalige antwoordslot te gebruiken.
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

    Plaats CLI-descriptors die eigendom zijn van het kanaal in `registerCliMetadata(...)`, zodat OpenClaw
    ze in roothelp kan tonen zonder de volledige kanaalruntime te activeren,
    terwijl normale volledige loads nog steeds dezelfde descriptors meenemen voor echte opdrachtregistratie.
    Houd `registerFull(...)` voor werk dat alleen tijdens runtime nodig is.
    Als `registerFull(...)` Gateway-RPC-methoden registreert, gebruik dan een
    plugin-specifiek prefix. Core-adminnamespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd
    opgelost naar `operator.admin`.
    `defineChannelPluginEntry` handelt de splitsing in registratiemodus automatisch af. Zie
    [Invoerpunten](/nl/plugins/sdk-entrypoints#definechannelpluginentry) voor alle
    opties.

  </Step>

  <Step title="Add a setup entry">
    Maak `setup-entry.ts` voor lichtgewicht laden tijdens onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw laadt dit in plaats van de volledige entry wanneer het kanaal is uitgeschakeld
    of niet is geconfigureerd. Het voorkomt dat zware runtimecode wordt binnengehaald tijdens setupflows.
    Zie [Setup en configuratie](/nl/plugins/sdk-setup#setup-entry) voor details.

    Gebundelde workspace-kanalen die setup-veilige exports splitsen naar sidecar
    modules kunnen `defineBundledChannelSetupEntry(...)` uit
    `openclaw/plugin-sdk/channel-entry-contract` gebruiken wanneer ze ook een
    expliciete runtime-setter tijdens setup nodig hebben.

  </Step>

  <Step title="Handle inbound messages">
    Je plugin moet berichten van het platform ontvangen en doorsturen naar
    OpenClaw. Het typische patroon is een Webhook die de aanvraag verifieert en
    deze via de inbound-handler van je kanaal dispatcht:

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
      Afhandeling van inkomende berichten is kanaalspecifiek. Elke kanaalplugin beheert
      zijn eigen inkomende pipeline. Bekijk gebundelde kanaalplugins
      (bijvoorbeeld het pluginpakket voor Microsoft Teams of Google Chat) voor echte patronen.
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

    Zie [Testen](/nl/plugins/sdk-testing) voor gedeelde testhelpers.

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
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, STT, media, subagent via api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/nl/plugins/sdk-channel-turn">
    Gedeelde levenscyclus voor inkomende turns: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Sommige gebundelde helper-seams bestaan nog steeds voor onderhoud van gebundelde plugins en
compatibiliteit. Ze zijn niet het aanbevolen patroon voor nieuwe kanaalplugins;
geef de voorkeur aan de generieke channel/setup/reply/runtime-subpaden van het gemeenschappelijke SDK-
oppervlak, tenzij je die gebundelde pluginfamilie rechtstreeks onderhoudt.
</Note>

## Volgende stappen

- [Providerplugins](/nl/plugins/sdk-provider-plugins) - als je plugin ook modellen levert
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige importreferentie voor subpaden
- [SDK-testen](/nl/plugins/sdk-testing) - testhulpmiddelen en contracttests
- [Pluginmanifest](/nl/plugins/manifest) - volledig manifestschema

## Gerelateerd

- [Plugin SDK-installatie](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Agent-harnasplugins](/nl/plugins/sdk-agent-harness)
