---
read_when:
    - Chcesz używać Kimi do web_search
    - Wymagany jest KIMI_API_KEY lub MOONSHOT_API_KEY
summary: Wyszukiwanie w sieci Kimi za pośrednictwem wyszukiwania w sieci Moonshot
title: Wyszukiwanie Kimi
x-i18n:
    generated_at: "2026-05-02T10:04:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw obsługuje Kimi jako dostawcę `web_search`, używając wyszukiwania internetowego Moonshot
do tworzenia odpowiedzi syntetyzowanych przez AI z cytowaniami.

## Uzyskaj klucz API

<Steps>
  <Step title="Utwórz klucz">
    Uzyskaj klucz API z [Moonshot AI](https://platform.moonshot.cn/).
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
`openclaw configure --section web`, OpenClaw może też poprosić o:

- region API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- domyślny model wyszukiwania internetowego Kimi (domyślnie `kimi-k2.6`)

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

Jeśli używasz chińskiego hosta API dla czatu (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw ponownie używa tego samego hosta dla Kimi
`web_search`, gdy pominięto `tools.web.search.kimi.baseUrl`, więc klucze z
[platform.moonshot.cn](https://platform.moonshot.cn/) nie trafiają przez pomyłkę do
międzynarodowego punktu końcowego (który często zwraca HTTP 401). Nadpisz
za pomocą `tools.web.search.kimi.baseUrl`, gdy potrzebujesz innego bazowego adresu URL wyszukiwania.

**Alternatywa środowiskowa:** ustaw `KIMI_API_KEY` lub `MOONSHOT_API_KEY` w
środowisku Gateway. W przypadku instalacji gateway umieść go w `~/.openclaw/.env`.

Jeśli pominiesz `baseUrl`, OpenClaw domyślnie używa `https://api.moonshot.ai/v1`.
Jeśli pominiesz `model`, OpenClaw domyślnie używa `kimi-k2.6`.

## Jak to działa

Kimi używa wyszukiwania internetowego Moonshot do syntetyzowania odpowiedzi z cytowaniami w tekście,
podobnie do opartego na ugruntowanych odpowiedziach podejścia Gemini i Grok.

OpenClaw uznaje Kimi `web_search` za udane dopiero wtedy, gdy Moonshot zwróci
natywne dowody ugruntowania wyszukiwania internetowego, takie jak możliwy do odtworzenia ładunek narzędzia `$web_search`,
`search_results` lub adresy URL cytowań. Jeśli Kimi natychmiast zakończy działanie
zwykłą odpowiedzią czatu, taką jak „Nie mogę przeglądać internetu”, i bez dowodów ugruntowania,
OpenClaw zwraca ustrukturyzowany błąd `kimi_web_search_ungrounded` zamiast
opakowywać ten tekst jako wynik wyszukiwania. Ponów zapytanie, przełącz się na ustrukturyzowanego
dostawcę, takiego jak Brave, albo użyj `web_fetch` / narzędzia przeglądarki, gdy masz już
docelowy adres URL.

## Obsługiwane parametry

Wyszukiwanie Kimi obsługuje `query`.

`count` jest akceptowane w celu zgodności ze wspólnym `web_search`, ale Kimi nadal
zwraca jedną syntetyzowaną odpowiedź z cytowaniami, a nie listę N wyników.

Filtry specyficzne dla dostawcy nie są obecnie obsługiwane.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Moonshot AI](/pl/providers/moonshot) -- dokumentacja dostawcy modelu Moonshot + Kimi Coding
- [Wyszukiwanie Gemini](/pl/tools/gemini-search) -- odpowiedzi syntetyzowane przez AI z użyciem ugruntowania Google
- [Wyszukiwanie Grok](/pl/tools/grok-search) -- odpowiedzi syntetyzowane przez AI z użyciem ugruntowania xAI
