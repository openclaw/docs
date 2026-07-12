---
read_when:
    - Runtimehooks voor providers, de levenscyclus van kanalen of pakketbundels implementeren
    - Fouten opsporen in de laadvolgorde van plugins of de registerstatus
    - Een nieuwe Plugin-mogelijkheid of contextengine-Plugin toevoegen
summary: 'Interne werking van de Plugin-architectuur: laadpijplijn, register, runtime-hooks, HTTP-routes en referentietabellen'
title: Interne werking van de Plugin-architectuur
x-i18n:
    generated_at: "2026-07-12T09:07:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Voor het openbare capaciteitenmodel, de pluginstructuren en de contracten voor eigenaarschap/uitvoering, zie [Pluginarchitectuur](/nl/plugins/architecture). Deze pagina behandelt de interne werking: laadpijplijn, register, runtime-hooks, Gateway-HTTP-routes, importpaden en schematabellen.

## Laadpijplijn

Bij het opstarten doet OpenClaw ongeveer het volgende:

1. potentiële pluginhoofdmappen detecteren
2. systeemeigen of compatibele bundelmanifesten en pakketmetadata lezen
3. onveilige kandidaten afwijzen
4. pluginconfiguratie normaliseren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. voor elke kandidaat bepalen of deze wordt ingeschakeld
6. ingeschakelde systeemeigen modules laden: gebouwde gebundelde modules gebruiken een systeemeigen loader;
   lokale TypeScript-broncode van derden gebruikt de Jiti-noodoplossing
7. systeemeigen `register(api)`-hooks aanroepen en registraties in het pluginregister verzamelen
8. het register beschikbaar stellen aan opdrachten en runtime-interfaces

<Note>
`activate` is een verouderde alias voor `register` — de loader kiest de beschikbare variant (`def.register ?? def.activate`) en roept deze op hetzelfde punt aan. Alle gebundelde plugins gebruiken `register`; gebruik bij voorkeur `register` voor nieuwe plugins.
</Note>

Veiligheidscontroles worden **vóór** runtime-uitvoering uitgevoerd. Detectie blokkeert een kandidaat wanneer:

- het herleide toegangspunt buiten de pluginhoofdmap valt
- het pad (of de hoofdmap ervan) voor iedereen beschrijfbaar is
- bij niet-gebundelde plugins het eigenaarschap van het pad niet overeenkomt met de huidige uid (of root)

Voor gebundelde mappen die voor iedereen beschrijfbaar zijn, wordt eerst ter plaatse een `chmod`-herstelpoging uitgevoerd (npm-/globale installaties kunnen pakketmappen met `0777` leveren), voordat de controle opnieuw wordt uitgevoerd; eigenaarschapscontroles worden voor een gebundelde oorsprong volledig overgeslagen.

Geblokkeerde kandidaten bevatten in de uitgegeven diagnose nog steeds hun plugin-id wanneer deze bekend is (inclusief id's die zijn herleid uit een manifest in een anderszins afgewezen map), zodat configuratie die naar die id verwijst een geblokkeerde plugin ziet die aan een waarschuwing over padveiligheid is gekoppeld, in plaats van een niet-gerelateerde foutmelding 'onbekende plugin'.

### Manifest-eerst-gedrag

Het manifest is de gezaghebbende bron voor het besturingsvlak. OpenClaw gebruikt het om:

- de plugin te identificeren
- gedeclareerde kanalen/Skills/configuratieschema's of bundelcapaciteiten te detecteren
- `plugins.entries.<id>.config` te valideren
- labels en tijdelijke aanduidingen in de bedieningsinterface aan te vullen
- installatie- en catalogusmetadata weer te geven
- goedkope activerings- en instellingsdescriptors te behouden zonder de pluginruntime te laden

Voor systeemeigen plugins vormt de runtimemodule het gegevensvlak. Deze registreert daadwerkelijk gedrag, zoals hooks, hulpmiddelen, opdrachten of providerstromen.

Optionele manifestblokken `activation` en `setup` blijven op het besturingsvlak. Het zijn uitsluitend metadatadescriptors voor activeringsplanning en het detecteren van instellingen; ze vervangen runtimeregistratie, `register(...)` of `setupEntry` niet. Actieve activeringsconsumenten gebruiken hints voor manifestopdrachten, -kanalen en -providers om het laden van plugins te beperken voordat het register breder wordt opgebouwd:

- bij CLI-laden wordt beperkt tot plugins die eigenaar zijn van de gevraagde primaire opdracht
- bij kanaalinstelling/pluginherleiding wordt beperkt tot plugins die eigenaar zijn van de gevraagde kanaal-id
- bij expliciete providerinstelling/runtimeherleiding wordt beperkt tot plugins die eigenaar zijn van de gevraagde provider-id
- de opstartplanning van de Gateway gebruikt `activation.onStartup` voor expliciete opstartimports; plugins zonder opstartmetadata worden alleen via specifiekere activeringstriggers geladen

De activeringsplanner biedt zowel een API met alleen id's voor bestaande aanroepers als een plan-API voor diagnostiek. Planitems melden waarom een plugin is geselecteerd en maken onderscheid tussen expliciete `activation.*`-hints en terugval op manifesteigenaarschap:

| Reden (uit `activation.*`-hints)      | Reden (uit manifesteigenaarschap)                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `activation-agent-harness-hint`       | —                                                                                          |
| `activation-capability-hint`          | —                                                                                          |
| `activation-channel-hint`             | `manifest-channel-owner` (`channels`)                                                      |
| `activation-command-hint`             | `manifest-command-alias` (`commandAliases`)                                                |
| `activation-provider-hint`            | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`               | —                                                                                          |
| — (hooktrigger heeft geen hintvariant) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)              |

Die scheiding van redenen vormt de compatibiliteitsgrens: bestaande pluginmetadata blijft werken, terwijl nieuwe code brede hints of terugvalgedrag kan detecteren zonder de semantiek van het runtime-laden te wijzigen.

Runtime-voorladingen tijdens verzoeken die om het brede bereik `all` vragen, leiden nog steeds een expliciete effectieve set plugin-id's af uit configuratie, opstartplanning, geconfigureerde kanalen, slots en regels voor automatisch inschakelen (`resolveEffectivePluginIds` in `src/plugins/effective-plugin-ids.ts`). Als die afgeleide set leeg is, houdt OpenClaw het bereik leeg in plaats van dit uit te breiden naar elke detecteerbare plugin.

Bij het detecteren van instellingen wordt de voorkeur gegeven aan id's die eigendom zijn van descriptors, zoals `setup.providers` en `setup.cliBackends`, om potentiële plugins te beperken voordat wordt teruggevallen op `setup-api` voor plugins die nog runtime-hooks tijdens de instelling nodig hebben. Lijsten voor providerinstelling gebruiken manifestgegevens uit `providerAuthChoices`, van descriptors afgeleide instellingskeuzes en installatiecatalogusmetadata zonder de providerruntime te laden. Expliciete `setup.requiresRuntime: false` vormt een afkappunt waarbij alleen descriptors worden gebruikt; als `requiresRuntime` is weggelaten, blijft de verouderde terugval op setup-api behouden voor compatibiliteit. Als meerdere gedetecteerde plugins aanspraak maken op dezelfde genormaliseerde instellingsprovider- of CLI-backend-id, weigert het opzoeken van instellingen de dubbelzinnige eigenaar in plaats van te vertrouwen op de detectievolgorde. Wanneer de instellingsruntime wel wordt uitgevoerd, meldt registerdiagnostiek afwijkingen tussen `setup.providers` / `setup.cliBackends` en de providers of CLI-backends die daadwerkelijk door setup-api zijn geregistreerd, zonder verouderde plugins te blokkeren.

### Cachegrens van plugins

OpenClaw slaat resultaten van plugindetectie of directe manifestregistergegevens niet op in een cache met tijdsvensters. Installaties, manifestbewerkingen en wijzigingen in laadpaden moeten zichtbaar worden bij de volgende expliciete metadatalezing of herbouw van de momentopname. De parser voor manifestbestanden houdt een begrensde cache van bestandskenmerken bij, met als sleutel het geopende manifestpad plus apparaat/inode, grootte en mtime/ctime; die cache voorkomt alleen dat ongewijzigde bytes opnieuw worden geparseerd en mag geen antwoorden over detectie, registers, eigenaars of beleid cachen.

Het veilige snelle pad voor metadata bestaat uit expliciet objecteigenaarschap, niet uit een verborgen cache. Intensief gebruikte opstartpaden van de Gateway moeten de huidige `PluginMetadataSnapshot`, de afgeleide `PluginLookUpTable` of een expliciet manifestregister door de aanroepketen doorgeven. Configuratievalidatie, automatisch inschakelen bij het opstarten, plugininitialisatie en providerselectie kunnen die objecten hergebruiken zolang ze de huidige configuratie en plugininventaris vertegenwoordigen. Bij het opzoeken van instellingen worden manifestmetadata nog steeds op aanvraag opnieuw opgebouwd, tenzij het specifieke instellingspad een expliciet manifestregister ontvangt; behoud dit als terugval voor weinig gebruikte paden in plaats van verborgen opzoekcaches toe te voegen. Wanneer de invoer verandert, bouwt en vervangt u de momentopname opnieuw in plaats van deze te wijzigen of historische kopieën te bewaren. Weergaven van het actieve pluginregister en gebundelde helpers voor kanaalinitialisatie moeten opnieuw worden berekend vanuit het huidige register/de huidige hoofdmap. Kortstondige maps zijn binnen één aanroep geschikt om dubbel werk te voorkomen of herintreding te bewaken; ze mogen geen procesmetadatacaches worden.

Voor het laden van plugins is runtime-laden de permanente cachelaag. Deze mag loaderstatus hergebruiken wanneer code of geïnstalleerde artefacten daadwerkelijk worden geladen, zoals:

- `PluginLoaderCacheState` en compatibele actieve runtimeregisters
- jiti-/modulecaches en loadercaches voor openbare interfaces die voorkomen dat dezelfde runtime-interface herhaaldelijk wordt geïmporteerd
- bestandssysteemcaches voor geïnstalleerde pluginartefacten
- kortstondige maps per aanroep voor padnormalisatie of het oplossen van duplicaten

Deze caches zijn implementatiedetails van het gegevensvlak. Ze mogen geen vragen van het besturingsvlak beantwoorden, zoals 'welke plugin is eigenaar van deze provider?', tenzij de aanroeper bewust om runtime-laden heeft gevraagd.

Voeg geen permanente caches of caches op basis van verstreken tijd toe voor:

- detectieresultaten
- directe manifestregisters
- manifestregisters die opnieuw zijn opgebouwd vanuit de index van geïnstalleerde plugins
- het opzoeken van providereigenaars, modelonderdrukking, providerbeleid of metadata van openbare artefacten
- elk ander van een manifest afgeleid antwoord waarbij een gewijzigd manifest, een gewijzigde geïnstalleerde index of een gewijzigd laadpad bij de volgende metadatalezing zichtbaar moet zijn

Aanroepers die manifestmetadata opnieuw opbouwen vanuit de permanente index van geïnstalleerde plugins, reconstrueren dat register op aanvraag. De geïnstalleerde index is duurzame status van het bronvlak; het is geen verborgen metadatacache in het proces.

## Registermodel

Geladen plugins wijzigen niet rechtstreeks willekeurige globale kernvariabelen. Ze registreren zich in een centraal pluginregister (`PluginRegistry` in `src/plugins/registry-types.ts`), dat pluginrecords (identiteit, bron, oorsprong, status, diagnostiek) bijhoudt, plus arrays voor elke capaciteit: hulpmiddelen, verouderde hooks en getypeerde hooks, kanalen, providers, Gateway-RPC-handlers, HTTP-routes, CLI-registrators, achtergrondservices, opdrachten waarvan plugins eigenaar zijn en tientallen aanvullende getypeerde providerfamilies (spraak, embeddings, beeld-/video-/muziekgeneratie, ophalen/zoeken op het web, agentharnassen, sessieacties enzovoort).

Kernfuncties lezen vervolgens uit dat register in plaats van rechtstreeks met pluginmodules te communiceren. Hierdoor blijft het laden eenrichtingsverkeer:

- pluginmodule -> registratie in register
- kernruntime -> gebruik van register

Die scheiding is belangrijk voor de onderhoudbaarheid. Dit betekent dat de meeste kerninterfaces slechts één integratiepunt nodig hebben: 'het register lezen', niet 'elke pluginmodule afzonderlijk behandelen'.

## Callbacks voor gesprekskoppelingen

Plugins die een gesprek koppelen, kunnen reageren wanneer een goedkeuring is afgehandeld.

Gebruik `api.onConversationBindingResolved(...)` om een callback te ontvangen nadat een koppelingsverzoek is goedgekeurd of geweigerd:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Er bestaat nu een koppeling voor deze plugin en dit gesprek.
        console.log(event.binding?.conversationId);
        return;
      }

      // Het verzoek is geweigerd; wis eventuele lokale status in afwachting.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Velden in de callbackpayload:

- `status`: `"approved"` of `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` of `"deny"`
- `binding`: de herleide koppeling voor goedgekeurde verzoeken
- `request`: de oorspronkelijke samenvatting van het verzoek, ontkoppelingshint, afzender-id en gespreksmetadata

Deze callback dient uitsluitend als melding. Deze wijzigt niet wie een gesprek mag koppelen en wordt uitgevoerd nadat de kernafhandeling van de goedkeuring is voltooid.

## Runtime-hooks voor providers

Providerplugins hebben drie lagen:

- **Manifestmetadata** voor snelle opzoekacties vóór de runtime:
  `setup.providers[].envVars`, de verouderde compatibiliteitsoptie `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` en `channelEnvVars`.
- **Hooks tijdens de configuratie**: `catalog` (verouderd: `discovery`) plus
  `applyConfigDefaults`.
- **Runtime-hooks**: meer dan 40 optionele hooks voor authenticatie, modelherleiding,
  streamomwikkeling, denkniveaus, herhalingsbeleid en gebruikseindpunten. Zie
  [Volgorde en gebruik van hooks](#hook-order-and-usage).

OpenClaw blijft eigenaar van de algemene agentlus, failover, transcriptverwerking en het hulpmiddelenbeleid. Deze hooks vormen de uitbreidingsinterface voor providerspecifiek gedrag zonder dat een volledig aangepast inferentietransport nodig is.

Gebruik manifest `setup.providers[].envVars` wanneer de provider op omgevingsvariabelen gebaseerde
inloggegevens heeft die generieke paden voor authenticatie, status en modelkeuze moeten kunnen zien zonder
de Plugin-runtime te laden. De verouderde `providerAuthEnvVars` wordt tijdens de
uitfaseringsperiode nog door de compatibiliteitsadapter gelezen, en niet-meegeleverde plugins
die deze gebruiken, ontvangen een manifestdiagnose. Gebruik manifest `providerAuthAliases`
wanneer één provider-id de omgevingsvariabelen, authenticatieprofielen,
configuratiegebaseerde authenticatie en API-sleutelkeuze tijdens de onboarding van een andere provider-id moet hergebruiken. Gebruik manifest
`providerAuthChoices` wanneer CLI-oppervlakken voor onboarding en authenticatiekeuze de
keuze-id van de provider, groepslabels en eenvoudige authenticatiekoppeling met één vlag moeten kennen zonder
de provider-runtime te laden. Behoud `envVars` van de provider-runtime
voor aanwijzingen voor beheerders, zoals onboardinglabels of instelvariabelen voor
de OAuth-client-id en het OAuth-clientgeheim.

Gebruik manifest `channelEnvVars` wanneer een kanaal via omgevingsvariabelen aangestuurde authenticatie of configuratie heeft die
generieke terugval op shell-omgevingsvariabelen, configuratie-/statuscontroles of configuratieprompts moeten kunnen zien
zonder de kanaalruntime te laden.

### Volgorde en gebruik van hooks

Voor model-/providerplugins roept OpenClaw hooks ongeveer in deze volgorde aan.
De kolom "Wanneer te gebruiken" is de beknopte beslissingsgids.
Provider-velden die uitsluitend voor compatibiliteit bestaan en die OpenClaw niet meer aanroept, zoals
`ProviderPlugin.capabilities` en `suppressBuiltInModel`, worden hier bewust niet
vermeld.

| Hook                              | Wat deze doet                                                                                                                 | Wanneer te gebruiken                                                                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publiceer providerconfiguratie naar `models.providers` tijdens het genereren van `models.json`                                 | De provider beheert een catalogus of standaardwaarden voor de basis-URL                                                                                                          |
| `applyConfigDefaults`             | Pas door de provider beheerde algemene configuratiestandaarden toe tijdens het materialiseren van de configuratie              | Standaarden zijn afhankelijk van de authenticatiemodus, omgeving of semantiek van de modelfamilie van de provider                                                                |
| _(ingebouwde modelzoekfunctie)_   | OpenClaw probeert eerst het normale register-/cataloguspad                                                                     | _(geen Plugin-hook)_                                                                                                                                                             |
| `normalizeModelId`                | Normaliseer verouderde aliassen of previewaliassen voor model-ID's vóór het opzoeken                                           | De provider beheert het opschonen van aliassen vóór de canonieke modelresolutie                                                                                                  |
| `normalizeTransport`              | Normaliseer `api` / `baseUrl` van de providerfamilie vóór de generieke modelsamenstelling                                     | De provider beheert transportopschoning voor aangepaste provider-ID's in dezelfde transportfamilie                                                                               |
| `normalizeConfig`                 | Normaliseer `models.providers.<id>` vóór runtime-/providerresolutie                                                            | De provider heeft configuratieopschoning nodig die bij de Plugin hoort; gebundelde helpers voor de Google-familie dienen ook als vangnet voor ondersteunde Google-configuratie-items |
| `applyNativeStreamingUsageCompat` | Pas compatibiliteitsherschrijvingen voor native streaminggebruik toe op configuratieproviders                                  | De provider heeft door het eindpunt gestuurde correcties voor metagegevens over native streaminggebruik nodig                                                                    |
| `resolveConfigApiKey`             | Los authenticatie via omgevingsmarkeringen voor configuratieproviders op vóór het laden van runtime-authenticatie             | Providers stellen hun eigen hooks voor API-sleutelresolutie via omgevingsmarkeringen beschikbaar                                                                                 |
| `resolveSyntheticAuth`            | Maak lokale/zelfgehoste of configuratiegebaseerde authenticatie beschikbaar zonder platte tekst permanent op te slaan         | De provider kan werken met een synthetische/lokale referentiemarkering                                                                                                           |
| `resolveExternalAuthProfiles`     | Leg door de provider beheerde externe authenticatieprofielen eroverheen; standaardwaarde van `persistence` is `runtime-only` voor referenties die door de CLI/app worden beheerd | De provider hergebruikt externe authenticatiegegevens zonder gekopieerde vernieuwingstokens permanent op te slaan; declareer `contracts.externalAuthProviders` in het manifest |
| `shouldDeferSyntheticProfileAuth` | Verlaag de prioriteit van opgeslagen tijdelijke aanduidingen voor synthetische profielen ten opzichte van omgevings-/configuratiegebaseerde authenticatie | De provider slaat synthetische profielen met tijdelijke aanduidingen op die geen voorrang mogen krijgen                                                                          |
| `resolveDynamicModel`             | Synchrone terugval voor door de provider beheerde model-ID's die nog niet in het lokale register staan                         | De provider accepteert willekeurige upstream-model-ID's                                                                                                                          |
| `prepareDynamicModel`             | Asynchrone opwarming, waarna `resolveDynamicModel` opnieuw wordt uitgevoerd                                                    | De provider heeft netwerkmetagegevens nodig voordat onbekende ID's kunnen worden opgelost                                                                                        |
| `normalizeResolvedModel`          | Laatste herschrijving voordat de ingebedde runner het opgeloste model gebruikt                                                 | De provider heeft transportherschrijvingen nodig, maar gebruikt nog steeds een kerntransport                                                                                     |
| `normalizeToolSchemas`            | Normaliseer toolschema's voordat de ingebedde runner ze verwerkt                                                              | De provider heeft schemasopschoning voor de transportfamilie nodig                                                                                                               |
| `inspectToolSchemas`              | Maak door de provider beheerde schemadiagnostiek beschikbaar na normalisatie                                                  | De provider wil waarschuwingen voor trefwoorden zonder de kern providerspecifieke regels te leren                                                                                |
| `resolveReasoningOutputMode`      | Selecteer een native of gelabeld contract voor redeneeruitvoer                                                                | De provider heeft gelabelde redeneer-/einduitvoer nodig in plaats van native velden                                                                                              |
| `prepareExtraParams`              | Normaliseer aanvraagparameters vóór generieke wrappers voor streamopties                                                      | De provider heeft standaardaanvraagparameters of providerspecifieke parameteropschoning nodig                                                                                    |
| `createStreamFn`                  | Vervang het normale streampad volledig door een aangepast transport                                                           | De provider heeft een aangepast wireprotocol nodig, niet alleen een wrapper                                                                                                     |
| `wrapStreamFn`                    | Streamwrapper nadat generieke wrappers zijn toegepast                                                                         | De provider heeft compatibiliteitswrappers voor aanvraagheaders/-body/model nodig zonder aangepast transport                                                                    |
| `resolveTransportTurnState`       | Voeg native transportheaders of metagegevens per beurt toe                                                                    | De provider wil dat generieke transporten de provider-native beurtidentiteit verzenden                                                                                           |
| `resolveWebSocketSessionPolicy`   | Voeg native WebSocket-headers of afkoelbeleid voor sessies toe                                                                | De provider wil dat generieke WS-transporten sessieheaders of terugvalbeleid afstemmen                                                                                           |
| `formatApiKey`                    | Formatter voor authenticatieprofielen: het opgeslagen profiel wordt de runtime-tekenreeks `apiKey`                            | De provider slaat extra authenticatiemetagegevens op en heeft een aangepaste vorm voor het runtime-token nodig                                                                   |
| `refreshOAuth`                    | Overschrijf OAuth-vernieuwing voor aangepaste vernieuwingseindpunten of beleid bij mislukte vernieuwing                       | De provider past niet bij de gedeelde vernieuwingsmechanismen van OpenClaw                                                                                                      |
| `buildAuthDoctorHint`             | Herstelhint die wordt toegevoegd wanneer OAuth-vernieuwing mislukt                                                            | De provider heeft eigen richtlijnen nodig voor herstel van authenticatie na een mislukte vernieuwing                                                                             |
| `matchesContextOverflowError`     | Door de provider beheerde matcher voor overschrijding van het contextvenster                                                  | De provider heeft onbewerkte overloopfouten die generieke heuristieken zouden missen                                                                                             |
| `classifyFailoverReason`          | Door de provider beheerde classificatie van redenen voor failover                                                             | De provider kan onbewerkte API-/transportfouten koppelen aan snelheidslimiet/overbelasting/enzovoort                                                                             |
| `isCacheTtlEligible`              | Beleid voor promptcache voor proxy-/backhaulproviders                                                                         | De provider heeft proxyspecifieke controle op geschiktheid voor cache-TTL nodig                                                                                                  |
| `buildMissingAuthMessage`         | Vervanging voor het generieke herstelbericht bij ontbrekende authenticatie                                                    | De provider heeft een providerspecifieke herstelhint voor ontbrekende authenticatie nodig                                                                                        |
| `augmentModelCatalog`             | Synthetische/definitieve catalogusrijen die na detectie worden toegevoegd (verouderd, zie hieronder)                          | De provider heeft synthetische voorwaarts compatibele rijen nodig in `models list` en keuzelijsten                                                                               |
| `resolveThinkingProfile`          | Modelspecifieke set `/think`-niveaus, weergavelabels en standaardwaarde                                                       | De provider stelt een aangepaste denkladder of binair label beschikbaar voor geselecteerde modellen                                                                             |
| `isBinaryThinking`                | Compatibiliteitshook voor het in-/uitschakelen van redeneren                                                                  | De provider stelt alleen binair in-/uitschakelen van denken beschikbaar                                                                                                         |
| `supportsXHighThinking`           | Compatibiliteitshook voor ondersteuning van `xhigh`-redeneren                                                                 | De provider wil `xhigh` alleen voor een subset van modellen                                                                                                                      |
| `resolveDefaultThinkingLevel`     | Compatibiliteitshook voor het standaardniveau van `/think`                                                                    | De provider beheert het standaardbeleid voor `/think` voor een modelfamilie                                                                                                     |
| `isModernModelRef`                | Matcher voor moderne modellen voor live profielfilters en smoketestselectie                                                   | De provider beheert het matchen van voorkeursmodellen voor livegebruik/smoketests                                                                                                |
| `prepareRuntimeAuth`              | Wissel een geconfigureerde referentie vlak vóór inferentie om voor het daadwerkelijke runtime-token/de daadwerkelijke sleutel | De provider heeft een tokenuitwisseling of kortlevende aanvraagreferentie nodig                                                                                                  |
| `resolveUsageAuth`                | Los gebruiks-/factureringsreferenties op voor `/usage` en gerelateerde statusoppervlakken                                     | De provider heeft aangepaste parsing van gebruiks-/quotatokens of een andere gebruiksreferentie nodig                                                                            |
| `fetchUsageSnapshot`              | Haal providerspecifieke momentopnamen van gebruik/quota op en normaliseer deze nadat de authenticatie is opgelost             | De provider heeft een providerspecifiek gebruikseindpunt of parser voor de payload nodig                                                                                         |
| `createEmbeddingProvider`         | Bouw een embeddingadapter van de provider voor geheugen/zoeken                                                 | Gedrag voor geheugen-embeddings hoort bij de provider-Plugin                                                                                   |
| `buildReplayPolicy`               | Retourneer een replaybeleid dat de verwerking van transcripties voor de provider regelt                        | De provider vereist een aangepast transcriptiebeleid (bijvoorbeeld het verwijderen van denkblokken)                                           |
| `sanitizeReplayHistory`           | Herschrijf de replaygeschiedenis na algemene opschoning van transcripties                                      | De provider vereist providerspecifieke replayherschrijvingen naast gedeelde Compaction-hulpfuncties                                           |
| `validateReplayTurns`             | Voer de laatste validatie of hervorming van replaybeurten uit vóór de ingesloten runner                         | Het providertransport vereist strengere beurtvalidatie na algemene opschoning                                                                 |
| `onModelSelected`                 | Voer neveneffecten van de provider uit na de selectie                                                          | De provider vereist telemetrie of providerstatus wanneer een model actief wordt                                                               |

`normalizeModelId`, `normalizeTransport` en `normalizeConfig` controleren eerst de
overeenkomende providerplugin en vallen daarna terug op andere providerplugins
die hooks ondersteunen, totdat er daadwerkelijk een model-id of transport/configuratie
wordt gewijzigd. Zo blijven alias-/compatibiliteitsshims voor providers werken zonder
dat de aanroeper hoeft te weten welke gebundelde plugin verantwoordelijk is voor
de herschrijving. Als geen providerhook een ondersteunde configuratievermelding
uit de Google-familie herschrijft, past de gebundelde Google-configuratienormalisator
die compatibiliteitsopschoning alsnog toe.

Als de provider een volledig aangepast draadprotocol of een aangepaste
aanvraaguitvoerder nodig heeft, is dat een andere klasse uitbreiding. Deze hooks
zijn bedoeld voor providergedrag dat nog steeds binnen de normale inferentielus
van OpenClaw wordt uitgevoerd.

`resolveUsageAuth` bepaalt of OpenClaw `fetchUsageSnapshot` moet aanroepen of
moet terugvallen op algemene referentieresolutie voor gebruiks-/statusoppervlakken.
Retourneer `{ token, accountId?, subscriptionType?, rateLimitTier? }` wanneer de
provider een gebruiksreferentie heeft (de optionele abonnementsmetadata wordt
doorgegeven aan `fetchUsageSnapshot`), retourneer
`{ handled: true }` wanneer gebruiksauthenticatie in eigendom van de provider het
verzoek heeft afgehandeld en de algemene terugval op API-sleutel/OAuth moet
onderdrukken, en retourneer `null` of `undefined` wanneer de provider de
gebruiksauthenticatie niet heeft afgehandeld.

Declareer organisatie- of factureringsreferenties in
`providerUsageAuthEnvVars` van het manifest. Hierdoor kunnen algemene
detectie- en geheimopschoningsoppervlakken deze herkennen zonder ze als
kandidaten voor inferentieauthenticatie te behandelen.

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

Gebundelde providerplugins combineren de bovenstaande hooks om aan de catalogus-,
authenticatie-, redeneer-, herhalings- en gebruiksbehoeften van elke leverancier
te voldoen. De gezaghebbende verzameling hooks bevindt zich bij elke plugin onder
`extensions/`; deze pagina illustreert de vormen in plaats van de lijst te
spiegelen.

<AccordionGroup>
  <Accordion title="Catalogusproviders met directe doorgifte">
    OpenRouter, Kilocode, Z.AI en xAI registreren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, zodat ze bovenliggende
    model-id's vóór de statische catalogus van OpenClaw beschikbaar kunnen maken.
  </Accordion>
  <Accordion title="Providers voor OAuth- en gebruikseindpunten">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi en z.ai combineren
    `prepareRuntimeAuth` of `formatApiKey` met `resolveUsageAuth` +
    `fetchUsageSnapshot` om tokenuitwisseling en `/usage`-integratie te beheren.
  </Accordion>
  <Accordion title="Families voor herhaling en transcriptopschoning">
    Gedeelde benoemde families (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) laten providers zich via
    `buildReplayPolicy` aanmelden voor transcriptbeleid, in plaats van dat elke
    plugin de opschoning opnieuw implementeert.
  </Accordion>
  <Accordion title="Providers met alleen een catalogus">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` en
    `volcengine` registreren alleen `catalog` en gebruiken de gedeelde
    inferentielus.
  </Accordion>
  <Accordion title="Anthropic-specifieke streamhulpmiddelen">
    Bètaheaders, `/fast` / `serviceTier` en `context1m` bevinden zich binnen de
    openbare `api.ts`- / `contract-api.ts`-grens van de Anthropic-plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) in plaats van in
    de algemene SDK.
  </Accordion>
</AccordionGroup>

## Runtimehulpmiddelen

Plugins hebben via `api.runtime` toegang tot geselecteerde kernhulpmiddelen.
Voor TTS:

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

- `textToSpeech` retourneert de normale TTS-uitvoerpayload van de kern voor bestands-/spraaknotitieoppervlakken.
- Gebruikt de kernconfiguratie `messages.tts` en providerselectie.
- Retourneert een PCM-audiobuffer plus bemonsteringsfrequentie. Plugins moeten opnieuw bemonsteren/coderen voor providers.
- `listVoices` is optioneel per provider. Gebruik dit voor stemkiezers of instelstromen die eigendom zijn van de leverancier.
- De kern geeft een opgeloste aanvraagdeadline door aan `listVoices`-hooks van providers; providerspecifieke time-outinstellingen kunnen deze overschrijven.
- Stemlijsten kunnen rijkere metadata bevatten, zoals landinstelling, geslacht en persoonlijkheidstags voor providerbewuste kiezers.
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

- Houd TTS-beleid, terugval en antwoordbezorging in de kern.
- Gebruik spraakproviders voor synthesegedrag dat eigendom is van de leverancier.
- Verouderde Microsoft-`edge`-invoer wordt genormaliseerd naar de provider-id `microsoft`.
- Het voorkeursmodel voor eigenaarschap is bedrijfsgericht: één leveranciersplugin kan
  tekst-, spraak-, afbeeldings- en toekomstige mediaproviders beheren naarmate OpenClaw
  die capaciteitscontracten toevoegt.

Voor begrip van afbeeldingen/audio/video registreren plugins één getypeerde
provider voor mediabegrip in plaats van een algemene sleutel-/waardeverzameling:

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

- Houd orkestratie, terugval, configuratie en kanaalbedrading in de kern.
- Houd leveranciersgedrag in de providerplugin.
- Additieve uitbreiding moet getypeerd blijven: nieuwe optionele methoden, nieuwe optionele
  resultaatvelden en nieuwe optionele capaciteiten.
- Videogeneratie volgt al hetzelfde patroon:
  - de kern beheert het capaciteitscontract en het runtimehulpmiddel
  - leveranciersplugins registreren `api.registerVideoGenerationProvider(...)`
  - functie-/kanaalplugins gebruiken `api.runtime.videoGeneration.*`

Voor runtimehulpmiddelen voor mediabegrip kunnen plugins het volgende aanroepen:

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
  model: "gpt-5.6-sol",
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

Voor audiotranscriptie kunnen plugins de runtime voor mediabegrip of de oudere
STT-alias gebruiken:

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
- `extractStructuredWithModel(...)` is de plugingerichte grens voor begrensde,
  providerbeheerde extractie waarbij afbeeldingen vooropstaan. Neem ten minste
  één afbeeldingsinvoer op; tekstinvoer is aanvullende context. Productplugins
  beheren hun routes en schema's, terwijl OpenClaw de provider-/runtimegrens beheert.
- Gebruikt de audio-configuratie voor mediabegrip van de kern (`tools.media.audio`) en de terugvalvolgorde van providers.
- Retourneert `{ text: undefined }` wanneer geen transcriptie-uitvoer wordt geproduceerd (bijvoorbeeld bij overgeslagen/niet-ondersteunde invoer).
- `api.runtime.stt.transcribeAudioFile(...)` blijft beschikbaar als compatibiliteitsalias.

Plugins kunnen ook subagentuitvoeringen op de achtergrond starten via `api.runtime.subagent`:

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

- `provider` en `model` zijn optionele overschrijvingen per uitvoering, geen permanente sessiewijzigingen.
- OpenClaw respecteert die overschrijvingsvelden alleen voor vertrouwde aanroepers.
- Voor terugvaluitvoeringen die eigendom zijn van een plugin moeten operators zich aanmelden met `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gebruik `plugins.entries.<id>.subagent.allowedModels` om vertrouwde plugins te beperken tot specifieke canonieke `provider/model`-doelen, of `"*"` om elk doel expliciet toe te staan.
- Subagentuitvoeringen van niet-vertrouwde plugins blijven werken, maar overschrijvingsverzoeken worden afgewezen in plaats van stilletjes terug te vallen.
- Door plugins aangemaakte subagentsessies worden gemarkeerd met de id van de aanmakende plugin. Terugval via `api.runtime.subagent.deleteSession(...)` mag alleen die eigen sessies verwijderen; het verwijderen van willekeurige sessies vereist nog steeds een Gateway-verzoek met beheerdersbereik.

Voor zoeken op het web kunnen plugins het gedeelde runtimehulpmiddel gebruiken in
plaats van toegang te zoeken tot de bedrading van agenthulpmiddelen:

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

- Houd providerselectie, referentieresolutie en gedeelde aanvraagsemantiek in de kern.
- Gebruik webzoekproviders voor leveranciersspecifieke zoektransporten.
- `api.runtime.webSearch.*` is het gedeelde voorkeursoppervlak voor functie-/kanaalplugins die zoekgedrag nodig hebben zonder afhankelijk te zijn van de wrapper van het agenthulpmiddel.

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

- `generate(...)`: genereer een afbeelding met de geconfigureerde keten van afbeeldingsgeneratieproviders.
- `listProviders(...)`: geef de beschikbare afbeeldingsgeneratieproviders en hun capaciteiten weer.

## Gateway-HTTP-routes

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

- `path`: routepad onder de HTTP-server van de Gateway.
- `auth`: verplicht, `"gateway"` of `"plugin"`. Gebruik `"gateway"` om normale Gateway-authenticatie te vereisen, of `"plugin"` voor door de Plugin beheerde authenticatie/Webhook-verificatie.
- `match`: optioneel. `"exact"` (standaard) of `"prefix"`.
- `handleUpgrade`: optionele handler voor WebSocket-upgradeverzoeken op dezelfde route.
- `replaceExisting`: optioneel. Hiermee kan dezelfde Plugin zijn eigen bestaande routeregistratie vervangen.
- `handler`: retourneer `true` wanneer de route het verzoek heeft afgehandeld.

Opmerkingen:

- `api.registerHttpHandler(...)` is verwijderd en veroorzaakt een fout bij het laden van een Plugin. Gebruik in plaats daarvan `api.registerHttpRoute(...)`.
- Plugin-routes moeten `auth` expliciet declareren.
- Conflicten met exact dezelfde combinatie van `path + match` worden geweigerd, tenzij `replaceExisting: true`; een Plugin kan de route van een andere Plugin niet vervangen.
- Overlappende routes met verschillende `auth`-niveaus worden geweigerd. Houd terugvalketens met `exact`/`prefix` uitsluitend op hetzelfde authenticatieniveau.
- Routes met `auth: "plugin"` ontvangen **niet** automatisch runtimescopes voor operators. Ze zijn bedoeld voor door de Plugin beheerde webhooks/handtekeningverificatie, niet voor bevoorrechte aanroepen van Gateway-hulpfuncties.
- Routes met `auth: "gateway"` worden uitgevoerd binnen een runtimescope voor Gateway-verzoeken. Het standaardoppervlak (`gatewayRuntimeScopeSurface: "write-default"`) is bewust behoudend:
  - bearer-authenticatie met een gedeeld geheim (`gateway.auth.mode = "token"` / `"password"`) en elke authenticatiemethode die geen vertrouwde proxy gebruikt, krijgen één scope `operator.write`, zelfs als de aanroeper `x-openclaw-scopes` meestuurt
  - aanroepers via `trusted-proxy` zonder een expliciete header `x-openclaw-scopes` behouden ook het verouderde oppervlak met uitsluitend `operator.write`
  - aanroepers via `trusted-proxy` die wel `x-openclaw-scopes` meesturen, krijgen in plaats daarvan de gedeclareerde scopes
  - een route kan kiezen voor `gatewayRuntimeScopeSurface: "trusted-operator"` om `x-openclaw-scopes` altijd te respecteren voor authenticatiemodi die een identiteit bevatten (met als terugval de volledige standaardset CLI-scopes wanneer de header ontbreekt)
- Praktische regel: ga er niet van uit dat een Plugin-route met Gateway-authenticatie impliciet een beheerdersoppervlak is. Als uw route gedrag vereist dat uitsluitend voor beheerders beschikbaar is, kies dan voor het scope-oppervlak `trusted-operator`, vereis een authenticatiemodus die een identiteit bevat en documenteer het expliciete headercontract voor `x-openclaw-scopes`.
- Na routematching en authenticatie nemen gewone handlers deel aan de toelating van hoofdwerk voor de Gateway. Een voorbereide of opnieuw startende Gateway retourneert `503` voordat de handler wordt aangeroepen. De beperkte uitzondering is een route met een manifestmachtiging en `auth: "gateway"` die ook kiest voor het routespecifieke oppervlak `trusted-operator`; deze blijft bereikbaar zodat de dispatch van opschortingsbesturing niet vastloopt, terwijl gewone zusterroutes van dezelfde Plugin achter de toelatingsgrens blijven. Het eigendom van WebSocket-`handleUpgrade` gebruikt dezelfde atomaire toelatingsgrens; zodra de handler een socket accepteert, valt de verdere levensduur van de socket onder het beheer van de Plugin en wordt deze niet door deze grens gevolgd.

## Importpaden van de Plugin-SDK

Gebruik bij het maken van nieuwe plugins smalle SDK-subpaden in plaats van de monolithische root-barrel `openclaw/plugin-sdk`. Kernsubpaden:

| Subpad                              | Doel                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitieven voor Plugin-registratie                 |
| `openclaw/plugin-sdk/channel-core`  | Hulpfuncties voor kanaalinvoer en -opbouw           |
| `openclaw/plugin-sdk/core`          | Generieke gedeelde hulpfuncties en overkoepelend contract |
| `openclaw/plugin-sdk/config-schema` | Zod-schema voor het rootbestand `openclaw.json` (`OpenClawSchema`) |

Kanaalplugins kiezen uit een familie van smalle koppelvlakken — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` en `channel-actions`. Goedkeuringsgedrag moet worden
geconsolideerd in één `approvalCapability`-contract in plaats van te worden
verspreid over niet-gerelateerde Plugin-velden. Zie [Kanaalplugins](/nl/plugins/sdk-channel-plugins).

Runtime- en configuratiehulpfuncties bevinden zich onder overeenkomstige,
gerichte `*-runtime`-subpaden (`approval-runtime`, `agent-runtime`, `lazy-runtime`,
`directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`,
`heartbeat-runtime`, `channel-activity-runtime`, enzovoort). Geef de voorkeur aan
`config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` en
`config-mutation` in plaats van de brede compatibiliteitsbarrel `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
kleine façades voor kanaalhulpfuncties, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
en `openclaw/plugin-sdk/infra-runtime` zijn verouderde compatibiliteitsshimlagen
voor oudere plugins. Nieuwe code moet in plaats daarvan smallere generieke
primitieven importeren.
</Info>

Interne toegangspunten van de repository (per root van een gebundeld Plugin-pakket):

- `index.js` — toegangspunt van de gebundelde Plugin
- `api.js` — barrel voor hulpfuncties/typen
- `runtime-api.js` — barrel uitsluitend voor runtime
- `setup-entry.js` — toegangspunt van de installatie-Plugin

Externe plugins mogen uitsluitend subpaden van `openclaw/plugin-sdk/*` importeren.
Importeer nooit `src/*` van een ander Plugin-pakket vanuit de kern of een andere
Plugin. Via een façade geladen toegangspunten geven de voorkeur aan de actieve
snapshot van de runtimeconfiguratie wanneer deze bestaat en vallen vervolgens
terug op het opgeloste configuratiebestand op schijf.

Mogelijkheidsspecifieke subpaden zoals `image-generation`, `media-understanding`
en `speech` bestaan omdat gebundelde plugins ze momenteel gebruiken. Het zijn
niet automatisch langdurig bevroren externe contracten — controleer de
relevante SDK-referentiepagina wanneer u ervan afhankelijk bent.

## Schema's voor berichttools

Plugins moeten eigenaar zijn van kanaalspecifieke schemabijdragen via
`describeMessageTool(...)` voor primitieven die geen berichten zijn, zoals
reacties, leesacties en peilingen. Gedeelde verzendpresentatie moet het generieke
`MessagePresentation`-contract gebruiken in plaats van provider-eigen velden
voor knoppen, componenten, blokken of kaarten. Zie
[Berichtpresentatie](/nl/plugins/message-presentation) voor het contract, de
terugvalregels, providertoewijzing en de controlelijst voor Plugin-auteurs.

Plugins die kunnen verzenden, declareren via berichtmogelijkheden wat ze kunnen weergeven:

- `presentation` voor semantische presentatieblokken (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` voor verzoeken om vastgezette aflevering

De kern bepaalt of de presentatie systeemeigen wordt weergegeven of wordt
teruggebracht tot tekst. Stel geen provider-eigen uitwegen voor de UI beschikbaar
vanuit de generieke berichttool. Verouderde SDK-hulpfuncties voor oude
systeemeigen schema's blijven geëxporteerd voor bestaande plugins van derden,
maar nieuwe plugins mogen ze niet gebruiken.

## Oplossing van kanaaldoelen

Kanaalplugins moeten eigenaar zijn van kanaalspecifieke doelsemantiek. Houd de
gedeelde uitgaande host generiek en gebruik het oppervlak van de berichtenadapter
voor providerregels:

- `messaging.inferTargetChatType({ to })` bepaalt vóór het opzoeken in de map of
  een genormaliseerd doel moet worden behandeld als `direct`, `group` of `channel`.
- `messaging.targetResolver.looksLikeId(raw, normalized)` vertelt de kern of een
  invoer direct moet doorgaan naar ID-achtige oplossing in plaats van zoeken in
  de map.
- `messaging.targetResolver.reservedLiterals` vermeldt losse woorden die voor
  die provider kanaal-/sessieverwijzingen zijn. Bij het oplossen blijven
  geconfigureerde mapvermeldingen behouden voordat gereserveerde letterlijke
  waarden worden geweigerd; vervolgens wordt bij een gemiste mapvermelding
  veilig gestopt.
- `messaging.targetResolver.resolveTarget(...)` is de terugval van de Plugin
  wanneer de kern een laatste oplossing onder beheer van de provider nodig
  heeft na normalisatie of een gemiste mapvermelding.
- `messaging.resolveOutboundSessionRoute(...)` beheert de providerspecifieke
  opbouw van de sessieroute zodra een doel is opgelost.

Aanbevolen verdeling:

- Gebruik `inferTargetChatType` voor categoriebeslissingen die vóór het zoeken
  naar peers/groepen moeten plaatsvinden.
- Gebruik `looksLikeId` voor controles in de trant van 'behandel dit als een
  expliciete/systeemeigen doel-ID'.
- Gebruik `resolveTarget` voor providerspecifieke normalisatieterugval, niet
  voor breed zoeken in de map.
- Houd provider-eigen ID's, zoals chat-ID's, thread-ID's, JID's, handles en
  ruimte-ID's, binnen `target`-waarden of providerspecifieke parameters, niet
  in generieke SDK-velden.

## Door configuratie ondersteunde mappen

Plugins die mapvermeldingen uit configuratie afleiden, moeten die logica in de
Plugin houden en de gedeelde hulpfuncties uit
`openclaw/plugin-sdk/directory-runtime` hergebruiken.

Gebruik dit wanneer een kanaal door configuratie ondersteunde peers/groepen
nodig heeft, zoals:

- DM-peers op basis van een toestemmingslijst
- geconfigureerde kanaal-/groepstoewijzingen
- statische, accountgebonden terugvalopties voor mappen

De gedeelde hulpfuncties in `directory-runtime` verwerken alleen generieke bewerkingen:

- queryfiltering
- toepassing van limieten
- hulpfuncties voor ontdubbeling/normalisatie
- opbouw van `ChannelDirectoryEntry[]`

Kanaalspecifieke accountinspectie en ID-normalisatie moeten in de
Plugin-implementatie blijven.

## Providercatalogi

Providerplugins kunnen modelcatalogi voor inferentie definiëren met
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retourneert dezelfde vorm die OpenClaw naar
`models.providers` schrijft:

- `{ provider }` voor één providervermelding
- `{ providers }` voor meerdere providervermeldingen

Gebruik `catalog` wanneer de Plugin eigenaar is van providerspecifieke
model-ID's, standaardwaarden voor basis-URL's of door authenticatie afgeschermde
modelmetadata.

`catalog.order` bepaalt wanneer de catalogus van een Plugin wordt samengevoegd
ten opzichte van de ingebouwde impliciete providers van OpenClaw:

- `simple`: gewone providers op basis van API-sleutels of omgevingsvariabelen
- `profile`: providers die verschijnen wanneer authenticatieprofielen bestaan
- `paired`: providers die meerdere gerelateerde providervermeldingen samenstellen
- `late`: laatste doorgang, na andere impliciete providers

Latere providers winnen bij een sleutelconflict, zodat plugins bewust een
ingebouwde providervermelding met dezelfde provider-ID kunnen overschrijven.

Plugins kunnen ook alleen-lezenmodelrijen publiceren via
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Dit is het toekomstige pad voor lijst-, hulp- en keuzeoppervlakken en
ondersteunt rijen voor `text`, `voice`, `image_generation`, `video_generation`
en `music_generation`. Providerplugins blijven eigenaar van live
eindpuntaanroepen, tokenuitwisseling en toewijzing van leveranciersreacties; de
kern beheert de gemeenschappelijke rijvorm, bronlabels en de opmaak van hulp
voor mediatools. Registraties van providers voor mediageneratie stellen
automatisch statische catalogusrijen samen uit `defaultModel`, `models` en
`capabilities`.

Compatibiliteit:

- `discovery` werkt nog als een verouderde alias, maar geeft een
  afschrijvingswaarschuwing
- als zowel `catalog` als `discovery` zijn geregistreerd, gebruikt OpenClaw
  `catalog` en geeft het een waarschuwing
- `augmentModelCatalog` is verouderd; gebundelde providers moeten aanvullende
  rijen publiceren via `registerModelCatalogProvider`

## Alleen-lezeninspectie van kanalen

Als uw Plugin een kanaal registreert, implementeer dan bij voorkeur
`plugin.config.inspectAccount(cfg, accountId)` naast `resolveAccount(...)`.

Waarom:

- `resolveAccount(...)` is het runtimepad. Het mag ervan uitgaan dat
  aanmeldgegevens volledig beschikbaar zijn en kan direct mislukken wanneer
  vereiste geheimen ontbreken.
- Alleen-lezenopdrachtpaden zoals `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` en herstelstromen
  voor doctor/configuratie hoeven geen runtimeaanmeldgegevens beschikbaar te
  maken om alleen de configuratie te beschrijven.

Aanbevolen gedrag voor `inspectAccount(...)`:

- Retourneer alleen een beschrijvende accountstatus.
- Behoud `enabled` en `configured`.
- Neem waar relevant velden voor de bron/status van aanmeldgegevens op, zoals:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- U hoeft geen onbewerkte tokenwaarden te retourneren alleen om alleen-lezen
  beschikbaarheid te rapporteren. Het retourneren van `tokenStatus: "available"`
  (en het bijbehorende bronveld) volstaat voor statusopdrachten.
- Gebruik `configured_unavailable` wanneer aanmeldgegevens via SecretRef zijn
  geconfigureerd, maar niet beschikbaar zijn in het huidige opdrachtpad.

Hierdoor kunnen alleen-lezen opdrachten "geconfigureerd maar niet beschikbaar in
dit opdrachtpad" rapporteren in plaats van vast te lopen of ten onrechte te
melden dat het account niet is geconfigureerd.

## Pakketbundels

Een pluginmap kan een `package.json` met `openclaw.extensions` bevatten:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Elke vermelding wordt een plugin. Als de bundel meerdere extensies vermeldt,
wordt de plugin-id `<manifestOrPackageName>/<fileBase>` (de manifest-id heeft
voorrang wanneer deze aanwezig is; anders wordt de naam zonder bereik uit
`package.json` gebruikt).

Als uw plugin npm-afhankelijkheden importeert, installeer deze dan in die map,
zodat `node_modules` beschikbaar is (`npm install` / `pnpm install`).

Beveiligingsmaatregel: elke vermelding in `openclaw.extensions` moet na het
oplossen van symbolische koppelingen binnen de pluginmap blijven. Vermeldingen
die buiten de pakketmap vallen, worden geweigerd.

Beveiligingsopmerking: `openclaw plugins install` installeert
plugin-afhankelijkheden met een projectlokale
`npm install --omit=dev --ignore-scripts` (geen levenscyclusscripts en geen
ontwikkelafhankelijkheden tijdens runtime), waarbij overgenomen algemene
npm-installatie-instellingen worden genegeerd. Houd de afhankelijkheidsstructuren
van plugins "puur JS/TS" en vermijd pakketten waarvoor `postinstall`-builds nodig
zijn.

Optioneel: `openclaw.setupEntry` kan verwijzen naar een lichte module die alleen
voor de installatie is bestemd. Wanneer OpenClaw installatieoppervlakken nodig
heeft voor een uitgeschakelde kanaalplugin, of wanneer een kanaalplugin is
ingeschakeld maar nog niet is geconfigureerd, laadt het `setupEntry` in plaats
van het volledige pluginingangspunt. Dit houdt het opstarten en de installatie
lichter wanneer het hoofdingangspunt van uw plugin ook hulpmiddelen, hooks of
andere uitsluitend voor runtime bestemde code koppelt.

Optioneel: met `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kan een kanaalplugin tijdens de fase vóór het luisteren van de Gateway voor
hetzelfde `setupEntry`-pad kiezen, zelfs wanneer het kanaal al is geconfigureerd.

Gebruik dit alleen wanneer `setupEntry` het opstartoppervlak dat aanwezig moet
zijn voordat de Gateway begint te luisteren volledig afdekt. In de praktijk
betekent dit dat het installatie-ingangspunt elke kanaaleigen mogelijkheid moet
registreren waarvan het opstarten afhankelijk is, zoals:

- de kanaalregistratie zelf
- alle HTTP-routes die beschikbaar moeten zijn voordat de Gateway begint te luisteren
- alle Gateway-methoden, hulpmiddelen of services die gedurende hetzelfde tijdsvenster moeten bestaan

Als uw volledige ingangspunt nog steeds eigenaar is van een vereiste
opstartmogelijkheid, schakel deze vlag dan niet in. Behoud het standaardgedrag
voor de plugin en laat OpenClaw het volledige ingangspunt tijdens het opstarten
laden.

Meegeleverde kanalen kunnen ook helpers publiceren voor
contractoppervlakken die uitsluitend voor de installatie zijn bedoeld en die
door de kern kunnen worden geraadpleegd voordat de volledige kanaalruntime is
geladen. Het huidige promotieoppervlak voor de installatie is:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

De kern gebruikt dat oppervlak wanneer een verouderde kanaalconfiguratie voor
één account naar `channels.<id>.accounts.*` moet worden gepromoveerd zonder het
volledige pluginingangspunt te laden. Matrix is het huidige meegeleverde
voorbeeld: het verplaatst alleen authenticatie-/bootstrap-sleutels naar een
benoemd gepromoveerd account wanneer er al benoemde accounts bestaan, en het kan
een geconfigureerde niet-canonieke standaardsleutel voor een account behouden in
plaats van altijd `accounts.default` aan te maken.

Deze installatiepatchadapters houden de detectie van meegeleverde
contractoppervlakken lui. De importtijd blijft kort; het promotieoppervlak wordt
pas bij het eerste gebruik geladen in plaats van het opstarten van meegeleverde
kanalen opnieuw te activeren bij de module-import.

Wanneer deze opstartoppervlakken Gateway-RPC-methoden bevatten, houdt u deze
onder een pluginspecifiek voorvoegsel. Beheerdersnaamruimten van de kern
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd
en worden altijd omgezet naar `operator.admin`, zelfs als een plugin om een
beperktere reikwijdte vraagt.

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

Kanaalplugins kunnen metagegevens voor installatie/detectie bekendmaken via
`openclaw.channel` en installatieaanwijzingen via `openclaw.install`. Hierdoor
blijft de kerncatalogus vrij van gegevens.

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

Nuttige velden van `openclaw.channel` naast het minimale voorbeeld:

- `detailLabel`: secundair label voor uitgebreidere catalogus-/statusoppervlakken
- `docsLabel`: overschrijft de koppelingstekst voor de documentatiekoppeling
- `preferOver`: plugin-/kanaal-id's met lagere prioriteit die door deze catalogusvermelding moeten worden overtroffen
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: tekstinstellingen voor het selectieoppervlak
- `markdownCapable`: markeert het kanaal als geschikt voor Markdown voor beslissingen over uitgaande opmaak
- `exposure.configured`: verbergt het kanaal op oppervlakken met lijsten van geconfigureerde kanalen wanneer ingesteld op `false`
- `exposure.setup`: verbergt het kanaal in interactieve selectievelden voor installatie/configuratie wanneer ingesteld op `false`
- `exposure.docs`: markeert het kanaal als intern/privé voor oppervlakken voor documentatienavigatie
- `showConfigured` / `showInSetup`: verouderde aliassen die nog steeds worden geaccepteerd voor compatibiliteit; geef de voorkeur aan `exposure`
- `quickstartAllowFrom`: neemt het kanaal op in de standaard `allowFrom`-stroom voor snel starten
- `forceAccountBinding`: vereist expliciete accountkoppeling, zelfs wanneer er slechts één account bestaat
- `preferSessionLookupForAnnounceTarget`: geeft de voorkeur aan sessieopzoeking bij het bepalen van aankondigingsdoelen

OpenClaw kan ook **externe kanaalcatalogi** samenvoegen (bijvoorbeeld een export
van een MPM-register). Plaats een JSON-bestand op een van de volgende locaties:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Of laat `OPENCLAW_PLUGIN_CATALOG_PATHS` (of `OPENCLAW_MPM_CATALOG_PATHS`) naar
een of meer JSON-bestanden verwijzen (gescheiden door komma's, puntkomma's of
`PATH`). Elk bestand moet
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`
bevatten. De parser accepteert ook `"packages"` of `"plugins"` als verouderde
aliassen voor de sleutel `"entries"`.

Gegenereerde vermeldingen in de kanaalcatalogus en vermeldingen in de
installatiecatalogus van providers stellen genormaliseerde feiten over de
installatiebron beschikbaar naast het onbewerkte blok `openclaw.install`. De
genormaliseerde feiten geven aan of de npm-specificatie een exacte versie of
een zwevende selector is, of de verwachte integriteitsmetagegevens aanwezig
zijn en of er ook een lokaal bronpad beschikbaar is. Wanneer de identiteit van
de catalogus/het pakket bekend is, waarschuwen de genormaliseerde feiten als de
geparseerde npm-pakketnaam afwijkt van die identiteit. Ze waarschuwen ook
wanneer `defaultChoice` ongeldig is of verwijst naar een bron die niet
beschikbaar is, en wanneer npm-integriteitsmetagegevens aanwezig zijn zonder
geldige npm-bron. Consumenten moeten `installSource` behandelen als een
aanvullend optioneel veld, zodat handmatig samengestelde vermeldingen en
catalogusshims dit niet hoeven te genereren.
Hierdoor kunnen onboarding en diagnostiek de toestand van het bronvlak
verklaren zonder de pluginruntime te importeren.

Officiële externe npm-vermeldingen moeten bij voorkeur een exacte `npmSpec` plus
`expectedIntegrity` gebruiken. Kale pakketnamen en distributietags blijven
werken voor compatibiliteit, maar ze tonen waarschuwingen op het bronvlak, zodat
de catalogus kan overstappen op vastgezette installaties met integriteitscontrole
zonder bestaande plugins te verstoren. Wanneer onboarding installeert vanuit een
lokaal cataloguspad, legt het een beheerde vermelding in de pluginindex vast met
`source: "path"` en, waar mogelijk, een werkruimterelatief `sourcePath`. Het
absolute operationele laadpad blijft in `plugins.load.paths`; het
installatierecord voorkomt dat lokale werkstationpaden worden gedupliceerd in
langdurige configuratie. Hierdoor blijven lokale ontwikkelinstallaties zichtbaar
voor diagnostiek van het bronvlak zonder een tweede oppervlak toe te voegen dat
onbewerkte bestandssysteempaden openbaar maakt. De permanente SQLite-tabel
`installed_plugin_index` is de gezaghebbende bron voor installaties en kan
worden vernieuwd zonder pluginruntimemodules te laden. De `installRecords`-map
is duurzaam, zelfs wanneer een pluginmanifest ontbreekt of ongeldig is; de
`plugins`-inhoud is een opnieuw op te bouwen manifestweergave.

## Plugins voor contextengines

Plugins voor contextengines beheren de orkestratie van sessiecontext voor
opname, samenstelling en Compaction. Registreer ze vanuit uw plugin met
`api.registerContextEngine(id, factory)` en selecteer vervolgens de actieve
engine met `plugins.slots.contextEngine`.

Gebruik dit wanneer uw plugin de standaardcontextpijplijn moet vervangen of
uitbreiden, in plaats van alleen geheugenzoekfuncties of hooks toe te voegen.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

De factory-`ctx` stelt optionele waarden `config`, `agentDir` en
`workspaceDir` beschikbaar voor initialisatie tijdens de constructie.

`assemble()` kan `contextProjection` retourneren wanneer de actieve harness een
permanente backendthread heeft. Laat dit weg voor verouderde projectie per
beurt. Retourneer `{ mode: "thread_bootstrap", epoch }` wanneer de samengestelde
context eenmaal in een backendthread moet worden geïnjecteerd en opnieuw moet
worden gebruikt totdat de epoch verandert. Wijzig de epoch nadat de semantische
context van de engine verandert, bijvoorbeeld na een door de engine beheerde
Compaction-doorgang. Hosts kunnen metagegevens van hulpmiddelaanroepen, de
invoervorm en geredigeerde hulpmiddelresultaten behouden in een
thread-bootstrapprojectie, zodat nieuwe backendthreads de continuïteit van
hulpmiddelen behouden zonder onbewerkte gegevens met geheimen te kopiëren.

Als uw engine **niet** verantwoordelijk is voor het Compaction-algoritme, laat
`compact()` dan geïmplementeerd en delegeer dit expliciet:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Een nieuwe mogelijkheid toevoegen

Wanneer een Plugin gedrag nodig heeft dat niet binnen de huidige API past, omzeil dan niet
het Pluginsysteem met een persoonlijke rechtstreekse toegang. Voeg de ontbrekende mogelijkheid toe.

Aanbevolen volgorde:

1. **Definieer het kerncontract.** Bepaal welk gedeeld gedrag de kern moet beheren:
   beleid, terugvaloptie, configuratiesamenvoeging, levenscyclus, kanaalgerichte semantiek en
   de vorm van runtimehelpers.
2. **Voeg getypeerde oppervlakken voor Pluginregistratie/runtime toe.** Breid
   `OpenClawPluginApi` en/of `api.runtime` uit met het kleinste bruikbare getypeerde
   mogelijkheidsoppervlak.
3. **Verbind kern- en kanaal-/functieconsumenten.** Kanalen en functie-Plugins
   moeten de nieuwe mogelijkheid via de kern gebruiken, niet door rechtstreeks een
   leveranciersimplementatie te importeren.
4. **Registreer leveranciersimplementaties.** Leveranciers-Plugins registreren vervolgens hun
   backends voor de mogelijkheid.
5. **Voeg contractdekking toe.** Voeg tests toe zodat eigenaarschap en registratievorm
   in de loop van de tijd expliciet blijven.

Zo blijft OpenClaw een duidelijke visie hanteren zonder vast te worden gecodeerd op het
wereldbeeld van één provider. Zie het [receptenboek voor mogelijkheden](/nl/plugins/adding-capabilities)
voor een concrete bestandschecklist en een uitgewerkt voorbeeld.

### Checklist voor mogelijkheden

Wanneer je een nieuwe mogelijkheid toevoegt, moet de implementatie doorgaans deze
oppervlakken gezamenlijk wijzigen:

- kerncontracttypen in `src/<capability>/types.ts`
- kernrunner/runtimehelper in `src/<capability>/runtime.ts`
- registratieoppervlak van de Plugin-API in `src/plugins/types.ts`
- bedrading van het Pluginregister in `src/plugins/registry.ts`
- beschikbaarstelling van de Pluginruntime in `src/plugins/runtime/*` wanneer functie-/kanaal-Plugins
  deze moeten gebruiken
- helpers voor vastlegging/tests in `src/test-utils/plugin-registration.ts`
- beweringen over eigenaarschap/contracten in `src/plugins/contracts/registry.ts`
- documentatie voor operators/Plugins in `docs/`

Als een van die oppervlakken ontbreekt, is dat meestal een teken dat de mogelijkheid
nog niet volledig is geïntegreerd.

### Mogelijkheidssjabloon

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

Patroon voor contracttests (`src/plugins/contracts/registry.ts` stelt zoekfuncties voor eigenaarschap
beschikbaar, zoals `providerContractPluginIds`; tests controleren of de lijst
`contracts.videoGenerationProviders` van een Plugin overeenkomt met wat deze daadwerkelijk registreert):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Dat houdt de regel eenvoudig:

- de kern beheert het mogelijkheidscontract en de orkestratie
- leveranciers-Plugins beheren leveranciersimplementaties
- functie-/kanaal-Plugins gebruiken runtimehelpers
- contracttests houden het eigenaarschap expliciet

## Gerelateerd

- [Pluginarchitectuur](/nl/plugins/architecture) — openbaar mogelijkheidsmodel en vormen
- [Subpaden van de Plugin-SDK](/nl/plugins/sdk-subpaths)
- [Installatie van de Plugin-SDK](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
