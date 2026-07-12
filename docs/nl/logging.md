---
read_when:
    - Je hebt een beginnersvriendelijk overzicht van OpenClaw-logboekregistratie nodig
    - U wilt logniveaus, indelingen of redactie configureren
    - Je bent een probleem aan het oplossen en moet snel logboeken vinden
summary: Bestandslogboeken, console-uitvoer, CLI-logstreaming en het tabblad Logs in de Control UI
title: Logboekregistratie
x-i18n:
    generated_at: "2026-07-12T09:04:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw heeft twee belangrijke logoppervlakken:

- **Bestandslogboeken** (JSON-regels) die door de Gateway worden geschreven.
- **Console-uitvoer** in de terminal waarin de Gateway wordt uitgevoerd.

Het tabblad **Logboeken** van de Control UI volgt het gatewaylogbestand. Deze pagina legt uit waar
logboeken worden opgeslagen, hoe u ze leest en hoe u logniveaus en -indelingen configureert.

## Waar logboeken worden opgeslagen

Standaard schrijft de Gateway per dag een doorlopend logbestand:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

De datum gebruikt de lokale tijdzone van de gatewayhost. Wanneer `/tmp/openclaw` onveilig
of niet beschikbaar is (en altijd op Windows), gebruikt OpenClaw in plaats daarvan een gebruikersspecifieke
map `openclaw-<uid>` onder de tijdelijke map van het besturingssysteem. Gedateerde logbestanden worden
na 24 uur verwijderd.

Elk bestand wordt geroteerd wanneer de volgende schrijfactie `logging.maxFileBytes`
zou overschrijden (standaard: 100 MB). OpenClaw bewaart maximaal vijf genummerde archieven naast het
actieve bestand, zoals `openclaw-YYYY-MM-DD.1.log`, en blijft naar een nieuw
actief logbestand schrijven in plaats van diagnostische gegevens te onderdrukken.

U kunt het pad overschrijven in `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Logboeken lezen

### CLI: live volgen (aanbevolen)

Volg het gatewaylogbestand via RPC:

```bash
openclaw logs --follow
```

Opties:

| Vlag                | Standaard | Gedrag                                                                                         |
| ------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `--follow`          | uit       | Blijven volgen; maakt na een verbroken verbinding opnieuw verbinding met toenemende wachttijd |
| `--limit <n>`       | `200`     | Maximumaantal regels per ophaalactie                                                           |
| `--max-bytes <n>`   | `250000`  | Maximumaantal bytes dat per ophaalactie wordt gelezen                                           |
| `--interval <ms>`   | `1000`    | Pollinterval tijdens het volgen                                                                 |
| `--json`            | uit       | JSON per regel (één gebeurtenis per regel)                                                      |
| `--plain`           | uit       | Platte tekst afdwingen in TTY-sessies                                                           |
| `--no-color`        | —         | ANSI-kleuren uitschakelen                                                                       |
| `--utc`             | uit       | Tijdstempels in UTC weergeven (lokale tijd is standaard)                                        |
| `--local-time`      | uit       | Geaccepteerde compatibele spelling voor de standaard lokale tijd; heeft verder geen effect      |
| `--url` / `--token` | —         | Standaard RPC-vlaggen voor de Gateway                                                           |
| `--timeout <ms>`    | `30000`   | RPC-time-out van de Gateway                                                                     |
| `--expect-final`    | uit       | Vlag om bij agentgestuurde RPC op het definitieve antwoord te wachten (hier geaccepteerd via de gedeelde clientlaag) |

Uitvoermodi:

- **TTY-sessies**: fraai opgemaakte, gekleurde, gestructureerde logregels.
- **Niet-TTY-sessies**: platte tekst.

Wanneer u expliciet een `--url` opgeeft, past de CLI configuratie- of
omgevingsreferenties niet automatisch toe; geef zelf `--token` op, anders mislukt
de aanroep met `gateway url override requires explicit credentials`.

In de JSON-modus voert de CLI objecten met een `type`-label uit:

- `meta`: metagegevens van de stroom (bestand, bron, brontype, service, cursor, grootte)
- `log`: geparseerd logitem
- `notice`: aanwijzingen voor afkapping/rotatie
- `raw`: niet-geparseerde logregel
- `error`: verbindingsfouten met de gateway (naar stderr geschreven)

Als de impliciete Gateway op local loopback om koppeling vraagt, tijdens het verbinden
wordt gesloten of een time-out optreedt voordat `logs.tail` antwoordt, valt `openclaw logs`
automatisch terug op het geconfigureerde gatewaylogbestand. Expliciete `--url`-doelen gebruiken
deze terugval niet. `openclaw logs --follow` is strikter: op Linux gebruikt het, indien beschikbaar,
het actieve user-systemd Gateway-journaal op basis van PID, en anders probeert het de
live Gateway opnieuw met toenemende wachttijd in plaats van een mogelijk verouderd naastliggend
bestand te volgen.

Als de Gateway niet bereikbaar is, toont de CLI een korte aanwijzing om het volgende uit te voeren:

```bash
openclaw doctor
```

### Control UI (web)

Het tabblad **Logboeken** van de Control UI volgt hetzelfde bestand met `logs.tail`.
Zie [Control UI](/nl/web/control-ui) voor informatie over hoe u dit opent.

### Alleen kanaallogboeken

Gebruik het volgende om kanaalactiviteit (WhatsApp/Telegram/enzovoort) te filteren:

```bash
openclaw channels logs --channel whatsapp
```

`--channel` is standaard `all`; `--lines <n>` (standaard 200) en `--json` zijn ook
beschikbaar.

## Logindelingen

### Bestandslogboeken (JSONL)

Elke regel in het logbestand is een JSON-object. De CLI en Control UI parseren deze
items om gestructureerde uitvoer weer te geven (tijd, niveau, subsysteem, bericht).

JSONL-records in bestandslogboeken bevatten, indien beschikbaar, ook op machineniveau
filterbare velden op het hoogste niveau:

- `hostname`: hostnaam van de gateway.
- `message`: samengevoegde tekst van het logbericht voor zoeken in volledige tekst.
- `agent_id`: id van de actieve agent wanneer de logaanroep agentcontext bevat.
- `session_id`: id/sleutel van de actieve sessie wanneer de logaanroep sessiecontext bevat.
- `channel`: actief kanaal wanneer de logaanroep kanaalcontext bevat.

OpenClaw bewaart naast deze velden de oorspronkelijke gestructureerde logargumenten,
zodat bestaande parsers die genummerde tslog-argumentsleutels lezen blijven werken.

Activiteit voor gesprekken, realtime spraak en beheerde ruimten genereert begrensde
levenscycluslogrecords via dezelfde pijplijn voor bestandslogboeken. Deze records bevatten,
indien beschikbaar, gebeurtenistype, modus, transport, provider en metingen van grootte/timing,
maar laten transcriptietekst, audiopayloads, beurt-id's, oproep-id's en item-id's van providers weg.

### Console-uitvoer

Consolelogboeken zijn **TTY-bewust** en opgemaakt voor leesbaarheid:

- Voorvoegsels voor subsystemen (bijvoorbeeld `gateway/channels/whatsapp`)
- Kleuren per niveau (info/warn/error)
- Optionele compacte modus of JSON-modus

De consoleopmaak wordt beheerd door `logging.consoleStyle`.

### WebSocket-logboeken van de Gateway

`openclaw gateway` heeft ook WebSocket-protocollogboekregistratie voor RPC-verkeer:

- normale modus: alleen relevante resultaten (fouten, parseerfouten, trage aanroepen)
- `--verbose`: al het aanvraag-/antwoordverkeer
- `--ws-log auto|compact|full`: kies de uitgebreide weergavestijl
- `--compact`: alias voor `--ws-log compact`

Voorbeelden:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Logboekregistratie configureren

Alle configuratie voor logboekregistratie bevindt zich onder `logging` in `~/.openclaw/openclaw.json`.

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

Niveaus: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: niveau voor **bestandslogboeken** (JSONL) (standaard: `info`).
- `logging.consoleLevel`: detailniveau van de **console**.

U kunt beide overschrijven via de omgevingsvariabele **`OPENCLAW_LOG_LEVEL`** (bijvoorbeeld `OPENCLAW_LOG_LEVEL=debug`). De omgevingsvariabele heeft voorrang op het configuratiebestand, zodat u het detailniveau voor één uitvoering kunt verhogen zonder `openclaw.json` te bewerken. U kunt ook de algemene CLI-optie **`--log-level <level>`** doorgeven (bijvoorbeeld `openclaw --log-level debug gateway run`), die voor die opdracht de omgevingsvariabele overschrijft.

`--verbose` beïnvloedt alleen de console-uitvoer en het detailniveau van WS-logboeken; het wijzigt
de niveaus van bestandslogboeken niet.

### Gerichte diagnostiek voor modeltransport

Gebruik bij het opsporen van fouten in provideraanroepen gerichte omgevingsvlaggen in plaats van
alle logboeken naar `debug` te verhogen:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Beschikbare vlaggen:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: registreer het begin van de aanvraag, het fetch-antwoord, SDK-
  headers, de eerste streaminggebeurtenis, de voltooiing van de stroom en transportfouten op
  niveau `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: voeg een begrensde samenvatting van de aanvraagpayload
  toe aan logboeken van modelaanvragen.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: neem alle voor het model zichtbare toolnamen op in
  de payloadsamenvatting.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: voeg een geredigeerde, begrensde momentopname van de JSON-
  payload toe. Gebruik dit alleen tijdens foutopsporing; geheimen worden geredigeerd, maar prompts
  en berichttekst kunnen nog steeds aanwezig zijn.
- `OPENCLAW_DEBUG_SSE=events`: registreer timing van de eerste gebeurtenis en de voltooiing van de stroom.
- `OPENCLAW_DEBUG_SSE=peek`: registreer ook de eerste vijf geredigeerde SSE-gebeurtenis-
  payloads, begrensd per gebeurtenis.
- `OPENCLAW_DEBUG_CODE_MODE=1`: registreer diagnostiek voor het modeloppervlak in codemodus,
  inclusief wanneer systeemeigen providertools verborgen zijn omdat de codemodus het
  tooloppervlak beheert.

Deze vlaggen registreren via de normale logboekregistratie van OpenClaw, zodat `openclaw logs --follow`
en het tabblad Logboeken van de Control UI ze tonen. Zonder de vlaggen blijft dezelfde diagnostiek
beschikbaar op niveau `debug`.

Start- en antwoordmetagegevens van `[model-fetch]` (provider, API, model, status,
latentie en aanvraagvelden zoals methode, URL, time-out, proxy en beleid)
worden altijd op niveau `info` geregistreerd, ongeacht
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, zodat elementaire hygiëne van modeltransport zichtbaar is
zonder foutopsporingsvlaggen.

### Trace-correlatie

Bestandslogboeken zijn JSONL. Wanneer een logaanroep een geldige diagnostische tracecontext bevat,
schrijft OpenClaw de tracevelden als JSON-sleutels op het hoogste niveau (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), zodat externe logverwerkers de regel kunnen correleren
met OTEL-spans en de doorgifte van `traceparent` door providers.

HTTP-aanvragen en WebSocket-frames van de Gateway stellen een intern tracebereik voor aanvragen
in. Logboeken en diagnostische gebeurtenissen die binnen dat asynchrone bereik worden gegenereerd,
nemen de aanvraagtrace over wanneer ze geen expliciete tracecontext doorgeven. Traces van agentuitvoeringen
en modelaanroepen worden onderliggende traces van de actieve aanvraagtrace, zodat lokale logboeken,
diagnostische momentopnamen, OTEL-spans en vertrouwde `traceparent`-headers van providers
via `traceId` kunnen worden gekoppeld zonder onbewerkte aanvraag- of modelinhoud te registreren.

Levenscycluslogrecords voor gesprekken worden ook naar diagnostische OTEL-logexport gestuurd wanneer
OpenTelemetry-logexport is ingeschakeld, met dezelfde begrensde attributen als bestandslogboeken.
Configureer `diagnostics.otel.logsExporter` om OTLP, stdout-JSONL of beide
bestemmingen te kiezen.

### Grootte en timing van modelaanroepen

Diagnostiek van modelaanroepen registreert begrensde aanvraag-/antwoordmetingen zonder
onbewerkte prompt- of antwoordinhoud vast te leggen:

- `requestPayloadBytes`: UTF-8-bytegrootte van de uiteindelijke payload van de modelaanvraag
- `responseStreamBytes`: UTF-8-bytegrootte van payloads van gestreamde modelantwoordfragmenten.
  Hoogfrequente tekst-, denk- en toolaanroep-deltagebeurtenissen tellen alleen
  de incrementele `delta`-bytes in plaats van volledige `partial`-momentopnamen.
- `timeToFirstByteMs`: verstreken tijd vóór de eerste gestreamde antwoordgebeurtenis
- `durationMs`: totale duur van de modelaanroep

Deze velden zijn beschikbaar voor diagnostische momentopnamen, Plugin-hooks voor modelaanroepen en
OTEL-spans/-metrieken voor modelaanroepen wanneer diagnostische export is ingeschakeld.

### Consolestijlen

`logging.consoleStyle`:

- `pretty`: mensvriendelijk, gekleurd en met tijdstempels.
- `compact`: compactere uitvoer (het meest geschikt voor lange sessies).
- `json`: JSON per regel (voor logverwerkers).

### Redactie

OpenClaw kan gevoelige tokens redigeren voordat ze terechtkomen in console-uitvoer, bestandslogboeken,
OTLP-logrecords, opgeslagen tekst van sessietranscripten of toolgebeurtenispayloads
van de Control UI (argumenten bij het starten van tools, gedeeltelijke/definitieve resultaatpayloads, afgeleide
exec-uitvoer en patchsamenvattingen):

- `logging.redactSensitive`: `off` | `tools` (standaard: `tools`)
- `logging.redactPatterns`: lijst met regex-tekenreeksen die de standaardset voor logboek-/transcriptuitvoer vervangt. Voor toolpayloads van de Control UI worden aangepaste patronen boven op de ingebouwde standaardpatronen toegepast, zodat het toevoegen van een patroon de redactie van waarden die al door de standaardpatronen worden gedetecteerd nooit verzwakt.

Bestandslogboeken en sessietranscripten blijven JSONL, maar overeenkomende geheime waarden worden
gemaskeerd voordat de regel of het bericht naar schijf wordt geschreven. Redactie gebeurt naar beste vermogen:
ze wordt toegepast op berichtinhoud met tekst en logtekenreeksen, niet op elk
identificatie- of binair payloadveld.

De ingebouwde standaardinstellingen omvatten veelgebruikte API-referenties en veldnamen voor betalingsreferenties, zoals kaartnummer, CVC/CVV, gedeeld betalingstoken en betalingsreferentie, wanneer deze voorkomen als JSON-velden, URL-parameters, CLI-vlaggen of toewijzingen.

`logging.redactSensitive: "off"` schakelt alleen dit algemene beleid voor logboeken/transcripten uit. OpenClaw anonimiseert nog steeds payloads op veiligheidsgrenzen die kunnen worden weergegeven aan UI-clients, ondersteuningsbundels, diagnostische waarnemers, goedkeuringsprompts of agenttools. Voorbeelden zijn toolaanroepgebeurtenissen van de Control UI, uitvoer van `sessions_history`, diagnostische ondersteuningsexports, waarnemingen van providerfouten, de weergave van opdrachten voor uitvoeringsgoedkeuring en Gateway WebSocket-protocollogboeken. Aangepaste `logging.redactPatterns` kunnen op die oppervlakken nog steeds projectspecifieke patronen toevoegen.

## Diagnostiek en OpenTelemetry

Diagnostiek bestaat uit gestructureerde, machineleesbare gebeurtenissen voor modeluitvoeringen en telemetrie van berichtstromen (webhooks, wachtrijvorming, sessiestatus). Deze vervangen logboeken **niet** — ze voeden metrische gegevens, traces en exporteurs. Gebeurtenissen worden standaard binnen het proces uitgezonden (stel `diagnostics.enabled: false` in om ze uit te schakelen); het exporteren ervan staat daar los van.

Twee aangrenzende oppervlakken:

- **OpenTelemetry-export** — verzend metrische gegevens, traces en logboeken via OTLP/HTTP naar elke met OpenTelemetry compatibele collector of backend (Datadog, Grafana, Honeycomb, New Relic, Tempo, enz.). De volledige configuratie, signaalcatalogus, namen van metrische gegevens/spans, omgevingsvariabelen en het privacymodel staan op een speciale pagina:
  [OpenTelemetry-export](/nl/gateway/opentelemetry).
- **Diagnostiekvlaggen** — gerichte vlaggen voor foutopsporingslogboeken die extra logboeken naar `logging.file` leiden zonder `logging.level` te verhogen. Vlaggen zijn niet hoofdlettergevoelig en ondersteunen jokertekens (`telegram.*`, `*`). Configureer ze onder `diagnostics.flags` of via de omgevingsoverschrijving `OPENCLAW_DIAGNOSTICS=...`. Volledige handleiding:
  [Diagnostiekvlaggen](/nl/diagnostics/flags).

Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor OTLP-export naar een collector.

## Tips voor probleemoplossing

- **Gateway niet bereikbaar?** Voer eerst `openclaw doctor` uit.
- **Logboeken leeg?** Controleer of de Gateway actief is en schrijft naar het bestandspad in `logging.file`.
- **Meer details nodig?** Stel `logging.level` in op `debug` of `trace` en probeer het opnieuw.

## Gerelateerd

- [OpenTelemetry-export](/nl/gateway/opentelemetry) — OTLP/HTTP-export, catalogus van metrische gegevens/spans, privacymodel
- [Diagnostiekvlaggen](/nl/diagnostics/flags) — gerichte vlaggen voor foutopsporingslogboeken
- [Interne werking van Gateway-logboekregistratie](/nl/gateway/logging) — WS-logboekstijlen, voorvoegsels van subsystemen en consolevastlegging
- [Configuratiereferentie](/nl/gateway/configuration-reference#diagnostics) — volledige referentie voor `diagnostics.*`-velden
