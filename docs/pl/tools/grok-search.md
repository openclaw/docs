---
read_when:
    - Chcesz używać Grok do web_search
    - Potrzebujesz XAI_API_KEY do wyszukiwania w internecie
summary: Wyszukiwanie w sieci Grok za pomocą odpowiedzi xAI opartych na danych z sieci
title: Wyszukiwanie Grok
x-i18n:
    generated_at: "2026-05-02T10:04:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw obsługuje Grok jako dostawcę `web_search`, używając odpowiedzi xAI opartych na wynikach z sieci do tworzenia odpowiedzi syntetyzowanych przez AI, popartych bieżącymi wynikami wyszukiwania z cytowaniami.

Ten sam `XAI_API_KEY` może też zasilać wbudowane narzędzie `x_search` do wyszukiwania postów X (dawniej Twitter). Jeśli przechowujesz klucz w `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw używa go teraz ponownie również jako mechanizmu zapasowego dla wbudowanego dostawcy modelu xAI.

W przypadku metryk X na poziomie posta, takich jak reposty, odpowiedzi, zakładki lub wyświetlenia, preferuj `x_search` z dokładnym adresem URL posta albo identyfikatorem statusu zamiast szerokiego zapytania wyszukiwania.

## Wdrażanie i konfiguracja

Jeśli wybierzesz **Grok** podczas:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw może pokazać osobny krok uzupełniający, aby włączyć `x_search` z tym samym `XAI_API_KEY`. Ten krok uzupełniający:

- pojawia się tylko po wybraniu Grok dla `web_search`
- nie jest osobnym wyborem dostawcy wyszukiwania w sieci najwyższego poziomu
- może opcjonalnie ustawić model `x_search` w tym samym przepływie

Jeśli go pominiesz, możesz później włączyć lub zmienić `x_search` w konfiguracji.

## Uzyskaj klucz API

<Steps>
  <Step title="Utwórz klucz">
    Uzyskaj klucz API z [xAI](https://console.x.ai/).
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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

Grok używa odpowiedzi xAI opartych na wynikach z sieci, aby syntetyzować odpowiedzi z cytowaniami w tekście, podobnie do podejścia Gemini polegającego na ugruntowaniu w Google Search.

## Obsługiwane parametry

Wyszukiwanie Grok obsługuje `query`.

`count` jest akceptowane dla zgodności ze wspólnym `web_search`, ale Grok nadal zwraca jedną syntetyzowaną odpowiedź z cytowaniami zamiast listy N wyników.

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

Grok używa specyficznego dla dostawcy domyślnego limitu czasu wynoszącego 60 sekund, ponieważ wyszukiwania xAI Responses oparte na wynikach z sieci mogą działać dłużej niż wspólna domyślna wartość `web_search`. Ustaw `tools.web.search.timeoutSeconds`, aby ją zastąpić.

## Nadpisania bazowego URL

Ustaw `plugins.entries.xai.config.webSearch.baseUrl`, gdy wyszukiwanie webowe Grok powinno być kierowane przez proxy operatora albo punkt końcowy Responses zgodny z xAI. OpenClaw wysyła żądania POST do `<baseUrl>/responses` po usunięciu końcowych ukośników. `x_search` używa tego samego mechanizmu zapasowego `webSearch.baseUrl`, chyba że ustawiono `plugins.entries.xai.config.xSearch.baseUrl`.

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [`x_search` w Web Search](/pl/tools/web#x_search) -- pełnoprawne wyszukiwanie X przez xAI
- [Gemini Search](/pl/tools/gemini-search) -- odpowiedzi syntetyzowane przez AI za pomocą ugruntowania Google
