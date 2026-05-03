---
read_when:
    - Het juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Controle van gebundelde Plugin-subpaden en helperinterfaces
summary: 'Plugin SDK-subpadcatalogus: welke imports waar staan, gegroepeerd per gebied'
title: Plugin SDK-subpaden
x-i18n:
    generated_at: "2026-05-03T11:16:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  De plugin-SDK wordt beschikbaar gesteld als een reeks smalle subpaden onder `openclaw/plugin-sdk/`.
  Deze pagina catalogiseert de vaak gebruikte subpaden, gegroepeerd op doel. De gegenereerde
  volledige lijst met meer dan 200 subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`;
  gereserveerde helper-subpaden voor gebundelde plugins staan daar ook in, maar zijn een implementatiedetail
  tenzij een documentatiepagina ze expliciet promoot. Maintainers kunnen actieve
  gereserveerde helper-subpaden auditen met `pnpm plugins:boundary-report:summary`; ongebruikte
  gereserveerde helper-exports laten het CI-rapport falen in plaats van in de openbare SDK
  te blijven als slapende compatibiliteitsschuld.

  Zie [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview) voor de handleiding voor het maken van plugins.

  ## Plugin-ingang

  | Subpad                                    | Belangrijkste exports                                                                                                                                                         |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Brede compatibiliteitsbarrel voor legacy plugintests; geef voor nieuwe extensietests de voorkeur aan gerichte testsubpaden                                                   |
  | `plugin-sdk/plugin-test-api`              | Minimale mockbuilder voor `OpenClawPluginApi` voor directe unit-tests voor pluginregistratie                                                                                  |
  | `plugin-sdk/agent-runtime-test-contracts` | Native contractfixtures voor agent-runtime-adapters voor auth-profielen, leveringsonderdrukking, fallbackclassificatie, tool-hooks, prompt-overlays, schema's en transcriptreparatie |
  | `plugin-sdk/channel-test-helpers`         | Testhelpers voor kanaalaccountlevenscyclus, directory, send-config, runtime-mock, hook, gebundelde kanaalingang, envelope-tijdstempel, koppelingsantwoord en generiek kanaalcontract |
  | `plugin-sdk/channel-target-testing`       | Gedeelde testsuite voor foutgevallen bij doelresolutie voor kanalen                                                                                                          |
  | `plugin-sdk/plugin-test-contracts`        | Contracthelpers voor pluginregistratie, package-manifest, openbaar artefact, runtime-API, import-side-effect en directe import                                               |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures voor tests van pluginruntime, registry, providerregistratie, setup-wizard en runtime-taskflow                                                                       |
  | `plugin-sdk/provider-test-contracts`      | Contracthelpers voor providerruntime, auth, discovery, onboard, catalog, mediacapability, replaybeleid, realtime STT live-audio, web-search/fetch en wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` testen                                                                                       |
  | `plugin-sdk/test-env`                     | Fixtures voor testomgeving, fetch/network, wegwerpbare HTTP-server, inkomend verzoek, live-test, tijdelijk bestandssysteem en tijdcontrole                                  |
  | `plugin-sdk/test-fixtures`                | Generieke testfixtures voor CLI, sandbox, skill, agent-message, system-event, module reload, gebundeld pluginpad, terminal, chunking, auth-token en typed-case               |
  | `plugin-sdk/test-node-mocks`              | Gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest `vi.mock("node:*")`-factories                                                                  |
  | `plugin-sdk/migration`                    | Helpers voor migratieprovideritems zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactiehelpers en `summarizeMigrationItems`                        |
  | `plugin-sdk/migration-runtime`            | Runtimemigratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                          |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema-export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde setup-wizardhelpers, allowlist-prompts, setupstatusbuilders |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor multi-accountconfiguratie/actiegates, fallbackhelpers voor standaardaccounts |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, normalisatiehelpers voor account-id's |
    | `plugin-sdk/account-resolution` | Helpers voor accountlookup + standaardfallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten/accountacties |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde primitives voor kanaalconfiguratieschema's plus Zod- en directe JSON/TypeBox-builders |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's, alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor configuratieschema's van gebundelde kanalen |
    | `plugin-sdk/telegram-command-config` | Normalisatie-/validatiehelpers voor aangepaste Telegram-commando's met fallback voor gebundeld contract |
    | `plugin-sdk/command-gating` | Smalle helpers voor commandoautorisatiegates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, lifecycle-/finalisatiehelpers voor conceptstreams |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inkomende routes + envelope-builders |
    | `plugin-sdk/inbound-reply-dispatch` | Gedeelde helpers voor inkomende registratie en dispatch |
    | `plugin-sdk/messaging-targets` | Helpers voor doelparsing/-matching |
    | `plugin-sdk/outbound-media` | Gedeelde laadhelpers voor uitgaande media |
    | `plugin-sdk/outbound-send-deps` | Lichtgewicht lookup van afhankelijkheden voor uitgaand verzenden voor kanaaladapters |
    | `plugin-sdk/outbound-runtime` | Helpers voor uitgaande levering, identiteit, send delegate, sessie, formattering en payloadplanning |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor pollnormalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor thread-bindinglevenscyclus en adapters |
    | `plugin-sdk/agent-media-payload` | Legacy builder voor agentmediapayloads |
    | `plugin-sdk/conversation-runtime` | Helpers voor conversation/thread-binding, koppeling en geconfigureerde binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor runtimeconfiguratiesnapshot |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtime-resolutie van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatussnapshots/-samenvattingen |
    | `plugin-sdk/channel-config-primitives` | Smalle primitives voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Autorisatiehelpers voor schrijven naar kanaalconfiguratie |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor bewerken/lezen van allowlist-configuratie |
    | `plugin-sdk/group-access` | Gedeelde beslissingshelpers voor groepstoegang |
    | `plugin-sdk/direct-dm` | Gedeelde auth-/guardhelpers voor directe DM's |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en gevolgde ownercompatibiliteit; nieuwe plugins moeten generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor gevolgde ownercompatibiliteit; nieuwe plugins moeten geïnjecteerde runtimehelpers of generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/zalouser` | Verouderde Zalo Personal-compatibiliteitsfacade voor gepubliceerde Lark/Zalo-packages die nog autorisatie voor sendercommando's importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Helpers voor semantische berichtpresentatie, levering en legacy interactieve antwoorden. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibiliteitsbarrel voor inkomende debounce, mention-matching, mention-policyhelpers en envelopehelpers |
    | `plugin-sdk/channel-inbound-debounce` | Smalle helpers voor inkomende debounce |
    | `plugin-sdk/channel-mention-gating` | Smalle helpers voor mentionbeleid, mentionmarkeringen en mentiontekst zonder het bredere inkomende runtime-oppervlak |
    | `plugin-sdk/channel-envelope` | Smalle helpers voor formattering van inkomende envelopes |
    | `plugin-sdk/channel-location` | Context- en formatteringshelpers voor kanaallocatie |
    | `plugin-sdk/channel-logging` | Kanaallogginghelpers voor inkomende drops en typing-/ack-fouten |
    | `plugin-sdk/channel-send-result` | Typen voor antwoordresultaten |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die behouden zijn voor plugincompatibiliteit |
    | `plugin-sdk/channel-route` | Gedeelde helpers voor routenormalisatie, parsergestuurde doelresolutie, stringificatie van thread-id's, dedupe/compact route keys, parsed-target-typen en route-/doelvergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor doelparsing; aanroepers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Wiring voor feedback/reacties |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secretcontracten zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en secret target-typen |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor installatie, catalogusdetectie en runtime-modelvoorbereiding |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor lokale serverstandaarden, modeldetectie, requestheaders en hulpfuncties voor geladen modellen |
    | `plugin-sdk/provider-setup` | Gecureerde hulpfuncties voor lokale/zelfgehoste providerinstallatie |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele hulpfuncties voor zelfgehoste providerinstallatie |
    | `plugin-sdk/cli-backend` | CLI-backendstandaarden + watchdogconstanten |
    | `plugin-sdk/provider-auth-runtime` | Runtimehulpfuncties voor API-sleutelresolutie voor provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hulpfuncties voor API-sleutel-onboarding/profielschrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaardbouwer voor OAuth-authresultaten |
    | `plugin-sdk/provider-auth-login` | Gedeelde interactieve loginhulpfuncties voor provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hulpfuncties voor het opzoeken van provider-auth-env-vars |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replaybeleid, hulpfuncties voor provider-eindpunten en hulpfuncties voor model-id-normalisatie, zoals `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtimehook voor provider-catalogusuitbreiding en registerseams voor Plugin-providers voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke hulpfuncties voor provider-HTTP/eindpuntcapaciteiten, provider-HTTP-fouten en multipart-formulierhulpfuncties voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle web-fetch-configuratie-/selectiecontracthulpfuncties, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hulpfuncties voor web-fetch-providerregistratie/cache |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle configuratie-/credentialhulpfuncties voor webzoekproviders die geen Plugin-enable-bedrading nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle webzoekconfiguratie-/credentialcontracthulpfuncties, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped credentialsetters/-getters |
    | `plugin-sdk/provider-web-search` | Hulpfuncties voor webzoekproviderregistratie/cache/runtime |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-schemacleanup + diagnostiek, en xAI-compatibiliteitshulpfuncties zoals `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` en vergelijkbare hulpfuncties |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, streamwrappertypen en gedeelde Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-wrapperhulpfuncties |
    | `plugin-sdk/provider-transport-runtime` | Native providertransporthulpfuncties, zoals guarded fetch, transportberichttransformaties en schrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Hulpfuncties voor onboardingconfiguratiepatches |
    | `plugin-sdk/global-singleton` | Proceslokale singleton-/map-/cachehulpfuncties |
    | `plugin-sdk/group-activation` | Smalle hulpfuncties voor groepsactivatiemodus en commandoparsing |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, commandoregisterhulpfuncties inclusief dynamische argumentmenu-opmaak, hulpfuncties voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Bouwers voor commando-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hulpfuncties voor goedkeurderresolutie en action-auth binnen dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Hulpfuncties voor native exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor goedkeuringscapaciteiten/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde hulpfunctie voor goedkeurings-Gateway-resolutie |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht hulpfuncties voor het laden van native goedkeuringsadapters voor hot channel-entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtimehulpfuncties voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-seams wanneer die voldoende zijn |
    | `plugin-sdk/approval-native-runtime` | Hulpfuncties voor native goedkeuringsdoel + accountbinding |
    | `plugin-sdk/approval-reply-runtime` | Hulpfuncties voor exec-/Plugin-goedkeuringsantwoordpayloads |
    | `plugin-sdk/approval-runtime` | Hulpfuncties voor exec-/Plugin-goedkeuringspayloads, native goedkeuringsroutering/runtimehulpfuncties en gestructureerde hulpfuncties voor goedkeuringsweergave, zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle hulpfuncties voor het resetten van dedupe voor inkomende antwoorden |
    | `plugin-sdk/channel-contract-testing` | Smalle contracttesthulpfuncties voor kanalen zonder de brede testing barrel |
    | `plugin-sdk/command-auth-native` | Native commando-auth, dynamische argumentmenu-opmaak en native sessiedoelhulpfuncties |
    | `plugin-sdk/command-detection` | Gedeelde hulpfuncties voor commandodetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht commandotekstpredicaten voor hot channel-paden |
    | `plugin-sdk/command-surface` | Hulpfuncties voor commandobody-normalisatie en commandosurface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Smalle hulpfuncties voor secret-contractverzameling voor kanaal-/Plugin-secretoppervlakken |
    | `plugin-sdk/secret-ref-runtime` | Smalle `coerceSecretRef`- en SecretRef-typeringshulpfuncties voor secret-contract-/configuratieparsing |
    | `plugin-sdk/security-runtime` | Gedeelde hulpfuncties voor trust, DM-gating, externe content, redactie van gevoelige tekst, constant-time secretvergelijking en secretverzameling |
    | `plugin-sdk/ssrf-policy` | Hulpfuncties voor host-allowlist en SSRF-beleid voor privénetwerken |
    | `plugin-sdk/ssrf-dispatcher` | Smalle pinned-dispatcher-hulpfuncties zonder het brede infra-runtimeoppervlak |
    | `plugin-sdk/ssrf-runtime` | Hulpfuncties voor pinned-dispatcher, SSRF-beschermde fetch, SSRF-fout en SSRF-beleid |
    | `plugin-sdk/secret-input` | Hulpfuncties voor secretinvoerparsing |
    | `plugin-sdk/webhook-ingress` | Hulpfuncties voor Webhook-requests/-doelen en coercion van raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Hulpfuncties voor requestbodygrootte/time-out |
  </Accordion>

  <Accordion title="Runtime- en opslagsubpaden">
    | Subpad | Belangrijke exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede runtime-/logging-/back-up-/plugin-installatiehelpers |
    | `plugin-sdk/runtime-env` | Smalle helpers voor runtime-omgeving, logger, timeout, retry en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratiefacade voor genormaliseerd profiel/standaardwaarden, CDP-URL-parsing en helpers voor browserbesturingsauthenticatie |
    | `plugin-sdk/channel-runtime-context` | Generieke helpers voor registratie en opzoeken van channel-runtimecontext |
    | `plugin-sdk/matrix` | Verouderde Matrix-compatibiliteitsfacade voor oudere channel-pakketten van derden; nieuwe plugins moeten `plugin-sdk/run-command` rechtstreeks importeren |
    | `plugin-sdk/mattermost` | Verouderde Mattermost-compatibiliteitsfacade voor oudere channel-pakketten van derden; nieuwe plugins moeten generieke SDK-subpaden rechtstreeks importeren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor plugin-opdrachten/hooks/http/interactief gebruik |
    | `plugin-sdk/hook-runtime` | Gedeelde helpers voor Webhook-/interne hook-pijplijnen |
    | `plugin-sdk/lazy-runtime` | Helpers voor luie runtime-imports/-bindingen zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers voor procesuitvoering |
    | `plugin-sdk/cli-runtime` | Helpers voor CLI-formattering, wachten, versie, argumentaanroep en luie opdrachtgroepen |
    | `plugin-sdk/gateway-runtime` | Gateway-client, helper voor het starten van een event-loop-klare client, Gateway CLI RPC, Gateway-protocolfouten en helpers voor channelstatuspatches |
    | `plugin-sdk/config-types` | Type-only configuratie-oppervlak voor plugin-configuratievormen zoals `OpenClawConfig` en configuratietypen voor channels/providers |
    | `plugin-sdk/plugin-config-runtime` | Runtime helpers voor plugin-configuratie-opzoeking zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele helpers voor configuratiemutatie zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers voor snapshots van de huidige procesconfiguratie zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en testsnapshot-setters |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-opdrachtnamen/-beschrijvingen en controles op duplicaten/conflicten, zelfs wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van bestandsreferentie-autolinks zonder de brede text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/plugin-goedkeuring, bouwers voor goedkeuringsmogelijkheden, auth-/profielhelpers, native routing-/runtimehelpers en formattering van gestructureerde weergavepaden voor goedkeuringen |
    | `plugin-sdk/reply-runtime` | Gedeelde runtimehelpers voor inkomend verkeer/antwoorden, chunking, dispatch, Heartbeat, antwoordplanner |
    | `plugin-sdk/reply-dispatch-runtime` | Smalle helpers voor reply-dispatch/finalize en conversatielabels |
    | `plugin-sdk/reply-history` | Gedeelde helpers voor antwoordgeschiedenis in een kort venster en markers zoals `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Smalle helpers voor tekst-/markdownchunking |
    | `plugin-sdk/session-store-runtime` | Helpers voor sessiestorepad, sessiesleutel, bijgewerkt-op en store-mutatie |
    | `plugin-sdk/cron-store-runtime` | Helpers voor Cron-storepad/laden/opslaan |
    | `plugin-sdk/state-paths` | Helpers voor State-/OAuth-mappaden |
    | `plugin-sdk/routing` | Helpers voor route-/sessiesleutel-/accountbinding zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde helpers voor channel-/accountstatussamenvattingen, standaardwaarden voor runtime-state en issue-metadatahelpers |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde target-resolverhelpers |
    | `plugin-sdk/string-normalization-runtime` | Helpers voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | String-URL's extraheren uit fetch-/request-achtige invoer |
    | `plugin-sdk/run-command` | Getimede opdrachtrunner met genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Algemene tool-/CLI-paramlezers |
    | `plugin-sdk/tool-payload` | Genormaliseerde payloads extraheren uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Canonieke doelvelden voor verzenden extraheren uit toolargumenten |
    | `plugin-sdk/temp-path` | Gedeelde helpers voor tijdelijke downloadpaden |
    | `plugin-sdk/logging-core` | Helpers voor subsystemlogger en redactie |
    | `plugin-sdk/markdown-table-runtime` | Helpers voor markdowntabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Helpers voor model-/sessie-override zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers voor configuratieresolutie van talk-providers |
    | `plugin-sdk/json-store` | Kleine helpers voor JSON-state lezen/schrijven |
    | `plugin-sdk/file-lock` | Re-entrant file-lock helpers |
    | `plugin-sdk/persistent-dedupe` | Helpers voor dedupe-cache met schijfbacking |
    | `plugin-sdk/acp-runtime` | ACP runtime-/sessie- en reply-dispatchhelpers |
    | `plugin-sdk/acp-runtime-backend` | Lichte ACP-backendregistratie- en reply-dispatchhelpers voor bij opstarten geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Alleen-lezen ACP-bindingresolutie zonder imports voor levenscyclusopstart |
    | `plugin-sdk/agent-config-primitives` | Smalle primitives voor agent-runtimeconfiguratieschema's |
    | `plugin-sdk/boolean-param` | Losse boolean-paramlezer |
    | `plugin-sdk/dangerous-name-runtime` | Helpers voor resolutie van gevaarlijke-naammatching |
    | `plugin-sdk/device-bootstrap` | Helpers voor apparaatbootstrap en pairing tokens |
    | `plugin-sdk/extension-shared` | Gedeelde helperprimitives voor passieve channels, status en ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpers voor `/models`-opdracht-/providerantwoorden |
    | `plugin-sdk/skill-commands-runtime` | Helpers voor Skill-opdrachtlijsten |
    | `plugin-sdk/native-command-registry` | Helpers voor native opdrachtregisters/bouwen/serialiseren |
    | `plugin-sdk/agent-harness` | Experimenteel trusted-plugin-oppervlak voor low-level agent-harnassen: harnastypen, helpers voor actieve-run sturen/afbreken, OpenClaw-toolbridgehelpers, helpers voor runtime-plan-toolbeleid, classificatie van terminaluitkomsten, helpers voor toolvoortgangsformattering/-details en utilities voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Helpers voor Z.AI-endpointdetectie |
    | `plugin-sdk/async-lock-runtime` | Proceslokale async-lock helper voor kleine runtime-statebestanden |
    | `plugin-sdk/channel-activity-runtime` | Helper voor channel-activiteitstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Helper voor begrensde async-taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Helpers voor in-memory dedupe-cache |
    | `plugin-sdk/delivery-queue-runtime` | Helper voor het leegtrekken van uitstaande uitgaande afleveringen |
    | `plugin-sdk/file-access-runtime` | Helpers voor veilige lokale-bestands- en mediabronpaden |
    | `plugin-sdk/heartbeat-runtime` | Helpers voor Heartbeat-events en zichtbaarheid |
    | `plugin-sdk/number-runtime` | Helper voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Helpers voor veilige tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Helpers voor systeemeventwachtrijen |
    | `plugin-sdk/transport-ready-runtime` | Helper om op transportgereedheid te wachten |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine helpers voor begrensde caches |
    | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostische flags, events en trace-context |
    | `plugin-sdk/error-runtime` | Helpers voor foutgrafiek, formattering en gedeelde foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrapte fetch-, proxy-, EnvHttpProxyAgent-optie- en pinned lookup-helpers |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewuste runtime-fetch zonder proxy-/guarded-fetch-imports |
    | `plugin-sdk/response-limit-runtime` | Begrensde response-body reader zonder het brede media-runtime-oppervlak |
    | `plugin-sdk/session-binding-runtime` | Huidige bindingstatus van conversaties zonder geconfigureerde bindingrouting of pairing stores |
    | `plugin-sdk/session-store-runtime` | Session-store helpers zonder brede configuratieschrijf-/onderhoudsimports |
    | `plugin-sdk/context-visibility-runtime` | Resolutie van contextzichtbaarheid en aanvullende contextfiltering zonder brede configuratie-/security-imports |
    | `plugin-sdk/string-coerce-runtime` | Smalle helpers voor primitive record-/stringcoercion en normalisatie zonder markdown-/logging-imports |
    | `plugin-sdk/host-runtime` | Helpers voor hostnaam- en SCP-hostnormalisatie |
    | `plugin-sdk/retry-runtime` | Helpers voor retry-configuratie en retry-runner |
    | `plugin-sdk/agent-runtime` | Helpers voor agentmap/identiteit/workspace |
    | `plugin-sdk/directory-runtime` | Config-backed directoryquery/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- en testsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor media ophalen/transformeren/opslaan, op ffprobe gebaseerde detectie van videodimensies en bouwers voor mediapayloads |
    | `plugin-sdk/media-store` | Smalle helpers voor mediaopslag, zoals `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failoverhelpers voor mediageneratie, kandidaatselectie en berichten voor ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte exports voor image/audio-helpers |
    | `plugin-sdk/text-runtime` | Gedeelde helpers voor tekst/markdown/logging, zoals strippen van assistent-zichtbare tekst, helpers voor markdown-rendering/chunking/tabellen, redactierungshelpers, helpers voor directive-tags en veilige-teksthulpprogramma's |
    | `plugin-sdk/text-chunking` | Helper voor uitgaande tekstchunking |
    | `plugin-sdk/speech` | Speech-providertypen plus providergerichte exports voor directives, registry, validatie, OpenAI-compatibele TTS-bouwer en speech-helpers |
    | `plugin-sdk/speech-core` | Gedeelde speech-providertypen, registry, directive, normalisatie en speech-helperexports |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registryhelpers en gedeelde WebSocket-sessiehelper |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime spraak en registryhelpers |
    | `plugin-sdk/image-generation` | Providertypen voor afbeeldingsgeneratie plus helpers voor afbeeldingsassets/data-URL's en de OpenAI-compatibele providerbouwer voor afbeeldingen |
    | `plugin-sdk/image-generation-core` | Gedeelde typen, failover, auth en registryhelpers voor afbeeldingsgeneratie |
    | `plugin-sdk/music-generation` | Typen voor providers/requests/results voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen, failoverhelpers, providerlookup en model-ref-parsing voor muziekgeneratie |
    | `plugin-sdk/video-generation` | Typen voor providers/requests/results voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen, failoverhelpers, providerlookup en model-ref-parsing voor videogeneratie |
    | `plugin-sdk/webhook-targets` | Webhook-doelregistry en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Helpers voor normalisatie van Webhook-paden |
    | `plugin-sdk/web-media` | Gedeelde helpers voor laden van externe/lokale media |
    | `plugin-sdk/zod` | Opnieuw ge-exporteerde `zod` voor gebruikers van de Plugin SDK |
    | `plugin-sdk/testing` | Breed compatibiliteitsbarrel voor legacy Plugin-tests. Nieuwe extensietests moeten in plaats daarvan gerichte SDK-subpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Minimale `createTestPluginApi`-helper voor directe unittests van Plugin-registratie zonder testhelperbridges uit de repo te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Native contractfixtures voor agent-runtime-adapters voor tests van auth, delivery, fallback, tool-hook, prompt-overlay, schema en transcriptprojectie |
    | `plugin-sdk/channel-test-helpers` | Kanaalgerichte testhelpers voor generieke contracten voor actions/setup/status, directoryassertions, levenscyclus bij accountstart, send-config-threading, runtime-mocks, statusissues, uitgaande levering en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Gedeelde suite met foutgevallen voor target-resolution voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Contracthelpers voor Plugin-pakketten, registratie, publieke artefacten, directe imports, runtime-API en import-side-effects |
    | `plugin-sdk/provider-test-contracts` | Contracthelpers voor providerruntime, auth, discovery, onboard, catalogus, wizard, mediacapability, replaybeleid, realtime STT-live-audio, web-search/fetch en stream |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` gebruiken |
    | `plugin-sdk/test-fixtures` | Generieke fixtures voor CLI-runtimecapture, sandboxcontext, skill writer, agent-message, system-event, moduleherlaad, gebundeld Plugin-pad, terminaltekst, chunking, auth-token en typed-case |
    | `plugin-sdk/test-node-mocks` | Gerichte Node builtin mockhelpers voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Geheugensubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager/config/bestand/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/-zoekactie |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports van de foundation-engine van de geheugenhost |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embeddingcontracten voor de geheugenhost, registrytoegang, lokale provider en generieke batch-/remotehelpers |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports van de QMD-engine van de geheugenhost |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports van de storage-engine van de geheugenhost |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-query` | Queryhelpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-secret` | Secrethelpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-events` | Helpers voor het eventjournaal van de geheugenhost |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehelpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor de geheugenhost |
    | `plugin-sdk/memory-host-core` | Vendor-neutraal alias voor core-runtimehelpers van de geheugenhost |
    | `plugin-sdk/memory-host-events` | Vendor-neutraal alias voor eventjournaalhelpers van de geheugenhost |
    | `plugin-sdk/memory-host-files` | Vendor-neutraal alias voor bestands-/runtimehelpers van de geheugenhost |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-helpers voor geheugenaangrenzende Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-runtimefacade voor toegang tot search-manager |
    | `plugin-sdk/memory-host-status` | Vendor-neutraal alias voor statushelpers van de geheugenhost |
  </Accordion>

  <Accordion title="Gereserveerde gebundelde-helper-subpaden">
    Er zijn momenteel geen gereserveerde SDK-subpaden voor gebundelde helpers. Eigenaarsspecifieke
    helpers staan binnen het eigenaarspakket van de Plugin, terwijl herbruikbare hostcontracten
    generieke SDK-subpaden gebruiken, zoals `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Instellen van Plugin SDK](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
