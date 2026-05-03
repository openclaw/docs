---
read_when:
    - Je wilt het meegeleverde Codex-app-serverharnas gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat deployments met alleen Codex mislukken in plaats van terug te vallen op PI
summary: Voer ingebedde OpenClaw-agentbeurten uit via het gebundelde Codex-app-serverharnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-03T21:35:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex`-plugin laat OpenClaw ingesloten agentbeurten uitvoeren via de
Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex eigenaar is van de low-level agentsessie:
modeldetectie, native thread hervatten, native compaction en uitvoering via de app-server.
OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie, tools,
goedkeuringen, medialevering en de zichtbare transcriptspiegel.

Wanneer een bron-chatbeurt via de Codex-harness wordt uitgevoerd, gebruiken zichtbare
antwoorden standaard de OpenClaw `message`-tool als de deployment
`messages.visibleReplies` niet expliciet heeft geconfigureerd. De agent kan zijn
Codex-beurt nog steeds privé afronden; hij plaatst alleen iets in het kanaal wanneer
hij `message(action="send")` aanroept. Stel
`messages.visibleReplies: "automatic"` in om eindantwoorden in directe chats op het
legacy pad voor automatische levering te houden.

Codex heartbeat-beurten krijgen standaard ook de `heartbeat_respond`-tool, zodat de
agent kan vastleggen of de wake stil moet blijven of moet melden zonder die
controlestroom in de eindtekst te coderen.

Heartbeat-specifieke initiatiefbegeleiding wordt als een developer-instructie voor
Codex collaboration-mode verzonden op de heartbeat-beurt zelf. Gewone chatbeurten
herstellen Codex Default-modus in plaats van heartbeat-filosofie mee te dragen in hun
normale runtimeprompt.

Als je je probeert te oriënteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Snelle configuratie

De meeste gebruikers die "Codex in OpenClaw" willen, willen deze route: meld je aan met
een ChatGPT/Codex-abonnement en voer daarna ingesloten agentbeurten uit via de native
Codex app-server-runtime. De modelreferentie blijft canoniek als
`openai/gpt-*`; abonnementsauthenticatie komt van het Codex-account/profiel, niet
van een `openai-codex/*`-modelprefix.

Meld je eerst aan met Codex OAuth als je dat nog niet hebt gedaan:

```bash
openclaw models auth login --provider openai-codex
```

Schakel daarna de gebundelde `codex`-plugin in en forceer de Codex-runtime:

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

Gebruik `openai-codex/gpt-*` niet wanneer je native Codex-runtime bedoelt. Die prefix
is de expliciete route "Codex OAuth via PI". Configuratiewijzigingen gelden voor nieuwe
of geresette sessies; bestaande sessies behouden hun vastgelegde runtime.

## Wat deze plugin verandert

De gebundelde `codex`-plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                     | Hoe je het gebruikt                                | Wat het doet                                                                 |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingesloten runtime        | `agentRuntime.id: "codex"`                          | Voert ingesloten OpenClaw-agentbeurten uit via Codex app-server.             |
| Native chatbesturingsopdrachten  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindt en bestuurt Codex app-server-threads vanuit een berichtenconversatie.  |
| Codex app-server-provider/catalog | `codex` internals, zichtbaar via de harness        | Laat de runtime app-servermodellen ontdekken en valideren.                   |
| Pad voor Codex-mediabegrip       | `codex/*` compatibiliteitspaden voor beeldmodellen  | Voert begrensde Codex app-server-beurten uit voor ondersteunde beeldbegripmodellen. |
| Native hookrelay                 | Pluginhooks rond Codex-native events                | Laat OpenClaw ondersteunde Codex-native tool-/finalisatie-events observeren/blokkeren. |

Het inschakelen van de plugin maakt die mogelijkheden beschikbaar. Het doet **niet**:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelreferenties omzetten naar de native runtime
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies die al een PI-runtime hebben vastgelegd hot-switchen
- OpenClaw-kanaallevering, sessiebestanden, opslag van auth-profielen of
  berichtroutering vervangen

Dezelfde plugin is ook eigenaar van het native `/codex`-oppervlak voor
chatbesturingsopdrachten. Als de plugin is ingeschakeld en de gebruiker vraagt om
Codex-threads vanuit chat te binden, hervatten, sturen, stoppen of inspecteren,
moeten agents `/codex ...` verkiezen boven ACP. ACP blijft de expliciete fallback
wanneer de gebruiker om ACP/acpx vraagt of de ACP Codex-adapter test.

Native Codex-beurten behouden OpenClaw-pluginhooks als de publieke compatibiliteitslaag.
Dit zijn in-process OpenClaw-hooks, geen Codex `hooks.json`-command hooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` voor gespiegelde transcriptrecords
- `before_agent_finalize` via Codex `Stop`-relay
- `agent_end`

Plugins kunnen ook runtime-neutrale middleware voor toolresultaten registreren om
dynamische OpenClaw-toolresultaten te herschrijven nadat OpenClaw de tool uitvoert en
voordat het resultaat aan Codex wordt teruggegeven. Dit staat los van de publieke
`tool_result_persist`-pluginhook, die OpenClaw-eigen transcriptwrites voor
toolresultaten transformeert.

Zie [Pluginhooks](/nl/plugins/hooks) en [Plugin-guardgedrag](/nl/tools/plugin) voor de
semantiek van de pluginhooks zelf.

De harness staat standaard uit. Nieuwe configuraties moeten OpenAI-modelreferenties
canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` forceren wanneer ze
native app-serveruitvoering willen. Legacy `codex/*`-modelreferenties selecteren
de harness nog steeds automatisch voor compatibiliteit, maar runtime-backed legacy
providerprefixen worden niet weergegeven als normale model-/providerkeuzes.

Als de `codex`-plugin is ingeschakeld maar het primaire model nog steeds
`openai-codex/*` is, waarschuwt `openclaw doctor` in plaats van de route te wijzigen.
Dat is opzettelijk: `openai-codex/*` blijft het PI-pad voor Codex
OAuth/abonnement, en native app-serveruitvoering blijft een expliciete runtimekeuze.

## Routekaart

Gebruik deze tabel voordat je configuratie wijzigt:

| Gewenst gedrag                                      | Modelreferentie          | Runtimeconfiguratie                  | Auth-/profielroute           | Verwacht statuslabel           |
| --------------------------------------------------- | ------------------------ | ------------------------------------ | ---------------------------- | ------------------------------ |
| ChatGPT/Codex-abonnement met native Codex-runtime   | `openai/gpt-*`           | `agentRuntime.id: "codex"`           | Codex OAuth of Codex-account | `Runtime: OpenAI Codex`        |
| OpenAI API via normale OpenClaw-runner              | `openai/gpt-*`           | weggelaten of `runtime: "pi"`        | OpenAI API-sleutel           | `Runtime: OpenClaw Pi Default` |
| ChatGPT/Codex-abonnement via PI                     | `openai-codex/gpt-*`     | weggelaten of `runtime: "pi"`        | OpenAI Codex OAuth-provider  | `Runtime: OpenClaw Pi Default` |
| Gemengde providers met conservatieve automatische modus | providerspecifieke referenties | `agentRuntime.id: "auto"`       | Per geselecteerde provider   | Afhankelijk van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie                  | afhankelijk van ACP-prompt/model | `sessions_spawn` met `runtime: "acp"` | ACP-backendauthenticatie | ACP-taak-/sessiestatus         |

De belangrijke scheiding is provider versus runtime:

- `openai-codex/*` beantwoordt "welke provider-/authroute moet PI gebruiken?"
- `agentRuntime.id: "codex"` beantwoordt "welke loop moet deze
  ingesloten beurt uitvoeren?"
- `/codex ...` beantwoordt "welke native Codex-conversatie moet deze chat binden
  of besturen?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

Routes binnen de OpenAI-familie zijn prefixspecifiek. Gebruik voor de gebruikelijke
opzet met abonnement plus native Codex-runtime `openai/*` met
`agentRuntime.id: "codex"`. Gebruik `openai-codex/*` alleen wanneer je bewust
Codex OAuth via PI wilt:

| Modelreferentie                              | Runtimepad                                  | Gebruik wanneer                                                            |
| -------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenAI-provider via OpenClaw/PI-plumbing     | Je huidige directe OpenAI Platform API-toegang met `OPENAI_API_KEY` wilt.  |
| `openai-codex/gpt-5.5`                       | OpenAI Codex OAuth via OpenClaw/PI           | Je ChatGPT/Codex-abonnementsauthenticatie met de standaard PI-runner wilt. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server-harness                    | Je ChatGPT/Codex-abonnementsauthenticatie met native Codex-uitvoering wilt. |

GPT-5.5 kan op zowel directe OpenAI API-key- als Codex-abonnementsroutes verschijnen
wanneer je account die beschikbaar maakt. Gebruik `openai/gpt-5.5` met de Codex
app-server-harness voor native Codex-runtime, `openai-codex/gpt-5.5` voor PI OAuth,
of `openai/gpt-5.5` zonder Codex-runtimeoverride voor direct API-key-verkeer.

Legacy `codex/gpt-*`-referenties blijven geaccepteerd als compatibiliteitsaliassen.
Doctor-compatibiliteitsmigratie herschrijft legacy primaire runtimereferenties naar
canonieke modelreferenties en legt het runtimebeleid afzonderlijk vast, terwijl
fallback-only legacy referenties ongewijzigd blijven omdat runtime voor de hele
agentcontainer wordt geconfigureerd. Nieuwe PI Codex OAuth-configuraties moeten
`openai-codex/gpt-*` gebruiken; nieuwe native app-server-harnessconfiguraties moeten
`openai/gpt-*` plus `agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai-codex/gpt-*` wanneer beeldbegrip via het providerpad voor OpenAI Codex OAuth
moet lopen. Gebruik `codex/gpt-*` wanneer beeldbegrip via een begrensde Codex
app-server-beurt moet lopen. Het Codex app-server-model moet ondersteuning voor
beeldinvoer adverteren; tekst-only Codex-modellen falen voordat de mediabeurt start.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen. Als
de selectie verrassend is, schakel dan debuglogging in voor het `agents/harness`-
subsysteem en inspecteer de gestructureerde `agent harness selected`-record van de
gateway. Die bevat de geselecteerde harness-id, selectiereden, runtime-/fallbackbeleid
en, in `auto`-modus, het ondersteuningsresultaat van elke pluginkandidaat.

### Wat doctor-waarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer al deze dingen waar zijn:

- de gebundelde `codex`-plugin is ingeschakeld of toegestaan
- het primaire model van een agent is `openai-codex/*`
- de effectieve runtime van die agent is niet `codex`

Die waarschuwing bestaat omdat gebruikers vaak verwachten dat "Codex-plugin
ingeschakeld" "native Codex app-server-runtime" impliceert. OpenClaw maakt die sprong
niet. De waarschuwing betekent:

- **Er is geen wijziging vereist** als je ChatGPT/Codex OAuth via PI bedoelde.
- Wijzig het model naar `openai/<model>` en stel
  `agentRuntime.id: "codex"` in als je native app-serveruitvoering bedoelde.
- Bestaande sessies hebben na een runtimewijziging nog steeds `/new` of `/reset`
  nodig, omdat sessie-runtimepins sticky zijn.

Harnessselectie is geen live sessiebesturing. Wanneer een ingesloten beurt wordt
uitgevoerd, legt OpenClaw de geselecteerde harness-id vast op die sessie en blijft die
gebruiken voor latere beurten in dezelfde sessie-id. Wijzig de `agentRuntime`-
configuratie of `OPENCLAW_AGENT_RUNTIME` wanneer je wilt dat toekomstige sessies een
andere harness gebruiken; gebruik `/new` of `/reset` om een nieuwe sessie te starten
voordat je een bestaande conversatie tussen PI en Codex wisselt. Dit voorkomt dat één
transcript door twee incompatibele native sessiesystemen wordt afgespeeld.

Oude sessies die vóór harness-pinnen zijn gemaakt, worden behandeld als PI-gepind zodra ze
transcriptgeschiedenis hebben. Gebruik `/new` of `/reset` om dat gesprek na een
configuratiewijziging voor Codex te laten kiezen.

`/status` toont de effectieve modelruntime. De standaard PI-harness verschijnt als
`Runtime: OpenClaw Pi Default`, en de Codex app-server-harness verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de meegeleverde `codex`-plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De meegeleverde plugin beheert standaard een compatibele
  Codex app-server-binary, dus lokale `codex`-opdrachten op `PATH` hebben
  geen invloed op normaal opstarten van de harness.
- Codex-auth beschikbaar voor het app-server-proces of voor OpenClaw's Codex-auth
  bridge. Lokale app-server-starts gebruiken een door OpenClaw beheerde Codex-home voor elke
  agent en een geïsoleerde child-`HOME`, zodat ze standaard je persoonlijke
  `~/.codex`-account, Skills, plugins, config, threadstatus of native
  `$HOME/.agents/skills` niet lezen.

De plugin blokkeert oudere of niet-geversioneerde app-server-handshakes. Zo blijft
OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt auth meestal van het Codex CLI-account
of een OpenClaw `openai-codex`-authprofiel. Lokale stdio app-server-starts kunnen
ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Werkruimte-bootstrapbestanden

Codex verwerkt `AGENTS.md` zelf via native projectdoc-detectie. OpenClaw
schrijft geen synthetische Codex-projectdocbestanden en is niet afhankelijk van Codex-fallback-
bestandsnamen voor personabestanden, omdat Codex-fallbacks alleen gelden wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw-werkruimtepariteit lost de Codex-harness de andere bootstrap-
bestanden (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` en `MEMORY.md` wanneer aanwezig) op en geeft ze door via Codex-
configinstructies op `thread/start` en `thread/resume`. Zo blijven
`SOUL.md` en gerelateerde werkruimtepersona-/profielcontext zichtbaar zonder
`AGENTS.md` te dupliceren.

## Codex naast andere modellen toevoegen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen schakelen
tussen Codex- en niet-Codex-provider-modellen. Een afgedwongen runtime geldt voor elke
embedded beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl
die runtime is afgedwongen, probeert OpenClaw nog steeds de Codex-harness en faalt gesloten
in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Plaats Codex op een dedicated agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en PI-fallback voor normaal gemengd
  providergebruik.
- Gebruik legacy `codex/*`-refs alleen voor compatibiliteit. Nieuwe configs moeten de voorkeur geven aan
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
- De `codex`-agent gebruikt de Codex app-server-harness.
- Als Codex ontbreekt of niet wordt ondersteund voor de `codex`-agent, faalt de beurt
  in plaats van stilletjes PI te gebruiken.

## Routering van agentopdrachten

Agents moeten gebruikersverzoeken routeren op intentie, niet alleen op het woord "Codex":

| Gebruiker vraagt om...                                 | Agent moet gebruiken...                           |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Koppel deze chat aan Codex"                           | `/codex bind`                                    |
| "Hervat Codex-thread `<id>` hier"                      | `/codex resume <id>`                             |
| "Toon Codex-threads"                                  | `/codex threads`                                 |
| "Dien een supportrapport in voor een slechte Codex-run" | `/diagnostics [note]`                            |
| "Verstuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                      |
| "Gebruik mijn ChatGPT/Codex-abonnement met Codex-runtime" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Gebruik mijn ChatGPT/Codex-abonnement via PI"         | `openai-codex/*`-modelrefs                      |
| "Voer Codex uit via ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en niet native sub-agents |

OpenClaw adverteert ACP-spawnbegeleiding alleen aan agents wanneer ACP is ingeschakeld,
dispatchbaar is en wordt ondersteund door een geladen runtime-backend. Als ACP niet beschikbaar is,
moeten de systeemprompt en plugin-Skills de agent geen ACP-routering leren.

## Alleen-Codex-deployments

Dwing de Codex-harness af wanneer je moet bewijzen dat elke embedded agentbeurt
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

Omgevings-override:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Met Codex afgedwongen faalt OpenClaw vroeg als de Codex-plugin is uitgeschakeld, de
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

Gebruik normale sessieopdrachten om agents en modellen te wisselen. `/new` maakt een nieuwe
OpenClaw-sessie en de Codex-harness maakt of hervat zijn sidecar app-server-
thread naar behoefte. `/reset` wist de OpenClaw-sessiekoppeling voor die thread
en laat de volgende beurt de harness opnieuw uit de huidige config bepalen.

## Modeldetectie

Standaard vraagt de Codex-plugin de app-server om beschikbare modellen. Als
detectie faalt of een timeout krijgt, gebruikt hij een meegeleverde fallbackcatalogus voor:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Je kunt detectie aanpassen onder `plugins.entries.codex.config.discovery`:

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

De beheerde binary wordt meegeleverd met het `codex`-pluginpakket. Dit houdt de
app-serverversie gekoppeld aan de meegeleverde plugin in plaats van aan welke aparte
Codex CLI toevallig lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer
je bewust een ander uitvoerbaar bestand wilt gebruiken.

Standaard start OpenClaw lokale Codex-harnesssessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die
voor autonome heartbeats wordt gebruikt: Codex kan shell- en netwerktools gebruiken zonder
te stoppen op native goedkeuringsprompts waar niemand is om op te antwoorden.

Om je aan te melden voor door de Codex guardian beoordeelde goedkeuringen, stel je `appServer.mode:
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
de sandbox te verlaten, buiten de werkruimte te schrijven of machtigingen zoals netwerk-
toegang toe te voegen, routeert Codex dat goedkeuringsverzoek naar de native reviewer in plaats van een
menselijke prompt. De reviewer past Codex's risicokader toe en keurt het specifieke verzoek goed of af.
Gebruik Guardian wanneer je meer vangrails wilt dan YOLO-modus
maar nog steeds nodig hebt dat onbemande agents voortgang boeken.

De preset `guardian` breidt uit naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"`.
Individuele beleidsvelden overschrijven `mode` nog steeds, zodat geavanceerde deployments de
preset kunnen mengen met expliciete keuzes. De oudere reviewerwaarde `guardian_subagent` wordt
nog steeds geaccepteerd als compatibiliteitsalias, maar nieuwe configs moeten
`auto_review` gebruiken.

Voor een al draaiende app-server gebruik je WebSocket-transport:

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
maar OpenClaw bezit de Codex app-server-accountbridge en stelt zowel
`CODEX_HOME` als `HOME` in op per-agentmappen onder de OpenClaw-status van die agent.
Codex's eigen skill-loader leest `$CODEX_HOME/skills` en
`$HOME/.agents/skills`, dus beide waarden zijn geïsoleerd voor lokale app-server-
starts. Zo blijven Codex-native Skills, plugins, config, accounts en threadstatus
gescopeerd naar de OpenClaw-agent in plaats van binnen te lekken vanuit de persoonlijke
Codex CLI-home van de operator.

OpenClaw-plugins en OpenClaw-skill-snapshots blijven via OpenClaw's eigen
pluginregister en skill-loader lopen. Persoonlijke Codex CLI-assets doen dat niet. Als je
nuttige Codex CLI-Skills of plugins hebt die onderdeel moeten worden van een OpenClaw-agent,
inventariseer ze expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

De Codex-migratieprovider kopieert Skills naar de huidige OpenClaw-agent-
werkruimte. Codex native plugins, hooks en configbestanden worden gerapporteerd of gearchiveerd
voor handmatige beoordeling in plaats van automatisch geactiveerd, omdat ze
opdrachten kunnen uitvoeren, MCP-servers kunnen blootstellen of referenties kunnen bevatten.

Auth wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-auth
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Zo
blijven Gateway-level API-sleutels beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex app-server-beurten per ongeluk via de API worden gefactureerd.
Expliciete Codex API-key-profielen en lokale stdio env-key-fallback gebruiken app-server-
login in plaats van overgeërfde childproces-env. WebSocket app-server-verbindingen
ontvangen geen Gateway env API-key-fallback; gebruik een expliciet authprofiel of het
eigen account van de remote app-server.

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

`appServer.clearEnv` heeft alleen invloed op het voortgebrachte onderliggende Codex app-server-proces.

Dynamische Codex-tools gebruiken standaard het profiel `native-first`. In die modus
stelt OpenClaw geen dynamische tools beschikbaar die Codex-native werkruimtebewerkingen
dupliceren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` en
`update_plan`. OpenClaw-integratietools zoals berichten, sessies, media,
cron, browser, nodes, gateway, `heartbeat_respond` en `web_search` blijven
beschikbaar.

Ondersteunde Codex Plugin-velden op het hoogste niveau:

| Veld                       | Standaard        | Betekenis                                                                                              |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Gebruik `"openclaw-compat"` om de volledige dynamische OpenClaw-toolset beschikbaar te stellen aan Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Aanvullende namen van dynamische OpenClaw-tools die uit Codex app-server-turns moeten worden weggelaten. |

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                |
| `command`           | beheerde Codex-binary                    | Uitvoerbaar bestand voor stdio-transport. Laat dit oningesteld om de beheerde binary te gebruiken; stel het alleen in voor een expliciete overschrijving.                                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                                                                                                                                |
| `url`               | oningesteld                              | WebSocket-URL van app-server.                                                                                                                                                                                                                   |
| `authToken`         | oningesteld                              | Bearer-token voor WebSocket-transport.                                                                                                                                                                                                          |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                                                                                                                                        |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die uit het voortgebrachte stdio app-server-proces worden verwijderd nadat OpenClaw de overgenomen omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's Codex-isolatie per agent bij lokale starts. |
| `requestTimeoutMs`  | `60000`                                  | Timeout voor app-server-aanroepen naar het control plane.                                                                                                                                                                                       |
| `mode`              | `"yolo"`                                 | Voorinstelling voor YOLO- of door guardian beoordeelde uitvoering.                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread start/resume/turn wordt verzonden.                                                                                                                                                              |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread start/resume wordt verzonden.                                                                                                                                                                         |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een legacy alias.                                                                                                                   |
| `serviceTier`       | oningesteld                              | Optionele Codex app-server-servicelaag: `"fast"`, `"flex"` of `null`. Ongeldige legacy waarden worden genegeerd.                                                                                                                               |

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: elk Codex `item/tool/call`-verzoek moet binnen
30 seconden een OpenClaw-reactie ontvangen. Bij een timeout breekt OpenClaw het toolsignaal
af waar dat wordt ondersteund en retourneert het een mislukte dynamische-toolreactie aan Codex zodat
de turn kan doorgaan in plaats van de sessie in `processing` te laten staan.

Nadat OpenClaw reageert op een app-server-verzoek met Codex-turnscope, verwacht de harness
ook dat Codex de native turn afrondt met `turn/completed`. Als de
app-server daarna 60 seconden stil blijft, onderbreekt OpenClaw naar beste vermogen
de Codex-turn, legt het een diagnostische timeout vast en geeft het de
OpenClaw-sessielane vrij zodat vervolgmailberichten niet achter een verlopen
native turn in de wachtrij blijven staan.

Omgevingsoverschrijvingen blijven beschikbaar voor lokaal testen:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt de beheerde binary wanneer
`appServer.command` oningesteld is.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Configuratie heeft
de voorkeur voor herhaalbare implementaties omdat dit het Plugin-gedrag in hetzelfde
beoordeelde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiegids:
[Codex-computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktop-control-app niet en voert
zelf geen desktopacties uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is en laat Codex vervolgens de native
MCP-toolaanroepen afhandelen tijdens turns in Codex-modus.

Voor directe toegang tot de TryCua-driver buiten de Codex-marktplaatsflow registreer je
`cua-driver mcp` met `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zie [Codex-computergebruik](/nl/plugins/codex-computer-use) voor het onderscheid
tussen door Codex beheerd computergebruik en directe MCP-registratie.

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

De installatie kan via het commandoppervlak worden gecontroleerd of geïnstalleerd:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computergebruik is macOS-specifiek en kan lokale OS-machtigingen vereisen voordat de
Codex MCP-server apps kan besturen. Als `computerUse.enabled` true is en de MCP-
server niet beschikbaar is, falen turns in Codex-modus voordat de thread start in plaats van
stilzwijgend zonder de native computergebruiktools te draaien. Zie
[Codex-computergebruik](/nl/plugins/codex-computer-use) voor marktplaatskeuzes,
limieten van externe catalogi, statusredenen en probleemoplossing.

Wanneer `computerUse.autoInstall` true is, kan OpenClaw de standaard
gebundelde Codex Desktop-marktplaats registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marktplaats heeft ontdekt. Gebruik `/new` of `/reset` na het
wijzigen van runtime- of computergebruikconfiguratie zodat bestaande sessies geen oude
PI- of Codex-threadkoppeling behouden.

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

Alleen-Codex harnessvalidatie:

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

Modelwisseling blijft door OpenClaw beheerd. Wanneer een OpenClaw-sessie is gekoppeld
aan een bestaande Codex-thread, verzendt de volgende turn het momenteel geselecteerde
OpenAI-model, de provider, het goedkeuringsbeleid, de sandbox en servicelaag opnieuw naar
app-server. Overschakelen van `openai/gpt-5.5` naar `openai/gpt-5.2` behoudt de
threadkoppeling maar vraagt Codex door te gaan met het nieuw geselecteerde model.

## Codex-opdracht

De gebundelde Plugin registreert `/codex` als een geautoriseerde slash-opdracht. Deze is
generiek en werkt op elk kanaal dat OpenClaw-tekstopdrachten ondersteunt.

Veelvoorkomende vormen:

- `/codex status` toont live connectiviteit met de app-server, modellen, account, snelheidslimieten, MCP-servers en skills.
- `/codex models` vermeldt live Codex app-server-modellen.
- `/codex threads [filter]` vermeldt recente Codex-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te comprimeren.
- `/codex review` start de native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om toestemming voordat diagnostische feedback van Codex voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computer Use-plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computer Use-plugin en laadt MCP-servers opnieuw.
- `/codex account` toont account- en snelheidslimietstatus.
- `/codex mcp` vermeldt de MCP-serverstatus van Codex app-server.
- `/codex skills` vermeldt de skills van Codex app-server.

### Veelvoorkomende debugworkflow

Wanneer een door Codex ondersteunde agent iets onverwachts doet in Telegram, Discord, Slack,
of een ander kanaal, begin dan met het gesprek waarin het probleem optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit of een andere korte notitie
   die beschrijft wat je zag.
2. Keur het diagnostische verzoek eenmaal goed. De goedkeuring maakt de lokale Gateway
   diagnostics-zip en, omdat de sessie de Codex-harness gebruikt, verzendt ook
   de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostische antwoord naar de bugmelding of supportthread.
   Het bevat het lokale bundelpad, de privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een `Inspect locally`-regel voor elke Codex-thread.
4. Als je de uitvoering zelf wilt debuggen, voer dan de afgedrukte `Inspect locally`-
   opdracht uit in een terminal. Die ziet eruit als `codex resume <thread-id>` en opent de
   native Codex-thread zodat je het gesprek kunt inspecteren, lokaal kunt voortzetten
   of Codex kunt vragen waarom het een bepaald hulpmiddel of plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige OpenClaw
Gateway diagnostics-bundel. Voor de meeste supportrapporten is `/diagnostics [note]`
het betere startpunt omdat het de lokale Gateway-status en Codex-thread-id's
samenbrengt in één antwoord. Zie [Diagnostische export](/nl/gateway/diagnostics)
voor het volledige privacymodel en het gedrag in groepschats.

OpenClaw-kern biedt ook eigenaar-only `/diagnostics [note]` als de algemene
Gateway-diagnoseopdracht. De goedkeuringsprompt toont de inleiding over gevoelige gegevens,
linkt naar [Diagnostische export](/nl/gateway/diagnostics), en vraagt
`openclaw gateway diagnostics export --json` aan via expliciete exec-goedkeuring,
elke keer opnieuw. Keur diagnostiek niet goed met een allow-all-regel. Na goedkeuring
verzendt OpenClaw een plakbaar rapport met het lokale bundelpad en de manifest-
samenvatting. Wanneer de actieve OpenClaw-sessie de Codex-harness gebruikt, machtigt
diezelfde goedkeuring ook het verzenden van de relevante Codex-feedbackbundels naar
OpenAI-servers. De goedkeuringsprompt zegt dat Codex-feedback wordt verzonden, maar
vermeldt vóór goedkeuring geen Codex-sessie- of thread-id's.

Als `/diagnostics` door een eigenaar in een groepschat wordt aangeroepen, houdt OpenClaw het
gedeelde kanaal schoon: de groep ontvangt alleen een korte melding, terwijl de
diagnostische inleiding, goedkeuringsprompts en Codex-sessie-/thread-id's naar
de eigenaar worden verzonden via de privégoedkeuringsroute. Als er geen privéroute naar de eigenaar is,
weigert OpenClaw het groepsverzoek en vraagt de eigenaar om het vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept Codex app-server `feedback/upload` aan en vraagt
app-server om logs op te nemen voor elke vermelde thread en voortgebrachte Codex-subthreads
wanneer beschikbaar. De upload loopt via het normale feedbackpad van Codex naar OpenAI-
servers; als Codex-feedback in die app-server is uitgeschakeld, retourneert de opdracht
de app-serverfout. Het voltooide diagnostische antwoord vermeldt de kanalen,
OpenClaw-sessie-id's, Codex-thread-id's en lokale `codex resume <thread-id>`-
opdrachten voor de verzonden threads. Als je de goedkeuring weigert of negeert,
drukt OpenClaw die Codex-id's niet af. Deze upload vervangt de lokale
Gateway diagnostics-export niet.

`/codex resume` schrijft hetzelfde sidecar-bindingsbestand dat de harness gebruikt voor
normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread, geeft het
momenteel geselecteerde OpenClaw-model door aan app-server, en houdt uitgebreide geschiedenis
ingeschakeld.

### Een Codex-thread inspecteren vanuit de CLI

De snelste manier om een slechte Codex-uitvoering te begrijpen is vaak om de native Codex-
thread direct te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug opmerkt in een kanaalgesprek en de problematische
Codex-sessie wilt inspecteren, lokaal wilt voortzetten, of Codex wilt vragen waarom het een
bepaald hulpmiddel of een bepaalde redeneerkeuze maakte. Het eenvoudigste pad is meestal om eerst
`/diagnostics [note]` uit te voeren: nadat je het hebt goedgekeurd, vermeldt het voltooide rapport
elke Codex-thread en drukt het een `Inspect locally`-opdracht af, bijvoorbeeld
`codex resume <thread-id>`. Je kunt die opdracht direct naar een terminal kopiëren.

Je kunt ook een thread-id krijgen via `/codex binding` voor de huidige chat of
`/codex threads [filter]` voor recente Codex app-server-threads, en daarna dezelfde
`codex resume`-opdracht uitvoeren in je shell.

Het opdrachtoppervlak vereist Codex app-server `0.125.0` of nieuwer. Afzonderlijke
controlemethoden worden gerapporteerd als `unsupported by this Codex app-server` als een
toekomstige of aangepaste app-server die JSON-RPC-methode niet blootstelt.

## Hook-grenzen

De Codex-harness heeft drie hooklagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-pluginhooks                  | OpenClaw                 | Product-/plugincompatibiliteit tussen PI- en Codex-harnassen.       |
| Codex app-server-extensiemiddleware   | Gebundelde OpenClaw-plugins | Adaptergedrag per beurt rond dynamische OpenClaw-hulpmiddelen.      |
| Native Codex-hooks                    | Codex                    | Laagniveau Codex-levenscyclus en native hulpmiddelbeleid uit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex `hooks.json`-bestanden om
OpenClaw-plugingedrag te routeren. Voor de ondersteunde native hulpmiddel- en permissiebrug
injecteert OpenClaw per-thread Codex-configuratie voor `PreToolUse`, `PostToolUse`,
`PermissionRequest`, en `Stop`. Andere Codex-hooks zoals `SessionStart` en
`UserPromptSubmit` blijven Codex-niveaucontroles; ze worden in het v1-contract niet
blootgesteld als OpenClaw-pluginhooks.

Voor dynamische OpenClaw-hulpmiddelen voert OpenClaw het hulpmiddel uit nadat Codex om de
aanroep vraagt, dus activeert OpenClaw het plugin- en middlewaregedrag waarvan het eigenaar is in de
harnessadapter. Voor Codex-native hulpmiddelen is Codex eigenaar van het canonieke hulpmiddelrecord.
OpenClaw kan geselecteerde events spiegelen, maar kan de native Codex-
thread niet herschrijven tenzij Codex die bewerking blootstelt via app-server of native hook-
callbacks.

Compaction- en LLM-levenscyclusprojecties komen uit Codex app-server-
meldingen en OpenClaw-adapterstatus, niet uit native Codex-hookopdrachten.
OpenClaw's `before_compaction`, `after_compaction`, `llm_input`, en
`llm_output`-events zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen
van de interne request- of Compaction-payloads van Codex.

Native Codex `hook/started`- en `hook/completed`-app-servermeldingen worden
geprojecteerd als `codex_app_server.hook`-agentevents voor traject en debugging.
Ze roepen geen OpenClaw-pluginhooks aan.

## V1-ondersteuningscontract

Codex-modus is niet PI met daaronder een andere modelaanroep. Codex is eigenaar van meer van
de native modellus, en OpenClaw past zijn plugin- en sessieoppervlakken
aan rond die grens.

Ondersteund in Codex-runtime v1:

| Oppervlak                                      | Ondersteuning                           | Waarom                                                                                                                                                                                               |
| ---------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                      | Ondersteund                             | Codex app-server is eigenaar van de OpenAI-beurt, native threadhervatting en native hulpmiddelvoortzetting.                                                                                          |
| OpenClaw-kanaalroutering en bezorging          | Ondersteund                             | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                       |
| Dynamische OpenClaw-hulpmiddelen               | Ondersteund                             | Codex vraagt OpenClaw om deze hulpmiddelen uit te voeren, dus OpenClaw blijft in het uitvoeringspad.                                                                                                  |
| Prompt- en contextplugins                      | Ondersteund                             | OpenClaw bouwt promptoverlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                    |
| Levenscyclus van de contextengine              | Ondersteund                             | Assemblage, ingestie of onderhoud na de beurt, en coördinatie van contextengine-Compaction draaien voor Codex-beurten.                                                                               |
| Dynamische hulpmiddelhooks                     | Ondersteund                             | `before_tool_call`, `after_tool_call`, en tool-result-middleware draaien rond dynamische hulpmiddelen waarvan OpenClaw eigenaar is.                                                                   |
| Levenscyclushooks                              | Ondersteund als adapterobservaties      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, en `after_compaction` vuren met eerlijke Codex-moduspayloads.                                                                           |
| Final-answer revision gate                     | Ondersteund via de native hookrelay     | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog één modelpass vóór finalisatie.                                                                           |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via de native hookrelay | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor vastgelegde native hulpmiddeloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native permissiebeleid                         | Ondersteund via de native hookrelay     | Codex `PermissionRequest` kan via OpenClaw-beleid worden gerouteerd waar de runtime het blootstelt. Als OpenClaw geen beslissing retourneert, gaat Codex verder via zijn normale guardian- of gebruikersgoedkeuringspad. |
| App-server-trajectvastlegging                  | Ondersteund                             | OpenClaw registreert het verzoek dat het naar app-server stuurde en de app-servermeldingen die het ontvangt.                                                                                         |

Niet ondersteund in Codex-runtime v1:

| Surface                                             | V1-grens                                                                                                                                     | Toekomstig pad                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutatie van native toolargumenten van Codex                       | Native pre-tool hooks van Codex kunnen blokkeren, maar OpenClaw herschrijft geen native toolargumenten van Codex.                                               | Vereist Codex hook-/schema-ondersteuning voor vervangende toolinvoer.                            |
| Bewerkbare native transcriptgeschiedenis van Codex            | Codex beheert de canonieke native threadgeschiedenis. OpenClaw beheert een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadoperaties nodig zijn.                    |
| `tool_result_persist` voor native toolrecords van Codex | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, niet native toolrecords van Codex.                                                           | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning.              |
| Rijke native Compaction-metadata                     | OpenClaw observeert het starten en voltooien van Compaction, maar ontvangt geen stabiele lijst van behouden/verwijderde items, token-delta of samenvattingspayload.            | Vereist rijkere Codex Compaction-events.                                                     |
| Compaction-interventie                             | Huidige OpenClaw Compaction-hooks zijn in Codex-modus op meldingsniveau.                                                                         | Voeg Codex pre-/post-Compaction-hooks toe als plugins native Compaction moeten kunnen vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-aanvragen             | OpenClaw kan app-server-aanvragen en meldingen vastleggen, maar Codex core bouwt de uiteindelijke OpenAI API-aanvraag intern.                      | Vereist een Codex model-request tracing-event of debug-API.                                   |

## Tools, media en Compaction

De Codex-harness wijzigt alleen de low-level ingebedde agentexecutor.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van de
harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en uitvoer van messaging-tools
blijven via het normale OpenClaw-leveringspad lopen.

De native hookrelay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de native tool- en permissiepaden van Codex die OpenClaw test. In
de Codex-runtime omvat dat shell-, patch- en MCP-`PreToolUse`-,
`PostToolUse`- en `PermissionRequest`-payloads. Ga er niet van uit dat elk toekomstig
Codex hookevent een OpenClaw Plugin-oppervlak is totdat het runtimecontract het
benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete allow- of deny-beslissingen
wanneer beleid beslist. Een resultaat zonder beslissing is geen allow. Codex behandelt dit als geen
hookbeslissing en valt terug op zijn eigen guardian- of gebruikersgoedkeuringspad.

Codex MCP-toolgoedkeuringsverzoeken worden via de Plugin-goedkeuringsflow van OpenClaw
geleid wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex `request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende wachtrij-follow-upbericht beantwoordt dat native
serververzoek in plaats van als extra context te worden gestuurd. Andere MCP-elicitation-
verzoeken falen nog steeds gesloten.

Actieve-run-wachtrijsturing mapt naar Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` batcht OpenClaw wachtrijchatberichten
voor het geconfigureerde stiltevenster en stuurt ze als één `turn/steer`-verzoek in
aankomstvolgorde. Legacy `queue`-modus stuurt afzonderlijke `turn/steer`-verzoeken. Codex
review- en handmatige Compaction-turns kunnen same-turn-sturing weigeren, waarbij
OpenClaw de follow-upwachtrij gebruikt wanneer de geselecteerde modus fallback toestaat. Zie
[Sturingswachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt native thread-Compaction
gedelegeerd aan Codex app-server. OpenClaw houdt een transcriptspiegel bij voor kanaalgeschiedenis,
zoeken, `/new`, `/reset` en toekomstige model- of harnesswisseling. De
spiegel bevat de gebruikersprompt, uiteindelijke assistenttekst en lichte Codex
reasoning- of planrecords wanneer de app-server die emitteert. Op dit moment legt OpenClaw alleen
native signalen voor het starten en voltooien van Compaction vast. Het stelt nog geen
menselijk leesbare Compaction-samenvatting of controleerbare lijst beschikbaar van welke entries Codex
na Compaction heeft behouden.

Omdat Codex de canonieke native thread beheert, herschrijft `tool_result_persist`
momenteel geen native toolresultaatrecords van Codex. Het is alleen van toepassing wanneer
OpenClaw een toolresultaat naar een sessietranscript schrijft dat eigendom is van OpenClaw.

Mediageneratie vereist geen PI. Afbeelding, video, muziek, PDF, TTS en mediabegrip
blijven de bijpassende provider-/modelinstellingen gebruiken, zoals
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en
`messages.tts`.

## Probleemoplossing

**Codex verschijnt niet als normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model met
`agentRuntime.id: "codex"` (of een legacy `codex/*`-ref), schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow` `codex`
uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan nog steeds PI gebruiken als
compatibiliteitsbackend wanneer geen Codex-harness de run claimt. Stel
`agentRuntime.id: "codex"` in om Codex-selectie tijdens testen af te dwingen. Een
afgedwongen Codex-runtime faalt in plaats van terug te vallen op PI. Zodra Codex app-server
is geselecteerd, komen de fouten daarvan direct naar voren.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake
versie `0.125.0` of nieuwer rapporteert. Prereleases met dezelfde versie of versies met buildsuffix
zoals `0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat de
stabiele protocolondergrens `0.125.0` is wat OpenClaw test.

**Modelontdekking is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel ontdekking uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`,
en dat de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een legacy
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven in
`auto`-modus op hun normale providerpad. Als je `agentRuntime.id: "codex"` afdwingt, moet elke ingebedde
turn voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan `/new` of `/reset`; als het aanhoudt, herstart
de Gateway om verouderde native hookregistraties te wissen. Als `computer-use.list_apps`
een time-out krijgt, herstart Codex Computer Use of Codex Desktop en probeer opnieuw.

## Gerelateerd

- [Agent-harness-plugins](/nl/plugins/sdk-agent-harness)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin-hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
