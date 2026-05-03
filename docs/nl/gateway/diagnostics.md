---
read_when:
    - Een bugrapport of ondersteuningsverzoek voorbereiden
    - Gateway-crashes, herstarts, geheugendruk of te grote gegevensladingen debuggen
    - Controleren welke diagnostische gegevens worden vastgelegd of afgeschermd
summary: Maak deelbare Gateway-diagnosebundels voor bugrapporten
title: Diagnostiekexport
x-i18n:
    generated_at: "2026-05-03T21:32:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kan een lokale diagnostiek-zip voor bugrapporten maken. Deze combineert
gesaniteerde Gateway-status, gezondheid, logs, configuratievorm en recente payloadvrije
stabiliteitsgebeurtenissen.

Behandel diagnostiekbundels als geheimen totdat je ze hebt gecontroleerd. Ze zijn
ontworpen om payloads en inloggegevens weg te laten of te redigeren, maar ze vatten nog steeds
lokale Gateway-logs en runtime-status op hostniveau samen.

## Snelle start

```bash
openclaw gateway diagnostics export
```

De opdracht print het geschreven zip-pad. Om een pad te kiezen:

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
kopieerbaar rapport voor support wilt:

1. Stuur `/diagnostics` in het gesprek waar je het probleem opmerkte. Voeg een
   korte notitie toe als dat helpt, bijvoorbeeld `/diagnostics bad tool choice`.
2. OpenClaw stuurt de diagnostiek-inleiding en vraagt om één expliciete exec-
   goedkeuring. De goedkeuring voert `openclaw gateway diagnostics export --json` uit.
   Keur diagnostiek niet goed via een regel die alles toestaat.
3. Na goedkeuring antwoordt OpenClaw met een plakbaar rapport met het lokale
   bundelpad, de manifest-samenvatting, privacynotities en relevante sessie-id's.

In groepschats kan een eigenaar nog steeds `/diagnostics` uitvoeren, maar OpenClaw plaatst
de diagnostische details niet terug in de gedeelde chat. Het stuurt de inleiding,
goedkeuringsprompts, het Gateway-exportresultaat en de Codex-sessie-/thread-uitsplitsing naar
de eigenaar via de privégoedkeuringsroute. De groep krijgt alleen een korte melding
dat de diagnostiekflow privé is verzonden. Als OpenClaw geen privéroute naar de
eigenaar kan vinden, faalt de opdracht gesloten en vraagt deze de eigenaar om de opdracht vanuit een DM uit te voeren.

Wanneer de actieve OpenClaw-sessie de native OpenAI Codex-harness gebruikt,
dekt dezelfde exec-goedkeuring ook een OpenAI-feedbackupload voor de Codex-
runtimethreads waar OpenClaw van weet. Die upload staat los van de lokale
Gateway-zip en verschijnt alleen voor Codex-harnesssessies. Vóór goedkeuring legt de
prompt uit dat het goedkeuren van diagnostiek ook Codex-feedback verzendt, maar deze
vermeldt geen Codex-sessie- of thread-id's. Na goedkeuring toont het chatantwoord
de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale hervattingsopdrachten
voor de threads die naar OpenAI-servers zijn verzonden. Als je de goedkeuring weigert of negeert,
voert OpenClaw de export niet uit, verzendt het geen Codex-feedback en
print het de Codex-id's niet.

Dat maakt de gebruikelijke Codex-debugloop kort: merk het slechte gedrag op in
Telegram, Discord of een ander kanaal, voer `/diagnostics` uit, keur één keer goed, deel
het rapport met support en voer daarna de geprinte opdracht `codex resume <thread-id>`
lokaal uit als je de native Codex-thread zelf wilt inspecteren. Zie
[Codex-harness](/nl/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) voor
die inspectieworkflow.

## Wat de export bevat

De zip bevat:

- `summary.md`: menselijk leesbaar overzicht voor support.
- `diagnostics.json`: machineleesbare samenvatting van configuratie, logs, status, gezondheid
  en stabiliteitsgegevens.
- `manifest.json`: exportmetadata en bestandslijst.
- Gesaniteerde configuratievorm en niet-geheime configuratiedetails.
- Gesaniteerde logsamenvattingen en recente geredigeerde logregels.
- Best-effort Gateway-status- en gezondheidssnapshots.
- `stability/latest.json`: nieuwste opgeslagen stabiliteitsbundel, indien beschikbaar.

De export is nuttig, zelfs wanneer de Gateway ongezond is. Als de Gateway niet kan
antwoorden op status- of gezondheidsverzoeken, worden de lokale logs, configuratievorm en nieuwste
stabiliteitsbundel nog steeds verzameld wanneer ze beschikbaar zijn.

## Privacymodel

Diagnostiek is ontworpen om deelbaar te zijn. De export bewaart operationele gegevens
die helpen bij debugging, zoals:

- subsysteemnamen, Plugin-id's, provider-id's, kanaal-id's en geconfigureerde modi
- statuscodes, duur, byteaantallen, wachtrijstatus en geheugenuitlezingen
- gesaniteerde logmetadata en geredigeerde operationele berichten
- configuratievorm en niet-geheime functie-instellingen

De export laat weg of redigeert:

- chattekst, prompts, instructies, Webhook-bodies en tooluitvoer
- inloggegevens, API-sleutels, tokens, cookies en geheime waarden
- ruwe aanvraag- of antwoordbodies
- account-id's, bericht-id's, ruwe sessie-id's, hostnamen en lokale gebruikersnamen

Wanneer een logbericht lijkt op gebruikers-, chat-, prompt- of toolpayloadtekst, bewaart de
export alleen dat een bericht is weggelaten en het byteaantal.

## Stabiliteitsrecorder

De Gateway registreert standaard een begrensde, payloadvrije stabiliteitsstream wanneer
diagnostiek is ingeschakeld. Deze is bedoeld voor operationele feiten, niet voor inhoud.

Dezelfde diagnostische Heartbeat registreert liveness-samples wanneer de Gateway blijft
draaien maar de Node.js-eventloop of CPU verzadigd lijkt. Deze
`diagnostic.liveness.warning`-gebeurtenissen bevatten eventloopvertraging, eventloop-
utilisatie, CPU-coreverhouding en aantallen actieve/wachtende/in wachtrij staande sessies. Inactieve
samples blijven in telemetrie op `info`-niveau. Liveness-samples worden pas Gateway-
waarschuwingen wanneer werk wacht of in de wachtrij staat, of wanneer actief werk overlapt met
aanhoudende eventloopvertraging. Tijdelijke pieken in maximale vertraging tijdens verder gezond
achtergrondwerk blijven in debuglogs. Ze herstarten de Gateway niet uit zichzelf.

Inspecteer de live recorder:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecteer de nieuwste opgeslagen stabiliteitsbundel na een fatale exit, shutdown-
time-out of opstartfout bij herstarten:

```bash
openclaw gateway stability --bundle latest
```

Maak een diagnostiek-zip van de nieuwste opgeslagen bundel:

```bash
openclaw gateway stability --bundle latest --export
```

Opgeslagen bundels staan onder `~/.openclaw/logs/stability/` wanneer er gebeurtenissen bestaan.

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
- `--timeout <ms>`: time-out voor status- en gezondheidssnapshots.
- `--no-stability-bundle`: sla het opzoeken van opgeslagen stabiliteitsbundels over.
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

- [Gezondheidscontroles](/nl/gateway/health)
- [Gateway-CLI](/nl/cli/gateway#gateway-diagnostics-export)
- [Gateway-protocol](/nl/gateway/protocol#system-and-identity)
- [Logging](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — aparte flow voor het streamen van diagnostiek naar een collector
