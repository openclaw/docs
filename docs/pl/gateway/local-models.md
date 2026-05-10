---
read_when:
    - Chcesz udostępniać modele z własnej maszyny z GPU
    - Konfigurujesz LM Studio lub proxy zgodne z OpenAI
    - Potrzebujesz najbezpieczniejszych wskazówek dotyczących modelu lokalnego
summary: Uruchamiaj OpenClaw na lokalnych modelach LLM (LM Studio, vLLM, LiteLLM, niestandardowe punkty końcowe OpenAI)
title: Modele lokalne
x-i18n:
    generated_at: "2026-05-10T19:37:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

Modele lokalne są możliwe do uruchomienia. Podnoszą jednak wymagania dotyczące sprzętu, rozmiaru kontekstu i ochrony przed wstrzykiwaniem promptów — małe lub agresywnie kwantyzowane karty skracają kontekst i osłabiają bezpieczeństwo. Ta strona to opiniowany przewodnik po lokalnych stosach wyższej klasy i niestandardowych lokalnych serwerach zgodnych z OpenAI. Aby rozpocząć z najmniejszym tarciem, zacznij od [LM Studio](/pl/providers/lmstudio) lub [Ollama](/pl/providers/ollama) oraz `openclaw onboard`.

W przypadku lokalnych serwerów, które powinny uruchamiać się tylko wtedy, gdy wybrany model ich potrzebuje, zobacz
[Usługi modeli lokalnych](/pl/gateway/local-model-services).

## Minimalny sprzęt

Celuj wysoko: **≥2 maksymalnie skonfigurowane Mac Studio albo równoważny zestaw GPU (~30 tys. USD+)** dla komfortowej pętli agenta. Pojedyncze GPU **24 GB** sprawdza się tylko przy lżejszych promptach i większych opóźnieniach. Zawsze uruchamiaj **największy / pełnowymiarowy wariant, jaki możesz hostować**; małe lub mocno kwantyzowane checkpointy zwiększają ryzyko wstrzykiwania promptów (zobacz [Bezpieczeństwo](/pl/gateway/security)).

## Wybierz backend

| Backend                                              | Użyj, gdy                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/pl/providers/lmstudio)                     | Pierwsza lokalna konfiguracja, loader GUI, natywne Responses API                    |
| [Ollama](/pl/providers/ollama)                          | Przepływ pracy CLI, biblioteka modeli, bezobsługowa usługa systemd                      |
| MLX / vLLM / SGLang                                  | Wysokoprzepustowe samodzielne serwowanie z punktem końcowym HTTP zgodnym z OpenAI |
| LiteLLM / OAI-proxy / niestandardowy proxy zgodny z OpenAI | Wystawiasz inne API modelu i potrzebujesz, aby OpenClaw traktował je jak OpenAI         |

Używaj Responses API (`api: "openai-responses"`), gdy backend je obsługuje (LM Studio obsługuje). W przeciwnym razie trzymaj się Chat Completions (`api: "openai-completions"`).

<Warning>
**Użytkownicy WSL2 + Ollama + NVIDIA/CUDA:** Oficjalny instalator Ollama dla Linuksa włącza usługę systemd z `Restart=always`. W konfiguracjach GPU na WSL2 autostart może podczas rozruchu ponownie załadować ostatni model i zająć pamięć hosta. Jeśli twoja maszyna wirtualna WSL2 wielokrotnie restartuje się po włączeniu Ollama, zobacz [pętla awarii WSL2](/pl/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Zalecane: LM Studio + duży model lokalny (Responses API)

Najlepszy obecnie stos lokalny. Załaduj duży model w LM Studio (na przykład pełnowymiarową kompilację Qwen, DeepSeek lub Llama), włącz serwer lokalny (domyślnie `http://127.0.0.1:1234`) i użyj Responses API, aby oddzielić rozumowanie od tekstu końcowego.

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
- W LM Studio pobierz **największą dostępną kompilację modelu** (unikaj wariantów „small”/mocno kwantyzowanych), uruchom serwer, potwierdź, że `http://127.0.0.1:1234/v1/models` ją wyświetla.
- Zastąp `my-local-model` rzeczywistym identyfikatorem modelu pokazanym w LM Studio.
- Utrzymuj model załadowany; zimne ładowanie zwiększa opóźnienie startu.
- Dostosuj `contextWindow`/`maxTokens`, jeśli twoja kompilacja LM Studio się różni.
- W przypadku WhatsApp trzymaj się Responses API, aby wysyłany był tylko tekst końcowy.

Utrzymuj skonfigurowane modele hostowane nawet wtedy, gdy działasz lokalnie; użyj `models.mode: "merge"`, aby opcje awaryjne pozostały dostępne.

### Konfiguracja hybrydowa: hostowany podstawowy, lokalny awaryjny

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

Zamień kolejność modelu podstawowego i awaryjnego; zachowaj ten sam blok providers oraz `models.mode: "merge"`, aby móc przełączyć się awaryjnie na Sonnet lub Opus, gdy lokalny komputer nie działa.

### Hosting regionalny / routing danych

- Hostowane warianty MiniMax/Kimi/GLM istnieją także w OpenRouter z punktami końcowymi przypiętymi do regionu (np. hostowane w USA). Wybierz tam wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, nadal używając `models.mode: "merge"` dla opcji awaryjnych Anthropic/OpenAI.
- Wyłącznie lokalne działanie pozostaje najsilniejszą ścieżką prywatności; hostowany routing regionalny to rozwiązanie pośrednie, gdy potrzebujesz funkcji dostawcy, ale chcesz kontrolować przepływ danych.

## Inne lokalne proxy zgodne z OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy lub niestandardowe
Gateway działają, jeśli udostępniają punkt końcowy `/v1/chat/completions`
w stylu OpenAI. Użyj adaptera Chat Completions, chyba że backend jawnie
dokumentuje obsługę `/v1/responses`. Zastąp powyższy blok provider własnym
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

Jeśli `api` zostanie pominięte u niestandardowego providera z `baseUrl`, OpenClaw domyślnie używa
`openai-completions`. Punkty końcowe loopback, takie jak `127.0.0.1`, są zaufane
automatycznie; punkty końcowe LAN, tailnet i prywatnego DNS nadal wymagają
`request.allowPrivateNetwork: true`.

Wartość `models.providers.<id>.models[].id` jest lokalna dla providera. Nie
dodawaj tam prefiksu providera. Na przykład serwer MLX uruchomiony z
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` powinien używać tego
identyfikatora katalogowego i odwołania do modelu:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Ustaw `input: ["text", "image"]` w lokalnych lub proxowanych modelach wizyjnych, aby załączniki
obrazów były wstrzykiwane do tur agenta. Interaktywne wdrażanie niestandardowego providera
wnioskuje typowe identyfikatory modeli wizyjnych i pyta tylko o nieznane nazwy.
Nieinteraktywne wdrażanie używa tego samego wnioskowania; użyj `--custom-image-input`
dla nieznanych identyfikatorów wizyjnych albo `--custom-text-input`, gdy model wyglądający na znany
jest tekstowy za twoim punktem końcowym.

Zachowaj `models.mode: "merge"`, aby modele hostowane pozostały dostępne jako opcje awaryjne.
Używaj `models.providers.<id>.timeoutSeconds` dla wolnych lokalnych lub zdalnych serwerów
modeli, zanim zwiększysz `agents.defaults.timeoutSeconds`. Limit czasu providera
dotyczy wyłącznie żądań HTTP modelu, w tym połączenia, nagłówków, strumieniowania treści
oraz całkowitego przerwania chronionego pobierania.

<Note>
W przypadku niestandardowych providerów zgodnych z OpenAI zapis niesekretnego lokalnego znacznika, takiego jak `apiKey: "ollama-local"`, jest akceptowany, gdy `baseUrl` rozwiązuje się do loopback, prywatnej sieci LAN, `.local` lub samej nazwy hosta. OpenClaw traktuje go jako prawidłowe lokalne poświadczenie zamiast zgłaszać brak klucza. Użyj rzeczywistej wartości dla każdego providera akceptującego publiczną nazwę hosta.
</Note>

Uwaga dotycząca zachowania lokalnych/proxowanych backendów `/v1`:

- OpenClaw traktuje je jako trasy zgodne z OpenAI w stylu proxy, a nie natywne
  punkty końcowe OpenAI
- nie stosuje się tu kształtowanie żądań wyłącznie dla natywnego OpenAI: brak
  `service_tier`, brak Responses `store`, brak kształtowania payloadu zgodnego z rozumowaniem OpenAI
  i brak podpowiedzi pamięci podręcznej promptów
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane pod tymi niestandardowymi URL-ami proxy

Uwagi dotyczące kompatybilności ze ściślejszymi backendami zgodnymi z OpenAI:

- Niektóre serwery akceptują w Chat Completions tylko tekstowe `messages[].content`, a nie
  ustrukturyzowane tablice części treści. Ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true` dla
  tych punktów końcowych.
- Niektóre modele lokalne emitują samodzielne narzędziowe żądania w nawiasach jako tekst, takie jak
  `[tool_name]`, po którym następuje JSON i `[END_TOOL_REQUEST]`. OpenClaw promuje
  je do prawdziwych wywołań narzędzi tylko wtedy, gdy nazwa dokładnie pasuje do zarejestrowanego
  narzędzia dla danej tury; w przeciwnym razie blok jest traktowany jako nieobsługiwany tekst i
  ukrywany przed odpowiedziami widocznymi dla użytkownika.
- Jeśli model emituje JSON, XML lub tekst w stylu ReAct, który wygląda jak wywołanie narzędzia,
  ale provider nie wyemitował ustrukturyzowanego wywołania, OpenClaw pozostawia go jako
  tekst i rejestruje ostrzeżenie z identyfikatorem uruchomienia, providerem/modelem, wykrytym wzorcem oraz
  nazwą narzędzia, gdy jest dostępna. Traktuj to jako niekompatybilność wywołań narzędzi
  providera/modelu, a nie ukończone uruchomienie narzędzia.
- Jeśli narzędzia pojawiają się jako tekst asystenta zamiast się uruchamiać, na przykład surowy JSON,
  XML, składnia ReAct lub pusta tablica `tool_calls` w odpowiedzi providera,
  najpierw sprawdź, czy serwer używa szablonu/parsera czatu obsługującego wywołania narzędzi. W przypadku
  backendów Chat Completions zgodnych z OpenAI, których parser działa tylko wtedy, gdy użycie narzędzi
  jest wymuszone, ustaw nadpisanie żądania dla konkretnego modelu zamiast polegać na parsowaniu
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
  wbudowany profil, zadeklaruj je w bloku kompatybilności modelu. Dodanie tutaj `"xhigh"`
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

## Mniejsze lub ściślejsze backendy

Jeśli model ładuje się poprawnie, ale pełne tury agenta działają nieprawidłowo, pracuj od góry do dołu — najpierw potwierdź transport, potem zawęź powierzchnię.

1. **Potwierdź, że sam model lokalny odpowiada.** Bez narzędzi, bez kontekstu agenta:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Potwierdź trasowanie Gateway.** Wysyła tylko podany prompt — pomija transkrypcję, bootstrap AGENTS, składanie przez silnik kontekstu, narzędzia i dołączone serwery MCP, ale nadal sprawdza trasowanie Gateway, uwierzytelnianie i wybór providera:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Wypróbuj tryb odchudzony.** Jeśli oba sprawdzenia przechodzą, ale rzeczywiste tury agenta kończą się niepoprawnie sformatowanymi wywołaniami narzędzi lub zbyt dużymi promptami, włącz `agents.defaults.experimental.localModelLean: true`. Usuwa to trzy najcięższe domyślne narzędzia (`browser`, `cron`, `message`), dzięki czemu kształt promptu jest mniejszy i mniej kruchy. Zobacz [Funkcje eksperymentalne → tryb odchudzonego modelu lokalnego](/pl/concepts/experimental-features#local-model-lean-mode), aby poznać pełne wyjaśnienie, kiedy go używać i jak potwierdzić, że jest włączony.

4. **Całkowicie wyłącz narzędzia w ostateczności.** Jeśli tryb odchudzony nie wystarczy, ustaw `models.providers.<provider>.models[].compat.supportsTools: false` dla tego wpisu modelu. Agent będzie wtedy działać na tym modelu bez wywołań narzędzi.

5. **Poza tym wąskie gardło jest upstream.** Jeśli backend nadal zawodzi tylko przy większych uruchomieniach OpenClaw po włączeniu trybu odchudzonego i `supportsTools: false`, pozostały problem zwykle dotyczy upstreamowego modelu lub pojemności serwera — okna kontekstu, pamięci GPU, eksmisji kv-cache albo błędu backendu. Na tym etapie nie jest to warstwa transportu OpenClaw.

## Rozwiązywanie problemów

- Gateway może dosięgnąć proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio jest rozładowany? Załaduj go ponownie; zimny start to częsta przyczyna „zawieszania się”.
- Serwer lokalny zgłasza `terminated`, `ECONNRESET` albo zamyka strumień w połowie tury?
  OpenClaw zapisuje niskokardynalny `model.call.error.failureKind` oraz migawkę RSS/sterty procesu
  OpenClaw w diagnostyce. Przy presji pamięciowej LM Studio/Ollama dopasuj ten znacznik czasu do logu serwera albo logu awarii macOS /
  jetsam, aby potwierdzić, czy serwer modelu został zabity.
- OpenClaw wyprowadza progi kontroli wstępnej okna kontekstu z wykrytego okna modelu albo z nieograniczonego okna modelu, gdy `agents.defaults.contextTokens` obniża efektywne okno. Ostrzega poniżej 20% z dolnym limitem **8k**. Twarde blokady używają progu 10% z dolnym limitem **4k**, ograniczonego do efektywnego okna kontekstu, aby zawyżone metadane modelu nie mogły odrzucić skądinąd poprawnego limitu użytkownika. Jeśli trafisz na tę kontrolę wstępną, zwiększ limit kontekstu serwera/modelu albo wybierz większy model.
- Błędy kontekstu? Obniż `contextWindow` albo zwiększ limit serwera.
- Serwer zgodny z OpenAI zwraca `messages[].content ... expected a string`?
  Dodaj `compat.requiresStringContent: true` do tego wpisu modelu.
- Serwer zgodny z OpenAI zwraca `validation.keys` albo mówi, że wpisy wiadomości dopuszczają tylko `role` i `content`?
  Dodaj `compat.strictMessageKeys: true` do tego wpisu modelu.
- Bezpośrednie małe wywołania `/v1/chat/completions` działają, ale `openclaw infer model run --local`
  zawodzi na Gemmie albo innym modelu lokalnym? Najpierw sprawdź URL providera, referencję modelu, marker uwierzytelniania
  i logi serwera; lokalne `model run` nie zawiera narzędzi agenta.
  Jeśli lokalne `model run` działa, ale większe tury agenta zawodzą, ogranicz powierzchnię narzędzi agenta przez `localModelLean` albo `compat.supportsTools: false`.
- Wywołania narzędzi pojawiają się jako surowy tekst JSON/XML/ReAct albo provider zwraca
  pustą tablicę `tool_calls`? Nie dodawaj proxy, które ślepo konwertuje tekst asystenta
  na wykonanie narzędzia. Najpierw napraw szablon/parser czatu serwera. Jeśli
  model działa tylko wtedy, gdy użycie narzędzi jest wymuszone, dodaj powyższe nadpisanie
  `params.extra_body.tool_choice: "required"` dla danego modelu i używaj tego wpisu modelu
  tylko w sesjach, w których wywołanie narzędzia jest oczekiwane w każdej turze.
- Bezpieczeństwo: modele lokalne pomijają filtry po stronie providera; utrzymuj agentów wąsko ukierunkowanych i włącz Compaction, aby ograniczyć zasięg prompt injection.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
