---
read_when:
    - Chcesz używać Ollama do web_search
    - Chcesz dostawcę web_search bez klucza
    - Chcesz używać hostowanego Ollama Web Search z OLLAMA_API_KEY
    - Potrzebujesz wskazówek dotyczących konfiguracji Ollama Web Search
summary: Wyszukiwanie w sieci Ollama przez lokalnego hosta Ollama lub hostowane API Ollama
title: Wyszukiwanie w sieci Ollama
x-i18n:
    generated_at: "2026-06-27T18:28:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw obsługuje **Wyszukiwanie w sieci Ollama** jako dołączonego dostawcę `web_search`. Używa interfejsu API wyszukiwania w sieci Ollama i zwraca ustrukturyzowane wyniki z tytułami, adresami URL i fragmentami.

W przypadku lokalnej lub samodzielnie hostowanej Ollama ta konfiguracja domyślnie nie wymaga klucza API. Wymaga natomiast:

- hosta Ollama osiągalnego z OpenClaw
- `ollama signin`

W przypadku bezpośredniego hostowanego wyszukiwania ustaw bazowy adres URL dostawcy Ollama na `https://ollama.com` i podaj prawdziwy `OLLAMA_API_KEY`.

## Konfiguracja

<Steps>
  <Step title="Uruchom Ollama">
    Upewnij się, że Ollama jest zainstalowana i działa.
  </Step>
  <Step title="Zaloguj się">
    Uruchom:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Wybierz wyszukiwanie w sieci Ollama">
    Uruchom:

    ```bash
    openclaw configure --section web
    ```

    Następnie wybierz **Wyszukiwanie w sieci Ollama** jako dostawcę.

  </Step>
</Steps>

Jeśli używasz już Ollama do modeli, wyszukiwanie w sieci Ollama używa ponownie tego samego skonfigurowanego hosta.

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

Opcjonalne nadpisanie hosta Ollama:

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

Jeśli Ollama jest już skonfigurowana jako dostawca modeli, dostawca wyszukiwania w sieci może zamiast tego użyć ponownie tego hosta:

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

Dostawca modeli Ollama używa `baseUrl` jako klucza kanonicznego. Dostawca wyszukiwania w sieci uwzględnia też `baseURL` w `models.providers.ollama` dla zgodności z przykładami konfiguracji w stylu OpenAI SDK.

Jeśli nie ustawiono jawnego bazowego adresu URL Ollama, OpenClaw używa `http://127.0.0.1:11434`.

Jeśli host Ollama oczekuje uwierzytelniania bearer, OpenClaw używa ponownie `models.providers.ollama.apiKey` (lub odpowiadającego mu uwierzytelniania dostawcy opartego na zmiennych środowiskowych) dla żądań do tego skonfigurowanego hosta.

Bezpośrednio hostowane wyszukiwanie w sieci Ollama:

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

## Uwagi

- Dla tego dostawcy nie jest wymagane pole klucza API specyficzne dla wyszukiwania w sieci.
- Jeśli host Ollama jest chroniony uwierzytelnianiem, OpenClaw używa ponownie zwykłego klucza API dostawcy Ollama, gdy jest dostępny.
- Jeśli `baseUrl` to `https://ollama.com`, OpenClaw wywołuje bezpośrednio `https://ollama.com/api/web_search` i wysyła skonfigurowany klucz API Ollama jako uwierzytelnianie bearer.
- Jeśli skonfigurowany host nie udostępnia wyszukiwania w sieci, a `OLLAMA_API_KEY` jest ustawiony, OpenClaw może przełączyć się awaryjnie na `https://ollama.com/api/web_search` bez wysyłania tego klucza ze zmiennej środowiskowej do lokalnego hosta.
- OpenClaw ostrzega podczas konfiguracji, jeśli Ollama jest nieosiągalna lub użytkownik nie jest zalogowany, ale nie blokuje wyboru.
- OpenClaw nie wybiera automatycznie wyszukiwania w sieci Ollama, gdy nie skonfigurowano dostawcy z poświadczeniami o wyższym priorytecie; wybierz je jawnie za pomocą `tools.web.search.provider: "ollama"`.
- Lokalne hosty demona Ollama używają lokalnego punktu końcowego proxy `/api/experimental/web_search`, który podpisuje i przekazuje żądania do Ollama Cloud.
- Hosty `https://ollama.com` używają bezpośrednio publicznego hostowanego punktu końcowego `/api/web_search` z uwierzytelnianiem bearer za pomocą klucza API.

## Powiązane

- [Przegląd wyszukiwania w sieci](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Ollama](/pl/providers/ollama) -- konfiguracja modeli Ollama oraz tryby chmurowe/lokalne
