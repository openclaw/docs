---
read_when:
    - Je wijzigt hoe tijdstempels aan het model of gebruikers worden weergegeven
    - Je debugt tijdsnotatie in berichten of uitvoer van systeemprompts
summary: Datum- en tijdafhandeling in enveloppen, prompts, hulpmiddelen en connectoren
title: Datum en tijd
x-i18n:
    generated_at: "2026-04-29T22:42:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 16
---

# Datum en tijd

OpenClaw gebruikt standaard **host-lokale tijd voor transporttijdstempels** en **de tijdzone van de gebruiker alleen in de systeemprompt**.
Providertijdstempels blijven behouden, zodat tools hun oorspronkelijke semantiek behouden (de huidige tijd is beschikbaar via `session_status`).

## Bericht-enveloppen (standaard lokaal)

Inkomende berichten worden verpakt met een tijdstempel (precisie tot op de minuut):

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
- `envelopeElapsed: "off"` verwijdert verstreken-tijdsuffixen (de stijl `+2m`).

### Voorbeelden

**Lokaal (standaard):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Tijdzone van gebruiker:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Verstreken tijd ingeschakeld:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Systeemprompt: huidige datum en tijd

Als de tijdzone van de gebruiker bekend is, bevat de systeemprompt een aparte
sectie **Huidige datum en tijd** met alleen de **tijdzone** (geen klok-/tijdnotatie)
om promptcaching stabiel te houden:

```
Time zone: America/Chicago
```

Wanneer de agent de huidige tijd nodig heeft, gebruik je de tool `session_status`; de statuskaart bevat een tijdstempelregel.

## Systeemgebeurtenisregels (standaard lokaal)

In de agentcontext ingevoegde systeemgebeurtenissen in de wachtrij krijgen een tijdstempelvoorvoegsel met dezelfde tijdzoneselectie als bericht-enveloppen (standaard: host-lokaal).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Tijdzone + notatie van gebruiker configureren

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
- `timeFormat` bepaalt **12-uurs-/24-uursweergave** in de prompt. `auto` volgt OS-voorkeuren.

## Detectie van tijdnotatie (auto)

Wanneer `timeFormat: "auto"` is ingesteld, inspecteert OpenClaw de OS-voorkeur (macOS/Windows)
en valt het terug op locale-notatie. De gedetecteerde waarde wordt **per proces gecachet**
om herhaalde systeemaanroepen te vermijden.

## Toolpayloads + connectors (ruwe providertijd + genormaliseerde velden)

Kanaaltools retourneren **provider-native tijdstempels** en voegen genormaliseerde velden toe voor consistentie:

- `timestampMs`: epoch-milliseconden (UTC)
- `timestampUtc`: ISO 8601 UTC-string

Ruwe providervelden blijven behouden, zodat er niets verloren gaat.

- Slack: epoch-achtige strings uit de API
- Discord: UTC ISO-tijdstempels
- Telegram/WhatsApp: providerspecifieke numerieke/ISO-tijdstempels

Als je lokale tijd nodig hebt, converteer die dan downstream met de bekende tijdzone.

## Gerelateerde documentatie

- [Systeemprompt](/nl/concepts/system-prompt)
- [Tijdzones](/nl/concepts/timezone)
- [Berichten](/nl/concepts/messages)
