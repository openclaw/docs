---
read_when:
    - Je wijzigt de ingebedde agentruntime of het harnasregister
    - Je registreert een agent-harnas vanuit een gebundelde of vertrouwde Plugin
    - Je moet begrijpen hoe de Codex-Plugin zich verhoudt tot modelproviders
sidebarTitle: Agent Harness
summary: Experimenteel SDK-oppervlak voor plugins die de ingebedde agentuitvoerder op laag niveau vervangen
title: Plugins voor agentharnas
x-i18n:
    generated_at: "2026-05-11T20:42:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Een **agent harness** is de low-level uitvoerder voor één voorbereide OpenClaw-agentbeurt. Het is geen modelprovider, geen kanaal en geen toolregister.
Voor het gebruikersgerichte mentale model, zie [Agent-runtimes](/nl/concepts/agent-runtimes).

Gebruik dit oppervlak alleen voor gebundelde of vertrouwde native plugins. Het contract is
nog experimenteel omdat de parametertypen bewust de huidige
embedded runner weerspiegelen.

## Wanneer een harness gebruiken

Registreer een agent harness wanneer een modelfamilie een eigen native sessie-
runtime heeft en het normale OpenClaw-providertransport de verkeerde abstractie is.

Voorbeelden:

- een native coding-agent-server die threads en Compaction beheert
- een lokale CLI of daemon die native plan-/redenerings-/tool-events moet streamen
- een modelruntime die een eigen resume-id nodig heeft naast het OpenClaw-
  sessietranscript

Registreer **geen** harness alleen om een nieuwe LLM-API toe te voegen. Voor normale HTTP- of
WebSocket-model-API's bouw je een [providerplugin](/nl/plugins/sdk-provider-plugins).

## Wat core nog steeds beheert

Voordat een harness wordt geselecteerd, heeft OpenClaw al het volgende bepaald:

- provider en model
- runtime-authenticatiestatus
- denkniveau en contextbudget
- het OpenClaw-transcript-/sessiebestand
- werkruimte, sandbox en toolbeleid
- callbacks voor kanaalantwoorden en streamingcallbacks
- model-fallback en beleid voor live modelwisselingen

Die scheiding is bewust. Een harness voert een voorbereide poging uit; het kiest geen
providers, vervangt geen kanaalbezorging en wisselt niet stilzwijgend van model.

De voorbereide poging bevat ook `params.runtimePlan`, een door OpenClaw beheerde
beleidsbundel voor runtimebeslissingen die gedeeld moet blijven tussen PI en native
harnesses:

- `runtimePlan.tools.normalize(...)` en
  `runtimePlan.tools.logDiagnostics(...)` voor providerbewust toolschemabeleid
- `runtimePlan.transcript.resolvePolicy(...)` voor transcriptsanering en
  herstelbeleid voor toolaanroepen
- `runtimePlan.delivery.isSilentPayload(...)` voor gedeelde `NO_REPLY` en onderdrukking van media-
  bezorging
- `runtimePlan.outcome.classifyRunResult(...)` voor classificatie van model-fallback
- `runtimePlan.observability` voor opgeloste provider-/model-/harnessmetadata

Harnesses mogen het plan gebruiken voor beslissingen die moeten overeenkomen met PI-gedrag, maar
moeten het nog steeds behandelen als door de host beheerde pogingstatus. Muteer het niet en gebruik het niet om
binnen een beurt van provider/model te wisselen.

## Een harness registreren

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

OpenClaw kiest een harness na provider-/modelresolutie:

1. Modelgescoped runtimebeleid wint.
2. Providergescoped runtimebeleid komt daarna.
3. `auto` vraagt geregistreerde harnesses of ze de opgeloste
   provider/model-combinatie ondersteunen.
4. Als geen geregistreerde harness overeenkomt, gebruikt OpenClaw PI tenzij PI-fallback is
   uitgeschakeld.

Fouten in plugin-harnesses verschijnen als uitvoeringsfouten. In `auto`-modus wordt PI-fallback
alleen gebruikt wanneer geen geregistreerde plugin-harness de opgeloste
provider/model-combinatie ondersteunt. Zodra een plugin-harness een run heeft geclaimd, speelt OpenClaw
diezelfde beurt niet opnieuw via PI af, omdat dat auth-/runtime-semantiek kan wijzigen
of neveneffecten kan dupliceren.

Runtime-pins voor hele sessies en hele agents worden genegeerd door de selectie. Dat
omvat verouderde sessiewaarden voor `agentHarnessId`, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime` en `OPENCLAW_AGENT_RUNTIME`. `/status` toont de
effectieve runtime die is geselecteerd vanuit de provider-/modelroute.
Als de geselecteerde harness verrassend is, schakel dan debuglogging voor `agents/harness` in en
inspecteer de gestructureerde `agent harness selected`-record van de gateway. Die bevat
de geselecteerde harness-id, selectiereden, runtime-/fallbackbeleid en, in
`auto`-modus, het ondersteuningsresultaat van elke pluginkandidaat.

De gebundelde Codex-plugin registreert `codex` als harness-id. Core behandelt dat
als een gewone plugin-harness-id; Codex-specifieke aliassen horen thuis in de plugin
of operatorconfiguratie, niet in de gedeelde runtimeselector.

## Provider plus harness-koppeling

De meeste harnesses moeten ook een provider registreren. De provider maakt modelreferenties,
authenticatiestatus, modelmetadata en `/model`-selectie zichtbaar voor de rest van
OpenClaw. De harness claimt die provider vervolgens in `supports(...)`.

De gebundelde Codex-plugin volgt dit patroon:

- voorkeursmodelreferenties voor gebruikers: `openai/gpt-5.5`
- compatibiliteitsreferenties: legacy `codex/gpt-*`-referenties blijven geaccepteerd, maar nieuwe
  configuraties zouden ze niet als normale provider-/modelreferenties moeten gebruiken
- harness-id: `codex`
- auth: synthetische providerbeschikbaarheid, omdat de Codex-harness de
  native Codex-login/-sessie beheert
- app-server-aanvraag: OpenClaw stuurt de kale model-id naar Codex en laat de
  harness met het native app-serverprotocol praten

De Codex-plugin is additief. Gewone `openai/gpt-*`-agentreferenties op de officiële
OpenAI-provider selecteren standaard de Codex-harness. Oudere `codex/gpt-*`-referenties
selecteren nog steeds de Codex-provider en -harness voor compatibiliteit.

Voor operatorconfiguratie, voorbeelden van modelprefixen en Codex-only configuraties, zie
[Codex Harness](/nl/plugins/codex-harness).

OpenClaw vereist Codex app-server `0.125.0` of nieuwer. De Codex-plugin controleert
de initialize-handshake van de app-server en blokkeert oudere of niet-geversioneerde servers zodat
OpenClaw alleen draait tegen het protocoloppervlak waarmee het is getest. De
`0.125.0`-ondergrens omvat de ondersteuning voor native MCP-hookpayloads die in
Codex `0.124.0` is geland, terwijl OpenClaw wordt vastgezet op de nieuwere geteste stabiele lijn.

### Toolresultaat-middleware

Gebundelde plugins kunnen runtime-neutrale toolresultaat-middleware koppelen via
`api.registerAgentToolResultMiddleware(...)` wanneer hun manifest de
gerichte runtime-id's declareert in `contracts.agentToolResultMiddleware`. Deze vertrouwde
naad is voor asynchrone toolresultaattransformaties die moeten draaien voordat PI of Codex
tooluitvoer terugvoert naar het model.

Legacy gebundelde plugins kunnen nog steeds
`api.registerCodexAppServerExtensionFactory(...)` gebruiken voor middleware die alleen voor Codex app-server is,
maar nieuwe resultaattransformaties moeten de runtime-neutrale API gebruiken.
De Pi-only hook `api.registerEmbeddedExtensionFactory(...)` is verwijderd;
Pi-toolresultaattransformaties moeten runtime-neutrale middleware gebruiken.

### Classificatie van terminale uitkomst

Native harnesses die hun eigen protocolprojectie beheren, kunnen
`classifyAgentHarnessTerminalOutcome(...)` uit
`openclaw/plugin-sdk/agent-harness-runtime` gebruiken wanneer een voltooide beurt geen
zichtbare assistenttekst heeft geproduceerd. De helper retourneert `empty`, `reasoning-only` of
`planning-only`, zodat het fallbackbeleid van OpenClaw kan beslissen of opnieuw moet worden geprobeerd op een
ander model. Promptfouten, lopende beurten en
opzettelijke stille antwoorden zoals `NO_REPLY` blijven bewust ongeclassificeerd.

### Native Codex-harnessmodus

De gebundelde `codex`-harness is de native Codex-modus voor embedded OpenClaw-
agentbeurten. Schakel eerst de gebundelde `codex`-plugin in en neem `codex` op in
`plugins.allow` als je configuratie een restrictieve allowlist gebruikt. Native app-server-
configuraties moeten `openai/gpt-*` gebruiken; OpenAI-agentbeurten selecteren standaard de Codex-harness. Legacy `openai-codex/*`-routes moeten worden hersteld met
`openclaw doctor --fix`, en legacy `codex/*`-modelreferenties blijven compatibiliteitsaliassen voor de native harness.

Wanneer deze modus draait, beheert Codex de native thread-id, resume-gedrag,
Compaction en app-serveruitvoering. OpenClaw beheert nog steeds het chatkanaal,
de zichtbare transcriptspiegel, toolbeleid, goedkeuringen, mediabezorging en sessie-
selectie. Gebruik provider/model `agentRuntime.id: "codex"` wanneer je moet aantonen
dat alleen het Codex app-server-pad de run kan claimen. Expliciete pluginruntimes
falen gesloten; fouten bij Codex app-server-selectie en runtimefouten worden niet
opnieuw geprobeerd via PI.

## Runtime-striktheid

Standaard gebruikt OpenClaw `auto` provider-/modelruntimebeleid: geregistreerde
plugin-harnesses kunnen een provider/model-paar claimen, en PI verwerkt de beurt wanneer
niets overeenkomt. OpenAI-agentreferenties op de officiële OpenAI-provider gaan standaard naar Codex.
Gebruik een expliciete provider-/model-pluginruntime zoals
`agentRuntime.id: "codex"` wanneer ontbrekende harnessselectie moet falen in plaats van
via PI te routeren. Fouten in geselecteerde plugin-harnesses falen altijd hard. Dit
blokkeert geen expliciete provider/model `agentRuntime.id: "pi"`.

Voor Codex-only embedded runs:

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
      "model": "openai/gpt-5.5"
    }
  }
}
```

Als je een CLI-backend voor één canoniek model wilt, zet de runtime dan op die
modelvermelding:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Per-agent overrides gebruiken dezelfde modelgescoped vorm:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Legacy voorbeelden van runtime voor hele agents zoals deze worden genegeerd:

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

Met een expliciete pluginruntime faalt een sessie vroeg wanneer de gevraagde
harness niet is geregistreerd, de opgeloste provider/model-combinatie niet ondersteunt, of
faalt voordat beurtlevenseffecten worden geproduceerd. Dat is bewust voor Codex-only
deployments en voor live tests die moeten aantonen dat het Codex app-server-pad
daadwerkelijk in gebruik is.

Deze instelling regelt alleen de embedded agent harness. Zij schakelt
image-, video-, music-, TTS-, PDF- of andere providerspecifieke modelroutering niet uit.

## Native sessies en transcriptspiegel

Een harness kan een native sessie-id, thread-id of resume-token aan de daemonzijde bewaren.
Houd die binding expliciet gekoppeld aan de OpenClaw-sessie, en blijf
gebruikerszichtbare assistent-/tooluitvoer spiegelen naar het OpenClaw-transcript.

Het OpenClaw-transcript blijft de compatibiliteitslaag voor:

- kanaalzichtbare sessiegeschiedenis
- transcriptzoekopdrachten en indexering
- terugschakelen naar de ingebouwde PI-harness in een latere beurt
- generiek gedrag voor `/new`, `/reset` en sessieverwijdering

Als je harness een sidecar-binding opslaat, implementeer dan `reset(...)` zodat OpenClaw die kan
wissen wanneer de eigenaar-OpenClaw-sessie wordt gereset.

## Tool- en mediaresultaten

Core construeert de OpenClaw-toollijst en geeft die door aan de voorbereide poging.
Wanneer een harness een dynamische toolaanroep uitvoert, retourneer het toolresultaat dan via
de resultaatvorm van de harness in plaats van zelf kanaalmedia te verzenden.

Zo blijven tekst-, image-, video-, music-, TTS-, goedkeurings- en messaging-tool-uitvoer
op hetzelfde bezorgpad als door PI ondersteunde runs.

## Huidige beperkingen

- Het publieke importpad is generiek, maar sommige poging-/resultaattype-aliassen dragen nog steeds
  `Pi`-namen voor compatibiliteit.
- Installatie van harnesses van derden is experimenteel. Geef de voorkeur aan providerplugins
  totdat je een native sessieruntime nodig hebt.
- Wisselen van harness wordt ondersteund tussen beurten. Wissel niet van harness midden in een
  beurt nadat native tools, goedkeuringen, assistenttekst of berichtverzendingen
  zijn gestart.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview)
- [Runtime-helpers](/nl/plugins/sdk-runtime)
- [Provider-Plugins](/nl/plugins/sdk-provider-plugins)
- [Codex-harnas](/nl/plugins/codex-harness)
- [Modelproviders](/nl/concepts/model-providers)
