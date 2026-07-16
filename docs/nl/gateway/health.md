---
read_when:
    - Problemen met kanaalconnectiviteit of de status van de Gateway vaststellen
    - Inzicht in CLI-opdrachten en -opties voor statuscontroles
summary: Healthcheckopdrachten en bewaking van de Gateway-status
title: Statuscontroles
x-i18n:
    generated_at: "2026-07-16T15:37:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

Korte handleiding om kanaalconnectiviteit te controleren zonder te gokken.

## Snelle controles

- `openclaw status` - lokaal overzicht: bereikbaarheid/modus van de Gateway, updatehint, ouderdom van gekoppelde kanaalauthenticatie, sessies + recente activiteit.
- `openclaw status --all` - volledige lokale diagnose (alleen-lezen, met kleur, veilig om te plakken voor foutopsporing).
- `openclaw status --deep` - vraagt de actieve Gateway om een live controle (`health` met `probe:true`), inclusief kanaalcontroles per account wanneer ondersteund.
- `openclaw status --usage` - toont momentopnamen van gebruik/quota van modelproviders.
- `openclaw health` - vraagt de actieve Gateway om de statusmomentopname (alleen WS; geen rechtstreekse kanaalsockets vanuit de CLI).
- `openclaw health --verbose` (alias `--debug`) - dwingt een live statuscontrole af en toont verbindingsdetails van de Gateway.
- `openclaw health --json` - machineleesbare uitvoer van de statusmomentopname.
- Verstuur `/status` als zelfstandige chatopdracht in een willekeurig kanaal om een statusantwoord te krijgen zonder de agent aan te roepen.
- Logboeken: volg `/tmp/openclaw/openclaw-*.log` en filter op `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Voor Discord en andere chatproviders geven sessierijen niet aan of de socket actief is.
`openclaw sessions`, Gateway `sessions.list` en de agenttool `sessions_list`
lezen opgeslagen gespreksstatus. Een provider kan opnieuw verbinding maken en een gezonde
kanaalstatus tonen voordat een nieuwe sessierij is aangemaakt. Gebruik de bovenstaande
opdrachten voor kanaalstatus en gezondheid voor live connectiviteitscontroles.

## Uitgebreide diagnostiek

- Referenties op schijf: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime moet recent zijn).
- Sessieopslag: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Het aantal en recente ontvangers worden weergegeven via `status`.
- Opnieuw koppelen: `openclaw channels logout && openclaw channels login --verbose` wanneer statuscodes 409-515 of `loggedOut` in de logboeken verschijnen. De QR-aanmeldingsprocedure wordt na het koppelen eenmaal automatisch opnieuw gestart bij status 515.
- Diagnostiek is standaard ingeschakeld (`diagnostics.enabled: false` schakelt deze uit). Geheugengebeurtenissen registreren RSS-/heap-aantallen in bytes en druk door drempelwaarden/groei; kritieke geheugendruk wordt vastgelegd via de Gateway-logger en schrijft, wanneer `diagnostics.memoryPressureSnapshot: true` is ingesteld, ook een stabiliteitsbundel van vóór een OOM (V8-heapstatistieken, Linux-cgroup-tellers indien beschikbaar, aantallen actieve resources en de grootste sessie-/transcriptiebestanden via een geredigeerd relatief pad). Waarschuwingen over beschikbaarheid registreren event-loopvertraging/-benutting, de verhouding tot het aantal CPU-kernen en aantallen actieve/wachtende/in de wachtrij geplaatste sessies wanneer het proces actief maar verzadigd is. Gebeurtenissen voor te grote payloads registreren wat is geweigerd/afgekapt/opgesplitst, plus groottes en limieten, maar nooit berichttekst, inhoud van bijlagen, Webhook-bodies, onbewerkte request-/response-bodies, tokens, cookies of geheime waarden.
- Dezelfde Heartbeat stuurt de begrensde stabiliteitsrecorder aan: `openclaw gateway stability` (of de `diagnostics.stability` Gateway-RPC). Fatale afsluitingen van de Gateway, time-outs bij afsluiten, opstartfouten na opnieuw starten en (wanneer `diagnostics.memoryPressureSnapshot: true`) kritieke geheugendruk slaan de nieuwste momentopname op onder `~/.openclaw/logs/stability/`. Bekijk de nieuwste bundel met `openclaw gateway stability --bundle latest`.
- Voer voor foutrapporten `openclaw gateway diagnostics export` uit en voeg het gegenereerde zipbestand toe: een Markdown-overzicht, de nieuwste stabiliteitsbundel, opgeschoonde logboekmetadata, opgeschoonde momentopnamen van Gateway-status/-gezondheid en de configuratiestructuur. Chattekst, Webhook-bodies, tooluitvoer, referenties, cookies, account-/bericht-ID's en geheime waarden worden weggelaten of geredigeerd. Zie [Diagnostische export](/nl/gateway/diagnostics).

## Configuratie van de gezondheidsmonitor

- `gateway.channelHealthCheckMinutes`: hoe vaak de Gateway de kanaalgezondheid controleert. Standaard: `5`. Stel `0` in om herstarts door de gezondheidsmonitor globaal uit te schakelen.
- `gateway.channelStaleEventThresholdMinutes`: hoelang een verbonden kanaal inactief kan blijven voordat de gezondheidsmonitor het als verouderd beschouwt en opnieuw start. Standaard: `30`. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: voortschrijdende limiet per uur voor herstarts door de gezondheidsmonitor per kanaal/account. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: schakelt herstarts door de gezondheidsmonitor uit voor een specifiek kanaal terwijl globale bewaking ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: overschrijving voor meerdere accounts die voorrang heeft op de instelling op kanaalniveau.
- Deze overschrijvingen per kanaal zijn van toepassing op de ingebouwde kanalen die ze momenteel beschikbaar stellen: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram en WhatsApp.

## Beschikbaarheidsbewaking

Externe services voor beschikbaarheidsbewaking moeten het speciale `/health`-eindpunt gebruiken, niet `/v1/chat/completions`.

- **WEL gebruiken:** `GET /health` - direct antwoord, geen sessie aangemaakt, geen LLM-aanroep, retourneert `{"ok":true,"status":"live"}`
- **NIET gebruiken:** `/v1/chat/completions` voor statuscontroles - elk verzoek maakt een volledige agentsessie aan met een momentopname van Skills, contextopbouw en LLM-aanroepen

Wanneer geen `x-openclaw-session-key`-header of `user`-veld is opgegeven, genereert `/v1/chat/completions` voor elk verzoek een nieuwe willekeurige sessie. Bewakingsservices die elke 15 minuten pingen, maken ongeveer 96 sessies/dag aan, die elk 4-22KB verbruiken. Na verloop van tijd zwelt hierdoor de sessieopslag op en kan het contextvenster overlopen.

### Configuratievoorbeelden voor bewakingsservices

- **BetterStack:** Stel de URL voor de statuscontrole in op `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Voeg een nieuwe HTTP-monitor toe met URL `https://<your-gateway-host>:<port>/health`
- **Algemeen:** Elke HTTP GET naar `/health` retourneert 200 met `{"ok":true}` wanneer de Gateway gezond is

## Wanneer iets mislukt

- `logged out` of status 409-515 -> koppel opnieuw met `openclaw channels logout` en vervolgens `openclaw channels login`.
- Gateway onbereikbaar -> start deze: `openclaw gateway --port 18789` (gebruik `--force` als de poort bezet is).
- Geen inkomende berichten -> controleer of de gekoppelde telefoon online is en de afzender is toegestaan (`channels.whatsapp.allowFrom`); zorg er bij groepschats voor dat de toelatingslijst + vermeldingsregels overeenkomen (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Speciale opdracht "health"

`openclaw health` vraagt de actieve Gateway om de statusmomentopname (geen rechtstreekse
kanaalsockets vanuit de CLI). Standaard retourneert deze een recente, gecachte Gateway-momentopname en
ververst de Gateway die cache op de achtergrond; `--verbose` dwingt in plaats daarvan een live controle af.
De opdracht rapporteert gekoppelde referenties/ouderdom van authenticatie wanneer beschikbaar, controleoverzichten per kanaal,
een overzicht van de sessieopslag en de duur van de controle. De opdracht wordt met een niet-nulstatus afgesloten als de Gateway
onbereikbaar is of de controle mislukt/een time-out bereikt.

Opties:

- `--json`: machineleesbare JSON-uitvoer
- `--timeout <ms>`: overschrijft de standaardtime-out van 10s voor controles
- `--verbose`: dwingt een live controle af en toont verbindingsdetails van de Gateway
- `--debug`: alias voor `--verbose`

De statusmomentopname bevat: `ok` (booleaans), `ts` (tijdstempel), `durationMs` (controletijd), status per kanaal, beschikbaarheid van de agent en een overzicht van de sessieopslag.

## Gerelateerd

- [Gateway-draaiboek](/nl/gateway)
- [Diagnostische export](/nl/gateway/diagnostics)
- [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting)
