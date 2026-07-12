---
read_when:
    - U wijzigt hoe tijdstempels aan het model of gebruikers worden weergegeven
    - Je debugt de tijdnotatie in berichten of uitvoer van de systeemprompt
summary: Datum- en tijdverwerking in enveloppen, prompts, tools en connectors
title: Datum en tijd
x-i18n:
    generated_at: "2026-07-12T08:50:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw gebruikt **hostlokale tijd voor transporttijdstempels** en neemt **alleen de tijdzone** op in de systeemprompt.
Tijdstempels van providers blijven behouden, zodat tools hun eigen semantiek behouden. Wanneer de agent de huidige
tijd nodig heeft, voert deze de tool `session_status` uit.

## Berichtomslagen (standaard lokaal)

Inkomende berichten worden omhuld met een weekdag en een tijdstempel met precisie tot op de seconde:

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] message text
```

De tijdstempel van de omslag is **standaard hostlokaal**, ongeacht de tijdzone van de provider.
Overschrijf dit onder `agents.defaults`:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA-tijdzone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

| Sleutel             | Waarden                                              | Gedrag                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local` (standaard), `utc`, `user`, expliciete IANA-naam | `user` gebruikt `agents.defaults.userTimezone` (de tijdzone van de host wanneer niet ingesteld). Een expliciete IANA-naam (bijv. `"America/Chicago"`) legt een vaste zone vast; niet-herkende namen vallen terug op UTC. |
| `envelopeTimestamp` | `on` (standaard), `off`                              | `off` verwijdert absolute tijdstempels uit omslagkoppen, directe voorvoegsels van agentprompts en ingebedde voorvoegsels voor modelinvoer.                                               |
| `envelopeElapsed`   | `on` (standaard), `off`                              | `off` verwijdert het achtervoegsel voor verstreken tijd (in de stijl van `+30s` / `+2m`) dat de tijd sinds het vorige bericht in de sessie aangeeft.                                    |

### Voorbeelden

**Lokaal (standaard):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Tijdzone van de gebruiker:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Verstreken tijd met `envelopeTimezone: "utc"`:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Systeemprompt: huidige datum en tijd

De systeemprompt bevat een sectie **Huidige datum en tijd** met **alleen de tijdzone**
(geen klok of tijdnotatie), zodat promptcaching stabiel blijft:

```
Tijdzone: America/Chicago
```

De zone is `agents.defaults.userTimezone` wanneer deze is geconfigureerd; anders wordt de tijdzone van de host gebruikt.
De prompt instrueert de agent ook om de tool `session_status` uit te voeren wanneer deze de huidige
datum, tijd of dag van de week nodig heeft.

## Systeemgebeurtenisregels (standaard lokaal)

Systeemgebeurtenissen in de wachtrij die in de agentcontext worden ingevoegd, krijgen een tijdstempel als voorvoegsel, met
dezelfde selectie voor `envelopeTimezone` als berichtomslagen (standaard: hostlokaal).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Tijdzone en notatie voor de gebruiker configureren

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

- `userTimezone` stelt de **gebruikerslokale tijdzone** in voor de promptcontext (en voor `envelopeTimezone: "user"`).
- `timeFormat` bepaalt de **12-/24-uursweergave** voor tijden in prompts. `auto` volgt de voorkeuren van het besturingssysteem.

## Detectie van tijdnotatie (automatisch)

Wanneer `timeFormat: "auto"` is ingesteld, controleert OpenClaw de voorkeur van het besturingssysteem (macOS en Windows)
en valt het terug op de lokale notatie. De gedetecteerde waarde wordt **per proces gecachet**
om herhaalde systeemaanroepen te voorkomen.

## Toolpayloads en connectors (onbewerkte providertijd en genormaliseerde velden)

Kanaaltools retourneren **tijdstempels in de eigen notatie van de provider** en voegen voor consistentie genormaliseerde velden toe:

- `timestampMs`: milliseconden sinds de epoch (UTC)
- `timestampUtc`: ISO 8601-tekenreeks in UTC

Onbewerkte providervelden blijven behouden, zodat er niets verloren gaat.

- Discord: ISO-tijdstempels in UTC
- Slack: epoch-achtige tekenreeksen uit de API
- Telegram/WhatsApp: providerspecifieke numerieke/ISO-tijdstempels

Als u lokale tijd nodig hebt, converteert u deze verderop met behulp van de bekende tijdzone.

## Gerelateerde documentatie

- [Systeemprompt](/nl/concepts/system-prompt)
- [Tijdzones](/nl/concepts/timezone)
- [Berichten](/nl/concepts/messages)
