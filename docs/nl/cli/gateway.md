---
read_when:
    - De Gateway uitvoeren vanuit de CLI (ontwikkeling of servers)
    - Debuggen van Gateway-authenticatie, bindingsmodi en connectiviteit
    - Gateways ontdekken via Bonjour (lokale + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways starten, opvragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-05-10T19:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e436abba80f643f3b0bfc0a7d2f344beb18c3849a49e5d0825767ae7a81ae1d
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (kanalen, nodes, sessies, hooks). Subopdrachten op deze pagina staan onder `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-discovery" href="/nl/gateway/bonjour">
    Lokale mDNS + wide-area DNS-SD-configuratie.
  </Card>
  <Card title="Discovery-overzicht" href="/nl/gateway/discovery">
    Hoe OpenClaw gateways adverteert en vindt.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration">
    Configuratiesleutels op topniveau voor de Gateway.
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
  <Accordion title="Opstartgedrag">
    - Standaard weigert de Gateway te starten tenzij `gateway.mode=local` is ingesteld in `~/.openclaw/openclaw.json`. Gebruik `--allow-unconfigured` alleen voor ad-hoc-/ontwikkelruns.
    - `openclaw onboard --mode local` en `openclaw setup` horen `gateway.mode=local` weg te schrijven. Als het bestand bestaat maar `gateway.mode` ontbreekt, behandel dat dan als een kapotte of overschreven configuratie en repareer die in plaats van impliciet de lokale modus aan te nemen.
    - Als het bestand bestaat en `gateway.mode` ontbreekt, behandelt de Gateway dat als verdachte configuratieschade en weigert deze voor jou "lokaal te raden".
    - Binden buiten loopback zonder authenticatie wordt geblokkeerd (veiligheidsmaatregel).
    - `SIGUSR1` triggert een herstart binnen het proces wanneer dit is geautoriseerd (`commands.restart` is standaard ingeschakeld; stel `commands.restart: false` in om handmatig herstarten te blokkeren, terwijl toepassen/bijwerken via de Gateway-tool/configuratie toegestaan blijft).
    - `SIGINT`-/`SIGTERM`-handlers stoppen het Gateway-proces, maar ze herstellen geen aangepaste terminalstatus. Als je de CLI verpakt met een TUI of invoer in raw-modus, herstel dan de terminal voordat je afsluit.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaardwaarde komt uit configuratie/env; meestal `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindmodus van de luistersocket.
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
  Lees het Gateway-wachtwoord uit een bestand.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Stel de Gateway beschikbaar via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset de Tailscale serve/funnel-configuratie bij afsluiten.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Sta toe dat de Gateway start zonder `gateway.mode=local` in de configuratie. Omzeilt de opstartbeveiliging alleen voor ad-hoc-/ontwikkelbootstrap; schrijft of repareert het configuratiebestand niet.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een ontwikkelconfiguratie + werkruimte aan als die ontbreken (slaat BOOTSTRAP.md over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset ontwikkelconfiguratie + referenties + sessies + werkruimte (vereist `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Beëindig elke bestaande luistersocket op de geselecteerde poort voordat wordt gestart.
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

`openclaw gateway restart --safe` vraagt de actieve Gateway om actieve OpenClaw-werkzaamheden vooraf te controleren voordat wordt herstart. Als bewerkingen in de wachtrij, antwoordbezorging, ingebedde runs of taakruns actief zijn, meldt de Gateway de blokkeringen, voegt dubbele veilige herstartverzoeken samen en herstart zodra het actieve werk is afgerond. Een gewone `restart` behoudt het bestaande service-managergedrag voor compatibiliteit. Gebruik `--force` alleen wanneer je expliciet het onmiddellijke overridepad wilt.

`openclaw gateway restart --safe --skip-deferral` voert dezelfde OpenClaw-bewuste gecoördineerde herstart uit als `--safe`, maar omzeilt de uitstelcontrole voor actief werk zodat de Gateway de herstart onmiddellijk uitvoert, zelfs wanneer blokkeringen worden gemeld. Gebruik dit als noodroute voor operators wanneer een uitstel is vastgezet door een vastgelopen taakrun en alleen `--safe` voor onbepaalde tijd zou wachten. `--skip-deferral` vereist `--safe`.

<Warning>
Inline `--password` kan zichtbaar worden in lokale proceslijsten. Geef de voorkeur aan `--password-file`, env of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Opstartprofilering

- Stel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in om fasetimings tijdens het opstarten van de Gateway te loggen, inclusief `eventLoopMax`-vertraging per fase en Plugin-opzoektabeltimings voor geïnstalleerde index, manifestregister, opstartplanning en owner-mapwerk.
- Stel `OPENCLAW_DIAGNOSTICS=timeline` in met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` om een best-effort JSONL-tijdlijn voor opstartdiagnostiek te schrijven voor externe QA-harnassen. Je kunt de vlag ook inschakelen met `diagnostics.flags: ["timeline"]` in de configuratie; het pad wordt nog steeds via env geleverd. Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loop-samples op te nemen.
- Voer `pnpm test:startup:gateway -- --runs 5 --warmup 1` uit om het opstarten van de Gateway te benchmarken. De benchmark registreert eerste procesuitvoer, `/healthz`, `/readyz`, opstarttracetimings, event-loop-vertraging en timingdetails van Plugin-opzoektabellen.

## Een actieve Gateway bevragen

Alle bevragingsopdrachten gebruiken WebSocket-RPC.

<Tabs>
  <Tab title="Uitvoermodi">
    - Standaard: menselijk leesbaar (gekleurd in TTY).
    - `--json`: machineleesbare JSON (geen opmaak/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit terwijl de menselijke indeling behouden blijft.

  </Tab>
  <Tab title="Gedeelde opties">
    - `--url <url>`: Gateway-WebSocket-URL.
    - `--token <token>`: Gateway-token.
    - `--password <password>`: Gateway-wachtwoord.
    - `--timeout <ms>`: time-out/budget (verschilt per opdracht).
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

Het HTTP-eindpunt `/healthz` is een liveness-probe: het geeft antwoord zodra de server HTTP kan beantwoorden. Het HTTP-eindpunt `/readyz` is strenger en blijft rood terwijl opstart-Plugin-sidecars, kanalen of geconfigureerde hooks nog aan het stabiliseren zijn. Lokale of geauthenticeerde gedetailleerde gereedheidsantwoorden bevatten een diagnostisch `eventLoop`-blok met event-loop-vertraging, event-loop-benutting, CPU-kernratio en een `degraded`-vlag.

### `gateway usage-cost`

Haal gebruikskostenoverzichten op uit sessielogs.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Aantal dagen om op te nemen.
</ParamField>

### `gateway stability`

Haal de recente diagnostische stabiliteitsrecorder op van een actieve Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximaal aantal recente gebeurtenissen om op te nemen (max `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op diagnostisch gebeurtenistype, zoals `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen gebeurtenissen op na een diagnostisch sequentienummer.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een opgeslagen stabiliteitsbundel in plaats van de actieve Gateway aan te roepen. Gebruik `--bundle latest` (of gewoon `--bundle`) voor de nieuwste bundel onder de statusdirectory, of geef direct een JSON-pad naar een bundel door.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbare zip met supportdiagnostiek in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy- en bundelgedrag">
    - Records bewaren operationele metadata: gebeurtenisnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/Pluginnamen en geredigeerde sessieoverzichten. Ze bewaren geen chattekst, Webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies, geheime waarden, hostnamen of ruwe sessie-id's. Stel `diagnostics.enabled: false` in om de recorder volledig uit te schakelen.
    - Bij fatale Gateway-afsluitingen, time-outs bij afsluiten en opstartfouten na herstarten schrijft OpenClaw dezelfde diagnostische snapshot naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de recorder gebeurtenissen bevat. Inspecteer de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` zijn ook van toepassing op bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokale diagnostiekzip die is ontworpen om aan bugrapporten toe te voegen. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en de bundelinhoud.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Zip-uitvoerpad. Standaard naar een ondersteuningsexport onder de statusdirectory.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximaal aantal opgeschoonde logregels om op te nemen.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximaal aantal logbytes om te inspecteren.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway-WebSocket-URL voor de gezondheidssnapshot.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-token voor de gezondheidssnapshot.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-wachtwoord voor de gezondheidssnapshot.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Time-out voor status-/gezondheidssnapshot.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Sla het opzoeken van opgeslagen stabiliteitsbundels over.
</ParamField>
<ParamField path="--json" type="boolean">
  Geef het geschreven pad, de grootte en het manifest weer als JSON.
</ParamField>

De export bevat een manifest, een Markdown-samenvatting, configuratiestructuur, opgeschoonde configuratiedetails, opgeschoonde logoverzichten, opgeschoonde Gateway-status-/gezondheidssnapshots en de nieuwste stabiliteitsbundel wanneer die bestaat.

Deze is bedoeld om te delen. De export bewaart operationele details die helpen bij debugging, zoals veilige OpenClaw-logvelden, subsysteemnamen, statuscodes, duurwaarden, geconfigureerde modi, poorten, Plugin-id's, provider-id's, niet-geheime functie-instellingen en geredigeerde operationele logberichten. De export laat chattekst, Webhook-bodies, tooluitvoer, referenties, cookies, account-/berichtidentificatoren, prompt-/instructietekst, hostnamen en geheime waarden weg of redigeert ze. Wanneer een LogTape-achtig bericht lijkt op payloadtekst van gebruiker/chat/tool, bewaart de export alleen dat er een bericht is weggelaten plus het aantal bytes.

### `gateway status`

`gateway status` toont de Gateway-service (launchd/systemd/schtasks) plus een optionele controle van connectiviteits-/authenticatiemogelijkheid.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Voeg een expliciet doel voor de probe toe. Geconfigureerde externe + localhost worden nog steeds geprobed.
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
  <Accordion title="Status semantics">
    - `gateway status` blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - Standaard `gateway status` bewijst de servicestatus, WebSocket-verbinding en de auth-capability die zichtbaar is tijdens de handshake. Het bewijst geen lees-/schrijf-/adminbewerkingen.
    - Diagnostische probes wijzigen niets voor apparaatauth bij eerste gebruik: ze hergebruiken een bestaand gecachet apparaattoken wanneer dat bestaat, maar maken geen nieuwe CLI-apparaatidentiteit of alleen-lezen apparaatkoppelingsrecord aan alleen om de status te controleren.
    - `gateway status` lost geconfigureerde auth-SecretRefs voor probe-auth op wanneer mogelijk.
    - Als een vereiste auth-SecretRef niet wordt opgelost in dit opdrachtpad, rapporteert `gateway status --json` `rpc.authWarning` wanneer probe-connectiviteit/auth mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
    - Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-verwijzingen onderdrukt om fout-positieven te voorkomen.
    - Gebruik `--require-rpc` in scripts en automatisering wanneer een luisterende service niet genoeg is en je ook gezonde RPC-aanroepen met leesbereik nodig hebt.
    - `--deep` voegt een best-effort scan toe voor extra launchd/systemd/schtasks-installaties. Wanneer meerdere Gateway-achtige services worden gedetecteerd, toont uitvoer voor mensen opschoonhints en waarschuwt die dat de meeste setups één Gateway per machine zouden moeten draaien.
    - `--deep` rapporteert ook een recente Gateway-supervisor-herstartoverdracht wanneer het serviceproces netjes is afgesloten voor een externe supervisor-herstart.
    - Uitvoer voor mensen bevat het opgeloste pad voor bestandslogs plus een momentopname van CLI-versus-serviceconfiguratiepaden/geldigheid om profiel- of state-dir-afwijking te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Op Linux-systemd-installaties lezen controles op service-auth-afwijking zowel `Environment=`- als `EnvironmentFile=`-waarden uit de unit (inclusief `%h`, aangehaalde paden, meerdere bestanden en optionele `-`-bestanden).
    - Afwijkingscontroles lossen `gateway.auth.token`-SecretRefs op met de samengevoegde runtime-env (eerst de env van de serviceopdracht, daarna process-env als fallback).
    - Als token-auth niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan controles op tokenafwijking het oplossen van configtokens over.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` is de opdracht "debug everything". Deze probet altijd:

- je geconfigureerde externe Gateway (indien ingesteld), en
- localhost (loopback) **zelfs als extern is geconfigureerd**.

Als je `--url` doorgeeft, wordt dat expliciete doel vóór beide toegevoegd. Uitvoer voor mensen labelt de doelen als:

- `URL (explicit)`
- `Remote (configured)` of `Remote (configured, inactive)`
- `Local loopback`

<Note>
Als meerdere Gateways bereikbaar zijn, worden ze allemaal afgedrukt. Meerdere Gateways worden ondersteund wanneer je geïsoleerde profielen/poorten gebruikt (bijvoorbeeld een reddingsbot), maar de meeste installaties draaien nog steeds één Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` betekent dat ten minste één doel een WebSocket-verbinding heeft geaccepteerd.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` rapporteert wat de probe kon bewijzen over auth. Dit staat los van bereikbaarheid.
    - `Read probe: ok` betekent dat RPC-aanroepen met leesbereik voor details (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat verbinden is gelukt, maar RPC met leesbereik beperkt is. Dit wordt gerapporteerd als **verminderde** bereikbaarheid, niet als volledige mislukking.
    - `Read probe: failed` na `Connect: ok` betekent dat de Gateway de WebSocket-verbinding heeft geaccepteerd, maar dat vervolgleesdiagnostiek is verlopen of mislukt. Dit is ook **verminderde** bereikbaarheid, geen onbereikbare Gateway.
    - Net als `gateway status` hergebruikt probe bestaande gecachete apparaatauth, maar maakt het geen apparaatidentiteit of koppelingsstatus voor eerste gebruik aan.
    - De afsluitcode is alleen niet-nul wanneer geen enkel geprobed doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON output">
    Topniveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel heeft een verbinding geaccepteerd maar heeft volledige detail-RPC-diagnostiek niet voltooid.
    - `capability`: beste capability die is gezien over bereikbare doelen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te behandelen in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerde externe, daarna local loopback.
    - `warnings[]`: best-effort waarschuwingsrecords met `code`, `message` en optionele `targetIds`.
    - `network`: hints voor local loopback-/tailnet-URL's afgeleid uit de huidige configuratie en hostnetwerk.
    - `discovery.timeoutMs` en `discovery.count`: het daadwerkelijke discovery-budget/resultaantal dat voor deze probe-run is gebruikt.

    Per doel (`targets[].connect`):

    - `ok`: bereikbaarheid na verbinding + verminderde classificatie.
    - `rpcOk`: volledige detail-RPC geslaagd.
    - `scopeLimited`: detail-RPC mislukt vanwege ontbrekend operatorbereik.

    Per doel (`targets[].auth`):

    - `role`: auth-rol gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `scopes`: toegekende bereiken gerapporteerd in `hello-ok` wanneer beschikbaar.
    - `capability`: de getoonde auth-capability-classificatie voor dat doel.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: SSH-tunnelinstelling mislukt; de opdracht is teruggevallen op directe probes.
    - `multiple_gateways`: meer dan één doel was bereikbaar; dit is ongebruikelijk tenzij je bewust geïsoleerde profielen draait, zoals een reddingsbot.
    - `auth_secretref_unresolved`: een geconfigureerde auth-SecretRef kon niet worden opgelost voor een mislukt doel.
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
  `user@host` of `user@host:port` (poort standaard naar `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Identiteitsbestand.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Kies de eerste ontdekte Gateway-host als SSH-doel uit het opgeloste discovery-eindpunt (`local.` plus het geconfigureerde wide-area-domein, indien aanwezig). Alleen-TXT-hints worden genegeerd.
</ParamField>

Config (optioneel, gebruikt als standaardwaarden):

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
secrets-manager-shim of een uitvoeren-als-helper. De wrapper ontvangt de normale Gateway-args en is
verantwoordelijk voor het uiteindelijk uitvoeren van `openclaw` of Node met die args.

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
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Koppel `gateway stop` en `gateway start` niet als vervanging voor een herstart.
    - Op macOS gebruikt `gateway stop` standaard `launchctl bootout`, waarmee de LaunchAgent uit de huidige opstartsessie wordt verwijderd zonder een uitschakeling permanent te maken — KeepAlive-autoherstel blijft actief voor toekomstige crashes en `gateway start` schakelt alles weer schoon in zonder handmatige `launchctl enable`. Geef `--disable` mee om KeepAlive en RunAtLoad blijvend te onderdrukken, zodat de Gateway niet opnieuw start tot de volgende expliciete `gateway start`; gebruik dit wanneer een handmatige stop herstarts of systeemherstarts moet overleven.
    - `gateway restart --safe` vraagt de actieve Gateway om actief OpenClaw-werk vooraf te controleren en de herstart uit te stellen totdat antwoordlevering, ingebedde runs en taakruns zijn afgerond. `--safe` kan niet worden gecombineerd met `--force` of `--wait`.
    - `gateway restart --wait 30s` overschrijft het geconfigureerde budget voor het afronden van werk bij een herstart voor die herstart. Losse getallen zijn milliseconden; eenheden zoals `s`, `m` en `h` worden geaccepteerd. `--wait 0` wacht onbeperkt.
    - `gateway restart --safe --skip-deferral` voert de OpenClaw-bewuste veilige herstart uit, maar omzeilt de uitstelsluis zodat de Gateway de herstart meteen uitzendt, zelfs wanneer blokkerende factoren worden gemeld. Uitweg voor operators bij uitstel door vastgelopen taakruns; vereist `--safe`.
    - `gateway restart --force` slaat het afronden van actief werk over en herstart onmiddellijk. Gebruik dit wanneer een operator de vermelde taakblokkades al heeft geïnspecteerd en de gateway nu terug wil.
    - Lifecycle-opdrachten accepteren `--json` voor scripting.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Wanneer token-authenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `gateway install` dat de SecretRef oplosbaar is, maar wordt het opgeloste token niet opgeslagen in omgevingsmetadata van de service.
    - Als token-authenticatie een token vereist en de geconfigureerde token-SecretRef niet oplosbaar is, mislukt de installatie gesloten in plaats van fallback-platte tekst op te slaan.
    - Gebruik voor wachtwoordauthenticatie bij `gateway run` liever `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` dan inline `--password`.
    - In afgeleide authenticatiemodus versoepelt alleen in de shell ingestelde `OPENCLAW_GATEWAY_PASSWORD` de tokenvereisten voor installatie niet; gebruik duurzame configuratie (`gateway.auth.password` of config `env`) bij het installeren van een beheerde service.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt de installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant naar Gateway-bakens (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): kies een domein (voorbeeld: `openclaw.internal.`) en stel split DNS + een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen gateways waarvoor Bonjour-detectie is ingeschakeld (standaard) adverteren het baken.

Wide-Area-detectierecords bevatten (TXT):

- `role` (hint voor gatewayrol)
- `transport` (hint voor transport, bijv. `gateway`)
- `gatewayPort` (WebSocket-poort, meestal `18789`)
- `sshPort` (optioneel; clients gebruiken standaard SSH-doelen op `22` wanneer dit ontbreekt)
- `tailnetDns` (MagicDNS-hostnaam, indien beschikbaar)
- `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld + certificaatvingerafdruk)
- `cliPath` (hint voor externe installatie die naar de Wide-Area-zone wordt geschreven)

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
- De CLI scant `local.` plus het geconfigureerde Wide-Area-domein wanneer er een is ingeschakeld.
- `wsUrl` in JSON-uitvoer wordt afgeleid van het opgeloste service-eindpunt, niet van hints die alleen in TXT staan, zoals `lanHost` of `tailnetDns`.
- Op `local.` mDNS worden `sshPort` en `cliPath` alleen uitgezonden wanneer `discovery.mdns.mode` `full` is. Wide-Area DNS-SD schrijft nog steeds `cliPath`; `sshPort` blijft daar ook optioneel.

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
