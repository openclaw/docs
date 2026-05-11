---
read_when:
    - De Gateway uitvoeren vanuit de CLI (ontwikkeling of servers)
    - Gateway-authenticatie, bind-modi en connectiviteit debuggen
    - Gateways ontdekken via Bonjour (lokale + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateways uitvoeren, opvragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:26:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (kanalen, nodes, sessies, hooks). Subcommando's op deze pagina vallen onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-discovery" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-configuratie.
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
    - `openclaw onboard --mode local` en `openclaw setup` worden verwacht `gateway.mode=local` te schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een beschadigde of overschreven configuratie en herstel deze in plaats van impliciet van lokale modus uit te gaan.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert hij voor jou "guess local" te doen.
    - Binden buiten loopback zonder auth wordt geblokkeerd (veiligheidsrail).
    - `SIGUSR1` activeert een herstart binnen het proces wanneer toegestaan (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatig herstarten te blokkeren, terwijl toepassen/bijwerken van gateway-tools/configuratie toegestaan blijft).
    - `SIGINT`/`SIGTERM`-handlers stoppen het gateway-proces, maar herstellen geen aangepaste terminalstatus. Als je de CLI verpakt met een TUI of raw-mode-invoer, herstel dan de terminal vóór afsluiten.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaard komt uit configuratie/env; meestal `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindmodus van de listener.
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
<ParamField path="--allow-unconfigured" type="boolean">
  Sta toe dat de gateway start zonder `gateway.mode=local` in de configuratie. Omzeilt de opstartbewaking alleen voor ad-hoc-/dev-bootstrap; schrijft of herstelt het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een dev-configuratie + workspace aan als die ontbreken (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset dev-configuratie + referenties + sessies + workspace (vereist `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Beëindig elke bestaande listener op de geselecteerde poort voordat wordt gestart.
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
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` vraagt de actieve Gateway om actief OpenClaw-werk vóór de herstart vooraf te controleren. Als bewerkingen in de wachtrij, antwoordbezorging, embedded runs of taakruns actief zijn, meldt de Gateway de blokkades, voegt dubbele veilige herstartverzoeken samen en herstart zodra het actieve werk is afgehandeld. Gewoon `restart` behoudt het bestaande service-manager-gedrag voor compatibiliteit. Gebruik `--force` alleen wanneer je expliciet het onmiddellijke overschrijvingspad wilt.

`openclaw gateway restart --safe --skip-deferral` voert dezelfde OpenClaw-bewuste gecoördineerde herstart uit als `--safe`, maar omzeilt de uitstelpoort voor actief werk, zodat de Gateway de herstart onmiddellijk uitzendt, zelfs wanneer blokkades worden gemeld. Gebruik dit als operator-ontsnappingsroute wanneer een uitstel is vastgezet door een vastgelopen taakrun en alleen `--safe` oneindig zou wachten. `--skip-deferral` vereist `--safe`.

<Warning>
Inline `--password` kan zichtbaar zijn in lokale proceslijsten. Geef de voorkeur aan `--password-file`, env, of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Opstartprofilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens het opstarten van de Gateway te loggen, inclusief `eventLoopMax`-vertraging per fase en timings van plugin-lookup-tabellen voor installed-index, manifest registry, opstartplanning en owner-map-werk.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-opstartdiagnosetijdlijn te schrijven voor externe QA-harnassen. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in configuratie; het pad wordt nog steeds via env aangeleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer `pnpm test:startup:gateway -- --runs 5 --warmup 1` uit om het opstarten van de Gateway te benchmarken. De benchmark registreert de eerste procesuitvoer, `/healthz`, `/readyz`, opstarttracetimings, event-loop-vertraging en timingdetails van plugin-lookup-tabellen.

## Een actieve Gateway opvragen

Alle querycommando's gebruiken WebSocket RPC.

<Tabs>
  <Tab title="Uitvoermodi">
    - Standaard: mensleesbaar (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen styling/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit en behoud de menselijke lay-out.

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

Het HTTP-eindpunt `/healthz` is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-eindpunt `/readyz` is strenger en blijft rood terwijl opstartende plugin-sidecars, kanalen of geconfigureerde hooks nog aan het stabiliseren zijn. Lokale of geauthenticeerde gedetailleerde readiness-antwoorden bevatten een diagnostisch `eventLoop`-blok met event-loop-vertraging, event-loop-benutting, CPU-kernverhouding en een `degraded`-vlag.

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
  Maximumaantal recente events om op te nemen (max `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op diagnostisch eventtype, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen events op na een diagnostisch volgnummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een bewaard stabiliteitsbundle in plaats van de actieve Gateway aan te roepen. Gebruik `--bundle latest` (of alleen `--bundle`) voor het nieuwste bundle onder de statusdirectory, of geef direct een bundle-JSON-pad door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbaar zipbestand met supportdiagnostiek in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy en bundlegedrag">
    - Records bewaren operationele metadata: eventnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/pluginnamen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, afsluit-timeouts en mislukte herstarts schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder events heeft. Inspecteer het nieuwste bundle met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` gelden ook voor bundle-uitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokaal diagnostiek-zipbestand dat is bedoeld om aan bugrapporten toe te voegen. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en de bundle-inhoud.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Uitvoerpad voor zip. Standaard een supportexport onder de statusdirectory.
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
  Sla het opzoeken van bewaarde stabiliteitsbundles over.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het geschreven pad, de grootte en het manifest af als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratievorm, opgeschoonde configuratiedetails, opgeschoonde logsamenvattingen, opgeschoonde Gateway-status-/health-snapshots en het nieuwste stabiliteitsbundle wanneer er een bestaat.

Deze is bedoeld om te delen. De export bewaart operationele details die helpen bij debuggen, zoals veilige OpenClaw-logvelden, subsysteemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, plugin-id's, provider-id's, niet-geheime feature-instellingen en geredigeerde operationele logberichten. De export laat chattekst, webhook-bodies, tooluitvoer, referenties, cookies, account-/berichtidentifiers, prompt-/instructietekst, hostnamen en geheime waarden weg of redigeert ze. Wanneer een LogTape-achtig bericht lijkt op payloadtekst van gebruiker/chat/tool, bewaart de export alleen dat een bericht is weggelaten plus het aantal bytes.

### `gateway status`

`gateway status` toont de Gateway-service (launchd/systemd/schtasks) plus een optionele probe van connectiviteit/auth-capaciteit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Voeg een expliciet probedoel toe. Geconfigureerde remote + localhost worden nog steeds geprobed.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-authenticatie voor de probe.
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
  Upgrade de standaard connectiviteitsprobe naar een leesprobe en sluit af met een niet-nulcode wanneer die leesprobe mislukt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantiek">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard bewijst `gateway status` de servicestatus, WebSocket-verbinding en de authenticatiemogelijkheid die zichtbaar is tijdens de handshake. Het bewijst geen lees-/schrijf-/beheerdersbewerkingen.
    - Diagnostische probes wijzigen niets voor apparaatauthenticatie bij eerste gebruik: ze hergebruiken een bestaand gecachet apparaattoken wanneer dat bestaat, maar maken geen nieuwe CLI-apparaatidentiteit of alleen-lezen apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost waar mogelijk geconfigureerde auth-SecretRefs op voor probe-authenticatie.
    - Als een vereiste auth-SecretRef in dit commandopad niet is opgelost, meldt `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/-authenticatie mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
    - Als de probe slaagt, worden waarschuwingen voor niet-opgeloste auth-ref onderdrukt om fout-positieven te voorkomen.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en je ook gezonde RPC-aanroepen met leesbereik nodig hebt.
    - `--deep` voegt een best-effort scan toe voor extra launchd/systemd/schtasks-installaties. Wanneer meerdere Gateway-achtige services worden gedetecteerd, print menselijke uitvoer opschoningshints en waarschuwt dat de meeste opstellingen één Gateway per machine zouden moeten draaien.
    - `--deep` meldt ook een recente overdracht voor herstart door de Gateway-supervisor wanneer het serviceproces netjes is afgesloten voor een herstart door een externe supervisor.
    - `--deep` voert configuratievalidatie uit in Plugin-bewuste modus (`pluginValidation: "full"`) en toont waarschuwingen voor geconfigureerde Plugin-manifesten (bijvoorbeeld ontbrekende metadata voor kanaalconfiguratie), zodat rooktests voor installatie en updates ze opvangen. Standaard houdt `gateway status` het snelle alleen-lezen pad dat Plugin-validatie overslaat.
    - Menselijke uitvoer bevat het opgeloste pad naar het bestandslog plus de snapshot van CLI-versus-service-configuratiepaden/-geldigheid om profiel- of state-dir-afwijking te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd-controles op authenticatiedrift">
    - Bij Linux systemd-installaties lezen controles op service-authenticatiedrift zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, gequote paden, meerdere bestanden en optionele `-`-bestanden).
    - Driftcontroles lossen `gateway.auth.token` SecretRefs op met de samengevoegde runtime-omgeving (eerst de servicecommando-omgeving, daarna de procesomgeving als fallback).
    - Als token-authenticatie niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan tokendriftcontroles het oplossen van het configuratietoken over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is het commando voor "alles debuggen". Het probet altijd:

- je geconfigureerde remote Gateway (indien ingesteld), en
- localhost (loopback) **zelfs als remote is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Menselijke uitvoer labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere Gateways bereikbaar zijn, print het ze allemaal. Meerdere Gateways worden ondersteund wanneer je geïsoleerde profielen/poorten gebruikt (bijv. een reddingsbot), maar de meeste installaties draaien nog steeds één Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretatie">
    - `Reachable: yes` betekent dat minstens één doel een WebSocket-verbinding heeft geaccepteerd.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldt wat de probe kon bewijzen over authenticatie. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat detail-RPC-aanroepen met leesbereik (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat verbinden is gelukt, maar RPC met leesbereik beperkt is. Dit wordt gemeld als **gedegradeerde** bereikbaarheid, niet als volledige mislukking.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding heeft geaccepteerd, maar dat daaropvolgende leesdiagnostiek is verlopen of mislukt. Dit is ook **gedegradeerde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachte apparaatauthenticatie, maar maakt het geen apparaatidentiteit of koppelingsstatus voor eerste gebruik aan.
    - De exitcode is alleen niet-nul wanneer geen enkel geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON-uitvoer">
    Toplevel:

    - `ok`: minstens één doel is bereikbaar.
    - `degraded`: minstens één doel heeft een verbinding geaccepteerd maar heeft volledige detail-RPC-diagnostiek niet voltooid.
    - `capability`: beste mogelijkheid gezien over bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te behandelen in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerde remote, daarna local loopback.
    - `warnings[]`: best-effort waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: hints voor local loopback-/tailnet-URL's afgeleid van huidige configuratie en hostnetwerk.
    - `discovery.timeoutMs` en `discovery.count`: het daadwerkelijke discovery-budget/resultaantal dat voor deze probe-pas is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na verbinden + gedegradeerde classificatie.
    - `rpcOk`: volledige detail-RPC geslaagd.
    - `scopeLimited`: detail-RPC mislukt wegens ontbrekend operatorbereik.

    Per doel (`targets[].auth`):

    - `role`: authenticatierol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende bereiken gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de getoonde classificatie van authenticatiemogelijkheid voor dat doel.

  </Accordion>
  <Accordion title="Veelvoorkomende waarschuwingscodes">
    - `ssh_tunnel_failed`: SSH-tunnel instellen is mislukt; het commando is teruggevallen op directe probes.
    - `multiple_gateways`: meer dan één doel was bereikbaar; dit is ongebruikelijk tenzij je bewust geïsoleerde profielen draait, zoals een reddingsbot.
    - `auth_secretref_unresolved`: een geconfigureerde auth-SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding is gelukt, maar de leesprobe werd beperkt door ontbrekende `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote over SSH (pariteit met Mac-app)

De macOS-appmodus "Remote over SSH" gebruikt een lokale port-forward zodat de remote Gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

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
  Kies de eerste ontdekte Gateway-host als SSH-doel uit het opgeloste discovery-eindpunt (`local.` plus het geconfigureerde wide-area domein, indien aanwezig). Hints met alleen TXT worden genegeerd.
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
  JSON-objecttekenreeks voor params.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway-WebSocket-URL.
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
shim voor een secretsmanager of een run-as-helper. De wrapper ontvangt de normale Gateway-args en is
ervoor verantwoordelijk uiteindelijk `openclaw` of Node met die args te exec'en.

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

Om een bewaarde wrapper te verwijderen, leeg je `OPENCLAW_WRAPPER` tijdens het opnieuw installeren:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Commando-opties">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Levenscyclusgedrag">
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Koppel `gateway stop` en `gateway start` niet aan elkaar als vervanging voor opnieuw starten.
    - Op macOS gebruikt `gateway stop` standaard `launchctl bootout`, waarmee de LaunchAgent uit de huidige opstartsessie wordt verwijderd zonder blijvend uitschakelen — KeepAlive-autoherstel blijft actief voor toekomstige crashes en `gateway start` schakelt weer netjes in zonder handmatige `launchctl enable`. Geef `--disable` door om KeepAlive en RunAtLoad blijvend te onderdrukken, zodat de gateway niet opnieuw start tot de volgende expliciete `gateway start`; gebruik dit wanneer een handmatige stop opnieuw opstarten van het systeem moet overleven.
    - `gateway restart --safe` vraagt de actieve Gateway om actief OpenClaw-werk vooraf te controleren en de herstart uit te stellen tot antwoordbezorging, embedded uitvoeringen en taakuitvoeringen zijn afgehandeld. `--safe` kan niet worden gecombineerd met `--force` of `--wait`.
    - `gateway restart --wait 30s` overschrijft het geconfigureerde wachttijdbudget voor het leeg laten lopen bij die herstart. Losse getallen zijn milliseconden; eenheden zoals `s`, `m` en `h` worden geaccepteerd. `--wait 0` wacht onbeperkt.
    - `gateway restart --safe --skip-deferral` voert de OpenClaw-bewuste veilige herstart uit, maar omzeilt de uitstelpoort zodat de Gateway de herstart onmiddellijk uitzendt, ook wanneer blokkades worden gemeld. Nooduitgang voor operators bij uitstel door vastgelopen taakuitvoeringen; vereist `--safe`.
    - `gateway restart --force` slaat het leeg laten lopen van actief werk over en herstart onmiddellijk. Gebruik dit wanneer een operator de vermelde taakblokkades al heeft geïnspecteerd en de gateway nu terug wil.
    - Levenscyclusopdrachten accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Auth en SecretRefs tijdens installatie">
    - Wanneer token-authenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef kan worden opgelost, maar slaat het opgeloste token niet blijvend op in serviceomgevingsmetadata.
    - Als token-authenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, mislukt de installatie gesloten in plaats van terug te vallen op blijvend opgeslagen platte tekst.
    - Gebruik voor wachtwoordauthenticatie bij `gateway run` bij voorkeur `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` in plaats van inline `--password`.
    - In afgeleide auth-modus versoepelt shell-only `OPENCLAW_GATEWAY_PASSWORD` de installatievereisten voor tokens niet; gebruik duurzame configuratie (`gateway.auth.password` of configuratie-`env`) bij het installeren van een beheerde service.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant naar Gateway-beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen gateways waarvoor Bonjour-detectie is ingeschakeld (standaard) adverteren de beacon.

Wide-Area-detectierecords bevatten (TXT):

- `role` (hint voor gatewayrol)
- `transport` (transporthint, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (optioneel; clients gebruiken standaard `22` als SSH-doel wanneer dit ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, indien beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (hint voor externe installatie die naar de wide-area-zone wordt geschreven)

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
- Op `local.` mDNS worden `sshPort` en `cliPath` alleen uitgezonden wanneer `discovery.mdns.mode` `full` is. Wide-area DNS-SD schrijft nog steeds `cliPath`; `sshPort` blijft daar ook optioneel.

</Note>

## Gerelateerd

- [CLI-naslag](/nl/cli)
- [Gateway-runbook](/nl/gateway)
