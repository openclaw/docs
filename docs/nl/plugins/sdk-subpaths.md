---
read_when:
    - Het juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Audit van gebundelde Plugin-subpaden en helperinterfaces
summary: 'Plugin SDK-subpadcatalogus: welke importdeclaraties waar thuishoren, gegroepeerd per gebied'
title: Plugin SDK-subpaden
x-i18n:
    generated_at: "2026-05-11T20:44:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

De Plugin SDK wordt beschikbaar gesteld als een reeks smalle openbare subpaden onder
`openclaw/plugin-sdk/`. Deze pagina catalogiseert de vaak gebruikte subpaden, gegroepeerd op
doel. De gegenereerde inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports zijn de openbare subset
na aftrek van repo-lokale test-/interne subpaden die zijn vermeld in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainers kunnen
het aantal openbare exports controleren met `pnpm plugin-sdk:surface` en actieve
gereserveerde helper-subpaden met `pnpm plugins:boundary-report:summary`; ongebruikte
gereserveerde helper-exports laten het CI-rapport falen in plaats van als
slapende compatibiliteitsschuld in de openbare SDK te blijven.

Zie voor de handleiding voor het schrijven van Plugins [Plugin SDK-overzicht](/nl/plugins/sdk-overview).

## Plugin-entry

| Subpad                         | Belangrijke exports                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers voor migratieprovider-items zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactiehelpers en `summarizeMigrationItems`                  |
| `plugin-sdk/migration-runtime` | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                    |

### Verouderde compatibiliteits- en testhelpers

Deze subpaden blijven package-exports voor oudere Plugins en OpenClaw-testsuites,
maar nieuwe code moet er geen imports uit toevoegen: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` en `zod`. Importeer `zod` in nieuwe Plugin-code rechtstreeks vanuit `zod`.
`plugin-test-runtime` is nog steeds een actief, gericht subpad voor testhelpers.

### Verouderde ongebruikte openbare subpaden

Deze openbare subpaden bestonden minstens een maand en hebben momenteel geen
productie-imports vanuit gebundelde Plugins. Ze blijven importeerbaar voor compatibiliteit,
maar nieuwe Plugin-code moet in plaats daarvan gerichte, actief gebruikte SDK-subpaden gebruiken:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` en `zalouser`.

### Verouderde zeldzame openbare subpaden

Openbare subpaden die momenteel door slechts een of twee eigenaren van gebundelde Plugins
worden gebruikt, zijn ook verouderd voor nieuwe Plugin-code. Ze blijven package-exports
voor compatibiliteit, maar nieuwe code moet de voorkeur geven aan actief gedeelde SDK-interfaces
of package-API's die eigendom zijn van de Plugin. Maintainers houden de exacte set bij in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` en het huidige budget
met `pnpm plugin-sdk:surface`.

### Verouderde brede barrels

Deze brede re-export-barrels blijven buildbaar voor OpenClaw-broncode en
compatibiliteitscontroles, maar nieuwe code moet de voorkeur geven aan gerichte SDK-subpaden:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` en
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
en `text-runtime` blijven alleen package-exports voor achterwaartse compatibiliteit; gebruik
in plaats daarvan gerichte channel-/runtime-subpaden, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` en `logging-core`.

  <AccordionGroup>
  <Accordion title="Kanaalsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema-export (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Gecachte JSON Schema-validatiehelper voor schema's die eigendom zijn van de plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde helpers voor installatiewizards, allowlist-prompts en bouwers voor installatiestatus |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor multi-accountconfiguratie/actiepoorten, helpers voor fallback naar standaardaccount |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers voor normalisatie van account-id |
    | `plugin-sdk/account-resolution` | Helpers voor accountopzoeking + standaardfallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten/accountacties |
    | `plugin-sdk/access-groups` | Helpers voor het parsen van access-group-allowlists en geredigeerde groepsdiagnostiek |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Verouderde helpers voor de antwoordpipeline. Nieuwe code voor de kanaalantwoordpipeline moet `createChannelMessageReplyPipeline` en `resolveChannelMessageSourceReplyDeliveryMode` uit `plugin-sdk/channel-message` gebruiken. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde primitieven voor kanaalconfiguratieschema's plus Zod en directe JSON/TypeBox-bouwers |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's, alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor gebundelde-kanaalconfiguratieschema's |
    | `plugin-sdk/telegram-command-config` | Telegram-helpers voor normalisatie/validatie van aangepaste opdrachten met fallback naar gebundeld contract |
    | `plugin-sdk/command-gating` | Smalle helpers voor opdracht-autorisatiepoorten |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Verouderde low-level compatibiliteitsfacade voor kanaalingang. Nieuwe ontvangstpaden moeten `plugin-sdk/channel-ingress-runtime` gebruiken. |
    | `plugin-sdk/channel-ingress-runtime` | Experimentele high-level runtime-resolver voor kanaalingang en routefeitbouwers voor gemigreerde kanaalontvangstpaden. Geef hier de voorkeur aan boven het samenstellen van effectieve allowlists, opdracht-allowlists en legacy-projecties in elke plugin. Zie [API voor kanaalingang](/nl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` en legacy lifecycle-helpers voor conceptstreams. Nieuwe code voor preview-finalisatie moet `plugin-sdk/channel-message` gebruiken. |
    | `plugin-sdk/channel-message` | Goedkope helpers voor bericht-lifecyclecontracten zoals `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, afleiding van durable-final-capabilities, capability-proofhelpers voor verzend-/ontvangst-/neveneffect-capabilities, `MessageReceiveContext`, bewijzen voor ontvangstbevestigingsbeleid, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, capability-bewijzen voor live preview en live finalizer, duurzame herstelstatus, `RenderedMessageBatch`, berichtontvangsttypen en ontvangst-id-helpers. Zie [API voor kanaalberichten](/nl/plugins/sdk-channel-message). Legacy facades voor antwoorddispatch zijn alleen verouderde compatibiliteit. |
    | `plugin-sdk/channel-message-runtime` | Runtime-bezorghelpers die uitgaande bezorging kunnen laden, waaronder `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` en `withDurableMessageSendContext`. Verouderde antwoorddispatch-bruggen blijven alleen importeerbaar voor compatibiliteitsdispatchers. Gebruik vanuit runtime-modules voor monitoring/verzenden, niet vanuit hot plugin-bootstrapbestanden. |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inkomende routes + envelopbouwers |
    | `plugin-sdk/inbound-reply-dispatch` | Legacy gedeelde helpers voor inkomende vastlegging-en-dispatch, predicaten voor zichtbare/finale dispatch en verouderde `deliverDurableInboundReplyPayload`-compatibiliteit voor voorbereide kanaaldispatchers. Nieuwe code voor kanaalontvangst/dispatch moet runtime-lifecyclehelpers importeren uit `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Helpers voor target-parsing/-matching |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor het laden van uitgaande media |
    | `plugin-sdk/outbound-send-deps` | Lichtgewicht opzoeking van uitgaande verzendafhankelijkheden voor kanaaladapters |
    | `plugin-sdk/outbound-runtime` | Helpers voor uitgaande identiteit, verzenddelegate, sessie, formattering en payloadplanning. Directe bezorghelpers zoals `deliverOutboundPayloads` zijn verouderd compatibiliteitssubstraat; gebruik `plugin-sdk/channel-message-runtime` voor nieuwe verzendpaden. |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor poll-normalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor thread-binding-lifecycle en adapters |
    | `plugin-sdk/agent-media-payload` | Legacy bouwer voor agentmediapayloads |
    | `plugin-sdk/conversation-runtime` | Helpers voor conversatie-/threadbinding, pairing en geconfigureerde bindingen |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor runtime-configuratiesnapshot |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtime-resolutie van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatus-snapshots/-samenvattingen |
    | `plugin-sdk/channel-config-primitives` | Smalle primitieven voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Helpers voor autorisatie van kanaalconfiguratiewijzigingen |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor het bewerken/lezen van allowlist-configuratie |
    | `plugin-sdk/group-access` | Gedeelde helpers voor group-access-beslissingen |
    | `plugin-sdk/direct-dm` | Gedeelde helpers voor direct-DM-authenticatie/-guards |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor bijgehouden eigenaarscompatibiliteit; nieuwe plugins moeten geïnjecteerde runtime-helpers of generieke kanaal-SDK-subpaden gebruiken |
    | `plugin-sdk/zalouser` | Verouderde Zalo Personal-compatibiliteitsfacade voor gepubliceerde Lark/Zalo-pakketten die nog autorisatie voor afzenderopdrachten importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Semantische berichtpresentatie, bezorging en legacy helpers voor interactieve antwoorden. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibiliteitsbarrel voor inkomende debounce, mention-matching, helpers voor mentionbeleid en envelophelpers |
    | `plugin-sdk/channel-inbound-debounce` | Smalle helpers voor inkomende debounce |
    | `plugin-sdk/channel-mention-gating` | Smalle helpers voor mentionbeleid, mentionmarkering en mentiontekst zonder het bredere inkomende runtime-oppervlak |
    | `plugin-sdk/channel-envelope` | Smalle helpers voor inkomende envelopformattering |
    | `plugin-sdk/channel-location` | Kanaallocatiecontext en formatteringshelpers |
    | `plugin-sdk/channel-logging` | Helpers voor kanaallogging van inkomende drops en typ-/ack-fouten |
    | `plugin-sdk/channel-send-result` | Typen voor antwoordresultaten |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die voor plugincompatibiliteit behouden blijven |
    | `plugin-sdk/channel-route` | Gedeelde helpers voor routenormalisatie, parsergestuurde targetresolutie, stringificatie van thread-id's, dedupe/compacte routesleutels, typen voor geparste targets en route-/targetvergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor target-parsing; aanroepers van routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Bedrading voor feedback/reacties |
    | `plugin-sdk/channel-secret-runtime` | Smalle secret-contracthelpers zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en secret-targettypen |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor installatie, catalogusdetectie en runtime-modelvoorbereiding |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor lokale serverstandaarden, modeldetectie, aanvraagheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Gecureerde helpers voor lokale/zelfgehoste providerinstallatie |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele helpers voor zelfgehoste providerinstallatie |
    | `plugin-sdk/cli-backend` | CLI-backendstandaarden + watchdog-constanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-helpers voor API-sleutelresolutie voor providerplugins |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor API-sleutel-onboarding/profielschrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaard OAuth-bouwer voor auth-resultaten |
    | `plugin-sdk/provider-env-vars` | Helpers voor het opzoeken van provider-authenticatieomgevingsvariabelen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replaybeleid, provider-endpointhelpers en gedeelde normalisatiehelpers voor model-id's |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-hook voor providercatalogusuitbreiding en plugin-providerregisterseams voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke provider-HTTP/endpoint-capabilityhelpers, provider-HTTP-fouten en multipart-formulierhelpers voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle contracthelpers voor web-fetch-configuratie/selectie, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers voor registratie/cache van web-fetch-providers |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle configuratie-/credentialhelpers voor web-search voor providers die geen plugin-enable-bedrading nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle contracthelpers voor web-search-configuratie/credentials, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en gescopete credential-setters/getters |
    | `plugin-sdk/provider-web-search` | Helpers voor registratie/cache/runtime van web-search-providers |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en opschoning + diagnostiek voor Gemini-schema's |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` en vergelijkbaar |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream-wrappertypen en gedeelde Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-wrapperhelpers |
    | `plugin-sdk/provider-transport-runtime` | Native provider-transporthelpers, zoals afgeschermde fetch, transportberichttransformaties en schrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor onboarding-configuratiepatches |
    | `plugin-sdk/global-singleton` | Proceslokale singleton-/map-/cachehelpers |
    | `plugin-sdk/group-activation` | Smalle helpers voor groepsactivatiemodus en commandoparsing |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers voor commandoregister inclusief dynamische argumentmenuopmaak, helpers voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Bouwers voor commando-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeurderresolutie en actie-authenticatie in dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Native helpers voor exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor goedkeuringscapabilities/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde helper voor Gateway-resolutie van goedkeuringen |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht native helpers voor het laden van goedkeuringsadapters voor hot channel-entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtime-helpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/Gateway-seams wanneer die genoeg zijn |
    | `plugin-sdk/approval-native-runtime` | Native helpers voor goedkeuringsdoel + accountbinding |
    | `plugin-sdk/approval-reply-runtime` | Helpers voor antwoordpayloads van exec/plugin-goedkeuringen |
    | `plugin-sdk/approval-runtime` | Helpers voor exec/plugin-goedkeuringspayloads, native helpers voor goedkeuringsroutering/runtime en helpers voor gestructureerde goedkeuringsweergave, zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle resethelpers voor deduplicatie van inkomende antwoorden |
    | `plugin-sdk/channel-contract-testing` | Smalle helpers voor channel-contracttests zonder het brede testing-barrel |
    | `plugin-sdk/command-auth-native` | Native commando-authenticatie, dynamische argumentmenuopmaak en native helpers voor sessiedoelen |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor commandodetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht commandotekstpredicaten voor hot channel-paden |
    | `plugin-sdk/command-surface` | Helpers voor commandobody-normalisatie en commando-oppervlakken |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Smalle secret-contractverzamelhelpers voor channel-/plugin-secret-oppervlakken |
    | `plugin-sdk/secret-ref-runtime` | Smalle helpers voor `coerceSecretRef` en SecretRef-typering voor secret-contract-/configuratieparsing |
    | `plugin-sdk/security-runtime` | Gedeelde helpers voor vertrouwen, DM-gating, root-begrensde bestanden/paden inclusief create-only writes, synchrone/asynchrone atomaire bestandsvervanging, sibling-temp-writes, fallback voor cross-device moves, private file-store-helpers, symlink-parentguards, externe content, redactie van gevoelige tekst, constant-time secretvergelijking en secret-verzamelhelpers |
    | `plugin-sdk/ssrf-policy` | Helpers voor host-allowlist en SSRF-beleid voor privénetwerken |
    | `plugin-sdk/ssrf-dispatcher` | Smalle pinned-dispatcherhelpers zonder het brede infra-runtime-oppervlak |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-afgeschermde fetch, SSRF-fout en SSRF-beleidshelpers |
    | `plugin-sdk/secret-input` | Helpers voor het parsen van secretinvoer |
    | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-aanvragen/-doelen en raw websocket-/bodycoercie |
    | `plugin-sdk/webhook-request-guards` | Helpers voor aanvraagbodygrootte/time-out |
  </Accordion>

  <Accordion title="Runtime- en opslag-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede helpers voor runtime, logging, back-up en Plugin-installatie |
    | `plugin-sdk/runtime-env` | Gerichte helpers voor runtime-env, logger, timeout, retry en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratiefacade voor genormaliseerd profiel/defaults, CDP-URL-parsing en browser-control-authhelpers |
    | `plugin-sdk/channel-runtime-context` | Generieke helpers voor registratie en lookup van channel-runtimecontext |
    | `plugin-sdk/matrix` | Verouderde Matrix-compatibiliteitsfacade voor oudere channelpakketten van derden; nieuwe plugins moeten `plugin-sdk/run-command` rechtstreeks importeren |
    | `plugin-sdk/mattermost` | Verouderde Mattermost-compatibiliteitsfacade voor oudere channelpakketten van derden; nieuwe plugins moeten generieke SDK-subpaden rechtstreeks importeren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor Plugin-opdrachten, hooks, HTTP en interactieve functies |
    | `plugin-sdk/hook-runtime` | Gedeelde helpers voor Webhook-/interne hook-pijplijnen |
    | `plugin-sdk/lazy-runtime` | Helpers voor lazy runtime-imports en -bindings zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers voor procesuitvoering |
    | `plugin-sdk/cli-runtime` | Helpers voor CLI-formattering, wachten, versie, argumentaanroep en lazy command-groups |
    | `plugin-sdk/gateway-runtime` | Gateway-client, helper voor het starten van een event-loop-ready client, Gateway CLI RPC, Gateway-protocolfouten en helpers voor channel-statuspatches |
    | `plugin-sdk/config-contracts` | Gerichte type-only configuratiesurface voor Plugin-configuratievormen zoals `OpenClawConfig` en channel-/providerconfiguratietypen |
    | `plugin-sdk/plugin-config-runtime` | Runtime-helpers voor Plugin-configuratie lookup zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele helpers voor configuratiemutatie zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers voor snapshots van de huidige procesconfiguratie zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en test-snapshotsetters |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-opdrachtnamen/-beschrijvingen en controles op duplicaten/conflicten, zelfs wanneer de gebundelde Telegram-contractsurface niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van autolinks voor bestandsverwijzingen zonder de brede tekst-barrel |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/Plugin-goedkeuring, bouwers voor goedkeuringsmogelijkheden, auth-/profielhelpers, native routing-/runtimehelpers en formattering van gestructureerde goedkeuringsweergavepaden |
    | `plugin-sdk/reply-runtime` | Gedeelde runtimehelpers voor inkomend verkeer/antwoorden, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | Gerichte helpers voor reply-dispatch/finalize en gesprekslabels |
    | `plugin-sdk/reply-history` | Gedeelde helpers en markers voor replygeschiedenis met kort venster, zoals `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` en `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Gerichte helpers voor tekst-/Markdown-chunking |
    | `plugin-sdk/session-store-runtime` | Helpers voor sessiestorepad, sessiesleutel, bijgewerkt-op en storemutaties |
    | `plugin-sdk/cron-store-runtime` | Helpers voor Cron-storepad/laden/opslaan |
    | `plugin-sdk/state-paths` | Helpers voor State/OAuth-directorypaden |
    | `plugin-sdk/routing` | Helpers voor route-/sessiesleutel-/accountbinding zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde helpers voor channel-/accountstatussamenvattingen, runtime-state-defaults en issue-metadata |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde helpers voor target resolvers |
    | `plugin-sdk/string-normalization-runtime` | Helpers voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | Haal string-URL's uit fetch-/request-achtige invoer |
    | `plugin-sdk/run-command` | Command runner met timeout en genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Algemene readers voor tool-/CLI-parameters |
    | `plugin-sdk/tool-payload` | Haal genormaliseerde payloads uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Haal canonieke doelvelden voor verzenden uit toolargumenten |
    | `plugin-sdk/temp-path` | Gedeelde helpers voor tijdelijke downloadpaden en private veilige tijdelijke workspaces |
    | `plugin-sdk/logging-core` | Subsystem-logger en redactiehelpers |
    | `plugin-sdk/markdown-table-runtime` | Helpers voor Markdown-tabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Helpers voor model-/sessie-overrides zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers voor configuratieresolutie van talk providers |
    | `plugin-sdk/json-store` | Kleine helpers voor lezen/schrijven van JSON-state |
    | `plugin-sdk/file-lock` | Re-entrant file-lockhelpers |
    | `plugin-sdk/persistent-dedupe` | Helpers voor schijfgebaseerde dedupe-cache |
    | `plugin-sdk/acp-runtime` | ACP-runtime-/sessie- en reply-dispatchhelpers |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht ACP-backendregistratie en reply-dispatchhelpers voor bij opstarten geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only ACP-bindingresolutie zonder lifecycle-startupimports |
    | `plugin-sdk/agent-config-primitives` | Gerichte primitives voor agent-runtimeconfiguratieschema's |
    | `plugin-sdk/boolean-param` | Losse reader voor booleaanse parameters |
    | `plugin-sdk/dangerous-name-runtime` | Helpers voor matchingresolutie van gevaarlijke namen |
    | `plugin-sdk/device-bootstrap` | Helpers voor device-bootstrap en pairing tokens |
    | `plugin-sdk/extension-shared` | Gedeelde primitives voor passive-channel, status en ambient-proxyhelpers |
    | `plugin-sdk/models-provider-runtime` | Helpers voor antwoorden op `/models`-opdrachten/providers |
    | `plugin-sdk/skill-commands-runtime` | Helpers voor het weergeven van Skill-opdrachten |
    | `plugin-sdk/native-command-registry` | Helpers voor native command registry/build/serialize |
    | `plugin-sdk/agent-harness` | Experimentele trusted-Plugin-surface voor low-level agent-harnassen: harnastypen, helpers voor active-run steer/abort, OpenClaw-toolbridgehelpers, helpers voor runtime-plan-toolbeleid, classificatie van terminaluitkomsten, helpers voor toolvoortgangsformattering/-details en utilities voor attemptresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Verouderde detectiefacade voor endpoints in eigendom van de Z.AI-provider; gebruik de publieke API van de Z.AI-Plugin |
    | `plugin-sdk/async-lock-runtime` | Proceslokale async-lockhelper voor kleine runtime-statebestanden |
    | `plugin-sdk/channel-activity-runtime` | Helper voor channel-activity-telemetrie |
    | `plugin-sdk/concurrency-runtime` | Helper voor begrensde async taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Helpers voor in-memory dedupe-cache |
    | `plugin-sdk/delivery-queue-runtime` | Helper voor drain van uitgaande pending deliveries |
    | `plugin-sdk/file-access-runtime` | Veilige helpers voor lokale-bestands- en mediabronpaden |
    | `plugin-sdk/heartbeat-runtime` | Helpers voor Heartbeat-wake, events en visibility |
    | `plugin-sdk/number-runtime` | Helper voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Helpers voor veilige tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Helpers voor system-eventqueues |
    | `plugin-sdk/transport-ready-runtime` | Helper voor wachten op transport readiness |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine helpers voor begrensde caches |
    | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostic flags, events en trace-context |
    | `plugin-sdk/error-runtime` | Error graph, formattering, gedeelde helpers voor foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrapte fetch, proxy, EnvHttpProxyAgent-optie en pinned lookuphelpers |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime-fetch zonder proxy-/guarded-fetchimports |
    | `plugin-sdk/response-limit-runtime` | Begrensde reader voor responsebody zonder de brede media-runtimesurface |
    | `plugin-sdk/session-binding-runtime` | Huidige bindingstate van gesprekken zonder geconfigureerde bindingrouting of pairingstores |
    | `plugin-sdk/session-store-runtime` | Session-storehelpers zonder brede configuratieschrijfacties/maintenanceimports |
    | `plugin-sdk/context-visibility-runtime` | Resolutie van contextvisibility en aanvullende contextfiltering zonder brede configuratie-/securityimports |
    | `plugin-sdk/string-coerce-runtime` | Gerichte helpers voor primitive record-/stringcoercion en normalisatie zonder markdown-/loggingimports |
    | `plugin-sdk/host-runtime` | Helpers voor hostname- en SCP-hostnormalisatie |
    | `plugin-sdk/retry-runtime` | Helpers voor retryconfiguratie en retry runner |
    | `plugin-sdk/agent-runtime` | Helpers voor agentdirectory, identiteit en workspace, inclusief `resolveAgentDir`, `resolveDefaultAgentDir` en verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Config-backed directoryquery/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- en testsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor media ophalen/transformeren/opslaan, ffprobe-gebaseerde detectie van videoafmetingen en bouwers voor mediapayloads |
    | `plugin-sdk/media-mime` | Nauwe MIME-normalisatie, mapping van bestandsextensies, MIME-detectie en helpers voor mediasoorten |
    | `plugin-sdk/media-store` | Nauwe helpers voor mediaopslag, zoals `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failover-helpers voor mediageneratie, kandidaatselectie en berichten voor ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte helperexports voor afbeelding/audio/gestructureerde extractie |
    | `plugin-sdk/text-chunking` | Helpers voor tekst- en markdown-chunking/rendering, conversie van markdown-tabellen, verwijderen van richtlijntags en veilige-teksthulpprogramma's |
    | `plugin-sdk/text-chunking` | Helper voor uitgaande tekstchunking |
    | `plugin-sdk/speech` | Providertypen voor spraak plus providergerichte richtlijn-, register-, validatie-, OpenAI-compatibele TTS-bouwer- en spraakhelperexports |
    | `plugin-sdk/speech-core` | Gedeelde providertypen voor spraak, register-, richtlijn-, normalisatie- en spraakhelperexports |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registerhelpers en gedeelde WebSocket-sessiehelper |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime spraak en registerhelpers |
    | `plugin-sdk/image-generation` | Providertypen voor afbeeldingsgeneratie plus helpers voor afbeeldingsassets/data-URL's en de OpenAI-compatibele afbeeldingsproviderbouwer |
    | `plugin-sdk/image-generation-core` | Gedeelde typen, failover-, auth- en registerhelpers voor afbeeldingsgeneratie |
    | `plugin-sdk/music-generation` | Provider-/aanvraag-/resultaattypen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen voor muziekgeneratie, failover-helpers, providerzoekopdracht en parsing van modelrefs |
    | `plugin-sdk/video-generation` | Provider-/aanvraag-/resultaattypen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failover-helpers, providerzoekopdracht en parsing van modelrefs |
    | `plugin-sdk/webhook-targets` | Webhook-doelregister en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gedeelde helpers voor het laden van externe/lokale media |
    | `plugin-sdk/zod` | Verouderde compatibiliteitsherexport; importeer `zod` rechtstreeks uit `zod` |
    | `plugin-sdk/testing` | Repo-lokale verouderde compatibiliteitsbarrel voor legacy OpenClaw-tests. Nieuwe repotests moeten in plaats daarvan gerichte lokale testsubpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale `createTestPluginApi`-helper voor unit-tests met directe Plugin-registratie zonder repo-testhelperbridges te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale contractfixtures voor native agent-runtime-adapters voor auth-, delivery-, fallback-, tool-hook-, prompt-overlay-, schema- en transcriptprojectietests |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanaalgerichte testhelpers voor generieke actie-/setup-/statuscontracten, directory-asserties, levenscyclus van accountstartup, send-config-threading, runtime-mocks, statusproblemen, uitgaande levering en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gedeelde suite met foutgevallen voor doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale helpers voor Plugin-pakket-, registratie-, openbaar-artifact-, directe-import-, runtime-API- en import-side-effect-contracten |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale helpers voor providerruntime-, auth-, discovery-, onboard-, catalogus-, wizard-, mediacapability-, replay-policy-, realtime STT-live-audio-, web-search/fetch- en streamcontracten |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale opt-in Vitest HTTP/auth-mocks voor providertests die `plugin-sdk/provider-http` oefenen |
    | `plugin-sdk/test-fixtures` | Repo-lokale generieke fixtures voor CLI-runtimecapture, sandboxcontext, skillwriter, agentbericht, systeemevent, moduleherlading, gebundeld Plugin-pad, terminaltekst, chunking, auth-token en getypeerde cases |
    | `plugin-sdk/test-node-mocks` | Repo-lokale gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Geheugensubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager-/config-/bestand-/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/-zoekactie |
    | `plugin-sdk/memory-core-host-engine-foundation` | Engine-exports voor geheugenhostfundering |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embeddingcontracten voor geheugenhost, registertoegang, lokale provider en generieke batch-/externe helpers |
    | `plugin-sdk/memory-core-host-engine-qmd` | QMD-engine-exports voor geheugenhost |
    | `plugin-sdk/memory-core-host-engine-storage` | Opslagengine-exports voor geheugenhost |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-query` | Queryhelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-secret` | Geheime helpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-events` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-host-core` | Leveranciersneutrale alias voor core-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-host-events` | Leveranciersneutrale alias voor helpers voor het eventjournal van de geheugenhost |
    | `plugin-sdk/memory-host-files` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-helpers voor geheugenverwante plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-runtimefacade voor toegang tot de zoekmanager |
    | `plugin-sdk/memory-host-status` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Gereserveerde gebundelde-helpersubpaden">
    Er zijn momenteel geen gereserveerde SDK-subpaden voor gebundelde helpers. Eigenaarsspecifieke
    helpers bevinden zich in het eigenaarspakket van de Plugin, terwijl herbruikbare hostcontracten
    generieke SDK-subpaden gebruiken, zoals `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Installatie van Plugin SDK](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
