---
read_when:
    - Wyjaśnianie użycia tokenów, kosztów lub okien kontekstu
    - Debugowanie wzrostu kontekstu lub zachowania Compaction
summary: Jak OpenClaw buduje kontekst promptu i raportuje użycie tokenów oraz koszty
title: Wykorzystanie tokenów i koszty
x-i18n:
    generated_at: "2026-04-30T10:17:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Użycie tokenów i koszty

OpenClaw śledzi **tokeny**, nie znaki. Tokeny zależą od modelu, ale większość
modeli w stylu OpenAI ma średnio ok. 4 znaki na token dla tekstu angielskiego.

## Jak budowany jest prompt systemowy

OpenClaw składa własny prompt systemowy przy każdym uruchomieniu. Obejmuje on:

- Lista narzędzi + krótkie opisy
- Lista Skills (tylko metadane; instrukcje są ładowane na żądanie za pomocą `read`).
  Kompaktowy blok Skills jest ograniczony przez `skills.limits.maxSkillsPromptChars`,
  z opcjonalnym nadpisaniem dla agenta w
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrukcje samoaktualizacji
- Pliki obszaru roboczego + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` gdy są nowe, oraz `MEMORY.md` gdy istnieje). Plik główny zapisany małymi literami `memory.md` nie jest wstrzykiwany; jest to starsze wejście naprawcze dla `openclaw doctor --fix`, gdy występuje razem z `MEMORY.md`. Duże pliki są obcinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 12000), a łączna iniekcja bootstrap jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). Dzienne pliki `memory/*.md` nie są częścią zwykłego promptu bootstrap; w zwykłych turach pozostają dostępne na żądanie przez narzędzia pamięci, ale uruchomienia modelu reset/startup mogą poprzedzić pierwszą turę jednorazowym blokiem kontekstu startowego z ostatnią dzienną pamięcią. Same polecenia czatu `/new` i `/reset` są potwierdzane bez wywoływania modelu. Wstęp startowy jest kontrolowany przez `agents.defaults.startupContext`.
- Czas (UTC + strefa czasowa użytkownika)
- Tagi odpowiedzi + zachowanie Heartbeat
- Metadane środowiska uruchomieniowego (host/OS/model/myślenie)

Pełne rozbicie znajdziesz w [Prompt systemowy](/pl/concepts/system-prompt).

## Co wlicza się do okna kontekstu

Wszystko, co otrzymuje model, wlicza się do limitu kontekstu:

- Prompt systemowy (wszystkie sekcje wymienione powyżej)
- Historia konwersacji (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypcje (obrazy, audio, pliki)
- Podsumowania Compaction i artefakty przycinania
- Nakładki dostawcy lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

Niektóre powierzchnie intensywnie używane w czasie działania mają własne jawne limity:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Nadpisania dla agenta znajdują się pod `agents.list[].contextLimits`. Te przełączniki
dotyczą ograniczonych wycinków w czasie działania i bloków wstrzykiwanych przez runtime.
Są oddzielne od limitów bootstrap, limitów kontekstu startowego i limitów promptu Skills.

W przypadku obrazów OpenClaw zmniejsza ładunki obrazów transkrypcji/narzędzi przed wywołaniami dostawcy.
Użyj `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`), aby to dostroić:

- Niższe wartości zwykle zmniejszają użycie tokenów wizyjnych i rozmiar ładunku.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla zrzutów ekranu z dużą ilością OCR/UI.

Aby uzyskać praktyczne rozbicie (według wstrzykniętego pliku, narzędzi, Skills i rozmiaru promptu systemowego), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Jak sprawdzić bieżące użycie tokenów

Użyj tego w czacie:

- `/status` → **karta statusu z wieloma emoji** z modelem sesji, użyciem kontekstu,
  tokenami wejściowymi/wyjściowymi ostatniej odpowiedzi i **szacowanym kosztem** (tylko klucz API).
- `/usage off|tokens|full` → dodaje **stopkę użycia dla każdej odpowiedzi** do każdej odpowiedzi.
  - Utrzymuje się w ramach sesji (przechowywane jako `responseUsage`).
  - Uwierzytelnianie OAuth **ukrywa koszt** (tylko tokeny).
- `/usage cost` → pokazuje lokalne podsumowanie kosztów z logów sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** `/status` + `/usage` są obsługiwane.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawcy (`X% left`, nie koszty dla pojedynczej odpowiedzi).
  Obecni dostawcy z oknem użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują typowe natywne aliasy pól dostawcy przed wyświetleniem.
Dla ruchu Responses z rodziny OpenAI obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, więc nazwy pól
specyficzne dla transportu nie zmieniają `/status`, `/usage` ani podsumowań sesji.
Użycie JSON Gemini CLI również jest normalizowane: tekst odpowiedzi pochodzi z `response`, a
`stats.cached` mapuje się na `cacheRead`, z użyciem `stats.input_tokens - stats.cached`,
gdy CLI pomija jawne pole `stats.input`.
Dla natywnego ruchu Responses z rodziny OpenAI aliasy użycia WebSocket/SSE są
normalizowane tak samo, a sumy wracają do znormalizowanego wejścia + wyjścia, gdy
brakuje `total_tokens` albo wynosi ono `0`.
Gdy bieżąca migawka sesji jest skąpa, `/status` i `session_status` mogą
również odzyskać liczniki tokenów/cache oraz etykietę aktywnego modelu runtime z
najnowszego logu użycia transkrypcji. Istniejące niezerowe wartości live nadal mają
pierwszeństwo przed wartościami zapasowymi z transkrypcji, a większe sumy transkrypcji
zorientowane na prompt mogą wygrać, gdy przechowywanych sum brakuje lub są mniejsze.
Uwierzytelnianie użycia dla okien limitów dostawcy pochodzi z hooków specyficznych
dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do dopasowywania
poświadczeń OAuth/klucza API z profili uwierzytelniania, env lub konfiguracji.
Wpisy transkrypcji asystenta utrwalają ten sam znormalizowany kształt użycia, w tym
`usage.cost`, gdy aktywny model ma skonfigurowane ceny, a dostawca zwraca metadane
użycia. Daje to `/usage cost` i statusowi sesji opartemu na transkrypcji stabilne
źródło nawet po zniknięciu stanu live runtime.

OpenClaw utrzymuje księgowanie użycia dostawcy oddzielnie od bieżącej migawki kontekstu.
`usage.total` dostawcy może obejmować buforowane wejście, wyjście i wiele wywołań
modelu w pętli narzędzi, więc jest przydatne dla kosztów i telemetrii, ale może zawyżać
bieżące okno kontekstu. Wyświetlanie kontekstu i diagnostyka używają najnowszej migawki
promptu (`promptTokens` albo ostatniego wywołania modelu, gdy migawka promptu nie jest
dostępna) dla `context.used`.

## Szacowanie kosztów (gdy jest pokazywane)

Koszty są szacowane na podstawie konfiguracji cen modelu:

```
models.providers.<provider>.models[].cost
```

Są to **USD za 1 mln tokenów** dla `input`, `output`, `cacheRead` i
`cacheWrite`. Jeśli brakuje cen, OpenClaw pokazuje tylko tokeny. Tokeny OAuth
nigdy nie pokazują kosztu w dolarach.

Start Gateway wykonuje też opcjonalny bootstrap cen w tle dla
skonfigurowanych referencji modeli, które nie mają jeszcze lokalnych cen. Ten bootstrap
pobiera zdalne katalogi cen OpenRouter i LiteLLM. Ustaw
`models.pricing.enabled: false`, aby pominąć te startowe pobrania katalogów w sieciach offline
lub ograniczonych; jawne wpisy `models.providers.*.models[].cost`
nadal sterują lokalnymi szacunkami kosztów.

## Wpływ TTL cache i przycinania

Buforowanie promptów przez dostawcę działa tylko w oknie TTL cache. OpenClaw może
opcjonalnie uruchamiać **przycinanie cache-ttl**: przycina sesję po wygaśnięciu TTL
cache, a następnie resetuje okno cache, aby kolejne żądania mogły ponownie użyć
świeżo zbuforowanego kontekstu zamiast ponownie buforować pełną historię. Dzięki temu
koszty zapisu cache pozostają niższe, gdy sesja pozostaje bezczynna dłużej niż TTL.

Skonfiguruj to w [Konfiguracji Gateway](/pl/gateway/configuration) i zobacz
szczegóły zachowania w [Przycinaniu sesji](/pl/concepts/session-pruning).

Heartbeat może utrzymywać cache **ciepły** między okresami bezczynności. Jeśli TTL cache
Twojego modelu wynosi `1h`, ustawienie interwału Heartbeat tuż poniżej tej wartości
(np. `55m`) może uniknąć ponownego buforowania pełnego promptu, zmniejszając koszty zapisu cache.

W konfiguracjach wieloagentowych możesz zachować jedną współdzieloną konfigurację modelu i dostrajać zachowanie cache
dla każdego agenta za pomocą `agents.list[].params.cacheRetention`.

Pełny przewodnik po każdym przełączniku znajdziesz w [Buforowaniu promptów](/pl/reference/prompt-caching).

W przypadku cen API Anthropic odczyty z cache są znacznie tańsze niż tokeny
wejściowe, podczas gdy zapisy cache są rozliczane z wyższym mnożnikiem. Najnowsze stawki
i mnożniki TTL znajdziesz w cenniku buforowania promptów Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Przykład: utrzymuj cache 1h ciepły za pomocą Heartbeat

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

### Przykład: mieszany ruch ze strategią cache dla każdego agenta

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` scala się na wierzchu `params` wybranego modelu, więc możesz
nadpisać tylko `cacheRetention` i odziedziczyć pozostałe wartości domyślne modelu bez zmian.

### Przykład: włącz nagłówek beta kontekstu 1M Anthropic

Okno kontekstu 1M Anthropic jest obecnie objęte bramką beta. OpenClaw może wstrzyknąć
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

Dotyczy to tylko sytuacji, gdy `context1m: true` jest ustawione w tym wpisie modelu.

Wymaganie: poświadczenie musi kwalifikować się do użycia długiego kontekstu. Jeśli nie,
Anthropic odpowie błędem limitu szybkości po stronie dostawcy dla tego żądania.

Jeśli uwierzytelniasz Anthropic za pomocą tokenów OAuth/subskrypcji (`sk-ant-oat-*`),
OpenClaw pomija nagłówek beta `context-1m-*`, ponieważ Anthropic obecnie
odrzuca tę kombinację z HTTP 401.

## Wskazówki dotyczące zmniejszania presji tokenów

- Użyj `/compact`, aby podsumować długie sesje.
- Przycinaj duże wyniki narzędzi w swoich przepływach pracy.
- Obniż `agents.defaults.imageMaxDimensionPx` dla sesji z dużą liczbą zrzutów ekranu.
- Utrzymuj krótkie opisy Skills (lista Skills jest wstrzykiwana do promptu).
- Preferuj mniejsze modele do rozbudowanej, eksploracyjnej pracy.

Dokładną formułę narzutu listy Skills znajdziesz w [Skills](/pl/tools/skills).

## Powiązane

- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie promptów](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
