---
read_when:
    - iOS-/Android-nodes koppelen aan een gateway
    - Node-canvas/camera gebruiken voor agentcontext
    - Nieuwe node-opdrachten of CLI-helpers toevoegen
summary: 'Nodes: koppelen, mogelijkheden, machtigingen en CLI-hulpmiddelen voor canvas/camera/scherm/apparaat/meldingen/systeem'
title: Nodes
x-i18n:
    generated_at: "2026-06-27T17:45:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

Een **node** is een begeleidend apparaat (macOS/iOS/Android/headless) dat verbinding maakt met de Gateway **WebSocket** (dezelfde poort als operators) met `role: "node"` en een commandosurface beschikbaar maakt (bijv. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Protocoldetails: [Gateway-protocol](/nl/gateway/protocol).

Verouderd transport: [Bridge-protocol](/nl/gateway/bridge-protocol) (TCP JSONL;
alleen historisch voor huidige nodes).

macOS kan ook in **node-modus** draaien: de menubalk-app maakt verbinding met de
WS-server van de Gateway en stelt zijn lokale canvas-/camera-commando's beschikbaar als een node (zodat
`openclaw nodes …` werkt tegen deze Mac). In externe gatewaymodus wordt browserautomatisering
afgehandeld door de CLI-nodehost (`openclaw node run` of de
geïnstalleerde nodeservice), niet door de native app-node.

Opmerkingen:

- Nodes zijn **randapparaten**, geen gateways. Ze draaien de gatewayservice niet.
- Telegram/WhatsApp/etc.-berichten komen binnen op de **gateway**, niet op nodes.
- Runbook voor probleemoplossing: [/nodes/troubleshooting](/nl/nodes/troubleshooting)

## Koppelen + status

**WS-nodes gebruiken apparaatkoppeling.** Nodes presenteren een apparaatidentiteit tijdens `connect`; de Gateway
maakt een apparaatkoppelingsverzoek aan voor `role: node`. Keur goed via de apparaten-CLI (of UI).

Snelle CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Als een node opnieuw probeert met gewijzigde auth-gegevens (rol/scopes/publieke sleutel), wordt het eerdere
openstaande verzoek vervangen en wordt een nieuwe `requestId` aangemaakt. Voer
`openclaw devices list` opnieuw uit voordat je goedkeurt.

Opmerkingen:

- `nodes status` markeert een node als **gekoppeld** wanneer de rol voor apparaatkoppeling `node` bevat.
- Het record voor apparaatkoppeling is het duurzame contract voor goedgekeurde rollen. Tokenrotatie
  blijft binnen dat contract; het kan een gekoppelde node niet upgraden naar een
  andere rol waarvoor de koppelingsgoedkeuring nooit toestemming gaf.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) is een aparte, door de gateway beheerde
  nodekoppelingsopslag; deze blokkeert de WS-`connect`-handshake **niet**.
- `openclaw nodes remove --node <id|name|ip>` verwijdert een nodekoppeling. Voor een
  apparaatgebaseerde node trekt dit de `node`-rol van het apparaat in `devices/paired.json`
  in en verbreekt het de node-rolsessies van dat apparaat — een apparaat met gemengde rollen behoudt
  zijn rij en verliest alleen de `node`-rol, terwijl een rij voor een apparaat met alleen een node-rol
  wordt verwijderd. Het wist ook elke overeenkomende vermelding uit de aparte, door de gateway beheerde nodekoppelingsopslag.
  `operator.pairing` mag niet-operator-noderijen verwijderen; een
  device-token-aanroeper die zijn eigen node-rol op een apparaat met gemengde rollen intrekt,
  heeft daarnaast `operator.admin` nodig.
- Goedkeuringsscope volgt de gedeclareerde commando's van het openstaande verzoek:
  - verzoek zonder commando's: `operator.pairing`
  - niet-exec-nodecommando's: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Externe nodehost (system.run)

Gebruik een **nodehost** wanneer je Gateway op de ene machine draait en je commando's
op een andere wilt uitvoeren. Het model praat nog steeds met de **gateway**; de gateway
stuurt `exec`-aanroepen door naar de **nodehost** wanneer `host=node` is geselecteerd.

### Wat draait waar

- **Gateway-host**: ontvangt berichten, draait het model, routeert toolaanroepen.
- **Nodehost**: voert `system.run`/`system.which` uit op de nodemachine.
- **Goedkeuringen**: afgedwongen op de nodehost via `~/.openclaw/exec-approvals.json`.

Goedkeuringsopmerking:

- Node-runs met goedkeuring binden de exacte verzoekcontext.
- Voor directe shell-/runtime-bestandsuitvoeringen bindt OpenClaw ook naar beste kunnen één concreet lokaal
  bestandsoperand en weigert de run als dat bestand vóór uitvoering wijzigt.
- Als OpenClaw niet exact één concreet lokaal bestand kan identificeren voor een interpreter-/runtime-commando,
  wordt uitvoering met goedkeuring geweigerd in plaats van te doen alsof volledige runtimedekking bestaat. Gebruik sandboxing,
  aparte hosts, of een expliciete vertrouwde allowlist/volledige workflow voor bredere interpretersemantiek.

### Een nodehost starten (voorgrond)

Op de nodemachine:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Externe gateway via SSH-tunnel (loopback-bind)

Als de Gateway aan loopback bindt (`gateway.bind=loopback`, standaard in lokale modus),
kunnen externe nodehosts niet rechtstreeks verbinden. Maak een SSH-tunnel en wijs de
nodehost naar het lokale einde van de tunnel.

Voorbeeld (nodehost -> gatewayhost):

```bash
# Terminal A (laten draaien): stuur lokale 18790 door -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exporteer het gatewaytoken en verbind via de tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Opmerkingen:

- `openclaw node run` ondersteunt authenticatie met token of wachtwoord.
- Env-vars hebben de voorkeur: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config-fallback is `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus negeert de nodehost bewust `gateway.remote.token` / `gateway.remote.password`.
- In externe modus komen `gateway.remote.token` / `gateway.remote.password` in aanmerking volgens externe prioriteitsregels.
- Als actieve lokale `gateway.auth.*` SecretRefs zijn geconfigureerd maar niet opgelost, faalt nodehost-auth fail-closed.
- Nodehost-authresolutie respecteert alleen `OPENCLAW_GATEWAY_*` env-vars.

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

Als de node opnieuw probeert met gewijzigde auth-gegevens, voer dan `openclaw devices list`
opnieuw uit en keur de huidige `requestId` goed.

Naamgevingsopties:

- `--display-name` op `openclaw node run` / `openclaw node install` (blijft bewaard in `~/.openclaw/node.json` op de node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway-override).

### De commando's allowlisten

Exec-goedkeuringen zijn **per nodehost**. Voeg allowlist-vermeldingen toe vanaf de gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Goedkeuringen staan op de nodehost in `~/.openclaw/exec-approvals.json`.

### Exec naar de node laten wijzen

Configureer standaardwaarden (gatewayconfiguratie):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Of per sessie:

```
/exec host=node security=allowlist node=<id-or-name>
```

Zodra dit is ingesteld, draait elke `exec`-aanroep met `host=node` op de nodehost (onderhevig aan de
node-allowlist/goedkeuringen).

`host=auto` kiest niet impliciet uit zichzelf de node, maar een expliciet per-aanroepverzoek `host=node` is toegestaan vanuit `auto`. Als je wilt dat node-exec de standaard is voor de sessie, stel dan expliciet `tools.exec.host=node` of `/exec host=node ...` in.

Gerelateerd:

- [Nodehost-CLI](/nl/cli/node)
- [Exec-tool](/nl/tools/exec)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)

## Commando's aanroepen

Laag niveau (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Hogerniveauhelpers bestaan voor de veelvoorkomende workflows "geef de agent een MEDIA-bijlage".

## Commandobeleid

Nodecommando's moeten twee poorten passeren voordat ze kunnen worden aangeroepen:

1. De node moet het commando declareren in zijn WebSocket-`connect.commands`-lijst.
2. Het platformbeleid van de gateway moet het gedeclareerde commando toestaan.

Windows- en macOS-begeleidende nodes staan standaard veilige gedeclareerde commando's toe, zoals
`canvas.*`, `camera.list`, `location.get` en `screen.snapshot`.
Vertrouwde nodes die de `talk`-capability adverteren of `talk.*`-commando's declareren,
staan standaard ook gedeclareerde push-to-talk-commando's toe (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), onafhankelijk van het platformlabel.
Gevaarlijke of privacygevoelige commando's zoals `camera.snap`, `camera.clip` en
`screen.record` vereisen nog steeds expliciete opt-in met
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` wint altijd van
standaardwaarden en extra allowlist-vermeldingen.

Plugin-beheerde nodecommando's kunnen een Gateway node-invoke-beleid toevoegen. Dat beleid
draait na de allowlist-controle en vóór het doorsturen naar de node, zodat raw
`node.invoke`, CLI-helpers en specifieke agenttools dezelfde Plugin-toestemmingsgrens
delen. Gevaarlijke Plugin-nodecommando's vereisen nog steeds expliciete
`gateway.nodes.allowCommands`-opt-in.

Nadat een node zijn gedeclareerde commandolijst wijzigt, wijs je de oude apparaatkoppeling af
en keur je het nieuwe verzoek goed zodat de gateway de bijgewerkte commandosnapshot opslaat.

## Configuratie (`openclaw.json`)

Node-gerelateerde instellingen staan onder `gateway.nodes` en `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Keur eerste nodekoppeling vanaf vertrouwde netwerken automatisch goed (CIDR-lijst).
      // Uitgeschakeld wanneer niet ingesteld. Geldt alleen voor eerste role:node-verzoeken
      // zonder aangevraagde scopes; keurt upgrades niet automatisch goed.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt in voor gevaarlijke/privacygevoelige nodecommando's (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Blokkeer exacte commandonamen, zelfs als standaardwaarden of allowCommands ze bevatten.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Standaard exec-host: "node" routeert alle exec-aanroepen naar een gekoppelde node.
      host: "node",
      // Beveiligingsmodus voor node-exec: sta alleen goedgekeurde/geallowliste commando's toe.
      security: "allowlist",
      // Pin exec aan een specifieke node (id of naam). Laat weg om elke node toe te staan.
      node: "build-node",
    },
  },
}
```

Gebruik exacte nodecommandonamen. `denyCommands` verwijdert een commando zelfs wanneer een
platformstandaard of `allowCommands`-vermelding het anders zou toestaan. Zie
[Gateway-configuratiereferentie](/nl/gateway/configuration-reference#gateway-field-details)
voor velddetails over gateway-nodekoppeling en commandobeleid.

Per-agent node-override voor exec:

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

## Screenshots (canvassnapshots)

Als de node de Canvas (WebView) toont, retourneert `canvas.snapshot` `{ format, base64 }`.

CLI-helper (schrijft naar een tijdelijk bestand en print het opgeslagen pad):

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

- Mobiele nodes gebruiken een gebundelde app-beheerde A2UI-pagina voor rendering met acties.
- Alleen A2UI v0.8 JSONL wordt ondersteund (v0.9/createSurface wordt geweigerd).
- iOS en Android renderen externe Gateway Canvas-pagina's, maar A2UI-knopacties worden alleen verzonden vanaf de gebundelde app-beheerde A2UI-pagina. Door de Gateway gehoste HTTP/HTTPS A2UI-pagina's zijn alleen render-only op die mobiele clients.

## Foto's + video's (nodecamera)

Foto's (`jpg`):

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

Opmerkingen:

- De node moet **op de voorgrond actief zijn** voor `canvas.*` en `camera.*` (aanroepen op de achtergrond retourneren `NODE_BACKGROUND_UNAVAILABLE`).
- De clipduur wordt begrensd (momenteel `<= 60s`) om te grote base64-payloads te vermijden.
- Android vraagt waar mogelijk om `CAMERA`/`RECORD_AUDIO`-machtigingen; geweigerde machtigingen mislukken met `*_PERMISSION_REQUIRED`.

## Schermopnamen (nodes)

Ondersteunde nodes bieden `screen.record` (`mp4`). Voorbeeld:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Opmerkingen:

- Beschikbaarheid van `screen.record` hangt af van het nodeplatform.
- Schermopnamen worden begrensd tot `<= 60s`.
- `--no-audio` schakelt microfoonopname uit op ondersteunde platforms.
- Gebruik `--screen <index>` om een beeldscherm te selecteren wanneer er meerdere schermen beschikbaar zijn.

## Locatie (nodes)

Nodes bieden `location.get` wanneer Locatie is ingeschakeld in de instellingen.

CLI-helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Opmerkingen:

- Locatie is **standaard uitgeschakeld**.
- "Altijd" vereist systeemtoestemming; ophalen op de achtergrond gebeurt naar beste vermogen.
- De respons bevat lat/lon, nauwkeurigheid (meters) en tijdstempel.

## SMS (Android-nodes)

Android-nodes kunnen `sms.send` beschikbaar maken wanneer de gebruiker **SMS**-toestemming verleent en het apparaat telefonie ondersteunt.

Low-level aanroep:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Opmerkingen:

- De toestemmingsprompt moet op het Android-apparaat worden geaccepteerd voordat de capability wordt geadverteerd.
- Apparaten met alleen wifi zonder telefonie adverteren `sms.send` niet.

## Android-apparaat + opdrachten voor persoonlijke gegevens

Android-nodes kunnen aanvullende commandofamilies adverteren wanneer de bijbehorende capabilities zijn ingeschakeld.

Beschikbare families:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` wanneer delen van geïnstalleerde apps is ingeschakeld in Android-instellingen
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
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Opmerkingen:

- `device.apps` is opt-in en retourneert standaard apps die zichtbaar zijn in de launcher.
- Bewegingsopdrachten worden door capabilities afgeschermd op basis van beschikbare sensoren.

## Systeemopdrachten (node-host / mac-node)

De macOS-node biedt `system.run`, `system.notify` en `system.execApprovals.get/set`.
De headless node-host biedt `system.run`, `system.which` en `system.execApprovals.get/set`.

Voorbeelden:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Opmerkingen:

- `system.run` retourneert stdout/stderr/exitcode in de payload.
- Shelluitvoering verloopt nu via de `exec`-tool met `host=node`; `nodes` blijft het directe RPC-oppervlak voor expliciete node-opdrachten.
- `nodes invoke` stelt `system.run` of `system.run.prepare` niet beschikbaar; die blijven alleen op het exec-pad.
- Het exec-pad bereidt vóór goedkeuring een canoniek `systemRunPlan` voor. Zodra een
  goedkeuring is verleend, stuurt de gateway dat opgeslagen plan door, niet eventuele later
  door de aanroeper bewerkte command-/cwd-/session-velden.
- `system.notify` respecteert de meldingsmachtigingsstatus in de macOS-app.
- Niet-herkende node-`platform`- / `deviceFamily`-metadata gebruikt een conservatieve standaard-allowlist die `system.run` en `system.which` uitsluit. Als je die opdrachten bewust nodig hebt voor een onbekend platform, voeg ze dan expliciet toe via `gateway.nodes.allowCommands`.
- `system.run` ondersteunt `--cwd`, `--env KEY=VAL`, `--command-timeout` en `--needs-screen-recording`.
- Voor shell-wrappers (`bash|sh|zsh ... -c/-lc`) worden request-gebonden `--env`-waarden beperkt tot een expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Voor altijd-toestaan-beslissingen in allowlist-modus bewaren bekende dispatch-wrappers (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) de paden van interne executables in plaats van wrapper-paden. Als uitpakken niet veilig is, wordt er niet automatisch een allowlist-vermelding opgeslagen.
- Op Windows-node-hosts in allowlist-modus vereisen shell-wrapper-runs via `cmd.exe /c` goedkeuring (alleen een allowlist-vermelding staat de wrapper-vorm niet automatisch toe).
- `system.notify` ondersteunt `--priority <passive|active|timeSensitive>` en `--delivery <system|overlay|auto>`.
- Node-hosts negeren `PATH`-overrides en verwijderen gevaarlijke startup-/shellsleutels (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Als je extra PATH-vermeldingen nodig hebt, configureer dan de serviceomgeving van de node-host (of installeer tools op standaardlocaties) in plaats van `PATH` via `--env` door te geven.
- In macOS-node-modus wordt `system.run` afgeschermd door exec-goedkeuringen in de macOS-app (Instellingen → Exec-goedkeuringen).
  Ask/allowlist/full gedragen zich hetzelfde als de headless node-host; geweigerde prompts retourneren `SYSTEM_RUN_DENIED`.
- Op een headless node-host wordt `system.run` afgeschermd door exec-goedkeuringen (`~/.openclaw/exec-approvals.json`).

## Exec-nodebinding

Wanneer meerdere nodes beschikbaar zijn, kun je exec aan een specifieke node binden.
Dit stelt de standaardnode in voor `exec host=node` (en kan per agent worden overschreven).

Globale standaard:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Maak ongedaan om elke node toe te staan:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Machtigingenkaart

Nodes kunnen een `permissions`-kaart opnemen in `node.list` / `node.describe`, met permissionnaam als sleutel (bijv. `screenRecording`, `accessibility`) en booleaanse waarden (`true` = verleend).

## Headless node-host (cross-platform)

OpenClaw kan een **headless node-host** (geen UI) uitvoeren die verbinding maakt met de Gateway
WebSocket en `system.run` / `system.which` beschikbaar stelt. Dit is nuttig op Linux/Windows
of om een minimale node naast een server te draaien.

Start deze:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opmerkingen:

- Koppelen is nog steeds vereist (de Gateway toont een prompt voor apparaatkoppeling).
- De node-host slaat zijn node-id, token, weergavenaam en Gateway-verbindingsinformatie op in `~/.openclaw/node.json`.
- Exec-goedkeuringen worden lokaal afgedwongen via `~/.openclaw/exec-approvals.json`
  (zie [Exec-goedkeuringen](/nl/tools/exec-approvals)).
- Op macOS voert de headless node-host `system.run` standaard lokaal uit. Stel
  `OPENCLAW_NODE_EXEC_HOST=app` in om `system.run` via de exec-host van de companion-app te routeren; voeg
  `OPENCLAW_NODE_EXEC_FALLBACK=0` toe om de app-host verplicht te stellen en fail-closed te eindigen als die niet beschikbaar is.
- Voeg `--tls` / `--tls-fingerprint` toe wanneer de Gateway WS TLS gebruikt.

## Mac-node-modus

- De macOS-menubalkapp maakt verbinding met de Gateway WS-server als node (zodat `openclaw nodes …` tegen deze Mac werkt).
- In externe modus opent de app een SSH-tunnel voor de Gateway-poort en maakt verbinding met `localhost`.
