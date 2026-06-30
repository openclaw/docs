---
read_when:
    - De Gateway uitvoeren vanuit de CLI (dev of servers)
    - Gateway-authenticatie, bindmodi en connectiviteit debuggen
    - Gateways ontdekken via Bonjour (lokale + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — uitvoeren, bevragen en gateways ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-06-30T14:13:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (kanalen, nodes, sessies, hooks). Subcommando's op deze pagina staan onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-discovery" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-instelling.
  </Card>
  <Card title="Discovery-overzicht" href="/nl/gateway/discovery">
    Hoe OpenClaw gateways adverteert en vindt.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration">
    Gateway-configuratiesleutels op topniveau.
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
    - Van `openclaw onboard --mode local` en `openclaw setup` wordt verwacht dat ze `gateway.mode=local` wegschrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een kapotte of overschreven configuratie en herstel die in plaats van impliciet de lokale modus aan te nemen.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert hij voor u "lokaal te gokken".
    - Binden buiten loopback zonder auth wordt geblokkeerd (veiligheidsvangrail).
    - `lan`, `tailnet` en `custom` worden momenteel opgelost via BYOH-paden die alleen IPv4 ondersteunen.
    - BYOH met alleen IPv6 wordt vandaag niet native ondersteund op dit pad. Gebruik een IPv4-sidecar of proxy als de host zelf alleen IPv6 heeft.
    - `SIGUSR1` activeert een herstart binnen het proces wanneer dat is geautoriseerd (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatige herstart te blokkeren, terwijl toepassen/bijwerken via gateway-tool/configuratie toegestaan blijft).
    - `SIGINT`/`SIGTERM`-handlers stoppen het gateway-proces, maar herstellen geen aangepaste terminalstatus. Als u de CLI verpakt met een TUI of invoer in raw mode, herstel dan de terminal vóór het afsluiten.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaard komt uit config/env; meestal `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindmodus van de listener. `lan`, `tailnet` en `custom` worden momenteel opgelost via paden die alleen IPv4 ondersteunen.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Overschrijving van auth-modus.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-overschrijving (stelt ook `OPENCLAW_GATEWAY_TOKEN` in voor het proces).
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
  Reset de Tailscale serve/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Verwacht momenteel een IPv4-adres. Plaats voor BYOH met alleen IPv6 een IPv4-sidecar of proxy vóór de Gateway en wijs OpenClaw naar dat IPv4-eindpunt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta toe dat gateway start zonder `gateway.mode=local` in de configuratie. Omzeilt de opstartbeveiliging alleen voor ad-hoc-/dev-bootstrap; schrijft of herstelt het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een dev-configuratie + werkruimte aan als die ontbreken (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset dev-configuratie + credentials + sessies + werkruimte (vereist `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Stop elke bestaande listener op de geselecteerde poort voordat wordt gestart.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Uitgebreide logs.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Toon alleen CLI-backendlogs in de console (en schakel stdout/stderr in).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket-logstijl.
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

## De Gateway herstarten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` vraagt de draaiende Gateway om actief werk vooraf te controleren en één samengevoegde herstart te plannen nadat actief werk is afgehandeld. De standaard veilige herstart wacht op actief werk tot de geconfigureerde `gateway.reload.deferralTimeoutMs` (standaard 5 minuten); wanneer dat budget verloopt, wordt de herstart geforceerd. Stel `gateway.reload.deferralTimeoutMs` in op `0` voor onbeperkt veilig wachten dat nooit forceert. Gewone `restart` behoudt het bestaande gedrag van de servicemanager; `--force` blijft het directe overschrijvingspad.

`openclaw gateway restart --safe --skip-deferral` voert dezelfde OpenClaw-bewuste gecoördineerde herstart uit als `--safe`, maar omzeilt de uitstelcontrole voor actief werk, zodat de Gateway de herstart onmiddellijk uitzendt, zelfs wanneer blockers worden gemeld. Gebruik dit als ontsnappingsmogelijkheid voor operators wanneer uitstel is vastgezet door een vastgelopen taakrun en `--safe` alleen mogelijk wordt begrensd door `gateway.reload.deferralTimeoutMs`. `--skip-deferral` vereist `--safe`.

<Warning>
Inline `--password` kan zichtbaar zijn in lokale proceslijsten. Geef de voorkeur aan `--password-file`, env of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Gateway-profilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings te loggen tijdens het opstarten van de Gateway, inclusief per-fase `eventLoopMax`-vertraging en plugin-lookup-table-timings voor installed-index, manifestregister, opstartplanning en owner-map-werk.
- Stel `OPENCLAW_GATEWAY_RESTART_TRACE=1` in om herstartspecifieke `restart trace:`-regels te loggen voor verwerking van herstartsignalen, leegloop van actief werk, afsluitfasen, volgende start, ready-timing en geheugenmetingen.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-opstartdiagnosetijdlijn te schrijven voor externe QA-harnassen. U kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad wordt nog steeds via env aangeleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer eerst `pnpm build` uit en daarna `pnpm test:startup:gateway -- --runs 5 --warmup 1` om het opstarten van de Gateway te benchmarken tegen de gebouwde CLI-entry. De benchmark registreert de eerste procesuitvoer, `/healthz`, `/readyz`, opstarttracetimings, event-loop-vertraging en timingdetails van plugin-lookup-tables.
- Voer eerst `pnpm build` uit en daarna `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` om een in-process Gateway-herstart te benchmarken tegen de gebouwde CLI-entry op macOS of Linux. De herstartbenchmark gebruikt SIGUSR1, schakelt zowel opstart- als herstarttraces in het childproces in, en registreert de volgende `/healthz`, volgende `/readyz`, downtime, ready-timing, CPU, RSS en herstarttracemetrics.
- Behandel `/healthz` als liveness en `/readyz` als bruikbare readiness. Traceregels en benchmarkuitvoer zijn bedoeld voor eigenaartoewijzing; behandel één tracespan of één sample niet als een volledige prestatieconclusie.

## Een draaiende Gateway opvragen

Alle querycommando's gebruiken WebSocket-RPC.

<Tabs>
  <Tab title="Uitvoermodi">
    - Standaard: mensleesbaar (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen styling/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit terwijl de menselijke lay-out behouden blijft.

  </Tab>
  <Tab title="Gedeelde opties">
    - `--url <url>`: Gateway-WebSocket-URL.
    - `--token <token>`: Gateway-token.
    - `--password <password>`: Gateway-wachtwoord.
    - `--timeout <ms>`: timeout/budget (verschilt per commando).
    - `--expect-final`: wacht op een "final"-respons (agentaanroepen).

  </Tab>
</Tabs>

<Note>
Wanneer u `--url` instelt, valt de CLI niet terug op configuratie- of omgevingscredentials. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete credentials is een fout.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Het HTTP-`/healthz`-eindpunt is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-`/readyz`-eindpunt is strenger en blijft rood terwijl opstartende plugin-sidecars, kanalen of geconfigureerde hooks nog aan het stabiliseren zijn. Lokale of geauthenticeerde gedetailleerde readiness-responses bevatten een diagnostisch `eventLoop`-blok met event-loop-vertraging, event-loop-utilisatie, CPU-kernratio en een `degraded`-vlag.

<ParamField path="--port <port>" type="number">
  Richt u op een lokale local loopback-Gateway op deze poort. Dit overschrijft `OPENCLAW_GATEWAY_URL` en `OPENCLAW_GATEWAY_PORT` voor de health-aanroep.
</ParamField>

### `gateway usage-cost`

Haal usage-cost-samenvattingen op uit sessielogs.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Aantal dagen om op te nemen.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Beperk de kostensamenvatting tot één geconfigureerde agent-id.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Aggregeer de kostensamenvatting over alle geconfigureerde agents. Kan niet worden gecombineerd met `--agent`.
</ParamField>

### `gateway stability`

Haal de recente diagnostische stabiliteitsrecorder op van een draaiende Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximumaantal recente gebeurtenissen om op te nemen (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op diagnostisch gebeurtenistype, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen gebeurtenissen op na een diagnostisch volgnummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een opgeslagen stabiliteitsbundel in plaats van de draaiende Gateway aan te roepen. Gebruik `--bundle latest` (of alleen `--bundle`) voor de nieuwste bundel onder de statusdirectory, of geef direct een JSON-pad naar een bundel door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare zip met supportdiagnostiek in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy- en bundelgedrag">
    - Records bewaren operationele metadata: gebeurtenisnamen, aantallen, bytegroottes, geheugenmetingen, wachtrij-/sessiestatus, kanaal-/plugin-namen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, afsluit-timeouts en opstartfouten na herstart schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder gebeurtenissen heeft. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` zijn ook van toepassing op bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokale diagnostiek-zip die is ontworpen om aan bugrapporten toe te voegen. Zie [Diagnostics Export](/nl/gateway/diagnostics) voor het privacymodel en de bundelinhoud.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Uitvoer-zip-pad. Standaard een supportexport onder de statusdirectory.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximaal aantal gesaneerde logregels om op te nemen.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximaal aantal logbytes om te inspecteren.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket-URL voor de gezondheidsmomentopname.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-token voor de gezondheidsmomentopname.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-wachtwoord voor de gezondheidsmomentopname.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Time-out voor status-/gezondheidsmomentopname.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Sla het opzoeken van een persistente stabiliteitsbundel over.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het geschreven pad, de grootte en het manifest af als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratievorm, gesaneerde configuratiedetails, gesaneerde logsamenvattingen, gesaneerde Gateway-status-/gezondheidsmomentopnamen en de nieuwste stabiliteitsbundel wanneer die bestaat.

Deze is bedoeld om te delen. De export behoudt operationele details die helpen bij foutopsporing, zoals veilige OpenClaw-logvelden, subsysteemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, plugin-id's, provider-id's, niet-geheime functie-instellingen en geredigeerde operationele logberichten. Chattekst, webhook-body's, tooluitvoer, referenties, cookies, account-/bericht-ID's, prompt-/instructietekst, hostnamen en geheime waarden worden weggelaten of geredigeerd. Wanneer een LogTape-achtig bericht lijkt op payloadtekst van een gebruiker, chat of tool, behoudt de export alleen dat een bericht is weggelaten plus het aantal bytes.

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
  Upgrade de standaard connectiviteitsprobe naar een leesprobe en sluit af met niet-nul wanneer die leesprobe mislukt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantiek">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard bewijst `gateway status` de servicestatus, WebSocket-verbinding en de auth-capaciteit die zichtbaar is tijdens de handshake. Het bewijst geen lees-/schrijf-/admin-bewerkingen.
    - Diagnostische probes muteren niets voor apparaat-auth bij eerste gebruik: ze hergebruiken een bestaande gecachte apparaattoken wanneer die bestaat, maar ze maken geen nieuwe CLI-apparaatidentiteit of alleen-lezen apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde auth-SecretRefs op voor probe-auth wanneer mogelijk.
    - Als een vereiste auth-SecretRef niet is opgelost in dit commandopad, rapporteert `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/auth mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
    - Als de probe slaagt, worden waarschuwingen over onopgeloste auth-refs onderdrukt om valse positieven te voorkomen.
    - Wanneer probing is ingeschakeld, bevat JSON-uitvoer `gateway.version` wanneer de draaiende Gateway die rapporteert; `--require-rpc` kan terugvallen op de RPC-payload `status.runtimeVersion` als de vervolghandshake-probe geen versiemetadata kan leveren.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en je ook gezonde RPC-aanroepen met leesbereik nodig hebt.
    - `--deep` voegt een best-effort-scan toe voor extra launchd/systemd/schtasks-installaties. Wanneer meerdere gateway-achtige services worden gedetecteerd, drukt menselijke uitvoer opruimhints af en waarschuwt dat de meeste setups één gateway per machine moeten draaien.
    - `--deep` rapporteert ook een recente Gateway-supervisor-herstartoverdracht wanneer het serviceproces schoon is afgesloten voor een externe supervisor-herstart.
    - `--deep` voert configuratievalidatie uit in plugin-bewuste modus (`pluginValidation: "full"`) en toont geconfigureerde plugin-manifestwaarschuwingen (bijvoorbeeld ontbrekende metadata voor kanaalconfiguratie), zodat install- en update-smokechecks ze vinden. Standaard `gateway status` behoudt het snelle alleen-lezenpad dat plugin-validatie overslaat.
    - Menselijke uitvoer bevat het opgeloste bestandslogpad plus de momentopname van CLI-versus-service-configuratiepaden/-geldigheid om drift in profiel of statusdirectory te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd auth-driftcontroles">
    - Bij Linux systemd-installaties lezen service-auth-driftcontroles zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, aangehaalde paden, meerdere bestanden en optionele `-`-bestanden).
    - Driftcontroles lossen `gateway.auth.token` SecretRefs op met de samengevoegde runtime-env (eerst de servicecommand-env, daarna de process-env als fallback).
    - Als token-auth niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles het oplossen van de config-token over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is de opdracht voor "alles debuggen". Deze probet altijd:

- je geconfigureerde remote gateway (indien ingesteld), en
- localhost (loopback) **zelfs als remote is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Menselijke uitvoer labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere probe-doelen bereikbaar zijn, drukt het ze allemaal af. Een SSH-tunnel, TLS/proxy-URL en geconfigureerde remote-URL kunnen allemaal naar dezelfde gateway verwijzen, zelfs wanneer hun transportpoorten verschillen; `multiple_gateways` is gereserveerd voor afzonderlijke of identiteitsambigu bereikbare gateways. Meerdere gateways worden ondersteund wanneer je geïsoleerde profielen gebruikt (bijv. een rescue-bot), maar de meeste installaties draaien nog steeds één gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Gebruik deze poort voor het local loopback-probedoel en de remote poort van de SSH-tunnel. Zonder `--url` selecteert dit het local loopback-doel in plaats van de geconfigureerde gateway-omgevings-URL, omgevingspoort of remote doelen.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretatie">
    - `Reachable: yes` betekent dat ten minste één doel een WebSocket-verbinding heeft geaccepteerd.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` rapporteert wat de probe over auth kon bewijzen. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat RPC-aanroepen met leesbereik voor details (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat verbinding is geslaagd, maar RPC met leesbereik beperkt is. Dit wordt gerapporteerd als **gedegradeerde** bereikbaarheid, niet als volledige fout.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding heeft geaccepteerd, maar dat vervolgleesdiagnostiek een time-out kreeg of mislukte. Dit is ook **gedegradeerde** bereikbaarheid, niet een onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachte apparaat-auth, maar maakt het geen apparaatidentiteit of koppelingsstatus voor eerste gebruik aan.
    - De exitcode is alleen niet-nul wanneer geen enkel geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON-uitvoer">
    Topniveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel heeft een verbinding geaccepteerd, maar heeft geen volledige detail-RPC-diagnostiek voltooid.
    - `capability`: beste capaciteit die over bereikbare doelen is gezien (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te behandelen in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerde remote, daarna local loopback.
    - `warnings[]`: best-effort-waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: local loopback-/tailnet-URL-hints afgeleid van de huidige configuratie en hostnetwerken.
    - `discovery.timeoutMs` en `discovery.count`: het daadwerkelijke discovery-budget/resultaantal dat voor deze probe-run is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na connect + gedegradeerde classificatie.
    - `rpcOk`: volledig detail-RPC-succes.
    - `scopeLimited`: detail-RPC is mislukt door ontbrekend operatorbereik.

    Per doel (`targets[].auth`):

    - `role`: auth-rol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende bereiken gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de getoonde auth-capaciteitsclassificatie voor dat doel.

  </Accordion>
  <Accordion title="Veelvoorkomende waarschuwingscodes">
    - `ssh_tunnel_failed`: het instellen van de SSH-tunnel is mislukt; de opdracht viel terug op directe probes.
    - `multiple_gateways`: afzonderlijke gateway-identiteiten waren bereikbaar, of OpenClaw kon niet bewijzen dat bereikbare doelen dezelfde gateway zijn. Een SSH-tunnel, proxy-URL of geconfigureerde remote-URL naar dezelfde gateway activeert deze waarschuwing niet.
    - `auth_secretref_unresolved`: een geconfigureerde auth-SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding is geslaagd, maar de leesprobe werd beperkt door ontbrekend `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote via SSH (pariteit met Mac-app)

De macOS-appmodus "Remote via SSH" gebruikt een lokale port-forward zodat de remote gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

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
  Kies de eerste ontdekte gateway-host als SSH-doel uit het opgeloste discovery-eindpunt (`local.` plus het geconfigureerde wide-area-domein, indien aanwezig). Hints die alleen TXT zijn, worden genegeerd.
</ParamField>

Configuratie (optioneel, gebruikt als standaardwaarden):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

RPC-helper op laag niveau.

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
shim voor een secrets manager of een run-as-helper. De wrapper ontvangt de normale Gateway-argumenten en is
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
uitvoerbaar bestand is, schrijft de wrapper naar de service-`ProgramArguments` en bewaart
`OPENCLAW_WRAPPER` in de serviceomgeving voor latere geforceerde herinstallaties, updates en doctor-
reparaties.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Om een bewaarde wrapper te verwijderen, maak je `OPENCLAW_WRAPPER` leeg tijdens het opnieuw installeren:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opdrachtopties">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Levenscyclusgedrag">
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Keten `gateway stop` en `gateway start` niet als vervanging voor opnieuw starten.
    - Op macOS gebruikt `gateway stop` standaard `launchctl bootout`, waarmee de LaunchAgent uit de huidige opstartsessie wordt verwijderd zonder blijvende uitschakeling — automatische KeepAlive-herstel blijft actief voor toekomstige crashes en `gateway start` schakelt opnieuw schoon in zonder handmatige `launchctl enable`. Geef `--disable` door om KeepAlive en RunAtLoad blijvend te onderdrukken, zodat de gateway pas opnieuw start bij de volgende expliciete `gateway start`; gebruik dit wanneer een handmatige stop herstarts of systeemherstarts moet overleven.
    - `gateway restart --safe` vraagt de draaiende Gateway om actief werk vooraf te controleren en één samengevoegde herstart te plannen nadat actief werk is afgerond. De standaard veilige herstart wacht op actief werk tot de geconfigureerde `gateway.reload.deferralTimeoutMs` (standaard 5 minuten); wanneer dat budget verloopt, wordt de herstart geforceerd. Stel `gateway.reload.deferralTimeoutMs` in op `0` voor onbeperkt veilig wachten dat nooit forceert. `--safe` kan niet worden gecombineerd met `--force` of `--wait`.
    - `gateway restart --wait 30s` overschrijft het geconfigureerde drainbudget voor herstarten voor die herstart. Kale getallen zijn milliseconden; eenheden zoals `s`, `m` en `h` worden geaccepteerd. `--wait 0` wacht onbeperkt.
    - `gateway restart --safe --skip-deferral` voert de OpenClaw-bewuste veilige herstart uit, maar omzeilt de uitstelpoort zodat de Gateway de herstart onmiddellijk uitgeeft, zelfs wanneer blokkeringen worden gemeld. Nooduitgang voor operators bij vastgelopen task-run-uitstellen; vereist `--safe`.
    - `gateway restart --force` slaat het drainen van actief werk over en herstart onmiddellijk. Gebruik dit wanneer een operator de vermelde taakblokkeringen al heeft geïnspecteerd en de gateway nu terug wil.
    - Levenscyclusopdrachten accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Auth en SecretRefs tijdens installatie">
    - Wanneer token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef kan worden opgelost, maar bewaart het opgeloste token niet in metadata van de serviceomgeving.
    - Als token-auth een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, faalt de installatie veilig gesloten in plaats van fallback-platte tekst te bewaren.
    - Geef voor wachtwoord-auth op `gateway run` de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` boven inline `--password`.
    - In afgeleide auth-modus versoepelt alleen in de shell ingestelde `OPENCLAW_GATEWAY_PASSWORD` de tokenvereisten voor installatie niet; gebruik duurzame configuratie (`gateway.auth.password` of config `env`) wanneer je een beheerde service installeert.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant op Gateway-beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen Gateways waarvoor Bonjour-discovery is ingeschakeld (standaard), adverteren de beacon.

Wide-area-discoveryrecords kunnen deze TXT-hints bevatten:

- `role` (hint voor Gateway-rol)
- `transport` (hint voor transport, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (alleen volledige discoverymodus; clients gebruiken standaard SSH-doelen naar `22` wanneer dit ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, wanneer beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (alleen volledige discoverymodus)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per opdracht (browse/resolve).
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
- Op `local.` mDNS en wide-area DNS-SD worden `sshPort` en `cliPath` alleen gepubliceerd wanneer `discovery.mdns.mode` `full` is.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
