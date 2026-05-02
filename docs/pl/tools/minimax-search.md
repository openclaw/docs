---
read_when:
    - Chcesz używać MiniMax do web_search
    - Potrzebujesz klucza MiniMax Token Plan lub tokenu OAuth
    - Chcesz wskazówek dotyczących hosta wyszukiwania MiniMax CN/global
summary: Wyszukiwanie MiniMax za pomocą interfejsu API wyszukiwania Token Plan
title: Wyszukiwanie MiniMax
x-i18n:
    generated_at: "2026-05-02T10:05:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw obsługuje MiniMax jako dostawcę `web_search` przez interfejs API wyszukiwania MiniMax
Token Plan. Zwraca ustrukturyzowane wyniki wyszukiwania z tytułami, adresami URL,
fragmentami i powiązanymi zapytaniami.

## Uzyskaj poświadczenie Token Plan

<Steps>
  <Step title="Utwórz klucz">
    Utwórz lub skopiuj klucz MiniMax Token Plan z
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Konfiguracje OAuth mogą zamiast tego ponownie użyć `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `MINIMAX_CODE_PLAN_KEY` w środowisku Gateway albo skonfiguruj przez:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akceptuje też `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` oraz
`MINIMAX_API_KEY` jako aliasy zmiennych środowiskowych. `MINIMAX_API_KEY` powinien wskazywać na
poświadczenie Token Plan z włączonym wyszukiwaniem; zwykłe klucze API modeli MiniMax mogą nie
zostać zaakceptowane przez punkt końcowy wyszukiwania Token Plan.

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Alternatywa środowiskowa:** ustaw `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` albo `MINIMAX_API_KEY` w środowisku Gateway.
W przypadku instalacji gateway umieść ją w `~/.openclaw/.env`.

## Wybór regionu

MiniMax Search używa tych punktów końcowych:

- Globalny: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Jeśli `plugins.entries.minimax.config.webSearch.region` nie jest ustawione, OpenClaw ustala
region w tej kolejności:

1. `tools.web.search.minimax.region` / należące do plugina `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Oznacza to, że wdrażanie CN albo `MINIMAX_API_HOST=https://api.minimaxi.com/...`
automatycznie utrzymuje MiniMax Search także na hoście CN.

Nawet gdy uwierzytelniono MiniMax przez ścieżkę OAuth `minimax-portal`,
wyszukiwanie w sieci nadal rejestruje się jako identyfikator dostawcy `minimax`; bazowy adres URL dostawcy OAuth
jest używany jako wskazówka regionu do wyboru hosta CN/globalnego, a `MINIMAX_OAUTH_TOKEN`
może spełnić wymaganie poświadczenia bearer dla MiniMax Search.

## Obsługiwane parametry

MiniMax Search obsługuje:

- `query`
- `count` (OpenClaw przycina zwróconą listę wyników do żądanej liczby)

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [MiniMax](/pl/providers/minimax) -- konfiguracja modelu, obrazu, mowy i uwierzytelniania
