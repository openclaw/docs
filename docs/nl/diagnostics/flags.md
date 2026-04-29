---
read_when:
    - Je hebt gerichte debuglogs nodig zonder de globale logniveaus te verhogen
    - U moet subsysteemspecifieke logs vastleggen voor ondersteuning
summary: Diagnosevlaggen voor gerichte debuglogs
title: Diagnosevlaggen
x-i18n:
    generated_at: "2026-04-29T22:42:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

Diagnostische vlaggen laten je gerichte debuglogs inschakelen zonder overal uitgebreide logging aan te zetten. Vlaggen zijn opt-in en hebben geen effect tenzij een subsysteem ze controleert.

## Zo werkt het

- Vlaggen zijn tekenreeksen (niet hoofdlettergevoelig).
- Je kunt vlaggen inschakelen in de configuratie of via een override met een omgevingsvariabele.
- Wildcards worden ondersteund:
  - `telegram.*` komt overeen met `telegram.http`
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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Start de gateway opnieuw nadat je vlaggen hebt gewijzigd.

## Override via omgevingsvariabele (eenmalig)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Alle vlaggen uitschakelen:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Tijdlijnartefacten

De vlag `timeline` schrijft gestructureerde timinggebeurtenissen voor opstart en runtime voor
externe QA-testharnassen:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Je kunt dit ook inschakelen in de configuratie:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Het bestandspad voor de tijdlijn komt nog steeds uit
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Wanneer `timeline` alleen vanuit de
configuratie is ingeschakeld, worden de vroegste spans voor het laden van configuratie niet uitgegeven omdat OpenClaw de
configuratie nog niet heeft gelezen; latere opstartspans gebruiken de configuratievlag.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` en
`OPENCLAW_DIAGNOSTICS=*` schakelen de tijdlijn ook in omdat ze elke
diagnostische vlag inschakelen. Gebruik bij voorkeur `timeline` wanneer je alleen het JSONL-tijdmetingsartefact
wilt.

Tijdlijnrecords gebruiken de envelop `openclaw.diagnostics.v1`. Gebeurtenissen kunnen
proces-id's, fasenamen, spannamen, duur, Plugin-id's, aantallen afhankelijkheden,
voorbeelden van event-loopvertraging, namen van providerbewerkingen, afsluitstatus van childprocessen
en namen/berichten van opstartfouten bevatten. Behandel tijdlijnbestanden als lokale diagnostische
artefacten; controleer ze voordat je ze buiten je machine deelt.

## Waar logs terechtkomen

Vlaggen schrijven logs naar het standaardbestand voor diagnostische logs. Standaard:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Als je `logging.file` instelt, gebruik dan in plaats daarvan dat pad. Logs zijn JSONL (één JSON-object per regel). Redactie blijft van toepassing op basis van `logging.redactSensitive`.

## Logs extraheren

Kies het nieuwste logbestand:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filter op Telegram HTTP-diagnostiek:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Of volg de log terwijl je het probleem reproduceert:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Voor externe gateways kun je ook `openclaw logs --follow` gebruiken (zie [/cli/logs](/nl/cli/logs)).

## Opmerkingen

- Als `logging.level` hoger is ingesteld dan `warn`, kunnen deze logs worden onderdrukt. De standaardwaarde `info` is prima.
- Vlaggen kun je veilig ingeschakeld laten; ze beïnvloeden alleen het logvolume voor het specifieke subsysteem.
- Gebruik [/logging](/nl/logging) om logbestemmingen, niveaus en redactie te wijzigen.

## Gerelateerd

- [Gateway-diagnostiek](/nl/gateway/diagnostics)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
