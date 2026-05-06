---
read_when:
    - Je wilt een beknopt mentaal model voor tijdzoneafhandeling
    - Je bepaalt waar je een tijdzone instelt of overschrijft
summary: Waar tijdzones voorkomen in OpenClaw — enveloppen, tool-payloads, systeemprompt
title: Tijdzones
x-i18n:
    generated_at: "2026-05-06T09:11:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standaardiseert tijdstempels zodat het model één **enkele referentietijd** ziet in plaats van een mix van provider-lokale klokken. Er zijn drie oppervlakken waar tijdzones zichtbaar zijn, elk met een eigen doel:

## Drie tijdzone-oppervlakken

| Oppervlak         | Wat het toont                                                                                           | Standaard                             | Geconfigureerd via                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| Bericht-enveloppen | Omvat inkomende kanaalberichten: `[Signal +1555 2026-01-18 00:19 PST] hallo`                            | Host-lokaal                           | `agents.defaults.envelopeTimezone`                      |
| Tool-payloads     | Kanaaltools in `readMessages`-stijl retourneren ruwe providertijd + genormaliseerde `timestampMs` / `timestampUtc` | UTC-velden altijd aanwezig            | Niet configureerbaar — behoudt provider-native tijdstempels |
| Systeemprompt     | Een klein blok `Huidige datum en tijd` met alleen de **tijdzone** (geen klokwaarde, voor cache-stabiliteit) | Hosttijdzone als `userTimezone` niet is ingesteld | `agents.defaults.userTimezone`                          |

De systeemprompt laat de live klok bewust weg om prompt-caching stabiel te houden tussen beurten. Wanneer de agent de huidige tijd nodig heeft, roept hij `session_status` aan.

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

Als `userTimezone` niet is ingesteld, bepaalt OpenClaw de hosttijdzone tijdens runtime (zonder config te schrijven). `agents.defaults.timeFormat` (`auto` | `12` | `24`) bepaalt de 12-uurs-/24-uursweergave in enveloppen en downstream-oppervlakken, niet in de systeempromptsectie.

## Wanneer overschrijven

- **Gebruik UTC-enveloppen** (`envelopeTimezone: "utc"`) wanneer je stabiele tijdstempels wilt tussen hosts in verschillende regio's, of wanneer je UTC-uitgelijnde logs wilt laten overeenkomen met diagnostische uitvoer.
- **Gebruik een vaste IANA-zone** (bijv. `"Europe/Vienna"`) wanneer de Gateway-host zich in één zone bevindt maar de gebruiker in een andere, en je wilt dat enveloppen in de zone van de gebruiker worden weergegeven, ongeacht hostmigratie.
- **Stel `envelopeTimestamp: "off"` in** voor enveloppen met weinig tokens wanneer tijdstempelcontext niet nuttig is voor het gesprek.

Zie [Datum en tijd](/nl/date-time) voor de volledige gedragsreferentie, voorbeelden per provider en opmaak van verstreken tijd.

## Gerelateerd

- [Datum en tijd](/nl/date-time) — volledig gedrag en voorbeelden voor enveloppen, tools en prompts.
- [Heartbeat](/nl/gateway/heartbeat) — actieve uren gebruiken tijdzone voor planning.
- [Cron-taken](/nl/automation/cron-jobs) — cron-expressies gebruiken tijdzone voor planning.
