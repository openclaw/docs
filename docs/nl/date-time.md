---
read_when:
    - Je wijzigt hoe tijdstempels aan het model of gebruikers worden getoond
    - Je debugt tijdsnotatie in berichten of uitvoer van systeemprompts
summary: Datum- en tijdverwerking in envelopes, prompts, tools en connectors
title: Datum en tijd
x-i18n:
    generated_at: "2026-06-27T17:30:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw gebruikt standaard **host-lokale tijd voor transporttijdstempels** en **de gebruikerstijdzone alleen in de systeemprompt**.
Providertijdstempels blijven behouden zodat tools hun native semantiek behouden (de huidige tijd is beschikbaar via `session_status`).

## Bericht-enveloppen (standaard lokaal)

Inkomende berichten worden ingepakt met een tijdstempel (precisie in seconden):

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

Deze enveloptijdstempel is **standaard host-lokaal**, ongeacht de providertijdzone.

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
- `envelopeTimezone: "local"` gebruikt de hosttijdzone.
- `envelopeTimezone: "user"` gebruikt `agents.defaults.userTimezone` (valt terug op de hosttijdzone).
- Gebruik een expliciete IANA-tijdzone (bijv. `"America/Chicago"`) voor een vaste zone.
- `envelopeTimestamp: "off"` verwijdert absolute tijdstempels uit envelopheaders, directe agentpromptvoorvoegsels en ingesloten modelinvoervoorvoegsels.
- `envelopeElapsed: "off"` verwijdert achtervoegsels voor verstreken tijd (de stijl `+2m`).

### Voorbeelden

**Lokaal (standaard):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Gebruikerstijdzone:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Verstreken tijd ingeschakeld:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Systeemprompt: huidige datum en tijd

Als de gebruikerstijdzone bekend is, bevat de systeemprompt een speciale sectie
**Huidige datum en tijd** met **alleen de tijdzone** (geen klok-/tijdnotatie)
om promptcaching stabiel te houden:

```
Time zone: America/Chicago
```

Wanneer de agent de huidige tijd nodig heeft, gebruik je de tool `session_status`; de statuskaart bevat een tijdstempelregel.

## Systeemgebeurtenisregels (standaard lokaal)

Systeemgebeurtenissen in de wachtrij die in de agentcontext worden ingevoegd, krijgen een voorvoegsel met een tijdstempel dat dezelfde tijdzoneselectie gebruikt als bericht-enveloppen (standaard: host-lokaal).

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

- `userTimezone` stelt de **gebruiker-lokale tijdzone** in voor promptcontext.
- `timeFormat` bepaalt de **12u-/24u-weergave** in de prompt. `auto` volgt de OS-voorkeuren.

## Detectie van tijdnotatie (auto)

Wanneer `timeFormat: "auto"` is ingesteld, inspecteert OpenClaw de OS-voorkeur (macOS/Windows)
en valt het terug op locale-opmaak. De gedetecteerde waarde wordt **per proces gecachet**
om herhaalde systeemaanroepen te vermijden.

## Toolpayloads + connectors (ruwe providertijd + genormaliseerde velden)

Kanaaltools retourneren **provider-native tijdstempels** en voegen genormaliseerde velden toe voor consistentie:

- `timestampMs`: epochmilliseconden (UTC)
- `timestampUtc`: ISO 8601 UTC-string

Ruwe providervelden blijven behouden, zodat er niets verloren gaat.

- Slack: epoch-achtige strings uit de API
- Discord: UTC ISO-tijdstempels
- Telegram/WhatsApp: providerspecifieke numerieke/ISO-tijdstempels

Als je lokale tijd nodig hebt, converteer die dan downstream met de bekende tijdzone.

## Gerelateerde docs

- [Systeemprompt](/nl/concepts/system-prompt)
- [Tijdzones](/nl/concepts/timezone)
- [Berichten](/nl/concepts/messages)
