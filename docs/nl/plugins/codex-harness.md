---
read_when:
    - Je wilt het meegeleverde Codex-app-serverharnas gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat Codex-only-implementaties falen in plaats van terug te vallen op Pi
summary: Voer ingebedde agentbeurten van OpenClaw uit via het meegeleverde Codex app-server-harnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-03T11:12:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

De meegeleverde `codex`-Plugin laat OpenClaw ingebedde agentbeurten uitvoeren via de
Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex de laaggelegen agentsessie beheert: modeldetectie,
native threadhervatting, native Compaction en app-serveruitvoering.
OpenClaw blijft verantwoordelijk voor chatkanalen, sessiebestanden, modelselectie, tools,
goedkeuringen, medialevering en de zichtbare transcriptspiegel.

Wanneer een bronchatbeurt via de Codex-harness wordt uitgevoerd, gebruiken zichtbare antwoorden standaard
de OpenClaw `message`-tool als de deployment niet expliciet
`messages.visibleReplies` heeft geconfigureerd. De agent kan zijn Codex-beurt nog steeds privé afronden;
hij plaatst alleen iets in het kanaal wanneer hij `message(action="send")` aanroept. Stel
`messages.visibleReplies: "automatic"` in om definitieve antwoorden in directe chats op het
oude automatische afleverpad te houden.

Codex Heartbeat-beurten krijgen ook standaard de `heartbeat_respond`-tool, zodat de
agent kan vastleggen of de wake stil moet blijven of moet melden, zonder die
control flow in de definitieve tekst te coderen.

Als je je probeert te oriënteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Snelle configuratie

De meeste gebruikers die "Codex in OpenClaw" willen, willen deze route: aanmelden met een
ChatGPT/Codex-abonnement en vervolgens ingebedde agentbeurten uitvoeren via de native
Codex app-serverruntime. De modelreferentie blijft canoniek als
`openai/gpt-*`; abonnementsauthenticatie komt van het Codex-account/profiel, niet
van een `openai-codex/*`-modelprefix.

Meld je eerst aan met Codex OAuth als je dat nog niet hebt gedaan:

```bash
openclaw models auth login --provider openai-codex
```

Schakel daarna de meegeleverde `codex`-Plugin in en forceer de Codex-runtime:

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

Gebruik `openai-codex/gpt-*` niet wanneer je de native Codex-runtime bedoelt. Die prefix
is de expliciete route "Codex OAuth via PI". Configuratiewijzigingen gelden voor nieuwe of
geresette sessies; bestaande sessies behouden hun vastgelegde runtime.

## Wat deze Plugin wijzigt

De meegeleverde `codex`-Plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                      | Hoe je die gebruikt                                | Wat die doet                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingebedde runtime          | `agentRuntime.id: "codex"`                          | Voert OpenClaw ingebedde agentbeurten uit via de Codex app-server.            |
| Native chatbeheercommando's       | `/codex bind`, `/codex resume`, `/codex steer`, ... | Koppelt en beheert Codex app-serverthreads vanuit een berichtenconversatie.   |
| Codex app-serverprovider/catalogus | `codex`-internals, beschikbaar via de harness       | Laat de runtime app-servermodellen ontdekken en valideren.                    |
| Codex-pad voor mediabegrip        | `codex/*` compatibiliteitspaden voor beeldmodellen  | Voert begrensde Codex app-serverbeurten uit voor ondersteunde beeldbegripmodellen. |
| Native hookrelay                  | Plugin-hooks rond Codex-native events               | Laat OpenClaw ondersteunde Codex-native tool-/afrondingsevents observeren/blokkeren. |

Het inschakelen van de Plugin maakt die mogelijkheden beschikbaar. Het doet **niet** het volgende:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelreferenties omzetten naar de native runtime
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies hot-switchen die al een PI-runtime hebben vastgelegd
- OpenClaw-kanaalaflevering, sessiebestanden, auth-profielopslag of
  berichtroutering vervangen

Dezelfde Plugin is ook eigenaar van het native `/codex` chatbeheercommandoppervlak. Als
de Plugin is ingeschakeld en de gebruiker vraagt om Codex-threads vanuit chat te koppelen,
hervatten, sturen, stoppen of inspecteren, moeten agents de voorkeur geven aan `/codex ...` boven ACP. ACP blijft
de expliciete terugval wanneer de gebruiker om ACP/acpx vraagt of de ACP
Codex-adapter test.

Native Codex-beurten behouden OpenClaw Plugin-hooks als de publieke compatibiliteitslaag.
Dit zijn in-process OpenClaw-hooks, geen Codex `hooks.json`-commandhooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` voor gespiegeld transcriptrecords
- `before_agent_finalize` via Codex `Stop`-relay
- `agent_end`

Plugins kunnen ook runtime-neutrale middleware voor toolresultaten registreren om
dynamische OpenClaw-toolresultaten te herschrijven nadat OpenClaw de tool uitvoert en voordat het
resultaat aan Codex wordt teruggegeven. Dit staat los van de publieke
`tool_result_persist` Plugin-hook, die door OpenClaw beheerde transcriptwrites voor toolresultaten
transformeert.

Voor de semantiek van de Plugin-hooks zelf, zie [Plugin-hooks](/nl/plugins/hooks)
en [Plugin-guardgedrag](/nl/tools/plugin).

De harness staat standaard uit. Nieuwe configuraties moeten OpenAI-modelreferenties
canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` forceren wanneer ze
native app-serveruitvoering willen. Oude `codex/*`-modelreferenties selecteren nog steeds automatisch
de harness voor compatibiliteit, maar runtime-ondersteunde oude providerprefixen worden
niet weergegeven als normale model-/providerkeuzes.

Als de `codex`-Plugin is ingeschakeld maar het primaire model nog steeds
`openai-codex/*` is, waarschuwt `openclaw doctor` in plaats van de route te wijzigen. Dat is
bewust: `openai-codex/*` blijft het PI Codex OAuth-/abonnementspad, en
native app-serveruitvoering blijft een expliciete runtimekeuze.

## Routekaart

Gebruik deze tabel voordat je configuratie wijzigt:

| Gewenst gedrag                                      | Modelreferentie          | Runtimeconfiguratie                   | Auth-/profielroute          | Verwacht statuslabel           |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ChatGPT/Codex-abonnement met native Codex-runtime | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth of Codex-account | `Runtime: OpenAI Codex`        |
| OpenAI API via normale OpenClaw-runner            | `openai/gpt-*`             | weggelaten of `runtime: "pi"`          | OpenAI API-sleutel           | `Runtime: OpenClaw Pi Default` |
| ChatGPT/Codex-abonnement via PI                   | `openai-codex/gpt-*`       | weggelaten of `runtime: "pi"`          | OpenAI Codex OAuth-provider  | `Runtime: OpenClaw Pi Default` |
| Gemengde providers met conservatieve automatische modus | providerspecifieke referenties | `agentRuntime.id: "auto"`          | Per geselecteerde provider   | Hangt af van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie                | afhankelijk van ACP-prompt/model | `sessions_spawn` met `runtime: "acp"` | ACP-backendauthenticatie     | ACP-taak-/sessiestatus         |

Het belangrijke onderscheid is provider versus runtime:

- `openai-codex/*` beantwoordt "welke provider-/authroute moet PI gebruiken?"
- `agentRuntime.id: "codex"` beantwoordt "welke loop moet deze
  ingebedde beurt uitvoeren?"
- `/codex ...` beantwoordt "welke native Codex-conversatie moet deze chat koppelen
  of beheren?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

OpenAI-familieroutes zijn prefixspecifiek. Voor de gangbare setup met abonnement plus
native Codex-runtime gebruik je `openai/*` met `agentRuntime.id: "codex"`.
Gebruik `openai-codex/*` alleen wanneer je bewust Codex OAuth via PI wilt:

| Modelreferentie                              | Runtimepad                                  | Gebruik wanneer                                                           |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-provider via OpenClaw/PI-plumbing     | Je huidige directe OpenAI Platform API-toegang met `OPENAI_API_KEY` wilt. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth via OpenClaw/PI           | Je ChatGPT/Codex-abonnementsauthenticatie met de standaard PI-runner wilt. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-serverharness                      | Je ChatGPT/Codex-abonnementsauthenticatie met native Codex-uitvoering wilt. |

GPT-5.5 kan zowel op directe OpenAI API-sleutelroutes als Codex-abonnementsroutes verschijnen
wanneer je account die beschikbaar stelt. Gebruik `openai/gpt-5.5` met de Codex app-server
harness voor native Codex-runtime, `openai-codex/gpt-5.5` voor PI OAuth, of
`openai/gpt-5.5` zonder Codex-runtimeoverride voor direct API-sleutelverkeer.

Oude `codex/gpt-*`-referenties blijven geaccepteerd als compatibiliteitsaliassen. Doctor-
compatibiliteitsmigratie herschrijft oude primaire runtimereferenties naar canonieke modelreferenties
en legt het runtimebeleid afzonderlijk vast, terwijl alleen-terugval oude referenties
ongewijzigd blijven omdat runtime voor de hele agentcontainer wordt geconfigureerd.
Nieuwe PI Codex OAuth-configuraties moeten `openai-codex/gpt-*` gebruiken; nieuwe native
app-serverharnessconfiguraties moeten `openai/gpt-*` plus
`agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt hetzelfde prefixonderscheid. Gebruik
`openai-codex/gpt-*` wanneer beeldbegrip via het OpenAI
Codex OAuth-providerpad moet lopen. Gebruik `codex/gpt-*` wanneer beeldbegrip via
een begrensde Codex app-serverbeurt moet lopen. Het Codex app-servermodel moet
ondersteuning voor beeldinvoer adverteren; tekst-alleen Codex-modellen falen voordat de mediabeurt
start.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen. Als de
selectie verrassend is, schakel dan debuglogging in voor het `agents/harness`-subsysteem
en inspecteer het gestructureerde `agent harness selected`-record van de Gateway. Het
bevat de geselecteerde harness-id, selectiereden, runtime-/terugvalbeleid en,
in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

### Wat doctorwaarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer al het volgende waar is:

- de meegeleverde `codex`-Plugin is ingeschakeld of toegestaan
- het primaire model van een agent is `openai-codex/*`
- de effectieve runtime van die agent is niet `codex`

Die waarschuwing bestaat omdat gebruikers vaak verwachten dat "Codex-Plugin ingeschakeld" impliceert
"native Codex app-serverruntime." OpenClaw maakt die sprong niet. De waarschuwing
betekent:

- **Er is geen wijziging nodig** als je ChatGPT/Codex OAuth via PI bedoelde.
- Wijzig het model naar `openai/<model>` en stel
  `agentRuntime.id: "codex"` in als je native app-serveruitvoering
  bedoelde.
- Bestaande sessies hebben nog steeds `/new` of `/reset` nodig na een runtimewijziging,
  omdat sessieruntimepinnen plakkerig zijn.

Harnessselectie is geen live sessiebeheer. Wanneer een ingebedde beurt draait,
legt OpenClaw de geselecteerde harness-id vast op die sessie en blijft die gebruiken voor
latere beurten in dezelfde sessie-id. Wijzig `agentRuntime`-configuratie of
`OPENCLAW_AGENT_RUNTIME` wanneer je wilt dat toekomstige sessies een andere harness gebruiken;
gebruik `/new` of `/reset` om een nieuwe sessie te starten voordat je een bestaande
conversatie tussen PI en Codex wisselt. Dit voorkomt dat één transcript via
twee incompatibele native sessiesystemen wordt afgespeeld.

Oude sessies die vóór harnesspinnen zijn gemaakt, worden behandeld als PI-gepind zodra ze
transcriptgeschiedenis hebben. Gebruik `/new` of `/reset` om die conversatie na
een configuratiewijziging in Codex te laten instappen.

`/status` toont de effectieve modelruntime. Het standaard PI-harnas verschijnt als
`Runtime: OpenClaw Pi Default`, en het Codex app-server-harnas verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de gebundelde `codex`-plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De gebundelde plugin beheert standaard een compatibele
  Codex app-server-binary, dus lokale `codex`-commando's op `PATH` hebben
  geen invloed op normaal opstarten van het harnas.
- Codex-authenticatie beschikbaar voor het app-server-proces of voor de Codex-authenticatiebrug
  van OpenClaw. Lokale app-server-starts gebruiken een door OpenClaw beheerde Codex home voor elke
  agent en een geisoleerde child-`HOME`, zodat ze standaard je persoonlijke
  `~/.codex`-account, Skills, plugins, configuratie, threadstatus of native
  `$HOME/.agents/skills` niet lezen.

De plugin blokkeert oudere of niet-geversioneerde app-server-handshakes. Dat houdt
OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt authenticatie meestal van het Codex CLI-account
of een OpenClaw `openai-codex`-authenticatieprofiel. Lokale stdio app-server-starts kunnen
ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Bootstrapbestanden voor de werkruimte

Codex verwerkt `AGENTS.md` zelf via native projectdocumentdetectie. OpenClaw
schrijft geen synthetische Codex-projectdocumentbestanden en is niet afhankelijk van Codex-fallbackbestandsnamen
voor personabestanden, omdat Codex-fallbacks alleen gelden wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw-werkruimtepariteit lost het Codex-harnas de andere bootstrapbestanden
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, en `MEMORY.md` wanneer aanwezig) op en stuurt ze door via Codex
configuratie-instructies op `thread/start` en `thread/resume`. Zo blijven
`SOUL.md` en gerelateerde werkruimte-persona-/profielcontext zichtbaar zonder
`AGENTS.md` te dupliceren.

## Codex toevoegen naast andere modellen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen schakelen
tussen Codex- en niet-Codex-providermodellen. Een afgedwongen runtime geldt voor elke
embedded beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl
die runtime is afgedwongen, probeert OpenClaw nog steeds het Codex-harnas en faalt gesloten
in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Zet Codex op een toegewezen agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en PI-fallback voor normaal gemengd
  providergebruik.
- Gebruik verouderde `codex/*`-referenties alleen voor compatibiliteit. Nieuwe configuraties moeten de voorkeur geven aan
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

- De standaardagent `main` gebruikt het normale providerpad en PI-compatibiliteitsfallback.
- De agent `codex` gebruikt het Codex app-server-harnas.
- Als Codex ontbreekt of niet wordt ondersteund voor de agent `codex`, faalt de beurt
  in plaats van stilletjes PI te gebruiken.

## Agentopdrachtroutering

Agents moeten gebruikersverzoeken routeren op intentie, niet alleen op het woord "Codex":

| Gebruiker vraagt om...                                  | Agent moet gebruiken...                          |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bind deze chat aan Codex"                             | `/codex bind`                                    |
| "Hervat Codex-thread `<id>` hier"                      | `/codex resume <id>`                             |
| "Toon Codex-threads"                                  | `/codex threads`                                 |
| "Dien een supportrapport in voor een slechte Codex-run" | `/diagnostics [note]`                            |
| "Stuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                      |
| "Gebruik mijn ChatGPT/Codex-abonnement met Codex-runtime" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Gebruik mijn ChatGPT/Codex-abonnement via PI"         | `openai-codex/*`-modelreferenties                |
| "Voer Codex uit via ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en niet native sub-agents |

OpenClaw adverteert ACP-spawnbegeleiding alleen aan agents wanneer ACP is ingeschakeld,
verzendbaar is en wordt ondersteund door een geladen runtime-backend. Als ACP niet beschikbaar is,
mogen de systeemprompt en Plugin-Skills de agent geen ACP-routering aanleren.

## Alleen-Codex-implementaties

Dwing het Codex-harnas af wanneer je moet bewijzen dat elke embedded agentbeurt
Codex gebruikt. Expliciete pluginruntimes falen gesloten en worden nooit stilzwijgend opnieuw geprobeerd
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

Omgevingsoverschrijving:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Met Codex afgedwongen faalt OpenClaw vroeg als de Codex-plugin is uitgeschakeld, de
app-server te oud is, of de app-server niet kan starten.

## Codex per agent

Je kunt een agent alleen-Codex maken terwijl de standaardagent normale
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

Gebruik normale sessiecommando's om tussen agents en modellen te schakelen. `/new` maakt een nieuwe
OpenClaw-sessie en het Codex-harnas maakt of hervat zijn sidecar app-server-thread
wanneer nodig. `/reset` wist de OpenClaw-sessiebinding voor die thread
en laat de volgende beurt het harnas opnieuw bepalen vanuit de huidige configuratie.

## Modeldetectie

Standaard vraagt de Codex-plugin de app-server om beschikbare modellen. Als
detectie faalt of een time-out krijgt, gebruikt deze een gebundelde fallbackcatalogus voor:

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

## App-serververbinding en beleid

Standaard start de plugin de door OpenClaw beheerde Codex-binary lokaal met:

```bash
codex app-server --listen stdio://
```

De beheerde binary wordt geleverd met het `codex`-pluginpakket. Dit houdt de
app-serverversie gekoppeld aan de gebundelde plugin in plaats van aan welke aparte
Codex CLI er toevallig lokaal is geinstalleerd. Stel `appServer.command` alleen in wanneer
je bewust een ander uitvoerbaar bestand wilt draaien.

Standaard start OpenClaw lokale Codex-harnassessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt
voor autonome Heartbeats: Codex kan shell- en netwerktools gebruiken zonder
te stoppen bij native goedkeuringsprompts waarop niemand beschikbaar is om te antwoorden.

Om je aan te melden voor door een Codex-guardian beoordeelde goedkeuringen, stel `appServer.mode:
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

Guardian-modus gebruikt Codex' native auto-review-goedkeuringspad. Wanneer Codex vraagt om
de sandbox te verlaten, buiten de werkruimte te schrijven of permissies zoals netwerktoegang
toe te voegen, routeert Codex dat goedkeuringsverzoek naar de native beoordelaar in plaats van naar een
menselijke prompt. De beoordelaar past Codex' risicokader toe en keurt het specifieke
verzoek goed of af. Gebruik Guardian wanneer je meer vangrails wilt dan YOLO-modus
maar agents zonder toezicht nog steeds voortgang moeten boeken.

De preset `guardian` breidt uit naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, en `sandbox: "workspace-write"`.
Afzonderlijke beleidsvelden overschrijven nog steeds `mode`, zodat geavanceerde implementaties
de preset kunnen mengen met expliciete keuzes. De oudere beoordelaarswaarde `guardian_subagent` wordt
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

Stdio app-server-starts erven standaard OpenClaw's procesomgeving,
maar OpenClaw beheert de Codex app-server-accountbrug en zet zowel
`CODEX_HOME` als `HOME` op per-agent-mappen onder de OpenClaw-status van die agent.
Codex' eigen Skills-loader leest `$CODEX_HOME/skills` en
`$HOME/.agents/skills`, dus beide waarden zijn geisoleerd voor lokale app-server-starts.
Dat houdt Codex-native Skills, plugins, configuratie, accounts en threadstatus
binnen het bereik van de OpenClaw-agent in plaats van ze te laten lekken vanuit de persoonlijke
Codex CLI-home van de operator.

OpenClaw-plugins en OpenClaw-Skills-snapshots blijven via OpenClaw's eigen
pluginregister en Skills-loader lopen. Persoonlijke Codex CLI-assets doen dat niet. Als je
nuttige Codex CLI-Skills of plugins hebt die onderdeel moeten worden van een OpenClaw-agent,
inventariseer ze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

De Codex-migratieprovider kopieert Skills naar de huidige OpenClaw-agentwerkruimte.
Codex-native plugins, hooks en configuratiebestanden worden gerapporteerd of gearchiveerd
voor handmatige beoordeling in plaats van automatisch te worden geactiveerd, omdat ze
commando's kunnen uitvoeren, MCP-servers kunnen blootstellen of referenties kunnen bevatten.

Authenticatie wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex home van die agent.
3. Alleen voor lokale stdio app-server-starts, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-authenticatie
   nog steeds vereist is.

Wanneer OpenClaw een ChatGPT-abonnementsachtig Codex-authenticatieprofiel ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Dat
houdt Gateway-niveau API-sleutels beschikbaar voor embeddings of directe OpenAI-modellen
zonder native Codex app-server-beurten per ongeluk via de API te laten factureren.
Expliciete Codex API-sleutelprofielen en lokale stdio env-key-fallback gebruiken app-server-login
in plaats van geerfde childproces-env. WebSocket app-server-verbindingen
ontvangen geen Gateway env API-key-fallback; gebruik een expliciet authenticatieprofiel of het
eigen account van de remote app-server.

Als een implementatie extra omgevingsisolatie nodig heeft, voeg die variabelen dan toe aan
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

Dynamische tools van Codex gebruiken standaard het profiel `native-first`. In die modus
biedt OpenClaw geen dynamische tools aan die Codex-native werkruimtebewerkingen
dupliceren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` en
`update_plan`. OpenClaw-integratietools zoals berichten, sessies, media,
cron, browser, nodes, Gateway, `heartbeat_respond` en `web_search` blijven
beschikbaar.

Ondersteunde Codex Plugin-velden op het hoogste niveau:

| Veld                       | Standaard        | Betekenis                                                                                 |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gebruik `"openclaw-compat"` om de volledige dynamische toolset van OpenClaw beschikbaar te maken voor de Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Extra namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-server-beurten. |

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                    |
| `command`           | beheerde Codex-binary                    | Uitvoerbaar bestand voor stdio-transport. Laat dit oningesteld om de beheerde binary te gebruiken; stel dit alleen in voor een expliciete override.                                                                                 |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                                                                                                                    |
| `url`               | oningesteld                              | WebSocket-URL van de app-server.                                                                                                                                                                                                    |
| `authToken`         | oningesteld                              | Bearer-token voor WebSocket-transport.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio app-server-proces nadat OpenClaw de overgeërfde omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's Codex-isolatie per agent bij lokale starts. |
| `requestTimeoutMs`  | `60000`                                  | Time-out voor control-plane-aanroepen van de app-server.                                                                                                                                                                            |
| `mode`              | `"yolo"`                                 | Voorinstelling voor YOLO- of door guardian beoordeelde uitvoering.                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread starten/hervatten/beurt wordt gestuurd.                                                                                                                                             |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread starten/hervatten wordt gestuurd.                                                                                                                                                         |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een legacy-alias.                                                                                                       |
| `serviceTier`       | oningesteld                              | Optionele Codex app-server-servicetier: `"fast"`, `"flex"` of `null`. Ongeldige legacywaarden worden genegeerd.                                                                                                                     |

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk
begrensd van `appServer.requestTimeoutMs`: elk Codex `item/tool/call`-verzoek moet
binnen 30 seconden een OpenClaw-antwoord ontvangen. Bij een time-out breekt
OpenClaw het toolsignaal af waar dat wordt ondersteund en retourneert het een
mislukt antwoord van de dynamische tool aan Codex, zodat de beurt kan doorgaan
in plaats van de sessie in `processing` achter te laten.

Nadat OpenClaw heeft gereageerd op een Codex app-server-verzoek binnen de scope
van een beurt, verwacht de harness ook dat Codex de native beurt afrondt met
`turn/completed`. Als de app-server daarna 60 seconden stil blijft, onderbreekt
OpenClaw naar beste vermogen de Codex-beurt, registreert het een diagnostische
time-out en geeft het de OpenClaw-sessiebaan vrij zodat vervolgeberichten in de
chat niet achter een verouderde native beurt in de wachtrij blijven staan.

Omgevings-overrides blijven beschikbaar voor lokaal testen:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt de beheerde binary wanneer
`appServer.command` oningesteld is.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Configuratie
heeft de voorkeur voor herhaalbare implementaties, omdat dit het Plugin-gedrag
in hetzelfde beoordeelde bestand houdt als de rest van de Codex harness-instelling.

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiegids:
[Codex-computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktopbesturings-app niet en voert zelf
geen desktopacties uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is, en laat Codex daarna de native
MCP-toolaanroepen afhandelen tijdens Codex-modusbeurten.

Voor directe toegang tot het TryCua-stuurprogramma buiten de Codex-marketplace-flow, registreer
`cua-driver mcp` met `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zie [Codex-computergebruik](/nl/plugins/codex-computer-use) voor het onderscheid
tussen Computergebruik dat eigendom is van Codex en directe MCP-registratie.

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
      },
    },
  },
}
```

De installatie kan worden gecontroleerd of geïnstalleerd via het opdrachtoppervlak:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computergebruik is specifiek voor macOS en kan lokale OS-machtigingen vereisen voordat de
Codex MCP-server apps kan besturen. Als `computerUse.enabled` waar is en de MCP-server
niet beschikbaar is, mislukken Codex-modusbeurten voordat de thread start, in plaats van
stilzwijgend zonder de native Computergebruik-tools te draaien. Zie
[Codex-computergebruik](/nl/plugins/codex-computer-use) voor marketplace-keuzes,
limieten van externe catalogi, statusredenen en probleemoplossing.

Wanneer `computerUse.autoInstall` waar is, kan OpenClaw de standaard meegeleverde
Codex Desktop-marketplace registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marketplace heeft ontdekt. Gebruik `/new` of `/reset` na het
wijzigen van runtime- of Computergebruik-configuratie, zodat bestaande sessies
geen oude PI- of Codex-threadbinding behouden.

## Veelvoorkomende recepten

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

Modelwisseling blijft door OpenClaw aangestuurd. Wanneer een OpenClaw-sessie is gekoppeld
aan een bestaande Codex-thread, stuurt de volgende beurt het momenteel geselecteerde
OpenAI-model, de provider, het goedkeuringsbeleid, de sandbox en de servicetier opnieuw
naar de app-server. Overschakelen van `openai/gpt-5.5` naar `openai/gpt-5.2` behoudt de
threadbinding, maar vraagt Codex om door te gaan met het nieuw geselecteerde model.

## Codex-opdracht

De meegeleverde Plugin registreert `/codex` als een geautoriseerde slash-opdracht. Deze is
generiek en werkt op elk kanaal dat OpenClaw-tekstopdrachten ondersteunt.

Veelvoorkomende vormen:

- `/codex status` toont live app-server-connectiviteit, modellen, account, snelheidslimieten, MCP-servers en Skills.
- `/codex models` vermeldt live Codex app-server-modellen.
- `/codex threads [filter]` vermeldt recente Codex-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te comprimeren.
- `/codex review` start een native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om bevestiging voordat diagnostische Codex-feedback voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computergebruik-Plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computergebruik-Plugin en laadt MCP-servers opnieuw.
- `/codex account` toont account- en snelheidslimietstatus.
- `/codex mcp` vermeldt de MCP-serverstatus van Codex app-server.
- `/codex skills` vermeldt Codex app-server-skills.

### Veelvoorkomende foutopsporingsworkflow

Wanneer een door Codex ondersteunde agent iets onverwachts doet in Telegram, Discord, Slack,
of een ander kanaal, begin dan met het gesprek waarin het probleem is opgetreden:

1. Voer `/diagnostics bad tool choice after image upload` uit of een andere korte notitie
   die beschrijft wat je zag.
2. Keur het diagnostiekverzoek eenmaal goed. De goedkeuring maakt de lokale Gateway-
   diagnostiek-zip en stuurt, omdat de sessie de Codex-harness gebruikt, ook
   de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostiekantwoord naar het bugrapport of de supportthread.
   Het bevat het lokale bundelpad, de privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een `Inspect locally`-regel voor elke Codex-thread.
4. Als je de run zelf wilt debuggen, voer dan de afgedrukte opdracht `Inspect locally`
   uit in een terminal. Die ziet eruit als `codex resume <thread-id>` en opent de
   native Codex-thread zodat je het gesprek kunt inspecteren, lokaal kunt voortzetten
   of Codex kunt vragen waarom het een bepaald hulpmiddel of plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige OpenClaw
Gateway-diagnostiekbundel. Voor de meeste supportmeldingen is `/diagnostics [note]`
het betere startpunt, omdat het de lokale Gateway-status en Codex-thread-id's
in één antwoord aan elkaar koppelt. Zie [Diagnostiekexport](/nl/gateway/diagnostics)
voor het volledige privacymodel en het gedrag in groepschats.

De kern van OpenClaw biedt ook eigenaar-only `/diagnostics [note]` als algemene
Gateway-diagnostiekopdracht. De goedkeuringsprompt toont de inleiding over gevoelige
gegevens, linkt naar [Diagnostiekexport](/nl/gateway/diagnostics) en vraagt
`openclaw gateway diagnostics export --json` via expliciete exec-goedkeuring,
elke keer opnieuw. Keur diagnostiek niet goed met een alles-toestaan-regel. Na
goedkeuring stuurt OpenClaw een plakbaar rapport met het lokale bundelpad en de
manifestsamenvatting. Wanneer de actieve OpenClaw-sessie de Codex-harness gebruikt,
autoriseert dezelfde goedkeuring ook het verzenden van de relevante Codex-
feedbackbundels naar OpenAI-servers. De goedkeuringsprompt zegt dat Codex-feedback
wordt verzonden, maar vermeldt vóór goedkeuring geen Codex-sessie- of thread-id's.

Als `/diagnostics` door een eigenaar in een groepschat wordt aangeroepen, houdt
OpenClaw het gedeelde kanaal schoon: de groep ontvangt alleen een korte melding,
terwijl de diagnostiekinleiding, goedkeuringsprompts en Codex-sessie-/thread-id's
naar de eigenaar worden gestuurd via de privégoedkeuringsroute. Als er geen
privéroute naar de eigenaar is, weigert OpenClaw het groepsverzoek en vraagt het
de eigenaar om het vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept Codex app-server `feedback/upload` aan en vraagt
app-server om logs op te nemen voor elke vermelde thread en voortgebrachte Codex-
subthreads wanneer die beschikbaar zijn. De upload loopt via het normale
feedbackpad van Codex naar OpenAI-servers; als Codex-feedback in die app-server
is uitgeschakeld, retourneert de opdracht de app-serverfout. Het voltooide
diagnostiekantwoord vermeldt de kanalen, OpenClaw-sessie-id's, Codex-thread-id's
en lokale `codex resume <thread-id>`-opdrachten voor de verzonden threads. Als je
de goedkeuring weigert of negeert, drukt OpenClaw die Codex-id's niet af. Deze
upload vervangt de lokale Gateway-diagnostiekexport niet.

`/codex resume` schrijft hetzelfde sidecar-bindingsbestand dat de harness gebruikt
voor normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread,
geeft het het momenteel geselecteerde OpenClaw-model door aan app-server en houdt
het uitgebreide geschiedenis ingeschakeld.

### Een Codex-thread inspecteren vanuit de CLI

De snelste manier om een slechte Codex-run te begrijpen is vaak om de native
Codex-thread direct te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug opmerkt in een kanaalgesprek en de problematische
Codex-sessie wilt inspecteren, lokaal wilt voortzetten of Codex wilt vragen waarom
het een bepaalde hulpmiddel- of redeneerkeuze maakte. Het gemakkelijkste pad is
meestal om eerst `/diagnostics [note]` uit te voeren: nadat je het hebt goedgekeurd,
vermeldt het voltooide rapport elke Codex-thread en drukt het een `Inspect locally`-
opdracht af, bijvoorbeeld `codex resume <thread-id>`. Je kunt die opdracht direct
naar een terminal kopiëren.

Je kunt ook een thread-id verkrijgen via `/codex binding` voor de huidige chat of
`/codex threads [filter]` voor recente Codex app-server-threads, en vervolgens
dezelfde `codex resume`-opdracht in je shell uitvoeren.

Het opdrachtoppervlak vereist Codex app-server `0.125.0` of nieuwer. Afzonderlijke
controlemethoden worden gemeld als `unsupported by this Codex app-server` als een
toekomstige of aangepaste app-server die JSON-RPC-methode niet beschikbaar stelt.

## Hook-grenzen

De Codex-harness heeft drie hook-lagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-pluginhooks                  | OpenClaw                 | Product-/plugincompatibiliteit tussen PI- en Codex-harnesses.       |
| Codex app-server-extensiemiddleware   | Gebundelde OpenClaw-plugins | Adaptergedrag per beurt rond dynamische OpenClaw-hulpmiddelen.   |
| Native Codex-hooks                    | Codex                    | Laag-niveau Codex-levenscyclus en native hulpmiddelenbeleid uit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex-`hooks.json`-bestanden om
OpenClaw-plugingedrag te routeren. Voor de ondersteunde native hulpmiddelen- en
toestemmingsbrug injecteert OpenClaw per-thread Codex-configuratie voor
`PreToolUse`, `PostToolUse`, `PermissionRequest` en `Stop`. Andere Codex-hooks
zoals `SessionStart` en `UserPromptSubmit` blijven Codex-niveaucontroles; ze
worden in het v1-contract niet beschikbaar gesteld als OpenClaw-pluginhooks.

Voor dynamische OpenClaw-hulpmiddelen voert OpenClaw het hulpmiddel uit nadat Codex
om de aanroep vraagt, dus vuurt OpenClaw het plugin- en middlewaregedrag af dat het
in de harness-adapter bezit. Voor native Codex-hulpmiddelen bezit Codex het
canonieke hulpmiddelrecord. OpenClaw kan geselecteerde gebeurtenissen spiegelen,
maar kan de native Codex-thread niet herschrijven tenzij Codex die bewerking
beschikbaar stelt via app-server of native hook-callbacks.

Compaction- en LLM-levenscyclusprojecties komen uit Codex app-server-meldingen en
OpenClaw-adapterstatus, niet uit native Codex-hookopdrachten. De OpenClaw-
gebeurtenissen `before_compaction`, `after_compaction`, `llm_input` en
`llm_output` zijn adapterobservaties, geen byte-voor-byte vastleggingen van
Codex' interne verzoek- of compaction-payloads.

Native Codex-`hook/started`- en `hook/completed`-app-servermeldingen worden
geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor traject en
debugging. Ze roepen geen OpenClaw-pluginhooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex bezit meer
van de native modellus, en OpenClaw past zijn plugin- en sessieoppervlakken aan
rond die grens.

Ondersteund in Codex-runtime v1:

| Oppervlak                                     | Ondersteuning                           | Waarom                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                     | Ondersteund                             | Codex app-server bezit de OpenAI-beurt, het hervatten van native threads en native hulpmiddelvoortzetting.                                                                                           |
| OpenClaw-kanaalroutering en aflevering        | Ondersteund                             | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                       |
| Dynamische OpenClaw-hulpmiddelen              | Ondersteund                             | Codex vraagt OpenClaw om deze hulpmiddelen uit te voeren, dus OpenClaw blijft in het uitvoeringspad.                                                                                                  |
| Prompt- en contextplugins                     | Ondersteund                             | OpenClaw bouwt promptoverlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                    |
| Levenscyclus van contextengine                | Ondersteund                             | Assemblage, ingest of onderhoud na de beurt, en coördinatie van contextengine-compaction worden uitgevoerd voor Codex-beurten.                                                                       |
| Dynamische hulpmiddelhooks                    | Ondersteund                             | `before_tool_call`, `after_tool_call` en hulpmiddelresultaatmiddleware draaien rond dynamische hulpmiddelen die eigendom zijn van OpenClaw.                                                           |
| Levenscyclushooks                             | Ondersteund als adapterobservaties      | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` vuren af met eerlijke Codex-modus-payloads.                                                                         |
| Herzieningspoort voor eindantwoord            | Ondersteund via de native hook-relay    | Codex `Stop` wordt doorgegeven aan `before_agent_finalize`; `revise` vraagt Codex om nog één modelpassage vóór finalisatie.                                                                           |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via de native hook-relay | Codex `PreToolUse` en `PostToolUse` worden doorgegeven voor vastgelegde native hulpmiddeloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native toestemmingsbeleid                     | Ondersteund via de native hook-relay    | Codex `PermissionRequest` kan worden gerouteerd via OpenClaw-beleid waar de runtime dit beschikbaar stelt. Als OpenClaw geen beslissing retourneert, gaat Codex door via zijn normale guardian- of gebruikersgoedkeuringspad. |
| App-server-trajectvastlegging                 | Ondersteund                             | OpenClaw registreert het verzoek dat het naar app-server stuurde en de app-servermeldingen die het ontvangt.                                                                                          |

Niet ondersteund in Codex-runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                      | Toekomstig pad                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutatie van native toolargumenten                   | Native pre-tool hooks van Codex kunnen blokkeren, maar OpenClaw herschrijft Codex-native toolargumenten niet.                                | Vereist Codex hook/schema-ondersteuning voor vervangende toolinvoer.                      |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex bezit de canonieke native threadgeschiedenis. OpenClaw bezit een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadchirurgie nodig is.            |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, niet Codex-native toolrecords.                                        | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning. |
| Rijke native compaction-metadata                    | OpenClaw observeert het starten en voltooien van compaction, maar ontvangt geen stabiele bewaarde/verwijderde lijst, tokenverschil of samenvattingspayload. | Vereist rijkere Codex compaction-events.                                                   |
| Compaction-interventie                              | Huidige OpenClaw compaction-hooks zijn op meldingsniveau in Codex-modus.                                                                      | Voeg Codex pre/post compaction-hooks toe als plugins native compaction moeten kunnen vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-verzoeken  | OpenClaw kan app-server-verzoeken en meldingen vastleggen, maar Codex core bouwt intern het uiteindelijke OpenAI API-verzoek.                 | Vereist een Codex model-request tracing-event of debug-API.                                |

## Tools, media en compaction

De Codex-harnas wijzigt alleen de low-level ingebedde agentexecutor.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van het
harnas. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en output van messaging-tools
blijven via het normale OpenClaw-afleverpad lopen.

De native hook-relay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de Codex-native tool- en machtigingspaden die OpenClaw test. In
de Codex-runtime omvat dat shell-, patch- en MCP `PreToolUse`-,
`PostToolUse`- en `PermissionRequest`-payloads. Ga er niet van uit dat elk toekomstig
Codex hook-event een OpenClaw plugin-oppervlak is totdat het runtimecontract dit
benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete allow- of deny-beslissingen
wanneer beleid beslist. Een resultaat zonder beslissing is geen allow. Codex behandelt dit als geen
hookbeslissing en valt terug op zijn eigen bewaker- of gebruikersgoedkeuringspad.

Codex MCP-toolgoedkeuringsverzoeken worden via de Plugin-goedkeuringsstroom van OpenClaw
geleid wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex `request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende in de wachtrij geplaatste follow-upbericht beantwoordt dat native
serververzoek in plaats van als extra context te worden gestuurd. Andere MCP-verzoeken om informatie
falen nog steeds gesloten.

Sturing van de actieve-run-wachtrij wordt gemapt op Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` bundelt OpenClaw chatberichten in de wachtrij
gedurende het geconfigureerde stiltevenster en verstuurt ze als één `turn/steer`-verzoek in
aankomstvolgorde. Legacy `queue`-modus verstuurt afzonderlijke `turn/steer`-verzoeken. Codex
review- en handmatige compaction-turns kunnen sturing binnen dezelfde turn weigeren; in dat geval
gebruikt OpenClaw de follow-upwachtrij wanneer de geselecteerde modus fallback toestaat. Zie
[Sturingswachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model het Codex-harnas gebruikt, wordt native threadcompaction
gedelegeerd aan Codex app-server. OpenClaw behoudt een transcriptspiegel voor kanaalgeschiedenis,
zoeken, `/new`, `/reset` en toekomstige model- of harnaswissels. De
spiegel bevat de gebruikersprompt, de uiteindelijke assistenttekst en lichtgewicht Codex
reasoning- of planrecords wanneer de app-server die uitzendt. Tegenwoordig registreert OpenClaw alleen
signalen voor starten en voltooien van native compaction. Het biedt nog geen
menselijk leesbare compaction-samenvatting of een controleerbare lijst van welke entries Codex
na compaction heeft behouden.

Omdat Codex eigenaar is van de canonieke native thread, herschrijft `tool_result_persist` momenteel
geen Codex-native toolresultaatrecords. Het wordt alleen toegepast wanneer
OpenClaw een toolresultaat schrijft naar een sessietranscript dat eigendom is van OpenClaw.

Mediageneratie vereist geen PI. Afbeeldingen, video, muziek, PDF, TTS en mediabegrip
blijven de bijpassende provider-/modelinstellingen gebruiken, zoals
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en
`messages.tts`.

## Probleemoplossing

**Codex verschijnt niet als normale `/model`-provider:** dat wordt verwacht voor
nieuwe configs. Selecteer een `openai/gpt-*`-model met
`agentRuntime.id: "codex"` (of een legacy `codex/*`-ref), schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan nog steeds PI gebruiken als
compatibiliteitsbackend wanneer geen Codex-harnas de run claimt. Stel
`agentRuntime.id: "codex"` in om Codex-selectie tijdens testen af te dwingen. Een
afgedwongen Codex-runtime faalt in plaats van terug te vallen op PI. Zodra Codex app-server
is geselecteerd, komen de fouten daarvan direct naar voren.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake
versie `0.125.0` of nieuwer rapporteert. Prereleases met dezelfde versie of versies met buildsuffix
zoals `0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat de
stabiele `0.125.0`-protocolbodem is wat OpenClaw test.

**Modelontdekking is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel ontdekking uit.

**WebSocket-transport faalt direct:** controleer `appServer.url`, `authToken`,
en of de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat wordt verwacht tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een legacy
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven op hun normale
providerpad in `auto`-modus. Als je `agentRuntime.id: "codex"` afdwingt, moet elke ingebedde
turn voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd maar tools draaien niet:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik `/new` of `/reset`; als dit aanhoudt, herstart
de Gateway om verouderde native hook-registraties te wissen. Als `computer-use.list_apps`
een time-out krijgt, herstart Codex Computer Use of Codex Desktop en probeer opnieuw.

## Gerelateerd

- [Agentharnas-plugins](/nl/plugins/sdk-agent-harness)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin-hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
