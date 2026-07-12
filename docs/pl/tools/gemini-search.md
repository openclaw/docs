---
read_when:
    - Chcesz używać Gemini do web_search
    - Potrzebujesz `GEMINI_API_KEY` lub `models.providers.google.apiKey`
    - Chcesz ugruntowania w wyszukiwarce Google
summary: Wyszukiwanie internetowe Gemini z ugruntowaniem w wyszukiwarce Google
title: Wyszukiwanie Gemini
x-i18n:
    generated_at: "2026-07-12T15:42:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw obsługuje modele Gemini z wbudowanym
[ugruntowaniem w wyszukiwarce Google](https://ai.google.dev/gemini-api/docs/grounding),
które zwraca odpowiedzi syntetyzowane przez AI na podstawie aktualnych wyników wyszukiwania Google
wraz z cytowaniami.

## Uzyskiwanie klucza API

<Steps>
  <Step title="Utwórz klucz">
    Przejdź do [Google AI Studio](https://aistudio.google.com/apikey) i utwórz
    klucz API.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `GEMINI_API_KEY` w środowisku Gateway, użyj ponownie
    `models.providers.google.apiKey` lub skonfiguruj osobny klucz do wyszukiwania w internecie za pomocą:

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
            apiKey: "AIza...", // opcjonalne, jeśli ustawiono GEMINI_API_KEY lub models.providers.google.apiKey
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // opcjonalne; w przeciwnym razie używa models.providers.google.baseUrl
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

**Kolejność pierwszeństwa poświadczeń:** wyszukiwanie internetowe Gemini używa najpierw
`plugins.entries.google.config.webSearch.apiKey`, następnie `GEMINI_API_KEY`,
a na końcu `models.providers.google.apiKey`. W przypadku bazowych adresów URL osobny
`plugins.entries.google.config.webSearch.baseUrl` ma pierwszeństwo przed
`models.providers.google.baseUrl`.

W instalacji Gateway umieść klucze środowiskowe w `~/.openclaw/.env`.

## Jak to działa

W przeciwieństwie do tradycyjnych dostawców wyszukiwania, którzy zwracają listę odnośników i fragmentów,
Gemini wykorzystuje ugruntowanie w wyszukiwarce Google do generowania odpowiedzi syntetyzowanych przez AI
z cytowaniami w tekście. Wyniki zawierają zarówno zsyntetyzowaną odpowiedź, jak i adresy URL
źródeł.

- Adresy URL cytowań z ugruntowania Gemini są automatycznie przekształcane z adresów
  przekierowań Google na bezpośrednie adresy URL za pomocą żądania HEAD wykonywanego przez chronioną przed SSRF
  ścieżkę pobierania OpenClaw (obsługa przekierowań, weryfikacja http/https).
- Rozwiązywanie przekierowań korzysta z rygorystycznych domyślnych zabezpieczeń przed SSRF, dlatego przekierowania do
  celów prywatnych lub wewnętrznych są blokowane.

## Obsługiwane parametry

Wyszukiwanie Gemini obsługuje parametry `query`, `freshness`, `date_after` i `date_before`.

Parametr `count` jest akceptowany w celu zapewnienia zgodności ze wspólnym interfejsem `web_search`, ale ugruntowanie Gemini
nadal zwraca jedną zsyntetyzowaną odpowiedź z cytowaniami zamiast listy
N wyników.

Parametr `freshness` przyjmuje wartości `day`, `week`, `month`, `year` oraz wspólne skróty
`pd`, `pw`, `pm` i `py`. Wartość `day`/`pd` dodaje do zapytania Gemini instrukcję dotyczącą aktualności
zamiast sztywnego zakresu 24 godzin. Wartości `week`, `month`, `year` oraz jawne
zakresy `date_after`/`date_before` ustawiają `timeRangeFilter` ugruntowania
wyszukiwarki Google w Gemini. Parametry `country`, `language` i `domain_filter` nie są obsługiwane.

## Wybór modelu

Domyślnym modelem jest `gemini-2.5-flash` (szybki i ekonomiczny). Za pomocą
`plugins.entries.google.config.webSearch.model` można użyć dowolnego modelu Gemini,
który obsługuje ugruntowanie.

## Nadpisywanie bazowego adresu URL

Ustaw `plugins.entries.google.config.webSearch.baseUrl`, gdy wyszukiwanie internetowe Gemini
musi być kierowane przez serwer proxy operatora lub niestandardowy punkt końcowy zgodny z Gemini. Jeśli
ta wartość nie jest ustawiona, wyszukiwanie internetowe Gemini ponownie używa `models.providers.google.baseUrl`. Zwykła
wartość `https://generativelanguage.googleapis.com` jest normalizowana do
`https://generativelanguage.googleapis.com/v1beta`; niestandardowe ścieżki serwerów proxy są zachowywane
w podanej postaci po usunięciu końcowych ukośników.

## Powiązane materiały

- [Omówienie wyszukiwania w internecie](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) -- uporządkowane wyniki z fragmentami
- [Perplexity Search](/pl/tools/perplexity-search) -- uporządkowane wyniki i wyodrębnianie treści
