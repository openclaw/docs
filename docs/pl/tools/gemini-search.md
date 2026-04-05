---
read_when:
    - Chcesz używać Gemini dla web_search
    - Potrzebujesz `GEMINI_API_KEY`
    - Chcesz używać osadzania w Google Search
summary: Wyszukiwanie Gemini z osadzaniem w Google Search
title: Gemini Search
x-i18n:
    generated_at: "2026-04-05T14:07:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Gemini Search

OpenClaw obsługuje modele Gemini z wbudowanym
[osadzaniem w Google Search](https://ai.google.dev/gemini-api/docs/grounding),
które zwraca odpowiedzi syntetyzowane przez AI na podstawie wyników Google Search na żywo wraz z
cytowaniami.

## Pobierz klucz API

<Steps>
  <Step title="Utwórz klucz">
    Przejdź do [Google AI Studio](https://aistudio.google.com/apikey) i utwórz
    klucz API.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `GEMINI_API_KEY` w środowisku Gateway albo skonfiguruj przez:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opcjonalne, jeśli ustawiono GEMINI_API_KEY
            model: "gemini-2.5-flash", // domyślnie
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Alternatywa środowiskowa:** ustaw `GEMINI_API_KEY` w środowisku Gateway.
W przypadku instalacji gateway umieść ją w `~/.openclaw/.env`.

## Jak to działa

W przeciwieństwie do tradycyjnych providerów wyszukiwania, którzy zwracają listę linków i fragmentów,
Gemini używa osadzania w Google Search do tworzenia odpowiedzi syntetyzowanych przez AI z
cytowaniami inline. Wyniki obejmują zarówno odpowiedź syntetyzowaną, jak i źródłowe
adresy URL.

- Adresy URL cytowań z osadzania Gemini są automatycznie rozwiązywane z adresów
  przekierowań Google do bezpośrednich adresów URL.
- Rozwiązywanie przekierowań używa ścieżki ochrony SSRF (HEAD + sprawdzanie przekierowań +
  walidacja http/https) przed zwróceniem końcowego adresu URL cytowania.
- Rozwiązywanie przekierowań używa ścisłych domyślnych ustawień SSRF, więc przekierowania do
  prywatnych/wewnętrznych celów są blokowane.

## Obsługiwane parametry

Wyszukiwanie Gemini obsługuje `query`.

`count` jest akceptowane dla współdzielonej zgodności z `web_search`, ale osadzanie Gemini
nadal zwraca jedną odpowiedź syntetyzowaną z cytowaniami zamiast listy N
wyników.

Filtry specyficzne dla providera, takie jak `country`, `language`, `freshness` i
`domain_filter`, nie są obsługiwane.

## Wybór modelu

Domyślnym modelem jest `gemini-2.5-flash` (szybki i opłacalny). Każdy model Gemini,
który obsługuje grounding, może być używany przez
`plugins.entries.google.config.webSearch.model`.

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy providerzy i automatyczne wykrywanie
- [Brave Search](/tools/brave-search) -- wyniki strukturalne z fragmentami
- [Perplexity Search](/tools/perplexity-search) -- wyniki strukturalne + ekstrakcja treści
