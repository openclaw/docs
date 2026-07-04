---
read_when:
    - Het juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Gebundelde Plugin-subpaden en helperoppervlakken auditen
summary: 'Plugin SDK-subpadcatalogus: welke imports waar staan, gegroepeerd per gebied'
title: Plugin SDK-subpaden
x-i18n:
    generated_at: "2026-07-04T10:52:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

De Plugin SDK wordt beschikbaar gesteld als een reeks smalle openbare subpaden onder
`openclaw/plugin-sdk/`. Deze pagina catalogiseert de vaak gebruikte subpaden, gegroepeerd op
doel. De gegenereerde inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports vormen de openbare subset
na aftrek van repo-lokale test-/interne subpaden die zijn vermeld in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainers kunnen het
aantal openbare exports controleren met `pnpm plugin-sdk:surface` en actieve gereserveerde
helper-subpaden met `pnpm plugins:boundary-report:summary`; ongebruikte gereserveerde
helper-exports laten het CI-rapport falen in plaats van als sluimerende compatibiliteitsschuld
in de openbare SDK te blijven.

Zie [Plugin SDK-overzicht](/nl/plugins/sdk-overview) voor de handleiding voor Plugin-ontwikkeling.

## Plugin-entry

| Subpad                         | Belangrijkste exports                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers voor migratieprovideritems zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactietools en `summarizeMigrationItems`                     |
| `plugin-sdk/migration-runtime` | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                  |
| `plugin-sdk/health`            | Registratie, detectie, reparatie, selectie, ernst en bevindingstypen voor doctor-healthchecks voor gebundelde health-consumers                                         |

### Verouderde compatibiliteits- en testhelpers

Verouderde subpaden blijven geëxporteerd voor oudere plugins, maar nieuwe code moet de
gerichte SDK-subpaden hieronder gebruiken. De onderhouden lijst is
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI wijst gebundelde
productie-imports daaruit af. Brede barrels zoals `compat`, `config-types`,
`infra-runtime`, `text-runtime` en `zod` zijn alleen voor compatibiliteit. Importeer `zod`
rechtstreeks vanuit `zod`.

OpenClaw's door Vitest ondersteunde subpaden voor testhelpers zijn alleen repo-lokaal en zijn
geen package-exports meer: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` en `testing`.

### Gereserveerde helper-subpaden voor gebundelde plugins

Deze subpaden zijn plugin-eigen compatibiliteitsoppervlakken voor hun eigen gebundelde
plugin, geen algemene SDK-API's: `plugin-sdk/codex-mcp-projection` en
`plugin-sdk/codex-native-task-runtime`. Cross-owner extensie-imports worden geblokkeerd
door guardrails voor package-contracten.

  <AccordionGroup>
  <Accordion title="Kanaalsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema-export (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Gecachete JSON Schema-validatiehelper voor schemas die eigendom zijn van plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde helpers voor de installatiewizard, setupvertaler, allowlist-prompts en bouwers voor setupstatussen |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor configuratie en actiegates met meerdere accounts, helpers voor fallback naar standaardaccount |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers voor account-id-normalisatie |
    | `plugin-sdk/account-resolution` | Helpers voor accountzoekactie + standaard-fallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten/accountacties |
    | `plugin-sdk/access-groups` | Helpers voor allowlist-parsing van toegangsgroepen en geredigeerde groepsdiagnostiek |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde primitives voor kanaalconfiguratieschema's plus Zod- en directe JSON/TypeBox-bouwers |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Canonieke gebundelde/officiële chatkanaal-id's plus formatterlabels/-aliassen voor plugins die envelope-geprefixt tekst moeten herkennen zonder hun eigen tabel hard te coderen. |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor configuratieschema's van gebundelde kanalen |
    | `plugin-sdk/telegram-command-config` | Telegram-helpers voor normalisatie/validatie van aangepaste opdrachten met fallback op gebundeld contract |
    | `plugin-sdk/command-gating` | Smalle helpers voor opdracht-autorisatiegates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Verouderde low-level compatibiliteitsfacade voor kanaalingress. Nieuwe ontvangstpaden moeten `plugin-sdk/channel-ingress-runtime` gebruiken. |
    | `plugin-sdk/channel-ingress-runtime` | Experimentele high-level runtime-resolver voor kanaalingress en bouwers voor routefeiten voor gemigreerde kanaalontvangstpaden. Geef hier de voorkeur aan boven het samenstellen van effectieve allowlists, opdracht-allowlists en legacy-projecties in elke Plugin. Zie [Kanaalingress-API](/nl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Berichtlevenscycluscontracten plus opties voor de antwoordpipeline, ontvangstbewijzen, live preview/streaming, levenscyclushelpers, outbound identiteit, payloadplanning, duurzame verzendingen en helpers voor berichtverzendcontext. Zie [Kanaal-outbound-API](/nl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy facades voor antwoorddispatch. |
    | `plugin-sdk/channel-message-runtime` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy facades voor antwoorddispatch. |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inbound route + envelope-builder |
    | `plugin-sdk/inbound-reply-dispatch` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-inbound` voor inbound runners en dispatchpredicaten, en `plugin-sdk/channel-outbound` voor helpers voor berichtlevering. |
    | `plugin-sdk/messaging-targets` | Verouderde alias voor targetparsing; gebruik `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor het laden van outbound media en hosted-media-state |
    | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor pollnormalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor levenscyclus en adapters van thread-bindings |
    | `plugin-sdk/agent-media-payload` | Legacy builder voor agentmediapayloads |
    | `plugin-sdk/conversation-runtime` | Helpers voor conversatie/thread-binding, pairing en geconfigureerde bindingen |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor runtimeconfiguratiesnapshot |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtime-resolutie van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatussnapshot/-samenvatting |
    | `plugin-sdk/channel-config-primitives` | Smalle primitives voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Helpers voor autorisatie van kanaalconfiguratieschrijfacties |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor allowlist-configuratiebewerking/-lezing |
    | `plugin-sdk/group-access` | Gedeelde helpers voor groeps-toegangsbeslissingen |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Smalle helpers voor direct-DM pre-crypto guardbeleid |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten generieke SDK-subpaden voor kanalen gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten geïnjecteerde runtimehelpers of generieke SDK-subpaden voor kanalen gebruiken |
    | `plugin-sdk/zalouser` | Verouderde Zalo Personal-compatibiliteitsfacade voor gepubliceerde Lark/Zalo-pakketten die nog steeds autorisatie voor afzenderopdrachten importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Semantische berichtpresentatie, levering en legacy interactieve antwoordhelpers. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gedeelde inbound helpers voor gebeurtenisclassificatie, contextopbouw, formattering, roots, debounce, mention-matching, mentionbeleid en inbound logging |
    | `plugin-sdk/channel-inbound-debounce` | Smalle inbound debounce-helpers |
    | `plugin-sdk/channel-mention-gating` | Smalle helpers voor mentionbeleid, mentionmarkers en mentiontekst zonder het bredere inbound runtime-oppervlak |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound` of `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Antwoordresultaattypen |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die behouden zijn voor Plugin-compatibiliteit |
    | `plugin-sdk/channel-route` | Gedeelde routenormalisatie, parsergestuurde targetresolutie, thread-id-stringificatie, dedupe/compacte routesleutels, parsed-target-typen en helpers voor route-/targetvergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor targetparsing; callers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Feedback-/reactiekoppeling |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contracten zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en typen voor secret targets |
  </Accordion>

Verouderde channel-helperfamilies blijven alleen beschikbaar voor compatibiliteit
met gepubliceerde plugins. Het verwijderingsplan is: behoud ze gedurende het
migratievenster voor externe plugins, houd repo-/gebundelde plugins op
`channel-inbound` en `channel-outbound`, en verwijder daarna de
compatibiliteitssubpaden bij de volgende grote SDK-opschoning. Dit geldt voor
de oude channel message/runtime, channel streaming, toegang tot directe DM's,
de afgesplitste inbound-helper, reply-options en pairing-path-families.

  <Accordion title="Provider-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor setup, catalogusdetectie en runtime-modelvoorbereiding |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor standaardinstellingen van lokale servers, modeldetectie, requestheaders en hulpfuncties voor geladen modellen |
    | `plugin-sdk/provider-setup` | Gecureerde setup-hulpfuncties voor lokale/zelfgehoste providers |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte setup-hulpfuncties voor OpenAI-compatibele zelfgehoste providers |
    | `plugin-sdk/cli-backend` | CLI-backendstandaarden + watchdog-constanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-hulpfuncties voor API-sleutelresolutie voor provider-plugins |
    | `plugin-sdk/provider-oauth-runtime` | Generieke OAuth-callbacktypen voor providers, rendering van callbackpagina's, PKCE/status-hulpfuncties, parsing van autorisatie-invoer, hulpfuncties voor tokenverval en afbreekhulpfuncties |
    | `plugin-sdk/provider-auth-api-key` | Hulpfuncties voor onboarding/API-sleutels en profielschrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaard OAuth-auth-result-builder |
    | `plugin-sdk/provider-env-vars` | Hulpfuncties voor het opzoeken van auth-omgevingsvariabelen van providers |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, auth-importhulpfuncties voor OpenAI Codex, verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde builders voor replaybeleid, hulpfuncties voor provider-endpoints en gedeelde hulpfuncties voor normalisatie van model-id's |
    | `plugin-sdk/provider-catalog-live-runtime` | Hulpfuncties voor live providermodelcatalogi voor beveiligde `/models`-achtige detectie: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtering van model-id's, TTL-cache en statische fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-hook voor uitbreiding van providercatalogi en registry-seams voor plugin-providers voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke hulpfuncties voor provider-HTTP/endpointmogelijkheden, provider-HTTP-fouten en multipart-formulierhulpfuncties voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle contracthulpfuncties voor web-fetch-configuratie/-selectie, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hulpfuncties voor registratie/cache van web-fetch-providers |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle hulpfuncties voor web-search-configuratie/referenties voor providers die geen plugin-enable-bedrading nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle contracthulpfuncties voor web-search-configuratie/referenties, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped setters/getters voor referenties |
    | `plugin-sdk/provider-web-search` | Hulpfuncties voor registratie/cache/runtime van web-search-providers |
    | `plugin-sdk/embedding-providers` | Algemene typen en leeshulpfuncties voor embeddingproviders, waaronder `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` en `listEmbeddingProviders(...)`; plugins registreren providers via `api.registerEmbeddingProvider(...)` zodat manifest-eigenaarschap wordt afgedwongen |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en schema-opschoning + diagnostiek voor DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Snapshottypen voor providergebruik, gedeelde hulpfuncties voor het ophalen van gebruik en provider-fetchers zoals `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream-wrappertypen, compatibiliteit voor tool-calls in platte tekst en gedeelde wrapperhulpfuncties voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Openbare gedeelde hulpfuncties voor provider-stream-wrappers, waaronder `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` en streamhulpprogramma's die compatibel zijn met Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Native providertransporthulpfuncties, zoals beveiligde fetch, tekstextractie uit toolresultaten, transportberichttransformaties en schrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Hulpfuncties voor patches van onboardingconfiguratie |
    | `plugin-sdk/global-singleton` | Proceslokale hulpfuncties voor singleton/map/cache |
    | `plugin-sdk/group-activation` | Smalle hulpfuncties voor groepsactivatiemodus en commandoparsing |
  </Accordion>

Snapshots van providergebruik rapporteren normaal een of meer quota-`windows`, elk met
een label, gebruikt percentage en optionele resettijd. Providers die saldo- of
accountstatustekst tonen in plaats van resetbare quotavensters, moeten
`summary` retourneren met een lege `windows`-array in plaats van percentages te verzinnen.
OpenClaw toont die samenvattingstekst in statusuitvoer; gebruik `error` alleen wanneer het
gebruiksendpoint is mislukt of geen bruikbare gebruiksgegevens heeft geretourneerd.

  <Accordion title="Auth- en beveiligingssubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, commandoregistry-hulpfuncties inclusief dynamische opmaak van argumentmenu's, hulpfuncties voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Builders voor commando-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hulpfuncties voor approver-resolutie en actie-auth in dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Hulpfuncties voor native exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor goedkeuringsmogelijkheden/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde hulpfunctie voor Gateway-resolutie van goedkeuringen |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht hulpfuncties voor het laden van native goedkeuringsadapters voor hot channel-entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtime-hulpfuncties voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-seams wanneer die voldoende zijn |
    | `plugin-sdk/approval-native-runtime` | Hulpfuncties voor native goedkeuringsdoel, accountbinding, route-gate, forwarding-fallback en onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded bindingen voor goedkeuringsreacties, payloads voor reactieprompts, stores voor reactiedoelen, hulpfuncties voor reactiehinttekst en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reply-runtime` | Hulpfuncties voor antwoordpayloads van exec-/plugin-goedkeuringen |
    | `plugin-sdk/approval-runtime` | Payloadhulpfuncties voor exec-/plugin-goedkeuringen, hulpfuncties voor native goedkeuringsroutering/runtime en gestructureerde weergavehulpfuncties voor goedkeuringen, zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle reset-hulpfuncties voor deduplicatie van inkomende antwoorden |
    | `plugin-sdk/channel-contract-testing` | Smalle hulpfuncties voor channel-contracttests zonder de brede testing-barrel |
    | `plugin-sdk/command-auth-native` | Native commando-auth, dynamische opmaak van argumentmenu's en native sessiedoelhulpfuncties |
    | `plugin-sdk/command-detection` | Gedeelde hulpfuncties voor commandodetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht commandotekstpredikaten voor hot channel-paden |
    | `plugin-sdk/command-surface` | Normalisatie van commandobody's en commandosurface-hulpfuncties |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Lazy hulpfuncties voor provider-auth-loginflow voor private channel- en Web UI-device-code-koppeling |
    | `plugin-sdk/channel-secret-runtime` | Smalle verzamelhulpfuncties voor secret-contracten voor channel-/plugin-secret-surfaces |
    | `plugin-sdk/secret-ref-runtime` | Smalle `coerceSecretRef`- en SecretRef-typeringhulpfuncties voor parsing van secret-contract/configuratie |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef-providerintegratiemanifest en presetcontracten voor plugins die externe secretprovider-presets publiceren |
    | `plugin-sdk/security-runtime` | Gedeelde hulpfuncties voor vertrouwen, DM-gating, root-begrensde bestanden/paden inclusief create-only writes, synchrone/asynchrone atomaire bestandsvervanging, writes naar sibling-tempbestanden, fallback voor verplaatsing tussen apparaten, private file-store-hulpfuncties, symlink-parent-guards, externe content, redactie van gevoelige tekst, constant-time secretvergelijking en secretverzamelhulpfuncties |
    | `plugin-sdk/ssrf-policy` | Hulpfuncties voor host-allowlist en private-network SSRF-beleid |
    | `plugin-sdk/ssrf-dispatcher` | Smalle hulpfuncties voor pinned-dispatchers zonder het brede infra-runtimeoppervlak |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-beveiligde fetch, SSRF-fout en SSRF-beleidshulpfuncties |
    | `plugin-sdk/secret-input` | Hulpfuncties voor parsing van secretinvoer |
    | `plugin-sdk/webhook-ingress` | Webhook-request-/targethulpfuncties en coercion van raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Hulpfuncties voor requestbodygrootte/time-out |
  </Accordion>

  <Accordion title="Runtime- en opslagsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede hulpfuncties voor runtime, logging, back-up en plugininstallatie |
    | `plugin-sdk/runtime-env` | Smalle hulpfuncties voor runtimeomgeving, logger, time-out, opnieuw proberen en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratiefacade voor genormaliseerde profielen/standaardwaarden, CDP-URL-parsing en hulpfuncties voor browserbesturingsauthenticatie |
    | `plugin-sdk/agent-harness-task-runtime` | Generieke hulpfuncties voor taaklevenscyclus en voltooiingslevering voor door een harness ondersteunde agents die een door de host uitgegeven taakscope gebruiken |
    | `plugin-sdk/codex-mcp-projection` | Gereserveerde gebundelde Codex-hulpfunctie voor het projecteren van gebruikersconfiguratie voor MCP-servers naar Codex-threadconfiguratie; niet voor plugins van derden |
    | `plugin-sdk/codex-native-task-runtime` | Privé gebundelde Codex-hulpfunctie voor native taakspiegeling/runtime-bedrading; niet voor plugins van derden |
    | `plugin-sdk/channel-runtime-context` | Generieke hulpfuncties voor registratie en lookup van kanaalruntimecontext |
    | `plugin-sdk/matrix` | Verouderde Matrix-compatibiliteitsfacade voor oudere kanaalpakketten van derden; nieuwe plugins moeten `plugin-sdk/run-command` rechtstreeks importeren |
    | `plugin-sdk/mattermost` | Verouderde Mattermost-compatibiliteitsfacade voor oudere kanaalpakketten van derden; nieuwe plugins moeten generieke SDK-subpaden rechtstreeks importeren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde hulpfuncties voor pluginopdrachten, hooks, HTTP en interactieve functies |
    | `plugin-sdk/hook-runtime` | Gedeelde hulpfuncties voor Webhook/interne hook-pijplijn |
    | `plugin-sdk/lazy-runtime` | Hulpfuncties voor luie runtime-import/binding, zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hulpfuncties voor procesuitvoering |
    | `plugin-sdk/cli-runtime` | Hulpfuncties voor CLI-opmaak, wachten, versie, argumentaanroep en luie opdrachtgroepen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gedeelde scenario-id's voor live transport-QA, hulpfuncties voor basisdekking en hulpfunctie voor scenarioselectie |
    | `plugin-sdk/gateway-method-runtime` | Gereserveerde Gateway-methode-dispatchhulpfunctie voor plugin-HTTP-routes die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren |
    | `plugin-sdk/gateway-runtime` | Gateway-client, hulpfunctie voor clientstart wanneer event-loop gereed is, Gateway CLI-RPC, Gateway-protocolfouten, resolutie van geadverteerde LAN-hosts en hulpfuncties voor kanaalstatuspatches |
    | `plugin-sdk/config-contracts` | Gerichte type-only configuratiesurface voor pluginconfiguratievormen zoals `OpenClawConfig` en configuratietypen voor kanalen/providers |
    | `plugin-sdk/plugin-config-runtime` | Hulpfuncties voor runtime-lookup van pluginconfiguratie, zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele hulpfuncties voor configuratiemutatie, zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gedeelde metadata-hintstrings voor levering van berichttools |
    | `plugin-sdk/runtime-config-snapshot` | Hulpfuncties voor momentopnamen van de huidige procesconfiguratie, zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en setters voor testmomentopnamen |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-opdrachtnamen/-beschrijvingen en controles op duplicaten/conflicten, zelfs wanneer de gebundelde Telegram-contractsurface niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van automatische links naar bestandsverwijzingen zonder de brede tekstbarrel |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded bindings voor goedkeuringsreacties, payloads voor reactieprompts, stores voor reactiedoelen, hulpfuncties voor reactiehinttekst en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-runtime` | Hulpfuncties voor exec/plugin-goedkeuring, builders voor goedkeuringsmogelijkheden, hulpfuncties voor auth/profiel, hulpfuncties voor native routing/runtime en opmaak van gestructureerde weergavepaden voor goedkeuringen |
    | `plugin-sdk/reply-runtime` | Gedeelde hulpfuncties voor inkomende/reply-runtime, opdelen in chunks, dispatch, Heartbeat, antwoordplanner |
    | `plugin-sdk/reply-dispatch-runtime` | Smalle hulpfuncties voor reply-dispatch/finalisatie en gesprekslabels |
    | `plugin-sdk/reply-history` | Gedeelde hulpfuncties voor replygeschiedenis met kort venster. Nieuwe code voor berichtrondes moet `createChannelHistoryWindow` gebruiken; lagere-level maphulpfuncties blijven alleen verouderde compatibiliteitsexports |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Smalle hulpfuncties voor het opdelen van tekst/Markdown in chunks |
    | `plugin-sdk/session-store-runtime` | Hulpfuncties voor sessieworkflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrensde recente transcripttekstlezingen van gebruiker/assistent per sessie-identiteit, legacy hulpfuncties voor sessiestorepad/sessiesleutel, updated-at-lezingen en alleen-voor-transitie compatibiliteitshulpfuncties voor hele store/bestandspad |
    | `plugin-sdk/session-transcript-runtime` | Transcriptidentiteit, gescopete hulpfuncties voor doel/lezen/schrijven, publicatie van updates, schrijfvergrendelingen en sleutels voor transcriptgeheugenhits |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-hulpfuncties voor agentschema, pad en transacties voor first-party runtime |
    | `plugin-sdk/cron-store-runtime` | Hulpfuncties voor Cron-storepad/laden/opslaan |
    | `plugin-sdk/state-paths` | Hulpfuncties voor state-/OAuth-mappaden |
    | `plugin-sdk/plugin-state-runtime` | Plugin-sidecar SQLite keyed-state-typen plus gecentraliseerde connection-pragma en WAL-onderhoudssetup voor plugin-owned databases |
    | `plugin-sdk/routing` | Hulpfuncties voor route-/sessiesleutel-/accountbinding, zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde hulpfuncties voor kanaal-/accountstatussamenvattingen, standaardwaarden voor runtime-state en metadatahulpfuncties voor issues |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde hulpfuncties voor targetresolver |
    | `plugin-sdk/string-normalization-runtime` | Hulpfuncties voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | String-URL's extraheren uit fetch-/request-achtige invoer |
    | `plugin-sdk/run-command` | Getimede opdrachtrunner met genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Gemeenschappelijke paramlezers voor tools/CLI |
    | `plugin-sdk/tool-plugin` | Definieer een eenvoudige getypeerde agent-toolplugin en stel statische metadata beschikbaar voor manifestgeneratie |
    | `plugin-sdk/tool-payload` | Genormaliseerde payloads extraheren uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Canonieke velden voor verzenddoel extraheren uit toolargs |
    | `plugin-sdk/sandbox` | Sandbox-backendtypen en hulpfuncties voor SSH-/OpenShell-opdrachten, inclusief fail-fast preflight voor exec-opdrachten |
    | `plugin-sdk/temp-path` | Gedeelde hulpfuncties voor temp-downloadpaden en privé beveiligde tijdelijke werkruimten |
    | `plugin-sdk/logging-core` | Subsystemlogger en redactiehulpfuncties |
    | `plugin-sdk/markdown-table-runtime` | Hulpfuncties voor Markdown-tabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Hulpfuncties voor model-/sessie-override, zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hulpfuncties voor resolutie van Talk-providerconfiguratie |
    | `plugin-sdk/json-store` | Kleine hulpfuncties voor lezen/schrijven van JSON-state |
    | `plugin-sdk/json-unsafe-integers` | JSON-parsinghulpfuncties die onveilige integerliterals als strings behouden |
    | `plugin-sdk/file-lock` | Re-entrant hulpfuncties voor bestandsvergrendeling |
    | `plugin-sdk/persistent-dedupe` | Schijfondersteunde hulpfuncties voor dedupe-cache |
    | `plugin-sdk/acp-runtime` | ACP-hulpfuncties voor runtime/sessie en reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht ACP-hulpfuncties voor backendregistratie en reply-dispatch voor bij opstarten geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Alleen-lezen ACP-bindingsresolutie zonder lifecycle-startupimports |
    | `plugin-sdk/agent-config-primitives` | Smalle primitives voor agentschema-runtimeconfiguratie |
    | `plugin-sdk/boolean-param` | Losse boolean-paramlezer |
    | `plugin-sdk/dangerous-name-runtime` | Hulpfuncties voor resolutie van gevaarlijke-naammatching |
    | `plugin-sdk/device-bootstrap` | Hulpfuncties voor apparaat-bootstrap en pairingtokens |
    | `plugin-sdk/extension-shared` | Gedeelde primitives voor passieve kanalen, status en ambient proxyhulpfuncties |
    | `plugin-sdk/models-provider-runtime` | Hulpfuncties voor `/models`-opdracht/providerantwoorden |
    | `plugin-sdk/skill-commands-runtime` | Hulpfuncties voor het weergeven van Skill-opdrachten |
    | `plugin-sdk/native-command-registry` | Hulpfuncties voor native opdrachtregister/build/serialisatie |
    | `plugin-sdk/agent-harness` | Experimentele trusted-plugin surface voor low-level agent-harnassen: harnastypen, hulpfuncties voor actieve-runsturing/afbreken, OpenClaw-toolbridgehulpfuncties, runtime-plan-toolbeleidshulpfuncties, classificatie van terminale uitkomsten, hulpfuncties voor opmaak/detail van toolvoortgang en hulpprogramma's voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Verouderde endpointdetectiefacade die eigendom is van de Z.AI-provider; gebruik de openbare API van de Z.AI-plugin |
    | `plugin-sdk/async-lock-runtime` | Proceslokale async-lockhulpfunctie voor kleine runtime-statebestanden |
    | `plugin-sdk/channel-activity-runtime` | Hulpfunctie voor kanaalactiviteitstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Hulpfunctie voor begrensde async-taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Hulpfuncties voor in-memory en persistent-backed dedupe-cache |
    | `plugin-sdk/delivery-queue-runtime` | Hulpfunctie voor het leegtrekken van uitgaande pending-delivery |
    | `plugin-sdk/file-access-runtime` | Veilige hulpfuncties voor lokale bestanden en paden van mediabronnen |
    | `plugin-sdk/heartbeat-runtime` | Hulpfuncties voor Heartbeat-wake, events en zichtbaarheid |
    | `plugin-sdk/number-runtime` | Hulpfunctie voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Hulpfuncties voor beveiligde tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Hulpfuncties voor systeemeventwachtrij |
    | `plugin-sdk/transport-ready-runtime` | Hulpfunctie om te wachten op transportgereedheid |
    | `plugin-sdk/exec-approvals-runtime` | Hulpfuncties voor exec-goedkeuringsbeleidsbestanden zonder de brede infra-runtimebarrel |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine hulpfuncties voor begrensde cache |
    | `plugin-sdk/diagnostic-runtime` | Hulpfuncties voor diagnostische vlaggen, events en tracecontext |
    | `plugin-sdk/error-runtime` | Foutgrafiek, opmaak, gedeelde hulpfuncties voor foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Omwikkelde fetch, proxy, EnvHttpProxyAgent-optie en hulpfuncties voor pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewuste runtime-fetch zonder proxy-/guarded-fetchimports |
    | `plugin-sdk/inline-image-data-url-runtime` | Hulpfuncties voor sanitizer en signatuursniffing van inline afbeeldingsdata-URL's zonder de brede mediaruntime-surface |
    | `plugin-sdk/response-limit-runtime` | Begrensde response-body-lezer zonder de brede mediaruntime-surface |
    | `plugin-sdk/session-binding-runtime` | Huidige conversatiebindingsstate zonder geconfigureerde bindingsrouting of pairingstores |
    | `plugin-sdk/session-store-runtime` | Hulpfuncties voor sessiestore zonder brede configuratieschrijfbewerkingen/onderhoudsimports |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-hulpfuncties voor agentschema, pad en transacties zonder lifecyclecontrols voor databases |
    | `plugin-sdk/context-visibility-runtime` | Contextzichtbaarheidsresolutie en aanvullende contextfiltering zonder brede configuratie-/securityimports |
    | `plugin-sdk/string-coerce-runtime` | Smalle hulpfuncties voor primitive record-/stringcoercion en normalisatie zonder Markdown-/loggingimports |
    | `plugin-sdk/host-runtime` | Hulpfuncties voor normalisatie van hostnaam en SCP-host |
    | `plugin-sdk/retry-runtime` | Hulpfuncties voor retryconfiguratie en retryrunner |
    | `plugin-sdk/agent-runtime` | Hulpfuncties voor agentmap/identiteit/werkruimte, inclusief `resolveAgentDir`, `resolveDefaultAgentDir` en verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Configuratiegestuurde directoryquery/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Mogelijkheids- en testsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor media ophalen/transformeren/opslaan, waaronder `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` en verouderde `fetchRemoteMedia`; geef de voorkeur aan opslaghelpers boven bufferlezingen wanneer een URL OpenClaw-media moet worden |
    | `plugin-sdk/media-mime` | Gerichte MIME-normalisatie, koppeling van bestandsextensies, MIME-detectie en helpers voor mediasoorten |
    | `plugin-sdk/media-store` | Gerichte mediastore-helpers zoals `saveMediaBuffer` en `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failover-helpers voor mediageneratie, kandidaatselectie en meldingen voor ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte helperexports voor beeld/audio/gestructureerde extractie |
    | `plugin-sdk/text-chunking` | Helpers voor tekst- en markdownchunking/rendering, conversie van markdown-tabellen, verwijderen van directive-tags en safe-text-hulpprogramma's |
    | `plugin-sdk/text-chunking` | Helper voor uitgaande tekstchunking |
    | `plugin-sdk/speech` | Speech-providertypen plus providergerichte exports voor directives, registry, validatie, OpenAI-compatibele TTS-builder en speech-helpers |
    | `plugin-sdk/speech-core` | Gedeelde speech-providertypen, registry, directive, normalisatie en speech-helperexports |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registry-helpers en gedeelde helper voor WebSocket-sessies |
    | `plugin-sdk/realtime-bootstrap-context` | Realtime profielbootstrap-helper voor begrensde contextinjectie van `IDENTITY.md`, `USER.md` en `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime voice, registry-helpers en gedeelde helpers voor realtime voice-gedrag, inclusief tracking van uitvoeractiviteit |
    | `plugin-sdk/image-generation` | Providertypen voor beeldgeneratie plus helpers voor beeldassets/data-URL's en de OpenAI-compatibele beeldproviderbuilder |
    | `plugin-sdk/image-generation-core` | Gedeelde typen, failover, auth en registry-helpers voor beeldgeneratie |
    | `plugin-sdk/music-generation` | Provider-, aanvraag- en resultaattypen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen voor muziekgeneratie, failover-helpers, provideropzoeking en parsing van model-ref |
    | `plugin-sdk/video-generation` | Provider-, aanvraag- en resultaattypen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failover-helpers, provideropzoeking en parsing van model-ref |
    | `plugin-sdk/transcripts` | Gedeelde providertypen voor transcriptbronnen, registry-helpers, sessiebeschrijvingen en uitingsmetadata |
    | `plugin-sdk/webhook-targets` | Webhook-doelregistry en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gedeelde helpers voor het laden van externe/lokale media |
    | `plugin-sdk/zod` | Verouderde compatibiliteits-re-export; importeer `zod` rechtstreeks uit `zod` |
    | `plugin-sdk/testing` | Repo-lokale verouderde compatibiliteitsbarrel voor legacy OpenClaw-tests. Nieuwe repotests moeten in plaats daarvan gerichte lokale testsubpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale `createTestPluginApi`-helper voor unit tests voor directe Plugin-registratie zonder repo-testhelperbruggen te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale contractfixtures voor native agent-runtime-adapters voor auth-, delivery-, fallback-, tool-hook-, prompt-overlay-, schema- en transcriptprojectietests |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanaalgerichte testhelpers voor generieke acties/setup/statuscontracten, directory-asserties, opstartlevenscyclus van accounts, send-config-threading, runtime-mocks, statusproblemen, uitgaande delivery en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gedeelde suite voor foutgevallen bij doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale contracthelpers voor Plugin-pakketten, registratie, openbare artefacten, directe imports, runtime-API en import-side-effects |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale contracthelpers voor provider-runtime, auth, discovery, onboard, catalog, wizard, mediamogelijkheden, replaybeleid, realtime STT live-audio, web-search/fetch en stream |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` uitvoeren |
    | `plugin-sdk/test-fixtures` | Repo-lokale generieke fixtures voor CLI-runtime-capture, sandboxcontext, skill-writer, agent-message, system-event, module-reload, gebundeld Plugin-pad, terminal-text, chunking, auth-token en typed-case |
    | `plugin-sdk/test-node-mocks` | Repo-lokale gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Geheugensubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager/config/file/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/-zoekfunctie |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lichtgewicht registry-helpers voor providers van geheugenembeddings |
    | `plugin-sdk/memory-core-host-engine-foundation` | Engine-exports voor memory host foundation |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contracten voor memory host embeddings, registry-toegang, lokale provider en generieke batch-/remote-helpers. `registerMemoryEmbeddingProvider` op dit oppervlak is verouderd; gebruik de generieke embeddingprovider-API voor nieuwe providers. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Engine-exports voor memory host QMD |
    | `plugin-sdk/memory-core-host-engine-storage` | Engine-exports voor memory host storage |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale memory host-helpers |
    | `plugin-sdk/memory-core-host-query` | Queryhelpers voor memory host |
    | `plugin-sdk/memory-core-host-secret` | Secret-helpers voor memory host |
    | `plugin-sdk/memory-core-host-events` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehelpers voor memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor memory host |
    | `plugin-sdk/memory-host-core` | Leverancieronafhankelijke alias voor core-runtimehelpers van memory host |
    | `plugin-sdk/memory-host-events` | Leverancieronafhankelijke alias voor event-journal-helpers van memory host |
    | `plugin-sdk/memory-host-files` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-helpers voor plugins rond geheugen |
    | `plugin-sdk/memory-host-search` | Active Memory-runtimefacade voor toegang tot search-manager |
    | `plugin-sdk/memory-host-status` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Gereserveerde subpaden voor gebundelde helpers">
    Gereserveerde gebundelde-helper-SDK-subpaden zijn smalle eigenaarspecifieke oppervlakken voor
    gebundelde Plugin-code. Ze worden bijgehouden in de SDK-inventaris zodat pakketbuilds
    en aliasing deterministisch blijven, maar het zijn geen algemene API's
    voor Plugin-ontwikkeling. Nieuwe herbruikbare hostcontracten moeten generieke SDK-subpaden gebruiken,
    zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en
    `plugin-sdk/plugin-config-runtime`.

    | Subpad | Eigenaar en doel |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Gebundelde Codex-Plugin-helper voor het projecteren van MCP-serverconfiguratie van gebruikers naar Codex app-server-threadconfiguratie |
    | `plugin-sdk/codex-native-task-runtime` | Gebundelde Codex-Plugin-helper voor het spiegelen van native Codex app-server-subagents naar OpenClaw-taakstatus |

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Installatie van Plugin SDK](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
