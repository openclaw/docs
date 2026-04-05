---
read_when:
    - Chcesz obniżyć koszty tokenów promptów za pomocą retencji cache
    - Potrzebujesz zachowania cache per agent w konfiguracjach wieloagentowych
    - Dostrajasz heartbeat i przycinanie cache-ttl razem
summary: Ustawienia cache promptów, kolejność scalania, zachowanie providerów i wzorce strojenia
title: Cache promptów
x-i18n:
    generated_at: "2026-04-05T14:05:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# Cache promptów

Cache promptów oznacza, że provider modelu może ponownie używać niezmienionych prefiksów promptu (zwykle instrukcji systemowych/deweloperskich i innego stabilnego kontekstu) między turami zamiast przetwarzać je za każdym razem od nowa. OpenClaw normalizuje użycie providera do `cacheRead` i `cacheWrite`, gdy upstream API bezpośrednio udostępnia te liczniki.

Powierzchnie statusu mogą także odzyskiwać liczniki cache z najnowszego logu
użycia transkryptu, gdy brakuje ich w aktywnej migawce sesji, dzięki czemu `/status` może nadal
pokazywać wiersz cache po częściowej utracie metadanych sesji. Istniejące niezerowe aktywne
wartości cache nadal mają pierwszeństwo przed wartościami awaryjnymi z transkryptu.

Dlaczego to ma znaczenie: niższy koszt tokenów, szybsze odpowiedzi i bardziej przewidywalna wydajność dla długotrwałych sesji. Bez cache powtarzane prompty płacą pełny koszt promptu przy każdej turze, nawet jeśli większość danych wejściowych się nie zmieniła.

Ta strona obejmuje wszystkie ustawienia związane z cache, które wpływają na ponowne użycie promptów i koszt tokenów.

Dokumentacja providerów:

- Cache promptów Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache promptów OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Nagłówki API i identyfikatory żądań OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Identyfikatory żądań i błędy Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Główne ustawienia

### `cacheRetention` (globalna wartość domyślna, model i per agent)

Ustaw retencję cache jako globalną wartość domyślną dla wszystkich modeli:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Nadpisanie per model:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Nadpisanie per agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Kolejność scalania konfiguracji:

1. `agents.defaults.params` (globalna wartość domyślna — dotyczy wszystkich modeli)
2. `agents.defaults.models["provider/model"].params` (nadpisanie per model)
3. `agents.list[].params` (pasujące id agenta; nadpisanie według klucza)

### `contextPruning.mode: "cache-ttl"`

Przycina stary kontekst wyników narzędzi po upływie okien TTL cache, aby żądania po bezczynności nie powodowały ponownego cachowania zbyt dużej historii.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Pełne zachowanie opisano w [Przycinanie sesji](/pl/concepts/session-pruning).

### Utrzymywanie ciepła przez heartbeat

Heartbeat może utrzymywać okna cache w stanie warm i ograniczać powtarzane zapisy do cache po okresach bezczynności.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agent jest obsługiwany pod `agents.list[].heartbeat`.

## Zachowanie providerów

### Anthropic (bezpośrednie API)

- `cacheRetention` jest obsługiwane.
- W przypadku profili uwierzytelniania Anthropic z kluczem API OpenClaw ustawia `cacheRetention: "short"` dla referencji modeli Anthropic, jeśli wartość nie jest ustawiona.
- Natywne odpowiedzi Anthropic Messages udostępniają zarówno `cache_read_input_tokens`, jak i `cache_creation_input_tokens`, więc OpenClaw może pokazywać zarówno `cacheRead`, jak i `cacheWrite`.
- Dla natywnych żądań Anthropic `cacheRetention: "short"` mapuje się na domyślny 5-minutowy cache ephemeral, a `cacheRetention: "long"` podnosi TTL do 1 godziny tylko na bezpośrednich hostach `api.anthropic.com`.

### OpenAI (bezpośrednie API)

- Cache promptów działa automatycznie na obsługiwanych nowszych modelach. OpenClaw nie musi wstrzykiwać znaczników cache na poziomie bloków.
- OpenClaw używa `prompt_cache_key`, aby utrzymać stabilne routowanie cache między turami, i używa `prompt_cache_retention: "24h"` tylko wtedy, gdy dla bezpośrednich hostów OpenAI wybrano `cacheRetention: "long"`.
- Odpowiedzi OpenAI udostępniają tokeny promptów z cache przez `usage.prompt_tokens_details.cached_tokens` (albo `input_tokens_details.cached_tokens` w zdarzeniach Responses API). OpenClaw mapuje to na `cacheRead`.
- OpenAI nie udostępnia osobnego licznika tokenów zapisu do cache, więc `cacheWrite` pozostaje `0` na ścieżkach OpenAI nawet wtedy, gdy provider rozgrzewa cache.
- OpenAI zwraca przydatne nagłówki śledzenia i limitów, takie jak `x-request-id`, `openai-processing-ms` i `x-ratelimit-*`, ale rozliczanie trafień cache powinno pochodzić z payloadu użycia, a nie z nagłówków.
- W praktyce OpenAI często zachowuje się jak cache początkowego prefiksu, a nie jak antropiczne przesuwające się ponowne użycie pełnej historii. Stabilne długie prefiksy tekstowe mogą w bieżących testach osiągać plateau około `4864` cachowanych tokenów, podczas gdy transkrypty intensywnie korzystające z narzędzi lub w stylu MCP często osiągają plateau bliżej `4608` cachowanych tokenów nawet przy dokładnych powtórzeniach.

### Anthropic Vertex

- Modele Anthropic na Vertex AI (`anthropic-vertex/*`) obsługują `cacheRetention` tak samo jak bezpośredni Anthropic.
- `cacheRetention: "long"` mapuje się na rzeczywisty 1-godzinny TTL cache promptów na endpointach Vertex AI.
- Domyślna retencja cache dla `anthropic-vertex` odpowiada domyślnym ustawieniom bezpośredniego Anthropic.
- Żądania Vertex są routowane przez kształtowanie cache świadome granic, aby ponowne użycie cache pozostawało zgodne z tym, co faktycznie otrzymują providery.

### Amazon Bedrock

- Referencje modeli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) obsługują jawne przekazywanie `cacheRetention`.
- Dla modeli Bedrock innych niż Anthropic runtime wymusza `cacheRetention: "none"`.

### Modele Anthropic przez OpenRouter

Dla referencji modeli `openrouter/anthropic/*` OpenClaw wstrzykuje antropiczne
`cache_control` do bloków promptów systemowych/deweloperskich, aby poprawić
ponowne użycie cache promptów tylko wtedy, gdy żądanie nadal trafia na zweryfikowaną trasę OpenRouter
(`openrouter` na domyślnym endpointzie albo dowolny provider/base URL, który wskazuje
na `openrouter.ai`).

Jeśli przekażesz model na dowolny URL proxy zgodny z OpenAI, OpenClaw
przestaje wstrzykiwać te specyficzne dla OpenRouter znaczniki cache Anthropic.

### Inni providerzy

Jeśli provider nie obsługuje tego trybu cache, `cacheRetention` nie ma efektu.

### Google Gemini direct API

- Bezpośredni transport Gemini (`api: "google-generative-ai"`) raportuje trafienia cache
  przez upstream `cachedContentTokenCount`; OpenClaw mapuje to na `cacheRead`.
- Gdy `cacheRetention` jest ustawione dla bezpośredniego modelu Gemini, OpenClaw automatycznie
  tworzy, ponownie używa i odświeża zasoby `cachedContents` dla promptów systemowych
  w uruchomieniach Google AI Studio. Oznacza to, że nie trzeba już ręcznie tworzyć
  uchwytu cached-content.
- Nadal możesz przekazać istniejący uchwyt Gemini cached-content jako
  `params.cachedContent` (albo starsze `params.cached_content`) dla skonfigurowanego
  modelu.
- Jest to niezależne od cache prefiksów promptów Anthropic/OpenAI. W przypadku Gemini
  OpenClaw zarządza natywnym dla providera zasobem `cachedContents` zamiast
  wstrzykiwać znaczniki cache do żądania.

### Użycie JSON w Gemini CLI

- Dane wyjściowe JSON Gemini CLI mogą także pokazywać trafienia cache przez `stats.cached`;
  OpenClaw mapuje to na `cacheRead`.
- Jeśli CLI pomija bezpośrednią wartość `stats.input`, OpenClaw wylicza tokeny wejściowe
  jako `stats.input_tokens - stats.cached`.
- To tylko normalizacja użycia. Nie oznacza to, że OpenClaw tworzy
  znaczniki cache promptów w stylu Anthropic/OpenAI dla Gemini CLI.

## Granica cache promptu systemowego

OpenClaw dzieli prompt systemowy na **stabilny prefiks** i **zmienny
sufiks** rozdzielone wewnętrzną granicą prefiksu cache. Treść powyżej
granicy (definicje narzędzi, metadane Skills, pliki workspace i inny
stosunkowo statyczny kontekst) jest uporządkowana tak, aby pozostawała bajt w bajt identyczna między turami.
Treść poniżej granicy (na przykład `HEARTBEAT.md`, znaczniki czasu runtime i
inne metadane per turn) może się zmieniać bez unieważniania cachowanego
prefiksu.

Kluczowe decyzje projektowe:

- Stabilne pliki kontekstu projektu workspace są uporządkowane przed `HEARTBEAT.md`, aby
  zmiany heartbeat nie psuły stabilnego prefiksu.
- Granica jest stosowana w kształtowaniu cache dla rodzin Anthropic, OpenAI, Google oraz transportów CLI, dzięki czemu wszyscy obsługiwani providerzy korzystają z tej samej stabilności prefiksu.
- Żądania Codex Responses i Anthropic Vertex są routowane przez
  kształtowanie cache świadome granic, aby ponowne użycie cache pozostawało zgodne z tym, co providery faktycznie otrzymują.
- Odciski promptów systemowych są normalizowane (białe znaki, zakończenia linii,
  kontekst dodawany przez hooki, kolejność możliwości runtime), dzięki czemu
  semantycznie niezmienione prompty współdzielą KV/cache między turami.

Jeśli po zmianie konfiguracji lub workspace widzisz nieoczekiwane skoki `cacheWrite`,
sprawdź, czy zmiana trafia powyżej, czy poniżej granicy cache. Przeniesienie
zmiennej treści poniżej granicy (albo jej ustabilizowanie) często rozwiązuje
problem.

## Zabezpieczenia stabilności cache w OpenClaw

OpenClaw utrzymuje także kilka kształtów payloadów wrażliwych na cache w sposób deterministyczny, zanim
żądanie dotrze do providera:

- Katalogi narzędzi Bundle MCP są sortowane deterministycznie przed rejestracją
  narzędzi, aby zmiany kolejności `listTools()` nie mieszały bloku narzędzi i nie
  psuły prefiksów cache promptów.
- Starsze sesje z zachowanymi blokami obrazów zachowują **3 najnowsze
  ukończone tury** bez zmian; starsze, już przetworzone bloki obrazów mogą zostać
  zastąpione znacznikiem, aby follow-upy bogate w obrazy nie wysyłały ponownie dużych,
  przestarzałych payloadów.

## Wzorce strojenia

### Ruch mieszany (zalecana wartość domyślna)

Utrzymuj długotrwałą bazę na głównym agencie, wyłącz cache na agentach powiadomień o skokowym ruchu:

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

### Konfiguracja z priorytetem kosztów

- Ustaw bazowe `cacheRetention: "short"`.
- Włącz `contextPruning.mode: "cache-ttl"`.
- Utrzymuj heartbeat poniżej TTL tylko dla agentów, które korzystają z warm cache.

## Diagnostyka cache

OpenClaw udostępnia dedykowaną diagnostykę śledzenia cache dla osadzonych uruchomień agentów.

W przypadku zwykłej diagnostyki użytkownika `/status` i inne podsumowania użycia mogą wykorzystywać
najnowszy wpis użycia z transkryptu jako źródło awaryjne dla `cacheRead` /
`cacheWrite`, gdy aktywny wpis sesji nie ma tych liczników.

## Testy regresji live

OpenClaw utrzymuje jedną połączoną bramkę regresji cache live dla powtarzanych prefiksów, tur narzędzi, tur obrazów, transkryptów narzędzi w stylu MCP oraz kontrolki Anthropic bez cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Uruchom wąską bramkę live poleceniem:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Plik baseline przechowuje ostatnio zaobserwowane wartości live oraz specyficzne dla providerów progi regresji używane przez test.
Runner używa także nowych identyfikatorów sesji i przestrzeni nazw promptów dla każdego uruchomienia, aby poprzedni stan cache nie zanieczyszczał bieżącej próbki regresji.

Te testy celowo nie używają identycznych kryteriów powodzenia dla wszystkich providerów.

### Oczekiwania live dla Anthropic

- Oczekuj jawnych zapisów rozgrzewających przez `cacheWrite`.
- Oczekuj ponownego użycia prawie całej historii przy powtórzonych turach, ponieważ kontrola cache Anthropic przesuwa punkt graniczny cache przez całą rozmowę.
- Bieżące asercje live nadal używają wysokich progów trafień dla ścieżek stabilnych, narzędziowych i obrazowych.

### Oczekiwania live dla OpenAI

- Oczekuj tylko `cacheRead`. `cacheWrite` pozostaje `0`.
- Traktuj ponowne użycie cache przy powtórzonych turach jako plateau specyficzne dla providera, a nie jak antropiczne przesuwające się ponowne użycie pełnej historii.
- Bieżące asercje live używają konserwatywnych kontroli dolnych progów opartych na zaobserwowanym zachowaniu live na `gpt-5.4-mini`:
  - stabilny prefiks: `cacheRead >= 4608`, współczynnik trafień `>= 0.90`
  - transkrypt narzędzi: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`
  - transkrypt obrazów: `cacheRead >= 3840`, współczynnik trafień `>= 0.82`
  - transkrypt w stylu MCP: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`

Świeża połączona weryfikacja live z 2026-04-04 dała:

- stabilny prefiks: `cacheRead=4864`, współczynnik trafień `0.966`
- transkrypt narzędzi: `cacheRead=4608`, współczynnik trafień `0.896`
- transkrypt obrazów: `cacheRead=4864`, współczynnik trafień `0.954`
- transkrypt w stylu MCP: `cacheRead=4608`, współczynnik trafień `0.891`

Ostatni lokalny czas ścienny dla połączonej bramki wyniósł około `88s`.

Dlaczego asercje się różnią:

- Anthropic udostępnia jawne punkty graniczne cache i przesuwające się ponowne użycie historii rozmowy.
- Cache promptów OpenAI nadal jest wrażliwy na dokładny prefiks, ale efektywny prefiks możliwy do ponownego użycia w aktywnym ruchu Responses może osiągać plateau wcześniej niż pełny prompt.
- Z tego powodu porównywanie Anthropic i OpenAI jednym wspólnym progiem procentowym między providerami prowadzi do fałszywych regresji.

### Konfiguracja `diagnostics.cacheTrace`

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

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Przełączniki env (jednorazowe debugowanie)

- `OPENCLAW_CACHE_TRACE=1` włącza śledzenie cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` nadpisuje ścieżkę wyjściową.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` przełącza przechwytywanie pełnego payloadu wiadomości.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` przełącza przechwytywanie tekstu promptu.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` przełącza przechwytywanie promptu systemowego.

### Co sprawdzać

- Zdarzenia śledzenia cache mają format JSONL i zawierają etapowe migawki, takie jak `session:loaded`, `prompt:before`, `stream:context` i `session:after`.
- Wpływ tokenów cache per turn jest widoczny na zwykłych powierzchniach użycia przez `cacheRead` i `cacheWrite` (na przykład `/usage full` i podsumowania użycia sesji).
- Dla Anthropic oczekuj zarówno `cacheRead`, jak i `cacheWrite`, gdy cache jest aktywne.
- Dla OpenAI oczekuj `cacheRead` przy trafieniach cache, a `cacheWrite` powinno pozostać `0`; OpenAI nie publikuje osobnego pola tokenów zapisu do cache.
- Jeśli potrzebujesz śledzenia żądań, loguj identyfikatory żądań i nagłówki limitów osobno od metryk cache. Bieżące dane wyjściowe śledzenia cache w OpenClaw koncentrują się na kształcie promptu/sesji i znormalizowanym użyciu tokenów, a nie na surowych nagłówkach odpowiedzi providerów.

## Szybkie rozwiązywanie problemów

- Wysokie `cacheWrite` przy większości tur: sprawdź zmienne dane wejściowe promptu systemowego i potwierdź, że model/provider obsługuje Twoje ustawienia cache.
- Wysokie `cacheWrite` dla Anthropic: często oznacza, że punkt graniczny cache trafia na treść, która zmienia się przy każdym żądaniu.
- Niskie `cacheRead` dla OpenAI: sprawdź, czy stabilny prefiks znajduje się na początku, powtarzany prefiks ma co najmniej 1024 tokeny, i czy dla tur, które mają współdzielić cache, ponownie używany jest ten sam `prompt_cache_key`.
- Brak efektu z `cacheRetention`: potwierdź, że klucz modelu odpowiada `agents.defaults.models["provider/model"]`.
- Żądania Bedrock Nova/Mistral z ustawieniami cache: oczekiwane wymuszenie runtime do `none`.

Powiązana dokumentacja:

- [Anthropic](/providers/anthropic)
- [Użycie tokenów i koszty](/reference/token-use)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Dokumentacja referencyjna konfiguracji Gateway](/pl/gateway/configuration-reference)
