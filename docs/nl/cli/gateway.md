---
read_when:
    - De Gateway uitvoeren vanuit de CLI (ontwikkeling of servers)
    - Gateway-authenticatie, bindmodi en connectiviteit debuggen
    - Gateways ontdekken via Bonjour (lokaal + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateways uitvoeren, opvragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is OpenClaw's WebSocket-server (kanalen, nodes, sessies, hooks). Subcommando's op deze pagina vallen onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-detectie" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-configuratie.
  </Card>
  <Card title="Detectie-overzicht" href="/nl/gateway/discovery">
    Hoe OpenClaw gateways adverteert en vindt.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration">
    Gateway-configuratiesleutels op het hoogste niveau.
  </Card>
</CardGroup>

## De Gateway uitvoeren

Voer een lokaal Gateway-proces uit:

```bash
openclaw gateway
```

Voorgrondalias:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    - Standaard weigert de Gateway te starten tenzij `gateway.mode=local` is ingesteld in `~/.openclaw/openclaw.json`. Gebruik `--allow-unconfigured` voor ad-hoc-/dev-runs.
    - `openclaw onboard --mode local` en `openclaw setup` horen `gateway.mode=local` te schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een kapotte of overschreven configuratie en herstel die in plaats van impliciet lokale modus aan te nemen.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert hij voor jou "lokaal te raden".
    - Binden buiten loopback zonder authenticatie wordt geblokkeerd (veiligheidsvangrail).
    - `SIGUSR1` activeert een restart binnen het proces wanneer dit is geautoriseerd (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatige restart te blokkeren, terwijl gateway-tool/configuratie toepassen/bijwerken toegestaan blijven).
    - `SIGINT`/`SIGTERM`-handlers stoppen het gateway-proces, maar herstellen geen aangepaste terminalstatus. Als je de CLI omwikkelt met een TUI of raw-mode-invoer, herstel dan de terminal vóór afsluiten.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaard komt uit configuratie/env; meestal `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindmodus voor de listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Overschrijving van authenticatiemodus.
</ParamField>
<ParamField path="--token <token>" type="string">
  Tokenoverschrijving (stelt ook `OPENCLAW_GATEWAY_TOKEN` in voor het proces).
</ParamField>
<ParamField path="--password <password>" type="string">
  Wachtwoordoverschrijving.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lees het gateway-wachtwoord uit een bestand.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Stel de Gateway beschikbaar via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset de Tailscale serve-/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta toe dat de gateway start zonder `gateway.mode=local` in de configuratie. Omzeilt de opstartbeveiliging alleen voor ad-hoc-/dev-bootstrap; schrijft of herstelt het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een dev-configuratie + werkruimte als die ontbreekt (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset dev-configuratie + referenties + sessies + werkruimte (vereist `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Beëindig vóór het starten elke bestaande listener op de geselecteerde poort.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Uitgebreide logs.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Toon alleen CLI-backendlogs in de console (en schakel stdout/stderr in).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket-logstijl.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias voor `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Log ruwe modelstreamevents naar jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Jsonl-pad voor ruwe stream.
</ParamField>

<Warning>
Inline `--password` kan zichtbaar zijn in lokale proceslijsten. Geef de voorkeur aan `--password-file`, env, of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Opstartprofilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens het opstarten van de Gateway te loggen, inclusief `eventLoopMax`-vertraging per fase en plugin-opzoektabeltimings voor installed-index, manifestregister, opstartplanning en owner-map-werk.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-opstartdiagnosetijdlijn te schrijven voor externe QA-harnassen. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad blijft via env aangeleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer `pnpm test:startup:gateway -- --runs 5 --warmup 1` uit om het opstarten van de Gateway te benchmarken. De benchmark registreert de eerste procesuitvoer, `/healthz`, `/readyz`, opstarttrace-timings, event-loop-vertraging en timingdetails van plugin-opzoektabellen.

## Een actieve Gateway opvragen

Alle querycommando's gebruiken WebSocket RPC.

<Tabs>
  <Tab title="Uitvoermodi">
    - Standaard: menselijk leesbaar (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen styling/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit terwijl de menselijke lay-out behouden blijft.

  </Tab>
  <Tab title="Gedeelde opties">
    - `--url <url>`: Gateway WebSocket-URL.
    - `--token <token>`: Gateway-token.
    - `--password <password>`: Gateway-wachtwoord.
    - `--timeout <ms>`: timeout/budget (verschilt per commando).
    - `--expect-final`: wacht op een "final"-antwoord (agentaanroepen).

  </Tab>
</Tabs>

<Note>
Wanneer je `--url` instelt, valt de CLI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties zijn een fout.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Het HTTP-eindpunt `/healthz` is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-eindpunt `/readyz` is strenger en blijft rood terwijl opstartende plugin-sidecars, kanalen of geconfigureerde hooks nog aan het stabiliseren zijn. Lokale of geauthenticeerde gedetailleerde readiness-antwoorden bevatten een `eventLoop`-diagnoseblok met event-loop-vertraging, event-loop-gebruik, CPU-kernverhouding en een `degraded`-vlag.

### `gateway usage-cost`

Haal usage-cost-samenvattingen op uit sessielogs.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Aantal dagen om op te nemen.
</ParamField>

### `gateway stability`

Haal de recente diagnostische stabiliteitsrecorder op uit een actieve Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximaal aantal recente events om op te nemen (max `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op type diagnostisch event, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen events op na een diagnostisch volgnummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een bewaarde stabiliteitsbundel in plaats van de actieve Gateway aan te roepen. Gebruik `--bundle latest` (of alleen `--bundle`) voor de nieuwste bundel onder de statusdirectory, of geef direct een JSON-pad naar een bundel door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare zip met ondersteuningsdiagnoses in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy- en bundelgedrag">
    - Records bewaren operationele metadata: eventnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/pluginnamen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, shutdown-timeouts en mislukte opstarten na restart schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder events heeft. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` zijn ook van toepassing op bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokale diagnose-zip die is bedoeld om aan bugrapporten toe te voegen. Zie [Diagnose-export](/nl/gateway/diagnostics) voor het privacymodel en de bundelinhoud.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Uitvoerpad voor de zip. Standaard een ondersteuningsexport onder de statusdirectory.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximaal aantal opgeschoonde logregels om op te nemen.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximaal aantal logbytes om te inspecteren.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket-URL voor de health-snapshot.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-token voor de health-snapshot.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-wachtwoord voor de health-snapshot.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout voor status-/health-snapshot.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Sla het opzoeken van bewaarde stabiliteitsbundels over.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het geschreven pad, de grootte en het manifest af als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratievorm, opgeschoonde configuratiedetails, opgeschoonde logsamenvattingen, opgeschoonde Gateway-status-/health-snapshots en de nieuwste stabiliteitsbundel wanneer die bestaat.

De export is bedoeld om te delen. Hij bewaart operationele details die helpen bij debugging, zoals veilige OpenClaw-logvelden, subsysteemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, plugin-id's, provider-id's, niet-geheime feature-instellingen en geredigeerde operationele logberichten. Hij laat chattekst, webhook-bodies, tooluitvoer, referenties, cookies, account-/berichtidentifiers, prompt-/instructietekst, hostnamen en geheime waarden weg of redigeert ze. Wanneer een LogTape-achtig bericht lijkt op user-/chat-/toolpayloadtekst, bewaart de export alleen dat een bericht is weggelaten plus het aantal bytes.

### `gateway status`

`gateway status` toont de Gateway-service (launchd/systemd/schtasks) plus een optionele probe van connectiviteit/authenticatiemogelijkheid.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Voeg een expliciet probe-doel toe. Geconfigureerde remote + localhost worden nog steeds geprobed.
</ParamField>
<ParamField path="--token <token>" type="string">
  Tokenauthenticatie voor de probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Wachtwoordauthenticatie voor de probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Probe-timeout.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Sla de connectiviteitsprobe over (alleen serviceweergave).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scan ook services op systeemniveau.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Upgrade de standaardconnectiviteitsprobe naar een leesprobe en sluit af met een niet-nulcode wanneer die leesprobe mislukt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantiek">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard `gateway status` bewijst servicestatus, WebSocket-verbinding en de auth-capability die zichtbaar is tijdens de handshake. Het bewijst geen lees-/schrijf-/admin-bewerkingen.
    - Diagnostische probes muteren niets voor eerste device-auth: ze hergebruiken een bestaande gecachte device-token wanneer die bestaat, maar maken geen nieuwe CLI-device-identiteit of alleen-lezen device-pairingrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde auth SecretRefs op voor probe-auth wanneer mogelijk.
    - Als een vereiste auth SecretRef niet is opgelost in dit commandopad, rapporteert `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/auth faalt; geef `--token`/`--password` expliciet door of los eerst de secretbron op.
    - Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-refs onderdrukt om fout-positieven te voorkomen.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en read-scope RPC-calls ook gezond moeten zijn.
    - `--deep` voegt een best-effort scan toe voor extra launchd/systemd/schtasks-installaties. Wanneer meerdere gateway-achtige services worden gedetecteerd, toont menselijke output opruimhints en waarschuwt dat de meeste setups één gateway per machine zouden moeten draaien.
    - Menselijke output bevat het opgeloste pad voor bestandslogs plus de momentopname van CLI-versus-service configpaden/geldigheid om profiel- of state-dir-afwijkingen te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd-authdriftcontroles">
    - Op Linux systemd-installaties lezen service-authdriftcontroles zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, gequote paden, meerdere bestanden en optionele `-`-bestanden).
    - Driftcontroles lossen `gateway.auth.token` SecretRefs op met de samengevoegde runtime-env (eerst service-command-env, daarna process-env fallback).
    - Als token-auth niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of mode niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles config-tokenresolutie over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is de opdracht voor "alles debuggen". Deze probet altijd:

- je geconfigureerde externe Gateway (indien ingesteld), en
- localhost (local loopback) **zelfs als extern is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Menselijke output labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere gateways bereikbaar zijn, worden ze allemaal getoond. Meerdere gateways worden ondersteund wanneer je geïsoleerde profielen/poorten gebruikt (bijv. een rescue-bot), maar de meeste installaties draaien nog steeds één Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretatie">
    - `Reachable: yes` betekent dat ten minste één doel een WebSocket-verbinding accepteerde.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` rapporteert wat de probe over auth kon bewijzen. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat read-scope detail-RPC-calls (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat de verbinding slaagde, maar read-scope RPC beperkt is. Dit wordt gerapporteerd als **verminderde** bereikbaarheid, niet als volledige fout.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding accepteerde, maar dat vervolgleesdiagnostiek is verlopen of mislukt. Dit is ook **verminderde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachte device-auth, maar maakt geen eerste device-identiteit of pairingstatus aan.
    - Exitcode is alleen niet-nul wanneer geen enkel geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON-output">
    Hoogste niveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel accepteerde een verbinding maar voltooide niet alle detail-RPC-diagnostiek.
    - `capability`: beste capability gezien over bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te behandelen in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerd extern, daarna local loopback.
    - `warnings[]`: best-effort waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: local loopback-/tailnet-URL-hints afgeleid van huidige config en hostnetwerk.
    - `discovery.timeoutMs` en `discovery.count`: het daadwerkelijke discoverybudget/resultaantal dat voor deze probe-run is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na verbinding + degraded-classificatie.
    - `rpcOk`: volledige detail-RPC geslaagd.
    - `scopeLimited`: detail-RPC mislukt door ontbrekende operator-scope.

    Per doel (`targets[].auth`):

    - `role`: auth-rol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende scopes gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de getoonde auth-capabilityclassificatie voor dat doel.

  </Accordion>
  <Accordion title="Veelvoorkomende waarschuwingscodes">
    - `ssh_tunnel_failed`: instellen van SSH-tunnel mislukt; de opdracht viel terug op directe probes.
    - `multiple_gateways`: meer dan één doel was bereikbaar; dit is ongebruikelijk tenzij je bewust geïsoleerde profielen draait, zoals een rescue-bot.
    - `auth_secretref_unresolved`: een geconfigureerde auth SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding geslaagd, maar de leesprobe werd beperkt door ontbrekende `operator.read`.

  </Accordion>
</AccordionGroup>

#### Extern via SSH (Mac-app-pariteit)

De macOS-appmodus "Remote over SSH" gebruikt een lokale port-forward zodat de externe Gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

CLI-equivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` of `user@host:port` (poort is standaard `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Identiteitsbestand.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Kies de eerst ontdekte Gateway-host als SSH-doel uit het opgeloste discovery-endpoint (`local.` plus het geconfigureerde wide-area domein, indien aanwezig). Alleen-TXT-hints worden genegeerd.
</ParamField>

Config (optioneel, gebruikt als standaardwaarden):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Low-level RPC-helper.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  JSON-objectstring voor params.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket-URL.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-token.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-wachtwoord.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Timeoutbudget.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Vooral voor agent-achtige RPC's die tussentijdse events streamen vóór een uiteindelijke payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare JSON-output.
</ParamField>

<Note>
`--params` moet geldige JSON zijn.
</Note>

## De Gateway-service beheren

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Installeren met een wrapper

Gebruik `--wrapper` wanneer de beheerde service via een ander executable moet starten, bijvoorbeeld een
secrets-manager-shim of een run-as-helper. De wrapper ontvangt de normale Gateway-args en is
verantwoordelijk voor het uiteindelijk exec'en van `openclaw` of Node met die args.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Je kunt de wrapper ook via de omgeving instellen. `gateway install` valideert dat het pad een
uitvoerbaar bestand is, schrijft de wrapper naar service `ProgramArguments` en bewaart
`OPENCLAW_WRAPPER` in de serviceomgeving voor latere geforceerde herinstallaties, updates en doctor-
reparaties.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Om een bewaarde wrapper te verwijderen, maak je `OPENCLAW_WRAPPER` leeg tijdens herinstallatie:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Commandopties">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lifecycle-gedrag">
    - Gebruik `gateway restart` om een beheerde service te herstarten. Keten `gateway stop` en `gateway start` niet als vervanging voor herstarten; op macOS schakelt `gateway stop` de LaunchAgent bewust uit voordat die wordt gestopt.
    - `gateway restart --wait 30s` overschrijft het geconfigureerde restart-drainbudget voor die herstart. Kale getallen zijn milliseconden; eenheden zoals `s`, `m` en `h` worden geaccepteerd. `--wait 0` wacht onbeperkt.
    - `gateway restart --force` slaat de active-work drain over en herstart onmiddellijk. Gebruik dit wanneer een operator de vermelde taakblokkades al heeft gecontroleerd en de Gateway nu terug wil.
    - Lifecycle-commando's accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Auth en SecretRefs tijdens installatie">
    - Wanneer token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef oplosbaar is, maar bewaart het opgeloste token niet in serviceomgevingsmetadata.
    - Als token-auth een token vereist en de geconfigureerde token-SecretRef niet is opgelost, faalt installatie gesloten in plaats van fallback-platte tekst te bewaren.
    - Voor wachtwoord-auth op `gateway run` geef je de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` boven inline `--password`.
    - In afgeleide auth-modus versoepelt shell-only `OPENCLAW_GATEWAY_PASSWORD` de installatietokenvereisten niet; gebruik duurzame config (`gateway.auth.password` of config `env`) bij het installeren van een beheerde service.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat mode expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant naar Gateway-beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen gateways met Bonjour-discovery ingeschakeld (standaard) adverteren de beacon.

Wide-Area discoveryrecords bevatten (TXT):

- `role` (Gateway-rolhint)
- `transport` (transporthint, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (optioneel; clients gebruiken standaard SSH-doelen op `22` wanneer deze ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, wanneer beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (remote-install-hint geschreven naar de wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Time-out per opdracht (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare uitvoer (schakelt ook styling/spinner uit).
</ParamField>

Voorbeelden:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- De CLI scant `local.` plus het geconfigureerde wide-area-domein wanneer er een is ingeschakeld.
- `wsUrl` in JSON-uitvoer wordt afgeleid van het opgeloste service-eindpunt, niet van hints die alleen uit TXT komen, zoals `lanHost` of `tailnetDns`.
- Op `local.` mDNS worden `sshPort` en `cliPath` alleen uitgezonden wanneer `discovery.mdns.mode` `full` is. Wide-area DNS-SD schrijft nog steeds `cliPath`; `sshPort` blijft daar ook optioneel.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
