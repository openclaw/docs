---
read_when:
    - Chcesz udostępniać modele z własnego komputera wyposażonego w GPU
    - Konfigurujesz LM Studio lub serwer proxy zgodny z OpenAI
    - Potrzebujesz wskazówek dotyczących najbezpieczniejszego modelu lokalnego
summary: Uruchamianie OpenClaw na lokalnych modelach LLM (LM Studio, vLLM, LiteLLM, niestandardowe punkty końcowe OpenAI)
title: Modele lokalne
x-i18n:
    generated_at: "2026-07-12T15:06:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Modele lokalne działają, ale podnoszą wymagania dotyczące sprzętu, rozmiaru kontekstu i ochrony przed wstrzykiwaniem poleceń: małe lub agresywnie skwantyzowane modele obcinają kontekst i pomijają filtry bezpieczeństwa po stronie dostawcy. Ta strona omawia bardziej zaawansowane lokalne stosy oraz niestandardowe serwery zgodne z OpenAI. Aby wybrać najprostszą ścieżkę, zacznij od [LM Studio](/pl/providers/lmstudio) lub [Ollama](/pl/providers/ollama) oraz polecenia `openclaw onboard`.

Informacje o lokalnych serwerach, które powinny uruchamiać się tylko wtedy, gdy wymaga ich wybrany model, znajdziesz w sekcji [Usługi modeli lokalnych](/pl/gateway/local-model-services).

## Minimalne wymagania sprzętowe

Aby zapewnić komfortową pętlę agenta, wybierz **co najmniej 2 komputery Mac Studio w maksymalnej konfiguracji lub równoważny zestaw GPU (ok. 30 tys. USD lub więcej)**. Pojedynczy GPU z **24 GB** pamięci obsłuży tylko prostsze polecenia i będzie działać z większym opóźnieniem. Zawsze uruchamiaj **największy wariant o pełnym rozmiarze, jaki możesz hostować** — małe lub silnie skwantyzowane punkty kontrolne zwiększają ryzyko wstrzykiwania poleceń (zobacz [Bezpieczeństwo](/pl/gateway/security)).

## Wybór zaplecza

| Zaplecze                                             | Kiedy używać                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| [ds4](/pl/providers/ds4)                                | Lokalny DeepSeek V4 Flash na macOS Metal ze zgodnymi z OpenAI wywołaniami narzędzi |
| [LM Studio](/pl/providers/lmstudio)                     | Pierwsza konfiguracja lokalna, program ładujący z GUI, natywny interfejs Responses API |
| LiteLLM / OAI-proxy / niestandardowe proxy zgodne z OpenAI | Gdy pośredniczysz w dostępie do innego API modelu i chcesz, aby OpenClaw traktował je jak OpenAI |
| MLX / vLLM / SGLang                                  | Samodzielnie hostowane udostępnianie o wysokiej przepustowości z punktem końcowym HTTP zgodnym z OpenAI |
| [Ollama](/pl/providers/ollama)                          | Przepływ pracy w CLI, biblioteka modeli, bezobsługowa usługa systemd                |

Użyj `api: "openai-responses"`, gdy zaplecze go obsługuje (LM Studio obsługuje). W przeciwnym razie użyj `api: "openai-completions"`. Jeśli w niestandardowym dostawcy z `baseUrl` pominięto `api`, OpenClaw domyślnie używa `openai-completions`.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** oficjalny instalator Ollama dla systemu Linux włącza usługę systemd z ustawieniem `Restart=always`. W konfiguracjach GPU z WSL2 automatyczny start może ponownie załadować ostatni model podczas uruchamiania i trwale zająć pamięć hosta, powodując wielokrotne restarty maszyny wirtualnej. Zobacz [Pętla awarii WSL2](/pl/providers/ollama#troubleshooting).
</Warning>

## LM Studio + duży model lokalny (Responses API)

Jest to obecnie najlepszy stos lokalny. Załaduj duży model w LM Studio (pełnowymiarową kompilację Qwen, DeepSeek lub Llama), włącz serwer lokalny (domyślnie `http://127.0.0.1:1234`) i użyj Responses API, aby oddzielić rozumowanie od tekstu końcowego.

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

Lista kontrolna konfiguracji:

- Zainstaluj LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Pobierz **największą dostępną kompilację modelu** (unikaj wariantów „małych” lub silnie skwantyzowanych), uruchom serwer i potwierdź, że model znajduje się na liście pod adresem `http://127.0.0.1:1234/v1/models`.
- Zastąp `my-local-model` rzeczywistym identyfikatorem modelu wyświetlanym w LM Studio.
- Pozostaw model załadowany; ładowanie od zera zwiększa opóźnienie uruchamiania.
- Dostosuj `contextWindow`/`maxTokens`, jeśli Twoja kompilacja LM Studio ma inne wartości.
- W przypadku WhatsApp pozostań przy Responses API, aby wysyłany był tylko tekst końcowy.
- Zachowaj `models.mode: "merge"`, aby modele hostowane pozostały dostępne jako opcje rezerwowe.

### Konfiguracja hybrydowa: hostowany model podstawowy, lokalny model rezerwowy

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

Aby w pierwszej kolejności używać modelu lokalnego, a model hostowany pozostawić jako zabezpieczenie, zamień kolejność `primary`/`fallbacks` i zachowaj ten sam blok `providers` oraz `models.mode: "merge"`.

### Hosting regionalny / trasowanie danych

Hostowane warianty MiniMax/Kimi/GLM są również dostępne w OpenRouter z punktami końcowymi przypisanymi do regionów (na przykład hostowanymi w Stanach Zjednoczonych). Wybierz wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, zachowując jednocześnie `models.mode: "merge"` dla modeli rezerwowych Anthropic/OpenAI. Korzystanie wyłącznie z modeli lokalnych nadal zapewnia najwyższy poziom prywatności; regionalne trasowanie hostowane stanowi rozwiązanie pośrednie, gdy potrzebujesz funkcji dostawcy, ale chcesz zachować kontrolę nad przepływem danych.

## Inne lokalne proxy zgodne z OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy lub dowolny niestandardowy Gateway działa, jeśli udostępnia punkt końcowy `/v1/chat/completions` w stylu OpenAI. Używaj `openai-completions`, chyba że dokumentacja zaplecza wyraźnie potwierdza obsługę `/v1/responses`.

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

Wpisy niestandardowych/lokalnych dostawców uznają dokładnie skonfigurowane źródło `baseUrl` za zaufane dla chronionych żądań modelu, w tym hosty pętli zwrotnej, sieci LAN, sieci tailnet i prywatnego DNS. Źródła metadanych i adresy lokalne dla łącza są zawsze blokowane. Żądania do innych źródeł prywatnych nadal wymagają ustawienia `models.providers.<id>.request.allowPrivateNetwork: true`; ustaw flagę zaufania na `false`, aby wyłączyć zaufanie do dokładnie wskazanego źródła.

`models.providers.<id>.models[].id` jest lokalny dla dostawcy — nie dołączaj prefiksu dostawcy. Dla serwera MLX uruchomionego za pomocą `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Ustaw `input: ["text", "image"]` dla lokalnych lub pośredniczonych modeli wizyjnych, aby załączniki graficzne były wstrzykiwane do tur agenta. Interaktywna konfiguracja niestandardowego dostawcy rozpoznaje typowe identyfikatory modeli wizyjnych i pyta tylko o nieznane nazwy; konfiguracja nieinteraktywna korzysta z tego samego rozpoznawania, z możliwością nadpisania za pomocą `--custom-image-input` / `--custom-text-input`.

W przypadku powolnych lokalnych lub zdalnych serwerów modeli użyj `models.providers.<id>.timeoutSeconds`, zanim zwiększysz `agents.defaults.timeoutSeconds`. Limit czasu dostawcy obejmuje nawiązywanie połączenia, nagłówki, strumieniowanie treści oraz całkowite przerwanie chronionego pobierania wyłącznie dla żądań HTTP modelu — jeśli limit czasu agenta/uruchomienia jest niższy, zwiększ również jego wartość, ponieważ limit czasu dostawcy nie może wydłużyć całego uruchomienia.

<Note>
W przypadku niestandardowych dostawców zgodnych z OpenAI akceptowany jest niepoufny lokalny znacznik, taki jak `apiKey: "ollama-local"`, gdy `baseUrl` wskazuje na pętlę zwrotną, prywatną sieć LAN, domenę `.local` lub prostą nazwę hosta — OpenClaw traktuje go jako prawidłowe lokalne poświadczenie zamiast zgłaszać brak klucza. Użyj rzeczywistej wartości dla każdego dostawcy, który akceptuje publiczną nazwę hosta.
</Note>

Uwagi dotyczące zachowania lokalnych lub pośredniczonych zapleczy `/v1`:

- OpenClaw traktuje je jako trasy proxy zgodne z OpenAI, a nie natywne punkty końcowe OpenAI.
- Kształtowanie żądań przeznaczone wyłącznie dla natywnego OpenAI nie ma zastosowania: bez `service_tier`, bez `store` interfejsu Responses, bez kształtowania ładunku zgodności rozumowania OpenAI i bez wskazówek dotyczących pamięci podręcznej poleceń.
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) nie są wstrzykiwane do niestandardowych adresów URL proxy.

Nadpisania zgodności dla bardziej rygorystycznych zapleczy zgodnych z OpenAI:

- **Treść wyłącznie jako ciąg znaków**: niektóre serwery akceptują tylko ciąg znaków w `messages[].content`, a nie ustrukturyzowane tablice części treści. Ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Ścisłe klucze wiadomości**: jeśli serwer odrzuca wpisy wiadomości zawierające więcej niż `role`/`content`, ustaw `compat.strictMessageKeys: true`.
- **Tekst narzędzia w nawiasach kwadratowych**: niektóre modele lokalne emitują jako tekst samodzielne żądania narzędzi w nawiasach kwadratowych, takie jak `[tool_name]`, po których następuje kod JSON i `[END_TOOL_REQUEST]`. OpenClaw przekształca je w rzeczywiste wywołania narzędzi tylko wtedy, gdy nazwa dokładnie odpowiada narzędziu zarejestrowanemu dla danej tury; w przeciwnym razie pozostają ukrytym, nieobsługiwanym tekstem.
- **Nieustrukturyzowany tekst przypominający wywołanie narzędzia**: jeśli model emituje tekst w stylu JSON/XML/ReAct, który wygląda jak wywołanie narzędzia, ale nie był ustrukturyzowanym wywołaniem, OpenClaw pozostawia go jako tekst i rejestruje ostrzeżenie z identyfikatorem uruchomienia, dostawcą/modelem, wykrytym wzorcem oraz nazwą narzędzia, jeśli jest dostępna. Jest to niezgodność dostawcy/modelu, a nie ukończone uruchomienie narzędzia.
- **Wymuszanie użycia narzędzia**: jeśli narzędzia pojawiają się jako tekst asystenta (surowy JSON/XML/ReAct albo pusta tablica `tool_calls`), najpierw potwierdź, że szablon/parser czatu serwera obsługuje wywołania narzędzi. Jeśli parser działa tylko przy wymuszonym użyciu narzędzi, nadpisz dla danego modelu domyślną wartość proxy `tool_choice: "auto"`:

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

  Używaj tego tylko wtedy, gdy każda zwykła tura powinna wywoływać narzędzie. Zastąp `local/my-local-model` dokładnym odwołaniem z `openclaw models list` albo ustaw je za pomocą CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Dodatkowe poziomy intensywności rozumowania**: jeśli niestandardowy model zgodny z OpenAI akceptuje poziomy intensywności rozumowania OpenAI wykraczające poza wbudowany profil, zadeklaruj je w bloku zgodności modelu. Dodanie `"xhigh"` udostępnia je dla tego odwołania do modelu w `/think xhigh`, selektorach sesji, walidacji Gateway oraz walidacji `llm-task`:

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

## Mniejsze lub bardziej rygorystyczne zaplecza

Jeśli model ładuje się prawidłowo, ale pełne tury agenta działają niepoprawnie, postępuj od ogółu do szczegółu: najpierw potwierdź działanie transportu, a następnie zawężaj zakres.

1. **Potwierdź, że model lokalny odpowiada** — bez narzędzi i bez kontekstu agenta:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Potwierdź routing Gateway** — wysyła wyłącznie prompt, pomijając transkrypcję, inicjalizację AGENTS, składanie silnika kontekstu, narzędzia i dołączone serwery MCP, ale nadal sprawdza routing Gateway, uwierzytelnianie i wybór dostawcy:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Wypróbuj tryb odchudzony**, jeśli oba testy kończą się powodzeniem, ale rzeczywiste tury agenta zawodzą z powodu nieprawidłowych wywołań narzędzi lub zbyt dużych promptów: ustaw `agents.defaults.experimental.localModelLean: true`. Tryb ten usuwa rozbudowane narzędzia przeglądarki, cron, wiadomości, generowania multimediów, obsługi głosu i plików PDF, chyba że są jawnie wymagane, a większe katalogi narzędzi domyślnie udostępnia za pośrednictwem ustrukturyzowanych mechanizmów wyszukiwania narzędzi, pozostawiając `exec` bezpośrednio widoczne. Szczegóły i sposób sprawdzenia, czy tryb jest włączony, znajdziesz w sekcji [Funkcje eksperymentalne -> Tryb odchudzony modelu lokalnego](/pl/concepts/experimental-features#local-model-lean-mode).

4. **W ostateczności całkowicie wyłącz narzędzia**, ustawiając dla tego modelu `models.providers.<provider>.models[].compat.supportsTools: false` — agent będzie wtedy działać bez wywołań narzędzi.

5. **Po wyczerpaniu tych możliwości wąskie gardło znajduje się po stronie systemu nadrzędnego.** Jeśli po włączeniu trybu odchudzonego i ustawieniu `supportsTools: false` backend nadal zawodzi tylko przy większych uruchomieniach OpenClaw, pozostały problem zwykle dotyczy samego modelu lub serwera — okna kontekstu, pamięci GPU, usuwania wpisów z pamięci podręcznej KV albo błędu backendu — a nie warstwy transportowej OpenClaw.

## Rozwiązywanie problemów

- **Gateway nie może połączyć się z serwerem proxy?** `curl http://127.0.0.1:1234/v1/models`.
- **Model został wyładowany z LM Studio?** Załaduj go ponownie; zimny start jest częstą przyczyną „zawieszania się”.
- **Serwer lokalny zgłasza `terminated`, `ECONNRESET` lub zamyka strumień w trakcie tury?** OpenClaw zapisuje w diagnostyce wartość `model.call.error.failureKind` o niewielkiej liczbie możliwych wariantów oraz migawkę RSS/sterty procesu OpenClaw. W przypadku presji na pamięć w LM Studio/Ollama porównaj ten znacznik czasu z dziennikiem serwera albo dziennikiem awarii/jetsam systemu macOS, aby potwierdzić, czy serwer modelu został zakończony.
- **Błędy kontekstu?** OpenClaw wyznacza progi kontroli wstępnej okna kontekstu na podstawie wykrytego okna modelu (lub ograniczonego okna, gdy `agents.defaults.contextTokens` je zmniejsza), wyświetlając ostrzeżenie poniżej 20% przy dolnej granicy **8k** i bezwzględnie blokując działanie poniżej 10% przy dolnej granicy **4k** (wartości są ograniczone do efektywnego okna kontekstu, aby zawyżone metadane modelu nie mogły spowodować odrzucenia prawidłowego limitu użytkownika). Zmniejsz `contextWindow` albo zwiększ limit kontekstu serwera/modelu.
- **`messages[].content ... expected a string`?** Dodaj `compat.requiresStringContent: true` do wpisu tego modelu.
- **`validation.keys` lub „message entries only allow `role` and `content`”?** Dodaj `compat.strictMessageKeys: true` do wpisu tego modelu.
- **Bezpośrednie wywołania `/v1/chat/completions` działają, ale `openclaw infer model run --local` nie działa z modelem Gemma lub innym modelem lokalnym?** Najpierw sprawdź adres URL dostawcy, odwołanie do modelu, znacznik uwierzytelniania i dzienniki serwera — `model run` całkowicie pomija narzędzia agenta. Jeśli `model run` działa, ale większe tury agenta zawodzą, ogranicz zestaw narzędzi za pomocą `localModelLean` lub `compat.supportsTools: false`.
- **Wywołania narzędzi pojawiają się jako nieprzetworzony tekst JSON/XML/ReAct albo dostawca zwraca pustą tablicę `tool_calls`?** Nie dodawaj serwera proxy, który bezwarunkowo przekształca tekst asystenta w wykonanie narzędzia — najpierw napraw szablon/parser czatu serwera. Jeśli model działa tylko przy wymuszonym użyciu narzędzi, dodaj opisane wyżej nadpisanie `params.extra_body.tool_choice: "required"` i używaj tego wpisu modelu wyłącznie w sesjach, w których w każdej turze oczekiwane jest wywołanie narzędzia.
- **Bezpieczeństwo**: modele lokalne pomijają filtry po stronie dostawcy. Ogranicz zakres działania agentów i pozostaw włączoną funkcję Compaction, aby zmniejszyć zasięg skutków wstrzykiwania promptów.

## Powiązane materiały

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
