---
read_when:
    - iOS/Android-nodes koppelen aan een Gateway
    - Node-canvas/camera gebruiken voor agentcontext
    - Nieuwe node-commando's of CLI-helpers toevoegen
summary: 'Nodes: koppeling, mogelijkheden, machtigingen en CLI-helpers voor canvas/camera/scherm/apparaat/meldingen/systeem'
title: Nodes
x-i18n:
    generated_at: "2026-04-30T09:37:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

Een **Node** is een begeleidend apparaat (macOS/iOS/Android/headless) dat verbinding maakt met de Gateway **WebSocket** (dezelfde poort als operators) met `role: "node"` en een commando-interface beschikbaar stelt (bijv. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Protocoldetails: [Gateway-protocol](/nl/gateway/protocol).

Verouderd transport: [Bridge-protocol](/nl/gateway/bridge-protocol) (TCP JSONL;
alleen historisch voor huidige Nodes).

macOS kan ook in **Node-modus** draaien: de menubalk-app maakt verbinding met de
WS-server van de Gateway en stelt zijn lokale canvas-/camera-commando’s beschikbaar als Node (zodat
`openclaw nodes …` werkt tegen deze Mac). In remote Gateway-modus wordt browser-
automatisering afgehandeld door de CLI Node-host (`openclaw node run` of de
geïnstalleerde Node-service), niet door de native app-Node.

Notities:

- Nodes zijn **randapparaten**, geen Gateways. Ze draaien de Gateway-service niet.
- Telegram/WhatsApp/enz.-berichten komen binnen op de **Gateway**, niet op Nodes.
- Runbook voor probleemoplossing: [/nodes/troubleshooting](/nl/nodes/troubleshooting)

## Koppeling + status

**WS-Nodes gebruiken apparaatkoppeling.** Nodes presenteren een apparaatidentiteit tijdens `connect`; de Gateway
maakt een apparaatkoppelingsverzoek aan voor `role: node`. Keur goed via de devices-CLI (of UI).

Snelle CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Als een Node opnieuw probeert met gewijzigde auth-details (rol/scopes/publieke sleutel), wordt het vorige
openstaande verzoek vervangen en wordt een nieuwe `requestId` aangemaakt. Voer
`openclaw devices list` opnieuw uit voordat je goedkeurt.

Notities:

- `nodes status` markeert een Node als **gekoppeld** wanneer de apparaatkoppelingsrol `node` bevat.
- De apparaatkoppelingsrecord is het duurzame contract voor goedgekeurde rollen. Token-
  rotatie blijft binnen dat contract; dit kan een gekoppelde Node niet upgraden naar een
  andere rol waarvoor de koppelingsgoedkeuring nooit toestemming gaf.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) is een aparte Gateway-beheerde
  Node-koppelingsopslag; deze blokkeert de WS-`connect`-handshake **niet**.
- `openclaw nodes remove --node <id|name|ip>` verwijdert verouderde items uit die
  aparte Gateway-beheerde Node-koppelingsopslag.
- Goedkeuringsscope volgt de gedeclareerde commando’s van het openstaande verzoek:
  - verzoek zonder commando’s: `operator.pairing`
  - niet-exec Node-commando’s: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote Node-host (system.run)

Gebruik een **Node-host** wanneer je Gateway op de ene machine draait en je commando’s
op een andere wilt uitvoeren. Het model praat nog steeds met de **Gateway**; de Gateway
stuurt `exec`-aanroepen door naar de **Node-host** wanneer `host=node` is geselecteerd.

### Wat draait waar

- **Gateway-host**: ontvangt berichten, draait het model, routeert toolaanroepen.
- **Node-host**: voert `system.run`/`system.which` uit op de Node-machine.
- **Goedkeuringen**: afgedwongen op de Node-host via `~/.openclaw/exec-approvals.json`.

Goedkeuringsnotitie:

- Node-runs met goedkeuring binden de exacte verzoekcontext.
- Voor directe shell-/runtime-bestandsuitvoeringen bindt OpenClaw ook naar beste vermogen één concreet lokaal
  bestandsoperand en weigert de run als dat bestand vóór uitvoering wijzigt.
- Als OpenClaw niet precies één concreet lokaal bestand kan identificeren voor een interpreter-/runtime-commando,
  wordt uitvoering met goedkeuring geweigerd in plaats van volledige runtime-dekking te veinzen. Gebruik sandboxing,
  aparte hosts, of een expliciete vertrouwde allowlist/volledige workflow voor bredere interpreter-semantiek.

### Start een Node-host (foreground)

Op de Node-machine:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Remote Gateway via SSH-tunnel (loopback-bind)

Als de Gateway bindt aan loopback (`gateway.bind=loopback`, standaard in lokale modus),
kunnen remote Node-hosts niet direct verbinden. Maak een SSH-tunnel en wijs de
Node-host naar het lokale uiteinde van de tunnel.

Voorbeeld (Node-host -> Gateway-host):

```bash
# Terminal A (laten draaien): stuur lokale 18790 door -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exporteer het Gateway-token en verbind via de tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notities:

- `openclaw node run` ondersteunt token- of wachtwoordauthenticatie.
- Env vars hebben de voorkeur: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config-fallback is `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus negeert de Node-host bewust `gateway.remote.token` / `gateway.remote.password`.
- In remote modus komen `gateway.remote.token` / `gateway.remote.password` in aanmerking volgens de remote voorrangsregels.
- Als actieve lokale `gateway.auth.*` SecretRefs zijn geconfigureerd maar niet kunnen worden opgelost, faalt Node-host-auth gesloten.
- Auth-resolutie voor Node-hosts respecteert alleen `OPENCLAW_GATEWAY_*` env vars.

### Start een Node-host (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Koppel + benoem

Op de Gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Als de Node opnieuw probeert met gewijzigde auth-details, voer `openclaw devices list`
opnieuw uit en keur de huidige `requestId` goed.

Naamgevingsopties:

- `--display-name` op `openclaw node run` / `openclaw node install` (blijft staan in `~/.openclaw/node.json` op de Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (Gateway-override).

### Zet de commando’s op de allowlist

Exec-goedkeuringen zijn **per Node-host**. Voeg allowlist-items toe vanaf de Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Goedkeuringen staan op de Node-host in `~/.openclaw/exec-approvals.json`.

### Richt exec op de Node

Configureer standaardwaarden (Gateway-config):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Of per sessie:

```
/exec host=node security=allowlist node=<id-or-name>
```

Eenmaal ingesteld draait elke `exec`-aanroep met `host=node` op de Node-host (afhankelijk van de
Node-allowlist/goedkeuringen).

`host=auto` kiest niet impliciet zelf de Node, maar een expliciet per-call `host=node`-verzoek is toegestaan vanuit `auto`. Als je Node-exec de standaard voor de sessie wilt maken, stel dan expliciet `tools.exec.host=node` of `/exec host=node ...` in.

Gerelateerd:

- [Node-host-CLI](/nl/cli/node)
- [Exec-tool](/nl/tools/exec)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)

## Commando’s aanroepen

Laag niveau (ruwe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Er bestaan helpers op hoger niveau voor de gangbare workflows “geef de agent een MEDIA-bijlage”.

## Commandobeleid

Node-commando’s moeten twee controles doorstaan voordat ze kunnen worden aangeroepen:

1. De Node moet het commando declareren in zijn WebSocket-`connect.commands`-lijst.
2. Het platformbeleid van de Gateway moet het gedeclareerde commando toestaan.

Windows- en macOS-begeleidings-Nodes staan standaard veilige gedeclareerde commando’s toe, zoals
`canvas.*`, `camera.list`, `location.get` en `screen.snapshot`.
Gevaarlijke of privacygevoelige commando’s zoals `camera.snap`, `camera.clip` en
`screen.record` vereisen nog steeds expliciete opt-in met
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` wint altijd van
standaardwaarden en extra allowlist-items.

Plugin-beheerde Node-commando’s kunnen een Gateway-beleid voor Node-invoke toevoegen. Dat beleid
draait na de allowlist-controle en vóór doorsturen naar de Node, zodat ruwe
`node.invoke`, CLI-helpers en specifieke agent-tools dezelfde Plugin-
toestemmingsgrens delen. Gevaarlijke Plugin-Node-commando’s vereisen nog steeds expliciete
`gateway.nodes.allowCommands`-opt-in.

Nadat een Node zijn gedeclareerde commandolijst wijzigt, wijs je de oude apparaatkoppeling af
en keur je het nieuwe verzoek goed zodat de Gateway de bijgewerkte commandosnapshot opslaat.

## Schermafbeeldingen (canvas-snapshots)

Als de Node de Canvas (WebView) toont, retourneert `canvas.snapshot` `{ format, base64 }`.

CLI-helper (schrijft naar een tijdelijk bestand en print `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas-bediening

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notities:

- `canvas present` accepteert URL’s of lokale bestandspaden (`--target`), plus optioneel `--x/--y/--width/--height` voor positionering.
- `canvas eval` accepteert inline JS (`--js`) of een positioneel argument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notities:

- Alleen A2UI v0.8 JSONL wordt ondersteund (v0.9/createSurface wordt geweigerd).

## Foto’s + video’s (Node-camera)

Foto’s (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notities:

- De Node moet **op de voorgrond staan** voor `canvas.*` en `camera.*` (achtergrondaanroepen retourneren `NODE_BACKGROUND_UNAVAILABLE`).
- Clipduur wordt begrensd (momenteel `<= 60s`) om te grote base64-payloads te vermijden.
- Android vraagt waar mogelijk om `CAMERA`/`RECORD_AUDIO`-toestemmingen; geweigerde toestemmingen falen met `*_PERMISSION_REQUIRED`.

## Schermopnamen (Nodes)

Ondersteunde Nodes stellen `screen.record` beschikbaar (mp4). Voorbeeld:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notities:

- Beschikbaarheid van `screen.record` hangt af van het Node-platform.
- Schermopnamen worden begrensd op `<= 60s`.
- `--no-audio` schakelt microfoonopname uit op ondersteunde platforms.
- Gebruik `--screen <index>` om een display te selecteren wanneer meerdere schermen beschikbaar zijn.

## Locatie (Nodes)

Nodes stellen `location.get` beschikbaar wanneer Locatie is ingeschakeld in de instellingen.

CLI-helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notities:

- Locatie staat **standaard uit**.
- “Altijd” vereist systeemtoestemming; ophalen op de achtergrond is best-effort.
- De response bevat lat/lon, nauwkeurigheid (meters) en timestamp.

## SMS (Android-Nodes)

Android-Nodes kunnen `sms.send` beschikbaar stellen wanneer de gebruiker **SMS**-toestemming verleent en het apparaat telefonie ondersteunt.

Laag-niveauaanroep:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notities:

- De toestemmingsprompt moet op het Android-apparaat worden geaccepteerd voordat de capability wordt geadverteerd.
- Apparaten zonder telefonie die alleen Wi-Fi hebben, adverteren `sms.send` niet.

## Android-apparaat + commando’s voor persoonlijke gegevens

Android-Nodes kunnen aanvullende commandofamilies adverteren wanneer de bijbehorende capabilities zijn ingeschakeld.

Beschikbare families:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Voorbeeldaanroepen:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Opmerkingen:

- Bewegingsopdrachten worden op basis van capabilities beperkt door beschikbare sensoren.

## Systeemopdrachten (nodehost / Mac-node)

De macOS-node stelt `system.run`, `system.notify` en `system.execApprovals.get/set` beschikbaar.
De headless nodehost stelt `system.run`, `system.which` en `system.execApprovals.get/set` beschikbaar.

Voorbeelden:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Opmerkingen:

- `system.run` retourneert stdout/stderr/exitcode in de payload.
- Shelluitvoering loopt nu via de `exec`-tool met `host=node`; `nodes` blijft het directe RPC-oppervlak voor expliciete node-opdrachten.
- `nodes invoke` stelt `system.run` of `system.run.prepare` niet beschikbaar; die blijven alleen op het exec-pad.
- Het exec-pad bereidt vóór goedkeuring een canoniek `systemRunPlan` voor. Zodra een
  goedkeuring is verleend, stuurt de gateway dat opgeslagen plan door, niet eventuele later
  door de aanroeper bewerkte opdracht-/cwd-/sessievelden.
- `system.notify` respecteert de status van notificatierechten in de macOS-app.
- Onbekende node-metadata voor `platform` / `deviceFamily` gebruikt een conservatieve standaardtoelatingslijst die `system.run` en `system.which` uitsluit. Als je die opdrachten bewust nodig hebt voor een onbekend platform, voeg ze dan expliciet toe via `gateway.nodes.allowCommands`.
- `system.run` ondersteunt `--cwd`, `--env KEY=VAL`, `--command-timeout` en `--needs-screen-recording`.
- Voor shellwrappers (`bash|sh|zsh ... -c/-lc`) worden request-scoped `--env`-waarden teruggebracht tot een expliciete toelatingslijst (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Voor altijd-toestaan-beslissingen in allowlist-modus blijven bij bekende dispatch-wrappers (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) de paden van de interne uitvoerbare bestanden bewaard in plaats van de wrapperpaden. Als uitpakken niet veilig is, wordt er niet automatisch een allowlist-vermelding bewaard.
- Op Windows-nodehosts in allowlist-modus vereisen shellwrapper-runs via `cmd.exe /c` goedkeuring (alleen een allowlist-vermelding staat de wrapper-vorm niet automatisch toe).
- `system.notify` ondersteunt `--priority <passive|active|timeSensitive>` en `--delivery <system|overlay|auto>`.
- Nodehosts negeren `PATH`-overschrijvingen en verwijderen gevaarlijke startup-/shellsleutels (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Als je extra PATH-vermeldingen nodig hebt, configureer dan de serviceomgeving van de nodehost (of installeer tools op standaardlocaties) in plaats van `PATH` via `--env` door te geven.
- In macOS-nodemodus wordt `system.run` beperkt door exec-goedkeuringen in de macOS-app (Instellingen → Exec-goedkeuringen).
  Vragen/allowlist/volledig werken hetzelfde als bij de headless nodehost; geweigerde prompts retourneren `SYSTEM_RUN_DENIED`.
- Op de headless nodehost wordt `system.run` beperkt door exec-goedkeuringen (`~/.openclaw/exec-approvals.json`).

## Exec-nodekoppeling

Wanneer meerdere nodes beschikbaar zijn, kun je exec aan een specifieke node koppelen.
Dit stelt de standaardnode in voor `exec host=node` (en kan per agent worden overschreven).

Globale standaard:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Overschrijving per agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Verwijder de instelling om elke node toe te staan:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Machtigingenkaart

Nodes kunnen een `permissions`-kaart bevatten in `node.list` / `node.describe`, geïndexeerd op machtigingsnaam (bijv. `screenRecording`, `accessibility`) met booleaanse waarden (`true` = verleend).

## Headless nodehost (cross-platform)

OpenClaw kan een **headless nodehost** (geen UI) uitvoeren die verbinding maakt met de Gateway
WebSocket en `system.run` / `system.which` beschikbaar stelt. Dit is nuttig op Linux/Windows
of om een minimale node naast een server uit te voeren.

Start deze:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opmerkingen:

- Koppeling is nog steeds vereist (de Gateway toont een prompt voor apparaatkoppeling).
- De nodehost slaat zijn node-id, token, weergavenaam en Gateway-verbindingsgegevens op in `~/.openclaw/node.json`.
- Exec-goedkeuringen worden lokaal afgedwongen via `~/.openclaw/exec-approvals.json`
  (zie [Exec-goedkeuringen](/nl/tools/exec-approvals)).
- Op macOS voert de headless nodehost `system.run` standaard lokaal uit. Stel
  `OPENCLAW_NODE_EXEC_HOST=app` in om `system.run` via de exec-host van de companion-app te routeren; voeg
  `OPENCLAW_NODE_EXEC_FALLBACK=0` toe om de app-host verplicht te stellen en gesloten te falen als die niet beschikbaar is.
- Voeg `--tls` / `--tls-fingerprint` toe wanneer de Gateway WS TLS gebruikt.

## Mac-nodemodus

- De macOS-menubalkapp maakt verbinding met de Gateway WS-server als een node (zodat `openclaw nodes …` tegen deze Mac werkt).
- In externe modus opent de app een SSH-tunnel voor de Gateway-poort en maakt verbinding met `localhost`.
