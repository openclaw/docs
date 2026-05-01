---
read_when:
    - De Gateway uitvoeren vanuit de CLI (ontwikkeling of servers)
    - Gateway-authenticatie, bind-modi en connectiviteit debuggen
    - Gateways ontdekken via Bonjour (lokale + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateways uitvoeren, opvragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-05-01T11:15:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 127a6ccb4baa1ad5e5051db0bc7ef0ed30d410c4c3d13f36356483a6e03dce4c
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (kanalen, knooppunten, sessies, hooks). Subcommando's op deze pagina vallen onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-configuratie.
  </Card>
  <Card title="Discovery overview" href="/nl/gateway/discovery">
    Hoe OpenClaw gateways adverteert en vindt.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration">
    Gateway-configuratiesleutels op hoogste niveau.
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
  <Accordion title="Startup behavior">
    - Standaard weigert de Gateway te starten tenzij `gateway.mode=local` is ingesteld in `~/.openclaw/openclaw.json`. Gebruik `--allow-unconfigured` voor ad-hoc-/dev-uitvoeringen.
    - `openclaw onboard --mode local` en `openclaw setup` worden verwacht `gateway.mode=local` te schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een defecte of overschreven configuratie en herstel die in plaats van impliciet de lokale modus aan te nemen.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert hij voor jou "lokaal te raden".
    - Binden buiten loopback zonder auth wordt geblokkeerd (veiligheidsvangrail).
    - `SIGUSR1` activeert een herstart binnen het proces wanneer dit is geautoriseerd (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatig herstarten te blokkeren, terwijl toepassen/bijwerken via Gateway-tool/config toegestaan blijft).
    - `SIGINT`/`SIGTERM`-handlers stoppen het Gateway-proces, maar ze herstellen geen aangepaste terminalstatus. Als je de CLI met een TUI of raw-mode-invoer omwikkelt, herstel dan de terminal vóór afsluiten.

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
  Tokenoverschrijving (stelt ook `OPENCLAW_GATEWAY_TOKEN` in voor het proces).
</ParamField>
<ParamField path="--password <password>" type="string">
  Wachtwoordoverschrijving.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lees het Gateway-wachtwoord uit een bestand.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Stel de Gateway beschikbaar via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset de Tailscale serve/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta toe dat de Gateway start zonder `gateway.mode=local` in de configuratie. Omzeilt de startbewaking alleen voor ad-hoc-/dev-bootstrap; schrijft of herstelt het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een dev-configuratie + werkruimte aan als die ontbreekt (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset dev-configuratie + referenties + sessies + werkruimte (vereist `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Beëindig elke bestaande listener op de geselecteerde poort vóór het starten.
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
  Log ruwe modelstreamgebeurtenissen naar jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Pad voor ruwe stream-jsonl.
</ParamField>

<Warning>
Inline `--password` kan zichtbaar zijn in lokale proceslijsten. Gebruik bij voorkeur `--password-file`, env, of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Startprofilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens het starten van de Gateway te loggen, inclusief per-fase `eventLoopMax`-vertraging en timings van Plugin-lookup-tabellen voor installed-index, manifestregistry, startplanning en owner-map-werk.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-startdiagnosetijdlijn te schrijven voor externe QA-harnassen. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad wordt nog steeds via env geleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer `pnpm test:startup:gateway -- --runs 5 --warmup 1` uit om het starten van de Gateway te benchmarken. De benchmark registreert de eerste procesuitvoer, `/healthz`, `/readyz`, starttrace-timings, event-loop-vertraging en timingdetails van Plugin-lookup-tabellen.

## Een actieve Gateway bevragen

Alle querycommando's gebruiken WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - Standaard: leesbaar voor mensen (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen styling/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit terwijl de menselijke lay-out behouden blijft.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: Gateway-WebSocket-URL.
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

Het HTTP-eindpunt `/healthz` is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-eindpunt `/readyz` is strenger en blijft rood terwijl runtime-afhankelijkheden van startup-Plugins, sidecars, kanalen of geconfigureerde hooks nog stabiliseren. Lokale of geauthenticeerde gedetailleerde readiness-responsen bevatten een diagnostisch `eventLoop`-blok met event-loop-vertraging, event-loop-benutting, CPU-coreverhouding en een `degraded`-vlag.

### `gateway usage-cost`

Haal samenvattingen van gebruikskosten op uit sessielogs.

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
  Maximumaantal recente gebeurtenissen om op te nemen (max `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op diagnostisch gebeurtenistype, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen gebeurtenissen op na een diagnostisch volgnummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een persistente stabiliteitsbundel in plaats van de actieve Gateway aan te roepen. Gebruik `--bundle latest` (of alleen `--bundle`) voor de nieuwste bundel onder de statusmap, of geef direct een JSON-pad naar een bundel door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare zip met ondersteuningsdiagnostiek in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Records bewaren operationele metadata: gebeurtenisnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/Plugin-namen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, afsluit-time-outs en mislukte herstarts tijdens startup schrijft OpenClaw dezelfde diagnostische momentopname naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder gebeurtenissen heeft. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` zijn ook van toepassing op bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokale diagnostiek-zip die bedoeld is om aan bugrapporten toe te voegen. Zie [Diagnostics Export](/nl/gateway/diagnostics) voor het privacymodel en de bundelinhoud.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Uitvoerpad voor zip. Standaard een ondersteuningsexport onder de statusmap.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximumaantal gesaneerde logregels om op te nemen.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximumaantal logbytes om te inspecteren.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway-WebSocket-URL voor de health-momentopname.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-token voor de health-momentopname.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-wachtwoord voor de health-momentopname.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Time-out voor status-/health-momentopname.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Sla het opzoeken van persistente stabiliteitsbundels over.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het geschreven pad, de grootte en het manifest af als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratievorm, gesaneerde configuratiedetails, gesaneerde logsamenvattingen, gesaneerde Gateway-status-/health-momentopnamen en de nieuwste stabiliteitsbundel wanneer die bestaat.

Deze is bedoeld om te delen. De export bewaart operationele details die helpen bij debugging, zoals veilige OpenClaw-logvelden, subsysteemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, Plugin-id's, provider-id's, niet-geheime feature-instellingen en geredigeerde operationele logberichten. Chattekst, webhook-bodies, tooluitvoer, referenties, cookies, account-/berichtidentificatoren, prompt-/instructietekst, hostnamen en geheime waarden worden weggelaten of geredigeerd. Wanneer een bericht in LogTape-stijl op gebruikers-/chat-/toolpayloadtekst lijkt, bewaart de export alleen dat een bericht is weggelaten plus het byteaantal ervan.

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
  Probe-time-out.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Sla de connectiviteitsprobe over (alleen serviceweergave).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scan ook services op systeemniveau.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Upgrade de standaard connectiviteitsprobe naar een leesprobe en sluit af met niet-nul wanneer die leesprobe mislukt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantiek">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard `gateway status` bewijst de servicestatus, WebSocket-verbinding en de auth-capaciteit die zichtbaar is tijdens de handshake. Het bewijst geen lees-/schrijf-/adminbewerkingen.
    - Diagnostische probes muteren niets voor apparaatauthenticatie bij eerste gebruik: ze hergebruiken een bestaand gecachet apparaattoken wanneer dat bestaat, maar ze maken geen nieuwe CLI-apparaatidentiteit of read-only apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde auth SecretRefs op voor probe-auth wanneer mogelijk.
    - Als een vereiste auth SecretRef niet kan worden opgelost in dit commandopad, rapporteert `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/auth mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
    - Als de probe slaagt, worden waarschuwingen over onopgeloste auth-refs onderdrukt om fout-positieven te voorkomen.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en je ook nodig hebt dat RPC-aanroepen met lees-scope gezond zijn.
    - `--deep` voegt een best-effort scan toe voor extra launchd/systemd/schtasks-installaties. Wanneer meerdere gateway-achtige services worden gedetecteerd, toont menselijke uitvoer opschoontips en waarschuwt dat de meeste setups één Gateway per machine zouden moeten draaien.
    - Menselijke uitvoer bevat het opgeloste bestandslogpad plus een snapshot van CLI-versus-service configuratiepaden/geldigheid om profiel- of state-dir-drift te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd auth-driftcontroles">
    - Op Linux systemd-installaties lezen service-auth-driftcontroles zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, paden tussen aanhalingstekens, meerdere bestanden en optionele `-`-bestanden).
    - Driftcontroles lossen `gateway.auth.token` SecretRefs op met de samengevoegde runtime-env (eerst servicecommando-env, daarna process-env als fallback).
    - Als token-auth niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij password kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles configuratietokenresolutie over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is het commando voor "alles debuggen". Het probet altijd:

- je geconfigureerde externe Gateway (als ingesteld), en
- localhost (loopback) **zelfs als extern is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Menselijke uitvoer labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere Gateways bereikbaar zijn, worden ze allemaal afgedrukt. Meerdere Gateways worden ondersteund wanneer je geïsoleerde profielen/poorten gebruikt (bijvoorbeeld een rescue-bot), maar de meeste installaties draaien nog steeds één Gateway.
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
    - `Read probe: limited - missing scope: operator.read` betekent dat verbinden is geslaagd, maar RPC met lees-scope beperkt is. Dit wordt gerapporteerd als **gedegradeerde** bereikbaarheid, niet als volledige fout.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding heeft geaccepteerd, maar dat opvolgende leesdiagnostiek een timeout had of mislukte. Dit is ook **gedegradeerde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachte apparaatauth, maar maakt het geen apparaatidentiteit of koppelingsstatus voor eerste gebruik aan.
    - Exitcode is alleen niet-nul wanneer geen enkel geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON-uitvoer">
    Topniveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel heeft een verbinding geaccepteerd maar heeft niet de volledige detail-RPC-diagnostiek voltooid.
    - `capability`: beste capaciteit gezien over bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te behandelen in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerde externe Gateway, daarna local loopback.
    - `warnings[]`: best-effort waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: URL-hints voor local loopback/tailnet afgeleid van huidige configuratie en hostnetwerken.
    - `discovery.timeoutMs` en `discovery.count`: het werkelijke discovery-budget/resultaantal dat voor deze probe-pass is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na connect + gedegradeerde classificatie.
    - `rpcOk`: volledig succes van detail-RPC.
    - `scopeLimited`: detail-RPC mislukt door ontbrekende operator-scope.

    Per doel (`targets[].auth`):

    - `role`: auth-rol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende scopes gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de getoonde auth-capaciteitsclassificatie voor dat doel.

  </Accordion>
  <Accordion title="Veelvoorkomende waarschuwingscodes">
    - `ssh_tunnel_failed`: instellen van SSH-tunnel mislukt; het commando viel terug op directe probes.
    - `multiple_gateways`: meer dan één doel was bereikbaar; dit is ongebruikelijk tenzij je bewust geïsoleerde profielen draait, zoals een rescue-bot.
    - `auth_secretref_unresolved`: een geconfigureerde auth SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding is geslaagd, maar de leesprobe werd beperkt door ontbrekende `operator.read`.

  </Accordion>
</AccordionGroup>

#### Extern via SSH (pariteit met Mac-app)

De macOS-appmodus "Remote over SSH" gebruikt een lokale port-forward zodat de externe Gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

CLI-equivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` of `user@host:port` (poort valt standaard terug op `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Identiteitsbestand.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Kies de eerste ontdekte Gateway-host als SSH-doel uit het opgeloste discovery-endpoint (`local.` plus het geconfigureerde wide-area domein, indien aanwezig). TXT-only hints worden genegeerd.
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
  Timeoutbudget.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Vooral voor agent-achtige RPC's die tussentijdse events streamen vóór een finale payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare JSON-uitvoer.
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

Gebruik `--wrapper` wanneer de beheerde service via een ander uitvoerbaar bestand moet starten, bijvoorbeeld een
secrets-manager-shim of een run-as-helper. De wrapper ontvangt de normale Gateway-args en is
verantwoordelijk voor uiteindelijk exec'en van `openclaw` of Node met die args.

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

Om een bewaarde wrapper te verwijderen, maak je `OPENCLAW_WRAPPER` leeg tijdens het herinstalleren:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Commando-opties">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Levenscyclusgedrag">
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Keten `gateway stop` en `gateway start` niet als vervanging voor herstarten; op macOS schakelt `gateway stop` de LaunchAgent bewust uit voordat deze wordt gestopt.
    - Levenscycluscommando's accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Auth en SecretRefs tijdens installatie">
    - Wanneer token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef oplosbaar is, maar wordt het opgeloste token niet bewaard in serviceomgevingsmetadata.
    - Als token-auth een token vereist en de geconfigureerde token-SecretRef onopgelost is, faalt installatie gesloten in plaats van fallback-plaintext te bewaren.
    - Geef voor password-auth op `gateway run` de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` boven inline `--password`.
    - In afgeleide auth-modus versoepelt shell-only `OPENCLAW_GATEWAY_PASSWORD` de tokenvereisten voor installatie niet; gebruik duurzame configuratie (`gateway.auth.password` of config `env`) bij het installeren van een beheerde service.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` is geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant op Gateway-beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen Gateways waarvoor Bonjour-discovery is ingeschakeld (standaard) adverteren de beacon.

Wide-Area discovery-records bevatten (TXT):

- `role` (Gateway-rolhint)
- `transport` (transporthint, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (optioneel; clients gebruiken standaard `22` voor SSH-doelen wanneer dit ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, wanneer beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (hint voor externe installatie geschreven naar de wide-area zone)

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
- De CLI scant `local.` plus het geconfigureerde wide-area-domein wanneer er een is ingeschakeld.
- `wsUrl` in JSON-uitvoer wordt afgeleid van het opgeloste service-eindpunt, niet van hints die alleen uit TXT komen, zoals `lanHost` of `tailnetDns`.
- Op `local.` mDNS worden `sshPort` en `cliPath` alleen uitgezonden wanneer `discovery.mdns.mode` `full` is. Wide-area DNS-SD schrijft nog steeds `cliPath`; `sshPort` blijft daar ook optioneel.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
