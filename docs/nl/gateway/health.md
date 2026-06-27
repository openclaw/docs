---
read_when:
    - Kanaalconnectiviteit of Gateway-status diagnosticeren
    - Inzicht in CLI-opdrachten en opties voor health checks
summary: Opdrachten voor gezondheidscontrole en bewaking van de Gateway-gezondheid
title: Gezondheidscontroles
x-i18n:
    generated_at: "2026-06-27T17:33:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Korte handleiding om kanaalconnectiviteit te verifiëren zonder te gokken.

## Snelle controles

- `openclaw status` — lokale samenvatting: bereikbaarheid/modus van Gateway, updatehint, leeftijd van gekoppelde kanaalauthenticatie, sessies + recente activiteit.
- `openclaw status --all` — volledige lokale diagnose (alleen-lezen, kleur, veilig om te plakken voor debugging).
- `openclaw status --deep` — vraagt de draaiende Gateway om een live gezondheidsprobe (`health` met `probe:true`), inclusief kanaalprobes per account wanneer ondersteund.
- `openclaw health` — vraagt de draaiende Gateway om zijn gezondheidssnapshot (alleen WS; geen directe kanaalsockets vanuit de CLI).
- `openclaw health --verbose` — forceert een live gezondheidsprobe en toont Gateway-verbindingsdetails.
- `openclaw health --json` — machineleesbare uitvoer van de gezondheidssnapshot.
- Stuur `/status` als zelfstandig bericht in WhatsApp/WebChat om een statusantwoord te krijgen zonder de agent aan te roepen.
- Logs: volg `/tmp/openclaw/openclaw-*.log` en filter op `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Voor Discord en andere chatproviders zijn sessierijen geen socket-liveness.
`openclaw sessions`, Gateway `sessions.list` en de agenttool `sessions_list`
lezen opgeslagen gespreksstatus. Een provider kan opnieuw verbinden en een gezonde
kanaalstatus tonen voordat er een nieuwe sessierij is gematerialiseerd. Gebruik de
kanaalstatus- en gezondheidscommando's hierboven voor live connectiviteitscontroles.

## Diepe diagnostiek

- Referenties op schijf: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime moet recent zijn).
- Sessiestore: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (pad kan in config worden overschreven). Aantal en recente ontvangers worden via `status` getoond.
- Opnieuw koppelen: `openclaw channels logout && openclaw channels login --verbose` wanneer statuscodes 409-515 of `loggedOut` in logs verschijnen. (Opmerking: de QR-loginflow herstart eenmaal automatisch bij status 515 na koppeling.)
- Diagnostiek is standaard ingeschakeld. De Gateway registreert operationele feiten tenzij `diagnostics.enabled: false` is ingesteld. Geheugenevents registreren RSS-/heap-byteaantallen, drempeldruk en groeidruk. Kritieke geheugendruk wordt via de Gateway-logger gelogd. Wanneer `diagnostics.memoryPressureSnapshot: true` is ingesteld, schrijft kritieke geheugendruk ook een pre-OOM-stabiliteitsbundel met V8-heapstatistieken, Linux-cgrouptellers indien beschikbaar, aantallen actieve resources en de grootste sessie-/transcriptbestanden per geredigeerd relatief pad. Liveness-waarschuwingen registreren event-loopvertraging, event-loopgebruik, CPU-coreverhouding en aantallen actieve/wachtende/gequeueëde sessies wanneer het proces draait maar verzadigd is. Events voor te grote payloads registreren wat is geweigerd, afgekapt of in chunks verdeeld, plus groottes en limieten indien beschikbaar. Ze registreren niet de berichttekst, inhoud van bijlagen, Webhook-body, ruwe request- of responsebody, tokens, cookies of geheime waarden. Dezelfde Heartbeat start de begrensde stabiliteitsrecorder, die beschikbaar is via `openclaw gateway stability` of de `diagnostics.stability` Gateway RPC. Fatale Gateway-afsluitingen, shutdowntime-outs en opstartfouten na herstart bewaren de nieuwste recordersnapshot onder `~/.openclaw/logs/stability/` wanneer er events bestaan; kritieke geheugendruk doet dat ook, maar alleen wanneer `diagnostics.memoryPressureSnapshot: true` is ingesteld. Inspecteer de nieuwste opgeslagen bundel met `openclaw gateway stability --bundle latest`.
- Voer voor bugrapporten `openclaw gateway diagnostics export` uit en voeg het gegenereerde zipbestand toe. De export combineert een Markdown-samenvatting, de nieuwste stabiliteitsbundel, opgeschoonde logmetadata, opgeschoonde Gateway-status-/gezondheidssnapshots en configvorm. Deze is bedoeld om te delen: chattekst, Webhook-bodies, tooluitvoer, referenties, cookies, account-/berichtidentifiers en geheime waarden worden weggelaten of geredigeerd. Zie [Diagnostiekexport](/nl/gateway/diagnostics).

## Configuratie van gezondheidsmonitor

- `gateway.channelHealthCheckMinutes`: hoe vaak de Gateway kanaalgezondheid controleert. Standaard: `5`. Stel `0` in om herstarts door de gezondheidsmonitor globaal uit te schakelen.
- `gateway.channelStaleEventThresholdMinutes`: hoe lang een verbonden kanaal inactief mag blijven voordat de gezondheidsmonitor het als verouderd behandelt en herstart. Standaard: `30`. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: voortschrijdende limiet per uur voor herstarts door de gezondheidsmonitor per kanaal/account. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: schakel herstarts door de gezondheidsmonitor uit voor een specifiek kanaal terwijl globale monitoring ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override voor meerdere accounts die voorrang heeft op de instelling op kanaalniveau.
- Deze overrides per kanaal gelden voor de ingebouwde kanaalmonitors die ze vandaag aanbieden: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram en WhatsApp.

## Uptimemonitoring

Externe uptimemonitoringservices moeten het specifieke `/health`-endpoint gebruiken, niet `/v1/chat/completions`.

- **WEL gebruiken:** `GET /health` — directe respons, geen sessie aangemaakt, geen LLM-aanroep, retourneert `{"ok":true,"status":"live"}`
- **NIET gebruiken:** `/v1/chat/completions` voor gezondheidscontroles — elke request maakt een volledige agentsessie aan met Skills-snapshot, contextassemblage en LLM-aanroepen

Wanneer er geen `x-openclaw-session-key`-header of `user`-veld wordt opgegeven, genereert `/v1/chat/completions` voor elke request een nieuwe willekeurige sessie. Monitoringservices die elke 15 minuten pingen maken ongeveer 96 sessies/dag aan, elk met 4-22 KB verbruik. Na verloop van tijd veroorzaakt dit opgeblazen sessiestores en kan het leiden tot overloop van het contextvenster.

### Voorbeelden voor installatie van monitoringservices

- **BetterStack:** Stel de URL voor gezondheidscontrole in op `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Voeg een nieuwe HTTP-monitor toe met URL `https://<your-gateway-host>:<port>/health`
- **Generiek:** Elke HTTP GET naar `/health` retourneert 200 met `{"ok":true}` wanneer de Gateway gezond is

## Wanneer iets faalt

- `logged out` of status 409-515 → koppel opnieuw met `openclaw channels logout` en daarna `openclaw channels login`.
- Gateway onbereikbaar → start hem: `openclaw gateway --port 18789` (gebruik `--force` als de poort bezet is).
- Geen inkomende berichten → bevestig dat de gekoppelde telefoon online is en dat de afzender is toegestaan (`channels.whatsapp.allowFrom`); zorg er bij groepschats voor dat allowlist + vermeldingsregels overeenkomen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Specifiek "health"-commando

`openclaw health` vraagt de draaiende Gateway om zijn gezondheidssnapshot (geen directe kanaal
sockets vanuit de CLI). Standaard kan het een verse gecachete Gateway-snapshot retourneren; de
Gateway ververst die cache vervolgens op de achtergrond. `openclaw health --verbose` forceert
in plaats daarvan een live probe. Het commando rapporteert gekoppelde referenties/authenticatieleeftijd wanneer beschikbaar,
samenvattingen van probes per kanaal, een sessiestore-samenvatting en een probeduur. Het sluit
niet-nul af als de Gateway onbereikbaar is of de probe faalt/time-out.

Opties:

- `--json`: machineleesbare JSON-uitvoer
- `--timeout <ms>`: overschrijf de standaard probetime-out van 10s
- `--verbose`: forceer een live probe en toon Gateway-verbindingsdetails
- `--debug`: alias voor `--verbose`

De gezondheidssnapshot bevat: `ok` (boolean), `ts` (timestamp), `durationMs` (probetijd), status per kanaal, beschikbaarheid van agent en sessiestore-samenvatting.

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
