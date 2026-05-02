---
read_when:
    - Je hebt gerichte debuglogs nodig zonder de globale logniveaus te verhogen
    - U moet subsysteemspecifieke logs vastleggen voor ondersteuning
summary: Diagnoseflags voor gerichte debuglogs
title: Diagnosevlaggen
x-i18n:
    generated_at: "2026-05-02T11:15:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

Met diagnostische vlaggen kun je gerichte debuglogs inschakelen zonder overal uitgebreide logging aan te zetten. Vlaggen zijn opt-in en hebben geen effect tenzij een subsysteem ze controleert.

## Hoe het werkt

- Vlaggen zijn tekenreeksen (niet hoofdlettergevoelig).
- Je kunt vlaggen inschakelen in de configuratie of via een env-override.
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
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

Herstart de Gateway nadat je vlaggen hebt gewijzigd.

## Env-override (eenmalig)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Alle vlaggen uitschakelen:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Timeline-artefacten

De vlag `timeline` schrijft gestructureerde timinggebeurtenissen bij opstarten en tijdens runtime voor
externe QA-harnassen:

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

Het pad naar het timeline-bestand komt nog steeds uit
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Wanneer `timeline` alleen via
configuratie is ingeschakeld, worden de vroegste spans voor het laden van de configuratie niet uitgezonden, omdat OpenClaw de
configuratie nog niet heeft gelezen; daaropvolgende opstartspans gebruiken de configuratievlag.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` en
`OPENCLAW_DIAGNOSTICS=*` schakelen ook de timeline in, omdat ze elke
diagnostische vlag inschakelen. Geef de voorkeur aan `timeline` wanneer je alleen het JSONL-timingartefact
wilt.

Timeline-records gebruiken de envelop `openclaw.diagnostics.v1`. Gebeurtenissen kunnen
proces-id's, fasenamen, spannamen, duurwaarden, Plugin-id's, aantallen afhankelijkheden,
event-loop-vertragingssamples, namen van providerbewerkingen, exitstatus van child-processen
en namen/berichten van opstartfouten bevatten. Behandel timeline-bestanden als lokale diagnostische
artefacten; controleer ze voordat je ze buiten je machine deelt.

## Waar logs naartoe gaan

Vlaggen schrijven logs naar het standaard diagnostische logbestand. Standaard:

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

Filter op Brave Search HTTP-diagnostiek:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Of volg de logs tijdens het reproduceren:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Voor externe Gateways kun je ook `openclaw logs --follow` gebruiken (zie [/cli/logs](/nl/cli/logs)).

## Opmerkingen

- Als `logging.level` hoger is ingesteld dan `warn`, kunnen deze logs worden onderdrukt. De standaardwaarde `info` is prima.
- `brave.http` logt Brave Search-aanvraag-URL's/queryparameters, responsstatus/timing en gebeurtenissen voor cache-hit/miss/write. Het logt geen API-sleutels of responsbodies, maar zoekopdrachten kunnen gevoelig zijn.
- Vlaggen kunnen veilig ingeschakeld blijven; ze beïnvloeden alleen het logvolume voor het specifieke subsysteem.
- Gebruik [/logging](/nl/logging) om logbestemmingen, niveaus en redactie te wijzigen.

## Gerelateerd

- [Gateway-diagnostiek](/nl/gateway/diagnostics)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
