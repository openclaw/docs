---
read_when:
    - Je wilt het meegeleverde Codex app-server-harnas gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat uitrollen met alleen Codex mislukken in plaats van terug te vallen op PI
summary: Voer OpenClaw-beurten van ingebedde agents uit via de meegeleverde Codex app-server-harness
title: Codex-harnas
x-i18n:
    generated_at: "2026-05-12T08:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Met de meegeleverde `codex` Plugin kan OpenClaw ingebedde OpenAI-agentbeurten
uitvoeren via de Codex-app-server in plaats van de ingebouwde PI-harness.

Gebruik de Codex-harness wanneer je wilt dat Codex de agentensessie op laag
niveau beheert: native hervatting van gespreksthreads, native voortzetting van
hulpmiddelen, native Compaction en uitvoering via app-server. OpenClaw blijft
chatkanalen, sessiebestanden, modelselectie, dynamische hulpmiddelen van
OpenClaw, goedkeuringen, medialevering en de zichtbare gespiegelde transcriptie
beheren.

De normale installatie gebruikt canonieke OpenAI-modelverwijzingen zoals
`openai/gpt-5.5`. Configureer geen `openai-codex/gpt-*`-modelverwijzingen. Plaats
de volgorde voor OpenAI-agentauthenticatie onder `auth.order.openai`; oudere
`openai-codex:*`-profielen en `auth.order.openai-codex`-vermeldingen blijven
ondersteund voor bestaande installaties.

OpenClaw start Codex-app-serverthreads met native Codex-codemodus en
alleen-codemodus ingeschakeld. Daardoor blijven uitgestelde/doorzoekbare
dynamische hulpmiddelen van OpenClaw binnen Codex' eigen code-uitvoering en
zoekoppervlak voor hulpmiddelen, in plaats van boven op Codex een zoekwrapper
voor hulpmiddelen in PI-stijl toe te voegen.

Voor de bredere scheiding tussen model, provider en uitvoeringsomgeving begin je
met [Agent-uitvoeringsomgevingen](/nl/concepts/agent-runtimes). Kort gezegd:
`openai/gpt-5.5` is de modelverwijzing, `codex` is de uitvoeringsomgeving, en
Telegram, Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Vereisten

- OpenClaw met de meegeleverde `codex` Plugin beschikbaar.
- Als je configuratie `plugins.allow` gebruikt, neem dan `codex` op.
- Codex-app-server `0.125.0` of nieuwer. De meegeleverde Plugin beheert
  standaard een compatibel binair bestand voor de Codex-app-server, dus lokale
  `codex`-opdrachten op `PATH` hebben geen invloed op het normale starten van de
  harness.
- Codex-authenticatie beschikbaar via `openclaw models auth login --provider openai-codex`,
  een app-serveraccount in de Codex-home van de agent, of een expliciet
  authenticatieprofiel met Codex API-sleutel.

Voor authenticatievolgorde, omgevingsisolatie, aangepaste app-serveropdrachten,
modelontdekking en alle configuratievelden, zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Snelstart

Voor de meeste gebruikers die Codex in OpenClaw willen, is dit het gewenste pad:
meld je aan met een ChatGPT/Codex-abonnement, schakel de meegeleverde `codex`
Plugin in en gebruik een canonieke `openai/gpt-*`-modelverwijzing.

Aanmelden met Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Schakel de meegeleverde `codex` Plugin in en selecteer een OpenAI-agentmodel:

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

Start de Gateway opnieuw nadat je de Plugin-configuratie hebt gewijzigd. Als een
bestaande chat al een sessie heeft, gebruik dan `/new` of `/reset` voordat je
wijzigingen in de uitvoeringsomgeving test, zodat de volgende beurt de harness
bepaalt op basis van de huidige configuratie.

## Configuratie

De snelstartconfiguratie is de minimaal werkbare Codex-harnessconfiguratie. Stel
Codex-harnessopties in de OpenClaw-configuratie in en gebruik de CLI alleen voor
Codex-authenticatie:

| Behoefte                              | In te stellen                                                                    | Waar                                      |
| ------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------- |
| De harness inschakelen                | `plugins.entries.codex.enabled: true`                                            | OpenClaw-configuratie                    |
| Een toegestane Plugin-installatie behouden | Neem `codex` op in `plugins.allow`                                               | OpenClaw-configuratie                    |
| OpenAI-agentbeurten via Codex routeren | `agents.defaults.model` of `agents.list[].model` als `openai/gpt-*`              | OpenClaw-agentconfiguratie               |
| Aanmelden met Codex OAuth             | `openclaw models auth login --provider openai-codex`                             | CLI-authenticatieprofiel                 |
| API-sleutelback-up toevoegen voor Codex-uitvoeringen | `openai:*`-API-sleutelprofiel vermeld na abonnementsauthenticatie in `auth.order.openai` | CLI-authenticatieprofiel + OpenClaw-configuratie |
| Gesloten falen wanneer Codex niet beschikbaar is | Provider- of model-`agentRuntime.id: "codex"`                                    | OpenClaw-model-/providerconfiguratie     |
| Rechtstreeks OpenAI API-verkeer gebruiken | Provider- of model-`agentRuntime.id: "pi"` met normale OpenAI-authenticatie      | OpenClaw-model-/providerconfiguratie     |
| App-servergedrag afstemmen            | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-configuratie                |
| Native Codex-Plugin-apps inschakelen  | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-configuratie                |
| Codex Computer Use inschakelen        | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-configuratie                |

Gebruik `openai/gpt-*`-modelverwijzingen voor door Codex ondersteunde
OpenAI-agentbeurten. Geef de voorkeur aan `auth.order.openai` voor een volgorde
met abonnement eerst en API-sleutel als back-up. Bestaande
`openai-codex:*`-authenticatieprofielen en `auth.order.openai-codex` blijven
geldig, maar schrijf geen nieuwe `openai-codex/gpt-*`-modelverwijzingen.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In die vorm worden beide profielen nog steeds via Codex uitgevoerd voor
`openai/gpt-*`-agentbeurten. De API-sleutel is alleen een
authenticatieterugval, geen verzoek om over te schakelen naar PI of gewone
OpenAI Responses.

De rest van deze pagina behandelt veelvoorkomende varianten waaruit gebruikers
moeten kiezen: uitrolvorm, routering met gesloten falen, goedkeuringsbeleid voor
bewakers, native Codex-plugins en Computer Use. Voor volledige optielijsten,
standaardwaarden, enums, ontdekking, omgevingsisolatie, time-outs en
app-servertransportvelden, zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Codex-uitvoeringsomgeving verifiëren

Gebruik `/status` in de chat waarin je Codex verwacht. Een door Codex
ondersteunde OpenAI-agentbeurt toont:

```text
Runtime: OpenAI Codex
```

Controleer daarna de status van de Codex-app-server:

```text
/codex status
/codex models
```

`/codex status` rapporteert app-serverconnectiviteit, account,
snelheidslimieten, MCP-servers en Skills. `/codex models` vermeldt de live
Codex-app-servercatalogus voor de harness en het account. Als `/status`
onverwacht is, zie [Problemen oplossen](#troubleshooting).

## Routering en modelselectie

Houd providerverwijzingen en beleid voor uitvoeringsomgeving gescheiden:

- Gebruik `openai/gpt-*` voor OpenAI-agentbeurten via Codex.
- Gebruik `openai-codex/gpt-*` niet in configuratie. Voer `openclaw doctor --fix`
  uit om verouderde verwijzingen en vastgezette oude sessieroutes te herstellen.
- `agentRuntime.id: "codex"` is optioneel voor de normale automatische
  OpenAI-modus, maar nuttig wanneer een uitrol gesloten moet falen als Codex niet
  beschikbaar is.
- `agentRuntime.id: "pi"` kiest een provider of model voor rechtstreeks
  PI-gedrag wanneer dat de bedoeling is.
- `/codex ...` stuurt native Codex-app-servergesprekken vanuit chat aan.
- ACP/acpx is een apart extern harness-pad. Gebruik het alleen wanneer de
  gebruiker om ACP/acpx of een externe harnessadapter vraagt.

Veelgebruikte opdrachtroutering:

| Gebruikersintentie               | Gebruik                                 |
| -------------------------------- | --------------------------------------- |
| De huidige chat koppelen         | `/codex bind [--cwd <path>]`            |
| Een bestaande Codex-thread hervatten | `/codex resume <thread-id>`             |
| Codex-threads weergeven of filteren | `/codex threads [filter]`               |
| Alleen Codex-feedback sturen     | `/codex diagnostics [note]`             |
| Een ACP/acpx-taak starten        | ACP/acpx-sessieopdrachten, niet `/codex` |

| Gebruiksscenario                                    | Configureren                                                     | Verifiëren                              | Notities                           |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-uitvoeringsomgeving | `openai/gpt-*` plus ingeschakelde `codex` Plugin                 | `/status` toont `Runtime: OpenAI Codex` | Aanbevolen pad                     |
| Gesloten falen als Codex niet beschikbaar is        | Provider- of model-`agentRuntime.id: "codex"`                    | Beurt mislukt in plaats van PI-terugval | Gebruik voor alleen-Codex-uitrollen |
| Rechtstreeks OpenAI API-sleutelverkeer via PI       | Provider- of model-`agentRuntime.id: "pi"` en normale OpenAI-authenticatie | `/status` toont PI-uitvoeringsomgeving  | Alleen gebruiken wanneer PI de bedoeling is |
| Verouderde configuratie                             | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` herschrijft deze | Schrijf geen nieuwe configuratie op deze manier |
| ACP/acpx-Codex-adapter                              | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP-taak-/sessiestatus                  | Los van de native Codex-harness    |

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik
`openai/gpt-*` voor de normale OpenAI-route en `codex/gpt-*` alleen wanneer
beeldbegrip via een begrensde Codex-app-serverbeurt moet verlopen. Gebruik geen
`openai-codex/gpt-*`; doctor herschrijft die verouderde prefix naar
`openai/gpt-*`.

## Uitrolpatronen

### Basisuitrol van Codex

Gebruik de snelstartconfiguratie wanneer alle OpenAI-agentbeurten standaard
Codex moeten gebruiken.

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

### Uitrol met gemengde providers

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

Met deze configuratie gebruikt de `main`-agent zijn normale providerpad en
gebruikt de `codex`-agent de Codex-app-server.

### Codex-uitrol met gesloten falen

Voor OpenAI-agentbeurten wordt `openai/gpt-*` al naar Codex herleid wanneer de
meegeleverde Plugin beschikbaar is. Voeg expliciet beleid voor de
uitvoeringsomgeving toe wanneer je een vastgelegde regel voor gesloten falen
wilt:

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

Met Codex afgedwongen faalt OpenClaw vroeg als de Codex-Plugin is uitgeschakeld,
de app-server te oud is of de app-server niet kan starten.

## App-serverbeleid

Standaard start de Plugin het door OpenClaw beheerde binaire bestand van Codex
lokaal met stdio-transport. Stel `appServer.command` alleen in wanneer je
bewust een ander uitvoerbaar bestand wilt uitvoeren. Gebruik WebSocket-transport
alleen wanneer elders al een app-server draait:

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
impliciete YOLO-houding niet toestaan, selecteert OpenClaw in plaats daarvan toegestane guardian-machtigingen.
Wanneer een OpenClaw-sandbox actief is voor de sessie, beperkt OpenClaw Codex
`danger-full-access` tot Codex `workspace-write`, zodat native Codex-code-modusbeurten
binnen de sandboxed werkruimte blijven.

Gebruik guardian-modus wanneer je native automatische Codex-beoordeling wilt vóór sandbox-ontsnappingen
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

Guardian-modus wordt uitgebreid naar Codex app-server-goedkeuringen, meestal
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` en
`sandbox: "workspace-write"` wanneer de lokale vereisten die waarden toestaan.

Zie [Codex-harnessreferentie](/nl/plugins/codex-harness-reference) voor elk app-server-veld, de authenticatievolgorde, omgevingsisolatie, detectie en
time-outgedrag.

## Opdrachten en diagnostiek

De meegeleverde Plugin registreert `/codex` als slash-opdracht op elk kanaal dat
OpenClaw-tekstopdrachten ondersteunt.

Veelgebruikte vormen:

- `/codex status` controleert app-server-connectiviteit, modellen, account, snelheidslimieten,
  MCP-servers en Skills.
- `/codex models` vermeldt live Codex app-server-modellen.
- `/codex threads [filter]` vermeldt recente Codex app-server-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een
  bestaande Codex-thread.
- `/codex compact` vraagt de Codex app-server om de gekoppelde thread te compacteren.
- `/codex review` start native Codex-beoordeling voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om bevestiging voordat Codex-feedback voor de
  gekoppelde thread wordt verzonden.
- `/codex account` toont account- en snelheidslimietstatus.
- `/codex mcp` vermeldt de status van Codex app-server-MCP-servers.
- `/codex skills` vermeldt Codex app-server-Skills.

Begin voor de meeste ondersteuningsrapporten met `/diagnostics [note]` in het gesprek
waarin de bug optrad. Dit maakt één Gateway-diagnoserapport en vraagt, voor Codex
harness-sessies, om goedkeuring om de relevante Codex-feedbackbundel te verzenden.
Zie [Diagnostiek exporteren](/nl/gateway/diagnostics) voor het privacymodel en het gedrag
in groepschats.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex
feedback-upload wilt voor de momenteel gekoppelde thread zonder de volledige Gateway
diagnosebundel.

### Codex-threads lokaal inspecteren

De snelste manier om een mislukte Codex-run te inspecteren is vaak om de native Codex-thread
direct te openen:

```bash
codex resume <thread-id>
```

Haal de thread-id op uit het voltooide `/diagnostics`-antwoord, `/codex binding` of
`/codex threads [filter]`.

Zie voor uploadmechanica en diagnosegrenzen op runtimeniveau
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime#codex-feedback-upload).

Authenticatie wordt in deze volgorde geselecteerd:

1. Geordende OpenAI-authenticatieprofielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Bestaande `openai-codex:*`-profiel-id's blijven geldig.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-authenticatie
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authenticatieprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Zo blijven
API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex app-server-beurten per ongeluk via de API worden gefactureerd.
Expliciete Codex-API-sleutelprofielen en lokale stdio-env-key-fallback gebruiken app-server-login
in plaats van overgenomen childproces-env. WebSocket app-server-verbindingen
ontvangen geen Gateway-env-API-sleutelfallback; gebruik een expliciet authenticatieprofiel of het
eigen account van de externe app-server.

Als een abonnementsprofiel een Codex-gebruikslimiet bereikt, registreert OpenClaw de resettijd
wanneer Codex die rapporteert en probeert het het volgende geordende authenticatieprofiel voor dezelfde
Codex-run. Wanneer de resettijd is verstreken, komt het abonnementsprofiel weer in aanmerking
zonder het geselecteerde `openai/gpt-*`-model of de Codex-runtime te wijzigen.

Als een deployment extra omgevingsisolatie nodig heeft, voeg die variabelen dan toe aan
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

Dynamische Codex-tools gebruiken standaard `searchable` laden. OpenClaw stelt geen
dynamische tools beschikbaar die native Codex-werkruimtebewerkingen dupliceren: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` en `update_plan`. Resterende OpenClaw
integratietools zoals messaging, sessions, media, cron, browser, nodes,
gateway, `heartbeat_respond` en `web_search` zijn beschikbaar via Codex-toolzoekopdrachten
onder de `openclaw`-namespace, waardoor de initiële modelcontext
kleiner blijft.
`sessions_yield` en message-tool-only bronantwoorden blijven direct omdat dit
turn-control-contracten zijn. Heartbeat-samenwerkingsinstructies vertellen Codex om
naar `heartbeat_respond` te zoeken voordat een Heartbeat-beurt wordt beëindigd wanneer de tool
nog niet is geladen.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt met een aangepaste Codex
app-server die uitgestelde dynamische tools niet kan zoeken, of wanneer je de volledige
toolpayload debugt.

Ondersteunde Codex Plugin-velden op topniveau:

| Veld                       | Standaard      | Betekenis                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gebruik `"direct"` om OpenClaw dynamische tools direct in de initiële Codex-toolcontext te plaatsen. |
| `codexDynamicToolsExclude` | `[]`           | Extra OpenClaw dynamische toolnamen die uit Codex app-server-beurten moeten worden weggelaten. |
| `codexPlugins`             | uitgeschakeld  | Native Codex-plugin/app-ondersteuning voor gemigreerde source-geïnstalleerde curated plugins. |

Ondersteunde `appServer`-velden:

| Veld                          | Standaard                                               | Betekenis                                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                               | `"stdio"` spawnt Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                       |
| `command`                     | beheerde Codex-binary                                   | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om de beheerde binary te gebruiken; stel het alleen in voor een expliciete override.                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`                | Argumenten voor stdio-transport.                                                                                                                                                                                                        |
| `url`                         | niet ingesteld                                          | WebSocket app-server-URL.                                                                                                                                                                                                               |
| `authToken`                   | niet ingesteld                                          | Bearer-token voor WebSocket-transport.                                                                                                                                                                                                  |
| `headers`                     | `{}`                                                    | Extra WebSocket-headers.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                    | Extra namen van omgevingsvariabelen die uit het gespawnde stdio app-server-proces worden verwijderd nadat OpenClaw de overgenomen omgeving heeft opgebouwd. `CODEX_HOME` en `HOME` zijn gereserveerd voor OpenClaw's per-agent Codex-isolatie bij lokale starts. |
| `requestTimeoutMs`            | `60000`                                                 | Time-out voor control-plane-aanroepen naar de app-server.                                                                                                                                                                               |
| `turnCompletionIdleTimeoutMs` | `60000`                                                 | Stiltevenster na een turn-scoped Codex app-server-request terwijl OpenClaw wacht op `turn/completed`. Verhoog dit voor langzame post-tool- of status-only-synthesefasen.                                                               |
| `mode`                        | `"yolo"` tenzij lokale Codex-vereisten YOLO niet toestaan | Preset voor YOLO- of door guardian beoordeelde uitvoering. Lokale stdio-vereisten die `danger-full-access`, `never`-goedkeuring of de `user`-beoordelaar weglaten, maken de impliciete standaard guardian.                              |
| `approvalPolicy`              | `"never"` of een toegestane guardian-goedkeuringspolicy | Native Codex-goedkeuringspolicy die naar thread start/resume/turn wordt verzonden. Guardian-standaarden geven de voorkeur aan `"on-request"` wanneer toegestaan.                                                                         |
| `sandbox`                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar thread start/resume wordt verzonden. Guardian-standaarden geven de voorkeur aan `"workspace-write"` wanneer toegestaan, anders `"read-only"`. Wanneer een OpenClaw-sandbox actief is, wordt `danger-full-access` beperkt tot `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` of een toegestane guardian-beoordelaar         | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer toegestaan, anders `guardian_subagent` of `user`. `guardian_subagent` blijft een legacy-alias.                                                  |
| `serviceTier`                 | niet ingesteld                                          | Optionele Codex app-server-servicetier. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flex-verwerking aan, `null` wist de override en legacy `"fast"` wordt geaccepteerd als `"priority"`.                              |

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: Codex `item/tool/call`-aanvragen gebruiken standaard een
OpenClaw-watchdog van 30 seconden. Een positief per-call `timeoutMs`-argument verlengt
of verkort dat specifieke toolbudget. De `image_generate`-tool gebruikt ook
`agents.defaults.imageGenerationModel.timeoutMs` wanneer de toolaanroep geen eigen
time-out opgeeft, en de media-understanding `image`-tool gebruikt
`tools.media.image.timeoutSeconds` of de media-standaard van 60 seconden. Dynamische
toolbudgetten worden afgetopt op 600000 ms. Bij een time-out breekt OpenClaw het
toolsignaal af waar dat wordt ondersteund en retourneert het een mislukte
dynamic-tool-respons aan Codex, zodat de beurt kan doorgaan in plaats van de sessie in
`processing` achter te laten.

Nadat OpenClaw reageert op een Codex app-server-aanvraag met beurtbereik, verwacht de
harness ook dat Codex de native beurt afrondt met `turn/completed`. Als de app-server
na die respons gedurende `appServer.turnCompletionIdleTimeoutMs` stil blijft, onderbreekt
OpenClaw naar beste vermogen de Codex-beurt, registreert het een diagnostische time-out
en geeft het de OpenClaw-sessielane vrij, zodat vervolgchatberichten niet achter een
verouderde native beurt in de wachtrij komen. Elke niet-terminale notificatie voor
dezelfde beurt, inclusief `rawResponseItem/completed`, schakelt die korte watchdog uit
omdat Codex heeft bewezen dat de beurt nog leeft; de langere terminale watchdog blijft
daadwerkelijk vastgelopen beurten beschermen. Globale app-servernotificaties, zoals
rate-limit-updates, resetten de voortgang van de beurt-inactiviteit niet. Wanneer Codex
een voltooid `agentMessage`-item uitzendt en daarna stil blijft zonder `turn/completed`,
behandelt OpenClaw de assistentuitvoer als effectief voltooid, onderbreekt het naar beste
vermogen de native Codex-beurt en geeft het de sessielane vrij. Time-outdiagnostiek bevat
de laatste app-servernotificatiemethode en, voor ruwe assistentresponsitems, het itemtype,
de rol, id en een begrensde voorbeeldweergave van de assistenttekst.

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
de voorkeur voor herhaalbare deployments omdat dit het Plugin-gedrag in hetzelfde
gereviewde bestand houdt als de rest van de Codex-harnessinstelling.

## Native Codex-plugins

Native Codex-Plugin-ondersteuning gebruikt de eigen app- en Plugin-mogelijkheden van
Codex app-server in dezelfde Codex-thread als de OpenClaw-harnessbeurt. OpenClaw vertaalt
Codex-plugins niet naar synthetische `codex_plugin_*` dynamische OpenClaw-tools.

`codexPlugins` is alleen van invloed op sessies die de native Codex-harness selecteren.
Het heeft geen effect op PI-runs, normale OpenAI-provider-runs, ACP-gespreksbindingen
of andere harnesses.

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

Thread-appconfiguratie wordt berekend wanneer OpenClaw een Codex-harnesssessie opzet
of een verouderde Codex-threadbinding vervangt. Deze wordt niet bij elke beurt opnieuw
berekend. Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset` of herstart de
Gateway zodat toekomstige Codex-harnesssessies starten met de bijgewerkte appset.

Zie voor migratiegeschiktheid, appinventaris, beleid voor destructieve acties,
elicitations en native Plugin-diagnostiek
[Native Codex-plugins](/nl/plugins/codex-native-plugins).

## Computer Use

Computer Use wordt behandeld in een eigen installatiegids:
[Codex Computer Use](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktop-control-app niet en voert zelf geen
desktopacties uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is en laat Codex vervolgens eigenaar zijn van de
native MCP-toolaanroepen tijdens Codex-modusbeurten.

## Runtimegrenzen

De Codex-harness wijzigt alleen de low-level ingebedde agentexecutor.

- Dynamische OpenClaw-tools worden ondersteund. Codex vraagt OpenClaw om die tools uit
  te voeren, waardoor OpenClaw in het uitvoeringspad blijft.
- Codex-native shell-, patch-, MCP- en native app-tools zijn eigendom van Codex.
  OpenClaw kan geselecteerde native events observeren of blokkeren via de ondersteunde
  relay, maar herschrijft native toolargumenten niet.
- Codex is eigenaar van native compaction. OpenClaw houdt een transcriptspiegel bij voor
  kanaalgeschiedenis, zoeken, `/new`, `/reset` en toekomstig wisselen van model of harness.
- Mediageneratie, mediabegrip, TTS, goedkeuringen en messaging-tool-uitvoer blijven via
  de bijpassende OpenClaw-provider-/modelinstellingen lopen.
- `tool_result_persist` geldt voor transcripttoolresultaten die eigendom zijn van
  OpenClaw, niet voor Codex-native toolresultaatrecords.

Zie voor hook-lagen, ondersteunde V1-oppervlakken, native toestemmingsafhandeling,
wachtrijsturing, mechanica voor Codex-feedbackupload en details over compaction
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime).

## Problemen oplossen

**Codex verschijnt niet als een normale `/model`-provider:** dat is verwacht voor nieuwe
configuraties. Selecteer een `openai/gpt-*`-model, schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow` `codex` uitsluit.

**OpenClaw gebruikt PI in plaats van Codex:** zorg dat de modelreferentie
`openai/gpt-*` is op de officiële OpenAI-provider en dat de Codex-Plugin is geïnstalleerd
en ingeschakeld. Als je strikt bewijs nodig hebt tijdens het testen, stel dan provider- of
model-`agentRuntime.id: "codex"` in. Een geforceerde Codex-runtime faalt in plaats van
terug te vallen op PI.

**Verouderde `openai-codex/*`-configuratie blijft bestaan:** voer
`openclaw doctor --fix` uit. Doctor herschrijft verouderde modelreferenties naar
`openai/*`, verwijdert verouderde runtime-pins voor sessies en volledige agents, en behoudt
bestaande auth-profile-overschrijvingen.

**De app-server wordt geweigerd:** gebruik Codex app-server `0.125.0` of nieuwer.
Prereleases met dezelfde versie of build-suffixversies zoals `0.125.0-alpha.2` of
`0.125.0+custom` worden geweigerd omdat OpenClaw de stabiele protocolvloer `0.125.0` test.

**`/codex status` kan geen verbinding maken:** controleer of de gebundelde `codex`-Plugin
is ingeschakeld, of `plugins.allow` deze bevat wanneer een allowlist is geconfigureerd, en
of eventuele aangepaste `appServer.command`, `url`, `authToken` of headers geldig zijn.

**Modeldetectie is traag:** verlaag
`plugins.entries.codex.config.discovery.timeoutMs` of schakel detectie uit. Zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference#model-discovery).

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`,
headers en of de externe app-server dezelfde Codex app-server-protocolversie spreekt.

**Een niet-Codex-model gebruikt PI:** dat is verwacht tenzij provider- of modelruntimebeleid
het naar een andere harness routeert. Gewone niet-OpenAI-providerreferenties blijven in
`auto`-modus op hun normale providerpad.

**Computer Use is geïnstalleerd maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan `/new` of `/reset`; als het probleem
aanhoudt, herstart dan de Gateway om verouderde native hook-registraties te wissen. Zie
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
