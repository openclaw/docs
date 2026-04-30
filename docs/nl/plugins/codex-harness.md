---
read_when:
    - U wilt het meegeleverde Codex-app-server-harnas gebruiken
    - Je hebt voorbeelden van Codex-harness-configuratie nodig
    - Je wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op PI
summary: Voer ingesloten OpenClaw-agentbeurten uit via het meegeleverde Codex-appserverharnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-04-30T20:05:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

De meegeleverde `codex`-Plugin laat OpenClaw ingebedde agentbeurten uitvoeren via de
Codex-appserver in plaats van de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex eigenaar is van de laaggelegen agentsessie: modeldetectie, native thread hervatten, native Compaction en appserver-uitvoering.
OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie, tools,
goedkeuringen, medialevering en de zichtbare transcriptspiegel.

Als je je probeert te oriënteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Wat deze Plugin wijzigt

De meegeleverde `codex`-Plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                     | Hoe je die gebruikt                                | Wat het doet                                                                 |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingebedde runtime         | `agentRuntime.id: "codex"`                          | Voert OpenClaw-ingebedde agentbeurten uit via de Codex-appserver.             |
| Native chatbesturingsopdrachten  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindt en bestuurt Codex-appserverthreads vanuit een berichtenconversatie.     |
| Codex-appserverprovider/catalogus | `codex` internals, surfaced through the harness     | Laat de runtime appservermodellen ontdekken en valideren.                     |
| Codex-pad voor mediabegrip       | `codex/*` image-model compatibility paths           | Voert begrensde Codex-appserverbeurten uit voor ondersteunde modellen voor beeldbegrip. |
| Native hook-relay                | Plugin hooks around Codex-native events             | Laat OpenClaw ondersteunde Codex-native tool-/finalisatiegebeurtenissen observeren/blokkeren. |

Het inschakelen van de Plugin maakt die mogelijkheden beschikbaar. Het doet **niet**:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelreferenties converteren naar de native runtime
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies hot-switchen die al een PI-runtime hebben vastgelegd
- OpenClaw-kanaallevering, sessiebestanden, opslag van auth-profielen of
  berichtroutering vervangen

Dezelfde Plugin is ook eigenaar van het native `/codex`-chatbesturingsopdrachtoppervlak. Als
de Plugin is ingeschakeld en de gebruiker vraagt om Codex-threads vanuit chat te binden, hervatten, sturen, stoppen of inspecteren, moeten agents de voorkeur geven aan `/codex ...` boven ACP. ACP blijft
de expliciete fallback wanneer de gebruiker om ACP/acpx vraagt of de ACP
Codex-adapter test.

Native Codex-beurten houden OpenClaw-Plugin-hooks als de openbare compatibiliteitslaag.
Dit zijn in-process OpenClaw-hooks, geen Codex `hooks.json`-opdrachthooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` voor gespiegelde transcriptrecords
- `before_agent_finalize` via Codex `Stop`-relay
- `agent_end`

Plugins kunnen ook runtime-neutrale toolresultaatmiddleware registreren om
dynamische OpenClaw-toolresultaten te herschrijven nadat OpenClaw de tool uitvoert en voordat het
resultaat aan Codex wordt teruggegeven. Dit staat los van de openbare
`tool_result_persist`-Plugin-hook, die door OpenClaw beheerde transcript-
toolresultaatschrijfacties transformeert.

Zie voor de semantiek van de Plugin-hooks zelf [Plugin-hooks](/nl/plugins/hooks)
en [Gedrag van Plugin-bewaking](/nl/tools/plugin).

De harness staat standaard uit. Nieuwe configuraties moeten OpenAI-modelreferenties
canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` forceren wanneer ze
native appserver-uitvoering willen. Verouderde `codex/*`-modelreferenties selecteren nog steeds automatisch
de harness voor compatibiliteit, maar runtime-ondersteunde verouderde providerprefixes worden
niet getoond als normale model-/providerkeuzes.

Als de `codex`-Plugin is ingeschakeld maar het primaire model nog steeds
`openai-codex/*` is, waarschuwt `openclaw doctor` in plaats van de route te wijzigen. Dat is
bedoeld: `openai-codex/*` blijft het PI Codex OAuth-/abonnementspad, en
native appserver-uitvoering blijft een expliciete runtimekeuze.

## Routekaart

Gebruik deze tabel voordat je configuratie wijzigt:

| Gewenst gedrag                            | Modelreferentie          | Runtimeconfiguratie                   | Plugin-vereiste            | Verwacht statuslabel           |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API via normale OpenClaw-runner      | `openai/gpt-*`             | weggelaten of `runtime: "pi"`          | OpenAI-provider             | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/abonnement via PI               | `openai-codex/gpt-*`       | weggelaten of `runtime: "pi"`          | OpenAI Codex OAuth-provider | `Runtime: OpenClaw Pi Default` |
| Native Codex-appserver-ingebedde beurten    | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex`-Plugin              | `Runtime: OpenAI Codex`        |
| Gemengde providers met conservatieve automodus | providerspecifieke referenties | `agentRuntime.id: "auto"`              | Optionele Plugin-runtimes   | Hangt af van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie          | afhankelijk van ACP-prompt/model | `sessions_spawn` met `runtime: "acp"` | gezonde `acpx`-backend      | ACP-taak-/sessiestatus         |

De belangrijke scheiding is provider versus runtime:

- `openai-codex/*` beantwoordt "welke provider-/auth-route moet PI gebruiken?"
- `agentRuntime.id: "codex"` beantwoordt "welke lus moet deze
  ingebedde beurt uitvoeren?"
- `/codex ...` beantwoordt "welke native Codex-conversatie moet deze chat binden
  of besturen?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

OpenAI-familieroutes zijn prefixspecifiek. Gebruik `openai-codex/*` wanneer je
Codex OAuth via PI wilt; gebruik `openai/*` wanneer je directe OpenAI API-toegang wilt of
wanneer je de native Codex-appserverharness forceert:

| Modelreferentie                              | Runtimepad                                  | Gebruik wanneer                                                            |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-provider via OpenClaw/PI-plumbing     | Je huidige directe OpenAI Platform API-toegang met `OPENAI_API_KEY` wilt. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth via OpenClaw/PI           | Je ChatGPT/Codex-abonnementsauthenticatie met de standaard PI-runner wilt. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex-appserverharness                       | Je native Codex-appserveruitvoering voor de ingebedde agentbeurt wilt.    |

GPT-5.5 is momenteel alleen via abonnement/OAuth beschikbaar in OpenClaw. Gebruik
`openai-codex/gpt-5.5` voor PI OAuth, of `openai/gpt-5.5` met de Codex
appserverharness. Directe API-sleuteltoegang voor `openai/gpt-5.5` wordt ondersteund
zodra OpenAI GPT-5.5 op de openbare API inschakelt.

Verouderde `codex/gpt-*`-referenties blijven geaccepteerd als compatibiliteitsaliassen. Doctor-
compatibiliteitsmigratie herschrijft verouderde primaire runtimereferenties naar canonieke modelreferenties
en legt het runtimebeleid afzonderlijk vast, terwijl alleen-fallback verouderde referenties
ongewijzigd blijven omdat runtime voor de hele agentcontainer is geconfigureerd.
Nieuwe PI Codex OAuth-configuraties moeten `openai-codex/gpt-*` gebruiken; nieuwe native
appserverharness-configuraties moeten `openai/gpt-*` plus
`agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai-codex/gpt-*` wanneer beeldbegrip via het OpenAI
Codex OAuth-providerpad moet lopen. Gebruik `codex/gpt-*` wanneer beeldbegrip via
een begrensde Codex-appserverbeurt moet lopen. Het Codex-appservermodel moet
ondersteuning voor beeldinvoer adverteren; tekst-only Codex-modellen falen voordat de mediabeurt
start.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen. Als de
selectie verrassend is, schakel dan debuglogging in voor het `agents/harness`-subsysteem
en inspecteer het gestructureerde Gateway-record `agent harness selected`. Het
bevat de geselecteerde harness-id, selectiereden, runtime-/fallbackbeleid en,
in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

### Wat doctor-waarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer al het volgende waar is:

- de meegeleverde `codex`-Plugin is ingeschakeld of toegestaan
- het primaire model van een agent is `openai-codex/*`
- de effectieve runtime van die agent is niet `codex`

Die waarschuwing bestaat omdat gebruikers vaak verwachten dat "Codex-Plugin ingeschakeld" betekent
"native Codex-appserverruntime." OpenClaw maakt die sprong niet. De waarschuwing
betekent:

- **Er is geen wijziging vereist** als je ChatGPT/Codex OAuth via PI bedoelde.
- Wijzig het model naar `openai/<model>` en stel
  `agentRuntime.id: "codex"` in als je native appserver-
  uitvoering bedoelde.
- Bestaande sessies hebben nog steeds `/new` of `/reset` nodig na een runtimewijziging,
  omdat sessieruntime-pins plakkerig zijn.

Harnessselectie is geen live sessiebesturing. Wanneer een ingebedde beurt wordt uitgevoerd,
legt OpenClaw de geselecteerde harness-id vast op die sessie en blijft die gebruiken voor
latere beurten in dezelfde sessie-id. Wijzig `agentRuntime`-configuratie of
`OPENCLAW_AGENT_RUNTIME` wanneer je wilt dat toekomstige sessies een andere harness gebruiken;
gebruik `/new` of `/reset` om een nieuwe sessie te starten voordat je een bestaande
conversatie tussen PI en Codex omschakelt. Dit voorkomt dat één transcript wordt afgespeeld via
twee incompatibele native sessiesystemen.

Verouderde sessies die zijn gemaakt voordat harness-pins bestonden, worden als PI-gepind behandeld zodra ze
transcripthistorie hebben. Gebruik `/new` of `/reset` om die conversatie na
configuratiewijziging in Codex te laten instappen.

`/status` toont de effectieve modelruntime. De standaard PI-harness verschijnt als
`Runtime: OpenClaw Pi Default`, en de Codex-appserverharness verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de meegeleverde `codex`-Plugin beschikbaar.
- Codex-appserver `0.125.0` of nieuwer. De meegeleverde Plugin beheert standaard een compatibele
  Codex-appserverbinary, dus lokale `codex`-opdrachten op `PATH` hebben
  geen invloed op normale harness-start.
- Codex-authenticatie beschikbaar voor het appserverproces of voor OpenClaw's Codex-authenticatie-
  bridge. Lokale appserverstarts via stdio gebruiken een door OpenClaw beheerde Codex-home voor elke
  agent en een geïsoleerde child-`HOME`, waardoor ze standaard je persoonlijke
  `~/.codex`-account, Skills, plugins, configuratie, threadstatus of native
  `$HOME/.agents/skills` niet lezen.

De Plugin blokkeert oudere of versie-loze appserverhandshakes. Dat houdt
OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt authenticatie meestal uit het Codex CLI-account
of een OpenClaw `openai-codex`-auth-profiel. Lokale stdio-appserverstarts kunnen
ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Minimale configuratie

Gebruik `openai/gpt-5.5`, schakel de meegeleverde Plugin in en forceer de `codex`-harness:

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

Verouderde configuraties die `agents.defaults.model` of een agentmodel instellen op
`codex/<model>` schakelen de meegeleverde `codex`-Plugin nog steeds automatisch in. Nieuwe configuraties moeten
de voorkeur geven aan `openai/<model>` plus de expliciete `agentRuntime`-vermelding hierboven.

## Codex naast andere modellen toevoegen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen schakelen
tussen Codex- en niet-Codex-providermodellen. Een afgedwongen runtime geldt voor elke
ingebedde beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl
die runtime is afgedwongen, probeert OpenClaw nog steeds het Codex-harnas en faalt gesloten
in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Zet Codex op een speciale agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en PI-fallback voor normaal gemengd
  providergebruik.
- Gebruik verouderde `codex/*`-referenties alleen voor compatibiliteit. Nieuwe configuraties moeten de voorkeur geven aan
  `openai/*` plus een expliciet Codex-runtimebeleid.

Bijvoorbeeld: hiermee blijft de standaardagent op normale automatische selectie staan en
wordt een aparte Codex-agent toegevoegd:

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

- De standaardagent `main` gebruikt het normale providerpad en de PI-compatibiliteitsfallback.
- De agent `codex` gebruikt het Codex-app-serverharnas.
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
| "Stuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                      |
| "Gebruik Codex als runtime voor deze agent"             | configuratiewijziging naar `agentRuntime.id`     |
| "Gebruik mijn ChatGPT/Codex-abonnement met normale OpenClaw" | `openai-codex/*`-modelreferenties                |
| "Voer Codex uit via ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en geen native subagents |

OpenClaw adverteert ACP-spawnrichtlijnen alleen aan agents wanneer ACP is ingeschakeld,
dispatchbaar is en wordt ondersteund door een geladen runtimebackend. Als ACP niet beschikbaar is,
moeten de systeemprompt en plugin-Skills de agent geen ACP-routering aanleren.

## Alleen-Codex-implementaties

Dwing het Codex-harnas af wanneer je moet bewijzen dat elke ingebedde agentbeurt
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
app-server te oud is, of de app-server niet kan starten. Stel
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` alleen in als je bewust wilt dat PI
ontbrekende harnasselectie afhandelt.

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

Gebruik normale sessieopdrachten om tussen agents en modellen te schakelen. `/new` maakt een nieuwe
OpenClaw-sessie en het Codex-harnas maakt of hervat indien nodig zijn sidecar-app-serverthread.
`/reset` wist de OpenClaw-sessiebinding voor die thread
en laat de volgende beurt het harnas opnieuw afleiden uit de huidige configuratie.

## Modeldetectie

Standaard vraagt de Codex-plugin de app-server om beschikbare modellen. Als
detectie faalt of een time-out krijgt, gebruikt deze een meegeleverde fallbackcatalogus voor:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Je kunt detectie afstellen onder `plugins.entries.codex.config.discovery`:

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

Schakel detectie uit wanneer je wilt dat het opstarten Codex niet peilt en bij de
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

## App-serververbinding en -beleid

Standaard start de plugin de beheerde Codex-binary van OpenClaw lokaal met:

```bash
codex app-server --listen stdio://
```

De beheerde binary is gedeclareerd als meegeleverde plugin-runtimeafhankelijkheid en wordt gestaged
met de rest van de afhankelijkheden van de plugin `codex`. Hierdoor blijft de app-serverversie
gekoppeld aan de meegeleverde plugin in plaats van aan welke afzonderlijke Codex-CLI
toevallig lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer je
bewust een ander uitvoerbaar bestand wilt uitvoeren.

Standaard start OpenClaw lokale Codex-harnassessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt
voor autonome Heartbeats: Codex kan shell- en netwerktools gebruiken zonder
te stoppen op native goedkeuringsprompts die niemand kan beantwoorden.

Om je aan te melden voor door Codex-guardian beoordeelde goedkeuringen, stel je `appServer.mode:
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

Guardian-modus gebruikt het native automatisch beoordeelde goedkeuringspad van Codex. Wanneer Codex vraagt om
de sandbox te verlaten, buiten de werkruimte te schrijven of machtigingen toe te voegen zoals netwerktoegang,
routeert Codex dat goedkeuringsverzoek naar de native beoordelaar in plaats van naar een
menselijke prompt. De beoordelaar past het risicokader van Codex toe en keurt het specifieke verzoek goed of af.
Gebruik Guardian wanneer je meer vangrails wilt dan in YOLO-modus,
maar nog steeds onbeheerde agents voortgang moeten kunnen laten boeken.

De preset `guardian` wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"`.
Individuele beleidsvelden overschrijven nog steeds `mode`, dus geavanceerde implementaties kunnen
de preset combineren met expliciete keuzes. De oudere reviewerwaarde `guardian_subagent` wordt
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

Stdio-app-serverstarts erven standaard de procesomgeving van OpenClaw,
maar OpenClaw beheert de accountbridge van de Codex-app-server en zet zowel
`CODEX_HOME` als `HOME` op per-agentmappen onder de OpenClaw-status van die agent.
De eigen skill-lader van Codex leest `$CODEX_HOME/skills` en
`$HOME/.agents/skills`, dus beide waarden zijn geïsoleerd voor lokale app-serverstarts.
Dat houdt Codex-native skills, plugins, configuratie, accounts en threadstatus
afgebakend tot de OpenClaw-agent in plaats van dat ze binnenlekken vanuit de persoonlijke
Codex-CLI-home van de operator.

OpenClaw-plugins en OpenClaw-skillsnapshots blijven via het eigen
pluginregister en de eigen skill-lader van OpenClaw lopen. Persoonlijke Codex-CLI-assets doen dat niet. Als je
nuttige Codex-CLI-skills of plugins hebt die onderdeel moeten worden van een OpenClaw-agent,
inventariseer ze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

De Codex-migratieprovider kopieert Skills naar de huidige OpenClaw-agentwerkruimte.
Codex-native plugins, hooks en configuratiebestanden worden gemeld of gearchiveerd
voor handmatige beoordeling in plaats van automatisch geactiveerd, omdat ze
opdrachten kunnen uitvoeren, MCP-servers kunnen blootstellen of referenties kunnen bevatten.

Authenticatie wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-authenticatie
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authenticatieprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Dat
houdt API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex-app-serverbeurten per ongeluk via de API worden gefactureerd.
Expliciete Codex-API-sleutelprofielen en lokale stdio-env-sleutelfallback gebruiken app-serverlogin
in plaats van geërfde childprocesomgeving. WebSocket-app-serververbindingen
ontvangen geen Gateway-env-API-sleutelfallback; gebruik een expliciet authenticatieprofiel of het
eigen account van de externe app-server.

Als een implementatie aanvullende omgevingsisolatie nodig heeft, voeg die variabelen dan toe aan
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

`appServer.clearEnv` heeft alleen invloed op het gespawnde Codex-app-server-childproces.

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` verbindt met `url`.                                                                                                                                                                             |
| `command`           | beheerd Codex-binair bestand             | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om het beheerde binaire bestand te gebruiken; stel het alleen in voor een expliciete overschrijving.                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                                                                                                                     |
| `url`               | niet ingesteld                           | WebSocket-app-server-URL.                                                                                                                                                                                                            |
| `authToken`         | niet ingesteld                           | Bearer-token voor WebSocket-transport.                                                                                                                                                                                               |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio-app-serverproces nadat OpenClaw de overgeerfde omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's Codex-isolatie per agent bij lokale starts. |
| `requestTimeoutMs`  | `60000`                                  | Timeout voor control-plane-aanroepen naar app-server.                                                                                                                                                                                |
| `mode`              | `"yolo"`                                 | Voorinstelling voor YOLO- of door guardian beoordeelde uitvoering.                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread start/resume/turn wordt gestuurd.                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread start/resume wordt gestuurd.                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een verouderde alias.                                                                                                    |
| `serviceTier`       | niet ingesteld                           | Optionele Codex app-server-servicetier: `"fast"`, `"flex"` of `null`. Ongeldige verouderde waarden worden genegeerd.                                                                                                                |

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk van
`appServer.requestTimeoutMs` begrensd: elk Codex `item/tool/call`-verzoek moet
binnen 30 seconden een OpenClaw-antwoord ontvangen. Bij een timeout breekt
OpenClaw het toolsignaal af waar dat wordt ondersteund en retourneert het een
mislukt dynamic-tool-antwoord aan Codex zodat de beurt kan doorgaan in plaats
van de sessie in `processing` achter te laten.

Nadat OpenClaw antwoordt op een Codex-turn-scoped app-server-verzoek, verwacht
de harness ook dat Codex de native beurt afrondt met `turn/completed`. Als de
app-server daarna 60 seconden stil blijft, onderbreekt OpenClaw naar beste
vermogen de Codex-beurt, registreert het een diagnostische timeout en geeft het
de OpenClaw-sessielaan vrij zodat vervolggespreksberichten niet achter een
verouderde native beurt in de wachtrij blijven staan.

Omgevingsoverschrijvingen blijven beschikbaar voor lokaal testen:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt het beheerde binaire bestand wanneer
`appServer.command` niet is ingesteld.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Configuratie
heeft de voorkeur voor herhaalbare implementaties omdat dit het plugin-gedrag in
hetzelfde beoordeelde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiehandleiding:
[Codex-computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktopbesturingsapp niet en voert zelf
geen desktopacties uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is, en laat Codex vervolgens de native
MCP-toolaanroepen afhandelen tijdens Codex-modusbeurten.

Voor directe TryCua-drivertoegang buiten de Codex-marketplace-flow registreert u
`cua-driver mcp` met `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zie [Codex-computergebruik](/nl/plugins/codex-computer-use) voor het onderscheid
tussen Codex-eigen computergebruik en directe MCP-registratie.

Minimale configuratie:

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

De installatie kan via het commandoppervlak worden gecontroleerd of geïnstalleerd:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computergebruik is macOS-specifiek en kan lokale OS-machtigingen vereisen voordat
de Codex MCP-server apps kan bedienen. Als `computerUse.enabled` waar is en de
MCP-server niet beschikbaar is, mislukken Codex-modusbeurten voordat de thread
start in plaats van stilzwijgend zonder de native computergebruik-tools te
draaien. Zie [Codex-computergebruik](/nl/plugins/codex-computer-use) voor
marketplace-keuzes, limieten van externe catalogi, statusredenen en
probleemoplossing.

Wanneer `computerUse.autoInstall` waar is, kan OpenClaw de standaard gebundelde
Codex Desktop-marketplace registreren vanaf
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marketplace heeft ontdekt. Gebruik `/new` of `/reset` na het
wijzigen van runtime- of computergebruik-configuratie zodat bestaande sessies
geen oude PI- of Codex-threadbinding behouden.

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

Alleen-Codex-harnessvalidatie:

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

Modelwisseling blijft door OpenClaw beheerd. Wanneer een OpenClaw-sessie aan een
bestaande Codex-thread is gekoppeld, stuurt de volgende beurt opnieuw het
momenteel geselecteerde OpenAI-model, de provider, het goedkeuringsbeleid, de
sandbox en de servicetier naar app-server. Overschakelen van `openai/gpt-5.5`
naar `openai/gpt-5.2` behoudt de threadbinding maar vraagt Codex door te gaan met
het nieuw geselecteerde model.

## Codex-opdracht

De gebundelde plugin registreert `/codex` als een geautoriseerde slash-opdracht.
Deze is generiek en werkt op elk kanaal dat OpenClaw-tekstopdrachten ondersteunt.

Veelgebruikte vormen:

- `/codex status` toont live app-server-connectiviteit, modellen, account, ratelimieten, MCP-servers en skills.
- `/codex models` toont live Codex app-server-modellen.
- `/codex threads [filter]` toont recente Codex-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te compacten.
- `/codex review` start een native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt toestemming voordat diagnostische Codex-feedback voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde computergebruik-plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde computergebruik-plugin en herlaadt MCP-servers.
- `/codex account` toont account- en ratelimitstatus.
- `/codex mcp` toont de MCP-serverstatus van Codex app-server.
- `/codex skills` toont Codex app-server-skills.

### Veelgebruikte debuggingworkflow

Wanneer een door Codex ondersteunde agent iets verrassends doet in Telegram,
Discord, Slack of een ander kanaal, begin dan met het gesprek waarin het probleem
optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit of een andere korte
   notitie die beschrijft wat u zag.
2. Keur het diagnostiekverzoek eenmaal goed. De goedkeuring maakt de lokale Gateway
   diagnostics-zip en, omdat de sessie de Codex-harness gebruikt, verzendt ook
   de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostiekantwoord naar het bugrapport of de supportthread.
   Het bevat het lokale bundelpad, de privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een `Inspect locally`-regel voor elke Codex-thread.
4. Als u de run zelf wilt debuggen, voer dan de afgedrukte `Inspect locally`-
   opdracht uit in een terminal. Deze ziet eruit als `codex resume <thread-id>` en
   opent de native Codex-thread zodat u het gesprek kunt inspecteren, het lokaal
   kunt voortzetten of Codex kunt vragen waarom het een bepaalde tool of plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige OpenClaw Gateway-diagnosebundel. Voor de meeste ondersteuningsrapporten is `/diagnostics [note]` het betere startpunt, omdat dit de lokale Gateway-status en Codex-thread-id's in een enkel antwoord aan elkaar koppelt. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het volledige privacymodel en het gedrag in groepschats.

Core OpenClaw stelt ook de alleen-voor-eigenaren bedoelde `/diagnostics [note]` beschikbaar als de algemene Gateway-diagnoseopdracht. De goedkeuringsprompt toont de inleiding over gevoelige gegevens, linkt naar [Diagnostiekexport](/nl/gateway/diagnostics), en vraagt elke keer via expliciete exec-goedkeuring `openclaw gateway diagnostics export --json` aan. Keur diagnostiek niet goed met een allow-all-regel. Na goedkeuring verstuurt OpenClaw een plakbaar rapport met het lokale bundelpad en de manifestsamenvatting. Wanneer de actieve OpenClaw-sessie de Codex-harness gebruikt, geeft diezelfde goedkeuring ook toestemming om de relevante Codex-feedbackbundels naar OpenAI-servers te sturen. De goedkeuringsprompt vermeldt dat Codex-feedback wordt verzonden, maar toont vóór goedkeuring geen Codex-sessie- of thread-id's.

Als `/diagnostics` door een eigenaar in een groepschat wordt aangeroepen, houdt OpenClaw het gedeelde kanaal schoon: de groep ontvangt alleen een korte melding, terwijl de diagnostiekinleiding, goedkeuringsprompts en Codex-sessie-/thread-id's via de privégoedkeuringsroute naar de eigenaar worden gestuurd. Als er geen privéroute naar de eigenaar is, weigert OpenClaw het groepsverzoek en vraagt het de eigenaar om het vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept Codex app-server `feedback/upload` aan en vraagt app-server om logs op te nemen voor elke vermelde thread en voortgebrachte Codex-subthreads wanneer die beschikbaar zijn. De upload verloopt via het normale feedbackpad van Codex naar OpenAI-servers; als Codex-feedback in die app-server is uitgeschakeld, retourneert de opdracht de app-serverfout. Het voltooide diagnostiekantwoord vermeldt de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale `codex resume <thread-id>`-opdrachten voor de threads die zijn verzonden. Als je de goedkeuring weigert of negeert, drukt OpenClaw die Codex-id's niet af. Deze upload vervangt de lokale Gateway-diagnostiekexport niet.

`/codex resume` schrijft hetzelfde sidecar-bindingsbestand dat de harness voor normale beurten gebruikt. Bij het volgende bericht hervat OpenClaw die Codex-thread, geeft het het momenteel geselecteerde OpenClaw-model door aan app-server, en houdt het uitgebreide geschiedenis ingeschakeld.

### Een Codex-thread inspecteren vanuit de CLI

De snelste manier om een slechte Codex-run te begrijpen is vaak om de native Codex-thread direct te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug in een kanaalgesprek opmerkt en de problematische Codex-sessie wilt inspecteren, deze lokaal wilt voortzetten, of Codex wilt vragen waarom het een bepaalde tool- of redeneerkeuze heeft gemaakt. De gemakkelijkste route is meestal om eerst `/diagnostics [note]` uit te voeren: nadat je dit hebt goedgekeurd, vermeldt het voltooide rapport elke Codex-thread en drukt het een `Inspect locally`-opdracht af, bijvoorbeeld `codex resume <thread-id>`. Je kunt die opdracht direct naar een terminal kopiëren.

Je kunt ook een thread-id ophalen via `/codex binding` voor de huidige chat of `/codex threads [filter]` voor recente Codex app-server-threads, en daarna dezelfde `codex resume`-opdracht in je shell uitvoeren.

Het opdrachtoppervlak vereist Codex app-server `0.125.0` of nieuwer. Afzonderlijke controlemethoden worden gerapporteerd als `unsupported by this Codex app-server` als een toekomstige of aangepaste app-server die JSON-RPC-methode niet aanbiedt.

## Hook-grenzen

De Codex-harness heeft drie hook-lagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin-hooks                 | OpenClaw                 | Product-/Plugin-compatibiliteit tussen PI- en Codex-harnassen.      |
| Codex app-server-extensiemiddleware   | OpenClaw gebundelde plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.          |
| Native Codex-hooks                    | Codex                    | Low-level Codex-levenscyclus en native toolbeleid vanuit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex `hooks.json`-bestanden om OpenClaw Plugin-gedrag te routeren. Voor de ondersteunde native tool- en toestemmingsbridge injecteert OpenClaw per-thread Codex-configuratie voor `PreToolUse`, `PostToolUse`, `PermissionRequest`, en `Stop`. Andere Codex-hooks zoals `SessionStart` en `UserPromptSubmit` blijven besturing op Codex-niveau; ze worden in het v1-contract niet als OpenClaw Plugin-hooks blootgesteld.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de aanroep vraagt, dus OpenClaw triggert het Plugin- en middlewaregedrag waarvan het eigenaar is in de harness-adapter. Voor Codex-native tools is Codex eigenaar van het canonieke toolrecord. OpenClaw kan geselecteerde gebeurtenissen spiegelen, maar kan de native Codex-thread niet herschrijven tenzij Codex die bewerking via app-server of native hook-callbacks blootstelt.

Compaction- en LLM-levenscyclusprojecties komen uit Codex app-server-meldingen en OpenClaw-adapterstatus, niet uit native Codex-hookopdrachten. OpenClaw's `before_compaction`, `after_compaction`, `llm_input`, en `llm_output`-gebeurtenissen zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen van Codex's interne verzoek- of Compaction-payloads.

Codex-native `hook/started`- en `hook/completed`-app-servermeldingen worden geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor traject en debugging. Ze roepen geen OpenClaw Plugin-hooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex beheert meer van de native modellus, en OpenClaw past zijn Plugin- en sessieoppervlakken rond die grens aan.

Ondersteund in Codex runtime v1:

| Oppervlak                                    | Ondersteuning                          | Waarom                                                                                                                                                                                               |
| -------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                    | Ondersteund                            | Codex app-server beheert de OpenAI-beurt, native thread-hervatting en native toolvoortzetting.                                                                                                       |
| OpenClaw-kanaalroutering en levering         | Ondersteund                            | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                      |
| Dynamische OpenClaw-tools                    | Ondersteund                            | Codex vraagt OpenClaw om deze tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.                                                                                                        |
| Prompt- en contextplugins                    | Ondersteund                            | OpenClaw bouwt promptoverlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                    |
| Levenscyclus van context-engine              | Ondersteund                            | Samenstellen, opnemen of onderhoud na de beurt, en coördinatie van context-engine-Compaction worden uitgevoerd voor Codex-beurten.                                                                   |
| Dynamische tool-hooks                        | Ondersteund                            | `before_tool_call`, `after_tool_call`, en tool-resultmiddleware draaien rond dynamische tools die eigendom zijn van OpenClaw.                                                                        |
| Levenscyclus-hooks                           | Ondersteund als adapterobservaties     | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, en `after_compaction` worden geactiveerd met eerlijke Codex-modus-payloads.                                                            |
| Revisiepoort voor eindantwoord               | Ondersteund via de native hook-relay   | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog één modelpassage vóór finalisatie.                                                                        |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via de native hook-relay | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor vastgelegde native tooloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native toestemmingsbeleid                    | Ondersteund via de native hook-relay   | Codex `PermissionRequest` kan via OpenClaw-beleid worden gerouteerd waar de runtime dit blootstelt. Als OpenClaw geen beslissing retourneert, gaat Codex verder via zijn normale guardian- of gebruikersgoedkeuringspad. |
| Trajectvastlegging van app-server            | Ondersteund                            | OpenClaw registreert het verzoek dat het naar app-server heeft gestuurd en de app-servermeldingen die het ontvangt.                                                                                  |

Niet ondersteund in Codex runtime v1:

| Oppervlak                                          | V1-grens                                                                                                                                          | Toekomstig pad                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mutatie van native toolargumenten                  | Codex native pre-tool-hooks kunnen blokkeren, maar OpenClaw herschrijft geen Codex-native toolargumenten.                                        | Vereist Codex-hook-/schemaondersteuning voor vervangende toolinvoer.                            |
| Bewerkbare Codex-native transcriptgeschiedenis     | Codex bezit de canonieke native threadgeschiedenis. OpenClaw bezit een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native thread-chirurgie nodig is.                 |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, geen Codex-native toolrecords.                                           | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning.  |
| Rijke native Compaction-metadata                   | OpenClaw observeert de start en voltooiing van Compaction, maar ontvangt geen stabiele lijst met behouden/verwijderde items, tokendelta of samenvattingspayload. | Vereist rijkere Codex Compaction-events.                                                        |
| Compaction-interventie                             | Huidige OpenClaw Compaction-hooks zijn op meldingsniveau in Codex-modus.                                                                         | Voeg Codex pre-/post-Compaction-hooks toe als plugins native Compaction moeten vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-aanvragen | OpenClaw kan app-server-aanvragen en meldingen vastleggen, maar Codex core bouwt de uiteindelijke OpenAI API-aanvraag intern.                    | Vereist een Codex model-request-tracingevent of debug-API.                                      |

## Tools, media en Compaction

De Codex-harness wijzigt alleen de low-level ingesloten agent-executor.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van de
harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en output van
messaging-tools blijven via het normale OpenClaw-leveringspad lopen.

De native hookrelay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de Codex-native tool- en permissiepaden die OpenClaw test. In de
Codex-runtime omvat dat shell-, patch- en MCP-`PreToolUse`-,
`PostToolUse`- en `PermissionRequest`-payloads. Ga er niet van uit dat elk toekomstig
Codex-hookevent een OpenClaw plugin-oppervlak is totdat het runtimecontract
het benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of weigeren-beslissingen
wanneer beleid beslist. Een resultaat zonder beslissing is geen toestemming. Codex behandelt het als geen
hookbeslissing en valt terug op zijn eigen guardian- of gebruikersgoedkeuringspad.

Codex MCP-toolgoedkeuringselicitaties worden via de plugin-goedkeuringsflow van OpenClaw
geleid wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex-`request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende in de wachtrij geplaatste vervolgbericht beantwoordt die native
serveraanvraag in plaats van als extra context te worden gestuurd. Andere MCP-elicitation
requests falen nog steeds gesloten.

Active-run-wachtrijsturing wordt gemapt op Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` bundelt OpenClaw chatberichten in de wachtrij
voor het geconfigureerde stiltevenster en verzendt ze als één `turn/steer`-aanvraag in
aankomstvolgorde. Legacy `queue`-modus verzendt afzonderlijke `turn/steer`-aanvragen. Codex
review- en handmatige Compaction-turns kunnen same-turn steering weigeren; in dat geval
gebruikt OpenClaw de followup-wachtrij wanneer de geselecteerde modus fallback toestaat. Zie
[Sturingswachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt native thread-Compaction
gedelegeerd aan Codex app-server. OpenClaw houdt een transcriptspiegel bij voor kanaalgeschiedenis,
zoeken, `/new`, `/reset` en toekomstige model- of harnesswisseling. De
spiegel bevat de gebruikersprompt, definitieve assistenttekst en lichte Codex
reasoning- of planrecords wanneer de app-server die emitteert. Op dit moment registreert OpenClaw alleen
start- en voltooiingssignalen van native Compaction. Het stelt nog geen
menselijk leesbare Compaction-samenvatting of controleerbare lijst beschikbaar van welke items Codex
na Compaction heeft behouden.

Omdat Codex de canonieke native thread bezit, herschrijft `tool_result_persist` momenteel geen
Codex-native toolresultaatrecords. Het wordt alleen toegepast wanneer
OpenClaw een toolresultaat naar een OpenClaw-eigen sessietranscript schrijft.

Mediageneratie vereist geen PI. Afbeeldingen, video, muziek, PDF, TTS en media-understanding
blijven de bijbehorende provider-/modelinstellingen gebruiken, zoals
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en
`messages.tts`.

## Probleemoplossing

**Codex verschijnt niet als normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model met
`agentRuntime.id: "codex"` (of een legacy `codex/*`-ref), schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan nog steeds PI gebruiken als de
compatibility-backend wanneer geen Codex-harness de run claimt. Stel
`agentRuntime.id: "codex"` in om Codex-selectie tijdens het testen af te dwingen. Een
afgedwongen Codex-runtime faalt nu in plaats van terug te vallen op PI, tenzij je
expliciet `agentRuntime.fallback: "pi"` instelt. Zodra Codex app-server is
geselecteerd, komen de fouten ervan direct naar voren zonder extra fallbackconfiguratie.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake
versie `0.125.0` of nieuwer meldt. Prereleases met dezelfde versie of versies met buildsuffix
zoals `0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat de
stabiele protocolondergrens `0.125.0` is wat OpenClaw test.

**Modeldetectie is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel detectie uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`,
en of de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een legacy
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven op hun normale
providerpad in `auto`-modus. Als je `agentRuntime.id: "codex"` afdwingt, moet elke ingesloten
turn voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geinstalleerd maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan `/new` of `/reset`; als het aanhoudt, herstart
de gateway om verouderde native hookregistraties te wissen. Als `computer-use.list_apps`
een timeout geeft, herstart Codex Computer Use of Codex Desktop en probeer opnieuw.

## Gerelateerd

- [Agent-harnessplugins](/nl/plugins/sdk-agent-harness)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin-hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
