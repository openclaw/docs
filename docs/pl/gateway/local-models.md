---
read_when:
    - Chcesz udostępniać modele z własnej maszyny GPU
    - Podłączasz LM Studio lub proxy zgodne z OpenAI
    - Potrzebujesz najbezpieczniejszych wskazówek dotyczących modeli lokalnych
summary: Uruchamiaj OpenClaw na lokalnych LLM-ach (LM Studio, vLLM, LiteLLM, niestandardowe endpointy OpenAI)
title: Modele lokalne
x-i18n:
    generated_at: "2026-04-05T13:53:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# Modele lokalne

Tryb lokalny jest możliwy, ale OpenClaw oczekuje dużego kontekstu i silnej ochrony przed prompt injection. Małe karty obcinają kontekst i osłabiają bezpieczeństwo. Celuj wysoko: **≥2 maksymalnie wyposażone Mac Studio lub równoważny zestaw GPU (~30 tys. USD+)**. Pojedynczy GPU **24 GB** działa tylko przy lżejszych promptach i większych opóźnieniach. Używaj **największego / pełnowymiarowego wariantu modelu, jaki możesz uruchomić**; agresywnie kwantyzowane lub „małe” checkpointy zwiększają ryzyko prompt injection (zobacz [Security](/gateway/security)).

Jeśli chcesz lokalnej konfiguracji z najmniejszym tarciem, zacznij od [Ollama](/providers/ollama) i `openclaw onboard`. Ta strona to praktyczny przewodnik dla bardziej zaawansowanych lokalnych stosów i niestandardowych lokalnych serwerów zgodnych z OpenAI.

## Zalecane: LM Studio + duży model lokalny (Responses API)

Obecnie najlepszy lokalny stos. Załaduj duży model w LM Studio (na przykład pełnowymiarową wersję Qwen, DeepSeek lub Llama), włącz lokalny serwer (domyślnie `http://127.0.0.1:1234`) i użyj Responses API, aby oddzielić rozumowanie od końcowego tekstu.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Lista kontrolna konfiguracji**

- Zainstaluj LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- W LM Studio pobierz **największą dostępną wersję modelu** (unikaj wariantów „small” / mocno kwantyzowanych), uruchom serwer i potwierdź, że `http://127.0.0.1:1234/v1/models` go wyświetla.
- Zastąp `my-local-model` rzeczywistym identyfikatorem modelu widocznym w LM Studio.
- Utrzymuj model załadowany; zimne ładowanie zwiększa opóźnienie uruchamiania.
- Dostosuj `contextWindow` / `maxTokens`, jeśli Twoja wersja LM Studio się różni.
- W przypadku WhatsApp trzymaj się Responses API, aby wysyłany był tylko końcowy tekst.

Nawet przy pracy lokalnej pozostaw skonfigurowane modele hostowane; użyj `models.mode: "merge"`, aby fallbacki nadal były dostępne.

### Konfiguracja hybrydowa: hostowany model główny, lokalny fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Najpierw lokalnie, z hostowaną siatką bezpieczeństwa

Zamień kolejność modelu głównego i fallbacków; zachowaj ten sam blok dostawców i `models.mode: "merge"`, aby móc wrócić do Sonnet lub Opus, gdy lokalna maszyna będzie niedostępna.

### Hosting regionalny / routing danych

- Hostowane warianty MiniMax/Kimi/GLM istnieją także w OpenRouter z endpointami przypiętymi do regionu (np. hostowane w USA). Wybierz tam wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, nadal używając `models.mode: "merge"` dla fallbacków Anthropic/OpenAI.
- Tryb wyłącznie lokalny pozostaje najsilniejszą ścieżką prywatności; hostowany routing regionalny to rozwiązanie pośrednie, gdy potrzebujesz funkcji dostawcy, ale chcesz kontrolować przepływ danych.

## Inne lokalne proxy zgodne z OpenAI

vLLM, LiteLLM, OAI-proxy lub niestandardowe gatewaye działają, jeśli udostępniają endpoint `/v1` w stylu OpenAI. Zastąp powyższy blok dostawcy swoim endpointem i identyfikatorem modelu:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Zachowaj `models.mode: "merge"`, aby hostowane modele nadal były dostępne jako fallbacki.

Uwaga dotycząca działania dla lokalnych / proxowanych backendów `/v1`:

- OpenClaw traktuje je jako trasy proxy zgodne z OpenAI, a nie natywne
  endpointy OpenAI
- nie stosuje się tutaj kształtowania żądań przeznaczonego wyłącznie dla natywnego OpenAI: brak
  `service_tier`, brak Responses `store`, brak kształtowania ładunku zgodności z reasoning OpenAI
  i brak wskazówek prompt-cache
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane do tych niestandardowych URL-i proxy

## Rozwiązywanie problemów

- Gateway może połączyć się z proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio został wyładowany? Załaduj go ponownie; zimny start to częsta przyczyna „zawieszenia”.
- Błędy kontekstu? Zmniejsz `contextWindow` lub zwiększ limit serwera.
- Bezpieczeństwo: modele lokalne pomijają filtry po stronie dostawcy; utrzymuj agentów w wąskim zakresie i włącz kompaktowanie, aby ograniczyć skutki prompt injection.
