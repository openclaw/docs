---
read_when:
    - Je wilt PDF's van agents analyseren
    - Je hebt exacte parameters en limieten voor de pdf-tool nodig
    - Je debugt de native PDF-modus tegenover de extractie-fallback
summary: Analyseer een of meer PDF-documenten met native providerondersteuning en extractiefallback
title: PDF-tool
x-i18n:
    generated_at: "2026-06-27T18:28:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analyseert een of meer PDF-documenten en retourneert tekst.

Snel gedrag:

- Native providermodus voor Anthropic- en Google-modelproviders.
- Terugvalmodus voor extractie voor andere providers (extraheer eerst tekst, daarna pagina-afbeeldingen wanneer nodig).
- Ondersteunt enkele (`pdf`) of meervoudige (`pdfs`) invoer, maximaal 10 PDF's per aanroep.

## Beschikbaarheid

De tool wordt alleen geregistreerd wanneer OpenClaw een PDF-geschikte modelconfiguratie voor de agent kan oplossen:

1. `agents.defaults.pdfModel`
2. terugval naar `agents.defaults.imageModel`
3. terugval naar het opgeloste sessie-/standaardmodel van de agent
4. als native-PDF-providers door auth worden ondersteund, geef deze dan de voorkeur boven generieke kandidaten voor afbeeldingsterugval

Als er geen bruikbaar model kan worden opgelost, wordt de tool `pdf` niet beschikbaar gemaakt.

Beschikbaarheidsopmerkingen:

- De terugvalketen is auth-bewust. Een geconfigureerde `provider/model` telt alleen als
  OpenClaw die provider daadwerkelijk voor de agent kan authenticeren.
- Native PDF-providers zijn momenteel **Anthropic** en **Google**.
- Als de opgeloste sessie-/standaardprovider al een geconfigureerd vision-/PDF-
  model heeft, hergebruikt de PDF-tool dat voordat wordt teruggevallen op andere door auth ondersteunde
  providers.

## Invoerreferentie

<ParamField path="pdf" type="string">
Eén PDF-pad of URL.
</ParamField>

<ParamField path="pdfs" type="string[]">
Meerdere PDF-paden of URL's, tot maximaal 10 in totaal.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analyseprompt.
</ParamField>

<ParamField path="pages" type="string">
Paginafilter zoals `1-5` of `1,3,7-9`.
</ParamField>

<ParamField path="password" type="string">
Wachtwoord voor versleutelde PDF's in de terugvalmodus voor extractie.
</ParamField>

<ParamField path="model" type="string">
Optionele modeloverschrijving in de vorm `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Groottelimiet per PDF in MB. Standaard ingesteld op `agents.defaults.pdfMaxBytesMb` of `10`.
</ParamField>

Invoeropmerkingen:

- `pdf` en `pdfs` worden samengevoegd en ontdubbeld voordat ze worden geladen.
- Als er geen PDF-invoer is opgegeven, geeft de tool een fout.
- `pages` wordt geparsed als paginanummers vanaf 1, ontdubbeld, gesorteerd en begrensd op het geconfigureerde maximumaantal pagina's.
- `password` is van toepassing op elke PDF in het verzoek en wordt alleen gebruikt door de terugvalmodus voor extractie.
- `maxBytesMb` is standaard ingesteld op `agents.defaults.pdfMaxBytesMb` of `10`.

## Ondersteunde PDF-referenties

- lokaal bestandspad (inclusief `~`-uitbreiding)
- `file://`-URL
- `http://`- en `https://`-URL
- door OpenClaw beheerde inkomende refs zoals `media://inbound/<id>`

Referentieopmerkingen:

- Andere URI-schema's (bijvoorbeeld `ftp://`) worden geweigerd met `unsupported_pdf_reference`.
- In sandboxmodus worden externe `http(s)`-URL's geweigerd.
- Met beleid voor alleen-werkruimtebestanden ingeschakeld, worden lokale bestandspaden buiten toegestane roots geweigerd.
- Beheerde inkomende refs en opnieuw afgespeelde paden onder de inkomende mediaopslag van OpenClaw zijn toegestaan met beleid voor alleen-werkruimtebestanden.

## Uitvoeringsmodi

### Native providermodus

Native modus wordt gebruikt voor provider `anthropic` en `google`.
De tool verzendt ruwe PDF-bytes rechtstreeks naar provider-API's.

Limieten van native modus:

- `pages` wordt niet ondersteund. Indien ingesteld, retourneert de tool een fout.
- `password` wordt niet ondersteund. Gebruik een niet-native model om versleutelde PDF's te analyseren.
- Meervoudige PDF-invoer wordt ondersteund; elke PDF wordt als native documentblok /
  inline PDF-onderdeel vóór de prompt verzonden.

### Terugvalmodus voor extractie

Terugvalmodus wordt gebruikt voor niet-native providers.

Flow:

1. Extraheer tekst uit geselecteerde pagina's (tot `agents.defaults.pdfMaxPages`, standaard `20`).
2. Als de geëxtraheerde tekstlengte minder dan `200` tekens is, render geselecteerde pagina's naar PNG-afbeeldingen en neem ze op.
3. Verstuur geëxtraheerde inhoud plus prompt naar het geselecteerde model.

Terugvaldetails:

- Extractie van pagina-afbeeldingen gebruikt een pixelbudget van `4,000,000`.
- Versleutelde PDF's kunnen worden geopend met de parameter `password` op topniveau.
- Als het doelmodel geen afbeeldingsinvoer ondersteunt en er geen extraheerbare tekst is, geeft de tool een fout.
- Als tekstextractie slaagt maar afbeeldingsextractie vision zou vereisen op een
  tekstmodel, laat OpenClaw de gerenderde afbeeldingen weg en gaat verder met de
  geëxtraheerde tekst.
- Terugval voor extractie gebruikt de gebundelde `document-extract`-Plugin. De Plugin beheert
  `clawpdf`, dat tekstextractie en afbeeldingsrendering biedt via PDFium
  WebAssembly.

## Configuratie

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) voor volledige velddetails.

## Uitvoerdetails

De tool retourneert tekst in `content[0].text` en gestructureerde metadata in `details`.

Algemene `details`-velden:

- `model`: opgeloste modelreferentie (`provider/model`)
- `native`: `true` voor native providermodus, `false` voor terugval
- `attempts`: terugvalpogingen die vóór succes zijn mislukt

Padvelden:

- enkele PDF-invoer: `details.pdf`
- meervoudige PDF-invoer: `details.pdfs[]` met `pdf`-items
- metadata voor herschrijving van sandboxpaden (indien van toepassing): `rewrittenFrom`

## Foutgedrag

- Ontbrekende PDF-invoer: gooit `pdf required: provide a path or URL to a PDF document`
- Te veel PDF's: retourneert gestructureerde fout in `details.error = "too_many_pdfs"`
- Niet-ondersteund referentieschema: retourneert `details.error = "unsupported_pdf_reference"`
- Native modus met `pages`: gooit duidelijke fout `pages is not supported with native PDF providers`

## Voorbeelden

Enkele PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Meerdere PDF's:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Pagina-gefilterd terugvalmodel:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

Versleutelde PDF met terugval voor extractie:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Gerelateerd

- [Toolsoverzicht](/nl/tools) - alle beschikbare agenttools
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) - configuratie voor pdfMaxBytesMb en pdfMaxPages
