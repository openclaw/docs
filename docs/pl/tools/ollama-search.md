---
read_when:
    - Chcesz używać Ollama do web_search
    - Chcesz dostawcę web_search niewymagającego klucza
    - Chcesz korzystać z hostowanej usługi Ollama Web Search za pomocą OLLAMA_API_KEY
    - Potrzebujesz instrukcji konfiguracji Ollama Web Search
summary: Wyszukiwanie w sieci Ollama za pośrednictwem lokalnego hosta Ollama lub hostowanego API Ollama
title: Wyszukiwanie internetowe Ollama
x-i18n:
    generated_at: "2026-07-12T15:40:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw obsługuje **Ollama Web Search** jako wbudowanego dostawcę `web_search`,
zwracającego tytuły, adresy URL i fragmenty z API wyszukiwania internetowego Ollama.

Lokalna/samodzielnie hostowana Ollama domyślnie nie wymaga klucza API; potrzebuje
osiągalnego hosta Ollama oraz wykonania polecenia `ollama signin`. Bezpośrednie
wyszukiwanie hostowane (bez lokalnej Ollama) wymaga `baseUrl: "https://ollama.com"`
oraz prawidłowego `OLLAMA_API_KEY`.

## Konfiguracja

<Steps>
  <Step title="Uruchom Ollama">
    Upewnij się, że Ollama jest zainstalowana i uruchomiona.
  </Step>
  <Step title="Zaloguj się">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Wybierz Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    Wybierz **Ollama Web Search** jako dostawcę.

  </Step>
</Steps>

Jeśli używasz już Ollama do obsługi modeli, Ollama Web Search wykorzysta ponownie
ten sam skonfigurowany host.

<Note>
  OpenClaw nigdy nie wybiera automatycznie Ollama Web Search zamiast dostawcy
  z poświadczeniami o wyższym priorytecie; musisz wybrać ją jawnie za pomocą
  `tools.web.search.provider: "ollama"`.
</Note>

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Opcjonalne nadpisanie hosta, ograniczone wyłącznie do wyszukiwania internetowego:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Możesz też ponownie wykorzystać host skonfigurowany już dla dostawcy modeli Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` jest kluczem kanonicznym; dostawca wyszukiwania
internetowego akceptuje tam również `baseURL` w celu zachowania zgodności z
przykładami konfiguracji w stylu OpenAI SDK. Jeśli nie ustawiono żadnej wartości,
OpenClaw domyślnie używa `http://127.0.0.1:11434`.

Bezpośrednie hostowane Ollama Web Search (bez lokalnej Ollama):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Uwierzytelnianie i kierowanie żądań

- Nie istnieje pole klucza API przeznaczone wyłącznie do wyszukiwania
  internetowego; dostawca ponownie wykorzystuje `models.providers.ollama.apiKey`
  (lub odpowiadające mu uwierzytelnianie dostawcy oparte na zmiennej środowiskowej),
  gdy skonfigurowany host jest chroniony uwierzytelnianiem.
- Kolejność rozpoznawania hosta: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (lub `baseURL`) → `http://127.0.0.1:11434`.
- Jeśli rozpoznany host to `https://ollama.com`, OpenClaw wywołuje bezpośrednio
  `https://ollama.com/api/web_search`, używając klucza API do uwierzytelniania
  typu bearer.
- W przeciwnym razie OpenClaw najpierw wywołuje lokalny punkt końcowy proxy
  `/api/experimental/web_search` (który podpisuje żądanie i przekazuje je do
  Ollama Cloud), a następnie w razie niepowodzenia przechodzi do
  `/api/web_search` na tym samym hoście. Jeśli oba wywołania zakończą się
  niepowodzeniem, a `OLLAMA_API_KEY` jest ustawiony, ponawia próbę jeden raz
  względem `https://ollama.com/api/web_search` z użyciem tego klucza — bez
  wysyłania go do lokalnego hosta.
- OpenClaw ostrzega podczas konfiguracji, jeśli Ollama jest nieosiągalna lub
  użytkownik nie jest zalogowany, ale nie blokuje wyboru dostawcy.

## Powiązane

- [Omówienie wyszukiwania internetowego](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Ollama](/pl/providers/ollama) -- konfiguracja modeli Ollama oraz tryby chmurowy/lokalny
