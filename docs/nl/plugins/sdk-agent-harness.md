---
read_when:
    - Je wijzigt de ingebedde agentruntime of het harnessregister
    - Je registreert een agentharnas vanuit een gebundelde of vertrouwde Plugin
    - Je moet begrijpen hoe de Codex-plugin zich verhoudt tot modelproviders
sidebarTitle: Agent Harness
summary: Experimenteel SDK-oppervlak voor plugins die de laag-niveau ingebedde agent-uitvoerder vervangen
title: Agentharnas-plugins
x-i18n:
    generated_at: "2026-06-27T18:05:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Een **agent-harness** is de low-level uitvoerder voor één voorbereide OpenClaw-agentbeurt. Het is geen modelaanbieder, geen kanaal en geen toolregister.
Zie [Agent-runtimes](/nl/concepts/agent-runtimes) voor het gebruikersgerichte mentale model.

Gebruik dit oppervlak alleen voor gebundelde of vertrouwde native plugins. Het contract is
nog experimenteel omdat de parametertypen bewust de huidige ingebedde runner
weerspiegelen.

## Wanneer je een harness gebruikt

Registreer een agent-harness wanneer een modelfamilie een eigen native sessieruntime
heeft en het normale OpenClaw-providertransport de verkeerde abstractie is.

Voorbeelden:

- een native coding-agentserver die threads en Compaction beheert
- een lokale CLI of daemon die native plan-/redeneer-/tool-events moet streamen
- een modelruntime die een eigen hervat-id nodig heeft naast het OpenClaw-
  sessietranscript

Registreer **geen** harness alleen om een nieuwe LLM-API toe te voegen. Bouw voor normale HTTP- of
WebSocket-model-API's een [providerplugin](/nl/plugins/sdk-provider-plugins).

## Wat core nog steeds beheert

Voordat een harness wordt geselecteerd, heeft OpenClaw al het volgende opgelost:

- provider en model
- runtime-authenticatiestatus
- denkniveau en contextbudget
- het OpenClaw-transcript-/sessiebestand
- workspace, sandbox en toolbeleid
- kanaalantwoord-callbacks en streaming-callbacks
- modelterugval en beleid voor live wisselen van model

Die scheiding is bewust. Een harness voert een voorbereide poging uit; het kiest geen
providers, vervangt geen kanaallevering en wisselt niet stilzwijgend van model.

De voorbereide poging bevat ook `params.runtimePlan`, een door OpenClaw beheerde
beleidsbundel voor runtimebeslissingen die gedeeld moeten blijven tussen OpenClaw en native
harnesses:

- `runtimePlan.tools.normalize(...)` en
  `runtimePlan.tools.logDiagnostics(...)` voor providerbewust toolschemabeleid
- `runtimePlan.transcript.resolvePolicy(...)` voor transcriptsanering en
  reparatiebeleid voor tool-calls
- `runtimePlan.delivery.isSilentPayload(...)` voor gedeelde `NO_REPLY` en onderdrukking
  van medialevering
- `runtimePlan.outcome.classifyRunResult(...)` voor classificatie van modelterugval
- `runtimePlan.observability` voor opgeloste provider-/model-/harnessmetadata

Harnesses mogen het plan gebruiken voor beslissingen die met OpenClaw-gedrag moeten overeenkomen, maar
moeten het nog steeds behandelen als door de host beheerde pogingstatus. Muteer het niet en gebruik het niet om
providers/modellen binnen een beurt te wisselen.

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

1. Modelgebonden runtimebeleid wint.
2. Providergebonden runtimebeleid komt daarna.
3. `auto` vraagt geregistreerde harnesses of ze de opgeloste
   provider/het opgeloste model ondersteunen.
4. Als geen geregistreerde harness overeenkomt, gebruikt OpenClaw de ingebedde runtime.

Fouten in pluginharnesses verschijnen als runfouten. In `auto`-modus wordt ingebedde terugval
alleen gebruikt wanneer geen geregistreerde pluginharness de opgeloste
provider/het opgeloste model ondersteunt. Zodra een pluginharness een run heeft geclaimd, speelt OpenClaw
diezelfde beurt niet opnieuw af via een andere runtime, omdat dat
auth-/runtimesemantiek kan veranderen of neveneffecten kan dupliceren.

Runtimepinnen voor hele sessies en hele agents worden door selectie genegeerd. Dat
omvat verouderde sessiewaarden `agentHarnessId`, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime` en `OPENCLAW_AGENT_RUNTIME`. `/status` toont de
effectieve runtime die uit de provider-/modelroute is geselecteerd.
Als de geselecteerde harness onverwacht is, schakel dan debuglogging voor `agents/harness` in en
inspecteer het gestructureerde Gateway-record `agent harness selected`. Het bevat
de geselecteerde harness-id, selectiereden, runtime-/terugvalbeleid en, in
`auto`-modus, het ondersteuningsresultaat van elke pluginkandidaat.

De gebundelde Codex-plugin registreert `codex` als harness-id. Core behandelt dat
als een gewone pluginharness-id; Codex-specifieke aliassen horen thuis in de plugin
of operatorconfiguratie, niet in de gedeelde runtimeselector.

## Provider plus harness koppelen

De meeste harnesses moeten ook een provider registreren. De provider maakt modelverwijzingen,
authenticatiestatus, modelmetadata en `/model`-selectie zichtbaar voor de rest van
OpenClaw. De harness claimt die provider vervolgens in `supports(...)`.

De gebundelde Codex-plugin volgt dit patroon:

- voorkeursmodelverwijzingen voor gebruikers: `openai/gpt-5.5`
- compatibiliteitsverwijzingen: verouderde `codex/gpt-*`-verwijzingen blijven geaccepteerd, maar nieuwe
  configuraties moeten ze niet gebruiken als normale provider-/modelverwijzingen
- harness-id: `codex`
- authenticatie: synthetische providerbeschikbaarheid, omdat de Codex-harness de
  native Codex-login/-sessie beheert
- app-serververzoek: OpenClaw stuurt de kale model-id naar Codex en laat de
  harness met het native app-serverprotocol praten

De Codex-plugin is aanvullend. Gewone `openai/gpt-*`-agentverwijzingen op de officiële
OpenAI-provider selecteren standaard de Codex-harness. Oudere `codex/gpt-*`-verwijzingen
selecteren nog steeds de Codex-provider en -harness voor compatibiliteit.

Zie [Codex Harness](/nl/plugins/codex-harness) voor operatorconfiguratie, voorbeelden van modelprefixen
en Codex-only configuraties.

OpenClaw vereist Codex app-server `0.125.0` of nieuwer. De Codex-plugin controleert
de initialize-handshake van de app-server en blokkeert oudere of niet-geversioneerde servers, zodat
OpenClaw alleen draait tegen het protocoloppervlak waarmee het is getest. De
`0.125.0`-ondergrens bevat de native MCP-hookpayloadondersteuning die in
Codex `0.124.0` is geland, terwijl OpenClaw wordt vastgepind op de nieuwere geteste stabiele lijn.

### Toolresultaatmiddleware

Gebundelde plugins en expliciet ingeschakelde geïnstalleerde plugins met overeenkomende manifest-
contracten kunnen runtime-neutrale toolresultaatmiddleware koppelen via
`api.registerAgentToolResultMiddleware(...)` wanneer hun manifest de
gerichte runtime-id's declareert in `contracts.agentToolResultMiddleware`. Deze vertrouwde
naad is bedoeld voor asynchrone toolresultaattransformaties die moeten draaien voordat OpenClaw of Codex
tooluitvoer terugvoert naar het model.

Verouderde gebundelde plugins kunnen nog steeds
`api.registerCodexAppServerExtensionFactory(...)` gebruiken voor Codex app-server-only
middleware, maar nieuwe resultaattransformaties moeten de runtime-neutrale API gebruiken.
De embedded-runner-only hook `api.registerEmbeddedExtensionFactory(...)` is verwijderd;
ingebedde toolresultaattransformaties moeten runtime-neutrale middleware gebruiken.

### Classificatie van terminale uitkomst

Native harnesses die hun eigen protocolprojectie beheren, kunnen
`classifyAgentHarnessTerminalOutcome(...)` uit
`openclaw/plugin-sdk/agent-harness-runtime` gebruiken wanneer een voltooide beurt geen
zichtbare assistenttekst heeft opgeleverd. De helper retourneert `empty`, `reasoning-only` of
`planning-only`, zodat OpenClaw's terugvalbeleid kan beslissen of opnieuw proberen op een
ander model nodig is. `planning-only` vereist het expliciete `planText`-veld van de harness;
OpenClaw leidt dit niet af uit assistentproza. De helper laat promptfouten, lopende beurten en opzettelijke stille antwoorden zoals
`NO_REPLY` bewust ongeclassificeerd.

### Agent-end-neveneffecten

Native harnesses moeten `runAgentEndSideEffects(...)` uit
`openclaw/plugin-sdk/agent-harness-runtime` aanroepen nadat ze een poging afronden. Het
verzendt de portable `agent_end`-hook en OpenClaw's onderzoekscapture zonder
interactieve antwoorden te vertragen. Gebruik `awaitAgentEndSideEffects(...)` voor lokale,
niet-interactieve runs waarbij de poging pas mag worden opgelost nadat die neveneffecten
zijn voltooid. Beide helpers accepteren dezelfde `{ event, ctx }`-payload als
`runAgentHarnessAgentEndHook(...)`; hun fouten wijzigen het voltooide
pogingsresultaat niet.

### Gebruikersinvoer en tooloppervlakken

Native harnesses die een gebruikersinvoerverzoek op runtimeniveau blootstellen, moeten de
gebruikersinvoerhelpers uit `openclaw/plugin-sdk/agent-harness-runtime` gebruiken om
de prompt te formatteren, die via OpenClaw's blokkerende antwoordpad te leveren en
keuze-/vrije-vorm-antwoorden terug te normaliseren naar de native antwoordvorm van de runtime. De
helper houdt kanaal-/TUI-presentatie consistent terwijl elke harness zijn
eigen protocolparsing en levenscyclus voor pending verzoeken behoudt.

Native harnesses die PI-achtige compacte toolroutering nodig hebben, moeten
`createAgentHarnessToolSurfaceRuntime(...)` uit
`openclaw/plugin-sdk/agent-harness-tool-runtime` gebruiken. Die beheert
tool-search-/code-mode-besturingsselectie, slanke local-model-standaarden,
runtime-compatibele schemafiltering, uitvoering van verborgen catalogi, directory-
hydratie en catalogusopschoning. Harnesses beheren nog steeds hun SDK-specifieke tool-
conversie en native uitvoeringscallback.

### Native Codex-harnessmodus

De gebundelde `codex`-harness is de native Codex-modus voor ingebedde OpenClaw-
agentbeurten. Schakel eerst de gebundelde `codex`-plugin in en neem `codex` op in
`plugins.allow` als je configuratie een beperkende allowlist gebruikt. Native app-server-
configuraties moeten `openai/gpt-*` gebruiken; OpenAI-agentbeurten selecteren standaard de Codex-harness.
Verouderde Codex-modelverwijzingsroutes moeten worden gerepareerd met
`openclaw doctor --fix`, en verouderde `codex/*`-modelverwijzingen blijven compatibiliteitsaliassen
voor de native harness.

Wanneer deze modus draait, beheert Codex de native thread-id, hervatgedrag,
Compaction en app-serveruitvoering. OpenClaw beheert nog steeds het chatkanaal,
de zichtbare transcriptspiegel, toolbeleid, goedkeuringen, medialevering en sessie-
selectie. Gebruik provider/model `agentRuntime.id: "codex"` wanneer je moet bewijzen
dat alleen het Codex app-serverpad de run kan claimen. Expliciete pluginruntimes
falen gesloten; selectiefouten van de Codex app-server en runtimefouten worden niet
opnieuw geprobeerd via een andere runtime.

## Runtimestriktheid

Standaard gebruikt OpenClaw `auto` provider-/modelruntimebeleid: geregistreerde
pluginharnesses kunnen een provider-/modelpaar claimen en de ingebedde runtime
handelt de beurt af wanneer er geen overeenkomen. OpenAI-agentverwijzingen op de officiële OpenAI-provider gebruiken standaard Codex.
Gebruik een expliciete provider-/modelpluginruntime zoals
`agentRuntime.id: "codex"` wanneer ontbrekende harnessselectie moet falen in plaats van
via de ingebedde runtime te routeren. Geselecteerde pluginharnessfouten falen altijd
hard. Dit blokkeert geen expliciete provider/model `agentRuntime.id: "openclaw"`.

Voor Codex-only ingebedde runs:

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
modelentry:

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

Per-agent-overschrijvingen gebruiken dezelfde modelgebonden vorm:

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

Verouderde voorbeelden van hele-agent-runtimes zoals dit worden genegeerd:

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

Met een expliciete Plugin-runtime mislukt een sessie vroeg wanneer de aangevraagde
harness niet is geregistreerd, de opgeloste provider/het opgeloste model niet ondersteunt, of
mislukt voordat er neveneffecten voor de beurt zijn geproduceerd. Dat is opzettelijk voor Codex-only
implementaties en voor live tests die moeten bewijzen dat het Codex-app-serverpad
daadwerkelijk in gebruik is.

Deze instelling beheert alleen de ingebedde agent-harness. Ze schakelt
image-, video-, muziek-, TTS-, PDF- of andere providerspecifieke modelrouting niet uit.

## Native sessies en transcriptspiegel

Een harness kan een native sessie-id, thread-id of hervattingstoken aan daemonzijde bewaren.
Houd die binding expliciet gekoppeld aan de OpenClaw-sessie en blijf
voor gebruikers zichtbare assistant-/tooluitvoer spiegelen naar het OpenClaw-transcript.

Het OpenClaw-transcript blijft de compatibiliteitslaag voor:

- kanaalzichtbare sessiegeschiedenis
- transcriptzoekfunctie en indexering
- terugschakelen naar de ingebouwde OpenClaw-harness bij een latere beurt
- generiek gedrag voor `/new`, `/reset` en het verwijderen van sessies

Als je harness een sidecar-binding opslaat, implementeer dan `reset(...)` zodat OpenClaw deze kan
wissen wanneer de bijbehorende OpenClaw-sessie wordt gereset.

## Tool- en mediaresultaten

Core stelt de OpenClaw-toollijst samen en geeft deze door aan de voorbereide poging.
Wanneer een harness een dynamische toolaanroep uitvoert, retourneer je het toolresultaat via
de resultaatvorm van de harness in plaats van zelf kanaalmedia te verzenden.

Dit houdt tekst-, image-, video-, muziek-, TTS-, goedkeurings- en messaging-tooluitvoer
op hetzelfde afleverpad als door OpenClaw ondersteunde runs.

## Huidige beperkingen

- Het openbare importpad is generiek, maar sommige type-aliassen voor poging/resultaat dragen nog
  legacy-namen voor compatibiliteit.
- Installatie van harnesses van derden is experimenteel. Geef de voorkeur aan provider-Plugins
  totdat je een native sessieruntime nodig hebt.
- Wisselen van harness wordt ondersteund tussen beurten. Wissel niet van harness
  midden in een beurt nadat native tools, goedkeuringen, assistant-tekst of berichtverzendingen
  zijn gestart.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview)
- [Runtime-helpers](/nl/plugins/sdk-runtime)
- [Provider-Plugins](/nl/plugins/sdk-provider-plugins)
- [Codex-harness](/nl/plugins/codex-harness)
- [Modelproviders](/nl/concepts/model-providers)
