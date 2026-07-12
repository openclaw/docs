---
read_when:
    - Je kiest tussen OpenClaw, Codex, ACP of een andere native agentruntime
    - U bent in de war door provider-/model-/runtimelabels in status of configuratie
    - Je documenteert gelijkwaardige ondersteuning voor een native harness
summary: Hoe OpenClaw modelproviders, modellen, kanalen en agentruntimes van elkaar scheidt
title: Agentruntimes
x-i18n:
    generated_at: "2026-07-12T08:45:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Een **agentruntime** beheert één voorbereide modellus: deze ontvangt de prompt,
stuurt de modeluitvoer aan, verwerkt systeemeigen toolaanroepen en retourneert
de voltooide beurt aan OpenClaw.

Runtimes worden gemakkelijk verward met providers, omdat beide in de buurt van
de modelconfiguratie voorkomen. Het zijn verschillende lagen:

| Laag          | Voorbeelden                                  | Betekenis                                                                 |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| Provider      | `anthropic`, `github-copilot`, `openai`      | Hoe OpenClaw authenticeert, modellen ontdekt en modelreferenties benoemt. |
| Model         | `claude-opus-4-6`, `gpt-5.6-sol`             | Het model dat voor de agentbeurt is geselecteerd.                         |
| Agentruntime  | `claude-cli`, `codex`, `copilot`, `openclaw` | De onderliggende lus of backend die de voorbereide beurt uitvoert.        |
| Kanaal        | Discord, Slack, Telegram, WhatsApp           | Waar berichten OpenClaw binnenkomen en verlaten.                          |

Een **harnas** is de implementatie die een agentruntime levert (codeterm).
Het meegeleverde Codex-harnas implementeert bijvoorbeeld de `codex`-runtime.
De openbare configuratie gebruikt `agentRuntime.id` in provider- of
modelvermeldingen; runtime-sleutels voor de volledige agent zijn verouderd en
worden genegeerd. `openclaw doctor --fix` verwijdert oude runtimevastleggingen
voor de volledige agent en herschrijft verouderde runtimemodelreferenties naar
canonieke provider-/modelreferenties, plus waar nodig modelgebonden
runtimebeleid.

Twee runtimefamilies:

- **Ingebedde harnassen** worden uitgevoerd binnen de voorbereide agentlus van
  OpenClaw: de ingebouwde `openclaw`-runtime en geregistreerde Plugin-harnassen
  zoals `codex` en `copilot`.
- **CLI-backends** voeren een lokaal CLI-proces uit en houden daarbij de
  modelreferentie canoniek. `anthropic/claude-opus-4-8` met een modelgebonden
  `agentRuntime.id: "claude-cli"` betekent bijvoorbeeld: „selecteer het
  Anthropic-model en voer het uit via Claude CLI.” `claude-cli` is geen
  ingebedde harnas-id en mag niet aan de AgentHarness-selectie worden
  doorgegeven.

Het `copilot`-harnas is een afzonderlijk, optioneel extern Plugin-harnas voor
de GitHub Copilot CLI; zie
[GitHub Copilot-agentruntime](/nl/plugins/copilot) voor de gebruikersgerichte
keuze tussen PI, Codex en de GitHub Copilot-agentruntime.

## Codex-oppervlakken

Verschillende oppervlakken delen de naam Codex:

| Oppervlak                                        | OpenClaw-naam/-configuratie          | Functie                                                                                                                         |
| ------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Systeemeigen Codex-app-serverruntime             | `openai/*`-modelreferenties          | Voert ingebedde OpenAI-agentbeurten uit via de Codex-app-server. Dit is de gebruikelijke installatie met een ChatGPT/Codex-abonnement. |
| Codex OAuth-authenticatieprofielen                | `openai` OAuth-profielen             | Slaat ChatGPT/Codex-abonnementsauthenticatie op die het Codex-app-serverharnas gebruikt.                                         |
| Codex ACP-adapter                                | `runtime: "acp"`, `agentId: "codex"` | Voert Codex uit via het externe ACP/acpx-besturingsvlak. Gebruik dit alleen wanneer expliciet om ACP/acpx wordt gevraagd.         |
| Systeemeigen Codex-chatbesturingsopdrachten      | `/codex ...`                         | Koppelt, hervat, stuurt, stopt en inspecteert Codex-app-serverthreads vanuit de chat.                                            |
| OpenAI Platform API-route voor niet-agentoppervlakken | `openai/*` plus API-sleutelauthenticatie | Rechtstreekse OpenAI-API's, zoals afbeeldingen, embeddings, spraak en realtime.                                              |

Deze oppervlakken zijn opzettelijk onafhankelijk. Door de `codex`-Plugin in te
schakelen, worden systeemeigen app-serverfuncties beschikbaar;
`openclaw doctor --fix` beheert het herstel van verouderde Codex-routes en het
opschonen van verouderde sessievastleggingen. Het selecteren van `openai/*`
voor een agentmodel betekent nu „voer dit uit via Codex”, tenzij een
OpenAI-API-oppervlak voor niet-agentdoeleinden wordt gebruikt.

De gebruikelijke installatie met een ChatGPT/Codex-abonnement gebruikt Codex
OAuth voor authenticatie, maar behoudt `openai/*` als modelreferentie en
selecteert de `codex`-runtime:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Dit betekent dat OpenClaw een OpenAI-modelreferentie selecteert en vervolgens
de Codex-app-serverruntime vraagt om de ingebedde agentbeurt uit te voeren. Het
betekent niet „gebruik API-facturering” en het betekent evenmin dat het kanaal,
de modelprovidercatalogus of de OpenClaw-sessieopslag Codex wordt.

Wanneer de meegeleverde `codex`-Plugin is ingeschakeld, gebruikt u het
systeemeigen `/codex`-opdrachtoppervlak (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) voor besturing van Codex in
natuurlijke taal in plaats van ACP. Gebruik ACP voor Codex alleen wanneer de
gebruiker expliciet om ACP/acpx vraagt of het ACP-adapterpad test. Claude Code,
Gemini CLI, OpenCode, Cursor en vergelijkbare externe harnassen blijven ACP
gebruiken.

Beslisboom:

1. **Codex koppelen/besturen/thread/hervatten/sturen/stoppen** -> systeemeigen `/codex`-opdrachtoppervlak wanneer de meegeleverde `codex`-Plugin is ingeschakeld.
2. **Codex als de ingebedde runtime** of de normale, door een abonnement ondersteunde Codex-agentervaring -> `openai/<model>`.
3. **OpenClaw expliciet gekozen voor een OpenAI-model** -> behoud `openai/<model>` als modelreferentie en stel het provider-/modelruntimebeleid in op `agentRuntime.id: "openclaw"`. Een geselecteerd `openai` OAuth-profiel wordt intern gerouteerd via het Codex-authenticatietransport van OpenClaw.
4. **Verouderde Codex-modelreferenties in de configuratie** -> herstel deze met `openclaw doctor --fix` naar `openai/<model>`; doctor behoudt de Codex-authenticatieroute door waar de oude modelreferentie dit impliceerde, provider-/modelgebonden `agentRuntime.id: "codex"` toe te voegen. Verouderde **`codex-cli/*`**-modelreferenties worden hersteld naar dezelfde Codex-app-serverroute via `openai/<model>`; OpenClaw behoudt niet langer een meegeleverde Codex CLI-backend.
5. **ACP, acpx of de Codex ACP-adapter expliciet aangevraagd** -> `runtime: "acp"` en `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid of een ander extern harnas** -> ACP/acpx, niet de systeemeigen subagentruntime.

| U bedoelt...                              | Gebruik...                                           |
| ----------------------------------------- | ---------------------------------------------------- |
| Codex-app-serverchat-/threadbesturing     | `/codex ...` van de meegeleverde `codex`-Plugin      |
| Ingebedde Codex-app-serveragentruntime    | `openai/*`-agentmodelreferenties                     |
| OpenAI Codex OAuth                        | `openai` OAuth-profielen                             |
| Claude Code of een ander extern harnas    | ACP/acpx                                             |

Zie [OpenAI](/nl/providers/openai) en
[Modelproviders](/nl/concepts/model-providers) voor de opsplitsing van
voorvoegsels binnen de OpenAI-familie. Zie
[Codex-harnasruntime](/nl/plugins/codex-harness-runtime#v1-support-contract) voor
het ondersteuningscontract van de Codex-runtime.

## Runtime-eigenaarschap

Verschillende runtimes beheren verschillende delen van de lus:

| Oppervlak                    | Ingebed in OpenClaw                                  | Codex-app-server                                                               |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| Eigenaar van de modellus     | OpenClaw, via de ingebedde OpenClaw-runner           | Codex-app-server                                                               |
| Canonieke threadstatus       | OpenClaw-transcript                                  | Codex-thread, plus een spiegel van het OpenClaw-transcript                     |
| Dynamische OpenClaw-tools    | Systeemeigen OpenClaw-toollus                        | Overbrugd via de Codex-adapter                                                 |
| Systeemeigen shell- en bestandstools | OpenClaw-pad                                | Systeemeigen Codex-tools, waar ondersteund overbrugd via systeemeigen hooks    |
| Contextengine                | Systeemeigen OpenClaw-contextsamenstelling           | OpenClaw projecteert de samengestelde context in de Codex-beurt                |
| Compaction                   | OpenClaw of de geselecteerde contextengine           | Systeemeigen Codex-compaction, met OpenClaw-meldingen en spiegelonderhoud      |
| Kanaalaflevering             | OpenClaw                                             | OpenClaw                                                                       |

Ontwerpregel: als OpenClaw het oppervlak beheert, kan het normaal gedrag van
Plugin-hooks bieden. Als de systeemeigen runtime het oppervlak beheert, heeft
OpenClaw runtimegebeurtenissen of systeemeigen hooks nodig. Als de systeemeigen
runtime de canonieke threadstatus beheert, spiegelt OpenClaw de context en
projecteert deze, in plaats van niet-ondersteunde interne onderdelen te
herschrijven.

## Runtimeselectie

OpenClaw bepaalt na het oplossen van de provider en het model een ingebedde
runtime, in deze volgorde:

1. **Modelgebonden runtimebeleid** heeft voorrang. Dit bevindt zich in een
   geconfigureerde providermodelvermelding, of in
   `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`. Een
   providerjokerteken zoals
   `agents.defaults.models["vllm/*"].agentRuntime` wordt toegepast na exact
   modelbeleid, zodat dynamisch ontdekte providermodellen één runtime kunnen
   delen zonder exacte uitzonderingen per model te overschrijven.
2. **Providergebonden runtimebeleid**: `models.providers.<provider>.agentRuntime`.
3. **`auto`-modus**: geregistreerde Plugin-runtimes kunnen ondersteunde
   provider-/modelparen claimen.
4. Als niets de beurt claimt in de `auto`-modus, valt OpenClaw terug op
   `openclaw` als compatibiliteitsruntime. Gebruik een expliciete runtime-id
   wanneer de uitvoering strikt moet zijn.

Runtimevastleggingen voor de volledige sessie en de volledige agent worden
genegeerd: `OPENCLAW_AGENT_RUNTIME`, sessiestatus
`agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime` en
`agents.list[].agentRuntime`. Voer `openclaw doctor --fix` uit om verouderde
runtimeconfiguratie voor de volledige agent te verwijderen en verouderde
runtimemodelreferenties te converteren waar de bedoeling behouden kan blijven.

Expliciete provider-/modelgebonden Plugin-runtimes mislukken gesloten:
`agentRuntime.id: "codex"` bij een provider of model betekent Codex, of een
duidelijke selectie-/runtimefout; dit wordt nooit stilzwijgend terug naar
OpenClaw gerouteerd. Alleen `auto` mag een niet-overeenkomende beurt naar
OpenClaw routeren.

Aliassen voor CLI-backends verschillen van id's van ingebedde harnassen.
Voorkeursvorm voor Claude CLI:

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

Verouderde referenties zoals `claude-cli/claude-opus-4-7` blijven ondersteund
voor compatibiliteit, maar nieuwe configuratie moet de provider/het model
canoniek houden en de uitvoeringsbackend in het provider-/modelruntimebeleid
plaatsen.

Verouderde `codex-cli/*`-referenties zijn anders: doctor migreert deze naar
`openai/*`, zodat ze via het Codex-app-serverharnas worden uitgevoerd in plaats
van een Codex CLI-backend te behouden.

De `auto`-modus is voor de meeste providers opzettelijk conservatief.
OpenAI-agentmodellen vormen de uitzondering: zowel een niet-ingestelde runtime
als `auto` wordt omgezet naar het Codex-harnas. Expliciete
OpenClaw-runtimeconfiguratie blijft een optionele compatibiliteitsroute voor
`openai/*`-agentbeurten; wanneer deze wordt gecombineerd met een geselecteerd
`openai` OAuth-profiel, routeert OpenClaw dat pad intern via het
Codex-authenticatietransport, terwijl de openbare modelreferentie `openai/*`
blijft. Verouderde OpenAI-runtimevastleggingen in sessies worden door de
runtimeselectie genegeerd en kunnen worden opgeschoond met
`openclaw doctor --fix`.

Als `openclaw doctor` waarschuwt dat de `codex`-Plugin is ingeschakeld terwijl
er nog verouderde Codex-modelreferenties in de configuratie staan, behandelt u
dit als een verouderde routestatus en voert u `openclaw doctor --fix` uit om
deze te herschrijven naar `openai/*` met de Codex-runtime.

## GitHub Copilot-agentruntime

De externe Plugin `@openclaw/copilot` registreert een optionele `copilot`-runtime
die wordt aangestuurd door de GitHub Copilot CLI (`@github/copilot-sdk`). Deze maakt
aanspraak op de canonieke abonnementsprovider `github-copilot` en wordt **nooit** door
`auto` geselecteerd. Schakel deze per model of per provider in via `agentRuntime.id`:

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

De harness maakt in `extensions/copilot/doctor-contract-api.ts`, dat automatisch
door `openclaw doctor` wordt geladen, aanspraak op de provider, runtime,
CLI-sessiesleutel en het voorvoegsel van het authenticatieprofiel. Zie
[GitHub Copilot-agentruntime](/nl/plugins/copilot) voor configuratie, authenticatie,
spiegeling van transcripten, Compaction, het declaratieve doctor-contract en de
bredere afweging tussen de Pi-, Codex- en Copilot-SDK.

## Compatibiliteitscontract

Wanneer een runtime niet van OpenClaw is, moet de documentatie ervan vermelden
welke OpenClaw-oppervlakken deze ondersteunt:

| Vraag                                              | Waarom dit belangrijk is                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Wie beheert de modellus?                           | Bepaalt waar nieuwe pogingen, voortzetting van tools en beslissingen over het definitieve antwoord plaatsvinden.                 |
| Wie beheert de canonieke threadgeschiedenis?       | Bepaalt of OpenClaw de geschiedenis kan bewerken of deze alleen kan spiegelen.                                                   |
| Werken dynamische tools van OpenClaw?              | Berichten, sessies, Cron en tools die OpenClaw beheert, zijn hiervan afhankelijk.                                                |
| Werken hooks voor dynamische tools?                | Plugins verwachten `before_tool_call`, `after_tool_call` en middleware rond tools die OpenClaw beheert.                          |
| Werken hooks voor systeemeigen tools?              | De shell, patches en tools die de runtime beheert, hebben systeemeigen hookondersteuning nodig voor beleid en observatie.         |
| Wordt de levenscyclus van de contextengine uitgevoerd? | Geheugen- en contextplugins zijn afhankelijk van de levenscyclus voor samenstellen, opnemen, na de beurt en Compaction.       |
| Welke Compaction-gegevens worden beschikbaar gesteld? | Sommige plugins hebben alleen meldingen nodig; andere hebben metagegevens nodig over wat is behouden of verwijderd.           |
| Wat wordt opzettelijk niet ondersteund?            | Gebruikers mogen niet uitgaan van gelijkwaardigheid met OpenClaw wanneer de systeemeigen runtime meer status beheert.             |

Het ondersteuningscontract voor de Codex-runtime is gedocumenteerd in
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime#v1-support-contract).

## Statuslabels

De statusuitvoer kan zowel de labels `Execution` als `Runtime` tonen. Lees deze
als diagnostische informatie, niet als providernamen:

- Een modelverwijzing zoals `openai/gpt-5.6-sol` is de geselecteerde provider en het geselecteerde model.
- Een runtime-id zoals `codex` is de lus die de beurt uitvoert.
- Een kanaallabel zoals Telegram of Discord geeft aan waar het gesprek plaatsvindt.

Als een uitvoering een onverwachte runtime toont, controleer dan eerst het
runtimebeleid van de geselecteerde provider en het geselecteerde model.
Verouderde runtime-pins voor sessies bepalen de routering niet meer.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [GitHub Copilot-agentruntime](/nl/plugins/copilot)
- [OpenAI](/nl/providers/openai)
- [Plugins voor agentharnassen](/nl/plugins/sdk-agent-harness)
- [Agentlus](/nl/concepts/agent-loop)
- [Modellen](/nl/concepts/models)
- [Status](/nl/cli/status)
