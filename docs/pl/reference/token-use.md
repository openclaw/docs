---
read_when:
    - Wyjaśnianie użycia tokenów, kosztów lub okien kontekstu
    - Debugowanie wzrostu kontekstu lub zachowania kompakcji
summary: Jak OpenClaw buduje kontekst promptu oraz raportuje użycie tokenów i koszty
title: Użycie tokenów i koszty
x-i18n:
    generated_at: "2026-04-07T09:50:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0683693d6c6fcde7d5fba236064ba97dd4b317ae6bea3069db969fcd178119d9
    source_path: reference/token-use.md
    workflow: 15
---

# Użycie tokenów i koszty

OpenClaw śledzi **tokeny**, a nie znaki. Tokeny są zależne od modelu, ale większość
modeli w stylu OpenAI ma średnio około 4 znaków na token dla tekstu angielskiego.

## Jak budowany jest prompt systemowy

OpenClaw składa własny prompt systemowy przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi + krótkie opisy
- Listę Skills (tylko metadane; instrukcje są ładowane na żądanie przez `read`)
- Instrukcje samodzielnej aktualizacji
- Pliki workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, gdy są nowe, oraz `MEMORY.md`, gdy istnieje, lub `memory.md` jako fallback w małych literach). Duże pliki są obcinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 20000), a całkowity zastrzyk bootstrap jest ograniczony przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 150000). Pliki `memory/*.md` są ładowane na żądanie przez narzędzia pamięci i nie są wstrzykiwane automatycznie.
- Czas (UTC + strefa czasowa użytkownika)
- Tagi odpowiedzi + zachowanie heartbeat
- Metadane środowiska wykonawczego (host/OS/model/thinking)

Pełny podział znajdziesz w [System Prompt](/pl/concepts/system-prompt).

## Co liczy się do okna kontekstu

Wszystko, co otrzymuje model, liczy się do limitu kontekstu:

- Prompt systemowy (wszystkie sekcje wymienione powyżej)
- Historia rozmowy (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypcje (obrazy, audio, pliki)
- Podsumowania kompakcji i artefakty przycinania
- Wrappery dostawców lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

Dla obrazów OpenClaw skaluje w dół payloady obrazów z transkryptów/narzędzi przed wywołaniami dostawców.
Aby to dostroić, użyj `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`):

- Niższe wartości zwykle zmniejszają zużycie tokenów vision i rozmiar payloadu.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla OCR/zrzutów ekranu interfejsu.

Aby zobaczyć praktyczny podział (dla każdego wstrzykniętego pliku, narzędzi, Skills i rozmiaru promptu systemowego), użyj `/context list` lub `/context detail`. Zobacz [Context](/pl/concepts/context).

## Jak sprawdzić bieżące użycie tokenów

Użyj tych poleceń na czacie:

- `/status` → **karta statusu bogata w emoji** z modelem sesji, użyciem kontekstu,
  tokenami wejścia/wyjścia ostatniej odpowiedzi oraz **szacowanym kosztem** (tylko klucz API).
- `/usage off|tokens|full` → dołącza **stopkę użycia dla każdej odpowiedzi** do każdej odpowiedzi.
  - Jest utrwalane per sesja (zapisane jako `responseUsage`).
  - Uwierzytelnianie OAuth **ukrywa koszt** (pokazuje tylko tokeny).
- `/usage cost` → pokazuje lokalne podsumowanie kosztów z logów sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** obsługiwane są `/status` i `/usage`.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawców (`X% left`, a nie koszty dla pojedynczych odpowiedzi).
  Aktualni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują przed wyświetleniem typowe aliasy pól natywnych dla dostawców.
Dla ruchu OpenAI-family Responses obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, dzięki czemu nazwy pól specyficzne dla transportu
nie zmieniają `/status`, `/usage` ani podsumowań sesji.
Użycie JSON Gemini CLI również jest normalizowane: tekst odpowiedzi pochodzi z `response`, a
`stats.cached` jest mapowane na `cacheRead`, przy czym używane jest `stats.input_tokens - stats.cached`,
gdy CLI pomija jawne pole `stats.input`.
Dla natywnego ruchu OpenAI-family Responses aliasy użycia WebSocket/SSE są
normalizowane w ten sam sposób, a sumy całkowite przechodzą na znormalizowane wejście + wyjście, gdy
`total_tokens` nie istnieje lub wynosi `0`.
Gdy bieżący snapshot sesji jest ubogi, `/status` i `session_status` mogą
również odzyskać liczniki tokenów/cache oraz etykietę aktywnego modelu runtime z
najnowszego logu użycia transkryptu. Istniejące niezerowe wartości live nadal mają
priorytet nad wartościami awaryjnymi z transkryptu, a większe sumy transkryptu zorientowane na prompt
mogą wygrać, gdy zapisane sumy nie istnieją albo są mniejsze.
Uwierzytelnianie użycia dla okien limitów dostawców pochodzi z hooków specyficznych dla dostawcy, jeśli są dostępne;
w przeciwnym razie OpenClaw wraca do dopasowywania poświadczeń OAuth/klucza API
z profili uwierzytelniania, środowiska lub konfiguracji.

## Szacowanie kosztów (gdy jest pokazywane)

Koszty są szacowane na podstawie konfiguracji cen modelu:

```
models.providers.<provider>.models[].cost
```

Są to wartości **USD za 1M tokenów** dla `input`, `output`, `cacheRead` oraz
`cacheWrite`. Jeśli brak informacji o cenach, OpenClaw pokazuje tylko tokeny. Tokeny OAuth
nigdy nie pokazują kosztu w dolarach.

## Wpływ TTL cache i przycinania

Pamięć podręczna promptów dostawcy działa tylko w obrębie okna TTL cache. OpenClaw może
opcjonalnie uruchamiać **przycinanie cache-ttl**: przycina sesję po wygaśnięciu TTL cache,
a następnie resetuje okno cache, aby kolejne żądania mogły ponownie użyć
świeżo zapisnego w cache kontekstu zamiast ponownie cache'ować pełną historię. Dzięki temu koszty
zapisu cache są niższe, gdy sesja pozostaje bezczynna dłużej niż TTL.

Skonfiguruj to w [Gateway configuration](/pl/gateway/configuration), a szczegóły
działania znajdziesz w [Session pruning](/pl/concepts/session-pruning).

Heartbeat może utrzymywać cache **ciepły** podczas przerw bezczynności. Jeśli TTL cache modelu
wynosi `1h`, ustawienie interwału heartbeat tuż poniżej tej wartości (np. `55m`) może zapobiec
ponownemu cache'owaniu pełnego promptu, zmniejszając koszty zapisu cache.

W konfiguracjach z wieloma agentami możesz utrzymać jedną wspólną konfigurację modelu i dostrajać zachowanie cache
dla każdego agenta przez `agents.list[].params.cacheRetention`.

Pełny przewodnik po wszystkich opcjach znajdziesz w [Prompt Caching](/pl/reference/prompt-caching).

Dla cen API Anthropic odczyty z cache są znacznie tańsze niż tokeny wejściowe,
podczas gdy zapisy cache są rozliczane z wyższym mnożnikiem. Najnowsze stawki i mnożniki TTL znajdziesz w cenniku prompt caching Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Przykład: utrzymanie ciepłego cache 1h za pomocą heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Przykład: mieszany ruch ze strategią cache per agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # domyślna baza dla większości agentów
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # utrzymuj długi cache ciepły dla głębokich sesji
    - id: "alerts"
      params:
        cacheRetention: "none" # unikaj zapisów cache dla skokowych powiadomień
```

`agents.list[].params` scala się na wierzchu `params` wybranego modelu, więc możesz
nadpisać tylko `cacheRetention` i pozostawić inne domyślne ustawienia modelu bez zmian.

### Przykład: włącz nagłówek beta Anthropic 1M context

Okno kontekstu 1M w Anthropic jest obecnie ograniczone do wersji beta. OpenClaw może wstrzyknąć
wymaganą wartość `anthropic-beta`, gdy włączysz `context1m` w obsługiwanych modelach Opus
lub Sonnet.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

To mapuje się na nagłówek beta Anthropic `context-1m-2025-08-07`.

Dotyczy to tylko sytuacji, gdy `context1m: true` jest ustawione dla wpisu tego modelu.

Wymaganie: poświadczenie musi kwalifikować się do użycia długiego kontekstu. W przeciwnym razie
Anthropic odpowiada dla tego żądania błędem limitu szybkości po stronie dostawcy.

Jeśli uwierzytelniasz Anthropic tokenami OAuth/subskrypcyjnymi (`sk-ant-oat-*`),
OpenClaw pomija nagłówek beta `context-1m-*`, ponieważ Anthropic obecnie
odrzuca to połączenie z HTTP 401.

## Wskazówki dotyczące zmniejszania presji tokenów

- Użyj `/compact`, aby podsumować długie sesje.
- Ogranicz duże wyjścia narzędzi w swoich workflow.
- Obniż `agents.defaults.imageMaxDimensionPx` dla sesji z dużą liczbą zrzutów ekranu.
- Zachowuj krótkie opisy Skills (lista Skills jest wstrzykiwana do promptu).
- Do rozwlekłej, eksploracyjnej pracy preferuj mniejsze modele.

Dokładny wzór narzutu listy Skills znajdziesz w [Skills](/pl/tools/skills).
