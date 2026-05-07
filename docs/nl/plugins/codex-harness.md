---
read_when:
    - Je wilt de gebundelde Codex-appserver-harness gebruiken
    - Je hebt configuratievoorbeelden voor de Codex-harnas nodig
    - Je wilt dat implementaties met alleen Codex falen in plaats van terug te vallen op Pi
summary: Voer ingebedde agentbeurten van OpenClaw uit via de meegeleverde Codex app-server-harness
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-07T01:53:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex`-plugin laat OpenClaw ingebedde agentbeurten uitvoeren via de
Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex eigenaar is van de agent-sessie op laag
niveau: modeldetectie, native hervatten van threads, native compaction en
uitvoering via de app-server. OpenClaw blijft eigenaar van chatkanalen,
sessiebestanden, modelselectie, tools, goedkeuringen, medialevering en de
zichtbare transcriptspiegel.

Wanneer een bronchatbeurt via de Codex-harness loopt, gebruiken zichtbare
antwoorden standaard de OpenClaw `message`-tool als de deployment
`messages.visibleReplies` niet expliciet heeft geconfigureerd. De agent kan
zijn Codex-beurt nog steeds privé afronden; hij plaatst alleen iets in het
kanaal wanneer hij `message(action="send")` aanroept. Stel
`messages.visibleReplies: "automatic"` in om finale antwoorden in directe chat
op het legacy-pad voor automatische levering te houden.

Codex-heartbeatbeurten krijgen standaard ook de `heartbeat_respond`-tool, zodat
de agent kan vastleggen of de wake stil moet blijven of moet melden zonder die
besturingsstroom in finale tekst te coderen.

Heartbeat-specifieke initiatiefrichtlijnen worden als Codex collaboration-mode
ontwikkelaarsinstructie meegestuurd met de heartbeatbeurt zelf. Gewone
chatbeurten herstellen Codex Default-modus in plaats van heartbeatfilosofie in
hun normale runtimeprompt mee te dragen.

Als je je probeert te oriënteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Snelle configuratie

De meeste gebruikers die "Codex in OpenClaw" willen, willen deze route: meld je
aan met een ChatGPT/Codex-abonnement en voer daarna ingebedde agentbeurten uit
via de native Codex app-server-runtime. De modelreferentie blijft canoniek als
`openai/gpt-*`; abonnementsauthenticatie komt uit het Codex-account/profiel,
niet uit een `openai-codex/*`-modelprefix.

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

Gebruik `openai-codex/gpt-*` niet in configuratie. Die prefix is een legacy-route
die `openclaw doctor --fix` herschrijft naar `openai/gpt-*` voor primaire
modellen, fallbacks, heartbeat-/subagent-/compaction-overschrijvingen, hooks,
kanaaloverschrijvingen en verouderde vastgelegde sessieroute-pins.

## Wat deze plugin wijzigt

De gebundelde `codex`-plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                      | Hoe je die gebruikt                                | Wat die doet                                                                 |
| --------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Native ingebedde runtime          | `agentRuntime.id: "codex"`                         | Voert OpenClaw ingebedde agentbeurten uit via Codex app-server.              |
| Native chatbesturingsopdrachten   | `/codex bind`, `/codex resume`, `/codex steer`, ... | Koppelt en bestuurt Codex app-server-threads vanuit een berichtenconversatie. |
| Codex app-server-provider/catalog | `codex`-internals, beschikbaar via de harness      | Laat de runtime app-servermodellen ontdekken en valideren.                   |
| Codex-pad voor mediabegrip        | `codex/*` image-model-compatibiliteitspaden        | Voert begrensde Codex app-server-beurten uit voor ondersteunde beeldbegripmodellen. |
| Native hookrelay                  | Plugin-hooks rond Codex-native gebeurtenissen      | Laat OpenClaw ondersteunde Codex-native tool-/finalisatiegebeurtenissen observeren/blokkeren. |

Het inschakelen van de plugin maakt die mogelijkheden beschikbaar. Het doet
**niet** het volgende:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelreferenties omzetten naar de native runtime zonder dat
  doctor verifieert dat Codex is geïnstalleerd, ingeschakeld, de `codex`-harness
  levert en OAuth-gereed is
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies hot-switchen die al een PI-runtime hebben vastgelegd
- OpenClaw-kanaallevering, sessiebestanden, auth-profielopslag of
  berichtroutering vervangen

Dezelfde plugin is ook eigenaar van het native `/codex`-oppervlak voor
chatbesturingsopdrachten. Als de plugin is ingeschakeld en de gebruiker vraagt
om Codex-threads vanuit chat te koppelen, hervatten, sturen, stoppen of
inspecteren, moeten agents `/codex ...` verkiezen boven ACP. ACP blijft de
expliciete fallback wanneer de gebruiker om ACP/acpx vraagt of de ACP
Codex-adapter test.

Native Codex-beurten houden OpenClaw-pluginhooks als de publieke
compatibiliteitslaag. Dit zijn in-process OpenClaw-hooks, geen Codex
`hooks.json`-opdrachthooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` voor gespiegeld transcriptrecords
- `before_agent_finalize` via Codex `Stop`-relay
- `agent_end`

Plugins kunnen ook runtime-neutrale middleware voor toolresultaten registreren
om dynamische OpenClaw-toolresultaten te herschrijven nadat OpenClaw de tool
uitvoert en voordat het resultaat aan Codex wordt teruggegeven. Dit staat los
van de publieke `tool_result_persist`-pluginhook, die door OpenClaw beheerde
transcriptwrites voor toolresultaten transformeert.

Zie [Plugin-hooks](/nl/plugins/hooks) en [Plugin-guard-gedrag](/nl/tools/plugin) voor
de semantiek van de pluginhooks zelf.

De harness staat standaard uit. Nieuwe configuraties moeten OpenAI-modelreferenties
canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` forceren wanneer ze
native app-server-uitvoering willen. Legacy `codex/*`-modelreferenties selecteren
de harness nog steeds automatisch voor compatibiliteit, maar runtime-backed legacy
providerprefixes worden niet getoond als normale model-/providerkeuzes.

Als een geconfigureerde modelroute nog steeds `openai-codex/*` is, herschrijft
`openclaw doctor --fix` die naar `openai/*`. Voor overeenkomende agentroutes zet
het de agentruntime alleen op `codex` wanneer de Codex-plugin is geïnstalleerd,
ingeschakeld, de `codex`-harness levert en bruikbare OAuth heeft; anders zet het
de runtime op `pi`.

## Routekaart

Gebruik deze tabel voordat je configuratie wijzigt:

| Gewenst gedrag                                      | Modelreferentie          | Runtimeconfiguratie                   | Auth-/profielroute          | Verwacht statuslabel           |
| --------------------------------------------------- | ------------------------ | ------------------------------------- | --------------------------- | ------------------------------ |
| ChatGPT/Codex-abonnement met native Codex-runtime   | `openai/gpt-*`           | `agentRuntime.id: "codex"`            | Codex OAuth of Codex-account | `Runtime: OpenAI Codex`        |
| OpenAI API via normale OpenClaw-runner              | `openai/gpt-*`           | weggelaten of `runtime: "pi"`         | OpenAI API-sleutel          | `Runtime: OpenClaw Pi Default` |
| Legacy-configuratie die doctor-reparatie nodig heeft | `openai-codex/gpt-*`     | gerepareerd naar `codex` of `pi`      | Bestaande geconfigureerde auth | Controleer opnieuw na `doctor --fix` |
| Gemengde providers met conservatieve automatische modus | provider-specifieke referenties | `agentRuntime.id: "auto"`       | Per geselecteerde provider  | Hangt af van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie                  | afhankelijk van ACP-prompt/model | `sessions_spawn` met `runtime: "acp"` | ACP-backend-auth            | ACP-taak-/sessiestatus         |

De belangrijke scheiding is provider versus runtime:

- `openai-codex/*` is een legacy-route die doctor herschrijft.
- `agentRuntime.id: "codex"` vereist de Codex-harness en faalt gesloten als die
  niet beschikbaar is.
- `agentRuntime.id: "auto"` laat geregistreerde harnesses overeenkomende
  providerroutes claimen, maar canonieke OpenAI-referenties blijven PI-eigendom
  tenzij een harness dat provider-/modelpaar ondersteunt.
- `/codex ...` beantwoordt "welke native Codex-conversatie moet deze chat koppelen
  of besturen?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

OpenAI-familieroutes zijn prefixspecifiek. Gebruik voor de gebruikelijke
opzet met abonnement plus native Codex-runtime `openai/*` met
`agentRuntime.id: "codex"`. Behandel `openai-codex/*` als legacy-configuratie
die doctor moet herschrijven:

| Modelreferentie                             | Runtimepad                                  | Gebruik wanneer                                                           |
| ------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | OpenAI-provider via OpenClaw/PI-plumbing    | Je huidige directe OpenAI Platform API-toegang met `OPENAI_API_KEY` wilt. |
| `openai-codex/gpt-5.5`                      | Legacy-route gerepareerd door doctor        | Je op oude configuratie zit; voer `openclaw doctor --fix` uit om die te herschrijven. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server-harness                  | Je ChatGPT/Codex-abonnementsauthenticatie met native Codex-uitvoering wilt. |

GPT-5.5 kan op zowel directe OpenAI API-sleutelroutes als
Codex-abonnementsroutes verschijnen wanneer je account die beschikbaar maakt.
Gebruik `openai/gpt-5.5` met de Codex app-server-harness voor native
Codex-runtime, of `openai/gpt-5.5` zonder Codex-runtimeoverschrijving voor
direct API-sleutelverkeer.

Legacy `codex/gpt-*`-referenties blijven geaccepteerd als compatibiliteitsaliassen.
Doctor-compatibiliteitsmigratie herschrijft legacy-runtimereferenties naar
canonieke modelreferenties en legt het runtimebeleid afzonderlijk vast. Nieuwe
native app-server-harnessconfiguraties moeten `openai/gpt-*` plus
`agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai/gpt-*` voor de normale OpenAI-route en `codex/gpt-*` wanneer beeldbegrip
via een begrensde Codex app-server-beurt moet lopen. Gebruik geen
`openai-codex/gpt-*`; doctor herschrijft die legacy-prefix naar `openai/gpt-*`.
Het Codex app-servermodel moet ondersteuning voor beeldinvoer adverteren;
tekst-only Codex-modellen falen voordat de mediabeurt start.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen.
Als de selectie verrassend is, schakel dan debuglogging in voor het
`agents/harness`-subsysteem en inspecteer het gestructureerde
`agent harness selected`-record van de gateway. Het bevat de geselecteerde
harness-id, selectiereden, runtime-/fallbackbeleid en, in `auto`-modus, het
ondersteuningsresultaat van elke pluginkandidaat.

### Wat doctor-waarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer geconfigureerde modelreferenties of
vastgelegde sessieroutestatus nog steeds `openai-codex/*` gebruiken.
`openclaw doctor --fix` herschrijft die routes naar:

- `openai/<model>`
- `agentRuntime.id: "codex"` wanneer Codex is geïnstalleerd, ingeschakeld, de
  `codex`-harness levert en bruikbare OAuth heeft
- `agentRuntime.id: "pi"` anders

De `codex`-route forceert de native Codex-harness. De `pi`-route houdt de agent
op de standaard OpenClaw-runner in plaats van Codex in te schakelen of te
installeren als neveneffect van het opschonen van legacy-routes.
Doctor repareert ook verouderde vastgelegde sessiepins in ontdekte
agent-sessiestores, zodat oude conversaties niet vast blijven zitten op de
verwijderde route.

Harnessselectie is geen bedieningselement voor een livesessie. Wanneer een ingesloten beurt wordt uitgevoerd,
registreert OpenClaw de geselecteerde harness-id voor die sessie en blijft deze gebruiken voor
latere beurten met dezelfde sessie-id. Wijzig de configuratie `agentRuntime` of
`OPENCLAW_AGENT_RUNTIME` wanneer je wilt dat toekomstige sessies een andere harness gebruiken;
gebruik `/new` of `/reset` om een nieuwe sessie te starten voordat je een bestaand
gesprek tussen PI en Codex wisselt. Dit voorkomt dat één transcript opnieuw wordt afgespeeld via
twee incompatibele systeemeigen sessiesystemen.

Verouderde sessies die vóór harness-pins zijn gemaakt, worden als PI-vastgepind behandeld zodra ze
transcriptgeschiedenis hebben. Gebruik `/new` of `/reset` om dat gesprek na een
configuratiewijziging naar Codex over te zetten.

`/status` toont de effectieve modelruntime. De standaard PI-harness verschijnt als
`Runtime: OpenClaw Pi Default`, en de Codex app-server-harness verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de gebundelde `codex`-Plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard een compatibel
  Codex app-server-binair bestand, dus lokale `codex`-opdrachten op `PATH` hebben
  geen invloed op normaal starten van de harness.
- Codex-authenticatie beschikbaar voor het app-server-proces of voor OpenClaw's Codex-authenticatiebrug.
  Lokale app-server-starts gebruiken een door OpenClaw beheerde Codex-home voor elke
  agent en een geïsoleerde child-`HOME`, zodat ze standaard niet je persoonlijke
  `~/.codex`-account, Skills, plugins, configuratie, threadstatus of systeemeigen
  `$HOME/.agents/skills` lezen.

De Plugin blokkeert oudere of ongetagde app-server-handshakes. Daardoor blijft
OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt authenticatie meestal uit het Codex CLI-account
of een OpenClaw `openai-codex`-authenticatieprofiel. Lokale stdio app-server-starts kunnen
ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Bootstrapbestanden voor de werkruimte

Codex verwerkt `AGENTS.md` zelf via systeemeigen projectdoc-detectie. OpenClaw
schrijft geen synthetische Codex-projectdocbestanden en is niet afhankelijk van Codex-fallbackbestandsnamen
voor personabestanden, omdat Codex-fallbacks alleen van toepassing zijn wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw-werkruimtepariteit lost de Codex-harness de andere bootstrapbestanden
op (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` en `MEMORY.md` wanneer aanwezig) en stuurt ze door via Codex
developer instructions bij `thread/start` en `thread/resume`. Zo blijven
`SOUL.md` en gerelateerde persona-/profielcontext van de werkruimte zichtbaar op de systeemeigen
Codex-baan die gedrag vormgeeft, zonder `AGENTS.md` te dupliceren.

## Codex toevoegen naast andere modellen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen wisselen
tussen Codex- en niet-Codex-providermodellen. Een afgedwongen runtime geldt voor elke
ingesloten beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl
die runtime is afgedwongen, probeert OpenClaw nog steeds de Codex-harness en faalt het gesloten,
in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Plaats Codex op een toegewezen agent met `agentRuntime.id: "codex"`.
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

- De standaardagent `main` gebruikt het normale providerpad en de PI-compatibiliteitsfallback.
- De agent `codex` gebruikt de Codex app-server-harness.
- Als Codex ontbreekt of niet wordt ondersteund voor de agent `codex`, faalt de beurt
  in plaats van stilletjes PI te gebruiken.

## Routering van agentopdrachten

Agents moeten gebruikersverzoeken routeren op intentie, niet alleen op het woord "Codex":

| Gebruiker vraagt om...                                 | Agent moet gebruiken...                           |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bind deze chat aan Codex"                             | `/codex bind`                                    |
| "Hervat Codex-thread `<id>` hier"                      | `/codex resume <id>`                             |
| "Toon Codex-threads"                                   | `/codex threads`                                 |
| "Dien een supportrapport in voor een slechte Codex-run" | `/diagnostics [note]`                            |
| "Stuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                      |
| "Gebruik mijn ChatGPT/Codex-abonnement met Codex-runtime" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Herstel oude `openai-codex/*`-configuratie-/sessiepins" | `openclaw doctor --fix`                          |
| "Voer Codex uit via ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en geen systeemeigen sub-agents |

OpenClaw toont ACP-spawnrichtlijnen alleen aan agents wanneer ACP is ingeschakeld,
dispatchbaar is en wordt ondersteund door een geladen runtimebackend. Als ACP niet beschikbaar is,
mogen de systeemprompt en Plugin-Skills de agent niet instrueren over ACP-routering.

## Alleen-Codex-implementaties

Dwing de Codex-harness af wanneer je moet aantonen dat elke ingesloten agentbeurt
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

Omgevingsoverschrijving:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Met Codex afgedwongen faalt OpenClaw vroeg als de Codex-Plugin is uitgeschakeld, de
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

Gebruik normale sessieopdrachten om van agents en modellen te wisselen. `/new` maakt een nieuwe
OpenClaw-sessie en de Codex-harness maakt of hervat zijn sidecar app-server-thread
wanneer nodig. `/reset` wist de OpenClaw-sessiebinding voor die thread
en laat de volgende beurt de harness opnieuw bepalen op basis van de huidige configuratie.

## Modeldetectie

Standaard vraagt de Codex-Plugin de app-server om beschikbare modellen. Als
detectie faalt of een time-out krijgt, gebruikt deze een gebundelde fallbackcatalogus voor:

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

Standaard start de Plugin OpenClaw's beheerde Codex-binair bestand lokaal met:

```bash
codex app-server --listen stdio://
```

Het beheerde binaire bestand wordt meegeleverd met het `codex`-Plugin-pakket. Daardoor blijft de
app-server-versie gekoppeld aan de gebundelde Plugin in plaats van aan de afzonderlijke
Codex CLI die toevallig lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer
je bewust een ander uitvoerbaar bestand wilt gebruiken.

Standaard start OpenClaw lokale Codex-harnesssessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt
voor autonome Heartbeats: Codex kan shell- en netwerktools gebruiken zonder
te stoppen bij systeemeigen goedkeuringsprompts die niemand kan beantwoorden.

Om Codex-goedkeuringen met Guardian-review in te schakelen, stel je `appServer.mode:
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

Guardian-modus gebruikt Codex' systeemeigen auto-review-goedkeuringspad. Wanneer Codex vraagt om
de sandbox te verlaten, buiten de werkruimte te schrijven of machtigingen zoals netwerktoegang
toe te voegen, routeert Codex dat goedkeuringsverzoek naar de systeemeigen reviewer in plaats van naar een
menselijke prompt. De reviewer past Codex' risicokader toe en keurt het specifieke verzoek goed of af.
Gebruik Guardian wanneer je meer waarborgen wilt dan de YOLO-modus,
maar nog steeds onbeheerde agents voortgang moeten kunnen laten maken.

De preset `guardian` wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"`.
Afzonderlijke beleidsvelden overschrijven nog steeds `mode`, zodat geavanceerde implementaties de
preset kunnen combineren met expliciete keuzes. De oudere reviewerwaarde `guardian_subagent` wordt
nog geaccepteerd als compatibiliteitsalias, maar nieuwe configuraties moeten
`auto_review` gebruiken.

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

Stdio app-server-starts erven standaard de procesomgeving van OpenClaw,
maar OpenClaw beheert de Codex app-server-accountbrug en stelt zowel
`CODEX_HOME` als `HOME` in op agent-specifieke mappen onder de OpenClaw-status
van die agent. Codex' eigen Skill-loader leest `$CODEX_HOME/skills` en
`$HOME/.agents/skills`, dus beide waarden zijn geïsoleerd voor lokale app-server-starts.
Dat houdt Codex-systeemeigen Skills, plugins, configuratie, accounts en threadstatus
beperkt tot de OpenClaw-agent in plaats van dat ze binnenlekken vanuit de persoonlijke
Codex CLI-home van de operator.

OpenClaw-plugins en OpenClaw-Skill-snapshots lopen nog steeds via OpenClaw's eigen
Plugin-registry en Skill-loader. Persoonlijke Codex CLI-assets niet. Als je
nuttige Codex CLI-Skills of plugins hebt die onderdeel moeten worden van een OpenClaw-agent,
inventariseer ze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

De Codex-migratieprovider kopieert Skills naar de huidige OpenClaw-agentwerkruimte.
Codex-systeemeigen plugins, hooks en configuratiebestanden worden gerapporteerd of gearchiveerd
voor handmatige review in plaats van automatisch geactiveerd, omdat ze
opdrachten kunnen uitvoeren, MCP-servers kunnen blootstellen of credentials kunnen bevatten.

Authenticatie wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-authenticatie
   nog vereist is.

Wanneer OpenClaw een ChatGPT-abonnementstijl Codex-authprofiel ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het voortgebrachte Codex-childproces. Dat
houdt Gateway-niveau API-sleutels beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex app-server-beurten per ongeluk via de API worden gefactureerd.
Expliciete Codex API-sleutelprofielen en lokale stdio env-key fallback gebruiken app-server
login in plaats van overgeërfde childproces-env. WebSocket app-serververbindingen
ontvangen geen Gateway env API-key fallback; gebruik een expliciet authprofiel of het
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

`appServer.clearEnv` is alleen van invloed op het voortgebrachte Codex app-server-childproces.

Dynamische Codex-tools gebruiken standaard het `native-first`-profiel. In die modus
stelt OpenClaw geen dynamische tools beschikbaar die native Codex-werkruimtebewerkingen
dupliceren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` en
`update_plan`. OpenClaw-integratietools zoals messaging, sessies, media,
cron, browser, nodes, gateway, `heartbeat_respond` en `web_search` blijven
beschikbaar.

Ondersteunde Codex plugin-velden op topniveau:

| Veld                       | Standaard        | Betekenis                                                                                   |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gebruik `"openclaw-compat"` om de volledige OpenClaw dynamische toolset beschikbaar te maken voor Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Extra namen van OpenClaw dynamische tools die moeten worden weggelaten uit Codex app-server-beurten. |

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                       |
| `command`           | beheerde Codex-binary                    | Uitvoerbaar bestand voor stdio-transport. Laat dit oningesteld om de beheerde binary te gebruiken; stel het alleen in voor een expliciete override.                                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                                                                                                                       |
| `url`               | oningesteld                              | WebSocket app-server-URL.                                                                                                                                                                                                              |
| `authToken`         | oningesteld                              | Bearer-token voor WebSocket-transport.                                                                                                                                                                                                 |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                                                                                                                               |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die worden verwijderd uit het voortgebrachte stdio app-server-proces nadat OpenClaw zijn overgeërfde omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's Codex-isolatie per agent bij lokale launches. |
| `requestTimeoutMs`  | `60000`                                  | Time-out voor app-server control-plane-calls.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Preset voor YOLO- of guardian-beoordeelde uitvoering.                                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread start/resume/turn wordt verzonden.                                                                                                                                                     |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread start/resume wordt verzonden.                                                                                                                                                                |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een legacy alias.                                                                                                          |
| `serviceTier`       | oningesteld                              | Optionele Codex app-server-servicetier: `"fast"`, `"flex"` of `null`. Ongeldige legacywaarden worden genegeerd.                                                                                                                        |

OpenClaw-beheerde dynamische toolcalls worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: elk Codex `item/tool/call`-verzoek moet binnen
30 seconden een OpenClaw-antwoord ontvangen. Bij een time-out breekt OpenClaw het toolsignaal
af waar dat wordt ondersteund en retourneert het een mislukte dynamische-toolrespons aan Codex, zodat
de beurt kan doorgaan in plaats van de sessie in `processing` te laten hangen.

Nadat OpenClaw heeft gereageerd op een Codex beurtgebonden app-server-verzoek, verwacht de harness
ook dat Codex de native beurt afrondt met `turn/completed`. Als de
app-server daarna 60 seconden stil blijft, onderbreekt OpenClaw naar beste vermogen
de Codex-beurt, registreert het een diagnostische time-out en geeft het de
OpenClaw-sessielane vrij zodat vervolgchatberichten niet achter een verlopen
native beurt in de wachtrij blijven staan.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Config heeft
de voorkeur voor herhaalbare deployments omdat dit het plugin-gedrag in hetzelfde
beoordeelde bestand houdt als de rest van de Codex harness-configuratie.

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiegids:
[Codex-computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktop-control-app niet en voert
desktopacties niet zelf uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is, en laat Codex vervolgens de native
MCP-toolcalls afhandelen tijdens Codex-modusbeurten.

Voor directe TryCua-driver-toegang buiten de Codex marketplace-flow registreer je
`cua-driver mcp` met `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zie [Codex-computergebruik](/nl/plugins/codex-computer-use) voor het onderscheid
tussen Codex-beheerd computergebruik en directe MCP-registratie.

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

Computergebruik is macOS-specifiek en kan lokale OS-machtigingen vereisen voordat de
Codex MCP-server apps kan aansturen. Als `computerUse.enabled` true is en de MCP-server
niet beschikbaar is, falen Codex-modusbeurten voordat de thread start in plaats van
stilzwijgend zonder de native computergebruik-tools te draaien. Zie
[Codex-computergebruik](/nl/plugins/codex-computer-use) voor marketplace-keuzes,
remote catalog-limieten, statusredenen en probleemoplossing.

Wanneer `computerUse.autoInstall` true is, kan OpenClaw de standaard
gebundelde Codex Desktop marketplace registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marketplace heeft ontdekt. Gebruik `/new` of `/reset` na
het wijzigen van runtime- of computergebruik-config, zodat bestaande sessies geen oude
PI- of Codex-threadbinding behouden.

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

Modelwisselen blijft door OpenClaw beheerd. Wanneer een OpenClaw-sessie is gekoppeld
aan een bestaande Codex-thread, verzendt de volgende beurt het momenteel geselecteerde
OpenAI-model, de provider, het goedkeuringsbeleid, de sandbox en de servicetier opnieuw naar
app-server. Overschakelen van `openai/gpt-5.5` naar `openai/gpt-5.2` behoudt de
threadbinding, maar vraagt Codex om door te gaan met het nieuw geselecteerde model.

## Codex-opdracht

De gebundelde plugin registreert `/codex` als een geautoriseerde slash-opdracht. Deze is
generiek en werkt op elk kanaal dat OpenClaw-tekstopdrachten ondersteunt.

Veelvoorkomende vormen:

- `/codex status` toont live app-serverconnectiviteit, modellen, account, snelheidslimieten, MCP-servers en Skills.
- `/codex models` geeft live Codex app-servermodellen weer.
- `/codex threads [filter]` geeft recente Codex-threads weer.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt de Codex app-server om de gekoppelde thread te comprimeren.
- `/codex review` start de native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om bevestiging voordat diagnostische feedback van Codex voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computer Use Plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computer Use Plugin en laadt MCP-servers opnieuw.
- `/codex account` toont account- en snelheidslimietstatus.
- `/codex mcp` geeft de MCP-serverstatus van de Codex app-server weer.
- `/codex skills` geeft Codex app-server Skills weer.

Wanneer Codex een fout door een gebruikslimiet meldt, neemt OpenClaw de volgende
reset-tijd van de app-server op wanneer Codex die heeft verstrekt. Gebruik `/codex account` in hetzelfde
gesprek om de huidige account- en snelheidslimietvensters te bekijken.

### Veelvoorkomende debuggingworkflow

Wanneer een door Codex ondersteunde agent iets onverwachts doet in Telegram, Discord, Slack,
of een ander kanaal, begin dan met het gesprek waarin het probleem optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit of een andere korte notitie
   die beschrijft wat je hebt gezien.
2. Keur het diagnostische verzoek eenmalig goed. De goedkeuring maakt de lokale Gateway
   diagnostics-zip en, omdat de sessie de Codex-harness gebruikt, verzendt ook
   de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostische antwoord naar het bugrapport of de supportthread.
   Het bevat het lokale bundelpad, de privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een regel `Inspect locally` voor elke Codex-thread.
4. Als je de uitvoering zelf wilt debuggen, voer dan de afgedrukte opdracht `Inspect locally`
   uit in een terminal. Die ziet eruit als `codex resume <thread-id>` en opent de
   native Codex-thread zodat je het gesprek kunt inspecteren, lokaal kunt voortzetten,
   of Codex kunt vragen waarom het een bepaalde tool of een bepaald plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige OpenClaw
Gateway-diagnosticsbundel. Voor de meeste supportrapporten is `/diagnostics [note]`
het betere startpunt, omdat het de lokale Gateway-status en Codex-thread-id's
in één antwoord aan elkaar koppelt. Zie [Diagnostics export](/nl/gateway/diagnostics)
voor het volledige privacymodel en het gedrag in groepschats.

Core OpenClaw stelt ook de alleen-voor-eigenaren beschikbare `/diagnostics [note]` beschikbaar als de algemene
Gateway-diagnosticsopdracht. De goedkeuringsprompt toont de preambule over gevoelige gegevens,
linkt naar [Diagnostics Export](/nl/gateway/diagnostics), en vraagt
`openclaw gateway diagnostics export --json` aan via expliciete exec-goedkeuring,
elke keer opnieuw. Keur diagnostiek niet goed met een allow-all-regel. Na goedkeuring
verzendt OpenClaw een plakbaar rapport met het lokale bundelpad en de manifestsamenvatting.
Wanneer de actieve OpenClaw-sessie de Codex-harness gebruikt, autoriseert diezelfde
goedkeuring ook het verzenden van de relevante Codex-feedbackbundels naar
OpenAI-servers. De goedkeuringsprompt zegt dat Codex-feedback wordt verzonden, maar
vermeldt vóór goedkeuring geen Codex-sessie- of thread-id's.

Als `/diagnostics` door een eigenaar in een groepschat wordt aangeroepen, houdt OpenClaw het
gedeelde kanaal schoon: de groep ontvangt alleen een korte melding, terwijl de
diagnosticspreambule, goedkeuringsprompts en Codex-sessie-/thread-id's naar
de eigenaar worden gestuurd via de privégoedkeuringsroute. Als er geen privérout naar de eigenaar is,
weigert OpenClaw het groepsverzoek en vraagt het de eigenaar om het vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept Codex app-server `feedback/upload` aan en vraagt
de app-server om logs op te nemen voor elke vermelde thread en voortgebrachte Codex-subthreads
wanneer beschikbaar. De upload verloopt via het normale feedbackpad van Codex naar OpenAI-
servers; als Codex-feedback in die app-server is uitgeschakeld, retourneert de opdracht
de app-serverfout. Het voltooide diagnostische antwoord vermeldt de kanalen,
OpenClaw-sessie-id's, Codex-thread-id's en lokale opdrachten `codex resume <thread-id>`
voor de threads die zijn verzonden. Als je de goedkeuring weigert of negeert,
drukt OpenClaw die Codex-id's niet af. Deze upload vervangt de lokale
Gateway-diagnosticsexport niet.

`/codex resume` schrijft hetzelfde sidecar-bindingsbestand dat de harness gebruikt voor
normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread, geeft het
het momenteel geselecteerde OpenClaw-model door aan de app-server en houdt het uitgebreide geschiedenis
ingeschakeld.

### Een Codex-thread inspecteren vanuit de CLI

De snelste manier om een foutieve Codex-uitvoering te begrijpen is vaak om de native Codex-
thread rechtstreeks te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug opmerkt in een kanaalgesprek en de
problematische Codex-sessie wilt inspecteren, deze lokaal wilt voortzetten, of Codex wilt vragen waarom het een
bepaalde tool- of redeneerkeuze maakte. De eenvoudigste route is meestal om eerst
`/diagnostics [note]` uit te voeren: nadat je die hebt goedgekeurd, vermeldt het voltooide rapport
elke Codex-thread en drukt het een opdracht `Inspect locally` af, bijvoorbeeld
`codex resume <thread-id>`. Je kunt die opdracht rechtstreeks naar een terminal kopiëren.

Je kunt ook een thread-id verkrijgen via `/codex binding` voor de huidige chat of
`/codex threads [filter]` voor recente Codex app-serverthreads, en daarna dezelfde
opdracht `codex resume` in je shell uitvoeren.

Het opdrachtoppervlak vereist Codex app-server `0.125.0` of nieuwer. Afzonderlijke
controlemethoden worden gerapporteerd als `unsupported by this Codex app-server` als een
toekomstige of aangepaste app-server die JSON-RPC-methode niet beschikbaar stelt.

## Hookgrenzen

De Codex-harness heeft drie hooklagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin-hooks                 | OpenClaw                 | Product-/Plugin-compatibiliteit over PI- en Codex-harnassen heen.   |
| Codex app-serverextensiemiddleware    | Gebundelde OpenClaw-Plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.          |
| Native Codex-hooks                    | Codex                    | Low-level Codex-levenscyclus en native toolbeleid vanuit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex-`hooks.json`-bestanden om
OpenClaw Plugin-gedrag te routeren. Voor de ondersteunde native tool- en toestemmingsbrug
injecteert OpenClaw Codex-configuratie per thread voor `PreToolUse`, `PostToolUse`,
`PermissionRequest` en `Stop`. Wanneer Codex app-servergoedkeuringen zijn ingeschakeld
(`approvalPolicy` is niet `"never"`), laat de standaard geïnjecteerde native hookconfiguratie
`PermissionRequest` weg zodat de app-serverreviewer van Codex en de goedkeuringsbrug van OpenClaw
echte escalaties na review afhandelen. Operators kunnen nog steeds expliciet
`permission_request` toevoegen aan `nativeHookRelay.events` wanneer zij de compatibiliteitsrelay
nodig hebben. Andere Codex-hooks zoals `SessionStart` en `UserPromptSubmit` blijven
controles op Codex-niveau; ze worden in het v1-contract niet blootgesteld als OpenClaw Plugin-hooks.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de
aanroep vraagt, dus OpenClaw vuurt het Plugin- en middlewaregedrag af dat het bezit in de
harnessadapter. Voor Codex-native tools bezit Codex het canonieke toolrecord.
OpenClaw kan geselecteerde events spiegelen, maar het kan de native Codex-
thread niet herschrijven tenzij Codex die bewerking beschikbaar stelt via app-server- of native hook-
callbacks.

Compaction en LLM-levenscyclusprojecties komen van Codex app-server-
meldingen en OpenClaw-adapterstatus, niet van native Codex-hookopdrachten.
De OpenClaw-events `before_compaction`, `after_compaction`, `llm_input` en
`llm_output` zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen
van Codex' interne aanvraag- of Compaction-payloads.

Native Codex-meldingen `hook/started` en `hook/completed` van de app-server worden
geprojecteerd als agentevents `codex_app_server.hook` voor traject en debugging.
Ze roepen geen OpenClaw Plugin-hooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex bezit meer van
de native modellus, en OpenClaw past zijn Plugin- en sessieoppervlakken
aan rond die grens.

Ondersteund in Codex runtime v1:

| Oppervlak                                    | Ondersteuning                                                                      | Waarom                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                    | Ondersteund                                                                         | De Codex app-server beheert de OpenAI-beurt, native thread-hervatting en native tool-voortzetting.                                                                                                        |
| OpenClaw-kanaalroutering en levering         | Ondersteund                                                                         | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                            |
| Dynamische OpenClaw-tools                    | Ondersteund                                                                         | Codex vraagt OpenClaw deze tools uit te voeren, zodat OpenClaw in het uitvoeringspad blijft.                                                                                                              |
| Prompt- en context-plugins                   | Ondersteund                                                                         | OpenClaw bouwt prompt-overlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                        |
| Levenscyclus van context-engine              | Ondersteund                                                                         | Assemblage, ingest of onderhoud na de beurt, en coordinatie van context-engine-compaction worden uitgevoerd voor Codex-beurten.                                                                           |
| Dynamische tool-hooks                        | Ondersteund                                                                         | `before_tool_call`, `after_tool_call` en tool-result-middleware draaien rond dynamische tools die eigendom zijn van OpenClaw.                                                                              |
| Levenscyclus-hooks                           | Ondersteund als adapterobservaties                                                  | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` worden geactiveerd met eerlijke payloads in Codex-modus.                                                                |
| Revisiepoort voor definitief antwoord        | Ondersteund via de native hook-relay                                                | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog een modelpassage voor finalisatie.                                                                              |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via de native hook-relay                                           | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor vastgelegde native tool-oppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native toestemmingsbeleid                    | Ondersteund via Codex app-server-goedkeuringen en de compatibele native hook-relay  | Goedkeuringsverzoeken van Codex app-server lopen via OpenClaw na Codex-review. De native hook-relay `PermissionRequest` is opt-in voor native goedkeuringsmodi, omdat Codex deze uitzendt voor guardian-review. |
| Trajectvastlegging van app-server            | Ondersteund                                                                         | OpenClaw registreert het verzoek dat het naar app-server heeft gestuurd en de app-server-notificaties die het ontvangt.                                                                                    |

Niet ondersteund in Codex-runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                       | Toekomstig pad                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutatie van native tool-argumenten                  | Native pre-tool-hooks van Codex kunnen blokkeren, maar OpenClaw herschrijft geen Codex-native tool-argumenten.                                  | Vereist Codex-hook/schema-ondersteuning voor vervangende tool-input.                     |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex bezit de canonieke native threadgeschiedenis. OpenClaw bezit een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native thread-chirurgie nodig is.          |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, niet Codex-native toolrecords.                                          | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning. |
| Rijke native Compaction-metadata                    | OpenClaw observeert de start en voltooiing van Compaction, maar ontvangt geen stabiele lijst van bewaarde/verwijderde items, tokendelta of samenvattingspayload. | Vereist rijkere Codex-Compaction-events.                                                  |
| Compaction-interventie                              | Huidige OpenClaw-Compaction-hooks zijn in Codex-modus op notificatieniveau.                                                                      | Voeg Codex pre/post Compaction-hooks toe als plugins native Compaction moeten vetoen of herschrijven. |
| Byte-voor-byte vastlegging van model-API-verzoek    | OpenClaw kan app-server-verzoeken en notificaties vastleggen, maar Codex core bouwt het uiteindelijke OpenAI API-verzoek intern.                | Vereist een Codex-modelverzoek-tracingevent of debug-API.                                |

## Tools, media en Compaction

De Codex-harness wijzigt alleen de laag-niveau embedded agent-executor.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van de
harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en output van messaging-tools
blijven via het normale OpenClaw-leveringspad lopen.

De native hook-relay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de Codex-native tool- en toestemmingspaden die OpenClaw test. In
de Codex-runtime omvat dat shell, patch en MCP `PreToolUse`,
`PostToolUse` en `PermissionRequest`-payloads. Ga er niet van uit dat elk toekomstig
Codex-hookevent een OpenClaw-pluginoppervlak is totdat het runtimecontract het
benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of weigeren-beslissingen
wanneer beleid beslist. Een resultaat zonder beslissing is geen toestaan. Codex behandelt het als geen
hookbeslissing en valt terug op zijn eigen guardian- of gebruikersgoedkeuringspad.
Codex app-server-goedkeuringsmodi laten deze native hook standaard weg; deze alinea
is van toepassing wanneer `permission_request` expliciet is opgenomen in
`nativeHookRelay.events` of een compatibiliteitsruntime deze installeert.
Wanneer een operator `allow-always` kiest voor een Codex-native toestemmingsverzoek,
onthoudt OpenClaw die exacte provider/sessie/tool-input/cwd-vingerafdruk voor een
begrensd sessievenster. De onthouden beslissing is bewust alleen exacte-match:
een gewijzigd commando, gewijzigde argumenten, toolpayload of cwd maakt een nieuwe
goedkeuring aan.

Goedkeuringselicitaties voor Codex MCP-tools worden via de goedkeuringsflow van OpenClaw's plugin
geleid wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex `request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende wachtrij-follow-upbericht beantwoordt dat native
serververzoek in plaats van te worden gestuurd als extra context. Andere MCP-elicitatieverzoeken
falen nog steeds gesloten.

Sturing van de actieve-run-wachtrij wordt gemapt op Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` batcht OpenClaw chatberichten in de wachtrij
voor het geconfigureerde stille venster en verzendt ze als een `turn/steer`-verzoek in
aankomstvolgorde. Legacy `queue`-modus verzendt afzonderlijke `turn/steer`-verzoeken. Codex
review- en handmatige Compaction-beurten kunnen sturing binnen dezelfde beurt weigeren; in dat geval
gebruikt OpenClaw de follow-upwachtrij wanneer de geselecteerde modus fallback toestaat. Zie
[Sturingswachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt native thread-Compaction
gedelegeerd aan Codex app-server. OpenClaw bewaart een transcriptspiegel voor kanaalgeschiedenis,
zoeken, `/new`, `/reset` en toekomstige model- of harness-wisseling. De
spiegel bevat de gebruikersprompt, definitieve assistenttekst en lichte Codex-
redeneer- of planrecords wanneer de app-server ze uitzendt. Op dit moment registreert OpenClaw alleen
native signalen voor start en voltooiing van Compaction. Het biedt nog geen
menselijk leesbare Compaction-samenvatting of een controleerbare lijst van welke items Codex
na Compaction heeft bewaard.

Omdat Codex de canonieke native thread bezit, herschrijft `tool_result_persist` momenteel geen
Codex-native toolresultaatrecords. Het is alleen van toepassing wanneer
OpenClaw een toolresultaat schrijft naar een sessietranscript dat eigendom is van OpenClaw.

Mediageneratie vereist geen PI. Afbeelding, video, muziek, PDF, TTS en media-
begrip blijven de overeenkomende provider/modelinstellingen gebruiken, zoals
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en
`messages.tts`.

## Probleemoplossing

**Codex verschijnt niet als normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model met
`agentRuntime.id: "codex"` (of een legacy `codex/*`-ref), schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan nog steeds PI gebruiken als de
compatibiliteitsbackend wanneer geen Codex-harness de run claimt. Stel
`agentRuntime.id: "codex"` in om Codex-selectie tijdens testen af te dwingen. Een
afgedwongen Codex-runtime faalt in plaats van terug te vallen op PI. Zodra Codex app-server
is geselecteerd, komen de fouten direct naar voren.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake
versie `0.125.0` of nieuwer meldt. Prereleases met dezelfde versie of buildsuffixed
versies zoals `0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat de
stabiele protocolondergrens `0.125.0` is wat OpenClaw test.

**Modelontdekking is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel ontdekking uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`,
en dat de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een legacy
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*` en andere providerrefs blijven op hun normale
providerpad in `auto`-modus. Als je `agentRuntime.id: "codex"` afdwingt, moet elke embedded
beurt voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` rapporteert, gebruik dan `/new` of `/reset`; als dit aanhoudt, herstart dan
de gateway om verouderde registraties van native hooks te wissen. Als `computer-use.list_apps`
een time-out geeft, herstart dan Codex Computer Use of Codex Desktop en probeer het opnieuw.

## Gerelateerd

- [Agent-harness-plugins](/nl/plugins/sdk-agent-harness)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
