---
read_when:
    - Je hebt elk Codex-harness-configuratieveld nodig
    - Je wijzigt het transport-, authenticatie-, detectie- of timeoutgedrag van de app-server
    - Je debugt het opstarten van het Codex-testharnas, modeldetectie of omgevingsisolatie
summary: Naslaginformatie over configuratie, authenticatie, detectie en appserver voor het Codex-harnas
title: Referentie voor het Codex-harnas
x-i18n:
    generated_at: "2026-05-11T20:38:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Deze referentie behandelt de gedetailleerde configuratie voor de gebundelde `codex`
plugin. Voor installatie- en routeringsbeslissingen begint u met
[Codex harness](/nl/plugins/codex-harness).

## Configuratieoppervlak van de Plugin

Alle instellingen van de Codex harness staan onder `plugins.entries.codex.config`.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Ondersteunde velden op het hoogste niveau:

| Veld                       | Standaard                | Betekenis                                                                                                                                  |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | ingeschakeld             | Instellingen voor modeldetectie voor Codex app-server `model/list`.                                                                        |
| `appServer`                | beheerde stdio app-server | Instellingen voor transport, opdracht, auth, goedkeuring, sandbox en time-out.                                                             |
| `codexDynamicToolsLoading` | `"searchable"`           | Gebruik `"direct"` om dynamische OpenClaw-tools rechtstreeks in de initiële Codex-toolcontext te plaatsen.                                  |
| `codexDynamicToolsExclude` | `[]`                     | Extra namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-server-beurten.                                       |
| `codexPlugins`             | uitgeschakeld            | Native Codex-plugin-/app-ondersteuning voor gemigreerde, uit broncode geïnstalleerde curated plugins. Zie [Native Codex-plugins](/nl/plugins/codex-native-plugins). |
| `computerUse`              | uitgeschakeld            | Instelling voor Codex Computer Use. Zie [Codex Computer Use](/nl/plugins/codex-computer-use).                                                  |

## App-servertransport

Standaard start OpenClaw de beheerde Codex-binary die met de gebundelde
plugin wordt meegeleverd:

```bash
codex app-server --listen stdio://
```

Zo blijft de app-serverversie gekoppeld aan de gebundelde `codex` plugin in plaats van
aan welke afzonderlijke Codex CLI toevallig lokaal is geïnstalleerd. Stel
`appServer.command` alleen in wanneer u bewust een ander uitvoerbaar bestand
wilt draaien.

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
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Ondersteunde `appServer`-velden:

| Veld                          | Standaard                                              | Betekenis                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                |
| `command`                     | beheerde Codex-binary                                  | Uitvoerbaar bestand voor stdio-transport. Laat dit oningesteld om de beheerde binary te gebruiken.                                                                                              |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumenten voor stdio-transport.                                                                                                                                                                |
| `url`                         | niet ingesteld                                         | WebSocket-URL van de app-server.                                                                                                                                                                |
| `authToken`                   | niet ingesteld                                         | Bearer-token voor WebSocket-transport.                                                                                                                                                          |
| `headers`                     | `{}`                                                   | Extra WebSocket-headers.                                                                                                                                                                        |
| `clearEnv`                    | `[]`                                                   | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio app-server-proces nadat OpenClaw de overgeërfde omgeving heeft opgebouwd.                                      |
| `requestTimeoutMs`            | `60000`                                                | Time-out voor control-plane-aanroepen naar de app-server.                                                                                                                                       |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Stille periode na een app-serververzoek binnen een beurt terwijl OpenClaw wacht op `turn/completed`.                                                                                            |
| `mode`                        | `"yolo"` tenzij lokale Codex-vereisten YOLO verbieden  | Preset voor YOLO of door guardian beoordeelde uitvoering.                                                                                                                                       |
| `approvalPolicy`              | `"never"` of een toegestaan guardian-goedkeuringsbeleid | Native Codex-goedkeuringsbeleid dat naar thread start, resume en beurt wordt verzonden.                                                                                                         |
| `sandbox`                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar thread start en resume wordt verzonden.                                                                                                                      |
| `approvalsReviewer`           | `"user"` of een toegestane guardian-reviewer           | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer toegestaan.                                                                                             |
| `defaultWorkspaceDir`         | huidige procesdirectory                                | Werkruimte die door `/codex bind` wordt gebruikt wanneer `--cwd` wordt weggelaten.                                                                                                              |
| `serviceTier`                 | niet ingesteld                                         | Optionele servicelaag voor Codex app-server. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flexverwerking aan, en `null` wist de override. Legacy `"fast"` wordt geaccepteerd als `"priority"`. |

De plugin blokkeert oudere of niet-geversioneerde app-server-handshakes. Codex app-server
moet stabiele versie `0.125.0` of nieuwer rapporteren.

## Goedkeurings- en sandboxmodi

Lokale stdio app-server-sessies gebruiken standaard de YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, en
`sandbox: "danger-full-access"`. Deze vertrouwde lokale operatorhouding laat
onbeheerde OpenClaw-beurten en Heartbeats voortgang boeken zonder native goedkeuringsprompts
waar niemand beschikbaar is om op te antwoorden.

Als het lokale systeemvereistenbestand van Codex impliciete YOLO-goedkeuring,
reviewer- of sandboxwaarden niet toestaat, behandelt OpenClaw de impliciete standaard in plaats daarvan als guardian
en selecteert het toegestane guardian-machtigingen. Hostname-matchende
`[[remote_sandbox_config]]`-vermeldingen in hetzelfde vereistenbestand worden gerespecteerd
voor de standaardbeslissing voor de sandbox.

Stel `appServer.mode: "guardian"` in voor door Codex guardian beoordeelde goedkeuringen:

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

De `guardian`-preset wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, en `sandbox: "workspace-write"` wanneer die
waarden zijn toegestaan. Afzonderlijke beleidsvelden overschrijven `mode`. De oudere
reviewerwaarde `guardian_subagent` wordt nog steeds geaccepteerd als compatibiliteitsalias,
maar nieuwe configuraties moeten `auto_review` gebruiken.

## Auth en omgevingsisolatie

Auth wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-auth
   nog vereist is.

Wanneer OpenClaw een Codex-authprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gestarte Codex-childproces. Dat
houdt API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex app-server-beurten per ongeluk via de API worden gefactureerd.

Expliciete Codex API-sleutelprofielen en lokale stdio-env-key fallback gebruiken app-server-login
in plaats van overgeërfde childproces-env. WebSocket app-server-verbindingen
ontvangen geen Gateway-env API-sleutel-fallback; gebruik een expliciet authprofiel of het
eigen account van de externe app-server.

Stdio app-server-starts erven standaard de procesomgeving van OpenClaw, maar
OpenClaw beheert de Codex app-server-accountbridge en stelt zowel `CODEX_HOME` als
`HOME` in op agent-specifieke directories onder de OpenClaw-state van die agent. Codex' eigen
skill-loader leest `$CODEX_HOME/skills` en `$HOME/.agents/skills`, dus beide
waarden zijn geïsoleerd voor lokale app-server-starts. Daardoor blijven Codex-native
skills, plugins, configuratie, accounts en thread-state beperkt tot de OpenClaw-agent
in plaats van dat ze binnenlekken vanuit de persoonlijke Codex CLI-home van de operator.

OpenClaw-plugins en OpenClaw-skill-snapshots lopen nog steeds via OpenClaws eigen
pluginregister en skill-loader. Persoonlijke Codex CLI-assets doen dat niet. Als u
bruikbare Codex CLI-skills of plugins hebt die onderdeel moeten worden van een OpenClaw-agent,
inventariseer ze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` heeft alleen effect op het gestarte Codex app-server-childproces.
`CODEX_HOME` en `HOME` blijven gereserveerd voor OpenClaws agent-specifieke Codex-
isolatie bij lokale starts.

## Dynamische tools

Codex dynamische tools gebruiken standaard `searchable` laden. OpenClaw stelt geen
dynamische tools beschikbaar die native Codex-werkruimtebewerkingen dupliceren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Resterende OpenClaw-integratietools, zoals berichten, sessies, media, Cron,
browser, nodes, Gateway, `heartbeat_respond` en `web_search`, zijn beschikbaar
via Codex-toolzoekopdrachten onder de naamruimte `openclaw`. Dit houdt de
initiële modelcontext kleiner. `sessions_yield` en bronantwoorden die alleen via
message-tools lopen, blijven direct omdat dit turn-controlcontracten zijn.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt
met een aangepaste Codex-app-server die niet kan zoeken in uitgestelde dynamische
tools, of wanneer je de volledige toolpayload debugt.

## Time-outs

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk van
`appServer.requestTimeoutMs` begrensd. Elk Codex-`item/tool/call`-verzoek gebruikt
de eerste beschikbare time-out in deze volgorde:

- Een positief `timeoutMs`-argument per aanroep.
- Voor `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Voor de media-understanding-`image`-tool, `tools.media.image.timeoutSeconds`
  geconverteerd naar milliseconden, of de media-standaard van 60 seconden.
- De standaard van 30 seconden voor dynamische tools.

Budgetten voor dynamische tools zijn afgetopt op 600000 ms. Bij een time-out
breekt OpenClaw het toolsignaal af waar dit wordt ondersteund en retourneert het
een mislukte dynamic-tool-respons aan Codex, zodat de turn kan doorgaan in plaats
van de sessie in `processing` te laten staan.

Nadat OpenClaw op een turn-scoped app-server-verzoek van Codex heeft gereageerd,
verwacht de harness ook dat Codex de native turn afrondt met `turn/completed`.
Als de app-server daarna gedurende `appServer.turnCompletionIdleTimeoutMs` stil
blijft, onderbreekt OpenClaw naar beste vermogen de Codex-turn, registreert het
een diagnostische time-out en geeft het de OpenClaw-sessielane vrij zodat
vervolgchatberichten niet achter een verouderde native turn in de wachtrij
komen.

Elke niet-terminale notificatie voor dezelfde turn, inclusief
`rawResponseItem/completed`, schakelt die korte watchdog uit omdat Codex heeft
aangetoond dat de turn nog leeft. De langere terminale watchdog blijft echt
vastgelopen turns beschermen. Time-outdiagnoses bevatten de laatste
app-server-notificatiemethode en, voor ruwe assistent-responsitems, het
itemtype, de rol, de id en een begrensde tekstpreview van de assistent.

## Modelontdekking

Standaard vraagt de Codex Plugin de app-server om beschikbare modellen.
Modelbeschikbaarheid is eigendom van de Codex-app-server, dus de lijst kan
veranderen wanneer OpenClaw de gebundelde `@openai/codex`-versie bijwerkt of
wanneer een deployment `appServer.command` naar een andere Codex-binary wijst.
Beschikbaarheid kan ook accountgebonden zijn. Gebruik `/codex models` op een
draaiende Gateway om de livecatalogus voor die harness en dat account te zien.

Als ontdekking mislukt of een time-out krijgt, gebruikt OpenClaw een gebundelde
fallbackcatalogus voor:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

De huidige gebundelde harness is `@openai/codex` `0.130.0`. Een `model/list`-probe
tegen die gebundelde app-server retourneerde:

| Model-id              | Standaard | Verborgen | Invoermodaliteiten | Redeneerinspanningen     |
| --------------------- | --------- | --------- | ------------------ | ------------------------ |
| `gpt-5.5`             | Ja        | Nee       | tekst, afbeelding  | low, medium, high, xhigh |
| `gpt-5.4`             | Nee       | Nee       | tekst, afbeelding  | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Nee       | Nee       | tekst, afbeelding  | low, medium, high, xhigh |
| `gpt-5.3-codex`       | Nee       | Nee       | tekst, afbeelding  | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Nee       | Nee       | tekst              | low, medium, high, xhigh |
| `gpt-5.2`             | Nee       | Nee       | tekst, afbeelding  | low, medium, high, xhigh |

Verborgen modellen kunnen door de app-servercatalogus worden geretourneerd voor
interne of gespecialiseerde flows, maar het zijn geen normale keuzes in de
modelkiezer.

Stem ontdekking af onder `plugins.entries.codex.config.discovery`:

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

Schakel ontdekking uit wanneer je wilt dat startup het proben van Codex vermijdt
en alleen de fallbackcatalogus gebruikt:

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

## Werkruimte-bootstrapbestanden

Codex verwerkt `AGENTS.md` zelf via native project-doc-ontdekking. OpenClaw
schrijft geen synthetische Codex-project-doc-bestanden en is niet afhankelijk
van Codex-fallbackbestandsnamen voor personabestanden, omdat Codex-fallbacks
alleen gelden wanneer `AGENTS.md` ontbreekt.

Voor OpenClaw-werkruimtepariteit lost de Codex-harness de andere
bootstrapbestanden op, waaronder `SOUL.md`, `TOOLS.md`, `IDENTITY.md`,
`USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` en `MEMORY.md` wanneer ze aanwezig
zijn, en stuurt deze door via Codex-ontwikkelaarsinstructies op `thread/start`
en `thread/resume`. Dit houdt werkruimtepersona- en profielcontext zichtbaar op
de native Codex-lane die gedrag vormgeeft, zonder `AGENTS.md` te dupliceren.

## Omgevingsoverschrijvingen

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Config
heeft de voorkeur voor herhaalbare deployments omdat dit het Plugin-gedrag in
hetzelfde beoordeelde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [OpenAI-provider](/nl/providers/openai)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
