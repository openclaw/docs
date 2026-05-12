---
read_when:
    - Zielen publiceren
    - Fouten opsporen bij mislukte soul-publicaties
summary: Soul-bundelformaat, vereiste bestanden, limieten.
x-i18n:
    generated_at: "2026-05-12T12:49:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Soul-indeling

## Op schijf

Een soul is één bestand:

- `SOUL.md` (of `soul.md`)

Voorlopig weigert onlycrabs.ai alle extra bestanden.

## `SOUL.md`

- Markdown met optionele YAML-frontmatter.
- De server extraheert metadata uit frontmatter tijdens het publiceren.
- `description` wordt gebruikt als de samenvatting van de soul in de UI/zoekfunctie.

## Limieten

- Totale bundelgrootte: 50 MB.
- Embeddingtekst bevat alleen `SOUL.md`.

## Slugs

- Standaard afgeleid van de mapnaam.
- Moet in kleine letters zijn en URL-veilig: `^[a-z0-9][a-z0-9-]*$`.

## Versiebeheer + tags

- Elke publicatie maakt een nieuwe versie aan (semver).
- Tags zijn tekenreeksverwijzingen naar een versie; `latest` wordt vaak gebruikt.
