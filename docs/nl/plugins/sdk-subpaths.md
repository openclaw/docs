---
read_when:
    - Het juiste plugin-sdk-subpad kiezen voor een pluginimport
    - Auditen van gebundelde Plugin-subpaden en helperoppervlakken
summary: 'Plugin SDK-subpadcatalogus: welke imports waar thuishoren, gegroepeerd per gebied'
title: Plugin SDK-subpaden
x-i18n:
    generated_at: "2026-04-30T09:40:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  De plugin-SDK wordt beschikbaar gesteld als een set smalle subpaden onder `openclaw/plugin-sdk/`.
  Deze pagina catalogiseert de veelgebruikte subpaden, gegroepeerd op doel. De gegenereerde
  volledige lijst met 200+ subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`;
  gereserveerde helper-subpaden voor gebundelde plugins verschijnen daar, maar zijn een implementatiedetail
  tenzij een documentatiepagina ze expliciet promoot. Maintainers kunnen actieve
  gereserveerde helper-subpaden controleren met `pnpm plugins:boundary-report:summary`; ongebruikte
  gereserveerde helper-exports laten het CI-rapport falen in plaats van in de openbare SDK
  te blijven staan als slapende compatibiliteitsschuld.

  Zie voor de gids voor het maken van plugins [Plugin-SDK-overzicht](/nl/plugins/sdk-overview).

  ## Plugin-ingang

  | Subpad                                    | Belangrijkste exports                                                                                                                                                            |
  | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                              |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                           |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                                 |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                                |
  | `plugin-sdk/testing`                      | Brede compatibiliteitsbarrel voor verouderde plugintests; geef voor nieuwe extensietests de voorkeur aan gerichte testsubpaden                                                    |
  | `plugin-sdk/plugin-test-api`              | Minimale mockbuilder voor `OpenClawPluginApi` voor directe unit-tests voor pluginregistratie                                                                                      |
  | `plugin-sdk/agent-runtime-test-contracts` | Native agent-runtime-adaptercontractfixtures voor auth-profielen, leveringsonderdrukking, fallbackclassificatie, tool hooks, prompt-overlays, schema's en transcriptreparatie     |
  | `plugin-sdk/channel-test-helpers`         | Testhelpers voor kanaalaccountlevenscyclus, directory, send-config, runtime-mock, hook, gebundelde kanaalingang, enveloptimestamp, koppelingsantwoord en generiek kanaalcontract |
  | `plugin-sdk/channel-target-testing`       | Gedeelde testsuite voor foutgevallen bij doelresolutie van kanalen                                                                                                                |
  | `plugin-sdk/plugin-test-contracts`        | Contracthelpers voor pluginregistratie, pakketmanifest, openbaar artefact, runtime-API, importbijwerking en directe import                                                       |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures voor tests van plugin-runtime, registry, providerregistratie, setup-wizard en runtime-taakstroom                                                                         |
  | `plugin-sdk/provider-test-contracts`      | Contracthelpers voor provider-runtime, auth, discovery, onboarden, catalogus, mediacapability, replaybeleid, realtime STT-live-audio, web-search/fetch en wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in Vitest HTTP-/auth-mocks voor providertests die `plugin-sdk/provider-http` oefenen                                                                                         |
  | `plugin-sdk/test-env`                     | Fixtures voor testomgeving, fetch/netwerk, wegwerp-HTTP-server, inkomend verzoek, live-test, tijdelijk bestandssysteem en tijdregeling                                           |
  | `plugin-sdk/test-fixtures`                | Generieke fixtures voor CLI, sandbox, skill, agentbericht, systeemgebeurtenis, moduleherlading, gebundeld pluginpad, terminal, chunking, auth-token en getypeerde cases          |
  | `plugin-sdk/test-node-mocks`              | Gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest `vi.mock("node:*")`-factories                                                                       |
  | `plugin-sdk/migration`                    | Helpers voor migratieprovideritems zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactiehelpers en `summarizeMigrationItems`                             |
  | `plugin-sdk/migration-runtime`            | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                             |

  <AccordionGroup>
  <Accordion title="Kanaalsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema-export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde setup-wizardhelpers, allowlist-prompts, builders voor setupstatus |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor multi-accountconfiguratie/action-gates, fallbackhelpers voor standaardaccounts |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers voor account-id-normalisatie |
    | `plugin-sdk/account-resolution` | Accountopzoeking + helpers voor standaard-fallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten/accountacties |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde kanaalconfiguratieschema-primitieven en generieke builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor configuratieschema's van gebundelde kanalen |
    | `plugin-sdk/telegram-command-config` | Telegram-helpers voor normalisatie/validatie van aangepaste opdrachten met fallback voor gebundeld contract |
    | `plugin-sdk/command-gating` | Smalle helpers voor opdracht-autorisatiegates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helpers voor levenscyclus/finalisatie van conceptstreams |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inkomende route + envelopbuilder |
    | `plugin-sdk/inbound-reply-dispatch` | Gedeelde helpers voor vastleggen en dispatchen van inkomende records |
    | `plugin-sdk/messaging-targets` | Helpers voor doelparsing/-matching |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor het laden van uitgaande media |
    | `plugin-sdk/outbound-send-deps` | Lichtgewicht opzoeking van uitgaande verzendafhankelijkheden voor kanaaladapters |
    | `plugin-sdk/outbound-runtime` | Helpers voor uitgaande levering, identiteit, verzenddelegate, sessie, formatting en payloadplanning |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor poll-normalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor levenscyclus en adapters van thread-bindings |
    | `plugin-sdk/agent-media-payload` | Verouderde builder voor agent-mediapayloads |
    | `plugin-sdk/conversation-runtime` | Helpers voor conversatie-/threadbinding, koppeling en geconfigureerde bindingen |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor runtimeconfiguratie-snapshot |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtime-groepsbeleidresolutie |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatussnapshot/-samenvatting |
    | `plugin-sdk/channel-config-primitives` | Smalle kanaalconfiguratieschema-primitieven |
    | `plugin-sdk/channel-config-writes` | Helpers voor autorisatie van kanaalconfiguratieschrijfacties |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor het bewerken/lezen van allowlist-configuratie |
    | `plugin-sdk/group-access` | Gedeelde helpers voor beslissingen over groepstoegang |
    | `plugin-sdk/direct-dm` | Gedeelde helpers voor direct-DM-auth/guards |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarcompatibiliteit; nieuwe plugins moeten generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor bijgehouden eigenaarcompatibiliteit; nieuwe plugins moeten geinjecteerde runtimehelpers of generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/zalouser` | Verouderde Zalo Personal-compatibiliteitsfacade voor gepubliceerde Lark/Zalo-pakketten die nog steeds autorisatie voor afzenderopdrachten importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Helpers voor semantische berichtpresentatie, levering en verouderde interactieve antwoorden. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibiliteitsbarrel voor inkomende debounce, mention-matching, mention-beleidshelpers en envelophelpers |
    | `plugin-sdk/channel-inbound-debounce` | Smalle helpers voor inkomende debounce |
    | `plugin-sdk/channel-mention-gating` | Smalle helpers voor mention-beleid, mention-markering en mention-tekst zonder het bredere inkomende runtime-oppervlak |
    | `plugin-sdk/channel-envelope` | Smalle helpers voor het formatteren van inkomende enveloppen |
    | `plugin-sdk/channel-location` | Kanaallocatiecontext en formattinghelpers |
    | `plugin-sdk/channel-logging` | Helpers voor kanaallogging bij inkomende drops en typ-/ack-fouten |
    | `plugin-sdk/channel-send-result` | Antwoordresultaattypen |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die behouden blijven voor plugincompatibiliteit |
    | `plugin-sdk/channel-route` | Gedeelde helpers voor routenormalisatie, parsergestuurde doelresolutie, stringificatie van thread-id's, dedupe/compacte routesleutels, geparste doeltypen en route-/doelvergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor doelparsing; aanroepers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Feedback-/reactiebedrading |
    | `plugin-sdk/channel-secret-runtime` | Smalle secret-contracthelpers zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en secret-doeltypen |
  </Accordion>

  <Accordion title="Provider-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor installatie, catalogusdetectie en runtime-modelvoorbereiding |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor standaardwaarden van lokale servers, modeldetectie, requestheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Samengestelde helpers voor het instellen van lokale/zelfgehoste providers |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele helpers voor het instellen van zelfgehoste providers |
    | `plugin-sdk/cli-backend` | Standaardwaarden voor de CLI-backend + watchdog-constanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-helpers voor API-sleutelresolutie voor provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor API-sleutel-onboarding/profielschrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaard OAuth-auth-result-builder |
    | `plugin-sdk/provider-auth-login` | Gedeelde interactieve loginhelpers voor provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Helpers voor het opzoeken van provider-auth-env-vars |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde builders voor replaybeleid, provider-endpointhelpers en helpers voor model-id-normalisatie, zoals `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-hook voor uitbreiding van providercatalogus en Plugin-providerregistry-seams voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke provider-HTTP-/endpoint-capabilityhelpers, provider-HTTP-fouten en multipart-formulierhelpers voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle web-fetch-config-/selectiecontracthelpers, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers voor registratie/cache van web-fetch-providers |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle web-search-config-/credentialhelpers voor providers die geen bedrading voor Plugin-inschakeling nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle web-search-config-/credentialcontracthelpers, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped credential-setters/getters |
    | `plugin-sdk/provider-web-search` | Helpers voor registratie/cache/runtime van web-search-providers |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-schemacleanup + diagnostics, en xAI-compathelpers zoals `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` en vergelijkbaar |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, streamwrappertypen en gedeelde Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-wrapperhelpers |
    | `plugin-sdk/provider-transport-runtime` | Native providertransporthelpers, zoals guarded fetch, transportberichttransformaties en schrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor onboarding-configpatches |
    | `plugin-sdk/global-singleton` | Proceslokale singleton-/map-/cachehelpers |
    | `plugin-sdk/group-activation` | Smalle helpers voor groepsactivatiemodus en opdrachtparsing |
  </Accordion>

  <Accordion title="Auth- en beveiligingssubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers voor commandoregistry inclusief dynamische argumentmenu-opmaak, helpers voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Builders voor opdracht-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeurderresolutie en action-auth in dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Helpers voor native exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor goedkeuringscapability/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde helper voor goedkeurings-Gateway-resolutie |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor hot channel-entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-seams wanneer die voldoende zijn |
    | `plugin-sdk/approval-native-runtime` | Helpers voor native goedkeuringsdoel + accountbinding |
    | `plugin-sdk/approval-reply-runtime` | Helpers voor exec-/Plugin-goedkeuringsreplypayloads |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/Plugin-goedkeuringspayloads, native goedkeuringsrouting-/runtimehelpers en helpers voor gestructureerde goedkeuringsweergave, zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle resethelpers voor dedupe van inkomende replies |
    | `plugin-sdk/channel-contract-testing` | Smalle helpers voor kanaalcontracttests zonder de brede testing-barrel |
    | `plugin-sdk/command-auth-native` | Native commando-auth, dynamische argumentmenu-opmaak en native sessiedoelhelpers |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor commandodetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht commandotekstpredicaten voor hot channel-paden |
    | `plugin-sdk/command-surface` | Helpers voor command-body-normalisatie en command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contractverzameling voor secret-oppervlakken van kanalen/Plugins |
    | `plugin-sdk/secret-ref-runtime` | Smalle `coerceSecretRef`- en SecretRef-typinghelpers voor parsing van secret-contract/config |
    | `plugin-sdk/security-runtime` | Gedeelde helpers voor trust, DM-gating, externe content, redactie van gevoelige tekst, constant-time secretvergelijking en secretverzameling |
    | `plugin-sdk/ssrf-policy` | Helpers voor hostallowlist en private-network SSRF-beleid |
    | `plugin-sdk/ssrf-dispatcher` | Smalle pinned-dispatcher-helpers zonder het brede infra-runtimeoppervlak |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF-fout en SSRF-beleidshelpers |
    | `plugin-sdk/secret-input` | Helpers voor het parsen van secret-invoer |
    | `plugin-sdk/webhook-ingress` | Webhook-request-/targethelpers en coercion van raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helpers voor grootte/time-out van requestbody |
  </Accordion>

  <Accordion title="Runtime- en opslag-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede helpers voor runtime/logging/back-up/plugin-installatie |
    | `plugin-sdk/runtime-env` | Gerichte helpers voor runtime-env, logger, timeout, retry en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratie-facade voor genormaliseerde profielinstellingen/standaardwaarden, CDP-URL-parsing en helpers voor browser-control-authenticatie |
    | `plugin-sdk/channel-runtime-context` | Generieke helpers voor registratie en lookup van runtime-context voor kanalen |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor plugin-opdrachten, hooks, http en interactief gebruik |
    | `plugin-sdk/hook-runtime` | Gedeelde helpers voor Webhook/interne hook-pipeline |
    | `plugin-sdk/lazy-runtime` | Helpers voor lazy runtime-imports/bindings, zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers voor procesuitvoering |
    | `plugin-sdk/cli-runtime` | Helpers voor CLI-opmaak, wachten, versie, argument-invocatie en lazy opdrachtgroepen |
    | `plugin-sdk/gateway-runtime` | Gateway-client, starthelper voor event-loop-ready client, gateway CLI RPC, gateway-protocolfouten en helpers voor channel-status-patches |
    | `plugin-sdk/config-types` | Type-only configuratieoppervlak voor plugin-configuratievormen zoals `OpenClawConfig` en configuratietypen voor kanalen/providers |
    | `plugin-sdk/plugin-config-runtime` | Runtime-lookuphelpers voor plugin-configuratie, zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele helpers voor configuratiemutatie, zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Snapshothelpers voor configuratie van het huidige proces, zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en setters voor testsnapshots |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-opdrachtnamen/-beschrijvingen en controles op duplicaten/conflicten, zelfs wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van autolinks voor bestandsverwijzingen zonder de brede text-runtime-barrel |
    | `plugin-sdk/approval-runtime` | Helpers voor exec/plugin-goedkeuring, builders voor goedkeuringsmogelijkheden, auth/profielhelpers, native routing/runtime-helpers en gestructureerde opmaak van weergavepaden voor goedkeuringen |
    | `plugin-sdk/reply-runtime` | Gedeelde runtime-helpers voor inkomend verkeer/antwoorden, chunking, dispatch, Heartbeat, antwoordplanner |
    | `plugin-sdk/reply-dispatch-runtime` | Gerichte helpers voor antwoorddispatch/finalisatie en gesprekslabels |
    | `plugin-sdk/reply-history` | Gedeelde helpers en markeringen voor antwoordgeschiedenis met kort venster, zoals `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Gerichte helpers voor tekst/markdown-chunking |
    | `plugin-sdk/session-store-runtime` | Helpers voor session-store-pad, sessiesleutel, updated-at en store-mutatie |
    | `plugin-sdk/cron-store-runtime` | Helpers voor Cron-store-pad/laden/opslaan |
    | `plugin-sdk/state-paths` | Helpers voor State/OAuth-map-paden |
    | `plugin-sdk/routing` | Helpers voor route/sessiesleutel/accountbinding, zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde helpers voor statusoverzichten van kanalen/accounts, standaardwaarden voor runtime-status en issue-metadatahelpers |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde helpers voor target-resolvers |
    | `plugin-sdk/string-normalization-runtime` | Helpers voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | String-URL's extraheren uit fetch/request-achtige invoer |
    | `plugin-sdk/run-command` | Opdrachtrunner met timing en genormaliseerde stdout/stderr-resultaten |
    | `plugin-sdk/param-readers` | Algemene param-readers voor tools/CLI |
    | `plugin-sdk/tool-payload` | Genormaliseerde payloads extraheren uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Canonieke velden voor verzenddoelen extraheren uit tool-args |
    | `plugin-sdk/temp-path` | Gedeelde helpers voor temp-downloadpaden |
    | `plugin-sdk/logging-core` | Subsystem-logger en redactiehelpers |
    | `plugin-sdk/markdown-table-runtime` | Helpers voor markdown-tabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Helpers voor model-/sessie-override, zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers voor configuratieresolutie van Talk-providers |
    | `plugin-sdk/json-store` | Kleine helpers voor lezen/schrijven van JSON-status |
    | `plugin-sdk/file-lock` | Helpers voor herintredende bestandslocks |
    | `plugin-sdk/persistent-dedupe` | Helpers voor dedupe-cache op schijf |
    | `plugin-sdk/acp-runtime` | ACP-runtime/sessie en helpers voor antwoorddispatch |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht ACP-backendregistratie en helpers voor antwoorddispatch voor bij startup geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only ACP-bindingsresolutie zonder imports voor lifecycle-startup |
    | `plugin-sdk/agent-config-primitives` | Gerichte primitieven voor agent-runtime-configuratieschema |
    | `plugin-sdk/boolean-param` | Losse boolean-param-reader |
    | `plugin-sdk/dangerous-name-runtime` | Helpers voor resolutie van dangerous-name-matching |
    | `plugin-sdk/device-bootstrap` | Helpers voor device-bootstrap en pairingtokens |
    | `plugin-sdk/extension-shared` | Gedeelde primitieven voor passive-channel, status en ambient-proxy-helpers |
    | `plugin-sdk/models-provider-runtime` | Helpers voor `/models`-opdracht/provider-antwoord |
    | `plugin-sdk/skill-commands-runtime` | Helpers voor het weergeven van Skill-opdrachten |
    | `plugin-sdk/native-command-registry` | Helpers voor native-opdrachtregister/build/serialisatie |
    | `plugin-sdk/agent-harness` | Experimenteel trusted-plugin-oppervlak voor low-level agent-harnassen: harnastypen, helpers voor actieve run sturen/afbreken, OpenClaw-toolbridgehelpers, helpers voor runtime-plan-toolbeleid, classificatie van terminaluitkomsten, helpers voor voortgangsopmaak/details van tools en utilities voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Helpers voor detectie van Z.AI-endpoints |
    | `plugin-sdk/async-lock-runtime` | Proceslokale async-lock-helper voor kleine runtime-statusbestanden |
    | `plugin-sdk/channel-activity-runtime` | Helper voor telemetrie van kanaalactiviteit |
    | `plugin-sdk/concurrency-runtime` | Helper voor begrensde async-taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Helpers voor dedupe-cache in geheugen |
    | `plugin-sdk/delivery-queue-runtime` | Helper voor het leegwerken van uitgaande pending-delivery |
    | `plugin-sdk/file-access-runtime` | Helpers voor veilige lokale-bestands- en media-source-paden |
    | `plugin-sdk/heartbeat-runtime` | Helpers voor Heartbeat-events en zichtbaarheid |
    | `plugin-sdk/number-runtime` | Helper voor numerieke coercie |
    | `plugin-sdk/secure-random-runtime` | Helpers voor veilige tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Helpers voor systeem-eventqueue |
    | `plugin-sdk/transport-ready-runtime` | Helper voor wachten op transportgereedheid |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine helpers voor begrensde caches |
    | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostische vlaggen, events en trace-context |
    | `plugin-sdk/error-runtime` | Error-graph, opmaak, gedeelde helpers voor foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrapte fetch, proxy, EnvHttpProxyAgent-optie en pinned lookup-helpers |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime-fetch zonder proxy-/guarded-fetch-imports |
    | `plugin-sdk/response-limit-runtime` | Begrensde response-body-reader zonder het brede media-runtime-oppervlak |
    | `plugin-sdk/session-binding-runtime` | Huidige status van gespreksbinding zonder geconfigureerde bindingsrouting of pairing-stores |
    | `plugin-sdk/session-store-runtime` | Session-store-helpers zonder brede imports voor configuratiewrites/onderhoud |
    | `plugin-sdk/context-visibility-runtime` | Resolutie van contextzichtbaarheid en aanvullende contextfiltering zonder brede config-/security-imports |
    | `plugin-sdk/string-coerce-runtime` | Gerichte helpers voor primitive-record-/stringcoercie en normalisatie zonder markdown-/logging-imports |
    | `plugin-sdk/host-runtime` | Helpers voor normalisatie van hostnamen en SCP-hosts |
    | `plugin-sdk/retry-runtime` | Helpers voor retry-configuratie en retry-runner |
    | `plugin-sdk/agent-runtime` | Helpers voor agent-map/identiteit/werkruimte |
    | `plugin-sdk/directory-runtime` | Config-backed directory-query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability and testing subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor media ophalen/transformeren/opslaan, door ffprobe ondersteunde detectie van videodimensies en builders voor mediapayloads |
    | `plugin-sdk/media-store` | Smalle mediastore-helpers zoals `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failover-helpers voor mediageneratie, kandidaatselectie en meldingen over ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte exports van helpers voor afbeeldingen/audio |
    | `plugin-sdk/text-runtime` | Gedeelde helpers voor tekst/markdown/logging, zoals het strippen van voor de assistent zichtbare tekst, helpers voor markdown-rendering/chunking/tabellen, redactiehelpers, helpers voor directive-tags en hulpprogramma's voor veilige tekst |
    | `plugin-sdk/text-chunking` | Helper voor chunking van uitgaande tekst |
    | `plugin-sdk/speech` | Speech-providertypen plus providergerichte exports voor directives, registry, validatie, OpenAI-compatibele TTS-builder en speech-helpers |
    | `plugin-sdk/speech-core` | Gedeelde speech-providertypen, registry, directive, normalisatie en exports van speech-helpers |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registry-helpers en gedeelde helper voor WebSocket-sessies |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime stem en registry-helpers |
    | `plugin-sdk/image-generation` | Providertypen voor afbeeldingsgeneratie plus helpers voor afbeeldingsassets/data-URL's en de OpenAI-compatibele image-provider-builder |
    | `plugin-sdk/image-generation-core` | Gedeelde typen voor afbeeldingsgeneratie, failover, authenticatie en registry-helpers |
    | `plugin-sdk/music-generation` | Providertypen/verzoektypen/resultaattypen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen voor muziekgeneratie, failover-helpers, providerlookup en parsing van modelreferenties |
    | `plugin-sdk/video-generation` | Providertypen/verzoektypen/resultaattypen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failover-helpers, providerlookup en parsing van modelreferenties |
    | `plugin-sdk/webhook-targets` | Webhook-doelregistry en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Helpers voor normalisatie van Webhook-paden |
    | `plugin-sdk/web-media` | Gedeelde helpers voor het laden van externe/lokale media |
    | `plugin-sdk/zod` | Opnieuw geëxporteerde `zod` voor gebruikers van de Plugin SDK |
    | `plugin-sdk/testing` | Breed compatibiliteitsbarrel voor verouderde Plugin-tests. Nieuwe extensietests moeten in plaats daarvan gerichte SDK-subpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Minimale `createTestPluginApi`-helper voor directe unit-tests van Plugin-registratie zonder repo-testhelperbridges te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Native contractfixtures voor agent-runtime-adapters voor tests van authenticatie, levering, fallback, tool-hook, prompt-overlay, schema en transcriptprojectie |
    | `plugin-sdk/channel-test-helpers` | Kanaalgerichte testhelpers voor generieke acties/setup/statuscontracten, directory-asserties, levenscyclus van accountopstart, send-config-threading, runtimemocks, statusproblemen, uitgaande levering en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Gedeelde suite met foutgevallen voor doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Helpers voor contracten rond Plugin-pakketten, registratie, publieke artefacten, directe imports, runtime-API en import-side-effects |
    | `plugin-sdk/provider-test-contracts` | Helpers voor contracten rond providerruntime, authenticatie, discovery, onboarding, catalogus, wizard, mediacapability, replaybeleid, realtime STT-liveaudio, web-search/fetch en streams |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` testen |
    | `plugin-sdk/test-fixtures` | Generieke fixtures voor CLI-runtimecapture, sandboxcontext, skill-writer, agent-message, system-event, modulereload, gebundeld Plugin-pad, terminaltekst, chunking, auth-token en getypeerde cases |
    | `plugin-sdk/test-node-mocks` | Gerichte helpers voor Node-builtin-mocks voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Memory subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager/config/bestand/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/zoeken |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports van memory-host-foundation-engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embeddingcontracten voor memory host, registry-toegang, lokale provider en generieke batch-/remote-helpers |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports van memory-host-QMD-engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports van memory-host-storage-engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor memory host |
    | `plugin-sdk/memory-core-host-query` | Queryhelpers voor memory host |
    | `plugin-sdk/memory-core-host-secret` | Geheimhelpers voor memory host |
    | `plugin-sdk/memory-core-host-events` | Helpers voor eventjournals van memory host |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehelpers voor memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor memory host |
    | `plugin-sdk/memory-host-core` | Leveranciersneutrale alias voor core-runtimehelpers van memory host |
    | `plugin-sdk/memory-host-events` | Leveranciersneutrale alias voor eventjournalhelpers van memory host |
    | `plugin-sdk/memory-host-files` | Leveranciersneutrale alias voor bestands-/runtimehelpers van memory host |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-helpers voor geheugengerelateerde Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-runtimefacade voor toegang tot de search-manager |
    | `plugin-sdk/memory-host-status` | Leveranciersneutrale alias voor statushelpers van memory host |
  </Accordion>

  <Accordion title="Reserved bundled-helper subpaths">
    Er zijn momenteel geen gereserveerde gebundelde-helper-SDK-subpaden. Eigenaarsspecifieke
    helpers staan in het eigenaar-Plugin-pakket, terwijl herbruikbare hostcontracten
    generieke SDK-subpaden gebruiken zoals `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Plugin SDK instellen](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
