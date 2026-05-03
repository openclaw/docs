---
read_when:
    - Runtimehooks voor providers, kanaallevenscyclus of pakketbundels implementeren
    - Foutopsporing van de Plugin-laadvolgorde of registerstatus
    - Een nieuwe Plugin-mogelijkheid of context-engine-Plugin toevoegen
summary: 'Interne werking van de Plugin-architectuur: laadpipeline, register, runtime-hooks, HTTP-routes en referentietabellen'
title: Interne werking van de Plugin-architectuur
x-i18n:
    generated_at: "2026-05-03T21:35:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Voor het openbare capabilitymodel, Plugin-vormen en eigendoms-/uitvoeringscontracten, zie [Plugin-architectuur](/nl/plugins/architecture). Deze pagina is de referentie voor de interne werking: laadpipeline, registry, runtime hooks, Gateway HTTP-routes, importpaden en schematabellen.

## Laadpipeline

Bij het opstarten doet OpenClaw globaal dit:

1. kandidaat-Plugin-roots ontdekken
2. native of compatibele bundelmanifesten en pakketmetadata lezen
3. onveilige kandidaten afwijzen
4. Plugin-config normaliseren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. enablement voor elke kandidaat bepalen
6. ingeschakelde native modules laden: gebouwde gebundelde modules gebruiken een native loader;
   lokale TypeScript-broncode van derden gebruikt de noodfallback Jiti
7. native `register(api)` hooks aanroepen en registraties verzamelen in de Plugin registry
8. de registry beschikbaar maken voor commands/runtime-oppervlakken

<Note>
`activate` is een legacy alias voor `register` — de loader resolveert welke aanwezig is (`def.register ?? def.activate`) en roept die op hetzelfde punt aan. Alle gebundelde Plugins gebruiken `register`; geef voor nieuwe Plugins de voorkeur aan `register`.
</Note>

De safety gates vinden plaats **vóór** runtime-uitvoering. Kandidaten worden geblokkeerd
wanneer de entry buiten de Plugin-root komt, het pad world-writable is, of
eigenaarschap van het pad verdacht lijkt voor niet-gebundelde Plugins.

Geblokkeerde kandidaten blijven voor diagnostiek gekoppeld aan hun Plugin-id. Als config
nog steeds naar die id verwijst, rapporteert validatie de Plugin als aanwezig maar geblokkeerd
en verwijst terug naar de waarschuwing voor padveiligheid in plaats van de config-entry
als verouderd te behandelen.

### Manifest-first gedrag

Het manifest is de bron van waarheid voor het control plane. OpenClaw gebruikt het om:

- de Plugin te identificeren
- gedeclareerde channels/skills/config-schema of bundelcapabilities te ontdekken
- `plugins.entries.<id>.config` te valideren
- labels/placeholders in de Control UI aan te vullen
- install-/catalogusmetadata te tonen
- goedkope activation- en setupdescriptors te behouden zonder de Plugin-runtime te laden

Voor native Plugins is de runtime-module het data-plane-deel. Die registreert
daadwerkelijk gedrag zoals hooks, tools, commands of providerflows.

Optionele manifestblokken `activation` en `setup` blijven op het control plane.
Het zijn descriptors met alleen metadata voor activationplanning en setupdetectie;
ze vervangen runtime-registratie, `register(...)` of `setupEntry` niet.
De eerste live activation-consumers gebruiken nu manifesthints voor commands, channels en providers
om het laden van Plugins te beperken vóór bredere registry-materialisatie:

- CLI-laden wordt beperkt tot Plugins die eigenaar zijn van de gevraagde primaire command
- channel-setup/Plugin-resolutie wordt beperkt tot Plugins die eigenaar zijn van de gevraagde
  channel-id
- expliciete provider-setup/runtime-resolutie wordt beperkt tot Plugins die eigenaar zijn van de
  gevraagde provider-id
- Gateway-opstartplanning gebruikt `activation.onStartup` voor expliciete opstartimports
  en opt-outs bij opstarten; Plugins zonder opstartmetadata laden alleen
  via smallere activation-triggers

Runtime-preloads tijdens requests die om de brede scope `all` vragen, leiden nog steeds een
expliciete effectieve set Plugin-id's af uit config, opstartplanning, geconfigureerde
channels, slots en auto-enable-regels. Als die afgeleide set leeg is, laadt OpenClaw
een lege runtime registry in plaats van te verbreden naar elke ontdekbare
Plugin.

De activationplanner biedt zowel een API met alleen id's voor bestaande callers als een
plan-API voor nieuwe diagnostiek. Plan-items rapporteren waarom een Plugin is geselecteerd,
waarbij expliciete plannerhints uit `activation.*` worden gescheiden van fallback via manifesteigendom
zoals `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` en hooks. Die scheiding in redenen is de compatibiliteitsgrens:
bestaande Plugin-metadata blijft werken, terwijl nieuwe code brede hints
of fallbackgedrag kan detecteren zonder runtime-laadsemantiek te veranderen.

Setupdetectie geeft nu de voorkeur aan descriptor-eigen id's zoals `setup.providers` en
`setup.cliBackends` om kandidaat-Plugins te beperken voordat wordt teruggevallen op
`setup-api` voor Plugins die nog steeds setup-time runtime hooks nodig hebben. Provider-
setuplijsten gebruiken manifest `providerAuthChoices`, descriptor-afgeleide setupkeuzes
en install-catalogusmetadata zonder de provider-runtime te laden. Expliciete
`setup.requiresRuntime: false` is een descriptor-only afkapping; weggelaten
`requiresRuntime` behoudt de legacy `setup-api`-fallback voor compatibiliteit. Als meer
dan één ontdekte Plugin dezelfde genormaliseerde setupprovider- of CLI-backend-id claimt,
weigert setup lookup de ambigue eigenaar in plaats van op
detectievolgorde te vertrouwen. Wanneer setup-runtime wel wordt uitgevoerd, rapporteert registrydiagnostiek
drift tussen `setup.providers` / `setup.cliBackends` en de providers of CLI-
backends die door setup-api zijn geregistreerd, zonder legacy Plugins te blokkeren.

### Plugin-cachegrens

OpenClaw cachet geen Plugin-detectieresultaten of directe manifest-registry-
data achter wall-clock-vensters. Installaties, manifestbewerkingen en wijzigingen in laadpaden
moeten zichtbaar worden bij de volgende expliciete metadataread of snapshot rebuild.
De parser voor manifestbestanden mag een begrensde bestandssignatuurcache bijhouden die is keyed op het
geopende manifestpad, inode, grootte en timestamps; die cache vermijdt alleen
het opnieuw parsen van ongewijzigde bytes en mag discovery-, registry-, owner- of
policy-antwoorden niet cachen.

Het veilige snelle metadatapad is expliciet objecteigenaarschap, geen verborgen cache.
Gateway-opstarthotpaths moeten de huidige `PluginMetadataSnapshot`, de
afgeleide `PluginLookUpTable` of een expliciete manifest registry door de call
chain doorgeven. Configvalidatie, auto-enable bij opstarten, Plugin-bootstrap en provider-
selectie kunnen die objecten hergebruiken zolang ze de huidige config en
Plugin-inventaris vertegenwoordigen. Setup lookup reconstrueert manifestmetadata nog steeds on demand,
tenzij het specifieke setuppad een expliciete manifest registry ontvangt; houd dat
als een cold-path-fallback in plaats van verborgen lookupcaches toe te voegen. Wanneer de input
wijzigt, bouw de snapshot opnieuw op en vervang die in plaats van die te muteren of
historische kopieën te bewaren.
Views over de actieve Plugin registry en gebundelde channel-bootstraphelpers
moeten opnieuw worden berekend uit de huidige registry/root. Kortlevende maps zijn prima
binnen één call om werk te dedupliceren of reentry te bewaken; ze mogen geen proces-
metadatacaches worden.

Voor het laden van Plugins is de persistente cachelaag runtime-laden. Die mag
loaderstatus hergebruiken wanneer code of geïnstalleerde artifacts daadwerkelijk worden geladen, zoals:

- `PluginLoaderCacheState` en compatibele actieve runtime registries
- jiti/module-caches en loadercaches voor public surfaces die worden gebruikt om te voorkomen dat
  hetzelfde runtime surface herhaaldelijk wordt geïmporteerd
- filesystemcaches voor geïnstalleerde Plugin-artifacts
- kortlevende per-call maps voor padnormalisatie of duplicaatresolutie

Die caches zijn data-plane-implementatiedetails. Ze mogen geen antwoord geven op
control-plane-vragen zoals "welke Plugin is eigenaar van deze provider?", tenzij de
caller bewust om runtime-laden heeft gevraagd.

Voeg geen persistente of wall-clock-caches toe voor:

- discoveryresultaten
- directe manifest registries
- manifest registries die uit de geïnstalleerde Plugin-index zijn gereconstrueerd
- provider owner lookup, model suppression, provider policy of public-artifact-
  metadata
- elk ander manifest-afgeleid antwoord waarbij een gewijzigd manifest, geïnstalleerde index
  of laadpad zichtbaar moet zijn bij de volgende metadataread

Callers die manifestmetadata opnieuw opbouwen uit de gepersistente geïnstalleerde Plugin-
index reconstrueren die registry on demand. De geïnstalleerde index is duurzame
source-plane-status; het is geen verborgen in-process metadatacache.

## Registrymodel

Geladen Plugins muteren niet direct willekeurige core-globals. Ze registreren zich in een
centrale Plugin registry.

De registry houdt bij:

- Plugin-records (identiteit, bron, herkomst, status, diagnostiek)
- tools
- legacy hooks en typed hooks
- channels
- providers
- Gateway RPC-handlers
- HTTP-routes
- CLI-registrars
- achtergrondservices
- Plugin-eigen commands

Corefeatures lezen vervolgens uit die registry in plaats van rechtstreeks met Plugin-modules
te praten. Dit houdt laden eenrichtingsverkeer:

- Plugin-module -> registry-registratie
- core-runtime -> registry-consumptie

Die scheiding is belangrijk voor onderhoudbaarheid. Het betekent dat de meeste core surfaces slechts
één integratiepunt nodig hebben: "lees de registry", niet "special-case elke Plugin-
module".

## Callbacks voor gespreksbinding

Plugins die een gesprek binden, kunnen reageren wanneer een approval is afgehandeld.

Gebruik `api.onConversationBindingResolved(...)` om een callback te ontvangen nadat een bind-
request is goedgekeurd of geweigerd:

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

Velden in de callback-payload:

- `status`: `"approved"` of `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` of `"deny"`
- `binding`: de opgeloste binding voor goedgekeurde requests
- `request`: de oorspronkelijke requestsamenvatting, detach-hint, sender-id en
  gespreksmetadata

Deze callback is alleen een melding. Hij verandert niet wie een
gesprek mag binden, en hij wordt uitgevoerd nadat core-approvalafhandeling is voltooid.

## Provider runtime hooks

Provider-Plugins hebben drie lagen:

- **Manifestmetadata** voor goedkope pre-runtime lookup:
  `setup.providers[].envVars`, verouderde compatibiliteit `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` en `channelEnvVars`.
- **Config-time hooks**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`.
- **Runtime hooks**: meer dan 40 optionele hooks voor auth, modelresolutie,
  streamwrapping, thinking levels, replay policy en usage endpoints. Zie
  de volledige lijst onder [Hookvolgorde en gebruik](#hook-order-and-usage).

OpenClaw blijft eigenaar van de generieke agent-loop, failover, transcriptafhandeling en
toolbeleid. Deze hooks zijn het extensieoppervlak voor provider-specifiek
gedrag zonder dat een volledig aangepast inference-transport nodig is.

Gebruik manifest `setup.providers[].envVars` wanneer de provider env-gebaseerde
credentials heeft die generieke auth-/status-/model-picker-paden moeten zien zonder
Plugin-runtime te laden. Verouderde `providerAuthEnvVars` wordt tijdens de
deprecation window nog steeds gelezen door de compatibiliteitsadapter, en niet-gebundelde Plugins
die dit gebruiken krijgen een manifestdiagnostic. Gebruik manifest `providerAuthAliases`
wanneer één provider-id de env vars, auth profiles,
config-backed auth en API-key onboarding choice van een andere provider-id moet hergebruiken. Gebruik manifest
`providerAuthChoices` wanneer onboarding-/auth-choice-CLI-surfaces de
choice-id, groepslabels en eenvoudige one-flag auth-wiring van de provider moeten kennen zonder
provider-runtime te laden. Behoud provider runtime
`envVars` voor operator-facing hints zoals onboardinglabels of OAuth
client-id/client-secret setup vars.

Gebruik manifest `channelEnvVars` wanneer een channel env-gedreven auth of setup heeft die
generieke shell-env-fallback, config-/statuschecks of setupprompts moeten zien
zonder channel-runtime te laden.

### Hookvolgorde en gebruik

Voor model-/provider-Plugins roept OpenClaw hooks in deze globale volgorde aan.
De kolom "Wanneer gebruiken" is de snelle beslisgids.
Compatibility-only providervelden die OpenClaw niet langer aanroept, zoals
`ProviderPlugin.capabilities` en `suppressBuiltInModel`, staan hier bewust niet
vermeld.

| #   | Hook                              | Wat het doet                                                                                                   | Wanneer te gebruiken                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publiceer providerconfiguratie naar `models.providers` tijdens het genereren van `models.json`                                | Provider bezit een catalogus of standaardwaarden voor de basis-URL                                                                                                  |
| 2   | `applyConfigDefaults`             | Pas globale standaardconfiguratie van de provider toe tijdens configuratiematerialisatie                                      | Standaardwaarden hangen af van auth-modus, env of semantiek van de modelfamilie van de provider                                                                         |
| --  | _(ingebouwde modelzoekactie)_         | OpenClaw probeert eerst het normale registry-/cataloguspad                                                          | _(geen Plugin-hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | Normaliseer verouderde of preview-model-ID-aliassen vóór opzoeken                                                     | Provider bezit aliasopschoning vóór canonieke modelresolutie                                                                                 |
| 4   | `normalizeTransport`              | Normaliseer providerfamilie-`api` / `baseUrl` vóór generieke modelsamenstelling                                      | Provider bezit transportopschoning voor aangepaste provider-ID's in dezelfde transportfamilie                                                          |
| 5   | `normalizeConfig`                 | Normaliseer `models.providers.<id>` vóór runtime-/providerresolutie                                           | Provider heeft configuratieopschoning nodig die bij de Plugin hoort; gebundelde Google-familiehelpers ondersteunen ook ondersteunde Google-configuratievermeldingen   |
| 6   | `applyNativeStreamingUsageCompat` | Pas compat-herschrijvingen voor native streaminggebruik toe op configuratieproviders                                               | Provider heeft endpointgestuurde fixes voor metadata van native streaminggebruik nodig                                                                          |
| 7   | `resolveConfigApiKey`             | Los env-marker-auth op voor configuratieproviders vóór runtime-auth laden                                       | Provider heeft provider-eigen env-marker-API-sleutelresolutie; `amazon-bedrock` heeft hier ook een ingebouwde AWS env-markerresolver                  |
| 8   | `resolveSyntheticAuth`            | Maak lokale/zelfgehoste of configuratiegebaseerde auth beschikbaar zonder plaintext op te slaan                                   | Provider kan werken met een synthetische/lokale credentialmarker                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Leg provider-eigen externe auth-profielen erbovenop; standaard `persistence` is `runtime-only` voor CLI-/app-eigen credentials | Provider hergebruikt externe auth-credentials zonder gekopieerde refreshtokens op te slaan; declareer `contracts.externalAuthProviders` in het manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Verlaag opgeslagen synthetische profielplaceholders achter env-/configuratiegebaseerde auth                                      | Provider slaat synthetische placeholderprofielen op die geen voorrang mogen krijgen                                                                 |
| 11  | `resolveDynamicModel`             | Synchrone fallback voor provider-eigen model-ID's die nog niet in de lokale registry staan                                       | Provider accepteert willekeurige upstream-model-ID's                                                                                                 |
| 12  | `prepareDynamicModel`             | Asynchrone warming-up, daarna wordt `resolveDynamicModel` opnieuw uitgevoerd                                                           | Provider heeft netwerkmetadata nodig voordat onbekende ID's worden opgelost                                                                                  |
| 13  | `normalizeResolvedModel`          | Laatste herschrijving voordat de ingebedde runner het opgeloste model gebruikt                                               | Provider heeft transportherschrijvingen nodig maar gebruikt nog steeds een kerntransport                                                                             |
| 14  | `contributeResolvedModelCompat`   | Draag compat-flags bij voor vendormodellen achter een ander compatibel transport                                  | Provider herkent zijn eigen modellen op proxytransports zonder de provider over te nemen                                                       |
| 15  | `normalizeToolSchemas`            | Normaliseer toolschema's voordat de ingebedde runner ze ziet                                                    | Provider heeft transportfamilie-schemaopschoning nodig                                                                                                |
| 16  | `inspectToolSchemas`              | Maak provider-eigen schemadiagnostiek zichtbaar na normalisatie                                                  | Provider wil trefwoordwaarschuwingen zonder core provider-specifieke regels te leren                                                                 |
| 17  | `resolveReasoningOutputMode`      | Selecteer native versus getagd contract voor redeneeruitvoer                                                              | Provider heeft getagde redeneer-/einduitvoer nodig in plaats van native velden                                                                         |
| 18  | `prepareExtraParams`              | Requestparameternormalisatie vóór generieke streamoptiewrappers                                              | Provider heeft standaard requestparameters of provider-specifieke parameteropschoning nodig                                                                           |
| 19  | `createStreamFn`                  | Vervang het normale streampad volledig door een aangepast transport                                                   | Provider heeft een aangepast wireprotocol nodig, niet alleen een wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Streamwrapper nadat generieke wrappers zijn toegepast                                                              | Provider heeft requestheaders-/body-/modelcompatwrappers nodig zonder aangepast transport                                                          |
| 21  | `resolveTransportTurnState`       | Voeg native per-turn transportheaders of metadata toe                                                           | Provider wil dat generieke transports provider-native turn-identiteit verzenden                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Voeg native WebSocket-headers of sessie-afkoelbeleid toe                                                    | Provider wil dat generieke WS-transports sessieheaders of fallbackbeleid afstemmen                                                               |
| 23  | `formatApiKey`                    | Auth-profielformatter: opgeslagen profiel wordt de runtime-`apiKey`-string                                     | Provider slaat extra auth-metadata op en heeft een aangepaste runtime-tokenvorm nodig                                                                    |
| 24  | `refreshOAuth`                    | OAuth-refreshoverride voor aangepaste refresh-endpoints of beleid bij refreshfouten                                  | Provider past niet bij de gedeelde `pi-ai`-refreshers                                                                                           |
| 25  | `buildAuthDoctorHint`             | Reparatiehint die wordt toegevoegd wanneer OAuth-refresh mislukt                                                                  | Provider heeft provider-eigen auth-reparatiebegeleiding nodig na een refreshfout                                                                      |
| 26  | `matchesContextOverflowError`     | Provider-eigen matcher voor contextvensteroverloop                                                                 | Provider heeft ruwe overloopfouten die generieke heuristieken zouden missen                                                                                |
| 27  | `classifyFailoverReason`          | Provider-eigen classificatie van failoverreden                                                                  | Provider kan ruwe API-/transportfouten mappen naar rate-limit/overload/enzovoort                                                                          |
| 28  | `isCacheTtlEligible`              | Prompt-cachebeleid voor proxy-/backhaulproviders                                                               | Provider heeft proxy-specifieke cache-TTL-gating nodig                                                                                                |
| 29  | `buildMissingAuthMessage`         | Vervanging voor het generieke herstelbericht bij ontbrekende auth                                                      | Provider heeft een provider-specifieke herstelhint bij ontbrekende auth nodig                                                                                 |
| 30  | `augmentModelCatalog`             | Synthetische/uiteindelijke catalogusrijen die na ontdekking worden toegevoegd                                                          | Provider heeft synthetische forward-compatrijen nodig in `models list` en pickers                                                                     |
| 31  | `resolveThinkingProfile`          | Modelspecifieke `/think`-niveauset, weergavelabels en standaardwaarde                                                 | Provider biedt een aangepaste denkladder of binair label voor geselecteerde modellen                                                                 |
| 32  | `isBinaryThinking`                | Compatibiliteitshook voor aan/uit-redeneertoggle                                                                     | Provider biedt alleen binair denken aan/uit                                                                                                  |
| 33  | `supportsXHighThinking`           | Compatibiliteitshook voor `xhigh`-redeneerondersteuning                                                                   | Provider wil `xhigh` alleen op een subset van modellen                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Compatibiliteitshook voor standaard `/think`-niveau                                                                      | Provider bezit standaard `/think`-beleid voor een modelfamilie                                                                                      |
| 35  | `isModernModelRef`                | Matcher voor moderne modellen voor live profielfilters en smoke-selectie                                              | Provider bezit matching voor live/smoke-voorkeursmodellen                                                                                             |
| 36  | `prepareRuntimeAuth`              | Wissel een geconfigureerde credential om voor de daadwerkelijke runtime-token/sleutel vlak vóór inferentie                       | Provider heeft een tokenuitwisseling of kortlevende requestcredential nodig                                                                             |
| 37  | `resolveUsageAuth`                | Gebruiks-/factureringsgegevens voor `/usage` en gerelateerde statusinterfaces oplossen                                     | Aanbieder heeft aangepaste parsing van gebruiks-/quotatokens of andere gebruiksgegevens nodig                                                               |
| 38  | `fetchUsageSnapshot`              | Aanbiederspecifieke momentopnamen van gebruik/quota ophalen en normaliseren nadat authenticatie is opgelost                             | Aanbieder heeft een aanbiederspecifiek gebruikseindpunt of payloadparser nodig                                                                           |
| 39  | `createEmbeddingProvider`         | Een door de aanbieder beheerde embeddingadapter voor geheugen/zoeken bouwen                                                     | Gedrag voor geheugen-embeddings hoort bij de aanbieder-Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | Een replaybeleid retourneren dat transcriptverwerking voor de aanbieder regelt                                        | Aanbieder heeft aangepast transcriptbeleid nodig (bijvoorbeeld het verwijderen van denkblokken)                                                               |
| 41  | `sanitizeReplayHistory`           | Replaygeschiedenis herschrijven na generieke opschoning van transcript                                                        | Aanbieder heeft aanbiederspecifieke replayherschrijvingen nodig naast gedeelde Compaction-helpers                                                             |
| 42  | `validateReplayTurns`             | Laatste validatie of hervorming van replayturns vóór de ingesloten runner                                           | Aanbiedertransport heeft strengere turnvalidatie nodig na generieke sanering                                                                    |
| 43  | `onModelSelected`                 | Door de aanbieder beheerde neveneffecten na selectie uitvoeren                                                                 | Aanbieder heeft telemetrie of door de aanbieder beheerde status nodig wanneer een model actief wordt                                                                  |

`normalizeModelId`, `normalizeTransport` en `normalizeConfig` controleren eerst de
overeenkomende providerplugin en vallen daarna terug op andere providerplugins
met hook-ondersteuning totdat er een daadwerkelijk de model-id of transport/config
wijzigt. Daardoor blijven alias-/compatibiliteits-provider-shims werken zonder
dat de aanroeper hoeft te weten welke gebundelde plugin de herschrijving bezit.
Als geen providerhook een ondersteunde Google-familieconfiguratie herschrijft,
past de gebundelde Google-confignormalisator die compatibiliteitsopschoning
nog steeds toe.

Als de provider een volledig aangepast wireprotocol of een aangepaste
requestexecutor nodig heeft, is dat een andere klasse extensie. Deze hooks zijn
voor providergedrag dat nog steeds op OpenClaw's normale inferentielus draait.

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

Gebundelde providerplugins combineren de hooks hierboven om aan te sluiten op de
catalogus-, auth-, denk-, replay- en gebruiksbehoeften van elke leverancier. De
gezaghebbende hookset bevindt zich bij elke plugin onder `extensions/`; deze
pagina illustreert de vormen in plaats van de lijst te spiegelen.

<AccordionGroup>
  <Accordion title="Catalogusproviders met doorvoer">
    OpenRouter, Kilocode, Z.AI, xAI registreren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, zodat ze upstream
    model-id's vóór OpenClaw's statische catalogus kunnen tonen.
  </Accordion>
  <Accordion title="Providers voor OAuth- en gebruikseindpunten">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai koppelen
    `prepareRuntimeAuth` of `formatApiKey` aan `resolveUsageAuth` +
    `fetchUsageSnapshot` om tokenuitwisseling en `/usage`-integratie te bezitten.
  </Accordion>
  <Accordion title="Families voor replay- en transcriptopschoning">
    Gedeelde benoemde families (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) laten providers zich
    aanmelden voor transcriptbeleid via `buildReplayPolicy` in plaats van dat
    elke plugin de opschoning opnieuw implementeert.
  </Accordion>
  <Accordion title="Providers met alleen catalogus">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` en
    `volcengine` registreren alleen `catalog` en gebruiken de gedeelde
    inferentielus.
  </Accordion>
  <Accordion title="Anthropic-specifieke streamhelpers">
    Beta-headers, `/fast` / `serviceTier` en `context1m` bevinden zich binnen de
    openbare `api.ts` / `contract-api.ts`-seam van de Anthropic-plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) in plaats van in
    de generieke SDK.
  </Accordion>
</AccordionGroup>

## Runtimehelpers

Plugins hebben toegang tot geselecteerde corehelpers via `api.runtime`. Voor TTS:

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
- Gebruikt coreconfiguratie `messages.tts` en providerselectie.
- Retourneert PCM-audiobuffer + samplefrequentie. Plugins moeten resamplen/encoderen voor providers.
- `listVoices` is optioneel per provider. Gebruik dit voor leveranciersspecifieke stemkiezers of installatieflows.
- Stemlijsten kunnen rijkere metadata bevatten, zoals locale-, gender- en persoonlijkheidstags voor providerbewuste kiezers.
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

- Houd TTS-beleid, fallback en antwoordaflevering in core.
- Gebruik spraakproviders voor leveranciersspecifiek synthese-gedrag.
- Legacy Microsoft-`edge`-input wordt genormaliseerd naar de `microsoft` provider-id.
- Het voorkeursmodel voor eigenaarschap is bedrijfsgericht: één leveranciersplugin kan
  tekst-, spraak-, beeld- en toekomstige mediaproviders bezitten terwijl OpenClaw die
  capaciteitscontracten toevoegt.

Voor begrip van beeld/audio/video registreren plugins één getypte
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
- Houd leveranciersgedrag in de providerplugin.
- Additieve uitbreiding moet getypeerd blijven: nieuwe optionele methoden, nieuwe optionele
  resultaatvelden, nieuwe optionele capaciteiten.
- Videogeneratie volgt al hetzelfde patroon:
  - core bezit het capaciteitscontract en de runtimehelper
  - leveranciersplugins registreren `api.registerVideoGenerationProvider(...)`
  - feature-/kanaalplugins gebruiken `api.runtime.videoGeneration.*`

Voor media-understanding-runtimehelpers kunnen plugins aanroepen:

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

Voor audiotranscriptie kunnen plugins ofwel de media-understanding-runtime
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

- `api.runtime.mediaUnderstanding.*` is het voorkeurs-gedeelde oppervlak voor
  begrip van beeld/audio/video.
- Gebruikt core media-understanding-audioconfiguratie (`tools.media.audio`) en providerfallbackvolgorde.
- Retourneert `{ text: undefined }` wanneer er geen transcriptie-output wordt geproduceerd (bijvoorbeeld overgeslagen/niet-ondersteunde input).
- `api.runtime.stt.transcribeAudioFile(...)` blijft bestaan als compatibiliteitsalias.

Plugins kunnen ook achtergrond-subagentruns starten via `api.runtime.subagent`:

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
- OpenClaw honoreert die overridevelden alleen voor vertrouwde aanroepers.
- Voor fallbackruns die eigendom zijn van plugins moeten operators zich aanmelden met `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gebruik `plugins.entries.<id>.subagent.allowedModels` om vertrouwde plugins te beperken tot specifieke canonieke `provider/model`-doelen, of `"*"` om elk doel expliciet toe te staan.
- Subagentruns van niet-vertrouwde plugins blijven werken, maar overrideverzoeken worden afgewezen in plaats van stilzwijgend terug te vallen.
- Door plugins gemaakte subagentsessies worden getagd met de makende plugin-id. Fallback `api.runtime.subagent.deleteSession(...)` mag alleen die sessies in eigendom verwijderen; willekeurige sessieverwijdering vereist nog steeds een Gateway-request met admin-scope.

Voor webzoekopdrachten kunnen plugins de gedeelde runtimehelper gebruiken in plaats van
in de agenttoolbedrading te grijpen:

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
- Gebruik webzoekproviders voor leveranciersspecifieke zoektransporten.
- `api.runtime.webSearch.*` is het voorkeurs-gedeelde oppervlak voor feature-/kanaalplugins die zoekgedrag nodig hebben zonder afhankelijk te zijn van de agenttoolwrapper.

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

- `generate(...)`: genereer een afbeelding met de geconfigureerde image-generation-providerketen.
- `listProviders(...)`: vermeld beschikbare image-generation-providers en hun capaciteiten.

## Gateway HTTP-routes

Plugins kunnen HTTP-eindpunten beschikbaar maken met `api.registerHttpRoute(...)`.

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
- `auth`: vereist. Gebruik `"gateway"` om normale Gateway-auth te vereisen, of `"plugin"` voor door plugins beheerde auth/webhook-verificatie.
- `match`: optioneel. `"exact"` (standaard) of `"prefix"`.
- `replaceExisting`: optioneel. Staat dezelfde plugin toe zijn eigen bestaande routeregistratie te vervangen.
- `handler`: retourneer `true` wanneer de route het request heeft afgehandeld.

Opmerkingen:

- `api.registerHttpHandler(...)` is verwijderd en veroorzaakt een laadfout voor een plugin. Gebruik in plaats daarvan `api.registerHttpRoute(...)`.
- Plugin-routes moeten `auth` expliciet declareren.
- Exacte `path + match`-conflicten worden geweigerd tenzij `replaceExisting: true`, en één plugin kan de route van een andere plugin niet vervangen.
- Overlappende routes met verschillende `auth`-niveaus worden geweigerd. Houd `exact`/`prefix`-fallthrough-ketens alleen op hetzelfde auth-niveau.
- `auth: "plugin"`-routes ontvangen **niet** automatisch runtime-scopes van de operator. Ze zijn bedoeld voor door plugins beheerde webhooks/handtekeningverificatie, niet voor bevoorrechte Gateway-helperaanroepen.
- `auth: "gateway"`-routes draaien binnen een runtime-scope van een Gateway-verzoek, maar die scope is bewust conservatief:
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) houdt runtime-scopes van plugin-routes vastgezet op `operator.write`, zelfs als de aanroeper `x-openclaw-scopes` meestuurt
  - vertrouwde HTTP-modi met identiteit (bijvoorbeeld `trusted-proxy` of `gateway.auth.mode = "none"` op een private ingress) honoreren `x-openclaw-scopes` alleen wanneer de header expliciet aanwezig is
  - als `x-openclaw-scopes` ontbreekt op die plugin-routeverzoeken met identiteit, valt de runtime-scope terug op `operator.write`
- Praktische regel: ga er niet van uit dat een gateway-auth-pluginroute impliciet een beheeroppervlak is. Als je route gedrag vereist dat alleen voor beheerders is, vereis dan een auth-modus met identiteit en documenteer het expliciete `x-openclaw-scopes`-headercontract.

## Plugin SDK-importpaden

Gebruik smalle SDK-subpaden in plaats van het monolithische rootbarrel
`openclaw/plugin-sdk` wanneer je nieuwe plugins maakt. Kernsubpaden:

| Subpad                              | Doel                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitieven voor Plugin-registratie                |
| `openclaw/plugin-sdk/channel-core`  | Helpers voor kanaalinvoer/build                    |
| `openclaw/plugin-sdk/core`          | Generieke gedeelde helpers en overkoepelend contract |
| `openclaw/plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema (`OpenClawSchema`) |

Kanaalplugins kiezen uit een familie van smalle naden — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` en `channel-actions`. Goedkeuringsgedrag moet consolideren
op één `approvalCapability`-contract in plaats van te mengen tussen niet-verwante
pluginvelden. Zie [Kanaalplugins](/nl/plugins/sdk-channel-plugins).

Runtime- en configuratiehelpers staan onder overeenkomende gerichte `*-runtime`-subpaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, enz.). Geef de voorkeur aan `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation`
in plaats van het brede compatibiliteitsbarrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
en `openclaw/plugin-sdk/infra-runtime` zijn verouderde compatibiliteitsshims voor
oudere plugins. Nieuwe code moet in plaats daarvan smallere generieke primitieven importeren.
</Info>

Repo-interne entrypoints (per gebundelde pluginpakketroot):

- `index.js` — entry van gebundelde plugin
- `api.js` — helper/types-barrel
- `runtime-api.js` — runtime-only barrel
- `setup-entry.js` — entry van setup-plugin

Externe plugins mogen alleen `openclaw/plugin-sdk/*`-subpaden importeren. Importeer nooit
`src/*` van een ander pluginpakket vanuit core of vanuit een andere plugin.
Via facade geladen entrypoints geven de voorkeur aan de actieve runtime-configuratiesnapshot wanneer die
bestaat, en vallen daarna terug op het opgeloste configuratiebestand op schijf.

Capability-specifieke subpaden zoals `image-generation`, `media-understanding`
en `speech` bestaan omdat gebundelde plugins ze vandaag gebruiken. Het zijn niet
automatisch langdurig bevroren externe contracten — controleer de relevante SDK-
referentiepagina wanneer je erop vertrouwt.

## Schema's voor berichttools

Plugins moeten kanaalspecifieke `describeMessageTool(...)`-schema-
bijdragen bezitten voor niet-bericht-primitieven zoals reacties, leesbevestigingen en polls.
Gedeelde verzendpresentatie moet het generieke `MessagePresentation`-contract
gebruiken in plaats van provider-native knop-, component-, blok- of kaartvelden.
Zie [Berichtpresentatie](/nl/plugins/message-presentation) voor het contract,
fallbackregels, providermapping en de checklist voor pluginauteurs.

Plugins met verzendmogelijkheden declareren wat ze kunnen renderen via berichtcapabilities:

- `presentation` voor semantische presentatieblokken (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` voor verzoeken om vastgezette aflevering

Core beslist of de presentatie native wordt gerenderd of wordt gedegradeerd naar tekst.
Stel geen provider-native UI-uitwijkmogelijkheden beschikbaar vanuit de generieke berichttool.
Verouderde SDK-helpers voor legacy native schema's blijven geëxporteerd voor bestaande
plugins van derden, maar nieuwe plugins moeten ze niet gebruiken.

## Oplossen van kanaaldoelen

Kanaalplugins moeten kanaalspecifieke doelsemantiek bezitten. Houd de gedeelde
outbound-host generiek en gebruik het messaging-adapteroppervlak voor providerregels:

- `messaging.inferTargetChatType({ to })` bepaalt of een genormaliseerd doel
  vóór directory-lookup moet worden behandeld als `direct`, `group` of `channel`.
- `messaging.targetResolver.looksLikeId(raw, normalized)` vertelt core of een
  invoer direct naar id-achtige resolutie moet gaan in plaats van directory search.
- `messaging.targetResolver.resolveTarget(...)` is de pluginfallback wanneer
  core een uiteindelijke provider-eigen resolutie nodig heeft na normalisatie of na een
  directory-miss.
- `messaging.resolveOutboundSessionRoute(...)` bezit providerspecifieke sessie-
  routeconstructie zodra een doel is opgelost.

Aanbevolen verdeling:

- Gebruik `inferTargetChatType` voor categoriebeslissingen die moeten plaatsvinden vóór
  het zoeken naar peers/groepen.
- Gebruik `looksLikeId` voor controles op "behandel dit als een expliciete/native doel-id".
- Gebruik `resolveTarget` voor providerspecifieke normalisatiefallback, niet voor
  brede directory search.
- Houd provider-native ids zoals chat-id's, thread-id's, JID's, handles en room-
  id's binnen `target`-waarden of providerspecifieke parameters, niet in generieke SDK-
  velden.

## Configuratiegestuurde directories

Plugins die directory-items afleiden uit configuratie moeten die logica in de
plugin houden en de gedeelde helpers uit
`openclaw/plugin-sdk/directory-runtime` hergebruiken.

Gebruik dit wanneer een kanaal configuratiegestuurde peers/groepen nodig heeft, zoals:

- allowlist-gestuurde DM-peers
- geconfigureerde kanaal-/groepsmaps
- account-scoped statische directoryfallbacks

De gedeelde helpers in `directory-runtime` behandelen alleen generieke bewerkingen:

- queryfiltering
- toepassing van limieten
- dedupe-/normalisatiehelpers
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

Gebruik `catalog` wanneer de plugin providerspecifieke model-id's, standaardwaarden voor base URL
of auth-gated modelmetadata bezit.

`catalog.order` bepaalt wanneer de catalogus van een plugin wordt samengevoegd ten opzichte van OpenClaw's
ingebouwde impliciete providers:

- `simple`: eenvoudige API-key- of env-gestuurde providers
- `profile`: providers die verschijnen wanneer auth-profielen bestaan
- `paired`: providers die meerdere gerelateerde providervermeldingen synthetiseren
- `late`: laatste pass, na andere impliciete providers

Latere providers winnen bij sleutelconflicten, zodat plugins bewust een
ingebouwde providervermelding met dezelfde provider-id kunnen overschrijven.

Compatibiliteit:

- `discovery` werkt nog steeds als legacy alias
- als zowel `catalog` als `discovery` zijn geregistreerd, gebruikt OpenClaw `catalog`

## Read-only kanaalinspectie

Als je plugin een kanaal registreert, implementeer bij voorkeur
`plugin.config.inspectAccount(cfg, accountId)` naast `resolveAccount(...)`.

Waarom:

- `resolveAccount(...)` is het runtime-pad. Het mag ervan uitgaan dat credentials
  volledig gematerialiseerd zijn en kan snel falen wanneer vereiste secrets ontbreken.
- Read-only opdrachtpaden zoals `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` en doctor-/configuratie-
  reparatiestromen zouden geen runtime-credentials hoeven te materialiseren alleen om
  configuratie te beschrijven.

Aanbevolen `inspectAccount(...)`-gedrag:

- Retourneer alleen beschrijvende accountstatus.
- Behoud `enabled` en `configured`.
- Neem velden voor credentialbron/status op wanneer relevant, zoals:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Je hoeft geen ruwe tokenwaarden te retourneren alleen om read-only
  beschikbaarheid te rapporteren. `tokenStatus: "available"` retourneren (en het overeenkomende bron-
  veld) is genoeg voor statusachtige opdrachten.
- Gebruik `configured_unavailable` wanneer een credential via SecretRef is geconfigureerd maar
  niet beschikbaar is in het huidige opdrachtpad.

Hierdoor kunnen read-only opdrachten "geconfigureerd maar niet beschikbaar in dit opdracht-
pad" rapporteren in plaats van te crashen of het account ten onrechte als niet geconfigureerd te melden.

## Pakketpacks

Een plugindirectory kan een `package.json` met `openclaw.extensions` bevatten:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Elke entry wordt een plugin. Als het pack meerdere extensions vermeldt, wordt de plugin-id
`name/<fileBase>`.

Als je plugin npm-deps importeert, installeer ze dan in die directory zodat
`node_modules` beschikbaar is (`npm install` / `pnpm install`).

Beveiligingsgrens: elke `openclaw.extensions`-entry moet na symlink-resolutie binnen de plugin-
directory blijven. Entries die uit de pakketdirectory ontsnappen, worden
geweigerd.

Beveiligingsopmerking: `openclaw plugins install` installeert pluginafhankelijkheden met een
projectlokale `npm install --omit=dev --ignore-scripts` (geen lifecycle scripts,
geen dev dependencies tijdens runtime), waarbij geërfde globale npm-installatie-instellingen worden genegeerd.
Houd pluginafhankelijkheidsbomen "pure JS/TS" en vermijd pakketten die
`postinstall`-builds vereisen.

Optioneel: `openclaw.setupEntry` kan wijzen naar een lichte setup-only module.
Wanneer OpenClaw setup-oppervlakken nodig heeft voor een uitgeschakelde kanaalplugin, of
wanneer een kanaalplugin is ingeschakeld maar nog niet geconfigureerd is, laadt het `setupEntry`
in plaats van de volledige plugin-entry. Dit houdt opstarten en setup lichter
wanneer je hoofdplugin-entry ook tools, hooks of andere runtime-only
code bedraadt.

Optioneel: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kan een kanaalplugin laten kiezen voor hetzelfde `setupEntry`-pad tijdens de
pre-listen opstartfase van de Gateway, zelfs wanneer het kanaal al is geconfigureerd.

Gebruik dit alleen wanneer `setupEntry` het opstartoppervlak dat moet bestaan
voordat de Gateway begint te luisteren volledig dekt. In de praktijk betekent dit dat de setup-entry
elke kanaal-eigen capability moet registreren waarvan opstarten afhangt, zoals:

- kanaalregistratie zelf
- HTTP-routes die beschikbaar moeten zijn voordat de Gateway begint te luisteren
- Gateway-methoden, tools of services die tijdens datzelfde venster moeten bestaan

Als je volledige entry nog een vereiste opstartcapability bezit, schakel
deze vlag dan niet in. Houd de plugin op het standaardgedrag en laat OpenClaw de
volledige entry tijdens opstarten laden.

Gebundelde kanalen kunnen ook setup-only helpers voor contractoppervlakken publiceren die core
kan raadplegen voordat de volledige kanaalruntime is geladen. Het huidige setup-
promotieoppervlak is:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core gebruikt dat oppervlak wanneer het een verouderde kanaalconfiguratie met één account moet promoveren naar `channels.<id>.accounts.*` zonder de volledige Plugin-entry te laden. Matrix is het huidige meegeleverde voorbeeld: het verplaatst alleen auth-/bootstrap-sleutels naar een benoemd gepromoveerd account wanneer benoemde accounts al bestaan, en het kan een geconfigureerde niet-canonieke standaardaccountsleutel behouden in plaats van altijd `accounts.default` aan te maken.

Die setup-patchadapters houden ontdekking van meegeleverde contractoppervlakken lazy. De importtijd blijft licht; het promotieoppervlak wordt pas bij het eerste gebruik geladen in plaats van opnieuw de meegeleverde kanaalstartup binnen te gaan bij module-import.

Wanneer die startup-oppervlakken Gateway-RPC-methoden bevatten, houd ze dan op een Plugin-specifiek prefix. Core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd herleid tot `operator.admin`, zelfs als een Plugin een smallere scope aanvraagt.

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

### Metadata van kanaalcatalogus

Kanaal-Plugins kunnen setup-/ontdekkingsmetadata aanbieden via `openclaw.channel` en installatiehints via `openclaw.install`. Dit houdt de Core-catalogus vrij van data.

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
- `preferOver`: Plugin-/kanaal-id's met lagere prioriteit die deze catalogusentry moet overtreffen
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: tekstbesturing voor selectieoppervlakken
- `markdownCapable`: markeert het kanaal als markdown-geschikt voor beslissingen over uitgaande opmaak
- `exposure.configured`: verberg het kanaal uit listingoppervlakken voor geconfigureerde kanalen wanneer ingesteld op `false`
- `exposure.setup`: verberg het kanaal uit interactieve setup-/configuratiekeuzes wanneer ingesteld op `false`
- `exposure.docs`: markeer het kanaal als intern/privé voor docs-navigatieoppervlakken
- `showConfigured` / `showInSetup`: verouderde aliassen die nog steeds worden geaccepteerd voor compatibiliteit; geef de voorkeur aan `exposure`
- `quickstartAllowFrom`: laat het kanaal deelnemen aan de standaard quickstart-`allowFrom`-flow
- `forceAccountBinding`: vereis expliciete accountbinding, zelfs wanneer er maar één account bestaat
- `preferSessionLookupForAnnounceTarget`: geef de voorkeur aan sessiezoekopdrachten bij het herleiden van aankondigingsdoelen

OpenClaw kan ook **externe kanaalcatalogi** samenvoegen (bijvoorbeeld een MPM-registerexport). Plaats een JSON-bestand op een van deze locaties:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Of laat `OPENCLAW_PLUGIN_CATALOG_PATHS` (of `OPENCLAW_MPM_CATALOG_PATHS`) verwijzen naar een of meer JSON-bestanden (gescheiden door komma/puntkomma/`PATH`). Elk bestand moet `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` bevatten. De parser accepteert ook `"packages"` of `"plugins"` als verouderde aliassen voor de sleutel `"entries"`.

Gegenereerde kanaalcatalogusentries en catalogusentries voor providerinstallatie tonen genormaliseerde feiten over de installatiebron naast het ruwe `openclaw.install`-blok. De genormaliseerde feiten geven aan of de npm-specificatie een exacte versie of een zwevende selector is, of verwachte integriteitsmetadata aanwezig zijn, en of er ook een lokaal bronpad beschikbaar is. Wanneer de catalogus-/pakketidentiteit bekend is, waarschuwen de genormaliseerde feiten als de geparsete npm-pakketnaam afwijkt van die identiteit. Ze waarschuwen ook wanneer `defaultChoice` ongeldig is of verwijst naar een bron die niet beschikbaar is, en wanneer npm-integriteitsmetadata aanwezig zijn zonder geldige npm-bron. Consumers moeten `installSource` behandelen als een additief optioneel veld, zodat handgemaakte entries en catalogusshims het niet hoeven te synthetiseren. Hierdoor kunnen onboarding en diagnostiek de status van het bronvlak uitleggen zonder Plugin-runtime te importeren.

Officiële externe npm-entries moeten bij voorkeur een exacte `npmSpec` plus `expectedIntegrity` gebruiken. Kale pakketnamen en dist-tags blijven werken voor compatibiliteit, maar tonen bronvlak-waarschuwingen zodat de catalogus kan opschuiven naar gepinde, op integriteit gecontroleerde installaties zonder bestaande Plugins te breken. Wanneer onboarding installeert vanuit een lokaal cataloguspad, wordt een beheerde Plugin-indexentry vastgelegd met `source: "path"` en, waar mogelijk, een werkruimte-relatief `sourcePath`. Het absolute operationele laadpad blijft in `plugins.load.paths`; het installatierecord voorkomt dat lokale werkstationpaden worden gedupliceerd naar langlevende config. Dit houdt lokale ontwikkelinstallaties zichtbaar voor bronvlakdiagnostiek zonder een tweede oppervlak toe te voegen dat ruwe bestandssysteempaden prijsgeeft. De persistente Plugin-index `plugins/installs.json` is de bron van waarheid voor installaties en kan worden vernieuwd zonder Plugin-runtime-modules te laden. De `installRecords`-map is duurzaam, zelfs wanneer een Plugin-manifest ontbreekt of ongeldig is; de `plugins`-array is een opnieuw opbouwbare manifestweergave.

## Context-engine-Plugins

Context-engine-Plugins beheren sessiecontextorchestratie voor ingest, assembly en Compaction. Registreer ze vanuit je Plugin met `api.registerContextEngine(id, factory)` en selecteer daarna de actieve engine met `plugins.slots.contextEngine`.

Gebruik dit wanneer je Plugin de standaardcontextpipeline moet vervangen of uitbreiden in plaats van alleen geheugenzoekopdrachten of hooks toe te voegen.

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

De factory-`ctx` biedt optionele waarden voor `config`, `agentDir` en `workspaceDir` voor initialisatie tijdens constructie.

Als je engine het Compaction-algoritme **niet** beheert, houd `compact()` dan geïmplementeerd en delegeer het expliciet:

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

Wanneer een Plugin gedrag nodig heeft dat niet in de huidige API past, omzeil het Pluginsysteem dan niet met private reach-in. Voeg de ontbrekende capability toe.

Aanbevolen volgorde:

1. definieer het Core-contract
   Bepaal welk gedeeld gedrag Core moet beheren: beleid, fallback, config-merge, lifecycle, kanaalgerichte semantiek en de vorm van runtimehelpers.
2. voeg getypeerde Plugin-registratie-/runtimeoppervlakken toe
   Breid `OpenClawPluginApi` en/of `api.runtime` uit met het kleinste nuttige getypeerde capability-oppervlak.
3. verbind Core + kanaal-/feature-consumers
   Kanalen en feature-Plugins moeten de nieuwe capability via Core consumeren, niet door rechtstreeks een vendorimplementatie te importeren.
4. registreer vendorimplementaties
   Vendor-Plugins registreren daarna hun backends tegen de capability.
5. voeg contractdekking toe
   Voeg tests toe zodat eigenaarschap en registratievorm in de loop van de tijd expliciet blijven.

Zo blijft OpenClaw opinionated zonder hardcoded te raken naar het wereldbeeld van één provider. Zie de [Capability Cookbook](/nl/plugins/architecture) voor een concrete bestandschecklist en uitgewerkt voorbeeld.

### Capability-checklist

Wanneer je een nieuwe capability toevoegt, moet de implementatie deze oppervlakken meestal samen raken:

- Core-contracttypes in `src/<capability>/types.ts`
- Core-runner/runtimehelper in `src/<capability>/runtime.ts`
- Plugin-API-registratieoppervlak in `src/plugins/types.ts`
- Plugin-registerbedrading in `src/plugins/registry.ts`
- Plugin-runtimeblootstelling in `src/plugins/runtime/*` wanneer feature-/kanaal-Plugins die moeten consumeren
- capture-/testhelpers in `src/test-utils/plugin-registration.ts`
- eigenaarschap-/contractasserties in `src/plugins/contracts/registry.ts`
- operator-/Plugin-docs in `docs/`

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

- Core beheert het capability-contract + de orchestratie
- vendor-Plugins beheren vendorimplementaties
- feature-/kanaal-Plugins consumeren runtimehelpers
- contracttests houden eigenaarschap expliciet

## Gerelateerd

- [Plugin-architectuur](/nl/plugins/architecture) — openbaar capability-model en vormen
- [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths)
- [Plugin-SDK-setup](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
