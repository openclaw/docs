---
read_when:
    - Chcesz używać MiniMax do web_search
    - Potrzebujesz klucza MiniMax Token Plan lub tokenu OAuth
    - Potrzebujesz wskazówek dotyczących hosta wyszukiwania MiniMax CN/global
summary: Wyszukiwanie MiniMax za pomocą interfejsu API wyszukiwania Token Plan
title: Wyszukiwanie MiniMax
x-i18n:
    generated_at: "2026-07-12T15:40:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw obsługuje MiniMax jako dostawcę `web_search` za pośrednictwem interfejsu API wyszukiwania MiniMax Token Plan. Zwraca on ustrukturyzowane wyniki wyszukiwania z tytułami, adresami URL, fragmentami treści i powiązanymi zapytaniami.

## Uzyskiwanie danych uwierzytelniających Token Plan

<Steps>
  <Step title="Utwórz klucz">
    Utwórz lub skopiuj klucz MiniMax Token Plan na
    [platformie MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Konfiguracje OAuth mogą zamiast niego używać ponownie `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `MINIMAX_CODE_PLAN_KEY` w środowisku Gateway lub skonfiguruj go za pomocą:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akceptuje również `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` i
`MINIMAX_API_KEY` jako aliasy zmiennych środowiskowych, sprawdzane w tej kolejności po
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` powinien wskazywać dane uwierzytelniające
Token Plan z włączoną obsługą wyszukiwania; zwykłe klucze API modeli MiniMax mogą nie być akceptowane przez
punkt końcowy wyszukiwania Token Plan.

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opcjonalne, jeśli ustawiono zmienną środowiskową MiniMax Token Plan
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

**Alternatywa ze zmienną środowiskową:** ustaw `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` w środowisku Gateway.
W przypadku instalacji Gateway umieść ją w `~/.openclaw/.env`.

## Wybór regionu

Wyszukiwanie MiniMax korzysta z następujących punktów końcowych:

- Globalny: `https://api.minimax.io/v1/coding_plan/search`
- Chiny: `https://api.minimaxi.com/v1/coding_plan/search`

Jeśli `plugins.entries.minimax.config.webSearch.region` nie jest ustawione, OpenClaw określa
region w następującej kolejności:

1. `tools.web.search.minimax.region` / należące do Pluginu `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Oznacza to, że wdrożenie dla Chin lub ustawienie `MINIMAX_API_HOST=https://api.minimaxi.com/...`
automatycznie utrzymuje wyszukiwanie MiniMax również na hoście chińskim.

Nawet jeśli uwierzytelnianie MiniMax odbyło się przez ścieżkę OAuth `minimax-portal`,
wyszukiwanie internetowe nadal rejestruje się z identyfikatorem dostawcy `minimax`; bazowy adres URL dostawcy OAuth
jest używany jako wskazówka regionu przy wyborze hosta chińskiego lub globalnego, a `MINIMAX_OAUTH_TOKEN`
może służyć jako poświadczenie typu bearer dla wyszukiwania MiniMax.

## Obsługiwane parametry

| Parametr  | Typ           | Ograniczenia          | Opis                                                                              |
| --------- | ------------- | --------------------- | --------------------------------------------------------------------------------- |
| `query`   | ciąg znaków   | wymagany              | Ciąg zapytania wyszukiwania.                                                       |
| `count`   | liczba całkowita | 1–10, domyślnie 5  | Liczba zwracanych wyników. OpenClaw skraca zwróconą listę do tego rozmiaru.        |

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

## Powiązane materiały

- [Omówienie wyszukiwania internetowego](/pl/tools/web) — wszyscy dostawcy i automatyczne wykrywanie
- [MiniMax](/pl/providers/minimax) — konfiguracja modelu, obrazu, mowy i uwierzytelniania
