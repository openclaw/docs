---
read_when:
    - Chcesz używać Ollama do web_search
    - Potrzebujesz dostawcy web_search niewymagającego klucza
    - Chcesz używać hostowanego wyszukiwania w sieci Ollama z OLLAMA_API_KEY
    - Potrzebujesz wskazówek dotyczących konfiguracji Ollama Web Search
summary: Wyszukiwanie w sieci Ollama przez lokalny host Ollama lub hostowane API Ollama
title: Wyszukiwanie internetowe Ollama
x-i18n:
    generated_at: "2026-04-30T10:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw obsługuje **Ollama Web Search** jako wbudowanego dostawcę `web_search`. Używa interfejsu API wyszukiwania w sieci Ollama i zwraca uporządkowane wyniki z tytułami, adresami URL oraz fragmentami.

W przypadku lokalnej lub samodzielnie hostowanej Ollama ta konfiguracja domyślnie nie wymaga klucza API. Wymaga natomiast:

- hosta Ollama osiągalnego z OpenClaw
- `ollama signin`

W przypadku bezpośredniego wyszukiwania hostowanego ustaw bazowy adres URL dostawcy Ollama na `https://ollama.com` i podaj prawdziwy `OLLAMA_API_KEY`.

## Konfiguracja

<Steps>
  <Step title="Uruchom Ollama">
    Upewnij się, że Ollama jest zainstalowana i uruchomiona.
  </Step>
  <Step title="Zaloguj się">
    Uruchom:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Wybierz Ollama Web Search">
    Uruchom:

    ```bash
    openclaw configure --section web
    ```

    Następnie wybierz **Ollama Web Search** jako dostawcę.

  </Step>
</Steps>

Jeśli używasz już Ollama do modeli, Ollama Web Search ponownie wykorzystuje ten sam skonfigurowany host.

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

Opcjonalne zastąpienie hosta Ollama:

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

Jeśli Ollama jest już skonfigurowana jako dostawca modeli, dostawca wyszukiwania w sieci może zamiast tego ponownie użyć tego hosta:

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

Dostawca modeli Ollama używa `baseUrl` jako klucza kanonicznego. Dostawca wyszukiwania w sieci honoruje też `baseURL` w `models.providers.ollama` w celu zgodności z przykładami konfiguracji w stylu OpenAI SDK.

Jeśli nie ustawiono jawnego bazowego adresu URL Ollama, OpenClaw używa `http://127.0.0.1:11434`.

Jeśli host Ollama oczekuje uwierzytelniania bearer, OpenClaw ponownie używa `models.providers.ollama.apiKey` (lub zgodnego uwierzytelniania dostawcy opartego na zmiennych środowiskowych) dla żądań do tego skonfigurowanego hosta.

Bezpośrednie hostowane Ollama Web Search:

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
- Jeśli host Ollama jest chroniony uwierzytelnianiem, OpenClaw ponownie używa zwykłego klucza API dostawcy Ollama, gdy jest obecny.
- Jeśli `baseUrl` to `https://ollama.com`, OpenClaw wywołuje bezpośrednio `https://ollama.com/api/web_search` i wysyła skonfigurowany klucz API Ollama jako uwierzytelnianie bearer.
- Jeśli skonfigurowany host nie udostępnia wyszukiwania w sieci, a `OLLAMA_API_KEY` jest ustawiony, OpenClaw może awaryjnie użyć `https://ollama.com/api/web_search` bez wysyłania tego klucza środowiskowego do lokalnego hosta.
- OpenClaw ostrzega podczas konfiguracji, jeśli Ollama jest nieosiągalna lub użytkownik nie jest zalogowany, ale nie blokuje wyboru.
- Automatyczne wykrywanie w czasie działania może awaryjnie wybrać Ollama Web Search, gdy nie skonfigurowano dostawcy z poświadczeniami o wyższym priorytecie.
- Lokalne hosty demona Ollama używają lokalnego punktu końcowego proxy `/api/experimental/web_search`, który podpisuje żądania i przekazuje je do Ollama Cloud.
- Hosty `https://ollama.com` używają bezpośrednio publicznego hostowanego punktu końcowego `/api/web_search` z uwierzytelnianiem bearer za pomocą klucza API.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Ollama](/pl/providers/ollama) -- konfiguracja modeli Ollama oraz tryby chmurowy/lokalny
