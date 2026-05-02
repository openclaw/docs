---
read_when:
    - Je wilt het meegeleverde Codex-app-serverharnas gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op PI
summary: Voer ingebedde OpenClaw-agentbeurten uit via het meegeleverde Codex app-server-harnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-02T23:39:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

De meegeleverde `codex`-Plugin laat OpenClaw ingebedde agentbeurten uitvoeren via de
Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex eigenaar is van de low-level agentsessie:
modelontdekking, native thread-hervatting, native Compaction en app-serveruitvoering.
OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie, tools,
goedkeuringen, medialevering en de zichtbare transcriptspiegel.

Wanneer een bronchatbeurt via de Codex-harness loopt, gebruiken zichtbare antwoorden
standaard de OpenClaw `message`-tool als de deployment
`messages.visibleReplies` niet expliciet heeft geconfigureerd. De agent kan zijn
Codex-beurt nog steeds privé afronden; hij plaatst alleen iets in het kanaal wanneer
hij `message(action="send")` aanroept. Stel `messages.visibleReplies: "automatic"` in
om eindantwoorden in directe chats op het oude automatische afleverpad te houden.

Codex Heartbeat-beurten krijgen standaard ook de `heartbeat_respond`-tool, zodat de
agent kan vastleggen of de wake stil moet blijven of moet melden zonder die
controlestroom in de eindtekst te coderen.

Als je je probeert te oriënteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatievlak.

## Snelle configuratie

De meeste gebruikers die "Codex in OpenClaw" willen, willen deze route: meld je aan met een
ChatGPT/Codex-abonnement en voer daarna ingebedde agentbeurten uit via de native
Codex app-server-runtime. De modelreferentie blijft canoniek als
`openai/gpt-*`; abonnementsauthenticatie komt van het Codex-account/-profiel, niet
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
        fallback: "none",
      },
    },
  },
}
```

Als je configuratie `plugins.allow` gebruikt, neem daar dan ook `codex` in op:

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

Gebruik `openai-codex/gpt-*` niet wanneer je native Codex-runtime bedoelt. Die prefix
is de expliciete route "Codex OAuth via PI". Configuratiewijzigingen gelden voor nieuwe of
geresette sessies; bestaande sessies behouden hun vastgelegde runtime.

## Wat deze Plugin verandert

De meegeleverde `codex`-Plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                     | Hoe je die gebruikt                                  | Wat het doet                                                                  |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingebedde runtime         | `agentRuntime.id: "codex"`                          | Voert ingebedde OpenClaw-agentbeurten uit via Codex app-server.               |
| Native chatbesturingscommando's  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindt en bestuurt Codex app-server-threads vanuit een berichtengesprek.       |
| Codex app-serverprovider/catalogus | `codex`-internals, zichtbaar via de harness       | Laat de runtime app-servermodellen ontdekken en valideren.                    |
| Codex-pad voor mediabegrip       | `codex/*`-compatibiliteitspaden voor beeldmodellen  | Voert begrensde Codex app-serverbeurten uit voor ondersteunde beeldbegripmodellen. |
| Native hookrelay                 | Plugin-hooks rond native Codex-events               | Laat OpenClaw ondersteunde native Codex-tool-/finalisatie-events observeren/blokkeren. |

Het inschakelen van de Plugin maakt die mogelijkheden beschikbaar. Het doet **niet** het volgende:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelreferenties omzetten naar de native runtime
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies die al een PI-runtime hebben vastgelegd hot-switchen
- OpenClaw-kanaallevering, sessiebestanden, opslag van auth-profielen of
  berichtroutering vervangen

Dezelfde Plugin is ook eigenaar van het native `/codex`-chatbesturingscommando-oppervlak. Als
de Plugin is ingeschakeld en de gebruiker vraagt om Codex-threads vanuit chat te binden,
hervatten, sturen, stoppen of inspecteren, moeten agents de voorkeur geven aan `/codex ...`
boven ACP. ACP blijft de expliciete fallback wanneer de gebruiker om ACP/acpx vraagt of de ACP
Codex-adapter test.

Native Codex-beurten behouden OpenClaw Plugin-hooks als de publieke compatibiliteitslaag.
Dit zijn in-process OpenClaw-hooks, geen Codex `hooks.json`-commandohooks:

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
`tool_result_persist` Plugin-hook, die OpenClaw-beheerde transcriptwrites van
toolresultaten transformeert.

Zie voor de semantiek van de Plugin-hooks zelf [Plugin-hooks](/nl/plugins/hooks)
en [Plugin-guardgedrag](/nl/tools/plugin).

De harness staat standaard uit. Nieuwe configuraties moeten OpenAI-modelreferenties
canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` forceren wanneer ze
native app-serveruitvoering willen. Oude `codex/*`-modelreferenties selecteren de
harness nog steeds automatisch voor compatibiliteit, maar runtime-ondersteunde oude providerprefixes
worden niet getoond als normale model-/providerkeuzes.

Als de `codex`-Plugin is ingeschakeld maar het primaire model nog steeds
`openai-codex/*` is, waarschuwt `openclaw doctor` in plaats van de route te wijzigen. Dat is
bewust: `openai-codex/*` blijft het PI Codex OAuth-/abonnementspad, en
native app-serveruitvoering blijft een expliciete runtimekeuze.

## Routekaart

Gebruik deze tabel voordat je de configuratie wijzigt:

| Gewenst gedrag                                      | Modelreferentie          | Runtimeconfiguratie                  | Auth-/profielroute          | Verwacht statuslabel           |
| --------------------------------------------------- | ------------------------ | ------------------------------------ | --------------------------- | ------------------------------ |
| ChatGPT/Codex-abonnement met native Codex-runtime   | `openai/gpt-*`           | `agentRuntime.id: "codex"`           | Codex OAuth of Codex-account | `Runtime: OpenAI Codex`        |
| OpenAI API via normale OpenClaw-runner              | `openai/gpt-*`           | weggelaten of `runtime: "pi"`        | OpenAI API-sleutel          | `Runtime: OpenClaw Pi Default` |
| ChatGPT/Codex-abonnement via PI                     | `openai-codex/gpt-*`     | weggelaten of `runtime: "pi"`        | OpenAI Codex OAuth-provider | `Runtime: OpenClaw Pi Default` |
| Gemengde providers met conservatieve automatische modus | providerspecifieke referenties | `agentRuntime.id: "auto"`      | Per geselecteerde provider  | Hangt af van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie                  | afhankelijk van ACP-prompt/-model | `sessions_spawn` met `runtime: "acp"` | ACP-backendauthenticatie | ACP-taak-/sessiestatus         |

Het belangrijke onderscheid is provider versus runtime:

- `openai-codex/*` beantwoordt "welke provider-/auth-route moet PI gebruiken?"
- `agentRuntime.id: "codex"` beantwoordt "welke lus moet deze
  ingebedde beurt uitvoeren?"
- `/codex ...` beantwoordt "welk native Codex-gesprek moet deze chat binden
  of besturen?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

OpenAI-familieroutes zijn prefixspecifiek. Gebruik voor de gebruikelijke setup met abonnement plus
native Codex-runtime `openai/*` met `agentRuntime.id: "codex"`.
Gebruik `openai-codex/*` alleen wanneer je bewust Codex OAuth via PI wilt:

| Modelreferentie                              | Runtimepad                                  | Gebruik wanneer                                                            |
| -------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenAI-provider via OpenClaw/PI-plumbing    | Je huidige directe OpenAI Platform API-toegang met `OPENAI_API_KEY` wilt.  |
| `openai-codex/gpt-5.5`                       | OpenAI Codex OAuth via OpenClaw/PI          | Je ChatGPT/Codex-abonnementsauthenticatie met de standaard PI-runner wilt. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server-harness                  | Je ChatGPT/Codex-abonnementsauthenticatie met native Codex-uitvoering wilt. |

GPT-5.5 kan verschijnen op zowel directe OpenAI API-sleutelroutes als Codex-abonnementsroutes
wanneer je account ze aanbiedt. Gebruik `openai/gpt-5.5` met de Codex app-server-
harness voor native Codex-runtime, `openai-codex/gpt-5.5` voor PI OAuth, of
`openai/gpt-5.5` zonder Codex-runtime-override voor direct API-sleutelverkeer.

Oude `codex/gpt-*`-referenties blijven geaccepteerd als compatibiliteitsaliassen. De
compatibiliteitsmigratie van doctor herschrijft oude primaire runtimereferenties naar canonieke modelreferenties
en legt het runtimebeleid apart vast, terwijl oude referenties die alleen fallback zijn
ongewijzigd blijven omdat runtime voor de hele agentcontainer wordt geconfigureerd.
Nieuwe PI Codex OAuth-configuraties moeten `openai-codex/gpt-*` gebruiken; nieuwe native
app-server-harnessconfiguraties moeten `openai/gpt-*` plus
`agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai-codex/gpt-*` wanneer beeldbegrip via het OpenAI
Codex OAuth-providerpad moet lopen. Gebruik `codex/gpt-*` wanneer beeldbegrip via
een begrensde Codex app-serverbeurt moet lopen. Het Codex app-servermodel moet
ondersteuning voor beeldinvoer adverteren; tekst-only Codex-modellen falen voordat de mediabeurt
start.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen. Als de
selectie verrassend is, schakel debuglogging in voor het `agents/harness`-subsysteem
en inspecteer het gestructureerde Gateway-record `agent harness selected`. Het
bevat de geselecteerde harness-id, selectiereden, runtime-/fallbackbeleid en,
in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

### Wat doctor-waarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer al deze punten waar zijn:

- de meegeleverde `codex`-Plugin is ingeschakeld of toegestaan
- het primaire model van een agent is `openai-codex/*`
- de effectieve runtime van die agent is niet `codex`

Die waarschuwing bestaat omdat gebruikers vaak verwachten dat "Codex-Plugin ingeschakeld" betekent
"native Codex app-server-runtime." OpenClaw maakt die sprong niet. De waarschuwing
betekent:

- **Er is geen wijziging vereist** als je ChatGPT/Codex OAuth via PI bedoelde.
- Wijzig het model naar `openai/<model>` en stel
  `agentRuntime.id: "codex"` in als je native app-serveruitvoering
  bedoelde.
- Bestaande sessies hebben na een runtimewijziging nog steeds `/new` of `/reset` nodig,
  omdat sessieruntimepins sticky zijn.

Harnessselectie is geen live sessiebesturing. Wanneer een ingebedde beurt loopt,
legt OpenClaw de geselecteerde harness-id vast op die sessie en blijft die gebruiken voor
latere beurten in dezelfde sessie-id. Wijzig de `agentRuntime`-configuratie of
`OPENCLAW_AGENT_RUNTIME` wanneer je wilt dat toekomstige sessies een andere harness gebruiken;
gebruik `/new` of `/reset` om een nieuwe sessie te starten voordat je een bestaand
gesprek tussen PI en Codex wisselt. Dit voorkomt dat één transcript via
twee incompatibele native sessiesystemen wordt afgespeeld.

Oude sessies die vóór harnesspins zijn aangemaakt, worden als PI-gepind behandeld zodra ze
transcriptgeschiedenis hebben. Gebruik `/new` of `/reset` om dat gesprek na
een configuratiewijziging in Codex te laten overstappen.

`/status` toont de effectieve modelruntime. Het standaard PI-harnas verschijnt als
`Runtime: OpenClaw Pi Default`, en het Codex app-server-harnas verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de gebundelde `codex`-Plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard een compatibel
  Codex app-server-binair bestand, dus lokale `codex`-commando's op `PATH` hebben
  geen invloed op normaal opstarten van het harnas.
- Codex-auth beschikbaar voor het app-server-proces of voor OpenClaw's Codex-auth
  bridge. Lokale app-server-starts gebruiken een door OpenClaw beheerde Codex-home voor elke
  agent en een geïsoleerde child-`HOME`, dus ze lezen standaard niet je persoonlijke
  `~/.codex`-account, Skills, plugins, config, threadstatus of native
  `$HOME/.agents/skills`.

De Plugin blokkeert oudere of ongeversonneerde app-server-handshakes. Dat houdt
OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt auth meestal van het Codex CLI-account
of een OpenClaw `openai-codex`-authprofiel. Lokale stdio app-server-starts kunnen
ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Workspace-bootstrapbestanden

Codex verwerkt `AGENTS.md` zelf via native projectdocdetectie. OpenClaw
schrijft geen synthetische Codex-projectdocbestanden en is niet afhankelijk van Codex-fallback
bestandsnamen voor personabestanden, omdat Codex-fallbacks alleen gelden wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw-workspacepariteit lost het Codex-harnas de andere bootstrapbestanden op
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, en `MEMORY.md` wanneer aanwezig) en stuurt ze door via Codex
config-instructies bij `thread/start` en `thread/resume`. Hierdoor blijft
`SOUL.md` en gerelateerde workspace-persona-/profielcontext zichtbaar zonder
`AGENTS.md` te dupliceren.

## Codex naast andere modellen toevoegen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen schakelen
tussen Codex- en niet-Codex-providermodellen. Een geforceerde runtime geldt voor elke
ingebedde beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl
die runtime is geforceerd, probeert OpenClaw nog steeds het Codex-harnas en faalt afgesloten
in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Zet Codex op een toegewezen agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en PI-fallback voor normaal gemengd
  providergebruik.
- Gebruik legacy `codex/*`-refs alleen voor compatibiliteit. Nieuwe configs moeten de voorkeur geven aan
  `openai/*` plus een expliciet Codex-runtimebeleid.

Dit houdt bijvoorbeeld de standaardagent op normale automatische selectie en
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

- De standaard `main`-agent gebruikt het normale providerpad en PI-compatibiliteitsfallback.
- De `codex`-agent gebruikt het Codex app-server-harnas.
- Als Codex ontbreekt of niet wordt ondersteund voor de `codex`-agent, faalt de beurt
  in plaats van stilletjes PI te gebruiken.

## Agentcommandoroutering

Agents moeten gebruikersverzoeken routeren op intentie, niet alleen op het woord "Codex":

| Gebruiker vraagt om...                                | Agent moet gebruiken...                          |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bind deze chat aan Codex"                             | `/codex bind`                                    |
| "Hervat Codex-thread `<id>` hier"                      | `/codex resume <id>`                             |
| "Toon Codex-threads"                                  | `/codex threads`                                 |
| "Dien een supportrapport in voor een slechte Codex-run" | `/diagnostics [note]`                            |
| "Stuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                      |
| "Gebruik mijn ChatGPT/Codex-abonnement met Codex-runtime" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Gebruik mijn ChatGPT/Codex-abonnement via PI"         | `openai-codex/*`-modelrefs                      |
| "Voer Codex uit via ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en niet native sub-agents |

OpenClaw adverteert ACP-spawnguidance alleen aan agents wanneer ACP is ingeschakeld,
verzendbaar is en wordt ondersteund door een geladen runtime-backend. Als ACP niet beschikbaar is,
moeten de systeemprompt en Plugin-Skills de agent geen ACP-routering aanleren.

## Alleen-Codex-deployments

Forceer het Codex-harnas wanneer je moet bewijzen dat elke ingebedde agentbeurt
Codex gebruikt. Expliciete Plugin-runtimes staan standaard op geen PI-fallback, dus
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

Met Codex geforceerd faalt OpenClaw vroeg als de Codex-Plugin is uitgeschakeld, de
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

Gebruik normale sessiecommando's om tussen agents en modellen te schakelen. `/new` maakt een nieuwe
OpenClaw-sessie aan en het Codex-harnas maakt of hervat zijn sidecar app-server
thread wanneer nodig. `/reset` wist de OpenClaw-sessiebinding voor die thread
en laat de volgende beurt het harnas opnieuw uit de huidige config oplossen.

## Modeldetectie

Standaard vraagt de Codex-Plugin de app-server om beschikbare modellen. Als
detectie faalt of een time-out krijgt, gebruikt hij een gebundelde fallbackcatalogus voor:

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

Schakel detectie uit wanneer je wilt dat startup Codex niet peilt en bij de
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

Standaard start de Plugin OpenClaw's beheerde Codex-binaire bestand lokaal met:

```bash
codex app-server --listen stdio://
```

Het beheerde binaire bestand wordt meegeleverd met het `codex`-Plugin-pakket. Hierdoor blijft de
app-server-versie gekoppeld aan de gebundelde Plugin in plaats van aan welke afzonderlijke
Codex CLI toevallig lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer
je bewust een ander uitvoerbaar bestand wilt uitvoeren.

Standaard start OpenClaw lokale Codex-harnassessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt
voor autonome Heartbeats: Codex kan shell- en netwerktools gebruiken zonder
te stoppen op native goedkeuringsprompts die niemand kan beantwoorden.

Om je aan te melden voor door Codex guardian-beoordeelde goedkeuringen, stel je `appServer.mode:
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

Guardian-modus gebruikt Codex's native automatisch beoordeelde goedkeuringspad. Wanneer Codex vraagt om
de sandbox te verlaten, buiten de workspace te schrijven, of permissies zoals netwerktoegang
toe te voegen, routeert Codex dat goedkeuringsverzoek naar de native reviewer in plaats van naar een
menselijke prompt. De reviewer past Codex's risicokader toe en keurt het specifieke verzoek goed of af.
Gebruik Guardian wanneer je meer vangrails wilt dan YOLO-modus
maar nog steeds nodig hebt dat onbemande agents vooruitgang boeken.

De `guardian`-preset breidt uit naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, en `sandbox: "workspace-write"`.
Individuele beleidsvelden overschrijven nog steeds `mode`, dus geavanceerde deployments kunnen
de preset mengen met expliciete keuzes. De oudere `guardian_subagent`-reviewerwaarde wordt
nog steeds geaccepteerd als compatibiliteitsalias, maar nieuwe configs moeten
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

Stdio app-server-starts erven standaard de procesomgeving van OpenClaw,
maar OpenClaw beheert de Codex app-server-accountbridge en stelt zowel
`CODEX_HOME` als `HOME` in op per-agentmappen onder de OpenClaw-status van die agent.
Codex's eigen skillloader leest `$CODEX_HOME/skills` en
`$HOME/.agents/skills`, dus beide waarden zijn geïsoleerd voor lokale app-server-starts.
Dat houdt Codex-native Skills, plugins, config, accounts en threadstatus
beperkt tot de OpenClaw-agent in plaats van dat ze binnenlekken vanuit de persoonlijke
Codex CLI-home van de operator.

OpenClaw-plugins en OpenClaw-skill-snapshots blijven via OpenClaw's eigen
Plugin-register en skillloader lopen. Persoonlijke Codex CLI-assets niet. Als je
nuttige Codex CLI-Skills of plugins hebt die onderdeel moeten worden van een OpenClaw-agent,
inventariseer ze expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

De Codex-migratieprovider kopieert Skills naar de huidige OpenClaw-agentworkspace.
Codex-native plugins, hooks en configbestanden worden gerapporteerd of gearchiveerd
voor handmatige beoordeling in plaats van automatisch geactiveerd, omdat ze
commando's kunnen uitvoeren, MCP-servers kunnen blootstellen, of inloggegevens kunnen bevatten.

Auth wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-auth nog
   vereist is.

Wanneer OpenClaw een ChatGPT-abonnementstijl Codex-authprofiel ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Dat
houdt API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex app-server-beurten per ongeluk via de API worden gefactureerd.
Expliciete Codex API-sleutelprofielen en lokale stdio-env-key-fallback gebruiken app-server
login in plaats van geërfde childproces-env. WebSocket app-server-verbindingen
ontvangen geen Gateway-env API-sleutelfallback; gebruik een expliciet authprofiel of het
eigen account van de externe app-server.

Als een deployment extra omgevingsisolatie nodig heeft, voeg die variabelen toe aan
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

`appServer.clearEnv` heeft alleen invloed op het voortgebrachte onderliggende Codex-app-serverproces.

Dynamische Codex-tools gebruiken standaard het profiel `native-first`. In die modus
stelt OpenClaw geen dynamische tools beschikbaar die native Codex-werkruimtebewerkingen
dupliceren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` en
`update_plan`. OpenClaw-integratietools zoals berichten, sessies, media,
cron, browser, nodes, gateway, `heartbeat_respond` en `web_search` blijven
beschikbaar.

Ondersteunde Codex Plugin-velden op topniveau:

| Veld                       | Standaard        | Betekenis                                                                                              |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Gebruik `"openclaw-compat"` om de volledige set dynamische OpenClaw-tools aan Codex app-server beschikbaar te stellen. |
| `codexDynamicToolsExclude` | `[]`             | Aanvullende namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-server-beurten. |

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                    |
| `command`           | beheerde Codex-binary                    | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om de beheerde binary te gebruiken; stel het alleen in voor een expliciete overschrijving.                                                                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                                                                                                                    |
| `url`               | niet ingesteld                           | WebSocket-URL voor app-server.                                                                                                                                                                                                      |
| `authToken`         | niet ingesteld                           | Bearer-token voor WebSocket-transport.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die worden verwijderd uit het voortgebrachte stdio-app-serverproces nadat OpenClaw de overgeërfde omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's Codex-isolatie per agent bij lokale starts. |
| `requestTimeoutMs`  | `60000`                                  | Time-out voor app-server-controlplane-aanroepen.                                                                                                                                                                                    |
| `mode`              | `"yolo"`                                 | Preset voor YOLO- of guardian-gereviewde uitvoering.                                                                                                                                                                                |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread start/resume/turn wordt verzonden.                                                                                                                                                  |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread start/resume wordt verzonden.                                                                                                                                                             |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten reviewen. `guardian_subagent` blijft een legacy-alias.                                                                                                         |
| `serviceTier`       | niet ingesteld                           | Optionele Codex app-server-servicelaag: `"fast"`, `"flex"` of `null`. Ongeldige legacywaarden worden genegeerd.                                                                                                                     |

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk van
`appServer.requestTimeoutMs` begrensd: elk Codex-`item/tool/call`-verzoek moet binnen
30 seconden een OpenClaw-reactie ontvangen. Bij een time-out breekt OpenClaw het toolsignaal
af waar dat wordt ondersteund en retourneert het een mislukte dynamic-tool-reactie aan Codex,
zodat de beurt kan doorgaan in plaats van de sessie in `processing` achter te laten.

Nadat OpenClaw heeft gereageerd op een app-serververzoek met Codex-beurtbereik, verwacht de harness
ook dat Codex de native beurt afrondt met `turn/completed`. Als de
app-server daarna 60 seconden stil blijft, onderbreekt OpenClaw naar beste vermogen
de Codex-beurt, registreert het een diagnostische time-out en geeft het de
OpenClaw-sessielane vrij, zodat vervolgchatberichten niet achter een verouderde
native beurt in de wachtrij blijven staan.

Omgevingsoverschrijvingen blijven beschikbaar voor lokaal testen:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt de beheerde binary wanneer
`appServer.command` niet is ingesteld.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Configuratie heeft
de voorkeur voor herhaalbare deployments, omdat het Plugin-gedrag in hetzelfde
gereviewde bestand blijft als de rest van de Codex-harnessconfiguratie.

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiehandleiding:
[Codex Computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktop-control-app niet en voert zelf geen
desktopacties uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is, en laat Codex vervolgens de native
MCP-toolaanroepen afhandelen tijdens Codex-modusbeurten.

Voor directe TryCua-drivertoegang buiten de Codex-marktplaatsflow registreer je
`cua-driver mcp` met `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zie [Codex Computergebruik](/nl/plugins/codex-computer-use) voor het onderscheid
tussen Computergebruik in eigendom van Codex en directe MCP-registratie.

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

De installatie kan worden gecontroleerd of geïnstalleerd vanaf het commandovlak:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computergebruik is macOS-specifiek en kan lokale OS-machtigingen vereisen voordat de
Codex MCP-server apps kan aansturen. Als `computerUse.enabled` true is en de MCP-
server niet beschikbaar is, mislukken Codex-modusbeurten voordat de thread start,
in plaats van stilzwijgend zonder de native Computergebruik-tools te draaien. Zie
[Codex Computergebruik](/nl/plugins/codex-computer-use) voor marktplaatskeuzes,
limieten van de externe catalogus, statusredenen en probleemoplossing.

Wanneer `computerUse.autoInstall` true is, kan OpenClaw de standaard gebundelde
Codex Desktop-marktplaats registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marktplaats heeft ontdekt. Gebruik `/new` of `/reset` na het
wijzigen van runtime- of Computergebruik-configuratie, zodat bestaande sessies geen oude
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

Alleen Codex-harnessvalidatie:

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

Guardian-gereviewde Codex-goedkeuringen:

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

Modelwisseling blijft door OpenClaw beheerd. Wanneer een OpenClaw-sessie is gekoppeld
aan een bestaande Codex-thread, stuurt de volgende beurt het momenteel geselecteerde
OpenAI-model, de provider, het goedkeuringsbeleid, de sandbox en de servicelaag opnieuw naar
app-server. Overschakelen van `openai/gpt-5.5` naar `openai/gpt-5.2` behoudt de
threadbinding, maar vraagt Codex door te gaan met het nieuw geselecteerde model.

## Codex-commando

De gebundelde Plugin registreert `/codex` als een geautoriseerd slash-commando. Het is
generiek en werkt op elk kanaal dat OpenClaw-tekstcommando's ondersteunt.

Veelgebruikte vormen:

- `/codex status` toont live app-serverconnectiviteit, modellen, account, rate limits, MCP-servers en Skills.
- `/codex models` geeft live Codex app-servermodellen weer.
- `/codex threads [filter]` geeft recente Codex-threads weer.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te comprimeren.
- `/codex review` start native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om bevestiging voordat diagnostische feedback van Codex voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computer Use-plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computer Use-plugin en herlaadt MCP-servers.
- `/codex account` toont account- en rate-limitstatus.
- `/codex mcp` geeft de MCP-serverstatus van Codex app-server weer.
- `/codex skills` geeft Codex app-server Skills weer.

### Algemene debuggingworkflow

Wanneer een door Codex ondersteunde agent iets onverwachts doet in Telegram, Discord, Slack,
of een ander kanaal, begin dan met het gesprek waarin het probleem optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit, of een andere korte notitie
   die beschrijft wat je zag.
2. Keur het diagnostiekverzoek eenmalig goed. De goedkeuring maakt de lokale Gateway
   diagnostiek-zip en, omdat de sessie de Codex-harness gebruikt, verzendt ook
   de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostiekantwoord naar het bugrapport of de supportthread.
   Het bevat het lokale bundelpad, de privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een `Inspect locally`-regel voor elke Codex-thread.
4. Als je de run zelf wilt debuggen, voer je het afgedrukte `Inspect locally`-
   commando uit in een terminal. Het ziet eruit als `codex resume <thread-id>` en opent de
   native Codex-thread, zodat je het gesprek kunt inspecteren, lokaal kunt voortzetten,
   of Codex kunt vragen waarom het een bepaalde tool of een bepaald plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload wilt voor de momenteel gekoppelde thread zonder de volledige OpenClaw
Gateway-diagnostiekbundel. Voor de meeste supportmeldingen is `/diagnostics [note]`
het betere startpunt, omdat het de lokale Gateway-status en Codex-
thread-id's samenbrengt in één antwoord. Zie [Diagnostiekexport](/nl/gateway/diagnostics)
voor het volledige privacymodel en het gedrag in groepschats.

Core OpenClaw stelt ook de alleen-voor-eigenaren `/diagnostics [note]` beschikbaar als het algemene
Gateway-diagnostiekcommando. De goedkeuringsprompt toont de inleiding over gevoelige gegevens,
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
weigert OpenClaw het groepsverzoek en vraagt het de eigenaar om het vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept Codex app-server `feedback/upload` aan en vraagt
app-server om, waar beschikbaar, logs op te nemen voor elke vermelde thread en voortgebrachte Codex-subthreads
. De upload loopt via het normale feedbackpad van Codex naar OpenAI-
servers; als Codex-feedback in die app-server is uitgeschakeld, retourneert het commando
de app-serverfout. Het voltooide diagnostiekantwoord vermeldt de kanalen,
OpenClaw-sessie-id's, Codex-thread-id's en lokale `codex resume <thread-id>`-
commando's voor de threads die zijn verzonden. Als je de goedkeuring weigert of negeert,
drukt OpenClaw die Codex-id's niet af. Deze upload vervangt de lokale
Gateway-diagnostiekexport niet.

`/codex resume` schrijft hetzelfde sidecar-bindingsbestand dat de harness gebruikt voor
normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread, geeft het
momenteel geselecteerde OpenClaw-model door aan app-server en houdt het uitgebreide geschiedenis
ingeschakeld.

### Een Codex-thread inspecteren vanuit de CLI

De snelste manier om een slechte Codex-run te begrijpen is vaak om de native Codex-
thread direct te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug opmerkt in een kanaalgesprek en de
problematische Codex-sessie wilt inspecteren, lokaal wilt voortzetten, of Codex wilt vragen waarom het een
bepaalde tool- of redeneerkeuze maakte. De eenvoudigste route is meestal om eerst
`/diagnostics [note]` uit te voeren: nadat je dit hebt goedgekeurd, vermeldt het voltooide rapport
elke Codex-thread en drukt het een `Inspect locally`-commando af, bijvoorbeeld
`codex resume <thread-id>`. Je kunt dat commando direct naar een terminal kopiëren.

Je kunt ook een thread-id ophalen uit `/codex binding` voor de huidige chat of
`/codex threads [filter]` voor recente Codex app-serverthreads, en vervolgens hetzelfde
`codex resume`-commando uitvoeren in je shell.

Het commando-oppervlak vereist Codex app-server `0.125.0` of nieuwer. Afzonderlijke
besturingsmethoden worden gerapporteerd als `unsupported by this Codex app-server` als een
toekomstige of aangepaste app-server die JSON-RPC-methode niet beschikbaar stelt.

## Hook-grenzen

De Codex-harness heeft drie hooklagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-pluginhooks                  | OpenClaw                 | Product-/plugincompatibiliteit tussen PI- en Codex-harnesses.       |
| Codex app-server-extensiemiddleware   | Meegeleverde OpenClaw-plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.             |
| Native Codex-hooks                    | Codex                    | Laag-niveau Codex-lifecycle en native toolbeleid vanuit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex `hooks.json`-bestanden om
OpenClaw-plugingedrag te routeren. Voor de ondersteunde native tool- en permissiebrug
injecteert OpenClaw per-thread Codex-configuratie voor `PreToolUse`, `PostToolUse`,
`PermissionRequest` en `Stop`. Andere Codex-hooks zoals `SessionStart` en
`UserPromptSubmit` blijven besturingen op Codex-niveau; ze worden niet blootgesteld als
OpenClaw-pluginhooks in het v1-contract.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de
aanroep vraagt, dus OpenClaw vuurt het plugin- en middlewaregedrag af dat het bezit in de
harnessadapter. Voor native Codex-tools bezit Codex het canonieke toolrecord.
OpenClaw kan geselecteerde gebeurtenissen spiegelen, maar kan de native Codex-
thread niet herschrijven tenzij Codex die bewerking beschikbaar stelt via app-server of native hook-
callbacks.

Compaction- en LLM-lifecycleprojecties komen uit Codex app-server-
meldingen en OpenClaw-adapterstatus, niet uit native Codex-hookcommando's.
OpenClaw's `before_compaction`, `after_compaction`, `llm_input` en
`llm_output`-gebeurtenissen zijn observaties op adapterniveau, geen byte-voor-byte captures
van Codex' interne verzoek- of compaction-payloads.

Native Codex `hook/started`- en `hook/completed`-app-servermeldingen worden
geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor traject en debugging.
Ze roepen geen OpenClaw-pluginhooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex bezit meer van
de native modelloop, en OpenClaw past zijn plugin- en sessieoppervlakken
aan rond die grens.

Ondersteund in Codex-runtime v1:

| Oppervlak                                    | Ondersteuning                           | Waarom                                                                                                                                                                                               |
| -------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modelloop via Codex                   | Ondersteund                             | Codex app-server bezit de OpenAI-beurt, native threadhervatting en native toolvoortzetting.                                                                                                          |
| OpenClaw-kanaalroutering en -levering        | Ondersteund                             | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                      |
| Dynamische OpenClaw-tools                    | Ondersteund                             | Codex vraagt OpenClaw om deze tools uit te voeren, zodat OpenClaw in het uitvoeringspad blijft.                                                                                                      |
| Prompt- en contextplugins                    | Ondersteund                             | OpenClaw bouwt promptoverlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                    |
| Lifecycle van de contextengine               | Ondersteund                             | Assemblage, ingest of onderhoud na de beurt, en coördinatie van contextengine-compaction worden uitgevoerd voor Codex-beurten.                                                                       |
| Dynamische toolhooks                         | Ondersteund                             | `before_tool_call`, `after_tool_call` en toolresultaat-middleware draaien rond door OpenClaw beheerde dynamische tools.                                                                              |
| Lifecycle-hooks                              | Ondersteund als adapterobservaties      | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` worden afgevuurd met eerlijke payloads voor Codex-modus.                                                           |
| Revisiepoort voor definitief antwoord        | Ondersteund via de native hookrelay     | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog één modelpass vóór finalisatie.                                                                           |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via de native hookrelay | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor vastgelegde native tooloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; herschrijven van argumenten niet. |
| Native permissiebeleid                       | Ondersteund via de native hookrelay     | Codex `PermissionRequest` kan via OpenClaw-beleid worden gerouteerd waar de runtime dit beschikbaar stelt. Als OpenClaw geen beslissing retourneert, gaat Codex verder via zijn normale guardian- of gebruikersgoedkeuringspad. |
| App-servertraject vastleggen                 | Ondersteund                             | OpenClaw registreert het verzoek dat het naar app-server stuurde en de app-servermeldingen die het ontvangt.                                                                                         |

Niet ondersteund in Codex-runtime v1:

| Oppervlak                                          | V1-grens                                                                                                                                       | Toekomstig pad                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Mutatie van systeemeigen hulpmiddelargumenten      | Codex-eigen pre-tool-hooks kunnen blokkeren, maar OpenClaw herschrijft Codex-eigen hulpmiddelargumenten niet.                                  | Vereist Codex-hook-/schemaondersteuning voor vervangende hulpmiddelinvoer.                      |
| Bewerkbare Codex-eigen transcriptgeschiedenis      | Codex beheert de canonieke systeemeigen threadgeschiedenis. OpenClaw beheert een spiegel en kan toekomstige context projecteren, maar mag niet-mutatieondersteunde interne onderdelen niet wijzigen. | Voeg expliciete Codex app-server-API's toe als systeemeigen threadchirurgie nodig is.            |
| `tool_result_persist` voor Codex-eigen hulpmiddelrecords | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, niet Codex-eigen hulpmiddelrecords.                                     | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning.  |
| Rijke systeemeigen Compaction-metadata             | OpenClaw observeert de start en voltooiing van Compaction, maar ontvangt geen stabiele bewaard/verwijderd-lijst, tokendelta of samenvattingspayload. | Heeft rijkere Codex-Compaction-gebeurtenissen nodig.                                            |
| Compaction-interventie                             | Huidige OpenClaw-Compaction-hooks zijn op meldingsniveau in Codex-modus.                                                                        | Voeg Codex-pre-/post-Compaction-hooks toe als plugins systeemeigen Compaction moeten vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-aanvragen | OpenClaw kan app-server-aanvragen en meldingen vastleggen, maar Codex core bouwt de uiteindelijke OpenAI API-aanvraag intern.                   | Heeft een Codex-traceergebeurtenis voor modelaanvragen of een debug-API nodig.                  |

## Hulpmiddelen, media en Compaction

De Codex-harness wijzigt alleen de low-level ingebedde agentuitvoerder.

OpenClaw bouwt nog steeds de lijst met hulpmiddelen en ontvangt dynamische hulpmiddelresultaten van de harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en uitvoer van berichtentools blijven via het normale OpenClaw-afleverpad lopen.

De systeemeigen hook-relay is opzettelijk generiek, maar het v1-ondersteuningscontract is beperkt tot de Codex-eigen hulpmiddel- en machtigingspaden die OpenClaw test. In de Codex-runtime omvat dat shell-, patch- en MCP-`PreToolUse`-, `PostToolUse`- en `PermissionRequest`-payloads. Ga er niet van uit dat elke toekomstige Codex-hookgebeurtenis een OpenClaw-pluginoppervlak is totdat het runtimecontract dit benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of weigeren-beslissingen wanneer beleid beslist. Een resultaat zonder beslissing is geen toestemming. Codex behandelt het als geen hook-beslissing en valt terug op zijn eigen bewaker of gebruikersgoedkeuringpad.

Codex MCP-hulpmiddelgoedkeuringselicitations worden via de OpenClaw-goedkeuringsstroom voor plugins gerouteerd wanneer Codex `_meta.codex_approval_kind` markeert als `"mcp_tool_call"`. Codex-`request_user_input`-prompts worden teruggestuurd naar de oorspronkelijke chat, en het volgende wachtrijvervolgbericht beantwoordt die systeemeigen serveraanvraag in plaats van als extra context te worden gestuurd. Andere MCP-elicitation-aanvragen falen nog steeds gesloten.

Active-run-wachtrijsturing wordt gemapt op Codex app-server `turn/steer`. Met de standaard `messages.queue.mode: "steer"` bundelt OpenClaw chatberichten in de wachtrij voor het geconfigureerde stiltevenster en verzendt ze als één `turn/steer`-aanvraag in volgorde van binnenkomst. De legacy `queue`-modus verzendt afzonderlijke `turn/steer`-aanvragen. Codex-review- en handmatige Compaction-turns kunnen sturing binnen dezelfde turn weigeren; in dat geval gebruikt OpenClaw de vervolgwachtrij wanneer de geselecteerde modus fallback toestaat. Zie [Sturingswachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt systeemeigen thread-Compaction gedelegeerd aan Codex app-server. OpenClaw behoudt een transcriptspiegel voor kanaalgeschiedenis, zoeken, `/new`, `/reset` en toekomstige model- of harnesswisseling. De spiegel bevat de gebruikersprompt, uiteindelijke assistenttekst en lichte Codex-redeneer- of planrecords wanneer de app-server die uitzendt. Momenteel registreert OpenClaw alleen signalen voor de start en voltooiing van systeemeigen Compaction. Het exposeert nog geen menselijk leesbare Compaction-samenvatting of een auditeerbare lijst van welke items Codex na Compaction heeft bewaard.

Omdat Codex de canonieke systeemeigen thread beheert, herschrijft `tool_result_persist` momenteel geen Codex-eigen hulpmiddelresultaatrecords. Het is alleen van toepassing wanneer OpenClaw een hulpmiddelresultaat schrijft naar een sessietranscript dat eigendom is van OpenClaw.

Mediageneratie vereist geen PI. Afbeeldingen, video, muziek, PDF, TTS en mediabegrip blijven de overeenkomende provider-/modelinstellingen gebruiken, zoals `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en `messages.tts`.

## Probleemoplossing

**Codex verschijnt niet als een normale `/model`-provider:** dat is verwacht voor nieuwe configuraties. Selecteer een `openai/gpt-*`-model met `agentRuntime.id: "codex"` (of een legacy `codex/*`-ref), schakel `plugins.entries.codex.enabled` in en controleer of `plugins.allow` `codex` uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan nog steeds PI gebruiken als compatibiliteitsbackend wanneer geen Codex-harness de run claimt. Stel `agentRuntime.id: "codex"` in om Codex-selectie tijdens het testen af te dwingen. Een afgedwongen Codex-runtime faalt nu in plaats van terug te vallen op PI, tenzij je expliciet `agentRuntime.fallback: "pi"` instelt. Zodra Codex app-server is geselecteerd, komen de fouten direct naar voren zonder extra fallbackconfiguratie.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake versie `0.125.0` of nieuwer rapporteert. Prereleases van dezelfde versie of versies met build-suffix zoals `0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat de stabiele protocolondergrens `0.125.0` is wat OpenClaw test.

**Modelontdekking is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs` of schakel ontdekking uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken` en of de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij je `agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een legacy `codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven in `auto`-modus op hun normale providerpad. Als je `agentRuntime.id: "codex"` afdwingt, moet elke ingebedde turn voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd maar hulpmiddelen worden niet uitgevoerd:** controleer `/codex computer-use status` vanuit een nieuwe sessie. Als een hulpmiddel `Native hook relay unavailable` rapporteert, gebruik dan `/new` of `/reset`; als het blijft aanhouden, herstart de gateway om verouderde systeemeigen hookregistraties te wissen. Als `computer-use.list_apps` een time-out krijgt, herstart Codex Computer Use of Codex Desktop en probeer opnieuw.

## Gerelateerd

- [Agent-harnessplugins](/nl/plugins/sdk-agent-harness)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin-hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
