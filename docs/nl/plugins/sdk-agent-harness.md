---
read_when:
    - Je wijzigt de ingebedde agentruntime of het harnessregister
    - Je registreert een agentharnas vanuit een gebundelde of vertrouwde plugin
    - Je moet begrijpen hoe de Codex-plugin zich verhoudt tot modelproviders
sidebarTitle: Agent Harness
summary: Experimenteel SDK-oppervlak voor plugins die de ingebouwde agentexecutor op laag niveau vervangen
title: Plugins voor agentharnassen
x-i18n:
    generated_at: "2026-07-16T16:18:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Een **agentharnas** is de low-level uitvoerder voor één voorbereide OpenClaw-agentbeurt. Het is geen modelprovider, geen kanaal en geen toolregister. Zie [Agentruntimes](/nl/concepts/agent-runtimes) voor het gebruikersgerichte mentale model.

Gebruik dit oppervlak alleen voor gebundelde of vertrouwde native plugins. Het contract is nog experimenteel, omdat de parametertypen bewust de huidige ingebedde runner weerspiegelen.

## Wanneer je een harnas gebruikt

Registreer een agentharnas wanneer een modelfamilie een eigen native sessieruntime heeft en het normale OpenClaw-providertransport de verkeerde abstractie is:

- een native server voor programmeeragents die threads en Compaction beheert
- een lokale CLI of daemon die native plan-/redeneer-/toolgebeurtenissen moet streamen
- een modelruntime die naast het OpenClaw-sessietranscript een eigen hervattings-id nodig heeft

Registreer **geen** harnas alleen om een nieuwe LLM-API toe te voegen. Bouw voor normale HTTP- of WebSocket-model-API's een [providerplugin](/nl/plugins/sdk-provider-plugins).

## Wat de kern nog steeds beheert

Voordat een harnas wordt geselecteerd, heeft OpenClaw het volgende al bepaald:

- provider en model
- runtime-authenticatiestatus, tenzij het harnas verklaart dat het de authenticatiebootstrap beheert
- denkniveau en contextbudget
- het OpenClaw-transcript-/sessiebestand
- werkruimte-, sandbox- en toolbeleid
- callbacks voor kanaalantwoorden en streaming
- beleid voor modelterugval en live modelwisseling

Een harnas voert een voorbereide poging uit; het kiest geen providers, vervangt de kanaalaflevering niet en wisselt niet stilzwijgend van model.

### Door het harnas beheerde authenticatiebootstrap

Standaard bepaalt de kern de providerreferenties voordat een harnas wordt aangeroepen. Een vertrouwd harnas dat zich via zijn eigen native runtime kan authenticeren, mag `authBootstrap: "harness"` instellen bij zijn statische `AgentHarness`-registratie. De kern slaat dan voor elke poging die door dat harnas wordt geclaimd de algemene bootstrap van providerreferenties en de fout bij ontbrekende referenties over.

De kern stuurt nog steeds een compatibel, expliciet geselecteerd of geordend OpenClaw-authenticatieprofiel en de bijbehorende afgebakende opslag door wanneer die bestaan. Het harnas moet dat profiel of zijn native referenties bepalen voordat het modelaanvragen uitvoert, geheimen tot de poging beperken en bruikbare authenticatiefouten tonen. Stel deze mogelijkheid niet in voor een harnas dat authenticatie slechts soms beheert.

### Geverifieerde runtime-artefacten voor configuratie

Een lokaal harnas dat inferentie kan leveren voor de eerste configuratie moet verklaren welke implementatie de controle heeft voltooid. Wanneer `params.captureRuntimeArtifact` waar is, retourneer je een ondoorzichtige `result.runtimeArtifact` met een stabiele id en inhoudsvingerafdruk. Registreer een overeenkomende `runtimeArtifact.validate(...)`-mogelijkheid die die koppeling opnieuw controleert zonder een ander harnas te laden of niet-gerelateerde plugins te scannen.

Geverifieerde OpenClaw-voortzettingen geven ook `params.expectedRuntimeArtifact` door. Het harnas moet dit vergelijken met exact het native proces dat het heeft verkregen en falen voordat het een native thread start of hervat als ze verschillen. Bij gewone agentbeurten worden beide velden weggelaten, zodat inhoudshashing buiten het normale kritieke aanvraagpad blijft. Externe/WebSocket-harnassen hebben een serverattestatiecontract nodig voordat ze kunnen deelnemen; alleen een versietekenreeks is geen artefactidentiteit.

De voorbereide poging bevat ook `params.runtimePlan`, een door OpenClaw beheerde beleidsbundel voor runtimebeslissingen die gedeeld moeten blijven tussen OpenClaw en native harnassen:

- `runtimePlan.tools.normalize(...)` en `runtimePlan.tools.logDiagnostics(...)`
  voor providerbewust beleid voor toolschema's
- `runtimePlan.transcript.resolvePolicy(...)` voor transcriptopschoning en
  beleid voor herstel van toolaanroepen
- `runtimePlan.delivery.isSilentPayload(...)` voor gedeelde `NO_REPLY` en onderdrukking van
  media-aflevering
- `runtimePlan.outcome.classifyRunResult(...)` voor classificatie van
  modelterugval
- `runtimePlan.observability` voor bepaalde provider-/model-/harnasmetadata

Harnassen mogen het plan gebruiken voor beslissingen die moeten overeenkomen met OpenClaw-gedrag, maar moeten het behandelen als door de host beheerde pogingsstatus: wijzig het niet en gebruik het niet om binnen een beurt van provider/model te wisselen.

### Contract voor aanvraagtransport

`supports(ctx)` ontvangt het bepaalde modeltransport in `ctx.modelProvider`. Twee geheimevrije, door de provider beheerde feiten beschrijven de geselecteerde route:

- `runtimePolicy.compatibleIds` vermeldt de runtime-id's die de provider compatibel verklaart
  met die concrete route. Ontbrekend beleid betekent dat de provider geen compatibiliteit
  op routeniveau heeft verklaard; het is geen toestemming om ondersteuning te veronderstellen.
- `requestTransportOverrides: "none"` betekent dat geen door de auteur opgegeven overschrijving
  van de provider-/modelaanvraag hoeft te worden gereproduceerd. `"present"` betekent
  dat door de auteur opgegeven headers, authenticatietransport, proxy-, TLS-, lokale-service-,
  privénetwerkgedrag of aanvraagparameters bestaan. Dit feit maakt die waarden niet zichtbaar.

Retourneer `{ supported: false, reason }` wanneer het harnas het voorbereide transport niet kan reproduceren. Leid ondersteuning niet af door na selectie de onbewerkte configuratie te lezen. Wanneer de authenticatievoorbereiding meerdere routes voor nieuwe pogingen oplevert, moet één harnas ze allemaal ondersteunen vóór verzending. Impliciete selectie gebruikt OpenClaw als geen plugin de volledige verzameling kan beheren; een expliciete of opgeslagen pluginselectie faalt gesloten.

## Een harnas registreren

**Importeren:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mijn native agentharnas",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "effectieve route is niet compatibel met het harnas" };
  },

  async runAttempt(params) {
    // Start of hervat je native thread.
    // Gebruik params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent en de andere velden van de voorbereide poging.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Mijn native agent",
  description: "Voert geselecteerde modellen uit via een native agentdaemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` ontbreekt bewust in dit algemene voorbeeld. Voeg `authBootstrap: "harness"` alleen toe wanneer het harnas aan het bovenstaande contract voldoet.

### Gedelegeerde uitvoering

Een harnaseigenaar mag `delegatedExecutionPluginIds` instellen op de id's van vertrouwde plugins die een bestaande modelvergrendelde sessie moeten uitvoeren, zoals een spraaktransport dat een door Codex ondersteund gesprek voortzet. Dit is statische toestemming van de eigenaar, geen kern-toestaanlijst. Houd deze beperkt.

Gedelegeerden ontvangen alleen toelating van werk en ingebedde uitvoering. OpenClaw vereist de exact opgeslagen sessiesleutel, het opslagpad en de sessie-id; `modelSelectionLocked:
true`; en overeenkomende waarden voor `agentHarnessId` en `agentHarnessRuntimeOverride`. De uitvoering wordt vervolgens afgebakend via de harnaseigenaar. Het maken, aanpassen, resetten, verwijderen en archiveren van sessies en mutaties van de Gateway blijven uitsluitend voor de eigenaar.

## Selectiebeleid

OpenClaw kiest een harnas nadat de provider en het model zijn bepaald:

1. Runtimebeleid met modelbereik heeft voorrang.
2. Daarna volgt runtimebeleid met providerbereik.
3. `auto` vraagt geregistreerde harnassen of ze de bepaalde effectieve
   route ondersteunen. Provider-/modelvoorvoegsels alleen selecteren nooit een harnas.
4. Als geen geregistreerd harnas overeenkomt, gebruikt OpenClaw zijn ingebedde runtime.

Fouten van pluginharnassen worden getoond als uitvoeringsfouten. In de modus `auto` is ingebedde terugval alleen van toepassing wanneer geen geregistreerd pluginharnas de bepaalde provider/het bepaalde model ondersteunt. Zodra een pluginharnas een uitvoering heeft geclaimd, voert OpenClaw diezelfde beurt niet opnieuw uit via een andere runtime, omdat dit de authenticatie-/runtimesemantiek kan veranderen of bijwerkingen kan dupliceren.

Geconfigureerd runtimebeleid blijft gezaghebbend voor de gewenste runtime. Een opgeslagen sessie-`agentHarnessId` behoudt het eigendom van het native transcript terwijl de route-/authenticatievoorbereiding nog in behandeling is. Geen van beide maakt een incompatibele route compatibel: zodra voorbereide feiten bestaan, moet het geselecteerde of vastgezette harnas deze ondersteunen, anders faalt de uitvoering gesloten. `/status` toont de effectieve runtime die is geselecteerd op basis van beleid, opgeslagen eigendom en routeondersteuning.
De voorbereide status is expliciet: ontbrekende `runtimePolicy` blijft niet-gedeclareerd in plaats van te worden afgeleid uit de transportvelden die toevallig aanwezig zijn.
Wanneer door het harnas beheerde authenticatie meerdere fysieke routes onopgelost laat, is het voorbereide ondersteuningsfeit de doorsnede van hun compatibele runtime-id's en meldt het aanvraagoverschrijvingen als een kandidaat die heeft. Eén niet-gedeclareerde kandidaat maakt native compatibiliteit daarom leeg; `preparedAuth.source: "harness"` is een authenticatie-eigenaar, geen toestemming om routeondersteuning af te leiden.

Als het geselecteerde harnas verrassend is, schakel je `agents/harness`-debuglogboekregistratie in en inspecteer je de gestructureerde `agent harness selected`-record van de Gateway: deze bevat de geselecteerde harnas-id, selectiereden, runtime-/terugvalbeleid en, in de modus `auto`, het ondersteuningsresultaat van elke pluginkandidaat.

De gebundelde Codex-plugin registreert `codex` als zijn harnas-id. De kern behandelt dit als een gewone id van een pluginharnas; Codex-specifieke aliassen horen thuis in de plugin- of operatorconfiguratie, niet in de gedeelde runtimeselector.

## Provider en harnas combineren

De meeste harnassen moeten ook een provider registreren. De provider maakt modelreferenties, authenticatiestatus, modelmetadata en `/model`-selectie zichtbaar voor de rest van OpenClaw. Het harnas claimt die provider vervolgens in `supports(...)`.

De gebundelde Codex-plugin volgt dit patroon:

- voorkeursreferenties voor gebruikersmodellen: `openai/gpt-5.6-sol`
- compatibiliteitsreferenties: verouderde `codex/gpt-*`-referenties blijven geaccepteerd, maar nieuwe
  configuraties mogen ze niet als normale provider-/modelreferenties gebruiken
- harnas-id: `codex`
- authenticatie: synthetische providerbeschikbaarheid, omdat het Codex-harnas de
  native Codex-aanmelding/-sessie beheert
- app-server-aanvraag: OpenClaw stuurt de kale model-id naar Codex en laat het
  harnas communiceren met het native app-serverprotocol

De Codex-plugin is additief. Als runtimebeleid niet is ingesteld of `auto` is, mag OpenAI Codex alleen selecteren wanneer het door de provider beheerde routecontract `codex` compatibel verklaart: een exacte officiële HTTPS-route voor Platform Responses of ChatGPT Responses zonder door de auteur opgegeven aanvraagoverschrijving. Alleen het voorvoegsel `openai/*` selecteert Codex nooit. Aangepaste eindpunten, Completions-adapters en door de auteur opgegeven aanvraaggedrag blijven bij OpenClaw. Officiële HTTP-eindpunten met platte tekst worden geweigerd. Oudere `codex/gpt-*`-referenties blijven compatibiliteitsinvoer. Zie
[Impliciete OpenAI-agentruntime](/nl/providers/openai#implicit-agent-runtime).

Zie [Codex-harnas](/nl/plugins/codex-harness) voor operatorconfiguratie, voorbeelden van modelvoorvoegsels en configuraties uitsluitend voor Codex.

De Codex-plugin dwingt de minimale app-serverversie af die wordt beschreven in [Codex-harnas](/nl/plugins/codex-harness). De plugin controleert de initialisatiehandshake en blokkeert oudere servers of servers zonder versie, zodat OpenClaw alleen werkt met het protocoloppervlak dat het heeft getest.

### Middleware voor toolresultaten

Gebundelde plugins en expliciet ingeschakelde geïnstalleerde plugins met overeenkomende manifestcontracten kunnen runtime-neutrale middleware voor toolresultaten koppelen via `api.registerAgentToolResultMiddleware(...)` wanneer hun manifest de beoogde runtime-id's declareert in `contracts.agentToolResultMiddleware`. Deze vertrouwde naad is bedoeld voor asynchrone transformaties van toolresultaten die moeten worden uitgevoerd voordat OpenClaw of Codex tooluitvoer terugvoert naar het model.

Oudere gebundelde plugins kunnen nog steeds
`api.registerCodexAppServerExtensionFactory(...)` gebruiken voor middleware die uitsluitend voor de Codex-app-server
bestemd is, maar nieuwe resultaattransformaties moeten de runtime-neutrale API gebruiken. De
hook `api.registerEmbeddedExtensionFactory(...)`, die uitsluitend voor de ingebedde runner bestemd was, is
verwijderd; ingebedde transformaties van toolresultaten moeten runtime-neutrale middleware gebruiken.

### Classificatie van terminale uitkomsten

Native harnassen die hun eigen protocolprojectie beheren, kunnen
`classifyAgentHarnessTerminalOutcome(...)` uit
`openclaw/plugin-sdk/agent-harness-runtime` gebruiken wanneer een voltooide beurt geen
zichtbare assistenttekst heeft opgeleverd. De helper retourneert `empty`, `reasoning-only` of
`planning-only`, zodat het fallbackbeleid van OpenClaw kan bepalen of een nieuwe poging met een
ander model moet worden gedaan. `planning-only` vereist het expliciete veld `planText`
van het harnas; OpenClaw leidt dit niet af uit tekst van de assistent. De helper
laat promptfouten, lopende beurten en opzettelijk stille
antwoorden zoals `NO_REPLY` bewust ongeclassificeerd.

### Neveneffecten aan het einde van de agent

Native harnassen moeten `runAgentEndSideEffects(...)` uit
`openclaw/plugin-sdk/agent-harness-runtime` aanroepen nadat ze een poging hebben afgerond. Deze
activeert de overdraagbare hook `agent_end` en de onderzoeksregistratie van OpenClaw
zonder interactieve antwoorden te vertragen. Gebruik `awaitAgentEndSideEffects(...)` voor
lokale, niet-interactieve uitvoeringen waarbij de poging pas mag worden afgehandeld nadat deze
neveneffecten zijn voltooid. Beide helpers accepteren dezelfde payload `{ event, ctx }` als
`runAgentHarnessAgentEndHook(...)`; fouten daarin wijzigen het resultaat van de voltooide
poging niet.

### Gebruikersinvoer en tooloppervlakken

Native harnassen die een gebruikersinvoerverzoek op runtimeniveau beschikbaar stellen, moeten de
helpers voor gebruikersinvoer uit `openclaw/plugin-sdk/agent-harness-runtime` gebruiken om
de prompt op te maken, deze via het blokkerende antwoordpad van OpenClaw af te leveren en
keuzeantwoorden en vrije invoer weer te normaliseren naar de native antwoordstructuur van de runtime. De
helper houdt de presentatie in kanalen en de TUI consistent, terwijl elk harnas zijn
eigen protocolparsing en levenscyclus voor openstaande verzoeken behoudt.

Native harnassen die compacte PI-achtige toolroutering nodig hebben, moeten
`createAgentHarnessToolSurfaceRuntime(...)` uit
`openclaw/plugin-sdk/agent-harness-tool-runtime` gebruiken. Deze beheert
de selectie van besturingselementen voor toolzoeken/codemodus, compacte standaardinstellingen voor lokale modellen,
runtimecompatibele schemafiltering, verborgen catalogusuitvoering, het
initialiseren van directory's en het opschonen van de catalogus. Harnassen blijven verantwoordelijk voor hun SDK-specifieke
toolconversie en native uitvoeringscallback.

### Native Codex-harnasmodus

Het gebundelde harnas `codex` is de native Codex-modus voor ingebedde
OpenClaw-agentbeurten. Schakel eerst de gebundelde plugin `codex` in en neem `codex` op in
`plugins.allow` als je configuratie een beperkende toelatingslijst gebruikt. Native app-serverconfiguraties
moeten `openai/gpt-*` gebruiken; OpenAI-agentbeurten selecteren het Codex-harnas
alleen wanneer de effectieve route Codex-compatibiliteit declareert. Oudere Codex-modelverwijzingen
moeten worden hersteld met `openclaw doctor --fix`, en oudere modelverwijzingen van `codex/*`
blijven compatibiliteitsaliassen voor het native harnas.

Wanneer deze modus wordt uitgevoerd, beheert Codex de native thread-id, het hervattingsgedrag,
Compaction en de uitvoering van de app-server. OpenClaw blijft verantwoordelijk voor het chatkanaal,
de zichtbare transcriptspiegel, het toolbeleid, goedkeuringen, de aflevering van media en de sessieselectie.
Gebruik provider/model `agentRuntime.id: "codex"` wanneer je moet
aantonen dat alleen het Codex-app-serverpad de uitvoering kan overnemen. Expliciete pluginruntimes
stoppen bij fouten; selectiefouten en runtimefouten van de Codex-app-server
worden niet via een andere runtime opnieuw geprobeerd.

## Striktheid van de runtime

Standaard gebruikt OpenClaw het provider/model-runtimebeleid `auto`: geregistreerde
pluginharnassen kunnen compatibele effectieve routes overnemen, en de ingebedde
runtime verwerkt de beurt wanneer geen enkel harnas overeenkomt. Alleen een provider/modelvoorvoegsel
selecteert nooit een harnas. Gebruik een expliciete provider/model-pluginruntime zoals
`agentRuntime.id: "codex"` wanneer het ontbreken van een harnasselectie tot een fout moet leiden
in plaats van routering via de ingebedde runtime. Expliciete selectie maakt een
incompatibele route niet compatibel. Fouten in geselecteerde pluginharnassen leiden altijd
direct tot een fout. Dit blokkeert geen expliciete provider/model-
`agentRuntime.id: "openclaw"`.

Voor uitsluitend in Codex ingebedde uitvoeringen:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Als je voor één canoniek model een CLI-backend wilt, plaats je de runtime bij die
modelvermelding:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Overschrijvingen per agent gebruiken dezelfde modelgebonden structuur:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Oudere runtimevoorbeelden voor de gehele agent, zoals dit voorbeeld, worden genegeerd:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Met een expliciete pluginruntime mislukt een sessie vroegtijdig wanneer het aangevraagde
harnas niet is geregistreerd, de opgeloste provider/het opgeloste model niet ondersteunt of
mislukt voordat neveneffecten van de beurt ontstaan. Dit is opzettelijk voor implementaties
die uitsluitend Codex gebruiken en voor livetests die moeten aantonen dat het Codex-app-serverpad
daadwerkelijk wordt gebruikt.

Deze instelling bestuurt alleen het ingebedde agentharnas. Ze schakelt
routering van afbeeldings-, video-, muziek-, TTS-, PDF- of andere providerspecifieke modellen niet uit.

## Native sessies en transcriptspiegel

Een harnas kan een native sessie-id, thread-id of hervattingstoken aan de daemonzijde
bewaren. Houd die koppeling expliciet verbonden met de OpenClaw-sessie en
blijf voor gebruikers zichtbare uitvoer van de assistent/tools naar het OpenClaw-
transcript spiegelen.

Het OpenClaw-transcript blijft de compatibiliteitslaag voor:

- voor het kanaal zichtbare sessiegeschiedenis
- zoeken en indexeren van transcripten
- bij een latere beurt terugschakelen naar het ingebouwde OpenClaw-harnas
- algemeen gedrag voor `/new`, `/reset` en het verwijderen van sessies

Als je harnas een gekoppeld nevenbestand opslaat, implementeer dan `reset(...)`, zodat OpenClaw
dit kan wissen wanneer de bijbehorende OpenClaw-sessie opnieuw wordt ingesteld.

## Tool- en mediaresultaten

De kern stelt de OpenClaw-toollijst samen en geeft deze door aan de voorbereide
poging. Wanneer een harnas een dynamische toolaanroep uitvoert, retourneer je het toolresultaat
via de resultaatstructuur van het harnas in plaats van zelf kanaalmedia
te verzenden.

Hierdoor volgen uitvoer van tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en berichtentools
hetzelfde afleveringspad als uitvoeringen die door OpenClaw worden ondersteund.

### Terminale tooluitkomsten

`AgentHarnessAttemptParams.observeToolTerminal` is de door de host beheerde accumulator voor terminale
uitkomsten. Een harnas dat dynamische OpenClaw-tools of native
tools uitvoert, moet deze aanroepen wanneer elke tool één terminale uitkomst bereikt, voordat het
resultaat van de poging wordt afgerond. Harnassen die geen tools uitvoeren, hoeven deze niet
aan te roepen.

Rapporteer feiten vanaf de uitvoeringsgrens:

- Geef de protocolaanroep-id door als die bestaat, evenals de canonieke toolnaam en de
  argumenten die na voorbereiding of herschrijvingen door hooks daadwerkelijk bij de tool terechtkwamen.
- Stel `executionStarted: false` in wanneer validatie, goedkeuring of een andere beveiliging
  de aanroep stopte voordat de toolimplementatie begon. Zodra verzending mogelijk
  heeft plaatsgevonden, rapporteer je voorzichtigheidshalve `true`.
- Rapporteer `outcome: "success"` of `outcome: "failure"`. Neem de gestructureerde
  foutvelden op die vanuit de runtime beschikbaar zijn, in plaats van fouten af te leiden uit
  weergavetekst.
- Gebruik `nativeMutation` alleen voor native tools die geen OpenClaw-tooldefinitie
  gebruiken. Geef daar de door het protocol beheerde feiten over mutatie en herhaling op; kopieer
  de mutatieclassificatie van OpenClaw niet naar het harnas.

De callback retourneert de canonieke afhandeling voor die aanroep. Neem de
`lastToolError` daarvan over in `AgentHarnessAttemptResult` en gebruik de feiten over uitvoering,
argumenten en neveneffecten in de projectie van het harnas, in plaats van
parallelle status af te leiden. De host behoudt een niet-afgehandelde muterende fout tijdens niet-gerelateerde
succesvolle tools en wist deze pas nadat de bijbehorende actie is geslaagd.

De callback blijft optioneel voor broncompatibiliteit met oudere experimentele
harnassen. Optioneel betekent niet dat een harnas dat tools uitvoert deze mag negeren:
zonder terminale rapportages kan OpenClaw de werkelijke foutstatus van muterende tools niet
behouden tijdens latere toolaanroepen, waaronder een stille voltooiing van een Heartbeat.

## Huidige beperkingen

- Het openbare importpad is generiek, maar sommige typealiassen voor pogingen/resultaten
  bevatten vanwege compatibiliteit nog oudere namen.
- De installatie van harnassen van derden is experimenteel. Geef de voorkeur aan providerplugins
  totdat je een native sessieruntime nodig hebt.
- Schakelen tussen harnassen wordt tussen beurten ondersteund. Schakel niet midden
  in een beurt van harnas nadat native tools, goedkeuringen, assistenttekst of het verzenden
  van berichten is begonnen.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview)
- [Runtimehelpers](/nl/plugins/sdk-runtime)
- [Providerplugins](/nl/plugins/sdk-provider-plugins)
- [Codex-harnas](/nl/plugins/codex-harness)
- [Modelproviders](/nl/concepts/model-providers)
