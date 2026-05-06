---
read_when:
    - U wijzigt hoe tijdstempels aan het model of gebruikers worden weergegeven
    - Je debugt tijdsopmaak in berichten of uitvoer van systeemprompts
summary: Datum- en tijdverwerking in enveloppen, promptteksten, hulpmiddelen en connectoren
title: Datum en tijd
x-i18n:
    generated_at: "2026-05-06T09:11:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw gebruikt standaard **host-lokale tijd voor transporttijdstempels** en **de gebruikerstijdzone alleen in de systeemprompt**.
Providertijdstempels blijven behouden, zodat tools hun eigen semantiek behouden (de huidige tijd is beschikbaar via `session_status`).

## Bericht-enveloppen (standaard lokaal)

Binnenkomende berichten worden verpakt met een tijdstempel (precisie tot op de minuut):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Deze enveloptijdstempel is **standaard host-lokaal**, ongeacht de tijdzone van de provider.

Je kunt dit gedrag overschrijven:

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
- `envelopeTimezone: "local"` gebruikt de tijdzone van de host.
- `envelopeTimezone: "user"` gebruikt `agents.defaults.userTimezone` (valt terug op de tijdzone van de host).
- Gebruik een expliciete IANA-tijdzone (bijv. `"America/Chicago"`) voor een vaste zone.
- `envelopeTimestamp: "off"` verwijdert absolute tijdstempels uit envelopheaders.
- `envelopeElapsed: "off"` verwijdert achtervoegsels voor verstreken tijd (de `+2m`-stijl).

### Voorbeelden

**Lokaal (standaard):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Gebruikerstijdzone:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Verstreken tijd ingeschakeld:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Systeemprompt: huidige datum en tijd

Als de gebruikerstijdzone bekend is, bevat de systeemprompt een aparte sectie
**Huidige datum en tijd** met **alleen de tijdzone** (geen klok-/tijdnotatie)
om promptcaching stabiel te houden:

```
Time zone: America/Chicago
```

Wanneer de agent de huidige tijd nodig heeft, gebruik je de tool `session_status`; de statuskaart bevat een regel met een tijdstempel.

## Systeemgebeurtenisregels (standaard lokaal)

Systeemgebeurtenissen in de wachtrij die in de agentcontext worden ingevoegd, krijgen een voorvoegsel met een tijdstempel op basis van dezelfde tijdzoneselectie als bericht-enveloppen (standaard: host-lokaal).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Gebruikerstijdzone + notatie configureren

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` stelt de **gebruikerslokale tijdzone** in voor promptcontext.
- `timeFormat` bepaalt de **12u/24u-weergave** in de prompt. `auto` volgt OS-voorkeuren.

## Tijdnotatiedetectie (auto)

Wanneer `timeFormat: "auto"` is ingesteld, inspecteert OpenClaw de OS-voorkeur (macOS/Windows) en valt terug op locale-opmaak. De gedetecteerde waarde wordt **per proces gecachet** om herhaalde systeemaanroepen te vermijden.

## Tool-payloads + connectors (ruwe providertijd + genormaliseerde velden)

Channel-tools retourneren **provider-native tijdstempels** en voegen genormaliseerde velden toe voor consistentie:

- `timestampMs`: epoch-milliseconden (UTC)
- `timestampUtc`: ISO 8601 UTC-string

Ruwe providervelden blijven behouden, zodat er niets verloren gaat.

- Slack: epoch-achtige strings van de API
- Discord: UTC ISO-tijdstempels
- Telegram/WhatsApp: providerspecifieke numerieke/ISO-tijdstempels

Als je lokale tijd nodig hebt, converteer die dan downstream met de bekende tijdzone.

## Gerelateerde docs

- [Systeemprompt](/nl/concepts/system-prompt)
- [Tijdzones](/nl/concepts/timezone)
- [Berichten](/nl/concepts/messages)
