---
read_when:
    - Je wijzigt de ingebedde uitvoeringsomgeving voor agents of het harnasregister
    - Je registreert een agent-harness vanuit een gebundelde of vertrouwde Plugin
    - Je moet begrijpen hoe de Codex Plugin zich verhoudt tot modelproviders
sidebarTitle: Agent Harness
summary: Experimenteel SDK-oppervlak voor plugins die de laag-niveau ingebedde agentuitvoerder vervangen
title: Agent-harnasplugins
x-i18n:
    generated_at: "2026-05-02T11:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Een **agent-harnas** is de low-level executor voor één voorbereide OpenClaw-agentbeurt. Het is geen modelprovider, geen kanaal en geen toolregister. Zie [Agentruntimes](/nl/concepts/agent-runtimes) voor het gebruikersgerichte mentale model.

Gebruik dit oppervlak alleen voor gebundelde of vertrouwde native plugins. Het contract is nog experimenteel, omdat de parametertypen bewust de huidige ingebedde runner weerspiegelen.

## Wanneer een harnas te gebruiken

Registreer een agent-harnas wanneer een modelfamilie een eigen native sessieruntime heeft en het normale OpenClaw-providertransport de verkeerde abstractie is.

Voorbeelden:

- een native server voor coding agents die eigenaar is van threads en Compaction
- een lokale CLI of daemon die native plan-/redeneer-/tool-events moet streamen
- een modelruntime die naast het OpenClaw-sessietranscript een eigen hervattings-id nodig heeft

Registreer **geen** harnas alleen om een nieuwe LLM-API toe te voegen. Bouw voor normale HTTP- of WebSocket-model-API's een [providerplugin](/nl/plugins/sdk-provider-plugins).

## Waar core nog eigenaar van is

Voordat een harnas wordt geselecteerd, heeft OpenClaw al het volgende opgelost:

- provider en model
- runtimestatus van authenticatie
- denkniveau en contextbudget
- het OpenClaw-transcript-/sessiebestand
- werkruimte, sandbox en toolbeleid
- kanaalcallbacks voor antwoorden en streamingcallbacks
- modelterugval en beleid voor live wisselen van model

Die splitsing is opzettelijk. Een harnas voert een voorbereide poging uit; het kiest geen providers, vervangt geen kanaalbezorging en wisselt niet stilzwijgend van model.

De voorbereide poging bevat ook `params.runtimePlan`, een door OpenClaw beheerde beleidsbundel voor runtimebeslissingen die gedeeld moeten blijven tussen PI en native harnassen:

- `runtimePlan.tools.normalize(...)` en
  `runtimePlan.tools.logDiagnostics(...)` voor providerbewust toolschemabeleid
- `runtimePlan.transcript.resolvePolicy(...)` voor transcriptopschoning en
  beleid voor herstel van tool-calls
- `runtimePlan.delivery.isSilentPayload(...)` voor gedeelde onderdrukking van
  `NO_REPLY` en mediabezorgen
- `runtimePlan.outcome.classifyRunResult(...)` voor classificatie van modelterugval
- `runtimePlan.observability` voor opgeloste provider-/model-/harnasmetadata

Harnassen mogen het plan gebruiken voor beslissingen die moeten overeenkomen met PI-gedrag, maar moeten het nog steeds behandelen als pogingstatus die eigendom is van de host. Muteer het niet en gebruik het niet om binnen een beurt van provider/model te wisselen.

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

1. De vastgelegde harnas-id van een bestaande sessie wint, zodat config-/env-wijzigingen dat transcript niet hot-switchen naar een andere runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` dwingt een geregistreerd harnas met die id af voor sessies die nog niet zijn vastgepind.
3. `OPENCLAW_AGENT_RUNTIME=pi` dwingt het ingebouwde PI-harnas af.
4. `OPENCLAW_AGENT_RUNTIME=auto` vraagt geregistreerde harnassen of zij de opgeloste provider/model ondersteunen.
5. Als geen geregistreerd harnas overeenkomt, gebruikt OpenClaw PI, tenzij PI-terugval is uitgeschakeld.

Fouten van Plugin-harnassen verschijnen als runfouten. In `auto`-modus wordt PI-terugval alleen gebruikt wanneer geen geregistreerd Plugin-harnas de opgeloste provider/model ondersteunt. Zodra een Plugin-harnas een run heeft geclaimd, speelt OpenClaw diezelfde beurt niet opnieuw af via PI, omdat dat authenticatie-/runtimesemantiek kan wijzigen of side-effects kan dupliceren.

De geselecteerde harnas-id wordt na een ingebedde run samen met de sessie-id bewaard. Legacy-sessies die zijn aangemaakt vóór harnas-pins worden als PI-vastgepind behandeld zodra ze transcriptgeschiedenis hebben. Gebruik een nieuwe/geresette sessie wanneer je wisselt tussen PI en een native Plugin-harnas. `/status` toont niet-standaard harnas-id's zoals `codex` naast `Fast`; PI blijft verborgen omdat dit het standaardcompatibiliteitspad is. Als het geselecteerde harnas verrassend is, schakel dan `agents/harness`-debuglogging in en inspecteer het gestructureerde `agent harness selected`-record van de Gateway. Het bevat de geselecteerde harnas-id, selectiereden, runtime-/terugvalbeleid en, in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

De gebundelde Codex-plugin registreert `codex` als harnas-id. Core behandelt dat als een gewone Plugin-harnas-id; Codex-specifieke aliassen horen thuis in de Plugin of operatorconfiguratie, niet in de gedeelde runtimekiezer.

## Provider plus harnas koppelen

De meeste harnassen moeten ook een provider registreren. De provider maakt modelverwijzingen, authenticatiestatus, modelmetadata en `/model`-selectie zichtbaar voor de rest van OpenClaw. Het harnas claimt die provider vervolgens in `supports(...)`.

De gebundelde Codex-plugin volgt dit patroon:

- voorkeursmodelverwijzingen voor gebruikers: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- compatibiliteitsverwijzingen: legacy `codex/gpt-*`-verwijzingen blijven geaccepteerd, maar nieuwe configuraties moeten ze niet gebruiken als normale provider-/modelverwijzingen
- harnas-id: `codex`
- authenticatie: synthetische providerbeschikbaarheid, omdat het Codex-harnas eigenaar is van de native Codex-login/-sessie
- app-serververzoek: OpenClaw stuurt de kale model-id naar Codex en laat het harnas met het native app-serverprotocol praten

De Codex-plugin is additief. Gewone `openai/gpt-*`-verwijzingen blijven het normale OpenClaw-providerpad gebruiken, tenzij je het Codex-harnas afdwingt met `agentRuntime.id: "codex"`. Oudere `codex/gpt-*`-verwijzingen selecteren nog steeds de Codex-provider en het Codex-harnas voor compatibiliteit.

Zie [Codex-harnas](/nl/plugins/codex-harness) voor operatorinstelling, voorbeelden van modelprefixen en Codex-only configuraties.

OpenClaw vereist Codex app-server `0.125.0` of nieuwer. De Codex-plugin controleert de initialize-handshake van de app-server en blokkeert oudere of onversiende servers, zodat OpenClaw alleen draait tegen het protocoloppervlak waarmee het is getest. De `0.125.0`-ondergrens omvat de native MCP-hookpayloadondersteuning die in Codex `0.124.0` is geland, terwijl OpenClaw wordt vastgepind op de nieuwere geteste stabiele lijn.

### Middleware voor toolresultaten

Gebundelde plugins kunnen runtimeneutrale middleware voor toolresultaten koppelen via `api.registerAgentToolResultMiddleware(...)` wanneer hun manifest de beoogde runtime-id's declareert in `contracts.agentToolResultMiddleware`. Deze vertrouwde naad is bedoeld voor asynchrone transformaties van toolresultaten die moeten draaien voordat PI of Codex tooluitvoer terugvoert naar het model.

Legacy gebundelde plugins kunnen nog steeds `api.registerCodexAppServerExtensionFactory(...)` gebruiken voor middleware die alleen voor de Codex app-server is, maar nieuwe resultaattransformaties moeten de runtimeneutrale API gebruiken. De Pi-only `api.registerEmbeddedExtensionFactory(...)`-hook is verwijderd; Pi-toolresultaattransformaties moeten runtimeneutrale middleware gebruiken.

### Classificatie van terminale uitkomst

Native harnassen die eigenaar zijn van hun eigen protocolprojectie kunnen `classifyAgentHarnessTerminalOutcome(...)` uit `openclaw/plugin-sdk/agent-harness-runtime` gebruiken wanneer een voltooide beurt geen zichtbare assistenttekst heeft opgeleverd. De helper retourneert `empty`, `reasoning-only` of `planning-only`, zodat het terugvalbeleid van OpenClaw kan beslissen of opnieuw geprobeerd moet worden met een ander model. Hij laat promptfouten, lopende beurten en bewuste stille antwoorden zoals `NO_REPLY` opzettelijk ongeclassificeerd.

### Native Codex-harnasmodus

Het gebundelde `codex`-harnas is de native Codex-modus voor ingebedde OpenClaw-agentbeurten. Schakel eerst de gebundelde `codex`-Plugin in en neem `codex` op in `plugins.allow` als je configuratie een beperkende allowlist gebruikt. Native app-serverconfiguraties moeten `openai/gpt-*` gebruiken met `agentRuntime.id: "codex"`. Gebruik `openai-codex/*` voor Codex OAuth via PI. Legacy `codex/*`-modelverwijzingen blijven compatibiliteitsaliassen voor het native harnas.

Wanneer deze modus draait, is Codex eigenaar van de native thread-id, het hervattingsgedrag, Compaction en app-serveruitvoering. OpenClaw blijft eigenaar van het chatkanaal, de zichtbare transcriptspiegel, het toolbeleid, goedkeuringen, mediabezorgen en sessieselectie. Gebruik `agentRuntime.id: "codex"` zonder een `fallback`-override wanneer je moet bewijzen dat alleen het Codex app-serverpad de run kan claimen. Expliciete Plugin-runtimes falen standaard al gesloten. Stel `fallback: "pi"` alleen in wanneer je bewust wilt dat PI ontbrekende harnasselectie afhandelt. Fouten van de Codex app-server falen al direct in plaats van opnieuw te proberen via PI.

## PI-terugval uitschakelen

Standaard draait OpenClaw ingebedde agents met `agents.defaults.agentRuntime` ingesteld op `{ id: "auto", fallback: "pi" }`. In `auto`-modus kunnen geregistreerde Plugin-harnassen een provider/model-paar claimen. Als geen enkel overeenkomt, valt OpenClaw terug op PI.

Stel in `auto`-modus `fallback: "none"` in wanneer je wilt dat ontbrekende Plugin-harnasselectie faalt in plaats van PI te gebruiken. Expliciete Plugin-runtimes zoals `agentRuntime.id: "codex"` falen standaard al gesloten, tenzij `fallback: "pi"` is ingesteld in dezelfde configuratie- of omgevingsoverride-scope. Fouten van geselecteerde Plugin-harnassen falen altijd hard. Dit blokkeert geen expliciete `agentRuntime.id: "pi"` of `OPENCLAW_AGENT_RUNTIME=pi`.

Voor Codex-only ingebedde runs:

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

Als je wilt dat elk geregistreerd Plugin-harnas overeenkomende modellen claimt, maar nooit wilt dat OpenClaw stilzwijgend terugvalt op PI, behoud dan `runtime: "auto"` en schakel de terugval uit:

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

Met terugval uitgeschakeld faalt een sessie vroeg wanneer het gevraagde harnas niet is geregistreerd, de opgeloste provider/model niet ondersteunt of faalt voordat er side-effects van de beurt worden geproduceerd. Dat is opzettelijk voor Codex-only implementaties en voor live tests die moeten bewijzen dat het Codex app-serverpad daadwerkelijk in gebruik is.

Deze instelling beheert alleen het ingebedde agent-harnas. Ze schakelt image, video, music, TTS, PDF of andere providerspecifieke modelroutering niet uit.

## Native sessies en transcriptspiegel

Een harnas kan een native sessie-id, thread-id of resume-token aan daemonzijde bewaren. Houd die binding expliciet gekoppeld aan de OpenClaw-sessie en blijf gebruikerszichtbare assistent-/tooluitvoer spiegelen naar het OpenClaw-transcript.

Het OpenClaw-transcript blijft de compatibiliteitslaag voor:

- kanaalzichtbare sessiegeschiedenis
- transcriptzoeken en indexeren
- terugschakelen naar het ingebouwde PI-harnas in een latere beurt
- generiek `/new`-, `/reset`- en sessieverwijderingsgedrag

Als je harnas een sidecarbinding opslaat, implementeer dan `reset(...)` zodat OpenClaw die kan wissen wanneer de eigen OpenClaw-sessie wordt gereset.

## Tool- en mediaresultaten

Core stelt de lijst met OpenClaw-tools samen en geeft die door aan de voorbereide poging.
Wanneer een harness een dynamische toolaanroep uitvoert, geef je het toolresultaat terug via
de resultaatvorm van de harness in plaats van zelf kanaalmedia te verzenden.

Dit houdt tekst-, afbeeldings-, video-, muziek-, TTS-, goedkeurings- en messaging-tool-uitvoer
op hetzelfde afleverpad als door Pi ondersteunde runs.

## Huidige beperkingen

- Het openbare importpad is generiek, maar sommige poging-/resultaattype-aliassen dragen nog steeds
  `Pi`-namen voor compatibiliteit.
- Installatie van harnesses van derden is experimenteel. Geef de voorkeur aan provider-Plugins
  totdat je een native sessieruntime nodig hebt.
- Wisselen van harness wordt ondersteund tussen beurten. Wissel niet van harness
  midden in een beurt nadat native tools, goedkeuringen, assistenttekst of berichtverzendingen
  zijn gestart.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview)
- [Runtime-helpers](/nl/plugins/sdk-runtime)
- [Provider-Plugins](/nl/plugins/sdk-provider-plugins)
- [Codex-harness](/nl/plugins/codex-harness)
- [Modelproviders](/nl/concepts/model-providers)
