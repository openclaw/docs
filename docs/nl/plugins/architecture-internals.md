---
read_when:
    - Runtimehooks voor providers, kanaallevenscyclus of pakketbundels implementeren
    - Plugin-laadvolgorde of registerstatus debuggen
    - Een nieuwe Plugin-mogelijkheid of contextengine-Plugin toevoegen
summary: 'Interne werking van de Plugin-architectuur: laadpipeline, register, runtime-hooks, HTTP-routes en referentietabellen'
title: Interne werking van de Plugin-architectuur
x-i18n:
    generated_at: "2026-04-29T23:01:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Voor het publieke capaciteitsmodel, Plugin-vormen en eigendoms-/uitvoeringscontracten, zie [Plugin-architectuur](/nl/plugins/architecture). Deze pagina is de referentie voor de interne werking: laadpijplijn, register, runtimehooks, Gateway HTTP-routes, importpaden en schematabellen.

## Laadpijplijn

Bij het opstarten doet OpenClaw grofweg dit:

1. kandidaat-Plugin-roots ontdekken
2. native of compatibele bundlemanifests en pakketmetadata lezen
3. onveilige kandidaten weigeren
4. Plugin-configuratie normaliseren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. inschakeling voor elke kandidaat bepalen
6. ingeschakelde native modules laden: gebouwde gebundelde modules gebruiken een native loader;
   niet-gebouwde native Plugins gebruiken jiti
7. native `register(api)`-hooks aanroepen en registraties verzamelen in het Plugin-register
8. het register beschikbaar maken voor opdrachten/runtime-oppervlakken

<Note>
`activate` is een legacy-alias voor `register` — de loader lost op welke aanwezig is (`def.register ?? def.activate`) en roept die op hetzelfde moment aan. Alle gebundelde Plugins gebruiken `register`; geef voor nieuwe Plugins de voorkeur aan `register`.
</Note>

De veiligheidscontroles gebeuren **vóór** runtime-uitvoering. Kandidaten worden geblokkeerd
wanneer de entry buiten de Plugin-root komt, het pad world-writable is, of padeigenaarschap
verdacht lijkt voor niet-gebundelde Plugins.

### Manifest-eerst-gedrag

Het manifest is de control-plane-bron van waarheid. OpenClaw gebruikt het om:

- de Plugin te identificeren
- gedeclareerde kanalen/Skills/configuratieschema's of bundlecapaciteiten te ontdekken
- `plugins.entries.<id>.config` te valideren
- Control UI-labels/placeholders aan te vullen
- installatie-/catalogusmetadata te tonen
- goedkope activatie- en setupbeschrijvingen te bewaren zonder de Plugin-runtime te laden

Voor native Plugins is de runtimemodule het data-plane-deel. Die registreert
daadwerkelijk gedrag zoals hooks, tools, opdrachten of providerflows.

Optionele manifestblokken `activation` en `setup` blijven op de control plane.
Het zijn metadata-only beschrijvingen voor activatieplanning en setupontdekking;
ze vervangen runtimeregistratie, `register(...)` of `setupEntry` niet.
De eerste live activatieconsumenten gebruiken nu manifesthints voor opdrachten, kanalen en providers
om het laden van Plugins te beperken vóór bredere registermaterialisatie:

- CLI-laden beperkt zich tot Plugins die eigenaar zijn van de gevraagde primaire opdracht
- kanaalsetup/Plugin-resolutie beperkt zich tot Plugins die eigenaar zijn van de gevraagde
  kanaal-id
- expliciete provider-setup/runtime-resolutie beperkt zich tot Plugins die eigenaar zijn van de
  gevraagde provider-id
- Gateway-opstartplanning gebruikt `activation.onStartup` voor expliciete opstartimports
  en opstart-opt-outs; elke Plugin zou dit moeten declareren naarmate OpenClaw
  afstapt van impliciete opstartimports, terwijl Plugins zonder statische
  capaciteitsmetadata en zonder `activation.onStartup` nog steeds de
  verouderde impliciete opstart-sidecar-fallback gebruiken voor compatibiliteit

De activatieplanner stelt zowel een alleen-id's-API voor bestaande callers als een
plan-API voor nieuwe diagnostiek beschikbaar. Planvermeldingen rapporteren waarom een Plugin is geselecteerd,
waarbij expliciete `activation.*`-plannerhints worden gescheiden van fallback op basis van manifest-eigenaarschap
zoals `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` en hooks. Die scheiding van redenen is de compatibiliteitsgrens:
bestaande Plugin-metadata blijft werken, terwijl nieuwe code brede hints
of fallbackgedrag kan detecteren zonder runtime-laadsemantiek te wijzigen.

Setupontdekking geeft nu de voorkeur aan descriptor-eigen id's zoals `setup.providers` en
`setup.cliBackends` om kandidaat-Plugins te beperken voordat wordt teruggevallen op
`setup-api` voor Plugins die nog setup-time runtimehooks nodig hebben. Provider-
setuplijsten gebruiken manifest `providerAuthChoices`, descriptor-afgeleide setupkeuzes
en installatiecatalogusmetadata zonder de provider-runtime te laden. Expliciete
`setup.requiresRuntime: false` is een descriptor-only afkapping; weggelaten
`requiresRuntime` behoudt de legacy `setup-api`-fallback voor compatibiliteit. Als meer
dan één ontdekte Plugin dezelfde genormaliseerde setup-provider of CLI-backend-id claimt,
weigert setup-lookup de ambigue eigenaar in plaats van op ontdekkingsvolgorde te vertrouwen.
Wanneer setup-runtime wel wordt uitgevoerd, rapporteert registerdiagnostiek drift tussen
`setup.providers` / `setup.cliBackends` en de providers of CLI-backends die door
setup-api zijn geregistreerd, zonder legacy Plugins te blokkeren.

### Plugin-cachegrens

OpenClaw cachet geen Plugin-ontdekkingsresultaten of directe manifestregisterdata
achter wall-clock-vensters. Installaties, manifestbewerkingen en wijzigingen in laadpaden
moeten zichtbaar worden bij de volgende expliciete metadatalezing of snapshot-rebuild.
De manifestbestandparser mag een begrensde bestandssignatuurcache bijhouden, gesleuteld op het
geopende manifestpad, inode, grootte en timestamps; die cache voorkomt alleen
het opnieuw parsen van onveranderde bytes en mag geen ontdekkings-, register-, eigenaar- of
beleidsantwoorden cachen.

Het veilige metadata-snelpad is expliciet objecteigenaarschap, geen verborgen cache.
Gateway-opstart-hot paths zouden de huidige `PluginMetadataSnapshot`, de
afgeleide `PluginLookUpTable` of een expliciet manifestregister door de call chain moeten doorgeven.
Configuratievalidatie, automatisch inschakelen bij opstarten, Plugin-bootstrap en providerselectie
kunnen die objecten hergebruiken zolang ze de huidige configuratie en
Plugin-inventaris vertegenwoordigen. Setup-lookup reconstrueert manifestmetadata nog steeds op aanvraag,
tenzij het specifieke setuppad een expliciet manifestregister ontvangt; houd dat
als cold-path-fallback in plaats van verborgen lookupcaches toe te voegen. Wanneer de input
verandert, bouw de snapshot opnieuw op en vervang die in plaats van deze te muteren of
historische kopieën te bewaren.
Views over het actieve Plugin-register en gebundelde kanaalbootstraphelpers
moeten opnieuw worden berekend vanuit het huidige register/de huidige root. Kortlevende maps zijn prima
binnen één aanroep om werk te dedupliceren of herintrede te bewaken; ze mogen geen proces-
metadatacaches worden.

Voor Plugin-laden is de persistente cachelaag runtime-laden. Die mag
loaderstatus hergebruiken wanneer code of geïnstalleerde artefacten daadwerkelijk worden geladen, zoals:

- `PluginLoaderCacheState` en compatibele actieve runtimeregisters
- jiti/modulecaches en public-surface-loadercaches die worden gebruikt om te voorkomen dat
  hetzelfde runtime-oppervlak herhaaldelijk wordt geïmporteerd
- runtime-afhankelijkheidsspiegels en bestandssysteemcaches voor geïnstalleerde Plugin-
  artefacten
- kortlevende per-aanroep-maps voor padnormalisatie of dubbele resolutie

Die caches zijn data-plane-implementatiedetails. Ze mogen geen control-plane-vragen beantwoorden
zoals "welke Plugin is eigenaar van deze provider?", tenzij de caller bewust om runtime-laden heeft gevraagd.

Voeg geen persistente of wall-clock-caches toe voor:

- ontdekkingsresultaten
- directe manifestregisters
- manifestregisters die zijn gereconstrueerd uit de geïnstalleerde Plugin-index
- lookup van providereigenaar, modelonderdrukking, providerbeleid of metadata voor publieke artefacten
- enig ander manifest-afgeleid antwoord waarbij een gewijzigd manifest, geïnstalleerde index
  of laadpad zichtbaar zou moeten zijn bij de volgende metadatalezing

Callers die manifestmetadata opnieuw opbouwen vanuit de gepersisteerde geïnstalleerde Plugin-
index reconstrueren dat register op aanvraag. De geïnstalleerde index is duurzame
source-plane-status; het is geen verborgen in-process metadatacache.

## Registermodel

Geladen Plugins muteren niet direct willekeurige globale core-status. Ze registreren in een
centraal Plugin-register.

Het register houdt bij:

- Plugin-records (identiteit, bron, oorsprong, status, diagnostiek)
- tools
- legacy hooks en getypeerde hooks
- kanalen
- providers
- Gateway RPC-handlers
- HTTP-routes
- CLI-registrars
- achtergrondservices
- Plugin-eigen opdrachten

Corefuncties lezen vervolgens uit dat register in plaats van direct met Plugin-modules
te praten. Dit houdt laden eenrichtingsverkeer:

- Plugin-module -> registerregistratie
- core-runtime -> registerconsumptie

Die scheiding is belangrijk voor onderhoudbaarheid. Het betekent dat de meeste core-oppervlakken maar
één integratiepunt nodig hebben: "lees het register", niet "maak voor elke Plugin-
module een speciaal geval".

## Conversatiebindingscallbacks

Plugins die een conversatie binden, kunnen reageren wanneer een goedkeuring is opgelost.

Gebruik `api.onConversationBindingResolved(...)` om een callback te ontvangen nadat een bind-
verzoek is goedgekeurd of geweigerd:

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
- `binding`: de opgeloste binding voor goedgekeurde verzoeken
- `request`: de oorspronkelijke verzoeksamenvatting, detach-hint, afzender-id en
  conversatiemetadata

Deze callback is alleen een melding. Hij verandert niet wie een conversatie mag binden,
en hij wordt uitgevoerd nadat core-goedkeuringsafhandeling is afgerond.

## Provider-runtimehooks

Provider-Plugins hebben drie lagen:

- **Manifestmetadata** voor goedkope pre-runtime lookup:
  `setup.providers[].envVars`, verouderde compatibiliteit `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` en `channelEnvVars`.
- **Config-time hooks**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`.
- **Runtimehooks**: meer dan 40 optionele hooks voor auth, modelresolutie,
  stream-wrapping, denkniveaus, replaybeleid en gebruiksendpoints. Zie
  de volledige lijst onder [Hookvolgorde en gebruik](#hook-order-and-usage).

OpenClaw blijft eigenaar van de generieke agentlus, failover, transcriptverwerking en
toolbeleid. Deze hooks zijn het extensieoppervlak voor providerspecifiek
gedrag zonder dat een volledig aangepast inferentietransport nodig is.

Gebruik manifest `setup.providers[].envVars` wanneer de provider env-gebaseerde
referenties heeft die generieke auth-/status-/modelkiezerpaden moeten zien zonder
de Plugin-runtime te laden. Verouderde `providerAuthEnvVars` wordt tijdens de
deprecatievenster nog steeds gelezen door de compatibiliteitsadapter, en niet-gebundelde Plugins
die dit gebruiken krijgen een manifestdiagnose. Gebruik manifest `providerAuthAliases`
wanneer één provider-id de env-vars, authprofielen,
config-backed auth en API-key-onboardingkeuze van een andere provider-id moet hergebruiken. Gebruik manifest
`providerAuthChoices` wanneer onboarding-/auth-keuze-CLI-oppervlakken de
keuze-id van de provider, groepslabels en eenvoudige één-vlag-authbedrading moeten kennen zonder
de provider-runtime te laden. Houd provider-runtime
`envVars` voor operatorgerichte hints zoals onboardinglabels of OAuth
client-id/client-secret-setupvars.

Gebruik manifest `channelEnvVars` wanneer een kanaal env-gedreven auth of setup heeft die
generieke shell-env-fallback, config-/statuscontroles of setupprompts moeten zien
zonder de kanaalruntime te laden.

### Hookvolgorde en gebruik

Voor model-/provider-Plugins roept OpenClaw hooks in ongeveer deze volgorde aan.
De kolom "Wanneer te gebruiken" is de snelle beslisgids.
Compatibiliteits-only providervelden die OpenClaw niet langer aanroept, zoals
`ProviderPlugin.capabilities` en `suppressBuiltInModel`, worden hier bewust niet
vermeld.

| #   | Koppelpunt                        | Wat het doet                                                                                                  | Wanneer te gebruiken                                                                                                                          |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publiceer providerconfiguratie naar `models.providers` tijdens het genereren van `models.json`                | Provider beheert een catalogus of standaardwaarden voor basis-URL                                                                             |
| 2   | `applyConfigDefaults`             | Pas algemene standaardconfiguratie van de provider toe tijdens configuratiematerialisatie                      | Standaardwaarden hangen af van auth-modus, env of semantics van de providermodel-familie                                                      |
| --  | _(ingebouwde modelopzoeking)_      | OpenClaw probeert eerst het normale register-/cataloguspad                                                    | _(geen Plugin-hook)_                                                                                                                          |
| 3   | `normalizeModelId`                | Normaliseer legacy- of preview-model-id-aliassen vóór opzoeking                                               | Provider beheert aliasopschoning vóór canonieke modelresolutie                                                                                |
| 4   | `normalizeTransport`              | Normaliseer providerfamilie-`api` / `baseUrl` vóór generieke modelsamenstelling                               | Provider beheert transportopschoning voor aangepaste provider-id's in dezelfde transportfamilie                                               |
| 5   | `normalizeConfig`                 | Normaliseer `models.providers.<id>` vóór runtime-/providerresolutie                                           | Provider heeft configuratieopschoning nodig die bij de Plugin hoort; gebundelde Google-familiehelpers ondersteunen ook ondersteunde Google-configuratie-items |
| 6   | `applyNativeStreamingUsageCompat` | Pas compat-herschrijvingen voor native streaminggebruik toe op configuratieproviders                          | Provider heeft endpoint-gestuurde fixes voor metadata van native streaminggebruik nodig                                                       |
| 7   | `resolveConfigApiKey`             | Los env-marker-auth op voor configuratieproviders vóór laden van runtime-auth                                 | Provider heeft provider-eigen env-marker-API-sleutelresolutie; `amazon-bedrock` heeft hier ook een ingebouwde AWS env-marker-resolver         |
| 8   | `resolveSyntheticAuth`            | Toon lokale/zelfgehoste of configuratiegebaseerde auth zonder plaintext blijvend op te slaan                  | Provider kan werken met een synthetische/lokale credential-marker                                                                             |
| 9   | `resolveExternalAuthProfiles`     | Leg provider-eigen externe auth-profielen over elkaar; standaard `persistence` is `runtime-only` voor CLI-/app-eigen creds | Provider hergebruikt externe auth-credentials zonder gekopieerde refresh-tokens blijvend op te slaan; declareer `contracts.externalAuthProviders` in het manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Verlaag opgeslagen synthetische profielplaceholders achter env-/configuratiegebaseerde auth                   | Provider slaat synthetische placeholderprofielen op die geen voorrang mogen krijgen                                                           |
| 11  | `resolveDynamicModel`             | Synchrone fallback voor provider-eigen model-id's die nog niet in het lokale register staan                   | Provider accepteert willekeurige upstream model-id's                                                                                          |
| 12  | `prepareDynamicModel`             | Asynchrone warming-up, daarna draait `resolveDynamicModel` opnieuw                                            | Provider heeft netwerkmetadata nodig voordat onbekende id's worden opgelost                                                                   |
| 13  | `normalizeResolvedModel`          | Laatste herschrijving voordat de ingesloten runner het opgeloste model gebruikt                               | Provider heeft transportherschrijvingen nodig maar gebruikt nog steeds een kerntransport                                                      |
| 14  | `contributeResolvedModelCompat`   | Draag compat-flags bij voor vendormodellen achter een ander compatibel transport                              | Provider herkent zijn eigen modellen op proxytransports zonder de provider over te nemen                                                      |
| 15  | `normalizeToolSchemas`            | Normaliseer toolschema's voordat de ingesloten runner ze ziet                                                 | Provider heeft schemaopschoning voor de transportfamilie nodig                                                                                |
| 16  | `inspectToolSchemas`              | Toon provider-eigen schemadiagnostiek na normalisatie                                                         | Provider wil trefwoordwaarschuwingen zonder core providerspecifieke regels te leren                                                           |
| 17  | `resolveReasoningOutputMode`      | Selecteer native versus gelabeld contract voor reasoning-uitvoer                                              | Provider heeft gelabelde reasoning-/einduitvoer nodig in plaats van native velden                                                             |
| 18  | `prepareExtraParams`              | Normalisatie van request-parameters vóór generieke stream-optie-wrappers                                      | Provider heeft standaardrequestparameters of opschoning per providerparameter nodig                                                           |
| 19  | `createStreamFn`                  | Vervang het normale streampad volledig door een aangepast transport                                           | Provider heeft een aangepast wire-protocol nodig, niet alleen een wrapper                                                                     |
| 20  | `wrapStreamFn`                    | Stream-wrapper nadat generieke wrappers zijn toegepast                                                        | Provider heeft request-headers/body/model-compat-wrappers nodig zonder aangepast transport                                                    |
| 21  | `resolveTransportTurnState`       | Voeg native transportheaders of metadata per beurt toe                                                        | Provider wil dat generieke transports provider-native beurtidentiteit verzenden                                                               |
| 22  | `resolveWebSocketSessionPolicy`   | Voeg native WebSocket-headers of sessieafkoelbeleid toe                                                       | Provider wil dat generieke WS-transports sessieheaders of fallbackbeleid afstemmen                                                            |
| 23  | `formatApiKey`                    | Auth-profielformatter: opgeslagen profiel wordt de runtime-`apiKey`-string                                    | Provider slaat extra auth-metadata op en heeft een aangepaste runtime-tokenvorm nodig                                                         |
| 24  | `refreshOAuth`                    | OAuth-refresh-override voor aangepaste refresh-endpoints of beleid bij refresh-fouten                         | Provider past niet bij de gedeelde `pi-ai`-refreshers                                                                                         |
| 25  | `buildAuthDoctorHint`             | Reparatiehint die wordt toegevoegd wanneer OAuth-refresh mislukt                                              | Provider heeft provider-eigen auth-reparatiebegeleiding nodig na refresh-fout                                                                 |
| 26  | `matchesContextOverflowError`     | Provider-eigen matcher voor contextvensteroverloop                                                            | Provider heeft ruwe overflowfouten die generieke heuristieken zouden missen                                                                   |
| 27  | `classifyFailoverReason`          | Provider-eigen classificatie van failoverreden                                                                | Provider kan ruwe API-/transportfouten mappen naar snelheidslimiet/overbelasting/enzovoort                                                    |
| 28  | `isCacheTtlEligible`              | Prompt-cachebeleid voor proxy-/backhaulproviders                                                              | Provider heeft proxyspecifieke cache-TTL-toelatingscontrole nodig                                                                             |
| 29  | `buildMissingAuthMessage`         | Vervanging voor het generieke herstelbericht bij ontbrekende auth                                             | Provider heeft een providerspecifieke herstelhint bij ontbrekende auth nodig                                                                  |
| 30  | `augmentModelCatalog`             | Synthetische/definitieve catalogusrijen toegevoegd na ontdekking                                              | Provider heeft synthetische forward-compat-rijen nodig in `models list` en pickers                                                            |
| 31  | `resolveThinkingProfile`          | Modelspecifieke `/think`-niveauset, weergavelabels en standaardwaarde                                         | Provider biedt een aangepaste thinking-ladder of binair label voor geselecteerde modellen                                                     |
| 32  | `isBinaryThinking`                | Compatibiliteitshook voor aan/uit-reasoning-toggle                                                            | Provider biedt alleen binair thinking aan/uit                                                                                                 |
| 33  | `supportsXHighThinking`           | Compatibiliteitshook voor `xhigh`-reasoningondersteuning                                                      | Provider wil `xhigh` alleen op een subset van modellen                                                                                         |
| 34  | `resolveDefaultThinkingLevel`     | Compatibiliteitshook voor standaard `/think`-niveau                                                           | Provider beheert standaard `/think`-beleid voor een modelfamilie                                                                              |
| 35  | `isModernModelRef`                | Matcher voor moderne modellen voor live-profielfilters en rooktestselectie                                    | Provider beheert matching van voorkeursmodellen voor live/rooktests                                                                           |
| 36  | `prepareRuntimeAuth`              | Wissel een geconfigureerde credential om naar het daadwerkelijke runtime-token/de runtime-sleutel vlak vóór inference | Provider heeft een tokenuitwisseling of kortlevende request-credential nodig                                                                  |
| 37  | `resolveUsageAuth`                | Los gebruiks-/factureringsreferenties op voor `/usage` en gerelateerde statusoppervlakken                                     | Provider heeft aangepaste parsing van gebruiks-/quotatokens nodig of andere gebruiksreferenties                                                               |
| 38  | `fetchUsageSnapshot`              | Haal provider-specifieke gebruiks-/quotasnapshots op en normaliseer ze nadat auth is opgelost                             | Provider heeft een provider-specifiek gebruikseindpunt of een payloadparser nodig                                                                           |
| 39  | `createEmbeddingProvider`         | Bouw een embeddingadapter in eigendom van de provider voor geheugen/zoeken                                                     | Gedrag voor geheugenembeddings hoort bij de provider-Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | Retourneer een replaybeleid dat transcriptafhandeling voor de provider regelt                                        | Provider heeft aangepast transcriptbeleid nodig (bijvoorbeeld het verwijderen van thinking-blokken)                                                               |
| 41  | `sanitizeReplayHistory`           | Herschrijf replaygeschiedenis na generieke transcriptopschoning                                                        | Provider heeft provider-specifieke replayherschrijvingen nodig buiten gedeelde Compaction-helpers                                                             |
| 42  | `validateReplayTurns`             | Voer laatste validatie of hervorming van replay-turns uit vóór de ingebedde runner                                           | Providertransport heeft strengere turnvalidatie nodig na generieke opschoning                                                                    |
| 43  | `onModelSelected`                 | Voer provider-eigen neveneffecten na selectie uit                                                                 | Provider heeft telemetrie of provider-eigen status nodig wanneer een model actief wordt                                                                  |

`normalizeModelId`, `normalizeTransport` en `normalizeConfig` controleren eerst de
gematchte provider-plugin en vallen daarna door naar andere hook-capabele provider-plugins
totdat er een de model-id of transport/config daadwerkelijk wijzigt. Zo blijven
alias-/compat-provider-shims werken zonder dat de caller hoeft te weten welke
gebundelde plugin de herschrijving bezit. Als geen provider-hook een ondersteunde
Google-familieconfiguratie herschrijft, past de gebundelde Google-config-normalizer
die compatibiliteitsopschoning nog steeds toe.

Als de provider een volledig aangepast wire-protocol of aangepaste request-executor
nodig heeft, is dat een andere klasse extensie. Deze hooks zijn voor provider-gedrag
dat nog steeds op OpenClaw's normale inferenceloop draait.

### Provider-voorbeeld

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

Gebundelde provider-plugins combineren de bovenstaande hooks om aan de catalogus-,
auth-, denk-, replay- en usage-behoeften van elke vendor te voldoen. De gezaghebbende hook-set
staat bij elke plugin onder `extensions/`; deze pagina illustreert de vormen in plaats van
de lijst te spiegelen.

<AccordionGroup>
  <Accordion title="Pass-through catalogusproviders">
    OpenRouter, Kilocode, Z.AI, xAI registreren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` zodat ze upstream
    model-id's vóór OpenClaw's statische catalogus kunnen tonen.
  </Accordion>
  <Accordion title="OAuth- en usage-endpointproviders">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai koppelen
    `prepareRuntimeAuth` of `formatApiKey` aan `resolveUsageAuth` +
    `fetchUsageSnapshot` om tokenuitwisseling en `/usage`-integratie te bezitten.
  </Accordion>
  <Accordion title="Replay- en transcriptopschoningsfamilies">
    Gedeelde benoemde families (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) laten providers intekenen op
    transcriptbeleid via `buildReplayPolicy` in plaats van dat elke plugin
    opschoning opnieuw implementeert.
  </Accordion>
  <Accordion title="Alleen-catalogusproviders">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` en
    `volcengine` registreren alleen `catalog` en gebruiken de gedeelde inferenceloop.
  </Accordion>
  <Accordion title="Anthropic-specifieke stream-helpers">
    Beta-headers, `/fast` / `serviceTier` en `context1m` bevinden zich binnen de
    publieke `api.ts` / `contract-api.ts`-naad van de Anthropic-plugin
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
- Gebruikt core-`messages.tts`-configuratie en providerselectie.
- Retourneert PCM-audiobuffer + samplefrequentie. Plugins moeten resamplen/encoden voor providers.
- `listVoices` is optioneel per provider. Gebruik dit voor vendor-owned stemkiezers of setupflows.
- Stemlijsten kunnen rijkere metadata bevatten, zoals locale, gender en persoonlijkheidstags voor provider-aware kiezers.
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

- Houd TTS-beleid, fallback en antwoordlevering in core.
- Gebruik spraakproviders voor vendor-owned synthese-gedrag.
- Legacy Microsoft `edge`-invoer wordt genormaliseerd naar de provider-id `microsoft`.
- Het voorkeursmodel voor ownership is bedrijfsgericht: een vendor-plugin kan
  tekst-, spraak-, beeld- en toekomstige mediaproviders bezitten naarmate OpenClaw die
  capability-contracten toevoegt.

Voor begrip van afbeelding/audio/video registreren plugins één getypte
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

- Houd orkestratie, fallback, configuratie en channel-wiring in core.
- Houd vendor-gedrag in de provider-plugin.
- Additieve uitbreiding moet getypt blijven: nieuwe optionele methoden, nieuwe optionele
  resultaatvelden, nieuwe optionele capabilities.
- Videogeneratie volgt al hetzelfde patroon:
  - core bezit het capability-contract en de runtime-helper
  - vendor-plugins registreren `api.registerVideoGenerationProvider(...)`
  - feature-/channel-plugins consumeren `api.runtime.videoGeneration.*`

Voor media-understanding runtime-helpers kunnen plugins aanroepen:

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

Voor audiotranscriptie kunnen plugins de media-understanding runtime
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

- `api.runtime.mediaUnderstanding.*` is het gedeelde voorkeursoppervlak voor
  begrip van afbeelding/audio/video.
- Gebruikt core media-understanding audioconfiguratie (`tools.media.audio`) en provider-fallbackvolgorde.
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

- `provider` en `model` zijn optionele per-run overrides, geen persistente sessiewijzigingen.
- OpenClaw honoreert die override-velden alleen voor vertrouwde callers.
- Voor plugin-owned fallback-runs moeten operators expliciet intekenen met `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gebruik `plugins.entries.<id>.subagent.allowedModels` om vertrouwde plugins te beperken tot specifieke canonieke `provider/model`-doelen, of `"*"` om elk doel expliciet toe te staan.
- Subagent-runs van niet-vertrouwde plugins werken nog steeds, maar override-verzoeken worden geweigerd in plaats van stil terug te vallen.
- Door plugins aangemaakte subagent-sessies worden getagd met de id van de aanmakende plugin. Fallback `api.runtime.subagent.deleteSession(...)` mag alleen die owned sessies verwijderen; willekeurige sessieverwijdering vereist nog steeds een admin-scoped Gateway-request.

Voor webzoekopdrachten kunnen plugins de gedeelde runtime-helper consumeren in plaats van
in de agent-tool-wiring te grijpen:

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

- Houd providerselectie, credential-resolutie en gedeelde requestsemantiek in core.
- Gebruik webzoekproviders voor vendor-specifieke zoektransports.
- `api.runtime.webSearch.*` is het gedeelde voorkeursoppervlak voor feature-/channel-plugins die zoekgedrag nodig hebben zonder afhankelijk te zijn van de agent-tool-wrapper.

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

- `generate(...)`: genereer een afbeelding met de geconfigureerde image-generation providerketen.
- `listProviders(...)`: vermeld beschikbare image-generation providers en hun capabilities.

## Gateway HTTP-routes

Plugins kunnen HTTP-endpoints blootstellen met `api.registerHttpRoute(...)`.

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
- `auth`: vereist. Gebruik `"gateway"` om normale Gateway-auth te vereisen, of `"plugin"` voor plugin-managed auth/Webhook-verificatie.
- `match`: optioneel. `"exact"` (standaard) of `"prefix"`.
- `replaceExisting`: optioneel. Staat dezelfde plugin toe om zijn eigen bestaande routeregistratie te vervangen.
- `handler`: retourneer `true` wanneer de route de request heeft afgehandeld.

Opmerkingen:

- `api.registerHttpHandler(...)` is verwijderd en veroorzaakt een Plugin-laadfout. Gebruik in plaats daarvan `api.registerHttpRoute(...)`.
- Plugin-routes moeten `auth` expliciet declareren.
- Exacte `path + match`-conflicten worden geweigerd tenzij `replaceExisting: true`, en een Plugin kan de route van een andere Plugin niet vervangen.
- Overlappende routes met verschillende `auth`-niveaus worden geweigerd. Houd `exact`/`prefix`-fallthroughketens alleen op hetzelfde auth-niveau.
- `auth: "plugin"`-routes ontvangen **niet** automatisch operator-runtime-scopes. Ze zijn bedoeld voor door Plugins beheerde webhooks/handtekeningverificatie, niet voor bevoorrechte Gateway-helperaanroepen.
- `auth: "gateway"`-routes draaien binnen een Gateway-aanvraag-runtime-scope, maar die scope is bewust conservatief:
  - shared-secret bearer-auth (`gateway.auth.mode = "token"` / `"password"`) houdt Plugin-route-runtime-scopes vast op `operator.write`, zelfs als de aanroeper `x-openclaw-scopes` meestuurt
  - vertrouwde HTTP-modi met identiteit (bijvoorbeeld `trusted-proxy` of `gateway.auth.mode = "none"` op een private ingress) respecteren `x-openclaw-scopes` alleen wanneer de header expliciet aanwezig is
  - als `x-openclaw-scopes` ontbreekt op die Plugin-route-aanvragen met identiteit, valt de runtime-scope terug op `operator.write`
- Praktische regel: ga er niet van uit dat een gateway-auth Plugin-route een impliciet admin-oppervlak is. Als je route gedrag vereist dat alleen voor admins is, vereis dan een auth-modus met identiteit en documenteer het expliciete `x-openclaw-scopes`-headercontract.

## Plugin SDK-importpaden

Gebruik smalle SDK-subpaden in plaats van de monolithische `openclaw/plugin-sdk`-rootbarrel
bij het schrijven van nieuwe plugins. Kernsubpaden:

| Subpad                              | Doel                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitieven voor Plugin-registratie                |
| `openclaw/plugin-sdk/channel-core`  | Helpers voor kanaalinvoer/opbouw                   |
| `openclaw/plugin-sdk/core`          | Generieke gedeelde helpers en overkoepelend contract |
| `openclaw/plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema (`OpenClawSchema`) |

Kanaalplugins kiezen uit een familie van smalle seams — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` en `channel-actions`. Goedkeuringsgedrag moet worden geconsolideerd
op één `approvalCapability`-contract in plaats van te mengen over niet-gerelateerde
Plugin-velden. Zie [Kanaalplugins](/nl/plugins/sdk-channel-plugins).

Runtime- en configuratiehelpers bevinden zich onder overeenkomende gerichte `*-runtime`-subpaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, enz.). Geef de voorkeur aan `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation`
in plaats van de brede `config-runtime`-compatibiliteitsbarrel.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
en `openclaw/plugin-sdk/infra-runtime` zijn verouderde compatibiliteitsshims voor
oudere plugins. Nieuwe code moet in plaats daarvan smallere generieke primitieven importeren.
</Info>

Repo-interne entrypoints (per root van gebundeld Plugin-pakket):

- `index.js` — entry van gebundelde Plugin
- `api.js` — helper/types-barrel
- `runtime-api.js` — barrel alleen voor runtime
- `setup-entry.js` — setup-Plugin-entry

Externe plugins mogen alleen `openclaw/plugin-sdk/*`-subpaden importeren. Importeer nooit
`src/*` van een ander Plugin-pakket vanuit core of vanuit een andere Plugin.
Via facade geladen entrypoints geven de voorkeur aan de actieve runtime-configuratiesnapshot wanneer die
bestaat, en vallen daarna terug op het opgeloste configuratiebestand op schijf.

Capaciteitsspecifieke subpaden zoals `image-generation`, `media-understanding`
en `speech` bestaan omdat gebundelde plugins ze vandaag gebruiken. Ze zijn niet
automatisch langdurig bevroren externe contracten — raadpleeg de relevante SDK-
referentiepagina wanneer je ervan afhankelijk bent.

## Schema's voor berichttools

Plugins moeten eigenaar zijn van kanaalspecifieke `describeMessageTool(...)`-schema-
bijdragen voor niet-berichtprimitieven zoals reacties, leesbevestigingen en polls.
Gedeelde verzendpresentatie moet het generieke `MessagePresentation`-contract gebruiken
in plaats van provider-native knop-, component-, blok- of kaartvelden.
Zie [Berichtpresentatie](/nl/plugins/message-presentation) voor het contract,
fallbackregels, providertoewijzing en de checklist voor Plugin-auteurs.

Plugins die kunnen verzenden declareren wat ze kunnen renderen via berichtcapaciteiten:

- `presentation` voor semantische presentatieblokken (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` voor pinned-delivery-aanvragen

Core beslist of de presentatie native wordt gerenderd of wordt teruggebracht tot tekst.
Stel geen provider-native UI-uitwijkmogelijkheden bloot vanuit de generieke berichttool.
Verouderde SDK-helpers voor legacy native schema's blijven geëxporteerd voor bestaande
plugins van derden, maar nieuwe plugins moeten ze niet gebruiken.

## Resolutie van kanaaldoelen

Kanaalplugins moeten eigenaar zijn van kanaalspecifieke doelsemantiek. Houd de gedeelde
uitgaande host generiek en gebruik het messaging-adapteroppervlak voor providerregels:

- `messaging.inferTargetChatType({ to })` beslist of een genormaliseerd doel
  moet worden behandeld als `direct`, `group` of `channel` vóór directory-lookup.
- `messaging.targetResolver.looksLikeId(raw, normalized)` vertelt core of een
  invoer direct naar id-achtige resolutie moet gaan in plaats van directory-zoekopdracht.
- `messaging.targetResolver.resolveTarget(...)` is de Plugin-fallback wanneer
  core een definitieve provider-eigen resolutie nodig heeft na normalisatie of na een
  directory-misser.
- `messaging.resolveOutboundSessionRoute(...)` beheert providerspecifieke sessie-
  routeconstructie zodra een doel is opgelost.

Aanbevolen verdeling:

- Gebruik `inferTargetChatType` voor categoriebeslissingen die moeten plaatsvinden vóór
  het zoeken naar peers/groepen.
- Gebruik `looksLikeId` voor controles op "behandel dit als een expliciete/native target id".
- Gebruik `resolveTarget` voor providerspecifieke normalisatie-fallback, niet voor
  brede directory-zoekopdracht.
- Houd provider-native ids zoals chat-ids, thread-ids, JID's, handles en room-
  ids binnen `target`-waarden of providerspecifieke params, niet in generieke SDK-
  velden.

## Door configuratie ondersteunde directories

Plugins die directoryvermeldingen uit configuratie afleiden, moeten die logica in de
Plugin houden en de gedeelde helpers uit
`openclaw/plugin-sdk/directory-runtime` hergebruiken.

Gebruik dit wanneer een kanaal door configuratie ondersteunde peers/groepen nodig heeft, zoals:

- door allowlist gestuurde DM-peers
- geconfigureerde kanaal-/groepsmappen
- account-scoped statische directory-fallbacks

De gedeelde helpers in `directory-runtime` behandelen alleen generieke bewerkingen:

- query-filtering
- limiettoepassing
- deduplicatie-/normalisatiehelpers
- `ChannelDirectoryEntry[]` bouwen

Kanaalspecifieke accountinspectie en id-normalisatie moeten in de
Plugin-implementatie blijven.

## Providercatalogi

Providerplugins kunnen modelcatalogi voor inferentie definiëren met
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retourneert dezelfde vorm die OpenClaw schrijft naar
`models.providers`:

- `{ provider }` voor één providervermelding
- `{ providers }` voor meerdere providervermeldingen

Gebruik `catalog` wanneer de Plugin eigenaar is van providerspecifieke model-ids, standaardwaarden
voor basis-URL's of door auth afgeschermde modelmetadata.

`catalog.order` bepaalt wanneer de catalogus van een Plugin wordt samengevoegd ten opzichte van de
ingebouwde impliciete providers van OpenClaw:

- `simple`: eenvoudige providers op basis van API-sleutels of env
- `profile`: providers die verschijnen wanneer auth-profielen bestaan
- `paired`: providers die meerdere gerelateerde providervermeldingen synthetiseren
- `late`: laatste pass, na andere impliciete providers

Latere providers winnen bij sleutelconflicten, zodat plugins bewust een ingebouwde
providervermelding met dezelfde provider-id kunnen overschrijven.

Compatibiliteit:

- `discovery` werkt nog steeds als legacy-alias
- als zowel `catalog` als `discovery` zijn geregistreerd, gebruikt OpenClaw `catalog`

## Alleen-lezen kanaalinspectie

Als je Plugin een kanaal registreert, implementeer dan bij voorkeur
`plugin.config.inspectAccount(cfg, accountId)` naast `resolveAccount(...)`.

Waarom:

- `resolveAccount(...)` is het runtimepad. Het mag ervan uitgaan dat credentials
  volledig gematerialiseerd zijn en kan snel falen wanneer vereiste secrets ontbreken.
- Alleen-lezen commandopaden zoals `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` en doctor-/configuratie-
  reparatiestromen zouden geen runtime-credentials hoeven te materialiseren alleen om
  configuratie te beschrijven.

Aanbevolen `inspectAccount(...)`-gedrag:

- Retourneer alleen beschrijvende accountstatus.
- Behoud `enabled` en `configured`.
- Neem credentialbron-/statusvelden op wanneer relevant, zoals:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Je hoeft geen ruwe tokenwaarden te retourneren alleen om alleen-lezen
  beschikbaarheid te rapporteren. `tokenStatus: "available"` retourneren (en het bijbehorende bronveld)
  is genoeg voor statusachtige commando's.
- Gebruik `configured_unavailable` wanneer een credential via SecretRef is geconfigureerd maar
  niet beschikbaar is in het huidige commandopad.

Hierdoor kunnen alleen-lezen commando's "geconfigureerd maar niet beschikbaar in dit commando-
pad" rapporteren in plaats van te crashen of het account ten onrechte als niet geconfigureerd te melden.

## Pakketpacks

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

Elke entry wordt een Plugin. Als het pack meerdere extensions vermeldt, wordt de Plugin-id
`name/<fileBase>`.

Als je Plugin npm-deps importeert, installeer ze dan in die directory zodat
`node_modules` beschikbaar is (`npm install` / `pnpm install`).

Beveiligingsvangrail: elke `openclaw.extensions`-entry moet na symlinkresolutie binnen de Plugin-
directory blijven. Entries die buiten de pakketdirectory vallen, worden
geweigerd.

Beveiligingsopmerking: `openclaw plugins install` installeert Plugin-afhankelijkheden met een
projectlokale `npm install --omit=dev --ignore-scripts` (geen lifecycle-scripts,
geen dev-afhankelijkheden tijdens runtime), waarbij overgenomen globale npm-installatie-instellingen worden genegeerd.
Houd Plugin-afhankelijkheidsbomen "pure JS/TS" en vermijd pakketten die
`postinstall`-builds vereisen.

Optioneel: `openclaw.setupEntry` kan wijzen naar een lichtgewicht module alleen voor setup.
Wanneer OpenClaw setup-oppervlakken nodig heeft voor een uitgeschakelde kanaalplugin, of
wanneer een kanaalplugin is ingeschakeld maar nog steeds niet geconfigureerd is, laadt het `setupEntry`
in plaats van de volledige Plugin-entry. Dit houdt opstarten en setup lichter
wanneer je hoofd-Plugin-entry ook tools, hooks of andere runtime-only
code aansluit.

Optioneel: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kan een kanaalplugin laten kiezen voor hetzelfde `setupEntry`-pad tijdens de
pre-listen-opstartfase van de Gateway, zelfs wanneer het kanaal al geconfigureerd is.

Gebruik dit alleen wanneer `setupEntry` volledig het opstartoppervlak dekt dat moet bestaan
voordat de Gateway begint te luisteren. In de praktijk betekent dit dat de setup-entry
elke kanaal-eigen capaciteit moet registreren waarvan opstarten afhankelijk is, zoals:

- kanaalregistratie zelf
- alle HTTP-routes die beschikbaar moeten zijn voordat de Gateway begint te luisteren
- alle Gateway-methoden, tools of services die tijdens datzelfde venster moeten bestaan

Als je volledige entry nog eigenaar is van een vereiste opstartcapaciteit, schakel
deze vlag dan niet in. Houd de Plugin op het standaardgedrag en laat OpenClaw de
volledige entry laden tijdens het opstarten.

Gebundelde kanalen kunnen ook setup-only helpers voor contractoppervlakken publiceren die core
kan raadplegen voordat de volledige kanaalruntime is geladen. Het huidige setup-
promotieoppervlak is:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core gebruikt dat oppervlak wanneer het een verouderde kanaalconfiguratie met één account moet promoveren naar `channels.<id>.accounts.*` zonder het volledige Plugin-item te laden. Matrix is het huidige gebundelde voorbeeld: het verplaatst alleen auth-/bootstrap-sleutels naar een benoemd gepromoveerd account wanneer benoemde accounts al bestaan, en het kan een geconfigureerde niet-canonieke standaardsleutel voor accounts behouden in plaats van altijd `accounts.default` te maken.

Die setup-patchadapters houden de detectie van gebundelde contractoppervlakken lazy. De importtijd blijft licht; het promotieoppervlak wordt pas bij het eerste gebruik geladen in plaats van gebundelde kanaalstart opnieuw binnen te gaan bij module-import.

Wanneer die startoppervlakken Gateway-RPC-methoden bevatten, houd ze dan op een Plugin-specifiek prefix. Core-beheerdersnaamruimten (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd herleid naar `operator.admin`, zelfs als een Plugin een smallere scope aanvraagt.

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

### Metagegevens van kanaalcatalogus

Kanaal-Plugins kunnen setup-/detectiemetagegevens publiceren via `openclaw.channel` en installatietips via `openclaw.install`. Dit houdt de corecatalogus vrij van data.

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
- `docsLabel`: overschrijf de linktekst voor de documentatielink
- `preferOver`: Plugin-/kanaal-id's met lagere prioriteit die dit catalogusitem moet overtreffen
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: tekstinstellingen voor selectieoppervlakken
- `markdownCapable`: markeert het kanaal als markdown-geschikt voor beslissingen over uitgaande opmaak
- `exposure.configured`: verberg het kanaal in oppervlakken voor lijsten met geconfigureerde kanalen wanneer ingesteld op `false`
- `exposure.setup`: verberg het kanaal in interactieve setup-/configuratiekeuzes wanneer ingesteld op `false`
- `exposure.docs`: markeer het kanaal als intern/privé voor documentatienavigatieoppervlakken
- `showConfigured` / `showInSetup`: verouderde aliassen die nog steeds voor compatibiliteit worden geaccepteerd; geef de voorkeur aan `exposure`
- `quickstartAllowFrom`: laat het kanaal deelnemen aan de standaard quickstart-`allowFrom`-flow
- `forceAccountBinding`: vereis expliciete accountbinding, zelfs wanneer er maar één account bestaat
- `preferSessionLookupForAnnounceTarget`: geef de voorkeur aan sessiezoekopdrachten bij het herleiden van aankondigingsdoelen

OpenClaw kan ook **externe kanaalcatalogi** samenvoegen (bijvoorbeeld een MPM-registerexport). Plaats een JSON-bestand op een van deze locaties:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Of wijs `OPENCLAW_PLUGIN_CATALOG_PATHS` (of `OPENCLAW_MPM_CATALOG_PATHS`) naar een of meer JSON-bestanden (gescheiden door komma/puntkomma/`PATH`). Elk bestand moet `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` bevatten. De parser accepteert ook `"packages"` of `"plugins"` als verouderde aliassen voor de sleutel `"entries"`.

Gegenereerde kanaalcatalogusitems en install-catalogusitems voor providers tonen genormaliseerde feiten over de installatiebron naast het ruwe blok `openclaw.install`. De genormaliseerde feiten geven aan of de npm-specificatie een exacte versie of zwevende selector is, of verwachte integriteitsmetagegevens aanwezig zijn, en of er ook een lokaal bronpad beschikbaar is. Wanneer de catalogus-/pakketidentiteit bekend is, waarschuwen de genormaliseerde feiten als de geparsede npm-pakketnaam afwijkt van die identiteit. Ze waarschuwen ook wanneer `defaultChoice` ongeldig is of verwijst naar een bron die niet beschikbaar is, en wanneer npm-integriteitsmetagegevens aanwezig zijn zonder geldige npm-bron. Consumers moeten `installSource` behandelen als een additief optioneel veld, zodat handgemaakte items en catalogus-shims het niet hoeven te synthetiseren. Hierdoor kunnen onboarding en diagnostiek de staat van het bronvlak uitleggen zonder de Plugin-runtime te importeren.

Officiële externe npm-items moeten bij voorkeur een exacte `npmSpec` plus `expectedIntegrity` gebruiken. Kale pakketnamen en dist-tags blijven werken voor compatibiliteit, maar ze tonen waarschuwingen over het bronvlak zodat de catalogus kan evolueren naar gepinde, op integriteit gecontroleerde installaties zonder bestaande Plugins te breken. Wanneer onboarding installeert vanuit een lokaal cataloguspad, registreert het een beheerd Plugin-indexitem met `source: "path"` en waar mogelijk een workspace-relatief `sourcePath`. Het absolute operationele laadpad blijft in `plugins.load.paths`; het installatierecord voorkomt dat lokale workstationpaden worden gedupliceerd naar langdurige configuratie. Dit houdt lokale ontwikkelinstallaties zichtbaar voor bronvlakdiagnostiek zonder een tweede ruw openbaarmakingsoppervlak voor bestandssysteempaden toe te voegen. De persistente Plugin-index `plugins/installs.json` is de bron van waarheid voor installatie en kan worden vernieuwd zonder Plugin-runtimemodules te laden. De map `installRecords` is duurzaam, zelfs wanneer een Plugin-manifest ontbreekt of ongeldig is; de array `plugins` is een opnieuw op te bouwen manifestweergave.

## Context-engine-Plugins

Context-engine-Plugins beheren orkestratie van sessiecontext voor ingest, assemblage en Compaction. Registreer ze vanuit je Plugin met `api.registerContextEngine(id, factory)` en selecteer daarna de actieve engine met `plugins.slots.contextEngine`.

Gebruik dit wanneer je Plugin de standaard contextpipeline moet vervangen of uitbreiden in plaats van alleen geheugenzoekopdrachten of hooks toe te voegen.

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

De factory `ctx` stelt optionele waarden `config`, `agentDir` en `workspaceDir` beschikbaar voor initialisatie tijdens constructie.

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

Wanneer een Plugin gedrag nodig heeft dat niet in de huidige API past, omzeil het Pluginsysteem dan niet met een private reach-in. Voeg de ontbrekende capability toe.

Aanbevolen volgorde:

1. definieer het corecontract
   Bepaal welk gedeeld gedrag core moet beheren: beleid, fallback, configuratiesamenvoeging, lifecycle, kanaalgerichte semantiek en de vorm van runtimehelpers.
2. voeg getypeerde Plugin-registratie-/runtimeoppervlakken toe
   Breid `OpenClawPluginApi` en/of `api.runtime` uit met het kleinste nuttige getypeerde capability-oppervlak.
3. koppel core + consumers van kanalen/functies
   Kanalen en functie-Plugins moeten de nieuwe capability via core gebruiken, niet door rechtstreeks een vendorimplementatie te importeren.
4. registreer vendorimplementaties
   Vendor-Plugins registreren vervolgens hun backends tegen de capability.
5. voeg contractdekking toe
   Voeg tests toe zodat eigenaarschap en registratiestructuur in de loop van de tijd expliciet blijven.

Zo blijft OpenClaw uitgesproken zonder hardcoded te worden naar het wereldbeeld van één provider. Zie het [Capability-kookboek](/nl/plugins/architecture) voor een concrete bestandschecklist en uitgewerkt voorbeeld.

### Capability-checklist

Wanneer je een nieuwe capability toevoegt, moet de implementatie meestal deze oppervlakken samen aanraken:

- corecontracttypen in `src/<capability>/types.ts`
- corerunner/runtimehelper in `src/<capability>/runtime.ts`
- Plugin-API-registratieoppervlak in `src/plugins/types.ts`
- Plugin-registerkoppeling in `src/plugins/registry.ts`
- Plugin-runtimeblootstelling in `src/plugins/runtime/*` wanneer functie-/kanaal-Plugins deze moeten gebruiken
- capture-/testhelpers in `src/test-utils/plugin-registration.ts`
- eigenaarschaps-/contractasserties in `src/plugins/contracts/registry.ts`
- operator-/Plugin-documentatie in `docs/`

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

- core beheert het capability-contract + de orkestratie
- vendor-Plugins beheren vendorimplementaties
- functie-/kanaal-Plugins gebruiken runtimehelpers
- contracttests houden eigenaarschap expliciet

## Gerelateerd

- [Plugin-architectuur](/nl/plugins/architecture) — publiek capabilitymodel en vormen
- [Plugin SDK-subpaden](/nl/plugins/sdk-subpaths)
- [Plugin SDK-setup](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
