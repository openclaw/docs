---
read_when:
    - Je hebt een beginnersvriendelijk overzicht van logging in OpenClaw nodig
    - Je wilt logniveaus, -indelingen of redactie configureren
    - Je bent aan het troubleshooten en moet snel logs vinden
summary: Bestandslogs, console-uitvoer, CLI-tailen en het tabblad Logs in de Control UI
title: Logboekregistratie
x-i18n:
    generated_at: "2026-06-27T17:44:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw heeft twee hoofdoppervlakken voor logs:

- **Bestandslogs** (JSON-regels) geschreven door de Gateway.
- **Console-uitvoer** weergegeven in terminals en de Gateway Debug UI.

Het tabblad **Logs** in de Control UI volgt het gateway-bestandslog. Deze pagina legt uit waar
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

Nuttige huidige opties:

- `--local-time`: geef tijdstempels weer in je lokale tijdzone
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standaard Gateway RPC-vlaggen
- `--expect-final`: wachtvlag voor agent-ondersteunde uiteindelijke RPC-respons (hier geaccepteerd via de gedeelde clientlaag)

Uitvoermodi:

- **TTY-sessies**: mooie, ingekleurde, gestructureerde logregels.
- **Niet-TTY-sessies**: platte tekst.
- `--json`: regelgescheiden JSON (één loggebeurtenis per regel).
- `--plain`: forceer platte tekst in TTY-sessies.
- `--no-color`: schakel ANSI-kleuren uit.

Wanneer je een expliciete `--url` doorgeeft, past de CLI configuratie- of
omgevingsreferenties niet automatisch toe; voeg zelf `--token` toe als de doel-Gateway
auth vereist.

In JSON-modus geeft de CLI objecten met `type`-tags uit:

- `meta`: streammetadata (bestand, cursor, grootte)
- `log`: geparste logvermelding
- `notice`: hints voor afkapping / rotatie
- `raw`: ongeparste logregel

Als de impliciete local loopback Gateway om koppeling vraagt, sluit tijdens het verbinden,
of een time-out krijgt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het
geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze fallback niet.
`openclaw logs --follow` is strenger: op Linux gebruikt het het actieve
user-systemd Gateway-journal op PID wanneer beschikbaar, en anders blijft het de live
Gateway opnieuw proberen in plaats van een mogelijk verouderd naastliggend bestand te volgen.

Als de Gateway onbereikbaar is, drukt de CLI een korte hint af om uit te voeren:

```bash
openclaw doctor
```

### Control UI (web)

Het tabblad **Logs** van de Control UI volgt hetzelfde bestand met `logs.tail`.
Zie [Control UI](/nl/web/control-ui) voor hoe je het opent.

### Alleen-kanaallogs

Gebruik het volgende om kanaalactiviteit (WhatsApp/Telegram/enz.) te filteren:

```bash
openclaw channels logs --channel whatsapp
```

## Logindelingen

### Bestandslogs (JSONL)

Elke regel in het logbestand is een JSON-object. De CLI en Control UI parsen deze
vermeldingen om gestructureerde uitvoer weer te geven (tijd, niveau, subsysteem, bericht).

JSONL-records in bestandslogs bevatten ook machinefilterbare velden op topniveau wanneer
beschikbaar:

- `hostname`: hostnaam van de gateway.
- `message`: afgeplatte logberichttekst voor zoeken in volledige tekst.
- `agent_id`: actieve agent-id wanneer de logaanroep agentcontext bevat.
- `session_id`: actieve sessie-id/sleutel wanneer de logaanroep sessiecontext bevat.
- `channel`: actief kanaal wanneer de logaanroep kanaalcontext bevat.

OpenClaw bewaart de oorspronkelijke gestructureerde logargumenten naast deze velden,
zodat bestaande parsers die genummerde tslog-argumentsleutels lezen blijven werken.

Activiteit voor talk, realtime spraak en beheerde ruimtes geeft begrensde levenscycluslogrecords
uit via dezelfde bestandslogpipeline. Deze records bevatten gebeurtenistype,
modus, transport, provider en grootte-/timingmetingen wanneer beschikbaar, maar laten
transcripttekst, audiopayloads, beurt-id's, oproep-id's en provider-item-id's weg.

### Console-uitvoer

Consolelogs zijn **TTY-bewust** en geformatteerd voor leesbaarheid:

- Subsysteemprefixen (bijv. `gateway/channels/whatsapp`)
- Niveaukleuring (info/warn/error)
- Optionele compacte of JSON-modus

Consoleopmaak wordt beheerd door `logging.consoleStyle`.

### Gateway WebSocket-logs

`openclaw gateway` heeft ook WebSocket-protocollogging voor RPC-verkeer:

- normale modus: alleen interessante resultaten (fouten, parsefouten, trage aanroepen)
- `--verbose`: alle aanvraag-/responsverkeer
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

Je kunt beide overschrijven via de omgevingsvariabele **`OPENCLAW_LOG_LEVEL`** (bijv. `OPENCLAW_LOG_LEVEL=debug`). De omgevingsvariabele heeft voorrang op het configuratiebestand, zodat je de uitgebreidheid voor één run kunt verhogen zonder `openclaw.json` te bewerken. Je kunt ook de globale CLI-optie **`--log-level <level>`** doorgeven (bijvoorbeeld `openclaw --log-level debug gateway run`), die voor die opdracht de omgevingsvariabele overschrijft.

`--verbose` beïnvloedt alleen console-uitvoer en WS-loguitgebreidheid; het wijzigt
bestandslogniveaus niet.

### Gerichte modeltransportdiagnostiek

Gebruik bij het debuggen van provideraanroepen gerichte omgevingsvlaggen in plaats van
alle logs naar `debug` te verhogen:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Beschikbare vlaggen:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: geef start van aanvraag, fetch-respons, SDK-
  headers, eerste streaminggebeurtenis, streamvoltooiing en transportfouten uit op
  `info`-niveau.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: neem een begrensde samenvatting van de aanvraagpayload
  op in modelaanvraaglogs.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: neem alle toolnamen voor het model op in
  de payloadsamenvatting.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: neem een geredigeerde, afgetopte JSON-
  payloadsnapshot op. Gebruik alleen tijdens debuggen; geheimen worden geredigeerd, maar prompts
  en berichttekst kunnen nog aanwezig zijn.
- `OPENCLAW_DEBUG_SSE=events`: geef timing voor eerste gebeurtenis en streamvoltooiing uit.
- `OPENCLAW_DEBUG_SSE=peek`: geef ook de eerste vijf geredigeerde SSE-gebeurtenis-
  payloads uit, afgetopt per gebeurtenis.
- `OPENCLAW_DEBUG_CODE_MODE=1`: geef diagnostiek voor het modeloppervlak in code-modus uit,
  inclusief wanneer native providertools worden verborgen omdat code-modus eigenaar is van het
  tooloppervlak.

Deze vlaggen loggen via normale OpenClaw-logging, dus `openclaw logs --follow`
en het tabblad Logs van de Control UI tonen ze. Zonder de vlaggen blijft dezelfde diagnostiek
beschikbaar op `debug`-niveau.

Start- en responsmetadata van `[model-fetch]` (provider, API, model, status,
latentie en aanvraagvelden zoals methode, URL, time-out, proxy en beleid)
wordt altijd op `info`-niveau uitgegeven, ongeacht
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, zodat basishygiëne voor modeltransport zichtbaar is
zonder debugvlaggen.

### Trace-correlatie

Bestandslogs zijn JSONL. Wanneer een logaanroep een geldige diagnostische tracecontext bevat,
schrijft OpenClaw de tracevelden als JSON-sleutels op topniveau (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), zodat externe logprocessors de regel kunnen correleren
met OTEL-spans en provider-`traceparent`-propagatie.

Gateway-HTTP-aanvragen en Gateway WebSocket-frames leggen een interne aanvraag-
tracescope vast. Logs en diagnostische gebeurtenissen die binnen die async-scope worden uitgegeven, erven
de aanvraagtrace wanneer ze geen expliciete tracecontext doorgeven. Agent-run- en
modelaanroeptraces worden children van de actieve aanvraagtrace, zodat lokale logs,
diagnostische snapshots, OTEL-spans en vertrouwde provider-`traceparent`-headers kunnen
worden gekoppeld via `traceId` zonder ruwe aanvraag- of modelinhoud te loggen.

Talk-levenscycluslogrecords stromen ook naar diagnostics-otel-logexport wanneer
OpenTelemetry-logexport is ingeschakeld, met dezelfde begrensde attributen als bestandslogs.
Configureer `diagnostics.otel.logsExporter` om OTLP, stdout JSONL of
beide sinks te kiezen.

### Grootte en timing van modelaanroepen

Modelaanroepdiagnostiek registreert begrensde aanvraag-/responsmetingen zonder
ruwe prompt- of responsinhoud vast te leggen:

- `requestPayloadBytes`: UTF-8-bytegrootte van de uiteindelijke modelaanvraagpayload
- `responseStreamBytes`: UTF-8-bytegrootte van gestreamde modelresponschunk-
  payloads. Hoogfrequente tekst-, denk- en tool-call-deltagebeurtenissen tellen
  alleen de incrementele `delta`-bytes in plaats van volledige `partial`-snapshots.
- `timeToFirstByteMs`: verstreken tijd vóór de eerste gestreamde responsgebeurtenis
- `durationMs`: totale duur van de modelaanroep

Deze velden zijn beschikbaar voor diagnostische snapshots, Plugin-hooks voor modelaanroepen en
OTEL-modelaanroep-spans/-metrics wanneer diagnostiekexport is ingeschakeld.

### Consolestijlen

`logging.consoleStyle`:

- `pretty`: mensvriendelijk, gekleurd, met tijdstempels.
- `compact`: compactere uitvoer (beste voor lange sessies).
- `json`: JSON per regel (voor logprocessors).

### Redactie

OpenClaw kan gevoelige tokens redigeren voordat ze terechtkomen in console-uitvoer, bestandslogs,
OTLP-logrecords, vastgelegde sessietranscripttekst of Control UI-tool-
gebeurtenispayloads (toolstartargumenten, gedeeltelijke/uiteindelijke resultaatpayloads, afgeleide
exec-uitvoer en patchsamenvattingen):

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: lijst met regex-strings om de standaardset te overschrijven. Aangepaste patronen worden bovenop de ingebouwde defaults toegepast voor Control UI-toolpayloads, dus het toevoegen van een patroon verzwakt nooit de redactie van waarden die al door de defaults worden gevangen.

Bestandslogs en sessietranscripten blijven JSONL, maar overeenkomende geheime waarden worden
gemaskeerd voordat de regel of het bericht naar schijf wordt geschreven. Redactie is best-effort:
het geldt voor tekstdragende berichtinhoud en logstrings, niet voor elk
identifier- of binair payloadveld.

De ingebouwde defaults dekken veelvoorkomende API-referenties en veldnamen voor betaalreferenties,
zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betaalreferentie
wanneer ze verschijnen als JSON-velden, URL-parameters, CLI-vlaggen of toewijzingen.

`logging.redactSensitive: "off"` schakelt alleen dit algemene log-/transcript-
beleid uit. OpenClaw redigeert nog steeds payloads aan veiligheidsgrenzen die aan UI-
clients, supportbundels, diagnostische observers, goedkeuringsprompts of agent-
tools kunnen worden getoond. Voorbeelden zijn Control UI-tool-call-gebeurtenissen, `sessions_history`-uitvoer,
diagnostische supportexports, providerfoutobservaties, weergave van exec-goedkeuringsopdrachten
en Gateway WebSocket-protocollogs. Aangepaste `logging.redactPatterns`
kunnen nog steeds projectspecifieke patronen toevoegen op die oppervlakken.

## Diagnostiek en OpenTelemetry

Diagnostiek bestaat uit gestructureerde, machineleesbare gebeurtenissen voor modelruns en
telemetrie van berichtstromen (webhooks, wachtrijen, sessiestatus). Ze vervangen logs **niet**:
ze voeden metrics, traces en exporters. Gebeurtenissen worden in-process uitgegeven,
ongeacht of je ze exporteert.

Twee aangrenzende oppervlakken:

- **OpenTelemetry-export** — stuur metrics, traces en logs via OTLP/HTTP naar
  elke OpenTelemetry-compatibele collector of backend (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, enz.). Volledige configuratie, signaalcatalogus,
  metric-/spannamen, env-vars en privacymodel staan op een aparte pagina:
  [OpenTelemetry-export](/nl/gateway/opentelemetry).
- **Diagnostiekvlaggen** — gerichte debuglogvlaggen die extra logs routeren naar
  `logging.file` zonder `logging.level` te verhogen. Vlaggen zijn hoofdletterongevoelig
  en ondersteunen jokertekens (`telegram.*`, `*`). Configureer onder `diagnostics.flags`
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
- **Logs leeg?** Controleer of de Gateway actief is en schrijft naar het bestandspad
  in `logging.file`.
- **Meer details nodig?** Stel `logging.level` in op `debug` of `trace` en probeer het opnieuw.

## Gerelateerd

- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP/HTTP-export, catalogus met metrics/spans, privacymodel
- [Diagnostische vlaggen](/nl/diagnostics/flags) — gerichte vlaggen voor debuglogs
- [Interne werking van Gateway-logging](/nl/gateway/logging) — WS-logstijlen, subsystem-prefixes en consolevastlegging
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige referentie voor `diagnostics.*`-velden
