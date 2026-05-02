---
read_when:
    - Runtimehaken voor providers, kanaallevenscyclus of pakketbundels implementeren
    - Debuggen van de Plugin-laadvolgorde of registerstatus
    - Een nieuwe Plugin-mogelijkheid of contextengine-Plugin toevoegen
summary: 'Interne werking van de Plugin-architectuur: laadpipeline, register, runtime-hooks, HTTP-routes en referentietabellen'
title: Interne werking van de Plugin-architectuur
x-i18n:
    generated_at: "2026-05-02T11:21:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Zie [Plugin-architectuur](/nl/plugins/architecture) voor het publieke capability-model, Plugin-vormen en eigendoms-/uitvoeringscontracten. Deze pagina is de referentie voor de interne werking: laadpipeline, register, runtime-hooks, Gateway-HTTP-routes, importpaden en schematabellen.

## Laadpipeline

Bij het opstarten doet OpenClaw grofweg dit:

1. kandidaat-pluginroots ontdekken
2. native of compatibele bundlemanifests en pakketmetadata lezen
3. onveilige kandidaten afwijzen
4. pluginconfiguratie normaliseren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. voor elke kandidaat bepalen of deze is ingeschakeld
6. ingeschakelde native modules laden: gebouwde gebundelde modules gebruiken een native loader;
   lokale TypeScript-broncode van derden gebruikt de noodfallback Jiti
7. native `register(api)`-hooks aanroepen en registraties verzamelen in het pluginregister
8. het register beschikbaar stellen aan opdrachten/runtime-oppervlakken

<Note>
`activate` is een verouderde alias voor `register` — de loader kiest wat aanwezig is (`def.register ?? def.activate`) en roept dit op hetzelfde punt aan. Alle gebundelde plugins gebruiken `register`; geef voor nieuwe plugins de voorkeur aan `register`.
</Note>

De veiligheidscontroles gebeuren **vóór** runtime-uitvoering. Kandidaten worden geblokkeerd
wanneer de entry buiten de pluginroot valt, het pad world-writable is, of pad-eigendom
verdacht lijkt voor niet-gebundelde plugins.

### Manifest-eerst-gedrag

Het manifest is de control-plane-bron van waarheid. OpenClaw gebruikt het om:

- de plugin te identificeren
- gedeclareerde kanalen/skills/configuratieschema’s of bundle-capabilities te ontdekken
- `plugins.entries.<id>.config` te valideren
- labels/placeholders in de Control UI aan te vullen
- installatie-/catalogusmetadata te tonen
- goedkope activatie- en setupdescriptors te behouden zonder de pluginruntime te laden

Voor native plugins is de runtimemodule het data-plane-deel. Deze registreert
daadwerkelijk gedrag zoals hooks, tools, opdrachten of providerflows.

Optionele manifestblokken `activation` en `setup` blijven op de control plane.
Het zijn metadata-only descriptors voor activatieplanning en setupdetectie;
ze vervangen runtime-registratie, `register(...)` of `setupEntry` niet.
De eerste live activatieconsumenten gebruiken nu manifesthints voor opdrachten, kanalen en providers
om het laden van plugins te beperken vóór bredere materialisatie van het register:

- CLI-laden wordt beperkt tot plugins die eigenaar zijn van de gevraagde primaire opdracht
- kanaalsetup/pluginresolutie wordt beperkt tot plugins die eigenaar zijn van de gevraagde
  kanaal-id
- expliciete providersetup/runtime-resolutie wordt beperkt tot plugins die eigenaar zijn van de gevraagde
  provider-id
- Gateway-opstartplanning gebruikt `activation.onStartup` voor expliciete opstartimports
  en opt-outs bij opstarten; plugins zonder opstartmetadata laden alleen
  via smallere activatietriggers

De activatieplanner biedt zowel een API met alleen ids voor bestaande callers als een
plan-API voor nieuwe diagnostiek. Planvermeldingen rapporteren waarom een plugin is geselecteerd,
waarbij expliciete plannerhints uit `activation.*` worden gescheiden van fallback op basis van manifest-eigendom
zoals `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` en hooks. Die scheiding van redenen is de compatibiliteitsgrens:
bestaande pluginmetadata blijft werken, terwijl nieuwe code brede hints
of fallbackgedrag kan detecteren zonder runtime-laadsemantiek te wijzigen.

Setupdetectie geeft nu de voorkeur aan descriptor-owned ids zoals `setup.providers` en
`setup.cliBackends` om kandidaat-plugins te beperken voordat wordt teruggevallen op
`setup-api` voor plugins die nog runtime-hooks tijdens setup nodig hebben. Providersetuplijsten gebruiken manifest `providerAuthChoices`, uit descriptors afgeleide setupkeuzes
en installatiecatalogusmetadata zonder de providerruntime te laden. Expliciet
`setup.requiresRuntime: false` is een descriptor-only afsluiting; weggelaten
`requiresRuntime` behoudt de verouderde setup-api-fallback voor compatibiliteit. Als meer
dan één ontdekte plugin dezelfde genormaliseerde setupprovider- of CLI-backend-id claimt,
weigert setup-lookup de ambigue eigenaar in plaats van te vertrouwen op
detectievolgorde. Wanneer setupruntime wel wordt uitgevoerd, rapporteert registerdiagnostiek
drift tussen `setup.providers` / `setup.cliBackends` en de providers of CLI-backends die door setup-api zijn geregistreerd zonder verouderde plugins te blokkeren.

### Plugin-cachegrens

OpenClaw cachet plugin-detectieresultaten of directe manifestregistergegevens niet
achter wall-clock-vensters. Installaties, manifestbewerkingen en wijzigingen in laadpaden
moeten zichtbaar worden bij de volgende expliciete metadatalesing of snapshotrebuild.
De manifestbestandparser mag een begrensde bestandssignatuurcache bewaren, gesleuteld op het
geopende manifestpad, inode, grootte en tijdstempels; die cache voorkomt alleen
het opnieuw parsen van ongewijzigde bytes en mag geen detectie-, register-, eigenaar- of
beleidsantwoorden cachen.

Het veilige snelle metadatapad is expliciet objecteigendom, geen verborgen cache.
Gateway-opstarthotpaden moeten de huidige `PluginMetadataSnapshot`, de
afgeleide `PluginLookUpTable` of een expliciet manifestregister door de callchain doorgeven.
Configvalidatie, automatisch inschakelen bij opstarten, plugin-bootstrap en providerselectie
kunnen die objecten hergebruiken zolang ze de huidige config en
plugininventaris vertegenwoordigen. Setup-lookup reconstrueert manifestmetadata nog steeds op aanvraag
tenzij het specifieke setuppad een expliciet manifestregister ontvangt; houd dat
als cold-path-fallback in plaats van verborgen lookup-caches toe te voegen. Wanneer de input
wijzigt, bouw en vervang de snapshot opnieuw in plaats van deze te muteren of
historische kopieën te bewaren.
Views over het actieve pluginregister en bootstraphelpers voor gebundelde kanalen
moeten opnieuw worden berekend vanuit het huidige register/root. Kortlevende maps zijn prima
binnen één call om werk te dedupliceren of reentry te bewaken; ze mogen geen procesmetadata-caches
worden.

Voor het laden van plugins is de persistente cachelaag runtime-laden. Deze mag
loaderstatus hergebruiken wanneer code of geïnstalleerde artefacten daadwerkelijk worden geladen, zoals:

- `PluginLoaderCacheState` en compatibele actieve runtimeregisters
- jiti/modulecaches en public-surface-loadercaches die worden gebruikt om te voorkomen dat
  hetzelfde runtime-oppervlak herhaaldelijk wordt geïmporteerd
- bestandssysteemcaches voor geïnstalleerde pluginartefacten
- kortlevende per-call maps voor padnormalisatie of duplicate-resolutie

Die caches zijn data-plane-implementatiedetails. Ze mogen geen
control-plane-vragen beantwoorden zoals "welke plugin is eigenaar van deze provider?" tenzij de
caller bewust om runtime-laden heeft gevraagd.

Voeg geen persistente of wall-clock-caches toe voor:

- detectieresultaten
- directe manifestregisters
- manifestregisters die opnieuw zijn opgebouwd uit de geïnstalleerde pluginindex
- lookup van provider-eigenaren, modelonderdrukking, providerbeleid of metadata van publieke artefacten
- elk ander uit het manifest afgeleid antwoord waarbij een gewijzigd manifest, geïnstalleerde index
  of laadpad zichtbaar moet zijn bij de volgende metadatalesing

Callers die manifestmetadata opnieuw opbouwen uit de persistente geïnstalleerde pluginindex
reconstrueren dat register op aanvraag. De geïnstalleerde index is duurzame
source-plane-status; het is geen verborgen in-process-metadatacache.

## Registermodel

Geladen plugins muteren niet rechtstreeks willekeurige core-globals. Ze registreren in een
centraal pluginregister.

Het register houdt bij:

- pluginrecords (identiteit, bron, oorsprong, status, diagnostiek)
- tools
- verouderde hooks en getypeerde hooks
- kanalen
- providers
- Gateway-RPC-handlers
- HTTP-routes
- CLI-registrars
- achtergrondservices
- plugin-owned opdrachten

Corefuncties lezen vervolgens uit dat register in plaats van rechtstreeks met pluginmodules
te praten. Dit houdt laden eenrichtingsverkeer:

- pluginmodule -> registerregistratie
- core-runtime -> registerconsumptie

Die scheiding is belangrijk voor onderhoudbaarheid. Het betekent dat de meeste core-oppervlakken slechts
één integratiepunt nodig hebben: "lees het register", niet "special-case elke pluginmodule".

## Callbacks voor gespreksbinding

Plugins die een gesprek binden, kunnen reageren wanneer een goedkeuring is opgelost.

Gebruik `api.onConversationBindingResolved(...)` om een callback te ontvangen nadat een bindverzoek
is goedgekeurd of geweigerd:

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

Velden in de callbackpayload:

- `status`: `"approved"` of `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` of `"deny"`
- `binding`: de opgeloste binding voor goedgekeurde verzoeken
- `request`: de oorspronkelijke verzoekssamenvatting, detach-hint, afzender-id en
  gespreksmetadata

Deze callback is alleen een melding. Hij verandert niet wie een gesprek mag binden,
en hij wordt uitgevoerd nadat de core-goedkeuringsafhandeling is voltooid.

## Providerruntime-hooks

Providerplugins hebben drie lagen:

- **Manifestmetadata** voor goedkope lookup vóór runtime:
  `setup.providers[].envVars`, verouderde compatibiliteit `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` en `channelEnvVars`.
- **Config-time hooks**: `catalog` (verouderd `discovery`) plus
  `applyConfigDefaults`.
- **Runtime-hooks**: meer dan 40 optionele hooks voor auth, modelresolutie,
  stream-wrapping, thinking-levels, replaybeleid en usage-endpoints. Zie
  de volledige lijst onder [Hookvolgorde en gebruik](#hook-order-and-usage).

OpenClaw blijft eigenaar van de generieke agent-loop, failover, transcriptverwerking en
toolbeleid. Deze hooks zijn het extensieoppervlak voor providerspecifiek
gedrag zonder een volledig aangepast inferencetransport nodig te hebben.

Gebruik manifest `setup.providers[].envVars` wanneer de provider env-gebaseerde
credentials heeft die generieke auth-/status-/model-picker-paden moeten zien zonder
de pluginruntime te laden. Verouderde `providerAuthEnvVars` wordt tijdens de
deprecation-periode nog steeds gelezen door de compatibiliteitsadapter, en niet-gebundelde plugins
die dit gebruiken ontvangen een manifestdiagnose. Gebruik manifest `providerAuthAliases`
wanneer één provider-id de env-vars, auth-profielen,
config-backed auth en API-key-onboardingkeuze van een andere provider-id moet hergebruiken. Gebruik manifest
`providerAuthChoices` wanneer onboarding-/auth-choice-CLI-oppervlakken de
choice-id, groeplabels en eenvoudige one-flag-auth-wiring van de provider moeten kennen zonder
de providerruntime te laden. Behoud providerruntime
`envVars` voor operatorgerichte hints zoals onboardinglabels of OAuth
client-id/client-secret-setupvars.

Gebruik manifest `channelEnvVars` wanneer een kanaal env-gedreven auth of setup heeft die
generieke shell-env-fallback, config-/statuscontroles of setupprompts moeten zien
zonder de kanaalruntime te laden.

### Hookvolgorde en gebruik

Voor model-/providerplugins roept OpenClaw hooks in ongeveer deze volgorde aan.
De kolom "Wanneer gebruiken" is de snelle beslisgids.
Compatibility-only providervelden die OpenClaw niet meer aanroept, zoals
`ProviderPlugin.capabilities` en `suppressBuiltInModel`, staan hier bewust niet
vermeld.

| #   | Hook                              | Wat het doet                                                                                                   | Wanneer gebruiken                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Providerconfiguratie publiceren naar `models.providers` tijdens het genereren van `models.json`                                | Provider beheert een catalogus of standaardwaarden voor de basis-URL                                                                                                  |
| 2   | `applyConfigDefaults`             | Door de provider beheerde globale configuratiestandaarden toepassen tijdens configuratiematerialisatie                                      | Standaarden hangen af van auth-modus, env of semantiek van de modelfamilie van de provider                                                                         |
| --  | _(ingebouwde modelzoekactie)_         | OpenClaw probeert eerst het normale registry-/cataloguspad                                                          | _(geen Plugin-hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | Legacy- of previewaliassen voor model-id's normaliseren vóór zoekactie                                                     | Provider beheert aliasopschoning vóór canonieke modelresolutie                                                                                 |
| 4   | `normalizeTransport`              | Providerfamilie-`api` / `baseUrl` normaliseren vóór generieke modelassemblage                                      | Provider beheert transportopschoning voor aangepaste provider-id's in dezelfde transportfamilie                                                          |
| 5   | `normalizeConfig`                 | `models.providers.<id>` normaliseren vóór runtime-/providerresolutie                                           | Provider heeft configuratieopschoning nodig die bij de Plugin hoort; gebundelde helpers voor de Google-familie vangen ook ondersteunde Google-configuratievermeldingen op   |
| 6   | `applyNativeStreamingUsageCompat` | Compat-herschrijvingen voor native streaminggebruik toepassen op configuratieproviders                                               | Provider heeft eindpuntgestuurde metadatafixes voor native streaminggebruik nodig                                                                          |
| 7   | `resolveConfigApiKey`             | Env-marker-auth voor configuratieproviders oplossen vóór laden van runtime-auth                                       | Provider heeft door de provider beheerde API-sleutelresolutie via env-markers; `amazon-bedrock` heeft hier ook een ingebouwde AWS-env-marker-resolver                  |
| 8   | `resolveSyntheticAuth`            | Lokale/zelfgehoste of configuratie-ondersteunde auth beschikbaar maken zonder platte tekst op te slaan                                   | Provider kan werken met een synthetische/lokale credential-marker                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Door de provider beheerde externe auth-profielen eroverheen leggen; standaard `persistence` is `runtime-only` voor CLI-/app-beheerde credentials | Provider hergebruikt externe auth-credentials zonder gekopieerde refresh-tokens op te slaan; declareer `contracts.externalAuthProviders` in het manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Opgeslagen synthetische profielplaatsaanduidingen lager prioriteren dan env-/configuratie-ondersteunde auth                                      | Provider slaat synthetische plaatsaanduidingsprofielen op die geen voorrang mogen krijgen                                                                 |
| 11  | `resolveDynamicModel`             | Synchrone fallback voor door de provider beheerde model-id's die nog niet in het lokale registry staan                                       | Provider accepteert willekeurige upstream model-id's                                                                                                 |
| 12  | `prepareDynamicModel`             | Asynchrone warming-up, daarna draait `resolveDynamicModel` opnieuw                                                           | Provider heeft netwerkmetadata nodig voordat onbekende id's worden opgelost                                                                                  |
| 13  | `normalizeResolvedModel`          | Laatste herschrijving voordat de embedded runner het opgeloste model gebruikt                                               | Provider heeft transportherschrijvingen nodig maar gebruikt nog steeds een kerntransport                                                                             |
| 14  | `contributeResolvedModelCompat`   | Compat-flags bijdragen voor vendormodellen achter een ander compatibel transport                                  | Provider herkent eigen modellen op proxytransports zonder de provider over te nemen                                                       |
| 15  | `normalizeToolSchemas`            | Toolschema's normaliseren voordat de embedded runner ze ziet                                                    | Provider heeft schemaopschoning voor de transportfamilie nodig                                                                                                |
| 16  | `inspectToolSchemas`              | Door de provider beheerde schemadiagnostiek tonen na normalisatie                                                  | Provider wil sleutelwoordwaarschuwingen zonder core providerspecifieke regels te leren                                                                 |
| 17  | `resolveReasoningOutputMode`      | Native versus getagd reasoning-output-contract selecteren                                                              | Provider heeft getagde reasoning/finale output nodig in plaats van native velden                                                                         |
| 18  | `prepareExtraParams`              | Request-parameternormalisatie vóór generieke wrappers voor streamopties                                              | Provider heeft standaard request-parameters of parameteropschoning per provider nodig                                                                           |
| 19  | `createStreamFn`                  | Het normale streampad volledig vervangen door een aangepast transport                                                   | Provider heeft een aangepast wire-protocol nodig, niet alleen een wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Streamwrapper nadat generieke wrappers zijn toegepast                                                              | Provider heeft requestheaders/body/model-compat-wrappers nodig zonder aangepast transport                                                          |
| 21  | `resolveTransportTurnState`       | Native transportheaders of metadata per beurt toevoegen                                                           | Provider wil dat generieke transports provider-native beurtidentiteit verzenden                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Native WebSocket-headers of sessieafkoelbeleid toevoegen                                                    | Provider wil generieke WS-transports sessieheaders of fallbackbeleid laten afstemmen                                                               |
| 23  | `formatApiKey`                    | Auth-profielformatter: opgeslagen profiel wordt de runtime-`apiKey`-tekenreeks                                     | Provider slaat extra auth-metadata op en heeft een aangepaste runtime-tokenvorm nodig                                                                    |
| 24  | `refreshOAuth`                    | OAuth-refresh-override voor aangepaste refresheindpunten of beleid bij refresh-fouten                                  | Provider past niet bij de gedeelde `pi-ai`-refreshers                                                                                           |
| 25  | `buildAuthDoctorHint`             | Reparatietip toegevoegd wanneer OAuth-refresh mislukt                                                                  | Provider heeft door de provider beheerde auth-reparatiebegeleiding nodig na refresh-fout                                                                      |
| 26  | `matchesContextOverflowError`     | Door de provider beheerde matcher voor contextvensteroverloop                                                                 | Provider heeft ruwe overloopfouten die generieke heuristieken zouden missen                                                                                |
| 27  | `classifyFailoverReason`          | Door de provider beheerde classificatie van failoverredenen                                                                  | Provider kan ruwe API-/transportfouten mappen naar rate-limit/overbelasting/enzovoort                                                                          |
| 28  | `isCacheTtlEligible`              | Prompt-cachebeleid voor proxy-/backhaulproviders                                                               | Provider heeft proxyspecifieke cache-TTL-gating nodig                                                                                                |
| 29  | `buildMissingAuthMessage`         | Vervanging voor het generieke herstelbericht bij ontbrekende auth                                                      | Provider heeft een providerspecifieke hersteltip voor ontbrekende auth nodig                                                                                 |
| 30  | `augmentModelCatalog`             | Synthetische/finale catalogusrijen toegevoegd na ontdekking                                                          | Provider heeft synthetische forward-compat-rijen nodig in `models list` en pickers                                                                     |
| 31  | `resolveThinkingProfile`          | Modelspecifieke `/think`-niveauset, weergavelabels en standaardwaarde                                                 | Provider biedt een aangepaste thinking-ladder of binair label voor geselecteerde modellen                                                                 |
| 32  | `isBinaryThinking`                | Compatibiliteitshook voor aan/uit-reasoningtoggle                                                                     | Provider biedt alleen binair thinking aan/uit                                                                                                  |
| 33  | `supportsXHighThinking`           | Compatibiliteitshook voor `xhigh`-reasoningondersteuning                                                                   | Provider wil `xhigh` alleen op een subset van modellen                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Compatibiliteitshook voor standaard `/think`-niveau                                                                      | Provider beheert standaard `/think`-beleid voor een modelfamilie                                                                                      |
| 35  | `isModernModelRef`                | Matcher voor moderne modellen voor liveprofielfilters en smokeselectie                                              | Provider beheert live/smoke-voorkeursmodelmatching                                                                                             |
| 36  | `prepareRuntimeAuth`              | Een geconfigureerde credential omwisselen naar het daadwerkelijke runtime-token/de daadwerkelijke runtime-sleutel vlak vóór inference                       | Provider heeft een tokenuitwisseling of kortlevende request-credential nodig                                                                             |
| 37  | `resolveUsageAuth`                | Gebruiks-/factureringsreferenties voor `/usage` en gerelateerde statusweergaven bepalen                                     | Aanbieder heeft aangepaste tokenverwerking voor gebruik/quota of een andere gebruiksreferentie nodig                                                               |
| 38  | `fetchUsageSnapshot`              | Aanbiederspecifieke momentopnamen van gebruik/quota ophalen en normaliseren nadat auth is bepaald                             | Aanbieder heeft een aanbiederspecifiek gebruikseindpunt of payloadparser nodig                                                                           |
| 39  | `createEmbeddingProvider`         | Een embedding-adapter bouwen die eigendom is van de aanbieder voor geheugen/zoeken                                                     | Gedrag voor geheugen-embeddings hoort bij de aanbieder-Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | Een replaybeleid retourneren dat transcriptverwerking voor de aanbieder beheert                                        | Aanbieder heeft aangepast transcriptbeleid nodig (bijvoorbeeld het verwijderen van thinking-blocks)                                                               |
| 41  | `sanitizeReplayHistory`           | Replaygeschiedenis herschrijven na generieke transcriptopschoning                                                        | Aanbieder heeft aanbiederspecifieke replay-herschrijvingen nodig naast gedeelde compaction-helpers                                                             |
| 42  | `validateReplayTurns`             | Laatste validatie of hervorming van replay-turns vóór de embedded runner                                           | Aanbiedertransport heeft strengere turnvalidatie nodig na generieke opschoning                                                                    |
| 43  | `onModelSelected`                 | Neveneffecten na selectie uitvoeren die eigendom zijn van de aanbieder                                                                 | Aanbieder heeft telemetrie of aanbiederspecifieke status nodig wanneer een model actief wordt                                                                  |

`normalizeModelId`, `normalizeTransport` en `normalizeConfig` controleren eerst de
overeenkomende provider-plugin en vallen daarna terug op andere provider-plugins
met hook-ondersteuning totdat er een daadwerkelijk de model-id of transport/config wijzigt. Daardoor blijven
alias-/compat-provider-shims werken zonder dat de aanroeper hoeft te weten welke
gebundelde plugin de herschrijving bezit. Als geen provider-hook een ondersteunde
Google-family-configuratievermelding herschrijft, past de gebundelde Google-configuratienormalizer nog steeds
die compatibiliteitsopschoning toe.

Als de provider een volledig aangepast wire-protocol of een aangepaste request executor nodig heeft,
is dat een andere klasse uitbreiding. Deze hooks zijn voor provider-gedrag
dat nog steeds op OpenClaw's normale inferentielus draait.

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

Gebundelde provider-plugins combineren de hooks hierboven om aan te sluiten op de catalogus,
authenticatie, thinking, replay en gebruiksbehoeften van elke leverancier. De gezaghebbende hookset staat bij
elke plugin onder `extensions/`; deze pagina illustreert de vormen in plaats van
de lijst te spiegelen.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI registreren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` zodat ze upstream
    model-id's kunnen tonen vóór OpenClaw's statische catalogus.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai koppelen
    `prepareRuntimeAuth` of `formatApiKey` aan `resolveUsageAuth` +
    `fetchUsageSnapshot` om tokenuitwisseling en `/usage`-integratie te beheren.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Gedeelde benoemde families (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) laten providers zich aanmelden voor
    transcriptbeleid via `buildReplayPolicy` in plaats van dat elke plugin
    opschoning opnieuw implementeert.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` en
    `volcengine` registreren alleen `catalog` en gebruiken de gedeelde inferentielus.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta-headers, `/fast` / `serviceTier` en `context1m` bevinden zich binnen de
    publieke `api.ts` / `contract-api.ts`-seam van de Anthropic-plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) in plaats van in
    de generieke SDK.
  </Accordion>
</AccordionGroup>

## Runtime-helpers

Plugins hebben toegang tot geselecteerde core-helpers via `api.runtime`. Voor TTS:

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

- `textToSpeech` retourneert de normale core-TTS-uitvoerpayload voor bestands-/spraaknotitie-oppervlakken.
- Gebruikt de core-configuratie `messages.tts` en providerselectie.
- Retourneert PCM-audiobuffer + samplefrequentie. Plugins moeten hersamplen/encoderen voor providers.
- `listVoices` is optioneel per provider. Gebruik dit voor door leveranciers beheerde stemkiezers of instelflows.
- Stemvermeldingen kunnen rijkere metadata bevatten, zoals locale, gender en persoonlijkheidstags voor providerbewuste kiezers.
- OpenAI en ElevenLabs ondersteunen momenteel telefonie. Microsoft niet.

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

- Houd TTS-beleid, fallback en aflevering van antwoorden in core.
- Gebruik spraakproviders voor door leveranciers beheerd synthese-gedrag.
- Legacy Microsoft `edge`-invoer wordt genormaliseerd naar de provider-id `microsoft`.
- Het voorkeursmodel voor eigenaarschap is bedrijfsgericht: één leveranciersplugin kan
  tekst-, spraak-, beeld- en toekomstige mediaproviders beheren wanneer OpenClaw die
  capaciteitscontracten toevoegt.

Voor begrip van beeld/audio/video registreren plugins één getypeerde
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

- Houd orkestratie, fallback, config en kanaalbedrading in core.
- Houd leveranciersgedrag in de provider-plugin.
- Additieve uitbreiding moet getypeerd blijven: nieuwe optionele methoden, nieuwe optionele
  resultaatvelden, nieuwe optionele capabilities.
- Videogeneratie volgt al hetzelfde patroon:
  - core bezit het capaciteitscontract en de runtime-helper
  - leveranciersplugins registreren `api.registerVideoGenerationProvider(...)`
  - feature-/kanaalplugins gebruiken `api.runtime.videoGeneration.*`

Voor runtime-helpers voor media-understanding kunnen plugins aanroepen:

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
```

Voor audiotranscriptie kunnen plugins de runtime voor media-understanding gebruiken
of de oudere STT-alias:

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
- Gebruikt de core-audioconfiguratie voor media-understanding (`tools.media.audio`) en de fallbackvolgorde voor providers.
- Retourneert `{ text: undefined }` wanneer er geen transcriptie-uitvoer wordt geproduceerd (bijvoorbeeld overgeslagen/niet-ondersteunde invoer).
- `api.runtime.stt.transcribeAudioFile(...)` blijft beschikbaar als compatibiliteitsalias.

Plugins kunnen ook achtergrond-subagent-runs starten via `api.runtime.subagent`:

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

- `provider` en `model` zijn optionele overrides per run, geen blijvende sessiewijzigingen.
- OpenClaw honoreert die override-velden alleen voor vertrouwde aanroepers.
- Voor plugin-beheerde fallback-runs moeten operators zich aanmelden met `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gebruik `plugins.entries.<id>.subagent.allowedModels` om vertrouwde plugins te beperken tot specifieke canonieke `provider/model`-doelen, of `"*"` om elk doel expliciet toe te staan.
- Niet-vertrouwde plugin-subagent-runs werken nog steeds, maar override-verzoeken worden afgewezen in plaats van stilzwijgend terug te vallen.
- Door plugins gemaakte subagent-sessies worden getagd met de id van de aanmakende plugin. Fallback `api.runtime.subagent.deleteSession(...)` mag alleen die beheerde sessies verwijderen; willekeurige sessieverwijdering vereist nog steeds een admin-scoped Gateway-request.

Voor webzoekopdrachten kunnen plugins de gedeelde runtime-helper gebruiken in plaats van
in de bedrading van de agent-tool te grijpen:

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

- Houd providerselectie, credential-resolutie en gedeelde request-semantiek in core.
- Gebruik webzoekproviders voor leveranciersspecifieke zoektransports.
- `api.runtime.webSearch.*` is het aanbevolen gedeelde oppervlak voor feature-/kanaalplugins die zoekgedrag nodig hebben zonder afhankelijk te zijn van de agent-tool-wrapper.

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

- `generate(...)`: genereer een afbeelding met de geconfigureerde providerketen voor beeldgeneratie.
- `listProviders(...)`: vermeld beschikbare providers voor beeldgeneratie en hun capabilities.

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

- `path`: routepad onder de Gateway-HTTP-server.
- `auth`: vereist. Gebruik `"gateway"` om normale Gateway-auth te vereisen, of `"plugin"` voor plugin-beheerde auth/webhook-verificatie.
- `match`: optioneel. `"exact"` (standaard) of `"prefix"`.
- `replaceExisting`: optioneel. Staat dezelfde plugin toe om zijn eigen bestaande routeregistratie te vervangen.
- `handler`: retourneer `true` wanneer de route het request heeft afgehandeld.

Opmerkingen:

- `api.registerHttpHandler(...)` is verwijderd en veroorzaakt een Plugin-laadfout. Gebruik in plaats daarvan `api.registerHttpRoute(...)`.
- Plugin-routes moeten `auth` expliciet declareren.
- Exacte conflicten met `path + match` worden geweigerd, tenzij `replaceExisting: true`, en één Plugin kan de route van een andere Plugin niet vervangen.
- Overlappende routes met verschillende `auth`-niveaus worden geweigerd. Houd `exact`/`prefix`-doorvalketens alleen op hetzelfde auth-niveau.
- `auth: "plugin"`-routes ontvangen **niet** automatisch operator-runtime-scopes. Ze zijn bedoeld voor door de Plugin beheerde webhooks/handtekeningverificatie, niet voor bevoorrechte Gateway-helperaanroepen.
- `auth: "gateway"`-routes worden uitgevoerd binnen een Gateway-aanvraag-runtime-scope, maar die scope is bewust conservatief:
  - gedeeld-geheim bearer-auth (`gateway.auth.mode = "token"` / `"password"`) houdt Plugin-route-runtime-scopes vastgepind op `operator.write`, zelfs als de aanroeper `x-openclaw-scopes` meestuurt
  - vertrouwde HTTP-modi met identiteit (bijvoorbeeld `trusted-proxy` of `gateway.auth.mode = "none"` op een private ingress) respecteren `x-openclaw-scopes` alleen wanneer de header expliciet aanwezig is
  - als `x-openclaw-scopes` ontbreekt bij die Plugin-route-aanvragen met identiteit, valt de runtime-scope terug op `operator.write`
- Praktische regel: ga er niet van uit dat een Plugin-route met gateway-auth een impliciet beheerdersoppervlak is. Als je route gedrag vereist dat alleen voor beheerders is, vereis dan een auth-modus met identiteit en documenteer het expliciete `x-openclaw-scopes`-headercontract.

## Plugin SDK-importpaden

Gebruik smalle SDK-subpaden in plaats van de monolithische `openclaw/plugin-sdk`-rootbarrel
bij het schrijven van nieuwe Plugins. Kernsubpaden:

| Subpad                              | Doel                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitieven voor Plugin-registratie                |
| `openclaw/plugin-sdk/channel-core`  | Helpers voor kanaalinvoer/opbouw                   |
| `openclaw/plugin-sdk/core`          | Algemene gedeelde helpers en overkoepelend contract |
| `openclaw/plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema (`OpenClawSchema`) |

Kanaal-Plugins kiezen uit een familie van smalle koppelvlakken — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` en `channel-actions`. Goedkeuringsgedrag moet worden geconsolideerd
op één `approvalCapability`-contract in plaats van te mengen over niet-gerelateerde
Plugin-velden. Zie [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins).

Runtime- en config-helpers staan onder overeenkomstige gerichte `*-runtime`-subpaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, enz.). Geef de voorkeur aan `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation`
in plaats van de brede compatibiliteitsbarrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
en `openclaw/plugin-sdk/infra-runtime` zijn verouderde compatibiliteitsshims voor
oudere Plugins. Nieuwe code moet in plaats daarvan smallere algemene primitieven importeren.
</Info>

Repo-interne entrypoints (per root van gebundeld Plugin-pakket):

- `index.js` — gebundelde Plugin-entry
- `api.js` — helper/types-barrel
- `runtime-api.js` — runtime-only barrel
- `setup-entry.js` — setup-Plugin-entry

Externe Plugins mogen alleen `openclaw/plugin-sdk/*`-subpaden importeren. Importeer nooit
`src/*` van een ander Plugin-pakket vanuit core of vanuit een andere Plugin.
Via facade geladen entrypoints geven de voorkeur aan de actieve runtime-config-snapshot wanneer die
bestaat, en vallen daarna terug op het opgeloste config-bestand op schijf.

Capaciteitsspecifieke subpaden zoals `image-generation`, `media-understanding`
en `speech` bestaan omdat gebundelde Plugins ze vandaag gebruiken. Het zijn niet
automatisch langetermijn-bevroren externe contracten — controleer de relevante SDK-
referentiepagina wanneer je erop vertrouwt.

## Berichttoolschema's

Plugins moeten kanaalspecifieke `describeMessageTool(...)`-schemabijdragen beheren
voor niet-berichtprimitieven zoals reacties, leesbevestigingen en polls.
Gedeelde verzendpresentatie moet het algemene `MessagePresentation`-contract gebruiken
in plaats van provider-native knop-, component-, blok- of kaartvelden.
Zie [Berichtpresentatie](/nl/plugins/message-presentation) voor het contract,
terugvalregels, providermapping en checklist voor Plugin-auteurs.

Plugins die kunnen verzenden declareren wat ze kunnen renderen via berichtcapaciteiten:

- `presentation` voor semantische presentatieblokken (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` voor aanvragen voor vastgepinde levering

Core beslist of de presentatie native wordt gerenderd of wordt gedegradeerd naar tekst.
Stel geen provider-native UI-ontsnappingsroutes bloot vanuit de algemene berichttool.
Verouderde SDK-helpers voor legacy native schema's blijven geëxporteerd voor bestaande
Plugins van derden, maar nieuwe Plugins moeten ze niet gebruiken.

## Kanaaldoelresolutie

Kanaal-Plugins moeten kanaalspecifieke doelsemantiek beheren. Houd de gedeelde
uitgaande host algemeen en gebruik het messaging-adapteroppervlak voor providerregels:

- `messaging.inferTargetChatType({ to })` beslist of een genormaliseerd doel
  vóór directory-lookup moet worden behandeld als `direct`, `group` of `channel`.
- `messaging.targetResolver.looksLikeId(raw, normalized)` vertelt core of een
  invoer direct naar id-achtige resolutie moet gaan in plaats van directoryzoekactie.
- `messaging.targetResolver.resolveTarget(...)` is de Plugin-terugval wanneer
  core een definitieve provider-eigen resolutie nodig heeft na normalisatie of na een
  directorymisser.
- `messaging.resolveOutboundSessionRoute(...)` beheert provider-specifieke sessie-
  routeconstructie zodra een doel is opgelost.

Aanbevolen verdeling:

- Gebruik `inferTargetChatType` voor categoriebeslissingen die vóór
  het zoeken in peers/groepen moeten plaatsvinden.
- Gebruik `looksLikeId` voor controles van "behandel dit als een expliciet/native doel-id".
- Gebruik `resolveTarget` voor provider-specifieke normalisatieterugval, niet voor
  brede directoryzoekactie.
- Houd provider-native ids zoals chat-ids, thread-ids, JID's, handles en room-
  ids binnen `target`-waarden of provider-specifieke params, niet in algemene SDK-
  velden.

## Config-ondersteunde directories

Plugins die directoryvermeldingen uit config afleiden, moeten die logica in de
Plugin houden en de gedeelde helpers hergebruiken uit
`openclaw/plugin-sdk/directory-runtime`.

Gebruik dit wanneer een kanaal config-ondersteunde peers/groepen nodig heeft, zoals:

- door allowlist aangestuurde DM-peers
- geconfigureerde kanaal-/groepmappen
- account-scoped statische directoryterugvallen

De gedeelde helpers in `directory-runtime` verwerken alleen algemene bewerkingen:

- queryfiltering
- limiettoepassing
- helpers voor deduplicatie/normalisatie
- opbouw van `ChannelDirectoryEntry[]`

Kanaalspecifieke accountinspectie en id-normalisatie moeten in de
Plugin-implementatie blijven.

## Providercatalogi

Provider-Plugins kunnen modelcatalogi voor inferentie definiëren met
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retourneert dezelfde vorm die OpenClaw schrijft naar
`models.providers`:

- `{ provider }` voor één providervermelding
- `{ providers }` voor meerdere providervermeldingen

Gebruik `catalog` wanneer de Plugin provider-specifieke model-ids, base URL-
standaarden of auth-afgeschermde modelmetadata beheert.

`catalog.order` bepaalt wanneer de catalogus van een Plugin wordt samengevoegd ten opzichte van OpenClaw's
ingebouwde impliciete providers:

- `simple`: gewone API-key- of env-gestuurde providers
- `profile`: providers die verschijnen wanneer auth-profielen bestaan
- `paired`: providers die meerdere gerelateerde providervermeldingen synthetiseren
- `late`: laatste ronde, na andere impliciete providers

Latere providers winnen bij key-collision, zodat Plugins bewust een ingebouwde
providervermelding met hetzelfde provider-id kunnen overschrijven.

Compatibiliteit:

- `discovery` werkt nog steeds als legacy alias
- als zowel `catalog` als `discovery` zijn geregistreerd, gebruikt OpenClaw `catalog`

## Alleen-lezen kanaalinspectie

Als je Plugin een kanaal registreert, implementeer dan bij voorkeur
`plugin.config.inspectAccount(cfg, accountId)` naast `resolveAccount(...)`.

Waarom:

- `resolveAccount(...)` is het runtime-pad. Het mag aannemen dat referenties
  volledig gematerialiseerd zijn en snel falen wanneer vereiste secrets ontbreken.
- Alleen-lezen commandopaden zoals `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` en doctor/config-
  reparatiestromen zouden geen runtime-referenties hoeven te materialiseren alleen om
  configuratie te beschrijven.

Aanbevolen gedrag voor `inspectAccount(...)`:

- Retourneer alleen beschrijvende accountstatus.
- Behoud `enabled` en `configured`.
- Neem velden voor referentiebron/status op wanneer relevant, zoals:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Je hoeft geen ruwe tokenwaarden te retourneren alleen om alleen-lezen
  beschikbaarheid te rapporteren. `tokenStatus: "available"` retourneren (en het bijbehorende bron-
  veld) is genoeg voor statusachtige commands.
- Gebruik `configured_unavailable` wanneer een referentie via SecretRef is geconfigureerd maar
  niet beschikbaar is in het huidige commandopad.

Hierdoor kunnen alleen-lezen commands "geconfigureerd maar niet beschikbaar in dit commandopad"
rapporteren in plaats van te crashen of het account onterecht als niet geconfigureerd te melden.

## Pakketbundels

Een Plugin-directory kan een `package.json` met `openclaw.extensions` bevatten:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Elke entry wordt een Plugin. Als de bundel meerdere extensions vermeldt, wordt het Plugin-id
`name/<fileBase>`.

Als je Plugin npm-deps importeert, installeer ze dan in die directory zodat
`node_modules` beschikbaar is (`npm install` / `pnpm install`).

Beveiligingsvangrail: elke `openclaw.extensions`-entry moet na symlinkresolutie binnen de Plugin-
directory blijven. Entries die buiten de pakketdirectory vallen, worden
geweigerd.

Beveiligingsopmerking: `openclaw plugins install` installeert Plugin-afhankelijkheden met een
project-lokale `npm install --omit=dev --ignore-scripts` (geen lifecycle-scripts,
geen dev-afhankelijkheden tijdens runtime), waarbij overgenomen globale npm-installatie-instellingen worden genegeerd.
Houd Plugin-afhankelijkheidsbomen "pure JS/TS" en vermijd pakketten die
`postinstall`-builds vereisen.

Optioneel: `openclaw.setupEntry` kan wijzen naar een lichte setup-only module.
Wanneer OpenClaw setup-oppervlakken nodig heeft voor een uitgeschakelde kanaal-Plugin, of
wanneer een kanaal-Plugin is ingeschakeld maar nog niet geconfigureerd, laadt het `setupEntry`
in plaats van de volledige Plugin-entry. Dit houdt startup en setup lichter
wanneer je hoofd-Plugin-entry ook tools, hooks of andere runtime-only
code bedraadt.

Optioneel: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kan een kanaal-Plugin laten kiezen voor hetzelfde `setupEntry`-pad tijdens de
pre-listen startup-fase van de gateway, zelfs wanneer het kanaal al geconfigureerd is.

Gebruik dit alleen wanneer `setupEntry` volledig het startup-oppervlak dekt dat moet bestaan
voordat de Gateway begint te luisteren. In de praktijk betekent dit dat de setup-entry
elke kanaal-eigen capaciteit moet registreren waarvan startup afhankelijk is, zoals:

- kanaalregistratie zelf
- alle HTTP-routes die beschikbaar moeten zijn voordat de Gateway begint te luisteren
- alle gateway-methoden, tools of services die tijdens datzelfde venster moeten bestaan

Als je volledige entry nog steeds een vereiste startup-capaciteit beheert, schakel
deze vlag dan niet in. Houd de Plugin op het standaardgedrag en laat OpenClaw de
volledige entry laden tijdens startup.

Gebundelde kanalen kunnen ook setup-only helpers voor contractoppervlakken publiceren die core
kan raadplegen voordat de volledige kanaal-runtime is geladen. Het huidige setup-
promotieoppervlak is:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core gebruikt dit oppervlak wanneer het een verouderde single-account-kanaalconfiguratie
moet promoveren naar `channels.<id>.accounts.*` zonder de volledige plugin-entry te laden.
Matrix is het huidige meegeleverde voorbeeld: het verplaatst alleen auth/bootstrap-sleutels naar een
benoemde gepromoveerde account wanneer benoemde accounts al bestaan, en het kan een
geconfigureerde niet-canonieke default-account-sleutel behouden in plaats van altijd
`accounts.default` te maken.

Die setup-patchadapters houden ontdekking van het meegeleverde contractoppervlak lazy. De
importtijd blijft licht; het promotieoppervlak wordt alleen bij het eerste gebruik geladen in plaats van
opnieuw de meegeleverde kanaalstart binnen te gaan bij module-import.

Wanneer die startoppervlakken Gateway-RPC-methoden bevatten, houd ze dan op een
plugin-specifieke prefix. Core-adminnamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd
omgezet naar `operator.admin`, zelfs als een plugin om een beperktere scope vraagt.

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

### Metagegevens van de kanaalcatalogus

Kanaalplugins kunnen setup-/ontdekkingsmetagegevens adverteren via `openclaw.channel` en
installatiehints via `openclaw.install`. Dit houdt de core-catalogus vrij van data.

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
- `docsLabel`: overschrijf de linktekst voor de docs-link
- `preferOver`: plugin-/kanaal-id's met lagere prioriteit die deze catalogus-entry moet overtreffen
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kopieerbesturing voor selectieoppervlakken
- `markdownCapable`: markeert het kanaal als markdown-capabel voor beslissingen over uitgaande opmaak
- `exposure.configured`: verberg het kanaal van geconfigureerde kanaallijstoppervlakken wanneer ingesteld op `false`
- `exposure.setup`: verberg het kanaal van interactieve setup-/configuratiepickers wanneer ingesteld op `false`
- `exposure.docs`: markeer het kanaal als intern/privé voor docs-navigatieoppervlakken
- `showConfigured` / `showInSetup`: verouderde aliassen die nog worden geaccepteerd voor compatibiliteit; geef de voorkeur aan `exposure`
- `quickstartAllowFrom`: laat het kanaal deelnemen aan de standaard quickstart-`allowFrom`-flow
- `forceAccountBinding`: vereis expliciete accountbinding, zelfs wanneer er maar één account bestaat
- `preferSessionLookupForAnnounceTarget`: geef de voorkeur aan sessieopzoeking bij het oplossen van aankondigingsdoelen

OpenClaw kan ook **externe kanaalcatalogi** samenvoegen (bijvoorbeeld een MPM-
registry-export). Plaats een JSON-bestand op een van:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Of wijs `OPENCLAW_PLUGIN_CATALOG_PATHS` (of `OPENCLAW_MPM_CATALOG_PATHS`) naar
een of meer JSON-bestanden (gescheiden door komma's/puntkomma's/`PATH`). Elk bestand moet
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` bevatten. De parser accepteert ook `"packages"` of `"plugins"` als verouderde aliassen voor de sleutel `"entries"`.

Gegenereerde kanaalcatalogus-entry's en provider-installatiecatalogus-entry's tonen
genormaliseerde install-source-feiten naast het ruwe `openclaw.install`-blok. De
genormaliseerde feiten geven aan of de npm-specificatie een exacte versie of floating
selector is, of verwachte integriteitsmetagegevens aanwezig zijn en of er ook een lokaal
bronpad beschikbaar is. Wanneer de catalogus-/pakketidentiteit bekend is, waarschuwen de
genormaliseerde feiten als de geparste npm-pakketnaam afwijkt van die identiteit.
Ze waarschuwen ook wanneer `defaultChoice` ongeldig is of naar een bron wijst die
niet beschikbaar is, en wanneer npm-integriteitsmetagegevens aanwezig zijn zonder een geldige npm-
bron. Consumers moeten `installSource` behandelen als een additief optioneel veld, zodat
handmatig gebouwde entry's en catalogus-shims het niet hoeven te synthetiseren.
Hierdoor kunnen onboarding en diagnostiek de source-plane-status uitleggen zonder
plugin-runtime te importeren.

Officiële externe npm-entry's moeten bij voorkeur een exacte `npmSpec` plus
`expectedIntegrity` gebruiken. Kale pakketnamen en dist-tags blijven werken voor
compatibiliteit, maar ze tonen source-plane-waarschuwingen zodat de catalogus kan opschuiven
naar gepinde, op integriteit gecontroleerde installaties zonder bestaande plugins te breken.
Wanneer onboarding installeert vanuit een lokaal cataloguspad, registreert het een beheerde plugin-
pluginindex-entry met `source: "path"` en waar mogelijk een workspace-relatief
`sourcePath`. Het absolute operationele laadpad blijft in
`plugins.load.paths`; het installatierecord voorkomt dat lokale werkstationpaden worden gedupliceerd
naar langlevende configuratie. Dit houdt lokale ontwikkelingsinstallaties zichtbaar voor
source-plane-diagnostiek zonder een tweede ruw disclosure-oppervlak voor bestandssysteempaden
toe te voegen. De blijvend opgeslagen pluginindex `plugins/installs.json` is de install
source of truth en kan worden vernieuwd zonder plugin-runtime-modules te laden.
De map `installRecords` is duurzaam, zelfs wanneer een pluginmanifest ontbreekt of
ongeldig is; de array `plugins` is een opnieuw opbouwbare manifestweergave.

## Context-engineplugins

Context-engineplugins zijn eigenaar van sessiecontextorkestratie voor opname, assemblage
en Compaction. Registreer ze vanuit je plugin met
`api.registerContextEngine(id, factory)`, en selecteer daarna de actieve engine met
`plugins.slots.contextEngine`.

Gebruik dit wanneer je plugin de standaardcontextpipeline moet vervangen of uitbreiden,
in plaats van alleen geheugenzzoekopdrachten of hooks toe te voegen.

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

De factory `ctx` stelt optionele waarden `config`, `agentDir` en `workspaceDir`
beschikbaar voor initialisatie tijdens constructie.

Als je engine **niet** eigenaar is van het Compaction-algoritme, houd `compact()`
geïmplementeerd en delegeer het expliciet:

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

Wanneer een plugin gedrag nodig heeft dat niet in de huidige API past, omzeil dan niet
het pluginsysteem met een private reach-in. Voeg de ontbrekende capability toe.

Aanbevolen volgorde:

1. definieer het core-contract
   Bepaal welk gedeeld gedrag de core moet bezitten: beleid, fallback, configuratiesamenvoeging,
   lifecycle, kanaalgerichte semantiek en de vorm van runtime-helpers.
2. voeg getypeerde pluginregistratie-/runtime-oppervlakken toe
   Breid `OpenClawPluginApi` en/of `api.runtime` uit met het kleinste nuttige
   getypeerde capability-oppervlak.
3. verbind core + kanaal-/feature-consumers
   Kanalen en featureplugins moeten de nieuwe capability via core consumeren,
   niet door rechtstreeks een vendor-implementatie te importeren.
4. registreer vendor-implementaties
   Vendorplugins registreren daarna hun backends tegen de capability.
5. voeg contractdekking toe
   Voeg tests toe zodat eigenaarschap en registratievorm in de loop van de tijd expliciet blijven.

Zo blijft OpenClaw uitgesproken zonder hardcoded te worden naar het wereldbeeld
van één provider. Zie het [Capability Cookbook](/nl/plugins/architecture)
voor een concrete bestandschecklist en een uitgewerkt voorbeeld.

### Capability-checklist

Wanneer je een nieuwe capability toevoegt, moet de implementatie meestal deze
oppervlakken samen raken:

- core-contracttypen in `src/<capability>/types.ts`
- core-runner/runtime-helper in `src/<capability>/runtime.ts`
- plugin-API-registratieoppervlak in `src/plugins/types.ts`
- bedrading van pluginregistry in `src/plugins/registry.ts`
- plugin-runtimeblootstelling in `src/plugins/runtime/*` wanneer feature-/kanaalplugins
  deze moeten consumeren
- capture-/testhelpers in `src/test-utils/plugin-registration.ts`
- eigenaarschaps-/contractasserties in `src/plugins/contracts/registry.ts`
- operator-/plugindocs in `docs/`

Als een van die oppervlakken ontbreekt, is dat meestal een teken dat de capability
nog niet volledig is geïntegreerd.

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

- core bezit het capability-contract + de orkestratie
- vendorplugins bezitten vendor-implementaties
- feature-/kanaalplugins consumeren runtime-helpers
- contracttests houden eigenaarschap expliciet

## Gerelateerd

- [Pluginarchitectuur](/nl/plugins/architecture) — openbaar capability-model en vormen
- [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths)
- [Plugin-SDK-setup](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
