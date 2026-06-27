---
read_when:
    - Je kiest tussen OpenClaw, Codex, ACP of een andere native agentruntime
    - Je raakt in de war door provider-/model-/runtimelabels in status of config
    - Je documenteert ondersteuningspariteit voor een systeemeigen harnas
summary: Hoe OpenClaw modelproviders, modellen, kanalen en agent-runtimes scheidt
title: Agent-runtimes
x-i18n:
    generated_at: "2026-06-27T17:24:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Een **agentruntime** is het component dat eigenaar is van één voorbereide modellus: het
ontvangt de prompt, stuurt modeluitvoer aan, verwerkt native tool-aanroepen en geeft
de afgeronde beurt terug aan OpenClaw.

Runtimes zijn gemakkelijk te verwarren met providers, omdat beide dicht bij de
modelconfiguratie verschijnen. Het zijn verschillende lagen:

| Laag          | Voorbeelden                                  | Wat het betekent                                                   |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| Provider      | `openai`, `anthropic`, `github-copilot`      | Hoe OpenClaw authenticeert, modellen ontdekt en modelverwijzingen benoemt. |
| Model         | `gpt-5.5`, `claude-opus-4-6`                 | Het model dat voor de agentbeurt is geselecteerd.                  |
| Agentruntime  | `openclaw`, `codex`, `copilot`, `claude-cli` | De laag-niveau lus of backend die de voorbereide beurt uitvoert.   |
| Kanaal        | Telegram, Discord, Slack, WhatsApp           | Waar berichten OpenClaw binnenkomen en verlaten.                   |

Je ziet in code ook het woord **harness**. Een harness is de implementatie
die een agentruntime levert. De gebundelde Codex-harness implementeert
bijvoorbeeld de `codex`-runtime. Publieke configuratie gebruikt `agentRuntime.id` op
provider- of modelvermeldingen; runtime-sleutels voor hele agents zijn legacy en worden genegeerd.
`openclaw doctor --fix` verwijdert oude runtime-pins voor hele agents en herschrijft
legacy runtime-modelverwijzingen naar canonieke provider/model-verwijzingen plus modelgebonden
runtimebeleid waar dat nodig is.

Er zijn twee runtimefamilies:

- **Ingebedde harnesses** draaien binnen de voorbereide agentlus van OpenClaw. Vandaag is dit
  de ingebouwde `openclaw`-runtime plus geregistreerde plugin-harnesses zoals
  `codex` en `copilot`.
- **CLI-backends** draaien een lokaal CLI-proces terwijl de modelverwijzing
  canoniek blijft. Bijvoorbeeld `anthropic/claude-opus-4-8` met
  een modelgebonden `agentRuntime.id: "claude-cli"` betekent "selecteer het Anthropic
  model, voer uit via Claude CLI." `claude-cli` is geen ingebedde harness-id
  en mag niet worden doorgegeven aan AgentHarness-selectie.

De `copilot`-harness is een afzonderlijke, opt-in externe plugin-harness voor de
GitHub Copilot CLI; zie [GitHub Copilot-agentruntime](/nl/plugins/copilot)
voor de gebruikersgerichte keuze tussen PI, Codex en GitHub Copilot-agentruntime.

## Codex-oppervlakken

De meeste verwarring komt doordat verschillende oppervlakken de naam Codex delen:

| Oppervlak                                       | OpenClaw-naam/configuratie          | Wat het doet                                                                                                  |
| ------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Native Codex app-server-runtime                  | `openai/*`-modelverwijzingen         | Draait OpenAI-ingebedde agentbeurten via Codex app-server. Dit is de gebruikelijke ChatGPT/Codex-abonnementsconfiguratie. |
| Codex OAuth-authprofielen                        | `openai` OAuth-profielen             | Slaat ChatGPT/Codex-abonnementsauthenticatie op die de Codex app-server-harness gebruikt.                    |
| Codex ACP-adapter                                | `runtime: "acp"`, `agentId: "codex"` | Draait Codex via het externe ACP/acpx-besturingsvlak. Gebruik dit alleen wanneer expliciet om ACP/acpx wordt gevraagd. |
| Native Codex chat-besturingscommandoset          | `/codex ...`                         | Koppelt, hervat, stuurt, stopt en inspecteert Codex app-server-threads vanuit chat.                          |
| OpenAI Platform API-route voor niet-agentoppervlakken | `openai/*` plus API-sleutel-auth     | Gebruikt voor directe OpenAI-API's zoals afbeeldingen, embeddings, spraak en realtime.                       |

Die oppervlakken zijn bewust onafhankelijk. Het inschakelen van de `codex`-plugin maakt
de native app-serverfuncties beschikbaar; `openclaw doctor --fix` is eigenaar van legacy
legacy Codex-routereparatie en het opruimen van verouderde sessiepins. Het selecteren van
`openai/*` voor een agentmodel betekent nu "draai dit via Codex", tenzij een
niet-agent OpenAI API-oppervlak wordt gebruikt.

De gebruikelijke ChatGPT/Codex-abonnementsconfiguratie gebruikt Codex OAuth voor authenticatie, maar houdt
de modelverwijzing op `openai/*` en selecteert de `codex`-runtime:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Dat betekent dat OpenClaw een OpenAI-modelverwijzing selecteert en daarna de Codex app-server-
runtime vraagt om de ingebedde agentbeurt uit te voeren. Het betekent niet "gebruik API-facturering" en
het betekent niet dat het kanaal, de modelprovidercatalogus of de OpenClaw-sessieopslag
Codex wordt.

Wanneer de gebundelde `codex`-plugin is ingeschakeld, moet natuurlijke-taalbesturing van Codex
het native `/codex`-commando-oppervlak (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) gebruiken in plaats van ACP. Gebruik ACP voor
Codex alleen wanneer de gebruiker expliciet om ACP/acpx vraagt of het ACP-
adapterpad test. Claude Code, Gemini CLI, OpenCode, Cursor en vergelijkbare externe
harnesses gebruiken nog steeds ACP.

Dit is de beslisboom voor agents:

1. Als de gebruiker vraagt om **Codex koppelen/besturen/thread/hervatten/sturen/stoppen**, gebruik dan het
   native `/codex`-commando-oppervlak wanneer de gebundelde `codex`-plugin is ingeschakeld.
2. Als de gebruiker vraagt om **Codex als de ingebedde runtime** of de normale
   abonnementsgebaseerde Codex-agentervaring wil, gebruik dan `openai/<model>`.
3. Als de gebruiker expliciet **OpenClaw voor een OpenAI-model** kiest, houd de modelverwijzing
   op `openai/<model>` en stel provider/model-runtimebeleid in op
   `agentRuntime.id: "openclaw"`. Een geselecteerd `openai` OAuth-profiel wordt
   intern gerouteerd via OpenClaw's Codex-auth-transport.
4. Als legacy-configuratie nog **legacy Codex-modelverwijzingen** bevat, repareer die dan naar
   `openai/<model>` met `openclaw doctor --fix`; doctor behoudt de Codex-auth-
   route door provider/modelgebonden `agentRuntime.id: "codex"` toe te voegen waar de
   oude modelverwijzing dat impliceerde.
   Legacy **`codex-cli/*`-modelverwijzingen** worden gerepareerd naar dezelfde `openai/<model>` Codex
   app-server-route; OpenClaw behoudt niet langer een gebundelde Codex CLI-backend.
5. Als de gebruiker expliciet **ACP**, **acpx** of **Codex ACP-adapter** zegt, gebruik dan
   ACP met `runtime: "acp"` en `agentId: "codex"`.
6. Als het verzoek gaat over **Claude Code, Gemini CLI, OpenCode, Cursor, Droid of
   een andere externe harness**, gebruik dan ACP/acpx, niet de native subagentruntime.

| Je bedoelt...                          | Gebruik...                                  |
| -------------------------------------- | ------------------------------------------- |
| Codex app-server chat-/threadbesturing | `/codex ...` vanuit de gebundelde `codex`-plugin |
| Codex app-server ingebedde agentruntime | `openai/*`-agentmodelverwijzingen           |
| OpenAI Codex OAuth                     | `openai` OAuth-profielen                    |
| Claude Code of andere externe harness  | ACP/acpx                                    |

Zie voor de splitsing van OpenAI-familieprefixen [OpenAI](/nl/providers/openai) en
[Modelproviders](/nl/concepts/model-providers). Zie voor het ondersteuningscontract van de Codex-runtime
[Codex harness-runtime](/nl/plugins/codex-harness-runtime#v1-support-contract).

## Runtime-eigenaarschap

Verschillende runtimes zijn eigenaar van verschillende delen van de lus.

| Oppervlak                  | OpenClaw ingebed                              | Codex app-server                                                           |
| -------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| Eigenaar van modellus      | OpenClaw via de OpenClaw ingebedde runner     | Codex app-server                                                           |
| Canonieke threadstatus     | OpenClaw-transcript                           | Codex-thread, plus OpenClaw-transcriptspiegel                              |
| Dynamische OpenClaw-tools  | Native OpenClaw-toollus                       | Overbrugd via de Codex-adapter                                             |
| Native shell- en bestandstools | OpenClaw-pad                              | Codex-native tools, overbrugd via native hooks waar ondersteund            |
| Contextengine              | Native OpenClaw-contextsamenstelling          | OpenClaw-projecten stellen context samen in de Codex-beurt                 |
| Compaction                 | OpenClaw of geselecteerde contextengine       | Codex-native Compaction, met OpenClaw-meldingen en spiegelonderhoud        |
| Kanaallevering             | OpenClaw                                      | OpenClaw                                                                   |

Deze eigendomssplitsing is de belangrijkste ontwerpregel:

- Als OpenClaw eigenaar is van het oppervlak, kan OpenClaw normaal plugin-hookgedrag leveren.
- Als de native runtime eigenaar is van het oppervlak, heeft OpenClaw runtime-events of native hooks nodig.
- Als de native runtime eigenaar is van de canonieke threadstatus, moet OpenClaw context spiegelen en projecteren, niet niet-ondersteunde internals herschrijven.

## Runtimeselectie

OpenClaw kiest een ingebedde runtime na provider- en modelresolutie:

1. Modelgebonden runtimebeleid wint. Dit kan staan in een geconfigureerde provider-
   modelvermelding of in `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`. Een provider-wildcard
   zoals `agents.defaults.models["vllm/*"].agentRuntime` wordt toegepast na exact
   modelbeleid, zodat dynamisch ontdekte providermodellen één
   runtime kunnen delen zonder exacte uitzonderingen per model te overschrijven.
2. Providergebonden runtimebeleid komt daarna op
   `models.providers.<provider>.agentRuntime`.
3. In `auto`-modus kunnen geregistreerde plugin-runtimes ondersteunde provider/model-
   paren claimen.
4. Als geen runtime een beurt claimt in `auto`-modus, gebruikt OpenClaw `openclaw` als de
   compatibiliteitsruntime. Gebruik een expliciete runtime-id wanneer de run
   strikt moet zijn.

Runtime-pins voor hele sessies en hele agents worden genegeerd. Dat omvat
`OPENCLAW_AGENT_RUNTIME`, sessiestatus `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` en `agents.list[].agentRuntime`. Voer
`openclaw doctor --fix` uit om verouderde runtimeconfiguratie voor hele agents te verwijderen en
legacy runtime-modelverwijzingen om te zetten waar OpenClaw de bedoeling kan behouden.

Expliciete provider/model-pluginruntimes falen gesloten. Bijvoorbeeld
`agentRuntime.id: "codex"` op een provider of model betekent Codex of een duidelijke
selectie-/runtimefout; het wordt nooit stilzwijgend teruggerouteerd naar OpenClaw.

CLI-backendaliassen verschillen van ingebedde harness-id's. De aanbevolen
Claude CLI-vorm is:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Legacy-verwijzingen zoals `claude-cli/claude-opus-4-7` blijven ondersteund voor
compatibiliteit, maar nieuwe configuratie moet de provider/het model canoniek houden en
de uitvoeringsbackend in provider/model-runtimebeleid plaatsen.

Legacy `codex-cli/*`-verwijzingen zijn anders: doctor migreert ze naar `openai/*` zodat
ze via de Codex app-server-harness draaien in plaats van een Codex CLI-
backend te behouden.

`auto`-modus is bewust conservatief voor de meeste providers. OpenAI-agent-
modellen zijn de uitzondering: niet-ingestelde runtime en `auto` lossen beide op naar de Codex-
harness. Expliciete OpenClaw-runtimeconfiguratie blijft een opt-in compatibiliteitsroute voor
`openai/*`-agentbeurten; wanneer deze wordt gecombineerd met een geselecteerd `openai` OAuth-profiel,
routeert OpenClaw dat pad intern via het Codex-auth-transport terwijl
de publieke modelverwijzing `openai/*` blijft. Verouderde OpenAI-runtime-sessiepins worden
genegeerd door runtimeselectie en kunnen worden opgeschoond met `openclaw doctor --fix`.

Als `openclaw doctor` waarschuwt dat de `codex` Plugin is ingeschakeld terwijl
verouderde Codex-modelverwijzingen in de configuratie blijven staan, behandel dat dan als verouderde routeringsstatus. Voer
`openclaw doctor --fix` uit om dit te herschrijven naar `openai/*` met de Codex-runtime.

## GitHub Copilot-agentruntime

De externe `@openclaw/copilot` Plugin registreert een opt-in `copilot`-runtime
die wordt ondersteund door de GitHub Copilot CLI (`@github/copilot-sdk`). Deze claimt de
canonieke abonnementsprovider `github-copilot` en wordt **nooit** geselecteerd door
`auto`. Meld je per model of per provider aan via `agentRuntime.id`:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Het harnas claimt zijn provider, runtime, CLI-sessiesleutel en authenticatieprofiel-
voorvoegsel in `extensions/copilot/doctor-contract-api.ts`, dat
`openclaw doctor` automatisch laadt. Zie voor configuratie, authenticatie, transcriptspiegeling,
Compaction, het declaratieve doctor-contract en de bredere PI versus Codex versus
Copilot SDK-beslissing [GitHub Copilot-agentruntime](/nl/plugins/copilot).

## Compatibiliteitscontract

Wanneer een runtime geen OpenClaw is, moet deze documenteren welke OpenClaw-oppervlakken worden ondersteund.
Gebruik deze vorm voor runtime-documentatie:

| Vraag                                  | Waarom dit belangrijk is                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Wie is eigenaar van de modellus?       | Bepaalt waar retries, toolvoortzetting en beslissingen over het eindantwoord plaatsvinden.        |
| Wie is eigenaar van de canonieke threadgeschiedenis? | Bepaalt of OpenClaw de geschiedenis kan bewerken of deze alleen kan spiegelen.                    |
| Werken dynamische OpenClaw-tools?      | Messaging, sessies, Cron en tools die OpenClaw beheert, zijn hiervan afhankelijk.                 |
| Werken dynamische toolhooks?           | Plugins verwachten `before_tool_call`, `after_tool_call` en middleware rond tools die OpenClaw beheert. |
| Werken native toolhooks?               | Shell, patch en tools die door de runtime worden beheerd, hebben native hookondersteuning nodig voor beleid en observatie. |
| Draait de levenscyclus van de contextengine? | Memory- en context-Plugins zijn afhankelijk van de levenscyclus voor assemble, ingest, after-turn en Compaction. |
| Welke Compaction-gegevens worden blootgesteld? | Sommige Plugins hebben alleen meldingen nodig, terwijl andere bewaarde/verwijderde metadata nodig hebben. |
| Wat wordt bewust niet ondersteund?     | Gebruikers mogen geen OpenClaw-equivalentie aannemen waar de native runtime meer status beheert.  |

Het ondersteuningscontract van de Codex-runtime is gedocumenteerd in
[Codex-harnasruntime](/nl/plugins/codex-harness-runtime#v1-support-contract).

## Statuslabels

Statusuitvoer kan zowel `Execution`- als `Runtime`-labels tonen. Lees ze als
diagnostiek, niet als providernamen.

- Een modelverwijzing zoals `openai/gpt-5.5` vertelt je de geselecteerde provider/het geselecteerde model.
- Een runtime-id zoals `codex` vertelt je welke lus de beurt uitvoert.
- Een kanaallabel zoals Telegram of Discord vertelt je waar het gesprek plaatsvindt.

Als een run nog steeds een onverwachte runtime toont, inspecteer dan eerst het runtimebeleid
van de geselecteerde provider/het geselecteerde model. Verouderde sessieruntime-pins bepalen de routering niet meer.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [Codex-harnasruntime](/nl/plugins/codex-harness-runtime)
- [GitHub Copilot-agentruntime](/nl/plugins/copilot)
- [OpenAI](/nl/providers/openai)
- [Agent-harnas-Plugins](/nl/plugins/sdk-agent-harness)
- [Agentlus](/nl/concepts/agent-loop)
- [Modellen](/nl/concepts/models)
- [Status](/nl/cli/status)
