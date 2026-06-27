---
read_when:
    - De Gateway uitvoeren vanuit de CLI (dev of servers)
    - Gateway-authenticatie, bind-modi en connectiviteit debuggen
    - Gateways ontdekken via Bonjour (lokaal + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateways draaien, opvragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:19:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (kanalen, nodes, sessies, hooks). Subcommando's op deze pagina vallen onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-detectie" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-configuratie.
  </Card>
  <Card title="Detectie-overzicht" href="/nl/gateway/discovery">
    Hoe OpenClaw gateways aankondigt en vindt.
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

Alias voor uitvoering op de voorgrond:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    - Standaard weigert de Gateway te starten tenzij `gateway.mode=local` is ingesteld in `~/.openclaw/openclaw.json`. Gebruik `--allow-unconfigured` voor ad-hoc-/dev-runs.
    - `openclaw onboard --mode local` en `openclaw setup` worden geacht `gateway.mode=local` te schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een defecte of overschreven configuratie en herstel die in plaats van impliciet uit te gaan van lokale modus.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert hij voor jou "lokaal te raden".
    - Binden buiten loopback zonder auth wordt geblokkeerd (veiligheidsvangrail).
    - `lan`, `tailnet` en `custom` worden momenteel opgelost via BYOH-paden met alleen IPv4.
    - BYOH met alleen IPv6 wordt vandaag niet native ondersteund op dit pad. Gebruik een IPv4-sidecar of proxy als de host zelf alleen IPv6 heeft.
    - `SIGUSR1` triggert een in-process herstart wanneer geautoriseerd (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatige herstart te blokkeren, terwijl gateway-tool/config apply/update toegestaan blijven).
    - `SIGINT`/`SIGTERM`-handlers stoppen het gateway-proces, maar herstellen geen aangepaste terminalstatus. Als je de CLI met een TUI of raw-mode invoer omwikkelt, herstel dan de terminal voor afsluiten.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaard komt uit config/env; meestal `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindmodus van listener. `lan`, `tailnet` en `custom` worden momenteel opgelost via paden met alleen IPv4.
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
  Lees het gateway-wachtwoord uit een bestand.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Stel de Gateway beschikbaar via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset de Tailscale serve/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Verwacht vandaag een IPv4-adres. Voor BYOH met alleen IPv6 plaats je een IPv4-sidecar of proxy vóór de Gateway en wijs je OpenClaw naar dat IPv4-eindpunt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta toe dat de gateway start zonder `gateway.mode=local` in de configuratie. Omzeilt de opstartbeveiliging alleen voor ad-hoc-/dev-bootstrap; schrijft of herstelt het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een dev-configuratie + workspace aan als die ontbreekt (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset dev-configuratie + referenties + sessies + workspace (vereist `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Beëindig elke bestaande listener op de geselecteerde poort voordat er wordt gestart.
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
  Log ruwe modelstreamevents naar jsonl.
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

`openclaw gateway restart --safe` vraagt de actieve Gateway om actief OpenClaw-werk vooraf te controleren voordat hij herstart. Als wachtrijbewerkingen, aflevering van antwoorden, embedded runs of taakruns actief zijn, meldt de Gateway de blokkades, voegt dubbele veilige herstartverzoeken samen en herstart zodra het actieve werk is leeggelopen. Gewone `restart` behoudt het bestaande service-managergedrag voor compatibiliteit. Gebruik `--force` alleen wanneer je expliciet het onmiddellijke overschrijvingspad wilt.

`openclaw gateway restart --safe --skip-deferral` voert dezelfde OpenClaw-bewuste gecoördineerde herstart uit als `--safe`, maar omzeilt de uitsteldrempel voor actief werk zodat de Gateway de herstart onmiddellijk uitzendt, zelfs wanneer blokkades worden gemeld. Gebruik dit als nooduitgang voor de operator wanneer uitstel is vastgezet door een vastgelopen taakrun en alleen `--safe` onbeperkt zou wachten. `--skip-deferral` vereist `--safe`.

<Warning>
Inline `--password` kan zichtbaar zijn in lokale proceslijsten. Geef de voorkeur aan `--password-file`, env, of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Gateway-profilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens Gateway-opstart te loggen, inclusief per-fase `eventLoopMax`-vertraging en timings voor Plugin lookup-tabellen voor installed-index, manifest registry, startup planning en owner-map-werk.
- Stel `OPENCLAW_GATEWAY_RESTART_TRACE=1` in om restart-scoped `restart trace:`-regels te loggen voor verwerking van herstartsignalen, leegloop van actief werk, afsluitfasen, volgende start, ready-timing en geheugenmetrics.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-opstartdiagnosetijdlijn te schrijven voor externe QA-harnassen. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad wordt nog steeds via env geleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer eerst `pnpm build` uit, daarna `pnpm test:startup:gateway -- --runs 5 --warmup 1` om Gateway-opstart te benchmarken tegen de gebouwde CLI-entry. De benchmark registreert eerste procesuitvoer, `/healthz`, `/readyz`, startup trace-timings, event-loop-vertraging en timingdetails van Plugin lookup-tabellen.
- Voer eerst `pnpm build` uit, daarna `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` om in-process Gateway-herstart te benchmarken tegen de gebouwde CLI-entry op macOS of Linux. De herstartbenchmark gebruikt SIGUSR1, schakelt zowel opstart- als herstarttraces in het child-proces in, en registreert volgende `/healthz`, volgende `/readyz`, downtime, ready-timing, CPU, RSS en restart trace-metrics.
- Behandel `/healthz` als liveness en `/readyz` als bruikbare readiness. Trace-regels en benchmarkuitvoer zijn voor eigenaarstoewijzing; behandel één trace-span of één sample niet als een volledige prestatieconclusie.

## Een actieve Gateway bevragen

Alle querycommando's gebruiken WebSocket RPC.

<Tabs>
  <Tab title="Uitvoermodi">
    - Standaard: door mensen leesbaar (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen styling/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit terwijl de menselijke lay-out behouden blijft.

  </Tab>
  <Tab title="Gedeelde opties">
    - `--url <url>`: Gateway WebSocket-URL.
    - `--token <token>`: Gateway-token.
    - `--password <password>`: Gateway-wachtwoord.
    - `--timeout <ms>`: timeout/budget (verschilt per commando).
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

Het HTTP-eindpunt `/healthz` is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-eindpunt `/readyz` is strenger en blijft rood terwijl opstartende Plugin-sidecars, kanalen of geconfigureerde hooks nog aan het stabiliseren zijn. Lokale of geauthenticeerde gedetailleerde readiness-responsen bevatten een diagnostisch `eventLoop`-blok met event-loop-vertraging, event-loop-benutting, CPU-coreverhouding en een `degraded`-vlag.

<ParamField path="--port <port>" type="number">
  Richt je op een lokale loopback-Gateway op deze poort. Dit overschrijft `OPENCLAW_GATEWAY_URL` en `OPENCLAW_GATEWAY_PORT` voor de health-aanroep.
</ParamField>

### `gateway usage-cost`

Haal gebruikskostenoverzichten op uit sessielogs.

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
  Beperk het kostenoverzicht tot één geconfigureerde agent-id.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Aggregeer het kostenoverzicht over alle geconfigureerde agents. Kan niet worden gecombineerd met `--agent`.
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
  Maximum aantal recente events om op te nemen (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op type diagnostisch event, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen events op na een diagnostisch volgnummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een bewaarde stabiliteitsbundel in plaats van de actieve Gateway aan te roepen. Gebruik `--bundle latest` (of alleen `--bundle`) voor de nieuwste bundel onder de state-directory, of geef rechtstreeks een JSON-pad naar een bundel door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare zip met supportdiagnostiek in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy en bundelgedrag">
    - Records bewaren operationele metadata: eventnamen, aantallen, bytegroottes, geheugenmetingen, wachtrij-/sessiestatus, kanaal-/Plugin-namen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, afsluit-timeouts en mislukte herstartopstarts schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder events heeft. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` gelden ook voor bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokale diagnostiek-zip die is ontworpen om aan bugrapporten te koppelen. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en de bundelinhoud.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Uitvoer-zip-pad. Standaard naar een supportexport onder de statusmap.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximaal aantal opgeschoonde logregels om op te nemen.
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
  Sla zoeken naar vastgelegde stabiliteitsbundel over.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het geschreven pad, de grootte en het manifest af als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratievorm, opgeschoonde configuratiedetails, opgeschoonde logsamenvattingen, opgeschoonde Gateway-status-/gezondheidsmomentopnamen en de nieuwste stabiliteitsbundel wanneer die bestaat.

De export is bedoeld om te delen. Deze behoudt operationele details die helpen bij foutopsporing, zoals veilige OpenClaw-logvelden, subsysteemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, Plugin-id's, provider-id's, niet-geheime functie-instellingen en geredigeerde operationele logberichten. Chattekst, webhook-bodies, tooluitvoer, aanmeldgegevens, cookies, account-/bericht-id's, prompt-/instructietekst, hostnamen en geheime waarden worden weggelaten of geredigeerd. Wanneer een LogTape-achtig bericht lijkt op payloadtekst van een gebruiker, chat of tool, behoudt de export alleen dat een bericht is weggelaten plus het aantal bytes.

### `gateway status`

`gateway status` toont de Gateway-service (launchd/systemd/schtasks) plus een optionele probe van connectiviteit-/authenticatiemogelijkheid.

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
  Probe-time-out.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Sla de connectiviteitsprobe over (alleen serviceweergave).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scan ook services op systeemniveau.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Upgrade de standaard connectiviteitsprobe naar een leesprobe en sluit af met een niet-nulcode wanneer die leesprobe faalt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantiek">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard bewijst `gateway status` de servicestatus, WebSocket-verbinding en de authenticatiemogelijkheid die tijdens de handshake zichtbaar is. Het bewijst geen lees-/schrijf-/beheerbewerkingen.
    - Diagnostische probes wijzigen niets voor eerste apparaatauthenticatie: ze hergebruiken een bestaand gecachet apparaattoken wanneer dat bestaat, maar ze maken geen nieuwe CLI-apparaatidentiteit of alleen-lezen apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde authenticatie-SecretRefs voor probe-authenticatie op wanneer mogelijk.
    - Als een vereiste authenticatie-SecretRef in dit commandopad niet kan worden opgelost, rapporteert `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/-authenticatie faalt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
    - Als de probe slaagt, worden waarschuwingen over niet-opgeloste authenticatieverwijzingen onderdrukt om fout-positieven te voorkomen.
    - Wanneer proben is ingeschakeld, bevat JSON-uitvoer `gateway.version` wanneer de actieve Gateway dit rapporteert; `--require-rpc` kan terugvallen op de RPC-payload `status.runtimeVersion` als de opvolgende handshake-probe geen versiemetadata kan leveren.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en ook leesbereik-RPC-aanroepen gezond moeten zijn.
    - `--deep` voegt een best-effort-scan toe voor extra launchd-/systemd-/schtasks-installaties. Wanneer meerdere gateway-achtige services worden gedetecteerd, drukt menselijke uitvoer opruimhints af en waarschuwt dat de meeste setups één Gateway per machine zouden moeten uitvoeren.
    - `--deep` rapporteert ook een recente overdracht voor herstart door de Gateway-supervisor wanneer het serviceproces netjes is afgesloten voor een externe supervisorherstart.
    - `--deep` voert configuratievalidatie uit in Plugin-bewuste modus (`pluginValidation: "full"`) en toont waarschuwingen uit geconfigureerde Plugin-manifesten (bijvoorbeeld ontbrekende kanaalconfiguratiemetadata), zodat rooktests voor installatie en update ze vangen. Standaard `gateway status` behoudt het snelle alleen-lezen pad dat Plugin-validatie overslaat.
    - Menselijke uitvoer bevat het opgeloste bestandslogpad plus de momentopname van CLI-versus-service-configuratiepaden/-geldigheid om drift in profiel of statusmap te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd-controles op authenticatiedrift">
    - Op Linux systemd-installaties lezen controles op service-authenticatiedrift zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, gequote paden, meerdere bestanden en optionele `-`-bestanden).
    - Driftcontroles lossen `gateway.auth.token` SecretRefs op met de samengevoegde runtime-omgeving (eerst de omgeving van de serviceopdracht, daarna de procesomgeving als fallback).
    - Als tokenauthenticatie niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles het oplossen van het configuratietoken over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is de opdracht voor "alles debuggen". Deze probet altijd:

- je geconfigureerde remote Gateway (indien ingesteld), en
- localhost (loopback) **zelfs als remote is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Menselijke uitvoer labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere probe-doelen bereikbaar zijn, worden ze allemaal afgedrukt. Een SSH-tunnel, TLS-/proxy-URL en geconfigureerde remote URL kunnen allemaal naar dezelfde Gateway wijzen, zelfs wanneer hun transportpoorten verschillen; `multiple_gateways` is gereserveerd voor verschillende of qua identiteit ambigue bereikbare Gateways. Meerdere Gateways worden ondersteund wanneer je geïsoleerde profielen gebruikt (bijv. een reddingsbot), maar de meeste installaties draaien nog steeds één Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Gebruik deze poort voor het lokale loopback-probedoel en de remote poort van de SSH-tunnel. Zonder `--url` selecteert dit het lokale loopback-doel in plaats van de geconfigureerde Gateway-omgevings-URL, omgevingspoort of remote doelen.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretatie">
    - `Reachable: yes` betekent dat ten minste één doel een WebSocket-verbinding accepteerde.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` rapporteert wat de probe kon bewijzen over authenticatie. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat RPC-aanroepen voor leesbereikdetails (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat verbinden is gelukt, maar dat RPC met leesbereik beperkt is. Dit wordt gerapporteerd als **gedegradeerde** bereikbaarheid, niet als volledige fout.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding accepteerde, maar dat opvolgende leesdiagnostiek een time-out kreeg of faalde. Dit is ook **gedegradeerde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachete apparaatauthenticatie, maar maakt geen eerste apparaatidentiteit of koppelingsstatus aan.
    - De exitcode is alleen niet-nul wanneer geen geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON-uitvoer">
    Bovenste niveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel accepteerde een verbinding maar voltooide de volledige detail-RPC-diagnostiek niet.
    - `capability`: beste mogelijkheid gezien over bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om te behandelen als de actieve winnaar in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerde remote, daarna local loopback.
    - `warnings[]`: best-effort waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: local loopback-/tailnet-URL-hints afgeleid van huidige configuratie en hostnetwerk.
    - `discovery.timeoutMs` en `discovery.count`: het daadwerkelijke discoverybudget/resultaantal dat voor deze probe-passage is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na verbinding + gedegradeerde classificatie.
    - `rpcOk`: volledige detail-RPC geslaagd.
    - `scopeLimited`: detail-RPC faalde door ontbrekend operatorbereik.

    Per doel (`targets[].auth`):

    - `role`: authenticatierol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende bereiken gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de getoonde classificatie van authenticatiemogelijkheid voor dat doel.

  </Accordion>
  <Accordion title="Veelvoorkomende waarschuwingscodes">
    - `ssh_tunnel_failed`: instellen van SSH-tunnel is mislukt; de opdracht viel terug op directe probes.
    - `multiple_gateways`: verschillende Gateway-identiteiten waren bereikbaar, of OpenClaw kon niet bewijzen dat bereikbare doelen dezelfde Gateway zijn. Een SSH-tunnel, proxy-URL of geconfigureerde remote URL naar dezelfde Gateway triggert deze waarschuwing niet.
    - `auth_secretref_unresolved`: een geconfigureerde authenticatie-SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding is gelukt, maar de leesprobe werd beperkt door ontbrekende `operator.read`.

  </Accordion>
</AccordionGroup>

#### Extern via SSH (pariteit met Mac-app)

De macOS-appmodus "Extern via SSH" gebruikt een lokale port-forward zodat de remote Gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

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
  Kies de eerst ontdekte Gateway-host als SSH-doel uit het opgeloste discovery-eindpunt (`local.` plus het geconfigureerde wide-area-domein, indien aanwezig). Hints die alleen TXT zijn, worden genegeerd.
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
  JSON-objecttekenreeks voor params.
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
  Voornamelijk voor agent-achtige RPC's die tussenliggende gebeurtenissen streamen vóór een definitieve payload.
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

Use `--wrapper` wanneer de beheerde service via een ander uitvoerbaar bestand moet starten, bijvoorbeeld een
shim voor geheimenbeheer of een uitvoeren-als-helper. De wrapper ontvangt de normale Gateway-argumenten en is
ervoor verantwoordelijk om uiteindelijk `openclaw` of Node met die argumenten te exec'en.

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

Om een bewaarde wrapper te verwijderen, leeg je `OPENCLAW_WRAPPER` tijdens het herinstalleren:

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
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Keten `gateway stop` en `gateway start` niet aan elkaar als vervanging voor opnieuw starten.
    - Op macOS gebruikt `gateway stop` standaard `launchctl bootout`, waarmee de LaunchAgent uit de huidige opstartsessie wordt verwijderd zonder een uitschakeling te bewaren — KeepAlive-autoherstel blijft actief voor toekomstige crashes en `gateway start` schakelt weer netjes in zonder handmatige `launchctl enable`. Geef `--disable` door om KeepAlive en RunAtLoad blijvend te onderdrukken, zodat de gateway niet opnieuw start tot de volgende expliciete `gateway start`; gebruik dit wanneer een handmatige stop herstarts of systeemherstarts moet overleven.
    - `gateway restart --safe` vraagt de draaiende Gateway om actief OpenClaw-werk vooraf te controleren en de herstart uit te stellen totdat antwoordbezorging, ingebedde runs en taakruns zijn leeggemaakt. `--safe` kan niet worden gecombineerd met `--force` of `--wait`.
    - `gateway restart --wait 30s` overschrijft het geconfigureerde budget voor herstart-drain voor die herstart. Kale getallen zijn milliseconden; eenheden zoals `s`, `m` en `h` worden geaccepteerd. `--wait 0` wacht onbeperkt.
    - `gateway restart --safe --skip-deferral` voert de OpenClaw-bewuste veilige herstart uit, maar omzeilt de uitstelfase zodat de Gateway de herstart onmiddellijk uitzendt, zelfs wanneer blokkeringen worden gemeld. Vluchtroute voor operators bij vastgelopen taakrun-uitstel; vereist `--safe`.
    - `gateway restart --force` slaat het leegmaken van actief werk over en herstart onmiddellijk. Gebruik dit wanneer een operator de vermelde taakblokkeringen al heeft geïnspecteerd en de gateway nu terug wil.
    - Levenscyclusopdrachten accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Auth en SecretRefs tijdens installatie">
    - Wanneer token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef kan worden opgelost, maar bewaart het opgeloste token niet in de omgevingsmetadata van de service.
    - Als token-auth een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, mislukt de installatie fail-closed in plaats van fallback-platte tekst te bewaren.
    - Voor wachtwoord-auth op `gateway run` geef je de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` boven inline `--password`.
    - In afgeleide auth-modus versoepelt shell-only `OPENCLAW_GATEWAY_PASSWORD` de tokenvereisten voor installatie niet; gebruik duurzame configuratie (`gateway.auth.password` of config `env`) bij het installeren van een beheerde service.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt de installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant naar Gateway-beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen gateways waarop Bonjour-discovery is ingeschakeld (standaard) adverteren de beacon.

Wide-area discovery-records kunnen deze TXT-hints bevatten:

- `role` (hint voor gatewayrol)
- `transport` (transporthint, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (alleen volledige discovery-modus; clients gebruiken standaard SSH-doelen op `22` wanneer dit ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, wanneer beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (alleen volledige discovery-modus)

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
- `wsUrl` in JSON-uitvoer wordt afgeleid van het opgeloste service-eindpunt, niet van TXT-only hints zoals `lanHost` of `tailnetDns`.
- Op `local.` mDNS en wide-area DNS-SD worden `sshPort` en `cliPath` alleen gepubliceerd wanneer `discovery.mdns.mode` `full` is.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
