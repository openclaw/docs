---
read_when:
    - De Gateway uitvoeren vanaf de CLI (ontwikkeling of servers)
    - Fouten opsporen in Gateway-authenticatie, bindmodi en connectiviteit
    - Gateways ontdekken via Bonjour (lokaal + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateways uitvoeren, bevragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-05-04T18:24:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 310867c59148577f2e8ce6f708da6bce936e09243ce7fbe5daeb453c6b3b370d
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (kanalen, knooppunten, sessies, hooks). Subcommando's op deze pagina staan onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-detectie" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-configuratie.
  </Card>
  <Card title="Overzicht van detectie" href="/nl/gateway/discovery">
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
    - Standaard weigert de Gateway te starten tenzij `gateway.mode=local` is ingesteld in `~/.openclaw/openclaw.json`. Gebruik `--allow-unconfigured` voor ad-hoc-/ontwikkeluitvoeringen.
    - Van `openclaw onboard --mode local` en `openclaw setup` wordt verwacht dat ze `gateway.mode=local` schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een defecte of overschreven configuratie en herstel die in plaats van impliciet lokale modus aan te nemen.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert hij voor jou "lokaal te raden".
    - Binden buiten loopback zonder auth wordt geblokkeerd (veiligheidsvangrail).
    - `SIGUSR1` activeert een herstart binnen het proces wanneer dit is geautoriseerd (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatig herstarten te blokkeren, terwijl gateway-tool/configuratie toepassen/bijwerken toegestaan blijft).
    - `SIGINT`/`SIGTERM`-handlers stoppen het gateway-proces, maar herstellen geen aangepaste terminalstatus. Als je de CLI omwikkelt met een TUI of invoer in raw-modus, herstel dan de terminal vóór afsluiten.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaard komt uit config/env; meestal `18789`).
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
  Lees het gateway-wachtwoord uit een bestand.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Stel de Gateway beschikbaar via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset Tailscale serve/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta gateway-start toe zonder `gateway.mode=local` in de configuratie. Omzeilt de opstartbeveiliging alleen voor ad-hoc-/ontwikkelbootstrap; schrijft of herstelt het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een ontwikkelconfiguratie + workspace aan als die ontbreken (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset ontwikkelconfiguratie + referenties + sessies + workspace (vereist `--dev`).
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

## De Gateway herstarten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` vraagt de actieve Gateway om actief OpenClaw-werk vooraf te controleren voordat er wordt herstart. Als wachtrijbewerkingen, antwoordbezorging, ingebedde runs of taakruns actief zijn, rapporteert de Gateway de blokkades, voegt hij dubbele veilige herstartverzoeken samen en herstart hij zodra het actieve werk is leeggemaakt. Gewoon `restart` behoudt het bestaande service-managergedrag voor compatibiliteit. Gebruik `--force` alleen wanneer je expliciet het directe overschrijvingspad wilt.

<Warning>
Inline `--password` kan zichtbaar worden in lokale proceslijsten. Geef de voorkeur aan `--password-file`, env of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Opstartprofilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens het opstarten van de Gateway te loggen, inclusief per fase `eventLoopMax`-vertraging en plugin-lookup-table-timings voor geïnstalleerde index, manifestregister, opstartplanning en owner-map-werk.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-opstartdiagnosetijdlijn te schrijven voor externe QA-harnassen. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad wordt nog steeds via env geleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer `pnpm test:startup:gateway -- --runs 5 --warmup 1` uit om het opstarten van de Gateway te benchmarken. De benchmark registreert eerste procesuitvoer, `/healthz`, `/readyz`, opstarttracetimings, event-loop-vertraging en timingdetails van plugin-lookup-tables.

## Een actieve Gateway opvragen

Alle querycommando's gebruiken WebSocket RPC.

<Tabs>
  <Tab title="Uitvoermodi">
    - Standaard: menselijk leesbaar (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen styling/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit terwijl de menselijke indeling behouden blijft.

  </Tab>
  <Tab title="Gedeelde opties">
    - `--url <url>`: Gateway-WebSocket-URL.
    - `--token <token>`: Gateway-token.
    - `--password <password>`: Gateway-wachtwoord.
    - `--timeout <ms>`: time-out/budget (verschilt per commando).
    - `--expect-final`: wacht op een "final"-respons (agentaanroepen).

  </Tab>
</Tabs>

<Note>
Wanneer je `--url` instelt, valt de CLI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties is een fout.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Het HTTP-`/healthz`-endpoint is een liveness-probe: het retourneert zodra de server HTTP kan beantwoorden. Het HTTP-`/readyz`-endpoint is strenger en blijft rood terwijl opstartende plugin-sidecars, kanalen of geconfigureerde hooks nog aan het stabiliseren zijn. Lokale of geauthenticeerde gedetailleerde readiness-responsen bevatten een `eventLoop`-diagnoseblok met event-loop-vertraging, event-loop-gebruik, CPU-kernratio en een `degraded`-vlag.

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
  Maximumaantal recente gebeurtenissen om op te nemen (max `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op diagnostisch gebeurtenistype, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen gebeurtenissen op na een diagnostisch volgnummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een bewaarde stabiliteitsbundel in plaats van de actieve Gateway aan te roepen. Gebruik `--bundle latest` (of alleen `--bundle`) voor de nieuwste bundel onder de statusmap, of geef rechtstreeks een JSON-pad naar een bundel door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare supportdiagnose-zip in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy en bundelgedrag">
    - Records bewaren operationele metadata: gebeurtenisnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/pluginnamen en geredigeerde sessiesamenvattingen. Ze bewaren geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, afsluit-time-outs en opstartherstartfouten schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder gebeurtenissen heeft. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` zijn ook van toepassing op bundeluitvoer.

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
  Uitvoer-zip-pad. Standaard naar een supportexport onder de statusmap.
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
  Time-out voor status-/health-snapshot.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Sla het opzoeken van bewaarde stabiliteitsbundels over.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het geschreven pad, de grootte en het manifest af als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratievorm, opgeschoonde configuratiedetails, opgeschoonde logsamenvattingen, opgeschoonde Gateway-status-/health-snapshots en de nieuwste stabiliteitsbundel wanneer die bestaat.

Deze is bedoeld om te delen. De export bewaart operationele details die helpen bij foutopsporing, zoals veilige OpenClaw-logvelden, subsysteemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, plugin-id's, provider-id's, niet-geheime functie-instellingen en geredigeerde operationele logberichten. De export laat chattekst, webhook-bodies, tooluitvoer, referenties, cookies, account-/bericht-id's, prompt-/instructietekst, hostnamen en geheime waarden weg of redigeert ze. Wanneer een LogTape-achtig bericht lijkt op payloadtekst van gebruiker/chat/tool, bewaart de export alleen dat een bericht is weggelaten plus het aantal bytes.

### `gateway status`

`gateway status` toont de Gateway-service (launchd/systemd/schtasks) plus een optionele probe van connectiviteits-/auth-mogelijkheden.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Voeg een expliciet probe-doel toe. Geconfigureerde externe + localhost worden nog steeds geprobed.
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
  Upgrade de standaard connectiviteitsprobe naar een leesprobe en sluit af met een niet-nulwaarde wanneer die leesprobe mislukt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantiek">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-config ontbreekt of ongeldig is.
    - Standaard bewijst `gateway status` de servicestatus, WebSocket-verbinding en de auth-mogelijkheid die zichtbaar is tijdens de handshake. Het bewijst geen lees-/schrijf-/adminbewerkingen.
    - Diagnostische probes muteren niets voor eerste apparaatauthenticatie: ze hergebruiken een bestaand gecachet apparaattoken wanneer dat bestaat, maar maken geen nieuwe CLI-apparaatidentiteit of alleen-lezen apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde auth SecretRefs op voor probe-auth wanneer dat mogelijk is.
    - Als een vereiste auth SecretRef in dit opdrachtpad niet is opgelost, rapporteert `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/auth mislukt; geef `--token`/`--password` expliciet door of los eerst de secret-bron op.
    - Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-verwijzingen onderdrukt om fout-positieven te voorkomen.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en je ook gezonde RPC-aanroepen met leesbereik nodig hebt.
    - `--deep` voegt een best-effort scan toe voor extra launchd/systemd/schtasks-installaties. Wanneer meerdere gateway-achtige services worden gedetecteerd, toont menselijke uitvoer opschoontips en waarschuwt dat de meeste setups één Gateway per machine zouden moeten draaien.
    - Menselijke uitvoer bevat het opgeloste pad naar het bestandslog plus een momentopname van CLI-versus-service-configpaden/-geldigheid om profiel- of state-dir-drift te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd auth-driftcontroles">
    - Op Linux systemd-installaties lezen service-auth-driftcontroles zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, aangehaalde paden, meerdere bestanden en optionele `-`-bestanden).
    - Driftcontroles lossen `gateway.auth.token` SecretRefs op met de samengevoegde runtime-env (eerst serviceopdracht-env, daarna process-env als fallback).
    - Als token-auth niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles de oplossing van het configtoken over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is de opdracht voor "alles debuggen". Deze probet altijd:

- je geconfigureerde externe gateway (indien ingesteld), en
- localhost (loopback) **zelfs als extern is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Menselijke uitvoer labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere gateways bereikbaar zijn, worden ze allemaal getoond. Meerdere gateways worden ondersteund wanneer je geïsoleerde profielen/poorten gebruikt (bijv. een reddingsbot), maar de meeste installaties draaien nog steeds één Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretatie">
    - `Reachable: yes` betekent dat minstens één doel een WebSocket-verbinding heeft geaccepteerd.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` rapporteert wat de probe over auth kon bewijzen. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat detail-RPC-aanroepen met leesbereik (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat de verbinding is geslaagd, maar RPC met leesbereik beperkt is. Dit wordt gerapporteerd als **gedegradeerde** bereikbaarheid, niet als volledige mislukking.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding heeft geaccepteerd, maar dat vervolgleesdiagnostiek een time-out kreeg of mislukte. Ook dit is **gedegradeerde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt de probe bestaande gecachete apparaatauth, maar maakt deze geen eerste apparaatidentiteit of koppelingsstatus aan.
    - Exitcode is alleen niet-nul wanneer geen enkel geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON-uitvoer">
    Hoofdniveau:

    - `ok`: minstens één doel is bereikbaar.
    - `degraded`: minstens één doel accepteerde een verbinding, maar voltooide de volledige detail-RPC-diagnostiek niet.
    - `capability`: beste mogelijkheid die is gezien over bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als de actieve winnaar te behandelen, in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerde externe en daarna local loopback.
    - `warnings[]`: best-effort waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: URL-hints voor local loopback/tailnet, afgeleid van huidige config en hostnetwerken.
    - `discovery.timeoutMs` en `discovery.count`: het werkelijke discovery-budget/resultaantal dat voor deze probe-pass is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na verbinding + gedegradeerde classificatie.
    - `rpcOk`: volledig succes van detail-RPC.
    - `scopeLimited`: detail-RPC mislukt door ontbrekend operatorbereik.

    Per doel (`targets[].auth`):

    - `role`: auth-rol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende scopes gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de weergegeven auth-mogelijkheidsclassificatie voor dat doel.

  </Accordion>
  <Accordion title="Veelvoorkomende waarschuwingscodes">
    - `ssh_tunnel_failed`: SSH-tunnelinstelling mislukt; de opdracht viel terug op directe probes.
    - `multiple_gateways`: meer dan één doel was bereikbaar; dit is ongebruikelijk tenzij je bewust geïsoleerde profielen draait, zoals een reddingsbot.
    - `auth_secretref_unresolved`: een geconfigureerde auth SecretRef kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: WebSocket-verbinding geslaagd, maar de leesprobe werd beperkt door ontbrekende `operator.read`.

  </Accordion>
</AccordionGroup>

#### Extern via SSH (pariteit met Mac-app)

De macOS-appmodus "Extern via SSH" gebruikt een lokale port-forward, zodat de externe gateway (die mogelijk alleen aan loopback is gebonden) bereikbaar wordt op `ws://127.0.0.1:<port>`.

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
  Kies de eerste ontdekte gateway-host als SSH-doel vanuit het opgeloste discovery-eindpunt (`local.` plus het geconfigureerde wide-area-domein, indien aanwezig). Hints met alleen TXT worden genegeerd.
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
  Time-outbudget.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Vooral voor agent-achtige RPC's die tussenliggende events streamen vóór een definitieve payload.
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
shim voor secretbeheer of een run-as-helper. De wrapper ontvangt de normale Gateway-args en is
verantwoordelijk om uiteindelijk `openclaw` of Node met die args te exec'en.

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

Om een bewaarde wrapper te verwijderen, maak je `OPENCLAW_WRAPPER` leeg tijdens herinstallatie:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opdrachtopties">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lifecycle-gedrag">
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Keten `gateway stop` en `gateway start` niet als restart-vervanging; op macOS schakelt `gateway stop` de LaunchAgent bewust uit voordat deze wordt gestopt.
    - `gateway restart --wait 30s` overschrijft het geconfigureerde restart-drainbudget voor die restart. Kale getallen zijn milliseconden; eenheden zoals `s`, `m` en `h` worden geaccepteerd. `--wait 0` wacht onbeperkt.
    - `gateway restart --force` slaat de active-work drain over en herstart onmiddellijk. Gebruik dit wanneer een operator de vermelde taakblokkades al heeft geïnspecteerd en de gateway nu terug wil.
    - Lifecycle-opdrachten accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Auth en SecretRefs tijdens installatie">
    - Wanneer token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef oplosbaar is, maar bewaart het opgeloste token niet in serviceomgevingsmetadata.
    - Als token-auth een token vereist en de geconfigureerde token-SecretRef niet is opgelost, mislukt installatie gesloten in plaats van fallback-platte tekst te bewaren.
    - Voor wachtwoord-auth op `gateway run`, geef de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` boven inline `--password`.
    - In afgeleide auth-modus versoepelt alleen-shell `OPENCLAW_GATEWAY_PASSWORD` de installatietokenvereisten niet; gebruik duurzame config (`gateway.auth.password` of config-`env`) bij het installeren van een beheerde service.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant naar Gateway-beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split-DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen Gateways waarop Bonjour-detectie is ingeschakeld (standaard), adverteren de beacon.

Wide-Area-detectierecords bevatten (TXT):

- `role` (hint voor Gateway-rol)
- `transport` (transporthint, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (optioneel; clients gebruiken standaard `22` als SSH-doel wanneer deze ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, indien beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (remote-install-hint die naar de Wide-Area-zone wordt geschreven)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Time-out per opdracht (bladeren/resolven).
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
- De CLI scant `local.` plus het geconfigureerde Wide-Area-domein wanneer er een is ingeschakeld.
- `wsUrl` in JSON-uitvoer wordt afgeleid van het geresolvde service-eindpunt, niet van hints die alleen in TXT staan, zoals `lanHost` of `tailnetDns`.
- Op `local.` mDNS worden `sshPort` en `cliPath` alleen uitgezonden wanneer `discovery.mdns.mode` `full` is. Wide-Area DNS-SD schrijft nog steeds `cliPath`; `sshPort` blijft daar ook optioneel.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
