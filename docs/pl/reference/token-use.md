---
read_when:
    - Wyjaśnianie wykorzystania tokenów, kosztów lub okien kontekstu
    - Debugowanie wzrostu kontekstu lub zachowania Compaction
summary: Jak OpenClaw buduje kontekst promptu i raportuje użycie tokenów oraz koszty
title: Wykorzystanie tokenów i koszty
x-i18n:
    generated_at: "2026-06-27T18:21:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw śledzi **tokeny**, nie znaki. Tokeny zależą od modelu, ale większość
modeli w stylu OpenAI ma średnio ~4 znaki na token dla tekstu angielskiego.

## Jak budowany jest prompt systemowy

OpenClaw składa własny prompt systemowy przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi + krótkie opisy
- Listę Skills (tylko metadane; instrukcje są ładowane na żądanie za pomocą `read`).
  Natywne tury Codex otrzymują zwarty blok Skills jako instrukcje deweloperskie
  współpracy ograniczone do tury; inne środowiska uruchomieniowe otrzymują go
  na normalnej powierzchni promptu. Jest ograniczony przez `skills.limits.maxSkillsPromptChars`,
  z opcjonalnym nadpisaniem dla agenta w `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrukcje samodzielnej aktualizacji
- Pliki obszaru roboczego + bootstrapu (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` gdy nowe, plus `MEMORY.md` gdy obecny). Natywne tury Codex nie wklejają surowego `MEMORY.md` ze skonfigurowanego obszaru roboczego agenta, gdy narzędzia pamięci są dostępne dla tego obszaru; zawierają mały wskaźnik pamięci w instrukcjach deweloperskich współpracy ograniczonych do tury i używają narzędzi pamięci na żądanie. Jeśli narzędzia są wyłączone, wyszukiwanie w pamięci jest niedostępne albo aktywny obszar roboczy różni się od obszaru pamięci agenta, `MEMORY.md` używa normalnej ograniczonej ścieżki kontekstu tury. Główny plik `memory.md` pisany małymi literami nie jest wstrzykiwany; jest starszym wejściem naprawczym dla `openclaw doctor --fix`, gdy występuje razem z `MEMORY.md`. Duże wstrzykiwane pliki są obcinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 20000), a całkowite wstrzyknięcie bootstrapu jest ograniczone przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). Dzienne pliki `memory/*.md` nie są częścią normalnego promptu bootstrapu; pozostają dostępne na żądanie przez narzędzia pamięci w zwykłych turach, ale uruchomienia modelu resetu/startu mogą dołączyć jednorazowy blok kontekstu startowego z ostatnią dzienną pamięcią dla tej pierwszej tury. Proste polecenia czatu `/new` i `/reset` są potwierdzane bez wywoływania modelu. Preambuła startowa jest kontrolowana przez `agents.defaults.startupContext`. Fragmenty AGENTS.md po Compaction są oddzielne i wymagają jawnego włączenia `agents.defaults.compaction.postCompactionSections`.
- Czas (UTC + strefa czasowa użytkownika)
- Tagi odpowiedzi + zachowanie Heartbeat
- Metadane środowiska uruchomieniowego (host/OS/model/myślenie)

Pełny podział znajdziesz w [Prompt systemowy](/pl/concepts/system-prompt).

Dokumentując dane uwierzytelniające lub fragmenty konfiguracji autoryzacji, używaj
[Konwencji placeholderów sekretów](/pl/reference/secret-placeholder-conventions), aby
uniknąć fałszywych alarmów skanera sekretów w zmianach dotyczących tylko dokumentacji.

## Co wlicza się do okna kontekstu

Wszystko, co otrzymuje model, wlicza się do limitu kontekstu:

- Prompt systemowy (wszystkie sekcje wymienione powyżej)
- Historia rozmowy (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypty (obrazy, audio, pliki)
- Podsumowania Compaction i artefakty przycinania
- Opakowania dostawców lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

Niektóre powierzchnie intensywnie używane w środowisku uruchomieniowym mają własne jawne limity:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Nadpisania dla agenta znajdują się pod `agents.list[].contextLimits`. Te ustawienia
służą do ograniczonych fragmentów środowiska uruchomieniowego i wstrzykiwanych bloków
własności środowiska uruchomieniowego. Są oddzielne od limitów bootstrapu,
limitów kontekstu startowego i limitów promptu Skills.

`toolResultMaxChars` to zaawansowany limit górny (do `1000000` znaków). Gdy nie jest ustawiony, OpenClaw wybiera
bieżący limit wyników narzędzi z efektywnego okna kontekstu modelu: `16000` znaków
poniżej 100 tys. tokenów, `32000` znaków przy 100 tys.+ tokenów i `64000` znaków przy 200 tys.+
tokenów, nadal ograniczone przez zabezpieczenie udziału kontekstu środowiska uruchomieniowego.

W przypadku obrazów OpenClaw zmniejsza ładunki obrazów transkryptów/narzędzi przed wywołaniami dostawcy.
Użyj `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`), aby to dostroić:

- Niższe wartości zwykle zmniejszają zużycie tokenów wizyjnych i rozmiar ładunku.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla zrzutów ekranu z dużą ilością OCR/UI.

Praktyczny podział (według wstrzykiwanego pliku, narzędzi, Skills i rozmiaru promptu systemowego) uzyskasz przez `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Jak sprawdzić bieżące użycie tokenów

Użyj tych poleceń w czacie:

- `/status` → **karta statusu z emoji** z modelem sesji, użyciem kontekstu,
  tokenami wejścia/wyjścia ostatniej odpowiedzi oraz **szacowanym kosztem**, gdy lokalne ceny są
  skonfigurowane dla aktywnego modelu.
- `/usage off|tokens|full` → dołącza **stopkę użycia dla każdej odpowiedzi** do każdej odpowiedzi.
  - Utrzymuje się w obrębie sesji (przechowywane jako `responseUsage`).
  - `/usage reset` (aliasy: `inherit`, `clear`, `default`) — czyści nadpisanie sesji,
    aby sesja ponownie odziedziczyła skonfigurowaną wartość domyślną.
  - `/usage full` pokazuje szacowany koszt tylko wtedy, gdy OpenClaw ma metadane użycia i
    lokalne ceny dla aktywnego modelu. W przeciwnym razie pokazuje tylko tokeny.
- `/usage cost` → pokazuje lokalne podsumowanie kosztów z logów sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** `/status` + `/usage` są obsługiwane.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawcy (`X% left`, nie koszty dla pojedynczych odpowiedzi).
  Bieżący dostawcy z oknem użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują typowe natywne aliasy pól dostawcy przed wyświetleniem.
Dla ruchu Responses z rodziny OpenAI obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, więc nazwy pól specyficzne
dla transportu nie zmieniają `/status`, `/usage` ani podsumowań sesji.
Użycie Gemini CLI też jest normalizowane: domyślny parser `stream-json` odczytuje
zdarzenia `message` asystenta, a `stats.cached` mapuje na `cacheRead`, używając
`stats.input_tokens - stats.cached`, gdy CLI pomija jawne pole
`stats.input`. Starsze nadpisania JSON nadal odczytują tekst odpowiedzi z
`response`.
Dla natywnego ruchu Responses z rodziny OpenAI aliasy użycia WebSocket/SSE są
normalizowane w ten sam sposób, a sumy wracają do znormalizowanego wejścia + wyjścia, gdy
brakuje `total_tokens` albo wynosi `0`.
Gdy bieżąca migawka sesji jest niepełna, `/status` i `session_status` mogą
również odtworzyć liczniki tokenów/pamięci podręcznej oraz etykietę aktywnego modelu środowiska uruchomieniowego z
najnowszego logu użycia transkryptu. Istniejące niezerowe wartości bieżące nadal mają
pierwszeństwo przed wartościami awaryjnymi z transkryptu, a większe sumy transkryptu
zorientowane na prompt mogą wygrać, gdy zapisanych sum brakuje lub są mniejsze.
Autoryzacja użycia dla okien limitów dostawcy pochodzi z hooków specyficznych dla dostawcy, gdy
są dostępne; w przeciwnym razie OpenClaw wraca do dopasowywania danych uwierzytelniających OAuth/klucza API
z profili autoryzacji, env lub konfiguracji.
Wpisy transkryptu asystenta utrwalają ten sam znormalizowany kształt użycia, w tym
`usage.cost`, gdy aktywny model ma skonfigurowane ceny, a dostawca
zwraca metadane użycia. Daje to `/usage cost` i statusowi sesji opartemu na transkrypcie
stabilne źródło nawet po zniknięciu bieżącego stanu środowiska uruchomieniowego.

OpenClaw utrzymuje rozliczanie użycia dostawcy oddzielnie od bieżącej
migawki kontekstu. `usage.total` dostawcy może obejmować wejście z pamięci podręcznej, wyjście i wiele
wywołań modelu w pętli narzędzi, więc jest przydatne do kosztów i telemetrii, ale może zawyżać
bieżące okno kontekstu. Wyświetlanie kontekstu i diagnostyka używają najnowszej migawki promptu
(`promptTokens` albo ostatniego wywołania modelu, gdy migawka promptu nie jest
dostępna) dla `context.used`.

## Szacowanie kosztów (gdy jest wyświetlane)

Koszty są szacowane na podstawie konfiguracji cen modelu:

```
models.providers.<provider>.models[].cost
```

Są to **USD za 1 mln tokenów** dla `input`, `output`, `cacheRead` i
`cacheWrite`. Jeśli brakuje cen, OpenClaw pokazuje tylko tokeny. Wyświetlanie kosztów nie jest
ograniczone do autoryzacji kluczem API: dostawcy bez klucza API, tacy jak `aws-sdk`, mogą pokazywać
szacowany koszt, gdy ich skonfigurowany wpis modelu zawiera lokalne ceny, a
dostawca zwraca metadane użycia.

Po osiągnięciu przez sidecary i kanały ścieżki gotowości Gateway OpenClaw uruchamia
opcjonalny bootstrap cen w tle dla skonfigurowanych referencji modeli, które nie mają
jeszcze lokalnych cen. Ten bootstrap pobiera zdalne katalogi cen OpenRouter i LiteLLM.
Ustaw `models.pricing.enabled: false`, aby pominąć te pobrania katalogów
w sieciach offline lub ograniczonych; jawne wpisy
`models.providers.*.models[].cost` nadal sterują lokalnymi
szacunkami kosztów.

## TTL pamięci podręcznej i wpływ przycinania

Buforowanie promptu przez dostawcę ma zastosowanie tylko w oknie TTL pamięci podręcznej. OpenClaw może
opcjonalnie uruchomić **przycinanie TTL pamięci podręcznej**: przycina sesję po wygaśnięciu TTL pamięci podręcznej,
a następnie resetuje okno pamięci podręcznej, aby kolejne żądania mogły ponownie użyć
świeżo zbuforowanego kontekstu zamiast ponownie buforować pełną historię. Utrzymuje to niższe
koszty zapisu do pamięci podręcznej, gdy sesja pozostaje bezczynna po upływie TTL.

Skonfiguruj to w [Konfiguracji Gateway](/pl/gateway/configuration) i zobacz
szczegóły zachowania w [Przycinaniu sesji](/pl/concepts/session-pruning).

Heartbeat może utrzymać pamięć podręczną **ciepłą** między okresami bezczynności. Jeśli TTL pamięci podręcznej modelu
wynosi `1h`, ustawienie interwału heartbeat tuż poniżej tej wartości (np. `55m`) może uniknąć
ponownego buforowania pełnego promptu, zmniejszając koszty zapisu do pamięci podręcznej.

W konfiguracjach wieloagentowych możesz utrzymać jedną wspólną konfigurację modelu i dostrajać zachowanie pamięci podręcznej
dla każdego agenta za pomocą `agents.list[].params.cacheRetention`.

Pełny przewodnik po każdym ustawieniu znajdziesz w [Buforowaniu promptów](/pl/reference/prompt-caching).

W przypadku cen Anthropic API odczyty z pamięci podręcznej są znacząco tańsze niż tokeny
wejściowe, a zapisy do pamięci podręcznej są rozliczane z wyższym mnożnikiem. Najnowsze stawki i mnożniki TTL znajdziesz w cenniku buforowania promptów Anthropic:
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
nadpisać tylko `cacheRetention` i odziedziczyć inne domyślne wartości modelu bez zmian.

### Kontekst Anthropic 1M

OpenClaw rozmiaruje modele Claude 4.x obsługujące GA, takie jak Opus 4.8, Opus 4.7, Opus 4.6 i
Sonnet 4.6, z oknem kontekstu Anthropic 1M. Nie potrzebujesz
`params.context1m: true` dla tych modeli.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Starsze konfiguracje mogą zachować `context1m: true`, ale OpenClaw nie wysyła już
wycofanego nagłówka beta Anthropic `context-1m-2025-08-07` dla tego ustawienia i
nie rozszerza nieobsługiwanych starszych modeli Claude do 1M.

Wymaganie: dane uwierzytelniające muszą kwalifikować się do użycia długiego kontekstu. Jeśli nie,
Anthropic odpowiada błędem limitu szybkości po stronie dostawcy dla tego żądania.

Jeśli uwierzytelniasz Anthropic tokenami OAuth/subskrypcji (`sk-ant-oat-*`),
OpenClaw zachowuje wymagane przez OAuth nagłówki beta Anthropic, usuwając jednocześnie
wycofany nagłówek beta `context-1m-*`, jeśli pozostaje w starszej konfiguracji.

## Wskazówki dotyczące zmniejszania presji tokenów

- Użyj `/compact`, aby podsumować długie sesje.
- Przycinaj duże wyniki narzędzi w swoich przepływach pracy.
- Obniż `agents.defaults.imageMaxDimensionPx` dla sesji z dużą liczbą zrzutów ekranu.
- Utrzymuj krótkie opisy Skills (lista Skills jest wstrzykiwana do promptu).
- Preferuj mniejsze modele do rozwlekłej, eksploracyjnej pracy.

Dokładny wzór narzutu listy Skills znajdziesz w [Skills](/pl/tools/skills).

## Powiązane

- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie promptów](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
