---
read_when:
    - Je hebt een beginnersvriendelijk overzicht van OpenClaw-logging nodig
    - U wilt logniveaus, indelingen of maskering configureren
    - Je lost problemen op en moet snel logs vinden
summary: Bestandslogs, console-uitvoer, volgen via de CLI en het tabblad Logboeken van de bedieningsinterface
title: Logboekregistratie
x-i18n:
    generated_at: "2026-05-11T20:37:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw heeft twee hoofdoppervlakken voor logs:

- **Bestandslogs** (JSON-regels) die door de Gateway worden geschreven.
- **Console-uitvoer** die wordt getoond in terminals en de Gateway Debug UI.

Het tabblad **Logs** in de Control UI volgt het gatewaybestandslog live. Deze pagina legt uit waar
logs staan, hoe je ze leest en hoe je logniveaus en -indelingen configureert.

## Waar logs staan

Standaard schrijft de Gateway een roterend logbestand onder:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

De datum gebruikt de lokale tijdzone van de gatewayhost.

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

Gebruik de CLI om het gatewaylogbestand via RPC live te volgen:

```bash
openclaw logs --follow
```

Nuttige huidige opties:

- `--local-time`: geef tijdstempels weer in je lokale tijdzone
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standaard Gateway-RPC-vlaggen
- `--expect-final`: wachtvlag voor de uiteindelijke RPC-respons met agentondersteuning (hier geaccepteerd via de gedeelde clientlaag)

Uitvoermodi:

- **TTY-sessies**: nette, gekleurde, gestructureerde logregels.
- **Niet-TTY-sessies**: platte tekst.
- `--json`: regelgescheiden JSON (één loggebeurtenis per regel).
- `--plain`: forceer platte tekst in TTY-sessies.
- `--no-color`: schakel ANSI-kleuren uit.

Wanneer je een expliciete `--url` doorgeeft, past de CLI config of
omgevingsreferenties niet automatisch toe; voeg zelf `--token` toe als de doel-Gateway
auth vereist.

In JSON-modus geeft de CLI objecten uit met een `type`-tag:

- `meta`: streammetadata (bestand, cursor, grootte)
- `log`: geparseerde logvermelding
- `notice`: hints voor afkapping / rotatie
- `raw`: ongeparseerde logregel

Als de impliciete local loopback-Gateway om koppeling vraagt, sluit tijdens het verbinden,
of een time-out krijgt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het
geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze fallback niet.

Als de Gateway niet bereikbaar is, toont de CLI een korte hint om dit uit te voeren:

```bash
openclaw doctor
```

### Control UI (web)

Het tabblad **Logs** van de Control UI volgt hetzelfde bestand met `logs.tail`.
Zie [Control UI](/nl/web/control-ui) voor hoe je het opent.

### Alleen-kanaallogs

Gebruik dit om kanaalactiviteit te filteren (WhatsApp/Telegram/enz.):

```bash
openclaw channels logs --channel whatsapp
```

## Logindelingen

### Bestandslogs (JSONL)

Elke regel in het logbestand is een JSON-object. De CLI en Control UI parseren deze
vermeldingen om gestructureerde uitvoer weer te geven (tijd, niveau, subsysteem, bericht).

JSONL-records van bestandslogs bevatten ook machinefilterbare topniveauvelden wanneer
beschikbaar:

- `hostname`: gatewayhostnaam.
- `message`: afgeplatte logberichttekst voor volledige-tekstzoekopdrachten.
- `agent_id`: actieve agent-id wanneer de logaanroep agentcontext bevat.
- `session_id`: actieve sessie-id/sleutel wanneer de logaanroep sessiecontext bevat.
- `channel`: actief kanaal wanneer de logaanroep kanaalcontext bevat.

OpenClaw behoudt de oorspronkelijke gestructureerde logargumenten naast deze velden
zodat bestaande parsers die genummerde tslog-argumentsleutels lezen blijven werken.

Activiteit voor praten, realtime spraak en beheerde kamers geeft begrensde levenscycluslogrecords
uit via dezelfde pijplijn voor bestandslogs. Deze records bevatten gebeurtenistype,
modus, transport, provider en metingen voor grootte/timing wanneer beschikbaar, maar laten
transcripttekst, audiopayloads, beurt-id's, gespreks-id's en provider-item-id's weg.

### Console-uitvoer

Consolelogs zijn **TTY-bewust** en geformatteerd voor leesbaarheid:

- Subsysteemprefixen (bijv. `gateway/channels/whatsapp`)
- Niveaukleuren (info/warn/error)
- Optionele compacte of JSON-modus

Consoleopmaak wordt beheerd door `logging.consoleStyle`.

### Gateway WebSocket-logs

`openclaw gateway` heeft ook WebSocket-protocollogging voor RPC-verkeer:

- normale modus: alleen interessante resultaten (fouten, parsefouten, trage aanroepen)
- `--verbose`: al het request-/responseverkeer
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
- `logging.consoleLevel`: verbositeitsniveau voor de **console**.

Je kunt beide overschrijven via de omgevingsvariabele **`OPENCLAW_LOG_LEVEL`** (bijv. `OPENCLAW_LOG_LEVEL=debug`). De omgevingsvariabele heeft voorrang op het configuratiebestand, zodat je de verbositeit voor één uitvoering kunt verhogen zonder `openclaw.json` te bewerken. Je kunt ook de globale CLI-optie **`--log-level <level>`** doorgeven (bijvoorbeeld `openclaw --log-level debug gateway run`), die de omgevingsvariabele voor die opdracht overschrijft.

`--verbose` beïnvloedt alleen console-uitvoer en WS-logverbositeit; het verandert
bestandslogniveaus niet.

### Gerichte diagnostiek voor modeltransport

Gebruik bij het debuggen van provideraanroepen gerichte omgevingsvlaggen in plaats van
alle logs naar `debug` te verhogen:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Beschikbare vlaggen:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: geef requeststart, fetch-response, SDK-
  headers, eerste streaminggebeurtenis, streamvoltooiing en transportfouten uit op
  `info`-niveau.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: neem een begrensde samenvatting van de requestpayload
  op in modelrequestlogs.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: neem alle op het model gerichte toolnamen op in
  de payloadsamenvatting.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: neem een geredigeerde, begrensde JSON-
  payloadsnapshot op. Gebruik alleen tijdens debuggen; geheimen worden geredigeerd, maar prompts
  en berichttekst kunnen nog aanwezig zijn.
- `OPENCLAW_DEBUG_SSE=events`: geef timing van eerste gebeurtenis en streamvoltooiing uit.
- `OPENCLAW_DEBUG_SSE=peek`: geef ook de eerste vijf geredigeerde SSE-gebeurtenis-
  payloads uit, begrensd per gebeurtenis.
- `OPENCLAW_DEBUG_CODE_MODE=1`: geef diagnostiek voor het modeloppervlak in codemodus uit,
  inclusief wanneer native providertools verborgen zijn omdat codemodus het
  tooloppervlak bezit.

Deze vlaggen loggen via normale OpenClaw-logging, dus `openclaw logs --follow`
en het tabblad Logs in de Control UI tonen ze. Zonder de vlaggen blijft dezelfde diagnostiek
beschikbaar op `debug`-niveau.

### Tracecorrelatie

Bestandslogs zijn JSONL. Wanneer een logaanroep een geldige diagnostische tracecontext bevat,
schrijft OpenClaw de tracevelden als topniveau-JSON-sleutels (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) zodat externe logverwerkers de regel kunnen correleren
met OTEL-spans en provider-`traceparent`-propagatie.

Gateway-HTTP-requests en Gateway WebSocket-frames stellen een interne request-
tracescope in. Logs en diagnostische gebeurtenissen die binnen die asyncscope worden uitgegeven erven
de requesttrace wanneer ze geen expliciete tracecontext doorgeven. Agentrun- en
modelaanroeptraces worden kinderen van de actieve requesttrace, zodat lokale logs,
diagnostische snapshots, OTEL-spans en vertrouwde provider-`traceparent`-headers kunnen
worden samengevoegd op `traceId` zonder rauwe request- of modelinhoud te loggen.

Logrecords voor de praatlevenscyclus stromen ook naar OTLP-logs wanneer OpenTelemetry-logexport
is ingeschakeld, met dezelfde begrensde attributen als bestandslogs.

### Grootte en timing van modelaanroepen

Diagnostiek voor modelaanroepen registreert begrensde request-/responsemetingen zonder
rauwe prompt- of responsinhoud vast te leggen:

- `requestPayloadBytes`: UTF-8-bytegrootte van de uiteindelijke modelrequestpayload
- `responseStreamBytes`: UTF-8-bytegrootte van gestreamde modelresponsgebeurtenissen
- `timeToFirstByteMs`: verstreken tijd vóór de eerste gestreamde responsgebeurtenis
- `durationMs`: totale duur van de modelaanroep

Deze velden zijn beschikbaar voor diagnostische snapshots, modelaanroep-Plugin-hooks en
OTEL-spans/-metrics voor modelaanroepen wanneer diagnostiekexport is ingeschakeld.

### Consolestijlen

`logging.consoleStyle`:

- `pretty`: gebruiksvriendelijk, gekleurd, met tijdstempels.
- `compact`: compactere uitvoer (het beste voor lange sessies).
- `json`: JSON per regel (voor logverwerkers).

### Redactie

OpenClaw kan gevoelige tokens redigeren voordat ze in console-uitvoer, bestandslogs,
OTLP-logrecords, opgeslagen sessietranscripttekst of toolgebeurtenispayloads in de Control UI
terechtkomen (toolstartargumenten, gedeeltelijke/uiteindelijke resultaatpayloads, afgeleide
exec-uitvoer en patchsamenvattingen):

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: lijst met regexstrings om de standaardset te overschrijven. Aangepaste patronen worden bovenop de ingebouwde standaarden voor toolpayloads in de Control UI toegepast, dus het toevoegen van een patroon verzwakt nooit de redactie van waarden die al door de standaarden worden gevonden.

Bestandslogs en sessietranscripten blijven JSONL, maar overeenkomende geheime waarden worden
gemaskeerd voordat de regel of het bericht naar schijf wordt geschreven. Redactie is best-effort:
ze wordt toegepast op berichtinhoud met tekst en logstrings, niet op elk
identifier- of binaire payloadveld.

De ingebouwde standaarden dekken gangbare API-referenties en veldnamen voor betaalreferenties
zoals kaartnummer, CVC/CVV, gedeeld betaaltoken en betaalreferentie
wanneer ze verschijnen als JSON-velden, URL-parameters, CLI-vlaggen of toewijzingen.

`logging.redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit.
OpenClaw redigeert nog steeds payloads aan veiligheidsgrenzen die kunnen worden getoond aan UI-
clients, supportbundels, diagnostiekwaarnemers, goedkeuringsprompts of agent-
tools. Voorbeelden zijn toolaanroepgebeurtenissen in de Control UI, `sessions_history`-uitvoer,
diagnostische supportexports, providerfoutobservaties, exec-goedkeuringsopdrachtweergave
en Gateway WebSocket-protocollogs. Aangepaste `logging.redactPatterns`
kunnen nog steeds projectspecifieke patronen toevoegen op die oppervlakken.

## Diagnostiek en OpenTelemetry

Diagnostiek bestaat uit gestructureerde, machineleesbare gebeurtenissen voor modelruns en
telemetrie van berichtstromen (webhooks, wachtrijen, sessiestatus). Ze vervangen logs **niet**
— ze voeden metrics, traces en exporters. Gebeurtenissen worden in-process uitgegeven
ongeacht of je ze exporteert.

Twee aangrenzende oppervlakken:

- **OpenTelemetry-export** — stuur metrics, traces en logs via OTLP/HTTP naar
  elke OpenTelemetry-compatibele collector of backend (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, enz.). Volledige configuratie, signaalcatalogus,
  metric-/spannamen, omgevingsvariabelen en privacymodel staan op een aparte pagina:
  [OpenTelemetry-export](/nl/gateway/opentelemetry).
- **Diagnostiekvlaggen** — gerichte debuglogvlaggen die extra logs naar
  `logging.file` routeren zonder `logging.level` te verhogen. Vlaggen zijn niet hoofdlettergevoelig
  en ondersteunen jokertekens (`telegram.*`, `*`). Configureer onder `diagnostics.flags`
  of via de omgevingsoverschrijving `OPENCLAW_DIAGNOSTICS=...`. Volledige gids:
  [Diagnostiekvlaggen](/nl/diagnostics/flags).

Om diagnostiekgebeurtenissen voor Plugins of aangepaste sinks in te schakelen zonder OTLP-export:

```json5
{
  diagnostics: { enabled: true },
}
```

Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor OTLP-export naar een collector.

## Tips voor probleemoplossing

- **Gateway niet bereikbaar?** Voer eerst `openclaw doctor` uit.
- **Logs leeg?** Controleer of de Gateway draait en naar het bestandspad
  in `logging.file` schrijft.
- **Meer detail nodig?** Stel `logging.level` in op `debug` of `trace` en probeer het opnieuw.

## Gerelateerd

- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP/HTTP-export, catalogus met metrics/spans, privacymodel
- [Diagnostiekvlaggen](/nl/diagnostics/flags) — gerichte debuglogvlaggen
- [Interne Gateway-logging](/nl/gateway/logging) — WS-logstijlen, subsysteemprefixen en consolevastlegging
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige veldreferentie voor `diagnostics.*`
