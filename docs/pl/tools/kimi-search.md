---
read_when:
    - Chcesz używać Kimi do `web_search`
    - Potrzebujesz `KIMI_API_KEY` lub `MOONSHOT_API_KEY`
summary: Wyszukiwanie Kimi przez wyszukiwarkę internetową Moonshot
title: Wyszukiwanie Kimi
x-i18n:
    generated_at: "2026-04-05T14:08:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753757a5497a683c35b4509ed3709b9514dc14a45612675d0f729ae6668c82a5
    source_path: tools/kimi-search.md
    workflow: 15
---

# Wyszukiwanie Kimi

OpenClaw obsługuje Kimi jako dostawcę `web_search`, używając wyszukiwania internetowego Moonshot
do tworzenia odpowiedzi syntetyzowanych przez AI z cytowaniami.

## Pobierz klucz API

<Steps>
  <Step title="Utwórz klucz">
    Pobierz klucz API z [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `KIMI_API_KEY` lub `MOONSHOT_API_KEY` w środowisku Gateway albo
    skonfiguruj przez:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Gdy wybierzesz **Kimi** podczas `openclaw onboard` lub
`openclaw configure --section web`, OpenClaw może też zapytać o:

- region API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- domyślny model wyszukiwania internetowego Kimi (domyślnie `kimi-k2.5`)

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opcjonalne, jeśli ustawiono KIMI_API_KEY lub MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Jeśli używasz chińskiego hosta API do czatu (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw używa tego samego hosta także dla Kimi
`web_search`, gdy `tools.web.search.kimi.baseUrl` jest pominięte, dzięki czemu klucze z
[platform.moonshot.cn](https://platform.moonshot.cn/) nie trafiają przez pomyłkę do
międzynarodowego endpointu (który często zwraca HTTP 401). Nadpisz to przez
`tools.web.search.kimi.baseUrl`, gdy potrzebujesz innego base URL dla wyszukiwania.

**Alternatywa środowiskowa:** ustaw `KIMI_API_KEY` lub `MOONSHOT_API_KEY` w
środowisku Gateway. W przypadku instalacji Gateway umieść go w `~/.openclaw/.env`.

Jeśli pominiesz `baseUrl`, OpenClaw domyślnie użyje `https://api.moonshot.ai/v1`.
Jeśli pominiesz `model`, OpenClaw domyślnie użyje `kimi-k2.5`.

## Jak to działa

Kimi używa wyszukiwania internetowego Moonshot do syntetyzowania odpowiedzi z cytowaniami w tekście,
podobnie jak podejście odpowiedzi ugruntowanych w Gemini i Grok.

## Obsługiwane parametry

Wyszukiwanie Kimi obsługuje `query`.

`count` jest akceptowane dla współdzielonej zgodności `web_search`, ale Kimi nadal
zwraca jedną syntetyzowaną odpowiedź z cytowaniami zamiast listy N wyników.

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Moonshot AI](/providers/moonshot) -- dokumentacja dostawcy modeli Moonshot + Kimi Coding
- [Wyszukiwanie Gemini](/tools/gemini-search) -- odpowiedzi syntetyzowane przez AI przez osadzanie Google
- [Wyszukiwanie Grok](/tools/grok-search) -- odpowiedzi syntetyzowane przez AI przez osadzanie xAI
