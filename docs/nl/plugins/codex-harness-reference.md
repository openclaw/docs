---
read_when:
    - Je hebt alle configuratievelden van de Codex-harness nodig
    - Je wijzigt het transport-, authenticatie-, ontdekkings- of time-outgedrag van app-server
    - Je debugt het opstarten van de Codex-harness, modeldetectie of omgevingsisolatie
summary: Configuratie-, auth-, discovery- en app-serverreferentie voor de Codex-harness
title: Referentie voor Codex-harnas
x-i18n:
    generated_at: "2026-07-04T20:38:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Deze referentie behandelt de gedetailleerde configuratie voor de gebundelde `codex`
Plugin. Begin voor installatie- en routeringsbeslissingen met
[Codex-harnas](/nl/plugins/codex-harness).

## Configuratieoppervlak van Plugin

Alle Codex-harnasinstellingen staan onder `plugins.entries.codex.config`.

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

Ondersteunde velden op hoofdniveau:

| Veld                       | Standaard                | Betekenis                                                                                                                                        |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | ingeschakeld             | Instellingen voor modeldetectie voor Codex app-server `model/list`.                                                                              |
| `appServer`                | beheerde stdio app-server | Instellingen voor transport, opdracht, auth, goedkeuring, sandbox en time-out.                                                                   |
| `codexDynamicToolsLoading` | `"searchable"`           | Gebruik `"direct"` om dynamische OpenClaw-tools direct in de initiële Codex-toolcontext te plaatsen.                                             |
| `codexDynamicToolsExclude` | `[]`                     | Extra namen van dynamische OpenClaw-tools om weg te laten uit Codex app-server-beurten.                                                         |
| `codexPlugins`             | uitgeschakeld            | Native Codex-plugin-/app-ondersteuning voor gemigreerde, vanuit bron geïnstalleerde samengestelde plugins. Zie [Native Codex-plugins](/nl/plugins/codex-native-plugins). |
| `computerUse`              | uitgeschakeld            | Codex Computer Use-installatie. Zie [Codex Computer Use](/nl/plugins/codex-computer-use).                                                          |

## App-servertransport

Standaard start OpenClaw de beheerde Codex-binary die met de gebundelde
Plugin wordt meegeleverd:

```bash
codex app-server --listen stdio://
```

Hierdoor blijft de app-serverversie gekoppeld aan de gebundelde `codex` Plugin in plaats van aan
welke afzonderlijke Codex CLI toevallig lokaal is geïnstalleerd. Stel
`appServer.command` alleen in wanneer je bewust een ander uitvoerbaar bestand
wilt uitvoeren.

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

| Veld                                          | Standaard                                             | Betekenis                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                                   | `"stdio"`                                             | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                                                                                                                  |
| `homeScope`                                   | `"agent"`                                             | `"agent"` isoleert de Codex-status per OpenClaw-agent. `"user"` deelt de native `$CODEX_HOME` of `~/.codex`, gebruikt native auth en schakelt threadbeheer alleen voor eigenaren in. Gebruikersscope vereist stdio.                                                                                                                                                                               |
| `command`                                     | beheerde Codex-binary                                 | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om de beheerde binary te gebruiken.                                                                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | niet ingesteld                                        | WebSocket-app-server-URL.                                                                                                                                                                                                                                                                                                                                                                         |
| `authToken`                                   | niet ingesteld                                        | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                  | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                  |
| `clearEnv`                                    | `[]`                                                  | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio-app-serverproces nadat OpenClaw de overgeërfde omgeving heeft opgebouwd.                                                                                                                                                                                                                                         |
| `remoteWorkspaceRoot`                         | niet ingesteld                                        | Externe werkruimteroot van de Codex-app-server. Wanneer ingesteld, leidt OpenClaw de lokale werkruimteroot af uit de opgeloste OpenClaw-werkruimte, behoudt het huidige cwd-achtervoegsel onder deze externe root en stuurt alleen de uiteindelijke app-server-cwd naar Codex. Als de cwd buiten de opgeloste OpenClaw-werkruimteroot ligt, faalt OpenClaw gesloten in plaats van een Gateway-lokaal pad naar de externe app-server te sturen. |
| `requestTimeoutMs`                            | `60000`                                               | Time-out voor control-plane-aanroepen naar de app-server.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Stille periode nadat Codex een beurt accepteert of na een beurtgebonden app-serververzoek terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                                             |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Guard voor voltooiingsinactiviteit en voortgang die wordt gebruikt na een tool-overdracht, native tool-voltooiing, ruwe assistentvoortgang na een tool, voltooiing van ruwe reasoning of reasoning-voortgang terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware workloads waarbij synthese na een tool legitiem langer stil kan blijven dan het budget voor de uiteindelijke assistentvrijgave. |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO verbieden | Preset voor YOLO- of door guardian beoordeelde uitvoering.                                                                                                                                                                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` of een toegestaan guardian-goedkeuringsbeleid | Native Codex-goedkeuringsbeleid dat naar threadstart, hervatting en beurt wordt gestuurd.                                                                                                                                                                                                                                                                                                         |
| `sandbox`                                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar threadstart en hervatting wordt gestuurd. Actieve OpenClaw-sandboxes versmallen `danger-full-access`-beurten tot Codex `workspace-write`; de netwerkvlag van de beurt volgt OpenClaw-sandbox-egress.                                                                                                                                                          |
| `approvalsReviewer`                           | `"user"` of een toegestane guardian-reviewer          | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer dat is toegestaan.                                                                                                                                                                                                                                                                                         |
| `defaultWorkspaceDir`                         | huidige procesmap                                     | Werkruimte die door `/codex bind` wordt gebruikt wanneer `--cwd` is weggelaten.                                                                                                                                                                                                                                                                                                                   |
| `serviceTier`                                 | niet ingesteld                                        | Optionele Codex-app-server-servicelaag. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flex-verwerking aan en `null` wist de overschrijving. Legacy `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                                                  |
| `networkProxy`                                | uitgeschakeld                                         | Kies voor Codex-permissieprofielnetwerken voor app-serveropdrachten. OpenClaw definieert de geselecteerde `permissions.<profile>.network`-config en selecteert die met `default_permissions` in plaats van `sandbox` te sturen.                                                                                                                                                                   |
| `experimental.sandboxExecServer`              | `false`                                               | Preview-opt-in die een door OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij Codex-app-server 0.132.0 of nieuwer, zodat native Codex-uitvoering binnen de actieve OpenClaw-sandbox kan draaien.                                                                                                                                                                                       |

`appServer.networkProxy` is expliciet omdat het het Codex-sandboxcontract
wijzigt. Wanneer ingeschakeld, stelt OpenClaw ook `features.network_proxy.enabled` en
`default_permissions` in de Codex-threadconfiguratie in, zodat het gegenereerde permissieprofiel
door Codex beheerd netwerken kan starten. Standaard genereert OpenClaw een
botsingsbestendige profielnaam `openclaw-network-<fingerprint>` uit de
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

Als de normale app-server-runtime `danger-full-access` zou zijn, gebruikt het inschakelen van
`networkProxy` werkruimte-achtige bestandssysteemtoegang voor het gegenereerde
machtigingsprofiel. Door Codex beheerde netwerkhandhaving is gesandboxte netwerktoegang,
dus een profiel met volledige toegang zou uitgaand verkeer niet beschermen.

De plugin blokkeert oudere of niet-geversioneerde app-server-handshakes. Codex app-server
moet stabiele versie `0.125.0` of nieuwer rapporteren.

OpenClaw behandelt niet-loopback WebSocket app-server-URL's als remote en vereist
identiteitsdragende WebSocket-auth via `appServer.authToken` of een
`Authorization`-header. `appServer.authToken` en elke `appServer.headers.*`-waarde
kunnen een SecretInput zijn; de secrets-runtime lost SecretRefs en env-shorthand op
voordat OpenClaw app-server-startopties bouwt, en niet-opgeloste gestructureerde
SecretRefs falen voordat een token of header wordt verzonden. Wanneer native Codex
plugins zijn geconfigureerd, gebruikt OpenClaw het plugin-control-plane van de verbonden
app-server om die plugins te installeren of vernieuwen en vernieuwt daarna de app-inventaris
zodat apps die eigendom zijn van plugins zichtbaar zijn voor de Codex-thread. `app/list`
blijft de gezaghebbende bron voor inventaris en metadata, maar OpenClaw-beleid bepaalt of
`thread/start` `config.apps[appId].enabled = true` verzendt voor een vermelde toegankelijke
app, zelfs als Codex deze momenteel als uitgeschakeld markeert. Onbekende of ontbrekende
app-id's blijven gesloten bij falen; dit pad activeert alleen marketplace-plugins via
`plugin/install` en vernieuwt de inventaris. Verbind OpenClaw alleen met remote app-servers
die worden vertrouwd om door OpenClaw beheerde plugin-installaties en app-inventarisvernieuwingen
te accepteren.

## Goedkeurings- en sandboxmodi

Lokale stdio app-server-sessies gebruiken standaard YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Deze vertrouwde lokale operatorhouding laat
onbeheerde OpenClaw-beurten en heartbeats voortgang maken zonder native goedkeuringsprompts
waar niemand is om op te antwoorden.

Als het lokale systeemeisenbestand van Codex impliciete YOLO-goedkeurings-,
reviewer- of sandboxwaarden verbiedt, behandelt OpenClaw de impliciete standaard
in plaats daarvan als guardian en selecteert toegestane guardian-machtigingen.
`tools.exec.mode: "auto"` dwingt ook door guardian gereviewde Codex-goedkeuringen af
en behoudt geen onveilige legacy-overschrijvingen van `approvalPolicy: "never"` of
`sandbox: "danger-full-access"`; stel `tools.exec.mode: "full"` in voor een
bewuste houding zonder goedkeuring. Hostname-matchende
`[[remote_sandbox_config]]`-vermeldingen in hetzelfde eisenbestand worden gehonoreerd
voor de standaardbeslissing van de sandbox.

Stel `appServer.mode: "guardian"` in voor door Codex guardian-gereviewde goedkeuringen:

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
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"` wanneer die
waarden zijn toegestaan. Individuele beleidsvelden overschrijven `mode`. De oudere
reviewerwaarde `guardian_subagent` wordt nog steeds geaccepteerd als compatibiliteitsalias,
maar nieuwe configuraties moeten `auto_review` gebruiken.

Wanneer een OpenClaw-sandbox actief is, draait het lokale Codex app-server-proces nog steeds
op de Gateway-host. OpenClaw schakelt daarom native Codex Code Mode, gebruikers-MCP-servers
en app-ondersteunde pluginuitvoering voor die beurt uit, in plaats van host-side sandboxing
van Codex te behandelen als equivalent aan de OpenClaw-sandboxbackend. Shelltoegang wordt
blootgesteld via door de OpenClaw-sandbox ondersteunde dynamische tools zoals `sandbox_exec`
en `sandbox_process` wanneer de normale exec/process-tools beschikbaar zijn.

Op Ubuntu/AppArmor-hosts kan Codex bwrap falen onder `workspace-write` voordat de
shellopdracht start wanneer je bewust native Codex `workspace-write` draait zonder actieve
OpenClaw-sandboxing. Als je `bwrap: setting up uid map: Permission denied` of
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` ziet, voer dan
`openclaw doctor` uit en herstel het gerapporteerde host-namespacebeleid voor de
OpenClaw-servicegebruiker in plaats van bredere Docker-containerrechten toe te kennen.
Geef de voorkeur aan een scoped AppArmor-profiel voor het serviceproces; de fallback
`kernel.apparmor_restrict_unprivileged_userns=0` geldt hostbreed en heeft
beveiligingsafwegingen.

## Gesandboxte native uitvoering

De stabiele standaard is gesloten bij falen: actieve OpenClaw-sandboxing schakelt native
Codex-uitvoeringsoppervlakken uit die anders vanaf de Codex app-server-host zouden draaien.
Gebruik `appServer.experimental.sandboxExecServer: true` alleen wanneer je Codex' ondersteuning
voor remote omgevingen wilt uitproberen met de sandboxbackend van OpenClaw. Dit previewpad
vereist Codex app-server 0.132.0 of nieuwer.

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
een lokale local loopback exec-server die wordt ondersteund door de actieve sandbox,
registreert deze bij Codex app-server en start de Codex-thread en -beurt met die
omgeving die eigendom is van OpenClaw. Als de app-server de omgeving niet kan registreren,
faalt de run gesloten in plaats van stilzwijgend terug te vallen op hostuitvoering.

Dit previewpad is alleen lokaal. Een remote WebSocket app-server kan de
loopback exec-server niet bereiken tenzij deze op dezelfde host draait, dus OpenClaw wijst
die combinatie af.

## Auth en omgevingsisolatie

In de standaard home per agent wordt auth in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-auth
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Dat houdt API-sleutels
op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen zonder dat native
Codex app-server-beurten per ongeluk via de API worden gefactureerd.

Expliciete Codex API-sleutelprofielen en lokale stdio env-sleutel fallback gebruiken
app-server-login in plaats van overgeërfde childproces-env. WebSocket app-server-verbindingen
ontvangen geen Gateway env API-sleutel fallback; gebruik een expliciet authprofiel of het
eigen account van de remote app-server.

Stdio app-server-starts erven standaard de procesomgeving van OpenClaw. OpenClaw beheert
de Codex app-server-accountbridge en stelt `CODEX_HOME` in op een directory per agent onder
de OpenClaw-state van die agent. Dat houdt Codex-configuratie, accounts, plugin-cache/data
en threadstatus gescoped op de OpenClaw-agent in plaats van te lekken uit de persoonlijke
`~/.codex`-home van de operator.

Stel `appServer.homeScope: "user"` in om native Codex-state te delen met Codex Desktop
en de CLI. Deze alleen-lokale-stdio modus gebruikt `$CODEX_HOME` wanneer ingesteld en
anders `~/.codex`, inclusief native auth, configuratie, plugins en threads. OpenClaw slaat
zijn authprofielbridge voor de app-server over. Geverifieerde owner-beurten kunnen
`codex_threads` gebruiken om die threads te vermelden, doorzoeken, lezen, forken, hernoemen,
archiveren en herstellen. Fork een thread voordat je die in OpenClaw voortzet; onafhankelijke
Codex-processen coördineren geen gelijktijdige schrijvers voor dezelfde thread.

OpenClaw herschrijft `HOME` niet voor normale lokale app-server-starts. Door Codex gedraaide
subprocessen zoals `openclaw`, `gh`, `git`, cloud-CLI's en shellopdrachten zien de normale
proces-home en kunnen configuratie en tokens in de gebruikers-home vinden. Codex kan ook
`$HOME/.agents/skills` en `$HOME/.agents/plugins/marketplace.json` ontdekken; die
`.agents`-ontdekking wordt bewust gedeeld met de operator-home en staat los van geïsoleerde
`~/.codex`-state.

In de standaard agentscope lopen OpenClaw-plugins en OpenClaw-skill-snapshots nog steeds
via OpenClaw's eigen pluginregistry en skill-loader; persoonlijke Codex `~/.codex`-assets
niet. Als je nuttige Codex CLI-skills of plugins uit een Codex-home hebt die onderdeel
moeten worden van een geïsoleerde OpenClaw-agent, inventariseer ze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` beïnvloedt alleen het gespawnde Codex app-server-childproces.
OpenClaw verwijdert `CODEX_HOME` en `HOME` uit deze lijst tijdens normalisatie van lokale
starts: `CODEX_HOME` blijft wijzen naar de geselecteerde agent- of gebruikersscope, en
`HOME` blijft overgeërfd zodat subprocessen normale gebruikers-home-state kunnen gebruiken.

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

De meeste resterende OpenClaw-integratietools, zoals messaging, media, cron, browser,
nodes, gateway, `heartbeat_respond` en `web_search`, zijn beschikbaar via Codex-toolzoekopdrachten
onder de `openclaw`-namespace. Dit houdt de initiële modelcontext kleiner. `sessions_yield`
en alleen-message-tool bronantwoorden blijven direct omdat dat beurtbeheercontracten zijn.
`sessions_spawn` blijft searchable zodat Codex' native `spawn_agent` het primaire
Codex-subagentoppervlak blijft, terwijl expliciete OpenClaw- of ACP-delegatie nog steeds
beschikbaar is via de dynamische toolnamespace `openclaw`.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbindt met een aangepaste
Codex app-server die uitgestelde dynamische tools niet kan doorzoeken of wanneer je de
volledige toolpayload debugt.

## Time-outs

Dynamische toolcalls die eigendom zijn van OpenClaw worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`. Elk Codex `item/tool/call`-verzoek gebruikt de eerste
beschikbare time-out in deze volgorde:

- Een positief per-call `timeoutMs`-argument.
- Voor `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Voor `image_generate` zonder geconfigureerde time-out, de standaard voor afbeeldingsgeneratie
  van 120 seconden.
- Voor de media-understanding `image`-tool, `tools.media.image.timeoutSeconds`
  omgerekend naar milliseconden, of de mediastandaard van 60 seconden. Voor image
  understanding geldt dit voor het verzoek zelf en wordt het niet verminderd door
  eerder voorbereidingswerk.
- De standaard voor dynamische tools van 90 seconden.

Deze watchdog is het buitenste budget voor dynamische `item/tool/call`. Providerspecifieke
request-time-outs draaien binnen die call en behouden hun eigen time-outsemantiek.
Budgetten voor dynamische tools zijn afgetopt op 600000 ms. Bij een time-out breekt
OpenClaw waar ondersteund het toolsignaal af en retourneert het een mislukte
dynamische-toolrespons aan Codex zodat de beurt kan doorgaan in plaats van de sessie in
`processing` te laten staan.

Nadat Codex een beurt accepteert, en nadat OpenClaw antwoordt op een beurtgescoped
app-server-verzoek, verwacht de harness dat Codex voortgang maakt in de huidige beurt
en uiteindelijk de native beurt afrondt met `turn/completed`. Als de app-server stilvalt
gedurende `appServer.turnCompletionIdleTimeoutMs`, onderbreekt OpenClaw naar beste vermogen
de Codex-beurt, registreert een diagnostische time-out en geeft de OpenClaw-sessielane vrij
zodat opvolgende chatberichten niet achter een vastgelopen native beurt in de wachtrij komen.

De meeste niet-terminale meldingen voor dezelfde beurt schakelen die korte watchdog uit
omdat Codex heeft bewezen dat de beurt nog actief is. Tool-handoffs gebruiken een langer
post-tool-inactiviteitsbudget: nadat OpenClaw een `item/tool/call`-respons retourneert, nadat
native tool-items zoals `commandExecution` zijn voltooid, na ruwe
`custom_tool_call_output`-voltooiingen, en na ruwe voortgang van de assistent na een tool,
ruwe redeneervoltooiingen of redeneervoortgang. De guard gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer die is geconfigureerd en
valt anders terug op vijf minuten. Datzelfde post-toolbudget verlengt ook de
voortgangs-watchdog voor het stille synthesevenster voordat Codex de volgende
huidige-beurtgebeurtenis uitzendt. Redeneervoltooiingen, voltooiingen van commentary
`agentMessage`, en pre-tool ruwe redeneer- of assistentvoortgang kunnen
worden gevolgd door een automatisch definitief antwoord, dus gebruiken ze de antwoordguard
na voortgang in plaats van de sessielane meteen vrij te geven. Alleen
definitieve/niet-commentary voltooide `agentMessage`-items en pre-tool ruwe assistentvoltooiingen
activeren de vrijgave voor assistentuitvoer: als Codex daarna stilvalt zonder
`turn/completed`, onderbreekt OpenClaw naar beste vermogen de native beurt en geeft het
de sessielane vrij. Replay-veilige stdio-app-serverfouten, inclusief
inactiviteitstime-outs bij beurtvoltooiing zonder bewijs van assistent, tool, actief item of
neveneffect, worden eenmaal opnieuw geprobeerd met een nieuwe app-serverpoging. Onveilige
time-outs halen nog steeds de vastgelopen app-serverclient uit gebruik en geven de OpenClaw-
sessielane vrij. Ze wissen ook de verouderde native threadbinding in plaats van automatisch
opnieuw te worden afgespeeld. Completion-watch-time-outs tonen Codex-specifieke time-outtekst:
replay-veilige gevallen melden dat de respons mogelijk onvolledig is, terwijl onveilige gevallen
de gebruiker vragen de huidige status te verifiëren voordat opnieuw wordt geprobeerd. Publieke
time-outdiagnostiek bevat structurele velden zoals de laatste app-servermeldingsmethode,
de item-id/het type/de rol van de ruwe assistentrespons, aantallen actieve requests/items en de
geactiveerde watchstatus. Wanneer de laatste melding een ruw assistentresponsitem is, bevat die
ook een begrensde voorbeeldweergave van assistenttekst. Ruwe prompt- of toolinhoud wordt niet
opgenomen.

## Modeldetectie

Standaard vraagt de Codex-Plugin de app-server om beschikbare modellen. Modelbeschikbaarheid
wordt beheerd door de Codex-app-server, dus de lijst kan veranderen wanneer OpenClaw
de gebundelde `@openai/codex`-versie bijwerkt of wanneer een deployment
`appServer.command` naar een andere Codex-binary laat wijzen. Beschikbaarheid kan ook
accountgebonden zijn. Gebruik `/codex models` op een actieve Gateway om de livecatalogus
voor die harness en dat account te bekijken.

Als detectie mislukt of verloopt, gebruikt OpenClaw een gebundelde fallbackcatalogus voor:

- GPT-5.5
- GPT-5.4 mini

De huidige gebundelde harness is `@openai/codex` `0.142.5`. Een `model/list`-probe
tegen die gebundelde app-server retourneerde deze publieke picker-rijen:

| Model-id              | Invoermodaliteiten | Redeneerinspanningen      |
| --------------------- | ------------------ | ------------------------- |
| `gpt-5.5`             | tekst, afbeelding  | low, medium, high, xhigh  |
| `gpt-5.4`             | tekst, afbeelding  | low, medium, high, xhigh  |
| `gpt-5.4-mini`        | tekst, afbeelding  | low, medium, high, xhigh  |
| `gpt-5.3-codex-spark` | tekst              | low, medium, high, xhigh  |

Verborgen modellen kunnen door de app-servercatalogus worden geretourneerd voor interne of
gespecialiseerde flows, maar het zijn geen normale model-pickerkeuzes.

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

Schakel detectie uit wanneer je wilt dat het opstarten Codex niet proben en alleen de
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

Codex verwerkt `AGENTS.md` zelf via native projectdoc-detectie. OpenClaw
schrijft geen synthetische Codex-projectdocbestanden en is niet afhankelijk van Codex-fallback-
bestandsnamen voor personabestanden, omdat Codex-fallbacks alleen gelden wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw-workspacepariteit lost de Codex-harness de andere bootstrapbestanden op.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` en `USER.md` worden doorgestuurd als
OpenClaw Codex-developerinstructies omdat ze de actieve agent, beschikbare
workspace-richtlijnen en het gebruikersprofiel definiëren. De compacte OpenClaw Skills-
lijst wordt doorgestuurd als beurtgebonden developerinstructies voor samenwerking.
`HEARTBEAT.md`-inhoud wordt niet geïnjecteerd; heartbeat-beurten krijgen een pointer in
samenwerkingsmodus om het bestand te lezen wanneer het bestaat en niet leeg is. `MEMORY.md`-inhoud
uit de geconfigureerde agentworkspace wordt niet in native Codex-beurtinvoer geplakt
wanneer memory-tools beschikbaar zijn voor die workspace; wanneer het bestaat, voegt de harness
een kleine workspace-memory-pointer toe aan beurtgebonden developerinstructies voor samenwerking
en moet Codex `memory_search` of `memory_get` gebruiken wanneer duurzame memory
relevant is. Als tools zijn uitgeschakeld, memory search niet beschikbaar is, of de
actieve workspace verschilt van de agent-memory-workspace, gebruikt `MEMORY.md` het
normale begrensde beurtcontextpad.
`BOOTSTRAP.md` wordt, wanneer aanwezig, doorgestuurd als OpenClaw-invoerreferentiecontext
voor de beurt.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Configuratie heeft
de voorkeur voor herhaalbare deployments omdat dit het Plugin-gedrag in hetzelfde
gereviewde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [OpenAI-provider](/nl/providers/openai)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
