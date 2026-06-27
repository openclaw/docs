---
read_when:
    - Een bugrapport of ondersteuningsverzoek voorbereiden
    - Gateway-crashes, herstarts, geheugendruk of te grote payloads debuggen
    - Controleren welke diagnostische gegevens worden vastgelegd of geredigeerd
summary: Deelbare Gateway-diagnosebundels voor bugrapporten maken
title: Diagnostische export
x-i18n:
    generated_at: "2026-06-27T17:32:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kan een lokale diagnostische zip voor bugrapporten maken. Deze combineert
gesaniteerde Gateway-status, gezondheid, logs, configuratievorm en recente
stabiliteitsgebeurtenissen zonder payload.

Behandel diagnostische bundels als geheimen totdat je ze hebt beoordeeld. Ze zijn
ontworpen om payloads en referenties weg te laten of te redigeren, maar ze vatten nog steeds
lokale Gateway-logs en runtime-status op hostniveau samen.

## Snelstart

```bash
openclaw gateway diagnostics export
```

De opdracht drukt het weggeschreven zip-pad af. Een pad kiezen:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Voor automatisering:

```bash
openclaw gateway diagnostics export --json
```

## Chatopdracht

Eigenaren kunnen `/diagnostics [note]` in chat gebruiken om een lokale Gateway-export aan te vragen.
Gebruik dit wanneer de bug in een echt gesprek optrad en je één
kopieerbaar rapport voor ondersteuning wilt:

1. Stuur `/diagnostics` in het gesprek waarin je het probleem opmerkte. Voeg een
   korte notitie toe als dat helpt, bijvoorbeeld `/diagnostics bad tool choice`.
2. OpenClaw stuurt de diagnostische inleiding en vraagt om één expliciete
   `exec`-goedkeuring. De goedkeuring voert `openclaw gateway diagnostics export --json` uit.
   Keur diagnostiek niet goed via een allow-all-regel.
3. Na goedkeuring antwoordt OpenClaw met een plakbaar rapport met het lokale
   bundelpad, manifestsamenvatting, privacy-opmerkingen en relevante sessie-id's.

In groepschats kan een eigenaar nog steeds `/diagnostics` uitvoeren, maar OpenClaw plaatst
de diagnostische details niet terug in de gedeelde chat. Het stuurt de inleiding,
goedkeuringsprompts, het Gateway-exportresultaat en de uitsplitsing van Codex-sessies/threads
naar de eigenaar via de privégoedkeuringsroute. De groep krijgt alleen een korte melding
dat de diagnostische flow privé is verzonden. Als OpenClaw geen privérout naar de eigenaar
kan vinden, faalt de opdracht gesloten en vraagt deze de eigenaar om de opdracht vanuit een DM uit te voeren.

Wanneer de actieve OpenClaw-sessie de native OpenAI Codex-harness gebruikt,
dekt dezelfde `exec`-goedkeuring ook een OpenAI-feedbackupload voor de Codex
runtime-threads die OpenClaw kent. Die upload staat los van de lokale
Gateway-zip en verschijnt alleen voor Codex-harness-sessies. Vóór goedkeuring legt de
prompt uit dat het goedkeuren van diagnostiek ook Codex-feedback verzendt, maar deze
vermeldt geen Codex-sessie- of thread-id's. Na goedkeuring vermeldt het chatantwoord
de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale hervattingsopdrachten
voor de threads die naar OpenAI-servers zijn verzonden. Als je de goedkeuring weigert of negeert,
voert OpenClaw de export niet uit, verzendt het geen Codex-feedback en
drukt het de Codex-id's niet af.

Dat maakt de gangbare Codex-debugloop kort: merk het verkeerde gedrag op in
Telegram, Discord of een ander kanaal, voer `/diagnostics` uit, keur één keer goed, deel
het rapport met ondersteuning en voer daarna de afgedrukte opdracht `codex resume <thread-id>`
lokaal uit als je de native Codex-thread zelf wilt inspecteren. Zie
[Codex-harness](/nl/plugins/codex-harness#inspect-codex-threads-locally) voor
die inspectieworkflow.

## Wat de export bevat

De zip bevat:

- `summary.md`: menselijk leesbaar overzicht voor ondersteuning.
- `diagnostics.json`: machineleesbare samenvatting van configuratie, logs, status, gezondheid
  en stabiliteitsgegevens.
- `manifest.json`: exportmetadata en bestandslijst.
- Gesaniteerde configuratievorm en niet-geheime configuratiedetails.
- Gesaniteerde logsamenvattingen en recente geredigeerde logregels.
- Best-effort Gateway-status- en gezondheidssnapshots.
- `stability/latest.json`: nieuwste bewaarde stabiliteitsbundel, indien beschikbaar.

De export is nuttig, zelfs wanneer de Gateway ongezond is. Als de Gateway niet kan
antwoorden op status- of gezondheidsverzoeken, worden de lokale logs, configuratievorm en nieuwste
stabiliteitsbundel nog steeds verzameld wanneer beschikbaar.

## Privacymodel

Diagnostiek is ontworpen om deelbaar te zijn. De export bewaart operationele gegevens
die helpen bij debugging, zoals:

- subsystemnamen, Plugin-id's, provider-id's, kanaal-id's en geconfigureerde modi
- statuscodes, duur, byteaantallen, wachtrijstatus en geheugenuitlezingen
- gesaniteerde logmetadata en geredigeerde operationele berichten
- configuratievorm en niet-geheime functie-instellingen

De export laat weg of redigeert:

- chattekst, prompts, instructies, Webhook-bodies en tooluitvoer
- referenties, API-sleutels, tokens, cookies en geheime waarden
- ruwe request- of response-bodies
- account-id's, bericht-id's, ruwe sessie-id's, hostnamen en lokale gebruikersnamen

Wanneer een logbericht lijkt op tekst van een gebruiker, chat, prompt of toolpayload,
bewaart de export alleen dat een bericht is weggelaten en het byteaantal.

## Stabiliteitsrecorder

De Gateway registreert standaard een begrensde stabiliteitsstream zonder payload wanneer
diagnostiek is ingeschakeld. Deze is bedoeld voor operationele feiten, niet voor inhoud.

Dezelfde diagnostische Heartbeat registreert liveness-samples wanneer de Gateway blijft
draaien maar de Node.js-eventloop of CPU verzadigd lijkt. Deze
`diagnostic.liveness.warning`-gebeurtenissen bevatten eventloopvertraging, eventloopgebruik,
CPU-coreverhouding, aantallen actieve/wachtende/gekoppelde sessies, de huidige
opstart-/runtimefase wanneer bekend, recente fasespannes en begrensde labels voor actief/gekoppeld
werk. Idle-samples blijven in telemetrie op `info`-niveau. Liveness-samples
worden alleen Gateway-waarschuwingen wanneer werk wacht of in de wachtrij staat, of wanneer actief werk
overlapt met aanhoudende eventloopvertraging. Tijdelijke pieken in maximale vertraging tijdens
verder gezond achtergrondwerk blijven in debuglogs. Ze herstarten de
Gateway niet op zichzelf.

Opstartfasen geven ook `diagnostic.phase.completed`-gebeurtenissen uit met wandklok- en
CPU-timing. Vastgelopen diagnostiek voor embedded runs markeert `terminalProgressStale=true`
wanneer de laatste bridgevoortgang terminaal leek, zoals een ruw response-item of
response-voltooiingsgebeurtenis, maar de Gateway de embedded run nog steeds
als actief beschouwt.

Inspecteer de live recorder:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecteer de nieuwste bewaarde stabiliteitsbundel na een fatale exit, afsluit-
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
- `--log-lines <count>`: maximaal aantal gesaniteerde logregels om op te nemen.
- `--log-bytes <bytes>`: maximaal aantal logbytes om te inspecteren.
- `--url <url>`: Gateway-WebSocket-URL voor status- en gezondheidssnapshots.
- `--token <token>`: Gateway-token voor status- en gezondheidssnapshots.
- `--password <password>`: Gateway-wachtwoord voor status- en gezondheidssnapshots.
- `--timeout <ms>`: timeout voor status- en gezondheidssnapshots.
- `--no-stability-bundle`: sla het opzoeken van bewaarde stabiliteitsbundels over.
- `--json`: druk machineleesbare exportmetadata af.

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

Het uitschakelen van diagnostiek vermindert details in bugrapporten. Het heeft geen invloed op normale
Gateway-logging.

Snapshots bij kritieke geheugendruk zijn standaard uitgeschakeld. Om diagnostische
gebeurtenissen te behouden en ook de stabiliteitssnapshot vóór OOM vast te leggen:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Gebruik dit alleen op hosts die de extra bestandssysteemscan en snapshotwrite
tijdens kritieke geheugendruk kunnen verdragen. Normale geheugendrukgebeurtenissen
registreren nog steeds RSS, heap, drempel en groeifeiten wanneer de snapshot uit staat.

## Gerelateerd

- [Gezondheidscontroles](/nl/gateway/health)
- [Gateway-CLI](/nl/cli/gateway#gateway-diagnostics-export)
- [Gateway-protocol](/nl/gateway/protocol#system-and-identity)
- [Logging](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — afzonderlijke flow voor het streamen van diagnostiek naar een collector
