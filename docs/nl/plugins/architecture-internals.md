---
read_when:
    - Runtimehooks voor providers, kanaallevenscyclus of pakketbundels implementeren
    - Plugin-laadvolgorde of registerstatus debuggen
    - Een nieuwe Plugin-mogelijkheid of contextengine-Plugin toevoegen
summary: 'Interne werking van de Plugin-architectuur: laadpijplijn, register, runtime-hooks, HTTP-routes en referentietabellen'
title: Interne werking van de Plugin-architectuur
x-i18n:
    generated_at: "2026-05-02T20:46:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Voor het publieke capability-model, Plugin-vormen en eigendoms-/uitvoeringscontracten, zie [Plugin-architectuur](/nl/plugins/architecture). Deze pagina is de referentie voor de interne werking: laadpipeline, register, runtime-hooks, Gateway HTTP-routes, importpaden en schematabellen.

## Laadpipeline

Bij het opstarten doet OpenClaw ongeveer dit:

1. kandidaat-Plugin-roots ontdekken
2. native of compatibele bundelmanifests en pakketmetadata lezen
3. onveilige kandidaten weigeren
4. Plugin-configuratie normaliseren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. inschakeling voor elke kandidaat bepalen
6. ingeschakelde native modules laden: gebouwde gebundelde modules gebruiken een native loader;
   lokale TypeScript-broncode van derden gebruikt de noodfallback Jiti
7. native `register(api)`-hooks aanroepen en registraties verzamelen in het Plugin-register
8. het register beschikbaar maken voor opdrachten/runtime-oppervlakken

<Note>
`activate` is een legacy-alias voor `register` — de loader gebruikt welke aanwezig is (`def.register ?? def.activate`) en roept die op hetzelfde punt aan. Alle gebundelde Plugins gebruiken `register`; geef voor nieuwe Plugins de voorkeur aan `register`.
</Note>

De veiligheidscontroles gebeuren **vóór** runtime-uitvoering. Kandidaten worden geblokkeerd
wanneer de entry buiten de Plugin-root valt, het pad world-writable is of het
padeigendom verdacht lijkt voor niet-gebundelde Plugins.

### Manifest-first gedrag

Het manifest is de control-plane-bron van waarheid. OpenClaw gebruikt het om:

- de Plugin te identificeren
- gedeclareerde kanalen/Skills/configuratieschema's of bundel-capabilities te ontdekken
- `plugins.entries.<id>.config` te valideren
- labels/placeholders in de Control UI aan te vullen
- installatie-/catalogusmetadata te tonen
- goedkope activerings- en setupbeschrijvingen te behouden zonder de Plugin-runtime te laden

Voor native Plugins is de runtimemodule het data-plane-deel. Die registreert
daadwerkelijk gedrag zoals hooks, tools, opdrachten of providerflows.

Optionele manifestblokken `activation` en `setup` blijven op de control plane.
Het zijn uitsluitend metadata-beschrijvingen voor activeringsplanning en setupdetectie;
ze vervangen runtime-registratie, `register(...)` of `setupEntry` niet.
De eerste live activeringsconsumenten gebruiken nu manifesthints voor opdrachten, kanalen en providers
om Plugin-laden te beperken vóór bredere materialisatie van het register:

- CLI-laden wordt beperkt tot Plugins die eigenaar zijn van de gevraagde primaire opdracht
- kanaalsetup/Plugin-resolutie wordt beperkt tot Plugins die eigenaar zijn van de gevraagde
  kanaal-id
- expliciete providersetup/runtime-resolutie wordt beperkt tot Plugins die eigenaar zijn van de gevraagde
  provider-id
- Gateway-opstartplanning gebruikt `activation.onStartup` voor expliciete opstartimports
  en opstart-opt-outs; Plugins zonder opstartmetadata laden alleen
  via nauwere activeringstriggers

Runtime-preloads tijdens requests die om de brede scope `all` vragen, leiden nog steeds een
expliciete effectieve set Plugin-id's af uit configuratie, opstartplanning, geconfigureerde
kanalen, slots en regels voor automatisch inschakelen. Als die afgeleide set leeg is, laadt OpenClaw
een leeg runtimeregister in plaats van te verbreden naar elke ontdekbare
Plugin.

De activeringsplanner biedt zowel een API met alleen id's voor bestaande callers als een
plan-API voor nieuwe diagnostiek. Planvermeldingen rapporteren waarom een Plugin is geselecteerd,
waarbij expliciete plannerhints uit `activation.*` worden gescheiden van manifest-eigenaarschap
als fallback, zoals `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` en hooks. Die scheiding in redenen is de compatibiliteitsgrens:
bestaande Plugin-metadata blijft werken, terwijl nieuwe code brede hints
of fallbackgedrag kan detecteren zonder runtime-laadsemantiek te wijzigen.

Setupdetectie geeft nu de voorkeur aan id's die eigendom zijn van descriptors, zoals `setup.providers` en
`setup.cliBackends`, om kandidaat-Plugins te beperken voordat wordt teruggevallen op
`setup-api` voor Plugins die nog runtime-hooks tijdens setup nodig hebben. Providersetup-
lijsten gebruiken manifest `providerAuthChoices`, uit descriptors afgeleide setupkeuzes
en install-catalog-metadata zonder provider-runtime te laden. Expliciete
`setup.requiresRuntime: false` is een grens voor descriptor-only; een ontbrekende
`requiresRuntime` behoudt de legacy fallback naar setup-api voor compatibiliteit. Als meer
dan één ontdekte Plugin dezelfde genormaliseerde setupprovider- of CLI-
backend-id claimt, weigert setuplookup de ambigue eigenaar in plaats van te vertrouwen op
ontdekkingsvolgorde. Wanneer setup-runtime wel wordt uitgevoerd, rapporteert registerdiagnostiek
afwijkingen tussen `setup.providers` / `setup.cliBackends` en de providers of CLI-
backends die door setup-api zijn geregistreerd zonder legacy Plugins te blokkeren.

### Plugin-cachegrens

OpenClaw cachet Plugin-detectieresultaten of directe manifestregister-
data niet achter tijdvensters op basis van de klok. Installaties, manifestbewerkingen en wijzigingen
in laadpaden moeten zichtbaar worden bij de volgende expliciete metadatalezing of snapshotrebuild.
De manifestbestandparser mag een begrensde bestandssignatuurcache bijhouden op basis van het
geopende manifestpad, inode, grootte en tijdstempels; die cache voorkomt alleen
het opnieuw parsen van ongewijzigde bytes en mag geen detectie-, register-, eigenaar- of
policy-antwoorden cachen.

Het veilige snelle pad voor metadata is expliciet objecteigendom, geen verborgen cache.
Hete paden tijdens Gateway-opstart zouden de huidige `PluginMetadataSnapshot`, de
afgeleide `PluginLookUpTable` of een expliciet manifestregister door de call
chain moeten doorgeven. Configuratievalidatie, automatisch inschakelen bij opstarten, Plugin-bootstrap en provider-
selectie kunnen die objecten hergebruiken zolang ze de huidige configuratie en
Plugin-inventaris vertegenwoordigen. Setuplookup reconstrueert manifestmetadata nog steeds op aanvraag,
tenzij het specifieke setuppad een expliciet manifestregister ontvangt; houd dat
als cold-path fallback in plaats van verborgen lookupcaches toe te voegen. Wanneer de invoer
wijzigt, bouw en vervang de snapshot in plaats van die te muteren of
historische kopieën te bewaren.
Views over het actieve Plugin-register en bootstraphelpers voor gebundelde kanalen
moeten opnieuw worden berekend op basis van het huidige register/de huidige root. Kortlevende maps zijn prima
binnen één call om werk te dedupliceren of re-entry te bewaken; ze mogen geen proces-
metadatacaches worden.

Voor Plugin-laden is runtime-laden de persistente cachelaag. Die mag
loaderstatus hergebruiken wanneer code of geïnstalleerde artefacten daadwerkelijk worden geladen, zoals:

- `PluginLoaderCacheState` en compatibele actieve runtimeregisters
- jiti-/modulecaches en public-surface loadercaches die worden gebruikt om te voorkomen dat
  hetzelfde runtime-oppervlak herhaaldelijk wordt geïmporteerd
- bestandssysteemcaches voor geïnstalleerde Plugin-artefacten
- kortlevende per-call maps voor padnormalisatie of dubbele resolutie

Die caches zijn implementatiedetails van de data plane. Ze mogen geen
control-plane-vragen beantwoorden zoals "welke Plugin is eigenaar van deze provider?", tenzij de
caller bewust om runtime-laden heeft gevraagd.

Voeg geen persistente caches of klokgebaseerde caches toe voor:

- detectieresultaten
- directe manifestregisters
- manifestregisters die worden gereconstrueerd uit de geïnstalleerde Plugin-index
- lookups van providereigenaarschap, modelonderdrukking, providerpolicy of public-artifact-
  metadata
- elk ander uit het manifest afgeleid antwoord waarbij een gewijzigd manifest, een geïnstalleerde index
  of laadpad zichtbaar moet zijn bij de volgende metadatalezing

Callers die manifestmetadata opnieuw opbouwen uit de persistente geïnstalleerde Plugin-
index reconstrueren dat register op aanvraag. De geïnstalleerde index is duurzame
source-plane-status; het is geen verborgen in-process metadatacache.

## Registermodel

Geladen Plugins muteren geen willekeurige core-globals rechtstreeks. Ze registreren in een
centraal Plugin-register.

Het register volgt:

- Plugin-records (identiteit, bron, oorsprong, status, diagnostiek)
- tools
- legacy hooks en getypeerde hooks
- kanalen
- providers
- gateway RPC-handlers
- HTTP-routes
- CLI-registrars
- achtergrondservices
- opdrachten die eigendom zijn van Plugins

Core-features lezen vervolgens uit dat register in plaats van rechtstreeks met Plugin-modules
te praten. Dit houdt laden eenrichtingsverkeer:

- Plugin-module -> registerregistratie
- core-runtime -> registerconsumptie

Die scheiding is belangrijk voor onderhoudbaarheid. Het betekent dat de meeste core-oppervlakken slechts
één integratiepunt nodig hebben: "lees het register", niet "maak een uitzondering voor elke Plugin-
module".

## Callbacks voor gespreksbindingen

Plugins die een gesprek binden, kunnen reageren wanneer een goedkeuring is afgehandeld.

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

Deze callback is alleen een notificatie. Hij verandert niet wie een
gesprek mag binden, en hij draait nadat de core-afhandeling van goedkeuringen is voltooid.

## Runtime-hooks voor providers

Provider-Plugins hebben drie lagen:

- **Manifestmetadata** voor goedkope lookup vóór runtime:
  `setup.providers[].envVars`, verouderde compatibiliteit `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` en `channelEnvVars`.
- **Hooks tijdens config**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`.
- **Runtime-hooks**: meer dan 40 optionele hooks voor auth, modelresolutie,
  streamwrapping, denkniveaus, replaypolicy en gebruiksendpoints. Zie
  de volledige lijst onder [Hookvolgorde en gebruik](#hook-order-and-usage).

OpenClaw blijft eigenaar van de generieke agentloop, failover, transcriptafhandeling en
toolpolicy. Deze hooks zijn het uitbreidingsoppervlak voor providerspecifiek
gedrag zonder een volledig aangepast inferencetransport nodig te hebben.

Gebruik manifest `setup.providers[].envVars` wanneer de provider env-gebaseerde
credentials heeft die generieke auth-/status-/modelpicker-paden moeten zien zonder
Plugin-runtime te laden. Verouderde `providerAuthEnvVars` wordt tijdens de
deprecatieperiode nog steeds gelezen door de compatibiliteitsadapter, en niet-gebundelde Plugins
die dit gebruiken, ontvangen een manifestdiagnostic. Gebruik manifest `providerAuthAliases`
wanneer één provider-id de env-vars, authprofielen,
config-backed auth en onboardingkeuze voor API-keys van een andere provider-id moet hergebruiken. Gebruik manifest
`providerAuthChoices` wanneer onboarding-/auth-choice CLI-oppervlakken de
keuze-id, groepslabels en eenvoudige auth-bedrading met één flag van de provider moeten kennen zonder
provider-runtime te laden. Houd provider-runtime
`envVars` voor operatorgerichte hints zoals onboardinglabels of OAuth-
setupvars voor client-id/client-secret.

Gebruik manifest `channelEnvVars` wanneer een kanaal env-gedreven auth of setup heeft die
generieke shell-env fallback, config-/statuscontroles of setupprompts moeten zien
zonder kanaal-runtime te laden.

### Hookvolgorde en gebruik

Voor model-/provider-Plugins roept OpenClaw hooks ongeveer in deze volgorde aan.
De kolom "Wanneer gebruiken" is de snelle beslisgids.
Compatibiliteitsvelden voor providers die OpenClaw niet meer aanroept, zoals
`ProviderPlugin.capabilities` en `suppressBuiltInModel`, worden hier bewust niet
vermeld.

| #   | Hook                              | Wat het doet                                                                                                   | Wanneer gebruiken                                                                                                                            |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publiceert providerconfiguratie naar `models.providers` tijdens het genereren van `models.json`                | Provider beheert een catalogus of standaardwaarden voor de basis-URL                                                                          |
| 2   | `applyConfigDefaults`             | Past globale standaardconfiguratie van de provider toe tijdens configuratiematerialisatie                      | Standaardwaarden hangen af van auth-modus, env of semantiek van de model-family van de provider                                               |
| --  | _(ingebouwde modelopzoeking)_     | OpenClaw probeert eerst het normale register-/cataloguspad                                                     | _(geen Plugin-hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | Normaliseert legacy- of preview-model-ID-aliassen vóór opzoeking                                               | Provider beheert aliasopschoning vóór canonieke modelresolutie                                                                               |
| 4   | `normalizeTransport`              | Normaliseert provider-family `api` / `baseUrl` vóór generieke modelassemblage                                  | Provider beheert transportopschoning voor aangepaste provider-ID's in dezelfde transport-family                                               |
| 5   | `normalizeConfig`                 | Normaliseert `models.providers.<id>` vóór runtime-/providerresolutie                                           | Provider heeft configuratieopschoning nodig die bij de Plugin hoort; gebundelde Google-family-helpers vormen ook een vangnet voor ondersteunde Google-configuratie-items |
| 6   | `applyNativeStreamingUsageCompat` | Past compat-herschrijvingen voor native streaminggebruik toe op configuratieproviders                          | Provider heeft endpoint-gestuurde fixes voor native metadata van streaminggebruik nodig                                                       |
| 7   | `resolveConfigApiKey`             | Lost env-marker-auth voor configuratieproviders op vóór het laden van runtime-auth                             | Provider heeft providerbeheerde env-marker-API-sleutelresolutie; `amazon-bedrock` heeft hier ook een ingebouwde AWS-env-markerresolver        |
| 8   | `resolveSyntheticAuth`            | Maakt lokale/zelfgehoste of configuratiegebaseerde auth beschikbaar zonder platte tekst persistent op te slaan | Provider kan werken met een synthetische/lokale credential-marker                                                                             |
| 9   | `resolveExternalAuthProfiles`     | Legt providerbeheerde externe auth-profielen eroverheen; standaard `persistence` is `runtime-only` voor CLI-/app-beheerde credentials | Provider hergebruikt externe auth-credentials zonder gekopieerde refresh-tokens persistent op te slaan; declareer `contracts.externalAuthProviders` in het manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Verlaagt opgeslagen synthetische profielplaceholders achter env-/configuratiegebaseerde auth                   | Provider slaat synthetische placeholderprofielen op die geen voorrang mogen krijgen                                                           |
| 11  | `resolveDynamicModel`             | Synchrone fallback voor providerbeheerde model-ID's die nog niet in het lokale register staan                  | Provider accepteert willekeurige upstream-model-ID's                                                                                          |
| 12  | `prepareDynamicModel`             | Async opwarmen, waarna `resolveDynamicModel` opnieuw wordt uitgevoerd                                          | Provider heeft netwerkmetadata nodig vóór het oplossen van onbekende ID's                                                                     |
| 13  | `normalizeResolvedModel`          | Laatste herschrijving voordat de ingesloten runner het opgeloste model gebruikt                                | Provider heeft transportherschrijvingen nodig maar gebruikt nog steeds een core-transport                                                     |
| 14  | `contributeResolvedModelCompat`   | Draagt compat-flags bij voor vendormodellen achter een ander compatibel transport                              | Provider herkent zijn eigen modellen op proxytransports zonder de provider over te nemen                                                      |
| 15  | `normalizeToolSchemas`            | Normaliseert toolschema's voordat de ingesloten runner ze ziet                                                 | Provider heeft schemaopschoning voor de transport-family nodig                                                                                |
| 16  | `inspectToolSchemas`              | Maakt providerbeheerde schemadiagnostiek zichtbaar na normalisatie                                             | Provider wil sleutelwoordwaarschuwingen zonder core providerspecifieke regels te leren                                                        |
| 17  | `resolveReasoningOutputMode`      | Selecteert native versus getagde reasoning-output-contract                                                     | Provider heeft getagde redenering/finale output nodig in plaats van native velden                                                             |
| 18  | `prepareExtraParams`              | Normalisatie van aanvraagparameters vóór generieke wrappers voor streamopties                                  | Provider heeft standaardaanvraagparameters of per-provider parameteropschoning nodig                                                          |
| 19  | `createStreamFn`                  | Vervangt het normale streampad volledig door een aangepast transport                                           | Provider heeft een aangepast wire-protocol nodig, niet alleen een wrapper                                                                     |
| 20  | `wrapStreamFn`                    | Streamwrapper nadat generieke wrappers zijn toegepast                                                          | Provider heeft compat-wrappers voor aanvraagheaders/body/model nodig zonder aangepast transport                                               |
| 21  | `resolveTransportTurnState`       | Koppelt native per-turn transportheaders of metadata                                                           | Provider wil dat generieke transports provider-native beurtidentiteit meesturen                                                               |
| 22  | `resolveWebSocketSessionPolicy`   | Koppelt native WebSocket-headers of sessieafkoelbeleid                                                         | Provider wil generieke WS-transports sessieheaders of fallbackbeleid laten afstemmen                                                          |
| 23  | `formatApiKey`                    | Auth-profielformatter: opgeslagen profiel wordt de runtime-`apiKey`-string                                     | Provider slaat extra auth-metadata op en heeft een aangepaste vorm voor runtime-tokens nodig                                                  |
| 24  | `refreshOAuth`                    | OAuth-refresh-override voor aangepaste refresh-endpoints of refresh-foutbeleid                                 | Provider past niet bij de gedeelde `pi-ai`-refreshers                                                                                         |
| 25  | `buildAuthDoctorHint`             | Reparatiehint die wordt toegevoegd wanneer OAuth-refresh mislukt                                               | Provider heeft providerbeheerde auth-reparatiebegeleiding nodig na een refreshfout                                                           |
| 26  | `matchesContextOverflowError`     | Providerbeheerde matcher voor context-window-overflow                                                          | Provider heeft ruwe overflowfouten die generieke heuristieken zouden missen                                                                   |
| 27  | `classifyFailoverReason`          | Providerbeheerde classificatie van failoverreden                                                               | Provider kan ruwe API-/transportfouten mappen naar rate-limit/overload/etc.                                                                   |
| 28  | `isCacheTtlEligible`              | Prompt-cachebeleid voor proxy-/backhaulproviders                                                              | Provider heeft proxy-specifieke cache-TTL-gating nodig                                                                                        |
| 29  | `buildMissingAuthMessage`         | Vervanging voor het generieke herstelbericht bij ontbrekende auth                                              | Provider heeft een providerspecifieke herstelhint voor ontbrekende auth nodig                                                                 |
| 30  | `augmentModelCatalog`             | Synthetische/finale catalogusrijen die na discovery worden toegevoegd                                          | Provider heeft synthetische forward-compat-rijen nodig in `models list` en pickers                                                           |
| 31  | `resolveThinkingProfile`          | Modelspecifieke `/think`-niveauset, weergavelabels en standaardwaarde                                          | Provider biedt een aangepaste thinking-ladder of binair label voor geselecteerde modellen                                                     |
| 32  | `isBinaryThinking`                | Compatibiliteitshook voor aan/uit-redeneringsschakelaar                                                       | Provider biedt alleen binair thinking aan/uit                                                                                                 |
| 33  | `supportsXHighThinking`           | Compatibiliteitshook voor `xhigh`-redeneringsondersteuning                                                     | Provider wil `xhigh` alleen voor een subset van modellen                                                                                       |
| 34  | `resolveDefaultThinkingLevel`     | Compatibiliteitshook voor standaard `/think`-niveau                                                            | Provider beheert standaard `/think`-beleid voor een model-family                                                                              |
| 35  | `isModernModelRef`                | Modern-model-matcher voor live profielfilters en rookselectie                                                  | Provider beheert voorkeursmodelmatching voor live/smoke                                                                                       |
| 36  | `prepareRuntimeAuth`              | Wisselt een geconfigureerde credential vlak vóór inferentie om naar het daadwerkelijke runtime-token/de runtime-sleutel | Provider heeft een tokenuitwisseling of kortlevende aanvraagcredential nodig                                                                  |
| 37  | `resolveUsageAuth`                | Los gebruiks-/factureringsreferenties op voor `/usage` en gerelateerde statusinterfaces                                     | Aanbieder heeft aangepaste parsing van gebruiks-/quotatokens of andere gebruiksreferenties nodig                                                               |
| 38  | `fetchUsageSnapshot`              | Haal aanbiederspecifieke gebruiks-/quotasnapshots op en normaliseer ze nadat auth is opgelost                             | Aanbieder heeft een aanbiederspecifiek gebruikseindpunt of payloadparser nodig                                                                           |
| 39  | `createEmbeddingProvider`         | Bouw een embeddingadapter die eigendom is van de aanbieder voor geheugen/zoeken                                                     | Gedrag voor geheugenembeddings hoort bij de aanbieder-Plugin                                                                                    |
| 40  | `buildReplayPolicy`               | Retourneer een replaybeleid dat transcriptverwerking voor de aanbieder regelt                                        | Aanbieder heeft aangepast transcriptbeleid nodig (bijvoorbeeld het verwijderen van thinking-blocks)                                                               |
| 41  | `sanitizeReplayHistory`           | Herschrijf replaygeschiedenis na generieke transcriptopschoning                                                        | Aanbieder heeft aanbiederspecifieke replayherschrijvingen nodig naast gedeelde Compaction-helpers                                                             |
| 42  | `validateReplayTurns`             | Voer de laatste validatie of hervorming van replay-turns uit vóór de ingebedde runner                                           | Aanbiedertransport heeft strengere beurtvalidatie nodig na generieke opschoning                                                                    |
| 43  | `onModelSelected`                 | Voer post-selectie-bijwerkingen uit die eigendom zijn van de aanbieder                                                                 | Aanbieder heeft telemetrie of aanbiedereigen status nodig wanneer een model actief wordt                                                                  |

`normalizeModelId`, `normalizeTransport` en `normalizeConfig` controleren eerst de
gekoppelde provider-Plugin en vallen daarna door naar andere provider-Plugins
met hook-ondersteuning totdat er een de model-id of transport/config ook echt
wijzigt. Daardoor blijven alias/compat-provider-shims werken zonder dat de
aanroeper hoeft te weten welke meegeleverde Plugin de rewrite bezit. Als geen
provider-hook een ondersteund Google-familie-config-item herschrijft, past de
meegeleverde Google-config-normalizer die compatibiliteitsopschoning nog steeds
toe.

Als de provider een volledig aangepast wire-protocol of een aangepaste
request-executor nodig heeft, is dat een andere klasse extensie. Deze hooks zijn
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

Meegeleverde provider-Plugins combineren de hooks hierboven om aan te sluiten op
de catalogus-, auth-, thinking-, replay- en usage-behoeften van elke leverancier.
De gezaghebbende hook-set staat bij elke Plugin onder `extensions/`; deze pagina
illustreert de vormen in plaats van de lijst te spiegelen.

<AccordionGroup>
  <Accordion title="Pass-through-catalogusproviders">
    OpenRouter, Kilocode, Z.AI, xAI registreren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` zodat ze upstream
    model-id's vóór OpenClaw's statische catalogus kunnen tonen.
  </Accordion>
  <Accordion title="OAuth- en usage-endpointproviders">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai koppelen
    `prepareRuntimeAuth` of `formatApiKey` aan `resolveUsageAuth` +
    `fetchUsageSnapshot` om tokenuitwisseling en `/usage`-integratie te beheren.
  </Accordion>
  <Accordion title="Replay- en transcriptopschoningsfamilies">
    Gedeelde benoemde families (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) laten providers via
    `buildReplayPolicy` instappen op transcriptbeleid in plaats van dat elke
    Plugin opschoning opnieuw implementeert.
  </Accordion>
  <Accordion title="Catalogus-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` en
    `volcengine` registreren alleen `catalog` en gebruiken de gedeelde
    inferentielus.
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

- `textToSpeech` retourneert de normale core-TTS-outputpayload voor bestands-/spraaknotitie-oppervlakken.
- Gebruikt core-`messages.tts`-configuratie en providerselectie.
- Retourneert PCM-audiobuffer + samplerate. Plugins moeten resamplen/coderen voor providers.
- `listVoices` is optioneel per provider. Gebruik dit voor stemkiezers of setupflows die eigendom zijn van de leverancier.
- Stemlijsten kunnen rijkere metadata bevatten, zoals locale, gender en personality-tags voor providerbewuste pickers.
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
- Gebruik spraakproviders voor synthese-gedrag dat eigendom is van de leverancier.
- Legacy Microsoft-`edge`-input wordt genormaliseerd naar de `microsoft`-provider-id.
- Het voorkeursmodel voor eigendom is bedrijfsgericht: een leveranciers-Plugin kan
  text-, speech-, image- en toekomstige mediaproviders beheren terwijl OpenClaw die
  capability-contracten toevoegt.

Voor begrip van afbeeldingen/audio/video registreren Plugins één getypte
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

- Houd orchestration, fallback, config en channel-wiring in core.
- Houd leveranciersgedrag in de provider-Plugin.
- Additieve uitbreiding moet getypt blijven: nieuwe optionele methoden, nieuwe optionele
  resultaatvelden, nieuwe optionele capabilities.
- Videogeneratie volgt al hetzelfde patroon:
  - core bezit het capability-contract en de runtimehelper
  - leveranciers-Plugins registreren `api.registerVideoGenerationProvider(...)`
  - feature-/channel-Plugins gebruiken `api.runtime.videoGeneration.*`

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
```

Voor audiotranscriptie kunnen Plugins de runtime voor media-understanding
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
  begrip van afbeeldingen/audio/video.
- Gebruikt core media-understanding-audioconfiguratie (`tools.media.audio`) en providerfallbackvolgorde.
- Retourneert `{ text: undefined }` wanneer er geen transcriptie-output wordt geproduceerd (bijvoorbeeld overgeslagen/niet-ondersteunde input).
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
- Voor fallback-runs die eigendom zijn van een Plugin moeten operators opt-in doen met `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gebruik `plugins.entries.<id>.subagent.allowedModels` om vertrouwde Plugins te beperken tot specifieke canonieke `provider/model`-targets, of `"*"` om expliciet elk target toe te staan.
- Niet-vertrouwde Plugin-subagent-runs werken nog steeds, maar override-verzoeken worden afgewezen in plaats van stil terug te vallen.
- Door Plugins gemaakte subagent-sessies worden getagd met de id van de aanmakende Plugin. Fallback `api.runtime.subagent.deleteSession(...)` mag alleen die beheerde sessies verwijderen; willekeurige sessieverwijdering vereist nog steeds een admin-scoped Gateway-request.

Voor webzoekopdrachten kunnen Plugins de gedeelde runtimehelper gebruiken in plaats van
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

Plugins kunnen ook web-searchproviders registreren via
`api.registerWebSearchProvider(...)`.

Opmerkingen:

- Houd providerselectie, credentialresolutie en gedeelde requestsemantiek in core.
- Gebruik web-searchproviders voor leveranciersspecifieke zoektransports.
- `api.runtime.webSearch.*` is het gedeelde voorkeursoppervlak voor feature-/channel-Plugins die zoekgedrag nodig hebben zonder afhankelijk te zijn van de agent-tool-wrapper.

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

- `generate(...)`: genereer een afbeelding met de geconfigureerde providerketen voor afbeeldingsgeneratie.
- `listProviders(...)`: lijst beschikbare providers voor afbeeldingsgeneratie en hun capabilities.

## Gateway HTTP-routes

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
- `auth`: vereist. Gebruik `"gateway"` om normale gateway-auth te vereisen, of `"plugin"` voor door Plugins beheerde auth/Webhook-verificatie.
- `match`: optioneel. `"exact"` (standaard) of `"prefix"`.
- `replaceExisting`: optioneel. Staat dezelfde Plugin toe om zijn eigen bestaande routeregistratie te vervangen.
- `handler`: retourneer `true` wanneer de route het request heeft afgehandeld.

Opmerkingen:

- `api.registerHttpHandler(...)` is verwijderd en veroorzaakt een plugin-laadfout. Gebruik in plaats daarvan `api.registerHttpRoute(...)`.
- Plugin-routes moeten `auth` expliciet declareren.
- Exacte `path + match`-conflicten worden geweigerd, tenzij `replaceExisting: true`, en één plugin kan de route van een andere plugin niet vervangen.
- Overlappende routes met verschillende `auth`-niveaus worden geweigerd. Houd `exact`/`prefix`-fallthrough-ketens alleen op hetzelfde auth-niveau.
- `auth: "plugin"`-routes ontvangen **niet** automatisch runtime-scopes voor operators. Ze zijn bedoeld voor door plugins beheerde webhooks/handtekeningverificatie, niet voor bevoorrechte Gateway-helperaanroepen.
- `auth: "gateway"`-routes draaien binnen een Gateway-request-runtimescope, maar die scope is bewust conservatief:
  - shared-secret bearer-auth (`gateway.auth.mode = "token"` / `"password"`) houdt runtime-scopes van plugin-routes vastgezet op `operator.write`, zelfs als de aanroeper `x-openclaw-scopes` verzendt
  - vertrouwde HTTP-modi met identiteit (bijvoorbeeld `trusted-proxy` of `gateway.auth.mode = "none"` op een private ingress) respecteren `x-openclaw-scopes` alleen wanneer de header expliciet aanwezig is
  - als `x-openclaw-scopes` ontbreekt bij zulke plugin-route-requests met identiteit, valt de runtimescope terug op `operator.write`
- Praktische regel: ga er niet van uit dat een gateway-auth-plugin-route een impliciet admin-oppervlak is. Als je route gedrag nodig heeft dat alleen voor admins is, vereis dan een auth-modus met identiteit en documenteer het expliciete `x-openclaw-scopes`-headercontract.

## Plugin SDK-importpaden

Gebruik smalle SDK-subpaden in plaats van de monolithische `openclaw/plugin-sdk`-root
barrel wanneer je nieuwe plugins maakt. Core-subpaden:

| Subpad                              | Doel                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitieven voor plugin-registratie                |
| `openclaw/plugin-sdk/channel-core`  | Helpers voor channel-entry/build                   |
| `openclaw/plugin-sdk/core`          | Generieke gedeelde helpers en overkoepelend contract |
| `openclaw/plugin-sdk/config-schema` | Root-`openclaw.json` Zod-schema (`OpenClawSchema`) |

Channel-plugins kiezen uit een familie van smalle seams — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` en `channel-actions`. Approval-gedrag moet worden geconsolideerd
op één `approvalCapability`-contract in plaats van te mengen tussen niet-gerelateerde
plugin-velden. Zie [Channel-plugins](/nl/plugins/sdk-channel-plugins).

Runtime- en config-helpers staan onder overeenkomende gerichte `*-runtime`-subpaden
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, enz.). Geef de voorkeur aan `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` en `config-mutation`
in plaats van de brede compatibiliteits-barrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
en `openclaw/plugin-sdk/infra-runtime` zijn verouderde compatibiliteitsshims voor
oudere plugins. Nieuwe code moet in plaats daarvan smallere generieke primitieven importeren.
</Info>

Repo-interne entrypoints (per root van gebundeld pluginpakket):

- `index.js` — gebundelde plugin-entry
- `api.js` — helper/types-barrel
- `runtime-api.js` — barrel alleen voor runtime
- `setup-entry.js` — setup-plugin-entry

Externe plugins mogen alleen `openclaw/plugin-sdk/*`-subpaden importeren. Importeer nooit
`src/*` van een ander pluginpakket vanuit core of vanuit een andere plugin.
Facade-geladen entrypoints geven de voorkeur aan de actieve runtime-config-snapshot wanneer die
bestaat, en vallen daarna terug op het opgeloste config-bestand op schijf.

Capability-specifieke subpaden zoals `image-generation`, `media-understanding`
en `speech` bestaan omdat gebundelde plugins ze vandaag gebruiken. Het zijn niet
automatisch langdurig bevroren externe contracten — controleer de relevante SDK-
referentiepagina wanneer je erop vertrouwt.

## Message tool-schema's

Plugins moeten eigenaar zijn van channel-specifieke `describeMessageTool(...)`-schema-
bijdragen voor niet-berichtprimitieven zoals reacties, leesbevestigingen en polls.
Gedeelde verzendpresentatie moet het generieke `MessagePresentation`-contract gebruiken
in plaats van provider-native knop-, component-, blok- of kaartvelden.
Zie [Berichtpresentatie](/nl/plugins/message-presentation) voor het contract,
fallback-regels, provider-mapping en de checklist voor plugin-auteurs.

Plugins die kunnen verzenden declareren wat ze kunnen renderen via bericht-capabilities:

- `presentation` voor semantische presentatieblokken (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` voor verzoeken om vastgezette levering

Core beslist of de presentatie native wordt gerenderd of naar tekst wordt gedegradeerd.
Stel geen provider-native UI-uitwijkmogelijkheden bloot vanuit de generieke message tool.
Verouderde SDK-helpers voor legacy native schema's blijven geëxporteerd voor bestaande
plugins van derden, maar nieuwe plugins moeten ze niet gebruiken.

## Channel target-resolutie

Channel-plugins moeten eigenaar zijn van channel-specifieke target-semantiek. Houd de gedeelde
outbound-host generiek en gebruik het messaging-adapteroppervlak voor provider-regels:

- `messaging.inferTargetChatType({ to })` beslist of een genormaliseerd target
  vóór directory-lookup als `direct`, `group` of `channel` moet worden behandeld.
- `messaging.targetResolver.looksLikeId(raw, normalized)` vertelt core of een
  input direct naar id-achtige resolutie moet gaan in plaats van directory-zoekopdracht.
- `messaging.targetResolver.resolveTarget(...)` is de plugin-fallback wanneer
  core na normalisatie of na een directory-miss een definitieve provider-owned resolutie nodig heeft.
- `messaging.resolveOutboundSessionRoute(...)` is eigenaar van provider-specifieke sessie-
  routeconstructie zodra een target is opgelost.

Aanbevolen verdeling:

- Gebruik `inferTargetChatType` voor categoriebeslissingen die moeten plaatsvinden vóór
  het zoeken naar peers/groups.
- Gebruik `looksLikeId` voor controles op "behandel dit als een expliciete/native target-id".
- Gebruik `resolveTarget` voor provider-specifieke normalisatie-fallback, niet voor
  brede directory-zoekopdrachten.
- Houd provider-native id's zoals chat-id's, thread-id's, JID's, handles en room-
  id's binnen `target`-waarden of provider-specifieke params, niet in generieke SDK-
  velden.

## Config-backed directories

Plugins die directory-entries uit config afleiden, moeten die logica in de
plugin houden en de gedeelde helpers uit
`openclaw/plugin-sdk/directory-runtime` hergebruiken.

Gebruik dit wanneer een channel config-backed peers/groups nodig heeft, zoals:

- DM-peers op basis van allowlists
- geconfigureerde channel/group-maps
- account-scoped statische directory-fallbacks

De gedeelde helpers in `directory-runtime` verwerken alleen generieke bewerkingen:

- query-filtering
- toepassing van limieten
- deduplicatie-/normalisatiehelpers
- opbouw van `ChannelDirectoryEntry[]`

Channel-specifieke accountinspectie en id-normalisatie moeten in de
plugin-implementatie blijven.

## Provider-catalogi

Provider-plugins kunnen modelcatalogi voor inference definiëren met
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retourneert dezelfde vorm die OpenClaw naar
`models.providers` schrijft:

- `{ provider }` voor één provider-entry
- `{ providers }` voor meerdere provider-entries

Gebruik `catalog` wanneer de plugin eigenaar is van provider-specifieke model-id's, standaardwaarden voor base URL
of auth-gated modelmetadata.

`catalog.order` bepaalt wanneer de catalogus van een plugin wordt samengevoegd ten opzichte van OpenClaw's
ingebouwde impliciete providers:

- `simple`: gewone providers op basis van API-key of env
- `profile`: providers die verschijnen wanneer auth-profielen bestaan
- `paired`: providers die meerdere gerelateerde provider-entries synthetiseren
- `late`: laatste pass, na andere impliciete providers

Latere providers winnen bij key-collisions, dus plugins kunnen bewust een
ingebouwde provider-entry met dezelfde provider-id overschrijven.

Compatibiliteit:

- `discovery` werkt nog steeds als legacy alias
- als zowel `catalog` als `discovery` zijn geregistreerd, gebruikt OpenClaw `catalog`

## Read-only channel-inspectie

Als je plugin een channel registreert, geef dan de voorkeur aan implementatie van
`plugin.config.inspectAccount(cfg, accountId)` naast `resolveAccount(...)`.

Waarom:

- `resolveAccount(...)` is het runtime-pad. Het mag ervan uitgaan dat credentials
  volledig gematerialiseerd zijn en snel falen wanneer vereiste secrets ontbreken.
- Read-only command-paden zoals `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` en doctor/config-
  reparatiestromen zouden geen runtime-credentials hoeven te materialiseren alleen om
  configuratie te beschrijven.

Aanbevolen gedrag voor `inspectAccount(...)`:

- Retourneer alleen beschrijvende accountstatus.
- Behoud `enabled` en `configured`.
- Neem velden voor credential-bron/status op wanneer relevant, zoals:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Je hoeft geen ruwe tokenwaarden te retourneren alleen om read-only
  beschikbaarheid te rapporteren. `tokenStatus: "available"` retourneren (en het bijbehorende bron-
  veld) is genoeg voor status-achtige commands.
- Gebruik `configured_unavailable` wanneer een credential via SecretRef is geconfigureerd maar
  niet beschikbaar is in het huidige command-pad.

Hierdoor kunnen read-only commands "geconfigureerd maar niet beschikbaar in dit command-
pad" rapporteren in plaats van te crashen of het account onterecht als niet geconfigureerd te melden.

## Package packs

Een plugin-directory mag een `package.json` met `openclaw.extensions` bevatten:

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

Security-guardrail: elke `openclaw.extensions`-entry moet na symlink-resolutie binnen de plugin-
directory blijven. Entries die uit de package-directory ontsnappen, worden
geweigerd.

Security-opmerking: `openclaw plugins install` installeert plugin-afhankelijkheden met een
project-lokale `npm install --omit=dev --ignore-scripts` (geen lifecycle-scripts,
geen dev-dependencies tijdens runtime), waarbij geërfde globale npm-install-instellingen worden genegeerd.
Houd dependency trees van plugins "pure JS/TS" en vermijd packages die
`postinstall`-builds vereisen.

Optioneel: `openclaw.setupEntry` kan wijzen naar een lichtgewicht module alleen voor setup.
Wanneer OpenClaw setup-oppervlakken nodig heeft voor een uitgeschakelde channel-plugin, of
wanneer een channel-plugin is ingeschakeld maar nog niet geconfigureerd is, laadt het `setupEntry`
in plaats van de volledige plugin-entry. Dit houdt startup en setup lichter
wanneer je hoofd-plugin-entry ook tools, hooks of andere runtime-only
code bedraadt.

Optioneel: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kan een channel-plugin laten kiezen voor hetzelfde `setupEntry`-pad tijdens de pre-listen-
startupfase van de gateway, zelfs wanneer het channel al geconfigureerd is.

Gebruik dit alleen wanneer `setupEntry` het startup-oppervlak dat moet bestaan
voordat de gateway begint te luisteren volledig dekt. In de praktijk betekent dit dat de setup-entry
elke channel-owned capability moet registreren waarvan startup afhankelijk is, zoals:

- channel-registratie zelf
- alle HTTP-routes die beschikbaar moeten zijn voordat de gateway begint te luisteren
- alle gateway-methoden, tools of services die tijdens hetzelfde venster moeten bestaan

Als je volledige entry nog steeds eigenaar is van een vereiste startup-capability, schakel
deze vlag dan niet in. Houd de plugin op het standaardgedrag en laat OpenClaw de
volledige entry tijdens startup laden.

Gebundelde channels kunnen ook setup-only contract-surface-helpers publiceren die core
kan raadplegen voordat de volledige channel-runtime is geladen. Het huidige setup-
promotion-oppervlak is:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core gebruikt dat oppervlak wanneer het een verouderde kanaalconfiguratie met één account moet promoveren naar `channels.<id>.accounts.*` zonder de volledige pluginvermelding te laden. Matrix is het huidige meegeleverde voorbeeld: het verplaatst alleen auth/bootstrap-sleutels naar een benoemd gepromoveerd account wanneer benoemde accounts al bestaan, en het kan een geconfigureerde niet-canonieke standaardsleutel voor accounts behouden in plaats van altijd `accounts.default` te maken.

Die setup-patchadapters houden ontdekking van het meegeleverde contractoppervlak lazy. De importtijd blijft licht; het promotieoppervlak wordt pas bij het eerste gebruik geladen in plaats van bij module-import opnieuw het opstarten van meegeleverde kanalen binnen te gaan.

Wanneer die opstartoppervlakken Gateway-RPC-methoden bevatten, houd ze dan op een plugin-specifiek prefix. Core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en resolven altijd naar `operator.admin`, zelfs als een plugin een beperktere scope aanvraagt.

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

### Catalogusmetadata voor kanalen

Kanaalplugins kunnen setup-/ontdekkingsmetadata publiceren via `openclaw.channel` en installatietips via `openclaw.install`. Dit houdt de core-catalogus vrij van data.

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
- `preferOver`: plugin-/kanaal-id's met lagere prioriteit die deze catalogusvermelding moet overtreffen
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kopieregelingen voor selectieoppervlakken
- `markdownCapable`: markeert het kanaal als markdown-geschikt voor beslissingen over uitgaande opmaak
- `exposure.configured`: verberg het kanaal uit weergaveoppervlakken voor geconfigureerde kanalen wanneer dit op `false` staat
- `exposure.setup`: verberg het kanaal uit interactieve setup-/configuratiekiezers wanneer dit op `false` staat
- `exposure.docs`: markeer het kanaal als intern/privé voor docs-navigatieoppervlakken
- `showConfigured` / `showInSetup`: verouderde aliassen die nog steeds voor compatibiliteit worden geaccepteerd; geef de voorkeur aan `exposure`
- `quickstartAllowFrom`: laat het kanaal deelnemen aan de standaard quickstart-`allowFrom`-flow
- `forceAccountBinding`: vereis expliciete accountbinding, zelfs wanneer er maar één account bestaat
- `preferSessionLookupForAnnounceTarget`: geef de voorkeur aan sessieopzoeking bij het resolven van aankondigingsdoelen

OpenClaw kan ook **externe kanaalcatalogi** samenvoegen (bijvoorbeeld een MPM-registry-export). Plaats een JSON-bestand op een van deze locaties:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Of laat `OPENCLAW_PLUGIN_CATALOG_PATHS` (of `OPENCLAW_MPM_CATALOG_PATHS`) verwijzen naar een of meer JSON-bestanden (gescheiden door komma's/puntkomma's/`PATH`). Elk bestand moet `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` bevatten. De parser accepteert ook `"packages"` of `"plugins"` als verouderde aliassen voor de sleutel `"entries"`.

Gegenereerde kanaalcatalogusvermeldingen en provider-installatiecatalogusvermeldingen tonen genormaliseerde feiten over de installatiebron naast het ruwe `openclaw.install`-blok. De genormaliseerde feiten geven aan of de npm-specificatie een exacte versie of floating selector is, of verwachte integriteitsmetadata aanwezig is, en of er ook een lokaal bronpad beschikbaar is. Wanneer de catalogus-/pakketidentiteit bekend is, waarschuwen de genormaliseerde feiten als de geparseerde npm-pakketnaam afwijkt van die identiteit. Ze waarschuwen ook wanneer `defaultChoice` ongeldig is of naar een bron wijst die niet beschikbaar is, en wanneer npm-integriteitsmetadata aanwezig is zonder geldige npm-bron. Consumers moeten `installSource` behandelen als een optioneel additief veld, zodat handmatig gebouwde vermeldingen en catalogusshims dit niet hoeven te synthetiseren.
Hierdoor kunnen onboarding en diagnostiek de toestand van het bronvlak uitleggen zonder plugin-runtime te importeren.

Officiële externe npm-vermeldingen moeten bij voorkeur een exacte `npmSpec` plus `expectedIntegrity` gebruiken. Kale pakketnamen en dist-tags blijven werken voor compatibiliteit, maar ze tonen waarschuwingen voor het bronvlak zodat de catalogus kan opschuiven naar gepinde, op integriteit gecontroleerde installaties zonder bestaande plugins te breken.
Wanneer onboarding installeert vanaf een lokaal cataloguspad, legt het een beheerde pluginindexvermelding vast met `source: "path"` en, wanneer mogelijk, een werkruimte-relatieve `sourcePath`. Het absolute operationele laadpad blijft in `plugins.load.paths`; het installatierecord voorkomt dat lokale werkstationpaden worden gedupliceerd naar langlevende configuratie. Dit houdt lokale ontwikkelinstallaties zichtbaar voor bronvlakdiagnostiek zonder een tweede ruw openbaarmakingsoppervlak voor bestandssysteempaden toe te voegen. De persistente pluginindex `plugins/installs.json` is de bron van waarheid voor installaties en kan worden vernieuwd zonder plugin-runtime-modules te laden. De map `installRecords` is duurzaam, zelfs wanneer een pluginmanifest ontbreekt of ongeldig is; de array `plugins` is een opnieuw opbouwbare manifestweergave.

## Context-engineplugins

Context-engineplugins beheren de orkestratie van sessiecontext voor ingest, assembly en Compaction. Registreer ze vanuit je plugin met `api.registerContextEngine(id, factory)` en selecteer daarna de actieve engine met `plugins.slots.contextEngine`.

Gebruik dit wanneer je plugin de standaard contextpipeline moet vervangen of uitbreiden in plaats van alleen memory search of hooks toe te voegen.

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

Wanneer een plugin gedrag nodig heeft dat niet in de huidige API past, omzeil het pluginsysteem dan niet met een privé-reach-in. Voeg de ontbrekende capability toe.

Aanbevolen volgorde:

1. definieer het core-contract
   Bepaal welk gedeeld gedrag core moet beheren: beleid, fallback, samenvoegen van configuratie, lifecycle, kanaalgerichte semantiek en vorm van runtime-helpers.
2. voeg getypeerde pluginregistratie-/runtime-oppervlakken toe
   Breid `OpenClawPluginApi` en/of `api.runtime` uit met het kleinste bruikbare getypeerde capability-oppervlak.
3. wire core + kanaal-/featureconsumers
   Kanalen en featureplugins moeten de nieuwe capability via core gebruiken, niet door rechtstreeks een vendorimplementatie te importeren.
4. registreer vendorimplementaties
   Vendorplugins registreren daarna hun backends tegen de capability.
5. voeg contractdekking toe
   Voeg tests toe zodat eigenaarschap en registratiestructuur in de loop van de tijd expliciet blijven.

Zo blijft OpenClaw uitgesproken zonder hardcoded te worden naar het wereldbeeld van één provider. Zie de [Capability Cookbook](/nl/plugins/architecture) voor een concrete bestandschecklist en uitgewerkt voorbeeld.

### Capability-checklist

Wanneer je een nieuwe capability toevoegt, moet de implementatie meestal deze oppervlakken samen raken:

- core-contracttypes in `src/<capability>/types.ts`
- core-runner/runtime-helper in `src/<capability>/runtime.ts`
- plugin-API-registratieoppervlak in `src/plugins/types.ts`
- plugin-registry-wiring in `src/plugins/registry.ts`
- plugin-runtimeblootstelling in `src/plugins/runtime/*` wanneer feature-/kanaalplugins dit moeten gebruiken
- capture-/testhelpers in `src/test-utils/plugin-registration.ts`
- eigenaarschaps-/contractasserties in `src/plugins/contracts/registry.ts`
- operator-/plugindocs in `docs/`

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
- vendorplugins beheren vendorimplementaties
- feature-/kanaalplugins gebruiken runtime-helpers
- contracttests houden eigenaarschap expliciet

## Gerelateerd

- [Pluginarchitectuur](/nl/plugins/architecture) — publiek capability-model en vormen
- [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths)
- [Plugin-SDK-setup](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
