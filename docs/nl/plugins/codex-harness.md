---
read_when:
    - Je wilt de meegeleverde Codex app-server-harness gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat implementaties die alleen Codex gebruiken falen in plaats van terug te vallen op PI
summary: Voer ingebedde agentbeurten van OpenClaw uit via de meegeleverde Codex app-server-harness
title: Codex-harnas
x-i18n:
    generated_at: "2026-04-30T09:37:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex` Plugin laat OpenClaw ingebedde agentbeurten uitvoeren via de
Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik dit wanneer je wilt dat Codex de laag-niveau agentsessie beheert:
modeldetectie, native threadhervatting, native Compaction en uitvoering via de
app-server. OpenClaw blijft eigenaar van chatkanalen, sessiebestanden,
modelselectie, tools, goedkeuringen, medialevering en de zichtbare
transcriptspiegel.

Als je je probeert te oriënteren, begin dan met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelref, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Wat deze Plugin verandert

De gebundelde `codex` Plugin levert verschillende afzonderlijke mogelijkheden:

| Mogelijkheid                     | Hoe je die gebruikt                                | Wat het doet                                                                  |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native ingebedde runtime         | `agentRuntime.id: "codex"`                         | Voert OpenClaw ingebedde agentbeurten uit via Codex app-server.               |
| Native chatbesturingsopdrachten  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Koppelt en bestuurt Codex app-server-threads vanuit een berichtenconversatie. |
| Codex app-server-provider/catalogus | `codex` internals, zichtbaar via de harness      | Laat de runtime app-servermodellen ontdekken en valideren.                    |
| Pad voor Codex-mediabegrip       | `codex/*` compatibiliteitspaden voor afbeeldingsmodellen | Voert begrensde Codex app-serverbeurten uit voor ondersteunde modellen voor afbeeldingsbegrip. |
| Native hookrelay                 | Plugin hooks rond Codex-native gebeurtenissen      | Laat OpenClaw ondersteunde Codex-native tool-/finalisatiegebeurtenissen observeren/blokkeren. |

Het inschakelen van de Plugin maakt die mogelijkheden beschikbaar. Het doet **niet** het volgende:

- Codex gaan gebruiken voor elk OpenAI-model
- `openai-codex/*`-modelrefs omzetten naar de native runtime
- ACP/acpx het standaard Codex-pad maken
- bestaande sessies die al een PI-runtime hebben vastgelegd hot-switchen
- OpenClaw-kanaallevering, sessiebestanden, opslag van auth-profielen of
  berichtroutering vervangen

Dezelfde Plugin is ook eigenaar van het native `/codex`-chatbesturingsoppervlak. Als
de Plugin is ingeschakeld en de gebruiker vraagt om Codex-threads vanuit chat te
koppelen, hervatten, sturen, stoppen of inspecteren, moeten agents de voorkeur geven
aan `/codex ...` boven ACP. ACP blijft de expliciete fallback wanneer de gebruiker
om ACP/acpx vraagt of de ACP Codex-adapter test.

Native Codex-beurten behouden OpenClaw Plugin hooks als de openbare compatibiliteitslaag.
Dit zijn in-process OpenClaw-hooks, geen Codex `hooks.json`-opdrachthooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` voor gespiegeld transcriptrecords
- `before_agent_finalize` via Codex `Stop`-relay
- `agent_end`

Plugins kunnen ook runtime-neutrale middleware voor toolresultaten registreren om
OpenClaw dynamische toolresultaten te herschrijven nadat OpenClaw de tool heeft
uitgevoerd en voordat het resultaat aan Codex wordt teruggegeven. Dit staat los van
de openbare `tool_result_persist` Plugin hook, die transcript-toolresultaatschrijfacties
transformeert waarvan OpenClaw eigenaar is.

Zie voor de semantiek van de Plugin hooks zelf [Plugin hooks](/nl/plugins/hooks)
en [Gedrag van Plugin guards](/nl/tools/plugin).

De harness staat standaard uit. Nieuwe configuraties moeten OpenAI-modelrefs
canoniek houden als `openai/gpt-*` en expliciet
`agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex` afdwingen wanneer ze
native app-serveruitvoering willen. Verouderde `codex/*`-modelrefs selecteren de
harness nog steeds automatisch voor compatibiliteit, maar runtime-ondersteunde
verouderde providerprefixen worden niet getoond als normale model-/providerkeuzes.

Als de `codex` Plugin is ingeschakeld maar het primaire model nog steeds
`openai-codex/*` is, waarschuwt `openclaw doctor` in plaats van de route te wijzigen. Dat is
opzettelijk: `openai-codex/*` blijft het PI Codex OAuth-/abonnementspad, en
native app-serveruitvoering blijft een expliciete runtimekeuze.

## Routekaart

Gebruik deze tabel voordat je configuratie wijzigt:

| Gewenst gedrag                             | Modelref                   | Runtimeconfiguratie                  | Plugin-vereiste             | Verwacht statuslabel           |
| ------------------------------------------ | -------------------------- | ------------------------------------ | --------------------------- | ------------------------------ |
| OpenAI API via normale OpenClaw-runner     | `openai/gpt-*`             | weggelaten of `runtime: "pi"`        | OpenAI-provider             | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/abonnement via PI              | `openai-codex/gpt-*`       | weggelaten of `runtime: "pi"`        | OpenAI Codex OAuth-provider | `Runtime: OpenClaw Pi Default` |
| Native ingebedde beurten via Codex app-server | `openai/gpt-*`          | `agentRuntime.id: "codex"`           | `codex` Plugin              | `Runtime: OpenAI Codex`        |
| Gemengde providers met conservatieve automatische modus | providerspecifieke refs | `agentRuntime.id: "auto"` | Optionele Plugin-runtimes    | Hangt af van geselecteerde runtime |
| Expliciete Codex ACP-adaptersessie         | afhankelijk van ACP-prompt/model | `sessions_spawn` met `runtime: "acp"` | gezonde `acpx`-backend | ACP-taak-/sessiestatus         |

De belangrijke scheiding is provider versus runtime:

- `openai-codex/*` beantwoordt "welke provider-/auth-route moet PI gebruiken?"
- `agentRuntime.id: "codex"` beantwoordt "welke loop moet deze
  ingebedde beurt uitvoeren?"
- `/codex ...` beantwoordt "welke native Codex-conversatie moet deze chat
  koppelen of besturen?"
- ACP beantwoordt "welk extern harnessproces moet acpx starten?"

## Kies de juiste modelprefix

OpenAI-familieroutes zijn prefixspecifiek. Gebruik `openai-codex/*` wanneer je
Codex OAuth via PI wilt; gebruik `openai/*` wanneer je directe OpenAI API-toegang wilt of
wanneer je de native Codex app-server-harness afdwingt:

| Modelref                                      | Runtimepad                                  | Gebruik wanneer                                                            |
| --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-provider via OpenClaw/PI-plumbing    | Je huidige directe OpenAI Platform API-toegang met `OPENAI_API_KEY` wilt.  |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth via OpenClaw/PI          | Je ChatGPT/Codex-abonnementsauth met de standaard PI-runner wilt.          |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server-harness                    | Je native Codex app-serveruitvoering voor de ingebedde agentbeurt wilt.    |

GPT-5.5 is momenteel in OpenClaw alleen beschikbaar via abonnement/OAuth. Gebruik
`openai-codex/gpt-5.5` voor PI OAuth, of `openai/gpt-5.5` met de Codex
app-server-harness. Directe API-sleuteltoegang voor `openai/gpt-5.5` wordt ondersteund
zodra OpenAI GPT-5.5 op de openbare API inschakelt.

Verouderde `codex/gpt-*`-refs blijven geaccepteerd als compatibiliteitsaliassen. Doctor
compatibiliteitsmigratie herschrijft verouderde primaire runtimerefs naar canonieke modelrefs
en registreert het runtimebeleid afzonderlijk, terwijl verouderde refs die alleen als fallback dienen
ongewijzigd blijven omdat runtime voor de hele agentcontainer wordt geconfigureerd.
Nieuwe PI Codex OAuth-configuraties moeten `openai-codex/gpt-*` gebruiken; nieuwe native
app-server-harnessconfiguraties moeten `openai/gpt-*` plus
`agentRuntime.id: "codex"` gebruiken.

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai-codex/gpt-*` wanneer afbeeldingsbegrip via het OpenAI
Codex OAuth-providerpad moet lopen. Gebruik `codex/gpt-*` wanneer afbeeldingsbegrip via
een begrensde Codex app-serverbeurt moet lopen. Het Codex app-servermodel moet
ondersteuning voor afbeeldingsinvoer adverteren; tekst-only Codex-modellen falen voordat de mediabeurt
begint.

Gebruik `/status` om de effectieve harness voor de huidige sessie te bevestigen. Als de
selectie verrassend is, schakel dan debuglogging in voor het subsysteem `agents/harness`
en inspecteer het gestructureerde Gateway-record `agent harness selected`. Het
bevat de geselecteerde harness-id, selectiereden, runtime-/fallbackbeleid en,
in `auto`-modus, het ondersteuningsresultaat van elke Plugin-kandidaat.

### Wat doctor-waarschuwingen betekenen

`openclaw doctor` waarschuwt wanneer al deze zaken waar zijn:

- de gebundelde `codex` Plugin is ingeschakeld of toegestaan
- het primaire model van een agent is `openai-codex/*`
- de effectieve runtime van die agent is niet `codex`

Die waarschuwing bestaat omdat gebruikers vaak verwachten dat "Codex Plugin ingeschakeld" impliceert
"native Codex app-server-runtime." OpenClaw maakt die sprong niet. De waarschuwing
betekent:

- **Er is geen wijziging vereist** als je ChatGPT/Codex OAuth via PI bedoelde.
- Wijzig het model naar `openai/<model>` en stel
  `agentRuntime.id: "codex"` in als je native app-serveruitvoering
  bedoelde.
- Bestaande sessies hebben na een runtimewijziging nog steeds `/new` of `/reset` nodig,
  omdat sessie-runtimepins sticky zijn.

Harnessselectie is geen live sessiebesturing. Wanneer een ingebedde beurt wordt uitgevoerd,
registreert OpenClaw de geselecteerde harness-id op die sessie en blijft die gebruiken voor
latere beurten in dezelfde sessie-id. Wijzig de `agentRuntime`-configuratie of
`OPENCLAW_AGENT_RUNTIME` wanneer je wilt dat toekomstige sessies een andere harness gebruiken;
gebruik `/new` of `/reset` om een nieuwe sessie te starten voordat je een bestaande
conversatie tussen PI en Codex wisselt. Dit voorkomt dat één transcript wordt afgespeeld via
twee incompatibele native sessiesystemen.

Verouderde sessies die vóór harnesspins zijn gemaakt, worden als PI-gepind behandeld zodra ze
transcripthistorie hebben. Gebruik `/new` of `/reset` om die conversatie na het wijzigen van
configuratie in Codex op te nemen.

`/status` toont de effectieve modelruntime. De standaard PI-harness verschijnt als
`Runtime: OpenClaw Pi Default`, en de Codex app-server-harness verschijnt als
`Runtime: OpenAI Codex`.

## Vereisten

- OpenClaw met de gebundelde `codex` Plugin beschikbaar.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard een compatibele
  Codex app-server-binary, dus lokale `codex`-opdrachten op `PATH` hebben geen
  invloed op normale harnessstart.
- Codex-auth beschikbaar voor het app-serverproces of voor OpenClaw's Codex-authbridge.

De Plugin blokkeert oudere of niet-geversioneerde app-serverhandshakes. Dat houdt
OpenClaw op het protocoloppervlak waartegen het is getest.

Voor live- en Docker-smoketests komt auth meestal uit het Codex CLI-account
of een OpenClaw `openai-codex`-authprofiel. Lokale stdio app-serverstarts kunnen
ook terugvallen op `CODEX_API_KEY` / `OPENAI_API_KEY` wanneer er geen account aanwezig is.

## Minimale configuratie

Gebruik `openai/gpt-5.5`, schakel de gebundelde Plugin in en dwing de `codex`-harness af:

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
`codex/<model>` schakelen de gebundelde `codex` Plugin nog steeds automatisch in. Nieuwe configuraties moeten
de voorkeur geven aan `openai/<model>` plus de expliciete `agentRuntime`-entry hierboven.

## Codex toevoegen naast andere modellen

Stel `agentRuntime.id: "codex"` niet globaal in als dezelfde agent vrij moet kunnen wisselen
tussen Codex- en niet-Codex-providermodellen. Een afgedwongen runtime geldt voor elke
ingebedde beurt voor die agent of sessie. Als je een Anthropic-model selecteert terwijl
die runtime is afgedwongen, probeert OpenClaw nog steeds de Codex-harness en faalt gesloten
in plaats van die beurt stilzwijgend via PI te routeren.

Gebruik in plaats daarvan een van deze vormen:

- Zet Codex op een dedicated agent met `agentRuntime.id: "codex"`.
- Houd de standaardagent op `agentRuntime.id: "auto"` en PI-fallback voor normaal gemengd
  providergebruik.
- Gebruik legacy `codex/*`-refs alleen voor compatibiliteit. Nieuwe configuraties moeten de voorkeur geven aan
  `openai/*` plus expliciet Codex-runtimebeleid.

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
- De agent `codex` gebruikt het app-serverharnas van Codex.
- Als Codex ontbreekt of niet wordt ondersteund voor de agent `codex`, mislukt de beurt
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
| "Gebruik mijn ChatGPT/Codex-abonnement met normale OpenClaw" | `openai-codex/*`-modelrefs                  |
| "Voer Codex uit via ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in een thread" | ACP/acpx, niet `/codex` en niet native subagents |

OpenClaw adverteert ACP-spawnrichtlijnen alleen aan agents wanneer ACP is ingeschakeld,
dispatchbaar is en wordt ondersteund door een geladen runtimebackend. Als ACP niet beschikbaar is,
mogen de systeemprompt en Plugin Skills de agent niet leren over ACP-routering.

## Codex-only deployments

Forceer het Codex-harnas wanneer je moet bewijzen dat elke ingesloten agentbeurt
Codex gebruikt. Expliciete pluginruntimes hebben standaard geen PI-fallback, dus
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

Omgevings-override:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wanneer Codex is geforceerd, faalt OpenClaw vroeg als de Codex-plugin is uitgeschakeld, de
app-server te oud is, of de app-server niet kan starten. Stel
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` alleen in als je bewust wilt dat PI ontbrekende
harnasselectie afhandelt.

## Codex per agent

Je kunt één agent Codex-only maken terwijl de standaardagent normale
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
OpenClaw-sessie en het Codex-harnas maakt of hervat indien nodig zijn sidecar-app-serverthread.
`/reset` wist de OpenClaw-sessiebinding voor die thread
en laat de volgende beurt het harnas opnieuw uit de huidige configuratie oplossen.

## Modeldetectie

Standaard vraagt de Codex-plugin de app-server om beschikbare modellen. Als
detectie mislukt of een time-out krijgt, gebruikt hij een gebundelde fallbackcatalogus voor:

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

De beheerde binary wordt gedeclareerd als een gebundelde pluginruntimeafhankelijkheid en gestaged
met de rest van de `codex`-pluginafhankelijkheden. Hierdoor blijft de app-serverversie
gekoppeld aan de gebundelde plugin in plaats van aan welke afzonderlijke Codex CLI
toevallig lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer je
bewust een ander uitvoerbaar bestand wilt uitvoeren.

Standaard start OpenClaw lokale Codex-harnassessies in YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Dit is de vertrouwde lokale operatorhouding die wordt gebruikt
voor autonome heartbeats: Codex kan shell- en netwerktools gebruiken zonder
te stoppen op native goedkeuringsprompts waarop niemand aanwezig is om te antwoorden.

Stel `appServer.mode:
"guardian"` in om je aan te melden voor door Codex guardian gereviewde goedkeuringen:

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

Guardian-modus gebruikt Codex's native goedkeuringspad met automatische review. Wanneer Codex vraagt om
de sandbox te verlaten, buiten de workspace te schrijven of machtigingen zoals netwerktoegang
toe te voegen, routeert Codex dat goedkeuringsverzoek naar de native reviewer in plaats van naar een
menselijke prompt. De reviewer past Codex's risicokader toe en keurt het specifieke verzoek goed of af.
Gebruik Guardian wanneer je meer vangrails wilt dan YOLO-modus
maar nog steeds wilt dat onbeheerde agents voortgang kunnen boeken.

De preset `guardian` wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"`.
Individuele beleidsvelden overschrijven nog steeds `mode`, zodat geavanceerde deployments de
preset kunnen mengen met expliciete keuzes. De oudere reviewerwaarde `guardian_subagent` wordt
nog steeds geaccepteerd als compatibiliteitsalias, maar nieuwe configuraties moeten
`auto_review` gebruiken.

Gebruik WebSocket-transport voor een al actieve app-server:

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

Stdio-app-serverlanceringen erven standaard OpenClaw's procesomgeving,
maar OpenClaw beheert de Codex-app-serveraccountbridge. Auth wordt in deze
volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-auth-profiel voor de agent.
2. Het bestaande account van de app-server, zoals een lokale Codex CLI ChatGPT-aanmelding.
3. Alleen voor lokale stdio-app-serverlanceringen, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-auth
   nog steeds vereist is.

Wanneer OpenClaw een ChatGPT-abonnementsachtig Codex-auth-profiel ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Daardoor
blijven API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex-app-serverbeurten per ongeluk via de API worden gefactureerd.
Expliciete Codex API-sleutelprofielen en lokale stdio-env-keyfallback gebruiken app-serverlogin
in plaats van overgenomen env van het childproces. WebSocket-app-serververbindingen
ontvangen geen Gateway env API-keyfallback; gebruik een expliciet auth-profiel of het
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

`appServer.clearEnv` heeft alleen effect op het gespawnde Codex-app-server-childproces.

Ondersteunde `appServer`-velden:

| Veld                | Standaard                                | Betekenis                                                                                                                                    |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                             |
| `command`           | beheerde Codex-binary                    | Uitvoerbaar bestand voor stdio-transport. Laat leeg om de beheerde binary te gebruiken; stel dit alleen in voor een expliciete overschrijving. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenten voor stdio-transport.                                                                                                             |
| `url`               | niet ingesteld                           | WebSocket-URL van de app-server.                                                                                                             |
| `authToken`         | niet ingesteld                           | Bearer-token voor WebSocket-transport.                                                                                                       |
| `headers`           | `{}`                                     | Extra WebSocket-headers.                                                                                                                     |
| `clearEnv`          | `[]`                                     | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio-app-serverproces nadat OpenClaw de overgenomen omgeving heeft opgebouwd. |
| `requestTimeoutMs`  | `60000`                                  | Time-out voor control-plane-aanroepen naar de app-server.                                                                                    |
| `mode`              | `"yolo"`                                 | Voorinstelling voor YOLO- of door guardian beoordeelde uitvoering.                                                                           |
| `approvalPolicy`    | `"never"`                                | Native Codex-goedkeuringsbeleid dat naar thread start/resume/turn wordt gestuurd.                                                           |
| `sandbox`           | `"danger-full-access"`                   | Native Codex-sandboxmodus die naar thread start/resume wordt gestuurd.                                                                       |
| `approvalsReviewer` | `"user"`                                 | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen. `guardian_subagent` blijft een verouderde alias.             |
| `serviceTier`       | niet ingesteld                           | Optionele Codex app-server-servicetier: `"fast"`, `"flex"` of `null`. Ongeldige verouderde waarden worden genegeerd.                         |

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: elke Codex-`item/tool/call`-aanvraag moet binnen
30 seconden een OpenClaw-antwoord ontvangen. Bij een time-out breekt OpenClaw het
toolsignaal af waar dat wordt ondersteund en retourneert het een mislukte dynamic-tool-respons aan Codex zodat
de turn kan doorgaan in plaats van de sessie in `processing` te laten staan.

Nadat OpenClaw heeft gereageerd op een Codex turn-scoped app-server-aanvraag, verwacht de harness
ook dat Codex de native turn afrondt met `turn/completed`. Als de
app-server daarna 60 seconden stil blijft na die reactie, onderbreekt OpenClaw naar beste vermogen
de Codex-turn, legt het een diagnostische time-out vast en geeft het de
OpenClaw-sessiebaan vrij zodat vervolgb chatberichten niet achter een vastgelopen
native turn in de wachtrij blijven staan.

Omgevingsoverschrijvingen blijven beschikbaar voor lokale tests:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt de beheerde binary wanneer
`appServer.command` niet is ingesteld.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalige lokale tests. Config heeft
de voorkeur voor herhaalbare deployments omdat het het Plugin-gedrag in hetzelfde
beoordeelde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiegids:
[Codex Computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw levert de desktop-control-app niet mee en voert zelf geen
desktopacties uit. Het bereidt de Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is en laat Codex vervolgens de native
MCP-toolaanroepen afhandelen tijdens turns in Codex-modus.

Voor directe TryCua-driver toegang buiten de Codex-marketplaceflow registreer je
`cua-driver mcp` met `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zie [Codex Computergebruik](/nl/plugins/codex-computer-use) voor het onderscheid
tussen Computergebruik dat door Codex wordt beheerd en directe MCP-registratie.

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

De installatie kan worden gecontroleerd of geïnstalleerd via het commandovlak:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computergebruik is macOS-specifiek en kan lokale OS-machtigingen vereisen voordat de
Codex MCP-server apps kan besturen. Als `computerUse.enabled` waar is en de MCP-
server niet beschikbaar is, mislukken turns in Codex-modus voordat de thread start in plaats van
stilzwijgend zonder de native Computergebruik-tools te draaien. Zie
[Codex Computergebruik](/nl/plugins/codex-computer-use) voor marketplace-keuzes,
limieten van externe catalogi, statusredenen en probleemoplossing.

Wanneer `computerUse.autoInstall` waar is, kan OpenClaw de standaard
gebundelde Codex Desktop-marketplace registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` als Codex
nog geen lokale marketplace heeft gevonden. Gebruik `/new` of `/reset` na het
wijzigen van runtime- of Computergebruik-configuratie zodat bestaande sessies geen oude
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

Codex-only harnessvalidatie:

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

Modelwissels blijven door OpenClaw beheerd. Wanneer een OpenClaw-sessie is gekoppeld
aan een bestaande Codex-thread, stuurt de volgende turn het momenteel geselecteerde
OpenAI-model, de provider, het goedkeuringsbeleid, de sandbox en de servicetier opnieuw naar
app-server. Wisselen van `openai/gpt-5.5` naar `openai/gpt-5.2` behoudt de
threadbinding, maar vraagt Codex om door te gaan met het nieuw geselecteerde model.

## Codex-commando

De gebundelde Plugin registreert `/codex` als een geautoriseerd slash-commando. Het is
generiek en werkt op elk kanaal dat OpenClaw-tekstopdrachten ondersteunt.

Veelgebruikte vormen:

- `/codex status` toont live app-serverconnectiviteit, modellen, account, rate limits, MCP-servers en Skills.
- `/codex models` geeft live Codex app-server-modellen weer.
- `/codex threads [filter]` geeft recente Codex-threads weer.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te compacteren.
- `/codex review` start native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om toestemming voordat Codex-diagnostiekfeedback voor de gekoppelde thread wordt verzonden.
- `/codex computer-use status` controleert de geconfigureerde Computergebruik-Plugin en MCP-server.
- `/codex computer-use install` installeert de geconfigureerde Computergebruik-Plugin en laadt MCP-servers opnieuw.
- `/codex account` toont account- en rate-limitstatus.
- `/codex mcp` geeft Codex app-server MCP-serverstatus weer.
- `/codex skills` geeft Codex app-server-Skills weer.

### Veelgebruikte debugworkflow

Wanneer een door Codex ondersteunde agent iets verrassends doet in Telegram, Discord, Slack,
of een ander kanaal, begin dan met het gesprek waar het probleem optrad:

1. Voer `/diagnostics bad tool choice after image upload` uit of een andere korte notitie
   die beschrijft wat je zag.
2. Keur het diagnostiekverzoek eenmaal goed. De goedkeuring maakt de lokale Gateway
   diagnostics-zip en stuurt, omdat de sessie de Codex-harness gebruikt, ook
   de relevante Codex-feedbackbundel naar OpenAI-servers.
3. Kopieer het voltooide diagnostiekantwoord naar het bugrapport of de supportthread.
   Het bevat het lokale bundelpad, de privacysamenvatting, OpenClaw-sessie-id's,
   Codex-thread-id's en een `Inspect locally`-regel voor elke Codex-thread.
4. Als je de run zelf wilt debuggen, voer dan het afgedrukte `Inspect locally`-
   commando uit in een terminal. Het ziet eruit als `codex resume <thread-id>` en opent de
   native Codex-thread zodat je het gesprek kunt inspecteren, lokaal kunt voortzetten,
   of Codex kunt vragen waarom het een bepaalde tool of plan koos.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload wilt voor de momenteel gekoppelde thread zonder de volledige OpenClaw
Gateway-diagnostiekbundel. Voor de meeste supportrapporten is `/diagnostics [note]`
het betere startpunt omdat het de lokale Gateway-status en Codex-
thread-id's samenbrengt in één antwoord. Zie [Diagnostiekexport](/nl/gateway/diagnostics)
voor het volledige privacymodel en het gedrag in groepschats.

Core OpenClaw stelt ook owner-only `/diagnostics [note]` beschikbaar als het algemene
Gateway-diagnostiekcommando. De goedkeuringsprompt toont de inleiding over gevoelige gegevens,
linkt naar [Diagnostiekexport](/nl/gateway/diagnostics), en vraagt
`openclaw gateway diagnostics export --json` aan via expliciete exec-goedkeuring
elke keer. Keur diagnostiek niet goed met een allow-all-regel. Na goedkeuring
stuurt OpenClaw een plakbaar rapport met het lokale bundelpad en de manifest-
samenvatting. Wanneer de actieve OpenClaw-sessie de Codex-harness gebruikt, autoriseert
diezelfde goedkeuring ook het verzenden van de relevante Codex-feedbackbundels naar
OpenAI-servers. De goedkeuringsprompt zegt dat Codex-feedback wordt verzonden, maar
vermeldt geen Codex-sessie- of thread-id's vóór goedkeuring.

Als `/diagnostics` door een eigenaar in een groepschat wordt aangeroepen, houdt OpenClaw het
gedeelde kanaal schoon: de groep ontvangt alleen een korte melding, terwijl de
diagnostiekinleiding, goedkeuringsprompts en Codex-sessie-/thread-id's naar
de eigenaar worden gestuurd via de privégoedkeuringsroute. Als er geen privéroute naar de eigenaar is,
weigert OpenClaw het groepsverzoek en vraagt het de eigenaar om het vanuit een DM uit te voeren.

De goedgekeurde Codex-upload roept Codex app-server `feedback/upload` aan en vraagt
app-server om waar beschikbaar logs op te nemen voor elke vermelde thread en
gespawnde Codex-subthreads. De upload loopt via het normale feedbackpad van
Codex naar OpenAI-servers; als Codex-feedback in die app-server is uitgeschakeld,
retourneert het commando de app-serverfout. Het voltooide diagnostische antwoord
vermeldt de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale
`codex resume <thread-id>`-commando's voor de verzonden threads. Als je de
goedkeuring weigert of negeert, drukt OpenClaw die Codex-id's niet af. Deze
upload vervangt de lokale diagnostische export van de Gateway niet.

`/codex resume` schrijft hetzelfde sidecar-bindingsbestand dat de harness gebruikt
voor normale beurten. Bij het volgende bericht hervat OpenClaw die Codex-thread,
geeft het momenteel geselecteerde OpenClaw-model door aan app-server en houdt
uitgebreide geschiedenis ingeschakeld.

### Een Codex-thread inspecteren vanuit de CLI

De snelste manier om een slechte Codex-run te begrijpen is vaak om de native
Codex-thread rechtstreeks te openen:

```sh
codex resume <thread-id>
```

Gebruik dit wanneer je een bug in een kanaalgesprek opmerkt en de problematische
Codex-sessie wilt inspecteren, lokaal wilt voortzetten of Codex wilt vragen
waarom het een bepaalde tool- of redeneerkeuze heeft gemaakt. Het eenvoudigste
pad is meestal om eerst `/diagnostics [note]` uit te voeren: nadat je dit hebt
goedgekeurd, vermeldt het voltooide rapport elke Codex-thread en drukt het een
`Inspect locally`-commando af, bijvoorbeeld `codex resume <thread-id>`. Je kunt
dat commando rechtstreeks naar een terminal kopiëren.

Je kunt ook een thread-id ophalen met `/codex binding` voor de huidige chat of
`/codex threads [filter]` voor recente Codex app-server-threads, en daarna
hetzelfde `codex resume`-commando in je shell uitvoeren.

Het commando-oppervlak vereist Codex app-server `0.125.0` of nieuwer.
Afzonderlijke controlemethoden worden gerapporteerd als
`unsupported by this Codex app-server` als een toekomstige of aangepaste
app-server die JSON-RPC-methode niet beschikbaar stelt.

## Hook-grenzen

De Codex-harness heeft drie hook-lagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin-hooks                 | OpenClaw                 | Product-/plugincompatibiliteit tussen PI- en Codex-harnesses.       |
| Codex app-server-extensiemiddleware   | Gebundelde OpenClaw-plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.          |
| Native Codex-hooks                    | Codex                    | Laag-niveau Codex-levenscyclus en native toolbeleid vanuit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex `hooks.json`-bestanden om
OpenClaw Plugin-gedrag te routeren. Voor de ondersteunde native tool- en
permission-bridge injecteert OpenClaw per-thread Codex-configuratie voor
`PreToolUse`, `PostToolUse`, `PermissionRequest` en `Stop`. Andere Codex-hooks
zoals `SessionStart` en `UserPromptSubmit` blijven Codex-niveaucontroles; ze
worden in het v1-contract niet als OpenClaw Plugin-hooks beschikbaar gesteld.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de
aanroep heeft gevraagd, dus OpenClaw voert het Plugin- en middlewaregedrag dat
het bezit uit in de harness-adapter. Voor Codex-native tools bezit Codex het
canonieke toolrecord. OpenClaw kan geselecteerde events spiegelen, maar kan de
native Codex-thread niet herschrijven tenzij Codex die bewerking via app-server
of native hook-callbacks beschikbaar stelt.

Compaction- en LLM-levenscyclusprojecties komen uit Codex
app-server-notificaties en OpenClaw-adapterstatus, niet uit native
Codex-hookcommando's. De OpenClaw-events `before_compaction`, `after_compaction`,
`llm_input` en `llm_output` zijn adapterobservaties, geen byte-voor-byte captures
van de interne aanvraag- of Compaction-payloads van Codex.

Native Codex `hook/started`- en `hook/completed` app-server-notificaties worden
geprojecteerd als `codex_app_server.hook`-agentevents voor traject en debugging.
Ze roepen geen OpenClaw Plugin-hooks aan.

## V1-ondersteuningscontract

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex bezit meer
van de native modellus, en OpenClaw past zijn Plugin- en sessieoppervlakken rond
die grens aan.

Ondersteund in Codex runtime v1:

| Oppervlak                                     | Ondersteuning                           | Waarom                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                     | Ondersteund                             | Codex app-server bezit de OpenAI-beurt, native threadhervatting en native toolvoortzetting.                                                                                                           |
| OpenClaw-kanaalroutering en -bezorging        | Ondersteund                             | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                        |
| Dynamische OpenClaw-tools                     | Ondersteund                             | Codex vraagt OpenClaw om deze tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.                                                                                                         |
| Prompt- en contextplugins                     | Ondersteund                             | OpenClaw bouwt prompt-overlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                    |
| Levenscyclus van contextengine                | Ondersteund                             | Samenstellen, ingest- of onderhoud na de beurt, en coordinatie van contextengine-Compaction draaien voor Codex-beurten.                                                                               |
| Dynamische tool-hooks                         | Ondersteund                             | `before_tool_call`, `after_tool_call` en tool-resultmiddleware draaien rond dynamische tools die OpenClaw bezit.                                                                                      |
| Levenscyclus-hooks                            | Ondersteund als adapterobservaties      | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` vuren met eerlijke Codex-modus-payloads.                                                                            |
| Revisiegate voor definitief antwoord          | Ondersteund via de native hook-relay    | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog een modelpassage voor finalisatie.                                                                         |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via de native hook-relay | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor gecommitte native tooloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native permission-beleid                      | Ondersteund via de native hook-relay    | Codex `PermissionRequest` kan via OpenClaw-beleid worden gerouteerd waar de runtime dit beschikbaar stelt. Als OpenClaw geen beslissing retourneert, gaat Codex verder via zijn normale guardian- of gebruikersgoedkeuringspad. |
| App-servertraject-capture                     | Ondersteund                             | OpenClaw registreert de aanvraag die het naar app-server heeft gestuurd en de app-server-notificaties die het ontvangt.                                                                               |

Niet ondersteund in Codex runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                        | Toekomstig pad                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Native toolargumentmutatie                          | Native pre-tool-hooks van Codex kunnen blokkeren, maar OpenClaw herschrijft Codex-native toolargumenten niet.                                  | Vereist Codex-hook-/schemaondersteuning voor vervangende toolinput.                       |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex bezit de canonieke native threadgeschiedenis. OpenClaw bezit een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadchirurgie nodig is.           |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die OpenClaw bezit, geen Codex-native toolrecords.                                                      | Zou getransformeerde records kunnen spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning. |
| Rijke native Compaction-metadata                    | OpenClaw observeert start en voltooiing van Compaction, maar ontvangt geen stabiele lijst met behouden/verwijderde items, tokendelta of samenvattingspayload. | Heeft rijkere Codex-Compaction-events nodig.                                              |
| Compaction-interventie                             | Huidige OpenClaw Compaction-hooks zijn in Codex-modus op notificatieniveau.                                                                     | Voeg Codex pre/post Compaction-hooks toe als plugins native Compaction moeten vetoen of herschrijven. |
| Byte-voor-byte capture van model-API-aanvraag       | OpenClaw kan app-server-aanvragen en -notificaties vastleggen, maar Codex core bouwt de uiteindelijke OpenAI API-aanvraag intern.               | Heeft een Codex model-request tracing-event of debug-API nodig.                           |

## Tools, media en Compaction

De Codex-harness verandert alleen de laag-niveau ingebedde agentexecutor.

OpenClaw bouwt nog steeds de toollijst en ontvangt dynamische toolresultaten van
de harness. Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en output van
berichtentools blijven via het normale OpenClaw-bezorgpad lopen.

De native hook-relay is bewust generiek, maar het v1-ondersteuningscontract is
beperkt tot de Codex-native tool- en permission-paden die OpenClaw test. In de
Codex runtime omvat dat shell-, patch- en MCP-`PreToolUse`-, `PostToolUse`- en
`PermissionRequest`-payloads. Ga er niet van uit dat elk toekomstig
Codex-hookevent een OpenClaw Plugin-oppervlak is totdat het runtimecontract dit
benoemt.

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of
weigeren-beslissingen wanneer beleid beslist. Een resultaat zonder beslissing is
geen toestemming. Codex behandelt dit als geen hookbeslissing en valt terug op
zijn eigen guardian- of gebruikersgoedkeuringspad.

Codex MCP-toolgoedkeuringsvragen worden gerouteerd via de Plugin-goedkeuringsflow
van OpenClaw wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex `request_user_input`-prompts worden teruggestuurd naar
de oorspronkelijke chat, en het volgende wachtrij-follow-upbericht beantwoordt
die native serveraanvraag in plaats van als extra context te worden gestuurd.
Andere MCP-elicitation-aanvragen falen nog steeds gesloten.

Sturing van de wachtrij voor actieve runs komt overeen met Codex app-server `turn/steer`. Met de
standaardinstelling `messages.queue.mode: "steer"` bundelt OpenClaw wachtrijstaande chatberichten
gedurende het geconfigureerde stiltevenster en verzendt ze als één `turn/steer`-verzoek in
aankomstvolgorde. De verouderde `queue`-modus verzendt afzonderlijke `turn/steer`-verzoeken. Codex
review- en handmatige Compaction-turns kunnen same-turn steering weigeren; in dat geval
gebruikt OpenClaw de follow-upwachtrij wanneer de geselecteerde modus fallback toestaat. Zie
[Stuurwachtrij](/nl/concepts/queue-steering).

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt native thread-Compaction
gedelegeerd aan Codex app-server. OpenClaw houdt een transcriptspiegel bij voor kanaalgeschiedenis,
zoeken, `/new`, `/reset` en toekomstige wisselingen van model of harness. De
spiegel bevat de gebruikersprompt, de uiteindelijke assistenttekst en lichte Codex-
redeneer- of planrecords wanneer de app-server die uitstuurt. Op dit moment registreert OpenClaw alleen
start- en voltooiingssignalen van native Compaction. Het biedt nog geen
menselijk leesbare Compaction-samenvatting of een controleerbare lijst van welke vermeldingen Codex
na Compaction heeft behouden.

Omdat Codex de canonieke native thread beheert, herschrijft `tool_result_persist` momenteel geen
Codex-native toolresultaatrecords. Het is alleen van toepassing wanneer
OpenClaw een door OpenClaw beheerd toolresultaat in een sessietranscript schrijft.

Mediageneratie vereist geen PI. Afbeeldingen, video, muziek, PDF, TTS en media-
begrip blijven de bijbehorende provider-/modelinstellingen gebruiken, zoals
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` en
`messages.tts`.

## Probleemoplossing

**Codex verschijnt niet als normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model met
`agentRuntime.id: "codex"` (of een verouderde `codex/*`-ref), schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow` `codex`
uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** `agentRuntime.id: "auto"` kan PI nog steeds gebruiken als
compatibiliteitsbackend wanneer geen Codex-harness de run claimt. Stel
`agentRuntime.id: "codex"` in om Codex-selectie tijdens het testen af te dwingen. Een
afgedwongen Codex-runtime faalt nu in plaats van terug te vallen op PI, tenzij je
expliciet `agentRuntime.fallback: "pi"` instelt. Zodra Codex app-server is
geselecteerd, worden de fouten daarvan direct zichtbaar zonder extra fallback-configuratie.

**De app-server wordt geweigerd:** upgrade Codex zodat de app-server-handshake
versie `0.125.0` of nieuwer rapporteert. Prereleases met dezelfde versie of versies met buildsuffix,
zoals `0.125.0-alpha.2` of `0.125.0+custom`, worden geweigerd omdat de
stabiele protocolondergrens `0.125.0` is wat OpenClaw test.

**Modeldetectie is traag:** verlaag `plugins.entries.codex.config.discovery.timeoutMs`
of schakel detectie uit.

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`
en of de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht, tenzij je
`agentRuntime.id: "codex"` voor die agent hebt afgedwongen of een verouderde
`codex/*`-ref hebt geselecteerd. Gewone `openai/gpt-*`- en andere providerrefs blijven op hun normale
providerpad in `auto`-modus. Als je `agentRuntime.id: "codex"` afdwingt, moet elke embedded
turn voor die agent een door Codex ondersteund OpenAI-model zijn.

**Computer Use is geïnstalleerd, maar tools draaien niet:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan `/new` of `/reset`; als het probleem aanhoudt, herstart
de Gateway om verouderde native hook-registraties te wissen. Als `computer-use.list_apps`
een time-out geeft, herstart Codex Computer Use of Codex Desktop en probeer het opnieuw.

## Gerelateerd

- [Agent-harness-plugins](/nl/plugins/sdk-agent-harness)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Status](/nl/cli/status)
- [Plugin-hooks](/nl/plugins/hooks)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
