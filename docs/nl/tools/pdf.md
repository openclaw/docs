---
read_when:
    - Je wilt PDF's van agenten analyseren
    - Je hebt exacte parameters en limieten voor het pdf-hulpmiddel nodig
    - Je debugt de systeemeigen PDF-modus tegenover de terugval op extractie
summary: Analyseer een of meer PDF-documenten met ingebouwde aanbiederondersteuning en extractie als terugvaloptie
title: PDF-tool
x-i18n:
    generated_at: "2026-05-06T09:37:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analyseert een of meer PDF-documenten en retourneert tekst.

Kort gedrag:

- Native providermodus voor Anthropic- en Google-modelproviders.
- Extractie-terugvalmodus voor andere providers (eerst tekst extraheren, daarna pagina-afbeeldingen wanneer nodig).
- Ondersteunt enkelvoudige (`pdf`) of meervoudige (`pdfs`) invoer, maximaal 10 PDF's per aanroep.

## Beschikbaarheid

De tool wordt alleen geregistreerd wanneer OpenClaw een PDF-geschikte modelconfiguratie voor de agent kan vinden:

1. `agents.defaults.pdfModel`
2. terugval naar `agents.defaults.imageModel`
3. terugval naar het opgeloste sessie-/standaardmodel van de agent
4. als native-PDF-providers door authenticatie worden ondersteund, krijgen die de voorkeur boven algemene image-terugvalkandidaten

Als er geen bruikbaar model kan worden opgelost, wordt de `pdf`-tool niet beschikbaar gemaakt.

Beschikbaarheidsopmerkingen:

- De terugvalketen is authenticatiebewust. Een geconfigureerde `provider/model` telt alleen mee als
  OpenClaw die provider daadwerkelijk voor de agent kan authenticeren.
- Native PDF-providers zijn momenteel **Anthropic** en **Google**.
- Als de opgeloste sessie-/standaardprovider al een geconfigureerd vision/PDF-
  model heeft, hergebruikt de PDF-tool dat voordat wordt teruggevallen op andere door authenticatie ondersteunde
  providers.

## Invoerreferentie

<ParamField path="pdf" type="string">
Een PDF-pad of URL.
</ParamField>

<ParamField path="pdfs" type="string[]">
Meerdere PDF-paden of URL's, maximaal 10 in totaal.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analyseprompt.
</ParamField>

<ParamField path="pages" type="string">
Paginafilter zoals `1-5` of `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Optionele model-override in `provider/model`-vorm.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Groottelimiet per PDF in MB. Standaard ingesteld op `agents.defaults.pdfMaxBytesMb` of `10`.
</ParamField>

Invoeropmerkingen:

- `pdf` en `pdfs` worden samengevoegd en gededupliceerd voordat ze worden geladen.
- Als er geen PDF-invoer wordt opgegeven, geeft de tool een fout.
- `pages` wordt geparseerd als paginanummers op basis van 1, gededupliceerd, gesorteerd en begrensd op het geconfigureerde maximumaantal pagina's.
- `maxBytesMb` is standaard `agents.defaults.pdfMaxBytesMb` of `10`.

## Ondersteunde PDF-referenties

- lokaal bestandspad (inclusief `~`-uitbreiding)
- `file://`-URL
- `http://`- en `https://`-URL
- door OpenClaw beheerde inkomende refs zoals `media://inbound/<id>`

Referentieopmerkingen:

- Andere URI-schema's (bijvoorbeeld `ftp://`) worden geweigerd met `unsupported_pdf_reference`.
- In sandboxmodus worden externe `http(s)`-URL's geweigerd.
- Als workspace-only bestandsbeleid is ingeschakeld, worden lokale bestandspaden buiten toegestane roots geweigerd.
- Beheerde inkomende refs en opnieuw afgespeelde paden onder OpenClaw's opslag voor inkomende media zijn toegestaan met workspace-only bestandsbeleid.

## Uitvoeringsmodi

### Native providermodus

Native modus wordt gebruikt voor provider `anthropic` en `google`.
De tool stuurt ruwe PDF-bytes rechtstreeks naar provider-API's.

Limieten van native modus:

- `pages` wordt niet ondersteund. Als dit is ingesteld, retourneert de tool een fout.
- Meervoudige PDF-invoer wordt ondersteund; elke PDF wordt als native documentblok /
  inline PDF-onderdeel vóór de prompt verzonden.

### Extractie-terugvalmodus

Terugvalmodus wordt gebruikt voor niet-native providers.

Proces:

1. Extraheer tekst uit geselecteerde pagina's (tot `agents.defaults.pdfMaxPages`, standaard `20`).
2. Als de lengte van de geëxtraheerde tekst minder dan `200` tekens is, render dan geselecteerde pagina's naar PNG-afbeeldingen en voeg die toe.
3. Stuur geëxtraheerde inhoud plus prompt naar het geselecteerde model.

Terugvaldetails:

- Extractie van pagina-afbeeldingen gebruikt een pixelbudget van `4,000,000`.
- Als het doelmodel geen image-invoer ondersteunt en er geen extraheerbare tekst is, geeft de tool een fout.
- Als tekstextractie slaagt maar afbeeldingsextractie vision op een
  text-only model zou vereisen, laat OpenClaw de gerenderde afbeeldingen vallen en gaat het verder met de
  geëxtraheerde tekst.
- Extractie-terugval gebruikt de gebundelde `document-extract`-plugin. De plugin beheert
  `pdfjs-dist`; `@napi-rs/canvas` wordt alleen gebruikt wanneer terugval naar afbeeldingsrendering
  beschikbaar is.

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

Veelvoorkomende `details`-velden:

- `model`: opgeloste modelreferentie (`provider/model`)
- `native`: `true` voor native providermodus, `false` voor terugval
- `attempts`: terugvalpogingen die mislukten vóór succes

Padvelden:

- enkelvoudige PDF-invoer: `details.pdf`
- meervoudige PDF-invoer: `details.pdfs[]` met `pdf`-items
- metadata voor herschrijven van sandboxpaden (indien van toepassing): `rewrittenFrom`

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

Terugvalmodel met paginafilter:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Gerelateerd

- [Toolsoverzicht](/nl/tools) - alle beschikbare agenttools
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) - configuratie voor pdfMaxBytesMb en pdfMaxPages
