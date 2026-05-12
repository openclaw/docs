---
read_when:
    - Je wilt de gebundelde Codex app-server harness gebruiken
    - U hebt voorbeelden van Codex-harnessconfiguratie nodig
    - U wilt dat implementaties die alleen Codex gebruiken falen in plaats van terug te vallen op PI
summary: Voer OpenClaw-ingesloten agentbeurten uit via het meegeleverde Codex-app-serverharnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-12T00:59:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex`-plugin laat OpenClaw ingebedde OpenAI-agentbeurten uitvoeren
via Codex app-server in plaats van de ingebouwde PI-harness.

Gebruik de Codex-harness wanneer je wilt dat Codex eigenaar is van de laag-niveau agentsessie:
native thread-hervatting, native toolvoortzetting, native Compaction en
uitvoering via app-server. OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie,
dynamische OpenClaw-tools, goedkeuringen, medialevering en de zichtbare
transcriptspiegel.

De normale configuratie gebruikt canonieke OpenAI-modelreferenties zoals `openai/gpt-5.5`.
Configureer geen `openai-codex/gpt-*`-modelreferenties. Plaats de OpenAI-agent-authvolgorde
onder `auth.order.openai`; oudere `openai-codex:*`-profielen en
`auth.order.openai-codex`-items blijven ondersteund voor bestaande installaties.

OpenClaw start Codex app-server-threads met Codex-native codemodus en
alleen-codemodus ingeschakeld. Daardoor blijven uitgestelde/doorzoekbare dynamische OpenClaw-tools
binnen Codex' eigen code-uitvoering en toolzoekoppervlak, in plaats van een
PI-achtige toolzoekwrapper boven op Codex toe te voegen.

Voor de bredere scheiding tussen model/provider/runtime begin je met
[Agent-runtimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelreferentie, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Vereisten

- OpenClaw met de gebundelde `codex`-plugin beschikbaar.
- Als je configuratie `plugins.allow` gebruikt, neem dan `codex` op.
- Codex app-server `0.125.0` of nieuwer. De gebundelde plugin beheert standaard een compatibele
  Codex app-server-binary, dus lokale `codex`-commando's op `PATH` hebben geen
  invloed op normaal opstarten van de harness.
- Codex-auth beschikbaar via `openclaw models auth login --provider openai-codex`,
  een app-server-account in de Codex-home van de agent, of een expliciet Codex API-key
  auth-profiel.

Zie voor authvoorrang, omgevingsisolatie, aangepaste app-server-commando's, modeldetectie
en alle configuratievelden de
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Snelstart

De meeste gebruikers die Codex in OpenClaw willen, willen dit pad: meld je aan met een
ChatGPT/Codex-abonnement, schakel de gebundelde `codex`-plugin in en gebruik een
canonieke `openai/gpt-*`-modelreferentie.

Meld je aan met Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Schakel de gebundelde `codex`-plugin in en selecteer een OpenAI-agentmodel:

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

Herstart de Gateway nadat je de pluginconfiguratie hebt gewijzigd. Als een bestaande chat al
een sessie heeft, gebruik dan `/new` of `/reset` voordat je runtimewijzigingen test, zodat de volgende
beurt de harness uit de huidige configuratie oplost.

## Configuratie

De snelstartconfiguratie is de minimaal werkbare Codex-harnessconfiguratie. Stel Codex
harnessopties in de OpenClaw-configuratie in, en gebruik de CLI alleen voor Codex-auth:

| Behoefte                              | Instellen                                                                        | Waar                               |
| ------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| De harness inschakelen                | `plugins.entries.codex.enabled: true`                                            | OpenClaw-configuratie              |
| Een installatie met toegestane plugins behouden | Neem `codex` op in `plugins.allow`                                               | OpenClaw-configuratie              |
| OpenAI-agentbeurten via Codex routeren | `agents.defaults.model` of `agents.list[].model` als `openai/gpt-*`              | OpenClaw-agentconfiguratie         |
| Aanmelden met Codex OAuth             | `openclaw models auth login --provider openai-codex`                             | CLI-authprofiel                    |
| API-key-back-up toevoegen voor Codex-runs | `openai:*` API-key-profiel vermeld na abonnementsauth in `auth.order.openai` | CLI-authprofiel + OpenClaw-configuratie |
| Gesloten falen wanneer Codex niet beschikbaar is | Provider- of model-`agentRuntime.id: "codex"`                                    | OpenClaw-model/provider-configuratie |
| Rechtstreeks OpenAI API-verkeer gebruiken | Provider- of model-`agentRuntime.id: "pi"` met normale OpenAI-auth               | OpenClaw-model/provider-configuratie |
| App-servergedrag afstemmen            | `plugins.entries.codex.config.appServer.*`                                       | Codex-pluginconfiguratie           |
| Native Codex-plugin-apps inschakelen  | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-pluginconfiguratie           |
| Codex Computer Use inschakelen        | `plugins.entries.codex.config.computerUse.*`                                     | Codex-pluginconfiguratie           |

Gebruik `openai/gpt-*`-modelreferenties voor door Codex ondersteunde OpenAI-agentbeurten. Geef de voorkeur aan
`auth.order.openai` voor volgorde met eerst abonnement en API-key als back-up. Bestaande
`openai-codex:*`-authprofielen en `auth.order.openai-codex` blijven geldig, maar
schrijf geen nieuwe `openai-codex/gpt-*`-modelreferenties.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In die vorm blijven beide profielen via Codex lopen voor `openai/gpt-*`-agentbeurten.
De API-key is alleen een authfallback, geen verzoek om over te schakelen naar PI of
gewone OpenAI Responses.

De rest van deze pagina behandelt veelvoorkomende varianten waar gebruikers tussen moeten kiezen:
uitrolvorm, gesloten routering bij falen, guardian-goedkeuringsbeleid, native Codex-plugins
en Computer Use. Zie voor volledige optielijsten, standaardwaarden, enums, detectie,
omgevingsisolatie, time-outs en app-server-transportvelden de
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

`/codex status` rapporteert app-server-connectiviteit, account, rate limits, MCP
servers en Skills. `/codex models` vermeldt de live Codex app-server-catalogus voor
de harness en het account. Als `/status` verrassend is, zie
[Probleemoplossing](#troubleshooting).

## Routering en modelselectie

Houd providerreferenties en runtimebeleid gescheiden:

- Gebruik `openai/gpt-*` voor OpenAI-agentbeurten via Codex.
- Gebruik geen `openai-codex/gpt-*` in configuratie. Voer `openclaw doctor --fix` uit om
  verouderde referenties en oude sessieroutepinnen te repareren.
- `agentRuntime.id: "codex"` is optioneel voor normale OpenAI-automodus, maar nuttig
  wanneer een deployment gesloten moet falen als Codex niet beschikbaar is.
- `agentRuntime.id: "pi"` laat een provider of model kiezen voor direct PI-gedrag wanneer
  dat de bedoeling is.
- `/codex ...` bestuurt native Codex app-server-gesprekken vanuit chat.
- ACP/acpx is een apart extern harnesspad. Gebruik het alleen wanneer de gebruiker vraagt
  om ACP/acpx of een externe harnessadapter.

Veelvoorkomende commandoroutering:

| Gebruikersintentie             | Gebruik                                 |
| ------------------------------ | --------------------------------------- |
| De huidige chat koppelen       | `/codex bind [--cwd <path>]`            |
| Een bestaande Codex-thread hervatten | `/codex resume <thread-id>`             |
| Codex-threads weergeven of filteren | `/codex threads [filter]`               |
| Alleen Codex-feedback verzenden | `/codex diagnostics [note]`             |
| Een ACP/acpx-taak starten      | ACP/acpx-sessiecommando's, niet `/codex` |

| Gebruikssituatie                                    | Configureren                                                     | Verifiëren                              | Opmerkingen                        |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime   | `openai/gpt-*` plus ingeschakelde `codex`-plugin                 | `/status` toont `Runtime: OpenAI Codex` | Aanbevolen pad                     |
| Gesloten falen als Codex niet beschikbaar is        | Provider- of model-`agentRuntime.id: "codex"`                    | Beurt faalt in plaats van PI-fallback   | Gebruik voor deployments met alleen Codex |
| Rechtstreeks OpenAI API-key-verkeer via PI          | Provider- of model-`agentRuntime.id: "pi"` en normale OpenAI-auth | `/status` toont PI-runtime              | Gebruik alleen wanneer PI bedoeld is |
| Verouderde configuratie                             | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` herschrijft dit | Schrijf nieuwe configuratie niet op deze manier |
| ACP/acpx Codex-adapter                              | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP-taak-/sessiestatus                  | Staat los van native Codex-harness |

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik `openai/gpt-*`
voor de normale OpenAI-route en `codex/gpt-*` alleen wanneer beeldbegrip
via een begrensde Codex app-server-beurt moet lopen. Gebruik geen
`openai-codex/gpt-*`; doctor herschrijft die verouderde prefix naar `openai/gpt-*`.

## Uitrolpatronen

### Basis-Codex-uitrol

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

### Gemengde provider-uitrol

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

Met deze configuratie gebruikt de `main`-agent zijn normale providerpad en gebruikt de
`codex`-agent Codex app-server.

### Gesloten falende Codex-uitrol

Voor OpenAI-agentbeurten wordt `openai/gpt-*` al naar Codex opgelost wanneer de
gebundelde plugin beschikbaar is. Voeg expliciet runtimebeleid toe wanneer je een geschreven
gesloten-falenregel wilt:

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

Wanneer Codex wordt afgedwongen, faalt OpenClaw vroeg als de Codex-plugin is uitgeschakeld, de
app-server te oud is, of de app-server niet kan starten.

## App-serverbeleid

Standaard start de plugin de door OpenClaw beheerde Codex-binary lokaal met stdio
transport. Stel `appServer.command` alleen in wanneer je bewust een
ander uitvoerbaar bestand wilt uitvoeren. Gebruik WebSocket-transport alleen wanneer er al ergens anders
een app-server draait:

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

Lokale stdio app-server-sessies gebruiken standaard de vertrouwde houding voor lokale operators:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Als lokale Codex-vereisten die
impliciete YOLO-houding niet toestaan, selecteert OpenClaw in plaats daarvan
toegestane guardian-rechten. Wanneer een OpenClaw-sandbox actief is voor de
sessie, versmalt OpenClaw Codex `danger-full-access` naar Codex
`workspace-write`, zodat native Codex-code-modusbeurten binnen de gesandboxte
werkruimte blijven.

Gebruik guardian-modus wanneer je native Codex-auto-review wilt vóór
sandbox-escapes of extra rechten:

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

Guardian-modus breidt uit naar Codex app-server-goedkeuringen, meestal
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` en
`sandbox: "workspace-write"` wanneer de lokale vereisten die waarden toestaan.

Voor elk app-server-veld, de auth-volgorde, omgevingsisolatie, discovery en
timeoutgedrag, zie [Codex harness-referentie](/nl/plugins/codex-harness-reference).

## Opdrachten en diagnostiek

De meegeleverde Plugin registreert `/codex` als slash command op elk kanaal dat
OpenClaw-tekstopdrachten ondersteunt.

Gebruikelijke vormen:

- `/codex status` controleert app-server-connectiviteit, modellen, account,
  rate limits, MCP-servers en Skills.
- `/codex models` toont live Codex app-server-modellen.
- `/codex threads [filter]` toont recente Codex app-server-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een
  bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server de gekoppelde thread te compacten.
- `/codex review` start native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt toestemming voordat Codex-feedback voor de
  gekoppelde thread wordt verzonden.
- `/codex account` toont account- en rate-limitstatus.
- `/codex mcp` toont de status van Codex app-server-MCP-servers.
- `/codex skills` toont Codex app-server-Skills.

Begin voor de meeste supportrapporten met `/diagnostics [note]` in het gesprek
waarin de bug optrad. Dit maakt één Gateway-diagnoserapport en vraagt, voor
Codex harness-sessies, toestemming om de relevante Codex-feedbackbundel te
verzenden. Zie [Diagnostiek exporteren](/nl/gateway/diagnostics) voor het
privacymodel en het gedrag in groepschats.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de
Codex-feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige
Gateway-diagnosebundel.

### Codex-threads lokaal inspecteren

De snelste manier om een slechte Codex-run te inspecteren is vaak de native
Codex-thread direct openen:

```bash
codex resume <thread-id>
```

Haal de thread-id uit het voltooide `/diagnostics`-antwoord, `/codex binding` of
`/codex threads [filter]`.

Voor uploadmechanica en diagnostische grenzen op runtimeniveau, zie
[Codex harness-runtime](/nl/plugins/codex-harness-runtime#codex-feedback-upload).

Auth wordt in deze volgorde geselecteerd:

1. Geordende OpenAI-auth-profielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Bestaande `openai-codex:*`-profiel-id's blijven geldig.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-auth
   nog steeds vereist is.

Wanneer OpenClaw een ChatGPT-abonnementsachtig Codex-auth-profiel ziet, verwijdert
het `CODEX_API_KEY` en `OPENAI_API_KEY` uit het gestarte Codex-childproces. Zo
blijven Gateway-niveau API-sleutels beschikbaar voor embeddings of directe
OpenAI-modellen zonder dat native Codex app-server-beurten per ongeluk via de API
worden gefactureerd. Expliciete Codex-API-sleutelprofielen en lokale
stdio-env-key-fallback gebruiken app-server-login in plaats van overgeërfde
childproces-env. WebSocket app-server-verbindingen ontvangen geen
Gateway-env-API-sleutelfallback; gebruik een expliciet auth-profiel of het eigen
account van de externe app-server.

Als een abonnementsprofiel een Codex-gebruikslimiet bereikt, registreert OpenClaw
de resettijd wanneer Codex die rapporteert en probeert het het volgende geordende
auth-profiel voor dezelfde Codex-run. Wanneer de resettijd is verstreken, komt
het abonnementsprofiel opnieuw in aanmerking zonder het geselecteerde
`openai/gpt-*`-model of de Codex-runtime te wijzigen.

Als een deployment extra omgevingsisolatie nodig heeft, voeg je die variabelen
toe aan `appServer.clearEnv`:

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

`appServer.clearEnv` beïnvloedt alleen het gestarte Codex app-server-childproces.

Codex dynamic tools gebruiken standaard `searchable`-laden. OpenClaw stelt geen
dynamic tools beschikbaar die native Codex-werkruimtebewerkingen dupliceren:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` en `update_plan`.
Resterende OpenClaw-integratietools zoals messaging, sessions, media, Cron,
browser, nodes, Gateway, `heartbeat_respond` en `web_search` zijn beschikbaar via
Codex-tools zoeken onder de namespace `openclaw`, waardoor de initiële
modelcontext kleiner blijft.
`sessions_yield` en alleen-message-tool bronantwoorden blijven direct, omdat dit
turn-control-contracten zijn. Heartbeat-samenwerkingsinstructies vertellen Codex
te zoeken naar `heartbeat_respond` voordat een Heartbeat-beurt wordt beëindigd
wanneer de tool nog niet is geladen.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt
met een aangepaste Codex app-server die uitgestelde dynamic tools niet kan
zoeken, of wanneer je de volledige toolpayload debugt.

Ondersteunde Codex Plugin-velden op topniveau:

| Veld                       | Standaard      | Betekenis                                                                               |
| -------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gebruik `"direct"` om OpenClaw dynamic tools direct in de initiële Codex-toolcontext te plaatsen. |
| `codexDynamicToolsExclude` | `[]`           | Extra OpenClaw dynamic tool-namen die moeten worden weggelaten uit Codex app-server-beurten. |
| `codexPlugins`             | uitgeschakeld  | Native Codex Plugin/app-ondersteuning voor gemigreerde, vanaf bron geïnstalleerde curated plugins. |

Ondersteunde `appServer`-velden:

| Veld                          | Standaard                                             | Betekenis                                                                                                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                             | `"stdio"` start Codex; `"websocket"` verbindt met `url`.                                                                                                                                                                               |
| `command`                     | beheerde Codex-binary                                 | Uitvoerbaar bestand voor stdio-transport. Laat leeg om de beheerde binary te gebruiken; stel dit alleen in voor een expliciete override.                                                                                              |
| `args`                        | `["app-server", "--listen", "stdio://"]`              | Argumenten voor stdio-transport.                                                                                                                                                                                                       |
| `url`                         | niet ingesteld                                        | WebSocket app-server-URL.                                                                                                                                                                                                              |
| `authToken`                   | niet ingesteld                                        | Bearer-token voor WebSocket-transport.                                                                                                                                                                                                 |
| `headers`                     | `{}`                                                  | Extra WebSocket-headers.                                                                                                                                                                                                               |
| `clearEnv`                    | `[]`                                                  | Extra namen van omgevingsvariabelen die uit het gestarte stdio app-server-proces worden verwijderd nadat OpenClaw de overgeërfde omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's per-agent Codex-isolatie bij lokale starts. |
| `requestTimeoutMs`            | `60000`                                               | Timeout voor app-server-control-plane-aanroepen.                                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs` | `60000`                                               | Stille periode na een turn-scoped Codex app-server-request terwijl OpenClaw wacht op `turn/completed`. Verhoog dit voor trage post-tool- of status-only-synthesefasen.                                                                 |
| `mode`                        | `"yolo"` tenzij lokale Codex-vereisten YOLO niet toestaan | Preset voor YOLO- of guardian-reviewed uitvoering. Lokale stdio-vereisten die `danger-full-access`, `never`-goedkeuring of de `user`-reviewer weglaten, maken de impliciete standaard guardian.                                      |
| `approvalPolicy`              | `"never"` of een toegestane guardian-goedkeuringspolicy | Native Codex-goedkeuringspolicy die naar thread start/resume/turn wordt gestuurd. Guardian-standaarden geven de voorkeur aan `"on-request"` wanneer toegestaan.                                                                        |
| `sandbox`                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar thread start/resume wordt gestuurd. Guardian-standaarden geven de voorkeur aan `"workspace-write"` wanneer toegestaan, anders `"read-only"`. Wanneer een OpenClaw-sandbox actief is, wordt `danger-full-access` versmald naar `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` of een toegestane guardian-reviewer          | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten reviewen wanneer toegestaan, anders `guardian_subagent` of `user`. `guardian_subagent` blijft een legacy-alias.                                                   |
| `serviceTier`                 | niet ingesteld                                        | Optionele Codex app-server-servicetier. `"priority"` schakelt fast-mode-routing in, `"flex"` vraagt flex-verwerking aan, `null` wist de override, en legacy `"fast"` wordt geaccepteerd als `"priority"`.                             |

OpenClaw-eigen dynamische toolaanroepen worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: Codex `item/tool/call`-requests gebruiken standaard
een OpenClaw-watchdog van 30 seconden. Een positief `timeoutMs`-argument per
aanroep verlengt of verkort dat specifieke toolbudget. De tool `image_generate`
gebruikt ook `agents.defaults.imageGenerationModel.timeoutMs` wanneer de
toolaanroep geen eigen timeout opgeeft, en de media-begripstool `image` gebruikt
`tools.media.image.timeoutSeconds` of de media-standaard van 60 seconden.
Dynamische toolbudgetten zijn afgetopt op 600000 ms. Bij een timeout breekt
OpenClaw het toolsignaal af waar dat wordt ondersteund en retourneert het een
mislukte dynamische-toolrespons aan Codex, zodat de beurt kan doorgaan in plaats
van de sessie in `processing` achter te laten.

Nadat OpenClaw reageert op een Codex app-server-request met beurtbereik,
verwacht de harness ook dat Codex de native beurt afrondt met `turn/completed`.
Als de app-server na die respons stil blijft gedurende
`appServer.turnCompletionIdleTimeoutMs`, onderbreekt OpenClaw naar beste vermogen
de Codex-beurt, registreert het een diagnostische timeout en geeft het de
OpenClaw-sessielane vrij zodat vervolgchatberichten niet achter een verouderde
native beurt in de wachtrij blijven staan. Elke niet-terminale notificatie voor
dezelfde beurt, inclusief `rawResponseItem/completed`, schakelt die korte
watchdog uit omdat Codex heeft aangetoond dat de beurt nog actief is; de langere
terminale watchdog blijft echt vastgelopen beurten beschermen. Timeoutdiagnostiek
bevat de laatste app-server-notificatiemethode en, voor ruwe
assistentresponsitems, het itemtype, de rol, id en een begrensde preview van de
assistenttekst.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Configuratie
heeft de voorkeur voor herhaalbare deployments, omdat dit het Plugin-gedrag in
hetzelfde beoordeelde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Native Codex-plugins

Ondersteuning voor native Codex-plugins gebruikt de eigen app- en
Plugin-mogelijkheden van Codex app-server in dezelfde Codex-thread als de
OpenClaw-harnessbeurt. OpenClaw vertaalt Codex-plugins niet naar synthetische
`codex_plugin_*` dynamische OpenClaw-tools.

`codexPlugins` heeft alleen invloed op sessies die de native Codex-harness
selecteren. Het heeft geen effect op PI-runs, normale OpenAI-provider-runs,
ACP-gespreksbindings of andere harnesses.

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
            allow_destructive_actions: true,
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

Thread-appconfiguratie wordt berekend wanneer OpenClaw een Codex-harnesssessie
opzet of een verouderde Codex-threadbinding vervangt. Deze wordt niet bij elke
beurt opnieuw berekend. Gebruik na het wijzigen van `codexPlugins` `/new`,
`/reset` of herstart de gateway, zodat toekomstige Codex-harnesssessies starten
met de bijgewerkte appset.

Voor migratiegeschiktheid, app-inventaris, beleid voor destructieve acties,
elicitations en native Plugin-diagnostiek, zie
[Native Codex-plugins](/nl/plugins/codex-native-plugins).

## Computergebruik

Computergebruik wordt behandeld in een eigen installatiegids:
[Codex-computergebruik](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktop-control-app niet en voert zelf geen
desktopacties uit. Het bereidt Codex app-server voor, controleert dat de
`computer-use` MCP-server beschikbaar is en laat Codex vervolgens de native
MCP-toolaanroepen bezitten tijdens Codex-modusbeurten.

## Runtimegrenzen

De Codex-harness wijzigt alleen de low-level ingebedde agentuitvoerder.

- Dynamische OpenClaw-tools worden ondersteund. Codex vraagt OpenClaw om die
  tools uit te voeren, waardoor OpenClaw in het uitvoeringspad blijft.
- Codex-native shell-, patch-, MCP- en native apptools zijn eigendom van Codex.
  OpenClaw kan geselecteerde native gebeurtenissen observeren of blokkeren via
  de ondersteunde relay, maar herschrijft geen native toolargumenten.
- Codex bezit native Compaction. OpenClaw houdt een transcriptspiegel bij voor
  kanaalgeschiedenis, zoeken, `/new`, `/reset` en toekomstige model- of
  harnesswisselingen.
- Mediageneratie, mediabegrip, TTS, goedkeuringen en output van messaging-tools
  blijven via de bijbehorende OpenClaw-provider-/modelinstellingen lopen.
- `tool_result_persist` is van toepassing op OpenClaw-eigen
  transcripttoolresultaten, niet op Codex-native toolresultaatrecords.

Voor hooklagen, ondersteunde V1-oppervlakken, native permissieafhandeling,
wachtrijsturing, uploadmechanica voor Codex-feedback en Compaction-details, zie
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime).

## Probleemoplossing

**Codex verschijnt niet als een normale `/model`-provider:** dat is verwacht
voor nieuwe configuraties. Selecteer een `openai/gpt-*`-model, schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow` `codex`
uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** zorg dat de modelreferentie
`openai/gpt-*` is op de officiële OpenAI-provider en dat de Codex-Plugin is
geïnstalleerd en ingeschakeld. Als je tijdens het testen strikt bewijs nodig
hebt, stel dan provider- of model-`agentRuntime.id: "codex"` in. Een afgedwongen
Codex-runtime faalt in plaats van terug te vallen op PI.

**Legacy `openai-codex/*`-configuratie blijft bestaan:** voer
`openclaw doctor --fix` uit. Doctor herschrijft legacy modelreferenties naar
`openai/*`, verwijdert verouderde sessie- en volledige-agent-runtimepins en
behoudt bestaande auth-profile-overschrijvingen.

**De app-server wordt geweigerd:** gebruik Codex app-server `0.125.0` of nieuwer.
Prereleases met dezelfde versie of versies met buildsuffix, zoals
`0.125.0-alpha.2` of `0.125.0+custom`, worden geweigerd omdat OpenClaw test op
de stabiele `0.125.0`-protocolondergrens.

**`/codex status` kan geen verbinding maken:** controleer dat de gebundelde
`codex`-Plugin is ingeschakeld, dat `plugins.allow` deze bevat wanneer een
allowlist is geconfigureerd, en dat eventuele aangepaste `appServer.command`,
`url`, `authToken` of headers geldig zijn.

**Modelontdekking is traag:** verlaag
`plugins.entries.codex.config.discovery.timeoutMs` of schakel ontdekking uit. Zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference#model-discovery).

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`,
`authToken`, headers en dat de externe app-server dezelfde Codex
app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht, tenzij provider- of
modelruntimebeleid het naar een andere harness routeert. Gewone
niet-OpenAI-providerreferenties blijven in `auto`-modus op hun normale
providerpad.

**Computergebruik is geïnstalleerd, maar tools worden niet uitgevoerd:**
controleer `/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan `/new` of `/reset`; als dit
blijft bestaan, herstart dan de gateway om verouderde native hookregistraties te
wissen. Zie
[Codex-computergebruik](/nl/plugins/codex-computer-use#troubleshooting).

## Gerelateerd

- [Codex-harnessreferentie](/nl/plugins/codex-harness-reference)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex-computergebruik](/nl/plugins/codex-computer-use)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Agentharness-plugins](/nl/plugins/sdk-agent-harness)
- [Plugin-hooks](/nl/plugins/hooks)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Status](/nl/cli/status)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
