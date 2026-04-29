---
x-i18n:
    generated_at: "2026-04-29T22:22:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1cf417b0c04d001bc494fbe03ac2fcb66866f759e21646dbfd1a9c3a968bff
    source_path: .i18n/README.md
    workflow: 16
---

# OpenClaw-documentatie-i18n-assets

Deze map bevat vertaalconfiguratie voor de brondocumentatierepo.

Gegenereerde localepagina's en live vertaalgeheugen voor locales staan nu in de publicatierepo (`openclaw/docs`, lokale sibling-checkout `~/Projects/openclaw-docs`).

## Bestanden

- `glossary.<lang>.json` — voorkeurstermkoppelingen (gebruikt in promptbegeleiding).
- `<lang>.tm.jsonl` — vertaalgeheugen (cache), gesleuteld op workflow + model + teksthash. In deze repo worden locale-TM-bestanden op aanvraag gegenereerd.

## Glossary-indeling

`glossary.<lang>.json` is een array met vermeldingen:

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

Velden:

- `source`: Engelse (of bron-)zin waaraan de voorkeur moet worden gegeven.
- `target`: gewenste vertaaluitvoer.

## Opmerkingen

- Glossary-vermeldingen worden aan het model doorgegeven als **promptbegeleiding** (geen deterministische herschrijvingen).
- `scripts/docs-i18n` blijft verantwoordelijk voor vertaalgeneratie.
- De bronrepo synchroniseert Engelse documentatie naar de publicatierepo; localegeneratie wordt daar per locale uitgevoerd bij push, volgens schema en bij release-dispatch.
