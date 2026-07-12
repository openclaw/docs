---
read_when:
    - Je wilt snel een mentaal model voor het omgaan met tijdzones
    - U bepaalt waar u een tijdzone instelt of overschrijft
summary: Waar tijdzones in OpenClaw voorkomen — enveloppen, toolpayloads, systeemprompt
title: Tijdzones
x-i18n:
    generated_at: "2026-07-12T08:47:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standaardiseert tijdstempels, zodat het model **één referentietijd** ziet in plaats van een combinatie van providerlokale klokken. Drie oppervlakken tonen tijdzones, elk met een eigen doel:

## Drie tijdzoneoppervlakken

| Oppervlak          | Wat het toont                                                                                                        | Standaard                                  | Geconfigureerd via                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Berichtomslagen    | Omsluit inkomende kanaalberichten: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                | Lokaal op de host                          | `agents.defaults.envelopeTimezone`                      |
| Toolpayloads       | Tools in de stijl van `readMessages` voor kanalen retourneren de onbewerkte providertijd plus genormaliseerde `timestampMs` / `timestampUtc` | UTC-velden zijn altijd aanwezig            | Niet configureerbaar; behoudt provider-eigen tijdstempels |
| Systeemprompt      | Een klein blok `Huidige datum en tijd` met **alleen de tijdzone** (geen kloktijd, voor stabiele caching)              | Tijdzone van de host als `userTimezone` niet is ingesteld | `agents.defaults.userTimezone`                          |

De systeemprompt laat bewust de actuele kloktijd weg om promptcaching tussen beurten stabiel te houden. Wanneer de agent de huidige tijd nodig heeft, roept deze `session_status` aan.

## De tijdzone van de gebruiker instellen

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Als `userTimezone` niet is ingesteld, bepaalt OpenClaw tijdens runtime de tijdzone van de host via `Intl.DateTimeFormat().resolvedOptions().timeZone` (zonder configuratie te schrijven). `agents.defaults.timeFormat` (`auto` | `12` | `24`) bepaalt de 12-uurs-/24-uursweergave in omslagen en afgeleide oppervlakken, niet in het gedeelte van de systeemprompt.

## Waarden voor de tijdzone van omslagen

`agents.defaults.envelopeTimezone` accepteert:

- `"local"` (standaard) of `"host"` - de tijdzone van de hostmachine.
- `"utc"` of `"gmt"` - UTC.
- `"user"` - de bepaalde `agents.defaults.userTimezone` (valt terug op de tijdzone van de host als deze niet is ingesteld).
- Elke expliciete IANA-tijdzonetekenreeks, bijvoorbeeld `"Europe/Vienna"`.

## Wanneer overschrijven

- **Gebruik `"utc"`** voor stabiele tijdstempels op hosts in verschillende regio's, of om overeen te komen met diagnostische uitvoer/loguitvoer die op UTC is afgestemd.
- **Gebruik `"user"`** om omslagen uitgelijnd te houden met de geconfigureerde tijdzone van de gebruiker, ongeacht de tijdzone waarin de Gateway-host draait.
- **Gebruik een vaste IANA-tijdzone** wanneer de Gateway-host zich in één tijdzone bevindt, maar de omslag altijd een andere tijdzone moet tonen, ongeacht hostmigratie.
- **Stel `envelopeTimestamp: "off"` in** wanneer tijdstempelcontext niet nuttig is voor het gesprek. Hierdoor worden absolute tijdstempels verwijderd uit omslagen, directe promptvoorvoegsels van agents en ingebedde voorvoegsels voor modelinvoer.

Zie [Datum en tijd](/nl/date-time) voor de volledige gedragsreferentie, voorbeelden per provider en de opmaak van verstreken tijd.

## Gerelateerd

- [Datum en tijd](/nl/date-time) - volledig gedrag en voorbeelden voor omslagen, tools en prompts.
- [Heartbeat](/nl/gateway/heartbeat) - actieve uren gebruiken de tijdzone voor planning.
- [Cron-taken](/nl/automation/cron-jobs) - cron-expressies gebruiken de tijdzone voor planning.
