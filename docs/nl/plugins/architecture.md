---
read_when:
    - Native OpenClaw-plugins bouwen of debuggen
    - Het Plugin-capabilitymodel of eigendomsgrenzen begrijpen
    - Werken aan de Plugin-laadpipeline of het register
    - Provider-runtimehooks of kanaal-Plugins implementeren
sidebarTitle: Internals
summary: 'Interne Plugin-details: capaciteitenmodel, eigenaarschap, contracten, laadpijplijn en runtime-hulpfuncties'
title: Interne werking van de Plugin
x-i18n:
    generated_at: "2026-04-29T23:01:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

Dit is de **diepgaande architectuurreferentie** voor het Plugin-systeem van OpenClaw. Begin voor praktische handleidingen met een van de gerichte pagina's hieronder.

<CardGroup cols={2}>
  <Card title="Plugins installeren en gebruiken" icon="plug" href="/nl/tools/plugin">
    Eindgebruikershandleiding voor het toevoegen, inschakelen en probleemoplossing van plugins.
  </Card>
  <Card title="Plugins bouwen" icon="rocket" href="/nl/plugins/building-plugins">
    Tutorial voor je eerste Plugin met het kleinste werkende manifest.
  </Card>
  <Card title="Kanaalplugins" icon="comments" href="/nl/plugins/sdk-channel-plugins">
    Bouw een Plugin voor een berichtkanaal.
  </Card>
  <Card title="Providerplugins" icon="microchip" href="/nl/plugins/sdk-provider-plugins">
    Bouw een Plugin voor een modelprovider.
  </Card>
  <Card title="SDK-overzicht" icon="book" href="/nl/plugins/sdk-overview">
    Importmap en referentie voor de registratie-API.
  </Card>
</CardGroup>

## Publiek capabilitymodel

Capabilities zijn het publieke **native Plugin**-model binnen OpenClaw. Elke native OpenClaw-Plugin registreert zich voor een of meer capabilitytypen:

| Capability             | Registratiemethode                              | Voorbeeldplugins                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Tekstinferentie        | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Spraak                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Realtime stem          | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Afbeeldingsgeneratie   | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Muziekgeneratie        | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Videogeneratie         | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web ophalen            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web zoeken             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanaal / berichten     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway-detectie       | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Een Plugin die nul capabilities registreert, maar hooks, tools, detectieservices of achtergrondservices biedt, is een **legacy hook-only** Plugin. Dat patroon wordt nog steeds volledig ondersteund.
</Note>

### Externe compatibiliteitspositie

Het capabilitymodel is in core geland en wordt vandaag gebruikt door gebundelde/native plugins, maar compatibiliteit voor externe plugins heeft nog steeds een strengere norm nodig dan "het is geëxporteerd, dus het is bevroren."

| Plugin-situatie                                 | Richtlijn                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Bestaande externe plugins                         | Houd hook-gebaseerde integraties werkend; dit is de compatibiliteitsbaseline.                    |
| Nieuwe gebundelde/native plugins                  | Geef de voorkeur aan expliciete capabilityregistratie boven leveranciersspecifieke reach-ins of nieuwe hook-only ontwerpen. |
| Externe plugins die capabilityregistratie gebruiken | Toegestaan, maar behandel capabilityspecifieke helper-oppervlakken als in ontwikkeling tenzij docs ze als stabiel markeren. |

Capabilityregistratie is de beoogde richting. Legacy hooks blijven tijdens de overgang het veiligste pad zonder breuken voor externe plugins. Geëxporteerde helper-subpaden zijn niet allemaal gelijk — geef de voorkeur aan smalle gedocumenteerde contracten boven incidentele helperexports.

### Plugin-vormen

OpenClaw classificeert elke geladen Plugin in een vorm op basis van het daadwerkelijke registratiegedrag (niet alleen statische metadata):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registreert precies één capabilitytype (bijvoorbeeld een provider-only Plugin zoals `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registreert meerdere capabilitytypen (bijvoorbeeld `openai` is eigenaar van tekstinferentie, spraak, mediabegrip en afbeeldingsgeneratie).
  </Accordion>
  <Accordion title="hook-only">
    Registreert alleen hooks (getypeerd of aangepast), geen capabilities, tools, commando's of services.
  </Accordion>
  <Accordion title="non-capability">
    Registreert tools, commando's, services of routes, maar geen capabilities.
  </Accordion>
</AccordionGroup>

Gebruik `openclaw plugins inspect <id>` om de vorm en capability-uitsplitsing van een Plugin te zien. Zie [CLI-referentie](/nl/cli/plugins#inspect) voor details.

### Legacy hooks

De hook `before_agent_start` blijft ondersteund als compatibiliteitspad voor hook-only plugins. Legacy plugins uit de praktijk zijn er nog steeds van afhankelijk.

Richting:

- houd het werkend
- documenteer het als legacy
- geef de voorkeur aan `before_model_resolve` voor werk rond model-/provideroverrides
- geef de voorkeur aan `before_prompt_build` voor promptmutatiewerk
- verwijder pas nadat echt gebruik is gedaald en fixturedekking migratieveiligheid bewijst

### Compatibiliteitssignalen

Wanneer je `openclaw doctor` of `openclaw plugins inspect <id>` uitvoert, zie je mogelijk een van deze labels:

| Signaal                    | Betekenis                                                   |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Configuratie wordt correct geparseerd en plugins worden opgelost |
| **compatibility advisory** | Plugin gebruikt een ondersteund maar ouder patroon (bijv. `hook-only`) |
| **legacy warning**         | Plugin gebruikt `before_agent_start`, wat verouderd is      |
| **hard error**             | Configuratie is ongeldig of Plugin kon niet worden geladen  |

Noch `hook-only` noch `before_agent_start` breekt je Plugin vandaag: `hook-only` is adviserend, en `before_agent_start` activeert alleen een waarschuwing. Deze signalen verschijnen ook in `openclaw status --all` en `openclaw plugins doctor`.

## Architectuuroverzicht

Het Plugin-systeem van OpenClaw heeft vier lagen:

<Steps>
  <Step title="Manifest + detectie">
    OpenClaw vindt kandidaatplugins uit geconfigureerde paden, werkruimteroots, globale pluginroots en gebundelde plugins. Detectie leest eerst native `openclaw.plugin.json`-manifesten plus ondersteunde bundelmanifesten.
  </Step>
  <Step title="Inschakeling + validatie">
    Core bepaalt of een gevonden Plugin is ingeschakeld, uitgeschakeld, geblokkeerd of geselecteerd voor een exclusieve slot zoals geheugen.
  </Step>
  <Step title="Runtime laden">
    Native OpenClaw-plugins worden in-process geladen via jiti en registreren capabilities in een centraal register. Compatibele bundels worden genormaliseerd naar registerrecords zonder runtimecode te importeren.
  </Step>
  <Step title="Oppervlakconsumptie">
    De rest van OpenClaw leest het register om tools, kanalen, providerinstellingen, hooks, HTTP-routes, CLI-commando's en services beschikbaar te maken.
  </Step>
</Steps>

Specifiek voor de Plugin-CLI is rootcommandodetectie opgesplitst in twee fasen:

- parse-time metadata komt uit `registerCli(..., { descriptors: [...] })`
- de echte Plugin-CLI-module kan lazy blijven en registreren bij de eerste aanroep

Zo blijft CLI-code die eigendom is van de Plugin binnen de Plugin, terwijl OpenClaw nog steeds rootcommandonamen kan reserveren vóór het parsen.

De belangrijke ontwerpgrens:

- manifest-/configvalidatie moet werken vanuit **manifest-/schemametadata** zonder Plugincode uit te voeren
- native capabilitydetectie mag vertrouwde Plugin-entrycode laden om een niet-activerende registersnapshot te bouwen
- native runtimegedrag komt uit het `register(api)`-pad van de Plugin-module met `api.registrationMode === "full"`

Door die scheiding kan OpenClaw configuratie valideren, ontbrekende/uitgeschakelde plugins uitleggen en UI-/schemahints bouwen voordat de volledige runtime actief is.

### Snapshot van Plugin-metadata en opzoektabel

Bij het starten van de Gateway wordt één `PluginMetadataSnapshot` gebouwd voor de huidige configuratiesnapshot. De snapshot bevat alleen metadata: hij bewaart de geïnstalleerde Plugin-index, het manifestregister, manifestdiagnostiek, eigenaarsmappen, een Plugin-id-normalizer en manifestrecords. Hij bevat geen geladen Plugin-modules, provider-SDK's, pakketinhoud of runtime-exports.

Plugin-bewuste configvalidatie, automatisch inschakelen bij opstarten en Plugin-bootstrap van de Gateway gebruiken die snapshot in plaats van manifest-/indexmetadata onafhankelijk opnieuw op te bouwen. `PluginLookUpTable` wordt afgeleid van dezelfde snapshot en voegt het opstartplan voor plugins toe voor de huidige runtimeconfiguratie.

Na het opstarten houdt Gateway de huidige metadatasnapshot bij als een vervangbaar runtimeproduct. Herhaalde runtime-providerdetectie kan die snapshot lenen in plaats van de geïnstalleerde index en het manifestregister opnieuw te reconstrueren voor elke provider-cataloguspass. De snapshot wordt gewist of vervangen bij het afsluiten van de Gateway, wijzigingen in config/Plugin-inventaris en schrijfacties naar de geïnstalleerde index; callers vallen terug op het koude manifest-/indexpad wanneer er geen compatibele huidige snapshot bestaat. Compatibiliteitscontroles moeten Plugin-detectieroots bevatten, zoals `plugins.load.paths` en de standaard agentwerkruimte, omdat werkruimteplugins deel uitmaken van de metadatascope.

De snapshot en opzoektabel houden herhaalde opstartbeslissingen op het snelle pad:

- kanaaleigenaarschap
- uitgestelde kanaalstart
- Plugin-id's bij opstarten
- provider- en CLI-backendeigenaarschap
- eigenaarschap van setup-provider, commandoalias, modelcatalogusprovider en manifestcontract
- validatie van Plugin-configschema en kanaalconfigschema
- beslissingen voor automatisch inschakelen bij opstarten

De veiligheidsgrens is vervanging van snapshots, niet mutatie. Bouw de snapshot opnieuw wanneer config, Plugin-inventaris, installatierecords of persistent indexbeleid verandert. Behandel hem niet als een breed muteerbaar globaal register, en bewaar geen onbegrensde historische snapshots. Runtime laden van plugins blijft gescheiden van metadatasnapshots, zodat verouderde runtimestatus niet verborgen kan worden achter een metadatacache.

De cacheregel is gedocumenteerd in [Interne Plugin-architectuur](/nl/plugins/architecture-internals#plugin-cache-boundary): manifest- en detectiemetadata zijn vers tenzij een caller een expliciete snapshot, opzoektabel of manifestregister voor de huidige flow heeft. Verborgen metadatacaches en wall-clock TTL's maken geen deel uit van het laden van plugins. Alleen runtime-loader-, module- en afhankelijkheidsartefactcaches mogen blijven bestaan nadat code of geïnstalleerde artefacten daadwerkelijk zijn geladen.

Sommige cold-path callers reconstrueren manifestregisters nog steeds rechtstreeks vanuit de persistente geïnstalleerde Plugin-index in plaats van een Gateway-`PluginLookUpTable` te ontvangen. Dat pad reconstrueert het register nu op aanvraag; geef de voorkeur aan het doorgeven van de huidige opzoektabel of een expliciet manifestregister door runtimeflows wanneer een caller er al een heeft.

### Activatieplanning

Activatieplanning is onderdeel van het control plane. Callers kunnen vragen welke plugins relevant zijn voor een concreet commando, provider, kanaal, route, agentharnas of capability voordat bredere runtimeregisters worden geladen.

De planner houdt huidig manifestgedrag compatibel:

- `activation.*`-velden zijn expliciete plannerhints
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks blijven fallback voor manifesteigenaarschap
- de ids-only planner-API blijft beschikbaar voor bestaande callers
- de plan-API rapporteert redenlabels zodat diagnostiek expliciete hints kan onderscheiden van eigenaarschapsfallback

<Warning>
Behandel `activation` niet als een levenscyclus-hook of als vervanging voor `register(...)`. Het is metadata die wordt gebruikt om het laden te beperken. Geef de voorkeur aan eigendomsvelden wanneer die de relatie al beschrijven; gebruik `activation` alleen voor extra planner-hints.
</Warning>

### Kanaalplugins en de gedeelde berichttool

Kanaalplugins hoeven geen aparte send/edit/react-tool te registreren voor normale chatacties. OpenClaw houdt een gedeelde `message`-tool in core, en kanaalplugins zijn eigenaar van de kanaalspecifieke discovery en uitvoering erachter.

De huidige grens is:

- core is eigenaar van de gedeelde `message`-toolhost, prompt-wiring, sessie-/thread-administratie en uitvoeringsdispatch
- kanaalplugins zijn eigenaar van scoped actiediscovery, capability-discovery en eventuele kanaalspecifieke schemafragmenten
- kanaalplugins zijn eigenaar van provider-specifieke gespreksgrammatica voor sessies, zoals hoe gespreks-id's thread-id's coderen of erven van bovenliggende gesprekken
- kanaalplugins voeren de uiteindelijke actie uit via hun actieadapter

Voor kanaalplugins is het SDK-oppervlak `ChannelMessageActionAdapter.describeMessageTool(...)`. Met die uniforme discovery-call kan een plugin zijn zichtbare acties, capabilities en schemabijdragen samen teruggeven, zodat die onderdelen niet uit elkaar gaan lopen.

Wanneer een kanaalspecifieke message-toolparameter een mediabron bevat, zoals een lokaal pad of externe media-URL, moet de plugin ook `mediaSourceParams` teruggeven vanuit `describeMessageTool(...)`. Core gebruikt die expliciete lijst om sandbox-padnormalisatie en hints voor uitgaande mediatoegang toe te passen zonder plugineigen parameternamen hard te coderen. Geef daar de voorkeur aan actiegescopete maps, niet een kanaalbrede platte lijst, zodat een media-param die alleen voor profielen geldt niet wordt genormaliseerd op niet-gerelateerde acties zoals `send`.

Core geeft runtime-scope door aan die discoverystap. Belangrijke velden zijn onder meer:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrouwde inkomende `requesterSenderId`

Dat is belangrijk voor contextgevoelige plugins. Een kanaal kan berichtacties verbergen of zichtbaar maken op basis van het actieve account, de huidige room/thread/het huidige bericht of de vertrouwde identiteit van de aanvrager, zonder kanaalspecifieke branches hard te coderen in de core-`message`-tool.

Daarom blijven routeringswijzigingen voor embedded runners pluginwerk: de runner is verantwoordelijk voor het doorsturen van de huidige chat-/sessie-identiteit naar de plugin-discoverygrens, zodat de gedeelde `message`-tool het juiste kanaaleigen oppervlak voor de huidige beurt zichtbaar maakt.

Voor kanaaleigen uitvoeringshelpers moeten gebundelde plugins de uitvoeringsruntime binnen hun eigen extension-modules houden. Core is niet langer eigenaar van de Discord-, Slack-, Telegram- of WhatsApp-runtimes voor berichtacties onder `src/agents/tools`. We publiceren geen afzonderlijke `plugin-sdk/*-action-runtime`-subpaden, en gebundelde plugins moeten hun eigen lokale runtimecode rechtstreeks importeren uit hun extension-eigen modules.

Dezelfde grens geldt voor providerbenoemde SDK-seams in het algemeen: core mag geen kanaalspecifieke convenience barrels importeren voor Slack, Discord, Signal, WhatsApp of vergelijkbare extensions. Als core gedrag nodig heeft, consumeer dan de eigen `api.ts`- / `runtime-api.ts`-barrel van de gebundelde plugin of promoveer de behoefte naar een smalle generieke capability in de gedeelde SDK.

Gebundelde plugins volgen dezelfde regel. De `runtime-api.ts` van een gebundelde plugin mag zijn eigen branded `openclaw/plugin-sdk/<plugin-id>`-facade niet opnieuw exporteren. Die branded facades blijven compatibiliteitsshims voor externe plugins en oudere consumers, maar gebundelde plugins moeten lokale exports plus smalle generieke SDK-subpaden gebruiken, zoals `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` of `openclaw/plugin-sdk/webhook-ingress`. Nieuwe code mag geen plugin-id-specifieke SDK-facades toevoegen, tenzij de compatibiliteitsgrens voor een bestaand extern ecosysteem dit vereist.

Specifiek voor polls zijn er twee uitvoeringspaden:

- `outbound.sendPoll` is de gedeelde baseline voor kanalen die passen bij het algemene pollmodel
- `actions.handleAction("poll")` is het voorkeurspad voor kanaalspecifieke pollsemantiek of extra pollparameters

Core stelt het parsen van gedeelde polls nu uit totdat plugin-polldispatch de actie afwijst, zodat plugineigen pollhandlers kanaalspecifieke pollvelden kunnen accepteren zonder eerst door de generieke pollparser te worden geblokkeerd.

Zie [interne Plugin-architectuur](/nl/plugins/architecture-internals) voor de volledige opstartvolgorde.

## Capability-eigendomsmodel

OpenClaw behandelt een native plugin als de eigendomsgrens voor een **bedrijf** of een **feature**, niet als een verzameling niet-gerelateerde integraties.

Dat betekent:

- een bedrijfsplugin moet meestal eigenaar zijn van alle OpenClaw-gerichte oppervlakken van dat bedrijf
- een featureplugin moet meestal eigenaar zijn van het volledige feature-oppervlak dat hij introduceert
- kanalen moeten gedeelde core-capabilities consumeren in plaats van provider-gedrag ad hoc opnieuw te implementeren

<AccordionGroup>
  <Accordion title="Vendor met meerdere capabilities">
    `openai` is eigenaar van tekstinferentie, spraak, realtime stem, mediabegrip en beeldgeneratie. `google` is eigenaar van tekstinferentie plus mediabegrip, beeldgeneratie en webzoekopdrachten. `qwen` is eigenaar van tekstinferentie plus mediabegrip en videogeneratie.
  </Accordion>
  <Accordion title="Vendor met één capability">
    `elevenlabs` en `microsoft` zijn eigenaar van spraak; `firecrawl` is eigenaar van web-fetch; `minimax` / `mistral` / `moonshot` / `zai` zijn eigenaar van backends voor mediabegrip.
  </Accordion>
  <Accordion title="Featureplugin">
    `voice-call` is eigenaar van beltransport, tools, CLI, routes en Twilio media-stream-bridging, maar consumeert gedeelde capabilities voor spraak, realtime transcriptie en realtime stem in plaats van vendorplugins rechtstreeks te importeren.
  </Accordion>
</AccordionGroup>

De beoogde eindtoestand is:

- OpenAI leeft in één plugin, zelfs als die tekstmodellen, spraak, afbeeldingen en toekomstige video omvat
- een andere vendor kan hetzelfde doen voor zijn eigen oppervlak
- kanalen maakt het niet uit welke vendorplugin eigenaar is van de provider; ze consumeren het gedeelde capability-contract dat door core wordt blootgesteld

Dit is het kernverschil:

- **plugin** = eigendomsgrens
- **capability** = core-contract dat meerdere plugins kunnen implementeren of consumeren

Dus als OpenClaw een nieuw domein toevoegt, zoals video, is de eerste vraag niet "welke provider moet videoverwerking hard coderen?" De eerste vraag is "wat is het core-contract voor videocapability?" Zodra dat contract bestaat, kunnen vendorplugins zich ervoor registreren en kunnen kanaal-/featureplugins het consumeren.

Als de capability nog niet bestaat, is de juiste stap meestal:

<Steps>
  <Step title="Definieer de capability">
    Definieer de ontbrekende capability in core.
  </Step>
  <Step title="Stel bloot via de SDK">
    Stel die op een getypte manier bloot via de plugin-API/runtime.
  </Step>
  <Step title="Sluit consumers aan">
    Sluit kanalen/features aan op die capability.
  </Step>
  <Step title="Vendorimplementaties">
    Laat vendorplugins implementaties registreren.
  </Step>
</Steps>

Dit houdt eigendom expliciet en voorkomt tegelijk core-gedrag dat afhangt van één vendor of een eenmalig pluginspecifiek codepad.

### Capability-lagen

Gebruik dit mentale model wanneer je beslist waar code thuishoort:

<Tabs>
  <Tab title="Core-capabilitylaag">
    Gedeelde orkestratie, beleid, fallback, regels voor configuratiemerging, leveringssemantiek en getypte contracten.
  </Tab>
  <Tab title="Vendorpluginlaag">
    Vendor-specifieke API's, auth, modelcatalogi, spraaksynthese, beeldgeneratie, toekomstige videobackends, usage-endpoints.
  </Tab>
  <Tab title="Kanaal-/featurepluginlaag">
    Slack-/Discord-/voice-call-/enz.-integratie die core-capabilities consumeert en ze op een oppervlak presenteert.
  </Tab>
</Tabs>

TTS volgt bijvoorbeeld deze vorm:

- core is eigenaar van TTS-beleid op reply-time, fallbackvolgorde, voorkeuren en kanaallevering
- `openai`, `elevenlabs` en `microsoft` zijn eigenaar van synthese-implementaties
- `voice-call` consumeert de runtimehelper voor telefonie-TTS

Datzelfde patroon verdient de voorkeur voor toekomstige capabilities.

### Voorbeeld van een bedrijfsplugin met meerdere capabilities

Een bedrijfsplugin moet van buitenaf samenhangend aanvoelen. Als OpenClaw gedeelde contracten heeft voor modellen, spraak, realtime transcriptie, realtime stem, mediabegrip, beeldgeneratie, videogeneratie, web-fetch en webzoekopdrachten, kan een vendor al zijn oppervlakken op één plek bezitten:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Waar het om gaat zijn niet de exacte helpernamen. De vorm is belangrijk:

- één plugin is eigenaar van het vendoroppervlak
- core blijft eigenaar van de capability-contracten
- kanalen en featureplugins consumeren `api.runtime.*`-helpers, geen vendorcode
- contracttests kunnen controleren dat de plugin de capabilities heeft geregistreerd waarvan hij zegt eigenaar te zijn

### Capability-voorbeeld: videobegrip

OpenClaw behandelt beeld-/audio-/videobegrip al als één gedeelde capability. Hetzelfde eigendomsmodel is daar van toepassing:

<Steps>
  <Step title="Core definieert het contract">
    Core definieert het mediabegripcontract.
  </Step>
  <Step title="Vendorplugins registreren">
    Vendorplugins registreren `describeImage`, `transcribeAudio` en `describeVideo` waar van toepassing.
  </Step>
  <Step title="Consumers gebruiken het gedeelde gedrag">
    Kanalen en featureplugins consumeren het gedeelde core-gedrag in plaats van rechtstreeks naar vendorcode te wiren.
  </Step>
</Steps>

Dat voorkomt dat de videoaannames van één provider in core worden ingebakken. De plugin is eigenaar van het vendoroppervlak; core is eigenaar van het capability-contract en fallbackgedrag.

Videogeneratie gebruikt al dezelfde volgorde: core is eigenaar van het getypte capability-contract en de runtimehelper, en vendorplugins registreren `api.registerVideoGenerationProvider(...)`-implementaties ervoor.

Concrete rollout-checklist nodig? Zie [Capability Cookbook](/nl/plugins/architecture).

## Contracten en afdwinging

Het plugin-API-oppervlak is bewust getypt en gecentraliseerd in `OpenClawPluginApi`. Dat contract definieert de ondersteunde registratiepunten en de runtimehelpers waarop een plugin mag vertrouwen.

Waarom dit belangrijk is:

- pluginauteurs krijgen één stabiele interne standaard
- core kan dubbel eigendom afwijzen, zoals twee plugins die hetzelfde provider-id registreren
- startup kan bruikbare diagnostiek tonen voor foutieve registratie
- contracttests kunnen eigendom van gebundelde plugins afdwingen en stille drift voorkomen

Er zijn twee afdwingingslagen:

<AccordionGroup>
  <Accordion title="Afdwingen van runtime-registratie">
    Het plugin-register valideert registraties terwijl plugins laden. Voorbeelden: dubbele provider-id's, dubbele spraakprovider-id's en misvormde registraties leveren plugin-diagnostiek op in plaats van ongedefinieerd gedrag.
  </Accordion>
  <Accordion title="Contracttests">
    Gebundelde plugins worden tijdens testruns vastgelegd in contractregisters, zodat OpenClaw eigenaarschap expliciet kan controleren. Tegenwoordig wordt dit gebruikt voor modelproviders, spraakproviders, webzoekproviders en eigenaarschap van gebundelde registraties.
  </Accordion>
</AccordionGroup>

Het praktische effect is dat OpenClaw vooraf weet welke plugin eigenaar is van welk oppervlak. Daardoor kunnen core en kanalen naadloos samenwerken, omdat eigenaarschap gedeclareerd, getypeerd en testbaar is in plaats van impliciet.

### Wat in een contract hoort

<Tabs>
  <Tab title="Goede contracten">
    - getypeerd
    - klein
    - capability-specifiek
    - eigendom van core
    - herbruikbaar door meerdere plugins
    - bruikbaar door kanalen/functies zonder kennis van leveranciers

  </Tab>
  <Tab title="Slechte contracten">
    - leveranciersspecifiek beleid verborgen in core
    - eenmalige plugin-ontsnappingsroutes die het register omzeilen
    - kanaalcode die rechtstreeks in een leveranciersimplementatie grijpt
    - ad-hoc runtime-objecten die geen deel uitmaken van `OpenClawPluginApi` of `api.runtime`

  </Tab>
</Tabs>

Verhoog bij twijfel het abstractieniveau: definieer eerst de capability en laat plugins er daarna op aansluiten.

## Uitvoeringsmodel

Native OpenClaw-plugins draaien **in-process** met de Gateway. Ze zijn niet gesandboxt. Een geladen native plugin heeft dezelfde vertrouwensgrens op procesniveau als core-code.

<Warning>
Implicaties van native plugins: een plugin kan tools, netwerkhandlers, hooks en services registreren; een plugin-bug kan de Gateway laten crashen of destabiliseren; en een kwaadaardige native plugin staat gelijk aan willekeurige code-uitvoering binnen het OpenClaw-proces.
</Warning>

Compatibele bundels zijn standaard veiliger, omdat OpenClaw ze momenteel behandelt als metadata-/contentpakketten. In huidige releases betekent dat vooral gebundelde Skills.

Gebruik allowlists en expliciete installatie-/laadpaden voor niet-gebundelde plugins. Behandel workspace-plugins als code voor ontwikkeltijd, niet als productiestandaarden.

Houd voor gebundelde workspace-pakketnamen de plugin-id verankerd in de npm-naam: standaard `@openclaw/<id>`, of een goedgekeurd getypeerd achtervoegsel zoals `-provider`, `-plugin`, `-speech`, `-sandbox` of `-media-understanding` wanneer het pakket bewust een beperktere plugin-rol blootstelt.

<Note>
**Vertrouwensnotitie:** `plugins.allow` vertrouwt **plugin-id's**, niet de herkomst van de bron. Een workspace-plugin met dezelfde id als een gebundelde plugin overschaduwt bewust de gebundelde kopie wanneer die workspace-plugin is ingeschakeld/toegestaan. Dit is normaal en nuttig voor lokale ontwikkeling, patchtests en hotfixes. Vertrouwen in gebundelde plugins wordt bepaald op basis van de bron-snapshot — het manifest en de code op schijf tijdens het laden — in plaats van installatiemetadata. Een beschadigde of vervangen installatieregistratie kan het vertrouwensoppervlak van een gebundelde plugin niet stilzwijgend verbreden buiten wat de daadwerkelijke bron claimt.
</Note>

## Exportgrens

OpenClaw exporteert capabilities, geen implementatiegemak.

Houd capability-registratie publiek. Beperk exports van niet-contractuele helpers:

- helpersubpaden specifiek voor gebundelde plugins
- runtime-plumbing-subpaden die niet als publieke API bedoeld zijn
- leveranciersspecifieke gemakhelpers
- setup-/onboardinghelpers die implementatiedetails zijn

Gereserveerde helpersubpaden voor gebundelde plugins zijn verwijderd uit de gegenereerde SDK-exportmap. Houd eigenaarspecifieke helpers binnen het eigenaar-plugin-pakket; promoveer alleen herbruikbaar hostgedrag naar generieke SDK-contracten zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.

## Internals en referentie

Zie [Interne plugin-architectuur](/nl/plugins/architecture-internals) voor de laadpipeline, het registermodel, provider-runtime-hooks, Gateway-HTTP-routes, schemas voor berichttools, kanaaldoelresolutie, providercatalogi, context-engine-plugins en de gids voor het toevoegen van een nieuwe capability.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin-manifest](/nl/plugins/manifest)
- [Plugin SDK instellen](/nl/plugins/sdk-setup)
