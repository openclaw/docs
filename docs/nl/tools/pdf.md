---
read_when:
    - Je wilt PDF's van agenten analyseren
    - Je hebt de exacte parameters en limieten voor de pdf-tool nodig
    - Je debugt de systeemeigen PDF-modus tegenover het terugvalmechanisme voor extractie
summary: Analyseer een of meer PDF-documenten met ingebouwde ondersteuning van aanbieders en een terugvaloptie voor extractie
title: PDF-tool
x-i18n:
    generated_at: "2026-04-29T23:25:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analyseert een of meer PDF-documenten en retourneert tekst.

Snel gedrag:

- Native providermodus voor Anthropic- en Google-modelproviders.
- Extractie-fallbackmodus voor andere providers (eerst tekst extraheren, daarna pagina-afbeeldingen wanneer nodig).
- Ondersteunt enkele (`pdf`) of meervoudige (`pdfs`) invoer, maximaal 10 PDF's per aanroep.

## Beschikbaarheid

De tool wordt alleen geregistreerd wanneer OpenClaw een PDF-geschikte modelconfiguratie voor de agent kan vinden:

1. `agents.defaults.pdfModel`
2. fallback naar `agents.defaults.imageModel`
3. fallback naar het opgeloste sessie-/standaardmodel van de agent
4. als native PDF-providers door authenticatie worden ondersteund, krijgen ze voorrang op generieke image-fallbackkandidaten

Als er geen bruikbaar model kan worden opgelost, wordt de `pdf`-tool niet beschikbaar gemaakt.

Beschikbaarheidsnotities:

- De fallbackketen is authenticatiebewust. Een geconfigureerde `provider/model` telt alleen als
  OpenClaw die provider daadwerkelijk voor de agent kan authenticeren.
- Native PDF-providers zijn momenteel **Anthropic** en **Google**.
- Als de opgeloste sessie-/standaardprovider al een geconfigureerd vision-/PDF-
  model heeft, hergebruikt de PDF-tool dat voordat er wordt teruggevallen op andere door authenticatie ondersteunde
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

<ParamField path="model" type="string">
Optionele modeloverride in `provider/model`-vorm.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Groottelimiet per PDF in MB. Standaard ingesteld op `agents.defaults.pdfMaxBytesMb` of `10`.
</ParamField>

Invoernotities:

- `pdf` en `pdfs` worden samengevoegd en gededupliceerd vóór het laden.
- Als er geen PDF-invoer is opgegeven, geeft de tool een fout.
- `pages` wordt geparseerd als 1-gebaseerde paginanummers, gededupliceerd, gesorteerd en begrensd op het geconfigureerde maximum aantal pagina's.
- `maxBytesMb` is standaard `agents.defaults.pdfMaxBytesMb` of `10`.

## Ondersteunde PDF-referenties

- lokaal bestandspad (inclusief `~`-uitbreiding)
- `file://`-URL
- `http://`- en `https://`-URL
- door OpenClaw beheerde inkomende refs zoals `media://inbound/<id>`

Referentienotities:

- Andere URI-schema's (bijvoorbeeld `ftp://`) worden geweigerd met `unsupported_pdf_reference`.
- In sandboxmodus worden externe `http(s)`-URL's geweigerd.
- Als het bestandsbeleid alleen-werkruimte is ingeschakeld, worden lokale bestandspaden buiten toegestane roots geweigerd.
- Beheerde inkomende refs en opnieuw afgespeelde paden onder de inkomende mediaopslag van OpenClaw zijn toegestaan met het bestandsbeleid alleen-werkruimte.

## Uitvoeringsmodi

### Native providermodus

Native modus wordt gebruikt voor provider `anthropic` en `google`.
De tool stuurt ruwe PDF-bytes rechtstreeks naar provider-API's.

Limieten van native modus:

- `pages` wordt niet ondersteund. Als dit is ingesteld, retourneert de tool een fout.
- Meervoudige PDF-invoer wordt ondersteund; elke PDF wordt als native documentblok /
  inline PDF-deel vóór de prompt verzonden.

### Extractie-fallbackmodus

Fallbackmodus wordt gebruikt voor niet-native providers.

Stroom:

1. Extraheer tekst uit geselecteerde pagina's (tot `agents.defaults.pdfMaxPages`, standaard `20`).
2. Als de geëxtraheerde tekstlengte minder dan `200` tekens is, render de geselecteerde pagina's naar PNG-afbeeldingen en neem ze op.
3. Verstuur geëxtraheerde inhoud plus prompt naar het geselecteerde model.

Fallbackdetails:

- Pagina-afbeeldingsextractie gebruikt een pixelbudget van `4,000,000`.
- Als het doelmodel geen beeldinvoer ondersteunt en er geen extraheerbare tekst is, geeft de tool een fout.
- Als tekstextractie slaagt maar afbeeldingsextractie vision zou vereisen op een
  tekst-only model, laat OpenClaw de gerenderde afbeeldingen weg en gaat door met de
  geëxtraheerde tekst.
- Extractie-fallback gebruikt de gebundelde `document-extract` Plugin. De Plugin bezit
  `pdfjs-dist`; `@napi-rs/canvas` wordt alleen gebruikt wanneer fallback voor afbeeldingsrendering
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

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) voor volledige veldgegevens.

## Uitvoerdetails

De tool retourneert tekst in `content[0].text` en gestructureerde metadata in `details`.

Algemene `details`-velden:

- `model`: opgeloste modelreferentie (`provider/model`)
- `native`: `true` voor native providermodus, `false` voor fallback
- `attempts`: fallbackpogingen die vóór succes zijn mislukt

Padvelden:

- enkele PDF-invoer: `details.pdf`
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

Fallbackmodel met paginafilter:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Gerelateerd

- [Toolsoverzicht](/nl/tools) — alle beschikbare agenttools
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — configuratie voor pdfMaxBytesMb en pdfMaxPages
