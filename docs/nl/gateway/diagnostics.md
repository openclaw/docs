---
read_when:
    - Een bugrapport of ondersteuningsverzoek voorbereiden
    - Gateway-crashes, herstarts, geheugendruk of te grote payloads debuggen
    - Bekijken welke diagnostische gegevens worden vastgelegd of afgeschermd
summary: Maak deelbare Gateway-diagnosebundels voor bugrapporten
title: Diagnostiekexport
x-i18n:
    generated_at: "2026-05-10T19:35:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kan een lokale diagnostische zip maken voor bugrapporten. Deze combineert
geschoonde Gateway-status, health, logs, configuratievorm en recente
stabiliteitsgebeurtenissen zonder payloads.

Behandel diagnostische bundels als geheimen totdat u ze hebt beoordeeld. Ze zijn
ontworpen om payloads en inloggegevens weg te laten of te redigeren, maar ze
vatten nog steeds lokale Gateway-logs en runtime-status op hostniveau samen.

## Snel aan de slag

```bash
openclaw gateway diagnostics export
```

De opdracht print het geschreven zip-pad. Een pad kiezen:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Voor automatisering:

```bash
openclaw gateway diagnostics export --json
```

## Chatopdracht

Eigenaren kunnen `/diagnostics [note]` in chat gebruiken om een lokale Gateway-export aan te vragen.
Gebruik dit wanneer de bug in een echt gesprek optrad en u één
kopieer-en-plakbaar rapport voor support wilt:

1. Stuur `/diagnostics` in het gesprek waar u het probleem opmerkte. Voeg een
   korte notitie toe als dat helpt, bijvoorbeeld `/diagnostics bad tool choice`.
2. OpenClaw stuurt de diagnostische inleiding en vraagt om één expliciete exec-
   goedkeuring. De goedkeuring voert `openclaw gateway diagnostics export --json` uit.
   Keur diagnostiek niet goed via een allow-all-regel.
3. Na goedkeuring antwoordt OpenClaw met een plakbaar rapport met het lokale
   bundelpad, manifestsamenvatting, privacynotities en relevante sessie-id's.

In groepschats kan een eigenaar nog steeds `/diagnostics` uitvoeren, maar OpenClaw
plaatst de diagnostische details niet terug in de gedeelde chat. Het stuurt de
inleiding, goedkeuringsprompts, het Gateway-exportresultaat en de uitsplitsing
van Codex-sessie/thread naar de eigenaar via de privé-goedkeuringsroute. De groep
krijgt alleen een korte melding dat de diagnostische flow privé is verzonden. Als
OpenClaw geen privéroute naar de eigenaar kan vinden, faalt de opdracht gesloten
en vraagt deze de eigenaar om de opdracht vanuit een DM uit te voeren.

Wanneer de actieve OpenClaw-sessie de native OpenAI Codex-harness gebruikt,
dekt dezelfde exec-goedkeuring ook een OpenAI-feedbackupload voor de Codex-
runtime-threads die OpenClaw kent. Die upload staat los van de lokale Gateway-zip
en verschijnt alleen voor Codex-harness-sessies. Vóór goedkeuring legt de prompt
uit dat het goedkeuren van diagnostiek ook Codex-feedback verstuurt, maar deze
vermeldt geen Codex-sessie- of thread-id's. Na goedkeuring vermeldt het chatantwoord
de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale resume-opdrachten
voor de threads die naar OpenAI-servers zijn verzonden. Als u de goedkeuring
weigert of negeert, voert OpenClaw de export niet uit, verstuurt het geen
Codex-feedback en print het de Codex-id's niet.

Dat maakt de gebruikelijke Codex-debugloop kort: merk het verkeerde gedrag op in
Telegram, Discord of een ander kanaal, voer `/diagnostics` uit, keur één keer goed,
deel het rapport met support en voer vervolgens lokaal de geprinte opdracht
`codex resume <thread-id>` uit als u de native Codex-thread zelf wilt inspecteren. Zie
[Codex-harness](/nl/plugins/codex-harness#inspect-codex-threads-locally) voor
die inspectieworkflow.

## Wat de export bevat

De zip bevat:

- `summary.md`: menselijk leesbaar overzicht voor support.
- `diagnostics.json`: machineleesbare samenvatting van configuratie, logs, status, health
  en stabiliteitsgegevens.
- `manifest.json`: exportmetadata en bestandenlijst.
- Geschoonde configuratievorm en niet-geheime configuratiedetails.
- Geschoonde logsamenvattingen en recente geredigeerde logregels.
- Best-effort Gateway-status- en health-snapshots.
- `stability/latest.json`: nieuwste bewaarde stabiliteitsbundel, indien beschikbaar.

De export is nuttig, zelfs wanneer de Gateway ongezond is. Als de Gateway niet kan
antwoorden op status- of health-aanvragen, worden de lokale logs, configuratievorm
en nieuwste stabiliteitsbundel nog steeds verzameld wanneer ze beschikbaar zijn.

## Privacymodel

Diagnostiek is ontworpen om deelbaar te zijn. De export behoudt operationele gegevens
die helpen bij debugging, zoals:

- subsysteemnamen, Plugin-id's, provider-id's, kanaal-id's en geconfigureerde modi
- statuscodes, duur, byteaantallen, wachtrijstatus en geheugenuitlezingen
- geschoonde logmetadata en geredigeerde operationele berichten
- configuratievorm en niet-geheime functie-instellingen

De export laat weg of redigeert:

- chattekst, prompts, instructies, Webhook-bodies en tooluitvoer
- inloggegevens, API-sleutels, tokens, cookies en geheime waarden
- ruwe request- of response-bodies
- account-id's, bericht-id's, ruwe sessie-id's, hostnamen en lokale gebruikersnamen

Wanneer een logbericht lijkt op gebruikers-, chat-, prompt- of toolpayloadtekst,
behoudt de export alleen dat een bericht is weggelaten en het byteaantal.

## Stabiliteitsrecorder

De Gateway registreert standaard een begrensde stabiliteitsstream zonder payloads wanneer
diagnostiek is ingeschakeld. Deze is bedoeld voor operationele feiten, niet voor inhoud.

Dezelfde diagnostische Heartbeat registreert liveness-samples wanneer de Gateway blijft
draaien maar de Node.js-eventloop of CPU verzadigd lijkt. Deze
`diagnostic.liveness.warning`-gebeurtenissen bevatten eventloopvertraging, eventloop-
gebruik, CPU-coreverhouding, aantallen actieve/wachtende/gequeueerde sessies, de huidige
opstart-/runtimefase wanneer bekend, recente faseperiodes en begrensde labels voor actief/
gequeued werk. Inactieve samples blijven in telemetrie op `info`-niveau. Liveness-samples
worden alleen Gateway-waarschuwingen wanneer werk wacht of gequeued is, of wanneer actief werk
samenvalt met aanhoudende eventloopvertraging. Tijdelijke max-delay-pieken tijdens
verder gezond achtergrondwerk blijven in debuglogs. Ze herstarten de Gateway niet uit zichzelf.

Opstartfasen zenden ook `diagnostic.phase.completed`-gebeurtenissen uit met wall-clock- en
CPU-timing. Vastgelopen embedded-run-diagnostiek markeert `terminalProgressStale=true`
wanneer de laatste bridge-voortgang er terminaal uitzag, zoals een ruw response-item of
response-completion-gebeurtenis, maar de Gateway de embedded run nog steeds als
actief beschouwt.

Inspecteer de live recorder:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecteer de nieuwste bewaarde stabiliteitsbundel na een fatale exit, shutdown-
timeout of opstartfout bij herstarten:

```bash
openclaw gateway stability --bundle latest
```

Maak een diagnostische zip van de nieuwste bewaarde bundel:

```bash
openclaw gateway stability --bundle latest --export
```

Bewaarde bundels staan onder `~/.openclaw/logs/stability/` wanneer er gebeurtenissen bestaan.

## Nuttige opties

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: schrijf naar een specifiek zip-pad.
- `--log-lines <count>`: maximaal aantal geschoonde logregels om op te nemen.
- `--log-bytes <bytes>`: maximaal aantal logbytes om te inspecteren.
- `--url <url>`: Gateway-WebSocket-URL voor status- en health-snapshots.
- `--token <token>`: Gateway-token voor status- en health-snapshots.
- `--password <password>`: Gateway-wachtwoord voor status- en health-snapshots.
- `--timeout <ms>`: timeout voor status- en health-snapshot.
- `--no-stability-bundle`: sla het zoeken naar bewaarde stabiliteitsbundels over.
- `--json`: print machineleesbare exportmetadata.

## Diagnostiek uitschakelen

Diagnostiek is standaard ingeschakeld. Om de stabiliteitsrecorder en
diagnostische gebeurtenisverzameling uit te schakelen:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Het uitschakelen van diagnostiek vermindert de details in bugrapporten. Het heeft geen invloed op normale
Gateway-logging.

## Gerelateerd

- [Healthchecks](/nl/gateway/health)
- [Gateway CLI](/nl/cli/gateway#gateway-diagnostics-export)
- [Gateway-protocol](/nl/gateway/protocol#system-and-identity)
- [Logging](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — aparte flow voor streamingdiagnostiek naar een collector
