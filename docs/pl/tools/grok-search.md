---
read_when:
    - Chcesz używać Grok do web_search
    - Potrzebujesz XAI_API_KEY do wyszukiwania w internecie
summary: Wyszukiwanie w sieci Grok za pomocą odpowiedzi xAI opartych na treściach z sieci
title: Wyszukiwanie Grok
x-i18n:
    generated_at: "2026-05-10T19:57:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw obsługuje Grok jako dostawcę `web_search`, używając odpowiedzi xAI opartych na danych z sieci do generowania odpowiedzi syntetyzowanych przez AI, wspartych wynikami wyszukiwania na żywo z cytowaniami.

Ten sam klucz API xAI może też zasilać wbudowane narzędzie `x_search` do wyszukiwania wpisów w X (dawniej Twitter) oraz narzędzie `code_execution`. Jeśli zapiszesz klucz w `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw będzie teraz używać go ponownie jako zapasowego klucza także dla wbudowanego dostawcy modeli xAI.

W przypadku metryk X na poziomie wpisu, takich jak reposty, odpowiedzi, zakładki lub wyświetlenia, preferuj `x_search` z dokładnym adresem URL wpisu albo identyfikatorem statusu zamiast szerokiego zapytania wyszukiwania.

## Wdrażanie i konfiguracja

Jeśli wybierzesz **Grok** podczas:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw może pokazać osobny krok uzupełniający, aby włączyć `x_search` z tym samym `XAI_API_KEY`. Ten krok uzupełniający:

- pojawia się tylko po wybraniu Grok dla `web_search`
- nie jest osobnym, najwyższego poziomu wyborem dostawcy wyszukiwania w sieci
- może opcjonalnie ustawić model `x_search` w tym samym przebiegu

Jeśli go pominiesz, możesz włączyć lub zmienić `x_search` później w konfiguracji.

## Uzyskaj klucz API

<Steps>
  <Step title="Utwórz klucz">
    Uzyskaj klucz API od [xAI](https://console.x.ai/).
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
W przypadku instalacji gateway umieść go w `~/.openclaw/.env`.

## Jak to działa

Grok używa odpowiedzi xAI opartych na danych z sieci, aby syntetyzować odpowiedzi z cytowaniami w treści, podobnie do podejścia Gemini z osadzaniem wyników Google Search.

## Obsługiwane parametry

Wyszukiwanie Grok obsługuje `query`.

`count` jest akceptowane dla zgodności ze wspólnym `web_search`, ale Grok nadal zwraca jedną syntetyzowaną odpowiedź z cytowaniami zamiast listy N wyników.

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

Grok używa specyficznego dla dostawcy domyślnego limitu czasu 60 sekund, ponieważ wyszukiwania xAI Responses oparte na danych z sieci mogą trwać dłużej niż wspólna wartość domyślna `web_search`. Ustaw `tools.web.search.timeoutSeconds`, aby ją nadpisać.

## Nadpisania bazowego adresu URL

Ustaw `plugins.entries.xai.config.webSearch.baseUrl`, gdy wyszukiwanie w sieci Grok powinno być kierowane przez proxy operatora albo zgodny z xAI punkt końcowy Responses. OpenClaw wysyła żądania POST do `<baseUrl>/responses` po przycięciu końcowych ukośników. `x_search` używa tego samego zapasowego `webSearch.baseUrl`, chyba że ustawiono `plugins.entries.xai.config.xSearch.baseUrl`.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [x_search w Web Search](/pl/tools/web#x_search) -- pierwszorzędne wyszukiwanie X przez xAI
- [Gemini Search](/pl/tools/gemini-search) -- odpowiedzi syntetyzowane przez AI za pomocą osadzania Google
