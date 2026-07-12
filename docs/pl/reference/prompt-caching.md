---
read_when:
    - Chcesz obniżyć koszt tokenów promptu dzięki zachowaniu pamięci podręcznej
    - Potrzebujesz pamięci podręcznej osobnej dla każdego agenta w konfiguracjach wieloagentowych
    - Dostrajasz jednocześnie Heartbeat i czyszczenie pamięci podręcznej na podstawie czasu TTL
summary: Parametry buforowania promptów, kolejność scalania, zachowanie dostawcy i wzorce dostrajania
title: Buforowanie promptów
x-i18n:
    generated_at: "2026-07-12T15:33:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

Buforowanie promptów umożliwia dostawcy modelu ponowne wykorzystanie niezmienionego prefiksu promptu (instrukcji systemowych/deweloperskich, definicji narzędzi i innego stabilnego kontekstu) w kolejnych turach zamiast przetwarzania go od nowa przy każdym żądaniu. Zmniejsza to koszt tokenów i opóźnienia w długotrwałych sesjach z powtarzającym się kontekstem.

OpenClaw normalizuje dane o użyciu dostawcy do `cacheRead` i `cacheWrite` wszędzie tam, gdzie nadrzędne API udostępnia te liczniki. Podsumowania użycia (`/status` i podobne) korzystają awaryjnie z ostatniego wpisu użycia w transkrypcji, gdy bieżąca migawka sesji nie zawiera liczników pamięci podręcznej; niezerowa wartość bieżąca zawsze ma pierwszeństwo przed wartością awaryjną.

Materiały referencyjne dostawców:

- [Buforowanie promptów Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Buforowanie promptów OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Główne ustawienia

### `cacheRetention`

Wartości: `"none" | "short" | "long"`. Można skonfigurować jako globalną wartość domyślną, osobno dla każdego modelu i osobno dla każdego agenta.

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

1. `agents.defaults.params` — globalna wartość domyślna dla wszystkich modeli
2. `agents.defaults.models["provider/model"].params` — nadpisanie dla modelu
3. `agents.list[].params` — nadpisanie dla agenta, dopasowywane według identyfikatora agenta

Źródło: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Usuwa stary kontekst wyników narzędzi po upływie okresu TTL pamięci podręcznej, aby żądanie wysłane po okresie bezczynności nie buforowało ponownie nadmiernie rozbudowanej historii.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Pełny opis działania zawiera sekcja [Przycinanie sesji](/pl/concepts/session-pruning).

### Utrzymywanie ciepłej pamięci podręcznej przez Heartbeat

Heartbeat może utrzymywać aktywność okien pamięci podręcznej i ograniczać ponowne zapisy po okresach bezczynności. Można go skonfigurować globalnie (`agents.defaults.heartbeat`) lub osobno dla agenta (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Zachowanie dostawców

### Anthropic (bezpośrednie API i Vertex AI)

- `cacheRetention` jest obsługiwane przez dostawców `anthropic` i `anthropic-vertex`, a także przez modele Claude w `amazon-bedrock` oraz niestandardowe punkty końcowe zgodne z `anthropic-messages`, gdy `cacheRetention` ustawiono jawnie.
- Jeśli ta opcja nie jest ustawiona, OpenClaw ustawia początkowo `cacheRetention: "short"` dla bezpośredniego Anthropic (wyłącznie dostawcy `anthropic` i `anthropic-vertex`; inne trasy z rodziny Anthropic wymagają jawnej wartości).
- Natywne odpowiedzi Anthropic Messages udostępniają `cache_read_input_tokens` i `cache_creation_input_tokens`, mapowane odpowiednio na `cacheRead` i `cacheWrite`.
- `cacheRetention: "short"` odpowiada domyślnej, tymczasowej pamięci podręcznej o czasie ważności 5 minut. Jawne ustawienie `cacheRetention: "long"` żąda czasu TTL wynoszącego 1 godzinę (`cache_control: { type: "ephemeral", ttl: "1h" }`). Niejawne lub sterowane zmienną środowiskową długie przechowywanie (`OPENCLAW_CACHE_RETENTION=long` bez jawnego `cacheRetention`) przechodzi na godzinny TTL tylko na hostach `api.anthropic.com` lub Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); inne hosty zachowują 5-minutową pamięć podręczną.

Źródło: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (bezpośrednie API)

- Buforowanie promptów odbywa się automatycznie w obsługiwanych nowszych modelach; OpenClaw nie wstawia znaczników pamięci podręcznej na poziomie bloków.
- OpenClaw wysyła `prompt_cache_key`, aby zachować stabilne kierowanie pamięci podręcznej między turami. Bezpośrednie hosty `api.openai.com` otrzymują je automatycznie. Serwery proxy zgodne z OpenAI (oMLX, llama.cpp, niestandardowe punkty końcowe) muszą mieć w konfiguracji modelu ustawione `compat.supportsPromptCacheKey: true` — dla serwera proxy ta obsługa nigdy nie jest wykrywana automatycznie.
- `prompt_cache_retention: "24h"` jest dodawane tylko wtedy, gdy wybrano `cacheRetention: "long"`, a ustalony punkt końcowy obsługuje zarówno klucz pamięci podręcznej, jak i długie przechowywanie (`compat.supportsLongCacheRetention`, domyślnie `true`; profile zgodności Together AI i Cloudflare wyłączają tę funkcję). `cacheRetention: "none"` pomija oba pola.
- Trafienia w pamięci podręcznej są udostępniane przez `usage.prompt_tokens_details.cached_tokens` (Chat Completions) lub `input_tokens_details.cached_tokens` (Responses API) i mapowane na `cacheRead`.
- Ładunki Responses API mogą również udostępniać `input_tokens_details.cache_write_tokens`, mapowane na `cacheWrite` i rozliczane według stawki modelu za zapis do pamięci podręcznej; w ładunkach Responses bez tego pola `cacheWrite` pozostaje równe `0`. API Chat Completions OpenAI nie dokumentuje ani nie emituje licznika `cache_write_tokens`, ale OpenClaw nadal odczytuje tam `prompt_tokens_details.cache_write_tokens` na potrzeby serwerów proxy zgodnych z OpenRouter i w stylu DeepSeek, które raportują oddzielną liczbę zapisów.
- W praktyce OpenAI działa bardziej jak pamięć podręczna początkowego prefiksu niż mechanizm Anthropic ponownie wykorzystujący przesuwającą się pełną historię — zobacz poniższą sekcję [Oczekiwania dotyczące działania OpenAI na żywo](#openai-live-expectations).

### Amazon Bedrock

- Odwołania do modeli Anthropic Claude (`amazon-bedrock/*anthropic.claude*` oraz prefiksy systemowych profili wnioskowania AWS `us.`/`eu.`/`global.anthropic.claude*`) obsługują jawne przekazywanie `cacheRetention`.
- Modele Bedrock inne niż Anthropic (na przykład `amazon.nova-*`) w czasie działania nie używają przechowywania w pamięci podręcznej, niezależnie od skonfigurowanej wartości `cacheRetention`.
- Nieprzejrzyste ARN-y profili wnioskowania aplikacji Bedrock (identyfikatory profili, które nie zawierają `claude`) również nie używają przechowywania w pamięci podręcznej, chyba że `cacheRetention` ustawiono jawnie, ponieważ rodziny modelu nie można wywnioskować wyłącznie z ARN-u.

### OpenRouter

Dla odwołań do modeli `openrouter/anthropic/*` OpenClaw wstawia znaczniki Anthropic `cache_control` w blokach promptu systemowego/deweloperskiego, ale tylko wtedy, gdy żądanie nadal jest kierowane przez zweryfikowaną trasę OpenRouter (`openrouter` w domyślnym punkcie końcowym lub dowolny dostawca/bazowy adres URL rozpoznawany jako `openrouter.ai`). Przekierowanie modelu na dowolny adres URL serwera proxy zgodnego z OpenAI wyłącza to wstawianie.

`contextPruning.mode: "cache-ttl"` jest dozwolone dla odwołań do modeli `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` i `openrouter/zai/*`, ponieważ te trasy obsługują buforowanie promptów po stronie dostawcy bez konieczności używania znaczników wstawianych przez OpenClaw.

Źródło: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Tworzenie pamięci podręcznej DeepSeek w OpenRouter odbywa się na zasadzie najlepszych starań i może potrwać kilka sekund; natychmiastowe kolejne żądanie może nadal wskazywać `cached_tokens: 0`. Zweryfikuj działanie za pomocą ponownego żądania z tym samym prefiksem po krótkim opóźnieniu, używając `usage.prompt_tokens_details.cached_tokens` jako sygnału trafienia w pamięć podręczną.

### Google Gemini (bezpośrednie API)

- Bezpośredni transport Gemini (`api: "google-generative-ai"`) raportuje trafienia w pamięci podręcznej za pomocą nadrzędnego pola `cachedContentTokenCount`, mapowanego na `cacheRead`.
- Obsługiwane rodziny modeli: `gemini-2.5*` i `gemini-3*` (z wyłączeniem wariantów Live/podglądowych niespełniających tego dopasowania prefiksu, na przykład `gemini-live-2.5-flash-preview`).
- Gdy `cacheRetention` jest ustawione dla obsługiwanego modelu, OpenClaw automatycznie tworzy, ponownie wykorzystuje i odświeża zasób `cachedContents` dla promptu systemowego — ręczny uchwyt do buforowanej zawartości nie jest potrzebny. TTL wynosi `300s` dla `cacheRetention: "short"` i `3600s` dla `"long"`.
- Nadal można przekazać istniejący uchwyt buforowanej zawartości Gemini jako `params.cachedContent` (lub starsze `params.cached_content`); jawny uchwyt całkowicie pomija ścieżkę automatycznego zarządzania pamięcią podręczną.
- Jest to mechanizm odrębny od buforowania prefiksu promptu w Anthropic/OpenAI: zamiast wstawiać znaczniki pamięci podręcznej bezpośrednio w treści, OpenClaw zarządza natywnym zasobem dostawcy `cachedContents` dla Gemini.

Źródło: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Dostawcy z mechanizmem CLI (Claude Code, Gemini CLI)

Zaplecza CLI emitujące zdarzenia użycia JSONL (`jsonlDialect: "claude-stream-json"` lub `"gemini-stream-json"`) korzystają ze wspólnego parsera użycia, który rozpoznaje kilka wariantów nazw pól, w tym zwykły licznik `cached` mapowany na `cacheRead`. Gdy ładunek JSON interfejsu CLI nie zawiera bezpośredniego pola tokenów wejściowych, OpenClaw wylicza je jako `input_tokens - cached`. Jest to wyłącznie normalizacja użycia — nie tworzy znaczników pamięci podręcznej promptu w stylu Anthropic/OpenAI dla modeli obsługiwanych przez CLI.

Źródło: `src/agents/cli-output.ts` (`toCliUsage`).

### Inni dostawcy

Jeśli dostawca nie obsługuje żadnego z powyższych trybów pamięci podręcznej, `cacheRetention` nie ma wpływu.

## Granica pamięci podręcznej promptu systemowego

OpenClaw dzieli prompt systemowy na **stabilny prefiks** i **zmienny sufiks** na wewnętrznej granicy prefiksu pamięci podręcznej. Zawartość powyżej tej granicy (definicje narzędzi, metadane Skills, pliki obszaru roboczego) jest porządkowana tak, aby pozostawała identyczna bajt po bajcie między turami. Zawartość poniżej granicy (na przykład `HEARTBEAT.md`, znaczniki czasu środowiska uruchomieniowego i inne metadane poszczególnych tur) może się zmieniać bez unieważniania buforowanego prefiksu.

Najważniejsze decyzje projektowe:

- Stabilne pliki kontekstu projektu w obszarze roboczym są umieszczane przed `HEARTBEAT.md`, aby zmiany generowane przez Heartbeat nie naruszały stabilnego prefiksu.
- Granica obowiązuje przy kształtowaniu transportu rodziny Anthropic, rodziny OpenAI, Google i CLI, dzięki czemu wszyscy obsługiwani dostawcy korzystają z tej samej stabilności prefiksu.
- Żądania Codex Responses i Anthropic Vertex są kierowane przez mechanizm kształtowania pamięci podręcznej uwzględniający granicę, dzięki czemu ponowne użycie pamięci podręcznej pozostaje zgodne z danymi faktycznie otrzymywanymi przez dostawców.
- Odciski promptu systemowego są normalizowane (białe znaki, zakończenia wierszy, kontekst dodawany przez haki i kolejność możliwości środowiska uruchomieniowego), dzięki czemu prompty niezmienione semantycznie współdzielą pamięć podręczną między turami.

Jeśli po zmianie konfiguracji lub obszaru roboczego występują nieoczekiwane skoki `cacheWrite`, sprawdź, czy zmiana znajduje się powyżej, czy poniżej granicy pamięci podręcznej. Przeniesienie zmiennej zawartości poniżej granicy (lub jej ustabilizowanie) zwykle rozwiązuje problem.

## Zabezpieczenia stabilności pamięci podręcznej OpenClaw

- Dołączone katalogi narzędzi MCP są sortowane deterministycznie (najpierw według nazwy serwera, a następnie nazwy narzędzia) przed rejestracją narzędzi, dzięki czemu zmiany kolejności `listTools()` nie powodują zmian w bloku narzędzi ani nie naruszają prefiksów pamięci podręcznej promptów.
- Starsze sesje z utrwalonymi blokami obrazów zachowują bez zmian **3 ostatnie ukończone tury** (licząc wszystkie ukończone tury, a nie tylko te zawierające obrazy). Starsze, już przetworzone bloki obrazów są zastępowane znacznikiem tekstowym, dzięki czemu kolejne żądania w sesjach intensywnie korzystających z obrazów nie wysyłają ponownie dużych, nieaktualnych ładunków.

## Wzorce dostrajania

### Ruch mieszany (zalecana wartość domyślna)

Utrzymuj długotrwałą konfigurację bazową głównego agenta i wyłącz buforowanie dla agentów powiadamiających, którzy działają krótkimi seriami:

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

- Ustaw bazowe `cacheRetention: "short"`.
- Włącz `contextPruning.mode: "cache-ttl"`.
- Utrzymuj interwał Heartbeat poniżej TTL tylko dla agentów, które korzystają na ciepłej pamięci podręcznej.

## Testy regresji na żywo

OpenClaw uruchamia jedną połączoną bramkę regresji pamięci podręcznej na żywo, obejmującą powtarzane prefiksy, tury z narzędziami, tury z obrazami, transkrypcje narzędzi w stylu MCP oraz wariant kontrolny Anthropic bez pamięci podręcznej.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Uruchom ją poleceniem:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Plik bazowy przechowuje ostatnio zaobserwowane wyniki z testów na żywo oraz charakterystyczne dla poszczególnych dostawców dolne progi regresji, względem których wykonywany jest test. Każde uruchomienie używa nowych identyfikatorów sesji i przestrzeni nazw promptów, aby wcześniejszy stan pamięci podręcznej nie zanieczyszczał bieżącej próbki. Anthropic i OpenAI stosują różne mechanizmy egzekwowania: niespełnienie dolnego progu Anthropic jest twardą regresją (test kończy się niepowodzeniem), natomiast niespełnienie dolnego progu OpenAI służy wyłącznie do obserwacji (jest rejestrowane jako ostrzeżenie i nie powoduje niepowodzenia uruchomienia). Dostawcy nie współdzielą jednego wspólnego progu.

### Oczekiwania dotyczące działania Anthropic na żywo

- Oczekuj jawnych zapisów rozgrzewających za pośrednictwem `cacheWrite`.
- Oczekuj ponownego wykorzystania niemal całej historii w kolejnych turach, ponieważ mechanizm kontroli pamięci podręcznej Anthropic przesuwa punkt podziału pamięci podręcznej wraz z przebiegiem rozmowy.
- Minimalne wartości bazowe dla stabilnych ścieżek oraz ścieżek narzędziowych, obrazowych i typu MCP stanowią bezwzględne bramki wykrywania regresji.

### Oczekiwania wobec OpenAI w środowisku produkcyjnym

- Oczekuj wyłącznie `cacheRead`; w Chat Completions wartość `cacheWrite` pozostaje równa `0`.
- Traktuj ponowne wykorzystanie pamięci podręcznej w kolejnych turach jako charakterystyczny dla dostawcy poziom stabilizacji, a nie jako przesuwające się ponowne wykorzystanie pełnej historii w stylu Anthropic.
- Wartości minimalne służą wyłącznie do monitorowania (ich niespełnienie jest rejestrowane jako ostrzeżenie, a nie błąd testu) i wynikają z zaobserwowanego działania modelu `gpt-5.4-mini` w środowisku produkcyjnym:

| Scenariusz             | Minimum `cacheRead` | Minimalny współczynnik trafień |
| ---------------------- | ------------------: | -----------------------------: |
| Stabilny prefiks       |               4,608 |                           0.90 |
| Transkrypcja narzędzi  |               4,096 |                           0.85 |
| Transkrypcja obrazów   |               3,840 |                           0.82 |
| Transkrypcja typu MCP  |               4,096 |                           0.85 |

Najnowsze zaobserwowane wartości bazowe (z pliku `live-cache-regression-baseline.ts`) wyniosły: stabilny prefiks `cacheRead=4864`, współczynnik trafień `0.966`; transkrypcja narzędzi `cacheRead=4608`, współczynnik trafień `0.896`; transkrypcja obrazów `cacheRead=4864`, współczynnik trafień `0.954`; transkrypcja typu MCP `cacheRead=4608`, współczynnik trafień `0.891`.

Dlaczego asercje się różnią: Anthropic udostępnia jawne punkty podziału pamięci podręcznej i przesuwające się ponowne wykorzystanie historii rozmowy, natomiast efektywnie możliwy do ponownego wykorzystania prefiks OpenAI w ruchu produkcyjnym może ustabilizować się przed objęciem całego promptu. Porównywanie obu dostawców przy użyciu jednego, wspólnego progu procentowego prowadzi do fałszywego wykrywania regresji.

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

### Przełączniki środowiskowe (jednorazowe debugowanie)

| Zmienna                              | Działanie                                        |
| ------------------------------------ | ------------------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | Włącza śledzenie pamięci podręcznej               |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Zastępuje ścieżkę wyjściową                       |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Przełącza rejestrowanie pełnej treści wiadomości  |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Przełącza rejestrowanie tekstu promptu            |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Przełącza rejestrowanie promptu systemowego       |

### Co sprawdzać

- Zdarzenia śledzenia pamięci podręcznej mają format JSONL i zawierają etapowe migawki, takie jak `session:loaded`, `prompt:before`, `stream:context` oraz `session:after`.
- Wpływ tokenów pamięci podręcznej w każdej turze jest widoczny w standardowych miejscach prezentujących użycie: `cacheRead` i `cacheWrite` pojawiają się w `/usage tokens`, `/status`, podsumowaniach użycia sesji oraz niestandardowych układach `messages.usageTemplate`.
- W przypadku Anthropic, gdy buforowanie jest aktywne, oczekuj zarówno `cacheRead`, jak i `cacheWrite`.
- W przypadku OpenAI oczekuj `cacheRead` przy trafieniach w pamięci podręcznej; `cacheWrite` jest uzupełniane wyłącznie w ładunkach Responses API, które je zawierają (zobacz sekcję [OpenAI](#openai-direct-api) powyżej).
- OpenAI zwraca również nagłówki śledzenia i limitów szybkości, takie jak `x-request-id`, `openai-processing-ms` oraz `x-ratelimit-*`; używaj ich do śledzenia żądań, ale dane o trafieniach w pamięci podręcznej nadal należy pobierać z ładunku użycia, a nie z nagłówków.

## Szybkie rozwiązywanie problemów

- **Wysokie `cacheWrite` w większości tur**: sprawdź zmienne dane wejściowe promptu systemowego; upewnij się, że model lub dostawca obsługuje ustawienia pamięci podręcznej.
- **Wysokie `cacheWrite` w Anthropic**: często oznacza, że punkt podziału pamięci podręcznej przypada na treść zmieniającą się przy każdym żądaniu.
- **Niskie `cacheRead` w OpenAI**: upewnij się, że stabilny prefiks znajduje się na początku, powtarzany prefiks ma co najmniej 1024 tokeny, a ten sam `prompt_cache_key` jest ponownie używany w turach, które powinny współdzielić pamięć podręczną.
- **Brak efektu działania `cacheRetention`**: upewnij się, że klucz modelu odpowiada `agents.defaults.models["provider/model"]`.
- **Żądania Bedrock Nova z ustawieniami pamięci podręcznej**: to oczekiwane — podczas działania dla tych żądań nie jest stosowane przechowywanie pamięci podręcznej.

Powiązana dokumentacja:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration-reference)

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
