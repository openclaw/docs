---
read_when:
    - Je hebt een beginnersvriendelijk overzicht van OpenClaw-logboekregistratie nodig
    - Je wilt logniveaus, indelingen of afscherming configureren
    - U lost problemen op en moet snel logbestanden vinden
summary: Bestandslogs, console-uitvoer, CLI-tailing en het tabblad Logs van de Control UI
title: Logregistratie
x-i18n:
    generated_at: "2026-05-06T11:28:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw heeft twee hoofdoppervlakken voor logs:

- **Bestandslogs** (JSON-regels) geschreven door de Gateway.
- **Console-uitvoer** weergegeven in terminals en de Gateway Debug UI.

Het tabblad **Logs** van de Control UI volgt het gateway-bestandslog. Deze pagina legt uit waar
logs staan, hoe je ze leest en hoe je logniveaus en -indelingen configureert.

## Waar logs staan

Standaard schrijft de Gateway een roterend logbestand onder:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

De datum gebruikt de lokale tijdzone van de gateway-host.

Elk bestand roteert wanneer het `logging.maxFileBytes` bereikt (standaard: 100 MB).
OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand, zoals
`openclaw-YYYY-MM-DD.1.log`, en blijft schrijven naar een nieuw actief log in plaats van
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

Nuttige huidige opties:

- `--local-time`: geef tijdstempels weer in je lokale tijdzone
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standaard Gateway RPC-vlaggen
- `--expect-final`: wachtvlag voor agent-ondersteunde definitieve RPC-reactie (hier geaccepteerd via de gedeelde clientlaag)

Uitvoermodi:

- **TTY-sessies**: fraaie, gekleurde, gestructureerde logregels.
- **Niet-TTY-sessies**: platte tekst.
- `--json`: regelgescheiden JSON (een loggebeurtenis per regel).
- `--plain`: forceer platte tekst in TTY-sessies.
- `--no-color`: schakel ANSI-kleuren uit.

Wanneer je een expliciete `--url` doorgeeft, past de CLI niet automatisch configuratie- of
omgevingsreferenties toe; voeg zelf `--token` toe als de doel-Gateway
authenticatie vereist.

In JSON-modus geeft de CLI objecten met een `type`-tag uit:

- `meta`: streammetadata (bestand, cursor, grootte)
- `log`: geparseerde logvermelding
- `notice`: hints voor afkapping / rotatie
- `raw`: niet-geparseerde logregel

Als de impliciete local loopback Gateway om koppeling vraagt, sluit tijdens het verbinden,
of een time-out krijgt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het
geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze fallback niet.

Als de Gateway onbereikbaar is, geeft de CLI een korte hint om dit uit te voeren:

```bash
openclaw doctor
```

### Control UI (web)

Het tabblad **Logs** van de Control UI volgt hetzelfde bestand met `logs.tail`.
Zie [Control UI](/nl/web/control-ui) voor hoe je het opent.

### Alleen kanaallogs

Om kanaalactiviteit (WhatsApp/Telegram/enzovoort) te filteren, gebruik je:

```bash
openclaw channels logs --channel whatsapp
```

## Logindelingen

### Bestandslogs (JSONL)

Elke regel in het logbestand is een JSON-object. De CLI en Control UI parseren deze
vermeldingen om gestructureerde uitvoer weer te geven (tijd, niveau, subsysteem, bericht).

Bestandslogrecords in JSONL bevatten ook machine-filterbare velden op topniveau wanneer
beschikbaar:

- `hostname`: hostnaam van de gateway.
- `message`: afgeplatte logberichttekst voor zoeken in volledige tekst.
- `agent_id`: actieve agent-id wanneer de logaanroep agentcontext bevat.
- `session_id`: actieve sessie-id/-sleutel wanneer de logaanroep sessiecontext bevat.
- `channel`: actief kanaal wanneer de logaanroep kanaalcontext bevat.

OpenClaw behoudt de oorspronkelijke gestructureerde logargumenten naast deze velden,
zodat bestaande parsers die genummerde tslog-argumentsleutels lezen blijven werken.

Talk-, realtime-spraak- en beheerde-ruimteactiviteit verzendt begrensde lifecycle-logrecords
via dezelfde bestandslogpipeline. Deze records bevatten gebeurtenistype,
modus, transport, provider en metingen voor grootte/timing wanneer beschikbaar, maar laten
transcripttekst, audio-payloads, turn-id's, call-id's en provider-item-id's weg.

### Console-uitvoer

Consolelogs zijn **TTY-bewust** en geformatteerd voor leesbaarheid:

- Subsysteemprefixen (bijv. `gateway/channels/whatsapp`)
- Niveaukleuring (info/warn/error)
- Optionele compacte of JSON-modus

Consoleformattering wordt beheerd door `logging.consoleStyle`.

### Gateway WebSocket-logs

`openclaw gateway` heeft ook WebSocket-protocollogging voor RPC-verkeer:

- normale modus: alleen interessante resultaten (fouten, parsefouten, trage aanroepen)
- `--verbose`: al het request/response-verkeer
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

Je kunt beide overschrijven via de omgevingsvariabele **`OPENCLAW_LOG_LEVEL`** (bijv. `OPENCLAW_LOG_LEVEL=debug`). De env-var heeft voorrang op het configuratiebestand, zodat je de uitgebreidheid voor één run kunt verhogen zonder `openclaw.json` te bewerken. Je kunt ook de globale CLI-optie **`--log-level <level>`** doorgeven (bijvoorbeeld `openclaw --log-level debug gateway run`), die de omgevingsvariabele voor die opdracht overschrijft.

`--verbose` beïnvloedt alleen console-uitvoer en WS-loguitgebreidheid; het verandert
bestandslogniveaus niet.

### Tracecorrelatie

Bestandslogs zijn JSONL. Wanneer een logaanroep een geldige diagnostische tracecontext bevat,
schrijft OpenClaw de tracevelden als JSON-sleutels op topniveau (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), zodat externe logprocessors de regel kunnen correleren
met OTEL-spans en provider-`traceparent`-propagatie.

Gateway HTTP-requests en Gateway WebSocket-frames stellen een interne request-tracescope in.
Logs en diagnostische gebeurtenissen die binnen die async-scope worden uitgegeven erven
de request-trace wanneer ze geen expliciete tracecontext doorgeven. Agent-run- en
model-call-traces worden kinderen van de actieve request-trace, zodat lokale logs,
diagnostische snapshots, OTEL-spans en vertrouwde provider-`traceparent`-headers
met `traceId` kunnen worden samengevoegd zonder ruwe request- of modelinhoud te loggen.

Talk-lifecycle-logrecords stromen ook naar OTLP-logs wanneer OpenTelemetry-logexport
is ingeschakeld, met dezelfde begrensde attributen als bestandslogs.

### Grootte en timing van modelaanroepen

Diagnostiek van modelaanroepen registreert begrensde request/response-metingen zonder
ruwe prompt- of reactie-inhoud vast te leggen:

- `requestPayloadBytes`: UTF-8-bytegrootte van de uiteindelijke request-payload voor het model
- `responseStreamBytes`: UTF-8-bytegrootte van gestreamde modelresponse-gebeurtenissen
- `timeToFirstByteMs`: verstreken tijd tot de eerste gestreamde response-gebeurtenis
- `durationMs`: totale duur van de modelaanroep

Deze velden zijn beschikbaar voor diagnostische snapshots, Plugin-hooks voor modelaanroepen en
OTEL-spans/-metingen voor modelaanroepen wanneer diagnostiekexport is ingeschakeld.

### Consolestijlen

`logging.consoleStyle`:

- `pretty`: mensvriendelijk, gekleurd, met tijdstempels.
- `compact`: strakkere uitvoer (het best voor lange sessies).
- `json`: JSON per regel (voor logprocessors).

### Redactie

OpenClaw kan gevoelige tokens redigeren voordat ze in console-uitvoer, bestandslogs,
OTLP-logrecords, opgeslagen sessietranscripttekst of toolgebeurtenis-payloads van de Control UI
terechtkomen (tool-startargumenten, gedeeltelijke/definitieve resultaatpayloads, afgeleide
exec-uitvoer en patchsamenvattingen):

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: lijst met regexstrings om de standaardset te overschrijven. Aangepaste patronen worden bovenop de ingebouwde standaarden voor toolpayloads van de Control UI toegepast, dus een patroon toevoegen verzwakt nooit de redactie van waarden die al door de standaarden worden afgevangen.

Bestandslogs en sessietranscripten blijven JSONL, maar overeenkomende geheime waarden worden
gemaskeerd voordat de regel of het bericht naar schijf wordt geschreven. Redactie is best-effort:
ze is van toepassing op tekstdragende berichtinhoud en logstrings, niet op elk
identificatie- of binaire-payloadveld.

De ingebouwde standaarden dekken veelvoorkomende API-referenties en veldnamen voor
betalingsreferenties, zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betalingsreferentie
wanneer ze verschijnen als JSON-velden, URL-parameters, CLI-vlaggen of toewijzingen.

`logging.redactSensitive: "off"` schakelt alleen dit algemene log/transcriptbeleid uit.
OpenClaw redigeert nog steeds payloads aan veiligheidsgrenzen die kunnen worden getoond aan UI-
clients, supportbundels, diagnostiekwaarnemers, goedkeuringsprompts of agenttools.
Voorbeelden zijn tool-call-gebeurtenissen van de Control UI, `sessions_history`-uitvoer,
diagnostische supportexports, provider-foutobservaties, weergave van exec-goedkeuringsopdrachten
en Gateway WebSocket-protocollogs. Aangepaste `logging.redactPatterns`
kunnen nog steeds projectspecifieke patronen toevoegen op die oppervlakken.

## Diagnostiek en OpenTelemetry

Diagnostiek bestaat uit gestructureerde, machineleesbare gebeurtenissen voor modelruns en
telemetrie van berichtstromen (webhooks, wachtrijvorming, sessiestatus). Ze vervangen logs **niet**:
ze voeden metrics, traces en exporters. Gebeurtenissen worden in-process uitgegeven, ongeacht
of je ze exporteert.

Twee aangrenzende oppervlakken:

- **OpenTelemetry-export** — stuur metrics, traces en logs via OTLP/HTTP naar
  elke OpenTelemetry-compatibele collector of backend (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, enzovoort). Volledige configuratie, signaalcatalogus,
  namen van metrics/spans, env-vars en privacymodel staan op een aparte pagina:
  [OpenTelemetry-export](/nl/gateway/opentelemetry).
- **Diagnostiekvlaggen** — gerichte debug-logvlaggen die extra logs naar
  `logging.file` routeren zonder `logging.level` te verhogen. Vlaggen zijn hoofdletterongevoelig
  en ondersteunen wildcards (`telegram.*`, `*`). Configureer onder `diagnostics.flags`
  of via de env-override `OPENCLAW_DIAGNOSTICS=...`. Volledige gids:
  [Diagnostiekvlaggen](/nl/diagnostics/flags).

Om diagnostische gebeurtenissen in te schakelen voor plugins of aangepaste sinks zonder OTLP-export:

```json5
{
  diagnostics: { enabled: true },
}
```

Voor OTLP-export naar een collector, zie [OpenTelemetry-export](/nl/gateway/opentelemetry).

## Tips voor probleemoplossing

- **Gateway niet bereikbaar?** Voer eerst `openclaw doctor` uit.
- **Logs leeg?** Controleer of de Gateway draait en schrijft naar het bestandspad
  in `logging.file`.
- **Meer detail nodig?** Stel `logging.level` in op `debug` of `trace` en probeer opnieuw.

## Gerelateerd

- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP/HTTP-export, metric/span-catalogus, privacymodel
- [Diagnostiekvlaggen](/nl/diagnostics/flags) — gerichte debug-logvlaggen
- [Interne Gateway-logging](/nl/gateway/logging) — WS-logstijlen, subsysteemprefixen en consolevastlegging
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige veldreferentie voor `diagnostics.*`
