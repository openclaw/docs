---
read_when:
    - Wyjaśnianie użycia tokenów, kosztów lub okien kontekstu
    - Debugowanie wzrostu kontekstu lub działania Compaction
summary: Jak OpenClaw buduje kontekst promptu i raportuje użycie tokenów oraz koszty
title: Użycie tokenów i koszty
x-i18n:
    generated_at: "2026-05-02T20:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Użycie tokenów i koszty

OpenClaw śledzi **tokeny**, nie znaki. Tokeny zależą od modelu, ale większość
modeli w stylu OpenAI ma średnio około 4 znaków na token dla tekstu angielskiego.

## Jak budowany jest monit systemowy

OpenClaw składa własny monit systemowy przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi + krótkie opisy
- Listę Skills (tylko metadane; instrukcje są ładowane na żądanie za pomocą `read`).
  Zwarty blok Skills jest ograniczony przez `skills.limits.maxSkillsPromptChars`,
  z opcjonalnym nadpisaniem dla poszczególnych agentów w
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrukcje samoaktualizacji
- Obszar roboczy + pliki bootstrapu (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` gdy jest nowy, plus `MEMORY.md` gdy istnieje). Pisany małymi literami główny `memory.md` nie jest wstrzykiwany; jest starszym wejściem naprawczym dla `openclaw doctor --fix`, gdy występuje razem z `MEMORY.md`. Duże pliki są obcinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 12000), a łączna iniekcja bootstrapu jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). Codzienne pliki `memory/*.md` nie są częścią standardowego monitu bootstrapu; pozostają dostępne na żądanie przez narzędzia pamięci w zwykłych turach, ale uruchomienia modelu po resecie/starcie mogą dodać na początku jednorazowy blok kontekstu startowego z ostatnią codzienną pamięcią dla tej pierwszej tury. Proste polecenia czatu `/new` i `/reset` są potwierdzane bez wywoływania modelu. Wstęp startowy jest kontrolowany przez `agents.defaults.startupContext`.
- Czas (UTC + strefa czasowa użytkownika)
- Tagi odpowiedzi + zachowanie Heartbeat
- Metadane środowiska wykonawczego (host/system operacyjny/model/rozumowanie)

Pełny podział znajdziesz w [Monicie systemowym](/pl/concepts/system-prompt).

## Co wlicza się do okna kontekstu

Wszystko, co otrzymuje model, wlicza się do limitu kontekstu:

- Monit systemowy (wszystkie sekcje wymienione powyżej)
- Historia rozmowy (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypcje (obrazy, dźwięk, pliki)
- Podsumowania Compaction i artefakty przycinania
- Opakowania dostawcy lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

Niektóre powierzchnie obciążające środowisko wykonawcze mają własne jawne limity:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Nadpisania dla poszczególnych agentów znajdują się pod `agents.list[].contextLimits`. Te pokrętła służą
do ograniczonych wycinków środowiska wykonawczego i wstrzykiwanych bloków należących do środowiska wykonawczego. Są
oddzielne od limitów bootstrapu, limitów kontekstu startowego i limitów monitu Skills.

W przypadku obrazów OpenClaw zmniejsza ładunki obrazów transkrypcji/narzędzi przed wywołaniami dostawcy.
Użyj `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`), aby to dostroić:

- Niższe wartości zwykle zmniejszają użycie tokenów wizji i rozmiar ładunku.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla zrzutów ekranu obciążonych OCR/UI.

Aby uzyskać praktyczny podział (według wstrzykniętego pliku, narzędzi, Skills i rozmiaru monitu systemowego), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Jak sprawdzić bieżące użycie tokenów

Użyj tych poleceń na czacie:

- `/status` → **karta statusu z emoji** z modelem sesji, użyciem kontekstu,
  tokenami wejścia/wyjścia ostatniej odpowiedzi i **szacowanym kosztem** (tylko klucz API).
- `/usage off|tokens|full` → dodaje **stopkę użycia dla każdej odpowiedzi** do każdej odpowiedzi.
  - Utrzymuje się w obrębie sesji (przechowywane jako `responseUsage`).
  - Uwierzytelnianie OAuth **ukrywa koszt** (tylko tokeny).
- `/usage cost` → pokazuje lokalne podsumowanie kosztów z dzienników sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** `/status` + `/usage` są obsługiwane.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawcy (`X% left`, nie koszty na odpowiedź).
  Obecni dostawcy z oknem użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują typowe natywne aliasy pól dostawców przed wyświetleniem.
Dla ruchu Responses z rodziny OpenAI obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, więc nazwy pól specyficzne
dla transportu nie zmieniają `/status`, `/usage` ani podsumowań sesji.
Użycie JSON z Gemini CLI również jest normalizowane: tekst odpowiedzi pochodzi z `response`, a
`stats.cached` mapuje się na `cacheRead`, z użyciem `stats.input_tokens - stats.cached`,
gdy CLI pomija jawne pole `stats.input`.
Dla natywnego ruchu Responses z rodziny OpenAI aliasy użycia WebSocket/SSE są
normalizowane w ten sam sposób, a sumy wracają do znormalizowanego wejścia + wyjścia, gdy
brakuje `total_tokens` lub wynosi `0`.
Gdy bieżąca migawka sesji jest skąpa, `/status` i `session_status` mogą
również odzyskać liczniki tokenów/pamięci podręcznej oraz etykietę aktywnego modelu środowiska wykonawczego z
najnowszego dziennika użycia transkrypcji. Istniejące niezerowe wartości na żywo nadal mają
pierwszeństwo przed wartościami awaryjnymi z transkrypcji, a większe, zorientowane na monit
sumy transkrypcji mogą wygrać, gdy przechowywanych sum brakuje lub są mniejsze.
Uwierzytelnianie użycia dla okien limitów dostawcy pochodzi z haków specyficznych dla dostawcy, gdy
są dostępne; w przeciwnym razie OpenClaw wraca do dopasowanych poświadczeń OAuth/klucza API
z profili uwierzytelniania, środowiska lub konfiguracji.
Wpisy transkrypcji asystenta utrwalają ten sam znormalizowany kształt użycia, w tym
`usage.cost`, gdy aktywny model ma skonfigurowane ceny, a dostawca
zwraca metadane użycia. Daje to `/usage cost` i statusowi sesji opartemu na transkrypcji
stabilne źródło nawet po zniknięciu stanu środowiska wykonawczego na żywo.

OpenClaw utrzymuje rozliczanie użycia dostawcy oddzielnie od bieżącej migawki kontekstu.
`usage.total` dostawcy może obejmować wejście z pamięci podręcznej, wyjście i wiele
wywołań modelu w pętli narzędzi, więc jest przydatne do kosztów i telemetrii, ale może zawyżać
bieżące okno kontekstu. Wyświetlacze kontekstu i diagnostyka używają najnowszej migawki monitu
(`promptTokens` lub ostatniego wywołania modelu, gdy migawka monitu nie jest
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
opcjonalny bootstrap cen w tle dla skonfigurowanych odwołań do modeli, które nie mają
jeszcze lokalnych cen. Ten bootstrap pobiera zdalne katalogi cen OpenRouter i LiteLLM.
Ustaw `models.pricing.enabled: false`, aby pominąć pobieranie tych katalogów
w sieciach offline lub ograniczonych; jawne wpisy
`models.providers.*.models[].cost` nadal sterują lokalnymi szacunkami kosztów.

## TTL pamięci podręcznej i wpływ przycinania

Buforowanie monitu przez dostawcę ma zastosowanie tylko w obrębie okna TTL pamięci podręcznej. OpenClaw może
opcjonalnie uruchamiać **przycinanie cache-ttl**: przycina sesję po wygaśnięciu TTL pamięci podręcznej,
a następnie resetuje okno pamięci podręcznej, aby kolejne żądania mogły ponownie użyć
świeżo zbuforowanego kontekstu zamiast ponownie buforować pełną historię. Utrzymuje to niższe
koszty zapisu do pamięci podręcznej, gdy sesja pozostaje bezczynna po TTL.

Skonfiguruj to w [konfiguracji Gateway](/pl/gateway/configuration) i zobacz
szczegóły zachowania w [Przycinaniu sesji](/pl/concepts/session-pruning).

Heartbeat może utrzymywać pamięć podręczną **ciepłą** przez przerwy bezczynności. Jeśli TTL pamięci podręcznej modelu
wynosi `1h`, ustawienie interwału heartbeat tuż poniżej tej wartości (np. `55m`) może uniknąć
ponownego buforowania pełnego monitu, zmniejszając koszty zapisu do pamięci podręcznej.

W konfiguracjach wieloagentowych możesz utrzymać jedną współdzieloną konfigurację modelu i dostroić zachowanie pamięci podręcznej
dla każdego agenta za pomocą `agents.list[].params.cacheRetention`.

Pełny przewodnik po każdym pokrętle znajdziesz w [Buforowaniu monitu](/pl/reference/prompt-caching).

W przypadku cen API Anthropic odczyty z pamięci podręcznej są znacznie tańsze niż tokeny
wejściowe, a zapisy do pamięci podręcznej są rozliczane według wyższego mnożnika. Najnowsze stawki i mnożniki TTL znajdziesz w cenniku buforowania monitów Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Przykład: utrzymanie ciepłej pamięci podręcznej 1h za pomocą heartbeat

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

### Przykład: ruch mieszany ze strategią pamięci podręcznej dla każdego agenta

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

`agents.list[].params` jest scalane na wierzchu `params` wybranego modelu, więc możesz
nadpisać tylko `cacheRetention` i odziedziczyć pozostałe domyślne ustawienia modelu bez zmian.

### Przykład: włączenie nagłówka beta kontekstu 1M Anthropic

Okno kontekstu 1M Anthropic jest obecnie chronione wersją beta. OpenClaw może wstrzyknąć
wymaganą wartość `anthropic-beta`, gdy włączysz `context1m` na obsługiwanych modelach Opus
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
- Utrzymuj opisy Skills krótkie (lista Skills jest wstrzykiwana do monitu).
- Preferuj mniejsze modele do gadatliwej, eksploracyjnej pracy.

Dokładny wzór narzutu listy Skills znajdziesz w [Skills](/pl/tools/skills).

## Powiązane

- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie monitu](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
