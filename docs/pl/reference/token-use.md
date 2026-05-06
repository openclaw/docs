---
read_when:
    - Objaśnianie użycia tokenów, kosztów lub okien kontekstu
    - Debugowanie rozrostu kontekstu lub zachowania Compaction
summary: Jak OpenClaw tworzy kontekst polecenia i raportuje użycie tokenów oraz koszty
title: Użycie tokenów i koszty
x-i18n:
    generated_at: "2026-05-06T09:29:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw śledzi **tokeny**, nie znaki. Tokeny są zależne od modelu, ale większość
modeli w stylu OpenAI ma średnio około 4 znaków na token w tekście angielskim.

## Jak budowany jest system prompt

OpenClaw składa własny system prompt przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi + krótkie opisy
- Listę Skills (tylko metadane; instrukcje są ładowane na żądanie za pomocą `read`).
  Kompaktowy blok Skills jest ograniczony przez `skills.limits.maxSkillsPromptChars`,
  z opcjonalnym nadpisaniem dla agenta w
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrukcje samodzielnej aktualizacji
- Pliki workspace i bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, gdy są nowe, oraz `MEMORY.md`, gdy istnieje). Główny plik `memory.md` zapisany małymi literami nie jest wstrzykiwany; jest starszym wejściem naprawczym dla `openclaw doctor --fix`, gdy występuje razem z `MEMORY.md`. Duże pliki są obcinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 12000), a całkowite wstrzyknięcie bootstrap jest ograniczone przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). Dzienne pliki `memory/*.md` nie są częścią zwykłego promptu bootstrap; pozostają dostępne na żądanie przez narzędzia pamięci w zwykłych turach, ale uruchomienia modelu reset/startup mogą dodać na początku jednorazowy blok kontekstu startowego z najnowszą dzienną pamięcią dla tej pierwszej tury. Same polecenia czatu `/new` i `/reset` są potwierdzane bez wywoływania modelu. Preambułą startową steruje `agents.defaults.startupContext`.
- Czas (UTC + strefa czasowa użytkownika)
- Tagi odpowiedzi + zachowanie Heartbeat
- Metadane środowiska uruchomieniowego (host/OS/model/thinking)

Pełne omówienie znajduje się w [System Prompt](/pl/concepts/system-prompt).

## Co wlicza się do okna kontekstu

Wszystko, co otrzymuje model, wlicza się do limitu kontekstu:

- System prompt (wszystkie sekcje wymienione powyżej)
- Historia rozmowy (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypcje (obrazy, audio, pliki)
- Podsumowania Compaction i artefakty przycinania
- Otoczki dostawcy lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

Niektóre powierzchnie mocno obciążające środowisko uruchomieniowe mają własne jawne limity:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Nadpisania dla agentów znajdują się w `agents.list[].contextLimits`. Te ustawienia służą
do ograniczonych wycinków środowiska uruchomieniowego i wstrzykiwanych bloków należących do środowiska uruchomieniowego. Są
oddzielne od limitów bootstrap, limitów kontekstu startowego i limitów promptu
Skills.

W przypadku obrazów OpenClaw zmniejsza ładunki obrazów transkrypcji/narzędzi przed wywołaniami dostawcy.
Użyj `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`), aby to dostroić:

- Niższe wartości zwykle zmniejszają użycie tokenów wizyjnych i rozmiar ładunku.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla zrzutów ekranu z dużą ilością OCR/UI.

Aby uzyskać praktyczny podział (według wstrzykiwanego pliku, narzędzi, Skills i rozmiaru system promptu), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Jak sprawdzić bieżące użycie tokenów

Użyj tych poleceń na czacie:

- `/status` → **bogata w emoji karta statusu** z modelem sesji, użyciem kontekstu,
  tokenami wejścia/wyjścia ostatniej odpowiedzi oraz **szacowanym kosztem** (tylko klucz API).
- `/usage off|tokens|full` → dodaje **stopkę użycia dla każdej odpowiedzi** do każdej odpowiedzi.
  - Utrzymuje się w obrębie sesji (przechowywane jako `responseUsage`).
  - Uwierzytelnianie OAuth **ukrywa koszt** (tylko tokeny).
- `/usage cost` → pokazuje lokalne podsumowanie kosztów z logów sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** `/status` + `/usage` są obsługiwane.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawcy (`X% left`, nie koszty pojedynczej odpowiedzi).
  Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują typowe natywne aliasy pól dostawców przed wyświetleniem.
Dla ruchu Responses z rodziny OpenAI obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, więc nazwy pól specyficzne
dla transportu nie zmieniają `/status`, `/usage` ani podsumowań sesji.
Użycie JSON Gemini CLI także jest normalizowane: tekst odpowiedzi pochodzi z `response`, a
`stats.cached` mapuje się na `cacheRead`, przy czym `stats.input_tokens - stats.cached`
jest używane, gdy CLI pomija jawne pole `stats.input`.
Dla natywnego ruchu Responses z rodziny OpenAI aliasy użycia WebSocket/SSE są
normalizowane w ten sam sposób, a sumy wracają do znormalizowanego wejścia + wyjścia, gdy
brakuje `total_tokens` albo wynosi ono `0`.
Gdy bieżąca migawka sesji jest skąpa, `/status` i `session_status` mogą
również odzyskać liczniki tokenów/pamięci podręcznej oraz etykietę aktywnego modelu środowiska uruchomieniowego z
najnowszego logu użycia transkrypcji. Istniejące niezerowe wartości bieżące nadal mają
pierwszeństwo przed wartościami zapasowymi z transkrypcji, a większe sumy transkrypcji zorientowane na prompt
mogą wygrać, gdy zapisane sumy nie istnieją albo są mniejsze.
Uwierzytelnianie użycia dla okien limitów dostawcy pochodzi z haków specyficznych dla dostawcy, gdy
są dostępne; w przeciwnym razie OpenClaw wraca do pasujących poświadczeń OAuth/klucza API
z profili uwierzytelniania, env lub konfiguracji.
Wpisy transkrypcji asystenta utrwalają ten sam znormalizowany kształt użycia, w tym
`usage.cost`, gdy aktywny model ma skonfigurowane ceny, a dostawca
zwraca metadane użycia. Daje to `/usage cost` i statusowi sesji opartemu na transkrypcji
stabilne źródło nawet po zniknięciu bieżącego stanu środowiska uruchomieniowego.

OpenClaw utrzymuje rozliczanie użycia dostawcy oddzielnie od bieżącej migawki
kontekstu. `usage.total` dostawcy może obejmować wejście z pamięci podręcznej, wyjście i wiele
wywołań modelu w pętli narzędzi, więc jest użyteczne dla kosztów i telemetrii, ale może zawyżać
bieżące okno kontekstu. Wyświetlanie kontekstu i diagnostyka używają najnowszej migawki promptu
(`promptTokens` albo ostatniego wywołania modelu, gdy migawka promptu nie jest
dostępna) dla `context.used`.

## Szacowanie kosztów (gdy jest pokazywane)

Koszty są szacowane na podstawie konfiguracji cen modelu:

```
models.providers.<provider>.models[].cost
```

Są to **USD za 1 mln tokenów** dla `input`, `output`, `cacheRead` i
`cacheWrite`. Jeśli brakuje cen, OpenClaw pokazuje tylko tokeny. Tokeny OAuth
nigdy nie pokazują kosztu w dolarach.

Gdy sidecary i kanały osiągną ścieżkę gotowości Gateway, OpenClaw uruchamia
opcjonalny bootstrap cen w tle dla skonfigurowanych referencji modeli, które
nie mają jeszcze lokalnych cen. Ten bootstrap pobiera zdalne katalogi cen OpenRouter i LiteLLM.
Ustaw `models.pricing.enabled: false`, aby pominąć te pobrania katalogów
w sieciach offline lub z ograniczeniami; jawne wpisy
`models.providers.*.models[].cost` nadal sterują lokalnymi szacunkami kosztów.

## TTL pamięci podręcznej i wpływ przycinania

Buforowanie promptu przez dostawcę działa tylko w oknie TTL pamięci podręcznej. OpenClaw może
opcjonalnie uruchamiać **przycinanie cache-ttl**: przycina sesję po wygaśnięciu TTL pamięci podręcznej,
a następnie resetuje okno pamięci podręcznej, aby kolejne żądania mogły ponownie użyć
świeżo zbuforowanego kontekstu zamiast ponownie buforować całą historię. Utrzymuje to niższe
koszty zapisów do pamięci podręcznej, gdy sesja pozostaje bezczynna dłużej niż TTL.

Skonfiguruj to w [konfiguracji Gateway](/pl/gateway/configuration) i zobacz
szczegóły zachowania w [Przycinaniu sesji](/pl/concepts/session-pruning).

Heartbeat może utrzymywać pamięć podręczną **ciepłą** podczas przerw bezczynności. Jeśli TTL pamięci podręcznej modelu
wynosi `1h`, ustawienie interwału Heartbeat tuż poniżej tej wartości (np. `55m`) może uniknąć
ponownego buforowania pełnego promptu, zmniejszając koszty zapisów do pamięci podręcznej.

W konfiguracjach wieloagentowych możesz zachować jedną wspólną konfigurację modelu i dostrajać zachowanie pamięci podręcznej
dla każdego agenta za pomocą `agents.list[].params.cacheRetention`.

Pełny przewodnik po każdym ustawieniu znajduje się w [Buforowaniu promptu](/pl/reference/prompt-caching).

W przypadku cen Anthropic API odczyty z pamięci podręcznej są znacznie tańsze niż tokeny
wejściowe, natomiast zapisy do pamięci podręcznej są rozliczane z wyższym mnożnikiem. Najnowsze stawki i mnożniki TTL znajdziesz w cenniku buforowania promptu Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Przykład: utrzymanie ciepłej pamięci podręcznej 1h za pomocą Heartbeat

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

### Przykład: mieszany ruch ze strategią pamięci podręcznej dla każdego agenta

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
nadpisać tylko `cacheRetention` i odziedziczyć pozostałe ustawienia domyślne modelu bez zmian.

### Przykład: włączenie nagłówka beta kontekstu Anthropic 1M

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

Ma to zastosowanie tylko wtedy, gdy `context1m: true` jest ustawione w tym wpisie modelu.

Wymaganie: poświadczenie musi kwalifikować się do użycia długiego kontekstu. Jeśli nie,
Anthropic odpowiada błędem limitu szybkości po stronie dostawcy dla tego żądania.

Jeśli uwierzytelniasz Anthropic za pomocą tokenów OAuth/subskrypcji (`sk-ant-oat-*`),
OpenClaw pomija nagłówek beta `context-1m-*`, ponieważ Anthropic obecnie
odrzuca tę kombinację z HTTP 401.

## Wskazówki dotyczące zmniejszania presji tokenów

- Użyj `/compact`, aby podsumować długie sesje.
- Przycinaj duże wyniki narzędzi w swoich przepływach pracy.
- Obniż `agents.defaults.imageMaxDimensionPx` dla sesji z dużą liczbą zrzutów ekranu.
- Opisy Skills powinny być krótkie (lista Skills jest wstrzykiwana do promptu).
- Preferuj mniejsze modele do rozwlekłej, eksploracyjnej pracy.

Zobacz [Skills](/pl/tools/skills), aby poznać dokładny wzór narzutu listy Skills.

## Powiązane

- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie promptu](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
