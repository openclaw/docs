---
read_when:
    - Provider-runtimehooks, kanaallevenscyclus of pakketpacks implementeren
    - Plugin-laadvolgorde of registerstatus debuggen
    - Een nieuwe Plugin-mogelijkheid of context-engine-Plugin toevoegen
summary: 'Plugin-architectuurinternals: laadpijplijn, register, runtime-hooks, HTTP-routes en referentietabellen'
title: Interne werking van de Plugin-architectuur
x-i18n:
    generated_at: "2026-06-27T17:49:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Zie [Plugin-architectuur](/nl/plugins/architecture) voor het publieke capabilitymodel, Plugin-vormen en eigendoms-/uitvoeringscontracten. Deze pagina is de referentie voor de interne werking: laadpipeline, register, runtime-hooks, Gateway-HTTP-routes, importpaden en schematabellen.

## Laadpipeline

Bij het opstarten doet OpenClaw grofweg dit:

1. kandidaat-Plugin-roots ontdekken
2. native of compatibele bundelmanifests en package-metadata lezen
3. onveilige kandidaten weigeren
4. Plugin-configuratie normaliseren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. enablement voor elke kandidaat bepalen
6. ingeschakelde native modules laden: gebouwde gebundelde modules gebruiken een native loader;
   lokale TypeScript-broncode van derden gebruikt de noodfallback Jiti
7. native `register(api)`-hooks aanroepen en registraties verzamelen in het Plugin-register
8. het register beschikbaar maken voor commando’s/runtime-oppervlakken

<Note>
`activate` is een legacy-alias voor `register` — de loader kiest wat aanwezig is (`def.register ?? def.activate`) en roept het op hetzelfde punt aan. Alle gebundelde Plugins gebruiken `register`; geef voor nieuwe Plugins de voorkeur aan `register`.
</Note>

De veiligheidspoorten vinden **voor** runtime-uitvoering plaats. Kandidaten worden geblokkeerd
wanneer de entry buiten de Plugin-root ontsnapt, het pad door iedereen schrijfbaar is, of padeigendom verdacht lijkt voor niet-gebundelde Plugins.

Geblokkeerde kandidaten blijven gekoppeld aan hun Plugin-id voor diagnostiek. Als de configuratie nog steeds naar die id verwijst, meldt validatie de Plugin als aanwezig maar geblokkeerd en verwijst terug naar de padveiligheidswaarschuwing in plaats van de configuratie-entry als verouderd te behandelen.

### Manifest-first-gedrag

Het manifest is de control-plane-bron van waarheid. OpenClaw gebruikt het om:

- de Plugin te identificeren
- gedeclareerde kanalen/Skills/configuratieschema’s of bundelcapabilities te ontdekken
- `plugins.entries.<id>.config` te valideren
- Control UI-labels/placeholders aan te vullen
- installatie-/catalogusmetadata te tonen
- goedkope activerings- en setupdescriptoren te behouden zonder Plugin-runtime te laden

Voor native Plugins is de runtime-module het data-plane-deel. Die registreert daadwerkelijk gedrag zoals hooks, tools, commando’s of providerflows.

Optionele manifestblokken `activation` en `setup` blijven op de control plane. Het zijn metadata-only descriptoren voor activeringsplanning en setupdetectie; ze vervangen runtime-registratie, `register(...)` of `setupEntry` niet.
De eerste live activeringsconsumenten gebruiken nu manifesthints voor commando’s, kanalen en providers om het laden van Plugins te beperken voordat bredere registermaterialisatie plaatsvindt:

- CLI-laden beperkt zich tot Plugins die eigenaar zijn van het gevraagde primaire commando
- kanaalsetup/Plugin-resolutie beperkt zich tot Plugins die eigenaar zijn van de gevraagde
  kanaal-id
- expliciete provider-setup/runtime-resolutie beperkt zich tot Plugins die eigenaar zijn van de
  gevraagde provider-id
- Gateway-opstartplanning gebruikt `activation.onStartup` voor expliciete opstartimports
  en opstart-opt-outs; Plugins zonder opstartmetadata laden alleen
  via nauwere activeringstriggers

Request-time runtime-preloads die om de brede scope `all` vragen, leiden nog steeds een expliciete effectieve set Plugin-id’s af uit configuratie, opstartplanning, geconfigureerde kanalen, slots en auto-enable-regels. Als die afgeleide set leeg is, laadt OpenClaw een leeg runtime-register in plaats van te verbreden naar elke ontdekbare Plugin.

De activeringsplanner biedt zowel een ids-only API voor bestaande callers als een plan-API voor nieuwe diagnostiek. Plan-entries melden waarom een Plugin is geselecteerd, met scheiding tussen expliciete `activation.*`-plannerhints en fallback op manifesteigendom zoals `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks. Die scheiding in redenen is de compatibiliteitsgrens: bestaande Plugin-metadata blijft werken, terwijl nieuwe code brede hints of fallbackgedrag kan detecteren zonder de semantiek van runtime-laden te wijzigen.

Setupdetectie geeft nu de voorkeur aan descriptor-owned id’s zoals `setup.providers` en `setup.cliBackends` om kandidaat-Plugins te beperken voordat wordt teruggevallen op `setup-api` voor Plugins die nog runtime-hooks tijdens setup nodig hebben. Provider-setuplijsten gebruiken manifest `providerAuthChoices`, uit descriptoren afgeleide setupkeuzes en installatiecatalogusmetadata zonder provider-runtime te laden. Expliciet `setup.requiresRuntime: false` is een descriptor-only afsluiting; weggelaten `requiresRuntime` behoudt de legacy `setup-api`-fallback voor compatibiliteit. Als meer dan één ontdekte Plugin dezelfde genormaliseerde setup-provider- of CLI-backend-id claimt, weigert setup-lookup de dubbelzinnige eigenaar in plaats van op ontdekkingsvolgorde te vertrouwen. Wanneer setup-runtime wel wordt uitgevoerd, meldt registerdiagnostiek drift tussen `setup.providers` / `setup.cliBackends` en de providers of CLI-backends die door setup-api zijn geregistreerd, zonder legacy Plugins te blokkeren.

### Plugin-cachegrens

OpenClaw cachet geen Plugin-ontdekkingsresultaten of directe manifestregisterdata achter wall-clock-vensters. Installaties, manifestbewerkingen en wijzigingen in laadpaden moeten zichtbaar worden bij de volgende expliciete metadatalezing of snapshot-rebuild.
De manifestbestandparser mag een begrensde bestandshandtekeningcache bijhouden, keyed op het geopende manifestpad, inode, grootte en timestamps; die cache voorkomt alleen het opnieuw parsen van ongewijzigde bytes en mag geen discovery-, register-, eigenaar- of policy-antwoorden cachen.

Het veilige metadata-fast path is expliciet objecteigendom, geen verborgen cache. Gateway-opstart-hot paths moeten de huidige `PluginMetadataSnapshot`, de afgeleide `PluginLookUpTable` of een expliciet manifestregister door de call chain doorgeven. Configuratievalidatie, opstart-auto-enable, Plugin-bootstrap en providerselectie kunnen die objecten hergebruiken zolang ze de huidige configuratie en Plugin-inventaris vertegenwoordigen. Setup-lookup reconstrueert manifestmetadata nog steeds op aanvraag, tenzij het specifieke setuppad een expliciet manifestregister ontvangt; behoud dat als cold-path-fallback in plaats van verborgen lookup-caches toe te voegen. Wanneer de input verandert, bouw de snapshot opnieuw op en vervang die, in plaats van deze te muteren of historische kopieën te bewaren.
Views over het actieve Plugin-register en gebundelde kanaal-bootstraphelpers moeten opnieuw worden berekend vanuit het huidige register/de huidige root. Kortlevende maps zijn prima binnen één call om werk te dedupliceren of reentry te bewaken; ze mogen geen procesmetadatacaches worden.

Voor het laden van Plugins is de persistente cachelaag runtime-laden. Die mag loaderstatus hergebruiken wanneer code of geïnstalleerde artifacts daadwerkelijk worden geladen, zoals:

- `PluginLoaderCacheState` en compatibele actieve runtime-registers
- jiti-/modulecaches en public-surface loader-caches die worden gebruikt om te voorkomen dat
  hetzelfde runtime-oppervlak herhaaldelijk wordt geïmporteerd
- bestandssysteemcaches voor geïnstalleerde Plugin-artifacts
- kortlevende per-call maps voor padnormalisatie of duplicate resolution

Die caches zijn data-plane-implementatiedetails. Ze mogen geen control-plane-vragen beantwoorden zoals "welke Plugin is eigenaar van deze provider?", tenzij de caller bewust om runtime-laden heeft gevraagd.

Voeg geen persistente of wall-clock-caches toe voor:

- ontdekkingsresultaten
- directe manifestregisters
- manifestregisters die zijn gereconstrueerd uit de geïnstalleerde Plugin-index
- provider-eigenaarlookup, modelonderdrukking, providerpolicy of public-artifact
  metadata
- elk ander manifest-afgeleid antwoord waarbij een gewijzigd manifest, geïnstalleerde index
  of laadpad zichtbaar moet zijn bij de volgende metadatalezing

Callers die manifestmetadata opnieuw opbouwen uit de persistente geïnstalleerde Plugin-index reconstrueren dat register op aanvraag. De geïnstalleerde index is duurzame source-plane-status; het is geen verborgen in-process metadatacache.

## Registermodel

Geladen Plugins muteren niet rechtstreeks willekeurige core-globals. Ze registreren in een centraal Plugin-register.

Het register houdt bij:

- Plugin-records (identiteit, bron, herkomst, status, diagnostiek)
- tools
- legacy hooks en getypeerde hooks
- kanalen
- providers
- Gateway-RPC-handlers
- HTTP-routes
- CLI-registrars
- achtergrondservices
- Plugin-owned commando’s

Core-features lezen vervolgens uit dat register in plaats van rechtstreeks met Plugin-modules te praten. Dit houdt laden eenrichtingsverkeer:

- Plugin-module -> registerregistratie
- core-runtime -> registerconsumptie

Die scheiding is belangrijk voor onderhoudbaarheid. Het betekent dat de meeste core-oppervlakken maar één integratiepunt nodig hebben: "lees het register", niet "special-case elke Plugin-module".

## Conversation binding callbacks

Plugins die een gesprek binden, kunnen reageren wanneer een goedkeuring is opgelost.

Gebruik `api.onConversationBindingResolved(...)` om een callback te ontvangen nadat een bind-request is goedgekeurd of geweigerd:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Callback-payloadvelden:

- `status`: `"approved"` of `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` of `"deny"`
- `binding`: de opgeloste binding voor goedgekeurde requests
- `request`: de oorspronkelijke request-samenvatting, detach-hint, sender-id en
  gespreksmetadata

Deze callback is alleen een melding. Hij verandert niet wie een gesprek mag binden, en hij draait nadat de core-goedkeuringsafhandeling is afgerond.

## Provider-runtime-hooks

Provider-Plugins hebben drie lagen:

- **Manifestmetadata** voor goedkope lookup voor runtime:
  `setup.providers[].envVars`, verouderde compatibiliteit `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` en `channelEnvVars`.
- **Config-time hooks**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`.
- **Runtime-hooks**: meer dan 40 optionele hooks voor auth, modelresolutie,
  stream-wrapping, thinking levels, replaypolicy en usage-eindpunten. Zie
  de volledige lijst onder [Hookvolgorde en gebruik](#hook-order-and-usage).

OpenClaw blijft eigenaar van de generieke agent-loop, failover, transcriptverwerking en toolpolicy. Deze hooks zijn het extensieoppervlak voor provider-specifiek gedrag zonder dat een volledig aangepast inference-transport nodig is.

Gebruik manifest `setup.providers[].envVars` wanneer de provider env-gebaseerde credentials heeft die generieke auth-/status-/model-picker-paden moeten zien zonder Plugin-runtime te laden. Verouderde `providerAuthEnvVars` wordt tijdens de deprecation window nog steeds gelezen door de compatibiliteitsadapter, en niet-gebundelde Plugins die dit gebruiken ontvangen een manifestdiagnostic. Gebruik manifest `providerAuthAliases` wanneer één provider-id de env-vars, auth-profielen, config-backed auth en API-key-onboardingkeuze van een andere provider-id moet hergebruiken. Gebruik manifest `providerAuthChoices` wanneer onboarding-/auth-choice-CLI-oppervlakken de keuze-id, groeplabels en eenvoudige one-flag-auth-wiring van de provider moeten kennen zonder provider-runtime te laden. Houd provider-runtime
`envVars` voor operatorgerichte hints zoals onboardinglabels of OAuth-client-id-/client-secret-setupvars.

Gebruik manifest `channelEnvVars` wanneer een kanaal env-gedreven auth of setup heeft die generieke shell-env-fallback, config-/statuschecks of setupprompts moeten zien zonder channel-runtime te laden.

### Hookvolgorde en gebruik

Voor model-/provider-Plugins roept OpenClaw hooks in deze grove volgorde aan.
De kolom "Wanneer gebruiken" is de snelle beslisgids.
Compatibility-only providervelden die OpenClaw niet meer aanroept, zoals
`ProviderPlugin.capabilities` en `suppressBuiltInModel`, worden hier bewust niet
vermeld.

| #   | Hook                              | Wat het doet                                                                                                   | Wanneer gebruiken                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publiceer providerconfiguratie in `models.providers` tijdens het genereren van `models.json`                                | Provider beheert een catalogus of standaardwaarden voor de basis-URL                                                                                                  |
| 2   | `applyConfigDefaults`             | Pas globale standaardconfiguratie van de provider toe tijdens configuratiematerialisatie                                      | Standaardwaarden hangen af van verificatiemodus, env of providersemantiek voor de modelfamilie                                                                         |
| --  | _(ingebouwde modelzoekopdracht)_         | OpenClaw probeert eerst het normale registry-/cataloguspad                                                          | _(geen Plugin-hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | Normaliseer verouderde of preview-aliassen voor model-id's vóór het opzoeken                                                     | Provider beheert aliassen opschonen vóór canonieke modelresolutie                                                                                 |
| 4   | `normalizeTransport`              | Normaliseer providerfamilie-`api` / `baseUrl` vóór generieke modelsamenstelling                                      | Provider beheert transportopschoning voor aangepaste provider-id's in dezelfde transportfamilie                                                          |
| 5   | `normalizeConfig`                 | Normaliseer `models.providers.<id>` vóór runtime-/providerresolutie                                           | Provider heeft configuratieopschoning nodig die bij de Plugin hoort; gebundelde Google-familiehelpers ondersteunen ook ondersteunde Google-configuratie-items   |
| 6   | `applyNativeStreamingUsageCompat` | Pas compat-herschrijvingen voor native streaminggebruik toe op configuratieproviders                                               | Provider heeft door het endpoint aangestuurde metadatafixes voor native streaminggebruik nodig                                                                          |
| 7   | `resolveConfigApiKey`             | Los env-marker-auth op voor configuratieproviders vóór het laden van runtime-auth                                       | Providers bieden hun eigen hooks voor env-marker-API-sleutelresolutie                                                                                |
| 8   | `resolveSyntheticAuth`            | Toon lokale/zelfgehoste of configuratieondersteunde auth zonder platte tekst persistent op te slaan                                   | Provider kan werken met een synthetische/lokale credential-marker                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Leg door de provider beheerde externe auth-profielen eroverheen; standaard `persistence` is `runtime-only` voor CLI-/app-beheerde credentials | Provider hergebruikt externe auth-credentials zonder gekopieerde refreshtokens persistent op te slaan; declareer `contracts.externalAuthProviders` in het manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Verlaag opgeslagen synthetische profielplaatshouders achter auth op basis van env/configuratie                                      | Provider slaat synthetische plaatshouderprofielen op die geen voorrang mogen krijgen                                                                 |
| 11  | `resolveDynamicModel`             | Synchrone fallback voor providerbeheerde model-id's die nog niet in het lokale registry staan                                       | Provider accepteert willekeurige upstream-model-id's                                                                                                 |
| 12  | `prepareDynamicModel`             | Asynchrone warming-up, daarna wordt `resolveDynamicModel` opnieuw uitgevoerd                                                           | Provider heeft netwerkmetadata nodig voordat onbekende id's worden opgelost                                                                                  |
| 13  | `normalizeResolvedModel`          | Laatste herschrijving voordat de embedded runner het opgeloste model gebruikt                                               | Provider heeft transportherschrijvingen nodig maar gebruikt nog steeds een kerntransport                                                                             |
| 14  | `normalizeToolSchemas`            | Normaliseer toolschema's voordat de embedded runner ze ziet                                                    | Provider heeft schemaopschoning voor de transportfamilie nodig                                                                                                |
| 15  | `inspectToolSchemas`              | Toon door de provider beheerde schemadiagnostiek na normalisatie                                                  | Provider wil trefwoordwaarschuwingen zonder core providerspecifieke regels te leren                                                                 |
| 16  | `resolveReasoningOutputMode`      | Selecteer native versus getagd reasoning-outputcontract                                                              | Provider heeft getagde redenering/einduitvoer nodig in plaats van native velden                                                                         |
| 17  | `prepareExtraParams`              | Normalisatie van aanvraagparameters vóór generieke wrappers voor streamopties                                              | Provider heeft standaardaanvraagparameters of parameteropschoning per provider nodig                                                                           |
| 18  | `createStreamFn`                  | Vervang het normale streampad volledig door een aangepast transport                                                   | Provider heeft een aangepast wireprotocol nodig, niet alleen een wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Streamwrapper nadat generieke wrappers zijn toegepast                                                              | Provider heeft compat-wrappers voor aanvraagheaders/body/model nodig zonder aangepast transport                                                          |
| 21  | `resolveTransportTurnState`       | Voeg native transportheaders of metadata per beurt toe                                                           | Provider wil dat generieke transporten providerspecifieke beurtidentiteit meesturen                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Voeg native WebSocket-headers of beleid voor sessieafkoeling toe                                                    | Provider wil dat generieke WS-transporten sessieheaders of fallbackbeleid afstemmen                                                               |
| 23  | `formatApiKey`                    | Formatter voor auth-profielen: opgeslagen profiel wordt de runtime-`apiKey`-tekenreeks                                     | Provider slaat extra auth-metadata op en heeft een aangepaste vorm voor het runtime-token nodig                                                                    |
| 24  | `refreshOAuth`                    | OAuth-refresh-override voor aangepaste refresh-endpoints of beleid voor refreshfouten                                  | Provider past niet bij de gedeelde OpenClaw-refreshers                                                                                          |
| 25  | `buildAuthDoctorHint`             | Herstelhint die wordt toegevoegd wanneer OAuth-refresh mislukt                                                                  | Provider heeft providerbeheerde auth-herstelbegeleiding nodig na een refreshfout                                                                      |
| 26  | `matchesContextOverflowError`     | Providerbeheerde matcher voor overflow van contextvensters                                                                 | Provider heeft ruwe overflowfouten die generieke heuristieken zouden missen                                                                                |
| 27  | `classifyFailoverReason`          | Providerbeheerde classificatie van failoverredenen                                                                  | Provider kan ruwe API-/transportfouten mappen naar rate-limit/overbelasting/enzovoort                                                                          |
| 28  | `isCacheTtlEligible`              | Prompt-cachebeleid voor proxy-/backhaulproviders                                                               | Provider heeft proxyspecifieke cache-TTL-gating nodig                                                                                                |
| 29  | `buildMissingAuthMessage`         | Vervanging voor het generieke herstelbericht bij ontbrekende auth                                                      | Provider heeft een providerspecifieke herstelhint voor ontbrekende auth nodig                                                                                 |
| 30  | `augmentModelCatalog`             | Synthetische/definitieve catalogusrijen die na discovery worden toegevoegd                                                          | Provider heeft synthetische forward-compat-rijen nodig in `models list` en pickers                                                                     |
| 31  | `resolveThinkingProfile`          | Modelspecifieke `/think`-niveauset, weergavelabels en standaardwaarde                                                 | Provider biedt een aangepaste thinking-ladder of binair label voor geselecteerde modellen                                                                 |
| 32  | `isBinaryThinking`                | Compatibiliteitshook voor aan/uit-redeneringsschakelaar                                                                     | Provider biedt alleen binair thinking aan/uit                                                                                                  |
| 33  | `supportsXHighThinking`           | Compatibiliteitshook voor `xhigh`-redeneringsondersteuning                                                                   | Provider wil `xhigh` alleen op een subset van modellen                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Compatibiliteitshook voor standaard `/think`-niveau                                                                      | Provider beheert standaard `/think`-beleid voor een modelfamilie                                                                                      |
| 35  | `isModernModelRef`                | Matcher voor moderne modellen voor live-profielfilters en smokeselectie                                              | Provider beheert voorkeursmodelmatching voor live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | Wissel een geconfigureerde credential om naar het daadwerkelijke runtime-token/de daadwerkelijke runtime-sleutel vlak vóór inferentie                       | Provider heeft een tokenuitwisseling of kortlevende aanvraagcredential nodig                                                                             |
| 37  | `resolveUsageAuth`                | Los gebruiks-/factureringscredentials op voor `/usage` en gerelateerde statusoppervlakken                                     | Provider heeft aangepaste parsing van gebruiks-/quotatokens of een andere gebruikscredential nodig                                                               |
| 38  | `fetchUsageSnapshot`              | Haal providerspecifieke gebruiks-/quotasnapshots op en normaliseer ze nadat auth is opgelost                             | Provider heeft een providerspecifiek gebruikseindpunt of payloadparser nodig                                                                           |
| 39  | `createEmbeddingProvider`         | Bouw een embeddingadapter in eigendom van de provider voor geheugen/zoeken                                                     | Gedrag voor geheugenembeddings hoort bij de providerplugin                                                                                    |
| 40  | `buildReplayPolicy`               | Retourneer een replaybeleid dat transcriptafhandeling voor de provider aanstuurt                                        | Provider heeft aangepast transcriptbeleid nodig (bijvoorbeeld het verwijderen van thinking-blokken)                                                               |
| 41  | `sanitizeReplayHistory`           | Herschrijf replaygeschiedenis na generieke transcriptopschoning                                                        | Provider heeft providerspecifieke replayherschrijvingen nodig naast gedeelde Compaction-helpers                                                             |
| 42  | `validateReplayTurns`             | Voer definitieve validatie of hervorming van replay-turns uit vóór de ingebedde runner                                           | Providertransport vereist strengere turnvalidatie na generieke opschoning                                                                    |
| 43  | `onModelSelected`                 | Voer side-effects na selectie uit die in eigendom zijn van de provider                                                                 | Provider heeft telemetrie of providerstatus in eigendom van de provider nodig wanneer een model actief wordt                                                                  |

`normalizeModelId`, `normalizeTransport` en `normalizeConfig` controleren eerst de
overeenkomende provider-Plugin en vallen daarna terug op andere provider-Plugins
met hook-ondersteuning totdat er een daadwerkelijk de model-id of transport/configuratie wijzigt. Zo blijven
alias-/compatibiliteitsprovider-shims werken zonder dat de aanroeper hoeft te weten welke
gebundelde Plugin eigenaar is van de herschrijving. Als geen provider-hook een ondersteunde
Google-familieconfiguratie-entry herschrijft, past de gebundelde Google-configuratienormalisator nog steeds
die compatibiliteitsopschoning toe.

Als de provider een volledig aangepast wire-protocol of aangepaste request-executor nodig heeft,
is dat een andere klasse extensie. Deze hooks zijn voor providergedrag
dat nog steeds op OpenClaw's normale inference-loop draait.

`resolveUsageAuth` bepaalt of OpenClaw `fetchUsageSnapshot` moet aanroepen of
moet terugvallen op generieke credential-resolutie voor gebruiks-/statusoppervlakken. Retourneer
`{ token, accountId? }` wanneer de provider een gebruikscredential heeft, retourneer
`{ handled: true }` wanneer gebruiksauthenticatie die eigendom is van de provider de request heeft afgehandeld en
generieke API-key-/OAuth-terugval moet onderdrukken, en retourneer `null` of `undefined`
wanneer de provider gebruiksauthenticatie niet heeft afgehandeld.

### Providervoorbeeld

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Ingebouwde voorbeelden

Gebundelde provider-Plugins combineren de hooks hierboven om aan te sluiten op de catalogus-,
authenticatie-, denk-, replay- en gebruiksbehoeften van elke vendor. De gezaghebbende hook-set staat bij
elke Plugin onder `extensions/`; deze pagina illustreert de vormen in plaats van
de lijst te spiegelen.

<AccordionGroup>
  <Accordion title="Doorgeefcatalogusproviders">
    OpenRouter, Kilocode, Z.AI, xAI registreren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` zodat ze upstream
    model-id's vóór OpenClaw's statische catalogus kunnen tonen.
  </Accordion>
  <Accordion title="OAuth- en gebruiksendpointproviders">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combineren
    `prepareRuntimeAuth` of `formatApiKey` met `resolveUsageAuth` +
    `fetchUsageSnapshot` om tokenuitwisseling en `/usage`-integratie te beheren.
  </Accordion>
  <Accordion title="Families voor replay- en transcriptopschoning">
    Gedeelde benoemde families (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) laten providers zich aanmelden voor
    transcriptbeleid via `buildReplayPolicy` in plaats van dat elke Plugin
    opschoning opnieuw implementeert.
  </Accordion>
  <Accordion title="Catalogus-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` en
    `volcengine` registreren alleen `catalog` en gebruiken de gedeelde inference-loop.
  </Accordion>
  <Accordion title="Anthropic-specifieke streamhelpers">
    Beta-headers, `/fast` / `serviceTier` en `context1m` staan binnen de
    publieke `api.ts` / `contract-api.ts`-seam van de Anthropic-Plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) in plaats van in
    de generieke SDK.
  </Accordion>
</AccordionGroup>

## Runtimehelpers

Plugins kunnen geselecteerde core-helpers openen via `api.runtime`. Voor TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Opmerkingen:

- `textToSpeech` retourneert de normale core-TTS-outputpayload voor bestands-/spraaknotitieoppervlakken.
- Gebruikt core-`messages.tts`-configuratie en providerselectie.
- Retourneert PCM-audiobuffer + samplerate. Plugins moeten resamplen/coderen voor providers.
- `listVoices` is optioneel per provider. Gebruik het voor voice-pickers of setupflows die eigendom zijn van de vendor.
- Stemlijsten kunnen rijkere metadata bevatten, zoals locale, gender en persoonlijkheidstags voor providerbewuste pickers.
- OpenAI en ElevenLabs ondersteunen vandaag telefonie. Microsoft niet.

Plugins kunnen ook spraakproviders registreren via `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Opmerkingen:

- Houd TTS-beleid, terugval en antwoordbezorging in core.
- Gebruik spraakproviders voor synthese gedrag dat eigendom is van de vendor.
- Legacy Microsoft-`edge`-input wordt genormaliseerd naar de provider-id `microsoft`.
- Het voorkeursmodel voor eigenaarschap is bedrijfsgericht: één vendor-Plugin kan eigenaar zijn van
  tekst-, spraak-, beeld- en toekomstige mediaproviders naarmate OpenClaw die
  capability-contracten toevoegt.

Voor begrip van beeld/audio/video registreren Plugins één getypte
media-understanding-provider in plaats van een generieke key/value-bag:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Opmerkingen:

- Houd orchestratie, terugval, configuratie en kanaalbedrading in core.
- Houd vendorgedrag in de provider-Plugin.
- Additieve uitbreiding moet getypt blijven: nieuwe optionele methoden, nieuwe optionele
  resultaatvelden, nieuwe optionele capabilities.
- Videogeneratie volgt al hetzelfde patroon:
  - core is eigenaar van het capability-contract en de runtimehelper
  - vendor-Plugins registreren `api.registerVideoGenerationProvider(...)`
  - feature-/kanaal-Plugins gebruiken `api.runtime.videoGeneration.*`

Voor runtimehelpers voor media-understanding kunnen Plugins aanroepen:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

Voor audiotranscriptie kunnen Plugins de media-understanding-runtime
of de oudere STT-alias gebruiken:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Opmerkingen:

- `api.runtime.mediaUnderstanding.*` is het aanbevolen gedeelde oppervlak voor
  begrip van beeld/audio/video.
- `extractStructuredWithModel(...)` is de Plugin-gerichte seam voor begrensde
  provider-owned image-first extractie. Neem ten minste één beeldinput op;
  tekstinputs zijn aanvullende context.
  product-Plugins zijn eigenaar van hun routes en schema's, terwijl OpenClaw eigenaar is van de
  provider-/runtimegrens.
- Gebruikt core media-understanding-audioconfiguratie (`tools.media.audio`) en provider-terugvalvolgorde.
- Retourneert `{ text: undefined }` wanneer er geen transcriptie-output wordt geproduceerd (bijvoorbeeld overgeslagen/niet-ondersteunde input).
- `api.runtime.stt.transcribeAudioFile(...)` blijft als compatibiliteitsalias bestaan.

Plugins kunnen ook achtergrondsubagent-runs starten via `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Opmerkingen:

- `provider` en `model` zijn optionele overrides per run, geen persistente sessiewijzigingen.
- OpenClaw respecteert die override-velden alleen voor vertrouwde aanroepers.
- Voor terugvalruns die eigendom zijn van Plugins moeten operators zich aanmelden met `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gebruik `plugins.entries.<id>.subagent.allowedModels` om vertrouwde Plugins te beperken tot specifieke canonieke `provider/model`-doelen, of `"*"` om elk doel expliciet toe te staan.
- Subagent-runs van niet-vertrouwde Plugins werken nog steeds, maar override-verzoeken worden geweigerd in plaats van stilzwijgend terug te vallen.
- Door Plugins gemaakte subagent-sessies worden getagd met de id van de makende Plugin. Terugval `api.runtime.subagent.deleteSession(...)` mag alleen die sessies in eigendom verwijderen; willekeurige sessieverwijdering vereist nog steeds een admin-scoped Gateway-request.

Voor webzoeken kunnen Plugins de gedeelde runtimehelper gebruiken in plaats van
in de agent-toolbedrading te grijpen:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugins kunnen ook webzoekproviders registreren via
`api.registerWebSearchProvider(...)`.

Opmerkingen:

- Houd providerselectie, credentialresolutie en gedeelde requestsemantiek in core.
- Gebruik webzoekproviders voor vendorspecifieke zoektransporten.
- `api.runtime.webSearch.*` is het aanbevolen gedeelde oppervlak voor feature-/kanaal-Plugins die zoekgedrag nodig hebben zonder afhankelijk te zijn van de agent-toolwrapper.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: genereer een afbeelding met de geconfigureerde keten van afbeeldinggeneratieproviders.
- `listProviders(...)`: lijst beschikbare afbeeldinggeneratieproviders en hun capabilities.

## Gateway-HTTP-routes

Plugins kunnen HTTP-endpoints beschikbaar maken met `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Routevelden:

- `path`: routepad onder de Gateway HTTP-server.
- `auth`: vereist. Gebruik `"gateway"` om normale Gateway-authenticatie te vereisen, of `"plugin"` voor door plugins beheerde authenticatie/webhook-verificatie.
- `match`: optioneel. `"exact"` (standaard) of `"prefix"`.
- `replaceExisting`: optioneel. Staat dezelfde plugin toe zijn eigen bestaande routeregistratie te vervangen.
- `handler`: retourneer `true` wanneer de route het verzoek heeft afgehandeld.

Opmerkingen:

- `api.registerHttpHandler(...)` is verwijderd en veroorzaakt een plugin-laadfout. Gebruik in plaats daarvan `api.registerHttpRoute(...)`.
- Pluginroutes moeten `auth` expliciet declareren.
- Exacte `path + match`-conflicten worden geweigerd tenzij `replaceExisting: true`, en de ene plugin kan de route van een andere plugin niet vervangen.
- Overlappende routes met verschillende `auth`-niveaus worden geweigerd. Houd `exact`/`prefix`-fallthroughketens alleen op hetzelfde authenticatieniveau.
- `auth: "plugin"`-routes ontvangen **niet** automatisch operator-runtime-scopes. Ze zijn bedoeld voor door plugins beheerde webhooks/handtekeningverificatie, niet voor geprivilegieerde Gateway-helperaanroepen.
- `auth: "gateway"`-routes worden uitgevoerd binnen een Gateway-request-runtime-scope, maar die scope is opzettelijk conservatief:
  - shared-secret bearer-authenticatie (`gateway.auth.mode = "token"` / `"password"`) houdt runtime-scopes van pluginroutes vastgezet op `operator.write`, zelfs als de aanroeper `x-openclaw-scopes` verzendt
  - vertrouwde HTTP-modi met identiteit (bijvoorbeeld `trusted-proxy` of `gateway.auth.mode = "none"` op een private ingress) honoreren `x-openclaw-scopes` alleen wanneer de header expliciet aanwezig is
  - als `x-openclaw-scopes` ontbreekt bij die identiteit-dragende pluginrouteverzoeken, valt runtime-scope terug op `operator.write`
- Praktische regel: ga er niet van uit dat een Gateway-auth-pluginroute een impliciet adminoppervlak is. Als je route gedrag nodig heeft dat alleen voor admins is, vereis dan een authenticatiemodus met identiteit en documenteer het expliciete `x-openclaw-scopes`-headercontract.

## Plugin SDK-importpaden

Gebruik smalle SDK-subpaden in plaats van de monolithische `openclaw/plugin-sdk`-rootbarrel
bij het maken van nieuwe plugins. Kernsubpaden:

| Subpad                              | Doel                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitieven voor pluginregistratie                 |
| `openclaw/plugin-sdk/channel-core`  | Helpers voor kanaalinvoer/opbouw                   |
| `openclaw/plugin-sdk/core`          | Generieke gedeelde helpers en overkoepelend contract |
| `openclaw/plugin-sdk/config-schema` | Root `openclaw.json` Zod-schema (`OpenClawSchema`) |

Kanaalplugins kiezen uit een familie van smalle raakvlakken — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` en `channel-actions`. Goedkeuringsgedrag moet worden geconsolideerd
op één `approvalCapability`-contract in plaats van te mengen tussen niet-gerelateerde
pluginvelden. Zie [Kanaalplugins](/nl/plugins/sdk-channel-plugins).

Runtime- en configuratiehelpers staan onder overeenkomende gerichte `*-runtime`-subpaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, enz.). Geef de voorkeur aan `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation`
in plaats van de brede `config-runtime`-compatibiliteitsbarrel.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
kleine kanaalhelperfacades, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
en `openclaw/plugin-sdk/infra-runtime` zijn verouderde compatibiliteitsshims voor
oudere plugins. Nieuwe code moet in plaats daarvan smallere generieke primitieven importeren.
</Info>

Repo-interne entrypoints (per root van gebundeld pluginpakket):

- `index.js` — entry voor gebundelde plugin
- `api.js` — barrel voor helpers/types
- `runtime-api.js` — barrel alleen voor runtime
- `setup-entry.js` — entry voor setup-plugin

Externe plugins mogen alleen `openclaw/plugin-sdk/*`-subpaden importeren. Importeer nooit
`src/*` van een ander pluginpakket vanuit core of vanuit een andere plugin.
Via facade geladen entrypoints geven de voorkeur aan de actieve runtime-configuratiesnapshot wanneer die
bestaat, en vallen daarna terug op het opgeloste configuratiebestand op schijf.

Capability-specifieke subpaden zoals `image-generation`, `media-understanding`,
en `speech` bestaan omdat gebundelde plugins ze vandaag gebruiken. Het zijn niet
automatisch langdurig bevroren externe contracten — controleer de relevante SDK-
referentiepagina wanneer je erop vertrouwt.

## Schema's voor berichttools

Plugins moeten kanaalspecifieke `describeMessageTool(...)`-schema-
bijdragen beheren voor niet-berichtprimitieven zoals reacties, leesbevestigingen en polls.
Gedeelde verzendpresentatie moet het generieke `MessagePresentation`-contract gebruiken
in plaats van provider-native knop-, component-, blok- of kaartvelden.
Zie [Berichtpresentatie](/nl/plugins/message-presentation) voor het contract,
fallbackregels, providertoewijzing en de checklist voor pluginauteurs.

Plugins die kunnen verzenden, declareren wat ze kunnen renderen via berichtcapabilities:

- `presentation` voor semantische presentatieblokken (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` voor verzoeken om vastgezette aflevering

Core beslist of de presentatie native wordt gerenderd of tot tekst wordt gedegradeerd.
Stel geen provider-native UI-uitwijkmogelijkheden bloot vanuit de generieke berichttool.
Verouderde SDK-helpers voor legacy native schema's blijven geëxporteerd voor bestaande
plugins van derden, maar nieuwe plugins moeten ze niet gebruiken.

## Resolutie van kanaaldoelen

Kanaalplugins moeten kanaalspecifieke doelsemantiek beheren. Houd de gedeelde
outbound-host generiek en gebruik het messaging-adapteroppervlak voor providerregels:

- `messaging.inferTargetChatType({ to })` beslist of een genormaliseerd doel
  moet worden behandeld als `direct`, `group` of `channel` vóór directory-lookup.
- `messaging.targetResolver.looksLikeId(raw, normalized)` vertelt core of een
  invoer direct moet doorgaan naar id-achtige resolutie in plaats van directoryzoekopdracht.
- `messaging.targetResolver.reservedLiterals` vermeldt losse woorden die
  kanaal-/sessiereferenties zijn voor die provider. Resolutie behoudt geconfigureerde
  directoryvermeldingen voordat gereserveerde literals worden geweigerd, en faalt daarna gesloten bij een
  directory-mis.
- `messaging.targetResolver.resolveTarget(...)` is de pluginfallback wanneer
  core een definitieve provider-beheerde resolutie nodig heeft na normalisatie of na een
  directory-mis.
- `messaging.resolveOutboundSessionRoute(...)` beheert provider-specifieke sessie-
  routeconstructie zodra een doel is opgelost.

Aanbevolen verdeling:

- Gebruik `inferTargetChatType` voor categoriebeslissingen die vóór het zoeken
  naar peers/groepen moeten plaatsvinden.
- Gebruik `looksLikeId` voor controles op "behandel dit als een expliciete/native doel-id".
- Gebruik `resolveTarget` voor provider-specifieke normalisatiefallback, niet voor
  brede directoryzoekopdrachten.
- Houd provider-native ids zoals chat-id's, thread-id's, JID's, handles en room-
  id's binnen `target`-waarden of provider-specifieke parameters, niet in generieke SDK-
  velden.

## Configuratie-ondersteunde directories

Plugins die directoryvermeldingen afleiden uit configuratie moeten die logica in de
plugin houden en de gedeelde helpers hergebruiken uit
`openclaw/plugin-sdk/directory-runtime`.

Gebruik dit wanneer een kanaal configuratie-ondersteunde peers/groepen nodig heeft, zoals:

- door allowlists aangestuurde DM-peers
- geconfigureerde kanaal-/groepsmaps
- statische directoryfallbacks per account

De gedeelde helpers in `directory-runtime` verwerken alleen generieke bewerkingen:

- queryfiltering
- limiettoepassing
- deduplicatie-/normalisatiehelpers
- bouwen van `ChannelDirectoryEntry[]`

Kanaalspecifieke accountinspectie en id-normalisatie moeten in de
pluginimplementatie blijven.

## Providercatalogi

Providerplugins kunnen modelcatalogi voor inference definiëren met
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retourneert dezelfde vorm die OpenClaw schrijft naar
`models.providers`:

- `{ provider }` voor één providervermelding
- `{ providers }` voor meerdere providervermeldingen

Gebruik `catalog` wanneer de plugin provider-specifieke model-id's, base-URL-
standaarden of door authenticatie afgeschermde modelmetadata beheert.

`catalog.order` bepaalt wanneer de catalogus van een plugin wordt samengevoegd ten opzichte van OpenClaw's
ingebouwde impliciete providers:

- `simple`: gewone API-key- of env-gestuurde providers
- `profile`: providers die verschijnen wanneer authenticatieprofielen bestaan
- `paired`: providers die meerdere gerelateerde providervermeldingen synthetiseren
- `late`: laatste pass, na andere impliciete providers

Latere providers winnen bij keyconflicten, dus plugins kunnen opzettelijk een
ingebouwde providervermelding overschrijven met dezelfde provider-id.

Plugins kunnen ook alleen-lezen modelrijen publiceren via
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Dit is het toekomstige pad voor lijst-/help-/pickeroppervlakken en ondersteunt
`text`, `image_generation`, `video_generation` en `music_generation`-rijen.
Providerplugins blijven eigenaar van live endpointaanroepen, tokenuitwisseling en vendor-
responsmapping; core beheert de gemeenschappelijke rijvorm, bronlabels en media-tool-
helpopmaak. Providerregistraties voor mediageneratie synthetiseren automatisch statische
catalogusrijen uit `defaultModel`, `models` en `capabilities`.

Compatibiliteit:

- `discovery` werkt nog als legacy alias, maar geeft een deprecationwaarschuwing
- als zowel `catalog` als `discovery` zijn geregistreerd, gebruikt OpenClaw `catalog`
- `augmentModelCatalog` is verouderd; gebundelde providers moeten aanvullende
  rijen publiceren via `registerModelCatalogProvider`

## Alleen-lezen kanaalinspectie

Als je plugin een kanaal registreert, geef dan de voorkeur aan implementatie van
`plugin.config.inspectAccount(cfg, accountId)` naast `resolveAccount(...)`.

Waarom:

- `resolveAccount(...)` is het runtimepad. Het mag aannemen dat credentials
  volledig gematerialiseerd zijn en snel falen wanneer vereiste secrets ontbreken.
- Alleen-lezen commandopaden zoals `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` en doctor-/configuratie-
  reparatieflows zouden geen runtimecredentials hoeven te materialiseren alleen om
  configuratie te beschrijven.

Aanbevolen gedrag voor `inspectAccount(...)`:

- Retourneer alleen beschrijvende accountstatus.
- Behoud `enabled` en `configured`.
- Neem credentialbron-/statusvelden op wanneer relevant, zoals:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Je hoeft geen ruwe tokenwaarden te retourneren alleen om alleen-lezen
  beschikbaarheid te rapporteren. `tokenStatus: "available"` retourneren (en het overeenkomende bron-
  veld) is genoeg voor statusachtige commando's.
- Gebruik `configured_unavailable` wanneer een credential via SecretRef is geconfigureerd maar
  niet beschikbaar is in het huidige commandopad.

Hierdoor kunnen alleen-lezen commando's "geconfigureerd maar niet beschikbaar in dit commando-
pad" rapporteren in plaats van te crashen of het account onterecht als niet geconfigureerd te rapporteren.

## Pakketpacks

Een plugindirectory kan een `package.json` bevatten met `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Elke entry wordt een plugin. Als de pack meerdere extensions vermeldt, wordt de plugin-id
`name/<fileBase>`.

Als je plugin npm-deps importeert, installeer ze dan in die directory zodat
`node_modules` beschikbaar is (`npm install` / `pnpm install`).

Beveiligingsgrens: elke `openclaw.extensions`-entry moet binnen de plugin-
directory blijven na symlinkresolutie. Entries die buiten de pakketdirectory komen,
worden geweigerd.

Beveiligingsopmerking: `openclaw plugins install` installeert pluginafhankelijkheden met een projectlokale `npm install --omit=dev --ignore-scripts` (geen lifecycle-scripts, geen dev-afhankelijkheden tijdens runtime), waarbij overgeërfde globale npm-installatie-instellingen worden genegeerd. Houd pluginafhankelijkheidsbomen "pure JS/TS" en vermijd pakketten die `postinstall`-builds vereisen.

Optioneel: `openclaw.setupEntry` kan verwijzen naar een lichte module die alleen voor setup is bedoeld. Wanneer OpenClaw setup-oppervlakken nodig heeft voor een uitgeschakelde kanaalplugin, of wanneer een kanaalplugin is ingeschakeld maar nog niet is geconfigureerd, laadt het `setupEntry` in plaats van de volledige plugin-entry. Dit houdt opstarten en setup lichter wanneer je hoofd-plugin-entry ook tools, hooks of andere code die alleen tijdens runtime nodig is, aansluit.

Optioneel: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` kan een kanaalplugin tijdens de pre-listen-opstartfase van de Gateway voor hetzelfde `setupEntry`-pad kiezen, zelfs wanneer het kanaal al is geconfigureerd.

Gebruik dit alleen wanneer `setupEntry` het opstartoppervlak dat moet bestaan voordat de Gateway begint te luisteren volledig dekt. In de praktijk betekent dit dat de setup-entry elke kanaaleigen capability moet registreren waarvan opstarten afhankelijk is, zoals:

- kanaalregistratie zelf
- alle HTTP-routes die beschikbaar moeten zijn voordat de Gateway begint te luisteren
- alle Gateway-methoden, tools of services die tijdens datzelfde venster moeten bestaan

Als je volledige entry nog steeds eigenaar is van een vereiste opstart-capability, schakel deze vlag dan niet in. Houd de Plugin op het standaardgedrag en laat OpenClaw de volledige entry tijdens het opstarten laden.

Gebundelde kanalen kunnen ook setup-only helpers voor contractoppervlakken publiceren die core kan raadplegen voordat de volledige kanaalruntime is geladen. Het huidige setup-promotieoppervlak is:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core gebruikt dat oppervlak wanneer het een verouderde single-account-kanaalconfiguratie moet promoveren naar `channels.<id>.accounts.*` zonder de volledige plugin-entry te laden. Matrix is het huidige gebundelde voorbeeld: het verplaatst alleen auth/bootstrap-sleutels naar een benoemd gepromoveerd account wanneer benoemde accounts al bestaan, en het kan een geconfigureerde niet-canonieke standaardaccountsleutel behouden in plaats van altijd `accounts.default` aan te maken.

Die setup-patchadapters houden gebundelde ontdekking van contractoppervlakken lazy. De importtijd blijft licht; het promotieoppervlak wordt pas bij eerste gebruik geladen in plaats van gebundelde kanaalstart opnieuw binnen te gaan bij module-import.

Wanneer die opstartoppervlakken Gateway-RPC-methoden bevatten, houd ze dan op een plugin-specifiek prefix. Core-beheernamespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en resolven altijd naar `operator.admin`, zelfs als een Plugin een nauwere scope aanvraagt.

Voorbeeld:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadata van de kanaalcatalogus

Kanaalplugins kunnen setup-/ontdekkingsmetadata adverteren via `openclaw.channel` en installatietips via `openclaw.install`. Dit houdt de core-catalogus vrij van data.

Voorbeeld:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Nuttige `openclaw.channel`-velden naast het minimale voorbeeld:

- `detailLabel`: secundair label voor rijkere catalogus-/statusoppervlakken
- `docsLabel`: linktekst voor de docs-link overschrijven
- `preferOver`: plugin-/kanaal-id's met lagere prioriteit die deze catalogusentry moet overtreffen
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kopieerinstellingen voor selectieoppervlakken
- `markdownCapable`: markeert het kanaal als markdown-capable voor beslissingen over uitgaande opmaak
- `exposure.configured`: verberg het kanaal van oppervlakken met lijsten van geconfigureerde kanalen wanneer ingesteld op `false`
- `exposure.setup`: verberg het kanaal van interactieve setup-/configure-kiezers wanneer ingesteld op `false`
- `exposure.docs`: markeer het kanaal als intern/privé voor docs-navigatieoppervlakken
- `showConfigured` / `showInSetup`: verouderde aliassen die nog steeds worden geaccepteerd voor compatibiliteit; geef de voorkeur aan `exposure`
- `quickstartAllowFrom`: laat het kanaal deelnemen aan de standaard quickstart-`allowFrom`-flow
- `forceAccountBinding`: vereis expliciete accountbinding, zelfs wanneer er maar één account bestaat
- `preferSessionLookupForAnnounceTarget`: geef de voorkeur aan sessieopzoeking bij het resolven van aankondigingsdoelen

OpenClaw kan ook **externe kanaalcatalogi** samenvoegen (bijvoorbeeld een MPM-registerexport). Plaats een JSON-bestand op een van:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Of wijs `OPENCLAW_PLUGIN_CATALOG_PATHS` (of `OPENCLAW_MPM_CATALOG_PATHS`) naar een of meer JSON-bestanden (gescheiden door komma/puntkomma/`PATH`). Elk bestand moet `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` bevatten. De parser accepteert ook `"packages"` of `"plugins"` als verouderde aliassen voor de sleutel `"entries"`.

Gegenereerde kanaalcatalogusentries en provider-installatiecatalogusentries tonen genormaliseerde install-source-feiten naast het ruwe `openclaw.install`-blok. De genormaliseerde feiten identificeren of de npm-specificatie een exacte versie of zwevende selector is, of verwachte integriteitsmetadata aanwezig is, en of er ook een lokaal bronpad beschikbaar is. Wanneer de catalogus-/pakketidentiteit bekend is, waarschuwen de genormaliseerde feiten als de geparste npm-pakketnaam afwijkt van die identiteit. Ze waarschuwen ook wanneer `defaultChoice` ongeldig is of naar een bron wijst die niet beschikbaar is, en wanneer npm-integriteitsmetadata aanwezig is zonder geldige npm-bron. Consumers moeten `installSource` behandelen als een aanvullend optioneel veld, zodat handgemaakte entries en catalogus-shims het niet hoeven te synthetiseren. Hierdoor kunnen onboarding en diagnostiek de source-plane-status uitleggen zonder pluginruntime te importeren.

Officiële externe npm-entries moeten bij voorkeur een exacte `npmSpec` plus `expectedIntegrity` gebruiken. Kale pakketnamen en dist-tags blijven werken voor compatibiliteit, maar ze tonen source-plane-waarschuwingen zodat de catalogus kan opschuiven naar vastgepinde, op integriteit gecontroleerde installaties zonder bestaande plugins te breken. Wanneer onboarding installeert vanuit een lokaal cataloguspad, registreert het een beheerde plugin-indexentry met `source: "path"` en waar mogelijk een workspace-relatief `sourcePath`. Het absolute operationele laadpad blijft in `plugins.load.paths`; het installatierecord vermijdt het dupliceren van lokale workstation-paden naar langlevende configuratie. Dit houdt lokale ontwikkelinstallaties zichtbaar voor source-plane-diagnostiek zonder een tweede ruw disclosure-oppervlak voor bestandssysteempaden toe te voegen. De gepersisteerde SQLite-rij `installed_plugin_index` is de bron van waarheid voor installatie en kan worden vernieuwd zonder pluginruntime-modules te laden. De `installRecords`-map is duurzaam, zelfs wanneer een pluginmanifest ontbreekt of ongeldig is; de `plugins`-payload is een opnieuw opbouwbare manifestweergave.

## Context-engine-plugins

Context-engine-plugins zijn eigenaar van sessiecontextorkestratie voor ingest, assembly en Compaction. Registreer ze vanuit je Plugin met `api.registerContextEngine(id, factory)` en selecteer vervolgens de actieve engine met `plugins.slots.contextEngine`.

Gebruik dit wanneer je Plugin de standaard contextpipeline moet vervangen of uitbreiden, in plaats van alleen geheugenzoekopdrachten of hooks toe te voegen.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

De factory `ctx` exposeert optionele waarden `config`, `agentDir` en `workspaceDir` voor initialisatie tijdens constructie.

`assemble()` kan `contextProjection` retourneren wanneer de actieve harness een persistente backend-thread heeft. Laat dit weg voor verouderde per-turn-projectie. Retourneer `{ mode: "thread_bootstrap", epoch }` wanneer de samengestelde context één keer in een backend-thread moet worden geïnjecteerd en opnieuw moet worden gebruikt totdat de epoch verandert. Wijzig de epoch nadat de semantische context van de engine verandert, zoals na een engine-eigen Compaction-pass. Hosts kunnen tool-call-metadata, invoervorm en geredigeerde toolresultaten in een thread-bootstrap-projectie behouden, zodat nieuwe backend-threads toolcontinuïteit behouden zonder ruwe payloads met secrets te kopiëren.

Als je engine **niet** eigenaar is van het Compaction-algoritme, houd `compact()` geïmplementeerd en delegeer het expliciet:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Een nieuwe capability toevoegen

Wanneer een Plugin gedrag nodig heeft dat niet in de huidige API past, omzeil het pluginsysteem dan niet met een private reach-in. Voeg de ontbrekende capability toe.

Aanbevolen volgorde:

1. definieer het core-contract
   Bepaal welk gedeeld gedrag core moet bezitten: beleid, fallback, config-merge, lifecycle, kanaalgerichte semantiek en vorm van runtime-helper.
2. voeg getypte pluginregistratie-/runtime-oppervlakken toe
   Breid `OpenClawPluginApi` en/of `api.runtime` uit met het kleinste nuttige getypte capability-oppervlak.
3. sluit core + kanaal-/featureconsumers aan
   Kanalen en feature-plugins moeten de nieuwe capability via core consumeren, niet door rechtstreeks een vendor-implementatie te importeren.
4. registreer vendor-implementaties
   Vendor-plugins registreren vervolgens hun backends tegen de capability.
5. voeg contractdekking toe
   Voeg tests toe zodat eigenaarschap en registratievorm in de loop van de tijd expliciet blijven.

Zo blijft OpenClaw opinionated zonder hardcoded te worden naar het wereldbeeld van één provider. Zie het [Capability Cookbook](/nl/plugins/adding-capabilities) voor een concrete bestandschecklist en uitgewerkt voorbeeld.

### Capability-checklist

Wanneer je een nieuwe capability toevoegt, moet de implementatie meestal deze oppervlakken samen raken:

- core-contracttypen in `src/<capability>/types.ts`
- core-runner/runtime-helper in `src/<capability>/runtime.ts`
- plugin-API-registratieoppervlak in `src/plugins/types.ts`
- pluginregistry-bedrading in `src/plugins/registry.ts`
- pluginruntime-exposure in `src/plugins/runtime/*` wanneer feature-/kanaalplugins het moeten consumeren
- capture-/testhelpers in `src/test-utils/plugin-registration.ts`
- eigenaarschaps-/contractassertions in `src/plugins/contracts/registry.ts`
- operator-/plugin-docs in `docs/`

Als een van die oppervlakken ontbreekt, is dat meestal een teken dat de capability nog niet volledig is geïntegreerd.

### Capability-template

Minimaal patroon:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Contracttestpatroon:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Dat houdt de regel eenvoudig:

- core is eigenaar van het capabilitycontract + orkestratie
- vendor-Plugins zijn eigenaar van vendor-implementaties
- feature-/kanaal-Plugins gebruiken runtime-helpers
- contracttests houden eigenaarschap expliciet

## Gerelateerd

- [Plugin-architectuur](/nl/plugins/architecture) — openbaar capabilitymodel en vormen
- [Plugin SDK-subpaden](/nl/plugins/sdk-subpaths)
- [Plugin SDK-installatie](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
