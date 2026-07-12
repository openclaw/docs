---
read_when:
    - De Gateway uitvoeren vanuit de CLI (ontwikkeling of servers)
    - Gateway-authenticatie, bindmodi en connectiviteit debuggen
    - Gateways ontdekken via Bonjour (lokaal + wide-area DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway-CLI (`openclaw gateway`) — gateways uitvoeren, opvragen en ontdekken
title: Gateway
x-i18n:
    generated_at: "2026-07-12T08:44:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

De Gateway is de WebSocket-server van OpenClaw (kanalen, nodes, sessies, hooks). Alle onderstaande subopdrachten vallen onder `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Bonjour-detectie" href="/nl/gateway/bonjour">
    Configuratie voor lokale mDNS + DNS-SD over een groot bereik.
  </Card>
  <Card title="Overzicht van detectie" href="/nl/gateway/discovery">
    Hoe OpenClaw gateways aankondigt en vindt.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration">
    Gateway-configuratiesleutels op het hoogste niveau.
  </Card>
</CardGroup>

## De Gateway uitvoeren

```bash
openclaw gateway
openclaw gateway run   # equivalent, explicit form
```

<AccordionGroup>
  <Accordion title="Opstartgedrag">
    - Weigert te starten tenzij `gateway.mode=local` is ingesteld in `~/.openclaw/openclaw.json`. Gebruik `--allow-unconfigured` voor ad-hoc-/ontwikkeluitvoeringen; hiermee wordt de beveiligingscontrole omzeild zonder configuratie te schrijven of te herstellen.
    - `openclaw onboard --mode local` en `openclaw setup` schrijven `gateway.mode=local`. Als het configuratiebestand bestaat maar `gateway.mode` ontbreekt, wordt dit beschouwd als beschadigde of overschreven configuratie en weigert de Gateway `local` voor u te raden — voer de onboarding opnieuw uit, stel de sleutel handmatig in of geef `--allow-unconfigured` door.
    - Binden buiten loopback zonder authenticatie wordt geblokkeerd.
    - De `--bind`-waarden `lan`, `tailnet` en `custom` worden momenteel uitsluitend via IPv4-paden opgelost; zelfbeheerde hosts met alleen IPv6 hebben vóór de Gateway een IPv4-sidecar of -proxy nodig.
    - `SIGUSR1` activeert een herstart binnen het proces wanneer dit is geautoriseerd. `commands.restart` (standaard: ingeschakeld) beheert extern verzonden `SIGUSR1`; stel dit in op `false` om handmatige herstarts via OS-signalen te blokkeren, terwijl herstarten via de opdracht `gateway restart`, de gateway-tool en het toepassen of bijwerken van configuratie mogelijk blijft.
    - `SIGINT`/`SIGTERM` stoppen het proces, maar herstellen geen aangepaste terminalstatus — als u de CLI in een TUI of invoer in raw-modus verpakt, moet u de terminal vóór het afsluiten zelf herstellen.

  </Accordion>
</AccordionGroup>

### Opties

<ParamField path="--port <port>" type="number">
  WebSocket-poort (standaard uit configuratie/omgeving; meestal `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Bindingsmodus: `loopback` (standaard), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gedeeld token voor `connect.params.auth.token`. Is standaard `OPENCLAW_GATEWAY_TOKEN` wanneer dit is ingesteld.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Authenticatiemodus: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Wachtwoord voor `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lees het Gateway-wachtwoord uit een bestand.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale-blootstelling: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Stel de Tailscale-serve-/funnelconfiguratie opnieuw in bij het afsluiten.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Start zonder `gateway.mode=local` af te dwingen. Alleen voor ad-hoc-/ontwikkelinitialisatie; configuratie wordt niet opgeslagen of hersteld.
</ParamField>
<ParamField path="--dev" type="boolean">
  Maak een ontwikkelconfiguratie + werkruimte als deze ontbreken (slaat `BOOTSTRAP.md` over).
</ParamField>
<ParamField path="--reset" type="boolean">
  Stel de ontwikkelconfiguratie, aanmeldgegevens, sessies en werkruimte opnieuw in. Vereist `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Beëindig vóór het starten elke bestaande listener op de doelpoort.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Uitgebreide logboekregistratie naar stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Toon alleen CLI-backendlogboeken in de console (schakelt ook stdout/stderr in).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket-logboekstijl: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias voor `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registreer onbewerkte modelstreamgebeurtenissen in JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  JSONL-pad voor de onbewerkte stream.
</ParamField>

`--claude-cli-logs` is een verouderde alias voor `--cli-backend-logs`.

Stel voor `--bind custom` `gateway.customBindHost` in op een IPv4-adres. Elk ander adres dan `127.0.0.1` of `0.0.0.0` vereist ook `127.0.0.1` op dezelfde poort voor clients op dezelfde host; het opstarten mislukt als een van beide listeners niet kan binden. Het jokerteken `0.0.0.0` voegt geen afzonderlijke vereiste alias toe. Zelfbeheerde hosts met alleen IPv6 hebben vóór de Gateway een IPv4-sidecar of -proxy nodig.

## De Gateway herstarten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` vraagt de actieve Gateway om actief werk vooraf te controleren en één samengevoegde herstart te plannen nadat dat werk is afgerond. De wachttijd wordt begrensd door `gateway.reload.deferralTimeoutMs` (standaard: 5 minuten / `300000`); wanneer het tijdsbudget verloopt, wordt de herstart afgedwongen. Stel `deferralTimeoutMs: 0` in om onbeperkt te wachten (met periodieke waarschuwingen dat er nog werk wacht) in plaats van de herstart af te dwingen. `--safe` kan niet worden gecombineerd met `--force` of `--wait`.

`--skip-deferral` omzeilt bij een veilige herstart de uitstelcontrole voor actief werk, zodat de Gateway onmiddellijk herstart, zelfs wanneer blokkerende factoren zijn gemeld. Hiervoor is `--safe` vereist — gebruik dit wanneer uitstel vastzit door een ontspoorde taak.

`--wait <duration>` overschrijft het tijdsbudget voor het afronden bij een gewone (niet-veilige) herstart. Accepteert milliseconden zonder achtervoegsel of de eenheidsachtervoegsels `ms`, `s`, `m`, `h`, `d` (bijvoorbeeld `30s`, `5m`, `1h30m`); `--wait 0` wacht onbeperkt. Niet compatibel met `--force` of `--safe`.

`--force` slaat het afronden van actief werk over en herstart onmiddellijk. Een gewone `restart` (zonder vlaggen) behoudt het bestaande herstartgedrag van de servicebeheerder.

<Warning>
Een inline `--password` kan zichtbaar zijn in lokale procesoverzichten. Gebruik bij voorkeur `--password-file`, een omgevingsvariabele of een door SecretRef ondersteunde `gateway.auth.password`.
</Warning>

### Gateway-profilering

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` registreert fasetimings tijdens het opstarten, inclusief de vertraging van `eventLoopMax` per fase en timings voor Plugin-opzoektabellen (geïnstalleerde index, manifestregister, opstartplanning en verwerking van de eigenaartoewijzing).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` registreert op de herstart afgestemde regels met `restart trace:`: signaalafhandeling, afronding van actief werk, afsluitfasen, de volgende start, gereedheidstiming en geheugenmetrieken.
- `OPENCLAW_DIAGNOSTICS=timeline` met `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` schrijft naar beste vermogen een JSONL-tijdlijn met diagnostische opstartgegevens voor externe QA-harnassen (gelijkwaardig aan de configuratie `diagnostics.flags: ["timeline"]`; het pad is nog steeds alleen via een omgevingsvariabele beschikbaar). Voeg `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` toe om event-loopmetingen op te nemen.
- `pnpm build` gevolgd door `pnpm test:startup:gateway -- --runs 5 --warmup 1` meet de opstartprestaties van de Gateway ten opzichte van het gebouwde CLI-toegangspunt: eerste procesuitvoer, `/healthz`, `/readyz`, timings van de opstarttracering, event-loopvertraging en timing van de Plugin-opzoektabel.
- `pnpm build` gevolgd door `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` meet de prestaties van herstarts binnen het proces op macOS of Linux (niet ondersteund op Windows; voor herstarten is `SIGUSR1` vereist). Gebruikt `SIGUSR1`, schakelt beide traceringen in het onderliggende proces in en registreert de volgende `/healthz`, de volgende `/readyz`, uitvaltijd, gereedheidstiming, CPU, RSS en metrieken van de herstarttracering.
- `/healthz` geeft aan of het proces actief is; `/readyz` geeft aan of het bruikbaar en gereed is. Beschouw traceringsregels en benchmarkuitvoer als signalen voor toewijzing aan een eigenaar, niet als een volledige prestatieconclusie op basis van één tijdsinterval of meting.

## Een actieve Gateway opvragen

Alle opvraagopdrachten gebruiken WebSocket-RPC.

<Tabs>
  <Tab title="Uitvoermodi">
    - Standaard: leesbaar voor mensen (gekleurd in een TTY).
    - `--json`: machineleesbare JSON (zonder opmaak/spinner).
    - `--no-color` (of `NO_COLOR=1`): schakel ANSI uit en behoud de voor mensen leesbare indeling.

  </Tab>
  <Tab title="Gedeelde opties">
    - `--url <url>`: WebSocket-URL van de Gateway.
    - `--token <token>`: Gateway-token.
    - `--password <password>`: Gateway-wachtwoord.
    - `--timeout <ms>`: time-out/tijdsbudget (de standaard verschilt per opdracht; zie elke opdracht hieronder).
    - `--expect-final`: wacht op een 'definitief' antwoord (agentaanroepen).

  </Tab>
</Tabs>

<Note>
Wanneer u `--url` instelt, valt de CLI niet terug op aanmeldgegevens uit de configuratie of omgeving. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete aanmeldgegevens leiden tot een fout.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` is een activiteitscontrole: deze retourneert zodra de server HTTP kan beantwoorden. `/readyz` is strenger en blijft rood terwijl Plugin-sidecars, kanalen of geconfigureerde hooks tijdens het opstarten nog worden geïnitialiseerd. Lokale of geauthenticeerde gedetailleerde `/readyz`-antwoorden bevatten een diagnostisch `eventLoop`-blok (vertraging, gebruik, verhouding tot CPU-kernen en de vlag `degraded`).

<ParamField path="--port <port>" type="number">
  Richt deze aanroep op een lokale local loopback Gateway op deze poort. Overschrijft `OPENCLAW_GATEWAY_URL` en `OPENCLAW_GATEWAY_PORT`.
</ParamField>

### `gateway usage-cost`

Haal overzichten van gebruikskosten op uit sessielogboeken.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Aantal op te nemen dagen.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Beperk het overzicht tot één geconfigureerde agent-id.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Voeg gegevens van alle geconfigureerde agents samen. Kan niet worden gecombineerd met `--agent`.
</ParamField>

### `gateway stability`

Haal de recente diagnostische stabiliteitsregistratie op uit een actieve Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximumaantal op te nemen recente gebeurtenissen (maximaal `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter op diagnostisch gebeurtenistype, bijvoorbeeld `payload.large` of `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Neem alleen gebeurtenissen na een diagnostisch volgnummer op.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lees een opgeslagen stabiliteitsbundel in plaats van de actieve Gateway aan te roepen. `--bundle latest` (of alleen `--bundle`) kiest de nieuwste bundel in de statusmap; u kunt ook rechtstreeks een JSON-pad naar een bundel doorgeven.
</ParamField>
<ParamField path="--export" type="boolean">
  Schrijf een deelbaar ZIP-bestand met ondersteuningsdiagnostiek in plaats van stabiliteitsdetails af te drukken.
</ParamField>
<ParamField path="--output <path>" type="string">
  Uitvoerpad voor `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy en bundelgedrag">
    - Registraties bewaren operationele metagegevens: gebeurtenisnamen, aantallen, bytegroottes, geheugenmetingen, wachtrij-/sessiestatus, goedkeurings-id's, namen van kanalen/Plugins en geredigeerde sessieoverzichten. Ze sluiten chattekst, Webhook-inhoud, tooluitvoer, onbewerkte aanvraag-/antwoordinhoud, tokens, cookies, geheime waarden, hostnamen en onbewerkte sessie-id's uit. Stel `diagnostics.enabled: false` in om de registratie volledig uit te schakelen.
    - Fatale afsluitingen van de Gateway, time-outs bij het afsluiten en opstartfouten na een herstart schrijven dezelfde diagnostische momentopname naar `~/.openclaw/logs/stability/openclaw-stability-*.json` wanneer de registratie gebeurtenissen bevat. Bekijk de nieuwste bundel met `openclaw gateway stability --bundle latest`; `--limit`, `--type` en `--since-seq` zijn ook van toepassing op bundeluitvoer.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schrijf een lokaal ZIP-bestand met diagnostische gegevens dat is bedoeld voor foutrapporten. Zie [Diagnostische export](/nl/gateway/diagnostics) voor het privacymodel en de inhoud van de bundel.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Pad van het uitvoer-zipbestand. Standaard wordt een ondersteuningsexport in de statusmap gebruikt.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximumaantal opgeschoonde logboekregels dat wordt opgenomen.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximumaantal te inspecteren logboekbytes.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket-URL van de Gateway voor de momentopname van de statuscontrole.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-token voor de momentopname van de statuscontrole.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-wachtwoord voor de momentopname van de statuscontrole.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Time-out voor de status-/statuscontrolemomentopname.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Sla het zoeken naar een opgeslagen stabiliteitsbundel over.
</ParamField>
<ParamField path="--json" type="boolean">
  Geef het geschreven pad, de grootte en het manifest weer als JSON.
</ParamField>

De export bundelt: `manifest.json` (bestandsinventaris), `summary.md` (Markdown-samenvatting), `diagnostics.json` (samenvatting op hoofdniveau van configuratie/logboeken/detectie/stabiliteit/status/statuscontrole), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` en `stability/latest.json` wanneer er een bundel bestaat.

De export is ontworpen om te worden gedeeld. Nuttige operationele details voor foutopsporing blijven behouden — veilige logboekvelden, namen van subsystemen, statuscodes, tijdsduren, geconfigureerde modi, poorten, Plugin-/provider-id's, niet-geheime functie-instellingen en geredigeerde operationele logboekberichten — terwijl chattekst, Webhook-inhoud, tooluitvoer, aanmeldgegevens, cookies, account-/bericht-id's, prompt-/instructietekst, hostnamen en geheime waarden worden weggelaten of geredigeerd. Wanneer een logboekbericht op tekst uit een gebruikers-, chat- of toolpayload lijkt (bijvoorbeeld "gebruiker zei", "chattekst", "tooluitvoer", "Webhook-inhoud"), vermeldt de export alleen dat een bericht is weggelaten en wat de bytegrootte ervan was.

### `gateway status`

Toont de Gateway-service (launchd/systemd/schtasks) plus een optionele verbindings-/authenticatieprobe.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Voeg een expliciet probedoel toe. De geconfigureerde externe host en localhost worden nog steeds getest.
</ParamField>
<ParamField path="--token <token>" type="string">
  Tokenauthenticatie voor de probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Wachtwoordauthenticatie voor de probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Time-out voor de probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Sla de verbindingsprobe over (weergave van alleen de service).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scan ook services op systeemniveau.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Breid de verbindingsprobe uit tot een leesprobe en sluit af met een niet-nulcode als deze mislukt. Kan niet worden gecombineerd met `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantiek">
    - Blijft beschikbaar voor diagnostiek, zelfs wanneer de lokale CLI-configuratie ontbreekt of ongeldig is.
    - De standaarduitvoer toont de servicestatus, de WebSocket-verbinding en de bij de handshake zichtbare authenticatiemogelijkheid — niet lees-, schrijf- of beheerdersbewerkingen.
    - Probes brengen bij eerste apparaatauthenticatie geen wijzigingen aan: ze hergebruiken een bestaand gecachet apparaattoken wanneer dat aanwezig is, maar maken nooit een nieuwe CLI-apparaatidentiteit of alleen-lezen-koppelingsrecord aan om alleen de status te controleren.
    - Lost waar mogelijk geconfigureerde SecretRefs voor authenticatie op voor probe-authenticatie. Als een vereiste SecretRef niet kan worden opgelost, rapporteert `--json` `rpc.authWarning` wanneer de probe voor verbinding/authenticatie mislukt; geef `--token`/`--password` expliciet door of herstel de geheime bron. Waarschuwingen over niet-opgeloste authenticatie worden onderdrukt zodra de probe slaagt.
    - JSON-uitvoer bevat `gateway.version` wanneer de actieve Gateway dit rapporteert; `--require-rpc` kan terugvallen op de RPC-payload `status.runtimeVersion` als de handshakeprobe geen versiemetadata kan leveren.
    - Gebruik `--require-rpc` in scripts/automatisering wanneer een luisterende service niet voldoende is en RPC met leesbereik ook gezond moet zijn.
    - `--deep` scant op extra installaties van launchd/systemd/schtasks; wanneer meerdere Gateway-achtige services worden gevonden, geeft de voor mensen leesbare uitvoer opschoontips weer (voer doorgaans één Gateway per machine uit) en wordt, indien relevant, een recente overdracht na herstart door de supervisor gemeld.
    - `--deep` voert ook configuratievalidatie uit in Plugin-bewuste modus (`pluginValidation: "full"`) en toont waarschuwingen uit Plugin-manifesten (bijvoorbeeld ontbrekende configuratiemetadata voor kanalen). De standaardopdracht `gateway status` gebruikt het snelle alleen-lezen-pad dat Plugin-validatie overslaat.
    - De voor mensen leesbare uitvoer bevat het opgeloste pad van het bestandslogboek plus de configuratiepaden en geldigheid van CLI en service, om afwijkingen in profiel of statusmap te helpen diagnosticeren.

  </Accordion>
  <Accordion title="Controles op authenticatieafwijkingen in Linux systemd">
    - Controles op afwijkingen in service-authenticatie lezen zowel `Environment=` als `EnvironmentFile=` uit de unit (inclusief `%h`, paden tussen aanhalingstekens, meerdere bestanden en optionele bestanden met `-`).
    - Lost SecretRefs voor `gateway.auth.token` op met de samengevoegde runtime-omgeving (eerst de omgeving van de serviceopdracht, daarna als terugval de procesomgeving).
    - Controles op tokenafwijkingen slaan het oplossen van configuratietokens over wanneer tokenauthenticatie feitelijk niet actief is (`gateway.auth.mode` expliciet ingesteld op `password`/`none`/`trusted-proxy`, of modus niet ingesteld terwijl het wachtwoord voorrang kan krijgen en geen tokenkandidaat kan winnen).

  </Accordion>
</AccordionGroup>

### `gateway probe`

De opdracht om „alles te debuggen”. Deze test altijd:

- uw geconfigureerde externe Gateway (indien ingesteld), en
- localhost (local loopback), **zelfs als een externe Gateway is geconfigureerd**.

Met `--url` wordt dat expliciete doel vóór beide toegevoegd. De voor mensen leesbare uitvoer labelt doelen als `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` en `Local loopback`.

<Note>
Als meerdere probedoelen bereikbaar zijn, worden ze allemaal weergegeven. Een SSH-tunnel, TLS-/proxy-URL en geconfigureerde externe URL kunnen naar dezelfde Gateway verwijzen, zelfs met verschillende transportpoorten; `multiple_gateways` is voorbehouden aan bereikbare Gateways die verschillend zijn of waarvan de identiteit niet eenduidig is. Het uitvoeren van meerdere Gateways wordt ondersteund voor geïsoleerde profielen (bijvoorbeeld een reddingsbot), maar de meeste installaties gebruiken één Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Gebruik deze poort voor het lokale local loopback-probedoel en de externe poort van de SSH-tunnel. Zonder `--url` selecteert dit alleen het lokale local loopback-doel in plaats van de geconfigureerde Gateway-omgevings-URL, omgevingspoort of externe doelen.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretatie">
    - `Reachable: yes` betekent dat ten minste één doel een WebSocket-verbinding heeft geaccepteerd.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldt wat de probe over authenticatie kon aantonen, los van bereikbaarheid.
    - `Read probe: ok` betekent dat detail-RPC-aanroepen met leesbereik (`health`/`status`/`system-presence`/`config.get`) ook zijn geslaagd.
    - `Read probe: limited - missing scope: operator.read` betekent dat de verbinding is geslaagd, maar RPC met leesbereik beperkt is. Dit wordt gerapporteerd als **verminderde** bereikbaarheid, niet als volledige mislukking.
    - `Read probe: failed` na `Connect: ok` betekent dat de WebSocket is verbonden, maar dat de daaropvolgende leesdiagnostiek een time-out kreeg of mislukte — eveneens **verminderd**, niet onbereikbaar.
    - Net als `gateway status` hergebruikt de probe bestaande gecachete apparaatauthenticatie, maar maakt deze bij het eerste gebruik geen apparaatidentiteit of koppelingsstatus aan.
    - De afsluitcode is alleen niet nul wanneer geen enkel getest doel bereikbaar is.

  </Accordion>
  <Accordion title="JSON-uitvoer">
    Hoofdniveau:

    - `ok`: ten minste één doel is bereikbaar.
    - `degraded`: ten minste één doel heeft een verbinding geaccepteerd, maar heeft de volledige RPC-detaildiagnostiek niet voltooid.
    - `capability`: beste mogelijkheid die bij bereikbare doelen is waargenomen (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` of `unknown`).
    - `primaryTargetId`: beste doel om als actieve winnaar te beschouwen, in deze volgorde: expliciete URL, SSH-tunnel, geconfigureerde externe host, lokale local loopback.
    - `warnings[]`: waarschuwingrecords op basis van beste inspanning met `code`, `message` en optioneel `targetIds`.
    - `network`: URL-hints voor lokale local loopback/tailnet, afgeleid van de huidige configuratie en hostnetwerken.
    - `discovery.timeoutMs` / `discovery.count`: het werkelijk gebruikte detectiebudget/resultaataantal voor deze proberonde.

    Per doel (`targets[].connect`): `ok` (bereikbaarheid + classificatie als verminderd), `rpcOk` (volledig geslaagde RPC-detaildiagnostiek), `scopeLimited` (detail-RPC mislukt doordat het operatorbereik ontbreekt).

    Per doel (`targets[].auth`): `role` en `scopes` die in `hello-ok` worden gerapporteerd wanneer beschikbaar, plus de getoonde classificatie `capability`.

  </Accordion>
  <Accordion title="Veelvoorkomende waarschuwingscodes">
    - `ssh_tunnel_failed`: het instellen van de SSH-tunnel is mislukt; de opdracht is teruggevallen op directe probes.
    - `multiple_gateways`: verschillende Gateway-identiteiten waren bereikbaar, of OpenClaw kon niet aantonen dat de bereikbare doelen dezelfde Gateway zijn. Een SSH-tunnel, proxy-URL of geconfigureerde externe URL naar dezelfde Gateway activeert dit niet.
    - `auth_secretref_unresolved`: een geconfigureerde SecretRef voor authenticatie kon niet worden opgelost voor een mislukt doel.
    - `probe_scope_limited`: de WebSocket-verbinding is geslaagd, maar de leesprobe werd beperkt doordat `operator.read` ontbrak.
    - `local_tls_runtime_unavailable`: lokale Gateway-TLS is ingeschakeld, maar OpenClaw kon de vingerafdruk van het lokale certificaat niet laden.

  </Accordion>
</AccordionGroup>

#### Extern via SSH (gelijkwaardig aan de Mac-app)

De modus "Remote over SSH" van de macOS-app gebruikt lokale poortdoorschakeling, zodat een externe Gateway die alleen via local loopback bereikbaar is, beschikbaar wordt op `ws://127.0.0.1:<port>`.

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
  Kies de eerste gedetecteerde Gateway-host als SSH-doel vanuit het opgeloste detectie-eindpunt (`local.` plus het geconfigureerde wide-area-domein, indien aanwezig). Hints met alleen TXT worden genegeerd.
</ParamField>

Standaardconfiguratie (optioneel): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

RPC-hulpprogramma op laag niveau.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Tekenreeks met een JSON-object voor parameters.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket-URL van de Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-token.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-wachtwoord.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Time-outbudget.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Voornamelijk voor RPC's in agentstijl die tussentijdse gebeurtenissen streamen vóór een definitieve payload.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare JSON-uitvoer.
</ParamField>

<Note>
`--params` moet geldige JSON zijn en elke methode valideert haar eigen parametervorm (extra of verkeerd benoemde velden worden geweigerd).
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

Gebruik `--wrapper` wanneer de beheerde service via een ander uitvoerbaar bestand moet starten, bijvoorbeeld een shim voor een geheimenbeheerder of een hulpprogramma voor uitvoeren als een andere gebruiker. De wrapper ontvangt de normale Gateway-argumenten en is verantwoordelijk voor het uiteindelijk uitvoeren van `openclaw` of Node met die argumenten.

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

Je kunt de wrapper ook via de omgeving instellen. `gateway install` controleert of het pad een uitvoerbaar bestand is, schrijft de wrapper naar de `ProgramArguments` van de service en bewaart `OPENCLAW_WRAPPER` in de serviceomgeving voor latere geforceerde herinstallaties, updates en reparaties door doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Als je een bewaarde wrapper wilt verwijderen, maak je `OPENCLAW_WRAPPER` leeg tijdens de herinstallatie:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opdrachtopties">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (standaard: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Levenscyclusgedrag">
    - Gebruik `gateway restart` om een beheerde service opnieuw te starten. Koppel `gateway stop` en `gateway start` niet aan elkaar als vervanging voor opnieuw starten.
    - Op macOS gebruikt `gateway stop` standaard `launchctl bootout`. Hiermee wordt de LaunchAgent uit de huidige opstartsessie verwijderd zonder permanent een uitschakeling op te slaan. Automatisch herstel via KeepAlive blijft actief voor toekomstige crashes en `gateway start` schakelt de service weer correct in zonder handmatige `launchctl enable`. Geef `--disable` door om KeepAlive en RunAtLoad blijvend te onderdrukken, zodat de Gateway niet opnieuw wordt gestart tot de volgende expliciete `gateway start`; gebruik dit wanneer een handmatige stop ook na opnieuw opstarten van het systeem moet blijven gelden.
    - Levenscyclusopdrachten accepteren `--json` voor gebruik in scripts.

  </Accordion>
  <Accordion title="Authenticatie en SecretRefs tijdens installatie">
    - Wanneer tokenauthenticatie een token vereist en `gateway.auth.token` via SecretRef wordt beheerd, controleert `gateway install` of de SecretRef kan worden herleid, maar bewaart het herleide token niet in de omgevingsmetadata van de service.
    - Als tokenauthenticatie een token vereist en de geconfigureerde SecretRef voor het token niet kan worden herleid, mislukt de installatie veilig in plaats van een terugvalwaarde als platte tekst op te slaan.
    - Geef voor wachtwoordauthenticatie bij `gateway run` de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` of een door SecretRef ondersteunde `gateway.auth.password` boven een inline `--password`.
    - In afgeleide authenticatiemodus versoepelt een uitsluitend in de shell ingestelde `OPENCLAW_GATEWAY_PASSWORD` de tokenvereisten voor installatie niet; gebruik duurzame configuratie (`gateway.auth.password` of configuratie-`env`) wanneer je een beheerde service installeert.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt de installatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Accordion>
</AccordionGroup>

## Gateways ontdekken (Bonjour)

`gateway discover` scant naar Gateway-bakens (`_openclaw-gw._tcp`).

- Multicast-DNS-SD: `local.`
- Unicast-DNS-SD (Bonjour over een groot netwerk): kies een domein (voorbeeld: `openclaw.internal.`) en stel gesplitste DNS en een DNS-server in; zie [Bonjour](/nl/gateway/bonjour).

Alleen Gateways waarvoor Bonjour-detectie is ingeschakeld (standaard) adverteren het baken.

TXT-aanwijzingen op elk baken: `role` (aanwijzing voor de Gateway-rol), `transport` (aanwijzing voor het transport, bijvoorbeeld `gateway`), `gatewayPort` (WebSocket-poort, meestal `18789`), `tailnetDns` (MagicDNS-hostnaam, indien beschikbaar), `gatewayTls` / `gatewayTlsSha256` (TLS ingeschakeld en certificaatvingerafdruk). `sshPort` en `cliPath` worden alleen gepubliceerd in de volledige detectiemodus (`discovery.mdns.mode: "full"`; standaard is `"minimal"`, waarin ze worden weggelaten — clients gebruiken dan standaard poort `22` voor SSH-doelen).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Time-out per opdracht (bladeren/herleiden).
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare uitvoer (schakelt ook opmaak en spinner uit).
</ParamField>

Voorbeelden:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Scant `local.` en het geconfigureerde domein voor een groot netwerk wanneer dit is ingeschakeld.
- `wsUrl` in JSON-uitvoer wordt afgeleid van het herleide service-eindpunt, niet van uitsluitend via TXT verstrekte aanwijzingen zoals `lanHost` of `tailnetDns`.
- `discovery.mdns.mode` bepaalt de publicatie van `sshPort`/`cliPath` voor zowel `local.`-mDNS als DNS-SD over een groot netwerk (zie hierboven).

</Note>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-draaiboek](/nl/gateway)
