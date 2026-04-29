---
read_when:
    - Je wilt het meegeleverde Codex-app-serverharnas gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - U wilt dat implementaties die alleen Codex gebruiken mislukken in plaats van terug te vallen op PI
summary: Voer ingebedde agentbeurten van OpenClaw uit via het gebundelde Codex-appserverharnas.
title: Codex-harnas
x-i18n:
    generated_at: "2026-04-29T23:02:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8eba5cb48c94fe38392d85c9d5c79a7829a2fa7eaba81715f4449d39d7d0dea
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex`-plugin laat OpenClaw ingebedde agent-beurten uitvoeren via de
Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex eigenaar is van de low-level agentsessie: modeldetectie, native thread hervatten, native compaction en uitvoering via de app-server. OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie, tools, goedkeuringen, media-aflevering en de zichtbare transcriptspiegel.

Als je je probeert te orienteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatievlak.

## Wat deze plugin wijzigt

De gebundelde `codex`-plugin levert meerdere afzonderlijke mogelijkheden:

| Mogelijkheid                     | Hoe je die gebruikt                                  | Wat die doet                                                                  |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingebedde runtime          | `agentRuntime.id: "codex"`                          | Voert ingebedde OpenClaw-agentbeurten uit via de Codex app-server.            |
| Native chatbesturingsopdrachten   | `/codex bind`, `/codex resume`, `/codex steer`, ... | Koppelt en bestuurt Codex app-server-threads vanuit een berichtenconversatie. |
| Codex app-server-provider/catalogus | `codex` internals, surfaced through the harness     | Laat de runtime app-servermodellen ontdekken en valideren.                    |
| Codex-pad voor mediabegrip        | `codex/*` image-model compatibility paths           | Voert begrensde Codex app-server-beurten uit voor ondersteunde modellen voor beeldbegrip. |
| Native hookrelay                  | Plugin hooks around Codex-native events             | Laat OpenClaw ondersteunde Codex-native tool-/finalisatie-events observeren/blokkeren. |

Het inschakelen van de plugin maakt die mogelijkheden beschikbaar. Het doet **niet**:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelreferenties omzetten naar de native runtime
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies hot-switchen die al een PI-runtime hebben vastgelegd
- OpenClaw-kanaalaflevering, sessiebestanden, opslag van auth-profielen of berichtroutering vervangen

Dezelfde plugin is ook eigenaar van het native `/codex`-oppervlak voor chatbesturingsopdrachten. Als de plugin is ingeschakeld en de gebruiker vraagt om Codex-threads vanuit chat te koppelen, hervatten, sturen, stoppen of inspecteren, moeten agents de voorkeur geven aan `/codex ...` boven ACP. ACP blijft de expliciete fallback wanneer de gebruiker om ACP/acpx vraagt of de ACP Codex-adapter test.

Native Codex-beurten behouden OpenClaw-pluginhooks als de publieke compatibiliteitslaag. Dit zijn in-process OpenClaw-hooks, geen Codex `hooks.json`-opdrachthooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` voor gespiegelde transcriptrecords
- `before_agent_finalize` via Codex `Stop`-relay
- `agent_end`

Plugins kunnen ook runtime-neutrale middleware voor toolresultaten registreren om dynamische OpenClaw-toolresultaten te herschrijven nadat OpenClaw de tool uitvoert en voordat het resultaat aan Codex wordt teruggegeven. Dit staat los van de publieke
`tool_result_persist`-pluginhook, die transcript-toolresultaatwrites in eigendom van OpenClaw transformeert.

Zie voor de semantiek van de pluginhooks zelf [Pluginhooks](/nl/plugins/hooks)
en [Gedrag van Plugin guard](/nl/tools/plugin).

De harness staat standaard uit. Nieuwe configuraties moeten OpenAI-modelreferenties canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` afdwingen wanneer ze native app-serveruitvoering willen. Verouderde `codex/*`-modelreferenties selecteren de harness nog steeds automatisch voor compatibiliteit, maar runtime-ondersteunde verouderde providerprefixes worden niet als normale model-/providerkeuzes getoond.

Als de `codex`-plugin is ingeschakeld maar het primaire model nog steeds
`openai-codex/*` is, waarschuwt `openclaw doctor` in plaats van de route te wijzigen. Dat is opzettelijk: `openai-codex/*` blijft het PI Codex OAuth-/abonnementspad, en native app-serveruitvoering blijft een expliciete runtimekeuze.

## Routekaart

Gebruik deze tabel voordat je configuratie wijzigt:

| Gewenst gedrag                            | Modelreferentie           | Runtimeconfiguratie                   | Pluginvereiste             | Verwacht statuslabel           |
| ----------------------------------------- | ------------------------- | ------------------------------------- | -------------------------- | ------------------------------ |
| OpenAI API via normale OpenClaw-runner    | `openai/gpt-*`            | weggelaten of `runtime: "pi"`         | OpenAI-provider            | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/abonnement via PI             | `openai-codex/gpt-*`      | weggelaten of `runtime: "pi"`         | OpenAI Codex OAuth-provider | `Runtime: OpenClaw Pi Default` |
| Native Codex app-server ingebedde beurten | `openai/gpt-*`            | `agentRuntime.id: "codex"`            | `codex`-plugin             | `Runtime: OpenAI Codex`        |
| Gemengde providers met conservatieve automatische modus | provider-specifieke referenties | `agentRuntime.id: "auto"`             | Optionele pluginruntimes    | Hangt af van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie        | afhankelijk van ACP-prompt/model | `sessions_spawn` met `runtime: "acp"` | gezonde `acpx`-backend     | ACP-taak-/sessiestatus         |

De belangrijke scheiding is provider versus runtime:

- `openai-codex/*` beantwoordt "welke provider-/auth-route moet PI gebruiken?"
- `agentRuntime.id: "codex"` beantwoordt "welke loop moet deze
  ingebedde beurt uitvoeren?"
- `/codex ...` beantwoordt "welke native Codex-conversatie moet deze chat koppelen
  of besturen?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

OpenAI-familieroutes zijn prefixspecifiek. Gebruik `openai-codex/*` wanneer je
Codex OAuth via PI wilt; gebruik `openai/*` wanneer je directe OpenAI API-toegang wilt of wanneer je de native Codex app-server-harness afdwingt:

| Modelreferentie                             | Runtimepad                                  | Gebruik wanneer                                                            |
| ------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | OpenAI-provider via OpenClaw/PI-plumbing    | Je huidige directe toegang tot de OpenAI Platform API wilt met `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | OpenAI Codex OAuth via OpenClaw/PI          | Je ChatGPT/Codex-abonnementsauthenticatie wilt met de standaard PI-runner.  |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server-harness                  | Je native Codex app-serveruitvoering wilt voor de ingebedde agentbeurt.     |

GPT-5.5 is momenteel alleen beschikbaar via abonnement/OAuth in OpenClaw. Gebruik
`openai-codex/gpt-5.5` voor PI OAuth, of `openai/gpt-5.5` met de Codex
app-server-harness. Directe API-sleuteltoegang voor `openai/gpt-5.5` wordt ondersteund zodra OpenAI GPT-5.5 op de publieke API inschakelt.

Verouderde `codex/gpt-*`-referenties blijven geaccepteerd als compatibiliteitsaliassen. Doctor-compatibiliteitsmigratie herschrijft verouderde primaire runtimereferenties naar canonieke modelreferenties en legt het runtimebeleid afzonderlijk vast, terwijl fallback-only verouderde referenties ongewijzigd blijven omdat runtime voor de hele agentcontainer wordt geconfigureerd. Nieuwe PI Codex OAuth-configuraties moeten `openai-codex/gpt-*` gebruiken; nieuwe native app-server-harnessconfiguraties moeten `openai/gpt-*` plus
`agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai-codex/gpt-*` wanneer beeldbegrip via het OpenAI Codex OAuth-providerpad moet lopen. Gebruik `codex/gpt-*` wanneer beeldbegrip via een begrensde Codex app-server-beurt moet lopen. Het Codex app-servermodel moet ondersteuning voor beeldinvoer adverteren; Codex-modellen met alleen tekst falen voordat de mediabeurt start.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen. Als de selectie verrassend is, schakel debuglogging in voor het subsysteem `agents/harness` en inspecteer het gestructureerde `agent harness selected`-record van de gateway. Het bevat de geselecteerde harness-id, selectiereden, runtime-/fallbackbeleid en, in `auto`-modus, het ondersteuningsresultaat van elke pluginkandidaat.

### Wat doctor-waarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer al het volgende waar is:

- de gebundelde `codex`-plugin is ingeschakeld of toegestaan
- het primaire model van een agent is `openai-codex/*`
- de effectieve runtime van die agent is niet `codex`

Die waarschuwing bestaat omdat gebruikers vaak verwachten dat "Codex-plugin ingeschakeld" impliceert "native Codex app-server-runtime." OpenClaw maakt die sprong niet. De waarschuwing betekent:

- **Er is geen wijziging vereist** als je ChatGPT/Codex OAuth via PI bedoelde.
- Wijzig het model naar `openai/<model>` en stel
  `agentRuntime.id: "codex"` in als je native app-serveruitvoering bedoelde.
- Bestaande sessies hebben na een runtimewijziging nog steeds `/new` of `/reset` nodig,
  omdat sessieruntimepins sticky zijn.

Harnessselectie is geen live sessiebesturing. Wanneer een ingebedde beurt draait,
legt OpenClaw de geselecteerde harness-id vast op die sessie en blijft die gebruiken voor latere beurten in dezelfde sessie-id. Wijzig de `agentRuntime`-configuratie of
`OPENCLAW_AGENT_RUNTIME` wanneer je toekomstige sessies een andere harness wilt laten gebruiken; gebruik `/new` of `/reset` om een nieuwe sessie te starten voordat je een bestaande conversatie tussen PI en Codex wisselt. Dit voorkomt dat een transcript via twee incompatibele native sessiesystemen wordt afgespeeld.

Verouderde sessies die zijn gemaakt voordat harnesspins bestonden, worden als PI-gepind behandeld zodra ze transcriptgeschiedenis hebben. Gebruik `/new` of `/reset` om die conversatie na een configuratiewijziging voor Codex te kiezen.

`/status` toont de effectieve modelruntime. De standaard PI-harness verschijnt als
`Runtime: OpenClaw Pi Default`, en de Codex app-server-harness verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de gebundelde `codex`-plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De gebundelde plugin beheert standaard een compatibele Codex app-server-binary, dus lokale `codex`-opdrachten op `PATH` hebben geen invloed op normale harnessstart.
- Codex-authenticatie beschikbaar voor het app-serverproces of voor OpenClaw's Codex-authenticatiebridge.

De plugin blokkeert oudere of ongetagde app-server-handshakes. Dat houdt OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt authenticatie meestal uit het Codex CLI-account
of een OpenClaw `openai-codex`-auth-profiel. Lokale stdio app-serverstarts kunnen ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Minimale configuratie

Gebruik `openai/gpt-5.5`, schakel de gebundelde plugin in en dwing de `codex`-harness af:

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
`codex/<model>` schakelen de gebundelde `codex`-plugin nog steeds automatisch in. Nieuwe configuraties moeten de voorkeur geven aan `openai/<model>` plus de expliciete `agentRuntime`-vermelding hierboven.

## Codex naast andere modellen toevoegen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen schakelen tussen Codex- en niet-Codex-providermodellen. Een afgedwongen runtime geldt voor elke ingebedde beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl die runtime is afgedwongen, probeert OpenClaw nog steeds de Codex-harness en faalt gesloten in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Plaats Codex op een speciale agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en Pi-fallback voor normaal gemengd
  providergebruik.
- Gebruik verouderde `codex/*`-refs alleen voor compatibiliteit. Nieuwe configuraties moeten de voorkeur geven aan
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

- De standaardagent `main` gebruikt het normale providerpad en Pi-compatibiliteitsfallback.
- De agent `codex` gebruikt de Codex-app-server-harness.
- Als Codex ontbreekt of niet wordt ondersteund voor de agent `codex`, mislukt de beurt
  in plaats van stilletjes Pi te gebruiken.

## Routering van agentopdrachten

Agents moeten gebruikersverzoeken routeren op intentie, niet alleen op het woord "Codex":

| Gebruiker vraagt om...                                  | Agent moet gebruiken...                           |
| ------------------------------------------------------- | ------------------------------------------------- |
| "Bind deze chat aan Codex"                              | `/codex bind`                                     |
| "Hervat Codex-thread `<id>` hier"                       | `/codex resume <id>`                              |
| "Toon Codex-threads"                                   | `/codex threads`                                  |
| "Dien een supportrapport in voor een slechte Codex-run" | `/diagnostics [note]`                             |
| "Stuur alleen Codex-feedback voor deze bijgevoegde thread" | `/codex diagnostics [note]`                    |
| "Gebruik Codex als runtime voor deze agent"             | configuratiewijziging naar `agentRuntime.id`      |
| "Gebruik mijn ChatGPT/Codex-abonnement met normale OpenClaw" | `openai-codex/*`-modelrefs                   |
| "Voer Codex uit via ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`     |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en geen native subagenten |

OpenClaw adverteert ACP-spawnrichtlijnen alleen aan agents wanneer ACP is ingeschakeld,
dispatchbaar is en wordt ondersteund door een geladen runtimebackend. Als ACP niet beschikbaar is,
mogen de systeemprompt en Plugin Skills de agent geen ACP-routering aanleren.

## Alleen-Codex-deployments

Forceer de Codex-harness wanneer je moet bewijzen dat elke ingebedde agentbeurt
Codex gebruikt. Expliciete Plugin-runtimes hebben standaard geen Pi-fallback, dus
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

Omgevingsoverschrijving:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wanneer Codex is geforceerd, faalt OpenClaw vroeg als de Codex-Plugin is uitgeschakeld, de
app-server te oud is, of de app-server niet kan starten. Stel
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` alleen in als je bewust wilt dat Pi
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

Gebruik normale sessieopdrachten om agents en modellen te wisselen. `/new` maakt een nieuwe
OpenClaw-sessie en de Codex-harness maakt of hervat indien nodig zijn sidecar-app-server-thread. `/reset` wist de OpenClaw-sessiebinding voor die thread
en laat de volgende beurt de harness opnieuw bepalen vanuit de huidige configuratie.

## Modeldetectie

Standaard vraagt de Codex-Plugin de app-server om beschikbare modellen. Als
detectie mislukt of een time-out krijgt, gebruikt deze een gebundelde fallbackcatalogus voor:

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

Schakel detectie uit wanneer je wilt dat opstarten Codex niet onderzoekt en bij de
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

Standaard start de Plugin de door OpenClaw beheerde Codex-binary lokaal met:

```bash
codex app-server --listen stdio://
```

De beheerde binary is gedeclareerd als een gebundelde Plugin-runtimeafhankelijkheid en wordt staged
met de rest van de `codex`-Plugin-afhankelijkheden. Dit houdt de app-serverversie
gekoppeld aan de gebundelde Plugin in plaats van aan welke afzonderlijke Codex-CLI
toevallig lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer je
bewust een ander uitvoerbaar bestand wilt uitvoeren.

Standaard start OpenClaw lokale Codex-harness-sessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt
voor autonome Heartbeats: Codex kan shell- en netwerktools gebruiken zonder
te stoppen op native goedkeuringsprompts die niemand kan beantwoorden.

Als je wilt kiezen voor door Codex-guardian beoordeelde goedkeuringen, stel je `appServer.mode:
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

Guardian-modus gebruikt het native auto-review-goedkeuringspad van Codex. Wanneer Codex vraagt om
de sandbox te verlaten, buiten de workspace te schrijven, of rechten zoals netwerktoegang
toe te voegen, routeert Codex dat goedkeuringsverzoek naar de native reviewer in plaats van een
menselijke prompt. De reviewer past het risicokader van Codex toe en keurt het specifieke
verzoek goed of af. Gebruik Guardian wanneer je meer vangrails wilt dan YOLO-modus
maar nog steeds onbemande agents nodig hebt die voortgang boeken.

De preset `guardian` wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"`.
Afzonderlijke beleidsvelden overschrijven `mode` nog steeds, zodat geavanceerde deployments de
preset kunnen combineren met expliciete keuzes. De oudere reviewerwaarde `guardian_subagent` wordt
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
maar OpenClaw beheert de Codex-app-server-accountbridge. Auth wordt in deze
volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authprofiel voor de agent.
2. Het bestaande account van de app-server, zoals een lokale Codex-CLI ChatGPT-aanmelding.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-auth nog steeds vereist is.

Wanneer OpenClaw een ChatGPT-abonnementstijl Codex-authprofiel ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Dat
houdt API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex-app-serverbeurten per ongeluk via de API worden gefactureerd.
Expliciete Codex-API-sleutelprofielen en lokale stdio-env-key-fallback gebruiken app-serverlogin
in plaats van geërfde childprocess-env. WebSocket-app-serververbindingen
ontvangen geen Gateway env API-key fallback; gebruik een expliciet authprofiel of het
eigen account van de externe app-server.

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

`appServer.clearEnv` beïnvloedt alleen het gespawnde Codex-app-server-childproces.

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                             |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                      |
| `command`           | beheerde Codex-binary                    | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om de beheerde binary te gebruiken; stel het alleen in voor een expliciete override. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                      |
| `url`               | niet ingesteld                           | WebSocket-app-server-URL.                                                                                                             |
| `authToken`         | niet ingesteld                           | Bearer-token voor WebSocket-transport.                                                                                                |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                              |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die uit het gestarte stdio-app-serverproces worden verwijderd nadat OpenClaw de geerfde omgeving heeft opgebouwd. |
| `requestTimeoutMs`  | `60000`                                  | Timeout voor control-plane-aanroepen naar app-server.                                                                                 |
| `mode`              | `"yolo"`                                 | Preset voor YOLO- of door guardian beoordeelde uitvoering.                                                                            |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread start/resume/turn wordt gestuurd.                                                     |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread start/resume wordt gestuurd.                                                                |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een legacy-alias.         |
| `serviceTier`       | niet ingesteld                           | Optionele Codex-app-server-servicelaag: `"fast"`, `"flex"` of `null`. Ongeldige legacy-waarden worden genegeerd.                    |

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk van
`appServer.requestTimeoutMs` begrensd: elk Codex-`item/tool/call`-verzoek moet
binnen 30 seconden een OpenClaw-reactie ontvangen. Bij een timeout breekt
OpenClaw het toolsignaal af waar dat wordt ondersteund en retourneert het een
mislukte dynamic-tool-reactie naar Codex, zodat de turn kan doorgaan in plaats
van de sessie in `processing` achter te laten.

Nadat OpenClaw heeft gereageerd op een turn-scoped app-server-verzoek van
Codex, verwacht de harness ook dat Codex de native turn afrondt met
`turn/completed`. Als de app-server daarna 60 seconden stil blijft, onderbreekt
OpenClaw best-effort de Codex-turn, registreert het een diagnostische timeout en
geeft het de OpenClaw-sessielane vrij zodat vervolgbberichten in de chat niet
achter een verouderde native turn in de wachtrij blijven staan.

Omgevings-override blijven beschikbaar voor lokaal testen:

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
heeft de voorkeur voor herhaalbare deployments omdat het Plugin-gedrag in
hetzelfde beoordeelde bestand blijft als de rest van de Codex-harnessconfiguratie.

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiegids:
[Codex-computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw levert de desktop-control-app niet mee en voert zelf
geen desktopacties uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is en laat Codex vervolgens de native
MCP-toolaanroepen afhandelen tijdens turns in Codex-modus.

Voor directe TryCua-driver toegang buiten de Codex-marketplaceflow registreer je
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
        fallback: "none",
      },
    },
  },
}
```

De installatie kan worden gecontroleerd of geïnstalleerd vanaf het command-oppervlak:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computergebruik is macOS-specifiek en kan lokale OS-machtigingen vereisen
voordat de Codex MCP-server apps kan bedienen. Als `computerUse.enabled` true is
en de MCP-server niet beschikbaar is, mislukken turns in Codex-modus voordat de
thread start in plaats van stilzwijgend zonder de native Computergebruik-tools te
draaien. Zie [Codex-computergebruik](/nl/plugins/codex-computer-use) voor
marketplacekeuzes, limieten van de externe catalogus, statusredenen en
probleemoplossing.

Wanneer `computerUse.autoInstall` true is, kan OpenClaw de standaard gebundelde
Codex Desktop-marketplace registreren vanaf
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marketplace heeft ontdekt. Gebruik `/new` of `/reset` nadat je
runtime- of Computergebruik-configuratie hebt gewijzigd, zodat bestaande sessies
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

Modelwisselen blijft door OpenClaw beheerd. Wanneer een OpenClaw-sessie aan een
bestaande Codex-thread is gekoppeld, stuurt de volgende turn het momenteel
geselecteerde OpenAI-model, de provider, het goedkeuringsbeleid, de sandbox en
de servicelaag opnieuw naar app-server. Wisselen van `openai/gpt-5.5` naar
`openai/gpt-5.2` behoudt de threadbinding maar vraagt Codex om door te gaan met
het nieuw geselecteerde model.

## Codex-opdracht

De gebundelde Plugin registreert `/codex` als een geautoriseerde slash-opdracht.
Deze is generiek en werkt op elk kanaal dat OpenClaw-tekstopdrachten ondersteunt.

Veelgebruikte vormen:

- `/codex status` toont live app-server-connectiviteit, modellen, account, ratelimits, MCP-servers en skills.
- `/codex models` toont live Codex-app-servermodellen.
- `/codex threads [filter]` toont recente Codex-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te comprimeren.
- `/codex review` start een native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt toestemming voordat Codex-diagnostische feedback voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computergebruik-Plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computergebruik-Plugin en herlaadt MCP-servers.
- `/codex account` toont account- en ratelimitstatus.
- `/codex mcp` toont de MCP-serverstatus van Codex app-server.
- `/codex skills` toont Codex app-server-Skills.

### Veelgebruikte debugworkflow

Wanneer een door Codex ondersteunde agent iets verrassends doet in Telegram,
Discord, Slack of een ander kanaal, begin dan met het gesprek waarin het probleem
optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit of een andere korte notitie
   die beschrijft wat je zag.
2. Keur het diagnostiekverzoek eenmalig goed. De goedkeuring maakt de lokale
   Gateway-diagnostiekzip en stuurt, omdat de sessie de Codex-harness gebruikt,
   ook de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostiekantwoord naar het bugrapport of de supportthread.
   Het bevat het lokale bundelpad, de privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een regel `Inspect locally` voor elke Codex-thread.
4. Als je de run zelf wilt debuggen, voer je de afgedrukte `Inspect locally`-
   opdracht uit in een terminal. Deze ziet eruit als `codex resume <thread-id>` en opent de
   native Codex-thread zodat je het gesprek kunt inspecteren, lokaal kunt voortzetten
   of Codex kunt vragen waarom het een bepaalde tool of bepaald plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige
OpenClaw Gateway-diagnostiekbundel. Voor de meeste supportrapporten is
`/diagnostics [note]` het betere startpunt, omdat het de lokale Gateway-status en
Codex-thread-id's in één antwoord aan elkaar koppelt. Zie [Diagnostiekexport](/nl/gateway/diagnostics)
voor het volledige privacymodel en gedrag in groepschats.

Core OpenClaw biedt ook owner-only `/diagnostics [note]` aan als de algemene
Gateway-diagnostiekopdracht. De goedkeuringsprompt toont de preambule over
gevoelige gegevens, linkt naar [Diagnostiekexport](/nl/gateway/diagnostics) en
vraagt elke keer `openclaw gateway diagnostics export --json` aan via expliciete
exec-goedkeuring. Keur diagnostiek niet goed met een allow-all-regel. Na
goedkeuring stuurt OpenClaw een plakbaar rapport met het lokale bundelpad en de
manifestsamenvatting. Wanneer de actieve OpenClaw-sessie de Codex-harness
gebruikt, autoriseert diezelfde goedkeuring ook het verzenden van de relevante
Codex-feedbackbundels naar OpenAI-servers. De goedkeuringsprompt vermeldt dat
Codex-feedback wordt verzonden, maar toont vóór goedkeuring geen Codex-sessie- of
thread-id's.

Als `/diagnostics` door een owner in een groepschat wordt aangeroepen, houdt
OpenClaw het gedeelde kanaal schoon: de groep ontvangt alleen een korte melding,
terwijl de diagnostiekpreambule, goedkeuringsprompts en Codex-sessie-/thread-id's
via de privégoedkeuringsroute naar de owner worden gestuurd. Als er geen
privéroute naar de owner is, weigert OpenClaw het groepsverzoek en vraagt het de
owner om het vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept Codex app-server `feedback/upload` aan en vraagt
app-server om logs op te nemen voor elke vermelde thread en voortgebrachte Codex-subthreads
wanneer beschikbaar. De upload loopt via Codex' normale feedbackpad naar OpenAI-
servers; als Codex-feedback in die app-server is uitgeschakeld, retourneert de opdracht
de app-serverfout. Het voltooide diagnoseantwoord vermeldt de kanalen,
OpenClaw-sessie-id's, Codex-thread-id's en lokale `codex resume <thread-id>`-
opdrachten voor de threads die zijn verzonden. Als je de goedkeuring weigert of negeert,
drukt OpenClaw die Codex-id's niet af. Deze upload vervangt de lokale
Gateway-diagnose-export niet.

`/codex resume` schrijft hetzelfde sidecar-koppelingsbestand dat de harness gebruikt voor
normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread, geeft het
momenteel geselecteerde OpenClaw-model door aan app-server en houdt uitgebreide geschiedenis
ingeschakeld.

### Een Codex-thread vanuit de CLI inspecteren

De snelste manier om een slechte Codex-run te begrijpen, is vaak om de native Codex-
thread rechtstreeks te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug opmerkt in een kanaalgesprek en de
problematische Codex-sessie wilt inspecteren, lokaal wilt voortzetten of Codex wilt vragen waarom het een
bepaalde tool- of redeneerkeuze heeft gemaakt. Het eenvoudigste pad is meestal eerst
`/diagnostics [note]` uitvoeren: nadat je dit hebt goedgekeurd, vermeldt het voltooide rapport
elke Codex-thread en drukt het een `Inspect locally`-opdracht af, bijvoorbeeld
`codex resume <thread-id>`. Je kunt die opdracht rechtstreeks naar een terminal kopiëren.

Je kunt ook een thread-id ophalen uit `/codex binding` voor de huidige chat of
`/codex threads [filter]` voor recente Codex app-server-threads, en vervolgens dezelfde
`codex resume`-opdracht in je shell uitvoeren.

Het opdrachtoppervlak vereist Codex app-server `0.125.0` of nieuwer. Afzonderlijke
controlemethoden worden gerapporteerd als `unsupported by this Codex app-server` als een
toekomstige of aangepaste app-server die JSON-RPC-methode niet beschikbaar stelt.

## Hook-grenzen

De Codex-harness heeft drie hook-lagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-pluginhooks                  | OpenClaw                 | Product-/plugincompatibiliteit tussen PI- en Codex-harnesses.       |
| Codex app-server-extensiemiddleware   | Gebundelde OpenClaw-plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.          |
| Native Codex-hooks                    | Codex                    | Low-level Codex-levenscyclus en native toolbeleid uit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex `hooks.json`-bestanden om
OpenClaw-plugin gedrag te routeren. Voor de ondersteunde native tool- en permissiebrug
injecteert OpenClaw per thread Codex-configuratie voor `PreToolUse`, `PostToolUse`,
`PermissionRequest` en `Stop`. Andere Codex-hooks zoals `SessionStart` en
`UserPromptSubmit` blijven Codex-level controles; ze worden in het v1-contract niet als
OpenClaw-pluginhooks beschikbaar gesteld.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de
aanroep vraagt, dus activeert OpenClaw het plugin- en middlewaregedrag dat het bezit in de
harness-adapter. Voor Codex-native tools bezit Codex het canonieke toolrecord.
OpenClaw kan geselecteerde gebeurtenissen spiegelen, maar kan de native Codex-
thread niet herschrijven tenzij Codex die operatie via app-server of native hook-
callbacks beschikbaar stelt.

Compaction- en LLM-levenscyclusprojecties komen uit Codex app-server-
meldingen en OpenClaw-adapterstatus, niet uit native Codex-hookopdrachten.
OpenClaw's `before_compaction`, `after_compaction`, `llm_input` en
`llm_output`-gebeurtenissen zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen
van Codex' interne verzoek- of Compaction-payloads.

Codex native `hook/started`- en `hook/completed` app-server-meldingen worden
geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor traject en debugging.
Ze roepen geen OpenClaw-pluginhooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex bezit meer van
de native modellus, en OpenClaw past zijn plugin- en sessieoppervlakken
rond die grens aan.

Ondersteund in Codex runtime v1:

| Oppervlak                                     | Ondersteuning                          | Waarom                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                     | Ondersteund                            | Codex app-server bezit de OpenAI-beurt, native threadhervatting en native toolvoortzetting.                                                                                                           |
| OpenClaw-kanaalroutering en -levering         | Ondersteund                            | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                        |
| Dynamische OpenClaw-tools                     | Ondersteund                            | Codex vraagt OpenClaw om deze tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.                                                                                                         |
| Prompt- en contextplugins                     | Ondersteund                            | OpenClaw bouwt prompt-overlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                    |
| Levenscyclus van contextengine                | Ondersteund                            | Assemble, ingest of onderhoud na de beurt, en coördinatie van contextengine-Compaction lopen voor Codex-beurten.                                                                                      |
| Dynamische toolhooks                          | Ondersteund                            | `before_tool_call`, `after_tool_call` en toolresultaatmiddleware draaien rond dynamische tools die eigendom zijn van OpenClaw.                                                                         |
| Levenscyclus-hooks                            | Ondersteund als adapterobservaties     | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` worden geactiveerd met eerlijke Codex-modus-payloads.                                                               |
| Revisiepoort voor eindantwoord                | Ondersteund via de native hookrelay    | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog een modelpassage vóór finalisatie.                                                                         |
| Native shell-, patch- en MCP-blokkering of -observatie | Ondersteund via de native hookrelay | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor vastgelegde native tooloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native permissiebeleid                        | Ondersteund via de native hookrelay    | Codex `PermissionRequest` kan via OpenClaw-beleid worden gerouteerd waar de runtime dit beschikbaar stelt. Als OpenClaw geen beslissing teruggeeft, gaat Codex door via zijn normale guardian- of gebruikersgoedkeuringspad. |
| Vastlegging van app-server-traject            | Ondersteund                            | OpenClaw registreert het verzoek dat het naar app-server heeft verzonden en de app-servermeldingen die het ontvangt.                                                                                  |

Niet ondersteund in Codex runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                          | Toekomstig pad                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Mutatie van native toolargumenten                   | Codex native pre-toolhooks kunnen blokkeren, maar OpenClaw herschrijft Codex-native toolargumenten niet.                                         | Vereist Codex-hook-/schemaondersteuning voor vervangende toolinvoer.                     |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex bezit de canonieke native threadgeschiedenis. OpenClaw bezit een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadchirurgie nodig is.          |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die eigendom zijn van OpenClaw, niet Codex-native toolrecords.                                           | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning. |
| Rijke native Compaction-metadata                    | OpenClaw observeert start en voltooiing van Compaction, maar ontvangt geen stabiele bewaarde/verwijderde lijst, token-delta of samenvattingspayload. | Vereist rijkere Codex-Compaction-gebeurtenissen.                                        |
| Compaction-interventie                             | Huidige OpenClaw-Compaction-hooks zijn op meldingsniveau in Codex-modus.                                                                         | Voeg Codex pre-/post-Compaction-hooks toe als plugins native Compaction moeten kunnen vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-verzoek    | OpenClaw kan app-serververzoeken en meldingen vastleggen, maar Codex core bouwt intern het uiteindelijke OpenAI API-verzoek.                    | Vereist een Codex model-request tracing-gebeurtenis of debug-API.                       |

## Tools, media en Compaction

De Codex-harness wijzigt alleen de low-level ingebedde agentexecutor.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van de
harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en messaging-tooluitvoer
blijven via het normale OpenClaw-leveringspad lopen.

De native hookrelay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de Codex-native tool- en permissiepaden die OpenClaw test. In
de Codex-runtime omvat dat shell-, patch- en MCP-`PreToolUse`,
`PostToolUse`- en `PermissionRequest`-payloads. Ga er niet van uit dat elke toekomstige
Codex-hookgebeurtenis een OpenClaw-pluginoppervlak is totdat het runtimecontract dit
benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete allow- of deny-beslissingen
wanneer beleid beslist. Een resultaat zonder beslissing is geen allow. Codex behandelt dit als geen
hookbeslissing en valt terug op zijn eigen guardian- of gebruikersgoedkeuringspad.

Codex MCP-toolgoedkeuringsverzoeken worden via OpenClaw's plugin-
goedkeuringsflow gerouteerd wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex `request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende in de wachtrij geplaatste opvolgbericht beantwoordt dat native
serververzoek in plaats van als extra context te worden gestuurd. Andere MCP-elicitatie-
verzoeken falen nog steeds gesloten.

Wanneer het geselecteerde model het Codex-harnas gebruikt, wordt native thread-compaction
gedelegeerd aan Codex app-server. OpenClaw bewaart een transcriptspiegel voor kanaalgeschiedenis,
zoeken, `/new`, `/reset` en toekomstige model- of harnaswisselingen. De
spiegel bevat de gebruikersprompt, de uiteindelijke assistenttekst en lichte Codex-
redeneer- of planrecords wanneer de app-server die uitstuurt. Op dit moment registreert OpenClaw alleen
start- en voltooiingssignalen voor native compaction. Het stelt nog geen
menselijk leesbare compaction-samenvatting of controleerbare lijst beschikbaar van welke items Codex
na compaction heeft bewaard.

Omdat Codex eigenaar is van de canonieke native thread, herschrijft `tool_result_persist` momenteel
geen Codex-native toolresultaatrecords. Het is alleen van toepassing wanneer
OpenClaw een toolresultaat naar een OpenClaw-eigen sessietranscript schrijft.

Mediageneratie vereist geen PI. Afbeeldingen, video, muziek, PDF, TTS en mediabegrip
blijven de bijpassende provider-/modelinstellingen gebruiken, zoals
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en
`messages.tts`.

## Problemen oplossen

**Codex verschijnt niet als normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model met
`agentRuntime.id: "codex"` (of een verouderde `codex/*`-ref), schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow` `codex`
uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan nog steeds PI gebruiken als
compatibiliteitsbackend wanneer geen Codex-harnas de run claimt. Stel
`agentRuntime.id: "codex"` in om Codex-selectie tijdens het testen af te dwingen. Een
afgedwongen Codex-runtime faalt nu in plaats van terug te vallen op PI, tenzij je
expliciet `agentRuntime.fallback: "pi"` instelt. Zodra Codex app-server is
geselecteerd, komen de fouten daarvan direct naar voren zonder extra fallback-configuratie.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake
versie `0.125.0` of nieuwer rapporteert. Prereleases met dezelfde versie of versies met een build-suffix,
zoals `0.125.0-alpha.2` of `0.125.0+custom`, worden geweigerd omdat de
stabiele `0.125.0`-protocolondergrens is wat OpenClaw test.

**Modeldetectie is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel detectie uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`
en of de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht, tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een verouderde
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven in `auto`-modus op hun normale
providerpad. Als je `agentRuntime.id: "codex"` afdwingt, moet elke ingesloten
turn voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd, maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` rapporteert, gebruik dan `/new` of `/reset`; als dit aanhoudt, herstart dan
de Gateway om verouderde native hook-registraties te wissen. Als `computer-use.list_apps`
een time-out krijgt, herstart Codex Computer Use of Codex Desktop en probeer het opnieuw.

## Gerelateerd

- [Agent-harnas-plugins](/nl/plugins/sdk-agent-harness)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin-hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
