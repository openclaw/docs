---
read_when:
    - Kanaalconnectiviteit of Gateway-status diagnosticeren
    - Inzicht in CLI-opdrachten en opties voor statuscontroles
summary: Opdrachten voor gezondheidscontrole en gezondheidsbewaking van de Gateway
title: Statuscontroles
x-i18n:
    generated_at: "2026-05-02T11:16:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Korte gids om kanaalconnectiviteit te verifiëren zonder te gokken.

## Snelle controles

- `openclaw status` — lokale samenvatting: bereikbaarheid/modus van de Gateway, updatehint, leeftijd van gekoppelde kanaalautorisatie, sessies + recente activiteit.
- `openclaw status --all` — volledige lokale diagnose (alleen-lezen, kleur, veilig om te plakken voor debugging).
- `openclaw status --deep` — vraagt de draaiende Gateway om een live gezondheidsprobe (`health` met `probe:true`), inclusief kanaalprobes per account wanneer ondersteund.
- `openclaw health` — vraagt de draaiende Gateway om zijn gezondheidssnapshot (alleen WS; geen directe kanaalsockets vanuit de CLI).
- `openclaw health --verbose` — forceert een live gezondheidsprobe en toont verbindingsdetails van de Gateway.
- `openclaw health --json` — machineleesbare uitvoer van de gezondheidssnapshot.
- Stuur `/status` als zelfstandig bericht in WhatsApp/WebChat om een statusantwoord te krijgen zonder de agent aan te roepen.
- Logs: tail `/tmp/openclaw/openclaw-*.log` en filter op `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Voor Discord en andere chatproviders zijn sessierijen geen socket-liveness.
`openclaw sessions`, Gateway `sessions.list` en de agenttool `sessions_list`
lezen opgeslagen gespreksstatus. Een provider kan opnieuw verbinden en een gezonde kanaalstatus
tonen voordat er een nieuwe sessierij is gematerialiseerd. Gebruik de kanaalstatus- en
gezondheidscommando's hierboven voor live connectiviteitscontroles.

## Diepe diagnostiek

- Inloggegevens op schijf: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime moet recent zijn).
- Sessieopslag: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (pad kan in de configuratie worden overschreven). Aantal en recente ontvangers worden via `status` getoond.
- Opnieuw koppelen: `openclaw channels logout && openclaw channels login --verbose` wanneer statuscodes 409-515 of `loggedOut` in logs verschijnen. (Opmerking: de QR-loginflow herstart automatisch eenmaal voor status 515 na koppelen.)
- Diagnostiek is standaard ingeschakeld. De Gateway registreert operationele feiten tenzij `diagnostics.enabled: false` is ingesteld. Geheugenevents registreren RSS-/heap-byteaantallen, drempeldruk en groeidruk. Liveness-waarschuwingen registreren event-loopvertraging, event-loopgebruik, CPU-coreverhouding en aantallen actieve/wachtende/in de wachtrij geplaatste sessies wanneer het proces draait maar verzadigd is. Events voor te grote payloads registreren wat is geweigerd, afgekapt of in chunks is verdeeld, plus groottes en limieten wanneer beschikbaar. Ze registreren niet de berichttekst, inhoud van bijlagen, webhookbody, ruwe request- of responsebody, tokens, cookies of geheime waarden. Dezelfde Heartbeat start de begrensde stabiliteitsrecorder, die beschikbaar is via `openclaw gateway stability` of de `diagnostics.stability` Gateway RPC. Fatale Gateway-afsluitingen, shutdown-time-outs en opstartfouten bij herstart bewaren de nieuwste recordersnapshot onder `~/.openclaw/logs/stability/` wanneer events bestaan; inspecteer de nieuwste opgeslagen bundel met `openclaw gateway stability --bundle latest`.
- Voer voor bugrapporten `openclaw gateway diagnostics export` uit en voeg de gegenereerde zip toe. De export combineert een Markdown-samenvatting, de nieuwste stabiliteitsbundel, opgeschoonde logmetadata, opgeschoonde Gateway-status-/gezondheidssnapshots en configuratievorm. Hij is bedoeld om te delen: chattekst, webhookbody's, tooluitvoer, inloggegevens, cookies, account-/bericht-ID's en geheime waarden worden weggelaten of geredigeerd. Zie [Diagnostiekexport](/nl/gateway/diagnostics).

## Configuratie van gezondheidsmonitor

- `gateway.channelHealthCheckMinutes`: hoe vaak de Gateway kanaalgezondheid controleert. Standaard: `5`. Stel `0` in om herstarts door de gezondheidsmonitor globaal uit te schakelen.
- `gateway.channelStaleEventThresholdMinutes`: hoe lang een verbonden kanaal inactief mag blijven voordat de gezondheidsmonitor het als verouderd beschouwt en herstart. Standaard: `30`. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: voortschrijdende limiet van één uur voor herstarts door de gezondheidsmonitor per kanaal/account. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: schakel herstarts door de gezondheidsmonitor uit voor een specifiek kanaal terwijl globale monitoring ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: multi-account-override die voorrang heeft op de instelling op kanaalniveau.
- Deze overrides per kanaal gelden voor de ingebouwde kanaalmonitors die ze vandaag aanbieden: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram en WhatsApp.

## Wanneer iets faalt

- `logged out` of status 409-515 → koppel opnieuw met `openclaw channels logout` en daarna `openclaw channels login`.
- Gateway onbereikbaar → start hem: `openclaw gateway --port 18789` (gebruik `--force` als de poort bezet is).
- Geen inkomende berichten → bevestig dat de gekoppelde telefoon online is en dat de afzender is toegestaan (`channels.whatsapp.allowFrom`); zorg er voor groepschats voor dat allowlist + vermeldingsregels overeenkomen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Speciaal commando "health"

`openclaw health` vraagt de draaiende Gateway om zijn gezondheidssnapshot (geen directe kanaal
sockets vanuit de CLI). Standaard kan het een verse gecachete Gateway-snapshot retourneren; de
Gateway vernieuwt die cache vervolgens op de achtergrond. `openclaw health --verbose` forceert
in plaats daarvan een live probe. Het commando rapporteert gekoppelde inloggegevens/autorisatieleeftijd wanneer beschikbaar,
probesamenvattingen per kanaal, samenvatting van de sessieopslag en een probeduur. Het sluit af
met non-zero als de Gateway onbereikbaar is of de probe faalt/time-out krijgt.

Opties:

- `--json`: machineleesbare JSON-uitvoer
- `--timeout <ms>`: overschrijf de standaard probe-time-out van 10 s
- `--verbose`: forceer een live probe en toon verbindingsdetails van de Gateway
- `--debug`: alias voor `--verbose`

De gezondheidssnapshot bevat: `ok` (boolean), `ts` (timestamp), `durationMs` (probetijd), status per kanaal, beschikbaarheid van agent en samenvatting van sessieopslag.

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
