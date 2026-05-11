---
read_when:
    - Provider-runtimeuitbreidingspunten, kanaallevenscyclus of pakketbundels implementeren
    - Plugin-laadvolgorde of registerstatus debuggen
    - Een nieuwe Plugin-functionaliteit of contextengine-Plugin toevoegen
summary: 'Interne onderdelen van de Plugin-architectuur: laadpijplijn, register, uitvoeringshaken, HTTP-routes en referentietabellen'
title: Interne details van de Plugin-architectuur
x-i18n:
    generated_at: "2026-05-11T20:37:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Voor het publieke capaciteitsmodel, Plugin-vormen en eigendoms-/uitvoeringscontracten, zie [Plugin-architectuur](/nl/plugins/architecture). Deze pagina is de referentie voor de interne mechanica: laadpipeline, registry, runtime-hooks, Gateway HTTP-routes, importpaden en schematabellen.

## Laadpipeline

Bij het opstarten doet OpenClaw ongeveer dit:

1. kandidaat-Plugin-roots ontdekken
2. native of compatibele bundle-manifesten en pakketmetadata lezen
3. onveilige kandidaten weigeren
4. Plugin-config normaliseren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. enablement voor elke kandidaat bepalen
6. ingeschakelde native modules laden: gebouwde gebundelde modules gebruiken een native loader;
   lokale TypeScript-broncode van derden gebruikt de noodfallback Jiti
7. native `register(api)`-hooks aanroepen en registraties verzamelen in de Plugin-registry
8. de registry beschikbaar maken voor commando's/runtime-oppervlakken

<Note>
`activate` is een legacy alias voor `register` — de loader kiest wat aanwezig is (`def.register ?? def.activate`) en roept het op hetzelfde moment aan. Alle gebundelde Plugins gebruiken `register`; geef voor nieuwe Plugins de voorkeur aan `register`.
</Note>

De veiligheidscontroles gebeuren **voor** runtime-uitvoering. Kandidaten worden geblokkeerd
wanneer de entry buiten de Plugin-root valt, het pad door iedereen beschrijfbaar is, of pad-eigendom verdacht lijkt voor niet-gebundelde Plugins.

Geblokkeerde kandidaten blijven voor diagnostiek gekoppeld aan hun Plugin-id. Als config
nog steeds naar die id verwijst, meldt validatie de Plugin als aanwezig maar geblokkeerd
en verwijst terug naar de waarschuwing over padveiligheid in plaats van de config-entry
als verouderd te behandelen.

### Manifest-eerst-gedrag

Het manifest is de source of truth van het control plane. OpenClaw gebruikt het om:

- de Plugin te identificeren
- gedeclareerde kanalen/Skills/config-schema of bundle-capaciteiten te ontdekken
- `plugins.entries.<id>.config` te valideren
- Control UI-labels/placeholders aan te vullen
- installatie-/catalogusmetadata te tonen
- goedkope activerings- en setup-descriptors te behouden zonder Plugin-runtime te laden

Voor native Plugins is de runtime-module het data-plane-deel. Die registreert
daadwerkelijk gedrag zoals hooks, tools, commando's of provider-flows.

Optionele manifestblokken `activation` en `setup` blijven op het control plane.
Het zijn descriptors met alleen metadata voor activeringsplanning en setup-detectie;
ze vervangen runtime-registratie, `register(...)` of `setupEntry` niet.
De eerste live activeringsconsumenten gebruiken nu manifesthints voor commando's, kanalen en providers
om Plugin-loading te vernauwen vóór bredere materialisatie van de registry:

- CLI-loading vernauwt tot Plugins die eigenaar zijn van het gevraagde primaire commando
- kanaalsetup/Plugin-resolutie vernauwt tot Plugins die eigenaar zijn van de gevraagde
  kanaal-id
- expliciete provider-setup/runtime-resolutie vernauwt tot Plugins die eigenaar zijn van de
  gevraagde provider-id
- Gateway-opstartplanning gebruikt `activation.onStartup` voor expliciete opstartimports
  en opstart-opt-outs; Plugins zonder opstartmetadata laden alleen
  via nauwere activeringstriggers

Request-time runtime-preloads die om de brede scope `all` vragen, leiden nog steeds een
expliciete effectieve set Plugin-id's af uit config, opstartplanning, geconfigureerde
kanalen, slots en auto-enable-regels. Als die afgeleide set leeg is, laadt OpenClaw
een lege runtime-registry in plaats van te verbreden naar elke ontdekbare
Plugin.

De activeringsplanner biedt zowel een API met alleen id's voor bestaande callers als een
plan-API voor nieuwe diagnostiek. Plan-entries rapporteren waarom een Plugin is geselecteerd,
waarbij expliciete plannerhints van `activation.*` worden gescheiden van manifest-eigendom
als fallback, zoals `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` en hooks. Die redenenscheiding is de compatibiliteitsgrens:
bestaande Plugin-metadata blijft werken, terwijl nieuwe code brede hints
of fallbackgedrag kan detecteren zonder runtime-laadsemantiek te wijzigen.

Setup-detectie geeft nu de voorkeur aan descriptor-eigen id's zoals `setup.providers` en
`setup.cliBackends` om kandidaat-Plugins te vernauwen voordat wordt teruggevallen op
`setup-api` voor Plugins die nog setup-time runtime-hooks nodig hebben. Provider-
setuplijsten gebruiken manifest `providerAuthChoices`, descriptor-afgeleide setupkeuzes
en install-catalogusmetadata zonder provider-runtime te laden. Expliciet
`setup.requiresRuntime: false` is een descriptor-only cutoff; ontbrekende
`requiresRuntime` behoudt de legacy setup-api-fallback voor compatibiliteit. Als meer
dan één ontdekte Plugin dezelfde genormaliseerde setup-provider- of CLI-backend-id claimt,
weigert setup-lookup de ambiguë eigenaar in plaats van op
detectievolgorde te vertrouwen. Wanneer setup-runtime wel wordt uitgevoerd, rapporteert registry-diagnostiek
drift tussen `setup.providers` / `setup.cliBackends` en de providers of CLI-
backends die door setup-api zijn geregistreerd zonder legacy Plugins te blokkeren.

### Plugin-cachegrens

OpenClaw cachet geen Plugin-detectieresultaten of directe manifest-registrydata
achter wall-clock-vensters. Installaties, manifestbewerkingen en wijzigingen in laadpaden
moeten zichtbaar worden bij de volgende expliciete metadatalezing of snapshot-rebuild.
De manifestbestandsparser mag een begrensde bestandssignatuurcache bijhouden, keyed op het
geopende manifestpad, inode, grootte en timestamps; die cache voorkomt alleen
het opnieuw parsen van ongewijzigde bytes en mag geen discovery-, registry-, owner- of
policy-antwoorden cachen.

Het veilige snelle metadatapad is expliciet objecteigendom, geen verborgen cache.
Hot paths bij Gateway-opstarten moeten de huidige `PluginMetadataSnapshot`, de
afgeleide `PluginLookUpTable` of een expliciete manifest-registry doorgeven via de call
chain. Configvalidatie, startup auto-enable, Plugin-bootstrap en providerselectie
kunnen die objecten hergebruiken zolang ze de huidige config en
Plugin-inventory vertegenwoordigen. Setup-lookup reconstrueert manifestmetadata nog steeds op aanvraag
tenzij het specifieke setuppad een expliciete manifest-registry ontvangt; houd dat
als cold-path-fallback in plaats van verborgen lookup-caches toe te voegen. Wanneer de input
wijzigt, bouw dan de snapshot opnieuw op en vervang die in plaats van die te muteren of
historische kopieën te bewaren.
Weergaven over de actieve Plugin-registry en gebundelde kanaalbootstrap-helpers
moeten opnieuw worden berekend uit de huidige registry/root. Kortlevende maps zijn prima
binnen één call om werk te dedupliceren of reentry af te schermen; ze mogen geen proces-
metadatacaches worden.

Voor Plugin-loading is de persistente cachelaag runtime-loading. Die mag
loaderstate hergebruiken wanneer code of geïnstalleerde artifacts daadwerkelijk worden geladen, zoals:

- `PluginLoaderCacheState` en compatibele actieve runtime-registries
- jiti-/modulecaches en public-surface-loadercaches die worden gebruikt om te voorkomen dat
  hetzelfde runtime-oppervlak herhaaldelijk wordt geïmporteerd
- bestandssysteemcaches voor geïnstalleerde Plugin-artifacts
- kortlevende per-call maps voor padnormalisatie of duplicaatresolutie

Die caches zijn data-plane-implementatiedetails. Ze mogen geen
control-plane-vragen beantwoorden zoals "welke Plugin is eigenaar van deze provider?" tenzij de
caller bewust om runtime-loading heeft gevraagd.

Voeg geen persistente of wall-clock-caches toe voor:

- discovery-resultaten
- directe manifest-registries
- manifest-registries die uit de geïnstalleerde Plugin-index zijn gereconstrueerd
- provider owner-lookup, modelonderdrukking, providerbeleid of public-artifact-
  metadata
- elk ander manifest-afgeleid antwoord waarbij een gewijzigd manifest, geïnstalleerde index,
  of laadpad zichtbaar moet zijn bij de volgende metadatalezing

Callers die manifestmetadata opnieuw opbouwen uit de gepersisteerde geïnstalleerde Plugin-
index reconstrueren die registry op aanvraag. De geïnstalleerde index is duurzame
source-plane-state; het is geen verborgen in-process metadatacache.

## Registry-model

Geladen Plugins muteren niet rechtstreeks willekeurige globale core-state. Ze registreren in een
centrale Plugin-registry.

De registry houdt bij:

- Plugin-records (identiteit, bron, oorsprong, status, diagnostiek)
- tools
- legacy hooks en getypeerde hooks
- kanalen
- providers
- Gateway RPC-handlers
- HTTP-routes
- CLI-registrars
- achtergrondservices
- Plugin-eigen commando's

Core-features lezen vervolgens uit die registry in plaats van rechtstreeks met Plugin-modules
te praten. Dit houdt loading één richting op:

- Plugin-module -> registry-registratie
- core-runtime -> registry-consumptie

Die scheiding is belangrijk voor onderhoudbaarheid. Het betekent dat de meeste core-oppervlakken maar
één integratiepunt nodig hebben: "lees de registry", niet "special-case elke Plugin-
module".

## Conversation-binding-callbacks

Plugins die een gesprek binden, kunnen reageren wanneer een approval is resolved.

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

Callback-payloadvelden:

- `status`: `"approved"` of `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` of `"deny"`
- `binding`: de opgeloste binding voor goedgekeurde requests
- `request`: de oorspronkelijke requestsamenvatting, detach-hint, sender-id en
  gespreksmetadata

Deze callback is alleen een notificatie. Hij verandert niet wie een
gesprek mag binden, en hij draait nadat core-approvalafhandeling is voltooid.

## Provider-runtime-hooks

Provider-Plugins hebben drie lagen:

- **Manifestmetadata** voor goedkope pre-runtime-lookup:
  `setup.providers[].envVars`, deprecated compatibiliteit `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` en `channelEnvVars`.
- **Config-time hooks**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`.
- **Runtime-hooks**: 40+ optionele hooks voor auth, modelresolutie,
  stream wrapping, thinking levels, replaybeleid en usage-endpoints. Zie
  de volledige lijst onder [Hookvolgorde en gebruik](#hook-order-and-usage).

OpenClaw blijft eigenaar van de generieke agent-loop, failover, transcript-afhandeling en
toolbeleid. Deze hooks zijn het extensieoppervlak voor provider-specifiek
gedrag zonder dat een volledig custom inference transport nodig is.

Gebruik manifest `setup.providers[].envVars` wanneer de provider env-gebaseerde
credentials heeft die generieke auth/status/model-picker-paden moeten zien zonder
Plugin-runtime te laden. Deprecated `providerAuthEnvVars` wordt nog steeds gelezen door de
compatibiliteitsadapter tijdens de deprecation window, en niet-gebundelde Plugins
die het gebruiken krijgen een manifestdiagnose. Gebruik manifest `providerAuthAliases`
wanneer één provider-id de env vars, auth-profielen,
config-backed auth en API-key-onboardingkeuze van een andere provider-id moet hergebruiken. Gebruik manifest
`providerAuthChoices` wanneer onboarding/auth-choice CLI-oppervlakken de
choice-id, groepslabels en simpele one-flag auth wiring van de provider moeten kennen zonder
provider-runtime te laden. Houd provider-runtime
`envVars` voor operator-facing hints zoals onboardinglabels of OAuth
client-id/client-secret-setupvars.

Gebruik manifest `channelEnvVars` wanneer een kanaal env-driven auth of setup heeft die
generic shell-env fallback, config/status-checks of setup-prompts moeten zien
zonder kanaalruntime te laden.

### Hookvolgorde en gebruik

Voor model-/provider-Plugins roept OpenClaw hooks in ongeveer deze volgorde aan.
De kolom "Wanneer gebruiken" is de snelle beslisgids.
Compatibility-only provider-velden die OpenClaw niet meer aanroept, zoals
`ProviderPlugin.capabilities` en `suppressBuiltInModel`, worden hier bewust niet
vermeld.

| #   | Hook                              | Wat het doet                                                                                                           | Wanneer gebruiken                                                                                                                                          |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publiceert providerconfiguratie naar `models.providers` tijdens het genereren van `models.json`                        | Aanbieder beheert een catalogus of standaardwaarden voor basis-URL                                                                                         |
| 2   | `applyConfigDefaults`             | Past globale standaardconfiguratie van de aanbieder toe tijdens configuratiematerialisatie                              | Standaardwaarden hangen af van auth-modus, omgeving of modelsfamiliesemantiek van de aanbieder                                                            |
| --  | _(ingebouwde modelzoekactie)_     | OpenClaw probeert eerst het normale register-/cataloguspad                                                             | _(geen Plugin-hook)_                                                                                                                                       |
| 3   | `normalizeModelId`                | Normaliseert legacy- of preview-aliassen voor model-id's vóór het opzoeken                                             | Aanbieder beheert het opschonen van aliassen vóór canonieke modelresolutie                                                                                 |
| 4   | `normalizeTransport`              | Normaliseert providerfamilie-`api` / `baseUrl` vóór generieke modelsamenstelling                                       | Aanbieder beheert transportopschoning voor aangepaste provider-id's in dezelfde transportfamilie                                                           |
| 5   | `normalizeConfig`                 | Normaliseert `models.providers.<id>` vóór runtime-/providerresolutie                                                   | Aanbieder heeft configuratieopschoning nodig die bij de Plugin hoort; gebundelde Google-familiehelpers ondersteunen ook ondersteunde Google-configuraties |
| 6   | `applyNativeStreamingUsageCompat` | Past compat-herschrijvingen voor native streaminggebruik toe op configuratieproviders                                  | Aanbieder heeft endpointgestuurde metadatafixes voor native streaminggebruik nodig                                                                         |
| 7   | `resolveConfigApiKey`             | Lost auth via omgevingsmarkering voor configuratieproviders op vóór het laden van runtime-auth                         | Aanbieder heeft aanbiederbeheerde API-sleutelresolutie via omgevingsmarkering; `amazon-bedrock` heeft hier ook een ingebouwde AWS-omgevingsmarkeringresolver |
| 8   | `resolveSyntheticAuth`            | Maakt lokale/zelfgehoste of configuratiegedekte auth beschikbaar zonder platte tekst op te slaan                       | Aanbieder kan werken met een synthetische/lokale credentialmarkering                                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Legt aanbiederbeheerde externe auth-profielen erbovenop; standaard `persistence` is `runtime-only` voor CLI-/appbeheerde credentials | Aanbieder hergebruikt externe auth-credentials zonder gekopieerde refresh-tokens op te slaan; declareer `contracts.externalAuthProviders` in het manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Verlaagt opgeslagen synthetische profielplaceholders achter auth die door env/config wordt gedekt                      | Aanbieder slaat synthetische placeholderprofielen op die geen voorrang mogen krijgen                                                                       |
| 11  | `resolveDynamicModel`             | Synchrone fallback voor aanbiederbeheerde model-id's die nog niet in het lokale register staan                         | Aanbieder accepteert willekeurige upstream model-id's                                                                                                      |
| 12  | `prepareDynamicModel`             | Asynchrone warm-up, waarna `resolveDynamicModel` opnieuw draait                                                        | Aanbieder heeft netwerkmetadata nodig voordat onbekende id's worden opgelost                                                                               |
| 13  | `normalizeResolvedModel`          | Laatste herschrijving voordat de embedded runner het opgeloste model gebruikt                                          | Aanbieder heeft transportherschrijvingen nodig maar gebruikt nog steeds een core-transport                                                                 |
| 14  | `contributeResolvedModelCompat`   | Draagt compat-flags bij voor vendormodellen achter een ander compatibel transport                                      | Aanbieder herkent eigen modellen op proxytransports zonder de provider over te nemen                                                                       |
| 15  | `normalizeToolSchemas`            | Normaliseert toolschema's voordat de embedded runner ze ziet                                                           | Aanbieder heeft schema-opschoning per transportfamilie nodig                                                                                               |
| 16  | `inspectToolSchemas`              | Toont aanbiederbeheerde schemadiagnostiek na normalisatie                                                              | Aanbieder wil trefwoordwaarschuwingen zonder core providerspecifieke regels te leren                                                                       |
| 17  | `resolveReasoningOutputMode`      | Selecteert native versus tagged contract voor reasoning-output                                                         | Aanbieder heeft tagged reasoning/finale uitvoer nodig in plaats van native velden                                                                          |
| 18  | `prepareExtraParams`              | Normalisatie van aanvraagparameters vóór generieke streamoptiewrappers                                                | Aanbieder heeft standaard aanvraagparameters of opschoning van parameters per aanbieder nodig                                                              |
| 19  | `createStreamFn`                  | Vervangt het normale streampad volledig door een aangepast transport                                                   | Aanbieder heeft een aangepast wire-protocol nodig, niet alleen een wrapper                                                                                 |
| 20  | `wrapStreamFn`                    | Streamwrapper nadat generieke wrappers zijn toegepast                                                                  | Aanbieder heeft wrappers voor aanvraagheaders/body/modelcompatibiliteit nodig zonder aangepast transport                                                   |
| 21  | `resolveTransportTurnState`       | Koppelt native per-turn transportheaders of metadata                                                                   | Aanbieder wil dat generieke transports aanbieder-native turn-identiteit meesturen                                                                          |
| 22  | `resolveWebSocketSessionPolicy`   | Koppelt native WebSocket-headers of sessie-afkoelbeleid                                                                | Aanbieder wil dat generieke WS-transports sessieheaders of fallbackbeleid afstemmen                                                                        |
| 23  | `formatApiKey`                    | Formatter voor auth-profiel: opgeslagen profiel wordt de runtime-`apiKey`-string                                       | Aanbieder slaat extra auth-metadata op en heeft een aangepaste runtime-tokenvorm nodig                                                                     |
| 24  | `refreshOAuth`                    | OAuth-refresh-override voor aangepaste refresh-endpoints of refresh-faalbeleid                                        | Aanbieder past niet bij de gedeelde `pi-ai`-refreshers                                                                                                     |
| 25  | `buildAuthDoctorHint`             | Reparatiehint die wordt toegevoegd wanneer OAuth-refresh mislukt                                                       | Aanbieder heeft aanbiederbeheerde auth-reparatiebegeleiding nodig na refresh-falen                                                                         |
| 26  | `matchesContextOverflowError`     | Aanbiederbeheerde matcher voor contextvensteroverloop                                                                  | Aanbieder heeft ruwe overloopfouten die generieke heuristiek zou missen                                                                                    |
| 27  | `classifyFailoverReason`          | Aanbiederbeheerde classificatie van failoverreden                                                                      | Aanbieder kan ruwe API-/transportfouten mappen naar rate-limit/overload/etc                                                                                |
| 28  | `isCacheTtlEligible`              | Prompt-cachebeleid voor proxy-/backhaul-aanbieders                                                                    | Aanbieder heeft proxyspecifieke cache-TTL-gating nodig                                                                                                     |
| 29  | `buildMissingAuthMessage`         | Vervanging voor het generieke herstelbericht bij ontbrekende auth                                                      | Aanbieder heeft een providerspecifieke herstelhint voor ontbrekende auth nodig                                                                             |
| 30  | `augmentModelCatalog`             | Synthetische/finale catalogusrijen die na discovery worden toegevoegd                                                  | Aanbieder heeft synthetische forward-compat-rijen nodig in `models list` en pickers                                                                        |
| 31  | `resolveThinkingProfile`          | Modelspecifieke `/think`-niveauset, weergavelabels en standaardwaarde                                                  | Aanbieder biedt een aangepaste thinking-ladder of binair label voor geselecteerde modellen                                                                 |
| 32  | `isBinaryThinking`                | Compatibiliteitshook voor aan/uit-reasoning-toggle                                                                     | Aanbieder biedt alleen binair thinking aan/uit                                                                                                             |
| 33  | `supportsXHighThinking`           | Compatibiliteitshook voor `xhigh`-reasoningondersteuning                                                               | Aanbieder wil `xhigh` alleen op een subset van modellen                                                                                                    |
| 34  | `resolveDefaultThinkingLevel`     | Compatibiliteitshook voor standaard `/think`-niveau                                                                    | Aanbieder beheert standaard `/think`-beleid voor een modelfamilie                                                                                          |
| 35  | `isModernModelRef`                | Matcher voor moderne modellen voor live-profielfilters en rookselectie                                                 | Aanbieder beheert live-/rookmatching voor voorkeursmodellen                                                                                                |
| 36  | `prepareRuntimeAuth`              | Wisselt een geconfigureerde credential om naar het daadwerkelijke runtime-token/de daadwerkelijke runtime-sleutel vlak vóór inference | Aanbieder heeft een tokenuitwisseling of kortlevende aanvraagcredential nodig                                                                              |
| 37  | `resolveUsageAuth`                | Gebruik-/facturatiecredentials voor `/usage` en gerelateerde statusinterfaces oplossen                                     | Aanbieder heeft aangepaste parsing van gebruiks-/quotatokens nodig of een andere gebruikscredential                                                               |
| 38  | `fetchUsageSnapshot`              | Aanbiederspecifieke snapshots van gebruik/quota ophalen en normaliseren nadat auth is opgelost                             | Aanbieder heeft een aanbiederspecifiek gebruikseindpunt of payloadparser nodig                                                                           |
| 39  | `createEmbeddingProvider`         | Een door de aanbieder beheerde embeddingadapter bouwen voor geheugen/zoeken                                                     | Gedrag voor geheugenembeddings hoort bij de providerplugin                                                                                    |
| 40  | `buildReplayPolicy`               | Een replaybeleid retourneren dat transcriptafhandeling voor de aanbieder beheert                                        | Aanbieder heeft aangepast transcriptbeleid nodig (bijvoorbeeld het verwijderen van denkblokken)                                                               |
| 41  | `sanitizeReplayHistory`           | Replaygeschiedenis herschrijven na generieke transcriptopschoning                                                        | Aanbieder heeft aanbiederspecifieke replayherschrijvingen nodig naast gedeelde Compaction-helpers                                                             |
| 42  | `validateReplayTurns`             | Laatste validatie of hervorming van replaybeurten vóór de ingebedde uitvoerder                                           | Aanbiederstransport heeft strengere beurtvalidatie nodig na generieke opschoning                                                                    |
| 43  | `onModelSelected`                 | Door de aanbieder beheerde neveneffecten na selectie uitvoeren                                                                 | Aanbieder heeft telemetrie of door de aanbieder beheerde status nodig wanneer een model actief wordt                                                                  |

`normalizeModelId`, `normalizeTransport` en `normalizeConfig` controleren eerst de
overeenkomende provider-plugin en vallen daarna terug op andere provider-plugins
met hook-ondersteuning, totdat er daadwerkelijk een de model-id of transport/config
wijzigt. Dat houdt alias-/compat-provider-shims werkend zonder dat de aanroeper
hoeft te weten welke gebundelde plugin de herschrijving bezit. Als geen provider-hook
een ondersteunde Google-familieconfiguratievermelding herschrijft, past de
gebundelde Google-configuratienormalisatie die compatibiliteitsopschoning nog steeds
toe.

Als de provider een volledig aangepast wire-protocol of een aangepaste requestexecutor
nodig heeft, is dat een andere klasse extensie. Deze hooks zijn bedoeld voor
provider-gedrag dat nog steeds op OpenClaw's normale inference-loop draait.

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

Gebundelde provider-plugins combineren de hooks hierboven om aan te sluiten op de
catalogus-, auth-, thinking-, replay- en gebruiksbehoeften van elke leverancier. De
gezaghebbende hookset staat bij elke plugin onder `extensions/`; deze pagina
illustreert de vormen in plaats van de lijst te spiegelen.

<AccordionGroup>
  <Accordion title="Pass-through-catalogusproviders">
    OpenRouter, Kilocode, Z.AI, xAI registreren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, zodat ze upstream
    model-id's kunnen tonen vóór OpenClaw's statische catalogus.
  </Accordion>
  <Accordion title="OAuth- en gebruikseindpuntproviders">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai koppelen
    `prepareRuntimeAuth` of `formatApiKey` aan `resolveUsageAuth` +
    `fetchUsageSnapshot` om tokenuitwisseling en `/usage`-integratie te beheren.
  </Accordion>
  <Accordion title="Replay- en transcriptopschoningsfamilies">
    Gedeelde benoemde families (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) laten providers zich
    via `buildReplayPolicy` aanmelden voor transcriptbeleid, in plaats van dat
    elke plugin de opschoning opnieuw implementeert.
  </Accordion>
  <Accordion title="Providers met alleen catalogus">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` en
    `volcengine` registreren alleen `catalog` en gebruiken de gedeelde
    inference-loop.
  </Accordion>
  <Accordion title="Anthropic-specifieke streamhelpers">
    Beta-headers, `/fast` / `serviceTier` en `context1m` staan binnen de
    publieke `api.ts` / `contract-api.ts`-seam van de Anthropic-plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) in plaats van in
    de generieke SDK.
  </Accordion>
</AccordionGroup>

## Runtimehelpers

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

Notities:

- `textToSpeech` retourneert de normale core TTS-outputpayload voor bestands-/spraaknotitieoppervlakken.
- Gebruikt de core-configuratie `messages.tts` en providerselectie.
- Retourneert PCM-audiobuffer + samplefrequentie. Plugins moeten resamplen/encoderen voor providers.
- `listVoices` is optioneel per provider. Gebruik dit voor stemkiezers of setupflows die eigendom zijn van de leverancier.
- Stemlijsten kunnen rijkere metadata bevatten, zoals locale, gender en persoonlijkheidstags voor providerbewuste kiezers.
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

Notities:

- Houd TTS-beleid, fallback en antwoordbezorging in core.
- Gebruik spraakproviders voor synthesegedrag dat eigendom is van de leverancier.
- Legacy Microsoft `edge`-invoer wordt genormaliseerd naar de provider-id `microsoft`.
- Het voorkeursmodel voor eigenaarschap is bedrijfsgericht: een leveranciersplugin kan
  tekst-, spraak-, beeld- en toekomstige mediaproviders beheren naarmate OpenClaw die
  capability-contracten toevoegt.

Voor begrip van beeld/audio/video registreren plugins een getypeerde
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

Notities:

- Houd orchestratie, fallback, configuratie en channel-wiring in core.
- Houd leveranciersgedrag in de provider-plugin.
- Additieve uitbreiding moet getypeerd blijven: nieuwe optionele methoden, nieuwe optionele
  resultaatvelden, nieuwe optionele capabilities.
- Videogeneratie volgt al hetzelfde patroon:
  - core bezit het capability-contract en de runtimehelper
  - leveranciersplugins registreren `api.registerVideoGenerationProvider(...)`
  - feature-/channel-plugins gebruiken `api.runtime.videoGeneration.*`

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

Voor audiotranscriptie kunnen plugins de media-understanding-runtime of de oudere STT-alias gebruiken:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notities:

- `api.runtime.mediaUnderstanding.*` is het geprefereerde gedeelde oppervlak voor
  begrip van beeld/audio/video.
- `extractStructuredWithModel(...)` is de plugin-gerichte seam voor begrensde
  provider-owned image-first extraction. Neem ten minste één beeldinvoer op;
  tekstinvoer is aanvullende context.
  productplugins bezitten hun routes en schema's, terwijl OpenClaw de
  provider-/runtimegrens bezit.
- Gebruikt de core-audioconfiguratie voor media-understanding (`tools.media.audio`) en de fallbackvolgorde van providers.
- Retourneert `{ text: undefined }` wanneer er geen transcriptie-output wordt geproduceerd (bijvoorbeeld overgeslagen/niet-ondersteunde invoer).
- `api.runtime.stt.transcribeAudioFile(...)` blijft bestaan als compatibiliteitsalias.

Plugins kunnen ook subagent-runs op de achtergrond starten via `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notities:

- `provider` en `model` zijn optionele overrides per run, geen persistente sessiewijzigingen.
- OpenClaw honoreert die override-velden alleen voor vertrouwde aanroepers.
- Voor plugin-owned fallback-runs moeten operators zich aanmelden met `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gebruik `plugins.entries.<id>.subagent.allowedModels` om vertrouwde plugins te beperken tot specifieke canonieke `provider/model`-targets, of `"*"` om elk target expliciet toe te staan.
- Subagent-runs van niet-vertrouwde plugins werken nog steeds, maar override-verzoeken worden afgewezen in plaats van stil terug te vallen.
- Door plugins gemaakte subagent-sessies worden getagd met de id van de aanmakende plugin. Fallback `api.runtime.subagent.deleteSession(...)` mag alleen die eigen sessies verwijderen; willekeurige sessieverwijdering vereist nog steeds een admin-scoped Gateway-verzoek.

Voor webzoekopdrachten kunnen plugins de gedeelde runtimehelper gebruiken in plaats van
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

Plugins kunnen ook web-search-providers registreren via
`api.registerWebSearchProvider(...)`.

Notities:

- Houd providerselectie, credentialresolutie en gedeelde requestsemantiek in core.
- Gebruik web-search-providers voor leveranciersspecifieke zoektransporten.
- `api.runtime.webSearch.*` is het geprefereerde gedeelde oppervlak voor feature-/channel-plugins die zoekgedrag nodig hebben zonder afhankelijk te zijn van de agent-tool-wrapper.

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

- `generate(...)`: genereer een afbeelding met de geconfigureerde providerketen voor image-generation.
- `listProviders(...)`: vermeld beschikbare image-generation-providers en hun capabilities.

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
- `auth`: verplicht. Gebruik `"gateway"` om normale Gateway-auth te vereisen, of `"plugin"` voor door plugins beheerde auth/Webhook-verificatie.
- `match`: optioneel. `"exact"` (standaard) of `"prefix"`.
- `replaceExisting`: optioneel. Staat dezelfde plugin toe om zijn eigen bestaande routeregistratie te vervangen.
- `handler`: retourneer `true` wanneer de route het verzoek heeft afgehandeld.

Notities:

- `api.registerHttpHandler(...)` is verwijderd en veroorzaakt een Plugin-laadfout. Gebruik in plaats daarvan `api.registerHttpRoute(...)`.
- Plugin-routes moeten `auth` expliciet declareren.
- Exacte `path + match`-conflicten worden geweigerd tenzij `replaceExisting: true`, en één Plugin kan de route van een andere Plugin niet vervangen.
- Overlappende routes met verschillende `auth`-niveaus worden geweigerd. Houd `exact`/`prefix`-fallthroughketens alleen op hetzelfde auth-niveau.
- `auth: "plugin"`-routes ontvangen **niet** automatisch runtime-scopes van operators. Ze zijn bedoeld voor door Plugins beheerde webhooks/handtekeningverificatie, niet voor bevoorrechte Gateway-helperaanroepen.
- `auth: "gateway"`-routes draaien binnen een runtime-scope van een Gateway-verzoek, maar die scope is bewust conservatief:
  - shared-secret bearer-auth (`gateway.auth.mode = "token"` / `"password"`) houdt runtime-scopes van Plugin-routes vastgezet op `operator.write`, zelfs als de aanroeper `x-openclaw-scopes` meestuurt
  - vertrouwde identity-dragende HTTP-modi (bijvoorbeeld `trusted-proxy` of `gateway.auth.mode = "none"` op een private ingress) respecteren `x-openclaw-scopes` alleen wanneer de header expliciet aanwezig is
  - als `x-openclaw-scopes` ontbreekt op die identity-dragende Plugin-routeverzoeken, valt de runtime-scope terug op `operator.write`
- Praktische regel: ga er niet van uit dat een gateway-auth Plugin-route een impliciet admin-oppervlak is. Als je route gedrag vereist dat alleen voor admins is, vereis dan een identity-dragende auth-modus en documenteer het expliciete `x-openclaw-scopes`-headercontract.

## Importpaden voor de Plugin SDK

Gebruik smalle SDK-subpaden in plaats van het monolithische `openclaw/plugin-sdk`-rootbarrel
wanneer je nieuwe Plugins maakt. Kernsubpaden:

| Subpad                              | Doel                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitieven voor Plugin-registratie                |
| `openclaw/plugin-sdk/channel-core`  | Helpers voor kanaalinvoer/-bouw                    |
| `openclaw/plugin-sdk/core`          | Generieke gedeelde helpers en overkoepelend contract |
| `openclaw/plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema (`OpenClawSchema`) |

Kanaal-Plugins kiezen uit een familie van smalle naden — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` en `channel-actions`. Goedkeuringsgedrag moet worden geconsolideerd
op één `approvalCapability`-contract in plaats van te mengen over niet-gerelateerde
Plugin-velden. Zie [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins).

Runtime- en configuratiehelpers staan onder overeenkomende gefocuste `*-runtime`-subpaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, enz.). Geef de voorkeur aan `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation`
in plaats van de brede `config-runtime`-compatibiliteitsbarrel.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
en `openclaw/plugin-sdk/infra-runtime` zijn verouderde compatibiliteitsshims voor
oudere Plugins. Nieuwe code moet in plaats daarvan smallere generieke primitieven importeren.
</Info>

Repo-interne ingangspunten (per root van gebundeld Plugin-pakket):

- `index.js` — gebundelde Plugin-entry
- `api.js` — helper/types-barrel
- `runtime-api.js` — alleen-runtime-barrel
- `setup-entry.js` — setup-Plugin-entry

Externe Plugins mogen alleen `openclaw/plugin-sdk/*`-subpaden importeren. Importeer nooit
`src/*` van een ander Plugin-pakket vanuit core of vanuit een andere Plugin.
Via een facade geladen ingangspunten geven de voorkeur aan de actieve runtime-configuratiesnapshot wanneer die
bestaat, en vallen daarna terug op het opgeloste configuratiebestand op schijf.

Capability-specifieke subpaden zoals `image-generation`, `media-understanding`
en `speech` bestaan omdat gebundelde Plugins ze vandaag gebruiken. Het zijn niet
automatisch langdurig bevroren externe contracten — controleer de relevante SDK-
referentiepagina wanneer je erop vertrouwt.

## Schema's voor berichttools

Plugins moeten eigenaar zijn van kanaalspecifieke `describeMessageTool(...)`-schema-
bijdragen voor niet-berichtprimitieven zoals reacties, gelezen-statussen en polls.
Gedeelde verzendpresentatie moet het generieke `MessagePresentation`-contract gebruiken
in plaats van provider-native knop-, component-, blok- of kaartvelden.
Zie [Berichtpresentatie](/nl/plugins/message-presentation) voor het contract,
fallbackregels, provider-mapping en de checklist voor Plugin-auteurs.

Plugins die kunnen verzenden declareren wat ze kunnen renderen via berichtcapabilities:

- `presentation` voor semantische presentatieblokken (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` voor aanvragen voor vastgezette levering

Core beslist of de presentatie native wordt gerenderd of wordt teruggebracht tot tekst.
Stel geen provider-native UI-uitwegen beschikbaar vanuit de generieke berichttool.
Verouderde SDK-helpers voor legacy native schema's blijven geëxporteerd voor bestaande
third-party Plugins, maar nieuwe Plugins moeten ze niet gebruiken.

## Kanaaltarget-resolutie

Kanaal-Plugins moeten eigenaar zijn van kanaalspecifieke targetsemantiek. Houd de gedeelde
uitgaande host generiek en gebruik het messaging-adapteroppervlak voor providerregels:

- `messaging.inferTargetChatType({ to })` beslist of een genormaliseerd target
  moet worden behandeld als `direct`, `group` of `channel` vóór directory-lookup.
- `messaging.targetResolver.looksLikeId(raw, normalized)` vertelt core of een
  invoer direct naar id-achtige resolutie moet gaan in plaats van directory-zoekopdracht.
- `messaging.targetResolver.resolveTarget(...)` is de Plugin-fallback wanneer
  core een laatste provider-eigen resolutie nodig heeft na normalisatie of na een
  directory-mis.
- `messaging.resolveOutboundSessionRoute(...)` is eigenaar van provider-specifieke sessie-
  routeconstructie zodra een target is opgelost.

Aanbevolen verdeling:

- Gebruik `inferTargetChatType` voor categoriebeslissingen die moeten gebeuren vóór
  het zoeken naar peers/groepen.
- Gebruik `looksLikeId` voor controles "behandel dit als een expliciet/native target-id".
- Gebruik `resolveTarget` voor provider-specifieke normalisatie-fallback, niet voor
  brede directory-zoekopdracht.
- Houd provider-native id's zoals chat-id's, thread-id's, JID's, handles en room-
  id's binnen `target`-waarden of provider-specifieke params, niet in generieke SDK-
  velden.

## Configuratiegedreven directories

Plugins die directory-items uit configuratie afleiden, moeten die logica in de
Plugin houden en de gedeelde helpers uit
`openclaw/plugin-sdk/directory-runtime` hergebruiken.

Gebruik dit wanneer een kanaal configuratiegedreven peers/groepen nodig heeft, zoals:

- door een allowlist gestuurde DM-peers
- geconfigureerde kanaal-/groepsmaps
- account-scoped statische directory-fallbacks

De gedeelde helpers in `directory-runtime` verwerken alleen generieke bewerkingen:

- queryfiltering
- limiettoepassing
- deduplicatie-/normalisatiehelpers
- `ChannelDirectoryEntry[]` bouwen

Kanaalspecifieke accountinspectie en id-normalisatie moeten in de
Plugin-implementatie blijven.

## Providercatalogi

Provider-Plugins kunnen modelcatalogi voor inferentie definiëren met
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retourneert dezelfde vorm die OpenClaw naar
`models.providers` schrijft:

- `{ provider }` voor één provider-item
- `{ providers }` voor meerdere provider-items

Gebruik `catalog` wanneer de Plugin eigenaar is van provider-specifieke model-id's, basis-URL-
defaults of door auth afgeschermde modelmetadata.

`catalog.order` bepaalt wanneer de catalogus van een Plugin wordt samengevoegd ten opzichte van OpenClaw's
ingebouwde impliciete providers:

- `simple`: gewone API-key- of env-gestuurde providers
- `profile`: providers die verschijnen wanneer auth-profielen bestaan
- `paired`: providers die meerdere gerelateerde provider-items synthetiseren
- `late`: laatste pass, na andere impliciete providers

Latere providers winnen bij key-conflicten, zodat Plugins bewust een ingebouwd
provider-item met hetzelfde provider-id kunnen overschrijven.

Plugins kunnen ook read-only modelrijen publiceren via
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Dit is het voorwaartse pad voor lijst-/help-/picker-oppervlakken en ondersteunt
`text`-, `image_generation`-, `video_generation`- en `music_generation`-rijen.
Provider-Plugins blijven eigenaar van live endpoint-aanroepen, tokenuitwisseling en vendor-
responsemapping; core is eigenaar van de gemeenschappelijke rijvorm, bronlabels en media-tool-
helpformattering. Registraties van media-generation-providers synthetiseren automatisch statische
catalogusrijen uit `defaultModel`, `models` en `capabilities`.

Compatibiliteit:

- `discovery` werkt nog steeds als legacy alias, maar geeft een deprecation-waarschuwing
- als zowel `catalog` als `discovery` zijn geregistreerd, gebruikt OpenClaw `catalog`
- `augmentModelCatalog` is deprecated; gebundelde providers moeten aanvullende
  rijen publiceren via `registerModelCatalogProvider`

## Read-only kanaalinspectie

Als je Plugin een kanaal registreert, implementeer dan bij voorkeur
`plugin.config.inspectAccount(cfg, accountId)` naast `resolveAccount(...)`.

Waarom:

- `resolveAccount(...)` is het runtimepad. Het mag ervan uitgaan dat credentials
  volledig gematerialiseerd zijn en kan snel falen wanneer vereiste secrets ontbreken.
- Read-only commandopaden zoals `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` en doctor/config-
  repairflows zouden runtime-credentials niet hoeven te materialiseren alleen om
  configuratie te beschrijven.

Aanbevolen `inspectAccount(...)`-gedrag:

- Retourneer alleen beschrijvende accountstatus.
- Behoud `enabled` en `configured`.
- Neem credential-bron-/statusvelden op wanneer relevant, zoals:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Je hoeft geen ruwe tokenwaarden te retourneren alleen om read-only
  beschikbaarheid te rapporteren. `tokenStatus: "available"` retourneren (en het overeenkomende bron-
  veld) is genoeg voor status-achtige commands.
- Gebruik `configured_unavailable` wanneer een credential is geconfigureerd via SecretRef maar
  niet beschikbaar is in het huidige commandopad.

Hierdoor kunnen read-only commands "geconfigureerd maar niet beschikbaar in dit commandopad"
rapporteren in plaats van te crashen of het account ten onrechte als niet geconfigureerd te rapporteren.

## Pakketpacks

Een Plugin-directory kan een `package.json` bevatten met `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Elk item wordt een Plugin. Als het pack meerdere extensions vermeldt, wordt het Plugin-id
`name/<fileBase>`.

Als je Plugin npm-deps importeert, installeer ze dan in die directory zodat
`node_modules` beschikbaar is (`npm install` / `pnpm install`).

Beveiligingsguardrail: elk `openclaw.extensions`-item moet binnen de Plugin-
directory blijven na symlink-resolutie. Items die uit de pakketdirectory ontsnappen, worden
geweigerd.

Beveiligingsopmerking: `openclaw plugins install` installeert Plugin-dependencies met een
project-lokale `npm install --omit=dev --ignore-scripts` (geen lifecycle-scripts,
geen dev-dependencies tijdens runtime), waarbij geërfde globale npm-installatie-instellingen worden genegeerd.
Houd dependency-trees van Plugins "pure JS/TS" en vermijd pakketten die
`postinstall`-builds vereisen.

Optioneel: `openclaw.setupEntry` kan wijzen naar een lichtgewicht module die alleen voor setup is.
Wanneer OpenClaw setup-oppervlakken nodig heeft voor een uitgeschakelde kanaal-Plugin, of
wanneer een kanaal-Plugin is ingeschakeld maar nog niet is geconfigureerd, laadt het `setupEntry`
in plaats van de volledige Plugin-entry. Dit houdt startup en setup lichter
wanneer je hoofd-Plugin-entry ook tools, hooks of andere alleen-runtime-
code bedraadt.

Optioneel: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kan een kanaal-Plugin laten kiezen voor hetzelfde `setupEntry`-pad tijdens de pre-listen-
startupfase van de Gateway, zelfs wanneer het kanaal al is geconfigureerd.

Gebruik dit alleen wanneer `setupEntry` het opstartoppervlak dat moet bestaan
voordat de Gateway begint te luisteren volledig afdekt. In de praktijk betekent
dit dat de setup-entry elke kanaal-eigen capability moet registreren waarvan het
opstarten afhankelijk is, zoals:

- kanaalregistratie zelf
- alle HTTP-routes die beschikbaar moeten zijn voordat de Gateway begint te luisteren
- alle Gateway-methoden, tools of services die tijdens datzelfde venster moeten bestaan

Als je volledige entry nog steeds eigenaar is van een vereiste opstart-capability,
schakel deze vlag dan niet in. Houd de Plugin op het standaardgedrag en laat
OpenClaw de volledige entry laden tijdens het opstarten.

Gebundelde kanalen kunnen ook helpers voor setup-only contractoppervlakken
publiceren die core kan raadplegen voordat de volledige channel-runtime is
geladen. Het huidige oppervlak voor setup-promotie is:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core gebruikt dat oppervlak wanneer het een verouderde single-account
kanaalconfiguratie naar `channels.<id>.accounts.*` moet promoveren zonder de
volledige Plugin-entry te laden. Matrix is het huidige gebundelde voorbeeld: het
verplaatst alleen auth/bootstrap-sleutels naar een benoemd gepromoveerd account
wanneer benoemde accounts al bestaan, en het kan een geconfigureerde
niet-canonieke sleutel voor een standaardaccount behouden in plaats van altijd
`accounts.default` aan te maken.

Die setup-patchadapters houden de ontdekking van gebundelde contractoppervlakken
lazy. Importtijd blijft licht; het promotieoppervlak wordt pas bij het eerste
gebruik geladen, in plaats van gebundelde kanaalopstart opnieuw binnen te gaan
bij module-import.

Wanneer die opstartoppervlakken Gateway-RPC-methoden bevatten, houd ze dan op
een Plugin-specifiek prefix. Core-beheernamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd
naar `operator.admin` herleid, zelfs als een Plugin om een smallere scope vraagt.

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

### Metadata voor kanaalcatalogus

Kanaalplugins kunnen setup-/ontdekkingsmetadata adverteren via `openclaw.channel`
en installatietips via `openclaw.install`. Dit houdt de core-catalogus vrij van
data.

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
- `docsLabel`: linktekst voor de documentatielink overschrijven
- `preferOver`: Plugin-/kanaal-id's met lagere prioriteit die deze catalogus-entry moet overtreffen
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: copybesturing voor selectieoppervlakken
- `markdownCapable`: markeert het kanaal als markdown-capable voor beslissingen over uitgaande opmaak
- `exposure.configured`: verberg het kanaal voor overzichten van geconfigureerde kanalen wanneer ingesteld op `false`
- `exposure.setup`: verberg het kanaal voor interactieve setup-/configuratiekeuzelijsten wanneer ingesteld op `false`
- `exposure.docs`: markeer het kanaal als intern/privé voor documentatienavigatieoppervlakken
- `showConfigured` / `showInSetup`: verouderde aliassen die nog voor compatibiliteit worden geaccepteerd; geef de voorkeur aan `exposure`
- `quickstartAllowFrom`: laat het kanaal deelnemen aan de standaard quickstart-`allowFrom`-flow
- `forceAccountBinding`: vereis expliciete accountbinding, zelfs wanneer er maar één account bestaat
- `preferSessionLookupForAnnounceTarget`: geef de voorkeur aan sessieopzoeking bij het herleiden van aankondigingsdoelen

OpenClaw kan ook **externe kanaalcatalogi** samenvoegen (bijvoorbeeld een
MPM-registry-export). Plaats een JSON-bestand op een van de volgende locaties:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Of wijs `OPENCLAW_PLUGIN_CATALOG_PATHS` (of `OPENCLAW_MPM_CATALOG_PATHS`) naar
een of meer JSON-bestanden (gescheiden door komma's, puntkomma's of `PATH`).
Elk bestand moet `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` bevatten. De parser accepteert ook `"packages"` of `"plugins"` als verouderde aliassen voor de sleutel `"entries"`.

Gegenereerde kanaalcatalogusentries en providerinstallatiecatalogusentries tonen
genormaliseerde feiten over installatiebronnen naast het ruwe
`openclaw.install`-blok. De genormaliseerde feiten identificeren of de npm-spec
een exacte versie of floating selector is, of verwachte integriteitsmetadata
aanwezig zijn, en of er ook een lokaal bronpad beschikbaar is. Wanneer de
catalogus-/package-identiteit bekend is, waarschuwen de genormaliseerde feiten
als de geparsede npm-package-naam afwijkt van die identiteit. Ze waarschuwen ook
wanneer `defaultChoice` ongeldig is of naar een bron wijst die niet beschikbaar
is, en wanneer npm-integriteitsmetadata aanwezig zijn zonder een geldige
npm-bron. Consumenten moeten `installSource` behandelen als een additief
optioneel veld, zodat handmatig gebouwde entries en catalogusshims het niet
hoeven te synthetiseren. Hierdoor kunnen onboarding en diagnostiek de status van
het bronvlak uitleggen zonder Plugin-runtime te importeren.

Officiële externe npm-entries moeten de voorkeur geven aan een exacte `npmSpec`
plus `expectedIntegrity`. Kale packagenamen en dist-tags blijven werken voor
compatibiliteit, maar ze tonen waarschuwingen voor het bronvlak, zodat de
catalogus kan opschuiven naar vastgepinde installaties met integriteitscontrole
zonder bestaande plugins te breken. Wanneer onboarding installeert vanuit een
lokaal cataloguspad, registreert het een beheerde Plugin-indexentry met
`source: "path"` en waar mogelijk een workspace-relatief `sourcePath`. Het
absolute operationele laadpad blijft in `plugins.load.paths`; het
installatierecord voorkomt duplicatie van lokale workstationpaden in
langlevende configuratie. Dit houdt lokale ontwikkelinstallaties zichtbaar voor
diagnostiek van het bronvlak zonder een tweede ruw disclosure-oppervlak voor
bestandssysteempaden toe te voegen. De persistente Plugin-index
`plugins/installs.json` is de bron van waarheid voor installaties en kan worden
ververst zonder Plugin-runtime-modules te laden. De `installRecords`-map is
duurzaam, zelfs wanneer een Plugin-manifest ontbreekt of ongeldig is; de
`plugins`-array is een opnieuw opbouwbare manifestweergave.

## Context-engine-plugins

Context-engine-plugins zijn eigenaar van de orkestratie van sessiecontext voor
ingestie, assemblage en Compaction. Registreer ze vanuit je Plugin met
`api.registerContextEngine(id, factory)` en selecteer vervolgens de actieve
engine met `plugins.slots.contextEngine`.

Gebruik dit wanneer je Plugin de standaard contextpipeline moet vervangen of
uitbreiden, in plaats van alleen memory search of hooks toe te voegen.

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

De factory `ctx` exposeert optionele waarden `config`, `agentDir` en
`workspaceDir` voor initialisatie tijdens constructie.

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

Wanneer een Plugin gedrag nodig heeft dat niet in de huidige API past, omzeil
het Pluginsysteem dan niet met een private reach-in. Voeg de ontbrekende
capability toe.

Aanbevolen volgorde:

1. definieer het core-contract
   Bepaal welk gedeeld gedrag core moet bezitten: beleid, fallback, config merge,
   lifecycle, kanaalgerichte semantiek en de vorm van runtimehelpers.
2. voeg getypeerde Plugin-registratie-/runtimeoppervlakken toe
   Breid `OpenClawPluginApi` en/of `api.runtime` uit met het kleinste nuttige
   getypeerde capability-oppervlak.
3. bedraad core + kanaal-/featureconsumenten
   Kanalen en featureplugins moeten de nieuwe capability via core consumeren,
   niet door rechtstreeks een vendorimplementatie te importeren.
4. registreer vendorimplementaties
   Vendorplugins registreren vervolgens hun backends tegen de capability.
5. voeg contractdekking toe
   Voeg tests toe zodat eigenaarschap en registratievorm expliciet blijven in de tijd.

Zo blijft OpenClaw eigenzinnig zonder hardcoded te worden naar het wereldbeeld
van één provider. Zie het [Capability Cookbook](/nl/plugins/adding-capabilities)
voor een concrete bestandschecklist en uitgewerkt voorbeeld.

### Capability-checklist

Wanneer je een nieuwe capability toevoegt, moet de implementatie meestal deze
oppervlakken samen raken:

- core-contracttypen in `src/<capability>/types.ts`
- core-runner/runtimehelper in `src/<capability>/runtime.ts`
- Plugin-API-registratieoppervlak in `src/plugins/types.ts`
- Plugin-registrybedrading in `src/plugins/registry.ts`
- Plugin-runtimeblootstelling in `src/plugins/runtime/*` wanneer feature-/kanaalplugins die moeten consumeren
- capture-/testhelpers in `src/test-utils/plugin-registration.ts`
- eigenaarschap-/contractasserties in `src/plugins/contracts/registry.ts`
- operator-/Plugin-documentatie in `docs/`

Als een van die oppervlakken ontbreekt, is dat meestal een teken dat de
capability nog niet volledig geïntegreerd is.

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

- core bezit het capability-contract + orkestratie
- vendorplugins bezitten vendorimplementaties
- feature-/kanaalplugins consumeren runtimehelpers
- contracttests houden eigenaarschap expliciet

## Gerelateerd

- [Pluginarchitectuur](/nl/plugins/architecture) — publiek capabilitymodel en vormen
- [Plugin SDK-subpaden](/nl/plugins/sdk-subpaths)
- [Plugin SDK-setup](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
