---
read_when:
    - Chcesz używać Kimi do `web_search`
    - Potrzebujesz `KIMI_API_KEY` albo `MOONSHOT_API_KEY`
summary: Wyszukiwanie w sieci Kimi przez wyszukiwanie w sieci Moonshot
title: Kimi Search
x-i18n:
    generated_at: "2026-04-21T10:01:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi Search

OpenClaw obsługuje Kimi jako providera `web_search`, używając wyszukiwania w sieci Moonshot
do tworzenia odpowiedzi syntetyzowanych przez AI z cytowaniami.

## Uzyskanie klucza API

<Steps>
  <Step title="Utwórz klucz">
    Pobierz klucz API z [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `KIMI_API_KEY` albo `MOONSHOT_API_KEY` w środowisku Gateway albo
    skonfiguruj przez:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Gdy wybierzesz **Kimi** podczas `openclaw onboard` albo
`openclaw configure --section web`, OpenClaw może też zapytać o:

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
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

Jeśli używasz chińskiego hosta API do czatu (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw używa tego samego hosta także dla Kimi
`web_search`, gdy pominięto `tools.web.search.kimi.baseUrl`, dzięki czemu klucze z
[platform.moonshot.cn](https://platform.moonshot.cn/) nie trafiają przez pomyłkę na
międzynarodowy punkt końcowy (który często zwraca HTTP 401). Nadpisz
`tools.web.search.kimi.baseUrl`, gdy potrzebujesz innego bazowego URL wyszukiwania.

**Alternatywa środowiskowa:** ustaw `KIMI_API_KEY` albo `MOONSHOT_API_KEY` w
środowisku Gateway. W przypadku instalacji gateway umieść go w `~/.openclaw/.env`.

Jeśli pominiesz `baseUrl`, OpenClaw domyślnie użyje `https://api.moonshot.ai/v1`.
Jeśli pominiesz `model`, OpenClaw domyślnie użyje `kimi-k2.6`.

## Jak to działa

Kimi używa wyszukiwania w sieci Moonshot do syntetyzowania odpowiedzi z cytowaniami w tekście,
podobnie jak podejście odpowiedzi ugruntowanych w Gemini i Grok.

## Obsługiwane parametry

Wyszukiwanie Kimi obsługuje `query`.

`count` jest akceptowane dla zgodności ze współdzielonym `web_search`, ale Kimi nadal
zwraca jedną syntetyzowaną odpowiedź z cytowaniami, a nie listę N wyników.

Filtry specyficzne dla providera nie są obecnie obsługiwane.

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy providerzy i automatyczne wykrywanie
- [Moonshot AI](/pl/providers/moonshot) -- dokumentacja providera modeli Moonshot + Kimi Coding
- [Gemini Search](/pl/tools/gemini-search) -- odpowiedzi syntetyzowane przez AI przez ugruntowanie Google
- [Grok Search](/pl/tools/grok-search) -- odpowiedzi syntetyzowane przez AI przez ugruntowanie xAI
