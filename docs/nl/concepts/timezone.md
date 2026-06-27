---
read_when:
    - Je wilt een snel mentaal model voor tijdzoneverwerking
    - Je bepaalt waar je een tijdzone instelt of overschrijft
summary: Waar tijdzones verschijnen in OpenClaw — enveloppen, tool-payloads, systeemprompt
title: Tijdzones
x-i18n:
    generated_at: "2026-06-27T17:30:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standaardiseert tijdstempels zodat het model één **enkele referentietijd** ziet in plaats van een mix van provider-lokale klokken. Er zijn drie oppervlakken waar tijdzones verschijnen, elk met een eigen doel:

## Drie tijdzone-oppervlakken

| Oppervlak         | Wat het toont                                                                                               | Standaard                              | Geconfigureerd via                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| Bericht-enveloppen | Omhult inkomende kanaalberichten: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                       | Host-lokaal                            | `agents.defaults.envelopeTimezone`                      |
| Tool-payloads     | Kanaaltools in `readMessages`-stijl retourneren ruwe providertijd + genormaliseerde `timestampMs` / `timestampUtc` | UTC-velden altijd aanwezig             | Niet configureerbaar — behoudt provider-native tijdstempels |
| Systeemprompt     | Een klein `Current Date & Time`-blok met alleen de **tijdzone** (geen klokwaarde, voor cachestabiliteit)     | Hosttijdzone als `userTimezone` niet is ingesteld | `agents.defaults.userTimezone`                          |

De systeemprompt laat de live klok bewust weg om promptcaching stabiel te houden tussen beurten. Wanneer de agent de huidige tijd nodig heeft, roept deze `session_status` aan.

## De gebruikerstijdzone instellen

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Als `userTimezone` niet is ingesteld, bepaalt OpenClaw de hosttijdzone tijdens runtime (zonder configuratie weg te schrijven). `agents.defaults.timeFormat` (`auto` | `12` | `24`) regelt 12-uurs-/24-uursweergave in enveloppen en downstream-oppervlakken, niet in de systeempromptsectie.

## Wanneer overschrijven

- **Gebruik UTC-enveloppen** (`envelopeTimezone: "utc"`) wanneer je stabiele tijdstempels wilt over hosts in verschillende regio's heen, of wanneer je UTC-uitgelijnde logs wilt laten overeenkomen met diagnose-uitvoer.
- **Gebruik een vaste IANA-zone** (bijv. `"Europe/Vienna"`) wanneer de Gateway-host zich in één zone bevindt maar de gebruiker in een andere, en je wilt dat enveloppen in de zone van de gebruiker worden gelezen ongeacht hostmigratie.
- **Stel `envelopeTimestamp: "off"` in** wanneer tijdstempelcontext niet nuttig is voor het gesprek. Dit verwijdert absolute tijdstempels uit enveloppen, directe agentpromptprefixen en ingesloten modelinvoerprefixen.

Zie [Datum en tijd](/nl/date-time) voor de volledige gedragsreferentie, voorbeelden per provider en verstreken-tijd-opmaak.

## Gerelateerd

- [Datum en tijd](/nl/date-time) — volledig gedrag en voorbeelden voor enveloppen, tools en prompts.
- [Heartbeat](/nl/gateway/heartbeat) — actieve uren gebruiken de tijdzone voor planning.
- [Cron-taken](/nl/automation/cron-jobs) — Cron-expressies gebruiken de tijdzone voor planning.
