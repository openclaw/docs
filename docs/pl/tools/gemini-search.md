---
read_when:
    - Chcesz użyć Gemini do `web_search`
    - Potrzebujesz `GEMINI_API_KEY`
    - Chcesz ugruntowania w Google Search
summary: Wyszukiwanie w sieci Gemini z ugruntowaniem w Google Search
title: Wyszukiwanie Gemini
x-i18n:
    generated_at: "2026-04-24T09:37:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw obsługuje modele Gemini z wbudowanym
[ugruntowaniem w Google Search](https://ai.google.dev/gemini-api/docs/grounding),
które zwraca odpowiedzi syntetyzowane przez AI, oparte na wynikach Google Search na żywo i opatrzone cytatami.

## Uzyskaj klucz API

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
            model: "gemini-2.5-flash", // default
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
W instalacji gateway umieść go w `~/.openclaw/.env`.

## Jak to działa

W przeciwieństwie do tradycyjnych providerów wyszukiwania, którzy zwracają listę linków i snippetów,
Gemini używa ugruntowania w Google Search, aby tworzyć odpowiedzi syntetyzowane przez AI
z cytatami inline. Wyniki zawierają zarówno odpowiedź syntetyzowaną, jak i źródłowe
URL-e.

- URL-e cytowań z ugruntowania Gemini są automatycznie rozwiązywane z URL-i przekierowań Google
  do bezpośrednich URL-i.
- Rozwiązywanie przekierowań używa ścieżki ochronnej SSRF (HEAD + sprawdzanie przekierowań +
  walidacja http/https) przed zwróceniem końcowego URL-a cytowania.
- Rozwiązywanie przekierowań używa ścisłych domyślnych ustawień SSRF, więc przekierowania do
  prywatnych/wewnętrznych celów są blokowane.

## Obsługiwane parametry

Wyszukiwanie Gemini obsługuje `query`.

`count` jest akceptowane dla zgodności ze współdzielonym `web_search`, ale ugruntowanie Gemini
nadal zwraca jedną odpowiedź syntetyzowaną z cytatami zamiast listy N wyników.

Filtry specyficzne dla providera, takie jak `country`, `language`, `freshness` i
`domain_filter`, nie są obsługiwane.

## Wybór modelu

Domyślnym modelem jest `gemini-2.5-flash` (szybki i opłacalny). Można użyć dowolnego modelu Gemini,
który obsługuje grounding, przez
`plugins.entries.google.config.webSearch.model`.

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy providerzy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) -- uporządkowane wyniki ze snippetami
- [Perplexity Search](/pl/tools/perplexity-search) -- uporządkowane wyniki + ekstrakcja treści
