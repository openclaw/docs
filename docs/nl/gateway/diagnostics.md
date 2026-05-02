---
read_when:
    - Een bugrapport of ondersteuningsverzoek voorbereiden
    - Foutopsporing bij Gateway-crashes, herstarts, geheugendruk of te grote payloads
    - Bekijken welke diagnostische gegevens worden vastgelegd of afgeschermd
summary: Maak deelbare Gateway-diagnosebundels voor bugrapporten
title: Diagnostiekexport
x-i18n:
    generated_at: "2026-05-02T11:16:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw kan een lokaal diagnostiek-zipbestand maken voor bugrapporten. Het combineert
gesaneerde Gateway-status, gezondheid, logs, configuratievorm en recente payloadvrije
stabiliteitsgebeurtenissen.

Behandel diagnostiekbundels als geheimen totdat je ze hebt gecontroleerd. Ze zijn
ontworpen om payloads en referenties weg te laten of te redigeren, maar ze vatten nog steeds
lokale Gateway-logs en runtime-status op hostniveau samen.

## Snel starten

```bash
openclaw gateway diagnostics export
```

De opdracht toont het pad van het geschreven zipbestand. Om een pad te kiezen:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Voor automatisering:

```bash
openclaw gateway diagnostics export --json
```

## Chatopdracht

Eigenaren kunnen `/diagnostics [note]` in chat gebruiken om een lokale Gateway-export aan te vragen.
Gebruik dit wanneer de bug in een echt gesprek is gebeurd en je één
kopieer-en-plakbaar rapport voor support wilt:

1. Stuur `/diagnostics` in het gesprek waarin je het probleem opmerkte. Voeg een
   korte notitie toe als dat helpt, bijvoorbeeld `/diagnostics bad tool choice`.
2. OpenClaw stuurt de diagnostiek-inleiding en vraagt om één expliciete exec-goedkeuring.
   De goedkeuring voert `openclaw gateway diagnostics export --json` uit.
   Keur diagnostiek niet goed via een alles-toestaan-regel.
3. Na goedkeuring antwoordt OpenClaw met een plakbaar rapport met het lokale
   bundelpad, manifestsamenvatting, privacynotities en relevante sessie-id's.

In groepschats kan een eigenaar nog steeds `/diagnostics` uitvoeren, maar OpenClaw plaatst
de diagnostische details niet terug in de gedeelde chat. Het stuurt de inleiding,
goedkeuringsprompts, het Gateway-exportresultaat en de uitsplitsing van Codex-sessies/threads naar
de eigenaar via de privégoedkeuringsroute. De groep krijgt alleen een korte melding
dat de diagnostiekflow privé is verzonden. Als OpenClaw geen privérout naar de eigenaar kan vinden,
mislukt de opdracht gesloten en vraagt die de eigenaar om deze vanuit een DM uit te voeren.

Wanneer de actieve OpenClaw-sessie de native OpenAI Codex-harness gebruikt,
dekt dezelfde exec-goedkeuring ook een OpenAI-feedbackupload voor de Codex-
runtime-threads waar OpenClaw van weet. Die upload staat los van het lokale
Gateway-zipbestand en verschijnt alleen voor Codex-harness-sessies. Vóór goedkeuring legt de
prompt uit dat het goedkeuren van diagnostiek ook Codex-feedback verstuurt, maar deze
vermeldt geen Codex-sessie- of thread-id's. Na goedkeuring vermeldt het chatantwoord
de kanalen, OpenClaw-sessie-id's, Codex-thread-id's en lokale hervattingsopdrachten
voor de threads die naar OpenAI-servers zijn verzonden. Als je de
goedkeuring weigert of negeert, voert OpenClaw de export niet uit, verstuurt het geen Codex-feedback en
toont het de Codex-id's niet.

Dat maakt de gebruikelijke Codex-debuglus kort: merk het slechte gedrag op in
Telegram, Discord of een ander kanaal, voer `/diagnostics` uit, keur één keer goed, deel
het rapport met support en voer daarna lokaal de getoonde opdracht `codex resume <thread-id>` uit
als je de native Codex-thread zelf wilt inspecteren. Zie
[Codex-harness](/nl/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) voor
die inspectieworkflow.

## Wat de export bevat

Het zipbestand bevat:

- `summary.md`: menselijk leesbaar overzicht voor support.
- `diagnostics.json`: machineleesbare samenvatting van configuratie, logs, status, gezondheid
  en stabiliteitsgegevens.
- `manifest.json`: exportmetadata en bestandslijst.
- Gesaneerde configuratievorm en niet-geheime configuratiedetails.
- Gesaneerde logsamenvattingen en recente geredigeerde logregels.
- Best-effort Gateway-status- en gezondheidssnapshots.
- `stability/latest.json`: nieuwste opgeslagen stabiliteitsbundel, indien beschikbaar.

De export is nuttig, zelfs wanneer de Gateway niet gezond is. Als de Gateway niet kan
antwoorden op status- of gezondheidsaanvragen, worden de lokale logs, configuratievorm en nieuwste
stabiliteitsbundel nog steeds verzameld wanneer beschikbaar.

## Privacymodel

Diagnostiek is ontworpen om deelbaar te zijn. De export behoudt operationele gegevens
die helpen bij debugging, zoals:

- subsysteemnamen, Plugin-id's, provider-id's, kanaal-id's en geconfigureerde modi
- statuscodes, duurwaarden, bytetellingen, wachtrijstatus en geheugenuitlezingen
- gesaneerde logmetadata en geredigeerde operationele berichten
- configuratievorm en niet-geheime functie-instellingen

De export laat weg of redigeert:

- chattekst, prompts, instructies, Webhook-body's en tooluitvoer
- referenties, API-sleutels, tokens, cookies en geheime waarden
- ruwe aanvraag- of antwoordbody's
- account-id's, bericht-id's, ruwe sessie-id's, hostnamen en lokale gebruikersnamen

Wanneer een logbericht eruitziet als tekst van een gebruiker, chat, prompt of toolpayload,
behoudt de export alleen dat een bericht is weggelaten en het aantal bytes.

## Stabiliteitsrecorder

De Gateway registreert standaard een begrensde, payloadvrije stabiliteitsstream wanneer
diagnostiek is ingeschakeld. Deze is bedoeld voor operationele feiten, niet voor inhoud.

Dezelfde diagnostische Heartbeat registreert levendigheidssamples wanneer de Gateway blijft
draaien maar de Node.js-eventloop of CPU verzadigd lijkt. Deze
`diagnostic.liveness.warning`-gebeurtenissen bevatten eventloopvertraging, eventloop-
gebruik, CPU-coreverhouding en aantallen actieve/wachtende/in de wachtrij geplaatste sessies. Inactieve
samples blijven in telemetrie op `info`-niveau; ze worden alleen als Gateway-
waarschuwingen gelogd wanneer diagnostisch werk actief is, wacht of in de wachtrij staat. Ze
herstarten de Gateway niet uit zichzelf.

Inspecteer de live recorder:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecteer de nieuwste opgeslagen stabiliteitsbundel na een fatale exit, afsluit-
timeout of opstartfout bij herstart:

```bash
openclaw gateway stability --bundle latest
```

Maak een diagnostiek-zipbestand van de nieuwste opgeslagen bundel:

```bash
openclaw gateway stability --bundle latest --export
```

Opgeslagen bundels staan onder `~/.openclaw/logs/stability/` wanneer er gebeurtenissen bestaan.

## Handige opties

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: schrijf naar een specifiek zipbestandspad.
- `--log-lines <count>`: maximumaantal gesaneerde logregels om op te nemen.
- `--log-bytes <bytes>`: maximumaantal logbytes om te inspecteren.
- `--url <url>`: Gateway-WebSocket-URL voor status- en gezondheidssnapshots.
- `--token <token>`: Gateway-token voor status- en gezondheidssnapshots.
- `--password <password>`: Gateway-wachtwoord voor status- en gezondheidssnapshots.
- `--timeout <ms>`: timeout voor status- en gezondheidssnapshot.
- `--no-stability-bundle`: sla het zoeken naar de opgeslagen stabiliteitsbundel over.
- `--json`: toon machineleesbare exportmetadata.

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
- [OpenTelemetry-export](/nl/gateway/opentelemetry) — afzonderlijke flow voor het streamen van diagnostiek naar een collector
