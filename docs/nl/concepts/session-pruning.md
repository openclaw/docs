---
read_when:
    - Je wilt de groei van de context door tooluitvoer beperken
    - Je wilt de optimalisatie van de Anthropic-promptcache begrijpen
summary: Oude toolresultaten inkorten om de context compact en caching efficiënt te houden
title: Sessies opschonen
x-i18n:
    generated_at: "2026-07-12T08:47:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

Sessiesnoeiing verkort **oude toolresultaten** in de context vóór elke LLM-aanroep. Dit beperkt contextophoping door verzamelde tooluitvoer (uitvoerresultaten, gelezen bestanden, zoekresultaten) zonder normale gesprekstekst te herschrijven.

<Info>
Snoeiing vindt alleen in het geheugen plaats -- het sessietranscript op schijf wordt niet gewijzigd. Uw volledige geschiedenis blijft altijd behouden.
</Info>

## Waarom dit belangrijk is

Tijdens lange sessies stapelt tooluitvoer zich op, waardoor het contextvenster groter wordt. Dit verhoogt de kosten en kan [Compaction](/nl/concepts/compaction) eerder dan nodig afdwingen.

Snoeiing is vooral waardevol voor **promptcaching van Anthropic**. Nadat de TTL van de cache is verlopen, wordt bij het volgende verzoek de volledige prompt opnieuw gecachet. Snoeiing verkleint de hoeveelheid gegevens die naar de cache wordt geschreven en verlaagt daarmee rechtstreeks de kosten.

## Hoe het werkt

Snoeiing wordt uitgevoerd in de modus `cache-ttl` en vindt alleen plaats als zowel aan een tijdscontrole als aan een controle van de contextgrootte is voldaan:

1. Wacht tot de TTL van de cache verloopt (standaard 5 minuten wanneer deze handmatig is ingesteld; zie [Slimme standaardwaarden](#smart-defaults) voor de automatische standaardwaarde van Anthropic). Voordat de TTL is verstreken, wordt snoeiing volledig overgeslagen om hergebruik van de promptcache voor kort op elkaar volgende beurten te behouden.
2. Zodra de TTL is verstreken, wordt de totale contextgrootte geschat ten opzichte van het contextvenster van het model. Als de verhouding lager is dan `softTrimRatio` (standaard 0,3), wordt snoeiing overgeslagen en blijft de TTL-klok doorlopen.
3. Voer een **zachte verkorting** uit op te grote toolresultaten boven de verhouding: behoud het begin en einde (standaard elk 1500 tekens, met een gecombineerd maximum van 4000 tekens) en voeg daartussen `...` in.
4. Als de verhouding nog steeds gelijk is aan of hoger is dan `hardClearRatio` (standaard 0,5) en er ten minste `minPrunableToolChars` (standaard 50.000) aan snoeibare toolinhoud overblijft, worden die resultaten **volledig gewist**: de inhoud wordt vervangen door een tijdelijke aanduiding (standaard `[Inhoud van oud toolresultaat gewist]`).
5. Stel de TTL-klok alleen opnieuw in wanneer de snoeiing de context daadwerkelijk heeft gewijzigd, zodat vervolgverzoeken de vernieuwde cache hergebruiken.

Ongeacht de drempelwaarden gelden twee veiligheidsregels: de meest recente `keepLastAssistants` assistentbeurten (standaard 3) worden nooit gesnoeid en niets vóór het eerste gebruikersbericht van de sessie wordt ooit gesnoeid (dit beschermt initiële leesbewerkingen zoals `SOUL.md`/`USER.md`).

Alleen `toolResult`-berichten komen in aanmerking; normale gesprekstekst blijft ongewijzigd. Gebruik `agents.defaults.contextPruning.tools.{allow,deny}` om te bepalen welke toolnamen snoeibaar zijn.

## Opschoning van verouderde afbeeldingen

OpenClaw maakt ook een afzonderlijke idempotente herhalingsweergave voor sessies waarin onbewerkte afbeeldingsblokken of mediamarkeringen voor promptinitialisatie in de geschiedenis worden bewaard.

- De **3 meest recente voltooide beurten** worden byte voor byte behouden, zodat voorvoegsels van de promptcache voor recente vervolgvragen stabiel blijven. Dit aantal omvat alle voltooide beurten, niet alleen beurten met afbeeldingen; beurten met alleen tekst tellen dus ook mee voor dit venster.
- In de herhalingsweergave worden oudere, reeds verwerkte afbeeldingsblokken uit de geschiedenis van `user` of `toolResult` vervangen door `[afbeeldingsgegevens verwijderd - al door model verwerkt]`.
- Oudere tekstuele mediaverwijzingen zoals `[media attached: ...]`, `[Image: source: ...]` en `media://inbound/...` worden vervangen door `[mediaverwijzing verwijderd - al door model verwerkt]`. Bijlagemarkeringen van de huidige beurt blijven intact, zodat visuele modellen nieuwe afbeeldingen nog steeds kunnen initialiseren.
- Het onbewerkte sessietranscript wordt niet herschreven, zodat geschiedenisweergaven de oorspronkelijke berichtitems en hun afbeeldingen nog steeds kunnen weergeven.
- Dit staat los van de normale snoeiing op basis van de cache-TTL hierboven. Het voorkomt dat herhaalde afbeeldingspayloads of verouderde mediaverwijzingen de promptcaches bij latere beurten ongeldig maken.

## Slimme standaardwaarden

De meegeleverde Anthropic-Plugin configureert automatisch de snoeiings- en Heartbeat-frequentie wanneer voor het eerst een authenticatieprofiel van Anthropic (of Claude CLI) wordt gevonden, maar alleen voor velden die u nog niet expliciet hebt ingesteld:

| Authenticatiemodus                         | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ------------------------------------------ | --------------------- | -------------------- | ----------------- |
| OAuth/token (inclusief hergebruik Claude CLI) | `cache-ttl`        | `1h`                 | `1h`              |
| API-sleutel                                | `cache-ttl`           | `1h`                 | `30m`             |

Als u `agents.defaults.contextPruning.mode` of `agents.defaults.heartbeat.every` zelf instelt, overschrijft OpenClaw deze niet. Deze automatische standaardwaarde wordt alleen toegepast bij authenticatie uit de Anthropic-familie; voor andere providers staat snoeiing op `off`, tenzij u dit configureert.

## In- of uitschakelen

Snoeiing is standaard uitgeschakeld voor providers die niet van Anthropic zijn. Inschakelen:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Uitschakelen: stel `mode: "off"` in.

## Snoeiing versus Compaction

|                | Snoeiing                  | Compaction              |
| -------------- | ------------------------- | ----------------------- |
| **Wat**        | Verkort toolresultaten    | Vat het gesprek samen   |
| **Opgeslagen?** | Nee (per verzoek)         | Ja (in het transcript)  |
| **Bereik**     | Alleen toolresultaten     | Volledig gesprek        |

Ze vullen elkaar aan -- snoeiing houdt tooluitvoer beknopt tussen Compaction-cycli.

## Verder lezen

- [Compaction](/nl/concepts/compaction): contextreductie op basis van samenvattingen
- [Gateway-configuratie](/nl/gateway/configuration): alle configuratieopties voor snoeiing (`contextPruning.*`)

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessietools](/nl/concepts/session-tool)
- [Contextengine](/nl/concepts/context-engine)
