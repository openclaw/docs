---
read_when:
    - Je wilt pdf's van agents analyseren
    - Je hebt de exacte parameters en limieten van de pdf-tool nodig
    - Je debugt de native PDF-modus tegenover de fallback voor extractie
summary: Analyseer een of meer PDF-documenten met systeemeigen providerondersteuning en extractie als terugvaloptie
title: PDF-hulpmiddel
x-i18n:
    generated_at: "2026-07-12T09:24:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analyseert een of meer PDF-documenten en retourneert tekst. Het gebruikt native documentinvoer bij modellen van Anthropic en Google en valt voor elke andere provider terug op tekst- en afbeeldingsextractie.

## Beschikbaarheid

De tool wordt alleen geregistreerd wanneer OpenClaw een PDF-geschikt model voor de agent kan vinden. Volgorde van de resolutie:

1. `agents.defaults.pdfModel` (expliciete primaire optie/terugvalopties)
2. `agents.defaults.imageModel` (expliciete primaire optie/terugvalopties)
3. Het voor de sessie opgeloste model of standaardmodel van de agent, als de provider native PDF-invoer ondersteunt (Anthropic, Google) of al een geconfigureerd vision-model heeft
4. Automatisch gedetecteerde providers met ondersteuning voor afbeeldingen/vision en bruikbare authenticatie, waarbij providers met native PDF-ondersteuning voorrang krijgen

Elke kandidaat-terugvaloptie wordt vóór gebruik gecontroleerd op authenticatie. Een geconfigureerde `provider/model` telt dus alleen mee als OpenClaw die provider voor de agent kan authenticeren. Als er geen bruikbaar model kan worden gevonden, wordt de tool `pdf` niet beschikbaar gesteld.

## Invoerverwijzing

<ParamField path="pdf" type="string">
Eén PDF-pad of één URL.
</ParamField>

<ParamField path="pdfs" type="string[]">
Meerdere PDF-paden of URL's, maximaal 10 in totaal.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analyseprompt.
</ParamField>

<ParamField path="pages" type="string">
Paginafilter zoals `1-5` of `1,3,7-9`. Niet ondersteund in de native providermodus.
</ParamField>

<ParamField path="password" type="string">
Wachtwoord voor versleutelde PDF's. Geldt voor elke PDF in het verzoek en wordt alleen gebruikt in de extractieterugvalmodus.
</ParamField>

<ParamField path="model" type="string">
Optionele modeloverschrijving in de vorm `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Groottelimiet per PDF in MB. Standaard `agents.defaults.pdfMaxBytesMb`, of `10` als deze niet is ingesteld.
</ParamField>

Opmerkingen:

- `pdf` en `pdfs` worden vóór het laden samengevoegd en gededupliceerd; ten minste één van beide is vereist.
- `pages` wordt verwerkt als paginanummers die bij 1 beginnen, vervolgens gededupliceerd en gesorteerd, en begrensd op `agents.defaults.pdfMaxPages` (standaard `20`). Een bereik dat geen enkele geldige pagina bevat, veroorzaakt een fout voordat het model wordt aangeroepen.

## Ondersteunde PDF-verwijzingen

- Lokaal bestandspad (inclusief uitbreiding van `~`)
- `file://`-URL
- `http://`- en `https://`-URL
- Door OpenClaw beheerde verwijzingen naar inkomende bestanden, zoals `media://inbound/<id>`

Andere URI-schema's (bijvoorbeeld `ftp://`) retourneren `details.error = "unsupported_pdf_reference"`. Externe `http(s)`-URL's worden geweigerd wanneer de tool in een sandbox wordt uitgevoerd. Als het bestandsbeleid alleen de werkruimte toestaat, worden lokale paden buiten de toegestane hoofdmappen geweigerd; beheerde verwijzingen naar inkomende bestanden en opnieuw afgespeelde paden binnen OpenClaws opslag voor inkomende media blijven toegestaan.

## Uitvoeringsmodi

### Native providermodus

Wordt gebruikt voor de providers `anthropic` en `google` (de enige providers die momenteel native ondersteuning voor PDF-documenten declareren). De onbewerkte PDF-bytes gaan per bestand rechtstreeks naar de provider-API als een native document- of inline-PDF-onderdeel.

Limieten:

- `pages` wordt niet ondersteund; als dit is ingesteld, genereert de tool de fout `pages is not supported with native PDF providers`.
- `password` wordt niet ondersteund; als dit is ingesteld, genereert de tool de fout `password is not supported with native PDF providers`. Gebruik voor versleutelde PDF's een niet-native model.

### Extractieterugvalmodus

Wordt gebruikt voor elke andere provider.

1. Extraheer tekst uit de geselecteerde pagina's (maximaal `agents.defaults.pdfMaxPages`, standaard `20`) via de meegeleverde Plugin `document-extract`, die het pakket `clawpdf` (PDFium WebAssembly) gebruikt voor tekst- en afbeeldingsextractie.
2. Als de geëxtraheerde tekst korter is dan `200` tekens, worden dezelfde pagina's als PNG-afbeeldingen gerenderd. Het renderbudget bedraagt in totaal `4,000,000` pixels en wordt gedeeld over alle pagina's waarvoor afbeeldingen nodig zijn (evenredig verdeeld per resterende pagina, niet per afzonderlijke pagina). Tekstpagina's die al voldoende tekst bevatten, worden dus helemaal niet gerenderd.
3. Stuur de geëxtraheerde tekst (en eventueel gerenderde afbeeldingen) samen met de prompt naar het geselecteerde model.

Details:

- Versleutelde PDF's worden geopend met de parameter `password` op het hoogste niveau.
- Als het model geen afbeeldingsinvoer ondersteunt en er geen tekst kan worden geëxtraheerd, retourneert de tool een fout.
- Als het renderen van afbeeldingen mislukt, laat OpenClaw de afbeeldingen weg en gaat het verder met de geëxtraheerde tekst.
- Als het doelmodel alleen tekst ondersteunt en de extractie afbeeldingen heeft opgeleverd, laat OpenClaw de afbeeldingen weg en stuurt het alleen tekst.

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

| Sleutel                         | Standaard      | Betekenis                                                                                                        |
| ------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | niet ingesteld | Expliciete primaire PDF-modellen/terugvalmodellen; valt terug op `imageModel` en daarna op het sessiemodel.       |
| `agents.defaults.pdfMaxBytesMb` | `10`           | Groottelimiet per PDF in MB.                                                                                     |
| `agents.defaults.pdfMaxPages`   | `20`           | Maximaal aantal verwerkte pagina's per PDF.                                                                      |

Zie [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) voor volledige details over de velden.

## Uitvoerdetails

De tool retourneert tekst in `content[0].text` en gestructureerde metagegevens in `details`.

Veelvoorkomende velden in `details`:

- `model`: opgeloste modelverwijzing (`provider/model`)
- `native`: `true` voor de native providermodus, `false` voor de terugvalmodus
- `attempts`: terugvalpogingen die vóór het slagen zijn mislukt

Padvelden:

- Invoer met één PDF: `details.pdf`
- Invoer met meerdere PDF's: `details.pdfs[]` met `pdf`-items
- Metagegevens over herschreven sandboxpaden (indien van toepassing): `rewrittenFrom`

## Foutgedrag

| Voorwaarde                       | Resultaat                                                      |
| -------------------------------- | -------------------------------------------------------------- |
| Geen PDF-invoer                  | Genereert `pdf required: provide a path or URL to a PDF document` |
| Meer dan 10 PDF's                | `details.error = "too_many_pdfs"`                              |
| Niet-ondersteund verwijzingsschema | `details.error = "unsupported_pdf_reference"`                |
| `pages` met een native provider  | Genereert `pages is not supported with native PDF providers`  |
| `password` met een native provider | Genereert `password is not supported with native PDF providers` |

## Voorbeelden

Eén PDF:

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

Versleutelde PDF met extractieterugval:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Gerelateerd

- [Overzicht van tools](/nl/tools) - alle beschikbare agenttools
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) - configuratie van pdfMaxBytesMb en pdfMaxPages
