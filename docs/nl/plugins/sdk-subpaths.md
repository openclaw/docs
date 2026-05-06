---
read_when:
    - Het juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Gebundelde Plugin-subpaden en helperinterfaces auditen
summary: 'Catalogus met subpaden van de Plugin SDK: welke imports waar thuishoren, gegroepeerd per gebied'
title: Plugin SDK-subpaden
x-i18n:
    generated_at: "2026-05-06T09:26:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

De plugin-SDK wordt beschikbaar gesteld als een set smalle subpaden onder `openclaw/plugin-sdk/`.
Deze pagina catalogiseert de veelgebruikte subpaden, gegroepeerd op doel. De gegenereerde
volledige lijst met 200+ subpaden staat in `scripts/lib/plugin-sdk-entrypoints.json`;
gereserveerde hulpsubpaden voor gebundelde plugins verschijnen daar ook, maar zijn een implementatiedetail
tenzij een documentatiepagina ze expliciet naar voren schuift. Maintainers kunnen actieve
gereserveerde hulpsubpaden controleren met `pnpm plugins:boundary-report:summary`; ongebruikte
gereserveerde helper-exports laten het CI-rapport falen in plaats van als slapende compatibiliteitsschuld
in de openbare SDK te blijven.

Zie [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview) voor de gids voor het maken van plugins.

## Plugin-ingangspunt

| Subpad                                    | Belangrijkste geëxporteerde items                                                                                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Brede compatibiliteitsbarrel voor verouderde plugintests; geef voor nieuwe extensietests de voorkeur aan gerichte testsubpaden                                               |
| `plugin-sdk/plugin-test-api`              | Minimale mockbouwer voor `OpenClawPluginApi` voor unit-tests met directe pluginregistratie                                                                                   |
| `plugin-sdk/agent-runtime-test-contracts` | Contractfixtures voor native agent-runtime-adapters voor auth-profielen, bezorgingsonderdrukking, fallbackclassificatie, toolhooks, prompt-overlays, schema's en transcriptreparatie |
| `plugin-sdk/channel-test-helpers`         | Testhelpers voor kanaalaccountlevenscyclus, directory, verzendconfiguratie, runtime-mock, hook, gebundeld kanaalingangspunt, enveloptijdstempel, koppelingsantwoord en generiek kanaalcontract |
| `plugin-sdk/channel-target-testing`       | Gedeelde testsuite voor foutgevallen bij kanaaldoelresolutie                                                                                                                 |
| `plugin-sdk/plugin-test-contracts`        | Contracthelpers voor pluginregistratie, pakketmanifest, openbaar artefact, runtime-API, importbijwerking en directe import                                                  |
| `plugin-sdk/plugin-test-runtime`          | Fixtures voor tests voor plugin-runtime, register, providerregistratie, configuratiewizard en runtime-taakstroom                                                             |
| `plugin-sdk/provider-test-contracts`      | Contracthelpers voor provider-runtime, auth, ontdekking, onboarden, catalogus, mediacapaciteit, replaybeleid, realtime STT-live-audio, webzoek-/ophaalfuncties en wizard    |
| `plugin-sdk/provider-http-test-mocks`     | Opt-in Vitest HTTP-/auth-mocks voor providertests die `plugin-sdk/provider-http` uitvoeren                                                                                   |
| `plugin-sdk/test-env`                     | Fixtures voor testomgeving, fetch/netwerk, wegwerp-HTTP-server, inkomend verzoek, live-test, tijdelijk bestandssysteem en tijdcontrole                                      |
| `plugin-sdk/test-fixtures`                | Generieke testfixtures voor CLI, sandbox, skill, agentbericht, systeemevent, moduleherlading, gebundeld pluginpad, terminal, chunking, auth-token en getypeerde cases        |
| `plugin-sdk/test-node-mocks`              | Gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest-`vi.mock("node:*")`-factories                                                                  |
| `plugin-sdk/migration`                    | Helpers voor migratieprovideritems zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redacteerhelpers en `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime`            | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                         |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema-export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde helpers voor de installatiewizard, allowlist-prompts, bouwers voor installatiestatus |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor multi-accountconfiguratie/action-gate, helpers voor fallback naar standaardaccount |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers voor normalisatie van account-id's |
    | `plugin-sdk/account-resolution` | Helpers voor accountopzoeking en standaardfallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten/accountacties |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Helpers voor verouderde antwoordpijplijn. Nieuwe code voor de kanaalantwoordpijplijn moet `createChannelMessageReplyPipeline` en `resolveChannelMessageSourceReplyDeliveryMode` uit `plugin-sdk/channel-message` gebruiken. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde kanaalconfiguratie-schema-primitieven plus Zod- en directe JSON/TypeBox-bouwers |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's, alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor configuratieschema's van gebundelde kanalen |
    | `plugin-sdk/telegram-command-config` | Helpers voor normalisatie/validatie van aangepaste Telegram-opdrachten met fallback naar gebundeld contract |
    | `plugin-sdk/command-gating` | Smalle helpers voor opdracht-autorisatiegate |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, en helpers voor de levenscyclus van verouderde conceptstreams. Nieuwe code voor preview-finalisatie moet `plugin-sdk/channel-message` gebruiken. |
    | `plugin-sdk/channel-message` | Goedkope helpers voor het contract van de berichtlevenscyclus, zoals `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, compatibiliteitsfacades, afleiding van duurzame-final-capability, capability-bewijshelpers voor verzend-/ontvangstbewijs-/neveneffect-capabilities, `MessageReceiveContext`, beleidsbewijzen voor ontvangstbevestiging, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, capability-bewijzen voor live-preview en live-finalizer, duurzame herstelstatus, `RenderedMessageBatch`, berichtontvangstbewijs-typen en helpers voor ontvangstbewijs-id's. Zie [Kanaalbericht-API](/nl/plugins/sdk-channel-message). Verouderde `createChannelTurnReplyPipeline` blijft alleen bestaan voor compatibiliteitsdispatchers. |
    | `plugin-sdk/channel-message-runtime` | Helpers voor runtimebezorging die uitgaande bezorging kunnen laden, waaronder `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` en `recordChannelMessageReplyDispatch`. Gebruik vanuit runtime-modules voor monitoring/verzending, niet vanuit hot plugin-bootstrapbestanden. |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inkomende routes en envelopbouwers |
    | `plugin-sdk/inbound-reply-dispatch` | Verouderde gedeelde helpers voor opnemen-en-dispatchen van inkomende berichten, predicaten voor zichtbare/finale dispatch en verouderde `deliverDurableInboundReplyPayload`-compatibiliteit voor voorbereide kanaaldispatchers. Nieuwe code voor kanaalontvangst/dispatch moet runtime-levenscyclushelpers importeren uit `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Helpers voor doelparsering/-matching |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor het laden van uitgaande media |
    | `plugin-sdk/outbound-send-deps` | Lichtgewicht afhankelijkheidsopzoeking voor uitgaand verzenden voor kanaaladapters |
    | `plugin-sdk/outbound-runtime` | Helpers voor uitgaande bezorging, identiteit, verzenddelegate, sessie, opmaak en payloadplanning |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor poll-normalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor thread-binding-levenscyclus en adapters |
    | `plugin-sdk/agent-media-payload` | Verouderde bouwer voor agent-mediapayloads |
    | `plugin-sdk/conversation-runtime` | Helpers voor conversatie-/threadbinding, koppeling en geconfigureerde binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor snapshot van runtimeconfiguratie |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtime-resolutie van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatus-snapshot/-samenvatting |
    | `plugin-sdk/channel-config-primitives` | Smalle primitieven voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Helpers voor autorisatie van schrijven naar kanaalconfiguratie |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor bewerken/lezen van allowlist-configuratie |
    | `plugin-sdk/group-access` | Gedeelde helpers voor beslissingen over groepstoegang |
    | `plugin-sdk/direct-dm` | Gedeelde helpers voor authenticatie/guards van directe DM's |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten geïnjecteerde runtimehelpers of generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/zalouser` | Verouderde Zalo Personal-compatibiliteitsfacade voor gepubliceerde Lark/Zalo-pakketten die nog steeds afzenderopdracht-autorisatie importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Semantische berichtpresentatie, bezorging en verouderde helpers voor interactieve antwoorden. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibiliteitsbarrel voor inkomende debounce, mention-matching, helpers voor mention-beleid en envelophelpers |
    | `plugin-sdk/channel-inbound-debounce` | Smalle helpers voor inkomende debounce |
    | `plugin-sdk/channel-mention-gating` | Smalle helpers voor mention-beleid, mention-markeringen en mention-tekst zonder het bredere inkomende runtime-oppervlak |
    | `plugin-sdk/channel-envelope` | Smalle helpers voor opmaak van inkomende enveloppen |
    | `plugin-sdk/channel-location` | Helpers voor kanaallocatiecontext en opmaak |
    | `plugin-sdk/channel-logging` | Helpers voor kanaallogging voor gedropte inkomende berichten en type-/ack-fouten |
    | `plugin-sdk/channel-send-result` | Antwoordresultaattypen |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die behouden blijven voor plugincompatibiliteit |
    | `plugin-sdk/channel-route` | Gedeelde helpers voor routenormalisatie, parsergestuurde doelresolutie, stringificatie van thread-id's, dedupe/compacte routesleutels, geparseerde-doeltypen en route-/doelvergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor doelparsering; aanroepers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Koppeling van feedback/reacties |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contracten, zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en geheime doeltypen |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor setup, catalogusdetectie en voorbereiding van runtimemodellen |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor lokale serverstandaarden, modeldetectie, aanvraagheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Gecureerde helpers voor setup van lokale/zelfgehoste providers |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele helpers voor setup van zelfgehoste providers |
    | `plugin-sdk/cli-backend` | CLI-backendstandaarden + watchdog-constanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-helpers voor API-key-resolutie voor providerplugins |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor API-key-onboarding/profielschrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaard builder voor OAuth-auth-resultaten |
    | `plugin-sdk/provider-auth-login` | Gedeelde interactieve loginhelpers voor providerplugins |
    | `plugin-sdk/provider-env-vars` | Helpers voor het opzoeken van provider-auth-env-vars |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde builders voor replaybeleid, helpers voor providerendpoints en helpers voor model-id-normalisatie, zoals `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtimehook voor provider-catalogusuitbreiding en registryseams voor pluginproviders voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke helpers voor provider-HTTP/endpointmogelijkheden, provider-HTTP-fouten en multipart-formulierhelpers voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle helpers voor web-fetch-configuratie/selectiecontracten, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers voor registratie/cache van web-fetch-providers |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle helpers voor web-search-configuratie/referenties voor providers die geen plugin-enable-bedrading nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle helpers voor web-search-configuratie/referentiecontracten, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped referentie-setters/getters |
    | `plugin-sdk/provider-web-search` | Helpers voor registratie/cache/runtime van web-search-providers |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-schemopschoning + diagnostiek en xAI-compathelpers, zoals `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` en vergelijkbare exports |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, streamwrappertypen en gedeelde Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-wrapperhelpers |
    | `plugin-sdk/provider-transport-runtime` | Native providertransporthelpers, zoals guarded fetch, transformaties van transportberichten en beschrijfbare transport-eventstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor onboarding-configuratiepatches |
    | `plugin-sdk/global-singleton` | Proceslokale singleton-/map-/cachehelpers |
    | `plugin-sdk/group-activation` | Smalle helpers voor groepsactivatiemodus en commandoparsing |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers voor commandoregistry, inclusief dynamische opmaak van argumentmenu's, helpers voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Builders voor commando-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor approver-resolutie en action-auth binnen dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Helpers voor native exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor approvalmogelijkheden/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde helper voor approval-gatewayresolutie |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht helpers voor het laden van native approvaladapters voor hot channel-entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtimehelpers voor approvalhandlers; geef de voorkeur aan de smallere adapter-/gatewayseams wanneer die voldoende zijn |
    | `plugin-sdk/approval-native-runtime` | Native helpers voor approvaldoelen + accountbinding |
    | `plugin-sdk/approval-reply-runtime` | Helpers voor replypayloads voor exec-/pluginapproval |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/pluginapprovalpayloads, native helpers voor approvalrouting/runtime en gestructureerde helpers voor approvalweergave, zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle resethelpers voor deduplicatie van inkomende replies |
    | `plugin-sdk/channel-contract-testing` | Smalle helpers voor channelcontracttests zonder de brede testing barrel |
    | `plugin-sdk/command-auth-native` | Native commando-auth, dynamische opmaak van argumentmenu's en native helpers voor sessiedoelen |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor commandodetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht commandotekstpredicaten voor hot channel-paden |
    | `plugin-sdk/command-surface` | Helpers voor commandobody-normalisatie en commandosurface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contractverzameling voor channel-/pluginsecretsurfaces |
    | `plugin-sdk/secret-ref-runtime` | Smalle `coerceSecretRef`- en SecretRef-typinghelpers voor secret-contract-/configuratieparsing |
    | `plugin-sdk/security-runtime` | Gedeelde helpers voor vertrouwen, DM-gating, rootbegrensde bestanden/paden, inclusief create-only writes, synchrone/asynchrone atomische bestandsvervanging, schrijven naar tijdelijke sibling-bestanden, fallback voor cross-device move, helpers voor private file-store, symlink-parentguards, externe content, redactie van gevoelige tekst, secretvergelijking in constante tijd en helpers voor secretverzameling |
    | `plugin-sdk/ssrf-policy` | Helpers voor host-allowlists en private-network-SSRF-beleid |
    | `plugin-sdk/ssrf-dispatcher` | Smalle helpers voor pinned-dispatchers zonder het brede infra-runtimeoppervlak |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF-fout en helpers voor SSRF-beleid |
    | `plugin-sdk/secret-input` | Helpers voor parsing van secretinvoer |
    | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-aanvragen/-doelen en raw websocket-/body-coercion |
    | `plugin-sdk/webhook-request-guards` | Helpers voor requestbodysize/timeouts |
  </Accordion>

  <Accordion title="Runtime- en opslag-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede runtime-/logging-/backup-/plugin-installatiehelpers |
    | `plugin-sdk/runtime-env` | Gerichte helpers voor runtime-env, logger, timeout, retry en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratiefacade voor genormaliseerd profiel/defaults, CDP-URL-parsing en browser-control-authenticatiehelpers |
    | `plugin-sdk/channel-runtime-context` | Generieke registratie- en opzoekhelpers voor channel-runtime-context |
    | `plugin-sdk/matrix` | Verouderde Matrix-compatibiliteitsfacade voor oudere externe channel-pakketten; nieuwe plugins moeten `plugin-sdk/run-command` rechtstreeks importeren |
    | `plugin-sdk/mattermost` | Verouderde Mattermost-compatibiliteitsfacade voor oudere externe channel-pakketten; nieuwe plugins moeten generieke SDK-subpaden rechtstreeks importeren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor plugin-opdrachten/hooks/http/interactief gebruik |
    | `plugin-sdk/hook-runtime` | Gedeelde pipelinehelpers voor webhooks/interne hooks |
    | `plugin-sdk/lazy-runtime` | Helpers voor lazy runtime-import/binding, zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Proces-exec-helpers |
    | `plugin-sdk/cli-runtime` | CLI-formattering, wachten, versie, argumentaanroep en helpers voor lazy opdrachtgroepen |
    | `plugin-sdk/gateway-runtime` | Gateway-client, starthulp voor event-loop-ready client, gateway CLI-RPC, gateway-protocolfouten en helpers voor channel-statuspatches |
    | `plugin-sdk/config-types` | Type-only configuratieoppervlak voor pluginconfiguratievormen zoals `OpenClawConfig` en configuratietypen voor channels/providers |
    | `plugin-sdk/plugin-config-runtime` | Runtime-helpers voor pluginconfiguratie-opzoekacties, zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele configuratiemutatiehelpers, zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers voor snapshots van de huidige procesconfiguratie, zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en test-snapshotsetters |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-opdrachtnamen/-beschrijvingen en controles op duplicaten/conflicten, zelfs wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van bestandsreferentie-autolinks zonder de brede text-runtime-barrel |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/plugin-goedkeuring, builders voor goedkeuringscapaciteiten, auth-/profielhelpers, native routing-/runtimehelpers en geformatteerde weergavepaden voor gestructureerde goedkeuring |
    | `plugin-sdk/reply-runtime` | Gedeelde runtimehelpers voor inkomend verkeer/antwoorden, chunking, dispatch, Heartbeat, antwoordplanner |
    | `plugin-sdk/reply-dispatch-runtime` | Gerichte helpers voor antwoorddispatch/finalisatie en gesprekslabels |
    | `plugin-sdk/reply-history` | Gedeelde helpers en markers voor antwoordgeschiedenis met kort venster, zoals `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Gerichte helpers voor tekst-/markdown-chunking |
    | `plugin-sdk/session-store-runtime` | Helpers voor sessiestorepad, sessiesleutel, bijgewerkt-op en store-mutaties |
    | `plugin-sdk/cron-store-runtime` | Helpers voor Cron-storepad/laden/opslaan |
    | `plugin-sdk/state-paths` | Helpers voor State-/OAuth-mappaden |
    | `plugin-sdk/routing` | Helpers voor route-/sessiesleutel-/accountbinding, zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde helpers voor channel-/accountstatussamenvatting, defaults voor runtime-state en helpers voor issue-metadata |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde helpers voor doelresolver |
    | `plugin-sdk/string-normalization-runtime` | Helpers voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | String-URL's extraheren uit fetch-/request-achtige invoer |
    | `plugin-sdk/run-command` | Op tijd gebaseerde opdrachtuitvoerder met genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Algemene param-readers voor tools/CLI |
    | `plugin-sdk/tool-payload` | Genormaliseerde payloads extraheren uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Canonieke verzenddoelvelden extraheren uit toolargumenten |
    | `plugin-sdk/temp-path` | Gedeelde helpers voor tijdelijke downloadpaden en private beveiligde tijdelijke werkruimten |
    | `plugin-sdk/logging-core` | Subsystem-logger en redactiehelpers |
    | `plugin-sdk/markdown-table-runtime` | Helpers voor markdown-tabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Helpers voor model-/sessie-override, zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers voor configuratieresolutie van Talk-providers |
    | `plugin-sdk/json-store` | Kleine helpers voor lezen/schrijven van JSON-state |
    | `plugin-sdk/file-lock` | Re-entrant file-lock-helpers |
    | `plugin-sdk/persistent-dedupe` | Helpers voor schijfgebaseerde dedupe-cache |
    | `plugin-sdk/acp-runtime` | ACP-runtime-/sessie- en antwoorddispatchhelpers |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht ACP-backendregistratie en antwoorddispatchhelpers voor bij het opstarten geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only ACP-bindingresolutie zonder imports voor levenscyclusopstart |
    | `plugin-sdk/agent-config-primitives` | Gerichte primitives voor agent-runtimeconfiguratieschema |
    | `plugin-sdk/boolean-param` | Losse boolean-param-reader |
    | `plugin-sdk/dangerous-name-runtime` | Helpers voor resolutie van dangerous-name-matching |
    | `plugin-sdk/device-bootstrap` | Helpers voor apparaatbootstrap en pairing-tokens |
    | `plugin-sdk/extension-shared` | Gedeelde primitives voor passieve channels, status en ambient proxy-helpers |
    | `plugin-sdk/models-provider-runtime` | Helpers voor `/models`-opdracht-/providerantwoorden |
    | `plugin-sdk/skill-commands-runtime` | Helpers voor het weergeven van Skill-opdrachten |
    | `plugin-sdk/native-command-registry` | Helpers voor native opdrachtregister/build/serialisatie |
    | `plugin-sdk/agent-harness` | Experimenteel vertrouwd-pluginoppervlak voor low-level agentharnassen: harnastypen, active-run stuur-/afbreekhelpers, OpenClaw-toolbridgehelpers, runtime-plan-toolbeleidhelpers, classificatie van terminaluitkomsten, helpers voor toolvoortgangsformattering/-details en hulpprogramma's voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Helpers voor detectie van Z.AI-endpoints |
    | `plugin-sdk/async-lock-runtime` | Proceslokale async-lock-helper voor kleine runtime-statebestanden |
    | `plugin-sdk/channel-activity-runtime` | Helper voor channel-activiteitstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Helper voor begrensde async-taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Helpers voor in-memory dedupe-cache |
    | `plugin-sdk/delivery-queue-runtime` | Helper voor het drainen van uitgaande pending-delivery |
    | `plugin-sdk/file-access-runtime` | Veilige padhelpers voor lokale bestanden en mediabronnen |
    | `plugin-sdk/heartbeat-runtime` | Helpers voor Heartbeat-events en zichtbaarheid |
    | `plugin-sdk/number-runtime` | Helper voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Helpers voor beveiligde tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Helpers voor systeemeventqueue |
    | `plugin-sdk/transport-ready-runtime` | Helper voor wachten op transportgereedheid |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine helpers voor begrensde cache |
    | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostische vlaggen, events en trace-context |
    | `plugin-sdk/error-runtime` | Foutgrafiek, formattering, gedeelde helpers voor foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, EnvHttpProxyAgent-optie en helpers voor pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime-fetch zonder proxy-/guarded-fetch-imports |
    | `plugin-sdk/response-limit-runtime` | Begrensde response-body-reader zonder het brede media-runtime-oppervlak |
    | `plugin-sdk/session-binding-runtime` | Huidige gespreksbindingstatus zonder geconfigureerde bindingrouting of pairing-stores |
    | `plugin-sdk/session-store-runtime` | Sessiestorehelpers zonder brede configuratieschrijf-/onderhoudsimports |
    | `plugin-sdk/context-visibility-runtime` | Resolutie van contextzichtbaarheid en filtering van aanvullende context zonder brede configuratie-/beveiligingsimports |
    | `plugin-sdk/string-coerce-runtime` | Gerichte primitive record-/stringcoercion- en normalisatiehelpers zonder markdown-/loggingimports |
    | `plugin-sdk/host-runtime` | Helpers voor normalisatie van hostnamen en SCP-hosts |
    | `plugin-sdk/retry-runtime` | Helpers voor retryconfiguratie en retryrunner |
    | `plugin-sdk/agent-runtime` | Helpers voor agentmap/identiteit/werkruimte, inclusief `resolveAgentDir`, `resolveDefaultAgentDir` en verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Configuratiegebaseerde directoryquery/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- en testsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor het ophalen, transformeren en opslaan van media, door ffprobe ondersteunde detectie van videodimensies, en bouwers voor mediapayloads |
    | `plugin-sdk/media-store` | Smalle helpers voor mediaopslag zoals `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failoverhelpers voor mediageneratie, kandidaatselectie en meldingen over ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus exports van op providers gerichte image-/audiohelpers |
    | `plugin-sdk/text-runtime` | Gedeelde helpers voor tekst/markdown/logging zoals het strippen van voor de assistent zichtbare tekst, helpers voor markdownrendering/chunking/tabellen, redacteerhelpers, directive-tag-helpers en veilige-tekst-hulpprogramma's |
    | `plugin-sdk/text-chunking` | Helper voor chunking van uitgaande tekst |
    | `plugin-sdk/speech` | Spraakprovidertypen plus exports van op providers gerichte directives, registry, validatie, OpenAI-compatibele TTS-bouwer en spraakhelpers |
    | `plugin-sdk/speech-core` | Gedeelde spraakprovidertypen, registry, directive, normalisatie en exports van spraakhelpers |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registryhelpers en gedeelde WebSocket-sessiehelper |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime spraak en registryhelpers |
    | `plugin-sdk/image-generation` | Providertypen voor imagegeneratie plus helpers voor image-assets/data-URL's en de OpenAI-compatibele imageproviderbouwer |
    | `plugin-sdk/image-generation-core` | Gedeelde typen voor imagegeneratie, failover, auth en registryhelpers |
    | `plugin-sdk/music-generation` | Providertypen/aanvraagtypen/resultaattypen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen voor muziekgeneratie, failoverhelpers, providerlookup en model-ref-parsing |
    | `plugin-sdk/video-generation` | Providertypen/aanvraagtypen/resultaattypen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failoverhelpers, providerlookup en model-ref-parsing |
    | `plugin-sdk/webhook-targets` | Webhook-doelregistry en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Helpers voor normalisatie van Webhook-paden |
    | `plugin-sdk/web-media` | Gedeelde helpers voor laden van remote/lokale media |
    | `plugin-sdk/zod` | Opnieuw geëxporteerde `zod` voor consumenten van de Plugin SDK |
    | `plugin-sdk/testing` | Brede compatibiliteitsbarrel voor legacy Plugintests. Nieuwe extensietests moeten in plaats daarvan gerichte SDK-subpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Minimale `createTestPluginApi`-helper voor directe unittests van Pluginregistratie zonder repo-testhelperbridges te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Native agent-runtime-adaptercontractfixtures voor auth-, delivery-, fallback-, tool-hook-, prompt-overlay-, schema- en transcriptprojectietests |
    | `plugin-sdk/channel-test-helpers` | Kanaalgerichte testhelpers voor generieke action-/setup-/statuscontracten, directory-assertions, accountopstartlevenscyclus, send-config-threading, runtime-mocks, statusproblemen, uitgaande levering en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Gedeelde suite voor foutgevallen bij doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Helpers voor Pluginpakket-, registratie-, publieke-artifact-, directe-import-, runtime-API- en import-side-effect-contracten |
    | `plugin-sdk/provider-test-contracts` | Helpers voor provider-runtime-, auth-, discovery-, onboard-, catalog-, wizard-, mediacapability-, replaybeleid-, realtime STT-live-audio-, web-search/fetch- en streamcontracten |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` oefenen |
    | `plugin-sdk/test-fixtures` | Generieke fixtures voor CLI-runtimecapture, sandboxcontext, Skills-schrijver, agent-message, system-event, moduleherlaad, gebundeld Pluginpad, terminaltekst, chunking, auth-token en getypeerde cases |
    | `plugin-sdk/test-node-mocks` | Gerichte Node builtin-mockhelpers voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Geheugensubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager-/config-/file-/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-facade voor geheugenindex/-zoekfunctie |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports van memory host foundation engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding-contracten, registrytoegang, lokale provider en generieke batch-/remotehelpers |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports van memory host QMD-engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports van memory host storage engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor memory host |
    | `plugin-sdk/memory-core-host-query` | Queryhelpers voor memory host |
    | `plugin-sdk/memory-core-host-secret` | Secrethelpers voor memory host |
    | `plugin-sdk/memory-core-host-events` | Helpers voor eventjournal van memory host |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehelpers voor memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | File-/runtimehelpers voor memory host |
    | `plugin-sdk/memory-host-core` | Vendorneutrale alias voor core-runtimehelpers van memory host |
    | `plugin-sdk/memory-host-events` | Vendorneutrale alias voor eventjournalhelpers van memory host |
    | `plugin-sdk/memory-host-files` | Vendorneutrale alias voor file-/runtimehelpers van memory host |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-helpers voor memory-aangrenzende Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory runtime-facade voor toegang tot search-manager |
    | `plugin-sdk/memory-host-status` | Vendorneutrale alias voor statushelpers van memory host |
  </Accordion>

  <Accordion title="Gereserveerde subpaden voor gebundelde helpers">
    Er zijn momenteel geen gereserveerde SDK-subpaden voor gebundelde helpers. Eigenaarspecifieke
    helpers leven binnen het eigenaar-Pluginpakket, terwijl herbruikbare hostcontracten
    generieke SDK-subpaden gebruiken zoals `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview)
- [Installatie van de Plugin SDK](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
