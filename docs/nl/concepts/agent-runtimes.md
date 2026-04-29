---
read_when:
    - Je kiest tussen PI, Codex, ACP of een andere systeemeigen agentruntime
    - Je raakt in de war door provider-, model- of runtimelabels in status of configuratie
    - Je documenteert ondersteuningspariteit voor een native testharnas
summary: Hoe OpenClaw modelproviders, modellen, kanalen en agentruntimes van elkaar scheidt
title: Agent-runtimes
x-i18n:
    generated_at: "2026-04-29T22:36:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Een **agent-runtime** is de component die eigenaar is van één voorbereide model-lus: hij
ontvangt de prompt, stuurt modeluitvoer aan, verwerkt native toolaanroepen en geeft
de afgeronde beurt terug aan OpenClaw.

Runtimes zijn gemakkelijk te verwarren met providers, omdat beide dicht bij de
modelconfiguratie verschijnen. Het zijn verschillende lagen:

| Laag          | Voorbeelden                          | Wat het betekent                                                  |
| ------------- | ------------------------------------- | ----------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Hoe OpenClaw verifieert, modellen ontdekt en modelrefs benoemt.   |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Het model dat voor de agentbeurt is geselecteerd.                 |
| Agent-runtime | `pi`, `codex`, `claude-cli`           | De low-level lus of backend die de voorbereide beurt uitvoert.    |
| Kanaal        | Telegram, Discord, Slack, WhatsApp    | Waar berichten OpenClaw binnenkomen en verlaten.                  |

Je zult ook het woord **harness** in code tegenkomen. Een harness is de implementatie
die een agent-runtime levert. De gebundelde Codex-harness implementeert
bijvoorbeeld de `codex`-runtime. Publieke configuratie gebruikt `agentRuntime.id`;
`openclaw doctor --fix` herschrijft oudere runtime-policy-sleutels naar die vorm.

Er zijn twee runtimefamilies:

- **Ingebedde harnesses** draaien binnen de voorbereide agentlus van OpenClaw.
  Tegenwoordig is dit de ingebouwde `pi`-runtime plus geregistreerde Plugin-harnesses
  zoals `codex`.
- **CLI-backends** draaien een lokaal CLI-proces terwijl de modelref canoniek
  blijft. Bijvoorbeeld `anthropic/claude-opus-4-7` met
  `agentRuntime.id: "claude-cli"` betekent: "selecteer het Anthropic-model, voer uit
  via Claude CLI." `claude-cli` is geen ingebedde harness-id en mag niet aan
  AgentHarness-selectie worden doorgegeven.

## Drie dingen met de naam Codex

De meeste verwarring komt doordat drie verschillende oppervlakken de naam Codex delen:

| Oppervlak                                            | OpenClaw-naam/configuratie           | Wat het doet                                                                                                 |
| ---------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Codex OAuth-providerroute                            | `openai-codex/*` modelrefs           | Gebruikt ChatGPT/Codex-abonnement OAuth via de normale OpenClaw PI-runner.                                   |
| Native Codex app-server-runtime                      | `agentRuntime.id: "codex"`           | Voert de ingebedde agentbeurt uit via de gebundelde Codex app-server-harness.                                |
| Codex ACP-adapter                                    | `runtime: "acp"`, `agentId: "codex"` | Voert Codex uit via het externe ACP/acpx-besturingsvlak. Gebruik dit alleen wanneer expliciet om ACP/acpx wordt gevraagd. |
| Native Codex chat-control-commandoset                | `/codex ...`                         | Koppelt, hervat, stuurt, stopt en inspecteert Codex app-server-threads vanuit chat.                          |
| OpenAI Platform API-route voor GPT/Codex-achtige modellen | `openai/*` modelrefs                | Gebruikt OpenAI API-key-verificatie tenzij een runtime-override, zoals `runtime: "codex"`, de beurt uitvoert. |

Die oppervlakken zijn bewust onafhankelijk. Het inschakelen van de `codex`-Plugin maakt
de native app-serverfuncties beschikbaar; het herschrijft
`openai-codex/*` niet naar `openai/*`, wijzigt bestaande sessies niet en maakt
ACP niet de Codex-standaard. `openai-codex/*` selecteren betekent "gebruik de Codex
OAuth-providerroute" tenzij je afzonderlijk een runtime forceert.

De gangbare Codex-configuratie gebruikt de `openai`-provider met de `codex`-runtime:

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

Dat betekent dat OpenClaw een OpenAI-modelref selecteert en daarna de Codex app-server-runtime
vraagt de ingebedde agentbeurt uit te voeren. Het betekent niet dat het kanaal, de
modelprovidercatalogus of de OpenClaw-sessieopslag Codex wordt.

Wanneer de gebundelde `codex`-Plugin is ingeschakeld, moet natural-language Codex-besturing
het native `/codex`-commandoppervlak gebruiken (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) in plaats van ACP. Gebruik ACP voor
Codex alleen wanneer de gebruiker expliciet om ACP/acpx vraagt of het ACP-adapterpad
test. Claude Code, Gemini CLI, OpenCode, Cursor en vergelijkbare externe
harnesses gebruiken nog steeds ACP.

Dit is de beslisboom voor agents:

1. Als de gebruiker vraagt om **Codex bind/control/thread/resume/steer/stop**, gebruik dan het
   native `/codex`-commandoppervlak wanneer de gebundelde `codex`-Plugin is ingeschakeld.
2. Als de gebruiker vraagt om **Codex als de ingebedde runtime**, gebruik dan
   `openai/<model>` met `agentRuntime.id: "codex"`.
3. Als de gebruiker vraagt om **Codex OAuth/abonnementsverificatie op de normale OpenClaw
   runner**, gebruik dan `openai-codex/<model>` en laat de runtime op PI staan.
4. Als de gebruiker expliciet **ACP**, **acpx** of **Codex ACP-adapter** zegt, gebruik dan
   ACP met `runtime: "acp"` en `agentId: "codex"`.
5. Als het verzoek gaat over **Claude Code, Gemini CLI, OpenCode, Cursor, Droid of
   een andere externe harness**, gebruik dan ACP/acpx, niet de native sub-agent-runtime.

| Je bedoelt...                         | Gebruik...                                  |
| ------------------------------------- | ------------------------------------------- |
| Codex app-server chat/thread-besturing | `/codex ...` van de gebundelde `codex`-Plugin |
| Codex app-server ingebedde agent-runtime | `agentRuntime.id: "codex"`                |
| OpenAI Codex OAuth op de PI-runner    | `openai-codex/*` modelrefs                  |
| Claude Code of andere externe harness | ACP/acpx                                    |

Voor de prefixscheiding binnen de OpenAI-familie, zie [OpenAI](/nl/providers/openai) en
[Modelproviders](/nl/concepts/model-providers). Voor het ondersteuningscontract van de
Codex-runtime, zie [Codex-harness](/nl/plugins/codex-harness#v1-support-contract).

## Runtime-eigenaarschap

Verschillende runtimes bezitten verschillende delen van de lus.

| Oppervlak                   | OpenClaw PI ingebed                    | Codex app-server                                                            |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| Eigenaar van de modellus    | OpenClaw via de PI embedded runner     | Codex app-server                                                            |
| Canonieke threadstatus      | OpenClaw-transcript                    | Codex-thread, plus OpenClaw-transcriptspiegel                               |
| Dynamische OpenClaw-tools   | Native OpenClaw-toollus                | Overbrugd via de Codex-adapter                                              |
| Native shell- en bestandstools | PI/OpenClaw-pad                     | Codex-native tools, overbrugd via native hooks waar ondersteund             |
| Context-engine              | Native OpenClaw-contextassemblage      | OpenClaw projecteert geassembleerde context naar de Codex-beurt             |
| Compaction                  | OpenClaw of geselecteerde context-engine | Codex-native compaction, met OpenClaw-meldingen en spiegelonderhoud       |
| Kanaallevering              | OpenClaw                               | OpenClaw                                                                    |

Deze verdeling van eigenaarschap is de belangrijkste ontwerpregel:

- Als OpenClaw eigenaar is van het oppervlak, kan OpenClaw normaal Plugin-hookgedrag leveren.
- Als de native runtime eigenaar is van het oppervlak, heeft OpenClaw runtime-events of native hooks nodig.
- Als de native runtime eigenaar is van canonieke threadstatus, moet OpenClaw context spiegelen en projecteren, niet niet-ondersteunde internals herschrijven.

## Runtime-selectie

OpenClaw kiest een ingebedde runtime na provider- en modelresolutie:

1. De vastgelegde runtime van een sessie wint. Configuratiewijzigingen hot-switchen een
   bestaand transcript niet naar een ander native threadsysteem.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forceert die runtime voor nieuwe of geresette sessies.
3. `agents.defaults.agentRuntime.id` of `agents.list[].agentRuntime.id` kan
   `auto`, `pi`, een geregistreerde ingebedde harness-id zoals `codex`, of een
   ondersteunde CLI-backendalias zoals `claude-cli` instellen.
4. In `auto`-modus kunnen geregistreerde Plugin-runtimes ondersteunde provider/model-paren
   claimen.
5. Als geen runtime een beurt claimt in `auto`-modus en `fallback: "pi"` is ingesteld
   (de standaard), gebruikt OpenClaw PI als compatibiliteitsfallback. Stel
   `fallback: "none"` in om niet-gematchte selectie in `auto`-modus in plaats daarvan te laten mislukken.

Expliciete Plugin-runtimes falen standaard gesloten. Bijvoorbeeld,
`runtime: "codex"` betekent Codex of een duidelijke selectiefout, tenzij je
`fallback: "pi"` in dezelfde override-scope instelt. Een runtime-override erft
geen bredere fallbackinstelling, dus een agent-level `runtime: "codex"` wordt niet stilzwijgend
terug naar PI gerouteerd alleen omdat defaults `fallback: "pi"` gebruikten.

CLI-backendaliassen verschillen van ingebedde harness-id's. De aanbevolen
Claude CLI-vorm is:

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

Legacy refs zoals `claude-cli/claude-opus-4-7` blijven ondersteund voor
compatibiliteit, maar nieuwe configuratie moet de provider/het model canoniek houden en
de uitvoeringsbackend in `agentRuntime.id` plaatsen.

`auto`-modus is bewust conservatief. Plugin-runtimes kunnen provider/model-paren
claimen die ze begrijpen, maar de Codex-Plugin claimt de
`openai-codex`-provider niet in `auto`-modus. Daarmee blijft
`openai-codex/*` de expliciete PI Codex OAuth-route en wordt voorkomen dat
configuraties met abonnementsverificatie stilzwijgend naar de native app-server-harness
worden verplaatst.

Als `openclaw doctor` waarschuwt dat de `codex`-Plugin is ingeschakeld terwijl
`openai-codex/*` nog steeds via PI routeert, behandel dat dan als een diagnose, niet als een
migratie. Laat de configuratie ongewijzigd wanneer PI Codex OAuth is wat je wilt.
Schakel alleen over naar `openai/<model>` plus `agentRuntime.id: "codex"` wanneer je native
Codex app-server-uitvoering wilt.

## Compatibiliteitscontract

Wanneer een runtime niet PI is, moet deze documenteren welke OpenClaw-oppervlakken hij ondersteunt.
Gebruik deze vorm voor runtime-documentatie:

| Vraag                                  | Waarom het belangrijk is                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Wie is eigenaar van de modellus?       | Bepaalt waar retries, toolcontinuation en beslissingen over het eindantwoord plaatsvinden.        |
| Wie is eigenaar van canonieke threadgeschiedenis? | Bepaalt of OpenClaw geschiedenis kan bewerken of die alleen kan spiegelen.                 |
| Werken dynamische OpenClaw-tools?      | Messaging, sessies, Cron en door OpenClaw beheerde tools vertrouwen hierop.                       |
| Werken dynamische toolhooks?           | Plugins verwachten `before_tool_call`, `after_tool_call` en middleware rond door OpenClaw beheerde tools. |
| Werken native toolhooks?               | Shell-, patch- en runtime-owned tools hebben native hookondersteuning nodig voor beleid en observatie. |
| Draait de lifecycle van de context-engine? | Memory- en context-Plugins zijn afhankelijk van assemble-, ingest-, after-turn- en compaction-lifecycle. |
| Welke compaction-data wordt blootgesteld? | Sommige Plugins hebben alleen meldingen nodig, terwijl andere bewaarde/verwijderde metadata nodig hebben. |
| Wat wordt bewust niet ondersteund?     | Gebruikers mogen geen PI-equivalentie veronderstellen waar de native runtime meer status bezit.   |

Het ondersteuningscontract van de Codex-runtime is gedocumenteerd in
[Codex-harness](/nl/plugins/codex-harness#v1-support-contract).

## Statuslabels

Statusuitvoer kan zowel de labels `Execution` als `Runtime` tonen. Lees ze als
diagnostiek, niet als providernamen.

- Een modelverwijzing zoals `openai/gpt-5.5` geeft de geselecteerde provider/het geselecteerde model aan.
- Een runtime-id zoals `codex` geeft aan welke loop de beurt uitvoert.
- Een kanaallabel zoals Telegram of Discord geeft aan waar het gesprek plaatsvindt.

Als een sessie nog steeds PI toont nadat de runtimeconfiguratie is gewijzigd, start dan een nieuwe sessie
met `/new` of wis de huidige met `/reset`. Bestaande sessies behouden hun
vastgelegde runtime, zodat een transcript niet opnieuw wordt afgespeeld via twee incompatibele native
sessiesystemen.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [OpenAI](/nl/providers/openai)
- [Agent-harness-plugins](/nl/plugins/sdk-agent-harness)
- [Agentloop](/nl/concepts/agent-loop)
- [Modellen](/nl/concepts/models)
- [Status](/nl/cli/status)
