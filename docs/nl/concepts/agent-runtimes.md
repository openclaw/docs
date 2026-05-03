---
read_when:
    - Je kiest tussen PI, Codex, ACP of een andere native agentruntime
    - Je raakt in de war door labels voor aanbieder, model of uitvoeringsomgeving in status of configuratie.
    - Je documenteert ondersteuningspariteit voor een native testharnas
summary: Hoe OpenClaw modelproviders, modellen, kanalen en agentuitvoeringsomgevingen van elkaar scheidt
title: Runtimeomgevingen voor agents
x-i18n:
    generated_at: "2026-05-03T11:08:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Een **agentruntime** is de component die één voorbereide modellus bezit: hij ontvangt de prompt, stuurt modeluitvoer aan, verwerkt native toolaanroepen en geeft de voltooide beurt terug aan OpenClaw.

Runtimes zijn gemakkelijk te verwarren met providers, omdat beide in de buurt van modelconfiguratie verschijnen. Het zijn verschillende lagen:

| Laag          | Voorbeelden                          | Wat het betekent                                                   |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Hoe OpenClaw authenticeert, modellen ontdekt en modelrefs benoemt. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Het model dat voor de agentbeurt is geselecteerd.                  |
| Agentruntime  | `pi`, `codex`, `claude-cli`           | De laag-niveau lus of backend die de voorbereide beurt uitvoert.   |
| Kanaal        | Telegram, Discord, Slack, WhatsApp    | Waar berichten OpenClaw binnenkomen en verlaten.                   |

Je ziet ook het woord **harness** in code. Een harness is de implementatie die een agentruntime levert. De gebundelde Codex-harness implementeert bijvoorbeeld de `codex`-runtime. Openbare configuratie gebruikt `agentRuntime.id`; `openclaw doctor --fix` herschrijft oudere runtime-policy-sleutels naar die vorm.

Er zijn twee runtimefamilies:

- **Ingebedde harnesses** draaien binnen de voorbereide agentlus van OpenClaw. Vandaag is dit de ingebouwde `pi`-runtime plus geregistreerde Plugin-harnesses zoals `codex`.
- **CLI-backends** draaien een lokaal CLI-proces terwijl de modelref canoniek blijft. Bijvoorbeeld: `anthropic/claude-opus-4-7` met `agentRuntime.id: "claude-cli"` betekent "selecteer het Anthropic-model, voer uit via Claude CLI." `claude-cli` is geen ingebedde harness-id en mag niet worden doorgegeven aan AgentHarness-selectie.

## Codex-oppervlakken

De meeste verwarring komt doordat verschillende oppervlakken de Codex-naam delen:

| Oppervlak                                            | OpenClaw-naam/configuratie                  | Wat het doet                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Native Codex app-serverruntime                       | `openai/*` plus `agentRuntime.id: "codex"` | Draait de ingebedde agentbeurt via Codex app-server. Dit is de gebruikelijke ChatGPT/Codex-abonnementsconfiguratie.      |
| Codex OAuth-providerrouting                          | `openai-codex/*` modelrefs                | Gebruikt ChatGPT/Codex-abonnement OAuth via de normale OpenClaw PI-runner.                                               |
| Codex ACP-adapter                                    | `runtime: "acp"`, `agentId: "codex"`       | Draait Codex via het externe ACP/acpx-besturingsvlak. Gebruik dit alleen wanneer expliciet om ACP/acpx wordt gevraagd.   |
| Native Codex chat-control-commandoset                | `/codex ...`                               | Koppelt, hervat, stuurt, stopt en inspecteert Codex app-serverthreads vanuit chat.                                       |
| OpenAI Platform API-route voor GPT/Codex-achtige modellen | `openai/*` modelrefs                      | Gebruikt OpenAI API-sleutelauthenticatie tenzij een runtime-override, zoals `agentRuntime.id: "codex"`, de beurt draait. |

Deze oppervlakken zijn bewust onafhankelijk. Het inschakelen van de `codex`-Plugin maakt de native app-serverfuncties beschikbaar; het herschrijft `openai-codex/*` niet naar `openai/*`, wijzigt bestaande sessies niet en maakt ACP niet de standaard voor Codex. `openai-codex/*` selecteren betekent "gebruik de Codex OAuth-providerrouting", tenzij je afzonderlijk een runtime forceert.

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

Dat betekent dat OpenClaw een OpenAI-modelref selecteert en daarna de Codex app-serverruntime vraagt om de ingebedde agentbeurt te draaien. Het betekent niet "gebruik API-facturering" en het betekent niet dat het kanaal, de modelprovidercatalogus of de OpenClaw-sessieopslag Codex wordt.

Wanneer de gebundelde `codex`-Plugin is ingeschakeld, moet natuurlijke-taalbesturing van Codex het native `/codex`-commandoppervlak gebruiken (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) in plaats van ACP. Gebruik ACP voor Codex alleen wanneer de gebruiker expliciet om ACP/acpx vraagt of het ACP-adapterpad test. Claude Code, Gemini CLI, OpenCode, Cursor en vergelijkbare externe harnesses blijven ACP gebruiken.

Dit is de beslisboom voor agents:

1. Als de gebruiker vraagt om **Codex koppelen/besturen/thread/hervatten/sturen/stoppen**, gebruik dan het native `/codex`-commandoppervlak wanneer de gebundelde `codex`-Plugin is ingeschakeld.
2. Als de gebruiker vraagt om **Codex als de ingebedde runtime** of de normale, door abonnement ondersteunde Codex-agentervaring wil, gebruik dan `openai/<model>` met `agentRuntime.id: "codex"`.
3. Als de gebruiker vraagt om **Codex OAuth/abonnementsauthenticatie op de normale OpenClaw-runner**, gebruik dan `openai-codex/<model>` en laat de runtime als PI.
4. Als de gebruiker expliciet **ACP**, **acpx** of **Codex ACP-adapter** zegt, gebruik dan ACP met `runtime: "acp"` en `agentId: "codex"`.
5. Als het verzoek gaat over **Claude Code, Gemini CLI, OpenCode, Cursor, Droid of een andere externe harness**, gebruik dan ACP/acpx, niet de native sub-agentruntime.

| Je bedoelt...                         | Gebruik...                                  |
| ------------------------------------- | -------------------------------------------- |
| Codex app-server chat/thread-besturing | `/codex ...` uit de gebundelde `codex`-Plugin |
| Codex app-server ingebedde agentruntime | `agentRuntime.id: "codex"`                   |
| OpenAI Codex OAuth op de PI-runner    | `openai-codex/*` modelrefs                  |
| Claude Code of andere externe harness | ACP/acpx                                     |

Zie voor de prefix-splitsing binnen de OpenAI-familie [OpenAI](/nl/providers/openai) en [Modelproviders](/nl/concepts/model-providers). Zie voor het ondersteuningscontract van de Codex-runtime [Codex-harness](/nl/plugins/codex-harness#v1-support-contract).

## Runtime-eigenaarschap

Verschillende runtimes bezitten verschillende delen van de lus.

| Oppervlak                   | OpenClaw PI ingebed                     | Codex app-server                                                               |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| Eigenaar van de modellus    | OpenClaw via de PI ingebedde runner     | Codex app-server                                                               |
| Canonieke threadstatus      | OpenClaw-transcript                     | Codex-thread, plus OpenClaw-transcriptspiegel                                  |
| Dynamische OpenClaw-tools   | Native OpenClaw-toollus                 | Overbrugd via de Codex-adapter                                                 |
| Native shell- en bestandstools | PI/OpenClaw-pad                      | Codex-native tools, overbrugd via native hooks waar ondersteund                |
| Contextengine               | Native OpenClaw-contextassemblage       | OpenClaw projecteert samengestelde context in de Codex-beurt                   |
| Compaction                  | OpenClaw of geselecteerde contextengine | Codex-native Compaction, met OpenClaw-meldingen en spiegelonderhoud            |
| Kanaallevering              | OpenClaw                                | OpenClaw                                                                       |

Deze eigendomssplitsing is de belangrijkste ontwerpregel:

- Als OpenClaw het oppervlak bezit, kan OpenClaw normaal Plugin-hookgedrag leveren.
- Als de native runtime het oppervlak bezit, heeft OpenClaw runtime-events of native hooks nodig.
- Als de native runtime de canonieke threadstatus bezit, moet OpenClaw context spiegelen en projecteren, niet niet-ondersteunde internals herschrijven.

## Runtimeselectie

OpenClaw kiest een ingebedde runtime na provider- en modelresolutie:

1. De geregistreerde runtime van een sessie wint. Configuratiewijzigingen schakelen een bestaand transcript niet live over naar een ander native threadsysteem.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forceert die runtime voor nieuwe of geresette sessies.
3. `agents.defaults.agentRuntime.id` of `agents.list[].agentRuntime.id` kan `auto`, `pi`, een geregistreerde ingebedde harness-id zoals `codex`, of een ondersteunde CLI-backendalias zoals `claude-cli` instellen.
4. In `auto`-modus kunnen geregistreerde Plugin-runtimes ondersteunde provider/model-paren claimen.
5. Als geen runtime een beurt claimt in `auto`-modus, gebruikt OpenClaw PI als compatibiliteitsruntime. Gebruik een expliciete runtime-id wanneer de run strikt moet zijn.

Expliciete Plugin-runtimes falen gesloten. `agentRuntime.id: "codex"` betekent bijvoorbeeld Codex of een duidelijke selectie-/runtimefout; het wordt nooit stilzwijgend teruggeleid naar PI.

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

`auto`-modus is bewust conservatief. Plugin-runtimes kunnen provider/model-paren claimen die ze begrijpen, maar de Codex-Plugin claimt de `openai-codex`-provider niet in `auto`-modus. Daardoor blijft `openai-codex/*` de expliciete PI Codex OAuth-route en wordt voorkomen dat abonnementsauthenticatieconfiguraties stilzwijgend naar de native app-serverharness worden verplaatst.

Als `openclaw doctor` waarschuwt dat de `codex`-Plugin is ingeschakeld terwijl `openai-codex/*` nog steeds via PI routeert, behandel dat dan als een diagnose, niet als een migratie. Laat de configuratie ongewijzigd wanneer PI Codex OAuth is wat je wilt. Schakel alleen over naar `openai/<model>` plus `agentRuntime.id: "codex"` wanneer je native Codex app-serveruitvoering wilt.

## Compatibiliteitscontract

Wanneer een runtime niet PI is, moet deze documenteren welke OpenClaw-oppervlakken hij ondersteunt. Gebruik deze vorm voor runtimedocumentatie:

| Vraag                                  | Waarom het belangrijk is                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Wie bezit de modellus?                 | Bepaalt waar retries, toolvoortzetting en beslissingen over het definitieve antwoord gebeuren. |
| Wie bezit de canonieke threadgeschiedenis? | Bepaalt of OpenClaw geschiedenis kan bewerken of deze alleen kan spiegelen.                  |
| Werken dynamische OpenClaw-tools?      | Berichten, sessies, cron en door OpenClaw beheerde tools vertrouwen hierop.                    |
| Werken dynamische toolhooks?           | Plugins verwachten `before_tool_call`, `after_tool_call` en middleware rond door OpenClaw beheerde tools. |
| Werken native toolhooks?               | Shell-, patch- en runtime-beheerde tools hebben native hookondersteuning nodig voor beleid en observatie. |
| Draait de levenscyclus van de contextengine? | Geheugen- en contextplugins zijn afhankelijk van assemble, ingest, after-turn en de Compaction-levenscyclus. |
| Welke Compaction-gegevens worden blootgesteld? | Sommige Plugins hebben alleen meldingen nodig, terwijl andere bewaarde/verwijderde metadata nodig hebben. |
| Wat wordt bewust niet ondersteund?     | Gebruikers moeten geen PI-equivalentie aannemen waar de native runtime meer status bezit.       |

Het ondersteuningscontract voor de Codex-runtime is gedocumenteerd in [Codex-harness](/nl/plugins/codex-harness#v1-support-contract).

## Statuslabels

Statusuitvoer kan zowel de labels `Execution` als `Runtime` tonen. Lees ze als
diagnostiek, niet als providernamen.

- Een modelreferentie zoals `openai/gpt-5.5` vertelt je de geselecteerde provider/het geselecteerde model.
- Een runtime-id zoals `codex` vertelt je welke lus de beurt uitvoert.
- Een kanaallabel zoals Telegram of Discord vertelt je waar het gesprek plaatsvindt.

Als een sessie nog steeds PI toont nadat de runtimeconfiguratie is gewijzigd, start dan een nieuwe sessie
met `/new` of wis de huidige met `/reset`. Bestaande sessies behouden hun
vastgelegde runtime, zodat een transcript niet opnieuw wordt afgespeeld via twee incompatibele native
sessiesystemen.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [OpenAI](/nl/providers/openai)
- [Agentharness-plugins](/nl/plugins/sdk-agent-harness)
- [Agentlus](/nl/concepts/agent-loop)
- [Modellen](/nl/concepts/models)
- [Status](/nl/cli/status)
