---
read_when:
    - De juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Bundled-Plugin-subpaden en helperoppervlakken
summary: 'Plugin SDK-subpadcatalogus: welke imports waar staan, gegroepeerd per gebied'
title: Plugin-SDK-subpaden
x-i18n:
    generated_at: "2026-07-01T20:26:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

De Plugin SDK wordt beschikbaar gesteld als een set smalle openbare subpaden onder
`openclaw/plugin-sdk/`. Deze pagina catalogiseert de veelgebruikte subpaden, gegroepeerd op
doel. De gegenereerde inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports zijn de openbare subset
na aftrek van repo-lokale test-/interne subpaden die worden vermeld in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainers kunnen het
aantal openbare exports controleren met `pnpm plugin-sdk:surface` en actieve gereserveerde
helper-subpaden met `pnpm plugins:boundary-report:summary`; ongebruikte gereserveerde
helper-exports laten het CI-rapport falen in plaats van als slapende compatibiliteitsschuld
in de openbare SDK te blijven.

Zie voor de gids voor Plugin-authoring [Plugin SDK-overzicht](/nl/plugins/sdk-overview).

## Plugin-entry

| Subpad                         | Belangrijkste exports                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers voor migratieprovider-items zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactieshelpers en `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                    |
| `plugin-sdk/health`            | Registratie, detectie, reparatie, selectie, ernst en finding-typen voor doctor-health-checks voor gebundelde health-consumenten                                       |

### Verouderde compatibiliteits- en testhelpers

Verouderde subpaden blijven geëxporteerd voor oudere plugins, maar nieuwe code moet de
gerichte SDK-subpaden hieronder gebruiken. De onderhouden lijst is
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI weigert gebundelde
productie-imports daaruit. Brede barrels zoals `compat`, `config-types`,
`infra-runtime`, `text-runtime` en `zod` zijn alleen voor compatibiliteit. Importeer `zod`
rechtstreeks uit `zod`.

OpenClaw's door Vitest ondersteunde subpaden voor testhelpers zijn alleen repo-lokaal en zijn
niet langer package-exports: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` en `testing`.

### Gereserveerde helper-subpaden voor gebundelde plugins

Deze subpaden zijn plugin-eigen compatibiliteitsoppervlakken voor hun eigenaar, de gebundelde
Plugin, geen algemene SDK-API's: `plugin-sdk/codex-mcp-projection` en
`plugin-sdk/codex-native-task-runtime`. Cross-owner extension-imports worden geblokkeerd
door guardrails voor package-contracten.

  <AccordionGroup>
  <Accordion title="Kanaalsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-export van het Zod-schema voor `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Gecachte JSON Schema-validatiehelper voor schema's die door plugins worden beheerd |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde helpers voor de installatiewizard, setupvertaler, allowlist-prompts, bouwers voor setupstatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor multi-accountconfiguratie en action-gates, fallbackhelpers voor standaardaccounts |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers voor normalisatie van account-id's |
    | `plugin-sdk/account-resolution` | Helpers voor accountopzoeking en standaardfallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten en accountacties |
    | `plugin-sdk/access-groups` | Helpers voor het parsen van access-group-allowlists en geredigeerde groepsdiagnostiek |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde primitieven voor kanaalconfiguratieschema's plus Zod- en directe JSON/TypeBox-bouwers |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Canonieke gebundelde/officiële chatkanaal-id's plus formatterlabels/-aliassen voor plugins die tekst met envelope-prefix moeten herkennen zonder hun eigen tabel te hardcoden. |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor gebundelde kanaalconfiguratieschema's |
    | `plugin-sdk/telegram-command-config` | Helpers voor normalisatie/validatie van aangepaste Telegram-opdrachten met fallback voor het gebundelde contract |
    | `plugin-sdk/command-gating` | Smalle helpers voor command-autorisatiegates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Verouderde compatibiliteitsfacade voor low-level kanaalingress. Nieuwe ontvangstpaden moeten `plugin-sdk/channel-ingress-runtime` gebruiken. |
    | `plugin-sdk/channel-ingress-runtime` | Experimentele high-level runtime-resolver voor kanaalingress en bouwers voor routefeiten voor gemigreerde kanaalontvangstpaden. Geef hier de voorkeur aan boven het samenstellen van effectieve allowlists, command-allowlists en legacy-projecties in elke Plugin. Zie [Kanaalingress-API](/nl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contracten voor berichtlevenscyclus plus opties voor reply-pipelines, ontvangstbewijzen, live preview/streaming, lifecycle-helpers, outbound-identiteit, payloadplanning, duurzame verzendingen en helpers voor message-send-context. Zie [Kanaal-outbound-API](/nl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy facades voor reply-dispatch. |
    | `plugin-sdk/channel-message-runtime` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy facades voor reply-dispatch. |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inbound routes en envelope-bouwers |
    | `plugin-sdk/inbound-reply-dispatch` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-inbound` voor inbound runners en dispatch-predicaten, en `plugin-sdk/channel-outbound` voor helpers voor berichtbezorging. |
    | `plugin-sdk/messaging-targets` | Verouderde alias voor target-parsing; gebruik `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor outbound media laden en hosted-media-status |
    | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor pollnormalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor thread-binding-levenscyclus en adapters |
    | `plugin-sdk/agent-media-payload` | Legacy bouwer voor agentmediapayloads |
    | `plugin-sdk/conversation-runtime` | Helpers voor conversation/thread-binding, pairing en geconfigureerde bindingen |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor runtimeconfiguratiesnapshot |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtimeoplossing van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatussnapshots/-samenvattingen |
    | `plugin-sdk/channel-config-primitives` | Smalle primitieven voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Helpers voor autorisatie van kanaalconfiguratieschrijfacties |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor bewerken/lezen van allowlist-configuratie |
    | `plugin-sdk/group-access` | Gedeelde helpers voor group-access-beslissingen |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Smalle helpers voor direct-DM guard policy vóór crypto |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten geïnjecteerde runtimehelpers of generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/zalouser` | Verouderde Zalo Personal-compatibiliteitsfacade voor gepubliceerde Lark/Zalo-pakketten die nog sender-command-autorisatie importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Semantische berichtpresentatie, bezorging en legacy helpers voor interactieve replies. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gedeelde inbound helpers voor eventclassificatie, contextopbouw, formattering, roots, debounce, mention-matching, mention-policy en inbound logging |
    | `plugin-sdk/channel-inbound-debounce` | Smalle inbound debounce-helpers |
    | `plugin-sdk/channel-mention-gating` | Smalle helpers voor mention-policy, mention-markers en mention-tekst zonder het bredere inbound runtime-oppervlak |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound` of `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Reply-resultaattypen |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die behouden zijn voor plugincompatibiliteit |
    | `plugin-sdk/channel-route` | Gedeelde helpers voor routenormalisatie, parsergestuurde targetresolutie, thread-id-stringificatie, dedupe/compacte routesleutels, parsed-target-typen en route/target-vergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor target-parsing; callers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Feedback-/reactiekoppeling |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contracten zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en secret target-typen |
  </Accordion>

Verouderde channel-helperfamilies blijven alleen beschikbaar voor compatibiliteit met gepubliceerde plugins. Het verwijderingsplan is: behoud ze tijdens de migratieperiode voor externe plugins, houd repo-/gebundelde plugins op `channel-inbound` en `channel-outbound`, en verwijder daarna de compatibiliteitssubpaden bij de volgende grote SDK-opschoning. Dit geldt voor de oude channel-message/runtime-, channel-streaming-, directe-DM-toegang-, inbound-helper-splinter-, reply-options- en pairing-path-families.

  <Accordion title="Provider subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde providerfacade voor LM Studio voor installatie, catalogusdetectie en runtime-modelvoorbereiding |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde runtimefacade voor LM Studio voor lokale serverstandaarden, modeldetectie, aanvraagheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Gecureerde lokale/zelfgehoste provider-installatiehelpers |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele installatiehelpers voor zelfgehoste providers |
    | `plugin-sdk/cli-backend` | CLI-backendstandaarden + watchdog-constanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-helpers voor API-sleutelresolutie voor provider-Plugins |
    | `plugin-sdk/provider-oauth-runtime` | Generieke OAuth-callbacktypen voor providers, rendering van callbackpagina's, PKCE/status-helpers, parsing van autorisatie-invoer, helpers voor tokenverval en afbreekhelpers |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor onboarding/API-sleutelprofielschrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaard builder voor OAuth-authenticatieresultaten |
    | `plugin-sdk/provider-env-vars` | Helpers voor het opzoeken van provider-authenticatieomgevingsvariabelen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helpers voor OpenAI Codex-authenticatie-import, verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde builders voor replaybeleid, helpers voor providereindpunten en gedeelde helpers voor normalisatie van model-id's |
    | `plugin-sdk/provider-catalog-live-runtime` | Helpers voor live providermodelcatalogi voor bewaakte `/models`-achtige detectie: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtering van model-id's, TTL-cache en statische fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-hook voor providercatalogusuitbreiding en Plugin-providerregister-seams voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke HTTP-/eindpunt-capabilityhelpers voor providers, HTTP-fouten voor providers en multipart-formulierhelpers voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle contracthelpers voor web-fetch-configuratie/-selectie, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers voor registratie/cache van web-fetch-providers |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle configuratie-/credentialhelpers voor webzoekproviders die geen Plugin-enable-bedrading nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle contracthelpers voor webzoekconfiguratie/-credentials, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped credential-setters/getters |
    | `plugin-sdk/provider-web-search` | Helpers voor registratie/cache/runtime van webzoekproviders |
    | `plugin-sdk/embedding-providers` | Algemene typen en leeshelpers voor embeddingproviders, waaronder `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` en `listEmbeddingProviders(...)`; Plugins registreren providers via `api.registerEmbeddingProvider(...)` zodat manifest-eigenaarschap wordt afgedwongen |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en DeepSeek/Gemini/OpenAI-schemaopschoning + diagnostiek |
    | `plugin-sdk/provider-usage` | Snapshottypen voor providergebruik, gedeelde helpers voor het ophalen van gebruik en provider-fetchers zoals `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream-wrappertypen, compatibiliteit voor plain-text tool-calls en gedeelde wrapperhelpers voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Publieke gedeelde wrapperhelpers voor providerstreams, waaronder `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` en Anthropic/DeepSeek/OpenAI-compatibele streamhulpprogramma's |
    | `plugin-sdk/provider-transport-runtime` | Native providertransporthelpers zoals bewaakte fetch, tekstextractie uit toolresultaten, transportberichttransformaties en beschrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor onboarding-configuratiepatches |
    | `plugin-sdk/global-singleton` | Proceslokale singleton-/map-/cachehelpers |
    | `plugin-sdk/group-activation` | Smalle helpers voor groepsactivatiemodus en commandoparsing |
  </Accordion>

Snapshots van providergebruik rapporteren normaal gesproken een of meer quota-`windows`, elk met
een label, gebruikt percentage en optionele resettijd. Providers die saldi of
accountstatustekst tonen in plaats van resetbare quotavensters, moeten
`summary` retourneren met een lege `windows`-array in plaats van percentages te verzinnen.
OpenClaw toont die samenvattingstekst in statusuitvoer; gebruik `error` alleen wanneer het
gebruikseindpunt is mislukt of geen bruikbare gebruiksgegevens heeft geretourneerd.

  <Accordion title="Auth and security subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, commandoregisterhelpers inclusief dynamische menu-opmaak voor argumenten, helpers voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Builders voor commando-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeurderresolutie en actie-authenticatie in dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Helpers voor native exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Adapters voor native approval-capabilities/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde helper voor Gateway-resolutie van goedkeuringen |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor hot channel-entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-seams wanneer die voldoende zijn |
    | `plugin-sdk/approval-native-runtime` | Helpers voor native goedkeuringsdoel, accountbinding, route-gate, doorstuurfallback en onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reaction-runtime` | Hardgecodeerde bindings voor goedkeuringsreacties, payloads voor reactieprompts, stores voor reactiedoelen en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reply-runtime` | Payloadhelpers voor exec-/Plugin-goedkeuringsantwoorden |
    | `plugin-sdk/approval-runtime` | Payloadhelpers voor exec-/Plugin-goedkeuringen, helpers voor native goedkeuringsroutering/runtime en gestructureerde weergavehelpers voor goedkeuringen zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle resethelpers voor deduplicatie van inkomende antwoorden |
    | `plugin-sdk/channel-contract-testing` | Smalle testhelpers voor kanaalcontracten zonder de brede testing-barrel |
    | `plugin-sdk/command-auth-native` | Native commando-authenticatie, dynamische menu-opmaak voor argumenten en helpers voor native sessiedoelen |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor commandodetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht predicaten voor commandotekst voor hot channel-paden |
    | `plugin-sdk/command-surface` | Normalisatie van commandobody's en helpers voor commandosurfaces |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Lazy helpers voor provider-authenticatie-loginflows voor privékanalen en Web UI-device-codekoppeling |
    | `plugin-sdk/channel-secret-runtime` | Smalle collectiehelpers voor secret-contracten voor kanaal-/Plugin-secret-surfaces |
    | `plugin-sdk/secret-ref-runtime` | Smalle helpers voor `coerceSecretRef` en SecretRef-typering voor parsing van secret-contracten/configuratie |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef-providerintegratiemanifest en presetcontracten voor Plugins die externe secretproviderpresets publiceren |
    | `plugin-sdk/security-runtime` | Gedeelde trust, DM-gating, root-begrensde bestands-/padhelpers inclusief create-only writes, synchrone/asynchrone atomische bestandsvervanging, sibling-tempwrites, cross-device move-fallback, helpers voor private file-stores, symlink-parentguards, externe content, redactie van gevoelige tekst, constant-time secretvergelijking en secret-collectiehelpers |
    | `plugin-sdk/ssrf-policy` | Helpers voor host-allowlists en private-network SSRF-beleid |
    | `plugin-sdk/ssrf-dispatcher` | Smalle pinned-dispatcherhelpers zonder de brede infra-runtimesurface |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-bewaakte fetch, SSRF-fout en SSRF-beleidshelpers |
    | `plugin-sdk/secret-input` | Helpers voor parsing van secretinvoer |
    | `plugin-sdk/webhook-ingress` | Webhook-aanvraag-/doelhelpers en coercion van raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helpers voor grootte/time-out van aanvraagbody's |
  </Accordion>

  <Accordion title="Runtime- en opslag-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede helpers voor runtime/logging/back-up/plugin-installatie |
    | `plugin-sdk/runtime-env` | Gerichte helpers voor runtime-env, logger, time-out, retry en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratiefacade voor genormaliseerd profiel/standaardwaarden, CDP-URL-parsing en helpers voor browserbesturingsauthenticatie |
    | `plugin-sdk/agent-harness-task-runtime` | Generieke helpers voor taaklevenscyclus en voltooiingslevering voor door een harness ondersteunde agents die een door de host uitgegeven taakscope gebruiken |
    | `plugin-sdk/codex-mcp-projection` | Gereserveerde gebundelde Codex-helper voor het projecteren van gebruikers-MCP-serverconfiguratie naar Codex-threadconfiguratie; niet voor plugins van derden |
    | `plugin-sdk/codex-native-task-runtime` | Private gebundelde Codex-helper voor native taakspiegeling/runtime-bedrading; niet voor plugins van derden |
    | `plugin-sdk/channel-runtime-context` | Generieke helpers voor registratie en lookup van channel runtime-context |
    | `plugin-sdk/matrix` | Verouderde Matrix-compatibiliteitsfacade voor oudere channel-pakketten van derden; nieuwe plugins moeten `plugin-sdk/run-command` rechtstreeks importeren |
    | `plugin-sdk/mattermost` | Verouderde Mattermost-compatibiliteitsfacade voor oudere channel-pakketten van derden; nieuwe plugins moeten generieke SDK-subpaden rechtstreeks importeren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor plugin-commando's/hooks/http/interactieve functies |
    | `plugin-sdk/hook-runtime` | Gedeelde helpers voor Webhook/interne hook-pijplijn |
    | `plugin-sdk/lazy-runtime` | Helpers voor lazy runtime-import/binding, zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers voor proces-exec |
    | `plugin-sdk/cli-runtime` | Helpers voor CLI-formattering, wachten, versie, argumentaanroep en lazy commandogroepen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gedeelde live-transport-QA-scenario-id's, helpers voor basislijndekking en helper voor scenarioselectie |
    | `plugin-sdk/gateway-method-runtime` | Gereserveerde Gateway-methode-dispatchhelper voor plugin-HTTP-routes die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren |
    | `plugin-sdk/gateway-runtime` | Gateway-client, helper voor starten van event-loop-klare client, Gateway CLI RPC, Gateway-protocolfouten, geadverteerde LAN-hostresolutie en helpers voor channel-statuspatches |
    | `plugin-sdk/config-contracts` | Gerichte type-only configuratiesurface voor plugin-configuratievormen zoals `OpenClawConfig` en channel/provider-configuratietypen |
    | `plugin-sdk/plugin-config-runtime` | Runtime-helpers voor plugin-configuratie-lookup, zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele configuratiemutatiehelpers zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gedeelde hintstrings voor metadata van message-tool-levering |
    | `plugin-sdk/runtime-config-snapshot` | Helpers voor huidige procesconfiguratiesnapshots, zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en setters voor testsnapshots |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-commandonaam/-beschrijving en controles op duplicaten/conflicten, zelfs wanneer de gebundelde Telegram-contractsurface niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van bestandsreferentie-autolinks zonder de brede text barrel |
    | `plugin-sdk/approval-reaction-runtime` | Hardgecodeerde approval-reaction-bindings, reaction prompt-payloads, reaction target stores en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-runtime` | Helpers voor exec/plugin-goedkeuring, bouwers voor goedkeuringscapaciteiten, auth/profielhelpers, native routing/runtime-helpers en gestructureerde formattering van approval display-paden |
    | `plugin-sdk/reply-runtime` | Gedeelde inbound/reply runtime-helpers, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | Gerichte helpers voor reply-dispatch/finalize en conversatielabels |
    | `plugin-sdk/reply-history` | Gedeelde helpers voor reply-geschiedenis met kort venster. Nieuwe message-turn-code moet `createChannelHistoryWindow` gebruiken; lagere map-helpers blijven alleen verouderde compatibiliteitsexports |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Gerichte helpers voor tekst/markdown-chunking |
    | `plugin-sdk/session-store-runtime` | Helpers voor sessieworkflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrensde recente leesacties van gebruiker/assistant-transcripttekst op sessie-identiteit, helpers voor legacy sessiestore-pad/sessiesleutel, updated-at-leesacties en overgangs-only compatibiliteitshelpers voor whole-store/bestandspaden |
    | `plugin-sdk/session-transcript-runtime` | Transcriptidentiteit, gescopete target-/lees-/schrijfhelpers, updatepublicatie, schrijfsloten en transcript memory-hit-sleutels |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-helpers voor agentschema, pad en transacties voor first-party runtime |
    | `plugin-sdk/cron-store-runtime` | Helpers voor Cron-store-pad/laden/opslaan |
    | `plugin-sdk/state-paths` | Helpers voor State/OAuth-directorypaden |
    | `plugin-sdk/plugin-state-runtime` | Plugin sidecar SQLite keyed-state-typen plus gecentraliseerde connection pragma- en WAL-onderhoudssetup voor plugin-owned databases |
    | `plugin-sdk/routing` | Helpers voor route-/sessiesleutel-/accountbinding, zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde helpers voor channel-/accountstatussamenvattingen, runtime-state-standaardwaarden en issue-metadata |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde helpers voor target-resolutie |
    | `plugin-sdk/string-normalization-runtime` | Helpers voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | Haal string-URL's uit fetch-/request-achtige invoer |
    | `plugin-sdk/run-command` | Getimede commandorunner met genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Gemeenschappelijke param-readers voor tool/CLI |
    | `plugin-sdk/tool-plugin` | Definieer een eenvoudige getypte agent-tool-plugin en expose statische metadata voor manifestgeneratie |
    | `plugin-sdk/tool-payload` | Haal genormaliseerde payloads uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Haal canonieke send-targetvelden uit tool-args |
    | `plugin-sdk/sandbox` | Sandbox-backendtypen en SSH/OpenShell-commandohelpers, inclusief fail-fast exec-command-preflight |
    | `plugin-sdk/temp-path` | Gedeelde helpers voor tijdelijke downloadpaden en private veilige tijdelijke werkruimten |
    | `plugin-sdk/logging-core` | Subsystem-logger en redactiehelpers |
    | `plugin-sdk/markdown-table-runtime` | Helpers voor markdowntabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Helpers voor model-/sessie-override, zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers voor configuratieresolutie van Talk-provider |
    | `plugin-sdk/json-store` | Kleine helpers voor lezen/schrijven van JSON-state |
    | `plugin-sdk/json-unsafe-integers` | JSON-parsinghelpers die onveilige integerliterals als strings behouden |
    | `plugin-sdk/file-lock` | Re-entrante file-lock-helpers |
    | `plugin-sdk/persistent-dedupe` | Helpers voor dedupe-cache met schijfbackend |
    | `plugin-sdk/acp-runtime` | ACP-runtime-/sessie- en reply-dispatchhelpers |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht helpers voor ACP-backendregistratie en reply-dispatch voor bij startup geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Alleen-lezen ACP-bindingresolutie zonder lifecycle-startupimports |
    | `plugin-sdk/agent-config-primitives` | Gerichte primitives voor agent-runtimeconfiguratieschema |
    | `plugin-sdk/boolean-param` | Losse boolean-param-reader |
    | `plugin-sdk/dangerous-name-runtime` | Helpers voor resolutie van dangerous-name-matching |
    | `plugin-sdk/device-bootstrap` | Helpers voor apparaatbootstrap en pairing-token |
    | `plugin-sdk/extension-shared` | Gedeelde primitives voor passive-channel, status en ambient-proxy-helpers |
    | `plugin-sdk/models-provider-runtime` | Helpers voor `/models`-commando/provider-antwoorden |
    | `plugin-sdk/skill-commands-runtime` | Helpers voor het weergeven van Skill-commando's |
    | `plugin-sdk/native-command-registry` | Helpers voor native commandoregistratie/build/serialize |
    | `plugin-sdk/agent-harness` | Experimentele trusted-plugin-surface voor low-level agent-harnesses: harnesstypen, helpers voor active-run steer/abort, OpenClaw tool bridge-helpers, runtime-plan-toolbeleidhelpers, classificatie van terminale uitkomsten, formattering/detailhelpers voor toolvoortgang en hulpprogramma's voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Verouderde Z.AI provider-owned endpointdetectiefacade; gebruik de publieke API van de Z.AI-plugin |
    | `plugin-sdk/async-lock-runtime` | Process-local async lock-helper voor kleine runtime-state-bestanden |
    | `plugin-sdk/channel-activity-runtime` | Helper voor channel-activity-telemetrie |
    | `plugin-sdk/concurrency-runtime` | Helper voor begrensde concurrency van async taken |
    | `plugin-sdk/dedupe-runtime` | Helpers voor dedupe-cache in geheugen |
    | `plugin-sdk/delivery-queue-runtime` | Helper voor het legen van outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Veilige helpers voor lokale bestands- en media-source-paden |
    | `plugin-sdk/heartbeat-runtime` | Helpers voor Heartbeat-wake, events en zichtbaarheid |
    | `plugin-sdk/number-runtime` | Helper voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Helpers voor veilige tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Helpers voor system-event-queue |
    | `plugin-sdk/transport-ready-runtime` | Helper voor wachten op transportgereedheid |
    | `plugin-sdk/exec-approvals-runtime` | Helpers voor exec-approval-policybestanden zonder de brede infra-runtime-barrel |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine helpers voor begrensde cache |
    | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostic flags, events en trace-context |
    | `plugin-sdk/error-runtime` | Error graph, formattering, gedeelde helpers voor foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, EnvHttpProxyAgent-optie en pinned lookup-helpers |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch zonder proxy-/guarded-fetch-imports |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer voor inline image data URL's en helpers voor signature sniffing zonder de brede media runtime-surface |
    | `plugin-sdk/response-limit-runtime` | Begrensde response-body-reader zonder de brede media runtime-surface |
    | `plugin-sdk/session-binding-runtime` | Huidige conversation binding-state zonder geconfigureerde bindingrouting of pairing stores |
    | `plugin-sdk/session-store-runtime` | Session-store-helpers zonder brede config writes-/maintenance-imports |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-helpers voor agentschema, pad en transacties zonder database-lifecycle-controls |
    | `plugin-sdk/context-visibility-runtime` | Context visibility-resolutie en aanvullende contextfiltering zonder brede config-/security-imports |
    | `plugin-sdk/string-coerce-runtime` | Gerichte primitive record-/stringcoercion en normalisatiehelpers zonder markdown-/logging-imports |
    | `plugin-sdk/host-runtime` | Helpers voor hostnaam- en SCP-hostnormalisatie |
    | `plugin-sdk/retry-runtime` | Helpers voor retry-configuratie en retry-runner |
    | `plugin-sdk/agent-runtime` | Helpers voor agentdirectory/identiteit/werkruimte, inclusief `resolveAgentDir`, `resolveDefaultAgentDir` en verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Config-backed directoryquery/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpaden voor mogelijkheden en tests">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor het ophalen/transformeren/opslaan van media, waaronder `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` en de verouderde `fetchRemoteMedia`; geef de voorkeur aan opslaghelpers boven bufferlezingen wanneer een URL OpenClaw-media moet worden |
    | `plugin-sdk/media-mime` | Nauwe MIME-normalisatie, mapping van bestandsextensies, MIME-detectie en helpers voor mediasoorten |
    | `plugin-sdk/media-store` | Nauwe helpers voor mediaopslag, zoals `saveMediaBuffer` en `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failoverhelpers voor mediageneratie, kandidaatselectie en meldingen bij ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte helperexports voor afbeelding/audio/gestructureerde extractie |
    | `plugin-sdk/text-chunking` | Helpers voor het opdelen/renderen van tekst en markdown, conversie van markdowntabellen, verwijderen van directivetags en hulpprogramma's voor veilige tekst |
    | `plugin-sdk/text-chunking` | Helper voor het opdelen van uitgaande tekst |
    | `plugin-sdk/speech` | Providertypen voor spraak plus providergerichte exports voor directives, register, validatie, OpenAI-compatibele TTS-builder en spraakhelpers |
    | `plugin-sdk/speech-core` | Gedeelde typen voor spraakproviders, register, directive, normalisatie en exports voor spraakhelpers |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registerhelpers en gedeelde helper voor WebSocket-sessies |
    | `plugin-sdk/realtime-bootstrap-context` | Realtime profiel-bootstraphelper voor begrensde contextinjectie van `IDENTITY.md`, `USER.md` en `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime spraak, registerhelpers en gedeelde gedragshelpers voor realtime spraak, inclusief tracking van uitvoeractiviteit |
    | `plugin-sdk/image-generation` | Providertypen voor afbeeldingsgeneratie plus helpers voor afbeeldingsassets/data-URL's en de OpenAI-compatibele afbeeldingsproviderbuilder |
    | `plugin-sdk/image-generation-core` | Gedeelde typen, failover, auth en registerhelpers voor afbeeldingsgeneratie |
    | `plugin-sdk/music-generation` | Provider-/request-/resultaattypen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen voor muziekgeneratie, failoverhelpers, providerlookup en parsing van modelrefs |
    | `plugin-sdk/video-generation` | Provider-/request-/resultaattypen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failoverhelpers, providerlookup en parsing van modelrefs |
    | `plugin-sdk/transcripts` | Gedeelde providertypen voor transcriptbronnen, registerhelpers, sessiedescriptors en utterance-metadata |
    | `plugin-sdk/webhook-targets` | Webhook-doelregister en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gedeelde helpers voor het laden van externe/lokale media |
    | `plugin-sdk/zod` | Verouderde compatibiliteits-re-export; importeer `zod` rechtstreeks uit `zod` |
    | `plugin-sdk/testing` | Repo-lokale verouderde compatibiliteitsbarrel voor legacy OpenClaw-tests. Nieuwe repotests moeten in plaats daarvan gerichte lokale testsubpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale helper `createTestPluginApi` voor unit-tests met directe Plugin-registratie zonder repo-testhelperbridges te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale native agent-runtime-adaptercontractfixtures voor tests van auth, bezorging, fallback, tool-hook, prompt-overlay, schema en transcriptprojectie |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanaalgerichte testhelpers voor generieke actions/setup/status-contracten, directory-asserties, levenscyclus van accountopstart, send-config-threading, runtime-mocks, statusproblemen, uitgaande bezorging en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gedeelde suite voor foutgevallen bij doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale helpers voor contracten rond Plugin-pakket, registratie, publieke artefacten, directe import, runtime-API en importside-effects |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale helpers voor contracten rond providerruntime, auth, discovery, onboard, catalogus, wizard, mediamogelijkheden, replaybeleid, realtime STT-live-audio, web-search/fetch en stream |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` uitvoeren |
    | `plugin-sdk/test-fixtures` | Repo-lokale generieke fixtures voor CLI-runtimecapture, sandboxcontext, skillwriter, agent-message, system-event, moduleherladen, gebundeld Plugin-pad, terminaltekst, chunking, authtoken en typed-case |
    | `plugin-sdk/test-node-mocks` | Repo-lokale gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Geheugensubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager-/config-/bestand-/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/zoeken |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lichtgewicht registerhelpers voor providers voor geheugenembeddings |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports voor memory-host-foundation-engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contracten voor memory-host-embeddings, registertoegang, lokale provider en generieke batch-/remotehelpers. `registerMemoryEmbeddingProvider` op dit oppervlak is verouderd; gebruik de generieke embeddingprovider-API voor nieuwe providers. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports voor memory-host-QMD-engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports voor memory-host-storage-engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale memory-host-helpers |
    | `plugin-sdk/memory-core-host-query` | Memory-host-queryhelpers |
    | `plugin-sdk/memory-core-host-secret` | Memory-host-secrethelpers |
    | `plugin-sdk/memory-core-host-events` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Memory-host-statushelpers |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory-host-CLI-runtimehelpers |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory-host-core-runtimehelpers |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory-host-bestands-/runtimehelpers |
    | `plugin-sdk/memory-host-core` | Leveranciersneutrale alias voor memory-host-core-runtimehelpers |
    | `plugin-sdk/memory-host-events` | Leveranciersneutrale alias voor memory-host-eventjournalhelpers |
    | `plugin-sdk/memory-host-files` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-helpers voor geheugenverwante Plugins |
    | `plugin-sdk/memory-host-search` | Active memory-runtimefacade voor toegang tot search-manager |
    | `plugin-sdk/memory-host-status` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Gereserveerde subpaden voor gebundelde helpers">
    Gereserveerde SDK-subpaden voor gebundelde helpers zijn nauwe eigenaarspecifieke oppervlakken voor
    gebundelde Plugin-code. Ze worden bijgehouden in de SDK-inventaris zodat package
    builds en aliasing deterministisch blijven, maar het zijn geen algemene API's
    voor het maken van Plugins. Nieuwe herbruikbare hostcontracten moeten generieke SDK-subpaden gebruiken,
    zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en
    `plugin-sdk/plugin-config-runtime`.

    | Subpad | Eigenaar en doel |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Gebundelde Codex-Plugin-helper voor het projecteren van MCP-serverconfiguratie van gebruikers naar threadconfiguratie van de Codex-appserver |
    | `plugin-sdk/codex-native-task-runtime` | Gebundelde Codex-Plugin-helper voor het spiegelen van native subagents van de Codex-appserver naar OpenClaw-taakstatus |

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
- [Plugin SDK-installatie](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
