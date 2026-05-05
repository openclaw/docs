---
read_when:
    - Je wilt het meegeleverde Codex-appserverharnas gebruiken
    - Je hebt voorbeelden van Codex-harnasconfiguratie nodig
    - Je wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op PI
summary: Voer ingebedde OpenClaw-agentbeurten uit via het meegeleverde Codex-app-serverharnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-05T01:48:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

De meegeleverde `codex`-plugin laat OpenClaw ingebedde agentbeurten uitvoeren via de
Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex eigenaar is van de laag-niveau agentsessie:
modeldetectie, native thread hervatten, native Compaction en app-serveruitvoering.
OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie, tools,
goedkeuringen, medialevering en de zichtbare transcriptspiegel.

Wanneer een chatbeurt vanuit een bron via de Codex-harness loopt, gebruiken
zichtbare antwoorden standaard de OpenClaw `message`-tool als de deployment
`messages.visibleReplies` niet expliciet heeft geconfigureerd. De agent kan zijn
Codex-beurt nog steeds privé afronden; hij plaatst alleen iets in het kanaal
wanneer hij `message(action="send")` aanroept. Stel
`messages.visibleReplies: "automatic"` in om directe-chat-eindantwoorden op het
verouderde automatische afleverpad te houden.

Codex Heartbeat-beurten krijgen standaard ook de `heartbeat_respond`-tool, zodat
de agent kan vastleggen of de wake stil moet blijven of een melding moet sturen
zonder die controlflow in de eindtekst te coderen.

Heartbeat-specifieke initiatiefbegeleiding wordt als een Codex developer-instructie
voor samenwerkingsmodus meegestuurd bij de Heartbeat-beurt zelf. Gewone
chatbeurten herstellen in plaats daarvan de Codex-standaardmodus, zonder
Heartbeat-filosofie mee te dragen in hun normale runtimeprompt.

Als je je probeert te oriënteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Snelle configuratie

De meeste gebruikers die "Codex in OpenClaw" willen, willen deze route: meld je
aan met een ChatGPT/Codex-abonnement en voer daarna ingebedde agentbeurten uit
via de native Codex app-server-runtime. De modelreferentie blijft canoniek als
`openai/gpt-*`; abonnementsauthenticatie komt uit het Codex-account/profiel, niet
uit een `openai-codex/*`-modelprefix.

Meld je eerst aan met Codex OAuth als je dat nog niet hebt gedaan:

```bash
openclaw models auth login --provider openai-codex
```

Schakel daarna de meegeleverde `codex`-plugin in en forceer de Codex-runtime:

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

Gebruik geen `openai-codex/gpt-*` wanneer je native Codex-runtime bedoelt. Die
prefix is de expliciete route "Codex OAuth via PI". Configuratiewijzigingen
gelden voor nieuwe of geresette sessies; bestaande sessies behouden hun
vastgelegde runtime.

## Wat deze plugin verandert

De meegeleverde `codex`-plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                     | Hoe je die gebruikt                                 | Wat het doet                                                                  |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingebedde runtime         | `agentRuntime.id: "codex"`                          | Voert OpenClaw-ingebedde agentbeurten uit via Codex app-server.               |
| Native chatbesturingsopdrachten  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindt en bestuurt Codex app-server-threads vanuit een berichtenconversatie.   |
| Codex app-serverprovider/catalog | `codex` internals, zichtbaar via de harness         | Laat de runtime app-servermodellen ontdekken en valideren.                    |
| Codex-pad voor mediabegrip       | `codex/*` image-model compatibiliteitspaden         | Voert begrensde Codex app-serverbeurten uit voor ondersteunde beeldbegripmodellen. |
| Native hookrelay                 | Plugin hooks rond Codex-native events               | Laat OpenClaw ondersteunde Codex-native tool-/finalisatie-events observeren/blokkeren. |

Het inschakelen van de plugin maakt die mogelijkheden beschikbaar. Het doet **niet**:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelreferenties omzetten naar de native runtime
- ACP/acpx tot het standaard Codex-pad maken
- bestaande sessies hot-switchen die al een PI-runtime hebben vastgelegd
- OpenClaw-kanaalaflevering, sessiebestanden, auth-profielopslag of
  berichtroutering vervangen

Dezelfde plugin is ook eigenaar van het native `/codex`-chatbesturingsoppervlak.
Als de plugin is ingeschakeld en de gebruiker vraagt om Codex-threads vanuit chat
te binden, hervatten, sturen, stoppen of inspecteren, moeten agents de voorkeur
geven aan `/codex ...` boven ACP. ACP blijft de expliciete fallback wanneer de
gebruiker om ACP/acpx vraagt of de ACP Codex-adapter test.

Native Codex-beurten behouden OpenClaw-pluginhooks als de openbare
compatibiliteitslaag. Dit zijn in-process OpenClaw-hooks, geen Codex
`hooks.json`-command hooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` voor gespiegelde transcriptrecords
- `before_agent_finalize` via Codex `Stop`-relay
- `agent_end`

Plugins kunnen ook runtime-neutrale middleware voor toolresultaten registreren
om dynamische OpenClaw-toolresultaten te herschrijven nadat OpenClaw de tool
uitvoert en voordat het resultaat naar Codex wordt teruggestuurd. Dit staat los
van de openbare `tool_result_persist`-pluginhook, die transcript-toolresultaatwrites
transformeert waarvan OpenClaw eigenaar is.

Zie voor de semantiek van de pluginhooks zelf [Plugin hooks](/nl/plugins/hooks)
en [Gedrag van Plugin-guards](/nl/tools/plugin).

De harness staat standaard uit. Nieuwe configuraties moeten OpenAI-modelreferenties
canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` forceren wanneer ze
native app-serveruitvoering willen. Verouderde `codex/*`-modelreferenties
selecteren de harness nog steeds automatisch voor compatibiliteit, maar
runtime-ondersteunde verouderde providerprefixen worden niet als normale
model-/providerkeuzes getoond.

Als de `codex`-plugin is ingeschakeld maar het primaire model nog steeds
`openai-codex/*` is, waarschuwt `openclaw doctor` in plaats van de route te
wijzigen. Dat is bewust: `openai-codex/*` blijft het PI Codex
OAuth-/abonnementspad, en native app-serveruitvoering blijft een expliciete
runtimekeuze.

## Routekaart

Gebruik deze tabel voordat je configuratie wijzigt:

| Gewenst gedrag                                      | Modelreferentie          | Runtimeconfiguratie                  | Auth-/profielroute          | Verwacht statuslabel            |
| --------------------------------------------------- | ------------------------ | ------------------------------------ | --------------------------- | ------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime   | `openai/gpt-*`           | `agentRuntime.id: "codex"`           | Codex OAuth of Codex-account | `Runtime: OpenAI Codex`         |
| OpenAI API via normale OpenClaw-runner              | `openai/gpt-*`           | weggelaten of `runtime: "pi"`        | OpenAI API-sleutel          | `Runtime: OpenClaw Pi Default`  |
| ChatGPT/Codex-abonnement via PI                     | `openai-codex/gpt-*`     | weggelaten of `runtime: "pi"`        | OpenAI Codex OAuth-provider | `Runtime: OpenClaw Pi Default`  |
| Gemengde providers met conservatieve automatische modus | providerspecifieke refs  | `agentRuntime.id: "auto"`            | Per geselecteerde provider  | Hangt af van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie                  | ACP-prompt/model-afhankelijk | `sessions_spawn` met `runtime: "acp"` | ACP-backendauthenticatie    | ACP-taak-/sessiestatus          |

De belangrijke scheiding is provider versus runtime:

- `openai-codex/*` beantwoordt "welke provider-/authroute moet PI gebruiken?"
- `agentRuntime.id: "codex"` beantwoordt "welke loop moet deze
  ingebedde beurt uitvoeren?"
- `/codex ...` beantwoordt "welke native Codex-conversatie moet deze chat binden
  of besturen?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

OpenAI-familieroutes zijn prefixspecifiek. Gebruik voor de gebruikelijke setup
met abonnement plus native Codex-runtime `openai/*` met
`agentRuntime.id: "codex"`. Gebruik `openai-codex/*` alleen wanneer je bewust
Codex OAuth via PI wilt:

| Modelreferentie                              | Runtimepad                                  | Gebruik wanneer                                                           |
| -------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenAI-provider via OpenClaw/PI-plumbing    | Je huidige directe OpenAI Platform API-toegang met `OPENAI_API_KEY` wilt. |
| `openai-codex/gpt-5.5`                       | OpenAI Codex OAuth via OpenClaw/PI          | Je ChatGPT/Codex-abonnementsauthenticatie met de standaard PI-runner wilt. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server-harness                    | Je ChatGPT/Codex-abonnementsauthenticatie met native Codex-uitvoering wilt. |

GPT-5.5 kan op zowel directe OpenAI API-sleutelroutes als
Codex-abonnementsroutes verschijnen wanneer je account die beschikbaar stelt.
Gebruik `openai/gpt-5.5` met de Codex app-server-harness voor native
Codex-runtime, `openai-codex/gpt-5.5` voor PI OAuth, of `openai/gpt-5.5` zonder
Codex-runtime-override voor direct API-sleutelverkeer.

Verouderde `codex/gpt-*`-referenties blijven geaccepteerd als
compatibiliteitsaliassen. De compatibiliteitsmigratie van Doctor herschrijft
verouderde primaire runtimereferenties naar canonieke modelreferenties en legt
het runtimebeleid afzonderlijk vast, terwijl fallback-only verouderde
referenties ongewijzigd blijven omdat runtime voor de hele agentcontainer wordt
geconfigureerd. Nieuwe PI Codex OAuth-configuraties moeten `openai-codex/gpt-*`
gebruiken; nieuwe native app-server-harnessconfiguraties moeten `openai/gpt-*`
plus `agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai-codex/gpt-*` wanneer beeldbegrip via het OpenAI Codex OAuth-providerpad
moet lopen. Gebruik `codex/gpt-*` wanneer beeldbegrip via een begrensde Codex
app-serverbeurt moet lopen. Het Codex app-servermodel moet ondersteuning voor
beeldinvoer adverteren; text-only Codex-modellen falen voordat de mediabeurt
start.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen.
Als de selectie verrassend is, schakel dan debuglogging in voor het
`agents/harness`-subsysteem en inspecteer het gestructureerde gatewayrecord
`agent harness selected`. Het bevat de geselecteerde harness-id, selectiereden,
runtime-/fallbackbeleid en, in `auto`-modus, het ondersteuningsresultaat van
elke pluginkandidaat.

### Wat doctorwaarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer al het volgende waar is:

- de meegeleverde `codex`-plugin is ingeschakeld of toegestaan
- het primaire model van een agent is `openai-codex/*`
- de effectieve runtime van die agent is niet `codex`

Die waarschuwing bestaat omdat gebruikers vaak verwachten dat "Codex-plugin
ingeschakeld" "native Codex app-server-runtime" impliceert. OpenClaw maakt die
sprong niet. De waarschuwing betekent:

- **Er is geen wijziging vereist** als je ChatGPT/Codex OAuth via PI bedoelde.
- Wijzig het model naar `openai/<model>` en stel
  `agentRuntime.id: "codex"` in als je native app-serveruitvoering bedoelde.
- Bestaande sessies hebben na een runtimewijziging nog steeds `/new` of `/reset`
  nodig, omdat sessieruntimepinnen sticky zijn.

Harnessselectie is geen live sessiebesturing. Wanneer een ingebedde beurt loopt,
legt OpenClaw de geselecteerde harness-id op die sessie vast en blijft die
gebruiken voor latere beurten in dezelfde sessie-id. Wijzig de `agentRuntime`-
configuratie of `OPENCLAW_AGENT_RUNTIME` wanneer je toekomstige sessies een
andere harness wilt laten gebruiken; gebruik `/new` of `/reset` om een verse
sessie te starten voordat je een bestaande conversatie tussen PI en Codex
wisselt. Dit voorkomt dat één transcript opnieuw wordt afgespeeld via twee
incompatibele native sessiesystemen.

Legacy-sessies die zijn gemaakt voordat harness-pins bestonden, worden als Pi-vastgezet behandeld zodra ze transcriptgeschiedenis hebben. Gebruik `/new` of `/reset` om dat gesprek na het wijzigen van de configuratie voor Codex te laten kiezen.

`/status` toont de effectieve modelruntime. De standaard Pi-harness verschijnt als `Runtime: OpenClaw Pi Default`, en de Codex app-server-harness verschijnt als `Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de gebundelde `codex` Plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard een compatibele Codex app-server-binary, dus lokale `codex`-commando's op `PATH` hebben geen invloed op normaal opstarten van de harness.
- Codex-authenticatie beschikbaar voor het app-server-proces of voor OpenClaw's Codex-authenticatiebridge. Lokale app-server-starts gebruiken een door OpenClaw beheerde Codex-home voor elke agent en een geïsoleerde child-`HOME`, zodat ze standaard je persoonlijke `~/.codex`-account, Skills, plugins, configuratie, threadstatus of native `$HOME/.agents/skills` niet lezen.

De Plugin blokkeert oudere of niet-geversioneerde app-server-handshakes. Daardoor blijft OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt authenticatie meestal van het Codex CLI-account of een OpenClaw `openai-codex`-authenticatieprofiel. Lokale stdio app-server-starts kunnen ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Bootstrapbestanden voor werkruimten

Codex verwerkt `AGENTS.md` zelf via native projectdoc-detectie. OpenClaw schrijft geen synthetische Codex-projectdocbestanden en is niet afhankelijk van Codex-fallbackbestandsnamen voor persona-bestanden, omdat Codex-fallbacks alleen gelden wanneer `AGENTS.md` ontbreekt.

Voor OpenClaw-werkruimtepariteit lost de Codex-harness de andere bootstrapbestanden op (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` en `MEMORY.md` wanneer aanwezig) en stuurt ze door via Codex-configuratie-instructies bij `thread/start` en `thread/resume`. Hierdoor blijven `SOUL.md` en gerelateerde werkruimtepersona-/profielcontext zichtbaar zonder `AGENTS.md` te dupliceren.

## Codex naast andere modellen toevoegen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen wisselen tussen Codex en niet-Codex providermodellen. Een afgedwongen runtime geldt voor elke ingebedde beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl die runtime is afgedwongen, probeert OpenClaw nog steeds de Codex-harness en faalt gesloten in plaats van die beurt stilzwijgend via Pi te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Zet Codex op een toegewijde agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en Pi-fallback voor normaal gemengd providergebruik.
- Gebruik legacy `codex/*`-refs alleen voor compatibiliteit. Nieuwe configuraties moeten de voorkeur geven aan `openai/*` plus een expliciet Codex-runtimebeleid.

Dit voorbeeld houdt de standaardagent op normale automatische selectie en voegt een aparte Codex-agent toe:

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

- De standaardagent `main` gebruikt het normale providerpad en Pi-compatibiliteitsfallback.
- De agent `codex` gebruikt de Codex app-server-harness.
- Als Codex ontbreekt of niet wordt ondersteund voor de agent `codex`, faalt de beurt in plaats van stilletjes Pi te gebruiken.

## Routering van agentcommando's

Agents moeten gebruikersverzoeken routeren op intentie, niet alleen op het woord "Codex":

| Gebruiker vraagt om...                                 | Agent moet gebruiken...                          |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bind deze chat aan Codex"                             | `/codex bind`                                    |
| "Hervat Codex-thread `<id>` hier"                      | `/codex resume <id>`                             |
| "Toon Codex-threads"                                   | `/codex threads`                                 |
| "Dien een supportrapport in voor een mislukte Codex-run" | `/diagnostics [note]`                          |
| "Stuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                  |
| "Gebruik mijn ChatGPT/Codex-abonnement met Codex-runtime" | `openai/*` plus `agentRuntime.id: "codex"`   |
| "Gebruik mijn ChatGPT/Codex-abonnement via Pi"         | `openai-codex/*`-modelrefs                      |
| "Voer Codex uit via ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en niet native sub-agents |

OpenClaw adverteert ACP-spawnbegeleiding alleen aan agents wanneer ACP is ingeschakeld, dispatchbaar is en wordt ondersteund door een geladen runtimebackend. Als ACP niet beschikbaar is, mogen de systeemprompt en Plugin-Skills de agent geen ACP-routering aanleren.

## Alleen-Codex-implementaties

Dwing de Codex-harness af wanneer je moet aantonen dat elke ingebedde agentbeurt Codex gebruikt. Expliciete Plugin-runtimes falen gesloten en worden nooit stilzwijgend opnieuw geprobeerd via Pi:

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

Met Codex afgedwongen faalt OpenClaw vroeg als de Codex-Plugin is uitgeschakeld, de app-server te oud is of de app-server niet kan starten.

## Codex per agent

Je kunt één agent alleen-Codex maken terwijl de standaardagent normale automatische selectie behoudt:

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

Gebruik normale sessiecommando's om tussen agents en modellen te wisselen. `/new` maakt een nieuwe OpenClaw-sessie en de Codex-harness maakt of hervat waar nodig zijn sidecar app-server-thread. `/reset` wist de OpenClaw-sessiebinding voor die thread en laat de volgende beurt de harness opnieuw uit de huidige configuratie oplossen.

## Modeldetectie

Standaard vraagt de Codex-Plugin de app-server om beschikbare modellen. Als detectie mislukt of een time-out krijgt, gebruikt de Plugin een gebundelde fallbackcatalogus voor:

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

Schakel detectie uit wanneer je wilt dat opstarten Codex niet probeert te peilen en bij de fallbackcatalogus blijft:

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

De beheerde binary wordt geleverd met het `codex`-Pluginpakket. Hierdoor blijft de app-serverversie gekoppeld aan de gebundelde Plugin in plaats van aan welke afzonderlijke Codex CLI toevallig lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer je bewust een ander uitvoerbaar bestand wilt gebruiken.

Standaard start OpenClaw lokale Codex-harnesssessies in YOLO-modus: `approvalPolicy: "never"`, `approvalsReviewer: "user"` en `sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt voor autonome Heartbeats: Codex kan shell- en netwerktools gebruiken zonder te stoppen bij native goedkeuringsprompts die niemand kan beantwoorden.

Om Codex-goedkeuringen met guardian-review in te schakelen, stel je `appServer.mode: "guardian"` in:

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

Guardian-modus gebruikt Codex' native goedkeuringspad met automatische review. Wanneer Codex vraagt om de sandbox te verlaten, buiten de werkruimte te schrijven of machtigingen zoals netwerktoegang toe te voegen, routeert Codex dat goedkeuringsverzoek naar de native reviewer in plaats van naar een menselijke prompt. De reviewer past Codex' risicokader toe en keurt het specifieke verzoek goed of af. Gebruik Guardian wanneer je meer vangrails wilt dan in YOLO-modus, maar onbeheerde agents toch voortgang moeten kunnen boeken.

De preset `guardian` wordt uitgebreid naar `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"`. Afzonderlijke beleidsvelden overschrijven `mode` nog steeds, zodat geavanceerde implementaties de preset kunnen mengen met expliciete keuzes. De oudere reviewerwaarde `guardian_subagent` wordt nog steeds geaccepteerd als compatibiliteitsalias, maar nieuwe configuraties moeten `auto_review` gebruiken.

Gebruik WebSocket-transport voor een app-server die al draait:

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

Stdio app-server-starts erven standaard de procesomgeving van OpenClaw, maar OpenClaw beheert de Codex app-server-accountbridge en zet zowel `CODEX_HOME` als `HOME` op per-agentmappen onder de OpenClaw-status van die agent. Codex' eigen skillloader leest `$CODEX_HOME/skills` en `$HOME/.agents/skills`, dus beide waarden zijn geïsoleerd voor lokale app-server-starts. Daardoor blijven Codex-native Skills, plugins, configuratie, accounts en threadstatus beperkt tot de OpenClaw-agent in plaats van binnen te lekken vanuit de persoonlijke Codex CLI-home van de operator.

OpenClaw-plugins en OpenClaw-Skill-snapshots blijven via OpenClaw's eigen Plugin-register en skillloader lopen. Persoonlijke Codex CLI-assets doen dat niet. Als je nuttige Codex CLI-Skills of plugins hebt die onderdeel moeten worden van een OpenClaw-agent, inventariseer ze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

De Codex-migratieprovider kopieert Skills naar de huidige OpenClaw-agentwerkruimte. Codex-native plugins, hooks en configuratiebestanden worden gerapporteerd of gearchiveerd voor handmatige review in plaats van automatisch geactiveerd, omdat ze commando's kunnen uitvoeren, MCP-servers kunnen blootstellen of referenties kunnen bevatten.

Authenticatie wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts, `CODEX_API_KEY`, daarna `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-authenticatie nog steeds vereist is.

Wanneer OpenClaw een Codex-authenticatieprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het `CODEX_API_KEY` en `OPENAI_API_KEY` uit het gestarte Codex-childproces. Daardoor blijven API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen zonder dat native Codex app-server-beurten per ongeluk via de API worden gefactureerd. Expliciete Codex API-sleutelprofielen en lokale stdio env-key-fallback gebruiken app-server-login in plaats van geërfde childproces-env. WebSocket app-serververbindingen ontvangen geen Gateway env API-sleutelfallback; gebruik een expliciet authenticatieprofiel of het eigen account van de externe app-server.

Als een implementatie aanvullende omgevingsisolatie nodig heeft, voeg die variabelen toe aan `appServer.clearEnv`:

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

`appServer.clearEnv` heeft alleen invloed op het voortgebrachte Codex app-server-childproces.

Dynamische Codex-tools gebruiken standaard het profiel `native-first`. In die modus
stelt OpenClaw geen dynamische tools beschikbaar die Codex-native workspace-
bewerkingen dupliceren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` en
`update_plan`. OpenClaw-integratietools zoals berichten, sessies, media,
cron, browser, nodes, gateway, `heartbeat_respond` en `web_search` blijven
beschikbaar.

Ondersteunde Codex Plugin-velden op topniveau:

| Veld                       | Standaard        | Betekenis                                                                                |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gebruik `"openclaw-compat"` om de volledige dynamische OpenClaw-toolset beschikbaar te maken voor Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Extra namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-server-beurten. |

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                     |
| `command`           | beheerd Codex-binair bestand             | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om het beheerde binaire bestand te gebruiken; stel het alleen in voor een expliciete override.                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                                                                                                                    |
| `url`               | niet ingesteld                           | WebSocket-URL van de app-server.                                                                                                                                                                                                    |
| `authToken`         | niet ingesteld                           | Bearer-token voor WebSocket-transport.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die worden verwijderd uit het voortgebrachte stdio-app-serverproces nadat OpenClaw de overgenomen omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's per-agent Codex-isolatie bij lokale starts. |
| `requestTimeoutMs`  | `60000`                                  | Time-out voor control-plane-aanroepen naar app-server.                                                                                                                                                                              |
| `mode`              | `"yolo"`                                 | Preset voor YOLO- of guardian-beoordeelde uitvoering.                                                                                                                                                                               |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread start/resume/turn wordt gestuurd.                                                                                                                                                   |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread start/resume wordt gestuurd.                                                                                                                                                              |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een legacy-alias.                                                                                                       |
| `serviceTier`       | niet ingesteld                           | Optionele Codex app-server-servicelaag: `"fast"`, `"flex"` of `null`. Ongeldige legacy-waarden worden genegeerd.                                                                                                                    |

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: elk Codex `item/tool/call`-verzoek moet binnen
30 seconden een OpenClaw-respons ontvangen. Bij een time-out breekt OpenClaw het tool-
signaal af waar dat wordt ondersteund en retourneert het een mislukte dynamische-toolrespons aan Codex zodat
de beurt kan doorgaan in plaats van de sessie in `processing` te laten staan.

Nadat OpenClaw heeft gereageerd op een Codex turn-scoped app-server-verzoek, verwacht de harness
ook dat Codex de native beurt voltooit met `turn/completed`. Als de
app-server daarna 60 seconden stil blijft na die respons, onderbreekt OpenClaw naar beste vermogen
de Codex-beurt, legt het een diagnostische time-out vast en geeft het de
OpenClaw-sessielane vrij zodat vervolgchatberichten niet achter een verouderde
native beurt in de wachtrij komen.

Omgevings-overrides blijven beschikbaar voor lokaal testen:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt het beheerde binaire bestand wanneer
`appServer.command` niet is ingesteld.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Configuratie heeft
de voorkeur voor herhaalbare deployments, omdat dit het Plugin-gedrag in hetzelfde
beoordeelde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiegids:
[Codex-computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktop-control-app niet en voert zelf geen
desktopacties uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is, en laat Codex daarna de native
MCP-toolaanroepen afhandelen tijdens beurten in Codex-modus.

Voor directe TryCua-driver-toegang buiten de Codex-marketplace-flow registreer je
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

De installatie kan worden gecontroleerd of geïnstalleerd vanaf het commandoppervlak:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computergebruik is macOS-specifiek en kan lokale OS-machtigingen vereisen voordat de
Codex MCP-server apps kan besturen. Als `computerUse.enabled` true is en de MCP-
server niet beschikbaar is, mislukken beurten in Codex-modus voordat de thread start, in plaats van
stilzwijgend zonder de native Computergebruik-tools te draaien. Zie
[Codex-computergebruik](/nl/plugins/codex-computer-use) voor marketplace-keuzes,
limieten van de externe catalogus, statusredenen en probleemoplossing.

Wanneer `computerUse.autoInstall` true is, kan OpenClaw de standaard
gebundelde Codex Desktop-marketplace registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marketplace heeft ontdekt. Gebruik `/new` of `/reset` na
het wijzigen van runtime- of Computergebruik-configuratie, zodat bestaande sessies geen oude
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

Guardian-beoordeelde Codex-goedkeuringen:

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

## Codex-opdracht

De gebundelde Plugin registreert `/codex` als een geautoriseerde slash-opdracht. Deze is
generiek en werkt op elk kanaal dat OpenClaw-tekstopdrachten ondersteunt.

Veelgebruikte vormen:

- `/codex status` toont live appserverconnectiviteit, modellen, account, snelheidslimieten, MCP-servers en skills.
- `/codex models` geeft live Codex-appservermodellen weer.
- `/codex threads [filter]` geeft recente Codex-threads weer.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt de Codex-appserver om de gekoppelde thread te compacten.
- `/codex review` start Codex native review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt bevestiging voordat Codex-diagnostiekfeedback voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computer Use-plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computer Use-plugin en herlaadt MCP-servers.
- `/codex account` toont account- en snelheidslimietstatus.
- `/codex mcp` geeft de MCP-serverstatus van de Codex-appserver weer.
- `/codex skills` geeft Codex-appserver-skills weer.

Wanneer Codex een fout door een gebruikslimiet meldt, neemt OpenClaw de volgende
resettijd van de appserver op wanneer Codex die heeft verstrekt. Gebruik `/codex account` in hetzelfde
gesprek om de huidige account- en snelheidslimietvensters te inspecteren.

### Veelgebruikte debugworkflow

Wanneer een door Codex ondersteunde agent iets verrassends doet in Telegram, Discord, Slack,
of een ander kanaal, begin dan met het gesprek waarin het probleem optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit, of een andere korte notitie
   die beschrijft wat je hebt gezien.
2. Keur het diagnostiekverzoek eenmaal goed. De goedkeuring maakt de lokale Gateway-
   diagnostiekzip en verstuurt, omdat de sessie de Codex-harness gebruikt, ook
   de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostiekantwoord naar het bugrapport of de supportthread.
   Het bevat het lokale bundelpad, privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een `Inspect locally`-regel voor elke Codex-thread.
4. Als je de uitvoering zelf wilt debuggen, voer dan de afgedrukte `Inspect locally`-
   opdracht uit in een terminal. Die lijkt op `codex resume <thread-id>` en opent de
   native Codex-thread zodat je het gesprek kunt inspecteren, lokaal kunt voortzetten,
   of Codex kunt vragen waarom het een bepaalde tool of bepaald plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige OpenClaw
Gateway-diagnostiekbundel. Voor de meeste supportrapporten is `/diagnostics [note]`
het betere startpunt omdat het de lokale Gateway-status en Codex-
thread-id's in één antwoord samenbrengt. Zie [Diagnostiekexport](/nl/gateway/diagnostics)
voor het volledige privacymodel en gedrag in groepschats.

Core OpenClaw stelt ook alleen voor eigenaren `/diagnostics [note]` beschikbaar als algemene
Gateway-diagnostiekopdracht. De goedkeuringsprompt toont de inleiding over gevoelige gegevens,
linkt naar [Diagnostiekexport](/nl/gateway/diagnostics), en vraagt
`openclaw gateway diagnostics export --json` via expliciete exec-goedkeuring
elke keer aan. Keur diagnostiek niet goed met een regel die alles toestaat. Na goedkeuring
verstuurt OpenClaw een plakbaar rapport met het lokale bundelpad en de manifest-
samenvatting. Wanneer de actieve OpenClaw-sessie de Codex-harness gebruikt, geeft
diezelfde goedkeuring ook toestemming om de relevante Codex-feedbackbundels naar
OpenAI-servers te verzenden. De goedkeuringsprompt zegt dat Codex-feedback zal worden verzonden, maar
vermeldt vóór goedkeuring geen Codex-sessie- of thread-id's.

Als `/diagnostics` door een eigenaar wordt aangeroepen in een groepschat, houdt OpenClaw het
gedeelde kanaal schoon: de groep ontvangt alleen een korte melding, terwijl de
diagnostiekinleiding, goedkeuringsprompts en Codex-sessie-/thread-id's naar
de eigenaar worden verzonden via de privégoedkeuringsroute. Als er geen privéroute voor de eigenaar is,
weigert OpenClaw het groepsverzoek en vraagt de eigenaar om het vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept Codex-appserver `feedback/upload` aan en vraagt
de appserver om logs op te nemen voor elke vermelde thread en voortgebrachte Codex-subthreads
wanneer beschikbaar. De upload loopt via het normale feedbackpad van Codex naar OpenAI-
servers; als Codex-feedback in die appserver is uitgeschakeld, retourneert de opdracht
de appserverfout. Het voltooide diagnostiekantwoord vermeldt de kanalen,
OpenClaw-sessie-id's, Codex-thread-id's en lokale `codex resume <thread-id>`-
opdrachten voor de verzonden threads. Als je de goedkeuring weigert of negeert,
print OpenClaw die Codex-id's niet. Deze upload vervangt de lokale
Gateway-diagnostiekexport niet.

`/codex resume` schrijft hetzelfde sidecarbindingsbestand dat de harness gebruikt voor
normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread, geeft het
momenteel geselecteerde OpenClaw-model door aan de appserver, en houdt het uitgebreide geschiedenis
ingeschakeld.

### Een Codex-thread inspecteren vanuit de CLI

De snelste manier om een slechte Codex-uitvoering te begrijpen is vaak om de native Codex-
thread direct te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug opmerkt in een kanaalgesprek en de
problematische Codex-sessie wilt inspecteren, lokaal wilt voortzetten, of Codex wilt vragen waarom het een
bepaalde tool- of redeneerkeuze maakte. Het makkelijkste pad is meestal om eerst
`/diagnostics [note]` uit te voeren: nadat je het hebt goedgekeurd, vermeldt het voltooide rapport
elke Codex-thread en print het een `Inspect locally`-opdracht, bijvoorbeeld
`codex resume <thread-id>`. Je kunt die opdracht direct naar een terminal kopiëren.

Je kunt ook een thread-id krijgen via `/codex binding` voor de huidige chat of
`/codex threads [filter]` voor recente Codex-appserverthreads, en vervolgens dezelfde
`codex resume`-opdracht in je shell uitvoeren.

Het opdrachtoppervlak vereist Codex-appserver `0.125.0` of nieuwer. Afzonderlijke
controlemethoden worden gerapporteerd als `unsupported by this Codex app-server` als een
toekomstige of aangepaste appserver die JSON-RPC-methode niet beschikbaar stelt.

## Hookgrenzen

De Codex-harness heeft drie hooklagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-pluginhooks                  | OpenClaw                 | Product-/plugincompatibiliteit tussen PI- en Codex-harnassen.       |
| Codex-appserverextensiemiddleware     | OpenClaw gebundelde plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.             |
| Codex native hooks                    | Codex                    | Laag-niveau Codex-lifecycle en native toolbeleid uit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex-`hooks.json`-bestanden om
OpenClaw-plugingedrag te routeren. Voor de ondersteunde native tool- en machtigingsbrug
injecteert OpenClaw per-thread Codex-configuratie voor `PreToolUse`, `PostToolUse`,
`PermissionRequest` en `Stop`. Andere Codex-hooks zoals `SessionStart` en
`UserPromptSubmit` blijven controles op Codex-niveau; ze worden in het v1-contract
niet blootgesteld als OpenClaw-pluginhooks.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de
aanroep vraagt, dus vuurt OpenClaw het plugin- en middlewaregedrag af dat het bezit in de
harnessadapter. Voor Codex-native tools bezit Codex het canonieke toolrecord.
OpenClaw kan geselecteerde gebeurtenissen spiegelen, maar kan de native Codex-
thread niet herschrijven tenzij Codex die bewerking beschikbaar stelt via appserver of native hook-
callbacks.

Compaction- en LLM-lifecycleprojecties komen van Codex-appserver-
meldingen en OpenClaw-adapterstatus, niet van native Codex-hookopdrachten.
OpenClaw's `before_compaction`, `after_compaction`, `llm_input` en
`llm_output`-gebeurtenissen zijn observaties op adapterniveau, geen byte-voor-byte captures
van de interne aanvraag- of Compaction-payloads van Codex.

Codex native `hook/started`- en `hook/completed`-appservermeldingen worden
geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor traject en debugging.
Ze roepen geen OpenClaw-pluginhooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex bezit meer van
de native modelloop, en OpenClaw past zijn plugin- en sessieoppervlakken
rond die grens aan.

Ondersteund in Codex-runtime v1:

| Oppervlak                                     | Ondersteuning                          | Waarom                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modelloop via Codex                    | Ondersteund                             | Codex-appserver bezit de OpenAI-beurt, native threadhervatting en native toolvoortzetting.                                                                                                            |
| OpenClaw-kanaalroutering en -levering         | Ondersteund                             | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                       |
| Dynamische OpenClaw-tools                     | Ondersteund                             | Codex vraagt OpenClaw om deze tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.                                                                                                        |
| Prompt- en contextplugins                     | Ondersteund                             | OpenClaw bouwt promptoverlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                    |
| Context-engine-lifecycle                      | Ondersteund                             | Assemble, ingest- of onderhoud na de beurt, en coördinatie van context-engine-Compaction draaien voor Codex-beurten.                                                                                 |
| Dynamische toolhooks                          | Ondersteund                             | `before_tool_call`, `after_tool_call` en toolresultaatmiddleware draaien rond door OpenClaw beheerde dynamische tools.                                                                               |
| Lifecycle-hooks                               | Ondersteund als adapterobservaties      | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` vuren af met eerlijke Codex-moduspayloads.                                                                         |
| Revisiepoort voor definitief antwoord         | Ondersteund via de native hookrelay     | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog één modelpassage vóór finalisatie.                                                                        |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via de native hookrelay | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor gecommitte native tooloppervlakken, inclusief MCP-payloads op Codex-appserver `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native machtigingsbeleid                      | Ondersteund via de native hookrelay     | Codex `PermissionRequest` kan via OpenClaw-beleid worden gerouteerd waar de runtime dit beschikbaar stelt. Als OpenClaw geen beslissing retourneert, gaat Codex verder via zijn normale bewaker- of gebruikersgoedkeuringspad. |
| Appservertrajectvastlegging                   | Ondersteund                             | OpenClaw registreert de aanvraag die het naar de appserver stuurde en de appservermeldingen die het ontvangt.                                                                                        |

Niet ondersteund in Codex-runtime v1:

| Surface                                             | V1-grens                                                                                                                                     | Toekomstig pad                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutatie van argumenten van native tools                       | Native Codex-pre-toolhooks kunnen blokkeren, maar OpenClaw herschrijft geen argumenten van Codex-native tools.                                               | Vereist Codex-hook-/schemaondersteuning voor vervangende toolinvoer.                            |
| Bewerkbare Codex-native transcriptgeschiedenis            | Codex bezit de canonieke native threadgeschiedenis. OpenClaw bezit een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadchirurgie nodig is.                    |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, geen Codex-native toolrecords.                                                           | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning.              |
| Rijke native Compaction-metadata                     | OpenClaw observeert het begin en de voltooiing van Compaction, maar ontvangt geen stabiele lijst met behouden/verwijderde items, tokendelta of samenvattingspayload.            | Vereist rijkere Codex-Compaction-events.                                                     |
| Compaction-interventie                             | Huidige OpenClaw-Compaction-hooks zijn in Codex-modus op meldingsniveau.                                                                         | Voeg Codex pre-/post-Compaction-hooks toe als plugins native Compaction moeten kunnen vetoën of herschrijven. |
| Byte-voor-byte-vastlegging van model-API-verzoeken             | OpenClaw kan app-serververzoeken en meldingen vastleggen, maar Codex core bouwt intern het uiteindelijke OpenAI API-verzoek.                      | Vereist een Codex-modelverzoek-tracingevent of debug-API.                                   |

## Tools, media en Compaction

De Codex-harness wijzigt alleen de embedded agent-executor op laag niveau.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van de
harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en uitvoer van messaging-tools
blijven via het normale OpenClaw-afleverpad lopen.

De native hookrelay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de Codex-native tool- en machtigingspaden die OpenClaw test. In
de Codex-runtime omvat dat shell-, patch- en MCP-`PreToolUse`-,
`PostToolUse`- en `PermissionRequest`-payloads. Ga er niet van uit dat elk toekomstig
Codex-hookevent een OpenClaw-Plugin-oppervlak is totdat het runtimecontract
dit benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of weigeren-beslissingen
wanneer beleid beslist. Een resultaat zonder beslissing is geen toestemming. Codex behandelt het als geen
hookbeslissing en valt door naar zijn eigen guardian- of gebruikersgoedkeuringspad.

Codex MCP-toongoedkeuringsverzoeken worden via OpenClaw's Plugin-
goedkeuringsflow gerouteerd wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex-`request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende in de wachtrij geplaatste follow-upbericht beantwoordt dat native
serververzoek in plaats van als extra context te worden gestuurd. Andere MCP-toonverzoeken
falen nog steeds gesloten.

Sturing van de actieve runwachtrij wordt gemapt op Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` bundelt OpenClaw chatberichten in de wachtrij
voor het geconfigureerde stiltevenster en verzendt ze als één `turn/steer`-verzoek in
volgorde van aankomst. Legacy `queue`-modus verzendt afzonderlijke `turn/steer`-verzoeken. Codex
review- en handmatige Compaction-turns kunnen sturing binnen dezelfde turn weigeren; in dat geval
gebruikt OpenClaw de follow-upwachtrij wanneer de geselecteerde modus fallback toestaat. Zie
[Sturingswachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt native thread-Compaction
gedelegeerd aan Codex app-server. OpenClaw houdt een transcriptspiegel bij voor kanaalgeschiedenis,
zoekopdrachten, `/new`, `/reset` en toekomstige model- of harnesswissels. De
spiegel bevat de gebruikersprompt, definitieve assistenttekst en lichte Codex-
redeneer- of planrecords wanneer de app-server die uitzendt. Momenteel registreert OpenClaw alleen
start- en voltooiingssignalen van native Compaction. Het stelt nog geen
menselijk leesbare Compaction-samenvatting of controleerbare lijst beschikbaar van welke entries Codex
na Compaction heeft behouden.

Omdat Codex de canonieke native thread bezit, herschrijft `tool_result_persist`
momenteel geen Codex-native toolresultaatrecords. Het is alleen van toepassing wanneer
OpenClaw een toolresultaat schrijft naar een sessietranscript dat eigendom is van OpenClaw.

Mediageneratie vereist geen PI. Afbeeldingen, video, muziek, PDF, TTS en media-
begrip blijven de bijpassende provider-/modelinstellingen gebruiken, zoals
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
afgedwongen Codex-runtime faalt in plaats van terug te vallen op PI. Zodra Codex app-server
is geselecteerd, komen de fouten daarvan direct naar voren.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-serverhandshake
versie `0.125.0` of nieuwer rapporteert. Prereleases met dezelfde versie of versies met buildsuffix
zoals `0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat de
stabiele protocolvloer `0.125.0` is wat OpenClaw test.

**Modelontdekking is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel discovery uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`
en of de externe app-server dezelfde Codex app-serverprotocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een legacy
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven in
`auto`-modus op hun normale providerpad. Als je `agentRuntime.id: "codex"` afdwingt, moet elke embedded
turn voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan `/new` of `/reset`; als het aanhoudt, herstart
de Gateway om verouderde native hookregistraties te wissen. Als `computer-use.list_apps`
een time-out krijgt, herstart Codex Computer Use of Codex Desktop en probeer het opnieuw.

## Gerelateerd

- [Agent-harness-Plugins](/nl/plugins/sdk-agent-harness)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin-hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
