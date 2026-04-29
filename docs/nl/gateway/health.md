---
read_when:
    - Kanaalconnectiviteit of Gateway-status diagnosticeren
    - CLI-opdrachten en opties voor gezondheidscontroles begrijpen
summary: Statuscontroleopdrachten en gezondheidsbewaking van de Gateway
title: Statuscontroles
x-i18n:
    generated_at: "2026-04-29T22:45:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Korte handleiding om kanaalconnectiviteit te verifiëren zonder te gokken.

## Snelle controles

- `openclaw status` — lokale samenvatting: bereikbaarheid/modus van de Gateway, updatehint, leeftijd van gekoppelde kanaal-authenticatie, sessies + recente activiteit.
- `openclaw status --all` — volledige lokale diagnose (alleen-lezen, kleur, veilig om te plakken voor debugging).
- `openclaw status --deep` — vraagt de draaiende Gateway om een live gezondheidsprobe (`health` met `probe:true`), inclusief kanaalprobes per account wanneer ondersteund.
- `openclaw health` — vraagt de draaiende Gateway om zijn gezondheidssnapshot (alleen WS; geen directe kanaalsockets vanuit de CLI).
- `openclaw health --verbose` — forceert een live gezondheidsprobe en drukt Gateway-verbindingsdetails af.
- `openclaw health --json` — machineleesbare uitvoer van de gezondheidssnapshot.
- Stuur `/status` als zelfstandig bericht in WhatsApp/WebChat om een statusantwoord te krijgen zonder de agent aan te roepen.
- Logs: tail `/tmp/openclaw/openclaw-*.log` en filter op `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diepe diagnostiek

- Referenties op schijf: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime moet recent zijn).
- Sessiestore: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (pad kan in de configuratie worden overschreven). Aantal en recente ontvangers worden via `status` weergegeven.
- Flow voor opnieuw koppelen: `openclaw channels logout && openclaw channels login --verbose` wanneer statuscodes 409–515 of `loggedOut` in logs verschijnen. (Opmerking: de QR-loginflow start automatisch één keer opnieuw voor status 515 na koppeling.)
- Diagnostiek is standaard ingeschakeld. De Gateway registreert operationele feiten tenzij `diagnostics.enabled: false` is ingesteld. Geheugengebeurtenissen registreren RSS-/heap-byte-aantallen, drempeldruk en groeidruk. Liveness-waarschuwingen registreren event-loopvertraging, event-loopbenutting, CPU-coreverhouding en aantallen actieve/wachtende/in wachtrij geplaatste sessies wanneer het proces draait maar verzadigd is. Gebeurtenissen voor te grote payloads registreren wat is geweigerd, afgekapt of in chunks verdeeld, plus groottes en limieten wanneer beschikbaar. Ze registreren niet de berichttekst, bijlage-inhoud, webhook-body, ruwe request- of response-body, tokens, cookies of geheime waarden. Dezelfde Heartbeat start de begrensde stabiliteitsrecorder, die beschikbaar is via `openclaw gateway stability` of de `diagnostics.stability` Gateway RPC. Fatale Gateway-afsluitingen, shutdown-time-outs en herstart-opstartfouten bewaren de nieuwste recorder-snapshot onder `~/.openclaw/logs/stability/` wanneer er gebeurtenissen bestaan; inspecteer de nieuwste opgeslagen bundel met `openclaw gateway stability --bundle latest`.
- Voor bugrapporten voert u `openclaw gateway diagnostics export` uit en voegt u de gegenereerde zip toe. De export combineert een Markdown-samenvatting, de nieuwste stabiliteitsbundel, opgeschoonde logmetadata, opgeschoonde Gateway-status-/gezondheidssnapshots en configuratievorm. Deze is bedoeld om te delen: chattekst, webhook-bodies, tooluitvoer, referenties, cookies, account-/bericht-ID's en geheime waarden worden weggelaten of geredigeerd. Zie [Diagnostiekexport](/nl/gateway/diagnostics).

## Configuratie van gezondheidsmonitor

- `gateway.channelHealthCheckMinutes`: hoe vaak de Gateway de kanaalgezondheid controleert. Standaard: `5`. Stel `0` in om herstarts door de gezondheidsmonitor globaal uit te schakelen.
- `gateway.channelStaleEventThresholdMinutes`: hoe lang een verbonden kanaal inactief mag blijven voordat de gezondheidsmonitor het als verouderd behandelt en herstart. Standaard: `30`. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: voortschrijdende limiet van één uur voor herstarts door de gezondheidsmonitor per kanaal/account. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: schakel herstarts door de gezondheidsmonitor uit voor een specifiek kanaal terwijl globale monitoring ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: multi-account-override die voorrang heeft op de instelling op kanaalniveau.
- Deze overrides per kanaal gelden voor de ingebouwde kanaalmonitors die ze vandaag beschikbaar maken: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram en WhatsApp.

## Wanneer iets mislukt

- `logged out` of status 409–515 → koppel opnieuw met `openclaw channels logout` en daarna `openclaw channels login`.
- Gateway onbereikbaar → start deze: `openclaw gateway --port 18789` (gebruik `--force` als de poort bezet is).
- Geen inkomende berichten → bevestig dat de gekoppelde telefoon online is en dat de afzender is toegestaan (`channels.whatsapp.allowFrom`); zorg er voor groepschats voor dat allowlist + vermeldingsregels overeenkomen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Specifieke "health"-opdracht

`openclaw health` vraagt de draaiende Gateway om zijn gezondheidssnapshot (geen directe kanaal
sockets vanuit de CLI). Standaard kan deze een verse gecachete Gateway-snapshot teruggeven; de
Gateway vernieuwt die cache vervolgens op de achtergrond. `openclaw health --verbose` forceert
in plaats daarvan een live probe. De opdracht rapporteert gekoppelde referenties/auth-leeftijd wanneer beschikbaar,
samenvattingen van probes per kanaal, sessiestore-samenvatting en een probeduur. Deze sluit af
met niet-nul als de Gateway onbereikbaar is of de probe mislukt/time-out.

Opties:

- `--json`: machineleesbare JSON-uitvoer
- `--timeout <ms>`: overschrijf de standaard probe-time-out van 10s
- `--verbose`: forceer een live probe en druk Gateway-verbindingsdetails af
- `--debug`: alias voor `--verbose`

De gezondheidssnapshot bevat: `ok` (boolean), `ts` (tijdstempel), `durationMs` (probetijd), status per kanaal, agentbeschikbaarheid en sessiestore-samenvatting.

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
