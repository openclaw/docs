---
read_when:
    - Je wijzigt de ingebedde agentruntime of het harnasregister
    - Je registreert een agentharnas vanuit een gebundelde of vertrouwde Plugin
    - Je moet begrijpen hoe de Codex-Plugin zich verhoudt tot modelproviders
sidebarTitle: Agent Harness
summary: Experimenteel SDK-oppervlak voor plugins die de ingebedde agentuitvoerder op laag niveau vervangen
title: Agentharnas-plugins
x-i18n:
    generated_at: "2026-05-07T13:23:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Een **agentharnas** is de uitvoerder op laag niveau voor één voorbereide OpenClaw-agentbeurt. Het is geen modelprovider, geen kanaal en geen toolregister. Zie [Agentruntimes](/nl/concepts/agent-runtimes) voor het gebruikersgerichte mentale model.

Gebruik dit oppervlak alleen voor gebundelde of vertrouwde native plugins. Het contract is nog experimenteel, omdat de parametertypen bewust de huidige ingebedde runner weerspiegelen.

## Wanneer je een harnas gebruikt

Registreer een agentharnas wanneer een modelfamilie een eigen native sessieruntime heeft en de normale OpenClaw-providertransportlaag de verkeerde abstractie is.

Voorbeelden:

- een native coding-agentserver die eigenaar is van threads en compaction
- een lokale CLI of daemon die native plan-/redeneer-/tool-events moet streamen
- een modelruntime die naast het OpenClaw-sessietranscript een eigen hervat-ID nodig heeft

Registreer **geen** harnas alleen om een nieuwe LLM-API toe te voegen. Bouw voor normale HTTP- of WebSocket-model-API's een [providerplugin](/nl/plugins/sdk-provider-plugins).

## Wat core nog steeds beheert

Voordat een harnas wordt geselecteerd, heeft OpenClaw al het volgende opgelost:

- provider en model
- runtime-authenticatiestatus
- denkniveau en contextbudget
- het OpenClaw-transcript-/sessiebestand
- workspace, sandbox en toolbeleid
- kanaalantwoordcallbacks en streamingcallbacks
- beleid voor modelterugval en live wisselen van model

Die scheiding is bewust. Een harnas voert een voorbereide poging uit; het kiest geen providers, vervangt geen kanaallevering en wisselt niet stilzwijgend van model.

De voorbereide poging bevat ook `params.runtimePlan`, een door OpenClaw beheerde beleidsbundel voor runtimebeslissingen die gedeeld moeten blijven tussen PI en native harnassen:

- `runtimePlan.tools.normalize(...)` en
  `runtimePlan.tools.logDiagnostics(...)` voor providerbewust toolschemabeleid
- `runtimePlan.transcript.resolvePolicy(...)` voor transcriptsanering en
  tool-call-herstelbeleid
- `runtimePlan.delivery.isSilentPayload(...)` voor gedeelde `NO_REPLY` en onderdrukking van medialevering
- `runtimePlan.outcome.classifyRunResult(...)` voor classificatie van modelterugval
- `runtimePlan.observability` voor opgeloste provider-/model-/harnasmetadata

Harnassen mogen het plan gebruiken voor beslissingen die moeten overeenkomen met PI-gedrag, maar moeten het nog steeds behandelen als pogingsstatus die eigendom is van de host. Wijzig het niet en gebruik het niet om binnen een beurt van provider/model te wisselen.

## Een harnas registreren

**Importeren:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Selectiebeleid

OpenClaw kiest een harnas na provider-/modelresolutie:

1. De vastgelegde harnas-ID van een bestaande sessie wint, zodat configuratie-/env-wijzigingen dat transcript niet live overschakelen naar een andere runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` dwingt een geregistreerd harnas met die ID af voor sessies die nog niet vastgepind zijn.
3. `OPENCLAW_AGENT_RUNTIME=pi` dwingt het ingebouwde PI-harnas af.
4. `OPENCLAW_AGENT_RUNTIME=auto` vraagt geregistreerde harnassen of ze de opgeloste provider/het opgeloste model ondersteunen.
5. Als geen geregistreerd harnas overeenkomt, gebruikt OpenClaw PI tenzij PI-terugval is uitgeschakeld.

Fouten van Plugin-harnassen komen naar voren als runfouten. In `auto`-modus wordt PI-terugval alleen gebruikt wanneer geen geregistreerd Plugin-harnas de opgeloste provider/het opgeloste model ondersteunt. Zodra een Plugin-harnas een run heeft opgeëist, speelt OpenClaw diezelfde beurt niet opnieuw af via PI, omdat dat authenticatie-/runtimesemantiek kan veranderen of neveneffecten kan dupliceren.

De geselecteerde harnas-ID wordt na een ingebedde run persistent gemaakt met de sessie-ID. Legacy sessies die zijn aangemaakt vóór harnaspins worden behandeld als PI-vastgepind zodra ze transcriptgeschiedenis hebben. Gebruik een nieuwe/geresette sessie wanneer je wisselt tussen PI en een native Plugin-harnas. `/status` toont niet-standaard harnas-ID's zoals `codex` naast `Fast`; PI blijft verborgen omdat het het standaardcompatibiliteitspad is. Als het geselecteerde harnas verrassend is, schakel dan debuglogging voor `agents/harness` in en inspecteer het gestructureerde `agent harness selected`-record van de gateway. Het bevat de geselecteerde harnas-ID, selectiereden, runtime-/terugvalbeleid en, in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

De gebundelde Codex-plugin registreert `codex` als harnas-ID. Core behandelt dat als een gewone Plugin-harnas-ID; Codex-specifieke aliassen horen thuis in de plugin of operatorconfiguratie, niet in de gedeelde runtimeselector.

## Provider plus harnaskoppeling

De meeste harnassen moeten ook een provider registreren. De provider maakt modelrefs, authenticatiestatus, modelmetadata en `/model`-selectie zichtbaar voor de rest van OpenClaw. Het harnas claimt die provider vervolgens in `supports(...)`.

De gebundelde Codex-plugin volgt dit patroon:

- voorkeursmodelrefs voor gebruikers: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- compatibiliteitsrefs: legacy `codex/gpt-*`-refs blijven geaccepteerd, maar nieuwe configuraties moeten ze niet gebruiken als normale provider-/modelrefs
- harnas-ID: `codex`
- auth: synthetische providerbeschikbaarheid, omdat het Codex-harnas eigenaar is van de native Codex-login/-sessie
- app-serververzoek: OpenClaw stuurt de kale model-ID naar Codex en laat het harnas met het native app-serverprotocol praten

De Codex-plugin is additief. Gewone `openai/gpt-*`-refs blijven het normale OpenClaw-providerpad gebruiken, tenzij je het Codex-harnas afdwingt met `agentRuntime.id: "codex"`. Oudere `codex/gpt-*`-refs selecteren nog steeds de Codex-provider en het Codex-harnas voor compatibiliteit.

Zie [Codex-harnas](/nl/plugins/codex-harness) voor operatorconfiguratie, voorbeelden van modelprefixen en configuraties die alleen voor Codex gelden.

OpenClaw vereist Codex app-server `0.125.0` of nieuwer. De Codex-plugin controleert de initialize-handshake van de app-server en blokkeert oudere servers of servers zonder versie, zodat OpenClaw alleen draait tegen het protocoloppervlak waarmee het is getest. De ondergrens `0.125.0` omvat de native MCP-hookpayloadondersteuning die in Codex `0.124.0` is geland, terwijl OpenClaw wordt vastgepind op de nieuwere geteste stabiele lijn.

### Toolresultaatmiddleware

Gebundelde plugins kunnen runtimeneutrale toolresultaatmiddleware koppelen via `api.registerAgentToolResultMiddleware(...)` wanneer hun manifest de beoogde runtime-ID's declareert in `contracts.agentToolResultMiddleware`. Dit vertrouwde koppelvlak is bedoeld voor async toolresultaattransformaties die moeten draaien voordat PI of Codex tooluitvoer terugvoert naar het model.

Legacy gebundelde plugins kunnen nog steeds `api.registerCodexAppServerExtensionFactory(...)` gebruiken voor middleware die alleen voor Codex app-server geldt, maar nieuwe resultaattransformaties moeten de runtimeneutrale API gebruiken. De hook `api.registerEmbeddedExtensionFactory(...)` die alleen voor Pi gold, is verwijderd; Pi-toolresultaattransformaties moeten runtimeneutrale middleware gebruiken.

### Classificatie van terminaal resultaat

Native harnassen die hun eigen protocolprojectie beheren, kunnen `classifyAgentHarnessTerminalOutcome(...)` uit `openclaw/plugin-sdk/agent-harness-runtime` gebruiken wanneer een voltooide beurt geen zichtbare assistenttekst heeft geproduceerd. De helper retourneert `empty`, `reasoning-only` of `planning-only`, zodat het terugvalbeleid van OpenClaw kan beslissen of opnieuw geprobeerd moet worden op een ander model. Het laat promptfouten, lopende beurten en bedoelde stille antwoorden zoals `NO_REPLY` bewust ongeclassificeerd.

### Native Codex-harnasmodus

Het gebundelde `codex`-harnas is de native Codex-modus voor ingebedde OpenClaw-agentbeurten. Schakel eerst de gebundelde `codex`-plugin in en neem `codex` op in `plugins.allow` als je configuratie een beperkende allowlist gebruikt. Native app-serverconfiguraties moeten `openai/gpt-*` gebruiken; OpenAI-agentbeurten selecteren standaard het Codex-harnas. Legacy `openai-codex/*`-routes moeten worden gerepareerd met `openclaw doctor --fix`, en legacy `codex/*`-modelrefs blijven compatibiliteitsaliassen voor het native harnas.

Wanneer deze modus draait, beheert Codex de native thread-ID, het hervatgedrag, Compaction en app-serveruitvoering. OpenClaw beheert nog steeds het chatkanaal, de zichtbare transcriptspiegel, het toolbeleid, goedkeuringen, medialevering en sessieselectie. Gebruik `agentRuntime.id: "codex"` wanneer je moet bewijzen dat alleen het Codex app-serverpad de run kan claimen. Expliciete Plugin-runtimes falen gesloten; selectiefouten van Codex app-server en runtimefouten worden niet opnieuw geprobeerd via PI.

## Runtimestriktheid

Standaard voert OpenClaw ingebedde agents uit met OpenClaw Pi. In `auto`-modus kunnen geregistreerde Plugin-harnassen een provider-/modelpaar claimen, en PI verwerkt de beurt wanneer niets overeenkomt. Gebruik een expliciete Plugin-runtime zoals `agentRuntime.id: "codex"` wanneer ontbrekende harnasselectie moet falen in plaats van via PI te routeren. Fouten van geselecteerde Plugin-harnassen falen altijd hard. Dit blokkeert geen expliciete `agentRuntime.id: "pi"` of `OPENCLAW_AGENT_RUNTIME=pi`.

Voor ingebedde runs die alleen voor Codex zijn:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Als je wilt dat elk geregistreerd Plugin-harnas overeenkomende modellen claimt en anders PI gebruikt, stel dan `id: "auto"` in:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

Overrides per agent gebruiken dezelfde vorm:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` overschrijft nog steeds de geconfigureerde runtime.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Met een expliciete Plugin-runtime faalt een sessie vroeg wanneer het aangevraagde harnas niet geregistreerd is, de opgeloste provider/het opgeloste model niet ondersteunt, of faalt voordat het neveneffecten van de beurt produceert. Dat is bewust voor deployments die alleen voor Codex zijn en voor live tests die moeten bewijzen dat het Codex app-serverpad daadwerkelijk in gebruik is.

Deze instelling beheert alleen het ingebedde agentharnas. Ze schakelt image-, video-, muziek-, TTS-, PDF- of andere providerspecifieke modelroutering niet uit.

## Native sessies en transcriptspiegel

Een harnas kan een native sessie-ID, thread-ID of hervattoken aan de daemonzijde bijhouden. Houd die binding expliciet gekoppeld aan de OpenClaw-sessie en blijf gebruikerszichtbare assistent-/tooluitvoer spiegelen naar het OpenClaw-transcript.

Het OpenClaw-transcript blijft de compatibiliteitslaag voor:

- kanaalzichtbare sessiegeschiedenis
- transcriptzoekfunctie en indexering
- terugschakelen naar het ingebouwde PI-harnas bij een latere beurt
- generiek gedrag voor `/new`, `/reset` en sessieverwijdering

Als je harnas een sidecarbinding opslaat, implementeer dan `reset(...)` zodat OpenClaw die kan wissen wanneer de eigenaar-OpenClaw-sessie wordt gereset.

## Tool- en mediaresultaten

Core construeert de OpenClaw-toollijst en geeft die door aan de voorbereide poging. Wanneer een harnas een dynamische tool-call uitvoert, retourneer het toolresultaat dan via de resultaatvorm van het harnas in plaats van zelf kanaalmedia te verzenden.

Zo blijven tekst-, image-, video-, muziek-, TTS-, goedkeurings- en messaging-tooluitvoer op hetzelfde leveringspad als runs die door PI worden ondersteund.

## Huidige beperkingen

- Het openbare importpad is generiek, maar sommige typealiassen voor pogingen/resultaten
  dragen om compatibiliteitsredenen nog `Pi`-namen.
- Installatie van harnassen van derden is experimenteel. Geef de voorkeur aan provider-plugins
  totdat je een native sessieruntime nodig hebt.
- Schakelen tussen harnassen wordt over beurten heen ondersteund. Schakel niet van harnas
  midden in een beurt nadat native tools, goedkeuringen, assistenttekst of het verzenden van
  berichten is gestart.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview)
- [Runtime-hulpfuncties](/nl/plugins/sdk-runtime)
- [Provider-Plugins](/nl/plugins/sdk-provider-plugins)
- [Codex-harnas](/nl/plugins/codex-harness)
- [Modelproviders](/nl/concepts/model-providers)
