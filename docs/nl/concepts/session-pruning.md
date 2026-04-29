---
read_when:
    - Je wilt contextgroei door tooluitvoer verminderen
    - Je wilt de promptcache-optimalisatie van Anthropic begrijpen
summary: Oude resultaten van hulpprogramma's inkorten om de context compact en het cachegebruik efficiënt te houden
title: Sessie-opschoning
x-i18n:
    generated_at: "2026-04-29T22:40:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 16
---

Sessiesnoei verwijdert **oude toolresultaten** uit de context vóór elke LLM-aanroep. Het vermindert contextoverbelasting door opgehoopte tooluitvoer (exec-resultaten, bestandslezingen, zoekresultaten) zonder normale conversatietekst te herschrijven.

<Info>
Snoeien gebeurt alleen in het geheugen -- het wijzigt het sessietranscript op schijf niet. Je volledige geschiedenis blijft altijd bewaard.
</Info>

## Waarom dit belangrijk is

Lange sessies verzamelen tooluitvoer die het contextvenster opblaast. Dit verhoogt de kosten en kan [Compaction](/nl/concepts/compaction) eerder dan nodig afdwingen.

Snoeien is vooral waardevol voor **Anthropic prompt caching**. Nadat de cache-TTL verloopt, cachet de volgende aanvraag de volledige prompt opnieuw. Snoeien verkleint de cache-schrijfgrootte, wat de kosten rechtstreeks verlaagt.

## Hoe het werkt

1. Wacht tot de cache-TTL verloopt (standaard 5 minuten).
2. Zoek oude toolresultaten voor normale snoei (conversatietekst blijft ongemoeid).
3. **Zacht inkorten** van te grote resultaten -- behoud het begin en einde, voeg `...` in.
4. **Hard wissen** van de rest -- vervang door een tijdelijke aanduiding.
5. Reset de TTL zodat vervolgaanvragen de verse cache hergebruiken.

## Oude afbeeldingen opschonen

OpenClaw bouwt ook een afzonderlijke idempotente replayweergave voor sessies die ruwe afbeeldingsblokken of media-markeringen voor prompt-hydratatie in de geschiedenis bewaren.

- Het behoudt de **3 meest recente voltooide beurten** byte-voor-byte zodat promptcache-prefixen voor recente vervolgvragen stabiel blijven.
- In de replayweergave kunnen oudere, al verwerkte afbeeldingsblokken uit `user`- of `toolResult`-geschiedenis worden vervangen door `[image data removed - already processed by model]`.
- Oudere tekstuele mediaverwijzingen zoals `[media attached: ...]`, `[Image: source: ...]` en `media://inbound/...` kunnen worden vervangen door `[media reference removed - already processed by model]`. Bijlagemarkeringen van de huidige beurt blijven intact zodat vision-modellen verse afbeeldingen nog steeds kunnen hydrateren.
- Het ruwe sessietranscript wordt niet herschreven, zodat geschiedenisviewers de oorspronkelijke berichtitems en hun afbeeldingen nog steeds kunnen renderen.
- Dit staat los van normale cache-TTL-snoei. Het bestaat om te voorkomen dat herhaalde afbeeldingspayloads of verouderde mediaverwijzingen promptcaches in latere beurten ongeldig maken.

## Slimme standaardwaarden

OpenClaw schakelt snoeien automatisch in voor Anthropic-profielen:

| Profieltype                                             | Snoeien ingeschakeld | Heartbeat |
| ------------------------------------------------------- | -------------------- | --------- |
| Anthropic OAuth/token-auth (inclusief Claude CLI-hergebruik) | Ja               | 1 uur     |
| API-sleutel                                             | Ja                   | 30 min    |

Als je expliciete waarden instelt, overschrijft OpenClaw die niet.

## In- of uitschakelen

Snoeien is standaard uitgeschakeld voor niet-Anthropic-providers. Inschakelen:

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

## Snoeien versus Compaction

|            | Snoeien              | Compaction                 |
| ---------- | -------------------- | -------------------------- |
| **Wat**    | Kort toolresultaten in | Vat conversatie samen    |
| **Opgeslagen?** | Nee (per aanvraag) | Ja (in transcript)     |
| **Bereik** | Alleen toolresultaten | Volledige conversatie      |

Ze vullen elkaar aan -- snoeien houdt tooluitvoer slank tussen Compaction-cycli.

## Verder lezen

- [Compaction](/nl/concepts/compaction) -- contextreductie op basis van samenvatting
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieknoppen voor snoeien (`contextPruning.*`)

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessietools](/nl/concepts/session-tool)
- [Context-engine](/nl/concepts/context-engine)
