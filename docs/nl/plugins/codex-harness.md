---
read_when:
    - U wilt het meegeleverde Codex-app-servertestharnas gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op PI
summary: Voer OpenClaw-ingebedde agentbeurten uit via het gebundelde Codex app-server-harnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-06T09:25:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

De meegeleverde `codex` Plugin laat OpenClaw ingesloten agentbeurten uitvoeren via de
Codex app-server in plaats van het ingebouwde PI-harnas.

Gebruik dit wanneer je wilt dat Codex de agentssessie op laag niveau beheert: modeldetectie, native thread hervatten, native Compaction en app-serveruitvoering.
OpenClaw blijft chatkanalen, sessiebestanden, modelselectie, tools,
goedkeuringen, medialevering en de zichtbare transcriptspiegel beheren.

Wanneer een bronchatbeurt via het Codex-harnas loopt, gebruiken zichtbare antwoorden standaard
de OpenClaw `message`-tool als de implementatie `messages.visibleReplies`
niet expliciet heeft geconfigureerd. De agent kan zijn Codex-beurt nog steeds privé afronden;
hij plaatst alleen iets in het kanaal wanneer hij `message(action="send")` aanroept. Stel
`messages.visibleReplies: "automatic"` in om definitieve antwoorden in directe chats op het
legacy automatische afleverpad te houden.

Codex Heartbeat-beurten krijgen standaard ook de `heartbeat_respond`-tool, zodat de
agent kan vastleggen of het wekken stil moet blijven of een melding moet sturen zonder
die besturingsstroom in de eindtekst te coderen.

Heartbeat-specifieke initiatiefbegeleiding wordt als een Codex-ontwikkelaarsinstructie voor
samenwerkingsmodus verzonden op de Heartbeat-beurt zelf. Gewone chatbeurten herstellen
daarentegen de Codex Default-modus in plaats van Heartbeat-filosofie mee te dragen in hun normale
runtimeprompt.

Als je jezelf probeert te oriënteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelverwijzing, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Snelle configuratie

De meeste gebruikers die "Codex in OpenClaw" willen, willen deze route: meld je aan met een
ChatGPT/Codex-abonnement en voer daarna ingesloten agentbeurten uit via de native
Codex app-serverruntime. De modelverwijzing blijft canoniek als
`openai/gpt-*`; abonnementsauthenticatie komt uit het Codex-account/-profiel, niet
uit een `openai-codex/*`-modelprefix.

Meld je eerst aan met Codex OAuth als je dat nog niet hebt gedaan:

```bash
openclaw models auth login --provider openai-codex
```

Schakel daarna de meegeleverde `codex` Plugin in en forceer de Codex-runtime:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
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

Als je configuratie `plugins.allow` gebruikt, neem `codex` daar dan ook in op:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Gebruik `openai-codex/gpt-*` niet in configuratie. Die prefix is een legacyroute die
`openclaw doctor --fix` herschrijft naar `openai/gpt-*` voor primaire modellen,
fallbacks, Heartbeat-/subagent-/Compaction-overschrijvingen, hooks, kanaaloverschrijvingen
en verouderde vastgelegde sessieroutepinnen.

## Wat deze Plugin wijzigt

De meegeleverde `codex` Plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                      | Hoe je deze gebruikt                                | Wat het doet                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingesloten runtime         | `agentRuntime.id: "codex"`                          | Voert ingesloten OpenClaw-agentbeurten uit via Codex app-server.              |
| Native chatbesturingsopdrachten   | `/codex bind`, `/codex resume`, `/codex steer`, ... | Koppelt en bestuurt Codex app-serverthreads vanuit een berichtenconversatie.  |
| Codex app-serverprovider/catalogus | `codex` internals, beschikbaar via het harnas       | Laat de runtime app-servermodellen ontdekken en valideren.                    |
| Codex-pad voor mediabegrip        | `codex/*` image-model compatibility paths           | Voert begrensde Codex app-serverbeurten uit voor ondersteunde modellen voor beeldbegrip. |
| Native hookrelay                  | Plugin hooks rond Codex-native gebeurtenissen       | Laat OpenClaw ondersteunde Codex-native tool-/afrondingsgebeurtenissen observeren/blokkeren. |

Het inschakelen van de Plugin maakt die mogelijkheden beschikbaar. Het doet **niet** het volgende:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelverwijzingen omzetten naar de native runtime zonder dat doctor
  verifieert dat Codex is geïnstalleerd, ingeschakeld, het `codex`-harnas levert
  en klaar is voor OAuth
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies hot-switchen die al een PI-runtime hebben vastgelegd
- OpenClaw-kanaalaflevering, sessiebestanden, auth-profielopslag of
  berichtroutering vervangen

Dezelfde Plugin beheert ook het native `/codex`-chatbesturingsopdrachtenoppervlak. Als
de Plugin is ingeschakeld en de gebruiker vraagt om Codex-threads vanuit chat te koppelen,
hervatten, sturen, stoppen of inspecteren, moeten agents de voorkeur geven aan `/codex ...`
boven ACP. ACP blijft de expliciete fallback wanneer de gebruiker om ACP/acpx vraagt of de ACP
Codex-adapter test.

Native Codex-beurten houden OpenClaw Plugin hooks als de publieke compatibiliteitslaag.
Dit zijn in-process OpenClaw-hooks, geen Codex `hooks.json`-opdrachthooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` voor gespiegelde transcriptrecords
- `before_agent_finalize` via Codex `Stop`-relay
- `agent_end`

Plugins kunnen ook runtime-neutrale middleware voor toolresultaten registreren om
dynamische OpenClaw-toolresultaten te herschrijven nadat OpenClaw de tool uitvoert en voordat het
resultaat wordt teruggegeven aan Codex. Dit staat los van de publieke
`tool_result_persist` Plugin hook, die transcript-toolresultaatschrijvingen in eigendom van OpenClaw
transformeert.

Zie voor de semantiek van de Plugin hooks zelf [Plugin hooks](/nl/plugins/hooks)
en [Plugin guard behavior](/nl/tools/plugin).

Het harnas staat standaard uit. Nieuwe configuraties moeten OpenAI-modelverwijzingen
canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` forceren wanneer ze
native app-serveruitvoering willen. Legacy `codex/*`-modelverwijzingen selecteren
het harnas nog steeds automatisch voor compatibiliteit, maar runtime-ondersteunde legacyproviderprefixen worden
niet getoond als normale model-/providerkeuzes.

Als een geconfigureerde modelroute nog steeds `openai-codex/*` is, herschrijft `openclaw doctor --fix`
deze naar `openai/*`. Voor overeenkomende agentroutes stelt het de agentruntime
alleen in op `codex` wanneer de Codex Plugin is geïnstalleerd, ingeschakeld, het
`codex`-harnas levert en bruikbare OAuth heeft; anders stelt het de runtime in op `pi`.

## Routekaart

Gebruik deze tabel voordat je de configuratie wijzigt:

| Gewenst gedrag                                      | Modelverwijzing          | Runtimeconfiguratie                    | Auth-/profielroute          | Verwacht statuslabel           |
| --------------------------------------------------- | ------------------------ | -------------------------------------- | --------------------------- | ------------------------------ |
| ChatGPT/Codex-abonnement met native Codex-runtime   | `openai/gpt-*`           | `agentRuntime.id: "codex"`             | Codex OAuth of Codex-account | `Runtime: OpenAI Codex`        |
| OpenAI API via normale OpenClaw-runner              | `openai/gpt-*`           | weggelaten of `runtime: "pi"`          | OpenAI API-sleutel          | `Runtime: OpenClaw Pi Default` |
| Legacyconfiguratie die doctorreparatie nodig heeft  | `openai-codex/gpt-*`     | gerepareerd naar `codex` of `pi`       | Bestaande geconfigureerde auth | Controleer opnieuw na `doctor --fix` |
| Gemengde providers met conservatieve automatische modus | providerspecifieke verwijzingen | `agentRuntime.id: "auto"`              | Per geselecteerde provider  | Hangt af van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie                  | afhankelijk van ACP-prompt/model | `sessions_spawn` met `runtime: "acp"` | ACP-backendauth             | ACP-taak-/sessiestatus         |

De belangrijke splitsing is provider versus runtime:

- `openai-codex/*` is een legacyroute die doctor herschrijft.
- `agentRuntime.id: "codex"` vereist het Codex-harnas en faalt gesloten als dit
  niet beschikbaar is.
- `agentRuntime.id: "auto"` laat geregistreerde harnassen overeenkomende providerroutes
  claimen, maar canonieke OpenAI-verwijzingen blijven in eigendom van PI tenzij een harnas
  dat provider-/modelpaar ondersteunt.
- `/codex ...` beantwoordt "welke native Codex-conversatie moet deze chat koppelen
  of besturen?"
- ACP beantwoordt "welk extern harnasproces moet acpx starten?"

## Kies de juiste modelprefix

Routes uit de OpenAI-familie zijn prefixspecifiek. Gebruik voor de gebruikelijke installatie met abonnement plus
native Codex-runtime `openai/*` met `agentRuntime.id: "codex"`.
Behandel `openai-codex/*` als legacyconfiguratie die doctor moet herschrijven:

| Modelverwijzing                             | Runtimepad                                  | Gebruik wanneer                                                           |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | OpenAI-provider via OpenClaw/PI-plumbing    | Je huidige directe OpenAI Platform API-toegang met `OPENAI_API_KEY` wilt. |
| `openai-codex/gpt-5.5`                      | Legacyroute gerepareerd door doctor         | Je op oude configuratie zit; voer `openclaw doctor --fix` uit om deze te herschrijven. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-serverharnas                    | Je ChatGPT/Codex-abonnementsauthenticatie met native Codex-uitvoering wilt. |

GPT-5.5 kan zowel op directe OpenAI API-sleutelroutes als op Codex-abonnementsroutes
verschijnen wanneer je account deze beschikbaar stelt. Gebruik `openai/gpt-5.5` met het Codex app-serverharnas
voor native Codex-runtime, of `openai/gpt-5.5` zonder een Codex-runtimeoverschrijving
voor direct API-sleutelverkeer.

Legacy `codex/gpt-*`-verwijzingen blijven geaccepteerd als compatibiliteitsaliassen. Doctor
compatibiliteitsmigratie herschrijft legacy runtimeverwijzingen naar canonieke modelverwijzingen
en legt het runtimebeleid afzonderlijk vast. Nieuwe native app-serverharnasconfiguraties
moeten `openai/gpt-*` plus `agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixsplitsing. Gebruik
`openai/gpt-*` voor de normale OpenAI-route en `codex/gpt-*` wanneer beeldbegrip
via een begrensde Codex app-serverbeurt moet lopen. Gebruik geen
`openai-codex/gpt-*`; doctor herschrijft die legacyprefix naar `openai/gpt-*`. Het
Codex app-servermodel moet ondersteuning voor beeldinvoer adverteren; alleen-tekst Codex-modellen
falen voordat de mediabeurt start.

Gebruik `/status` om het effectieve harnas voor de huidige sessie te bevestigen. Als de
selectie verrassend is, schakel debuglogging in voor het `agents/harness`-subsysteem
en inspecteer het gestructureerde `agent harness selected`-record van de Gateway. Het
bevat de geselecteerde harnas-id, selectiereden, runtime-/fallbackbeleid en,
in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

### Wat doctorwaarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer geconfigureerde modelverwijzingen of vastgelegde sessieroutestatus
nog steeds `openai-codex/*` gebruiken. `openclaw doctor --fix` herschrijft die routes
naar:

- `openai/<model>`
- `agentRuntime.id: "codex"` wanneer Codex is geïnstalleerd, ingeschakeld, het
  `codex`-harnas levert en bruikbare OAuth heeft
- `agentRuntime.id: "pi"` anders

De `codex`-route forceert het native Codex-harnas. De `pi`-route houdt de
agent op de standaard OpenClaw-runner in plaats van Codex in te schakelen of te installeren als
neveneffect van legacyrouteopschoning.
Doctor repareert ook verouderde vastgelegde sessiepinnen in gevonden agentssessieopslaglocaties,
zodat oude conversaties niet vast blijven zitten op de verwijderde route.

Harnessselectie is geen live sessiebesturing. Wanneer een ingesloten beurt wordt uitgevoerd,
registreert OpenClaw de geselecteerde harness-id op die sessie en blijft die gebruiken voor
latere beurten met dezelfde sessie-id. Wijzig de `agentRuntime`-configuratie of
`OPENCLAW_AGENT_RUNTIME` wanneer je wilt dat toekomstige sessies een andere harness gebruiken;
gebruik `/new` of `/reset` om een nieuwe sessie te starten voordat je een bestaand
gesprek tussen PI en Codex wisselt. Dit voorkomt dat één transcript via twee
incompatibele native sessiesystemen opnieuw wordt afgespeeld.

Legacy sessies die zijn aangemaakt voordat harness-pins bestonden, worden behandeld als PI-gepind zodra ze
transcriptgeschiedenis hebben. Gebruik `/new` of `/reset` om dat gesprek na een
configuratiewijziging naar Codex over te zetten.

`/status` toont de effectieve modelruntime. De standaard PI-harness verschijnt als
`Runtime: OpenClaw Pi Default`, en de Codex app-server-harness verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de gebundelde `codex` Plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard een compatibele
  Codex app-server-binary, dus lokale `codex`-commando's op `PATH` hebben
  geen invloed op het normale opstarten van de harness.
- Codex-authenticatie beschikbaar voor het app-serverproces of voor OpenClaw's Codex-authenticatiebridge.
  Lokale app-serverstarts gebruiken een door OpenClaw beheerde Codex-home voor elke
  agent en een geïsoleerde child-`HOME`, zodat ze standaard je persoonlijke
  `~/.codex`-account, Skills, plugins, configuratie, threadstatus of native
  `$HOME/.agents/skills` niet lezen.

De Plugin blokkeert oudere of ongeversioneerde app-server-handshakes. Zo blijft
OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt authenticatie meestal van het Codex CLI-account
of een OpenClaw `openai-codex`-authenticatieprofiel. Lokale stdio app-serverstarts kunnen
ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Workspace-bootstrapbestanden

Codex verwerkt `AGENTS.md` zelf via native project-doc-detectie. OpenClaw
schrijft geen synthetische Codex project-doc-bestanden en is niet afhankelijk van Codex-fallbackbestandsnamen
voor personabestanden, omdat Codex-fallbacks alleen van toepassing zijn wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw-workspacepariteit lost de Codex-harness de andere bootstrapbestanden op
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, en `MEMORY.md` wanneer aanwezig) en stuurt ze door via Codex
developer-instructies op `thread/start` en `thread/resume`. Hierdoor blijven
`SOUL.md` en gerelateerde workspace-persona-/profielcontext zichtbaar op de native
Codex-gedragssturende baan zonder `AGENTS.md` te dupliceren.

## Codex naast andere modellen toevoegen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen wisselen
tussen Codex- en niet-Codex-providermodellen. Een geforceerde runtime geldt voor elke
ingesloten beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl
die runtime is geforceerd, probeert OpenClaw nog steeds de Codex-harness en faalt het gesloten
in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Zet Codex op een dedicated agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en PI-fallback voor normaal gemengd
  providergebruik.
- Gebruik legacy `codex/*`-refs alleen voor compatibiliteit. Nieuwe configuraties moeten de voorkeur geven aan
  `openai/*` plus een expliciet Codex-runtimebeleid.

Dit voorbeeld houdt de standaardagent op normale automatische selectie en
voegt een aparte Codex-agent toe:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Met deze vorm:

- De standaardagent `main` gebruikt het normale providerpad en de PI-compatibiliteitsfallback.
- De `codex`-agent gebruikt de Codex app-server-harness.
- Als Codex ontbreekt of niet wordt ondersteund voor de `codex`-agent, faalt de beurt
  in plaats van stilletjes PI te gebruiken.

## Routering van agentcommando's

Agents moeten gebruikersverzoeken routeren op intentie, niet alleen op het woord "Codex":

| Gebruiker vraagt om...                                 | Agent moet gebruiken...                          |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bind deze chat aan Codex"                             | `/codex bind`                                    |
| "Hervat Codex-thread `<id>` hier"                      | `/codex resume <id>`                             |
| "Toon Codex-threads"                                   | `/codex threads`                                 |
| "Dien een supportrapport in voor een slechte Codex-run" | `/diagnostics [note]`                            |
| "Stuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                      |
| "Gebruik mijn ChatGPT/Codex-abonnement met Codex-runtime" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Repareer oude `openai-codex/*`-configuratie-/sessiepins" | `openclaw doctor --fix`                          |
| "Voer Codex uit via ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en geen native sub-agents |

OpenClaw adverteert ACP-spawnbegeleiding alleen aan agents wanneer ACP is ingeschakeld,
dispatchbaar is en wordt ondersteund door een geladen runtimebackend. Als ACP niet beschikbaar is,
moeten de systeemprompt en Plugin-Skills de agent niet onderwijzen over ACP-routering.

## Alleen-Codex-deployments

Forceer de Codex-harness wanneer je moet bewijzen dat elke ingesloten agentbeurt
Codex gebruikt. Expliciete Plugin-runtimes falen gesloten en worden nooit stilzwijgend opnieuw geprobeerd
via PI:

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

Omgevings-override:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Met Codex geforceerd faalt OpenClaw vroeg als de Codex Plugin is uitgeschakeld, de
app-server te oud is of de app-server niet kan starten.

## Codex per agent

Je kunt één agent alleen-Codex maken terwijl de standaardagent normale
automatische selectie behoudt:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Gebruik normale sessiecommando's om tussen agents en modellen te wisselen. `/new` maakt een nieuwe
OpenClaw-sessie en de Codex-harness maakt of hervat zijn sidecar app-server-thread
wanneer nodig. `/reset` wist de OpenClaw-sessiebinding voor die thread
en laat de volgende beurt de harness opnieuw uit de huidige configuratie oplossen.

## Modeldetectie

Standaard vraagt de Codex Plugin de app-server om beschikbare modellen. Als
detectie faalt of een time-out krijgt, gebruikt de Plugin een gebundelde fallbackcatalogus voor:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Je kunt detectie afstemmen onder `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Schakel detectie uit wanneer je wilt dat het opstarten Codex niet probeert te pollen en bij de
fallbackcatalogus blijft:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-serververbinding en beleid

Standaard start de Plugin OpenClaw's beheerde Codex-binary lokaal met:

```bash
codex app-server --listen stdio://
```

De beheerde binary wordt geleverd met het `codex` Plugin-pakket. Hierdoor blijft de
app-serverversie gekoppeld aan de gebundelde Plugin in plaats van aan welke aparte
Codex CLI toevallig lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer
je bewust een ander uitvoerbaar bestand wilt uitvoeren.

Standaard start OpenClaw lokale Codex-harness-sessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt
voor autonome Heartbeats: Codex kan shell- en netwerktools gebruiken zonder
te stoppen op native goedkeuringsprompts waar niemand is om te antwoorden.

Om Codex door guardian beoordeelde goedkeuringen in te schakelen, stel je `appServer.mode:
"guardian"` in:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian-modus gebruikt Codex's native auto-review-goedkeuringspad. Wanneer Codex vraagt om
de sandbox te verlaten, buiten de workspace te schrijven of rechten zoals netwerktoegang
toe te voegen, routeert Codex dat goedkeuringsverzoek naar de native reviewer in plaats van naar een
menselijke prompt. De reviewer past Codex's risicokader toe en keurt het specifieke
verzoek goed of af. Gebruik Guardian wanneer je meer vangrails wilt dan YOLO-modus
maar nog steeds onbewaakte agents voortgang moeten kunnen boeken.

De `guardian`-preset wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, en `sandbox: "workspace-write"`.
Individuele beleidsvelden overschrijven nog steeds `mode`, zodat geavanceerde deployments de
preset met expliciete keuzes kunnen combineren. De oudere reviewerwaarde `guardian_subagent` wordt
nog steeds geaccepteerd als compatibiliteitsalias, maar nieuwe configuraties moeten
`auto_review` gebruiken.

Gebruik WebSocket-transport voor een al draaiende app-server:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Stdio app-serverstarts erven standaard OpenClaw's procesomgeving,
maar OpenClaw beheert de Codex app-server-accountbridge en stelt zowel
`CODEX_HOME` als `HOME` in op per-agentmappen onder de OpenClaw-status van die agent.
Codex's eigen skillloader leest `$CODEX_HOME/skills` en
`$HOME/.agents/skills`, dus beide waarden zijn geïsoleerd voor lokale app-serverstarts.
Dat houdt Codex-native Skills, plugins, configuratie, accounts en threadstatus
beperkt tot de OpenClaw-agent in plaats van binnen te lekken vanuit de persoonlijke
Codex CLI-home van de operator.

OpenClaw-plugins en OpenClaw-Skills-snapshots blijven via OpenClaw's eigen
Plugin-register en skillloader lopen. Persoonlijke Codex CLI-assets niet. Als je
nuttige Codex CLI-Skills of plugins hebt die onderdeel moeten worden van een OpenClaw-agent,
inventariseer ze expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

De Codex-migratieprovider kopieert Skills naar de huidige OpenClaw-agentworkspace.
Codex-native plugins, hooks en configuratiebestanden worden gerapporteerd of gearchiveerd
voor handmatige beoordeling in plaats van automatisch te worden geactiveerd, omdat ze
commando's kunnen uitvoeren, MCP-servers kunnen blootstellen of credentials kunnen bevatten.

Authenticatie wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-serverstarts, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-authenticatie
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authprofiel in de stijl van een ChatGPT-abonnement ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Dat
houdt API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex-app-serverbeurten per ongeluk via de API worden gefactureerd.
Expliciete Codex API-sleutelprofielen en lokale stdio-env-keyfallback gebruiken app-server
login in plaats van overgenomen childproces-env. WebSocket-app-serververbindingen
ontvangen geen Gateway env API-sleutelfallback; gebruik een expliciet authprofiel of het
eigen account van de remote app-server.

Als een deployment aanvullende omgevingsisolatie nodig heeft, voeg die variabelen toe aan
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` heeft alleen effect op het gespawnde Codex app-server-childproces.

Dynamische Codex-tools gebruiken standaard het `native-first`-profiel. In die modus
stelt OpenClaw geen dynamische tools beschikbaar die native Codex-werkruimtebewerkingen
dupliceren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` en
`update_plan`. Integratietools van OpenClaw zoals messaging, sessions, media,
cron, browser, nodes, gateway, `heartbeat_respond` en `web_search` blijven
beschikbaar.

Ondersteunde Codex Plugin-velden op topniveau:

| Veld                       | Standaard        | Betekenis                                                                                  |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Gebruik `"openclaw-compat"` om de volledige dynamische OpenClaw-toolset beschikbaar te maken voor Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Aanvullende namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-serverbeurten. |

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` spawnt Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                  |
| `command`           | beheerde Codex-binary                    | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om de beheerde binary te gebruiken; stel het alleen in voor een expliciete overschrijving.                                                                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                                                                                                                    |
| `url`               | niet ingesteld                           | WebSocket app-server-URL.                                                                                                                                                                                                           |
| `authToken`         | niet ingesteld                           | Bearer-token voor WebSocket-transport.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die worden verwijderd uit het gespawnde stdio app-serverproces nadat OpenClaw zijn overgenomen omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's per-agent Codex-isolatie bij lokale starts. |
| `requestTimeoutMs`  | `60000`                                  | Timeout voor app-server control-plane-aanroepen.                                                                                                                                                                                    |
| `mode`              | `"yolo"`                                 | Preset voor YOLO of door een guardian beoordeelde uitvoering.                                                                                                                                                                        |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread start/resume/turn wordt gestuurd.                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread start/resume wordt gestuurd.                                                                                                                                                              |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een legacy-alias.                                                                                                        |
| `serviceTier`       | niet ingesteld                           | Optionele Codex app-server-servicelaag: `"fast"`, `"flex"` of `null`. Ongeldige legacy-waarden worden genegeerd.                                                                                                                    |

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: elk Codex `item/tool/call`-verzoek moet binnen
30 seconden een OpenClaw-antwoord ontvangen. Bij een timeout breekt OpenClaw het toolsignaal
af waar dat wordt ondersteund en retourneert het een mislukte dynamic-tool-respons aan Codex zodat
de beurt kan doorgaan in plaats van de sessie in `processing` achter te laten.

Nadat OpenClaw antwoordt op een turn-scoped app-serververzoek van Codex, verwacht het harnas
ook dat Codex de native beurt voltooit met `turn/completed`. Als de
app-server daarna 60 seconden stil blijft, onderbreekt OpenClaw naar beste vermogen
de Codex-beurt, registreert het een diagnostische timeout en geeft het de
OpenClaw-sessiebaan vrij zodat vervolgmailberichten niet achter een verlopen
native beurt in de wachtrij blijven staan.

Omgevingsoverrides blijven beschikbaar voor lokaal testen:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt de beheerde binary wanneer
`appServer.command` niet is ingesteld.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Config heeft
de voorkeur voor herhaalbare deployments omdat het het Plugin-gedrag in hetzelfde
beoordeelde bestand houdt als de rest van de Codex-harnasconfiguratie.

## Computergebruik

Computer Use wordt behandeld in een eigen installatiehandleiding:
[Codex Computer Use](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw levert de desktop-control-app niet mee en voert
zelf geen desktopacties uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is, en laat Codex vervolgens de native
MCP-toolaanroepen afhandelen tijdens beurten in Codex-modus.

Voor directe TryCua-drivertoegang buiten de Codex marketplace-flow registreer je
`cua-driver mcp` met `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zie [Codex Computer Use](/nl/plugins/codex-computer-use) voor het onderscheid
tussen Computer Use in eigendom van Codex en directe MCP-registratie.

Minimale config:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
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

De installatie kan worden gecontroleerd of geïnstalleerd via het commandosurface:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use is macOS-specifiek en kan lokale OS-machtigingen vereisen voordat de
Codex MCP-server apps kan besturen. Als `computerUse.enabled` true is en de MCP-server
niet beschikbaar is, mislukken beurten in Codex-modus voordat de thread start in plaats van
stilzwijgend zonder de native Computer Use-tools te draaien. Zie
[Codex Computer Use](/nl/plugins/codex-computer-use) voor marketplace-keuzes,
limieten van de remote catalogus, statusredenen en probleemoplossing.

Wanneer `computerUse.autoInstall` true is, kan OpenClaw de standaard
meegeleverde Codex Desktop marketplace registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marketplace heeft ontdekt. Gebruik `/new` of `/reset` na het
wijzigen van runtime- of Computer Use-config zodat bestaande sessies geen oude
PI- of Codex-threadbinding behouden.

## Veelgebruikte recepten

Lokale Codex met standaard stdio-transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Alleen Codex-harnasvalidatie:

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Door guardian beoordeelde Codex-goedkeuringen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Remote app-server met expliciete headers:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Modelwisseling blijft door OpenClaw beheerd. Wanneer een OpenClaw-sessie is gekoppeld
aan een bestaande Codex-thread, stuurt de volgende beurt het momenteel geselecteerde
OpenAI-model, de provider, het goedkeuringsbeleid, de sandbox en de servicelaag opnieuw
naar app-server. Overschakelen van `openai/gpt-5.5` naar `openai/gpt-5.2` behoudt de
threadbinding maar vraagt Codex om door te gaan met het nieuw geselecteerde model.

## Codex-opdracht

De meegeleverde Plugin registreert `/codex` als een geautoriseerde slash-opdracht. Deze is
generiek en werkt op elk kanaal dat tekstcommando's van OpenClaw ondersteunt.

Veelgebruikte vormen:

- `/codex status` toont live app-serverconnectiviteit, modellen, account, snelheidslimieten, MCP-servers en Skills.
- `/codex models` geeft live Codex-app-servermodellen weer.
- `/codex threads [filter]` geeft recente Codex-threads weer.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt de Codex-app-server om de gekoppelde thread te comprimeren.
- `/codex review` start de native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om bevestiging voordat Codex-diagnostische feedback voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computer Use-Plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computer Use-Plugin en laadt MCP-servers opnieuw.
- `/codex account` toont account- en snelheidslimietstatus.
- `/codex mcp` geeft de MCP-serverstatus van de Codex-app-server weer.
- `/codex skills` geeft de Skills van de Codex-app-server weer.

Wanneer Codex een fout door een gebruikslimiet meldt, neemt OpenClaw de volgende
reset-tijd van de app-server op wanneer Codex die heeft verstrekt. Gebruik `/codex account` in hetzelfde
gesprek om het huidige account en de snelheidslimietvensters te bekijken.

### Veelgebruikte debugging-workflow

Wanneer een agent die door Codex wordt ondersteund iets onverwachts doet in Telegram, Discord, Slack,
of een ander kanaal, begin dan met het gesprek waarin het probleem optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit of een andere korte notitie
   die beschrijft wat je zag.
2. Keur het diagnostiekverzoek eenmalig goed. De goedkeuring maakt de lokale Gateway-
   diagnostiek-zip en, omdat de sessie de Codex-harness gebruikt, verstuurt ook
   de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostiekantwoord naar het bugrapport of de supportthread.
   Het bevat het lokale bundelpad, de privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een `Inspect locally`-regel voor elke Codex-thread.
4. Als je de run zelf wilt debuggen, voer je de afgedrukte `Inspect locally`-
   opdracht uit in een terminal. Die ziet eruit als `codex resume <thread-id>` en opent de
   native Codex-thread zodat je het gesprek kunt inspecteren, lokaal kunt voortzetten,
   of Codex kunt vragen waarom het een bepaalde tool of bepaald plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige OpenClaw
Gateway-diagnostiekbundel. Voor de meeste supportrapporten is `/diagnostics [note]`
het betere startpunt, omdat het de lokale Gateway-status en Codex-
thread-id's in één antwoord aan elkaar koppelt. Zie [Diagnostiekexport](/nl/gateway/diagnostics)
voor het volledige privacymodel en het gedrag in groepschats.

Core OpenClaw biedt ook alleen voor eigenaren `/diagnostics [note]` als algemene
Gateway-diagnostiekopdracht. De goedkeuringsprompt toont de inleiding over gevoelige gegevens,
linkt naar [Diagnostiekexport](/nl/gateway/diagnostics), en vraagt
`openclaw gateway diagnostics export --json` aan via expliciete exec-goedkeuring
elke keer. Keur diagnostiek niet goed met een allow-all-regel. Na goedkeuring
stuurt OpenClaw een plakbaar rapport met het lokale bundelpad en de manifest-
samenvatting. Wanneer de actieve OpenClaw-sessie de Codex-harness gebruikt, machtigt
diezelfde goedkeuring ook het verzenden van de relevante Codex-feedbackbundels naar
OpenAI-servers. De goedkeuringsprompt zegt dat Codex-feedback wordt verzonden, maar
vermeldt vóór goedkeuring geen Codex-sessie- of thread-id's.

Als `/diagnostics` door een eigenaar in een groepschat wordt aangeroepen, houdt OpenClaw het
gedeelde kanaal schoon: de groep ontvangt alleen een korte melding, terwijl de
diagnostiekinleiding, goedkeuringsprompts en Codex-sessie-/thread-id's naar
de eigenaar worden gestuurd via de privégoedkeuringsroute. Als er geen privéroute naar de eigenaar is,
weigert OpenClaw het groepsverzoek en vraagt het de eigenaar om dit vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept de Codex-app-server `feedback/upload` aan en vraagt
de app-server om logs op te nemen voor elke vermelde thread en voortgebrachte Codex-subthreads
wanneer beschikbaar. De upload verloopt via het normale feedbackpad van Codex naar OpenAI-
servers; als Codex-feedback in die app-server is uitgeschakeld, retourneert de opdracht
de app-serverfout. Het voltooide diagnostiekantwoord vermeldt de kanalen,
OpenClaw-sessie-id's, Codex-thread-id's en lokale `codex resume <thread-id>`-
opdrachten voor de threads die zijn verzonden. Als je de goedkeuring weigert of negeert,
drukt OpenClaw die Codex-id's niet af. Deze upload vervangt de lokale
Gateway-diagnostiekexport niet.

`/codex resume` schrijft hetzelfde sidecar-bindingsbestand dat de harness gebruikt voor
normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread, geeft het
het momenteel geselecteerde OpenClaw-model door aan de app-server, en houdt het uitgebreide geschiedenis
ingeschakeld.

### Een Codex-thread inspecteren vanuit de CLI

De snelste manier om een slechte Codex-run te begrijpen is vaak om de native Codex-
thread rechtstreeks te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug opmerkt in een kanaalgesprek en de
problematische Codex-sessie wilt inspecteren, lokaal wilt voortzetten, of Codex wilt vragen waarom het een
bepaalde tool- of redeneerkeuze maakte. Het gemakkelijkste pad is meestal om eerst
`/diagnostics [note]` uit te voeren: nadat je het hebt goedgekeurd, vermeldt het voltooide rapport
elke Codex-thread en drukt het een `Inspect locally`-opdracht af, bijvoorbeeld
`codex resume <thread-id>`. Je kunt die opdracht rechtstreeks naar een terminal kopiëren.

Je kunt ook een thread-id krijgen via `/codex binding` voor de huidige chat of
`/codex threads [filter]` voor recente Codex-app-serverthreads, en daarna dezelfde
`codex resume`-opdracht in je shell uitvoeren.

Het opdrachtoppervlak vereist Codex-app-server `0.125.0` of nieuwer. Afzonderlijke
controlemethoden worden gemeld als `unsupported by this Codex app-server` als een
toekomstige of aangepaste app-server die JSON-RPC-methode niet beschikbaar stelt.

## Hook-grenzen

De Codex-harness heeft drie hook-lagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin-hooks                 | OpenClaw                 | Product-/Plugin-compatibiliteit tussen PI- en Codex-harnesses.      |
| Codex-app-serverextensiemiddleware    | Gebundelde OpenClaw-plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.           |
| Native Codex-hooks                    | Codex                    | Low-level Codex-levenscyclus en native toolbeleid uit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex-`hooks.json`-bestanden om
OpenClaw-Plugin-gedrag te routeren. Voor de ondersteunde native tool- en permissiebrug
injecteert OpenClaw per-thread Codex-configuratie voor `PreToolUse`, `PostToolUse`,
`PermissionRequest`, en `Stop`. Andere Codex-hooks zoals `SessionStart` en
`UserPromptSubmit` blijven controles op Codex-niveau; ze worden niet als
OpenClaw-Plugin-hooks blootgesteld in het v1-contract.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de
aanroep vraagt, dus OpenClaw activeert het Plugin- en middlewaregedrag waarvan het eigenaar is in de
harness-adapter. Voor Codex-native tools is Codex eigenaar van het canonieke toolrecord.
OpenClaw kan geselecteerde gebeurtenissen spiegelen, maar kan de native Codex-
thread niet herschrijven tenzij Codex die bewerking beschikbaar stelt via app-server of native hook-
callbacks.

Compaction- en LLM-levenscyclusprojecties komen uit Codex-app-server-
meldingen en OpenClaw-adapterstatus, niet uit native Codex-hookopdrachten.
OpenClaw's `before_compaction`, `after_compaction`, `llm_input`, en
`llm_output`-gebeurtenissen zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen
van de interne request- of Compaction-payloads van Codex.

Codex-native `hook/started`- en `hook/completed`-app-servermeldingen worden
geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor traject en debugging.
Ze roepen geen OpenClaw-Plugin-hooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex bezit meer van
de native modellus, en OpenClaw past zijn Plugin- en sessieoppervlakken
rond die grens aan.

Ondersteund in Codex-runtime v1:

| Oppervlak                                     | Ondersteuning                           | Waarom                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                     | Ondersteund                             | Codex-app-server beheert de OpenAI-beurt, native threadhervatting en native toolvoortzetting.                                                                                                        |
| OpenClaw-kanaalroutering en levering          | Ondersteund                             | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                       |
| Dynamische OpenClaw-tools                     | Ondersteund                             | Codex vraagt OpenClaw om deze tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.                                                                                                        |
| Prompt- en context-plugins                    | Ondersteund                             | OpenClaw bouwt prompt-overlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                   |
| Levenscyclus van de contextengine             | Ondersteund                             | Assemble, ingest- of after-turn-onderhoud, en coördinatie van contextengine-Compaction worden uitgevoerd voor Codex-beurten.                                                                          |
| Dynamische tool-hooks                         | Ondersteund                             | `before_tool_call`, `after_tool_call`, en tool-resultmiddleware draaien rond dynamische tools die eigendom zijn van OpenClaw.                                                                         |
| Levenscyclushooks                             | Ondersteund als adapterobservaties      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, en `after_compaction` worden geactiveerd met eerlijke Codex-moduspayloads.                                                              |
| Revisiepoort voor eindantwoord                | Ondersteund via de native hook-relay    | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog één modelpassage vóór afronding.                                                                          |
| Native shell, patch, en MCP blokkeren of observeren | Ondersteund via de native hook-relay | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor vastgelegde native tooloppervlakken, inclusief MCP-payloads op Codex-app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native permissiebeleid                        | Ondersteund via de native hook-relay    | Codex `PermissionRequest` kan via OpenClaw-beleid worden gerouteerd waar de runtime dit beschikbaar stelt. Als OpenClaw geen beslissing retourneert, gaat Codex verder via zijn normale guardian- of gebruikersgoedkeuringspad. |
| App-servertrajectvastlegging                  | Ondersteund                             | OpenClaw registreert het verzoek dat het naar app-server stuurde en de app-servermeldingen die het ontvangt.                                                                                         |

Niet ondersteund in Codex-runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                       | Toekomstig pad                                                                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mutatie van argumenten voor native tools            | Codex-native pre-tool hooks kunnen blokkeren, maar OpenClaw herschrijft geen Codex-native toolargumenten.                                      | Vereist Codex hook-/schemaondersteuning voor vervangende toolinvoer.                             |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex beheert de canonieke native threadgeschiedenis. OpenClaw beheert een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadchirurgie nodig is.                  |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, niet Codex-native toolrecords.                                         | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning.  |
| Rijke native Compaction-metadata                    | OpenClaw observeert de start en voltooiing van Compaction, maar ontvangt geen stabiele lijst van behouden/verwijderde items, tokendelta of samenvattingspayload. | Vereist rijkere Codex Compaction-events.                                                         |
| Compaction-interventie                              | Huidige OpenClaw Compaction-hooks zitten in Codex-modus op meldingsniveau.                                                                     | Voeg Codex pre-/post-Compaction-hooks toe als plugins native Compaction moeten kunnen vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-aanvragen  | OpenClaw kan app-server-aanvragen en meldingen vastleggen, maar Codex core bouwt de uiteindelijke OpenAI API-aanvraag intern.                  | Vereist een Codex model-request tracing-event of debug-API.                                      |

## Tools, media en Compaction

De Codex-harness wijzigt alleen de low-level embedded agent-executor.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van de
harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en uitvoer van
messaging-tools blijven via het normale OpenClaw-afleverpad lopen.

De native hook-relay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de Codex-native tool- en machtigingspaden die OpenClaw test. In de
Codex-runtime omvat dat shell-, patch- en MCP-`PreToolUse`-,
`PostToolUse`- en `PermissionRequest`-payloads. Ga er niet van uit dat elk toekomstig
Codex hook-event een OpenClaw plugin-oppervlak is totdat het runtimecontract het
benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of
weigeren-beslissingen wanneer beleid beslist. Een resultaat zonder beslissing is
geen toestemming. Codex behandelt het als geen hook-beslissing en valt terug op
zijn eigen guardian- of gebruikersgoedkeuringspad.

Codex MCP-toelichtingen voor toolgoedkeuring worden via OpenClaw's
plugin-goedkeuringsflow gerouteerd wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex `request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende wachtrij-follow-upbericht beantwoordt die
native serveraanvraag in plaats van als extra context te worden gestuurd. Andere
MCP-toelichtingsaanvragen falen nog steeds gesloten.

Active-run-wachtrijsturing wordt gemapt op Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` groepeert OpenClaw chatberichten in de
wachtrij gedurende het geconfigureerde stiltevenster en stuurt ze als één
`turn/steer`-aanvraag in aankomstvolgorde. Legacy `queue`-modus stuurt afzonderlijke
`turn/steer`-aanvragen. Codex review- en handmatige Compaction-turns kunnen
same-turn-sturing weigeren; in dat geval gebruikt OpenClaw de followup-wachtrij
wanneer de geselecteerde modus fallback toestaat. Zie
[Sturingswachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt native thread-Compaction
gedelegeerd aan Codex app-server. OpenClaw houdt een transcriptspiegel bij voor
kanaalgeschiedenis, zoeken, `/new`, `/reset` en toekomstige model- of
harnesswisseling. De spiegel bevat de gebruikersprompt, de uiteindelijke
assistenttekst en lichtgewicht Codex-redeneer- of planrecords wanneer de
app-server ze uitzendt. Op dit moment registreert OpenClaw alleen signalen voor
de start en voltooiing van native Compaction. Het stelt nog geen
menselijk leesbare Compaction-samenvatting of controleerbare lijst beschikbaar
van welke vermeldingen Codex na Compaction heeft behouden.

Omdat Codex de canonieke native thread beheert, herschrijft `tool_result_persist`
momenteel geen Codex-native toolresultaatrecords. Het wordt alleen toegepast
wanneer OpenClaw een toolresultaat schrijft naar een sessietranscript dat
eigendom is van OpenClaw.

Mediageneratie vereist geen PI. Afbeeldingen, video, muziek, PDF, TTS en
mediabegrip blijven de bijbehorende provider-/modelinstellingen gebruiken, zoals
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en
`messages.tts`.

## Probleemoplossing

**Codex verschijnt niet als normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model met
`agentRuntime.id: "codex"` (of een legacy `codex/*`-ref), schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan PI nog steeds gebruiken als
compatibiliteitsbackend wanneer geen Codex-harness de run claimt. Stel
`agentRuntime.id: "codex"` in om Codex-selectie tijdens het testen af te dwingen. Een
afgedwongen Codex-runtime faalt in plaats van terug te vallen op PI. Zodra Codex app-server
is geselecteerd, worden de fouten daarvan direct zichtbaar.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake
versie `0.125.0` of nieuwer rapporteert. Prereleases met dezelfde versie of
versies met buildsuffix zoals `0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat de
stabiele `0.125.0`-protocolondergrens is wat OpenClaw test.

**Modeldetectie is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel detectie uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`
en of de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een legacy
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven in
`auto`-modus op hun normale providerpad. Als je `agentRuntime.id: "codex"` afdwingt, moet elke embedded
turn voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan `/new` of `/reset`; als dit aanhoudt, herstart
de Gateway om verouderde native hook-registraties te wissen. Als `computer-use.list_apps`
een time-out krijgt, herstart Codex Computer Use of Codex Desktop en probeer het opnieuw.

## Gerelateerd

- [Agent-harnasplugins](/nl/plugins/sdk-agent-harness)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin-hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
