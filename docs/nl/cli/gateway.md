---
read_when:
    - De Gateway uitvoeren vanuit de CLI (dev of servers)
    - Gateway-authenticatie, bind-modi en connectiviteit debuggen
    - Gateways ontdekken via Bonjour (lokale + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateways uitvoeren, opvragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-07-01T08:15:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (kanalen, nodes, sessies, hooks). Subopdrachten op deze pagina staan onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-detectie" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-installatie.
  </Card>
  <Card title="Overzicht van detectie" href="/nl/gateway/discovery">
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
    - Standaard weigert de Gateway te starten tenzij `gateway.mode=local` is ingesteld in `~/.openclaw/openclaw.json`. Gebruik `--allow-unconfigured` voor ad-hoc-/dev-uitvoeringen.
    - Van `openclaw onboard --mode local` en `openclaw setup` wordt verwacht dat ze `gateway.mode=local` schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een defecte of overschreven configuratie en herstel die in plaats van impliciet lokale modus aan te nemen.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert hij voor jou "lokaal te raden".
    - Binding buiten loopback zonder auth wordt geblokkeerd (veiligheidsvangrail).
    - `lan`, `tailnet` en `custom` worden momenteel via IPv4-only BYOH-paden opgelost.
    - IPv6-only BYOH wordt vandaag niet native ondersteund op dit pad. Gebruik een IPv4-sidecar of proxy als de host zelf IPv6-only is.
    - `SIGUSR1` triggert een herstart binnen het proces wanneer geautoriseerd (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatige herstart te blokkeren, terwijl gateway-tool/config apply/update toegestaan blijven).
    - `SIGINT`/`SIGTERM`-handlers stoppen het gateway-proces, maar herstellen geen aangepaste terminalstatus. Als je de CLI met een TUI of raw-mode-invoer omwikkelt, herstel de terminal dan vóór afsluiten.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaard komt uit config/env; meestal `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindmodus van de listener. `lan`, `tailnet` en `custom` worden momenteel via IPv4-only-paden opgelost.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Auth-modusoverschrijving.
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
  Stel de Gateway bloot via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset de Tailscale serve/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Verwacht vandaag een IPv4-adres. Voor IPv6-only BYOH plaats je een IPv4-sidecar of proxy vóór de Gateway en wijs je OpenClaw naar dat IPv4-eindpunt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta toe dat de gateway start zonder `gateway.mode=local` in de configuratie. Omzeilt de opstartvangrail alleen voor ad-hoc-/dev-bootstrap; schrijft of herstelt het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een dev-configuratie + workspace aan als die ontbreken (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset dev-configuratie + referenties + sessies + workspace (vereist `--dev`).
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

`openclaw gateway restart --safe` vraagt de draaiende Gateway om actief werk vooraf te controleren en één samengevoegde herstart te plannen nadat actief werk is verwerkt. De standaard veilige herstart wacht op actief werk tot de geconfigureerde `gateway.reload.deferralTimeoutMs` (standaard 5 minuten); wanneer dat budget verloopt, wordt de herstart geforceerd. Stel `gateway.reload.deferralTimeoutMs` in op `0` voor een onbeperkte veilige wachttijd die nooit forceert. Gewoon `restart` behoudt het bestaande service-managergedrag; `--force` blijft het directe overschrijvingspad.

`openclaw gateway restart --safe --skip-deferral` voert dezelfde OpenClaw-bewuste gecoördineerde herstart uit als `--safe`, maar omzeilt de uitsteltrechter voor actief werk zodat de Gateway de herstart onmiddellijk uitzendt, ook wanneer blockers worden gerapporteerd. Gebruik dit als uitweg voor operators wanneer een uitstel is vastgezet door een vastgelopen taakrun en `--safe` alleen mogelijk begrensd wordt door `gateway.reload.deferralTimeoutMs`. `--skip-deferral` vereist `--safe`.

<Warning>
Inline `--password` kan zichtbaar zijn in lokale proceslijsten. Geef de voorkeur aan `--password-file`, env of een SecretRef-backed `gateway.auth.password`.
</Warning>

### Gateway-profilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens het opstarten van de Gateway te loggen, inclusief per-fase `eventLoopMax`-vertraging en plug-in-lookup-table-timings voor geïnstalleerde index, manifestregister, opstartplanning en owner-map-werk.
- Stel `OPENCLAW_GATEWAY_RESTART_TRACE=1` in om restart-scoped `restart trace:`-regels te loggen voor afhandeling van herstartsignalen, draining van actief werk, afsluitfasen, volgende start, ready-timing en geheugenmetrics.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-opstartdiagnosetijdlijn te schrijven voor externe QA-harnassen. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad wordt nog steeds via env geleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer eerst `pnpm build` uit en daarna `pnpm test:startup:gateway -- --runs 5 --warmup 1` om het opstarten van de Gateway te benchmarken tegen de gebouwde CLI-entry. De benchmark registreert eerste procesuitvoer, `/healthz`, `/readyz`, opstarttracetimings, event-loop-vertraging en timingdetails van de plug-in-lookup-table.
- Voer eerst `pnpm build` uit en daarna `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` om een herstart binnen het Gateway-proces te benchmarken tegen de gebouwde CLI-entry op macOS of Linux. De herstartbenchmark gebruikt SIGUSR1, schakelt zowel opstart- als herstarttraces in het childproces in, en registreert volgende `/healthz`, volgende `/readyz`, downtime, ready-timing, CPU, RSS en herstarttracemetrics.
- Behandel `/healthz` als liveness en `/readyz` als bruikbare readiness. Traceregels en benchmarkuitvoer zijn voor eigenaartoewijzing; behandel één tracespan of één sample niet als een volledige prestatieconclusie.

## Een draaiende Gateway opvragen

Alle queryopdrachten gebruiken WebSocket RPC.

<Tabs>
  <Tab title="Uitvoermodi">
    - Standaard: leesbaar voor mensen (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen styling/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit terwijl de menselijke lay-out behouden blijft.

  </Tab>
  <Tab title="Gedeelde opties">
    - `--url <url>`: Gateway-WebSocket-URL.
    - `--token <token>`: Gateway-token.
    - `--password <password>`: Gateway-wachtwoord.
    - `--timeout <ms>`: timeout/budget (verschilt per opdracht).
    - `--expect-final`: wacht op een "final"-respons (agentaanroepen).

  </Tab>
</Tabs>

<Note>
Wanneer je `--url` instelt, valt de CLI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties zijn een fout.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Het HTTP-eindpunt `/healthz` is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-eindpunt `/readyz` is strenger en blijft rood terwijl opstartende plug-in-sidecars, kanalen of geconfigureerde hooks nog aan het stabiliseren zijn. Lokale of geauthenticeerde gedetailleerde readiness-responsen bevatten een `eventLoop`-diagnoseblok met event-loop-vertraging, event-loop-gebruik, CPU-kernratio en een `degraded`-vlag.

<ParamField path="--port <port>" type="number">
  Richt je op een lokale local loopback Gateway op deze poort. Dit overschrijft `OPENCLAW_GATEWAY_URL` en `OPENCLAW_GATEWAY_PORT` voor de health-aanroep.
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

Haal de recente diagnostische stabiliteitsrecorder op uit een draaiende Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximaal aantal recente gebeurtenissen om op te nemen (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op diagnostisch gebeurtenistype, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen gebeurtenissen op na een diagnostisch volgnummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een bewaarde stabiliteitsbundel in plaats van de draaiende Gateway aan te roepen. Gebruik `--bundle latest` (of gewoon `--bundle`) voor de nieuwste bundel onder de state-directory, of geef direct een bundel-JSON-pad door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare supportdiagnostiek-zip in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy en bundelgedrag">
    - Records bewaren operationele metadata: gebeurtenisnamen, aantallen, bytegroottes, geheugenmetingen, queue-/sessiestatus, approval-id's, kanaal-/plug-innamen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, afsluit-timeouts en opstartherstartfouten schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder gebeurtenissen heeft. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` zijn ook van toepassing op bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokale diagnostiek-zip die is ontworpen om aan bugrapporten toe te voegen. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en de bundelinhoud.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Uitvoerpad voor zipbestand. Standaard een ondersteuningsexport onder de state-directory.
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
  Sla het opzoeken van een opgeslagen stabiliteitsbundel over.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het geschreven pad, de grootte en het manifest af als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratievorm, opgeschoonde configuratiedetails, opgeschoonde logsamenvattingen, opgeschoonde Gateway-status-/health-snapshots en de nieuwste stabiliteitsbundel wanneer die bestaat.

Deze is bedoeld om te delen. De export behoudt operationele details die helpen bij debugging, zoals veilige OpenClaw-logvelden, subsystemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, plugin-id's, provider-id's, niet-geheime functie-instellingen en geredigeerde operationele logberichten. Chattekst, webhook-body's, tooluitvoer, inloggegevens, cookies, account-/bericht-ID's, prompt-/instructietekst, hostnamen en geheime waarden worden weggelaten of geredigeerd. Wanneer een LogTape-achtig bericht lijkt op payloadtekst van een gebruiker/chat/tool, bewaart de export alleen dat een bericht is weggelaten plus het aantal bytes ervan.

### `gateway status`

`gateway status` toont de Gateway-service (launchd/systemd/schtasks) plus een optionele probe van connectiviteit/auth-mogelijkheid.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Voeg een expliciet probe-doel toe. Geconfigureerde externe doelen + localhost worden nog steeds geprobed.
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
  Upgrade de standaard connectiviteitsprobe naar een leesprobe en sluit af met een niet-nulcode wanneer die leesprobe mislukt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard bewijst `gateway status` de servicestatus, WebSocket-verbinding en de auth-mogelijkheid die zichtbaar is tijdens de handshake. Het bewijst geen lees-/schrijf-/adminbewerkingen.
    - Diagnostische probes wijzigen niets voor eerste apparaatauth: ze hergebruiken een bestaande gecachete apparaattoken wanneer die bestaat, maar maken geen nieuwe CLI-apparaatidentiteit of alleen-lezen apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde auth-SecretRefs voor probe-auth op wanneer mogelijk.
    - Als een vereiste auth-SecretRef in dit opdrachtpad niet is opgelost, rapporteert `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/auth mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
    - Als de probe slaagt, worden waarschuwingen over onopgeloste auth-verwijzingen onderdrukt om fout-positieven te vermijden.
    - Wanneer proben is ingeschakeld, bevat JSON-uitvoer `gateway.version` wanneer de actieve Gateway dit rapporteert; `--require-rpc` kan terugvallen op de RPC-payload `status.runtimeVersion` als de vervolghandshakeprobe geen versiemetadata kan leveren.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en je ook gezonde RPC-aanroepen met leesbereik nodig hebt.
    - `--deep` voegt een best-effort scan toe voor extra launchd/systemd/schtasks-installaties. Wanneer meerdere gateway-achtige services worden gedetecteerd, drukt menselijke uitvoer opruimtips af en waarschuwt dat de meeste setups één gateway per machine zouden moeten draaien.
    - `--deep` rapporteert ook een recente Gateway-supervisor-herstartoverdracht wanneer het serviceproces netjes is afgesloten voor een externe supervisor-herstart.
    - `--deep` voert configuratievalidatie uit in plugin-bewuste modus (`pluginValidation: "full"`) en toont geconfigureerde Plugin-manifestwaarschuwingen (bijvoorbeeld ontbrekende metadata voor kanaalconfiguratie), zodat smokechecks voor installatie en updates ze opvangen. Standaard `gateway status` houdt het snelle alleen-lezen pad dat Plugin-validatie overslaat.
    - Menselijke uitvoer bevat het opgeloste bestandslogpad plus de snapshot van CLI-versus-serviceconfiguratiepaden/-geldigheid om profiel- of state-dir-afwijking te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Op Linux-systemd-installaties lezen controles op service-auth-afwijking zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, gequote paden, meerdere bestanden en optionele `-`-bestanden).
    - Afwijkingscontroles lossen `gateway.auth.token` SecretRefs op met de samengevoegde runtime-env (eerst serviceopdracht-env, daarna process-env als fallback).
    - Als token-auth niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of mode niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-afwijkingscontroles het oplossen van de configuratietoken over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is de opdracht voor "alles debuggen". Deze probet altijd:

- je geconfigureerde externe gateway (indien ingesteld), en
- localhost (local loopback) **zelfs als extern is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Menselijke uitvoer labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere probe-doelen bereikbaar zijn, drukt de opdracht ze allemaal af. Een SSH-tunnel, TLS/proxy-URL en geconfigureerde externe URL kunnen allemaal naar dezelfde gateway wijzen, zelfs wanneer hun transportpoorten verschillen; `multiple_gateways` is gereserveerd voor afzonderlijke of qua identiteit ambigue bereikbare gateways. Meerdere gateways worden ondersteund wanneer je geïsoleerde profielen gebruikt (bijv. een rescue-bot), maar de meeste installaties draaien nog steeds één gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Gebruik deze poort voor het lokale local loopback-probe-doel en de externe poort van de SSH-tunnel. Zonder `--url` selecteert dit het lokale local loopback-doel in plaats van de geconfigureerde gateway-omgevings-URL, omgevingspoort of externe doelen.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` betekent dat ten minste één doel een WebSocket-verbinding heeft geaccepteerd.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` rapporteert wat de probe kon bewijzen over auth. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat detail-RPC-aanroepen met leesbereik (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat verbinden is geslaagd, maar RPC met leesbereik beperkt is. Dit wordt gerapporteerd als **gedegradeerde** bereikbaarheid, niet als volledige mislukking.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding heeft geaccepteerd, maar dat vervolgleesdiagnostiek is verlopen of mislukt. Dit is ook **gedegradeerde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachete apparaatauth, maar maakt geen eerste apparaatidentiteit of koppelingsstatus aan.
    - De afsluitcode is alleen niet-nul wanneer geen geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON output">
    Bovenste niveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel accepteerde een verbinding maar voltooide niet de volledige detail-RPC-diagnostiek.
    - `capability`: beste mogelijkheid gezien over bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te behandelen in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerd extern doel, daarna local loopback.
    - `warnings[]`: best-effort waarschuwingsrecords met `code`, `message` en optioneel `targetIds`.
    - `network`: local loopback-/tailnet-URL-hints afgeleid van huidige configuratie en hostnetwerk.
    - `discovery.timeoutMs` en `discovery.count`: het werkelijke discovery-budget/resultaantal dat voor deze probe-pass is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na verbinden + gedegradeerde classificatie.
    - `rpcOk`: volledige detail-RPC gelukt.
    - `scopeLimited`: detail-RPC mislukt door ontbrekend operatorbereik.

    Per doel (`targets[].auth`):

    - `role`: auth-rol gerapporteerd in `hello-ok` indien beschikbaar.
    - `scopes`: toegekende scopes gerapporteerd in `hello-ok` indien beschikbaar.
    - `capability`: de getoonde auth-mogelijkheidsclassificatie voor dat doel.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: instellen van SSH-tunnel mislukt; de opdracht viel terug op directe probes.
    - `multiple_gateways`: afzonderlijke gateway-identiteiten waren bereikbaar, of OpenClaw kon niet bewijzen dat bereikbare doelen dezelfde gateway zijn. Een SSH-tunnel, proxy-URL of geconfigureerde externe URL naar dezelfde gateway triggert deze waarschuwing niet.
    - `auth_secretref_unresolved`: een geconfigureerde auth-SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding is geslaagd, maar de leesprobe werd beperkt door ontbrekende `operator.read`.

  </Accordion>
</AccordionGroup>

#### Extern via SSH (pariteit met Mac-app)

De macOS-appmodus "Remote over SSH" gebruikt een lokale port-forward zodat de externe gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

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
  Kies de eerste ontdekte gateway-host als SSH-doel uit het opgeloste discovery-eindpunt (`local.` plus het geconfigureerde wide-area domein, indien aanwezig). Hints die alleen TXT zijn, worden genegeerd.
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
  Vooral voor agent-achtige RPC's die tussentijdse gebeurtenissen streamen vóór een definitieve payload.
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

Gebruik `--wrapper` wanneer de beheerde service via een ander uitvoerbaar bestand moet starten, bijvoorbeeld een shim voor een geheimenbeheerder of een run-as-helper. De wrapper ontvangt de normale Gateway-argumenten en is verantwoordelijk om uiteindelijk `openclaw` of Node met die argumenten uit te voeren.

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

Je kunt de wrapper ook via de omgeving instellen. `gateway install` valideert dat het pad een uitvoerbaar bestand is, schrijft de wrapper naar service `ProgramArguments` en bewaart `OPENCLAW_WRAPPER` in de serviceomgeving voor latere geforceerde herinstallaties, updates en doctor-reparaties.

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
  <Accordion title="Opdrachtopties">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Levenscyclusgedrag">
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Keten `gateway stop` en `gateway start` niet als vervanging voor een herstart.
    - Op macOS gebruikt `gateway stop` standaard `launchctl bootout`, waarmee de LaunchAgent uit de huidige bootsessie wordt verwijderd zonder een uitschakeling permanent te maken — automatisch herstel via KeepAlive blijft actief voor toekomstige crashes en `gateway start` schakelt weer schoon in zonder handmatige `launchctl enable`. Geef `--disable` door om KeepAlive en RunAtLoad permanent te onderdrukken, zodat de gateway niet opnieuw opstart tot de volgende expliciete `gateway start`; gebruik dit wanneer een handmatige stop herstarts of systeemherstarts moet overleven.
    - `gateway restart --safe` vraagt de actieve Gateway om actief werk vooraf te controleren en één samengevoegde herstart te plannen nadat actief werk is leeggemaakt. De standaard veilige herstart wacht op actief werk tot de geconfigureerde `gateway.reload.deferralTimeoutMs` (standaard 5 minuten); wanneer dat budget verloopt, wordt de herstart geforceerd. Stel `gateway.reload.deferralTimeoutMs` in op `0` voor onbeperkt veilig wachten dat nooit forceert. `--safe` kan niet worden gecombineerd met `--force` of `--wait`.
    - `gateway restart --wait 30s` overschrijft het geconfigureerde drainbudget voor die herstart. Losse getallen zijn milliseconden; eenheden zoals `s`, `m` en `h` worden geaccepteerd. `--wait 0` wacht onbeperkt.
    - `gateway restart --safe --skip-deferral` voert de OpenClaw-bewuste veilige herstart uit, maar omzeilt de uitstelpoort zodat de Gateway de herstart onmiddellijk uitzendt, zelfs wanneer blokkades worden gemeld. Dit is een ontsnappingsroute voor operators bij vastgelopen uitstel van taakuitvoeringen; vereist `--safe`.
    - `gateway restart --force` slaat het leegmaken van actief werk over en herstart onmiddellijk. Gebruik dit wanneer een operator de vermelde taakblokkades al heeft geïnspecteerd en de gateway nu terug wil hebben.
    - Levenscyclusopdrachten accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Authenticatie en SecretRefs tijdens installatie">
    - Wanneer tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef oplosbaar is, maar bewaart het opgeloste token niet in metadata van de serviceomgeving.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, mislukt de installatie gesloten in plaats van terug te vallen op platte tekst.
    - Voor wachtwoordauthenticatie bij `gateway run` geef je de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` boven inline `--password`.
    - In afgeleide authenticatiemodus versoepelt alleen-shell `OPENCLAW_GATEWAY_PASSWORD` de tokenvereisten voor installatie niet; gebruik duurzame configuratie (`gateway.auth.password` of config `env`) wanneer je een beheerde service installeert.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant naar Gateway-beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen gateways waarvoor Bonjour-discovery is ingeschakeld (standaard) adverteren de beacon.

Wide-area discovery-records kunnen deze TXT-hints bevatten:

- `role` (hint voor gatewayrol)
- `transport` (transporthint, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (alleen volledige discoverymodus; clients gebruiken standaard SSH-doelen op `22` wanneer deze ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, indien beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (alleen volledige discoverymodus)

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
- `wsUrl` in JSON-uitvoer wordt afgeleid van het opgeloste service-eindpunt, niet van alleen-TXT-hints zoals `lanHost` of `tailnetDns`.
- Op `local.` mDNS en wide-area DNS-SD worden `sshPort` en `cliPath` alleen gepubliceerd wanneer `discovery.mdns.mode` `full` is.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
