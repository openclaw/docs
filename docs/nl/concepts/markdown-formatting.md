---
read_when:
    - Je wijzigt de Markdown-opmaak of segmentering voor uitgaande kanalen
    - Je voegt een nieuwe kanaalformatter of stijltoewijzing toe
    - Je spoort opmaakregressies in verschillende kanalen op
summary: Markdown-opmaakpipeline voor uitgaande kanalen
title: Markdown-opmaak
x-i18n:
    generated_at: "2026-07-12T08:49:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw zet uitgaande Markdown vóór het renderen van kanaalspecifieke uitvoer om in een gedeelde tussenrepresentatie
(IR). De IR bevat platte tekst plus
stijl-/linkbereiken, zodat één parseerstap elk kanaal bedient en het opdelen
de opmaak nooit midden in een bereik splitst.

## Pijplijn

1. **Markdown naar IR parseren** (`markdownToIR`) - platte tekst plus stijlbereiken
   (vet, cursief, doorgestreept, code, codeblok, spoiler, blokcitaat,
   kopniveau 1-6) en linkbereiken. Posities zijn UTF-16-code-eenheden, zodat de stijlbereiken van Signal
   rechtstreeks aansluiten op de API. Tabellen worden alleen geparseerd wanneer het kanaal
   een tabelmodus inschakelt.
2. **De IR opdelen** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - het splitsen gebeurt vóór het renderen op de IR-tekst, zodat inline stijlen en
     links per deel worden gesplitst in plaats van over een grens te worden afgebroken.
3. **Per kanaal renderen** (`renderMarkdownWithMarkers`) - een toewijzing van stijlmarkeringen
   zet bereiken om in de systeemeigen opmaak van het kanaal.

| Kanaal                                                           | Renderer                                                                             | Opmerkingen                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Slack                                                            | mrkdwn-tokens (`*bold*`, `_italic_`, `` `code` ``, codeblokken met hekken)            | Links worden `<url\|label>`; automatische links zijn tijdens het parseren uitgeschakeld om dubbele links te voorkomen |
| Telegram                                                         | HTML-tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | Ondersteunt ook tabellen en koppen (`<h1>`-`<h6>`) in uitgebreide berichten wanneer `richMessages` is ingeschakeld |
| Signal                                                           | platte tekst + `text-style`-bereiken                                                 | Links worden als `label (url)` weergegeven wanneer het label afwijkt van de URL                     |
| Discord, WhatsApp, iMessage, Microsoft Teams en andere kanalen   | platte tekst                                                                         | Geen op IR gebaseerde stijl; Markdown-tabellen worden nog steeds omgezet via `convertMarkdownTables` |

## IR-voorbeeld

Invoer-Markdown:
__OC_I18N_900000__
IR (schematisch):
__OC_I18N_900001__
## Tabelverwerking

`markdown.tables` bepaalt hoe een kanaal Markdown-tabellen omzet, per
kanaal en optioneel per account:

| Modus     | Gedrag                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------- |
| `code`    | Renderen als een uitgelijnde ASCII-tabel in een codeblok (standaardterugval)                        |
| `bullets` | Elke rij omzetten in opsommingstekens met `label: value`                                           |
| `block`   | Systeemeigen tabellen behouden waar het transport die ondersteunt; anders terugvallen op `code`    |
| `off`     | Het parseren van tabellen uitschakelen; de onbewerkte tabeltekst ongewijzigd doorgeven              |

Standaardwaarden van Plugins per kanaal: Signal, WhatsApp en Matrix gebruiken standaard
`bullets`; Mattermost gebruikt standaard `off`; Telegram gebruikt standaard `block` (wat
wordt omgezet naar `code`, tenzij voor het account `richMessages` is ingeschakeld). Elk
kanaal zonder expliciete standaardwaarde van de Plugin valt terug op `code`.
__OC_I18N_900002__
## Regels voor opdelen

- Deellimieten komen uit kanaaladapters/configuratie en gelden voor IR-tekst, niet voor
  gerenderde uitvoer.
- Codeblokken met hekken worden als één blok behouden, met een afsluitende nieuwe regel zodat
  kanalen het afsluitende hek correct renderen.
- Voorvoegsels van lijsten en blokcitaten maken deel uit van de IR-tekst, zodat het opdelen
  nooit midden in een voorvoegsel splitst.
- Inline stijlen worden nooit over delen gesplitst; de renderer opent een nog geopende
  stijl opnieuw aan het begin van het volgende deel.

Zie [Streamen en opdelen](/concepts/streaming) voor gedrag rond deelgrenzen en
bezorging via kanalen.

## Linkbeleid

- **Slack:** `[label](url)` -> `<url|label>`; kale URL's blijven kaal.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-parseermodus).
- **Signal:** `[label](url)` -> `label (url)`, tenzij het label al
  overeenkomt met de URL.

## Spoilers

Spoilermarkeringen (`||spoiler||`) worden geparseerd voor Signal (toegewezen aan
stijlbereiken van `SPOILER`) en Telegram (toegewezen aan `<tg-spoiler>`). Andere kanalen behandelen
`||...||` als platte tekst.

## Een kanaalformatter toevoegen of bijwerken

1. **Eén keer parseren** met `markdownToIR(...)`, waarbij kanaalgeschikte
   opties worden doorgegeven (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Renderen** met `renderMarkdownWithMarkers(...)` en een toewijzing van stijlmarkeringen (of
   aangepaste logica voor stijlbereiken voor transporten zoals Signal).
3. **Opdelen** met `chunkMarkdownIR(...)` of
   `renderMarkdownIRChunksWithinLimit(...)` voordat elk deel wordt gerenderd.
4. **De adapter koppelen** zodat de nieuwe opdeler en renderer worden aangeroepen vanuit het
   uitgaande verzendpad.
5. **Testen** met opmaaktests plus een test voor uitgaande bezorging als het kanaal
   berichten opdeelt.

## Veelvoorkomende valkuilen

- Slack-tokens tussen punthaken (`<@U123>`, `<#C123>`, `<https://...>`) moeten
  het escapen overleven; onbewerkte HTML moet nog steeds veilig worden geëscapet.
- Telegram-HTML vereist dat tekst buiten tags wordt geëscapet om ongeldige opmaak te voorkomen.
- Signal-stijlbereiken gebruiken UTF-16-posities, geen codepuntposities.
- Behoud afsluitende nieuwe regels bij codeblokken met hekken, zodat de afsluitende markering
  op een eigen regel terechtkomt.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Streamen en opdelen" href="/nl/concepts/streaming" icon="bars-staggered">
    Gedrag voor uitgaand streamen, deelgrenzen en kanaalspecifieke bezorging.
  </Card>
  <Card title="Systeemprompt" href="/nl/concepts/system-prompt" icon="message-lines">
    Wat het model vóór het gesprek ziet, inclusief geïnjecteerde werkruimtebestanden.
  </Card>
</CardGroup>
