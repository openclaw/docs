---
read_when:
    - Je hebt een beginnersvriendelijk overzicht van OpenClaw-logregistratie nodig
    - Je wilt logniveaus, indelingen of maskering configureren
    - Je lost problemen op en moet snel logbestanden vinden
summary: Bestandslogboeken, console-uitvoer, volgen via de CLI en het tabblad Logboeken in de Control UI
title: Logregistratie
x-i18n:
    generated_at: "2026-05-01T11:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw heeft twee hoofdoppervlakken voor logs:

- **Bestandslogs** (JSON-regels) geschreven door de Gateway.
- **Console-uitvoer** getoond in terminals en de Gateway Debug UI.

Het tabblad **Logs** van de Control UI volgt het gateway-bestandslog. Deze pagina legt uit waar
logs staan, hoe je ze leest en hoe je logniveaus en -indelingen configureert.

## Waar logs staan

Standaard schrijft de Gateway een roterend logbestand onder:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

De datum gebruikt de lokale tijdzone van de gateway-host.

Elk bestand roteert wanneer het `logging.maxFileBytes` bereikt (standaard: 100 MB).
OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand, zoals
`openclaw-YYYY-MM-DD.1.log`, en blijft naar een nieuw actief log schrijven in plaats van
diagnostiek te onderdrukken.

Je kunt dit overschrijven in `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Logs lezen

### CLI: live volgen (aanbevolen)

Gebruik de CLI om het gateway-logbestand via RPC te volgen:

```bash
openclaw logs --follow
```

Handige huidige opties:

- `--local-time`: timestamps weergeven in je lokale tijdzone
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standaard Gateway-RPC-vlaggen
- `--expect-final`: wachtvlag voor de eindrespons van agent-ondersteunde RPC (hier geaccepteerd via de gedeelde clientlaag)

Uitvoermodi:

- **TTY-sessies**: fraaie, ingekleurde, gestructureerde logregels.
- **Niet-TTY-sessies**: platte tekst.
- `--json`: regelgescheiden JSON (één loggebeurtenis per regel).
- `--plain`: platte tekst afdwingen in TTY-sessies.
- `--no-color`: ANSI-kleuren uitschakelen.

Wanneer je een expliciete `--url` doorgeeft, past de CLI configuratie- of
omgevingscredentials niet automatisch toe; voeg zelf `--token` toe als de doel-Gateway
authenticatie vereist.

In JSON-modus geeft de CLI objecten met een `type`-tag uit:

- `meta`: streammetadata (bestand, cursor, grootte)
- `log`: geparseerde logvermelding
- `notice`: hints voor afkapping / rotatie
- `raw`: ongeparseerde logregel

Als de impliciete local loopback Gateway om pairing vraagt, tijdens het verbinden sluit,
of een time-out krijgt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het
geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze fallback niet.

Als de Gateway onbereikbaar is, toont de CLI een korte hint om dit uit te voeren:

```bash
openclaw doctor
```

### Control UI (web)

Het tabblad **Logs** van de Control UI volgt hetzelfde bestand met `logs.tail`.
Zie [/web/control-ui](/nl/web/control-ui) voor hoe je het opent.

### Alleen-kanaallogs

Gebruik dit om kanaalactiviteit (WhatsApp/Telegram/enz.) te filteren:

```bash
openclaw channels logs --channel whatsapp
```

## Logindelingen

### Bestandslogs (JSONL)

Elke regel in het logbestand is een JSON-object. De CLI en Control UI parseren deze
vermeldingen om gestructureerde uitvoer weer te geven (tijd, niveau, subsysteem, bericht).

JSONL-records van bestandslogs bevatten ook machinefilterbare top-level velden wanneer
beschikbaar:

- `hostname`: hostnaam van de gateway.
- `message`: afgeplatte logberichttekst voor zoeken in volledige tekst.
- `agent_id`: actieve agent-id wanneer de logaanroep agentcontext bevat.
- `session_id`: actieve sessie-id/sleutel wanneer de logaanroep sessiecontext bevat.
- `channel`: actief kanaal wanneer de logaanroep kanaalcontext bevat.

OpenClaw bewaart de oorspronkelijke gestructureerde logargumenten naast deze velden,
zodat bestaande parsers die genummerde tslog-argumentsleutels lezen blijven werken.

### Console-uitvoer

Consolelogs zijn **TTY-bewust** en opgemaakt voor leesbaarheid:

- Subsysteemprefixen (bijv. `gateway/channels/whatsapp`)
- Niveaukleuring (info/warn/error)
- Optionele compacte of JSON-modus

Console-opmaak wordt geregeld door `logging.consoleStyle`.

### Gateway WebSocket-logs

`openclaw gateway` heeft ook WebSocket-protocollogging voor RPC-verkeer:

- normale modus: alleen interessante resultaten (fouten, parsefouten, trage aanroepen)
- `--verbose`: al het aanvraag-/antwoordverkeer
- `--ws-log auto|compact|full`: kies de uitgebreide weergavestijl
- `--compact`: alias voor `--ws-log compact`

Voorbeelden:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Logging configureren

Alle loggingconfiguratie staat onder `logging` in `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Logniveaus

- `logging.level`: niveau voor **bestandslogs** (JSONL).
- `logging.consoleLevel`: uitgebreidheidsniveau voor de **console**.

Je kunt beide overschrijven via de omgevingsvariabele **`OPENCLAW_LOG_LEVEL`** (bijv. `OPENCLAW_LOG_LEVEL=debug`). De omgevingsvariabele heeft voorrang op het configuratiebestand, zodat je de uitgebreidheid voor één run kunt verhogen zonder `openclaw.json` te bewerken. Je kunt ook de globale CLI-optie **`--log-level <level>`** doorgeven (bijvoorbeeld `openclaw --log-level debug gateway run`), die de omgevingsvariabele voor die opdracht overschrijft.

`--verbose` beïnvloedt alleen console-uitvoer en WS-loguitgebreidheid; het verandert
bestandslogniveaus niet.

### Trace-correlatie

Bestandslogs zijn JSONL. Wanneer een logaanroep een geldige diagnostische tracecontext bevat,
schrijft OpenClaw de tracevelden als top-level JSON-sleutels (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) zodat externe logprocessors de regel kunnen correleren
met OTEL-spans en `traceparent`-propagatie van providers.

Gateway-HTTP-verzoeken en Gateway WebSocket-frames stellen een interne aanvraag-
tracescope in. Logs en diagnostische gebeurtenissen die binnen die async scope worden uitgegeven erven
de aanvraagtrace wanneer ze geen expliciete tracecontext doorgeven. Agent-run- en
modelaanroeptraces worden kinderen van de actieve aanvraagtrace, zodat lokale logs,
diagnostische snapshots, OTEL-spans en vertrouwde `traceparent`-headers van providers kunnen
worden gekoppeld via `traceId` zonder ruwe aanvraag- of modelinhoud te loggen.

### Grootte en timing van modelaanroepen

Diagnostiek voor modelaanroepen registreert begrensde aanvraag-/antwoordmetingen zonder
ruwe prompt- of antwoordinhoud vast te leggen:

- `requestPayloadBytes`: UTF-8-bytegrootte van de uiteindelijke modelaanvraagpayload
- `responseStreamBytes`: UTF-8-bytegrootte van gestreamde modelantwoordgebeurtenissen
- `timeToFirstByteMs`: verstreken tijd vóór de eerste gestreamde antwoordgebeurtenis
- `durationMs`: totale duur van de modelaanroep

Deze velden zijn beschikbaar voor diagnostische snapshots, modelaanroep-hooks van Plugins en
OTEL-modelaanroep-spans/-metrics wanneer diagnostiekexport is ingeschakeld.

### Consolestijlen

`logging.consoleStyle`:

- `pretty`: mensvriendelijk, gekleurd, met timestamps.
- `compact`: compactere uitvoer (het beste voor lange sessies).
- `json`: JSON per regel (voor logprocessors).

### Redactie

OpenClaw kan gevoelige tokens redigeren voordat ze in console-uitvoer, bestandslogs,
OTLP-logrecords, opgeslagen sessietranscripttekst of Control UI-tool-
gebeurtenispayloads terechtkomen (startargumenten van tools, gedeeltelijke/definitieve resultaatpayloads, afgeleide
exec-uitvoer en patchsamenvattingen):

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: lijst met regex-strings om de standaardset te overschrijven. Aangepaste patronen worden boven op de ingebouwde standaarden voor Control UI-toolpayloads toegepast, dus het toevoegen van een patroon verzwakt nooit de redactie van waarden die al door de standaarden worden gevonden.

Bestandslogs en sessietranscripten blijven JSONL, maar overeenkomende geheime waarden worden
gemaskeerd voordat de regel of het bericht naar schijf wordt geschreven. Redactie is best-effort:
ze wordt toegepast op tekstdragende berichtinhoud en logstrings, niet op elk
identifier- of binair payloadveld.

De ingebouwde standaarden dekken gangbare API-credentials en veldnamen voor betaalcredentials
zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betaalcredential
wanneer ze voorkomen als JSON-velden, URL-parameters, CLI-vlaggen of toewijzingen.

`logging.redactSensitive: "off"` schakelt alleen dit algemene log-/transcript-
beleid uit. OpenClaw redigeert nog steeds payloads op veiligheidsgrenzen die aan UI-
clients, supportbundels, diagnostiekwaarnemers, goedkeuringsprompts of agent-
tools kunnen worden getoond. Voorbeelden zijn Control UI-toolaanroepgebeurtenissen, `sessions_history`-uitvoer,
diagnostische supportexports, providerfoutobservaties, weergave van exec-goedkeuringsopdrachten
en Gateway WebSocket-protocollogs. Aangepaste `logging.redactPatterns`
kunnen nog steeds projectspecifieke patronen toevoegen op die oppervlakken.

## Diagnostiek en OpenTelemetry

Diagnostiek bestaat uit gestructureerde, machineleesbare gebeurtenissen voor modelruns en
berichtstroomtelemetrie (webhooks, queueing, sessiestatus). Ze vervangen logs **niet** —
ze voeden metrics, traces en exporters. Gebeurtenissen worden in-process uitgegeven,
ongeacht of je ze exporteert.

Twee aangrenzende oppervlakken:

- **OpenTelemetry-export** — stuur metrics, traces en logs via OTLP/HTTP naar
  elke OpenTelemetry-compatibele collector of backend (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, enz.). Volledige configuratie, signaalcatalogus,
  metric-/spannamen, omgevingsvariabelen en privacymodel staan op een aparte pagina:
  [OpenTelemetry-export](/nl/gateway/opentelemetry).
- **Diagnostiekvlaggen** — gerichte debug-logvlaggen die extra logs naar
  `logging.file` routeren zonder `logging.level` te verhogen. Vlaggen zijn hoofdletterongevoelig
  en ondersteunen wildcards (`telegram.*`, `*`). Configureer onder `diagnostics.flags`
  of via de omgevingsoverschrijving `OPENCLAW_DIAGNOSTICS=...`. Volledige gids:
  [Diagnostiekvlaggen](/nl/diagnostics/flags).

Om diagnostiekgebeurtenissen voor Plugins of aangepaste sinks zonder OTLP-export in te schakelen:

```json5
{
  diagnostics: { enabled: true },
}
```

Voor OTLP-export naar een collector, zie [OpenTelemetry-export](/nl/gateway/opentelemetry).

## Tips voor probleemoplossing

- **Gateway niet bereikbaar?** Voer eerst `openclaw doctor` uit.
- **Logs leeg?** Controleer of de Gateway draait en naar het bestandspad
  in `logging.file` schrijft.
- **Meer detail nodig?** Zet `logging.level` op `debug` of `trace` en probeer het opnieuw.

## Gerelateerd

- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP/HTTP-export, metric-/spancatalogus, privacymodel
- [Diagnostiekvlaggen](/nl/diagnostics/flags) — gerichte debug-logvlaggen
- [Gateway-logginginternals](/nl/gateway/logging) — WS-logstijlen, subsysteemprefixen en consolevastlegging
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige veldreferentie voor `diagnostics.*`
