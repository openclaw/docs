---
read_when:
    - Je wilt het meegeleverde Codex-app-serverharnas gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op PI
summary: Voer ingesloten OpenClaw-agentbeurten uit via de gebundelde Codex app-server-harness
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-11T20:39:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex`-Plugin laat OpenClaw ingebedde OpenAI-agentbeurten uitvoeren
via Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik de Codex-harness wanneer je wilt dat Codex eigenaar is van de low-level agentsessie:
native hervatten van threads, native toolvoortzetting, native compaction en
app-server-uitvoering. OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie,
dynamische OpenClaw-tools, goedkeuringen, medialevering en de zichtbare
transcriptspiegel.

De normale installatie gebruikt canonieke OpenAI-modelrefs zoals `openai/gpt-5.5`.
Configureer geen `openai-codex/gpt-*`-modelrefs. Plaats de OpenAI-agentauthenticatievolgorde
onder `auth.order.openai`; oudere `openai-codex:*`-profielen en
`auth.order.openai-codex`-vermeldingen blijven ondersteund voor bestaande installaties.

OpenClaw start Codex app-server-threads met native Codex-codemodus en
alleen-codemodus ingeschakeld. Daardoor blijven uitgestelde/doorzoekbare dynamische OpenClaw-tools
binnen Codex' eigen code-uitvoering en toolzoekoppervlak in plaats van een
PI-achtige toolzoekwrapper boven op Codex toe te voegen.

Voor de bredere splitsing tussen model/provider/runtime begin je met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelref, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Vereisten

- OpenClaw met de gebundelde `codex`-Plugin beschikbaar.
- Als je configuratie `plugins.allow` gebruikt, neem dan `codex` op.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard een compatibele
  Codex app-server-binary, dus lokale `codex`-commando's op `PATH` hebben geen
  invloed op normale harness-start.
- Codex-authenticatie beschikbaar via `openclaw models auth login --provider openai-codex`,
  een app-server-account in de Codex-home van de agent, of een expliciet Codex API-sleutel-
  authenticatieprofiel.

Voor authenticatieprioriteit, omgevingsisolatie, aangepaste app-server-commando's, modelontdekking
en alle configuratievelden, zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Snelstart

De meeste gebruikers die Codex in OpenClaw willen, willen dit pad: meld je aan met een
ChatGPT/Codex-abonnement, schakel de gebundelde `codex`-Plugin in en gebruik een
canonieke `openai/gpt-*`-modelref.

Meld je aan met Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Schakel de gebundelde `codex`-Plugin in en selecteer een OpenAI-agentmodel:

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
    },
  },
}
```

Als je configuratie `plugins.allow` gebruikt, voeg daar dan ook `codex` toe:

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

Herstart de Gateway nadat je de Plugin-configuratie hebt gewijzigd. Als een bestaande chat al
een sessie heeft, gebruik dan `/new` of `/reset` voordat je runtimewijzigingen test, zodat de volgende
beurt de harness uit de huidige configuratie oplost.

## Configuratie

De snelstartconfiguratie is de minimaal haalbare Codex-harnessconfiguratie. Stel Codex-
harnessopties in de OpenClaw-configuratie in en gebruik de CLI alleen voor Codex-authenticatie:

| Behoefte                              | Stel in                                                                          | Waar                               |
| ------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Schakel de harness in                 | `plugins.entries.codex.enabled: true`                                            | OpenClaw-configuratie              |
| Behoud een allowlisted Plugin-installatie | Neem `codex` op in `plugins.allow`                                            | OpenClaw-configuratie              |
| Routeer OpenAI-agentbeurten via Codex | `agents.defaults.model` of `agents.list[].model` als `openai/gpt-*`              | OpenClaw-agentconfiguratie         |
| Meld je aan met Codex OAuth           | `openclaw models auth login --provider openai-codex`                             | CLI-authenticatieprofiel           |
| Voeg API-sleutelback-up toe voor Codex-runs | `openai:*` API-sleutelprofiel vermeld na abonnementsauthenticatie in `auth.order.openai` | CLI-authenticatieprofiel + OpenClaw-configuratie |
| Fail closed wanneer Codex niet beschikbaar is | Provider- of model-`agentRuntime.id: "codex"`                              | OpenClaw-model/provider-configuratie |
| Gebruik direct OpenAI API-verkeer     | Provider- of model-`agentRuntime.id: "pi"` met normale OpenAI-authenticatie      | OpenClaw-model/provider-configuratie |
| Stem app-servergedrag af              | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-configuratie          |
| Schakel native Codex-Plugin-apps in   | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-configuratie          |
| Schakel Codex Computer Use in         | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-configuratie          |

Gebruik `openai/gpt-*`-modelrefs voor door Codex ondersteunde OpenAI-agentbeurten. Geef de voorkeur
aan `auth.order.openai` voor volgorde met abonnement eerst/API-sleutel als back-up. Bestaande
`openai-codex:*`-authenticatieprofielen en `auth.order.openai-codex` blijven geldig, maar
schrijf geen nieuwe `openai-codex/gpt-*`-modelrefs.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In die vorm lopen beide profielen nog steeds via Codex voor `openai/gpt-*`-agentbeurten.
De API-sleutel is alleen een authenticatiefallback, geen verzoek om over te schakelen naar PI of
gewone OpenAI Responses.

De rest van deze pagina behandelt veelvoorkomende varianten waar gebruikers tussen moeten kiezen:
deploymentvorm, fail-closed-routing, guardian-goedkeuringsbeleid, native Codex-
Plugins en Computer Use. Voor volledige optielijsten, standaarden, enums, ontdekking,
omgevingsisolatie, time-outs en app-server-transportvelden, zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Codex-runtime verifiëren

Gebruik `/status` in de chat waar je Codex verwacht. Een door Codex ondersteunde OpenAI-agentbeurt
toont:

```text
Runtime: OpenAI Codex
```

Controleer daarna de Codex app-server-status:

```text
/codex status
/codex models
```

`/codex status` rapporteert app-serverconnectiviteit, account, ratelimieten, MCP-
servers en Skills. `/codex models` vermeldt de live Codex app-server-catalogus voor
de harness en het account. Als `/status` verrassend is, zie
[Probleemoplossing](#troubleshooting).

## Routing en modelselectie

Houd providerrefs en runtimebeleid gescheiden:

- Gebruik `openai/gpt-*` voor OpenAI-agentbeurten via Codex.
- Gebruik `openai-codex/gpt-*` niet in configuratie. Voer `openclaw doctor --fix` uit om
  legacy refs en verouderde sessieroute-pins te repareren.
- `agentRuntime.id: "codex"` is optioneel voor de normale OpenAI-automatische modus, maar nuttig
  wanneer een deployment fail closed moet zijn als Codex niet beschikbaar is.
- `agentRuntime.id: "pi"` kiest voor een provider of model direct PI-gedrag wanneer
  dat de bedoeling is.
- `/codex ...` bestuurt native Codex app-server-gesprekken vanuit chat.
- ACP/acpx is een apart extern harnesspad. Gebruik het alleen wanneer de gebruiker vraagt
  om ACP/acpx of een externe harnessadapter.

Veelvoorkomende commandorouting:

| Gebruikersintentie              | Gebruik                                 |
| ------------------------------- | --------------------------------------- |
| De huidige chat koppelen        | `/codex bind [--cwd <path>]`            |
| Een bestaande Codex-thread hervatten | `/codex resume <thread-id>`        |
| Codex-threads weergeven of filteren | `/codex threads [filter]`           |
| Alleen Codex-feedback verzenden | `/codex diagnostics [note]`             |
| Een ACP/acpx-taak starten       | ACP/acpx-sessiecommando's, niet `/codex` |

| Use case                                             | Configureer                                                       | Verifieer                               | Opmerkingen                         |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime | `openai/gpt-*` plus ingeschakelde `codex`-Plugin                    | `/status` toont `Runtime: OpenAI Codex` | Aanbevolen pad                     |
| Fail closed als Codex niet beschikbaar is            | Provider- of model-`agentRuntime.id: "codex"`                     | Beurt faalt in plaats van PI-fallback   | Gebruik voor alleen-Codex-deployments |
| Direct OpenAI API-sleutelverkeer via PI              | Provider- of model-`agentRuntime.id: "pi"` en normale OpenAI-authenticatie | `/status` toont PI-runtime              | Gebruik alleen wanneer PI bedoeld is |
| Legacy configuratie                                  | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` herschrijft dit | Schrijf nieuwe configuratie niet op deze manier |
| ACP/acpx Codex-adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP-taak-/sessiestatus                  | Los van native Codex-harness       |

`agents.defaults.imageModel` volgt dezelfde prefixsplitsing. Gebruik `openai/gpt-*`
voor de normale OpenAI-route en `codex/gpt-*` alleen wanneer beeldbegrip
via een begrensde Codex app-server-beurt moet lopen. Gebruik geen
`openai-codex/gpt-*`; doctor herschrijft die legacy prefix naar `openai/gpt-*`.

## Deploymentpatronen

### Basis-Codex-deployment

Gebruik de snelstartconfiguratie wanneer alle OpenAI-agentbeurten standaard Codex moeten gebruiken.

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
    },
  },
}
```

### Gemengde providerdeployment

Deze vorm houdt Claude als standaardagent en voegt een benoemde Codex-agent toe:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

Met deze configuratie gebruikt de `main`-agent zijn normale providerpad en de
`codex`-agent gebruikt Codex app-server.

### Fail-closed Codex-deployment

Voor OpenAI-agentbeurten lost `openai/gpt-*` al op naar Codex wanneer de
gebundelde Plugin beschikbaar is. Voeg expliciet runtimebeleid toe wanneer je een geschreven
fail-closed-regel wilt:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Met Codex afgedwongen faalt OpenClaw vroeg als de Codex-Plugin is uitgeschakeld, de
app-server te oud is, of de app-server niet kan starten.

## App-serverbeleid

Standaard start de Plugin de door OpenClaw beheerde Codex-binary lokaal met stdio-
transport. Stel `appServer.command` alleen in wanneer je bewust een ander
uitvoerbaar bestand wilt draaien. Gebruik WebSocket-transport alleen wanneer er al elders een app-server draait:

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Lokale stdio-app-serversessies gebruiken standaard de vertrouwde lokale operatorhouding:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Als lokale Codex-vereisten die
impliciete YOLO-houding niet toestaan, selecteert OpenClaw in plaats daarvan
toegestane guardian-machtigingen. Wanneer een OpenClaw-sandbox actief is voor
de sessie, beperkt OpenClaw Codex `danger-full-access` tot Codex
`workspace-write`, zodat native Codex-code-modusbeurten binnen de gesandboxte
workspace blijven.

Gebruik guardian-modus wanneer je native automatische Codex-review wilt vóór sandbox-ontsnappingen
of extra machtigingen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Guardian-modus wordt uitgebreid naar Codex-app-servergoedkeuringen, meestal
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` en
`sandbox: "workspace-write"` wanneer de lokale vereisten die waarden toestaan.

Zie [Codex-harnessreferentie](/nl/plugins/codex-harness-reference) voor elk app-serverveld, de auth-volgorde, omgevingsisolatie, discovery en
timeoutgedrag.

## Opdrachten en diagnostiek

De gebundelde plugin registreert `/codex` als slash-opdracht op elk kanaal dat
OpenClaw-tekstopdrachten ondersteunt.

Veelvoorkomende vormen:

- `/codex status` controleert app-serverconnectiviteit, modellen, account, snelheidslimieten,
  MCP-servers en Skills.
- `/codex models` geeft live Codex-app-servermodellen weer.
- `/codex threads [filter]` geeft recente Codex-app-serverthreads weer.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een
  bestaande Codex-thread.
- `/codex compact` vraagt Codex-app-server om de gekoppelde thread te comprimeren.
- `/codex review` start native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt toestemming voordat Codex-feedback voor de
  gekoppelde thread wordt verzonden.
- `/codex account` toont account- en snelheidslimietstatus.
- `/codex mcp` geeft de status van Codex-app-server-MCP-servers weer.
- `/codex skills` geeft Codex-app-server-Skills weer.

Begin voor de meeste supportrapporten met `/diagnostics [note]` in het gesprek
waar de bug optrad. Hiermee wordt één Gateway-diagnoserapport gemaakt en, voor Codex-
harnesssessies, om goedkeuring gevraagd om de relevante Codex-feedbackbundel te verzenden.
Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en het gedrag in groepschats.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload voor de momenteel gekoppelde thread wilt, zonder de volledige Gateway-
diagnosebundel.

### Codex-threads lokaal inspecteren

De snelste manier om een slechte Codex-run te inspecteren is vaak door de native Codex-
thread direct te openen:

```bash
codex resume <thread-id>
```

Haal de thread-id uit het voltooide `/diagnostics`-antwoord, `/codex binding` of
`/codex threads [filter]`.

Zie voor uploadmechaniek en diagnostische grenzen op runtimeniveau
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime#codex-feedback-upload).

Auth wordt in deze volgorde geselecteerd:

1. Geordende OpenAI-authprofielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Bestaande `openai-codex:*`-profiel-id's blijven geldig.
2. Het bestaande app-serveraccount in de Codex-home van die agent.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-auth
   nog steeds vereist is.

Wanneer OpenClaw een ChatGPT-abonnementsachtig Codex-authprofiel ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Zo blijven
API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen,
zonder dat native Codex-app-serverbeurten per ongeluk via de API worden gefactureerd.
Expliciete Codex-API-sleutelprofielen en lokale stdio-env-key fallback gebruiken app-serverlogin
in plaats van overgeërfde childproces-env. WebSocket-app-serververbindingen ontvangen geen
Gateway-env-API-sleutelfallback; gebruik een expliciet authprofiel of het eigen account van
de externe app-server.

Als een abonnementsprofiel een Codex-gebruikslimiet bereikt, registreert OpenClaw de reset-
tijd wanneer Codex die rapporteert en probeert het het volgende geordende authprofiel voor dezelfde
Codex-run. Wanneer de reset-tijd is verstreken, komt het abonnementsprofiel weer in aanmerking
zonder het geselecteerde `openai/gpt-*`-model of de Codex-runtime te wijzigen.

Als een implementatie extra omgevingsisolatie nodig heeft, voeg je die variabelen toe aan
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

Codex-dynamische tools gebruiken standaard `searchable`-laden. OpenClaw stelt geen
dynamische tools beschikbaar die native Codex-workspacebewerkingen dupliceren: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` en `update_plan`. Overige OpenClaw-
integratietools zoals messaging, sessies, media, Cron, browser, nodes,
Gateway, `heartbeat_respond` en `web_search` zijn beschikbaar via Codex-toolzoekopdrachten
onder de `openclaw`-namespace, waardoor de initiële modelcontext kleiner blijft.
`sessions_yield` en bronantwoorden met alleen berichttools blijven direct omdat dat
beurtcontrolecontracten zijn. Heartbeat-samenwerkingsinstructies vertellen Codex om
naar `heartbeat_respond` te zoeken voordat een heartbeat-beurt wordt beëindigd wanneer de tool
nog niet is geladen.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt met een aangepaste Codex-
app-server die uitgestelde dynamische tools niet kan doorzoeken, of wanneer je de volledige
toolpayload debugt.

Ondersteunde Codex-pluginvelden op topniveau:

| Veld                       | Standaard      | Betekenis                                                                               |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gebruik `"direct"` om OpenClaw-dynamische tools direct in de initiële Codex-toolcontext te plaatsen. |
| `codexDynamicToolsExclude` | `[]`           | Extra namen van OpenClaw-dynamische tools die uit Codex-app-serverbeurten moeten worden weggelaten. |
| `codexPlugins`             | uitgeschakeld  | Native Codex-plugin-/app-ondersteuning voor gemigreerde curated plugins die vanuit de bron zijn geïnstalleerd. |

Ondersteunde `appServer`-velden:

| Veld                          | Standaard                                              | Betekenis                                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` spawnt Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                      |
| `command`                     | beheerde Codex-binary                                  | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om de beheerde binary te gebruiken; stel het alleen in voor een expliciete override.                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumenten voor stdio-transport.                                                                                                                                                                                                        |
| `url`                         | niet ingesteld                                         | WebSocket-app-server-URL.                                                                                                                                                                                                               |
| `authToken`                   | niet ingesteld                                         | Bearer-token voor WebSocket-transport.                                                                                                                                                                                                  |
| `headers`                     | `{}`                                                   | Extra WebSocket-headers.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Extra namen van omgevingsvariabelen die worden verwijderd uit het gespawnde stdio-app-serverproces nadat OpenClaw zijn overgeërfde omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's per-agent Codex-isolatie bij lokale starts. |
| `requestTimeoutMs`            | `60000`                                                | Timeout voor control-plane-aanroepen naar de app-server.                                                                                                                                                                                |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Stiltevenster na een beurtgebonden Codex-app-serververzoek terwijl OpenClaw wacht op `turn/completed`. Verhoog dit voor trage post-tool- of alleen-status-synthesefasen.                                                                |
| `mode`                        | `"yolo"` tenzij lokale Codex-vereisten YOLO niet toestaan | Preset voor YOLO- of guardian-reviewed uitvoering. Lokale stdio-vereisten die `danger-full-access`, `never`-goedkeuring of de `user`-reviewer weglaten, maken de impliciete standaard guardian.                                         |
| `approvalPolicy`              | `"never"` of een toegestane guardian-goedkeuringspolicy | Native Codex-goedkeuringspolicy die naar thread start/resume/turn wordt verzonden. Guardian-standaarden geven de voorkeur aan `"on-request"` wanneer toegestaan.                                                                        |
| `sandbox`                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar thread start/resume wordt verzonden. Guardian-standaarden geven de voorkeur aan `"workspace-write"` wanneer toegestaan, anders `"read-only"`. Wanneer een OpenClaw-sandbox actief is, wordt `danger-full-access` beperkt tot `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` of een toegestane guardian-reviewer           | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten reviewen wanneer toegestaan, anders `guardian_subagent` of `user`. `guardian_subagent` blijft een verouderde alias.                                                |
| `serviceTier`                 | niet ingesteld                                         | Optionele Codex-app-serverservicetier. `"priority"` schakelt fast-mode-routing in, `"flex"` vraagt flex-verwerking aan, `null` wist de override en verouderde `"fast"` wordt geaccepteerd als `"priority"`.                             |

OpenClaw-eigen dynamische toolaanroepen worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: Codex `item/tool/call`-verzoeken gebruiken standaard een OpenClaw-watchdog van 30 seconden. Een positief per-aanroep-argument `timeoutMs` verlengt of verkort
het specifieke toolbudget. De tool `image_generate` gebruikt ook
`agents.defaults.imageGenerationModel.timeoutMs` wanneer de toolaanroep geen eigen timeout
opgeeft, en de media-begripstool `image` gebruikt
`tools.media.image.timeoutSeconds` of de media-standaard van 60 seconden. Dynamische
toolbudgetten zijn begrensd op 600000 ms. Bij een timeout breekt OpenClaw het toolsignaal af
waar dat wordt ondersteund en retourneert het een mislukte dynamic-tool-respons aan Codex zodat de beurt
kan doorgaan in plaats van de sessie in `processing` achter te laten.

Nadat OpenClaw reageert op een Codex app-server-verzoek met beurtbereik, verwacht de harness
ook dat Codex de native beurt afrondt met `turn/completed`. Als de
app-server na die respons stil blijft gedurende `appServer.turnCompletionIdleTimeoutMs`,
onderbreekt OpenClaw de Codex-beurt naar beste vermogen, registreert een diagnostische
timeout en geeft de OpenClaw-sessielane vrij zodat vervolgchatberichten
niet achter een verouderde native beurt in de wachtrij komen. Elke niet-terminale melding voor dezelfde
beurt, inclusief `rawResponseItem/completed`, schakelt die korte watchdog uit
omdat Codex heeft bewezen dat de beurt nog leeft; de langere terminale watchdog
blijft echt vastgelopen beurten beschermen. Timeoutdiagnostiek bevat de
laatste app-server-meldingsmethode en, voor ruwe assistentresponsitems, het
itemtype, de rol, id en een begrensde preview van de assistenttekst.

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
de voorkeur voor herhaalbare deployments omdat dit het plugin-gedrag in hetzelfde
gereviewde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Native Codex-plugins

Ondersteuning voor native Codex-plugins gebruikt de eigen app- en plugin-
mogelijkheden van Codex app-server in dezelfde Codex-thread als de OpenClaw-harnessbeurt. OpenClaw
vertaalt Codex-plugins niet naar synthetische `codex_plugin_*` OpenClaw
dynamische tools.

`codexPlugins` heeft alleen invloed op sessies die de native Codex-harness selecteren. Het
heeft geen effect op PI-runs, normale OpenAI-provider-runs, ACP-gespreks-
bindings of andere harnesses.

Minimale gemigreerde configuratie:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Thread-appconfiguratie wordt berekend wanneer OpenClaw een Codex-harnesssessie opzet
of een verouderde Codex-threadbinding vervangt. Deze wordt niet bij elke beurt opnieuw berekend.
Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset`, of herstart de gateway zodat
toekomstige Codex-harnesssessies starten met de bijgewerkte app-set.

Zie voor migratiegeschiktheid, app-inventaris, beleid voor destructieve acties,
elicitations en native plugin-diagnostiek
[Native Codex-plugins](/nl/plugins/codex-native-plugins).

## Computer Use

Computer Use wordt behandeld in een eigen installatiegids:
[Codex Computer Use](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktop-control-app niet en voert
desktopacties niet zelf uit. Het bereidt Codex app-server voor, controleert of de
`computer-use` MCP-server beschikbaar is, en laat Codex vervolgens de native MCP-
toolaanroepen beheren tijdens beurten in Codex-modus.

## Runtimegrenzen

De Codex-harness wijzigt alleen de low-level embedded agent executor.

- OpenClaw dynamische tools worden ondersteund. Codex vraagt OpenClaw om die
  tools uit te voeren, zodat OpenClaw in het uitvoeringspad blijft.
- Codex-native shell-, patch-, MCP- en native apptools zijn eigendom van Codex.
  OpenClaw kan geselecteerde native gebeurtenissen via de ondersteunde
  relay observeren of blokkeren, maar herschrijft native toolargumenten niet.
- Codex beheert native Compaction. OpenClaw houdt een transcriptmirror bij voor channel-
  geschiedenis, zoeken, `/new`, `/reset`, en toekomstig wisselen van model of harness.
- Mediageneratie, mediabegrip, TTS, approvals en uitvoer van messaging-tools
  blijven via de bijbehorende OpenClaw-provider-/modelinstellingen lopen.
- `tool_result_persist` is van toepassing op OpenClaw-eigen transcripttoolresultaten, niet op
  Codex-native toolresultaatrecords.

Zie voor hooklagen, ondersteunde V1-oppervlakken, native toestemmingsafhandeling, wachtrijsturing,
uploadmechanica voor Codex-feedback en Compaction-details
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime).

## Probleemoplossing

**Codex verschijnt niet als een normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model, schakel
`plugins.entries.codex.enabled` in, en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** zorg dat de modelreferentie
`openai/gpt-*` is op de officiële OpenAI-provider en dat de Codex-plugin is
geïnstalleerd en ingeschakeld. Als je strikte bewijslast nodig hebt tijdens het testen, stel provider- of
model-`agentRuntime.id: "codex"` in. Een geforceerde Codex-runtime faalt in plaats van
terug te vallen op PI.

**Verouderde `openai-codex/*`-configuratie blijft bestaan:** voer `openclaw doctor --fix` uit.
Doctor herschrijft verouderde modelreferenties naar `openai/*`, verwijdert verouderde sessie- en
whole-agent runtime-pins, en behoudt bestaande auth-profile-overschrijvingen.

**De app-server wordt geweigerd:** gebruik Codex app-server `0.125.0` of nieuwer.
Prereleases met dezelfde versie of versies met buildsuffix zoals
`0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat OpenClaw de
stabiele `0.125.0`-protocolondergrens test.

**`/codex status` kan geen verbinding maken:** controleer of de gebundelde `codex`-plugin is
ingeschakeld, dat `plugins.allow` deze bevat wanneer een allowlist is geconfigureerd, en
dat eventuele aangepaste `appServer.command`, `url`, `authToken`, of headers geldig zijn.

**Modelontdekking is traag:** verlaag
`plugins.entries.codex.config.discovery.timeoutMs` of schakel discovery uit. Zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference#model-discovery).

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`,
headers, en dat de externe app-server dezelfde Codex app-server-
protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij provider- of modelruntime-
beleid het naar een andere harness routeert. Eenvoudige niet-OpenAI-providerreferenties blijven op
hun normale providerpad in `auto`-modus.

**Computer Use is geïnstalleerd maar tools draaien niet:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik `/new` of `/reset`; als dit aanhoudt, herstart
de gateway om verouderde native hookregistraties te wissen. Zie
[Codex Computer Use](/nl/plugins/codex-computer-use#troubleshooting).

## Gerelateerd

- [Codex-harnessreferentie](/nl/plugins/codex-harness-reference)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Agent-harnessplugins](/nl/plugins/sdk-agent-harness)
- [Plugin-hooks](/nl/plugins/hooks)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Status](/nl/cli/status)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
