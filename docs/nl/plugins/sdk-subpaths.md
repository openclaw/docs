---
read_when:
    - Het juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Gebundelde Plugin-subpaden en helperoppervlakken auditen
summary: 'Plugin SDK-subpadcatalogus: welke imports waar thuishoren, gegroepeerd per gebied'
title: Plugin SDK-subpaden
x-i18n:
    generated_at: "2026-07-01T13:12:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

De Plugin-SDK wordt beschikbaar gesteld als een set smalle openbare subpaden onder
`openclaw/plugin-sdk/`. Deze pagina catalogiseert de veelgebruikte subpaden, gegroepeerd naar
doel. De gegenereerde inventaris van compiler-entrypoints staat in
`scripts/lib/plugin-sdk-entrypoints.json`; package-exports zijn de openbare subset
na aftrek van repo-lokale test-/interne subpaden die zijn vermeld in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainers kunnen
het aantal openbare exports controleren met `pnpm plugin-sdk:surface` en actieve
gereserveerde helper-subpaden met `pnpm plugins:boundary-report:summary`; ongebruikte
gereserveerde helper-exports laten het CI-rapport falen in plaats van als
slapende compatibiliteitsschuld in de openbare SDK te blijven.

Zie voor de handleiding voor het maken van Plugins [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview).

## Plugin-invoer

| Subpad                         | Belangrijkste exports                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers voor migratieprovider-items zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactierhelpers en `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                   |
| `plugin-sdk/health`            | Registratie, detectie, reparatie, selectie, ernst en finding-typen voor Doctor-healthchecks voor gebundelde health-consumers                                           |

### Verouderde compatibiliteits- en testhelpers

Verouderde subpaden blijven geëxporteerd voor oudere Plugins, maar nieuwe code moet de
gerichte SDK-subpaden hieronder gebruiken. De onderhouden lijst is
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI wijst gebundelde
productie-imports daaruit af. Brede barrels zoals `compat`, `config-types`,
`infra-runtime`, `text-runtime` en `zod` zijn alleen voor compatibiliteit. Importeer `zod`
rechtstreeks vanuit `zod`.

OpenClaw's door Vitest ondersteunde testhelper-subpaden zijn alleen repo-lokaal en zijn
geen package-exports meer: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` en `testing`.

### Gereserveerde helper-subpaden voor gebundelde Plugins

Deze subpaden zijn Plugin-eigen compatibiliteitsoppervlakken voor hun eigenaar, een gebundelde
Plugin, en geen algemene SDK-API's: `plugin-sdk/codex-mcp-projection` en
`plugin-sdk/codex-native-task-runtime`. Imports vanuit extensies van andere eigenaren worden geblokkeerd
door guardrails voor package-contracten.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema-export (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Gecachte JSON Schema-validatiehelper voor Plugin-eigen schema's |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde helpers voor setupwizards, setupvertaler, allowlist-prompts, bouwers voor setupstatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor multi-accountconfiguratie/actiepoort, helpers voor fallback naar standaardaccount |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers voor account-id-normalisatie |
    | `plugin-sdk/account-resolution` | Helpers voor accountopzoeking + standaardfallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten/accountacties |
    | `plugin-sdk/access-groups` | Helpers voor parsing van allowlists voor toegangsgroepen en geredigeerde groepsdiagnostiek |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde primitieven voor kanaalconfiguratieschema's plus Zod- en directe JSON/TypeBox-bouwers |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Canonieke gebundelde/officiële chatkanaal-id's plus formatterlabels/-aliassen voor plugins die envelope-geprefixte tekst moeten herkennen zonder hun eigen tabel te hardcoden. |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor configuratieschema's van gebundelde kanalen |
    | `plugin-sdk/telegram-command-config` | Helpers voor normalisatie/validatie van aangepaste Telegram-commando's met fallback naar het gebundelde contract |
    | `plugin-sdk/command-gating` | Smalle helpers voor autorisatiepoorten voor commando's |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Verouderde low-level compatibiliteitsfacade voor kanaalingress. Nieuwe ontvangstpaden moeten `plugin-sdk/channel-ingress-runtime` gebruiken. |
    | `plugin-sdk/channel-ingress-runtime` | Experimentele high-level runtime-resolver voor kanaalingress en bouwers voor routefeiten voor gemigreerde ontvangstpaden van kanalen. Geef hieraan de voorkeur boven het samenstellen van effectieve allowlists, commando-allowlists en legacy-projecties in elke Plugin. Zie [Kanaalingress-API](/nl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contracten voor berichtlevenscyclus plus opties voor reply-pipelines, ontvangstbewijzen, live preview/streaming, levenscyclushelpers, outbound-identiteit, payloadplanning, duurzame verzendingen en helpers voor berichtverzendcontext. Zie [Kanaal-outbound-API](/nl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy-facades voor reply-dispatch. |
    | `plugin-sdk/channel-message-runtime` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy-facades voor reply-dispatch. |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inbound-routes + envelopebouwers |
    | `plugin-sdk/inbound-reply-dispatch` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-inbound` voor inbound-runners en dispatch-predicaten, en `plugin-sdk/channel-outbound` voor helpers voor berichtbezorging. |
    | `plugin-sdk/messaging-targets` | Verouderde alias voor targetparsing; gebruik `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor het laden van outbound-media en hosted-media-status |
    | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor pollnormalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor levenscyclus en adapters van threadbindingen |
    | `plugin-sdk/agent-media-payload` | Legacy-bouwer voor agentmediapayloads |
    | `plugin-sdk/conversation-runtime` | Helpers voor conversatie-/threadbinding, koppeling en geconfigureerde bindingen |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor runtimeconfiguratiesnapshot |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtime-oplossing van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatussnapshots/-samenvattingen |
    | `plugin-sdk/channel-config-primitives` | Smalle primitieven voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Helpers voor autorisatie van kanaalconfiguratieschrijfacties |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor bewerken/lezen van allowlistconfiguratie |
    | `plugin-sdk/group-access` | Gedeelde helpers voor beslissingen over groepstoegang |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Smalle helpers voor direct-DM-guardbeleid vóór crypto |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarcompatibiliteit; nieuwe plugins moeten generieke SDK-subpaden voor kanalen gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountoplossing voor bijgehouden eigenaarcompatibiliteit; nieuwe plugins moeten geïnjecteerde runtimehelpers of generieke SDK-subpaden voor kanalen gebruiken |
    | `plugin-sdk/zalouser` | Verouderde Zalo Personal-compatibiliteitsfacade voor gepubliceerde Lark/Zalo-pakketten die nog autorisatie voor afzendercommando's importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Semantische berichtpresentatie, bezorging en legacy helpers voor interactieve replies. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gedeelde inbound-helpers voor eventclassificatie, contextopbouw, formattering, roots, debounce, mention-matching, mention-beleid en inbound-logging |
    | `plugin-sdk/channel-inbound-debounce` | Smalle inbound-debouncehelpers |
    | `plugin-sdk/channel-mention-gating` | Smalle helpers voor mention-beleid, mention-markers en mention-tekst zonder het bredere inbound-runtimeoppervlak |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound` of `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typen voor replyresultaten |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die behouden blijven voor Plugin-compatibiliteit |
    | `plugin-sdk/channel-route` | Gedeelde helpers voor routenormalisatie, parsergestuurde targetoplossing, stringificatie van thread-id's, dedupe/compacte routesleutels, geparste-targettypen en route-/targetvergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor targetparsing; aanroepers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Wiring voor feedback/reacties |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contracten, zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en typen voor secret-targets |
  </Accordion>

Verouderde families van kanaalhelpers blijven alleen beschikbaar voor compatibiliteit
met gepubliceerde Plugins. Het verwijderingsplan is: behoud ze gedurende het migratievenster
voor externe Plugins, houd repo-/gebundelde Plugins op `channel-inbound` en
`channel-outbound`, en verwijder daarna de compatibiliteitssubpaden bij de volgende grote
SDK-opschoning. Dit geldt voor de oude families voor kanaalberichten/runtime, kanaalstreaming,
directe DM-toegang, afgesplitste inbound-helpers, antwoordopties
en koppelingspaden.

  <Accordion title="Subpaden voor providers">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor installatie, catalogusdetectie en runtime-modelvoorbereiding |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor standaardwaarden van lokale servers, modeldetectie, aanvraagheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Samengestelde helpers voor lokale/zelfgehoste providerinstallatie |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte helpers voor OpenAI-compatibele zelfgehoste providerinstallatie |
    | `plugin-sdk/cli-backend` | Standaardwaarden voor CLI-backend + watchdog-constanten |
    | `plugin-sdk/provider-auth-runtime` | Runtimehelpers voor API-sleutelresolutie voor providerplugins |
    | `plugin-sdk/provider-oauth-runtime` | Generieke OAuth-callbacktypen voor providers, rendering van callbackpagina's, PKCE/state-helpers, parsing van autorisatie-invoer, helpers voor tokenverval en afbreekhelpers |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor API-sleutelonboarding/profielschrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaardbouwer voor OAuth-authenticatieresultaten |
    | `plugin-sdk/provider-env-vars` | Helpers voor het opzoeken van provider-authenticatieomgevingsvariabelen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helpers voor OpenAI Codex-authenticatie-import, verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replaybeleid, helpers voor providereindpunten en gedeelde helpers voor normalisatie van model-id's |
    | `plugin-sdk/provider-catalog-live-runtime` | Helpers voor live providermodelcatalogi voor bewaakte detectie in `/models`-stijl: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtering van model-id's, TTL-cache en statische fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtimehook voor uitbreiding van providercatalogi en plugin-providerregistratienaden voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke helpers voor provider-HTTP/eindpuntmogelijkheden, provider-HTTP-fouten en multipart-formulierhelpers voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle contracthelpers voor web-fetch-configuratie/selectie, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers voor registratie/cache van web-fetchproviders |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle configuratie-/credentialhelpers voor webzoekproviders die geen plugin-enable-bedrading nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle contracthelpers voor webzoekconfiguratie/credentials, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped credential-setters/getters |
    | `plugin-sdk/provider-web-search` | Helpers voor registratie/cache/runtime van webzoekproviders |
    | `plugin-sdk/embedding-providers` | Algemene typen en leeshelpers voor embeddingproviders, waaronder `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` en `listEmbeddingProviders(...)`; plugins registreren providers via `api.registerEmbeddingProvider(...)` zodat manifesteigenaarschap wordt afgedwongen |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en schemaopschoning + diagnostiek voor DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Snapshottypen voor providergebruik, gedeelde helpers voor gebruiksophalen en providerfetchers zoals `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typen voor streamwrappers, compatibiliteit voor tool-calls in platte tekst en gedeelde wrapperhelpers voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Publieke gedeelde helpers voor providerstreamwrappers, waaronder `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` en OpenAI-compatibele streamhulpprogramma's voor Anthropic/DeepSeek |
    | `plugin-sdk/provider-transport-runtime` | Native providertransporthelpers zoals bewaakte fetch, extractie van tool-resultaattekst, transformaties van transportberichten en schrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor patches op onboardingconfiguratie |
    | `plugin-sdk/global-singleton` | Proceslokale singleton-/map-/cachehelpers |
    | `plugin-sdk/group-activation` | Smalle helpers voor groepsactivatiemodus en commandoparsing |
  </Accordion>

Snapshots van providergebruik rapporteren normaal gesproken een of meer quota-`windows`, elk met
een label, gebruikt percentage en optionele resettijd. Providers die saldo- of
accountstatustekst tonen in plaats van resetbare quotavensters, moeten
`summary` met een lege `windows`-array retourneren in plaats van percentages te verzinnen.
OpenClaw toont die samenvattingstekst in statusuitvoer; gebruik `error` alleen wanneer het
gebruikseindpunt is mislukt of geen bruikbare gebruiksgegevens heeft geretourneerd.

  <Accordion title="Subpaden voor authenticatie en beveiliging">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, commandoregistratiehelpers inclusief dynamische opmaak van argumentmenu's, helpers voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Bouwers voor commando-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor goedkeurderresolutie en actieauthenticatie in dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Helpers voor native exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor goedkeuringsmogelijkheden/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde helper voor goedkeuringsgatewayresolutie |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor hot channel-entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/gatewaynaden wanneer die voldoende zijn |
    | `plugin-sdk/approval-native-runtime` | Helpers voor native goedkeuringsdoelen, accountbinding, routegates, forwardingfallback en onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reaction-runtime` | Hardgecodeerde goedkeuringsreactiebindingen, payloads voor reactieprompts, opslag voor reactiedoelen en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reply-runtime` | Helpers voor antwoordpayloads van exec-/plugingoedkeuringen |
    | `plugin-sdk/approval-runtime` | Helpers voor payloads van exec-/plugingoedkeuringen, native goedkeuringsrouting-/runtimehelpers en helpers voor gestructureerde goedkeuringsweergave zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle resethelpers voor deduplicatie van inkomende antwoorden |
    | `plugin-sdk/channel-contract-testing` | Smalle testhelpers voor kanaalcontracten zonder de brede testing-barrel |
    | `plugin-sdk/command-auth-native` | Native commandoauthenticatie, dynamische opmaak van argumentmenu's en native sessiedoelhelpers |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor commandodetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht commandotekstpredicaten voor hot channel-paden |
    | `plugin-sdk/command-surface` | Helpers voor commandobody-normalisatie en commando-oppervlakken |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Smalle verzamelhelpers voor secretcontracten voor kanaal-/pluginsecretoppervlakken |
    | `plugin-sdk/secret-ref-runtime` | Smalle `coerceSecretRef`- en SecretRef-typeringshelpers voor parsing van secretcontracten/configuratie |
    | `plugin-sdk/secret-provider-integration` | Alleen-typen manifest- en presetcontracten voor SecretRef-providerintegratie voor plugins die externe secretproviderpresets publiceren |
    | `plugin-sdk/security-runtime` | Gedeelde helpers voor vertrouwen, DM-gating en root-begrensde bestanden/paden, inclusief alleen-aanmaken-schrijfbewerkingen, synchrone/asynchrone atomische bestandsvervanging, sibling-temp-schrijfbewerkingen, fallback voor verplaatsen tussen apparaten, helpers voor private bestandsopslag, symlink-parentguards, externe content, redactie van gevoelige tekst, secretvergelijking in constante tijd en secretverzamelhelpers |
    | `plugin-sdk/ssrf-policy` | Helpers voor host-allowlists en SSRF-beleid voor privénetwerken |
    | `plugin-sdk/ssrf-dispatcher` | Smalle pinned-dispatcherhelpers zonder het brede infrastructuur-runtimeoppervlak |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-bewaakte fetch, SSRF-fout en SSRF-beleidshelpers |
    | `plugin-sdk/secret-input` | Helpers voor parsing van secretinvoer |
    | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-aanvragen/-doelen en coercion van raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helpers voor aanvraagbodygrootte/time-outs |
  </Accordion>

  <Accordion title="Runtime- en opslagsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede runtime-/logging-/back-up-/Plugin-installatiehelpers |
    | `plugin-sdk/runtime-env` | Smalle runtime-env-, logger-, timeout-, retry- en backoff-helpers |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratie-facade voor genormaliseerd profiel/defaults, CDP-URL-parsing en auth-helpers voor browserbesturing |
    | `plugin-sdk/agent-harness-task-runtime` | Generieke helpers voor taaklevenscyclus en voltooiingslevering voor harness-ondersteunde agents die een door de host uitgegeven taakscope gebruiken |
    | `plugin-sdk/codex-mcp-projection` | Gereserveerde gebundelde Codex-helper om gebruikersconfiguratie voor MCP-servers te projecteren naar Codex-threadconfiguratie; niet voor plugins van derden |
    | `plugin-sdk/codex-native-task-runtime` | Private gebundelde Codex-helper voor native taakspiegel-/runtime-bedrading; niet voor plugins van derden |
    | `plugin-sdk/channel-runtime-context` | Generieke helpers voor registratie en lookup van kanaal-runtime-context |
    | `plugin-sdk/matrix` | Verouderde Matrix-compatibiliteitsfacade voor oudere kanaalpakketten van derden; nieuwe plugins moeten `plugin-sdk/run-command` rechtstreeks importeren |
    | `plugin-sdk/mattermost` | Verouderde Mattermost-compatibiliteitsfacade voor oudere kanaalpakketten van derden; nieuwe plugins moeten generieke SDK-subpaden rechtstreeks importeren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde helpers voor Plugin-commando's/hooks/http/interactieve functies |
    | `plugin-sdk/hook-runtime` | Gedeelde helpers voor Webhook-/interne hook-pijplijnen |
    | `plugin-sdk/lazy-runtime` | Helpers voor lazy runtime-imports/-bindingen zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers voor proces-exec |
    | `plugin-sdk/cli-runtime` | Helpers voor CLI-formattering, wachten, versie, argumentaanroep en lazy commandogroepen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gedeelde ids voor live transport-QA-scenario's, helpers voor baselinedekking en helper voor scenarioselectie |
    | `plugin-sdk/gateway-method-runtime` | Gereserveerde helper voor Gateway-methode-dispatch voor Plugin-HTTP-routes die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren |
    | `plugin-sdk/gateway-runtime` | Gateway-client, helper voor clientstart wanneer event-loop gereed is, Gateway CLI RPC, Gateway-protocolfouten, resolutie van geadverteerde LAN-hosts en helpers voor patches van kanaalstatus |
    | `plugin-sdk/config-contracts` | Gerichte type-only configuratie-interface voor Plugin-configuratievormen zoals `OpenClawConfig` en kanaal-/providerconfiguratietypen |
    | `plugin-sdk/plugin-config-runtime` | Runtimehelpers voor Plugin-configuratie-lookup zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele helpers voor configuratiemutatie zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gedeelde hintstrings voor metadata van message-tool-levering |
    | `plugin-sdk/runtime-config-snapshot` | Helpers voor snapshots van huidige procesconfiguratie zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en setters voor testsnapshots |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-commandonaam/-beschrijving en controles op duplicaten/conflicten, zelfs wanneer het gebundelde Telegram-contractoppervlak niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Detectie van autolinks voor bestandsverwijzingen zonder de brede tekstbarrel |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded bindings voor goedkeuringsreacties, payloads voor reactieprompts, stores voor reactiedoelen en compatibiliteitsexport voor lokale onderdrukking van native exec-prompts |
    | `plugin-sdk/approval-runtime` | Helpers voor exec-/Plugin-goedkeuring, builders voor goedkeuringscapabilities, auth-/profielhelpers, native routing-/runtimehelpers en gestructureerde formattering van weergavepaden voor goedkeuringen |
    | `plugin-sdk/reply-runtime` | Gedeelde inbound-/reply-runtimehelpers, chunking, dispatch, Heartbeat, replyplanner |
    | `plugin-sdk/reply-dispatch-runtime` | Smalle helpers voor reply-dispatch/-finalisatie en gesprekslabels |
    | `plugin-sdk/reply-history` | Gedeelde reply-history-helpers voor een kort venster. Nieuwe message-turn-code moet `createChannelHistoryWindow` gebruiken; lower-level maphelpers blijven alleen verouderde compatibiliteitsexports |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Smalle helpers voor tekst-/markdown-chunking |
    | `plugin-sdk/session-store-runtime` | Helpers voor sessieworkflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrensde reads van recente gebruikers-/assistant-transcripttekst op sessie-identiteit, helpers voor legacy sessiestorepad/sessiesleutel, updated-at-reads en compatibiliteitshelpers voor alleen-transitie whole-store-/bestandspaden |
    | `plugin-sdk/session-transcript-runtime` | Transcriptidentiteit, helpers voor gescopete doelen/lezen/schrijven, publicatie van updates, schrijflocks en sleutels voor transcriptgeheugenhits |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-helpers voor agentschema's, paden en transacties voor first-party runtime |
    | `plugin-sdk/cron-store-runtime` | Helpers voor Cron-storepad/laden/opslaan |
    | `plugin-sdk/state-paths` | Helpers voor status-/OAuth-directorypaden |
    | `plugin-sdk/plugin-state-runtime` | Plugin-sidecar SQLite keyed-state-typen plus gecentraliseerde configuratie voor verbindingspragma en WAL-onderhoud voor Plugin-owned databases |
    | `plugin-sdk/routing` | Helpers voor route-/sessiesleutel-/accountbinding zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde helpers voor kanaal-/accountstatussamenvattingen, defaults voor runtime-state en helpers voor issuemetadata |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde helpers voor targetresolvers |
    | `plugin-sdk/string-normalization-runtime` | Helpers voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | String-URL's extraheren uit fetch-/request-achtige inputs |
    | `plugin-sdk/run-command` | Getimede commandrunner met genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Gemeenschappelijke tool-/CLI-paramreaders |
    | `plugin-sdk/tool-plugin` | Een eenvoudige getypte agent-tool-Plugin definiëren en statische metadata voor manifestgeneratie blootstellen |
    | `plugin-sdk/tool-payload` | Genormaliseerde payloads extraheren uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Canonieke send-targetvelden extraheren uit toolargs |
    | `plugin-sdk/sandbox` | Sandbox-backendtypen en SSH-/OpenShell-commandohelpers, inclusief fail-fast preflight voor exec-commando's |
    | `plugin-sdk/temp-path` | Gedeelde helpers voor tijdelijke downloadpaden en private beveiligde tijdelijke werkruimten |
    | `plugin-sdk/logging-core` | Subsystemlogger en redactiehelpers |
    | `plugin-sdk/markdown-table-runtime` | Markdown-tabelmodus en conversiehelpers |
    | `plugin-sdk/model-session-runtime` | Helpers voor model-/sessie-override zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers voor resolving van Talk-providerconfiguratie |
    | `plugin-sdk/json-store` | Kleine helpers voor lezen/schrijven van JSON-state |
    | `plugin-sdk/json-unsafe-integers` | JSON-parsinghelpers die onveilige integerliteralen als strings behouden |
    | `plugin-sdk/file-lock` | Re-entrante file-lock-helpers |
    | `plugin-sdk/persistent-dedupe` | Helpers voor dedupe-cache met schijfbacking |
    | `plugin-sdk/acp-runtime` | Helpers voor ACP-runtime/sessie en reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht ACP-backendregistratie en reply-dispatch-helpers voor bij startup geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only ACP-bindingresolutie zonder lifecycle-startup-imports |
    | `plugin-sdk/agent-config-primitives` | Smalle primitives voor agent-runtimeconfiguratieschema |
    | `plugin-sdk/boolean-param` | Losse boolean-paramreader |
    | `plugin-sdk/dangerous-name-runtime` | Helpers voor matchingresolutie van gevaarlijke namen |
    | `plugin-sdk/device-bootstrap` | Helpers voor device-bootstrap en pairingtokens |
    | `plugin-sdk/extension-shared` | Gedeelde primitives voor passive-channel, status en ambient proxy helpers |
    | `plugin-sdk/models-provider-runtime` | Helpers voor `/models`-commando-/providerantwoorden |
    | `plugin-sdk/skill-commands-runtime` | Helpers voor het weergeven van Skill-commando's |
    | `plugin-sdk/native-command-registry` | Helpers voor native command registry/build/serialize |
    | `plugin-sdk/agent-harness` | Experimenteel trusted-Plugin-oppervlak voor low-level agentharnassen: harnastypen, helpers voor active-run sturen/afbreken, OpenClaw-toolbridgehelpers, helpers voor runtime-plan-toolbeleid, classificatie van terminale uitkomsten, formatting-/detailhelpers voor toolvoortgang en hulpprogramma's voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Verouderde provider-owned endpoint-detectiefacade voor Z.AI; gebruik de publieke API van de Z.AI-Plugin |
    | `plugin-sdk/async-lock-runtime` | Process-local async lock-helper voor kleine runtime-statebestanden |
    | `plugin-sdk/channel-activity-runtime` | Helper voor telemetrie van kanaalactiviteit |
    | `plugin-sdk/concurrency-runtime` | Helper voor begrensde async taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Helpers voor in-memory dedupe-cache |
    | `plugin-sdk/delivery-queue-runtime` | Helper voor het leegtrekken van outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Helpers voor veilige lokale-bestands- en media-source-paden |
    | `plugin-sdk/heartbeat-runtime` | Helpers voor Heartbeat-wake, -event en -zichtbaarheid |
    | `plugin-sdk/number-runtime` | Helper voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Helpers voor beveiligde tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Helpers voor system event queue |
    | `plugin-sdk/transport-ready-runtime` | Helper voor wachten op transportgereedheid |
    | `plugin-sdk/exec-approvals-runtime` | Helpers voor exec-goedkeuringsbeleidsbestanden zonder de brede infra-runtime-barrel |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine helpers voor begrensde caches |
    | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostic flags, events en trace-context |
    | `plugin-sdk/error-runtime` | Errorgraph, formatting, gedeelde helpers voor foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrapte fetch, proxy, EnvHttpProxyAgent-optie en pinned lookup-helpers |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime-fetch zonder proxy-/guarded-fetch-imports |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer voor inline image data URL's en signature-sniffinghelpers zonder het brede media-runtime-oppervlak |
    | `plugin-sdk/response-limit-runtime` | Begrensde response-body-reader zonder het brede media-runtime-oppervlak |
    | `plugin-sdk/session-binding-runtime` | Huidige gespreksbindingstatus zonder geconfigureerde bindingrouting of pairingstores |
    | `plugin-sdk/session-store-runtime` | Session-store-helpers zonder brede config writes-/maintenance-imports |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-helpers voor agentschema's, paden en transacties zonder database-lifecycle-controls |
    | `plugin-sdk/context-visibility-runtime` | Resolutie van contextzichtbaarheid en aanvullende contextfiltering zonder brede config-/security-imports |
    | `plugin-sdk/string-coerce-runtime` | Smalle helpers voor primitive record-/stringcoercion en normalisatie zonder markdown-/logging-imports |
    | `plugin-sdk/host-runtime` | Helpers voor hostname- en SCP-hostnormalisatie |
    | `plugin-sdk/retry-runtime` | Helpers voor retryconfiguratie en retryrunner |
    | `plugin-sdk/agent-runtime` | Helpers voor agentdirectory/identiteit/werkruimte, inclusief `resolveAgentDir`, `resolveDefaultAgentDir` en verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Config-backed directoryquery/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpaden voor mogelijkheden en tests">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde helpers voor media ophalen/transformeren/opslaan, waaronder `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` en verouderde `fetchRemoteMedia`; geef de voorkeur aan opslaghelpers boven bufferlezingen wanneer een URL OpenClaw-media moet worden |
    | `plugin-sdk/media-mime` | Gerichte MIME-normalisatie, mapping van bestandsextensies, MIME-detectie en helpers voor mediasoorten |
    | `plugin-sdk/media-store` | Gerichte helpers voor mediaopslag, zoals `saveMediaBuffer` en `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde helpers voor failover bij mediageneratie, kandidaatselectie en meldingen over ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte helper-exports voor afbeeldingen/audio/gestructureerde extractie |
    | `plugin-sdk/text-chunking` | Helpers voor tekst- en markdownchunking/rendering, conversie van markdowntabellen, verwijderen van richtlijntags en hulpprogramma's voor veilige tekst |
    | `plugin-sdk/text-chunking` | Helper voor uitgaande tekstchunking |
    | `plugin-sdk/speech` | Providertypen voor spraak plus providergerichte exports voor richtlijnen, register, validatie, OpenAI-compatibele TTS-builder en spraakhelpers |
    | `plugin-sdk/speech-core` | Gedeelde typen voor spraakproviders, register-, richtlijn-, normalisatie- en spraakhelper-exports |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registerhelpers en gedeelde helper voor WebSocket-sessies |
    | `plugin-sdk/realtime-bootstrap-context` | Realtime profiel-bootstraphelper voor begrensde contextinjectie van `IDENTITY.md`, `USER.md` en `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime spraak, registerhelpers en gedeelde helpers voor realtime spraakgedrag, inclusief tracking van uitvoeractiviteit |
    | `plugin-sdk/image-generation` | Providertypen voor afbeeldingsgeneratie plus helpers voor afbeeldingsassets/data-URL's en de OpenAI-compatibele afbeeldingsproviderbuilder |
    | `plugin-sdk/image-generation-core` | Gedeelde typen, failover-, auth- en registerhelpers voor afbeeldingsgeneratie |
    | `plugin-sdk/music-generation` | Provider-/request-/resultaattypen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen voor muziekgeneratie, failoverhelpers, providerlookup en parsing van modelrefs |
    | `plugin-sdk/video-generation` | Provider-/request-/resultaattypen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failoverhelpers, providerlookup en parsing van modelrefs |
    | `plugin-sdk/transcripts` | Gedeelde providertypen voor transcriptbronnen, registerhelpers, sessiebeschrijvers en metadata voor uitingen |
    | `plugin-sdk/webhook-targets` | Register voor Webhook-doelen en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gedeelde helpers voor het laden van externe/lokale media |
    | `plugin-sdk/zod` | Verouderde compatibiliteits-re-export; importeer `zod` rechtstreeks uit `zod` |
    | `plugin-sdk/testing` | Repo-lokale verouderde compatibiliteitsbarrel voor legacy OpenClaw-tests. Nieuwe repotests moeten in plaats daarvan gerichte lokale testsubpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale `createTestPluginApi`-helper voor unit-tests met directe Plugin-registratie zonder repotesthelper-bridges te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale fixtures voor native agent-runtime-adaptercontracten voor tests van auth, levering, fallback, tool-hook, prompt-overlay, schema en transcriptprojectie |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanaalgerichte testhelpers voor generieke actie-/setup-/statuscontracten, directory-asserties, opstartlevenscyclus van accounts, send-config-threading, runtimemocks, statusproblemen, uitgaande levering en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gedeelde suite voor foutgevallen bij doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale helpers voor Plugin-pakket-, registratie-, openbaar-artifact-, directe-import-, runtime-API- en import-side-effect-contracten |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale helpers voor providerruntime-, auth-, discovery-, onboard-, catalogus-, wizard-, mediamogelijkheid-, replaybeleid-, realtime STT-live-audio-, webzoek-/fetch- en streamcontracten |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale opt-in Vitest HTTP-/auth-mocks voor providertests die `plugin-sdk/provider-http` uitvoeren |
    | `plugin-sdk/test-fixtures` | Repo-lokale generieke fixtures voor CLI-runtimecapture, sandboxcontext, skillwriter, agentbericht, systeemevent, moduleherlading, pad naar gebundelde Plugin, terminaltekst, chunking, auth-token en getypte cases |
    | `plugin-sdk/test-node-mocks` | Repo-lokale gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Geheugensubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager-/config-/bestands-/CLI-helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/zoekfunctie |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lichtgewicht registerhelpers voor providers van geheugenembeddings |
    | `plugin-sdk/memory-core-host-engine-foundation` | Engine-exports voor geheugenhostfundament |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contracten voor geheugenhostembeddings, registertoegang, lokale provider en generieke batch-/externe helpers. `registerMemoryEmbeddingProvider` op dit oppervlak is verouderd; gebruik de generieke embeddingprovider-API voor nieuwe providers. |
    | `plugin-sdk/memory-core-host-engine-qmd` | QMD-engine-exports voor geheugenhost |
    | `plugin-sdk/memory-core-host-engine-storage` | Opslagengine-exports voor geheugenhost |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale helpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-query` | Queryhelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-secret` | Geheimhelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-events` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-host-core` | Leverancieronafhankelijke alias voor core-runtimehelpers voor geheugenhost |
    | `plugin-sdk/memory-host-events` | Leverancieronafhankelijke alias voor eventjournaalhelpers voor geheugenhost |
    | `plugin-sdk/memory-host-files` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdownhelpers voor geheugengerelateerde plugins |
    | `plugin-sdk/memory-host-search` | Active memory-runtimefacade voor toegang tot de zoekmanager |
    | `plugin-sdk/memory-host-status` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Gereserveerde subpaden voor gebundelde helpers">
    Gereserveerde SDK-subpaden voor gebundelde helpers zijn gerichte eigenaarspecifieke oppervlakken voor
    gebundelde Plugin-code. Ze worden bijgehouden in de SDK-inventaris zodat pakketbuilds
    en aliasing deterministisch blijven, maar het zijn geen algemene API's voor
    Plugin-auteurs. Nieuwe herbruikbare hostcontracten moeten generieke SDK-subpaden gebruiken
    zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en
    `plugin-sdk/plugin-config-runtime`.

    | Subpad | Eigenaar en doel |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper voor gebundelde Codex-Plugin voor het projecteren van MCP-serverconfiguratie van gebruikers naar Codex app-server-threadconfiguratie |
    | `plugin-sdk/codex-native-task-runtime` | Helper voor gebundelde Codex-Plugin voor het spiegelen van native subagents van Codex app-server naar OpenClaw-taakstatus |

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Plugin SDK instellen](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
