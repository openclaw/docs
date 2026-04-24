---
read_when:
    - Chcesz udostępniać modele z własnej maszyny GPU
    - Podłączasz LM Studio lub proxy zgodne z OpenAI
    - Potrzebujesz najbezpieczniejszych wskazówek dla modeli lokalnych
summary: Uruchamianie OpenClaw na lokalnych LLM-ach (LM Studio, vLLM, LiteLLM, niestandardowe punkty końcowe OpenAI)
title: Modele lokalne
x-i18n:
    generated_at: "2026-04-24T09:10:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

Lokalnie da się to zrobić, ale OpenClaw oczekuje dużego kontekstu i silnych zabezpieczeń przed prompt injection. Małe karty obcinają kontekst i osłabiają bezpieczeństwo. Celuj wysoko: **≥2 w pełni wyposażone Mac Studio lub równoważny zestaw GPU (~30 tys. USD+)**. Pojedyncze GPU **24 GB** działa tylko przy lżejszych promptach i z większym opóźnieniem. Używaj **największego / pełnowymiarowego wariantu modelu, jaki jesteś w stanie uruchomić**; agresywnie kwantyzowane lub „małe” checkpointy zwiększają ryzyko prompt injection (zobacz [Security](/pl/gateway/security)).

Jeśli chcesz najłatwiejszej lokalnej konfiguracji, zacznij od [LM Studio](/pl/providers/lmstudio) lub [Ollama](/pl/providers/ollama) i `openclaw onboard`. Ta strona to opiniotwórczy przewodnik po wyższej klasy lokalnych stosach i niestandardowych lokalnych serwerach zgodnych z OpenAI.

## Zalecane: LM Studio + duży model lokalny (Responses API)

Obecnie najlepszy lokalny stos. Załaduj duży model w LM Studio (na przykład pełnowymiarową kompilację Qwen, DeepSeek lub Llama), włącz lokalny serwer (domyślnie `http://127.0.0.1:1234`) i używaj Responses API, aby oddzielić rozumowanie od końcowego tekstu.

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
- W LM Studio pobierz **największą dostępną kompilację modelu** (unikaj wariantów „small” / mocno kwantyzowanych), uruchom serwer i potwierdź, że `http://127.0.0.1:1234/v1/models` go wyświetla.
- Zastąp `my-local-model` rzeczywistym identyfikatorem modelu pokazanym w LM Studio.
- Utrzymuj model załadowany; zimne ładowanie zwiększa opóźnienie startu.
- Dostosuj `contextWindow`/`maxTokens`, jeśli Twoja kompilacja LM Studio się różni.
- W przypadku WhatsApp trzymaj się Responses API, aby wysyłany był tylko końcowy tekst.

Nawet przy pracy lokalnej zachowaj skonfigurowane modele hostowane; użyj `models.mode: "merge"`, aby fallbacki pozostały dostępne.

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

### Priorytet lokalny z hostowaną siatką bezpieczeństwa

Zamień kolejność modelu głównego i fallbacku; zachowaj ten sam blok dostawców i `models.mode: "merge"`, aby można było użyć fallbacku do Sonnet lub Opus, gdy lokalna maszyna jest niedostępna.

### Hosting regionalny / routing danych

- Hostowane warianty MiniMax/Kimi/GLM istnieją także w OpenRouter z punktami końcowymi przypiętymi do regionu (np. hostowanymi w USA). Wybierz tam wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, a jednocześnie nadal używać `models.mode: "merge"` dla fallbacków Anthropic/OpenAI.
- Tryb wyłącznie lokalny pozostaje najmocniejszą ścieżką prywatności; hostowany routing regionalny to rozwiązanie pośrednie, gdy potrzebujesz funkcji dostawcy, ale chcesz kontrolować przepływ danych.

## Inne lokalne proxy zgodne z OpenAI

vLLM, LiteLLM, OAI-proxy lub niestandardowe bramki działają, jeśli udostępniają punkt końcowy `/v1` w stylu OpenAI. Zastąp powyższy blok dostawcy swoim punktem końcowym i identyfikatorem modelu:

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

Zachowaj `models.mode: "merge"`, aby hostowane modele pozostały dostępne jako fallbacki.

Uwaga dotycząca zachowania dla lokalnych/proksowanych backendów `/v1`:

- OpenClaw traktuje je jako ścieżki proxy zgodne z OpenAI, a nie natywne
  punkty końcowe OpenAI
- natywne dla OpenAI kształtowanie żądań nie ma tu zastosowania: brak
  `service_tier`, brak `store` w Responses, brak kształtowania ładunku zgodności rozumowania OpenAI
  oraz brak wskazówek cache promptu
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane przy tych niestandardowych URL-ach proxy

Uwagi o zgodności dla bardziej restrykcyjnych backendów zgodnych z OpenAI:

- Niektóre serwery akceptują tylko tekstowy `messages[].content` w Chat Completions, a nie
  ustrukturyzowane tablice części treści. Ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true` dla
  takich punktów końcowych.
- Niektóre mniejsze lub bardziej restrykcyjne lokalne backendy są niestabilne przy pełnym
  kształcie promptu runtime agenta OpenClaw, zwłaszcza gdy uwzględnione są schematy narzędzi. Jeśli
  backend działa przy małych bezpośrednich wywołaniach `/v1/chat/completions`, ale zawodzi przy zwykłych
  turach agenta OpenClaw, najpierw spróbuj
  `agents.defaults.experimental.localModelLean: true`, aby usunąć ciężkie
  domyślne narzędzia, takie jak `browser`, `cron` i `message`; to flaga eksperymentalna,
  a nie stabilne ustawienie trybu domyślnego. Zobacz
  [Experimental Features](/pl/concepts/experimental-features). Jeśli to nadal nie pomoże, spróbuj
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Jeśli backend nadal zawodzi tylko przy większych uruchomieniach OpenClaw, pozostały problem
  zwykle dotyczy wydajności nadrzędnego modelu/serwera albo błędu backendu, a nie warstwy transportu OpenClaw.

## Rozwiązywanie problemów

- Gateway może połączyć się z proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio niezaładowany? Załaduj go ponownie; zimny start jest częstą przyczyną „zawieszania”.
- OpenClaw ostrzega, gdy wykryte okno kontekstu jest mniejsze niż **32k**, i blokuje poniżej **16k**. Jeśli trafisz na ten preflight, zwiększ limit kontekstu serwera/modelu albo wybierz większy model.
- Błędy kontekstu? Zmniejsz `contextWindow` albo zwiększ limit serwera.
- Serwer zgodny z OpenAI zwraca `messages[].content ... expected a string`?
  Dodaj `compat.requiresStringContent: true` we wpisie tego modelu.
- Bezpośrednie małe wywołania `/v1/chat/completions` działają, ale `openclaw infer model run`
  zawodzi na Gemma lub innym modelu lokalnym? Najpierw wyłącz schematy narzędzi przez
  `compat.supportsTools: false`, a następnie przetestuj ponownie. Jeśli serwer nadal ulega awarii tylko
  przy większych promptach OpenClaw, traktuj to jako ograniczenie nadrzędnego serwera/modelu.
- Bezpieczeństwo: modele lokalne pomijają filtry po stronie dostawcy; utrzymuj agentów w wąskim zakresie i pozostawiaj włączone Compaction, aby ograniczyć zasięg prompt injection.

## Powiązane

- [Odwołanie do konfiguracji](/pl/gateway/configuration-reference)
- [Model failover](/pl/concepts/model-failover)
