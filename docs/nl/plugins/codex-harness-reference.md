---
read_when:
    - Je hebt elk configuratieveld van de Codex-harness nodig
    - Je wijzigt het transport-, authenticatie-, ontdekkings- of time-outgedrag van app-server
    - Je debugt het opstarten van het Codex-testharnas, modeldetectie of omgevingsisolatie
summary: Configuratie-, auth-, discovery- en app-serverreferentie voor de Codex-harness
title: Referentie voor het Codex-harnas
x-i18n:
    generated_at: "2026-07-04T10:51:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Deze referentie behandelt de gedetailleerde configuratie voor de meegeleverde `codex`
Plugin. Begin voor installatie- en routeringsbeslissingen met
[Codex-harness](/nl/plugins/codex-harness).

## Plugin-configuratieoppervlak

Alle Codex-harnessinstellingen staan onder `plugins.entries.codex.config`.

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

| Veld                       | Standaard                | Betekenis                                                                                                                                        |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | ingeschakeld             | Modeldetectie-instellingen voor Codex app-server `model/list`.                                                                                   |
| `appServer`                | beheerde stdio app-server | Instellingen voor transport, opdracht, authenticatie, goedkeuring, sandbox en time-out.                                                          |
| `codexDynamicToolsLoading` | `"searchable"`           | Gebruik `"direct"` om dynamische OpenClaw-tools rechtstreeks in de initiële Codex-toolcontext te plaatsen.                                       |
| `codexDynamicToolsExclude` | `[]`                     | Extra namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-server-beurten.                                             |
| `codexPlugins`             | uitgeschakeld            | Native Codex-Plugin/app-ondersteuning voor gemigreerde, vanuit source geïnstalleerde curated plugins. Zie [Native Codex-plugins](/nl/plugins/codex-native-plugins). |
| `computerUse`              | uitgeschakeld            | Codex Computer Use-installatie. Zie [Codex Computer Use](/nl/plugins/codex-computer-use).                                                           |

## App-servertransport

Standaard start OpenClaw de beheerde Codex-binary die met de meegeleverde
Plugin wordt geleverd:

```bash
codex app-server --listen stdio://
```

Hierdoor blijft de app-serverversie gekoppeld aan de meegeleverde `codex` Plugin in plaats van aan
welke afzonderlijke Codex CLI toevallig lokaal is geïnstalleerd. Stel
`appServer.command` alleen in wanneer je bewust een ander uitvoerbaar bestand
wilt uitvoeren.

Gebruik WebSocket-transport voor een app-server die al actief is:

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

| Veld                                          | Standaard                                             | Betekenis                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                                                                                                               |
| `homeScope`                                   | `"agent"`                                             | `"agent"` isoleert de Codex-status per OpenClaw-agent. `"user"` deelt de native `$CODEX_HOME` of `~/.codex`, gebruikt native authenticatie en schakelt threadbeheer alleen voor de eigenaar in. Gebruikersscope vereist stdio.                                                                                                                                                                |
| `command`                                     | beheerd Codex-binair bestand                         | Uitvoerbaar bestand voor stdio-transport. Laat dit niet ingesteld om het beheerde binaire bestand te gebruiken.                                                                                                                                                                                                                                                                                |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                               |
| `url`                                         | niet ingesteld                                        | WebSocket-URL van de app-server.                                                                                                                                                                                                                                                                                                                                                               |
| `authToken`                                   | niet ingesteld                                        | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                  | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                  | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio-app-serverproces nadat OpenClaw de geerfde omgeving heeft opgebouwd.                                                                                                                                                                                                                                         |
| `remoteWorkspaceRoot`                         | niet ingesteld                                        | Externe werkruimteroot van de Codex-app-server. Wanneer dit is ingesteld, leidt OpenClaw de lokale werkruimteroot af uit de opgeloste OpenClaw-werkruimte, behoudt het huidige cwd-achtervoegsel onder deze externe root en stuurt het alleen de uiteindelijke cwd van de app-server naar Codex. Als de cwd buiten de opgeloste OpenClaw-werkruimteroot ligt, weigert OpenClaw veilig in plaats van een gateway-lokaal pad naar de externe app-server te sturen. |
| `requestTimeoutMs`                            | `60000`                                               | Time-out voor control-plane-aanroepen naar de app-server.                                                                                                                                                                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Stille periode nadat Codex een beurt accepteert of na een app-serververzoek binnen de scope van een beurt terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                          |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Bewaking voor voltooiingsinactiviteit en voortgang die wordt gebruikt na een tool-overdracht, native tool-voltooiing, ruwe assistentvoortgang na een tool, voltooiing van ruwe redenering of redeneringsvoortgang terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware workloads waarbij synthese na een tool legitiem langer stil kan blijven dan het uiteindelijke vrijgavebudget van de assistent. |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO verbieden | Voorinstelling voor YOLO- of door guardian beoordeelde uitvoering.                                                                                                                                                                                                                                                                                                                             |
| `approvalPolicy`                              | `"never"` of een toegestaan guardian-goedkeuringsbeleid | Native Codex-goedkeuringsbeleid dat naar threadstart, hervatting en beurt wordt gestuurd.                                                                                                                                                                                                                                                                                                      |
| `sandbox`                                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar threadstart en hervatting wordt gestuurd. Actieve OpenClaw-sandboxen beperken `danger-full-access`-beurten tot Codex `workspace-write`; de netwerkvlag van de beurt volgt de sandbox-egress van OpenClaw.                                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` of een toegestane guardian-reviewer          | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer dit is toegestaan.                                                                                                                                                                                                                                                                                     |
| `defaultWorkspaceDir`                         | huidige procesmap                                     | Werkruimte die door `/codex bind` wordt gebruikt wanneer `--cwd` is weggelaten.                                                                                                                                                                                                                                                                                                                |
| `serviceTier`                                 | niet ingesteld                                        | Optionele servicelaag voor de Codex-app-server. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flex-verwerking aan en `null` wist de overschrijving. Verouderd `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                                  |
| `networkProxy`                                | uitgeschakeld                                         | Kies voor Codex-permissieprofielnetwerken voor app-serveropdrachten. OpenClaw definieert de geselecteerde `permissions.<profile>.network`-configuratie en selecteert die met `default_permissions` in plaats van `sandbox` te sturen.                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                               | Preview-opt-in die een door de OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij Codex-app-server 0.132.0 of nieuwer, zodat native Codex-uitvoering binnen de actieve OpenClaw-sandbox kan worden uitgevoerd.                                                                                                                                                                      |

`appServer.networkProxy` is expliciet omdat dit het Codex-sandboxcontract
wijzigt. Wanneer dit is ingeschakeld, stelt OpenClaw ook `features.network_proxy.enabled` en
`default_permissions` in de Codex-threadconfiguratie in, zodat het gegenereerde permissieprofiel
door Codex beheerd netwerkverkeer kan starten. Standaard genereert OpenClaw een
botsingsbestendige profielnaam `openclaw-network-<fingerprint>` op basis van de
profielbody; gebruik `profileName` alleen wanneer een stabiele lokale naam vereist is.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Als de normale app-serverruntime `danger-full-access` zou zijn, gebruikt het inschakelen van
`networkProxy` workspace-achtige bestandssysteemtoegang voor het gegenereerde
toestemmingsprofiel. Door Codex beheerde netwerkhandhaving is gesandboxte networking,
dus een profiel met volledige toegang zou uitgaand verkeer niet beschermen.

De Plugin blokkeert oudere of niet-geversioneerde app-serverhandshakes. Codex app-server
moet stabiele versie `0.125.0` of nieuwer rapporteren.

OpenClaw behandelt niet-loopback WebSocket-app-server-URL's als remote en vereist
identiteitsdragende WebSocket-authenticatie via `appServer.authToken` of een
`Authorization`-header. `appServer.authToken` en elke `appServer.headers.*`-waarde
kunnen een SecretInput zijn; de secrets-runtime lost SecretRefs en env-shorthand op
voordat OpenClaw app-server-startopties bouwt, en niet-opgeloste gestructureerde
SecretRefs falen voordat er een token of header wordt verzonden. Wanneer native Codex
plugins zijn geconfigureerd, gebruikt OpenClaw het plugin-controlplane van de verbonden
app-server om die plugins te installeren of te vernieuwen en vernieuwt daarna de app-inventaris
zodat apps die eigendom zijn van plugins zichtbaar zijn voor de Codex-thread. `app/list` blijft de
gezaghebbende bron voor inventaris en metadata, maar OpenClaw-beleid bepaalt of
`thread/start` `config.apps[appId].enabled = true` verzendt voor een vermelde toegankelijke
app, zelfs als Codex die momenteel als uitgeschakeld markeert. Onbekende of ontbrekende
app-id's blijven fail-closed; dit pad activeert alleen marketplace-plugins via `plugin/install`
en vernieuwt de inventaris. Verbind OpenClaw alleen met remote app-servers die worden
vertrouwd om door OpenClaw beheerde plugin-installaties en app-inventarisvernieuwingen te accepteren.

## Goedkeurings- en sandboxmodi

Lokale stdio-app-serversessies gebruiken standaard de YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Deze vertrouwde lokale operatorhouding laat
onbeheerde OpenClaw-turns en heartbeats voortgang maken zonder native goedkeuringsprompts
waar niemand aanwezig is om op te antwoorden.

Als het lokale systeemvereistenbestand van Codex impliciete YOLO-goedkeurings-,
reviewer- of sandboxwaarden niet toestaat, behandelt OpenClaw de impliciete standaard
in plaats daarvan als guardian en selecteert het toegestane guardian-machtigingen.
`tools.exec.mode: "auto"` dwingt ook door guardian gereviewde Codex-goedkeuringen af
en behoudt geen onveilige legacy-overschrijvingen voor `approvalPolicy: "never"` of
`sandbox: "danger-full-access"`; stel `tools.exec.mode: "full"` in voor een bewuste
houding zonder goedkeuring. Hostnaam-matchende
`[[remote_sandbox_config]]`-vermeldingen in hetzelfde vereistenbestand worden gerespecteerd
voor de beslissing over de sandboxstandaard.

Stel `appServer.mode: "guardian"` in voor door guardian gereviewde Codex-goedkeuringen:

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

De `guardian`-preset breidt uit naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"` wanneer die
waarden zijn toegestaan. Afzonderlijke beleidsvelden overschrijven `mode`. De oudere
reviewerwaarde `guardian_subagent` wordt nog steeds geaccepteerd als compatibiliteitsalias,
maar nieuwe configuraties moeten `auto_review` gebruiken.

Wanneer een OpenClaw-sandbox actief is, draait het lokale Codex app-server-proces nog steeds
op de Gateway-host. OpenClaw schakelt daarom Codex native Code Mode,
MCP-servers van gebruikers en door apps ondersteunde pluginuitvoering uit voor die turn,
in plaats van Codex-hostside sandboxing als gelijkwaardig te behandelen aan de OpenClaw-sandboxbackend.
Shelltoegang wordt beschikbaar gesteld via door de OpenClaw-sandbox ondersteunde dynamische tools
zoals `sandbox_exec` en `sandbox_process` wanneer de normale exec-/proces-tools beschikbaar zijn.

Op Ubuntu/AppArmor-hosts kan Codex bwrap falen onder `workspace-write` voordat
de shellopdracht start wanneer je bewust native Codex `workspace-write` uitvoert
zonder actieve OpenClaw-sandboxing. Als je
`bwrap: setting up uid map: Permission denied` of
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` ziet, voer dan
`openclaw doctor` uit en herstel het gerapporteerde host-namespacebeleid voor de OpenClaw
servicegebruiker in plaats van bredere Docker-containerrechten te verlenen. Geef de voorkeur
aan een scoped AppArmor-profiel voor het serviceproces; de
`kernel.apparmor_restrict_unprivileged_userns=0`-fallback is hostbreed en heeft
security-afwegingen.

## Gesandboxte native uitvoering

De stabiele standaard is fail-closed: actieve OpenClaw-sandboxing schakelt native
Codex-uitvoeringsoppervlakken uit die anders vanaf de Codex app-server-host zouden draaien.
Gebruik `appServer.experimental.sandboxExecServer: true` alleen wanneer je Codex'
ondersteuning voor remote omgevingen wilt proberen met OpenClaw's sandboxbackend. Dit
previewpad vereist Codex app-server 0.132.0 of nieuwer.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Wanneer de vlag aan staat en de huidige OpenClaw-sessie gesandboxt is, start OpenClaw
een local loopback exec-server die wordt ondersteund door de actieve sandbox, registreert deze
bij Codex app-server en start de Codex-thread en -turn met die
door OpenClaw beheerde omgeving. Als de app-server de omgeving niet kan registreren,
faalt de run gesloten in plaats van stil terug te vallen op hostuitvoering.

Dit previewpad is alleen lokaal. Een remote WebSocket-app-server kan de
loopback exec-server niet bereiken tenzij deze op dezelfde host draait, dus OpenClaw wijst
die combinatie af.

## Authenticatie- en omgevingsisolatie

In de standaard per-agent home wordt authenticatie in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex home van die agent.
3. Alleen voor lokale stdio-app-serverstarts, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-authenticatie
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authenticatieprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Daardoor blijven
API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen
zonder dat native Codex app-server-turns per ongeluk via de API worden gefactureerd.

Expliciete Codex API-sleutelprofielen en lokale stdio env-key-fallback gebruiken app-serverlogin
in plaats van geërfde childproces-env. WebSocket-app-serververbindingen ontvangen geen
Gateway env API-sleutel-fallback; gebruik een expliciet authenticatieprofiel of het eigen account
van de remote app-server.

Stdio-app-serverstarts erven standaard de procesomgeving van OpenClaw.
OpenClaw beheert de Codex app-server-accountbridge en stelt `CODEX_HOME` in op een
per-agent directory onder de OpenClaw-state van die agent. Dat houdt Codex-configuratie,
accounts, plugin-cache/data en thread-state scoped tot de OpenClaw-agent
in plaats van ze te laten lekken uit de persoonlijke `~/.codex` home van de operator.

Stel `appServer.homeScope: "user"` in om native Codex-state te delen met Codex
Desktop en de CLI. Deze alleen-lokale-stdio-modus gebruikt `$CODEX_HOME` wanneer ingesteld en
anders `~/.codex`, inclusief native authenticatie, configuratie, plugins en threads.
OpenClaw slaat zijn authenticatieprofielbridge voor de app-server over. Geverifieerde owner-turns
kunnen `codex_threads` gebruiken om die threads te tonen, doorzoeken, lezen, forken, hernoemen,
archiveren en herstellen. Fork een thread voordat je deze voortzet in OpenClaw; onafhankelijke
Codex-processen coördineren geen gelijktijdige schrijvers voor dezelfde thread.

OpenClaw herschrijft `HOME` niet voor normale lokale app-serverstarts. Door Codex uitgevoerde
subprocessen zoals `openclaw`, `gh`, `git`, cloud-CLI's en shellopdrachten zien
de normale proces-home en kunnen configuratie en tokens in de user-home vinden. Codex kan ook
`$HOME/.agents/skills` en `$HOME/.agents/plugins/marketplace.json` ontdekken;
die `.agents`-discovery wordt bewust gedeeld met de operator-home en staat
los van geïsoleerde `~/.codex`-state.

In de standaard agentscope lopen OpenClaw-plugins en OpenClaw-skill-snapshots nog steeds
via OpenClaw's eigen pluginregistry en skill-loader; persoonlijke Codex
`~/.codex`-assets niet. Als je nuttige Codex CLI-skills of plugins uit een
Codex home hebt die onderdeel moeten worden van een geïsoleerde OpenClaw-agent, inventariseer
ze expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` beïnvloedt alleen het gespawnde Codex app-server-childproces.
OpenClaw verwijdert `CODEX_HOME` en `HOME` uit deze lijst tijdens lokale startnormalisatie:
`CODEX_HOME` blijft wijzen naar de geselecteerde agent- of userscope,
en `HOME` blijft geërfd zodat subprocessen normale user-home-state kunnen gebruiken.

## Dynamische tools

Dynamische Codex-tools gebruiken standaard `searchable` loading. OpenClaw stelt geen
dynamische tools beschikbaar die native Codex-workspacebewerkingen dupliceren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

De meeste overige OpenClaw-integratietools, zoals messaging, media, cron,
browser, nodes, gateway, `heartbeat_respond` en `web_search`, zijn beschikbaar
via Codex-toolzoekfunctie onder de `openclaw`-namespace. Dit houdt de initiële
modelcontext kleiner. `sessions_yield` en message-tool-only bronantwoorden
blijven direct omdat dat turn-controlcontracten zijn. `sessions_spawn` blijft
searchable zodat Codex' native `spawn_agent` het primaire Codex-subagentoppervlak blijft,
terwijl expliciete OpenClaw- of ACP-delegatie nog steeds beschikbaar is via
de dynamische toolnamespace `openclaw`.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt met een aangepaste Codex
app-server die geen uitgestelde dynamische tools kan doorzoeken of wanneer je de volledige
toolpayload debugt.

## Time-outs

Door OpenClaw beheerde dynamische toolcalls worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`. Elk Codex `item/tool/call`-verzoek gebruikt de eerste
beschikbare time-out in deze volgorde:

- Een positief per-call `timeoutMs`-argument.
- Voor `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Voor `image_generate` zonder geconfigureerde time-out, de standaard van 120 seconden
  voor beeldgeneratie.
- Voor de media-understanding `image`-tool, `tools.media.image.timeoutSeconds`
  geconverteerd naar milliseconden, of de mediastandaard van 60 seconden. Voor image
  understanding geldt dit voor het verzoek zelf en wordt het niet verminderd door
  eerder voorbereidingswerk.
- De dynamische-toolstandaard van 90 seconden.

Deze watchdog is het buitenste dynamische `item/tool/call`-budget. Providerspecifieke
verzoektime-outs draaien binnen die call en behouden hun eigen time-outsemantiek.
Dynamische-toolbudgetten zijn afgetopt op 600000 ms. Bij een time-out breekt OpenClaw
het toolsignaal af waar dat wordt ondersteund en retourneert een mislukte dynamische-toolrespons aan Codex
zodat de turn kan doorgaan in plaats van de sessie in `processing` te laten staan.

Nadat Codex een turn accepteert, en nadat OpenClaw reageert op een turn-scoped
app-serververzoek, verwacht de harness dat Codex voortgang maakt in de huidige turn en
uiteindelijk de native turn afrondt met `turn/completed`. Als de app-server stilvalt
gedurende `appServer.turnCompletionIdleTimeoutMs`, onderbreekt OpenClaw best-effort
de Codex-turn, registreert een diagnostische time-out en geeft de OpenClaw-sessielane vrij
zodat vervolgmailberichten niet achter een verouderde native turn in de wachtrij blijven staan.

De meeste niet-terminale meldingen voor dezelfde beurt schakelen die korte watchdog uit
omdat Codex heeft bewezen dat de beurt nog actief is. Tool-overdrachten gebruiken een langer
post-tool inactiviteitsbudget: nadat OpenClaw een `item/tool/call`-respons teruggeeft, nadat
native tool-items zoals `commandExecution` zijn voltooid, na ruwe
`custom_tool_call_output`-voltooiingen, en na post-tool ruwe assistentvoortgang,
ruwe redeneervoltooiingen of redeneervoortgang. De bewaking gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer dit is geconfigureerd en
valt anders terug op vijf minuten. Datzelfde post-tool-budget verlengt ook de
voortgangswatchdog voor het stille synthesisevenster voordat Codex de volgende
huidige-beurtgebeurtenis uitzendt. Redeneervoltooiingen, commentary
`agentMessage`-voltooiingen en pre-tool ruwe redeneer- of assistentvoortgang kunnen
worden gevolgd door een automatisch eindantwoord, dus gebruiken ze de post-progress antwoordbewaking
in plaats van de sessielane onmiddellijk vrij te geven. Alleen
definitieve/niet-commentary voltooide `agentMessage`-items en pre-tool ruwe assistentvoltooiingen
activeren de assistent-uitvoer-vrijgave: als Codex daarna stilvalt zonder
`turn/completed`, onderbreekt OpenClaw naar beste vermogen de native beurt en geeft
het de sessielane vrij. Replay-veilige stdio app-server-fouten, inclusief
inactiviteitstime-outs voor beurtvoltooiing zonder bewijs van assistent, tool, actief item of
neveneffect, worden één keer opnieuw geprobeerd met een nieuwe app-serverpoging. Onveilige
time-outs verwijderen nog steeds de vastgelopen app-serverclient en geven de OpenClaw
sessielane vrij. Ze wissen ook de verouderde native threadbinding in plaats van
automatisch opnieuw te worden afgespeeld. Completion-watch-time-outs tonen Codex-specifieke
time-outtekst: replay-veilige gevallen zeggen dat de respons mogelijk onvolledig is, terwijl
onveilige gevallen de gebruiker vragen de huidige staat te verifiëren voordat hij opnieuw probeert.
Openbare time-outdiagnostiek bevat structurele velden zoals de laatste
app-server-meldingsmethode, ruwe assistentrespons-item-id/type/rol, aantallen actieve
requests/items en de geactiveerde watch-status. Wanneer de laatste melding een ruw
assistentrespons-item is, bevat die ook een begrensde preview van assistenttekst. Die bevat
geen ruwe prompt- of toolinhoud.

## Modeldetectie

Standaard vraagt de Codex Plugin de app-server om beschikbare modellen. Modelbeschikbaarheid
is eigendom van de Codex app-server, dus de lijst kan veranderen wanneer OpenClaw
de gebundelde versie van `@openai/codex` bijwerkt of wanneer een deployment
`appServer.command` naar een andere Codex-binary laat wijzen. Beschikbaarheid kan ook
accountgebonden zijn. Gebruik `/codex models` op een draaiende gateway om de livecatalogus
voor die harness en dat account te zien.

Als detectie mislukt of een time-out krijgt, gebruikt OpenClaw een gebundelde fallbackcatalogus voor:

- GPT-5.5
- GPT-5.4 mini

De huidige gebundelde harness is `@openai/codex` `0.142.4`. Een `model/list`-probe
tegen die gebundelde app-server in een GPT-5.6-geactiveerde workspace gaf deze
openbare pickerrijen terug:

| Model-id              | Invoermodaliteiten | Redeneerinspanningen                 |
| --------------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`         | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image        | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image        | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image        | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image        | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image        | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text               | low, medium, high, xhigh             |

GPT-5.6-toegang is accountgebonden tijdens de beperkte preview. `max` is een model-
redeneerinspanning. `ultra` is afzonderlijke Codex multi-agent-orkestratiemetadata,
geen standaard OpenAI-redeneerinspanning.

Verborgen modellen kunnen door de app-servercatalogus worden teruggegeven voor interne of
gespecialiseerde flows, maar het zijn geen normale modelpickerkeuzes.

Stem detectie af onder `plugins.entries.codex.config.discovery`:

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

Schakel detectie uit wanneer je wilt dat het opstarten Codex niet probet en alleen de
fallbackcatalogus gebruikt:

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

## Workspace-bootstrapbestanden

Codex verwerkt `AGENTS.md` zelf via native project-doc-detectie. OpenClaw
schrijft geen synthetische Codex project-doc-bestanden en is niet afhankelijk van Codex-fallbackbestandsnamen
voor personabestanden, omdat Codex-fallbacks alleen gelden wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw workspace-pariteit lost de Codex-harness de andere bootstrapbestanden op.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` en `USER.md` worden doorgestuurd als
OpenClaw Codex-ontwikkelaarsinstructies omdat ze de actieve agent,
beschikbare workspace-richtlijnen en het gebruikersprofiel definiëren. De compacte OpenClaw Skills-
lijst wordt doorgestuurd als beurtgebonden samenwerkings-ontwikkelaarsinstructies.
`HEARTBEAT.md`-inhoud wordt niet geïnjecteerd; heartbeat-beurten krijgen een collaboration-mode
verwijzing om het bestand te lezen wanneer het bestaat en niet leeg is. `MEMORY.md`-inhoud
uit de geconfigureerde agent-workspace wordt niet in native Codex-beurtinvoer geplakt
wanneer memory-tools beschikbaar zijn voor die workspace; wanneer het bestaat, voegt de harness
een kleine workspace-memory-verwijzing toe aan beurtgebonden samenwerkings-
ontwikkelaarsinstructies en moet Codex `memory_search` of `memory_get` gebruiken wanneer duurzame
memory relevant is. Als tools zijn uitgeschakeld, memory search niet beschikbaar is, of de
actieve workspace verschilt van de agent-memory-workspace, gebruikt `MEMORY.md` het
normale begrensde beurtcontextpad.
`BOOTSTRAP.md` wordt, indien aanwezig, doorgestuurd als OpenClaw-beurtinvoerreferentiecontext.

## Omgevingsoverschrijvingen

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalige lokale tests. Configuratie heeft
de voorkeur voor herhaalbare deployments omdat dit het Plugin-gedrag in hetzelfde
gereviewde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [OpenAI-provider](/nl/providers/openai)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
