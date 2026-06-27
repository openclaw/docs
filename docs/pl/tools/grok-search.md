---
read_when:
    - Chcesz używać Grok do web_search
    - Chcesz używać OAuth xAI lub XAI_API_KEY do wyszukiwania w sieci
summary: Wyszukiwanie w sieci Grok za pomocą odpowiedzi xAI opartych na danych z sieci
title: Wyszukiwanie Grok
x-i18n:
    generated_at: "2026-06-27T18:27:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw obsługuje Grok jako dostawcę `web_search`, używając odpowiedzi xAI
opartych na wynikach z sieci do tworzenia syntetyzowanych przez AI odpowiedzi
wspartych aktualnymi wynikami wyszukiwania z cytowaniami.

Wyszukiwanie Grok w sieci preferuje istniejące logowanie OAuth xAI, gdy jest
dostępne. Jeśli nie istnieje profil OAuth, ten sam klucz API xAI może także
zasilać wbudowane narzędzie `x_search` do wyszukiwania postów w X (dawniej
Twitter) oraz narzędzie `code_execution`. Jeśli zapiszesz klucz w
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw użyje go ponownie także
jako rezerwy dla dołączonego dostawcy modeli xAI.

W przypadku metryk pojedynczych postów X, takich jak reposty, odpowiedzi,
zakładki lub wyświetlenia, używaj `x_search` z dokładnym adresem URL posta albo
identyfikatorem statusu zamiast szerokiego zapytania wyszukiwania.

## Onboarding i konfiguracja

Jeśli wybierzesz **Grok** podczas:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw może użyć istniejącego profilu OAuth xAI bez pytania o osobny klucz do
wyszukiwania w sieci. Jeśli OAuth nie jest dostępne, przechodzi do konfiguracji
klucza API xAI. OpenClaw może także pokazać osobny krok następczy, aby włączyć
`x_search` z tymi samymi poświadczeniami xAI. Ten krok następczy:

- pojawia się tylko po wybraniu Grok dla `web_search`
- nie jest osobnym wyborem dostawcy wyszukiwania w sieci najwyższego poziomu
- może opcjonalnie ustawić model `x_search` w tym samym przepływie

Jeśli go pominiesz, możesz włączyć lub zmienić `x_search` później w konfiguracji.

## Zaloguj się albo uzyskaj klucz API

<Steps>
  <Step title="Use xAI OAuth">
    Jeśli logowanie przez xAI zostało już wykonane podczas onboardingu albo
    autoryzacji modelu, wybierz Grok jako dostawcę `web_search`. Osobny klucz
    API nie jest wymagany:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use an API key fallback">
    Uzyskaj klucz API od [xAI](https://console.x.ai/), gdy OAuth jest
    niedostępne albo celowo chcesz konfiguracji wyszukiwania w sieci opartej na
    kluczu.
  </Step>
  <Step title="Store the key">
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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**Alternatywy poświadczeń:** zaloguj się przez `openclaw models auth login
--provider xai --method oauth`, ustaw `XAI_API_KEY` w środowisku Gateway albo
zapisz `plugins.entries.xai.config.webSearch.apiKey`. W przypadku instalacji
bramy umieść zmienne środowiskowe w `~/.openclaw/.env`.

## Jak to działa

Grok używa odpowiedzi xAI opartych na wynikach z sieci, aby syntetyzować
odpowiedzi z cytowaniami w tekście, podobnie jak podejście Gemini do
uzasadniania przez wyszukiwarkę Google.

## Obsługiwane parametry

Wyszukiwanie Grok obsługuje `query`.

`count` jest akceptowane dla zgodności ze współdzielonym `web_search`, ale Grok
nadal zwraca jedną syntetyzowaną odpowiedź z cytowaniami zamiast listy N wyników.

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

Grok używa specyficznego dla dostawcy domyślnego limitu czasu 60 sekund,
ponieważ wyszukiwania xAI Responses oparte na wynikach z sieci mogą działać
dłużej niż współdzielna wartość domyślna `web_search`. Ustaw
`tools.web.search.timeoutSeconds`, aby ją zastąpić.

## Nadpisania bazowego adresu URL

Ustaw `plugins.entries.xai.config.webSearch.baseUrl`, gdy wyszukiwanie Grok w
sieci powinno być kierowane przez proxy operatora albo zgodny z xAI punkt
końcowy Responses. OpenClaw wysyła żądania POST do `<baseUrl>/responses` po
przycięciu końcowych ukośników. `x_search` używa tej samej rezerwy
`webSearch.baseUrl`, chyba że ustawiono
`plugins.entries.xai.config.xSearch.baseUrl`.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [x_search w Web Search](/pl/tools/web#x_search) -- pierwszorzędne wyszukiwanie X przez xAI
- [Gemini Search](/pl/tools/gemini-search) -- odpowiedzi syntetyzowane przez AI z uzasadnianiem przez Google
