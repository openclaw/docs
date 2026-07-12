---
read_when:
    - Chcesz używać Exa do web_search
    - Potrzebujesz klucza EXA_API_KEY
    - Potrzebujesz wyszukiwania neuronowego lub wyodrębniania treści
summary: Wyszukiwanie Exa AI — wyszukiwanie neuronowe i według słów kluczowych z wyodrębnianiem treści
title: Wyszukiwanie Exa
x-i18n:
    generated_at: "2026-07-12T15:38:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) jest dostawcą `web_search` oferującym neuronowe, słowne i hybrydowe tryby wyszukiwania oraz wbudowane wyodrębnianie treści (najważniejsze fragmenty, tekst, podsumowania).

## Instalacja Pluginu

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Uzyskanie klucza API

<Steps>
  <Step title="Utwórz konto">
    Zarejestruj się w serwisie [exa.ai](https://exa.ai/) i wygeneruj klucz API w swoim panelu.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `EXA_API_KEY` w środowisku Gateway lub skonfiguruj go za pomocą polecenia:

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // opcjonalne, jeśli ustawiono EXA_API_KEY
            baseUrl: "https://api.exa.ai", // opcjonalne; OpenClaw dołącza /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternatywa za pomocą zmiennej środowiskowej:** ustaw `EXA_API_KEY` w środowisku Gateway. W przypadku instalacji Gateway umieść ją w pliku `~/.openclaw/.env`. Zobacz [Zmienne środowiskowe](/pl/help/faq#env-vars-and-env-loading).

## Zastępowanie bazowego adresu URL

Ustaw `plugins.entries.exa.config.webSearch.baseUrl`, aby kierować żądania wyszukiwania Exa przez zgodny serwer proxy lub alternatywny punkt końcowy. OpenClaw normalizuje same nazwy hostów, dodając przed nimi `https://`, oraz dołącza `/search`, chyba że ścieżka już się nim kończy. Rozpoznany punkt końcowy jest częścią klucza pamięci podręcznej wyszukiwania, dlatego wyniki z różnych punktów końcowych nigdy nie są współdzielone.

## Parametry narzędzia

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number" default="5">
Liczba zwracanych wyników (1–100, z uwzględnieniem ograniczeń typu wyszukiwania Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Tryb wyszukiwania.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtr czasu. Nie można go łączyć z `date_after`/`date_before`.
</ParamField>

<ParamField path="date_after" type="string">
Wyniki po tej dacie (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Wyniki sprzed tej daty (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opcje wyodrębniania treści (patrz poniżej).
</ParamField>

### Wyodrębnianie treści

Przekaż obiekt `contents`, aby określić wyodrębnianą treść w wynikach:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // pełny tekst strony
    highlights: { numSentences: 3 }, // kluczowe zdania
    summary: true, // podsumowanie wygenerowane przez AI
  },
});
```

| Opcja zawartości | Typ                                                                   | Opis                         |
| ---------------- | --------------------------------------------------------------------- | ---------------------------- |
| `text`           | `boolean \| { maxCharacters }`                                        | Wyodrębnij pełny tekst strony |
| `highlights`     | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Wyodrębnij kluczowe zdania   |
| `summary`        | `boolean \| { query }`                                                | Podsumowanie wygenerowane przez AI |

Jeśli parametr `contents` zostanie pominięty, Exa domyślnie użyje wartości `{ highlights: true }`, dzięki czemu wyniki będą zawierać fragmenty z kluczowymi zdaniami. Opisy wyników są pobierane najpierw z najważniejszych fragmentów, następnie z podsumowania, a na końcu z pełnego tekstu — zależnie od tego, która wartość jest dostępna jako pierwsza. Wyniki zachowują również nieprzetworzone pola `highlightScores` i `summary` z odpowiedzi API Exa, jeśli są dostępne.

### Tryby wyszukiwania

| Tryb             | Opis                                        |
| ---------------- | ------------------------------------------- |
| `auto`           | Exa wybiera najlepszy tryb (domyślnie)      |
| `neural`         | Wyszukiwanie semantyczne, oparte na znaczeniu |
| `fast`           | Szybkie wyszukiwanie słów kluczowych        |
| `deep`           | Dokładne, pogłębione wyszukiwanie           |
| `deep-reasoning` | Pogłębione wyszukiwanie z rozumowaniem      |
| `instant`        | Najszybsze wyniki                           |

## Uwagi

- Parametr `count` przyjmuje wartości do 100, z uwzględnieniem ograniczeń typu wyszukiwania Exa.
- Wyniki są domyślnie przechowywane w pamięci podręcznej przez 15 minut. Skonfiguruj współdzielone ustawienia `tools.web.search.cacheTtlMinutes` (w minutach) i `tools.web.search.timeoutSeconds` (domyślnie 30 s), aby zmienić czas przechowywania w pamięci podręcznej oraz limit czasu żądań dla wszystkich dostawców `web_search`, w tym Exa.

## Powiązane materiały

- [Omówienie wyszukiwania internetowego](/pl/tools/web) — wszyscy dostawcy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) — uporządkowane wyniki z filtrami kraju i języka
- [Perplexity Search](/pl/tools/perplexity-search) — uporządkowane wyniki z filtrowaniem domen
