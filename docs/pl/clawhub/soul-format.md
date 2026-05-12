---
read_when:
    - Publikowanie dusz
    - Debugowanie niepowodzeń publikacji soul
summary: Format pakietu Soul, wymagane pliki, limity.
x-i18n:
    generated_at: "2026-05-12T04:10:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Format duszy

## Na dysku

Dusza to pojedynczy plik:

- `SOUL.md` (lub `soul.md`)

Na razie onlycrabs.ai odrzuca wszelkie dodatkowe pliki.

## `SOUL.md`

- Markdown z opcjonalnym frontmatter YAML.
- Serwer wyodrębnia metadane z frontmatter podczas publikowania.
- `description` jest używane jako podsumowanie duszy w interfejsie użytkownika/wyszukiwaniu.

## Limity

- Całkowity rozmiar pakietu: 50 MB.
- Tekst do osadzania obejmuje tylko `SOUL.md`.

## Slugi

- Domyślnie wyprowadzane z nazwy folderu.
- Muszą być zapisane małymi literami i bezpieczne dla adresów URL: `^[a-z0-9][a-z0-9-]*$`.

## Wersjonowanie + tagi

- Każde opublikowanie tworzy nową wersję (semver).
- Tagi są wskaźnikami tekstowymi do wersji; często używany jest `latest`.
