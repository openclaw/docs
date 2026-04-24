---
read_when:
    - Chcesz używać Grok do `web_search`
    - Do `web_search` potrzebujesz `XAI_API_KEY`
summary: Wyszukiwanie w sieci Grok przez odpowiedzi xAI oparte na źródłach z internetu
title: Wyszukiwanie Grok
x-i18n:
    generated_at: "2026-04-24T09:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

OpenClaw obsługuje Grok jako dostawcę `web_search`, używając odpowiedzi xAI opartych na źródłach z internetu
do tworzenia odpowiedzi syntetyzowanych przez AI, opartych na wynikach wyszukiwania na żywo
z cytowaniami.

Ten sam `XAI_API_KEY` może także zasilać wbudowane narzędzie `x_search` do wyszukiwania postów na X
(dawniej Twitter). Jeśli przechowujesz klucz w
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw używa go teraz ponownie jako
awaryjnego rozwiązania także dla dołączonego dostawcy modeli xAI.

W przypadku metryk X na poziomie posta, takich jak reposty, odpowiedzi, zakładki czy wyświetlenia, preferuj
`x_search` z dokładnym adresem URL posta lub identyfikatorem statusu zamiast szerokiego zapytania
wyszukiwania.

## Onboarding i konfiguracja

Jeśli wybierzesz **Grok** podczas:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw może pokazać osobny krok uzupełniający służący do włączenia `x_search` przy użyciu tego samego
`XAI_API_KEY`. Ten krok uzupełniający:

- pojawia się tylko po wybraniu Grok dla `web_search`
- nie jest osobnym wyborem dostawcy wyszukiwania w sieci na najwyższym poziomie
- może opcjonalnie ustawić model `x_search` w tym samym przepływie

Jeśli go pominiesz, możesz włączyć lub zmienić `x_search` później w konfiguracji.

## Uzyskaj klucz API

<Steps>
  <Step title="Utwórz klucz">
    Uzyskaj klucz API w [xAI](https://console.x.ai/).
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
W przypadku instalacji gateway umieść go w `~/.openclaw/.env`.

## Jak to działa

Grok używa odpowiedzi xAI opartych na źródłach z internetu, aby syntetyzować odpowiedzi z wbudowanymi
cytowaniami, podobnie do podejścia Google Search grounding w Gemini.

## Obsługiwane parametry

Wyszukiwanie Grok obsługuje `query`.

`count` jest akceptowane dla zgodności ze współdzielonym `web_search`, ale Grok nadal
zwraca jedną odpowiedź syntetyzowaną z cytowaniami zamiast listy N wyników.

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [x_search w Web Search](/pl/tools/web#x_search) -- pełnoprawne wyszukiwanie X przez xAI
- [Gemini Search](/pl/tools/gemini-search) -- odpowiedzi syntetyzowane przez AI przez Google grounding
