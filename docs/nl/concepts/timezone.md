---
read_when:
    - Je moet begrijpen hoe tijdstempels voor het model worden genormaliseerd
    - De tijdzone van de gebruiker configureren voor systeemprompts
summary: Tijdzoneafhandeling voor agenten, enveloppen en prompts
title: Tijdzones
x-i18n:
    generated_at: "2026-04-29T22:41:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standaardiseert tijdstempels zodat het model een **enkele referentietijd** ziet.

## Bericht-enveloppen (standaard lokaal)

Inkomende berichten worden verpakt in een envelop zoals:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

De tijdstempel in de envelop is **standaard host-lokaal**, met precisie tot op de minuut.

Je kunt dit overschrijven met:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` gebruikt UTC.
- `envelopeTimezone: "user"` gebruikt `agents.defaults.userTimezone` (valt terug op de tijdzone van de host).
- Gebruik een expliciete IANA-tijdzone (bijv. `"Europe/Vienna"`) voor een vaste offset.
- `envelopeTimestamp: "off"` verwijdert absolute tijdstempels uit envelopkoppen.
- `envelopeElapsed: "off"` verwijdert achtervoegsels voor verstreken tijd (de `+2m`-stijl).

### Voorbeelden

**Lokaal (standaard):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Vaste tijdzone:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Verstreken tijd:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Tool-payloads (ruwe providergegevens + genormaliseerde velden)

Toolaanroepen (`channels.discord.readMessages`, `channels.slack.readMessages`, enz.) retourneren **ruwe providertijdstempels**.
We voegen ook genormaliseerde velden toe voor consistentie:

- `timestampMs` (UTC-epoch in milliseconden)
- `timestampUtc` (ISO 8601 UTC-tekenreeks)

Ruwe providervelden blijven behouden.

## Tijdzone van de gebruiker voor de systeemprompt

Stel `agents.defaults.userTimezone` in om het model de lokale tijdzone van de gebruiker te geven. Als dit
niet is ingesteld, bepaalt OpenClaw de **hosttijdzone tijdens runtime** (geen configschrijfactie).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

De systeemprompt bevat:

- Sectie `Current Date & Time` met lokale tijd en tijdzone
- `Time format: 12-hour` of `24-hour`

Je kunt de promptindeling beheren met `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Zie [Datum en tijd](/nl/date-time) voor het volledige gedrag en voorbeelden.

## Gerelateerd

- [Heartbeat](/nl/gateway/heartbeat) — actieve uren gebruiken de tijdzone voor planning
- [Cron-taken](/nl/automation/cron-jobs) — Cron-expressies gebruiken de tijdzone voor planning
- [Datum en tijd](/nl/date-time) — volledig datum-/tijdgedrag en voorbeelden
