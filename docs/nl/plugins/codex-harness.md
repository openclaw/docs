---
read_when:
    - U wilt de meegeleverde Codex app-server-harness gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op PI
summary: Voer ingesloten OpenClaw-agentbeurten uit via het meegeleverde Codex app-server-testharnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-01T11:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex` Plugin laat OpenClaw ingebedde agentbeurten uitvoeren via de
Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex eigenaar is van de low-level agentsessie:
modeldetectie, native thread hervatten, native Compaction en app-serveruitvoering.
OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie, tools,
goedkeuringen, media-aflevering en de zichtbare transcriptspiegel.

Als je je wilt oriënteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Snelle configuratie

Om de Codex-harness te gebruiken voor GPT-agentbeurten, houd je de modelreferentie canoniek als
`openai/gpt-*`, schakel je de gebundelde `codex` Plugin in en stel je
`agentRuntime.id: "codex"` in:

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
        fallback: "none",
      },
    },
  },
}
```

Als je configuratie `plugins.allow` gebruikt, neem dan ook `codex` daarin op:

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

Gebruik `openai-codex/gpt-*` niet voor dit pad. Dat selecteert Codex OAuth via
de normale PI-runner, tenzij je apart een runtime afdwingt. Configuratiewijzigingen gelden
voor nieuwe of geresette sessies; bestaande sessies behouden hun vastgelegde runtime.

## Wat deze Plugin wijzigt

De gebundelde `codex` Plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                     | Hoe je die gebruikt                                 | Wat het doet                                                                  |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingebedde runtime         | `agentRuntime.id: "codex"`                          | Voert ingebedde OpenClaw-agentbeurten uit via Codex app-server.               |
| Native chatbesturingscommando's  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Koppelt en bestuurt Codex app-serverthreads vanuit een berichtengesprek.      |
| Codex app-serverprovider/catalogus | `codex` internals, surfaced through the harness     | Laat de runtime app-servermodellen ontdekken en valideren.                    |
| Codex media-inzichtpad           | `codex/*` image-model compatibility paths           | Voert begrensde Codex app-serverbeurten uit voor ondersteunde beeldbegripmodellen. |
| Native hookrelay                 | Plugin hooks around Codex-native events             | Laat OpenClaw ondersteunde Codex-native tool-/finalisatiegebeurtenissen observeren/blokkeren. |

Het inschakelen van de Plugin maakt die mogelijkheden beschikbaar. Het doet **niet**:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelreferenties omzetten naar de native runtime
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies hot-switchen die al een PI-runtime hebben vastgelegd
- OpenClaw-kanaalaflevering, sessiebestanden, opslag van auth-profielen of
  berichtroutering vervangen

Dezelfde Plugin is ook eigenaar van het native `/codex`-chatbesturingscommando-oppervlak. Als
de Plugin is ingeschakeld en de gebruiker vraagt om Codex-threads vanuit chat te koppelen,
hervatten, sturen, stoppen of inspecteren, moeten agents `/codex ...` verkiezen boven ACP. ACP blijft
de expliciete fallback wanneer de gebruiker om ACP/acpx vraagt of de ACP
Codex-adapter test.

Native Codex-beurten behouden OpenClaw Plugin-hooks als de publieke compatibiliteitslaag.
Dit zijn in-process OpenClaw-hooks, geen Codex `hooks.json`-commandohooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` voor gespiegelde transcriptrecords
- `before_agent_finalize` via Codex `Stop`-relay
- `agent_end`

Plugins kunnen ook runtime-neutrale toolresultaatmiddleware registreren om
dynamische OpenClaw-toolresultaten te herschrijven nadat OpenClaw de tool uitvoert en voordat het
resultaat aan Codex wordt teruggegeven. Dit staat los van de publieke
`tool_result_persist` Plugin-hook, die door OpenClaw beheerde transcript-
toolresultaatschrijfacties transformeert.

Voor de semantiek van de Plugin-hooks zelf, zie [Plugin-hooks](/nl/plugins/hooks)
en [Plugin-guardgedrag](/nl/tools/plugin).

De harness staat standaard uit. Nieuwe configuraties moeten OpenAI-modelreferenties
canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` afdwingen wanneer ze
native app-serveruitvoering willen. Verouderde `codex/*`-modelreferenties selecteren nog steeds automatisch
de harness voor compatibiliteit, maar runtime-backed verouderde providerprefixes worden
niet getoond als normale model-/providerkeuzes.

Als de `codex` Plugin is ingeschakeld maar het primaire model nog steeds
`openai-codex/*` is, waarschuwt `openclaw doctor` in plaats van de route te wijzigen. Dat is
bewust: `openai-codex/*` blijft het PI Codex OAuth-/abonnementspad, en
native app-serveruitvoering blijft een expliciete runtimekeuze.

## Routekaart

Gebruik deze tabel voordat je de configuratie wijzigt:

| Gewenst gedrag                             | Modelreferentie          | Runtimeconfiguratie                   | Pluginvereiste              | Verwacht statuslabel           |
| ------------------------------------------ | ------------------------ | ------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API via normale OpenClaw-runner     | `openai/gpt-*`           | weggelaten of `runtime: "pi"`         | OpenAI-provider             | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/abonnement via PI              | `openai-codex/gpt-*`     | weggelaten of `runtime: "pi"`         | OpenAI Codex OAuth-provider | `Runtime: OpenClaw Pi Default` |
| Native Codex app-server ingebedde beurten  | `openai/gpt-*`           | `agentRuntime.id: "codex"`            | `codex` Plugin              | `Runtime: OpenAI Codex`        |
| Gemengde providers met conservatieve automatische modus | providerspecifieke referenties | `agentRuntime.id: "auto"`             | Optionele Plugin-runtimes   | Hangt af van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie         | afhankelijk van ACP-prompt/model | `sessions_spawn` with `runtime: "acp"` | gezonde `acpx`-backend      | ACP-taak-/sessiestatus         |

De belangrijke scheiding is provider versus runtime:

- `openai-codex/*` beantwoordt "welke provider-/auth-route moet PI gebruiken?"
- `agentRuntime.id: "codex"` beantwoordt "welke loop moet deze
  ingebedde beurt uitvoeren?"
- `/codex ...` beantwoordt "welk native Codex-gesprek moet deze chat koppelen
  of besturen?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

OpenAI-familieroutes zijn prefixspecifiek. Gebruik `openai-codex/*` wanneer je
Codex OAuth via PI wilt; gebruik `openai/*` wanneer je directe OpenAI API-toegang wilt of
wanneer je de native Codex app-serverharness afdwingt:

| Modelreferentie                             | Runtimepad                                  | Gebruik wanneer                                                           |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | OpenAI-provider via OpenClaw/PI-plumbing    | Je wilt huidige directe toegang tot de OpenAI Platform API met `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | OpenAI Codex OAuth via OpenClaw/PI          | Je wilt ChatGPT/Codex-abonnementsauth met de standaard PI-runner.         |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-serverharness                   | Je wilt native Codex app-serveruitvoering voor de ingebedde agentbeurt.   |

GPT-5.5 is momenteel alleen via abonnement/OAuth beschikbaar in OpenClaw. Gebruik
`openai-codex/gpt-5.5` voor PI OAuth, of `openai/gpt-5.5` met de Codex
app-serverharness. Directe API-sleuteltoegang voor `openai/gpt-5.5` wordt ondersteund
zodra OpenAI GPT-5.5 op de publieke API inschakelt.

Verouderde `codex/gpt-*`-referenties blijven geaccepteerd als compatibiliteitsaliassen. Doctor-
compatibiliteitsmigratie herschrijft verouderde primaire runtimereferenties naar canonieke modelreferenties
en legt het runtimebeleid apart vast, terwijl fallback-only verouderde referenties
ongewijzigd blijven omdat runtime voor de hele agentcontainer wordt geconfigureerd.
Nieuwe PI Codex OAuth-configuraties moeten `openai-codex/gpt-*` gebruiken; nieuwe native
app-serverharnessconfiguraties moeten `openai/gpt-*` plus
`agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai-codex/gpt-*` wanneer beeldbegrip via het OpenAI
Codex OAuth-providerpad moet lopen. Gebruik `codex/gpt-*` wanneer beeldbegrip
via een begrensde Codex app-serverbeurt moet lopen. Het Codex app-servermodel moet
ondersteuning voor beeldinvoer adverteren; tekst-only Codex-modellen falen voordat de mediabeurt
start.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen. Als de
selectie verrassend is, schakel dan debuglogging in voor het `agents/harness`-subsysteem
en inspecteer het gestructureerde `agent harness selected`-record van de Gateway. Het
bevat de geselecteerde harness-id, selectiereden, runtime-/fallbackbeleid en,
in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

### Wat doctorwaarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer al het volgende waar is:

- de gebundelde `codex` Plugin is ingeschakeld of toegestaan
- het primaire model van een agent is `openai-codex/*`
- de effectieve runtime van die agent is niet `codex`

Die waarschuwing bestaat omdat gebruikers vaak verwachten dat "Codex Plugin ingeschakeld" betekent
"native Codex app-serverruntime." OpenClaw maakt die sprong niet. De waarschuwing
betekent:

- **Er is geen wijziging vereist** als je ChatGPT/Codex OAuth via PI bedoelde.
- Wijzig het model naar `openai/<model>` en stel
  `agentRuntime.id: "codex"` in als je native app-serveruitvoering
  bedoelde.
- Bestaande sessies hebben na een runtimewijziging nog steeds `/new` of `/reset` nodig,
  omdat sessieruntimepins sticky zijn.

Harnessselectie is geen live sessiebesturing. Wanneer een ingebedde beurt wordt uitgevoerd,
legt OpenClaw de geselecteerde harness-id vast op die sessie en blijft die gebruiken voor
latere beurten in dezelfde sessie-id. Wijzig de `agentRuntime`-configuratie of
`OPENCLAW_AGENT_RUNTIME` wanneer je wilt dat toekomstige sessies een andere harness gebruiken;
gebruik `/new` of `/reset` om een nieuwe sessie te starten voordat je een bestaand
gesprek tussen PI en Codex wisselt. Dit voorkomt dat één transcript opnieuw wordt afgespeeld via
twee incompatibele native sessiesystemen.

Verouderde sessies die zijn gemaakt voordat harnesspins bestonden, worden als PI-pinned behandeld zodra ze
transcriptgeschiedenis hebben. Gebruik `/new` of `/reset` om dat gesprek na een
configuratiewijziging in Codex op te nemen.

`/status` toont de effectieve modelruntime. De standaard PI-harness verschijnt als
`Runtime: OpenClaw Pi Default`, en de Codex app-serverharness verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de gebundelde `codex` Plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard een compatibele
  Codex app-serverbinary, zodat lokale `codex`-commando's op `PATH`
  de normale harnessstart niet beïnvloeden.
- Codex-auth beschikbaar voor het app-serverproces of voor OpenClaw's Codex-auth
  bridge. Lokale app-serverstarts via stdio gebruiken een door OpenClaw beheerde Codex-home voor elke
  agent en een geïsoleerde child-`HOME`, waardoor ze standaard je persoonlijke
  `~/.codex`-account, Skills, Plugins, config, threadstatus of native
  `$HOME/.agents/skills` niet lezen.

De Plugin blokkeert oudere of niet-geversioneerde app-serverhandshakes. Dat houdt
OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live en Docker-smoketests komt auth meestal van het Codex CLI-account
of een OpenClaw `openai-codex`-authprofiel. Lokale stdio-app-serverstarts kunnen
ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Voeg Codex toe naast andere modellen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen schakelen
tussen Codex- en niet-Codex-provider-modellen. Een afgedwongen runtime geldt voor elke
ingesloten beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl
die runtime is afgedwongen, probeert OpenClaw nog steeds de Codex-harness en faalt het gesloten
in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Zet Codex op een toegewezen agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en PI-fallback voor normaal gemengd
  providergebruik.
- Gebruik verouderde `codex/*`-refs alleen voor compatibiliteit. Nieuwe configuraties moeten de voorkeur geven aan
  `openai/*` plus een expliciet Codex-runtimebeleid.

Dit houdt bijvoorbeeld de standaardagent op normale automatische selectie en
voegt een afzonderlijke Codex-agent toe:

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
        fallback: "pi",
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

- De standaardagent `main` gebruikt het normale providerpad en PI-compatibiliteitsfallback.
- De agent `codex` gebruikt de Codex app-server-harness.
- Als Codex ontbreekt of niet wordt ondersteund voor de agent `codex`, faalt de beurt
  in plaats van stilletjes PI te gebruiken.

## Routering van agentopdrachten

Agents moeten gebruikersverzoeken routeren op intentie, niet alleen op het woord "Codex":

| Gebruiker vraagt om...                                  | Agent moet gebruiken...                          |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Bind deze chat aan Codex"                              | `/codex bind`                                    |
| "Hervat Codex-thread `<id>` hier"                       | `/codex resume <id>`                             |
| "Toon Codex-threads"                                    | `/codex threads`                                 |
| "Dien een supportrapport in voor een slechte Codex-run" | `/diagnostics [note]`                            |
| "Stuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                   |
| "Gebruik Codex als de runtime voor deze agent"          | configuratiewijziging naar `agentRuntime.id`     |
| "Gebruik mijn ChatGPT/Codex-abonnement met normale OpenClaw" | `openai-codex/*`-modelrefs                  |
| "Voer Codex uit via ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en niet native sub-agents |

OpenClaw adverteert ACP-spawnbegeleiding alleen aan agents wanneer ACP is ingeschakeld,
dispatchbaar is en wordt ondersteund door een geladen runtime-backend. Als ACP niet beschikbaar is,
moeten de systeemprompt en plugin-Skills de agent niets leren over ACP-routering.

## Alleen-Codex-implementaties

Dwing de Codex-harness af wanneer je moet bewijzen dat elke ingesloten agentbeurt
Codex gebruikt. Expliciete plugin-runtimes hebben standaard geen PI-fallback, dus
`fallback: "none"` is optioneel maar vaak nuttig als documentatie:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Omgevingsoverride:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Met afgedwongen Codex faalt OpenClaw vroeg als de Codex-plugin is uitgeschakeld, de
app-server te oud is of de app-server niet kan starten. Stel
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` alleen in als je bewust wilt dat PI
ontbrekende harnessselectie afhandelt.

## Codex per agent

Je kunt één agent alleen-Codex maken terwijl de standaardagent normale
automatische selectie behoudt:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

Gebruik normale sessieopdrachten om van agent en model te wisselen. `/new` maakt een nieuwe
OpenClaw-sessie en de Codex-harness maakt of hervat waar nodig zijn sidecar app-server-thread.
`/reset` wist de OpenClaw-sessiebinding voor die thread
en laat de volgende beurt de harness opnieuw oplossen vanuit de huidige configuratie.

## Modeldetectie

Standaard vraagt de Codex-plugin de app-server om beschikbare modellen. Als
detectie mislukt of time-out bereikt, gebruikt deze een meegeleverde fallbackcatalogus voor:

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

Schakel detectie uit wanneer je wilt dat opstarten Codex niet peilt en bij de
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

Standaard start de plugin OpenClaw's beheerde Codex-binary lokaal met:

```bash
codex app-server --listen stdio://
```

De beheerde binary is gedeclareerd als een meegeleverde plugin-runtimeafhankelijkheid en wordt gestaged
met de rest van de afhankelijkheden van de `codex`-plugin. Hierdoor blijft de app-serverversie
gekoppeld aan de meegeleverde plugin in plaats van aan welke afzonderlijke Codex CLI
toevallig lokaal is geinstalleerd. Stel `appServer.command` alleen in wanneer je
bewust een ander uitvoerbaar bestand wilt gebruiken.

Standaard start OpenClaw lokale Codex-harnesssessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt
voor autonome Heartbeats: Codex kan shell- en netwerktools gebruiken zonder
te stoppen bij native goedkeuringsprompts waarop niemand aanwezig is om te antwoorden.

Om je aan te melden voor door Codex-guardian beoordeelde goedkeuringen, stel `appServer.mode:
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

Guardian-modus gebruikt Codex's native automatische beoordelingspad voor goedkeuringen. Wanneer Codex vraagt om
de sandbox te verlaten, buiten de workspace te schrijven of machtigingen zoals netwerktoegang
toe te voegen, routeert Codex dat goedkeuringsverzoek naar de native beoordelaar in plaats van naar een
menselijke prompt. De beoordelaar past Codex's risicokader toe en keurt het specifieke verzoek goed of af.
Gebruik Guardian wanneer je meer vangrails wilt dan YOLO-modus
maar nog steeds onbeheerde agents voortgang moeten laten maken.

De preset `guardian` wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"`.
Afzonderlijke beleidsvelden overschrijven `mode` nog steeds, zodat geavanceerde implementaties
de preset kunnen combineren met expliciete keuzes. De oudere beoordelaarswaarde `guardian_subagent` wordt
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

Stdio-app-serverstarts erven standaard OpenClaw's procesomgeving,
maar OpenClaw beheert de Codex app-server-accountbridge en stelt zowel
`CODEX_HOME` als `HOME` in op per-agentmappen onder de OpenClaw-state van die agent.
Codex's eigen skill-loader leest `$CODEX_HOME/skills` en
`$HOME/.agents/skills`, dus beide waarden zijn geisoleerd voor lokale app-serverstarts.
Dat houdt Codex-native skills, plugins, configuratie, accounts en threadstate
binnen de scope van de OpenClaw-agent in plaats van ze te laten lekken uit de persoonlijke
Codex CLI-home van de operator.

OpenClaw-plugins en OpenClaw-skill-snapshots blijven via OpenClaw's eigen
pluginregister en skill-loader lopen. Persoonlijke Codex CLI-assets doen dat niet. Als je
nuttige Codex CLI-skills of plugins hebt die onderdeel van een OpenClaw-agent moeten worden,
inventariseer ze expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

De Codex-migratieprovider kopieert skills naar de huidige OpenClaw-agentworkspace.
Codex-native plugins, hooks en configuratiebestanden worden gerapporteerd of gearchiveerd
voor handmatige beoordeling in plaats van automatisch geactiveerd te worden, omdat ze
opdrachten kunnen uitvoeren, MCP-servers kunnen blootstellen of referenties kunnen bevatten.

Auth wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio-app-serverstarts, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-auth
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Dat
houdt Gateway-niveau API-sleutels beschikbaar voor embeddings of directe OpenAI-modellen
zonder native Codex app-serverbeurten per ongeluk via de API te laten factureren.
Expliciete Codex API-sleutelprofielen en lokale stdio env-key-fallback gebruiken app-serverlogin
in plaats van geerfde childprocess-env. WebSocket-app-serververbindingen
ontvangen geen Gateway env API-key-fallback; gebruik een expliciet authprofiel of het
eigen account van de externe app-server.

Als een implementatie extra omgevingsisolatie nodig heeft, voeg die variabelen toe aan
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

`appServer.clearEnv` heeft alleen invloed op het gespawnde Codex app-server-childproces.

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                    |
| `command`           | beheerde Codex-binary                    | Uitvoerbaar bestand voor stdio-transport. Laat dit niet ingesteld om de beheerde binary te gebruiken; stel het alleen in voor een expliciete override.                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                                                                                                                    |
| `url`               | niet ingesteld                           | WebSocket app-server-URL.                                                                                                                                                                                                           |
| `authToken`         | niet ingesteld                           | Bearer-token voor WebSocket-transport.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio app-server-proces nadat OpenClaw de overgenomen omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's Codex-isolatie per agent bij lokale starts. |
| `requestTimeoutMs`  | `60000`                                  | Timeout voor control-plane-aanroepen naar app-server.                                                                                                                                                                               |
| `mode`              | `"yolo"`                                 | Voorinstelling voor YOLO of door guardian beoordeelde uitvoering.                                                                                                                                                                    |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread starten/hervatten/turn wordt gestuurd.                                                                                                                                              |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread starten/hervatten wordt gestuurd.                                                                                                                                                         |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een legacy-alias.                                                                                                        |
| `serviceTier`       | niet ingesteld                           | Optionele Codex app-server-servicelaag: `"fast"`, `"flex"` of `null`. Ongeldige legacy-waarden worden genegeerd.                                                                                                                    |

Dynamische toolaanroepen die OpenClaw beheert, worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: elke Codex `item/tool/call`-aanvraag moet binnen
30 seconden een OpenClaw-respons ontvangen. Bij timeout breekt OpenClaw het
toolsignaal af waar dit wordt ondersteund en retourneert een mislukte
dynamic-tool-respons aan Codex, zodat de turn kan doorgaan in plaats van de
sessie in `processing` achter te laten.

Nadat OpenClaw heeft gereageerd op een app-server-aanvraag met Codex-turnscope,
verwacht de harness ook dat Codex de native turn voltooit met `turn/completed`.
Als de app-server daarna 60 seconden stil blijft, onderbreekt OpenClaw naar
beste vermogen de Codex-turn, legt een diagnostische timeout vast en geeft de
OpenClaw-sessielane vrij, zodat vervolgmailberichten niet achter een verlopen
native turn in de wachtrij blijven staan.

Omgevings-overrides blijven beschikbaar voor lokaal testen:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt de beheerde binary wanneer
`appServer.command` niet is ingesteld.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Config
heeft de voorkeur voor herhaalbare deployments, omdat dit het Plugin-gedrag in
hetzelfde beoordeelde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiehandleiding:
[Codex-computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw levert de desktopbesturingsapp niet mee en voert zelf
geen desktopacties uit. Het bereidt Codex app-server voor, controleert of de
`computer-use` MCP-server beschikbaar is, en laat Codex daarna de native
MCP-toolaanroepen afhandelen tijdens Codex-modus-turns.

Voor directe TryCua-drivertoegang buiten de Codex-marketplaceflow registreer je
`cua-driver mcp` met `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zie [Codex-computergebruik](/nl/plugins/codex-computer-use) voor het onderscheid
tussen computergebruik dat Codex beheert en directe MCP-registratie.

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
        fallback: "none",
      },
    },
  },
}
```

De setup kan vanaf het commando-oppervlak worden gecontroleerd of geïnstalleerd:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computergebruik is specifiek voor macOS en kan lokale OS-machtigingen vereisen
voordat de Codex MCP-server apps kan besturen. Als `computerUse.enabled` true is
en de MCP-server niet beschikbaar is, mislukken Codex-modus-turns voordat de
thread start, in plaats van stilzwijgend zonder de native Computer Use-tools te
draaien. Zie [Codex-computergebruik](/nl/plugins/codex-computer-use) voor
marketplacekeuzes, beperkingen van de externe catalogus, statusredenen en
probleemoplossing.

Wanneer `computerUse.autoInstall` true is, kan OpenClaw de standaard gebundelde
Codex Desktop-marketplace registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marketplace heeft ontdekt. Gebruik `/new` of `/reset` nadat je
runtime- of computergebruik-config hebt gewijzigd, zodat bestaande sessies geen
oude PI- of Codex-threadbinding behouden.

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

Alleen-Codex harness-validatie:

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

Externe app-server met expliciete headers:

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

Modelwissels blijven door OpenClaw beheerd. Wanneer een OpenClaw-sessie is
gekoppeld aan een bestaande Codex-thread, stuurt de volgende turn het momenteel
geselecteerde OpenAI-model, provider, goedkeuringsbeleid, sandbox en
servicelaag opnieuw naar app-server. Wisselen van `openai/gpt-5.5` naar
`openai/gpt-5.2` behoudt de threadbinding, maar vraagt Codex door te gaan met
het nieuw geselecteerde model.

## Codex-commando

De gebundelde Plugin registreert `/codex` als geautoriseerd slash-commando. Het
is generiek en werkt op elk kanaal dat OpenClaw-tekstopdrachten ondersteunt.

Veelgebruikte vormen:

- `/codex status` toont live app-server-connectiviteit, modellen, account, snelheidslimieten, MCP-servers en skills.
- `/codex models` toont live Codex app-server-modellen.
- `/codex threads [filter]` toont recente Codex-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te comprimeren.
- `/codex review` start native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt toestemming voordat Codex-diagnostische feedback voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computer Use-Plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computer Use-Plugin en laadt MCP-servers opnieuw.
- `/codex account` toont account- en snelheidslimietstatus.
- `/codex mcp` toont de MCP-serverstatus van Codex app-server.
- `/codex skills` toont Codex app-server-Skills.

### Veelgebruikte debuggingworkflow

Wanneer een door Codex ondersteunde agent iets verrassends doet in Telegram,
Discord, Slack of een ander kanaal, begin dan met het gesprek waarin het
probleem optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit, of een andere
   korte notitie die beschrijft wat je zag.
2. Keur het diagnostiekverzoek eenmalig goed. De goedkeuring maakt de lokale
   Gateway-diagnostiekzip en stuurt, omdat de sessie de Codex-harness gebruikt,
   ook de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostiekantwoord naar het bugrapport of de
   supportthread. Het bevat het lokale bundelpad, de privacysamenvatting,
   OpenClaw-sessie-id's, Codex-thread-id's en een `Inspect locally`-regel voor
   elke Codex-thread.
4. Als je de run zelf wilt debuggen, voer je het afgedrukte `Inspect locally`-
   commando uit in een terminal. Het ziet eruit als `codex resume <thread-id>`
   en opent de native Codex-thread, zodat je het gesprek kunt inspecteren,
   lokaal kunt voortzetten, of Codex kunt vragen waarom het een bepaalde tool of
   een bepaald plan heeft gekozen.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-feedbackupload wilt voor de momenteel gekoppelde thread zonder de volledige OpenClaw Gateway-diagnosebundel. Voor de meeste supportmeldingen is `/diagnostics [note]` het betere startpunt, omdat dit de lokale Gateway-status en Codex-thread-id's samenbrengt in een enkel antwoord. Zie [Diagnose-export](/nl/gateway/diagnostics) voor het volledige privacymodel en gedrag in groepschats.

Core OpenClaw stelt ook `/diagnostics [note]`, alleen voor eigenaars, beschikbaar als de algemene Gateway-diagnoseopdracht. De goedkeuringsprompt toont de preambule over gevoelige gegevens, linkt naar [Diagnose-export](/nl/gateway/diagnostics), en vraagt elke keer via expliciete exec-goedkeuring om `openclaw gateway diagnostics export --json`. Keur diagnoses niet goed met een regel die alles toestaat. Na goedkeuring stuurt OpenClaw een plakbaar rapport met het lokale bundelpad en de manifest-samenvatting. Wanneer de actieve OpenClaw-sessie de Codex-harness gebruikt, machtigt diezelfde goedkeuring ook het verzenden van de relevante Codex-feedbackbundels naar OpenAI-servers. De goedkeuringsprompt zegt dat Codex-feedback wordt verzonden, maar vermeldt vóór goedkeuring geen Codex-sessie- of thread-id's.

Als `/diagnostics` door een eigenaar in een groepschat wordt aangeroepen, houdt OpenClaw het gedeelde kanaal schoon: de groep ontvangt alleen een korte melding, terwijl de diagnosepreambule, goedkeuringsprompts en Codex-sessie-/thread-id's via de privégoedkeuringsroute naar de eigenaar worden gestuurd. Als er geen privéroute naar de eigenaar is, weigert OpenClaw het groepsverzoek en vraagt het de eigenaar om dit vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept Codex app-server `feedback/upload` aan en vraagt app-server om logs op te nemen voor elke vermelde thread en voortgebrachte Codex-subthreads wanneer beschikbaar. De upload loopt via het normale feedbackpad van Codex naar OpenAI-servers; als Codex-feedback in die app-server is uitgeschakeld, retourneert de opdracht de app-server-fout. Het voltooide diagnoseantwoord vermeldt de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale `codex resume <thread-id>`-opdrachten voor de threads die zijn verzonden. Als je de goedkeuring weigert of negeert, print OpenClaw die Codex-id's niet. Deze upload vervangt de lokale Gateway-diagnose-export niet.

`/codex resume` schrijft hetzelfde sidecar-bindingsbestand dat de harness gebruikt voor normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread, geeft het het momenteel geselecteerde OpenClaw-model door aan app-server, en houdt het uitgebreide geschiedenis ingeschakeld.

### Inspecteer een Codex-thread vanuit de CLI

De snelste manier om een slechte Codex-run te begrijpen is vaak om de native Codex-thread direct te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug opmerkt in een kanaalgesprek en de problematische Codex-sessie wilt inspecteren, lokaal wilt voortzetten, of Codex wilt vragen waarom het een bepaalde tool- of redeneerkeuze maakte. Het eenvoudigste pad is meestal om eerst `/diagnostics [note]` uit te voeren: nadat je dit hebt goedgekeurd, vermeldt het voltooide rapport elke Codex-thread en print het een opdracht `Inspect locally`, bijvoorbeeld `codex resume <thread-id>`. Je kunt die opdracht direct naar een terminal kopiëren.

Je kunt ook een thread-id verkrijgen via `/codex binding` voor de huidige chat of `/codex threads [filter]` voor recente Codex app-server-threads, en daarna dezelfde opdracht `codex resume` in je shell uitvoeren.

Het opdrachtoppervlak vereist Codex app-server `0.125.0` of nieuwer. Afzonderlijke controlemethoden worden gerapporteerd als `unsupported by this Codex app-server` als een toekomstige of aangepaste app-server die JSON-RPC-methode niet beschikbaar stelt.

## Hook-grenzen

De Codex-harness heeft drie hooklagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-pluginhooks                  | OpenClaw                 | Product-/plugincompatibiliteit tussen PI- en Codex-harnesses.       |
| Codex app-server-extensiemiddleware   | OpenClaw gebundelde plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.          |
| Native Codex-hooks                    | Codex                    | Laag-niveau Codex-levenscyclus en native toolbeleid uit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex-`hooks.json`-bestanden om OpenClaw-plugingedrag te routeren. Voor de ondersteunde native tool- en machtigingsbrug injecteert OpenClaw per thread Codex-configuratie voor `PreToolUse`, `PostToolUse`, `PermissionRequest` en `Stop`. Andere Codex-hooks zoals `SessionStart` en `UserPromptSubmit` blijven controles op Codex-niveau; ze worden in het v1-contract niet als OpenClaw-pluginhooks beschikbaar gesteld.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de aanroep vraagt, dus OpenClaw activeert het plugin- en middlewaregedrag waarvan het eigenaar is in de harness-adapter. Voor Codex-native tools is Codex eigenaar van het canonieke toolrecord. OpenClaw kan geselecteerde gebeurtenissen spiegelen, maar het kan de native Codex-thread niet herschrijven tenzij Codex die bewerking beschikbaar stelt via app-server of native hook-callbacks.

Compaction- en LLM-levenscyclusprojecties komen uit Codex app-server-meldingen en OpenClaw-adapterstatus, niet uit native Codex-hookopdrachten. OpenClaw's `before_compaction`-, `after_compaction`-, `llm_input`- en `llm_output`-gebeurtenissen zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen van Codex' interne verzoek- of compaction-payloads.

Native Codex-`hook/started`- en `hook/completed`-app-servermeldingen worden geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor traject en debugging. Ze roepen geen OpenClaw-pluginhooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex is eigenaar van een groter deel van de native modelloop, en OpenClaw past zijn plugin- en sessieoppervlakken rond die grens aan.

Ondersteund in Codex-runtime v1:

| Oppervlak                                     | Ondersteuning                          | Waarom                                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modelloop via Codex                    | Ondersteund                            | Codex app-server is eigenaar van de OpenAI-beurt, native thread-hervatting en native toolvoortzetting.                                                                                               |
| OpenClaw-kanaalroutering en bezorging         | Ondersteund                            | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                       |
| Dynamische OpenClaw-tools                     | Ondersteund                            | Codex vraagt OpenClaw om deze tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.                                                                                                        |
| Prompt- en contextplugins                     | Ondersteund                            | OpenClaw bouwt promptoverlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                    |
| Levenscyclus van context-engine               | Ondersteund                            | Assemblage, ingest- of onderhoud na de beurt, en coördinatie van context-engine-compaction draaien voor Codex-beurten.                                                                               |
| Dynamische toolhooks                          | Ondersteund                            | `before_tool_call`, `after_tool_call` en middleware voor toolresultaten draaien rond dynamische tools waarvan OpenClaw eigenaar is.                                                                  |
| Levenscyclushooks                             | Ondersteund als adapterobservaties     | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` worden geactiveerd met eerlijke Codex-modus-payloads.                                                             |
| Revisiegate voor definitief antwoord          | Ondersteund via de native hook-relay   | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog één modelpass vóór finalisatie.                                                                           |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via de native hook-relay | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor vastgelegde native tooloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumentherschrijving niet. |
| Native machtigingsbeleid                      | Ondersteund via de native hook-relay   | Codex `PermissionRequest` kan via OpenClaw-beleid worden gerouteerd waar de runtime dit beschikbaar stelt. Als OpenClaw geen beslissing retourneert, gaat Codex verder via zijn normale guardian- of gebruikersgoedkeuringspad. |
| App-server-trajectvastlegging                 | Ondersteund                            | OpenClaw registreert het verzoek dat het naar app-server heeft gestuurd en de app-servermeldingen die het ontvangt.                                                                                  |

Niet ondersteund in Codex-runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                       | Toekomstig pad                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutatie van native toolargumenten                   | Codex native pre-tool hooks kunnen blokkeren, maar OpenClaw herschrijft geen Codex-native toolargumenten.                                      | Vereist Codex-hook/schema-ondersteuning voor vervangende toolinvoer.                      |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex bezit de canonieke native threadgeschiedenis. OpenClaw bezit een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadaanpassing nodig is.          |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, niet Codex-native toolrecords.                                          | Kan getransformeerde records spiegelen, maar canonieke herschrijving vereist Codex-ondersteuning. |
| Rijke native Compaction-metadata                    | OpenClaw observeert het starten en voltooien van Compaction, maar ontvangt geen stabiele bewaarde/verwijderde lijst, tokendelta of samenvattingspayload. | Vereist rijkere Codex Compaction-events.                                                   |
| Compaction-interventie                              | Huidige OpenClaw Compaction-hooks zijn in Codex-modus op meldingsniveau.                                                                        | Voeg Codex pre/post Compaction-hooks toe als plugins native Compaction moeten kunnen vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-aanvragen  | OpenClaw kan app-server-aanvragen en meldingen vastleggen, maar Codex core bouwt de uiteindelijke OpenAI API-aanvraag intern.                  | Vereist een Codex model-request tracing-event of debug-API.                                |

## Tools, media en Compaction

De Codex-harness wijzigt alleen de low-level ingebedde agentexecutor.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van de
harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en uitvoer van messaging-tools
blijven via het normale OpenClaw-leveringspad verlopen.

De native hookrelay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de Codex-native tool- en machtigingspaden die OpenClaw test. In
de Codex-runtime omvat dat shell-, patch- en MCP-`PreToolUse`-,
`PostToolUse`- en `PermissionRequest`-payloads. Ga er niet van uit dat elk toekomstig
Codex hookevent een OpenClaw Plugin-oppervlak is totdat het runtimecontract
het benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of weigeren-beslissingen
wanneer policy beslist. Een resultaat zonder beslissing is geen toestemming. Codex behandelt dit als geen
hookbeslissing en valt terug op zijn eigen guardian- of gebruikersgoedkeuringspad.

Codex MCP-toolgoedkeuringsvragen worden via de Plugin-goedkeuringsflow van OpenClaw
gerouteerd wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex-`request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende wachtrij-follow-upbericht beantwoordt die native
serveraanvraag in plaats van als extra context te worden gestuurd. Andere MCP-elicitation-
aanvragen falen nog steeds gesloten.

Active-run wachtrijsturing wordt gekoppeld aan Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` batcht OpenClaw chatberichten in de wachtrij
gedurende het geconfigureerde stille venster en verzendt ze als één `turn/steer`-aanvraag in
aankomstvolgorde. Legacy `queue`-modus verzendt afzonderlijke `turn/steer`-aanvragen. Codex
review- en handmatige Compaction-turns kunnen sturing binnen dezelfde turn weigeren, in welk geval
OpenClaw de follow-upwachtrij gebruikt wanneer de geselecteerde modus fallback toestaat. Zie
[Sturingswachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt native thread-Compaction
gedelegeerd aan Codex app-server. OpenClaw houdt een transcriptspiegel bij voor kanaalgeschiedenis,
zoeken, `/new`, `/reset` en toekomstige model- of harnesswisseling. De
spiegel bevat de gebruikersprompt, definitieve assistenttekst en lichtgewicht Codex
reasoning- of planrecords wanneer de app-server deze uitzendt. Vandaag registreert OpenClaw alleen
signalen voor de start en voltooiing van native Compaction. Het stelt nog geen
menselijk leesbare Compaction-samenvatting of controleerbare lijst beschikbaar van welke entries Codex
na Compaction heeft bewaard.

Omdat Codex eigenaar is van de canonieke native thread, herschrijft `tool_result_persist` momenteel
geen Codex-native toolresultaatrecords. Het is alleen van toepassing wanneer
OpenClaw een toolresultaat naar een OpenClaw-owned sessietranscript schrijft.

Mediageneratie vereist geen PI. Afbeeldingen, video, muziek, PDF, TTS en media-
understanding blijven de bijpassende provider/modelinstellingen gebruiken, zoals
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en
`messages.tts`.

## Probleemoplossing

**Codex verschijnt niet als een normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model met
`agentRuntime.id: "codex"` (of een legacy `codex/*`-ref), schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow` `codex`
uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan PI nog steeds gebruiken als
compatibiliteitsbackend wanneer geen Codex-harness de run claimt. Stel
`agentRuntime.id: "codex"` in om Codex-selectie tijdens het testen af te dwingen. Een
afgedwongen Codex-runtime faalt nu in plaats van terug te vallen op PI, tenzij je
expliciet `agentRuntime.fallback: "pi"` instelt. Zodra Codex app-server is
geselecteerd, verschijnen de fouten daarvan rechtstreeks zonder extra fallbackconfiguratie.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake
versie `0.125.0` of nieuwer rapporteert. Prereleases met dezelfde versie of versies met buildsuffix
zoals `0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat de
stabiele protocolondergrens `0.125.0` is wat OpenClaw test.

**Modeldiscovery is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel discovery uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`
en of de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een legacy
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven op hun normale
providerpad in `auto`-modus. Als je `agentRuntime.id: "codex"` afdwingt, moet elke ingebedde
turn voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd, maar tools draaien niet:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik `/new` of `/reset`; als het aanhoudt, herstart dan
de Gateway om verouderde native hookregistraties te wissen. Als `computer-use.list_apps`
een time-out krijgt, herstart Codex Computer Use of Codex Desktop en probeer het opnieuw.

## Gerelateerd

- [Agent-harness-plugins](/nl/plugins/sdk-agent-harness)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin-hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
