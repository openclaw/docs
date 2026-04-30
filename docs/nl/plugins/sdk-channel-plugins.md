---
read_when:
    - Je bouwt een nieuwe Plugin voor een berichtenkanaal
    - Je wilt OpenClaw verbinden met een berichtenplatform
    - Je moet de ChannelPlugin-adapterinterface begrijpen
sidebarTitle: Channel Plugins
summary: Stapsgewijze handleiding voor het bouwen van een Plugin voor een berichtenkanaal voor OpenClaw
title: Kanaalplugins bouwen
x-i18n:
    generated_at: "2026-04-30T09:39:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Deze handleiding laat zien hoe je een kanaalplugin bouwt die OpenClaw met een
berichtenplatform verbindt. Aan het einde heb je een werkend kanaal met DM-beveiliging,
koppeling, antwoordthreads en uitgaande berichten.

<Info>
  Als je nog niet eerder een OpenClaw-plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basispakketstructuur
  en manifestconfiguratie.
</Info>

## Hoe kanaalplugins werken

Kanaalplugins hebben geen eigen tools voor verzenden/bewerken/reageren nodig. OpenClaw behoudt één
gedeelde `message`-tool in core. Je plugin beheert:

- **Configuratie** — accountresolutie en installatiewizard
- **Beveiliging** — DM-beleid en allowlists
- **Koppeling** — DM-goedkeuringsflow
- **Sessigrammatica** — hoe providerspecifieke gespreks-id's worden gekoppeld aan basischats, thread-id's en bovenliggende fallbacks
- **Uitgaand** — tekst, media en polls naar het platform verzenden
- **Threading** — hoe antwoorden in threads worden geplaatst
- **Heartbeat-typen** — optionele typ-/bezig-signalen voor Heartbeat-bezorgdoelen

Core beheert de gedeelde berichtentool, promptkoppeling, de buitenste sessiesleutelvorm,
generieke `:thread:`-boekhouding en dispatch.

Als je kanaal type-indicatoren buiten inkomende antwoorden ondersteunt, exposeer dan
`heartbeat.sendTyping(...)` op de kanaalplugin. Core roept dit aan met het
opgeloste Heartbeat-bezorgdoel voordat de Heartbeat-modelrun start en
gebruikt de gedeelde levenscyclus voor typing-keepalive/-opschoning. Voeg `heartbeat.clearTyping(...)`
toe wanneer het platform een expliciet stopsignaal nodig heeft.

Als je kanaal message-tool-parameters toevoegt die mediabronnen dragen, exposeer die
parameternamen dan via `describeMessageTool(...).mediaSourceParams`. Core gebruikt
die expliciete lijst voor normalisatie van sandboxpaden en beleid voor uitgaande mediatoegang,
zodat plugins geen gedeelde-core special cases nodig hebben voor providerspecifieke
avatar-, bijlage- of coverafbeeldingsparameters.
Geef bij voorkeur een op actie gebaseerde map terug, zoals
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, zodat niet-gerelateerde acties
niet de media-argumenten van een andere actie erven. Een platte array werkt nog steeds voor parameters die
bewust door elke geëxposeerde actie worden gedeeld.

Als je platform extra scope opslaat in gespreks-id's, houd die parsing dan
in de plugin met `messaging.resolveSessionConversation(...)`. Dat is de
canonieke hook voor het koppelen van `rawId` aan de basisgespreks-id, optionele thread-
id, expliciete `baseConversationId` en eventuele `parentConversationCandidates`.
Wanneer je `parentConversationCandidates` teruggeeft, houd ze dan geordend van de
smalste parent naar het breedste/basisgesprek.

Gebruik `openclaw/plugin-sdk/channel-route` wanneer plugincode route-achtige velden moet normaliseren,
een child-thread met de parent-route moet vergelijken, of een
stabiele dedupe-sleutel moet bouwen uit `{ channel, to, accountId, threadId }`. De helper
normaliseert numerieke thread-id's op dezelfde manier als core, dus plugins geven hieraan de voorkeur
boven ad-hoc `String(threadId)`-vergelijkingen.
Plugins met providerspecifieke doelgrammatica kunnen hun parser injecteren in
`resolveChannelRouteTargetWithParser(...)` en toch dezelfde routedoelevorm
en thread-fallbacksemantiek krijgen die core gebruikt.

Gebundelde plugins die dezelfde parsing nodig hebben voordat het kanaalregister opstart,
kunnen ook een top-level `session-key-api.ts`-bestand exposen met een bijpassende
`resolveSessionConversation(...)`-export. Core gebruikt dat bootstrap-veilige oppervlak
alleen wanneer het runtime-pluginregister nog niet beschikbaar is.

`messaging.resolveParentConversationCandidates(...)` blijft beschikbaar als
legacy compatibiliteitsfallback wanneer een plugin alleen parent-fallbacks nodig heeft boven op
de generieke/ruwe id. Als beide hooks bestaan, gebruikt core eerst
`resolveSessionConversation(...).parentConversationCandidates` en valt alleen
terug op `resolveParentConversationCandidates(...)` wanneer de canonieke hook
ze weglaat.

## Goedkeuringen en kanaalcapaciteiten

De meeste kanaalplugins hebben geen goedkeuringsspecifieke code nodig.

- Core beheert same-chat `/approve`, gedeelde payloads voor goedkeuringsknoppen en generieke fallbackbezorging.
- Geef de voorkeur aan één `approvalCapability`-object op de kanaalplugin wanneer het kanaal goedkeuringsspecifiek gedrag nodig heeft.
- `ChannelPlugin.approvals` is verwijderd. Zet feiten over goedkeuringsbezorging/native/render/auth op `approvalCapability`.
- `plugin.auth` is alleen login/logout; core leest geen goedkeuringsauth-hooks meer uit dat object.
- `approvalCapability.authorizeActorAction` en `approvalCapability.getActionAvailabilityState` zijn de canonieke seam voor goedkeuringsauth.
- Gebruik `approvalCapability.getActionAvailabilityState` voor beschikbaarheid van same-chat-goedkeuringsauth.
- Als je kanaal native exec-goedkeuringen exposeert, gebruik dan `approvalCapability.getExecInitiatingSurfaceState` voor de initiërende-surface-/native-clientstatus wanneer die verschilt van same-chat-goedkeuringsauth. Core gebruikt die exec-specifieke hook om `enabled` van `disabled` te onderscheiden, te bepalen of het initiërende kanaal native exec-goedkeuringen ondersteunt, en het kanaal op te nemen in fallbackbegeleiding voor native clients. `createApproverRestrictedNativeApprovalCapability(...)` vult dit in voor het gebruikelijke geval.
- Gebruik `outbound.shouldSuppressLocalPayloadPrompt` of `outbound.beforeDeliverPayload` voor kanaalspecifiek payloadlevenscyclusgedrag, zoals het verbergen van dubbele lokale goedkeuringsprompts of het verzenden van type-indicatoren vóór bezorging.
- Gebruik `approvalCapability.delivery` alleen voor native goedkeuringsroutering of fallbackonderdrukking.
- Gebruik `approvalCapability.nativeRuntime` voor kanaalbeheerde native goedkeuringsfeiten. Houd het lazy op drukke kanaalentrypoints met `createLazyChannelApprovalNativeRuntimeAdapter(...)`, dat je runtimemodule op aanvraag kan importeren terwijl core nog steeds de goedkeuringslevenscyclus kan samenstellen.
- Gebruik `approvalCapability.render` alleen wanneer een kanaal echt aangepaste goedkeuringspayloads nodig heeft in plaats van de gedeelde renderer.
- Gebruik `approvalCapability.describeExecApprovalSetup` wanneer het kanaal wil dat het antwoord voor het uitgeschakelde pad uitlegt welke exacte configuratieknoppen nodig zijn om native exec-goedkeuringen in te schakelen. De hook ontvangt `{ channel, channelLabel, accountId }`; named-account-kanalen moeten accountgescopeerde paden renderen, zoals `channels.<channel>.accounts.<id>.execApprovals.*`, in plaats van top-level defaults.
- Als een kanaal stabiele eigenaarachtige DM-identiteiten kan afleiden uit bestaande configuratie, gebruik dan `createResolvedApproverActionAuthAdapter` uit `openclaw/plugin-sdk/approval-runtime` om same-chat `/approve` te beperken zonder goedkeuringsspecifieke core-logica toe te voegen.
- Als een kanaal native goedkeuringsbezorging nodig heeft, houd kanaalcode dan gericht op doelnormalisatie plus transport-/presentatiefeiten. Gebruik `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` en `createApproverRestrictedNativeApprovalCapability` uit `openclaw/plugin-sdk/approval-runtime`. Zet de kanaalspecifieke feiten achter `approvalCapability.nativeRuntime`, idealiter via `createChannelApprovalNativeRuntimeAdapter(...)` of `createLazyChannelApprovalNativeRuntimeAdapter(...)`, zodat core de handler kan samenstellen en requestfiltering, routering, dedupe, verval, Gateway-subscriptie en meldingen over elders-gerouteerd kan beheren. `nativeRuntime` is opgesplitst in enkele kleinere seams:
- `createChannelNativeOriginTargetResolver` gebruikt standaard de gedeelde channel-route-matcher voor `{ to, accountId, threadId }`-doelen. Geef `targetsMatch` alleen door wanneer een kanaal providerspecifieke equivalentieregels heeft, zoals Slack-timestamp-prefixmatching.
- Geef `normalizeTargetForMatch` door aan `createChannelNativeOriginTargetResolver` wanneer het kanaal provider-id's moet canonicaliseren voordat de standaard routematcher of een aangepaste `targetsMatch`-callback draait, terwijl het oorspronkelijke doel voor bezorging behouden blijft. Gebruik `normalizeTarget` alleen wanneer het opgeloste bezorgdoel zelf moet worden gecanonicaliseerd.
- `availability` — of het account is geconfigureerd en of een request moet worden afgehandeld
- `presentation` — koppel het gedeelde goedkeuringsviewmodel aan native payloads of eindacties voor pending/resolved/expired
- `transport` — bereid doelen voor en verzend/update/verwijder native goedkeuringsberichten
- `interactions` — optionele bind-/unbind-/clear-action-hooks voor native knoppen of reacties
- `observe` — optionele hooks voor bezorgdiagnostiek
- Als het kanaal runtimebeheerde objecten nodig heeft, zoals een client, token, Bolt-app of webhookontvanger, registreer ze dan via `openclaw/plugin-sdk/channel-runtime-context`. Het generieke runtime-contextregister laat core capability-gedreven handlers bootstrappen vanuit kanaalopstartstatus zonder goedkeuringsspecifieke wrapperlijm toe te voegen.
- Grijp alleen naar de lower-level `createChannelApprovalHandler` of `createChannelNativeApprovalRuntime` wanneer de capability-gedreven seam nog niet expressief genoeg is.
- Native goedkeuringskanalen moeten zowel `accountId` als `approvalKind` via die helpers routeren. `accountId` houdt multi-account-goedkeuringsbeleid gescopeerd naar het juiste botaccount, en `approvalKind` houdt exec- versus plugingoedkeuringsgedrag beschikbaar voor het kanaal zonder hardcoded branches in core.
- Core beheert nu ook goedkeuringsreroutemeldingen. Kanaalplugins moeten niet hun eigen vervolgberichten "goedkeuring ging naar DM's / een ander kanaal" verzenden vanuit `createChannelNativeApprovalRuntime`; exposeer in plaats daarvan accurate origin- en approver-DM-routering via de gedeelde approval-capability-helpers en laat core daadwerkelijke bezorgingen aggregeren voordat een melding wordt teruggeplaatst naar de initiërende chat.
- Behoud het soort afgeleverde goedkeurings-id end-to-end. Native clients mogen exec- versus plugingoedkeuringsroutering niet
  raden of herschrijven vanuit kanaallokale status.
- Verschillende goedkeuringssoorten kunnen bewust verschillende native surfaces exposen.
  Huidige gebundelde voorbeelden:
  - Slack houdt native goedkeuringsroutering beschikbaar voor zowel exec- als plugin-id's.
  - Matrix houdt dezelfde native DM-/kanaalroutering en reactie-UX voor exec-
    en plugingoedkeuringen, terwijl auth nog steeds per goedkeuringssoort kan verschillen.
- `createApproverRestrictedNativeApprovalAdapter` bestaat nog steeds als compatibiliteitswrapper, maar nieuwe code geeft de voorkeur aan de capability builder en exposeert `approvalCapability` op de plugin.

Voor drukke kanaalentrypoints geef je de voorkeur aan de smallere runtime-subpaden wanneer je slechts
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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` en
`openclaw/plugin-sdk/reply-chunking` wanneer je het bredere overkoepelende
oppervlak niet nodig hebt.

Specifiek voor setup:

- `openclaw/plugin-sdk/setup-runtime` dekt de runtime-veilige setuphelpers:
  import-veilige setup-patchadapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note-output,
  `promptResolvedAllowFrom`, `splitSetupEntries` en de gedelegeerde
  setup-proxybuilders
- `openclaw/plugin-sdk/setup-adapter-runtime` is de smalle env-aware adapter-
  seam voor `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` dekt de optional-install setup-
  builders plus enkele setup-veilige primitives:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Als je kanaal env-gedreven setup of auth ondersteunt en generieke startup-/config-
flows die env-namen moeten kennen voordat runtime laadt, declareer ze dan in het
pluginmanifest met `channelEnvVars`. Houd kanaalruntime `envVars` of lokale
constanten alleen voor operatorgerichte tekst.

Als je kanaal kan verschijnen in `status`, `channels list`, `channels status` of
SecretRef-scans voordat de Plugin-runtime start, voeg dan `openclaw.setupEntry` toe in
`package.json`. Dat entrypoint moet veilig te importeren zijn in alleen-lezen commandopaden
en moet de kanaalmetadata, setup-veilige config-adapter, statusadapter
en metadata voor kanaalgeheimdoelen retourneren die nodig zijn voor die samenvattingen. Start geen
clients, listeners of transportruntimes vanuit de setup-entry.

Houd ook het importpad van de hoofdkanaal-entry smal. Discovery kan de
entry en de kanaalpluginmodule evalueren om capabilities te registreren zonder het
kanaal te activeren. Bestanden zoals `channel-plugin-api.ts` moeten het kanaalpluginobject
exporteren zonder setupwizards, transportclients, socketlisteners,
subprocess-launchers of servicestartmodules te importeren. Plaats die runtimeonderdelen
in modules die worden geladen vanuit `registerFull(...)`, runtime-setters of luie
capability-adapters.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` en
`splitSetupEntries`

- gebruik de bredere seam `openclaw/plugin-sdk/setup` alleen wanneer je ook de
  zwaardere gedeelde setup-/confighelpers nodig hebt, zoals
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Als je kanaal alleen "installeer eerst deze Plugin" wil tonen in setupoppervlakken,
geef dan de voorkeur aan `createOptionalChannelSetupSurface(...)`. De gegenereerde
adapter/wizard faalt gesloten bij config-writes en finalisatie, en hergebruikt
hetzelfde installatievereiste bericht voor validatie, finalisatie en docs-linkcopy.

Voor andere hete kanaalpaden geef je de voorkeur aan de smalle helpers boven bredere legacy
oppervlakken:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` en
  `openclaw/plugin-sdk/account-helpers` voor multi-accountconfig en
  fallback naar het standaardaccount
- `openclaw/plugin-sdk/inbound-envelope` en
  `openclaw/plugin-sdk/inbound-reply-dispatch` voor inbound route/envelope en
  record-and-dispatch-bedrading
- `openclaw/plugin-sdk/messaging-targets` voor targetparsing/-matching
- `openclaw/plugin-sdk/outbound-media` en
  `openclaw/plugin-sdk/outbound-runtime` voor medialaden plus outbound
  identity-/send-delegates en payloadplanning
- `buildThreadAwareOutboundSessionRoute(...)` uit
  `openclaw/plugin-sdk/channel-core` wanneer een outbound route een expliciete
  `replyToId`/`threadId` moet behouden of de huidige `:thread:`-sessie moet herstellen
  nadat de basissessiesleutel nog steeds overeenkomt. Providerplugins kunnen
  prioriteit, suffixgedrag en thread-id-normalisatie overschrijven wanneer hun platform
  native threadleveringssemantiek heeft.
- `openclaw/plugin-sdk/thread-bindings-runtime` voor de levenscyclus van threadbindings
  en adapterregistratie
- `openclaw/plugin-sdk/agent-media-payload` alleen wanneer een legacy agent/media
  payloadveldindeling nog vereist is
- `openclaw/plugin-sdk/telegram-command-config` voor Telegram custom-command
  normalisatie, validatie van duplicaten/conflicten en een fallback-stabiel command
  configcontract

Auth-only kanalen kunnen meestal bij het standaardpad stoppen: core handelt goedkeuringen af en de Plugin stelt alleen outbound/auth-capabilities beschikbaar. Native goedkeuringskanalen zoals Matrix, Slack, Telegram en aangepaste chattransports moeten de gedeelde native helpers gebruiken in plaats van hun eigen goedkeuringslevenscyclus te bouwen.

## Inbound vermeldingsbeleid

Houd inbound vermeldingsafhandeling gesplitst in twee lagen:

- door de Plugin beheerde bewijsverzameling
- gedeelde beleidsevaluatie

Gebruik `openclaw/plugin-sdk/channel-mention-gating` voor beslissingen over vermeldingsbeleid.
Gebruik `openclaw/plugin-sdk/channel-inbound` alleen wanneer je de bredere inbound
helperbarrel nodig hebt.

Goede match voor pluginlokale logica:

- detectie van antwoorden aan de bot
- detectie van geciteerde bot
- thread-deelnamechecks
- uitsluitingen voor service-/systeemberichten
- platform-native caches die nodig zijn om botdeelname te bewijzen

Goede match voor de gedeelde helper:

- `requireMention`
- expliciet vermeldingsresultaat
- allowlist voor impliciete vermeldingen
- command-bypass
- uiteindelijke skipbeslissing

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
gebundelde kanaalplugins die al afhankelijk zijn van runtime-injectie:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Als je alleen `implicitMentionKindWhen` en
`resolveInboundMentionDecision` nodig hebt, importeer dan uit
`openclaw/plugin-sdk/channel-mention-gating` om te voorkomen dat niet-gerelateerde inbound
runtimehelpers worden geladen.

De oudere `resolveMentionGating*`-helpers blijven op
`openclaw/plugin-sdk/channel-inbound` staan, uitsluitend als compatibiliteitsexports. Nieuwe code
moet `resolveInboundMentionDecision({ facts, policy })` gebruiken.

## Doorloop

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Maak de standaard Plugin-bestanden. Het veld `channel` in `package.json` is
    wat dit een kanaalplugin maakt. Zie [Plugin Setup and Config](/nl/plugins/sdk-setup#openclaw-channel)
    voor het volledige pakketmetadata-oppervlak:

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

    `configSchema` valideert `plugins.entries.acme-chat.config`. Gebruik het voor
    pluginbeheerde instellingen die niet de kanaalaccountconfig zijn. `channelConfigs`
    valideert `channels.acme-chat` en is de cold-path-bron die door configschema,
    setup en UI-oppervlakken wordt gebruikt voordat de Plugin-runtime laadt.

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

    Voor kanalen die zowel canonieke top-level DM-sleutels als legacy geneste sleutels accepteren, gebruik je de helpers uit `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` en `normalizeChannelDmPolicy` houden accountlokale waarden vóór overgeërfde rootwaarden. Combineer dezelfde resolver met doctor-reparatie via `normalizeLegacyDmAliases` zodat runtime en migratie hetzelfde contract lezen.

    <Accordion title="What createChatChannelPlugin does for you">
      In plaats van low-level adapterinterfaces handmatig te implementeren, geef je
      declaratieve opties door en stelt de builder ze samen:

      | Optie | Wat het bedraadt |
      | --- | --- |
      | `security.dm` | Scoped DM-beveiligingsresolver uit configvelden |
      | `pairing.text` | Tekstgebaseerde DM-pairingflow met code-uitwisseling |
      | `threading` | Reply-to-modusresolver (vast, account-scoped of aangepast) |
      | `outbound.attachedResults` | Verzendfuncties die resultaatmetadata retourneren (bericht-ID's) |

      Je kunt ook ruwe adapterobjecten doorgeven in plaats van de declaratieve opties
      als je volledige controle nodig hebt.

      Ruwe uitgaande adapters kunnen een functie `chunker(text, limit, ctx)` definiëren.
      De optionele `ctx.formatting` bevat beslissingen over opmaak op bezorgtijdstip,
      zoals `maxLinesPerMessage`; pas dit toe vóór het verzenden, zodat reply-threading
      en chunkgrenzen één keer worden opgelost door gedeelde uitgaande bezorging.
      Verzendcontexten bevatten ook `replyToIdSource` (`implicit` of `explicit`)
      wanneer een native reply-doel is opgelost, zodat payload-helpers expliciete
      reply-tags kunnen behouden zonder een impliciet, eenmalig reply-slot te verbruiken.
    </Accordion>

  </Step>

  <Step title="Verbind het entrypoint">
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

    Plaats CLI-descriptors die eigendom zijn van het kanaal in `registerCliMetadata(...)`,
    zodat OpenClaw ze in de root-help kan tonen zonder de volledige runtime van het kanaal
    te activeren, terwijl normale volledige loads nog steeds dezelfde descriptors oppikken
    voor echte commandoregistratie. Houd `registerFull(...)` voor werk dat alleen runtime is.
    Als `registerFull(...)` Gateway-RPC-methoden registreert, gebruik dan een
    plugin-specifiek prefix. Core-beheerdersnamespaces (`config.*`,
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
    of niet is geconfigureerd. Dit voorkomt dat zware runtime-code wordt geladen tijdens
    setup-flows. Zie [Setup en configuratie](/nl/plugins/sdk-setup#setup-entry) voor details.

    Gebundelde workspace-kanalen die setup-veilige exports opsplitsen naar sidecar-modules
    kunnen `defineBundledChannelSetupEntry(...)` uit
    `openclaw/plugin-sdk/channel-entry-contract` gebruiken wanneer ze ook een
    expliciete runtime-setter voor setuptijd nodig hebben.

  </Step>

  <Step title="Verwerk inkomende berichten">
    Je plugin moet berichten van het platform ontvangen en doorsturen naar
    OpenClaw. Het typische patroon is een Webhook die het verzoek verifieert en
    het via de inkomende handler van je kanaal doorstuurt:

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
      Verwerking van inkomende berichten is kanaalspecifiek. Elke kanaalplugin is eigenaar
      van zijn eigen inkomende pipeline. Bekijk gebundelde kanaalplugins
      (bijvoorbeeld het pluginpakket voor Microsoft Teams of Google Chat) voor echte patronen.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Schrijf gecoloceerde tests in `src/channel.test.ts`:

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
  <Card title="Threading-opties" icon="git-branch" href="/nl/plugins/sdk-entrypoints#registration-mode">
    Vaste, account-scoped of aangepaste reply-modi
  </Card>
  <Card title="Integratie met berichtentools" icon="puzzle" href="/nl/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool en actiedetectie
  </Card>
  <Card title="Doelresolutie" icon="crosshair" href="/nl/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, STT, media, subagent via api.runtime
  </Card>
  <Card title="Kanaalturn-kernel" icon="bolt" href="/nl/plugins/sdk-channel-turn">
    Gedeelde levenscyclus van inkomende turns: opnemen, oplossen, vastleggen, doorsturen, afronden
  </Card>
</CardGroup>

<Note>
Sommige gebundelde helper-seams bestaan nog steeds voor onderhoud en
compatibiliteit van gebundelde plugins. Ze zijn niet het aanbevolen patroon voor nieuwe kanaalplugins;
gebruik liever de generieke subpaden voor kanaal/setup/reply/runtime uit het gemeenschappelijke SDK-
oppervlak, tenzij je die gebundelde pluginfamilie rechtstreeks onderhoudt.
</Note>

## Volgende stappen

- [Providerplugins](/nl/plugins/sdk-provider-plugins) — als je plugin ook modellen levert
- [SDK-overzicht](/nl/plugins/sdk-overview) — volledige subpath-importreferentie
- [SDK-testen](/nl/plugins/sdk-testing) — testhulpprogramma's en contracttests
- [Plugin-manifest](/nl/plugins/manifest) — volledig manifestschema

## Gerelateerd

- [Plugin-SDK-setup](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Agent-harnessplugins](/nl/plugins/sdk-agent-harness)
