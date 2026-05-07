---
read_when:
    - Je kiest tussen PI, Codex, ACP of een andere native agent-runtime
    - Je raakt verward door provider-/model-/runtimelabels in status of configuratie
    - Je documenteert ondersteuningspariteit voor een systeemeigen testharnas
summary: Hoe OpenClaw modelaanbieders, modellen, kanalen en agentruntimes scheidt
title: Agentruntimes
x-i18n:
    generated_at: "2026-05-07T13:15:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Een **agentruntime** is het onderdeel dat eigenaar is van een voorbereide modellus: het ontvangt de prompt, stuurt modeluitvoer aan, verwerkt native toolaanroepen en retourneert de voltooide beurt aan OpenClaw.

Runtimes worden gemakkelijk verward met providers, omdat beide in de buurt van modelconfiguratie verschijnen. Het zijn verschillende lagen:

| Laag          | Voorbeelden                           | Wat het betekent                                                   |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Provider      | `openai`, `anthropic`, `openai-codex` | Hoe OpenClaw authenticeert, modellen ontdekt en modelrefs benoemt. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Het model dat voor de agentbeurt is geselecteerd.                  |
| Agentruntime  | `pi`, `codex`, `claude-cli`           | De laag-niveau lus of backend die de voorbereide beurt uitvoert.   |
| Kanaal        | Telegram, Discord, Slack, WhatsApp    | Waar berichten OpenClaw binnenkomen en verlaten.                   |

Je ziet in code ook het woord **harness**. Een harness is de implementatie die een agentruntime levert. De meegeleverde Codex-harness implementeert bijvoorbeeld de `codex`-runtime. Publieke configuratie gebruikt `agentRuntime.id`; `openclaw doctor --fix` herschrijft oudere runtime-policy-sleutels naar die vorm.

Er zijn twee runtimefamilies:

- **Ingebedde harnesses** draaien binnen de voorbereide agentlus van OpenClaw. Tegenwoordig is dit de ingebouwde `pi`-runtime plus geregistreerde plugin-harnesses zoals `codex`.
- **CLI-backends** voeren een lokaal CLI-proces uit terwijl de modelref canoniek blijft. Bijvoorbeeld: `anthropic/claude-opus-4-7` met `agentRuntime.id: "claude-cli"` betekent "selecteer het Anthropic-model, voer uit via Claude CLI." `claude-cli` is geen ingebedde harness-id en mag niet worden doorgegeven aan AgentHarness-selectie.

## Codex-oppervlakken

De meeste verwarring komt doordat verschillende oppervlakken de naam Codex delen:

| Oppervlak                                           | OpenClaw-naam/configuratie          | Wat het doet                                                                                                     |
| --------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Native Codex app-server-runtime                     | `openai/*`-modelrefs                | Voert ingebedde OpenAI-agentbeurten uit via Codex app-server. Dit is de gebruikelijke ChatGPT/Codex-abonnementsopzet. |
| Codex OAuth-authprofielen                           | `openai-codex`-authprovider         | Slaat ChatGPT/Codex-abonnementsauth op die de Codex app-server-harness gebruikt.                                 |
| Codex ACP-adapter                                   | `runtime: "acp"`, `agentId: "codex"` | Voert Codex uit via het externe ACP/acpx-besturingsvlak. Gebruik dit alleen wanneer expliciet om ACP/acpx wordt gevraagd. |
| Native Codex chatbesturingscommandoset              | `/codex ...`                        | Koppelt, hervat, stuurt, stopt en inspecteert Codex app-server-threads vanuit chat.                              |
| OpenAI Platform API-route voor niet-agentoppervlakken | `openai/*` plus API-sleutel-auth    | Gebruikt voor directe OpenAI-API's zoals afbeeldingen, embeddings, spraak en realtime.                           |

Deze oppervlakken zijn bewust onafhankelijk. Het inschakelen van de `codex`-plugin maakt de native app-serverfuncties beschikbaar; `openclaw doctor --fix` is eigenaar van legacy `openai-codex/*`-routereparatie en opruiming van verouderde sessiepins. Het selecteren van `openai/*` voor een agentmodel betekent nu "voer dit uit via Codex", tenzij een niet-agent OpenAI API-oppervlak wordt gebruikt.

De gebruikelijke ChatGPT/Codex-abonnementsopzet gebruikt Codex OAuth voor auth, maar houdt de modelref als `openai/*` en selecteert de `codex`-runtime:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Dat betekent dat OpenClaw een OpenAI-modelref selecteert en vervolgens de Codex app-server-runtime vraagt de ingebedde agentbeurt uit te voeren. Het betekent niet "gebruik API-facturering", en het betekent niet dat het kanaal, de modelprovidercatalogus of de OpenClaw-sessieopslag Codex wordt.

Wanneer de meegeleverde `codex`-plugin is ingeschakeld, moet Codex-besturing in natuurlijke taal het native `/codex`-commandoppervlak gebruiken (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) in plaats van ACP. Gebruik ACP voor Codex alleen wanneer de gebruiker expliciet om ACP/acpx vraagt of het ACP-adapterpad test. Claude Code, Gemini CLI, OpenCode, Cursor en vergelijkbare externe harnesses gebruiken nog steeds ACP.

Dit is de agentgerichte beslisboom:

1. Als de gebruiker vraagt om **Codex koppelen/besturen/thread/hervatten/sturen/stoppen**, gebruik dan het native `/codex`-commandoppervlak wanneer de meegeleverde `codex`-plugin is ingeschakeld.
2. Als de gebruiker vraagt om **Codex als ingebedde runtime** of de normale abonnementsgebaseerde Codex-agentervaring wil, gebruik dan `openai/<model>`.
3. Als de gebruiker expliciet **PI voor een OpenAI-model** kiest, houd dan de modelref als `openai/<model>` en stel `agentRuntime.id: "pi"` in. Een geselecteerd `openai-codex`-authprofiel wordt intern gerouteerd via PI's legacy Codex-authtransport.
4. Als legacy configuratie nog **`openai-codex/*`-modelrefs** bevat, repareer dit dan naar `openai/<model>` met `openclaw doctor --fix`.
5. Als de gebruiker expliciet **ACP**, **acpx** of **Codex ACP-adapter** zegt, gebruik dan ACP met `runtime: "acp"` en `agentId: "codex"`.
6. Als het verzoek gaat over **Claude Code, Gemini CLI, OpenCode, Cursor, Droid of een andere externe harness**, gebruik dan ACP/acpx, niet de native subagentruntime.

| Je bedoelt...                         | Gebruik...                                  |
| ------------------------------------- | ------------------------------------------- |
| Codex app-server chat-/threadbesturing | `/codex ...` vanuit de meegeleverde `codex`-plugin |
| Codex app-server ingebedde agentruntime | `openai/*`-agentmodelrefs                   |
| OpenAI Codex OAuth                    | `openai-codex`-authprofielen                |
| Claude Code of andere externe harness | ACP/acpx                                    |

Voor de prefix-splitsing binnen de OpenAI-familie, zie [OpenAI](/nl/providers/openai) en [Modelproviders](/nl/concepts/model-providers). Voor het supportcontract van de Codex-runtime, zie [Codex-harness](/nl/plugins/codex-harness#v1-support-contract).

## Runtime-eigenaarschap

Verschillende runtimes zijn eigenaar van verschillende delen van de lus.

| Oppervlak                    | OpenClaw PI ingebed                     | Codex app-server                                                              |
| ---------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| Eigenaar van modellus         | OpenClaw via de PI ingebedde runner     | Codex app-server                                                              |
| Canonieke threadstatus        | OpenClaw-transcript                     | Codex-thread, plus OpenClaw-transcriptspiegel                                 |
| Dynamische OpenClaw-tools     | Native OpenClaw-toollus                 | Gebridged via de Codex-adapter                                                |
| Native shell- en bestandstools | PI/OpenClaw-pad                         | Codex-native tools, gebridged via native hooks waar ondersteund               |
| Context-engine                | Native OpenClaw-contextassemblage       | OpenClaw projecteert geassembleerde context in de Codex-beurt                 |
| Compaction                    | OpenClaw of geselecteerde context-engine | Codex-native Compaction, met OpenClaw-meldingen en spiegelonderhoud           |
| Kanaallevering                | OpenClaw                                | OpenClaw                                                                      |

Deze eigendomssplitsing is de belangrijkste ontwerpregel:

- Als OpenClaw eigenaar is van het oppervlak, kan OpenClaw normaal plugin-hookgedrag bieden.
- Als de native runtime eigenaar is van het oppervlak, heeft OpenClaw runtime-events of native hooks nodig.
- Als de native runtime eigenaar is van de canonieke threadstatus, moet OpenClaw context spiegelen en projecteren, niet niet-ondersteunde internals herschrijven.

## Runtime-selectie

OpenClaw kiest een ingebedde runtime na provider- en modelresolutie:

1. De vastgelegde runtime van een sessie wint. Configuratiewijzigingen schakelen een bestaand transcript niet hot over naar een ander native threadsysteem.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forceert die runtime voor nieuwe of geresette sessies.
3. `agents.defaults.agentRuntime.id` of `agents.list[].agentRuntime.id` kan `auto`, `pi`, een geregistreerde ingebedde harness-id zoals `codex`, of een ondersteunde CLI-backendalias zoals `claude-cli` instellen.
4. In `auto`-modus kunnen geregistreerde plugin-runtimes ondersteunde provider-/modelparen claimen.
5. Als geen runtime een beurt claimt in `auto`-modus, gebruikt OpenClaw PI als compatibiliteitsruntime. Gebruik een expliciete runtime-id wanneer de run strikt moet zijn.

Expliciete plugin-runtimes falen gesloten. Bijvoorbeeld: `agentRuntime.id: "codex"` betekent Codex of een duidelijke selectie-/runtimefout; het wordt nooit stilzwijgend terug naar PI gerouteerd.

CLI-backendaliassen verschillen van ingebedde harness-id's. De voorkeursvorm voor Claude CLI is:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Legacy refs zoals `claude-cli/claude-opus-4-7` blijven ondersteund voor compatibiliteit, maar nieuwe configuratie moet de provider/het model canoniek houden en de uitvoeringsbackend in `agentRuntime.id` zetten.

`auto`-modus is bewust conservatief voor de meeste providers. OpenAI-agentmodellen zijn de uitzondering: een niet-ingestelde runtime en `auto` worden beide naar de Codex-harness opgelost. Expliciete PI-runtimeconfiguratie blijft een opt-in compatibiliteitsroute voor `openai/*`-agentbeurten; wanneer gekoppeld aan een geselecteerd `openai-codex`-authprofiel, routeert OpenClaw PI intern via het legacy Codex-authtransport terwijl de publieke modelref `openai/*` blijft. Verouderde OpenAI PI-sessiepins zonder expliciete configuratie worden terug naar Codex gerepareerd.

Als `openclaw doctor` waarschuwt dat de `codex`-plugin is ingeschakeld terwijl `openai-codex/*` in de configuratie blijft staan, behandel dat dan als legacy routestatus. Voer `openclaw doctor --fix` uit om dit te herschrijven naar `openai/*` met de Codex-runtime.

## Compatibiliteitscontract

Wanneer een runtime niet PI is, moet deze documenteren welke OpenClaw-oppervlakken hij ondersteunt. Gebruik deze vorm voor runtime-documentatie:

| Vraag                                  | Waarom dit belangrijk is                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Wie is eigenaar van de modellus?       | Bepaalt waar retries, toolvervolg en beslissingen over het uiteindelijke antwoord plaatsvinden.    |
| Wie is eigenaar van de canonieke threadgeschiedenis? | Bepaalt of OpenClaw geschiedenis kan bewerken of deze alleen kan spiegelen.                        |
| Werken dynamische OpenClaw-tools?      | Berichten, sessies, Cron en tools waarvan OpenClaw eigenaar is, zijn hiervan afhankelijk.          |
| Werken dynamische toolhooks?           | Plugins verwachten `before_tool_call`, `after_tool_call` en middleware rond tools waarvan OpenClaw eigenaar is. |
| Werken native toolhooks?               | Shell, patch en tools waarvan de runtime eigenaar is, hebben native hookondersteuning nodig voor beleid en observatie. |
| Draait de levenscyclus van de context-engine? | Geheugen- en contextplugins zijn afhankelijk van assemble, ingest, after-turn en de Compaction-levenscyclus. |
| Welke Compaction-gegevens worden blootgesteld? | Sommige plugins hebben alleen meldingen nodig, terwijl andere behouden/verwijderde metadata nodig hebben. |
| Wat wordt bewust niet ondersteund?     | Gebruikers moeten geen PI-equivalentie aannemen waar de native runtime eigenaar is van meer status. |

Het ondersteuningscontract voor de Codex-runtime is gedocumenteerd in
[Codex-harnas](/nl/plugins/codex-harness#v1-support-contract).

## Statuslabels

Statusuitvoer kan zowel de labels `Execution` als `Runtime` tonen. Lees ze als
diagnostiek, niet als providernamen.

- Een modelverwijzing zoals `openai/gpt-5.5` vertelt je de geselecteerde provider/het geselecteerde model.
- Een runtime-ID zoals `codex` vertelt je welke loop de beurt uitvoert.
- Een kanaallabel zoals Telegram of Discord vertelt je waar het gesprek plaatsvindt.

Als een sessie nog steeds PI toont nadat je de runtimeconfiguratie hebt gewijzigd, start dan een nieuwe sessie
met `/new` of wis de huidige met `/reset`. Bestaande sessies behouden hun
vastgelegde runtime, zodat een transcript niet opnieuw wordt afgespeeld via twee incompatibele native
sessiesystemen.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [OpenAI](/nl/providers/openai)
- [Agent-harnasplugins](/nl/plugins/sdk-agent-harness)
- [Agent-loop](/nl/concepts/agent-loop)
- [Modellen](/nl/concepts/models)
- [Status](/nl/cli/status)
