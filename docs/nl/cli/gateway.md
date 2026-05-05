---
read_when:
    - De Gateway uitvoeren vanuit de CLI (ontwikkeling of servers)
    - Fouten opsporen in Gateway-authenticatie, bindmodi en connectiviteit
    - Gateways ontdekken via Bonjour (lokaal + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways uitvoeren, opvragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is OpenClaw's WebSocket-server (kanalen, nodes, sessies, hooks). Subcommando's op deze pagina vallen onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-installatie.
  </Card>
  <Card title="Discovery overview" href="/nl/gateway/discovery">
    Hoe OpenClaw gateways adverteert en vindt.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration">
    Configuratiesleutels op het hoogste gateway-niveau.
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
    - Standaard weigert de Gateway te starten tenzij `gateway.mode=local` is ingesteld in `~/.openclaw/openclaw.json`. Gebruik `--allow-unconfigured` voor ad-hoc-/ontwikkelruns.
    - Van `openclaw onboard --mode local` en `openclaw setup` wordt verwacht dat ze `gateway.mode=local` schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een kapotte of overschreven configuratie en herstel die in plaats van impliciet de lokale modus aan te nemen.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert deze voor je "lokaal te raden".
    - Binding buiten loopback zonder auth wordt geblokkeerd (veiligheidsvangrail).
    - `SIGUSR1` activeert een herstart binnen het proces wanneer dit geautoriseerd is (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatig herstarten te blokkeren, terwijl toepassen/bijwerken van Gateway-tools/-configuratie toegestaan blijft).
    - `SIGINT`/`SIGTERM`-handlers stoppen het Gateway-proces, maar herstellen geen aangepaste terminalstatus. Als je de CLI inpakt met een TUI of raw-mode-invoer, herstel dan de terminal voordat je afsluit.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaardwaarde komt uit configuratie/env; meestal `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindmodus voor listener.
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
  Reset de Tailscale serve/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta toe dat de Gateway start zonder `gateway.mode=local` in de configuratie. Omzeilt de startbeveiliging alleen voor ad-hoc-/ontwikkelbootstrap; schrijft of herstelt het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een ontwikkelconfiguratie + werkruimte aan als deze ontbreken (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset ontwikkelconfiguratie + referenties + sessies + werkruimte (vereist `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Beëindig een bestaande listener op de geselecteerde poort voordat wordt gestart.
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
  Pad voor ruwe stream-jsonl.
</ParamField>

## De Gateway herstarten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` vraagt de actieve Gateway om actief OpenClaw-werk vooraf te controleren voordat er opnieuw wordt gestart. Als bewerkingen in de wachtrij, antwoordbezorging, embedded runs of taakruns actief zijn, rapporteert de Gateway de blokkades, voegt deze dubbele veilige herstartverzoeken samen en herstart zodra het actieve werk is afgehandeld. Gewoon `restart` behoudt het bestaande service-manager-gedrag voor compatibiliteit. Gebruik `--force` alleen wanneer je expliciet het directe overschrijvingspad wilt.

<Warning>
Inline `--password` kan zichtbaar zijn in lokale proceslijsten. Geef de voorkeur aan `--password-file`, env of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Startprofilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens het starten van de Gateway te loggen, inclusief `eventLoopMax`-vertraging per fase en timings voor Plugin-opzoektabellen voor installed-index, manifestregister, startplanning en owner-map-werk.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-startdiagnostiektijdlijn te schrijven voor externe QA-harnassen. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad wordt nog steeds via env geleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer `pnpm test:startup:gateway -- --runs 5 --warmup 1` uit om de start van de Gateway te benchmarken. De benchmark registreert eerste procesuitvoer, `/healthz`, `/readyz`, starttracetimings, event-loop-vertraging en timingdetails van Plugin-opzoektabellen.

## Een actieve Gateway opvragen

Alle querycommando's gebruiken WebSocket-RPC.

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

Het HTTP-`/healthz`-eindpunt is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-`/readyz`-eindpunt is strikter en blijft rood terwijl Plugin-sidecars, kanalen of geconfigureerde hooks bij het starten nog aan het stabiliseren zijn. Lokale of geauthenticeerde gedetailleerde readiness-antwoorden bevatten een diagnostisch `eventLoop`-blok met event-loop-vertraging, event-loop-gebruik, CPU-coreverhouding en een `degraded`-vlag.

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
  Maximumaantal recente events om op te nemen (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op diagnostisch eventtype, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen events op na een diagnostisch volgnummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een opgeslagen stabiliteitsbundel in plaats van de actieve Gateway aan te roepen. Gebruik `--bundle latest` (of alleen `--bundle`) voor de nieuwste bundel onder de statusmap, of geef direct een JSON-pad naar een bundel door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare zip met supportdiagnostiek in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Records bewaren operationele metadata: eventnamen, aantallen, bytegroottes, geheugenmetingen, wachtrij-/sessiestatus, kanaal-/Plugin-namen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, Webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, timeouts bij afsluiten en fouten tijdens herstarten schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder events heeft. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` gelden ook voor bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokale diagnostiekzip die is bedoeld om aan bugrapporten toe te voegen. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en de bundelinhoud.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Uitvoerpad voor zip. Standaard naar een supportexport onder de statusmap.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximumaantal opgeschoonde logregels om op te nemen.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximumaantal logbytes om te inspecteren.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway-WebSocket-URL voor de health-snapshot.
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
  Sla het opzoeken van opgeslagen stabiliteitsbundels over.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het geschreven pad, de grootte en het manifest af als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratievorm, opgeschoonde configuratiedetails, opgeschoonde logsamenvattingen, opgeschoonde Gateway-status-/health-snapshots en de nieuwste stabiliteitsbundel wanneer die bestaat.

Deze is bedoeld om te delen. De export bewaart operationele details die helpen bij debuggen, zoals veilige OpenClaw-logvelden, subsystemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, Plugin-id's, provider-id's, niet-geheime feature-instellingen en geredigeerde operationele logberichten. Chattekst, Webhook-bodies, tooluitvoer, referenties, cookies, account-/bericht-id's, prompt-/instructietekst, hostnamen en geheime waarden worden weggelaten of geredigeerd. Wanneer een LogTape-achtig bericht lijkt op tekst van een gebruikers-/chat-/toolpayload, bewaart de export alleen dat een bericht is weggelaten plus het aantal bytes ervan.

### `gateway status`

`gateway status` toont de Gateway-service (launchd/systemd/schtasks) plus een optionele probe van connectiviteit/auth-mogelijkheden.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Voeg een expliciet probe-doel toe. De geconfigureerde remote + localhost worden nog steeds geprobed.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-authenticatie voor de probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Wachtwoordauthenticatie voor de probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Time-out voor de probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Sla de connectiviteitsprobe over (alleen serviceweergave).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scan ook services op systeemniveau.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Upgrade de standaard connectiviteitsprobe naar een leesprobe en sluit af met een niet-nulwaarde wanneer die leesprobe mislukt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantiek">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard bewijst `gateway status` de servicestatus, WebSocket-verbinding en de authenticatiecapaciteit die zichtbaar is tijdens de handshake. Het bewijst geen lees-/schrijf-/beheerbewerkingen.
    - Diagnostische probes muteren niets voor eerste apparaat-authenticatie: ze hergebruiken een bestaande gecachete apparaattoken wanneer die bestaat, maar maken geen nieuwe CLI-apparaatidentiteit of alleen-lezen apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde authenticatie-SecretRefs op voor probe-authenticatie wanneer dat mogelijk is.
    - Als een vereiste authenticatie-SecretRef in dit commandopad niet kan worden opgelost, meldt `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/-authenticatie mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
    - Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-referenties onderdrukt om fout-positieven te vermijden.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en RPC-aanroepen met leesbereik ook gezond moeten zijn.
    - `--deep` voegt een best-effort scan toe voor extra launchd-/systemd-/schtasks-installaties. Wanneer meerdere gateway-achtige services worden gedetecteerd, toont mensleesbare uitvoer opruimtips en waarschuwt die dat de meeste setups één Gateway per machine zouden moeten draaien.
    - `--deep` meldt ook een recente overdracht van een Gateway-supervisorherstart wanneer het serviceproces netjes is afgesloten voor een externe supervisorherstart.
    - Mensleesbare uitvoer bevat het opgeloste bestandslogpad plus een snapshot van de CLI-versus-service-configuratiepaden/-geldigheid om profiel- of state-dir-afwijkingen te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd-controles op auth-drift">
    - Bij Linux systemd-installaties lezen controles op service-auth-drift zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, gequote paden, meerdere bestanden en optionele `-`-bestanden).
    - Driftcontroles lossen `gateway.auth.token` SecretRefs op met de samengevoegde runtime-omgeving (eerst de servicecommando-omgeving, daarna de procesomgeving als fallback).
    - Als tokenauthenticatie feitelijk niet actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles configuratietokenresolutie over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is de opdracht voor "alles debuggen". Deze probeit altijd:

- je geconfigureerde remote gateway (als die is ingesteld), en
- localhost (loopback) **zelfs als remote is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Mensleesbare uitvoer labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere gateways bereikbaar zijn, drukt dit ze allemaal af. Meerdere gateways worden ondersteund wanneer je geïsoleerde profielen/poorten gebruikt (bijvoorbeeld een reddingsbot), maar de meeste installaties draaien nog steeds één gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretatie">
    - `Reachable: yes` betekent dat ten minste één doel een WebSocket-verbinding heeft geaccepteerd.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldt wat de probe over authenticatie kon bewijzen. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat detail-RPC-aanroepen met leesbereik (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat verbinden is gelukt, maar dat RPC met leesbereik beperkt is. Dit wordt gemeld als **verminderde** bereikbaarheid, niet als volledige mislukking.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding heeft geaccepteerd, maar dat vervolgleesdiagnostiek is verlopen of mislukt. Dit is ook **verminderde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachete apparaatauthenticatie, maar maakt het geen eerste apparaatidentiteit of koppelingsstatus aan.
    - De afsluitcode is alleen niet nul wanneer geen enkel geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON-uitvoer">
    Bovenste niveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel heeft een verbinding geaccepteerd, maar heeft niet alle detail-RPC-diagnostiek voltooid.
    - `capability`: beste capaciteit die is gezien over bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te behandelen, in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerde remote en daarna local loopback.
    - `warnings[]`: best-effort waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: local loopback-/tailnet-URL-hints afgeleid van de huidige configuratie en hostnetwerken.
    - `discovery.timeoutMs` en `discovery.count`: het daadwerkelijke discovery-budget/resultaantal dat voor deze probe-run is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na verbinding + classificatie als verminderd.
    - `rpcOk`: volledige detail-RPC geslaagd.
    - `scopeLimited`: detail-RPC mislukt door ontbrekend operatorbereik.

    Per doel (`targets[].auth`):

    - `role`: authenticatierol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende bereiken gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de getoonde classificatie van authenticatiecapaciteit voor dat doel.

  </Accordion>
  <Accordion title="Veelvoorkomende waarschuwingscodes">
    - `ssh_tunnel_failed`: instellen van SSH-tunnel is mislukt; de opdracht viel terug op directe probes.
    - `multiple_gateways`: meer dan één doel was bereikbaar; dit is ongebruikelijk tenzij je bewust geïsoleerde profielen draait, zoals een reddingsbot.
    - `auth_secretref_unresolved`: een geconfigureerde authenticatie-SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding is gelukt, maar de leesprobe was beperkt door ontbrekende `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote via SSH (pariteit met Mac-app)

De modus "Remote via SSH" van de macOS-app gebruikt een lokale port-forward zodat de remote gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

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
  Kies de eerste ontdekte gateway-host als SSH-doel uit het opgeloste discovery-eindpunt (`local.` plus het geconfigureerde wide-area domein, indien aanwezig). Alleen-TXT-hints worden genegeerd.
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
  JSON-objectstring voor parameters.
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
  Vooral voor agent-achtige RPC's die tussentijdse events streamen vóór een definitieve payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Machinaal leesbare JSON-uitvoer.
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

Gebruik `--wrapper` wanneer de beheerde service moet starten via een ander uitvoerbaar bestand, bijvoorbeeld een
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
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Keten `gateway stop` en `gateway start` niet als vervanging voor een herstart; op macOS schakelt `gateway stop` de LaunchAgent bewust uit voordat deze wordt gestopt.
    - `gateway restart --safe` vraagt de draaiende Gateway om actief OpenClaw-werk vooraf te controleren en de herstart uit te stellen totdat antwoordlevering, embedded runs en taakruns zijn leeggelopen. `--safe` kan niet worden gecombineerd met `--force` of `--wait`.
    - `gateway restart --wait 30s` overschrijft het geconfigureerde drain-budget voor herstarts voor die herstart. Losse getallen zijn milliseconden; eenheden zoals `s`, `m` en `h` worden geaccepteerd. `--wait 0` wacht onbeperkt.
    - `gateway restart --force` slaat het leeglopen van actief werk over en herstart onmiddellijk. Gebruik dit wanneer een operator de vermelde taakblokkades al heeft geïnspecteerd en de gateway nu terug wil.
    - Lifecycle-commando's accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Auth en SecretRefs tijdens installatie">
    - Wanneer tokenauth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef kan worden opgelost, maar slaat het opgeloste token niet op in metadata van de serviceomgeving.
    - Als tokenauth een token vereist en de geconfigureerde token-SecretRef niet is opgelost, faalt de installatie gesloten in plaats van platte fallback-tekst op te slaan.
    - Geef voor wachtwoordauth bij `gateway run` de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` boven inline `--password`.
    - In afgeleide auth-modus versoepelt alleen-shell `OPENCLAW_GATEWAY_PASSWORD` de vereisten voor installatietokens niet; gebruik duurzame configuratie (`gateway.auth.password` of config `env`) bij het installeren van een beheerde service.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant naar Gateway-bakens (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split-DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen gateways waarvoor Bonjour-detectie is ingeschakeld (standaard) adverteren het baken.

Wide-Area-detectierecords bevatten (TXT):

- `role` (hint voor gatewayrol)
- `transport` (transporthint, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (optioneel; clients gebruiken standaard `22` als SSH-doel wanneer deze ontbreekt)
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
- `wsUrl` in JSON-uitvoer wordt afgeleid van het opgeloste service-eindpunt, niet van alleen-TXT-hints zoals `lanHost` of `tailnetDns`.
- Op `local.` mDNS worden `sshPort` en `cliPath` alleen uitgezonden wanneer `discovery.mdns.mode` `full` is. Wide-area DNS-SD schrijft nog steeds `cliPath`; `sshPort` blijft daar ook optioneel.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
