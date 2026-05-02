---
read_when:
    - De Gateway uitvoeren via de CLI (ontwikkeling of servers)
    - Gateway-authenticatie, bindmodi en connectiviteit debuggen
    - Gateways ontdekken via Bonjour (lokale + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateways starten, bevragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-05-02T11:12:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f204b58e03c9dd1b75a7ddb2be0634ee70b42aa317a2668ab86cb33a0570b01
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (kanalen, nodes, sessies, hooks). Subopdrachten op deze pagina vallen onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-installatie.
  </Card>
  <Card title="Discovery overview" href="/nl/gateway/discovery">
    Hoe OpenClaw gateways adverteert en vindt.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration">
    Gateway-configuratiesleutels op het hoogste niveau.
  </Card>
</CardGroup>

## De Gateway uitvoeren

Voer een lokaal Gateway-proces uit:

```bash
openclaw gateway
```

Alias voor de voorgrond:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - Standaard weigert de Gateway te starten tenzij `gateway.mode=local` is ingesteld in `~/.openclaw/openclaw.json`. Gebruik `--allow-unconfigured` voor ad-hoc-/ontwikkelruns.
    - `openclaw onboard --mode local` en `openclaw setup` horen `gateway.mode=local` te schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een defecte of overschreven configuratie en repareer die in plaats van impliciet van lokale modus uit te gaan.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert hij voor jou "lokaal te raden".
    - Binding buiten loopback zonder auth wordt geblokkeerd (veiligheidsvangrail).
    - `SIGUSR1` activeert een herstart binnen het proces wanneer dit is toegestaan (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatig herstarten te blokkeren, terwijl toepassen/bijwerken via gateway-tool/config toegestaan blijft).
    - `SIGINT`/`SIGTERM`-handlers stoppen het gateway-proces, maar herstellen geen aangepaste terminalstatus. Als je de CLI omwikkelt met een TUI of raw-mode-invoer, herstel dan de terminal voor het afsluiten.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaard komt uit config/env; meestal `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindmodus van listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Overschrijving van auth-modus.
</ParamField>
<ParamField path="--token <token>" type="string">
  Overschrijving van token (stelt ook `OPENCLAW_GATEWAY_TOKEN` in voor het proces).
</ParamField>
<ParamField path="--password <password>" type="string">
  Overschrijving van wachtwoord.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lees het Gateway-wachtwoord uit een bestand.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Stel de Gateway beschikbaar via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset Tailscale serve/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta starten van de gateway toe zonder `gateway.mode=local` in de configuratie. Omzeilt de startbeveiliging alleen voor ad-hoc-/ontwikkelbootstrap; schrijft of repareert het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een ontwikkelconfiguratie + werkruimte aan als die ontbreekt (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset ontwikkelconfiguratie + referenties + sessies + werkruimte (vereist `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Stop een bestaande listener op de geselecteerde poort voordat wordt gestart.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Uitgebreide logs.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Toon alleen CLI-backendlogs in de console (en schakel stdout/stderr in).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Logstijl voor WebSocket.
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
Inline `--password` kan zichtbaar zijn in lokale proceslijsten. Gebruik bij voorkeur `--password-file`, env of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Startprofilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens het starten van de Gateway te loggen, inclusief per fase `eventLoopMax`-vertraging en timings van Plugin-lookup-tables voor installed-index, manifestregister, startplanning en owner-map-werk.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-startdiagnosetijdlijn voor externe QA-harnassen te schrijven. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad wordt nog steeds via env geleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer `pnpm test:startup:gateway -- --runs 5 --warmup 1` uit om het starten van de Gateway te benchmarken. De benchmark registreert de eerste procesuitvoer, `/healthz`, `/readyz`, starttracetimings, event-loop-vertraging en timingdetails van Plugin-lookup-tables.

## Een actieve Gateway opvragen

Alle query-opdrachten gebruiken WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - Standaard: leesbaar voor mensen (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen styling/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit terwijl de menselijke lay-out behouden blijft.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: Gateway WebSocket-URL.
    - `--token <token>`: Gateway-token.
    - `--password <password>`: Gateway-wachtwoord.
    - `--timeout <ms>`: timeout/budget (verschilt per opdracht).
    - `--expect-final`: wacht op een "final"-respons (agentaanroepen).

  </Tab>
</Tabs>

<Note>
Wanneer je `--url` instelt, valt de CLI niet terug op referenties uit configuratie of omgeving. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties is een fout.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Het HTTP-eindpunt `/healthz` is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-eindpunt `/readyz` is strenger en blijft rood terwijl startende Plugin-sidecars, kanalen of geconfigureerde hooks nog bezig zijn met stabiliseren. Lokale of geauthenticeerde gedetailleerde readiness-responsen bevatten een diagnostisch `eventLoop`-blok met event-loop-vertraging, event-loopbenutting, CPU-coreverhouding en een `degraded`-vlag.

### `gateway usage-cost`

Haal usage-cost-samenvattingen op uit sessielogs.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Aantal dagen dat moet worden opgenomen.
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
  Maximumaantal recente events om op te nemen (max `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op diagnostisch eventtype, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen events op na een diagnostisch volgnummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een bewaarde stabiliteitsbundel in plaats van de actieve Gateway aan te roepen. Gebruik `--bundle latest` (of alleen `--bundle`) voor de nieuwste bundel onder de statusdirectory, of geef direct een JSON-pad naar een bundel door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare zip met supportdiagnostiek in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Records bewaren operationele metadata: eventnamen, aantallen, bytegroottes, geheugenmetingen, wachtrij-/sessiestatus, kanaal-/Pluginnamen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, timeouts tijdens afsluiten en mislukte starts na herstarten schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder events heeft. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` gelden ook voor bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokale diagnostiek-zip die is bedoeld om aan bugrapporten te koppelen. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en de inhoud van de bundel.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Uitvoerpad voor zip. Standaard is een supportexport onder de statusdirectory.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximumaantal opgeschoonde logregels om op te nemen.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximumaantal logbytes om te inspecteren.
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

Hij is bedoeld om te delen. Hij bewaart operationele details die helpen bij debugging, zoals veilige OpenClaw-logvelden, subsysteemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, Plugin-id's, provider-id's, niet-geheime feature-instellingen en geredigeerde operationele logberichten. Hij laat chattekst, webhook-bodies, tooluitvoer, referenties, cookies, account-/berichtidentifiers, prompt-/instructietekst, hostnamen en geheime waarden weg of redigeert ze. Wanneer een LogTape-achtig bericht eruitziet als payloadtekst van gebruiker/chat/tool, bewaart de export alleen dat een bericht is weggelaten plus het aantal bytes ervan.

### `gateway status`

`gateway status` toont de Gateway-service (launchd/systemd/schtasks) plus een optionele probe van connectiviteit/auth-mogelijkheid.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Voeg een expliciet probedoel toe. Geconfigureerde remote + localhost worden nog steeds geprobed.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-auth voor de probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Wachtwoord-auth voor de probe.
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
  <Accordion title="Status semantics">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard `gateway status` bewijst de servicestatus, WebSocket-verbinding en de auth-mogelijkheid die tijdens de handshake zichtbaar is. Het bewijst geen lees-/schrijf-/adminbewerkingen.
    - Diagnostische probes wijzigen niets voor apparaatauthenticatie bij eerste gebruik: ze hergebruiken een bestaande gecachete apparaattoken wanneer die bestaat, maar maken geen nieuwe CLI-apparaatidentiteit of alleen-lezen apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde auth SecretRefs op voor probe-authenticatie wanneer mogelijk.
    - Als een vereiste auth SecretRef in dit commandopad niet is opgelost, rapporteert `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/authenticatie mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
    - Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-referenties onderdrukt om fout-positieven te voorkomen.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en je ook gezonde RPC-aanroepen met leesbereik nodig hebt.
    - `--deep` voegt een best-effort-scan toe voor extra launchd/systemd/schtasks-installaties. Wanneer meerdere gateway-achtige services worden gedetecteerd, toont menselijke uitvoer opschoontips en waarschuwt dat de meeste configuraties één gateway per machine zouden moeten draaien.
    - Menselijke uitvoer bevat het opgeloste pad naar het bestandslogboek plus de snapshot van CLI-versus-serviceconfiguratiepaden/geldigheid om profiel- of state-dir-drift te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Op Linux systemd-installaties lezen service-auth-driftcontroles zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, paden tussen aanhalingstekens, meerdere bestanden en optionele `-`-bestanden).
    - Driftcontroles lossen `gateway.auth.token` SecretRefs op met behulp van samengevoegde runtime-env (eerst servicecommando-env, daarna proces-env als fallback).
    - Als token-authenticatie niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of mode niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles config-tokenresolutie over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is het commando voor "alles debuggen". Het voert altijd probes uit op:

- je geconfigureerde externe gateway (indien ingesteld), en
- localhost (loopback) **zelfs als extern is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Menselijke uitvoer labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere gateways bereikbaar zijn, worden ze allemaal getoond. Meerdere gateways worden ondersteund wanneer je geïsoleerde profielen/poorten gebruikt (bijvoorbeeld een rescue-bot), maar de meeste installaties draaien nog steeds één gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` betekent dat ten minste één doel een WebSocket-verbinding accepteerde.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` rapporteert wat de probe kon bewijzen over auth. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat detail-RPC-aanroepen met leesbereik (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat verbinden is gelukt, maar RPC met leesbereik beperkt is. Dit wordt gerapporteerd als **verminderde** bereikbaarheid, niet als volledige mislukking.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding accepteerde, maar vervolgdiagnostiek voor lezen een timeout kreeg of mislukte. Ook dit is **verminderde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachete apparaatauthenticatie, maar maakt het geen apparaatidentiteit of koppelingsstatus voor eerste gebruik aan.
    - De exitcode is alleen niet-nul wanneer geen enkel geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON output">
    Bovenste niveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel accepteerde een verbinding, maar voltooide niet alle detail-RPC-diagnostiek.
    - `capability`: beste mogelijkheid gezien over bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te behandelen in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerd extern doel, daarna local loopback.
    - `warnings[]`: best-effort-waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: local loopback-/tailnet-URL-hints afgeleid uit de huidige configuratie en hostnetwerk.
    - `discovery.timeoutMs` en `discovery.count`: het daadwerkelijke discovery-budget/resultaantal dat voor deze probe-pass is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na connect + gedegradeerde classificatie.
    - `rpcOk`: volledig detail-RPC-succes.
    - `scopeLimited`: detail-RPC mislukt door ontbrekende operatorscope.

    Per doel (`targets[].auth`):

    - `role`: auth-rol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende scopes gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de getoonde auth-mogelijkheidsclassificatie voor dat doel.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: het instellen van de SSH-tunnel is mislukt; het commando viel terug op directe probes.
    - `multiple_gateways`: meer dan één doel was bereikbaar; dit is ongebruikelijk tenzij je bewust geïsoleerde profielen draait, zoals een rescue-bot.
    - `auth_secretref_unresolved`: een geconfigureerde auth SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding is gelukt, maar de leesprobe werd beperkt door ontbrekende `operator.read`.

  </Accordion>
</AccordionGroup>

#### Extern via SSH (pariteit met Mac-app)

De modus "Extern via SSH" van de macOS-app gebruikt een lokale port-forward, zodat de externe gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

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
  Kies de eerst ontdekte gatewayhost als SSH-doel uit het opgeloste discovery-eindpunt (`local.` plus het geconfigureerde wide-area domein, indien aanwezig). Hints met alleen TXT worden genegeerd.
</ParamField>

Config (optioneel, gebruikt als standaarden):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Laagniveau RPC-helper.

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
  Vooral voor agent-achtige RPC's die tussentijdse events streamen vóór een definitieve payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare JSON-uitvoer.
</ParamField>

<Note>
`--params` moet geldige JSON zijn.
</Note>

## Beheer de Gateway-service

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Installeren met een wrapper

Gebruik `--wrapper` wanneer de beheerde service via een ander uitvoerbaar bestand moet starten, bijvoorbeeld een
shim voor secretsbeheer of een run-as-helper. De wrapper ontvangt de normale Gateway-argumenten en is
verantwoordelijk voor het uiteindelijk exec'en van `openclaw` of Node met die argumenten.

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
uitvoerbaar bestand is, schrijft de wrapper naar service-`ProgramArguments` en bewaart
`OPENCLAW_WRAPPER` in de serviceomgeving voor latere geforceerde herinstallaties, updates en doctor-
reparaties.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Om een bewaarde wrapper te verwijderen, leeg je `OPENCLAW_WRAPPER` tijdens het herinstalleren:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Keten `gateway stop` en `gateway start` niet als vervanging voor opnieuw starten; op macOS schakelt `gateway stop` de LaunchAgent bewust uit voordat deze wordt gestopt.
    - Lifecycle-commando's accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Wanneer token-authenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef oplosbaar is, maar bewaart het opgeloste token niet in serviceomgevingsmetadata.
    - Als token-authenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, faalt installatie gesloten in plaats van fallback-plaintext te bewaren.
    - Voor wachtwoord-authenticatie op `gateway run` geef je de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` boven inline `--password`.
    - In afgeleide auth-modus versoepelt shell-only `OPENCLAW_GATEWAY_PASSWORD` de tokenvereisten voor installatie niet; gebruik duurzame configuratie (`gateway.auth.password` of config `env`) bij het installeren van een beheerde service.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat mode expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant op Gateway-beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen gateways waarvoor Bonjour-discovery is ingeschakeld (standaard) adverteren de beacon.

Wide-Area-discoveryrecords bevatten (TXT):

- `role` (gateway-rolhint)
- `transport` (transporthint, bijvoorbeeld `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (optioneel; clients gebruiken standaard SSH-doelen op `22` wanneer dit ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, wanneer beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (hint voor externe installatie die naar de wide-area-zone is geschreven)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per commando (browse/resolve).
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
- De CLI scant `local.` plus het geconfigureerde grootgebiedsdomein wanneer er een is ingeschakeld.
- `wsUrl` in JSON-uitvoer wordt afgeleid van het opgeloste service-eindpunt, niet van hints die alleen via TXT worden gegeven, zoals `lanHost` of `tailnetDns`.
- Op `local.` mDNS worden `sshPort` en `cliPath` alleen uitgezonden wanneer `discovery.mdns.mode` `full` is. Grootgebieds-DNS-SD schrijft nog steeds `cliPath`; `sshPort` blijft daar ook optioneel.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
