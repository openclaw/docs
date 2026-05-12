---
read_when:
    - Zielen publiceren
    - Fouten bij soul publish debuggen
summary: Soul-bundelindeling, vereiste bestanden, limieten.
x-i18n:
    generated_at: "2026-05-12T08:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Soul-formaat

## Op schijf

Een soul is één bestand:

- `SOUL.md` (of `soul.md`)

Voorlopig weigert onlycrabs.ai alle extra bestanden.

## `SOUL.md`

- Markdown met optionele YAML-frontmatter.
- De server extraheert metadata uit frontmatter tijdens het publiceren.
- `description` wordt gebruikt als de soul-samenvatting in de UI/zoekfunctie.

## Limieten

- Totale bundelgrootte: 50MB.
- Ingesloten tekst omvat alleen `SOUL.md`.

## Slugs

- Standaard afgeleid van de mapnaam.
- Moet kleine letters bevatten en URL-veilig zijn: `^[a-z0-9][a-z0-9-]*$`.

## Versiebeheer + tags

- Elke publicatie maakt een nieuwe versie aan (semver).
- Tags zijn stringverwijzingen naar een versie; `latest` wordt vaak gebruikt.
