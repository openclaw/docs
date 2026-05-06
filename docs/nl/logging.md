---
read_when:
    - Je hebt een beginnersvriendelijk overzicht van OpenClaw-logging nodig
    - Je wilt logniveaus, indelingen of maskering configureren
    - Je bent een probleem aan het oplossen en moet snel logs vinden
summary: Bestandslogs, console-uitvoer, CLI-tailing en het tabblad Logs van de Control UI
title: Logregistratie
x-i18n:
    generated_at: "2026-05-06T09:21:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw heeft twee hoofdoppervlakken voor logs:

- **Bestandslogs** (JSON-regels) geschreven door de Gateway.
- **Console-uitvoer** getoond in terminals en de Gateway Debug UI.

Het tabblad **Logs** van de Control UI volgt de bestandslog van de gateway. Deze pagina legt uit waar
logs staan, hoe je ze leest en hoe je logniveaus en -indelingen configureert.

## Waar logs staan

Standaard schrijft de Gateway een roterend logbestand onder:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

De datum gebruikt de lokale tijdzone van de gateway-host.

Elk bestand roteert wanneer het `logging.maxFileBytes` bereikt (standaard: 100 MB).
OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand, zoals
`openclaw-YYYY-MM-DD.1.log`, en blijft schrijven naar een nieuw actief logbestand in plaats van
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

- `--local-time`: timestamps weergeven in je lokale tijdzone
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standaard Gateway RPC-vlaggen
- `--expect-final`: agent-ondersteunde RPC-vlag voor wachten op definitieve respons (hier geaccepteerd via de gedeelde clientlaag)

Uitvoermodi:

- **TTY-sessies**: nette, gekleurde, gestructureerde logregels.
- **Niet-TTY-sessies**: platte tekst.
- `--json`: regelgescheiden JSON (één loggebeurtenis per regel).
- `--plain`: platte tekst afdwingen in TTY-sessies.
- `--no-color`: ANSI-kleuren uitschakelen.

Wanneer je een expliciete `--url` doorgeeft, past de CLI configuratie- of
omgevingsreferenties niet automatisch toe; voeg zelf `--token` toe als de doel-Gateway
authenticatie vereist.

In JSON-modus geeft de CLI objecten met een `type`-tag uit:

- `meta`: streammetadata (bestand, cursor, grootte)
- `log`: geparseerde loginvoer
- `notice`: hints voor afkapping / rotatie
- `raw`: ongeparseerde logregel

Als de impliciete local loopback Gateway om koppeling vraagt, sluit tijdens verbinden,
of een timeout krijgt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op de
geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze
fallback niet.

Als de Gateway onbereikbaar is, toont de CLI een korte hint om dit uit te voeren:

```bash
openclaw doctor
```

### Control UI (web)

Het tabblad **Logs** van de Control UI volgt hetzelfde bestand met `logs.tail`.
Zie [Control UI](/nl/web/control-ui) om te zien hoe je het opent.

### Alleen kanaallogs

Gebruik dit om kanaalactiviteit (WhatsApp/Telegram/enz.) te filteren:

```bash
openclaw channels logs --channel whatsapp
```

## Logindelingen

### Bestandslogs (JSONL)

Elke regel in het logbestand is een JSON-object. De CLI en Control UI parsen deze
invoer om gestructureerde uitvoer weer te geven (tijd, niveau, subsysteem, bericht).

JSONL-records van bestandslogs bevatten ook machinefilterbare velden op topniveau wanneer
beschikbaar:

- `hostname`: hostnaam van de gateway.
- `message`: afgeplatte logberichttekst voor volledige-tekstzoekopdrachten.
- `agent_id`: actieve agent-id wanneer de logaanroep agentcontext bevat.
- `session_id`: actieve sessie-id/sleutel wanneer de logaanroep sessiecontext bevat.
- `channel`: actief kanaal wanneer de logaanroep kanaalcontext bevat.

OpenClaw behoudt de oorspronkelijke gestructureerde logargumenten naast deze velden
zodat bestaande parsers die genummerde tslog-argumentsleutels lezen blijven werken.

### Console-uitvoer

Consolelogs zijn **TTY-bewust** en opgemaakt voor leesbaarheid:

- Subsysteemprefixen (bijv. `gateway/channels/whatsapp`)
- Niveaukleuren (info/warn/error)
- Optionele compacte of JSON-modus

Console-opmaak wordt beheerd door `logging.consoleStyle`.

### Gateway WebSocket-logs

`openclaw gateway` heeft ook WebSocket-protocollogging voor RPC-verkeer:

- normale modus: alleen interessante resultaten (fouten, parsefouten, langzame aanroepen)
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
- `logging.consoleLevel`: uitgebreidheidsniveau voor **console**.

Je kunt beide overschrijven via de omgevingsvariabele **`OPENCLAW_LOG_LEVEL`** (bijv. `OPENCLAW_LOG_LEVEL=debug`). De omgevingsvariabele heeft voorrang op het configuratiebestand, zodat je de uitgebreidheid voor één run kunt verhogen zonder `openclaw.json` te bewerken. Je kunt ook de globale CLI-optie **`--log-level <level>`** doorgeven (bijvoorbeeld `openclaw --log-level debug gateway run`), die de omgevingsvariabele voor die opdracht overschrijft.

`--verbose` beïnvloedt alleen console-uitvoer en WS-loguitgebreidheid; het verandert
bestandslogniveaus niet.

### Tracecorrelatie

Bestandslogs zijn JSONL. Wanneer een logaanroep een geldige diagnostische tracecontext bevat,
schrijft OpenClaw de tracevelden als JSON-sleutels op topniveau (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) zodat externe logprocessors de regel kunnen correleren
met OTEL-spans en `traceparent`-propagatie van providers.

Gateway HTTP-aanvragen en Gateway WebSocket-frames stellen een interne request
trace-scope vast. Logs en diagnostische gebeurtenissen die binnen die asynchrone scope worden uitgegeven erven
de request-trace wanneer ze geen expliciete tracecontext doorgeven. Agent-run- en
modelaanroeptraces worden kinderen van de actieve request-trace, zodat lokale logs,
diagnostische snapshots, OTEL-spans en vertrouwde provider-`traceparent`-headers kunnen
worden samengevoegd via `traceId` zonder ruwe aanvraag- of modelinhoud te loggen.

### Grootte en timing van modelaanroepen

Diagnostiek van modelaanroepen registreert begrensde metingen van aanvraag/antwoord zonder
ruwe prompt- of antwoordinhoud vast te leggen:

- `requestPayloadBytes`: UTF-8-bytegrootte van de uiteindelijke payload van de modelaanvraag
- `responseStreamBytes`: UTF-8-bytegrootte van gestreamde modelantwoordgebeurtenissen
- `timeToFirstByteMs`: verstreken tijd vóór de eerste gestreamde antwoordgebeurtenis
- `durationMs`: totale duur van de modelaanroep

Deze velden zijn beschikbaar voor diagnostische snapshots, plugin hooks voor modelaanroepen en
OTEL-spans/metrieken voor modelaanroepen wanneer diagnostiekexport is ingeschakeld.

### Consolestijlen

`logging.consoleStyle`:

- `pretty`: gebruiksvriendelijk, gekleurd, met timestamps.
- `compact`: compactere uitvoer (het beste voor lange sessies).
- `json`: JSON per regel (voor logprocessors).

### Redactie

OpenClaw kan gevoelige tokens redigeren voordat ze terechtkomen in console-uitvoer, bestandslogs,
OTLP-logrecords, opgeslagen tekst van sessietranscripten of tool-
gebeurtenispayloads van de Control UI (startargumenten van tools, gedeeltelijke/definitieve resultaatpayloads, afgeleide
exec-uitvoer en patchsamenvattingen):

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: lijst met regex-strings om de standaardset te overschrijven. Aangepaste patronen worden toegepast boven op de ingebouwde standaarden voor toolpayloads van de Control UI, dus het toevoegen van een patroon verzwakt nooit de redactie van waarden die al door de standaarden worden afgevangen.

Bestandslogs en sessietranscripten blijven JSONL, maar overeenkomende geheime waarden worden
gemaskeerd voordat de regel of het bericht naar schijf wordt geschreven. Redactie is best-effort:
het wordt toegepast op berichtinhoud met tekst en logstrings, niet op elk
identifier- of binair payloadveld.

De ingebouwde standaarden dekken veelvoorkomende API-referenties en veldnamen voor betalingsreferenties
zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betalingsreferentie
wanneer ze verschijnen als JSON-velden, URL-parameters, CLI-vlaggen of toewijzingen.

`logging.redactSensitive: "off"` schakelt alleen dit algemene log-/transcript-
beleid uit. OpenClaw redigeert nog steeds safety-boundary-payloads die kunnen worden getoond aan UI-
clients, supportbundels, diagnostiekwaarnemers, goedkeuringsprompts of agent-
tools. Voorbeelden zijn toolaanroepgebeurtenissen van de Control UI, `sessions_history`-uitvoer,
diagnostische supportexports, providerfoutobservaties, weergave van exec-goedkeuringsopdrachten
en Gateway WebSocket-protocollogs. Aangepaste `logging.redactPatterns`
kunnen op die oppervlakken nog steeds projectspecifieke patronen toevoegen.

## Diagnostiek en OpenTelemetry

Diagnostiek bestaat uit gestructureerde, machineleesbare gebeurtenissen voor modelruns en
berichtstroomtelemetrie (webhooks, wachtrijen, sessiestatus). Ze vervangen logs **niet** —
ze voeden metrieken, traces en exporters. Gebeurtenissen worden in-process uitgegeven,
of je ze nu exporteert of niet.

Twee aangrenzende oppervlakken:

- **OpenTelemetry-export** — stuur metrieken, traces en logs via OTLP/HTTP naar
  elke OpenTelemetry-compatibele collector of backend (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, enz.). Volledige configuratie, signaalcatalogus,
  metriek-/spannamen, omgevingsvariabelen en privacymodel staan op een speciale pagina:
  [OpenTelemetry-export](/nl/gateway/opentelemetry).
- **Diagnostiekvlaggen** — gerichte debuglogvlaggen die extra logs naar
  `logging.file` routeren zonder `logging.level` te verhogen. Vlaggen zijn hoofdletterongevoelig
  en ondersteunen wildcards (`telegram.*`, `*`). Configureer onder `diagnostics.flags`
  of via de env-override `OPENCLAW_DIAGNOSTICS=...`. Volledige gids:
  [Diagnostiekvlaggen](/nl/diagnostics/flags).

Om diagnostiekgebeurtenissen in te schakelen voor plugins of aangepaste sinks zonder OTLP-export:

```json5
{
  diagnostics: { enabled: true },
}
```

Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor OTLP-export naar een collector.

## Tips voor probleemoplossing

- **Gateway niet bereikbaar?** Voer eerst `openclaw doctor` uit.
- **Logs leeg?** Controleer of de Gateway draait en schrijft naar het bestandspad
  in `logging.file`.
- **Meer details nodig?** Stel `logging.level` in op `debug` of `trace` en probeer opnieuw.

## Gerelateerd

- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP/HTTP-export, metriek-/spancatalogus, privacymodel
- [Diagnostiekvlaggen](/nl/diagnostics/flags) — gerichte debuglogvlaggen
- [Interne werking van Gateway-logging](/nl/gateway/logging) — WS-logstijlen, subsysteemprefixen en console-opname
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige veldreferentie voor `diagnostics.*`
