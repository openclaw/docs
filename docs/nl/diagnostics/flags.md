---
read_when:
    - U hebt gerichte foutopsporingslogboeken nodig zonder de algemene logboekniveaus te verhogen
    - U moet subsysteemspecifieke logboeken vastleggen voor ondersteuning
summary: Diagnostische vlaggen voor gerichte foutopsporingslogboeken
title: Diagnostische vlaggen
x-i18n:
    generated_at: "2026-07-12T08:48:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Diagnostische vlaggen schakelen extra logboekregistratie voor één subsysteem in zonder
`logging.level` globaal te verhogen. Een vlag heeft geen effect tenzij een subsysteem deze controleert.

## Hoe het werkt

- Vlaggen zijn hoofdletterongevoelige tekenreeksen, bepaald op basis van `diagnostics.flags` in
  de configuratie plus de omgevingsvariabele `OPENCLAW_DIAGNOSTICS`, waarna duplicaten worden verwijderd en alles naar kleine letters wordt omgezet.
- `name.*` komt overeen met `name` zelf en alles onder `name.` (bijvoorbeeld
  `telegram.*` komt overeen met `telegram.http`).
- `*` of `all` schakelt elke vlag in.
- Start de Gateway opnieuw nadat u `diagnostics.flags` in de configuratie hebt gewijzigd; deze instelling wordt niet
  dynamisch herladen.

## Bekende vlaggen

| Vlag             | Schakelt in                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `telegram.http`  | Logboekregistratie van HTTP-fouten van de Telegram Bot API        |
| `brave.http`     | Logboekregistratie van verzoeken, antwoorden en cache van Brave Search |
| `profiler`       | Profiler voor de antwoordfase en Codex-appserverprofiler (beide)  |
| `reply.profiler` | Alleen de profiler voor de antwoordfase                           |
| `codex.profiler` | Alleen de Codex-appserverprofiler                                 |
| `timeline`       | Gestructureerd JSONL-tijdlijnartefact (zie hieronder)             |

## Inschakelen via configuratie

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Meerdere vlaggen:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Overschrijven via omgevingsvariabele (eenmalig)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Waarden worden gesplitst op komma's of witruimte. Speciale waarden:

| Waarde                      | Effect                                                      |
| --------------------------- | ----------------------------------------------------------- |
| `0`, `false`, `off`, `none` | Schakelt alle vlaggen uit en overschrijft ook de configuratie |
| `1`, `true`, `all`, `*`     | Schakelt elke vlag in                                       |

`OPENCLAW_DIAGNOSTICS=0` schakelt voor dat proces vlaggen uit zowel de omgevingsvariabele als de configuratie uit.
Dit is handig om tijdelijk een in de configuratie ingeschakelde profilervlag te onderdrukken
zonder het bestand te bewerken.

## Profilervlaggen

Profilervlaggen beheren lichtgewicht tijdmetingen; wanneer ze uitgeschakeld zijn, veroorzaken ze geen overhead.

Schakel alle door de profiler beheerde tijdmetingen in voor één Gateway-uitvoering:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Schakel alleen profiler-tijdmetingen voor antwoorddistributie in:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Schakel alleen profiler-tijdmetingen voor opstarten, tools en threads van de Codex-appserver in:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` schakelt zowel de antwoordprofiler als de Codex-profiler in; gebruik de
specifieke vlagnamen om er slechts één in te schakelen.

Of stel dit in de configuratie in:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Start de Gateway opnieuw nadat u configuratievlaggen hebt gewijzigd. Om een profilervlag uit te schakelen,
verwijdert u deze uit `diagnostics.flags` en start u opnieuw, of start u het proces met
`OPENCLAW_DIAGNOSTICS=0` om elke diagnostische vlag voor die uitvoering te overschrijven.

## Tijdlijnartefacten

De vlag `timeline` (alias: `diagnostics.timeline`) schrijft gestructureerde gebeurtenissen voor
opstart- en uitvoeringstijdmetingen als JSONL voor externe QA-testomgevingen:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Of schakel deze in de configuratie in:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Het uitvoerpad komt altijd uit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, zelfs
wanneer de vlag zelf in de configuratie is ingesteld; er is geen configuratiesleutel voor het pad.
Wanneer `timeline` alleen via de configuratie is ingeschakeld, ontbreken de vroegste tijdmetingen
voor het laden van de configuratie, omdat OpenClaw de configuratie dan nog niet heeft gelezen; latere opstarttijdmetingen
worden normaal vastgelegd.

`OPENCLAW_DIAGNOSTICS=1`, `=all` en `=*` schakelen ook de tijdlijn in, omdat ze
elke vlag inschakelen. Gebruik bij voorkeur de specifieke vlag `timeline` wanneer u alleen het
JSONL-artefact wilt en niet alle andere diagnostische vlaggen.

Metingen van de event-loopvertraging in de tijdlijn vereisen naast
`timeline` nog een extra expliciete inschakeling: stel `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (of `on`/`true`/`yes`) in
naast het inschakelen van de tijdlijn.

Tijdlijnrecords gebruiken de envelop `openclaw.diagnostics.v1` en kunnen
proces-ID's, fasenamen, namen van tijdmetingen, tijdsduren, Plugin-ID's, aantallen
afhankelijkheden, metingen van event-loopvertraging, namen van providerbewerkingen, afsluitstatussen
van subprocessen en namen/berichten van opstartfouten bevatten. Behandel tijdlijnbestanden als lokale
diagnostische artefacten; controleer ze voordat u ze buiten uw computer deelt.

## Waar logboeken worden opgeslagen

Vlaggen schrijven logboekvermeldingen naar het standaardbestand voor diagnostische logboeken. Standaard:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Als u `logging.file` instelt, wordt in plaats daarvan dat pad gebruikt. Logboeken zijn in JSONL-indeling (één JSON-
object per regel). Redactie wordt nog steeds toegepast op basis van `logging.redactSensitive`.
Zie [Logboekregistratie](/nl/logging) voor het volledige model voor padbepaling, rotatie en
redactie van logboeken.

## Logboeken extraheren

Selecteer het nieuwste logbestand:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filter op HTTP-diagnostiek van Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filter op HTTP-diagnostiek van Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Of volg het logboek tijdens het reproduceren:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Gebruik voor externe Gateways in plaats daarvan `openclaw logs --follow` (zie
[/cli/logs](/nl/cli/logs)).

## Opmerkingen

- Als `logging.level` hoger is ingesteld dan `warn`, kunnen door vlaggen beheerde logboekvermeldingen worden
  onderdrukt. De standaardwaarde `info` is geschikt.
- `brave.http` registreert verzoek-URL's/queryparameters van Brave Search, de
  antwoordstatus/-timing en gebeurtenissen voor cachetreffers, cachemissers en cacheschrijfacties. De API-sleutel
  (die als verzoekheader wordt verzonden) en antwoordteksten worden niet geregistreerd, maar zoekopdrachten kunnen
  gevoelig zijn.
- Vlaggen kunnen veilig ingeschakeld blijven; ze beïnvloeden alleen het logboekvolume voor het
  specifieke subsysteem.
- Gebruik [/logging](/nl/logging) om logboekbestemmingen, niveaus en redactie te wijzigen.

## Gerelateerd

- [Gateway-diagnostiek](/nl/gateway/diagnostics)
- [Probleemoplossing voor de Gateway](/nl/gateway/troubleshooting)
