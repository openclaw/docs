---
read_when:
    - Chcesz obniżyć koszty tokenów promptów dzięki utrzymaniu pamięci podręcznej
    - Potrzebujesz pamięci podręcznej działającej osobno dla każdego agenta w konfiguracjach wieloagentowych
    - Dostrajasz jednocześnie Heartbeat i przycinanie cache-ttl
summary: Pokrętła cache’owania promptów, kolejność scalania, zachowanie providerów i wzorce strojenia
title: Buforowanie promptów
x-i18n:
    generated_at: "2026-07-01T20:38:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

Buforowanie promptów oznacza, że dostawca modelu może ponownie używać niezmienionych prefiksów promptu (zwykle instrukcji systemowych/deweloperskich i innego stabilnego kontekstu) między turami, zamiast przetwarzać je za każdym razem od nowa. OpenClaw normalizuje użycie dostawcy do `cacheRead` i `cacheWrite`, gdy nadrzędne API bezpośrednio udostępnia te liczniki.

Powierzchnie statusu mogą też odzyskać liczniki cache z najnowszego logu użycia
transkrypcji, gdy brakuje ich w migawce sesji na żywo, dzięki czemu `/status` może nadal
pokazywać wiersz cache po częściowej utracie metadanych sesji. Istniejące niezerowe wartości
cache z sesji na żywo nadal mają pierwszeństwo przed wartościami zapasowymi z transkrypcji.

Dlaczego to ważne: niższy koszt tokenów, szybsze odpowiedzi i bardziej przewidywalna wydajność w długotrwałych sesjach. Bez buforowania powtarzane prompty płacą pełny koszt promptu w każdej turze, nawet gdy większość wejścia się nie zmieniła.

Poniższe sekcje omawiają każde pokrętło związane z cache, które wpływa na ponowne użycie promptu i koszt tokenów.

Referencje dostawców:

- Buforowanie promptów Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Buforowanie promptów OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Nagłówki API OpenAI i identyfikatory żądań: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Identyfikatory żądań i błędy Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Główne pokrętła

### `cacheRetention` (globalna wartość domyślna, model i ustawienie per agent)

Ustaw retencję cache jako globalną wartość domyślną dla wszystkich modeli:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Nadpisz per model:

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
3. `agents.list[].params` (pasujący identyfikator agenta; nadpisuje według klucza)

### `contextPruning.mode: "cache-ttl"`

Przycina stary kontekst wyników narzędzi po oknach TTL cache, aby żądania po bezczynności nie buforowały ponownie nadmiernie dużej historii.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Pełne zachowanie opisuje [Przycinanie sesji](/pl/concepts/session-pruning).

### Utrzymywanie cache w cieple przez Heartbeat

Heartbeat może utrzymywać okna cache w cieple i ograniczać powtarzane zapisy cache po okresach bezczynności.

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
- Przy profilach uwierzytelniania Anthropic z kluczem API OpenClaw ustawia początkowo `cacheRetention: "short"` dla referencji modeli Anthropic, gdy ta wartość nie jest ustawiona.
- Natywne odpowiedzi Messages Anthropic udostępniają zarówno `cache_read_input_tokens`, jak i `cache_creation_input_tokens`, więc OpenClaw może pokazywać zarówno `cacheRead`, jak i `cacheWrite`.
- Dla natywnych żądań Anthropic `cacheRetention: "short"` mapuje się na domyślny 5-minutowy efemeryczny cache, a `cacheRetention: "long"` przełącza na TTL 1 godziny tylko na bezpośrednich hostach `api.anthropic.com`.

### OpenAI (bezpośrednie API)

- Buforowanie promptów jest automatyczne w obsługiwanych najnowszych modelach. OpenClaw nie musi wstrzykiwać znaczników cache na poziomie bloków.
- OpenClaw używa `prompt_cache_key`, aby utrzymać stabilne trasowanie cache między turami. Bezpośrednie hosty OpenAI używają `prompt_cache_retention: "24h"`, gdy wybrane jest `cacheRetention: "long"`.
- Dostawcy Completions zgodni z OpenAI otrzymują `prompt_cache_key` tylko wtedy, gdy ich konfiguracja modelu jawnie ustawia `compat.supportsPromptCacheKey: true`. Przekazywanie długiej retencji jest osobną zdolnością: jawne `cacheRetention: "long"` wysyła `prompt_cache_retention: "24h"` tylko wtedy, gdy ten wpis zgodności obsługuje również długą retencję cache. Dostawcy tacy jak Mistral mogą włączyć klucze cache, ustawiając jednocześnie `compat.supportsLongCacheRetention: false`, aby pominąć pole długiej retencji. `cacheRetention: "none"` pomija oba pola.
- Odpowiedzi OpenAI udostępniają zbuforowane tokeny promptu przez `usage.prompt_tokens_details.cached_tokens` (lub `input_tokens_details.cached_tokens` w zdarzeniach Responses API). OpenClaw mapuje to na `cacheRead`.
- Użycie Responses GPT-5.6 może też udostępniać `input_tokens_details.cache_write_tokens`. OpenClaw mapuje to na `cacheWrite` i wycenia według stawki zapisu cache danego modelu; odpowiedzi, które pomijają to pole, pozostawiają `cacheWrite` na poziomie `0`.
- OpenAI zwraca przydatne nagłówki śledzenia i limitów szybkości, takie jak `x-request-id`, `openai-processing-ms` i `x-ratelimit-*`, ale rozliczanie trafień cache powinno pochodzić z ładunku użycia, a nie z nagłówków.
- W praktyce OpenAI często zachowuje się jak cache początkowego prefiksu, a nie jak ponowne użycie przesuwającej się pełnej historii w stylu Anthropic. Stabilne tury z długim tekstem prefiksowym mogą trafiać w okolice plateau `4864` zbuforowanych tokenów w bieżących sondach na żywo, podczas gdy transkrypcje intensywnie używające narzędzi lub w stylu MCP często osiągają plateau w okolicach `4608` zbuforowanych tokenów nawet przy dokładnych powtórzeniach.

### Anthropic Vertex

- Modele Anthropic w Vertex AI (`anthropic-vertex/*`) obsługują `cacheRetention` tak samo jak bezpośredni Anthropic.
- `cacheRetention: "long"` mapuje się na rzeczywisty 1-godzinny TTL cache promptów w punktach końcowych Vertex AI.
- Domyślna retencja cache dla `anthropic-vertex` odpowiada domyślnym wartościom bezpośredniego Anthropic.
- Żądania Vertex są trasowane przez kształtowanie cache świadome granic, aby ponowne użycie cache pozostało zgodne z tym, co dostawcy faktycznie otrzymują.

### Amazon Bedrock

- Referencje modeli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) obsługują jawne przekazywanie `cacheRetention`.
- Modele Bedrock inne niż Anthropic są w czasie działania wymuszane na `cacheRetention: "none"`.

### Modele OpenRouter

Dla referencji modeli `openrouter/anthropic/*` OpenClaw wstrzykuje Anthropic
`cache_control` w blokach promptu systemowego/deweloperskiego, aby poprawić ponowne użycie
cache promptów tylko wtedy, gdy żądanie nadal kieruje do zweryfikowanej trasy OpenRouter
(`openrouter` na jego domyślnym punkcie końcowym albo dowolny dostawca/bazowy URL, który rozwiązuje się
do `openrouter.ai`).

Dla referencji modeli `openrouter/deepseek/*`, `openrouter/moonshot*/*` i `openrouter/zai/*`
`contextPruning.mode: "cache-ttl"` jest dozwolone, ponieważ OpenRouter
automatycznie obsługuje buforowanie promptów po stronie dostawcy. OpenClaw nie wstrzykuje
znaczników Anthropic `cache_control` do tych żądań.

Budowanie cache DeepSeek odbywa się w trybie najlepszych starań i może potrwać kilka sekund. Natychmiastowe
kolejne żądanie może nadal pokazywać `cached_tokens: 0`; zweryfikuj to powtórzonym
żądaniem z tym samym prefiksem po krótkim opóźnieniu i użyj `usage.prompt_tokens_details.cached_tokens`
jako sygnału trafienia cache.

Jeśli przekierujesz model na dowolny URL proxy zgodny z OpenAI, OpenClaw
przestaje wstrzykiwać te specyficzne dla OpenRouter znaczniki cache Anthropic.

### Inni dostawcy

Jeśli dostawca nie obsługuje tego trybu cache, `cacheRetention` nie ma efektu.

### Bezpośrednie API Google Gemini

- Bezpośredni transport Gemini (`api: "google-generative-ai"`) zgłasza trafienia cache
  przez nadrzędne `cachedContentTokenCount`; OpenClaw mapuje to na `cacheRead`.
- Gdy `cacheRetention` jest ustawione dla bezpośredniego modelu Gemini, OpenClaw automatycznie
  tworzy, ponownie używa i odświeża zasoby `cachedContents` dla promptów systemowych
  w uruchomieniach Google AI Studio. Oznacza to, że nie trzeba już ręcznie tworzyć wcześniej
  uchwytu cached-content.
- Nadal możesz przekazać istniejący uchwyt cached-content Gemini jako
  `params.cachedContent` (lub starsze `params.cached_content`) w skonfigurowanym
  modelu.
- Jest to osobne od buforowania prefiksów promptów Anthropic/OpenAI. Dla Gemini
  OpenClaw zarządza natywnym dla dostawcy zasobem `cachedContents`, zamiast
  wstrzykiwać znaczniki cache do żądania.

### Użycie Gemini CLI

- Wyjście Gemini CLI `stream-json` może ujawniać trafienia cache przez `stats.cached`;
  OpenClaw mapuje to na `cacheRead`. Starsze nadpisania `--output-format json` używają
  tej samej normalizacji użycia.
- Jeśli CLI pomija bezpośrednią wartość `stats.input`, OpenClaw wyprowadza tokeny wejściowe
  z `stats.input_tokens - stats.cached`.
- To wyłącznie normalizacja użycia. Nie oznacza, że OpenClaw tworzy
  znaczniki cache promptów w stylu Anthropic/OpenAI dla Gemini CLI.

## Granica cache promptu systemowego

OpenClaw dzieli prompt systemowy na **stabilny prefiks** i **zmienny
sufiks**, rozdzielone wewnętrzną granicą prefiksu cache. Treść powyżej
granicy (definicje narzędzi, metadane Skills, pliki obszaru roboczego i inny
stosunkowo statyczny kontekst) jest porządkowana tak, aby pozostawała identyczna bajtowo między turami.
Treść poniżej granicy (na przykład `HEARTBEAT.md`, znaczniki czasu środowiska uruchomieniowego i
inne metadane per tura) może się zmieniać bez unieważniania zbuforowanego
prefiksu.

Kluczowe decyzje projektowe:

- Stabilne pliki kontekstu projektu w obszarze roboczym są porządkowane przed `HEARTBEAT.md`, aby
  zmienność heartbeat nie psuła stabilnego prefiksu.
- Granica jest stosowana w kształtowaniu transportu rodzin Anthropic, OpenAI, Google i
  CLI, więc wszyscy obsługiwani dostawcy korzystają z tej samej stabilności prefiksu.
- Żądania Codex Responses i Anthropic Vertex są trasowane przez
  kształtowanie cache świadome granic, aby ponowne użycie cache pozostało zgodne z tym, co dostawcy
  faktycznie otrzymują.
- Odciski palca promptu systemowego są normalizowane (białe znaki, zakończenia linii,
  kontekst dodany przez hooki, kolejność zdolności środowiska uruchomieniowego), aby semantycznie niezmienione
  prompty współdzieliły KV/cache między turami.

Jeśli widzisz nieoczekiwane skoki `cacheWrite` po zmianie konfiguracji lub obszaru roboczego,
sprawdź, czy zmiana trafia powyżej czy poniżej granicy cache. Przeniesienie
zmiennej treści poniżej granicy (lub jej ustabilizowanie) często rozwiązuje
problem.

## Osłony stabilności cache OpenClaw

OpenClaw utrzymuje też deterministyczny kształt kilku wrażliwych na cache ładunków, zanim
żądanie dotrze do dostawcy:

- Katalogi narzędzi Bundle MCP są sortowane deterministycznie przed
  rejestracją narzędzi, więc zmiany kolejności `listTools()` nie zmieniają bloku narzędzi i
  nie psują prefiksów cache promptów.
- Starsze sesje z utrwalonymi blokami obrazów zachowują nienaruszone **3 najnowsze
  ukończone tury**; starsze, już przetworzone bloki obrazów mogą zostać
  zastąpione znacznikiem, aby kontynuacje z dużą liczbą obrazów nie wysyłały ponownie dużych,
  nieaktualnych ładunków.

## Wzorce strojenia

### Ruch mieszany (zalecana wartość domyślna)

Utrzymuj długotrwałą bazę na głównym agencie, wyłącz buforowanie na agentach powiadomień obsługujących skoki ruchu:

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
- Utrzymuj heartbeat poniżej swojego TTL tylko dla agentów, którzy korzystają z ciepłych cache.

## Diagnostyka cache

OpenClaw udostępnia dedykowaną diagnostykę śledzenia cache dla osadzonych uruchomień agentów.

W normalnej diagnostyce widocznej dla użytkownika `/status` i inne podsumowania użycia mogą używać
najnowszego wpisu użycia transkrypcji jako źródła zapasowego dla `cacheRead` /
`cacheWrite`, gdy wpis sesji na żywo nie ma tych liczników.

## Testy regresji na żywo

OpenClaw utrzymuje jedną połączoną bramkę regresji cache na żywo dla powtarzanych prefiksów, tur narzędzi, tur obrazów, transkrypcji narzędzi w stylu MCP i kontrolnego przypadku Anthropic bez cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Uruchom wąską bramkę na żywo poleceniem:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Plik bazowy przechowuje najnowsze zaobserwowane liczby live oraz specyficzne dla dostawcy dolne progi regresji używane przez test.
Runner używa też świeżych identyfikatorów sesji i przestrzeni nazw promptów dla każdego uruchomienia, aby poprzedni stan cache nie zanieczyszczał bieżącej próbki regresji.

Te testy celowo nie używają identycznych kryteriów powodzenia dla wszystkich dostawców.

### Oczekiwania live dla Anthropic

- Oczekuj jawnych zapisów rozgrzewających przez `cacheWrite`.
- Oczekuj niemal pełnego ponownego użycia historii przy powtarzanych turach, ponieważ kontrola cache Anthropic przesuwa punkt graniczny cache przez rozmowę.
- Bieżące asercje live nadal używają wysokich progów trafień dla ścieżek stabilnych, narzędziowych i obrazowych.

### Oczekiwania live dla OpenAI

- Oczekuj tylko `cacheRead`. `cacheWrite` pozostaje `0`.
- Traktuj ponowne użycie cache w powtarzanych turach jako specyficzne dla dostawcy plateau, a nie jako ponowne użycie ruchomej pełnej historii w stylu Anthropic.
- Bieżące asercje live używają konserwatywnych kontroli dolnych progów wyprowadzonych z zaobserwowanego zachowania live na `gpt-5.4-mini`:
  - stabilny prefiks: `cacheRead >= 4608`, współczynnik trafień `>= 0.90`
  - transkrypcja narzędziowa: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`
  - transkrypcja obrazowa: `cacheRead >= 3840`, współczynnik trafień `>= 0.82`
  - transkrypcja w stylu MCP: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`

Świeża połączona weryfikacja live z 2026-04-04 zakończyła się na poziomie:

- stabilny prefiks: `cacheRead=4864`, współczynnik trafień `0.966`
- transkrypcja narzędziowa: `cacheRead=4608`, współczynnik trafień `0.896`
- transkrypcja obrazowa: `cacheRead=4864`, współczynnik trafień `0.954`
- transkrypcja w stylu MCP: `cacheRead=4608`, współczynnik trafień `0.891`

Ostatni lokalny czas zegarowy dla połączonej bramki wynosił około `88s`.

Dlaczego asercje się różnią:

- Anthropic udostępnia jawne punkty graniczne cache i ruchome ponowne użycie historii rozmowy.
- Buforowanie promptów OpenAI nadal jest wrażliwe na dokładny prefiks, ale efektywny prefiks możliwy do ponownego użycia w ruchu live Responses może osiągnąć plateau wcześniej niż pełny prompt.
- Z tego powodu porównywanie Anthropic i OpenAI przy użyciu jednego procentowego progu między dostawcami tworzy fałszywe regresje.

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

- `OPENCLAW_CACHE_TRACE=1` włącza śledzenie cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` nadpisuje ścieżkę wyjściową.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` przełącza przechwytywanie pełnego ładunku wiadomości.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` przełącza przechwytywanie tekstu promptu.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` przełącza przechwytywanie promptu systemowego.

### Co sprawdzać

- Zdarzenia śledzenia cache są w formacie JSONL i obejmują przygotowane migawki, takie jak `session:loaded`, `prompt:before`, `stream:context` i `session:after`.
- Wpływ tokenów cache w każdej turze jest widoczny w normalnych powierzchniach użycia przez `cacheRead` i `cacheWrite` (na przykład `/usage tokens`, `/status`, podsumowania użycia sesji oraz niestandardowe układy `messages.usageTemplate`).
- Dla Anthropic oczekuj zarówno `cacheRead`, jak i `cacheWrite`, gdy cache jest aktywny.
- Dla OpenAI oczekuj `cacheRead` przy trafieniach cache. GPT-5.6 Responses może też raportować `cacheWrite` podczas zapisywania segmentów promptu; inne ładunki Responses, które pomijają licznik zapisu, utrzymują go na poziomie `0`.
- Jeśli potrzebujesz śledzenia żądań, loguj identyfikatory żądań i nagłówki limitów szybkości oddzielnie od metryk cache. Bieżące wyjście śledzenia cache OpenClaw skupia się na kształcie promptu/sesji i znormalizowanym użyciu tokenów, a nie na surowych nagłówkach odpowiedzi dostawcy.

## Szybkie rozwiązywanie problemów

- Wysokie `cacheWrite` w większości tur: sprawdź niestabilne wejścia promptu systemowego i zweryfikuj, czy model/dostawca obsługuje Twoje ustawienia cache.
- Wysokie `cacheWrite` w Anthropic: często oznacza, że punkt graniczny cache trafia na treść, która zmienia się przy każdym żądaniu.
- Niskie `cacheRead` w OpenAI: zweryfikuj, czy stabilny prefiks jest na początku, powtarzany prefiks ma co najmniej 1024 tokeny i ten sam `prompt_cache_key` jest ponownie używany w turach, które powinny współdzielić cache.
- Brak efektu z `cacheRetention`: potwierdź, że klucz modelu pasuje do `agents.defaults.models["provider/model"]`.
- Żądania Bedrock Nova/Mistral z ustawieniami cache: oczekiwane wymuszenie runtime do `none`.

Powiązane dokumenty:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration-reference)

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
