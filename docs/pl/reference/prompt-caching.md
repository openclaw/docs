---
read_when:
    - Chcesz obniżyć koszty tokenów promptu dzięki zachowaniu pamięci podręcznej
    - Potrzebujesz działania pamięci podręcznej osobno dla każdego agenta w konfiguracjach wieloagentowych
    - Dostrajasz Heartbeat i przycinanie cache-ttl razem
summary: Pokrętła buforowania promptów, kolejność scalania, zachowanie dostawcy i wzorce strojenia
title: Buforowanie promptów
x-i18n:
    generated_at: "2026-06-27T18:18:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

Buforowanie promptów oznacza, że dostawca modelu może ponownie używać niezmienionych prefiksów promptu (zwykle instrukcji systemowych/deweloperskich i innego stabilnego kontekstu) między turami, zamiast przetwarzać je za każdym razem od nowa. OpenClaw normalizuje użycie dostawcy do `cacheRead` i `cacheWrite`, gdy upstream API udostępnia te liczniki bezpośrednio.

Powierzchnie statusu mogą także odtworzyć liczniki pamięci podręcznej z najnowszego
logu użycia w transkrypcie, gdy brakuje ich w migawce sesji na żywo, dzięki czemu `/status` może nadal
pokazywać wiersz pamięci podręcznej po częściowej utracie metadanych sesji. Istniejące niezerowe wartości pamięci podręcznej na żywo
nadal mają pierwszeństwo przed wartościami awaryjnymi z transkryptu.

Dlaczego to ma znaczenie: niższy koszt tokenów, szybsze odpowiedzi i bardziej przewidywalna wydajność w długotrwałych sesjach. Bez buforowania powtarzane prompty ponoszą pełny koszt promptu przy każdej turze, nawet gdy większość wejścia się nie zmieniła.

Poniższe sekcje opisują wszystkie pokrętła związane z pamięcią podręczną, które wpływają na ponowne użycie promptu i koszt tokenów.

Referencje dostawców:

- Buforowanie promptów Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Buforowanie promptów OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Nagłówki API OpenAI i identyfikatory żądań: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Identyfikatory żądań i błędy Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Główne pokrętła

### `cacheRetention` (globalna wartość domyślna, model i per agent)

Ustaw retencję pamięci podręcznej jako globalną wartość domyślną dla wszystkich modeli:

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

1. `agents.defaults.params` (globalna wartość domyślna — stosowana do wszystkich modeli)
2. `agents.defaults.models["provider/model"].params` (nadpisanie per model)
3. `agents.list[].params` (pasujący identyfikator agenta; nadpisuje według klucza)

### `contextPruning.mode: "cache-ttl"`

Przycina stary kontekst wyników narzędzi po oknach TTL pamięci podręcznej, aby żądania po bezczynności nie buforowały ponownie zbyt dużej historii.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Pełny opis zachowania znajdziesz w [Przycinaniu sesji](/pl/concepts/session-pruning).

### Utrzymywanie ciepła przez Heartbeat

Heartbeat może utrzymywać okna pamięci podręcznej w stanie rozgrzanym i ograniczać powtarzane zapisy do pamięci podręcznej po okresach bezczynności.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agent jest obsługiwany w `agents.list[].heartbeat`.

## Zachowanie dostawców

### Anthropic (bezpośrednie API)

- `cacheRetention` jest obsługiwane.
- W przypadku profili uwierzytelniania kluczem API Anthropic OpenClaw ustawia początkowo `cacheRetention: "short"` dla referencji modeli Anthropic, gdy wartość nie jest ustawiona.
- Natywne odpowiedzi Messages Anthropic udostępniają zarówno `cache_read_input_tokens`, jak i `cache_creation_input_tokens`, więc OpenClaw może pokazywać zarówno `cacheRead`, jak i `cacheWrite`.
- Dla natywnych żądań Anthropic `cacheRetention: "short"` mapuje się na domyślną 5-minutową efemeryczną pamięć podręczną, a `cacheRetention: "long"` przełącza na 1-godzinny TTL tylko na bezpośrednich hostach `api.anthropic.com`.

### OpenAI (bezpośrednie API)

- Buforowanie promptów jest automatyczne w obsługiwanych nowszych modelach. OpenClaw nie musi wstrzykiwać znaczników pamięci podręcznej na poziomie bloków.
- OpenClaw używa `prompt_cache_key`, aby utrzymać stabilne routowanie pamięci podręcznej między turami. Bezpośrednie hosty OpenAI używają `prompt_cache_retention: "24h"`, gdy wybrano `cacheRetention: "long"`.
- Dostawcy Completions zgodni z OpenAI otrzymują `prompt_cache_key` tylko wtedy, gdy ich konfiguracja modelu jawnie ustawia `compat.supportsPromptCacheKey: true`. Przekazywanie długiej retencji jest osobną możliwością: jawne `cacheRetention: "long"` wysyła `prompt_cache_retention: "24h"` tylko wtedy, gdy ten wpis zgodności obsługuje także długą retencję pamięci podręcznej. Dostawcy tacy jak Mistral mogą włączyć klucze pamięci podręcznej, ustawiając jednocześnie `compat.supportsLongCacheRetention: false`, aby pominąć pole długiej retencji. `cacheRetention: "none"` pomija oba pola.
- Odpowiedzi OpenAI udostępniają zbuforowane tokeny promptu przez `usage.prompt_tokens_details.cached_tokens` (lub `input_tokens_details.cached_tokens` w zdarzeniach Responses API). OpenClaw mapuje to na `cacheRead`.
- OpenAI nie udostępnia osobnego licznika tokenów zapisu do pamięci podręcznej, więc `cacheWrite` pozostaje `0` na ścieżkach OpenAI, nawet gdy dostawca rozgrzewa pamięć podręczną.
- OpenAI zwraca przydatne nagłówki śledzenia i limitów szybkości, takie jak `x-request-id`, `openai-processing-ms` i `x-ratelimit-*`, ale rozliczanie trafień w pamięć podręczną powinno pochodzić z ładunku użycia, nie z nagłówków.
- W praktyce OpenAI często zachowuje się jak pamięć podręczna początkowego prefiksu, a nie jak ponowne użycie ruchomej pełnej historii w stylu Anthropic. Stabilne tury tekstu z długim prefiksem mogą w bieżących sondach na żywo osiągać plateau blisko `4864` zbuforowanych tokenów, podczas gdy transkrypty intensywnie używające narzędzi lub w stylu MCP często zatrzymują się blisko `4608` zbuforowanych tokenów nawet przy dokładnych powtórzeniach.

### Anthropic Vertex

- Modele Anthropic w Vertex AI (`anthropic-vertex/*`) obsługują `cacheRetention` tak samo jak bezpośredni Anthropic.
- `cacheRetention: "long"` mapuje się na rzeczywisty 1-godzinny TTL pamięci podręcznej promptów na endpointach Vertex AI.
- Domyślna retencja pamięci podręcznej dla `anthropic-vertex` odpowiada domyślnym ustawieniom bezpośredniego Anthropic.
- Żądania Vertex są routowane przez kształtowanie pamięci podręcznej świadome granic, aby ponowne użycie pamięci podręcznej pozostawało zgodne z tym, co dostawcy faktycznie otrzymują.

### Amazon Bedrock

- Referencje modeli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) obsługują jawne przekazywanie `cacheRetention`.
- Modele Bedrock inne niż Anthropic są w czasie działania wymuszane do `cacheRetention: "none"`.

### Modele OpenRouter

Dla referencji modeli `openrouter/anthropic/*` OpenClaw wstrzykuje Anthropic
`cache_control` w blokach promptu systemowego/deweloperskiego, aby poprawić ponowne użycie
pamięci podręcznej promptów tylko wtedy, gdy żądanie nadal trafia do zweryfikowanej trasy OpenRouter
(`openrouter` na domyślnym endpoincie albo dowolny dostawca/bazowy URL rozwiązywany
do `openrouter.ai`).

Dla referencji modeli `openrouter/deepseek/*`, `openrouter/moonshot*/*` i `openrouter/zai/*`
dozwolone jest `contextPruning.mode: "cache-ttl"`, ponieważ OpenRouter
automatycznie obsługuje buforowanie promptów po stronie dostawcy. OpenClaw nie wstrzykuje
znaczników Anthropic `cache_control` do tych żądań.

Budowanie pamięci podręcznej DeepSeek działa na zasadzie najlepszej próby i może potrwać kilka sekund. Natychmiastowe
kolejne żądanie może nadal pokazywać `cached_tokens: 0`; zweryfikuj to powtórzonym
żądaniem z tym samym prefiksem po krótkim opóźnieniu i użyj `usage.prompt_tokens_details.cached_tokens`
jako sygnału trafienia w pamięć podręczną.

Jeśli przestawisz model na dowolny adres URL proxy zgodny z OpenAI, OpenClaw
przestaje wstrzykiwać te specyficzne dla OpenRouter znaczniki pamięci podręcznej Anthropic.

### Inni dostawcy

Jeśli dostawca nie obsługuje tego trybu pamięci podręcznej, `cacheRetention` nie ma efektu.

### Bezpośrednie API Google Gemini

- Bezpośredni transport Gemini (`api: "google-generative-ai"`) raportuje trafienia pamięci podręcznej
  przez upstream `cachedContentTokenCount`; OpenClaw mapuje to na `cacheRead`.
- Gdy `cacheRetention` jest ustawione na bezpośrednim modelu Gemini, OpenClaw automatycznie
  tworzy, ponownie używa i odświeża zasoby `cachedContents` dla promptów systemowych
  w uruchomieniach Google AI Studio. Oznacza to, że nie trzeba już ręcznie tworzyć wcześniej
  uchwytu cached-content.
- Nadal możesz przekazać istniejący uchwyt cached-content Gemini jako
  `params.cachedContent` (lub starsze `params.cached_content`) w skonfigurowanym
  modelu.
- To jest osobne od buforowania prefiksów promptów Anthropic/OpenAI. Dla Gemini
  OpenClaw zarządza natywnym dla dostawcy zasobem `cachedContents`, zamiast
  wstrzykiwać znaczniki pamięci podręcznej do żądania.

### Użycie Gemini CLI

- Wyjście Gemini CLI `stream-json` może pokazywać trafienia pamięci podręcznej przez `stats.cached`;
  OpenClaw mapuje to na `cacheRead`. Starsze nadpisania `--output-format json` używają
  tej samej normalizacji użycia.
- Jeśli CLI pomija bezpośrednią wartość `stats.input`, OpenClaw wyprowadza tokeny wejściowe
  z `stats.input_tokens - stats.cached`.
- To jest wyłącznie normalizacja użycia. Nie oznacza to, że OpenClaw tworzy
  znaczniki pamięci podręcznej promptów w stylu Anthropic/OpenAI dla Gemini CLI.

## Granica pamięci podręcznej promptu systemowego

OpenClaw dzieli prompt systemowy na **stabilny prefiks** i **zmienny
sufiks**, rozdzielone wewnętrzną granicą prefiksu pamięci podręcznej. Treść powyżej
granicy (definicje narzędzi, metadane Skills, pliki obszaru roboczego i inny
względnie statyczny kontekst) jest porządkowana tak, aby pozostawała bajtowo identyczna między turami.
Treść poniżej granicy (na przykład `HEARTBEAT.md`, znaczniki czasu środowiska uruchomieniowego i
inne metadane per tura) może się zmieniać bez unieważniania zbuforowanego
prefiksu.

Kluczowe decyzje projektowe:

- Stabilne pliki kontekstu projektu w obszarze roboczym są porządkowane przed `HEARTBEAT.md`, aby
  zmiany Heartbeat nie psuły stabilnego prefiksu.
- Granica jest stosowana w kształtowaniu transportu dla rodzin Anthropic, rodzin OpenAI, Google i
  CLI, dzięki czemu wszyscy obsługiwani dostawcy korzystają z tej samej stabilności prefiksu.
- Żądania Codex Responses i Anthropic Vertex są routowane przez
  kształtowanie pamięci podręcznej świadome granic, aby ponowne użycie pamięci podręcznej pozostawało zgodne z tym, co dostawcy
  faktycznie otrzymują.
- Odciski palca promptu systemowego są normalizowane (białe znaki, zakończenia linii,
  kontekst dodany przez hooki, kolejność możliwości środowiska uruchomieniowego), aby semantycznie niezmienione
  prompty współdzieliły KV/pamięć podręczną między turami.

Jeśli widzisz nieoczekiwane skoki `cacheWrite` po zmianie konfiguracji lub obszaru roboczego,
sprawdź, czy zmiana trafia powyżej czy poniżej granicy pamięci podręcznej. Przeniesienie
zmiennej treści poniżej granicy (albo jej ustabilizowanie) często rozwiązuje
problem.

## Strażnicy stabilności pamięci podręcznej OpenClaw

OpenClaw utrzymuje także kilka kształtów ładunków wrażliwych na pamięć podręczną w sposób deterministyczny, zanim
żądanie dotrze do dostawcy:

- Katalogi narzędzi MCP z pakietów są sortowane deterministycznie przed
  rejestracją narzędzi, więc zmiany kolejności `listTools()` nie powodują zmian bloku narzędzi i
  nie psują prefiksów pamięci podręcznej promptów.
- Starsze sesje z utrwalonymi blokami obrazów zachowują **3 najnowsze
  ukończone tury** w stanie nienaruszonym; starsze, już przetworzone bloki obrazów mogą zostać
  zastąpione znacznikiem, aby kolejne żądania z dużą liczbą obrazów nie wysyłały ponownie dużych,
  przestarzałych ładunków.

## Wzorce dostrajania

### Mieszany ruch (zalecana wartość domyślna)

Utrzymuj długotrwałą bazę na głównym agencie, wyłącz buforowanie na agentach powiadamiających o skokowym ruchu:

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
- Utrzymuj Heartbeat poniżej TTL tylko dla agentów, które korzystają z rozgrzanych pamięci podręcznych.

## Diagnostyka pamięci podręcznej

OpenClaw udostępnia dedykowaną diagnostykę śledzenia pamięci podręcznej dla osadzonych uruchomień agentów.

W przypadku zwykłej diagnostyki widocznej dla użytkownika `/status` i inne podsumowania użycia mogą używać
najnowszego wpisu użycia w transkrypcie jako źródła awaryjnego dla `cacheRead` /
`cacheWrite`, gdy wpis sesji na żywo nie ma tych liczników.

## Testy regresji na żywo

OpenClaw utrzymuje jedną łączoną bramkę regresji pamięci podręcznej na żywo dla powtarzanych prefiksów, tur narzędzi, tur obrazów, transkryptów narzędzi w stylu MCP i kontrolnego przypadku Anthropic bez pamięci podręcznej.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Uruchom wąską bramkę na żywo poleceniem:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Plik bazowy przechowuje najnowsze zaobserwowane liczby na żywo oraz specyficzne dla dostawcy progi regresji używane przez test.
Runner używa także świeżych identyfikatorów sesji i przestrzeni nazw promptów per uruchomienie, aby wcześniejszy stan pamięci podręcznej nie zanieczyszczał bieżącej próbki regresji.

Te testy celowo nie używają identycznych kryteriów sukcesu dla różnych dostawców.

### Oczekiwania live dla Anthropic

- Oczekuj jawnych zapisów rozgrzewających przez `cacheWrite`.
- Oczekuj niemal pełnego ponownego użycia historii przy powtarzanych turach, ponieważ kontrola pamięci podręcznej Anthropic przesuwa punkt graniczny pamięci podręcznej przez rozmowę.
- Obecne asercje live nadal używają wysokich progów współczynnika trafień dla ścieżek stabilnych, narzędziowych i obrazów.

### Oczekiwania live dla OpenAI

- Oczekuj tylko `cacheRead`. `cacheWrite` pozostaje `0`.
- Traktuj ponowne użycie pamięci podręcznej przy powtarzanych turach jako plateau specyficzne dla dostawcy, a nie jako ponowne użycie pełnej historii w ruchomym stylu Anthropic.
- Obecne asercje live używają konserwatywnych dolnych progów wyprowadzonych z zaobserwowanego zachowania live na `gpt-5.4-mini`:
  - stabilny prefiks: `cacheRead >= 4608`, współczynnik trafień `>= 0.90`
  - transkrypt narzędzia: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`
  - transkrypt obrazu: `cacheRead >= 3840`, współczynnik trafień `>= 0.82`
  - transkrypt w stylu MCP: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`

Świeża łączona weryfikacja live z 2026-04-04 zakończyła się wynikami:

- stabilny prefiks: `cacheRead=4864`, współczynnik trafień `0.966`
- transkrypt narzędzia: `cacheRead=4608`, współczynnik trafień `0.896`
- transkrypt obrazu: `cacheRead=4864`, współczynnik trafień `0.954`
- transkrypt w stylu MCP: `cacheRead=4608`, współczynnik trafień `0.891`

Ostatni lokalny czas zegarowy dla łącznej bramki wynosił około `88s`.

Dlaczego asercje się różnią:

- Anthropic udostępnia jawne punkty graniczne pamięci podręcznej i ruchome ponowne użycie historii rozmowy.
- Pamięć podręczna promptów OpenAI nadal jest wrażliwa na dokładny prefiks, ale efektywny prefiks możliwy do ponownego użycia w ruchu live Responses może osiągnąć plateau wcześniej niż pełny prompt.
- Z tego powodu porównywanie Anthropic i OpenAI za pomocą jednego procentowego progu między dostawcami tworzy fałszywe regresje.

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

### Przełączniki środowiskowe (jednorazowe debugowanie)

- `OPENCLAW_CACHE_TRACE=1` włącza śledzenie pamięci podręcznej.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` nadpisuje ścieżkę wyjściową.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` przełącza przechwytywanie pełnego ładunku wiadomości.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` przełącza przechwytywanie tekstu promptu.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` przełącza przechwytywanie promptu systemowego.

### Co sprawdzać

- Zdarzenia śledzenia pamięci podręcznej są w formacie JSONL i zawierają etapowe migawki, takie jak `session:loaded`, `prompt:before`, `stream:context` i `session:after`.
- Wpływ tokenów pamięci podręcznej na turę jest widoczny w normalnych powierzchniach użycia przez `cacheRead` i `cacheWrite` (na przykład `/usage full` oraz podsumowaniach użycia sesji).
- Dla Anthropic oczekuj zarówno `cacheRead`, jak i `cacheWrite`, gdy pamięć podręczna jest aktywna.
- Dla OpenAI oczekuj `cacheRead` przy trafieniach w pamięć podręczną, a `cacheWrite` powinno pozostać `0`; OpenAI nie publikuje osobnego pola tokenów zapisu do pamięci podręcznej.
- Jeśli potrzebujesz śledzenia żądań, loguj identyfikatory żądań i nagłówki limitów szybkości oddzielnie od metryk pamięci podręcznej. Obecne wyjście śledzenia pamięci podręcznej OpenClaw skupia się na kształcie promptu/sesji i znormalizowanym użyciu tokenów, a nie na surowych nagłówkach odpowiedzi dostawcy.

## Szybkie rozwiązywanie problemów

- Wysokie `cacheWrite` w większości tur: sprawdź zmienne dane wejściowe promptu systemowego i zweryfikuj, czy model/dostawca obsługuje twoje ustawienia pamięci podręcznej.
- Wysokie `cacheWrite` w Anthropic: często oznacza, że punkt graniczny pamięci podręcznej trafia na treść, która zmienia się przy każdym żądaniu.
- Niskie `cacheRead` OpenAI: zweryfikuj, że stabilny prefiks jest na początku, powtarzany prefiks ma co najmniej 1024 tokeny, a ten sam `prompt_cache_key` jest ponownie używany dla tur, które powinny współdzielić pamięć podręczną.
- Brak efektu `cacheRetention`: potwierdź, że klucz modelu pasuje do `agents.defaults.models["provider/model"]`.
- Żądania Bedrock Nova/Mistral z ustawieniami pamięci podręcznej: oczekiwane wymuszenie runtime na `none`.

Powiązana dokumentacja:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration-reference)

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
