---
read_when:
    - Je kiest tussen PI, Codex, ACP of een andere native agentruntime
    - Je bent in de war door provider-/model-/runtimelabels in status of configuratie
    - Je documenteert ondersteuningspariteit voor een systeemeigen testharnas
summary: Hoe OpenClaw modelproviders, modellen, kanalen en agentruntimes van elkaar scheidt
title: Agent-runtimes
x-i18n:
    generated_at: "2026-05-02T11:13:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Een **agentruntime** is de component die eigenaar is van één voorbereide modellus: deze ontvangt de prompt, stuurt modeluitvoer aan, verwerkt native toolaanroepen en retourneert de voltooide beurt aan OpenClaw.

Runtimes zijn makkelijk te verwarren met providers, omdat beide dicht bij modelconfiguratie verschijnen. Het zijn verschillende lagen:

| Laag          | Voorbeelden                           | Wat het betekent                                                   |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Provider      | `openai`, `anthropic`, `openai-codex` | Hoe OpenClaw authenticeert, modellen ontdekt en modelrefs benoemt. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Het model dat voor de agentbeurt is geselecteerd.                  |
| Agentruntime  | `pi`, `codex`, `claude-cli`           | De laag-niveau lus of backend die de voorbereide beurt uitvoert.   |
| Kanaal        | Telegram, Discord, Slack, WhatsApp    | Waar berichten OpenClaw binnenkomen en verlaten.                   |

Je ziet ook het woord **harness** in code. Een harness is de implementatie die een agentruntime levert. De gebundelde Codex-harness implementeert bijvoorbeeld de `codex`-runtime. Publieke configuratie gebruikt `agentRuntime.id`; `openclaw doctor --fix` herschrijft oudere runtimebeleid-sleutels naar die vorm.

Er zijn twee runtimefamilies:

- **Ingebedde harnesses** draaien binnen de voorbereide agentlus van OpenClaw. Vandaag is dit de ingebouwde `pi`-runtime plus geregistreerde Plugin-harnesses zoals `codex`.
- **CLI-backends** voeren een lokaal CLI-proces uit terwijl de modelref canoniek blijft. Bijvoorbeeld, `anthropic/claude-opus-4-7` met `agentRuntime.id: "claude-cli"` betekent "selecteer het Anthropic-model, voer uit via Claude CLI." `claude-cli` is geen ingebedde harness-id en mag niet worden doorgegeven aan AgentHarness-selectie.

## Codex-oppervlakken

De meeste verwarring komt doordat verschillende oppervlakken de Codex-naam delen:

| Oppervlak                                           | OpenClaw-naam/configuratie                  | Wat het doet                                                                                                             |
| --------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Native Codex appserver-runtime                      | `openai/*` plus `agentRuntime.id: "codex"`  | Voert de ingebedde agentbeurt uit via de Codex-appserver. Dit is de gebruikelijke ChatGPT/Codex-abonnementsconfiguratie. |
| Codex OAuth-providerroute                           | `openai-codex/*`-modelrefs                  | Gebruikt ChatGPT/Codex-abonnement OAuth via de normale OpenClaw PI-runner.                                               |
| Codex ACP-adapter                                   | `runtime: "acp"`, `agentId: "codex"`        | Voert Codex uit via het externe ACP/acpx-besturingsvlak. Gebruik dit alleen wanneer expliciet om ACP/acpx wordt gevraagd. |
| Native Codex chatbesturingscommandoset              | `/codex ...`                                | Bindt, hervat, stuurt, stopt en inspecteert Codex-appserverthreads vanuit chat.                                          |
| OpenAI Platform API-route voor GPT/Codex-achtige modellen | `openai/*`-modelrefs                   | Gebruikt OpenAI API-sleutel-authenticatie tenzij een runtime-override, zoals `agentRuntime.id: "codex"`, de beurt uitvoert. |

Die oppervlakken zijn bewust onafhankelijk. Het inschakelen van de `codex`-Plugin maakt de native appserverfuncties beschikbaar; het herschrijft `openai-codex/*` niet naar `openai/*`, wijzigt bestaande sessies niet en maakt ACP niet de Codex-standaard. Het selecteren van `openai-codex/*` betekent "gebruik de Codex OAuth-providerroute", tenzij je afzonderlijk een runtime forceert.

De gebruikelijke ChatGPT/Codex-abonnementsconfiguratie gebruikt Codex OAuth voor authenticatie, maar houdt de modelref als `openai/*` en selecteert de `codex`-runtime:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Dat betekent dat OpenClaw een OpenAI-modelref selecteert en daarna de Codex-appserverruntime vraagt om de ingebedde agentbeurt uit te voeren. Het betekent niet "gebruik API-facturering" en het betekent niet dat het kanaal, de catalogus van modelproviders of de sessieopslag van OpenClaw Codex wordt.

Wanneer de gebundelde `codex`-Plugin is ingeschakeld, moet natuurlijke-taalbesturing van Codex het native `/codex`-commandoppervlak gebruiken (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) in plaats van ACP. Gebruik ACP alleen voor Codex wanneer de gebruiker expliciet om ACP/acpx vraagt of het ACP-adapterpad test. Claude Code, Gemini CLI, OpenCode, Cursor en vergelijkbare externe harnesses gebruiken nog steeds ACP.

Dit is de besluitboom voor agents:

1. Als de gebruiker vraagt om **Codex binden/besturen/thread/hervatten/sturen/stoppen**, gebruik dan het native `/codex`-commandoppervlak wanneer de gebundelde `codex`-Plugin is ingeschakeld.
2. Als de gebruiker vraagt om **Codex als de ingebedde runtime** of de normale door abonnement ondersteunde Codex-agentervaring wil, gebruik dan `openai/<model>` met `agentRuntime.id: "codex"`.
3. Als de gebruiker vraagt om **Codex OAuth/abonnementsauthenticatie op de normale OpenClaw-runner**, gebruik dan `openai-codex/<model>` en laat de runtime als PI staan.
4. Als de gebruiker expliciet **ACP**, **acpx** of **Codex ACP-adapter** zegt, gebruik dan ACP met `runtime: "acp"` en `agentId: "codex"`.
5. Als het verzoek gaat over **Claude Code, Gemini CLI, OpenCode, Cursor, Droid of een andere externe harness**, gebruik dan ACP/acpx, niet de native subagentruntime.

| Je bedoelt...                          | Gebruik...                                  |
| -------------------------------------- | ------------------------------------------- |
| Codex-appserver chat-/threadbesturing  | `/codex ...` vanuit de gebundelde `codex`-Plugin |
| Codex-appserver ingebedde agentruntime | `agentRuntime.id: "codex"`                  |
| OpenAI Codex OAuth op de PI-runner     | `openai-codex/*`-modelrefs                  |
| Claude Code of andere externe harness  | ACP/acpx                                    |

Voor de prefixsplitsing binnen de OpenAI-familie, zie [OpenAI](/nl/providers/openai) en [Modelproviders](/nl/concepts/model-providers). Voor het ondersteuningscontract van de Codex-runtime, zie [Codex-harness](/nl/plugins/codex-harness#v1-support-contract).

## Runtime-eigenaarschap

Verschillende runtimes zijn eigenaar van verschillende delen van de lus.

| Oppervlak                  | OpenClaw PI ingebed                     | Codex-appserver                                                            |
| -------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Eigenaar van de modellus   | OpenClaw via de PI-ingebedde runner     | Codex-appserver                                                            |
| Canonieke threadstatus     | OpenClaw-transcript                     | Codex-thread, plus OpenClaw-transcriptspiegel                              |
| Dynamische OpenClaw-tools  | Native OpenClaw-toollus                 | Overbrugd via de Codex-adapter                                             |
| Native shell- en bestandstools | PI/OpenClaw-pad                    | Codex-native tools, overbrugd via native hooks waar ondersteund            |
| Context-engine             | Native OpenClaw-contextassemblage       | OpenClaw-projecten assembleren context in de Codex-beurt                   |
| Compaction                 | OpenClaw of geselecteerde context-engine | Codex-native Compaction, met OpenClaw-meldingen en spiegelonderhoud        |
| Kanaallevering             | OpenClaw                                | OpenClaw                                                                   |

Deze eigenaarschapssplitsing is de belangrijkste ontwerpregel:

- Als OpenClaw eigenaar is van het oppervlak, kan OpenClaw normaal Plugin-hookgedrag leveren.
- Als de native runtime eigenaar is van het oppervlak, heeft OpenClaw runtime-events of native hooks nodig.
- Als de native runtime eigenaar is van de canonieke threadstatus, moet OpenClaw spiegelen en context projecteren, niet niet-ondersteunde interne onderdelen herschrijven.

## Runtime-selectie

OpenClaw kiest een ingebedde runtime na provider- en modelresolutie:

1. De vastgelegde runtime van een sessie wint. Configuratiewijzigingen schakelen een bestaand transcript niet direct over naar een ander native threadsysteem.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forceert die runtime voor nieuwe of geresette sessies.
3. `agents.defaults.agentRuntime.id` of `agents.list[].agentRuntime.id` kan `auto`, `pi`, een geregistreerde ingebedde harness-id zoals `codex`, of een ondersteunde CLI-backendalias zoals `claude-cli` instellen.
4. In `auto`-modus kunnen geregistreerde Plugin-runtimes ondersteunde provider/model-paren claimen.
5. Als geen runtime een beurt claimt in `auto`-modus en `fallback: "pi"` is ingesteld (de standaard), gebruikt OpenClaw PI als compatibiliteitsfallback. Stel `fallback: "none"` in om niet-gematchte selectie in `auto`-modus in plaats daarvan te laten mislukken.

Expliciete Plugin-runtimes falen standaard gesloten. Bijvoorbeeld, `agentRuntime.id: "codex"` betekent Codex of een duidelijke selectiefout, tenzij je `fallback: "pi"` in dezelfde override-scope instelt. Een runtime-override erft geen bredere fallbackinstelling, dus een `agentRuntime.id: "codex"` op agentniveau wordt niet stilzwijgend terug naar PI gerouteerd alleen omdat defaults `fallback: "pi"` gebruikten.

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

Verouderde refs zoals `claude-cli/claude-opus-4-7` blijven ondersteund voor compatibiliteit, maar nieuwe configuratie moet de provider/het model canoniek houden en de uitvoeringsbackend in `agentRuntime.id` plaatsen.

`auto`-modus is bewust conservatief. Plugin-runtimes kunnen provider/model-paren claimen die ze begrijpen, maar de Codex-Plugin claimt de `openai-codex`-provider niet in `auto`-modus. Dat houdt `openai-codex/*` als de expliciete PI Codex OAuth-route en voorkomt dat configuraties met abonnementsauthenticatie stilzwijgend naar de native appserver-harness worden verplaatst.

Als `openclaw doctor` waarschuwt dat de `codex`-Plugin is ingeschakeld terwijl `openai-codex/*` nog steeds via PI routeert, behandel dat dan als een diagnose, niet als een migratie. Laat de configuratie ongewijzigd wanneer PI Codex OAuth is wat je wilt. Schakel alleen over naar `openai/<model>` plus `agentRuntime.id: "codex"` wanneer je native Codex-appserveruitvoering wilt.

## Compatibiliteitscontract

Wanneer een runtime geen PI is, moet deze documenteren welke OpenClaw-oppervlakken worden ondersteund. Gebruik deze vorm voor runtimedocumentatie:

| Vraag                                  | Waarom dit belangrijk is                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Wie is eigenaar van de modellus?       | Bepaalt waar retries, toolvoortzetting en beslissingen over het eindantwoord plaatsvinden.                 |
| Wie is eigenaar van de canonieke threadgeschiedenis? | Bepaalt of OpenClaw de geschiedenis kan bewerken of die alleen kan spiegelen.                              |
| Werken dynamische tools van OpenClaw?  | Berichten, sessies, Cron en tools die OpenClaw beheert, zijn hiervan afhankelijk.                          |
| Werken dynamische toolhooks?           | Plugins verwachten `before_tool_call`, `after_tool_call` en middleware rond tools die OpenClaw beheert.    |
| Werken native toolhooks?               | Shell-, patch- en runtimebeheerde tools hebben native hookondersteuning nodig voor beleid en observatie.   |
| Draait de lifecycle van de contextengine? | Geheugen- en contextplugins zijn afhankelijk van assemble, ingest, after-turn en de Compaction-lifecycle.  |
| Welke Compaction-gegevens worden blootgesteld? | Sommige Plugins hebben alleen meldingen nodig, terwijl andere bewaarde/verwijderde metadata nodig hebben. |
| Wat wordt bewust niet ondersteund?     | Gebruikers moeten geen PI-equivalentie veronderstellen wanneer de native runtime meer status beheert.      |

Het ondersteuningscontract voor de Codex-runtime is gedocumenteerd in
[Codex-harnas](/nl/plugins/codex-harness#v1-support-contract).

## Statuslabels

Statusuitvoer kan zowel `Execution`- als `Runtime`-labels tonen. Lees ze als
diagnostiek, niet als providernamen.

- Een modelverwijzing zoals `openai/gpt-5.5` vertelt je welke provider/model is geselecteerd.
- Een runtime-ID zoals `codex` vertelt je welke lus de beurt uitvoert.
- Een kanaallabel zoals Telegram of Discord vertelt je waar het gesprek plaatsvindt.

Als een sessie nog steeds PI toont nadat de runtimeconfiguratie is gewijzigd, start dan een nieuwe sessie
met `/new` of wis de huidige met `/reset`. Bestaande sessies behouden hun
vastgelegde runtime, zodat een transcript niet opnieuw wordt afgespeeld via twee incompatibele native
sessiesystemen.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [OpenAI](/nl/providers/openai)
- [Agentharnas-Plugins](/nl/plugins/sdk-agent-harness)
- [Agentlus](/nl/concepts/agent-loop)
- [Modellen](/nl/concepts/models)
- [Status](/nl/cli/status)
