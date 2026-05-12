---
read_when:
    - Zielen publiceren
    - Fouten bij soul-publicatie debuggen
summary: Soul-bundelindeling, vereiste bestanden, limieten.
x-i18n:
    generated_at: "2026-05-12T15:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Zielformaat

## Op schijf

Een ziel is één bestand:

- `SOUL.md` (of `soul.md`)

Voorlopig weigert onlycrabs.ai alle extra bestanden.

## `SOUL.md`

- Markdown met optionele YAML-frontmatter.
- De server haalt metadata uit de frontmatter tijdens het publiceren.
- `description` wordt gebruikt als de samenvatting van de ziel in de UI/zoekfunctie.

## Limieten

- Totale bundelgrootte: 50 MB.
- Inbeddingstekst bevat alleen `SOUL.md`.

## Slugs

- Standaard afgeleid van de mapnaam.
- Moeten kleine letters gebruiken en URL-veilig zijn: `^[a-z0-9][a-z0-9-]*$`.

## Versionering + tags

- Elke publicatie maakt een nieuwe versie aan (semver).
- Tags zijn tekenreeksverwijzingen naar een versie; `latest` wordt vaak gebruikt.
