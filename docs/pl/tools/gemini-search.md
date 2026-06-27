---
read_when:
    - Chcesz użyć Gemini do web_search
    - Potrzebujesz GEMINI_API_KEY lub models.providers.google.apiKey
    - Chcesz ugruntowania w Google Search
summary: Wyszukiwanie w sieci Gemini z ugruntowaniem Google Search
title: Wyszukiwanie Gemini
x-i18n:
    generated_at: "2026-06-27T18:27:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw obsługuje modele Gemini z wbudowanym
[ugruntowaniem Google Search](https://ai.google.dev/gemini-api/docs/grounding),
które zwraca odpowiedzi syntetyzowane przez AI, oparte na aktualnych wynikach
Google Search z cytowaniami.

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

**Pierwszeństwo poświadczeń:** wyszukiwanie w sieci Gemini używa najpierw
`plugins.entries.google.config.webSearch.apiKey`, następnie `GEMINI_API_KEY`,
a potem `models.providers.google.apiKey`. W przypadku bazowych adresów URL
dedykowane `plugins.entries.google.config.webSearch.baseUrl` ma pierwszeństwo
przed `models.providers.google.baseUrl`.

W instalacji Gateway umieść klucze środowiskowe w `~/.openclaw/.env`.

## Jak to działa

W przeciwieństwie do tradycyjnych dostawców wyszukiwania, którzy zwracają listę linków i fragmentów,
Gemini używa ugruntowania Google Search do tworzenia odpowiedzi syntetyzowanych przez AI
z cytowaniami w treści. Wyniki obejmują zarówno zsyntetyzowaną odpowiedź, jak i źródłowe
adresy URL.

- Adresy URL cytowań z ugruntowania Gemini są automatycznie rozwiązywane z adresów
  przekierowań Google na bezpośrednie adresy URL.
- Rozwiązywanie przekierowań używa ścieżki ochrony SSRF (HEAD + sprawdzanie przekierowań +
  walidacja http/https) przed zwróceniem końcowego adresu URL cytowania.
- Rozwiązywanie przekierowań używa rygorystycznych domyślnych ustawień SSRF, więc przekierowania do
  prywatnych/wewnętrznych celów są blokowane.

## Obsługiwane parametry

Wyszukiwanie Gemini obsługuje `query`, `freshness`, `date_after` i `date_before`.

`count` jest akceptowane dla zgodności ze wspólnym `web_search`, ale ugruntowanie Gemini
nadal zwraca jedną zsyntetyzowaną odpowiedź z cytowaniami, a nie listę
N wyników.

`freshness` akceptuje `day`, `week`, `month`, `year` oraz wspólne skróty
`pd`, `pw`, `pm` i `py`. `day`/`pd` dodaje do zapytania Gemini instrukcję aktualności
zamiast sztywnego zakresu 24 godzin. `week`, `month`, `year` oraz jawne zakresy
`date_after`/`date_before` ustawiają `timeRangeFilter` ugruntowania Gemini Google Search.
`country`, `language` i `domain_filter` nie są obsługiwane.

## Wybór modelu

Domyślnym modelem jest `gemini-2.5-flash` (szybki i opłacalny). Dowolny model Gemini,
który obsługuje ugruntowanie, może być używany przez
`plugins.entries.google.config.webSearch.model`.

## Nadpisania bazowego adresu URL

Ustaw `plugins.entries.google.config.webSearch.baseUrl`, gdy wyszukiwanie w sieci Gemini
musi przechodzić przez proxy operatora lub niestandardowy punkt końcowy zgodny z Gemini. Jeśli
ta wartość nie jest ustawiona, wyszukiwanie w sieci Gemini używa ponownie `models.providers.google.baseUrl`. Zwykła
wartość `https://generativelanguage.googleapis.com` jest normalizowana do
`https://generativelanguage.googleapis.com/v1beta`; niestandardowe ścieżki proxy są zachowywane
w podanej postaci po przycięciu końcowych ukośników.

## Powiązane

- [Omówienie wyszukiwania w sieci](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) -- ustrukturyzowane wyniki z fragmentami
- [Perplexity Search](/pl/tools/perplexity-search) -- ustrukturyzowane wyniki + wyodrębnianie treści
