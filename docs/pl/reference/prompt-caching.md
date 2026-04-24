---
read_when:
    - Chcesz zmniejszyć koszty tokenów promptu dzięki retencji cacheավորում
    - Potrzebujesz zachowania cache per agent w konfiguracjach wieloagentowych
    - Dostrajasz heartbeat i przycinanie cache-ttl razem
summary: Ustawienia prompt cache, kolejność scalania, zachowanie providera i wzorce strojenia
title: Prompt caching
x-i18n:
    generated_at: "2026-04-24T09:31:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

Prompt caching oznacza, że provider modelu może ponownie używać niezmienionych prefiksów promptu (zwykle instrukcji system/developer i innego stabilnego kontekstu) między turami zamiast przetwarzać je od nowa za każdym razem. OpenClaw normalizuje użycie providera do `cacheRead` i `cacheWrite`, gdy upstream API bezpośrednio ujawnia te liczniki.

Powierzchnie statusu mogą również odzyskiwać liczniki cache z najnowszego logu użycia transkryptu, gdy brakuje ich w migawce aktywnej sesji, dzięki czemu `/status` może nadal pokazywać wiersz cache po częściowej utracie metadanych sesji. Istniejące niezerowe aktywne wartości cache nadal mają pierwszeństwo przed wartościami awaryjnymi z transkryptu.

Dlaczego to ważne: niższy koszt tokenów, szybsze odpowiedzi i bardziej przewidywalna wydajność dla długotrwałych sesji. Bez cache powtarzane prompty płacą pełny koszt promptu przy każdej turze, nawet gdy większość wejścia się nie zmieniła.

Ta strona obejmuje wszystkie ustawienia związane z cache, które wpływają na ponowne użycie promptu i koszt tokenów.

Dokumentacja providerów:

- Anthropic prompt caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Nagłówki API OpenAI i request ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Request ID i błędy Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Główne ustawienia

### `cacheRetention` (globalna wartość domyślna, model i per-agent)

Ustaw retencję cache jako globalną wartość domyślną dla wszystkich modeli:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Nadpisanie per-model:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Nadpisanie per-agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Kolejność scalania konfiguracji:

1. `agents.defaults.params` (globalna wartość domyślna — dotyczy wszystkich modeli)
2. `agents.defaults.models["provider/model"].params` (nadpisanie per-model)
3. `agents.list[].params` (pasujące id agenta; nadpisuje po kluczu)

### `contextPruning.mode: "cache-ttl"`

Przycina stary kontekst wyników narzędzi po oknach TTL cache, tak aby żądania po bezczynności nie buforowały ponownie zbyt dużej historii.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Pełne zachowanie znajdziesz w [Przycinanie sesji](/pl/concepts/session-pruning).

### Heartbeat keep-warm

Heartbeat może utrzymywać okna cache „ciepłe” i ograniczać powtarzające się zapisy cache po okresach bezczynności.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per-agent jest obsługiwany pod `agents.list[].heartbeat`.

## Zachowanie providera

### Anthropic (bezpośrednie API)

- `cacheRetention` jest obsługiwane.
- Przy profilach auth z kluczem API Anthropic OpenClaw inicjalizuje `cacheRetention: "short"` dla referencji modeli Anthropic, gdy nie jest ustawione.
- Natywne odpowiedzi Anthropic Messages ujawniają zarówno `cache_read_input_tokens`, jak i `cache_creation_input_tokens`, więc OpenClaw może pokazywać zarówno `cacheRead`, jak i `cacheWrite`.
- Dla natywnych żądań Anthropic `cacheRetention: "short"` mapuje się do domyślnego 5-minutowego cache efemerycznego, a `cacheRetention: "long"` podnosi TTL do 1 godziny tylko na bezpośrednich hostach `api.anthropic.com`.

### OpenAI (bezpośrednie API)

- Prompt caching jest automatyczny na obsługiwanych nowszych modelach. OpenClaw nie musi wstrzykiwać znaczników cache na poziomie bloków.
- OpenClaw używa `prompt_cache_key`, aby utrzymać stabilny routing cache między turami, i używa `prompt_cache_retention: "24h"` tylko wtedy, gdy na bezpośrednich hostach OpenAI wybrano `cacheRetention: "long"`.
- OpenAI ujawnia buforowane tokeny promptu przez `usage.prompt_tokens_details.cached_tokens` (lub `input_tokens_details.cached_tokens` w zdarzeniach Responses API). OpenClaw mapuje to na `cacheRead`.
- OpenAI nie ujawnia osobnego licznika tokenów zapisu cache, więc `cacheWrite` pozostaje `0` na ścieżkach OpenAI, nawet gdy provider rozgrzewa cache.
- OpenAI zwraca przydatne nagłówki śledzenia i limitów szybkości, takie jak `x-request-id`, `openai-processing-ms` i `x-ratelimit-*`, ale rozliczanie trafień cache powinno pochodzić z ładunku usage, a nie z nagłówków.
- W praktyce OpenAI często zachowuje się jak cache początkowego prefiksu, a nie jak moving full-history reuse w stylu Anthropic. Stabilne tury tekstowe z długim prefiksem mogą dochodzić do plateau około `4864` buforowanych tokenów w bieżących probe live, podczas gdy transkrypty bogate w narzędzia lub w stylu MCP często zatrzymują się w pobliżu `4608` buforowanych tokenów nawet przy dokładnych powtórzeniach.

### Anthropic Vertex

- Modele Anthropic na Vertex AI (`anthropic-vertex/*`) obsługują `cacheRetention` tak samo jak bezpośredni Anthropic.
- `cacheRetention: "long"` mapuje się do rzeczywistego 1-godzinnego TTL prompt-cache na punktach końcowych Vertex AI.
- Domyślna retencja cache dla `anthropic-vertex` odpowiada domyślnym ustawieniom bezpośredniego Anthropic.
- Żądania Vertex są kierowane przez shaping cache świadomy granic, dzięki czemu ponowne użycie cache pozostaje zgodne z tym, co providerzy faktycznie otrzymują.

### Amazon Bedrock

- Referencje modeli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) obsługują jawne przekazywanie `cacheRetention`.
- Modele Bedrock inne niż Anthropic są wymuszane w runtime do `cacheRetention: "none"`.

### Modele Anthropic przez OpenRouter

Dla referencji modeli `openrouter/anthropic/*` OpenClaw wstrzykuje Anthropic
`cache_control` do bloków promptów system/developer, aby poprawić ponowne użycie
prompt-cache tylko wtedy, gdy żądanie nadal trafia do zweryfikowanej trasy OpenRouter
(`openrouter` na domyślnym punkcie końcowym albo dowolny provider/base URL rozwiązywany
do `openrouter.ai`).

Jeśli przekierujesz model na dowolny zgodny z OpenAI URL proxy, OpenClaw
przestaje wstrzykiwać te znaczniki cache Anthropic specyficzne dla OpenRouter.

### Inni providerzy

Jeśli provider nie obsługuje tego trybu cache, `cacheRetention` nie ma efektu.

### Google Gemini direct API

- Bezpośredni transport Gemini (`api: "google-generative-ai"`) raportuje trafienia cache
  przez upstream `cachedContentTokenCount`; OpenClaw mapuje to na `cacheRead`.
- Gdy na bezpośrednim modelu Gemini ustawione jest `cacheRetention`, OpenClaw automatycznie
  tworzy, ponownie używa i odświeża zasoby `cachedContents` dla promptów systemowych
  w uruchomieniach Google AI Studio. Oznacza to, że nie musisz już ręcznie tworzyć
  uchwytu cached-content.
- Nadal możesz przekazać istniejący uchwyt Gemini cached-content jako
  `params.cachedContent` (lub starsze `params.cached_content`) na skonfigurowanym
  modelu.
- To jest oddzielne od cache prefiksu promptu Anthropic/OpenAI. Dla Gemini
  OpenClaw zarządza natywnym zasobem providera `cachedContents` zamiast
  wstrzykiwać znaczniki cache do żądania.

### Użycie JSON Gemini CLI

- Wyjście JSON Gemini CLI może również ujawniać trafienia cache przez `stats.cached`;
  OpenClaw mapuje to na `cacheRead`.
- Jeśli CLI pomija bezpośrednią wartość `stats.input`, OpenClaw wyprowadza tokeny wejścia
  z `stats.input_tokens - stats.cached`.
- To tylko normalizacja użycia. Nie oznacza to, że OpenClaw tworzy
  znaczniki prompt-cache w stylu Anthropic/OpenAI dla Gemini CLI.

## Granica cache system-prompt

OpenClaw dzieli system prompt na **stabilny prefiks** i **zmienny
sufiks** rozdzielone wewnętrzną granicą prefiksu cache. Treść powyżej
granicy (definicje narzędzi, metadane Skills, pliki workspace i inny
stosunkowo statyczny kontekst) jest uporządkowana tak, aby pozostawała
bajtowo identyczna między turami. Treść poniżej granicy (na przykład `HEARTBEAT.md`,
znaczniki czasu runtime i inne metadane per-turn) może się zmieniać bez unieważniania
buforowanego prefiksu.

Kluczowe decyzje projektowe:

- Stabilne pliki kontekstu projektu workspace są uporządkowane przed `HEARTBEAT.md`, dzięki czemu
  churn heartbeat nie psuje stabilnego prefiksu.
- Granica jest stosowana w shapingu cache rodzin Anthropic, rodzin OpenAI, Google i transportu CLI, dzięki czemu wszyscy obsługiwani providerzy korzystają z tej samej stabilności prefiksu.
- Żądania Codex Responses i Anthropic Vertex są kierowane przez shaping cache świadomy granic, dzięki czemu ponowne użycie cache pozostaje zgodne z tym, co providerzy faktycznie otrzymują.
- Odciski system-prompt są normalizowane (białe znaki, końce linii,
  kontekst dodany przez hooki, kolejność możliwości runtime), dzięki czemu semantycznie niezmienione
  prompty współdzielą KV/cache między turami.

Jeśli po zmianie konfiguracji lub workspace widzisz nieoczekiwane skoki `cacheWrite`,
sprawdź, czy zmiana trafia powyżej, czy poniżej granicy cache. Przeniesienie
zmiennej treści poniżej granicy (lub jej ustabilizowanie) często rozwiązuje
problem.

## Guardy stabilności cache OpenClaw

OpenClaw utrzymuje również deterministyczny kształt kilku ładunków wrażliwych na cache, zanim
żądanie dotrze do providera:

- Katalogi narzędzi bundle MCP są sortowane deterministycznie przed rejestracją
  narzędzi, dzięki czemu zmiany kolejności `listTools()` nie powodują churn bloku narzędzi
  ani nie psują prefiksów prompt-cache.
- Starsze sesje z zapisanymi blokami obrazów zachowują **3 najnowsze
  ukończone tury** bez zmian; starsze już przetworzone bloki obrazów mogą zostać
  zastąpione znacznikiem, dzięki czemu kolejne odpowiedzi w sesjach bogatych w obrazy nie wysyłają
  stale dużych nieaktualnych ładunków.

## Wzorce strojenia

### Ruch mieszany (zalecana wartość domyślna)

Utrzymuj długowieczną bazę na głównym agencie, a wyłącz cache na agentach powiadomień typu bursty:

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

### Baza nastawiona na koszt

- Ustaw bazowe `cacheRetention: "short"`.
- Włącz `contextPruning.mode: "cache-ttl"`.
- Utrzymuj heartbeat poniżej swojego TTL tylko dla agentów, które korzystają z ciepłego cache.

## Diagnostyka cache

OpenClaw udostępnia dedykowaną diagnostykę śledzenia cache dla osadzonych uruchomień agentów.

W przypadku zwykłej diagnostyki dla użytkownika `/status` i inne podsumowania użycia mogą wykorzystywać
najnowszy wpis użycia transkryptu jako awaryjne źródło dla `cacheRead` /
`cacheWrite`, gdy aktywny wpis sesji nie ma tych liczników.

## Testy regresji live

OpenClaw utrzymuje jedną połączoną bramkę regresji cache live dla powtarzanych prefiksów, tur narzędzi, tur obrazów, transkryptów narzędzi w stylu MCP oraz kontrolki Anthropic bez cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Uruchom zawężoną bramkę live przez:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Plik baseline przechowuje ostatnio zaobserwowane wartości live oraz minimalne progi regresji zależne od providera używane przez test.
Runner używa też świeżych identyfikatorów sesji per-run oraz przestrzeni nazw promptów, tak aby poprzedni stan cache nie zanieczyszczał bieżącej próbki regresji.

Te testy celowo nie używają identycznych kryteriów sukcesu dla wszystkich providerów.

### Oczekiwania live Anthropic

- Oczekiwane są jawne zapisy rozgrzewające przez `cacheWrite`.
- Oczekiwane jest ponowne użycie niemal pełnej historii przy powtarzanych turach, ponieważ kontrola cache Anthropic przesuwa punkt graniczny cache przez całą konwersację.
- Obecne asercje live nadal używają wysokich progów trafień dla stabilnych ścieżek, narzędzi i obrazów.

### Oczekiwania live OpenAI

- Oczekiwane jest tylko `cacheRead`. `cacheWrite` pozostaje `0`.
- Traktuj ponowne użycie cache przy powtarzanych turach jako plateau specyficzne dla providera, a nie jako moving full-history reuse w stylu Anthropic.
- Obecne asercje live używają konserwatywnych progów pochodzących z zaobserwowanego zachowania live na `gpt-5.4-mini`:
  - stabilny prefiks: `cacheRead >= 4608`, współczynnik trafień `>= 0.90`
  - transkrypt narzędzi: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`
  - transkrypt obrazów: `cacheRead >= 3840`, współczynnik trafień `>= 0.82`
  - transkrypt w stylu MCP: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`

Świeża połączona weryfikacja live z 2026-04-04 wylądowała na:

- stabilny prefiks: `cacheRead=4864`, współczynnik trafień `0.966`
- transkrypt narzędzi: `cacheRead=4608`, współczynnik trafień `0.896`
- transkrypt obrazów: `cacheRead=4864`, współczynnik trafień `0.954`
- transkrypt w stylu MCP: `cacheRead=4608`, współczynnik trafień `0.891`

Ostatni lokalny czas ścienny dla połączonej bramki wynosił około `88s`.

Dlaczego asercje się różnią:

- Anthropic ujawnia jawne punkty graniczne cache i przesuwające się ponowne użycie historii konwersacji.
- Prompt caching OpenAI nadal jest wrażliwy na dokładny prefiks, ale efektywny prefiks wielokrotnego użytku w ruchu live Responses może osiągać plateau wcześniej niż pełny prompt.
- Z tego powodu porównywanie Anthropic i OpenAI jednym wspólnym progiem procentowym między providerami tworzy fałszywe regresje.

### Konfiguracja `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Wartości domyślne:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Przełączniki env (jednorazowe debugowanie)

- `OPENCLAW_CACHE_TRACE=1` włącza śledzenie cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` nadpisuje ścieżkę wyjściową.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` przełącza przechwytywanie pełnego ładunku wiadomości.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` przełącza przechwytywanie tekstu promptu.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` przełącza przechwytywanie system prompt.

### Co sprawdzać

- Zdarzenia śledzenia cache są w formacie JSONL i zawierają etapowe migawki takie jak `session:loaded`, `prompt:before`, `stream:context` i `session:after`.
- Wpływ tokenów cache per turn jest widoczny w zwykłych powierzchniach użycia przez `cacheRead` i `cacheWrite` (na przykład `/usage full` i podsumowania użycia sesji).
- Dla Anthropic, gdy cache jest aktywny, oczekuj zarówno `cacheRead`, jak i `cacheWrite`.
- Dla OpenAI oczekuj `cacheRead` przy trafieniach cache, a `cacheWrite` powinno pozostawać `0`; OpenAI nie publikuje osobnego pola tokenów zapisu cache.
- Jeśli potrzebujesz śledzenia żądań, loguj request ID i nagłówki limitów szybkości oddzielnie od metryk cache. Bieżące dane wyjściowe cache-trace OpenClaw są skupione na kształcie promptu/sesji i znormalizowanym użyciu tokenów, a nie na surowych nagłówkach odpowiedzi providera.

## Szybkie rozwiązywanie problemów

- Wysokie `cacheWrite` przy większości tur: sprawdź zmienne wejścia system prompt i zweryfikuj, czy model/provider obsługuje Twoje ustawienia cache.
- Wysokie `cacheWrite` w Anthropic: często oznacza, że punkt graniczny cache trafia na treść zmieniającą się przy każdym żądaniu.
- Niskie `cacheRead` w OpenAI: sprawdź, czy stabilny prefiks jest na początku, czy powtarzany prefiks ma co najmniej 1024 tokeny i czy dla tur, które powinny współdzielić cache, używany jest ten sam `prompt_cache_key`.
- Brak efektu `cacheRetention`: potwierdź, że klucz modelu odpowiada `agents.defaults.models["provider/model"]`.
- Żądania Bedrock Nova/Mistral z ustawieniami cache: oczekiwane wymuszenie runtime do `none`.

Powiązana dokumentacja:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration-reference)

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
