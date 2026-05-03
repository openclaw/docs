---
read_when:
    - U wijzigt de ingebedde agentruntime of het harnessregister
    - Je registreert een agentharnas vanuit een gebundelde of vertrouwde Plugin
    - Je moet begrijpen hoe de Codex Plugin zich verhoudt tot modelproviders
sidebarTitle: Agent Harness
summary: Experimenteel SDK-oppervlak voor plugins die de laag-niveau ingebedde agentuitvoerder vervangen
title: Agent-harness-plugins
x-i18n:
    generated_at: "2026-05-03T11:17:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Een **agent-harnas** is de low-level uitvoerder voor één voorbereide OpenClaw-agentbeurt. Het is geen modelprovider, geen kanaal en geen toolregister. Zie voor het gebruikersgerichte mentale model [Agent-runtimes](/nl/concepts/agent-runtimes).

Gebruik dit oppervlak alleen voor gebundelde of vertrouwde systeemeigen plugins. Het contract is nog experimenteel omdat de parametertypen bewust de huidige ingesloten runner weerspiegelen.

## Wanneer een harnas gebruiken

Registreer een agent-harnas wanneer een modelfamilie een eigen systeemeigen sessieruntime heeft en het normale OpenClaw-providertransport de verkeerde abstractie is.

Voorbeelden:

- een systeemeigen coding-agent-server die threads en compaction beheert
- een lokale CLI of daemon die systeemeigen plan-/redenerings-/toolgebeurtenissen moet streamen
- een modelruntime die naast het OpenClaw-sessietranscript een eigen hervat-id nodig heeft

Registreer **geen** harnas alleen om een nieuwe LLM-API toe te voegen. Bouw voor normale HTTP- of WebSocket-model-API's een [providerplugin](/nl/plugins/sdk-provider-plugins).

## Wat core nog steeds beheert

Voordat een harnas wordt geselecteerd, heeft OpenClaw al het volgende bepaald:

- provider en model
- runtime-authenticatiestatus
- denkniveau en contextbudget
- het OpenClaw-transcript-/sessiebestand
- workspace, sandbox en toolbeleid
- callbacks voor kanaalantwoorden en streaming-callbacks
- beleid voor modelfallback en live modelwisseling

Die splitsing is bewust. Een harnas voert een voorbereide poging uit; het kiest geen providers, vervangt geen kanaalaflevering en wisselt niet stilzwijgend van model.

De voorbereide poging bevat ook `params.runtimePlan`, een door OpenClaw beheerde beleidsbundel voor runtimebeslissingen die gedeeld moeten blijven tussen PI en systeemeigen harnassen:

- `runtimePlan.tools.normalize(...)` en
  `runtimePlan.tools.logDiagnostics(...)` voor providerbewust toolschemabeleid
- `runtimePlan.transcript.resolvePolicy(...)` voor transcriptsanitisatie en
  reparatiebeleid voor toolaanroepen
- `runtimePlan.delivery.isSilentPayload(...)` voor gedeelde `NO_REPLY` en onderdrukking van media-aflevering
- `runtimePlan.outcome.classifyRunResult(...)` voor classificatie van modelfallback
- `runtimePlan.observability` voor opgeloste metadata van provider/model/harnas

Harnassen mogen het plan gebruiken voor beslissingen die overeen moeten komen met PI-gedrag, maar moeten het nog steeds behandelen als pogingstatus die eigendom is van de host. Muteer het niet en gebruik het niet om binnen een beurt van provider/model te wisselen.

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

OpenClaw kiest een harnas na provider-/modelresolutie:

1. De vastgelegde harnas-id van een bestaande sessie wint, zodat configuratie-/env-wijzigingen dat transcript niet live naar een andere runtime wisselen.
2. `OPENCLAW_AGENT_RUNTIME=<id>` dwingt een geregistreerd harnas met die id af voor sessies die nog niet zijn vastgezet.
3. `OPENCLAW_AGENT_RUNTIME=pi` dwingt het ingebouwde PI-harnas af.
4. `OPENCLAW_AGENT_RUNTIME=auto` vraagt geregistreerde harnassen of ze de opgeloste provider/het opgeloste model ondersteunen.
5. Als geen geregistreerd harnas overeenkomt, gebruikt OpenClaw PI tenzij PI-fallback is uitgeschakeld.

Plugin-harnasfouten verschijnen als runfouten. In `auto`-modus wordt PI-fallback alleen gebruikt wanneer geen geregistreerd Plugin-harnas de opgeloste provider/het opgeloste model ondersteunt. Zodra een Plugin-harnas een run heeft geclaimd, speelt OpenClaw dezelfde beurt niet opnieuw via PI af, omdat dat authenticatie-/runtime-semantiek kan wijzigen of bijwerkingen kan dupliceren.

De geselecteerde harnas-id wordt na een ingesloten run opgeslagen met de sessie-id. Legacy sessies die zijn gemaakt voordat harnas-pins bestonden, worden behandeld als PI-vastgezet zodra ze transcriptgeschiedenis hebben. Gebruik een nieuwe/geresette sessie wanneer je wisselt tussen PI en een systeemeigen Plugin-harnas. `/status` toont niet-standaard harnas-id's zoals `codex` naast `Fast`; PI blijft verborgen omdat dit het standaard compatibiliteitspad is. Als het geselecteerde harnas onverwacht is, schakel dan `agents/harness`-debuglogging in en inspecteer het gestructureerde Gateway-record `agent harness selected`. Het bevat de geselecteerde harnas-id, selectiereden, runtime-/fallbackbeleid en, in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

De gebundelde Codex-plugin registreert `codex` als harnas-id. Core behandelt dat als een gewone Plugin-harnas-id; Codex-specifieke aliassen horen in de Plugin- of operatorconfiguratie, niet in de gedeelde runtimeselector.

## Provider plus harnaskoppeling

De meeste harnassen moeten ook een provider registreren. De provider maakt modelverwijzingen, authenticatiestatus, modelmetadata en `/model`-selectie zichtbaar voor de rest van OpenClaw. Het harnas claimt die provider vervolgens in `supports(...)`.

De gebundelde Codex-plugin volgt dit patroon:

- voorkeursmodelverwijzingen voor gebruikers: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- compatibiliteitsverwijzingen: legacy `codex/gpt-*`-verwijzingen blijven geaccepteerd, maar nieuwe configuraties moeten ze niet gebruiken als normale provider-/modelverwijzingen
- harnas-id: `codex`
- authenticatie: synthetische providerbeschikbaarheid, omdat het Codex-harnas de systeemeigen Codex-login/-sessie beheert
- app-server-aanvraag: OpenClaw stuurt de kale model-id naar Codex en laat het harnas met het systeemeigen app-serverprotocol praten

De Codex-plugin is aanvullend. Gewone `openai/gpt-*`-verwijzingen blijven het normale OpenClaw-providerpad gebruiken, tenzij je het Codex-harnas afdwingt met `agentRuntime.id: "codex"`. Oudere `codex/gpt-*`-verwijzingen selecteren nog steeds de Codex-provider en het harnas voor compatibiliteit.

Zie [Codex-harnas](/nl/plugins/codex-harness) voor operatorconfiguratie, voorbeelden van modelprefixen en Codex-only configuraties.

OpenClaw vereist Codex app-server `0.125.0` of nieuwer. De Codex-plugin controleert de initialize-handshake van de app-server en blokkeert oudere of niet-geversioneerde servers, zodat OpenClaw alleen draait tegen het protocoloppervlak waarmee het is getest. De `0.125.0`-ondergrens bevat de systeemeigen MCP-hookpayloadondersteuning die in Codex `0.124.0` is geland, terwijl OpenClaw wordt vastgezet op de nieuwere geteste stabiele lijn.

### Middleware voor toolresultaten

Gebundelde plugins kunnen runtime-neutrale middleware voor toolresultaten koppelen via `api.registerAgentToolResultMiddleware(...)` wanneer hun manifest de beoogde runtime-id's declareert in `contracts.agentToolResultMiddleware`. Deze vertrouwde naad is voor asynchrone transformaties van toolresultaten die moeten draaien voordat PI of Codex tooluitvoer terugvoert naar het model.

Legacy gebundelde plugins kunnen nog steeds `api.registerCodexAppServerExtensionFactory(...)` gebruiken voor alleen-Codex-app-server-middleware, maar nieuwe resultaattransformaties moeten de runtime-neutrale API gebruiken. De Pi-only hook `api.registerEmbeddedExtensionFactory(...)` is verwijderd; Pi-transformaties van toolresultaten moeten runtime-neutrale middleware gebruiken.

### Classificatie van terminale uitkomsten

Systeemeigen harnassen die hun eigen protocolprojectie beheren, kunnen `classifyAgentHarnessTerminalOutcome(...)` uit `openclaw/plugin-sdk/agent-harness-runtime` gebruiken wanneer een voltooide beurt geen zichtbare assistenttekst heeft geproduceerd. De helper retourneert `empty`, `reasoning-only` of `planning-only`, zodat het fallbackbeleid van OpenClaw kan beslissen of het opnieuw moet proberen op een ander model. Promptfouten, lopende beurten en bewust stille antwoorden zoals `NO_REPLY` blijven opzettelijk ongeclassificeerd.

### Systeemeigen Codex-harnasmodus

Het gebundelde `codex`-harnas is de systeemeigen Codex-modus voor ingesloten OpenClaw-agentbeurten. Schakel eerst de gebundelde `codex`-plugin in en neem `codex` op in `plugins.allow` als je configuratie een beperkende allowlist gebruikt. Systeemeigen app-serverconfiguraties moeten `openai/gpt-*` gebruiken met `agentRuntime.id: "codex"`. Gebruik `openai-codex/*` voor Codex OAuth via PI. Legacy `codex/*`-modelverwijzingen blijven compatibiliteitsaliassen voor het systeemeigen harnas.

Wanneer deze modus draait, beheert Codex de systeemeigen thread-id, hervatgedrag, compaction en app-serveruitvoering. OpenClaw beheert nog steeds het chatkanaal, de zichtbare transcriptspiegel, het toolbeleid, goedkeuringen, media-aflevering en sessieselectie. Gebruik `agentRuntime.id: "codex"` wanneer je moet bewijzen dat alleen het Codex-app-serverpad de run kan claimen. Expliciete Plugin-runtimes falen gesloten; Codex-app-serverselectiefouten en runtimefouten worden niet opnieuw via PI geprobeerd.

## Runtime-striktheid

Standaard draait OpenClaw ingesloten agents met OpenClaw Pi. In `auto`-modus kunnen geregistreerde Plugin-harnassen een provider/model-paar claimen, en PI handelt de beurt af wanneer er geen overeenkomen. Gebruik een expliciete Plugin-runtime zoals `agentRuntime.id: "codex"` wanneer ontbrekende harnasselectie moet falen in plaats van via PI te routeren. Fouten van geselecteerde Plugin-harnassen falen altijd hard. Dit blokkeert geen expliciete `agentRuntime.id: "pi"` of `OPENCLAW_AGENT_RUNTIME=pi`.

Voor Codex-only ingesloten runs:

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

Als je wilt dat een geregistreerd Plugin-harnas overeenkomende modellen claimt en anders PI gebruikt, stel dan `id: "auto"` in:

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

Met een expliciete Plugin-runtime faalt een sessie vroeg wanneer het aangevraagde harnas niet is geregistreerd, de opgeloste provider/het opgeloste model niet ondersteunt, of faalt voordat er beurtbijwerkingen ontstaan. Dat is bewust voor Codex-only implementaties en voor live tests die moeten bewijzen dat het Codex-app-serverpad daadwerkelijk in gebruik is.

Deze instelling beheert alleen het ingesloten agent-harnas. Het schakelt image-, video-, muziek-, TTS-, PDF- of andere providerspecifieke modelroutering niet uit.

## Systeemeigen sessies en transcriptspiegel

Een harnas kan een systeemeigen sessie-id, thread-id of hervattoken aan daemonzijde bijhouden. Houd die binding expliciet gekoppeld aan de OpenClaw-sessie, en blijf gebruikerszichtbare assistent-/tooluitvoer spiegelen naar het OpenClaw-transcript.

Het OpenClaw-transcript blijft de compatibiliteitslaag voor:

- kanaalzichtbare sessiegeschiedenis
- transcript zoeken en indexeren
- terugschakelen naar het ingebouwde PI-harnas bij een latere beurt
- generiek `/new`-, `/reset`- en sessieverwijderingsgedrag

Als je harnas een sidecar-binding opslaat, implementeer dan `reset(...)` zodat OpenClaw die kan wissen wanneer de eigenaar-OpenClaw-sessie wordt gereset.

## Tool- en mediaresultaten

Core construeert de OpenClaw-toollijst en geeft die door aan de voorbereide poging. Wanneer een harnas een dynamische toolaanroep uitvoert, retourneer je het toolresultaat via de resultaatvorm van het harnas in plaats van zelf kanaalmedia te verzenden.

Zo blijven tekst-, image-, video-, muziek-, TTS-, goedkeurings- en messaging-tool-uitvoer op hetzelfde afleverpad als PI-backed runs.

## Huidige beperkingen

- Het publieke importpad is generiek, maar sommige typealiassen voor pogingen/resultaten dragen nog steeds `Pi`-namen voor compatibiliteit.
- Installatie van een harness van derden is experimenteel. Geef de voorkeur aan providerplugins
  totdat je een native sessieruntime nodig hebt.
- Wisselen van harness wordt tussen beurten ondersteund. Wissel niet van harness in het
  midden van een beurt nadat native tools, goedkeuringen, assistenttekst of het verzenden
  van berichten zijn gestart.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview)
- [Runtime-helpers](/nl/plugins/sdk-runtime)
- [Providerplugins](/nl/plugins/sdk-provider-plugins)
- [Codex-harness](/nl/plugins/codex-harness)
- [Modelproviders](/nl/concepts/model-providers)
