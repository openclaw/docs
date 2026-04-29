---
read_when:
    - Je hebt een beginnersvriendelijk overzicht van OpenClaw-logboekregistratie nodig
    - Je wilt logniveaus, indelingen of maskering configureren
    - Je lost problemen op en moet snel logs vinden.
summary: Bestandslogboeken, console-uitvoer, volgen via de CLI en het tabblad Logboeken van de Control UI
title: Logregistratie
x-i18n:
    generated_at: "2026-04-29T22:56:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
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
`openclaw-YYYY-MM-DD.1.log`, en blijft schrijven naar een vers actief log in plaats van
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
- `--expect-final`: wachttijdvlag voor definitieve RPC-reactie met agent-ondersteuning (hier geaccepteerd via de gedeelde clientlaag)

Uitvoermodi:

- **TTY-sessies**: mooie, gekleurde, gestructureerde logregels.
- **Niet-TTY-sessies**: platte tekst.
- `--json`: regelgescheiden JSON (één loggebeurtenis per regel).
- `--plain`: forceer platte tekst in TTY-sessies.
- `--no-color`: schakel ANSI-kleuren uit.

Wanneer je een expliciete `--url` meegeeft, past de CLI configuratie- of
omgevingsreferenties niet automatisch toe; geef zelf `--token` mee als de doel-Gateway
authenticatie vereist.

In JSON-modus geeft de CLI objecten met een `type`-tag uit:

- `meta`: streammetadata (bestand, cursor, grootte)
- `log`: geparseerde logvermelding
- `notice`: hints voor afkapping / rotatie
- `raw`: ongeparseerde logregel

Als de impliciete local loopback Gateway om koppeling vraagt, sluit tijdens het verbinden,
of een timeout krijgt voordat `logs.tail` antwoordt, valt `openclaw logs` automatisch terug op het
geconfigureerde Gateway-bestandslog. Expliciete `--url`-doelen gebruiken deze fallback niet.

Als de Gateway onbereikbaar is, toont de CLI een korte hint om dit uit te voeren:

```bash
openclaw doctor
```

### Control UI (web)

Het tabblad **Logs** van de Control UI volgt hetzelfde bestand met `logs.tail`.
Zie [/web/control-ui](/nl/web/control-ui) voor hoe je dit opent.

### Alleen-kanaallogs

Gebruik dit om kanaalactiviteit (WhatsApp/Telegram/etc.) te filteren:

```bash
openclaw channels logs --channel whatsapp
```

## Logindelingen

### Bestandslogs (JSONL)

Elke regel in het logbestand is een JSON-object. De CLI en Control UI parseren deze
vermeldingen om gestructureerde uitvoer weer te geven (tijd, niveau, subsysteem, bericht).

JSONL-records van bestandslogs bevatten ook machinaal filterbare top-level velden wanneer
beschikbaar:

- `hostname`: hostnaam van de gateway.
- `message`: afgevlakte logberichttekst voor zoeken in volledige tekst.
- `agent_id`: actieve agent-id wanneer de logaanroep agentcontext bevat.
- `session_id`: actieve sessie-id/sleutel wanneer de logaanroep sessiecontext bevat.
- `channel`: actief kanaal wanneer de logaanroep kanaalcontext bevat.

OpenClaw bewaart de oorspronkelijke gestructureerde logargumenten naast deze velden,
zodat bestaande parsers die genummerde tslog-argumentsleutels lezen blijven werken.

### Console-uitvoer

Consolelogs zijn **TTY-bewust** en opgemaakt voor leesbaarheid:

- Subsysteemprefixes (bijv. `gateway/channels/whatsapp`)
- Niveaukleuren (info/warn/error)
- Optionele compacte of JSON-modus

Console-opmaak wordt beheerd door `logging.consoleStyle`.

### Gateway WebSocket-logs

`openclaw gateway` heeft ook WebSocket-protocollogging voor RPC-verkeer:

- normale modus: alleen interessante resultaten (fouten, parseerfouten, trage aanroepen)
- `--verbose`: al het request/response-verkeer
- `--ws-log auto|compact|full`: kies de verbose-weergavestijl
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

Je kunt beide overschrijven via de omgevingsvariabele **`OPENCLAW_LOG_LEVEL`** (bijv. `OPENCLAW_LOG_LEVEL=debug`). De omgevingsvariabele heeft voorrang op het configuratiebestand, zodat je de verbositeit voor één run kunt verhogen zonder `openclaw.json` te bewerken. Je kunt ook de globale CLI-optie **`--log-level <level>`** meegeven (bijvoorbeeld `openclaw --log-level debug gateway run`), die de omgevingsvariabele voor die opdracht overschrijft.

`--verbose` beïnvloedt alleen console-uitvoer en WS-logverbositeit; het wijzigt
bestandslogniveaus niet.

### Trace-correlatie

Bestandslogs zijn JSONL. Wanneer een logaanroep een geldige diagnostische tracecontext bevat,
schrijft OpenClaw de tracevelden als top-level JSON-sleutels (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), zodat externe logprocessors de regel kunnen correleren
met OTEL-spans en provider-`traceparent`-propagatie.

Gateway HTTP-requests en Gateway WebSocket-frames maken een interne request
trace-scope aan. Logs en diagnostische gebeurtenissen die binnen die async scope worden uitgegeven erven
de request-trace wanneer ze geen expliciete tracecontext meegeven. Agent-run- en
modelaanroeptraces worden kinderen van de actieve request-trace, zodat lokale logs,
diagnostische snapshots, OTEL-spans en vertrouwde provider-`traceparent`-headers kunnen
worden gekoppeld via `traceId` zonder ruwe request- of modelinhoud te loggen.

### Grootte en timing van modelaanroepen

Diagnostiek voor modelaanroepen registreert begrensde request/response-metingen zonder
ruwe prompt- of response-inhoud vast te leggen:

- `requestPayloadBytes`: UTF-8-bytegrootte van de definitieve requestpayload voor het model
- `responseStreamBytes`: UTF-8-bytegrootte van gestreamde modelresponse-gebeurtenissen
- `timeToFirstByteMs`: verstreken tijd vóór de eerste gestreamde response-gebeurtenis
- `durationMs`: totale duur van de modelaanroep

Deze velden zijn beschikbaar voor diagnostische snapshots, modelaanroep-Plugin-hooks en
OTEL-spans/metrics voor modelaanroepen wanneer diagnostische export is ingeschakeld.

### Consolestijlen

`logging.consoleStyle`:

- `pretty`: gebruiksvriendelijk, gekleurd, met tijdstempels.
- `compact`: compactere uitvoer (het beste voor lange sessies).
- `json`: JSON per regel (voor logprocessors).

### Redactie

OpenClaw kan gevoelige tokens redigeren voordat ze in console-uitvoer, bestandslogs,
OTLP-logrecords, opgeslagen tekst van sessietranscripten of toolgebeurtenispayloads van de Control UI
terechtkomen (startargumenten van tools, gedeeltelijke/definitieve resultaatpayloads, afgeleide
exec-uitvoer en patchsamenvattingen):

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: lijst met regex-strings om de standaardset te overschrijven. Aangepaste patronen worden toegepast bovenop de ingebouwde standaarden voor toolpayloads van de Control UI, dus het toevoegen van een patroon verzwakt nooit de redactie van waarden die al door de standaarden worden afgevangen.

Bestandslogs en sessietranscripten blijven JSONL, maar overeenkomende geheime waarden worden
gemaskeerd voordat de regel of het bericht naar schijf wordt geschreven. Redactie is beste poging:
het wordt toegepast op tekstdragende berichtinhoud en logstrings, niet op elk
identifier- of binair payloadveld.

`logging.redactSensitive: "off"` schakelt alleen dit algemene beleid voor logs/transcripten
uit. OpenClaw redigeert nog steeds safety-boundary-payloads die aan UI-clients,
supportbundels, diagnostische observers, goedkeuringsprompts of agenttools kunnen worden getoond.
Voorbeelden zijn toolaanroepgebeurtenissen van de Control UI, `sessions_history`-uitvoer,
diagnostische supportexports, providerfoutobservaties, weergave van exec-goedkeuringsopdrachten
en Gateway WebSocket-protocollogs. Aangepaste `logging.redactPatterns`
kunnen nog steeds projectspecifieke patronen toevoegen op die oppervlakken.

## Diagnostiek en OpenTelemetry

Diagnostiek bestaat uit gestructureerde, machinaal leesbare gebeurtenissen voor modelruns en
telemetrie van berichtenstromen (webhooks, wachtrijen, sessiestatus). Ze vervangen logs **niet**:
ze voeden metrics, traces en exporters. Gebeurtenissen worden in-process uitgegeven,
ongeacht of je ze exporteert.

Twee aangrenzende oppervlakken:

- **OpenTelemetry-export** — stuur metrics, traces en logs via OTLP/HTTP naar
  elke OpenTelemetry-compatibele collector of backend (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, enz.). Volledige configuratie, signaalcatalogus,
  metric-/spannamen, omgevingsvariabelen en privacymodel staan op een speciale pagina:
  [OpenTelemetry-export](/nl/gateway/opentelemetry).
- **Diagnostiekvlaggen** — gerichte debug-logvlaggen die extra logs naar
  `logging.file` routeren zonder `logging.level` te verhogen. Vlaggen zijn niet hoofdlettergevoelig
  en ondersteunen jokertekens (`telegram.*`, `*`). Configureer onder `diagnostics.flags`
  of via de `OPENCLAW_DIAGNOSTICS=...`-omgevingsoverschrijving. Volledige gids:
  [Diagnostiekvlaggen](/nl/diagnostics/flags).

Om diagnostische gebeurtenissen voor plugins of aangepaste sinks in te schakelen zonder OTLP-export:

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
- **Meer detail nodig?** Stel `logging.level` in op `debug` of `trace` en probeer opnieuw.

## Gerelateerd

- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP/HTTP-export, metric-/spancatalogus, privacymodel
- [Diagnostiekvlaggen](/nl/diagnostics/flags) — gerichte debug-logvlaggen
- [Interne Gateway-logging](/nl/gateway/logging) — WS-logstijlen, subsysteemprefixes en consolecaptatie
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige `diagnostics.*`-veldreferentie
