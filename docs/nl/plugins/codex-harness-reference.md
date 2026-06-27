---
read_when:
    - Je hebt elk configuratieveld van de Codex-harness nodig
    - Je wijzigt het transport-, authenticatie-, discovery- of time-outgedrag van de app-server
    - Je debugt het opstarten van de Codex-harness, modelontdekking of omgevingsisolatie
summary: Configuratie-, authenticatie-, detectie- en appserverreferentie voor de Codex-harness
title: Referentie voor Codex-harnas
x-i18n:
    generated_at: "2026-06-27T17:51:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Deze referentie behandelt de gedetailleerde configuratie voor de gebundelde `codex`
Plugin. Begin voor installatie- en routeringsbeslissingen met
[Codex-harness](/nl/plugins/codex-harness).

## Configuratieoppervlak van de Plugin

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

| Veld                       | Standaard                | Betekenis                                                                                                                                |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | ingeschakeld             | Modeldetectie-instellingen voor Codex app-server `model/list`.                                                                           |
| `appServer`                | beheerde stdio-app-server | Instellingen voor transport, opdracht, auth, goedkeuring, sandbox en time-out.                                                           |
| `codexDynamicToolsLoading` | `"searchable"`           | Gebruik `"direct"` om dynamische OpenClaw-tools direct in de initiële Codex-toolcontext te plaatsen.                                     |
| `codexDynamicToolsExclude` | `[]`                     | Aanvullende namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-server-beurten.                               |
| `codexPlugins`             | uitgeschakeld            | Native Codex-plugin-/app-ondersteuning voor gemigreerde, vanuit bron geïnstalleerde curated plugins. Zie [Native Codex-plugins](/nl/plugins/codex-native-plugins). |
| `computerUse`              | uitgeschakeld            | Codex Computer Use-installatie. Zie [Codex Computer Use](/nl/plugins/codex-computer-use).                                                   |

## App-servertransport

OpenClaw start standaard de beheerde Codex-binary die met de gebundelde
Plugin wordt geleverd:

```bash
codex app-server --listen stdio://
```

Hierdoor blijft de app-serverversie gekoppeld aan de gebundelde `codex` Plugin in plaats van aan
welke afzonderlijke Codex CLI toevallig lokaal is geïnstalleerd. Stel
`appServer.command` alleen in wanneer je bewust een ander
uitvoerbaar bestand wilt uitvoeren.

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

| Veld                                          | Standaard                                             | Betekenis                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                                                                                                                |
| `command`                                     | beheerd Codex-binair bestand                         | Uitvoerbaar bestand voor stdio-transport. Laat dit niet ingesteld om het beheerde binaire bestand te gebruiken.                                                                                                                                                                                                                                                                                 |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | niet ingesteld                                        | WebSocket-URL van de app-server.                                                                                                                                                                                                                                                                                                                                                                 |
| `authToken`                                   | niet ingesteld                                        | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                  |
| `headers`                                     | `{}`                                                  | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                |
| `clearEnv`                                    | `[]`                                                  | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio-app-serverproces nadat OpenClaw de overgeërfde omgeving heeft opgebouwd.                                                                                                                                                                                                                                      |
| `remoteWorkspaceRoot`                         | niet ingesteld                                        | Externe workspace-root van de Codex-app-server. Als dit is ingesteld, leidt OpenClaw de lokale workspace-root af uit de opgeloste OpenClaw-workspace, behoudt het huidige cwd-achtervoegsel onder deze externe root en stuurt alleen de uiteindelijke app-server-cwd naar Codex. Als de cwd buiten de opgeloste OpenClaw-workspace-root valt, faalt OpenClaw gesloten in plaats van een gateway-lokaal pad naar de externe app-server te sturen. |
| `requestTimeoutMs`                            | `60000`                                               | Time-out voor control-plane-aanroepen naar de app-server.                                                                                                                                                                                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Stille periode nadat Codex een beurt accepteert of na een beurtgebonden app-serververzoek terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Completion-idle- en voortgangsbewaking gebruikt na een tool-overdracht, native tool-voltooiing, post-tool raw-assistant-voortgang, raw-reasoning-voltooiing of reasoning-voortgang terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware workloads waarbij post-tool-synthese terecht langer stil kan blijven dan het uiteindelijke vrijgavebudget van de assistant. |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO verbieden | Voorinstelling voor YOLO- of door guardian beoordeelde uitvoering.                                                                                                                                                                                                                                                                                                                              |
| `approvalPolicy`                              | `"never"` of een toegestaan guardian-goedkeuringsbeleid | Native Codex-goedkeuringsbeleid dat naar thread-start, resume en turn wordt gestuurd.                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar thread-start en resume wordt gestuurd. Actieve OpenClaw-sandboxes beperken `danger-full-access`-beurten tot Codex `workspace-write`; de netwerkvlag van de beurt volgt de sandbox-egress van OpenClaw.                                                                                                                                                     |
| `approvalsReviewer`                           | `"user"` of een toegestane guardian-reviewer          | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer dat is toegestaan.                                                                                                                                                                                                                                                                                       |
| `defaultWorkspaceDir`                         | huidige procesmap                                     | Workspace gebruikt door `/codex bind` wanneer `--cwd` is weggelaten.                                                                                                                                                                                                                                                                                                                            |
| `serviceTier`                                 | niet ingesteld                                        | Optionele Codex app-server-servicetier. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flex-verwerking aan en `null` wist de override. Verouderde `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                                                  |
| `networkProxy`                                | uitgeschakeld                                         | Kies voor Codex permissions-profile-netwerken voor app-servercommando's. OpenClaw definieert de geselecteerde configuratie `permissions.<profile>.network` en selecteert die met `default_permissions` in plaats van `sandbox` te sturen.                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                               | Preview-opt-in die een door OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij Codex app-server 0.132.0 of nieuwer, zodat native Codex-uitvoering binnen de actieve OpenClaw-sandbox kan draaien.                                                                                                                                                                                     |

`appServer.networkProxy` is expliciet omdat dit het Codex-sandboxcontract
wijzigt. Wanneer dit is ingeschakeld, stelt OpenClaw ook `features.network_proxy.enabled` en
`default_permissions` in de Codex-threadconfiguratie in, zodat het gegenereerde
permission-profile door Codex beheerd netwerken kan starten. Standaard genereert
OpenClaw een botsingsbestendige profielnaam `openclaw-network-<fingerprint>` uit de
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

Als de normale app-server-runtime `danger-full-access` zou zijn, gebruikt het
inschakelen van `networkProxy` workspace-achtige bestandssysteemtoegang voor het
gegenereerde permission-profile. Door Codex beheerde netwerkhandhaving is
gesandboxt netwerken, dus een full-access-profiel zou uitgaand verkeer niet
beschermen.

De Plugin blokkeert oudere of niet-geversioneerde app-server-handshakes. Codex
app-server moet stabiele versie `0.125.0` of nieuwer rapporteren.

OpenClaw behandelt niet-loopback WebSocket-app-server-URL's als extern en vereist
identiteitsdragende WebSocket-authenticatie via `appServer.authToken` of een
`Authorization`-header. `appServer.authToken` en elke waarde van
`appServer.headers.*` kunnen een SecretInput zijn; de secrets-runtime lost
SecretRefs en env-shorthand op voordat OpenClaw startopties voor de app-server
opbouwt, en niet-opgeloste gestructureerde SecretRefs falen voordat een token of
header wordt verzonden. Wanneer native Codex-Plugins zijn geconfigureerd,
gebruikt OpenClaw het Plugin-besturingsvlak van de verbonden app-server om die
Plugins te installeren of te vernieuwen en vernieuwt daarna de app-inventaris,
zodat apps die eigendom zijn van Plugins zichtbaar zijn voor de Codex-thread.
`app/list` blijft de gezaghebbende bron voor inventaris en metadata, maar
OpenClaw-beleid bepaalt of `thread/start` `config.apps[appId].enabled = true`
verzendt voor een vermelde toegankelijke app, zelfs als Codex die momenteel als
uitgeschakeld markeert. Onbekende of ontbrekende app-id's blijven fail-closed;
dit pad activeert alleen marketplace-Plugins via `plugin/install` en vernieuwt
de inventaris. Verbind OpenClaw alleen met externe app-servers die worden
vertrouwd om door OpenClaw beheerde Plugin-installaties en vernieuwingen van
app-inventaris te accepteren.

## Goedkeurings- en sandboxmodi

Lokale stdio-app-serversessies gebruiken standaard de YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Deze vertrouwde lokale operatorhouding laat
onbeheerde OpenClaw-beurten en Heartbeats voortgang maken zonder native
goedkeuringsprompts die niemand kan beantwoorden.

Als het lokale systeemvereistenbestand van Codex impliciete YOLO-waarden voor
goedkeuring, reviewer of sandbox verbiedt, behandelt OpenClaw de impliciete
standaard in plaats daarvan als guardian en selecteert toegestane
guardian-machtigingen. `tools.exec.mode: "auto"` forceert ook door guardian
beoordeelde Codex-goedkeuringen en behoudt geen onveilige legacy-overschrijvingen
van `approvalPolicy: "never"` of `sandbox: "danger-full-access"`; stel
`tools.exec.mode: "full"` in voor een opzettelijke houding zonder goedkeuring.
Hostnaam-matchende
`[[remote_sandbox_config]]`-vermeldingen in hetzelfde vereistenbestand worden
gerespecteerd voor de standaardkeuze van de sandbox.

Stel `appServer.mode: "guardian"` in voor door Codex guardian beoordeelde
goedkeuringen:

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

De preset `guardian` wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"` wanneer die
waarden zijn toegestaan. Afzonderlijke beleidsvelden overschrijven `mode`. De
oudere reviewerwaarde `guardian_subagent` wordt nog steeds geaccepteerd als
compatibiliteitsalias, maar nieuwe configuraties moeten `auto_review` gebruiken.

Wanneer een OpenClaw-sandbox actief is, draait het lokale Codex-app-serverproces
nog steeds op de Gateway-host. OpenClaw schakelt daarom Codex native Code Mode,
gebruikers-MCP-servers en app-ondersteunde Plugin-uitvoering voor die beurt uit,
in plaats van Codex host-side sandboxing als gelijkwaardig aan de
OpenClaw-sandboxbackend te behandelen. Shelltoegang wordt beschikbaar gemaakt via
door de OpenClaw-sandbox ondersteunde dynamische tools zoals `sandbox_exec` en
`sandbox_process` wanneer de normale exec/process-tools beschikbaar zijn.

Op Ubuntu/AppArmor-hosts kan Codex bwrap onder `workspace-write` falen voordat
de shellopdracht start wanneer je opzettelijk native Codex `workspace-write`
uitvoert zonder actieve OpenClaw-sandboxing. Als je
`bwrap: setting up uid map: Permission denied` of
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` ziet, voer dan
`openclaw doctor` uit en herstel het gerapporteerde host-namespacebeleid voor de
OpenClaw-servicegebruiker in plaats van bredere Docker-containerrechten toe te
kennen. Geef de voorkeur aan een scoped AppArmor-profiel voor het serviceproces;
de fallback `kernel.apparmor_restrict_unprivileged_userns=0` is hostbreed en
heeft beveiligingsafwegingen.

## Gesandboxte native uitvoering

De stabiele standaard is fail-closed: actieve OpenClaw-sandboxing schakelt
native Codex-uitvoeringsoppervlakken uit die anders vanaf de Codex-app-serverhost
zouden draaien. Gebruik `appServer.experimental.sandboxExecServer: true` alleen
wanneer je Codex-ondersteuning voor externe omgevingen met de sandboxbackend van
OpenClaw wilt proberen. Dit previewpad vereist Codex-app-server 0.132.0 of
nieuwer.

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

Wanneer de vlag aan staat en de huidige OpenClaw-sessie gesandboxt is, start
OpenClaw een local loopback exec-server die wordt ondersteund door de actieve
sandbox, registreert die bij Codex-app-server en start de Codex-thread en -beurt
met die omgeving die eigendom is van OpenClaw. Als de app-server de omgeving
niet kan registreren, faalt de run fail-closed in plaats van stil terug te vallen
op hostuitvoering.

Dit previewpad is alleen lokaal. Een externe WebSocket-app-server kan de
loopback exec-server niet bereiken tenzij deze op dezelfde host draait, dus
OpenClaw wijst die combinatie af.

## Authenticatie en omgevingsisolatie

Authenticatie wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en
   OpenAI-authenticatie nog steeds vereist is.

Wanneer OpenClaw een Codex-authenticatieprofiel in ChatGPT-abonnementsstijl ziet,
verwijdert het `CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde
Codex-childproces. Daardoor blijven API-sleutels op Gateway-niveau beschikbaar
voor embeddings of directe OpenAI-modellen, zonder dat native
Codex-app-serverbeurten per ongeluk via de API worden gefactureerd.

Expliciete Codex-API-sleutelprofielen en lokale stdio-env-sleutelfallback
gebruiken app-serverlogin in plaats van overgeërfde childproces-env.
WebSocket-app-serververbindingen ontvangen geen Gateway env-API-sleutelfallback;
gebruik een expliciet authenticatieprofiel of het eigen account van de externe
app-server.

Stdio-app-serverstarts erven standaard de procesomgeving van OpenClaw.
OpenClaw bezit de Codex-app-serveraccountbrug en stelt `CODEX_HOME` in op een
per-agent directory onder de OpenClaw-state van die agent. Daardoor blijven
Codex-configuratie, accounts, Plugin-cache/data en threadstatus beperkt tot de
OpenClaw-agent, in plaats van binnen te lekken vanuit de persoonlijke
`~/.codex`-home van de operator.

OpenClaw herschrijft `HOME` niet voor normale lokale app-serverstarts. Door
Codex uitgevoerde subprocessen zoals `openclaw`, `gh`, `git`, cloud-CLI's en
shellopdrachten zien de normale proces-home en kunnen gebruikers-homeconfiguratie
en tokens vinden. Codex kan ook `$HOME/.agents/skills` en
`$HOME/.agents/plugins/marketplace.json` ontdekken; die `.agents`-ontdekking
wordt opzettelijk gedeeld met de operator-home en staat los van geïsoleerde
`~/.codex`-state.

OpenClaw-Plugins en OpenClaw-skill-snapshots lopen nog steeds via het eigen
Plugin-register en de eigen skill-loader van OpenClaw. Persoonlijke Codex
`~/.codex`-assets doen dat niet. Als je nuttige Codex CLI-Skills of Plugins uit
een Codex-home hebt die onderdeel moeten worden van een OpenClaw-agent, maak er
dan expliciet een inventaris van:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Als een deployment aanvullende omgevingsisolatie nodig heeft, voeg die variabelen
dan toe aan `appServer.clearEnv`:

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

`appServer.clearEnv` beïnvloedt alleen het gespawnde Codex-app-serverchildproces.
OpenClaw verwijdert `CODEX_HOME` en `HOME` uit deze lijst tijdens normalisatie
van lokale starts: `CODEX_HOME` blijft per-agent, en `HOME` blijft overgeërfd
zodat subprocessen normale gebruikers-homestatus kunnen gebruiken.

## Dynamische tools

Dynamische Codex-tools gebruiken standaard `searchable`-laden. OpenClaw stelt
geen dynamische tools beschikbaar die native Codex-werkruimtebewerkingen
dupliceren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

De meeste overige OpenClaw-integratietools, zoals messaging, media, cron,
browser, nodes, gateway, `heartbeat_respond` en `web_search`, zijn beschikbaar
via Codex-toolzoekopdrachten onder de namespace `openclaw`. Dit houdt de
initiële modelcontext kleiner. `sessions_yield` en source-replies met alleen
message-tools blijven direct omdat dit turn-control-contracten zijn.
`sessions_spawn` blijft doorzoekbaar zodat Codex' native `spawn_agent` het
primaire Codex-subagentoppervlak blijft, terwijl expliciete OpenClaw- of
ACP-delegatie nog steeds beschikbaar is via de dynamische toolnamespace
`openclaw`.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt
met een aangepaste Codex-app-server die uitgestelde dynamische tools niet kan
doorzoeken, of wanneer je de volledige toolpayload debugt.

## Time-outs

Dynamische toolcalls die eigendom zijn van OpenClaw worden onafhankelijk van
`appServer.requestTimeoutMs` begrensd. Elke Codex `item/tool/call`-aanvraag
gebruikt de eerste beschikbare time-out in deze volgorde:

- Een positief per-call `timeoutMs`-argument.
- Voor `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Voor `image_generate` zonder geconfigureerde time-out: de standaard van 120
  seconden voor beeldgeneratie.
- Voor de media-understanding-tool `image`, `tools.media.image.timeoutSeconds`
  omgezet naar milliseconden, of de mediastandaard van 60 seconden. Voor
  image understanding geldt dit voor de aanvraag zelf en wordt dit niet
  verminderd door eerder voorbereidend werk.
- De standaard van 90 seconden voor dynamische tools.

Deze watchdog is het buitenste dynamische `item/tool/call`-budget.
Providerspecifieke aanvraagtime-outs draaien binnen die call en behouden hun
eigen time-outsemantiek. Budgetten voor dynamische tools zijn gemaximeerd op
600000 ms. Bij een time-out breekt OpenClaw het toolsignaal af waar dat wordt
ondersteund en retourneert het een mislukte dynamic-tool-response aan Codex,
zodat de beurt kan doorgaan in plaats van de sessie in `processing` te laten
staan.

Nadat Codex een beurt accepteert, en nadat OpenClaw reageert op een
turn-scoped app-serveraanvraag, verwacht de harness dat Codex voortgang maakt in
de huidige beurt en de native beurt uiteindelijk afrondt met `turn/completed`.
Als de app-server stilvalt gedurende `appServer.turnCompletionIdleTimeoutMs`,
onderbreekt OpenClaw naar beste kunnen de Codex-beurt, registreert het een
diagnostische time-out en geeft het de OpenClaw-sessielane vrij, zodat opvolgende
chatberichten niet achter een verlopen native beurt in de wachtrij blijven staan.

De meeste niet-terminale meldingen voor dezelfde beurt schakelen die korte watchdog uit
omdat Codex heeft bewezen dat de beurt nog actief is. Tooloverdrachten gebruiken een langer
inactiviteitsbudget na de tool: nadat OpenClaw een `item/tool/call`-antwoord retourneert, nadat
native toolitems zoals `commandExecution` zijn voltooid, na onbewerkte
`custom_tool_call_output`-voltooiingen, en na onbewerkte assistentvoortgang na een tool,
onbewerkte redeneervoltooiingen of redeneervoortgang. De bewaking gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer dit is geconfigureerd en
valt anders terug op vijf minuten. Datzelfde budget na de tool verlengt ook de
voortgangswatchdog voor het stille synthesevenster voordat Codex de volgende gebeurtenis van de
huidige beurt uitzendt. Redeneervoltooiingen, voltooiingen van commentaar-
`agentMessage` en onbewerkte redeneer- of assistentvoortgang vóór een tool kunnen worden
gevolgd door een automatisch eindantwoord, dus gebruiken ze de antwoordbewaking na voortgang
in plaats van de sessielane direct vrij te geven. Alleen
voltooide definitieve/niet-commentaar-`agentMessage`-items en onbewerkte assistentvoltooiingen
vóór een tool activeren de vrijgave van assistentuitvoer: als Codex daarna stilvalt zonder
`turn/completed`, onderbreekt OpenClaw naar beste kunnen de native beurt en geeft het de
sessielane vrij. Herhaalveilige stdio-app-serverfouten, inclusief
inactiviteitstime-outs bij beurtvoltooiing zonder bewijs van assistent, tool, actief item of
neveneffect, worden één keer opnieuw geprobeerd met een nieuwe app-serverpoging. Onveilige
time-outs verwijderen nog steeds de vastgelopen app-serverclient en geven de OpenClaw-
sessielane vrij. Ze wissen ook de verouderde native threadbinding in plaats van automatisch
opnieuw te worden afgespeeld. Time-outs van voltooiingsbewaking tonen Codex-specifieke
time-outtekst: herhaalveilige gevallen zeggen dat het antwoord mogelijk onvolledig is, terwijl
onveilige gevallen de gebruiker vragen de huidige staat te verifiëren voordat opnieuw wordt
geprobeerd. Publieke time-outdiagnostiek bevat structurele velden zoals de laatste
meldingsmethode van de app-server, de id/het type/de rol van het onbewerkte assistentantwoorditem,
aantallen actieve verzoeken/items en de ingeschakelde bewakingsstatus. Wanneer de laatste melding
een onbewerkt assistentantwoorditem is, bevatten ze ook een begrensde voorbeeldweergave van de
assistenttekst. Ze bevatten geen onbewerkte prompt- of toolinhoud.

## Modeldetectie

Standaard vraagt de Codex-Plugin de app-server om beschikbare modellen. Modelbeschikbaarheid
is eigendom van de Codex-app-server, dus de lijst kan veranderen wanneer OpenClaw de gebundelde
versie van `@openai/codex` bijwerkt of wanneer een implementatie
`appServer.command` naar een andere Codex-binary laat wijzen. Beschikbaarheid kan ook
accountgebonden zijn. Gebruik `/codex models` op een draaiende gateway om de live catalogus
voor die harness en dat account te zien.

Als detectie mislukt of een time-out krijgt, gebruikt OpenClaw een gebundelde fallbackcatalogus voor:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

De huidige gebundelde harness is `@openai/codex` `0.139.0`. Een `model/list`-probe
tegen die gebundelde app-server retourneerde:

| Model-id        | Standaard | Verborgen | Invoermodaliteiten | Redeneerinspanningen     |
| --------------- | --------- | --------- | ------------------ | ------------------------ |
| `gpt-5.5`       | Ja        | Nee       | tekst, afbeelding  | low, medium, high, xhigh |
| `gpt-5.4`       | Nee       | Nee       | tekst, afbeelding  | low, medium, high, xhigh |
| `gpt-5.4-mini`  | Nee       | Nee       | tekst, afbeelding  | low, medium, high, xhigh |
| `gpt-5.3-codex` | Nee       | Nee       | tekst, afbeelding  | low, medium, high, xhigh |
| `gpt-5.2`       | Nee       | Nee       | tekst, afbeelding  | low, medium, high, xhigh |

Verborgen modellen kunnen door de app-servercatalogus worden geretourneerd voor interne of
gespecialiseerde flows, maar het zijn geen normale keuzes in de modelkiezer.

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

Schakel detectie uit wanneer je wilt dat opstarten Codex niet peilt en alleen de
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

Codex verwerkt `AGENTS.md` zelf via native projectdocumentdetectie. OpenClaw
schrijft geen synthetische Codex-projectdocumentbestanden en is niet afhankelijk van Codex-fallback-
bestandsnamen voor personabestanden, omdat Codex-fallbacks alleen gelden wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw-workspacepariteit lost de Codex-harness de andere bootstrapbestanden op.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` en `USER.md` worden doorgestuurd als
OpenClaw Codex-ontwikkelaarsinstructies omdat ze de actieve agent,
beschikbare workspacerichtlijnen en het gebruikersprofiel definiëren. De compacte OpenClaw-Skills-
lijst wordt doorgestuurd als beurtgebonden ontwikkelaarsinstructies voor samenwerking.
`HEARTBEAT.md`-inhoud wordt niet geïnjecteerd; heartbeatbeurten krijgen een aanwijzer in samenwerkingsmodus
om het bestand te lezen wanneer het bestaat en niet leeg is. `MEMORY.md`-inhoud
uit de geconfigureerde agentworkspace wordt niet in de native Codex-beurtinvoer geplakt
wanneer geheugentools beschikbaar zijn voor die workspace; wanneer het bestand bestaat, voegt de harness
een kleine workspacegeheugenaanwijzer toe aan beurtgebonden ontwikkelaarsinstructies voor samenwerking
en moet Codex `memory_search` of `memory_get` gebruiken wanneer duurzaam
geheugen relevant is. Als tools zijn uitgeschakeld, geheugenzoekactie niet beschikbaar is, of de
actieve workspace verschilt van de agentgeheugenworkspace, gebruikt `MEMORY.md` het
normale begrensde beurtcontextpad.
`BOOTSTRAP.md` wordt, indien aanwezig, doorgestuurd als OpenClaw-referentiecontext voor beurtinvoer.

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
de voorkeur voor herhaalbare implementaties omdat dit het Plugin-gedrag in hetzelfde
gereviewde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [OpenAI-provider](/nl/providers/openai)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
