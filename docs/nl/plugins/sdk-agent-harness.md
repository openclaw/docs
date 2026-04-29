---
read_when:
    - Je wijzigt de ingebedde agentruntime of het harnessregister
    - Je registreert een agentharnas vanuit een gebundelde of vertrouwde Plugin
    - Je moet begrijpen hoe de Codex-plugin zich verhoudt tot modelproviders
sidebarTitle: Agent Harness
summary: Experimenteel SDK-oppervlak voor plugins die de ingebedde agentuitvoerder op laag niveau vervangen
title: Plugins voor agentharnas
x-i18n:
    generated_at: "2026-04-29T23:04:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Een **agentharnas** is de laag-niveau-uitvoerder voor één voorbereide OpenClaw-agentbeurt. Het is geen modelprovider, geen kanaal en geen toolregister. Zie [Agentruntimes](/nl/concepts/agent-runtimes) voor het gebruikersgerichte mentale model.

Gebruik dit oppervlak alleen voor gebundelde of vertrouwde native Plugins. Het contract is nog experimenteel omdat de parametertypen bewust de huidige ingebedde runner weerspiegelen.

## Wanneer je een harnas gebruikt

Registreer een agentharnas wanneer een modelfamilie een eigen native sessieruntime heeft en het normale OpenClaw-providertransport de verkeerde abstractie is.

Voorbeelden:

- een native codeeragentserver die eigenaar is van threads en Compaction
- een lokale CLI of daemon die native plan-/redeneer-/toolgebeurtenissen moet streamen
- een modelruntime die naast het OpenClaw-sessietranscript een eigen hervat-id nodig heeft

Registreer **geen** harnas alleen om een nieuwe LLM-API toe te voegen. Bouw voor normale HTTP- of WebSocket-model-API’s een [provider-Plugin](/nl/plugins/sdk-provider-plugins).

## Wat core nog steeds beheert

Voordat een harnas wordt geselecteerd, heeft OpenClaw al het volgende opgelost:

- provider en model
- runtime-authstatus
- denkniveau en contextbudget
- het OpenClaw-transcript-/sessiebestand
- werkruimte, sandbox en toolbeleid
- kanaalantwoord-callbacks en streaming-callbacks
- beleid voor modelterugval en live modelwisseling

Die splitsing is bewust. Een harnas voert een voorbereide poging uit; het kiest geen providers, vervangt geen kanaalbezorging en wisselt niet stilzwijgend van model.

De voorbereide poging bevat ook `params.runtimePlan`, een door OpenClaw beheerde beleidsbundel voor runtimebeslissingen die gedeeld moeten blijven tussen PI en native harnassen:

- `runtimePlan.tools.normalize(...)` en
  `runtimePlan.tools.logDiagnostics(...)` voor providerbewust toolschemabeleid
- `runtimePlan.transcript.resolvePolicy(...)` voor transcriptsanering en
  tool-call-herstelbeleid
- `runtimePlan.delivery.isSilentPayload(...)` voor gedeelde `NO_REPLY` en onderdrukking van mediabezorging
- `runtimePlan.outcome.classifyRunResult(...)` voor classificatie van modelterugval
- `runtimePlan.observability` voor opgeloste provider-/model-/harnasmetadata

Harnassen mogen het plan gebruiken voor beslissingen die moeten overeenkomen met PI-gedrag, maar moeten het nog steeds behandelen als door de host beheerde pogingstatus. Muteer het niet en gebruik het niet om binnen een beurt van provider/model te wisselen.

## Een harnas registreren

**Import:** `openclaw/plugin-sdk/agent-harness`

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

OpenClaw kiest een harnas na provider-/modeloplossing:

1. De vastgelegde harnas-id van een bestaande sessie wint, zodat config-/env-wijzigingen dat transcript niet live naar een andere runtime omschakelen.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forceert een geregistreerd harnas met die id voor sessies die nog niet zijn vastgepind.
3. `OPENCLAW_AGENT_RUNTIME=pi` forceert het ingebouwde PI-harnas.
4. `OPENCLAW_AGENT_RUNTIME=auto` vraagt geregistreerde harnassen of ze de opgeloste provider/het opgeloste model ondersteunen.
5. Als geen geregistreerd harnas overeenkomt, gebruikt OpenClaw PI tenzij PI-terugval is uitgeschakeld.

Fouten in Plugin-harnassen verschijnen als uitvoeringsfouten. In `auto`-modus wordt PI-terugval alleen gebruikt wanneer geen geregistreerd Plugin-harnas de opgeloste provider/het opgeloste model ondersteunt. Zodra een Plugin-harnas een uitvoering heeft geclaimd, speelt OpenClaw dezelfde beurt niet opnieuw af via PI, omdat dat auth-/runtimesemantiek kan wijzigen of neveneffecten kan dupliceren.

De geselecteerde harnas-id wordt na een ingebedde uitvoering bij de sessie-id bewaard. Verouderde sessies die zijn gemaakt vóór harnaspins worden als PI-vastgepind behandeld zodra ze transcriptgeschiedenis hebben. Gebruik een nieuwe/geresette sessie wanneer je wisselt tussen PI en een native Plugin-harnas. `/status` toont niet-standaard harnas-id’s zoals `codex` naast `Fast`; PI blijft verborgen omdat dit het standaardcompatibiliteitspad is. Als het geselecteerde harnas verrassend is, schakel dan debuglogging voor `agents/harness` in en inspecteer de gestructureerde `agent harness selected`-record van de Gateway. Die bevat de geselecteerde harnas-id, selectiereden, runtime-/terugvalbeleid en, in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

De gebundelde Codex-Plugin registreert `codex` als harnas-id. Core behandelt dat als een gewone Plugin-harnas-id; Codex-specifieke aliassen horen thuis in de Plugin of operatorconfig, niet in de gedeelde runtimeselector.

## Provider- en harnaskoppeling

De meeste harnassen zouden ook een provider moeten registreren. De provider maakt modelrefs, authstatus, modelmetadata en `/model`-selectie zichtbaar voor de rest van OpenClaw. Het harnas claimt die provider vervolgens in `supports(...)`.

De gebundelde Codex-Plugin volgt dit patroon:

- voorkeursmodelrefs voor gebruikers: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- compatibiliteitsrefs: verouderde `codex/gpt-*`-refs blijven geaccepteerd, maar nieuwe configs zouden ze niet als normale provider-/modelrefs moeten gebruiken
- harnas-id: `codex`
- auth: synthetische providerbeschikbaarheid, omdat het Codex-harnas eigenaar is van de native Codex-login/sessie
- app-serververzoek: OpenClaw stuurt de kale model-id naar Codex en laat het harnas met het native app-serverprotocol praten

De Codex-Plugin is additief. Gewone `openai/gpt-*`-refs blijven het normale OpenClaw-providerpad gebruiken, tenzij je het Codex-harnas forceert met `agentRuntime.id: "codex"`. Oudere `codex/gpt-*`-refs selecteren nog steeds de Codex-provider en het harnas voor compatibiliteit.

Zie [Codex-harnas](/nl/plugins/codex-harness) voor operatorconfiguratie, voorbeelden van modelprefixen en configs die alleen Codex gebruiken.

OpenClaw vereist Codex app-server `0.125.0` of nieuwer. De Codex-Plugin controleert de initialize-handshake van de app-server en blokkeert oudere of ongeversioneerde servers, zodat OpenClaw alleen draait tegen het protocoloppervlak waarmee het is getest. De `0.125.0`-ondergrens bevat de native MCP-hook-payloadondersteuning die in Codex `0.124.0` is geland, terwijl OpenClaw wordt vastgepind op de nieuwere geteste stabiele lijn.

### Middleware voor toolresultaten

Gebundelde Plugins kunnen runtime-neutrale middleware voor toolresultaten koppelen via `api.registerAgentToolResultMiddleware(...)` wanneer hun manifest de gerichte runtime-id’s declareert in `contracts.agentToolResultMiddleware`. Deze vertrouwde naad is bedoeld voor async transformaties van toolresultaten die moeten draaien voordat PI of Codex tooluitvoer terugvoert naar het model.

Verouderde gebundelde Plugins kunnen nog steeds `api.registerCodexAppServerExtensionFactory(...)` gebruiken voor middleware die alleen voor Codex app-server bedoeld is, maar nieuwe resultaattransformaties zouden de runtime-neutrale API moeten gebruiken. De Pi-only hook `api.registerEmbeddedExtensionFactory(...)` is verwijderd; Pi-transformaties van toolresultaten moeten runtime-neutrale middleware gebruiken.

### Classificatie van terminale uitkomst

Native harnassen die eigenaar zijn van hun eigen protocolprojectie kunnen `classifyAgentHarnessTerminalOutcome(...)` uit `openclaw/plugin-sdk/agent-harness-runtime` gebruiken wanneer een voltooide beurt geen zichtbare assistenttekst heeft geproduceerd. De helper retourneert `empty`, `reasoning-only` of `planning-only`, zodat het terugvalbeleid van OpenClaw kan beslissen of opnieuw moet worden geprobeerd met een ander model. Promptfouten, lopende beurten en opzettelijke stille antwoorden zoals `NO_REPLY` blijven bewust ongeclassificeerd.

### Native Codex-harnasmodus

Het gebundelde `codex`-harnas is de native Codex-modus voor ingebedde OpenClaw-agentbeurten. Schakel eerst de gebundelde `codex`-Plugin in en neem `codex` op in `plugins.allow` als je config een restrictieve allowlist gebruikt. Native app-serverconfigs zouden `openai/gpt-*` met `agentRuntime.id: "codex"` moeten gebruiken. Gebruik `openai-codex/*` voor Codex OAuth via PI. Verouderde `codex/*`-modelrefs blijven compatibiliteitsaliassen voor het native harnas.

Wanneer deze modus draait, is Codex eigenaar van de native thread-id, hervatgedrag, Compaction en app-serveruitvoering. OpenClaw blijft eigenaar van het chatkanaal, de zichtbare transcriptspiegel, toolbeleid, goedkeuringen, mediabezorging en sessieselectie. Gebruik `agentRuntime.id: "codex"` zonder `fallback`-override wanneer je moet bewijzen dat alleen het Codex app-serverpad de uitvoering kan claimen. Expliciete Plugin-runtimes falen standaard al gesloten. Stel `fallback: "pi"` alleen in wanneer je bewust wilt dat PI ontbrekende harnasselectie afhandelt. Codex app-serverfouten falen al direct in plaats van opnieuw te proberen via PI.

## PI-terugval uitschakelen

Standaard voert OpenClaw ingebedde agenten uit met `agents.defaults.agentRuntime` ingesteld op `{ id: "auto", fallback: "pi" }`. In `auto`-modus kunnen geregistreerde Plugin-harnassen een provider-/modelpaar claimen. Als er geen overeenkomen, valt OpenClaw terug op PI.

Stel in `auto`-modus `fallback: "none"` in wanneer ontbrekende selectie van een Plugin-harnas moet falen in plaats van PI te gebruiken. Expliciete Plugin-runtimes zoals `runtime: "codex"` falen standaard al gesloten, tenzij `fallback: "pi"` in dezelfde config- of omgevingsoverride-scope is ingesteld. Fouten in geselecteerde Plugin-harnassen falen altijd hard. Dit blokkeert geen expliciete `runtime: "pi"` of `OPENCLAW_AGENT_RUNTIME=pi`.

Voor ingebedde uitvoeringen die alleen Codex gebruiken:

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

Als je wilt dat elk geregistreerd Plugin-harnas overeenkomende modellen kan claimen, maar nooit wilt dat OpenClaw stilzwijgend terugvalt op PI, behoud dan `runtime: "auto"` en schakel de terugval uit:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
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
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` overschrijft nog steeds de geconfigureerde runtime. Gebruik `OPENCLAW_AGENT_HARNESS_FALLBACK=none` om PI-terugval vanuit de omgeving uit te schakelen.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Met terugval uitgeschakeld faalt een sessie vroeg wanneer het aangevraagde harnas niet is geregistreerd, de opgeloste provider/het opgeloste model niet ondersteunt, of faalt voordat er beurtneveneffecten worden geproduceerd. Dat is bewust voor Codex-only deployments en voor live tests die moeten bewijzen dat het Codex app-serverpad daadwerkelijk in gebruik is.

Deze instelling regelt alleen het ingebedde agentharnas. Ze schakelt geen routering uit voor image-, video-, music-, TTS-, PDF- of andere providerspecifieke modellen.

## Native sessies en transcriptspiegel

Een harnas kan een native sessie-id, thread-id of daemon-side hervattoken bewaren. Houd die binding expliciet gekoppeld aan de OpenClaw-sessie en blijf gebruikerszichtbare assistent-/tooluitvoer spiegelen naar het OpenClaw-transcript.

Het OpenClaw-transcript blijft de compatibiliteitslaag voor:

- kanaalzichtbare sessiegeschiedenis
- transcriptzoekactie en indexering
- terugschakelen naar het ingebouwde PI-harnas bij een latere beurt
- generiek gedrag voor `/new`, `/reset` en sessieverwijdering

Als je harnas een sidecarbinding opslaat, implementeer dan `reset(...)` zodat OpenClaw die kan wissen wanneer de eigenaar-OpenClaw-sessie wordt gereset.

## Tool- en mediaresultaten

Core stelt de OpenClaw-toollijst samen en geeft die door aan de voorbereide poging.
Wanneer een harnas een dynamische toolaanroep uitvoert, retourneer je het toolresultaat terug via
de resultaatvorm van het harnas in plaats van zelf kanaalmedia te verzenden.

Dit houdt tekst-, afbeeldings-, video-, muziek-, TTS-, goedkeurings- en berichtentooluitvoer
op hetzelfde afleverpad als PI-ondersteunde uitvoeringen.

## Huidige beperkingen

- Het openbare importpad is generiek, maar sommige type-aliassen voor poging/resultaat dragen nog steeds
  `Pi`-namen voor compatibiliteit.
- Installatie van harnassen van derden is experimenteel. Geef de voorkeur aan provider-Plugins
  totdat je een native sessie-runtime nodig hebt.
- Wisselen van harnas wordt tussen beurten ondersteund. Wissel niet van harnas
  midden in een beurt nadat native tools, goedkeuringen, assistenttekst of het verzenden van berichten
  zijn gestart.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview)
- [Runtimehelpers](/nl/plugins/sdk-runtime)
- [Provider-Plugins](/nl/plugins/sdk-provider-plugins)
- [Codex-harnas](/nl/plugins/codex-harness)
- [Modelproviders](/nl/concepts/model-providers)
