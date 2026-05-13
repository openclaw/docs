---
read_when:
    - Zielen publiceren
    - Fouten opsporen bij soul publish-fouten
summary: Soul-bundelformaat, vereiste bestanden, limieten.
x-i18n:
    generated_at: "2026-05-13T02:52:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Soul-formaat

## Op schijf

Een soul is een enkel bestand:

- `SOUL.md` (of `soul.md`)

Voorlopig weigert onlycrabs.ai alle extra bestanden.

## `SOUL.md`

- Markdown met optionele YAML-frontmatter.
- De server haalt tijdens publicatie metadata uit de frontmatter.
- `description` wordt gebruikt als de soul-samenvatting in de UI/zoekfunctie.

## Limieten

- Totale bundelgrootte: 50 MB.
- Embedding-tekst omvat alleen `SOUL.md`.

## Slugs

- Standaard afgeleid van de mapnaam.
- Moet klein geschreven en URL-veilig zijn: `^[a-z0-9][a-z0-9-]*$`.

## Versiebeheer + tags

- Elke publicatie maakt een nieuwe versie aan (semver).
- Tags zijn tekenreeksverwijzingen naar een versie; `latest` wordt vaak gebruikt.
