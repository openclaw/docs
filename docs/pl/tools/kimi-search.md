---
read_when:
    - Chcesz używać Kimi do `web_search`
    - Potrzebujesz `KIMI_API_KEY` lub `MOONSHOT_API_KEY`
summary: Wyszukiwanie w sieci Kimi przez wyszukiwanie w sieci Moonshot
title: Wyszukiwanie Kimi
x-i18n:
    generated_at: "2026-04-24T09:36:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw obsługuje Kimi jako dostawcę `web_search`, używając wyszukiwania w sieci Moonshot
do tworzenia odpowiedzi syntetyzowanych przez AI z cytowaniami.

## Uzyskaj klucz API

<Steps>
  <Step title="Utwórz klucz">
    Uzyskaj klucz API w [Moonshot AI](https://platform.moonshot.cn/).
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
`openclaw configure --section web`, OpenClaw może również zapytać o:

- region API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- domyślny model wyszukiwania w sieci Kimi (domyślnie `kimi-k2.6`)

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
            model: "kimi-k2.6",
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

Jeśli używasz hosta China API do czatu (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw używa ponownie tego samego hosta dla Kimi
`web_search`, gdy `tools.web.search.kimi.baseUrl` jest pominięte, aby klucze z
[platform.moonshot.cn](https://platform.moonshot.cn/) nie trafiały przez pomyłkę do
międzynarodowego endpointu (który często zwraca HTTP 401). Nadpisz
`tools.web.search.kimi.baseUrl`, gdy potrzebujesz innego bazowego URL wyszukiwania.

**Alternatywa środowiskowa:** ustaw `KIMI_API_KEY` lub `MOONSHOT_API_KEY` w
środowisku Gateway. W przypadku instalacji gateway umieść go w `~/.openclaw/.env`.

Jeśli pominiesz `baseUrl`, OpenClaw domyślnie użyje `https://api.moonshot.ai/v1`.
Jeśli pominiesz `model`, OpenClaw domyślnie użyje `kimi-k2.6`.

## Jak to działa

Kimi używa wyszukiwania w sieci Moonshot do syntetyzowania odpowiedzi z wbudowanymi cytowaniami,
podobnie do podejścia odpowiedzi opartych na źródłach w Gemini i Grok.

## Obsługiwane parametry

Wyszukiwanie Kimi obsługuje `query`.

`count` jest akceptowane dla zgodności ze współdzielonym `web_search`, ale Kimi nadal
zwraca jedną odpowiedź syntetyzowaną z cytowaniami zamiast listy N wyników.

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Moonshot AI](/pl/providers/moonshot) -- dokumentacja dostawcy modeli Moonshot + Kimi Coding
- [Gemini Search](/pl/tools/gemini-search) -- odpowiedzi syntetyzowane przez AI przez Google grounding
- [Wyszukiwanie Grok](/pl/tools/grok-search) -- odpowiedzi syntetyzowane przez AI przez xAI grounding
