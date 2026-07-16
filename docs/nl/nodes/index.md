---
read_when:
    - iOS-/watchOS-/Android-nodes koppelen aan een gateway
    - Node-canvas/camera gebruiken voor agentcontext
    - Nieuwe Node-opdrachten of CLI-hulpfuncties toevoegen
summary: 'Nodes: koppelen, mogelijkheden, machtigingen en CLI-hulpprogramma''s voor canvas/camera/scherm/apparaat/meldingen/systeem'
title: Nodes
x-i18n:
    generated_at: "2026-07-16T16:02:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

Een **node** is een begeleidend apparaat (macOS/iOS/watchOS/Android/headless) dat met `role: "node"` verbinding maakt met de Gateway en via `node.invoke` een opdrachtinterface beschikbaar stelt (bijv. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`). De meeste nodes gebruiken de Gateway-WebSocket op de operatorpoort. De optionele rechtstreekse Apple Watch-node gebruikt ondertekende HTTPS-polling op diezelfde poort, omdat watchOS generieke low-level-netwerktoegang voor gewone apps blokkeert. Protocoldetails: [Gateway-protocol](/nl/gateway/protocol).

Verouderd transport: [Bridge-protocol](/nl/gateway/bridge-protocol) (TCP JSONL; alleen historisch voor huidige nodes).

macOS kan ook in **node-modus** worden uitgevoerd: de menubalkapp maakt als één node verbinding met de
WS-server van de Gateway (zodat `openclaw nodes …` op deze Mac werkt). De app
voegt systeemeigen opdrachten voor Canvas, camera, scherm, meldingen en computerbesturing
toe aan dezelfde opdrachtinterface van de node-host die door `openclaw node run` wordt gebruikt. Start geen
tweede CLI-node op die Mac; de app voert de bijbehorende CLI-node-hostruntime uit als
interne worker en blijft de enige Gateway-verbinding en node-identiteit.

Nodes zijn **randapparaten**, geen gateways: ze voeren de gatewayservice niet uit en kanaalberichten (Telegram, WhatsApp enz.) komen op de gateway terecht, niet op nodes.

Draaiboek voor probleemoplossing: [/nodes/troubleshooting](/nl/nodes/troubleshooting)

## Koppeling + status

Nodes gebruiken **apparaatkoppeling**. Een node presenteert tijdens het verbinden een ondertekende apparaatidentiteit; de Gateway maakt een aanvraag voor apparaatkoppeling aan voor `role: node`. Keur deze goed via de apparaten-CLI (of UI). De rechtstreekse Apple Watch-configuratie gebruikt een door een beheerder aangemaakte, kortlevende installatiecode die uitsluitend voor nodes geldt om het vaste opdrachtoppervlak met laag risico goed te keuren; latere uitbreiding van mogelijkheden vereist nog steeds normale goedkeuring.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Openstaande koppelingsaanvragen verlopen 5 minuten na de laatste nieuwe poging van het apparaat — een apparaat dat opnieuw verbinding blijft maken, houdt zijn ene openstaande aanvraag (en `requestId`) actief in plaats van elke paar minuten een nieuwe prompt aan te maken; zie [Node-koppeling](/nl/gateway/pairing) voor de volledige levenscyclus van aanvraag en goedkeuring. Als een node het opnieuw probeert met gewijzigde authenticatiegegevens (rol/scopes/openbare sleutel), wordt de eerdere openstaande aanvraag vervangen en wordt een nieuwe `requestId` aangemaakt — clients ontvangen een `device.pair.resolved`-event voor de vervangen aanvraag en je moet `openclaw devices list` opnieuw uitvoeren voordat je goedkeurt.

- `nodes status` markeert een node als **gekoppeld** wanneer de rol voor apparaatkoppeling `node` bevat.
- Een verbonden systeemeigen Mac met toegankelijkheidstoestemming kan samengevoegde
  activiteit van fysieke invoer rapporteren. De Gateway markeert de meest recente geschikte Mac als
  `active`, geeft de agent een stabiele hint voor de node-id en stuurt waarschuwingen over
  nodeverbindingen daarheen vóór een vertraagde fallback. Zie
  [Aanwezigheid op de actieve computer](/nodes/presence) voor configuratie, privacy, timing en
  probleemoplossing.
- De record voor apparaatkoppeling is het duurzame contract voor goedgekeurde rollen. Tokenrotatie blijft binnen dat contract; hiermee kan een gekoppelde node niet worden opgewaardeerd naar een rol die nooit door de koppelingsgoedkeuring is toegekend.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) is een afzonderlijke, door de gateway beheerde opslag voor nodekoppelingen die het goedgekeurde opdracht-/mogelijkhedenoppervlak van de node bijhoudt wanneer opnieuw verbinding wordt gemaakt. Deze opslag regelt **niet** de transportauthenticatie — dat doet apparaatkoppeling.
- `openclaw nodes remove --node <id|name|ip>` verwijdert een nodekoppeling. Voor een door een apparaat ondersteunde node trekt dit de rol `node` van het apparaat in de opslag voor gekoppelde apparaten in en verbreekt het de noderolsessies van dat apparaat: een apparaat met gemengde rollen behoudt zijn rij en verliest alleen de rol `node`, terwijl de rij van een apparaat met alleen een noderol wordt verwijderd. Ook wordt elke overeenkomende vermelding uit de afzonderlijke opslag voor nodekoppelingen verwijderd. `operator.pairing` kan node-rijen zonder operatorrol op andere apparaten verwijderen; een aanroeper met een apparaattoken die zijn eigen noderol intrekt op een apparaat met gemengde rollen, heeft daarnaast `operator.admin` nodig.
- De reikwijdte van de goedkeuring volgt de opgegeven opdrachten van de openstaande aanvraag:
  - aanvraag zonder opdrachten: `operator.pairing`
  - nodeopdrachten zonder uitvoering: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Versieverschillen en upgradevolgorde

De Gateway-WebSocket accepteert geauthenticeerde nodeclients binnen een N-1-protocolvenster.
De huidige v4-Gateway accepteert daarom v3-nodes wanneer de verbinding zowel
`role: "node"` als `client.mode: "node"` opgeeft. Operator- en UI-sessies moeten
nog steeds het huidige protocol gebruiken.

Voor gefaseerde upgrades van het apparatenpark upgrade je eerst de Gateway en daarna elke node.
Een N-1-node blijft zichtbaar en beheerbaar terwijl deze wordt geüpgraded; de Gateway
registreert `legacy node protocol accepted` met een upgradeadvies. Koppeling,
apparaatverificatie, toelatingslijsten voor opdrachten en uitvoeringsgoedkeuringen blijven van toepassing.
Mogelijkheden en opdrachten die eigendom zijn van Plugins blijven verborgen totdat de node is geüpgraded naar
het huidige protocol. Nodes die ouder zijn dan N-1 vereisen een upgrade buiten het reguliere kanaal voordat
ze opnieuw verbinding kunnen maken.

Het rechtstreekse watchOS-HTTPS-transport vereist de huidige protocolversie; werk
de Watch-app samen met de Gateway bij voordat je de rechtstreekse modus inschakelt.

## Externe node-host (system.run)

Gebruik een **node-host** wanneer je Gateway op de ene machine wordt uitgevoerd en je opdrachten op een andere wilt uitvoeren. Het model communiceert nog steeds met de **gateway**; de gateway stuurt `exec`-aanroepen door naar de **node-host** wanneer `host=node` is geselecteerd.

| Rol          | Verantwoordelijkheid                                               |
| ------------ | ------------------------------------------------------------------ |
| Gateway-host | Ontvangt berichten, voert het model uit en routeert toolaanroepen. |
| Node-host    | Voert `system.run`/`system.which` uit op de nodemachine. |
| Goedkeuringen | Worden op de node-host afgedwongen via `~/.openclaw/exec-approvals.json`.         |

Opmerking over goedkeuring:

- Node-uitvoeringen waarvoor goedkeuring vereist is, worden aan de exacte aanvraagcontext gebonden. Het uitvoeringspad bereidt vóór goedkeuring een canonieke `systemRunPlan` voor; zodra goedkeuring is verleend, stuurt de gateway dat opgeslagen plan door, niet eventuele later door de aanroeper gewijzigde opdracht-/cwd-/sessievelden, en valideert de werkmap opnieuw vóór de uitvoering.
- Voor rechtstreekse uitvoeringen van shell-/runtimebestanden bindt OpenClaw waar mogelijk ook één concreet lokaal bestandsoperand en weigert het de uitvoering als dat bestand vóór de uitvoering verandert.
- Als OpenClaw niet precies één concreet lokaal bestand voor een interpreter-/runtimeopdracht kan identificeren, wordt uitvoering waarvoor goedkeuring vereist is geweigerd in plaats van volledige runtimedekking voor te wenden. Gebruik sandboxing, afzonderlijke hosts of een expliciete vertrouwde toelatingslijst/volledige workflow voor bredere interpretersemantiek.

### Een node-host starten (voorgrond)

Op de nodemachine:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` accepteert ook `--context-path` (Gateway-WS-contextpad), `--tls`, `--tls-fingerprint <sha256>` en `--node-id` (overschrijft de verouderde clientinstantie-id; hierdoor wordt de koppeling niet opnieuw ingesteld).

### Externe gateway via SSH-tunnel (loopbackbinding)

Als de Gateway aan loopback is gebonden (`gateway.bind=loopback`, standaard in lokale modus), kunnen externe node-hosts niet rechtstreeks verbinding maken. Maak een SSH-tunnel en laat de node-host verbinding maken met het lokale uiteinde van de tunnel.

Voorbeeld (node-host -> gateway-host):

```bash
# Terminal A (actief houden): stuur lokale 18790 door -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exporteer het gatewaytoken en maak via de tunnel verbinding
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Opmerkingen:

- `openclaw node run` ondersteunt authenticatie met een token of wachtwoord.
- Omgevingsvariabelen hebben de voorkeur: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- De configuratiefallback is `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus negeert de node-host bewust `gateway.remote.token` / `gateway.remote.password`.
- In externe modus komen `gateway.remote.token` / `gateway.remote.password` in aanmerking volgens de externe voorrangsregels.
- Als actieve lokale `gateway.auth.*` SecretRefs zijn geconfigureerd maar niet kunnen worden omgezet, mislukt de node-hosta authenticatie op een veilige, gesloten manier.
- De authenticatieoplossing van de node-host respecteert alleen `OPENCLAW_GATEWAY_*`-omgevingsvariabelen.

### Een node-host starten (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` accepteert ook `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (alleen verouderde clientinstantie-id), `--runtime <node>` (standaard: node) en `--force` om opnieuw te installeren. `node status`, `node stop` en `node uninstall` zijn ook beschikbaar.

### Koppelen + naam geven

Op de gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Als de node het opnieuw probeert met gewijzigde authenticatiegegevens, voer je `openclaw devices list` opnieuw uit en keur je de huidige `requestId` goed.

Naamgevingsopties:

- `--display-name` op `openclaw node run` / `openclaw node install` (blijft behouden in de gedeelde SQLite-rij `node_host_config`, naast de clientinstantie-id en metadata van de Gateway-verbinding).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gatewayoverschrijving).

### MCP-servers op nodes

Configureer MCP-servers in `openclaw.json` op de nodemachine, niet op de
Gateway:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

De headless node-host start deze servers, vermeldt hun tools en publiceert
de descriptors nadat verbinding is gemaakt. Toolaanroepen keren via
`mcp.tools.call.v1` terug naar die node; de Gateway heeft geen overeenkomende MCP-configuratie of JS-
Plugin nodig. OAuth-MCP-servers worden niet ondersteund door dit v1-pad op de node-host.

Huidige node-hosts geven de ingebouwde opdrachtfamilie `mcp.tools.call.v1` op tijdens
hun eerste koppeling, zelfs wanneer er geen MCP-server is geconfigureerd. Een node die op een
oudere OpenClaw-versie is gekoppeld, kan een eenmalige upgrade van het opdrachtoppervlak aanvragen nadat de
node-host is bijgewerkt. Voor het toevoegen, verwijderen of filteren van servers is
geen nieuwe koppeling vereist, omdat de goedgekeurde opdrachtfamilie ongewijzigd blijft. Start
`openclaw node run` of `openclaw node restart` opnieuw om wijzigingen in de MCP-configuratie van de node toe te passen;
de node-host bewaakt deze configuratie niet.

Gateway-operators kunnen alle voor agents zichtbare tools negeren die door gekoppelde nodes worden gepubliceerd,
waaronder MCP-tools op nodes, met
`gateway.nodes.pluginTools.enabled: false`. Exacte opdrachtweigeringen zoals
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` blokkeren ook de uitvoering.

### Skills op nodes

Installeer Skills in de actieve OpenClaw-Skills-map van de nodemachine,
standaard `~/.openclaw/skills`. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` en
`OPENCLAW_CONFIG_PATH` verplaatsen dat actieve profiel. `OPENCLAW_STATE_DIR` heeft
voorrang voor Skills; anders bevindt `skills/` zich naast het pad dat wordt weergegeven door
`openclaw config file`. De headless node-host publiceert geldige `SKILL.md`-bestanden
nadat verbinding is gemaakt, en de Gateway voegt deze alleen aan snapshots van agent-Skills toe zolang
die node verbonden blijft. Elke mapnaam van een Skill moet overeenkomen met het frontmatterveld `name`,
zodat de abstracte nodelocator naar één vermelding verwijst zonder
nog een protocolveld toe te voegen.

De initiële koppeling van de noderol keurt de publicatie van Skills goed. Voor het toevoegen, verwijderen of
wijzigen van Skills is geen nieuwe koppeling of wijziging van de Gateway-configuratie
nodig. Start `openclaw node run` of `openclaw node restart` opnieuw nadat je
Skill-bestanden op de node hebt gewijzigd; de nodehost bewaakt de Skills-map niet.

Door de node gehoste Skill-vermeldingen identificeren hun node en bevatten hun uitvoeringslocatie.
Skill-bestanden, paden waarnaar relatief wordt verwezen en binaire bestanden blijven op die
node. De agent leest de geadverteerde locatie `node://.../SKILL.md` met de
normale tool `read`. `file_fetch` accepteert door de operator goedgekeurde absolute nodepaden,
geen locators van node-Skills; runtimes zonder de normale leestool kunnen in plaats daarvan
`cat SKILL.md` via `exec host=node node=<node-id>` uitvoeren met de geadverteerde
map `node://.../skills/<name>` als `workdir`. Bestanden en binaire bestanden waarnaar wordt verwezen
gebruiken hetzelfde uitvoeringsdoel en dezelfde werkmap. De nodehost zet die locator om ten opzichte van
zijn actieve OpenClaw-statusmap, zodat relatieve paden op de node worden omgezet
en niet op de Gateway-machine. De publicerende node moet goedkeuring hebben voor `system.run`,
en het uitvoeringsbeleid van de agent moet `host=node` toestaan; anders blijft de Skill
buiten de momentopname van die agent.

Stel `nodeHost.skills.enabled: false` op de node in om publicatie te stoppen. Gateway-
operators kunnen Skills van elke gekoppelde node negeren met
`gateway.nodes.skills.enabled: false`.

### Identiteitsstatus zonder gebruikersinterface

De node zonder gebruikersinterface bewaart drie afzonderlijke statusrecords:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): de clientinstantie-ID, weergavenaam en metagegevens van de Gateway-verbinding.
- `~/.openclaw/identity/device.json`: het ondertekende sleutelpaar van het apparaat en de daarvan afgeleide cryptografische apparaat-ID.
- `~/.openclaw/identity/device-auth.json`: verificatietokens van gekoppelde apparaten, geïndexeerd op cryptografische apparaat-ID en rol.

Voor een ondertekende node gebruikt de Gateway de cryptografische apparaat-ID voor koppeling en
noderoutering. De clientinstantie-ID bestaat alleen uit verbindingsmetagegevens. Het wijzigen van
`--node-id` of migreren van een buiten gebruik gestelde `node.json` stelt de koppeling daarom niet opnieuw in. Zie
[Identiteits- en koppelingsstatus](/nl/cli/node#identity-and-pairing-state) voor de
ondersteunde procedure om de koppeling in te trekken en opnieuw tot stand te brengen, en voor upgrade-opmerkingen.

### De opdrachten aan de toelatingslijst toevoegen

Uitvoeringsgoedkeuringen gelden **per nodehost**. Voeg vermeldingen aan de toelatingslijst toe vanaf de Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Goedkeuringen bevinden zich op de nodehost in `~/.openclaw/exec-approvals.json`.

### Uitvoering naar de node verwijzen

Configureer de standaardwaarden (Gateway-configuratie):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Of per sessie:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Zodra dit is ingesteld, wordt elke aanroep van `exec` met `host=node` uitgevoerd op de nodehost (onderworpen aan de toelatingslijst/goedkeuringen van de node).

`host=auto` kiest niet impliciet zelf de node, maar een expliciete aanvraag per aanroep voor `host=node` vanuit `auto` is toegestaan. Als node-uitvoering de standaard voor de sessie moet zijn, stel je `tools.exec.host=node` of `/exec host=node ...` expliciet in.

Gerelateerd:

- [CLI voor nodehosts](/nl/cli/node)
- [Uitvoeringstool](/nl/tools/exec)
- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals)

### Lokale modelinferentie

Een desktop- of servernode kan chatmodellen beschikbaar stellen vanuit een Ollama-server die op die node draait. Agents gebruiken de tool `node_inference` van de Ollama-Plugin om geïnstalleerde modellen te detecteren en op afstand een begrensde prompt uit te voeren; de Gateway heeft geen directe netwerktoegang tot Ollama nodig. Zie [Nodelokale Ollama-inferentie](/nl/providers/ollama#node-local-inference) voor de installatie, modelfiltering en opdrachten voor directe verificatie.

### Codex-sessies en transcripties

De officiële Plugin `codex` kan niet-gearchiveerde Codex-sessies beschikbaar stellen op een
nodehost zonder gebruikersinterface of een systeemeigen macOS-node. Catalogusregistratie is niet langer afhankelijk
van `supervision.enabled`; die optie beheert de supervisietools die voor de agent beschikbaar zijn.
Stel `sessionCatalog.enabled: false` in de configuratie van de Codex-Plugin in om de
opdrachten voor de operatorcatalogus en de catalogus van gekoppelde nodes uit te schakelen zonder de
provider of harness uit te schakelen.
De Plugin moet op beide computers actief blijven, en de node-instelling blijft
lokale toestemming: alleen inschakelen op de Gateway geeft geen toegang tot de Codex-
status van een andere computer.

De node adverteert de geversioneerde alleen-lezenopdrachten
`codex.appServer.threads.list.v1` en
`codex.appServer.thread.turns.list.v1`. Een systeemeigen nodehost waarop de
Codex CLI beschikbaar is, adverteert ook `codex.terminal.resume.v1`. Keur de upgrade van de nodekoppeling goed
wanneer die opdrachten voor het eerst verschijnen. De Gateway roept ze aan via het
normale nodebeleid van de Plugin en isoleert fouten per host.

Rijen van gekoppelde nodes worden als een groep **Codex** weergegeven in de normale sessiezijbalk.
Standaard opent het selecteren van een rij het normale chatvenster en wordt het opgeslagen transcript
gelezen via begrensde, met een cursor gepagineerde
`thread/turns/list`-aanroepen met volledige itemprojectie. Gebruik het rijmenu, de koptekst van de viewer of de voorkeur **Open Codex/Claude sessions in** om `codex resume <thread-id>` te starten in de operatorterminal op de computer die eigenaar is van de sessie. Het terminalpad van de gekoppelde node is een PTY-relay op de toelatingslijst die eigendom is van de Codex-Plugin, geen willekeurige uitvoering van nodeopdrachten.

De relay biedt niet de volledige OpenClaw-contracten voor voortzetting via de harness en archiefeigendom. **Doorgaan** en **Archiveren** zijn daarom niet beschikbaar voor externe rijen. Op de Gateway-computer kunnen opgeslagen en inactieve
rijen een afzonderlijke, aan een model vergrendelde chattak starten. Beide kunnen alleen worden gearchiveerd
nadat de operator heeft bevestigd dat geen andere Codex-client deze gebruikt; de liveactiviteit van een opgeslagen
rij blijft onbekend. Actieve rijen kunnen niet vertakken of worden gearchiveerd.

Zie [Toezicht houden op Codex-sessies](/nl/plugins/codex-supervision) voor de installatie,
paginering, lokale voortzetting en de beveiligingsgrens voor metagegevens.

### Claude-sessies en transcripties

De gebundelde Plugin `anthropic` detecteert standaard niet-gearchiveerde Claude CLI- en Claude
Desktop-sessies op de Gateway en gekoppelde nodes. Stel
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` in om de
opdrachten voor de operatorcatalogus en de catalogus van gekoppelde nodes uit te schakelen zonder Anthropic-
modellen of de Claude CLI-backend uit te schakelen.
Een externe macOS-appnode adverteert
`anthropic.claude.sessions.list.v1` en `anthropic.claude.sessions.read.v1`
wanneer de Anthropic-Plugin is ingeschakeld en `~/.claude/projects/` bestaat. Keur
de upgrade van de nodekoppeling goed wanneer die opdrachten voor het eerst verschijnen.

Een systeemeigen nodehost waarop de Claude CLI beschikbaar is, adverteert ook
`anthropic.claude.terminal.resume.v1`. Geschikte CLI- en Desktop-rijen kunnen
`claude --resume <session-id>` openen in de operatorterminal op hun host.
Hiermee wordt de systeemeigen sessie overgenomen; in tegenstelling tot overname door OpenClaw wordt
de Claude-sessie niet eerst gevorkt.

De catalogus combineert geldige projectindexrecords van Claude CLI met een begrensd
metagegevensvoorvoegsel uit actuele JSONL-bestanden in `sdk-cli`. De lokale
metagegevens van Claude Desktop leveren Desktop-titels en de archiefstatus. Desktop-metagegevens hebben voorrang wanneer
beide bronnen verwijzen naar dezelfde Claude Code-sessie-ID; transcripties die alleen in de CLI voorkomen,
blijven zichtbaar omdat de CLI geen archiefvlag heeft. Transcripten worden gelezen met ondoorzichtige
byte-offsetcursors en begrensde achterwaartse bestandslezingen, zodat bij het selecteren van een grote
sessie of laden van een oudere pagina niet de volledige JSONL-geschiedenis in één
Gateway-antwoord wordt gelezen.

De lijst- en leesopdrachten zijn alleen-lezen. Ze maken catalogusmetagegevens en transcriptie-
inhoud alleen beschikbaar via de generieke methoden `sessions.catalog.list` en
`sessions.catalog.read` aan een geverifieerde operatorverbinding met
`operator.write`. Een Gateway-lokale Claude CLI-rij kan vanuit het normale
chatopstelveld worden overgenomen: OpenClaw importeert begrensde zichtbare geschiedenis, hervat tijdens
de eerste beurt met `--fork-session` en laat het brontranscript ongewijzigd.

Een nodehost zonder gebruikersinterface kan zich aanmelden voor dezelfde voortzettingsprocedure:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

De node adverteert `agent.cli.claude.run.v1` alleen wanneer deze nodelokale instelling
is ingeschakeld en het uitvoerbare bestand `claude` op die node kan worden gevonden. De Gateway kan
dit niet op afstand inschakelen. De opdracht doorloopt ook het bestaande uitvoeringsgoedkeuringsbeleid
van de node. Wanneer alle drie de Claude-opdrachten worden geadverteerd en zijn toegestaan door
het nodeopdrachtbeleid van de Gateway, kan een Claude CLI-
rij op die node worden voortgezet: OpenClaw importeert begrensde geschiedenis, koppelt
de overgenomen sessie aan de node en de door de catalogus gerapporteerde werkmap, en
voert elke eenmalige beurt van `claude -p` daar uit. De eerste beurt gebruikt nog steeds
`--fork-session`, zodat het brontranscript behouden blijft.

Op de node uitgevoerde beurten gebruiken de Claude-standaardwaarden van de node. In v1 ontvangen ze niet de
MCP-loopbackconfiguratie van de Gateway of de Skills-Plugin van de Gateway, kunnen ze niet opnieuw worden gevuld vanuit een
Gateway-transcript en weigeren ze bijlagen en afbeeldingen. Claude Desktop-rijen en
nodes die de uitvoeringsopdracht niet adverteren, blijven alleen-lezen. De macOS-appnode
adverteert deze opdracht nog niet, dus de rijen daarvan blijven alleen-lezen.

Zie [Anthropic: Claude-sessies op verschillende computers](/nl/providers/anthropic#claude-sessions-across-computers)
voor het gedrag van de Control UI en de opslagbronnen.

### OpenCode- en Pi-sessies

De gebundelde OpenCode- en ACPX-Plugins detecteren ook alleen-lezen catalogi van systeemeigen sessies
op de Gateway en gekoppelde nodes. Een node adverteert
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` wanneer de CLI `opencode`
is geïnstalleerd, en `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
wanneer de sessiemap van Pi bestaat. Keur de upgrade van de nodekoppeling goed wanneer nieuwe
opdrachten voor het eerst verschijnen. Wanneer de overeenkomende CLI ook beschikbaar is, voegt de node
`opencode.terminal.resume.v1` of `acpx.pi.terminal.resume.v1` toe; via het bestaande rijmenu
en de koptekst van de viewer kan de geselecteerde sessie vervolgens opnieuw worden geopend in de bijbehorende
terminal met `opencode --session <id>` of `pi --session <id>`.

OpenCode leest via het officiële JSON-/exportoppervlak van de CLI. Pi leest zijn
gedocumenteerde JSONL-sessieopslag, waaronder de project- en algemene sessiemappen
`settings.json` plus de overschrijvingen `PI_CODING_AGENT_DIR` en
`PI_CODING_AGENT_SESSION_DIR`. Beide catalogi zijn standaard ingeschakeld;
schakel ze uit in de webinterface onder **Config > Plugins**.

Voor hervatten via de terminal worden de opgeslagen werkmap van de sessie en dezelfde
duplex PTY-relay op de toelatingslijst gebruikt als voor Codex en Claude. Deze stelt geen willekeurige
uitvoering van nodeopdrachten beschikbaar.

### Terminalbestandsuploads

In de Control UI kunnen bestanden naar een geopende terminal van een gekoppelde node worden gesleept. De systeemeigen nodehost adverteert de alleen-voor-beheerdersopdracht `terminal.upload`; keur de koppelingsupgrade goed wanneer deze voor het eerst verschijnt. Elk bestand is beperkt tot 16 MiB, wordt klaargezet in een persoonlijke tijdelijke map op die node en als een voor de shell geciteerd pad aan de terminal geretourneerd zonder het uit te voeren.

Padinvoeging ondersteunt PowerShell, `cmd.exe` en herkende POSIX-shells (`sh`, Bash, Dash, Ash, Ksh, Zsh en Fish), waaronder Git Bash op Windows. Andere shelloverschrijvingen worden geweigerd omdat hun citeringsregels niet veilig kunnen worden afgeleid; voer de nodehost binnen WSL uit voor systeemeigen WSL-paden. `cmd.exe`-paden die `%` of `!` bevatten, worden ook geweigerd omdat die shell deze tekens zelfs binnen dubbele aanhalingstekens uitbreidt.

## Opdrachten aanroepen

Laag niveau (onbewerkte RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` blokkeert `system.run` en `system.run.prepare`; deze opdrachten worden alleen uitgevoerd via de tool `exec` met `host=node` (zie hierboven). Voor de gebruikelijke workflows waarbij de agent een MEDIA-bijlage krijgt, bestaan helpers op een hoger niveau (canvas, camera, scherm, locatie, hieronder).

Langdurige streamende Node-opdrachten gebruiken additieve `node.invoke.progress`-gebeurtenissen. Elke gebeurtenis bevat de aanroep-ID, een op nul gebaseerd volgnummer en een begrensd UTF-8-tekstfragment; de Gateway ordent fragmenten voordat deze aan de aanroeper worden geleverd. De bestaande `node.invoke.result` blijft de enige afsluitende respons. Streamende aanroepers kunnen een inactiviteitsdeadline instellen die bij de eerste voortgangsgebeurtenis begint en na latere voortgang opnieuw wordt ingesteld, terwijl de afzonderlijke harde time-out van de aanroep tijdens goedkeuring en uitvoering behouden blijft. Een resultaat, harde time-out, inactiviteitstime-out en verbroken Node-verbinding verwijderen allemaal de wachtende streamstatus. Annulering door de aanroeper verzendt `node.invoke.cancel`; de Node-host beëindigt vervolgens de bijbehorende processtructuur. Bestaande opdrachten met verzoek/respons blijven ongewijzigd.

## Opdrachtbeleid

Node-opdrachten moeten twee controles doorstaan voordat ze kunnen worden aangeroepen:

1. De Node moet de opdracht declareren in de geauthenticeerde verbindingsmetadata (`connect.commands`).
2. De op het platform en de goedkeuring gebaseerde toestemmingslijst van de Gateway moet de gedeclareerde opdracht bevatten.

Standaardtoestemmingslijsten per platform (vóór Plugin-standaardwaarden en overschrijvingen via `allowCommands`/`denyCommands`):

| Platform | Standaard toegestane opdrachten                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (Node-hostopdrachten zoals `system.run` vereisen goedkeuring; zie hieronder)                                                                                                                                                                                                                                  |

Deze rijen beschrijven de bovengrens van het Gateway-beleid, niet de opdrachten die door elke Node-app zijn geïmplementeerd. Een opdracht is alleen bruikbaar wanneer de verbonden Node deze ook declareert. De huidige macOS-app declareert met name niet de apparaat- en persoonsgegevensfamilies die in de macOS-beleidsrij worden vermeld.

`canvas.*`-opdrachten (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) zijn een Plugin-standaardwaarde op iOS, Android, macOS, Windows, Linux en onbekende platforms. Linux-Nodes declareren ze alleen wanneer de lokale Canvas-socket van de desktop-app aanwezig is. Alle Canvas-opdrachten zijn op iOS beperkt tot de voorgrond.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` en `talk.ptt.once` zijn standaard toegestaan voor elke Node die de mogelijkheid `talk` adverteert of `talk.*`-opdrachten declareert, ongeacht het platformlabel.

Desktophostopdrachten (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` en `screen.snapshot` op macOS/Windows) maken geen deel uit van de bovenstaande statische tabel met platformstandaarden. Ze worden beschikbaar zodra de beheerder een koppelingsverzoek goedkeurt waarin ze worden gedeclareerd. Daarna neemt de goedgekeurde opdrachtenset van de Node ze mee bij opnieuw verbinden.

Gevaarlijke of privacygevoelige opdrachten vereisen nog steeds expliciete inschakeling met `gateway.nodes.allowCommands`, zelfs als een Node ze declareert: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` heeft altijd voorrang op standaardwaarden en extra vermeldingen in de toestemmingslijst. Zie [HealthKit-samenvattingen](/platforms/ios-healthkit) voor de toestemmingscontrole op de iPhone en [Computergebruik](/nl/nodes/computer-use) voor de aanvullende macOS-, toolbeleids- en activeringscontroles rond desktopinvoer.

Node-opdrachten die eigendom zijn van een Plugin kunnen een Gateway-beleid voor Node-aanroepen toevoegen. Dat beleid wordt uitgevoerd na de controle van de toestemmingslijst en vóór doorsturen naar de Node, zodat onbewerkte `node.invoke`, CLI-hulpprogramma's en speciale agenttools dezelfde Plugin-machtigingsgrens delen. Gevaarlijke Node-opdrachten van Plugins vereisen nog steeds expliciete inschakeling via `gateway.nodes.allowCommands`.

Nadat een Node de lijst met gedeclareerde opdrachten wijzigt, wijs je de oude apparaatkoppeling af en keur je het nieuwe verzoek goed, zodat de Gateway de bijgewerkte momentopname van de opdrachten opslaat.

## Configuratie (`openclaw.json`)

Node-gerelateerde instellingen bevinden zich onder `gateway.nodes` en `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Keur de eerste Node-koppeling vanuit vertrouwde netwerken automatisch goed (CIDR-lijst).
      // Uitgeschakeld wanneer niet ingesteld. Alleen van toepassing op eerste role:node-verzoeken
      // zonder aangevraagde bereiken; upgrades worden niet automatisch goedgekeurd.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Via SSH geverifieerde automatische goedkeuring (standaard: ingeschakeld). Keurt de eerste
        // Node-koppeling goed bij een exacte overeenkomst van de apparaatsleutel die via SSH wordt teruggelezen.
        sshVerify: true,
      },
      // Vertrouw agentzichtbare Plugin-tools die door gekoppelde Nodes worden gepubliceerd (standaard: true).
      pluginTools: {
        enabled: true,
      },
      // Schakel gevaarlijke/privacygevoelige Node-opdrachten in (camera.snap enzovoort).
      allowCommands: ["camera.snap", "screen.record"],
      // Blokkeer exacte opdrachtnamen, zelfs als standaardwaarden of allowCommands ze bevatten.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Standaardhost voor uitvoering: "node" stuurt alle uitvoeringsaanroepen naar een gekoppelde Node.
      host: "node",
      // Beveiligingsmodus voor uitvoering op een Node: sta alleen goedgekeurde/op de toestemmingslijst geplaatste opdrachten toe.
      security: "allowlist",
      // Koppel uitvoering aan een specifieke Node (ID of naam). Laat weg om elke Node toe te staan.
      node: "build-node",
    },
  },
}
```

Gebruik exacte namen van Node-opdrachten. `denyCommands` verwijdert een opdracht, zelfs wanneer een platformstandaard of vermelding in `allowCommands` deze anders zou toestaan. Gekoppelde Nodes mogen standaard agentzichtbare descriptoren voor Plugin-tools publiceren, maar de opdracht van elke descriptor moet nog steeds deel uitmaken van het goedgekeurde opdrachtenoppervlak van de Node. Stel `gateway.nodes.pluginTools.enabled: false` in om al deze descriptoren te negeren. Zie [Naslag voor Gateway-configuratie](/nl/gateway/configuration-reference#gateway) voor details over velden voor Gateway-Node-koppeling en opdrachtbeleid.

Overschrijving van de uitvoerings-Node per agent:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Schermafbeeldingen (Canvas-momentopnamen)

Als de Node het Canvas (WebView) weergeeft, retourneert `canvas.snapshot` `{ format, base64 }`.

CLI-hulpprogramma (schrijft naar een tijdelijk bestand en drukt het opgeslagen pad af):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas-besturing

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Opmerkingen:

- `canvas present` accepteert URL's of lokale bestandspaden (`--target`) op Nodes die lokale paden ondersteunen, plus optioneel `--x/--y/--width/--height` voor positionering. Linux Canvas accepteert HTTP(S)-URL's of de meegeleverde A2UI-renderer.
- `canvas eval` accepteert inline-JavaScript (`--js`) of een positioneel argument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Opmerkingen:

- Mobiele Nodes en Linux-desktop-Nodes gebruiken een meegeleverde A2UI-pagina die eigendom is van de app voor rendering met actieondersteuning.
- Alleen A2UI v0.8 JSONL wordt ondersteund (v0.9/createSurface wordt afgewezen).
- iOS en Android renderen externe Gateway Canvas-pagina's, maar A2UI-knopacties worden alleen verzonden vanaf de meegeleverde A2UI-pagina die eigendom is van de app. Door de Gateway gehoste HTTP/HTTPS-A2UI-pagina's zijn op deze mobiele clients alleen geschikt voor rendering.
- macOS kan acties verzenden vanaf exact de door mogelijkheden begrensde Gateway A2UI-pagina die door de app is geselecteerd. Andere HTTP/HTTPS-pagina's blijven alleen geschikt voor rendering.
- Linux verzendt acties alleen vanaf de meegeleverde A2UI-pagina. Andere HTTP/HTTPS-pagina's blijven alleen geschikt voor rendering en een headless Linux-Node zonder de desktop-app adverteert Canvas niet.

## Foto's en video's (Node-camera)

Foto's (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # standaard: beide richtingen (2 MEDIA-regels)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Opmerkingen:

- De Node moet zich **op de voorgrond** bevinden voor `canvas.*` en `camera.*` (aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE`).
- Nodes begrenzen de duur van clips om de base64-payload beheersbaar te houden (zie [Camera-opname](/nl/nodes/camera) voor de exacte limieten per platform). De agenttool `nodes` begrenst de aangevraagde `durationMs` bovendien op 300000 (5 minuten) voordat de aanroep wordt doorgestuurd; de Node zelf handhaaft de strengere limiet.
- Android vraagt waar mogelijk om machtigingen voor `CAMERA`/`RECORD_AUDIO`; geweigerde machtigingen mislukken met `*_PERMISSION_REQUIRED`.

## Schermopnamen (Nodes)

Ondersteunde Nodes bieden `screen.record` (mp4). Voorbeeld:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Opmerkingen:

- De beschikbaarheid van `screen.record` is afhankelijk van het Node-platform.
- De agenttool `nodes` begrenst de aangevraagde `durationMs` op 300000 (5 minuten); de Node kan een strengere limiet afdwingen om de geretourneerde payload te begrenzen.
- `--no-audio` schakelt microfoonopname uit op ondersteunde platforms.
- Gebruik `--screen <index>` om een beeldscherm te selecteren wanneer meerdere schermen beschikbaar zijn (0 = primair).

## Locatie (Nodes)

Nodes stellen `location.get` beschikbaar wanneer Locatie in de instellingen is ingeschakeld.

CLI-helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Opmerkingen:

- Locatie is **standaard uitgeschakeld**.
- ‘Altijd’ vereist systeemtoestemming; ophalen op de achtergrond gebeurt op basis van beste inspanning.
- Het antwoord bevat breedtegraad/lengtegraad, nauwkeurigheid (meter) en tijdstempel.
- Volledige parameter- en antwoordstructuur en foutcodes: [Locatieopdracht](/nl/nodes/location-command).

## SMS (Android-Nodes)

Android-Nodes kunnen `sms.send` en `sms.search` beschikbaar stellen wanneer de gebruiker **SMS**-toestemming verleent en het apparaat telefonie ondersteunt. Beide opdrachten zijn standaard gevaarlijk: de Gateway-beheerder moet ze ook aan `gateway.nodes.allowCommands` toevoegen voordat ze kunnen worden aangeroepen (zie [Opdrachtbeleid](#command-policy)).

Meld je voor alleen-lezen zoeken in sms-berichten expliciet aan in `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Voeg `sms.send` alleen afzonderlijk toe wanneer de Node ook berichten moet kunnen verzenden. Android-toestemming en Gateway-opdrachtmachtiging staan los van elkaar; het verlenen van de telefoontoestemming wijzigt het Gateway-beleid niet.

Aanroep op laag niveau:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Opmerkingen:

- `sms.search` kan worden gedeclareerd voordat `READ_SMS` is verleend, zodat een aanroep een toestemmingsdiagnose kan retourneren; voor het lezen van berichten blijft die Android-toestemming vereist.
- Apparaten met alleen wifi en zonder telefonie maken geen melding van `sms.send`.
- Een fout `requires explicit gateway.nodes.allowCommands opt-in` betekent dat de telefoon de opdracht heeft gedeclareerd, maar dat de Gateway-beheerder deze niet heeft gemachtigd.

## Opdrachten voor apparaat- en persoonsgegevens

iOS- en Android-Nodes maken standaard verschillende alleen-lezen gegevensopdrachten bekend (zie de tabel bij [Opdrachtbeleid](#command-policy)); Android stelt daarnaast een grotere familie beschikbaar die wordt beheerd via eigen instellingen in de app.

Beschikbare families:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — alleen Android; voor `device.apps` moet het delen van geïnstalleerde apps zijn ingeschakeld in Android Settings en standaard worden apps geretourneerd die zichtbaar zijn in het startprogramma.
- `notifications.list`, `notifications.actions` — alleen Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (standaard alleen-lezen); `contacts.add` is gevaarlijk en vereist `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (standaard alleen-lezen); `calendar.add` is gevaarlijk en vereist `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (standaard alleen-lezen); `reminders.add` is gevaarlijk en vereist `gateway.nodes.allowCommands`.
- `callLog.search` — alleen Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; afhankelijk van de mogelijkheden van de beschikbare sensoren.

Voorbeeldaanroepen:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Systeemopdrachten (Node-host/Mac-Node)

De macOS-Node stelt `system.run`, `system.which`, `system.notify` en `system.execApprovals.get/set` beschikbaar. De headless Node-host stelt `system.run.prepare`, `system.run`, `system.which` en `system.execApprovals.get/set` beschikbaar.

Voorbeelden:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Opmerkingen:

- `system.run` retourneert stdout/stderr/afsluitcode in de payload.
- Shelluitvoering verloopt nu via de tool `exec` met `host=node`; `nodes` blijft het directe RPC-oppervlak voor expliciete Node-opdrachten.
- `nodes invoke` stelt `system.run` of `system.run.prepare` niet beschikbaar; deze blijven uitsluitend beschikbaar via het uitvoeringspad.
- Het uitvoeringspad bereidt vóór goedkeuring een canonieke `systemRunPlan` voor. Zodra goedkeuring is verleend, stuurt de Gateway dat opgeslagen plan door, niet eventuele later door de aanroeper gewijzigde opdracht-/cwd-/sessievelden.
- `system.notify` respecteert de status van de meldingstoestemming in de macOS-app en ondersteunt `--priority <passive|active|timeSensitive>` en `--delivery <system|overlay|auto>`.
- Niet-herkende `platform`-/`deviceFamily`-metadata van Nodes gebruikt een conservatieve standaardtoelatingslijst die `system.run` en `system.which` uitsluit. Als je deze opdrachten bewust nodig hebt voor een onbekend platform, voeg je ze expliciet toe via `gateway.nodes.allowCommands`.
- `system.run` ondersteunt `--cwd`, `--env KEY=VAL`, `--command-timeout` en `--needs-screen-recording`.
- Voor shellwrappers (`bash|sh|zsh ... -c/-lc`) worden `--env`-waarden met een aanvraagbereik beperkt tot een expliciete toelatingslijst (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bij beslissingen om altijd toe te staan in de toelatingslijstmodus worden voor bekende dispatchwrappers (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) de paden van de interne uitvoerbare bestanden opgeslagen in plaats van de wrapperpaden. Als uitpakken niet veilig is, wordt niet automatisch een vermelding in de toelatingslijst opgeslagen.
- Op Windows-Node-hosts in de toelatingslijstmodus vereisen shellwrapperuitvoeringen via `cmd.exe /c` goedkeuring (alleen een vermelding in de toelatingslijst staat de wrappervorm niet automatisch toe).
- Node-hosts negeren `PATH`-overschrijvingen in `--env` en verwijderen een grote, onderhouden verzameling opstartvariabelen voor interpreters/shells (bijvoorbeeld `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) voordat een opdracht wordt uitgevoerd. Als je aanvullende PATH-vermeldingen nodig hebt, configureer je de serviceomgeving van de Node-host (of installeer je tools op standaardlocaties) in plaats van `PATH` door te geven via `--env`.
- In de macOS-Node-modus wordt `system.run` beperkt door uitvoeringsgoedkeuringen in de macOS-app (Settings → Exec approvals). Vragen/toelatingslijst/volledig werken hetzelfde als op de headless Node-host; geweigerde prompts retourneren `SYSTEM_RUN_DENIED`.
- Op de headless Node-host wordt `system.run` beperkt door uitvoeringsgoedkeuringen (`~/.openclaw/exec-approvals.json`); zie specifiek voor macOS de omgevingsvariabelen voor routering van de uitvoeringshost onder [Headless Node-host](#headless-node-host-cross-platform) hieronder.

## Uitvoeringsbinding aan Node

Wanneer meerdere Nodes beschikbaar zijn, kun je de uitvoering aan een specifieke Node binden. Hiermee stel je de standaard-Node in voor `exec host=node` (en dit kan per agent worden overschreven).

Algemene standaardinstelling:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Overschrijving per agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Hef de instelling op om elke Node toe te staan:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Toestemmingenoverzicht

Nodes kunnen in `node.list` / `node.describe` een `permissions`-overzicht opnemen, met de toestemmingsnaam als sleutel (bijvoorbeeld `screenRecording`, `accessibility`, `location`) en booleaanse waarden (`true` = verleend).

## Headless Node-host (platformonafhankelijk)

OpenClaw kan een **headless Node-host** (zonder UI) uitvoeren die verbinding maakt met de Gateway-WebSocket en `system.run` / `system.which` beschikbaar stelt. Dit is nuttig op Linux/Windows of om naast een server een minimale Node uit te voeren.

Start deze:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opmerkingen:

- Koppeling blijft vereist (de Gateway toont een prompt om een apparaat te koppelen).
- Metadata van de clientinstantie, ondertekende apparaatidentiteit en koppelingsauthenticatie gebruiken afzonderlijke bestanden; zie [Identiteitsstatus van headless Node](#headless-identity-state).
- Uitvoeringsgoedkeuringen worden lokaal afgedwongen via `~/.openclaw/exec-approvals.json` (zie [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals)).
- Op macOS voert de headless Node-host `system.run` standaard lokaal uit. Stel `OPENCLAW_NODE_EXEC_HOST=app` in om `system.run` via de uitvoeringshost van de begeleidende app te routeren; voeg `OPENCLAW_NODE_EXEC_FALLBACK=0` toe om de app-host te vereisen en bij onbeschikbaarheid geen uitvoering toe te staan.
- Voeg `--tls` / `--tls-fingerprint` toe wanneer de Gateway-WS TLS gebruikt.

## Mac-Node-modus

- De macOS-menubalkapp maakt als Node verbinding met de Gateway-WS-server (zodat `openclaw nodes …` voor deze Mac werkt).
- In externe modus opent de app een SSH-tunnel voor de Gateway-poort en maakt deze verbinding met `localhost`.
