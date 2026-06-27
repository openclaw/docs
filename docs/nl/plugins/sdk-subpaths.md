---
read_when:
    - De juiste plugin-sdk-subpad kiezen voor een Plugin-import
    - Gebundelde Plugin-subpaden en helperinterfaces controleren
summary: 'Plugin SDK-subpadcatalogus: welke imports waar thuishoren, gegroepeerd per gebied'
title: Plugin SDK-subpaden
x-i18n:
    generated_at: "2026-06-27T18:07:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

De plugin-SDK wordt beschikbaar gesteld als een set smalle openbare subpaden onder
`openclaw/plugin-sdk/`. Deze pagina catalogiseert de veelgebruikte subpaden, gegroepeerd op
doel. De gegenereerde inventaris van compiler-entrypoints bevindt zich in
`scripts/lib/plugin-sdk-entrypoints.json`; pakketexports zijn de openbare subset
na aftrek van repo-lokale test-/interne subpaden die zijn vermeld in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainers kunnen het
aantal openbare exports controleren met `pnpm plugin-sdk:surface` en actieve gereserveerde
helper-subpaden met `pnpm plugins:boundary-report:summary`; ongebruikte gereserveerde
helper-exports laten het CI-rapport falen in plaats van als slapende compatibiliteitsschuld
in de openbare SDK te blijven staan.

Zie voor de handleiding voor Plugin-authoring [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview).

## Plugin-entry

| Subpad                         | Belangrijkste exports                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helpers voor migratieprovider-items zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactiehelpers en `summarizeMigrationItems`                  |
| `plugin-sdk/migration-runtime` | Runtime-migratiehelpers zoals `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                                   |
| `plugin-sdk/health`            | Registratie, detectie, reparatie, selectie, ernst en finding-types voor doctor-healthchecks voor gebundelde health-consumers                                           |

### Verouderde compatibiliteits- en testhelpers

Verouderde subpaden blijven geëxporteerd voor oudere plugins, maar nieuwe code moet de
gerichte SDK-subpaden hieronder gebruiken. De onderhouden lijst staat in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI weigert gebundelde
productie-imports daaruit. Brede barrels zoals `compat`, `config-types`,
`infra-runtime`, `text-runtime` en `zod` zijn alleen voor compatibiliteit. Importeer `zod`
rechtstreeks uit `zod`.

De Vitest-gebaseerde testhelper-subpaden van OpenClaw zijn alleen repo-lokaal en zijn niet
langer pakketexports: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` en `testing`.

### Gereserveerde helper-subpaden voor gebundelde plugins

Deze subpaden zijn plugin-eigen compatibiliteitsoppervlakken voor hun eigen gebundelde
plugin, geen algemene SDK-API's: `plugin-sdk/codex-mcp-projection` en
`plugin-sdk/codex-native-task-runtime`. Cross-owner extensie-imports worden geblokkeerd
door guardrails voor pakketcontracten.

<AccordionGroup>
  <Accordion title="Kanaalsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema-export (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Gecachte JSON Schema-validatiehelper voor schema's die eigendom zijn van plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde helpers voor de installatiewizard, setupvertaler, allowlist-prompts en bouwers voor setupstatussen |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor multi-accountconfiguratie/actiegates, helpers voor fallback naar standaardaccount |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers voor normalisatie van account-id's |
    | `plugin-sdk/account-resolution` | Helpers voor accountopzoeking + standaardfallback |
    | `plugin-sdk/account-helpers` | Smalle helpers voor accountlijsten/accountacties |
    | `plugin-sdk/access-groups` | Helpers voor het parsen van access-group-allowlists en geredigeerde groepsdiagnostiek |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde primitieven voor kanaalconfiguratieschema's plus Zod- en directe JSON/TypeBox-bouwers |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's alleen voor onderhouden gebundelde plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Canonieke gebundelde/officiële chatkanaal-id's plus formatterlabels/-aliassen voor plugins die envelope-prefixed tekst moeten herkennen zonder hun eigen tabel te hardcoden. |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor gebundelde kanaalconfiguratieschema's |
    | `plugin-sdk/telegram-command-config` | Telegram-helpers voor normalisatie/validatie van aangepaste opdrachten met bundled-contract-fallback |
    | `plugin-sdk/command-gating` | Smalle helpers voor autorisatiegates voor opdrachten |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Verouderde low-level compatibiliteitsfacade voor kanaalingress. Nieuwe ontvangstpaden moeten `plugin-sdk/channel-ingress-runtime` gebruiken. |
    | `plugin-sdk/channel-ingress-runtime` | Experimentele high-level runtime-resolver voor kanaalingress en bouwers van routefeiten voor gemigreerde ontvangstpaden van kanalen. Geef hier de voorkeur aan boven het samenstellen van effectieve allowlists, opdracht-allowlists en legacy-projecties in elke plugin. Zie [Kanaalingress-API](/nl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Berichtenlevenscycluscontracten plus opties voor reply-pipelines, ontvangstbewijzen, live preview/streaming, levenscyclushelpers, outbound-identiteit, payloadplanning, duurzame verzendingen en helpers voor berichtverzendcontext. Zie [Channel outbound-API](/nl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy facades voor reply-dispatch. |
    | `plugin-sdk/channel-message-runtime` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound` plus legacy facades voor reply-dispatch. |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor inbound routes + envelopebouwers |
    | `plugin-sdk/inbound-reply-dispatch` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-inbound` voor inbound runners en dispatch-predicaten, en `plugin-sdk/channel-outbound` voor helpers voor berichtaflevering. |
    | `plugin-sdk/messaging-targets` | Verouderde alias voor target-parsing; gebruik `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor laden van outbound media en hosted-media-status |
    | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Smalle helpers voor poll-normalisatie |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor levenscyclus en adapters van thread-bindings |
    | `plugin-sdk/agent-media-payload` | Legacy builder voor agent-mediapayloads |
    | `plugin-sdk/conversation-runtime` | Helpers voor conversatie/thread-binding, pairing en geconfigureerde bindings |
    | `plugin-sdk/runtime-config-snapshot` | Helper voor runtimeconfiguratiesnapshot |
    | `plugin-sdk/runtime-group-policy` | Helpers voor runtime-resolutie van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor kanaalstatussnapshots/-samenvattingen |
    | `plugin-sdk/channel-config-primitives` | Smalle primitieven voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Helpers voor autorisatie van kanaalconfiguratieschrijfacties |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor bewerken/lezen van allowlistconfiguratie |
    | `plugin-sdk/group-access` | Gedeelde beslissingshelpers voor groepstoegang |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Smalle helpers voor pre-crypto guardbeleid voor directe DM's |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfacade voor gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarcompatibiliteit; nieuwe plugins moeten generieke subpaden van de kanaal-SDK gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfacade voor accountresolutie voor bijgehouden eigenaarcompatibiliteit; nieuwe plugins moeten geïnjecteerde runtimehelpers of generieke subpaden van de kanaal-SDK gebruiken |
    | `plugin-sdk/zalouser` | Verouderde Zalo Personal-compatibiliteitsfacade voor gepubliceerde Lark/Zalo-pakketten die nog steeds autorisatie voor afzenderopdrachten importeren; nieuwe plugins moeten `plugin-sdk/command-auth` gebruiken |
    | `plugin-sdk/interactive-runtime` | Semantische berichtpresentatie, aflevering en legacy helpers voor interactieve replies. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gedeelde inbound helpers voor gebeurtenisclassificatie, contextopbouw, formattering, roots, debounce, mention-matching, mentionbeleid en inbound logging |
    | `plugin-sdk/channel-inbound-debounce` | Smalle inbound debounce-helpers |
    | `plugin-sdk/channel-mention-gating` | Smalle helpers voor mentionbeleid, mentionmarkeringen en mentiontekst zonder het bredere inbound runtime-oppervlak |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Verouderde compatibiliteitsfacades. Gebruik `plugin-sdk/channel-inbound` of `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfacade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typen voor reply-resultaten |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde native schemahelpers die behouden zijn voor plugincompatibiliteit |
    | `plugin-sdk/channel-route` | Gedeelde helpers voor routenormalisatie, parsergestuurde targetresolutie, stringificatie van thread-id's, dedupe/compacte routesleutels, typen voor parsed targets en route-/targetvergelijking |
    | `plugin-sdk/channel-targets` | Helpers voor target-parsing; callers voor routevergelijking moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Kanaalcontracttypen |
    | `plugin-sdk/channel-feedback` | Wiring voor feedback/reacties |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor secret-contracten, zoals `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` en secret-targettypen |
  </Accordion>

Verouderde kanaalhelperfamilies blijven alleen beschikbaar voor compatibiliteit
met gepubliceerde plugins. Het verwijderingsplan is: behoud ze gedurende het
migratievenster voor externe plugins, houd repo-/gebundelde plugins op
`channel-inbound` en `channel-outbound`, en verwijder daarna de
compatibiliteitssubpaden bij de volgende grote SDK-opschoning. Dit geldt voor
de oude families voor kanaalberichten/runtime, kanaalstreaming, directe-DM-toegang,
versplinterde inbound helpers, reply-opties en pairing-paden.

  <Accordion title="Provider-subpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor setup, catalogusdetectie en voorbereiding van runtimemodellen |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor lokale serverstandaarden, modeldetectie, requestheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Samengestelde lokale/zelfgehoste helpers voor providersetup |
    | `plugin-sdk/self-hosted-provider-setup` | Gerichte OpenAI-compatibele helpers voor setup van zelfgehoste providers |
    | `plugin-sdk/cli-backend` | CLI-backendstandaarden + watchdog-constanten |
    | `plugin-sdk/provider-auth-runtime` | Runtimehelpers voor API-sleutelresolutie voor providerplugins |
    | `plugin-sdk/provider-oauth-runtime` | Generieke OAuth-callbacktypen voor providers, rendering van callbackpagina's, PKCE-/state-helpers, parsering van autorisatie-invoer, helpers voor tokenverloop en afbreekhelpers |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor onboarding/API-sleutelprofiel schrijven, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaardbouwer voor OAuth-auth-resultaten |
    | `plugin-sdk/provider-env-vars` | Helpers voor opzoeken van provider-authenticatie-env-vars |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex-auth-importhelpers, verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor replaybeleid, helpers voor providereindpunten en gedeelde helpers voor normalisatie van model-id's |
    | `plugin-sdk/provider-catalog-live-runtime` | Live helpers voor provider-modelcatalogi voor afgeschermde `/models`-achtige detectie: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtering van model-id's, TTL-cache en statische fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtimehook voor uitbreiding van providercatalogi en registerranden voor pluginproviders voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke helpers voor provider-HTTP/eindpuntmogelijkheden, provider-HTTP-fouten en helpers voor multipartformulieren voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Smalle contracthelpers voor web-fetch-configuratie/selectie, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers voor registratie/cache van web-fetch-providers |
    | `plugin-sdk/provider-web-search-config-contract` | Smalle webzoekconfiguratie-/credentialhelpers voor providers die geen plugin-enable-bedrading nodig hebben |
    | `plugin-sdk/provider-web-search-contract` | Smalle contracthelpers voor webzoekconfiguratie/credentials, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` en scoped credentialsetters/getters |
    | `plugin-sdk/provider-web-search` | Helpers voor registratie/cache/runtime van webzoekproviders |
    | `plugin-sdk/embedding-providers` | Algemene typen en leeshelpers voor embeddingproviders, waaronder `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` en `listEmbeddingProviders(...)`; plugins registreren providers via `api.registerEmbeddingProvider(...)` zodat eigenaarschap via manifesten wordt afgedwongen |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` en schema-opschoning + diagnostiek voor DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Typen voor providergebruikssnapshots, gedeelde helpers voor het ophalen van gebruik en providerfetchers zoals `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, streamwrappertypen, compatibiliteit voor tool-calls in platte tekst en gedeelde wrapperhelpers voor Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Publieke gedeelde helpers voor providerstreamwrappers, waaronder `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` en streamhulpprogramma's die compatibel zijn met Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Native helpers voor providertransport, zoals afgeschermde fetch, transformaties van transportberichten en schrijfbare transporteventstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor patches van onboardingconfiguratie |
    | `plugin-sdk/global-singleton` | Proceslokale singleton-/map-/cachehelpers |
    | `plugin-sdk/group-activation` | Smalle helpers voor groepsactiveringsmodus en commandoparsering |
  </Accordion>

Providergebruikssnapshots rapporteren normaal gesproken een of meer quota-`windows`, elk met
een label, gebruikt percentage en optionele resettijd. Providers die saldo- of
accountstatustekst blootstellen in plaats van resetbare quotavensters, moeten
`summary` retourneren met een lege `windows`-array in plaats van percentages te verzinnen.
OpenClaw toont die samenvattingstekst in statusuitvoer; gebruik `error` alleen wanneer het
gebruikseindpunt is mislukt of geen bruikbare gebruiksgegevens heeft geretourneerd.

  <Accordion title="Authenticatie- en beveiligingssubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, commandoregisterhelpers inclusief dynamische argumentmenu-opmaak, helpers voor afzenderautorisatie |
    | `plugin-sdk/command-status` | Bouwers voor commando-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor approverresolutie en actie-authenticatie binnen dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Native helpers voor exec-goedkeuringsprofielen/-filters |
    | `plugin-sdk/approval-delivery-runtime` | Native adapters voor goedkeuringsmogelijkheden/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde helper voor Gateway-resolutie van goedkeuringen |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichte native helpers voor laden van goedkeuringsadapters voor hot channel-entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de smallere adapter-/gatewayranden wanneer die voldoende zijn |
    | `plugin-sdk/approval-native-runtime` | Native goedkeuringsdoel, accountbinding, routegate, forwardingfallback en helpers voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded bindings voor goedkeuringsreacties, payloads voor reactieprompts, opslag voor reactiedoelen en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reply-runtime` | Payloadhelpers voor exec-/plugingoedkeuringsantwoorden |
    | `plugin-sdk/approval-runtime` | Payloadhelpers voor exec-/plugingoedkeuringen, native helpers voor goedkeuringsrouting/runtime en helpers voor gestructureerde goedkeuringsweergave, zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Smalle resethelpers voor deduplicatie van inkomende antwoorden |
    | `plugin-sdk/channel-contract-testing` | Smalle helpers voor kanaalcontracttests zonder de brede testing barrel |
    | `plugin-sdk/command-auth-native` | Native commando-authenticatie, dynamische argumentmenu-opmaak en native helpers voor sessiedoelen |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor commandodetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichte commandotekstpredicaten voor hot channel-paden |
    | `plugin-sdk/command-surface` | Normalisatie van commandobody's en helpers voor commandosurfaces |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Smalle helpers voor verzameling van secretcontracten voor kanaal-/pluginsecretsurfaces |
    | `plugin-sdk/secret-ref-runtime` | Smalle `coerceSecretRef`- en SecretRef-typehelpers voor parsering van secretcontracten/configuratie |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef-providerintegratiemanifest en presetcontracten voor plugins die externe secretproviderpresets publiceren |
    | `plugin-sdk/security-runtime` | Gedeelde helpers voor vertrouwen, DM-gating, root-begrensde bestanden/paden inclusief create-only schrijfacties, synchrone/asynchrone atomische bestandsvervanging, schrijven naar tijdelijke siblingbestanden, fallback voor verplaatsing tussen apparaten, private filestorehelpers, guards voor symlink-ouders, externe content, redactie van gevoelige tekst, vergelijking van secrets in constante tijd en helpers voor secretverzameling |
    | `plugin-sdk/ssrf-policy` | Helpers voor host-allowlists en SSRF-beleid voor privénetwerken |
    | `plugin-sdk/ssrf-dispatcher` | Smalle helpers voor pinned dispatchers zonder het brede infra-runtimesurface |
    | `plugin-sdk/ssrf-runtime` | Pinned dispatcher, SSRF-afgeschermde fetch, SSRF-fout en SSRF-beleidhelpers |
    | `plugin-sdk/secret-input` | Helpers voor parsering van secretinvoer |
    | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-requests/-doelen en coercion van raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helpers voor grootte/time-out van requestbody's |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Brede hulpfuncties voor runtime, logging, back-ups en plugininstallatie |
    | `plugin-sdk/runtime-env` | Smalle hulpfuncties voor runtime-env, logger, time-out, opnieuw proberen en backoff |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratiefacade voor genormaliseerde profielen/standaardwaarden, CDP-URL-parsing en hulpfuncties voor browserbesturingsauthenticatie |
    | `plugin-sdk/agent-harness-task-runtime` | Generieke hulpfuncties voor taaklevenscyclus en levering van voltooiing voor harness-ondersteunde agents die een door de host uitgegeven taakscope gebruiken |
    | `plugin-sdk/codex-mcp-projection` | Gereserveerde gebundelde Codex-hulpfunctie om gebruikers-MCP-serverconfiguratie naar Codex-threadconfiguratie te projecteren; niet voor plugins van derden |
    | `plugin-sdk/codex-native-task-runtime` | Prive gebundelde Codex-hulpfunctie voor native taakspiegeling/runtime-bedrading; niet voor plugins van derden |
    | `plugin-sdk/channel-runtime-context` | Generieke hulpfuncties voor registratie en lookup van channel-runtimecontext |
    | `plugin-sdk/matrix` | Verouderde Matrix-compatibiliteitsfacade voor oudere channelpakketten van derden; nieuwe plugins moeten `plugin-sdk/run-command` rechtstreeks importeren |
    | `plugin-sdk/mattermost` | Verouderde Mattermost-compatibiliteitsfacade voor oudere channelpakketten van derden; nieuwe plugins moeten generieke SDK-subpaden rechtstreeks importeren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gedeelde hulpfuncties voor pluginopdrachten, hooks, HTTP en interactie |
    | `plugin-sdk/hook-runtime` | Gedeelde hulpfuncties voor Webhook-/interne hook-pijplijnen |
    | `plugin-sdk/lazy-runtime` | Hulpfuncties voor lazy runtime-imports/bindingen, zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hulpfuncties voor procesuitvoering |
    | `plugin-sdk/cli-runtime` | Hulpfuncties voor CLI-formattering, wachten, versie, argumentaanroep en lazy opdrachtgroepen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gedeelde QA-scenario-id's voor live transport, hulpfuncties voor basisdekking en hulpfunctie voor scenarioselectie |
    | `plugin-sdk/gateway-method-runtime` | Gereserveerde hulpfunctie voor Gateway-methodeverzending voor plugin-HTTP-routes die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren |
    | `plugin-sdk/gateway-runtime` | Gateway-client, hulpfunctie voor het starten van een event-loop-ready client, Gateway-CLI-RPC, Gateway-protocolfouten en hulpfuncties voor channelstatuspatches |
    | `plugin-sdk/config-contracts` | Gerichte type-only configuratiesurface voor pluginconfiguratievormen zoals `OpenClawConfig` en channel-/providerconfiguratietypen |
    | `plugin-sdk/plugin-config-runtime` | Hulpfuncties voor runtime-pluginconfiguratielookup, zoals `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele hulpfuncties voor configuratiemutatie, zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gedeelde metadata-hintstrings voor levering van berichttools |
    | `plugin-sdk/runtime-config-snapshot` | Hulpfuncties voor huidige procesconfiguratiesnapshots, zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en testsnapshotsetters |
    | `plugin-sdk/telegram-command-config` | Normalisatie van Telegram-opdrachtnamen/-beschrijvingen en controles op duplicaten/conflicten, zelfs wanneer de gebundelde Telegram-contractsurface niet beschikbaar is |
    | `plugin-sdk/text-autolink-runtime` | Autolinkdetectie voor bestandsreferenties zonder de brede tekstbarrel |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded goedkeuringsreactiebindingen, payloads voor reactieprompts, stores voor reactiedoelen en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-runtime` | Hulpfuncties voor exec-/plugingoedkeuring, builders voor goedkeuringsmogelijkheden, auth-/profielhulpfuncties, hulpfuncties voor native routing/runtime en formattering van gestructureerde goedkeuringsweergavepaden |
    | `plugin-sdk/reply-runtime` | Gedeelde hulpfuncties voor inbound/reply-runtime, chunking, verzending, Heartbeat, replyplanner |
    | `plugin-sdk/reply-dispatch-runtime` | Smalle hulpfuncties voor replyverzending/-finalisatie en conversatielabels |
    | `plugin-sdk/reply-history` | Gedeelde hulpfuncties voor replygeschiedenis met korte vensters. Nieuwe bericht-turn-code moet `createChannelHistoryWindow` gebruiken; map-hulpfuncties op lager niveau blijven alleen verouderde compatibiliteitsexports |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Smalle hulpfuncties voor tekst-/markdownchunking |
    | `plugin-sdk/session-store-runtime` | Hulpfuncties voor sessieworkflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrensde recente leesacties van gebruikers-/assistant-transcripttekst op sessie-identiteit, hulpfuncties voor legacy sessiestorepaden/sessiesleutels, updated-at-leesacties en overgangs-only compatibiliteitshulpfuncties voor volledige stores/bestandspaden |
    | `plugin-sdk/session-transcript-runtime` | Transcriptidentiteit, gescopete hulpfuncties voor doelen/lezen/schrijven, updatepublicatie, schrijflocks en hitsleutels voor transcriptgeheugen |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-hulpfuncties voor agentschema's, paden en transacties voor first-party runtime |
    | `plugin-sdk/cron-store-runtime` | Hulpfuncties voor Cron-storepaden/laden/opslaan |
    | `plugin-sdk/state-paths` | Hulpfuncties voor State-/OAuth-directorypaden |
    | `plugin-sdk/plugin-state-runtime` | Plugin-sidecar-SQLite-typen voor keyed state plus gecentraliseerde setup voor verbindingspragma en WAL-onderhoud voor plugin-owned databases |
    | `plugin-sdk/routing` | Hulpfuncties voor route-/sessiesleutel-/accountbindingen, zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde hulpfuncties voor channel-/accountstatussamenvattingen, runtime-state-standaardwaarden en issue-metadata |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde hulpfuncties voor targetresolvers |
    | `plugin-sdk/string-normalization-runtime` | Hulpfuncties voor slug-/stringnormalisatie |
    | `plugin-sdk/request-url` | Haal string-URL's uit fetch-/request-achtige invoer |
    | `plugin-sdk/run-command` | Getimede command runner met genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Algemene param-readers voor tools/CLI |
    | `plugin-sdk/tool-plugin` | Definieer een eenvoudige getypte agenttool-plugin en expose statische metadata voor manifestgeneratie |
    | `plugin-sdk/tool-payload` | Haal genormaliseerde payloads uit toolresultaatobjecten |
    | `plugin-sdk/tool-send` | Haal canonieke velden voor verzenddoelen uit toolargs |
    | `plugin-sdk/sandbox` | Sandbox-backendtypen en SSH-/OpenShell-opdrachthulpfuncties, inclusief fail-fast preflight voor exec-opdrachten |
    | `plugin-sdk/temp-path` | Gedeelde hulpfuncties voor tijdelijke downloadpaden en prive beveiligde tijdelijke workspaces |
    | `plugin-sdk/logging-core` | Subsystemlogger en hulpfuncties voor redactie |
    | `plugin-sdk/markdown-table-runtime` | Hulpfuncties voor markdowntabelmodus en conversie |
    | `plugin-sdk/model-session-runtime` | Hulpfuncties voor model-/sessie-overschrijvingen, zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hulpfuncties voor talk-providerconfiguratieresolutie |
    | `plugin-sdk/json-store` | Kleine hulpfuncties voor lezen/schrijven van JSON-state |
    | `plugin-sdk/json-unsafe-integers` | JSON-parsinghulpfuncties die onveilige integerliterals als strings behouden |
    | `plugin-sdk/file-lock` | Re-entrante hulpfuncties voor bestandslocks |
    | `plugin-sdk/persistent-dedupe` | Hulpfuncties voor dedupe-cache met schijfbacking |
    | `plugin-sdk/acp-runtime` | Hulpfuncties voor ACP-runtime/sessies en replyverzending |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht ACP-backendregionistratie en hulpfuncties voor replyverzending voor bij opstarten geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Alleen-lezen ACP-bindingresolutie zonder imports voor lifecycle-startup |
    | `plugin-sdk/agent-config-primitives` | Smalle primitives voor agents-runtimeconfiguratieschema's |
    | `plugin-sdk/boolean-param` | Losse boolean-param-reader |
    | `plugin-sdk/dangerous-name-runtime` | Hulpfuncties voor resolutie van dangerous-name-matching |
    | `plugin-sdk/device-bootstrap` | Hulpfuncties voor device-bootstrap en pairing-tokens |
    | `plugin-sdk/extension-shared` | Gedeelde primitives voor passive channels, status en ambient proxy-hulpfuncties |
    | `plugin-sdk/models-provider-runtime` | Hulpfuncties voor `/models`-opdracht-/providerantwoorden |
    | `plugin-sdk/skill-commands-runtime` | Hulpfuncties voor het weergeven van Skill-opdrachten |
    | `plugin-sdk/native-command-registry` | Hulpfuncties voor native opdrachtregistries/bouwen/serialiseren |
    | `plugin-sdk/agent-harness` | Experimentele trusted-plugin-surface voor low-level agentharnesses: harnesstypen, hulpfuncties voor sturen/afbreken van actieve runs, OpenClaw-toolbridgehulpfuncties, hulpfuncties voor runtime-plan-toolbeleid, classificatie van terminale uitkomsten, formatterings-/detailhulpfuncties voor toolvoortgang en utilities voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Verouderde provider-owned endpointdetectiefacade van Z.AI; gebruik de publieke API van de Z.AI-plugin |
    | `plugin-sdk/async-lock-runtime` | Proceslokale async-lock-hulpfunctie voor kleine runtime-statebestanden |
    | `plugin-sdk/channel-activity-runtime` | Hulpfunctie voor channelactiviteitstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Hulpfunctie voor begrensde async-taakconcurrency |
    | `plugin-sdk/dedupe-runtime` | Hulpfuncties voor in-memory dedupe-cache |
    | `plugin-sdk/delivery-queue-runtime` | Hulpfunctie voor het drainen van uitstaande outbound leveringen |
    | `plugin-sdk/file-access-runtime` | Hulpfuncties voor veilige lokale bestanden en mediasourcepaden |
    | `plugin-sdk/heartbeat-runtime` | Hulpfuncties voor Heartbeat-wake, events en zichtbaarheid |
    | `plugin-sdk/number-runtime` | Hulpfunctie voor numerieke coercion |
    | `plugin-sdk/secure-random-runtime` | Hulpfuncties voor beveiligde tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Hulpfuncties voor systeemeventqueues |
    | `plugin-sdk/transport-ready-runtime` | Hulpfunctie voor wachten op transportgereedheid |
    | `plugin-sdk/exec-approvals-runtime` | Hulpfuncties voor exec-goedkeuringsbeleidsbestanden zonder de brede infra-runtimebarrel |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine hulpfuncties voor begrensde caches |
    | `plugin-sdk/diagnostic-runtime` | Hulpfuncties voor diagnostische flags, events en tracecontexten |
    | `plugin-sdk/error-runtime` | Foutgraaf, formattering, gedeelde hulpfuncties voor foutclassificatie, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrapte fetch, proxy, EnvHttpProxyAgent-optie en hulpfuncties voor pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime-fetch zonder proxy-/guarded-fetch-imports |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer voor inline image-data-URL's en hulpfuncties voor signaturesniffing zonder de brede media-runtime-surface |
    | `plugin-sdk/response-limit-runtime` | Begrensde reader voor responsebody's zonder de brede media-runtime-surface |
    | `plugin-sdk/session-binding-runtime` | Huidige conversatiebindingstate zonder geconfigureerde bindingrouting of pairingstores |
    | `plugin-sdk/session-store-runtime` | Hulpfuncties voor sessiestores zonder brede configuratieschrijfacties/onderhoudsimports |
    | `plugin-sdk/sqlite-runtime` | Gerichte SQLite-hulpfuncties voor agentschema's, paden en transacties zonder database-lifecyclecontroles |
    | `plugin-sdk/context-visibility-runtime` | Resolutie van contextzichtbaarheid en aanvullende contextfiltering zonder brede configuratie-/security-imports |
    | `plugin-sdk/string-coerce-runtime` | Smalle hulpfuncties voor primitive record-/stringcoercion en normalisatie zonder markdown-/loggingimports |
    | `plugin-sdk/host-runtime` | Hulpfuncties voor hostnaam- en SCP-hostnormalisatie |
    | `plugin-sdk/retry-runtime` | Hulpfuncties voor retryconfiguratie en retryrunner |
    | `plugin-sdk/agent-runtime` | Hulpfuncties voor agentdirectory's/identiteit/workspaces, inclusief `resolveAgentDir`, `resolveDefaultAgentDir` en verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Config-backed directoryquery/deduplicatie |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpaden voor mogelijkheden en testen">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gedeelde hulpfuncties voor media ophalen/transformeren/opslaan, waaronder `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` en verouderde `fetchRemoteMedia`; geef de voorkeur aan opslaghulpfuncties boven bufferlezingen wanneer een URL OpenClaw-media moet worden |
    | `plugin-sdk/media-mime` | Gerichte MIME-normalisatie, mapping van bestandsextensies, MIME-detectie en hulpfuncties voor mediasoorten |
    | `plugin-sdk/media-store` | Gerichte hulpfuncties voor mediaopslag, zoals `saveMediaBuffer` en `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde hulpfuncties voor failover bij mediageneratie, kandidaatselectie en meldingen over ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte hulpexports voor afbeeldingen/audio/gestructureerde extractie |
    | `plugin-sdk/text-chunking` | Hulpfuncties voor het opdelen/renderen van tekst en markdown, conversie van markdown-tabellen, verwijderen van richtlijntags en hulpprogramma's voor veilige tekst |
    | `plugin-sdk/text-chunking` | Hulpfunctie voor opdelen van uitgaande tekst |
    | `plugin-sdk/speech` | Spraakprovidertypen plus providergerichte exports voor richtlijnen, register, validatie, OpenAI-compatibele TTS-builder en spraakhulpfuncties |
    | `plugin-sdk/speech-core` | Gedeelde spraakprovidertypen, register, richtlijn, normalisatie en exports voor spraakhulpfuncties |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registerhulpfuncties en gedeelde hulpfunctie voor WebSocket-sessies |
    | `plugin-sdk/realtime-bootstrap-context` | Realtime profiel-bootstraphulpfunctie voor begrensde contextinjectie van `IDENTITY.md`, `USER.md` en `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime spraak, registerhulpfuncties en gedeelde hulpfuncties voor realtime spraakgedrag, inclusief tracking van uitvoeractiviteit |
    | `plugin-sdk/image-generation` | Providertypen voor afbeeldingsgeneratie plus hulpfuncties voor afbeeldingsassets/data-URL's en de OpenAI-compatibele afbeeldingsproviderbuilder |
    | `plugin-sdk/image-generation-core` | Gedeelde typen, failover, auth en registerhulpfuncties voor afbeeldingsgeneratie |
    | `plugin-sdk/music-generation` | Provider-/aanvraag-/resultaattypen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Gedeelde typen voor muziekgeneratie, failover-hulpfuncties, provideropzoeking en parsing van modelverwijzingen |
    | `plugin-sdk/video-generation` | Provider-/aanvraag-/resultaattypen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failover-hulpfuncties, provideropzoeking en parsing van modelverwijzingen |
    | `plugin-sdk/transcripts` | Gedeelde typen voor transcriptbronproviders, registerhulpfuncties, sessiedescriptors en metadata van uitingen |
    | `plugin-sdk/webhook-targets` | Webhook-doelregister en hulpfuncties voor route-installatie |
    | `plugin-sdk/webhook-path` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gedeelde hulpfuncties voor het laden van externe/lokale media |
    | `plugin-sdk/zod` | Verouderde compatibiliteits-re-export; importeer `zod` rechtstreeks uit `zod` |
    | `plugin-sdk/testing` | Repo-lokale verouderde compatibiliteitsbarrel voor legacy OpenClaw-tests. Nieuwe repo-tests moeten in plaats daarvan gerichte lokale testsubpaden importeren, zoals `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale `createTestPluginApi`-hulpfunctie voor unittests met directe Plugin-registratie zonder repo-testhelperbruggen te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale native contractfixtures voor agent-runtime-adapters voor tests van auth, levering, fallback, tool-hook, prompt-overlay, schema en transcriptprojectie |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanaalgerichte testhulpfuncties voor generieke acties-/setup-/statuscontracten, directory-asserties, opstartlevenscyclus van accounts, send-config-threading, runtime-mocks, statusproblemen, uitgaande levering en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gedeelde suite voor foutgevallen bij doelresolutie voor kanaaltests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale contracthulpfuncties voor Plugin-pakket, registratie, openbaar artifact, directe import, runtime-API en import-side-effects |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale contracthulpfuncties voor provider-runtime, auth, ontdekking, onboarding, catalogus, wizard, mediamogelijkheid, replaybeleid, realtime STT-liveaudio, webzoek/fetch en stream |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale opt-in Vitest HTTP-/auth-mocks voor providertests die `plugin-sdk/provider-http` gebruiken |
    | `plugin-sdk/test-fixtures` | Repo-lokale generieke fixtures voor CLI-runtime-capture, sandboxcontext, Skills-schrijver, agentbericht, systeemgebeurtenis, module-herladen, pad van gebundelde Plugin, terminaltekst, chunking, auth-token en getypte cases |
    | `plugin-sdk/test-node-mocks` | Repo-lokale gerichte hulpfuncties voor Node ingebouwde mocks voor gebruik binnen Vitest `vi.mock("node:*")`-factories |
  </Accordion>

  <Accordion title="Geheugensubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebundeld memory-core-helperoppervlak voor manager-/config-/bestand-/CLI-hulpfuncties |
    | `plugin-sdk/memory-core-engine-runtime` | Runtimefacade voor geheugenindex/-zoekfunctie |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lichtgewicht registerhulpfuncties voor geheugen-embeddingproviders |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports van de geheugenhost-foundation-engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contracten voor geheugenhost-embeddings, registertoegang, lokale provider en generieke batch-/remotehulpfuncties. `registerMemoryEmbeddingProvider` op dit oppervlak is verouderd; gebruik de generieke embeddingprovider-API voor nieuwe providers. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports van de geheugenhost-QMD-engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports van de geheugenhost-opslagengine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale hulpfuncties voor de geheugenhost |
    | `plugin-sdk/memory-core-host-query` | Queryhulpfuncties voor de geheugenhost |
    | `plugin-sdk/memory-core-host-secret` | Geheime-hulpfuncties voor de geheugenhost |
    | `plugin-sdk/memory-core-host-events` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Statushulpfuncties voor de geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehulpfuncties voor de geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-runtimehulpfuncties voor de geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands-/runtimehulpfuncties voor de geheugenhost |
    | `plugin-sdk/memory-host-core` | Leverancierneutrale alias voor core-runtimehulpfuncties van de geheugenhost |
    | `plugin-sdk/memory-host-events` | Leverancierneutrale alias voor hulpfuncties van het gebeurtenisjournaal van de geheugenhost |
    | `plugin-sdk/memory-host-files` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gedeelde managed-markdown-hulpfuncties voor geheugen-aangrenzende Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-runtimefacade voor toegang tot search-manager |
    | `plugin-sdk/memory-host-status` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Gereserveerde subpaden voor gebundelde hulpfuncties">
    Gereserveerde SDK-subpaden voor gebundelde hulpfuncties zijn smalle eigenaarspecifieke oppervlakken voor
    gebundelde Plugin-code. Ze worden bijgehouden in de SDK-inventaris zodat package-
    builds en aliasing deterministisch blijven, maar het zijn geen algemene API's
    voor Plugin-authoring. Nieuwe herbruikbare hostcontracten moeten generieke SDK-subpaden gebruiken
    zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en
    `plugin-sdk/plugin-config-runtime`.

    | Subpad | Eigenaar en doel |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Gebundelde Codex-Plugin-hulpfunctie voor het projecteren van MCP-serverconfiguratie van gebruikers naar Codex app-server-threadconfiguratie |
    | `plugin-sdk/codex-native-task-runtime` | Gebundelde Codex-Plugin-hulpfunctie voor het spiegelen van native subagents van Codex app-server naar OpenClaw-taakstatus |

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van Plugin SDK](/nl/plugins/sdk-overview)
- [Setup van Plugin SDK](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
