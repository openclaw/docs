---
read_when:
    - Chcesz używać Grok do `web_search`
    - Potrzebujesz `XAI_API_KEY` do wyszukiwania w sieci
summary: Wyszukiwanie Grok przez odpowiedzi xAI oparte na danych z sieci
title: Wyszukiwanie Grok
x-i18n:
    generated_at: "2026-04-05T14:07:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Wyszukiwanie Grok

OpenClaw obsługuje Grok jako dostawcę `web_search`, używając odpowiedzi xAI
opartych na danych z sieci do generowania odpowiedzi syntetyzowanych przez AI na podstawie
aktualnych wyników wyszukiwania z cytowaniami.

Ten sam `XAI_API_KEY` może także zasilać wbudowane narzędzie `x_search` do wyszukiwania postów na X
(dawniej Twitter). Jeśli zapiszesz klucz w
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw teraz używa go ponownie jako
fallback również dla dołączonego dostawcy modeli xAI.

W przypadku metryk postów na X, takich jak reposty, odpowiedzi, zakładki czy wyświetlenia, używaj raczej
`x_search` z dokładnym URL-em posta lub identyfikatorem statusu zamiast szerokiego
zapytania wyszukiwania.

## Onboarding i konfiguracja

Jeśli wybierzesz **Grok** podczas:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw może wyświetlić osobny krok uzupełniający, aby włączyć `x_search` przy użyciu tego samego
`XAI_API_KEY`. Ten krok uzupełniający:

- pojawia się tylko po wybraniu Grok dla `web_search`
- nie jest osobnym wyborem dostawcy wyszukiwania w sieci na najwyższym poziomie
- może opcjonalnie ustawić model `x_search` w tym samym przepływie

Jeśli go pominiesz, możesz później włączyć lub zmienić `x_search` w konfiguracji.

## Pobierz klucz API

<Steps>
  <Step title="Utwórz klucz">
    Pobierz klucz API z [xAI](https://console.x.ai/).
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `XAI_API_KEY` w środowisku Gateway albo skonfiguruj przez:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // opcjonalne, jeśli ustawiono XAI_API_KEY
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternatywa środowiskowa:** ustaw `XAI_API_KEY` w środowisku Gateway.
W przypadku instalacji Gateway umieść go w `~/.openclaw/.env`.

## Jak to działa

Grok używa odpowiedzi xAI opartych na danych z sieci do syntetyzowania odpowiedzi z cytowaniami w tekście,
podobnie jak podejście Gemini do osadzania wyników Google Search.

## Obsługiwane parametry

Wyszukiwanie Grok obsługuje `query`.

`count` jest akceptowane dla współdzielonej zgodności `web_search`, ale Grok nadal
zwraca jedną syntetyzowaną odpowiedź z cytowaniami zamiast listy N wyników.

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [x_search w Web Search](/tools/web#x_search) -- pełnoprawne wyszukiwanie X przez xAI
- [Wyszukiwanie Gemini](/tools/gemini-search) -- odpowiedzi syntetyzowane przez AI przez osadzanie Google
