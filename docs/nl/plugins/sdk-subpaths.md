---
read_when:
    - Het juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Controleren van gebundelde Plugin-subpaden en helperinterfaces
summary: 'Plugin SDK-subpadcatalogus: welke imports waar staan, gegroepeerd per gebied'
title: Plugin SDK-subpaden
x-i18n:
    generated_at: "2026-04-29T23:06:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60fe10982b9aa01af76bfbd72475168c8138f68dd410b4488b6b6c4c00097e53
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  De Plugin-SDK wordt beschikbaar gesteld als een set smalle subpaden onder `openclaw/plugin-sdk/`.
  Deze pagina catalogiseert de veelgebruikte subpaden, gegroepeerd op doel. De gegenereerde
  volledige lijst met meer dan 200 subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`;
  gereserveerde hulpsubpaden voor gebundelde plugins verschijnen daar ook, maar zijn een implementatiedetail
  tenzij een documentatiepagina ze expliciet promoot. Maintainers kunnen actieve
  gereserveerde hulpsubpaden auditen met `pnpm plugins:boundary-report:summary`; ongebruikte
  gereserveerde hulpexports laten het CI-rapport falen in plaats van als slapende compatibiliteitsschuld in de openbare SDK te blijven.

  Zie voor de handleiding voor het maken van plugins [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview).

  ## Plugin-entry

  | Subpad                                    | Belangrijke exports                                                                                                                                                          |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Brede compatibiliteitsbarrel voor verouderde plugintests; geef voor nieuwe extensietests de voorkeur aan gerichte testsubpaden                                               |
  | `plugin-sdk/plugin-test-api`              | Minimale mockbuilder voor `OpenClawPluginApi` voor unit-tests voor directe pluginregistratie                                                                                  |
  | `plugin-sdk/agent-runtime-test-contracts` | Native contractfixtures voor agent-runtime-adapters voor auth-profielen, leveringsonderdrukking, fallbackclassificatie, toolhooks, promptoverlays, schema's en transcriptreparatie |
  | `plugin-sdk/channel-test-helpers`         | Testhelpers voor levenscyclus van kanaalaccounts, directory, verzendconfiguratie, runtime-mock, hook, gebundelde kanaalentry, enveloptijdstempel, koppelingsantwoord en generieke kanaalcontracten |
  | `plugin-sdk/channel-target-testing`       | Gedeelde testsuite voor foutgevallen bij doelresolutie van kanalen                                                                                                           |
  | `plugin-sdk/plugin-test-contracts`        | Helpers voor pluginregistratie, pakketmanifest, openbaar artefact, runtime-API, import-side-effect en directe importcontracten                                               |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures voor tests van pluginruntime, registry, providerregistratie, setupwizard en runtime-taskflow                                                                        |
  | `plugin-sdk/provider-test-contracts`      | Contracthelpers voor providerruntime, auth, discovery, onboarden, catalogus, mediacapability, replaybeleid, realtime STT-liveaudio, webzoek-/fetchfuncties en wizard         |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` uitvoeren                                                                                    |
  | `plugin-sdk/test-env`                     | Fixtures voor testomgeving, fetch/netwerk, wegwerp-HTTP-server, inkomende request, live-test, tijdelijk bestandssysteem en tijdscontrole                                     |
  | `plugin-sdk/test-fixtures`                | Generieke testfixtures voor CLI, sandbox, skill, agentbericht, systeemevent, moduleherlaadactie, pad van gebundelde plugin, terminal, chunking, auth-token en getypeerde cases |
  | `plugin-sdk/test-node-mocks`              | Gerichte mockhelpers voor ingebouwde Node-modules voor gebruik in Vitest-`vi.mock("node:*")`-factories                                                                        |
  | `plugin-sdk/migration`                    | Helpers voor migratieprovideritems zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redacthelpers en `summarizeMigrationItems`                           |
  | `plugin-sdk/migration-runtime`            | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                         |

  <AccordionGroup>
  <Accordion title="Kanaalsubpaden">
    | Subpad | Belangrijke exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export van het Zod-schema voor root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde helpers voor setupwizard, allowlist-prompts en builders voor setupstatus |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor multi-accountconfiguratie/action-gates en fallbackhelpers voor standaardaccounts |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers voor account-id-normalisatie |
    | `plugin-sdk/account-resolution` | Helpers voor accountopzoeking en standaardfallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten/accountacties |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde kanaalconfiguratieschema-primitieven en generieke builder |
    | `plugin-sdk/bundled-channel-config-schema` | Configuratieschema's voor gebundelde OpenClaw-kanalen, alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor configuratieschema's van gebundelde kanalen |
    | `plugin-sdk/telegram-command-config` | Helpers voor normalisatie/validatie van aangepaste Telegram-commando's met fallback voor gebundelde contracten |
    | `plugin-sdk/command-gating` | Smalle helpers voor commando-autorisatiegates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helpers voor de levenscyclus/finalisatie van conceptstreams |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inkomende routes en envelopbuilders |
    | `plugin-sdk/inbound-reply-dispatch` | Gedeelde helpers voor inkomende registratie en dispatch |
    | `plugin-sdk/messaging-targets` | Helpers voor doelparsing/-matching |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor het laden van uitgaande media |
    | `plugin-sdk/outbound-send-deps` | Lichtgewicht lookup van uitgaande verzendafhankelijkheden voor kanaaladapters |
    | `plugin-sdk/outbound-runtime` | Helpers voor uitgaande levering, identiteit, verzenddelegates, sessies, formatting en payloadplanning |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor pollnormalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor thread-binding-levenscyclus en adapters |
    | `plugin-sdk/agent-media-payload` | Verouderde builder voor agentmediapayloads |
    | `plugin-sdk/conversation-runtime` | Helpers voor gesprek/threadbinding, koppeling en geconfigureerde bindingen |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor runtimeconfiguratiesnapshot |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtime-resolutie van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatussnapshots/-samenvattingen |
    | `plugin-sdk/channel-config-primitives` | Smalle kanaalconfiguratieschema-primitieven |
    | `plugin-sdk/channel-config-writes` | Autorisatiehelpers voor het schrijven van kanaalconfiguratie |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor bewerken/lezen van allowlist-configuratie |
    | `plugin-sdk/group-access` | Gedeelde beslissingshelpers voor groepstoegang |
    | `plugin-sdk/direct-dm` | Gedeelde auth-/guardhelpers voor directe DM's |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten geïnjecteerde runtimehelpers of generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/interactive-runtime` | Semantische berichtpresentatie, levering en verouderde interactieve antwoordhelpers. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibiliteitsbarrel voor inkomende debounce, mentionmatching, mentionbeleidhelpers en envelophelpers |
    | `plugin-sdk/channel-inbound-debounce` | Smalle inkomende debouncehelpers |
    | `plugin-sdk/channel-mention-gating` | Smalle mentionbeleid-, mentionmarker- en mentionteksthelpers zonder het bredere inkomende runtimeoppervlak |
    | `plugin-sdk/channel-envelope` | Smalle formattinghelpers voor inkomende enveloppen |
    | `plugin-sdk/channel-location` | Kanaallocatiecontext en formattinghelpers |
    | `plugin-sdk/channel-logging` | Kanaallogginghelpers voor inkomende drops en typ-/ack-fouten |
    | `plugin-sdk/channel-send-result` | Antwoordresultaattypen |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die behouden zijn voor plugincompatibiliteit |
    | `plugin-sdk/channel-route` | Gedeelde helpers voor routenormalisatie, parsergestuurde doelresolutie, thread-id-stringificatie, dedupe-/compacte routesleutels, geparste doeltypen en route-/doelvergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor doelparsing; aanroepers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Bedrading voor feedback/reacties |
    | `plugin-sdk/channel-secret-runtime` | Smalle secret-contracthelpers zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en secretdoeltypen |
  </Accordion>

  <Accordion title="Provider-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor configuratie, catalogusdetectie en runtime-modelvoorbereiding |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor lokale serverstandaarden, modeldetectie, requestheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Geselecteerde helpers voor lokale/zelfgehoste providerconfiguratie |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele helpers voor zelfgehoste providerconfiguratie |
    | `plugin-sdk/cli-backend` | Standaarden voor CLI-backend + watchdogconstanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-helpers voor API-sleutelresolutie voor providerplugins |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor API-sleutel-onboarding/profielschrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaard OAuth-authenticatieresultaatbouwer |
    | `plugin-sdk/provider-auth-login` | Gedeelde interactieve aanmeldhelpers voor providerplugins |
    | `plugin-sdk/provider-env-vars` | Helpers voor het opzoeken van provider-authenticatieomgevingsvariabelen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replaybeleid, helpers voor provider-eindpunten en normalisatiehelpers voor model-id's zoals `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-hook voor providercatalogusuitbreiding en plugin-providerregisterseams voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke helpers voor provider-HTTP/eindpuntmogelijkheden, provider-HTTP-fouten en multipart-formulierhelpers voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle helpers voor web-fetch-configuratie/selectiecontracten, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers voor registratie/cache van web-fetch-providers |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle helpers voor webzoekconfiguratie/referenties voor providers die geen plugin-enable-bedrading nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle helpers voor webzoekconfiguratie-/referentiecontracten, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped setters/getters voor referenties |
    | `plugin-sdk/provider-web-search` | Helpers voor registratie/cache/runtime van webzoekproviders |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-schemaopschoning + diagnostiek, en xAI-compatibiliteitshelpers zoals `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` en vergelijkbaar |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, streamwrappertypen en gedeelde Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-wrapperhelpers |
    | `plugin-sdk/provider-transport-runtime` | Native providertransporthelpers zoals guarded fetch, transportberichttransformaties en schrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor onboardingconfiguratiepatches |
    | `plugin-sdk/global-singleton` | Helpers voor proceslokale singleton/map/cache |
    | `plugin-sdk/group-activation` | Smalle helpers voor groepsactivatiemodus en opdrachtparsing |
  </Accordion>

  <Accordion title="Subpaden voor authenticatie en beveiliging">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, opdrachtregisterhelpers inclusief dynamische opmaak van argumentmenu's, helpers voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Bouwers voor opdracht-/helpberichten zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeurderresolutie en actie-authenticatie in dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Helpers voor native exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor goedkeuringsmogelijkheden/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde helper voor goedkeuringsgateway-resolutie |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor hot kanaalentrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtime-helpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/gatewayseams wanneer die volstaan |
    | `plugin-sdk/approval-native-runtime` | Helpers voor native goedkeuringsdoel + accountbinding |
    | `plugin-sdk/approval-reply-runtime` | Helpers voor antwoordpayloads voor exec-/plugingoedkeuringen |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/plugingoedkeuringspayloads, native goedkeuringsroutering/runtime-helpers en helpers voor gestructureerde goedkeuringsweergave zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle resethelpers voor deduplicatie van inkomende antwoorden |
    | `plugin-sdk/channel-contract-testing` | Smalle kanaalcontracttesthelpers zonder de brede testbarrel |
    | `plugin-sdk/command-auth-native` | Native opdrachtauthenticatie, dynamische opmaak van argumentmenu's en native sessiedoelhelpers |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor opdrachtdetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht tekstpredicaten voor opdrachten in hot kanaalpaden |
    | `plugin-sdk/command-surface` | Helpers voor opdrachtbody-normalisatie en opdrachtoppervlak |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contractverzameling voor secret-oppervlakken van kanaal/plugins |
    | `plugin-sdk/secret-ref-runtime` | Smalle `coerceSecretRef`- en SecretRef-typehelpers voor secret-contract-/configuratieparsing |
    | `plugin-sdk/security-runtime` | Gedeelde helpers voor vertrouwen, DM-gating, externe content, redactie van gevoelige tekst, constant-time secretvergelijking en secret-verzameling |
    | `plugin-sdk/ssrf-policy` | Helpers voor host-toestaanlijst en SSRF-beleid voor privénetwerken |
    | `plugin-sdk/ssrf-dispatcher` | Smalle pinned-dispatcherhelpers zonder het brede infra-runtimeoppervlak |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF-fout en helpers voor SSRF-beleid |
    | `plugin-sdk/secret-input` | Helpers voor parsing van secretinvoer |
    | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-requests/-doelen en raw websocket-/body-coercion |
    | `plugin-sdk/webhook-request-guards` | Helpers voor requestbodysize/time-out |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede runtime-/logging-/back-up-/plugin-installatiehelpers |
    | `plugin-sdk/runtime-env` | Smalle helpers voor runtime-omgeving, logger, time-out, opnieuw proberen en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratiefacade voor genormaliseerd profiel/standaardwaarden, CDP-URL-parsing en browserbesturingsauthenticatiehelpers |
    | `plugin-sdk/channel-runtime-context` | Generieke helpers voor registratie en lookup van channel-runtimecontext |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor pluginopdrachten, hooks, HTTP en interactie |
    | `plugin-sdk/hook-runtime` | Gedeelde helpers voor webhook-/interne hook-pijplijn |
    | `plugin-sdk/lazy-runtime` | Helpers voor lazy runtime-import/binding, zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers voor procesuitvoering |
    | `plugin-sdk/cli-runtime` | CLI-helpers voor formattering, wachten, versie, argumentaanroep en lazy commandogroepen |
    | `plugin-sdk/gateway-runtime` | Gateway-client, helper voor starten van event-loop-ready client, Gateway-CLI-RPC, Gateway-protocolfouten en helpers voor channelstatus-patches |
    | `plugin-sdk/config-types` | Configuratieoppervlak met alleen typen voor pluginconfiguratievormen zoals `OpenClawConfig` en configuratietypen voor kanalen/providers |
    | `plugin-sdk/plugin-config-runtime` | Runtime-helpers voor pluginconfiguratie-lookup, zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele helpers voor configuratiemutatie, zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers voor huidige procesconfiguratiesnapshot, zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en testsnapshot-setters |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-opdrachtnaam/-beschrijving en controles op duplicaten/conflicten, zelfs wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van autolinks voor bestandsverwijzingen zonder de brede text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/plugingoedkeuring, bouwers voor goedkeuringsmogelijkheden, auth-/profielhelpers, native routing-/runtimehelpers en formattering van gestructureerde weergavepaden voor goedkeuring |
    | `plugin-sdk/reply-runtime` | Gedeelde runtimehelpers voor inkomend verkeer/antwoorden, chunking, dispatch, Heartbeat, antwoordplanner |
    | `plugin-sdk/reply-dispatch-runtime` | Smalle helpers voor antwoorddispatch/finaliseren en conversatielabels |
    | `plugin-sdk/reply-history` | Gedeelde helpers en markeringen voor antwoordgeschiedenis met kort venster, zoals `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Smalle helpers voor tekst-/markdownchunking |
    | `plugin-sdk/session-store-runtime` | Helpers voor sessiestorepad, sessiesleutel, bijgewerkt-op en storemutatie |
    | `plugin-sdk/cron-store-runtime` | Helpers voor Cron-storepad/laden/opslaan |
    | `plugin-sdk/state-paths` | Helpers voor status-/OAuth-mappaden |
    | `plugin-sdk/routing` | Helpers voor route-/sessiesleutel-/accountbinding, zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde helpers voor kanaal-/accountstatussamenvatting, standaardwaarden voor runtime-status en metadatahelpers voor issues |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde helpers voor doelresolver |
    | `plugin-sdk/string-normalization-runtime` | Helpers voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | String-URL's uit fetch-/request-achtige invoer extraheren |
    | `plugin-sdk/run-command` | Getimede commandorunner met genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Algemene paramlezers voor tools/CLI |
    | `plugin-sdk/tool-payload` | Genormaliseerde payloads uit toolresultaatobjecten extraheren |
    | `plugin-sdk/tool-send` | Canonieke velden voor verzenddoel uit toolargumenten extraheren |
    | `plugin-sdk/temp-path` | Gedeelde helpers voor tijdelijke downloadpaden |
    | `plugin-sdk/logging-core` | Subsystemlogger en redactietools |
    | `plugin-sdk/markdown-table-runtime` | Helpers voor markdown-tabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Helpers voor model-/sessie-override, zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers voor configuratieresolutie van talk-providers |
    | `plugin-sdk/json-store` | Kleine helpers voor lezen/schrijven van JSON-status |
    | `plugin-sdk/file-lock` | Re-entrante helpers voor bestandslocks |
    | `plugin-sdk/persistent-dedupe` | Helpers voor schijfgebaseerde dedupe-cache |
    | `plugin-sdk/acp-runtime` | ACP-runtime-/sessie- en antwoorddispatchhelpers |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht helpers voor ACP-backendregistratie en antwoorddispatch voor plugins die bij het opstarten worden geladen |
    | `plugin-sdk/acp-binding-resolve-runtime` | Alleen-lezen resolutie van ACP-binding zonder lifecycle-startup-imports |
    | `plugin-sdk/agent-config-primitives` | Smalle primitives voor runtimeconfiguratieschema van agents |
    | `plugin-sdk/boolean-param` | Losse booleaanse paramlezer |
    | `plugin-sdk/dangerous-name-runtime` | Helpers voor resolutie van dangerous-name-matching |
    | `plugin-sdk/device-bootstrap` | Helpers voor device-bootstrap en pairing-token |
    | `plugin-sdk/extension-shared` | Gedeelde primitives voor passief kanaal, status en ambient proxyhelper |
    | `plugin-sdk/models-provider-runtime` | Helpers voor `/models`-opdracht-/providerantwoorden |
    | `plugin-sdk/skill-commands-runtime` | Helpers voor het weergeven van Skill-opdrachten |
    | `plugin-sdk/native-command-registry` | Helpers voor native commandoregistratie/opbouw/serialisatie |
    | `plugin-sdk/agent-harness` | Experimenteel trusted-plugin-oppervlak voor low-level agentharnassen: harnastypen, helpers voor active-run steer/abort, helpers voor OpenClaw-toolbridge, helpers voor toolbeleid voor runtime-plan, classificatie van terminaluitkomsten, helpers voor formattering/detail van toolvoortgang en hulpprogramma's voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Helpers voor Z.AI-endpointdetectie |
    | `plugin-sdk/async-lock-runtime` | Proceslokale async-lockhelper voor kleine runtime-statusbestanden |
    | `plugin-sdk/channel-activity-runtime` | Helper voor kanaalactiviteitstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Helper voor begrensde async-taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Helpers voor dedupe-cache in geheugen |
    | `plugin-sdk/delivery-queue-runtime` | Helper voor het leegmaken van uitgaande wachtende leveringen |
    | `plugin-sdk/file-access-runtime` | Helpers voor veilige lokale-bestands- en mediabronpaden |
    | `plugin-sdk/heartbeat-runtime` | Helpers voor Heartbeat-events en zichtbaarheid |
    | `plugin-sdk/number-runtime` | Helper voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Helpers voor veilige tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Helpers voor systeemeventwachtrijen |
    | `plugin-sdk/transport-ready-runtime` | Helper voor wachten op transportgereedheid |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine helpers voor begrensde cache |
    | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostische vlaggen, events en tracecontext |
    | `plugin-sdk/error-runtime` | Helpers voor foutgrafiek, formattering, gedeelde foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrapte fetch, proxy, `EnvHttpProxyAgent`-optie en helpers voor gepinde lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcherbewuste runtime-fetch zonder proxy-/guarded-fetch-imports |
    | `plugin-sdk/response-limit-runtime` | Begrensde response-body-lezer zonder het brede media-runtimeoppervlak |
    | `plugin-sdk/session-binding-runtime` | Huidige status van conversatiebinding zonder geconfigureerde bindingrouting of pairing-stores |
    | `plugin-sdk/session-store-runtime` | Sessiestorehelpers zonder brede imports voor configuratieschrijfacties/onderhoud |
    | `plugin-sdk/context-visibility-runtime` | Resolutie van contextzichtbaarheid en aanvullende contextfiltering zonder brede config-/security-imports |
    | `plugin-sdk/string-coerce-runtime` | Smalle helpers voor primitive record-/stringcoercion en normalisatie zonder markdown-/logging-imports |
    | `plugin-sdk/host-runtime` | Helpers voor hostnaam- en SCP-hostnormalisatie |
    | `plugin-sdk/retry-runtime` | Helpers voor retryconfiguratie en retryrunner |
    | `plugin-sdk/agent-runtime` | Helpers voor agentmap/identiteit/workspace |
    | `plugin-sdk/directory-runtime` | Configuratiegebaseerde directoryquery/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpaden voor mogelijkheden en testen">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor media ophalen/transformeren/opslaan, door ffprobe ondersteunde detectie van videodimensies en builders voor media-payloads |
    | `plugin-sdk/media-store` | Smalle media-store-helpers zoals `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failover-helpers voor mediageneratie, kandidaatselectie en berichten voor ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte exports voor image/audio-helpers |
    | `plugin-sdk/text-runtime` | Gedeelde helpers voor tekst/markdown/logging, zoals het strippen van voor de assistent zichtbare tekst, helpers voor markdown-rendering/chunking/tabellen, redactiehelpers, helpers voor directive-tags en safe-text-hulpprogramma's |
    | `plugin-sdk/text-chunking` | Helper voor uitgaande tekstchunking |
    | `plugin-sdk/speech` | Spraakprovidertypen plus providergerichte directive-, registry-, validatie-, OpenAI-compatibele TTS-builder- en spraakhelper-exports |
    | `plugin-sdk/speech-core` | Gedeelde spraakprovidertypen, registry-, directive-, normalisatie- en spraakhelper-exports |
    | `plugin-sdk/realtime-transcription` | Realtime-transcriptieprovidertypen, registry-helpers en gedeelde WebSocket-sessiehelper |
    | `plugin-sdk/realtime-voice` | Realtime-spraakprovidertypen en registry-helpers |
    | `plugin-sdk/image-generation` | Afbeeldingsgeneratieprovidertypen plus helpers voor afbeeldingsassets/data-URL's en de OpenAI-compatibele image-provider-builder |
    | `plugin-sdk/image-generation-core` | Gedeelde typen voor afbeeldingsgeneratie, failover-, auth- en registry-helpers |
    | `plugin-sdk/music-generation` | Providertypen en request/result-typen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen voor muziekgeneratie, failover-helpers, provider-lookup en model-ref-parsing |
    | `plugin-sdk/video-generation` | Providertypen en request/result-typen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failover-helpers, provider-lookup en model-ref-parsing |
    | `plugin-sdk/webhook-targets` | Webhook-doelregistry en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Helpers voor Webhook-padnormalisatie |
    | `plugin-sdk/web-media` | Gedeelde helpers voor laden van externe/lokale media |
    | `plugin-sdk/zod` | Opnieuw geëxporteerde `zod` voor consumenten van de Plugin SDK |
    | `plugin-sdk/testing` | Brede compatibiliteitsbarrel voor legacy plugintests. Nieuwe extensietests moeten in plaats daarvan gerichte SDK-subpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Minimale `createTestPluginApi`-helper voor directe unittests van pluginregistratie zonder repo-testhelperbridges te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Native agent-runtime-adaptercontractfixtures voor tests van auth, levering, fallback, tool-hook, prompt-overlay, schema en transcriptprojectie |
    | `plugin-sdk/channel-test-helpers` | Kanaalgerichte testhelpers voor generieke actions/setup/status-contracten, directory-assertions, account-startuplevenscyclus, send-config-threading, runtime-mocks, statusproblemen, uitgaande levering en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Gedeelde suite voor foutgevallen bij doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Helpers voor Plugin-pakket-, registratie-, publiek artefact-, directe import-, runtime-API- en import-side-effect-contracten |
    | `plugin-sdk/provider-test-contracts` | Helpers voor providerruntime-, auth-, discovery-, onboard-, catalog-, wizard-, mediamogelijkheid-, replaybeleid-, realtime STT-live-audio-, web-search/fetch- en stream-contracten |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` oefenen |
    | `plugin-sdk/test-fixtures` | Generieke fixtures voor CLI-runtimecapture, sandboxcontext, skillwriter, agentbericht, systeemevent, moduleherlaadactie, gebundeld pluginpad, terminaltekst, chunking, auth-token en getypeerde cases |
    | `plugin-sdk/test-node-mocks` | Gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Geheugen-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager-/config-/bestand-/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/-zoekfunctie |
    | `plugin-sdk/memory-core-host-engine-foundation` | Engine-exports voor geheugenhostfundament |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embeddingcontracten voor geheugenhost, registrytoegang, lokale provider en generieke batch-/remote-helpers |
    | `plugin-sdk/memory-core-host-engine-qmd` | QMD-engine-exports voor geheugenhost |
    | `plugin-sdk/memory-core-host-engine-storage` | Storage-engine-exports voor geheugenhost |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-query` | Queryhelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-secret` | Geheimhelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-events` | Eventjournal-helpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-host-core` | Leverancieronafhankelijke alias voor core-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-host-events` | Leverancieronafhankelijke alias voor eventjournal-helpers voor geheugenhost |
    | `plugin-sdk/memory-host-files` | Leverancieronafhankelijke alias voor bestands-/runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-helpers voor plugins naast geheugenfunctionaliteit |
    | `plugin-sdk/memory-host-search` | Active Memory-runtimefacade voor toegang tot de zoekmanager |
    | `plugin-sdk/memory-host-status` | Leverancieronafhankelijke alias voor statushelpers voor geheugenhost |
  </Accordion>

  <Accordion title="Gereserveerde subpaden voor gebundelde helpers">
    Er zijn momenteel geen gereserveerde SDK-subpaden voor gebundelde helpers. Eigenaarsspecifieke
    helpers bevinden zich in het eigenaarspluginpakket, terwijl herbruikbare hostcontracten
    generieke SDK-subpaden gebruiken zoals `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Installatie van Plugin SDK](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
