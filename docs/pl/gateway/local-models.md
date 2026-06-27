---
read_when:
    - Chcesz udostępniać modele z własnej maszyny z GPU
    - Konfigurujesz LM Studio lub proxy zgodne z OpenAI
    - Potrzebujesz najbezpieczniejszych wskazówek dotyczących modelu lokalnego
summary: Uruchamianie OpenClaw na lokalnych LLM (LM Studio, vLLM, LiteLLM, niestandardowe punkty końcowe OpenAI)
title: Modele lokalne
x-i18n:
    generated_at: "2026-06-27T17:34:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

Modele lokalne są wykonalne. Podnoszą jednak poprzeczkę dla sprzętu, rozmiaru kontekstu i ochrony przed prompt injection — małe lub agresywnie skwantyzowane karty obcinają kontekst i osłabiają bezpieczeństwo. Ta strona to opiniotwórczy przewodnik po wyższej klasy lokalnych stosach i niestandardowych lokalnych serwerach zgodnych z OpenAI. Aby rozpocząć wdrażanie z najmniejszym tarciem, zacznij od [LM Studio](/pl/providers/lmstudio) lub [Ollama](/pl/providers/ollama) oraz `openclaw onboard`.

W przypadku lokalnych serwerów, które powinny uruchamiać się tylko wtedy, gdy potrzebuje ich wybrany model, zobacz
[Usługi modeli lokalnych](/pl/gateway/local-model-services).

## Minimalny próg sprzętowy

Celuj wysoko: **≥2 maksymalnie doposażone Mac Studio albo równoważna maszyna GPU (~30 tys. USD+)** dla wygodnej pętli agenta. Pojedynczy GPU **24 GB** działa tylko dla lżejszych promptów przy większym opóźnieniu. Zawsze uruchamiaj **największy / pełnowymiarowy wariant, jaki możesz hostować**; małe lub mocno skwantyzowane checkpointy zwiększają ryzyko prompt injection (zobacz [Bezpieczeństwo](/pl/gateway/security)).

## Wybierz backend

| Backend                                              | Używaj, gdy                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/pl/providers/ds4)                                | Lokalny DeepSeek V4 Flash na macOS Metal z wywołaniami narzędzi zgodnymi z OpenAI |
| [LM Studio](/pl/providers/lmstudio)                     | Pierwsza konfiguracja lokalna, loader GUI, natywne Responses API            |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | Wystawiasz inne API modelu i potrzebujesz, aby OpenClaw traktował je jak OpenAI |
| MLX / vLLM / SGLang                                  | Wysokoprzepustowe samodzielnie hostowane serwowanie z punktem końcowym HTTP zgodnym z OpenAI |
| [Ollama](/pl/providers/ollama)                          | Przepływ pracy CLI, biblioteka modeli, bezobsługowa usługa systemd          |

Użyj Responses API (`api: "openai-responses"`), gdy backend je obsługuje (LM Studio obsługuje). W przeciwnym razie trzymaj się Chat Completions (`api: "openai-completions"`).

<Warning>
**Użytkownicy WSL2 + Ollama + NVIDIA/CUDA:** Oficjalny instalator Ollama dla Linuksa włącza usługę systemd z `Restart=always`. W konfiguracjach WSL2 z GPU autostart może ponownie załadować ostatni model podczas uruchamiania i zająć pamięć hosta. Jeśli Twoja maszyna wirtualna WSL2 wielokrotnie uruchamia się ponownie po włączeniu Ollama, zobacz [pętlę awarii WSL2](/pl/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Zalecane: LM Studio + duży model lokalny (Responses API)

Najlepszy obecny stos lokalny. Załaduj duży model w LM Studio (na przykład pełnowymiarową kompilację Qwen, DeepSeek lub Llama), włącz lokalny serwer (domyślnie `http://127.0.0.1:1234`) i użyj Responses API, aby oddzielić rozumowanie od tekstu końcowego.

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
- W LM Studio pobierz **największą dostępną kompilację modelu** (unikaj wariantów "small"/mocno skwantyzowanych), uruchom serwer, potwierdź, że `http://127.0.0.1:1234/v1/models` ją wyświetla.
- Zastąp `my-local-model` rzeczywistym identyfikatorem modelu pokazanym w LM Studio.
- Utrzymuj model załadowany; zimne ładowanie dodaje opóźnienie uruchamiania.
- Dostosuj `contextWindow`/`maxTokens`, jeśli Twoja kompilacja LM Studio się różni.
- W przypadku WhatsApp trzymaj się Responses API, aby wysyłany był tylko tekst końcowy.

Zachowaj skonfigurowane modele hostowane nawet podczas pracy lokalnej; użyj `models.mode: "merge"`, aby fallbacki pozostały dostępne.

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

Zamień kolejność modelu głównego i fallbacków; zachowaj ten sam blok providers oraz `models.mode: "merge"`, aby móc wrócić do Sonnet lub Opus, gdy lokalna maszyna jest niedostępna.

### Hosting regionalny / routing danych

- Hostowane warianty MiniMax/Kimi/GLM istnieją również w OpenRouter z punktami końcowymi przypiętymi do regionu (np. hostowane w USA). Wybierz tam wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, nadal używając `models.mode: "merge"` dla fallbacków Anthropic/OpenAI.
- Tryb wyłącznie lokalny pozostaje najmocniejszą ścieżką prywatności; hostowany routing regionalny to rozwiązanie pośrednie, gdy potrzebujesz funkcji dostawcy, ale chcesz kontrolować przepływ danych.

## Inne lokalne proxy zgodne z OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy lub niestandardowe
bramy działają, jeśli wystawiają punkt końcowy w stylu OpenAI `/v1/chat/completions`.
Użyj adaptera Chat Completions, chyba że backend jawnie
dokumentuje obsługę `/v1/responses`. Zastąp powyższy blok provider swoim
punktem końcowym i identyfikatorem modelu:

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

Jeśli `api` zostanie pominięte w niestandardowym providerze z `baseUrl`, OpenClaw domyślnie używa
`openai-completions`. Niestandardowe/lokalne wpisy providerów ufają dokładnie skonfigurowanemu
origin `baseUrl` dla chronionych żądań modeli, w tym hostom loopback, LAN, tailnet
i prywatnego DNS. Żądania do innych prywatnych origin nadal wymagają
`request.allowPrivateNetwork: true`; origin metadanych/link-local pozostają zablokowane
bez jawnej zgody. Ustaw wartość `false`, aby zrezygnować z zaufania do dokładnego origin.

Wartość `models.providers.<id>.models[].id` jest lokalna dla providera. Nie
dołączaj tam prefiksu providera. Na przykład serwer MLX uruchomiony z
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` powinien używać tego
identyfikatora katalogowego i odwołania do modelu:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Ustaw `input: ["text", "image"]` w lokalnych lub pośredniczonych modelach wizyjnych, aby
załączniki obrazów były wstrzykiwane do tur agenta. Interaktywne wdrażanie
niestandardowego providera rozpoznaje typowe identyfikatory modeli wizyjnych i pyta tylko
o nieznane nazwy. Nieinteraktywne wdrażanie używa tego samego wnioskowania; użyj `--custom-image-input`
dla nieznanych identyfikatorów wizyjnych albo `--custom-text-input`, gdy model wyglądający na znany jest
tekstowy za Twoim punktem końcowym.

Zachowaj `models.mode: "merge"`, aby modele hostowane pozostały dostępne jako fallbacki.
Użyj `models.providers.<id>.timeoutSeconds` dla wolnych lokalnych lub zdalnych serwerów
modeli, zanim zwiększysz `agents.defaults.timeoutSeconds`. Timeout providera
dotyczy tylko żądań HTTP modelu, w tym połączenia, nagłówków, strumieniowania treści
i całkowitego przerwania guarded-fetch. Jeśli timeout agenta lub uruchomienia jest niższy, zwiększ
również ten limit, ponieważ timeouty providera nie mogą wydłużyć całego uruchomienia agenta.

<Note>
W przypadku niestandardowych providerów zgodnych z OpenAI utrwalenie niebędącego sekretem lokalnego znacznika, takiego jak `apiKey: "ollama-local"`, jest akceptowane, gdy `baseUrl` rozwiązuje się do loopback, prywatnej sieci LAN, `.local` lub samej nazwy hosta. OpenClaw traktuje go jako prawidłowe lokalne poświadczenie zamiast zgłaszać brak klucza. Użyj rzeczywistej wartości dla każdego providera, który akceptuje publiczną nazwę hosta.
</Note>

Uwaga dotycząca zachowania dla lokalnych/pośredniczonych backendów `/v1`:

- OpenClaw traktuje je jako trasy w stylu proxy zgodne z OpenAI, a nie natywne
  punkty końcowe OpenAI
- nie ma tu zastosowania kształtowanie żądań wyłącznie dla natywnego OpenAI: brak
  `service_tier`, brak Responses `store`, brak kształtowania payloadu zgodności
  rozumowania OpenAI i brak wskazówek prompt-cache
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane w tych niestandardowych adresach URL proxy

Uwagi o zgodności dla bardziej rygorystycznych backendów zgodnych z OpenAI:

- Niektóre serwery akceptują w Chat Completions tylko tekstowe `messages[].content`, a nie
  tablice ustrukturyzowanych części treści. Ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true` dla
  takich punktów końcowych.
- Niektóre modele lokalne emitują samodzielne nawiasowane żądania narzędzi jako tekst, takie jak
  `[tool_name]`, po którym następuje JSON i `[END_TOOL_REQUEST]`. OpenClaw promuje
  je do rzeczywistych wywołań narzędzi tylko wtedy, gdy nazwa dokładnie pasuje do zarejestrowanego
  narzędzia dla danej tury; w przeciwnym razie blok jest traktowany jako nieobsługiwany tekst i jest
  ukrywany przed odpowiedziami widocznymi dla użytkownika.
- Jeśli model emituje JSON, XML lub tekst w stylu ReAct, który wygląda jak wywołanie narzędzia,
  ale provider nie wyemitował ustrukturyzowanej inwokacji, OpenClaw pozostawia go jako
  tekst i zapisuje ostrzeżenie z identyfikatorem uruchomienia, providerem/modelem, wykrytym wzorcem oraz
  nazwą narzędzia, gdy jest dostępna. Traktuj to jako niezgodność wywołań narzędzi
  providera/modelu, a nie ukończone uruchomienie narzędzia.
- Jeśli narzędzia pojawiają się jako tekst asystenta zamiast się uruchamiać, na przykład surowy JSON,
  XML, składnia ReAct albo pusta tablica `tool_calls` w odpowiedzi providera,
  najpierw sprawdź, czy serwer używa szablonu/parsera chatu obsługującego wywołania narzędzi. Dla
  backendów Chat Completions zgodnych z OpenAI, których parser działa tylko wtedy, gdy użycie narzędzi
  jest wymuszone, ustaw nadpisanie żądania dla modelu zamiast polegać na parsowaniu
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
  Zastąp `local/my-local-model` dokładnym odwołaniem provider/model pokazanym przez
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Jeśli niestandardowy model zgodny z OpenAI akceptuje wysiłki rozumowania OpenAI wykraczające poza
  wbudowany profil, zadeklaruj je w bloku compat modelu. Dodanie tutaj `"xhigh"`
  sprawia, że `/think xhigh`, selektory sesji, walidacja Gateway i walidacja `llm-task`
  udostępniają ten poziom dla skonfigurowanego odwołania provider/model:

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

## Mniejsze lub bardziej restrykcyjne backendy

Jeśli model ładuje się poprawnie, ale pełne tury agenta działają nieprawidłowo, pracuj od góry do dołu — najpierw potwierdź transport, a potem zawęź obszar.

1. **Potwierdź, że sam model lokalny odpowiada.** Bez narzędzi, bez kontekstu agenta:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Potwierdź routowanie Gateway.** Wysyła tylko podany prompt — pomija transkrypt, inicjalizację AGENTS, składanie przez silnik kontekstu, narzędzia i dołączone serwery MCP, ale nadal sprawdza routowanie Gateway, uwierzytelnianie i wybór providera:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Wypróbuj tryb odchudzony.** Jeśli oba testy przechodzą, ale rzeczywiste tury agenta kończą się nieprawidłowymi wywołaniami narzędzi lub zbyt dużymi promptami, włącz `agents.defaults.experimental.localModelLean: true`. Usuwa trzy najcięższe narzędzia domyślne (`browser`, `cron`, `message`) i domyślnie umieszcza większe katalogi narzędzi za strukturalnymi kontrolkami wyszukiwania narzędzi, z wyjątkiem uruchomień, które muszą zachować bezpośrednią semantykę dostarczania `message`. Zobacz [Funkcje eksperymentalne → Tryb odchudzony modelu lokalnego](/pl/concepts/experimental-features#local-model-lean-mode), aby poznać pełne wyjaśnienie, kiedy go używać i jak potwierdzić, że jest włączony.

4. **W ostateczności całkowicie wyłącz narzędzia.** Jeśli tryb odchudzony nie wystarczy, ustaw `models.providers.<provider>.models[].compat.supportsTools: false` dla tego wpisu modelu. Agent będzie wtedy działać bez wywołań narzędzi na tym modelu.

5. **Poza tym wąskim gardłem jest warstwa upstream.** Jeśli backend nadal zawodzi tylko przy większych uruchomieniach OpenClaw po włączeniu trybu odchudzonego i `supportsTools: false`, pozostały problem zwykle dotyczy modelu upstream albo pojemności serwera — okna kontekstu, pamięci GPU, eksmisji kv-cache lub błędu backendu. Na tym etapie nie jest to warstwa transportowa OpenClaw.

## Rozwiązywanie problemów

- Gateway może połączyć się z proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio jest wyładowany? Załaduj ponownie; zimny start to częsta przyczyna „zawieszania się”.
- Serwer lokalny zgłasza `terminated`, `ECONNRESET` albo zamyka strumień w trakcie tury?
  OpenClaw zapisuje niskokardynalnościowe `model.call.error.failureKind` oraz migawkę
  RSS/heap procesu OpenClaw w diagnostyce. W przypadku presji pamięci LM Studio/Ollama
  dopasuj ten znacznik czasu do dziennika serwera albo dziennika awarii macOS /
  jetsam, aby potwierdzić, czy serwer modelu został zabity.
- OpenClaw wyprowadza progi preflight okna kontekstu z wykrytego okna modelu albo z nielimitowanego okna modelu, gdy `agents.defaults.contextTokens` obniża efektywne okno. Ostrzega poniżej 20% z dolnym limitem **8k**. Twarde blokady używają progu 10% z dolnym limitem **4k**, ograniczonego do efektywnego okna kontekstu, aby zbyt duże metadane modelu nie mogły odrzucić skądinąd poprawnego limitu użytkownika. Jeśli trafisz na ten preflight, zwiększ limit kontekstu serwera/modelu albo wybierz większy model.
- Błędy kontekstu? Obniż `contextWindow` albo zwiększ limit serwera.
- Serwer zgodny z OpenAI zwraca `messages[].content ... expected a string`?
  Dodaj `compat.requiresStringContent: true` w tym wpisie modelu.
- Serwer zgodny z OpenAI zwraca `validation.keys` albo mówi, że wpisy wiadomości dopuszczają tylko `role` i `content`?
  Dodaj `compat.strictMessageKeys: true` w tym wpisie modelu.
- Bezpośrednie małe wywołania `/v1/chat/completions` działają, ale `openclaw infer model run --local`
  zawodzi na Gemma albo innym modelu lokalnym? Najpierw sprawdź URL providera, referencję modelu, znacznik uwierzytelniania
  i dzienniki serwera; lokalne `model run` nie obejmuje narzędzi agenta.
  Jeśli lokalne `model run` się powiedzie, ale większe tury agenta zawodzą, zmniejsz
  powierzchnię narzędzi agenta za pomocą `localModelLean` albo `compat.supportsTools: false`.
- Wywołania narzędzi pojawiają się jako surowy tekst JSON/XML/ReAct albo provider zwraca
  pustą tablicę `tool_calls`? Nie dodawaj proxy, które ślepo konwertuje tekst asystenta
  na wykonanie narzędzi. Najpierw napraw szablon/parser czatu serwera. Jeśli
  model działa tylko wtedy, gdy użycie narzędzi jest wymuszone, dodaj powyższe nadpisanie dla konkretnego modelu
  `params.extra_body.tool_choice: "required"` i używaj tego wpisu modelu
  tylko dla sesji, w których wywołanie narzędzia jest oczekiwane w każdej turze.
- Bezpieczeństwo: modele lokalne pomijają filtry po stronie providera; utrzymuj agentów wąsko ukierunkowanych i włącz Compaction, aby ograniczyć promień rażenia wstrzyknięcia promptu.

## Powiązane

- [Odwołanie konfiguracji](/pl/gateway/configuration-reference)
- [Awaryjne przełączanie modelu](/pl/concepts/model-failover)
