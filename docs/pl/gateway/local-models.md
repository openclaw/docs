---
read_when:
    - Chcesz udostępniać modele z własnej maszyny z GPU
    - Konfigurujesz LM Studio lub proxy zgodne z OpenAI
    - Potrzebujesz najbezpieczniejszych wskazówek dotyczących modelu lokalnego
summary: Uruchamianie OpenClaw na lokalnych modelach LLM (LM Studio, vLLM, LiteLLM, niestandardowe punkty końcowe OpenAI)
title: Modele lokalne
x-i18n:
    generated_at: "2026-05-06T09:12:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

Modele lokalne są możliwe do użycia. Podnoszą jednak wymagania dotyczące sprzętu, rozmiaru kontekstu i obrony przed prompt injection — małe albo agresywnie kwantyzowane karty obcinają kontekst i osłabiają bezpieczeństwo. Ta strona jest opiniotwórczym przewodnikiem po wyższej klasy stosach lokalnych i niestandardowych serwerach lokalnych zgodnych z OpenAI. Aby rozpocząć z najmniejszym tarciem, zacznij od [LM Studio](/pl/providers/lmstudio) albo [Ollama](/pl/providers/ollama) oraz `openclaw onboard`.

## Minimalny sprzęt

Celuj wysoko: **≥2 maksymalnie skonfigurowane Mac Studio albo równoważny zestaw GPU (~30 tys. USD+)** dla komfortowej pętli agenta. Pojedyncze GPU **24 GB** działa tylko dla lżejszych promptów przy większym opóźnieniu. Zawsze uruchamiaj **największy / pełnowymiarowy wariant, jaki możesz hostować**; małe albo mocno kwantyzowane checkpointy zwiększają ryzyko prompt injection (zobacz [Bezpieczeństwo](/pl/gateway/security)).

## Wybierz backend

| Backend                                              | Użyj, gdy                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/pl/providers/lmstudio)                     | Pierwsza konfiguracja lokalna, loader GUI, natywne Responses API                    |
| [Ollama](/pl/providers/ollama)                          | Przepływ pracy CLI, biblioteka modeli, bezobsługowa usługa systemd                      |
| MLX / vLLM / SGLang                                  | Wysokoprzepustowe samodzielne serwowanie z punktem końcowym HTTP zgodnym z OpenAI |
| LiteLLM / OAI-proxy / niestandardowy proxy zgodny z OpenAI | Udostępniasz inną API modeli i potrzebujesz, aby OpenClaw traktował ją jak OpenAI         |

Używaj Responses API (`api: "openai-responses"`), gdy backend je obsługuje (LM Studio obsługuje). W przeciwnym razie trzymaj się Chat Completions (`api: "openai-completions"`).

<Warning>
**Użytkownicy WSL2 + Ollama + NVIDIA/CUDA:** Oficjalny instalator Ollama dla Linuksa włącza usługę systemd z `Restart=always`. W konfiguracjach WSL2 z GPU autostart może ponownie załadować ostatni model podczas rozruchu i zająć pamięć hosta. Jeśli Twoja maszyna wirtualna WSL2 wielokrotnie restartuje się po włączeniu Ollama, zobacz [pętlę awarii WSL2](/pl/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Zalecane: LM Studio + duży model lokalny (Responses API)

Najlepszy obecnie stos lokalny. Załaduj duży model w LM Studio (na przykład pełnowymiarowy build Qwen, DeepSeek albo Llama), włącz serwer lokalny (domyślnie `http://127.0.0.1:1234`) i użyj Responses API, aby oddzielić rozumowanie od tekstu końcowego.

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
- W LM Studio pobierz **największy dostępny build modelu** (unikaj wariantów "small"/mocno kwantyzowanych), uruchom serwer i potwierdź, że `http://127.0.0.1:1234/v1/models` go wyświetla.
- Zastąp `my-local-model` rzeczywistym ID modelu pokazanym w LM Studio.
- Utrzymuj model załadowany; zimne ładowanie dodaje opóźnienie uruchamiania.
- Dostosuj `contextWindow`/`maxTokens`, jeśli Twój build LM Studio jest inny.
- Dla WhatsApp trzymaj się Responses API, aby wysyłany był tylko tekst końcowy.

Zachowaj skonfigurowane modele hostowane nawet przy pracy lokalnej; użyj `models.mode: "merge"`, aby fallbacki pozostały dostępne.

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

Zamień kolejność modelu głównego i fallbacków; zachowaj ten sam blok providers oraz `models.mode: "merge"`, aby móc wrócić do Sonnet albo Opus, gdy lokalna maszyna jest niedostępna.

### Hosting regionalny / routing danych

- Hostowane warianty MiniMax/Kimi/GLM istnieją też w OpenRouter z punktami końcowymi przypiętymi do regionu (np. hostowanymi w USA). Wybierz tam wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, nadal używając `models.mode: "merge"` dla fallbacków Anthropic/OpenAI.
- Tryb wyłącznie lokalny pozostaje najmocniejszą ścieżką prywatności; hostowany routing regionalny jest rozwiązaniem pośrednim, gdy potrzebujesz funkcji dostawcy, ale chcesz kontrolować przepływ danych.

## Inne lokalne proxy zgodne z OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy albo niestandardowe
Gateway działają, jeśli udostępniają punkt końcowy w stylu OpenAI
`/v1/chat/completions`. Użyj adaptera Chat Completions, chyba że backend jawnie
dokumentuje obsługę `/v1/responses`. Zastąp powyższy blok provider swoim
punktem końcowym i ID modelu:

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

Jeśli `api` zostanie pominięte w niestandardowym provider z `baseUrl`, OpenClaw domyślnie używa
`openai-completions`. Punkty końcowe loopback, takie jak `127.0.0.1`, są zaufane
automatycznie; punkty końcowe LAN, tailnet oraz prywatnego DNS nadal wymagają
`request.allowPrivateNetwork: true`.

Wartość `models.providers.<id>.models[].id` jest lokalna dla provider. Nie
dodawaj tam prefiksu provider. Na przykład serwer MLX uruchomiony poleceniem
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` powinien używać
tego ID katalogu i referencji modelu:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Ustaw `input: ["text", "image"]` na lokalnych albo proxowanych modelach wizyjnych, aby załączniki
obrazów były wstrzykiwane do tur agenta. Interaktywny onboarding niestandardowego provider
wnioskuje typowe ID modeli wizyjnych i pyta tylko o nieznane nazwy.
Nieinteraktywny onboarding używa tej samej inferencji; użyj `--custom-image-input`
dla nieznanych ID wizyjnych albo `--custom-text-input`, gdy model wyglądający na znany jest
tekstowy za Twoim punktem końcowym.

Zachowaj `models.mode: "merge"`, aby modele hostowane pozostały dostępne jako fallbacki.
Użyj `models.providers.<id>.timeoutSeconds` dla wolnych lokalnych albo zdalnych serwerów
modeli przed podnoszeniem `agents.defaults.timeoutSeconds`. Timeout provider
dotyczy tylko żądań HTTP modeli, w tym połączenia, nagłówków, streamingu treści
oraz całkowitego przerwania chronionego fetch.

<Note>
Dla niestandardowych provider zgodnych z OpenAI utrwalenie niesekretnego lokalnego znacznika, takiego jak `apiKey: "ollama-local"`, jest akceptowane, gdy `baseUrl` rozwiązuje się do loopback, prywatnej sieci LAN, `.local` albo gołej nazwy hosta. OpenClaw traktuje go jako prawidłowe lokalne poświadczenie zamiast zgłaszać brakujący klucz. Użyj rzeczywistej wartości dla każdego provider, który akceptuje publiczną nazwę hosta.
</Note>

Uwaga dotycząca zachowania lokalnych/proxowanych backendów `/v1`:

- OpenClaw traktuje je jako trasy zgodne z OpenAI w stylu proxy, a nie natywne
  punkty końcowe OpenAI
- natywne kształtowanie żądań właściwe tylko dla OpenAI nie ma tutaj zastosowania: brak
  `service_tier`, brak Responses `store`, brak kształtowania payloadu zgodności rozumowania OpenAI
  i brak wskazówek prompt cache
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane w tych niestandardowych URL proxy

Uwagi o zgodności dla bardziej rygorystycznych backendów zgodnych z OpenAI:

- Niektóre serwery akceptują w Chat Completions tylko string `messages[].content`, a nie
  strukturalne tablice części treści. Ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true` dla
  takich punktów końcowych.
- Niektóre modele lokalne emitują samodzielne nawiasowane żądania narzędzi jako tekst, takie jak
  `[tool_name]`, po których następuje JSON i `[END_TOOL_REQUEST]`. OpenClaw promuje
  je do rzeczywistych wywołań narzędzi tylko wtedy, gdy nazwa dokładnie pasuje do zarejestrowanego
  narzędzia dla danej tury; w przeciwnym razie blok jest traktowany jako nieobsługiwany tekst i
  ukrywany przed odpowiedziami widocznymi dla użytkownika.
- Jeśli model emituje JSON, XML albo tekst w stylu ReAct, który wygląda jak wywołanie narzędzia,
  ale provider nie wyemitował strukturalnego wywołania, OpenClaw pozostawia go jako
  tekst i zapisuje ostrzeżenie z ID uruchomienia, provider/modelem, wykrytym wzorcem oraz
  nazwą narzędzia, jeśli jest dostępna. Traktuj to jako niezgodność wywoływania narzędzi
  provider/modelu, a nie zakończone uruchomienie narzędzia.
- Jeśli narzędzia pojawiają się jako tekst asystenta zamiast zostać uruchomione, na przykład surowy JSON,
  XML, składnia ReAct albo pusta tablica `tool_calls` w odpowiedzi provider,
  najpierw sprawdź, czy serwer używa szablonu/parsera chatu obsługującego wywołania narzędzi. Dla
  backendów Chat Completions zgodnych z OpenAI, których parser działa tylko wtedy, gdy użycie narzędzi
  jest wymuszone, ustaw nadpisanie żądania per model zamiast polegać na parsowaniu
  tekstu:

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

  Używaj tego tylko dla modeli/sesji, w których każda normalna tura powinna wywoływać narzędzie.
  Nadpisuje to domyślną wartość proxy OpenClaw `tool_choice: "auto"`.
  Zastąp `local/my-local-model` dokładną referencją provider/model pokazaną przez
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Jeśli niestandardowy model zgodny z OpenAI akceptuje poziomy wysiłku rozumowania OpenAI wykraczające poza
  wbudowany profil, zadeklaruj je w bloku zgodności modelu. Dodanie tutaj `"xhigh"`
  sprawia, że `/think xhigh`, wybieraki sesji, walidacja Gateway oraz walidacja `llm-task`
  udostępniają ten poziom dla skonfigurowanej referencji provider/model:

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

## Mniejsze albo bardziej rygorystyczne backendy

Jeśli model ładuje się poprawnie, ale pełne tury agenta zachowują się nieprawidłowo, pracuj od góry do dołu — najpierw potwierdź transport, a potem zawężaj powierzchnię.

1. **Potwierdź, że sam model lokalny odpowiada.** Bez narzędzi, bez kontekstu agenta:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Potwierdź routing Gateway.** Wysyła tylko podany prompt — pomija transkrypcję, inicjalizację AGENTS, składanie context-engine, narzędzia i dołączone serwery MCP, ale nadal sprawdza routing Gateway, uwierzytelnianie i wybór dostawcy:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Wypróbuj tryb odchudzony.** Jeśli oba testy przechodzą, ale rzeczywiste tury agenta kończą się nieprawidłowo sformatowanymi wywołaniami narzędzi lub zbyt dużymi promptami, włącz `agents.defaults.experimental.localModelLean: true`. Usuwa trzy najcięższe domyślne narzędzia (`browser`, `cron`, `message`), dzięki czemu kształt promptu jest mniejszy i mniej podatny na błędy. Zobacz [Funkcje eksperymentalne → Tryb odchudzony modelu lokalnego](/pl/concepts/experimental-features#local-model-lean-mode), aby uzyskać pełne wyjaśnienie, kiedy go używać i jak potwierdzić, że jest włączony.

4. **W ostateczności całkowicie wyłącz narzędzia.** Jeśli tryb odchudzony nie wystarcza, ustaw `models.providers.<provider>.models[].compat.supportsTools: false` dla tego wpisu modelu. Agent będzie wtedy działać na tym modelu bez wywołań narzędzi.

5. **Po tym punkcie wąskim gardłem jest warstwa nadrzędna.** Jeśli backend nadal zawodzi tylko przy większych uruchomieniach OpenClaw po włączeniu trybu odchudzonego i `supportsTools: false`, pozostały problem zwykle dotyczy modelu lub pojemności serwera po stronie nadrzędnej — okna kontekstu, pamięci GPU, usuwania kv-cache albo błędu backendu. Na tym etapie nie jest to już warstwa transportowa OpenClaw.

## Rozwiązywanie problemów

- Czy Gateway może połączyć się z proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio jest wyładowany? Załaduj go ponownie; zimny start to częsta przyczyna „zawieszania”.
- Serwer lokalny zgłasza `terminated`, `ECONNRESET` albo zamyka strumień w trakcie tury?
  OpenClaw zapisuje niskokardynalny `model.call.error.failureKind` oraz migawkę RSS/sterty procesu
  OpenClaw w diagnostyce. Przy presji pamięci w LM Studio/Ollama dopasuj ten znacznik czasu
  do logu serwera albo logu awarii / jetsam macOS, aby potwierdzić, czy serwer modelu został zabity.
- OpenClaw wyprowadza progi kontroli wstępnej okna kontekstu z wykrytego okna modelu albo z nieograniczonego okna modelu, gdy `agents.defaults.contextTokens` obniża efektywne okno. Ostrzega poniżej 20% z dolnym progiem **8k**. Twarde blokady używają progu 10% z dolnym progiem **4k**, ograniczonego do efektywnego okna kontekstu, aby zbyt duże metadane modelu nie mogły odrzucić prawidłowego limitu użytkownika. Jeśli trafisz na tę kontrolę wstępną, zwiększ limit kontekstu serwera/modelu albo wybierz większy model.
- Błędy kontekstu? Obniż `contextWindow` albo zwiększ limit serwera.
- Serwer zgodny z OpenAI zwraca `messages[].content ... expected a string`?
  Dodaj `compat.requiresStringContent: true` do tego wpisu modelu.
- Bezpośrednie małe wywołania `/v1/chat/completions` działają, ale `openclaw infer model run --local`
  zawodzi na Gemma lub innym modelu lokalnym? Najpierw sprawdź adres URL dostawcy, referencję modelu, znacznik uwierzytelniania
  i logi serwera; lokalne `model run` nie obejmuje narzędzi agenta.
  Jeśli lokalne `model run` działa, ale większe tury agenta zawodzą, zmniejsz powierzchnię narzędzi agenta
  za pomocą `localModelLean` albo `compat.supportsTools: false`.
- Wywołania narzędzi pojawiają się jako surowy tekst JSON/XML/ReAct albo dostawca zwraca
  pustą tablicę `tool_calls`? Nie dodawaj proxy, które ślepo konwertuje tekst asystenta
  na wykonanie narzędzia. Najpierw napraw szablon/parser czatu serwera. Jeśli
  model działa tylko wtedy, gdy użycie narzędzi jest wymuszone, dodaj powyższe nadpisanie
  `params.extra_body.tool_choice: "required"` dla danego modelu i używaj tego wpisu modelu
  tylko w sesjach, w których wywołanie narzędzia jest oczekiwane w każdej turze.
- Bezpieczeństwo: modele lokalne pomijają filtry po stronie dostawcy; utrzymuj agentów w wąskim zakresie i miej włączoną Compaction, aby ograniczyć zasięg prompt injection.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
