---
read_when:
    - Het juiste plugin-sdk-subpad kiezen voor een plugin-import
    - Subpaden van gebundelde Plugins en hulpoppervlakken controleren
summary: 'Plugin SDK-subpadcatalogus: welke imports waar staan, gegroepeerd per gebied'
title: Subpaden van de Plugin SDK
x-i18n:
    generated_at: "2026-07-16T16:21:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

De plugin-SDK wordt beschikbaar gesteld als een reeks beperkte openbare subpaden onder
`openclaw/plugin-sdk/`. Deze pagina catalogiseert de veelgebruikte subpaden, gegroepeerd op
doel. Drie bestanden definiëren het oppervlak:

- `scripts/lib/plugin-sdk-entrypoints.json`: de onderhouden inventaris van entrypoints
  die door de build wordt gecompileerd.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: repo-lokale
  subpaden voor tests/intern gebruik. De package-exports zijn de inventaris minus deze lijst.
- `src/plugin-sdk/entrypoints.ts`: classificatiemetadata voor verouderde
  subpaden, gereserveerde gebundelde helpers, ondersteunde gebundelde façades en
  openbare oppervlakken die eigendom zijn van plugins.

Onderhouders controleren het aantal openbare exports met `pnpm plugin-sdk:surface` en
actieve gereserveerde helpersubpaden met `pnpm plugins:boundary-report:summary`;
ongebruikte gereserveerde helperexports laten het CI-rapport mislukken in plaats van als
slapende compatibiliteitsschuld in de openbare SDK te blijven staan.

Zie [Overzicht van de plugin-SDK](/nl/plugins/sdk-overview) voor de handleiding voor het schrijven van plugins.

## Plugin-entry

| Subpad                         | Belangrijkste exports                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Helpers voor migratieprovideritems, zoals `createMigrationItem`, redenconstanten, itemstatusmarkeringen, redactiehelpers en `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Helpers voor runtimemigratie, zoals `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` en `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Registratie, detectie, reparatie, selectie, ernstniveaus en bevindingstypen voor Doctor-statuscontroles voor gebundelde statusconsumenten                                                                 |
| `plugin-sdk/config-schema`     | Verouderd. Zod-schema voor de hoofd-`openclaw.json` (`OpenClawSchema`); definieer in plaats daarvan plugin-lokale schema's en valideer met `plugin-sdk/json-schema-runtime`                                                  |

### Verouderde compatibiliteits- en testhelpers

Verouderde subpaden blijven geëxporteerd voor oudere plugins, maar nieuwe code moet de
gerichte SDK-subpaden hieronder gebruiken. De onderhouden lijst is
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI weigert gebundelde
productie-imports daaruit. Brede barrels zoals `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` en
`plugin-sdk/text-runtime` zijn uitsluitend voor compatibiliteit, en `plugin-sdk/zod` is een
compatibiliteitsherexport: importeer `zod` rechtstreeks uit `zod`. De brede domeinbarrels
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` en
`plugin-sdk/security-runtime` zijn eveneens verouderd ten gunste van gerichte
subpaden.

De door Vitest ondersteunde testhelpersubpaden van OpenClaw zijn uitsluitend repo-lokaal en zijn niet
langer package-exports: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` en `testing`. De privéoppervlakken voor gebundelde helpers
`ssrf-runtime-internal` en `codex-native-task-runtime` zijn eveneens uitsluitend
repo-lokaal.

### Gereserveerde helpersubpaden voor gebundelde plugins

`plugin-sdk/codex-mcp-projection` is het enige gereserveerde subpad: een plugin-eigen
compatibiliteitsoppervlak voor de gebundelde Codex-plugin, geen algemene SDK-API.
Plugin-imports tussen verschillende eigenaren worden geblokkeerd door contractcontroles van het package, en
CI mislukt wanneer een gereserveerd subpad niet langer wordt geïmporteerd.
`plugin-sdk/codex-native-task-runtime` is uitsluitend repo-lokaal en is geen package-
export.

`src/plugin-sdk/entrypoints.ts` houdt ook ondersteunde gebundelde façades bij: SDK-
entrypoints die door hun gebundelde plugin worden ondersteund totdat generieke contracten
ze vervangen: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` en `plugin-sdk/zalouser`. Verschillende hiervan zijn ook
verouderd voor nieuwe code; zie de opmerkingen per rij hieronder.

  <AccordionGroup>
  <Accordion title="Kanaalsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Validatiehelper met cache voor JSON Schema's die eigendom zijn van plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gedeelde helpers voor de configuratiewizard, configuratievertaler, prompts voor toelatingslijsten en bouwers voor de configuratiestatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers voor configuratie en actiepoorten voor meerdere accounts, en terugvalhelpers voor het standaardaccount |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers voor normalisatie van account-ID's |
    | `plugin-sdk/account-resolution` | Helpers voor het opzoeken van accounts en terugvallen op de standaardwaarde |
    | `plugin-sdk/account-helpers` | Gerichte helpers voor accountlijsten en accountacties |
    | `plugin-sdk/access-groups` | Parsering van toelatingslijsten voor toegangsgroepen en helpers voor geredigeerde groepsdiagnostiek |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Verouderde compatibiliteitsfaçade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gedeelde primitieven voor kanaalconfiguratieschema's, plus bouwers voor Zod en rechtstreekse JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Gebundelde OpenClaw-kanaalconfiguratieschema's, uitsluitend voor onderhouden gebundelde plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Canonieke ID's van gebundelde/officiële chatkanalen, plus opmaaklabels/-aliassen voor plugins die tekst met een envelopprefix moeten herkennen zonder hun eigen tabel hard te coderen. |
    | `plugin-sdk/channel-config-schema-legacy` | Verouderde compatibiliteitsalias voor configuratieschema's van gebundelde kanalen |
    | `plugin-sdk/telegram-command-config` | Verouderde normalisatie van Telegram-opdrachtnamen/-beschrijvingen en controles op duplicaten/conflicten; gebruik in nieuwe plugincode de pluginlokale afhandeling van opdrachtconfiguratie |
    | `plugin-sdk/command-gating` | Gerichte helpers voor autorisatiepoorten voor opdrachten |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Experimentele resolver op hoog niveau voor de runtime van binnenkomende kanaalberichten en bouwers van routeringsfeiten voor gemigreerde ontvangstpaden van kanalen. Geef hieraan de voorkeur boven het in elke plugin samenstellen van effectieve toelatingslijsten, toelatingslijsten voor opdrachten en verouderde projecties. Zie [API voor binnenkomende kanaalberichten](/nl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Verouderde compatibiliteitsfaçade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contracten voor de berichtlevenscyclus, plus opties voor de antwoordpijplijn, ontvangstbevestigingen, livevoorvertoning/streaming, levenscyclushelpers, uitgaande identiteit, payloadplanning, duurzame verzendingen en helpers voor de context van berichtverzending. Zie [API voor uitgaande kanaalberichten](/nl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Verouderde compatibiliteitsalias voor `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Gedeelde helpers voor het bouwen van binnenkomende routes en enveloppen |
    | `plugin-sdk/inbound-reply-dispatch` | Verouderde compatibiliteitsfaçade. Gebruik `plugin-sdk/channel-inbound` voor binnenkomende uitvoerders en verzendpredicaten, en `plugin-sdk/channel-outbound` voor helpers voor berichtbezorging. |
    | `plugin-sdk/messaging-targets` | Verouderde alias voor het parseren van doelen; gebruik `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gedeelde helpers voor het laden van uitgaande media en de status van gehoste media |
    | `plugin-sdk/outbound-send-deps` | Verouderde compatibiliteitsfaçade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Verouderde compatibiliteitsfaçade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Gerichte helpers voor het normaliseren van peilingen |
    | `plugin-sdk/thread-bindings-runtime` | Helpers voor de levenscyclus en adapters van threadkoppelingen |
    | `plugin-sdk/agent-media-payload` | Hoofdpaden en loaders voor mediapayloads van agents |
    | `plugin-sdk/conversation-runtime` | Verouderde brede barrel voor gespreks-/threadkoppeling, koppeling en helpers voor geconfigureerde koppelingen; geef de voorkeur aan gerichte subpaden voor koppelingen, zoals `plugin-sdk/thread-bindings-runtime` en `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Helpers voor het tijdens runtime oplossen van groepsbeleid |
    | `plugin-sdk/channel-status` | Gedeelde helpers voor momentopnamen en samenvattingen van de kanaalstatus |
    | `plugin-sdk/channel-config-primitives` | Gerichte primitieven voor kanaalconfiguratieschema's |
    | `plugin-sdk/channel-config-writes` | Autorisatiehelpers voor het schrijven van kanaalconfiguratie |
    | `plugin-sdk/channel-plugin-common` | Gedeelde prelude-exports voor kanaalplugins |
    | `plugin-sdk/allowlist-config-edit` | Helpers voor het bewerken en lezen van toelatingslijstconfiguratie |
    | `plugin-sdk/group-access` | Verouderde helpers voor beslissingen over groepstoegang; gebruik `resolveChannelMessageIngress` uit `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Verouderde compatibiliteitsfaçades. Gebruik `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Gerichte beleidshelpers voor directe DM-controles vóór cryptografie |
    | `plugin-sdk/discord` | Verouderde Discord-compatibiliteitsfaçade voor de gepubliceerde `@openclaw/discord@2026.3.13` en bijgehouden eigenaarcompatibiliteit; nieuwe plugins moeten generieke subpaden van de kanaal-SDK gebruiken |
    | `plugin-sdk/telegram-account` | Verouderde Telegram-compatibiliteitsfaçade voor accountresolutie ten behoeve van bijgehouden eigenaarcompatibiliteit; nieuwe plugins moeten geïnjecteerde runtimehelpers of generieke subpaden van de kanaal-SDK gebruiken |
    | `plugin-sdk/zalouser` | Verouderde compatibiliteitsfaçade van Zalo Personal voor gepubliceerde Lark-/Zalo-pakketten die nog autorisatie van afzenderopdrachten importeren; nieuwe plugins moeten generieke subpaden van de kanaal-SDK gebruiken |
    | `plugin-sdk/interactive-runtime` | Semantische berichtpresentatie, bezorging en verouderde helpers voor interactieve antwoorden. Zie [Berichtpresentatie](/nl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gedeelde helpers voor binnenkomende berichten voor gebeurtenisclassificatie, contextopbouw, opmaak, hoofdpaden, debounce, overeenkomst van vermeldingen, vermeldingsbeleid en logboekregistratie van binnenkomende berichten |
    | `plugin-sdk/channel-inbound-debounce` | Gerichte debounce-helpers voor binnenkomende berichten |
    | `plugin-sdk/channel-mention-gating` | Gerichte helpers voor vermeldingsbeleid, vermeldingsmarkeringen en vermeldingstekst zonder het bredere runtime-oppervlak voor binnenkomende berichten |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Verouderde compatibiliteitsfaçades. Gebruik `plugin-sdk/channel-inbound` of `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Verouderde compatibiliteitsfaçade. Gebruik `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Verouderde compatibiliteitsfaçade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Verouderde compatibiliteitsfaçade. Gebruik `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typen voor antwoordresultaten |
    | `plugin-sdk/channel-actions` | Helpers voor kanaalberichtacties, plus verouderde systeemeigen schemahelpers die behouden blijven voor plugincompatibiliteit |
    | `plugin-sdk/channel-route` | Gedeelde routenormalisatie, parsergestuurde doelresolutie, omzetting van thread-ID's naar tekenreeksen, ontdubbelde/compacte routesleutels, geparseerde doeltypen en helpers voor het vergelijken van routes/doelen |
    | `plugin-sdk/channel-targets` | Helpers voor het parseren van doelen; aanroepers die routes vergelijken moeten `plugin-sdk/channel-route` gebruiken |
    | `plugin-sdk/channel-contract` | Typen voor kanaalcontracten |
    | `plugin-sdk/channel-feedback` | Koppeling van feedback/reacties |
  </Accordion>

Verouderde families van kanaalhelpers blijven alleen beschikbaar voor compatibiliteit met gepubliceerde plugins. Het verwijderingsplan is: behoud ze gedurende de migratieperiode voor externe plugins, houd repo-/gebundelde plugins op `channel-inbound` en `channel-outbound`, en verwijder vervolgens de compatibiliteitssubpaden bij de volgende grote SDK-opschoning. Dit geldt voor de oude families voor kanaalberichten/-runtime, kanaalstreaming, directe DM-toegang, afgesplitste helpers voor inkomende berichten, antwoordopties en koppelingspaden.

  <Accordion title="Providersubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Ondersteunde LM Studio-providerfacade voor configuratie, catalogusdetectie en voorbereiding van runtimemodellen |
    | `plugin-sdk/lmstudio-runtime` | Ondersteunde LM Studio-runtimefacade voor standaardinstellingen van lokale servers, modeldetectie, aanvraagheaders en helpers voor geladen modellen |
    | `plugin-sdk/provider-setup` | Samengestelde configuratiehelpers voor lokale/zelfgehoste providers |
    | `plugin-sdk/self-hosted-provider-setup` | Verouderde OpenAI-compatibele configuratiehelpers voor zelfhosting; gebruik `plugin-sdk/provider-setup` of configuratiehelpers die eigendom zijn van een plugin |
    | `plugin-sdk/cli-backend` | Standaardinstellingen voor de CLI-backend + watchdogconstanten |
    | `plugin-sdk/provider-auth-runtime` | Runtimehelpers voor providerauthenticatie: OAuth-loopbackflow, tokenuitwisseling, opslag van authenticatie en resolutie van API-sleutels |
    | `plugin-sdk/provider-oauth-runtime` | Generieke typen voor OAuth-callbacks van providers, rendering van callbackpagina's, PKCE-/statushelpers, parsing van autorisatie-invoer, helpers voor tokenverval en afbreekhelpers |
    | `plugin-sdk/provider-auth-api-key` | Helpers voor onboarding met API-sleutels en het schrijven van profielen, zoals `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standaardbouwer voor OAuth-authenticatieresultaten |
    | `plugin-sdk/provider-env-vars` | Helpers voor het opzoeken van omgevingsvariabelen voor providerauthenticatie |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helpers voor het importeren van OpenAI Codex-authenticatie, verouderde compatibiliteitsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gedeelde bouwers voor beleid inzake herhaalde verzoeken, helpers voor providereindpunten en gedeelde helpers voor normalisatie van model-ID's |
    | `plugin-sdk/provider-catalog-live-runtime` | Helpers voor live modelcatalogi van providers voor beveiligde detectie in de stijl van `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtering van model-ID's, TTL-cache en statische terugvaloptie |
    | `plugin-sdk/provider-catalog-runtime` | Runtimehook voor uitbreiding van providercatalogi en koppelvlakken voor het register van pluginproviders voor contracttests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generieke helpers voor HTTP-/eindpuntmogelijkheden van providers, HTTP-fouten van providers en multipart-formulierhelpers voor audiotranscriptie |
    | `plugin-sdk/provider-web-fetch-contract` | Specifieke contracthelpers voor configuratie/selectie van webophalen, zoals `enablePluginInConfig` en `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers voor registratie/caching van providers voor webophalen |
    | `plugin-sdk/provider-web-search-config-contract` | Specifieke configuratie-/referentiehelpers voor webzoekproviders waarvoor geen koppeling voor het inschakelen van plugins nodig is |
    | `plugin-sdk/provider-web-search-contract` | Specifieke contracthelpers voor configuratie/referenties voor webzoeken, zoals `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, en setters/getters voor referenties met een beperkt bereik |
    | `plugin-sdk/provider-web-search` | Helpers voor registratie/caching/runtime van webzoekproviders |
    | `plugin-sdk/embedding-providers` | Algemene typen voor embeddingproviders en leeshelpers, waaronder `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` en `listEmbeddingProviders(...)`; plugins registreren providers via `api.registerEmbeddingProvider(...)`, zodat manifesteigendom wordt afgedwongen |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, en opschoning + diagnostiek van schema's voor DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Typen voor momentopnamen van providergebruik, gedeelde helpers voor het ophalen van gebruik en providerophalers zoals `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typen voor streamwrappers, compatibiliteit met toolaanroepen in platte tekst en gedeelde wrapperhelpers voor Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Openbare gedeelde wrapperhelpers voor providerstreams, waaronder `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, en streamhulpprogramma's die compatibel zijn met Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Native transporthelpers voor providers, zoals beveiligd ophalen, tekstextractie uit toolresultaten, transformaties van transportberichten en beschrijfbare transportgebeurtenisstreams |
    | `plugin-sdk/provider-onboard` | Helpers voor patches van onboardingconfiguratie |
    | `plugin-sdk/global-singleton` | Proceslokale helpers voor singletons/maps/caches |
    | `plugin-sdk/group-activation` | Specifieke helpers voor groepsactiveringsmodi en opdrachtparsing |
  </Accordion>

Momentopnamen van providergebruik rapporteren normaal gesproken een of meer quota-`windows`, elk met
een label, gebruikt percentage en optionele resettijd. Providers die saldo- of
accountstatustekst tonen in plaats van resetbare quotavensters, moeten
`summary` retourneren met een lege `windows`-array in plaats van percentages te verzinnen.
OpenClaw toont die samenvattingstekst in de statusuitvoer; gebruik `error` alleen wanneer het
gebruikseindpunt is mislukt of geen bruikbare gebruiksgegevens heeft geretourneerd.

  <Accordion title="Subpaden voor authenticatie en beveiliging">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | Verouderd breed autorisatieoppervlak voor opdrachten (`resolveControlCommandGate`, helpers voor het opdrachtenregister, waaronder dynamische opmaak van menu's met argumenten, helpers voor afzenderautorisatie); gebruik autorisatie bij kanaalingang/runtime of helpers voor opdrachtstatus |
    | `plugin-sdk/command-status` | Bouwers voor opdracht-/helpberichten, zoals `buildCommandsMessagePaginated` en `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers voor het bepalen van goedkeurders en actieauthenticatie binnen dezelfde chat |
    | `plugin-sdk/approval-client-runtime` | Helpers voor profielen/filters voor native exec-goedkeuring |
    | `plugin-sdk/approval-delivery-runtime` | Adapters voor native goedkeuringsmogelijkheden/-levering |
    | `plugin-sdk/approval-gateway-runtime` | Gedeelde resolver voor de goedkeuringsgateway |
    | `plugin-sdk/approval-reference-runtime` | Deterministische helper voor duurzame lokalisators voor goedkeuringscallbacks met transportbeperkingen |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lichtgewicht helpers voor het laden van native goedkeuringsadapters voor intensief gebruikte kanaalingangspunten |
    | `plugin-sdk/approval-handler-runtime` | Bredere runtimehelpers voor goedkeuringshandlers; geef de voorkeur aan de specifiekere adapter-/gatewaykoppelvlakken wanneer die volstaan |
    | `plugin-sdk/approval-native-runtime` | Helpers voor native goedkeuringsdoelen, accountkoppeling, routecontrole, terugval bij doorsturen en onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reaction-runtime` | Hardgecodeerde koppelingen voor goedkeuringsreacties, payloads voor reactieprompts, opslagplaatsen voor reactiedoelen, helpers voor reactiehinttekst en compatibiliteitsexport voor onderdrukking van lokale native exec-prompts |
    | `plugin-sdk/approval-reply-runtime` | Helpers voor antwoordpayloads voor exec-/plugingoedkeuring |
    | `plugin-sdk/approval-runtime` | Payloadhelpers voor exec-/plugingoedkeuring, bouwers voor goedkeuringsmogelijkheden, helpers voor goedkeuringsauthenticatie/-profielen, helpers voor routering/runtime van native goedkeuringen en helpers voor gestructureerde weergave van goedkeuringen, zoals `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Verouderde specifieke resethelpers voor ontdubbeling van inkomende antwoorden |
    | `plugin-sdk/command-auth-native` | Native opdrachtauthenticatie, dynamische opmaak van menu's met argumenten en helpers voor native sessiedoelen |
    | `plugin-sdk/command-detection` | Gedeelde helpers voor opdrachtdetectie |
    | `plugin-sdk/command-primitives-runtime` | Lichtgewicht predicaten voor opdrachttekst voor intensief gebruikte kanaalpaden |
    | `plugin-sdk/command-surface` | Normalisatie van opdrachtinhoud en helpers voor het opdrachtoppervlak |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helpers voor luie aanmeldflows voor providerauthenticatie voor koppeling via apparaatcodes in privékanalen en de web-UI |
    | `plugin-sdk/channel-secret-runtime` | Verouderd breed oppervlak voor geheimencontracten (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, typen voor geheime doelen); geef de voorkeur aan de gerichte subpaden hieronder |
    | `plugin-sdk/channel-secret-basic-runtime` | Specifieke exports voor geheimencontracten en bouwers voor doelregisters voor niet-TTS-geheimoppervlakken van kanalen/plugins |
    | `plugin-sdk/channel-secret-tts-runtime` | Specifieke helpers voor de toewijzing van geneste TTS-geheimen voor kanalen |
    | `plugin-sdk/secret-ref-runtime` | Specifieke SecretRef-typering, resolutie en opzoekfunctie voor paden van plandoelen voor parsing van geheimencontracten/configuratie |
    | `plugin-sdk/secret-provider-integration` | Alleen-typencontracten voor het integratiemanifest en presets van SecretRef-providers voor plugins die externe presets van geheimproviders publiceren |
    | `plugin-sdk/security-runtime` | Verouderde brede barrel voor vertrouwen, DM-toegangscontrole, tot de hoofdmap beperkte bestands-/padhelpers, waaronder uitsluitend aanmaken bij schrijven, synchrone/asynchrone atomaire bestandsvervanging, schrijven naar tijdelijke bestanden ernaast, terugval voor verplaatsing tussen apparaten, helpers voor privébestandsopslag, controles op bovenliggende symbolische koppelingen, externe inhoud, redactie van gevoelige tekst, vergelijking van geheimen in constante tijd en helpers voor het verzamelen van geheimen; geef de voorkeur aan gerichte subpaden voor beveiliging/SSRF/geheimen |
    | `plugin-sdk/ssrf-policy` | Helpers voor hosttoegestane lijsten en SSRF-beleid voor privénetwerken |
    | `plugin-sdk/ssrf-dispatcher` | Specifieke helpers voor vastgezette dispatchers zonder het brede infrastructuurruntimeoppervlak |
    | `plugin-sdk/ssrf-runtime` | Helpers voor vastgezette dispatchers, SSRF-beveiligd ophalen, SSRF-fouten en SSRF-beleid |
    | `plugin-sdk/secret-input` | Helpers voor het parsen van invoer voor geheimen |
    | `plugin-sdk/webhook-ingress` | Helpers voor Webhook-verzoeken/-doelen en conversie van onbewerkte websockets/inhoud |
    | `plugin-sdk/webhook-request-guards` | Helpers voor grootte/time-out van aanvraaginhoud en `runDetachedWebhookWork` voor gevolgde verwerking na bevestiging |
  </Accordion>

  <Accordion title="Runtime- en opslagsubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers voor runtime/logboekregistratie/back-ups, waarschuwingen over installatiepaden van plugins en proceshelpers |
    | `plugin-sdk/runtime-env` | Gerichte helpers voor runtimeomgeving, logger, time-out, nieuwe pogingen en back-off |
    | `plugin-sdk/browser-config` | Ondersteunde browserconfiguratiefacade voor genormaliseerde profielen/standaardwaarden, het parseren van CDP-URL's en authenticatiehelpers voor browserbesturing |
    | `plugin-sdk/agent-harness-task-runtime` | Algemene helpers voor taaklevenscyclus en voltooiingslevering voor door een harness ondersteunde agents die een door de host uitgegeven taakbereik gebruiken |
    | `plugin-sdk/codex-mcp-projection` | Gereserveerde gebundelde Codex-helper om de configuratie van de MCP-server van de gebruiker te projecteren naar de Codex-threadconfiguratie; niet voor plugins van derden |
    | `plugin-sdk/codex-native-task-runtime` | Repo-lokale gebundelde Codex-helper voor de native bedrading van taakspiegeling/runtime; geen pakketexport |
    | `plugin-sdk/channel-runtime-context` | Algemene helpers voor registratie en opzoeken van de runtimecontext van kanalen |
    | `plugin-sdk/matrix` | Verouderde Matrix-compatibiliteitsfacade voor oudere kanaalpakketten van derden; nieuwe plugins moeten `plugin-sdk/run-command` rechtstreeks importeren |
    | `plugin-sdk/mattermost` | Verouderde Mattermost-compatibiliteitsfacade voor oudere kanaalpakketten van derden; nieuwe plugins moeten algemene SDK-subpaden rechtstreeks importeren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Verouderde brede barrel voor helpers voor pluginopdrachten, hooks, HTTP en interactie; geef de voorkeur aan gerichte runtime-subpaden voor plugins |
    | `plugin-sdk/hook-runtime` | Verouderde brede barrel voor helpers voor Webhooks/interne hookpijplijnen; geef de voorkeur aan gerichte runtime-subpaden voor hooks/plugins |
    | `plugin-sdk/lazy-runtime` | Helpers voor luie runtime-imports en -bindingen, zoals `createLazyRuntimeModule`, `createLazyRuntimeMethod` en `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers voor procesuitvoering |
    | `plugin-sdk/node-host` | Helpers voor het oplossen van uitvoerbare bestanden op Node-hosts en het hervatten van PTY's |
    | `plugin-sdk/cli-runtime` | Verouderde brede barrel voor CLI-opmaak, wachten, versies, argumentaanroepen en helpers voor lui geladen opdrachtgroepen; geef de voorkeur aan gerichte CLI-/runtime-subpaden |
    | `plugin-sdk/qa-runner-runtime` | Ondersteunde facade die QA-scenario's voor plugins beschikbaar maakt via het CLI-opdrachtoppervlak |
    | `plugin-sdk/tts-runtime` | Ondersteunde facade voor configuratieschema's en runtimehelpers voor tekst-naar-spraak |
    | `plugin-sdk/gateway-method-runtime` | Gereserveerde helper voor Gateway-methodeverzending voor HTTP-routes van plugins die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren |
    | `plugin-sdk/gateway-runtime` | Gateway-client, helper om een event-loop-klare client te starten, Gateway-CLI-RPC, Gateway-protocolfouten, oplossing van geadverteerde LAN-hosts en helpers voor het patchen van kanaalstatussen |
    | `plugin-sdk/config-contracts` | Gericht configuratieoppervlak met alleen typen voor pluginconfiguratievormen zoals `OpenClawConfig` en configuratietypen voor kanalen/providers |
    | `plugin-sdk/plugin-config-runtime` | Runtimehelpers voor pluginconfiguratie, zoals `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` en `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transactionele helpers voor configuratiemutaties, zoals `mutateConfigFile`, `replaceConfigFile` en `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gedeelde hintstrings voor leveringsmetadata van berichttools |
    | `plugin-sdk/runtime-config-snapshot` | Helpers voor momentopnamen van de huidige procesconfiguratie, zoals `getRuntimeConfig`, `getRuntimeConfigSnapshot` en setters voor testmomentopnamen |
    | `plugin-sdk/text-autolink-runtime` | Detectie van automatische koppelingen voor bestandsreferenties zonder de brede tekstbarrel |
    | `plugin-sdk/reply-runtime` | Gedeelde runtimehelpers voor inkomende berichten/antwoorden, segmentering, verzending, Heartbeat en antwoordplanner |
    | `plugin-sdk/reply-dispatch-runtime` | Gerichte helpers voor antwoordverzending/-afronding en gesprekslabels |
    | `plugin-sdk/reply-history` | Gedeelde helpers voor antwoordgeschiedenis binnen een kort tijdsvenster. Nieuwe code voor berichtbeurten moet `createChannelHistoryWindow` gebruiken; helpers voor maps op lager niveau blijven uitsluitend verouderde compatibiliteitsexports |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Gerichte helpers voor het segmenteren van tekst/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers voor sessieworkflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), helpers voor herstel/levenscyclus (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), markerhelpers voor overgangswaarden van `sessionFile`, begrensde leesbewerkingen van recente transcripttekst van gebruiker/assistent op basis van sessie-identiteit, helpers voor sessieopslagpaden/sessiesleutels en leesbewerkingen van het tijdstip van bijwerking, zonder brede imports voor configuratieschrijfbewerkingen/-onderhoud |
    | `plugin-sdk/session-transcript-runtime` | Transcriptidentiteit, helpers voor doelbepaling/lezen/schrijven binnen een bereik, projectie van zichtbare berichtvermeldingen, publicatie van updates, schrijfvergrendelingen en treffersleutels voor transcriptgeheugen |
    | `plugin-sdk/sqlite-runtime` | Gerichte helpers voor het SQLite-agentschema, paden en transacties voor interne runtime, zonder besturingselementen voor de databaselevenscyclus |
    | `plugin-sdk/cron-store-runtime` | Helpers voor pad/laden/opslaan van de Cron-opslag |
    | `plugin-sdk/state-paths` | Padhelpers voor status-/OAuth-mappen |
    | `plugin-sdk/plugin-state-runtime` | Typen voor gesleutelde status in SQLite-sidecars van plugins, plus gecentraliseerde verbindingspragma's, geverifieerd WAL-onderhoud en helpers voor atomaire STRICT-schemamigraties voor databases die eigendom zijn van plugins |
    | `plugin-sdk/routing` | Helpers voor route-/sessiesleutel-/accountbinding, zoals `resolveAgentRoute`, `buildAgentSessionKey` en `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gedeelde helpers voor statusoverzichten van kanalen/accounts, standaardwaarden voor runtimestatus en helpers voor probleemmetadata |
    | `plugin-sdk/target-resolver-runtime` | Gedeelde helpers voor doeloplossing |
    | `plugin-sdk/string-normalization-runtime` | Helpers voor normalisatie van slugs/strings |
    | `plugin-sdk/request-url` | String-URL's extraheren uit invoer die lijkt op fetch/verzoeken |
    | `plugin-sdk/run-command` | Opdrachtuitvoerder met tijdslimiet en genormaliseerde stdout-/stderr-resultaten |
    | `plugin-sdk/param-readers` | Algemene lezers voor tool-/CLI-parameters |
    | `plugin-sdk/tool-plugin` | Een eenvoudige getypeerde agenttoolplugin definiëren en statische metadata beschikbaar maken voor het genereren van manifesten |
    | `plugin-sdk/tool-payload` | Genormaliseerde payloads uit toolresultaatobjecten extraheren |
    | `plugin-sdk/tool-send` | Canonieke velden voor verzenddoelen uit toolargumenten extraheren |
    | `plugin-sdk/sandbox` | Typen voor sandbox-backends en opdrachthelpers voor SSH/OpenShell, inclusief snelle voorafgaande validatie van uitvoeringsopdrachten |
    | `plugin-sdk/temp-path` | Gedeelde padhelpers voor tijdelijke downloads en privé beveiligde tijdelijke werkruimten |
    | `plugin-sdk/logging-core` | Helpers voor subsystemloggers en redactie |
    | `plugin-sdk/markdown-table-runtime` | Helpers voor de modus en conversie van Markdown-tabellen |
    | `plugin-sdk/model-session-runtime` | Helpers voor model-/sessieoverschrijvingen, zoals `applyModelOverrideToSessionEntry` en `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers voor het oplossen van Talk-providerconfiguraties |
    | `plugin-sdk/json-store` | Kleine helpers voor het lezen/schrijven van JSON-status |
    | `plugin-sdk/json-unsafe-integers` | Helpers voor het parseren van JSON die onveilige letterlijke gehele getallen als strings behouden |
    | `plugin-sdk/file-lock` | Helpers voor herintreedbare bestandsvergrendelingen |
    | `plugin-sdk/persistent-dedupe` | Helpers voor een schijfgebaseerde cache voor deduplicatie |
    | `plugin-sdk/acp-runtime` | Helpers voor ACP-runtime/-sessies en antwoordverzending |
    | `plugin-sdk/acp-runtime-backend` | Lichtgewicht helpers voor ACP-backendregistratie en antwoordverzending voor bij het opstarten geladen plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Alleen-lezen oplossing van ACP-bindingen zonder imports voor het opstarten van de levenscyclus |
    | `plugin-sdk/agent-config-primitives` | Verouderde configuratieschemaprimitieven voor agentruntime; importeer schemaprimitieven uit een onderhouden oppervlak dat eigendom is van een plugin |
    | `plugin-sdk/boolean-param` | Flexibele lezer voor booleaanse parameters |
    | `plugin-sdk/dangerous-name-runtime` | Oplossingshelpers voor overeenkomsten met gevaarlijke namen |
    | `plugin-sdk/device-bootstrap` | Helpers voor het opstarten van apparaten en koppelingstokens, inclusief `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Gedeelde basishelpers voor passieve kanalen, status en omgevingsproxy's |
    | `plugin-sdk/models-provider-runtime` | Helpers voor antwoorden op opdrachten/providers van `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers voor het weergeven van Skill-opdrachten |
    | `plugin-sdk/native-command-registry` | Helpers voor het registreren/bouwen/serialiseren van native opdrachten |
    | `plugin-sdk/agent-harness` | Experimenteel oppervlak voor vertrouwde plugins voor agentharnassen op laag niveau: harnastypen, helpers voor het bijsturen/afbreken van actieve uitvoeringen, helpers voor de OpenClaw-toolbridge, helpers voor runtimeplanbeleid voor tools, classificatie van terminaluitkomsten, helpers voor opmaak/details van toolvoortgang en hulpprogramma's voor pogingresultaten |
    | `plugin-sdk/provider-zai-endpoint` | Verouderde facade voor detectie van eindpunten die eigendom is van de Z.AI-provider; gebruik de openbare API van de Z.AI-plugin |
    | `plugin-sdk/async-lock-runtime` | Proceslokale asynchrone vergrendelingshelper voor kleine runtimestatusbestanden |
    | `plugin-sdk/channel-activity-runtime` | Telemetriehelper voor kanaalactiviteit |
    | `plugin-sdk/concurrency-runtime` | Helper voor begrensde gelijktijdigheid van asynchrone taken |
    | `plugin-sdk/dedupe-runtime` | Helpers voor deduplicatiecaches in het geheugen en met persistente ondersteuning |
    | `plugin-sdk/delivery-queue-runtime` | Helper voor het leegmaken van wachtende uitgaande leveringen |
    | `plugin-sdk/file-access-runtime` | Veilige padhelpers voor lokale bestanden en mediabronnen |
    | `plugin-sdk/heartbeat-runtime` | Helpers voor activering, gebeurtenissen en zichtbaarheid van Heartbeat |
    | `plugin-sdk/expect-runtime` | Assertiehelper voor vereiste waarden bij aantoonbare runtime-invarianten |
    | `plugin-sdk/number-runtime` | Helper voor numerieke conversie |
    | `plugin-sdk/secure-random-runtime` | Helpers voor beveiligde tokens/UUID's |
    | `plugin-sdk/system-event-runtime` | Helpers voor wachtrijen van systeemgebeurtenissen |
    | `plugin-sdk/transport-ready-runtime` | W wachthelper voor transportgereedheid |
    | `plugin-sdk/exec-approvals-runtime` | Bestandshelpers voor het goedkeuringsbeleid voor uitvoeringen zonder de brede infra-runtimebarrel |
    | `plugin-sdk/infra-runtime` | Verouderde compatibiliteitsshim; gebruik de gerichte runtime-subpaden hierboven |
    | `plugin-sdk/collection-runtime` | Kleine begrensde cachehelpers |
    | `plugin-sdk/diagnostic-runtime` | Helpers voor diagnostische vlaggen, gebeurtenissen en traceercontext |
    | `plugin-sdk/error-runtime` | Foutgrafiek, opmaak, gedeelde helpers voor foutclassificatie, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers voor omhulde fetch, proxy's, EnvHttpProxyAgent-opties en vastgezette zoekopdrachten |
    | `plugin-sdk/runtime-fetch` | Dispatcherbewuste runtime-fetch zonder imports voor proxy/beveiligde fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Helpers voor het opschonen van inline URL's met afbeeldingsgegevens en het herkennen van signatures zonder het brede mediaruntimeoppervlak |
    | `plugin-sdk/response-limit-runtime` | Lezers van antwoordinhoud met begrenzingen voor bytes, inactiviteit en deadlines zonder het brede mediaruntimeoppervlak |
    | `plugin-sdk/session-binding-runtime` | Huidige bindingsstatus van gesprekken zonder geconfigureerde bindingsroutering of koppelingsopslag |
    | `plugin-sdk/context-visibility-runtime` | Oplossing van contextzichtbaarheid en filtering van aanvullende context zonder brede configuratie-/beveiligingsimports |
    | `plugin-sdk/string-coerce-runtime` | Gerichte primitieve helpers voor conversie en normalisatie van records/strings zonder Markdown-/logboekimports |
    | `plugin-sdk/html-entity-runtime` | Eenmalige decodering van met puntkomma afgesloten HTML5-entiteiten zonder brede teksthulpprogramma's |
    | `plugin-sdk/text-utility-runtime` | Tekst- en padhelpers op laag niveau, inclusief HTML-escaping van vijf entiteiten |
    | `plugin-sdk/widget-html` | Detectie van volledige documenten, groottevalidatie en fouten voor toolinvoer bij zelfstandige HTML-widgets |
    | `plugin-sdk/host-runtime` | Helpers voor normalisatie van hostnamen en SCP-hosts |
    | `plugin-sdk/retry-runtime` | Helpers voor configuratie en uitvoering van nieuwe pogingen |
    | `plugin-sdk/agent-runtime` | Verouderde brede barrel voor helpers voor agentmappen/-identiteiten/-werkruimten, inclusief `resolveAgentDir`, `resolveDefaultAgentDir` en de verouderde compatibiliteitsexport `resolveOpenClawAgentDir`; geef de voorkeur aan gerichte agent-/runtime-subpaden |
    | `plugin-sdk/directory-runtime` | Door configuratie ondersteunde mapquery/-deduplicatie |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpaden voor mogelijkheden en tests">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Verouderde brede mediabarrel met onder meer `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` en de verouderde `fetchRemoteMedia`; geef de voorkeur aan `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` en runtime-subpaden voor mogelijkheden, en geef de voorkeur aan opslaghelpers vóór het lezen van buffers wanneer een URL OpenClaw-media moet worden |
    | `plugin-sdk/media-mime` | Gerichte MIME-normalisatie, bestandsextensietoewijzing, MIME-detectie en helpers voor mediasoorten |
    | `plugin-sdk/media-store` | Gerichte helpers voor mediaopslag, zoals `saveMediaBuffer` en `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gedeelde failoverhelpers voor mediageneratie, kandidaatselectie en meldingen over ontbrekende modellen |
    | `plugin-sdk/media-understanding` | Providertypen voor mediabegrip plus providergerichte helperexports voor afbeeldingen, audio en gestructureerde extractie |
    | `plugin-sdk/text-chunking` | Uitgaande tekst en bereikchunking met behoud van offsets, Markdown-chunking en renderhelpers, aanhalingstekenbewuste tokenisatie van HTML-tags, conversie van Markdown-tabellen, verwijdering van directivetags en hulpprogramma's voor veilige tekst |
    | `plugin-sdk/speech` | Spraakprovidertypen plus providergerichte exports voor directieven, registers, validatie, de OpenAI-compatibele TTS-builder en spraakhelpers |
    | `plugin-sdk/speech-core` | Gedeelde spraakprovidertypen en exports voor registers, directieven, normalisatie en spraakhelpers |
    | `plugin-sdk/realtime-transcription` | Providertypen voor realtime transcriptie, registerhelpers en een gedeelde WebSocket-sessiehelper |
    | `plugin-sdk/realtime-bootstrap-context` | Bootstraphelper voor realtime profielen voor begrensde contextinjectie van `IDENTITY.md`, `USER.md` en `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Providertypen voor realtime spraak, registerhelpers en gedeelde gedragshelpers voor realtime spraak, inclusief het volgen van uitvoeractiviteit |
    | `plugin-sdk/image-generation` | Providertypen voor afbeeldingsgeneratie plus helpers voor afbeeldingsassets en data-URL's en de OpenAI-compatibele afbeeldingsproviderbuilder |
    | `plugin-sdk/image-generation-core` | Gedeelde typen en helpers voor failover, authenticatie en registers voor afbeeldingsgeneratie |
    | `plugin-sdk/music-generation` | Provider-, aanvraag- en resultaattypen voor muziekgeneratie |
    | `plugin-sdk/music-generation-core` | Verouderde gedeelde typen voor muziekgeneratie, failoverhelpers, provideropzoeking en parsing van modelverwijzingen; geef de voorkeur aan muziekproviderinterfaces die eigendom zijn van plugins |
    | `plugin-sdk/video-generation` | Provider-, aanvraag- en resultaattypen voor videogeneratie |
    | `plugin-sdk/video-generation-core` | Gedeelde typen voor videogeneratie, failoverhelpers, provideropzoeking en parsing van modelverwijzingen |
    | `plugin-sdk/transcripts` | Gedeelde providertypen voor transcriptbronnen, registerhelpers, sessiebeschrijvingen en metadata voor uitingen |
    | `plugin-sdk/webhook-targets` | Register voor Webhook-doelen en helpers voor route-installatie |
    | `plugin-sdk/webhook-path` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gedeelde helpers voor het op afstand en lokaal laden van media |
    | `plugin-sdk/zod` | Verouderde compatibiliteitsherexport; importeer `zod` rechtstreeks uit `zod` |
    | `plugin-sdk/plugin-test-api` | Minimale repo-lokale helper `createTestPluginApi` voor unit-tests van rechtstreekse pluginregistratie zonder repo-testhelperbruggen te importeren |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale contractfixtures voor systeemeigen agent-runtimeadapters voor tests van authenticatie, bezorging, fallback, toolhooks, promptoverlays, schema's en transcriptprojectie |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanaalgerichte testhelpers voor generieke contracten voor acties, configuratie en status, directory-asserties, de opstartlevenscyclus van accounts, doorvoering van verzendconfiguratie, runtimemocks, statusproblemen, uitgaande bezorging en hookregistratie |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gedeelde suite met foutgevallen voor doelresolutie in kanaaltests |
    | `plugin-sdk/channel-contract-testing` | Repo-lokale gerichte testhelpers voor kanaalcontracten zonder de brede testbarrel |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale helpers voor pluginpakketten, registratie, openbare artefacten, rechtstreekse imports, runtime-API's en contracten voor importbijwerkingen |
    | `plugin-sdk/plugin-state-test-runtime` | Repo-lokale testhelpers voor pluginstatusopslag, de ingress-wachtrij en de statusdatabase |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale helpers voor contracten voor providerruntime, authenticatie, detectie, onboarding, catalogi, wizards, mediamogelijkheden, replaybeleid, realtime live-audio-STT, zoeken en ophalen op het web en streams |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale opt-in HTTP- en authenticatiemocks voor Vitest voor providertests die `plugin-sdk/provider-http` uitvoeren |
    | `plugin-sdk/reply-payload-testing` | Repo-lokale helpers voor het toevoegen van metadata aan fixtures voor antwoordpayloads |
    | `plugin-sdk/sqlite-runtime-testing` | Repo-lokale helpers voor de SQLite-levenscyclus voor interne tests |
    | `plugin-sdk/test-fixtures` | Repo-lokale fixtures voor generieke CLI-runtimevastlegging, sandboxcontext, Skill-writers, agentberichten, systeemgebeurtenissen, het herladen van modules, gebundelde pluginpaden, terminaltekst, chunking, authenticatietokens en getypeerde testgevallen |
    | `plugin-sdk/test-node-mocks` | Repo-lokale gerichte mockhelpers voor ingebouwde Node-modules voor gebruik binnen Vitest-factories van `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Geheugensubpaden">
    | Subpad | Belangrijkste exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Verouderde runtimefacade voor geheugenindexering en -zoekopdrachten; geef de voorkeur aan leveranciersonafhankelijke memory-host-subpaden |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lichtgewicht registerhelpers voor providers van geheugenembeddings |
    | `plugin-sdk/memory-core-host-engine-foundation` | Engine-exports voor de basis van de geheugenhost |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embeddingcontracten voor de geheugenhost, registertoegang, lokale provider en generieke batch- en externe helpers. `registerMemoryEmbeddingProvider` op deze interface is verouderd; gebruik voor nieuwe providers de generieke API voor embeddingproviders. |
    | `plugin-sdk/memory-core-host-engine-qmd` | QMD-engine-exports voor de geheugenhost |
    | `plugin-sdk/memory-core-host-engine-storage` | Opslagengine-exports voor de geheugenhost |
    | `plugin-sdk/memory-core-host-multimodal` | Verouderde multimodale helpers voor de geheugenhost; geef de voorkeur aan leveranciersonafhankelijke memory-host-subpaden |
    | `plugin-sdk/memory-core-host-query` | Verouderde queryhelpers voor de geheugenhost; geef de voorkeur aan leveranciersonafhankelijke memory-host-subpaden |
    | `plugin-sdk/memory-core-host-secret` | Geheimhelpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-events` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Statushelpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtimehelpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-core` | Kernruntimehelpers voor de geheugenhost |
    | `plugin-sdk/memory-core-host-runtime-files` | Bestands- en runtimehelpers voor de geheugenhost |
    | `plugin-sdk/memory-host-core` | Leveranciersonafhankelijke alias voor kernruntimehelpers van de geheugenhost |
    | `plugin-sdk/memory-host-events` | Leveranciersonafhankelijke alias voor gebeurtenislogboekhelpers van de geheugenhost |
    | `plugin-sdk/memory-host-files` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gedeelde helpers voor beheerde Markdown voor plugins die aan geheugen grenzen |
    | `plugin-sdk/memory-host-search` | Active Memory-runtimefacade voor toegang tot de zoekmanager |
    | `plugin-sdk/memory-host-status` | Verouderde compatibiliteitsalias; gebruik `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Gereserveerde subpaden voor gebundelde helpers">
    Gereserveerde SDK-subpaden voor gebundelde helpers zijn gerichte, eigenaarspecifieke interfaces voor
    gebundelde plugincode. Ze worden bijgehouden in de SDK-inventaris, zodat pakket-
    builds en aliasing deterministisch blijven, maar het zijn geen algemene API's voor
    het ontwikkelen van plugins. Nieuwe herbruikbare hostcontracten moeten generieke SDK-subpaden gebruiken,
    zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` en
    `plugin-sdk/plugin-config-runtime`.

    | Subpad | Eigenaar en doel |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Gebundelde Codex-pluginhelper voor het projecteren van de MCP-serverconfiguratie van gebruikers naar de threadconfiguratie van de Codex-appserver (gereserveerde pakketexport) |
    | `plugin-sdk/codex-native-task-runtime` | Gebundelde Codex-pluginhelper voor het spiegelen van systeemeigen subagents van de Codex-appserver naar de OpenClaw-taakstatus (alleen repo-lokaal, geen pakketexport) |

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview)
- [Configuratie van de Plugin-SDK](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
