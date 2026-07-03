---
read_when:
    - iOS-/Android-nodes koppelen aan een gateway
    - Node-canvas/camera gebruiken voor agentcontext
    - Nieuwe Node-opdrachten of CLI-helpers toevoegen
summary: 'Nodes: koppeling, mogelijkheden, machtigingen en CLI-helpers voor canvas/camera/scherm/apparaat/meldingen/systeem'
title: Nodes
x-i18n:
    generated_at: "2026-07-03T09:46:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

Een **node** is een begeleidend apparaat (macOS/iOS/Android/headless) dat verbinding maakt met de Gateway **WebSocket** (dezelfde poort als operators) met `role: "node"` en een commandoppervlak aanbiedt (bijv. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Protocoldetails: [Gateway-protocol](/nl/gateway/protocol).

Verouderd transport: [Bridge-protocol](/nl/gateway/bridge-protocol) (TCP JSONL;
alleen historisch voor huidige nodes).

macOS kan ook in **node-modus** draaien: de menubalk-app maakt verbinding met de
WS-server van de Gateway en biedt de lokale canvas-/camera-commando's aan als node (zodat
`openclaw nodes …` werkt tegen deze Mac). In externe-gatewaymodus wordt
browserautomatisering afgehandeld door de CLI-nodehost (`openclaw node run` of de
geïnstalleerde nodeservice), niet door de native app-node.

Opmerkingen:

- Nodes zijn **randapparaten**, geen gateways. Ze draaien de gatewayservice niet.
- Telegram/WhatsApp/enz. berichten komen binnen op de **gateway**, niet op nodes.
- Runbook voor probleemoplossing: [/nodes/troubleshooting](/nl/nodes/troubleshooting)

## Koppelen + status

**WS-nodes gebruiken apparaatkoppeling.** Nodes presenteren een apparaatidentiteit tijdens `connect`; de Gateway
maakt een apparaatkoppelingsverzoek voor `role: node`. Keur goed via de apparaten-CLI (of UI).

Snelle CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Als een node het opnieuw probeert met gewijzigde auth-details (rol/scopes/publieke sleutel), wordt het eerdere
openstaande verzoek vervangen en wordt een nieuwe `requestId` aangemaakt. Voer
`openclaw devices list` opnieuw uit voordat je goedkeurt.

Opmerkingen:

- `nodes status` markeert een node als **gekoppeld** wanneer de rol van de apparaatkoppeling `node` bevat.
- Het apparaatkoppelingsrecord is het duurzame contract voor goedgekeurde rollen. Tokenrotatie
  blijft binnen dat contract; het kan een gekoppelde node niet upgraden naar een
  andere rol waarvoor koppeling nooit goedkeuring heeft verleend.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) is een aparte, gateway-eigendom
  nodekoppelingsopslag; deze bewaakt de WS-`connect`-handshake **niet**.
- `openclaw nodes remove --node <id|name|ip>` verwijdert een nodekoppeling. Voor een
  apparaat-ondersteunde node trekt dit de `node`-rol van het apparaat in `devices/paired.json`
  in en verbreekt het de node-rolsessies van dat apparaat — een apparaat met gemengde rollen behoudt
  zijn rij en verliest alleen de `node`-rol, terwijl een rij voor een apparaat met alleen node
  wordt verwijderd. Het wist ook elke overeenkomende vermelding uit de aparte, gateway-eigendom node
  koppelingsopslag. `operator.pairing` mag niet-operator-noderijen verwijderen; een
  apparaat-tokenaanroeper die zijn eigen node-rol op een apparaat met gemengde rollen intrekt
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

- **Gatewayhost**: ontvangt berichten, draait het model, routeert toolaanroepen.
- **Nodehost**: voert `system.run`/`system.which` uit op de nodemachine.
- **Goedkeuringen**: afgedwongen op de nodehost via `~/.openclaw/exec-approvals.json`.

Goedkeuringsopmerking:

- Node-uitvoeringen met goedkeuring binden de exacte verzoekcontext.
- Voor directe shell-/runtime-bestandsuitvoeringen bindt OpenClaw ook naar beste vermogen één concrete lokale
  bestandsoperand en weigert de uitvoering als dat bestand vóór uitvoering wijzigt.
- Als OpenClaw niet precies één concreet lokaal bestand voor een interpreter-/runtimecommando kan identificeren,
  wordt uitvoering met goedkeuring geweigerd in plaats van volledige runtime-dekking te suggereren. Gebruik sandboxing,
  aparte hosts, of een expliciete vertrouwde allowlist/volledige workflow voor bredere interpretersemantiek.

### Een nodehost starten (voorgrond)

Op de nodemachine:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Externe gateway via SSH-tunnel (loopback-binding)

Als de Gateway aan loopback bindt (`gateway.bind=loopback`, standaard in lokale modus),
kunnen externe nodehosts niet rechtstreeks verbinden. Maak een SSH-tunnel en wijs de
nodehost naar het lokale uiteinde van de tunnel.

Voorbeeld (nodehost -> gatewayhost):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Opmerkingen:

- `openclaw node run` ondersteunt authenticatie met token of wachtwoord.
- Omgevingsvariabelen hebben de voorkeur: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config-fallback is `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus negeert de nodehost bewust `gateway.remote.token` / `gateway.remote.password`.
- In externe modus komen `gateway.remote.token` / `gateway.remote.password` in aanmerking volgens de externe voorrangsregels.
- Als actieve lokale `gateway.auth.*` SecretRefs zijn geconfigureerd maar niet opgelost, faalt nodehost-auth gesloten.
- Auth-resolutie voor nodehosts respecteert alleen `OPENCLAW_GATEWAY_*`-omgevingsvariabelen.

### Een nodehost starten (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Koppelen + naam

Op de gatewayhost:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Als de node het opnieuw probeert met gewijzigde auth-details, voer dan `openclaw devices list` opnieuw uit
en keur de huidige `requestId` goed.

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

### Exec naar de node wijzen

Configureer standaardinstellingen (gatewayconfig):

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

`host=auto` kiest de node niet impliciet zelfstandig, maar een expliciet per-aanroepverzoek `host=node` is toegestaan vanuit `auto`. Als je node-exec als standaard voor de sessie wilt, stel dan expliciet `tools.exec.host=node` of `/exec host=node ...` in.

Gerelateerd:

- [Nodehost-CLI](/nl/cli/node)
- [Exec-tool](/nl/tools/exec)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)

### Lokale modelinferentie

Een desktop- of servernode kan chat-geschikte modellen aanbieden vanuit een Ollama-server
die op die node draait. Agents gebruiken de `node_inference`-tool van de Ollama-plugin om
geïnstalleerde modellen te ontdekken en een begrensde prompt extern uit te voeren; de Gateway heeft
geen directe netwerktoegang tot Ollama nodig. Zie [Ollama node-lokale inferentie](/nl/providers/ollama#node-local-inference)
voor installatie, modelfiltering en directe verificatiecommando's.

## Commando's aanroepen

Laag niveau (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Hogere helperfuncties bestaan voor de gangbare workflows voor "geef de agent een MEDIA-bijlage".

## Commandobeleid

Nodecommando's moeten twee poorten passeren voordat ze kunnen worden aangeroepen:

1. De node moet het commando declareren in zijn WebSocket-`connect.commands`-lijst.
2. Het platformbeleid van de gateway moet het gedeclareerde commando toestaan.

Windows- en macOS-begeleidende nodes staan veilige gedeclareerde commando's zoals
`canvas.*`, `camera.list`, `location.get` en `screen.snapshot` standaard toe.
Vertrouwde nodes die de `talk`-capability adverteren of `talk.*`-commando's declareren
staan ook gedeclareerde push-to-talk-commando's (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) standaard toe, onafhankelijk van het platformlabel.
Gevaarlijke of privacygevoelige commando's zoals `camera.snap`, `camera.clip` en
`screen.record` vereisen nog steeds expliciete opt-in met
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` wint altijd van
standaardwaarden en extra allowlist-vermeldingen.

Plugin-eigendom nodecommando's kunnen een Gateway-node-invoke-beleid toevoegen. Dat beleid
draait na de allowlist-controle en vóór het doorsturen naar de node, zodat raw
`node.invoke`, CLI-helpers en specifieke agenttools dezelfde plugin-
toestemmingsgrens delen. Gevaarlijke plugin-nodecommando's vereisen nog steeds expliciete
`gateway.nodes.allowCommands`-opt-in.

Nadat een node zijn gedeclareerde commandolijst wijzigt, wijs je de oude apparaatkoppeling af
en keur je het nieuwe verzoek goed zodat de gateway de bijgewerkte commandosnapshot opslaat.

## Config (`openclaw.json`)

Node-gerelateerde instellingen staan onder `gateway.nodes` en `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Gebruik exacte nodecommandonamen. `denyCommands` verwijdert een commando zelfs wanneer een
platformstandaard of `allowCommands`-vermelding het anders zou toestaan. Zie
[Referentie voor Gateway-configuratie](/nl/gateway/configuration-reference#gateway-field-details)
voor velddetails over gateway-nodekoppeling en commandobeleid.

Exec-node-override per agent:

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

## Schermafbeeldingen (canvas-snapshots)

Als de node de Canvas (WebView) toont, retourneert `canvas.snapshot` `{ format, base64 }`.

CLI-helper (schrijft naar een tijdelijk bestand en print het opgeslagen pad):

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

- `canvas present` accepteert URL's of lokale bestandspaden (`--target`), plus optioneel `--x/--y/--width/--height` voor positionering.
- `canvas eval` accepteert inline JS (`--js`) of een positioneel argument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Opmerkingen:

- Mobiele Nodes gebruiken een gebundelde app-eigen A2UI-pagina voor rendering met acties.
- Alleen A2UI v0.8 JSONL wordt ondersteund (v0.9/createSurface wordt geweigerd).
- iOS en Android renderen externe Gateway Canvas-pagina's, maar A2UI-knopacties worden alleen verzonden vanaf de gebundelde app-eigen A2UI-pagina. Door Gateway gehoste HTTP/HTTPS A2UI-pagina's zijn op die mobiele clients alleen voor rendering.

## Foto's + video's (Node-camera)

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

- De Node moet **op de voorgrond staan** voor `canvas.*` en `camera.*` (achtergrondaanroepen retourneren `NODE_BACKGROUND_UNAVAILABLE`).
- De clipduur wordt begrensd (momenteel `<= 60s`) om te grote base64-payloads te voorkomen.
- Android vraagt waar mogelijk om `CAMERA`/`RECORD_AUDIO`-machtigingen; geweigerde machtigingen mislukken met `*_PERMISSION_REQUIRED`.

## Schermopnamen (Nodes)

Ondersteunde Nodes bieden `screen.record` (mp4). Voorbeeld:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Opmerkingen:

- De beschikbaarheid van `screen.record` hangt af van het Node-platform.
- Schermopnamen worden begrensd op `<= 60s`.
- `--no-audio` schakelt microfoonopname uit op ondersteunde platforms.
- Gebruik `--screen <index>` om een scherm te selecteren wanneer meerdere schermen beschikbaar zijn.

## Locatie (Nodes)

Nodes bieden `location.get` wanneer Locatie is ingeschakeld in de instellingen.

CLI-helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Opmerkingen:

- Locatie staat **standaard uit**.
- "Altijd" vereist systeemmachtiging; ophalen op de achtergrond gebeurt naar beste vermogen.
- Het antwoord bevat lat/lon, nauwkeurigheid (meters) en tijdstempel.

## SMS (Android-Nodes)

Android-Nodes kunnen `sms.send` bieden wanneer de gebruiker **SMS**-machtiging verleent en het apparaat telefonie ondersteunt.

Low-level aanroep:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Opmerkingen:

- De machtigingsprompt moet op het Android-apparaat worden geaccepteerd voordat de capability wordt geadverteerd.
- Apparaten met alleen wifi zonder telefonie adverteren `sms.send` niet.

## Android-apparaat- + persoonlijkegegevenscommando's

Android-Nodes kunnen aanvullende commandofamilies adverteren wanneer de bijbehorende capabilities zijn ingeschakeld.

Beschikbare families:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` wanneer het delen van geïnstalleerde apps is ingeschakeld in Android-instellingen
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
- Bewegingscommando's worden op capability begrensd door beschikbare sensoren.

## Systeemcommando's (Node-host / Mac-Node)

De macOS-Node biedt `system.run`, `system.notify` en `system.execApprovals.get/set`.
De headless Node-host biedt `system.run`, `system.which` en `system.execApprovals.get/set`.

Voorbeelden:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Opmerkingen:

- `system.run` retourneert stdout/stderr/exitcode in de payload.
- Shell-uitvoering loopt nu via de `exec`-tool met `host=node`; `nodes` blijft het directe RPC-oppervlak voor expliciete Node-commando's.
- `nodes invoke` biedt geen `system.run` of `system.run.prepare`; die blijven alleen op het exec-pad.
- Het exec-pad bereidt vóór goedkeuring een canoniek `systemRunPlan` voor. Zodra een
  goedkeuring is verleend, stuurt de gateway dat opgeslagen plan door, niet later
  door de aanroeper bewerkte command/cwd/session-velden.
- `system.notify` respecteert de status van notificatiemachtigingen in de macOS-app.
- Niet-herkende Node-`platform`- / `deviceFamily`-metadata gebruiken een conservatieve standaard-allowlist die `system.run` en `system.which` uitsluit. Als je die commando's bewust nodig hebt voor een onbekend platform, voeg ze dan expliciet toe via `gateway.nodes.allowCommands`.
- `system.run` ondersteunt `--cwd`, `--env KEY=VAL`, `--command-timeout` en `--needs-screen-recording`.
- Voor shell-wrappers (`bash|sh|zsh ... -c/-lc`) worden request-scoped `--env`-waarden beperkt tot een expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Voor allow-always-beslissingen in allowlist-modus blijven bekende dispatch-wrappers (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) interne executable-paden bewaren in plaats van wrapper-paden. Als uitpakken niet veilig is, wordt er niet automatisch een allowlist-vermelding bewaard.
- Op Windows-Node-hosts in allowlist-modus vereisen shell-wrapper-runs via `cmd.exe /c` goedkeuring (alleen een allowlist-vermelding staat de wrapper-vorm niet automatisch toe).
- `system.notify` ondersteunt `--priority <passive|active|timeSensitive>` en `--delivery <system|overlay|auto>`.
- Node-hosts negeren `PATH`-overschrijvingen en verwijderen gevaarlijke opstart-/shellsleutels (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Als je extra PATH-vermeldingen nodig hebt, configureer dan de serviceomgeving van de Node-host (of installeer tools op standaardlocaties) in plaats van `PATH` via `--env` door te geven.
- In macOS-Node-modus wordt `system.run` begrensd door exec-goedkeuringen in de macOS-app (Instellingen → Exec-goedkeuringen).
  Ask/allowlist/full gedragen zich hetzelfde als de headless Node-host; geweigerde prompts retourneren `SYSTEM_RUN_DENIED`.
- Op de headless Node-host wordt `system.run` begrensd door exec-goedkeuringen (`~/.openclaw/exec-approvals.json`).

## Exec-Node-binding

Wanneer meerdere Nodes beschikbaar zijn, kun je exec aan een specifieke Node binden.
Dit stelt de standaard-Node in voor `exec host=node` (en kan per agent worden overschreven).

Globale standaard:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Per-agent-overschrijving:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Maak ongedaan om elke Node toe te staan:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Machtigingenkaart

Nodes kunnen een `permissions`-kaart opnemen in `node.list` / `node.describe`, gesleuteld op machtigingsnaam (bijv. `screenRecording`, `accessibility`) met booleaanse waarden (`true` = verleend).

## Headless Node-host (cross-platform)

OpenClaw kan een **headless Node-host** (geen UI) uitvoeren die verbinding maakt met de Gateway
WebSocket en `system.run` / `system.which` biedt. Dit is nuttig op Linux/Windows
of om een minimale Node naast een server uit te voeren.

Start deze:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opmerkingen:

- Koppelen is nog steeds vereist (de Gateway toont een prompt om apparaten te koppelen).
- De Node-host slaat zijn Node-id, token, weergavenaam en Gateway-verbindingsinfo op in `~/.openclaw/node.json`.
- Exec-goedkeuringen worden lokaal afgedwongen via `~/.openclaw/exec-approvals.json`
  (zie [Exec-goedkeuringen](/nl/tools/exec-approvals)).
- Op macOS voert de headless Node-host `system.run` standaard lokaal uit. Stel
  `OPENCLAW_NODE_EXEC_HOST=app` in om `system.run` via de exec-host van de begeleidende app te routeren; voeg
  `OPENCLAW_NODE_EXEC_FALLBACK=0` toe om de app-host te vereisen en fail-closed te mislukken als deze niet beschikbaar is.
- Voeg `--tls` / `--tls-fingerprint` toe wanneer de Gateway WS TLS gebruikt.

## Mac-Node-modus

- De macOS-menubalkapp maakt verbinding met de Gateway WS-server als Node (zodat `openclaw nodes …` tegen deze Mac werkt).
- In externe modus opent de app een SSH-tunnel voor de Gateway-poort en maakt verbinding met `localhost`.
