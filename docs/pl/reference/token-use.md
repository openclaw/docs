---
read_when:
    - Wyjaśnianie użycia tokenów, kosztów lub okien kontekstu
    - Debugowanie narastania kontekstu lub działania Compaction
summary: Jak OpenClaw buduje kontekst promptu oraz raportuje użycie tokenów i koszty
title: Użycie tokenów i koszty
x-i18n:
    generated_at: "2026-04-24T09:32:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Użycie tokenów i koszty

OpenClaw śledzi **tokeny**, a nie znaki. Tokeny są zależne od modelu, ale większość
modeli w stylu OpenAI ma średnio około 4 znaki na token dla tekstu angielskiego.

## Jak budowany jest prompt systemowy

OpenClaw składa własny prompt systemowy przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi + krótkie opisy
- Listę Skills (tylko metadane; instrukcje są ładowane na żądanie przez `read`).
  Zwarty blok Skills jest ograniczony przez `skills.limits.maxSkillsPromptChars`,
  z opcjonalnym nadpisaniem dla agenta w
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrukcje samodzielnej aktualizacji
- Pliki obszaru roboczego + bootstrapu (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` gdy są nowe, oraz `MEMORY.md` gdy występuje). Małe litery w głównym katalogu w `memory.md` nie są wstrzykiwane; to starsze wejście naprawcze dla `openclaw doctor --fix`, gdy występuje razem z `MEMORY.md`. Duże pliki są obcinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 12000), a całkowite wstrzyknięcie bootstrapu jest ograniczone przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). Dzienne pliki `memory/*.md` nie są częścią zwykłego promptu bootstrapu; pozostają dostępne na żądanie przez narzędzia pamięci w zwykłych turach, ale samo `/new` i `/reset` mogą poprzedzić pierwszą turę jednorazowym blokiem kontekstu startowego z ostatnią pamięcią dzienną. Ten preambuł startowy jest kontrolowany przez `agents.defaults.startupContext`.
- Czas (UTC + strefa czasowa użytkownika)
- Tagi odpowiedzi + zachowanie Heartbeat
- Metadane środowiska uruchomieniowego (host/OS/model/thinking)

Pełny opis znajdziesz w [System Prompt](/pl/concepts/system-prompt).

## Co wlicza się do okna kontekstu

Wszystko, co otrzymuje model, wlicza się do limitu kontekstu:

- Prompt systemowy (wszystkie sekcje wymienione powyżej)
- Historia rozmowy (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypcje (obrazy, audio, pliki)
- Podsumowania Compaction i artefakty przycinania
- Opakowania dostawcy lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

Niektóre powierzchnie intensywnie używające środowiska uruchomieniowego mają własne jawne limity:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Nadpisania dla poszczególnych agentów znajdują się w `agents.list[].contextLimits`. Te ustawienia
dotyczą ograniczonych fragmentów środowiska uruchomieniowego i wstrzykiwanych bloków należących do środowiska.
Są one oddzielne od limitów bootstrapu, limitów kontekstu startowego i limitów promptu Skills.

W przypadku obrazów OpenClaw skaluje w dół ładunki obrazów z transkrypcji/narzędzi przed wywołaniami dostawcy.
Do strojenia tego służy `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`):

- Niższe wartości zwykle zmniejszają zużycie tokenów wizji i rozmiar ładunku.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla zrzutów ekranu z dużym udziałem OCR/interfejsu.

Aby zobaczyć praktyczny rozkład (dla każdego wstrzykniętego pliku, narzędzi, Skills i rozmiaru promptu systemowego), użyj `/context list` lub `/context detail`. Zobacz [Context](/pl/concepts/context).

## Jak sprawdzić bieżące użycie tokenów

Użyj tych poleceń na czacie:

- `/status` → **karta statusu bogata w emoji** z modelem sesji, użyciem kontekstu,
  tokenami wejścia/wyjścia z ostatniej odpowiedzi oraz **szacowanym kosztem** (tylko klucz API).
- `/usage off|tokens|full` → dodaje **stopkę użycia dla każdej odpowiedzi** do każdej wiadomości.
  - Utrzymuje się w obrębie sesji (zapisywane jako `responseUsage`).
  - Uwierzytelnianie OAuth **ukrywa koszt** (tylko tokeny).
- `/usage cost` → pokazuje lokalne podsumowanie kosztów z logów sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** obsługiwane są `/status` + `/usage`.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawców (`X% left`, a nie koszt dla każdej odpowiedzi).
  Dostawcy z bieżącymi oknami użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują przed wyświetleniem typowe aliasy pól właściwe dla dostawców.
Dla ruchu OpenAI-family Responses obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, więc nazwy pól
specyficzne dla transportu nie zmieniają `/status`, `/usage` ani podsumowań sesji.
Użycie JSON z Gemini CLI także jest normalizowane: tekst odpowiedzi pochodzi z `response`, a
`stats.cached` jest mapowane na `cacheRead`, przy czym używane jest `stats.input_tokens - stats.cached`,
gdy CLI pomija jawne pole `stats.input`.
Dla natywnego ruchu OpenAI-family Responses aliasy użycia z WebSocket/SSE są
normalizowane w ten sam sposób, a wartości całkowite są wyliczane awaryjnie jako znormalizowane wejście + wyjście, gdy
`total_tokens` nie występuje lub ma wartość `0`.
Gdy bieżąca migawka sesji jest uboga, `/status` i `session_status` mogą
także odzyskać liczniki tokenów/cache oraz etykietę aktywnego modelu środowiska uruchomieniowego z
najnowszego logu użycia transkrypcji. Istniejące niezerowe wartości na żywo nadal mają
pierwszeństwo przed wartościami awaryjnymi z transkrypcji, a większe sumy zorientowane na prompt
z transkrypcji mogą wygrać, gdy zapisane sumy nie istnieją lub są mniejsze.
Uwierzytelnianie użycia dla okien limitów dostawców pochodzi z haków specyficznych dla dostawców, gdy są dostępne;
w przeciwnym razie OpenClaw awaryjnie dopasowuje poświadczenia OAuth/klucza API
z profili uwierzytelniania, zmiennych środowiskowych lub konfiguracji.
Wpisy transkrypcji asystenta utrwalają ten sam znormalizowany kształt użycia, w tym
`usage.cost`, gdy aktywny model ma skonfigurowane ceny, a dostawca zwraca metadane użycia.
Dzięki temu `/usage cost` i status sesji oparty na transkrypcji mają stabilne źródło nawet po zniknięciu stanu aktywnego środowiska uruchomieniowego.

## Szacowanie kosztów (jeśli jest pokazywane)

Koszty są szacowane na podstawie konfiguracji cen modelu:

```
models.providers.<provider>.models[].cost
```

Są to wartości w **USD za 1M tokenów** dla `input`, `output`, `cacheRead` i
`cacheWrite`. Jeśli ceny nie są dostępne, OpenClaw pokazuje tylko tokeny. Tokeny OAuth
nigdy nie pokazują kosztu w dolarach.

## Wpływ TTL cache i przycinania

Cache promptów dostawcy działa tylko w obrębie okna TTL cache. OpenClaw może
opcjonalnie uruchamiać **przycinanie cache-ttl**: przycina sesję po wygaśnięciu TTL cache,
a następnie resetuje okno cache, aby kolejne żądania mogły ponownie używać
świeżo zbuforowanego kontekstu zamiast buforować całą historię od nowa. Dzięki temu koszt zapisu do cache
pozostaje niższy, gdy sesja pozostaje bezczynna dłużej niż TTL.

Skonfiguruj to w [Gateway configuration](/pl/gateway/configuration), a szczegóły działania znajdziesz w [Session pruning](/pl/concepts/session-pruning).

Heartbeat może utrzymywać cache **ciepły** w przerwach bezczynności. Jeśli TTL cache modelu
wynosi `1h`, ustawienie interwału Heartbeat tuż poniżej tej wartości (np. `55m`) może zapobiec
ponownemu buforowaniu całego promptu, zmniejszając koszty zapisu do cache.

W konfiguracjach wieloagentowych możesz zachować jedną współdzieloną konfigurację modelu i dostrajać zachowanie cache
dla każdego agenta przez `agents.list[].params.cacheRetention`.

Pełny przewodnik po wszystkich ustawieniach znajdziesz w [Prompt Caching](/pl/reference/prompt-caching).

W przypadku cennika Anthropic API odczyty z cache są znacznie tańsze niż tokeny wejściowe,
natomiast zapisy do cache są rozliczane z wyższym mnożnikiem. Aktualne stawki i mnożniki TTL znajdziesz w cenniku prompt caching Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Przykład: utrzymanie 1h cache w stanie ciepłym za pomocą Heartbeat

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

### Przykład: ruch mieszany ze strategią cache dla poszczególnych agentów

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
        every: "55m" # utrzymuj długi cache w stanie ciepłym dla głębokich sesji
    - id: "alerts"
      params:
        cacheRetention: "none" # unikaj zapisów do cache dla skokowych powiadomień
```

`agents.list[].params` jest scalane na wierzch `params` wybranego modelu, więc możesz
nadpisać tylko `cacheRetention` i odziedziczyć pozostałe domyślne ustawienia modelu bez zmian.

### Przykład: włączenie nagłówka beta Anthropic 1M context

Okno kontekstu 1M Anthropic jest obecnie dostępne tylko w wersji beta. OpenClaw może wstrzyknąć
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

Ma to zastosowanie tylko wtedy, gdy `context1m: true` jest ustawione w tym wpisie modelu.

Wymaganie: poświadczenie musi kwalifikować się do użycia długiego kontekstu. W przeciwnym razie
Anthropic odpowie błędem limitu po stronie dostawcy dla tego żądania.

Jeśli uwierzytelniasz Anthropic tokenami OAuth/subscription (`sk-ant-oat-*`),
OpenClaw pomija nagłówek beta `context-1m-*`, ponieważ Anthropic obecnie
odrzuca to połączenie z HTTP 401.

## Wskazówki dotyczące zmniejszania presji tokenów

- Użyj `/compact`, aby podsumować długie sesje.
- Przycinaj duże wyniki narzędzi w swoich przepływach pracy.
- Obniż `agents.defaults.imageMaxDimensionPx` dla sesji z dużą liczbą zrzutów ekranu.
- Utrzymuj krótkie opisy Skills (lista Skills jest wstrzykiwana do promptu).
- Preferuj mniejsze modele do rozwlekłej, eksploracyjnej pracy.

Zobacz [Skills](/pl/tools/skills), aby poznać dokładny wzór narzutu listy Skills.

## Powiązane

- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Prompt caching](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
