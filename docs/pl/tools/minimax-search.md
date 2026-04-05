---
read_when:
    - Chcesz używać MiniMax do `web_search`
    - Potrzebujesz klucza MiniMax Coding Plan
    - Chcesz uzyskać wskazówki dotyczące hosta wyszukiwania MiniMax CN/global
summary: Wyszukiwanie MiniMax przez API wyszukiwania Coding Plan
title: Wyszukiwanie MiniMax
x-i18n:
    generated_at: "2026-04-05T14:08:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# Wyszukiwanie MiniMax

OpenClaw obsługuje MiniMax jako dostawcę `web_search` przez API wyszukiwania MiniMax
Coding Plan. Zwraca ono uporządkowane wyniki wyszukiwania z tytułami, adresami URL,
fragmentami i powiązanymi zapytaniami.

## Pobierz klucz Coding Plan

<Steps>
  <Step title="Utwórz klucz">
    Utwórz lub skopiuj klucz MiniMax Coding Plan z
    [platformy MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `MINIMAX_CODE_PLAN_KEY` w środowisku Gateway albo skonfiguruj przez:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akceptuje również `MINIMAX_CODING_API_KEY` jako alias zmiennej środowiskowej. `MINIMAX_API_KEY`
nadal jest odczytywany jako fallback zgodności, gdy już wskazuje na token coding-plan.

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opcjonalne, jeśli ustawiono MINIMAX_CODE_PLAN_KEY
            region: "global", // lub "cn"
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

Wyszukiwanie MiniMax używa następujących endpointów:

- Globalny: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Jeśli `plugins.entries.minimax.config.webSearch.region` nie jest ustawione, OpenClaw ustala
region w następującej kolejności:

1. `tools.web.search.minimax.region` / należące do pluginu `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Oznacza to, że onboarding CN lub `MINIMAX_API_HOST=https://api.minimaxi.com/...`
automatycznie utrzymuje wyszukiwanie MiniMax również na hoście CN.

Nawet jeśli uwierzytelniłeś MiniMax przez ścieżkę OAuth `minimax-portal`,
wyszukiwanie w sieci nadal rejestruje się pod identyfikatorem dostawcy `minimax`; base URL dostawcy OAuth
jest używany tylko jako wskazówka regionu przy wyborze hosta CN/global.

## Obsługiwane parametry

Wyszukiwanie MiniMax obsługuje:

- `query`
- `count` (OpenClaw przycina zwróconą listę wyników do żądanej liczby)

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [MiniMax](/providers/minimax) -- konfiguracja modeli, obrazów, mowy i uwierzytelniania
