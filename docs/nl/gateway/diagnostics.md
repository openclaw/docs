---
read_when:
    - Een bugrapport of ondersteuningsverzoek voorbereiden
    - Gateway-crashes, herstarts, geheugendruk of te grote payloads debuggen
    - Bekijken welke diagnostische gegevens worden vastgelegd of weggelakt
summary: Deelbare Gateway-diagnosebundels voor bugrapporten maken
title: Diagnose-export
x-i18n:
    generated_at: "2026-04-29T22:43:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kan een lokale diagnostische zip maken voor bugrapporten. Deze combineert
geschoonde Gateway-status, gezondheid, logs, configuratievorm en recente payloadvrije
stabiliteitsgebeurtenissen.

Behandel diagnostische bundels als geheimen totdat je ze hebt beoordeeld. Ze zijn
ontworpen om payloads en referenties weg te laten of te redigeren, maar ze vatten nog steeds
lokale Gateway-logs en runtime-status op hostniveau samen.

## Snel starten

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

Eigenaren kunnen `/diagnostics [note]` in de chat gebruiken om een lokale Gateway-export aan te vragen.
Gebruik dit wanneer de bug in een echt gesprek optrad en je één
kopieerbaar rapport voor ondersteuning wilt:

1. Stuur `/diagnostics` in het gesprek waarin je het probleem hebt opgemerkt. Voeg een
   korte notitie toe als dat helpt, bijvoorbeeld `/diagnostics bad tool choice`.
2. OpenClaw stuurt de diagnostische inleiding en vraagt om één expliciete exec-goedkeuring.
   De goedkeuring voert `openclaw gateway diagnostics export --json` uit.
   Keur diagnostiek niet goed via een alles-toestaan-regel.
3. Na goedkeuring antwoordt OpenClaw met een plakbaar rapport met het lokale
   bundelpad, manifest-samenvatting, privacynotities en relevante sessie-id's.

In groepschats kan een eigenaar nog steeds `/diagnostics` uitvoeren, maar OpenClaw plaatst
de diagnostische details niet terug in de gedeelde chat. Het stuurt de inleiding,
goedkeuringsprompts, het Gateway-exportresultaat en de Codex-sessie/thread-uitsplitsing naar
de eigenaar via de privégoedkeuringsroute. De groep krijgt alleen een korte melding
dat de diagnostische flow privé is verzonden. Als OpenClaw geen privéroute naar de
eigenaar kan vinden, faalt de opdracht gesloten en vraagt deze de eigenaar om de opdracht vanuit een DM uit te voeren.

Wanneer de actieve OpenClaw-sessie de native OpenAI Codex-harness gebruikt,
dekt dezelfde exec-goedkeuring ook een OpenAI-feedbackupload voor de Codex
runtime-threads waar OpenClaw van weet. Die upload staat los van de lokale
Gateway-zip en verschijnt alleen voor Codex-harness-sessies. Vóór goedkeuring legt de
prompt uit dat het goedkeuren van diagnostiek ook Codex-feedback verzendt, maar deze
vermeldt geen Codex-sessie- of thread-id's. Na goedkeuring vermeldt het chatantwoord
de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale hervattingsopdrachten
voor de threads die naar OpenAI-servers zijn verzonden. Als je de goedkeuring weigert of negeert,
voert OpenClaw de export niet uit, verzendt het geen Codex-feedback en
print het de Codex-id's niet.

Dat maakt de gebruikelijke Codex-debuglus kort: merk het ongewenste gedrag op in
Telegram, Discord of een ander kanaal, voer `/diagnostics` uit, keur één keer goed, deel
het rapport met ondersteuning en voer daarna lokaal de geprinte opdracht `codex resume <thread-id>` uit
als je de native Codex-thread zelf wilt inspecteren. Zie
[Codex-harness](/nl/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) voor
die inspectieworkflow.

## Wat de export bevat

De zip bevat:

- `summary.md`: menselijk leesbaar overzicht voor ondersteuning.
- `diagnostics.json`: machineleesbare samenvatting van configuratie, logs, status, gezondheid
  en stabiliteitsgegevens.
- `manifest.json`: exportmetadata en bestandenlijst.
- Geschoonde configuratievorm en niet-geheime configuratiedetails.
- Geschoonde logsamenvattingen en recente geredigeerde logregels.
- Best-effort Gateway-status- en gezondheidssnapshots.
- `stability/latest.json`: nieuwste bewaarde stabiliteitsbundel, indien beschikbaar.

De export is nuttig, zelfs wanneer de Gateway ongezond is. Als de Gateway niet kan
antwoorden op status- of gezondheidsverzoeken, worden de lokale logs, configuratievorm en nieuwste
stabiliteitsbundel nog steeds verzameld wanneer ze beschikbaar zijn.

## Privacymodel

Diagnostiek is ontworpen om deelbaar te zijn. De export behoudt operationele gegevens
die helpen bij debuggen, zoals:

- namen van subsystemen, plugin-id's, provider-id's, kanaal-id's en geconfigureerde modi
- statuscodes, duurwaarden, byte-aantallen, wachtrijstatus en geheugenuitlezingen
- geschoonde logmetadata en geredigeerde operationele berichten
- configuratievorm en niet-geheime functie-instellingen

De export laat weg of redigeert:

- chattekst, prompts, instructies, webhook-bodies en tooluitvoer
- referenties, API-sleutels, tokens, cookies en geheime waarden
- ruwe request- of response-bodies
- account-id's, bericht-id's, ruwe sessie-id's, hostnamen en lokale gebruikersnamen

Wanneer een logbericht lijkt op tekst van een gebruiker, chat, prompt of toolpayload,
behoudt de export alleen dat een bericht is weggelaten en het byte-aantal.

## Stabiliteitsrecorder

De Gateway registreert standaard een begrensde, payloadvrije stabiliteitsstream wanneer
diagnostiek is ingeschakeld. Deze is bedoeld voor operationele feiten, niet voor inhoud.

Dezelfde diagnostische Heartbeat registreert levendigheidswaarschuwingen wanneer de Gateway blijft
draaien maar de Node.js-eventloop of CPU verzadigd lijkt. Deze
`diagnostic.liveness.warning`-gebeurtenissen bevatten eventloopvertraging, eventloopgebruik,
CPU-coreverhouding en aantallen actieve/wachtende/in de wachtrij geplaatste sessies. Ze
herstarten de Gateway niet zelfstandig.

Inspecteer de live recorder:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecteer de nieuwste bewaarde stabiliteitsbundel na een fatale afsluiting, shutdown-time-out
of opstartfout na herstart:

```bash
openclaw gateway stability --bundle latest
```

Maak een diagnostische zip van de nieuwste bewaarde bundel:

```bash
openclaw gateway stability --bundle latest --export
```

Bewaarde bundels staan onder `~/.openclaw/logs/stability/` wanneer gebeurtenissen bestaan.

## Handige opties

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
- `--timeout <ms>`: time-out voor status- en gezondheidssnapshot.
- `--no-stability-bundle`: sla het opzoeken van bewaarde stabiliteitsbundels over.
- `--json`: print machineleesbare exportmetadata.

## Diagnostiek uitschakelen

Diagnostiek is standaard ingeschakeld. Om de stabiliteitsrecorder en
het verzamelen van diagnostische gebeurtenissen uit te schakelen:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Het uitschakelen van diagnostiek vermindert het detailniveau van bugrapporten. Het heeft geen invloed op normale
Gateway-logging.

## Gerelateerd

- [Gezondheidscontroles](/nl/gateway/health)
- [Gateway CLI](/nl/cli/gateway#gateway-diagnostics-export)
- [Gateway-protocol](/nl/gateway/protocol#system-and-identity)
- [Logging](/nl/logging)
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — aparte flow voor het streamen van diagnostiek naar een collector
