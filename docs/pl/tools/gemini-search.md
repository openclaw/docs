---
read_when:
    - Chcesz używać Gemini do web_search
    - Potrzebujesz GEMINI_API_KEY lub models.providers.google.apiKey
    - Chcesz korzystać z ugruntowania w Google Search
summary: Wyszukiwanie Gemini w internecie z ugruntowaniem za pomocą Google Search
title: Wyszukiwanie Gemini
x-i18n:
    generated_at: "2026-05-02T10:04:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw obsługuje modele Gemini z wbudowanym
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding),
które zwraca syntetyzowane przez AI odpowiedzi oparte na bieżących wynikach Google Search z
cytowaniami.

## Uzyskaj klucz API

<Steps>
  <Step title="Utwórz klucz">
    Przejdź do [Google AI Studio](https://aistudio.google.com/apikey) i utwórz
    klucz API.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `GEMINI_API_KEY` w środowisku Gateway, użyj ponownie
    `models.providers.google.apiKey` albo skonfiguruj dedykowany klucz wyszukiwania w sieci za pomocą:

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
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

**Priorytet danych uwierzytelniających:** wyszukiwanie w sieci Gemini najpierw używa
`plugins.entries.google.config.webSearch.apiKey`, następnie `GEMINI_API_KEY`,
a potem `models.providers.google.apiKey`. W przypadku bazowych adresów URL dedykowane
`plugins.entries.google.config.webSearch.baseUrl` ma pierwszeństwo przed
`models.providers.google.baseUrl`.

W instalacji Gateway umieść klucze środowiskowe w `~/.openclaw/.env`.

## Jak to działa

W przeciwieństwie do tradycyjnych dostawców wyszukiwania, którzy zwracają listę linków i fragmentów,
Gemini używa Google Search grounding do generowania syntetyzowanych przez AI odpowiedzi z
cytowaniami w treści. Wyniki zawierają zarówno zsyntetyzowaną odpowiedź, jak i źródłowe
adresy URL.

- Adresy URL cytowań z Gemini grounding są automatycznie rozwiązywane z adresów przekierowań Google
  na bezpośrednie adresy URL.
- Rozwiązywanie przekierowań używa ścieżki ochrony przed SSRF (HEAD + kontrole przekierowań +
  walidacja http/https) przed zwróceniem końcowego adresu URL cytowania.
- Rozwiązywanie przekierowań używa rygorystycznych domyślnych ustawień SSRF, więc przekierowania do
  prywatnych/wewnętrznych celów są blokowane.

## Obsługiwane parametry

Wyszukiwanie Gemini obsługuje `query`, `freshness`, `date_after` i `date_before`.

`count` jest akceptowane dla zgodności ze wspólnym `web_search`, ale Gemini grounding
nadal zwraca jedną zsyntetyzowaną odpowiedź z cytowaniami zamiast listy N wyników.

`freshness` akceptuje `day`, `week`, `month`, `year` oraz wspólne skróty
`pd`, `pw`, `pm` i `py`. OpenClaw konwertuje te wartości lub jawny zakres
`date_after`/`date_before` na `timeRangeFilter` w Gemini Google Search grounding.
`country`, `language` i `domain_filter` nie są obsługiwane.

## Wybór modelu

Domyślny model to `gemini-2.5-flash` (szybki i opłacalny). Dowolny model Gemini,
który obsługuje grounding, może być użyty przez
`plugins.entries.google.config.webSearch.model`.

## Nadpisania bazowego adresu URL

Ustaw `plugins.entries.google.config.webSearch.baseUrl`, gdy wyszukiwanie w sieci Gemini
musi przechodzić przez proxy operatora lub niestandardowy punkt końcowy zgodny z Gemini. Jeśli
ta wartość nie jest ustawiona, wyszukiwanie w sieci Gemini ponownie używa `models.providers.google.baseUrl`. Zwykła
wartość `https://generativelanguage.googleapis.com` jest normalizowana do
`https://generativelanguage.googleapis.com/v1beta`; niestandardowe ścieżki proxy są zachowywane
zgodnie z podaną wartością po usunięciu końcowych ukośników.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) -- ustrukturyzowane wyniki z fragmentami
- [Perplexity Search](/pl/tools/perplexity-search) -- ustrukturyzowane wyniki + ekstrakcja treści
