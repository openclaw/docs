---
read_when:
    - Zielen publiceren
    - Fouten bij het publiceren van soul debuggen
summary: Soul-bundelformaat, vereiste bestanden, limieten.
x-i18n:
    generated_at: "2026-05-12T04:10:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Soul-indeling

## Op schijf

Een soul is één enkel bestand:

- `SOUL.md` (of `soul.md`)

Voorlopig weigert onlycrabs.ai alle extra bestanden.

## `SOUL.md`

- Markdown met optionele YAML-frontmatter.
- De server haalt tijdens het publiceren metadata uit de frontmatter.
- `description` wordt gebruikt als samenvatting van de soul in de UI/zoekfunctie.

## Limieten

- Totale bundelgrootte: 50 MB.
- Inbeddingstekst bevat alleen `SOUL.md`.

## Slugs

- Standaard afgeleid van de mapnaam.
- Moet uit kleine letters bestaan en URL-veilig zijn: `^[a-z0-9][a-z0-9-]*$`.

## Versionering + tags

- Elke publicatie maakt een nieuwe versie aan (semver).
- Tags zijn stringverwijzingen naar een versie; `latest` wordt vaak gebruikt.
