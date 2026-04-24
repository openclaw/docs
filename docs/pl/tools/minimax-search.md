---
read_when:
    - Chcesz używać MiniMax dla `web_search`
    - Potrzebujesz klucza MiniMax Coding Plan
    - Chcesz uzyskać wskazówki dotyczące hosta wyszukiwania MiniMax CN/global
summary: MiniMax Search przez interfejs API wyszukiwania Coding Plan
title: Wyszukiwanie MiniMax
x-i18n:
    generated_at: "2026-04-24T09:37:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw obsługuje MiniMax jako dostawcę `web_search` przez interfejs API wyszukiwania MiniMax
Coding Plan. Zwraca on ustrukturyzowane wyniki wyszukiwania z tytułami, URL-ami,
fragmentami i powiązanymi zapytaniami.

## Pobierz klucz Coding Plan

<Steps>
  <Step title="Utwórz klucz">
    Utwórz lub skopiuj klucz MiniMax Coding Plan z
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `MINIMAX_CODE_PLAN_KEY` w środowisku Gateway albo skonfiguruj przez:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akceptuje także `MINIMAX_CODING_API_KEY` jako alias zmiennej środowiskowej. `MINIMAX_API_KEY`
jest nadal odczytywany jako zgodny wstecznie fallback, jeśli już wskazuje na token coding-plan.

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opcjonalne, jeśli ustawiono MINIMAX_CODE_PLAN_KEY
            region: "global", // albo "cn"
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

**Alternatywa środowiskowa:** ustaw `MINIMAX_CODE_PLAN_KEY` w środowisku Gateway.
W przypadku instalacji Gateway umieść go w `~/.openclaw/.env`.

## Wybór regionu

MiniMax Search używa następujących endpointów:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Jeśli `plugins.entries.minimax.config.webSearch.region` nie jest ustawione, OpenClaw ustala
region w następującej kolejności:

1. `tools.web.search.minimax.region` / należące do Plugin `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Oznacza to, że onboarding CN lub `MINIMAX_API_HOST=https://api.minimaxi.com/...`
automatycznie utrzymuje także MiniMax Search na hoście CN.

Nawet jeśli uwierzytelniono MiniMax przez ścieżkę OAuth `minimax-portal`,
web search nadal rejestruje się jako identyfikator dostawcy `minimax`; bazowy URL dostawcy OAuth
jest używany tylko jako wskazówka regionu przy wyborze hosta CN/global.

## Obsługiwane parametry

MiniMax Search obsługuje:

- `query`
- `count` (OpenClaw przycina zwróconą listę wyników do żądanej liczby)

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [MiniMax](/pl/providers/minimax) -- konfiguracja modelu, obrazów, mowy i uwierzytelniania
