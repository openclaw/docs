---
read_when:
    - iOS/Android-nodes koppelen aan een Gateway
    - Node-canvas/camera gebruiken voor de context van de agent
    - Nieuwe Node-opdrachten of CLI-helpers toevoegen
summary: 'Nodes: koppeling, mogelijkheden, machtigingen en CLI-helpers voor canvas/camera/scherm/apparaat/meldingen/systeem'
title: Nodes
x-i18n:
    generated_at: "2026-05-06T09:22:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

Een **node** is een begeleidend apparaat (macOS/iOS/Android/headless) dat verbinding maakt met de Gateway **WebSocket** (dezelfde poort als operators) met `role: "node"` en een opdrachtoppervlak aanbiedt (bijv. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Protocoldetails: [Gateway-protocol](/nl/gateway/protocol).

Legacy transport: [Bridge-protocol](/nl/gateway/bridge-protocol) (TCP JSONL;
alleen historisch voor huidige nodes).

macOS kan ook in **nodemodus** draaien: de menubalk-app maakt verbinding met de WS-server van de Gateway en biedt zijn lokale canvas-/camera-opdrachten als node aan (zodat `openclaw nodes …` werkt tegen deze Mac). In externe gatewaymodus wordt browserautomatisering afgehandeld door de CLI-nodehost (`openclaw node run` of de geïnstalleerde nodeservice), niet door de native app-node.

Opmerkingen:

- Nodes zijn **randapparaten**, geen gateways. Ze voeren de gatewayservice niet uit.
- Telegram/WhatsApp/enz. berichten komen binnen op de **gateway**, niet op nodes.
- Runbook voor probleemoplossing: [/nodes/troubleshooting](/nl/nodes/troubleshooting)

## Koppelen + status

**WS-nodes gebruiken apparaatkoppeling.** Nodes presenteren een apparaatidentiteit tijdens `connect`; de Gateway maakt een apparaatkoppelingsaanvraag voor `role: node`. Keur goed via de apparaten-CLI (of UI).

Snelle CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Als een node opnieuw probeert met gewijzigde auth-gegevens (rol/scopes/openbare sleutel), wordt de eerdere openstaande aanvraag vervangen en wordt een nieuwe `requestId` aangemaakt. Voer `openclaw devices list` opnieuw uit voordat je goedkeurt.

Opmerkingen:

- `nodes status` markeert een node als **gekoppeld** wanneer de apparaatkoppelingsrol `node` bevat.
- Het apparaatkoppelingsrecord is het duurzame contract voor goedgekeurde rollen. Tokenrotatie blijft binnen dat contract; het kan een gekoppelde node niet upgraden naar een andere rol waarvoor koppelingsgoedkeuring nooit is verleend.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) is een afzonderlijke gateway-eigen nodekoppelingsopslag; het blokkeert de WS-`connect`-handshake **niet**.
- `openclaw nodes remove --node <id|name|ip>` verwijdert verouderde vermeldingen uit die afzonderlijke gateway-eigen nodekoppelingsopslag.
- Het goedkeuringsbereik volgt de gedeclareerde opdrachten van de openstaande aanvraag:
  - aanvraag zonder opdrachten: `operator.pairing`
  - node-opdrachten zonder exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Externe nodehost (system.run)

Gebruik een **nodehost** wanneer je Gateway op de ene machine draait en je opdrachten op een andere wilt uitvoeren. Het model praat nog steeds met de **gateway**; de gateway stuurt `exec`-aanroepen door naar de **nodehost** wanneer `host=node` is geselecteerd.

### Wat waar draait

- **Gatewayhost**: ontvangt berichten, voert het model uit, routeert toolaanroepen.
- **Nodehost**: voert `system.run`/`system.which` uit op de nodemachine.
- **Goedkeuringen**: afgedwongen op de nodehost via `~/.openclaw/exec-approvals.json`.

Opmerking over goedkeuring:

- Node-uitvoeringen met goedkeuring binden de exacte aanvraagcontext.
- Voor directe shell-/runtime-bestandsuitvoeringen bindt OpenClaw ook best-effort één concrete lokale bestandsoperand en weigert het de uitvoering als dat bestand vóór uitvoering verandert.
- Als OpenClaw niet precies één concreet lokaal bestand voor een interpreter-/runtime-opdracht kan identificeren, wordt uitvoering met goedkeuring geweigerd in plaats van volledige runtimedekking voor te wenden. Gebruik sandboxing, afzonderlijke hosts of een expliciete vertrouwde allowlist/volledige workflow voor bredere interpretersemantiek.

### Een nodehost starten (voorgrond)

Op de nodemachine:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Externe gateway via SSH-tunnel (loopback-binding)

Als de Gateway aan loopback bindt (`gateway.bind=loopback`, standaard in lokale modus), kunnen externe nodehosts niet rechtstreeks verbinden. Maak een SSH-tunnel en wijs de nodehost naar het lokale uiteinde van de tunnel.

Voorbeeld (nodehost -> gatewayhost):

```bash
# Terminal A (laten draaien): forward lokale 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exporteer het gatewaytoken en verbind via de tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Opmerkingen:

- `openclaw node run` ondersteunt token- of wachtwoordauthenticatie.
- Env vars hebben de voorkeur: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config-fallback is `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus negeert de nodehost bewust `gateway.remote.token` / `gateway.remote.password`.
- In externe modus komen `gateway.remote.token` / `gateway.remote.password` in aanmerking volgens de externe prioriteitsregels.
- Als actieve lokale `gateway.auth.*` SecretRefs zijn geconfigureerd maar niet opgelost, faalt nodehost-auth gesloten.
- Nodehost-authoplossing respecteert alleen `OPENCLAW_GATEWAY_*` env vars.

### Een nodehost starten (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Koppelen + naam geven

Op de gatewayhost:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Als de node opnieuw probeert met gewijzigde auth-gegevens, voer `openclaw devices list` opnieuw uit en keur de huidige `requestId` goed.

Naamgevingsopties:

- `--display-name` op `openclaw node run` / `openclaw node install` (blijft bewaard in `~/.openclaw/node.json` op de node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway-override).

### De opdrachten op de allowlist zetten

Exec-goedkeuringen zijn **per nodehost**. Voeg allowlist-vermeldingen toe vanaf de gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Goedkeuringen staan op de nodehost in `~/.openclaw/exec-approvals.json`.

### Exec naar de node wijzen

Configureer standaardwaarden (gatewayconfig):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Of per sessie:

```
/exec host=node security=allowlist node=<id-or-name>
```

Zodra dit is ingesteld, draait elke `exec`-aanroep met `host=node` op de nodehost (onderworpen aan de node-allowlist/goedkeuringen).

`host=auto` kiest niet impliciet uit zichzelf de node, maar een expliciete per-call `host=node`-aanvraag is toegestaan vanuit `auto`. Als je node-exec de standaard voor de sessie wilt maken, stel dan expliciet `tools.exec.host=node` of `/exec host=node ...` in.

Gerelateerd:

- [Nodehost-CLI](/nl/cli/node)
- [Exec-tool](/nl/tools/exec)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)

## Opdrachten aanroepen

Laag niveau (ruwe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Er bestaan helpers op hoger niveau voor de gangbare workflows "geef de agent een MEDIA-bijlage".

## Opdrachtbeleid

Node-opdrachten moeten twee controles doorstaan voordat ze kunnen worden aangeroepen:

1. De node moet de opdracht declareren in zijn WebSocket-`connect.commands`-lijst.
2. Het platformbeleid van de gateway moet de gedeclareerde opdracht toestaan.

Windows- en macOS-begeleidende nodes staan standaard veilige gedeclareerde opdrachten toe, zoals `canvas.*`, `camera.list`, `location.get` en `screen.snapshot`. Vertrouwde nodes die de `talk`-capability adverteren of `talk.*`-opdrachten declareren, staan standaard ook gedeclareerde push-to-talk-opdrachten toe (`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`), onafhankelijk van het platformlabel. Gevaarlijke of privacygevoelige opdrachten zoals `camera.snap`, `camera.clip` en `screen.record` vereisen nog steeds expliciete opt-in met `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` wint altijd van standaardwaarden en extra allowlist-vermeldingen.

Plugin-eigen node-opdrachten kunnen een Gateway-node-invoke-beleid toevoegen. Dat beleid draait na de allowlist-controle en vóór het doorsturen naar de node, zodat ruwe `node.invoke`, CLI-helpers en dedicated agent-tools dezelfde Plugin-toestemmingsgrens delen. Gevaarlijke Plugin-node-opdrachten vereisen nog steeds expliciete `gateway.nodes.allowCommands`-opt-in.

Nadat een node zijn gedeclareerde opdrachtenlijst wijzigt, wijs je de oude apparaatkoppeling af en keur je de nieuwe aanvraag goed, zodat de gateway de bijgewerkte opdrachtensnapshot opslaat.

## Schermafbeeldingen (canvas-snapshots)

Als de node de Canvas (WebView) toont, retourneert `canvas.snapshot` `{ format, base64 }`.

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

Opmerkingen:

- `canvas present` accepteert URL's of lokale bestandspaden (`--target`), plus optioneel `--x/--y/--width/--height` voor positionering.
- `canvas eval` accepteert inline JS (`--js`) of een positioneel argument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Opmerkingen:

- Alleen A2UI v0.8 JSONL wordt ondersteund (v0.9/createSurface wordt geweigerd).

## Foto's + video's (nodecamera)

Foto's (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: beide richtingen (2 MEDIA-regels)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Opmerkingen:

- De node moet **op de voorgrond staan** voor `canvas.*` en `camera.*` (achtergrondaanroepen retourneren `NODE_BACKGROUND_UNAVAILABLE`).
- Clipduur wordt begrensd (momenteel `<= 60s`) om te grote base64-payloads te voorkomen.
- Android vraagt waar mogelijk om `CAMERA`/`RECORD_AUDIO`-machtigingen; geweigerde machtigingen falen met `*_PERMISSION_REQUIRED`.

## Schermopnamen (nodes)

Ondersteunde nodes bieden `screen.record` (mp4). Voorbeeld:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Opmerkingen:

- Beschikbaarheid van `screen.record` hangt af van het nodeplatform.
- Schermopnamen worden begrensd tot `<= 60s`.
- `--no-audio` schakelt microfoonopname uit op ondersteunde platforms.
- Gebruik `--screen <index>` om een scherm te selecteren wanneer meerdere schermen beschikbaar zijn.

## Locatie (nodes)

Nodes bieden `location.get` wanneer Locatie is ingeschakeld in de instellingen.

CLI-helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Opmerkingen:

- Locatie staat **standaard uit**.
- "Altijd" vereist systeemmachtiging; ophalen op de achtergrond gebeurt best-effort.
- Het antwoord bevat lat/lon, nauwkeurigheid (meters) en tijdstempel.

## SMS (Android-nodes)

Android-nodes kunnen `sms.send` aanbieden wanneer de gebruiker **SMS**-machtiging verleent en het apparaat telefonie ondersteunt.

Laag-niveau aanroep:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Opmerkingen:

- De machtigingsprompt moet op het Android-apparaat worden geaccepteerd voordat de capability wordt geadverteerd.
- Apparaten zonder telefonie die alleen Wi-Fi ondersteunen, adverteren `sms.send` niet.

## Android-apparaat + opdrachten voor persoonlijke gegevens

Android-nodes kunnen extra opdrachtfamilies adverteren wanneer de bijbehorende capabilities zijn ingeschakeld.

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

- Bewegingsopdrachten worden via mogelijkheden beperkt op basis van beschikbare sensoren.

## Systeemopdrachten (Node-host / Mac-Node)

De macOS-Node biedt `system.run`, `system.notify` en `system.execApprovals.get/set`.
De headless Node-host biedt `system.run`, `system.which` en `system.execApprovals.get/set`.

Voorbeelden:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Opmerkingen:

- `system.run` retourneert stdout/stderr/exitcode in de payload.
- Shelluitvoering loopt nu via de `exec`-tool met `host=node`; `nodes` blijft het directe RPC-oppervlak voor expliciete Node-opdrachten.
- `nodes invoke` stelt `system.run` of `system.run.prepare` niet beschikbaar; die blijven alleen op het exec-pad.
- Het exec-pad bereidt vóór goedkeuring een canoniek `systemRunPlan` voor. Zodra een
  goedkeuring is verleend, stuurt de Gateway dat opgeslagen plan door, niet eventuele later
  door de aanroeper bewerkte opdracht-/cwd-/sessievelden.
- `system.notify` respecteert de status van de meldingsmachtiging in de macOS-app.
- Niet-herkende Node-`platform`- / `deviceFamily`-metadata gebruikt een conservatieve standaardtoestemmingslijst die `system.run` en `system.which` uitsluit. Als je die opdrachten bewust nodig hebt voor een onbekend platform, voeg ze dan expliciet toe via `gateway.nodes.allowCommands`.
- `system.run` ondersteunt `--cwd`, `--env KEY=VAL`, `--command-timeout` en `--needs-screen-recording`.
- Voor shellwrappers (`bash|sh|zsh ... -c/-lc`) worden aanvraaggebonden `--env`-waarden teruggebracht tot een expliciete toestemmingslijst (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Voor altijd-toestaan-beslissingen in toestemmingslijstmodus bewaren bekende dispatch-wrappers (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) de paden van de interne uitvoerbare bestanden in plaats van de wrapperpaden. Als uitpakken niet veilig is, wordt er automatisch geen toestemmingslijstitem bewaard.
- Op Windows-Node-hosts in toestemmingslijstmodus vereisen shellwrapperuitvoeringen via `cmd.exe /c` goedkeuring (alleen een toestemmingslijstitem staat de wrappervorm niet automatisch toe).
- `system.notify` ondersteunt `--priority <passive|active|timeSensitive>` en `--delivery <system|overlay|auto>`.
- Node-hosts negeren `PATH`-overschrijvingen en strippen gevaarlijke opstart-/shellsleutels (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Als je extra PATH-vermeldingen nodig hebt, configureer dan de serviceomgeving van de Node-host (of installeer tools op standaardlocaties) in plaats van `PATH` via `--env` door te geven.
- In macOS-Node-modus wordt `system.run` beperkt door exec-goedkeuringen in de macOS-app (Instellingen → Exec-goedkeuringen).
  Vragen/toestemmingslijst/volledig gedragen zich hetzelfde als de headless Node-host; geweigerde prompts retourneren `SYSTEM_RUN_DENIED`.
- Op een headless Node-host wordt `system.run` beperkt door exec-goedkeuringen (`~/.openclaw/exec-approvals.json`).

## Exec-Node-binding

Wanneer er meerdere Nodes beschikbaar zijn, kun je exec aan een specifieke Node binden.
Dit stelt de standaard-Node in voor `exec host=node` (en kan per agent worden overschreven).

Globale standaard:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Overschrijving per agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Maak ongedaan om elke Node toe te staan:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Machtigingenmap

Nodes kunnen een `permissions`-map opnemen in `node.list` / `node.describe`, geïndexeerd op machtigingsnaam (bijv. `screenRecording`, `accessibility`) met booleaanse waarden (`true` = verleend).

## Headless Node-host (platformoverschrijdend)

OpenClaw kan een **headless Node-host** uitvoeren (geen UI) die verbinding maakt met de Gateway-
WebSocket en `system.run` / `system.which` beschikbaar stelt. Dit is nuttig op Linux/Windows
of om een minimale Node naast een server uit te voeren.

Start deze:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opmerkingen:

- Koppeling is nog steeds vereist (de Gateway toont een prompt voor apparaatkoppeling).
- De Node-host slaat de Node-id, het token, de weergavenaam en de Gateway-verbindingsgegevens op in `~/.openclaw/node.json`.
- Exec-goedkeuringen worden lokaal afgedwongen via `~/.openclaw/exec-approvals.json`
  (zie [Exec-goedkeuringen](/nl/tools/exec-approvals)).
- Op macOS voert de headless Node-host standaard `system.run` lokaal uit. Stel
  `OPENCLAW_NODE_EXEC_HOST=app` in om `system.run` via de exec-host van de companion-app te routeren; voeg
  `OPENCLAW_NODE_EXEC_FALLBACK=0` toe om de app-host te vereisen en gesloten te falen als deze niet beschikbaar is.
- Voeg `--tls` / `--tls-fingerprint` toe wanneer de Gateway-WS TLS gebruikt.

## Mac-Node-modus

- De macOS-menubalkapp maakt verbinding met de Gateway-WS-server als een Node (zodat `openclaw nodes …` werkt voor deze Mac).
- In externe modus opent de app een SSH-tunnel voor de Gateway-poort en maakt verbinding met `localhost`.
