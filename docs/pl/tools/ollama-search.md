---
read_when:
    - Chcesz używać Ollama do `web_search`
    - Chcesz dostawcę `web_search` bez klucza API
    - Potrzebujesz wskazówek dotyczących konfiguracji Ollama Web Search
summary: Ollama Web Search przez skonfigurowany host Ollama
title: Wyszukiwanie w sieci Ollama
x-i18n:
    generated_at: "2026-04-24T09:37:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw obsługuje **Ollama Web Search** jako dołączonego dostawcę `web_search`.
Używa eksperymentalnego API wyszukiwania w sieci Ollama i zwraca uporządkowane wyniki
z tytułami, URL-ami i fragmentami.

W przeciwieństwie do dostawcy modeli Ollama, ta konfiguracja domyślnie nie wymaga klucza API.
Wymaga jednak:

- hosta Ollama dostępnego z OpenClaw
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

Jeśli już używasz Ollama do modeli, Ollama Web Search używa ponownie tego samego
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

Jeśli nie ustawiono jawnego bazowego URL-a Ollama, OpenClaw używa `http://127.0.0.1:11434`.

Jeśli Twój host Ollama oczekuje uwierzytelniania bearer, OpenClaw używa ponownie
`models.providers.ollama.apiKey` (lub pasującego uwierzytelniania dostawcy opartego na zmiennych środowiskowych)
również dla żądań web search.

## Uwagi

- Ten dostawca nie wymaga osobnego pola klucza API specyficznego dla web search.
- Jeśli host Ollama jest chroniony uwierzytelnianiem, OpenClaw używa ponownie zwykłego klucza API
  dostawcy Ollama, jeśli jest dostępny.
- OpenClaw ostrzega podczas konfiguracji, jeśli Ollama jest nieosiągalna lub użytkownik nie jest zalogowany,
  ale nie blokuje wyboru.
- Automatyczne wykrywanie w czasie działania może przełączyć się na Ollama Web Search, jeśli nie skonfigurowano
  żadnego dostawcy z poświadczeniami o wyższym priorytecie.
- Dostawca używa eksperymentalnego endpointu Ollama `/api/experimental/web_search`.

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Ollama](/pl/providers/ollama) -- konfiguracja modeli Ollama oraz tryby cloud/local
