---
read_when:
    - Je hebt gerichte debuglogs nodig zonder globale logniveaus te verhogen
    - Je moet subsysteemspecifieke logs vastleggen voor ondersteuning
summary: Diagnostische vlaggen voor gerichte debuglogs
title: Diagnostische vlaggen
x-i18n:
    generated_at: "2026-06-27T17:30:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

Diagnosevlaggen laten je gerichte debuglogs inschakelen zonder overal uitgebreide logging aan te zetten. Vlaggen zijn opt-in en hebben geen effect tenzij een subsysteem ze controleert.

## Hoe het werkt

- Vlaggen zijn strings (niet hoofdlettergevoelig).
- Je kunt vlaggen inschakelen in de configuratie of via een env-override.
- Wildcards worden ondersteund:
  - `telegram.*` matcht met `telegram.http`
  - `*` schakelt alle vlaggen in

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

Start de Gateway opnieuw nadat je vlaggen hebt gewijzigd.

## Env-override (eenmalig)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Alle vlaggen uitschakelen:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` is een uitschakel-override op procesniveau: het schakelt
vlaggen uit zowel env als configuratie uit voor dat proces.

## Profilingvlaggen

Profilervlaggen schakelen gerichte timingspans in zonder de globale
loggingniveaus te verhogen. Ze zijn standaard uitgeschakeld.

Schakel alle profiler-afgeschermde spans in voor één Gateway-run:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Schakel alleen profiler-spans voor reply-dispatch in:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Schakel alleen profiler-spans voor het starten van de Codex app-server, tools en threads in:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Schakel profilervlaggen in vanuit de configuratie:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Start de Gateway opnieuw nadat je configuratievlaggen hebt gewijzigd. Om een profilervlag
uit te schakelen, verwijder je deze uit `diagnostics.flags` en start je opnieuw. Om tijdelijk elke
diagnosevlag uit te schakelen, zelfs wanneer de configuratie profilervlaggen inschakelt, start je het proces met:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Tijdlijnartefacten

De vlag `timeline` schrijft gestructureerde timingevents voor starten en runtime voor
externe QA-harnesses:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Je kunt deze ook inschakelen in de configuratie:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Het bestandspad voor de tijdlijn komt nog steeds uit
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Wanneer `timeline` alleen vanuit
configuratie is ingeschakeld, worden de vroegste spans voor het laden van configuratie niet uitgegeven omdat OpenClaw
de configuratie nog niet heeft gelezen; daaropvolgende startspans gebruiken de configuratievlag.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` en
`OPENCLAW_DIAGNOSTICS=*` schakelen de tijdlijn ook in omdat ze elke
diagnosevlag inschakelen. Gebruik bij voorkeur `timeline` wanneer je alleen het JSONL-timingartefact
wilt.

Tijdlijnrecords gebruiken de envelop `openclaw.diagnostics.v1`. Events kunnen
proces-id's, fasenamen, spannamen, duur, plugin-id's, aantallen afhankelijkheden,
event-loop-vertragingssamples, namen van providerbewerkingen, afsluitstatus van childprocessen
en namen/berichten van startfouten bevatten. Behandel tijdlijnbestanden als lokale diagnoseartefacten;
controleer ze voordat je ze buiten je machine deelt.

## Waar logs naartoe gaan

Vlaggen geven logs uit naar het standaard diagnostische logbestand. Standaard:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Als je `logging.file` instelt, gebruik dan dat pad. Logs zijn JSONL (één JSON-object per regel). Redactie blijft van toepassing op basis van `logging.redactSensitive`.

## Logs extraheren

Kies het nieuwste logbestand:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filter op Telegram HTTP-diagnostiek:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filter op Brave Search HTTP-diagnostiek:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Of volg de logs terwijl je reproduceert:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Voor externe Gateways kun je ook `openclaw logs --follow` gebruiken (zie [/cli/logs](/nl/cli/logs)).

## Opmerkingen

- Als `logging.level` hoger is ingesteld dan `warn`, kunnen deze logs worden onderdrukt. De standaardwaarde `info` is prima.
- `brave.http` logt Brave Search-aanvraag-URL's/queryparameters, responsstatus/timing en events voor cachehit/-miss/-write. Het logt geen API-sleutels of responsbody's, maar zoekquery's kunnen gevoelig zijn.
- Vlaggen kunnen veilig ingeschakeld blijven; ze beïnvloeden alleen het logvolume voor het specifieke subsysteem.
- Gebruik [/logging](/nl/logging) om logbestemmingen, niveaus en redactie te wijzigen.

## Gerelateerd

- [Gateway-diagnostiek](/nl/gateway/diagnostics)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
