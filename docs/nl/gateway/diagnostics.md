---
read_when:
    - Een bugrapport of ondersteuningsverzoek voorbereiden
    - Gateway-crashes, herstarts, geheugendruk of te grote payloads debuggen
    - Bekijken welke diagnostische gegevens worden vastgelegd of gemaskeerd
summary: Maak deelbare Gateway-diagnosebundels voor bugrapporten
title: Diagnostiekexport
x-i18n:
    generated_at: "2026-05-05T01:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kan een lokale diagnose-zip maken voor bugrapporten. Deze combineert
geschoonde Gateway-status, gezondheid, logs, configuratievorm en recente
payload-vrije stabiliteitsgebeurtenissen.

Behandel diagnosebundels als geheimen totdat je ze hebt gecontroleerd. Ze zijn
ontworpen om payloads en referenties weg te laten of te redigeren, maar ze vatten
nog steeds lokale Gateway-logs en runtime-status op hostniveau samen.

## Snel aan de slag

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
Gebruik dit wanneer de bug in een echt gesprek is opgetreden en je één
kopieerbaar rapport voor support wilt:

1. Stuur `/diagnostics` in het gesprek waarin je het probleem merkte. Voeg een
   korte notitie toe als dat helpt, bijvoorbeeld `/diagnostics bad tool choice`.
2. OpenClaw stuurt de diagnose-inleiding en vraagt om één expliciete
   exec-goedkeuring. De goedkeuring voert `openclaw gateway diagnostics export --json` uit.
   Keur diagnostiek niet goed via een alles-toestaan-regel.
3. Na goedkeuring antwoordt OpenClaw met een plakbaar rapport met het lokale
   bundelpad, manifestsamenvatting, privacynotities en relevante sessie-id's.

In groepschats kan een eigenaar nog steeds `/diagnostics` uitvoeren, maar OpenClaw plaatst de diagnostische details niet terug in de gedeelde chat. Het stuurt de inleiding,
goedkeuringsprompts, het Gateway-exportresultaat en de uitsplitsing van Codex-sessies/threads
naar de eigenaar via de privégoedkeuringsroute. De groep krijgt alleen een korte melding
dat de diagnostische flow privé is verzonden. Als OpenClaw geen privéroute naar de eigenaar kan vinden,
faalt de opdracht gesloten en vraagt deze de eigenaar om de opdracht vanuit een DM uit te voeren.

Wanneer de actieve OpenClaw-sessie de native OpenAI Codex-harness gebruikt,
dekt dezelfde exec-goedkeuring ook een OpenAI-feedbackupload voor de Codex
runtime-threads waar OpenClaw van weet. Die upload staat los van de lokale
Gateway-zip en verschijnt alleen voor Codex-harnesssessies. Vóór goedkeuring legt de
prompt uit dat het goedkeuren van diagnostiek ook Codex-feedback zal verzenden, maar hij
vermeldt geen Codex-sessie- of thread-id's. Na goedkeuring vermeldt het chatantwoord
de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale hervatopdrachten
voor de threads die naar OpenAI-servers zijn verzonden. Als je de goedkeuring weigert of negeert,
voert OpenClaw de export niet uit, verzendt het geen Codex-feedback en
print het de Codex-id's niet.

Dat maakt de gebruikelijke Codex-debuglus kort: merk het verkeerde gedrag op in
Telegram, Discord of een ander kanaal, voer `/diagnostics` uit, keur één keer goed, deel
het rapport met support en voer daarna lokaal de geprinte opdracht `codex resume <thread-id>` uit
als je de native Codex-thread zelf wilt inspecteren. Zie
[Codex-harness](/nl/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) voor
die inspectieworkflow.

## Wat de export bevat

De zip bevat:

- `summary.md`: voor mensen leesbaar overzicht voor support.
- `diagnostics.json`: machineleesbare samenvatting van configuratie, logs, status, gezondheid,
  en stabiliteitsgegevens.
- `manifest.json`: exportmetadata en bestandslijst.
- Geschoonde configuratievorm en niet-geheime configuratiedetails.
- Geschoonde logsamenvattingen en recente geredigeerde logregels.
- Best-effort Gateway-status- en gezondheidssnapshots.
- `stability/latest.json`: nieuwste bewaarde stabiliteitsbundel, indien beschikbaar.

De export is nuttig, zelfs wanneer de Gateway ongezond is. Als de Gateway niet kan
antwoorden op status- of gezondheidsverzoeken, worden de lokale logs, configuratievorm en nieuwste
stabiliteitsbundel nog steeds verzameld wanneer beschikbaar.

## Privacymodel

Diagnostiek is ontworpen om deelbaar te zijn. De export behoudt operationele gegevens
die helpen bij debugging, zoals:

- namen van subsystemen, Plugin-id's, provider-id's, kanaal-id's en geconfigureerde modi
- statuscodes, duur, byteaantallen, wachtrijstatus en geheugenuitlezingen
- geschoonde logmetadata en geredigeerde operationele berichten
- configuratievorm en niet-geheime functie-instellingen

De export laat weg of redigeert:

- chattekst, prompts, instructies, webhook-bodies en tooluitvoer
- referenties, API-sleutels, tokens, cookies en geheime waarden
- ruwe aanvraag- of antwoordbodies
- account-id's, bericht-id's, ruwe sessie-id's, hostnamen en lokale gebruikersnamen

Wanneer een logbericht lijkt op gebruikers-, chat-, prompt- of toolpayloadtekst, behoudt de
export alleen dat een bericht is weggelaten en het byteaantal.

## Stabiliteitsrecorder

De Gateway registreert standaard een begrensde, payload-vrije stabiliteitsstream wanneer
diagnostiek is ingeschakeld. Deze is bedoeld voor operationele feiten, niet voor inhoud.

Dezelfde diagnostische Heartbeat registreert liveness-samples wanneer de Gateway blijft
draaien maar de Node.js-eventloop of CPU verzadigd lijkt. Deze
`diagnostic.liveness.warning`-gebeurtenissen bevatten eventloopvertraging, eventloopgebruik,
CPU-coreverhouding, aantallen actieve/wachtende/in wachtrij geplaatste sessies, de huidige
opstart-/runtimefase wanneer bekend, recente fasespannes en begrensde actieve/in wachtrij geplaatste
werklabels. Inactieve samples blijven in telemetrie op `info`-niveau. Liveness-samples
worden alleen Gateway-waarschuwingen wanneer werk wacht of in de wachtrij staat, of wanneer actief werk
overlapt met aanhoudende eventloopvertraging. Tijdelijke max-delay-pieken tijdens
verder gezond achtergrondwerk blijven in debuglogs. Ze herstarten de
Gateway niet uit zichzelf.

Opstartfasen stoten ook `diagnostic.phase.completed`-gebeurtenissen uit met wandklok- en
CPU-timing. Vastgelopen embedded-run-diagnostiek markeert `terminalProgressStale=true`
wanneer de laatste bridge-voortgang terminaal leek, zoals een ruw response-item of
response completion-gebeurtenis, maar de Gateway de embedded run nog steeds als
actief beschouwt.

Inspecteer de live recorder:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecteer de nieuwste bewaarde stabiliteitsbundel na een fatale exit, shutdown-time-out
of opstartherstartfout:

```bash
openclaw gateway stability --bundle latest
```

Maak een diagnose-zip van de nieuwste bewaarde bundel:

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
- `--url <url>`: Gateway WebSocket-URL voor status- en gezondheidssnapshots.
- `--token <token>`: Gateway-token voor status- en gezondheidssnapshots.
- `--password <password>`: Gateway-wachtwoord voor status- en gezondheidssnapshots.
- `--timeout <ms>`: time-out voor status- en gezondheidssnapshots.
- `--no-stability-bundle`: sla het opzoeken van bewaarde stabiliteitsbundels over.
- `--json`: print machineleesbare exportmetadata.

## Diagnostiek uitschakelen

Diagnostiek is standaard ingeschakeld. Om de stabiliteitsrecorder en
verzameling van diagnostische gebeurtenissen uit te schakelen:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Diagnostiek uitschakelen vermindert de details in bugrapporten. Het heeft geen invloed op normale
Gateway-logging.

## Gerelateerd

- [Gezondheidscontroles](/nl/gateway/health)
- [Gateway CLI](/nl/cli/gateway#gateway-diagnostics-export)
- [Gateway-protocol](/nl/gateway/protocol#system-and-identity)
- [Logging](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — aparte flow voor het streamen van diagnostiek naar een collector
