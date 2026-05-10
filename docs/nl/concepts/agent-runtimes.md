---
read_when:
    - Je kiest tussen PI, Codex, ACP of een andere native agentruntime
    - Je raakt in de war door provider-/model-/runtimelabels in status of configuratie
    - U documenteert ondersteuningspariteit voor een systeemeigen testharnas
summary: Hoe OpenClaw modelaanbieders, modellen, kanalen en uitvoeringsomgevingen voor agenten van elkaar scheidt
title: Uitvoeringsomgevingen voor agents
x-i18n:
    generated_at: "2026-05-10T19:31:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Een **agent-runtime** is de component die eigenaar is van één voorbereide modellus: deze
ontvangt de prompt, stuurt modeluitvoer aan, verwerkt native tool-calls en retourneert
de voltooide beurt naar OpenClaw.

Runtimes worden gemakkelijk verward met providers, omdat beide in de buurt van
modelconfiguratie verschijnen. Het zijn verschillende lagen:

| Laag          | Voorbeelden                           | Wat het betekent                                                   |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Provider      | `openai`, `anthropic`, `openai-codex` | Hoe OpenClaw authenticeert, modellen ontdekt en modelrefs benoemt. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Het model dat is geselecteerd voor de agent-beurt.                 |
| Agent-runtime | `pi`, `codex`, `claude-cli`           | De low-level lus of backend die de voorbereide beurt uitvoert.     |
| Kanaal        | Telegram, Discord, Slack, WhatsApp    | Waar berichten OpenClaw binnenkomen en verlaten.                   |

Je ziet in code ook het woord **harness**. Een harness is de implementatie
die een agent-runtime levert. De gebundelde Codex-harness implementeert
bijvoorbeeld de runtime `codex`. Publieke configuratie gebruikt `agentRuntime.id` op
provider- of modelitems; runtime-sleutels voor hele agents zijn legacy en worden genegeerd.
`openclaw doctor --fix` verwijdert oude runtime-pins voor hele agents en herschrijft
legacy runtime-modelrefs naar canonieke provider/model-refs plus modelgebonden
runtimebeleid waar nodig.

Er zijn twee runtime-families:

- **Ingebedde harnesses** draaien binnen OpenClaws voorbereide agent-lus. Vandaag is dit
  de ingebouwde runtime `pi` plus geregistreerde Plugin-harnesses zoals
  `codex`.
- **CLI-backends** draaien een lokaal CLI-proces terwijl de modelref
  canoniek blijft. Bijvoorbeeld: `anthropic/claude-opus-4-7` met
  een modelgebonden `agentRuntime.id: "claude-cli"` betekent: "selecteer het Anthropic-
  model, voer uit via Claude CLI." `claude-cli` is geen ingebedde harness-id
  en mag niet worden doorgegeven aan AgentHarness-selectie.

## Codex-oppervlakken

De meeste verwarring komt doordat meerdere verschillende oppervlakken de naam Codex delen:

| Oppervlak                                       | OpenClaw-naam/configuratie             | Wat het doet                                                                                                   |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Native Codex app-server-runtime                  | `openai/*` modelrefs                | Draait OpenAI-ingebedde agent-beurten via Codex app-server. Dit is de gebruikelijke ChatGPT/Codex-abonnementssetup. |
| Codex OAuth-auth-profielen                        | `openai-codex` auth-provider         | Slaat ChatGPT/Codex-abonnementsauth op die de Codex app-server-harness gebruikt.                               |
| Codex ACP-adapter                                | `runtime: "acp"`, `agentId: "codex"` | Draait Codex via het externe ACP/acpx-besturingsvlak. Gebruik dit alleen wanneer expliciet om ACP/acpx wordt gevraagd. |
| Native Codex chat-control commandoset            | `/codex ...`                         | Koppelt, hervat, stuurt, stopt en inspecteert Codex app-server-threads vanuit chat.                            |
| OpenAI Platform API-route voor niet-agent-oppervlakken | `openai/*` plus API-key-auth         | Gebruikt voor directe OpenAI-API's zoals afbeeldingen, embeddings, spraak en realtime.                         |

Die oppervlakken zijn bewust onafhankelijk. Het inschakelen van de Plugin `codex` maakt
de native app-server-functies beschikbaar; `openclaw doctor --fix` is eigenaar van legacy
`openai-codex/*` routereparatie en opruiming van verouderde sessie-pins. Het selecteren van
`openai/*` voor een agent-model betekent nu "draai dit via Codex", tenzij een
niet-agent OpenAI API-oppervlak wordt gebruikt.

De gebruikelijke ChatGPT/Codex-abonnementssetup gebruikt Codex OAuth voor auth, maar houdt
de modelref op `openai/*` en selecteert de runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Dat betekent dat OpenClaw een OpenAI-modelref selecteert en vervolgens de Codex app-server-
runtime vraagt om de ingebedde agent-beurt uit te voeren. Het betekent niet "gebruik API-facturering",
en het betekent niet dat het kanaal, de modelprovider-catalogus of OpenClaws sessieopslag
Codex wordt.

Wanneer de gebundelde Plugin `codex` is ingeschakeld, moet natuurlijke-taalbesturing voor Codex
het native `/codex` commando-oppervlak gebruiken (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) in plaats van ACP. Gebruik ACP voor
Codex alleen wanneer de gebruiker expliciet om ACP/acpx vraagt of het ACP-
adapterpad test. Claude Code, Gemini CLI, OpenCode, Cursor en vergelijkbare externe
harnesses gebruiken nog steeds ACP.

Dit is de beslisboom voor agents:

1. Als de gebruiker vraagt om **Codex bind/control/thread/resume/steer/stop**, gebruik dan het
   native `/codex` commando-oppervlak wanneer de gebundelde Plugin `codex` is ingeschakeld.
2. Als de gebruiker vraagt om **Codex als de ingebedde runtime** of de normale
   abonnementsgebaseerde Codex-agentervaring wil, gebruik dan `openai/<model>`.
3. Als de gebruiker expliciet **PI voor een OpenAI-model** kiest, behoud dan de modelref
   als `openai/<model>` en stel provider/model-runtimebeleid in op
   `agentRuntime.id: "pi"`. Een geselecteerd `openai-codex` auth-profiel wordt
   intern gerouteerd via PI's legacy Codex-auth-transport.
4. Als legacy-configuratie nog steeds **`openai-codex/*` modelrefs** bevat, repareer dit dan naar
   `openai/<model>` met `openclaw doctor --fix`; doctor behoudt de Codex-auth-
   route door provider/modelgebonden `agentRuntime.id: "codex"` toe te voegen waar de
   oude modelref dat impliceerde.
5. Als de gebruiker expliciet **ACP**, **acpx** of **Codex ACP-adapter** zegt, gebruik dan
   ACP met `runtime: "acp"` en `agentId: "codex"`.
6. Als het verzoek gaat om **Claude Code, Gemini CLI, OpenCode, Cursor, Droid of
   een andere externe harness**, gebruik dan ACP/acpx, niet de native sub-agent-runtime.

| Je bedoelt...                         | Gebruik...                                   |
| ------------------------------------- | -------------------------------------------- |
| Codex app-server chat/thread-control  | `/codex ...` vanuit de gebundelde Plugin `codex` |
| Codex app-server ingebedde agent-runtime | `openai/*` agent-modelrefs                  |
| OpenAI Codex OAuth                    | `openai-codex` auth-profielen                |
| Claude Code of andere externe harness | ACP/acpx                                     |

Voor de OpenAI-familieprefix-splitsing, zie [OpenAI](/nl/providers/openai) en
[Modelproviders](/nl/concepts/model-providers). Voor het ondersteuningscontract van de Codex-runtime,
zie [Codex harness-runtime](/plugins/codex-harness-runtime#v1-support-contract).

## Runtime-eigendom

Verschillende runtimes zijn eigenaar van verschillende delen van de lus.

| Oppervlak                  | OpenClaw PI ingebed                      | Codex app-server                                                            |
| -------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Eigenaar van modellus      | OpenClaw via de PI ingebedde runner      | Codex app-server                                                            |
| Canonieke threadstatus     | OpenClaw-transcript                      | Codex-thread, plus OpenClaw-transcriptspiegel                               |
| Dynamische OpenClaw-tools  | Native OpenClaw-toollus                  | Overbrugd via de Codex-adapter                                              |
| Native shell- en bestandstools | PI/OpenClaw-pad                      | Codex-native tools, overbrugd via native hooks waar ondersteund             |
| Context-engine             | Native OpenClaw-contextassemblage        | OpenClaw-projecten assembleren context in de Codex-beurt                    |
| Compaction                 | OpenClaw of geselecteerde context-engine | Codex-native Compaction, met OpenClaw-meldingen en spiegelonderhoud         |
| Kanaalbezorging            | OpenClaw                                 | OpenClaw                                                                    |

Deze eigendomsverdeling is de belangrijkste ontwerpregel:

- Als OpenClaw eigenaar is van het oppervlak, kan OpenClaw normaal Plugin-hookgedrag leveren.
- Als de native runtime eigenaar is van het oppervlak, heeft OpenClaw runtime-events of native hooks nodig.
- Als de native runtime eigenaar is van canonieke threadstatus, moet OpenClaw context spiegelen en projecteren, niet niet-ondersteunde internals herschrijven.

## Runtime-selectie

OpenClaw kiest een ingebedde runtime na provider- en modelresolutie:

1. Modelgebonden runtimebeleid wint. Dit kan staan in een geconfigureerd provider-
   modelitem of in `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`.
2. Providergebonden runtimebeleid komt daarna op
   `models.providers.<provider>.agentRuntime`.
3. In de modus `auto` kunnen geregistreerde Plugin-runtimes ondersteunde provider/model-
   combinaties claimen.
4. Als geen runtime een beurt claimt in de modus `auto`, gebruikt OpenClaw PI als de
   compatibiliteitsruntime. Gebruik een expliciete runtime-id wanneer de run
   strikt moet zijn.

Runtime-pins voor hele sessies en hele agents worden genegeerd. Dat omvat
`OPENCLAW_AGENT_RUNTIME`, sessiestatus `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` en `agents.list[].agentRuntime`. Voer
`openclaw doctor --fix` uit om verouderde runtimeconfiguratie voor hele agents te verwijderen en
legacy runtime-modelrefs te converteren waar OpenClaw de intentie kan behouden.

Expliciete provider/model-Plugin-runtimes falen gesloten. Bijvoorbeeld:
`agentRuntime.id: "codex"` op een provider of model betekent Codex of een duidelijke
selectie/runtime-fout; het wordt nooit stilzwijgend teruggerouteerd naar PI.

CLI-backendaliassen verschillen van ingebedde harness-id's. De aanbevolen
Claude CLI-vorm is:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Legacy refs zoals `claude-cli/claude-opus-4-7` blijven ondersteund voor
compatibiliteit, maar nieuwe configuratie moet de provider/model canoniek houden en
de uitvoeringsbackend in provider/model-runtimebeleid plaatsen.

De modus `auto` is bewust conservatief voor de meeste providers. OpenAI-agent-
modellen vormen de uitzondering: niet-ingestelde runtime en `auto` worden beide opgelost naar de Codex-
harness. Expliciete PI-runtimeconfiguratie blijft een opt-in compatibiliteitsroute voor
`openai/*` agent-beurten; wanneer gekoppeld aan een geselecteerd `openai-codex` auth-profiel,
routeert OpenClaw PI intern via het legacy Codex-auth-transport terwijl
de publieke modelref `openai/*` blijft. Verouderde OpenAI PI-sessiepins worden
genegeerd door runtime-selectie en kunnen worden opgeschoond met `openclaw doctor --fix`.

Als `openclaw doctor` waarschuwt dat de Plugin `codex` is ingeschakeld terwijl
`openai-codex/*` in de configuratie blijft staan, behandel dat dan als legacy routestatus. Voer
`openclaw doctor --fix` uit om dit te herschrijven naar `openai/*` met de Codex-runtime.

## Compatibiliteitscontract

Wanneer een runtime niet PI is, moet deze documenteren welke OpenClaw-oppervlakken hij ondersteunt.
Gebruik deze vorm voor runtime-documentatie:

| Vraag                                  | Waarom dit belangrijk is                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Wie beheert de modellus?               | Bepaalt waar herhalingen, toolvoortzetting en beslissingen over het definitieve antwoord plaatsvinden. |
| Wie beheert de canonieke threadgeschiedenis? | Bepaalt of OpenClaw de geschiedenis kan bewerken of deze alleen kan spiegelen.                    |
| Werken dynamische tools van OpenClaw?  | Berichten, sessies, cron en tools die eigendom zijn van OpenClaw zijn hiervan afhankelijk.        |
| Werken dynamische toolhooks?           | Plugins verwachten `before_tool_call`, `after_tool_call` en middleware rond tools die eigendom zijn van OpenClaw. |
| Werken native toolhooks?               | Shell, patch en tools die eigendom zijn van de runtime hebben native hookondersteuning nodig voor beleid en observatie. |
| Draait de levenscyclus van de context-engine? | Geheugen- en contextplugins zijn afhankelijk van de levenscyclus voor assemble, ingest, after-turn en compaction. |
| Welke compaction-gegevens worden blootgesteld? | Sommige plugins hebben alleen meldingen nodig, terwijl andere metadata over behouden/verwijderde items nodig hebben. |
| Wat wordt bewust niet ondersteund?     | Gebruikers mogen geen PI-equivalentie aannemen wanneer de native runtime meer status beheert.     |

Het ondersteuningscontract voor de Codex-runtime is gedocumenteerd in
[Codex-harnessruntime](/plugins/codex-harness-runtime#v1-support-contract).

## Statuslabels

Statusuitvoer kan zowel `Execution`- als `Runtime`-labels tonen. Lees deze als
diagnostiek, niet als providernamen.

- Een modelreferentie zoals `openai/gpt-5.5` vertelt u de geselecteerde provider/het geselecteerde model.
- Een runtime-id zoals `codex` vertelt u welke lus de beurt uitvoert.
- Een kanaallabel zoals Telegram of Discord vertelt u waar het gesprek plaatsvindt.

Als een run nog steeds een onverwachte runtime toont, inspecteer dan eerst het
runtimebeleid van de geselecteerde provider/het geselecteerde model. Verouderde sessie-runtimepins bepalen de routering niet langer.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessruntime](/plugins/codex-harness-runtime)
- [OpenAI](/nl/providers/openai)
- [Agent-harnessplugins](/nl/plugins/sdk-agent-harness)
- [Agentlus](/nl/concepts/agent-loop)
- [Modellen](/nl/concepts/models)
- [Status](/nl/cli/status)
