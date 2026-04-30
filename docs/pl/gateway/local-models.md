---
read_when:
    - Chcesz udostępniać modele z własnej maszyny z GPU
    - Podłączasz LM Studio lub proxy zgodne z OpenAI
    - Potrzebujesz najbezpieczniejszych zaleceń dotyczących modelu lokalnego
summary: Uruchamiaj OpenClaw na lokalnych modelach LLM (LM Studio, vLLM, LiteLLM, niestandardowe punkty końcowe OpenAI)
title: Modele lokalne
x-i18n:
    generated_at: "2026-04-30T09:54:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Lokalnie jest to wykonalne, ale OpenClaw oczekuje dużego kontekstu i silnych zabezpieczeń przed prompt injection. Małe karty przycinają kontekst i osłabiają bezpieczeństwo. Celuj wysoko: **≥2 maksymalnie skonfigurowane Mac Studios lub równoważny zestaw GPU (~30 tys. USD+)**. Pojedyncza karta GPU **24 GB** działa tylko dla lżejszych promptów z większym opóźnieniem. Użyj **największego / pełnowymiarowego wariantu modelu, który możesz uruchomić**; agresywnie kwantyzowane lub „małe” checkpointy zwiększają ryzyko prompt injection (zobacz [Bezpieczeństwo](/pl/gateway/security)).

Jeśli chcesz lokalnej konfiguracji o najmniejszych tarciach, zacznij od [LM Studio](/pl/providers/lmstudio) albo [Ollama](/pl/providers/ollama) i `openclaw onboard`. Ta strona to opiniowany przewodnik dla lokalnych stosów wyższej klasy i niestandardowych lokalnych serwerów zgodnych z OpenAI.

<Warning>
**Użytkownicy WSL2 + Ollama + NVIDIA/CUDA:** Oficjalny instalator Ollama dla Linuksa włącza usługę systemd z `Restart=always`. W konfiguracjach WSL2 z GPU automatyczny start może ponownie załadować ostatni model podczas rozruchu i zająć pamięć hosta. Jeśli Twoja maszyna wirtualna WSL2 wielokrotnie uruchamia się ponownie po włączeniu Ollama, zobacz [pętla awarii WSL2](/pl/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Zalecane: LM Studio + duży model lokalny (Responses API)

Najlepszy obecny stos lokalny. Załaduj duży model w LM Studio (na przykład pełnowymiarową kompilację Qwen, DeepSeek albo Llama), włącz serwer lokalny (domyślnie `http://127.0.0.1:1234`) i użyj Responses API, aby oddzielić rozumowanie od końcowego tekstu.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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

**Lista kontrolna konfiguracji**

- Zainstaluj LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- W LM Studio pobierz **największą dostępną kompilację modelu** (unikaj „małych”/mocno kwantyzowanych wariantów), uruchom serwer, potwierdź, że `http://127.0.0.1:1234/v1/models` ją wyświetla.
- Zastąp `my-local-model` rzeczywistym identyfikatorem modelu pokazanym w LM Studio.
- Utrzymuj model załadowany; ładowanie na zimno dodaje opóźnienie uruchamiania.
- Dostosuj `contextWindow`/`maxTokens`, jeśli Twoja kompilacja LM Studio się różni.
- W przypadku WhatsApp pozostań przy Responses API, aby wysyłany był tylko końcowy tekst.

Pozostaw skonfigurowane modele hostowane nawet podczas pracy lokalnej; użyj `models.mode: "merge"`, aby awaryjne warianty nadal były dostępne.

### Konfiguracja hybrydowa: hostowany model główny, lokalny model awaryjny

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

### Najpierw lokalnie z hostowaną siatką bezpieczeństwa

Zamień kolejność modelu głównego i awaryjnego; zachowaj ten sam blok dostawców oraz `models.mode: "merge"`, aby móc przełączyć się awaryjnie na Sonnet albo Opus, gdy lokalna maszyna jest niedostępna.

### Hosting regionalny / trasowanie danych

- Hostowane warianty MiniMax/Kimi/GLM istnieją również w OpenRouter z endpointami przypiętymi do regionu (np. hostowanymi w USA). Wybierz tam wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, nadal używając `models.mode: "merge"` dla awaryjnych wariantów Anthropic/OpenAI.
- Podejście wyłącznie lokalne pozostaje najsilniejszą ścieżką prywatności; hostowane trasowanie regionalne to rozwiązanie pośrednie, gdy potrzebujesz funkcji dostawcy, ale chcesz kontrolować przepływ danych.

## Inne lokalne proxy zgodne z OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy albo niestandardowe Gateway działają, jeśli udostępniają endpoint w stylu OpenAI `/v1/chat/completions`. Użyj adaptera Chat Completions, chyba że backend wyraźnie dokumentuje obsługę `/v1/responses`. Zastąp powyższy blok dostawcy swoim endpointem i identyfikatorem modelu:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
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

Jeśli `api` zostanie pominięte u niestandardowego dostawcy z `baseUrl`, OpenClaw domyślnie używa `openai-completions`. Endpointy local loopback, takie jak `127.0.0.1`, są automatycznie zaufane; endpointy LAN, tailnet i prywatnego DNS nadal wymagają `request.allowPrivateNetwork: true`.

Wartość `models.providers.<id>.models[].id` jest lokalna dla dostawcy. Nie dołączaj tam prefiksu dostawcy. Na przykład serwer MLX uruchomiony z `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` powinien używać tego identyfikatora katalogu i referencji modelu:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Ustaw `input: ["text", "image"]` dla lokalnych lub pośredniczonych modeli wizyjnych, aby załączniki obrazów były wstrzykiwane do tur agenta. Interaktywny onboarding niestandardowego dostawcy rozpoznaje typowe identyfikatory modeli wizyjnych i pyta tylko o nieznane nazwy. Nieinteraktywny onboarding używa tego samego wnioskowania; użyj `--custom-image-input` dla nieznanych identyfikatorów wizyjnych albo `--custom-text-input`, gdy pozornie znany model za Twoim endpointem obsługuje tylko tekst.

Zachowaj `models.mode: "merge"`, aby modele hostowane pozostały dostępne jako warianty awaryjne. Użyj `models.providers.<id>.timeoutSeconds` dla wolnych lokalnych lub zdalnych serwerów modeli, zanim zwiększysz `agents.defaults.timeoutSeconds`. Limit czasu dostawcy dotyczy tylko żądań HTTP modelu, w tym połączenia, nagłówków, strumieniowania treści i całkowitego przerwania guarded-fetch.

<Note>
W przypadku niestandardowych dostawców zgodnych z OpenAI zapisanie niesekretnego lokalnego znacznika, takiego jak `apiKey: "ollama-local"`, jest akceptowane, gdy `baseUrl` rozwiązuje się do local loopback, prywatnej sieci LAN, `.local` albo samej nazwy hosta. OpenClaw traktuje go jako prawidłowe poświadczenie lokalne zamiast zgłaszać brakujący klucz. Użyj prawdziwej wartości dla każdego dostawcy, który akceptuje publiczną nazwę hosta.
</Note>

Uwaga dotycząca zachowania lokalnych/pośredniczonych backendów `/v1`:

- OpenClaw traktuje je jako trasy w stylu proxy zgodne z OpenAI, a nie natywne endpointy OpenAI
- nie stosuje się tutaj kształtowania żądań wyłącznie dla natywnego OpenAI: brak `service_tier`, brak Responses `store`, brak kształtowania payloadu zgodności rozumowania OpenAI i brak wskazówek pamięci podręcznej promptów
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) nie są wstrzykiwane do tych niestandardowych adresów URL proxy

Uwagi dotyczące zgodności dla bardziej rygorystycznych backendów zgodnych z OpenAI:

- Niektóre serwery akceptują w Chat Completions tylko tekstowy `messages[].content`, a nie uporządkowane tablice części treści. Ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true` dla tych endpointów.
- Niektóre modele lokalne emitują samodzielne żądania narzędzi w nawiasach jako tekst, takie jak `[tool_name]`, po którym następuje JSON i `[END_TOOL_REQUEST]`. OpenClaw promuje je do prawdziwych wywołań narzędzi tylko wtedy, gdy nazwa dokładnie pasuje do narzędzia zarejestrowanego dla danej tury; w przeciwnym razie blok jest traktowany jako nieobsługiwany tekst i ukrywany przed odpowiedziami widocznymi dla użytkownika.
- Jeśli model emituje JSON, XML albo tekst w stylu ReAct, który wygląda jak wywołanie narzędzia, ale dostawca nie wyemitował uporządkowanego wywołania, OpenClaw pozostawia go jako tekst i zapisuje ostrzeżenie z identyfikatorem uruchomienia, dostawcą/modelem, wykrytym wzorcem i nazwą narzędzia, gdy jest dostępna. Traktuj to jako niezgodność wywołań narzędzi dostawcy/modelu, a nie jako ukończone uruchomienie narzędzia.
- Jeśli narzędzia pojawiają się jako tekst asystenta zamiast się uruchamiać, na przykład surowy JSON, XML, składnia ReAct albo pusta tablica `tool_calls` w odpowiedzi dostawcy, najpierw zweryfikuj, czy serwer używa szablonu/parsera czatu obsługującego wywołania narzędzi. Dla backendów OpenAI-compatible Chat Completions, których parser działa tylko przy wymuszonym użyciu narzędzi, ustaw nadpisanie żądania dla modelu zamiast polegać na parsowaniu tekstu:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Używaj tego tylko dla modeli/sesji, w których każda normalna tura powinna wywoływać narzędzie. Nadpisuje to domyślną wartość proxy OpenClaw `tool_choice: "auto"`. Zastąp `local/my-local-model` dokładną referencją dostawca/model pokazaną przez `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Jeśli niestandardowy model zgodny z OpenAI akceptuje poziomy wysiłku rozumowania OpenAI wykraczające poza wbudowany profil, zadeklaruj je w bloku zgodności modelu. Dodanie tutaj `"xhigh"` sprawia, że `/think xhigh`, selektory sesji, walidacja Gateway i walidacja `llm-task` udostępniają ten poziom dla skonfigurowanej referencji dostawca/model:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- Niektóre mniejsze lub bardziej rygorystyczne lokalne backendy są niestabilne z pełnym kształtem promptu środowiska wykonawczego agenta OpenClaw, zwłaszcza gdy dołączone są schematy narzędzi. Najpierw zweryfikuj ścieżkę dostawcy lekką sondą lokalną:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Aby zweryfikować trasę Gateway bez pełnego kształtu promptu agenta, użyj zamiast tego sondy modelu Gateway:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Zarówno lokalna sonda modelu, jak i sonda modelu Gateway wysyłają tylko dostarczony prompt. Sonda Gateway nadal waliduje trasowanie Gateway, uwierzytelnianie i wybór dostawcy, ale celowo pomija wcześniejszą transkrypcję sesji, kontekst AGENTS/bootstrap, składanie przez silnik kontekstu, narzędzia i dołączone serwery MCP.

  Jeśli to się powiedzie, ale normalne tury agenta OpenClaw kończą się niepowodzeniem, najpierw spróbuj
  `agents.defaults.experimental.localModelLean: true`, aby usunąć ciężkie
  narzędzia domyślne, takie jak `browser`, `cron` i `message`; to flaga eksperymentalna,
  a nie stabilne ustawienie trybu domyślnego. Zobacz
  [Funkcje eksperymentalne](/pl/concepts/experimental-features). Jeśli to nadal nie pomoże, spróbuj
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Jeśli backend nadal zawodzi tylko przy większych uruchomieniach OpenClaw, pozostały problem
  zwykle dotyczy pojemności nadrzędnego modelu/serwera albo błędu backendu, a nie
  warstwy transportowej OpenClaw.

## Rozwiązywanie problemów

- Gateway może połączyć się z proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio wyładowany? Załaduj ponownie; zimny start jest częstą przyczyną „zawieszenia”.
- Serwer lokalny zgłasza `terminated`, `ECONNRESET` albo zamyka strumień w środku tury?
  OpenClaw zapisuje niskokardynalną wartość `model.call.error.failureKind` oraz
  migawkę RSS/sterty procesu OpenClaw w diagnostyce. W przypadku presji pamięci
  LM Studio/Ollama porównaj ten znacznik czasu z logiem serwera albo logiem awarii /
  jetsam systemu macOS, aby potwierdzić, czy serwer modelu został zabity.
- OpenClaw wyprowadza progi wstępnego sprawdzania okna kontekstu z wykrytego okna modelu albo z nieograniczonego okna modelu, gdy `agents.defaults.contextTokens` obniża efektywne okno. Ostrzega poniżej 20% z dolnym progiem **8k**. Twarde blokady używają progu 10% z dolnym progiem **4k**, ograniczonego do efektywnego okna kontekstu, aby zbyt duże metadane modelu nie odrzuciły skądinąd poprawnego limitu użytkownika. Jeśli trafisz na to sprawdzenie wstępne, podnieś limit kontekstu serwera/modelu albo wybierz większy model.
- Błędy kontekstu? Obniż `contextWindow` albo podnieś limit serwera.
- Serwer zgodny z OpenAI zwraca `messages[].content ... expected a string`?
  Dodaj `compat.requiresStringContent: true` do tego wpisu modelu.
- Bezpośrednie małe wywołania `/v1/chat/completions` działają, ale `openclaw infer model run --local`
  nie działa z Gemma albo innym modelem lokalnym? Najpierw sprawdź URL dostawcy, ref modelu, znacznik
  uwierzytelniania i logi serwera; lokalne `model run` nie obejmuje narzędzi agenta.
  Jeśli lokalne `model run` działa, ale większe tury agenta zawodzą, zmniejsz powierzchnię
  narzędzi agenta za pomocą `localModelLean` albo `compat.supportsTools: false`.
- Wywołania narzędzi pojawiają się jako surowy tekst JSON/XML/ReAct albo dostawca zwraca
  pustą tablicę `tool_calls`? Nie dodawaj proxy, które ślepo konwertuje tekst asystenta
  na wykonanie narzędzia. Najpierw napraw szablon/parser czatu serwera. Jeśli
  model działa tylko wtedy, gdy użycie narzędzi jest wymuszone, dodaj powyższe nadpisanie
  dla modelu `params.extra_body.tool_choice: "required"` i używaj tego wpisu modelu
  tylko w sesjach, w których wywołanie narzędzia jest oczekiwane w każdej turze.
- Bezpieczeństwo: modele lokalne pomijają filtry po stronie dostawcy; utrzymuj agentów w wąskim zakresie i włącz compaction, aby ograniczyć zasięg rażenia prompt injection.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
