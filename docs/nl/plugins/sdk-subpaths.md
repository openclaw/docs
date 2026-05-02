---
read_when:
    - Het juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Subpaden en helperinterfaces van gebundelde Plugins controleren
summary: 'Plugin SDK-subpadcatalogus: welke imports zich waar bevinden, gegroepeerd per gebied'
title: Plugin SDK-subpaden
x-i18n:
    generated_at: "2026-05-02T20:57:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  De Plugin SDK wordt beschikbaar gesteld als een reeks smalle subpaden onder `openclaw/plugin-sdk/`.
  Deze pagina catalogiseert de veelgebruikte subpaden, gegroepeerd op doel. De gegenereerde
  volledige lijst met meer dan 200 subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`;
  gereserveerde hulpsubpaden voor gebundelde plugins verschijnen daar, maar zijn een implementatiedetail
  tenzij een documentatiepagina ze expliciet promoot. Maintainers kunnen actieve
  gereserveerde hulpsubpaden controleren met `pnpm plugins:boundary-report:summary`; ongebruikte
  gereserveerde hulpexports laten het CI-rapport falen in plaats van als slapende compatibiliteitsschuld
  in de openbare SDK te blijven.

  Zie [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview) voor de handleiding voor Plugin-auteurs.

  ## Plugin-ingang

  | Subpad                                    | Belangrijkste exports                                                                                                                                                                      |
  | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                                        |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`                     |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                                           |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                                          |
  | `plugin-sdk/testing`                      | Brede compatibiliteitsbarrel voor verouderde plugintests; geef voor nieuwe extensietests de voorkeur aan gerichte testsubpaden                                                              |
  | `plugin-sdk/plugin-test-api`              | Minimale mock-builder voor `OpenClawPluginApi` voor unit-tests met directe pluginregistratie                                                                                               |
  | `plugin-sdk/agent-runtime-test-contracts` | Native contractfixtures voor agent-runtime-adapters voor auth-profielen, onderdrukking van levering, fallbackclassificatie, toolhooks, prompt-overlays, schema's en transcriptreparatie     |
  | `plugin-sdk/channel-test-helpers`         | Testhelpers voor kanaalaccountlevenscyclus, directory, verzendconfiguratie, runtime-mock, hook, gebundelde kanaalingang, enveloptijdstempel, koppelingsantwoord en generiek kanaalcontract |
  | `plugin-sdk/channel-target-testing`       | Gedeelde testsuite voor foutgevallen bij kanaaldoelresolutie                                                                                                                               |
  | `plugin-sdk/plugin-test-contracts`        | Contracthelpers voor pluginregistratie, pakketmanifest, openbaar artefact, runtime-API, import-side-effect en directe import                                                               |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures voor plugintests voor pluginruntime, register, providerregistratie, installatiewizard en runtime-taakstroom                                                                       |
  | `plugin-sdk/provider-test-contracts`      | Contracthelpers voor providerruntime, auth, ontdekking, onboarding, catalogus, mediacapaciteit, replaybeleid, realtime STT live-audio, web-search/fetch en wizard                         |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` oefenen                                                                                                    |
  | `plugin-sdk/test-env`                     | Fixtures voor testomgeving, fetch/netwerk, wegwerpbare HTTP-server, inkomende aanvraag, live-test, tijdelijk bestandssysteem en tijdsbesturing                                             |
  | `plugin-sdk/test-fixtures`                | Generieke testfixtures voor CLI, sandbox, skill, agentbericht, systeemgebeurtenis, moduleherlaad, gebundeld pluginpad, terminal, chunking, auth-token en getypeerde case                  |
  | `plugin-sdk/test-node-mocks`              | Gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest `vi.mock("node:*")`-factories                                                                                 |
  | `plugin-sdk/migration`                    | Helpers voor migratieprovideritems zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactietools en `summarizeMigrationItems`                                         |
  | `plugin-sdk/migration-runtime`            | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                                        |

  <AccordionGroup>
  <Accordion title="Kanaalsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export van het Zod-schema voor root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde helpers voor installatiewizards, allowlist-prompts en bouwers voor installatiestatus |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor multi-accountconfiguratie en actiegates, fallbackhelpers voor standaardaccounts |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, normalisatiehelpers voor account-id's |
    | `plugin-sdk/account-resolution` | Helpers voor accountzoekopdrachten en standaardfallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten en accountacties |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde schema-primitieven voor kanaalconfiguratie plus bouwers voor Zod en directe JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor configuratieschema's van gebundelde kanalen |
    | `plugin-sdk/telegram-command-config` | Normalisatie- en validatiehelpers voor aangepaste Telegram-commando's met fallback voor gebundelde contracten |
    | `plugin-sdk/command-gating` | Smalle helpers voor commando-autorisatiegates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, levenscyclus- en finalisatiehelpers voor conceptstreams |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inkomende routes en envelopbouwers |
    | `plugin-sdk/inbound-reply-dispatch` | Gedeelde helpers voor inkomende registratie en dispatch |
    | `plugin-sdk/messaging-targets` | Helpers voor doelparsing en -matching |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor het laden van uitgaande media |
    | `plugin-sdk/outbound-send-deps` | Lichtgewicht opzoeking van uitgaande verzendafhankelijkheden voor kanaaladapters |
    | `plugin-sdk/outbound-runtime` | Helpers voor uitgaande levering, identiteit, verzenddelegatie, sessie, opmaak en payloadplanning |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor pollnormalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor thread-bindinglevenscyclus en adapters |
    | `plugin-sdk/agent-media-payload` | Verouderde payloadbuilder voor agentmedia |
    | `plugin-sdk/conversation-runtime` | Helpers voor conversatie/thread-binding, koppeling en geconfigureerde binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor runtime-configuratiesnapshot |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtime-resolutie van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatussnapshot en -samenvatting |
    | `plugin-sdk/channel-config-primitives` | Smalle primitieven voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Autorisatiehelpers voor schrijfacties op kanaalconfiguratie |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor het bewerken en lezen van allowlist-configuratie |
    | `plugin-sdk/group-access` | Gedeelde helpers voor beslissingen over groepstoegang |
    | `plugin-sdk/direct-dm` | Gedeelde auth- en guardhelpers voor directe DM |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten geïnjecteerde runtimehelpers of generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/zalouser` | Verouderde compatibiliteitsfacade voor Zalo Personal voor gepubliceerde Lark/Zalo-pakketten die nog steeds autorisatie van afzendercommando's importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Helpers voor semantische berichtpresentatie, levering en verouderde interactieve antwoorden. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibiliteitsbarrel voor inkomende debounce, vermeldingmatching, helpers voor vermeldingsbeleid en envelophelpers |
    | `plugin-sdk/channel-inbound-debounce` | Smalle helpers voor inkomende debounce |
    | `plugin-sdk/channel-mention-gating` | Smalle helpers voor vermeldingsbeleid, vermeldingsmarkeringen en vermeldingstekst zonder het bredere inkomende runtimeoppervlak |
    | `plugin-sdk/channel-envelope` | Smalle helpers voor het opmaken van inkomende enveloppen |
    | `plugin-sdk/channel-location` | Helpers voor kanaallocatiecontext en opmaak |
    | `plugin-sdk/channel-logging` | Kanaalloghelpers voor inkomende drops en type-/ack-fouten |
    | `plugin-sdk/channel-send-result` | Typen voor antwoordresultaten |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die voor plugincompatibiliteit behouden blijven |
    | `plugin-sdk/channel-route` | Gedeelde helpers voor routenormalisatie, parsergestuurde doelresolutie, stringificatie van thread-id's, dedupe/compacte routesleutels, geparste doeltypen en route-/doelvergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor doelparsing; aanroepers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Bedrading voor feedback/reacties |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contracten zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en typen voor secretdoelen |
  </Accordion>

  <Accordion title="Subpaden voor providers">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde providerfacade voor LM Studio voor installatie, catalogusdetectie en voorbereiding van runtimemodellen |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde runtimefacade voor LM Studio voor standaardwaarden van lokale servers, modeldetectie, aanvraagheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Gecureerde helpers voor het instellen van lokale/zelfgehoste providers |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte helpers voor het instellen van OpenAI-compatibele zelfgehoste providers |
    | `plugin-sdk/cli-backend` | Standaardwaarden voor CLI-backend + watchdog-constanten |
    | `plugin-sdk/provider-auth-runtime` | Runtimehelpers voor API-sleutelresolutie voor provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor onboarding/API-sleutelprofiel schrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaardbouwer voor OAuth-authenticatieresultaten |
    | `plugin-sdk/provider-auth-login` | Gedeelde helpers voor interactieve aanmelding voor provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Helpers voor het opzoeken van provider-authenticatieomgevingsvariabelen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replaybeleid, helpers voor provider-eindpunten en helpers voor normalisatie van model-id's, zoals `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtimehook voor uitbreiding van providercatalogi en naden voor plugin-providerregisters voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke helpers voor HTTP-/eindpuntmogelijkheden van providers, HTTP-fouten van providers en helpers voor multipartformulieren voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle helpers voor web-fetchconfiguratie/selectiecontracten, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers voor registratie/cache van web-fetchproviders |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle helpers voor web-searchconfiguratie/referenties voor providers die geen bedrading voor plugin-inschakeling nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle helpers voor web-searchconfiguratie/referentiecontracten, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en bereikgebonden referentie-setters/getters |
    | `plugin-sdk/provider-web-search` | Helpers voor registratie/cache/runtime van web-searchproviders |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-schemaopschoning + diagnostiek en xAI-compathelpers, zoals `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` en vergelijkbaar |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, streamwrappertypen en gedeelde Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-wrapperhelpers |
    | `plugin-sdk/provider-transport-runtime` | Native providertransporthelpers, zoals beveiligde fetch, transformaties van transportberichten en beschrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor onboardingconfiguratiepatches |
    | `plugin-sdk/global-singleton` | Proceslokale helpers voor singleton/map/cache |
    | `plugin-sdk/group-activation` | Smalle helpers voor groepsactiveringsmodus en opdrachtparsing |
  </Accordion>

  <Accordion title="Subpaden voor authenticatie en beveiliging">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers voor opdrachtregisters, inclusief dynamische opmaak van argumentmenu's, helpers voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Bouwers voor opdracht-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeurderresolutie en actie-authenticatie in dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Helpers voor native exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor goedkeuringsmogelijkheden/levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde helper voor goedkeurings-Gatewayresolutie |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichte helpers voor het laden van native goedkeuringsadapters voor hete kanaalentrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gatewaynaden wanneer die voldoende zijn |
    | `plugin-sdk/approval-native-runtime` | Helpers voor native goedkeuringsdoel + accountbinding |
    | `plugin-sdk/approval-reply-runtime` | Helpers voor exec-/Plugin-goedkeuringsantwoordpayloads |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/Plugin-goedkeuringspayloads, helpers voor native goedkeuringsrouting/runtime en helpers voor gestructureerde goedkeuringsweergave, zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle resethelpers voor deduplicatie van inkomende antwoorden |
    | `plugin-sdk/channel-contract-testing` | Smalle helpers voor kanaalcontracttests zonder de brede testingbarrel |
    | `plugin-sdk/command-auth-native` | Native opdrachtauthenticatie, dynamische opmaak van argumentmenu's en native helpers voor sessiedoelen |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor opdrachtdetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichte predicaten voor opdrachttekst voor hete kanaalpaden |
    | `plugin-sdk/command-surface` | Helpers voor normalisatie van opdrachtbody's en opdrachtoppervlakken |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contractverzameling voor secret-oppervlakken van kanalen/Plugins |
    | `plugin-sdk/secret-ref-runtime` | Smalle helpers voor `coerceSecretRef` en SecretRef-typering voor secret-contract-/configuratieparsing |
    | `plugin-sdk/security-runtime` | Gedeelde helpers voor vertrouwen, DM-afscherming, externe content, redactie van gevoelige tekst, constant-time secretvergelijking en secretverzameling |
    | `plugin-sdk/ssrf-policy` | Helpers voor host-allowlists en SSRF-beleid voor privénetwerken |
    | `plugin-sdk/ssrf-dispatcher` | Smalle helpers voor pinned-dispatchers zonder het brede infra-runtimeoppervlak |
    | `plugin-sdk/ssrf-runtime` | Helpers voor pinned-dispatchers, SSRF-beschermde fetch, SSRF-fouten en SSRF-beleid |
    | `plugin-sdk/secret-input` | Helpers voor het parsen van secret-invoer |
    | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-aanvragen/-doelen en ruwe websocket-/bodycoercion |
    | `plugin-sdk/webhook-request-guards` | Helpers voor grootte/time-out van requestbody's |
  </Accordion>

  <Accordion title="Runtime- en opslag-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede helpers voor runtime, logging, back-up en Plugin-installatie |
    | `plugin-sdk/runtime-env` | Smalle helpers voor runtime-env, logger, time-out, opnieuw proberen en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratiefacade voor genormaliseerd profiel/standaardwaarden, CDP-URL-parsing en helpers voor browserbesturingsauthenticatie |
    | `plugin-sdk/channel-runtime-context` | Generieke helpers voor registratie en opzoeken van channel-runtimecontext |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor Plugin-opdrachten, hooks, HTTP en interactieve functies |
    | `plugin-sdk/hook-runtime` | Gedeelde pipelinehelpers voor Webhook/interne hooks |
    | `plugin-sdk/lazy-runtime` | Helpers voor lazy runtime-import/binding, zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers voor procesuitvoering |
    | `plugin-sdk/cli-runtime` | Helpers voor CLI-formattering, wachten, versie, argumentaanroep en lazy opdrachtgroepen |
    | `plugin-sdk/gateway-runtime` | Gateway-client, helper voor starten van event-loop-ready client, Gateway CLI RPC, Gateway-protocolfouten en helpers voor channel-statuspatches |
    | `plugin-sdk/config-types` | Type-only configuratieoppervlak voor Plugin-configuratievormen zoals `OpenClawConfig` en configuratietypen voor channels/providers |
    | `plugin-sdk/plugin-config-runtime` | Runtimehelpers voor het opzoeken van Plugin-configuratie, zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele helpers voor configuratiemutatie, zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers voor snapshots van de huidige procesconfiguratie, zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en test-snapshotsetters |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-opdrachtnamen/beschrijvingen en controles op duplicaten/conflicten, zelfs wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van autolinks voor bestandsverwijzingen zonder de brede text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/Plugin-goedkeuringen, builders voor goedkeuringsmogelijkheden, auth-/profielhelpers, native routing-/runtimehelpers en gestructureerde padformattering voor goedkeuringsweergave |
    | `plugin-sdk/reply-runtime` | Gedeelde runtimehelpers voor inkomend verkeer/antwoorden, chunking, dispatch, Heartbeat, antwoordplanner |
    | `plugin-sdk/reply-dispatch-runtime` | Smalle helpers voor antwoorddispatch/finalisatie en gesprekslabels |
    | `plugin-sdk/reply-history` | Gedeelde helpers en markeringen voor antwoordgeschiedenis met kort venster, zoals `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Smalle helpers voor tekst-/markdownchunking |
    | `plugin-sdk/session-store-runtime` | Helpers voor sessiestorepad, sessiesleutel, bijgewerkt-op en store-mutaties |
    | `plugin-sdk/cron-store-runtime` | Helpers voor Cron-storepad/laden/opslaan |
    | `plugin-sdk/state-paths` | Helpers voor state-/OAuth-mappaden |
    | `plugin-sdk/routing` | Helpers voor route-/sessiesleutel-/accountbinding, zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde helpers voor channel-/accountstatussamenvattingen, standaardwaarden voor runtime-state en helpers voor issue-metadata |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde helpers voor targetresolutie |
    | `plugin-sdk/string-normalization-runtime` | Helpers voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | String-URL's extraheren uit fetch-/request-achtige invoer |
    | `plugin-sdk/run-command` | Getimede opdrachtrunner met genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Algemene parameterreaders voor tools/CLI |
    | `plugin-sdk/tool-payload` | Genormaliseerde payloads extraheren uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Canonieke doelvelden voor verzenden extraheren uit toolargumenten |
    | `plugin-sdk/temp-path` | Gedeelde helpers voor tijdelijke downloadpaden |
    | `plugin-sdk/logging-core` | Subsystemlogger en redactieghelpers |
    | `plugin-sdk/markdown-table-runtime` | Helpers voor markdowntabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Helpers voor model-/sessie-overschrijvingen, zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers voor configuratieresolutie van talkproviders |
    | `plugin-sdk/json-store` | Kleine helpers voor lezen/schrijven van JSON-state |
    | `plugin-sdk/file-lock` | Re-entrant file-lockhelpers |
    | `plugin-sdk/persistent-dedupe` | Helpers voor schijfgebaseerde dedupe-cache |
    | `plugin-sdk/acp-runtime` | Helpers voor ACP-runtime/sessie en antwoorddispatch |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht helpers voor ACP-backendregistratie en antwoorddispatch voor bij opstarten geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Alleen-lezen ACP-bindingsresolutie zonder imports voor lifecycle-startup |
    | `plugin-sdk/agent-config-primitives` | Smalle primitives voor agentruntime-configuratieschema's |
    | `plugin-sdk/boolean-param` | Losse boolean-parameterreader |
    | `plugin-sdk/dangerous-name-runtime` | Helpers voor resolutie van dangerous-name-matching |
    | `plugin-sdk/device-bootstrap` | Helpers voor device bootstrap en pairingtokens |
    | `plugin-sdk/extension-shared` | Gedeelde primitives voor passieve channels, status en ambient proxyhelpers |
    | `plugin-sdk/models-provider-runtime` | Helpers voor `/models`-opdracht-/providerantwoorden |
    | `plugin-sdk/skill-commands-runtime` | Helpers voor het weergeven van Skill-opdrachten |
    | `plugin-sdk/native-command-registry` | Helpers voor native opdrachtregistry/build/serialisatie |
    | `plugin-sdk/agent-harness` | Experimenteel oppervlak voor vertrouwde plugins voor low-level agent-harnassen: harnastypen, helpers voor sturen/afbreken van actieve runs, OpenClaw-toolbridgehelpers, helpers voor runtime-plan-toolbeleid, classificatie van terminaluitkomsten, helpers voor toolvoortgangsformattering/details en utilities voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Helpers voor Z.AI-endpointdetectie |
    | `plugin-sdk/async-lock-runtime` | Proceslokale async-lockhelper voor kleine runtime-statebestanden |
    | `plugin-sdk/channel-activity-runtime` | Helper voor channelactiviteitstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Helper voor begrensde async-taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Helpers voor in-memory dedupe-cache |
    | `plugin-sdk/delivery-queue-runtime` | Helper voor het drainen van uitgaande pending deliveries |
    | `plugin-sdk/file-access-runtime` | Helpers voor veilige lokale-bestands- en mediabronpaden |
    | `plugin-sdk/heartbeat-runtime` | Helpers voor Heartbeat-events en zichtbaarheid |
    | `plugin-sdk/number-runtime` | Helper voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Helpers voor veilige tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Helpers voor systeemeventqueues |
    | `plugin-sdk/transport-ready-runtime` | Helper voor wachten op transportgereedheid |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine helpers voor begrensde caches |
    | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostische flags, events en trace-context |
    | `plugin-sdk/error-runtime` | Errorgraph, formattering, gedeelde helpers voor foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, `EnvHttpProxyAgent`-optie en helpers voor pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch zonder proxy-/guarded-fetchimports |
    | `plugin-sdk/response-limit-runtime` | Begrensde response-bodyreader zonder het brede media-runtimeoppervlak |
    | `plugin-sdk/session-binding-runtime` | Huidige bindingsstate van gesprekken zonder geconfigureerde bindingsrouting of pairingstores |
    | `plugin-sdk/session-store-runtime` | Sessiestorehelpers zonder brede configuratieschrijfacties/onderhoudsimports |
    | `plugin-sdk/context-visibility-runtime` | Resolutie van contextzichtbaarheid en filtering van aanvullende context zonder brede configuratie-/beveiligingsimports |
    | `plugin-sdk/string-coerce-runtime` | Smalle helpers voor primitive record-/stringcoercion en normalisatie zonder markdown-/loggingimports |
    | `plugin-sdk/host-runtime` | Helpers voor hostnaam- en SCP-hostnormalisatie |
    | `plugin-sdk/retry-runtime` | Helpers voor retryconfiguratie en retryrunner |
    | `plugin-sdk/agent-runtime` | Helpers voor agentmap/identiteit/workspace |
    | `plugin-sdk/directory-runtime` | Configuratiegebaseerde directoryquery/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpaden voor mogelijkheden en testen">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor media ophalen/transformeren/opslaan, door ffprobe ondersteunde detectie van videoafmetingen en bouwers voor mediapayloads |
    | `plugin-sdk/media-store` | Smalle helpers voor mediaopslag, zoals `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failoverhelpers voor mediageneratie, kandidaatselectie en meldingen voor ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus exports van providergerichte helpers voor afbeeldingen/audio |
    | `plugin-sdk/text-runtime` | Gedeelde helpers voor tekst/markdown/logging, zoals het strippen van voor de assistent zichtbare tekst, helpers voor markdown-rendering/chunking/tabellen, redactiehelpers, helpers voor richtlijntags en hulpprogramma's voor veilige tekst |
    | `plugin-sdk/text-chunking` | Helper voor chunking van uitgaande tekst |
    | `plugin-sdk/speech` | Typen voor spraakproviders plus exports van providergerichte richtlijn-, registry-, validatie-, OpenAI-compatibele TTS-bouwer- en spraakhelpers |
    | `plugin-sdk/speech-core` | Gedeelde typen voor spraakproviders, registry, richtlijn, normalisatie en exports van spraakhelpers |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registryhelpers en gedeelde helper voor WebSocket-sessies |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime spraak en registryhelpers |
    | `plugin-sdk/image-generation` | Providertypen voor afbeeldingsgeneratie plus helpers voor afbeeldingsassets/data-URL's en de OpenAI-compatibele bouwer voor afbeeldingsproviders |
    | `plugin-sdk/image-generation-core` | Gedeelde typen, failover, auth en registryhelpers voor afbeeldingsgeneratie |
    | `plugin-sdk/music-generation` | Typen voor provider/verzoek/resultaat voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen voor muziekgeneratie, failoverhelpers, providerlookup en parsing van modelverwijzingen |
    | `plugin-sdk/video-generation` | Typen voor provider/verzoek/resultaat voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failoverhelpers, providerlookup en parsing van modelverwijzingen |
    | `plugin-sdk/webhook-targets` | Registry voor Webhook-doelen en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Helpers voor normalisatie van Webhook-paden |
    | `plugin-sdk/web-media` | Gedeelde helpers voor laden van externe/lokale media |
    | `plugin-sdk/zod` | Opnieuw geëxporteerde `zod` voor gebruikers van de plugin-SDK |
    | `plugin-sdk/testing` | Brede compatibiliteitsbarrel voor legacy plugintests. Nieuwe extensietests moeten in plaats daarvan gerichte SDK-subpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Minimale helper `createTestPluginApi` voor directe unittests van pluginregistratie zonder repo-testhelperbridges te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Native contractfixtures voor agent-runtime-adapters voor auth-, levering-, fallback-, tool-hook-, prompt-overlay-, schema- en transcriptprojectietests |
    | `plugin-sdk/channel-test-helpers` | Kanaalgerichte testhelpers voor generieke acties/setup/statuscontracten, directory-asserties, lifecycle van accountopstart, send-config-threading, runtimemocks, statusproblemen, uitgaande levering en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Gedeelde suite met foutgevallen voor doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Helpers voor Plugin-pakketten, registratie, publieke artefacten, directe imports, runtime-API en contracten voor importbijwerkingen |
    | `plugin-sdk/provider-test-contracts` | Helpers voor providerruntime, auth, discovery, onboarding, catalogus, wizard, mediamogelijkheden, replaybeleid, realtime STT-liveaudio, web-search/fetch en streamcontracten |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` oefenen |
    | `plugin-sdk/test-fixtures` | Generieke fixtures voor CLI-runtimecapture, sandboxcontext, Skill-schrijver, agentbericht, systeemevent, moduleherlading, pad naar gebundelde Plugin, terminaltekst, chunking, auth-token en getypeerde cases |
    | `plugin-sdk/test-node-mocks` | Gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Memory-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager/configuratie/bestand/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/zoeken |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports van de foundation-engine van de memory-host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embeddingcontracten voor de memory-host, registrytoegang, lokale provider en generieke batch-/remotehelpers |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports van de QMD-engine van de memory-host |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports van de opslagengine van de memory-host |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor de memory-host |
    | `plugin-sdk/memory-core-host-query` | Queryhelpers voor de memory-host |
    | `plugin-sdk/memory-core-host-secret` | Geheimhelpers voor de memory-host |
    | `plugin-sdk/memory-core-host-events` | Helpers voor het eventjournal van de memory-host |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor de memory-host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor de memory-host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehelpers voor de memory-host |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor de memory-host |
    | `plugin-sdk/memory-host-core` | Leverancierneutraal alias voor core-runtimehelpers van de memory-host |
    | `plugin-sdk/memory-host-events` | Leverancierneutraal alias voor eventjournalhelpers van de memory-host |
    | `plugin-sdk/memory-host-files` | Leverancierneutraal alias voor bestands-/runtimehelpers van de memory-host |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-helpers voor plugins die aan memory grenzen |
    | `plugin-sdk/memory-host-search` | Active Memory-runtimefacade voor toegang tot de zoekmanager |
    | `plugin-sdk/memory-host-status` | Leverancierneutraal alias voor statushelpers van de memory-host |
  </Accordion>

  <Accordion title="Gereserveerde gebundelde helpersubpaden">
    Er zijn momenteel geen gereserveerde gebundelde SDK-helpersubpaden. Eigenaarsspecifieke
    helpers bevinden zich in het eigenaars-Plugin-pakket, terwijl herbruikbare hostcontracten
    generieke SDK-subpaden gebruiken, zoals `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van Plugin-SDK](/nl/plugins/sdk-overview)
- [Plugin-SDK instellen](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
