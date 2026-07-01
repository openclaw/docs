---
read_when:
    - De juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Audit van subpaden van gebundelde Plugins en helper-interfaces
summary: 'Plugin SDK-subpadcatalogus: welke imports waar staan, gegroepeerd per gebied'
title: Plugin-SDK-subpaden
x-i18n:
    generated_at: "2026-07-01T08:17:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

De Plugin SDK wordt beschikbaar gesteld als een set smalle openbare subpaden onder
`openclaw/plugin-sdk/`. Deze pagina catalogiseert de veelgebruikte subpaden,
gegroepeerd op doel. De gegenereerde inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports zijn de openbare subset
na aftrek van repo-lokale test-/interne subpaden die zijn vermeld in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Beheerders kunnen het
aantal openbare exports controleren met `pnpm plugin-sdk:surface` en actieve
gereserveerde helper-subpaden met `pnpm plugins:boundary-report:summary`;
ongebruikte gereserveerde helper-exports laten het CI-rapport falen in plaats van
als slapende compatibiliteitsschuld in de openbare SDK te blijven.

Zie voor de handleiding voor het schrijven van Plugins het [overzicht van de Plugin SDK](/nl/plugins/sdk-overview).

## Plugin-entry

| Subpad                         | Belangrijkste exports                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers voor migratieprovider-items zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactietools en `summarizeMigrationItems`                    |
| `plugin-sdk/migration-runtime` | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                    |
| `plugin-sdk/health`            | Registratie, detectie, reparatie, selectie, ernst en finding-typen voor doctor-health-checks voor gebundelde health-consumers                                          |

### Verouderde compatibiliteits- en testhelpers

Verouderde subpaden blijven geëxporteerd voor oudere Plugins, maar nieuwe code
moet de gerichte SDK-subpaden hieronder gebruiken. De onderhouden lijst is
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI weigert gebundelde
productie-imports daaruit. Brede barrels zoals `compat`, `config-types`,
`infra-runtime`, `text-runtime` en `zod` zijn alleen voor compatibiliteit. Importeer
`zod` rechtstreeks uit `zod`.

OpenClaw's door Vitest ondersteunde subpaden voor testhelpers zijn alleen
repo-lokaal en zijn geen package-exports meer: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` en `testing`.

### Gereserveerde helper-subpaden voor gebundelde Plugins

Deze subpaden zijn compatibiliteitsoppervlakken in eigendom van de Plugin voor de
eigenaar van de gebundelde Plugin, geen algemene SDK-API's:
`plugin-sdk/codex-mcp-projection` en `plugin-sdk/codex-native-task-runtime`.
Imports over eigenaarsgrenzen heen worden geblokkeerd door guardrails voor
package-contracten.

<AccordionGroup>
  <Accordion title="Kanaalsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Zod-schema-export voor root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Gecachete JSON Schema-validatiehulpfunctie voor door plugins beheerde schema's |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde hulpfuncties voor de installatiewizard, installatievertaler, allowlist-prompts en bouwers voor installatiestatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hulpfuncties voor multi-account-configuratie en actiegates, hulpfuncties voor terugval naar standaardaccount |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, hulpfuncties voor normalisatie van account-id's |
    | `plugin-sdk/account-resolution` | Hulpfuncties voor accountopzoeking en terugval naar standaard |
    | `plugin-sdk/account-helpers` | Gerichte hulpfuncties voor accountlijsten en accountacties |
    | `plugin-sdk/access-groups` | Hulpfuncties voor het parsen van access-group-allowlists en geredigeerde groepsdiagnostiek |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde primitieven voor kanaalconfiguratieschema's plus Zod- en directe JSON/TypeBox-bouwers |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Canonieke gebundelde/officiële chatkanaal-id's plus formatterlabels/-aliassen voor plugins die envelopvoorvoegseltekst moeten herkennen zonder hun eigen tabel hard te coderen. |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor gebundelde kanaalconfiguratieschema's |
    | `plugin-sdk/telegram-command-config` | Hulpfuncties voor normalisatie/validatie van aangepaste Telegram-opdrachten met terugval op het gebundelde contract |
    | `plugin-sdk/command-gating` | Gerichte hulpfuncties voor autorisatiegates voor opdrachten |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Verouderde low-level compatibiliteitsfacade voor kanaalingress. Nieuwe ontvangstpaden moeten `plugin-sdk/channel-ingress-runtime` gebruiken. |
    | `plugin-sdk/channel-ingress-runtime` | Experimentele high-level runtime-resolver voor kanaalingress en routefeitbouwers voor gemigreerde kanaalontvangstpaden. Geef hieraan de voorkeur boven het samenstellen van effectieve allowlists, opdracht-allowlists en legacy-projecties in elke plugin. Zie [Kanaalingress-API](/nl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contracten voor berichtlevenscyclus plus opties voor de antwoordpipeline, ontvangstbewijzen, livevoorbeeld/streaming, levenscyclus-hulpfuncties, outbound-identiteit, payloadplanning, duurzame verzendingen en hulpfuncties voor berichtverzendcontext. Zie [Kanaal-outbound-API](/nl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy-facades voor antwoorddispatch. |
    | `plugin-sdk/channel-message-runtime` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy-facades voor antwoorddispatch. |
    | `plugin-sdk/inbound-envelope` | Gedeelde hulpfuncties voor inbound-routes en envelopbouwers |
    | `plugin-sdk/inbound-reply-dispatch` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-inbound` voor inbound-runners en dispatch-predicaten, en `plugin-sdk/channel-outbound` voor hulpfuncties voor berichtlevering. |
    | `plugin-sdk/messaging-targets` | Verouderde alias voor doelparsing; gebruik `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gedeelde hulpfuncties voor outbound-medialading en hosted-media-status |
    | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Gerichte hulpfuncties voor pollnormalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Hulpfuncties voor levenscyclus en adapters van thread-bindingen |
    | `plugin-sdk/agent-media-payload` | Legacy-bouwer voor agent-mediapayloads |
    | `plugin-sdk/conversation-runtime` | Hulpfuncties voor conversatie-/thread-bindingen, koppeling en geconfigureerde bindingen |
    | `plugin-sdk/runtime-config-snapshot` | Hulpfunctie voor runtimeconfiguratie-snapshot |
    | `plugin-sdk/runtime-group-policy` | Hulpfuncties voor runtime-resolutie van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde hulpfuncties voor kanaalstatus-snapshots/-samenvattingen |
    | `plugin-sdk/channel-config-primitives` | Gerichte primitieven voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Hulpfuncties voor autorisatie van kanaalconfiguratieschrijfacties |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Hulpfuncties voor bewerken/lezen van allowlist-configuratie |
    | `plugin-sdk/group-access` | Gedeelde hulpfuncties voor beslissingen over groepstoegang |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Gerichte hulpfuncties voor direct-DM-guardbeleid vóór crypto |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en gevolgde eigenaarscompatibiliteit; nieuwe plugins moeten generieke subpaden van de kanaal-SDK gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor gevolgde eigenaarscompatibiliteit; nieuwe plugins moeten geïnjecteerde runtime-hulpfuncties of generieke subpaden van de kanaal-SDK gebruiken |
    | `plugin-sdk/zalouser` | Verouderde Zalo Personal-compatibiliteitsfacade voor gepubliceerde Lark/Zalo-pakketten die nog autorisatie voor afzenderopdrachten importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Semantische berichtpresentatie, levering en legacy-hulpfuncties voor interactieve antwoorden. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gedeelde inbound-hulpfuncties voor gebeurtenisclassificatie, contextopbouw, formattering, roots, debounce, mention-matching, mention-beleid en inbound-logging |
    | `plugin-sdk/channel-inbound-debounce` | Gerichte inbound-debounce-hulpfuncties |
    | `plugin-sdk/channel-mention-gating` | Gerichte hulpfuncties voor mention-beleid, mention-markeringen en mention-tekst zonder het bredere inbound-runtimeoppervlak |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound` of `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typen voor antwoordresultaten |
    | `plugin-sdk/channel-actions` | Hulpfuncties voor kanaalberichtacties, plus verouderde native schemahulpfuncties die voor plugincompatibiliteit behouden blijven |
    | `plugin-sdk/channel-route` | Gedeelde hulpfuncties voor routenormalisatie, parsergestuurde doelresolutie, stringificatie van thread-id's, dedupe/compacte routesleutels, geparste doeltypen en route-/doelvergelijking |
    | `plugin-sdk/channel-targets` | Hulpfuncties voor doelparsing; aanroepers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Typen voor kanaalcontracten |
    | `plugin-sdk/channel-feedback` | Koppeling van feedback/reacties |
    | `plugin-sdk/channel-secret-runtime` | Gerichte hulpfuncties voor secret-contracten zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en typen voor secret-doelen |
  </Accordion>

Verouderde kanaalhulpfunctiefamilies blijven alleen beschikbaar voor compatibiliteit
met gepubliceerde plugins. Het verwijderingsplan is: behoud ze gedurende het
migratievenster voor externe plugins, houd repo-/gebundelde plugins op
`channel-inbound` en `channel-outbound`, en verwijder daarna de compatibiliteitssubpaden
bij de volgende grote SDK-opschoning. Dit geldt voor de oude families voor
kanaalbericht/runtime, kanaalstreaming, direct-DM-toegang, afgesplitste
inbound-hulpfuncties, antwoordopties en koppelingspaden.

  <Accordion title="Provider-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor configuratie, catalogusdetectie en voorbereiding van runtime-modellen |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor standaardinstellingen van lokale servers, modeldetectie, requestheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Samengestelde helpers voor lokale/zelfgehoste providerconfiguratie |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele helpers voor zelfgehoste providerconfiguratie |
    | `plugin-sdk/cli-backend` | CLI-backendstandaarden + watchdogconstanten |
    | `plugin-sdk/provider-auth-runtime` | Runtimehelpers voor API-sleutelresolutie voor providerplugins |
    | `plugin-sdk/provider-oauth-runtime` | Generieke OAuth-callbacktypen voor providers, rendering van callbackpagina's, PKCE/statushelpers, parsing van autorisatie-invoer, helpers voor tokenverval en afbreekhelpers |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor API-sleutel-onboarding/profielschrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaard OAuth-auth-result-builder |
    | `plugin-sdk/provider-env-vars` | Helpers voor het opzoeken van provider-auth-env-vars |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex-auth-importhelpers, verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde replay-policy-builders, provider-endpointhelpers en gedeelde helpers voor normalisatie van model-id's |
    | `plugin-sdk/provider-catalog-live-runtime` | Live helpers voor providermodelcatalogi voor bewaakte `/models`-achtige detectie: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtering van model-id's, TTL-cache en statische fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtimehook voor uitbreiding van providercatalogi en plugin-providerregister-seams voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke helpers voor provider-HTTP/endpointmogelijkheden, provider-HTTP-fouten en multipart-formulierhelpers voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle contracthelpers voor web-fetch-configuratie/selectie, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Registratie-/cachehelpers voor web-fetch-providers |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle configuratie-/referentiehelpers voor webzoekopdrachten voor providers die geen plugin-enable-bedrading nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle contracthelpers voor webzoekconfiguratie/referenties, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped setters/getters voor referenties |
    | `plugin-sdk/provider-web-search` | Registratie-/cache-/runtimehelpers voor webzoekproviders |
    | `plugin-sdk/embedding-providers` | Algemene typen en leeshelpers voor embeddingproviders, inclusief `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` en `listEmbeddingProviders(...)`; plugins registreren providers via `api.registerEmbeddingProvider(...)` zodat manifesteigendom wordt afgedwongen |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en DeepSeek/Gemini/OpenAI-schemaopschoning + diagnostiek |
    | `plugin-sdk/provider-usage` | Typen voor momentopnamen van providergebruik, gedeelde helpers voor het ophalen van gebruik en providerfetchers zoals `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typen voor streamwrappers, plain-text tool-call-compatibiliteit en gedeelde Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-wrapperhelpers |
    | `plugin-sdk/provider-stream-shared` | Publieke gedeelde helpers voor providerstreamwrappers, inclusief `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` en Anthropic/DeepSeek/OpenAI-compatibele streamhulpprogramma's |
    | `plugin-sdk/provider-transport-runtime` | Native providertransporthelpers, zoals bewaakte fetch, tekstextractie uit toolresultaten, transportberichttransformaties en schrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor onboarding-configuratiepatches |
    | `plugin-sdk/global-singleton` | Proceslokale singleton-/map-/cachehelpers |
    | `plugin-sdk/group-activation` | Smalle helpers voor groepsactivatiemodi en commandoparsing |
  </Accordion>

Momentopnamen van providergebruik rapporteren normaal een of meer quota-`windows`, elk met
een label, gebruikt percentage en optionele resettijd. Providers die saldo- of
accountstatustekst blootstellen in plaats van resetbare quotavensters, moeten
`summary` met een lege `windows`-array retourneren in plaats van percentages te verzinnen.
OpenClaw toont die samenvattingstekst in statusuitvoer; gebruik `error` alleen wanneer het
gebruikseindpunt is mislukt of geen bruikbare gebruiksgegevens heeft geretourneerd.

  <Accordion title="Auth- en beveiligingssubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, commandoregisterhelpers inclusief dynamische argumentmenu-opmaak, helpers voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Builders voor commando-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeurderresolutie en actie-auth in dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Helpers voor native exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor goedkeuringsmogelijkheden/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde helper voor Gateway-resolutie van goedkeuringen |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor hot channel-entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-seams wanneer die voldoende zijn |
    | `plugin-sdk/approval-native-runtime` | Native goedkeuringsdoel, accountbinding, route-gate, forwarding-fallback en helpers voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded goedkeuringsreactiebindingen, payloads voor reactieverzoeken, stores voor reactiedoelen en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reply-runtime` | Helpers voor payloads van exec-/plugin-goedkeuringsantwoorden |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/plugin-goedkeuringspayloads, native goedkeuringsrouting-/runtimehelpers en helpers voor gestructureerde goedkeuringsweergave zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle resethelpers voor deduplicatie van inkomende antwoorden |
    | `plugin-sdk/channel-contract-testing` | Smalle helpers voor channel-contracttests zonder de brede testing-barrel |
    | `plugin-sdk/command-auth-native` | Native commando-auth, dynamische argumentmenu-opmaak en native sessiedoelhelpers |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor commandodetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht predicates voor commandotekst voor hot channel-paden |
    | `plugin-sdk/command-surface` | Helpers voor normalisatie van commandobody's en commandosurface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Smalle collectiehelpers voor secret-contracten voor channel-/plugin-secretoppervlakken |
    | `plugin-sdk/secret-ref-runtime` | Smalle `coerceSecretRef`- en SecretRef-typehelpers voor parsing van secret-contracten/configuratie |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef-providerintegratiemanifesten en presetcontracten voor plugins die externe secretproviderpresets publiceren |
    | `plugin-sdk/security-runtime` | Gedeelde helpers voor vertrouwen, DM-gating, root-begrensde bestanden/paden inclusief create-only writes, synchrone/asynchrone atomische bestandsvervanging, sibling-tempwrites, fallback voor verplaatsing tussen apparaten, private file-store-helpers, symlink-parent-guards, externe content, redactie van gevoelige tekst, constant-time secretvergelijking en secret-collectiehelpers |
    | `plugin-sdk/ssrf-policy` | Helpers voor hostallowlists en SSRF-beleid voor privénetwerken |
    | `plugin-sdk/ssrf-dispatcher` | Smalle helpers voor pinned-dispatchers zonder het brede infra-runtimeoppervlak |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-bewaakte fetch, SSRF-fout en SSRF-beleidshelpers |
    | `plugin-sdk/secret-input` | Helpers voor parsing van secretinvoer |
    | `plugin-sdk/webhook-ingress` | Webhook-request-/targethelpers en coercion van raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helpers voor bodygrootte/time-out van requests |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede runtime-/logging-/back-up-/plugin-installatiehulpfuncties |
    | `plugin-sdk/runtime-env` | Smalle hulpfuncties voor runtime-env, logger, timeout, opnieuw proberen en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde facade voor browserconfiguratie voor genormaliseerde profielen/standaardwaarden, CDP-URL-parsing en hulpfuncties voor browserbesturingsauthenticatie |
    | `plugin-sdk/agent-harness-task-runtime` | Generieke hulpfuncties voor taaklevenscyclus en voltooiingslevering voor harness-ondersteunde agents die een door de host uitgegeven taakbereik gebruiken |
    | `plugin-sdk/codex-mcp-projection` | Gereserveerde gebundelde Codex-hulpfunctie voor het projecteren van gebruikers-MCP-serverconfiguratie naar Codex-threadconfiguratie; niet voor plugins van derden |
    | `plugin-sdk/codex-native-task-runtime` | Private gebundelde Codex-hulpfunctie voor native task mirror-/runtime-bedrading; niet voor plugins van derden |
    | `plugin-sdk/channel-runtime-context` | Generieke hulpfuncties voor registratie en lookup van kanaal-runtimecontext |
    | `plugin-sdk/matrix` | Verouderde Matrix-compatibiliteitsfacade voor oudere kanaalpakketten van derden; nieuwe plugins moeten `plugin-sdk/run-command` rechtstreeks importeren |
    | `plugin-sdk/mattermost` | Verouderde Mattermost-compatibiliteitsfacade voor oudere kanaalpakketten van derden; nieuwe plugins moeten generieke SDK-subpaden rechtstreeks importeren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde hulpfuncties voor plugin-opdrachten, hooks, HTTP en interactieve functies |
    | `plugin-sdk/hook-runtime` | Gedeelde hulpfuncties voor Webhook/interne hook-pipelines |
    | `plugin-sdk/lazy-runtime` | Hulpfuncties voor lazy runtime-imports/-bindingen, zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hulpfuncties voor proces-exec |
    | `plugin-sdk/cli-runtime` | Hulpfuncties voor CLI-formattering, wachten, versie, argumentaanroep en lazy opdrachtgroepen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gedeelde id's voor live transport-QA-scenario's, hulpfuncties voor basislijndekking en hulpfunctie voor scenarioselectie |
    | `plugin-sdk/gateway-method-runtime` | Gereserveerde Gateway-methode-dispatchhulpfunctie voor plugin-HTTP-routes die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren |
    | `plugin-sdk/gateway-runtime` | Gateway-client, hulpfunctie voor clientstart wanneer de eventloop gereed is, gateway-CLI-RPC, gateway-protocolfouten en hulpfuncties voor kanaalstatuspatches |
    | `plugin-sdk/config-contracts` | Gerichte type-only configuratieoppervlakte voor plugin-configuratievormen zoals `OpenClawConfig` en configuratietypen voor kanalen/providers |
    | `plugin-sdk/plugin-config-runtime` | Hulpfuncties voor runtime-plugin-configuratie-lookup, zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele hulpfuncties voor configuratiemutatie, zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gedeelde metadata-hintstrings voor levering van berichttools |
    | `plugin-sdk/runtime-config-snapshot` | Hulpfuncties voor huidige procesconfiguratiesnapshots, zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en setters voor testsnapshots |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-opdrachtnamen/-beschrijvingen en controles op duplicaten/conflicten, zelfs wanneer de gebundelde Telegram-contractoppervlakte niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van autolinks voor bestandsreferenties zonder de brede tekstbarrel |
    | `plugin-sdk/approval-reaction-runtime` | Hardgecodeerde approval-reactiebindingen, payloads voor reactieprompts, stores voor reactiedoelen en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-runtime` | Hulpfuncties voor exec-/plugin-goedkeuring, builders voor goedkeuringsmogelijkheden, hulpfuncties voor auth/profielen, hulpfuncties voor native routing/runtime en formattering van gestructureerde goedkeuringsweergavepaden |
    | `plugin-sdk/reply-runtime` | Gedeelde hulpfuncties voor inbound/reply-runtime, chunking, dispatch, Heartbeat, reply-planner |
    | `plugin-sdk/reply-dispatch-runtime` | Smalle hulpfuncties voor reply-dispatch/finalisatie en gesprekslabels |
    | `plugin-sdk/reply-history` | Gedeelde hulpfuncties voor replygeschiedenis met kort venster. Nieuwe berichtbeurtcode moet `createChannelHistoryWindow` gebruiken; lagere map-hulpfuncties blijven alleen verouderde compatibiliteitsexports |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Smalle hulpfuncties voor tekst-/Markdown-chunking |
    | `plugin-sdk/session-store-runtime` | Hulpfuncties voor sessieworkflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrensde recente tekstlezingen van gebruiker-/assistenttranscripten op sessie-identiteit, legacy sessiestorepad-/sessiesleutelhulpfuncties, updated-at-lezingen en alleen-voor-transitie compatibiliteitshulpfuncties voor volledige store/bestandspad |
    | `plugin-sdk/session-transcript-runtime` | Transcriptidentiteit, scoped hulpfuncties voor doel/lezen/schrijven, updatepublicatie, schrijfvergrendelingen en sleutels voor transcriptgeheugenhits |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-hulpfuncties voor agent-schema, pad en transacties voor first-party runtime |
    | `plugin-sdk/cron-store-runtime` | Hulpfuncties voor Cron-storepad/laden/opslaan |
    | `plugin-sdk/state-paths` | Hulpfuncties voor status-/OAuth-mappaden |
    | `plugin-sdk/plugin-state-runtime` | SQLite-keyed-state-typen voor plugin-sidecars plus gecentraliseerde verbindingspragma en WAL-onderhoudssetup voor plugin-owned databases |
    | `plugin-sdk/routing` | Hulpfuncties voor route-/sessiesleutel-/accountbinding, zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde hulpfuncties voor kanaal-/accountstatussamenvattingen, standaardwaarden voor runtimestatus en issue-metadata |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde hulpfuncties voor targetresolvers |
    | `plugin-sdk/string-normalization-runtime` | Hulpfuncties voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | String-URL's extraheren uit fetch-/request-achtige invoer |
    | `plugin-sdk/run-command` | Getimede opdracht-runner met genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Algemene tool-/CLI-paramreaderfuncties |
    | `plugin-sdk/tool-plugin` | Definieer een eenvoudige getypte agent-tool-plugin en stel statische metadata beschikbaar voor manifestgeneratie |
    | `plugin-sdk/tool-payload` | Genormaliseerde payloads extraheren uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Canonieke velden voor verzenddoelen extraheren uit toolargumenten |
    | `plugin-sdk/sandbox` | Sandbox-backendtypen en SSH-/OpenShell-opdrachthulpfuncties, inclusief fail-fast preflight voor exec-opdrachten |
    | `plugin-sdk/temp-path` | Gedeelde hulpfuncties voor tijdelijke downloadpaden en private beveiligde tijdelijke werkruimten |
    | `plugin-sdk/logging-core` | Subsystemlogger en hulpfuncties voor redactie |
    | `plugin-sdk/markdown-table-runtime` | Hulpfuncties voor Markdown-tabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Hulpfuncties voor model-/sessie-override, zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hulpfuncties voor resolutie van talk-providerconfiguratie |
    | `plugin-sdk/json-store` | Kleine hulpfuncties voor lezen/schrijven van JSON-status |
    | `plugin-sdk/json-unsafe-integers` | Hulpfuncties voor JSON-parsing die onveilige integerliterals als strings behouden |
    | `plugin-sdk/file-lock` | Re-entrante hulpfuncties voor bestandsvergrendeling |
    | `plugin-sdk/persistent-dedupe` | Schijfgebaseerde hulpfuncties voor dedupe-cache |
    | `plugin-sdk/acp-runtime` | Hulpfuncties voor ACP-runtime/sessie en reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht ACP-backendregistratie en reply-dispatchhulpfuncties voor bij startup geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Alleen-lezen ACP-bindingsresolutie zonder imports voor lifecycle-startup |
    | `plugin-sdk/agent-config-primitives` | Smalle primitives voor agent-runtime-configuratieschema |
    | `plugin-sdk/boolean-param` | Losse booleaanse paramreader |
    | `plugin-sdk/dangerous-name-runtime` | Hulpfuncties voor resolutie van dangerous-name-matching |
    | `plugin-sdk/device-bootstrap` | Hulpfuncties voor apparaatbootstrap en pairingtokens |
    | `plugin-sdk/extension-shared` | Gedeelde primitives voor passieve kanalen, status en ambient proxy-hulpfuncties |
    | `plugin-sdk/models-provider-runtime` | Hulpfuncties voor `/models`-opdracht/providerantwoord |
    | `plugin-sdk/skill-commands-runtime` | Hulpfuncties voor lijstweergave van Skill-opdrachten |
    | `plugin-sdk/native-command-registry` | Hulpfuncties voor native-opdrachtregistry/build/serialisatie |
    | `plugin-sdk/agent-harness` | Experimentele trusted-plugin-oppervlakte voor low-level agent-harnassen: harnastypen, hulpfuncties voor actieve-run sturen/afbreken, OpenClaw-toolbridgehulpfuncties, hulpfuncties voor runtime-plan-toolbeleid, classificatie van terminale uitkomsten, hulpfuncties voor formattering/details van toolvoortgang en hulpprogramma's voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Verouderde Z.AI-provider-owned endpointdetectiefacade; gebruik de openbare API van de Z.AI-plugin |
    | `plugin-sdk/async-lock-runtime` | Proceslokale async-lock-hulpfunctie voor kleine runtimestatusbestanden |
    | `plugin-sdk/channel-activity-runtime` | Hulpfunctie voor kanaalactiviteitstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Hulpfunctie voor begrensde async-taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Hulpfuncties voor in-memory dedupe-cache |
    | `plugin-sdk/delivery-queue-runtime` | Hulpfunctie voor drain van uitgaande wachtende leveringen |
    | `plugin-sdk/file-access-runtime` | Veilige hulpfuncties voor lokale bestanden en media-source-paden |
    | `plugin-sdk/heartbeat-runtime` | Hulpfuncties voor Heartbeat-wake, event en zichtbaarheid |
    | `plugin-sdk/number-runtime` | Hulpfunctie voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Hulpfuncties voor beveiligde tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Hulpfuncties voor systeemeventqueues |
    | `plugin-sdk/transport-ready-runtime` | Hulpfunctie voor wachten op transportgereedheid |
    | `plugin-sdk/exec-approvals-runtime` | Hulpfuncties voor exec-goedkeuringsbeleidsbestanden zonder de brede infra-runtime-barrel |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine hulpfuncties voor begrensde caches |
    | `plugin-sdk/diagnostic-runtime` | Hulpfuncties voor diagnostische vlaggen, events en trace-context |
    | `plugin-sdk/error-runtime` | Foutgrafiek, formattering, gedeelde hulpfuncties voor foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrapte fetch, proxy, optie voor EnvHttpProxyAgent en hulpfuncties voor pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewuste runtime-fetch zonder proxy-/guarded-fetch-imports |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer voor inline image data URL en hulpfuncties voor signature-sniffing zonder de brede media-runtime-oppervlakte |
    | `plugin-sdk/response-limit-runtime` | Begrensde response-body-reader zonder de brede media-runtime-oppervlakte |
    | `plugin-sdk/session-binding-runtime` | Huidige gespreksbindingsstatus zonder geconfigureerde bindingsrouting of pairingstores |
    | `plugin-sdk/session-store-runtime` | Sessiestore-hulpfuncties zonder brede configuratieschrijfbewerkingen/onderhoudsimports |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-hulpfuncties voor agent-schema, pad en transacties zonder databaselevenscycluscontroles |
    | `plugin-sdk/context-visibility-runtime` | Resolutie van contextzichtbaarheid en aanvullende contextfiltering zonder brede configuratie-/beveiligingsimports |
    | `plugin-sdk/string-coerce-runtime` | Smalle hulpfuncties voor primitive record-/stringcoercion en normalisatie zonder markdown-/loggingimports |
    | `plugin-sdk/host-runtime` | Hulpfuncties voor hostnaam- en SCP-hostnormalisatie |
    | `plugin-sdk/retry-runtime` | Hulpfuncties voor retry-configuratie en retry-runner |
    | `plugin-sdk/agent-runtime` | Hulpfuncties voor agent-map/identiteit/werkruimte, inclusief `resolveAgentDir`, `resolveDefaultAgentDir` en verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Configuratiegedreven directoryquery/deduplicatie |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- en testsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor media ophalen/transformeren/opslaan, waaronder `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` en verouderde `fetchRemoteMedia`; geef de voorkeur aan opslaghelpers boven bufferreads wanneer een URL OpenClaw-media moet worden |
    | `plugin-sdk/media-mime` | Gerichte MIME-normalisatie, mapping van bestandsextensies, MIME-detectie en helpers voor mediasoorten |
    | `plugin-sdk/media-store` | Gerichte helpers voor mediaopslag, zoals `saveMediaBuffer` en `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failoverhelpers voor mediageneratie, kandidaatselectie en meldingen over ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte helperexports voor afbeelding/audio/gestructureerde extractie |
    | `plugin-sdk/text-chunking` | Helpers voor tekst- en markdown-chunking/rendering, conversie van markdown-tabellen, verwijderen van directive-tags en hulpprogramma's voor veilige tekst |
    | `plugin-sdk/text-chunking` | Helper voor uitgaande tekstchunking |
    | `plugin-sdk/speech` | Speech-providertypen plus providergerichte exports voor directives, registry, validatie, OpenAI-compatibele TTS-builder en speechhelpers |
    | `plugin-sdk/speech-core` | Gedeelde speech-providertypen, registry, directive, normalisatie en speechhelperexports |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registryhelpers en gedeelde WebSocket-sessiehelper |
    | `plugin-sdk/realtime-bootstrap-context` | Realtime profiel-bootstraphelper voor begrensde contextinjectie van `IDENTITY.md`, `USER.md` en `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime spraak, registryhelpers en gedeelde helpers voor realtime spraakgedrag, inclusief tracking van uitvoeractiviteit |
    | `plugin-sdk/image-generation` | Providertypen voor beeldgeneratie plus helpers voor beeldassets/data-URL's en de OpenAI-compatibele builder voor beeldproviders |
    | `plugin-sdk/image-generation-core` | Gedeelde typen, failover, auth en registryhelpers voor beeldgeneratie |
    | `plugin-sdk/music-generation` | Provider-/request-/resultaattypen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen, failoverhelpers, providerlookup en parsing van modelrefs voor muziekgeneratie |
    | `plugin-sdk/video-generation` | Provider-/request-/resultaattypen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen, failoverhelpers, providerlookup en parsing van modelrefs voor videogeneratie |
    | `plugin-sdk/transcripts` | Gedeelde providertypen voor transcriptbronnen, registryhelpers, sessiedescriptors en uitingmetadata |
    | `plugin-sdk/webhook-targets` | Webhook-doelregistry en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gedeelde helpers voor het laden van externe/lokale media |
    | `plugin-sdk/zod` | Verouderde compatibiliteits-re-export; importeer `zod` rechtstreeks uit `zod` |
    | `plugin-sdk/testing` | Repo-lokale verouderde compatibiliteitsbarrel voor legacy OpenClaw-tests. Nieuwe repotests moeten in plaats daarvan gerichte lokale testsubpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale `createTestPluginApi`-helper voor unit-tests met directe Plugin-registratie zonder repo-testhelperbruggen te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale native contractfixtures voor agent-runtime-adapters voor auth-, levering-, fallback-, tool-hook-, prompt-overlay-, schema- en transcriptprojectietests |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanaalgerichte testhelpers voor generieke acties/setup/statuscontracten, directory-assertions, levenscyclus voor accountstart, send-config-threading, runtime-mocks, statusproblemen, uitgaande levering en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gedeelde suite met foutgevallen voor doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale helpers voor Plugin-pakket-, registratie-, openbaar artefact-, directe import-, runtime-API- en import-side-effect-contracten |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale helpers voor provider-runtime, auth, ontdekking, onboard, catalogus, wizard, mediacapability, replaybeleid, realtime STT-live-audio, web-search/fetch en streamcontracten |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` uitoefenen |
    | `plugin-sdk/test-fixtures` | Repo-lokale generieke fixtures voor CLI-runtimecapture, sandboxcontext, skillwriter, agentbericht, systeemevent, moduleherlaad, gebundeld Plugin-pad, terminaltekst, chunking, authtoken en getypte cases |
    | `plugin-sdk/test-node-mocks` | Repo-lokale gerichte helpers voor Node-ingebouwde mocks voor gebruik in Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Geheugensubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core helperoppervlak voor manager-/config-/bestand-/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/zoekfunctie |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lichtgewicht registryhelpers voor geheugen-embeddingproviders |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports voor foundation-engine van geheugenhost |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contracten voor geheugenhost-embeddings, registrytoegang, lokale provider en generieke batch-/remotehelpers. `registerMemoryEmbeddingProvider` op dit oppervlak is verouderd; gebruik de generieke embeddingprovider-API voor nieuwe providers. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports voor QMD-engine van geheugenhost |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports voor opslagengine van geheugenhost |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-query` | Queryhelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-secret` | Secrethelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-events` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-host-core` | Leveranciersneutrale alias voor core-runtimehelpers van geheugenhost |
    | `plugin-sdk/memory-host-events` | Leveranciersneutrale alias voor eventjournal-helpers van geheugenhost |
    | `plugin-sdk/memory-host-files` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-helpers voor geheugengerelateerde plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-runtimefacade voor toegang tot search-manager |
    | `plugin-sdk/memory-host-status` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Gereserveerde gebundelde-helpersubpaden">
    Gereserveerde gebundelde-helper-SDK-subpaden zijn smalle eigenaarspecifieke oppervlakken voor
    gebundelde Plugin-code. Ze worden bijgehouden in de SDK-inventaris zodat pakketbuilds
    en aliasing deterministisch blijven, maar het zijn geen algemene API's voor
    Plugin-authoring. Nieuwe herbruikbare hostcontracten moeten generieke SDK-subpaden gebruiken
    zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en
    `plugin-sdk/plugin-config-runtime`.

    | Subpad | Eigenaar en doel |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Gebundelde Codex-Plugin-helper voor het projecteren van gebruikers-MCP-serverconfiguratie naar Codex app-server-threadconfiguratie |
    | `plugin-sdk/codex-native-task-runtime` | Gebundelde Codex-Plugin-helper voor het spiegelen van native subagents van Codex app-server naar OpenClaw-taakstatus |

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Installatie van Plugin SDK](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
