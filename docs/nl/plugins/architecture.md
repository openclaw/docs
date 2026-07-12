---
read_when:
    - Native OpenClaw-plugins bouwen of fouten erin opsporen
    - Inzicht in het Plugin-capabiliteitsmodel en de eigendomsgrenzen
    - Werken aan de laadpijplijn of het register van Plugins
    - Runtimehooks voor providers of kanaalplugins implementeren
sidebarTitle: Internals
summary: 'Interne werking van Plugins: capaciteitsmodel, eigenaarschap, contracten, laadpijplijn en runtimehelpers'
title: Interne werking van Plugins
x-i18n:
    generated_at: "2026-07-12T09:05:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Dit is de **uitgebreide architectuurreferentie** voor het pluginsysteem van OpenClaw. Begin voor praktische handleidingen met een van de onderstaande specifieke pagina's.

<CardGroup cols={2}>
  <Card title="Plugins installeren en gebruiken" icon="plug" href="/nl/tools/plugin">
    Handleiding voor eindgebruikers over het toevoegen, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Plugins bouwen" icon="rocket" href="/nl/plugins/building-plugins">
    Tutorial voor een eerste plugin met het kleinst werkende manifest.
  </Card>
  <Card title="Kanaalplugins" icon="comments" href="/nl/plugins/sdk-channel-plugins">
    Bouw een plugin voor een berichtenkanaal.
  </Card>
  <Card title="Providerplugins" icon="microchip" href="/nl/plugins/sdk-provider-plugins">
    Bouw een plugin voor een modelprovider.
  </Card>
  <Card title="SDK-overzicht" icon="book" href="/nl/plugins/sdk-overview">
    Referentie voor de importstructuur en registratie-API.
  </Card>
</CardGroup>

## Openbaar capaciteitenmodel

Capaciteiten vormen binnen OpenClaw het openbare model voor **native plugins**. Elke native OpenClaw-plugin registreert zich voor een of meer capaciteitstypen:

| Capaciteit                    | Registratiemethode                               | Voorbeeldplugins                |
| ----------------------------- | ------------------------------------------------ | ------------------------------- |
| Tekstinferentie               | `api.registerProvider(...)`                      | `anthropic`, `openai`           |
| CLI-inferentiebackend         | `api.registerCliBackend(...)`                    | `anthropic`, `openai`           |
| Embeddings                    | `api.registerEmbeddingProvider(...)`             | Vectorplugins van providers     |
| Spraak                        | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`       |
| Realtime transcriptie         | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Realtime spraak               | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`              |
| Mediabegrip                   | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`              |
| Transcriptbron                | `api.registerTranscriptSourceProvider(...)`      | `discord`                       |
| Afbeeldingsgeneratie          | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`       |
| Muziekgeneratie               | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`      |
| Videogeneratie                | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`         |
| Webinhoud ophalen             | `api.registerWebFetchProvider(...)`              | `firecrawl`                     |
| Zoeken op internet            | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google`  |
| Kanaal / berichtenuitwisseling | `api.registerChannel(...)`                      | `matrix`, `msteams`             |
| Gateway-detectie              | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                       |

<Note>
Een plugin die geen capaciteiten registreert, maar wel hooks, tools, detectieservices of achtergrondservices biedt, is een **verouderde plugin met alleen hooks**. Dat patroon wordt nog steeds volledig ondersteund.
</Note>

### Standpunt over externe compatibiliteit

Het capaciteitenmodel is in de kern opgenomen en wordt momenteel gebruikt door meegeleverde/native plugins, maar voor compatibiliteit met externe plugins geldt een strengere norm dan: "het is geëxporteerd, dus het ligt vast."

| Pluginsituatie                                  | Richtlijn                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Bestaande externe plugins                      | Laat op hooks gebaseerde integraties werken; dit is de compatibiliteitsbasis.                                        |
| Nieuwe meegeleverde/native plugins             | Geef de voorkeur aan expliciete capaciteitsregistratie boven leverancierspecifieke interne toegang of nieuwe ontwerpen met alleen hooks. |
| Externe plugins die capaciteitsregistratie gebruiken | Toegestaan, maar beschouw capaciteitsspecifieke hulpoppervlakken als veranderlijk, tenzij de documentatie ze als stabiel markeert. |

Capaciteitsregistratie is de beoogde richting. Verouderde hooks blijven tijdens de overgang voor externe plugins de veiligste route zonder brekende wijzigingen. Niet alle geëxporteerde hulpsubpaden zijn gelijkwaardig — geef de voorkeur aan beperkte, gedocumenteerde contracten boven incidentele hulpexports.

### Pluginvormen

OpenClaw deelt elke geladen plugin in een vorm in op basis van het daadwerkelijke registratiegedrag (niet alleen op basis van statische metadata):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registreert precies één capaciteitstype (bijvoorbeeld een plugin die alleen providerfunctionaliteit biedt, zoals `arcee` of `chutes`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registreert meerdere capaciteitstypen (zo beheert `openai` tekstinferentie, spraak, mediabegrip en afbeeldingsgeneratie).
  </Accordion>
  <Accordion title="hook-only">
    Registreert alleen hooks (getypeerd of aangepast), zonder capaciteiten, tools, opdrachten of services.
  </Accordion>
  <Accordion title="non-capability">
    Registreert tools, opdrachten, services of routes, maar geen capaciteiten.
  </Accordion>
</AccordionGroup>

Gebruik `openclaw plugins inspect <id>` om de vorm en de verdeling van capaciteiten van een plugin te bekijken. Zie de [CLI-referentie](/nl/cli/plugins#inspect) voor details.

### Verouderde hooks

De hook `before_agent_start` blijft ondersteund als compatibiliteitsroute voor plugins met alleen hooks. Bestaande plugins uit de praktijk zijn er nog steeds van afhankelijk.

Richting:

- blijven ondersteunen
- als verouderd documenteren
- voor het overschrijven van modellen/providers de voorkeur geven aan `before_model_resolve`
- voor het wijzigen van prompts de voorkeur geven aan `before_prompt_build`
- pas verwijderen nadat het daadwerkelijke gebruik is afgenomen en de dekking door fixtures de veiligheid van de migratie aantoont

### Compatibiliteitssignalen

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` en `openclaw plugins doctor` tonen deze compatibiliteitsmeldingen:

| Signaal                                      | Betekenis                                                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **configuratie geldig**                      | De configuratie wordt correct geparseerd en plugins worden gevonden                                                            |
| **alleen hooks** (informatie)                | De plugin registreert alleen hooks; dit is een ondersteunde route, maar nog niet gemigreerd naar capaciteitsregistratie         |
| **verouderde `before_agent_start`** (waarschuwing) | De plugin gebruikt de afgeschreven hook `before_agent_start` in plaats van `before_model_resolve`/`before_prompt_build`   |
| **afgeschreven API voor geheugenembeddings** (waarschuwing) | Een niet-meegeleverde plugin gebruikt de oude geheugenspecifieke API voor embeddingproviders in plaats van `registerEmbeddingProvider` |
| **kritieke fout**                            | De configuratie is ongeldig of de plugin kon niet worden geladen                                                               |

Geen van de informatieve of waarschuwingssignalen zorgt er momenteel voor dat uw plugin niet meer werkt. Deze signalen verschijnen ook in `openclaw status --all` en `openclaw plugins doctor`.

## Architectuuroverzicht

Het pluginsysteem van OpenClaw bestaat uit vier lagen:

<Steps>
  <Step title="Manifest + detectie">
    OpenClaw vindt kandidaat-plugins via geconfigureerde paden, werkruimteroots, globale pluginroots en meegeleverde plugins. Bij de detectie worden eerst native `openclaw.plugin.json`-manifesten en ondersteunde bundelmanifesten gelezen.
  </Step>
  <Step title="Inschakeling + validatie">
    De kern bepaalt of een gevonden plugin is ingeschakeld, uitgeschakeld, geblokkeerd of geselecteerd voor een exclusief slot, zoals geheugen.
  </Step>
  <Step title="Laden tijdens runtime">
    Native OpenClaw-plugins worden in het proces geladen en registreren capaciteiten in een centraal register. Verpakte JavaScript wordt geladen via native `require`; lokale TypeScript-broncode van derden gebruikt Jiti als noodoplossing. Compatibele bundels worden genormaliseerd tot registerrecords zonder runtimecode te importeren.
  </Step>
  <Step title="Gebruik van oppervlakken">
    De rest van OpenClaw leest het register om tools, kanalen, providerconfiguratie, hooks, HTTP-routes, CLI-opdrachten en services beschikbaar te maken.
  </Step>
</Steps>

Specifiek voor de plugin-CLI is de detectie van rootopdrachten opgesplitst in twee fasen:

- metadata tijdens het parseren is afkomstig van `registerCli(..., { descriptors: [...] })`
- de daadwerkelijke CLI-module van de plugin kan lui geladen blijven en zich bij de eerste aanroep registreren

Hierdoor blijft CLI-code die eigendom is van een plugin binnen die plugin, terwijl OpenClaw toch namen van rootopdrachten kan reserveren voordat het parseren begint.

De belangrijke ontwerpgrens:

- validatie van manifesten/configuratie moet op basis van **manifest-/schemametadata** werken zonder plugincode uit te voeren
- bij native capaciteitsdetectie mag vertrouwde invoercode van plugins worden geladen om een niet-activerende momentopname van het register op te bouwen
- native runtimegedrag is afkomstig van het pad `register(api)` van de pluginmodule, waarbij `api.registrationMode === "full"`

Dankzij deze scheiding kan OpenClaw configuratie valideren, ontbrekende/uitgeschakelde plugins toelichten en hints voor de gebruikersinterface en het schema opbouwen voordat de volledige runtime actief is.

### Momentopname van pluginmetadata en opzoektabel

Bij het starten van de Gateway wordt één `PluginMetadataSnapshot` opgebouwd voor de huidige configuratiemomentopname. De momentopname bevat alleen metadata: de index van geïnstalleerde plugins, het manifestregister, manifestdiagnostiek, eigenaartoewijzingen, een normalisatiefunctie voor plugin-id's en manifestrecords. De momentopname bevat geen geladen pluginmodules, provider-SDK's, pakketinhoud of runtime-exports.

Pluginbewuste configuratievalidatie, automatisch inschakelen bij het opstarten en de initialisatie van Gateway-plugins gebruiken die momentopname in plaats van onafhankelijk manifest-/indexmetadata opnieuw op te bouwen. `PluginLookUpTable` wordt afgeleid van dezelfde momentopname en voegt het opstartplan voor plugins toe voor de huidige runtimeconfiguratie.

Na het opstarten bewaart Gateway de huidige metadatamomentopname als een vervangbaar runtimeproduct. Herhaalde detectie van providers tijdens runtime kan die momentopname gebruiken in plaats van voor elke doorgang door de providercatalogus de geïnstalleerde index en het manifestregister opnieuw op te bouwen. De momentopname wordt gewist of vervangen wanneer Gateway wordt afgesloten, wanneer de configuratie/plugininventaris verandert en wanneer naar de geïnstalleerde index wordt geschreven; aanroepers vallen terug op het koude manifest-/indexpad als er geen compatibele actuele momentopname bestaat. Compatibiliteitscontroles moeten plugin-detectieroots omvatten, zoals `plugins.load.paths` en de standaardwerkruimte van de agent, omdat werkruimteplugins deel uitmaken van het metadatabereik.

De momentopname en opzoektabel houden herhaalde opstartbeslissingen op het snelle pad:

- eigendom van kanalen
- uitgestelde kanaalopstart
- plugin-id's voor opstarten
- eigendom van providers en CLI-backends
- eigendom van configuratieproviders, opdrachtaliassen, modelcatalogusproviders en manifestcontracten
- validatie van configuratieschema's voor plugins en kanalen
- beslissingen over automatisch inschakelen bij het opstarten

De veiligheidsgrens is het vervangen van de momentopname, niet het wijzigen ervan. Bouw de momentopname opnieuw op wanneer de configuratie, plugininventaris, installatierecords of het persistente indexbeleid veranderen. Behandel deze niet als een breed, wijzigbaar globaal register en bewaar geen onbeperkte historische momentopnamen. Het laden van plugins tijdens runtime blijft gescheiden van metadatamomentopnamen, zodat verouderde runtimestatus niet achter een metadatacache verborgen kan blijven.

De cacheregel is gedocumenteerd in [Interne werking van de pluginarchitectuur](/nl/plugins/architecture-internals#plugin-cache-boundary): manifest- en detectiemetadata zijn actueel, tenzij een aanroeper een expliciete momentopname, opzoektabel of manifestregister voor de huidige stroom bezit. Verborgen metadatacaches en op wandkloktijd gebaseerde TTL's maken geen deel uit van het laden van plugins. Alleen caches voor de runtimelader, modules en afhankelijkheidsartefacten mogen blijven bestaan nadat code of geïnstalleerde artefacten daadwerkelijk zijn geladen.

Sommige aanroepers op het koude pad bouwen manifestregisters nog steeds rechtstreeks opnieuw op vanuit de persistente index van geïnstalleerde plugins, in plaats van een `PluginLookUpTable` van Gateway te ontvangen. Dat pad bouwt het register nu op aanvraag opnieuw op; geef er de voorkeur aan de huidige opzoektabel of een expliciet manifestregister door runtimestromen te leiden wanneer een aanroeper er al een heeft.

### Activeringsplanning

Activeringsplanning maakt deel uit van het besturingsvlak. Aanroepers kunnen opvragen welke plugins relevant zijn voor een concrete opdracht, provider, kanaal, route, agentharnas of capaciteit voordat bredere runtimeregisters worden geladen.

De planner blijft compatibel met het huidige manifestgedrag:

- `activation.*`-velden zijn expliciete hints voor de planner
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks blijven de terugvaloptie voor eigenaarschap in het manifest
- de planner-API met alleen id's blijft beschikbaar voor bestaande aanroepers
- de plan-API rapporteert redenlabels, zodat diagnostiek expliciete hints kan onderscheiden van terugval op eigenaarschap

<Warning>
Beschouw `activation` niet als een levenscyclushook of als vervanging voor `register(...)`. Het zijn metagegevens die worden gebruikt om het laden te beperken. Geef de voorkeur aan eigenaarschapsvelden wanneer die de relatie al beschrijven; gebruik `activation` alleen voor aanvullende hints voor de planner.
</Warning>

### Kanaalplugins en de gedeelde berichttool

Kanaalplugins hoeven voor normale chatacties geen afzonderlijke tool voor verzenden, bewerken of reageren te registreren. OpenClaw behoudt één gedeelde `message`-tool in de kern en kanaalplugins beheren daarachter de kanaalspecifieke detectie en uitvoering.

De huidige grens is:

- de kern beheert de host van de gedeelde `message`-tool, de promptkoppeling, de administratie van sessies en threads en het doorsturen van de uitvoering
- kanaalplugins beheren contextgebonden actiedetectie, capaciteitsdetectie en eventuele kanaalspecifieke schemafragmenten
- kanaalplugins beheren de providerspecifieke grammatica voor sessiegesprekken, zoals de manier waarop gespreks-id's thread-id's coderen of van bovenliggende gesprekken overerven
- kanaalplugins voeren de uiteindelijke actie uit via hun actieadapter

Voor kanaalplugins is het SDK-oppervlak `ChannelMessageActionAdapter.describeMessageTool(...)`. Met die uniforme detectieaanroep kan een plugin zijn zichtbare acties, capaciteiten en schemabijdragen samen retourneren, zodat deze onderdelen niet uit elkaar gaan lopen.

Wanneer een kanaalspecifieke parameter van de berichttool een mediabron bevat, zoals een lokaal pad of een externe media-URL, moet de plugin ook `mediaSourceParams` retourneren vanuit `describeMessageTool(...)`. De kern gebruikt die expliciete lijst om padnormalisatie voor de sandbox en hints voor toegang tot uitgaande media toe te passen zonder namen van parameters die eigendom zijn van de plugin hard te coderen. Geef daar de voorkeur aan actiegebonden toewijzingen en niet aan één platte lijst voor het hele kanaal, zodat een mediaparameter die alleen voor profielen geldt niet wordt genormaliseerd voor ongerelateerde acties zoals `send`.

De kern geeft runtimecontext door aan die detectiestap. Belangrijke velden zijn onder meer:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrouwde inkomende `requesterSenderId`

Dat is van belang voor contextgevoelige plugins. Een kanaal kan berichtacties verbergen of tonen op basis van het actieve account, de huidige ruimte, thread of het huidige bericht, of de vertrouwde identiteit van de aanvrager, zonder kanaalspecifieke vertakkingen hard te coderen in de `message`-tool van de kern.

Daarom blijven wijzigingen in de routering van de ingebedde runner pluginwerk: de runner is verantwoordelijk voor het doorgeven van de huidige chat- en sessie-identiteit aan de detectiegrens van de plugin, zodat de gedeelde `message`-tool voor de huidige beurt het juiste kanaaleigen oppervlak beschikbaar stelt.

Voor uitvoeringhelpers die eigendom zijn van het kanaal moeten meegeleverde plugins de uitvoeringsruntime binnen hun eigen pluginmodules houden. De kern beheert niet langer de runtimes voor berichtacties van Discord, Slack, Telegram of WhatsApp onder `src/agents/tools`. We publiceren geen afzonderlijke subpaden van het type `plugin-sdk/*-action-runtime` en meegeleverde plugins moeten hun eigen lokale runtimecode rechtstreeks importeren uit modules die eigendom zijn van hun plugin.

Dezelfde grens geldt in het algemeen voor SDK-koppelingen met een providernaam: de kern mag geen kanaalspecifieke gemaksbarrels importeren voor Discord, Signal, Slack, WhatsApp of vergelijkbare plugins. Als de kern bepaald gedrag nodig heeft, gebruik dan de eigen `api.ts`- of `runtime-api.ts`-barrel van de meegeleverde plugin, of promoveer de behoefte tot een beperkte generieke capaciteit in de gedeelde SDK.

Meegeleverde plugins volgen dezelfde regel. De `runtime-api.ts` van een meegeleverde plugin mag niet zijn eigen merkgebonden `openclaw/plugin-sdk/<plugin-id>`-façade opnieuw exporteren. Die merkgebonden façades blijven compatibiliteitsshims voor externe plugins en oudere gebruikers, maar meegeleverde plugins moeten lokale exports gebruiken naast beperkte generieke SDK-subpaden zoals `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` of `openclaw/plugin-sdk/webhook-ingress`. Nieuwe code mag geen pluginspecifieke SDK-façades toevoegen, tenzij de compatibiliteitsgrens voor een bestaand extern ecosysteem dit vereist.

Specifiek voor peilingen zijn er twee uitvoeringspaden:

- `outbound.sendPoll` is de gedeelde basis voor kanalen die in het algemene peilingsmodel passen
- `actions.handleAction("poll")` is het voorkeurspad voor kanaalspecifieke peilingssemantiek of aanvullende peilingsparameters

De kern stelt het gedeeld parseren van peilingen nu uit totdat de peilingsafhandeling van de plugin de actie afwijst, zodat peilingshandlers die eigendom zijn van plugins kanaalspecifieke peilingsvelden kunnen accepteren zonder eerst door de generieke peilingsparser te worden geblokkeerd.

Zie [Interne werking van de pluginarchitectuur](/nl/plugins/architecture-internals) voor de volledige opstartvolgorde.

## Eigenaarschapsmodel voor capaciteiten

OpenClaw beschouwt een native plugin als de eigenaarschapsgrens voor een **bedrijf** of een **functie**, niet als een vergaarbak van ongerelateerde integraties.

Dat betekent:

- een bedrijfsplugin moet doorgaans alle op OpenClaw gerichte oppervlakken van dat bedrijf beheren
- een functieplugin moet doorgaans het volledige functieoppervlak beheren dat deze introduceert
- kanalen moeten gedeelde kerncapaciteiten gebruiken in plaats van providergedrag ad hoc opnieuw te implementeren

<AccordionGroup>
  <Accordion title="Leverancier met meerdere capaciteiten">
    `google` beheert tekstinferentie, de CLI-backend, embeddings, spraak, realtime spraak, mediabegrip, het genereren van afbeeldingen, muziek en video en zoeken op het web. `openai` beheert tekstinferentie, embeddings, spraak, realtime transcriptie, realtime spraak, mediabegrip en het genereren van afbeeldingen en video. `minimax` beheert tekstinferentie plus mediabegrip, spraak, het genereren van afbeeldingen, muziek en video en zoeken op het web.
  </Accordion>
  <Accordion title="Leverancier met één capaciteit">
    `arcee` en `chutes` beheren alleen tekstinferentie; `microsoft` beheert alleen spraak. Een leveranciersplugin kan zo beperkt blijven totdat deze een groter deel van het oppervlak van die leverancier moet bestrijken.
  </Accordion>
  <Accordion title="Functieplugin">
    `voice-call` beheert het gesprekstransport, de tools, de CLI, routes en de overbrugging van Twilio-mediastreams, maar gebruikt gedeelde capaciteiten voor spraak, realtime transcriptie en realtime spraak in plaats van leveranciersplugins rechtstreeks te importeren.
  </Accordion>
</AccordionGroup>

De beoogde eindtoestand is:

- het op OpenClaw gerichte oppervlak van een leverancier bevindt zich in één plugin, zelfs als dit tekstmodellen, spraak, afbeeldingen en video omvat
- andere leveranciers kunnen hetzelfde doen voor hun eigen oppervlak
- het maakt kanalen niet uit welke leveranciersplugin de provider beheert; ze gebruiken het gedeelde capaciteitscontract dat door de kern beschikbaar wordt gesteld

Dit is het belangrijkste onderscheid:

- **plugin** = eigenaarschapsgrens
- **capaciteit** = kerncontract dat meerdere plugins kunnen implementeren of gebruiken

Als OpenClaw dus een nieuw domein toevoegt, zoals video, is de eerste vraag niet: "Welke provider moet de videoafhandeling hard coderen?" De eerste vraag is: "Wat is het kerncontract voor videocapaciteit?" Zodra dat contract bestaat, kunnen leveranciersplugins zich ervoor registreren en kunnen kanaal- en functieplugins het gebruiken.

Als de capaciteit nog niet bestaat, is de juiste aanpak doorgaans:

<Steps>
  <Step title="Definieer de capaciteit">
    Definieer de ontbrekende capaciteit in de kern.
  </Step>
  <Step title="Stel deze beschikbaar via de SDK">
    Stel deze op een getypeerde manier beschikbaar via de plugin-API en -runtime.
  </Step>
  <Step title="Koppel gebruikers">
    Koppel kanalen en functies aan die capaciteit.
  </Step>
  <Step title="Leveranciersimplementaties">
    Laat leveranciersplugins implementaties registreren.
  </Step>
</Steps>

Dit houdt eigenaarschap expliciet en voorkomt tegelijk kerngedrag dat afhankelijk is van één leverancier of een eenmalig pluginspecifiek codepad.

### Capaciteitslagen

Gebruik dit denkmodel om te bepalen waar code thuishoort:

<Tabs>
  <Tab title="Laag voor kerncapaciteiten">
    Gedeelde orkestratie, beleid, terugvalgedrag, regels voor het samenvoegen van configuratie, afleveringssemantiek en getypeerde contracten.
  </Tab>
  <Tab title="Laag voor leveranciersplugins">
    Leveranciersspecifieke API's, authenticatie, modelcatalogi, spraaksynthese, afbeeldingsgeneratie, videobackends en gebruikseindpunten.
  </Tab>
  <Tab title="Laag voor kanaal- en functieplugins">
    Integratie met Discord, Slack, `voice-call`, enzovoort, die kerncapaciteiten gebruikt en deze op een oppervlak presenteert.
  </Tab>
</Tabs>

TTS volgt bijvoorbeeld deze structuur:

- de kern beheert het TTS-beleid tijdens antwoorden, de terugvalvolgorde, voorkeuren en kanaalaflevering
- `elevenlabs`, `google`, `microsoft` en `openai` beheren de synthese-implementaties
- `voice-call` gebruikt de runtimehelper voor telefonie-TTS

Hetzelfde patroon verdient de voorkeur voor toekomstige capaciteiten.

### Voorbeeld van een bedrijfsplugin met meerdere capaciteiten

Een bedrijfsplugin moet van buitenaf als één samenhangend geheel aanvoelen. Als OpenClaw gedeelde contracten heeft voor modellen, spraak, realtime transcriptie, realtime spraak, mediabegrip, afbeeldingsgeneratie, videogeneratie, webinhoud ophalen en zoeken op het web, kan een leverancier al zijn oppervlakken op één plaats beheren:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

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
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
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

Waar het om gaat, zijn niet de exacte namen van de helpers. De structuur is belangrijk:

- één plugin beheert het leveranciersoppervlak
- de kern blijft de capaciteitscontracten beheren
- kanalen en functieplugins gebruiken `api.runtime.*`-helpers, geen leverancierscode
- contracttests kunnen verifiëren dat de plugin de capaciteiten heeft geregistreerd waarvan deze beweert de eigenaar te zijn

### Capaciteitsvoorbeeld: videobegrip

OpenClaw behandelt begrip van afbeeldingen, audio en video al als één gedeelde capaciteit. Daar geldt hetzelfde eigenaarschapsmodel:

<Steps>
  <Step title="De kern definieert het contract">
    De kern definieert het contract voor mediabegrip.
  </Step>
  <Step title="Leveranciersplugins registreren zich">
    Leveranciersplugins registreren waar van toepassing `describeImage`, `transcribeAudio` en `describeVideo`.
  </Step>
  <Step title="Gebruikers gebruiken het gedeelde gedrag">
    Kanalen en functieplugins gebruiken het gedeelde kerngedrag in plaats van rechtstreeks aan leverancierscode te worden gekoppeld.
  </Step>
</Steps>

Dat voorkomt dat de videoaannames van één provider in de kern worden ingebakken. De plugin beheert het leveranciersoppervlak; de kern beheert het capaciteitscontract en het terugvalgedrag.

Videogeneratie gebruikt diezelfde volgorde al: de kern beheert het getypeerde capaciteitscontract en de runtimehelper, en leveranciersplugins registreren daarvoor implementaties met `api.registerVideoGenerationProvider(...)`.

Een concrete implementatiechecklist nodig? Zie [Kookboek voor capaciteiten](/nl/plugins/adding-capabilities).

## Contracten en handhaving

Het Plugin-API-oppervlak is bewust getypeerd en gecentraliseerd in `OpenClawPluginApi`. Dat contract definieert de ondersteunde registratiepunten en de runtimehelpers waarop een Plugin mag vertrouwen.

Waarom dit belangrijk is:

- auteurs van Plugins krijgen één stabiele interne standaard
- de kern kan dubbel eigenaarschap weigeren, zoals twee Plugins die dezelfde provider-id registreren
- bij het opstarten kunnen bruikbare diagnostische meldingen voor ongeldige registraties worden weergegeven
- contracttests kunnen het eigenaarschap van meegeleverde Plugins afdwingen en ongemerkte afwijkingen voorkomen

Er zijn twee handhavingslagen:

<AccordionGroup>
  <Accordion title="Handhaving van runtimeregistratie">
    Het Plugin-register valideert registraties terwijl Plugins worden geladen. Voorbeelden: dubbele provider-id's, dubbele spraakprovider-id's en ongeldige registraties leveren diagnostische Plugin-meldingen op in plaats van ongedefinieerd gedrag.
  </Accordion>
  <Accordion title="Contracttests">
    Meegeleverde Plugins worden tijdens testruns vastgelegd in contractregisters, zodat OpenClaw het eigenaarschap expliciet kan controleren. Momenteel wordt dit gebruikt voor modelproviders, spraakproviders, webzoekproviders en het eigenaarschap van meegeleverde registraties.
  </Accordion>
</AccordionGroup>

Het praktische gevolg is dat OpenClaw vooraf weet welke Plugin welk oppervlak beheert. Daardoor kunnen de kern en kanalen naadloos samenwerken, omdat het eigenaarschap expliciet is vastgelegd, getypeerd en testbaar is in plaats van impliciet.

### Wat in een contract thuishoort

<Tabs>
  <Tab title="Goede contracten">
    - getypeerd
    - klein
    - specifiek voor een mogelijkheid
    - beheerd door de kern
    - herbruikbaar door meerdere Plugins
    - bruikbaar door kanalen/functies zonder kennis van de leverancier

  </Tab>
  <Tab title="Slechte contracten">
    - leveranciersspecifiek beleid dat in de kern verborgen is
    - eenmalige ontsnappingsroutes voor Plugins die het register omzeilen
    - kanaalcode die rechtstreeks toegang zoekt tot een leveranciersimplementatie
    - ad-hoc-runtimeobjecten die geen deel uitmaken van `OpenClawPluginApi` of `api.runtime`

  </Tab>
</Tabs>

Verhoog bij twijfel het abstractieniveau: definieer eerst de mogelijkheid en laat Plugins er vervolgens op aansluiten.

## Uitvoeringsmodel

Systeemeigen OpenClaw-Plugins draaien **in hetzelfde proces** als de Gateway. Ze worden niet in een sandbox uitgevoerd. Een geladen systeemeigen Plugin heeft dezelfde vertrouwensgrens op procesniveau als de kerncode.

<Warning>
Gevolgen van systeemeigen Plugins: een Plugin kan hulpmiddelen, netwerkhandlers, hooks en services registreren; een fout in een Plugin kan de Gateway laten crashen of destabiliseren; en een schadelijke systeemeigen Plugin staat gelijk aan de uitvoering van willekeurige code binnen het OpenClaw-proces.
</Warning>

Compatibele bundels zijn standaard veiliger, omdat OpenClaw ze momenteel als pakketten met metagegevens/inhoud behandelt. In de huidige releases betekent dit voornamelijk meegeleverde Skills.

Gebruik acceptatielijsten en expliciete installatie-/laadpaden voor niet-meegeleverde Plugins. Behandel werkruimte-Plugins als code voor ontwikkeling, niet als productiestandaard.

Houd voor namen van meegeleverde werkruimtepakketten de Plugin-id standaard verankerd in de npm-naam: `@openclaw/<id>`, of gebruik een goedgekeurd getypeerd achtervoegsel zoals `-provider`, `-plugin`, `-speech`, `-sandbox` of `-media-understanding` wanneer het pakket bewust een beperktere Plugin-rol beschikbaar stelt.

<Note>
**Opmerking over vertrouwen:** `plugins.allow` vertrouwt **Plugin-id's**, niet de herkomst van de bron. Een werkruimte-Plugin met dezelfde id als een meegeleverde Plugin overschrijft bewust het meegeleverde exemplaar wanneer die werkruimte-Plugin is ingeschakeld/op de acceptatielijst staat. Dit is normaal en nuttig voor lokale ontwikkeling, het testen van patches en hotfixes. Het vertrouwen in meegeleverde Plugins wordt bepaald aan de hand van de momentopname van de bron — het manifest en de code op schijf tijdens het laden — en niet aan de hand van installatiemetagegevens. Een beschadigd of vervangen installatierecord kan het vertrouwensoppervlak van een meegeleverde Plugin niet ongemerkt uitbreiden tot meer dan wat de werkelijke bron opgeeft.
</Note>

## Exportgrens

OpenClaw exporteert mogelijkheden, geen implementatiegemak.

Houd de registratie van mogelijkheden openbaar. Beperk de export van helpers die geen deel van het contract zijn:

- helpersubpaden die specifiek zijn voor meegeleverde Plugins
- subpaden voor runtime-infrastructuur die niet bedoeld zijn als openbare API
- leveranciersspecifieke gemakhelpers
- helpers voor configuratie/introductie die implementatiedetails zijn

Gereserveerde helpersubpaden voor meegeleverde Plugins zijn verwijderd uit de gegenereerde SDK-exporttoewijzing. Houd eigenaarspecifieke helpers binnen het pakket van de betreffende Plugin; promoveer alleen herbruikbaar hostgedrag naar generieke SDK-contracten zoals `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` en `plugin-sdk/plugin-config-runtime`.

## Interne werking en naslag

Zie [Interne werking van de Plugin-architectuur](/nl/plugins/architecture-internals) voor de laadpijplijn, het registermodel, runtimehooks voor providers, HTTP-routes van de Gateway, schema's van berichttools, het omzetten van kanaaldoelen, providercatalogi, Plugins voor de contextengine en de handleiding voor het toevoegen van een nieuwe mogelijkheid.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin-manifest](/nl/plugins/manifest)
- [Plugin-SDK instellen](/nl/plugins/sdk-setup)
