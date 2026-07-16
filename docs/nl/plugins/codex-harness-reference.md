---
read_when:
    - Je hebt elk configuratieveld van de Codex-harnas nodig
    - Je wijzigt het transport-, authenticatie-, detectie- of time-outgedrag van de app-server
    - Je debugt het opstarten van de Codex-harness, modeldetectie of omgevingsisolatie
summary: Referentie voor configuratie, authenticatie, detectie en appserver van de Codex-harness
title: Codex-harnasreferentie
x-i18n:
    generated_at: "2026-07-16T15:54:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00dd9050fdc9f2c179012285540f49ada8825f29be1d4630742a4d948a5318a1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Deze referentie behandelt de gedetailleerde configuratie voor de officiële Plugin `codex`.
Begin voor installatie- en routeringsbeslissingen met
[Codex-harnas](/nl/plugins/codex-harness).

## Configuratieoppervlak van de Plugin

Alle instellingen van het Codex-harnas staan onder `plugins.entries.codex.config`.

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

Velden op het hoogste niveau:

| Veld                       | Standaard                | Betekenis                                                                                                                                      |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | ingeschakeld             | Instellingen voor modeldetectie voor Codex app-server `model/list`.                                                                             |
| `appServer`                | beheerde stdio-app-server | Instellingen voor transport, opdracht, authenticatie, goedkeuring, sandbox en time-out. Het gewone harnas gebruikt standaard agentspecifieke status. |
| `codexDynamicToolsLoading` | `"searchable"`           | Gebruik `"direct"` om dynamische OpenClaw-tools rechtstreeks in de initiële Codex-toolcontext te plaatsen.                                    |
| `codexDynamicToolsExclude` | `[]`                     | Aanvullende namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-server-beurten.                                      |
| `codexPlugins`             | uitgeschakeld            | Ondersteuning voor native Codex-plugins/apps, inclusief opt-in-toegang tot apps van verbonden accounts. Zie [Native Codex-plugins](/nl/plugins/codex-native-plugins). |
| `computerUse`              | uitgeschakeld            | Configuratie van Codex Computer Use. Zie [Codex Computer Use](/nl/plugins/codex-computer-use).                                                     |
| `sessionCatalog`           | ingeschakeld             | Native Codex-sessiedetectie voor de zijbalk. Stel `enabled: false` in om detectie uit te schakelen zonder de provider of het harnas uit te schakelen. |
| `supervision`              | uitgeschakeld            | Beleid voor agentgerichte transcripties en schrijfbeheer van native sessies. Zie [Codex-toezicht](/plugins/codex-supervision).                 |

## Toezicht

Native sessiedetectie toont standaard niet-gearchiveerde Codex-sessies van de Gateway-
computer en aangemelde gekoppelde nodes. Schakel alleen die catalogus hiermee uit:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` beheert agentgerichte tools afzonderlijk:

| Veld                  | Standaard                | Betekenis                                                                                                                                                                                                                                 |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Schakel agentgerichte Codex-toezichtstools in. Dit beheert niet de catalogus van geauthenticeerde operatorsessies.                                                                                                                        |
| `endpoints`           | ingebouwd lokaal eindpunt | Compatibiliteits- en geavanceerde eindpuntdoelen voor de behouden Codex-toezichtsagent en zelfstandige MCP-tools. De menselijke catalogus en branchestroom negeren deze doelen en gebruiken de toezicht-App Server die vanuit `appServer` wordt bepaald. |
| `allowRawTranscripts` | `false`                 | Sta bij ingeschakeld toezicht autonome transcriptlezingen door agents of zelfstandige MCP en uit transcripties afgeleide lijstvelden toe. Metagegevenslezingen via `codex_threads` blijven beschikbaar. Beheert niet het voortzetten via de geauthenticeerde Control UI. |
| `allowWriteControls`  | `false`                 | Sta bij ingeschakeld toezicht autonome `codex_threads`-bewerkingen voor forken, hernoemen, archiveren en uit het archief halen toe, plus zelfstandige MCP-bewerkingen voor verzenden, bijsturen en onderbreken. Omzeilt geen andere controles voor binding, host, status of bevestiging. |

Eindpuntvermeldingen accepteren deze velden:

| Veld           | Van toepassing op | Betekenis                                                            |
| -------------- | ------------------ | -------------------------------------------------------------------- |
| `id`           | alles             | Stabiele eindpunt-id.                                                |
| `label`        | alles             | Optioneel weergavelabel.                                             |
| `transport`    | alles             | `"stdio-proxy"` of `"websocket"`.                                  |
| `command`      | `stdio-proxy`  | Optionele App Server-opdracht.                                       |
| `args`         | `stdio-proxy`  | Optionele opdrachtargumenten.                                        |
| `cwd`          | `stdio-proxy`  | Optionele werkmap voor het onderliggende proces.                     |
| `url`          | `websocket`    | Vereiste WebSocket- of ondersteunde lokale socket-URL.               |
| `authTokenEnv` | `websocket`    | Optionele omgevingsvariabele waarvan de waarde het eindpunt authenticeert. |

De pagina **Codex-sessies** gebruikt de toezicht-App Server van de Plugin en toont
alleen niet-gearchiveerde sessies. Zonder expliciete verbindingsinstellingen voor
`appServer` wordt die verbinding beheerd via stdio in de thuismap van de gebruiker.
Opgeslagen of inactieve lokale rijen kunnen een modelvergrendelde Chat maken met een
begrensde geschiedenis van gebruiker en assistent tot en met de laatste terminaal
opgeslagen bronbeurt. De privébinding houdt de snapshot-fork, de canonieke
branch met `appServer` als bron, de injectie van geschiedenis en latere beurten
op die verbinding. Bij de eerste canonieke start wordt het paar gebruikt dat door de
fork wordt geretourneerd. Bij latere hervattingen worden OpenClaw-overschrijvingen
voor model en provider weggelaten, zodat Codex het opgeslagen paar van de canonieke
thread herstelt; een afzonderlijke native wijziging kan dat paar bijwerken, maar het
buitenste model en de fallbackketen vervangen het nooit. Opgeslagen en inactieve
rijen kunnen worden gearchiveerd na bevestiging dat er geen andere runner is, tenzij
een andere actieve OpenClaw-binding eigenaar is van het exacte doel of van een van
de niet-gearchiveerde voortgebrachte afstammelingen ervan. OpenClaw volgt de
paginering van afstammelingen van Codex en weigert veilig bij enumeratiefouten,
cycli of uitputting van de veiligheidslimiet. Bevestiging dekt nog steeds onbekende
native clients en de race tussen status en archivering. Een modelvergrendelde Chat
onder toezicht kan niet worden verwijderd zolang deze de native binding beschermt.
Actieve bronnen kunnen geen branch maken of worden gearchiveerd, maar een bestaande
Chat onder toezicht kan nog steeds worden geopend. Elke rij van een gekoppelde node
blijft alleen-lezen; het nodetransport biedt nog niet de streaminglevenscyclus die
het harnas nodig heeft.

Alleen `appServer.homeScope: "user"` wijzigt welke Codex-thuismap een beheerd harnasproces
gebruikt; het publiceert de vlootcatalogus niet. Toezicht inschakelen wijzigt de
standaardwaarde van het harnas niet. In plaats daarvan gebruikt de afzonderlijke
toezichtverbinding standaard beheerde stdio in de thuismap van de gebruiker wanneer
er geen expliciete verbindingsinstellingen voor `appServer` bestaan.
Expliciete instellingen worden voor die verbinding gerespecteerd. Voorlopige en
vastgelegde bindingen onder toezicht behouden die verbinding voor elke beurt;
uitgeschakeld toezicht of afwijkingen in verbinding of levenscyclus leiden tot
veilig weigeren in plaats van terugvallen op het harnas in de agentthuismap.
De standaardverbinding deelt opgeslagen sessies met native Codex-clients, niet hun
proceslokale activiteitsstatus.

Verouderde instellingen voor `plugins.entries.codex-supervisor` zijn buiten gebruik gesteld. Voer
`openclaw doctor --fix` uit om de oude vermelding, eindpuntdefinities, beleidsvlaggen
en verwijzingen voor toestaan/weigeren van plugins naar dit blok te migreren.
Expliciete canonieke waarden voor `codex.config.supervision` winnen bij conflicten.

## App-servertransport

Voor gewone harnasbeurten start OpenClaw het beheerde Codex-binaire bestand dat met
de officiële Plugin wordt geleverd (momenteel `@openai/codex` `0.144.3`):

```bash
codex app-server --listen stdio://
```

Hierdoor blijft de app-serverversie gekoppeld aan de officiële Plugin
`codex`, in plaats van aan een afzonderlijke Codex CLI die toevallig
lokaal is geïnstalleerd. Stel `appServer.command` alleen in wanneer je bewust een
ander uitvoerbaar bestand wilt gebruiken. Gewone beheerde beurten met de standaard
geïsoleerde agentthuismap geven de voorkeur aan dit vastgezette pakket, zelfs wanneer
een macOS-desktopbundel is geïnstalleerd. Wanneer
[Computer Use](/nl/plugins/codex-computer-use) is ingeschakeld, of wanneer
`homeScope` `"user"` is en native Computer Use-status kan laden,
geeft beheerd opstarten in plaats daarvan de voorkeur aan het binaire bestand van de
desktopapp dat eigenaar is van de vereiste macOS-machtigingen. Dezelfde desktop-eerstregel
geldt wanneer de effectieve Codex-configuratie van een geïsoleerde agentthuismap
native Computer Use inschakelt. Als er geen desktopappbundel is geïnstalleerd, valt
OpenClaw terug op het binaire bestand van het vastgezette pakket.

De overdracht van uitvoerbare bestanden en het afschermen van native configuratie
coördineren clients binnen één actief Gateway-proces. Start de Gateway opnieuw nadat
een ander proces de configuratie van de native Codex-plugin wijzigt.

Toezicht bepaalt een afzonderlijke verbinding. Zonder expliciete verbindingsinstellingen
voor `appServer` gebruikt het beheerde stdio met `homeScope: "user"`; het gewone
harnas blijft beheerde stdio gebruiken met `homeScope: "agent"`. Expliciete
verbindingsinstellingen worden door beide paden gerespecteerd. Stel
`homeScope: "user"` expliciet in wanneer het gewone harnas `$CODEX_HOME` (of
`~/.codex`) met native clients moet delen. Een privébinding onder toezicht
gebruikt de toezichtverbinding ongeacht de standaardwaarde van het gewone harnas.
Onafhankelijke App Server-processen behouden afzonderlijke live status- en
goedkeuringsstatussen.

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

Velden van `appServer`:

| Veld                                          | Standaardwaarde                                        | Betekenis                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` start Codex; expliciete `"unix"` maakt verbinding met de lokale besturingssocket; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                   |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoleert de gewone harnastoestand per OpenClaw-agent. `"user"` is een expliciete opt-in die de systeemeigen `$CODEX_HOME` of `~/.codex` deelt, systeemeigen authenticatie gebruikt en threadbeheer alleen voor de eigenaar inschakelt. Het gebruikersbereik ondersteunt lokale stdio- of Unix-transport. Voor de afzonderlijke supervisieverbinding wordt een niet-ingestelde waarde omgezet in `"user"` voor stdio of Unix en `"agent"` voor WebSocket.     |
| `command`                                     | beheerd Codex-binair bestand                           | Uitvoerbaar bestand voor stdio-transport. Laat dit niet ingesteld om het beheerde binaire bestand te gebruiken.                                                                                                                                                                                                                                                                                  |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | niet ingesteld                                         | WebSocket-App Server-URL of `unix://`-URL. Een expliciet leeg Unix-pad selecteert de canonieke besturingssocket in de thuismap van de gebruiker.                                                                                                                                                                                                                                                |
| `authToken`                                   | niet ingesteld                                         | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput, zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                            |
| `clearEnv`                                    | `[]`                                                   | Namen van extra omgevingsvariabelen die uit het gestarte stdio-app-serverproces worden verwijderd nadat OpenClaw de overgenomen omgeving heeft opgebouwd.                                                                                                                                                                                                                                       |
| `remoteWorkspaceRoot`                         | niet ingesteld                                         | Externe werkruimteroot van de Codex-app-server. Wanneer deze is ingesteld, leidt OpenClaw de lokale werkruimteroot af van de opgeloste OpenClaw-werkruimte, behoudt het huidige cwd-achtervoegsel onder deze externe root en stuurt alleen de uiteindelijke app-server-cwd naar Codex. Als de cwd buiten de opgeloste OpenClaw-werkruimteroot ligt, stopt OpenClaw veilig in plaats van een gateway-lokaal pad naar de externe app-server te sturen. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Installeert het Codex-`PreToolUse`-subproces dat uitsluitend wordt gebruikt voor lusdetectie door OpenClaw en de expliciete markering dat er geen beleid is. Stel `false` in om de procesfan-out per tool te verminderen. Plugin-hooks vóór tools en beleid voor vertrouwde tools installeren nog steeds hun vereiste relay.                                                                 |
| `requestTimeoutMs`                            | `60000`                                                | Time-out voor aanroepen van het besturingsvlak van de app-server.                                                                                                                                                                                                                                                                                                                               |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Stiltevenster nadat Codex een beurt accepteert of na een app-serververzoek binnen een beurt terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                                        |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Bewaking voor inactiviteit na voltooiing en voortgang, gebruikt na een tooloverdracht, voltooiing van een systeemeigen tool, ruwe assistentvoortgang na een tool, voltooiing van ruwe redenering of voortgang van redenering terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware werklasten waarbij synthese na een tool terecht langer stil kan blijven dan het budget voor de uiteindelijke assistentvrijgave.                                |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO verbieden | Voorinstelling voor YOLO-uitvoering of door een guardian beoordeelde uitvoering.                                                                                                                                                                                                                                                                                                                |
| `approvalPolicy`                              | `"never"` of een toegestaan goedkeuringsbeleid van de guardian       | Systeemeigen Codex-goedkeuringsbeleid dat naar het starten en hervatten van threads en naar beurten wordt gestuurd.                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` of een toegestane sandbox van de guardian  | Systeemeigen Codex-sandboxmodus die naar het starten en hervatten van threads wordt gestuurd. Actieve OpenClaw-sandboxes beperken `danger-full-access`-beurten tot Codex-`workspace-write`; de netwerkmarkering van de beurt volgt de uitgaande toegang van de OpenClaw-sandbox.                                                                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` of een toegestane beoordelaar van de guardian               | Gebruik `"auto_review"` om Codex systeemeigen goedkeuringsprompts te laten beoordelen wanneer dit is toegestaan.                                                                                                                                                                                                                                                                               |
| `defaultWorkspaceDir`                         | huidige procesmap                                      | Werkruimte die door `/codex bind` wordt gebruikt wanneer `--cwd` is weggelaten.                                                                                                                                                                                                                                                                                                 |
| `serviceTier`                                 | niet ingesteld                                         | Optionele servicelaag van de Codex-app-server. `"priority"` schakelt routering in snelle modus in, `"flex"` vraagt flexibele verwerking aan en `null` wist de overschrijving. Verouderde `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                                            |
| `networkProxy`                                | uitgeschakeld                                          | Schakel netwerktoegang via het Codex-machtigingsprofiel in voor app-serveropdrachten. OpenClaw definieert de geselecteerde `permissions.<profile>.network`-configuratie en selecteert deze met `default_permissions` in plaats van `sandbox` te verzenden.                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Preview-opt-in die een door een OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij de ondersteunde Codex-app-server, zodat systeemeigen Codex-uitvoering binnen de actieve OpenClaw-sandbox kan worden uitgevoerd.                                                                                                                                                                        |

`appServer.networkProxy` is expliciet omdat dit het Codex-sandboxcontract
wijzigt. Wanneer dit is ingeschakeld, stelt OpenClaw ook `features.network_proxy.enabled` en
`default_permissions` in de Codex-threadconfiguratie in, zodat het gegenereerde
machtigingsprofiel door Codex beheerd netwerkgebruik kan starten. OpenClaw genereert
standaard een botsingsbestendige `openclaw-network-<fingerprint>`-profielnaam op basis van de
profielinhoud; gebruik `profileName` alleen wanneer een stabiele lokale naam
vereist is.

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

Als de normale app-serverruntime `danger-full-access` zou zijn, gebruikt het
inschakelen van `networkProxy` in plaats daarvan bestandssysteemtoegang in
werkruimtestijl voor het gegenereerde machtigingsprofiel. Door Codex beheerde
netwerkhandhaving is gesandboxte netwerktoegang, dus een profiel met volledige
toegang zou uitgaand verkeer niet beschermen.

De Plugin blokkeert oudere app-serverhandshakes of handshakes zonder versie:
Codex app-server moet stabiele versie `0.143.0` of nieuwer rapporteren.

OpenClaw behandelt WebSocket-app-server-URL's die niet naar loopback verwijzen als
extern en vereist identiteitsdragende WebSocket-authenticatie via
`appServer.authToken` of een `Authorization`-header. `appServer.authToken` en elke
`appServer.headers.*`-waarde kunnen een SecretInput zijn; de secrets-runtime lost
SecretRefs en env-afkortingen op voordat OpenClaw de startopties voor de app-server
samenstelt, en niet-opgeloste gestructureerde SecretRefs mislukken voordat een token
of header wordt verzonden. Wanneer native Codex-plugins zijn geconfigureerd, gebruikt
OpenClaw het Plugin-besturingsvlak van de verbonden app-server om die plugins te
installeren of te vernieuwen en vernieuwt het daarna de app-inventaris, zodat apps
die eigendom zijn van plugins zichtbaar zijn voor de Codex-thread. `app/list`
blijft de gezaghebbende bron voor inventaris en metadata, maar OpenClaw-beleid bepaalt
of `thread/start` `config.apps[appId].enabled = true` verzendt voor een vermelde toegankelijke app,
zelfs als Codex deze momenteel als uitgeschakeld markeert. Onbekende of ontbrekende
app-id's blijven standaard geblokkeerd; dit pad activeert uitsluitend
marktplaatsplugins via `plugin/install` en vernieuwt de inventaris. Verbind OpenClaw
alleen met externe app-servers die je vertrouwt om door OpenClaw beheerde
Plugin-installaties en vernieuwingen van de app-inventaris te accepteren.

## Goedkeurings- en sandboxmodi

Lokale stdio-app-serversessies gebruiken standaard de YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Met deze houding voor een vertrouwde lokale operator kunnen
onbeheerde OpenClaw-beurten en Heartbeats voortgang boeken zonder native
goedkeuringsprompts die niemand kan beantwoorden.

Als het lokale systeemvereistenbestand van Codex impliciete YOLO-waarden voor
goedkeuring, beoordelaar of sandbox verbiedt, behandelt OpenClaw de impliciete
standaard in plaats daarvan als guardian en selecteert het toegestane
guardian-machtigingen. `tools.exec.mode: "auto"` dwingt ook door guardian beoordeelde
Codex-goedkeuringen af en behoudt geen onveilige verouderde
`approvalPolicy: "never"`- of `sandbox: "danger-full-access"`-overschrijvingen;
stel `tools.exec.mode: "full"` in voor een bewuste houding zonder goedkeuring.
`[[remote_sandbox_config]]`-vermeldingen in hetzelfde vereistenbestand waarvan de hostnaam
overeenkomt, worden gerespecteerd bij de beslissing over de standaard voor de sandbox.

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

De voorinstelling `guardian` wordt uitgebreid naar
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"` wanneer die
waarden zijn toegestaan. Afzonderlijke beleidsvelden overschrijven
`mode`. De oudere beoordelaarswaarde `guardian_subagent` wordt nog
geaccepteerd als compatibiliteitsalias, maar nieuwe configuraties moeten
`auto_review` gebruiken.

Wanneer een OpenClaw-sandbox actief is, draait het lokale Codex-app-serverproces nog
steeds op de Gateway-host. OpenClaw schakelt daarom voor die beurt native Code Mode
van Codex, MCP-servers van de gebruiker en door apps ondersteunde Plugin-uitvoering
uit, in plaats van sandboxing aan de Codex-hostzijde als gelijkwaardig aan de
OpenClaw-sandboxbackend te behandelen. Shelltoegang wordt beschikbaar gesteld via
dynamische tools met OpenClaw-sandboxondersteuning, zoals `sandbox_exec` en
`sandbox_process`, wanneer de normale exec-/procestools beschikbaar zijn.

<Note>
Op OpenClaw-sandboxhosts met Docker-backend (`agents.defaults.sandbox.mode` ingesteld op
een Docker-backend) controleert `openclaw doctor` of de host de naamruimten voor
de onbevoorrechte gebruiker toestaat (en, wanneer uitgaand netwerkverkeer van de
Docker-sandbox is uitgeschakeld, ook de netwerknaamruimten) die de geneste Codex
`bwrap` nodig heeft voor `workspace-write`-shelluitvoering binnen de
sandboxcontainer. Een mislukte controle verschijnt op Ubuntu-/AppArmor-hosts
doorgaans als `bwrap: setting up uid map: Permission denied` of
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`.
Herstel het gerapporteerde hostnaamruimtebeleid voor de OpenClaw-servicegebruiker en
start de Gateway opnieuw; geef de voorkeur aan een gericht AppArmor-profiel voor het
serviceproces boven de hostbrede
`kernel.apparmor_restrict_unprivileged_userns=0`-terugvaloptie en ken niet ruimere
Docker-containerrechten toe alleen om aan geneste `bwrap` te voldoen.
</Note>

## Gesandboxte native uitvoering

De stabiele standaard blokkeert bij fouten: actieve OpenClaw-sandboxing schakelt
native Codex-uitvoeringsoppervlakken uit die anders vanaf de Codex-app-serverhost
zouden worden uitgevoerd. Gebruik `appServer.experimental.sandboxExecServer: true` alleen wanneer je de
ondersteuning van Codex voor externe omgevingen met de sandboxbackend van OpenClaw
wilt uitproberen. Dit previewpad werkt met elke ondersteunde
Codex-app-serverversie.

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

Wanneer de vlag is ingeschakeld en de huidige OpenClaw-sessie is gesandboxt, start
OpenClaw een lokale loopback-exec-server met ondersteuning van de actieve sandbox,
registreert deze bij Codex app-server en start de Codex-thread en -beurt met die
omgeving die eigendom is van OpenClaw. Als de app-server de omgeving niet kan
registreren, wordt de uitvoering standaard geblokkeerd in plaats van stilzwijgend
terug te vallen op uitvoering op de host.

Dit previewpad is uitsluitend lokaal. Een externe WebSocket-app-server kan de
loopback-exec-server niet bereiken tenzij deze op dezelfde host draait, dus OpenClaw
weigert die combinatie.

## Authenticatie- en omgevingsisolatie

In de standaardhome per agent wordt authenticatie in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande app-serveraccount in de Codex-home van die agent.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en
   OpenAI-authenticatie nog steeds vereist is.

Wanneer OpenClaw een Codex-authenticatieprofiel in de stijl van een
ChatGPT-abonnement aantreft (OAuth- of tokenreferentietype), verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gestarte Codex-kindproces. Zo
blijven API-sleutels op Gateway-niveau beschikbaar voor embeddings of directe
OpenAI-modellen zonder dat native Codex-app-serverbeurten per ongeluk via de API
worden gefactureerd.

Expliciete Codex-API-sleutelprofielen en lokale stdio-terugval naar env-sleutels
gebruiken app-serveraanmelding in plaats van een overgenomen kindprocesomgeving.
WebSocket-app-serververbindingen ontvangen geen terugval naar API-sleutels uit de
Gateway-omgeving; gebruik een expliciet authenticatieprofiel of het eigen account
van de externe app-server.

Stdio-app-serverstarts nemen standaard de procesomgeving van OpenClaw over. OpenClaw
beheert de accountbrug van Codex app-server en stelt `CODEX_HOME` in op een
map per agent binnen de OpenClaw-status van die agent. Zo blijven Codex-configuratie,
accounts, Plugin-cache/-gegevens en threadstatus beperkt tot de OpenClaw-agent, in
plaats van binnen te lekken vanuit de persoonlijke `~/.codex`-home van de
operator.

Stel `appServer.homeScope: "user"` in om native Codex-status te delen met Codex
Desktop en de CLI. Deze lokale gebruikershomemodus ondersteunt beheerde stdio en
expliciet Unix-transport. De modus gebruikt `$CODEX_HOME` wanneer dit is ingesteld
en anders `~/.codex`, inclusief native authenticatie, configuratie, plugins
en threads. OpenClaw slaat voor de app-server de brug naar het authenticatieprofiel
over. Geverifieerde beurten van de eigenaar kunnen `codex_threads` gebruiken om
die threads weer te geven (met een optioneel `search`-filter), te lezen,
te vertakken, te hernoemen, te archiveren en uit het archief te halen. Vertak een
thread voordat je deze in OpenClaw voortzet; onafhankelijke Codex-processen
coördineren geen gelijktijdige schrijvers voor dezelfde thread.

Die opt-in `homeScope` geldt voor gewone harness-sessies. Een Chat die via
Codex Sessions is gemaakt, gebruikt in plaats daarvan de eigen privéverbinding voor
toezicht, die de authenticatie- en providerconfiguratie van de native verbinding
behoudt voor de canonieke vertakking en toekomstige hervattingen.

In een bewaakte Chat die aan een model is vergrendeld, kan `codex_threads` geen
andere vertakking koppelen of de aan de Chat gebonden native thread archiveren.
Weergeven en alleen-metadata lezen blijven beschikbaar. Voor het lezen van onbewerkte
transcripten is `allowRawTranscripts` vereist; wanneer dit is uitgeschakeld, wordt
zoeken in de lijst ook geweigerd omdat native zoeken overeenkomsten kan vinden in
transcriptvoorbeelden. Hernoemen, uit het archief halen, losgekoppeld vertakken en
archiveren van een niet-gerelateerde thread die niet het eigendom is van een andere
OpenClaw Chat, vereisen `allowWriteControls`. Geen van beide opties omzeilt een
vergrendelde binding.

OpenClaw herschrijft `HOME` niet voor normale lokale app-serverstarts.
Door Codex uitgevoerde subprocessen zoals `openclaw`, `gh`,
`git`, cloud-CLI's en shellopdrachten zien de normale proceshome en
kunnen configuratie en tokens in de gebruikershome vinden. Codex kan ook
`$HOME/.agents/skills` en `$HOME/.agents/plugins/marketplace.json` vinden; die
`.agents`-detectie wordt bewust gedeeld met de operatorhome en staat los
van de geïsoleerde `~/.codex`-status.

Binnen het standaardagentbereik blijven OpenClaw-plugins en momentopnamen van
OpenClaw-Skills via het eigen Plugin-register en de skill-loader van OpenClaw
stromen; persoonlijke Codex `~/.codex`-assets niet. Als je nuttige
Codex CLI-skills of -plugins uit een Codex-home hebt die deel moeten worden van een
geïsoleerde OpenClaw-agent, inventariseer deze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Als een implementatie aanvullende omgevingsisolatie nodig heeft, voeg je die
variabelen toe aan `appServer.clearEnv`:

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

`appServer.clearEnv` beïnvloedt alleen het gestarte Codex-app-serverkindproces.
OpenClaw verwijdert `CODEX_HOME` en `HOME` uit deze lijst tijdens
de normalisatie van lokale starts: `CODEX_HOME` blijft verwijzen naar het
geselecteerde agent- of gebruikersbereik en `HOME` blijft overgenomen,
zodat subprocessen de normale status in de gebruikershome kunnen gebruiken.

## Dynamische tools

Dynamische Codex-tools gebruiken standaard `searchable`-laden en worden
beschikbaar gesteld onder de `openclaw`-naamruimte met
`deferLoading: true`. OpenClaw stelt normaal geen dynamische tools beschikbaar die
native werkruimtebewerkingen van Codex of het eigen toolzoekoppervlak van Codex
dupliceren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

Wanneer een eindige runtime-toegestane-lijst native Code Mode uitschakelt, verzendt
OpenClaw een lege selectie voor de uitvoeringsomgeving. In dat directe,
niet-gesandboxte geval behoudt OpenClaw zijn door beleid gefilterde
`exec`- en `process`-tools als shellterugval.
Runtime-toegestane-lijsten en `codexDynamicToolsExclude` blijven van toepassing.

De meeste overige OpenClaw-integratietools, zoals berichten, media, Cron,
browser, nodes, Gateway, `heartbeat_respond` en `web_search`, zijn beschikbaar
via de Codex-toolzoekfunctie binnen die naamruimte. Hierdoor blijft de initiële
modelcontext kleiner. Een kleine set tools blijft altijd rechtstreeks aanroepbaar,
ongeacht `codexDynamicToolsLoading`, omdat de Codex-toolzoekfunctie niet beschikbaar kan zijn
of alleen een universum met connectors kan opleveren: `agents_list`,
`sessions_spawn` en `sessions_yield`. Ontwikkelaarsinstructies sturen normale
Codex-subagents nog steeds naar de systeemeigen `spawn_agent` voor
Codex-eigen subagentwerk, terwijl `sessions_spawn` beschikbaar blijft voor
expliciete delegatie via OpenClaw of ACP. Bronantwoorden die uitsluitend de
berichtentool gebruiken, blijven eveneens rechtstreeks, omdat dit een contract
voor beurtbesturing is.

Tools die zijn gemarkeerd met `catalogMode: "direct-only"`, waaronder de OpenClaw-tool
`computer`, worden gegroepeerd onder `openclaw_direct`. OpenClaw voegt
die naamruimte toe aan de lijst `code_mode.direct_only_tool_namespaces` van Codex zonder door de
operator aangeleverde vermeldingen te vervangen. Codex stelt die tools daarom
beschikbaar als `DirectModelOnly` in normale threads en threads die uitsluitend
in codemodus werken, in plaats van ze via geneste Code Mode-aanroepen naar
`tools.*` te routeren. Deze grens is vereist voor resultaten met
afbeeldingen: geneste Code Mode-serialisatie zet afbeeldingsuitvoer om in platte
tekst, waardoor de schermafbeelding die nodig is voor de volgende computeractie
verloren zou gaan.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt met een aangepaste
Codex-app-server die uitgestelde dynamische tools niet kan doorzoeken, of wanneer
je de volledige toolpayload debugt.

## Time-outs

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk
van `appServer.requestTimeoutMs` begrensd. Elk Codex-verzoek `item/tool/call` gebruikt
de eerste beschikbare time-out in deze volgorde:

- Een positief argument `timeoutMs` per aanroep.
- Voor `image_generate`: `agents.defaults.imageGenerationModel.timeoutMs`.
- Voor `image_generate` zonder geconfigureerde time-out: de standaard
  van 120 seconden voor het genereren van afbeeldingen.
- Voor de media-analysetool `image`: `tools.media.image.timeoutSeconds`,
  omgerekend naar milliseconden, of de mediastandaard van 60 seconden. Voor
  afbeeldingsanalyse geldt dit voor het verzoek zelf en wordt dit niet verkort
  door eerder voorbereidend werk.
- Voor de tool `message`: een vaste standaard van 120 seconden.
- De standaard van 90 seconden voor dynamische tools.

Deze watchdog vormt het buitenste dynamische budget voor `item/tool/call`.
Providerspecifieke verzoektime-outs worden binnen die aanroep uitgevoerd en
behouden hun eigen time-outsemantiek. Budgetten voor dynamische tools zijn
begrensd op 600000 ms. Bij een time-out breekt OpenClaw het toolsignaal af waar
dit wordt ondersteund en retourneert het een mislukt dynamisch-toolantwoord aan
Codex, zodat de beurt kan doorgaan in plaats van de sessie in
`processing` achter te laten.

Nadat Codex een beurt accepteert en nadat OpenClaw op een beurtgebonden
app-serververzoek reageert, verwacht het harnas dat Codex voortgang maakt in de
huidige beurt en de systeemeigen beurt uiteindelijk afrondt met
`turn/completed`. Als de app-server gedurende `appServer.turnCompletionIdleTimeoutMs` stil blijft,
onderbreekt OpenClaw de Codex-beurt naar beste vermogen, registreert het een
diagnostische time-out en geeft het de OpenClaw-sessiebaan vrij, zodat
vervolgberichten in de chat niet achter een vastgelopen systeemeigen beurt
worden geplaatst.

De meeste niet-afsluitende meldingen voor dezelfde beurt schakelen die korte
watchdog uit, omdat Codex heeft aangetoond dat de beurt nog actief is.
Tooloverdrachten gebruiken een langer inactiviteitsbudget na een tool: nadat
OpenClaw een antwoord `item/tool/call` retourneert, nadat systeemeigen
toolitems zoals `commandExecution` zijn voltooid, na onbewerkte voltooiingen van
`custom_tool_call_output`, en na onbewerkte assistentvoortgang na een tool, onbewerkte
redeneervoltooiingen of redeneervoortgang. De bewaking gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer dit is geconfigureerd en standaard anders vijf
minuten. Datzelfde budget na een tool verlengt ook de voortgangswatchdog voor
het stille synthesevenster voordat Codex de volgende gebeurtenis voor de
huidige beurt uitstuurt. Redeneervoltooiingen, voltooiingen van
`agentMessage` in commentaar en onbewerkte redeneer- of assistentvoortgang
vóór een tool kunnen worden gevolgd door een automatisch definitief antwoord;
daarom gebruiken ze de antwoordbewaking na voortgang in plaats van de
sessiebaan onmiddellijk vrij te geven. Alleen voltooide definitieve items of
items zonder commentaar van `agentMessage` en onbewerkte
assistentvoltooiingen vóór een tool activeren het vrijgeven na
assistentuitvoer: als Codex vervolgens stil blijft zonder `turn/completed`,
onderbreekt OpenClaw de systeemeigen beurt naar beste vermogen en geeft het de
sessiebaan vrij. Opnieuw afspeelbare stdio-app-serverfouten, waaronder
time-outs bij het voltooien van een beurt zonder aanwijzingen voor een
assistent, tool, actief item of neveneffect, worden eenmaal opnieuw geprobeerd
met een nieuwe app-serverpoging. Onveilige time-outs stellen de vastgelopen
app-serverclient alsnog buiten gebruik en geven de OpenClaw-sessiebaan vrij.
Ze wissen ook de verouderde koppeling met de systeemeigen thread in plaats van
de beurt automatisch opnieuw af te spelen. Time-outs van de
voltooiingsbewaking tonen Codex-specifieke time-outtekst: bij opnieuw
afspeelbare gevallen staat dat het antwoord mogelijk onvolledig is, terwijl
onveilige gevallen de gebruiker opdragen de huidige toestand te controleren
voordat die het opnieuw probeert. Openbare time-outdiagnostiek bevat
structurele velden, zoals de methode van de laatste app-servermelding, de
id/het type/de rol van het onbewerkte assistentantwoorditem, aantallen actieve
verzoeken/items en de status van de ingeschakelde bewaking. Wanneer de laatste
melding een onbewerkt assistentantwoorditem is, bevat de diagnostiek ook een
begrensd tekstvoorbeeld van de assistent. Ze bevat geen onbewerkte prompt- of
toolinhoud.

## Modeldetectie

Standaard vraagt de Codex-Plugin de app-server om beschikbare modellen. De
beschikbaarheid van modellen wordt beheerd door de Codex-app-server, waardoor
de lijst kan veranderen wanneer OpenClaw de meegeleverde versie
`@openai/codex` bijwerkt of wanneer een implementatie
`appServer.command` naar een ander Codex-binair bestand verwijst. De
beschikbaarheid kan ook accountspecifiek zijn. Gebruik `/codex models` op
een actieve Gateway om de actuele catalogus voor dat harnas en account te
bekijken.

Als de detectie mislukt of een time-out bereikt, gebruikt OpenClaw een
meegeleverde reservecatalogus:

| Model-id       | Weergavenaam | Redeneerniveaus          |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
Het huidige meegeleverde harnas is `@openai/codex` `0.144.3`. Een
`model/list`-controle op die meegeleverde app-server leverde deze openbare
keuzelijstrijen op:

| Model-id        | Invoermodaliteiten | Redeneerniveaus                      |
| --------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`   | tekst, afbeelding   | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | tekst, afbeelding   | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | tekst, afbeelding   | low, medium, high, xhigh, max        |
| `gpt-5.5`       | tekst, afbeelding   | low, medium, high, xhigh             |
| `gpt-5.4`       | tekst, afbeelding   | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | tekst, afbeelding   | low, medium, high, xhigh             |
| `gpt-5.2`       | tekst, afbeelding   | low, medium, high, xhigh             |

De app-servercatalogus kan `ultra` melden; de redeneerinstellingen
van OpenClaw bieden momenteel niveaus tot en met `max`.

Actuele keuzelijstrijen zijn accountspecifiek en kunnen veranderen door het
account, de Codex-catalogus of de meegeleverde versie; voer
`/codex models` uit voor de huidige lijst in plaats van te vertrouwen op
een tabel van een bepaald moment. Verborgen modellen kunnen ook in de
app-servercatalogus voorkomen voor interne of gespecialiseerde processen
zonder normale keuzes in de modelkiezer te zijn.
</Note>

Stem de detectie af onder `plugins.entries.codex.config.discovery`:

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

Schakel detectie uit wanneer je wilt dat bij het opstarten Codex niet wordt
gecontroleerd en uitsluitend de reservecatalogus wordt gebruikt:

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

## Bootstrapbestanden voor de werkruimte

Codex verwerkt `AGENTS.md` zelf via systeemeigen detectie van
projectdocumentatie. OpenClaw schrijft geen synthetische
Codex-projectdocumentatiebestanden en is voor personabestanden niet afhankelijk
van Codex-reservebestandsnamen, omdat Codex-reserves alleen gelden wanneer
`AGENTS.md` ontbreekt.

Voor gelijkwaardigheid met de OpenClaw-werkruimte stuurt het Codex-harnas de
andere bootstrapbestanden door als ontwikkelaarsinstructies, maar niet op
dezelfde manier:

- `TOOLS.md` wordt doorgestuurd als **overgenomen**
  Codex-ontwikkelaarsinstructies, zodat systeemeigen Codex-subagents die tijdens
  de beurt worden gestart deze ook zien.
- `SOUL.md`, `IDENTITY.md` en `USER.md`
  worden doorgestuurd als **beurtgebonden** samenwerkingsinstructies.
  Systeemeigen Codex-subagents nemen deze niet over, waardoor subagentbeurten
  niet de persona en het gebruikersprofiel van de bovenliggende agent
  overnemen.
- De compacte lijst met geladen OpenClaw-Skills wordt eveneens
  doorgestuurd als beurtgebonden ontwikkelaarsinstructies voor samenwerking,
  zodat systeemeigen Codex-subagents deze ook niet overnemen.
- De inhoud van `HEARTBEAT.md` wordt niet geïnjecteerd;
  Heartbeat-beurten krijgen een verwijzing in samenwerkingsmodus om het bestand
  te lezen wanneer het bestaat en niet leeg is.
- De inhoud van `MEMORY.md` uit de geconfigureerde
  agentwerkruimte wordt niet in de systeemeigen Codex-beurtinvoer geplakt
  wanneer geheugentools beschikbaar zijn voor die werkruimte; wanneer het
  bestand bestaat, voegt het harnas een kleine verwijzing naar het
  werkruimtegeheugen toe aan de beurtgebonden ontwikkelaarsinstructies voor
  samenwerking en moet Codex `memory_search` of `memory_get` gebruiken
  wanneer duurzaam geheugen relevant is. Als tools zijn uitgeschakeld, zoeken
  in het geheugen niet beschikbaar is of de actieve werkruimte verschilt van
  de agentgeheugenwerkruimte, gebruikt `MEMORY.md` in plaats daarvan het
  normale begrensde pad voor beurtcontext.
- `BOOTSTRAP.md` wordt, indien aanwezig, doorgestuurd als
  OpenClaw-referentiecontext voor beurtinvoer.

## Omgevingsoverschrijvingen

Omgevingsoverschrijvingen blijven beschikbaar voor lokale tests:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt het beheerde binaire bestand wanneer
`appServer.command` niet is ingesteld.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalige lokale tests.
Configuratie heeft de voorkeur voor herhaalbare implementaties, omdat het
Plugin-gedrag zo in hetzelfde beoordeelde bestand blijft als de rest van de
Codex-harnasconfiguratie.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [Runtime van het Codex-harnas](/nl/plugins/codex-harness-runtime)
- [Codex-supervisie](/plugins/codex-supervision)
- [Systeemeigen Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex-computergebruik](/nl/plugins/codex-computer-use)
- [OpenAI-provider](/nl/providers/openai)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
