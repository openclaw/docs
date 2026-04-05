---
read_when:
    - Chcesz używać Ollama do web_search
    - Chcesz dostawcę web_search bez klucza
    - Potrzebujesz wskazówek konfiguracji Ollama Web Search
summary: Ollama Web Search przez skonfigurowany host Ollama
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-05T14:08:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Ollama Web Search

OpenClaw obsługuje **Ollama Web Search** jako dołączonego dostawcę `web_search`.
Używa eksperymentalnego API wyszukiwania w sieci Ollama i zwraca uporządkowane wyniki
z tytułami, adresami URL i fragmentami.

W przeciwieństwie do dostawcy modeli Ollama ta konfiguracja domyślnie nie wymaga
klucza API. Wymaga natomiast:

- hosta Ollama osiągalnego z OpenClaw
- `ollama signin`

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
  <Step title="Wybierz Ollama Web Search">
    Uruchom:

    ```bash
    openclaw configure --section web
    ```

    Następnie wybierz **Ollama Web Search** jako dostawcę.

  </Step>
</Steps>

Jeśli już używasz Ollama do modeli, Ollama Web Search ponownie użyje tego samego
skonfigurowanego hosta.

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
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Jeśli nie ustawiono jawnie bazowego URL Ollama, OpenClaw używa `http://127.0.0.1:11434`.

Jeśli Twój host Ollama oczekuje uwierzytelniania bearer, OpenClaw ponownie używa
`models.providers.ollama.apiKey` (lub odpowiadającego mu uwierzytelniania dostawcy opartego na zmiennych środowiskowych)
również dla żądań web-search.

## Uwagi

- Dla tego dostawcy nie jest wymagane oddzielne pole klucza API specyficzne dla web_search.
- Jeśli host Ollama jest chroniony uwierzytelnianiem, OpenClaw ponownie używa zwykłego
  klucza API dostawcy Ollama, jeśli jest obecny.
- OpenClaw ostrzega podczas konfiguracji, jeśli Ollama jest nieosiągalna lub nie jesteś zalogowany,
  ale nie blokuje wyboru.
- Automatyczne wykrywanie w runtime może przełączyć się awaryjnie na Ollama Web Search, gdy nie jest skonfigurowany żaden dostawca z poświadczeniami o wyższym priorytecie.
- Dostawca używa eksperymentalnego endpointu Ollama `/api/experimental/web_search`.

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Ollama](/providers/ollama) -- konfiguracja modeli Ollama oraz tryby cloud/local
