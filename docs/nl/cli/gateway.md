---
read_when:
    - De Gateway uitvoeren vanuit de CLI (ontwikkeling of servers)
    - Debuggen van Gateway-authenticatie, bind-modi en connectiviteit
    - Gateways ontdekken via Bonjour (lokale + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateways starten, bevragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (channels, nodes, sessies, hooks). Subcommands op deze pagina staan onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-discovery" href="/nl/gateway/bonjour">
    Instellen van lokale mDNS + wide-area DNS-SD.
  </Card>
  <Card title="Discovery-overzicht" href="/nl/gateway/discovery">
    Hoe OpenClaw gateways adverteert en vindt.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration">
    Configuratiesleutels op het hoogste niveau voor de gateway.
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
    - `openclaw onboard --mode local` en `openclaw setup` worden geacht `gateway.mode=local` te schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een kapotte of overschreven configuratie en herstel die in plaats van impliciet de lokale modus aan te nemen.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert hij voor jou "lokaal te raden".
    - Binden buiten loopback zonder auth wordt geblokkeerd (veiligheidsvangrail).
    - `SIGUSR1` activeert een herstart binnen het proces wanneer dit is geautoriseerd (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatige herstart te blokkeren, terwijl gateway-tool/config apply/update toegestaan blijven).
    - `SIGINT`/`SIGTERM`-handlers stoppen het gatewayproces, maar ze herstellen geen aangepaste terminalstatus. Als je de CLI met een TUI of raw-mode invoer omwikkelt, herstel dan de terminal vóór het afsluiten.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaard komt uit config/env; meestal `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindmodus van de listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Overschrijving van auth-modus.
</ParamField>
<ParamField path="--token <token>" type="string">
  Tokenoverschrijving (stelt ook `OPENCLAW_GATEWAY_TOKEN` in voor het proces).
</ParamField>
<ParamField path="--password <password>" type="string">
  Wachtwoordoverschrijving.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lees het gatewaywachtwoord uit een bestand.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Stel de Gateway beschikbaar via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset de Tailscale serve/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta toe dat de gateway start zonder `gateway.mode=local` in de configuratie. Omzeilt de opstartbeveiliging alleen voor ad-hoc-/dev-bootstrap; schrijft of herstelt het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een dev-configuratie + workspace aan als die ontbreken (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset dev-configuratie + referenties + sessies + workspace (vereist `--dev`).
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
  Log ruwe modelstream-events naar jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Pad voor ruwe stream-jsonl.
</ParamField>

## De Gateway herstarten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` vraagt de draaiende Gateway om actief OpenClaw-werk vóór het herstarten vooraf te controleren. Als bewerkingen in de wachtrij, antwoordbezorging, ingebedde runs of taakruns actief zijn, meldt de Gateway de blokkades, voegt hij dubbele veilige herstartverzoeken samen en herstart hij zodra het actieve werk is afgehandeld. Gewoon `restart` behoudt het bestaande gedrag van de servicebeheerder voor compatibiliteit. Gebruik `--force` alleen wanneer je expliciet het directe overschrijvingspad wilt.

<Warning>
Inline `--password` kan zichtbaar zijn in lokale proceslijsten. Gebruik bij voorkeur `--password-file`, env of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Opstartprofilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens het opstarten van de Gateway te loggen, inclusief per-fase `eventLoopMax`-vertraging en timing van plugin-lookup-tabellen voor installed-index, manifestregister, opstartplanning en owner-map-werk.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-opstartdiagnosetijdlijn te schrijven voor externe QA-harnassen. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad blijft via env aangeleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer `pnpm test:startup:gateway -- --runs 5 --warmup 1` uit om het opstarten van de Gateway te benchmarken. De benchmark registreert de eerste procesuitvoer, `/healthz`, `/readyz`, opstarttracetimings, event-loop-vertraging en timingdetails van plugin-lookup-tabellen.

## Een draaiende Gateway bevragen

Alle querycommando's gebruiken WebSocket RPC.

<Tabs>
  <Tab title="Uitvoermodi">
    - Standaard: leesbaar voor mensen (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen styling/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit terwijl de menselijke lay-out behouden blijft.

  </Tab>
  <Tab title="Gedeelde opties">
    - `--url <url>`: Gateway WebSocket-URL.
    - `--token <token>`: Gateway-token.
    - `--password <password>`: Gateway-wachtwoord.
    - `--timeout <ms>`: time-out/budget (verschilt per commando).
    - `--expect-final`: wacht op een "final"-respons (agentaanroepen).

  </Tab>
</Tabs>

<Note>
Wanneer je `--url` instelt, valt de CLI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties zijn een fout.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Het HTTP-`/healthz`-endpoint is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-`/readyz`-endpoint is strenger en blijft rood terwijl opstartende plugin-sidecars, channels of geconfigureerde hooks nog aan het stabiliseren zijn. Lokale of geauthenticeerde gedetailleerde readiness-responsen bevatten een `eventLoop`-diagnoseblok met event-loop-vertraging, event-loop-gebruik, CPU-kernratio en een `degraded`-vlag.

### `gateway usage-cost`

Haal usage-cost-samenvattingen op uit sessielogs.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Aantal op te nemen dagen.
</ParamField>

### `gateway stability`

Haal de recente diagnostische stabiliteitsrecorder op uit een draaiende Gateway.

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
  Lees een opgeslagen stabiliteitsbundel in plaats van de draaiende Gateway aan te roepen. Gebruik `--bundle latest` (of alleen `--bundle`) voor de nieuwste bundel onder de statusdirectory, of geef direct een JSON-pad naar een bundel door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare zip met ondersteuningsdiagnoses in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy- en bundelgedrag">
    - Records bewaren operationele metadata: eventnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, channel-/pluginnamen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, shutdown-time-outs en opstartherstartfouten schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder events heeft. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` zijn ook van toepassing op bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokale diagnosezip die is bedoeld om aan bugrapporten toe te voegen. Zie [Diagnose-export](/nl/gateway/diagnostics) voor het privacymodel en de inhoud van de bundel.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Uitvoerpad voor de zip. Standaard een supportexport onder de statusdirectory.
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
  Time-out voor status-/health-snapshot.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Sla het opzoeken van opgeslagen stabiliteitsbundels over.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het geschreven pad, de grootte en het manifest af als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratievorm, opgeschoonde configuratiedetails, opgeschoonde logsamenvattingen, opgeschoonde Gateway-status-/health-snapshots en de nieuwste stabiliteitsbundel wanneer die bestaat.

Hij is bedoeld om te worden gedeeld. Hij bewaart operationele details die helpen bij foutopsporing, zoals veilige OpenClaw-logvelden, subsystemenamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, plugin-id's, provider-id's, niet-geheime functie-instellingen en geredigeerde operationele logberichten. Hij laat chattekst, webhook-bodies, tooluitvoer, referenties, cookies, account-/bericht-id's, prompt-/instructietekst, hostnamen en geheime waarden weg of redigeert ze. Wanneer een LogTape-achtig bericht lijkt op payloadtekst van gebruiker/chat/tool, bewaart de export alleen dat een bericht is weggelaten plus het aantal bytes ervan.

### `gateway status`

`gateway status` toont de Gateway-service (launchd/systemd/schtasks) plus een optionele probe van connectiviteit/auth-capaciteit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Voeg een expliciet probe-doel toe. Geconfigureerde remote + localhost worden nog steeds geprobed.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-auth voor de probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Wachtwoord-auth voor de probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Probe-time-out.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Sla de connectiviteitsprobe over (alleen serviceweergave).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scan ook services op systeemniveau.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Upgrade de standaard connectiviteitsprobe naar een leesprobe en sluit af met een niet-nulstatus wanneer die leesprobe mislukt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantiek">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard bewijst `gateway status` de servicestatus, WebSocket-verbinding en de auth-mogelijkheid die tijdens de handshake zichtbaar is. Het bewijst geen lees-/schrijf-/adminbewerkingen.
    - Diagnostische probes muteren niets voor eerste apparaat-auth: ze hergebruiken een bestaande gecachete apparaattoken wanneer die bestaat, maar maken geen nieuwe CLI-apparaatidentiteit of alleen-lezen-apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde auth-SecretRefs op voor probe-auth wanneer dat mogelijk is.
    - Als een vereiste auth-SecretRef in dit commandopad niet is opgelost, rapporteert `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/auth mislukt; geef `--token`/`--password` expliciet door of los eerst de secretbron op.
    - Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-refs onderdrukt om fout-positieven te vermijden.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en ook lees-scope RPC-aanroepen gezond moeten zijn.
    - `--deep` voegt een best-effort scan toe voor extra launchd/systemd/schtasks-installaties. Wanneer meerdere gateway-achtige services worden gedetecteerd, toont menselijke output opruimhints en waarschuwt dat de meeste setups één Gateway per machine zouden moeten draaien.
    - Menselijke output bevat het opgeloste pad naar het bestandslog plus een snapshot van CLI-versus-service-configuratiepaden/geldigheid om drift in profiel of state-dir te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd-auth-driftcontroles">
    - Op Linux systemd-installaties lezen service-auth-driftcontroles zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, paden met aanhalingstekens, meerdere bestanden en optionele `-`-bestanden).
    - Driftcontroles lossen `gateway.auth.token` SecretRefs op met samengevoegde runtime-env (eerst servicecommando-env, daarna proces-env als fallback).
    - Als token-auth niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles configuratietoken-resolutie over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is het commando om "alles te debuggen". Het probet altijd:

- je geconfigureerde remote Gateway (indien ingesteld), en
- localhost (loopback) **zelfs als remote is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Menselijke output labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere gateways bereikbaar zijn, drukt het ze allemaal af. Meerdere gateways worden ondersteund wanneer je geïsoleerde profielen/poorten gebruikt (bijv. een reddingsbot), maar de meeste installaties draaien nog steeds één Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretatie">
    - `Reachable: yes` betekent dat ten minste één doel een WebSocket-verbinding heeft geaccepteerd.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` rapporteert wat de probe over auth kon bewijzen. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat detail-RPC-aanroepen met lees-scope (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat verbinden is gelukt, maar RPC met lees-scope beperkt is. Dit wordt gerapporteerd als **gedegradeerde** bereikbaarheid, niet als volledige mislukking.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding heeft geaccepteerd, maar dat vervolgleesdiagnostiek is verlopen of mislukt. Dit is ook **gedegradeerde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachete apparaat-auth, maar maakt geen eerste apparaatidentiteit of koppelingsstatus aan.
    - De afsluitcode is alleen niet-nul wanneer geen enkel geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON-output">
    Topniveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel accepteerde een verbinding, maar voltooide niet de volledige detail-RPC-diagnostiek.
    - `capability`: beste mogelijkheid die is gezien bij bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te behandelen in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerde remote en daarna local loopback.
    - `warnings[]`: best-effort waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: local loopback-/tailnet-URL-hints afgeleid van huidige configuratie en hostnetwerk.
    - `discovery.timeoutMs` en `discovery.count`: het werkelijke discoverybudget/aantal resultaten dat voor deze probe-pass is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na verbinden + gedegradeerde classificatie.
    - `rpcOk`: volledige detail-RPC geslaagd.
    - `scopeLimited`: detail-RPC mislukt door ontbrekende operator-scope.

    Per doel (`targets[].auth`):

    - `role`: auth-rol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende scopes gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de getoonde auth-mogelijkheidsclassificatie voor dat doel.

  </Accordion>
  <Accordion title="Veelvoorkomende waarschuwingscodes">
    - `ssh_tunnel_failed`: SSH-tunnel instellen is mislukt; het commando viel terug op directe probes.
    - `multiple_gateways`: meer dan één doel was bereikbaar; dit is ongebruikelijk tenzij je bewust geïsoleerde profielen draait, zoals een reddingsbot.
    - `auth_secretref_unresolved`: een geconfigureerde auth-SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding is gelukt, maar de leesprobe werd beperkt door ontbrekende `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote via SSH (pariteit met Mac-app)

De macOS-appmodus "Remote via SSH" gebruikt een lokale poort-forward zodat de remote Gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

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
  Kies de eerste ontdekte gatewayhost als SSH-doel uit het opgeloste discovery-eindpunt (`local.` plus het geconfigureerde wide-area-domein, indien aanwezig). Hints met alleen TXT worden genegeerd.
</ParamField>

Configuratie (optioneel, gebruikt als standaardwaarden):

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
  Time-outbudget.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Vooral voor agent-achtige RPC's die tussentijdse events streamen vóór een definitieve payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare JSON-output.
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
uitvoerbaar bestand is, schrijft de wrapper naar service-`ProgramArguments` en bewaart
`OPENCLAW_WRAPPER` in de serviceomgeving voor latere geforceerde herinstallaties, updates en doctor-
reparaties.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Om een bewaarde wrapper te verwijderen, wis je `OPENCLAW_WRAPPER` tijdens het herinstalleren:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Commando-opties">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lifecycle-gedrag">
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Schakel `gateway stop` en `gateway start` niet aaneen als vervanging voor opnieuw starten; op macOS schakelt `gateway stop` de LaunchAgent bewust uit voordat die wordt gestopt.
    - `gateway restart --safe` vraagt de actieve Gateway om actief OpenClaw-werk vooraf te controleren en het opnieuw starten uit te stellen tot antwoordlevering, embedded runs en taakruns zijn leeggelopen. `--safe` kan niet worden gecombineerd met `--force` of `--wait`.
    - `gateway restart --wait 30s` overschrijft het geconfigureerde drainbudget voor opnieuw starten voor die herstart. Kale getallen zijn milliseconden; eenheden zoals `s`, `m` en `h` worden geaccepteerd. `--wait 0` wacht onbeperkt.
    - `gateway restart --force` slaat het leeg laten lopen van actief werk over en start onmiddellijk opnieuw. Gebruik dit wanneer een operator de vermelde taakblokkeerders al heeft geïnspecteerd en de Gateway nu terug wil.
    - Lifecycle-commando's accepteren `--json` voor scripts.

  </Accordion>
  <Accordion title="Authenticatie en SecretRefs tijdens installatie">
    - Wanneer tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef oplosbaar is, maar bewaart het opgeloste token niet in de service-omgevingsmetadata.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, mislukt de installatie gesloten in plaats van fallback-plattetekst te bewaren.
    - Gebruik voor wachtwoordauthenticatie bij `gateway run` bij voorkeur `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` in plaats van inline `--password`.
    - In afgeleide authenticatiemodus versoepelt alleen-shell `OPENCLAW_GATEWAY_PASSWORD` de tokenvereisten voor installatie niet; gebruik duurzame configuratie (`gateway.auth.password` of configuratie `env`) bij het installeren van een beheerde service.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant op Gateway-bakens (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split-DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen gateways waarvoor Bonjour-discovery is ingeschakeld (standaard), adverteren het baken.

Wide-Area discovery-records bevatten (TXT):

- `role` (hint voor Gateway-rol)
- `transport` (transporthint, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (optioneel; clients gebruiken standaard `22` als SSH-doel wanneer dit ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, indien beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (remote-install-hint die naar de wide-area-zone wordt geschreven)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per opdracht (bladeren/oplossen).
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
- `wsUrl` in JSON-uitvoer wordt afgeleid van het opgeloste service-eindpunt, niet van alleen-TXT-hints zoals `lanHost` of `tailnetDns`.
- Op `local.` mDNS worden `sshPort` en `cliPath` alleen uitgezonden wanneer `discovery.mdns.mode` `full` is. Wide-area DNS-SD schrijft nog steeds `cliPath`; `sshPort` blijft daar ook optioneel.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
