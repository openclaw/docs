---
read_when:
    - Chcesz obniżyć koszty tokenów promptu dzięki zachowaniu pamięci podręcznej
    - Potrzebna jest pamięć podręczna działająca osobno dla każdego agenta w konfiguracjach wieloagentowych
    - Dostrajanie mechanizmów Heartbeat i czyszczenia na podstawie czasu TTL pamięci podręcznej odbywa się łącznie
summary: Opcje buforowania promptów, kolejność scalania, zachowanie dostawcy i wzorce dostrajania
title: Buforowanie promptów
x-i18n:
    generated_at: "2026-07-16T19:06:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

Buforowanie promptów umożliwia dostawcy modelu ponowne wykorzystanie niezmienionego prefiksu promptu (instrukcji systemowych/deweloperskich, definicji narzędzi i innego stabilnego kontekstu) w kolejnych turach zamiast przetwarzania go ponownie przy każdym żądaniu. Zmniejsza to koszt tokenów i opóźnienia w długotrwałych sesjach z powtarzającym się kontekstem.

OpenClaw normalizuje dane o użyciu dostawcy do `cacheRead` i `cacheWrite` wszędzie tam, gdzie nadrzędny interfejs API udostępnia te liczniki. Podsumowania użycia (`/status` i podobne) korzystają z ostatniego wpisu o użyciu w transkrypcji, gdy bieżąca migawka sesji nie zawiera liczników pamięci podręcznej; niezerowa wartość bieżąca zawsze ma pierwszeństwo przed wartością zastępczą.

Materiały dotyczące dostawców:

- [Buforowanie promptów Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Buforowanie promptów OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Główne ustawienia

### `cacheRetention`

Wartości: `"none" | "short" | "long"`. Można skonfigurować jako globalną wartość domyślną, dla poszczególnych modeli i dla poszczególnych agentów.
`"standard"` nie jest aliasem; użyj `"short"`, aby zastosować domyślne okno pamięci podręcznej dostawcy. Nieprawidłowe wartości są ignorowane z ostrzeżeniem.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # zastępuje globalną wartość domyślną dla tego modelu
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # zastępuje obie wartości domyślne dla tego agenta
```

Kolejność scalania (późniejsza wartość ma pierwszeństwo):

1. `agents.defaults.params` - globalna wartość domyślna dla wszystkich modeli
2. `agents.defaults.models["provider/model"].params` - nadpisanie dla poszczególnego modelu
3. `agents.list[].params` - nadpisanie dla poszczególnego agenta, dopasowywane według identyfikatora agenta

Źródło: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Usuwa stary kontekst wyników narzędzi po upływie okna TTL pamięci podręcznej, aby żądanie wysłane po okresie bezczynności nie powodowało ponownego buforowania nadmiernie obszernej historii.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Zobacz [Przycinanie sesji](/pl/concepts/session-pruning), aby poznać pełny sposób działania.

### Utrzymywanie aktywności przez Heartbeat

Heartbeat może utrzymywać aktywność okien pamięci podręcznej i ograniczać wielokrotne zapisy do pamięci podręcznej po okresach bezczynności. Można go skonfigurować globalnie (`agents.defaults.heartbeat`) lub dla poszczególnych agentów (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Zachowanie dostawcy

### Anthropic (bezpośrednie API i Vertex AI)

- `cacheRetention` jest obsługiwane dla dostawców `anthropic` i `anthropic-vertex`, a także dla modeli Claude w `amazon-bedrock` i niestandardowych punktów końcowych zgodnych z `anthropic-messages`, gdy `cacheRetention` jest ustawione jawnie.
- Gdy ta wartość nie jest ustawiona, OpenClaw inicjalizuje `cacheRetention: "short"` dla bezpośredniego Anthropic (wyłącznie dostawcy `anthropic` i `anthropic-vertex`; inne ścieżki z rodziny Anthropic wymagają jawnej wartości).
- Natywne odpowiedzi Anthropic Messages udostępniają `cache_read_input_tokens` i `cache_creation_input_tokens`, mapowane odpowiednio na `cacheRead` i `cacheWrite`.
- `cacheRetention: "short"` odpowiada domyślnej efemerycznej pamięci podręcznej o czasie przechowywania wynoszącym 5 minut. `cacheRetention: "long"` żąda czasu TTL wynoszącego 1 godzinę (`cache_control: { type: "ephemeral", ttl: "1h" }`), gdy jest ustawione jawnie. Niejawne lub sterowane zmienną środowiskową długie przechowywanie (`OPENCLAW_CACHE_RETENTION=long` bez jawnego ustawienia `cacheRetention`) przechodzi na 1-godzinny TTL tylko na hostach `api.anthropic.com` lub Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); inne hosty zachowują 5-minutową pamięć podręczną.

Źródło: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (bezpośrednie API)

- Buforowanie promptów odbywa się automatycznie w obsługiwanych najnowszych modelach; OpenClaw nie wstawia znaczników pamięci podręcznej na poziomie bloków.
- OpenClaw wysyła `prompt_cache_key`, aby zachować stabilne kierowanie do pamięci podręcznej między turami. Bezpośrednie hosty `api.openai.com` otrzymują to automatycznie. Serwery proxy zgodne z OpenAI (oMLX, llama.cpp, niestandardowe punkty końcowe) muszą mieć ustawione `compat.supportsPromptCacheKey: true` w konfiguracji modelu, aby włączyć tę funkcję — nigdy nie jest ona automatycznie wykrywana dla serwera proxy.
- `prompt_cache_retention: "24h"` jest dodawane tylko wtedy, gdy wybrano `cacheRetention: "long"`, a rozpoznany punkt końcowy obsługuje zarówno klucz pamięci podręcznej, jak i długie przechowywanie (`compat.supportsLongCacheRetention`, domyślnie true; profile zgodności Together AI i Cloudflare wyłączają tę funkcję). `cacheRetention: "none"` pomija oba pola.
- Trafienia w pamięci podręcznej są udostępniane przez `usage.prompt_tokens_details.cached_tokens` (Chat Completions) lub `input_tokens_details.cached_tokens` (Responses API) i mapowane na `cacheRead`.
- Ładunki Responses API mogą również udostępniać `input_tokens_details.cache_write_tokens`, mapowane na `cacheWrite` i rozliczane według stawki modelu za zapis do pamięci podręcznej; w przypadku ładunków Responses, które pomijają to pole, `cacheWrite` zachowuje wartość `0`. API Chat Completions firmy OpenAI nie dokumentuje ani nie emituje licznika `cache_write_tokens`, ale OpenClaw nadal odczytuje tam `prompt_tokens_details.cache_write_tokens` na potrzeby serwerów proxy zgodnych z OpenRouter i serwerów proxy w stylu DeepSeek, które raportują oddzielną liczbę zapisów.
- W praktyce OpenAI działa bardziej jak pamięć podręczna początkowego prefiksu niż mechanizm ponownego wykorzystania przesuwającej się pełnej historii firmy Anthropic — zobacz poniżej [oczekiwania dotyczące działania OpenAI na żywo](#openai-live-expectations).

### Amazon Bedrock

- Odwołania do modeli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, a także prefiksy systemowych profili wnioskowania AWS `us.`/`eu.`/`global.anthropic.claude*`) obsługują jawne przekazywanie `cacheRetention`.
- Modele Bedrock inne niż Anthropic (na przykład `amazon.nova-*`) w czasie wykonywania nie stosują przechowywania w pamięci podręcznej, niezależnie od skonfigurowanej wartości `cacheRetention`.
- Niejawne ARN-y profili wnioskowania aplikacji Bedrock (identyfikatory profili, które nie zawierają `claude`) również nie stosują przechowywania w pamięci podręcznej, chyba że jawnie ustawiono `cacheRetention`, ponieważ rodziny modelu nie można wywnioskować wyłącznie z ARN-u.

### OpenRouter

W przypadku odwołań do modeli `openrouter/anthropic/*` OpenClaw wstawia znaczniki Anthropic `cache_control` w blokach promptów systemowych/deweloperskich, ale tylko wtedy, gdy żądanie nadal jest kierowane do zweryfikowanej trasy OpenRouter (`openrouter` w jej domyślnym punkcie końcowym lub dowolnego dostawcy/bazowego adresu URL, który jest rozpoznawany jako `openrouter.ai`). Przekierowanie modelu na dowolny adres URL serwera proxy zgodnego z OpenAI zatrzymuje wstawianie tych znaczników.

`contextPruning.mode: "cache-ttl"` jest dozwolone dla odwołań do modeli `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` i `openrouter/zai/*`, ponieważ te trasy obsługują buforowanie promptów po stronie dostawcy bez potrzeby stosowania znaczników wstrzykiwanych przez OpenClaw.

Źródło: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Tworzenie pamięci podręcznej DeepSeek w OpenRouter odbywa się w miarę możliwości i może potrwać kilka sekund; bezpośrednio następujące żądanie może nadal wskazywać `cached_tokens: 0`. Należy zweryfikować działanie za pomocą ponownego żądania z tym samym prefiksem po krótkim opóźnieniu, używając `usage.prompt_tokens_details.cached_tokens` jako sygnału trafienia w pamięci podręcznej.

### Google Gemini (bezpośrednie API)

- Bezpośredni transport Gemini (`api: "google-generative-ai"`) zgłasza trafienia w pamięci podręcznej za pośrednictwem nadrzędnego pola `cachedContentTokenCount`, mapowanego na `cacheRead`.
- Obsługiwane rodziny modeli: `gemini-2.5*` i `gemini-3*` (z wyłączeniem wariantów Live/preview, które nie pasują do tego prefiksu, na przykład `gemini-live-2.5-flash-preview`).
- Gdy na obsługiwanym modelu ustawiono `cacheRetention`, OpenClaw automatycznie tworzy, ponownie wykorzystuje i odświeża zasób `cachedContents` dla promptu systemowego — nie jest potrzebny ręczny uchwyt buforowanej zawartości. TTL wynosi `300s` dla `cacheRetention: "short"` i `3600s` dla `"long"`.
- Nadal można przekazać istniejący uchwyt buforowanej zawartości Gemini jako `params.cachedContent` (lub starsze `params.cached_content`); jawny uchwyt całkowicie pomija automatyczną ścieżkę zarządzania pamięcią podręczną.
- Jest to niezależne od buforowania prefiksów promptów Anthropic/OpenAI: zamiast wstrzykiwać wbudowane znaczniki pamięci podręcznej, OpenClaw zarządza natywnym dla dostawcy zasobem `cachedContents` dla Gemini.

Źródło: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Dostawcy oparci na środowisku CLI (Claude Code, Gemini CLI)

Backendy CLI, które emitują zdarzenia użycia JSONL (`jsonlDialect: "claude-stream-json"` lub `"gemini-stream-json"`), korzystają ze wspólnego parsera użycia, rozpoznającego kilka wariantów nazw pól, w tym zwykły licznik `cached` mapowany na `cacheRead`. Gdy ładunek JSON interfejsu CLI nie zawiera bezpośredniego pola liczby tokenów wejściowych, OpenClaw wyznacza je jako `input_tokens - cached`. Jest to wyłącznie normalizacja użycia — nie tworzy znaczników pamięci podręcznej promptów w stylu Anthropic/OpenAI dla modeli obsługiwanych przez CLI.

Źródło: `src/agents/cli-output.ts` (`toCliUsage`).

### Inni dostawcy

Jeśli dostawca nie obsługuje żadnego z powyższych trybów pamięci podręcznej, `cacheRetention` nie ma żadnego efektu.

## Granica pamięci podręcznej promptu systemowego

OpenClaw dzieli prompt systemowy na **stabilny prefiks** i **zmienny sufiks** na wewnętrznej granicy prefiksu pamięci podręcznej. Zawartość powyżej granicy (definicje narzędzi, metadane umiejętności, pliki obszaru roboczego) jest uporządkowana tak, aby pozostawała identyczna bajt po bajcie między turami. Zawartość poniżej granicy (na przykład `HEARTBEAT.md`, znaczniki czasu środowiska uruchomieniowego i inne metadane poszczególnych tur) może się zmieniać bez unieważniania buforowanego prefiksu.

Najważniejsze decyzje projektowe:

- Stabilne pliki kontekstu projektu z obszaru roboczego są umieszczane przed `HEARTBEAT.md`, aby zmienność mechanizmu Heartbeat nie unieważniała stabilnego prefiksu.
- Granica obowiązuje w kształtowaniu transportu dla rodzin Anthropic i OpenAI, Google oraz CLI, dzięki czemu wszyscy obsługiwani dostawcy korzystają z tej samej stabilności prefiksu.
- Żądania Codex Responses i Anthropic Vertex są kierowane przez mechanizm kształtowania pamięci podręcznej uwzględniający granicę, dzięki czemu ponowne użycie pamięci podręcznej pozostaje zgodne z danymi faktycznie otrzymywanymi przez dostawców.
- Odciski promptów systemowych są normalizowane (białe znaki, zakończenia wierszy, kontekst dodawany przez hooki, kolejność możliwości środowiska uruchomieniowego), dzięki czemu prompty niezmienione semantycznie współdzielą pamięć podręczną między turami.

W przypadku nieoczekiwanych skoków `cacheWrite` po zmianie konfiguracji lub obszaru roboczego należy sprawdzić, czy zmiana znajduje się powyżej, czy poniżej granicy pamięci podręcznej. Przeniesienie zmiennej zawartości poniżej granicy (lub jej ustabilizowanie) zazwyczaj rozwiązuje problem.

## Zabezpieczenia stabilności pamięci podręcznej OpenClaw

- Dołączone katalogi narzędzi MCP są sortowane deterministycznie (najpierw według nazwy serwera, a następnie nazwy narzędzia) przed rejestracją narzędzi, dzięki czemu zmiany kolejności `listTools()` nie powodują zmian w bloku narzędzi ani unieważniania prefiksów pamięci podręcznej promptów.
- Starsze sesje z utrwalonymi blokami obrazów zachowują bez zmian **3 ostatnie ukończone tury** (z uwzględnieniem wszystkich ukończonych tur, a nie tylko tych zawierających obrazy). Starsze, już przetworzone bloki obrazów są zastępowane znacznikiem tekstowym, aby kolejne żądania związane z obrazami nie wysyłały ponownie dużych, nieaktualnych ładunków.

## Wzorce dostrajania

### Ruch mieszany (zalecane ustawienie domyślne)

Należy zachować długotrwałą konfigurację bazową dla głównego agenta i wyłączyć buforowanie dla agentów powiadamiających, którzy działają w krótkich seriach:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Konfiguracja bazowa ukierunkowana na koszty

- Należy ustawić bazowe `cacheRetention: "short"`.
- Należy włączyć `contextPruning.mode: "cache-ttl"`.
- Interwał Heartbeat powinien być krótszy niż TTL tylko w przypadku agentów, które korzystają z rozgrzanej pamięci podręcznej.

## Testy regresji na żywo

OpenClaw uruchamia jedną połączoną bramkę testów regresji pamięci podręcznej na żywo, obejmującą powtarzające się prefiksy, tury narzędzi, tury obrazów, transkrypcje narzędzi w stylu MCP oraz próbę kontrolną Anthropic bez pamięci podręcznej.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Uruchomienie:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Plik bazowy przechowuje ostatnio zaobserwowane wartości z działania na żywo oraz specyficzne dla dostawców dolne progi regresji, względem których wykonywany jest test. Każde uruchomienie używa nowych identyfikatorów sesji i przestrzeni nazw promptów, dzięki czemu wcześniejszy stan pamięci podręcznej nie zanieczyszcza bieżącej próbki. Anthropic i OpenAI stosują różne mechanizmy egzekwowania: niespełnienie progu Anthropic jest twardą regresją (test kończy się niepowodzeniem), natomiast niespełnienie progu OpenAI służy tylko do monitorowania (jest rejestrowane jako ostrzeżenie i nie powoduje niepowodzenia uruchomienia). Nie korzystają ze wspólnego progu między dostawcami.

### Oczekiwania dotyczące działania Anthropic na żywo

- Oczekiwane są jawne zapisy rozgrzewające za pośrednictwem `cacheWrite`.
- Oczekiwane jest ponowne użycie niemal całej historii w kolejnych turach, ponieważ sterowanie pamięcią podręczną Anthropic przesuwa punkt graniczny pamięci podręcznej wraz z postępem konwersacji.
- Bazowe dolne progi dla stabilnych ścieżek oraz ścieżek narzędziowych, obrazowych i w stylu MCP są twardymi bramkami regresji.

### Oczekiwania dotyczące działania OpenAI na żywo

- Oczekiwane jest tylko `cacheRead`; `cacheWrite` pozostaje `0` w Chat Completions.
- Ponowne użycie pamięci podręcznej w kolejnych turach należy traktować jako specyficzne dla dostawcy wypłaszczenie, a nie charakterystyczne dla Anthropic przesuwające się ponowne użycie całej historii.
- Dolne progi służą tylko do monitorowania (ich niespełnienie jest rejestrowane jako ostrzeżenie, a nie niepowodzenie testu) i wynikają z zachowania zaobserwowanego podczas działania na żywo w `gpt-5.4-mini`:

| Scenariusz           | Dolny próg `cacheRead` | Dolny próg współczynnika trafień |
| -------------------- | ----------------: | -------------: |
| Stabilny prefiks     |             4,608 |           0.90 |
| Transkrypcja narzędziowa |             4,096 |           0.85 |
| Transkrypcja obrazowa |             3,840 |           0.82 |
| Transkrypcja w stylu MCP |             4,096 |           0.85 |

Ostatnio zaobserwowane wartości bazowe (z `live-cache-regression-baseline.ts`) wyniosły: stabilny prefiks `cacheRead=4864`, współczynnik trafień `0.966`; transkrypcja narzędziowa `cacheRead=4608`, współczynnik trafień `0.896`; transkrypcja obrazowa `cacheRead=4864`, współczynnik trafień `0.954`; transkrypcja w stylu MCP `cacheRead=4608`, współczynnik trafień `0.891`.

Dlaczego asercje się różnią: Anthropic udostępnia jawne punkty graniczne pamięci podręcznej i przesuwające się ponowne użycie historii konwersacji, natomiast efektywny prefiks wielokrotnego użytku OpenAI w ruchu na żywo może osiągnąć wypłaszczenie wcześniej niż cały prompt. Porównywanie obu dostawców przy użyciu jednego wspólnego progu procentowego powoduje fałszywe regresje.

## Konfiguracja `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opcjonalne
    includeMessages: false # domyślnie true
    includePrompt: false # domyślnie true
    includeSystem: false # domyślnie true
```

Wartości domyślne:

| Klucz             | Wartość domyślna                            |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Przełączniki zmiennych środowiskowych (jednorazowe debugowanie)

| Zmienna                              | Efekt                                |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | Włącza śledzenie pamięci podręcznej  |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Zastępuje ścieżkę wyjściową          |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Przełącza przechwytywanie pełnej treści wiadomości |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Przełącza przechwytywanie tekstu promptu |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Przełącza przechwytywanie promptu systemowego |

### Co sprawdzić

- Zdarzenia śledzenia pamięci podręcznej mają format JSONL i zawierają etapowe migawki, takie jak `session:loaded`, `prompt:before`, `stream:context` oraz `session:after`.
- Wpływ tokenów pamięci podręcznej w poszczególnych turach jest widoczny w standardowych powierzchniach użycia: `cacheRead` i `cacheWrite` pojawiają się w `/usage tokens`, `/status`, podsumowaniach użycia sesji oraz niestandardowych układach `messages.usageTemplate`.
- W przypadku Anthropic, gdy pamięć podręczna jest aktywna, oczekiwane są zarówno `cacheRead`, jak i `cacheWrite`.
- W przypadku OpenAI przy trafieniach pamięci podręcznej oczekiwane jest `cacheRead`; `cacheWrite` jest uzupełniane tylko w ładunkach Responses API, które je zawierają (zobacz sekcję [OpenAI](#openai-direct-api) powyżej).
- OpenAI zwraca również nagłówki śledzenia i limitów szybkości, takie jak `x-request-id`, `openai-processing-ms` oraz `x-ratelimit-*`; należy używać ich do śledzenia żądań, ale rozliczanie trafień pamięci podręcznej powinno nadal opierać się na ładunku użycia, a nie na nagłówkach.

## Szybkie rozwiązywanie problemów

- **Wysokie `cacheWrite` w większości tur**: sprawdź zmienne dane wejściowe promptu systemowego; zweryfikuj, czy model lub dostawca obsługuje ustawienia pamięci podręcznej.
- **Wysokie `cacheWrite` w Anthropic**: często oznacza, że punkt graniczny pamięci podręcznej przypada na treść zmieniającą się przy każdym żądaniu.
- **Niskie `cacheRead` OpenAI**: zweryfikuj, czy stabilny prefiks znajduje się na początku, powtarzany prefiks ma co najmniej 1024 tokeny oraz czy ten sam `prompt_cache_key` jest ponownie używany w turach, które powinny współdzielić pamięć podręczną.
- **Brak efektu działania `cacheRetention`**: potwierdź, że klucz modelu odpowiada `agents.defaults.models["provider/model"]`.
- **Żądania Bedrock Nova z ustawieniami pamięci podręcznej**: oczekiwane — w czasie wykonywania są rozwiązywane bez zachowywania pamięci podręcznej.

Powiązana dokumentacja:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration-reference)

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
