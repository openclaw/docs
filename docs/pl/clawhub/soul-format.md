---
read_when:
    - Publikowanie dusz
    - Debugowanie błędów soul publish
summary: Format pakietu Soul, wymagane pliki, limity.
x-i18n:
    generated_at: "2026-05-12T23:29:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Format duszy

## Na dysku

Dusza jest pojedynczym plikiem:

- `SOUL.md` (lub `soul.md`)

Na razie onlycrabs.ai odrzuca wszelkie dodatkowe pliki.

## `SOUL.md`

- Markdown z opcjonalnym frontmatter YAML.
- Serwer wyodrębnia metadane z frontmatter podczas publikacji.
- `description` jest używane jako podsumowanie duszy w interfejsie użytkownika/wyszukiwaniu.

## Limity

- Całkowity rozmiar pakietu: 50 MB.
- Tekst do osadzania obejmuje tylko `SOUL.md`.

## Slugi

- Domyślnie pochodzą od nazwy folderu.
- Muszą być zapisane małymi literami i bezpieczne do użycia w URL: `^[a-z0-9][a-z0-9-]*$`.

## Wersjonowanie + tagi

- Każda publikacja tworzy nową wersję (semver).
- Tagi są tekstowymi wskaźnikami do wersji; często używa się `latest`.
