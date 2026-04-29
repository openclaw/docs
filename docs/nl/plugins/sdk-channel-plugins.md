---
read_when:
    - Je bouwt een nieuwe Plugin voor een berichtenkanaal
    - Je wilt OpenClaw verbinden met een berichtenplatform
    - Je moet de adapterinterface van ChannelPlugin begrijpen
sidebarTitle: Channel Plugins
summary: Stapsgewijze handleiding voor het bouwen van een Plugin voor een berichtenkanaal voor OpenClaw
title: Plugins voor kanalen bouwen
x-i18n:
    generated_at: "2026-04-29T23:04:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03384057a4316b87c6088d3859d16ed4546c803f7c64639cd12be293f4841258
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Deze handleiding beschrijft hoe je een kanaalplugin bouwt die OpenClaw met een
berichtenplatform verbindt. Aan het einde heb je een werkend kanaal met DM-beveiliging,
koppeling, antwoord-threading en uitgaande berichten.

<Info>
  Als je nog niet eerder een OpenClaw-plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basale pakketstructuur
  en manifestconfiguratie.
</Info>

## Hoe kanaalplugins werken

Kanaalplugins hebben geen eigen tools voor verzenden/bewerken/reageren nodig. OpenClaw behoudt één
gedeelde `message`-tool in de core. Je plugin is eigenaar van:

- **Configuratie** — accountresolutie en installatiewizard
- **Beveiliging** — DM-beleid en allowlists
- **Koppeling** — DM-goedkeuringsflow
- **Sessiesyntaxis** — hoe providerspecifieke gespreks-id's worden gekoppeld aan basischats, thread-id's en bovenliggende fallbacks
- **Uitgaand** — tekst, media en polls naar het platform verzenden
- **Threading** — hoe antwoorden in threads worden geplaatst
- **Heartbeat-typen** — optionele type-/bezet-signalen voor Heartbeat-bezorgdoelen

Core is eigenaar van de gedeelde berichtentool, prompt-bedrading, de buitenste sessiesleutelvorm,
generieke `:thread:`-boekhouding en dispatch.

Als je kanaal type-indicatoren buiten inkomende antwoorden ondersteunt, expose dan
`heartbeat.sendTyping(...)` op de kanaalplugin. Core roept dit aan met het
opgeloste Heartbeat-bezorgdoel voordat de Heartbeat-modelrun start en
gebruikt de gedeelde lifecycle voor type-keepalive en opschoning. Voeg `heartbeat.clearTyping(...)`
toe wanneer het platform een expliciet stopsignaal nodig heeft.

Als je kanaal berichtentoolparameters toevoegt die mediabronnen bevatten, expose dan die
parameternamen via `describeMessageTool(...).mediaSourceParams`. Core gebruikt
die expliciete lijst voor sandbox-padnormalisatie en uitgaand mediatoegangsbeleid,
zodat plugins geen gedeelde-core-special cases nodig hebben voor providerspecifieke
avatar-, bijlage- of omslagafbeeldingsparameters.
Geef bij voorkeur een op actie gebaseerde map terug, zoals
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, zodat niet-gerelateerde acties
niet de media-argumenten van een andere actie erven. Een platte array werkt nog steeds voor parameters die
bewust door elke geëxposede actie worden gedeeld.

Als je platform extra scope in gespreks-id's opslaat, houd die parsing
in de plugin met `messaging.resolveSessionConversation(...)`. Dat is de
canonieke hook voor het koppelen van `rawId` aan het basisgespreks-id, optioneel thread-id,
expliciet `baseConversationId` en eventuele `parentConversationCandidates`.
Wanneer je `parentConversationCandidates` teruggeeft, houd ze dan geordend van de
smalste parent naar het breedste/basisgesprek.

Gebruik `openclaw/plugin-sdk/channel-route` wanneer plugincode route-achtige velden moet normaliseren,
een child-thread met de parent-route moet vergelijken, of een
stabiele dedupe-sleutel moet bouwen uit `{ channel, to, accountId, threadId }`. De helper
normaliseert numerieke thread-id's op dezelfde manier als core, dus plugins moeten deze verkiezen
boven ad-hocvergelijkingen met `String(threadId)`.
Plugins met providerspecifieke doelsyntaxis kunnen hun parser injecteren in
`resolveChannelRouteTargetWithParser(...)` en nog steeds dezelfde routedoelvorm
en thread-fallbacksemantiek krijgen die core gebruikt.

Gebundelde plugins die dezelfde parsing nodig hebben voordat het kanaalregister opstart,
kunnen ook een top-level `session-key-api.ts`-bestand exposen met een overeenkomende
`resolveSessionConversation(...)`-export. Core gebruikt dat bootstrap-veilige oppervlak
alleen wanneer het runtime-pluginregister nog niet beschikbaar is.

`messaging.resolveParentConversationCandidates(...)` blijft beschikbaar als een
legacy compatibiliteitsfallback wanneer een plugin alleen parent-fallbacks bovenop
het generieke/raw-id nodig heeft. Als beide hooks bestaan, gebruikt core eerst
`resolveSessionConversation(...).parentConversationCandidates` en valt alleen
terug op `resolveParentConversationCandidates(...)` wanneer de canonieke hook
ze weglaat.

## Goedkeuringen en kanaalmogelijkheden

De meeste kanaalplugins hebben geen goedkeuringsspecifieke code nodig.

- Core is eigenaar van same-chat `/approve`, gedeelde payloads voor goedkeuringsknoppen en generieke fallbackbezorging.
- Geef de voorkeur aan één `approvalCapability`-object op de kanaalplugin wanneer het kanaal goedkeuringsspecifiek gedrag nodig heeft.
- `ChannelPlugin.approvals` is verwijderd. Zet feiten over goedkeuringsbezorging, native gedrag, rendering en auth op `approvalCapability`.
- `plugin.auth` is alleen voor inloggen/uitloggen; core leest geen goedkeurings-auth-hooks meer uit dat object.
- `approvalCapability.authorizeActorAction` en `approvalCapability.getActionAvailabilityState` zijn de canonieke seam voor goedkeurings-auth.
- Gebruik `approvalCapability.getActionAvailabilityState` voor de beschikbaarheid van goedkeurings-auth in dezelfde chat.
- Als je kanaal native exec-goedkeuringen exposeert, gebruik dan `approvalCapability.getExecInitiatingSurfaceState` voor de status van het initiërende oppervlak/de native client wanneer die verschilt van goedkeurings-auth in dezelfde chat. Core gebruikt die exec-specifieke hook om `enabled` van `disabled` te onderscheiden, te bepalen of het initiërende kanaal native exec-goedkeuringen ondersteunt, en het kanaal op te nemen in fallback-instructies voor native clients. `createApproverRestrictedNativeApprovalCapability(...)` vult dit in voor het algemene geval.
- Gebruik `outbound.shouldSuppressLocalPayloadPrompt` of `outbound.beforeDeliverPayload` voor kanaalspecifiek payload-lifecycle-gedrag, zoals het verbergen van dubbele lokale goedkeuringsprompts of het verzenden van type-indicatoren vóór bezorging.
- Gebruik `approvalCapability.delivery` alleen voor native goedkeuringsrouting of fallback-onderdrukking.
- Gebruik `approvalCapability.nativeRuntime` voor kanaaleigen native goedkeuringsfeiten. Houd dit lazy op hot kanaalentrypoints met `createLazyChannelApprovalNativeRuntimeAdapter(...)`, dat je runtimemodule op aanvraag kan importeren terwijl core nog steeds de goedkeuringslifecycle kan samenstellen.
- Gebruik `approvalCapability.render` alleen wanneer een kanaal echt aangepaste goedkeuringspayloads nodig heeft in plaats van de gedeelde renderer.
- Gebruik `approvalCapability.describeExecApprovalSetup` wanneer het kanaal wil dat het antwoord op het disabled-pad uitlegt welke exacte configuratieknoppen nodig zijn om native exec-goedkeuringen in te schakelen. De hook ontvangt `{ channel, channelLabel, accountId }`; kanalen met benoemde accounts moeten account-gescopete paden renderen, zoals `channels.<channel>.accounts.<id>.execApprovals.*`, in plaats van top-level defaults.
- Als een kanaal stabiele owner-achtige DM-identiteiten uit bestaande configuratie kan afleiden, gebruik dan `createResolvedApproverActionAuthAdapter` uit `openclaw/plugin-sdk/approval-runtime` om same-chat `/approve` te beperken zonder goedkeuringsspecifieke corelogica toe te voegen.
- Als een kanaal native goedkeuringsbezorging nodig heeft, houd de kanaalcode dan gericht op doelnormalisatie plus transport-/presentatiefeiten. Gebruik `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` en `createApproverRestrictedNativeApprovalCapability` uit `openclaw/plugin-sdk/approval-runtime`. Zet de kanaalspecifieke feiten achter `approvalCapability.nativeRuntime`, idealiter via `createChannelApprovalNativeRuntimeAdapter(...)` of `createLazyChannelApprovalNativeRuntimeAdapter(...)`, zodat core de handler kan samenstellen en eigenaar kan zijn van requestfiltering, routing, dedupe, expiry, Gateway-subscription en meldingen dat iets elders is gerouteerd. `nativeRuntime` is opgesplitst in een paar kleinere seams:
- `createChannelNativeOriginTargetResolver` gebruikt standaard de gedeelde channel-route matcher voor `{ to, accountId, threadId }`-doelen. Geef `targetsMatch` alleen door wanneer een kanaal providerspecifieke equivalentieregels heeft, zoals Slack timestamp-prefixmatching.
- Geef `normalizeTargetForMatch` door aan `createChannelNativeOriginTargetResolver` wanneer het kanaal provider-id's moet canonicaliseren voordat de standaard routematcher of een aangepaste `targetsMatch`-callback draait, terwijl het oorspronkelijke doel voor bezorging behouden blijft. Gebruik `normalizeTarget` alleen wanneer het opgeloste bezorgdoel zelf moet worden gecanonicaliseerd.
- `availability` — of het account is geconfigureerd en of een request moet worden afgehandeld
- `presentation` — koppel het gedeelde goedkeuringsviewmodel aan pending/resolved/expired native payloads of finale acties
- `transport` — bereid doelen voor plus verzend/update/verwijder native goedkeuringsberichten
- `interactions` — optionele bind/unbind/clear-action-hooks voor native knoppen of reacties
- `observe` — optionele hooks voor bezorgdiagnostiek
- Als het kanaal runtime-eigen objecten nodig heeft, zoals een client, token, Bolt-app of webhookontvanger, registreer die dan via `openclaw/plugin-sdk/channel-runtime-context`. Het generieke runtime-contextregister laat core capability-gedreven handlers bootstrappen vanuit kanaalopstartstatus zonder goedkeuringsspecifieke wrapperlijm toe te voegen.
- Grijp alleen naar de lagere-level `createChannelApprovalHandler` of `createChannelNativeApprovalRuntime` wanneer de capability-gedreven seam nog niet expressief genoeg is.
- Native goedkeuringskanalen moeten zowel `accountId` als `approvalKind` via die helpers routeren. `accountId` houdt multi-account-goedkeuringsbeleid gescopet naar het juiste botaccount, en `approvalKind` houdt exec- versus plugingoedkeuringsgedrag beschikbaar voor het kanaal zonder hardcoded branches in core.
- Core is nu ook eigenaar van goedkeurings-reroute-meldingen. Kanaalplugins mogen geen eigen vervolgberichten met "approval went to DMs / another channel" verzenden vanuit `createChannelNativeApprovalRuntime`; expose in plaats daarvan nauwkeurige origin- en approver-DM-routing via de gedeelde goedkeuringscapabilityhelpers en laat core echte bezorgingen aggregeren voordat er een melding terug naar de initiërende chat wordt geplaatst.
- Behoud het soort bezorgd goedkeurings-id end-to-end. Native clients mogen niet
  gokken of exec- versus plugingoedkeuringsrouting herschrijven vanuit kanaallokale status.
- Verschillende goedkeuringssoorten kunnen bewust verschillende native oppervlakken exposen.
  Huidige gebundelde voorbeelden:
  - Slack houdt native goedkeuringsrouting beschikbaar voor zowel exec- als plugin-id's.
  - Matrix houdt dezelfde native DM-/kanaalrouting en reactie-UX voor exec-
    en plugingoedkeuringen, terwijl auth nog steeds per goedkeuringssoort kan verschillen.
- `createApproverRestrictedNativeApprovalAdapter` bestaat nog steeds als compatibiliteitswrapper, maar nieuwe code moet de capability builder verkiezen en `approvalCapability` op de plugin exposen.

Voor hot kanaalentrypoints moet je de smallere runtime-subpaden verkiezen wanneer je slechts
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

Verkies op dezelfde manier `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` en
`openclaw/plugin-sdk/reply-chunking` wanneer je het bredere parapluoppervlak
niet nodig hebt.

Specifiek voor setup:

- `openclaw/plugin-sdk/setup-runtime` dekt de runtime-veilige setuphelpers:
  importveilige setup-patchadapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note-uitvoer,
  `promptResolvedAllowFrom`, `splitSetupEntries` en de gedelegeerde
  setup-proxybuilders
- `openclaw/plugin-sdk/setup-adapter-runtime` is de smalle env-bewuste adapter-
  seam voor `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` dekt de optionele-installatie-setup
  builders plus een paar setup-veilige primitieven:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Als je kanaal env-gedreven setup of auth ondersteunt en generieke opstart-/configuratieflows
die env-namen moeten kennen voordat runtime laadt, declareer ze dan in het
pluginmanifest met `channelEnvVars`. Houd runtime-`envVars` van het kanaal of lokale
constanten alleen voor operatorgerichte tekst.

Als je kanaal kan verschijnen in `status`, `channels list`, `channels status` of
SecretRef-scans voordat de Plugin-runtime start, voeg dan `openclaw.setupEntry` toe in
`package.json`. Dat entrypoint moet veilig te importeren zijn in alleen-lezen commandopaden
en moet de kanaalmetadata, setup-veilige configuratie-adapter, statusadapter
en metadata voor kanaalgeheimdoelen retourneren die nodig zijn voor die samenvattingen. Start geen
clients, listeners of transportruntimes vanuit de setup-entry.

Houd ook het importpad van de hoofdentry voor het kanaal smal. Discovery kan de
entry en de kanaalpluginmodule evalueren om capabilities te registreren zonder
het kanaal te activeren. Bestanden zoals `channel-plugin-api.ts` moeten het kanaal-
pluginobject exporteren zonder setupwizards, transportclients, socketlisteners,
subprocesstarters of servicestartmodules te importeren. Plaats die runtime-
onderdelen in modules die worden geladen vanuit `registerFull(...)`, runtime-setters of luie
capability-adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` en
`splitSetupEntries`

- gebruik de bredere seam `openclaw/plugin-sdk/setup` alleen wanneer je ook de
  zwaardere gedeelde setup-/configuratiehelpers nodig hebt, zoals
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Als je kanaal alleen "installeer eerst deze Plugin" wil tonen in setup-
oppervlakken, geef dan de voorkeur aan `createOptionalChannelSetupSurface(...)`. De gegenereerde
adapter/wizard faalt gesloten bij configuratieschrijfacties en finalisatie, en hergebruikt
hetzelfde bericht dat installatie vereist is in validatie, finalisatie en docs-linktekst.

Voor andere hete kanaalpaden geef je de voorkeur aan de smalle helpers boven bredere legacy-
oppervlakken:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` en
  `openclaw/plugin-sdk/account-helpers` voor multi-accountconfiguratie en
  fallback naar default-account
- `openclaw/plugin-sdk/inbound-envelope` en
  `openclaw/plugin-sdk/inbound-reply-dispatch` voor inbound route/envelope en
  record-and-dispatch-bedrading
- `openclaw/plugin-sdk/messaging-targets` voor targetparsing/-matching
- `openclaw/plugin-sdk/outbound-media` en
  `openclaw/plugin-sdk/outbound-runtime` voor het laden van media plus outbound
  identity-/send-delegates en payloadplanning
- `buildThreadAwareOutboundSessionRoute(...)` uit
  `openclaw/plugin-sdk/channel-core` wanneer een outbound route een expliciete
  `replyToId`/`threadId` moet behouden of de huidige `:thread:`-sessie moet herstellen
  nadat de basissessiesleutel nog steeds overeenkomt. Provider-Plugins kunnen
  voorrang, suffixgedrag en normalisatie van thread-id's overschrijven wanneer hun platform
  native semantiek voor threadbezorging heeft.
- `openclaw/plugin-sdk/thread-bindings-runtime` voor de lifecycle van thread-bindings
  en adapterregistratie
- `openclaw/plugin-sdk/agent-media-payload` alleen wanneer een legacy agent-/media-
  payloadveldindeling nog vereist is
- `openclaw/plugin-sdk/telegram-command-config` voor normalisatie van aangepaste Telegram-
  commando's, validatie van duplicaten/conflicten en een fallback-stabiel command
  config-contract

Kanalen die alleen auth gebruiken, kunnen meestal stoppen bij het standaardpad: core handelt approvals af en de Plugin stelt alleen outbound-/auth-capabilities beschikbaar. Native approval-kanalen zoals Matrix, Slack, Telegram en aangepaste chattransports moeten de gedeelde native helpers gebruiken in plaats van hun eigen approval-lifecycle te bouwen.

## Inbound-vermeldingsbeleid

Houd inbound-vermeldingsafhandeling gesplitst in twee lagen:

- bewijsverzameling in eigendom van de Plugin
- gedeelde beleidsevaluatie

Gebruik `openclaw/plugin-sdk/channel-mention-gating` voor beslissingen over vermeldingsbeleid.
Gebruik `openclaw/plugin-sdk/channel-inbound` alleen wanneer je de bredere inbound
helperbarrel nodig hebt.

Goede plek voor plugin-lokale logica:

- reply-to-bot-detectie
- quoted-bot-detectie
- controles op threaddeelname
- uitsluitingen voor service-/systeemberichten
- platform-native caches die nodig zijn om botdeelname te bewijzen

Goede plek voor de gedeelde helper:

- `requireMention`
- expliciet vermeldingsresultaat
- allowlist voor impliciete vermeldingen
- command-bypass
- definitieve oversla-beslissing

Voorkeursflow:

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
gebundelde kanaal-Plugins die al afhankelijk zijn van runtime-injectie:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Als je alleen `implicitMentionKindWhen` en
`resolveInboundMentionDecision` nodig hebt, importeer dan uit
`openclaw/plugin-sdk/channel-mention-gating` om te voorkomen dat niet-gerelateerde inbound
runtimehelpers worden geladen.

De oudere `resolveMentionGating*`-helpers blijven beschikbaar op
`openclaw/plugin-sdk/channel-inbound` uitsluitend als compatibiliteitsexports. Nieuwe code
moet `resolveInboundMentionDecision({ facts, policy })` gebruiken.

## Doorloop

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Maak de standaard Plugin-bestanden. Het veld `channel` in `package.json` is
    wat dit een kanaal-Plugin maakt. Zie voor het volledige oppervlak voor pakketmetadata
    [Plugin Setup and Config](/nl/plugins/sdk-setup#openclaw-channel):

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
    plugin-eigen instellingen die niet de kanaalaccountconfiguratie zijn. `channelConfigs`
    valideert `channels.acme-chat` en is de cold-path-bron die door configuratie-
    schema, setup en UI-oppervlakken wordt gebruikt voordat de Plugin-runtime laadt.

  </Step>

  <Step title="Build the channel plugin object">
    De interface `ChannelPlugin` heeft veel optionele adapteroppervlakken. Begin met
    het minimum — `id` en `setup` — en voeg adapters toe wanneer je ze nodig hebt.

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

    Gebruik voor kanalen die zowel canonieke DM-sleutels op topniveau als legacy geneste sleutels accepteren de helpers uit `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` en `normalizeChannelDmPolicy` houden account-lokale waarden vóór geërfde rootwaarden. Combineer dezelfde resolver met doctor-reparatie via `normalizeLegacyDmAliases`, zodat runtime en migratie hetzelfde contract lezen.

    <Accordion title="What createChatChannelPlugin does for you">
      In plaats van low-level adapterinterfaces handmatig te implementeren, geef je
      declaratieve opties door en stelt de builder ze samen:

      | Optie | Wat het bedraadt |
      | --- | --- |
      | `security.dm` | Gescopeerde DM-beveiligingsresolver uit configuratievelden |
      | `pairing.text` | Tekstgebaseerde DM-pairingflow met code-uitwisseling |
      | `threading` | Reply-to-mode-resolver (vast, account-gescopeerd of aangepast) |
      | `outbound.attachedResults` | Send-functies die resultaatmetadata retourneren (bericht-ID's) |

      Je kunt ook ruwe adapterobjecten doorgeven in plaats van de declaratieve opties
      als je volledige controle nodig hebt.

      Raw uitgaande adapters mogen een functie `chunker(text, limit, ctx)` definiëren.
      De optionele `ctx.formatting` bevat formatteringsbeslissingen op bezorgtijdstip
      zoals `maxLinesPerMessage`; pas die toe vóór het verzenden, zodat antwoordthreading
      en chunkgrenzen één keer worden opgelost door de gedeelde uitgaande bezorging.
      Verzendcontexten bevatten ook `replyToIdSource` (`implicit` of `explicit`)
      wanneer een native antwoorddoel is opgelost, zodat payloadhelpers expliciete
      antwoordtags kunnen behouden zonder een impliciete eenmalige antwoordslot te gebruiken.
    </Accordion>

  </Step>

  <Step title="Koppel het entrypoint">
    Maak `index.ts` aan:

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
    ze kan tonen in de root-help zonder de volledige kanaalruntime te activeren,
    terwijl normale volledige loads nog steeds dezelfde descriptors oppakken voor echte commandoregistratie.
    Houd `registerFull(...)` voor werk dat alleen bij runtime hoort.
    Als `registerFull(...)` Gateway-RPC-methoden registreert, gebruik dan een
    Plugin-specifiek prefix. Core-beheernamespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd
    omgezet naar `operator.admin`.
    `defineChannelPluginEntry` handelt de splitsing van registratiemodus automatisch af. Zie
    [Entrypoints](/nl/plugins/sdk-entrypoints#definechannelpluginentry) voor alle
    opties.

  </Step>

  <Step title="Voeg een setup-entry toe">
    Maak `setup-entry.ts` aan voor lichtgewicht laden tijdens onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw laadt dit in plaats van de volledige entry wanneer het kanaal is uitgeschakeld
    of niet is geconfigureerd. Dit voorkomt dat zware runtimecode wordt geladen tijdens setupflows.
    Zie [Setup en Config](/nl/plugins/sdk-setup#setup-entry) voor details.

    Gebundelde werkruimtekanelen die setup-veilige exports opsplitsen in sidecar-modules
    kunnen `defineBundledChannelSetupEntry(...)` uit
    `openclaw/plugin-sdk/channel-entry-contract` gebruiken wanneer ze ook een
    expliciete runtime-setter voor setuptijd nodig hebben.

  </Step>

  <Step title="Verwerk inkomende berichten">
    Je Plugin moet berichten van het platform ontvangen en ze doorsturen naar
    OpenClaw. Het gebruikelijke patroon is een Webhook die het verzoek verifieert en
    het doorstuurt via de inkomende handler van je kanaal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      Verwerking van inkomende berichten is kanaalspecifiek. Elke kanaal-Plugin bezit
      zijn eigen inkomende pipeline. Bekijk gebundelde kanaal-Plugins
      (bijvoorbeeld het Microsoft Teams- of Google Chat-Plugin-pakket) voor echte patronen.
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
  <Card title="Threadingopties" icon="git-branch" href="/nl/plugins/sdk-entrypoints#registration-mode">
    Vaste, account-gescopeerde of aangepaste antwoordmodi
  </Card>
  <Card title="Integratie van berichtentool" icon="puzzle" href="/nl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool en actiedetectie
  </Card>
  <Card title="Doelresolutie" icon="crosshair" href="/nl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtimehelpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, STT, media, subagent via api.runtime
  </Card>
</CardGroup>

<Note>
Sommige gebundelde helperseams bestaan nog steeds voor onderhoud en
compatibiliteit van gebundelde Plugins. Ze zijn niet het aanbevolen patroon voor nieuwe kanaal-Plugins;
gebruik liever de generieke subpaden voor kanaal/setup/antwoord/runtime uit het gemeenschappelijke SDK-oppervlak,
tenzij je die gebundelde Plugin-familie rechtstreeks onderhoudt.
</Note>

## Volgende stappen

- [Provider-Plugins](/nl/plugins/sdk-provider-plugins) — als je Plugin ook modellen levert
- [SDK-overzicht](/nl/plugins/sdk-overview) — volledige referentie voor subpath-imports
- [SDK-testen](/nl/plugins/sdk-testing) — testhulpprogramma's en contracttests
- [Plugin-manifest](/nl/plugins/manifest) — volledig manifestschema

## Gerelateerd

- [Plugin-SDK-setup](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Agent-harness-Plugins](/nl/plugins/sdk-agent-harness)
