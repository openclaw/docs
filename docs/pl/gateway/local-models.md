---
read_when:
    - Chcesz udostępniać modele z własnej maszyny z GPU
    - Konfigurujesz LM Studio lub proxy zgodne z OpenAI
    - Potrzebujesz wskazówek dotyczących najbezpieczniejszego modelu lokalnego
summary: Uruchamianie OpenClaw na lokalnych modelach LLM (LM Studio, vLLM, LiteLLM, niestandardowe punkty końcowe OpenAI)
title: Modele lokalne
x-i18n:
    generated_at: "2026-05-02T22:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

Modele lokalne są wykonalne. Podnoszą jednak poprzeczkę w zakresie sprzętu, rozmiaru kontekstu i obrony przed wstrzykiwaniem promptów — małe lub agresywnie skwantyzowane karty obcinają kontekst i osłabiają bezpieczeństwo. Ta strona jest opiniowanym przewodnikiem po lokalnych stosach wyższej klasy i niestandardowych lokalnych serwerach zgodnych z OpenAI. Aby rozpocząć z najmniejszym tarciem, zacznij od [LM Studio](/pl/providers/lmstudio) lub [Ollama](/pl/providers/ollama) oraz `openclaw onboard`.

## Minimalny sprzęt

Celuj wysoko: **≥2 maksymalnie rozbudowane Mac Studio albo równoważny zestaw GPU (~30 tys. USD+)** dla komfortowej pętli agenta. Pojedyncze GPU **24 GB** działa tylko przy lżejszych promptach i większym opóźnieniu. Zawsze uruchamiaj **największy / pełnowymiarowy wariant, który możesz hostować**; małe lub mocno skwantyzowane checkpointy zwiększają ryzyko wstrzykiwania promptów (zobacz [Bezpieczeństwo](/pl/gateway/security)).

## Wybierz backend

| Backend                                              | Użyj, gdy                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/pl/providers/lmstudio)                     | Pierwsza konfiguracja lokalna, loader GUI, natywne Responses API            |
| [Ollama](/pl/providers/ollama)                          | Przepływ pracy CLI, biblioteka modeli, bezobsługowa usługa systemd          |
| MLX / vLLM / SGLang                                  | Wysokoprzepustowe samodzielne serwowanie z punktem końcowym HTTP zgodnym z OpenAI |
| LiteLLM / OAI-proxy / niestandardowy proxy zgodny z OpenAI | Udostępniasz inne API modelu i chcesz, aby OpenClaw traktował je jak OpenAI |

Używaj Responses API (`api: "openai-responses"`), gdy backend je obsługuje (LM Studio obsługuje). W przeciwnym razie pozostań przy Chat Completions (`api: "openai-completions"`).

<Warning>
**Użytkownicy WSL2 + Ollama + NVIDIA/CUDA:** Oficjalny instalator Ollama dla Linuksa włącza usługę systemd z `Restart=always`. W konfiguracjach WSL2 z GPU autostart może podczas rozruchu ponownie załadować ostatni model i zająć pamięć hosta. Jeśli Twoja maszyna wirtualna WSL2 wielokrotnie restartuje się po włączeniu Ollama, zobacz [pętla awarii WSL2](/pl/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Zalecane: LM Studio + duży model lokalny (Responses API)

Najlepszy obecnie stos lokalny. Załaduj duży model w LM Studio (na przykład pełnowymiarowy build Qwen, DeepSeek lub Llama), włącz serwer lokalny (domyślnie `http://127.0.0.1:1234`) i używaj Responses API, aby oddzielać rozumowanie od końcowego tekstu.

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
- W LM Studio pobierz **największy dostępny build modelu** (unikaj wariantów „small”/mocno skwantyzowanych), uruchom serwer i potwierdź, że `http://127.0.0.1:1234/v1/models` go wyświetla.
- Zastąp `my-local-model` rzeczywistym ID modelu pokazanym w LM Studio.
- Utrzymuj model załadowany; zimne ładowanie dodaje opóźnienie startowe.
- Dostosuj `contextWindow`/`maxTokens`, jeśli Twój build LM Studio się różni.
- Dla WhatsApp pozostań przy Responses API, aby wysyłany był tylko tekst końcowy.

Zachowaj skonfigurowane modele hostowane nawet podczas działania lokalnego; użyj `models.mode: "merge"`, aby fallbacki pozostały dostępne.

### Konfiguracja hybrydowa: hostowany model podstawowy, lokalny fallback

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

Zamień kolejność modelu podstawowego i fallbacków; zachowaj ten sam blok dostawców i `models.mode: "merge"`, aby móc przełączyć się awaryjnie na Sonnet lub Opus, gdy lokalna maszyna jest niedostępna.

### Hosting regionalny / routing danych

- Hostowane warianty MiniMax/Kimi/GLM istnieją też w OpenRouter z punktami końcowymi przypiętymi do regionu (np. hostowane w USA). Wybierz tam wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, nadal używając `models.mode: "merge"` dla fallbacków Anthropic/OpenAI.
- Tylko lokalnie pozostaje najsilniejszą ścieżką prywatności; hostowany routing regionalny jest rozwiązaniem pośrednim, gdy potrzebujesz funkcji dostawcy, ale chcesz kontrolować przepływ danych.

## Inne lokalne proxy zgodne z OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy lub niestandardowe
Gateway działają, jeśli udostępniają punkt końcowy `/v1/chat/completions`
w stylu OpenAI. Używaj adaptera Chat Completions, chyba że backend wyraźnie
dokumentuje obsługę `/v1/responses`. Zastąp powyższy blok dostawcy swoim
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

Jeśli `api` zostanie pominięte w niestandardowym dostawcy z `baseUrl`, OpenClaw domyślnie używa
`openai-completions`. Punkty końcowe loopback, takie jak `127.0.0.1`, są zaufane
automatycznie; punkty końcowe LAN, tailnet i prywatnego DNS nadal wymagają
`request.allowPrivateNetwork: true`.

Wartość `models.providers.<id>.models[].id` jest lokalna dla dostawcy. Nie
uwzględniaj tam prefiksu dostawcy. Na przykład serwer MLX uruchomiony z
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` powinien używać tego
ID katalogowego i odwołania do modelu:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Ustaw `input: ["text", "image"]` w lokalnych lub proxyowanych modelach wizyjnych, aby załączniki
obrazów były wstrzykiwane do tur agenta. Interaktywne onboardowanie niestandardowego dostawcy
wnioskuje typowe ID modeli wizyjnych i pyta tylko o nieznane nazwy.
Nieinteraktywne onboardowanie używa tego samego wnioskowania; użyj `--custom-image-input`
dla nieznanych ID wizyjnych lub `--custom-text-input`, gdy model wyglądający na znany jest
tekstowy za Twoim punktem końcowym.

Zachowaj `models.mode: "merge"`, aby hostowane modele pozostały dostępne jako fallbacki.
Użyj `models.providers.<id>.timeoutSeconds` dla wolnych lokalnych lub zdalnych serwerów
modeli przed zwiększeniem `agents.defaults.timeoutSeconds`. Limit czasu dostawcy
dotyczy tylko żądań HTTP modelu, w tym połączenia, nagłówków, streamingu treści
i całkowitego przerwania chronionego pobierania.

<Note>
Dla niestandardowych dostawców zgodnych z OpenAI utrwalenie niesekretnego lokalnego znacznika, takiego jak `apiKey: "ollama-local"`, jest akceptowane, gdy `baseUrl` rozwiązuje się do loopback, prywatnego LAN, `.local` albo samej nazwy hosta. OpenClaw traktuje go jako prawidłowe lokalne poświadczenie zamiast zgłaszać brak klucza. Użyj rzeczywistej wartości dla każdego dostawcy, który akceptuje publiczną nazwę hosta.
</Note>

Uwaga dotycząca zachowania lokalnych/proxyowanych backendów `/v1`:

- OpenClaw traktuje je jako trasy w stylu proxy zgodne z OpenAI, nie jako natywne
  punkty końcowe OpenAI
- natywne kształtowanie żądań wyłącznie dla OpenAI nie ma tutaj zastosowania: brak
  `service_tier`, brak `store` Responses, brak kształtowania ładunku zgodności rozumowania OpenAI
  i brak wskazówek pamięci podręcznej promptów
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane do tych niestandardowych URL-i proxy

Uwagi zgodności dla bardziej rygorystycznych backendów zgodnych z OpenAI:

- Niektóre serwery akceptują w Chat Completions tylko tekstowe `messages[].content`, a nie
  uporządkowane tablice części treści. Ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true` dla
  takich punktów końcowych.
- Niektóre modele lokalne emitują samodzielne nawiasowane żądania narzędzi jako tekst, takie jak
  `[tool_name]`, po którym następuje JSON i `[END_TOOL_REQUEST]`. OpenClaw promuje
  je do rzeczywistych wywołań narzędzi tylko wtedy, gdy nazwa dokładnie pasuje do zarejestrowanego
  narzędzia dla danej tury; w przeciwnym razie blok jest traktowany jako nieobsługiwany tekst i jest
  ukrywany przed odpowiedziami widocznymi dla użytkownika.
- Jeśli model emituje JSON, XML albo tekst w stylu ReAct, który wygląda jak wywołanie narzędzia,
  ale dostawca nie wyemitował uporządkowanego wywołania, OpenClaw pozostawia go jako
  tekst i zapisuje ostrzeżenie z ID uruchomienia, dostawcą/modelem, wykrytym wzorcem oraz
  nazwą narzędzia, gdy jest dostępna. Traktuj to jako niezgodność wywołań narzędzi
  dostawcy/modelu, a nie ukończone uruchomienie narzędzia.
- Jeśli narzędzia pojawiają się jako tekst asystenta zamiast się uruchamiać, na przykład surowy JSON,
  XML, składnia ReAct lub pusta tablica `tool_calls` w odpowiedzi dostawcy,
  najpierw zweryfikuj, że serwer używa szablonu/parsera czatu zdolnego do wywołań narzędzi. Dla
  backendów Chat Completions zgodnych z OpenAI, których parser działa tylko wtedy, gdy użycie narzędzi
  jest wymuszone, ustaw nadpisanie żądania per model zamiast polegać na parsowaniu tekstu:

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
  Zastąp `local/my-local-model` dokładnym odwołaniem dostawca/model pokazanym przez
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Jeśli niestandardowy model zgodny z OpenAI akceptuje wysiłki rozumowania OpenAI wykraczające poza
  wbudowany profil, zadeklaruj je w bloku zgodności modelu. Dodanie tutaj `"xhigh"`
  sprawia, że `/think xhigh`, selektory sesji, walidacja Gateway i walidacja `llm-task`
  udostępniają ten poziom dla skonfigurowanego odwołania dostawca/model:

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

## Mniejsze lub bardziej rygorystyczne backendy

Jeśli model ładuje się poprawnie, ale pełne tury agenta zachowują się nieprawidłowo, pracuj od góry do dołu — najpierw potwierdź transport, potem zawęź powierzchnię.

1. **Potwierdź, że sam model lokalny odpowiada.** Bez narzędzi, bez kontekstu agenta:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Potwierdź routing Gateway.** Wysyła tylko podany prompt — pomija transkrypcję, bootstrap AGENTS, składanie context-engine, narzędzia i dołączone serwery MCP, ale nadal sprawdza routing Gateway, uwierzytelnianie i wybór dostawcy:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Wypróbuj tryb odchudzony.** Jeśli oba testy przechodzą, ale rzeczywiste tury agenta kończą się niepoprawnie sformatowanymi wywołaniami narzędzi lub zbyt dużymi promptami, włącz `agents.defaults.experimental.localModelLean: true`. Usuwa trzy najcięższe domyślne narzędzia (`browser`, `cron`, `message`), więc kształt promptu jest mniejszy i mniej kruchy. Zobacz [Funkcje eksperymentalne → Tryb odchudzonego modelu lokalnego](/pl/concepts/experimental-features#local-model-lean-mode), aby poznać pełne wyjaśnienie, kiedy go używać i jak potwierdzić, że jest włączony.

4. **W ostateczności całkowicie wyłącz narzędzia.** Jeśli tryb odchudzony nie wystarcza, ustaw `models.providers.<provider>.models[].compat.supportsTools: false` dla tego wpisu modelu. Agent będzie wtedy działać bez wywołań narzędzi na tym modelu.

5. **Poza tym wąskim gardłem jest upstream.** Jeśli backend nadal zawodzi tylko przy większych uruchomieniach OpenClaw po trybie odchudzonym i `supportsTools: false`, pozostały problem zwykle leży po stronie modelu upstream lub pojemności serwera — okna kontekstu, pamięci GPU, usuwania kv-cache albo błędu backendu. Na tym etapie nie jest to warstwa transportowa OpenClaw.

## Rozwiązywanie problemów

- Gateway może dotrzeć do proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio jest wyładowany? Załaduj ponownie; zimny start to częsta przyczyna „zawieszania”.
- Serwer lokalny zgłasza `terminated`, `ECONNRESET` albo zamyka strumień w środku tury?
  OpenClaw zapisuje niskokardynalne `model.call.error.failureKind` oraz migawkę
  RSS/sterty procesu OpenClaw w diagnostyce. Przy presji pamięci LM Studio/Ollama
  dopasuj ten znacznik czasu do dziennika serwera albo dziennika awarii macOS /
  dziennika jetsam, aby potwierdzić, czy serwer modelu został zabity.
- OpenClaw wyprowadza progi preflight okna kontekstu z wykrytego okna modelu albo z nieograniczonego okna modelu, gdy `agents.defaults.contextTokens` obniża efektywne okno. Ostrzega poniżej 20% z dolną granicą **8k**. Twarde blokady używają progu 10% z dolną granicą **4k**, ograniczonego do efektywnego okna kontekstu, aby zawyżone metadane modelu nie mogły odrzucić poprawnego limitu użytkownika. Jeśli trafisz na ten preflight, zwiększ limit kontekstu serwera/modelu albo wybierz większy model.
- Błędy kontekstu? Obniż `contextWindow` albo zwiększ limit serwera.
- Serwer zgodny z OpenAI zwraca `messages[].content ... expected a string`?
  Dodaj `compat.requiresStringContent: true` w tym wpisie modelu.
- Bezpośrednie małe wywołania `/v1/chat/completions` działają, ale `openclaw infer model run --local`
  zawodzi na Gemma albo innym modelu lokalnym? Najpierw sprawdź URL dostawcy, odwołanie do modelu, znacznik uwierzytelniania
  i dzienniki serwera; lokalne `model run` nie zawiera narzędzi agenta.
  Jeśli lokalne `model run` działa, ale większe tury agenta zawodzą, zmniejsz powierzchnię
  narzędzi agenta przez `localModelLean` albo `compat.supportsTools: false`.
- Wywołania narzędzi pojawiają się jako surowy tekst JSON/XML/ReAct albo dostawca zwraca
  pustą tablicę `tool_calls`? Nie dodawaj proxy, które ślepo konwertuje tekst asystenta
  na wykonanie narzędzi. Najpierw napraw szablon/parser czatu serwera. Jeśli
  model działa tylko przy wymuszonym użyciu narzędzi, dodaj powyższe nadpisanie
  per model `params.extra_body.tool_choice: "required"` i używaj tego wpisu modelu
  tylko w sesjach, w których wywołanie narzędzia jest oczekiwane w każdej turze.
- Bezpieczeństwo: modele lokalne pomijają filtry po stronie dostawcy; utrzymuj agentów w wąskim zakresie i włącz Compaction, aby ograniczyć promień rażenia prompt injection.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
