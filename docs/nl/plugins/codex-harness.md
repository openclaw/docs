---
read_when:
    - Je wilt het meegeleverde Codex-appserverharnas gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op PI
summary: Voer ingebedde agentbeurten van OpenClaw uit via de meegeleverde Codex app-server-harness
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-07T13:23:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex`-Plugin laat OpenClaw ingesloten agentbeurten uitvoeren via de
Codex app-server in plaats van via de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex de agent-sessie op laag niveau beheert: modeldetectie, native thread hervatten, native compaction en uitvoering via de app-server.
OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie, tools,
goedkeuringen, medialevering en de zichtbare transcriptspiegel.

Wanneer een bron-chatbeurt via de Codex-harness loopt, gebruiken zichtbare antwoorden standaard
de OpenClaw `message`-tool als de deployment `messages.visibleReplies` niet expliciet heeft geconfigureerd. De agent kan zijn Codex-beurt nog steeds privé afronden;
hij plaatst alleen iets in het kanaal wanneer hij `message(action="send")` aanroept. Stel
`messages.visibleReplies: "automatic"` in om afsluitende antwoorden in directe chats op het
verouderde automatische afleverpad te houden.

Codex Heartbeat-beurten krijgen standaard ook de `heartbeat_respond`-tool, zodat de
agent kan vastleggen of de wake stil moet blijven of moet melden, zonder die control flow
in afsluitende tekst te coderen.

Heartbeat-specifieke initiatiefrichtlijnen worden als een Codex collaboration-mode
developer-instructie op de Heartbeat-beurt zelf meegestuurd. Gewone chatbeurten herstellen
in plaats daarvan de Codex Default-modus, zonder Heartbeat-filosofie mee te dragen in hun normale
runtimeprompt.

Als je je probeert te oriënteren, begin dan met
[Agent-runtimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Snelle configuratie

De meeste gebruikers die "Codex in OpenClaw" willen, willen deze route: meld je aan met een
ChatGPT/Codex-abonnement en voer daarna ingesloten agentbeurten uit via de native
Codex app-server-runtime. De modelreferentie blijft canoniek als
`openai/gpt-*`; abonnementsauthenticatie komt van het Codex-account/-profiel, niet
van een `openai-codex/*`-modelprefix.

Meld je eerst aan met Codex OAuth als je dat nog niet hebt gedaan:

```bash
openclaw models auth login --provider openai-codex
```

Schakel daarna de gebundelde `codex`-Plugin in en forceer de Codex-runtime:

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

Gebruik geen `openai-codex/gpt-*` in configuratie. Die prefix is een verouderde route die
`openclaw doctor --fix` herschrijft naar `openai/gpt-*` voor primaire modellen,
fallbacks, Heartbeat-/subagent-/Compaction-overschrijvingen, hooks, kanaaloverschrijvingen
en verouderde vastgelegde sessieroute-pins.

## Wat deze Plugin verandert

De gebundelde `codex`-Plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                       | Hoe je die gebruikt                                  | Wat het doet                                                                  |
| ---------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingesloten runtime          | `agentRuntime.id: "codex"`                          | Voert ingesloten OpenClaw-agentbeurten uit via Codex app-server.              |
| Native chatbesturingscommando's    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Koppelt en bestuurt Codex app-server-threads vanuit een berichtenconversatie. |
| Codex app-server-provider/catalogus | `codex` internals, zichtbaar via de harness         | Laat de runtime app-server-modellen ontdekken en valideren.                   |
| Codex-pad voor mediabegrip         | `codex/*` image-model-compatibiliteitspaden         | Voert begrensde Codex app-server-beurten uit voor ondersteunde modellen voor beeldbegrip. |
| Native hookrelay                   | Plugin-hooks rond Codex-native events               | Laat OpenClaw ondersteunde Codex-native tool-/finalisatie-events observeren/blokkeren. |

Het inschakelen van de Plugin maakt die mogelijkheden beschikbaar. Het doet **niet** het volgende:

- directe OpenAI API-key-oppervlakken vervangen, zoals afbeeldingen, embeddings, spraak of
  realtime
- `openai-codex/*`-modelreferenties converteren zonder `openclaw doctor --fix`
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies hot-switchen die al een PI-runtime hebben vastgelegd
- OpenClaw-kanaallevering, sessiebestanden, opslag van auth-profielen of
  berichtroutering vervangen

Dezelfde Plugin is ook eigenaar van het native `/codex`-chatbesturingscommando-oppervlak. Als
de Plugin is ingeschakeld en de gebruiker vraagt om Codex-threads vanuit chat te koppelen,
hervatten, sturen, stoppen of inspecteren, moeten agents `/codex ...` verkiezen boven ACP. ACP blijft
de expliciete fallback wanneer de gebruiker om ACP/acpx vraagt of de ACP
Codex-adapter test.

Native Codex-beurten houden OpenClaw Plugin-hooks als de publieke compatibiliteitslaag.
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
resultaat wordt teruggegeven aan Codex. Dit staat los van de publieke
`tool_result_persist`-Plugin-hook, die transcript-toolresultaatschrijfacties die eigendom zijn van OpenClaw transformeert.

Zie voor de semantiek van de Plugin-hooks zelf [Plugin-hooks](/nl/plugins/hooks)
en [Plugin-guardgedrag](/nl/tools/plugin).

OpenAI-agentmodelreferenties gebruiken standaard de harness. Nieuwe configuraties moeten
OpenAI-modelreferenties canoniek houden als `openai/gpt-*`; `agentRuntime.id: "codex"` is
nog steeds geldig, maar niet langer vereist voor OpenAI-agentbeurten. Verouderde `codex/*`-
modelreferenties selecteren de harness nog steeds automatisch voor compatibiliteit, maar
runtime-ondersteunde verouderde providerprefixen worden niet getoond als normale model-/providerkeuzes.

Als een geconfigureerde modelroute nog steeds `openai-codex/*` is, herschrijft `openclaw doctor --fix`
die naar `openai/*`. Voor overeenkomende agentroutes stelt het de agentruntime
in op `codex` en behoudt het bestaande `openai-codex`-auth-profieloverschrijvingen.

## Routemap

Gebruik deze tabel voordat je configuratie wijzigt:

| Gewenst gedrag                                      | Modelreferentie           | Runtimeconfiguratie                   | Auth-/profielroute            | Verwacht statuslabel         |
| --------------------------------------------------- | ------------------------- | ------------------------------------- | ----------------------------- | ---------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime   | `openai/gpt-*`            | weggelaten of `agentRuntime.id: "codex"` | Codex OAuth of Codex-account | `Runtime: OpenAI Codex`      |
| OpenAI API-key-auth voor agentmodellen              | `openai/gpt-*`            | weggelaten of `agentRuntime.id: "codex"` | `openai-codex` API-key-profiel | `Runtime: OpenAI Codex`    |
| Verouderde configuratie die doctor-reparatie nodig heeft | `openai-codex/gpt-*` | gerepareerd naar `codex`              | Bestaande geconfigureerde auth | Controleer opnieuw na `doctor --fix` |
| Gemengde providers met conservatieve automatische modus | providerspecifieke referenties | `agentRuntime.id: "auto"`       | Per geselecteerde provider    | Afhankelijk van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie                  | afhankelijk van ACP-prompt/model | `sessions_spawn` met `runtime: "acp"` | ACP-backend-auth          | ACP-taak-/sessiestatus       |

De belangrijke scheiding is provider versus runtime:

- `openai-codex/*` is een verouderde route die doctor herschrijft.
- `agentRuntime.id: "codex"` vereist de Codex-harness en faalt gesloten als die
  niet beschikbaar is.
- `agentRuntime.id: "auto"` laat geregistreerde harnesses overeenkomende provider-
  routes claimen; OpenAI-agentreferenties worden naar Codex opgelost in plaats van PI.
- `/codex ...` beantwoordt "aan welke native Codex-conversatie moet deze chat
  koppelen of welke moet deze besturen?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

OpenAI-familieroutes zijn prefixspecifiek. Gebruik voor de gangbare setup met abonnement plus
native Codex-runtime `openai/*`.
Behandel `openai-codex/*` als verouderde configuratie die doctor moet herschrijven:

| Modelreferentie                                  | Runtimepad                               | Gebruik wanneer                                                   |
| ------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                 | Codex app-server-harness voor agentbeurten | Je OpenAI-agentmodellen via Codex wilt gebruiken.                |
| `openai-codex/gpt-5.5`                           | Verouderde route gerepareerd door doctor | Je oude configuratie gebruikt; voer `openclaw doctor --fix` uit om die te herschrijven. |
| `openai/gpt-5.5` + `openai-codex` API-key-profiel | Codex app-server-harness                | Je API-key-auth voor een OpenAI-agentmodel wilt gebruiken.        |

GPT-5.5 kan zowel op directe OpenAI API-key- als Codex-abonnementsroutes verschijnen
wanneer je account die beschikbaar maakt. Gebruik `openai/gpt-5.5` met de Codex app-server-
harness voor native Codex-runtime, of `openai/gpt-5.5` zonder Codex-runtime-
overschrijving voor direct API-key-verkeer.

Verouderde `codex/gpt-*`-referenties blijven geaccepteerd als compatibiliteitsaliassen. Doctor-
compatibiliteitsmigratie herschrijft verouderde runtimereferenties naar canonieke modelreferenties
en legt het runtimebeleid afzonderlijk vast. Nieuwe native app-server-harnessconfiguraties
moeten `openai/gpt-*` plus `agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai/gpt-*` voor de normale OpenAI-route en `codex/gpt-*` wanneer beeldbegrip
via een begrensde Codex app-server-beurt moet lopen. Gebruik geen
`openai-codex/gpt-*`; doctor herschrijft die verouderde prefix naar `openai/gpt-*`. Het
Codex app-server-model moet ondersteuning voor beeldinvoer adverteren; tekst-only Codex-
modellen falen voordat de mediabeurt start.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen. Als de
selectie verrassend is, schakel debuglogging in voor het `agents/harness`-subsysteem
en inspecteer het gestructureerde `agent harness selected`-record van de gateway. Het
bevat de geselecteerde harness-id, selectiereden, runtime-/fallbackbeleid en,
in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

### Wat doctor-waarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer geconfigureerde modelreferenties of vastgelegde sessieroute-
status nog steeds `openai-codex/*` gebruiken. `openclaw doctor --fix` herschrijft die routes
naar:

- `openai/<model>`
- `agentRuntime.id: "codex"`

De `codex`-route forceert de native Codex-harness. PI-runtimeconfiguratie is niet
toegestaan voor OpenAI-agentmodelbeurten.
Doctor repareert ook verouderde vastgelegde sessiepins in ontdekte agent-sessiestores,
zodat oude conversaties niet vast blijven zitten op de verwijderde route.

Harnessselectie is geen live sessiebesturing. Wanneer een ingesloten beurt loopt,
legt OpenClaw de geselecteerde harness-id vast op die sessie en blijft die gebruiken voor
latere beurten met dezelfde sessie-id. Wijzig `agentRuntime`-configuratie of
`OPENCLAW_AGENT_RUNTIME` wanneer je wilt dat toekomstige sessies een andere harness gebruiken;
gebruik `/new` of `/reset` om een nieuwe sessie te starten voordat je een bestaande
conversatie tussen PI en Codex wisselt. Dit voorkomt dat één transcript door
twee incompatibele native sessiesystemen wordt afgespeeld.

Verouderde sessies die zijn aangemaakt voordat harness-pins bestonden, worden als PI-gepind behandeld zodra ze
transcriptgeschiedenis hebben. Gebruik `/new` of `/reset` om die conversatie na een
configuratiewijziging naar Codex over te zetten.

`/status` toont de effectieve modelruntime. De standaard PI-harness verschijnt als
`Runtime: OpenClaw Pi Default`, en de Codex app-server-harness verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de gebundelde `codex`-plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De gebundelde plugin beheert standaard een compatibele
  Codex app-server-binary, dus lokale `codex`-commando's op `PATH` hebben
  geen invloed op normaal opstarten van de harness.
- Codex-authenticatie beschikbaar voor het app-server-proces of voor OpenClaw's Codex-authenticatiebridge. Lokale app-server-starts gebruiken een door OpenClaw beheerde Codex-home voor elke
  agent en een geïsoleerde child-`HOME`, zodat ze standaard niet je persoonlijke
  `~/.codex`-account, skills, plugins, configuratie, threadstatus of native
  `$HOME/.agents/skills` lezen.

De plugin blokkeert oudere of niet-geversioneerde app-server-handshakes. Dat houdt
OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt authenticatie meestal uit het Codex CLI-account
of een OpenClaw `openai-codex`-authenticatieprofiel. Lokale stdio app-server-starts kunnen
ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Workspace-bootstrapbestanden

Codex verwerkt `AGENTS.md` zelf via native projectdocdetectie. OpenClaw
schrijft geen synthetische Codex-projectdocbestanden en is niet afhankelijk van Codex-fallbackbestandsnamen
voor persona-bestanden, omdat Codex-fallbacks alleen van toepassing zijn wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw-workspacepariteit lost de Codex-harness de andere bootstrapbestanden
op (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` en `MEMORY.md` wanneer aanwezig) en stuurt ze door via Codex-
developerinstructies op `thread/start` en `thread/resume`. Dit houdt
`SOUL.md` en gerelateerde workspace-persona-/profielcontext zichtbaar op de native
Codex-baan voor gedragsvorming zonder `AGENTS.md` te dupliceren.

## Voeg Codex toe naast andere modellen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen schakelen
tussen Codex- en niet-Codex-providermodellen. Een geforceerde runtime is van toepassing op elke
ingebedde beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl
die runtime geforceerd is, probeert OpenClaw nog steeds de Codex-harness en faalt gesloten
in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Zet Codex op een toegewezen agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en PI-fallback voor normaal gemengd
  providergebruik.
- Gebruik oude `codex/*`-refs alleen voor compatibiliteit. Nieuwe configuraties zouden de voorkeur moeten geven aan
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
- De `codex`-agent gebruikt de Codex app-server-harness.
- Als Codex ontbreekt of niet wordt ondersteund voor de `codex`-agent, faalt de beurt
  in plaats van stilletjes PI te gebruiken.

## Routing van agentcommando's

Agents moeten gebruikersverzoeken routeren op intentie, niet alleen op het woord "Codex":

| Gebruiker vraagt om...                                 | Agent moet gebruiken...                          |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bind deze chat aan Codex"                             | `/codex bind`                                    |
| "Hervat Codex-thread `<id>` hier"                      | `/codex resume <id>`                             |
| "Toon Codex-threads"                                   | `/codex threads`                                 |
| "Dien een supportrapport in voor een slechte Codex-run" | `/diagnostics [note]`                            |
| "Stuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                      |
| "Gebruik mijn ChatGPT/Codex-abonnement met Codex-runtime" | `openai/*`                                       |
| "Repareer oude `openai-codex/*`-configuratie-/sessiepins" | `openclaw doctor --fix`                          |
| "Voer Codex uit via ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en geen native sub-agents |

OpenClaw adverteert ACP-spawnbegeleiding alleen aan agents wanneer ACP is ingeschakeld,
dispatchbaar is en wordt ondersteund door een geladen runtime-backend. Als ACP niet beschikbaar is,
mogen de systeemprompt en plugin-Skills de agent niets leren over ACP-routing.

## Alleen-Codex-deployments

Forceer de Codex-harness wanneer je moet bewijzen dat elke ingebedde agentbeurt
Codex gebruikt. Expliciete plugin-runtimes falen gesloten en worden nooit stilzwijgend opnieuw geprobeerd
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

Met geforceerde Codex faalt OpenClaw vroeg als de Codex-plugin is uitgeschakeld, de
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

Gebruik normale sessiecommando's om van agent en model te wisselen. `/new` maakt een nieuwe
OpenClaw-sessie en de Codex-harness maakt of hervat zijn sidecar app-server-
thread wanneer nodig. `/reset` wist de OpenClaw-sessiebinding voor die thread
en laat de volgende beurt de harness opnieuw oplossen vanuit de huidige configuratie.

## Modeldetectie

Standaard vraagt de Codex-plugin de app-server om beschikbare modellen. Als
detectie mislukt of een time-out krijgt, gebruikt deze een gebundelde fallbackcatalogus voor:

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

De beheerde binary wordt geleverd met het `codex`-pluginpakket. Dit houdt de
app-server-versie gekoppeld aan de gebundelde plugin in plaats van aan welke aparte
Codex CLI toevallig lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer
je bewust een ander uitvoerbaar bestand wilt uitvoeren.

Standaard start OpenClaw lokale Codex-harness-sessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt
voor autonome Heartbeats: Codex kan shell- en netwerktools gebruiken zonder
te stoppen bij native goedkeuringsprompts die niemand kan beantwoorden.

Om je aan te melden voor door Codex guardian beoordeelde goedkeuringen, stel je `appServer.mode:
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
de sandbox te verlaten, buiten de workspace te schrijven of machtigingen zoals netwerktoegang
toe te voegen, routeert Codex dat goedkeuringsverzoek naar de native reviewer in plaats van naar een
menselijke prompt. De reviewer past Codex's risicokader toe en keurt het specifieke verzoek goed
of wijst het af. Gebruik Guardian wanneer je meer vangrails wilt dan YOLO-modus,
maar nog steeds onbeheerde agents nodig hebt om voortgang te boeken.

De `guardian`-preset breidt uit naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"`.
Individuele beleidsvelden overschrijven nog steeds `mode`, zodat geavanceerde deployments de
preset kunnen combineren met expliciete keuzes. De oudere reviewerwaarde `guardian_subagent` wordt
nog steeds geaccepteerd als compatibiliteitsalias, maar nieuwe configuraties zouden
`auto_review` moeten gebruiken.

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
maar OpenClaw is eigenaar van de Codex app-server-accountbridge en stelt zowel
`CODEX_HOME` als `HOME` in op per-agent-directories onder de OpenClaw-status
van die agent. Codex's eigen skillloader leest `$CODEX_HOME/skills` en
`$HOME/.agents/skills`, dus beide waarden zijn geïsoleerd voor lokale app-server-
starts. Dat houdt Codex-native Skills, plugins, configuratie, accounts en threadstatus
gescopeerd naar de OpenClaw-agent in plaats van dat ze binnenlekken vanuit de persoonlijke
Codex CLI-home van de operator.

OpenClaw-plugins en OpenClaw-skill-snapshots lopen nog steeds via OpenClaw's eigen
pluginregister en skillloader. Persoonlijke Codex CLI-assets doen dat niet. Als je
nuttige Codex CLI-Skills of plugins hebt die onderdeel van een OpenClaw-agent moeten worden,
inventariseer ze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

De Codex-migratieprovider kopieert Skills naar de huidige OpenClaw-agent-
workspace. Codex native plugins, hooks en configuratiebestanden worden gerapporteerd of gearchiveerd
voor handmatige beoordeling in plaats van automatisch geactiveerd, omdat ze
commando's kunnen uitvoeren, MCP-servers kunnen blootstellen of referenties kunnen bevatten.

Authenticatie wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-authenticatie
   nog steeds vereist is.

Wanneer OpenClaw een ChatGPT-abonnementsachtig Codex-authenticatieprofiel ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Dat
houdt API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex app-server-beurten per ongeluk via de API worden gefactureerd.
Expliciete Codex API-sleutelprofielen en lokale stdio env-key-fallback gebruiken app-server-
login in plaats van overgenomen childproces-env. WebSocket app-server-verbindingen
ontvangen geen Gateway env API-key-fallback; gebruik een expliciet authenticatieprofiel of het
eigen account van de remote app-server.

Als een deployment extra omgevingsisolatie nodig heeft, voeg je die variabelen toe aan
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

`appServer.clearEnv` beïnvloedt alleen het gespawnde Codex app-server-childproces.

Codex dynamische tools gebruiken standaard het `native-first`-profiel. In die modus stelt OpenClaw geen dynamische tools beschikbaar die werkruimtebewerkingen dupliceren die native zijn voor Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` en `update_plan`. OpenClaw-integratietools zoals messaging, sessions, media, cron, browser, nodes, gateway, `heartbeat_respond` en `web_search` blijven beschikbaar.

Ondersteunde Codex Plugin-velden op het hoogste niveau:

| Veld                       | Standaard        | Betekenis                                                                                |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gebruik `"openclaw-compat"` om de volledige dynamische toolset van OpenClaw beschikbaar te maken voor Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Aanvullende namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-server-beurten. |

Ondersteunde `appServer`-velden:

| Veld                          | Standaard                                | Betekenis                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                       |
| `command`                     | beheerde Codex-binary                    | Uitvoerbaar bestand voor stdio-transport. Laat dit oningesteld om de beheerde binary te gebruiken; stel het alleen in voor een expliciete override.                                                                                     |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                                                                                                                       |
| `url`                         | oningesteld                              | WebSocket app-server-URL.                                                                                                                                                                                                              |
| `authToken`                   | oningesteld                              | Bearer-token voor WebSocket-transport.                                                                                                                                                                                                 |
| `headers`                     | `{}`                                     | Extra WebSocket-headers.                                                                                                                                                                                                               |
| `clearEnv`                    | `[]`                                     | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio app-server-proces nadat OpenClaw de overgeërfde omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's per-agent Codex-isolatie bij lokale starts. |
| `requestTimeoutMs`            | `60000`                                  | Time-out voor aanroepen van het app-server-besturingsvlak.                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | Stille periode na een turn-scoped Codex app-server-verzoek terwijl OpenClaw wacht op `turn/completed`. Verhoog dit voor trage synthese na tools of fasen met alleen status.                                                           |
| `mode`                        | `"yolo"`                                 | Preset voor YOLO- of guardian-beoordeelde uitvoering.                                                                                                                                                                                  |
| `approvalPolicy`              | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread start/resume/turn wordt gestuurd.                                                                                                                                                      |
| `sandbox`                     | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread start/resume wordt gestuurd.                                                                                                                                                                 |
| `approvalsReviewer`           | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een legacy-alias.                                                                                                          |
| `serviceTier`                 | oningesteld                              | Optionele Codex app-server-servicelaag: `"fast"`, `"flex"` of `null`. Ongeldige legacy-waarden worden genegeerd.                                                                                                                       |

Door OpenClaw beheerde dynamische toolaanroepen worden onafhankelijk van
`appServer.requestTimeoutMs` begrensd: elk Codex `item/tool/call`-verzoek moet
binnen 30 seconden een OpenClaw-reactie ontvangen. Bij een time-out breekt
OpenClaw het toolsignaal af waar dat wordt ondersteund en retourneert het een
mislukte dynamic-tool-reactie aan Codex, zodat de beurt kan doorgaan in plaats
van de sessie in `processing` te laten staan.

Nadat OpenClaw reageert op een turn-scoped Codex app-server-verzoek, verwacht
de harness ook dat Codex de native beurt afrondt met `turn/completed`. Als de
app-server daarna gedurende `appServer.turnCompletionIdleTimeoutMs` stil blijft,
onderbreekt OpenClaw naar beste kunnen de Codex-beurt, legt een diagnostische
time-out vast en geeft de OpenClaw-sessielane vrij, zodat vervolgchatberichten
niet achter een verlopen native beurt in de wachtrij blijven staan. Elke
niet-terminale notificatie voor dezelfde beurt, inclusief
`rawResponseItem/completed`, schakelt die korte watchdog uit omdat Codex heeft
bewezen dat de beurt nog actief is; de langere terminale watchdog blijft echt
vastgelopen beurten beschermen. Time-outdiagnostiek bevat de laatste
app-server-notificatiemethode en, voor onbewerkte assistentresponsitems, het
itemtype, de rol, de id en een begrensde voorbeeldweergave van assistenttekst.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Config
heeft de voorkeur voor herhaalbare deployments, omdat het Plugin-gedrag in
hetzelfde beoordeelde bestand blijft als de rest van de Codex-harnessconfiguratie.

## Computergebruik

Computer Use wordt behandeld in een eigen installatiehandleiding:
[Codex Computer Use](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de app voor desktopbesturing niet en voert
zelf geen desktopacties uit. Het bereidt Codex app-server voor, verifieert dat
de `computer-use` MCP-server beschikbaar is, en laat Codex vervolgens de native
MCP-toolaanroepen afhandelen tijdens Codex-modusbeurten.

Voor directe toegang tot de TryCua-driver buiten de Codex-marktplaatsflow
registreer je `cua-driver mcp` met `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zie [Codex Computer Use](/nl/plugins/codex-computer-use) voor het onderscheid
tussen door Codex beheerde Computer Use en directe MCP-registratie.

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

De installatie kan worden gecontroleerd of geïnstalleerd via het opdrachtoppervlak:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use is macOS-specifiek en kan lokale OS-machtigingen vereisen voordat
de Codex MCP-server apps kan besturen. Als `computerUse.enabled` waar is en de
MCP-server niet beschikbaar is, mislukken Codex-modusbeurten voordat de thread
start, in plaats van stilzwijgend zonder de native Computer Use-tools te draaien.
Zie [Codex Computer Use](/nl/plugins/codex-computer-use) voor marktplaatskeuzes,
limieten voor externe catalogi, statusredenen en probleemoplossing.

Wanneer `computerUse.autoInstall` waar is, kan OpenClaw de standaard gebundelde
Codex Desktop-marktplaats registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marktplaats heeft ontdekt. Gebruik `/new` of `/reset` na het
wijzigen van runtime- of Computer Use-config, zodat bestaande sessies geen oude
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

Validatie van alleen de Codex-harness:

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

Modelwisseling blijft door OpenClaw beheerd. Wanneer een OpenClaw-sessie is
gekoppeld aan een bestaande Codex-thread, stuurt de volgende beurt het
momenteel geselecteerde OpenAI-model, de provider, het goedkeuringsbeleid, de
sandbox en de servicelaag opnieuw naar app-server. Overschakelen van
`openai/gpt-5.5` naar `openai/gpt-5.2` behoudt de threadbinding, maar vraagt
Codex om door te gaan met het nieuw geselecteerde model.

## Codex-opdracht

De gebundelde Plugin registreert `/codex` als een geautoriseerd slash-commando.
Het is generiek en werkt op elk kanaal dat OpenClaw-tekstopdrachten ondersteunt.

Veelgebruikte vormen:

- `/codex status` toont live app-serverconnectiviteit, modellen, account, rate limits, MCP-servers en skills.
- `/codex models` toont Codex app-servermodellen live.
- `/codex threads [filter]` toont recente Codex-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt de Codex app-server om de gekoppelde thread te compacten.
- `/codex review` start een native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om bevestiging voordat Codex-diagnosefeedback voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computer Use-Plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computer Use-Plugin en herlaadt MCP-servers.
- `/codex account` toont account- en rate-limitstatus.
- `/codex mcp` toont de MCP-serverstatus van de Codex app-server.
- `/codex skills` toont de skills van de Codex app-server.

Wanneer Codex een fout door een gebruikslimiet meldt, neemt OpenClaw de volgende
resettijd van de app-server op wanneer Codex die heeft verstrekt. Gebruik `/codex account` in hetzelfde
gesprek om de huidige account- en rate-limitvensters te bekijken.

### Veelgebruikte debugging-workflow

Wanneer een door Codex ondersteunde agent iets onverwachts doet in Telegram, Discord, Slack
of een ander kanaal, begin dan met het gesprek waarin het probleem optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit of een andere korte notitie
   die beschrijft wat je zag.
2. Keur het diagnoseverzoek eenmalig goed. De goedkeuring maakt de lokale Gateway-
   diagnose-zip en, omdat de sessie de Codex-harness gebruikt, verzendt ook
   de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnoseantwoord naar het bugrapport of de supportthread.
   Het bevat het lokale bundelpad, de privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een regel `Inspect locally` voor elke Codex-thread.
4. Als je de run zelf wilt debuggen, voer dan de afgedrukte opdracht `Inspect locally`
   uit in een terminal. Die ziet eruit als `codex resume <thread-id>` en opent de
   native Codex-thread zodat je het gesprek kunt inspecteren, lokaal kunt voortzetten
   of Codex kunt vragen waarom het een bepaalde tool of bepaald plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige OpenClaw
Gateway-diagnosebundel. Voor de meeste supportmeldingen is `/diagnostics [note]`
het betere startpunt omdat dit de lokale Gateway-status en Codex-
thread-id's samenbrengt in één antwoord. Zie [Diagnose-export](/nl/gateway/diagnostics)
voor het volledige privacymodel en het gedrag in groepschats.

OpenClaw-kern biedt ook alleen voor eigenaars `/diagnostics [note]` als de algemene
Gateway-diagnoseopdracht. De goedkeuringsprompt toont de preambule over gevoelige gegevens,
linkt naar [Diagnose-export](/nl/gateway/diagnostics) en vraagt
`openclaw gateway diagnostics export --json` aan via expliciete uitvoeringsgoedkeuring
elke keer. Keur diagnoses niet goed met een regel die alles toestaat. Na goedkeuring
verzendt OpenClaw een plakbaar rapport met het lokale bundelpad en de manifest-
samenvatting. Wanneer de actieve OpenClaw-sessie de Codex-harness gebruikt, machtigt
diezelfde goedkeuring ook het verzenden van de relevante Codex-feedbackbundels naar
OpenAI-servers. De goedkeuringsprompt vermeldt dat Codex-feedback wordt verzonden, maar
vermeldt geen Codex-sessie- of thread-id's vóór goedkeuring.

Als `/diagnostics` door een eigenaar in een groepschat wordt aangeroepen, houdt OpenClaw het
gedeelde kanaal schoon: de groep ontvangt alleen een korte melding, terwijl de
diagnosepreambule, goedkeuringsprompts en Codex-sessie-/thread-id's naar
de eigenaar worden verzonden via de privégoedkeuringsroute. Als er geen privéroute naar de eigenaar is,
weigert OpenClaw het groepsverzoek en vraagt het de eigenaar om het vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept `feedback/upload` van de Codex app-server aan en vraagt
de app-server om logs op te nemen voor elke vermelde thread en gespawnde Codex-subthreads
wanneer beschikbaar. De upload verloopt via het normale feedbackpad van Codex naar OpenAI-
servers; als Codex-feedback in die app-server is uitgeschakeld, retourneert de opdracht
de app-serverfout. Het voltooide diagnoseantwoord vermeldt de kanalen,
OpenClaw-sessie-id's, Codex-thread-id's en lokale opdrachten `codex resume <thread-id>`
voor de threads die zijn verzonden. Als je de goedkeuring weigert of negeert,
drukt OpenClaw die Codex-id's niet af. Deze upload vervangt de lokale
Gateway-diagnose-export niet.

`/codex resume` schrijft hetzelfde sidecar-bindingsbestand dat de harness gebruikt voor
normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread, geeft het
momenteel geselecteerde OpenClaw-model door aan de app-server en houdt uitgebreide geschiedenis
ingeschakeld.

### Een Codex-thread inspecteren vanuit de CLI

De snelste manier om een slechte Codex-run te begrijpen is vaak om de native Codex-
thread rechtstreeks te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug opmerkt in een kanaalgesprek en de problematische
Codex-sessie wilt inspecteren, lokaal wilt voortzetten of Codex wilt vragen waarom het een
bepaalde tool- of redeneerkeuze maakte. De makkelijkste route is meestal om eerst
`/diagnostics [note]` uit te voeren: nadat je dit goedkeurt, vermeldt het voltooide rapport
elke Codex-thread en drukt het een opdracht `Inspect locally` af, bijvoorbeeld
`codex resume <thread-id>`. Je kunt die opdracht direct naar een terminal kopiëren.

Je kunt ook een thread-id krijgen via `/codex binding` voor de huidige chat of
`/codex threads [filter]` voor recente Codex app-serverthreads, en daarna dezelfde
opdracht `codex resume` uitvoeren in je shell.

Het opdrachtoppervlak vereist Codex app-server `0.125.0` of nieuwer. Afzonderlijke
controlemethoden worden gemeld als `unsupported by this Codex app-server` als een
toekomstige of aangepaste app-server die JSON-RPC-methode niet beschikbaar stelt.

## Hook-grenzen

De Codex-harness heeft drie hooklagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin-hooks                 | OpenClaw                 | Product-/Plugin-compatibiliteit tussen PI- en Codex-harnassen.      |
| Codex app-serverextensiemiddleware    | Gebundelde OpenClaw-plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.             |
| Native Codex-hooks                    | Codex                    | Low-level Codex-levenscyclus en native toolbeleid vanuit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex-bestanden `hooks.json` om
OpenClaw Plugin-gedrag te routeren. Voor de ondersteunde native tool- en permissiebridge
injecteert OpenClaw per-thread Codex-configuratie voor `PreToolUse`, `PostToolUse`,
`PermissionRequest` en `Stop`. Wanneer goedkeuringen van de Codex app-server zijn ingeschakeld
(`approvalPolicy` is niet `"never"`), laat de standaard geïnjecteerde native hookconfiguratie
`PermissionRequest` weg zodat de app-serverreviewer van Codex en de goedkeuringsbridge van OpenClaw
echte escalaties na review afhandelen. Operators kunnen nog steeds expliciet
`permission_request` toevoegen aan `nativeHookRelay.events` wanneer ze de compatibiliteitsrelay
nodig hebben. Andere Codex-hooks zoals `SessionStart` en `UserPromptSubmit` blijven
controles op Codex-niveau; ze worden in het v1-contract niet beschikbaar gesteld als
OpenClaw Plugin-hooks.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de
aanroep vraagt, dus OpenClaw vuurt het Plugin- en middlewaregedrag dat het bezit af in de
harnessadapter. Voor Codex-native tools bezit Codex het canonieke toolrecord.
OpenClaw kan geselecteerde gebeurtenissen spiegelen, maar kan de native Codex-
thread niet herschrijven tenzij Codex die bewerking beschikbaar stelt via de app-server of native hook-
callbacks.

Projecties van Compaction en de LLM-levenscyclus komen van meldingen van de Codex app-server
en OpenClaw-adapterstatus, niet van native Codex-hookopdrachten.
De gebeurtenissen `before_compaction`, `after_compaction`, `llm_input` en
`llm_output` van OpenClaw zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen
van de interne aanvraag- of Compaction-payloads van Codex.

Native Codex-meldingen `hook/started` en `hook/completed` van de app-server worden
geprojecteerd als agentgebeurtenissen `codex_app_server.hook` voor traject en debugging.
Ze roepen geen OpenClaw Plugin-hooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex bezit meer van
de native modellus, en OpenClaw past zijn Plugin- en sessieoppervlakken
aan rond die grens.

Ondersteund in Codex-runtime v1:

| Oppervlak                                     | Ondersteuning                                                                        | Waarom                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                     | Ondersteund                                                                          | De Codex app-server beheert de OpenAI-beurt, native thread-hervatting en native tool-voortzetting.                                                                                                        |
| OpenClaw-kanaalroutering en levering          | Ondersteund                                                                          | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                            |
| Dynamische OpenClaw-tools                     | Ondersteund                                                                          | Codex vraagt OpenClaw om deze tools uit te voeren, zodat OpenClaw in het uitvoeringspad blijft.                                                                                                           |
| Prompt- en contextplugins                     | Ondersteund                                                                          | OpenClaw bouwt prompt-overlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                        |
| Levenscyclus van de contextengine             | Ondersteund                                                                          | Samenstellen, ingest of onderhoud na de beurt, en coördinatie van contextengine-Compaction worden uitgevoerd voor Codex-beurten.                                                                           |
| Dynamische tool-hooks                         | Ondersteund                                                                          | `before_tool_call`, `after_tool_call` en tool-resultaatmiddleware worden uitgevoerd rond dynamische tools die eigendom zijn van OpenClaw.                                                                  |
| Levenscyclus-hooks                            | Ondersteund als adapterobservaties                                                   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` worden geactiveerd met eerlijke Codex-modus-payloads.                                                                    |
| Revisiepoort voor eindantwoord                | Ondersteund via de native hook-relay                                                 | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog een modelpass vóór finalisatie.                                                                                 |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via de native hook-relay                                             | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor vastgelegde native tool-oppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native machtigingsbeleid                      | Ondersteund via Codex app-server-goedkeuringen en de compatibiliteitsrelaye voor native hooks | Codex app-server-goedkeuringsverzoeken lopen via OpenClaw na Codex-beoordeling. De native hook-relay `PermissionRequest` is opt-in voor native goedkeuringsmodi, omdat Codex deze vóór guardian-beoordeling uitzendt. |
| App-server-trajectvastlegging                 | Ondersteund                                                                          | OpenClaw registreert het verzoek dat het naar de app-server heeft gestuurd en de app-server-meldingen die het ontvangt.                                                                                   |

Niet ondersteund in Codex runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                        | Toekomstig pad                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutatie van native tool-argumenten                  | Codex-native pre-tool-hooks kunnen blokkeren, maar OpenClaw herschrijft geen Codex-native tool-argumenten.                                      | Vereist Codex hook-/schema-ondersteuning voor vervangende tool-invoer.                   |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex beheert de canonieke native threadgeschiedenis. OpenClaw beheert een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadchirurgie nodig is.           |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, niet Codex-native toolrecords.                                          | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning. |
| Rijke native Compaction-metadata                    | OpenClaw observeert het begin en de voltooiing van Compaction, maar ontvangt geen stabiele lijst met behouden/verwijderde items, tokendelta of samenvattingspayload. | Heeft rijkere Codex-Compaction-events nodig.                                             |
| Compaction-interventie                              | Huidige OpenClaw-Compaction-hooks zijn in Codex-modus op meldingsniveau.                                                                        | Voeg Codex pre-/post-Compaction-hooks toe als plugins native Compaction moeten kunnen vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-verzoeken  | OpenClaw kan app-server-verzoeken en meldingen vastleggen, maar Codex core bouwt het uiteindelijke OpenAI API-verzoek intern.                   | Vereist een Codex model-request tracing-event of debug-API.                              |

## Tools, media en Compaction

De Codex-harness wijzigt alleen de low-level ingebedde agentexecutor.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van de
harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en uitvoer van
berichtentools blijven via het normale OpenClaw-leveringspad lopen.

De native hook-relay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de Codex-native tool- en machtigingspaden die OpenClaw test. In
de Codex runtime omvat dat shell-, patch- en MCP-`PreToolUse`-,
`PostToolUse`- en `PermissionRequest`-payloads. Neem niet aan dat elk toekomstig
Codex-hookevent een OpenClaw-pluginoppervlak is totdat het runtimecontract
het noemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of
weigeren-beslissingen wanneer beleid beslist. Een resultaat zonder beslissing is
geen toestaan. Codex behandelt het als geen hookbeslissing en valt terug op zijn
eigen guardian- of gebruikersgoedkeuringspad. Codex app-server-goedkeuringsmodi
laten deze native hook standaard weg; deze alinea geldt wanneer `permission_request`
expliciet is opgenomen in `nativeHookRelay.events` of een compatibiliteitsruntime
deze installeert.
Wanneer een operator `allow-always` kiest voor een Codex native machtigingsverzoek,
onthoudt OpenClaw die exacte provider-/sessie-/toolinvoer-/cwd-vingerafdruk voor een
begrensd sessievenster. De onthouden beslissing is bewust alleen een exacte match:
een gewijzigd commando, gewijzigde argumenten, toolpayload of cwd maakt een nieuwe
goedkeuring aan.

Codex MCP-toolgoedkeuringselicitations worden via de plugin-goedkeuringsflow van
OpenClaw gerouteerd wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex-`request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende in de wachtrij geplaatste follow-upbericht
beantwoordt dat native serververzoek in plaats van als extra context te worden gestuurd.
Andere MCP-elicitationverzoeken falen nog steeds gesloten.

Active-run-wachtrijsturing wordt gemapt op Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` bundelt OpenClaw chatberichten in de wachtrij
gedurende het geconfigureerde stille venster en verzendt ze als één `turn/steer`-verzoek
in aankomstvolgorde. De legacy `queue`-modus verzendt afzonderlijke `turn/steer`-verzoeken.
Codex-beoordelings- en handmatige Compaction-beurten kunnen sturing binnen dezelfde beurt
weigeren; in dat geval gebruikt OpenClaw de followup-wachtrij wanneer de geselecteerde
modus fallback toestaat. Zie [Sturingswachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt native thread-Compaction
gedelegeerd aan Codex app-server. OpenClaw bewaart een transcriptspiegel voor
kanaalgeschiedenis, zoeken, `/new`, `/reset` en toekomstige model- of harnesswisselingen. De
spiegel bevat de gebruikersprompt, definitieve assistenttekst en lichte Codex-redeneer- of
planrecords wanneer de app-server die uitzendt. Vandaag registreert OpenClaw alleen
signalen voor het begin en de voltooiing van native Compaction. Het toont nog geen
menselijk leesbare Compaction-samenvatting of een controleerbare lijst van welke vermeldingen
Codex na Compaction heeft behouden.

Omdat Codex de canonieke native thread beheert, herschrijft `tool_result_persist` momenteel
geen Codex-native toolresultaatrecords. Het is alleen van toepassing wanneer
OpenClaw een toolresultaat naar een OpenClaw-eigen sessietranscript schrijft.

Mediageneratie vereist geen PI. Afbeelding, video, muziek, PDF, TTS en mediabegrip
blijven de bijpassende provider-/modelinstellingen gebruiken, zoals
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en
`messages.tts`.

## Probleemoplossing

**Codex verschijnt niet als normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model met
`agentRuntime.id: "codex"` (of een legacy `codex/*`-ref), schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan nog steeds PI gebruiken als
compatibiliteitsbackend wanneer geen Codex-harness de run claimt. Stel
`agentRuntime.id: "codex"` in om Codex-selectie tijdens het testen af te dwingen. Een
afgedwongen Codex runtime faalt in plaats van terug te vallen op PI. Zodra Codex app-server
is geselecteerd, komen de fouten daarvan rechtstreeks naar voren.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake
versie `0.125.0` of nieuwer rapporteert. Pre-releases met dezelfde versie of versies
met buildsuffix zoals `0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd, omdat de
stabiele protocolondergrens `0.125.0` is wat OpenClaw test.

**Modelontdekking is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel ontdekking uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`
en of de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een legacy
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven in
`auto`-modus op hun normale providerpad. Als je `agentRuntime.id: "codex"` afdwingt, moet elke ingebedde
beurt voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd, maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan `/new` of `/reset`; als het probleem aanhoudt, herstart
de Gateway om verouderde native hook-registraties te wissen. Als `computer-use.list_apps`
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
