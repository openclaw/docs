---
read_when:
    - Je hebt elk configuratieveld van de Codex-harnas nodig
    - U wijzigt het transport-, authenticatie-, detectie- of time-outgedrag van de app-server
    - Je debugt het opstarten van de Codex-harnasomgeving, modeldetectie of omgevingsisolatie
summary: Naslaginformatie over configuratie, authenticatie, detectie en de appserver voor de Codex-harnasomgeving
title: Naslagwerk voor de Codex-harnasomgeving
x-i18n:
    generated_at: "2026-07-12T09:07:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Deze referentie behandelt de gedetailleerde configuratie voor de officiële `codex`-Plugin.
Voor beslissingen over installatie en routering begint u met
[Codex-harnas](/nl/plugins/codex-harness).

## Configuratieoppervlak van de Plugin

Alle instellingen van het Codex-harnas bevinden zich onder `plugins.entries.codex.config`.

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

| Veld                       | Standaardwaarde            | Betekenis                                                                                                                                             |
| -------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | ingeschakeld               | Instellingen voor modeldetectie via `model/list` van de Codex-appserver.                                                                               |
| `appServer`                | beheerde stdio-appserver   | Instellingen voor transport, opdrachten, authenticatie, goedkeuring, sandbox en time-outs. Het gewone harnas gebruikt standaard agentspecifieke status. |
| `codexDynamicToolsLoading` | `"searchable"`             | Gebruik `"direct"` om dynamische OpenClaw-tools rechtstreeks in de initiële Codex-toolcontext te plaatsen.                                             |
| `codexDynamicToolsExclude` | `[]`                       | Aanvullende namen van dynamische OpenClaw-tools die uit Codex-appserverbeurten moeten worden weggelaten.                                                |
| `codexPlugins`             | uitgeschakeld              | Ondersteuning voor systeemeigen Codex-plugins/apps, inclusief optionele toegang tot apps van verbonden accounts. Zie [Systeemeigen Codex-plugins](/nl/plugins/codex-native-plugins). |
| `computerUse`              | uitgeschakeld              | Configuratie van Codex Computer Use. Zie [Codex Computer Use](/nl/plugins/codex-computer-use).                                                            |
| `supervision`              | uitgeschakeld              | Catalogus van niet-gearchiveerde systeemeigen sessies, voortzetting van lokale branches en beleid voor agenttools. Zie [Codex-toezicht](/plugins/codex-supervision). |

## Toezicht

Toezicht vermeldt niet-gearchiveerde Codex-sessies van de Gateway-computer en
aangemelde gekoppelde Nodes. Schakel dit onafhankelijk van het agentharnas in:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Velden van `supervision`:

| Veld                  | Standaardwaarde          | Betekenis                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                  | Publiceer de lokale sessiecatalogus en voeg op de Gateway catalogi van aangemelde gekoppelde Nodes samen voor de pagina Codex-sessies.                                                                                                                            |
| `endpoints`           | ingebouwd lokaal eindpunt | Doelen voor compatibiliteit en geavanceerde eindpunten voor de behouden Codex-toezichtagent en zelfstandige MCP-tools. De menselijke catalogus en branchestroom negeren deze doelen en gebruiken de toezicht-App Server die via `appServer` wordt bepaald.             |
| `allowRawTranscripts` | `false`                  | Sta met ingeschakeld toezicht autonome agents of zelfstandige MCP-tools toe transcripties te lezen en daarvan afgeleide lijstvelden op te vragen. Alleen-metagegevenslezingen via `codex_threads` blijven beschikbaar. Dit beheert niet de voortzetting via de geauthenticeerde Control UI. |
| `allowWriteControls`  | `false`                  | Sta met ingeschakeld toezicht autonome `codex_threads`-bewerkingen toe voor splitsen, hernoemen, archiveren en dearchiveren, plus zelfstandige MCP-bewerkingen voor verzenden, bijsturen en onderbreken. Dit omzeilt geen andere controles voor binding, host, status of bevestiging. |

Eindpuntvermeldingen accepteren deze velden:

| Veld           | Van toepassing op | Betekenis                                                                       |
| -------------- | ------------------ | ------------------------------------------------------------------------------- |
| `id`           | alle               | Stabiele eindpunt-id.                                                           |
| `label`        | alle               | Optioneel weergavelabel.                                                        |
| `transport`    | alle               | `"stdio-proxy"` of `"websocket"`.                                               |
| `command`      | `stdio-proxy`      | Optionele App Server-opdracht.                                                  |
| `args`         | `stdio-proxy`      | Optionele opdrachtargumenten.                                                   |
| `cwd`          | `stdio-proxy`      | Optionele werkmap van het onderliggende proces.                                 |
| `url`          | `websocket`        | Vereiste WebSocket-URL of ondersteunde URL van een lokale socket.               |
| `authTokenEnv` | `websocket`        | Optionele omgevingsvariabele waarvan de waarde het eindpunt authenticeert.      |

De pagina **Codex-sessies** gebruikt de toezicht-App Server van de Plugin en toont
alleen niet-gearchiveerde sessies. Zonder expliciete verbindingsinstellingen voor
`appServer` is die verbinding beheerde stdio in de thuismap van de gebruiker.
Opgeslagen of inactieve lokale rijen kunnen een modelvergrendelde Chat maken met
een begrensde geschiedenis van gebruiker en assistent tot en met de laatste
blijvend opgeslagen bronbeurt met eindstatus. De privébinding houdt de
momentopnamesplitsing, de canonieke branch uit de `appServer`-bron, de
geschiedenisinjectie en latere beurten op die verbinding. De eerste canonieke
start gebruikt het paar dat door de splitsing wordt geretourneerd. Bij latere
hervattingen worden OpenClaw-overschrijvingen voor model en provider weggelaten,
zodat Codex het opgeslagen paar van de canonieke thread herstelt; een afzonderlijke
systeemeigen wijziging kan dat paar bijwerken, maar het buitenste model en de
fallbackketen vervangen het nooit. Opgeslagen en inactieve rijen kunnen worden
gearchiveerd na bevestiging dat er geen andere uitvoerder is, tenzij een andere
actieve OpenClaw-binding eigenaar is van exact het doel of van een van de
niet-gearchiveerde voortgebrachte afstammelingen. OpenClaw volgt de paginering
van Codex voor afstammelingen en weigert bij opsommingsfouten, cycli of het
bereiken van de veiligheidslimiet. Bevestiging blijft vereist voor onbekende
systeemeigen clients en de race tussen statuscontrole en archivering. Een
modelvergrendelde Chat onder toezicht kan niet worden verwijderd zolang deze de
systeemeigen binding beschermt. Actieve bronnen kunnen geen branch maken of
worden gearchiveerd, maar een bestaande Chat onder toezicht kan nog steeds worden
geopend. Elke rij van een gekoppelde Node blijft alleen-lezen; het Nodetransport
biedt nog niet de streaminglevenscyclus die het harnas vereist.

Alleen `appServer.homeScope: "user"` wijzigt welke Codex-thuismap een beheerd
harnasproces gebruikt; hiermee wordt de vlootcatalogus niet gepubliceerd. Het
inschakelen van toezicht wijzigt de standaardinstelling van het harnas niet.
In plaats daarvan gebruikt de afzonderlijke toezichtverbinding standaard
beheerde stdio in de thuismap van de gebruiker wanneer er geen expliciete
verbindingsinstellingen voor `appServer` bestaan. Expliciete instellingen worden
voor die verbinding gerespecteerd. Voorlopige en vastgelegde bindingen onder
toezicht behouden die verbinding voor elke beurt; uitgeschakeld toezicht of
afwijkingen in verbinding of levenscyclus leiden tot weigering in plaats van een
terugval op het harnas met de agentthuismap. De standaardverbinding deelt
opgeslagen sessies met systeemeigen Codex-clients, niet hun proceslokale
activiteitsstatus.

Verouderde instellingen voor `plugins.entries.codex-supervisor` zijn buiten
gebruik gesteld. Voer `openclaw doctor --fix` uit om de oude vermelding,
eindpuntdefinities, beleidsvlaggen en verwijzingen voor toestaan/weigeren van
Plugins naar dit blok te migreren. Expliciete canonieke waarden in
`codex.config.supervision` hebben voorrang bij conflicten.

## Appservertransport

Voor gewone harnasbeurten start OpenClaw het beheerde Codex-binaire bestand dat
met de officiële Plugin wordt meegeleverd (momenteel `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Hierdoor blijft de appserverversie gekoppeld aan de officiële `codex`-Plugin in
plaats van aan een afzonderlijke Codex-CLI die toevallig lokaal is geïnstalleerd.
Stel `appServer.command` alleen in wanneer u bewust een ander uitvoerbaar bestand
wilt gebruiken. Gewone beheerde beurten met de standaard geïsoleerde
agentthuismap geven de voorkeur aan dit vastgezette pakket, zelfs wanneer een
macOS-desktopbundel is geïnstalleerd. Wanneer
[Computer Use](/nl/plugins/codex-computer-use) is ingeschakeld, of wanneer
`homeScope` is ingesteld op `"user"` en systeemeigen Computer Use-status kan
laden, geeft beheerd opstarten in plaats daarvan de voorkeur aan het binaire
bestand van de desktopapp dat de vereiste macOS-machtigingen bezit. Dezelfde
regel om eerst de desktopapp te gebruiken, geldt wanneer de effectieve
Codex-configuratie van een geïsoleerde agentthuismap systeemeigen Computer Use
inschakelt. Als er geen desktopappbundel is geïnstalleerd, valt OpenClaw terug op
het binaire bestand van het vastgezette pakket.

De overdracht van uitvoerbare bestanden en de afscherming van systeemeigen
configuratie coördineren clients binnen één actief Gateway-proces. Start de
Gateway opnieuw nadat een ander proces de configuratie van de systeemeigen
Codex-Plugin heeft gewijzigd.

Toezicht bepaalt een afzonderlijke verbinding. Zonder expliciete
verbindingsinstellingen voor `appServer` gebruikt deze beheerde stdio met
`homeScope: "user"`; het gewone harnas blijft beheerde stdio gebruiken met
`homeScope: "agent"`. Expliciete verbindingsinstellingen worden door beide paden
gerespecteerd. Stel `homeScope: "user"` expliciet in wanneer het gewone harnas
`$CODEX_HOME` (of `~/.codex`) met systeemeigen clients moet delen. Een
privébinding onder toezicht gebruikt de toezichtverbinding, ongeacht de
standaardinstelling van het gewone harnas. Onafhankelijke App Server-processen
behouden een afzonderlijke actuele status en goedkeuringsstatus.

Gebruik WebSocket-transport voor een reeds actieve appserver:

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
| `transport`                                   | `"stdio"`                                              | `"stdio"` start Codex; expliciet `"unix"` maakt verbinding met de lokale besturingssocket; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                                            |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoleert de normale harnasstatus per OpenClaw-agent. `"user"` is een expliciete opt-in die de systeemeigen `$CODEX_HOME` of `~/.codex` deelt, systeemeigen authenticatie gebruikt en threadbeheer uitsluitend door de eigenaar inschakelt. Gebruikersbereik ondersteunt lokaal stdio- of Unix-transport. Voor de afzonderlijke supervisieverbinding wordt een niet-ingestelde waarde omgezet naar `"user"` voor stdio of Unix en naar `"agent"` voor WebSocket. |
| `command`                                     | beheerd Codex-binair bestand                           | Uitvoerbaar bestand voor stdio-transport. Laat dit niet ingesteld om het beheerde binaire bestand te gebruiken.                                                                                                                                                                                                                                                                                 |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | niet ingesteld                                         | URL van de WebSocket-app-server of `unix://`-URL. Een expliciet leeg Unix-pad selecteert de canonieke besturingssocket in de thuismap van de gebruiker.                                                                                                                                                                                                                                          |
| `authToken`                                   | niet ingesteld                                         | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput, zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                   | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                |
| `clearEnv`                                    | `[]`                                                   | Namen van extra omgevingsvariabelen die uit het gestarte stdio-app-serverproces worden verwijderd nadat OpenClaw de overgenomen omgeving heeft samengesteld.                                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | niet ingesteld                                         | Hoofdmap van de externe Codex-app-serverwerkruimte. Wanneer deze is ingesteld, leidt OpenClaw de lokale hoofdmap van de werkruimte af uit de opgeloste OpenClaw-werkruimte, behoudt het huidige cwd-achtervoegsel onder deze externe hoofdmap en verzendt alleen de uiteindelijke app-server-cwd naar Codex. Als de cwd buiten de opgeloste hoofdmap van de OpenClaw-werkruimte valt, weigert OpenClaw de bewerking in plaats van een Gateway-lokaal pad naar de externe app-server te verzenden. |
| `requestTimeoutMs`                            | `60000`                                                | Time-out voor besturingsaanroepen naar de app-server.                                                                                                                                                                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Stille periode nadat Codex een beurt accepteert of na een app-serververzoek binnen een beurt, terwijl OpenClaw op `turn/completed` wacht.                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Bewaking van inactiviteit bij voltooiing en voortgang die wordt gebruikt na overdracht aan een tool, voltooiing van een systeemeigen tool, onbewerkte assistentvoortgang na een tool, voltooiing van onbewerkte redenering of voortgang van redenering, terwijl OpenClaw op `turn/completed` wacht. Gebruik dit voor vertrouwde of zware werklasten waarbij de synthese na een tool terecht langer stil kan blijven dan het budget voor de uiteindelijke assistentuitvoer. |
| `mode`                                        | `"yolo"`, tenzij lokale Codex-vereisten YOLO verbieden | Voorinstelling voor YOLO-uitvoering of door een bewaker beoordeelde uitvoering.                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` of een toegestaan goedkeuringsbeleid van de bewaker | Systeemeigen Codex-goedkeuringsbeleid dat naar het starten en hervatten van een thread en naar een beurt wordt verzonden.                                                                                                                                                                                                                                                                        |
| `sandbox`                                     | `"danger-full-access"` of een toegestane sandbox van de bewaker | Systeemeigen Codex-sandboxmodus die naar het starten en hervatten van een thread wordt verzonden. Actieve OpenClaw-sandboxes beperken beurten met `danger-full-access` tot Codex `workspace-write`; de netwerkvlag van de beurt volgt de uitgaande netwerktoegang van de OpenClaw-sandbox.                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` of een toegestane beoordelaar van de bewaker  | Gebruik `"auto_review"` om Codex systeemeigen goedkeuringsverzoeken te laten beoordelen wanneer dit is toegestaan.                                                                                                                                                                                                                                                                              |
| `defaultWorkspaceDir`                         | huidige procesmap                                      | Werkruimte die door `/codex bind` wordt gebruikt wanneer `--cwd` is weggelaten.                                                                                                                                                                                                                                                                                                                 |
| `serviceTier`                                 | niet ingesteld                                         | Optionele servicelaag van de Codex-app-server. `"priority"` schakelt routering in snelle modus in, `"flex"` vraagt flexibele verwerking aan en `null` wist de overschrijving. Verouderd `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                              |
| `networkProxy`                                | uitgeschakeld                                          | Schakel netwerktoegang via het Codex-machtigingsprofiel in voor app-serveropdrachten. OpenClaw definieert de geselecteerde configuratie `permissions.<profile>.network` en selecteert deze met `default_permissions` in plaats van `sandbox` te verzenden.                                                                                                                                          |
| `experimental.sandboxExecServer`              | `false`                                                | Experimentele opt-in die een door een OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij de ondersteunde Codex-app-server, zodat systeemeigen Codex-uitvoering binnen de actieve OpenClaw-sandbox kan plaatsvinden.                                                                                                                                                                       |

`appServer.networkProxy` is expliciet omdat dit het sandboxcontract van Codex
wijzigt. Wanneer dit is ingeschakeld, stelt OpenClaw ook
`features.network_proxy.enabled` en `default_permissions` in de
Codex-threadconfiguratie in, zodat het gegenereerde machtigingsprofiel door
Codex beheerde netwerktoegang kan starten. OpenClaw genereert standaard een
botsingsbestendige profielnaam `openclaw-network-<fingerprint>` op basis van de
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

Als de normale app-serverruntime `danger-full-access` zou zijn, zorgt het inschakelen van
`networkProxy` ervoor dat in plaats daarvan bestandssysteemtoegang in werkruimtestijl wordt gebruikt voor het gegenereerde
machtigingsprofiel. Door Codex beheerde netwerkhandhaving maakt gebruik van gesandboxte
netwerktoegang, dus een profiel met volledige toegang zou uitgaand verkeer niet beschermen.

De plugin blokkeert oudere app-serverhandshakes en handshakes zonder versie: de Codex-app-server
moet stabiele versie `0.143.0` of nieuwer rapporteren.

OpenClaw behandelt WebSocket-URL's van app-servers die niet naar local loopback verwijzen als extern en vereist
WebSocket-authenticatie met identiteitsgegevens via `appServer.authToken` of een
`Authorization`-header. `appServer.authToken` en elke waarde van `appServer.headers.*`
kunnen een SecretInput zijn; de geheimenruntime zet SecretRefs en env-
verkorte notaties om voordat OpenClaw de opstartopties voor de app-server samenstelt, en niet-opgeloste
gestructureerde SecretRefs leiden tot een fout voordat een token of header wordt verzonden. Wanneer systeemeigen
Codex-plugins zijn geconfigureerd, gebruikt OpenClaw het plugin-
besturingsvlak van de verbonden app-server om die plugins te installeren of te vernieuwen en vernieuwt het vervolgens de app-
inventaris, zodat apps die eigendom zijn van plugins zichtbaar zijn voor de Codex-thread. `app/list` blijft
de gezaghebbende bron voor inventaris en metadata, maar het OpenClaw-beleid
bepaalt of `thread/start` `config.apps[appId].enabled = true` verzendt voor een
vermelde toegankelijke app, zelfs als Codex deze momenteel als uitgeschakeld markeert. Onbekende of
ontbrekende app-id's blijven standaard geblokkeerd; dit pad activeert alleen marketplace-
plugins via `plugin/install` en vernieuwt de inventaris. Verbind OpenClaw alleen met
externe app-servers die u vertrouwt om door OpenClaw beheerde plugininstallaties
en vernieuwingen van de app-inventaris te accepteren.

## Goedkeurings- en sandboxmodi

Lokale app-serversessies via stdio gebruiken standaard de YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Dankzij deze houding voor een vertrouwde lokale operator kunnen
onbeheerde OpenClaw-beurten en Heartbeats voortgang boeken zonder systeemeigen goedkeurings-
prompts die niemand kan beantwoorden.

Als het lokale bestand met systeemvereisten van Codex impliciete YOLO-waarden voor goedkeuring,
beoordelaar of sandbox niet toestaat, behandelt OpenClaw de impliciete standaardinstelling als guardian
en selecteert het toegestane guardian-machtigingen. `tools.exec.mode: "auto"`
dwingt ook door guardian beoordeelde Codex-goedkeuringen af en behoudt geen onveilige
verouderde overschrijvingen van `approvalPolicy: "never"` of `sandbox: "danger-full-access"`;
stel `tools.exec.mode: "full"` in voor een bewust gekozen houding zonder goedkeuring.
Vermeldingen in `[[remote_sandbox_config]]` in hetzelfde vereistenbestand waarvan de hostnaam overeenkomt,
worden gerespecteerd bij het bepalen van de standaardinstelling voor de sandbox.

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

De voorinstelling `guardian` wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"` wanneer die
waarden zijn toegestaan. Afzonderlijke beleidsvelden overschrijven `mode`. De oudere
beoordelaarswaarde `guardian_subagent` wordt nog steeds geaccepteerd als compatibiliteitsalias,
maar nieuwe configuraties moeten `auto_review` gebruiken.

Wanneer een OpenClaw-sandbox actief is, draait het lokale Codex-app-serverproces nog steeds
op de Gateway-host. OpenClaw schakelt daarom de systeemeigen Code Mode van Codex,
MCP-servers van gebruikers en app-ondersteunde pluginuitvoering voor die beurt uit, in plaats van
sandboxing aan de Codex-hostzijde als gelijkwaardig aan de OpenClaw-sandbox-
backend te behandelen. Shelltoegang wordt beschikbaar gesteld via dynamische tools die door de OpenClaw-sandbox worden ondersteund,
zoals `sandbox_exec` en `sandbox_process`, wanneer de normale exec-/procestools
beschikbaar zijn.

<Note>
Op door Docker ondersteunde OpenClaw-sandboxhosts (`agents.defaults.sandbox.mode` ingesteld op
een Docker-backend) controleert `openclaw doctor` of de host de
naamruimten voor gebruikers zonder bevoegdheden toestaat (en, wanneer uitgaand netwerkverkeer van de Docker-sandbox is uitgeschakeld,
ook netwerknaamruimten) die geneste Codex-`bwrap` nodig heeft voor
`workspace-write`-shelluitvoering in de sandboxcontainer. Een mislukte controle wordt doorgaans
weergegeven als `bwrap: setting up uid map: Permission denied` of
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` op
Ubuntu-/AppArmor-hosts. Herstel het gerapporteerde hostbeleid voor naamruimten voor de OpenClaw-
servicegebruiker en start de Gateway opnieuw; geef de voorkeur aan een afgebakend AppArmor-profiel voor het
serviceproces boven de hostbrede uitwijkoptie
`kernel.apparmor_restrict_unprivileged_userns=0` en verleen geen
ruimere bevoegdheden aan Docker-containers uitsluitend om te voldoen aan geneste `bwrap`.
</Note>

## Systeemeigen uitvoering in een sandbox

De stabiele standaardinstelling is standaard blokkeren: actieve OpenClaw-sandboxing schakelt systeemeigen
Codex-uitvoeringsoppervlakken uit die anders vanaf de host van de Codex-app-server
zouden worden uitgevoerd. Gebruik `appServer.experimental.sandboxExecServer: true` alleen wanneer u
de ondersteuning voor externe omgevingen van Codex met de sandboxbackend van OpenClaw wilt uitproberen.
Dit voorbeeldpad werkt met elke ondersteunde versie van de Codex-app-server.

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

Wanneer de vlag is ingeschakeld en de huidige OpenClaw-sessie in een sandbox draait, start OpenClaw
een lokale exec-server via local loopback die door de actieve sandbox wordt ondersteund, registreert deze
bij de Codex-app-server en start de Codex-thread en -beurt met die
omgeving die eigendom is van OpenClaw. Als de app-server de omgeving niet kan registreren,
wordt de uitvoering standaard afgebroken in plaats van stilzwijgend terug te vallen op uitvoering op de host.

Dit voorbeeldpad is uitsluitend lokaal. Een externe WebSocket-app-server kan de
exec-server via local loopback niet bereiken, tenzij deze op dezelfde host draait, dus OpenClaw
weigert die combinatie.

## Authenticatie en omgevingsisolatie

In de standaardhome per agent wordt authenticatie in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor het lokaal starten van een app-server via stdio: `CODEX_API_KEY`, gevolgd door
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-authenticatie
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authenticatieprofiel in de stijl van een ChatGPT-abonnement ziet (OAuth of
referentietype token), verwijdert het `CODEX_API_KEY` en `OPENAI_API_KEY` uit
het gestarte Codex-subproces. Zo blijven API-sleutels op Gateway-niveau beschikbaar
voor embeddings of rechtstreekse OpenAI-modellen, zonder dat systeemeigen beurten van de Codex-app-server
per ongeluk via de API worden gefactureerd.

Expliciete Codex-profielen met API-sleutels en de terugval naar env-sleutels voor lokale stdio gebruiken
aanmelding bij de app-server in plaats van een overgenomen subprocesomgeving. WebSocket-verbindingen met app-servers
ontvangen geen terugval naar API-sleutels uit de Gateway-omgeving; gebruik een expliciet authenticatie-
profiel of het eigen account van de externe app-server.

Via stdio gestarte app-servers nemen standaard de procesomgeving van OpenClaw over.
OpenClaw beheert de accountbrug van de Codex-app-server en stelt `CODEX_HOME` in op een
map per agent onder de OpenClaw-status van die agent. Daardoor blijven de Codex-
configuratie, accounts, plugincache/-gegevens en threadstatus beperkt tot de OpenClaw-
agent, in plaats van binnen te lekken vanuit de persoonlijke `~/.codex`-home van de operator.

Stel `appServer.homeScope: "user"` in om de systeemeigen Codex-status te delen met Codex
Desktop en de CLI. Deze lokale gebruikershomemodus ondersteunt beheerde stdio en
expliciet Unix-transport. Hierbij wordt `$CODEX_HOME` gebruikt wanneer dit is ingesteld en anders `~/.codex`,
inclusief systeemeigen authenticatie, configuratie, plugins en threads.
OpenClaw slaat zijn authenticatieprofielbrug voor de app-server over. Geverifieerde beurten van de eigenaar
kunnen `codex_threads` gebruiken om die threads weer te geven (met een optioneel `search`-filter),
te lezen, af te splitsen, te hernoemen, te archiveren en uit het archief te halen. Splits een thread af voordat
u deze in OpenClaw voortzet; onafhankelijke Codex-processen coördineren geen
gelijktijdige schrijvers voor dezelfde thread.

Die opt-in voor `homeScope` is van toepassing op gewone harness-sessies. Een Chat die via
Codex Sessions is aangemaakt, gebruikt in plaats daarvan zijn privéverbinding voor supervisie, waardoor
de authenticatie- en providerconfiguratie van de systeemeigen verbinding behouden blijft voor de
canonieke branch en toekomstige hervattingen.

In een modelvergrendelde Chat onder supervisie kan `codex_threads` geen andere
fork koppelen of de gekoppelde systeemeigen thread van de Chat archiveren. Weergeven en alleen-metadata lezen
blijven beschikbaar. Voor het lezen van onbewerkte transcripties is `allowRawTranscripts` vereist; wanneer dit
is uitgeschakeld, wordt zoeken in de lijst ook geweigerd omdat systeemeigen zoeken overeenkomsten kan vinden in
transcriptievoorbeelden. Hernoemen, uit het archief halen, een losstaande fork maken en een
niet-gerelateerde thread archiveren die niet aan een andere OpenClaw Chat toebehoort, vereisen
`allowWriteControls`. Geen van beide opties omzeilt een vergrendelde koppeling.

OpenClaw herschrijft `HOME` niet bij normale lokale starts van de app-server.
Door Codex uitgevoerde subprocessen zoals `openclaw`, `gh`, `git`, cloud-CLI's en shell-
opdrachten zien de normale proceshome en kunnen configuratie en
tokens in de gebruikershome vinden. Codex kan ook `$HOME/.agents/skills` en
`$HOME/.agents/plugins/marketplace.json` ontdekken; die `.agents`-detectie wordt
bewust gedeeld met de home van de operator en staat los van de geïsoleerde
`~/.codex`-status.

Binnen het standaardagentbereik blijven OpenClaw-plugins en momentopnamen van OpenClaw-Skills
via OpenClaws eigen pluginregister en Skills-lader lopen; persoonlijke
Codex-assets in `~/.codex` doen dat niet. Als u nuttige Codex CLI-Skills of
plugins uit een Codex-home hebt die onderdeel moeten worden van een geïsoleerde OpenClaw-
agent, inventariseer deze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Als een implementatie aanvullende omgevingsisolatie nodig heeft, voegt u die variabelen
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

`appServer.clearEnv` is alleen van invloed op het gestarte subproces van de Codex-app-server.
OpenClaw verwijdert `CODEX_HOME` en `HOME` uit deze lijst tijdens de normalisatie voor lokaal starten:
`CODEX_HOME` blijft verwijzen naar het geselecteerde agent- of gebruikersbereik
en `HOME` blijft overgenomen, zodat subprocessen normale status uit de gebruikershome kunnen gebruiken.

## Dynamische tools

Dynamische Codex-tools gebruiken standaard `searchable` laden en worden beschikbaar gesteld onder de
naamruimte `openclaw` met `deferLoading: true`. OpenClaw stelt geen
dynamische tools beschikbaar die systeemeigen Codex-werkruimtebewerkingen of het eigen
toolzoekoppervlak van Codex dupliceren:

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

De meeste overige OpenClaw-integratietools, zoals berichten, media, Cron,
browser, Nodes, Gateway, `heartbeat_respond` en `web_search`, zijn beschikbaar
via de Codex-toolzoekfunctie onder die naamruimte. Hierdoor blijft de initiële modelcontext
kleiner. Een kleine set tools blijft rechtstreeks aanroepbaar, ongeacht
`codexDynamicToolsLoading`, omdat de Codex-toolzoekfunctie niet beschikbaar kan zijn of
een universum met uitsluitend connectors kan opleveren: `agents_list`, `sessions_spawn` en
`sessions_yield`. Ontwikkelaarsinstructies sturen normale Codex-subagents nog steeds
naar systeemeigen `spawn_agent` voor systeemeigen Codex-subagentwerk, terwijl
`sessions_spawn` beschikbaar blijft voor expliciete OpenClaw- of ACP-delegatie.
Bronantwoorden die uitsluitend de berichtentool gebruiken, blijven ook rechtstreeks beschikbaar, omdat dit een
contract voor beurtbesturing is.

Tools die zijn gemarkeerd met `catalogMode: "direct-only"`, waaronder de OpenClaw-tool `computer`,
worden gegroepeerd onder `openclaw_direct`. OpenClaw voegt die naamruimte toe aan
de lijst `code_mode.direct_only_tool_namespaces` van Codex zonder door de
operator opgegeven vermeldingen te vervangen. Codex stelt die tools daarom beschikbaar als
`DirectModelOnly` in normale threads en threads die uitsluitend de codemodus gebruiken, in plaats van ze
via geneste Code Mode-aanroepen van `tools.*` te routeren. Deze grens is vereist voor
resultaten met afbeeldingen: geneste Code Mode-serialisatie maakt afbeeldingsuitvoer vlak tot
tekst, waardoor de schermafbeelding die nodig is voor de volgende computeractie verloren zou gaan.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer u verbinding maakt met een aangepaste
Codex-app-server die uitgestelde dynamische tools niet kan doorzoeken of wanneer u fouten opspoort
in de volledige toolpayload.

## Time-outs

Dynamische toolaanroepen die eigendom zijn van OpenClaw, worden onafhankelijk van
`appServer.requestTimeoutMs` begrensd. Elk Codex-verzoek `item/tool/call` gebruikt de
eerste beschikbare time-out in deze volgorde:

- Een positief argument `timeoutMs` per aanroep.
- Voor `image_generate`: `agents.defaults.imageGenerationModel.timeoutMs`.
- Voor `image_generate` zonder geconfigureerde time-out: de standaardwaarde van 120 seconden
  voor het genereren van afbeeldingen.
- Voor de media-analysetool `image`: `tools.media.image.timeoutSeconds`
  omgerekend naar milliseconden, of de standaardwaarde van 60 seconden voor media. Voor
  afbeeldingsanalyse geldt dit voor het verzoek zelf en wordt het niet verminderd door
  eerder voorbereidingswerk.
- Voor de tool `message`: een vaste standaardwaarde van 120 seconden.
- De standaardwaarde van 90 seconden voor dynamische tools.

Deze bewaking is het buitenste dynamische budget voor `item/tool/call`. Providerspecifieke
time-outs voor verzoeken worden binnen die aanroep uitgevoerd en behouden hun eigen
time-outsemantiek. Budgetten voor dynamische tools zijn begrensd op 600000 ms. Bij een time-out
breekt OpenClaw het toolsignaal af waar dit wordt ondersteund en retourneert het een mislukt
antwoord van de dynamische tool aan Codex, zodat de beurt kan doorgaan in plaats van de sessie
in `processing` achter te laten.

Nadat Codex een beurt heeft geaccepteerd en nadat OpenClaw heeft gereageerd op een
app-serververzoek dat aan een beurt is gekoppeld, verwacht het harnas dat Codex voortgang
boekt in de huidige beurt en de systeemeigen beurt uiteindelijk afrondt met `turn/completed`.
Als de app-server gedurende `appServer.turnCompletionIdleTimeoutMs` stilvalt, probeert OpenClaw
de Codex-beurt te onderbreken, registreert het een diagnostische time-out en geeft het de
OpenClaw-sessiebaan vrij, zodat vervolgberichten in de chat niet achter een vastgelopen
systeemeigen beurt in de wachtrij komen te staan.

De meeste niet-afsluitende meldingen voor dezelfde beurt schakelen die korte bewaking uit,
omdat Codex heeft aangetoond dat de beurt nog actief is. Tooloverdrachten gebruiken een langer
inactiviteitsbudget na een tool: nadat OpenClaw een antwoord op `item/tool/call` retourneert,
nadat systeemeigen toolitems zoals `commandExecution` zijn voltooid, na voltooiingen van
onbewerkte `custom_tool_call_output` en na onbewerkte assistentvoortgang na een tool,
voltooiingen van onbewerkte redeneringen of redeneringsvoortgang. De bewaking gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer dit is geconfigureerd en
standaard anders vijf minuten. Datzelfde budget na een tool verlengt ook de voortgangsbewaking
voor het stille synthesevenster voordat Codex de volgende gebeurtenis voor de huidige beurt
uitstuurt. Voltooiingen van redeneringen, voltooiingen van `agentMessage` in commentaarmodus
en onbewerkte redenerings- of assistentvoortgang vóór een tool kunnen worden gevolgd door een
automatisch definitief antwoord. Daarom gebruiken ze de antwoordbewaking na voortgang in
plaats van de sessiebaan onmiddellijk vrij te geven. Alleen voltooide definitieve
`agentMessage`-items die geen commentaar zijn en voltooiingen van onbewerkte assistentuitvoer
vóór een tool activeren het vrijgeven na assistentuitvoer: als Codex vervolgens stilvalt
zonder `turn/completed`, probeert OpenClaw de systeemeigen beurt te onderbreken en geeft het de
sessiebaan vrij. Opnieuw afspeelbare stdio-app-serverfouten, waaronder time-outs voor de
voltooiing van een beurt zonder bewijs van assistentuitvoer, tools, actieve items of
neveneffecten, worden eenmaal opnieuw geprobeerd met een nieuwe app-serverpoging. Bij onveilige
time-outs wordt de vastgelopen app-serverclient alsnog buiten gebruik gesteld en wordt de
OpenClaw-sessiebaan vrijgegeven. Ze wissen ook de verouderde koppeling met de systeemeigen
thread in plaats van deze automatisch opnieuw af te spelen. Time-outs van de
voltooiingsbewaking tonen Codex-specifieke time-outtekst: in opnieuw afspeelbare gevallen staat
dat het antwoord mogelijk onvolledig is, terwijl onveilige gevallen de gebruiker instrueren
de huidige status te controleren voordat deze het opnieuw probeert. Openbare
time-outdiagnostiek bevat structurele velden, zoals de methode van de laatste
app-servermelding, de id/het type/de rol van het onbewerkte assistentantwoorditem, aantallen
actieve verzoeken/items en de status van de geactiveerde bewaking. Wanneer de laatste melding
een onbewerkt assistentantwoorditem is, bevat de diagnostiek ook een begrensd tekstvoorbeeld
van de assistent. Ze bevat geen onbewerkte prompt- of toolinhoud.

## Modeldetectie

Standaard vraagt de Codex-plugin de app-server om beschikbare modellen. De beschikbaarheid van
modellen wordt beheerd door de Codex-app-server. De lijst kan daarom veranderen wanneer
OpenClaw de gebundelde versie van `@openai/codex` bijwerkt of wanneer een implementatie
`appServer.command` naar een ander Codex-binair bestand laat verwijzen. De beschikbaarheid kan
ook accountspecifiek zijn. Gebruik `/codex models` op een actieve Gateway om de actuele
catalogus voor dat harnas en account te bekijken.

Als de detectie mislukt of een time-out bereikt, gebruikt OpenClaw een gebundelde
reservecatalogus:

| Model-id       | Weergavenaam | Redeneerniveaus           |
| -------------- | ------------ | ------------------------- |
| `gpt-5.5`      | gpt-5.5      | laag, gemiddeld, hoog, xhoog |
| `gpt-5.4-mini` | GPT-5.4-Mini | laag, gemiddeld, hoog, xhoog |

<Note>
Het huidige gebundelde harnas is `@openai/codex` `0.144.1`. Een `model/list`-controle
op die gebundelde app-server retourneerde deze openbare rijen in de modelkiezer:

| Model-id        | Invoermodaliteiten | Redeneerniveaus                         |
| --------------- | ------------------- | --------------------------------------- |
| `gpt-5.6-sol`   | tekst, afbeelding   | laag, gemiddeld, hoog, xhoog, max, ultra |
| `gpt-5.6-terra` | tekst, afbeelding   | laag, gemiddeld, hoog, xhoog, max, ultra |
| `gpt-5.6-luna`  | tekst, afbeelding   | laag, gemiddeld, hoog, xhoog, max       |
| `gpt-5.5`       | tekst, afbeelding   | laag, gemiddeld, hoog, xhoog            |
| `gpt-5.4`       | tekst, afbeelding   | laag, gemiddeld, hoog, xhoog            |
| `gpt-5.4-mini`  | tekst, afbeelding   | laag, gemiddeld, hoog, xhoog            |
| `gpt-5.2`       | tekst, afbeelding   | laag, gemiddeld, hoog, xhoog            |

De app-servercatalogus kan `ultra` rapporteren; de redeneerbediening van OpenClaw biedt
momenteel niveaus tot en met `max`.

Actuele rijen in de modelkiezer zijn accountspecifiek en kunnen veranderen met het account,
de Codex-catalogus of de gebundelde versie. Voer `/codex models` uit voor de huidige lijst in
plaats van te vertrouwen op een momentopname in een tabel. Verborgen modellen kunnen ook in de
app-servercatalogus voorkomen voor interne of gespecialiseerde processen zonder normale
keuzes in de modelkiezer te zijn.
</Note>

Pas de detectie aan onder `plugins.entries.codex.config.discovery`:

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

Schakel detectie uit wanneer u wilt voorkomen dat Codex bij het opstarten wordt gecontroleerd
en alleen de reservecatalogus wilt gebruiken:

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

Codex verwerkt `AGENTS.md` zelf via systeemeigen detectie van projectdocumentatie.
OpenClaw schrijft geen synthetische Codex-bestanden met projectdocumentatie en is voor
personabestanden niet afhankelijk van Codex-reservebestandsnamen, omdat Codex-reserves alleen
van toepassing zijn wanneer `AGENTS.md` ontbreekt.

Voor gelijkwaardigheid met de OpenClaw-werkruimte stuurt het Codex-harnas de andere
bootstrapbestanden door als ontwikkelaarsinstructies, maar niet op identieke wijze:

- `TOOLS.md` wordt doorgestuurd als **overgenomen** Codex-ontwikkelaarsinstructies, zodat
  systeemeigen Codex-subagenten die tijdens de beurt worden gestart deze ook zien.
- `SOUL.md`, `IDENTITY.md` en `USER.md` worden doorgestuurd als **beurtgebonden**
  samenwerkingsinstructies. Systeemeigen Codex-subagenten nemen deze niet over,
  zodat subagentbeurten niet de persona en het gebruikersprofiel van de bovenliggende agent
  overnemen.
- De compacte geladen lijst met OpenClaw-Skills wordt eveneens doorgestuurd als beurtgebonden
  samenwerkingsinstructies voor ontwikkelaars, zodat systeemeigen Codex-subagenten deze ook
  niet overnemen.
- De inhoud van `HEARTBEAT.md` wordt niet ingevoegd; Heartbeat-beurten krijgen in de
  samenwerkingsmodus een verwijzing om het bestand te lezen wanneer het bestaat en niet leeg
  is.
- Inhoud van `MEMORY.md` uit de geconfigureerde agentwerkruimte wordt niet in de invoer van
  systeemeigen Codex-beurten geplakt wanneer geheugentools voor die werkruimte beschikbaar
  zijn. Wanneer het bestand bestaat, voegt het harnas een kleine verwijzing naar het
  werkruimtegeheugen toe aan de beurtgebonden samenwerkingsinstructies voor ontwikkelaars en
  hoort Codex `memory_search` of `memory_get` te gebruiken wanneer duurzaam geheugen relevant
  is. Als tools zijn uitgeschakeld, geheugenzoekopdrachten niet beschikbaar zijn of de actieve
  werkruimte afwijkt van de geheugenwerkruimte van de agent, gebruikt `MEMORY.md` in plaats
  daarvan het normale begrensde pad voor beurtcontext.
- `BOOTSTRAP.md` wordt, wanneer aanwezig, doorgestuurd als OpenClaw-referentiecontext voor de
  beurtinvoer.

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
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor een eenmalige lokale test. Configuratie heeft
de voorkeur voor herhaalbare implementaties, omdat hierdoor het gedrag van de plugin in
hetzelfde beoordeelde bestand blijft staan als de rest van de configuratie van het
Codex-harnas.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [Runtime van het Codex-harnas](/nl/plugins/codex-harness-runtime)
- [Codex-toezicht](/plugins/codex-supervision)
- [Systeemeigen Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex-computergebruik](/nl/plugins/codex-computer-use)
- [OpenAI-provider](/nl/providers/openai)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
