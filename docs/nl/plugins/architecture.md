---
read_when:
    - Native OpenClaw-plugins bouwen of debuggen
    - Het Plugin-capaciteitsmodel of eigendomsgrenzen begrijpen
    - Werken aan de Plugin-laadpijplijn of het register
    - Runtime-hooks voor aanbieders of kanaal-Plugins implementeren
sidebarTitle: Internals
summary: 'Plugin-internals: capabilitymodel, eigenaarschap, contracten, laadpipeline en runtime-helpers'
title: Interne werking van Plugin
x-i18n:
    generated_at: "2026-06-27T17:50:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

Dit is de **diepgaande architectuurreferentie** voor het OpenClaw Plugin-systeem. Voor praktische handleidingen begin je met een van de gerichte pagina's hieronder.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/nl/tools/plugin">
    Eindgebruikershandleiding voor het toevoegen, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/nl/plugins/building-plugins">
    Tutorial voor je eerste Plugin met het kleinste werkende manifest.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/nl/plugins/sdk-channel-plugins">
    Bouw een messagingkanaal-Plugin.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/nl/plugins/sdk-provider-plugins">
    Bouw een modelprovider-Plugin.
  </Card>
  <Card title="SDK overview" icon="book" href="/nl/plugins/sdk-overview">
    Importmap en API-referentie voor registratie.
  </Card>
</CardGroup>

## Publiek capabilitymodel

Capabilities zijn het publieke model voor **native Plugins** binnen OpenClaw. Elke native OpenClaw-Plugin registreert zich voor een of meer capabilitytypen:

| Capability             | Registratiemethode                             | Voorbeeldplugins                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Tekstinferentie        | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Embeddings             | `api.registerEmbeddingProvider(...)`             | Vectorplugins van providers          |
| Spraak                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Realtime stem          | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Transcriptbron         | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| Afbeeldingen genereren | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Muziek genereren       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video genereren        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web ophalen            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web zoeken             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanaal / messaging     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway-discovery      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Een Plugin die nul capabilities registreert maar hooks, tools, discoveryservices of achtergrondservices biedt, is een **legacy hook-only** Plugin. Dat patroon wordt nog steeds volledig ondersteund.
</Note>

### Standpunt over externe compatibiliteit

Het capabilitymodel is in core geland en wordt vandaag gebruikt door gebundelde/native Plugins, maar compatibiliteit voor externe Plugins heeft nog steeds een hogere lat nodig dan "het is geëxporteerd, dus het is bevroren."

| Pluginsituatie                                  | Richtlijn                                                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Bestaande externe Plugins                         | Houd hook-gebaseerde integraties werkend; dit is de compatibiliteitsbasis.                           |
| Nieuwe gebundelde/native Plugins                  | Geef de voorkeur aan expliciete capabilityregistratie boven vendorspecifieke reach-ins of nieuwe hook-only ontwerpen. |
| Externe Plugins die capabilityregistratie gebruiken | Toegestaan, maar behandel capabilityspecifieke helperoppervlakken als in ontwikkeling tenzij docs ze als stabiel markeren. |

Capabilityregistratie is de bedoelde richting. Legacy hooks blijven tijdens de overgang het veiligste pad zonder breuk voor externe Plugins. Geëxporteerde helper-subpaden zijn niet allemaal gelijk — geef de voorkeur aan smalle gedocumenteerde contracten boven toevallige helperexports.

### Plugin-vormen

OpenClaw classificeert elke geladen Plugin in een vorm op basis van het daadwerkelijke registratiegedrag (niet alleen statische metadata):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registreert precies één capabilitytype (bijvoorbeeld een provider-only Plugin zoals `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registreert meerdere capabilitytypen (bijvoorbeeld `openai` beheert tekstinferentie, spraak, mediabegrip en afbeeldingen genereren).
  </Accordion>
  <Accordion title="hook-only">
    Registreert alleen hooks (getypeerd of aangepast), geen capabilities, tools, commands of services.
  </Accordion>
  <Accordion title="non-capability">
    Registreert tools, commands, services of routes, maar geen capabilities.
  </Accordion>
</AccordionGroup>

Gebruik `openclaw plugins inspect <id>` om de vorm en capability-uitsplitsing van een Plugin te zien. Zie [CLI-referentie](/nl/cli/plugins#inspect) voor details.

### Legacy hooks

De hook `before_agent_start` blijft ondersteund als compatibiliteitspad voor hook-only Plugins. Legacy Plugins uit de praktijk zijn er nog steeds van afhankelijk.

Richting:

- houd het werkend
- documenteer het als legacy
- geef voor model-/provider-overridewerk de voorkeur aan `before_model_resolve`
- geef voor promptmutatiewerk de voorkeur aan `before_prompt_build`
- verwijder het alleen nadat echt gebruik is gedaald en fixturedekking migratieveiligheid bewijst

### Compatibiliteitssignalen

Wanneer je `openclaw doctor` of `openclaw plugins inspect <id>` uitvoert, kun je een van deze labels zien:

| Signaal                    | Betekenis                                                   |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config wordt goed geparsed en Plugins worden opgelost        |
| **compatibility advisory** | Plugin gebruikt een ondersteund maar ouder patroon (bijv. `hook-only`) |
| **legacy warning**         | Plugin gebruikt `before_agent_start`, dat deprecated is      |
| **hard error**             | Config is ongeldig of Plugin kon niet worden geladen         |

Noch `hook-only`, noch `before_agent_start` breekt je Plugin vandaag: `hook-only` is adviserend, en `before_agent_start` triggert alleen een waarschuwing. Deze signalen verschijnen ook in `openclaw status --all` en `openclaw plugins doctor`.

## Architectuuroverzicht

Het Plugin-systeem van OpenClaw heeft vier lagen:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw vindt kandidaat-Plugins via geconfigureerde paden, workspaceroots, globale Plugin-roots en gebundelde Plugins. Discovery leest eerst native `openclaw.plugin.json`-manifesten plus ondersteunde bundelmanifests.
  </Step>
  <Step title="Enablement + validation">
    Core beslist of een gevonden Plugin is ingeschakeld, uitgeschakeld, geblokkeerd of geselecteerd voor een exclusieve slot zoals geheugen.
  </Step>
  <Step title="Runtime loading">
    Native OpenClaw-Plugins worden in-process geladen en registreren capabilities in een centraal register. Verpakte JavaScript laadt via native `require`; lokale TypeScript-broncode van derden is de noodfallback via Jiti. Compatibele bundels worden genormaliseerd naar registerrecords zonder runtimecode te importeren.
  </Step>
  <Step title="Surface consumption">
    De rest van OpenClaw leest het register om tools, kanalen, providersetup, hooks, HTTP-routes, CLI-commands en services beschikbaar te maken.
  </Step>
</Steps>

Specifiek voor Plugin-CLI is rootcommand-discovery opgesplitst in twee fasen:

- parse-time metadata komt uit `registerCli(..., { descriptors: [...] })`
- de echte Plugin-CLI-module kan lazy blijven en zich registreren bij de eerste aanroep

Daardoor blijft CLI-code die eigendom is van de Plugin binnen de Plugin, terwijl OpenClaw nog steeds rootcommandnamen kan reserveren vóór het parsen.

De belangrijke ontwerpgrens:

- manifest-/configvalidatie moet werken op basis van **manifest-/schemametadata** zonder Plugin-code uit te voeren
- native capability-discovery mag vertrouwde Plugin-entrycode laden om een niet-activerende registersnapshot te bouwen
- native runtimegedrag komt uit het pad `register(api)` van de Plugin-module met `api.registrationMode === "full"`

Die splitsing laat OpenClaw config valideren, ontbrekende/uitgeschakelde Plugins uitleggen en UI-/schemahints bouwen voordat de volledige runtime actief is.

### Snapshot van Plugin-metadata en opzoektabel

Bij Gateway-startup wordt één `PluginMetadataSnapshot` gebouwd voor de huidige configsnapshot. De snapshot bevat alleen metadata: hij bewaart de geïnstalleerde Plugin-index, manifestregister, manifestdiagnoses, ownermaps, een Plugin-id-normalizer en manifestrecords. Hij bevat geen geladen Plugin-modules, provider-SDK's, package-inhoud of runtimeexports.

Pluginbewuste configvalidatie, automatische inschakeling bij startup en Gateway-Plugin-bootstrap gebruiken die snapshot in plaats van manifest-/indexmetadata onafhankelijk opnieuw op te bouwen. `PluginLookUpTable` wordt afgeleid uit dezelfde snapshot en voegt het startup-Pluginplan toe voor de huidige runtimeconfig.

Na startup houdt Gateway de huidige metadatasnapshot als een vervangbaar runtimeproduct. Herhaalde runtime-providerdiscovery kan die snapshot lenen in plaats van voor elke provider-catalogpass de geïnstalleerde index en het manifestregister opnieuw te construeren. De snapshot wordt gewist of vervangen bij Gateway-shutdown, config-/Plugin-inventariswijzigingen en schrijfacties naar de geïnstalleerde index; callers vallen terug op het koude manifest-/indexpad wanneer er geen compatibele huidige snapshot bestaat. Compatibiliteitscontroles moeten Plugin-discoveryroots bevatten zoals `plugins.load.paths` en de standaard agentworkspace, omdat workspace-Plugins deel uitmaken van de metadatascope.

De snapshot en opzoektabel houden herhaalde startupbeslissingen op het snelle pad:

- kanaaleigenaarschap
- uitgestelde kanaalstartup
- startup-Plugin-id's
- eigenaarschap van provider- en CLI-backend
- eigenaarschap van setupprovider, commandalias, modelcatalogusprovider en manifestcontract
- validatie van Plugin-configschema en kanaalconfigschema
- beslissingen voor automatische inschakeling bij startup

De veiligheidsgrens is snapshotvervanging, niet mutatie. Bouw de snapshot opnieuw wanneer config, Plugin-inventaris, installatierecords of beleid voor persistente indexen verandert. Behandel hem niet als een breed mutabel globaal register, en bewaar geen onbegrensde historische snapshots. Runtime-Plugin-lading blijft gescheiden van metadatasnapshots, zodat verouderde runtimestatus niet achter een metadatacache kan worden verborgen.

De cacheregel is gedocumenteerd in [Interne Plugin-architectuur](/nl/plugins/architecture-internals#plugin-cache-boundary): manifest- en discoverymetadata zijn vers tenzij een caller een expliciete snapshot, opzoektabel of manifestregister voor de huidige flow heeft. Verborgen metadatacaches en wall-clock TTL's maken geen deel uit van Plugin-lading. Alleen runtime-loader-, module- en dependency-artifactcaches mogen blijven bestaan nadat code of geïnstalleerde artefacten daadwerkelijk zijn geladen.

Sommige callers op het koude pad reconstrueren manifestregisters nog steeds rechtstreeks uit de persistente geïnstalleerde Plugin-index in plaats van een Gateway-`PluginLookUpTable` te ontvangen. Dat pad reconstrueert het register nu on demand; geef de voorkeur aan het doorgeven van de huidige opzoektabel of een expliciet manifestregister door runtimeflows wanneer een caller er al een heeft.

### Activeringsplanning

Activeringsplanning maakt deel uit van het control plane. Callers kunnen vragen welke Plugins relevant zijn voor een concreet command, provider, kanaal, route, agentharnas of capability voordat bredere runtimeregisters worden geladen.

De planner houdt huidig manifestgedrag compatibel:

- `activation.*`-velden zijn expliciete planner-hints
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks blijven de manifest-eigendomsterugval
- de ids-only planner-API blijft beschikbaar voor bestaande aanroepers
- de plan-API rapporteert redenlabels zodat diagnostiek expliciete hints kan onderscheiden van eigendomsterugval

<Warning>
Behandel `activation` niet als een lifecycle-hook of als vervanging voor `register(...)`. Het is metadata die wordt gebruikt om laden te beperken. Geef de voorkeur aan eigendomsvelden wanneer die de relatie al beschrijven; gebruik `activation` alleen voor extra planner-hints.
</Warning>

### Kanaalplugins en de gedeelde berichttool

Kanaalplugins hoeven geen aparte tool voor verzenden/bewerken/reageren te registreren voor normale chatacties. OpenClaw behoudt één gedeelde `message`-tool in de core, en kanaalplugins zijn eigenaar van de kanaalspecifieke ontdekking en uitvoering erachter.

De huidige grens is:

- core is eigenaar van de gedeelde `message`-toolhost, prompt-bedrading, sessie-/threadboekhouding en uitvoeringsdispatch
- kanaalplugins zijn eigenaar van scoped actiedetectie, capability-detectie en eventuele kanaalspecifieke schemafragmenten
- kanaalplugins zijn eigenaar van provider-specifieke sessiegespreksgrammatica, zoals hoe gesprek-id's thread-id's coderen of overnemen van bovenliggende gesprekken
- kanaalplugins voeren de uiteindelijke actie uit via hun actie-adapter

Voor kanaalplugins is het SDK-oppervlak `ChannelMessageActionAdapter.describeMessageTool(...)`. Met die uniforme ontdekkingaanroep kan een Plugin zijn zichtbare acties, capabilities en schemabijdragen samen teruggeven, zodat die onderdelen niet uit elkaar gaan lopen.

Wanneer een kanaalspecifieke message-toolparameter een mediabron bevat, zoals een lokaal pad of externe media-URL, moet de Plugin ook `mediaSourceParams` retourneren vanuit `describeMessageTool(...)`. Core gebruikt die expliciete lijst om sandbox-padnormalisatie en outbound media-access hints toe te passen zonder plugin-eigen parameternamen te hardcoden. Geef daar de voorkeur aan actie-scoped maps, niet aan één kanaalbrede platte lijst, zodat een media-parameter die alleen voor profielen geldt niet wordt genormaliseerd bij niet-gerelateerde acties zoals `send`.

Core geeft runtime-scope door aan die ontdekkingsstap. Belangrijke velden zijn onder andere:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrouwde inkomende `requesterSenderId`

Dat is belangrijk voor contextgevoelige plugins. Een kanaal kan berichtacties verbergen of tonen op basis van het actieve account, de huidige ruimte/thread/het huidige bericht, of de vertrouwde identiteit van de aanvrager, zonder kanaalspecifieke branches in de core-`message`-tool te hardcoden.

Daarom blijven embedded-runner-routeringswijzigingen Plugin-werk: de runner is verantwoordelijk voor het doorsturen van de huidige chat-/sessie-identiteit naar de Plugin-ontdekkingsgrens, zodat de gedeelde `message`-tool het juiste kanaaleigen oppervlak voor de huidige beurt exposeert.

Voor kanaaleigen uitvoeringshelpers moeten gebundelde plugins de uitvoeringsruntime binnen hun eigen extensiemodules houden. Core is niet langer eigenaar van de Discord-, Slack-, Telegram- of WhatsApp-message-action-runtimes onder `src/agents/tools`. We publiceren geen aparte `plugin-sdk/*-action-runtime`-subpaden, en gebundelde plugins moeten hun eigen lokale runtimecode rechtstreeks importeren vanuit hun extensie-eigen modules.

Dezelfde grens geldt in het algemeen voor provider-genoemde SDK-naden: core moet geen kanaalspecifieke convenience-barrels importeren voor Slack, Discord, Signal, WhatsApp of vergelijkbare extensies. Als core gedrag nodig heeft, consumeer dan de eigen `api.ts` / `runtime-api.ts`-barrel van de gebundelde Plugin of promoveer de behoefte naar een smalle generieke capability in de gedeelde SDK.

Gebundelde plugins volgen dezelfde regel. De `runtime-api.ts` van een gebundelde Plugin mag niet zijn eigen branded `openclaw/plugin-sdk/<plugin-id>`-facade opnieuw exporteren. Die branded facades blijven compatibiliteitsshims voor externe plugins en oudere consumers, maar gebundelde plugins moeten lokale exports gebruiken plus smalle generieke SDK-subpaden zoals `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` of `openclaw/plugin-sdk/webhook-ingress`. Nieuwe code mag geen plugin-id-specifieke SDK-facades toevoegen, tenzij de compatibiliteitsgrens voor een bestaand extern ecosysteem dit vereist.

Specifiek voor polls zijn er twee uitvoeringspaden:

- `outbound.sendPoll` is de gedeelde baseline voor kanalen die passen bij het gangbare pollmodel
- `actions.handleAction("poll")` is het voorkeurspad voor kanaalspecifieke pollsemantiek of extra pollparameters

Core stelt gedeelde poll-parsing nu uit tot nadat Plugin-poll-dispatch de actie weigert, zodat plugin-eigen pollhandlers kanaalspecifieke pollvelden kunnen accepteren zonder eerst te worden geblokkeerd door de generieke pollparser.

Zie [Interne Plugin-architectuur](/nl/plugins/architecture-internals) voor de volledige opstartvolgorde.

## Capability-eigendomsmodel

OpenClaw behandelt een native Plugin als de eigendomsgrens voor een **bedrijf** of een **feature**, niet als een grabbelton met niet-gerelateerde integraties.

Dat betekent:

- een bedrijfsplugin moet doorgaans eigenaar zijn van alle OpenClaw-gerichte oppervlakken van dat bedrijf
- een feature-Plugin moet doorgaans eigenaar zijn van het volledige feature-oppervlak dat hij introduceert
- kanalen moeten gedeelde core-capabilities gebruiken in plaats van provider-gedrag ad hoc opnieuw te implementeren

<AccordionGroup>
  <Accordion title="Vendor met meerdere capabilities">
    `openai` is eigenaar van tekstinferentie, spraak, realtime spraak, mediabegrip en beeldgeneratie. `google` is eigenaar van tekstinferentie plus mediabegrip, beeldgeneratie en webzoekopdrachten. `qwen` is eigenaar van tekstinferentie plus mediabegrip en videogeneratie.
  </Accordion>
  <Accordion title="Vendor met één capability">
    `elevenlabs` en `microsoft` zijn eigenaar van spraak; `firecrawl` is eigenaar van web-fetch; `minimax` / `mistral` / `moonshot` / `zai` zijn eigenaar van backends voor mediabegrip.
  </Accordion>
  <Accordion title="Feature-Plugin">
    `voice-call` is eigenaar van call-transport, tools, CLI, routes en Twilio media-stream bridging, maar consumeert gedeelde capabilities voor spraak, realtime transcriptie en realtime spraak in plaats van vendorplugins rechtstreeks te importeren.
  </Accordion>
</AccordionGroup>

De beoogde eindtoestand is:

- OpenAI leeft in één Plugin, zelfs als die tekstmodellen, spraak, beelden en toekomstige video omvat
- een andere vendor kan hetzelfde doen voor zijn eigen oppervlak
- kanalen maakt het niet uit welke vendorplugin eigenaar is van de provider; ze consumeren het gedeelde capability-contract dat door core wordt geëxposeerd

Dit is het belangrijkste onderscheid:

- **Plugin** = eigendomsgrens
- **capability** = core-contract dat meerdere plugins kunnen implementeren of consumeren

Dus als OpenClaw een nieuw domein zoals video toevoegt, is de eerste vraag niet "welke provider moet videoafhandeling hardcoden?" De eerste vraag is: "wat is het core-videocapability-contract?" Zodra dat contract bestaat, kunnen vendorplugins zich erop registreren en kunnen kanaal-/featureplugins het consumeren.

Als de capability nog niet bestaat, is de juiste stap meestal:

<Steps>
  <Step title="Definieer de capability">
    Definieer de ontbrekende capability in core.
  </Step>
  <Step title="Exposeer via de SDK">
    Exposeer deze op getypeerde wijze via de plugin-API/runtime.
  </Step>
  <Step title="Sluit consumers aan">
    Sluit kanalen/features aan op die capability.
  </Step>
  <Step title="Vendor-implementaties">
    Laat vendorplugins implementaties registreren.
  </Step>
</Steps>

Dit houdt eigendom expliciet terwijl core-gedrag wordt vermeden dat afhankelijk is van één vendor of een eenmalig plugin-specifiek codepad.

### Capability-lagen

Gebruik dit mentale model bij het bepalen waar code thuishoort:

<Tabs>
  <Tab title="Core-capabilitylaag">
    Gedeelde orkestratie, beleid, fallback, regels voor config-merge, leveringssemantiek en getypeerde contracten.
  </Tab>
  <Tab title="Vendorpluginlaag">
    Vendor-specifieke API's, auth, modelcatalogi, spraaksynthese, beeldgeneratie, toekomstige videobackends, gebruikseindpunten.
  </Tab>
  <Tab title="Kanaal-/featurepluginlaag">
    Slack-/Discord-/voice-call-/enz.-integratie die core-capabilities consumeert en ze op een oppervlak presenteert.
  </Tab>
</Tabs>

TTS volgt bijvoorbeeld deze vorm:

- core is eigenaar van reply-time TTS-beleid, fallback-volgorde, voorkeuren en kanaallevering
- `openai`, `elevenlabs` en `microsoft` zijn eigenaar van synthese-implementaties
- `voice-call` consumeert de telephony TTS-runtimehelper

Datzelfde patroon verdient de voorkeur voor toekomstige capabilities.

### Voorbeeld van bedrijfsplugin met meerdere capabilities

Een bedrijfsplugin moet van buitenaf samenhangend aanvoelen. Als OpenClaw gedeelde contracten heeft voor modellen, spraak, realtime transcriptie, realtime spraak, mediabegrip, beeldgeneratie, videogeneratie, web-fetch en webzoekopdrachten, kan een vendor al zijn oppervlakken op één plek bezitten:

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

Waar het om gaat, zijn niet de exacte helpernamen. De vorm is belangrijk:

- één Plugin is eigenaar van het vendoroppervlak
- core blijft eigenaar van de capability-contracten
- kanalen en featureplugins consumeren `api.runtime.*`-helpers, geen vendorcode
- contracttests kunnen bevestigen dat de Plugin de capabilities heeft geregistreerd waarvan hij claimt eigenaar te zijn

### Capability-voorbeeld: videobegrip

OpenClaw behandelt beeld-/audio-/videobegrip al als één gedeelde capability. Daar geldt hetzelfde eigendomsmodel:

<Steps>
  <Step title="Core definieert het contract">
    Core definieert het mediabegripcontract.
  </Step>
  <Step title="Vendorplugins registreren">
    Vendorplugins registreren `describeImage`, `transcribeAudio` en `describeVideo` waar van toepassing.
  </Step>
  <Step title="Consumers gebruiken het gedeelde gedrag">
    Kanalen en featureplugins consumeren het gedeelde core-gedrag in plaats van rechtstreeks aan vendorcode te koppelen.
  </Step>
</Steps>

Dat voorkomt dat video-aannames van één provider in core worden ingebakken. De Plugin is eigenaar van het vendoroppervlak; core is eigenaar van het capability-contract en fallback-gedrag.

Videogeneratie gebruikt al dezelfde volgorde: core is eigenaar van het getypeerde capability-contract en de runtimehelper, en vendorplugins registreren `api.registerVideoGenerationProvider(...)`-implementaties erop.

Een concrete uitrolchecklist nodig? Zie [Capability Cookbook](/nl/plugins/adding-capabilities).

## Contracten en handhaving

Het plugin-API-oppervlak is bewust getypeerd en gecentraliseerd in `OpenClawPluginApi`. Dat contract definieert de ondersteunde registratiepunten en de runtimehelpers waarop een Plugin mag vertrouwen.

Waarom dit belangrijk is:

- plugin-auteurs krijgen één stabiele interne standaard
- core kan dubbele eigendom afwijzen, zoals twee plugins die dezelfde provider-id registreren
- opstarten kan bruikbare diagnostiek tonen voor verkeerd gevormde registratie
- contracttests kunnen eigendom van gebundelde plugins afdwingen en stille drift voorkomen

Er zijn twee lagen van handhaving:

<AccordionGroup>
  <Accordion title="Handhaving van runtimeregistratie">
    Het pluginregister valideert registraties terwijl plugins worden geladen. Voorbeelden: dubbele provider-id's, dubbele spraakprovider-id's en ongeldige registraties leveren plugindiagnostiek op in plaats van ongedefinieerd gedrag.
  </Accordion>
  <Accordion title="Contracttests">
    Gebundelde plugins worden tijdens testruns vastgelegd in contractregisters, zodat OpenClaw eigendom expliciet kan bevestigen. Vandaag wordt dit gebruikt voor modelproviders, spraakproviders, webzoekproviders en eigendom van gebundelde registraties.
  </Accordion>
</AccordionGroup>

Het praktische effect is dat OpenClaw vooraf weet welke plugin eigenaar is van welk oppervlak. Daardoor kunnen core en kanalen naadloos samenwerken, omdat eigendom wordt gedeclareerd, getypeerd en testbaar is in plaats van impliciet.

### Wat in een contract thuishoort

<Tabs>
  <Tab title="Goede contracten">
    - getypeerd
    - klein
    - mogelijkheden-specifiek
    - eigendom van core
    - herbruikbaar door meerdere plugins
    - bruikbaar door kanalen/features zonder leverancierskennis

  </Tab>
  <Tab title="Slechte contracten">
    - leveranciersspecifiek beleid verborgen in core
    - eenmalige plugin-uitwegen die het register omzeilen
    - kanaalcode die rechtstreeks in een leveranciersimplementatie grijpt
    - ad-hoc runtimeobjecten die geen deel uitmaken van `OpenClawPluginApi` of `api.runtime`

  </Tab>
</Tabs>

Verhoog bij twijfel het abstractieniveau: definieer eerst de mogelijkheid en laat plugins er vervolgens op aansluiten.

## Uitvoeringsmodel

Native OpenClaw-plugins draaien **in-process** met de Gateway. Ze zijn niet gesandboxed. Een geladen native plugin heeft dezelfde vertrouwensgrens op procesniveau als core-code.

<Warning>
Implicaties van native plugins: een plugin kan tools, netwerkhandlers, hooks en services registreren; een pluginbug kan de gateway laten crashen of destabiliseren; en een kwaadwillende native plugin staat gelijk aan willekeurige code-uitvoering binnen het OpenClaw-proces.
</Warning>

Compatibele bundels zijn standaard veiliger, omdat OpenClaw ze momenteel behandelt als metadata-/contentpakketten. In huidige releases betekent dat vooral gebundelde Skills.

Gebruik allowlists en expliciete installatie-/laadpaden voor niet-gebundelde plugins. Behandel workspace-plugins als code voor ontwikkeltijd, niet als productiestandaarden.

Houd voor gebundelde workspace-pakketnamen de plugin-id verankerd in de npm-naam: standaard `@openclaw/<id>`, of een goedgekeurd getypeerd achtervoegsel zoals `-provider`, `-plugin`, `-speech`, `-sandbox` of `-media-understanding` wanneer het pakket bewust een smallere pluginrol blootlegt.

<Note>
**Vertrouwensnotitie:** `plugins.allow` vertrouwt **plugin-id's**, niet de herkomst van de bron. Een workspace-plugin met dezelfde id als een gebundelde plugin overschaduwt bewust de gebundelde kopie wanneer die workspace-plugin is ingeschakeld/op de allowlist staat. Dit is normaal en nuttig voor lokale ontwikkeling, patchtests en hotfixes. Vertrouwen in gebundelde plugins wordt bepaald op basis van de bronmomentopname — het manifest en de code op schijf tijdens het laden — in plaats van installatiemetadata. Een beschadigde of vervangen installatierecord kan het vertrouwensoppervlak van een gebundelde plugin niet stilzwijgend uitbreiden buiten wat de daadwerkelijke bron claimt.
</Note>

## Exportgrens

OpenClaw exporteert mogelijkheden, geen implementatiegemak.

Houd mogelijkhedenregistratie openbaar. Snoei helperexports zonder contract:

- helper-subpaden specifiek voor gebundelde plugins
- subpaden voor runtimebedrading die niet bedoeld zijn als openbare API
- leveranciersspecifieke gemakhelpers
- setup-/onboardinghelpers die implementatiedetails zijn

Gereserveerde helper-subpaden voor gebundelde plugins zijn uit de gegenereerde SDK-exportmap verwijderd. Houd eigenaarspecifieke helpers binnen het pakket van de eigenaarplugin; promoveer alleen herbruikbaar hostgedrag naar generieke SDK-contracten zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.

## Internals en referentie

Zie [Interne pluginarchitectuur](/nl/plugins/architecture-internals) voor de laadpipeline, het registermodel, providerruntimehooks, Gateway HTTP-routes, berichttoolschema's, kanaaldoelresolutie, providercatalogi, contextengine-plugins en de handleiding voor het toevoegen van een nieuwe mogelijkheid.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [Pluginmanifest](/nl/plugins/manifest)
- [Plugin-SDK instellen](/nl/plugins/sdk-setup)
